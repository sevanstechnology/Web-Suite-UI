"""Suite-UI: the shared Fluent / Microsoft 365-style shell for Sevans Technology apps.

    from suite_ui import Suite
    suite = Suite(app_id="entranac", app_name="EntraNAC", org_name="Valley Baptist")
    suite.mount(app, templates)        # FastAPI / Starlette: static files + Jinja templates + globals

Then templates `{% extends "suite/shell.html" %}` (admin pages) or `"suite/portal.html"` (user pages).
"""
from __future__ import annotations

import copy
import json
import os
import re
import time
import urllib.request
from importlib import resources
from pathlib import Path
from collections.abc import Mapping
from typing import Any, Iterable

from markupsafe import Markup

from . import palettes
from .palettes import PALETTES, DEFAULT_PALETTE, custom_palette, contrast

__all__ = ["Suite", "palettes", "PALETTES", "DEFAULT_PALETTE", "custom_palette", "contrast", "STATIC_DIR", "TEMPLATE_DIR"]
__version__ = (Path(__file__).with_name("VERSION").read_text().strip() if Path(__file__).with_name("VERSION").exists() else "0.0.0")

STATIC_DIR = Path(str(resources.files(__package__).joinpath("static")))      # contains suite/ (css, js, icons, palettes, brand)
TEMPLATE_DIR = Path(str(resources.files(__package__).joinpath("templates")))  # contains suite/*.html
_BUNDLED_REGISTRY = resources.files(__package__).joinpath("registry/apps.json")


def _env_key(app_id: str) -> str:
    return "SUITE_APP_URL_" + re.sub(r"[^A-Z0-9]", "_", app_id.upper())


class _LiveUI(Mapping):
    """The `ui` template global: always the app's current default colours, even after set_palette()."""

    def __init__(self, suite: "Suite"):
        self._suite = suite

    def __getitem__(self, k: str) -> Any:
        return self._suite.ui()[k]

    def __iter__(self):
        return iter(self._suite.ui())

    def __len__(self) -> int:
        return len(self._suite.ui())


class Suite:
    """One app's view of the suite: who it is, where the shared registry lives and how its shell looks."""

    def __init__(self, app_id: str, app_name: str, *, org_name: str = "", home_url: str = "/",
                 registry: str | os.PathLike | dict | None = None, app_urls: dict[str, str] | None = None,
                 static_url: str = "/static/suite", cookie_domain: str | None = None, help_search: str = "",
                 logos: dict[str, str] | None = None, copilot: bool = True, registry_ttl: int = 300,
                 palette: str = DEFAULT_PALETTE, accent: str = "", top: str = "",
                 user_palettes: bool | Iterable[str] = True, apps_mine_url: str = ""):
        """
        app_id / app_name  this app's id in the registry (highlighted in the launcher) and display name
        org_name           shown next to the logo and in the user menu
        registry           apps.json as a dict, file path or https URL. Default: $SUITE_REGISTRY, else the bundled file
        app_urls           {app id: url} overrides - each deployment knows its own URLs. $SUITE_APP_URL_<ID> also works
        static_url         where the suite static files are served (mount() serves them there)
        cookie_domain      e.g. ".sevans.io" so light/dark follows the user across apps. Default: $SUITE_COOKIE_DOMAIN
        help_search        URL prefix for "Search the help for …" in the top-bar search, e.g. "/help?q="
        logos              {"on-dark": url, "on-light": url, "favicon": url}; defaults to the bundled Valley Baptist files
        copilot            show the Copilot button in the top bar when the registry has suite.copilot_url
        palette / accent / top
                           the app's default colours, chosen by an admin: a palette id, or "custom" with accent
                           (and optionally top) as #rrggbb. Change them later with set_palette().
        user_palettes      let each user pick their own colours in the user menu (saved in their browser and,
                           with cookie_domain, shared across apps). True = every palette plus "custom",
                           False = off (everyone sees the admin's colours), or a list such as ["cobalt", "teal"]
                           ("custom" in the list allows a custom colour)
        apps_mine_url      endpoint that keeps each person's launcher "Your apps" changes on the server
                           (GET / PUT JSON, see suite_ui.apps_mine). Empty = saved in the browser only
        """
        self.app_id, self.app_name, self.org_name, self.home_url = app_id, app_name, org_name, home_url
        self.static = static_url.rstrip("/")
        self.cookie_domain = os.environ.get("SUITE_COOKIE_DOMAIN", "") if cookie_domain is None else cookie_domain
        self.help_search, self.copilot = help_search, copilot
        self._registry_src = registry if registry is not None else os.environ.get("SUITE_REGISTRY") or None
        self.app_urls = dict(app_urls or {})
        self._logos = {"on-dark": f"{self.static}/brand/logo-horizontal-white.png",
                       "on-light": f"{self.static}/brand/logo-horizontal-dark.png",
                       "favicon": f"{self.static}/brand/favicon.png", **(logos or {})}
        self._ttl, self._cache = registry_ttl, (0.0, None)
        self.version = __version__
        self.set_palette(palette, accent, top)
        self.user_palettes = user_palettes
        self.apps_mine_url = apps_mine_url

    # ------------------------------------------------------------------ registry
    def _read(self) -> dict:
        src = self._registry_src
        if isinstance(src, dict):
            return copy.deepcopy(src)
        if src is None:
            return json.loads(_BUNDLED_REGISTRY.read_text(encoding="utf-8"))
        s = str(src)
        if s.startswith(("https://", "http://")):
            req = urllib.request.Request(s, headers={"Accept": "application/json", "User-Agent": f"suite-ui/{__version__}"})
            with urllib.request.urlopen(req, timeout=5) as r:  # noqa: S310 - URL comes from the app's own configuration
                return json.loads(r.read().decode("utf-8"))
        return json.loads(Path(s).read_text(encoding="utf-8"))

    def registry(self) -> dict:
        """The registry with this deployment's URL overrides applied. Cached; a failed refresh keeps the last good copy."""
        t, cached = self._cache
        if cached is not None and time.time() - t < self._ttl:
            return cached
        try:
            reg = self._read()
        except Exception:  # noqa: BLE001 - network or file problem: never break the page over the launcher
            reg = cached if cached is not None else {"groups": []}
        for g in reg.get("groups", []):
            for a in g.get("apps", []):
                url = self.app_urls.get(a["id"]) or os.environ.get(_env_key(a["id"]))
                if url:
                    a["url"] = url
                if a["id"] == self.app_id and not url:
                    a["url"] = self.home_url
        self._cache = (time.time(), reg)
        return reg

    def apps(self, audience: str | None = None, groups: Iterable[str] | None = None) -> list[dict]:
        """Flat list of apps (with their group id/label), for a home page "your apps" grid."""
        out = []
        for g in self.registry().get("groups", []):
            if groups is not None and g["id"] not in groups:
                continue
            for a in g.get("apps", []):
                if a.get("hidden") or (audience and a.get("audience") and audience not in a["audience"]):
                    continue
                out.append({**a, "group": g["id"], "group_label": g["label"], "external": a.get("external", g.get("external", False))})
        return out

    def registry_json(self) -> Markup:
        """Registry for <script type="application/json" id="suite-apps">, safe to embed in HTML."""
        s = json.dumps(self.registry(), separators=(",", ":"))
        return Markup(s.replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026"))

    @property
    def copilot_url(self) -> str:
        return (self.registry().get("suite") or {}).get("copilot_url", "") if self.copilot else ""

    # ------------------------------------------------------------------ look
    def logo(self, name: str) -> str:
        return self._logos[name]

    def set_logos(self, **logos: str) -> None:
        self._logos.update({k.replace("_", "-"): v for k, v in logos.items()})

    def asset(self, path: str) -> str:
        return f"{self.static}/{path.lstrip('/')}?v={__version__}"

    def set_palette(self, key: str = DEFAULT_PALETTE, accent: str = "", top: str = "") -> None:
        """Change the app's default colours (for example after an admin saves sm.palette_form())."""
        self.palette, self.accent, self.top = palettes.normalize(key, accent, top)

    def ui(self, key: str | None = None, accent: str = "", top: str = "") -> dict:
        """Template context `ui`. With no arguments: the app's default colours (see set_palette())."""
        if key is None:
            return palettes.ui(self.palette, self.accent, self.top)
        return palettes.ui(key, accent, top)

    all_palettes = PALETTES
    default_palette = DEFAULT_PALETTE

    def palette_choices(self, override: Any = None) -> str:
        """Value for <html data-suite-palettes>: "all", "none" or a comma list of the palettes users may pick.

        override: the template's `user_palettes` variable, if set (so one page or one user can be locked)."""
        v = self.user_palettes if override is None else override
        if v is True:
            return "all"
        if not v:
            return "none"
        if isinstance(v, str):
            v = [x.strip() for x in v.split(",")]
        keep = [k for k in v if k in PALETTES or k == "custom"]
        return ",".join(keep) or "none"

    # ------------------------------------------------------------------ wiring
    def install_jinja(self, env: Any) -> None:
        """Add the suite templates (as a fallback loader) and the `suite` global to any Jinja2 environment."""
        from jinja2 import ChoiceLoader, FileSystemLoader
        mine = FileSystemLoader(str(TEMPLATE_DIR))
        env.loader = ChoiceLoader([env.loader, mine]) if env.loader else mine
        env.globals["suite"] = self
        env.globals.setdefault("ui", _LiveUI(self))

    def mount(self, app: Any, templates: Any = None) -> None:
        """FastAPI / Starlette: serve the static files at `static_url` and set up Jinja2Templates."""
        from starlette.staticfiles import StaticFiles
        app.mount(self.static, StaticFiles(directory=str(STATIC_DIR / "suite")), name="suite-static")
        if templates is not None:
            self.install_jinja(templates.env)

    def init_flask(self, flask_app: Any) -> None:
        """Flask: serve the static files at `static_url` and set up the Jinja environment."""
        from flask import send_from_directory
        flask_app.add_url_rule(self.static + "/<path:filename>", "suite_static",
                               lambda filename: send_from_directory(str(STATIC_DIR / "suite"), filename))
        self.install_jinja(flask_app.jinja_env)

"""Built-in brands: a palette plus a logo set, so an app can switch its whole identity with one setting.

    from suite_ui import brands
    brands.BRANDS["sevans-technology"]["label"]           # "Sevans Technology"
    brands.logos("valley-baptist", "/static/suite")        # {"on-dark": "/static/suite/brand/...", ...}

Suite(brand="sevans-technology") uses the brand's logos and palette unless logos= / palette= are given.
Add a brand by adding its logo files under static/suite/brand/<id>/ and an entry in static/suite/brands.json.
"""
from __future__ import annotations

import json
from importlib import resources

_DATA = json.loads(resources.files(__package__).joinpath("static/suite/brands.json").read_text(encoding="utf-8"))
BRANDS: dict[str, dict] = _DATA["brands"]
DEFAULT_BRAND: str = _DATA["default"]
LOGO_NAMES = ("on-dark", "on-light", "favicon", "icon")


def get(brand: str) -> dict:
    """The brand, or the default brand for an unknown id."""
    return BRANDS.get(brand) or BRANDS[DEFAULT_BRAND]


def key(brand: str) -> str:
    return brand if brand in BRANDS else DEFAULT_BRAND


def logos(brand: str, static_url: str = "/static/suite") -> dict[str, str]:
    """{"on-dark", "on-light", "favicon", "icon"} URLs of the brand's logo files."""
    base = static_url.rstrip("/")
    return {n: f"{base}/{p}" for n, p in get(brand)["logos"].items()}

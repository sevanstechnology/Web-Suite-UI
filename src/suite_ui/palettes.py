"""Colour palettes and the CSS variables for <html style="--p-..."> (ported from EntraNAC branding.py).

Each palette: label, accent (brand colour), btn (light-mode buttons/links, readable with white text), top (top bar,
dark enough for white text), btn_dark (dark-mode buttons), ink_dark (text on btn_dark), accent2 (highlights).
"""
from __future__ import annotations

import json
import re
from importlib import resources
from typing import Any

_HEX = re.compile(r"^#[0-9a-fA-F]{6}$")


def _load() -> dict:
    data = json.loads(resources.files(__package__).joinpath("static/suite/palettes.json").read_text(encoding="utf-8"))
    return data


_DATA = _load()
PALETTES: dict[str, dict] = _DATA["palettes"]
DEFAULT_PALETTE: str = _DATA["default"]


def is_hex(v: str) -> bool:
    return bool(v and _HEX.match(v))


def _rgb(h: str) -> tuple[float, float, float]:
    return tuple(int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))  # type: ignore[return-value]


def _hex(rgb) -> str:
    return "#" + "".join(f"{max(0, min(255, round(c * 255))):02x}" for c in rgb)


def _lum(h: str) -> float:
    def ch(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(c) for c in _rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a: str, b: str) -> float:
    la, lb = sorted((_lum(a), _lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def mix(h: str, other: str, t: float) -> str:
    a, b = _rgb(h), _rgb(other)
    return _hex(tuple(x + (y - x) * t for x, y in zip(a, b)))


def _until(h: str, toward: str, against: str, need: float) -> str:
    """Move colour h toward black/white until it reaches the contrast `need` against `against`."""
    for i in range(0, 21):
        c = mix(h, toward, i * 0.05)
        if contrast(c, against) >= need:
            return c
    return toward


def custom_palette(accent: str, top: str = "") -> dict:
    """Build an accessible palette (WCAG 4.5:1 for buttons and the top bar) from one brand colour."""
    btn = _until(accent, "#000000", "#ffffff", 4.5)
    btn_dark = _until(accent, "#ffffff", "#1b1a19", 4.5)
    ink_dark = "#ffffff" if contrast(btn_dark, "#ffffff") >= contrast(btn_dark, "#000000") else mix(btn_dark, "#000000", 0.85)
    top = top if is_hex(top) else mix(accent, "#000000", 0.35)
    top = _until(top, "#000000", "#ffffff", 4.5)
    return {"label": "Custom", "accent": accent, "btn": btn, "top": top, "btn_dark": btn_dark, "ink_dark": ink_dark,
            "accent2": mix(accent, "#ffffff", 0.45)}


def normalize(key: str = "", accent: str = "", top: str = "") -> tuple[str, str, str]:
    """Clean up a palette choice: an unknown id becomes the default, "custom" needs a valid #rrggbb accent."""
    accent, top = (accent or "").strip().lower(), (top or "").strip().lower()
    if key == "custom" and is_hex(accent):
        return "custom", accent, top if is_hex(top) else ""
    return (key if key in PALETTES else DEFAULT_PALETTE), "", ""


def encode(key: str = "", accent: str = "", top: str = "") -> str:
    """One string for a palette choice, handy to store in a single setting: "cobalt" or "custom:#00a3d6:#414042".

    suite.js stores the user's own choice in the same format (cookie / localStorage "suite-palette")."""
    key, accent, top = normalize(key, accent, top)
    return f"custom:{accent}:{top}".rstrip(":") if key == "custom" else key


def decode(value: str | None) -> tuple[str, str, str]:
    """The reverse of encode(): (key, accent, top). Anything unreadable gives the default palette."""
    parts = (value or "").strip().split(":")
    return normalize(parts[0], *(parts[1:3] + ["", ""])[:2])


def from_form(form: Any) -> tuple[str, str, str]:
    """(key, accent, top) from a submitted sm.palette_form() - any mapping with .get(): a dict, Starlette or Flask form."""
    return normalize(form.get("palette") or "", form.get("accent") or "", form.get("top") or "")


def ui(key: str = DEFAULT_PALETTE, accent: str = "", top: str = "") -> dict:
    """Template context for <html data-palette="{{ ui.palette }}" style="{{ ui.style }}">.

    key: a palette id from PALETTES, or "custom" with `accent` (and optionally `top`) as #rrggbb.
    """
    given = (accent, top)
    key, accent, top = normalize(key, accent, top)
    p = custom_palette(accent, top) if key == "custom" else PALETTES[key]
    style = (f"--p-accent:{p['accent']};--p-btn:{p['btn']};--p-btn-hover:{mix(p['btn'], '#000000', 0.12)};"
             f"--p-top:{p['top']};--p-btn-dark:{p['btn_dark']};--p-ink-dark:{p['ink_dark']};"
             f"--p-btn-dark-hover:{mix(p['btn_dark'], '#ffffff', 0.12)};--p-accent2:{p['accent2']}")
    return {"palette": key, "style": style, "colors": p, "accent": given[0], "top": given[1], "code": encode(key, accent, top)}

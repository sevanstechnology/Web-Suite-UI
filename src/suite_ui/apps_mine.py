"""Server side of the launcher's "Your apps" customisation (suite.js, data-suite-apps-mine-url).

suite.js sends GET (expects the saved object, or {} when the person never saved one) and PUT with a JSON body
{"hide": [ids], "order": [ids], "add": [{"id", "name", "url", "icon", "color"}]}. Store clean(body) per signed-in
user and return it on GET. Require the user's session for both, and for PUT check the Origin header (or your CSRF
token: suite.js sends <meta name="csrf-token"> as X-CSRF-Token) like any other write.
"""
from __future__ import annotations

import re
from typing import Any

_ID = re.compile(r"^[a-z0-9-]{1,64}$")
_MY_ID = re.compile(r"^my-[a-z0-9]{1,20}$")
_ICON = re.compile(r"^[a-z0-9-]{1,32}$")
_HEX = re.compile(r"^#[0-9a-fA-F]{6}$")
_URL = re.compile(r"^(https?://[^\s\"<>]+|/[^\s\"<>]*)$", re.I)
MAX_IDS, MAX_LINKS = 100, 30


def clean(data: Any) -> dict:
    """A safe copy of a person's choice: unknown keys dropped, ids and links checked, lists capped."""
    data = data if isinstance(data, dict) else {}

    def ids(v):
        out = []
        for x in v if isinstance(v, list) else []:
            if isinstance(x, str) and _ID.match(x) and x not in out:
                out.append(x)
        return out[:MAX_IDS]

    links = []
    for a in data.get("add") if isinstance(data.get("add"), list) else []:
        if not isinstance(a, dict):
            continue
        aid, name, url = a.get("id"), a.get("name"), a.get("url")
        if not (isinstance(aid, str) and _MY_ID.match(aid) and isinstance(name, str) and name.strip()
                and isinstance(url, str) and len(url) <= 500 and _URL.match(url)):
            continue
        icon, color = a.get("icon"), a.get("color")
        links.append({"id": aid, "name": name.strip()[:40], "url": url,
                      "icon": icon if isinstance(icon, str) and _ICON.match(icon) else "globe",
                      "color": color.lower() if isinstance(color, str) and _HEX.match(color) else ""})
    return {"hide": ids(data.get("hide")), "order": ids(data.get("order")), "add": links[:MAX_LINKS]}

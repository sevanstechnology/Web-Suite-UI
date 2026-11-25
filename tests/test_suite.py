import json
from pathlib import Path

import jsonschema
import pytest
from fastapi.testclient import TestClient

from suite_ui import Suite, palettes, contrast, STATIC_DIR
from examples.fastapi.app import app

PKG = Path(__file__).resolve().parents[1] / "src" / "suite_ui"


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


def test_registry_matches_schema():
    reg = json.loads((PKG / "registry/apps.json").read_text())
    schema = json.loads((PKG / "registry/apps.schema.json").read_text())
    jsonschema.validate(reg, schema)
    ids = [a["id"] for g in reg["groups"] for a in g["apps"]]
    assert len(ids) == len(set(ids)), "app ids must be unique"


def test_registry_icons_exist():
    sprite = (STATIC_DIR / "suite/icons.svg").read_text()
    reg = json.loads((PKG / "registry/apps.json").read_text())
    for g in reg["groups"]:
        for a in g["apps"]:
            assert f'id="i-{a["icon"]}"' in sprite, a["icon"]


def test_palettes_are_accessible():
    # Valley Baptist uses the church website's exact blue (#00a4d6, about 2.9:1 with white) for its top bar and buttons,
    # as valleybaptist.org does. That is chosen on purpose; every other palette must reach 4.5:1.
    vbc = {"valley-baptist", "valley-baptist-gray"}
    for key, p in palettes.PALETTES.items():
        assert contrast(p["btn"], "#ffffff") >= (2.8 if key in vbc else 4.5), key
        assert contrast(p["top"], "#ffffff") >= (2.8 if key == "valley-baptist" else 4.5), key
        assert contrast(p["btn_dark"], p["ink_dark"]) >= 4.5, key          # dark-mode buttons
        assert contrast(p["btn_dark"], "#1b1a19") >= 4.5, key             # dark-mode links on the page
        # counters / avatar text. Violet's original magenta (3.6:1) predates this check; new palettes must reach 4.5:1
        assert contrast(p["accent2"], "#201f1e") >= (3 if key == "violet" else 4.5), key
        assert p.get("group"), key
    c = palettes.custom_palette("#ffcc00")
    assert contrast(c["btn"], "#ffffff") >= 4.5 and contrast(c["top"], "#ffffff") >= 4.5


def test_url_overrides(monkeypatch):
    monkeypatch.setenv("SUITE_APP_URL_FACILITY_HUB", "https://fh.example/")
    s = Suite("entranac", "EntraNAC", home_url="/", app_urls={"teams": "https://teams.example/"})
    apps = {a["id"]: a for a in s.apps()}
    assert apps["facility-hub"]["url"] == "https://fh.example/"
    assert apps["teams"]["url"] == "https://teams.example/"
    assert apps["entranac"]["url"] == "/"          # this app links to its own home
    assert "copilot" in apps and apps["copilot"]["external"]
    assert all(a["id"] != "m365-admin" for a in s.apps(audience="user"))


def test_registry_json_is_html_safe():
    s = Suite("x", "X", registry={"groups": [{"id": "g", "label": "</script><b>", "apps": []}]})
    out = str(s.registry_json())
    assert "</script>" not in out and "<b>" not in out
    assert json.loads(out)["groups"][0]["label"] == "</script><b>"


def test_bad_registry_url_does_not_break_pages():
    s = Suite("x", "X", registry="https://127.0.0.1:9/nope.json")
    assert s.registry() == {"groups": []}


def test_pages_render(client):
    r = client.get("/")
    assert r.status_code == 200
    h = r.text
    assert 'data-launcher' in h and 'id="suite-apps"' in h and 'data-suite-app="demo"' in h
    assert 'class="active"' in h and "Dashboard" in h and "Copilot" in h
    assert "https://nac.vbc.example/" in h                     # override reached the registry
    assert client.get("/approvals").text.count('aria-current="page"') == 1
    assert 'class="suitebar"' in client.get("/portal").text
    assert "Sign in with Microsoft" in client.get("/login").text
    assert 'class="or"' in client.get("/login").text


def test_palette_style(client):
    assert "--p-accent:#7160e8" in client.get("/?palette=violet").text


def test_static_served(client):
    for f in ("suite.css", "suite.js", "icons.svg", "palettes.json", "brand/favicon.png"):
        assert client.get(f"/static/suite/{f}").status_code == 200, f


def test_icons_for_facility_apps_exist():
    sprite = (STATIC_DIR / "suite/icons.svg").read_text()
    for name in ("door", "sync", "ticket", "calendar", "building"):
        assert f'id="i-{name}"' in sprite, name


def test_js_exposes_refresh_for_single_page_apps():
    js = (STATIC_DIR / "suite/suite.js").read_text()
    assert "SuiteUI.refresh" in js and "function collectPages()" in js
    assert "initPickers(); }" in js       # refresh() also draws colour pickers added after page load


# ---------------------------------------------------------------- colour customization (admin default + user's own)
import shutil
import subprocess


def test_palette_encode_decode():
    assert palettes.encode("cobalt") == "cobalt"
    assert palettes.encode("custom", "#ABCDEF") == "custom:#abcdef"
    assert palettes.encode("custom", "#abcdef", "#112233") == "custom:#abcdef:#112233"
    assert palettes.encode("custom", "nope") == palettes.DEFAULT_PALETTE      # custom needs a real colour
    assert palettes.decode("custom:#abcdef:#112233") == ("custom", "#abcdef", "#112233")
    assert palettes.decode("teal") == ("teal", "", "")
    assert palettes.decode("<script>") == (palettes.DEFAULT_PALETTE, "", "")
    assert palettes.from_form({"palette": "custom", "accent": "#00FF00", "top": ""}) == ("custom", "#00ff00", "")
    assert palettes.ui("custom", "#ffcc00")["code"] == "custom:#ffcc00"


def test_app_default_palette_and_user_choices():
    s = Suite("x", "X", palette="teal")
    assert s.ui()["palette"] == "teal" and s.ui("violet")["palette"] == "violet"
    s.set_palette("custom", "#123456")
    assert s.ui()["code"] == "custom:#123456"
    assert s.palette_choices() == "all"
    assert s.palette_choices(False) == "none"
    assert s.palette_choices(["cobalt", "bogus", "custom"]) == "cobalt,custom"
    assert Suite("x", "X", user_palettes=False).palette_choices() == "none"


def test_picker_in_menus_and_admin_page(client):
    h = client.get("/").text
    assert 'data-suite-palettes="all"' in h and "data-palette-picker" in h
    assert "data-palette-picker" in client.get("/portal").text
    page = client.get("/branding").text
    assert page.count('name="palette"') == len(palettes.PALETTES) + 1 and 'name="accent"' in page
    try:
        r = client.post("/branding", data={"palette": "custom", "accent": "#7a1fa2"}, follow_redirects=False)
        assert r.status_code == 303
        h = client.get("/").text
        assert 'data-palette="custom"' in h and "--p-accent:#7a1fa2" in h
        assert 'data-suite-palettes="none"' in h and "data-palette-picker" not in h   # box unticked = users locked
    finally:
        client.post("/branding", data={"palette": "valley-baptist", "user_palettes": "on"})
    assert 'data-palette="valley-baptist"' in client.get("/").text


def test_js_palettes_match_python():
    js = (STATIC_DIR / "suite/suite.js").read_text()
    data = json.loads((STATIC_DIR / "suite/palettes.json").read_text())
    node = shutil.which("node")
    if not node:
        pytest.skip("node is not installed")
    colours = ["#ffcc00", "#00a3d6", "#123456", "#ffffff", "#000000", "#7a1fa2", "#e3008c", "#808080"]
    stub = """
      var store = {}, el = { getAttribute: function () { return null; }, setAttribute: function () {},
        classList: { add: function () {}, toggle: function () {} }, style: { setProperty: function () {} } };
      globalThis.window = globalThis; globalThis.matchMedia = null;
      globalThis.localStorage = { getItem: function (k) { return store[k] || null; }, setItem: function (k, v) { store[k] = v; } };
      globalThis.document = { documentElement: el, cookie: "", addEventListener: function () {}, querySelectorAll: function () { return []; } };
      globalThis.location = { protocol: "https:" };
    """
    script = stub + js + "\nconsole.log(JSON.stringify({p: SuiteUI.palettes, c: %s.map(function (h) { return SuiteUI.customPalette(h, ''); })}));" % json.dumps(colours)
    out = json.loads(subprocess.run([node, "-e", script], capture_output=True, text=True, check=True).stdout)
    assert out["p"] == data["palettes"], "suite.js PALETTES must match palettes.json"
    for h, c in zip(colours, out["c"]):
        assert c == palettes.custom_palette(h), h


def test_valley_baptist_blue_top_bar_with_gray_option():
    vb = palettes.PALETTES["valley-baptist"]
    assert vb["top"] == vb["btn"] == vb["accent"] == "#00a4d6"            # valleybaptist.org header and buttons
    assert palettes.PALETTES["valley-baptist-gray"]["top"] == "#414042"
    assert "--p-top:#00a4d6" in palettes.ui()["style"]
    assert palettes.PALETTES["valley-baptist-gray"]["btn"] == "#00a4d6"

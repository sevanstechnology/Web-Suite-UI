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
    for key, p in palettes.PALETTES.items():
        assert contrast(p["btn"], "#ffffff") >= 4.5, key
        assert contrast(p["top"], "#ffffff") >= 4.5, key
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

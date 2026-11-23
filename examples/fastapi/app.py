"""Suite-UI demo: an admin page, a user portal page and a sign-in page.

    pip install -e ".[dev]"
    uvicorn examples.fastapi.app:app --reload
"""
from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from pathlib import Path

from suite_ui import Suite

app = FastAPI(title="Suite-UI demo")
templates = Jinja2Templates(directory=Path(__file__).with_name("templates"))
suite = Suite(app_id="demo", app_name="Demo App", org_name="Valley Baptist", help_search="/help?q=",
              app_urls={"entranac": "https://nac.vbc.example/", "entranac-portal": "https://nac.vbc.example/enroll"})
suite.mount(app, templates)

USER = {"name": "Steve Evans", "email": "steve@example.org"}
COMMON = dict(user=USER, signout_url="/signout", pill={"text": "demo · primary"},
              notifications=[{"label": "Waiting for you", "items": [{"href": "/approvals", "label": "Approvals", "icon": "check-circle", "count": 3}]}],
              help_links=[{"href": "/help", "label": "Help & guides", "icon": "log"}])


def ctx(request: Request, **kw):
    palette = request.query_params.get("palette", "valley-baptist")
    return {"request": request, "ui": suite.ui(palette), **COMMON, **kw}


@app.get("/")
def home(request: Request):
    return templates.TemplateResponse(request, "home.html", ctx(request, counts={"/approvals": 3},
                                      flashes=[("ok", "Suite-UI is wired up.")]))


@app.get("/approvals")
def approvals(request: Request):
    return templates.TemplateResponse(request, "home.html", ctx(request, counts={"/approvals": 3}))


@app.get("/portal")
def portal(request: Request):
    return templates.TemplateResponse(request, "portal.html", ctx(request, heading="My devices"))


@app.get("/login")
def login(request: Request):
    return templates.TemplateResponse(request, "login.html", ctx(request, sso_url="/auth"))

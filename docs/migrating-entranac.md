# Moving EntraNAC onto Suite-UI

EntraNAC's interface is where Suite-UI came from, so the markup and class names are the same. The switch is mostly
deleting files.

1. `api/requirements.txt`: add `suite-ui @ git+https://github.com/sevanstechnology/Suite-UI@v0.1.0`
   (private repo: the Docker build needs a read token, or vendor the wheel from the release).
2. `api/app/main.py`, after `templates = Jinja2Templates(...)`:
   ```python
   from suite_ui import Suite
   suite = Suite(app_id="entranac", app_name="EntraNAC", org_name=cfg.ORG_NAME, help_search="/help?q=")
   suite.mount(app, templates)
   suite.set_logos(**{"on-dark": ..., "on-light": ..., "favicon": ...})   # or pass brand_url-based logos per request
   ```
3. `branding.py`: replace `PALETTES`, `custom_palette`, `contrast` and the style string in `ui()` with
   `from suite_ui import palettes` and `palettes.ui(key, accent, top)`. The database settings stay as they are.
4. `templates/base.html`: keep the `nav` list, turn the rest into
   `{% extends "suite/shell.html" %}` and pass `pill`, `notifications` (approvals, device requests, alerts),
   `help_links`, `user_links` (Colours & logo) and `signout_url="/logout"`. Move the standby banner into
   `{% block banner %}` and the version footer into `{% block nav_foot %}`.
5. `templates/portal_base.html` → `{% extends "suite/portal.html" %}`, with `user_links` for My devices /
   Register a device and `signout_url="/portal/logout"`. `login.html` → `suite/login.html`.
6. Icon paths: `/static/icons.svg#i-…` → `{{ sm.icon("…") }}` (or `/static/suite/icons.svg#i-…`). The old
   `share(…)` macro's QR button becomes `sm.share(url, title, text, qr_url="/share/qr.svg")`.
7. Delete `static/app.css`, `static/theme.js`, `static/icons.svg`. Keep `static/brand/` only if the defaults differ.
8. Set `SUITE_APP_URL_FACILITY_HUB` (and any other apps) in `.env` so the launcher points at real addresses.

Users' saved light / dark choice carries over: `suite.js` reads the old `entranac-theme` key.

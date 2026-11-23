# EntraNAC on Suite-UI

EntraNAC (https://github.com/sevanstechnology/EntraNAC) runs on Suite-UI since EntraNAC 2026.11.23.

- EntraNAC **vendors** this package: `src/suite_ui/` is copied to EntraNAC's `api/app/suite_ui/` by its
  `scripts/sync-suite-ui.sh`, which records the version and commit in `api/app/suite_ui/SOURCE`. Vendoring keeps
  the appliance, Azure and Docker builds from needing a token for this private repository.
- `main.py` creates the `Suite` (app id `entranac`) with a subclass whose `logo()` returns EntraNAC's uploaded
  logos, and mounts it before EntraNAC's own `/static`.
- `templates/base.html` keeps EntraNAC's `nav`, sets `counts`, `pill`, `notifications`, `help_links`, `user`,
  `user_links` and `signout_url`, and extends `suite/shell.html` (standby banner in `{% block banner %}`, version
  in `{% block nav_foot %}`). `portal_base.html` extends `suite/portal.html`, `login.html` extends `suite/login.html`.
- `branding.py` stores the palette choice and calls `suite_ui.palettes.ui()`. EntraNAC's `share()` macro wraps
  `sm.share(..., qr_url="/share/qr.svg")`.
- EntraNAC's `app.css`, `theme.js` and `icons.svg` were removed.

## Keeping both repositories in step

Shared UI changes are made **here first**:

1. Change `src/suite_ui/…`, update `CHANGELOG.md` (and `VERSION` for a release), run `pytest`, commit, push.
2. In EntraNAC: `scripts/sync-suite-ui.sh ../Web-Suite-UI`, check the pages, note the Suite-UI version in
   `docs/release-notes.md`, commit, push.
3. `scripts/sync-suite-ui.sh --check ../Web-Suite-UI` in EntraNAC confirms the copy matches this repository.

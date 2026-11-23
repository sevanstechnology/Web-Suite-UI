# Changelog

## Unreleased
- Church Help (plain HTML site, Azure Static Web Apps) now runs on the static files; new registry tile `church-help`.
- Fix: text boxes with no `type` attribute, and `tel` / `date` / `time` boxes, get the same style as `text` boxes.
- New icons: `door`, `sync`, `ticket` (original artwork).
- `suite.js`: `SuiteUI.refresh()` re-applies the page icon, remembered `<details>` and menu-section state after an app draws
  its menu or page in the browser (single-page apps); the top-bar search now reads the menu when you search, so a menu
  drawn after load is found. Server-rendered apps are unaffected.
- Fix: `[hidden]` now always hides (a count badge with `hidden` still showed as an empty pill).
- Registry: a real description for the Facility Hub tile.
- Facility Hub (Node, no Python) now runs on the static files: see docs/using-from-node.md.
- Docs: EntraNAC now runs on Suite-UI (vendored copy); how to keep both repositories in step.

## 0.1.0 - 2026-11-23
- First release, extracted from EntraNAC's interface: `suite.css`, `suite.js`, icon sprite, seven colour palettes
  (Valley Baptist default) and the accessible custom-palette builder.
- New: Microsoft 365-style app launcher fed by a shared registry (`apps.json`), with your apps, Microsoft 365 apps and
  admin centres; admin-only apps hidden from end users.
- New: Copilot button, search across this app's pages *and* the other apps, light / dark shared across apps via a
  parent-domain cookie.
- Python package `suite_ui` with Jinja templates (`suite/shell.html`, `suite/portal.html`, `suite/login.html`,
  `suite/_macros.html`) and FastAPI / Flask wiring.

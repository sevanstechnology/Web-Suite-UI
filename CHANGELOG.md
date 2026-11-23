# Changelog

## Unreleased
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

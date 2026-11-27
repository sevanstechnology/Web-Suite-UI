# Changelog

## 0.2.0
- New: **palette looks.** A palette can now bring light and dark surface colours, a heading font and corner radius
  (`light` / `dark` / `font_head` / `radius` / `radius_lg` in palettes.json; `--pl-*`, `--pd-*`, `--p-head`,
  `--p-radius` variables). Apps no longer need their own CSS overrides to keep their brand. See docs/design.md.
- New **Sevans** palettes: **Sevans Technology** (`sevans-technology`, gold highlights) and **Hepta** (`hepta`, amber
  highlights) - Hepta violet #7C5CFF on ink #0B0D17, Space Grotesk headings, 10 / 16 px corners.
- Space Grotesk (SIL OFL 1.1) is bundled in `static/suite/fonts/`; it is only downloaded when a palette uses it.
- New: **customise "Your apps"** in the launcher - hide, show, reorder and add your own links. Saved per person in
  the browser (and the shared cookie domain); `SuiteUI.appsCustom()` / `setAppsCustom()` and the `suite:apps-changed`
  event let apps store it on their server. Registry groups take `"customizable": true|false`.
- New: `Suite(apps_mine_url=...)` / `data-suite-apps-mine-url` keeps each person's "Your apps" on the app's server
  (GET / PUT JSON), so it follows them to other devices; `suite_ui.apps_mine.clean()` validates what is stored.
- Registry: new tiles **Sevans.io admin** (`sevans-site`), **Pulse TV** (`pulse-tv`) and **Hepta** (`hepta`).
- New icons: `play`, `tv` (original artwork).
- Selected-row and info backgrounds now mix with the panel colour, so they suit dark palette looks.

## Earlier (0.1.x)
- Valley Baptist blue now matches valleybaptist.org exactly: **#00a4d6** for the top bar, buttons, links and accents
  (buttons and links were a darker #007ea6). Valley Baptist Gray keeps the gray top bar with the same blue buttons.
  As on the church website, white text on this blue is about 2.9:1.
- Fix: `SuiteUI.refresh()` now also draws a `[data-palette-picker]` added after page load, so apps that build their
  menus in the browser (Church Help, Facility Hub) can show the Colours picker.
- The default Valley Baptist look now has a **VBC blue top bar** (#00a3d6). The previous gray top bar is the new
  **Valley Baptist Gray** palette (`valley-baptist-gray`). Note: white text on #00a3d6 is about 2.9:1, below the 4.5:1
  the other top bars meet; pick Valley Baptist Gray where that matters.
- New: users pick their own colours. The user menu (admin shell and portal) has a **Colours** picker with every palette
  and a **Custom** option (main colour + top bar, adjusted automatically to keep 4.5:1 contrast). The choice is saved in
  the browser and, with `cookie_domain`, follows the user across apps; **Default** goes back to the app's colours.
  `SuiteUI.setPalette()` for scripts.
- New: admins set the app's default colours with `Suite(palette=, accent=, top=)` / `suite.set_palette()`, using the new
  `sm.palette_form()` macro and `palettes.from_form()` / `encode()` / `decode()` helpers. `suite.ui()` with no
  arguments now returns the app's default. `Suite(user_palettes=True|False|[...])` (or a `user_palettes` template
  variable) turns the users' picker off or limits it.
- New palettes, grouped in palettes.json: **Fun** (Summer Popsicle, Pasture of Dreams, Berry Blues, Icy Gradient, The Deep
  Blue) and **Holidays** (Christmas, Halloween, Thanksgiving, Valentine's, St. Patrick's, Fourth of July). Tests now
  also check dark-mode and highlight contrast for every palette.
- Demo: `/branding` admin page in `examples/fastapi`; the static example shows the picker.
- Church Help (plain HTML site, Azure Static Web Apps) now runs on the static files; new registry tile `church-help`.
- Fix: text boxes with no `type` attribute, and `tel` / `date` / `time` boxes, get the same style as `text` boxes.
- New icons: `door`, `sync`, `ticket` (original artwork).
- `suite.js`: `SuiteUI.refresh()` re-applies the page icon, remembered `<details>` and menu-section state after an app draws
  its menu or page in the browser (single-page apps); the top-bar search now reads the menu when you search, so a menu
  drawn after load is found. Server-rendered apps are unaffected.
- Fix: `[hidden]` now always hides (a count badge with `hidden` still showed as an empty pill).
- Registry: a real description and the real address (https://facility.valleybaptist.help/) for the Facility Hub tile; docs list where the apps run.
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

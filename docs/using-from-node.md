# Using Suite-UI from a Node / single-page app (Facility Hub)

[Facility Hub](https://github.com/sevanstechnology/Facility-Hub) is an Express app with a browser-rendered UI, so it uses the
static files, not the Python package.

## Vendoring

Facility Hub keeps a copy in `public/static/suite/` and refreshes it with its own `scripts/sync-suite-ui.sh <path-to-this-repo>`,
which copies `src/suite_ui/static/suite/*` and `src/suite_ui/registry/apps.json` and records the version and commit in
`public/static/suite/SOURCE`. `scripts/sync-suite-ui.sh --check <path>` confirms the copy matches this repository.

## Markup

Use the same markup as `src/suite_ui/templates/suite/shell.html` (top bar, `.nav-sec` sections, `main[data-icon]`, `.top`).
Set `data-suite-app`, `data-suite-static` and `data-suite-apps` on `<html>`. The server should serve the registry with
the real URLs for each deployment (Facility Hub does this from `SUITE_APP_URL_<ID>` variables, like the Python package).

## Drawing the menu or pages in the browser

`suite.js` decorates the page once, when it loads. If your app renders its menu or page content afterwards, call

```js
window.SuiteUI.refresh();   // page icon beside the <h1>, <details data-remember>, collapsed menu sections
```

after each render. It is safe to call repeatedly. Search reads the menu at search time, so it needs no call.
Set `main[data-icon]` to the current menu entry's icon before calling it, and add the `has-active` class to the
current page's `.nav-sec`.

## Changing the UI

Make the change here first (generic only), update `CHANGELOG.md`, run `pytest`, push; then sync into each app
(EntraNAC and Facility Hub), check the pages, commit and push those repositories too.

## Colours picker

Put `<div class="palette-picker" data-palette-picker role="group" aria-label="Colours"></div>` (and, if you like, the
Auto / Light / Dark `.theme-switch`) in a menu. If you add it after the page loads, call `SuiteUI.refresh()`.
`<html data-suite-palettes="none">` turns it off; see docs/design.md.

# Design reference

## Palettes

`<html data-palette="…" style="--p-…">` is produced by `suite.ui()` - the app's default colours, set with
`Suite(palette=…)` or `suite.set_palette(key, accent, top)` - or by `suite.ui(key)` / `suite.ui("custom", accent="#hex")`.
Palette ids live in `static/suite/palettes.json` (which other languages can read too), each with a `group`:

- **Standard:** `valley-baptist` (default, VBC blue top bar), `valley-baptist-gray` (same, gray top bar), `cobalt`, `teal`, `violet`, `forest`, `crimson`, `graphite`
- **Fun:** `summer-popsicle`, `pasture-of-dreams`, `berry-blues`, `icy-gradient`, `deep-blue`
- **Sevans:** `sevans-technology` (gold highlights), `hepta` (amber highlights) - Hepta violet on ink with their own
  surfaces, Space Grotesk headings and rounder corners (see *Palette looks* below)
- **Holidays:** `christmas`, `halloween`, `thanksgiving`, `valentines`, `st-patricks`, `fourth-of-july`

Every palette is checked by the tests: buttons and the top bar reach 4.5:1 with white text (except Valley Baptist,
which uses valleybaptist.org's exact #00a4d6 for the top bar and buttons, about 2.9:1, on purpose), dark-mode buttons 4.5:1
with their text and the page, highlights 4.5:1 with dark text. When you add one, derive `btn`, `top`, `btn_dark`,
`ink_dark` and `accent2` from your colours with the same rules as `palettes.custom_palette()`, and copy it into the
`PALETTES` list in `suite.js` too (a test checks they match).

### Who picks the colours

- **Admin (app default):** put `{{ sm.palette_form(suite.ui()) }}` in a `<form method="post">` on your own settings
  page, read it with `palettes.from_form(form)`, store `palettes.encode(key, accent, top)` (one string) and call
  `suite.set_palette(*palettes.decode(stored))` at start-up and after saving. See `examples/fastapi` (`/branding`).
- **Each user:** the user menu (shell and portal) has a **Colours** picker: Default (the admin's colours), every
  allowed palette and **Custom** (main colour + top bar, made readable automatically). suite.js saves it as
  `suite-palette` in the browser and, with `cookie_domain`, in a cookie shared by every app. It is laid over the
  admin's colours; Default removes it.
- **Lock it:** `Suite(user_palettes=False)` turns the picker off (everyone sees the admin's colours),
  `user_palettes=["cobalt", "teal", "custom"]` limits it. A template can pass `user_palettes` to override per page or
  per user. This becomes `<html data-suite-palettes="all|none|a,b,custom">`, which static / Node apps set themselves.
- From your own scripts: `SuiteUI.setPalette("halloween")`, `SuiteUI.setPalette("custom:#00a3d6")`,
  `SuiteUI.setPalette("")` (back to the default).

| Variable | Used for |
|---|---|
| `--p-accent` | Brand colour: icons, active-menu marker, focus, stat stripes |
| `--p-btn` / `--p-btn-hover` | Primary buttons and links in light mode (white text, ≥ 4.5:1) |
| `--p-top` | Top bar (white text, ≥ 4.5:1) |
| `--p-btn-dark` / `--p-ink-dark` / `--p-btn-dark-hover` | Primary buttons and links in dark mode |
| `--p-accent2` | Highlights: counters, avatar, standby pill |

Everything else (`--bg`, `--panel`, `--ink`, `--muted`, `--line`, `--ok`, `--bad`, `--warn`, …) switches with
`data-theme="light|dark"`, which `suite.js` sets from the user's choice (Auto / Light / Dark).

### Palette looks (surfaces, heading font, corners)

A palette can carry a whole brand, not just colours, so an app no longer needs its own CSS overrides for it.
Optional fields in `palettes.json`:

```json
"hepta": { "...colours...": "",
  "font_head": "Space Grotesk", "radius": 10, "radius_lg": 16,
  "light": { "bg": "#f4f5fa", "panel": "#ffffff", "ink": "#2b2f3d", "...": "" },
  "dark":  { "bg": "#0b0d17", "panel": "#141829", "top": "#10131f", "...": "" } }
```

Surface keys: `bg`, `panel`, `panel_2`, `ink`, `ink_strong`, `muted`, `line`, `line_strong`, `hover`, `nav`, `nav_ink`,
`nav_muted`, `top`. They become `--pl-*` (light) / `--pd-*` (dark) variables (`panel_2` → `--pd-panel-2`), plus
`--p-head`, `--p-radius`, `--p-radius-lg`; `palettes.look_vars()` and suite.js build the same set. Anything left out
keeps the plain Suite look, and picking a palette without a look removes it again. Space Grotesk (SIL OFL) ships in
`static/suite/fonts/` and is only downloaded when a palette uses it. The tests check every look: body text 7:1,
muted text and dark-mode links 4.5:1 on the page and on panels.

To fork the look for a new brand, copy `hepta` in `palettes.json` (and the `PALETTES` line in `suite.js`), change
the colours and run the tests.

## "Your apps" (launcher customisation)

The registry group with `"customizable": true` (default: the first group, unless a group sets `false`) gets a
**Customize** button in the launcher. Each person can hide or show its apps, move them up and down and add their own
links (name, https address, icon, tile colour). It is saved in the browser as `suite-apps-mine` and, with
`cookie_domain`, in a cookie for the parent domain so it follows them between apps (when it fits in a cookie).
Their own links also show up in the top-bar search. `<html data-suite-apps-custom="off">` turns it off.

To keep it on the app's server too (so it follows the person to other devices), give the endpoint:
`Suite(apps_mine_url="/api/me/suite-apps")` or `<html data-suite-apps-mine-url="…">`. suite.js then sends
`GET` (return the saved object, or `{}` if the person never saved one - their browser copy is uploaded then) and
`PUT` with the JSON body after each change; what the server has wins. Store `suite_ui.apps_mine.clean(body)` per
signed-in user, require the session for both and check `Origin` (or your CSRF token - suite.js sends
`<meta name="csrf-token">` as `X-CSRF-Token`) on PUT. `examples/fastapi` has a working pair. Node / Workers apps copy
the same rules (ids `^[a-z0-9-]{1,64}$`, own links `my-…` with https / `/path` URLs, at most 100 ids and 30 links).
Scripts can also listen for `suite:apps-changed` and call `SuiteUI.setAppsCustom(saved)`. `SuiteUI.appsCustom()` returns the current choice;
`SuiteUI.setAppsCustom(null)` resets it. Only `https://`, `http://` and `/path` links are accepted.

## Layout classes

- Admin: `.topbar` › `.tb-waffle`, `.tb-brand`, `.tb-search`, `.tb-right` › `.tb-btn`, `.tb-copilot`, `.menu-wrap` /
  `.menu`; `.shell` › `.nav` (`.nav-sec`, `.grp`, `.nav-items`, `.nav-count`) + `main` (`.crumbs`, `.top`, `.actions`).
- User: `.suitebar`, `.portal-page` › `.portal`, `.portal-hello`, `.choice`.
- Sign-in: `.login-wrap` › `.login`, `.or`.

## Components

`.panel` (`.flush`, `.attention`), `.grid .g2/.g3/.g4`, `.stat`, tables, `.badge .ok/.bad/.warn/.info`,
`.btn .primary/.danger/.sm`, `.fields` forms, `.flash .ok/.warn/.error`, `.banner`, `.tabs`, `details.box`, `.kv`,
`.hint-box`, `.page-help`, `.palettes` (admin palette form), `.palette-picker`, `.checklist`, `.wiz-steps`, `pre.snippet`, `pre.diff`, `.share`, `.app-cards`.

Macros in `suite/_macros.html`: `icon`, `page_header` (with a `call` block for buttons), `stat`, `badge`, `yesno`,
`ts`, `empty`, `apps_grid`, `share`, `theme_switch`, `palette_picker`, `palette_form`, `initials`.

## Icons

`static/suite/icons.svg` - 24×24 line icons, stroke = `currentColor`:
`<svg class="ic"><use href="/static/suite/icons.svg#i-home"/></svg>` or `{{ sm.icon("home") }}`.
Add new ones as `<symbol id="i-name" viewBox="0 0 24 24">…</symbol>`, original artwork only.

## Behaviour (`suite.js`)

`data-launcher`, `data-nav-toggle`, `data-theme-toggle`, `.theme-switch [data-theme-set]`, `data-menu="id"`,
`data-nav-all="open|close"`, `data-check-all="name"`, `details[data-remember="key"]`, `.share [data-share]`,
`/` focuses the search, `Esc` closes menus. `window.SuiteUI.setTheme("dark")` from your own scripts.

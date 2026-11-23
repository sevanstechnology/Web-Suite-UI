# Design reference

## Palettes

`<html data-palette="…" style="--p-…">` is produced by `suite.ui(key)` (or `suite.ui("custom", accent="#hex")`).
Palette ids: `valley-baptist` (default), `cobalt`, `teal`, `violet`, `forest`, `crimson`, `graphite`. They live in
`static/suite/palettes.json`, which other languages can read too.

| Variable | Used for |
|---|---|
| `--p-accent` | Brand colour: icons, active-menu marker, focus, stat stripes |
| `--p-btn` / `--p-btn-hover` | Primary buttons and links in light mode (white text, ≥ 4.5:1) |
| `--p-top` | Top bar (white text, ≥ 4.5:1) |
| `--p-btn-dark` / `--p-ink-dark` / `--p-btn-dark-hover` | Primary buttons and links in dark mode |
| `--p-accent2` | Highlights: counters, avatar, standby pill |

Everything else (`--bg`, `--panel`, `--ink`, `--muted`, `--line`, `--ok`, `--bad`, `--warn`, …) switches with
`data-theme="light|dark"`, which `suite.js` sets from the user's choice (Auto / Light / Dark).

## Layout classes

- Admin: `.topbar` › `.tb-waffle`, `.tb-brand`, `.tb-search`, `.tb-right` › `.tb-btn`, `.tb-copilot`, `.menu-wrap` /
  `.menu`; `.shell` › `.nav` (`.nav-sec`, `.grp`, `.nav-items`, `.nav-count`) + `main` (`.crumbs`, `.top`, `.actions`).
- User: `.suitebar`, `.portal-page` › `.portal`, `.portal-hello`, `.choice`.
- Sign-in: `.login-wrap` › `.login`, `.or`.

## Components

`.panel` (`.flush`, `.attention`), `.grid .g2/.g3/.g4`, `.stat`, tables, `.badge .ok/.bad/.warn/.info`,
`.btn .primary/.danger/.sm`, `.fields` forms, `.flash .ok/.warn/.error`, `.banner`, `.tabs`, `details.box`, `.kv`,
`.hint-box`, `.page-help`, `.checklist`, `.wiz-steps`, `pre.snippet`, `pre.diff`, `.share`, `.app-cards`.

Macros in `suite/_macros.html`: `icon`, `page_header` (with a `call` block for buttons), `stat`, `badge`, `yesno`,
`ts`, `empty`, `apps_grid`, `share`, `theme_switch`, `initials`.

## Icons

`static/suite/icons.svg` - 24×24 line icons, stroke = `currentColor`:
`<svg class="ic"><use href="/static/suite/icons.svg#i-home"/></svg>` or `{{ sm.icon("home") }}`.
Add new ones as `<symbol id="i-name" viewBox="0 0 24 24">…</symbol>`, original artwork only.

## Behaviour (`suite.js`)

`data-launcher`, `data-nav-toggle`, `data-theme-toggle`, `.theme-switch [data-theme-set]`, `data-menu="id"`,
`data-nav-all="open|close"`, `data-check-all="name"`, `details[data-remember="key"]`, `.share [data-share]`,
`/` focuses the search, `Esc` closes menus. `window.SuiteUI.setTheme("dark")` from your own scripts.

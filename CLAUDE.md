# Web Suite UI - notes for Claude

- This is the shared interface for Sevans Technology apps. EntraNAC (sevanstechnology/EntraNAC) uses a vendored
  copy in `api/app/suite_ui/`. After changing `src/suite_ui/`, also sync it into EntraNAC with EntraNAC's
  `scripts/sync-suite-ui.sh <path-to-this-repo>` and commit/push both repositories - keep them updated together.
  See docs/migrating-entranac.md.
- Changes must stay generic (no EntraNAC-specific pages or wording); app-specific menus and pages belong in the app.
- Record every change in `CHANGELOG.md`; bump `VERSION` (and `src/suite_ui/VERSION`) for a release.

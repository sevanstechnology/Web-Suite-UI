# Adding an app to the suite

## 1. Register it

Add an entry to `src/suite_ui/registry/apps.json`, in the `sevans` group ("Your apps"):

```json
{ "id": "facility-hub", "name": "Facility Hub", "description": "Events, door schedules and the facilities help desk",
  "url": "https://facility.valleybaptist.help/", "icon": "building", "color": "#5b4bd4" }
```

| Field | Meaning |
|---|---|
| `id` | Lower-case id. The app passes the same id to `Suite(app_id=...)`. |
| `url` | Default address. Each deployment overrides it (step 3), so a placeholder is fine. |
| `icon` | An icon id from `static/suite/icons.svg` (without `i-`), or use `image` for a picture URL. |
| `color` | Tile colour, `#rrggbb`. White icons sit on it, so pick something dark enough. |
| `audience` | `["admin"]` hides it from self-service pages; `["admin","user"]` or nothing shows it everywhere. |
| `external` | Open in a new tab. The Microsoft 365 and admin groups set this for all their apps. |
| `hidden` | Keep the entry but don't show it. |

Groups have `layout: "grid"` (tiles, default) or `"list"` (rows with descriptions). The `suite` block sets the
launcher heading, the "All apps" link, the footer link and `copilot_url` (remove it to hide the Copilot button).

`pytest` checks the file against `apps.schema.json`, that ids are unique and that every icon exists.

## 2. Use Suite-UI in the app

See the README. `app_id` must match the registry id; that tile is then highlighted and points at the app's home.

## 3. Tell each deployment where the apps are

```python
Suite(app_id="facility-hub", app_name="Facility Hub", org_name="Valley Baptist",
      app_urls={"entranac": "https://nac.vbc.org/", "entranac-portal": "https://nac.vbc.org/enroll"})
```

or environment variables (`-` becomes `_`): `SUITE_APP_URL_ENTRANAC=https://nac.vbc.org/`.

## 4. Optional: one live registry for everything

Host a copy of `apps.json` and set `SUITE_REGISTRY=https://…/apps.json` (or a file path) on each app. Apps re-read
it every five minutes and keep the last good copy if it can't be fetched, so a bad URL never breaks a page.

## 5. Optional: one light / dark choice across apps

If the apps share a parent domain (for example `nac.sevans.io`, `facilities.sevans.io`) set
`SUITE_COOKIE_DOMAIN=.sevans.io`. The theme is then stored in a cookie for that domain as well as in the browser.

## Single sign-on

Suite-UI only does the interface. For a seamless switch between apps, register each one in the same Entra ID tenant
and sign users in with Microsoft; they'll already have a session when they open the next app from the launcher.

## Where the apps run (Valley Baptist)

| App | Address | Hosting |
|---|---|---|
| Church Help (`church-help`) | https://valleybaptist.help/ | Azure Static Web Apps (plain HTML); DNS on Cloudflare |
| Facility Hub (`facility-hub`) | https://facility.valleybaptist.help/ | Azure App Service (Linux, Node 22); DNS on Cloudflare (CNAME, DNS only) with an App Service managed certificate; staff sign in with Entra ID |
| EntraNAC (`entranac`, `entranac-portal`) | placeholder in `apps.json`; set per deployment | ESXi + Azure pair |

The registry holds the Facility Hub address as its default, so other apps show the right link without extra settings. Any deployment can still
override it with `SUITE_APP_URL_FACILITY_HUB` (for example a test site). The domain's DNS is in Cloudflare (zone `valleybaptist.help`); see
Facility Hub's `docs/AZURE.md` for the records and the steps.

#!/usr/bin/env bash
# Build dist/suite-ui-<version>.zip: the static files (css, js, icons, palettes, brand) and the registry,
# for apps that aren't Python. Run from the repository root.
set -euo pipefail
v=$(cat VERSION)
out=dist/suite-ui-$v
rm -rf "$out" && mkdir -p "$out"
cp -r src/suite_ui/static/suite/. "$out/"
cp src/suite_ui/registry/apps.json src/suite_ui/registry/apps.schema.json "$out/"
cp -r src/suite_ui/templates "$out/templates"
(cd dist && rm -f "suite-ui-$v.zip" && zip -qr "suite-ui-$v.zip" "suite-ui-$v")
echo "dist/suite-ui-$v.zip"

#!/usr/bin/env bash
# Regenerates the minified CSS/JS that the HTML actually loads in production.
# Run this AFTER editing styles.css, script.js, or translations.js, then commit
# both the source and the .min files. Requires `esbuild` (brew install esbuild).
set -euo pipefail

cd "$(dirname "$0")"

esbuild styles.css       --minify --outfile=styles.min.css
esbuild script.js        --minify --outfile=script.min.js
esbuild translations.js  --minify --outfile=translations.min.js

echo "Build done."
ls -lh styles.min.css script.min.js translations.min.js

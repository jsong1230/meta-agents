#!/usr/bin/env bash
# Render TTA standard figures from Mermaid sources to vector SVG + PDF.
# Requires: npx, @mermaid-js/mermaid-cli (fetched on demand), a Korean font
# (Noto Sans CJK KR) installed for proper CJK rendering.
#
# Usage: ./build.sh            # renders all .mmd in this directory
set -euo pipefail
cd "$(dirname "$0")"

CFG="mermaid-config.json"
PUP="puppeteer-config.json"
SCALE=3   # raster fallback scale (SVG/PDF stay vector regardless)

for src in fig*.mmd; do
  base="${src%.mmd}"
  echo "→ $src → $base.svg / $base.pdf"
  npx --yes @mermaid-js/mermaid-cli@11 \
    -i "$src" -o "$base.svg" -c "$CFG" -p "$PUP" -b white
  npx --yes @mermaid-js/mermaid-cli@11 \
    -i "$src" -o "$base.pdf" -c "$CFG" -p "$PUP" -b white --pdfFit
done
echo "done. SVG = web/working draft, PDF = HWP/Word embed (vector)."

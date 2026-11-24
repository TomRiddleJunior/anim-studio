#!/usr/bin/env bash
# Sets up a marker-map workspace from this skill: <root>/engine (code copied from the skill), <root>/_vendor (d3,
# topojson-client, world-atlas, Natural Earth lines, fonts, tile cache), then generates engine/data/*.js and the paper
# and grain textures. The working install on this PC already exists at map-films; use this only for a
# fresh root.   usage: bash setup.sh "<root dir>"
set -eu
ROOT="${1:?usage: setup.sh <root dir>}"
SK="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/_vendor/fonts" "$ROOT/_vendor/geo" "$ROOT/_vendor/tiles/2016"
[ -d "$ROOT/engine" ] || cp -r "$SK/engine" "$ROOT/engine"

cd "$ROOT/_vendor"
[ -f package.json ] || npm init -y >/dev/null
npm i --ignore-scripts --no-audit --no-fund d3@7.9.0 topojson-client@3.1.0 world-atlas@2.0.2
curl -sSL --fail -o geo/ne_10m_geographic_lines.geojson \
  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_geographic_lines.geojson
g="https://github.com/google/fonts/raw/main"
curl -sSL --fail -o fonts/SpecialElite-Regular.ttf "$g/apache/specialelite/SpecialElite-Regular.ttf"
curl -sSL --fail -o fonts/CormorantGaramond_wght_.ttf "$g/ofl/cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf"
curl -sSL --fail -o fonts/PermanentMarker-Regular.ttf "$g/apache/permanentmarker/PermanentMarker-Regular.ttf"
curl -sSL --fail -o fonts/Oswald_wght_.ttf "$g/ofl/oswald/Oswald%5Bwght%5D.ttf"

# Python side (anaconda): numpy pinned so pip never upgrades it; faster-whisper small.en downloads on first use.
python -m pip install --quiet faster-whisper "numpy==$(python -c 'import numpy; print(numpy.__version__)')"

cd "$ROOT"
python -I engine/tools/vendor.py
python -I engine/tools/textures.py
echo "ready: $ROOT  (Kokoro: the PyTorch install in ~/.generative-music-video/venv; Playwright drives the installed Edge)"

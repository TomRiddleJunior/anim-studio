#!/usr/bin/env bash
# Snapshot the project at given times and tile the stills into <outdir>/sheet.jpg.
# usage: bash tools/snap.sh 0.2,2.6,7.1 [outdir]
# On a shared machine set WITH_LOCK=<path to a lock wrapper script> and the snapshot runs through it.
set -u
HERE="$(cd "$(dirname "$0")/.." && pwd)"
AT="$1"; OUT="${2:-$HERE/scratch/snap}"
rm -rf "$OUT"; mkdir -p "$OUT"
cd "$HERE"
if [ -n "${WITH_LOCK:-}" ]; then
  bash "$WITH_LOCK" npx -y hyperframes@0.8.210 snapshot --at "$AT" --no-end --keep -o "$OUT" --timeout 90000 . 2>&1 | tail -4
else
  npx -y hyperframes@0.8.210 snapshot --at "$AT" --no-end --keep -o "$OUT" --timeout 90000 . 2>&1 | tail -4
fi
python -X utf8 -I "$HERE/tools/tile.py" "$OUT" "$OUT/sheet.jpg" "${COLS:-6}" "${TILE_W:-300}"

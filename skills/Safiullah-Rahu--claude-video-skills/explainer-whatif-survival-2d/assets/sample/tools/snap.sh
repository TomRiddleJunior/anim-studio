#!/usr/bin/env bash
# Snapshot the project at given times and tile the stills into <outdir>/sheet.jpg (default scratch/snap).
# usage: bash tools/snap.sh 1.5,6,12.2 [outdir]
# On a shared machine set LOCK_WRAPPER to a script that serialises renders (it gets the command as arguments).
set -u
HERE="$(cd "$(dirname "$0")/.." && pwd)"
AT="$1"; OUT="${2:-$HERE/scratch/snap}"
rm -rf "$OUT"; mkdir -p "$OUT"
cd "$HERE"
${LOCK_WRAPPER:+bash "$LOCK_WRAPPER"} npx -y hyperframes@0.8.210 snapshot --at "$AT" --no-end --keep -o "$OUT" --timeout 90000 . 2>&1 | grep -v "^\[hyperframes\] check" | tail -5
python -X utf8 -I "$HERE/tools/tile.py" "$OUT" "$OUT/sheet.jpg"

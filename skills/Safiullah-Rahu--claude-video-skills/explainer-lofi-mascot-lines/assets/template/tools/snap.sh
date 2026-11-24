#!/usr/bin/env bash
# Snapshot the project at given times (under the shared render lock) and tile the stills into scratch/snap/sheet.jpg.
# usage: bash tools/snap.sh 1.5,6,12.2 [outdir]
set -u
HERE="$(cd "$(dirname "$0")/.." && pwd)"
AT="$1"; OUT="${2:-$HERE/scratch/snap}"
export PATH="engine/node_modules/ffmpeg-static:ffmpeg-bin/node_modules/ffprobe-static/bin/win32/x64:$PATH"
rm -rf "$OUT"; mkdir -p "$OUT"
cd "$HERE"
bash "tools/with_render_lock.sh" npx -y hyperframes@0.8.210 snapshot --at "$AT" --no-end --keep -o "$OUT" --timeout 90000 . 2>&1 | grep -v "^\[hyperframes\] check" | tail -5
python -X utf8 -I "$HERE/tools/tile.py" "$OUT" "$OUT/sheet.jpg"

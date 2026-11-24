#!/usr/bin/env bash
# Delivery from the render master: x264 CRF 19 (1080x1920, 30 fps) + the full mix (AAC) -> out/<name>.mp4, then the same
# video stream remuxed (no re-encode) with the voice+sfx-only mix -> out/<name>_nomusic.mp4. Never -shortest: both
# streams are cut to the composition length explicitly and the stream durations are printed for the gate.
# Run under the shared lock:  bash "tools/with_render_lock.sh" bash tools/deliver.sh
# FILM_DUR=<s> overrides the length (default: vo/data/vo.json duration).
set -eu
HERE="$(cd "$(dirname "$0")/.." && pwd)"; NAME="$(basename "$HERE")"
FF="engine/node_modules/ffmpeg-static/ffmpeg.exe"
MASTER="${1:-$HERE/out/${NAME}_master.mp4}"
MIX="$(cygpath -m "$HERE")"
DUR="${FILM_DUR:-$(python -X utf8 -I -c "import json,sys;print(json.load(open(sys.argv[1]))['duration'])" "$MIX/vo/data/vo.json")}"
echo "duration $DUR s"
cd "$HERE"
"$FF" -y -v error -i "$MASTER" -i score/final.wav -map 0:v:0 -map 1:a:0 -t "$DUR" -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -r 30 \
  -maxrate 14M -bufsize 28M -c:a aac -b:a 256k -ar 48000 -movflags +faststart "out/$NAME.mp4"
"$FF" -y -v error -i "out/$NAME.mp4" -i score/final_nomusic.wav -map 0:v:0 -map 1:a:0 -t "$DUR" -c:v copy -c:a aac -b:a 256k -ar 48000 \
  -movflags +faststart "out/${NAME}_nomusic.mp4"
for f in "out/$NAME.mp4" "out/${NAME}_nomusic.mp4"; do
  echo "$f"; ffprobe -v error -show_entries stream=codec_type,duration -of compact "$f"
done

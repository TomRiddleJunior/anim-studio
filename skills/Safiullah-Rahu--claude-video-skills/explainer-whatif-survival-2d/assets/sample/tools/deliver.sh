#!/usr/bin/env bash
# Delivery from the render master: x264 CRF 19 (1080x1920, 30 fps) + the full mix (AAC) -> out/<name>.mp4, then the SAME
# video stream remuxed (no re-encode) with the voice+sfx-only mix -> out/<name>_nomusic.mp4. Never -shortest: both
# streams are cut to the composition length explicitly; the stream durations and frame counts are printed for the gate.
# usage (under the shared render lock): bash tools/deliver.sh [master.mp4]      ffmpeg/ffprobe from $FFMPEG/$FFPROBE or PATH
set -eu
HERE="$(cd "$(dirname "$0")/.." && pwd)"; NAME="$(basename "$HERE")"
FF="${FFMPEG:-ffmpeg}"; FP="${FFPROBE:-ffprobe}"
MASTER="${1:-$HERE/out/${NAME}_master.mp4}"
cd "$HERE"
DUR="$(python -X utf8 -I -c "import json;print(json.load(open('vo/data/vo.json'))['duration'])")"
echo "duration $DUR s"
"$FF" -y -v error -i "$MASTER" -i score/final.wav -map 0:v:0 -map 1:a:0 -t "$DUR" -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -r 30 \
  -maxrate 14M -bufsize 28M -c:a aac -b:a 256k -ar 48000 -movflags +faststart "out/$NAME.mp4"
"$FF" -y -v error -i "out/$NAME.mp4" -i score/final_nomusic.wav -map 0:v:0 -map 1:a:0 -t "$DUR" -c:v copy -c:a aac -b:a 256k -ar 48000 \
  -movflags +faststart "out/${NAME}_nomusic.mp4"
for f in "out/$NAME.mp4" "out/${NAME}_nomusic.mp4"; do
  echo "$f"; "$FP" -v error -count_frames -show_entries stream=codec_type,duration,nb_read_frames -of compact "$f"
done

#!/usr/bin/env bash
# Delivery from the render master: x264 CRF 19 + the full mix (AAC) -> out/<name>.mp4, then the SAME video stream
# remuxed (no re-encode) with the no-music mix -> out/<name>_nomusic.mp4. Never -shortest: both streams are cut to the
# composition length explicitly, and the stream durations and frame counts are printed for the gate.
# usage: bash tools/deliver.sh [master.mp4]      env: FFMPEG / FFPROBE (default: on PATH), FILM_FPS (default 30)
# On a shared machine run it through the render lock wrapper.
set -eu
HERE="$(cd "$(dirname "$0")/.." && pwd)"; NAME="$(basename "$HERE")"
FF="${FFMPEG:-ffmpeg}"; FP="${FFPROBE:-ffprobe}"
MASTER="${1:-$HERE/out/${NAME}_master.mp4}"
FPS="${FILM_FPS:-30}"
cd "$HERE"
DUR="$(grep -o 'data-composition-id="main"[^>]*data-duration="[0-9.]*"' index.html | grep -o 'data-duration="[0-9.]*"' | grep -o '[0-9.]*')"
echo "duration $DUR s at $FPS fps"
"$FF" -y -v error -i "$MASTER" -i score/final.wav -map 0:v:0 -map 1:a:0 -t "$DUR" -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -r "$FPS" \
  -maxrate 14M -bufsize 28M -c:a aac -b:a 256k -ar 48000 -movflags +faststart "out/$NAME.mp4"
"$FF" -y -v error -i "out/$NAME.mp4" -i score/final_nomusic.wav -map 0:v:0 -map 1:a:0 -t "$DUR" -c:v copy -c:a aac -b:a 256k -ar 48000 \
  -movflags +faststart "out/${NAME}_nomusic.mp4"
for f in "out/$NAME.mp4" "out/${NAME}_nomusic.mp4"; do
  echo "$f"; "$FP" -v error -count_frames -show_entries stream=codec_type,duration,nb_read_frames -of compact "$f"
done

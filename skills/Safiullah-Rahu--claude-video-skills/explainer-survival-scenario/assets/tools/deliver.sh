#!/usr/bin/env bash
# Encode a render master to the delivery file (x264 CRF 19, the current assets/audio/final.m4a muxed in) and run the
# full QA pass. Run it under the shared lock:  bash with_render_lock.sh bash tools/deliver.sh scratch/<master>.mp4
set -u
cd "$(dirname "$0")/.."
KEY="$(basename "$PWD")"
FF="engine/node_modules/ffmpeg-static/ffmpeg.exe"
"$FF" -y -hide_banner -v error -i "$1" -i assets/audio/final.m4a -map 0:v:0 -map 1:a:0 -c:v libx264 -preset slow -crf 19 -maxrate 14M -bufsize 28M \
  -pix_fmt yuv420p -movflags +faststart -c:a copy "out/$KEY.mp4" || exit 1
ls -la "out/$KEY.mp4"
bash tools/qa_all.sh

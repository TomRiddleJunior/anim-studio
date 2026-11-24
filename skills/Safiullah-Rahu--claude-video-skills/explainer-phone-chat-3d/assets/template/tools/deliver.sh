#!/usr/bin/env bash
# Delivery from a render master (run it under the shared lock):
#   bash "$EXPLAINER_STYLES/tools/with_render_lock.sh" bash tools/deliver.sh scratch/<master>.mp4
# 1) x264 CRF 18 of the master's video + the full mix (score/audio/final.wav, AAC 256k) -> out/<key>.mp4
# 2) the SAME video stream (stream copy) + the effects-only mix (score/audio/final_nomusic.wav) -> out/<key>_nomusic.mp4
# Never -shortest with stream copy: both outputs are cut to the composition length with -t. Then tools/qa.py.
set -u
cd "$(dirname "$0")/.."
KEY="$(basename "$PWD")"
ES="${EXPLAINER_STYLES:-$(cd ../.. && pwd)}"
FF="${FFMPEG:-$ES/engine/node_modules/ffmpeg-static/ffmpeg.exe}"
DUR="$(python -X utf8 -I -c "import json;print(json.load(open('score/timing.json',encoding='utf-8'))['dur'])")"
echo "duration $DUR s"
"$FF" -y -hide_banner -v error -i "$1" -i score/audio/final.wav -map 0:v:0 -map 1:a:0 -t "$DUR" -c:v libx264 -preset slow -crf 18 -maxrate 14M -bufsize 28M \
  -pix_fmt yuv420p -r 30 -c:a aac -b:a 256k -ar 48000 -movflags +faststart "out/$KEY.mp4" || exit 1
"$FF" -y -hide_banner -v error -i "out/$KEY.mp4" -i score/audio/final_nomusic.wav -map 0:v:0 -map 1:a:0 -t "$DUR" -c:v copy -c:a aac -b:a 256k -ar 48000 \
  -movflags +faststart "out/${KEY}_nomusic.mp4" || exit 1
PY="${PYTHON:-python}"
"$PY" -X utf8 -I tools/qa.py

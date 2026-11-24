#!/usr/bin/env bash
# Master -> delivery: x264 CRF 19 + the full mix (assets/audio/final.m4a), then the no-music twin by REMUX (same video
# stream, voice+SFX audio), then QA. Run under the shared lock:
#   bash "tools/with_render_lock.sh" bash tools/deliver.sh scratch/master.mp4
set -u
cd "$(dirname "$0")/.."
KEY="$(python -c "import json;print(json.load(open('film.json'))['slug'])")"
FF="engine/node_modules/ffmpeg-static/ffmpeg.exe"
VD="$(ffprobe -v error -select_streams v:0 -show_entries stream=duration -of csv=p=0 "$1")"
"$FF" -y -hide_banner -v error -i "$1" -i assets/audio/final.m4a -map 0:v:0 -map 1:a:0 -t "$VD" -c:v libx264 -preset slow -crf 19 \
  -pix_fmt yuv420p -r 30 -movflags +faststart -c:a copy "out/$KEY.mp4" || exit 1
"$FF" -y -hide_banner -v error -i "out/$KEY.mp4" -i assets/audio/nomusic.m4a -map 0:v:0 -map 1:a:0 -t "$VD" -c copy -movflags +faststart \
  "out/${KEY}_nomusic.mp4" || exit 1
ls -la out/*.mp4
python -X utf8 -I "engine/qa/analyze_video.py" "out/$KEY.mp4" out/qa > /dev/null
python -X utf8 -I tools/qa.py
python -X utf8 -I tools/whisper_check.py

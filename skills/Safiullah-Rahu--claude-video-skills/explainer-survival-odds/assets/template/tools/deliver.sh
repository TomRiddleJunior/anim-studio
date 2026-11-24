#!/usr/bin/env bash
# Delivery from a render master (run it under the shared lock):
#   bash "$EXPLAINER_STYLES/tools/with_render_lock.sh" bash tools/deliver.sh scratch/<master>.mp4
# 1) x264 CRF 19 of the master's video + the full mix (score/audio/final.wav, AAC 256k) -> out/<key>.mp4
# 2) the SAME video stream (stream copy) + the no-music mix (score/audio/final_nomusic.wav) -> out/<key>_nomusic.mp4
# Never -shortest with stream copy: both outputs are cut to the composition length with -t; the stream durations and
# frame counts are printed (and checked again by tools/qa.py). Then the full QA pass (tools/qa_all.sh).
# Optional per-shot grade: score/grade.vf holds one ffmpeg -vf chain applied in the encode (empty or absent = none).
set -u
cd "$(dirname "$0")/.."
KEY="$(basename "$PWD")"
ES="${EXPLAINER_STYLES:-$(cd ../.. && pwd)}"          # projects live in explainer-styles/samples/<name>
FF="${FFMPEG:-$ES/engine/node_modules/ffmpeg-static/ffmpeg.exe}"
FP="${FFPROBE:-$(dirname "$ES")/ffmpeg-bin/node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe}"
DUR="$(python -I -c "import json;print(json.load(open('vo/data/vo.json'))['duration'])")"
VF=(); if [ -s score/grade.vf ]; then VF=(-vf "$(tr -d '\r\n' < score/grade.vf)"); echo "grade: ${VF[1]}"; fi
echo "duration $DUR s"
"$FF" -y -hide_banner -v error -i "$1" -i score/audio/final.wav -map 0:v:0 -map 1:a:0 -t "$DUR" "${VF[@]}" -c:v libx264 -preset slow -crf 19 -maxrate 14M -bufsize 28M \
  -pix_fmt yuv420p -r 30 -c:a aac -b:a 256k -ar 48000 -movflags +faststart "out/$KEY.mp4" || exit 1
"$FF" -y -hide_banner -v error -i "out/$KEY.mp4" -i score/audio/final_nomusic.wav -map 0:v:0 -map 1:a:0 -t "$DUR" -c:v copy -c:a aac -b:a 256k -ar 48000 \
  -movflags +faststart "out/${KEY}_nomusic.mp4" || exit 1
for f in "out/$KEY.mp4" "out/${KEY}_nomusic.mp4"; do
  echo "$f"; "$FP" -v error -count_frames -show_entries stream=codec_type,duration,nb_read_frames -of compact "$f"
done
bash tools/qa_all.sh

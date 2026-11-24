#!/usr/bin/env bash
# Delivery from a rendered master: x264 CRF 19 + the full mix -> out/<name>.mp4; the voice+SFX mix remuxed onto the SAME
# video stream (no re-render) -> out/<name>_nomusic.mp4; the cover; then the QA (sheets, analyzer, gates, Whisper).
# Never -shortest: both mixes are padded to the film's exact length by tools/sound_design.py.
# usage (under the lock):  bash ".../with_render_lock.sh" bash tools/deliver.sh out/master.mp4 [cover_time]
set -eu
cd "$(dirname "$0")/.."
NAME=$(basename "$PWD")
MASTER="$1"; COVER_T="${2:-0.5}"
FF="engine/node_modules/ffmpeg-static/ffmpeg.exe"
"$FF" -v error -y -i "$MASTER" -i assets/audio/final.m4a -map 0:v:0 -map 1:a:0 -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -r 30 \
  -c:a copy -movflags +faststart "out/$NAME.mp4"
"$FF" -v error -y -i "out/$NAME.mp4" -i score/nomusic.m4a -map 0:v:0 -map 1:a:0 -c:v copy -c:a copy -movflags +faststart "out/${NAME}_nomusic.mp4"
"$FF" -v error -y -ss "$COVER_T" -i "out/$NAME.mp4" -frames:v 1 -q:v 2 out/cover.jpg
PY=python
[ -x "$HOME/anaconda3/python.exe" ] && PY="$HOME/anaconda3/python.exe"
"$PY" -X utf8 -I tools/qa.py "out/$NAME.mp4"
if [ -f tools/whisper_check.py ]; then "$PY" -X utf8 -I tools/whisper_check.py "out/$NAME.mp4"; fi
ls -la out

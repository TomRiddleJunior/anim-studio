#!/usr/bin/env bash
# The analyzer + sheets + gates (tools/qa.py) and the Whisper read-back, in one job. Run it under the shared lock:
#   bash "tools/with_render_lock.sh" bash tools/qa_all.sh
set -u
HERE="$(cd "$(dirname "$0")/.." && pwd)"; cd "$HERE"
export PATH="engine/node_modules/ffmpeg-static:ffmpeg-bin/node_modules/ffprobe-static/bin/win32/x64:$PATH"
python -X utf8 -I tools/qa.py
"$HOME/anaconda3/python.exe" -X utf8 -I tools/whisper_check.py

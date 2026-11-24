#!/usr/bin/env bash
# The full QA pass on the delivered mp4 (run it under the shared lock): analyzer (SRT beside the mp4), YAVG + 2 fps
# sweep + compare sheet (only with --ref) + gates (tools/qa.py), Whisper small on every line (tools/whisper_check.py).
set -u
cd "$(dirname "$0")/.."
KEY="$(basename "$PWD")"
export PATH="engine/node_modules/ffmpeg-static:ffmpeg-bin/node_modules/ffprobe-static/bin/win32/x64:$PATH"
python -X utf8 -I "engine/qa/analyze_video.py" "out/$KEY.mp4" out/qa > /dev/null
"$HOME/.generative-music-video/venv/Scripts/python.exe" -X utf8 -I tools/whisper_check.py
python -X utf8 -I tools/qa.py

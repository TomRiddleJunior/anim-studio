#!/usr/bin/env bash
# The full QA pass on the delivered mp4 (run it under the shared lock): analyzer (SRT beside the mp4), YAVG + 2 fps
# sweep + compare sheet + gates (tools/qa.py), Whisper small on every line (tools/whisper_check.py).
set -u
cd "$(dirname "$0")/.."
KEY="$(basename "$PWD")"
python -I "engine/qa/analyze_video.py" "out/$KEY.mp4" out/qa
python -I tools/qa.py
"$HOME/.generative-music-video/venv/Scripts/python.exe" -I tools/whisper_check.py

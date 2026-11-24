#!/usr/bin/env bash
# The full QA pass on the delivered mp4s (run it under the shared lock): the engine analyzer (SRT beside the mp4),
# tools/qa.py (YAVG, edge bands, 2 fps sweeps, compare sheet, gates for both mixes), Whisper small on every line.
set -u
cd "$(dirname "$0")/.."
KEY="$(basename "$PWD")"
ES="${EXPLAINER_STYLES:-$(cd ../.. && pwd)}"
python -I "$ES/engine/qa/analyze_video.py" "out/$KEY.mp4" out/qa > /dev/null
python -I tools/qa.py
"$HOME/.generative-music-video/venv/Scripts/python.exe" -I tools/whisper_check.py

#!/usr/bin/env bash
# Voice the narration with Kokoro under the shared render lock: vo/script.json -> vo/tts/{audio/vo.wav, data/vo.json}
# (the raw take; tools/build.py places each line on the film's clock and writes vo/data/vo.json in film time).
# usage: bash tools/voice.sh            (from the project root)
set -eu
cd "$(dirname "$0")/.."
mkdir -p vo/tts
cp vo/script.json vo/tts/script.json
PY="${EXPLAINER_PY:-$HOME/.generative-music-video/venv/Scripts/python.exe}"
LOCK_SH="tools/with_render_lock.sh"
if [ -f "$LOCK_SH" ]; then
  bash "$LOCK_SH" "$PY" -I "$HOME/.claude/skills/explainer-engine/engine/audio/tts.py" vo/tts
else
  "$PY" -I "$HOME/.claude/skills/explainer-engine/engine/audio/tts.py" vo/tts
fi

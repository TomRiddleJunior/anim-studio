#!/usr/bin/env bash
# One episode of "Conversations Beyond Time": episode.json -> out/<name>.mp4 (+ .srt, cover.jpg, qa/), any length.
# usage: bash make_episode.sh [step]     steps: script voice pick join align timeline score render qa (default: all, in order)
# Run from a project made by  bash ~/.claude/skills/explainer-zeythar-conversations/assets/tools/new_episode.sh <dir>
# The voice and render steps go through the shared render lock. SEEDS=1,2,3 (default 1,2) sets the takes per line.
# Nothing is posted anywhere.
set -euo pipefail
cd "$(dirname "$0")"
NAME="$(basename "$PWD")"
PY="$HOME/.generative-music-video/venv/Scripts/python.exe"          # numpy/scipy/soundfile
QPY="tts-bench/venvs/qwen/Scripts/python.exe"          # Qwen3-TTS 1.7B VoiceDesign
CPY="tts-bench/venvs/chatterbox/Scripts/python.exe"    # VoiceEncoder + faster-whisper small.en + librosa
APY="python"                                                          # anaconda: OpenCV, PIL, faster-whisper small
FF="ffmpeg-bin/node_modules/ffmpeg-static/ffmpeg.exe"
LOCK="tools"
export HF_HOME="tts-bench\hf" TORCH_THREADS=8
export PATH="engine/node_modules/ffmpeg-static:ffmpeg-bin/node_modules/ffprobe-static/bin/win32/x64:$PATH"
SEEDS="${SEEDS:-1,2}"
step="${1:-all}"
run() { [ "$step" = all ] || [ "$step" = "$1" ]; }
mkdir -p vo/data vo/lines vo/takes score/data score/audio out/qa logs assets/audio
if run script;   then $APY -I tools/episode.py episode.json voices.json; fi
if run voice;    then bash "$LOCK/with_render_lock.sh" "$QPY" -I tools/voice_qwen.py --seeds "$SEEDS" --no-anchors 2>&1 | grep -v pad_token | tee logs/voice.log; fi
if run pick;     then "$CPY" -I tools/pick_takes.py 2>&1 | grep -E "PICK|anchor|wer" | tee logs/pick.log; fi
if run join;     then "$PY" -I tools/join_vo.py; fi
if run align;    then $APY -I tools/align_vo.py 2>&1 | grep -v -i warning | tail -3; fi
if run timeline; then "$PY" -I tools/timeline.py; $APY -I tools/layout_check.py; fi
if run score;    then "$PY" -I tools/score.py; "$FF" -v error -y -i score/audio/final.wav -c:a aac -b:a 256k assets/audio/final.m4a; fi
if run render;   then
  bash "$LOCK/render_locked.sh" "$PWD" "out/$NAME.master.mp4" delivery | tail -2
  "$FF" -v error -y -i "out/$NAME.master.mp4" -c:v libx264 -preset slow -crf 20 -profile:v high -pix_fmt yuv420p -movflags +faststart -c:a copy "out/$NAME.mp4"
fi
if run qa;       then
  $APY -I "engine/qa/analyze_video.py" "out/$NAME.mp4" out/qa | tail -1 || true
  $APY -I tools/qa_sheets.py all
  $APY -I tools/whisper_check.py 2>&1 | grep -v -i warn
  $APY -I tools/layout_check.py
  $APY -I tools/make_cover.py
  "$FF" -hide_banner -i "out/$NAME.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" | tail -2
fi

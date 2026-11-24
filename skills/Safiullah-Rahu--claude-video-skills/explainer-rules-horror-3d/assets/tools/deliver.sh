#!/usr/bin/env bash
# Encode the HyperFrames master to the delivery file and run the QA passes.
#   video: the master re-encoded, x264 CRF 21 (the master is ~700 MB of grain and dither)
#   audio: the engine's -14 LUFS mix as encoded for the composition (assets/audio/final.m4a), untouched — the
#          HyperFrames render re-mixes its audio ~0.7 dB quieter — cut to the video's exact length (-t, not -shortest:
#          with a copied audio stream -shortest ended the video 3.5 s early)
# usage (inside the shared lock): bash tools/deliver2.sh <project_dir> <name>
set -u
P="$1"; NAME="$2"
FF="engine/node_modules/ffmpeg-static/ffmpeg.exe"
FP="ffmpeg-bin/node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe"
ENGINE="$HOME/.claude/skills/explainer-engine/engine"
cd "$P" || exit 1
VD=$("$FP" -v error -select_streams v:0 -show_entries stream=duration -of csv=p=0 scratch/master.mp4)
echo "master video $VD s"
"$FF" -y -v error -i scratch/master.mp4 -i assets/audio/final.m4a -map 0:v:0 -map 1:a:0 -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -movflags +faststart -c:a copy -t "$VD" "out/$NAME.mp4" || exit 1
"$FP" -v error -show_entries stream=codec_type,duration,nb_frames -of compact "out/$NAME.mp4"
ls -la "out/$NAME.mp4"
python -I "$ENGINE/qa/analyze_video.py" "out/$NAME.mp4" out/qa > out/qa/analyze.log 2>&1; tail -3 out/qa/analyze.log
python -I tools/qa_sheets.py all
python -I tools/scene_events.py
"$FF" -hide_banner -i "out/$NAME.mp4" -af ebur128=peak=true -f null - 2>&1 | tail -12 | grep -E "I:|Peak:"
python -I tools/whisper_check.py

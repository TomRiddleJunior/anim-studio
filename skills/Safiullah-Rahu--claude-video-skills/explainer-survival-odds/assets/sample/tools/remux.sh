#!/usr/bin/env bash
# Audio-only redelivery (run it under the shared lock), for a sound change after the picture is accepted:
#   bash "$EXPLAINER_STYLES/tools/with_render_lock.sh" bash tools/remux.sh <graded video source.mp4>
# The source is a copy of the delivered out/<key>.mp4 (its video is already graded; never pass out/<key>.mp4 itself,
# ffmpeg would read and write the same file). The video stream is copied (no re-encode, no grade.vf), the two mixes
# (score/audio/final.wav, final_nomusic.wav) are encoded to AAC 256k, both cut to the composition length with -t
# (never -shortest). Then the full QA pass (tools/qa_all.sh).
set -u
cd "$(dirname "$0")/.."
KEY="$(basename "$PWD")"
ES="${EXPLAINER_STYLES:-$(cd ../.. && pwd)}"
FF="${FFMPEG:-$ES/engine/node_modules/ffmpeg-static/ffmpeg.exe}"
FP="${FFPROBE:-$(dirname "$ES")/ffmpeg-bin/node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe}"
DUR="$(python -I -c "import json;print(json.load(open('vo/data/vo.json'))['duration'])")"
echo "duration $DUR s · video from $1 (stream copy)"
for pair in "final.wav:out/$KEY.mp4" "final_nomusic.wav:out/${KEY}_nomusic.mp4"; do
  "$FF" -y -hide_banner -v error -i "$1" -i "score/audio/${pair%%:*}" -map 0:v:0 -map 1:a:0 -t "$DUR" -c:v copy \
    -c:a aac -b:a 256k -ar 48000 -movflags +faststart "${pair#*:}" || exit 1
done
for f in "out/$KEY.mp4" "out/${KEY}_nomusic.mp4"; do
  echo "$f"; "$FP" -v error -count_frames -show_entries stream=codec_type,duration,nb_read_frames -of compact "$f"
done
bash tools/qa_all.sh

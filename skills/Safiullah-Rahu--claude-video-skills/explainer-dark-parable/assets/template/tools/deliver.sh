#!/usr/bin/env bash
# Encode a render master into the two deliveries and run the QA pass. Run it under the shared lock:
#   bash "tools/with_render_lock.sh" bash tools/deliver.sh scratch/master.mp4
#   out/<key>.mp4          x264 CRF 19 + assets/audio/final.m4a (full mix, original music bed)
#   out/<key>_nomusic.mp4  the SAME video stream (copied, never re-rendered) + assets/audio/nomusic.m4a (voice + SFX)
# No -shortest anywhere: the stream lengths are checked afterwards.
set -u
cd "$(dirname "$0")/.."
KEY="$(basename "$PWD")"
FF="engine/node_modules/ffmpeg-static/ffmpeg.exe"
"$FF" -y -hide_banner -v error -i "$1" -i assets/audio/final.m4a -map 0:v:0 -map 1:a:0 -c:v libx264 -preset slow -crf 19 -maxrate 14M -bufsize 28M \
  -pix_fmt yuv420p -r 30 -movflags +faststart -c:a copy "out/$KEY.mp4" || exit 1
"$FF" -y -hide_banner -v error -i "out/$KEY.mp4" -i assets/audio/nomusic.m4a -map 0:v:0 -map 1:a:0 -c:v copy -c:a copy -movflags +faststart "out/${KEY}_nomusic.mp4" || exit 1
for f in "out/$KEY.mp4" "out/${KEY}_nomusic.mp4"; do
  echo "$f: $(ffprobe -v error -show_entries stream=codec_type,duration -of csv=p=0 "$f" | tr '\n' ' ')"
done
bash tools/qa_all.sh

#!/usr/bin/env bash
# Make a new "Conversations Beyond Time" episode project from the skill: the runnable template + the character plate +
# the two voice anchors (so Zeythar and the girl keep the same voices).
# usage: bash ~/.claude/skills/explainer-zeythar-conversations/assets/tools/new_episode.sh "samples/zeythar-<topic>" [episode.json]
# Then edit <dir>/episode.json (EPISODE_GUIDE.md; four ready ones in assets/episodes/) and run: bash <dir>/make_episode.sh
set -euo pipefail
SK="$(cd "$(dirname "$0")/../.." && pwd)"
DST="$1"
[ -e "$DST" ] && { echo "exists: $DST"; exit 1; }
mkdir -p "$DST"
cp -r "$SK/assets/template/." "$DST/"
mkdir -p "$DST/plate" "$DST/vo/anchors" "$DST/assets/plate" "$DST/assets/audio" "$DST/assets/ref"
cp "$SK"/assets/plate/{bg.jpg,zeythar.png,girl.png,girl_closed.png,lines.png,regions_girl.png,regions_girl2.png,regions_zeythar.png,landmarks.json} "$DST/plate/"
cp "$SK/assets/plate/keyart.png" "$DST/assets/ref/keyart.png"
cp "$SK/assets/plate/keyart_sr2x.png" "$DST/assets/ref/keyart_sr2x.png"   # learned 2x, used if plate_build.py is re-run
if [ -f "$SK/assets/voices/Z_anchor.wav" ] && [ -f "$SK/assets/voices/L_anchor.wav" ]; then
  cp "$SK"/assets/voices/{Z_anchor.wav,L_anchor.wav} "$DST/vo/anchors/"
else
  # the series voice anchors (.wav) are not included in the public repository: make them once per project
  echo "note: voice anchors not included. After 'bash make_episode.sh script', run tools/voice_qwen.py --skip-lines"
  echo "      (Qwen venv) for anchor candidates; the pick step keeps the most typical one as vo/anchors/<who>_anchor.wav."
fi
cp "$SK/assets/voices/voices.json" "$DST/voices.json"
[ -n "${2:-}" ] && cp "$2" "$DST/episode.json"
NAME="$(basename "$DST")"
sed -i "s/\"zeythar-episode\"/\"$NAME\"/g" "$DST/package.json" "$DST/meta.json" 2>/dev/null || true
echo "new episode at $DST — edit episode.json, then: bash \"$DST/make_episode.sh\""

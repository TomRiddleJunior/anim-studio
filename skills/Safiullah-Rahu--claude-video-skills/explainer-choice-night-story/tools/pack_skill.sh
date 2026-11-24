#!/usr/bin/env bash
# Copy a finished sample project into its skill: assets/template (a runnable project: sources, generated compositions,
# fonts, the mix, vo/script.json + vo/data/vo.json, tools; no renders) and assets/sample (the same plus SCRIPT/SAMPLE/POST,
# out/qa sheets, out/cover.jpg and the SRT; no mp4s), and the kit + tools at the skill root.
# usage: bash pack_skill.sh <project_dir> <skill_dir> <kit file in assets/lib>
set -eu
P="$1"; S="$2"; KIT="$3"
for D in template sample; do
  T="$S/assets/$D"; mkdir -p "$T"
  cp "$P/index.html" "$P/hyperframes.json" "$P/package.json" "$P/meta.json" "$T/"
  cp -r "$P/compositions" "$P/tools" "$T/"
  mkdir -p "$T/assets" "$T/vo/data"
  cp -r "$P/assets/fonts" "$P/assets/lib" "$P/assets/audio" "$T/assets/"
  cp "$P/vo/script.json" "$T/vo/"; cp "$P/vo/data/vo.json" "$T/vo/data/"
  true
done
T="$S/assets/sample"
cp "$P/SCRIPT.md" "$P/SAMPLE.md" "$P/POST.md" "$T/"
mkdir -p "$T/out/qa"; cp "$P/out/"*.srt "$P/out/cover.jpg" "$T/out/" 2>/dev/null || true
cp "$P/out/qa/"*.json "$P/out/qa/"*.jpg "$P/out/qa/"*.txt "$T/out/qa/" 2>/dev/null || true
mkdir -p "$T/score"; cp "$P/score/levels.json" "$T/score/" 2>/dev/null || true
mkdir -p "$S/assets/kit" "$S/tools"
cp "$P/assets/lib/$KIT" "$S/assets/kit/"
cp "$P/tools/"*.py "$P/tools/"*.sh "$P/tools/qa_config.json" "$S/tools/"
du -sh "$S"

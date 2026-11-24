"""Write SCRIPT.md: every spoken line with its times, the shot(s) on screen and what the overlays do.
usage: python -X utf8 -I tools/script_md.py <shot_notes.json> <title>
shot_notes.json: {"<shot id>": "what is on screen", ...}; times come from vo/data/vo.json and score/shots.json."""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
SH = json.load(open(os.path.join(ROOT, "score", "shots.json"), encoding="utf-8"))["shots"]
notes = json.load(open(sys.argv[1], encoding="utf-8"))
title = sys.argv[2] if len(sys.argv) > 2 else os.path.basename(ROOT)
out = [f"# SCRIPT — {title}", "", f"{VO['duration']:.2f} s · {VO['words']} words · {VO['wpm_overall']} WPM overall · voice {VO['voice']}", "",
       "## Shots", "", "| # | shot | in–out (s) | on screen |", "|---|---|---|---|"]
for i, s in enumerate(SH):
    out.append(f"| {i + 1} | {s['id']} | {s['t0']:.2f}–{s['t1']:.2f} | {notes.get(s['id'], '')} |")
out += ["", "## Lines", "", "| id | in–out (s) | line | shot(s) |", "|---|---|---|---|"]
for l in VO["lines"]:
    ids = [s["id"] for s in SH if s["t0"] < l["end"] and s["t1"] > l["start"]]
    out.append(f"| {l['id']} | {l['start']:.2f}–{l['end']:.2f} | {l['text']} | {', '.join(ids)} |")
open(os.path.join(ROOT, "SCRIPT.md"), "w", encoding="utf-8").write("\n".join(out) + "\n")
print("SCRIPT.md", len(SH), "shots", len(VO["lines"]), "lines")

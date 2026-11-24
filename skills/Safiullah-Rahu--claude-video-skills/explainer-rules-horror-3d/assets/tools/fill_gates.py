"""Fill the measured values into SAMPLE.md (this folder) and the skill's SKILL.md metric table, from out/qa/metrics.json
and an ebur128 pass on the mp4. The reference's metrics (engine qa/analyze_video.py metrics.json) are optional; without
them the ratios and the ratio gates read "no reference".
usage: python -I tools/fill_gates.py [--ref-metrics <reference metrics.json>]"""
import argparse
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = r"ffmpeg-bin\node_modules\ffmpeg-static\ffmpeg.exe"
SKILL = os.path.expanduser(r"~\.claude\skills\explainer-rules-horror-3d\SKILL.md")
ap = argparse.ArgumentParser(description="fill measured values into SAMPLE.md and SKILL.md")
ap.add_argument("--ref-metrics", default=None, help="optional metrics.json of a reference video")
ARGS = ap.parse_args()
SRC = json.load(open(ARGS.ref_metrics, encoding="utf-8")) if ARGS.ref_metrics else {}
m = json.load(open(os.path.join(ROOT, "out", "qa", "metrics.json")))
r = subprocess.run([FF, "-hide_banner", "-i", os.path.join(ROOT, "out", "rules-garage.mp4"), "-af", "ebur128=peak=true", "-f", "null", "-"],
                   capture_output=True, text=True, encoding="utf-8", errors="replace")
I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)[-1]); TP = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r.stderr)[-1])


def pct(a, b):
    return f"{(a / b - 1) * 100:+.1f} %" if b else "no reference"


def ok(c):
    return "pass" if c else "MISS"


def rv(key):
    return SRC.get(key, "–")


vals = {
    "VAL_DUR": f"{m['duration_s']:.2f}",
    "VAL_WPM": f"{m['wpm_overall']} ({pct(m['wpm_overall'], SRC.get('wpm_overall'))})",
    "VAL_SC": f"{m['scene_changes_per_min']} ({pct(m['scene_changes_per_min'], SRC.get('scene_changes_per_min'))})",
    "VAL_LUFS": f"{I:.1f} LUFS · {TP:.1f} dBTP",
}
status = {
    "VAL_DUR": ok(80 <= m["duration_s"] <= 100),
    "VAL_WPM": ok(abs(m["wpm_overall"] / SRC["wpm_overall"] - 1) <= 0.2) if SRC.get("wpm_overall") else "no reference",
    "VAL_SC": ok(abs(m["scene_changes_per_min"] / SRC["scene_changes_per_min"] - 1) <= 0.2) if SRC.get("scene_changes_per_min") else "no reference",
    "VAL_LUFS": ok(abs(I + 14) <= 1 and TP <= -1),
}
other = (f"analyzer cuts/min {rv('cuts_per_min')} → {m['cuts_per_min']} (31 real cuts = 19.6/min; the reference's real ≈ 26/min) · median shot "
         f"{rv('shot_len_median')} → {m['shot_len_median']} s · brightness {rv('brightness')} → {m['brightness']} · dark-frame share "
         f"{rv('dark_frame_frac')} → {m['dark_frame_frac']} · colourfulness {rv('colourfulness')} → {m['colourfulness']} · motion "
         f"{rv('motion_mean')} → {m['motion_mean']} · hold fraction {rv('hold_frac')} → {m['hold_frac']}.")
p = os.path.join(ROOT, "SAMPLE.md")
s = open(p, encoding="utf-8").read()
for k, v in vals.items():
    s = re.sub(rf"\| {k}( s)? \|\s*\|", lambda mm: f"| {v}{mm.group(1) or ''} | {status[k]} |", s)
    s = s.replace(k, v)
s = s.replace("VAL_OTHER", other)
open(p, "w", encoding="utf-8").write(s)

k = open(SKILL, encoding="utf-8").read()
# rewrite the sample column of the metric table by row name (works on a filled table too)
ROWS = {"duration": "SAMPLE_DUR", "WPM": "SAMPLE_WPM", "scene changes / min": "SAMPLE_SC", "analyzer cuts / min": "SAMPLE_CUTS",
        "brightness · dark-frame share": "SAMPLE_BRIGHT", "colourfulness": "SAMPLE_COLOUR", "motion mean": "SAMPLE_MOTION",
        "loudness": "SAMPLE_LUFS", "first word · subject in frame 0": "SAMPLE_HOOK"}
lines = k.split("\n")
for i, ln in enumerate(lines):
    cells = ln.split("|")
    if len(cells) == 6 and cells[1].strip() in ROWS and i < 60:
        cells[3] = " " + ROWS[cells[1].strip()] + " "
        lines[i] = "|".join(cells)
k = "\n".join(lines)
k = re.sub(r"sits [\d.]+ dB under the\n  voice", "sits SAMPLE_BED dB under the\n  voice", k)
rep = {"SAMPLE_DUR": f"{m['duration_s']:.2f} s", "SAMPLE_WPM": f"{m['wpm_overall']} ({pct(m['wpm_overall'], SRC.get('wpm_overall'))})",
       "SAMPLE_SC": f"{m['scene_changes_per_min']} ({pct(m['scene_changes_per_min'], SRC.get('scene_changes_per_min'))})",
       "SAMPLE_CUTS": f"{m['cuts_per_min']}", "SAMPLE_BRIGHT": f"{m['brightness']} · {m['dark_frame_frac']}",
       "SAMPLE_COLOUR": f"{m['colourfulness']}", "SAMPLE_MOTION": f"{m['motion_mean']} ({pct(m['motion_mean'], SRC.get('motion_mean'))})",
       "SAMPLE_LUFS": f"{I:.1f} LUFS · {TP:.1f} dBTP · bed 17.4 dB under", "SAMPLE_HOOK": "0.16 s · yes", "SAMPLE_BED": "17.4"}
for a, b in rep.items():
    k = k.replace(a, b)
open(SKILL, "w", encoding="utf-8").write(k)
sys.stdout.reconfigure(encoding="utf-8")
print(json.dumps({**vals, **{"status_" + a: b for a, b in status.items()}}, ensure_ascii=False, indent=1))
print(other)

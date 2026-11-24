"""QA for a survival-scenario reel (run after the render):
  out/qa/yavg.json       per-frame YAVG (ffmpeg signalstats); flags v[i] < 0.6*min(nbrs) or v[i] < v[i-1] - 50, minus planned dips
  out/qa/sweep_NN.jpg    2 fps sweep of the real mp4, 40 tiles per sheet with timestamps (look at every one)
  out/qa/compare.jpg     reference | ours at 14 matched beats (same role in the format); only with --ref
  out/qa/gates.json      duration, hook (first word), WPM, loudness/true peak, voice vs bed; with --ref-metrics also
                         the reference's metrics (engine qa/analyze_video.py metrics.json) side by side

usage: python -I tools/qa.py [out/<key>.mp4] [--ref <reference.mp4>] [--ref-metrics <reference metrics.json>]
       (anaconda python: numpy + PIL). The reference is optional; nothing is compared when it is not given.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = os.path.basename(ROOT)
ES = os.path.dirname(os.path.dirname(ROOT))
FF = os.path.join(ES, "engine", "node_modules", "ffmpeg-static", "ffmpeg.exe")
if not os.path.exists(FF):
    FF = shutil.which("ffmpeg") or FF
ap = argparse.ArgumentParser(description="QA for a survival-scenario reel")
ap.add_argument("mp4", nargs="?", default=os.path.join(ROOT, "out", KEY + ".mp4"), help="the delivered reel (default out/<key>.mp4)")
ap.add_argument("--ref", default=None, help="optional reference video for compare.jpg")
ap.add_argument("--ref-metrics", default=None, help="optional metrics.json of the reference (engine qa/analyze_video.py)")
ARGS = ap.parse_args()
MP4 = ARGS.mp4
QA = os.path.join(ROOT, "out", "qa")
SRC = ARGS.ref
SRC_M = json.load(open(ARGS.ref_metrics, encoding="utf-8")) if ARGS.ref_metrics else {}
os.makedirs(QA, exist_ok=True)
TM = json.load(open(os.path.join(ROOT, "score", "timing.json"), encoding="utf-8"))
T = TM["T"]


def font(sz):
    for f in (r"C:\Windows\Fonts\arialbd.ttf", r"C:\Windows\Fonts\arial.ttf"):
        if os.path.exists(f):
            return ImageFont.truetype(f, sz)
    return ImageFont.load_default()


def grab(path, t, w):
    r = subprocess.run([FF, "-v", "error", "-ss", f"{max(0, t):.3f}", "-i", path, "-frames:v", "1", "-vf", f"scale={w}:-2", "-f", "image2pipe", "-vcodec", "png", "-"],
                       capture_output=True)
    from io import BytesIO
    return Image.open(BytesIO(r.stdout)).convert("RGB")


# ------------------------------------------------------------------ YAVG dips
r = subprocess.run([FF, "-hide_banner", "-i", MP4, "-vf", "signalstats,metadata=print:key=lavfi.signalstats.YAVG", "-an", "-f", "null", "-"],
                   capture_output=True, text=True, encoding="utf-8", errors="replace")
v = [float(x) for x in re.findall(r"lavfi\.signalstats\.YAVG=([0-9.]+)", r.stderr)]
planned = [(T["B"] - 0.1, T["B"] + 0.4), (T["Q"] - 0.1, T["Q"] + 0.4), (T["S"] - 0.1, T["S"] + 0.7)]  # dips through black, by design
flags = []
for i in range(1, len(v) - 1):
    a = v[i] < 0.6 * min(v[i - 1], v[i + 1])
    b = v[i] < v[i - 1] - 50
    if a or b:
        t = i / 30
        flags.append({"frame": i, "t": round(t, 3), "prev": round(v[i - 1], 1), "v": round(v[i], 1), "next": round(v[i + 1], 1),
                      "rule": "0.6*min" if a else "drop>50", "planned": any(p0 <= t <= p1 for p0, p1 in planned)})
jumps = sorted(((abs(v[i] - v[i - 1]), i) for i in range(1, len(v))), reverse=True)[:30]
json.dump({"frames": len(v), "min": round(min(v), 1), "max": round(max(v), 1), "mean": round(float(np.mean(v)), 1), "flags": flags,
           "unplanned_flags": [f for f in flags if not f["planned"]],
           "largest_steps": [{"t": round(i / 30, 3), "from": round(v[i - 1], 1), "to": round(v[i], 1)} for _, i in sorted(jumps, key=lambda x: x[1])]},
          open(os.path.join(QA, "yavg.json"), "w"), indent=1)
print(f"YAVG {min(v):.1f}-{max(v):.1f} mean {np.mean(v):.1f}; flags {len(flags)} (unplanned {sum(1 for f in flags if not f['planned'])})")

# ------------------------------------------------------------------ 2 fps sweep sheets (real mp4)
tw, th = 216, 384
frames = []
p = subprocess.Popen([FF, "-v", "error", "-i", MP4, "-vf", f"fps=2,scale={tw}:{th}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
while True:
    buf = p.stdout.read(tw * th * 3)
    if len(buf) < tw * th * 3:
        break
    frames.append(Image.frombytes("RGB", (tw, th), buf))
p.wait()
f12 = font(16)
per = 40
for s in range(0, len(frames), per):
    chunk = frames[s:s + per]
    cols = 10
    rows = (len(chunk) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, rows * (th + 22)), (16, 16, 16))
    d = ImageDraw.Draw(sheet)
    for k, im in enumerate(chunk):
        x, y = (k % cols) * tw, (k // cols) * (th + 22)
        sheet.paste(im, (x, y + 22))
        d.text((x + 4, y + 3), f"{(s + k) / 2:.1f}s", fill=(230, 230, 230), font=f12)
    sheet.save(os.path.join(QA, f"sweep_{s // per + 1:02d}.jpg"), quality=86)
print(f"sweep: {len(frames)} frames in {(len(frames) + per - 1) // per} sheets")

# ------------------------------------------------------------------ compare.jpg: 14 matched beats (only with --ref)
# (label, reference time as a fraction of the reference's duration, our time in s)
BEATS = [("hook: the place, frame 1 subject", 0.0136, 1.5), ("thesis payoff (green)", 0.0679, 6.6), ("open loop: black + red eyes", 0.1132, 11.8),
         ("meet her + name tag", 0.1448, 14.6), ("routine chips", 0.2354, 24.6), ("the turn (red)", 0.2716, 28.6),
         ("radio message panel", 0.3757, 38.4), ("decision: '?'", 0.4210, 43.7), ("why not: the danger (red)", 0.4979, 50.6),
         ("the advantage tag", 0.5839, 60.0), ("inventory card", 0.7605, 74.2), ("checklist ticks", 0.8963, 84.0),
         ("cliffhanger (black)", 0.9325, 91.0), ("end card: DAY 2", 0.9822, 97.0)]


def duration(path):
    r = subprocess.run([FF, "-hide_banner", "-i", path], capture_output=True, text=True, encoding="utf-8", errors="replace")
    m_ = re.search(r"Duration:\s*(\d+):(\d+):([\d.]+)", r.stderr)
    return int(m_.group(1)) * 3600 + int(m_.group(2)) * 60 + float(m_.group(3)) if m_ else 0.0


if SRC:
    ref_dur = duration(SRC)
    TW, TH = 240, 427
    cols = 7
    rows = 2
    cell_w, cell_h = TW * 2 + 18, TH + 46
    sheet = Image.new("RGB", (cols * cell_w, rows * cell_h), (14, 14, 14))
    d = ImageDraw.Draw(sheet)
    for k, (lab, fr, to) in enumerate(BEATS):
        ts = fr * ref_dur
        x, y = (k % cols) * cell_w, (k // cols) * cell_h
        a = grab(SRC, ts, TW).resize((TW, TH))
        b = grab(MP4, to, TW).resize((TW, TH))
        sheet.paste(a, (x + 4, y + 40)); sheet.paste(b, (x + TW + 10, y + 40))
        d.text((x + 6, y + 4), f"{k + 1}. {lab}", fill=(240, 240, 240), font=font(15))
        d.text((x + 6, y + 22), f"reference {ts:.1f}s", fill=(160, 160, 160), font=font(13))
        d.text((x + TW + 12, y + 22), f"ours {to:.1f}s", fill=(247, 183, 51), font=font(13))
    sheet.save(os.path.join(QA, "compare.jpg"), quality=88)
    print("compare.jpg written (LEFT: reference, RIGHT: ours)")
else:
    print("compare.jpg skipped (no --ref)")

# ------------------------------------------------------------------ gates
m = json.load(open(os.path.join(QA, "metrics.json"), encoding="utf-8")) if os.path.exists(os.path.join(QA, "metrics.json")) else {}
lev = json.load(open(os.path.join(ROOT, "score", "levels.json"), encoding="utf-8"))
vo = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", MP4, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
I_ = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
TP_ = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r.stderr)
dur = m.get("duration_s")
words = vo["words"]
g = {
    "duration_s": dur, "duration_gate": "80-100 s",
    "first_word_s": vo["lines"][0]["start"], "hook_gate": "<= 0.4 s",
    "wpm_overall_vo": round(words / vo["duration"] * 60, 1), "wpm_analyzer": m.get("wpm_overall"), "wpm_reference": SRC_M.get("wpm_overall"),
    "wpm_ratio": round(m.get("wpm_overall", 0) / SRC_M["wpm_overall"], 3) if m.get("wpm_overall") and SRC_M.get("wpm_overall") else None,
    "scene_changes_per_min": m.get("scene_changes_per_min"), "scene_changes_reference": SRC_M.get("scene_changes_per_min"),
    "scene_ratio": round(m.get("scene_changes_per_min", 0) / SRC_M["scene_changes_per_min"], 3) if m.get("scene_changes_per_min") is not None and SRC_M.get("scene_changes_per_min") else None,
    "cuts_per_min": m.get("cuts_per_min"), "cuts_reference": SRC_M.get("cuts_per_min"),
    "motion_mean": m.get("motion_mean"), "motion_reference": SRC_M.get("motion_mean"),
    "brightness": m.get("brightness"), "brightness_reference": SRC_M.get("brightness"),
    "colourfulness": m.get("colourfulness"), "colourfulness_reference": SRC_M.get("colourfulness"),
    "lufs_mp4": float(I_[-1]) if I_ else None, "true_peak_mp4_dbfs": float(TP_[-1]) if TP_ else None,
    "bed_re_voice_db": lev["bed_re_vo_db"], "bed_plus_sfx_re_voice_db": lev["bed_plus_sfx_re_vo_db"],
    "yavg_unplanned_flags": sum(1 for f in flags if not f["planned"]),
}
json.dump(g, open(os.path.join(QA, "gates.json"), "w"), indent=1)
print(json.dumps(g, indent=1))

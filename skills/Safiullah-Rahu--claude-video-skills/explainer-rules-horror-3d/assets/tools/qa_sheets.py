"""QA sheets for the rendered reel.
  sweep   out/qa/sweep_2fps_<k>.jpg  every frame at 2 fps of the REAL mp4 (two sheets, 10 columns, timestamps)
  compare out/qa/compare.jpg         a reference video (left) vs ours (right) at 12 matched beats, same scale; only with --ref
  yavg    out/qa/yavg.json           per-frame mean luma; flags frame i when v[i] < 0.6*min(v[i-1], v[i+1]) or a drop > 50

usage: python -I tools/qa_sheets.py [sweep|compare|yavg|all] [--ref <reference.mp4>]
"""
import argparse
import json
import os
import re
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = os.path.basename(ROOT)
FF = r"ffmpeg-bin\node_modules\ffmpeg-static\ffmpeg.exe"
MP4 = os.environ.get("QA_MP4") or os.path.join(ROOT, "out", NAME + ".mp4")
SRC = None  # optional reference video, set from --ref
QA = os.path.join(ROOT, "out", "qa")
os.makedirs(QA, exist_ok=True)
try:
    FB = ImageFont.truetype("arialbd.ttf", 15); FS = ImageFont.truetype("arial.ttf", 13)
except OSError:
    FB = FS = ImageFont.load_default()

# (label, reference t, ours t) — matched by role in the format; ours from tools/shots_table.py mid-points
BEATS = [("hook: lone figure, one-point wide", 1.0, 1.6), ("the gate / shutter slams behind you", 4.6, 9.6),
         ("place-name sign", 6.8, 11.6), ("phone insert: battery", 12.3, 18.8), ("ECU: annoyed, no signal", 14.3, 20.9),
         ("board: no way out until morning", 18.8, 25.3), ("the note / card insert", 33.2, 39.7), ("ECU: smile, 'just a joke'", 41.0, 48.0),
         ("clock: midnight", 46.6, 53.0), ("lights change: the threat begins", 53.6, 58.0), ("the note again, rule boxed", 69.2, 70.2),
         ("the black twin right behind", 79.5, 75.7), ("in-scene choice labels", 89.5, 84.9), ("final ECU + labels top", 97.5, 93.6)]


def grab(path, t, w, h):
    p = subprocess.run([FF, "-v", "error", "-ss", f"{t:.3f}", "-i", path, "-frames:v", "1", "-vf", f"scale={w}:{h}:flags=area",
                        "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
    return Image.fromarray(np.frombuffer(p.stdout, np.uint8).reshape(h, w, 3))


def frames_2fps(path, w, h):
    p = subprocess.run([FF, "-v", "error", "-i", path, "-vf", f"fps=2,scale={w}:{h}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
    a = np.frombuffer(p.stdout, np.uint8)
    return a.reshape(-1, h, w, 3)


def sweep():
    tw, th, cols = 162, 288, 10
    fr = frames_2fps(MP4, tw, th)
    half = (len(fr) + 1) // 2
    for k, chunk in enumerate((fr[:half], fr[half:])):
        rows = (len(chunk) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * tw, rows * (th + 18) + 26), (18, 18, 20))
        d = ImageDraw.Draw(sheet)
        d.text((6, 5), f"{NAME} · 2 fps sweep of the rendered mp4 · part {k + 1}/2", fill=(235, 235, 235), font=FB)
        for i, f in enumerate(chunk):
            n = i + k * half
            x, y = (i % cols) * tw, 26 + (i // cols) * (th + 18)
            sheet.paste(Image.fromarray(f), (x, y + 18))
            d.text((x + 4, y + 2), f"{n / 2:5.1f}s", fill=(255, 214, 90), font=FS)
        out = os.path.join(QA, f"sweep_2fps_{k + 1}.jpg")
        sheet.save(out, quality=86)
        print(out, len(chunk), "frames")


def compare():
    if not SRC:
        print("compare.jpg skipped (no --ref)")
        return
    tw, th, cols = 216, 384, 4
    beats = BEATS[:12] if len(BEATS) > 12 else BEATS
    beats = [b for i, b in enumerate(BEATS) if i not in (2, 7)]  # 12 beats
    rows = (len(beats) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (2 * tw + 14), rows * (th + 44) + 30), (20, 20, 22))
    d = ImageDraw.Draw(sheet)
    d.text((8, 7), f"LEFT: reference   RIGHT: ours, {NAME} — 12 beats matched by role, same scale", fill=(235, 235, 235), font=FB)
    for i, (lab, ts, to) in enumerate(beats):
        x, y = (i % cols) * (2 * tw + 14), 30 + (i // cols) * (th + 44)
        sheet.paste(grab(SRC, ts, tw, th), (x, y + 40))
        sheet.paste(grab(MP4, to, tw, th), (x + tw, y + 40))
        d.text((x + 4, y + 2), lab, fill=(255, 255, 255), font=FB)
        d.text((x + 4, y + 21), f"reference {ts:5.1f}s", fill=(255, 214, 90), font=FS)
        d.text((x + tw + 4, y + 21), f"ours {to:5.1f}s", fill=(120, 220, 255), font=FS)
    out = os.path.join(QA, "compare.jpg")
    sheet.save(out, quality=88)
    print(out)


def yavg():
    r = subprocess.run([FF, "-hide_banner", "-i", MP4, "-vf", "signalstats,metadata=print:key=lavfi.signalstats.YAVG", "-an", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    v = [float(x) for x in re.findall(r"lavfi\.signalstats\.YAVG=([0-9.]+)", r.stderr)]
    flags = []
    for i in range(1, len(v) - 1):
        a = v[i] < 0.6 * min(v[i - 1], v[i + 1]); b = v[i] < v[i - 1] - 50
        if a or b:
            flags.append({"frame": i, "t": round(i / 30, 3), "prev": round(v[i - 1], 1), "v": round(v[i], 1), "next": round(v[i + 1], 1), "rule": "0.6*min" if a else "drop>50"})
    out = {"frames": len(v), "min": round(min(v), 1), "max": round(max(v), 1), "mean": round(sum(v) / len(v), 1), "flags": flags}
    json.dump(out, open(os.path.join(QA, "yavg.json"), "w"), indent=1)
    print(f"{len(v)} frames · YAVG min {out['min']} mean {out['mean']} max {out['max']} · {len(flags)} flagged")
    for f in flags:
        print("  FLAG", f)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="QA sheets for the rendered reel")
    ap.add_argument("what", nargs="?", default="all", choices=("sweep", "compare", "yavg", "all"))
    ap.add_argument("--ref", default=None, help="optional reference video for compare.jpg")
    args = ap.parse_args()
    what, SRC = args.what, args.ref
    if what in ("sweep", "all"):
        sweep()
    if what in ("compare", "all"):
        compare()
    if what in ("yavg", "all"):
        yavg()

"""QA sheets for the rendered film:
  out/qa/sweep_1.jpg, sweep_2.jpg  a 2 fps sweep of the real mp4 (every frame you would see at 0.5 s steps)
  out/qa/compare.jpg               a reference video (left) next to ours (right) at 12 beats matched by role in the
                                   format; only with --ref
  out/qa/yavg.json                 per-frame YAVG and the brightness-dip flags (a dip = a frame < 0.6 x both neighbours
                                   or > 50 levels below the previous one)

usage: python -I tools/qa_sheets.py [out/<name>.mp4] [--ref <reference.mp4>]
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
# (reference s, ours s, role)
BEATS = [(1.0, 1.0, "hook: the job's object at frame 0"), (3.3, 3.6, "the clarifying morph"), (9.5, 7.8, "the big number"),
         (11.5, 13.0, "open loop: one row turns amber"), (18.2, 21.8, "the exact time (clock)"), (24.7, 24.0, "the count of days"),
         (38.9, 33.8, "the repeated-value column"), (44.4, 43.5, "the rule: RESTRICTED lock"), (47.7, 29.5, "the profile: dates"),
         (49.3, 57.5, "the twist object"), (61.5, 66.5, "the line to the viewer: a phone"), (66.8, 73.0, "the kindness: a setting")]
try:
    FB = ImageFont.truetype("arialbd.ttf", 15)
    FS = ImageFont.truetype("arial.ttf", 13)
except OSError:
    FB = FS = ImageFont.load_default()


def grab(path, t, w, h):
    p = subprocess.run([FF, "-v", "error", "-ss", f"{t:.3f}", "-i", path, "-frames:v", "1", "-vf", f"scale={w}:{h}:flags=area",
                        "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
    return Image.fromarray(np.frombuffer(p.stdout, np.uint8).reshape(h, w, 3))


def frames(path, fps, w, h):
    p = subprocess.run([FF, "-v", "error", "-i", path, "-vf", f"fps={fps},scale={w}:{h}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                       capture_output=True)
    a = np.frombuffer(p.stdout, np.uint8)
    return a.reshape(-1, h, w, 3)


def main():
    ap = argparse.ArgumentParser(description="QA sheets for the rendered film")
    ap.add_argument("mp4", nargs="?", default=os.path.join(ROOT, "out", NAME + ".mp4"))
    ap.add_argument("--ref", default=None, help="optional reference video for compare.jpg")
    args = ap.parse_args()
    mp4, src = args.mp4, args.ref
    qa = os.path.join(ROOT, "out", "qa")
    os.makedirs(qa, exist_ok=True)
    # ---- 2 fps sweep, two sheets
    TW, TH, COLS = 135, 240, 12
    fr = frames(mp4, 2, TW, TH)
    half = (len(fr) + 1) // 2
    for k, chunk in enumerate((fr[:half], fr[half:])):
        rows = (len(chunk) + COLS - 1) // COLS
        sheet = Image.new("RGB", (COLS * TW, rows * (TH + 16) + 26), (20, 20, 22))
        d = ImageDraw.Draw(sheet)
        d.text((6, 5), f"SWEEP 2 fps · {NAME} · part {k + 1}/2", fill=(240, 200, 90), font=FB)
        for i, f in enumerate(chunk):
            x, y = (i % COLS) * TW, 26 + (i // COLS) * (TH + 16)
            sheet.paste(Image.fromarray(f), (x, y + 16))
            d.text((x + 3, y + 1), f"{(i + k * half) / 2:5.1f}s", fill=(200, 200, 200), font=FS)
        sheet.save(os.path.join(qa, f"sweep_{k + 1}.jpg"), quality=88)
    # ---- compare (only with --ref)
    if src:
        CW, CH, cols = 216, 384, 4
        rows = (len(BEATS) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * (2 * CW + 14), rows * (CH + 44) + 32), (22, 22, 24))
        d = ImageDraw.Draw(sheet)
        d.text((8, 8), f"LEFT: reference   RIGHT: ours ({NAME})  — matched by role in the format, same scale", fill=(235, 235, 235), font=FB)
        for i, (ts, to, lab) in enumerate(BEATS):
            x, y = (i % cols) * (2 * CW + 14), 32 + (i // cols) * (CH + 44)
            sheet.paste(grab(src, ts, CW, CH), (x, y + 40))
            sheet.paste(grab(mp4, to, CW, CH), (x + CW, y + 40))
            d.text((x + 4, y + 2), lab, fill=(255, 255, 255), font=FB)
            d.text((x + 4, y + 21), f"reference {ts:5.1f} s", fill=(255, 210, 90), font=FS)
            d.text((x + CW + 4, y + 21), f"ours {to:5.1f} s", fill=(120, 210, 255), font=FS)
        sheet.save(os.path.join(qa, "compare.jpg"), quality=90)
    else:
        print("compare.jpg skipped (no --ref)")
    # ---- YAVG dips
    r = subprocess.run([FF, "-hide_banner", "-i", mp4, "-vf", "signalstats,metadata=print:key=lavfi.signalstats.YAVG", "-an", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    v = [float(x) for x in re.findall(r"lavfi\.signalstats\.YAVG=([0-9.]+)", r.stderr)]
    flags = []
    for i in range(1, len(v) - 1):
        a = v[i] < 0.6 * min(v[i - 1], v[i + 1])
        b = v[i] < v[i - 1] - 50
        if a or b:
            flags.append({"frame": i, "t": round(i / 30, 3), "prev": round(v[i - 1], 1), "v": round(v[i], 1), "next": round(v[i + 1], 1)})
    steps = sorted(((abs(v[i] - v[i - 1]), i) for i in range(1, len(v))), reverse=True)[:8]
    out = {"frames": len(v), "min": round(min(v), 1), "mean": round(float(np.mean(v)), 1), "max": round(max(v), 1), "flags": flags,
           "largest_steps": [{"t": round(i / 30, 3), "from": round(v[i - 1], 1), "to": round(v[i], 1)} for _, i in sorted(steps, key=lambda s: s[1])]}
    json.dump(out, open(os.path.join(qa, "yavg.json"), "w"), indent=1)
    print(f"sweep: {len(fr)} frames · compare: {len(BEATS) if src else 0} beats · YAVG {out['min']}..{out['max']} mean {out['mean']} · {len(flags)} dips flagged")
    for s in out["largest_steps"]:
        print(f"  step {s['t']:7.3f}s {s['from']:6.1f} -> {s['to']:6.1f}")


if __name__ == "__main__":
    main()

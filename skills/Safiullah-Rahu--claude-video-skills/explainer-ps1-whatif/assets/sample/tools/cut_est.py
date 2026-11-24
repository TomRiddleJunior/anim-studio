"""Predict which planned cuts the analyzer will detect, before rendering.
The analyzer counts a cut where ffmpeg's scene score > 0.33; the score is roughly min(mafd, |mafd - prev mafd|) / 100,
with mafd the mean absolute difference between consecutive frames (8-bit). Dark, low-contrast cuts score low.
usage:
  python -X utf8 -I tools/cut_est.py video <mp4> <t1,t2,...>      # measure on a rendered file (calibration)
  python -X utf8 -I tools/cut_est.py snaps <snapshot_dir>          # frames named frame-NN-at-<t>s.png, 3 per boundary
  python -X utf8 -I tools/cut_est.py times <t1,t2,...>             # print the 3 snapshot times per boundary
"""
import glob
import math
import os
import re
import subprocess
import sys

import numpy as np
from PIL import Image


def ff():
    d = os.path.dirname(os.path.abspath(__file__))
    for _ in range(7):
        c = os.path.join(d, "engine", "node_modules", "ffmpeg-static", "ffmpeg.exe")
        if os.path.exists(c):
            return c
        d = os.path.dirname(d)
    return os.environ.get("FFMPEG_PATH", "ffmpeg")


def yuv(img):
    a = np.asarray(img.convert("RGB").resize((160, 90) if img.width > img.height else (90, 160), Image.BILINEAR), dtype=np.float32)
    y = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
    return y


def score(f0, f1, f2):
    m1 = float(np.abs(f1 - f0).mean())
    m2 = float(np.abs(f2 - f1).mean())
    return min(m2, abs(m2 - m1)) / 100.0, m2


def triple_times(ts):
    out = []
    for t in ts:
        f = math.ceil(t * 30 - 1e-6)
        out += [round((f - 2) / 30, 4), round((f - 1) / 30, 4), round(f / 30 + 0.001, 4)]
    return out


def main():
    mode = sys.argv[1]
    if mode == "times":
        print(",".join(str(x) for x in triple_times([float(x) for x in sys.argv[2].split(",")])))
        return
    if mode == "video":
        mp4, ts = sys.argv[2], [float(x) for x in sys.argv[3].split(",")]
        for t in ts:
            fr = []
            for tt in triple_times([t]):
                r = subprocess.run([ff(), "-v", "error", "-ss", f"{tt:.4f}", "-i", mp4, "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True)
                from io import BytesIO
                fr.append(yuv(Image.open(BytesIO(r.stdout))))
            s, m = score(*fr)
            print(f"{t:8.2f}  score {s:.3f}  mafd {m:5.1f}  {'CUT' if s > 0.33 else '---'}")
        return
    if mode == "snaps":
        fs = sorted(glob.glob(os.path.join(sys.argv[2], "frame-*.png")))
        n = 0
        for i in range(0, len(fs) - 2, 3):
            fr = [yuv(Image.open(p)) for p in fs[i:i + 3]]
            s, m = score(*fr)
            t = float(re.search(r"at-([\d.]+)s", fs[i + 2]).group(1))
            n += s > 0.33
            print(f"{t:8.2f}  score {s:.3f}  mafd {m:5.1f}  {'CUT' if s > 0.33 else '---'}")
        print("predicted cuts:", n)


if __name__ == "__main__":
    main()

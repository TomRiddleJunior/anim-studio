"""Estimate the analyzer's scene-change events at 2 fps (the engine samples 6 fps; same histogram, threshold and gap).
  python -I scene_est.py <snapshot dir with frame-NN-at-Ts.png>   or   python -I scene_est.py <video.mp4>
Prints the events and the count; compare two runs (render 2 mp4 vs the new snapshots) for the delta."""
import os
import re
import subprocess
import sys

import numpy as np
from PIL import Image

FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"
FPS = 2


def hist(img):
    f = np.asarray(img.convert("RGB").resize((160, 90), Image.BOX)).astype(np.int32)
    q = f >> 6
    return np.bincount((q[..., 0] * 16 + q[..., 1] * 4 + q[..., 2]).ravel(), minlength=64) / q[..., 0].size


def frames(src):
    if os.path.isdir(src):
        items = []
        for n in os.listdir(src):
            m = re.match(r"frame-\d+-at-([\d.]+)s\.png$", n)
            if m:
                items.append((float(m[1]), os.path.join(src, n)))
        for t, p in sorted(items):
            yield t, Image.open(p)
    else:
        p = subprocess.run([FF, "-v", "error", "-i", src, "-vf", f"fps={FPS},scale=160:90:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
        a = np.frombuffer(p.stdout, np.uint8).reshape(-1, 90, 160, 3)
        for i, f in enumerate(a):
            yield i / FPS, Image.fromarray(f)


def main():
    ts, hs = zip(*[(t, hist(im)) for t, im in frames(sys.argv[1])])
    H = np.array(hs)
    d = 0.5 * np.abs(H[FPS:] - H[:-FPS]).sum(axis=1)
    ev, last = [], -9.0
    for i in range(1, len(d) - 1):
        t = ts[i] + 0.5
        if d[i] >= 0.28 and d[i] >= d[i - 1] and d[i] >= d[i + 1] and t - last >= 1.5:
            ev.append((round(t, 2), round(float(d[i]), 2)))
            last = t
    near = [(round(ts[i] + 0.5, 2), round(float(d[i]), 2)) for i in range(len(d)) if 0.22 <= d[i] < 0.28]
    print(len(ev), "events:", ev)
    print("near misses:", near)


if __name__ == "__main__":
    main()

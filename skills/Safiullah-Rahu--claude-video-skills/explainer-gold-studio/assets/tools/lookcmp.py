"""Per-second look stats for two videos (brightness = mean max-channel, frac of pixels >= 64, colourfulness) and the
analyzer's scene-change events, to see where a sample departs from its source.

usage: python -I lookcmp.py <src.mp4> <ours.mp4>
"""
import subprocess
import sys

import numpy as np

sys.path.insert(0, r"engine\qa")
FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"


def frames(path, fps, w, h):
    p = subprocess.Popen([FF, "-hide_banner", "-loglevel", "error", "-i", path, "-vf", f"fps={fps},scale={w}:{h}:flags=area,format=rgb24",
                          "-f", "rawvideo", "-"], stdout=subprocess.PIPE)
    n = w * h * 3
    while True:
        b = p.stdout.read(n)
        if len(b) < n:
            break
        yield np.frombuffer(b, np.uint8).reshape(h, w, 3)


def stats(path):
    rows = []
    for f in frames(path, 1, 270, 480):
        a = f.astype(np.float32)
        mx = a.max(axis=2)
        r, g, b = a[..., 0], a[..., 1], a[..., 2]
        rg, yb = r - g, 0.5 * (r + g) - b
        col = np.sqrt(rg.std() ** 2 + yb.std() ** 2) + 0.3 * np.sqrt(rg.mean() ** 2 + yb.mean() ** 2)
        rows.append((mx.mean() / 255, (mx >= 64).mean(), col))
    return np.array(rows)


def scenes(path):
    hs = []
    for f in frames(path, 6, 160, 90):
        q = (f >> 6).astype(np.int32)
        hs.append(np.bincount((q[..., 0] * 16 + q[..., 1] * 4 + q[..., 2]).ravel(), minlength=64) / q[..., 0].size)
    hs = np.array(hs)
    d = 0.5 * np.abs(hs[6:] - hs[:-6]).sum(axis=1)
    ev, last = [], -9
    for i in range(1, len(d) - 1):
        t = (i + 3) / 6
        if d[i] >= 0.28 and d[i] >= d[i - 1] and d[i] >= d[i + 1] and t - last >= 1.5:
            ev.append((round(t, 1), round(float(d[i]), 2)))
            last = t
    return ev


A, B = stats(sys.argv[1]), stats(sys.argv[2])
print("sec  | src bright  >=64  colour | ours bright  >=64  colour")
for s in range(max(len(A), len(B))):
    a = A[s] if s < len(A) else (0, 0, 0)
    b = B[s] if s < len(B) else (0, 0, 0)
    print(f"{s:3d}  | {a[0]:.3f}  {a[1]:.3f}  {a[2]:5.1f}  | {b[0]:.3f}  {b[1]:.3f}  {b[2]:5.1f}")
print("means src", A.mean(axis=0).round(3), "ours", B.mean(axis=0).round(3))
print("scene events src", scenes(sys.argv[1]))
print("scene events ours", scenes(sys.argv[2]))

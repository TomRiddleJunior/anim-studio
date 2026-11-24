"""Per-frame mean luma of named regions (1080x1920 coords) -> prints a compact table.
usage: python regions.py <mp4> fps name:x0,y0,x1,y1 ..."""
import os, subprocess, sys
import numpy as np
FF = os.environ.get("FFMPEG", "ffmpeg")
mp4, fps = sys.argv[1], float(sys.argv[2])
regs = []
for a in sys.argv[3:]:
    n, c = a.split(":")
    regs.append((n, [int(v) // 4 for v in c.split(",")]))
W, H = 270, 480
p = subprocess.run([FF, "-v", "error", "-i", mp4, "-vf", f"fps={fps},scale={W}:{H}:flags=area,format=gray", "-f", "rawvideo", "-"], capture_output=True)
fr = np.frombuffer(p.stdout, np.uint8).reshape(-1, H, W).astype(np.float32)
print("t      " + " ".join(f"{n:>8s}" for n, _ in regs) + "   d_prev")
prev = None
for i, f in enumerate(fr):
    vals = [f[y0:y1, x0:x1].mean() for _, (x0, y0, x1, y1) in regs]
    d = 0 if prev is None else np.abs(f - prev).mean()
    prev = f
    print(f"{i / fps:6.3f} " + " ".join(f"{v:8.1f}" for v in vals) + f"   {d:6.2f}")

"""Brightness the way analyze_video.py measures it (mean of the max RGB channel, 1 fps, 480x270), split into the first
70 % of the film and the rest. usage: python -I bright70.py <video.mp4>"""
import os, shutil, subprocess, sys
import numpy as np

FF = os.environ.get("FFMPEG_PATH") or shutil.which("ffmpeg") or "ffmpeg"
W, H = 480, 270
raw = subprocess.run([FF, "-v", "error", "-i", sys.argv[1], "-vf", f"fps=1,scale={W}:{H}:flags=area,format=rgb24", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
n = len(raw) // (W * H * 3)
f = np.frombuffer(raw[: n * W * H * 3], np.uint8).reshape(n, H, W, 3)
v = f.max(axis=3).mean(axis=(1, 2)) / 255
k = int(round(n * 0.7))
print(f"frames {n}  all {v.mean():.3f}  first 70% ({k} s) {v[:k].mean():.3f} (min {v[:k].min():.3f})  last 30% {v[k:].mean():.3f}")
print("per-second:", " ".join(f"{i}:{x:.2f}" for i, x in enumerate(v)))

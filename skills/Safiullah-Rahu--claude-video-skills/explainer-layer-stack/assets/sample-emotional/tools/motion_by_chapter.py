"""Per-chapter motion, measured the way engine/qa/analyze_video.py does (6 fps, 160x90 area-scaled grey, mean |dI|).

usage: python -I tools/motion_by_chapter.py <video.mp4> <project dir>
The analyzer squashes 9:16 frames to 160x90, so only large-area changes count (entrances, fills, halos, stamps,
camera moves); thin outline motion averages away. Prints the overall mean (= metrics.json motion_mean), and per
chapter the mean and the share of near-still samples (< 1.0).
"""
import json, os, shutil, subprocess, sys
import numpy as np

FF = os.environ.get("FFMPEG_PATH") or shutil.which("ffmpeg") or "ffmpeg"
src, proj = sys.argv[1], sys.argv[2]
W, H, FPS = 160, 90, 6
raw = subprocess.run([FF, "-v", "error", "-i", src, "-vf", f"fps={FPS},scale={W}:{H}:flags=area,format=rgb24", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                     capture_output=True, check=True).stdout
n = len(raw) // (W * H * 3)
f = np.frombuffer(raw[: n * W * H * 3], np.uint8).reshape(n, H, W, 3).astype(np.float32)
g = (f[..., 0] * 0.299 + f[..., 1] * 0.587 + f[..., 2] * 0.114).astype(np.int16)
d = np.concatenate([[0], np.abs(np.diff(g, axis=0)).mean(axis=(1, 2))])
vo = json.load(open(os.path.join(proj, "data", "vo.json"), encoding="utf-8"))
starts = [0.0] + [l["start"] - 0.1 for l in vo["lines"][1:]]
ends = starts[1:] + [n / FPS]
print(f"overall motion_mean {d.mean():.2f}  still<1.0 {np.mean(d < 1.0):.2f}")
for l, a, b in zip(vo["lines"], starts, ends):
    s = d[int(a * FPS):int(b * FPS)]
    print(f"{l['id']} {a:6.2f}-{b:6.2f}  mean {s.mean():5.2f}  still {np.mean(s < 1.0):.2f}  words/s {len(l['words']) / (b - a):.2f}")

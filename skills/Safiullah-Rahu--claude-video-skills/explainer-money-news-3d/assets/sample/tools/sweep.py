"""2 fps sweep of the real mp4: out/qa/sweep_N.jpg, 40 frames per sheet (10 x 4), each stamped with its time.

usage: python -I tools/sweep.py [out/money-news.mp4] [fps]
"""
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = r"ffmpeg-bin\node_modules\ffmpeg-static\ffmpeg.exe"
mp4 = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "out", os.path.basename(ROOT) + ".mp4")
fps = float(sys.argv[2]) if len(sys.argv) > 2 else 2.0
W, H = 162, 288
p = subprocess.run([FF, "-v", "error", "-i", mp4, "-vf", f"fps={fps},scale={W}:{H}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
n = len(p.stdout) // (W * H * 3)
frames = np.frombuffer(p.stdout[: n * W * H * 3], np.uint8).reshape(n, H, W, 3)
per, cols = 40, 10
outs = []
for s in range(0, n, per):
    chunk = frames[s:s + per]
    rows = (len(chunk) + cols - 1) // cols
    sh = Image.new("RGB", (cols * W, rows * (H + 16)), (16, 16, 16))
    d = ImageDraw.Draw(sh)
    for i, fr in enumerate(chunk):
        x, y = (i % cols) * W, (i // cols) * (H + 16)
        sh.paste(Image.fromarray(fr), (x, y + 16))
        d.text((x + 3, y + 2), f"{(s + i) / fps:5.1f}s", fill=(255, 220, 90))
    o = os.path.join(ROOT, "out", "qa", f"sweep_{s // per + 1}.jpg")
    os.makedirs(os.path.dirname(o), exist_ok=True)
    sh.save(o, quality=86)
    outs.append(o)
print(n, "frames ->", outs)

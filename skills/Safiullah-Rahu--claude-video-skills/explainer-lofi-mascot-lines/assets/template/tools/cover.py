"""out/cover.jpg: a caption-free frame of the master (default t = 22.1 s, the window seat) with one line set in the
reel's caption style (Inter 500, small, white, centred at 31 %), slightly larger for the grid.
usage: python -X utf8 -I tools/cover.py [t] [line]"""
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = os.path.basename(ROOT)
FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"
t = float(sys.argv[1]) if len(sys.argv) > 1 else 22.1
LINE = sys.argv[2] if len(sys.argv) > 2 else "There is a calm in being here."
src = os.path.join(ROOT, "out", NAME + "_master.mp4")
p = subprocess.run([FF, "-v", "error", "-ss", f"{t:.3f}", "-i", src, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
im = Image.fromarray(np.frombuffer(p.stdout, np.uint8).reshape(1920, 1080, 3)).convert("RGBA")
F = ImageFont.truetype(os.path.join(ROOT, "assets", "fonts", "Inter_opsz-wght_.ttf"), 46)
try:
    F.set_variation_by_axes([32, 500])
except Exception:
    pass
txt = Image.new("RGBA", im.size, (0, 0, 0, 0))
d = ImageDraw.Draw(txt)
d.text((540, 600), LINE, font=F, fill=(247, 244, 238, 255), anchor="mm")
sh = txt.split()[3].filter(ImageFilter.GaussianBlur(8))
shadow = Image.new("RGBA", im.size, (0, 0, 0, 0)); shadow.putalpha(sh.point(lambda v: int(v * 0.6)))
im = Image.alpha_composite(Image.alpha_composite(im, shadow), txt)
im.convert("RGB").save(os.path.join(ROOT, "out", "cover.jpg"), quality=92)
print("out/cover.jpg")

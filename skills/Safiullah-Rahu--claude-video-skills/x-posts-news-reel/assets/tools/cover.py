"""out/cover.jpg: the delivered film's frame at --at seconds (default 0: frame 0 is designed as the thumbnail).

usage: python -X utf8 -I tools/cover.py [--at 0.0] [--mp4 out/<name>.mp4]
"""
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = os.environ.get("FFMPEG_PATH", r"engine\node_modules\ffmpeg-static\ffmpeg.exe")
E = json.load(open(os.path.join(ROOT, "edit.json"), encoding="utf-8"))
a = sys.argv[1:]
at = float(a[a.index("--at") + 1]) if "--at" in a else 0.0
mp4 = a[a.index("--mp4") + 1] if "--mp4" in a else os.path.join(ROOT, "out", E["name"] + ".mp4")
out = os.path.join(ROOT, "out", "cover.jpg")
subprocess.run([FF, "-v", "error", "-y", "-ss", f"{at:.3f}", "-i", mp4, "-frames:v", "1", "-q:v", "2", out], check=True)
print(out)

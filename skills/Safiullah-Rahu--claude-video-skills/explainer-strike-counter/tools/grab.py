"""Full-size frame grabs. usage: python grab.py <mp4> <outdir> t1 t2 ..."""
import os, subprocess, sys
FF = os.environ.get("FFMPEG", "ffmpeg")
mp4, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
for t in sys.argv[3:]:
    tt = float(t)
    subprocess.run([FF, "-v", "error", "-y", "-ss", f"{tt:.3f}", "-i", mp4, "-frames:v", "1", "-q:v", "2",
                    os.path.join(out, f"f_{tt:06.2f}.png")], check=True)
print("ok")

"""Copy every 3rd frame of scratch/shots/frames (6 fps) into a fresh folder (2 fps) for the check sheets."""
import glob
import os
import shutil
import sys

src = r"assets/sample/scratch\shots\frames"
dst = sys.argv[1]
os.makedirs(dst, exist_ok=True)
for i, f in enumerate(sorted(glob.glob(os.path.join(src, "f_*.jpg")))[::3]):
    shutil.copy(f, os.path.join(dst, f"f_{i:05d}.jpg"))
print(dst)

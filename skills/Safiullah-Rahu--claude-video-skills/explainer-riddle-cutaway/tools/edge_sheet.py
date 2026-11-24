"""Headless-Edge screenshot of the preview sheet (no Browser pane needed; run it under the render lock).
Lives next to preview_inline.html (copy it to scratch/):
  python -I scratch/inline.py scratch/preview.html scratch/preview_inline.html
  bash ".../with_render_lock.sh" python -I scratch/edge_sheet.py 6.3,12.6,28.0 scratch/p1.png
preview.html renders the tiles itself from the #t=... hash (world only; pills are DOM and do not show)."""
import os
import shutil
import subprocess
import sys
import tempfile

here = os.path.dirname(os.path.abspath(__file__))
url = "file:///" + os.path.join(here, "preview_inline.html").replace("\\", "/").replace(" ", "%20") + "#t=" + sys.argv[1]
tmpdir = tempfile.gettempdir()
tmp = os.path.join(tmpdir if " " not in tmpdir else r"C:\Temp", "edge_sheet.png")  # Edge's --screenshot= breaks on spaces
os.makedirs(os.path.dirname(tmp), exist_ok=True)
edge = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
subprocess.run([edge, "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--window-size=1600,1200",
                "--virtual-time-budget=4000", f"--screenshot={tmp}", url], capture_output=True, timeout=120)
shutil.move(tmp, sys.argv[2])
print(sys.argv[2])

"""The lead's look sheet: 8 views (face front, 3/4 both sides, profile, back, full body, full body + hard hat, hat close)
in the world, under the shared lock, tiled into scratch/wt_<name>.jpg. A thin wrapper round tools/wt.py + tools/wt_sheet.js.
usage: python -I tools/sheet.py <name>"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
name = sys.argv[1] if len(sys.argv) > 1 else "look"
subprocess.run([sys.executable, "-I", os.path.join(HERE, "wt.py"), os.path.join(HERE, "wt_sheet.js"), name, "8", "survival-rig"], check=True)

"""Print the hard cuts and scene-change times the engine analyzer finds in a video (same functions, same thresholds).
usage: python -I tools/scene_times.py <video.mp4>
"""
import importlib.util
import os
import sys
import tempfile

spec = importlib.util.spec_from_file_location("av", r"engine\qa\analyze_video.py")
av = importlib.util.module_from_spec(spec)
spec.loader.exec_module(av)
path = os.path.abspath(sys.argv[1])
tmp = tempfile.mkdtemp()
diffs, cuts = av.motion_and_cuts(path, tmp)
scs = av.scene_changes(av.motion_and_cuts.hists, cuts)
dur = av.probe(path)[0]
print(f"dur {dur:.2f}  cuts {len(cuts)} ({len(cuts) / dur * 60:.2f}/min): {cuts}")
print(f"scene changes {len(scs)} ({len(scs) / dur * 60:.2f}/min): {scs}")

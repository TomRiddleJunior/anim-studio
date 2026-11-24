"""List the scene-change events the engine analyzer counts (histogram jumps 1 s apart, thr 0.28, >= 1.5 s apart) with
the shot each falls in, so they can be merged or ramped.   usage: python -I tools/scene_events.py [mp4]"""
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.expanduser(r"~\.claude\skills\explainer-engine\engine\qa"))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import analyze_video as AV  # noqa: E402
import numpy as np  # noqa: E402
import shots_table as ST  # noqa: E402

mp4 = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "out", os.path.basename(ROOT) + ".mp4")
tmp = tempfile.mkdtemp()
diffs, cuts = AV.motion_and_cuts(mp4, tmp)
h = AV.motion_and_cuts.hists
ev = AV.scene_changes(h, cuts)
fps = 6
d = 0.5 * np.abs(h[fps:] - h[:-fps]).sum(axis=1)
rows = ST.table()
dur = ST.DUR
print(f"{len(ev)} events, {len(ev) / dur * 60:.2f}/min (gate 9.7-14.6)")
for t in ev:
    sh = [r for r in rows if r["t0"] <= t][-1]
    i = int(round(t * fps - fps / 2))
    print(f"  {t:6.2f}s  d={d[i]:.2f}  S{sh['shot']:02d} ({sh['t0']:.2f}-{sh['t1']:.2f}) {sh['label']}")
near = [(round((i + fps / 2) / fps, 2), round(float(x), 2)) for i, x in enumerate(d) if 0.22 <= x < 0.28 and (i == 0 or x >= d[i - 1]) and (i == len(d) - 1 or x >= d[i + 1])]
print("near misses (0.22-0.28):", near)

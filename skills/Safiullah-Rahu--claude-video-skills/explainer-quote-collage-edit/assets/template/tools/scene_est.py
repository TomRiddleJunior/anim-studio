"""Scene-change events the engine analyzer will count (its rule: 64-bin colour histograms at 6 fps, 160x90, distance between
frames 1 s apart >= 0.28, local peak, >= 1.5 s apart).   usage: python -I tools/scene_est.py <video.mp4> [more.mp4 ...]"""
import subprocess
import sys

import numpy as np

FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"


def events(path, fps=6, thr=0.28, gap=1.5):
    raw = subprocess.run([FF, "-v", "error", "-i", path, "-vf", f"fps={fps},scale=160:90:flags=area,format=rgb24", "-f", "rawvideo", "-"],
                         capture_output=True, check=True).stdout
    f = np.frombuffer(raw, np.uint8).reshape(-1, 90, 160, 3)
    q = (f >> 6).astype(np.int32)
    idx = q[..., 0] * 16 + q[..., 1] * 4 + q[..., 2]
    hists = np.array([np.bincount(i.ravel(), minlength=64) / i.size for i in idx])
    d = 0.5 * np.abs(hists[fps:] - hists[:-fps]).sum(axis=1)
    ev, last = [], -9.0
    for i in range(1, len(d) - 1):
        t = (i + fps / 2) / fps
        if d[i] >= thr and d[i] >= d[i - 1] and d[i] >= d[i + 1] and t - last >= gap:
            ev.append((round(t, 2), round(float(d[i]), 3)))
            last = t
    dur = len(f) / fps
    return ev, dur


def cuts(path, thr=0.33):
    """the analyzer's hard-cut rule: ffmpeg scene score > 0.33, > 0.25 s after the last cut, after 0.1 s"""
    import re
    r = subprocess.run([FF, "-hide_banner", "-i", path, "-vf", "select='gte(scene,0)',metadata=print:key=lavfi.scene_score", "-an", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    out, last, t = [], -9.0, None
    for line in r.stderr.splitlines():
        m = re.search(r"pts_time:([\d.]+)", line)
        if m:
            t = float(m[1])
        m2 = re.search(r"scene_score=([\d.]+)", line)
        if m2 and t is not None:
            s = float(m2[1])
            if s > thr and t - last > 0.25 and t > 0.1:
                out.append((round(t, 3), round(s, 3)))
                last = t
    return out


for p in sys.argv[1:]:
    ev, dur = events(p)
    print(f"{p[-48:]}: {len(ev)} events in {dur:.1f} s = {len(ev) / dur * 60:.2f}/min")
    print("  ", ev)
    c = cuts(p)
    print(f"  cuts {len(c)} = {len(c) / dur * 60:.2f}/min", c)

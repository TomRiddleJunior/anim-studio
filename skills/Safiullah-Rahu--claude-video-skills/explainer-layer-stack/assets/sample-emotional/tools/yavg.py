"""Brightness-dip check (the analyzer's dark-frame test misses short dips).

usage: python -I tools/yavg.py <video.mp4> [out.json]
Runs ffmpeg signalstats over every frame, then flags frame i when v[i] < 0.6 * min(v[i-1], v[i+1]) or
v[i] < v[i-1] - 50 (YAVG, 0..255). Prints flagged runs with times and the min/mean YAVG.
"""
import json, os, re, shutil, subprocess, sys

FF = os.environ.get("FFMPEG_PATH") or shutil.which("ffmpeg") or "ffmpeg"
src = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else None
r = subprocess.run([FF, "-hide_banner", "-i", src, "-vf", "signalstats,metadata=print:key=lavfi.signalstats.YAVG", "-f", "null", "-"],
                   capture_output=True, text=True, encoding="utf-8", errors="replace")
txt = r.stderr + r.stdout
ts = [float(m) for m in re.findall(r"pts_time:([0-9.]+)", txt)]
vs = [float(m) for m in re.findall(r"YAVG=([0-9.]+)", txt)]
n = min(len(ts), len(vs))
ts, vs = ts[:n], vs[:n]
flags = []
for i in range(1, n - 1):
    a, b = vs[i - 1], vs[i + 1]
    if vs[i] < 0.6 * min(a, b) or vs[i] < a - 50:
        flags.append((round(ts[i], 3), round(vs[i], 1), round(a, 1), round(b, 1)))
runs = []
for f in flags:
    if runs and f[0] - runs[-1][-1][0] < 0.2:
        runs[-1].append(f)
    else:
        runs.append([f])
rep = {"frames": n, "yavg_mean": round(sum(vs) / max(n, 1), 1), "yavg_min": round(min(vs), 1) if vs else None,
       "t_min": ts[vs.index(min(vs))] if vs else None, "flagged_frames": len(flags),
       "runs": [{"t0": r_[0][0], "t1": r_[-1][0], "min": min(x[1] for x in r_)} for r_ in runs]}
print(json.dumps(rep, indent=1))
if out:
    json.dump({**rep, "series": [[round(t, 3), round(v, 1)] for t, v in zip(ts, vs)]}, open(out, "w"), indent=0)

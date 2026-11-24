"""Brightness-dip check on the rendered mp4: per-frame YAVG via ffmpeg signalstats; flags v[i] < 0.6*min(neighbours)
or v[i] < v[i-1]-50, and also prints the per-second YAVG curve (coarse) so intended fades are visible.
usage: python -I yavg.py <video.mp4> <out.json>"""
import json, os, re, shutil, subprocess, sys

FF = os.environ.get("FFMPEG_PATH") or shutil.which("ffmpeg") or "ffmpeg"
src, out = sys.argv[1], sys.argv[2]
r = subprocess.run([FF, "-hide_banner", "-i", src, "-vf", "signalstats,metadata=print:key=lavfi.signalstats.YAVG", "-an", "-f", "null", "-"],
                   capture_output=True, text=True, encoding="utf-8", errors="replace")
ts, vs, t = [], [], None
for line in r.stderr.splitlines():
    m = re.search(r"pts_time:([\d.]+)", line)
    if m:
        t = float(m[1])
    m = re.search(r"lavfi\.signalstats\.YAVG=([\d.]+)", line)
    if m and t is not None:
        ts.append(t); vs.append(float(m[1]))
flags = []
for i in range(1, len(vs) - 1):
    a, b, c = vs[i - 1], vs[i], vs[i + 1]
    if b < 0.6 * min(a, c) or b < a - 50:
        flags.append({"t": round(ts[i], 3), "prev": round(a, 1), "v": round(b, 1), "next": round(c, 1)})
sec = {}
for tt, v in zip(ts, vs):
    sec.setdefault(int(tt), []).append(v)
curve = {k: round(sum(v) / len(v), 1) for k, v in sorted(sec.items())}
json.dump({"frames": len(vs), "flags": flags, "per_second": curve}, open(out, "w"), indent=1)
print(f"{len(vs)} frames, {len(flags)} flagged")
for f in flags:
    print(f)
print("per-second YAVG:", " ".join(f"{k}:{v:.0f}" for k, v in curve.items()))

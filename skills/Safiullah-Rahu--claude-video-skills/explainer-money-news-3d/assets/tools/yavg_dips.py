"""Brightness-dip check on the rendered mp4: per-frame YAVG (ffmpeg signalstats), flag frame i when
v[i] < 0.6 * min(v[i-1], v[i+1]) or v[i] < v[i-1] - 50. Writes out/qa/yavg.json and prints the flags + cut-adjacent context.

usage: python -I tools/yavg_dips.py [out/lowpoly-skit-emotional.mp4]
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = r"ffmpeg-bin\node_modules\ffmpeg-static\ffmpeg.exe"
mp4 = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "out", os.path.basename(ROOT) + ".mp4")
r = subprocess.run([FF, "-hide_banner", "-i", mp4, "-vf", "signalstats,metadata=print:key=lavfi.signalstats.YAVG", "-an", "-f", "null", "-"],
                   capture_output=True, text=True, encoding="utf-8", errors="replace")
v = [float(x) for x in re.findall(r"lavfi\.signalstats\.YAVG=([0-9.]+)", r.stderr)]
flags = []
for i in range(1, len(v) - 1):
    a = v[i] < 0.6 * min(v[i - 1], v[i + 1])
    b = v[i] < v[i - 1] - 50
    if a or b:
        flags.append({"frame": i, "t": round(i / 30, 3), "prev": round(v[i - 1], 1), "v": round(v[i], 1), "next": round(v[i + 1], 1),
                      "rule": "0.6*min" if a else "drop>50"})
# biggest frame-to-frame changes (the cuts), for context
jumps = sorted(((abs(v[i] - v[i - 1]), i) for i in range(1, len(v))), reverse=True)[:25]
out = {"frames": len(v), "min": round(min(v), 1), "max": round(max(v), 1), "mean": round(sum(v) / len(v), 1), "flags": flags,
       "largest_steps": [{"t": round(i / 30, 3), "from": round(v[i - 1], 1), "to": round(v[i], 1)} for _, i in sorted(jumps, key=lambda x: x[1])]}
os.makedirs(os.path.join(ROOT, "out", "qa"), exist_ok=True)
json.dump(out, open(os.path.join(ROOT, "out", "qa", "yavg.json"), "w"), indent=1)
print(f"{len(v)} frames · YAVG min {out['min']} mean {out['mean']} max {out['max']} · {len(flags)} flagged")
for f in flags:
    print("  FLAG", f)
for j in out["largest_steps"]:
    print(f"  step {j['t']:7.3f}s  {j['from']:6.1f} -> {j['to']:6.1f}")

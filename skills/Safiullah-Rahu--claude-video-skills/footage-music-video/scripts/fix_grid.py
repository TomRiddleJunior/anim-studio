"""Pin data/audio.json's beat grid to a constant grid fitted to the song's own kick onsets.

Why this is needed:
- The bookended song starts with a quiet, low-passed 4-bar pre-roll. The tracker mislocked there at 136 BPM, then
  drifted until about 50 s.
- The take itself is very close to constant. A fit over its kicks from 7.4 to 165 s gives 127.99 BPM, with mean
  residuals within ±31 ms in every 20-s window, which is under one 24-fps frame.
- The same phase also explains the pre-roll (it is cut from the song's own chorus) and "Humans" landing on beat 16.
- The downbeat phase comes from the snare/clap backbeat (beats 2 and 4).

  python tools/fix_grid.py
"""
import json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
p = ROOT / "data" / "audio.json"
a = json.loads(p.read_text(encoding="utf-8"))
T = lambda x: np.array([v if isinstance(v, (int, float)) else (v.get("t") if isinstance(v, dict) else v[0]) for v in x])
kicks, snares = T(a["onsets"]["kick"]), T(a["onsets"]["snare"])
k = kicks[(kicks > 7.4) & (kicks < a["duration"] - 15)]
best = None
for P in np.arange(0.4650, 0.4725, 0.00002):
    ph = np.angle(np.mean(np.exp(2j * np.pi * k / P))) * P / (2 * np.pi)
    sc = np.mean(np.abs(((k - ph + P / 2) % P) - P / 2) < 0.03)
    if best is None or sc > best[0]:
        best = (sc, P, ph % P)
sc, P, ph = best
n = np.round((snares - ph) / P).astype(int)
r = snares - (ph + n * P)
n = n[np.abs(r) < 0.06]
counts = np.bincount(n % 4, minlength=4)
# downbeat phase d: snares on (d+1)%4 and (d+3)%4
d = max(range(4), key=lambda d: counts[(d + 1) % 4] + counts[(d + 3) % 4] - counts[d] - counts[(d + 2) % 4])
beats = [round(ph + i * P, 4) for i in range(int((a["duration"] - ph) / P) + 1)]
downbeats = [b for i, b in enumerate(beats) if i % 4 == d]
a.update(bpm=round(60 / P, 4), beat_period=P, beats=beats, downbeats=downbeats,
         notes=(a.get("notes", "") + f" | grid pinned by tools/fix_grid.py: constant {60 / P:.3f} BPM fitted to kicks (inliers {sc:.2f}), phase {ph:.4f}, downbeat phase {d} from the backbeat").strip(" |"))
names = [s["name"] for s in a["sections"]]
if names.count("intro") > 1:
    a["sections"][names.index("intro")]["name"] = "cold"
p.write_text(json.dumps(a), encoding="utf-8")
print(f"{60 / P:.3f} BPM, phase {ph:.4f}, inliers {sc:.2f}; snare counts by beat {counts.tolist()} -> downbeat phase {d}; "
      f"{len(beats)} beats, {len(downbeats)} downbeats, first downbeats {downbeats[:5]}")
print("sections:", [(s["name"], round(s["start"], 2)) for s in a["sections"]])

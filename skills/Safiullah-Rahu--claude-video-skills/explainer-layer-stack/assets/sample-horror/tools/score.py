"""Horror bed for layer-stack-horror: a low beating drone that creeps in from chapter 09 (~55 % of the film), swells when
the lights go down in the last chapter, a heartbeat under "Eleven went in. Twelve came out.", true silence, then one
sting on the blackout. Everything synthesized; times come from data/vo.json (same formulas as scene.js).

usage: python -I tools/score.py <project dir>   ->  audio/bed.wav (48 kHz stereo float), passed as sound.json music_file
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
vo = json.loads((root / "data" / "vo.json").read_text(encoding="utf-8"))
L = {l["id"]: l for l in vo["lines"]}
word = lambda lid, w: next(x["start"] for x in L[lid]["words"] if x["w"].lower().strip(",.:").startswith(w))
dur = vo["duration"] + 0.5
n = int(dur * SR)
t = np.arange(n) / SR
rng = np.random.default_rng(7)

t_creep = L["c09"]["start"] - 0.1            # chapter 09 cut
t_full = t_creep + 9.0
t_night = word("c14", "closing") + 0.1        # the house lights go down
t_match = word("c14", "match")
t_endv = L["c14c"]["end"]
t_black = t_endv + 1.45                       # blackout (scene.js: tBlack)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def smooth(u):
    u = np.clip(u, 0, 1)
    return u * u * (3 - 2 * u)


# ---------------------------------------------------------------- drone: beating low partials + a little air
def drone(phase):
    parts = [(49.0, 1.0), (49.55, 0.8), (98.0, 0.5), (98.9, 0.42), (146.8, 0.2), (155.6, 0.13), (196.0, 0.09), (233.1, 0.05)]
    x = sum(a * np.sin(2 * np.pi * f * t + phase * (i + 1)) for i, (f, a) in enumerate(parts))
    air = bp(rng.standard_normal(n), 140, 620) * 0.35 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.05 * t + phase))
    x = x + air
    x *= 1 + 0.22 * np.sin(2 * np.pi * 0.07 * t + phase)
    return x


D = np.stack([drone(0.0), drone(1.3)], axis=1)
D /= np.sqrt((D ** 2).mean())
D *= 0.02
env = smooth((t - t_creep) / (t_full - t_creep))
env *= 1 + 0.8 * smooth((t - t_night) / 0.6)
env *= 1 - smooth((t - t_endv - 0.02) / 0.25)    # true silence before the blackout
D *= env[:, None]

# ---------------------------------------------------------------- heartbeat: lub-dub, slowly accelerating
H = np.zeros(n)
tb, per = t_match + 0.35, 0.92
while tb < t_endv - 0.05:
    for d, a in ((0.0, 1.0), (0.19, 0.68)):
        i = int((tb + d) * SR)
        k = min(int(0.32 * SR), n - i)
        if k <= 0:
            continue
        u = np.arange(k) / SR
        f = 62 * (1 + 0.6 * np.exp(-u / 0.02))
        thump = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-u / 0.085)
        body = np.sin(2 * np.pi * 124 * u) * np.exp(-u / 0.05) * 0.45
        knock = lp(rng.standard_normal(k), 900) * np.exp(-u / 0.012) * 0.25
        H[i:i + k] += a * (thump + body + knock)
    tb += per
    per = max(0.72, per * 0.96)
H *= 0.24 / (np.abs(H).max() + 1e-9)

# ---------------------------------------------------------------- the sting (one hit, on the blackout)
ks = int(3.6 * SR)
u = np.arange(ks) / SR
boom = np.sin(2 * np.pi * np.cumsum(80 * np.exp(-u / 0.5) + 30) / SR) * np.exp(-u / 0.7) * 0.9
clu = np.zeros(ks)
for f in (311.1, 329.6, 466.2, 493.9, 740.0, 784.0, 1108.7):
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.5 * u + f)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    saw = sum(np.sin(h * ph) / h for h in range(1, 9))
    clu += saw * 0.11
clu = lp(clu, 3800) * (1 - np.exp(-u / 0.006)) * np.exp(-u / 1.1)
hit = bp(rng.standard_normal(ks), 900, 9000) * np.exp(-u / 0.09) * 0.6
dry = boom + clu + hit
ir_n = int(2.4 * SR)
ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR / 0.8)
ir = lp(ir, 5000)
wet = fftconvolve(dry, ir)[:ks]
wet *= np.abs(dry).max() / (np.abs(wet).max() + 1e-9)
sting = dry + 0.5 * wet
sting *= np.exp(-np.clip(u - 2.4, 0, None) / 0.5)
sting *= 0.55 / np.abs(sting).max()

out = D.copy()
out[:, 0] += H
out[:, 1] += H
i0 = int(t_black * SR)
k = min(ks, n - i0)
out[i0:i0 + k, 0] += sting[:k]
out[i0:i0 + k, 1] += sting[:k] * 0.97
sf.write(root / "audio" / "bed.wav", out.astype(np.float32), SR, subtype="FLOAT")
print(json.dumps({"creep": round(t_creep, 2), "night": round(t_night, 2), "heart": round(t_match + 0.35, 2), "silence": round(t_endv, 2),
                  "black": round(t_black, 2), "dur": round(dur, 2)}))

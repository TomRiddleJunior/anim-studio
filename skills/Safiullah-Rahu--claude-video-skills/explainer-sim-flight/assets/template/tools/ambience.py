"""Sim-flight ambience bed: per-shot synthesized aircraft sound under the narration (no music, as in the source):
jet rumble + turbine whine + wind on chase shots, prop drone, afterburner roar, flyby whooshes, a double-crack sonic
boom for the merged-shock shot and the chase plane, soft thumps for the quiet-boom shots, evening crickets, high wind.
Hard-switches with the picture (each ambience entry starts on its cut, 40 ms crossfade). Driven by film.json via
score/data/shots.json (written by build_sim.py). Deterministic (seeded).

usage: ~/.generative-music-video/venv/Scripts/python.exe -I tools/ambience.py   -> score/audio/bed.wav
"""
import json
import os

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
SH = json.load(open(os.path.join(ROOT, "score", "data", "shots.json")))
DUR = SH["duration"] + 0.3
N = int(DUR * SR)
rng = np.random.default_rng(59)


def bp(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo / (SR / 2), hi / (SR / 2)], btype="band", output="sos"), x)


def lp(x, f, o=2):
    return sosfilt(butter(o, f / (SR / 2), btype="low", output="sos"), x)


def hp(x, f, o=2):
    return sosfilt(butter(o, f / (SR / 2), btype="high", output="sos"), x)


def noise(n):
    return rng.standard_normal(n)


def tt(n):
    return np.arange(n) / SR


def slow(n, rate=0.6, depth=0.25):  # slow random amplitude wobble
    k = max(4, int(n / SR * rate * 4) + 4)
    pts = 1 + depth * rng.standard_normal(k)
    return np.interp(np.linspace(0, k - 1, n), np.arange(k), pts)


def jet(n, rumble=1.0, whine=0.12, wind=0.5, pitch=5800):
    t = tt(n)
    r = lp(noise(n), 260, 3) * 2.2 * rumble * slow(n, 0.5, 0.15)
    w = bp(noise(n), 400, 2600) * wind * slow(n, 0.8, 0.3)
    wh = np.sin(2 * np.pi * np.cumsum(pitch * (1 + 0.004 * np.sin(2 * np.pi * 0.7 * t))) / SR) * whine * 0.25
    return r + w + wh


def prop(n):
    t = tt(n)
    f = 86.0
    x = sum(np.sin(2 * np.pi * f * k * t + k) / k ** 1.2 for k in range(1, 9)) * 0.35
    x *= 1 + 0.25 * np.sin(2 * np.pi * 3.1 * t)  # beating of two props
    return x + lp(noise(n), 400) * 0.6 + bp(noise(n), 500, 2000) * 0.15


def afterburner(n):
    x = lp(noise(n), 1800, 2) * 1.6 + lp(noise(n), 120, 2) * 2.5
    crackle = (rng.random(n) < 0.0016) * rng.standard_normal(n) * 6
    return x + hp(crackle, 800) * 0.6


def wind(n, lo=250, hi=1600, k=0.8):
    return bp(noise(n), lo, hi) * k * slow(n, 0.4, 0.45)


def crickets(n):
    t = tt(n)
    out = np.zeros(n)
    for f, rate, ph in [(4300, 7.0, 0.0), (4700, 5.3, 1.1), (3900, 6.1, 2.0)]:
        gate = (np.sin(2 * np.pi * rate * t + ph) > 0.55) * (np.sin(2 * np.pi * 0.35 * t + ph) > -0.3)
        out += np.sin(2 * np.pi * f * t) * lp(gate.astype(float), 60) * 0.05
    return out + bp(noise(n), 150, 900) * 0.12


def whoosh(n, f0=3000, f1=300):
    env = np.sin(np.linspace(0, np.pi, n)) ** 2
    x = noise(n)
    out = np.zeros(n)
    seg = 2048
    for i in range(0, n, seg):
        u = i / n
        f = f0 * (f1 / f0) ** u
        out[i:i + seg] = bp(x[i:i + seg], max(80, f * 0.5), min(SR / 2 - 200, f * 1.6))[: len(out[i:i + seg])]
    return out * env * 1.6


def boom(strength=1.0, gap=0.11):
    """N-wave double crack + rumble tail."""
    n = int(1.6 * SR)
    x = np.zeros(n)
    for k, a in enumerate((1.0, 0.85)):
        i = int(k * gap * SR)
        L = int(0.006 * SR)
        x[i:i + L] += a
        x[i + int(0.004 * SR):i + int(0.004 * SR) + L] -= a * 0.9
    tail = lp(noise(n), 90, 2) * np.exp(-np.linspace(0, 6, n)) * 3
    x = lp(x, 3500) * 9 + tail
    return x * strength


def thump(strength=0.5):
    n = int(0.7 * SR)
    t = tt(n)
    x = np.sin(2 * np.pi * 42 * t) * np.exp(-t * 9) + 0.6 * np.sin(2 * np.pi * 42 * (t - 0.09)) * np.exp(-np.clip(t - 0.09, 0, None) * 9) * (t > 0.09)
    return lp(x + lp(noise(n), 200) * np.exp(-t * 12) * 0.3, 300) * strength


bed = np.zeros(N)


def seg(t0, t1, gen, gain=1.0, fade=0.04):
    i0, i1 = int(t0 * SR), min(N, int(t1 * SR))
    n = i1 - i0
    if n <= 0:
        return
    x = gen(n) * gain
    f = int(fade * SR)
    env = np.ones(n)
    env[:f] = np.linspace(0, 1, f)
    env[-f:] = np.linspace(1, 0, f)
    bed[i0:i1] += x * env


def put(t, x, gain=1.0):
    i = int(t * SR)
    k = min(len(x), N - i)
    if k > 0:
        bed[i:i + k] += x[:k] * gain


GEN = {
    "jet": lambda n: jet(n, 1.0, 0.18, 0.7),
    "jet-far": lambda n: jet(n, 0.4, 0.0, 0.2),
    "prop": lambda n: prop(n) + wind(n, 200, 900, 0.3),
    "afterburner": lambda n: afterburner(n),
    "wind": lambda n: wind(n, 300, 2200, 1.0) + jet(n, 0.4, 0.0, 0.0),
    "crickets": lambda n: crickets(n),
    "high": lambda n: wind(n, 400, 3000, 0.7) + jet(n, 0.5, 0.12, 0.2, 6200),
}
amb = sorted(SH["ambience"], key=lambda a: a["t"])
for i, a in enumerate(amb):
    t1 = amb[i + 1]["t"] if i + 1 < len(amb) else DUR
    seg(a["t"], t1, GEN[a["kind"]], a.get("gain", 1.0))
for e in SH.get("events", []):
    x = {"boom": lambda: boom(1.0), "thump": lambda: thump(0.6), "whoosh": lambda: whoosh(int(0.8 * SR), 2500, 250)}[e["kind"]]()
    put(e["t"], x, e.get("gain", 1.0))
bed = hp(bed, 25)
bed /= np.abs(bed).max() + 1e-9
out = os.path.join(ROOT, "score", "audio", "bed.wav")
sf.write(out, np.stack([bed, bed], axis=1).astype(np.float32) * 0.9, SR, subtype="FLOAT")
print("bed", out, round(DUR, 2), "s")

"""Dark cinematic music bed for the gold-studio reel, synthesized (no samples): a sub-bass drone and a low detuned-saw
pad that change chord every ~3.5 s (the source's spectrogram shows sustained low bands that move every 3-4 s), a soft
low pulse, sparse high bell glints, a drop before each title card and a resolve at the end.

usage: <venv python> -I tools/make_bed.py      -> score/audio/bed.wav (48 kHz stereo)
markers: score/bed.json {"titles": [line ids], "dark_from": id, "end_from": id, "pulse_from": id} (all optional)
"""
import json
import math
import os

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
VO = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
DUR = VO["duration"] + 0.3
L = {l["id"]: l for l in VO["lines"]}
RNG = np.random.default_rng(3)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lp(x, f, o=2):
    return sosfilt(butter(o, f / (SR / 2), btype="low", output="sos"), x)


def hp(x, f, o=2):
    return sosfilt(butter(o, f / (SR / 2), btype="high", output="sos"), x)


def env(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na) ** 1.5
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr) ** 1.5
    return e


def saw(f, n, ph=0.0):
    t = np.arange(n) / SR
    return 2 * ((f * t + ph) % 1.0) - 1


def pad(notes, dur, gain, cut):
    n = int(dur * SR)
    out = np.zeros((n, 2))
    for k, m in enumerate(notes):
        for d, pan in ((-0.09, -0.6), (0.0, 0.0), (0.08, 0.6)):
            x = saw(mtof(m + d), n, RNG.random())
            l, r = math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
            out[:, 0] += x * l
            out[:, 1] += x * r
    out = np.stack([lp(out[:, 0], cut, 4), lp(out[:, 1], cut, 4)], 1)
    return out * env(n, 1.2, 1.6)[:, None] * gain / len(notes)


def sub(m, dur, gain):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * mtof(m) * t) + 0.25 * np.sin(4 * np.pi * mtof(m) * t)
    return np.stack([x, x], 1) * env(n, 0.6, 1.2)[:, None] * gain


def kick(gain):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 46 + 70 * np.exp(-t / 0.03)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22)
    return np.stack([x, x], 1) * gain


def bell(m, gain):
    n = int(3.0 * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    x = np.sin(2 * np.pi * f * t + 1.1 * np.exp(-t / 0.4) * np.sin(2 * np.pi * f * 2.0 * t)) * np.exp(-t / 1.1)
    p = RNG.uniform(-0.5, 0.5)
    return np.stack([x * (1 - p), x * (1 + p)], 1) * gain * 0.5


def place(bus, x, t):
    i = int(t * SR)
    if i >= len(bus):
        return
    x = x[: len(bus) - i]
    bus[i:i + len(x)] += x


def main():
    N = int(DUR * SR)
    bus = np.zeros((N, 2))
    # markers (score/bed.json): title-card lines (the bed drops under them), the line where the darker second half
    # starts, the line where the ending starts, the line where the soft pulse starts
    cfp = os.path.join(ROOT, "score", "bed.json")
    C = json.load(open(cfp)) if os.path.exists(cfp) else {}
    st = lambda i, d: L[i]["start"] if i in L else d
    titles = [L[i]["start"] - 0.12 for i in C.get("titles", []) if i in L]
    t_title = titles[0] if titles else DUR
    t_end = st(C.get("end_from"), DUR - 4.0) - 0.12
    t_alb = st(C.get("dark_from"), t_end) - 0.05
    t_pulse = st(C.get("pulse_from"), 0.0)
    # D minor: i - VI - III - VII, then darker iv - i under Alberta, resolve at the end
    prog = [(50, [62, 65, 69]), (46, [58, 62, 65]), (53, [60, 65, 69]), (48, [60, 64, 67])]
    dark = [(43, [55, 58, 62]), (50, [57, 62, 65])]
    step = 3.5
    t = 0.0
    k = 0
    while t < DUR - 1.5:
        if t_alb <= t < t_end:
            root, notes = dark[k % 2]
        else:
            root, notes = prog[k % 4]
        seg = step + 1.2
        en = 0.75 if t < t_title else (1.0 if t < t_alb else 0.85)
        place(bus, pad(notes, seg, 0.55 * en, 520 + 260 * en), t)
        place(bus, sub(root - 12, seg, 0.5 * en), t)
        t += step
        k += 1
    # soft pulse (72 bpm) under the Alaska growth section and the ending
    beat = 60 / 72
    for a, b in ((t_pulse, t_alb), (t_end + 2.0, DUR - 2.0)):
        tt = a
        while tt < b:
            place(bus, kick(0.35), tt)
            tt += beat * 2
    # sparse glints
    for tt, m in ((2.6, 81), (6.0, 86), (14.6, 81), (24.5, 84), (30.0, 88), (41.0, 81), (52.9, 86), (58.0, 81)):
        place(bus, bell(m, 0.18), tt)
    # drops: duck the bed into each title card, then let it swell back
    g = np.ones(N)
    for tc, hold in [(x, 1.45) for x in titles]:
        a, b = int((tc - 0.25) * SR), int((tc + hold) * SR)
        g[a:b] = np.minimum(g[a:b], 0.25)
        r = int(0.6 * SR)
        g[b:b + r] = np.minimum(g[b:b + r], np.linspace(0.25, 1, r))
    bus *= g[:, None]
    # final resolve: D minor add9 swell + low bell
    if DUR - (t_end + 4.2) > 0.5:
        place(bus, pad([62, 64, 65, 69, 74], DUR - (t_end + 4.2), 0.6, 900), t_end + 4.2)
        place(bus, sub(38, DUR - (t_end + 4.2), 0.6), t_end + 4.2)
    place(bus, bell(74, 0.3), DUR - 3.2)
    # room
    n = int(2.2 * SR)
    tt = np.arange(n) / SR
    ir = np.stack([lp(RNG.standard_normal(n), 5000) * np.exp(-6.9 * tt / 2.2), lp(RNG.standard_normal(n), 5000) * np.exp(-6.9 * tt / 2.2)], 1)
    ir /= np.sqrt((ir ** 2).sum(0, keepdims=True))
    wet = np.stack([fftconvolve(bus[:, 0], ir[:, 0])[:N], fftconvolve(bus[:, 1], ir[:, 1])[:N]], 1)
    bus = bus * 0.75 + wet * 0.45
    bus = hp(bus.T, 28).T
    bus /= np.abs(bus).max() + 1e-9
    fl = int(1.0 * SR)
    bus[-fl:] *= np.linspace(1, 0, fl)[:, None]
    os.makedirs(os.path.join(ROOT, "score", "audio"), exist_ok=True)
    sf.write(os.path.join(ROOT, "score", "audio", "bed.wav"), (bus * 0.8).astype(np.float32), SR, subtype="FLOAT")
    print("bed", round(DUR, 2), "s")


if __name__ == "__main__":
    main()

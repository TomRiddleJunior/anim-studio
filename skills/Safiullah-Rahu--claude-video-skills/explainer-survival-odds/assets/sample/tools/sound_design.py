"""Soundtrack for "Survival Odds · The Rig · Day 1", fully synthesized (no samples): voice + ambience + story SFX + the
odds ring's identity sounds (tools/odds_sound.py) + an original music bed made in code. Two mixes:
  full      voice + ambience + SFX + ring sounds + music          -> score/audio/final.wav, assets/audio/final.m4a
  nomusic   voice + ambience + SFX + ring sounds (no music bed)   -> score/audio/final_nomusic.wav
  ambience  storm wind (gusts, whistles), rain, the swell on the legs, the flare's roar, the control room's hum, the
            underwater hush; zones follow the shot clock (outside / inside / underwater)
  sfx       booms on both black beats + a riser, whooshes on cuts, heartbeat under the turn, radio static/squelch/chatter,
            typing, UI pops, clock ticks, the gauge tap, pen scratch, the microwave hum + ding, a gull, relay clicks for the
            helideck lights, the helicopter (rotor thump + turbine), countdown ticks, a distant crowd, the underwater plunge
            and bubbles, the watermaker pump + pouring, the generator, the winch ratchet + clank + draining water, the chain
            + padlock, pen ticks for the checklist, the lamp flicker, end-card hits
  ring      the sting (frame 1, and quietly on end card 1), one tick per digit step, delta pops, the 97 % swell, the glitch, the landing
  music     76 BPM, D minor: a filtered bass pulse, a pad, a sparse high "data" arpeggio, a soft kick in the tense stretch;
            its energy follows the beat map; it drops out on "On paper"
  levels    ambience ~ -22 dB and music ~ -19 dB under the voice (speech-gated RMS); SFX peaks ~3 dB under the voice peaks;
            two-pass loudnorm -14 LUFS, TP -2.0 (AAC adds ~0.5 dB)
usage: ~/.generative-music-video/venv/Scripts/python.exe -I tools/sound_design.py
"""
import json
import os
import re
import subprocess
import sys

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import odds_sound as OS  # noqa: E402

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import paths  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = paths.ffmpeg()
SR = 48000
RNG = np.random.default_rng(23)
TM = json.load(open(os.path.join(ROOT, "score", "timing.json"), encoding="utf-8"))
VOJ = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
T, DUR = TM["T"], TM["dur"]
N = int(DUR * SR)
t_ = np.arange(N) / SR
LINES = {l["id"]: l for l in VOJ["lines"]}


def word(lid, w, k=0):
    hits = [x for x in LINES[lid]["words"] if re.sub(r"[^a-z0-9']", "", x["w"].lower()).startswith(w.lower())]
    return hits[min(k, len(hits) - 1)]["start"]


def bp(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo / (SR / 2), hi / (SR / 2)], btype="band", output="sos"), x, axis=0)


def lp(x, f, o=2):
    return sosfilt(butter(o, f / (SR / 2), btype="low", output="sos"), x, axis=0)


def hp(x, f, o=2):
    return sosfilt(butter(o, f / (SR / 2), btype="high", output="sos"), x, axis=0)


def env_pw(points):
    ts, vs = zip(*points)
    return np.interp(t_, ts, vs)


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(np.square(x))) + 1e-12)


def place(bus, x, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= len(bus) or i + len(x) <= 0 or i < 0:
        return
    x = x[: max(0, len(bus) - i)]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[i:i + len(x), 0] += x * g * l * 1.414
    bus[i:i + len(x), 1] += x * g * r * 1.414


def tt(d):
    return np.arange(int(d * SR)) / SR


def reverb(x, rt=1.6, wet=0.25, seed=3):
    n = int(rt * SR)
    r = np.random.default_rng(seed)
    ir = r.standard_normal((n, 2)) * np.exp(-6.9 * np.arange(n) / n)[:, None]
    ir = lp(ir, 5000)
    ir /= np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True)) + 1e-9
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)
    return x * (1 - wet) + y * wet


def zone(segs):
    z = np.zeros(N)
    for a, b in segs:
        z[int(a * SR):int(b * SR)] = 1
    return lp(z, 6)


# ------------------------------------------------------------------ zones (from the shot clock)
IN_SHOTS = [("C", "D"), ("E", "E2"), ("F1", "I2"), ("N", "O2"), ("R", "S")]
INSIDE = zone([(T[a], T[b]) for a, b in IN_SHOTS] + [(T["D"], T["D"] + 0.6)])
UNDER = zone([(T["L2"], T["M"])])
OUTSIDE = np.clip(1 - INSIDE - UNDER, 0, 1)
NEARFLARE = zone([(T["A2"], T["B"]), (T["O2"], T["Q1"])])
BLACK = zone([(T["B"], T["C"]), (T["S"], DUR)])

# ------------------------------------------------------------------ ambience
wn = RNG.standard_normal((N, 2))
gust = 0.5 + 0.28 * np.sin(2 * np.pi * 0.07 * t_) + 0.16 * np.sin(2 * np.pi * 0.23 * t_ + 1.1) + 0.06 * np.sin(2 * np.pi * 0.61 * t_ + 2.0)
wind = (lp(wn, 300, 2) * 1.1 + bp(wn, 300, 1600) * 0.55) * gust[:, None]
whistle = np.zeros(N)
for f0, a in [(620, 0.05), (1130, 0.03), (845, 0.02)]:
    f = f0 * (1 + 0.05 * np.sin(2 * np.pi * 0.19 * t_ + f0))
    whistle += a * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.clip(gust - 0.5, 0, 1) * 3
wind = (wind + whistle[:, None]) * (OUTSIDE * (1 - 0.4 * BLACK))[:, None] + lp(wind, 180) * 0.08 * INSIDE[:, None]
rn = RNG.standard_normal((N, 2))
drops = (RNG.random((N, 2)) > 0.9993) * RNG.standard_normal((N, 2)) * 3
rain = (hp(rn, 3000) * 0.22 + bp(drops, 1500, 7000) * 0.6) * (OUTSIDE * (1 - 0.6 * BLACK))[:, None] + bp(drops, 300, 1800) * 0.35 * INSIDE[:, None]
wash = np.zeros(N)
k = 0.0
while k < DUR:
    d = RNG.uniform(3.5, 6.5)
    x = tt(d)
    e = np.sin(np.pi * x / d) ** 2 * (0.6 + 0.4 * RNG.random())
    i = int(k * SR)
    seg = e[: max(0, N - i)]
    wash[i:i + len(seg)] += seg
    k += d * 0.62
sea = (lp(RNG.standard_normal((N, 2)), 220) * 0.9 + bp(RNG.standard_normal((N, 2)), 220, 1400) * 0.35) * (0.35 + 0.65 * wash)[:, None]
sea = sea * (OUTSIDE * (1 - 0.3 * BLACK))[:, None] + lp(sea, 120) * 0.25 * INSIDE[:, None]
flu = 0.7 + 0.3 * lp(RNG.standard_normal(N), 14) * 6
roar = (bp(RNG.standard_normal((N, 2)), 50, 380) * 0.9 + bp(RNG.standard_normal((N, 2)), 380, 1500) * 0.18) * np.clip(flu, 0.2, 1.4)[:, None]
roar = roar * (0.25 * OUTSIDE + 1.0 * NEARFLARE)[:, None]
hum = (0.05 * np.sin(2 * np.pi * 50 * t_) + 0.025 * np.sin(2 * np.pi * 100 * t_) + 0.012 * np.sin(2 * np.pi * 150 * t_))[:, None] + bp(RNG.standard_normal((N, 2)), 180, 900) * 0.07
opT = word("l17", "On")
dip = 1 - 0.55 * (((t_ > opT - 0.05) & (t_ < opT + 0.09)) | ((t_ > opT + 0.3) & (t_ < opT + 0.42)))
hum = hum * (INSIDE * lp(dip, 60))[:, None]
uw = (lp(RNG.standard_normal((N, 2)), 160) * 1.2 + 0.08 * np.sin(2 * np.pi * 38 * t_)[:, None]) * UNDER[:, None]
amb = wind * 1.0 + rain * 0.9 + sea * 1.1 + roar * 0.8 + hum + uw

# ------------------------------------------------------------------ music bed (full mix only): 76 BPM, D minor
BPM = 76.0
BEAT = 60 / BPM
mtof = lambda m: 440.0 * 2 ** ((m - 69) / 12)
energy = env_pw([(0, 0.5), (T["B"] - 0.1, 0.5), (T["B"], 0.18), (T["C"] - 0.1, 0.18), (T["C"], 0.38), (T["G"], 0.4), (T["G"] + 0.5, 0.6), (T["H"], 0.62),
                 (T["H2"], 0.72), (T["J"], 0.8), (T["K"], 0.86), (T["L1"], 0.86), (T["L1"] + 0.4, 0.66), (T["M"], 0.62), (T["N"], 0.55), (T["Q1"], 0.66),
                 (T["R"], 0.74), (opT - 0.15, 0.82), (opT, 0.0), (T["S"], 0.0), (T["S"] + 0.2, 0.32), (T["Z1"], 0.36), (T["Z2"], 0.26), (DUR - 0.5, 0.0), (DUR, 0.0)])
lift = zone([(T["L1"], T["M"])])                     # "decided to stay": the progression lifts to the relative major
chords = [[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52]]              # Dm  Bb  Gm  A
chords_lift = [[53, 57, 60], [48, 52, 55], [46, 50, 53], [45, 49, 52]]        # F   C   Bb  A
mus = np.zeros((N, 2))
bar = 4 * BEAT
nb = int(DUR / bar) + 1
for b in range(nb):
    t0 = b * bar
    i0 = int(t0 * SR)
    if i0 >= N:
        break
    lk = lift[min(N - 1, i0)]
    ch = chords_lift[b % 4] if lk > 0.5 else chords[b % 4]
    # pad: detuned saws, low-passed, slow attack
    x = tt(bar + 0.6)
    pad = np.zeros(len(x))
    for m in ch:
        for det in (-0.12, 0.0, 0.11):
            f = mtof(m + 12) * 2 ** (det / 12)
            ph = 2 * np.pi * f * x
            pad += (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.18 * np.sin(3 * ph)) / 9
    pad *= np.clip(x / 0.9, 0, 1) * np.clip((bar + 0.6 - x) / 0.6, 0, 1)
    pad = lp(pad, 1400)
    place(mus, pad * 0.5, t0, 1.0, -0.15)
    place(mus, pad * 0.5, t0 + 0.012, 1.0, 0.15)
    # bass pulse on 8ths (plucky, filtered)
    root = ch[0] - 12
    for h in range(8):
        tb = t0 + h * BEAT / 2
        x = tt(0.34)
        f = mtof(root)
        s = (np.sin(2 * np.pi * f * x) + 0.5 * np.sign(np.sin(2 * np.pi * f * x)) * 0.4) * np.exp(-x * 9)
        s = lp(s, 420 + 900 * np.exp(-x * 20).mean())
        place(mus, s * (0.55 if h % 2 == 0 else 0.38), tb)
    # sparse data arpeggio (high plucks) — the "machine counting" colour
    R = np.random.default_rng(b + 7)
    for h in range(16):
        if R.random() < 0.32 + 0.3 * energy[min(N - 1, i0)]:
            m = ch[R.integers(0, 3)] + 24 + (12 if R.random() < 0.25 else 0)
            x = tt(0.22)
            s = np.sin(2 * np.pi * mtof(m) * x) * np.exp(-x * 26) * 0.22
            tb = t0 + h * BEAT / 4
            place(mus, s, tb, 1.0, R.uniform(-0.6, 0.6))
            place(mus, s * 0.35, tb + BEAT * 0.75, 1.0, R.uniform(-0.6, 0.6))   # a dotted echo
    # soft kick on 1 and 3 when the energy is high
    for h in (0, 2):
        tb = t0 + h * BEAT
        i = int(tb * SR)
        if i < N and energy[i] > 0.6:
            x = tt(0.4)
            kk = np.sin(2 * np.pi * (48 + 70 * np.exp(-x * 30)) * x) * np.exp(-x * 9)
            place(mus, kk * 0.9 * (energy[i] - 0.5) * 2, tb)
mus *= energy[:, None]
mus = reverb(mus, 2.2, 0.28, seed=5)
drone = (np.sin(2 * np.pi * 36.71 * t_) + 0.6 * np.sin(2 * np.pi * 73.42 * t_) + 0.25 * np.sin(2 * np.pi * 77.78 * t_))[:, None] * 0.12   # D1/D2 + a sour Eb2
drone = drone * env_pw([(0, 0), (T["B"], 0), (T["B"] + 0.2, 1), (T["C"], 1), (T["C"] + 0.5, 0), (T["S"], 0), (T["S"] + 0.2, 1.2), (T["Z2"], 1.0), (DUR - 0.3, 0), (DUR, 0)])[:, None]
music = mus + drone

# ------------------------------------------------------------------ SFX library
def boom(d=2.4):
    x = tt(d)
    f = 50 * np.exp(-x * 1.1) + 28
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 1.6) + lp(RNG.standard_normal(len(x)), 180) * np.exp(-x * 7) * 0.8


def riser(d=1.3):
    x = tt(d)
    n = RNG.standard_normal(len(x))
    out = np.zeros(len(x))
    for i, (lo, hi) in enumerate([(300, 900), (700, 2000), (1500, 4500)]):
        out += bp(n, lo, hi) * np.clip((x / d) * 3 - i, 0, 1)
    return out * (x / d) ** 2


def whoosh(d=0.45):
    x = tt(d)
    n = RNG.standard_normal(len(x))
    return (bp(n, 300, 1400) * 0.7 + bp(n, 1400, 4000) * 0.3) * np.sin(np.pi * x / d) ** 2


def thump(f=55, d=0.25):
    x = tt(d)
    return np.sin(2 * np.pi * f * x * (1 - 0.3 * x / d)) * np.exp(-x * 18) + lp(RNG.standard_normal(len(x)), 140) * np.exp(-x * 40) * 0.5


def heartbeat():
    out = np.zeros(int(0.5 * SR))
    a, b = thump(52), thump(48)
    out[: len(a)] += a
    out[int(0.14 * SR): int(0.14 * SR) + len(b)] += b * 0.75
    return out


def static(d=0.55):
    x = tt(d)
    n = bp(RNG.standard_normal(len(x)), 900, 4200)
    cr_ = (RNG.random(len(x)) > 0.9965) * RNG.standard_normal(len(x)) * 6
    return (n + bp(cr_, 600, 5000)) * np.exp(-x * 3) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 23 * x)))


def squelch():
    x = tt(0.18)
    return bp(RNG.standard_normal(len(x)), 1200, 3800) * np.exp(-x * 14)


def chatter(d, lo=350, hi=2800):
    x = tt(d)
    n = bp(RNG.standard_normal(len(x)), lo, hi)
    syl = lp((RNG.random(len(x)) > 0.99985).astype(float), 5) * 40
    return n * np.clip(syl, 0, 1) * 0.8 + bp(RNG.standard_normal(len(x)), 1500, 3500) * 0.08


def click(f=3200, d=0.012):
    x = tt(d)
    return bp(RNG.standard_normal(len(x)), f * 0.6, min(f * 1.6, 20000)) * np.exp(-x * 400)


def blip(f0=660, f1=900, d=0.09):
    x = tt(d)
    f = np.linspace(f0, f1, len(x))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 38)


def pop(f0=620, f1=880):
    s = blip(f0, f1)
    c = click(3500)
    s[: len(c)] += c * 0.5
    return s


def paper(d=0.3):
    x = tt(d)
    return bp(RNG.standard_normal(len(x)), 1800, 7000) * np.sin(np.pi * x / d) * (0.7 + 0.3 * np.sin(2 * np.pi * 37 * x))


def pentick():
    a, b = click(5200, 0.01), click(2600, 0.02)
    out = np.zeros(int(0.08 * SR))
    out[: len(a)] += a
    out[int(0.035 * SR): int(0.035 * SR) + len(b)] += b * 0.8
    return out


def woodtick():
    x = tt(0.06)
    s = np.sin(2 * np.pi * 1800 * x) * np.exp(-x * 90) * 0.6
    c = click(2500)
    s[: len(c)] += c * 0.4
    return s


def tink():
    x = tt(0.3)
    return (np.sin(2 * np.pi * 2900 * x) * 0.5 + np.sin(2 * np.pi * 4300 * x) * 0.3) * np.exp(-x * 30)


def scratch(d=0.8):
    x = tt(d)
    strokes = (np.sin(2 * np.pi * 5.5 * x) > 0).astype(float)
    return bp(RNG.standard_normal(len(x)), 2500, 7500) * lp(strokes, 30) * 0.8


def mwhum(d):
    x = tt(d)
    return (np.sign(np.sin(2 * np.pi * 120 * x)) * 0.15 + np.sin(2 * np.pi * 60 * x) * 0.5) * np.clip(x / 0.05, 0, 1) * np.clip((d - x) / 0.05, 0, 1)


def ding():
    x = tt(1.2)
    return (np.sin(2 * np.pi * 2093 * x) + 0.4 * np.sin(2 * np.pi * 4186 * x)) * np.exp(-x * 4.5) * 0.5


def gull(d=0.5):
    x = tt(d)
    f = 1500 + 900 * np.exp(-((x - 0.08) / 0.07) ** 2) - 500 * np.clip((x - 0.15) / 0.3, 0, 1)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + 0.6 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph)
    e = np.clip(x / 0.02, 0, 1) * np.exp(-np.maximum(x - 0.12, 0) * 7)
    return bp(s * e, 900, 6000) * 0.6


def relay():
    x = tt(0.09)
    return bp(RNG.standard_normal(len(x)), 1200, 5000) * np.exp(-x * 120) + np.sin(2 * np.pi * 180 * x) * np.exp(-x * 60) * 0.5


def rotor(d, rate=5.4, near=1.0):
    x = tt(d)
    ph = (x * rate) % 1.0
    slap = np.exp(-ph * 28) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.4 * x))
    body = lp(RNG.standard_normal(len(x)), 300) * slap * 1.4 + np.sin(2 * np.pi * 70 * x) * slap * 0.5
    turb = np.sin(2 * np.pi * np.cumsum(np.full(len(x), 3100.0)) / SR) * 0.03 * near + bp(RNG.standard_normal(len(x)), 2000, 5000) * 0.05 * near
    return lp(body, 900) + turb


def moan(d):
    x = tt(d)
    out = np.zeros(len(x))
    R = np.random.default_rng(31)
    for _ in range(14):
        a = int(R.uniform(0, d - 1.2) * SR)
        L = int(R.uniform(0.6, 1.2) * SR)
        y = np.arange(L) / SR
        f = R.uniform(90, 170) * (1 - 0.25 * y / y[-1])
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sign(np.sin(4 * np.pi * np.cumsum(f) / SR)) * 0.4
        out[a:a + L] += bp(s, 120, 900) * np.sin(np.pi * y / y[-1]) * R.uniform(0.4, 1.0)
    return out * 0.5


def plunge():
    x = tt(1.6)
    return lp(RNG.standard_normal(len(x)), 500) * np.exp(-x * 2.5) * 1.2 + np.sin(2 * np.pi * 45 * x) * np.exp(-x * 4) * 0.6


def bubbles(d, n=24):
    out = np.zeros(int(d * SR))
    R = np.random.default_rng(77)
    for _ in range(n):
        a = int(R.uniform(0, d - 0.1) * SR)
        x = tt(0.05)
        f = R.uniform(400, 1300) * (1 + 3 * x / 0.05)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 60) * R.uniform(0.3, 1)
        out[a:a + len(s)] += s[: len(out) - a]
    return out


def pour(d):
    x = tt(d)
    f = 600 + 900 * (x / d)
    gl = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.4 + 0.6 * (lp(RNG.standard_normal(len(x)), 40) > 0))
    return bp(RNG.standard_normal(len(x)), 800, 6000) * 0.5 + bp(gl, 300, 3000) * 0.3


def pump(d):
    x = tt(d)
    return (np.sin(2 * np.pi * 100 * x) * 0.4 + np.sign(np.sin(2 * np.pi * 50 * x)) * 0.1 + bp(RNG.standard_normal(len(x)), 300, 2000) * 0.2) * np.clip(x / 0.1, 0, 1) * np.clip((d - x) / 0.1, 0, 1)


def engine(d):
    x = tt(d)
    s = sum(a * np.sin(2 * np.pi * f * x) for f, a in [(31, 1.0), (62, 0.6), (93, 0.35), (124, 0.2)]) * (0.85 + 0.15 * np.sin(2 * np.pi * 7 * x))
    return lp(s + bp(RNG.standard_normal(len(x)), 100, 600) * 0.4, 700) * np.clip(x / 0.2, 0, 1) * np.clip((d - x) / 0.2, 0, 1)


def ratchet(d, step=0.075):
    x = tt(d)
    out = np.zeros(len(x))
    k = 0.0
    while k < d - 0.02:
        c = click(2400, 0.02)
        i = int(k * SR)
        out[i:i + len(c)] += c * (0.7 + 0.3 * RNG.random())
        k += step
    return out


def clank(d=0.8):
    x = tt(d)
    return sum(a * np.sin(2 * np.pi * f * x) * np.exp(-x * k) for f, a, k in [(320, 1, 5), (871, 0.6, 7), (1530, 0.4, 9), (2380, 0.25, 12)])


def splash(d=1.2):
    x = tt(d)
    return bp(RNG.standard_normal(len(x)), 400, 6000) * np.exp(-x * 3) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * x))


def chain(d=1.0, n=14):
    out = np.zeros(int(d * SR))
    R = np.random.default_rng(55)
    for _ in range(n):
        a = int(R.uniform(0, d - 0.1) * SR)
        x = tt(0.09)
        s = sum(q * np.sin(2 * np.pi * f * x) for f, q in [(R.uniform(2300, 3300), 0.6), (R.uniform(4800, 6200), 0.3)]) * np.exp(-x * 55)
        out[a:a + len(s)] += s[: len(out) - a] * R.uniform(0.4, 1)
    return out


def padlock():
    a = click(3000, 0.02) * 1.2
    b = np.sin(2 * np.pi * 1900 * tt(0.08)) * np.exp(-tt(0.08) * 60) * 0.5
    out = np.zeros(int(0.12 * SR))
    out[: len(a)] += a
    out[int(0.03 * SR): int(0.03 * SR) + len(b)] += b
    return out


def buzz(d=0.14):
    x = tt(d)
    return (np.sign(np.sin(2 * np.pi * 100 * x)) * 0.4 + bp(RNG.standard_normal(len(x)), 800, 4000) * 0.6) * np.sin(np.pi * x / d)


def swish(d=0.3):
    x = tt(d)
    return bp(RNG.standard_normal(len(x)), 500, 3000) * np.sin(np.pi * x / d) * 0.6


# ------------------------------------------------------------------ SFX + ring placement
sfx = np.zeros((N, 2))
ring = np.zeros((N, 2))
Gn = {"boom": 1.0, "riser": 0.35, "whoosh": 0.22, "heart": 0.75, "type": 0.22, "tag": 0.2, "chip": 0.2, "panel": 0.22, "card": 0.25, "check": 0.3,
      "clock": 0.16, "q": 0.26, "end": 0.7}
place(sfx, boom(), T["B"] + 0.02, Gn["boom"])
place(sfx, riser(), T["S"] - 1.3, Gn["riser"])
place(sfx, boom(3.0), T["S"] + 0.02, Gn["boom"] * 1.05)
for k_ in ("A2", "C", "D", "E", "E2", "F1", "F2", "F3", "H2", "I", "I2", "J", "J2", "K", "K2", "L1", "M", "N", "O1", "O2", "O3", "Q1", "Q2", "R"):
    place(sfx, whoosh(), T[k_] - 0.22, Gn["whoosh"], RNG.uniform(-0.3, 0.3))
hb = T["G"] + 0.15
while hb < T["H"] - 0.3:
    place(sfx, heartbeat(), hb, Gn["heart"])
    hb += 0.82
# the routine: the gauge tap, the pen, the microwave hum + ding
place(sfx, tink(), T["F1"] + 0.35, 0.3, 0.2)
place(sfx, scratch(0.8), T["F2"] + 0.1, 0.18, 0.1)
place(sfx, mwhum(T["G"] - T["F3"]), T["F3"], 0.12, 0.3)
place(sfx, ding(), T["G"] - 0.35, 0.22, 0.3)
# the gull (the dry gag): one cry after "seagulls"
place(sfx, gull(0.55), word("l04", "seagulls") + 0.62, 0.32, -0.25)
# the radio: static on "crackled", squelch, the shore base's filtered chatter, the helicopter's second voice
cr = word("l07", "crackled")
place(sfx, static(0.7), cr - 0.1, 0.35, 0.2)
place(sfx, squelch(), cr + 0.55, 0.3, 0.2)
place(sfx, chatter(T["I"] - cr - 0.8), cr + 0.7, 0.07, 0.2)
place(sfx, squelch(), T["I"] + 0.05, 0.3, 0.2)
place(sfx, chatter(T["I2"] - T["I"] - 0.4, 600, 3400), T["I"] + 0.25, 0.08, 0.2)
# helideck lights: relay clicks; the helicopter far, then near, then going away
for i in range(6):
    place(sfx, relay(), T["I2"] + 0.25 + i * 0.12, 0.18, 0.3)
place(sfx, rotor(T["K"] - T["J"] + 0.5, near=0.6) * np.linspace(0.15, 0.8, int((T["K"] - T["J"] + 0.5) * SR)), T["J"] - 0.3, 0.32, -0.2)
d2 = T["L1"] - T["K2"]
place(sfx, rotor(d2, near=1.0) * np.interp(np.arange(int(d2 * SR)) / SR, [0, 1.6, d2], [0.85, 0.9, 0.1]), T["K2"], 0.35, 0.1)
# the head shake: a cloth swish
place(sfx, swish(0.35), word("l09", "no") - 0.05, 0.2)
# the crowd at the fence (distant)
place(sfx, moan(T["K2"] - T["K"]), T["K"], 0.1, -0.1)
# underwater: the plunge, bubbles
place(sfx, plunge(), T["L2"] - 0.05, 0.5)
place(sfx, bubbles(T["M"] - T["L2"]), T["L2"] + 0.1, 0.12)
# the watermaker: the pump + the water into the jug; the generator under the flare
place(sfx, pump(T["O2"] - T["O1"]), T["O1"], 0.1, 0.2)
place(sfx, pour(T["O2"] - T["O1"] - 0.2), T["O1"] + 0.1, 0.18, -0.1)
place(sfx, engine(T["Q1"] - T["O2"]), T["O2"], 0.35)
# the ladder: winch ratchet, the clank at the top, water draining off it
lt0, lt1 = word("l15", "pulled") - 0.1, word("l15", "ladder") + 0.3
place(sfx, ratchet(lt1 - lt0), lt0, 0.22, 0.2)
place(sfx, splash(1.4), lt0 + 0.1, 0.25, -0.2)
place(sfx, clank(), lt1, 0.28, 0.2)
# the chain + the padlock
c0 = word("l15", "chained") - 0.05
place(sfx, chain(1.1), c0, 0.35, 0.15)
place(sfx, padlock(), word("l15", "helideck") + 0.05, 0.5, 0.15)
for c in TM["cues"]:
    t, ty = c["t"], c["type"]
    if ty == "type":
        for k_ in range(c["n"]):
            place(sfx, click(3600 + RNG.uniform(-500, 500), 0.01), t + k_ * c["dur"] / c["n"], Gn["type"] * RNG.uniform(0.6, 1.0), 0.15)
    elif ty == "tag":
        f0 = {"r": 330, "g": 700, "y": 560}.get(c.get("col", "y"), 560)
        place(sfx, pop(f0, f0 * 1.35), t, Gn["tag"])
    elif ty == "chip":
        place(sfx, pop(780, 1050), t, Gn["chip"])
    elif ty == "panel":
        place(sfx, thump(90, 0.2) * 0.5, t, Gn["panel"])
        place(sfx, pop(500, 620), t + 0.03, Gn["panel"] * 0.6)
    elif ty == "card":
        place(sfx, paper(), t - 0.05, Gn["card"])
    elif ty == "check":
        place(sfx, pentick(), t, Gn["check"])
    elif ty == "clock":
        place(sfx, woodtick(), t, Gn["clock"])
        place(sfx, woodtick(), t + 0.22, Gn["clock"] * 0.7)
    elif ty == "tick":
        place(sfx, woodtick(), t, Gn["clock"] * 0.8, 0.1)
    elif ty == "question":
        place(sfx, blip(520, 470, 0.25), t, Gn["q"])
    elif ty == "flicker":
        place(sfx, buzz(0.14), t - 0.12, 0.3)
        place(sfx, buzz(0.12), t + 0.25, 0.22)
    elif ty == "endcard":
        place(sfx, thump(46, 0.9), t, Gn["end"])
    elif ty == "endcard2":
        place(sfx, whoosh(0.6), t - 0.3, Gn["whoosh"])
        place(sfx, thump(40, 1.4), t, Gn["end"] * 0.8)
    # ---- the odds ring (identity sounds)
    elif ty == "sting":
        place(ring, OS.sting(SR), t, 0.62, 0.15)
    elif ty == "sting_end":
        place(ring, OS.sting(SR), t, 0.3, 0.15)
    elif ty == "odds_tick":
        place(ring, OS.tick(SR, c["up"], c["i"], c["n"]), t, 0.2, 0.3)
    elif ty in ("odds_up", "odds_down"):
        place(ring, OS.delta(SR, ty == "odds_up"), t, 0.34, 0.2)
    elif ty == "odds_pulse":
        place(ring, OS.pulse(SR), t, 0.3, 0.1)
    elif ty == "odds_glitch":
        place(ring, OS.glitch(SR, c["dur"]), t, 0.34, 0.2)
    elif ty == "odds_land":
        place(ring, OS.land(SR), t, 0.5, 0.1)
sfx = reverb(sfx, 1.2, 0.18)
ring = reverb(ring, 0.8, 0.12, seed=4)

# ------------------------------------------------------------------ voice + mixes
v, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), always_2d=False)
assert sr == SR
v = hp(v, 70)[:N]
voc = np.zeros((N, 2))
voc[: len(v), 0] = v
voc[: len(v), 1] = v
voc = reverb(voc, 0.35, 0.06, seed=9)
speech = np.zeros(N, bool)
for l in VOJ["lines"]:
    speech[int(l["start"] * SR):int(l["end"] * SR)] = True
vo_db = rms_db(voc[speech, 0])
amb *= 10 ** ((vo_db - 23.5 - rms_db(amb[speech, 0])) / 20)
music *= 10 ** ((vo_db - 20.5 - rms_db(music[speech, 0])) / 20)
w = int(0.1 * SR)
nwin = N // w
vp = np.percentile(np.sqrt((voc[: nwin * w, 0].reshape(nwin, w) ** 2).mean(axis=1)), 99.5)
for bus, top in ((sfx, -6.5), (ring, -6.0)):
    sm = bus.mean(axis=1)
    loud = np.percentile(np.sqrt((sm[: nwin * w].reshape(nwin, w) ** 2).mean(axis=1)), 99.8)
    bus *= (vp / (loud + 1e-12)) * 10 ** (top / 20)

# Keep the ring off a word's final consonant. Render 2's Whisper heard "They sink" as "They sin": the +15 tick roll sat
# on the /k/. The ring bus (after levelling, so its overall level is unchanged) is ducked over the word's acoustic end
# (the last 10 ms window within 30 dB of the word's peak), from 0.28 s before it to 0.05 s after, with 40 ms ramps.
# The roll stays audible (-10 dB) and the digits still roll on screen.
DUCK = [("l11", "sink", -10.0)]


def acoustic_end(lid, wd):
    x = next(q for q in LINES[lid]["words"] if re.sub(r"[^a-z0-9']", "", q["w"].lower()).startswith(wd))
    seg = v[int(x["start"] * SR):int(x["end"] * SR)]
    hop = int(0.01 * SR)
    db = np.array([rms_db(seg[i:i + hop]) for i in range(0, len(seg) - hop, hop)])
    return x["start"] + (np.nonzero(db > db.max() - 30)[0][-1] + 1) * 0.01


duck_rep = []
for lid, wd, g in DUCK:
    e = acoustic_end(lid, wd)
    lo = 10 ** (g / 20)
    ring *= env_pw([(0, 1), (e - 0.32, 1), (e - 0.28, lo), (e + 0.05, lo), (e + 0.09, 1), (DUR + 1, 1)])[:, None]
    duck_rep.append({"word": f"{lid}:{wd}", "acoustic_end_s": round(e, 3), "ring_gain_db": g, "window_s": [round(e - 0.28, 3), round(e + 0.05, 3)]})
fade = np.ones(N)
fl = int(1.2 * SR)
fade[-fl:] = np.linspace(1, 0, fl) ** 1.6
full = (voc + amb + sfx + ring + music) * fade[:, None]
nomu = (voc + amb + sfx + ring) * fade[:, None]
out = os.path.join(ROOT, "score", "audio")
os.makedirs(out, exist_ok=True)
pk = max(np.abs(full).max(), np.abs(nomu).max()) + 1e-9
k = 0.89 / pk
for name, x in (("vo", voc), ("amb", amb), ("sfx", sfx), ("ring", ring), ("music", music), ("mix_raw", full), ("mix_raw_nomusic", nomu)):
    sf.write(os.path.join(out, name + ".wav"), (x * k * (fade[:, None] if not name.startswith("mix_raw") else 1)).astype(np.float32), SR, subtype="FLOAT")
rest_full = (amb + sfx + ring + music) * fade[:, None]
rest_nom = (amb + sfx + ring) * fade[:, None]
rep = {"vo_rms_db_speech": round(vo_db, 2), "amb_re_vo_db": round(rms_db(amb[speech, 0]) - vo_db, 2), "music_re_vo_db": round(rms_db(music[speech, 0]) - vo_db, 2),
       "voice_over_rest_db_full": round(vo_db - rms_db(rest_full[speech, 0]), 2), "voice_over_rest_db_nomusic": round(vo_db - rms_db(rest_nom[speech, 0]), 2),
       "voice_over_music_db": round(vo_db - rms_db(music[speech, 0]), 2), "bpm": BPM}
rep["ring_duck"] = duck_rep


def loudnorm(src, dst):
    r = subprocess.run([FF, "-hide_banner", "-i", src, "-af", "loudnorm=I=-14:TP=-2.0:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    m = json.loads(r.stderr[r.stderr.rindex("{"): r.stderr.rindex("}") + 1])
    af = (f"loudnorm=I=-14:TP=-2.0:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run([FF, "-y", "-hide_banner", "-v", "error", "-i", src, "-af", af, "-ar", "48000", "-c:a", "pcm_s24le", dst], check=True)
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", dst, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    I_ = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
    TP_ = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r.stderr)
    return {"lufs": float(I_[-1]) if I_ else None, "true_peak_dbtp": float(TP_[-1]) if TP_ else None}


rep["final"] = loudnorm(os.path.join(out, "mix_raw.wav"), os.path.join(out, "final.wav"))
rep["final_nomusic"] = loudnorm(os.path.join(out, "mix_raw_nomusic.wav"), os.path.join(out, "final_nomusic.wav"))
subprocess.run([FF, "-y", "-hide_banner", "-v", "error", "-i", os.path.join(out, "final.wav"), "-c:a", "aac", "-b:a", "256k", os.path.join(ROOT, "assets", "audio", "final.m4a")], check=True)
json.dump(rep, open(os.path.join(ROOT, "score", "levels.json"), "w"), indent=1)
print(json.dumps(rep))

"""Soundtrack for "Survival Odds · The Rig · Day 2", fully synthesized (no samples): voice + ambience + story SFX + the
odds ring's identity sounds (tools/odds_sound.py) + the Day 1 bed, sparser, from the recount on. Two mixes:
  full      voice + ambience + SFX + ring sounds + music          -> score/audio/final.wav, assets/audio/final.m4a
  nomusic   voice + ambience + SFX + ring sounds (no music bed)   -> score/audio/final_nomusic.wav
  ambience  storm wind, rain (heavier at dawn), the swell; the flare's roar until it dies; the control room's hum only
            while there is power (and in the Day 1 replays)
  sfx       the shutdown (relays clicking off, a power-down whoop, the generator winding down), the gauge clank, the
            screens dying, the emergency lights' buzz, booms on both black beats, rewind swooshes into the replays, an
            error beep on LINK LOST, a hit on "shuts itself down", the coast's sections going out, the gull's cry + wings,
            a drip, rain into the barrels, her breath, the thermometer's beep, the split, the valve's creak, the what-if
            fire, the flare relit, boats' horns far off, the davit, card pops, end-card hits
  ring      the sting (frame 1 at ??, and quietly on end card 1), the reveal (glitch, a long falling roll, the land),
            one tick per digit step, delta pops; ducked 10 dB under each recalculation word's last consonant
  music     none until the recount; then 76 BPM D minor, sparser than Day 1 (quarter-note bass, fewer plucks, no kick)
  levels    ambience ~ -23.5 dB and music ~ -22.5 dB under the voice overall (~ -20 where it plays; speech-gated RMS); two-pass loudnorm -14 LUFS, TP -2.0
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
offT = word("l01", "off")
IN_SHOTS = [("B1", "BK"), ("C", "P3a"), ("R1", "R4"), ("R5", "F0")]
INSIDE = zone([(T[a], T[b]) for a, b in IN_SHOTS])
UNDER = np.zeros(N)
OUTSIDE = np.clip(1 - INSIDE, 0, 1)
FLARE = np.clip(env_pw([(0, 1), (offT + 0.2, 1), (offT + 1.5, 0), (DUR, 0)]) + zone([(T["FA3"] + 0.3, T["FB1"])]), 0, 1)
BLACK = zone([(T["BK"], T["C"]), (T["BK2"], T["CARDS"]), (T["Z2"], DUR)])
POWER = zone([(0, word("l02", "power") + 0.3), (T["P1"], T["P3a"])])          # the hum: before the shutdown, and in the Day 1 replays
DAWN = zone([(T["R1"], T["Z1"])])

# ------------------------------------------------------------------ ambience: wind, rain (heavier at dawn), the sea; the flare's roar until it dies
wn = RNG.standard_normal((N, 2))
gust = 0.5 + 0.28 * np.sin(2 * np.pi * 0.07 * t_) + 0.16 * np.sin(2 * np.pi * 0.23 * t_ + 1.1) + 0.06 * np.sin(2 * np.pi * 0.61 * t_ + 2.0)
wind = (lp(wn, 300, 2) * 1.1 + bp(wn, 300, 1600) * 0.55) * gust[:, None]
whistle = np.zeros(N)
for f0, a in [(620, 0.05), (1130, 0.03), (845, 0.02)]:
    f = f0 * (1 + 0.05 * np.sin(2 * np.pi * 0.19 * t_ + f0))
    whistle += a * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.clip(gust - 0.5, 0, 1) * 3
wind = (wind + whistle[:, None]) * (OUTSIDE * (1 - 0.4 * BLACK))[:, None] + lp(wind, 180) * 0.12 * INSIDE[:, None]
rn = RNG.standard_normal((N, 2))
drops = (RNG.random((N, 2)) > 0.9993) * RNG.standard_normal((N, 2)) * 3
rk = (1 + 0.5 * DAWN)
rain = (hp(rn, 3000) * 0.22 + bp(drops, 1500, 7000) * 0.6) * (OUTSIDE * (1 - 0.6 * BLACK) * rk)[:, None] + bp(drops, 300, 1800) * 0.5 * (INSIDE * rk)[:, None]
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
sea = sea * (OUTSIDE * (1 - 0.3 * BLACK))[:, None] + lp(sea, 120) * 0.3 * INSIDE[:, None]
flu = 0.7 + 0.3 * lp(RNG.standard_normal(N), 14) * 6
roar = (bp(RNG.standard_normal((N, 2)), 50, 380) * 0.9 + bp(RNG.standard_normal((N, 2)), 380, 1500) * 0.18) * np.clip(flu, 0.2, 1.4)[:, None]
roar = roar * (0.6 * FLARE)[:, None]
hum = (0.05 * np.sin(2 * np.pi * 50 * t_) + 0.025 * np.sin(2 * np.pi * 100 * t_) + 0.012 * np.sin(2 * np.pi * 150 * t_))[:, None] + bp(RNG.standard_normal((N, 2)), 180, 900) * 0.07
hum = hum * (INSIDE * POWER)[:, None] + hum * 0.5 * (POWER * OUTSIDE * zone([(0, offT + 0.3)]))[:, None]
amb = wind * 1.0 + rain * 0.9 + sea * 1.1 + roar * 0.8 + hum

# ------------------------------------------------------------------ music bed (full mix only): 76 BPM, D minor. None until the recount, then sparser
BPM = 76.0
BEAT = 60 / BPM
mtof = lambda m: 440.0 * 2 ** ((m - 69) / 12)
energy = env_pw([(0, 0), (T["R1"] - 0.3, 0), (T["R1"], 0.36), (T["R5"], 0.42), (T["F0"], 0.5), (T["FA1"], 0.58), (T["FA3"], 0.62), (T["FB1"], 0.62),
                 (T["BK2"] - 0.05, 0.62), (T["BK2"], 0.0), (T["CARDS"] - 0.05, 0.0), (T["CARDS"], 0.52), (T["FACE"], 0.42), (T["Z1"], 0.36), (T["Z2"], 0.26), (DUR - 0.5, 0.0), (DUR, 0.0)])
chords = [[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52]]              # Dm  Bb  Gm  A
mus = np.zeros((N, 2))
bar = 4 * BEAT
nb = int(DUR / bar) + 1
for b in range(nb):
    t0 = b * bar
    i0 = int(t0 * SR)
    if i0 >= N:
        break
    if energy[i0:min(N, int((t0 + bar) * SR))].max() < 0.02:
        continue
    ch = chords[b % 4]
    x = tt(bar + 0.6)
    pad = np.zeros(len(x))
    for m in ch:
        for det in (-0.12, 0.0, 0.11):
            f = mtof(m + 12) * 2 ** (det / 12)
            ph = 2 * np.pi * f * x
            pad += (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.18 * np.sin(3 * ph)) / 9
    pad *= np.clip(x / 0.9, 0, 1) * np.clip((bar + 0.6 - x) / 0.6, 0, 1)
    pad = lp(pad, 1200)
    place(mus, pad * 0.5, t0, 1.0, -0.15)
    place(mus, pad * 0.5, t0 + 0.012, 1.0, 0.15)
    root = ch[0] - 12
    for h in range(0, 8, 2):                       # sparser: the bass on quarters
        tb = t0 + h * BEAT / 2
        x = tt(0.34)
        f = mtof(root)
        s = (np.sin(2 * np.pi * f * x) + 0.5 * np.sign(np.sin(2 * np.pi * f * x)) * 0.4) * np.exp(-x * 9)
        s = lp(s, 420 + 900 * np.exp(-x * 20).mean())
        place(mus, s * 0.5, tb)
    R = np.random.default_rng(b + 17)
    for h in range(16):
        if R.random() < 0.14 + 0.22 * energy[min(N - 1, i0)]:
            m = ch[R.integers(0, 3)] + 24 + (12 if R.random() < 0.25 else 0)
            x = tt(0.22)
            s = np.sin(2 * np.pi * mtof(m) * x) * np.exp(-x * 26) * 0.22
            tb = t0 + h * BEAT / 4
            place(mus, s, tb, 1.0, R.uniform(-0.6, 0.6))
            place(mus, s * 0.35, tb + BEAT * 0.75, 1.0, R.uniform(-0.6, 0.6))
mus *= energy[:, None]
mus = reverb(mus, 2.2, 0.28, seed=5)
drone = (np.sin(2 * np.pi * 36.71 * t_) + 0.6 * np.sin(2 * np.pi * 73.42 * t_) + 0.25 * np.sin(2 * np.pi * 77.78 * t_))[:, None] * 0.12
drone = drone * env_pw([(0, 0), (T["BK"], 0), (T["BK"] + 0.2, 1), (T["C"], 1), (T["C"] + 0.6, 0), (T["BK2"], 0), (T["BK2"] + 0.2, 1.1), (T["CARDS"], 1.0), (T["CARDS"] + 0.6, 0),
                        (T["Z1"], 0), (T["Z1"] + 0.3, 0.8), (T["Z2"], 1.0), (DUR - 0.3, 0), (DUR, 0)])[:, None]
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


# ------------------------------------------------------------------ Day 2 sounds
def spindown(d=2.8):
    """the generator winding down: the engine's partials falling in pitch and level"""
    x = tt(d)
    k = np.exp(-x * 1.15)
    f0 = 31 * (0.25 + 0.75 * k)
    ph = 2 * np.pi * np.cumsum(f0) / SR
    s = sum(a * np.sin(ph * h) for h, a in [(1, 1.0), (2, 0.6), (3, 0.35), (4, 0.2)])
    return lp(s + bp(RNG.standard_normal(len(x)), 80, 500) * 0.3 * k, 800) * k


def whoop(d=1.3):
    """the power-down whoop: a falling sine with a low-pass sweep"""
    x = tt(d)
    f = 420 * np.exp(-x * 2.6) + 38
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return s * np.clip(x / 0.03, 0, 1) * np.exp(-x * 1.4)


def crt_off(d=0.5):
    x = tt(d)
    return (bp(RNG.standard_normal(len(x)), 3000, 9000) * np.exp(-x * 10) * 0.5 + np.sin(2 * np.pi * 15600 * x) * np.exp(-x * 6) * 0.1 + np.sin(2 * np.pi * 90 * x) * np.exp(-x * 25) * 0.6)


def rewind(d=0.55):
    """the replay swoosh: a reversed, rising swish with a tape-ish wobble"""
    x = tt(d)
    n = RNG.standard_normal(len(x))
    s = (bp(n, 400, 2200) * 0.7 + bp(n, 2200, 6000) * 0.3) * (x / d) ** 2 * (0.75 + 0.25 * np.sin(2 * np.pi * 14 * x))
    return s


def errbeep():
    out = np.zeros(int(0.42 * SR))
    for k_, f in enumerate((660, 440)):
        x = tt(0.16)
        s = np.sign(np.sin(2 * np.pi * f * x)) * 0.35 * np.clip((0.16 - x) / 0.02, 0, 1) * np.clip(x / 0.005, 0, 1)
        i = int(k_ * 0.2 * SR)
        out[i:i + len(s)] += lp(s, 3000)
    return out


def plink():
    x = tt(0.25)
    f = 1300 * (1 + 1.4 * np.exp(-x * 40))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 22) * 0.6


def breath(d=0.9):
    x = tt(d)
    return bp(RNG.standard_normal(len(x)), 400, 2600) * np.sin(np.pi * x / d) ** 2 * 0.5


def beep(f=2400, d=0.07):
    x = tt(d)
    return np.sin(2 * np.pi * f * x) * np.clip((d - x) / 0.01, 0, 1) * 0.5


def creak(d=1.6):
    x = tt(d)
    f = 180 + 60 * np.sin(2 * np.pi * 0.7 * x) + 20 * lp(RNG.standard_normal(len(x)), 8) * 10
    s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.3 + np.sin(2 * np.pi * np.cumsum(f * 2.01) / SR) * 0.3
    return bp(s, 150, 2500) * (0.5 + 0.5 * np.sin(np.pi * x / d)) * (0.6 + 0.4 * (lp(RNG.standard_normal(len(x)), 6) > 0))


def whoomph(d=1.8):
    x = tt(d)
    body = lp(RNG.standard_normal(len(x)), 400) * np.exp(-x * 2.2) * np.clip(x / 0.06, 0, 1) * 1.4
    crackle = (RNG.random(len(x)) > 0.996) * RNG.standard_normal(len(x)) * 3
    return body + bp(crackle, 1500, 7000) * np.exp(-x * 1.2) * 0.5 + np.sin(2 * np.pi * 42 * x) * np.exp(-x * 3) * 0.6


def horn(d=1.6, f=110):
    x = tt(d)
    s = sum(a * np.sin(2 * np.pi * f * h * x) for h, a in [(1, 1.0), (2, 0.5), (3, 0.3), (4, 0.15)])
    return lp(s, 900) * np.clip(x / 0.15, 0, 1) * np.clip((d - x) / 0.3, 0, 1) * 0.4


def flaps(d=1.0):
    x = tt(d)
    ph = (x * 6.5) % 1.0
    return bp(RNG.standard_normal(len(x)), 300, 2400) * np.exp(-ph * 9) * np.clip((d - x) / d, 0, 1)


# ------------------------------------------------------------------ SFX + ring placement
sfx = np.zeros((N, 2))
ring = np.zeros((N, 2))
Gn = {"boom": 1.0, "riser": 0.35, "whoosh": 0.22, "tag": 0.2, "chip": 0.2, "panel": 0.22, "card": 0.25, "clock": 0.16, "end": 0.7}
# the shutdown: relays clicking off, the power-down whoop, the generator winding down
for i in range(7):
    place(sfx, relay(), offT + 0.05 + i * 0.13 + RNG.uniform(-0.02, 0.02), 0.22, RNG.uniform(-0.5, 0.5))
place(sfx, whoop(), offT + 0.1, 0.42)
place(sfx, spindown(3.2), offT + 0.05, 0.75)
# "No gas. No power. No lights."
place(sfx, clank(0.5) * 0.4, word("l02", "gas") + 0.02, 0.18, 0.2)
place(sfx, crt_off(), word("l02", "power") + 0.05, 0.45)
place(sfx, crt_off(), word("l02", "power") + 0.28, 0.3, -0.3)
FLK = [1, 1, 0.2, 1, 1, 1, 0.2, 0.2, 1, 1, 0.35, 1, 1, 0.2, 1, 1]
litT = word("l02", "lights")
tb = T["B3"]
while tb < litT + 0.6:
    if FLK[(int(tb * 10) + round(0.7 * 7)) % len(FLK)] > 0.5:
        place(sfx, buzz(0.1), tb, 0.16, 0.1)
    tb += 0.1
place(sfx, relay(), litT + 0.6, 0.35)
# black beats
place(sfx, boom(), T["BK"] + 0.02, Gn["boom"])
place(sfx, riser(), T["BK2"] - 1.3, Gn["riser"])
place(sfx, boom(3.0), T["BK2"] + 0.02, Gn["boom"] * 1.05)
# cuts
for k_ in ("C", "D", "P3b", "W1", "W2", "R2", "R3", "R3b", "R4", "R5", "R6", "F0", "FA1", "FA2", "FB1", "FB2", "FACE"):
    place(sfx, whoosh(), T[k_] - 0.22, Gn["whoosh"], RNG.uniform(-0.3, 0.3))
# the torch: a click on in C; off at the end of the sticker shot
place(sfx, click(2200, 0.02) * 1.5, T["C"] + 0.2, 0.4, 0.2)
place(sfx, click(2200, 0.02) * 1.5, T["P4"] - 0.42, 0.4, 0.2)
# the replays: a rewind swoosh into each
for k_ in ("P1", "P2", "P4"):
    place(sfx, rewind(), T[k_] - 0.5, 0.32, RNG.uniform(-0.2, 0.2))
place(sfx, errbeep(), word("l05", "screen") + 0.02, 0.28, -0.1)
place(sfx, thump(60, 0.6) * 0.8, word("l07", "shuts") - 0.02, 0.5)
darkT = word("l08", "dark")
for i in range(6):
    place(sfx, relay() * 0.6, darkT - 0.45 + i * 0.3, 0.12, -0.4 + i * 0.16)
# the gull: a cry, then wing flaps as it goes
gT = word("l09", "left")
place(sfx, gull(0.5), T["W2"] + 0.35, 0.28, -0.2)
place(sfx, flaps(1.2), gT + 0.05, 0.3, 0.2)
# the recount: the drip, the rain into the barrels, the breath, a beep from the thermometer
for k_ in range(40):
    tdrip = k_ * 1.35 - 0.4
    if T["R3"] <= tdrip < T["R3b"]:
        place(sfx, plink(), tdrip, 0.28, -0.2)
place(sfx, pour(T["R5"] - T["R4"]) * 0.6, T["R4"], 0.22, -0.2)
for k_ in range(30):
    for j in range(3):
        tb_ = k_ * 2.4 - j * 0.8
        if T["R5"] + 0.1 <= tb_ < T["R6"] - 0.4:
            place(sfx, breath(0.9), tb_, 0.12)
place(sfx, beep(), T["R6"] + 0.3, 0.12, -0.2)
# the fork: the split, the valve's creak, the what-if fire, the flare relit, boats' horns far off, the davit
place(sfx, whoosh(0.5), word("l15", "choices") - 0.15, 0.32)
place(sfx, thump(55, 0.5), word("l15", "choices") + 0.05, 0.4)
place(sfx, creak(1.8), T["FA2"] + 0.25, 0.22, 0.1)
place(sfx, whoomph(), word("l16", "burns") - 0.06, 0.75)
place(sfx, whoomph(2.4) * 0.6, T["FA3"] + 0.05, 0.5)
place(sfx, horn(1.8, 98), T["FA3"] + 1.6, 0.12, -0.5)
place(sfx, horn(1.4, 131), T["FA3"] + 2.6, 0.08, 0.5)
place(sfx, creak(1.2) * 0.6, T["FB1"] + 0.2, 0.18, -0.3)
place(sfx, chain(0.9) * 0.6, T["FB1"] + 0.6, 0.2, -0.3)
for c in TM["cues"]:
    t, ty = c["t"], c["type"]
    if ty == "tag":
        f0 = {"r": 330, "g": 700, "y": 560}.get(c.get("col", "y"), 560)
        place(sfx, pop(f0, f0 * 1.35), t, Gn["tag"])
    elif ty == "chip":
        place(sfx, pop(780, 1050), t, Gn["chip"])
    elif ty in ("panel", "highlight"):
        place(sfx, thump(90, 0.2) * 0.5, t, Gn["panel"])
        place(sfx, pop(500, 620), t + 0.03, Gn["panel"] * 0.6)
    elif ty == "card":
        place(sfx, paper(), t - 0.05, Gn["card"])
    elif ty == "clock":
        place(sfx, woodtick(), t, Gn["clock"])
        place(sfx, woodtick(), t + 0.22, Gn["clock"] * 0.7)
    elif ty in ("optcard", "cards"):
        place(sfx, pop(560, 760), t, 0.24)
        place(sfx, thump(70, 0.3) * 0.5, t, 0.2)
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
    elif ty == "odds_reveal":
        place(ring, OS.delta(SR, False), t, 0.42, 0.2)
    elif ty == "odds_glitch":
        place(ring, OS.glitch(SR, c["dur"]), t, 0.34, 0.2)
    elif ty == "odds_land":
        place(ring, OS.land(SR), t, 0.45, 0.1)
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
music *= 10 ** ((vo_db - 22.5 - rms_db(music[speech, 0])) / 20)   # Day 2: the bed plays only from the recount on (~55 % of the speech), so -22.5 overall is ~ -20 where it plays
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
DUCK = [(lid, wd, -10.0) for lid, wd in TM.get("recalc_words", [])]


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

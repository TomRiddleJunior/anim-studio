"""Soundtrack for "Born Second, Born First" (riddle-twins): voice + an original music-box lullaby bed + story SFX.

  bed   (music; dropped in nomusic.m4a) 84 BPM in F major / D minor: a music-box melody (bell partials, high), soft
        pizzicato strings for the bass line, and a woodblock "clock" tick on every beat (the film's motif). D minor through the
        mystery, F major after the reveal; during the countdown it drops to a low 1 Hz pulse. Different from The 1:12 Call (marimba)
        and the diner film (upright bass + vibes).
  sfx   a whoosh into every cut, a pop on every pill, a soft newborn cry for each twin, a pen scribble, paper slides, candle
        blow-outs + a party horn, the 2:00 chime and a REWIND (reverse sweep + ratchet clicks) when the clocks go back,
        a click per countdown second + a ding at 0 + a hit on "Time's up", the clipboard clatter
  mix   bed 21 dB under the voice; loudnorm -14 LUFS, TP -2; final.m4a + nomusic.m4a; score/levels.json
usage: ~/.generative-music-video/venv/Scripts/python.exe -I tools/sound_design.py
"""
import json
import os
import sys

import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from audio_kit import (SR, RNG, bell, bp, click, env_pw, hp, knock, lp, midi, mixdown, noise_burst, place, pluck, pop, reverb,  # noqa: E402
                       riser, thump, tick, tt, whoosh)

ROOT = os.path.dirname(HERE)
VOJ = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
TM = json.load(open(os.path.join(ROOT, "score", "timing.json"), encoding="utf-8"))
DUR = VOJ["duration"]
N = int(DUR * SR)
t_ = np.arange(N) / SR
LN = {l["id"]: l for l in VOJ["lines"]}
L = lambda i: LN[i]["start"]
Le = lambda i: LN[i]["end"]


def w(i, word, k=0):
    n = lambda s: "".join(ch for ch in s.lower() if ch.isalnum())
    hits = [x for x in LN[i]["words"] if n(x["w"]).startswith(n(word))]
    return hits[min(k, len(hits) - 1)]["start"]


T = {"o2": L("r02") - 0.12, "o2b": w("r02", "twenty") - 0.15, "o3": L("r03") - 0.1, "o4": L("r04") - 0.25, "o5": L("r05") - 0.25, "o6": L("r06") - 0.12,
     "o7": L("r07") - 0.12, "o7b": w("r07", "so") - 0.1, "o8": L("r08") - 0.15, "o9": L("r09") - 0.15, "card": L("r10") - 0.15, "n1": Le("r11") + 0.3,
     "x1": L("r13") - 0.12, "x2": L("r14") - 0.12, "x3": L("r15") - 0.1, "x4": L("r16") - 0.12, "m1": L("r17") - 0.25, "m2": L("r18") - 0.12, "end": L("r19") - 0.2}
cd0 = TM["countdown_start"]
card0, reveal0 = T["card"], T["n1"]


def musicbox(f, d=1.6):
    x = tt(d)
    y = np.sin(2 * np.pi * f * x) * np.exp(-x * 2.2) + 0.5 * np.sin(2 * np.pi * 2.01 * f * x) * np.exp(-x * 4) + 0.2 * np.sin(2 * np.pi * 4.03 * f * x) * np.exp(-x * 7)
    return y * np.minimum(1, x / 0.002) * 0.4


def woodblock(f=1100):
    x = tt(0.08)
    return (np.sin(2 * np.pi * f * x) + 0.4 * np.sin(2 * np.pi * f * 2.7 * x)) * np.exp(-x * 60) * 0.5


def cry(d=0.9, f0=420):
    x = tt(d)
    f = f0 * (1 + 0.12 * np.sin(np.pi * x / d)) * (1 + 0.02 * np.sin(2 * np.pi * 7 * x))
    y = sum(np.sin(2 * np.pi * h * np.cumsum(f) / SR) / h for h in range(1, 8))
    return bp(y, 700, 3000) * np.sin(np.pi * x / d) ** 0.6 * 0.35


def scribble(d=1.2):
    x = tt(d)
    am = (np.sin(2 * np.pi * 9 * x) > 0.2).astype(float)
    return bp(RNG.standard_normal(len(x)), 2500, 7000) * am * 0.15


def rewind(d=1.2):
    x = tt(d)
    y = riser(d)[::-1].copy()
    for k in range(int(d * 22)):
        i = int((k / 22) * SR)
        if i + 400 < len(y):
            cl = click(2600 - k * 40, 0.008); y[i:i + len(cl)] += cl * 0.8
    return y * 0.6


def horn(d=0.8):
    x = tt(d)
    f = 420 * (1 + 0.03 * np.sin(2 * np.pi * 6 * x))
    y = sum(np.sin(2 * np.pi * h * np.cumsum(f) / SR) / h for h in range(1, 10))
    return bp(y, 400, 3500) * np.sin(np.pi * np.minimum(1, x / d)) ** 0.4 * 0.3


# ------------------------------------------------------------------ bed: 84 BPM lullaby
BPM = 84.0
b = 60 / BPM
minor = [(38, [62, 65, 69, 74]), (34, [62, 65, 70, 74]), (36, [60, 64, 67, 72]), (33, [61, 64, 69, 73])]   # Dm Bb C A
major = [(41, [65, 69, 72, 77]), (38, [62, 65, 69, 74]), (34, [62, 65, 70, 74]), (36, [64, 67, 72, 76])]  # F Dm Bb C
energy = env_pw(t_, [(0, 0.6), (T["o5"], 0.75), (T["o9"], 0.85), (card0, 0.85), (card0 + 0.5, 0.0), (reveal0 - 0.2, 0.0), (reveal0, 0.7),
                     (T["x1"], 0.85), (T["x3"], 0.95), (T["m1"], 1.0), (T["end"], 0.85), (DUR - 0.8, 0.7), (DUR, 0.0)])
bed = np.zeros((N, 2))
beat = 0
t = 0.0
mel = [3, 2, 1, 2, 3, 3, 2, 0]
while t < DUR:
    if not (card0 - 0.1 < t < reveal0 - 0.05):
        prog = major if t >= T["x3"] else minor
        root, ch = prog[(beat // 4) % 4]
        e = float(np.interp(t, t_[::480], energy[::480]))
        place(bed, woodblock(1250 if beat % 2 else 950), t, 0.5 * e, 0.3)
        if beat % 2 == 0:
            place(bed, pluck(midi(root), 0.6, 900), t, 0.9 * e, -0.2)
        place(bed, musicbox(midi(ch[mel[beat % 8]] + 12)), t, 0.55 * e, 0.15)
        if beat % 4 == 2:
            place(bed, musicbox(midi(ch[1] + 12)), t + b * 0.5, 0.3 * e, -0.15)
    beat += 1
    t += b
tp = np.zeros((N, 2))
t0 = card0 + 0.3
while t0 < reveal0 - 0.4:
    place(tp, thump(48, 0.5), t0, 0.35)
    t0 += 1.0
bed = reverb(bed, 1.4, 0.2, seed=4) + tp

# ------------------------------------------------------------------ SFX
sfx = np.zeros((N, 2))
for key, tc in T.items():
    place(sfx, whoosh(0.35, 500, 4000), tc - 0.17, 0.32)
for p in TM["pills"]:
    if p[1] > 0.2:
        place(sfx, pop(620, 880, 0.08), p[1], 0.5)
place(sfx, tick(2400), 1.6, 0.35)
place(sfx, cry(0.9, 430), w("r02", "ivy") + 0.1, 0.45, -0.3)
place(sfx, cry(0.9, 470), w("r02", "june") + 0.1, 0.45, -0.1)
place(sfx, bell(midi(84), 0.8), w("r03", "big"), 0.12)
place(sfx, scribble(1.4), w("r04", "writes"), 0.6, 0.2)
for k, word in enumerate(("ivy", "june")):
    place(sfx, noise_burst(0.25, 2000, 7000), w("r06", word) - 0.05, 0.35, -0.3 + 0.6 * k)
place(sfx, horn(0.7), T["o7"] + 0.1, 0.25, 0.3)
place(sfx, whoosh(0.5, 800, 5000), w("r07", "birthday") + 0.1, 0.35)          # June blows first
place(sfx, whoosh(0.5, 800, 5000), w("r07", "candles") + 0.1, 0.35)           # Ivy second
place(sfx, noise_burst(0.2, 2000, 7000), w("r08", "checks"), 0.3)
for k in range(2):
    place(sfx, bell(midi(81 + 4 * k), 0.6), w("r06", "june") + 0.3 + k * 0.15, 0.08)
# countdown
for i in range(11):
    tc = cd0 + i
    if tc < reveal0:
        place(sfx, click(1900, 0.03), tc, 0.9 if i < 10 else 0.0)
place(sfx, bell(midi(84), 1.2), cd0 + 10, 0.4)
place(sfx, thump(60, 0.5), L("r11") - 0.05, 0.5)
# the reveal: the 2:00 chime, the rewind, the second 1:20
place(sfx, bell(midi(72), 2.0) + 0.6 * bell(midi(79), 2.0), w("r13", "2") - 0.05, 0.35)
place(sfx, rewind(1.2), w("r13", "back") - 0.1, 0.55)
place(sfx, bell(midi(72), 1.6), w("r14", "two") - 0.05, 0.25)
place(sfx, rewind(1.0), w("r14", "back") - 0.1, 0.5)
place(sfx, cry(0.9, 470), w("r15", "1") + 0.1, 0.35, -0.1)
for k in range(6):
    place(sfx, woodblock(1500), T["x4"] + 0.3 + k * 0.33, 0.25)
# aftermath
place(sfx, knock(700, 0.12), w("r17", "clipboard") + 0.3, 0.6, 0.2)
place(sfx, knock(1100, 0.06), w("r17", "clipboard") + 0.42, 0.35, 0.2)
place(sfx, horn(0.5), T["m2"] + 0.2, 0.2, -0.3)
place(sfx, bell(midi(77), 1.4), w("r19", "follow") - 0.1, 0.25)
place(sfx, bell(midi(84), 1.4), w("r19", "follow") - 0.1, 0.15)
sfx = reverb(sfx, 0.8, 0.12, seed=8)

# ------------------------------------------------------------------ voice + mix
v, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), always_2d=False)
assert sr == SR
v = hp(v, 70)[:N]
voc = np.zeros((N, 2))
voc[: len(v), 0] = v
voc[: len(v), 1] = v
voc = reverb(voc, 0.3, 0.05, seed=9)
speech = np.zeros(N, bool)
for l in VOJ["lines"]:
    speech[int(l["start"] * SR):int(l["end"] * SR)] = True
rep = mixdown(ROOT, voc, bed, sfx, speech, bed_db_under=21.0, sfx_db=-5.0, fade_s=0.5)
rep["bpm"] = BPM
json.dump(rep, open(os.path.join(ROOT, "score", "levels.json"), "w"), indent=1)
print(json.dumps(rep, indent=1))

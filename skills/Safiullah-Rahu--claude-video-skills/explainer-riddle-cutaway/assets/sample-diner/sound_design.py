"""Soundtrack for "One Fright, No Water" (riddle-diner): voice + an original diner-jazz bed + story SFX, all synthesized.

  bed   (music; dropped in nomusic.m4a) 112 BPM swing: walking upright bass + brushed snare (swish on 2 and 4, a light ride)
        + vibraphone comping (sine partials with tremolo). G minor through the mystery (Gm7 - Cm7 - F7 - Bbmaj7), Bb major
        after the reveal; it drops to a low 1 Hz pulse during the countdown card. A different instrument family from The 1:12 Call (marimba).
  sfx   a whoosh into every cut, a pop on every pill, stair footsteps + counter ticks, the door bell, the PAN BANG (metal
        partials + noise), glass clink + a water pour + gulps, slow "hic" blips only inside the replay, a click per countdown
        second + a ding at 0 + a hit on "Time's up", straws clattering, a register bell, two pans clanking on hooks
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
from audio_kit import (SR, RNG, adsr, bell, bp, click, env_pw, hp, knock, lp, midi, mixdown, noise_burst, place, pop, reverb,  # noqa: E402
                       thump, tick, tt, whoosh)

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


T = {"o1b": w("r01", "into") - 0.15, "o2": L("r02") - 0.12, "o3": L("r03") - 0.1, "o4": L("r04") - 0.25, "o5": L("r05") - 0.25, "o6": L("r06") - 0.12,
     "o7": L("r07") - 0.12, "o8": L("r08") - 0.15, "o9": L("r09") - 0.15, "card": L("r10") - 0.15, "n1": Le("r11") + 0.3, "x1": w("r12", "and") - 0.1,
     "x2": L("r14") - 0.12, "x3": L("r15") - 0.12, "x4": L("r16") - 0.12, "x5": L("r17") - 0.1, "m1": L("r18") - 0.25, "m2": L("r19") - 0.12,
     "m3": w("r19", "hangs") - 0.15, "end": L("r20") - 0.2}
cd0 = TM["countdown_start"]
card0, reveal0 = T["card"], T["n1"]


# ------------------------------------------------------------------ instruments
def upright(f, d=0.42):
    x = tt(d)
    y = np.sin(2 * np.pi * f * x) + 0.45 * np.sin(2 * np.pi * 2 * f * x) * np.exp(-x * 8) + 0.15 * np.sin(2 * np.pi * 3 * f * x) * np.exp(-x * 14)
    return lp(y, 900) * np.exp(-x * 4.5) * np.minimum(1, x / 0.004) * 0.9


def vibes(f, d=1.4):
    x = tt(d)
    trem = 0.75 + 0.25 * np.sin(2 * np.pi * 5.5 * x)
    y = (np.sin(2 * np.pi * f * x) + 0.25 * np.sin(2 * np.pi * 4 * f * x) * np.exp(-x * 9)) * np.exp(-x * 1.8) * trem
    return y * np.minimum(1, x / 0.003) * 0.35


def brush(d=0.22):
    x = tt(d)
    return bp(RNG.standard_normal(len(x)), 1500, 7000) * np.sin(np.pi * np.minimum(1, x / d)) ** 0.6 * np.exp(-x * 6) * 0.28


def ride(d=0.5):
    x = tt(d)
    y = sum(np.sin(2 * np.pi * f * x) for f in (3200, 4870, 6110, 7390)) / 4 + 0.4 * hp(RNG.standard_normal(len(x)), 6000)
    return y * np.exp(-x * 7) * 0.12


def pan_bang(d=1.2):
    x = tt(d)
    y = sum(a * np.sin(2 * np.pi * f * x) * np.exp(-x * k) for f, a, k in ((410, 1, 3), (1130, 0.7, 4.5), (2210, 0.5, 6), (3470, 0.35, 8), (5300, 0.25, 10)))
    y += 0.8 * bp(RNG.standard_normal(len(x)), 800, 8000) * np.exp(-x * 18)
    return y * 0.6


def hic(pitch=1.0):
    x = tt(0.16)
    f = np.interp(x, [0, 0.03, 0.16], [260 * pitch, 520 * pitch, 380 * pitch])
    y = sum(np.sin(2 * np.pi * h * np.cumsum(f) / SR) / h for h in range(1, 6))
    y = bp(y, 400, 3200) * np.exp(-x * 18) + 0.4 * bp(RNG.standard_normal(len(x)), 1500, 4000) * np.exp(-x * 60)
    return y * 0.7


def pour(d=1.2):
    x = tt(d)
    n = RNG.standard_normal(len(x))
    gl = 0.6 + 0.4 * np.sin(2 * np.pi * (6 + 4 * x) * x)
    return bp(n, 600, 3500) * gl * np.sin(np.pi * x / d) * 0.25


def doorbell():
    return bell(midi(88), 1.0) * 0.6 + np.pad(bell(midi(84), 1.0) * 0.5, (int(0.12 * SR), 0))[: int(1.0 * SR)]


# ------------------------------------------------------------------ bed: 112 BPM swing
BPM = 112.0
b = 60 / BPM
minor = [(43, [55, 58, 62, 65]), (48, [55, 58, 60, 63]), (41, [57, 60, 63, 65]), (46, [57, 58, 62, 65])]   # Gm7 Cm7 F7 Bbmaj7
major = [(46, [57, 58, 62, 65]), (43, [55, 58, 62, 65]), (48, [55, 58, 60, 64]), (41, [57, 60, 63, 64])]   # Bb Gm7 C7 F
energy = env_pw(t_, [(0, 0.65), (T["o5"], 0.75), (T["o9"], 0.85), (card0, 0.85), (card0 + 0.5, 0.0), (reveal0 - 0.2, 0.0), (reveal0, 0.7),
                     (T["x2"], 0.85), (T["x4"], 0.95), (T["m1"], 1.0), (T["end"], 0.85), (DUR - 0.8, 0.7), (DUR, 0.0)])
bed = np.zeros((N, 2))
beat = 0
t = 0.0
walk_r = np.random.default_rng(5)
while t < DUR:
    if not (card0 - 0.1 < t < reveal0 - 0.05):
        prog = major if t >= T["x4"] else minor
        root, ch = prog[(beat // 4) % 4]
        e = float(np.interp(t, t_[::480], energy[::480]))
        step = [0, 7, 12, 10][beat % 4] if beat % 4 else 0
        place(bed, upright(midi(root + step - (12 if step > 7 else 0))), t, 0.75 * e, -0.15)
        if beat % 2 == 1:
            place(bed, brush(), t, 0.7 * e, 0.35)
        place(bed, ride(), t, 0.5 * e, 0.45)
        place(bed, ride(0.3), t + b * 0.66, 0.35 * e, 0.45)       # the swung skip note
        if beat % 4 == 0:
            for j, m in enumerate(ch):
                place(bed, vibes(midi(m + 12)), t + b * 0.66 * (j == 3), 0.4 * e, -0.3 + j * 0.2)
    beat += 1
    t += b
tp = np.zeros((N, 2))
t0 = card0 + 0.3
while t0 < reveal0 - 0.4:
    place(tp, thump(48, 0.5), t0, 0.35)
    t0 += 1.0
bed = reverb(bed, 1.0, 0.14, seed=4) + tp

# ------------------------------------------------------------------ SFX
sfx = np.zeros((N, 2))
for key, tc in T.items():
    place(sfx, whoosh(0.35, 500, 4000), tc - 0.17, 0.32)
for p in TM["pills"]:
    if p[1] > 0.2:
        place(sfx, pop(620, 880, 0.08), p[1], 0.5)
for i in range(9):                                            # running down the stairs + counter ticks
    place(sfx, knock(250 + (i % 2) * 40, 0.1), 0.2 + i * 0.36, 0.3, 0.4)
for tc in (1.1, 2.3):
    place(sfx, tick(2400), tc, 0.4)
place(sfx, doorbell(), T["o1b"] + 0.05, 0.3, 0.4)            # the diner door
for (slam, g) in ((w("r02", "slams"), 1.0), (w("r16", "bang"), 1.0)):
    place(sfx, pan_bang(), slam, 0.55 * g, 0.0)
place(sfx, knock(900, 0.05), w("r02", "grabs"), 0.4, -0.2)    # pans lifted
place(sfx, bell(midi(81), 0.8), w("r03", "thank") - 0.05, 0.12)
place(sfx, doorbell(), w("r03", "walks") + 0.3, 0.25, 0.5)
place(sfx, knock(1400, 0.05), L("r06") + 0.2, 0.35)           # glass on the counter
place(sfx, pour(1.0), L("r06") + 0.35, 0.5)
for k in range(3):
    place(sfx, thump(90, 0.15), w("r06", "drinks") + 0.2 + k * 0.4, 0.35)  # gulps
place(sfx, doorbell(), w("r07", "leaves") + 0.2, 0.25, 0.5)
place(sfx, knock(1400, 0.05), w("r08", "checks"), 0.35)
for k in range(2):
    place(sfx, bell(midi(81 + 4 * k), 0.6), w("r04", "crazy") - 0.35 + k * 0.15, 0.08)
# countdown
for i in range(11):
    tc = cd0 + i
    if tc < reveal0:
        place(sfx, click(1900, 0.03), tc, 0.9 if i < 10 else 0.0)
place(sfx, bell(midi(84), 1.2), cd0 + 10, 0.4)
place(sfx, thump(60, 0.5), L("r11") - 0.05, 0.5)
# replay: tape spin-up, slow hics (lower pitch = slow motion), the bang
place(sfx, whoosh(0.8, 200, 1500), T["n1"] + 0.6, 0.3)
for i in range(4):
    place(sfx, click(800 + i * 200, 0.03), T["n1"] + 1.0 + i * 0.12, 0.3)
for h in [w("r14", "hic", 0), w("r14", "hic", 1), w("r14", "hic", 2)]:
    place(sfx, hic(0.8), h - 0.02, 0.45, 0.1)
tj = T["x1"] + 0.2
while tj < T["x2"] - 0.2:
    place(sfx, hic(0.7), tj, 0.28, 0.1)
    tj += 1.15
tj = T["x5"] + 0.1
while tj < T["m1"] - 0.3:
    place(sfx, hic(0.75), tj, 0.3, 0.1)
    tj += 0.9
place(sfx, bell(midi(79), 1.2), w("r16", "stop"), 0.25)
# aftermath
for k in range(8):
    place(sfx, knock(1200 + 150 * (k % 3), 0.04), w("r18", "knocks") + 0.1 + k * 0.07, 0.3, 0.2)
place(sfx, bell(midi(91), 0.6), T["m3"] + 0.2, 0.3)   # register bell
for k in range(2):
    place(sfx, pan_bang(0.5) * 0.3, T["m3"] + 0.5 + k * 0.25, 0.35)
place(sfx, bell(midi(77), 1.4), w("r20", "follow") - 0.1, 0.25)
place(sfx, bell(midi(84), 1.4), w("r20", "follow") - 0.1, 0.15)
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

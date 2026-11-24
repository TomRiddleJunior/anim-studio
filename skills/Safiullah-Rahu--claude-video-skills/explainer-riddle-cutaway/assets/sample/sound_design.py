"""Soundtrack for "The 1:12 Call" (riddle cutaway), fully synthesized: voice + an original light mystery bed + story SFX.

  source  voice + ~78 editor SFX (whooshes on cuts, pops on pills, a click per countdown second, dings at 0), NO music bed
  bed     ours (the brief asks for one; nomusic.m4a drops it): 100 BPM, D minor -> F major; marimba ostinato + soft
          pizzicato bass + shaker; energy follows the beat map (setup 0.6 -> question 0.85 -> countdown: only a low
          tension pulse under the ticks -> reveal 0.9 -> payoff in F major 1.0 -> end 0.8)
  sfx     whoosh on every cut, a pop on every pill, stair footsteps, phone lift / ring / hang-up click, snores (the reveal),
          a countdown click per second + a ding at 0 + a 'time's up' hit, a picture-frame rattle, a pen drop, a door/bag
          bump; the counter roll ticks
  mix     bed 21 dB under the voice under speech; loudnorm -14 LUFS, TP -2; final.m4a + nomusic.m4a, score/levels.json

usage: ~/.generative-music-video/venv/Scripts/python.exe -I tools/sound_design.py
"""
import json
import os
import sys

import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from audio_kit import (SR, RNG, bass, boom, click, env_pw, hat, hp, knock, marimba, midi, mixdown, noise_burst, pad_note, place,  # noqa: E402
                       pluck, pop, reverb, ring, shaker, snore, thump, tick, tt, whoosh, bell)

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


# the shot starts (same formulas as assets/lib/film.js)
T = {"o2": L("r02") - 0.12, "o3": L("r03") - 0.1, "o4": L("r04") - 0.25, "o5": L("r05") - 0.25, "o6": L("r06") - 0.12, "o7": L("r07") - 0.12,
     "o8": L("r08") - 0.15, "o9": L("r09") - 0.15, "card": L("r10") - 0.15, "n1": Le("r11") + 0.3, "n2": w("r12", "and") - 0.1, "x1": L("r13") - 0.15,
     "x2": L("r14") - 0.12, "x3": L("r15") - 0.12, "x4": L("r16") - 0.12, "x5": L("r17") - 0.1, "x6": L("r18") - 0.1, "x7": L("r19") - 0.1,
     "m1": L("r20") - 0.25, "m2": L("r21") - 0.12, "m3": w("r21", "and") - 0.1, "end": L("r22") - 0.2}
cd0 = TM["countdown_start"]
card0, reveal0 = T["card"], T["n1"]

# ------------------------------------------------------------------ bed: 100 BPM marimba ostinato
BPM = 100.0
b = 60 / BPM
bed = np.zeros((N, 2))
minor = [[50, 53, 57, 62], [46, 50, 53, 58], [48, 52, 55, 60], [45, 49, 52, 57]]     # Dm  Bb  C  A
major = [[53, 57, 60, 65], [50, 53, 57, 62], [46, 50, 53, 58], [48, 52, 55, 60]]     # F   Dm  Bb C
energy = env_pw(t_, [(0, 0.6), (T["o5"], 0.72), (T["o9"], 0.85), (card0, 0.85), (card0 + 0.6, 0.0), (reveal0 - 0.2, 0.0), (reveal0, 0.75),
                     (T["x1"], 0.9), (T["x6"], 0.95), (T["m1"], 1.0), (T["end"], 0.85), (DUR - 0.8, 0.7), (DUR, 0.0)])
k = 0
t = 0.0
while t < DUR:
    in_card = card0 - 0.1 < t < reveal0 - 0.05
    if not in_card:
        prog = major if t >= T["x6"] else minor
        ch = prog[(k // 8) % 4]
        e = float(np.interp(t, t_[::480], energy[::480]))
        patt = [0, 2, 1, 3, 2, 1, 3, 2]
        place(bed, marimba(midi(ch[patt[k % 8]] + 12)), t, 0.55 * e, 0.25 if k % 2 else -0.25)
        if k % 2 == 0:
            place(bed, bass(midi(ch[0] - 12), 0.35), t, 0.7 * e)
        if k % 4 == 2:
            place(bed, shaker(), t, 0.5 * e, 0.4)
        if k % 8 == 0 and e > 0.8:
            place(bed, hat(), t + b * 0.5, 0.4 * e, -0.3)
    k += 1
    t += b / 2
# countdown: a low tension pulse (heartbeat-like) under the ticks, music only
tp = np.zeros((N, 2))
tt0 = card0 + 0.3
while tt0 < reveal0 - 0.4:
    place(tp, thump(48, 0.5), tt0, 0.35)
    place(tp, pad_note(midi(38), 1.0, bright=300, att=0.05, rel=0.6), tt0, 0.15)
    tt0 += 1.0
bed = reverb(bed, 0.9, 0.12, seed=4) + tp

# ------------------------------------------------------------------ SFX
sfx = np.zeros((N, 2))
for key, tc in T.items():                                   # a soft whoosh into every cut
    place(sfx, whoosh(0.35, 500, 4000), tc - 0.17, 0.35)
for p in TM["pills"]:                                        # a pop on every pill
    if p[1] > 0.2:
        place(sfx, pop(620, 880, 0.08), p[1], 0.55, 0.0)
for i in range(10):                                          # stairs: footsteps (opening and Nadia's climb)
    place(sfx, knock(240 + (i % 2) * 30, 0.12), 0.25 + i * 0.36, 0.28, 0.4)
    place(sfx, knock(260 + (i % 2) * 30, 0.12), T["n1"] + 0.2 + i * 0.32, 0.28, 0.4)
for tc in (0.9, 1.9, T["n1"] + 1.0, T["n1"] + 2.0):         # floor counter ticks
    place(sfx, tick(2400), tc, 0.4)
place(sfx, knock(160, 0.2), w("r02", "picks"), 0.5, -0.3)   # the receiver lifted
for k2 in range(2):
    place(sfx, ring(0.8), w("r02", "door") + 0.1 + k2 * 1.0, 0.18, 0.4)
place(sfx, knock(170, 0.18), w("r03", "hangs"), 0.6, -0.3)  # hang up
place(sfx, pop(440, 520, 0.12), w("r04", "light") - 0.1, 0.5)  # switchboard lamps
place(sfx, pop(520, 620, 0.12), w("r04", "light") + 0.05, 0.4)
place(sfx, bell(midi(81), 1.0), w("r04", "crazy") - 0.3, 0.12)
place(sfx, knock(150, 0.25), w("r08", "checks") + 0.1, 0.45)
place(sfx, pluck(midi(57), 0.5), w("r07", "no"), 0.3)
# countdown: a click every second, a ding at 0, a hit on "Time's up"
for i in range(11):
    tc = cd0 + i
    if tc < reveal0:
        place(sfx, click(1900 if i < 10 else 2500, 0.03), tc, 0.9 if i < 10 else 0.0)
place(sfx, bell(midi(84), 1.2), cd0 + 10, 0.4)
place(sfx, thump(60, 0.5), L("r11") - 0.05, 0.5)
# the reveal: snores (306), rattle, dial, ring, click
sn_t = T["n2"] + 0.2
while sn_t < T["x3"] + 1.2:
    place(sfx, snore(1.5, 68), sn_t, 0.55 if sn_t > T["x1"] - 0.2 else 0.35, 0.3)
    sn_t += 1.6
for i in range(10):
    place(sfx, knock(900 + 60 * (i % 3), 0.04), T["x2"] + 0.1 + i * 0.13, 0.25, -0.3)
for i in range(3):
    place(sfx, click(1200, 0.04), w("r15", "dials") + i * 0.18, 0.5, -0.2)
for k2 in range(2):
    place(sfx, ring(0.8), T["x4"] + 0.05 + k2 * 0.95, 0.42, 0.3)
place(sfx, knock(170, 0.15), w("r16", "wakes") + 0.2, 0.4, 0.3)
place(sfx, click(1500, 0.05), w("r17", "click") - 0.02, 0.9, -0.2)
place(sfx, knock(180, 0.12), w("r17", "click") - 0.02, 0.55, -0.2)
place(sfx, bell(midi(77), 1.6), w("r18", "two") - 0.1, 0.25)
place(sfx, bell(midi(81), 1.6), w("r18", "two") - 0.1, 0.12)
# aftermath: the pen drop, bag bump, a sign-off chime
place(sfx, whoosh(0.3, 1500, 6000), w("r20", "drops") + 0.05, 0.3)
place(sfx, knock(900, 0.08), w("r20", "pen") + 0.3, 0.5)
place(sfx, knock(1100, 0.06), w("r20", "pen") + 0.42, 0.3)
place(sfx, knock(180, 0.25), w("r21", "top") + 0.2, 0.3)
place(sfx, bell(midi(77), 1.4), w("r22", "follow") - 0.1, 0.25)
place(sfx, bell(midi(84), 1.4), w("r22", "follow") - 0.1, 0.15)
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

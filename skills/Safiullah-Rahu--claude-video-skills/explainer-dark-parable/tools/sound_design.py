"""Soundtrack for "The Rope" (dark parable), fully synthesized: voice + an original dark-ambient bed + story SFX.

  source  voice only (the music stem sits at -61 dB, separation residue), 191.4 / 95.7 BPM, F major per rea
  bed     a slow pad in F minor at 96 BPM (i - VI - III - VII, a chord every 2 bars), soft felt-piano notes on the
          downbeats, a sub pulse on the scale cuts; the energy follows the story (low in the parable, cold and thin
          in the experiment, warm major lift on "Control is what we learn", resolves to A-flat major at the end)
  sfx     stake knocks, rope creaks on every pull, a soft call on "cried", day whooshes, footstep thuds, tree creak +
          crack + fall, a low boom on the named concept, electric buzz flicker in the experiment, a jump whoosh, gold
          shimmers when the rope motif appears, a bubble pop, year ticks, a warm chime for the lamp, the stake pop + dust
  mix     bed 22 dB under the voice under speech; two-pass loudnorm -14 LUFS, TP -2 (AAC adds ~0.5 dB)
          writes assets/audio/final.m4a (full) and assets/audio/nomusic.m4a (voice + SFX), score/levels.json

usage: ~/.generative-music-video/venv/Scripts/python.exe -I tools/sound_design.py
"""
import json
import os
import sys

import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from audio_kit import (SR, RNG, bell, boom, bp, buzz, click, creak, env_pw, felt, hp, knock, lp, midi, mixdown, noise_burst, pad_note,  # noqa: E402
                       place, pop, reverb, riser, thump, trumpet, tt, whoosh)

ROOT = os.path.dirname(HERE)
VOJ = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
DUR = VOJ["duration"]
N = int(DUR * SR)
t_ = np.arange(N) / SR
LINES = {l["id"]: l for l in VOJ["lines"]}


def L(i):
    return LINES[i]["start"]


def Le(i):
    return LINES[i]["end"]


def w(i, word, k=0):
    norm = lambda s: "".join(ch for ch in s.lower() if ch.isalnum())
    hits = [x for x in LINES[i]["words"] if norm(x["w"]).startswith(norm(word))]
    return hits[min(k, len(hits) - 1)]["start"]


# ------------------------------------------------------------------ bed: pad + felt piano in F minor, 96 BPM
BPM = 95.7
beat = 60 / BPM
bar = 4 * beat
CH = {"Fm": [53, 60, 63, 68], "Db": [49, 56, 60, 65], "Ab": [56, 60, 63, 68], "Eb": [51, 58, 63, 67], "Bbm": [46, 58, 61, 65],
      "Dbmaj": [49, 56, 60, 63, 68], "Abmaj": [44, 56, 60, 63, 70]}
prog = []  # (t0, chord) every 2 bars
seq = ["Fm", "Db", "Ab", "Eb"]
k, t = 0, 0.0
while t < DUR:
    name = seq[k % 4]
    if t >= L("p25") - 1.0:
        name = ["Db", "Ab", "Eb", "Ab"][k % 4]          # the twist lifts toward the major
    if t >= L("p27") - 0.5:
        name = "Dbmaj" if t < L("p28") - 0.3 else "Abmaj"
    prog.append((t, name))
    t += 2 * bar
    k += 1
pad = np.zeros((N, 2))
for i, (t0, name) in enumerate(prog):
    d = min(2 * bar + 1.6, DUR - t0 + 0.1)
    for j, m in enumerate(CH[name]):
        bright = 700 if L("p18") - 0.5 < t0 < L("p22") else 1000   # the experiment is colder and thinner
        place(pad, pad_note(midi(m), d, bright=bright), t0, 0.22 if j else 0.3, (j - 1.5) * 0.25)
energy = env_pw(t_, [(0, 0.55), (L("p06"), 0.7), (L("p09"), 0.85), (L("p11"), 1.0), (L("p15"), 0.8), (L("p17"), 1.0), (L("p18"), 0.55),
                     (L("p22"), 0.75), (L("p25"), 0.85), (L("p26"), 1.0), (L("p28"), 1.05), (DUR - 1.0, 0.9), (DUR, 0.0)])
pad *= energy[:, None]
piano = np.zeros((N, 2))
for i, (t0, name) in enumerate(prog):
    notes = CH[name]
    for b, m in ((0, notes[-1] + 12), (4, notes[1] + 12)):
        tt0 = t0 + b * beat
        if tt0 < DUR - 0.5 and not (L("p18") - 0.5 < tt0 < L("p22")):
            place(piano, felt(midi(m), 2.6), tt0, 0.5, 0.15 if b else -0.15)
piano = reverb(piano, 2.2, 0.35, seed=5)
sub = np.zeros((N, 2))
for tc in (w("p09", "three"), L("p11") - 0.2, L("p16") - 0.2, L("p17") - 0.3, L("p28") + 0.5):
    place(sub, thump(42, 1.2), tc, 0.8)
bed = pad * 1.0 + piano * 0.55 + sub * 0.5

# ------------------------------------------------------------------ SFX
sfx = np.zeros((N, 2))
place(sfx, knock(160), 0.12, 1.0, -0.4)                 # the stake driven in
place(sfx, knock(150), 0.62, 0.9, -0.4)
place(sfx, creak(0.7, 7, 400, 1200), 0.9, 0.35, -0.2)    # the rope tied
place(sfx, whoosh(0.7, 200, 1600), w("p01", "baby") - 0.4, 0.25)
for k in range(5):                                        # she pulled: creaks on every tug
    tc = L("p02") + k * 1.21
    if tc < L("p05"):
        place(sfx, creak(0.55, 11, 600, 1800), tc, 0.45, 0.3)
place(sfx, trumpet(0.75), w("p03", "cried") - 0.05, 0.32, 0.35)
place(sfx, creak(1.4, 6, 300, 900), L("p04") + 0.2, 0.5, 0.2)
place(sfx, knock(110, 0.3), L("p05") - 0.1, 0.4)
place(sfx, creak(1.2, 13, 700, 2000), L("p05") + 0.1, 0.3, 0.4)
for k in range(2):                                        # day after day: two day-whooshes
    place(sfx, whoosh(0.9, 400, 2500), L("p07") - 0.1 + k * 1.0, 0.22, -0.3 + 0.6 * k)
place(sfx, riser(1.9), L("p09") - 0.4, 0.22)
for k in range(2):
    place(sfx, thump(48, 0.7), w("p09", "three") + k * 0.62, 0.9)
place(sfx, creak(0.9, 5, 250, 800), w("p10", "push") - 0.1, 0.6, -0.5)
place(sfx, noise_burst(0.35, 800, 5000), w("p10", "tree") - 0.05, 0.7, -0.5)
place(sfx, thump(40, 1.0), w("p10", "tree") + 0.55, 0.9, -0.5)
place(sfx, boom(2.0), L("p11") - 0.2, 0.55)
place(sfx, whoosh(0.8, 500, 3500), w("p13", "pulled") - 0.25, 0.25, 0.2)
place(sfx, boom(2.4), w("p17", "learned") - 0.1, 0.7)
for i in range(int((L("p20") + 2.4 - L("p18")) * 6)):    # the shock flicker (6 Hz toggles), low and dry
    tc = L("p18") - 0.2 + i / 6
    if (i % 2) and tc < Le("p20"):
        place(sfx, buzz(0.1, 120), tc, 0.045, -0.1)
place(sfx, whoosh(0.9, 600, 4000), w("p19", "jump") - 0.15, 0.4, 0.3)
shimmer = lambda: sum(bell(midi(m), 1.6) * a for m, a in ((80, 0.5), (87, 0.35), (92, 0.2)))
for tc in (w("p21", "nothing") - 0.1, w("p23", "stopped") + 0.1, w("p24", "speaking")):
    place(sfx, shimmer(), tc, 0.18, 0.2)
for tc in (L("p22") - 0.15, w("p22", "classrooms") + 0.42, w("p22", "home") - 0.2):
    place(sfx, whoosh(0.4, 500, 3000), tc - 0.1, 0.22)
place(sfx, pop(700, 380, 0.12), w("p24", "up") - 0.1, 0.3, 0.3)
y0, y1 = L("p25"), w("p25", "later") + 0.4
for i in range(14):
    place(sfx, click(2600, 0.015), y0 + (y1 - y0) * i / 14, 0.12)
place(sfx, bell(midi(80), 3.0) + 0.6 * bell(midi(87), 3.0), w("p26", "control") - 0.05, 0.35)
place(sfx, riser(1.6), L("p27") - 0.6, 0.15)
p28 = L("p28")
place(sfx, whoosh(1.0, 120, 900), p28 - 0.1, 0.5, 0.3)
place(sfx, creak(0.5, 15, 500, 1600), p28 + 0.45, 0.6, -0.3)
place(sfx, knock(130, 0.35), p28 + 0.62, 0.8, -0.3)
place(sfx, noise_burst(0.8, 150, 1200), p28 + 0.7, 0.5, -0.3)
place(sfx, knock(220, 0.25), p28 + 1.75, 0.5, -0.3)
sfx = reverb(sfx, 1.6, 0.22, seed=7)

# ------------------------------------------------------------------ voice + mix
v, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), always_2d=False)
assert sr == SR
v = hp(v, 70)[:N]
voc = np.zeros((N, 2))
voc[: len(v), 0] = v
voc[: len(v), 1] = v
voc = reverb(voc, 0.5, 0.07, seed=9)
speech = np.zeros(N, bool)
for l in VOJ["lines"]:
    speech[int(l["start"] * SR):int(l["end"] * SR)] = True
rep = mixdown(ROOT, voc, bed, sfx, speech, bed_db_under=22.0, sfx_db=-6.0, fade_s=1.1)
rep["bpm"] = BPM
json.dump(rep, open(os.path.join(ROOT, "score", "levels.json"), "w"), indent=1)
print(json.dumps(rep, indent=1))

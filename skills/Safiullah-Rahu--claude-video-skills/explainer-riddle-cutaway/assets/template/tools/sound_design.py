"""Template soundtrack (riddle cutaway): voice + a 100 BPM marimba/bass/shaker bed (music, dropped in nomusic.m4a) that
stops for the countdown card, + SFX: a whoosh into each line, a pop per pill, one click per countdown second, a ding at 0.
For a real film copy the sample's sound_design.py (../../sample/sound_design.py).
usage: ~/.generative-music-video/venv/Scripts/python.exe -I tools/sound_design.py
"""
import json
import os
import sys

import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from audio_kit import SR, bass, bell, click, hp, marimba, midi, mixdown, place, pop, reverb, shaker, thump, whoosh  # noqa: E402

ROOT = os.path.dirname(HERE)
VOJ = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
TM = json.load(open(os.path.join(ROOT, "score", "timing.json"), encoding="utf-8"))
DUR = VOJ["duration"]
N = int(DUR * SR)
LN = {l["id"]: l for l in VOJ["lines"]}
card0, cd0, CD_N = LN["r10"]["start"] - 0.15, TM["countdown_start"], 3
b = 60 / 100.0
bed = np.zeros((N, 2))
chords = [[50, 53, 57, 62], [46, 50, 53, 58], [48, 52, 55, 60], [45, 49, 52, 57]]
t, k = 0.0, 0
while t < DUR:
    if not (card0 - 0.1 < t < LN["r11"]["end"] + 0.2):
        ch = chords[(k // 8) % 4]
        place(bed, marimba(midi(ch[[0, 2, 1, 3, 2, 1, 3, 2][k % 8]] + 12)), t, 0.5, 0.25 if k % 2 else -0.25)
        if k % 2 == 0:
            place(bed, bass(midi(ch[0] - 12), 0.35), t, 0.6)
        if k % 4 == 2:
            place(bed, shaker(), t, 0.45, 0.4)
    k += 1
    t += b / 2
tt0 = card0 + 0.3
while tt0 < LN["r11"]["start"] - 0.3:
    place(bed, thump(48, 0.5), tt0, 0.35)
    tt0 += 1.0
bed = reverb(bed, 0.9, 0.12)
sfx = np.zeros((N, 2))
for l in VOJ["lines"][1:]:
    place(sfx, whoosh(0.35, 500, 4000), l["start"] - 0.3, 0.35)
for p in TM["pills"]:
    if p[1] > 0.2:
        place(sfx, pop(620, 880, 0.08), p[1], 0.55)
for i in range(CD_N):
    place(sfx, click(1900, 0.03), cd0 + i, 0.9)
place(sfx, bell(midi(84), 1.2), cd0 + CD_N, 0.4)
v, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), always_2d=False)
v = hp(v, 70)[:N]
voc = np.zeros((N, 2))
voc[: len(v), 0] = v
voc[: len(v), 1] = v
speech = np.zeros(N, bool)
for l in VOJ["lines"]:
    speech[int(l["start"] * SR):int(l["end"] * SR)] = True
print(json.dumps(mixdown(ROOT, voc, bed, sfx, speech, bed_db_under=21.0, sfx_db=-5.0, fade_s=0.5), indent=1))

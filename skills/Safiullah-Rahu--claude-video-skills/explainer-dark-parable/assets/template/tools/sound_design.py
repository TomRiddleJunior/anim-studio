"""Template soundtrack (dark parable): voice + a slow F-minor pad with felt-piano notes (the music bed, dropped in
nomusic.m4a) + a few SFX on line starts. For a real film, copy the sample's sound_design.py (../../sample/sound_design.py)
and place SFX on word anchors.
usage: ~/.generative-music-video/venv/Scripts/python.exe -I tools/sound_design.py
"""
import json
import os
import sys

import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from audio_kit import SR, boom, creak, felt, hp, knock, midi, mixdown, pad_note, place, reverb, whoosh  # noqa: E402

ROOT = os.path.dirname(HERE)
VOJ = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
DUR = VOJ["duration"]
N = int(DUR * SR)
lines = VOJ["lines"]
BPM = 95.7
bar = 4 * 60 / BPM
bed = np.zeros((N, 2))
chords = [[53, 60, 63, 68], [49, 56, 60, 65], [56, 60, 63, 68], [51, 58, 63, 67]]   # Fm Db Ab Eb
t, k = 0.0, 0
while t < DUR:
    for j, m in enumerate(chords[k % 4]):
        place(bed, pad_note(midi(m), min(2 * bar + 1.6, DUR - t + 0.1)), t, 0.25, (j - 1.5) * 0.25)
    place(bed, felt(midi(chords[k % 4][-1] + 12)), t, 0.5)
    t += 2 * bar
    k += 1
bed = reverb(bed, 2.0, 0.3)
sfx = np.zeros((N, 2))
place(sfx, knock(160), 0.12, 1.0, -0.4)
place(sfx, creak(0.7, 7, 400, 1200), 0.9, 0.35)
for l in lines[1:]:
    place(sfx, whoosh(0.6, 200, 1600), l["start"] - 0.4, 0.3)
place(sfx, boom(2.0), lines[-1]["start"] - 0.2, 0.7)
v, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), always_2d=False)
v = hp(v, 70)[:N]
voc = np.zeros((N, 2))
voc[: len(v), 0] = v
voc[: len(v), 1] = v
speech = np.zeros(N, bool)
for l in lines:
    speech[int(l["start"] * SR):int(l["end"] * SR)] = True
print(json.dumps(mixdown(ROOT, voc, bed, sfx, speech, bed_db_under=22.0, sfx_db=-6.0, fade_s=1.0), indent=1))

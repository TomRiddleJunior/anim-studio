"""Generic soundtrack for a what-if survival 2D project (the template): voice + an original 80 BPM D-minor bed (full mix
only) + ambience + a hit on frame 1, a whoosh on every cut and a pop on every shot's overlay. Add story foley per film
(see assets/sample/tools/score.py for a full event list keyed to word times).
Needs score/shots.json (export it from tools/dbg.html#times=<project>/scratch/times.json, then copy it to score/).
Writes score/final.wav + assets/audio/final.m4a and score/final_nomusic.wav (each -14 LUFS, TP -2 dBTP), score/levels.json.
usage: python -X utf8 -I tools/score.py      (numpy, scipy, soundfile; ffmpeg from $FFMPEG or PATH)
"""
import json
import os
import sys

import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import audiokit as A  # noqa: E402

SR = A.SR
VO = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
SH = json.load(open(os.path.join(ROOT, "score", "shots.json"), encoding="utf-8"))
DUR = VO["duration"]
N = int(DUR * SR)

v, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), dtype="float64")
v = v[:N] if len(v) >= N else np.concatenate([v, np.zeros(N - len(v))])
v = A.compress(A.hp(v, 75), 11.0)
voice = A.reverb(np.stack([v, v], axis=1), rt=0.35, wet=0.05, seed=4, lpf=5000)
speech = A.env_spans(N, [(l["start"] - 0.05, l["end"] + 0.1) for l in VO["lines"]], 0.12)

amb = np.zeros((N, 2))
A.place(amb, A.lp(A.noise(N, 3), 600) * 0.05, 0)
fx = np.zeros((N, 2))
A.place(fx, A.stamp(), 0.02, 0.5)
for s in SH["shots"][1:]:
    A.place(fx, A.whoosh(0.32, 400, 2800, int(s["t0"] * 10)), s["t0"] - 0.14, 0.12)
    A.place(fx, A.pop(700), s["t0"] + 0.15, 0.2)
fx *= (0.55 + 0.45 * (1 - speech))[:, None]

BEAT = 60 / 80.0
mu = np.zeros((N, 2))
prog = [(50, 57, 62), (46, 53, 58), (48, 55, 60), (45, 52, 57)]
motif = [62, 65, 69, 67, 65, 64, 62, 64]
for b in range(int(DUR / BEAT) + 1):
    t = b * BEAT
    ch = prog[(b // 4) % 4]
    if b % 4 == 0:
        A.place(mu, A.pad([A.mtof(m) for m in ch], BEAT * 4 + 0.6, 1100, 0.4, 1.0, b) * 0.1, t)
        A.place(mu, A.sub(A.mtof(ch[0] - 12), BEAT * 3.6) * 0.15, t)
    for h in range(2):
        A.place(mu, A.marimba(A.mtof(motif[(b * 2 + h) % 8]), 0.6) * 0.07, t + h * BEAT / 2, pan=0.3 if h else -0.3)
    if b % 2 == 0:
        A.place(mu, A.kick() * 0.25, t)
mu = A.reverb(mu, 1.4, 0.18, 7)


def active_rms_db(x):
    m = np.abs(x).max(axis=1) > 1e-4
    return A.rms_db(x[m]) if m.any() else -120.0


vmask = A.env_spans(N, [(l["start"], l["end"]) for l in VO["lines"]], 0.01) > 0.5
vr = A.rms_db(voice[vmask])
to = lambda x, rel: x * 10 ** ((vr + rel - active_rms_db(x)) / 20)  # noqa: E731
mu, amb, fx = to(mu, -19.0), to(amb, -27.0), to(fx, -15.0)
os.makedirs(os.path.join(ROOT, "score"), exist_ok=True)
rep = {"full": A.level(voice + amb + fx + mu, os.path.join(ROOT, "score", "final.wav")),
       "nomusic": A.level(voice + amb + fx, os.path.join(ROOT, "score", "final_nomusic.wav")),
       "voice_over_rest_db_full": A.voice_over_rest(voice, amb + fx + mu, VO["lines"]),
       "voice_over_rest_db_nomusic": A.voice_over_rest(voice, amb + fx, VO["lines"]),
       "voice_over_music_db": A.voice_over_rest(voice, mu, VO["lines"])}
json.dump(rep, open(os.path.join(ROOT, "score", "levels.json"), "w"), indent=1)
os.makedirs(os.path.join(ROOT, "assets", "audio"), exist_ok=True)
A.to_m4a(os.path.join(ROOT, "score", "final.wav"), os.path.join(ROOT, "assets", "audio", "final.m4a"))
print(json.dumps(rep))

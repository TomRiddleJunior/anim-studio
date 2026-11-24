"""Generic soundtrack for a stickman night choice project (the template): voice, room tone + a faint whine, the lamp
switch on the opening cut, a buzz + pop on the thread shot, a slam on the RULE tag, pops on the vote, an end boom, and
(full mix only) an original 50 BPM D-minor horror bed: sub drone with beating, a soft pulse, a bell motif on the hook.
Add story events per film (see assets/sample/tools/score.py). Needs score/shots.json (tools/dbg.html#times=…).
usage: python -X utf8 -I tools/score.py
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
T = SH["T"]
sid = {s["id"]: s for s in SH["shots"]}
DUR = VO["duration"]
N = int(DUR * SR)

v, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), dtype="float64")
v = v[:N] if len(v) >= N else np.concatenate([v, np.zeros(N - len(v))])
v = A.compress(A.lp(A.hp(v, 70), 9500), 10.5)
voice = A.reverb(np.stack([v, v], axis=1), rt=0.5, wet=0.06, seed=2, lpf=4000)
speech = A.env_spans(N, [(l["start"] - 0.05, l["end"] + 0.1) for l in VO["lines"]], 0.12)

amb = np.zeros((N, 2))
A.place(amb, A.lp(A.noise(N, 1), 300) * 0.5 + A.hum(DUR, 60, 0.05)[:N], 0)
A.place(amb, A.whine(DUR, 4400)[:N] * 0.02, 0)
fx = np.zeros((N, 2))
A.place(fx, A.mix(A.click(1, 2800), A.click(2, 1600) * 0.6), T["lampOff"] - 0.01, 0.8)
if "thread" in sid:
    A.place(fx, A.buzz(0.45), sid["thread"]["t0"] + 0.1, 0.5); A.place(fx, A.notify(), sid["thread"]["t0"] + 0.2, 0.25)
if "city" in sid:
    A.place(fx, A.stamp(), sid["city"]["t0"] + 0.18, 0.55)
if "vote" in sid:
    A.place(fx, A.whoosh(0.5, 200, 2000, 9), sid["vote"]["t0"], 0.15)
if "end" in sid:
    A.place(fx, A.reverb(np.stack([A.thud(40, 2.0)] * 2, 1), 2.4, 0.5), sid["end"]["t0"], 0.5)
fx *= (0.6 + 0.4 * (1 - speech))[:, None]

mu = np.zeros((N, 2))
A.place(mu, A.drone(DUR, 36.7, 0.3, 1)[:N] * 0.9, 0)
A.place(mu, A.drone(DUR, 55.0, 0.45, 2)[:N] * 0.45, 0)
t = 1.2
while t < DUR - 0.5:
    A.place(mu, A.thud(44, 0.5) * 0.4, t)
    t += 1.2
for k, m in enumerate([62, 65, 69, 68, 62]):
    A.place(mu, A.bell(A.mtof(m + 12), 2.4, 3.01, 1.0) * 0.18, 0.25 + k * 0.9, pan=-0.3 + 0.15 * k)
mu = A.reverb(mu, 2.2, 0.25, 5)


def active_rms_db(x):
    m = np.abs(x).max(axis=1) > 1e-4
    return A.rms_db(x[m]) if m.any() else -120.0


vmask = A.env_spans(N, [(l["start"], l["end"]) for l in VO["lines"]], 0.01) > 0.5
vr = A.rms_db(voice[vmask])
to = lambda x, rel: x * 10 ** ((vr + rel - active_rms_db(x)) / 20)  # noqa: E731
mu, amb, fx = to(mu, -17.0), to(amb, -25.0), to(fx, -13.0)
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

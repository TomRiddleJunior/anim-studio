"""Soundtrack for "Same Night · Part 1" (stickman night choice), fully synthesized on the voice-over clock.
Stems (48 kHz stereo): voice (Kokoro, close and dry, a little dark), amb (room tone, the city's hum that dies with its
lights, a faint high whine), sfx (lamp switch, rewind, battery chirp, phone buzz + message pops, the RULE hit, a clunk
per window / block / floor going dark, the red flash, vote pops, the end sting), music (full mix only: an original
50 BPM horror bed in D minor — sub drone with beating, a pulse that doubles when your building starts going dark,
silence on the lamp, a glass tone when the phone lights up, a five-note bell motif on the hook and the vote).
Writes score/final.wav + assets/audio/final.m4a and score/final_nomusic.wav (-14 LUFS each, TP -2 dBTP before AAC).
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
LN = {l["id"]: l for l in VO["lines"]}


def w(lid, word, k=0):
    hits = [x for x in LN[lid]["words"] if x["w"].lower().strip(",.?!…").startswith(word.lower())]
    return hits[min(k, len(hits) - 1)]["start"]


def bus():
    return np.zeros((N, 2))


# ---------------------------------------------------------------- voice: close, slightly dark
v, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), dtype="float64")
v = v[:N] if len(v) >= N else np.concatenate([v, np.zeros(N - len(v))])
v = A.lp(A.hp(v, 70), 9500)
v = A.compress(v, 10.5)
voice = A.reverb(np.stack([v, v], axis=1), rt=0.5, wet=0.06, seed=2, lpf=4000)
speech = A.env_spans(N, [(l["start"] - 0.05, l["end"] + 0.1) for l in VO["lines"]], 0.12)

# ---------------------------------------------------------------- ambience
amb = bus()
END_T = sid["end"]["t0"]
room = A.lp(A.noise(N, 1), 300) * 0.5 + A.hum(DUR, 60, 0.05)[:N]
A.place(amb, room, 0)
cityhum = A.bp(A.noise(N, 2), 120, 900) * A.curve(N, [(0, 0.5), (T["across"], 0.5), (T["blocks"] + 2.5, 0.08), (T["six"], 0.0), (DUR, 0.0)])
A.place(amb, cityhum, 0)
A.place(amb, A.whine(DUR, 4400)[:N] * A.curve(N, [(0, 0.02), (24, 0.02), (26, 0.0), (T["thread2"], 0.0), (T["thread2"] + 0.5, 0.015), (T["vote"], 0.0), (DUR, 0.0)]), 0)
amb *= (0.6 + 0.4 * (1 - speech))[:, None]

# ---------------------------------------------------------------- sfx
fx = bus()
def P(x, t, g=1.0, pan=0.0):
    A.place(fx, x, t, g, pan)
P(A.mix(A.click(1, 2800), A.click(2, 1600) * 0.6), T["lampOff"] - 0.01, 0.8)
P(A.powerdown(0.5) * 0.5, T["lampOff"], 0.3)
P(A.reverb(np.stack([A.bell(587, 1.5, 3.1, 1.0)] * 2, 1), 1.4, 0.4), w("s1", "four") - 0.05, 0.12)
for k, dt in enumerate((0.0, 0.18, 0.36)):
    P(A.bell(880 - k * 110, 1.2, 2.0, 0.6), w("s1", "remembers") - 0.05 + dt, 0.06, pan=-0.4 + 0.4 * k)
P(A.rewind(0.7), w("s2", "resets") - 0.1, 0.35)
P(A.mix(A.tick(1900), A.tick(1500)), w("s3", "never") - 0.02, 0.4); P(A.tick(1500), w("s3", "never") + 0.22, 0.3)
bz = w("s4", "buzzes") - 0.1
P(A.buzz(0.45), bz, 0.5); P(A.notify(), bz + 0.1, 0.25)
P(A.pop(980), w("s4", "own") - 0.1, 0.25)
P(A.stamp(), w("s5", "Rule") - 0.06, 0.55); P(A.reverb(np.stack([A.thud(42, 1.2)] * 2, 1), 1.6, 0.4), w("s5", "Rule") - 0.06, 0.35)
P(A.mix(A.tick(2200), A.tick(1100) * 0.5), T["t1159"], 0.45)
# R6: windows across the street go dark one by one (small switch clicks, panned left to right)
d0 = w("s6", "dark") - 0.05
for k in range(18):
    P(A.click(30 + k, 1400 + (k % 3) * 300), d0 + k * 0.07 * 2.2, 0.16, pan=-0.6 + k * 0.06)
# R7: block by block (heavier clunks)
for k in range(5):
    P(A.relay(50 + k), T["blocks"] + 0.4 + k * 0.45, 0.2 + 0.05 * k, pan=(-1) ** k * 0.5)
# R8/R9: your building, floor by floor (heavy breaker clunks)
for wd, lid, g in (("black", "s8", 0.45), ("two", "s8", 0.5), ("three", "s8", 0.55)):
    P(A.relay(60), w(lid, wd) - 0.05, g)
P(A.relay(61), w("s8", "three") + 0.75, 0.5); P(A.relay(62), w("s8", "three") + 1.3, 0.55)
P(A.relay(63), w("s10", "goes") - 0.25, 0.65)
P(A.mix(A.click(64, 2600), A.powerdown(0.9)), w("s10", "lamp") - 0.08, 0.7)
# R10: the phone lights up
P(A.buzz(0.6, 3), w("s11", "lights") - 0.1, 0.55); P(A.notify(1318, 1760), w("s11", "lights"), 0.3)
# R11: the new texts, the red flash
for wd in ("Last", "found"):
    P(A.pop(1100), w("s12", wd) - 0.1, 0.3)
st = A.mix(A.lp(np.sign(np.sin(2 * np.pi * 73 * A.tt(0.7))) * A.env(int(0.7 * SR), 0.005, 0.2, 0.3, 0.3), 2500), A.thud(50, 0.7))
P(st, w("s12", "anyway") - 0.05, 0.45)
P(A.pop(800), L_ := (LN["s12"]["end"] + 0.25), 0.2)
# R12: the vote, R13: the end
P(A.whoosh(0.5, 200, 2000, 9), T["vote"], 0.15)
P(A.pop(700), w("s14", "A") - 0.08, 0.3); P(A.pop(900), w("s15", "B") - 0.08, 0.3)
for k in range(16):
    P(A.tick(2600), w("s15", "run") - 0.25 + k * 0.032, 0.05)
P(A.pop(1200), w("s16", "Comment") - 0.05, 0.25)
P(A.mix(A.thud(55, 0.9), A.bell(587, 2.0, 3.1, 1.2) * 0.5), w("s16", "loop") - 0.05, 0.55)
P(A.reverb(np.stack([A.thud(40, 2.0)] * 2, 1), 2.4, 0.5), END_T, 0.5)
for k in range(6):
    P(A.click(80 + k, 3000) * 0.8, END_T + 1.0 + k * 0.25, 0.2)
fx *= (0.6 + 0.4 * (1 - speech))[:, None]

# ---------------------------------------------------------------- music: 50 BPM (pulse 1.2 s), D minor
BEAT = 1.2
mu = bus()
E = A.curve(N, [(0, 0.55), (T["rewind"], 0.5), (T["city"], 0.6), (T["across"], 0.7), (T["bldg"], 0.85), (w("s10", "lamp") - 0.1, 0.9),
                (w("s10", "lamp"), 0.0), (T["last"] + 0.4, 0.0), (T["last"] + 1.2, 0.5), (T["thread2"], 0.7), (T["vote"], 0.55), (END_T, 0.55), (DUR, 0.3)])
A.place(mu, A.drone(DUR, 36.7, 0.3, 1)[:N] * E * 0.9, 0)
A.place(mu, A.drone(DUR, 55.0, 0.45, 2)[:N] * E * 0.45, 0)
# pulse: a soft sub thump every beat from 11:59, double time while the building goes dark
t = T["across"]
while t < DUR - 0.5:
    i = int(t * SR)
    e = E[min(i, N - 1)]
    if e > 0.05:
        A.place(mu, A.thud(44, 0.5) * 0.5 * e, t)
    t += BEAT / 2 if T["bldg"] <= t < w("s10", "lamp") else BEAT
# the five-note bell motif (hook + vote)
motif = [62, 65, 69, 68, 62]
for start in (0.25, T["vote"] + 0.2):
    for k, m in enumerate(motif):
        A.place(mu, A.bell(A.mtof(m + 12), 2.4, 3.01, 1.0) * 0.18, start + k * BEAT * 0.75, pan=-0.3 + 0.15 * k)
# the glass tone when the phone lights up; a tension swell into the new texts; a pad under the vote
A.place(mu, A.bell(A.mtof(81), 3.5, 2.0, 0.3) * 0.2, w("s11", "lights"))
A.place(mu, A.sweep(110, 220, 3.4) * A.env(int(3.4 * SR), 2.5, 0.2, 1.0, 0.2) * 0.1, T["thread2"])
A.place(mu, A.pad([A.mtof(m) for m in (50, 53, 57, 62)], DUR - T["vote"], 900, 1.0, 1.5, 3) * 0.22, T["vote"])
mu = A.reverb(mu, 2.2, 0.25, 5)

# ---------------------------------------------------------------- levels
def active_rms_db(x):
    m = np.abs(x).max(axis=1) > 1e-4
    return A.rms_db(x[m]) if m.any() else -120.0
vmask = A.env_spans(N, [(l["start"], l["end"]) for l in VO["lines"]], 0.01) > 0.5
vr = A.rms_db(voice[vmask])
def to(x, rel):
    return x * 10 ** ((vr + rel - active_rms_db(x)) / 20)
mu, amb, fx = to(mu, -17.0), to(amb, -25.0), to(fx, -13.0)
gap = A.voice_over_rest(voice, amb + fx + mu, VO["lines"])
if gap < 12.0:
    k = 10 ** ((gap - 12.0) / 20)
    mu, amb, fx = mu * k, amb * k, fx * k
os.makedirs(os.path.join(ROOT, "score"), exist_ok=True)
rep = {"full": A.level(voice + amb + fx + mu, os.path.join(ROOT, "score", "final.wav")),
       "nomusic": A.level(voice + amb + fx, os.path.join(ROOT, "score", "final_nomusic.wav")),
       "voice_over_rest_db_full": A.voice_over_rest(voice, amb + fx + mu, VO["lines"]),
       "voice_over_rest_db_nomusic": A.voice_over_rest(voice, amb + fx, VO["lines"]),
       "voice_over_music_db": A.voice_over_rest(voice, mu, VO["lines"]), "bpm": 50.0}
json.dump(rep, open(os.path.join(ROOT, "score", "levels.json"), "w"), indent=1)
os.makedirs(os.path.join(ROOT, "assets", "audio"), exist_ok=True)
A.to_m4a(os.path.join(ROOT, "score", "final.wav"), os.path.join(ROOT, "assets", "audio", "final.m4a"))
print(json.dumps(rep))

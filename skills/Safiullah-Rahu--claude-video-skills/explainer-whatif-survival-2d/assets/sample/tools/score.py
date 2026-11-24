"""Soundtrack for "The Dark Mine" (what-if survival 2D), fully synthesized on the voice-over clock.
Stems (48 kHz stereo): voice (Kokoro, levelled, a small dry room), amb (mine air, drips, the chamber fan hum that stops
on Day 14, wind outside), sfx (story foley + UI pops on every tag/card/stamp, cut whooshes), music (full mix only: an
original 80 BPM bed in D minor — marimba ostinato, soft kick + shaker, pads — whose energy follows the beat map).
Writes score/final.wav + assets/audio/final.m4a (everything) and score/final_nomusic.wav (voice + amb + sfx), each
levelled to -14 LUFS (true peak -2 dBTP before AAC), and score/levels.json.
Shot times come from score/shots.json (exported from film.js: scratch/dbg.html#times=...).
usage: python -X utf8 -I tools/score.py      (numpy, scipy, soundfile)
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
DUR = VO["duration"]
N = int(DUR * SR)
LN = {l["id"]: l for l in VO["lines"]}


def w(lid, word, k=0):
    hits = [x for x in LN[lid]["words"] if x["w"].lower().strip(",.?!…").startswith(word.lower())]
    return hits[min(k, len(hits) - 1)]["start"]


def bus():
    return np.zeros((N, 2))


# ---------------------------------------------------------------- voice
v, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), dtype="float64")
assert sr == SR
v = v[:N] if len(v) >= N else np.concatenate([v, np.zeros(N - len(v))])
v = A.hp(v, 75)
v = A.compress(v, 11.0)
voice = A.reverb(np.stack([v, v], axis=1), rt=0.35, wet=0.05, seed=4, lpf=5000)
speech = A.env_spans(N, [(l["start"] - 0.05, l["end"] + 0.1) for l in VO["lines"]], 0.12)
duck = 1 - 0.45 * speech  # ambience + sfx dip under the voice

# ---------------------------------------------------------------- ambience
amb = bus()
shots = SH["shots"]
sid = {s["id"]: s for s in shots}
def span(a, b):
    return (sid[a]["t0"], sid[b]["t1"])
OUT = [span("yard", "portal"), span("fan", "fan"), span("line", "damc"), span("minute", "minute"), span("family", "family")]
INSIDE = [span("inside", "lampoff"), span("glow", "years"), span("rule", "rule")]
ROOM = [span("airlock", "pick"), span("d1", "stale"), span("radio", "radio"), span("call", "call")]
wind = A.lp(A.noise(N, 3), 700) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.09 * np.arange(N) / SR))
A.place(amb, wind * A.env_spans(N, OUT, 0.4) * 0.05, 0)
mine = A.lp(A.noise(N, 5), 220) * 0.10 + A.hum(DUR, 40, 0.02)[:N]
A.place(amb, mine * A.env_spans(N, INSIDE + [span("deep", "deep"), span("nobody", "nobody"), span("night", "night"), span("exist", "exist")], 0.4), 0)
fan_env = A.env_spans(N, ROOM, 0.3) * (1 - A.env_spans(N, [(T["fanStop"], DUR + 1)], 0.6))
A.place(amb, A.fan_noise(DUR, 8)[:N] * fan_env * 0.09, 0)
A.place(amb, A.hum(DUR, 50, 1)[:N] * A.env_spans(N, ROOM, 0.3) * 0.012, 0)
r = np.random.default_rng(4)
for a, b in INSIDE + ROOM:
    t = a + 0.3
    while t < b:
        A.place(amb, A.drip(int(t * 100)) * 0.12, t, pan=r.uniform(-0.6, 0.6))
        t += r.uniform(0.7, 1.6)
amb *= duck[:, None] * 0.8 + 0.2

# ---------------------------------------------------------------- sfx
fx = bus()
def P(x, t, g=1.0, pan=0.0):
    A.place(fx, x, t, g, pan)
# cut whooshes on the hard cuts (light)
for s in shots[1:]:
    P(A.whoosh(0.32, 400, 2800, int(s["t0"] * 10)), s["t0"] - 0.14, 0.10)
# S1-S2: the chase
P(A.stamp(), 0.02, 0.55)
for k in range(int(4.6 / 0.18)):
    P(A.step(k), 0.05 + k * 0.18, 0.18, pan=0.25)
for k in range(14):
    P(A.shuffle(k), 0.1 + k * 0.33, 0.10, pan=-0.4)
P(A.groan(1.4, 92, 1), 0.3, 0.16, -0.5); P(A.groan(1.2, 110, 2), 1.6, 0.13, -0.6); P(A.groan(1.6, 84, 3), 3.0, 0.15, -0.3)
P(A.whoosh(0.6, 200, 1500, 4), w("h2", "run") + 0.2, 0.2)
# S3-S5: the tunnel, they stop, the title
for k in range(9):
    P(A.reverb(np.stack([A.step(20 + k)] * 2, 1), 1.2, 0.35), T["inside"] + 0.05 + k * 0.17, 0.16)
P(A.reverb(np.stack([A.groan(1.6, 88, 5)] * 2, 1), 1.8, 0.4), T["inside"] + 0.2, 0.15)
for k in range(3):
    P(A.pop(700 + k * 120), w("h4", "stop") + 0.02 + k * 0.08, 0.22)
P(A.thud(55, 0.8, 1.0), L := T["title"] + 0.24, 0.6); P(A.whoosh(0.5, 300, 3000, 6), L - 0.25, 0.2)
# S6-S7: the eye
P(A.whoosh(0.4, 600, 5000, 7), T["eye"], 0.15)
P(A.spark(3, 0.5) * 0.5, w("sci1", "dry"), 0.25)
P(A.bell(2093, 1.5, 1.5, 0.6), w("sci1", "milky"), 0.10)
P(A.tick(3200), w("sci1", "frosted"), 0.25)
P(A.powerdown(0.9), w("sci3", "In", 1) - 0.1, 0.15)
# S8: the lamp switch
P(A.click(9, 2600), w("lamp", "off") - 0.03, 0.6); P(A.click(10, 1800), w("lamp", "off") + 0.02, 0.3)
for k in range(10):
    P(A.step(40 + k), T["lamp"] + 0.2 + k * 0.32, 0.10)
# S9-S11: down, the green light, the chamber
for k in range(12):
    P(A.step(60 + k), T["deep"] + 0.1 + k * 0.25, 0.10)
P(A.pop(520), w("deep", "hundred") - 0.08, 0.3); P(A.pop(390), w("deep", "Two") - 0.08, 0.3)
P(A.hum(2.2, 60, 1.0) * A.env(int(2.2 * SR), 0.6, 0.2, 0.8, 0.6), w("glow", "green") - 0.1, 0.06)
P(A.bell(1568, 2.0, 2.0, 0.8), w("glow", "green"), 0.12)
P(A.pop(980), w("hide", "refuge") - 0.06, 0.25)
# S12-S14
P(A.pop(820), w("fixed", "twelve") - 0.06, 0.25)
P(A.spark(11, 0.9), T["fix"] + 0.05, 0.35); P(A.spark(12, 0.7), T["fix"] + 0.8, 0.25)
P(A.whoosh(1.2, 150, 1500, 13), T["nobody"], 0.18)
# S15-S16: the airlock
P(A.thud(70, 0.5, 1.0, 14), w("airlock", "airlock") + 0.05, 0.5); P(A.click(15, 1200), w("airlock", "airlock") + 0.1, 0.3)
P(A.bp(A.noise(int(2.2 * SR), 16), 2500, 9000) * A.env(int(2.2 * SR), 0.3, 0.2, 0.6, 0.6), w("airlock", "pushed") - 0.1, 0.10)
P(A.pop(760), w("airlock", "air") - 0.05, 0.25); P(A.pop(560), w("airlock", "bad") - 0.05, 0.25); P(A.stamp(), w("airlock", "stays") - 0.03, 0.45)
# S17-S21: the inventory cards (paper swoosh + a pop per line)
for key, words in [("food", [("food", "Six"), ("food", "Two"), ("food", "Ten")]), ("water", [("water", "rock"), ("water", "drips"), ("water", "forty")]),
                   ("power", [("power", "turbine"), ("power", "stream"), ("power", "wall")]), ("aid", [("aid", "first")]), ("pick", [("aid", "pickaxe")])]:
    P(A.whoosh(0.35, 800, 5000, len(key)), T[key] + 0.0, 0.16)
    for i, (lid, wd) in enumerate(words):
        P(A.pop(640 + i * 160), w(lid, wd) - 0.06, 0.24)
P(A.drip(77), w("water", "drips") + 0.1, 0.35); P(A.drip(78), w("water", "drips") + 0.6, 0.3)
P(A.hum(2.0, 90, 1.0) * A.env(int(2.0 * SR), 0.2, 0.2, 0.7, 0.4), w("power", "turbine"), 0.05)
P(A.mix(A.thud(300, 0.2, 1.0, 19) * 0.6, A.bell(2600, 0.5, 1.3, 0.5) * 0.4), w("aid", "pickaxe") + 0.05, 0.2)
# S22-S26: the shaft, the fan, the meter, the line, the dam
P(A.whoosh(2.8, 200, 2000, 21), T["shaft"] + 0.2, 0.16)
P(A.pop(700), w("shaft", "one") - 0.06, 0.25); P(A.pop(500), w("shaft", "three") - 0.06, 0.25)
P(A.fan_noise(2.6, 22) * 0.6, T["fan"], 0.18); P(A.groan(1.3, 100, 23), T["fan"] + 0.6, 0.08, 0.5)
P(A.sweep(300, 900, 0.6) * A.env(int(0.6 * SR), 0.01, 0.1, 0.6, 0.2), T["meter"] + 0.3, 0.06)
buzzer = A.lp(np.sign(np.sin(2 * np.pi * 110 * A.tt(0.4))), 1800) * A.env(int(0.4 * SR), 0.01, 0.1, 0.8, 0.1)
P(buzzer, w("dam", "spin") - 0.05, 0.12)
P(A.pop(600), w("dam", "three") - 0.06, 0.25); P(A.pop(820), w("dam", "dam") - 0.05, 0.22)
P(A.lp(A.noise(int(2.9 * SR), 26), 1200) * A.env(int(2.9 * SR), 0.3, 0.2, 0.9, 0.5), T["damc"], 0.10)
P(A.pop(560), T["damc"] + 0.05, 0.2)
# S27-S31: the rule, the eye card, blinded, the night climb
P(A.thud(90, 0.4), w("rule", "rule") - 0.1, 0.4); P(A.stamp(), w("rule", "Never") - 0.03, 0.55)
P(A.whoosh(0.4, 700, 5000, 28), T["explain"], 0.15)
P(A.sweep(200, 600, 1.0) * A.env(int(1.0 * SR), 0.05, 0.2, 0.7, 0.3), w("pupil", "open") - 0.1, 0.07)
P(A.mix(A.hp(A.noise(int(1.2 * SR), 29), 5000) * A.env(int(1.2 * SR), 0.05, 0.2, 0.5, 0.6), A.bell(3136, 1.2, 2.0, 0.4) * 0.5), w("blind", "sunlight") - 0.1, 0.12)
P(A.stamp(), w("blind", "blind") - 0.03, 0.55)
for k in range(5):
    P(A.tick(2000), w("blind", "minute") + k * 0.25, 0.25)
P(A.whine(1.8, 3700) * A.env(int(1.8 * SR), 0.05, 0.2, 0.6, 0.6), T["minute"], 0.03)
for k in range(4):
    P(A.groan(1.0, 90 + 12 * k, 30 + k), T["minute"] + 0.2 + k * 0.4, 0.08, pan=(-1) ** k * 0.6)
for k in range(14):
    P(A.mix(A.click(50 + k, 900) * 0.8, A.thud(140, 0.1, 0.5, 50 + k)), T["night"] + 0.2 + k * 0.38, 0.10)
P(A.pop(560), w("night", "Three") - 0.06, 0.25); P(A.pop(700), w("night", "Two") - 0.06, 0.25)
for k in range(8):
    P(A.tick(1800), w("night", "Two") + k * 0.25, 0.18)
# S32-S35: the days
for key in ("d1", "d5", "d10", "d14"):
    P(A.bell(1046, 1.4, 2.0, 0.7), T[key] + 0.05, 0.12); P(A.pop(500), T[key] + 0.05, 0.25)
P(A.radio_crackle(2.0, 33) * 0.4, T["mon"], 0.12)
P(A.radio_crackle(1.6, 34) * 0.4, T["d10"], 0.10); P(A.stamp(), w("d10", "moved") - 0.03, 0.4)
P(A.reverb(np.stack([A.groan(2.2, 80, 35)] * 2, 1), 2.2, 0.5), T["stare"] + 0.3, 0.16)
P(A.reverb(np.stack([A.groan(1.8, 96, 36)] * 2, 1), 2.0, 0.5), T["stare"] + 1.6, 0.12)
# S36-S37: the fan stops
P(A.powerdown(1.8), T["fanStop"], 0.35)
P(A.heartbeat(), T["still"] + 0.1, 0.35); P(A.heartbeat(), T["still"] + 1.0, 0.3)
# S38-S39: the plan, the gauge
P(A.whoosh(0.35, 800, 5000, 38), T["plan"], 0.15)
for wd in ("Food", "Water", "Power"):
    P(A.mix(A.tick(2600), A.click(39, 3000) * 0.5), w("plan", wd) - 0.05, 0.3)
P(A.pop(380), w("forgot", "forgot") - 0.05, 0.3); P(A.stamp(), w("forgot", "never") - 0.03, 0.5)
P(A.sweep(500, 140, 1.2) * A.env(int(1.2 * SR), 0.05, 0.2, 0.7, 0.3), w("stale", "stale") - 0.4, 0.08)
P(A.stamp(), w("stale", "Six") - 0.05, 0.45)
# S40-S43: the radio, the dam at night, the call
P(A.radio_crackle(2.0, 40), w("radio", "crackles") - 0.08, 0.35)
for k in range(5):
    P(A.relay(41 + k), w("someone", "switching") - 0.05 + k * 0.35, 0.22)
P(A.pop(820), w("someone", "family") - 0.06, 0.22)
P(A.whoosh(1.0, 200, 1800, 42), T["exist"], 0.14); P(A.pop(980), w("know", "you") - 0.05, 0.25)
P(A.click(43, 2200), w("call", "call") - 0.1, 0.45); P(A.radio_crackle(1.0, 44) * 0.6, w("call", "call") - 0.05, 0.2)
# S44-S47: the map
P(A.whoosh(0.4, 600, 5000, 45), T["map"], 0.16)
P(A.bp(A.noise(int(0.5 * SR), 46), 2000, 7000) * A.env(int(0.5 * SR), 0.02, 0.2, 0.6, 0.1), w("alone", "second") - 0.05, 0.14)
P(A.whoosh(2.4, 150, 900, 47), w("breathe", "breathes") - 0.1, 0.18)
for k in range(12):
    P(A.bp(A.noise(int(0.12 * SR), 48 + k), 2500, 7000) * A.env(int(0.12 * SR), 0.01, 0.05, 0.6, 0.04), T["route"] + 0.2 + k * 0.28, 0.12)
P(A.stamp(), T["through"] + 0.08, 0.5); P(A.groan(1.4, 88, 60), T["through"] + 0.1, 0.18); P(A.groan(1.2, 104, 61), T["through"] + 0.4, 0.14, 0.5)
# S48: the vote card
P(A.whoosh(0.5, 300, 3000, 62), T["vote"], 0.2)
P(A.pop(660), w("ask1", "call") - 0.08, 0.35); P(A.pop(880), w("ask2", "alone") - 0.08, 0.35); P(A.pop(1100), w("ask2", "Comment") - 0.08, 0.3)
fx *= (0.55 + 0.45 * (1 - speech))[:, None]

# ---------------------------------------------------------------- music: 80 BPM, D minor
BPM = 80.0
BEAT = 60 / BPM
mu = bus()
# energy curve over the film (0..1) + which layers play
E = A.curve(N, [(0, 0.85), (10.8, 0.85), (11.2, 0.4), (13.3, 0.5), (29.4, 0.55), (31, 0.7), (44, 0.75), (72.8, 0.75), (73, 0.45), (90.4, 0.4),
                (102.4, 0.35), (T["fanStop"], 0.0), (T["plan"] - 0.2, 0.0), (T["plan"], 0.35), (118.2, 0.45), (129.8, 0.65), (142.6, 0.9), (144.1, 0.5), (DUR, 0.45)])
KICK = [(0, 10.9), (31, 72.8), (125.0, 142.7)]
SHAK = [(0, 10.9), (44, 72.8), (129.8, 142.7)]
prog = [(50, 57, 62), (46, 53, 58), (48, 55, 60), (45, 52, 57)]           # Dm, Bb, C, A (low voicings, midi)
prog_hide = [(53, 57, 60), (48, 55, 60), (50, 57, 62), (46, 53, 58)]       # F, C, Dm, Bb (the hideout lift)
motif = [62, 65, 69, 67, 65, 64, 62, 64]
t0 = 0.0
nbeats = int(DUR / BEAT) + 1
for b in range(nbeats):
    t = t0 + b * BEAT
    i = int(t * SR)
    if i >= N:
        break
    e = E[i]
    bar = b // 4
    hide = 29.4 <= t < 44
    ch = (prog_hide if hide else prog)[bar % 4]
    if b % 4 == 0 and e > 0.05:
        A.place(mu, A.pad([A.mtof(m) for m in ch], BEAT * 4 + 0.6, 1100, 0.4, 1.0, bar) * 0.10 * (0.5 + e), t)
        A.place(mu, A.sub(A.mtof(ch[0] - 12), BEAT * 3.6, 0.02, 0.4) * 0.16 * e, t)
    if e > 0.3:
        for h in range(2):  # marimba ostinato on 8ths
            note = motif[(b * 2 + h) % len(motif)] - (2 if t >= 72.8 and t < 90.4 else 0)
            A.place(mu, A.marimba(A.mtof(note), 0.6) * 0.07 * e, t + h * BEAT / 2, pan=0.3 if h else -0.3)
    if any(a <= t < z for a, z in KICK) and b % 2 == 0:
        A.place(mu, A.kick() * 0.28 * e, t)
    if any(a <= t < z for a, z in SHAK):
        for h in range(2):
            A.place(mu, A.shaker(1, b * 2 + h) * 0.05 * e, t + h * BEAT / 2, pan=0.5)
# tension layers: the rule (minor second drone), the turn, the route build
A.place(mu, A.drone(17.0, 73.4, 0.6, 1) * A.env(int(17 * SR), 1.0, 0.2, 1.0, 2.0) * 0.07, 72.9)
A.place(mu, A.drone(10.0, 61.7, 0.8, 2) * A.env(int(10 * SR), 1.5, 0.2, 1.0, 2.0) * 0.08, T["plan"])
A.place(mu, A.sweep(80, 160, 13.0) * A.env(int(13 * SR), 4.0, 0.2, 1.0, 0.3) * 0.05, 129.8)
roll = np.zeros(int(4.0 * SR))
for k in range(40):
    s_ = A.hp(A.noise(int(0.08 * SR), 300 + k), 1500) * np.exp(-np.arange(int(0.08 * SR)) / 600)
    i = int((k / 40) ** 0.7 * 3.9 * SR)
    roll[i:i + len(s_)] += s_ * (0.2 + 0.8 * k / 40)
A.place(mu, roll * 0.07, T["through"] - 3.9)
A.place(mu, A.thud(45, 1.2) * 0.4, T["through"] + 0.08)
A.place(mu, A.thud(50, 1.0) * 0.3, T["title"] + 0.24)
mu = A.reverb(mu, 1.4, 0.18, 7)

# ---------------------------------------------------------------- mixdown + levels
os.makedirs(os.path.join(ROOT, "score"), exist_ok=True)
# stem levels relative to the voice (RMS while speaking): music -19 dB, ambience -27 dB, sfx (where active) -15 dB;
# then everything but the voice comes down together until it sits >= 12.5 dB under the voice
def active_rms_db(x):
    m = np.abs(x).max(axis=1) > 1e-4
    return A.rms_db(x[m]) if m.any() else -120.0
vmask = A.env_spans(N, [(l["start"], l["end"]) for l in VO["lines"]], 0.01) > 0.5
vr = A.rms_db(voice[vmask])
def to(x, rel):
    return x * 10 ** ((vr + rel - active_rms_db(x)) / 20)
mu, amb, fx = to(mu, -19.0), to(amb, -27.0), to(fx, -15.0)
gap = A.voice_over_rest(voice, amb + fx + mu, VO["lines"])
if gap < 12.5:
    k = 10 ** ((gap - 12.5) / 20)
    mu, amb, fx = mu * k, amb * k, fx * k
full = voice + amb + fx + mu
nom = voice + amb + fx
rep = {}
rep["full"] = A.level(full, os.path.join(ROOT, "score", "final.wav"))
rep["nomusic"] = A.level(nom, os.path.join(ROOT, "score", "final_nomusic.wav"))
rep["voice_over_rest_db_full"] = A.voice_over_rest(voice, amb + fx + mu, VO["lines"])
rep["voice_over_rest_db_nomusic"] = A.voice_over_rest(voice, amb + fx, VO["lines"])
rep["voice_over_music_db"] = A.voice_over_rest(voice, mu, VO["lines"])
rep["bpm"] = BPM
json.dump(rep, open(os.path.join(ROOT, "score", "levels.json"), "w"), indent=1)
os.makedirs(os.path.join(ROOT, "assets", "audio"), exist_ok=True)
A.to_m4a(os.path.join(ROOT, "score", "final.wav"), os.path.join(ROOT, "assets", "audio", "final.m4a"))
print(json.dumps(rep))

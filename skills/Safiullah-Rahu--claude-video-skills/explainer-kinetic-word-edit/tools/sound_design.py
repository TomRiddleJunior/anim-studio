"""Undertow soundtrack, fully synthesized: an original 99 BPM minor-key ballad beat (sub, pad, soft kick, finger snaps,
hats, a bell motif) that follows the edit's scenes, + story SFX on every visual event, + the Kokoro voice with the one
stretched vowel ("slow" phase-vocoded to the end of its letters) and an echo throw.
  music  intro under water (low-passed 380 Hz, opens on the first 3D word), full on the type, drops out for the whip,
         soft desk groove, heavy fire bars, desk again, half-time question bars that fade with the picture
  sfx    bubbles, reverse swells + hits on the scene changes, whooshes on whips, highlighter squeaks per word,
         fire ignitions + crackle, the burn flare, paper toss / land / crinkle while the note unfolds, marker scribble,
         neon buzz on the red word, a low boom on the question
  out    score/audio/{full,nomusic,stem_*}.wav, assets/audio/final.m4a (full), assets/audio/nomusic.m4a, score/levels.json
usage: ~/.generative-music-video/venv/Scripts/python.exe -X utf8 -I tools/sound_design.py
"""
import json
import os
import sys

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audiolib import (SR, bp, delay, env, hp, lp, master, mtof, noise, place, reverb, rms_db, sweep, to_m4a, tt)  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = json.load(open(os.path.join(ROOT, "film.json"), encoding="utf-8"))
VO = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
L = {l["id"]: l for l in VO["lines"]}
DUR = cfg["dur"]
N = int(DUR * SR)
BEAT = 60 / cfg["bpm"]
t_ = np.arange(N) / SR


def on(lid, i):
    return L[lid]["words"][i]["start"]


def off(lid, i):
    return L[lid]["words"][i]["end"]


# scene times (mirror assets/lib/film.js)
T = dict(D0=19 * BEAT, FLASH=27 * BEAT, FIRE=28 * BEAT, BURN0=on("l5c", 0) + 0.55, BURN1=on("l5c", 0) + 1.45,
         NOTE0=on("l5c", 0) + 0.75, NOTE1=on("l5c", 0) + 1.45, Q0=44 * BEAT, FADE0=52 * BEAT, STR0=on("l3b", 1), STR1=cfg["stretch"]["to"],
         TYPE=on("l2a", 0))
rng = np.random.default_rng(5)


def stereo(n):
    return np.zeros((n, 2))


def seg_env(points):
    ts, vs = zip(*points)
    return np.interp(t_, ts, vs)


# ============================================================================ music
music = stereo(N)
CH = [[62, 65, 69, 74], [58, 62, 65, 70], [60, 65, 69, 72], [60, 64, 67, 72]]        # Dm Bb F C (voicings)
ROOT_M = [38, 34, 41, 36]
BAR = 4 * BEAT
nbars = int(DUR / BAR) + 2

# pad: detuned saw-ish (additive, 8 partials) per bar with a slow attack, low-passed
pad = stereo(N)
for b in range(nbars):
    t0 = b * BAR
    if t0 >= DUR:
        break
    d = BAR + 0.6
    x = tt(d)
    sig = np.zeros(len(x))
    for m in CH[b % 4]:
        f = mtof(m)
        for det in (-0.12, 0.11):
            ff = f * 2 ** (det / 12)
            for k in range(1, 8):
                sig += np.sin(2 * np.pi * ff * k * x + k * 1.3 + det) / k * (0.9 if k == 1 else 0.55)
    sig *= env(len(x), a=0.55, d=0.4, s=0.75, r=0.6)
    place(pad, sig * 0.05, t0, 1.0, 0.0)
pad = lp(pad, 1700)
pad[:, 1] = np.roll(pad[:, 1], int(0.011 * SR))

# sub bass: one long note per bar, slight drive
sub = stereo(N)
for b in range(nbars):
    t0 = b * BAR
    if t0 >= DUR:
        break
    x = tt(BAR + 0.05)
    f = mtof(ROOT_M[b % 4])
    s = np.sin(2 * np.pi * f * x) + 0.25 * np.sin(2 * np.pi * 2 * f * x)
    s = np.tanh(1.6 * s) * env(len(x), a=0.03, d=0.5, s=0.7, r=0.12)
    place(sub, s * 0.32, t0, 1.0, 0.0)

# drums
def kick():
    x = tt(0.42)
    return (sweep(130, 42, 0.42) * np.exp(-x * 9) + 0.25 * noise(len(x), 3) * np.exp(-x * 120)) * 0.9


def snap():
    x = tt(0.16)
    n = bp(noise(len(x), 11), 1700, 5200) * np.exp(-x * 55)
    c = np.sin(2 * np.pi * 1350 * x) * np.exp(-x * 140) * 0.4
    return (n + c) * 0.7


def hat(open_=False):
    x = tt(0.18 if open_ else 0.05)
    return hp(noise(len(x), 21), 7000) * np.exp(-x * (25 if open_ else 110)) * 0.35


def bell(m, d=1.6):
    x = tt(d)
    f = mtof(m)
    return (np.sin(2 * np.pi * f * x) + 0.35 * np.sin(2 * np.pi * 2.76 * f * x) * np.exp(-x * 6) + 0.12 * np.sin(2 * np.pi * 5.4 * f * x) * np.exp(-x * 14)) * np.exp(-x * 2.6) * 0.5


drums = stereo(N)
bells = stereo(N)
# sections: (t0, t1, kind)
SEC = [(0, T["TYPE"] - 0.02, "intro"), (T["TYPE"] - 0.02, T["STR1"] - 0.3, "type"), (T["STR1"] - 0.3, T["D0"], "whip"),
       (T["D0"], T["FLASH"], "desk"), (T["FLASH"], T["BURN1"], "fire"), (T["BURN1"], T["Q0"], "desk2"), (T["Q0"], DUR, "q")]


def kind_at(t):
    for a, b, k in SEC:
        if a <= t < b:
            return k
    return "q"


nbeats = int(DUR / BEAT) + 1
for k in range(nbeats):
    tb = k * BEAT
    kd = kind_at(tb + 0.001)
    pos = k % 4
    if kd == "intro":
        if pos == 0:
            place(drums, lp(kick(), 300) * 0.6, tb)
    elif kd in ("type", "desk", "desk2"):
        if pos == 0 or (pos == 2 and kd == "type"):
            place(drums, kick() * (0.9 if kd == "type" else 0.7), tb)
        if pos == 2 and kd != "type":
            place(drums, kick() * 0.45, tb + BEAT * 0.5)
        if pos in (1, 3):
            place(drums, snap() * (0.85 if kd == "type" else 0.65), tb, 1.0, 0.1)
        if kd == "type" and tb > on("l2b", 0) - 0.1:
            for h in (0, 0.5):
                place(drums, hat(), tb + h * BEAT, 0.8 if h == 0 else 0.55, -0.3)
        if kd in ("desk", "desk2"):
            place(drums, hat(), tb + 0.5 * BEAT, 0.45, -0.35)
    elif kd == "fire":
        place(drums, kick() * 1.0, tb)
        if pos in (1, 3):
            place(drums, snap() * 0.9, tb, 1.0, 0.1)
            place(drums, hat(True), tb + 0.5 * BEAT, 0.5, -0.3)
    elif kd == "q":
        if pos == 0:
            place(drums, kick() * 0.85, tb)
        if pos == 2:
            place(drums, snap() * 0.7, tb, 1.0, 0.1)
# bell motif in the desk sections (chord tones, sparse 8ths)
for k in range(nbeats * 2):
    tb = k * BEAT / 2
    kd = kind_at(tb + 0.001)
    if kd not in ("desk", "desk2", "q"):
        continue
    bar = int(tb / BAR)
    step = k % 8
    pat = {0: 3, 3: 1, 4: 2, 6: 0} if kd != "q" else {0: 3, 4: 1}
    if step in pat:
        m = CH[bar % 4][pat[step]] + 12
        place(bells, bell(m), tb, 0.55 if kd != "q" else 0.4, 0.25 if step % 2 else -0.25)
bells = delay(bells, BEAT * 0.75, fb=0.4, mix=0.35)

music = pad * 1.0 + sub * 1.0 + drums * 0.9 + bells * 0.5
# section energy + the underwater filter (a crossfade between a 380 Hz low-passed copy and the open mix)
uw = seg_env([(0, 1), (T["TYPE"] - 0.35, 1), (T["TYPE"] + 0.05, 0), (DUR, 0)])
muff = lp(music, 380, 2) * 1.5
music = music * (1 - uw)[:, None] + muff * uw[:, None]
lvl = seg_env([(0, 0.8), (T["TYPE"], 1.0), (T["STR1"] - 0.3, 1.0), (T["STR1"], 0.55), (T["D0"] - 0.1, 0.5), (T["D0"] + 0.3, 0.85),
               (T["FLASH"], 0.85), (T["FIRE"], 1.05), (T["BURN1"], 1.0), (T["BURN1"] + 0.4, 0.85), (T["Q0"], 0.85), (T["Q0"] + 0.6, 1.0),
               (T["FADE0"], 0.95), (DUR - 0.3, 0.0), (DUR, 0.0)])
music *= lvl[:, None]
music = reverb(music, 1.8, 0.22, seed=4)

# ============================================================================ sfx
sfx = stereo(N)


def whoosh(d=0.5, f0=300, f1=3000, seed=1):
    x = tt(d)
    n = noise(len(x), seed)
    e = np.sin(np.pi * np.clip(x / d, 0, 1)) ** 2
    out = np.zeros(len(x))
    for i, (a, b) in enumerate([(0, 0.33), (0.33, 0.66), (0.66, 1.0)]):
        sl = slice(int(a * len(x)), int(b * len(x)))
        fc = f0 * (f1 / f0) ** ((a + b) / 2)
        out[sl] = bp(n, fc * 0.6, fc * 1.6)[sl]
    return lp(out, 6000) * e


def swell(d=1.0, seed=2):
    x = tt(d)
    n = bp(noise(len(x), seed), 400, 7000)
    return n * (x / d) ** 3 * 0.8


def hit(d=1.4):
    x = tt(d)
    return sweep(90, 34, d) * np.exp(-x * 3.2) * 1.0 + bp(noise(len(x), 9), 80, 2500) * np.exp(-x * 18) * 0.5


def bubble(seed):
    r = np.random.default_rng(seed)
    d = 0.06 + r.random() * 0.06
    x = tt(d)
    return np.sin(2 * np.pi * np.cumsum(np.geomspace(500 + r.random() * 600, 1400 + r.random() * 900, len(x))) / SR) * np.exp(-x * 40) * 0.5


def crackle(d, dens=60, seed=4):
    r = np.random.default_rng(seed)
    out = np.zeros(int(d * SR))
    for _ in range(int(d * dens)):
        i = r.integers(0, len(out) - 400)
        L_ = r.integers(40, 300)
        out[i:i + L_] += r.standard_normal(L_) * np.exp(-np.arange(L_) / (L_ / 4)) * (0.3 + r.random())
    roar = lp(noise(len(out), seed + 1), 500) * 0.35
    return hp(out, 900) * 0.5 + roar


def ignite():
    x = tt(0.7)
    n = noise(len(x), 31)
    out = np.zeros(len(x))
    for i in range(8):
        sl = slice(int(i * len(x) / 8), int((i + 1) * len(x) / 8))
        fc = 200 * (1600 / 200) ** (i / 7)
        out[sl] = bp(n, fc * 0.5, fc * 1.5)[sl]
    return out * np.exp(-x * 3.5) * (1 - np.exp(-x * 60)) * 0.9 + np.sin(2 * np.pi * 55 * x) * np.exp(-x * 9) * 0.6


def flutter(d=0.7, seed=6):
    x = tt(d)
    return bp(noise(len(x), seed), 1500, 6000) * (0.5 + 0.5 * np.sin(2 * np.pi * 17 * x)) * np.sin(np.pi * x / d) * 0.6


def crinkle(d, seed=8, dens=70):
    r = np.random.default_rng(seed)
    out = np.zeros(int(d * SR))
    for _ in range(int(d * dens)):
        i = r.integers(0, len(out) - 900)
        L_ = r.integers(200, 900)
        out[i:i + L_] += r.standard_normal(L_) * np.exp(-np.arange(L_) / (L_ / 3)) * r.random()
    return bp(out, 1800, 9000) * 0.6


def squeak(d=0.3, seed=12):
    x = tt(d)
    fr = bp(noise(len(x), seed), 2500, 5500) * 0.5 + np.sin(2 * np.pi * np.cumsum(2900 + 300 * np.sin(2 * np.pi * 3 * x)) / SR) * 0.05
    return fr * env(len(x), 0.02, 0.05, 0.8, 0.05)


def scribble(d, seed=14):
    x = tt(d)
    strokes = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 7.5 * x + 0.3)) * (0.6 + 0.4 * np.sin(2 * np.pi * 2.1 * x))
    return bp(noise(len(x), seed), 1800, 6500) * lp(strokes, 40) * 0.45


def buzz(d=1.2):
    x = tt(d)
    b = sum(np.sin(2 * np.pi * 120 * k * x) / k for k in range(1, 9))
    flick = np.ones(len(x))
    for a, z in [(0.0, 0.05), (0.09, 0.13), (0.2, 0.24)]:
        flick[int(a * SR):int(z * SR)] = 0.1
    return hp(b, 200) * flick * np.exp(-x * 1.4) * 0.25 + bp(noise(len(x), 41), 3000, 8000) * np.exp(-x * 60) * 0.4


# bubbles over the intro
for i in range(26):
    tb = 0.1 + i * 0.13 + rng.random() * 0.1
    if tb < T["TYPE"] - 0.1:
        place(sfx, bubble(i), tb, 0.45 * (1 - tb / 4.5), rng.uniform(-0.5, 0.5))
# swell into the first 3D word + a hit on it
place(sfx, swell(1.1, 2), T["TYPE"] - 1.1, 0.55)
place(sfx, hit(1.6), T["TYPE"], 0.75)
# the whip and the drop into the dark
place(sfx, whoosh(0.55, 250, 4200, 3), T["STR1"] - 0.38, 1.0, 0.4)
place(sfx, whoosh(0.9, 2500, 180, 4), T["STR1"] + 0.1, 0.5, -0.3)
# desk arrival: a soft paper settle
place(sfx, crinkle(0.35, 21, 40), T["D0"] + 0.05, 0.35)
# highlighter squeak per word of l4
for w in L["l4"]["words"]:
    place(sfx, squeak(min(0.32, w["end"] - w["start"] + 0.05), int(w["start"] * 100)), w["start"] - 0.02, 0.5, 0.15)
# flash into the fire
place(sfx, swell(0.62, 5), T["FLASH"] - 0.62 + 0.1, 0.7)
place(sfx, hit(1.4), T["FIRE"], 0.8)
for lid, i, k in (("l5a", 0, 0), ("l5b", 0, 0), ("l5c", 0, 0), ("l5c", 0, 0.34)):
    place(sfx, ignite(), on(lid, i) + k - 0.03, 0.8 if k == 0 else 0.55, rng.uniform(-0.3, 0.3))
cr = crackle(T["BURN1"] - T["FIRE"] + 0.3, 70, 4)
ce = np.interp(np.arange(len(cr)) / SR, [0, 0.3, T["BURN0"] - T["FIRE"], T["BURN0"] - T["FIRE"] + 0.4, len(cr) / SR], [0, 0.8, 0.9, 1.6, 0])
place(sfx, cr * ce, T["FIRE"], 0.55)
place(sfx, whoosh(0.9, 200, 3000, 7), T["BURN0"] - 0.1, 0.9)
# the note: toss, land, unfold, write
place(sfx, flutter(0.7, 6), T["NOTE0"], 0.6, 0.3)
place(sfx, crinkle(0.08, 30, 200), T["NOTE1"] - 0.02, 0.8)
place(sfx, crinkle(L["l6"]["start"] - T["NOTE1"] - 0.2, 31, 55), T["NOTE1"] + 0.05, 0.55, 0.2)
place(sfx, scribble(L["l6"]["end"] - L["l6"]["start"] - 0.05, 14), L["l6"]["start"], 0.55, 0.2)
# into the question
place(sfx, whoosh(0.7, 300, 3500, 9), T["Q0"] - 0.05, 0.9, -0.3)
place(sfx, hit(2.2), on("l7", 0), 0.7)
place(sfx, buzz(1.6), on("l7", 4) - 0.02, 0.55, 0.45)
place(sfx, buzz(0.5), 33.4, 0.25, 0.45)
sfx = reverb(sfx, 1.2, 0.2, seed=8)

# ============================================================================ voice (+ the stretched vowel + echo throw)
import librosa  # noqa: E402

v, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), always_2d=False)
assert sr == SR
v = v[:N] if len(v) >= N else np.concatenate([v, np.zeros(N - len(v))])
a0, a1 = T["STR0"] - 0.02, off("l3b", 1)
i0, i1 = int(a0 * SR), int(a1 * SR)
word = v[i0:i1].copy()
target = T["STR1"] - a0
# keep the consonant onset, stretch the vowel+w (from 0.12 s in)
k = int(0.12 * SR)
head, tail = word[:k], word[k:]
rate = len(tail) / (target * SR - k)
st = librosa.effects.time_stretch(tail.astype(np.float32), rate=rate, n_fft=2048, hop_length=256)
st *= np.concatenate([np.ones(max(0, len(st) - int(0.25 * SR))), np.linspace(1, 0, min(len(st), int(0.25 * SR)))])
new = np.concatenate([head, st])
v[i0:i1] = 0
v[i0:i0 + len(new)] += new[: N - i0]
vo = np.stack([v, v], axis=1)
vo = hp(vo, 70)
# echo throw on the stretched word only
throw = np.zeros_like(vo)
throw[i0:i0 + len(new)] = vo[i0:i0 + len(new)]
throw = delay(throw, BEAT * 0.5, fb=0.45, mix=1.0, n_taps=5) - throw
vo = reverb(vo, 0.9, 0.12, seed=9) + throw * 0.35
sf.write(os.path.join(ROOT, "score", "audio", "vo_fx.wav"), vo.astype(np.float32), SR, subtype="FLOAT")

# ============================================================================ levels: music bed 14 dB under the voice while speaking
speech = np.zeros(N, bool)
for l in VO["lines"]:
    speech[int(l["start"] * SR):int(min(DUR, l["end"]) * SR)] = True
vo_db = rms_db(vo[speech, 0])
mus_db = rms_db(music[speech, 0])
g_m = 10 ** ((vo_db - 14.0 - mus_db) / 20)
music *= g_m
# SFX: the loudest 100 ms sit ~4 dB under the voice's loud windows
w = int(0.1 * SR)
def p995(x):
    m = x.mean(axis=1)
    nw = len(m) // w
    return np.percentile(np.sqrt((m[: nw * w].reshape(nw, w) ** 2).mean(axis=1)), 99.5)
g_s = p995(vo) / (p995(sfx) + 1e-12) * 10 ** (-4 / 20)
sfx *= g_s
# duck the SFX 7 dB under speech (60 ms ramps) so voice stays >= 10 dB over everything else
from audiolib import lp as _lp  # noqa: E402
duck = 1 - (1 - 10 ** (-7 / 20)) * np.clip(_lp(speech.astype(float), 6, 1), 0, 1)
sfx *= duck[:, None]
stems = {"voice": vo, "sfx": sfx, "music": music}
rep = master(stems, os.path.join(ROOT, "score", "audio"))
full = sf.read(os.path.join(ROOT, "score", "audio", "full.wav"))[0]
mus = sf.read(os.path.join(ROOT, "score", "audio", "stem_music.wav"))[0]
sfxs = sf.read(os.path.join(ROOT, "score", "audio", "stem_sfx.wav"))[0]
voc = sf.read(os.path.join(ROOT, "score", "audio", "stem_voice.wav"))[0]
rep.update({"voice_rms_db_speech": round(rms_db(voc[speech, 0]), 2), "music_re_voice_db": round(rms_db(mus[speech, 0]) - rms_db(voc[speech, 0]), 2),
            "music_plus_sfx_re_voice_db": round(rms_db((mus + sfxs)[speech, 0]) - rms_db(voc[speech, 0]), 2),
            "music_alone_lufs_region": None, "stretch": {"word": "slow", "from": round(a0, 3), "to": round(T["STR1"], 3), "rate": round(rate, 3)}})
os.makedirs(os.path.join(ROOT, "assets", "audio"), exist_ok=True)
to_m4a(os.path.join(ROOT, "score", "audio", "full.wav"), os.path.join(ROOT, "assets", "audio", "final.m4a"))
to_m4a(os.path.join(ROOT, "score", "audio", "nomusic.wav"), os.path.join(ROOT, "assets", "audio", "nomusic.m4a"))
json.dump(rep, open(os.path.join(ROOT, "score", "levels.json"), "w"), indent=1)
print(json.dumps(rep, indent=1))

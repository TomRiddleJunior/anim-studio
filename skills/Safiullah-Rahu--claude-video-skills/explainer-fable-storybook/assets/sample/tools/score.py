"""Sound for "The Fox at the Door" (fable-storybook format). Everything but the narration is synthesized here (numpy).

stems
  voice  vo/audio/vo.wav (Kokoro bm_george), a touch of room, look-ahead limited per stem
  music  an original storybook bed at 80 BPM in F major (the source measured 79.5 BPM, F major): a music-box arpeggio in
         triplets over a soft pad and a round bass; the sections follow the story (theme, a held D-minor under the bolted
         door, the theme again, a darker minor turn for the key, a lighter plucked texture for the lesson, a thinner bed
         for the explanation, the theme again for the question, ending on C so the loop back to the opening F resolves)
  sfx    label pops, speech-bubble pops, the bolt, clucks and a flutter of panic, the door creak, night dips, chalk on
         each tally, the feather, the egg, whispers, the time-lapse whoosh, the scribble, the banner, the door swinging
         wide, the photo-card whoosh, the title hit, window-sign pops, the stamp, the billboard, the grid pops, the badge,
         the asks sliding in, the target ping, the card flying back, footsteps at the start.
masters: score/final.wav (voice + music + sfx) and score/final_nomusic.wav (voice + sfx), each -14 LUFS, TP <= -2 dBTP;
the music and sfx are ducked under the voice (voice >= 10 dB over the rest); assets/audio/final.m4a; score/levels.json.
usage: python -X utf8 -I tools/score.py            (FFMPEG env var or ffmpeg on PATH)
"""
import json
import os
import re
import subprocess

import numpy as np
from scipy.io import wavfile
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = os.environ.get("FFMPEG", "ffmpeg")
SR = 48000
VO = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
DUR = VO["duration"]
N = int(round(DUR * SR))
LINES = {l["id"]: l for l in VO["lines"]}


def norm(s):
    return re.sub(r"[^a-z0-9']", "", s.lower())


def w(lid, word, k=0):
    hits = [x for x in LINES[lid]["words"] if norm(x["w"]).startswith(norm(word))]
    return hits[min(k, len(hits) - 1)]["start"]


def L(lid):
    return LINES[lid]


# the film's clock (mirrors assets/lib/film.js)
T = dict(zin=L("bolt")["start"] - 0.5, bolted=w("bolt", "bolted"), ask=L("ask")["start"], onePaw=w("ask", "one"), sign=L("ask")["end"] + 0.12,
         yes=L("yes")["start"], saidYes=w("yes", "yes"), more=L("more")["start"], night2=w("more", "next"), feather=w("more", "feather"),
         night3=w("more", "then"), egg=w("more", "egg"), little=L("little")["start"], whisper=w("little", "whispered"),
         weeks=L("weeks")["start"] - 0.08, keyL=L("key")["start"], key=w("key", "key"), nice=L("nice")["start"], thanked=w("nice", "thanked"),
         habit=L("habit")["start"], saying=w("habit", "saying"), fable=L("fable")["start"], pattern=w("fable", "pattern"), foot=w("fable", "foot"),
         study=L("study")["start"], tiny=w("study", "tiny"), big=L("big")["start"], huge=w("big", "huge"), res1=L("res1")["start"],
         seventy=w("res1", "seventy"), res2=L("res2")["start"], seventeen=w("res2", "seventeen"), why=L("why")["start"], small=w("why", "small"),
         see=w("why", "see"), next=L("next")["start"], never=w("next", "never"), q=L("q")["start"], qEnd=L("q")["end"])
T["zout1"] = T["weeks"] + 0.05
T["zin2"] = T["keyL"] - 0.42
T["zout2"] = T["fable"] - 0.12
T["shrink"] = T["fable"] + 0.45
T["navy"] = T["fable"] + 1.35
T["cardIn"] = T["q"] - 0.45
T["zout3"] = T["qEnd"] + 0.15


# ---------------------------------------------------------------- helpers
def tt(d):
    return np.arange(max(1, int(d * SR))) / SR


def lp(x, f, o=2):
    return sosfilt(butter(o, min(f, SR / 2 - 100) / (SR / 2), btype="low", output="sos"), x, axis=0)


def hp(x, f, o=2):
    return sosfilt(butter(o, f / (SR / 2), btype="high", output="sos"), x, axis=0)


def bp(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], btype="band", output="sos"), x, axis=0)


def noise(n, seed=0):
    return np.random.default_rng(seed).standard_normal(n)


def ex(n, tau):
    return np.exp(-np.arange(n) / SR / tau)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def place(bus, x, t, g=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= len(bus) or g == 0:
        return
    if i < 0:
        x = x[-i:]
        i = 0
    x = x[: len(bus) - i]
    l, r = np.cos((pan + 1) * np.pi / 4) * 1.4142, np.sin((pan + 1) * np.pi / 4) * 1.4142
    bus[i:i + len(x), 0] += x * g * l
    bus[i:i + len(x), 1] += x * g * r


def reverb(x, rt=1.4, wet=0.25, seed=3, lpf=5000):
    n = int(rt * SR)
    ir = np.random.default_rng(seed).standard_normal((n, 2)) * np.exp(-6.9 * np.arange(n) / n)[:, None]
    ir = lp(ir, lpf)
    ir /= np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True)) + 1e-9
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)
    return x * (1 - wet) + y * wet


def nrm(x):
    return x / (np.abs(x).max() + 1e-9)


# ---------------------------------------------------------------- sfx kit
def pop(f0=700, d=0.09, seed=1):
    t = tt(d)
    x = np.sin(2 * np.pi * np.cumsum(np.geomspace(f0, f0 * 1.6, len(t))) / SR) * ex(len(t), 0.025)
    return nrm(x + 0.3 * bp(noise(len(t), seed), 2000, 6000) * ex(len(t), 0.004))


def whoosh(d=0.5, lo=300, hi=3000, seed=2):
    t = tt(d)
    x = noise(len(t), seed)
    fc = np.geomspace(lo, hi, len(t))
    y = np.zeros_like(x)
    for k in range(0, len(t), 2400):          # stepwise band sweep
        f = fc[min(k + 1200, len(t) - 1)]
        seg = bp(x[max(0, k - 2400):k + 2400], f * 0.6, min(f * 1.6, 20000))
        y[k:k + 2400] = seg[min(k, 2400):min(k, 2400) + len(y[k:k + 2400])]
    return nrm(y * np.sin(np.pi * t / d) ** 1.5)


def thud(f0=90, d=0.35, seed=3, wood=True):
    t = tt(d)
    x = np.sin(2 * np.pi * np.cumsum(np.geomspace(f0 * 1.6, f0, len(t))) / SR) * ex(len(t), 0.06)
    knock = bp(noise(len(t), seed), 300, 1800 if wood else 4000) * ex(len(t), 0.02)
    return nrm(x + 0.7 * knock)


def cluck(seed, f0=None):
    r = np.random.default_rng(seed)
    f0 = f0 or 520 + 260 * r.random()
    d = 0.11 + 0.05 * r.random()
    t = tt(d)
    f = f0 * (1 + 0.5 * np.exp(-t / 0.02)) * (1 - 0.25 * t / d)
    src = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.6 + 0.4 * np.sin(2 * np.pi * np.cumsum(f) / SR)
    y = bp(src, 900, 2600) + 0.5 * bp(src, 2600, 4200)
    return nrm(y * np.sin(np.pi * t / d) ** 0.6)


def flutter(d=0.6, seed=4):
    t = tt(d)
    x = bp(noise(len(t), seed), 400, 3000) * (0.5 + 0.5 * np.sin(2 * np.pi * 17 * t)) ** 2
    return nrm(x * np.sin(np.pi * t / d))


def creak(d=0.7, f0=140, f1=210, seed=5):
    t = tt(d)
    f = np.geomspace(f0, f1, len(t))
    ph = np.cumsum(f) / SR
    x = (np.mod(ph, 1.0) < 0.15).astype(float) * (0.6 + 0.4 * np.sin(2 * np.pi * 23 * t)) + 0.1 * noise(len(t), seed)
    y = sum(g * bp(x, fc * 0.9, fc * 1.1) for fc, g in [(f0 * 3.2, 1), (f0 * 5.6, 0.6), (1400, 0.3)])
    return nrm(y * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.1))


def chalk(d=0.22, seed=6):
    t = tt(d)
    x = bp(noise(len(t), seed), 2200, 6500) * (0.4 + 0.6 * (np.sin(2 * np.pi * 70 * t) > 0))
    return nrm(x * np.sin(np.pi * t / d) ** 0.7)


def scribble(d=0.55, seed=7):
    t = tt(d)
    x = bp(noise(len(t), seed), 1500, 5000) * (0.3 + 0.7 * np.abs(np.sin(2 * np.pi * 7.5 * t)))
    return nrm(x * np.minimum(1, t / 0.03) * np.minimum(1, (d - t) / 0.05))


def ding(f=1320, d=1.2):
    t = tt(d)
    return nrm(sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / tau) for m, a, tau in [(1, 1, 0.5), (2.76, 0.4, 0.2), (5.4, 0.2, 0.08)]))


def whum(d=0.45):
    t = tt(d)
    return nrm(np.sin(2 * np.pi * 70 * t) * np.sin(np.pi * t / d) ** 2 + 0.3 * lp(noise(len(t), 9), 300) * np.sin(np.pi * t / d))


def step(seed):
    d = 0.08
    t = tt(d)
    return nrm(lp(noise(len(t), seed), 900) * ex(len(t), 0.015) + 0.5 * np.sin(2 * np.pi * 110 * t) * ex(len(t), 0.02))


def build_sfx():
    b = np.zeros((N, 2))
    # labels (pop in with a soft paper whoosh) — times mirror film.js labelFor()
    for t0 in [T["zin"] + 0.45, T["yes"] + 0.1, T["more"] + 0.05, T["weeks"], T["zin2"] + 0.35, T["habit"] + 0.1, T["study"] + 0.05, T["big"], T["why"] + 0.05 + (T["small"] - T["why"]) - 0.15, T["next"] + 0.1, T["cardIn"] + 0.25]:
        place(b, whoosh(0.22, 800, 4000, int(t0 * 100)), t0 - 0.05, 0.10, 0.2)
        place(b, pop(820, 0.08, int(t0 * 10)), t0 + 0.05, 0.18, 0.2)
    # hook: soft paw steps on grass, an evening breeze
    for k in range(7):
        place(b, step(20 + k), 0.12 + k * 0.33, 0.10, 0.45)
    breeze = lp(noise(int(T["zin"] * SR) + SR, 11), 700) * 0.5
    breeze *= np.minimum(1, np.arange(len(breeze)) / SR / 0.4) * np.clip((len(breeze) / SR - np.arange(len(breeze)) / SR) / 0.6, 0, 1)
    place(b, nrm(breeze), 0.0, 0.05, 0)
    # into the coop: a whoosh; the bolt drops; panic
    place(b, whoosh(0.5, 200, 1800, 3), T["zin"], 0.16, 0)
    place(b, thud(80, 0.4, 13), T["bolted"] - 0.02, 0.5, 0.35)
    for k in range(9):
        place(b, cluck(40 + k), T["bolted"] + 0.05 + k * 0.17 + 0.05 * np.sin(k), 0.13, -0.5 + 0.12 * k)
    place(b, flutter(0.8, 41), T["bolted"] + 0.1, 0.14, -0.2)
    # the ask: a bubble pop; the bubble becomes the sign
    place(b, pop(640, 0.1, 50), T["onePaw"] - 0.03, 0.22, 0.35)
    place(b, thud(160, 0.25, 51), T["sign"], 0.22, 0.25)
    # yes: the bolt lifts, the door creaks open a crack, the paw slides in; day 1 tally
    place(b, thud(120, 0.25, 52), T["saidYes"] - 0.35, 0.18, 0.4)
    place(b, creak(0.6, 150, 220, 53), T["saidYes"] - 0.05, 0.22, 0.45)
    place(b, chalk(0.22, 54), T["saidYes"] + 0.3, 0.16, -0.4)
    # nights: dips, chalk, the asks, the feather and the egg
    for tn, s in [(T["night2"], 60), (T["night3"], 61)]:
        place(b, whum(0.45), tn - 0.22, 0.2, 0)
        place(b, chalk(0.2, s), tn + 0.05, 0.16, -0.4)
        place(b, pop(600, 0.1, s), tn + 0.1, 0.16, 0.35)
    place(b, whoosh(0.9, 1200, 4000, 62), T["feather"] - 0.2, 0.08, 0.2)
    for k in range(5):
        place(b, thud(300 + 40 * k, 0.12, 63 + k), T["egg"] - 0.2 + k * 0.17, 0.06, 0.3)
    # whispers: three bubble pops and breathy "whisper" noise
    for k, dt in enumerate([0, 0.38, 0.76]):
        place(b, pop(900 + 80 * k, 0.07, 70 + k), T["whisper"] + dt, 0.14, -0.3 + 0.2 * k)
        place(b, nrm(bp(noise(int(0.35 * SR), 75 + k), 2500, 7000) * np.sin(np.pi * tt(0.35) / 0.35)), T["whisper"] + dt + 0.05, 0.035, -0.3)
    # weeks: whoosh out, the time-lapse (a filtered rush), whoosh back in
    place(b, whoosh(0.6, 2500, 300, 80), T["zout1"], 0.16, 0)
    rush = nrm(bp(noise(int((T["zin2"] - T["zout1"]) * SR), 81), 500, 3000)) * np.sin(np.pi * tt(T["zin2"] - T["zout1"]) / (T["zin2"] - T["zout1"]))
    place(b, rush, T["zout1"] + 0.1, 0.07, 0)
    place(b, whoosh(0.5, 300, 2500, 82), T["zin2"], 0.15, 0)
    for k in range(6):
        place(b, chalk(0.08, 83 + k), T["zin2"] + 0.4 + k * 0.06, 0.07, -0.4)
    # the key: the ask, the scribble across the sign, worried clucks
    place(b, pop(560, 0.12, 90), T["key"] - 0.08, 0.2, 0.35)
    place(b, scribble(0.55, 91), T["key"] + 0.05, 0.2, 0.2)
    for k in range(3):
        place(b, cluck(92 + k, 430), T["key"] + 0.7 + k * 0.25, 0.08, -0.4)
    # thanks: the banner pops up in a beam, a little ding; the key slides out
    place(b, ding(1568, 1.0), T["thanked"], 0.08, 0)
    place(b, pop(760, 0.1, 93), T["thanked"] + 0.02, 0.18, -0.3)
    place(b, whoosh(0.7, 900, 2500, 94), T["thanked"] + 0.9, 0.06, 0.3)
    # habit: the door swings wide (long creak), soft yes pops one after another
    place(b, creak(1.1, 110, 170, 95), T["habit"] - 0.1, 0.3, 0.45)
    for k in range(5):
        place(b, pop(700 + 60 * k, 0.07, 96 + k), T["saying"] + 0.12 + k * 0.22, 0.12, -0.5 + 0.2 * k)
    # the fable: out to the night, the photo card, the title
    place(b, whoosh(0.6, 2500, 300, 100), T["zout2"], 0.15, 0)
    place(b, whoosh(0.7, 400, 1500, 101), T["shrink"], 0.16, 0)
    place(b, thud(220, 0.2, 102, wood=False), T["shrink"] + 0.55, 0.12, 0)
    place(b, whoosh(0.5, 300, 900, 103), T["navy"] - 0.2, 0.12, 0)
    place(b, thud(70, 0.5, 104), T["foot"], 0.3, 0)
    place(b, ding(988, 1.4), T["foot"] + 0.02, 0.07, 0)
    # the study: houses pop in, tiny signs pop, the dark card, the stamp, the billboard
    for i in range(6):
        place(b, pop(500 + 40 * i, 0.07, 110 + i), T["study"] + 0.05 + i * 0.07, 0.07, -0.6 + 0.24 * i)
        place(b, pop(1200 + 60 * i, 0.06, 120 + i), T["tiny"] + 0.12 * i, 0.1, -0.6 + 0.24 * i)
    place(b, thud(60, 0.6, 130), T["huge"], 0.45, 0)
    place(b, nrm(bp(noise(int(0.15 * SR), 131), 800, 5000) * ex(int(0.15 * SR), 0.03)), T["huge"], 0.25, 0.1)
    # results: billboards pop on the grid (19 then 4), the percentage ticks
    sel = 19
    for k in range(sel):
        place(b, pop(900 + 25 * k, 0.05, 140 + k), T["seventy"] - 0.1 + k * 0.075, 0.07, -0.5 + k * 0.05)
    for k in range(4):
        place(b, pop(700 + 40 * k, 0.06, 170 + k), T["seventeen"] - 0.05 + k * 0.16, 0.09, -0.3 + 0.2 * k)
    place(b, pop(640, 0.09, 175), T["res1"], 0.12, 0)
    place(b, pop(560, 0.09, 176), T["res2"], 0.12, 0)
    # why / next: badge ding, tag flip, the asks slide in, the target ping
    place(b, ding(1760, 0.9), T["small"] + 0.4, 0.08, 0)
    place(b, pop(900, 0.08, 180), T["see"] + 0.1, 0.12, 0)
    for i in range(4):
        place(b, whoosh(0.4, 500, 2000, 181 + i), T["next"] + 0.25 + i * 0.32, 0.07, 0.5)
        place(b, thud(140 - 15 * i, 0.15, 185 + i), T["next"] + 0.62 + i * 0.32, 0.12, 0.3)
    place(b, ding(2093, 0.8), T["never"] + 0.6, 0.07, 0.4)
    # the question: the card flies back in, into the coop; out to the dusk
    place(b, whoosh(0.6, 300, 1600, 190), T["cardIn"], 0.16, 0)
    place(b, whoosh(0.6, 2200, 300, 191), T["zout3"], 0.13, 0)
    # interior room tone (soft) under the coop scenes
    room = nrm(lp(noise(N, 199), 400)) * 0.5
    mask = np.zeros(N)
    for a_, b_ in [(T["zin"], T["zout1"] + 0.3), (T["zin2"], T["zout2"] + 0.3), (T["cardIn"], T["zout3"] + 0.4)]:
        mask[int(a_ * SR):int(b_ * SR)] = 1
    mask = uniform_filter1d(mask, int(0.3 * SR))
    b[:, 0] += room * mask * 0.025
    b[:, 1] += np.roll(room, 2000) * mask * 0.025
    return reverb(b, 1.0, 0.16, 7)


# ---------------------------------------------------------------- music
BPM = 80
BEAT = 60 / BPM
BAR = 4 * BEAT
CH = {  # chord tones (midi) for the arpeggio, root for the bass
    "F": ([65, 69, 72, 77], 41), "C/E": ([64, 67, 72, 76], 40), "Dm": ([62, 65, 69, 74], 38), "Bb": ([62, 65, 70, 74], 34),
    "Gm": ([62, 67, 70, 74], 43), "A": ([61, 64, 69, 73], 45), "C": ([60, 64, 67, 72], 36), "Csus": ([60, 65, 67, 72], 36),
}


def section(t):
    if t < T["bolted"] - 0.2:
        return "theme"
    if t < T["yes"]:
        return "shut"
    if t < T["keyL"] - 0.5:
        return "theme"
    if t < T["fable"] - 0.1:
        return "dark"
    if t < T["res1"]:
        return "lesson"
    if t < T["why"]:
        return "build"
    if t < T["q"] - 0.4:
        return "think"
    return "end"


PROG = {"theme": ["F", "C/E", "Dm", "Bb"], "shut": ["Dm", "Dm", "Bb", "A"], "dark": ["Dm", "Bb", "Gm", "A"],
        "lesson": ["Bb", "F", "C", "Dm"], "build": ["Bb", "F", "C", "Dm"], "think": ["Bb", "F", "Gm", "C"], "end": ["F", "Bb", "Csus", "C"]}


def musicbox(f, d=1.6):
    t = tt(d)
    x = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / tau) for m, a, tau in [(1, 1, 0.9), (2, 0.25, 0.4), (3.01, 0.12, 0.2), (5.9, 0.05, 0.06)])
    return x * np.minimum(1, t / 0.003)


def pluck(f, d=0.5):
    t = tt(d)
    x = sum((1 / k) * np.sin(2 * np.pi * f * k * t) * np.exp(-t / (0.18 / k ** 0.5)) for k in range(1, 7))
    return nrm(x) * np.minimum(1, t / 0.002)


def padv(notes, d):
    t = tt(d)
    x = np.zeros_like(t)
    for m in notes:
        f = mtof(m)
        for det in (-0.003, 0.003):
            for k in range(1, 6):
                x += (0.55 ** (k - 1)) / k * np.sin(2 * np.pi * f * (1 + det) * k * t)
    x = lp(x, 1600)
    a = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.6)
    return nrm(x) * a


def bassv(m, d):
    t = tt(d)
    f = mtof(m)
    return nrm(np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t / 0.8) * np.minimum(1, t / 0.01)


def build_music():
    b = np.zeros((N, 2))
    nbar = int(np.ceil(DUR / BAR)) + 1
    r = np.random.default_rng(3)
    for bi in range(nbar):
        t0 = bi * BAR
        if t0 >= DUR:
            break
        sec = section(t0 + 0.01)
        name = PROG[sec][bi % 4]
        if sec == "end" and t0 + BAR >= DUR - 0.01:
            name = "C"
        tones, root = CH[name]
        dark = sec in ("shut", "dark")
        # pad (one per bar, overlapping)
        g_pad = {"theme": 0.16, "shut": 0.2, "dark": 0.18, "lesson": 0.11, "build": 0.12, "think": 0.15, "end": 0.15}[sec]
        place(b, padv([root + 12, tones[0] - 12, tones[1] - 12, tones[2] - 12], BAR + 0.8), t0 - 0.2, g_pad, 0)
        # bass on beats 1 and 3
        g_b = {"theme": 0.22, "shut": 0.16, "dark": 0.2, "lesson": 0.16, "build": 0.25, "think": 0.12, "end": 0.18}[sec]
        for bt in (0, 2):
            place(b, bassv(root, BEAT * 2), t0 + bt * BEAT, g_b, 0)
        if sec == "build":
            for bt in (1, 3):
                place(b, bassv(root, BEAT), t0 + bt * BEAT, g_b * 0.6, 0)
        # arpeggio in triplets (12 per bar)
        dens = {"theme": 1.0, "shut": 0.25, "dark": 0.6, "lesson": 1.0, "build": 1.0, "think": 0.4, "end": 0.75}[sec]
        pat = [0, 1, 2, 3, 2, 1, 0, 2, 3, 2, 1, 2]
        for k in range(12):
            tk = t0 + k * BEAT / 3
            if tk >= DUR - 0.3:
                break
            if r.random() > dens and k % 3:
                continue
            m = tones[pat[k]] + (12 if sec in ("lesson", "build") and k % 6 == 3 else 0)
            if sec in ("lesson", "build"):
                place(b, pluck(mtof(m), 0.5), tk, 0.075 if k % 3 else 0.095, -0.3 + 0.6 * (k % 2))
            else:
                place(b, musicbox(mtof(m + (0 if not dark else 0)), 1.4), tk, 0.06 if k % 3 else 0.08, -0.35 + 0.7 * ((k * 5) % 7) / 6)
    b = reverb(b, 2.0, 0.32, 9, 6000)
    fade = np.clip((DUR - np.arange(N) / SR) / 1.2, 0, 1)
    b *= fade[:, None] ** 0.7
    b *= np.clip(np.arange(N) / SR / 0.05, 0, 1)[:, None]
    return b


# ---------------------------------------------------------------- voice
def build_voice():
    sr, v = wavfile.read(os.path.join(ROOT, "vo", "audio", "vo.wav"))
    v = v.astype(np.float64)
    if v.ndim > 1:
        v = v.mean(1)
    if sr != SR:
        v = resample_poly(v, SR, sr)
    v = v[:N] if len(v) >= N else np.concatenate([v, np.zeros(N - len(v))])
    v = hp(v, 70)
    st = np.stack([v, v], 1)
    st = reverb(st, 0.6, 0.08, 21, 4000)
    return st


# ---------------------------------------------------------------- mastering
def measure(path):
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    s = r.stderr[r.stderr.rindex("Summary:"):]
    return float(re.search(r"I:\s+(-?[\d.]+) LUFS", s).group(1)), float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", s).group(1))


def limiter(x, ceiling_db=-2.0, look=0.004, rel=0.08):
    c = 10 ** (ceiling_db / 20)
    up = np.abs(resample_poly(x, 4, 1, axis=0)).max(axis=1)
    pk = up.reshape(-1, 4).max(axis=1)[: len(x)]
    if len(pk) < len(x):
        pk = np.concatenate([pk, np.zeros(len(x) - len(pk))])
    need = np.minimum(1.0, c / np.maximum(pk, 1e-9))
    g = minimum_filter1d(need, size=2 * int(look * SR) + 1)
    a = np.exp(-1 / (rel * SR))
    out = np.empty_like(g)
    cur = 1.0
    for i in range(len(g)):
        cur = g[i] if g[i] < cur else a * cur + (1 - a) * g[i]
        out[i] = cur
    return x * out[:, None]


def master(x, path, target=-14.0):
    tmp = path + ".probe.wav"
    wavfile.write(tmp, SR, x.astype(np.float32))
    i0, _ = measure(tmp)
    g = 10 ** ((target - i0) / 20)
    for _ in range(4):
        y = limiter(x * g)
        wavfile.write(tmp, SR, y.astype(np.float32))
        i1, tp1 = measure(tmp)
        if abs(i1 - target) < 0.2:
            break
        g *= 10 ** ((target - i1) / 20)
    os.replace(tmp, path)
    return {"lufs": i1, "tp_dbtp": tp1, "gain_db": round(20 * np.log10(g), 2)}


def main():
    os.makedirs(os.path.join(ROOT, "score"), exist_ok=True)
    voice, music, sfx = build_voice(), build_music(), build_sfx()
    # voice-first gain staging: speech RMS -> -20 dBFS; music bed ~ -36, sfx peaks well under the voice
    env = uniform_filter1d(np.abs(voice[:, 0]), int(0.05 * SR))
    act = env > env.max() * 0.08
    vr = np.sqrt(np.mean(voice[act, 0] ** 2))
    voice *= 10 ** (-20 / 20) / vr
    mr = np.sqrt(np.mean(music[:, 0] ** 2))
    music *= 10 ** (-31 / 20) / mr
    sr_ = np.sqrt(np.mean(sfx[:, 0] ** 2))
    sfx *= 10 ** (-38 / 20) / sr_
    duck = 1 - 0.45 * uniform_filter1d(act.astype(float), int(0.25 * SR))          # ~ -5 dB under speech
    music *= duck[:, None]
    sfx *= (1 - 0.3 * uniform_filter1d(act.astype(float), int(0.2 * SR)))[:, None]
    full, nom = voice + music + sfx, voice + sfx
    rep = {"full": master(full, os.path.join(ROOT, "score", "final.wav")), "nomusic": master(nom, os.path.join(ROOT, "score", "final_nomusic.wav"))}
    rest = (music + sfx)[act, 0]
    rep["voice_over_rest_db"] = round(20 * np.log10(np.sqrt(np.mean(voice[act, 0] ** 2)) / (np.sqrt(np.mean(rest ** 2)) + 1e-12)), 1)
    rep["voice_over_music_db"] = round(20 * np.log10(np.sqrt(np.mean(voice[act, 0] ** 2)) / (np.sqrt(np.mean(music[act, 0] ** 2)) + 1e-12)), 1)
    rep["bpm"] = BPM
    rep["key"] = "F major (ends on C, loops to F)"
    for k, v in (("voice", voice), ("music", music), ("sfx", sfx)):
        wavfile.write(os.path.join(ROOT, "score", f"stem_{k}.wav"), SR, v.astype(np.float32))
    json.dump(rep, open(os.path.join(ROOT, "score", "levels.json"), "w"), indent=1)
    subprocess.run([FF, "-y", "-hide_banner", "-v", "error", "-i", os.path.join(ROOT, "score", "final.wav"), "-c:a", "aac", "-b:a", "256k", os.path.join(ROOT, "assets", "audio", "final.m4a")], check=True)
    print(json.dumps(rep, indent=1))


if __name__ == "__main__":
    main()

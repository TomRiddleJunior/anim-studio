"""Endure soundtrack, fully synthesized: an original 103.4 BPM phonk-style beat cut to the card edit (pitched 808 slides
on the 8ths, an FM cowbell riff, kick, clap, 16th hats) + SFX on every visual event. No voice.
  0 - 4 beats    intro: cowbell riff + 808 slides, no drums (the white card builds word by word)
  4 - 8 beats    break on the pink flash: 808 out, a rising bell arpeggio + noise riser + snare roll into the drop
  8 - 22.5 beats DROP on the page pop-in: full beat
  22.5 -> end    the beat stops on the sketch card; one long 808 + the riff's reverb tail, fading out
  sfx            word ticks, flash fwoop, pillow pops, highlighter squeak, ladder ticks, whooshes on the whips,
                 a paper slap on the hard cut, spray bursts per stencil word, chalk scratch while the sketch draws
  out            score/audio/{full,nomusic,stem_*}.wav, assets/audio/final.m4a, assets/audio/nomusic.m4a, score/levels.json
usage: ~/.generative-music-video/venv/Scripts/python.exe -X utf8 -I tools/sound_design.py
"""
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audiolib import SR, bp, delay, env, hp, lp, master, mtof, noise, place, reverb, rms_db, to_m4a, tt  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# optional: a variant config + output project (the IG-audio cut): sound_design.py <cfg.json> <variant_project_dir>
VARIANT = sys.argv[1:3] if len(sys.argv) > 2 else None
cfg = json.load(open(VARIANT[0] if VARIANT else os.path.join(ROOT, "film.json"), encoding="utf-8"))
DUR, BPM = cfg["dur"], cfg["bpm"]
B = 60 / BPM
b0 = cfg.get("beat0", 0.0)
N = int(DUR * SR)
t_ = np.arange(N) / SR


def bt(k):
    return b0 + k * B


T = dict(w1=bt(1), w2=bt(2), pink=bt(4), page=bt(8), boulder=bt(11), titan=bt(14), whip=bt(17), wall=bt(18), s1=bt(18), s2=bt(19), s3=bt(20),
         s4=bt(21), sketch=bt(22.5))
T.update(cfg.get("times", {}))


def stereo():
    return np.zeros((N, 2))


# ============================================================================ instruments
def s808(m, d=0.29, glide=12, gt=0.07, amp=1.0):
    x = tt(d)
    f1 = mtof(m)
    f = f1 * 2 ** (glide / 12 * np.exp(-x / gt))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR)
    s = np.tanh(2.2 * s) * 0.8
    e = env(len(x), a=0.003, d=d * 0.6, s=0.55, r=0.03)
    return s * e * amp


def kick():
    x = tt(0.3)
    return (np.sin(2 * np.pi * np.cumsum(np.geomspace(180, 48, len(x))) / SR) * np.exp(-x * 14) + 0.3 * noise(len(x), 3) * np.exp(-x * 160)) * 0.95


def clap():
    x = tt(0.25)
    n = bp(noise(len(x), 11), 900, 6000)
    e = np.zeros(len(x))
    for o in (0.0, 0.011, 0.022):
        i = int(o * SR)
        e[i:] += np.exp(-(x[: len(x) - i]) * 32)
    return n * e * 0.45


def hat(v=1.0, open_=False):
    x = tt(0.16 if open_ else 0.045)
    return hp(noise(len(x), 21), 7500) * np.exp(-x * (22 if open_ else 120)) * 0.3 * v


def cowbell(m, d=0.22):
    """FM-ish cowbell: two detuned square-ish partials, band-passed, fast decay (pitched to the riff note)"""
    x = tt(d)
    f = mtof(m)
    sq = np.sign(np.sin(2 * np.pi * f * x)) * 0.5 + np.sign(np.sin(2 * np.pi * f * 1.48 * x)) * 0.4
    return bp(sq, 400, 4200) * np.exp(-x * 13) * 0.5


def bell(m, d=0.5):
    x = tt(d)
    f = mtof(m)
    return (np.sin(2 * np.pi * f * x + 1.2 * np.sin(2 * np.pi * f * 3.5 * x) * np.exp(-x * 9)) * np.exp(-x * 5)) * 0.4


# riff (16 eighths = 2 bars), MIDI notes; None = rest. E minor, original.
RIFF = [76, None, 79, 76, 81, None, 79, 76, 74, None, 76, 79, 76, None, 71, 74]
BASS = [40, 40, 40, 43, 40, 40, 38, 38, 36, 36, 36, 38, 40, 40, 43, 45]          # 808 roots per eighth (E2.. with moves)

music = stereo()
drums = stereo()
cb = stereo()
bass = stereo()
E8 = B / 2
n8 = int(DUR / E8) + 2
for k in range(n8):
    te = bt(k * 0.5)
    if te >= DUR:
        break
    beat = k / 2
    sec = "intro" if te < T["pink"] - 0.01 else ("break" if te < T["page"] - 0.01 else ("drop" if te < T["sketch"] - 0.01 else "out"))
    r = RIFF[k % 16]
    if sec in ("intro", "drop") and r is not None:
        place(cb, cowbell(r), te, 0.9 if sec == "drop" else 0.75, 0.15 if k % 2 else -0.15)
    if sec in ("intro", "drop"):
        place(bass, s808(BASS[k % 16] - 12, E8 * 0.98, glide=10 if k % 2 == 0 else 5, amp=0.85 if sec == "intro" else 1.0), te)
    if sec == "drop":
        if k % 4 == 0:
            place(drums, kick(), te)
        if k % 8 == 6:
            place(drums, kick() * 0.7, te + E8 * 0.5)
        if k % 4 == 2:
            place(drums, clap(), te, 1.0, 0.05)
        for h in (0, 0.5):
            place(drums, hat(1.0 if h == 0 else 0.6, open_=(k % 8 == 7 and h == 0.5)), te + h * E8, 1.0, -0.25)
# the break: rising bell arpeggio (accelerating) + snare roll + noise riser into the drop
ARP = [64, 67, 71, 76, 79, 83, 88]
tb = T["pink"]
k = 0
while tb < T["page"] - 0.05:
    frac = (tb - T["pink"]) / (T["page"] - T["pink"])
    place(cb, bell(ARP[k % len(ARP)] + 12 * (k // len(ARP) % 2), 0.4), tb, 0.5 + 0.4 * frac, 0.3 if k % 2 else -0.3)
    step = E8 if frac < 0.5 else (E8 / 2 if frac < 0.85 else E8 / 4)
    if frac > 0.25:
        place(drums, clap() * (0.25 + 0.6 * frac), tb, 1.0, 0.0)
    tb += step
    k += 1
x = tt(T["page"] - T["pink"])
riser = bp(noise(len(x), 77), 800, 9000) * (x / x[-1]) ** 2.5 * 0.35
place(music, riser, T["pink"])
# a pad under the break (sustained E minor)
for m in (52, 55, 59, 64):
    x = tt(T["page"] - T["pink"] + 0.3)
    p = sum(np.sin(2 * np.pi * mtof(m) * kk * x) / kk for kk in range(1, 6)) * env(len(x), 0.4, 0.3, 0.8, 0.3) * 0.05
    place(music, lp(p, 2000), T["pink"])
# the drop hit
x = tt(1.2)
place(music, (np.sin(2 * np.pi * np.cumsum(np.geomspace(120, 38, len(x))) / SR) * np.exp(-x * 3) + bp(noise(len(x), 5), 200, 5000) * np.exp(-x * 9) * 0.4) * 0.9, T["page"])
# the outro: one long 808 + riff tail
place(bass, s808(28, 1.15, glide=12, gt=0.1, amp=1.0) * np.exp(-tt(1.15) * 1.8), T["sketch"])

cb = delay(cb, E8 * 1.5, fb=0.3, mix=0.25)
music += bass * 0.9 + drums * 0.85 + cb * 0.7
music = reverb(music, 1.3, 0.14, seed=4)
# intro slightly filtered and quieter, break builds, drop full, out fades
lvl = np.interp(t_, [0, T["pink"] - 0.02, T["pink"], T["page"] - 0.02, T["page"], T["sketch"] - 0.02, T["sketch"], DUR - 0.25, DUR],
                [0.72, 0.72, 0.7, 0.85, 1.0, 1.0, 0.95, 0.0, 0.0])
music *= lvl[:, None]

# ============================================================================ sfx
sfx = stereo()


def tick(f=2600, d=0.03):
    x = tt(d)
    return (np.sin(2 * np.pi * f * x) * np.exp(-x * 220) + bp(noise(len(x), 8), 2000, 8000) * np.exp(-x * 300) * 0.5) * 0.6


def pop(d=0.14):
    x = tt(d)
    return np.sin(2 * np.pi * np.cumsum(np.geomspace(260, 90, len(x))) / SR) * np.exp(-x * 30) * 0.8 + bp(noise(len(x), 4), 300, 3000) * np.exp(-x * 90) * 0.3


def whoosh(d=0.35, f0=400, f1=4000, seed=1):
    x = tt(d)
    n = noise(len(x), seed)
    out = np.zeros(len(x))
    for i in range(6):
        sl = slice(int(i * len(x) / 6), int((i + 1) * len(x) / 6))
        fc = f0 * (f1 / f0) ** (i / 5)
        out[sl] = bp(n, fc * 0.6, min(fc * 1.6, 20000))[sl]
    return out * np.sin(np.pi * x / d) ** 2 * 0.8


def spray(d=0.22, seed=3):
    x = tt(d)
    return bp(noise(len(x), seed), 3000, 12000) * env(len(x), 0.01, 0.05, 0.8, 0.08) * 0.5


def squeak(d=0.16):
    x = tt(d)
    return bp(noise(len(x), 12), 2500, 5500) * env(len(x), 0.01, 0.03, 0.8, 0.04) * 0.45


def scratch(d, seed=14):
    x = tt(d)
    strokes = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 9 * x))
    return bp(noise(len(x), seed), 2000, 7000) * lp(strokes, 50) * 0.35


place(sfx, tick(), 0.0, 0.5)
place(sfx, tick(), T["w1"], 0.7, 0.2)
place(sfx, tick(), T["w2"], 0.7, -0.2)
place(sfx, whoosh(0.3, 3000, 600, 2), T["pink"] - 0.05, 0.6)
place(sfx, tick(1800, 0.05), T["pink"], 0.8)
for tp in (T["page"] - 0.02, T["wall"] - 0.02, T["sketch"] - 0.02):
    place(sfx, pop(), tp, 1.0)
place(sfx, squeak(), T["page"] + 0.05, 0.6, 0.2)
for kk in range(8):
    place(sfx, tick(3400, 0.02), T["page"] + 0.1 + kk * B / 4, 0.25, 0.3)
place(sfx, whoosh(0.3, 4500, 500, 6), T["boulder"] - 0.12, 1.0, 0.0)
place(sfx, bp(noise(int(0.06 * SR), 9), 500, 4000) * np.exp(-tt(0.06) * 60) * 0.7, T["titan"], 1.0)
place(sfx, whoosh(0.6, 400, 5000, 7), T["whip"], 1.0, -0.5)
for i, ts in enumerate((T["s1"], T["s2"], T["s3"], T["s4"])):
    place(sfx, spray(0.22 if i < 3 else 0.14, 20 + i), ts - 0.02, 0.9 if i < 3 else 0.6, (-0.2, 0.0, 0.2, 0.0)[i])
place(sfx, scratch(0.8), T["sketch"] + 0.02, 0.8, 0.1)
sfx = reverb(sfx, 0.8, 0.12, seed=8)

# levels: SFX peaks ~6 dB under the music's loud windows
w = int(0.1 * SR)


def p99(x):
    m = x.mean(axis=1)
    nw = len(m) // w
    return np.percentile(np.sqrt((m[: nw * w].reshape(nw, w) ** 2).mean(axis=1)), 99.5)


sfx *= p99(music) / (p99(sfx) + 1e-12) * 10 ** (-6 / 20)
if VARIANT:
    # IG-audio cut: our SFX only, quiet (-22 LUFS, TP <= -3): the post's sound comes from the app's "Use audio"
    vdir = VARIANT[1]
    rep = master({"sfx": sfx}, os.path.join(vdir, "score"), target=cfg.get("sfx_lufs", -22.0), music_key="none", ceiling=-3.0)
    os.makedirs(os.path.join(vdir, "assets", "audio"), exist_ok=True)
    to_m4a(os.path.join(vdir, "score", "full.wav"), os.path.join(vdir, "assets", "audio", "final.m4a"))
    json.dump(dict(rep, T={k: round(v, 3) for k, v in T.items()}), open(os.path.join(vdir, "score", "levels.json"), "w"), indent=1)
    print(json.dumps(rep, indent=1), {k: round(v, 3) for k, v in T.items()})
    raise SystemExit(0)
rep = master({"sfx": sfx, "music": music}, os.path.join(ROOT, "score", "audio"))
rep["bpm"] = BPM
os.makedirs(os.path.join(ROOT, "assets", "audio"), exist_ok=True)
to_m4a(os.path.join(ROOT, "score", "audio", "full.wav"), os.path.join(ROOT, "assets", "audio", "final.m4a"))
to_m4a(os.path.join(ROOT, "score", "audio", "nomusic.wav"), os.path.join(ROOT, "assets", "audio", "nomusic.m4a"))
json.dump(rep, open(os.path.join(ROOT, "score", "levels.json"), "w"), indent=1)
print(json.dumps(rep, indent=1))

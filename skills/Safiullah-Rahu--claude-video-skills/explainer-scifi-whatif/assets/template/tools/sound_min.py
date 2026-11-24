"""Minimal sound for the template: a D minor pad + a VCR clunk and rewind whirr on every line whose text is "Rewind."
-> assets/audio/final.m4a and nomusic.m4a, score/levels.json. The sample's tools/sound_design.py is the full version.
usage: <python with numpy/scipy/soundfile> -X utf8 -I tools/sound_min.py"""
import json
import os
import sys

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audiolib import SR, bp, hp, limiter, lp, master, mtof, noise, place, reverb, rms_db, to_m4a, tt  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
FV = open(os.path.join(ROOT, "assets", "lib", "film-vo.js"), encoding="utf-8").read()
DUR = json.loads(FV[FV.index("{"):FV.rindex("}") + 1])["dur"]
N = int(DUR * SR)


def pad(notes, d):
    t = tt(d)
    y = sum(np.sin(2 * np.pi * mtof(m + det) * t) for m in notes for det in (-0.08, 0, 0.07))
    a = min(1.5, d / 3)
    return lp(y, 1500) * np.minimum(1, np.minimum(t / a, (d - t) / a)) / (len(notes) * 3)


def whirr(d):
    t = tt(d)
    ph = 2 * np.pi * np.cumsum(np.linspace(380, 1150, len(t))) / SR
    return bp(np.sign(np.sin(ph)) * 0.2, 300, 3500) * (0.6 + 0.4 * np.sin(2 * np.pi * 23 * t)) * 0.5


def clunk():
    t = tt(0.2)
    return np.sin(2 * np.pi * 70 * t) * np.exp(-t * 28) * 0.8 + hp(noise(len(t), 3), 2500) * np.exp(-t * 120) * 0.5


def main():
    m = np.zeros((N, 2)); s = np.zeros((N, 2))
    for i, ch in enumerate([[50, 57, 62, 65], [46, 53, 58, 62], [41, 53, 57, 60], [48, 55, 60, 64]] * 4):
        place(m, pad(ch, 7.9), i * 6.67, 0.5)
    m = reverb(m, 2.4, 0.35)
    lines = VO["lines"]
    for i, l in enumerate(lines):
        if l["text"].strip().lower().startswith("rewind"):
            a = l["start"] - 0.05
            b = lines[i + 1]["start"] - 0.05 if i + 1 < len(lines) else a + 1.0
            place(s, clunk(), a, 0.55); place(s, whirr(b - a), a + 0.04, 0.5); place(s, clunk(), b, 0.45)
    v, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), dtype="float64")
    v = v.mean(axis=1) if v.ndim > 1 else v
    v = np.concatenate([v, np.zeros(max(0, N - len(v)))])[:N]
    v = limiter(np.stack([hp(v, 70)] * 2, axis=1), -6.0)
    speech = np.zeros(N, bool)
    for l in lines:
        speech[int(l["start"] * SR):int(l["end"] * SR)] = True
    vdb = rms_db(v[speech])
    m *= 10 ** ((vdb - 17 - rms_db(m[speech])) / 20)
    s *= 10 ** ((vdb - 19 - rms_db(s[speech] + 1e-9)) / 20)
    rep = master({"voice": v, "music": m, "sfx": s}, os.path.join(ROOT, "score"), target=-14.0, ceiling=-2.0)
    rep["voice_over_bed_db"] = round(float(vdb - rms_db((m + s)[speech])), 2)
    json.dump(rep, open(os.path.join(ROOT, "score", "levels.json"), "w"), indent=1)
    os.makedirs(os.path.join(ROOT, "assets", "audio"), exist_ok=True)
    to_m4a(os.path.join(ROOT, "score", "full.wav"), os.path.join(ROOT, "assets", "audio", "final.m4a"))
    to_m4a(os.path.join(ROOT, "score", "nomusic.wav"), os.path.join(ROOT, "assets", "audio", "nomusic.m4a"))
    print(rep)


if __name__ == "__main__":
    main()

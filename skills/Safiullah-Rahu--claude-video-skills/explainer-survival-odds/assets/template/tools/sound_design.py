"""Compact soundtrack for the Survival Odds template (the full episode's is assets/sample/tools/sound_design.py):
voice + a storm bed (wind, rain, the swell) + booms on the black beat + the odds ring's identity sounds
(tools/odds_sound.py: the sting on frame 1, ticks, delta pops, the glitch, the landing, the quiet end sting) + a soft
76 BPM pulse (full mix only). Writes score/audio/final.wav (+ assets/audio/final.m4a) and final_nomusic.wav,
score/levels.json. usage: ~/.generative-music-video/venv/Scripts/python.exe -I tools/sound_design.py
"""
import json
import os
import re
import subprocess
import sys

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import odds_sound as OS  # noqa: E402

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import paths  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = paths.ffmpeg()
SR = 48000
RNG = np.random.default_rng(23)
TM = json.load(open(os.path.join(ROOT, "score", "timing.json"), encoding="utf-8"))
VOJ = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
T, DUR = TM["T"], TM["dur"]
N = int(DUR * SR)
t_ = np.arange(N) / SR


def lp(x, f):
    return sosfilt(butter(2, f / (SR / 2), btype="low", output="sos"), x, axis=0)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo / (SR / 2), hi / (SR / 2)], btype="band", output="sos"), x, axis=0)


def place(bus, x, t, g=1.0):
    i = int(t * SR)
    if 0 <= i < len(bus):
        x = x[: len(bus) - i]
        bus[i:i + len(x)] += (x * g)[:, None]


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(np.square(x))) + 1e-12)


gust = 0.5 + 0.3 * np.sin(2 * np.pi * 0.07 * t_) + 0.15 * np.sin(2 * np.pi * 0.23 * t_)
amb = (lp(RNG.standard_normal((N, 2)), 300) * 1.1 + bp(RNG.standard_normal((N, 2)), 300, 1600) * 0.5) * gust[:, None]
amb += bp(RNG.standard_normal((N, 2)), 3000, 9000) * 0.18 + lp(RNG.standard_normal((N, 2)), 200) * (0.5 + 0.4 * np.sin(2 * np.pi * 0.15 * t_))[:, None]
sfx, ring, mus = np.zeros((N, 2)), np.zeros((N, 2)), np.zeros((N, 2))
x = np.arange(int(2.4 * SR)) / SR
boom = np.sin(2 * np.pi * np.cumsum(50 * np.exp(-x * 1.1) + 28) / SR) * np.exp(-x * 1.6)
if "S" in T:
    place(sfx, boom, T["S"] + 0.02)
place(sfx, boom * 0.7, T["Z1"])
for c in TM["cues"]:
    t, ty = c["t"], c["type"]
    if ty == "sting":
        place(ring, OS.sting(SR), t, 0.62)
    elif ty == "sting_end":
        place(ring, OS.sting(SR), t, 0.3)
    elif ty == "odds_tick":
        place(ring, OS.tick(SR, c["up"], c["i"], c["n"]), t, 0.2)
    elif ty in ("odds_up", "odds_down"):
        place(ring, OS.delta(SR, ty == "odds_up"), t, 0.34)
    elif ty == "odds_glitch":
        place(ring, OS.glitch(SR, c["dur"]), t, 0.34)
    elif ty == "odds_land":
        place(ring, OS.land(SR), t, 0.5)
beat = 60 / 76
k = 0.0
while k < DUR - 1:
    x = np.arange(int(0.34 * SR)) / SR
    place(mus, np.sin(2 * np.pi * 73.42 * x) * np.exp(-x * 9), k, 0.6)
    k += beat / 2
mus *= np.interp(t_, [0, DUR - 3, DUR - 0.5, DUR], [1, 1, 0, 0])[:, None]
v, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), always_2d=False)
voc = np.zeros((N, 2))
voc[: min(N, len(v)), 0] = v[:N]
voc[:, 1] = voc[:, 0]
speech = np.zeros(N, bool)
for l in VOJ["lines"]:
    speech[int(l["start"] * SR):int(l["end"] * SR)] = True
vo_db = rms_db(voc[speech, 0])
amb *= 10 ** ((vo_db - 26 - rms_db(amb[speech, 0])) / 20)
mus *= 10 ** ((vo_db - 23 - rms_db(mus[speech, 0])) / 20)
vp = np.percentile(np.abs(voc[:, 0]), 99.9)
for bus in (sfx, ring):
    bus *= vp / (np.percentile(np.abs(bus[:, 0]), 99.95) + 1e-9) * 10 ** (-11 / 20)
fade = np.ones(N)
fade[-int(1.2 * SR):] = np.linspace(1, 0, int(1.2 * SR)) ** 1.6
full, nomu = (voc + amb + sfx + ring + mus) * fade[:, None], (voc + amb + sfx + ring) * fade[:, None]
out = os.path.join(ROOT, "score", "audio")
os.makedirs(out, exist_ok=True)
pk = max(np.abs(full).max(), np.abs(nomu).max())
rep = {"voice_over_rest_db_full": round(vo_db - rms_db(((amb + sfx + ring + mus) * fade[:, None])[speech, 0]), 2),
       "voice_over_rest_db_nomusic": round(vo_db - rms_db(((amb + sfx + ring) * fade[:, None])[speech, 0]), 2)}
for name, x in (("mix_raw", full), ("mix_raw_nomusic", nomu)):
    sf.write(os.path.join(out, name + ".wav"), (x * 0.89 / pk).astype(np.float32), SR, subtype="FLOAT")
for src, dst in (("mix_raw", "final"), ("mix_raw_nomusic", "final_nomusic")):
    s_, d_ = os.path.join(out, src + ".wav"), os.path.join(out, dst + ".wav")
    r = subprocess.run([FF, "-hide_banner", "-i", s_, "-af", "loudnorm=I=-14:TP=-2.0:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    m = json.loads(r.stderr[r.stderr.rindex("{"): r.stderr.rindex("}") + 1])
    af = (f"loudnorm=I=-14:TP=-2.0:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run([FF, "-y", "-hide_banner", "-v", "error", "-i", s_, "-af", af, "-ar", "48000", "-c:a", "pcm_s24le", d_], check=True)
subprocess.run([FF, "-y", "-hide_banner", "-v", "error", "-i", os.path.join(out, "final.wav"), "-c:a", "aac", "-b:a", "256k", os.path.join(ROOT, "assets", "audio", "final.m4a")], check=True)
json.dump(rep, open(os.path.join(ROOT, "score", "levels.json"), "w"), indent=1)
print(json.dumps(rep))

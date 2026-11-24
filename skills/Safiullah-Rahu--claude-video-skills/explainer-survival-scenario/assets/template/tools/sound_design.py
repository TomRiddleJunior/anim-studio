"""Template soundtrack (generic, key-guarded) for a survival-scenario reel, fully synthesized (no samples): voice + a night bed + story SFX.

  bed   wind through pines (gusting band-passed noise; muffled + lower inside the cab), a tension drone whose level
        follows the beat map (calm 0.3 -> radio/valley 0.8 -> cliffhanger 1.0), sparse crickets in calm exteriors
  sfx   boom on the two black beats, riser into the cliffhanger, whooshes on scene changes, heartbeat under the turn,
        radio static + squelch + filtered chatter under the message, typing ticks, UI pops for tags/chips/panels,
        clock ticks, pen ticks for the checklist, distant sirens + engine rumble in the valley, winch ratchet + clank,
        trapdoor thud + bolt slide, lamp-flicker buzz on the doubt beat, end-card hits, then a decay into near silence
  mix   bed RMS = voice RMS - 20 dB under speech; SFX by type relative to the voice; two-pass loudnorm -14 LUFS, TP -1.5
  in    vo/audio/vo.wav, vo/data/vo.json, score/timing.json (tools/build.py)
  out   score/audio/{bed,sfx,vo,mix_raw,final}.wav, assets/audio/final.m4a, score/levels.json

usage: ~/.generative-music-video/venv/Scripts/python.exe -I tools/sound_design.py
"""
import json
import os
import subprocess

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"
SR = 48000
RNG = np.random.default_rng(11)
TM = json.load(open(os.path.join(ROOT, "score", "timing.json"), encoding="utf-8"))
VOJ = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
T, DUR = TM["T"], TM["dur"]
N = int(DUR * SR)
t_ = np.arange(N) / SR
LINES = {l["id"]: l for l in VOJ["lines"]}


def word(lid, w, k=0):
    hits = [x for x in LINES[lid]["words"] if x["w"].lower().strip(".,?!:").startswith(w.lower())]
    return hits[min(k, len(hits) - 1)]["start"]


def bp(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo / (SR / 2), hi / (SR / 2)], btype="band", output="sos"), x, axis=0)


def lp(x, f, o=2):
    return sosfilt(butter(o, f / (SR / 2), btype="low", output="sos"), x, axis=0)


def hp(x, f, o=2):
    return sosfilt(butter(o, f / (SR / 2), btype="high", output="sos"), x, axis=0)


def env_pw(points):
    """piecewise-linear envelope over the whole film from [(t, v), ...]"""
    ts, vs = zip(*points)
    return np.interp(t_, ts, vs)


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(np.square(x))) + 1e-12)


def place(bus, x, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= len(bus) or i + len(x) <= 0:
        return
    x = x[: max(0, len(bus) - i)]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[i:i + len(x), 0] += x * g * l * 1.414
    bus[i:i + len(x), 1] += x * g * r * 1.414


def tt(d):
    return np.arange(int(d * SR)) / SR


def reverb(x, rt=1.6, wet=0.25, seed=3):
    n = int(rt * SR)
    r = np.random.default_rng(seed)
    ir = r.standard_normal((n, 2)) * np.exp(-6.9 * np.arange(n) / n)[:, None]
    ir = lp(ir, 5000)
    ir /= np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True)) + 1e-9
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)
    return x * (1 - wet) + y * wet


# ------------------------------------------------------------------ generic beat map from the shot keys that exist
def tk(k, d=None):
    return T.get(k, d)


INTERIOR = [(T[k], min(v for kk, v in T.items() if v > T[k])) for k in ("C", "E", "M", "O", "P") if k in T and any(v > T[k] for v in T.values())]
inside = np.zeros(N)
for a, b in INTERIOR:
    inside[int(a * SR):int(b * SR)] = 1
inside = lp(inside, 6)
wn = RNG.standard_normal((N, 2))
pink = lp(wn, 900, 1) * 0.6 + lp(wn, 180, 1) * 1.2
wind = bp(pink, 110, 950)
gust = 0.55 + 0.22 * np.sin(2 * np.pi * 0.071 * t_) + 0.16 * np.sin(2 * np.pi * 0.029 * t_ + 1.3)
wind = wind * gust[:, None] + bp(wn, 2200, 6500) * 0.12 * gust[:, None]
wind = wind * (1 - inside)[:, None] + lp(wind, 380) * 0.45 * inside[:, None]
pts = [(0, 0.3)]
for k, lev in (("B", 0.85), ("C", 0.3), ("F", 0.6), ("H", 0.78), ("J", 0.85), ("K", 0.45), ("M", 0.35), ("P", 0.38), ("Q", 1.0), ("R", 0.8), ("S", 0.55)):
    if k in T:
        pts += [(T[k] - 0.05, pts[-1][1]), (T[k] + 0.3, lev)]
pts += [(DUR - 0.4, 0.0), (DUR, 0.0)]
pts.sort()
ten = env_pw(pts)
dr = np.zeros(N)
for f, a in [(55.0, 1.0), (55.35, 0.8), (82.41, 0.55), (110.3, 0.32), (164.8, 0.12), (41.2, 0.5)]:
    dr += a * np.sin(2 * np.pi * f * t_ + RNG.uniform(0, 6))
dr += 0.18 * np.clip(ten - 0.6, 0, 1) * 2.5 * np.sin(2 * np.pi * 233.1 * t_)
drone = lp(dr, 700)[:, None] * np.array([1.0, 0.96]) * ten[:, None]
bed = wind + drone * 0.9

# ------------------------------------------------------------------ SFX library
def boom(d=2.4):
    x = tt(d)
    f = 50 * np.exp(-x * 1.1) + 28
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 1.6)
    s += lp(RNG.standard_normal(len(x)), 180) * np.exp(-x * 7) * 0.8
    return s


def riser(d=1.3):
    x = tt(d)
    n = RNG.standard_normal(len(x))
    out = np.zeros(len(x))
    for i, (lo, hi) in enumerate([(300, 900), (700, 2000), (1500, 4500)]):
        out += bp(n, lo, hi) * np.clip((x / d) * 3 - i, 0, 1)
    return out * (x / d) ** 2


def whoosh(d=0.45):
    x = tt(d)
    n = RNG.standard_normal(len(x))
    e = np.sin(np.pi * x / d) ** 2
    return (bp(n, 300, 1400) * 0.7 + bp(n, 1400, 4000) * 0.3) * e


def thump(f=55, d=0.25):
    x = tt(d)
    return np.sin(2 * np.pi * f * x * (1 - 0.3 * x / d)) * np.exp(-x * 18) + lp(RNG.standard_normal(len(x)), 140) * np.exp(-x * 40) * 0.5


def heartbeat():
    out = np.zeros(int(0.5 * SR))
    a, b = thump(52), thump(48)
    out[: len(a)] += a
    out[int(0.14 * SR): int(0.14 * SR) + len(b)] += b * 0.75
    return out


def static(d=0.55):
    x = tt(d)
    n = bp(RNG.standard_normal(len(x)), 900, 4200)
    cr_ = (RNG.random(len(x)) > 0.9965) * RNG.standard_normal(len(x)) * 6
    return (n + bp(cr_, 600, 5000)) * np.exp(-x * 3) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 23 * x)))


def squelch():
    x = tt(0.18)
    return bp(RNG.standard_normal(len(x)), 1200, 3800) * np.exp(-x * 14)


def chatter(d):
    x = tt(d)
    n = bp(RNG.standard_normal(len(x)), 350, 2800)
    syl = lp((RNG.random(len(x)) > 0.99985).astype(float), 5) * 40
    return n * np.clip(syl, 0, 1) * 0.8 + bp(RNG.standard_normal(len(x)), 1500, 3500) * 0.08


def click(f=3200, d=0.012):
    x = tt(d)
    return bp(RNG.standard_normal(len(x)), f * 0.6, min(f * 1.6, 20000)) * np.exp(-x * 400)


def blip(f0=660, f1=900, d=0.09):
    x = tt(d)
    f = np.linspace(f0, f1, len(x))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 38)


def pop(f0=620, f1=880):
    s = blip(f0, f1)
    c = click(3500)
    s[: len(c)] += c * 0.5
    return s


def paper(d=0.3):
    x = tt(d)
    return bp(RNG.standard_normal(len(x)), 1800, 7000) * np.sin(np.pi * x / d) * (0.7 + 0.3 * np.sin(2 * np.pi * 37 * x))


def pentick():
    a, b = click(5200, 0.01), click(2600, 0.02)
    out = np.zeros(int(0.08 * SR))
    out[: len(a)] += a
    out[int(0.035 * SR): int(0.035 * SR) + len(b)] += b * 0.8
    return out


def woodtick():
    x = tt(0.06)
    s = np.sin(2 * np.pi * 1800 * x) * np.exp(-x * 90) * 0.6
    c = click(2500)
    s[: len(c)] += c * 0.4
    return s


def siren(d):
    x = tt(d)
    f = 820 + 330 * np.sin(2 * np.pi * x / 3.6)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return lp(s, 1500) * np.clip(x / 1.5, 0, 1) * np.clip((d - x) / 1.5, 0, 1)


def rumble(d):
    x = tt(d)
    return lp(RNG.standard_normal(len(x)), 110) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.4 * x)) * np.clip(x / 1.0, 0, 1) * np.clip((d - x) / 1.0, 0, 1)


def ratchet(d):
    x = tt(d)
    out = np.zeros(len(x))
    k = 0.0
    while k < d - 0.02:
        c = click(2400, 0.02)
        i = int(k * SR)
        out[i:i + len(c)] += c * (0.7 + 0.3 * RNG.random())
        k += 0.075
    return out


def clank(d=0.8):
    x = tt(d)
    s = sum(a * np.sin(2 * np.pi * f * x) * np.exp(-x * k) for f, a, k in [(320, 1, 5), (871, 0.6, 7), (1530, 0.4, 9), (2380, 0.25, 12)])
    return s


def thud(d=0.5):
    x = tt(d)
    return np.sin(2 * np.pi * 105 * x) * np.exp(-x * 14) + lp(RNG.standard_normal(len(x)), 300) * np.exp(-x * 25) * 0.8


def scrape(d=0.24):
    x = tt(d)
    return bp(RNG.standard_normal(len(x)), 2000, 5200) * np.sin(np.pi * x / d) * (0.6 + 0.4 * np.sin(2 * np.pi * 61 * x))


def buzz(d=0.14):
    x = tt(d)
    return (np.sign(np.sin(2 * np.pi * 100 * x)) * 0.4 + bp(RNG.standard_normal(len(x)), 800, 4000) * 0.6) * np.sin(np.pi * x / d)


# ------------------------------------------------------------------ SFX placement (generic)
sfx = np.zeros((N, 2))
G = {"boom": 1.0, "riser": 0.35, "whoosh": 0.28, "tag": 0.2, "chip": 0.2, "clock": 0.16, "end": 0.7}
if "B" in T:
    place(sfx, boom(), T["B"] + 0.02, G["boom"])
if "Q" in T:
    place(sfx, riser(), T["Q"] - 1.3, G["riser"])
    place(sfx, boom(3.0), T["Q"] + 0.02, G["boom"])
for k, v in T.items():
    if k not in ("A1", "B", "Q", "R", "S") and v > 0.5:
        place(sfx, whoosh(), v - 0.22, G["whoosh"], RNG.uniform(-0.3, 0.3))
for c in TM["cues"]:
    t, ty = c["t"], c["type"]
    if ty == "tag":
        f0 = {"r": 330, "g": 700, "y": 560}.get(c.get("col", "y"), 560)
        place(sfx, pop(f0, f0 * 1.35), t, G["tag"])
    elif ty == "chip":
        place(sfx, pop(780, 1050), t, G["chip"])
    elif ty == "clock":
        place(sfx, woodtick(), t, G["clock"])
    elif ty == "endcard":
        place(sfx, thump(46, 0.9), t, G["end"])
    elif ty == "endcard2":
        place(sfx, whoosh(0.6), t - 0.3, G["whoosh"])
        place(sfx, thump(40, 1.4), t, G["end"] * 0.8)
sfx = reverb(sfx, 1.2, 0.18)

# ------------------------------------------------------------------ voice + mix
v, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), always_2d=False)
assert sr == SR
v = hp(v, 70)[:N]
voc = np.zeros((N, 2))
voc[: len(v), 0] = v
voc[: len(v), 1] = v
voc = reverb(voc, 0.35, 0.06, seed=9)
speech = np.zeros(N, bool)
for l in VOJ["lines"]:
    speech[int(l["start"] * SR):int(l["end"] * SR)] = True
vo_db = rms_db(voc[speech, 0])
bed_db = rms_db(bed[speech, 0])
g_bed = 10 ** ((vo_db - 20.0 - bed_db) / 20)
bed *= g_bed
# SFX: scale so the loudest 100 ms of the boom sits ~3 dB under the voice peak level
w = int(0.1 * SR)
sm = sfx.mean(axis=1)
nwin = len(sm) // w
loud = np.percentile(np.sqrt((sm[: nwin * w].reshape(nwin, w) ** 2).mean(axis=1)), 99.8)
vp = np.percentile(np.sqrt((voc[: nwin * w, 0].reshape(nwin, w) ** 2).mean(axis=1)), 99.5)
g_sfx = (vp / (loud + 1e-12)) * 10 ** (-3 / 20)
sfx *= g_sfx
# end: the last 1.2 s fades to silence (the source's end card is silent)
fade = np.ones(N)
fl = int(1.2 * SR)
fade[-fl:] = np.linspace(1, 0, fl) ** 1.6
mix = (voc + bed + sfx) * fade[:, None]
peak = np.abs(mix).max() + 1e-9
k = 0.89 / peak
out = os.path.join(ROOT, "score", "audio")
os.makedirs(out, exist_ok=True)
for name, x in (("vo", voc), ("bed", bed), ("sfx", sfx), ("mix_raw", mix)):
    sf.write(os.path.join(out, name + ".wav"), (x * k * (fade[:, None] if name != "mix_raw" else 1)).astype(np.float32), SR, subtype="FLOAT")
# levels: voice vs everything else, under speech
music = (bed + sfx) * fade[:, None]
rep = {"vo_rms_db_speech": round(vo_db, 2), "bed_re_vo_db": round(rms_db(bed[speech, 0]) - vo_db, 2),
       "bed_plus_sfx_re_vo_db": round(rms_db(music[speech, 0]) - vo_db, 2), "sfx_gain_db": round(20 * np.log10(g_sfx), 2)}
target = -14
r = subprocess.run([FF, "-hide_banner", "-i", os.path.join(out, "mix_raw.wav"), "-af", f"loudnorm=I={target}:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                   capture_output=True, text=True, encoding="utf-8", errors="replace")
m = json.loads(r.stderr[r.stderr.rindex("{"): r.stderr.rindex("}") + 1])
af = (f"loudnorm=I={target}:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
      f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
subprocess.run([FF, "-y", "-hide_banner", "-v", "error", "-i", os.path.join(out, "mix_raw.wav"), "-af", af, "-ar", "48000", "-c:a", "pcm_s24le", os.path.join(out, "final.wav")], check=True)
os.makedirs(os.path.join(ROOT, "assets", "audio"), exist_ok=True)
subprocess.run([FF, "-y", "-hide_banner", "-v", "error", "-i", os.path.join(out, "final.wav"), "-c:a", "aac", "-b:a", "256k", os.path.join(ROOT, "assets", "audio", "final.m4a")], check=True)
r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", os.path.join(out, "final.wav"), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
import re
I_ = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
TP_ = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r.stderr)
rep.update({"final_lufs": float(I_[-1]) if I_ else None, "final_true_peak_dbtp": float(TP_[-1]) if TP_ else None, "loudnorm_input_lufs": m["input_i"]})
json.dump(rep, open(os.path.join(ROOT, "score", "levels.json"), "w"), indent=1)
print(json.dumps(rep))

"""Sound for the chat reel, all synthesized (no samples, no downloads), placed on the exact times of
score/timing.json so every click lands on its key press.

  key clicks      soft (lowered 9 dB on 12 Nov after a listen: they were too loud); one per key press (letters, a lower one for space, a rounder one for return / mode keys), panned a
                  little by the key's place on the keyboard
  send            a short rising "whoop" as the message leaves
  keyboard        a soft whoosh as it slides up or down
  thinking        a small bubble pop when the dot appears
  streaming       a very quiet tick per streamed word
  done            a soft two-note glass chime when a reply finishes
  handover        a soft swish as the phone changes hands
  bed             a quiet warm pad (D major, four slow chords), so the mix has a floor

Writes score/audio/final.wav (bed + effects, -14 LUFS, true peak <= -1.5 dBTP), score/audio/final_nomusic.wav (the
effects alone at the SAME level as in the full mix), assets/audio/final.m4a, and score/levels.json.
usage: <venv python> -I tools/sound.py
"""
import json
import os
import re
import subprocess
import sys

import numpy as np
import soundfile as sf
from scipy import signal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import paths  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
TM = json.load(open(os.path.join(ROOT, "score", "timing.json"), encoding="utf-8"))
N = TM["frames"] * SR // TM["fps"]
rng = np.random.default_rng(20261111)
FF = paths.ffmpeg()


def db(x):
    return 10 ** (x / 20.0)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="low", fs=SR, output="sos"), x)


def place(buf, s, t, gain=1.0, pan=0.0):
    """Add mono s at time t with an equal-power pan (-1 left .. 1 right)."""
    i = int(round(t * SR))
    if i >= N or i + len(s) <= 0:
        return
    s = s[: max(0, N - i)]
    a = (pan + 1) * np.pi / 4
    buf[i:i + len(s), 0] += s * gain * np.cos(a) * 1.4142
    buf[i:i + len(s), 1] += s * gain * np.sin(a) * 1.4142


def key_click(kind):
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    j = rng.uniform(-1, 1)
    if kind == "space":
        f0, lowf, d_body, lowg = 760 * (1 + 0.03 * j), 150, 0.011, 0.75
    elif kind in ("return", "mode"):
        f0, lowf, d_body, lowg = 940 * (1 + 0.03 * j), 190, 0.009, 0.6
    else:
        f0, lowf, d_body, lowg = 1380 * (1 + 0.05 * j), 250, 0.0058, 0.4
    body = np.sin(2 * np.pi * f0 * t) * np.exp(-t / d_body)
    tick = bp(rng.standard_normal(n), 2600, 7200) * np.exp(-t / 0.0022)
    low = np.sin(2 * np.pi * lowf * t) * np.exp(-t / 0.012) * lowg
    s = 0.6 * body + 0.3 * tick + low
    s[: int(0.0006 * SR)] *= np.linspace(0, 1, int(0.0006 * SR))
    return s * (1 + 0.12 * rng.uniform(-1, 1))


KEY_X = {}
for row, off in (("qwertyuiop", 0.0), ("asdfghjkl", 0.5), ("zxcvbnm", 1.5)):
    for i, c in enumerate(row):
        KEY_X[c] = (i + off) / 9.0
for i, c in enumerate("1234567890"):
    KEY_X[c] = i / 9.0
KEY_X.update({"space": 0.5, "return": 0.92, "123": 0.08, "ABC": 0.08, "#+=": 0.04, "shift": 0.04, "'": 0.8, ",": 0.44, "?": 0.56, "*": 0.78})


def send_whoop():
    n = int(0.26 * SR)
    t = np.arange(n) / SR
    f = 430 * (1250 / 430) ** np.clip(t / 0.17, 0, 1)
    ph = 2 * np.pi * np.cumsum(f) / SR
    env = np.minimum(1, t / 0.012) * np.exp(-np.maximum(0, t - 0.1) / 0.05)
    air = bp(rng.standard_normal(n), 1200, 5200) * np.minimum(1, t / 0.03) * np.exp(-t / 0.07) * 0.22
    return (np.sin(ph) + 0.28 * np.sin(2 * ph)) * env * 0.8 + air


def whoosh(dur, f_from, f_to, up=True):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    out = np.zeros(n)
    k = 8                                              # a few bands crossfaded along the sweep
    for b in range(k):
        u = b / (k - 1)
        fc = f_from * (f_to / f_from) ** u
        w = np.exp(-((t / dur - u) ** 2) / (2 * 0.16 ** 2))
        out += bp(x, fc * 0.6, fc * 1.5) * w
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    return out * env * 0.5


def pop():
    n = int(0.11 * SR)
    t = np.arange(n) / SR
    f = 560 * (900 / 560) ** np.clip(t / 0.07, 0, 1)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.minimum(1, t / 0.006) * np.exp(-t / 0.028)


def word_tick():
    n = int(0.03 * SR)
    t = np.arange(n) / SR
    f = 2300 * (1 + 0.08 * rng.uniform(-1, 1))
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.42 * t)) * np.exp(-t / 0.0042) * np.minimum(1, t / 0.0008)


def chime(f1=1318.5, f2=1760.0):
    n = int(1.1 * SR)
    t = np.arange(n) / SR

    def note(f, t0):
        tt = np.maximum(0, t - t0)
        on = (t >= t0).astype(float)
        return on * (np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.22) + 0.3 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt / 0.07)
                     + 0.12 * np.sin(2 * np.pi * f * 5.4 * tt) * np.exp(-tt / 0.03)) * np.minimum(1, tt / 0.003)
    return note(f1, 0) * 0.8 + note(f2, 0.085)


def pad_bed():
    """Four slow chords in D major, 8 beats each, twice through; a pad, a soft sub and a mellow key on beats 1 and 5."""
    t = np.arange(N) / SR
    bars = 8
    bar = TM["dur"] / bars
    hz = lambda m: 440.0 * 2 ** ((m - 69) / 12.0)
    chords = [[38, 50, 57, 61, 64, 66], [35, 47, 54, 57, 62, 66], [31, 43, 50, 54, 57, 62], [33, 45, 52, 57, 61, 64]]   # Dmaj9, Bm9, Gmaj9, A6/9
    out = np.zeros((N, 2))
    for b in range(bars):
        ch = chords[b % 4]
        t0 = b * bar
        env = np.clip((t - (t0 - 0.9)) / 1.8, 0, 1) * np.clip(((t0 + bar + 0.9) - t) / 1.8, 0, 1)
        env = env * env * (3 - 2 * env)
        for vi, m in enumerate(ch):
            f = hz(m)
            lvl = [0.5, 0.42, 0.3, 0.26, 0.22, 0.2][vi]
            trem = 1 + 0.18 * np.sin(2 * np.pi * (0.07 + 0.023 * vi) * t + vi)
            for c, det in ((0, -0.35), (1, 0.35)):
                tone = np.sin(2 * np.pi * (f + det) * t + vi) + (0.22 if vi > 0 else 0.0) * np.sin(2 * np.pi * 2 * (f + det) * t) + (0.08 if vi > 1 else 0.0) * np.sin(2 * np.pi * 3 * (f + det) * t)
                out[:, c] += tone * env * lvl * trem
        for beat, m in ((0, ch[2]), (4, ch[4]), (6, ch[3])):          # a mellow electric-piano-like note
            tk = t0 + beat * bar / 8
            tt = np.maximum(0, t - tk)
            on = (t >= tk).astype(float)
            f = hz(m)
            note = on * (np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * 2 * f * tt) * np.exp(-tt / 0.25)) * np.exp(-tt / 0.9) * np.minimum(1, tt / 0.01)
            pan = -0.25 if beat == 0 else 0.25
            a = (pan + 1) * np.pi / 4
            out[:, 0] += note * 0.26 * np.cos(a)
            out[:, 1] += note * 0.26 * np.sin(a)
    air = lp(rng.standard_normal(N), 1800) * 0.03
    out[:, 0] += air
    out[:, 1] += np.roll(air, 977)
    out = np.stack([lp(out[:, 0], 2600), lp(out[:, 1], 2600)], axis=1)
    fade = np.clip(t / 0.6, 0, 1) * np.clip((TM["dur"] - t) / 0.9, 0, 1)
    return out * fade[:, None]


def measure(path):
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
    tail = r.stderr[r.stderr.rfind("Summary:"):]
    i_l = float(re.search(r"I:\s+(-?[\d.]+) LUFS", tail).group(1))
    tp = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", tail).group(1))
    return i_l, tp


def limit(x, ceil_db=-1.8):
    """A soft knee on the few peaks that pass the ceiling (clicks): tanh above 70 % of the ceiling."""
    c = db(ceil_db)
    k = 0.7 * c
    a = np.abs(x)
    over = a > k
    y = x.copy()
    y[over] = np.sign(x[over]) * (k + (c - k) * np.tanh((a[over] - k) / (c - k)))
    return y


def main():
    fx = np.zeros((N, 2))
    n_keys = 0
    for tn in TM["turns"]:
        if tn["kbUp"] > 0:
            place(fx, whoosh(0.34, 300, 1500), tn["kbUp"], db(-27))
        for e in tn["keys"]:
            kind = e["kind"] if e["kind"] != "char" else "char"
            pan = (KEY_X.get(e["k"], 0.5) - 0.5) * 0.7
            place(fx, key_click(kind), e["t"] - 0.002, db(-22.5 if kind == "char" else -21.5), pan)
            n_keys += 1
        place(fx, key_click("mode"), tn["send"] - 0.085, db(-24), 0.6)        # the tap on the send button
        place(fx, send_whoop(), tn["send"] - 0.01, db(-26.5), 0.15)
        place(fx, whoosh(0.34, 1400, 280), tn["kbDown"], db(-28))
        place(fx, pop(), tn["think"], db(-21), -0.3)
        for w in tn["words"]:
            place(fx, word_tick(), w, db(-33), -0.2 + 0.1 * rng.uniform(-1, 1))
        place(fx, chime(), tn["done"] - 0.02, db(-23), -0.1)
    for h in TM.get("handovers") or ([TM["handover"]] if TM.get("handover") else []):
        place(fx, whoosh(h["dur"] * 0.8, 240, 2400), h["t0"] + 0.05, db(-22), 0.0)
        thump = np.sin(2 * np.pi * 70 * np.arange(int(0.25 * SR)) / SR) * np.exp(-np.arange(int(0.25 * SR)) / SR / 0.06)
        place(fx, thump, h["t0"] + h["dur"] * 0.5, db(-20))
    bed = pad_bed()
    bed *= db(-23.5) / (np.sqrt(np.mean(bed ** 2)) + 1e-9)     # bed level before the master gain (the effects peak near -6 dBFS before it)
    os.makedirs(os.path.join(ROOT, "score", "audio"), exist_ok=True)
    tmp = os.path.join(ROOT, "score", "audio", "_pre.wav")
    full = fx + bed
    sf.write(tmp, full, SR, subtype="PCM_24")
    i0, tp0 = measure(tmp)
    gain = -14.0 - i0
    for _ in range(4):                                         # gain to -14 LUFS, knee on the peaks, re-measure
        y = limit(full * db(gain))
        sf.write(tmp, y, SR, subtype="PCM_24")
        i1, tp1 = measure(tmp)
        if abs(i1 + 14.0) < 0.15:
            break
        gain += -14.0 - i1
    out_full = os.path.join(ROOT, "score", "audio", "final.wav")
    out_nom = os.path.join(ROOT, "score", "audio", "final_nomusic.wav")
    sf.write(out_full, y, SR, subtype="PCM_24")
    sf.write(out_nom, limit(fx * db(gain)), SR, subtype="PCM_24")
    os.remove(tmp)
    i_f, tp_f = measure(out_full)
    i_n, tp_n = measure(out_nom)
    bed_rms = 20 * np.log10(np.sqrt(np.mean((bed * db(gain)) ** 2)) + 1e-12)
    fx_g = fx * db(gain)
    win = int(0.05 * SR)
    pk = np.max(np.abs(fx_g))
    os.makedirs(os.path.join(ROOT, "assets", "audio"), exist_ok=True)
    subprocess.run([FF, "-y", "-hide_banner", "-v", "error", "-i", out_full, "-c:a", "aac", "-b:a", "256k", "-ar", "48000",
                    os.path.join(ROOT, "assets", "audio", "final.m4a")], check=True)
    lv = dict(master_gain_db=round(gain, 2), full=dict(lufs=i_f, true_peak_dbtp=tp_f), nomusic=dict(lufs=i_n, true_peak_dbtp=tp_n),
              bed_rms_dbfs=round(float(bed_rms), 1), effects_peak_dbfs=round(float(20 * np.log10(pk)), 1), key_clicks=n_keys,
              samples=N, seconds=N / SR)
    json.dump(lv, open(os.path.join(ROOT, "score", "levels.json"), "w"), indent=1)
    print(json.dumps(lv, indent=1))


if __name__ == "__main__":
    main()

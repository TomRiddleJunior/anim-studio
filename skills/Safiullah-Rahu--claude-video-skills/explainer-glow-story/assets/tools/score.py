"""Soundtrack for a glow story, fully synthesized (no samples, no licences), driven by vo/script.json:

  - narrator lines (no "who", or who = "narrator"): close and dry, a small room;
  - every other line (who = "him", "june", "caller" …): through a telephone line (300-3400 Hz, soft saturation);
  - script["score"]["events"]: telephone/foley events at times written against the voice-over:
      {"kind": "click" | "breath" | "ring" | "beep" | "hiss" | "glass" | "metal", "at": "<t>", "until": "<t>", "gain": 1, "f": 2100}
      <t> = "l21:play+0.12" (a word's start), "m1.start-0.85", "m1.end+0.35", "12.5" (seconds)
      click/breath/ring/beep/hiss go through the phone line; glass/metal are quiet foley on visible actions;
  - script["score"]["piano"]: {"dyn": [["0", 0.8], ["l20.start", 0.55], …], "final": "<t>"}: a quiet felt piano from
    the first frame (the source's bed), thinner under the rule-break (velocity < 0.65 = bass + one note), open at the
    twist, an open Fmaj(add9) ringing from "final" to the end.
  Levels: piano ~18 dB under the voice before a 3 dB sidechain dip (so ~21 dB while the voice speaks), foley 20 dB
  under; pre-gain + look-ahead limiter, then two-pass loudnorm (linear) to -14 LUFS, true peak <= -1.5 dBTP.

usage: python -I tools/score.py         -> score/final.wav, score/levels.json, assets/audio/final.m4a
"""
import json
import os
import re
import subprocess
import sys

import numpy as np
import soundfile as sf
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from scipy.signal import butter, fftconvolve, lfilter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from piano import felt_piano  # noqa: E402

FF = r"ffmpeg-bin\node_modules\ffmpeg-static\ffmpeg.exe"
SR = 48000
RNG = np.random.default_rng(11)
VO = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
SPEC = json.load(open(os.path.join(ROOT, "vo", "script.json"), encoding="utf-8"))
WHO = {l["id"]: l.get("who", "narrator") for l in SPEC["lines"]}
L = {l["id"]: l for l in VO["lines"]}
DUR = VO["duration"]
N = int(DUR * SR)


def T(ref):
    """'l21:play+0.12' | 'm1.start-0.85' | 'm1.end' | '12.5' -> seconds"""
    ref = str(ref).strip()
    m = re.fullmatch(r"([A-Za-z0-9_]+)(?:(\.start|\.end)|:([A-Za-z']+)(?:#(\d+))?)?([+-][0-9.]+)?", ref)
    if not m or re.fullmatch(r"[0-9.]+", ref):
        return float(ref)
    lid, se, wd, k, off = m.groups()
    l = L[lid]
    if wd:
        hits = [x for x in l["words"] if x["w"].lower().strip(",.?!").startswith(wd.lower())]
        t = hits[min(int(k or 0), len(hits) - 1)]["start"]
    else:
        t = l["end"] if se == ".end" else l["start"]
    return t + float(off or 0)


def bp(x, lo, hi, o=4):
    return sosfilt(butter(o, [lo / (SR / 2), hi / (SR / 2)], btype="band", output="sos"), x, axis=0)


def hp(x, f, o=2):
    return sosfilt(butter(o, f / (SR / 2), btype="high", output="sos"), x, axis=0)


def lp(x, f, o=2):
    return sosfilt(butter(o, f / (SR / 2), btype="low", output="sos"), x, axis=0)


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(np.square(x))) + 1e-12)


def place(bus, x, t, g=1.0):
    i = int(round(t * SR))
    if i >= len(bus) or i + len(x) <= 0:
        return
    k = min(len(x), len(bus) - i)
    bus[i:i + k] += x[:k] * g


def room(x, rt=0.45, wet=0.07):
    n = int(rt * SR)
    t = np.arange(n) / SR
    ir = RNG.standard_normal(n) * np.exp(-6.9 * t / rt)
    ir = lp(ir, 4500)
    ir[: int(0.008 * SR)] = 0
    ir /= np.sqrt((ir ** 2).sum())
    return x * (1 - wet) + fftconvolve(x, ir)[: len(x)] * wet * 2.2


def phone_line(x):
    """Telephone band + a little saturation: the voice as heard through a voicemail system."""
    y = bp(x, 320, 3300, 4)
    pk = np.abs(y).max() + 1e-9
    y = np.tanh(y / pk * 2.2) * pk
    return y + 0.18 * bp(y, 1400, 2600, 2)  # small presence bump of a handset


def breath(dur=0.7, gain=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    env = np.minimum(t / (dur * 0.45), 1) ** 1.6 * np.exp(-np.maximum(t - dur * 0.45, 0) / (dur * 0.22))
    x = bp(RNG.standard_normal(n), 450, 2400, 2) * env
    return x / (np.abs(x).max() + 1e-9) * gain


def click(gain=1.0, f=2600):
    n = int(0.03 * SR)
    t = np.arange(n) / SR
    x = (RNG.standard_normal(n) * 0.6 + np.sin(2 * np.pi * f * t)) * np.exp(-t / 0.004)
    return bp(x, 500, 6000, 2) * gain


def tone(freqs, dur, gain=1.0, fade=0.02):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * t) for f in freqs) / len(freqs)
    e = np.ones(n)
    k = int(fade * SR)
    e[:k] = np.linspace(0, 1, k); e[-k:] = np.linspace(1, 0, k)
    return x * e * gain


def glass_tick(gain=1.0, f=2100):
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    x = (np.sin(2 * np.pi * f * t) * 0.6 + np.sin(2 * np.pi * f * 2.76 * t) * 0.25 + np.sin(2 * np.pi * f * 5.4 * t) * 0.1) * np.exp(-t / 0.05)
    x[: int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))
    return x * gain


def metal_click(gain=1.0):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    x = RNG.standard_normal(n) * np.exp(-t / 0.006) * 0.7
    for f, a in ((3100, 0.5), (5200, 0.3), (1800, 0.35)):
        x += a * np.sin(2 * np.pi * f * t) * np.exp(-t / 0.02)
    x2 = np.zeros(int(0.2 * SR)); x2[:n] += x; x2[int(0.055 * SR): int(0.055 * SR) + n] += x * 0.55  # a two-part latch
    return bp(x2, 600, 9000, 2) * gain


def main():
    sc = SPEC.get("score", {})
    v, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), always_2d=False)
    assert sr == SR
    v = np.pad(v, (0, max(0, N - len(v))))[:N]
    narr = np.zeros(N); tel = np.zeros(N)
    for l in VO["lines"]:
        a, b = int((l["start"] - 0.08) * SR), int((l["end"] + 0.2) * SR)
        (narr if WHO.get(l["id"], "narrator") == "narrator" else tel)[a:b] += v[a:b]
    narr = room(hp(narr, 85), 0.45, 0.06)
    tel_p = phone_line(tel) if np.abs(tel).max() > 0 else tel

    # events
    fx_tel = np.zeros(N); fol = np.zeros(N); hiss_env = np.zeros(N)
    hiss = bp(RNG.standard_normal(N), 400, 3400, 2)
    for e in sc.get("events", []):
        k, t, g = e["kind"], T(e["at"]), e.get("gain", 1.0)
        if k == "click":
            place(fx_tel, click(0.5 * g), t)
        elif k == "breath":
            place(fx_tel, breath(e.get("dur", 0.7), 0.22 * g), t)
        elif k == "ring":  # one North-American ring: 440 + 480 Hz, warbled
            r = tone([440, 480], e.get("dur", 1.45), 0.5 * g, 0.03)
            place(fx_tel, r * (0.75 + 0.25 * np.sin(2 * np.pi * 20 * np.arange(len(r)) / SR)), t)
        elif k == "beep":
            place(fx_tel, tone([e.get("f", 1000)], e.get("dur", 0.42), 0.42 * g, 0.01), t)
        elif k == "hiss":
            i, j = int(t * SR), min(N, int(T(e["until"]) * SR))
            env = np.ones(j - i); f4 = min(int(0.04 * SR), (j - i) // 2)
            env[:f4] = np.linspace(0, 1, f4); env[len(env) - f4:] = np.linspace(1, 0, f4)
            hiss_env[i:j] = np.maximum(hiss_env[i:j], env)
        elif k == "glass":
            place(fol, glass_tick(g, e.get("f", 2100)), t)
        elif k == "metal":
            place(fol, metal_click(g), t)
    fx_tel = (phone_line(fx_tel) * 0.9 if np.abs(fx_tel).max() > 0 else fx_tel) + hiss * hiss_env * 0.012
    fol = room(fol, 0.6, 0.18)

    # piano
    pc = sc.get("piano", {})
    t_final = T(pc.get("final", str(max(0.0, DUR - 2.5))))
    dyn = [(T(a), b) for a, b in pc.get("dyn", [["0", 0.85]])]
    main_p, final_p = felt_piano(DUR, 0.0, t_final, SR, dyn=dyn)
    air = lp(RNG.standard_normal((N, 2)), 900) * 0.002

    voice = narr + tel_p * 0.8 + fx_tel
    speech = np.zeros(N, bool)
    for l in VO["lines"]:
        speech[int(l["start"] * SR):int(l["end"] * SR)] = True
    vo_db = rms_db(voice[speech])
    piano = main_p + final_p
    g_p = 10 ** ((vo_db + pc.get("under_voice_db", -18.0) - rms_db(piano.mean(axis=1)[speech])) / 20)
    a_r = np.exp(-1 / (0.35 * SR))
    act = lfilter([1 - a_r], [1, -a_r], speech.astype(float))
    duck = 1 - (1 - 10 ** (-3 / 20)) * np.clip(act * 1.4, 0, 1)
    piano = piano * g_p * duck[:, None]
    nz = np.abs(fol) > 1e-4
    g_f = 10 ** ((vo_db - 20.0 - rms_db(fol[nz])) / 20) if nz.any() else 0.0
    mix = np.stack([voice, voice], axis=1) + piano + np.stack([fol, fol], axis=1) * g_f + air
    fl = int(0.6 * SR)
    mix[-fl:] *= np.linspace(1, 0, fl)[:, None] ** 1.5
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.7
    out = os.path.join(ROOT, "score")
    os.makedirs(out, exist_ok=True)
    raw = os.path.join(out, "mix_raw.wav")
    sf.write(raw, mix.astype(np.float32), SR, subtype="FLOAT")
    vm, pmu = rms_db(voice[speech]), rms_db(piano.mean(axis=1)[speech])
    lv = {"voice_db": round(vm, 1), "piano_under_voice_db": round(pmu, 1), "voice_over_music_db": round(vm - pmu, 1)}

    def loudnorm(path, extra=""):
        r = subprocess.run([FF, "-hide_banner", "-i", path, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json" + extra, "-f", "null", "-"],
                           capture_output=True, text=True, encoding="utf-8", errors="replace")
        return json.loads(r.stderr[r.stderr.rindex("{"): r.stderr.rindex("}") + 1])
    # pre-gain to the target, then a look-ahead peak limiter (so loudnorm can stay linear: Kokoro's peaks would push it
    # into dynamic mode), then two-pass loudnorm, linear
    m0 = loudnorm(raw)
    mix = mix * 10 ** ((-14.0 - float(m0["input_i"])) / 20)
    ceil = 10 ** (-2.6 / 20)
    g = np.minimum(1.0, ceil / np.maximum(np.abs(mix).max(axis=1), 1e-9))
    g = uniform_filter1d(minimum_filter1d(g, size=int(0.03 * SR)), size=int(0.01 * SR))
    lv["limiter_max_gr_db"] = round(float(-20 * np.log10(g.min())), 1)
    sf.write(raw, (mix * g[:, None]).astype(np.float32), SR, subtype="FLOAT")
    m = loudnorm(raw)
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true:print_format=json")
    r2 = subprocess.run([FF, "-y", "-hide_banner", "-i", raw, "-af", af, "-ar", "48000", "-c:a", "pcm_s24le", os.path.join(out, "final.wav")],
                        capture_output=True, text=True, encoding="utf-8", errors="replace")
    m2 = json.loads(r2.stderr[r2.stderr.rindex("{"): r2.stderr.rindex("}") + 1])
    lv.update({"output_lufs": m2["output_i"], "output_tp": m2["output_tp"], "normalization": m2["normalization_type"]})
    os.makedirs(os.path.join(ROOT, "assets", "audio"), exist_ok=True)
    subprocess.run([FF, "-y", "-v", "error", "-i", os.path.join(out, "final.wav"), "-c:a", "aac", "-b:a", "256k", os.path.join(ROOT, "assets", "audio", "final.m4a")], check=True)
    json.dump(lv, open(os.path.join(out, "levels.json"), "w"), indent=1)
    print(json.dumps(lv))


if __name__ == "__main__":
    main()

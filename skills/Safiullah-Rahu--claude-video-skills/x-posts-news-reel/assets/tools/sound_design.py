"""Soundtrack for an X-posts news reel, fully synthesized in numpy (no samples, no downloads).

  bed    a beat-driven news/trap hybrid on the film's beat grid (score/timeline.json: bpm, sections):
         kick + clap + hats + a saturated sub-bass line + detuned saw stabs + a high "wire" pulse (the breaking-news
         ostinato), a dark pad; energy 0-3 per section adds/removes layers and opens the filter; a riser into every
         section whose energy rises, an impact on its downbeat; a cymbal-less hard stop + low hit on the end card
  sfx    on the visible actions only (timeline cues): whooshes on whip/push/zoom transitions (three takes rotated),
         a slam (sub thump + noise crack) on slam cuts, a paper flick on flips, a digital glitch burst on glitch cuts,
         a soft pop on chips and like counters, a ticker tick on counters
  voice  Kokoro lines cut from vo/tts/audio/vo.wav and placed at the times build.py scheduled (score/timeline.json)
  mix    the bed is ducked under speech (voice RMS - 15 dB under speech, 150 ms ramps), SFX ~3 dB over the bed;
         two-pass loudnorm to -14 LUFS, true peak -2.0 dBTP (the AAC adds ~0.5 dB); AAC 256k at assets/audio/final.m4a
  report score/levels.json: LUFS, true peak, voice-over-bed under speech (gate >= 10 dB)

usage: ~/.generative-music-video/venv/Scripts/python.exe -I tools/sound_design.py
"""
import json
import os
import re
import subprocess

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = os.environ.get("FFMPEG_PATH", r"engine\node_modules\ffmpeg-static\ffmpeg.exe")
SR = 48000
RNG = np.random.default_rng(7)
TL = json.load(open(os.path.join(ROOT, "score", "timeline.json"), encoding="utf-8"))
DUR, BPM = TL["dur"], TL["bpm"]
BEAT = 60.0 / BPM
N = int(round(DUR * SR))
LOUD = TL.get("lufs", -14.0)


# ----------------------------------------------------------------------------------------------- dsp helpers
def sos(kind, f, o=2):
    f = np.atleast_1d(f) / (SR / 2)
    return butter(o, f if len(f) > 1 else f[0], btype=kind, output="sos")


def lp(x, f, o=2):
    return sosfilt(sos("low", min(f, SR / 2 - 100), o), x, axis=0)


def hp(x, f, o=2):
    return sosfilt(sos("high", f, o), x, axis=0)


def bp(x, lo, hi, o=2):
    return sosfilt(sos("band", [lo, hi], o), x, axis=0)


def tt(d):
    return np.arange(int(d * SR)) / SR


def env_exp(d, k):
    return np.exp(-k * tt(d))


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(np.square(x))) + 1e-12)


def place(bus, x, t, g=1.0, pan=0.0):
    i = int(round(t * SR))
    if x.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
        x = np.stack([x * l, x * r], axis=1)
    if i < 0:
        x, i = x[-i:], 0
    if i >= len(bus):
        return
    x = x[: len(bus) - i]
    bus[i:i + len(x)] += x * g


def movavg(x, n):
    """centred moving average via a cumulative sum (np.convolve with a long box is O(N*n))"""
    n = max(1, int(n))
    xp = np.pad(x, (n // 2, n - n // 2), mode="edge")
    c = np.cumsum(np.insert(xp, 0, 0.0))
    return (c[n:] - c[:-n])[: len(x)] / n


def sat(x, k=2.0):
    return np.tanh(k * x) / np.tanh(k)


def note_hz(semi_from_a4):
    return 440.0 * 2 ** (semi_from_a4 / 12.0)


# ----------------------------------------------------------------------------------------------- instruments
def kick(g=1.0):
    t = tt(0.42)
    f = 46 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 7.5)
    click = hp(RNG.standard_normal(len(t)), 2500) * np.exp(-t * 260) * 0.25
    return sat(body * 1.2 + click, 1.6) * g


def clap(g=1.0):
    t = tt(0.32)
    n = RNG.standard_normal(len(t))
    e = np.zeros(len(t))
    for k, d in enumerate((0.0, 0.011, 0.022)):  # three smeared hand hits, then the tail
        i = int(d * SR)
        e[i:] += np.exp(-(t[: len(t) - i]) * (90 if k < 2 else 16)) * (0.8 if k < 2 else 1.0)
    x = bp(n, 900, 5200) * e
    tone = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30) * 0.35
    return (x * 0.9 + tone) * g


def hat(open_=False, g=1.0):
    d = 0.22 if open_ else 0.045
    t = tt(d)
    n = hp(RNG.standard_normal(len(t)), 7000, 4)
    return n * np.exp(-t * (14 if open_ else 95)) * g * 0.5


def saw(f, t, detune=(0.0,)):
    out = np.zeros_like(t)
    for d in detune:
        ff = f * 2 ** (d / 1200.0)
        out += 2 * ((t * ff + RNG.uniform()) % 1.0) - 1
    return out / len(detune)


def stab(freqs, d, g=1.0):
    t = tt(d)
    x = sum(saw(f, t, (-11, 0, 9)) for f in freqs) / len(freqs)
    e = np.minimum(1, t / 0.004) * np.exp(-t * 7)
    return lp(x * e, 3800) * g


def pad(freqs, d, g=1.0):
    t = tt(d)
    x = sum(saw(f, t, (-7, 0, 6)) for f in freqs) / len(freqs)
    e = np.minimum(1, t / 0.35) * np.minimum(1, (d - t) / 0.4)
    return lp(x * np.clip(e, 0, 1), 1400) * g


def bass_note(f, d, g=1.0):
    t = tt(d)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t)
    e = np.minimum(1, t / 0.006) * np.exp(-t * 2.2) * np.minimum(1, (d - t) / 0.02).clip(0, 1)
    return sat(x * e * 1.4, 2.2) * g  # saturation puts the bass where a phone speaker can play it


def wire(f, g=1.0):
    t = tt(0.09)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 55) * g


def riser(d, g=1.0):
    t = tt(d)
    n = RNG.standard_normal(len(t))
    out = np.zeros(len(t))
    seg = int(0.05 * SR)
    for i in range(0, len(t), seg):  # stepped band-pass sweep 400 Hz -> 9 kHz
        fr = i / len(t)
        lo = 400 * (22 ** fr)
        out[i:i + seg] = bp(n[i:i + seg + 2000], lo, min(lo * 1.8, 20000))[: len(out[i:i + seg])]
    tone = np.sin(2 * np.pi * np.cumsum(180 * 2 ** (3 * t / d)) / SR) * 0.25
    e = (t / d) ** 2.2
    return (out * 0.8 + tone) * e * g


def impact(g=1.0):
    t = tt(1.4)
    f = 38 + 60 * np.exp(-t * 9)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)
    crack = bp(RNG.standard_normal(len(t)), 300, 6000) * np.exp(-t * 18) * 0.6
    return sat(boom + crack, 1.4) * g


def whoosh(d=0.42, take=0, g=1.0):
    t = tt(d)
    n = RNG.standard_normal(len(t))
    c = [(500, 4200), (700, 6500), (350, 3000)][take % 3]
    sweep = np.zeros(len(t))
    seg = int(0.02 * SR)
    for i in range(0, len(t), seg):
        fr = i / len(t)
        fc = c[0] + (c[1] - c[0]) * np.sin(np.pi * fr)
        sweep[i:i + seg] = bp(n[i:i + seg + 1500], fc * 0.6, fc * 1.4)[: len(sweep[i:i + seg])]
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
    return sweep * e * g


def slam(g=1.0):
    t = tt(0.6)
    thump = np.sin(2 * np.pi * np.cumsum(55 + 90 * np.exp(-t * 30)) / SR) * np.exp(-t * 9)
    crack = hp(RNG.standard_normal(len(t)), 1500) * np.exp(-t * 45) * 0.7
    return sat(thump * 1.3 + crack, 1.5) * g


def flick(g=1.0):
    t = tt(0.16)
    return bp(RNG.standard_normal(len(t)), 1800, 7000) * np.exp(-t * 35) * g * 0.8


def glitch(g=1.0):
    d = 0.22
    t = tt(d)
    out = np.zeros(len(t))
    seg = int(0.018 * SR)
    for i in range(0, len(t), seg):
        f = RNG.choice([220, 440, 880, 1760, 3520])
        out[i:i + seg] = np.sign(np.sin(2 * np.pi * f * t[i:i + seg])) * RNG.uniform(0.2, 0.6)
    return lp(out, 6000) * g * 0.5


def pop(g=1.0, f0=700):
    t = tt(0.09)
    f = f0 * (1 + 0.6 * np.exp(-t * 60))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 40) * g


def tick(g=1.0):
    t = tt(0.03)
    return hp(RNG.standard_normal(len(t)), 3000) * np.exp(-t * 200) * g


# ----------------------------------------------------------------------------------------------- the bed
# A minor: i - VI - III - VII (Am F C G), roots as semitones from A4
PROG = [(-24, [0, 3, 7]), (-28, [-4, 0, 3]), (-21, [-9, -5, -2]), (-26, [-2, 2, 5])]
sections = sorted(TL["sections"], key=lambda s: s["t"])


def energy_at(t):
    e = sections[0]["energy"]
    for s in sections:
        if s["t"] <= t + 1e-6:
            e = s["energy"]
    return e


drums = np.zeros((N, 2))
bassb = np.zeros((N, 2))
harm = np.zeros((N, 2))
pulse = np.zeros((N, 2))
fx = np.zeros((N, 2))
end_t = TL.get("end_card_t", DUR - 2.5)
n16 = int(end_t / (BEAT / 4)) + 1
for k in range(n16):
    t = k * BEAT / 4
    if t >= end_t:
        break
    e = energy_at(t)
    if e <= 0:
        continue
    step = k % 16           # 16 steps per bar (4/4)
    bar = k // 16
    root, chord = PROG[bar % 4]
    # kick: half-time at e1 (1 and the "and" of 3), four on the floor at e2, plus pickups at e3
    if (e == 1 and step in (0, 10)) or (e >= 2 and step % 4 == 0) or (e >= 3 and step in (14,)):
        place(drums, kick(0.95), t)
    # clap: on 3 at e1 (half-time), on 2 and 4 from e2
    if (e == 1 and step == 8) or (e >= 2 and step in (4, 12)):
        place(drums, clap(0.55), t, pan=0.05)
    # hats: 8ths from e1, 16ths at e3, an open hat on the "and" of 4 at e2+
    if step % 2 == 0 or e >= 3:
        vel = 0.5 if step % 4 == 2 else (0.32 if step % 2 == 0 else 0.22)
        place(drums, hat(False, vel), t, pan=0.25 if step % 2 else -0.15)
    if e >= 2 and step == 14:
        place(drums, hat(True, 0.32), t, pan=0.2)
    # sub bass: syncopated 8ths on the root (octave jump on the last 16th) from e1
    if step in (0, 3, 6, 10, 12) or (e >= 3 and step == 15):
        f = note_hz(root + (12 if step == 15 else 0))
        place(bassb, bass_note(f, BEAT * (0.75 if step in (0, 10) else 0.45), 0.55 if e >= 2 else 0.42), t)
    # stabs: off-beat chord stabs at e2+, the full syncopation at e3
    if e >= 2 and step in ((3, 6, 11, 14) if e >= 3 else (6, 14)):
        fr = [note_hz(c) for c in chord]
        place(harm, stab(fr, BEAT * 0.6, 0.30), t, pan=-0.2 if step % 2 else 0.2)
    # the wire: a high 16th ostinato (the newsroom pulse), loudest on the beat
    if e >= 1:
        f = note_hz(chord[(step // 2) % 3] + 24)
        place(pulse, wire(f, 0.16 if step % 4 == 0 else 0.08), t, pan=0.35 if step % 8 < 4 else -0.35)
# pad per bar under everything with e >= 1 (darker under the voice cards)
nbars = int(end_t / (4 * BEAT)) + 1
for b in range(nbars):
    t = b * 4 * BEAT
    if t >= end_t:
        break
    if energy_at(t) >= 1:
        root, chord = PROG[b % 4]
        d = min(4 * BEAT, end_t - t) + 0.3
        place(harm, pad([note_hz(c - 12) for c in chord], d, 0.22), t)

# section moves: riser into a rise in energy, an impact on its downbeat
prev = 0
for s in sections:
    if s["energy"] > prev and s["t"] > 0.5:
        rd = min(2 * BEAT * 2, s["t"] - 0.1)
        place(fx, riser(rd, 0.30), s["t"] - rd)
        if s["energy"] >= 2:
            place(fx, impact(0.75), s["t"])
    prev = s["energy"]
# the hard stop on the end card: one low hit, then only the tail of the pad
place(fx, impact(0.9), end_t)

# sidechain: duck bass + harmony on each kick (the pump that makes it move)
side = np.ones(N)
for k in range(int(end_t / BEAT) + 1):
    i = int(k * BEAT * SR)
    L_ = int(0.22 * SR)
    seg = 1 - 0.55 * np.exp(-np.arange(L_) / (0.06 * SR))
    side[i:i + L_] = np.minimum(side[i:i + L_], seg[: len(side[i:i + L_])])
bassb *= side[:, None]
harm *= side[:, None]

# the harmony filter opens with energy: crossfade a dark and a bright copy
ecurve = np.array([energy_at(i / SR) for i in range(0, N, 480)], dtype=float)
ecurve = np.interp(np.arange(N), np.arange(0, N, 480), ecurve)
ecurve = movavg(ecurve, 0.25 * SR)
bright = np.clip((ecurve - 1) / 2, 0, 1)[:, None]
harm = lp(harm, 900) * (1 - bright) + lp(harm, 7000) * bright
bed = drums * 0.9 + hp(bassb, 35) * 0.9 + harm * 0.8 + pulse * 0.7 + fx * 0.8

# ----------------------------------------------------------------------------------------------- sfx on cues
sfx = np.zeros((N, 2))
wt = 0
for c in TL["cues"]:
    t, ty = c["t"], c["type"]
    if ty in ("whoosh", "whip", "push", "zoom"):
        d = {"whip": 0.34, "push": 0.42, "zoom": 0.5}.get(ty, 0.42)
        place(sfx, whoosh(d, wt, 0.55), t - d * 0.55, pan=c.get("pan", 0.0))
        wt += 1
    elif ty == "slam":
        place(sfx, whoosh(0.25, wt, 0.3), t - 0.22)
        place(sfx, slam(0.9), t)
        wt += 1
    elif ty == "flip":
        place(sfx, flick(0.7), t - 0.05)
        place(sfx, flick(0.5), t + 0.09)
    elif ty == "glitch":
        place(sfx, glitch(0.6), t - 0.04)
    elif ty == "pop":
        place(sfx, pop(0.35, c.get("f", 700)), t)
    elif ty == "tick":
        place(sfx, tick(0.4), t)
    elif ty == "boom":
        place(sfx, impact(0.8), t)

# ----------------------------------------------------------------------------------------------- voice
vsrc, vsr = sf.read(os.path.join(ROOT, "vo", "tts", "audio", "vo.wav"), always_2d=False)  # the raw Kokoro take
assert vsr == SR, vsr
if vsrc.ndim > 1:
    vsrc = vsrc.mean(axis=1)
vo = np.zeros(N)
speech = np.zeros(N, bool)
for v in TL["vo"]:
    a, b = int(v["src_start"] * SR), int(v["src_end"] * SR)
    clip = vsrc[a:b].copy()
    f = int(0.01 * SR)
    clip[:f] *= np.linspace(0, 1, f)
    clip[-f:] *= np.linspace(1, 0, f)
    i = int(v["at"] * SR)
    clip = clip[: max(0, N - i)]
    vo[i:i + len(clip)] += clip
    speech[i + int(0.05 * SR): i + len(clip) - int(0.05 * SR)] = True
vo = hp(vo, 75)
voc = np.stack([vo, vo], axis=1)

# levels: the music alone sits ~1.5 dB under the voice level (no loudness jump between voice cards and posts), then
# ducks to voice - UNDER dB under speech, eased over 150 ms
UNDER = TL.get("duck_db", 15.0)
vo_db = rms_db(vo[speech]) if speech.any() else -20.0
alone = ~speech
bed_n = bed * (10 ** ((vo_db - 1.5 - rms_db(bed[alone, 0])) / 20) if alone.any() else 1.0)
duck = 10 ** ((vo_db - UNDER - rms_db(bed_n[speech, 0])) / 20) if speech.any() else 1.0
g = movavg(np.where(speech, duck, 1.0), int(0.15 * SR))
bed_d = bed_n * g[:, None]
# sfx: ~3 dB over the bed where they land
sfx *= 10 ** ((rms_db(bed_d[alone, 0]) + 3 - (rms_db(sfx[np.abs(sfx[:, 0]) > 1e-4, 0]) if (np.abs(sfx[:, 0]) > 1e-4).any() else -60)) / 20)
# end: the pad tail fades over the last 1.5 s
fade = np.ones(N)
fl = int(1.5 * SR)
fade[-fl:] = np.linspace(1, 0, fl) ** 1.5
mix = (voc + bed_d + sfx) * fade[:, None]
mix *= 0.89 / (np.abs(mix).max() + 1e-9)

out = os.path.join(ROOT, "score", "audio")
os.makedirs(out, exist_ok=True)
os.makedirs(os.path.join(ROOT, "assets", "audio"), exist_ok=True)
sf.write(os.path.join(out, "mix_raw.wav"), mix.astype(np.float32), SR, subtype="FLOAT")
sf.write(os.path.join(out, "bed.wav"), (bed_d * fade[:, None]).astype(np.float32), SR, subtype="FLOAT")
sf.write(os.path.join(out, "vo_placed.wav"), voc.astype(np.float32), SR, subtype="FLOAT")


def run(args):
    return subprocess.run([FF, "-hide_banner", "-nostats"] + args, capture_output=True, text=True, encoding="utf-8", errors="replace")


r1 = run(["-i", os.path.join(out, "mix_raw.wav"), "-af", f"loudnorm=I={LOUD}:TP=-2.0:LRA=11:print_format=json", "-f", "null", "-"])
m = json.loads(r1.stderr[r1.stderr.rindex("{"): r1.stderr.rindex("}") + 1])
af = (f"loudnorm=I={LOUD}:TP=-2.0:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
      f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
run(["-y", "-v", "error", "-i", os.path.join(out, "mix_raw.wav"), "-af", af, "-ar", "48000", "-c:a", "pcm_s24le", os.path.join(out, "final.wav")])
# loudnorm can fall back to dynamic mode and overshoot its TP target; the AAC then adds ~0.3-0.5 dB. If the true peak
# is above -1.8 dBTP, run a limiter at 4x oversampling (catches inter-sample peaks) at -2.2 dBFS.
r2 = run(["-i", os.path.join(out, "final.wav"), "-af", "ebur128=peak=true", "-f", "null", "-"])
TP0 = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r2.stderr)
if TP0 and float(TP0[-1]) > -1.8:
    os.replace(os.path.join(out, "final.wav"), os.path.join(out, "final_prelimit.wav"))
    run(["-y", "-v", "error", "-i", os.path.join(out, "final_prelimit.wav"), "-af",
         "aresample=192000,alimiter=limit=0.776:attack=1:release=60:level=false,aresample=48000",
         "-c:a", "pcm_s24le", os.path.join(out, "final.wav")])
run(["-y", "-v", "error", "-i", os.path.join(out, "final.wav"), "-c:a", "aac", "-b:a", "256k", os.path.join(ROOT, "assets", "audio", "final.m4a")])
r2 = run(["-i", os.path.join(out, "final.wav"), "-af", "ebur128=peak=true", "-f", "null", "-"])
I_ = re.findall(r"I:\s+(-?[\d.]+) LUFS", r2.stderr)
TP_ = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r2.stderr)
fin, _ = sf.read(os.path.join(out, "final.wav"))
gain = 10 ** ((float(I_[-1]) - float(m["input_i"])) / 20) if I_ else 1.0
rep = {
    "final_lufs": float(I_[-1]) if I_ else None,
    "final_true_peak_dbtp": float(TP_[-1]) if TP_ else None,
    "voice_over_bed_db_under_speech": round(rms_db(vo[speech]) - rms_db(bed_d[speech, 0]), 2) if speech.any() else None,
    "voice_over_bed_plus_sfx_db_under_speech": round(rms_db(vo[speech]) - rms_db((bed_d + sfx)[speech, 0]), 2) if speech.any() else None,
    "music_alone_re_voice_db": round(rms_db(bed_d[alone, 0]) - rms_db(vo[speech]), 2) if speech.any() else None,
    "speech_seconds": round(speech.sum() / SR, 2),
    "duration_s": round(N / SR, 3),
}
r3 = run(["-i", os.path.join(ROOT, "assets", "audio", "final.m4a"), "-af", "ebur128=peak=true", "-f", "null", "-"])
I3 = re.findall(r"I:\s+(-?[\d.]+) LUFS", r3.stderr)
TP3 = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r3.stderr)
rep["aac_lufs"] = float(I3[-1]) if I3 else None
rep["aac_true_peak_dbtp"] = float(TP3[-1]) if TP3 else None
json.dump(rep, open(os.path.join(ROOT, "score", "levels.json"), "w"), indent=1)
print(json.dumps(rep))

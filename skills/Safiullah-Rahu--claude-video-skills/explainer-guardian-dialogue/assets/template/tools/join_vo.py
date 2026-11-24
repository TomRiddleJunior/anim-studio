"""Join the per-line voice wavs into one narration track.

Reads vo/script.json for the order and the pauses ("lead", per-line "gap" = silence before that line, "tail") and
vo/lines/<id>.wav (any sample rate, mono or stereo; resampled to 48 kHz mono, leading/trailing silence trimmed to
"pad" = 0.04 s by energy, "trim_db" = -42, so a gap is the audible pause whatever engine made the wav). Writes
  vo/audio/vo.wav        48 kHz mono float, peak 0.89
  vo/data/join.json      {duration, lines: [{id, text, start, end, file, sr}]}   (clip boundaries, by construction)
Word times come next from tools/align_vo.py (faster-whisper), never from this file alone.

usage: python -I tools/join_vo.py      (any Python with numpy, scipy, soundfile)
"""
import json
import os
import sys
from math import gcd

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000


def trim(a, db, pad):
    """strip leading/trailing silence (10 ms RMS below db re the clip's loudest 10 ms), keep `pad` s of air, 8 ms fades;
    so a script gap is the real pause whatever engine made the wav"""
    w = int(0.01 * SR)
    n = len(a) // w
    if n < 3:
        return a
    r = np.sqrt((a[: n * w].reshape(n, w) ** 2).mean(axis=1) + 1e-12)
    on = np.where(20 * np.log10(r / r.max()) > db)[0]
    if not len(on):
        return a
    i0 = max(0, on[0] * w - int(pad * SR)); i1 = min(len(a), (on[-1] + 1) * w + int(pad * SR))
    a = a[i0:i1].copy()
    f = int(0.008 * SR); a[:f] *= np.linspace(0, 1, f); a[-f:] *= np.linspace(1, 0, f)
    return a


def squeeze(a, max_pause, db=-38.0):
    """shorten every internal silence longer than max_pause s to max_pause (10 ms RMS below db re the clip peak),
    cutting from its middle with 12 ms crossfades: VoiceDesign leaves 0.6-1.9 s pauses at full stops and ellipses"""
    if not max_pause:
        return a
    w = int(0.01 * SR); n = len(a) // w
    if n < 5:
        return a
    r = np.sqrt((a[: n * w].reshape(n, w) ** 2).mean(axis=1) + 1e-12)
    sil = 20 * np.log10(r / r.max()) < db
    runs, i = [], 0
    while i < n:
        if sil[i]:
            j = i
            while j < n and sil[j]:
                j += 1
            if i > 0 and j < n and (j - i) * 0.01 > max_pause:
                runs.append((i, j))
            i = j
        else:
            i += 1
    if not runs:
        return a
    out, pos, xf = [], 0, int(0.012 * SR)
    for i, j in runs:
        keep = int(max_pause * SR)
        s0 = i * w + keep // 2; s1 = j * w - keep // 2
        seg = a[pos:s0].copy()
        out.append(seg); pos = s1
    out.append(a[pos:].copy())
    res = out[0]
    for seg in out[1:]:
        if len(res) > xf and len(seg) > xf:
            fade = np.linspace(0, 1, xf)
            res = np.concatenate([res[:-xf], res[-xf:] * (1 - fade) + seg[:xf] * fade, seg[xf:]])
        else:
            res = np.concatenate([res, seg])
    return res


def tempo(a, factor):
    """speed up / slow down without pitch change (ffmpeg atempo, WSOLA)"""
    if not factor or abs(factor - 1) < 1e-3:
        return a
    import subprocess, tempfile
    ff = "ffmpeg-bin/node_modules/ffmpeg-static/ffmpeg.exe"
    with tempfile.TemporaryDirectory() as td:
        i, o = os.path.join(td, "i.wav"), os.path.join(td, "o.wav")
        sf.write(i, a.astype(np.float32), SR, subtype="FLOAT")
        subprocess.run([ff, "-v", "error", "-y", "-i", i, "-filter:a", f"atempo={factor}", "-ar", str(SR), o], check=True)
        b, _ = sf.read(o)
    return b


def main():
    spec = json.load(open(os.path.join(ROOT, "vo", "script.json"), encoding="utf-8"))
    clips, lines, t = [], [], spec.get("lead", 0.12)
    for i, ln in enumerate(spec["lines"]):
        p = os.path.join(ROOT, "vo", "lines", ln["id"] + ".wav")
        if not os.path.exists(p):
            sys.exit(f"missing {p}")
        a, sr = sf.read(p, always_2d=True)
        a = a.mean(axis=1).astype(np.float64)
        if sr != SR:
            g = gcd(SR, sr); a = resample_poly(a, SR // g, sr // g)
        a = trim(a, spec.get("trim_db", -42), spec.get("pad", 0.04))
        a = squeeze(a, ln.get("max_pause", spec.get("max_pause")))
        a = tempo(a, ln.get("tempo", (spec.get("tempo") or {}).get(ln.get("who", "G"), 1.0)))
        # dialogue levelling: each line's speech RMS toward the character's target (whispers a little under),
        # gain limited to -4..+6 dB, so quiet deliveries are not masked by the bed or smeared by the reverb
        lev = spec.get("level")
        if lev:
            w = int(0.02 * SR); n = len(a) // w
            r = np.sqrt((a[: n * w].reshape(n, w) ** 2).mean(axis=1) + 1e-12)
            act = r[r > r.max() * 0.1]
            cur = 20 * np.log10(np.sqrt((act ** 2).mean()) + 1e-12) if len(act) else -30
            tgt = lev.get(ln.get("who", "G"), -19.0) - (2.5 if "whisper" in ln.get("delivery", "").lower() else 0.0)
            a = a * 10 ** (np.clip(tgt - cur, -4.0, 6.0) / 20)
        if i:
            t += ln.get("gap", spec.get("gap", 0.3))
        clips.append((t, a))
        lines.append({"id": ln["id"], "who": ln.get("who", "G"), "text": ln["text"], "start": round(t, 3), "end": round(t + len(a) / SR, 3), "file": f"vo/lines/{ln['id']}.wav", "sr": sr})
        t += len(a) / SR
    dur = t + spec.get("tail", 2.0)
    out = np.zeros(int(dur * SR) + 1)
    for t0, a in clips:
        k = int(round(t0 * SR)); out[k:k + len(a)] += a[: len(out) - k]
    out *= 0.89 / max(1e-6, float(np.abs(out).max())) if spec.get("normalize_peak", True) else 1.0
    os.makedirs(os.path.join(ROOT, "vo", "audio"), exist_ok=True); os.makedirs(os.path.join(ROOT, "vo", "data"), exist_ok=True)
    sf.write(os.path.join(ROOT, "vo", "audio", "vo.wav"), out.astype(np.float32), SR, subtype="FLOAT")
    json.dump({"duration": round(dur, 3), "lines": lines}, open(os.path.join(ROOT, "vo", "data", "join.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print(f"joined {len(lines)} lines · {dur:.2f} s")


if __name__ == "__main__":
    main()

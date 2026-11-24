"""Mix a film: Kokoro voice + synthesized bed (ducking under every word) + one synthesized SFX per visual cue,
normalized to -14 LUFS (ITU-R BS.1770, gated) with peaks held under -1 dBFS.

  python -I engine/tools/mix.py <slug>

Reads the cue list and the music plan from the page (story.js + vo/timing.js), vo/vo.wav. Writes audio/final.wav
(48 kHz stereo), audio/bed.wav, audio/sfx.wav, audio/cues.json, and prints the gates: loudness, and the voice-over-bed
margin in every phrase (must be ≥ 10 dB).
"""
import json
import sys
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import lfilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "audio"))
from mfcommon import dump_story, film_dir  # noqa: E402
import kit  # noqa: E402

SR = 48000
GAIN_DB = {"marker": -11, "pen": -13, "highlight": -11, "scribble": -10, "slide": -8, "page": -7, "tape": -11,
           "whoosh_out": -5, "whoosh_in": -6, "impact": -2, "typing": -13, "tick": -15, "swish": -9, "splash": -6}
LEAD = {"slide": 0.17, "whoosh_out": 0.12, "whoosh_in": 0.05, "page": 0.02}   # sound starts this much before the cue


def kweight(x):
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    return lfilter(b2, a2, lfilter(b1, a1, x, axis=0), axis=0)


def lufs(x):
    y = kweight(x if x.ndim == 2 else x[:, None])
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    pw = (y ** 2).sum(1)
    c = np.concatenate([[0], np.cumsum(pw)])
    starts = np.arange(0, len(pw) - blk, hop)
    z = (c[starts + blk] - c[starts]) / blk
    L = -0.691 + 10 * np.log10(z + 1e-20)
    z = z[L > -70]
    if not len(z):
        return -70.0
    rel = -0.691 + 10 * np.log10(z.mean()) - 10
    z = z[-0.691 + 10 * np.log10(z) > rel]
    return float(-0.691 + 10 * np.log10(z.mean()))


def envelope(x, att=0.015, rel=0.12):
    a = np.abs(x)
    hop = 240
    n = len(a) // hop
    fr = np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1))
    ka, kr = np.exp(-hop / (att * SR)), np.exp(-hop / (rel * SR))
    e = np.zeros(n)
    v = 0.0
    for i, f in enumerate(fr):
        k = ka if f > v else kr
        v = k * v + (1 - k) * f
        e[i] = v
    return np.interp(np.arange(len(a)), np.arange(n) * hop + hop / 2, e)


def limit(x, ceil=10 ** (-1.6 / 20), look=0.005, rel=0.08):   # -1.6 dBFS samples → ≤ -1 dBTP after AAC
    peak = np.abs(x).max(1)
    la = int(look * SR)
    need = np.minimum(1.0, ceil / np.maximum(peak, 1e-9))
    # lookahead: the gain reaches its target before the peak, then recovers
    from scipy.ndimage import minimum_filter1d
    g = minimum_filter1d(need, size=2 * la + 1)
    kr = np.exp(-1 / (rel * SR))
    out = np.empty_like(g)
    v = 1.0
    for i in range(len(g)):            # fast attack (already looked ahead), smooth release
        v = g[i] if g[i] < v else kr * v + (1 - kr) * g[i]
        out[i] = v
    return x * out[:, None]


def main(slug):
    root = film_dir(slug)
    info = dump_story(slug)
    dur = float(info["duration"])
    plan = info["sound"]
    cues = info["cues"]
    (root / "audio").mkdir(exist_ok=True)
    (root / "audio" / "cues.json").write_text(json.dumps({"duration": dur, "cues": cues, "sound": plan}, indent=1), encoding="utf-8")
    n = int(np.ceil(dur * SR))
    import warnings
    warnings.filterwarnings("ignore", category=wavfile.WavFileWarning)
    sr, v = wavfile.read(root / "vo" / "vo.wav")
    v = v.astype(np.float64)
    voice = np.zeros(n)
    voice[: min(n, len(v))] = v[:n]
    # bed
    sections = [(s["t"], s["energy"]) for s in plan["sections"]]
    bed = kit.bed(dur, sections, hit=plan.get("hit"), bpm=plan.get("bpm", 90))
    bed = bed[:n] if len(bed) >= n else np.pad(bed, ((0, n - len(bed)), (0, 0)))
    # duck under every word: -9 dB while the voice speaks (15 ms attack, 120 ms release)
    ev = envelope(voice)
    act = np.clip(ev / (0.12 * ev.max()), 0, 1)
    duck_db = float(plan.get("duck") or -9.0)
    bed_db = float(plan.get("bedDb") or -12.0)
    gain = 10 ** ((bed_db + duck_db * act) / 20)
    bed *= gain[:, None]
    # sfx: one per cue
    sfx = np.zeros((n, 2))
    for i, c in enumerate(cues):
        if c["type"] not in kit.SFX:
            print("  (no sound for cue type", c["type"], ")")
            continue
        x = kit.make(c["type"], c.get("dur"), seed=i)
        if x.ndim == 1:
            pan = 0.5 + 0.18 * np.sin(i * 2.1)
            x = np.stack([x * np.sqrt(1 - pan) * 1.41, x * np.sqrt(pan) * 1.41], 1) / 1.41
        g = 10 ** ((GAIN_DB.get(c["type"], -10) + float(c.get("gain") or 0)) / 20)
        a = int(max(0.0, c["t"] - LEAD.get(c["type"], 0.0)) * SR)
        m = min(len(x), n - a)
        if m > 0:
            sfx[a:a + m] += x[:m] * g
    mix = np.stack([voice, voice], 1) * 0.71 + bed + sfx
    # loudness: -14 LUFS integrated, peaks ≤ -1 dBFS
    for _ in range(3):
        L = lufs(mix)
        mix *= 10 ** ((-14.0 - L) / 20)
        mix = limit(mix)
    L = lufs(mix)
    wavfile.write(root / "audio" / "final.wav", SR, mix.astype(np.float32))
    wavfile.write(root / "audio" / "bed.wav", SR, bed.astype(np.float32))
    wavfile.write(root / "audio" / "sfx.wav", SR, sfx.astype(np.float32))
    # gate: voice ≥ 10 dB over the bed in every phrase (K-weighted power over the voiced part of each line)
    tm = json.loads((root / "vo" / "timing.json").read_text(encoding="utf-8"))
    kv = kweight(voice[:, None] * 0.71)[:, 0]
    kb = kweight(bed).sum(1) / 2
    margins = []
    for ln in tm["lines"]:
        a, b = int(ln["start"] * SR), int(ln["end"] * SR)
        on = act[a:b] > 0.5
        pv = (kv[a:b][on] ** 2).mean()
        pb = (kb[a:b][on] ** 2).mean()
        margins.append((ln["id"], 10 * np.log10(pv / max(pb, 1e-20))))
    peak = 20 * np.log10(np.abs(mix).max())
    print(f"final.wav {dur:.2f} s · integrated {L:.2f} LUFS · peak {peak:.2f} dBFS · {len(cues)} sfx cues")
    worst = min(m for _, m in margins)
    print(f"voice over bed per phrase (dB): min {worst:.1f}  " + "  ".join(f"{i} {m:.1f}" for i, m in margins))
    if worst < 10:
        print("!! a phrase is under the 10 dB gate: lower story.sound.bedDb")


if __name__ == "__main__":
    main(sys.argv[1])

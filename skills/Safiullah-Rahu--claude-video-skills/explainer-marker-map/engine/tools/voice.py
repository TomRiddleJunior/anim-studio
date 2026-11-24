"""Record the voice with Kokoro-82M (PyTorch; replaces kokoro-onnx — same model and voices, misaki G2P).

  "$HOME/.generative-music-video/venv/Scripts/python.exe" -I engine/tools/voice.py <slug>

From <slug>/script.json: voice (am_michael), speed (1.18), lead, respell map, lines. One wav per line
(vo/lines/<id>.wav), joined with 0.3 s between lines, then every pause over maxPause (0.28 s) shrunk to pauseTo (0.2 s).
Writes vo/vo.wav (48 kHz float) and vo/joined.json (line spans in the final wav). Word times come next from align.py
(faster-whisper on this final wav), which writes vo/timing.js.
"""
import json
import os
import re
import sys
from pathlib import Path

if (Path.home() / ".generative-music-video").exists():
    os.environ.setdefault("HF_HOME", str(Path.home() / ".generative-music-video" / "cache" / "hf"))
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")
import warnings  # noqa: E402

warnings.filterwarnings("ignore")
import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402
from scipy.signal import resample_poly  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mfcommon import film_dir  # noqa: E402

SR = 24000


def respell(text, table):
    for word, rep in table.items():
        text = re.sub(rf"(?<![\w\[]){re.escape(word)}(?![\w\]])", rep, text)
    return text


def trim(a, thr_db=-48):
    hop = 240
    n = len(a) // hop
    rms = np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
    thr = rms.max() * 10 ** (thr_db / 20)
    on = np.where(rms > thr)[0]
    s0 = max(0, (on[0] - 4) * hop)
    s1 = min(len(a), (on[-1] + 8) * hop)
    return a[s0:s1]


def shrink_pauses(a, max_pause, pause_to, thr_db=-46, protect=()):
    """Shrink every silent run longer than max_pause to pause_to (keeps half on each side, short crossfades).
    Returns the new audio and a function mapping old sample index → new sample index."""
    hop = 120  # 5 ms
    n = len(a) // hop
    rms = np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
    thr = rms.max() * 10 ** (thr_db / 20)
    quiet = rms < thr
    runs, i = [], 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            if (j - i) * hop / SR > max_pause and i > 0 and j < n:   # never the lead-in or the tail
                runs.append((i * hop, j * hop))
            i = j
        else:
            i += 1
    keep = int(pause_to * SR / 2)
    out, cuts, pos = [], [], 0
    for s0, s1 in runs:
        a0, a1 = s0 + keep, s1 - keep
        out.append(a[pos:a0])
        cuts.append((a0, a1))
        pos = a1
    out.append(a[pos:])
    y = np.concatenate(out)

    def remap(k):
        d = 0
        for a0, a1 in cuts:
            if k >= a1:
                d += a1 - a0
            elif k > a0:
                return a0 - d
        return k - d
    return y, remap, len(cuts)


def main(slug):
    for s in (sys.stdout, sys.stderr):
        if hasattr(s, "reconfigure"):
            s.reconfigure(encoding="utf-8", errors="replace")
    root = film_dir(slug)
    spec = json.loads((root / "script.json").read_text(encoding="utf-8"))
    from kokoro import KPipeline
    pipe = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M", device="cpu")
    voice, speed = spec.get("voice", "am_michael"), float(spec.get("speed", 1.18))
    table = spec.get("respell", {})
    (root / "vo" / "lines").mkdir(parents=True, exist_ok=True)
    gap = np.zeros(int(0.3 * SR), np.float32)
    lead = np.zeros(int(float(spec.get("lead", 0.35)) * SR), np.float32)
    parts, spans, pos = [lead], [], len(lead)
    for ln in spec["lines"]:
        text = respell(ln["text"], table)
        ps, _ = pipe.g2p(text)
        a = np.concatenate([(r.audio.cpu().numpy() if hasattr(r.audio, "cpu") else np.asarray(r.audio)).astype(np.float32)
                            for r in pipe(text, voice=voice, speed=speed)])
        a = trim(a)
        f = int(0.006 * SR)
        a[:f] *= np.linspace(0, 1, f)
        a[-f:] *= np.linspace(1, 0, f)
        sf.write(root / "vo" / "lines" / f"{ln['id']}.wav", a, SR)
        if spans:
            parts.append(gap)
            pos += len(gap)
        spans.append((ln["id"], pos, pos + len(a)))
        parts.append(a)
        pos += len(a)
        print(f"{ln['id']:>9s} {len(a) / SR:5.2f} s  {ps}")
    joined = np.concatenate(parts)
    y, remap, ncut = shrink_pauses(joined, float(spec.get("maxPause", 0.28)), float(spec.get("pauseTo", 0.2)))
    y = y[: remap(len(joined))]
    peak = float(np.abs(y).max())
    y = y * (0.89 / max(peak, 1e-6))
    sf.write(root / "vo" / "vo24.wav", y, SR, subtype="FLOAT")
    y48 = resample_poly(y, 2, 1).astype(np.float32)
    sf.write(root / "vo" / "vo.wav", y48, 48000, subtype="FLOAT")
    js = {"sr": 48000, "duration": round(len(y) / SR, 3), "lead": float(spec.get("lead", 0.35)), "pausesShrunk": ncut,
          "lines": [{"id": i, "start": round(remap(s0) / SR, 3), "end": round(remap(s1) / SR, 3)} for i, s0, s1 in spans]}
    (root / "vo" / "joined.json").write_text(json.dumps(js, indent=1), encoding="utf-8")
    print(f"\nvo.wav {js['duration']:.2f} s, {ncut} pauses shrunk to {spec.get('pauseTo', 0.2)} s")


if __name__ == "__main__":
    main(sys.argv[1])

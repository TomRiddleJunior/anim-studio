"""Placeholder voice: one wav per script line with Kokoro-82M (local, Apache-2.0).

Writes vo/lines/<id>.wav (48 kHz mono float, trimmed to the voiced span: 0.06 s before the first word, 0.15 s after
the last, 10 ms fades). Nothing else depends on Kokoro: tools/join_vo.py joins whatever wavs are in vo/lines/ and
tools/align_vo.py times every word with faster-whisper. To re-voice with another engine, write vo/lines/<id>.wav
yourself and skip this script.

usage: "$HOME/.generative-music-video/venv/Scripts/python.exe" -I tools/voice_kokoro.py [line ids...]
"""
import json
import os
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

ROOT = Path(__file__).resolve().parent.parent
SR_TTS, SR = 24000, 48000


def main(only):
    for s in (sys.stdout, sys.stderr):
        if hasattr(s, "reconfigure"):
            s.reconfigure(encoding="utf-8", errors="replace")
    spec = json.loads((ROOT / "vo" / "script.json").read_text(encoding="utf-8"))
    import torch
    from kokoro import KPipeline
    pipes = {}

    def pipe_for(voice):
        lang = voice[0] if voice[0] in "abefhijpz" else "a"
        if lang not in pipes:
            pipes[lang] = KPipeline(lang_code=lang, repo_id="hexgrad/Kokoro-82M", device="cuda" if torch.cuda.is_available() else "cpu")
        return pipes[lang]

    out = ROOT / "vo" / "lines"
    out.mkdir(parents=True, exist_ok=True)
    for ln in spec["lines"]:
        if only and ln["id"] not in only:
            continue
        voice, speed = ln.get("voice", spec["voice"]), ln.get("speed", spec.get("speed", 1.0))
        audio, starts, ends, off = [], [], [], 0.0
        for r in pipe_for(voice)(ln["text"], voice=voice, speed=speed):
            a = r.audio.cpu().numpy() if hasattr(r.audio, "cpu") else np.asarray(r.audio)
            for tk in r.tokens or []:
                if tk.start_ts is not None:
                    starts.append(tk.start_ts + off)
                if tk.end_ts is not None:
                    ends.append(tk.end_ts + off)
            audio.append(a.astype(np.float32)); off += len(a) / SR_TTS
        a = np.concatenate(audio)
        s0 = max(0.0, (min(starts) if starts else 0.0) - 0.06)
        s1 = min(len(a) / SR_TTS, (max(ends) if ends else len(a) / SR_TTS) + 0.15)
        seg = a[int(s0 * SR_TTS):int(s1 * SR_TTS)].copy()
        f = int(0.01 * SR_TTS); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
        seg = resample_poly(seg, 2, 1).astype(np.float32)
        sf.write(out / f"{ln['id']}.wav", seg, SR, subtype="FLOAT")
        print(f"{ln['id']}  {len(seg) / SR:5.2f} s  {voice} x{speed}  {ln['text']}")


if __name__ == "__main__":
    main(set(sys.argv[1:]))

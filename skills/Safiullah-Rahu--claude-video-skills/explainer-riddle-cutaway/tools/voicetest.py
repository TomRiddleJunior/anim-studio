"""Speak one test line with several Kokoro voices, report median f0 and speaking rate. venv python -I voicetest.py"""
import os
import sys
from pathlib import Path

if (Path.home() / ".generative-music-video").exists():
    os.environ.setdefault("HF_HOME", str(Path.home() / ".generative-music-video" / "cache" / "hf"))
import warnings

warnings.filterwarnings("ignore")
import numpy as np
import soundfile as sf
from kokoro import KPipeline

TXT = "This man checks into Room 305 every Friday. And every night at exactly 1:12, he calls the room next door."
VOICES = sys.argv[1].split("|") if len(sys.argv) > 1 else ["am_puck", "am_echo", "am_adam", "am_eric", "am_liam", "am_michael", "am_fenrir"]
SPEED = float(sys.argv[2]) if len(sys.argv) > 2 else 1.1
pipe = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M", device="cpu")
out = Path(__file__).parent / "voices"
out.mkdir(exist_ok=True)


def f0(a, sr=24000):
    n = int(0.04 * sr)
    lev = np.array([np.sqrt(np.mean(a[i:i + n] ** 2)) for i in range(0, len(a) - n, n // 2)])
    thr = np.percentile(lev, 70) * 0.5
    fs = []
    for k, i in enumerate(range(0, len(a) - n, n // 2)):
        if lev[k] < thr:
            continue
        x = a[i:i + n] - a[i:i + n].mean()
        r = np.correlate(x, x, "full")[n - 1:]
        lo, hi = int(sr / 350), int(sr / 60)
        j = lo + np.argmax(r[lo:hi])
        if r[j] > 0.45 * r[0]:
            fs.append(sr / j)
    return np.median(fs), np.percentile(fs, 10), np.percentile(fs, 90)


for v in VOICES:
    a = np.concatenate([np.asarray(r.audio) for r in pipe(TXT, voice=v, speed=SPEED)])
    sf.write(out / f"{v.replace(',', '+')}.wav", a, 24000)
    m, p10, p90 = f0(a)
    print(f"{v:22s} f0 {m:5.0f} Hz (p10/p90 {p10:.0f}/{p90:.0f})  {len(a) / 24000:5.2f} s  {len(TXT.split()) / (len(a) / 24000) * 60:5.0f} wpm")

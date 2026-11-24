"""Measure the real tempo of song takes with the generative-music-video analyser's estimator (drum stem from Demucs
htdemucs + mix onset envelopes, octave candidates, grid fit) and report how far each is from a target.

  ~/.generative-music-video/venv/Scripts/python.exe tools/tempo.py [--target 128] [files...]
Writes song/candidates/tempo.json. A take within ~±5% of the target can be nudged with ffmpeg atempo (tools/nudge.py);
farther than that, regenerate.
"""
import argparse, glob, json, sys
from pathlib import Path
import numpy as np
import soundfile as sf
import librosa
import torch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path.home() / ".claude/skills/generative-music-video/scripts/analysis"))
import common  # noqa: E402,F401  (cache dirs)
from analyze_audio import onset_env, estimate_tempo, fit_grid  # noqa: E402


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("files", nargs="*"); ap.add_argument("--target", type=float, default=128.0)
    a = ap.parse_args()
    files = a.files or sorted(glob.glob(str(ROOT / "song" / "candidates" / "*.flac")))
    from demucs.pretrained import get_model
    from demucs.apply import apply_model
    m = get_model("htdemucs"); m.eval()
    dev = "cuda" if torch.cuda.is_available() else "cpu"
    out = {}
    for f in files:
        y, sr = sf.read(f, always_2d=True)
        yy = librosa.resample(y.T, orig_sr=sr, target_sr=m.samplerate) if sr != m.samplerate else y.T
        with torch.no_grad():
            st = apply_model(m, torch.tensor(yy, dtype=np.float32 if False else torch.float32)[None].to(dev), device=dev, split=True, overlap=0.1)[0].cpu().numpy()
        drums = st[m.sources.index("drums")].mean(0); mix = yy.mean(0); sr2 = m.samplerate
        dur = len(mix) / sr2
        o, ofps = onset_env(drums, mix, sr2)
        bpm, off, s, cands = estimate_tempo(o, ofps, drums, mix, sr2, dur)
        # how strong is a grid at the target (and its octaves) compared with the winner?
        tgt = {}
        for t in (a.target, a.target / 2, a.target * 0.75):
            ts, tb, _ = fit_grid(o, ofps, t, dur, span=0.06)
            tgt[round(t, 1)] = (round(tb, 2), round(ts, 3))
        out[Path(f).name] = {"bpm": round(bpm, 2), "score": round(s, 3), "cands": [(round(b, 2), round(x, 3)) for b, x in cands],
                             "near_target": tgt, "dur": round(dur, 1), "off_target_pct": round(100 * (bpm / a.target - 1), 1)}
        print(f"{Path(f).name:<16} {bpm:7.2f} BPM ({out[Path(f).name]['off_target_pct']:+.1f}% vs {a.target:g})  dur {dur:6.1f}s  cands {out[Path(f).name]['cands'][:3]}", flush=True)
    tp = ROOT / "song" / "candidates" / "tempo.json"
    prev = json.loads(tp.read_text(encoding="utf-8")) if tp.exists() else {}
    tp.write_text(json.dumps({**prev, **out}, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()

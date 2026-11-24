"""Stem separation with Demucs (vocals / drums / bass / other) -> analysis/stems/*.wav

Runs Demucs through its Python API on analysis/work/mix.wav (our own gapless decode, so the stems share
the renderer's timeline), then measures the stems' offset against the mix by cross-correlation and stores
it (should be 0 samples; anything else is corrected on load).

  python separate.py --project <dir> [--model htdemucs_ft|htdemucs] [--shifts 1]
"""
import common  # noqa: F401  (cache dirs first)
import sys

import numpy as np
import soundfile as sf


def main():
    ap = common.project_arg(__doc__)
    ap.add_argument("--model", default="htdemucs_ft", help="htdemucs_ft (best, 4x slower) or htdemucs")
    ap.add_argument("--shifts", type=int, default=1, help="random shifts (quality vs time)")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    P = common.Project(a.project)
    if P.has_stems() and not a.force:
        print("stems exist:", P.stems)
        return
    import torch
    from demucs.apply import apply_model
    from demucs.pretrained import get_model

    dev = common.device()
    mix, sr = sf.read(str(P.ensure_mix()), dtype="float32", always_2d=True)  # (n, 2)
    model = get_model(a.model)
    model.to(dev).eval()
    if sr != model.samplerate:
        raise SystemExit(f"mix.wav is {sr} Hz, model wants {model.samplerate}")
    wav = torch.from_numpy(mix.T.copy())
    ref = wav.mean(0)
    mu, sd = ref.mean(), ref.std() + 1e-8
    wav = (wav - mu) / sd
    print(f"demucs {a.model} on {dev}: {mix.shape[0] / sr:.1f} s ...", flush=True)
    with torch.inference_mode():
        out = apply_model(model, wav[None], device=dev, shifts=a.shifts, split=True, overlap=0.25, progress=True)[0]
    out = out * sd + mu
    for src, name in zip(out, model.sources):
        sf.write(str(P.stems / f"{name}.wav"), src.cpu().numpy().T, sr, subtype="FLOAT")
    # offset check: sum of stems vs mix (mono), 30 s window around the middle
    tot = sum(sf.read(str(P.stems / f"{n}.wav"), dtype="float32", always_2d=True)[0].mean(1) for n in model.sources)
    m = mix.mean(1)
    c = len(m) // 2
    a0, a1 = max(0, c - 15 * sr), min(len(m), c + 15 * sr)
    x, y = m[a0:a1], tot[a0:a1]
    n = 1 << int(np.ceil(np.log2(len(x) * 2)))
    xc = np.fft.irfft(np.fft.rfft(y, n) * np.conj(np.fft.rfft(x, n)), n)
    lag = int(np.argmax(np.abs(np.concatenate([xc[-2000:], xc[:2001]])))) - 2000
    common.write_json(P.work / "stem_offset.json", dict(samples=lag, note="stems lag the mix by this many samples; load_stem() removes it"))
    print("wrote stems to", P.stems, f"(offset vs mix: {lag} samples)")


if __name__ == "__main__":
    sys.exit(main())

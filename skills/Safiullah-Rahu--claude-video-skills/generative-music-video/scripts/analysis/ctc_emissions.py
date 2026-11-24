# Adapted from mexicat/pdoom-video (MIT); see LICENSE-pdoom-video.
"""Frame-wise CTC log-probabilities (20 ms frames) of the vocal stem, from char-level acoustic models.

  mms   : torchaudio MMS_FA (multilingual, romanized a-z + ', trained for forced alignment) — any language
  lv60k : torchaudio WAV2VEC2_ASR_LARGE_LV60K_960H (English) — a second, independent opinion for English
Sources: vocals (Demucs vocal stem, mono sum), vocL / vocR (its left / right channel: doubled choruses are
often panned L/R, so each channel is closer to one voice). Computed on overlapping chunks with context and
stitched -> analysis/work/emission_<model>[_<source>].npy  [frames, vocab]

  python ctc_emissions.py --project <dir> [--models mms,lv60k] [--sources vocals,vocL,vocR]
"""
import common
import sys

import numpy as np

HOP = 320  # samples @16k -> 20 ms


def load_source(P, source):
    if source in ("vocL", "vocR"):
        y, s = P.load_stem("vocals", sr=16000, mono=False)
        if y.ndim == 1:
            return y
        return y[0 if source == "vocL" else 1]
    y, _ = P.load_stem("vocals", sr=16000)
    return y


def compute(P, name, source="vocals", chunk_s=20.0, ctx_s=3.0, force=False):
    import torch
    import torchaudio
    tag = name if source == "vocals" else f"{name}_{source}"
    out_p = P.work / f"emission_{tag}.npy"
    if out_p.exists() and not force:
        print("exists:", out_p.name)
        return
    bundle = {"mms": torchaudio.pipelines.MMS_FA, "lv60k": torchaudio.pipelines.WAV2VEC2_ASR_LARGE_LV60K_960H}[name]
    model = bundle.get_model(with_star=False) if name == "mms" else bundle.get_model()
    dev = common.device()
    model = model.to(dev).eval()
    y = load_source(P, source).astype(np.float32)
    y = y / (np.abs(y).max() + 1e-9)
    n_frames = len(y) // HOP
    chunk, ctx = int(chunk_s * 16000), int(ctx_s * 16000)
    out = None
    for s in range(0, len(y), chunk):
        a, b = max(0, s - ctx), min(len(y), s + chunk + ctx)
        x = torch.from_numpy(y[a:b]).float()[None].to(dev)
        with torch.inference_mode():
            em, _ = model(x)
            em = torch.log_softmax(em, dim=-1)[0].float().cpu().numpy()
        if out is None:
            out = np.full((n_frames, em.shape[1]), np.nan, np.float32)
        f0 = a // HOP
        lo, hi = s // HOP, min(n_frames, (s + chunk) // HOP)
        seg = em[lo - f0: hi - f0]
        out[lo: lo + len(seg)] = seg
    last = np.where(~np.isnan(out[:, 0]))[0].max()
    out[last + 1:] = out[last]
    np.save(out_p, out)
    print(tag, out.shape, "on", dev)


def main():
    ap = common.project_arg(__doc__)
    ap.add_argument("--models", default=None, help="comma list (default: mms,lv60k for English, mms otherwise)")
    ap.add_argument("--sources", default="vocals,vocL,vocR")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    P = common.Project(a.project)
    models = (a.models or ("mms,lv60k" if P.language.startswith("en") else "mms")).split(",")
    for src in a.sources.split(","):
        for m in models:
            compute(P, m.strip(), src.strip(), force=a.force)


if __name__ == "__main__":
    sys.exit(main())

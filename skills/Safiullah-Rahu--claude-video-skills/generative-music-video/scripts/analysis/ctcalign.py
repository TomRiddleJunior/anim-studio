# Adapted from mexicat/pdoom-video (MIT); see LICENSE-pdoom-video.
"""CTC forced alignment of the full lyric text against the vocal stem (one global Viterbi pass).

* Emissions: char-level CTC models (MMS_FA, wav2vec2 LV60K) mapped to a common alphabet (blank, a-z, ');
  used individually or fused (probability mixture) for a more robust single path.
* All lines are aligned in ONE pass over the whole song. A "garbage" star token sits between lines (and at
  both ends); its per-frame score is (best token log-prob - margin), so it absorbs ad-libs, backing vocals
  and instrumental passages that are not in the lyric text, while lyric words still win where they match.
* Optional per-line windows (from LRC stamps) and per-subword anchors constrain the path.
"""
import common  # noqa: F401
import numpy as np
import numba

FRAME = 0.02  # s per emission frame
ALPHA = ["-"] + list("abcdefghijklmnopqrstuvwxyz'")
AIDX = {c: i for i, c in enumerate(ALPHA)}


def _labels(model):
    import torchaudio
    if model.startswith("mms"):
        return list(torchaudio.pipelines.MMS_FA.get_labels(star=None))
    return list(torchaudio.pipelines.WAV2VEC2_ASR_LARGE_LV60K_960H.get_labels())


def _common_logp(P, tag, n_frames):
    em = np.load(P.work / f"emission_{tag}.npy").astype(np.float64)
    if len(em) < n_frames:
        em = np.concatenate([em, np.repeat(em[-1:], n_frames - len(em), 0)])
    em = em[:n_frames]
    labs = _labels(tag)
    out = np.full((em.shape[0], len(ALPHA)), -1e4)
    blank_cols = [labs.index("-")] + ([labs.index("|")] if "|" in labs else [])
    out[:, 0] = np.logaddexp.reduce(em[:, blank_cols], axis=1)
    for i, c in enumerate(labs):
        k = c.lower()
        if k in AIDX and k != "-":
            out[:, AIDX[k]] = em[:, i]
    out -= np.logaddexp.reduce(out, axis=1, keepdims=True)
    return out


def available(P):
    """Emission tags computed for this project, e.g. ['mms', 'lv60k', 'mms_vocL', ...]."""
    return sorted(p.stem[len("emission_"):] for p in P.work.glob("emission_*.npy"))


def n_frames(P):
    return max(len(np.load(P.work / f"emission_{t}.npy", mmap_mode="r")) for t in available(P))


def emissions(P, kind):
    """kind: a single tag ('mms', 'lv60k_vocL', …), 'fused' (mixture of every computed tag), or
    'fused_<source>' (both models on one source: '' = mono sum, vocL, vocR)."""
    tags = available(P)
    if not tags:
        raise SystemExit("no emissions: run ctc_emissions.py first")
    N = n_frames(P)
    if kind == "fused":
        es = [_common_logp(P, t, N) for t in tags]
    elif kind.startswith("fused_"):
        src = kind[len("fused_"):]
        es = [_common_logp(P, t, N) for t in tags if (t.split("_", 1)[1] if "_" in t else "vocals") == (src or "vocals")]
    else:
        es = [_common_logp(P, kind, N)]
    if not es:
        raise SystemExit(f"no emissions for {kind} (have {tags})")
    return np.logaddexp.reduce(np.stack(es), axis=0) - np.log(len(es))


@numba.njit(cache=True)
def _viterbi(E, tgt, lo, hi):
    T = E.shape[0]
    L = len(tgt)
    S = 2 * L + 1
    NEG = -1e18
    prev = np.full(S, NEG)
    cur = np.full(S, NEG)
    bp = np.zeros((T, S), np.int8)  # 0 stay, 1 from s-1, 2 from s-2
    prev[0] = E[0, 0]
    if lo[0] <= 0 <= hi[0]:
        prev[1] = E[0, tgt[0]]
    for t in range(1, T):
        for s in range(S):
            if s % 2 == 1:
                j = (s - 1) // 2
                if t < lo[j] or t > hi[j]:
                    cur[s] = NEG
                    continue
                e = E[t, tgt[j]]
            else:
                e = E[t, 0]
            best = prev[s]
            arg = 0
            if s >= 1 and prev[s - 1] > best:
                best = prev[s - 1]
                arg = 1
            if s >= 2 and s % 2 == 1:
                j = (s - 1) // 2
                if tgt[j] != tgt[j - 1] and prev[s - 2] > best:
                    best = prev[s - 2]
                    arg = 2
            cur[s] = best + e
            bp[t, s] = arg
        for s in range(S):
            prev[s] = cur[s]
    if prev[S - 1] >= prev[S - 2]:
        s = S - 1
    else:
        s = S - 2
    score = prev[s]
    path = np.zeros(T, np.int64)
    for t in range(T - 1, -1, -1):
        path[t] = s
        a = bp[t, s]
        s -= a
    return path, score


def build_targets(units_per_line):
    """units_per_line: [[ [sub, sub…] per token ] per line]. Returns (tgt ids, index, star id).
    index entries: (li, ti, si, pos_a, pos_b)."""
    star = len(ALPHA)
    tgt, index = [star], []
    for li, toks in enumerate(units_per_line):
        for ti, subs in enumerate(toks):
            for si, sw in enumerate(subs):
                a = len(tgt)
                tgt.extend(AIDX[c] for c in sw if c in AIDX)
                if len(tgt) == a:  # a sub-word with no alignable letters: give it one blank-ish 'a'
                    tgt.append(AIDX["a"])
                index.append((li, ti, si, a, len(tgt)))
        tgt.append(star)
    return tgt, index, star


def align(E, units_per_line, margin=1.5, anchors=None, line_windows=None):
    """Global alignment. anchors: {(li, ti, si): (t_lo, t_hi)}; line_windows: {li: (t_lo, t_hi)} seconds.
    Returns spans {(li, ti): [(start, end, meanprob, char_spans), …] per sub-word}, score, path, tgt."""
    T = E.shape[0]
    star_col = E.max(axis=1, keepdims=True) - margin
    Ex = np.concatenate([E, star_col], axis=1)
    tgt, index, star = build_targets(units_per_line)
    tgt = np.array(tgt, np.int64)
    lo = np.zeros(len(tgt), np.int64)
    hi = np.full(len(tgt), T - 1, np.int64)
    for (li, ti, si, a, b) in index:
        if line_windows and li in line_windows:
            wl, wh = line_windows[li]
            if wl is not None:
                lo[a:b] = np.maximum(lo[a:b], int(max(0, wl) / FRAME))
            if wh is not None:
                hi[a:b] = np.minimum(hi[a:b], int(min(T * FRAME, wh) / FRAME))
        if anchors and (li, ti, si) in anchors:
            wl, wh = anchors[(li, ti, si)]
            if wl is not None:
                lo[a:b] = np.maximum(lo[a:b], int(round(wl / FRAME)))
            if wh is not None:
                hi[a:b] = np.minimum(hi[a:b], int(round(wh / FRAME)))
    path, score = _viterbi(Ex, tgt, lo, hi)
    tokpos = np.where(path % 2 == 1, (path - 1) // 2, -1)
    P_ = np.exp(Ex[np.arange(T), np.where(tokpos >= 0, tgt[np.maximum(tokpos, 0)], 0)])
    spans = {}
    for (li, ti, si, a, b) in index:
        fr = np.where((tokpos >= a) & (tokpos < b))[0]
        if len(fr) == 0:  # (can only happen with impossible windows) — pin it to the previous span
            prev = spans.get((li, ti), [None])[-1] if spans.get((li, ti)) else None
            t0 = prev[1] if prev else 0.0
            spans.setdefault((li, ti), []).append((t0, t0 + FRAME, 0.0, []))
            continue
        chars = [np.where(tokpos == p)[0] for p in range(a, b)]
        spans.setdefault((li, ti), []).append(
            (fr.min() * FRAME, (fr.max() + 1) * FRAME, float(P_[fr].mean()),
             [(c.min() * FRAME, (c.max() + 1) * FRAME) for c in chars if len(c)]))
    return spans, float(score), path, tgt


def word_table(spans, tokens_per_line):
    out = []
    for li, toks in enumerate(tokens_per_line):
        for ti, tok in enumerate(toks):
            sp = spans[(li, ti)]
            out.append(dict(li=li, ti=ti, w=tok, start=sp[0][0], end=sp[-1][1],
                            conf=float(np.mean([s[2] for s in sp])), subs=[(s[0], s[1]) for s in sp]))
    return out

"""Music analysis -> data/audio.json (+ analysis/qa/audio_*.png)

  * beat grid: tempo estimated from drum+mix onset envelopes (octave candidates, mild prior toward 80-160 BPM),
    then a constant-tempo grid fitted over the whole song (tempo + phase search) with the phase refined on kick
    attacks. If the tempo drifts (live playing) a dynamic beat track is used instead.
  * downbeats: bar phase scored from kick / bass on beat 1, backbeat snares, and harmonic change (chroma) at the
    bar line. Override with --downbeat <time of any downbeat> and --meter 3 for 3/4.
  * sections: from the aligned lyrics (data/lyrics.json): [Section] tags from the lyrics source, else repeated
    blocks = chorus; plus intro / break / outro for instrumental stretches. Snapped to downbeats (a line's short
    pickup, < 2 beats, stays in the previous section). Override with analysis/sections.json.
  * envelopes (100 fps, 0..1): rms/low/mid/high of the mix, vocal/drums/bass/other stem RMS
  * onsets [time, strength 0-1]: kick / snare / hat from the drums stem, vocal note onsets from the vocal stem
  * key estimate (Krumhansl-Schmuckler) for title cards

  python analyze_audio.py --project <dir> [--bpm 128] [--meter 4] [--downbeat 1.72] [--plots]
"""
import common
import math
import re
import sys

import numpy as np
import librosa
from scipy.ndimage import maximum_filter1d, median_filter, uniform_filter1d
from scipy.signal import butter, find_peaks, sosfiltfilt

SR = 44100
FPS = 100


def band_sos(lo, hi, sr):
    if lo and hi:
        return butter(4, [lo, hi], btype="band", fs=sr, output="sos")
    if hi:
        return butter(4, hi, btype="low", fs=sr, output="sos")
    return butter(4, lo, btype="high", fs=sr, output="sos")


def frame_rms(x, sr, fps=FPS, win=2048):
    hop = sr / fps
    n = int(math.ceil(len(x) / sr * fps))
    pad = np.pad(x, (win // 2, win // 2 + int(hop) + 2))
    idx = (np.arange(n) * hop).astype(int)
    c = np.concatenate([[0.0], np.cumsum(pad.astype(np.float64) ** 2)])
    e = (c[idx + win] - c[idx]) / win
    return np.sqrt(np.maximum(e, 0))


def smooth_env(x, fps=FPS, attack=0.010, release=0.090):
    """One-pole follower: fast attack, slower release (visual friendly)."""
    aa, ar = math.exp(-1 / (attack * fps)), math.exp(-1 / (release * fps))
    y = np.empty_like(x)
    s = 0.0
    for i, v in enumerate(x):
        a = aa if v > s else ar
        s = a * s + (1 - a) * v
        y[i] = s
    return y


def norm01(x, pct=99.0):
    return np.clip(x / (np.percentile(x, pct) + 1e-12), 0, 1)


def band_onsets(x, sr, lo, hi, win=0.010, hop_s=0.002, min_gap=0.08, rel_db=10.0):
    """Onsets in a frequency band: steepest rise of the band's log-energy envelope; strength = peak dB."""
    xb = sosfiltfilt(band_sos(lo, hi, sr), x)
    h, w = int(hop_s * sr), int(win * sr)
    e = np.convolve(xb.astype(np.float64) ** 2, np.ones(w) / w, mode="same")[::h]
    db = 10 * np.log10(e + 1e-10)
    fps = sr / h
    d = uniform_filter1d(np.diff(db, prepend=db[0]), 3)
    lag = int(0.02 * fps)
    rise = db - np.concatenate([np.full(lag, db[0]), db[:-lag]])
    floor = median_filter(db, int(1.0 * fps) | 1)
    pk, _ = find_peaks(rise, height=rel_db, distance=max(1, int(min_gap * fps)))
    times, strength = [], []
    for p in pk:
        a = max(0, p - lag)
        q = a + int(np.argmax(d[a:p + 1]))
        peak_db = db[p:p + int(0.03 * fps)].max()
        if peak_db < floor[p] + 3:
            continue
        times.append(q / fps)
        strength.append(peak_db)
    return np.array(times), np.array(strength)


def drum_onsets(d, sr):
    """Kick (<120 Hz attacks), snare (1.5-5 kHz attacks with a long noisy 0.5-5 kHz tail), hat (>7 kHz, not on a
    snare or kick)."""
    kt, kdb = band_onsets(d, sr, None, 120, win=0.012, min_gap=0.15, rel_db=12)
    st, sdb = band_onsets(d, sr, 1500, 5000, win=0.010, min_gap=0.15, rel_db=10)
    if len(st):
        xb = sosfiltfilt(band_sos(500, 5000, sr), d)
        e = np.sqrt(np.convolve(xb.astype(np.float64) ** 2, np.ones(441) / 441, mode="same"))
        tail = np.array([20 * np.log10(e[int((t + 0.04) * sr):int((t + 0.12) * sr)].mean() + 1e-9) for t in st])
        rel = np.array([tail[i] - tail[np.abs(st - st[i]) < 2.5].max() for i in range(len(st))])
        keep = (rel > -8) & (tail > np.percentile(tail, 95) - 25)
        st, sdb = st[keep], tail[keep]
    ht, hdb = band_onsets(d, sr, 7000, None, win=0.006, min_gap=0.06, rel_db=9)
    for other, gap in ((st, 0.04), (kt, 0.03)):
        if len(other) and len(ht):
            keep = np.min(np.abs(ht[:, None] - other[None, :]), axis=1) > gap
            ht, hdb = ht[keep], hdb[keep]
    return (kt, kdb), (st, sdb), (ht, hdb)


def strength01(v):
    if len(v) == 0:
        return v
    lo, hi = np.percentile(v, 5), np.percentile(v, 95)
    return np.clip((v - lo) / (hi - lo + 1e-9) * 0.8 + 0.2, 0, 1)


# ------------------------------------------------------------------------- tempo / grid
def onset_env(drums, mix, sr):
    hop = 32
    y1 = librosa.resample(drums, orig_sr=sr, target_sr=22050)
    y2 = librosa.resample(mix, orig_sr=sr, target_sr=22050)
    od = librosa.onset.onset_strength(y=y1, sr=22050, hop_length=hop, lag=1, max_size=1)
    om = librosa.onset.onset_strength(y=y2, sr=22050, hop_length=hop, lag=1, max_size=1)
    n = min(len(od), len(om))
    return od[:n] / (np.percentile(od, 99) + 1e-9) + om[:n] / (np.percentile(om, 99) + 1e-9), 22050 / hop


def grid_scores(o, ofps, P, offs, duration):
    """Mean onset strength (max over ±1 frame) on grids of period P for each phase offset in offs."""
    k = np.arange(int(duration / P) + 1)
    ts = offs[:, None] + P * k[None, :]
    idx = np.round(ts * ofps).astype(int)
    valid = (idx > 2) & (idx < len(o) - 2)
    idx = np.clip(idx, 1, len(o) - 2)
    v = np.maximum(np.maximum(o[idx - 1], o[idx]), o[idx + 1])
    return (v * valid).sum(1) / np.maximum(1, valid.sum(1))


def fit_grid(o, ofps, bpm0, duration, span=0.03):
    best = (-1.0, bpm0, 0.0)
    for bpm in np.arange(bpm0 * (1 - span), bpm0 * (1 + span), 0.02):
        P = 60 / bpm
        offs = np.arange(0, P, 0.004)
        s = grid_scores(o, ofps, P, offs, duration)
        i = int(np.argmax(s))
        if s[i] > best[0]:
            best = (float(s[i]), float(bpm), float(offs[i]))
    _, bpm, off = best
    for b2 in np.arange(bpm - 0.02, bpm + 0.02, 0.001):
        P = 60 / b2
        offs = np.arange(off - 0.01, off + 0.01, 0.001)
        s = grid_scores(o, ofps, P, offs, duration)
        i = int(np.argmax(s))
        if s[i] > best[0]:
            best = (float(s[i]), float(b2), float(offs[i]))
    return best


def estimate_tempo(o, ofps, drums, mix, sr, duration, forced=None):
    if forced:
        s, bpm, off = fit_grid(o, ofps, forced, duration, span=0.01)
        return bpm, off, s, [(forced, s)]
    oe = librosa.onset.onset_strength(y=librosa.resample(drums + mix, orig_sr=sr, target_sr=22050), sr=22050, hop_length=512)
    t0 = float(np.atleast_1d(librosa.feature.tempo(onset_envelope=oe, sr=22050, hop_length=512, start_bpm=115, std_bpm=1.0))[0])
    cands = sorted({round(x, 2) for x in (t0, t0 * 2, t0 / 2, t0 * 1.5, t0 / 1.5) if 58 <= x <= 210})
    res = []
    for c in cands:
        s, bpm, off = fit_grid(o, ofps, c, duration, span=0.025)
        prior = math.exp(-0.5 * (math.log2(bpm / 115) / 0.9) ** 2)
        res.append((s * prior, bpm, off, s))
    res.sort(reverse=True)
    _, bpm, off, s = res[0]
    return bpm, off, s, [(r[1], r[3]) for r in res]


def drift(o, ofps, P, off, duration, win=15.0):
    """Max phase deviation (s) of 15 s windows from the global grid: > ~0.035 means the tempo is not constant."""
    devs = []
    for w0 in np.arange(0, duration - win, win):
        sub = o[int(w0 * ofps):int((w0 + win) * ofps)]
        if sub.max() < 0.3:
            continue
        offs = np.arange(-0.08, 0.08, 0.002)
        ph0 = off + P * math.ceil((w0 - off) / P) - w0
        s = grid_scores(sub, ofps, P, ph0 + offs, win)
        devs.append(float(offs[int(np.argmax(s))]))
    return max((abs(d) for d in devs), default=0.0), devs


# ------------------------------------------------------------------------- bar phase
def bar_phase(beats, kicks, snares, bass_on, chroma_t, chroma, meter):
    def near(ts, vals, t, w=0.06):
        if len(ts) == 0:
            return 0.0
        i = np.searchsorted(ts, t)
        best = 0.0
        for j in (i - 1, i):
            if 0 <= j < len(ts) and abs(ts[j] - t) <= w:
                best = max(best, vals[j])
        return best
    kt, ks = kicks
    st, ss = snares
    bt, bs = bass_on
    K = np.array([near(kt, ks, b) for b in beats])
    S = np.array([near(st, ss, b) for b in beats])
    B = np.array([near(bt, bs, b) for b in beats])
    # harmonic change at each beat: cosine distance of mean chroma over the 2 beats before vs after
    Hc = np.zeros(len(beats))
    for i in range(2, len(beats) - 2):
        a = (chroma_t >= beats[i - 2]) & (chroma_t < beats[i])
        b = (chroma_t >= beats[i]) & (chroma_t < beats[i + 2])
        if a.any() and b.any():
            ca, cb = chroma[:, a].mean(1), chroma[:, b].mean(1)
            Hc[i] = 1 - float(ca @ cb / (np.linalg.norm(ca) * np.linalg.norm(cb) + 1e-9))
    z = lambda x: (x - x.mean()) / (x.std() + 1e-9)  # noqa: E731
    K, S, B, Hc = z(K), z(S), z(B), z(Hc)
    scores = []
    idx = np.arange(len(beats))
    for ph in range(meter):
        one = (idx - ph) % meter == 0
        back = ((idx - ph) % meter == 1) | ((idx - ph) % meter == 3) if meter == 4 else ((idx - ph) % meter != 0)
        sc = K[one].mean() + 0.6 * B[one].mean() + 1.2 * Hc[one].mean() + 0.8 * (S[back].mean() - S[one].mean())
        scores.append(float(sc))
    order = np.argsort(scores)[::-1]
    conf = (scores[order[0]] - scores[order[1]]) if len(scores) > 1 else 1.0
    return int(order[0]), scores, conf


def estimate_key(chroma):
    maj = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
    mnr = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
    c = chroma.mean(1)
    best = (-2, "", "")
    names_maj = ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"]
    names_min = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"]
    for k in range(12):
        for prof, mode, names in ((maj, "major", names_maj), (mnr, "minor", names_min)):
            r = np.corrcoef(c, np.roll(prof, k))[0, 1]
            if r > best[0]:
                best = (r, f"{names[k]} {mode}", mode)
    return best[1], float(best[0])


# ------------------------------------------------------------------------- sections
SYN = [(r"pre[\s\-]*chorus|prechorus|pre|build|lift|climb", "pre"), (r"post[\s\-]*chorus|postchorus|post", "post"),
       (r"chorus|hook|refrain", "chorus"), (r"verse", "verse"), (r"bridge|middle ?8", "bridge"), (r"intro", "intro"),
       (r"outro|coda|ending|end", "outro"), (r"drop", "drop"), (r"break(down)?|interlude|instrumental|inst|solo", "break")]


def canon(tag):
    t = (tag or "").lower()
    for rx, name in SYN:
        if re.search(rx, t):
            return name
    return re.sub(r"[^a-z]", "", t) or "part"


def sections_from_lyrics(lines, downbeats, beat_period, meter, duration):
    """Contiguous sections covering the song, snapped to downbeats."""
    db = np.asarray(downbeats)

    def sec_start(t_first):
        k = int(np.searchsorted(db, t_first + 1e-3, side="right") - 1)  # bar containing the word
        if k < 0:
            return 0.0
        nxt = db[k + 1] if k + 1 < len(db) else db[k] + meter * beat_period
        return float(nxt if (nxt - t_first) < 2 * beat_period else db[k])  # short pickup stays in the previous section

    def next_db(t):
        k = int(np.searchsorted(db, t))
        return float(db[k]) if k < len(db) else duration

    bar = meter * beat_period
    blocks = []
    tagged = any(l.get("section") for l in lines)
    for l in lines:
        key = l.get("section") if tagged else None
        b = blocks[-1] if blocks else None
        gap = l["start"] - b["end"] if b else 0.0
        # tagged: same tag and no long rest (a repeated chorus after an instrumental is a new block);
        # untagged: lines closer than ~2 bars belong together
        if b and ((tagged and key == b["tag"] and gap < 3 * bar) or (not tagged and gap < 2.2 * bar)):
            b["end"] = l["end"]
            b["text"].append(l["text"])
        else:
            blocks.append(dict(tag=key, start=l["start"], end=l["end"], text=[l["text"]]))
    if not tagged:  # label repeated blocks as chorus
        def sim(a, b):
            from difflib import SequenceMatcher
            return SequenceMatcher(a=" ".join(a).lower(), b=" ".join(b).lower()).ratio()
        for b in blocks:
            b["tag"] = "chorus" if any(sim(b["text"], o["text"]) > 0.62 for o in blocks if o is not b) else "verse"
        for i, b in enumerate(blocks[:-1]):
            if b["tag"] == "verse" and blocks[i + 1]["tag"] == "chorus" and len(b["text"]) <= 2 and i > 0:
                b["tag"] = "pre"
        n_ch = 0
        for b in blocks:
            if b["tag"] == "chorus":
                n_ch += 1
            elif n_ch >= 2 and b["tag"] == "verse" and b is not blocks[-1]:
                b["tag"] = "bridge"
    secs = []  # [name, start]
    if blocks and sec_start(blocks[0]["start"]) > 0.5:
        secs.append(["intro", 0.0])
    for i, b in enumerate(blocks):
        s = sec_start(b["start"])
        # an instrumental stretch between blocks (>= 2 bars after the previous block's last word) is a break
        if i:
            gap0 = next_db(blocks[i - 1]["end"] + 0.3)
            if s - gap0 >= 2 * bar - 1e-3:
                secs.append(["break", gap0])
        if secs and s <= secs[-1][1] + 1e-3:
            secs[-1][0] = canon(b["tag"])  # would start where the previous one starts: it replaces it
            continue
        secs.append([canon(b["tag"]), s])
    if blocks:
        tail = next_db(blocks[-1]["end"] + 0.3)
        if duration - tail >= bar:
            secs.append(["outro", tail])
    if not secs:
        return [dict(name="song", start=0.0, end=round(duration, 3))]
    secs[0][1] = 0.0
    spans = [(n, s, secs[j + 1][1] if j + 1 < len(secs) else duration) for j, (n, s) in enumerate(secs)]
    spans = [x for x in spans if x[2] - x[1] >= 0.2]
    totals = {}
    for n, _, _ in spans:
        totals[n] = totals.get(n, 0) + 1
    idx, out = {}, []
    for n, s, e in spans:
        if totals[n] > 1 and n not in ("intro", "outro"):
            idx[n] = idx.get(n, 0) + 1
            n = f"{n}{idx[n]}"
        out.append(dict(name=n, start=round(s, 3), end=round(e, 3)))
    for j in range(len(out) - 1):
        out[j]["end"] = out[j + 1]["start"]
    out[-1]["end"] = round(duration, 3)
    return out


def sections_from_audio(downbeats, duration, meter, beat_period, chroma_t, chroma, mfcc):
    """No lyrics: novelty segmentation on beat-synchronous features, boundaries on downbeats."""
    db = np.asarray(downbeats)
    if len(db) < 8:
        return [dict(name="part1", start=0.0, end=round(duration, 3))]
    feats = []
    for k in range(len(db)):
        a, b = db[k], db[k + 1] if k + 1 < len(db) else duration
        m = (chroma_t >= a) & (chroma_t < b)
        feats.append(np.concatenate([chroma[:, m].mean(1) if m.any() else np.zeros(12), mfcc[:, m].mean(1) / 50 if m.any() else np.zeros(mfcc.shape[0])]))
    X = np.array(feats).T
    n_seg = int(np.clip(round(duration / 25), 3, 12))
    bounds = librosa.segment.agglomerative(X, n_seg)
    starts = sorted(set([0] + [int(b) for b in bounds]))
    out = []
    for i, k in enumerate(starts):
        s = 0.0 if k == 0 else float(db[k])
        e = float(db[starts[i + 1]]) if i + 1 < len(starts) else duration
        out.append(dict(name=f"part{i + 1}", start=round(s, 3), end=round(e, 3)))
    return out


# ------------------------------------------------------------------------- main
def vocal_onsets(P):
    p = P.work / "vocal_feats.npz"
    if not p.exists():
        return []
    f = dict(np.load(p))
    hop = float(f["hop_s"])
    on, rms = f["onset"], f["rms_db"]
    loc = maximum_filter1d(rms, int(2.0 / hop))
    active = (rms > -45) & (rms > loc - 25)
    thr = uniform_filter1d(on, int(0.4 / hop)) * 1.5 + 0.15 * np.percentile(on, 99)
    pk, _ = find_peaks(on, height=0, distance=int(0.09 / hop))
    pk = [p_ for p_ in pk if on[p_] > thr[p_] and active[min(len(active) - 1, p_ + int(0.03 / hop))]]
    t_flux = np.array(pk) * hop
    s_flux = np.array([on[p_] for p_ in pk]) if pk else np.array([])
    ts = list(zip(t_flux, s_flux / (np.percentile(s_flux, 95) + 1e-9))) if len(s_flux) else []
    ts.sort()
    return [(float(t), float(min(1.0, max(0.1, s)))) for t, s in ts]


def main():
    ap = common.project_arg(__doc__)
    ap.add_argument("--bpm", type=float, default=None, help="force the tempo (fit phase and fine tempo around it)")
    ap.add_argument("--meter", type=int, default=4, help="beats per bar")
    ap.add_argument("--downbeat", type=float, default=None, help="time of any downbeat (overrides bar-phase detection)")
    ap.add_argument("--dynamic", action="store_true", help="force a dynamic (non-constant) beat track")
    ap.add_argument("--plots", action="store_true")
    a = ap.parse_args()
    P = common.Project(a.project)
    mix, _ = P.load_mix(SR)
    duration = len(mix) / SR
    stems = {n: P.load_stem(n, sr=SR)[0][: len(mix)] for n in ("vocals", "drums", "bass", "other")}
    for n in stems:
        if len(stems[n]) < len(mix):
            stems[n] = np.pad(stems[n], (0, len(mix) - len(stems[n])))
    if not P.has_stems():
        print("warning: no Demucs stems (run separate.py) — using HPSS approximations; vocal/beat data will be rougher")

    # ---- beats
    o, ofps = onset_env(stems["drums"], mix, SR)
    bpm, off, gscore, cands = estimate_tempo(o, ofps, stems["drums"], mix, SR, duration, a.bpm)
    Pd = 60 / bpm
    (kt, kdb), (st, sdb), (ht, hdb) = drum_onsets(stems["drums"], SR)
    if len(kt):  # refine phase on kick attacks
        n = np.round((kt - off) / Pd)
        res = kt - (off + n * Pd)
        res = res[np.abs(res) < 0.06]
        if len(res) > 8:
            off += float(np.median(res))
    off = off - Pd * math.floor(off / Pd)
    dmax, devs = drift(o, ofps, Pd, off, duration)
    dynamic = a.dynamic or dmax > 0.035
    if dynamic:
        oe = librosa.onset.onset_strength(y=librosa.resample(stems["drums"] + mix, orig_sr=SR, target_sr=22050), sr=22050, hop_length=256)
        _, bt = librosa.beat.beat_track(onset_envelope=oe, sr=22050, hop_length=256, start_bpm=bpm, tightness=300, units="time")
        beats = np.asarray(bt, float)
        if len(beats) > 4:  # extend with the local period to cover the whole song
            p0, p1 = beats[1] - beats[0], beats[-1] - beats[-2]
            pre = np.arange(beats[0] - p0, -1e-9, -p0)[::-1]
            post = np.arange(beats[-1] + p1, duration, p1)
            beats = np.concatenate([pre, beats, post])
    else:
        beats = off + Pd * np.arange(int((duration - off) / Pd) + 1)
    print(f"tempo {bpm:.3f} BPM (candidates {', '.join(f'{c:.1f}:{s:.2f}' for c, s in cands)})  first beat {beats[0]:.3f}s  "
          f"phase drift max {dmax * 1000:.0f} ms -> {'DYNAMIC' if dynamic else 'constant'} grid")

    # ---- harmony features (chroma of the harmonic stems), key
    harm = stems["other"] + stems["bass"] if P.has_stems() else librosa.effects.harmonic(mix)
    hop_c = 2048
    chroma = librosa.feature.chroma_cqt(y=librosa.resample(harm, orig_sr=SR, target_sr=22050), sr=22050, hop_length=hop_c // 2)
    chroma_t = librosa.times_like(chroma, sr=22050, hop_length=hop_c // 2)
    key, key_r = estimate_key(chroma)

    # ---- downbeats
    bt_on, bdb = band_onsets(stems["bass"], SR, None, 250, win=0.02, min_gap=0.12, rel_db=8)
    meter = a.meter
    if a.downbeat is not None:
        k = int(np.argmin(np.abs(beats - a.downbeat)))
        ph, pscores, pconf = k % meter, [], float("inf")
    else:
        ph, pscores, pconf = bar_phase(beats, (kt, strength01(kdb)), (st, strength01(sdb)), (bt_on, strength01(bdb)), chroma_t, chroma, meter)
    downbeats = beats[ph::meter]
    print(f"bar phase {ph} (scores {', '.join(f'{s:.2f}' for s in pscores)}; margin {pconf:.2f}{'  LOW - check the QA plot or pass --downbeat' if pconf < 0.25 else ''})  "
          f"first downbeat {downbeats[0]:.3f}s   key {key} (r={key_r:.2f})")

    # ---- envelopes
    nfr = int(math.ceil(duration * FPS))
    env = {"rms": frame_rms(mix, SR)[:nfr]}
    for name, (lo, hi) in {"low": (None, 150), "mid": (150, 2000), "high": (4000, None)}.items():
        env[name] = frame_rms(sosfiltfilt(band_sos(lo, hi, SR), mix), SR)[:nfr]
    for s in ("vocal", "drums", "bass", "other"):
        env[s] = frame_rms(stems["vocals" if s == "vocal" else s], SR)[:nfr]
    for k in env:
        env[k] = [round(float(x), 3) for x in norm01(smooth_env(env[k]))]

    onsets = {
        "kick": [[round(float(t), 3), round(float(s), 3)] for t, s in zip(kt, strength01(kdb))],
        "snare": [[round(float(t), 3), round(float(s), 3)] for t, s in zip(st, strength01(sdb))],
        "hat": [[round(float(t), 3), round(float(s), 3)] for t, s in zip(ht, strength01(hdb))],
        "vocal": [[round(t, 3), round(s, 3)] for t, s in vocal_onsets(P)],
    }

    # ---- sections
    override = P.root / "analysis" / "sections.json"
    lyr = P.data / "lyrics.json"
    if override.exists():
        spec = common.read_json(override)  # [["intro", 0], ["verse1", 1], ...] bars, or [{"name", "start"}] seconds
        bar_t = lambda k: float(downbeats[min(int(k), len(downbeats) - 1)]) if k is not None else 0.0  # noqa: E731
        rows = [(x[0], bar_t(x[1])) if isinstance(x, list) else (x["name"], float(x["start"])) for x in spec]
        sections = [dict(name=n, start=round(s, 3), end=round(rows[i + 1][1] if i + 1 < len(rows) else duration, 3)) for i, (n, s) in enumerate(rows)]
        how = "analysis/sections.json"
    elif lyr.exists() and common.read_json(lyr).get("lines"):
        sections = sections_from_lyrics(common.read_json(lyr)["lines"], downbeats, Pd if not dynamic else float(np.median(np.diff(beats))), meter, duration)
        how = "lyrics"
    else:
        mfcc = librosa.feature.mfcc(y=librosa.resample(mix, orig_sr=SR, target_sr=22050), sr=22050, hop_length=hop_c // 2, n_mfcc=13)
        sections = sections_from_audio(downbeats, duration, meter, Pd, chroma_t, chroma, mfcc[:, : chroma.shape[1]])
        how = "audio novelty (no lyrics)"
    print("sections (" + how + "): " + "  ".join(f"{s['name']}@{s['start']:.1f}" for s in sections))

    doc = dict(duration=round(duration, 3), bpm=round(bpm, 3), beat_period=round(Pd, 5), time_signature=meter, key=key,
               beats=[round(float(t), 3) for t in beats], downbeats=[round(float(t), 3) for t in downbeats], sections=sections,
               fps=FPS, **env, onsets=onsets,
               notes=(f"Timeline = the ffmpeg (gapless) decode of the song. Tempo {bpm:.3f} BPM, "
                      f"{'dynamic beat track (tempo drifts)' if dynamic else 'constant grid fitted over the whole song, phase refined on kicks'}; "
                      f"bar phase from kick/bass on 1, backbeat snares and harmonic change (margin {pconf:.2f}); sections from {how}. "
                      "Envelopes: 100 fps, 46 ms RMS, 10/90 ms attack/release, each /99th percentile, 0..1. "
                      "Onsets [t, strength]: kick <120 Hz attacks, snare 1.5-5 kHz attacks with a noisy tail, hat >7 kHz, "
                      "vocal = spectral-flux note onsets of the vocal stem."))
    common.write_json(P.data / "audio.json", doc, compact=True)
    print("wrote", P.data / "audio.json", f"{len(beats)} beats, {len(downbeats)} downbeats, {len(kt)} kicks, {len(st)} snares, {len(ht)} hats")
    if a.plots:
        make_plots(P, doc, stems)


def make_plots(P, doc, stems):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    t = np.arange(len(doc["rms"])) / FPS
    dur = doc["duration"]
    wins = [(max(0, s["start"] - 2), min(dur, s["start"] + 8)) for s in doc["sections"]][:10]
    for (t0, t1) in wins:
        fig, ax = plt.subplots(3, 1, figsize=(22, 11), sharex=True, gridspec_kw=dict(height_ratios=[2, 1.6, 1.4]))
        d = stems["drums"][int(t0 * SR):int(t1 * SR)]
        S = librosa.amplitude_to_db(np.abs(librosa.stft(d, n_fft=1024, hop_length=128)), ref=np.max)
        ax[0].imshow(S, origin="lower", aspect="auto", cmap="magma", vmin=-60, vmax=0, extent=[t0, t0 + S.shape[1] * 128 / SR, 0, SR / 2])
        ax[0].set_ylim(0, 12000)
        ax[0].set_ylabel("drums stem")
        m = (t >= t0) & (t <= t1)
        for k, c in [("rms", "k"), ("low", "tab:red"), ("mid", "tab:green"), ("high", "tab:blue")]:
            ax[1].plot(t[m], np.array(doc[k])[m], color=c, lw=1, label=k)
        ax[1].legend(loc="upper left", fontsize=8)
        for k, c in [("vocal", "tab:purple"), ("drums", "tab:orange"), ("bass", "tab:brown"), ("other", "tab:olive")]:
            ax[2].plot(t[m], np.array(doc[k])[m], color=c, lw=1, label=k)
        ax[2].legend(loc="upper left", fontsize=8)
        for b in doc["beats"]:
            if t0 <= b <= t1:
                for a_ in ax:
                    a_.axvline(b, color="gray", lw=0.6, alpha=0.6)
        for b in doc["downbeats"]:
            if t0 <= b <= t1:
                for a_ in ax:
                    a_.axvline(b, color="c" if a_ is ax[0] else "k", lw=1.8)
        for name, y, c in [("kick", 1500, "tab:red"), ("snare", 5000, "w"), ("hat", 9500, "yellow")]:
            for (ot, s) in doc["onsets"][name]:
                if t0 <= ot <= t1:
                    ax[0].plot([ot], [y], marker="v", color=c, ms=4 + 8 * s)
        for s in doc["sections"]:
            if t0 <= s["start"] <= t1:
                ax[1].text(s["start"], 1.02, s["name"], fontsize=14, color="tab:red")
                for a_ in ax:
                    a_.axvline(s["start"], color="tab:red", lw=2.5)
        ax[2].set_xlim(t0, t1)
        ax[2].set_xticks(np.arange(np.ceil(t0), t1, 0.5))
        ax[0].set_title("beats (grey), downbeats (black/cyan), kick ▼red snare ▼white hat ▼yellow — downbeats should sit on the bar's first kick / chord change")
        fig.tight_layout()
        fig.savefig(P.qa / f"audio_{int(t0):03d}.png", dpi=60)
        plt.close(fig)
    fig, ax = plt.subplots(2, 1, figsize=(24, 7), sharex=True)
    for k, c in [("rms", "k"), ("low", "tab:red"), ("high", "tab:blue")]:
        ax[0].plot(t, doc[k], color=c, lw=0.6, label=k)
    for k, c in [("vocal", "tab:purple"), ("drums", "tab:orange"), ("bass", "tab:brown")]:
        ax[1].plot(t, doc[k], color=c, lw=0.6, label=k)
    for s in doc["sections"]:
        for a_ in ax:
            a_.axvline(s["start"], color="tab:red", lw=1.5)
        ax[0].text(s["start"] + 0.2, 1.03, s["name"], fontsize=10, color="tab:red")
    for a_ in ax:
        a_.legend(loc="upper right", fontsize=8)
    fig.tight_layout()
    fig.savefig(P.qa / "audio_overview.png", dpi=65)
    plt.close(fig)


if __name__ == "__main__":
    sys.exit(main())

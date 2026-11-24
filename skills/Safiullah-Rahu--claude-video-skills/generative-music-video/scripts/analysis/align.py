# Adapted from mexicat/pdoom-video (MIT); see LICENSE-pdoom-video.
"""Word-level lyric alignment -> data/lyrics.json (+ analysis/qa/align_report.md, per-line QA plots)

Pipeline (run by `gmv.py analyze`; each step caches into analysis/work/):
  separate.py      Demucs stems (the vocal stem is what gets aligned)
  vocal_feats.py   vocal-stem RMS / pitch / onset / sibilance features (5 ms hop)
  ctc_emissions.py frame-wise CTC log-probs from MMS_FA (+ wav2vec2 LV60K for English), mono / L / R
  transcribe.py    (optional) Whisper word timestamps: an independent cross-check, and lyrics when you have none
  this script      one global constrained CTC Viterbi pass over the whole song on the fused emissions (a
                   garbage "star" token between lines absorbs ad-libs), then signal-based refinement of word
                   starts/ends, manual fixes (lyrics/fixes.json), confidence scoring, report and QA plots.

  python align.py --project <dir> [--plots] [--margin 1.5]
"""
import common
import sys
from difflib import SequenceMatcher
import re

import numpy as np

from ctcalign import align, available, emissions, word_table
from pron import pron


def load_feats(P):
    f = dict(np.load(P.work / "vocal_feats.npz"))
    f["hop"] = float(f.pop("hop_s"))
    return f


def activity(f, rel_db=22.0, abs_db=-48.0, win_s=1.5):
    """Vocal activity mask: RMS above an absolute floor and within rel_db of the local (±win) maximum."""
    from scipy.ndimage import maximum_filter1d, median_filter
    r = median_filter(f["rms_db"], 5)
    loc = maximum_filter1d(r, int(win_s / f["hop"]))
    return (r > abs_db) & (r > loc - rel_db), r


def runs(mask):
    m = np.concatenate([[False], mask, [False]]).astype(np.int8)
    d = np.diff(m)
    return list(zip(np.where(d == 1)[0], np.where(d == -1)[0]))


FRIC_START = re.compile(r"(s|sh|ch|z|f|th|j|c[eiy]|x|h)")
VOICED_TH = {"the", "there", "there's", "that", "that's", "they", "this", "then", "than", "those", "these", "thy", "thee", "though"}
FRIC_END = re.compile(r"(s|z|f|x|ce|se|ze|sh|ch)$")


def refine(words, f, units, fix=None):
    """Signal-based refinement of CTC boundaries, per sub-word unit (a word, or one spelled letter /
    compound part). Start: (1) rest-onset — a rest (>=50 ms) precedes the unit and the voice re-enters
    >40 ms before the CTC start: start there (CTC fires late on held vowels); (2) onset-snap — otherwise snap
    to the strongest vocal onset just before the CTC start; (3) fricative — s/sh/ch/z/f/th/j/h-initial units:
    CTC emits the consonant at the END of the frication, move back to where the 4-10 kHz noise begins.
    End: the next unit's start when the voice continues (legato), else when the voice drops 15 dB below the
    word's level for >= 60 ms (held notes keep their full length)."""
    from scipy.ndimage import uniform_filter1d
    from scipy.signal import find_peaks
    hop = f["hop"]
    act, r = activity(f, rel_db=27.0)
    n = len(r)
    sil = ~act
    sib = uniform_filter1d(f["sib_ratio"], 3)
    on = f["onset"]
    on_thr = 0.3 * np.percentile(on, 99)
    pk_idx, _ = find_peaks(on, height=on_thr, distance=max(1, int(0.04 / hop)))
    U = []
    for k, w in enumerate(words):
        w["ctc_start"], w["ctc_end"] = w["start"], w["end"]
        subs = units(w["w"])
        for j, (a, b) in enumerate(w["subs"]):
            U.append(dict(k=k, j=j, text=subs[j] if j < len(subs) else w["w"].lower(), cs=a, ce=b, s=a, rule="ctc"))
    fix = fix or {}
    for u_i, u in enumerate(U):
        w = words[u["k"]]
        fx = fix.get((w["li"], w["ti"]))
        if fx is not None:
            starts = [fx.get("start")] + list(fx.get("syl", []))
            if u["j"] < len(starts) and starts[u["j"]] is not None:
                u["s"], u["rule"] = starts[u["j"]], "manual"
                continue
        pu = U[u_i - 1] if u_i else None
        prev_ce = pu["ce"] if pu else 0.0
        prev_cs = pu["cs"] if pu else 0.0
        s = u["cs"]
        i0, i1 = int(prev_ce / hop), min(n, int(s / hop))
        done = False
        if i1 - i0 > int(0.05 / hop):
            rs = [(a, b) for a, b in runs(sil[i0:i1]) if (b - a) * hop >= 0.05]
            if rs:
                onset = (i0 + rs[-1][1]) * hop
                if s - onset > 0.04:
                    u["s"], u["rule"] = onset, "rest-onset"
                done = True
        if not done:
            vowel_init = u["text"][:1] in "aeiou"
            lo = max(prev_ce - 0.06, prev_cs + 0.08, s - (0.25 if vowel_init else 0.12))
            hi = s + 0.04
            cand = [p for p in pk_idx if lo <= p * hop <= hi and np.median(sib[p:p + max(1, int(0.06 / hop))]) < -5]
            best, bsc = None, 0.0
            for p in cand:
                dt = s - p * hop
                wgt = 1.0 if dt < 0.06 else max(0.4, 1 - (dt - 0.06) / 0.4)
                if on[p] * wgt > bsc:
                    best, bsc = p, on[p] * wgt
            if best is not None:
                t = best * hop - 0.01
                if abs(t - s) > 0.02:
                    u["s"], u["rule"] = t, "onset-snap"
        if FRIC_START.match(u["text"]) and u["text"] not in VOICED_TH:
            prev_fric_end = pu is not None and FRIC_END.search(pu["text"]) is not None
            lo_t = prev_ce + 0.02 if prev_fric_end else prev_ce - 0.10
            if pu is not None:
                lo_t = max(lo_t, pu["s"] + 0.10)
            lo = int(max(lo_t, s - 0.30, 0) / hop)
            a_, b_ = max(int((s - 0.15) / hop), lo), min(n, int((s + 0.06) / hop))
            if b_ > a_:
                pk = a_ + int(np.argmax(sib[a_:b_]))
                base = np.percentile(sib[max(0, lo - int(0.4 / hop)):lo + 1], 25) if lo > 0 else -40
                if sib[pk] >= base + 8:
                    thr = 0.5 * (base + sib[pk])
                    j = pk
                    while j - 1 >= lo and sib[j - 1] > thr:
                        j -= 1
                    if j * hop < u["s"] - 0.02:
                        u["s"], u["rule"] = j * hop, "fricative"
    for u_i in range(1, len(U)):
        U[u_i]["s"] = max(U[u_i]["s"], U[u_i - 1]["s"] + 0.03)
    for k, w in enumerate(words):
        us = [u for u in U if u["k"] == k]
        w["start"] = us[0]["s"]
        w["start_rule"] = us[0]["rule"]
        w["unit_starts"] = [u["s"] for u in us]
    for k, w in enumerate(words):
        nxt = words[k + 1]["start"] if k + 1 < len(words) else n * hop
        e = max(w["ctc_end"], w["start"] + 0.08)
        j0, j1 = int(w["start"] / hop), int(e / hop)
        level = np.percentile(r[j0:max(j1, j0 + 1)], 90)
        jn = int(nxt / hop)
        low = r < level - 15.0
        q = None
        need = max(1, int(0.06 / hop))
        j = j1
        while j < min(jn, n - need):
            if low[j] and low[j:j + need].all():
                q = j * hop
                break
            j += 1
        end = min(q, nxt) if q is not None else nxt
        # a word with nothing after it (end of song / long rest) must not stretch forever
        end = min(end, max(w["ctc_end"], w["start"] + 0.08) + 2.5)
        end = max(end, w["start"] + 0.04)
        if nxt - end < 0.03:
            end = nxt
        fx = fix.get((w["li"], w["ti"]))
        if fx is not None:
            w["manual"] = True
            if "end" in fx:
                end = fx["end"]
        w["end"] = end
        us = w["unit_starts"]
        w["subs"] = [(us[i], us[i + 1] if i + 1 < len(us) else end) for i in range(len(us))]
    return words


def detect_extras(words, f):
    """Vocal activity (vocal stem) not covered by any lyric word: ad-libs, backing vocals, unlisted lines."""
    from scipy.ndimage import median_filter
    hop = f["hop"]
    r = median_filter(f["rms_db"], 9)
    act = r > -36
    cover = np.zeros_like(act)
    for w in words:
        cover[max(0, int((w["start"] - 0.1) / hop)):int((w["end"] + 0.1) / hop)] = True
    out = []
    for a, b in runs(act & ~cover):
        if out and a * hop - out[-1][1] < 0.4:
            out[-1][1] = b * hop
        else:
            out.append([a * hop, b * hop])
    return [dict(start=round(a, 2), end=round(b, 2), desc="vocal not in the lyrics (ad-lib / backing vocal / missing line?)")
            for a, b in out if b - a >= 0.5]


def whisper_words(P):
    p = P.work / "whisper.json"
    if not p.exists():
        return None
    W = common.read_json(p)
    return [(w["word"].strip(), w["start"], w["end"]) for s in W["segments"] for w in s.get("words", [])]


def norm(t):
    return re.sub(r"[^a-z0-9]", "", t.lower())


def map_whisper(words, ww, units):
    """Fuzzy sequence alignment of whisper words to lyric tokens."""
    a = [norm("".join(units(w["w"]))) for w in words]
    b = [norm(x[0]) for x in ww]
    sm = SequenceMatcher(a=a, b=b, autojunk=False)
    m = {}
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal" or (tag == "replace" and (i2 - i1) == (j2 - j1)):
            for d in range(i2 - i1):
                m[i1 + d] = ww[j1 + d]
    for i, w in enumerate(words):
        x = m.get(i)
        if x is not None and abs(x[1] - w["start"]) > 1.5:
            x = None
        w["whisper"] = None if x is None else (round(x[1], 3), round(x[2], 3))
    return words


def confidence(words, alt, fix):
    for i, w in enumerate(words):
        ds = [abs(a[i]["start"] - w["ctc_start"]) for a in alt.values()]
        agree = float(np.mean([d <= 0.06 for d in ds])) if ds else 0.5
        p = min(1.0, w["conf"] / 0.5)
        wh = w.get("whisper")
        wagree = 0.5 if wh is None else float(abs(wh[0] - w["start"]) <= 0.15)
        c = 0.35 + 0.3 * agree + 0.2 * p + 0.15 * wagree
        if w.get("manual"):
            c = fix.get((w["li"], w["ti"]), {}).get("conf", max(c, 0.8))
        w["conf_final"] = round(float(np.clip(c, 0, 1)), 2)
    return words


def parse_fixes(P):
    out = {}
    for k, v in P.fixes().items():
        li, ti = (int(x) for x in str(k).split(":"))
        out[(li, ti)] = v
    return out


def main():
    ap = common.project_arg(__doc__)
    ap.add_argument("--plots", action="store_true", help="per-line QA plots into analysis/qa/")
    ap.add_argument("--margin", type=float, default=1.5, help="garbage-token margin (higher = lyric words win more easily)")
    a = ap.parse_args()
    P = common.Project(a.project)
    L = P.lyrics_lines()
    if not L:
        raise SystemExit(f"no lyrics at {P.lyrics_src} (write them, or run transcribe.py --draft for a Whisper draft)")
    ov = P.pron_overrides()
    units = lambda tok: pron(tok, ov)  # noqa: E731
    toks = [l["text"].split(" ") for l in L]
    U = [[units(t) for t in line] for line in toks]
    windows = {i: ((l["t0"] - 1.5) if l["t0"] is not None else None, (l["t1"] + 1.5) if l.get("t1") else None)
               for i, l in enumerate(L) if l["t0"] is not None}
    tags = available(P)
    primary = "fused"
    E = emissions(P, primary)
    sp, score, _, _ = align(E, U, margin=a.margin, line_windows=windows or None)
    words = word_table(sp, toks)
    # independent alignments for agreement-based confidence: each model on the mono sum, and each channel fused
    alt = {}
    for k in [t for t in tags if "_" not in t] + [f"fused_{s}" for s in ("vocL", "vocR") if any(t.endswith(s) for t in tags)]:
        s2, _, _, _ = align(emissions(P, k), U, margin=a.margin, line_windows=windows or None)
        alt[k] = word_table(s2, toks)
    f = load_feats(P)
    fix = parse_fixes(P)
    words = refine(words, f, units, fix)
    for k in range(1, len(words)):
        if words[k]["start"] < words[k - 1]["start"] + 0.02:
            words[k]["start"] = words[k - 1]["start"] + 0.02
        if words[k - 1]["end"] > words[k]["start"]:
            words[k - 1]["end"] = words[k]["start"]
    ww = whisper_words(P)
    if ww:
        words = map_whisper(words, ww, units)
    words = confidence(words, alt, fix)
    common.write_json(P.work / "align_debug.json", dict(words=words), compact=True)

    lines = []
    for li, l in enumerate(L):
        ws = [w for w in words if w["li"] == li]
        out = []
        for w in ws:
            d = dict(w=w["w"], start=round(w["start"], 3), end=round(w["end"], 3), conf=w["conf_final"])
            if len(w["subs"]) > 1:
                d["syl"] = [[round(x, 3), round(y, 3)] for x, y in w["subs"]]
            out.append(d)
        row = dict(i=li, text=l["text"], start=out[0]["start"], end=out[-1]["end"], words=out)
        if l["section"]:
            row["section"] = l["section"]
        lines.append(row)
    extras = detect_extras(words, f)
    doc = dict(lines=lines, extras=extras, notes=NOTES.format(models=", ".join(tags)))
    common.write_json(P.data / "lyrics.json", doc)
    report(P, lines, words, extras, ww is not None)
    print("wrote", P.data / "lyrics.json", f"({len(lines)} lines, {len(words)} words, viterbi score {score:.0f})")
    if a.plots:
        make_plots(P, words, alt, L, ww, units)


def report(P, lines, words, extras, have_whisper):
    low = [w for w in words if w["conf_final"] < 0.6]
    rows = ["# Alignment report", "", f"{len(lines)} lines, {len(words)} words. Look at the QA plots of the lines listed here "
            "(`align.py --plots` → analysis/qa/line_NN.png), fix with lyrics/fixes.json and re-run align.py.", ""]
    rows.append(f"## Low-confidence words ({len(low)})")
    for w in low:
        rows.append(f"- L{w['li']:02d}:{w['ti']} **{w['w']}** {w['start']:.2f}–{w['end']:.2f} conf {w['conf_final']}"
                    + (f" (whisper {w['whisper'][0]:.2f})" if w.get("whisper") else ""))
    long_w = [w for w in words if w["end"] - w["start"] > 2.2]
    if long_w:
        rows += ["", "## Very long words (held notes, or a word that swallowed a gap?)"]
        rows += [f"- L{w['li']:02d}:{w['ti']} **{w['w']}** {w['start']:.2f}–{w['end']:.2f}" for w in long_w]
    if have_whisper:
        miss = [w for w in words if w.get("whisper") is None]
        rows += ["", f"## Words Whisper did not match ({len(miss)}) — clusters here can mean wrong or missing lyric lines"]
        rows += [f"- L{w['li']:02d}:{w['ti']} {w['w']} @ {w['start']:.2f}" for w in miss[:120]]
    if extras:
        rows += ["", "## Vocals not covered by any lyric word (≥ 0.5 s)"]
        rows += [f"- {e['start']:.2f}–{e['end']:.2f}" for e in extras]
    (P.qa / "align_report.md").write_text("\n".join(rows) + "\n", encoding="utf-8")


def make_plots(P, words, alt, L, ww, units):
    from qa_plot import plot
    for li, l in enumerate(L):
        ws = [w for w in words if w["li"] == li]
        t0 = min(ws[0]["start"], ws[0]["ctc_start"]) - 0.8
        t1 = min(max(ws[-1]["end"], ws[-1]["ctc_end"]) + 0.6, t0 + 7)
        tracks = [("final", [(w["w"], w["start"], w["end"]) for w in words]),
                  ("ctc", [(w["w"], w["ctc_start"], w["ctc_end"]) for w in words])]
        for k, v in list(alt.items())[:3]:
            tracks.append((k, [(w["w"], w["start"], w["end"]) for w in v]))
        if ww:
            tracks.append(("whisper", ww))
        plot(P, t0, t1, tracks, P.qa / f"line_{li:02d}.png", title=f"L{li}: {l['text']}")


NOTES = ("Timeline = the ffmpeg (gapless) decode of the song, same as data/audio.json. Method: CTC emissions (20 ms) "
         "of the Demucs vocal stem from {models}, fused as a probability mixture; one global constrained Viterbi forced "
         "alignment of all lines with a garbage token between lines; acronyms/numbers aligned with spoken spellings "
         "(pron.py + lyrics/pron.json); signal refinement per sub-word on the vocal stem (rest onsets, spectral-flux "
         "onsets, fricative starts; ends at the next word when legato, else where the voice drops 15 dB); manual fixes "
         "from lyrics/fixes.json. conf = 0.35 + agreement of independent alignments (<=60 ms) + CTC posterior + "
         "Whisper agreement. 'syl' = start/end of each spelled letter or compound part.")

if __name__ == "__main__":
    sys.exit(main())

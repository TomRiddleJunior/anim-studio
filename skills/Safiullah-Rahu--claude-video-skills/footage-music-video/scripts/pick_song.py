"""Rank generated song takes: lyric intelligibility (Whisper WER against the lyrics), tempo, length, loudness.

  ~/.generative-music-video/venv/Scripts/python.exe tools/pick_song.py [song/candidates/*.flac]

Writes song/candidates/ranking.json and prints a table. Lower score = better:
  score = WER + 0.01*|bpm-128| (half/double tempo folded) + 0.004*|dur-300| + 0.5 if clipping
Per-section WER (by the [Section] tags) is reported too, so a take that drops the bridge is visible.
"""
import json, re, sys, glob
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path.home() / ".claude/skills/generative-music-video/scripts/analysis"))
import common  # noqa: E402  (sets the shared caches)

NUM = {"0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine",
       "10": "ten", "11": "eleven", "12": "twelve", "13": "thirteen", "17": "seventeen", "18": "eighteen", "20": "twenty", "25": "twenty five"}


def norm_words(s):
    s = s.lower().replace("-", " ")
    s = re.sub(r"\b(a g i|agi)\b", "a g i", s)
    s = re.sub(r"\b(\d+)\b", lambda m: NUM.get(m.group(1), m.group(1)), s)
    s = re.sub(r"[^a-z' ]+", " ", s)
    return [w.strip("'") for w in s.split() if w.strip("'")]


def wer(ref, hyp):
    d = np.zeros((len(ref) + 1, len(hyp) + 1), dtype=np.int32)
    d[:, 0] = np.arange(len(ref) + 1); d[0, :] = np.arange(len(hyp) + 1)
    for i in range(1, len(ref) + 1):
        for j in range(1, len(hyp) + 1):
            d[i, j] = min(d[i - 1, j] + 1, d[i, j - 1] + 1, d[i - 1, j - 1] + (ref[i - 1] != hyp[j - 1]))
    return d[-1, -1] / max(1, len(ref))


def sections(lyrics_txt):
    out, cur = [], None
    for l in lyrics_txt.splitlines():
        l = l.strip()
        if not l:
            continue
        m = re.fullmatch(r"\[(.+?)\]", l)
        if m:
            cur = [m.group(1), []]; out.append(cur)
        elif cur:
            cur[1].append(l)
    return out


def main():
    import whisper, librosa, torch
    files = sys.argv[1:] or sorted(glob.glob(str(ROOT / "song" / "candidates" / "*.flac")))
    lyr = (ROOT / "song" / "lyrics.txt").read_text(encoding="utf-8")
    secs = sections(lyr)
    ref_all = norm_words(" ".join(" ".join(ls) for _, ls in secs))
    import os
    dev = os.environ.get("PICK_DEVICE") or ("cuda" if torch.cuda.is_available() else "cpu")
    model = whisper.load_model("turbo", device=dev, download_root=str(common.WHISPER_CACHE))
    rows = []
    for f in files:
        y, sr = librosa.load(f, sr=22050, mono=True)
        dur = len(y) / sr
        tempo = float(np.atleast_1d(librosa.beat.beat_track(y=y, sr=sr)[0])[0])
        t2 = min([tempo, tempo * 2, tempo / 2], key=lambda b: abs(b - 128))
        peak = float(np.max(np.abs(y)))
        clip = float(np.mean(np.abs(y) > 0.99))
        r = model.transcribe(f, language="en", condition_on_previous_text=False, temperature=0.0)
        hyp = norm_words(r["text"])
        w = wer(ref_all, hyp)
        # per-section coverage: share of each section's words matched (in order) in the transcript
        import difflib
        sm = difflib.SequenceMatcher(None, ref_all, hyp, autojunk=False)
        hit = np.zeros(len(ref_all), bool)
        for b in sm.get_matching_blocks():
            hit[b.a:b.a + b.size] = True
        cov, k = [], 0
        for name, ls in secs:
            n = len(norm_words(" ".join(ls)))
            cov.append((name, round(float(hit[k:k + n].mean()) if n else 1.0, 2)))
            k += n
        score = w + 0.01 * abs(t2 - 128) + 0.002 * abs(dur - 210) + (0.5 if clip > 1e-4 else 0)
        rows.append({"file": str(Path(f).resolve().relative_to(ROOT)).replace("\\", "/"), "duration": round(dur, 1), "bpm": round(t2, 1), "wer": round(w, 3),
                     "peak": round(peak, 3), "clip_frac": clip, "score": round(score, 3), "coverage": cov, "transcript": r["text"][:4000]})
        print(f"{Path(f).name:<22} dur {dur:6.1f}s  bpm {t2:6.1f}  WER {w:.3f}  peak {peak:.2f}  score {score:.3f}", flush=True)
        print("   coverage: " + "  ".join(f"{n[:6]}:{c:.2f}" for n, c in cov), flush=True)
    rows.sort(key=lambda r: r["score"])
    (ROOT / "song" / "candidates" / "ranking.json").write_text(json.dumps(rows, indent=1), encoding="utf-8")
    print("\nbest:", rows[0]["file"] if rows else None)


if __name__ == "__main__":
    main()

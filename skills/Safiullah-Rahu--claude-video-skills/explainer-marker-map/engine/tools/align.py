"""Word times from the final voice: faster-whisper small.en (int8, CPU) on vo/vo.wav, cut into chunks at every pause,
then mapped onto the script's own words, so story keys ("Diomede#2", "1987") never depend on how whisper spells.

  python -I engine/tools/align.py <slug>

Reads vo/vo24.wav + vo/joined.json (from voice.py) and script.json. Prints a per-line check (whisper's transcript vs
the script, similarity %) and writes vo/timing.json + vo/timing.js (window.MF_TIMING) and vo/whisper.json (raw words).
Unmatched words (numbers whisper writes as digits, respelled names) share their span's time by character length.
"""
import difflib
import json
import re
import sys
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mfcommon import film_dir, norm_word, write_js_global  # noqa: E402


ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()
HOMO = {"to": "two", "too": "two", "for": "four", "lynn": "lynne", "kilometers": "kilometres", "regan": "reagan"}


def say_num(n):
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ("" if n % 10 == 0 else " " + ONES[n % 10])
    if 1100 <= n <= 2099 and n % 100:  # years: "nineteen eighty seven"
        return say_num(n // 100) + " " + say_num(n % 100)
    return str(n)


def spoken(text):
    """Text as spoken words, for comparing whisper's transcript with the script (digits → words, homophones)."""
    t = text.lower().replace("-", " ")
    t = re.sub(r"(\d+)\s*\.\s*(\d+)", lambda m: f"{say_num(int(m.group(1)))} point {' '.join(ONES[int(c)] for c in m.group(2))}", t)
    t = re.sub(r"\d+", lambda m: say_num(int(m.group(0))), t)
    words = [HOMO.get(w, w) for w in re.sub(r"[^a-z ]", " ", t).split()]
    return " ".join(words)


def chunks(a, sr, min_pause=0.12, thr_db=-42):
    hop = int(0.005 * sr)
    n = len(a) // hop
    rms = np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
    quiet = rms < rms.max() * 10 ** (thr_db / 20)
    cuts, i = [0], 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            if (j - i) * hop / sr >= min_pause and i > 0 and j < n:
                cuts.append(((i + j) // 2) * hop)
            i = j
        else:
            i += 1
    cuts.append(len(a))
    return [(cuts[k], cuts[k + 1]) for k in range(len(cuts) - 1) if cuts[k + 1] - cuts[k] > int(0.15 * sr)]


def main(slug):
    root = film_dir(slug)
    script = json.loads((root / "script.json").read_text(encoding="utf-8"))
    joined = json.loads((root / "vo" / "joined.json").read_text(encoding="utf-8"))
    sr, a = wavfile.read(root / "vo" / "vo24.wav")
    a = a.astype(np.float32)
    a16 = resample_poly(a, 2, 3).astype(np.float32)
    from faster_whisper import WhisperModel
    model = WhisperModel("small.en", device="cpu", compute_type="int8")
    spans = {l["id"]: l for l in joined["lines"]}
    out_lines, raw, report = [], [], []
    for ln in script["lines"]:
        sp = spans[ln["id"]]
        s0, s1 = int(max(0, sp["start"] - 0.05) * 16000), int((sp["end"] + 0.06) * 16000)
        seg = a16[s0:s1]
        ws = []
        for c0, c1 in chunks(seg, 16000):
            res, _ = model.transcribe(seg[c0:c1], language="en", beam_size=5, word_timestamps=True,
                                      condition_on_previous_text=False, vad_filter=False)
            for r in res:
                for w in r.words or []:
                    ws.append({"w": w.word.strip(), "start": (s0 + c0) / 16000 + w.start, "end": (s0 + c0) / 16000 + w.end,
                               "p": round(w.probability, 3)})
        raw.append({"id": ln["id"], "words": ws})
        sw = ln["text"].split()
        A = [norm_word(w) for w in sw]
        B = [norm_word(w["w"]) for w in ws]
        times = [None] * len(sw)
        sm = difflib.SequenceMatcher(a=A, b=B, autojunk=False)
        ops = sm.get_opcodes()
        for tag, i0, i1, j0, j1 in ops:
            if tag == "equal":
                for k in range(i1 - i0):
                    times[i0 + k] = (ws[j0 + k]["start"], ws[j0 + k]["end"])
            elif i1 > i0 and j1 > j0:  # replace: share the whisper span by character length
                t0, t1 = ws[j0]["start"], ws[j1 - 1]["end"]
                lens = [max(1, len(x)) for x in A[i0:i1]]
                tot, acc = sum(lens), 0
                for k, L in enumerate(lens):
                    times[i0 + k] = (t0 + (t1 - t0) * acc / tot, t0 + (t1 - t0) * (acc + L) / tot)
                    acc += L
        # words whisper missed entirely: interpolate between neighbours
        line_t0, line_t1 = sp["start"], sp["end"]
        for k in range(len(sw)):
            if times[k] is None:
                prev = next((times[j][1] for j in range(k - 1, -1, -1) if times[j]), line_t0)
                nj = next((j for j in range(k + 1, len(sw)) if times[j]), None)
                nxt = times[nj][0] if nj is not None else line_t1
                run = [j for j in range(k, nj if nj is not None else len(sw))]
                lens = [max(1, len(A[j])) for j in run]
                tot, acc = sum(lens), 0
                for j, L in zip(run, lens):
                    times[j] = (prev + (nxt - prev) * acc / tot, prev + (nxt - prev) * (acc + L) / tot)
                    acc += L
        words, last = [], line_t0 - 0.05
        for w, (t0, t1) in zip(sw, times):
            t0 = max(t0, last)
            t1 = max(t1, t0 + 0.04)
            words.append({"w": w, "start": round(t0, 3), "end": round(t1, 3)})
            last = t1
        out_lines.append({"id": ln["id"], "text": ln["text"], "start": words[0]["start"], "end": words[-1]["end"], "words": words})
        heard = " ".join(w["w"] for w in ws)
        sim = difflib.SequenceMatcher(a=spoken(ln["text"]), b=spoken(heard)).ratio()
        report.append((ln["id"], sim, heard, sum(1 for o in ops if o[0] == "equal" for _ in range(o[2] - o[1])), len(sw)))
    speech_end = out_lines[-1]["end"]
    hold = float(script.get("hold", 1.5))
    tm = {"stub": False, "source": f"kokoro {script.get('voice')} {script.get('speed')} + faster-whisper small.en int8",
          "duration": round(speech_end + hold, 3), "speechEnd": speech_end, "hold": hold, "voiceFile": "vo/vo.wav",
          "lines": out_lines}
    (root / "vo" / "timing.json").write_text(json.dumps(tm, indent=1, ensure_ascii=False), encoding="utf-8")
    write_js_global(root / "vo" / "timing.js", "MF_TIMING", tm)
    (root / "vo" / "whisper.json").write_text(json.dumps(raw, indent=1, ensure_ascii=False), encoding="utf-8")
    print("line check (faster-whisper vs script):")
    for lid, sim, heard, matched, n in report:
        flag = "  " if sim >= 0.8 else "!!"
        print(f" {flag} {lid:>9s} {sim * 100:5.1f}%  words matched {matched}/{n}  heard: {heard}")
    n = sum(len(l["words"]) for l in out_lines)
    print(f"\nspeech ends {speech_end:.2f} s · film {tm['duration']:.2f} s with the {hold} s hold · {n} words · "
          f"{n / speech_end * 60:.0f} wpm overall")


if __name__ == "__main__":
    main(sys.argv[1])

"""Time every word of the joined narration with faster-whisper, and map the times onto the script's words.

Reads vo/audio/vo.wav, vo/data/join.json (where each line's clip sits) and vo/script.json (the words as written).
faster-whisper `small` (int8, CPU, word_timestamps) transcribes each line's clip on its own (timestamps cannot drift); inside each line's clip window its
words are matched to the script's words (difflib on normalised tokens: digits <-> words, punctuation dropped).
Matched words take Whisper's times; unmatched script words are spread over the gap between their matched neighbours
in proportion to their length. Writes vo/data/vo.json in the engine's format:
  {duration, voice, aligner, words, wpm_overall, wpm_speech, lines: [{id, text, start, end, words: [{w, start, end}]}]}
and prints the match rate per line. Everything downstream (shots, captions, light and sound cues) reads vo.json.

usage: python -I tools/align_vo.py      (a Python with faster_whisper; on this machine the anaconda python)
"""
import difflib
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = {2: "twenty", 3: "thirty", 4: "forty", 5: "fifty", 6: "sixty", 7: "seventy", 8: "eighty", 9: "ninety"}
NAME = "zeythar"          # the series name: Whisper spells it many ways (zaythar, zethar, the, zeitar...)
FILLERS = {"ha", "haha", "hahaha", "hah", "heh", "hehe", "mm", "um", "uh", "hmm"}


def num_words(n):
    n = int(n)
    if n < 20:
        return [ONES[n]]
    if n < 100:
        return [TENS[n // 10]] + ([ONES[n % 10]] if n % 10 else [])
    if 100 <= n <= 1259 and n % 100 < 60 and not (1900 <= n <= 2099):   # a time heard as digits: 247 -> two forty seven
        return num_words(n // 100) + (num_words(n % 100) if n % 100 else ["o'clock"])
    if 1900 <= n <= 2099:      # years: 2019 -> twenty nineteen
        return num_words(n // 100) + (num_words(n % 100) if n % 100 >= 10 else (["oh"] + num_words(n % 100) if n % 100 else ["hundred"]))
    return [str(n)]


def namelike(w):
    import difflib
    r = difflib.SequenceMatcher(None, w, NAME).ratio()
    return w == NAME or (w[:1] == "z" and r >= 0.4) or (w[:1] in "xsc" and r >= 0.6)


def toks(s, heard=False):
    """normalised tokens: lower case, times and numbers spelt out (2:30 -> two thirty, 2019 -> twenty nineteen),
    a.m. -> am, the series name folded (Whisper spells it many ways), laughs/fillers dropped from what was heard"""
    import re
    s = s.lower().replace("’", "'").replace("…", " ").replace("-", " ")
    s = re.sub(r"\ba\.\s?m\.?", " am ", s); s = re.sub(r"\bp\.\s?m\.?", " pm ", s)
    s = re.sub(r"(\d+),000", lambda m: m.group(1) + " thousand", s)
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"\bgood night\b", "goodnight", s)
    s = re.sub(r"(\d{1,2})[:.](\d\d)", lambda m: " " + " ".join(num_words(m.group(1)) + (num_words(m.group(2)) if m.group(2) != "00" else ["o'clock"])) + " ", s)
    raw = []
    for w in re.findall(r"[a-z0-9']+", s):
        if w.isdigit():
            raw += num_words(w)
        elif heard and w in FILLERS:
            continue
        else:
            raw.append(w)
    # fold the series name (Whisper sometimes splits it: "zay thar")
    res, i = [], 0
    while i < len(raw):
        if i + 1 < len(raw) and raw[i][:1] in "zxsc" and len(raw[i]) <= 4 and namelike(raw[i] + raw[i + 1]):
            res.append(NAME); i += 2
        else:
            res.append(NAME if namelike(raw[i]) else raw[i]); i += 1
    return res


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    spec = json.load(open(os.path.join(ROOT, "vo", "script.json"), encoding="utf-8"))
    join = json.load(open(os.path.join(ROOT, "vo", "data", "join.json"), encoding="utf-8"))
    from faster_whisper import WhisperModel
    model = WhisperModel("small", device="cpu", compute_type="int8")
    # no initial_prompt: with one, small sometimes drops or garbles whole opening segments on tightly joined takes
    from scipy.io import wavfile
    sr, audio = wavfile.read(os.path.join(ROOT, "vo", "audio", "vo.wav"))
    audio = audio.astype("float32")
    if audio.ndim == 2:
        audio = audio.mean(axis=1)
    if sr != 16000:
        from scipy.signal import resample_poly
        audio = resample_poly(audio, 1, sr // 16000).astype("float32") if sr % 16000 == 0 else resample_poly(audio, 16000, sr).astype("float32")
    hw = []  # whisper words: (token, start, end), per line clip (each clip on its own: timestamps cannot drift across lines)
    for jl in join["lines"]:
        a0, a1 = max(0.0, jl["start"] - 0.08), jl["end"] + 0.08
        seg = audio[int(a0 * 16000): int(a1 * 16000)]
        segs, info = model.transcribe(seg, language="en", beam_size=5, word_timestamps=True, vad_filter=False, condition_on_previous_text=False)
        raw = []
        for sgm in segs:
            for w in sgm.words or []:
                for t in toks(w.word, heard=True):
                    raw.append([t, a0 + w.start, a0 + w.end])
        # merge tokens Whisper splits: "a" + "m" -> am, "good" + "night" -> goodnight
        k = 0
        while k < len(raw) - 1:
            pair = raw[k][0] + raw[k + 1][0]
            if pair in ("am", "pm", "goodnight"):
                raw[k] = [pair, raw[k][1], raw[k + 1][2]]; del raw[k + 1]
            k += 1
        hw += [tuple(x) for x in raw]
    lines, total_m, total_n = [], 0, 0
    for jl, sl in zip(join["lines"], spec["lines"]):
        a0, a1 = jl["start"] - 0.12, jl["end"] + 0.12
        H = [h for h in hw if a0 <= (h[1] + h[2]) / 2 <= a1]
        # script words (with punctuation, as captions show them) and their normalised token runs
        sw = re.findall(r"\S+", sl["text"])
        stoks, owner = [], []
        for i, w in enumerate(sw):
            for t in toks(w):
                stoks.append(t); owner.append(i)
        sm = difflib.SequenceMatcher(a=stoks, b=[h[0] for h in H], autojunk=False)
        times = [None] * len(sw)
        for blk in sm.get_matching_blocks():
            for k in range(blk.size):
                i = owner[blk.a + k]; h = H[blk.b + k]
                if times[i] is None:
                    times[i] = [h[1], h[2]]
                else:
                    times[i][1] = h[2]
        m = sum(1 for x in times if x is not None)
        total_m += m; total_n += len(sw)
        # interpolate the unmatched words between matched neighbours (or the clip edges), by length
        lo = jl["start"] + 0.06; hi = jl["end"] - 0.12
        i = 0
        while i < len(sw):
            if times[i] is not None:
                i += 1; continue
            j = i
            while j < len(sw) and times[j] is None:
                j += 1
            t0 = times[i - 1][1] if i > 0 else lo
            t1 = times[j][0] if j < len(sw) else hi
            L = [max(1, len(re.sub(r"[^A-Za-z0-9]", "", sw[k]))) for k in range(i, j)]
            tot = sum(L); t = t0
            for k, l in zip(range(i, j), L):
                d = (t1 - t0) * l / tot; times[k] = [t, t + d]; t += d
            i = j
        words = [{"w": w, "start": round(float(t[0]), 3), "end": round(float(max(t[1], t[0] + 0.05)), 3)} for w, t in zip(sw, times)]
        lines.append({"id": sl["id"], "who": sl.get("who", "G"), "text": sl["text"], "start": words[0]["start"], "end": words[-1]["end"], "words": words, "matched": f"{m}/{len(sw)}"})
        print(f"{sl['id']}  {words[0]['start']:6.2f}-{words[-1]['end']:6.2f}  matched {m}/{len(sw)}  {sl['text']}")
    nw = sum(len(l["words"]) for l in lines)
    speech = sum(l["end"] - l["start"] for l in lines)
    vo = {"duration": join["duration"], "voice": "per-line wavs in vo/lines (see script.json voice for the placeholder)", "aligner": "faster-whisper small, word timestamps",
          "words": nw, "wpm_overall": round(nw / join["duration"] * 60, 1), "wpm_speech": round(nw / max(speech, 1e-6) * 60, 1),
          "match_rate": round(total_m / max(1, total_n), 4), "lines": lines}
    json.dump(vo, open(os.path.join(ROOT, "vo", "data", "vo.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print(f"\n{join['duration']:.2f} s · {nw} words · {vo['wpm_overall']} wpm overall · {vo['wpm_speech']} wpm while speaking · whisper matched {total_m}/{total_n} words")


if __name__ == "__main__":
    main()

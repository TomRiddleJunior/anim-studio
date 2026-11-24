"""Time every word of the joined narration with faster-whisper, and map the times onto the script's words.

Reads vo/audio/vo.wav, vo/data/join.json (where each line's clip sits) and vo/script.json (the words as written).
faster-whisper `small` (int8, CPU, word_timestamps) transcribes the whole track; inside each line's clip window its
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


def num_words(n):
    n = int(n)
    if n < 20:
        return [ONES[n]]
    if n < 100:
        return [TENS[n // 10]] + ([ONES[n % 10]] if n % 10 else [])
    return [str(n)]


def toks(text):
    """normalised tokens: lower case, digits spelt out, hyphens split, 'am/pm' kept as words"""
    out = []
    text = re.sub(r"(\d+),000", lambda m: m.group(1) + " thousand", text.replace("’", "'"))
    for w in re.findall(r"[A-Za-z0-9']+", text.replace("-", " ")):
        w = w.lower()
        out += num_words(w) if w.isdigit() else [w]
    return out


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    spec = json.load(open(os.path.join(ROOT, "vo", "script.json"), encoding="utf-8"))
    join = json.load(open(os.path.join(ROOT, "vo", "data", "join.json"), encoding="utf-8"))
    from faster_whisper import WhisperModel
    model = WhisperModel("small", device="cpu", compute_type="int8")
    # no initial_prompt: with one, small sometimes drops or garbles whole opening segments on tightly joined takes
    segs, info = model.transcribe(os.path.join(ROOT, "vo", "audio", "vo.wav"), language="en", beam_size=5, word_timestamps=True,
                                  vad_filter=False)
    hw = []  # whisper words: (token, start, end)
    for s in segs:
        for w in s.words or []:
            for k, t in enumerate(toks(w.word)):
                hw.append((t, w.start, w.end))
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

"""Whisper `small` check of the final mix: transcribes score/audio/final.wav (faster-whisper, int8, CPU) and aligns the
words with vo/script.json; prints every line with the misheard words marked, and writes out/qa/whisper.json.

usage: python -I tools/whisper_check.py        (needs faster_whisper; the analyze_all.py interpreter has it)
"""
import difflib
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
from faster_whisper import WhisperModel  # noqa: E402

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
    script = json.load(open(os.path.join(ROOT, "vo", "script.json"), encoding="utf-8"))
    ref = []
    for l in script["lines"]:
        ref += [(w, l["id"]) for w in toks(re.sub(r"\[([^\]]+)\]\(/[^)]*/\)", r"\1", l["text"]))]
    model = WhisperModel("small", device="cpu", compute_type="int8")
    # transcribe only where speech exists (0 .. last voice + 0.6 s), without VAD: Silero VAD drops a lone final word
    # after a short exchange, and an unclipped tail of music invites hallucinations
    cues = json.load(open(os.path.join(ROOT, "score", "data", "cues.json")))
    end = max(w["end"] for w in cues["voice"]) + 0.6
    segs, info = model.transcribe(os.path.join(ROOT, "score", "audio", "final.wav"), beam_size=5, language="en", vad_filter=False,
                                  clip_timestamps=[0.0, end], condition_on_previous_text=False)
    hyp_text = " ".join(s.text for s in segs)
    hyp = toks(hyp_text, heard=True)
    sm = difflib.SequenceMatcher(a=[w for w, _ in ref], b=hyp, autojunk=False)
    issues = []
    for op, a0, a1, b0, b1 in sm.get_opcodes():
        if op != "equal":
            issues.append({"op": op, "script": " ".join(w for w, _ in ref[a0:a1]), "heard": " ".join(hyp[b0:b1]), "line": ref[a0][1] if a0 < len(ref) else ref[-1][1]})
    ratio = sm.ratio()
    json.dump({"ratio": round(ratio, 4), "issues": issues, "heard": hyp_text}, open(os.path.join(ROOT, "out", "qa", "whisper.json"), "w"), indent=1)
    print(f"word match {ratio * 100:.1f}% · {len(issues)} differences")
    for i in issues:
        print(f"  {i['line']}: {i['op']:8s} script='{i['script']}'  heard='{i['heard']}'")


if __name__ == "__main__":
    main()

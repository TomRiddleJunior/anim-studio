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

NUM = {"2": "two", "4": "four", "6": "six", "1": "one", "%": "percent"}


def toks(s):
    s = s.lower().replace("%", " percent").replace("-", " ")
    out = []
    for w in re.findall(r"[a-z0-9']+", s):
        out.append(NUM.get(w, w))
    return out


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    script = json.load(open(os.path.join(ROOT, "vo", "script.json"), encoding="utf-8"))
    ref = []
    for l in script["lines"]:
        ref += [(w, l["id"]) for w in toks(re.sub(r"\[([^\]]+)\]\(/[^)]*/\)", r"\1", l["text"]))]
    model = WhisperModel("small", device="cpu", compute_type="int8")
    segs, info = model.transcribe(os.path.join(ROOT, "score", "audio", "final.wav"), beam_size=5, language="en", vad_filter=True)
    hyp_text = " ".join(s.text for s in segs)
    hyp = toks(hyp_text)
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

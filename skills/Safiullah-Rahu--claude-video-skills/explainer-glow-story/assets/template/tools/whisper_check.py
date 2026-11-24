"""Whisper `small` read-back of the final mix: transcribes the mp4 (faster-whisper, CPU, int8, word timestamps) and
lines it up against vo/script.json, flagging any line whose words differ (names, numbers). Writes out/qa/whisper.txt.

usage: ~/anaconda3/python -I tools/whisper_check.py [out/glow-voicemail.mp4]
"""
import difflib
import json
import os
import re
import sys

from faster_whisper import WhisperModel

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = os.path.basename(ROOT)


def norm(s):
    s = s.lower().replace("-", " ")
    nums = {"412": "four hundred and twelve", "300": "three hundred", "9": "nine", "8": "eight", "6": "six"}
    for k, v in nums.items():
        s = re.sub(rf"\b{k}\b", v, s)
    s = s.replace("p.m.", "pm").replace("p. m.", "pm")
    return re.sub(r"[^a-z' ]", " ", s).split()


def main():
    mp4 = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "out", NAME + ".mp4")
    spec = json.load(open(os.path.join(ROOT, "vo", "script.json"), encoding="utf-8"))
    model = WhisperModel("small", device="cpu", compute_type="int8")
    segs, info = model.transcribe(mp4, beam_size=5, language="en", vad_filter=False, word_timestamps=True)
    words = [w for s in segs for w in s.words]
    heard = " ".join(w.word.strip() for w in words)
    ref = " ".join(l["text"] for l in spec["lines"])
    a, b = norm(ref), norm(heard)
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    lines = [f"whisper small · {mp4}", f"reference words {len(a)} · heard {len(b)} · match ratio {sm.ratio():.3f}", ""]
    diffs = [op for op in sm.get_opcodes() if op[0] != "equal"]
    for tag, i1, i2, j1, j2 in diffs:
        lines.append(f"  {tag:8s} script: {' '.join(a[i1:i2])!r:40s} heard: {' '.join(b[j1:j2])!r}")
    if not diffs:
        lines.append("  every word matches")
    lines += ["", "HEARD:", heard]
    out = os.path.join(ROOT, "out", "qa", "whisper.txt")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "w", encoding="utf-8").write("\n".join(lines))
    print("\n".join(lines[:3 + len(diffs) + 1]))


if __name__ == "__main__":
    main()

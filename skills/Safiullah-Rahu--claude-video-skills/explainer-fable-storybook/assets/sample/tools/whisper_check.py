"""Whisper `small` read-back of the final mix: transcribes the mp4 (faster-whisper, CPU, int8) and lines it up with
vo/script.json line by line (recall of each line's words), flagging lines under 0.8. Writes out/qa/whisper.txt.
usage: python -X utf8 -I tools/whisper_check.py [mp4]      (a python with faster-whisper installed)
"""
import difflib
import json
import os
import re
import sys

from faster_whisper import WhisperModel

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = os.path.basename(ROOT)
NUM = {"1966": "nineteen sixty six", "76": "seventy six", "17": "seventeen", "%": " percent"}


def norm(s):
    s = s.lower().replace("-", " ").replace("…", " ").replace("henhouse", "hen house")   # compounds Whisper joins
    for k in sorted(NUM, key=len, reverse=True):
        s = s.replace(k, " " + NUM[k] + " ")
    return re.sub(r"[^a-z' ]", " ", s).split()


def main():
    mp4 = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "out", NAME + ".mp4")
    spec = json.load(open(os.path.join(ROOT, "vo", "script.json"), encoding="utf-8"))
    model = WhisperModel("small", device="cpu", compute_type="int8")
    segs, _ = model.transcribe(mp4, beam_size=5, language="en", vad_filter=False)
    heard = " ".join(s.text.strip() for s in segs)
    hb = norm(heard)
    out = [f"whisper small · {os.path.basename(mp4)}", ""]
    worst = 1.0
    for l in spec["lines"]:
        ref = norm(l["text"])
        sm = difflib.SequenceMatcher(a=ref, b=hb, autojunk=False)
        hit = sum(b.size for b in sm.get_matching_blocks())
        rec = hit / max(1, len(ref))
        worst = min(worst, rec)
        out.append(f"  {'OK ' if rec >= 0.8 else 'LOW'} {rec:4.2f}  {l['id']:>7s}  {l['text']}")
    out += ["", f"worst line recall {worst:.2f}", "", "HEARD:", heard]
    os.makedirs(os.path.join(ROOT, "out", "qa"), exist_ok=True)
    open(os.path.join(ROOT, "out", "qa", "whisper.txt"), "w", encoding="utf-8").write("\n".join(out))
    print("\n".join(out[:len(spec["lines"]) + 4]))


if __name__ == "__main__":
    main()

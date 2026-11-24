"""Whisper `small` read-back of the final mix: transcribes the mp4 (faster-whisper, CPU, int8, no VAD) and lines it up
with vo/script.json line by line (recall of each line's words), flagging lines under 0.8. Writes out/qa/whisper.txt.
Run under the shared render lock with a python that has faster-whisper:
  python -X utf8 -I tools/whisper_check.py [video]
"""
import difflib
import json
import os
import re
import sys

from faster_whisper import WhisperModel

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = os.path.basename(ROOT)
ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()


def spell(n):
    n = int(n)
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ("" if n % 10 == 0 else " " + ONES[n % 10])
    if n < 1000:
        return ONES[n // 100] + " hundred" + ("" if n % 100 == 0 else " " + spell(n % 100))
    return str(n)


def norm(s):
    s = s.lower().replace("-", " ").replace("…", " ").replace("%", " percent")
    s = re.sub(r"(\d+):(\d\d)", lambda m: spell(m.group(1)) + " " + spell(m.group(2)), s)
    s = re.sub(r"\d+", lambda m: spell(m.group(0)), s)
    s = s.replace("metres", "meters").replace("metre", "meter").replace("kilometres", "kilometers")
    s = re.sub(r"\ba hundred\b", "one hundred", s)
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
        out.append(f"  {'OK ' if rec >= 0.8 else 'LOW'} {rec:4.2f}  {l['id']:>8s}  {l['text']}")
    out += ["", f"worst line recall {worst:.2f}", "", "HEARD:", heard]
    os.makedirs(os.path.join(ROOT, "out", "qa"), exist_ok=True)
    open(os.path.join(ROOT, "out", "qa", "whisper.txt"), "w", encoding="utf-8").write("\n".join(out))
    print("\n".join(out[:len(spec["lines"]) + 4]))


if __name__ == "__main__":
    main()

"""Whisper `small` read-back of the final mix: transcribes the mp4 (faster-whisper, CPU, int8) and lines it up with
vo/script.json line by line (recall of each line's words), flagging lines under 0.8. Writes out/qa/whisper.txt.
Run under the shared lock with the anaconda python (faster-whisper lives there):
  bash "tools/with_render_lock.sh" ~/anaconda3/python.exe -X utf8 -I tools/whisper_check.py
"""
import difflib
import json
import os
import re
import sys

from faster_whisper import WhisperModel

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = os.path.basename(ROOT)
NUM = {"120": "a hundred and twenty", "121": "a hundred and twenty one", "26": "twenty six", "14": "fourteen", "2": "two", "9": "nine",
       "1": "one", "3": "three", "5": "five", "7": "seven", "2:00": "two o'clock", "9:00": "nine o'clock"}


def norm(s):
    s = s.lower().replace("-", " ").replace("…", " ")
    for k in sorted(NUM, key=len, reverse=True):
        s = re.sub(rf"(?<![0-9:]){re.escape(k)}(?![0-9:])", NUM[k], s)
    s = s.replace("o'clock", "oclock").replace("one hundred", "a hundred").replace("hundred twenty", "hundred and twenty")
    return re.sub(r"[^a-z' ]", " ", s).split()


def main():
    mp4 = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "out", NAME + ".mp4")
    spec = json.load(open(os.path.join(ROOT, "vo", "script.json"), encoding="utf-8"))
    model = WhisperModel("small", device="cpu", compute_type="int8")
    segs, _ = model.transcribe(mp4, beam_size=5, language="en", vad_filter=False)
    heard = " ".join(s.text.strip() for s in segs)
    hb = norm(heard)
    out = [f"whisper small · {mp4}", ""]
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

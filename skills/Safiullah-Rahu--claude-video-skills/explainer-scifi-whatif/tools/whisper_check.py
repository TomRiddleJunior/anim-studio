"""Whisper check: does Whisper hear every scripted line in the delivered mix?
usage: <python with faster_whisper> -X utf8 -I tools/whisper_check.py [out/<key>.mp4] [model=small]
Writes out/qa/whisper.txt (segments) and out/qa/whisper_check.json (recall per line; a line passes at >= 0.8).
Numbers are compared in both spellings (\"ten\" / \"10\")."""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = os.path.basename(ROOT)


def _find_ff():
    if os.environ.get("FFMPEG_PATH"):
        return os.environ["FFMPEG_PATH"]
    d = os.path.dirname(os.path.abspath(__file__))
    for _ in range(7):
        c = os.path.join(d, "engine", "node_modules", "ffmpeg-static", "ffmpeg.exe")
        if os.path.exists(c):
            return c
        d = os.path.dirname(d)
    return "ffmpeg"


FF = _find_ff()

os.environ["PATH"] = os.path.dirname(FF) + os.pathsep + os.environ.get("PATH", "")
NUM = {"zero": "0", "one": "1", "two": "2", "three": "3", "four": "4", "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
       "eleven": "11", "twelve": "12", "fourteen": "14", "eighteen": "18", "twenty": "20", "thirty": "30", "forty": "40", "fifty": "50", "sixty": "60",
       "seventy": "70", "hundred": "100", "thousand": "1000", "million": "1000000"}


def norm(s):
    s = s.lower().replace("’", "'").replace("-", " ")
    return [w.strip(".'") for w in re.findall(r"[a-z0-9.']+", s) if w.strip(".'")]


def main():
    path = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].endswith(".mp4") else os.path.join(ROOT, "out", KEY + ".mp4")
    model_name = next((a.split("=")[1] for a in sys.argv[1:] if a.startswith("model=")), "small")
    from faster_whisper import WhisperModel
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    segs, _ = model.transcribe(path, language="en", vad_filter=False, condition_on_previous_text=False, word_timestamps=False)
    segs = list(segs)
    os.makedirs(os.path.join(ROOT, "out", "qa"), exist_ok=True)
    with open(os.path.join(ROOT, "out", "qa", "whisper.txt"), "w", encoding="utf-8") as f:
        for s in segs:
            f.write(f"[{s.start:7.2f}-{s.end:7.2f}] {s.text.strip()}\n")
    heard = " ".join(s.text for s in segs)
    H = set(norm(heard))
    H |= {NUM[w] for w in list(H) if w in NUM} | {k for k, v in NUM.items() if v in H}
    vo = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
    altp = os.path.join(ROOT, "vo", "whisper_alt.json")  # digit forms Whisper writes for spoken numbers ("2031", "99.99%")
    ALT = json.load(open(altp, encoding="utf-8")) if os.path.exists(altp) else {}
    H |= {w.replace(",", "") for w in H}
    rep = []
    for l in vo["lines"]:
        best = None
        for text in (l["text"], ALT.get(l["id"], l["text"])):
            ws = norm(text)
            miss = [w for w in ws if not (w in H or w.rstrip("s") in H or w + "s" in H or NUM.get(w, "#") in H or w.replace("'", "") in H or w.replace(",", "") in H)]
            r = {"id": l["id"], "recall": round(1 - len(miss) / max(1, len(ws)), 3), "missing": miss, "form": "alt" if text != l["text"] else "script"}
            if best is None or r["recall"] > best["recall"]:
                best = r
        rep.append(best)
    out = {"file": os.path.basename(path), "model": model_name, "lines": rep, "all_lines_heard": all(r["recall"] >= 0.8 for r in rep),
           "mean_recall": round(sum(r["recall"] for r in rep) / len(rep), 3)}
    json.dump(out, open(os.path.join(ROOT, "out", "qa", "whisper_check.json"), "w"), indent=1)
    for r in rep:
        if r["recall"] < 1:
            print(r)
    print("all lines heard:", out["all_lines_heard"], "mean recall", out["mean_recall"])


if __name__ == "__main__":
    main()

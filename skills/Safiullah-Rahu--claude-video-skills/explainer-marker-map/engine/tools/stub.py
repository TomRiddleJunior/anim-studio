"""Stub word times from script.json, for building the picture before any voice is recorded.

  python -I engine/tools/stub.py <slug> [--wps 2.9] [--pause 0.2]

Every word lasts in proportion to its syllables, at `wps` words per second on average; 0.2 s pauses after
sentence ends (. ? ! :) and line ends, 0.1 s after commas. Writes <slug>/vo/timing.json and timing.js
(window.MF_TIMING) in exactly the shape voice.py/align.py write later, so the film re-times itself when the real
voice replaces the stub.
"""
import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mfcommon import film_dir, norm_word, write_js_global  # noqa: E402

NUM_SYL = {"0": 2, "1": 1, "2": 1, "3": 1, "4": 1, "5": 1, "6": 1, "7": 2, "8": 1, "9": 2}


def syllables(w):
    w = norm_word(w)
    if re.fullmatch(r"\d{4}", w):  # a year: "nineteen eighty-seven"
        return 6
    if w.isdigit():
        return sum(NUM_SYL[c] for c in w) + 1
    n = 0
    for part in re.split(r"[-\s]", w):
        groups = re.findall(r"[aeiouy]+", part)
        k = len(groups)
        if part.endswith("e") and k > 1 and not part.endswith(("le", "ee")):
            k -= 1
        n += max(1, k)
    return max(1, n)


def build(script, wps, pause):
    words = [(i, w) for i, ln in enumerate(script["lines"]) for w in ln["text"].split()]
    weight = [0.45 + 0.55 * syllables(w) for _, w in words]
    unit = len(words) / wps / sum(weight)
    t = float(script.get("lead", 0.35))
    lines, k = [], 0
    for i, ln in enumerate(script["lines"]):
        ws = []
        toks = ln["text"].split()
        for j, w in enumerate(toks):
            d = weight[k] * unit
            ws.append({"w": w, "start": round(t, 3), "end": round(t + d * 0.92, 3)})
            t += d
            k += 1
            if j == len(toks) - 1:
                t += pause
            elif w.endswith((".", "?", "!", ":")):
                t += pause
            elif w.endswith((",", ";")):
                t += pause / 2
        lines.append({"id": ln["id"], "text": ln["text"], "start": ws[0]["start"], "end": ws[-1]["end"], "words": ws})
    last = lines[-1]["end"]
    hold = float(script.get("hold", 1.5))
    return {"stub": True, "source": f"stub {wps} words/s, {pause} s pauses", "duration": round(last + hold, 3),
            "speechEnd": last, "hold": hold, "lines": lines}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--wps", type=float, default=2.9)
    ap.add_argument("--pause", type=float, default=0.2)
    a = ap.parse_args()
    root = film_dir(a.slug)
    script = json.loads((root / "script.json").read_text(encoding="utf-8"))
    tm = build(script, a.wps, a.pause)
    (root / "vo").mkdir(exist_ok=True)
    (root / "vo" / "timing.json").write_text(json.dumps(tm, indent=1, ensure_ascii=False), encoding="utf-8")
    write_js_global(root / "vo" / "timing.js", "MF_TIMING", tm)
    n = sum(len(l["words"]) for l in tm["lines"])
    print(f"stub: {n} words, speech ends {tm['speechEnd']:.2f} s, film {tm['duration']:.2f} s "
          f"({n / tm['speechEnd'] * 60:.0f} wpm overall)")
    for l in tm["lines"]:
        print(f"  {l['id']:>9s} {l['start']:6.2f}–{l['end']:6.2f}  {l['text']}")


if __name__ == "__main__":
    main()

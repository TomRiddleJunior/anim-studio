"""Build step for a PS1 what-if reel: vo/data/vo.json -> assets/lib/film-vo.js (line + word times, captions),
out/<key>.srt, and index.html with the film's duration.
usage: python -X utf8 -I tools/build.py [key]
Captions follow the source grammar: one whole sentence per caption (wrapped to <= 26 characters a line, 2 lines max;
longer sentences split at punctuation), on from the first word, off at the next caption or 0.6 s after the last word.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = sys.argv[1] if len(sys.argv) > 1 else os.path.basename(ROOT)
END_CARD = float(os.environ.get("END_CARD", "3.0"))  # seconds of end card after the last word (+ 0.2 s)
MAXC = 26


def wrap(text, n=MAXC):
    words, lines, cur = text.split(), [], ""
    for w in words:
        if cur and len(cur) + 1 + len(w) > n:
            lines.append(cur)
            cur = w
        else:
            cur = (cur + " " + w).strip()
    if cur:
        lines.append(cur)
    return lines


def chunks(line):
    """split a line's words into caption chunks of <= 2 wrapped lines, preferring sentence/comma breaks."""
    ws = line["words"]
    out, cur = [], []
    for i, w in enumerate(ws):
        cur.append(w)
        txt = " ".join(x["w"] for x in cur)
        end_sent = re.search(r"[.?!]$", w["w"]) is not None
        nxt = ws[i + 1]["w"] if i + 1 < len(ws) else None
        if nxt is None:
            out.append(cur)
            break
        trial = txt + " " + nxt
        if len(wrap(trial)) > 2 or (end_sent and len(txt) > 14):
            out.append(cur)
            cur = []
    return out


def srt_t(t):
    h, r = divmod(max(0.0, t), 3600)
    m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s % 1) * 1000)) % 1000:03d}"


def main():
    vo = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
    lines = vo["lines"]
    caps = []
    for ln in lines:
        for ch in chunks(ln):
            caps.append({"id": ln["id"], "text": " ".join(w["w"] for w in ch), "on": round(ch[0]["start"] - 0.04, 3), "end": ch[-1]["end"]})
    for i, c in enumerate(caps):
        nxt = caps[i + 1]["on"] if i + 1 < len(caps) else c["end"] + 0.8
        c["off"] = round(min(nxt - 0.02, c["end"] + 0.6), 3)
        c["lines"] = wrap(c["text"])
    last = lines[-1]["end"]
    dur = round(last + 0.2 + END_CARD, 2)
    data = {"dur": dur, "endCard": round(last + 0.2, 2),
            "lines": {l["id"]: {"start": l["start"], "end": l["end"], "text": l["text"], "words": [[w["w"], w["start"], w["end"]] for w in l["words"]]} for l in lines},
            "caps": caps}
    with open(os.path.join(ROOT, "assets", "lib", "film-vo.js"), "w", encoding="utf-8") as f:
        f.write("window.FILM_VO = " + json.dumps(data, ensure_ascii=False) + ";\n")
    os.makedirs(os.path.join(ROOT, "out"), exist_ok=True)
    with open(os.path.join(ROOT, "out", f"{KEY}.srt"), "w", encoding="utf-8") as f:
        for i, c in enumerate(caps, 1):
            f.write(f"{i}\n{srt_t(c['on'])} --> {srt_t(c['off'])}\n{' '.join(c['lines'])}\n\n")
    # index.html duration
    p = os.path.join(ROOT, "index.html")
    if os.path.exists(p):
        s = open(p, encoding="utf-8").read()
        s = re.sub(r'data-duration="[\d.]+"', f'data-duration="{dur}"', s)
        open(p, "w", encoding="utf-8").write(s)
    print(f"dur {dur} s, {len(caps)} captions, end card at {data['endCard']}")


if __name__ == "__main__":
    main()

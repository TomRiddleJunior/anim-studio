"""Sidecar captions (SRT + WebVTT) from the aligned lyrics (data/lyrics.json).

Cues are at most 2 lines of 42 characters, split at punctuation where possible. Each cue is shown from its first
word until shortly after its last, and never overlaps the next cue.

   python tools/captions.py   -> out/the-state-of-ai-oct-2026.srt / .vtt
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LY = json.loads((ROOT / "data" / "lyrics.json").read_text(encoding="utf-8"))
MAXC = 42
NAME = "the-state-of-ai-oct-2026"


def chunks(words):
    out, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        text = " ".join(x["w"] for x in cur)
        rest = " ".join(x["w"] for x in words[i + 1:])
        if len(text) > 2 * MAXC - 8 or (len(text) > MAXC and w["w"][-1] in ",:;.?" and len(rest) > 12):
            out.append(cur); cur = []
    if cur:
        out.append(cur)
    return out


def wrap(text):
    if len(text) <= MAXC:
        return text
    ws = text.split(" ")
    best = min(range(1, len(ws)), key=lambda i: abs(len(" ".join(ws[:i])) - len(" ".join(ws[i:]))))
    return " ".join(ws[:best]) + "\n" + " ".join(ws[best:])


cues = []
for line in LY["lines"]:
    for ch in chunks(line["words"]):
        cues.append([ch[0]["start"], ch[-1]["end"] + 0.35, wrap(" ".join(x["w"] for x in ch))])
for i in range(len(cues) - 1):
    cues[i][1] = min(cues[i][1], cues[i + 1][0] - 0.02)


def ts(t, sep):
    h, r = divmod(max(0.0, t), 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d}{sep}{int(round((s - int(s)) * 1000)) % 1000:03d}"


srt, vtt = [], ["WEBVTT", ""]
for i, (a, b, text) in enumerate(cues, 1):
    srt += [str(i), f"{ts(a, ',')} --> {ts(b, ',')}", text, ""]
    vtt += [f"{ts(a, '.')} --> {ts(b, '.')}", text, ""]
out = ROOT / "out"
(out / f"{NAME}.srt").write_text("\n".join(srt), encoding="utf-8")
(out / f"{NAME}.vtt").write_text("\n".join(vtt), encoding="utf-8")
print(f"{len(cues)} caption cues -> out/{NAME}.srt / .vtt")

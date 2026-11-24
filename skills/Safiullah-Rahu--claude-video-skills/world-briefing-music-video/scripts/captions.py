"""Sidecar captions (SRT + WebVTT) from the narration's word times (data/vo.json): cues of at most 2 lines x 42
characters, split at punctuation where possible, each shown from its first word to shortly after its last.
   python tools/captions.py   -> out/why-is-the-sky-blue.srt / .vtt
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VO = json.loads((ROOT / "data" / "vo.json").read_text(encoding="utf-8"))
MAXC = 42


def chunks(words):
    """Split a line's words into cues of <= 2 x MAXC characters, preferring breaks after punctuation."""
    out, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        text = " ".join(x["w"] for x in cur)
        rest = " ".join(x["w"] for x in words[i + 1:])
        if len(text) > 2 * MAXC - 8 or (len(text) > MAXC and w["w"][-1] in ",:;" and len(rest) > 12):
            if len(text) > 2 * MAXC:
                cur.pop()
                out.append(cur)
                cur = [w]
            else:
                out.append(cur)
                cur = []
    if cur:
        out.append(cur)
    return out


def ts(t, sep=","):
    h, r = divmod(max(0.0, t), 3600)
    m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d}{sep}{int(round((s - int(s)) * 1000)):03d}"


def balanced(text):
    """One line if it fits, else two lines split at the space nearest the middle."""
    if len(text) <= MAXC:
        return [text]
    mid = len(text) / 2
    sp = [i for i, ch in enumerate(text) if ch == " "]
    ok = [i for i in sp if i <= MAXC and len(text) - i - 1 <= MAXC] or sp
    i = min(ok, key=lambda k: abs(k - mid))
    return [text[:i], text[i + 1:]]


cues = []
for l in VO["lines"]:
    for ch in chunks(l["words"]):
        text = " ".join(x["w"] for x in ch)
        cues.append([ch[0]["start"], ch[-1]["end"] + 0.35, balanced(text)])
for a, b in zip(cues, cues[1:]):
    a[1] = min(a[1], b[0] - 0.04)
srt, vtt = [], ["WEBVTT", ""]
for i, (s, e, lines) in enumerate(cues, 1):
    srt += [str(i), f"{ts(s)} --> {ts(e)}", *lines, ""]
    vtt += [f"{ts(s, '.')} --> {ts(e, '.')}", *lines, ""]
out = ROOT / "out"
out.mkdir(exist_ok=True)
(out / "why-is-the-sky-blue.srt").write_text("\n".join(srt), encoding="utf-8")
(out / "why-is-the-sky-blue.vtt").write_text("\n".join(vtt), encoding="utf-8")
print(f"{len(cues)} caption cues -> out/why-is-the-sky-blue.srt / .vtt")

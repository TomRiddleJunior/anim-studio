"""Whisper `small` read-back of the final mix: transcribes the mp4 (faster-whisper, CPU, int8) and lines it up against
vo/script.json word by word; lists every difference and a per-line recall. Writes out/qa/whisper.txt.
Run under the render lock:  bash ".../with_render_lock.sh" ~/anaconda3/python -X utf8 -I tools/whisper_check.py
"""
import difflib
import json
import os
import re
import sys

from faster_whisper import WhisperModel

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = os.path.basename(ROOT)
NUM = {"one": "1", "two": "2", "zero": "0", "oh": "0", "four": "4", "forty": "40", "fortytwo": "42", "hundred": "100"}


def norm(s):
    s = s.lower().replace("-", " ").replace("’", "'")
    s = re.sub(r"([a-z])(\d)", r"\1 \2", s)
    s = re.sub(r"(\d)([a-z])", r"\1 \2", s)
    s = s.replace("b crypt", "bcrypt").replace("s crypt", "scrypt").replace("argon 2", "argon2").replace("argon two", "argon2")
    return [w for w in re.sub(r"[^a-z0-9' ]", " ", s).split() if w]


def main():
    mp4 = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "out", NAME + ".mp4")
    spec = json.load(open(os.path.join(ROOT, "vo", "script.json"), encoding="utf-8"))
    model = WhisperModel("small", device="cpu", compute_type="int8")
    segs, info = model.transcribe(mp4, beam_size=5, language="en", vad_filter=False, word_timestamps=True,
                                  initial_prompt="Passwords 101. Plain text, hashing, salt, rainbow tables, bcrypt, scrypt, Argon2, SHA-256, sunflower42.")
    words = [w for s in segs for w in s.words]
    heard = " ".join(w.word.strip() for w in words)
    ref = " ".join(l["text"] for l in spec["lines"])
    a, b = norm(ref), norm(heard)
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    out = [f"whisper small - {mp4}", f"reference words {len(a)} - heard {len(b)} - match ratio {sm.ratio():.3f}", ""]
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag != "equal":
            out.append(f"  {tag:8s} script: {' '.join(a[i1:i2])!r:42s} heard: {' '.join(b[j1:j2])!r}")
    # per-line recall: share of each line's words found in order in the transcript
    out.append("")
    hb = " ".join(b)
    low = []
    for l in spec["lines"]:
        lw = norm(l["text"])
        m = difflib.SequenceMatcher(a=lw, b=b, autojunk=False)
        got = sum(blk.size for blk in m.get_matching_blocks())
        r = got / max(1, len(lw))
        if r < 0.85:
            low.append(f"  {l['id']} recall {r:.2f}: {l['text']}")
    out.append("lines under 0.85 recall: " + (str(len(low)) if low else "none"))
    out += low
    out += ["", "HEARD:", heard]
    os.makedirs(os.path.join(ROOT, "out", "qa"), exist_ok=True)
    open(os.path.join(ROOT, "out", "qa", "whisper.txt"), "w", encoding="utf-8").write("\n".join(out))
    print("\n".join(out[: out.index("HEARD:")]))


if __name__ == "__main__":
    main()

"""Whisper `small` check of the final mix (faster-whisper, int8, CPU), against vo/script.json. Two passes:
  full      the whole score/audio/final.wav in one long-form transcription (VAD on, as for Level −4)
  per-line  each narration line cut from the same mix (its vo.json span, -0.25 / +0.35 s) and transcribed alone:
            no 30-s window boundaries, so a phrase that falls on one is not dropped by the long-form segmentation
Numbers are compared as spoken words: "11.58" -> eleven fifty eight, "B1" -> b one, "-4" -> minus four, "6 a.m." ->
six a m, "3%" -> three percent. Writes out/qa/whisper.json.

usage: python -I tools/whisper_check.py        (needs faster_whisper; the system python has it)
"""
import difflib
import json
import os
import re
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
from faster_whisper import WhisperModel  # noqa: E402

ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()


def num_words(n):
    n = int(n)
    if n < 20:
        return [ONES[n]]
    if n < 100:
        return [TENS[n // 10]] + ([ONES[n % 10]] if n % 10 else [])
    return [str(n)]


def toks(s):
    s = s.lower().replace("%", " percent ").replace("−", "-")
    s = re.sub(r"(^|\s)-(\d)", r"\1minus \2", s)
    s = re.sub(r"\b([a-z])(\d+)\b", r"\1 \2", s)            # b1 -> b 1
    s = re.sub(r"(\d+)[.:](\d\d)\b", r"\1 \2", s)           # 11.58 / 11:58 -> 11 58
    s = re.sub(r"(\d)\s*([ap])\.?\s*m\b\.?", r"\1 \2 m", s)    # 10am / 6 a.m. -> 10 a m
    s = s.replace("-", " ").replace(".", " ")
    out = []
    for w in re.findall(r"[a-z0-9']+", s):
        out += num_words(w) if w.isdigit() else [w]
    return out


def compare(ref, hyp):
    sm = difflib.SequenceMatcher(a=[w for w, _ in ref], b=hyp, autojunk=False)
    issues = []
    for op, a0, a1, b0, b1 in sm.get_opcodes():
        if op != "equal":
            issues.append({"op": op, "script": " ".join(w for w, _ in ref[a0:a1]), "heard": " ".join(hyp[b0:b1]), "line": ref[a0][1] if a0 < len(ref) else ref[-1][1]})
    return sm.ratio(), issues


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    script = json.load(open(os.path.join(ROOT, "vo", "script.json"), encoding="utf-8"))
    vo = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
    ref = []
    for l in script["lines"]:
        ref += [(w, l["id"]) for w in toks(re.sub(r"\[([^\]]+)\]\(/[^)]*/\)", r"\1", l["text"]))]
    model = WhisperModel("small", device="cpu", compute_type="int8")
    wav = os.path.join(ROOT, "score", "audio", "final.wav")
    segs, _ = model.transcribe(wav, beam_size=5, language="en", vad_filter=True)
    full_text = " ".join(s.text for s in segs)
    r_full, i_full = compare(ref, toks(full_text))
    sr, a = wavfile.read(wav)
    scale = {np.dtype("int16"): 32768.0, np.dtype("int32"): 2147483648.0}.get(a.dtype, 1.0)   # sound.py writes int32 PCM
    a = a.astype(np.float32) / scale
    if a.ndim > 1:
        a = a.mean(axis=1)
    a16 = resample_poly(a, 16000, sr).astype(np.float32)
    per = []
    for l in vo["lines"]:
        s0, s1 = max(0, int((l["start"] - 0.25) * 16000)), int((l["end"] + 0.35) * 16000)
        s, _ = model.transcribe(a16[s0:s1], beam_size=5, language="en", vad_filter=False)
        per.append(" ".join(x.text.strip() for x in s))
    line_text = " ".join(per)
    r_line, i_line = compare(ref, toks(line_text))
    os.makedirs(os.path.join(ROOT, "out", "qa"), exist_ok=True)
    json.dump({"ref_words": len(ref), "full": {"ratio": round(r_full, 4), "issues": i_full, "heard": full_text},
               "per_line": {"ratio": round(r_line, 4), "issues": i_line, "heard": per}},
              open(os.path.join(ROOT, "out", "qa", "whisper.json"), "w"), indent=1)
    for name, r, iss in (("full mix, long-form", r_full, i_full), ("per line", r_line, i_line)):
        print(f"{name}: word match {r * 100:.1f}% · {len(iss)} differences · {len(ref)} script words")
        for i in iss:
            print(f"  {i['line']}: {i['op']:8s} script='{i['script']}'  heard='{i['heard']}'")


if __name__ == "__main__":
    main()

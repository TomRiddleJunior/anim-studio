"""Word-level timings of a clip's speech (faster-whisper `small`, CPU int8), for caption-timing and pacing study.
usage: python -X utf8 -I words.py <clip> <out.json>      (run it under the shared render lock)
Writes {"words": [[word, start, end], ...], "speaking_s": …, "wpm_overall": …, "wpm_speaking": …, "gaps": [...]}."""
import json
import sys

from faster_whisper import WhisperModel

clip, out = sys.argv[1], sys.argv[2]
m = WhisperModel("small", device="cpu", compute_type="int8")
segs, info = m.transcribe(clip, beam_size=5, language="en", word_timestamps=True, vad_filter=False)
words = []
for s in segs:
    for w in s.words or []:
        words.append([w.word.strip(), round(w.start, 3), round(w.end, 3)])
dur = info.duration
gaps = [round(b[1] - a[2], 3) for a, b in zip(words, words[1:])]
speak = sum(w[2] - w[1] for w in words) + sum(g for g in gaps if g < 0.35)
res = {"duration": dur, "n_words": len(words), "wpm_overall": round(len(words) / dur * 60, 1),
       "speaking_s": round(speak, 2), "wpm_speaking": round(len(words) / max(speak, 1) * 60, 1),
       "long_gaps": [[words[i][2], g] for i, g in enumerate(gaps) if g >= 0.35], "words": words}
json.dump(res, open(out, "w", encoding="utf-8"), indent=0)
print(clip, res["n_words"], "words", res["wpm_overall"], "WPM overall", res["wpm_speaking"], "while speaking")

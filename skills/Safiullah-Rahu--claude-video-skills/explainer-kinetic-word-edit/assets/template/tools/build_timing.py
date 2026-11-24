"""vo/data/vo.json -> assets/lib/timing.js (window.FILM_VO) + out/<slug>.srt (one caption per spoken phrase).
The film keys every reveal to these word times, so a new voice is: tts -> build_timing -> sound -> render.
usage: python -X utf8 -I tools/build_timing.py"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = os.path.basename(ROOT)
cfg = json.load(open(os.path.join(ROOT, "film.json"), encoding="utf-8"))
vo = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
lines = {}
for l in vo["lines"]:
    lines[l["id"]] = {"t0": l["start"], "t1": l["end"], "text": l["text"], "words": [[w["w"], w["start"], w["end"]] for w in l["words"]]}
# per-word overrides (e.g. the stretched vowel ends later than Kokoro said it)
for k, v in cfg.get("word_end_override", {}).items():
    lid, idx = k.split(":")
    lines[lid]["words"][int(idx)][2] = v
    lines[lid]["t1"] = max(lines[lid]["t1"], v)
out = {"dur": cfg["dur"], "bpm": cfg["bpm"], "beat0": cfg.get("beat0", 0.0), "lines": lines}
with open(os.path.join(ROOT, "assets", "lib", "timing.js"), "w", encoding="utf-8") as f:
    f.write("window.FILM_VO = " + json.dumps(out, indent=1) + ";\n")


def ts(t):
    return f"{int(t // 3600):02d}:{int(t % 3600 // 60):02d}:{int(t % 60):02d},{int(round(t % 1 * 1000)) % 1000:03d}"


os.makedirs(os.path.join(ROOT, "out"), exist_ok=True)
with open(os.path.join(ROOT, "out", KEY + ".srt"), "w", encoding="utf-8") as f:
    for i, l in enumerate(vo["lines"], 1):
        t1 = lines[l["id"]]["t1"]
        f.write(f"{i}\n{ts(l['start'])} --> {ts(t1)}\n{l['text']}\n\n")
print("timing.js + srt:", len(lines), "lines, dur", cfg["dur"])

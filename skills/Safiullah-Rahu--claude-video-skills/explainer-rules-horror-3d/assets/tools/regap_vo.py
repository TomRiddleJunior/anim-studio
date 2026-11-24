"""Re-time the aligned narration after changing only the pauses: join_vo.py lays the same clips out with the new
gaps; every word keeps its offset inside its clip, so vo/data/vo.json is shifted line by line from the previous
join (vo/data/join_prev.json) instead of re-running Whisper.
usage: cp vo/data/join.json vo/data/join_prev.json; python tools/join_vo.py; python -I tools/regap_vo.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, "vo", "data")
old = {l["id"]: l for l in json.load(open(os.path.join(D, "join_prev.json"), encoding="utf-8"))["lines"]}
new = json.load(open(os.path.join(D, "join.json"), encoding="utf-8"))
vo = json.load(open(os.path.join(D, "vo.json"), encoding="utf-8"))
nl = {l["id"]: l for l in new["lines"]}
for l in vo["lines"]:
    d = nl[l["id"]]["start"] - old[l["id"]]["start"]
    l["start"] = round(l["start"] + d, 3); l["end"] = round(l["end"] + d, 3)
    for w in l["words"]:
        w["start"] = round(w["start"] + d, 3); w["end"] = round(w["end"] + d, 3)
if "words" in vo and isinstance(vo["words"], list):
    pass
vo["duration"] = new["duration"]
n = sum(len(l["words"]) for l in vo["lines"])
vo["wpm_overall"] = round(n / new["duration"] * 60, 1)
json.dump(vo, open(os.path.join(D, "vo.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print(f"duration {new['duration']} s · {n} words · {vo['wpm_overall']} wpm overall")

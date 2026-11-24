"""episode.json (what a writer fills in) -> vo/script.json (what the pipeline reads).  Conversations Beyond Time.

episode.json:
{
  "title": "The 2:30 AM Committee", "series": "Conversations Beyond Time", "category": "SLEEP · OVERTHINKING",
  "clock": {"from": "2:30", "to": "2:47"},                      (the big clock's code hands: first shot -> last line)
  "end_card": {"rows": ["WHAT TIME DID YOU ACTUALLY", "FALL ASLEEP LAST NIGHT?"], "sub": "COMMENT BELOW"},
  "accent_words": ["2:30", "records.", ...],                    (caption keywords: amber for her, bright cyan for him)
  "lines": [
    {"who": "L" | "Z",
     "line": "Zeythar. It's 2:30 AM. I said I'd sleep at ten.",  (exactly as captioned; digits allowed)
     "say": "Zeythar. It's two thirty A.M. ...",                 (optional: what the TTS reads, numbers spelt out)
     "delivery": "Tired and flat, a little dramatic.",           (appended to the character's VoiceDesign description)
     "acting": ["blink_slow@AM.", "head_tilt"],                  (tag or tag@word; see EPISODE_GUIDE.md for the list)
     "react": ["smile@night"],                                   (optional: the OTHER character's listening acting)
     "picture": "GIRL_MCU",                                      (a shot preset from tools/timeline.py)
     "cuts": [{"at": "word", "shot": "WIDE"}],                   (optional in-line cuts)
     "orb": {"morph": "log", "at": "keep", ...},                 (optional orb morph; library in EPISODE_GUIDE.md)
     "tag": true,                                                (his name tag forms on this line; default: his first line)
     "pluck": "mandatory.",                                      (optional: a light pluck on this punchline word; <= 3)
     "beat_before": {"dur": 0.8, "shot": "WIDE_QUIET"},          (optional silent beat before the line, own shot)
     "pause_before": 0.75,                                       (optional: a held pause INSIDE this speaker's shot)
     "tint": "dawn", "turn": true, "final_tick_at": "2:47.",     (optional picture flags)
     "gap": 0.3, "tempo": 1.0, "max_pause": 0.5,                 (optional timing overrides)
     "alt_say": "Rude.", "alt_delivery": "..."}                  (optional fallback read, voiced as extra seeds 11, 12)
  ]
}
usage: python -I tools/episode.py episode.json [voices.json] [out.json]      (default out: vo/script.json)
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAP_CHANGE = 0.26          # silence between two speakers (s): the series is quick, natural talk
GAP_SAME = 0.34            # same speaker twice in a row
DEFAULT_SHOT = {"L": ["GIRL_MCU", "GIRL_CU"], "Z": ["HOOD_MCU", "HOOD_ORB", "WIDE"]}


def main():
    ep = json.load(open(sys.argv[1], encoding="utf-8"))
    vpath = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "voices.json")
    voices = json.load(open(vpath, encoding="utf-8"))
    lines, kz, kl = [], 0, 0
    first_z = next((i for i, l in enumerate(ep["lines"]) if l["who"] == "Z"), None)
    accents = set(w.lower() for w in ep.get("accent_words", []))
    for i, ln in enumerate(ep["lines"]):
        who = ln["who"]
        prev = ep["lines"][i - 1]["who"] if i else None
        gap = 0.0 if i == 0 else ln.get("gap", GAP_CHANGE if prev != who else GAP_SAME)
        if ln.get("beat_before"):
            gap += float(ln["beat_before"].get("dur", 0.8))
        if ln.get("pause_before"):
            gap += float(ln["pause_before"])
        shot = ln.get("picture")
        if not shot:
            if i == 0 and who == "L":
                shot = "GIRL_OPEN"                     # frame 0: the girl, the chip and the clock
            elif i == first_z:
                shot = "HOOD_ORB_TAG"                  # his name tag forms on his first line: frame it
            else:
                pool = DEFAULT_SHOT[who]
                shot = pool[(kz if who == "Z" else kl) % len(pool)]
        if who == "Z":
            kz += 1
        else:
            kl += 1
        d = {"id": f"l{i + 1:02d}", "who": who, "gap": round(gap, 3), "text": ln["line"], "delivery": ln.get("delivery", "Natural."),
             "shot": shot, "acting": ln.get("acting", []), "react": ln.get("react", [])}
        for key in ("say", "cuts", "orb", "pluck", "beat_before", "pause_before", "tint", "turn", "final_tick_at", "tempo", "max_pause",
                    "alt_say", "alt_delivery"):
            if key in ln:
                d[key] = ln[key]
        if ln.get("tag") or (first_z == i and "tag" not in ln):
            d["tag"] = True
        lines.append(d)
    script = {
        "title": ep.get("title", ""), "series": ep.get("series", "Conversations Beyond Time"), "category": ep.get("category", ""),
        "lead": 0.10, "tail": ep.get("tail", 3.4), "trim_db": -42, "pad": 0.04,
        "max_pause": ep.get("max_pause", 0.32), "tempo": ep.get("tempo", {"Z": 1.0, "L": 1.0}), "level": {"Z": -17.0, "L": -17.0},
        "voices": voices, "lines": lines,
        "film": {"accent_words": sorted(accents), "clock": ep.get("clock", {"from": "11:52", "to": "11:54"}),
                 "cover_hook": ep.get("cover_hook"), "end_hold": ep.get("end_hold", 3.8),
                 "end_card": ep.get("end_card", {"rows": ["WHAT WOULD YOU", "HAVE SAID?"], "sub": "COMMENT BELOW"}),
                 "series_label": ep.get("series", "Conversations Beyond Time").upper(), "category": ep.get("category", "")},
    }
    out = sys.argv[3] if len(sys.argv) > 3 else os.path.join(ROOT, "vo", "script.json")
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    json.dump(script, open(out, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    words = sum(len(re.findall(r"\S+", l["text"])) for l in lines)
    print(f"{out}: {len(lines)} lines · {words} words (~{words / 2.45 + 0.3 * len(lines):.0f} s with gaps; standard episodes 60-90 s)")


if __name__ == "__main__":
    main()

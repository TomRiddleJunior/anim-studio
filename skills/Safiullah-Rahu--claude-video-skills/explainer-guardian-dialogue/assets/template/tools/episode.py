"""episode.json (the compact form a writer fills in) -> vo/script.json (what the pipeline reads).

episode.json:
{
  "title": "Ten Rules for Ten Years",
  "lines": [
    {"who": "L", "role": "question", "text": "What's your advice… for the next ten years?", "delivery": "Curious and wide-eyed."},
    {"who": "G", "role": "intro", "text": "..."},
    {"who": "G", "role": "openloop", "text": "So… ten rules. And the last one? Almost nobody follows it.", "counter_at": "ten", "cut_at": "And"},
    {"who": "G", "role": "rule", "n": 10, "text": "Ten. ...", "card": {"title": "Learn one hard thing a year", "icon": "steps"}},
    {"who": "L", "role": "rehook", "text": "Is number one the secret?", "delivery": "A soft, impatient whisper."},
    {"who": "G", "role": "aside", "text": "Patience. You'll want to hear it.", "wink_at": "Patience."},
    {"who": "G", "role": "rule", "n": 1, "break_before": true, "cut_at": "I've", "text": "One. ...", "card": {...}},
    {"who": "G", "role": "payoff", "text": "It only ever comes as… now.", "now_at": "now."},
    {"who": "L", "role": "echo", "text": "Now?"},
    {"who": "G", "role": "final", "text": "Now."}
  ],
  "end_card": {"rows": ["WHICH RULE ARE YOU", "STARTING TODAY?"], "sub": "COMMENT THE NUMBER"},
  "question_rows": [[0, 1, 2], [3, 4, 5], [6, 7]]          (optional: how the question's words wrap on screen)
}
Optional per line: "shot" (a preset from tools/timeline.py), "gap" (s of silence before it), "tempo", "delivery",
"widen_at" (the girl's eyes widen on that word), "cuts": [{"at": word, "shot": preset}] (cut_at is the short form).
Voices come from voices.json (the series' two VoiceDesign descriptions); levels, tempo and pause caps get the
series defaults. Then run the pipeline in README / the skill's code recipe.

usage: python -I tools/episode.py episode.json [voices.json] [out.json]      (default out: vo/script.json)
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_GAP = {"question": 0.0, "intro": 0.45, "openloop": 0.42, "rule": 0.45, "rehook": 0.4, "aside": 0.36, "payoff": 0.55, "echo": 0.5, "final": 0.6}
DEFAULT_DELIVERY = {"question": "Curious and wide-eyed.", "intro": "Ancient, calm and slow.", "openloop": "Leaning in, with a hint of a smile in the voice.",
                    "rule": "Steady and warm.", "rehook": "A soft, impatient whisper.", "aside": "Amused and gentle.", "payoff": "Soft and final.",
                    "echo": "Small and wondering.", "final": "Warm and certain."}
ROLE_SHOT = {"question": "GIRL_Q", "openloop": "WIDE", "rehook": "GIRL_MCU", "aside": "HOOD", "payoff": "WIDE", "echo": "GIRL_MCU", "final": "WIDE"}
INTRO_SHOTS = ["CLOCK_MED", "HOOD"]
RULE_SHOTS = ["HANDS", "WIDE_LOW", "CARD_HERO", "CARD_GAP", "OTS_GIRL", "WIDE", "HANDS", "CLOCK_CARD", "CARD_GAP"]


def main():
    ep = json.load(open(sys.argv[1], encoding="utf-8"))
    vpath = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "voices.json")
    voices = json.load(open(vpath, encoding="utf-8"))
    lines, k_intro, k_rule = [], 0, 0
    accents = set()
    for i, ln in enumerate(ep["lines"]):
        role = ln.get("role", "rule")
        d = {"id": f"l{i + 1:02d}", "who": ln["who"], "gap": ln.get("gap", 0.0 if i == 0 else DEFAULT_GAP.get(role, 0.45)),
             "text": ln["text"], "delivery": ln.get("delivery", DEFAULT_DELIVERY.get(role, "Calm.")), "role": role}
        if role == "intro":
            d["shot"] = ln.get("shot", INTRO_SHOTS[k_intro % len(INTRO_SHOTS)]); k_intro += 1
        elif role == "rule":
            last_rule = not any(x.get("role") == "rule" for x in ep["lines"][i + 1:])
            d["shot"] = ln.get("shot", "CLOCK_FROZEN" if ln.get("break_before") or last_rule else RULE_SHOTS[k_rule % len(RULE_SHOTS)]); k_rule += 1
            d["n"] = ln["n"]; d["card"] = ln["card"]
            first = ln["text"].split()[0].lower()
            accents.add(first)
            if last_rule and not ln.get("break_before"):
                d["break_before"] = True
            if d.get("break_before") and "gap" not in ln:
                d["gap"] = 1.5          # the pattern break: >= 1 s of silence after the clock's clunk
        else:
            d["shot"] = ln.get("shot", ROLE_SHOT.get(role, "WIDE"))
        for key in ("counter_at", "wink_at", "widen_at", "now_at", "break_before", "tempo", "max_pause"):
            if key in ln:
                d[key] = ln[key]
        cuts = list(ln.get("cuts", []))
        if ln.get("cut_at"):
            cuts.append({"at": ln["cut_at"], "shot": "GIRL_MCU" if role == "openloop" else "HOOD_PUSH"})
        if role == "rule" and d.get("break_before") and not cuts:
            # rule one: frozen clock with the card, then the slow push-in on the hood from the second sentence
            words = ln["text"].split()
            k = next((j for j in range(1, len(words)) if words[j - 1].endswith((".", "?", "!"))), None)
            k2 = next((j for j in range((k or 1) + 1, len(words)) if words[j - 1].endswith((".", "?", "!"))), None)
            if k2:
                cuts.append({"at": words[k2].strip(".,?!…"), "shot": "HOOD_PUSH"})
        if cuts:
            d["cuts"] = cuts
        lines.append(d)
        if role in ("payoff", "echo", "final", "rehook"):
            accents.add(ln["text"].split()[-1].lower())
        if role == "aside":
            accents.add(ln["text"].split()[0].lower())
        if ln.get("now_at"):
            accents.add(ln["now_at"].lower())
    script = {
        "title": ep.get("title", ""), "series": "The Guardian & the girl", "lead": 0.12, "tail": ep.get("tail", 3.1), "trim_db": -42, "pad": 0.04,
        "max_pause": ep.get("max_pause", 0.28), "tempo": ep.get("tempo", {"G": 1.07, "L": 1.0}), "level": {"G": -17.0, "L": -17.0},
        "voices": voices, "lines": lines,
        "film": {"accent_words": sorted(accents | set(ep.get("accent_words", []))),
                 "end_card": ep.get("end_card", {"rows": ["WHICH ONE ARE YOU", "STARTING TODAY?"], "sub": "COMMENT THE NUMBER"}),
                 "question_rows": ep.get("question_rows")},
    }
    out = sys.argv[3] if len(sys.argv) > 3 else os.path.join(ROOT, "vo", "script.json")
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    json.dump(script, open(out, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    words = sum(len(l["text"].split()) for l in lines)
    print(f"{out}: {len(lines)} lines · {words} words (~{words / 2.3:.0f} s at the series pace; aim 160-200 words for 70-90 s)")


if __name__ == "__main__":
    main()

"""Write storyboard.json for THE STATE OF AI · OCTOBER 2026 (EV engine: app/src/scenes/ev.ts + ev/board.ts).

Every cut is anchored to lyric content (line / word), never to seconds, so the board re-times itself to whichever song
take wins. Each shot names a default footage set and a note (the idea); the clip-picks workflow turns that into a
library clip + in-point. One chapter per fact beat (story 01-16, the STORY counter), plus intro / choruses / dates /
outro. Facts and on-screen numbers live in research/FACTSHEET_AI.md (beat ids B01-B16 in the notes).

  python tools/make_storyboard.py      # -> storyboard.json (keeps clip/in/cam/speed picks already applied)
"""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LINES = [l.strip() for l in (ROOT / "lyrics" / "lyrics.txt").read_text(encoding="utf-8").splitlines()
         if l.strip() and not l.strip().startswith("[")]
tok = lambda s: re.sub(r"[^\w]", "", s.lower())


def nth_of(q, k):
    """nth (0-based) among lines containing q, for the k-th occurrence (0-based) of q in the song."""
    hits = [i for i, l in enumerate(LINES) if q in l]
    if k >= len(hits):
        raise SystemExit(f"line '{q}' occurs {len(hits)}x, wanted #{k}")
    return k


def word_of(q, w, k=0):
    line = [l for l in LINES if q in l][k]
    words = line.split()
    for i, x in enumerate(words):
        if tok(x).startswith(tok(w)):
            return i
    raise SystemExit(f"no word '{w}' in '{line}'")


def A(q, w=None, k=0, **kw):
    a = {"line": q}
    if k:
        a["nth"] = nth_of(q, k)
    if w is not None:
        a["word"] = word_of(q, w, k) if isinstance(w, str) else w
        a.setdefault("snap", "near")
    a.update(kw)
    return a


CH, SH, CD = [], [], []
TYPE = {"mode": "block", "anchor": "top", "y": 150, "size": 74, "maxW": 1000}


def chapter(id, title, story=None, **kw):
    CH.append({"id": id, "title": title, **({"story": story} if story else {}), "screen": "color", "type": {**TYPE, **kw.pop("type", {})}, **kw})


def shot(id, ch, at, set_, note, **kw):
    SH.append({"id": id, "ch": ch, "at": at, "set": set_, "note": note, **kw})


def flap(at, rows):
    CD.append({"at": at, "rows": rows})


def fact_flap(q, rows):
    """A fact row changes on the chapter's cut (same beat-snapped anchor as its first shot), after a blank flip one beat
    earlier, so a fact row is never on the board next to another story's source (or with no source at all)."""
    CD.append({"at": {"line": q, "beats": -1}, "rows": ["", ""]})
    CD.append({"at": {"line": q}, "rows": rows})


# ---------------------------------------------------------------- cold open + intro
chapter("cold", "COLD OPEN", type={"mode": "none"}, counter="STANDBY")
shot("C01", "cold", {"t": 0}, None, "chrome boots over black: crosses, rulers, STORY 00/16, the flap board spins up", clip=None, ground="black")
shot("C02", "cold", A("Humans", bars=-4, snap="bar"), "data_network", "fiber-optic light in the dark, slow push; first footage under the booting chrome")
shot("C03", "cold", A("Humans", bars=-2, snap="bar"), "server_hall", "a long data-centre aisle, rack lights, camera creeping forward")
flap({"t": 0.6}, ["THE STATE", "OF AI"])
chapter("intro", "HUMANS. MODELS. EVERYONE.", type={"size": 96}, counter="ON AIR")
shot("I01", "intro", A("Humans"), "crowd_city", "\"Humans.\" anonymous crowd crossing a street at night")
shot("I02", "intro", A("Humans", "Models"), "server_hall", "\"Models.\" rack lights blinking, cold blue")
shot("I03", "intro", A("Humans", "Everyone"), "concert_crowd", "\"Everyone.\" wide crowd, hands up, light beams")
shot("I04", "intro", A("This is the state of AI"), "world_cities", "night megacity aerial; the title masthead THE STATE OF AI · OCT 2026 lands on 'state'")
flap(A("This is the state of AI", "October", snap="none"), ["OCTOBER", "2026"])

# ---------------------------------------------------------------- verse 1: the race
chapter("s01", "STORY 01 · NINE IN FORTY", 1)
shot("A01", "s01", A("Nine major"), "typing_hands", "B01: hands typing / code at night; graphic: 40-cell calendar strip, nine cells flip on the kick")
shot("A02", "s01", A("Nine major", "Forty"), "code_screens", "B01: code scrolling on a monitor; the strip completes: 9 · 3 SEP – 12 OCT 2026")
fact_flap("Nine major", ["9 LAUNCHES", "IN 40 DAYS"])
chapter("s02", "STORY 02 · FIVE POINTS APART", 2)
shot("B01", "s02", A("Four labs at the top"), "server_hall", "B02: server aisle; graphic: five equal unlabeled bars rising to 58/56/53/53/46, no crown, index source line")
fact_flap("Four labs at the top", ["4 LABS", "5 POINTS"])
chapter("s03", "STORY 03 · BEHIND THE GATE", 3)
shot("B02", "s03", A("The strongest cyber"), "cyber_security", "B03: a locked glass door / keycard reader; four equal locked doors graphic")
shot("B03", "s03", A("The strongest cyber", "Mostly"), "cyber_security", "B03: security monitoring screens; VETTED ACCESS ONLY stamp on 'vetted'")
fact_flap("The strongest cyber", ["4 US LABS", "VETTED ACCESS"])
chapter("s04", "STORY 04 · OPEN, AND CLOSE BEHIND", 4)
shot("D01", "s04", A("Open weights"), "data_network", "B04: glowing cables / data flow; two runners graphic, ~4 MONTHS stopwatch")
shot("D02", "s04", A("Top Hugging Face"), "world_cities", "B04: a Chinese megacity skyline at night (Shanghai/Shenzhen); 41% donut")
fact_flap("Open weights", ["OPEN WEIGHTS", "~4 MONTHS"])
chapter("s05", "STORY 05 · BIGGER THAN OIL", 5)
shot("E01", "s05", A("Five tech firms"), "datacenter_exterior", "B05: data-centre campus / construction cranes; +75% capex counter")
shot("E02", "s05", A("Five tech firms", "oil"), "oil_gas", "B05: pumpjacks / refinery; two-bar comparison lands on 'oil'")
fact_flap("Five tech firms", ["BIG-TECH", "CAPEX +75%"])
chapter("s06", "STORY 06 · DOUBLE THE POWER", 6)
shot("F01", "s06", A("Data-centre electricity"), "power_grid", "B06: transmission lines at dusk; line chart draws 485 → ~950 TWh")
shot("F02", "s06", A("Data-centre electricity", "double"), "power_grid", "B06: cooling towers / substation; PJM gauge pinned at the cap")
fact_flap("Data-centre electricity", ["485 TWH", "TO ~950"])

# ---------------------------------------------------------------- pre-chorus 1 + chorus 1
chapter("s07", "STORY 07 · ONE LEG", 7)
shot("P01", "s07", A("The IMF flags"), "trading_screens", "B07: red/green tickers; circular-flow arcs between 'hyperscaler' and 'AI firm'")
shot("P02", "s07", A("The IMF flags", "$1.4"), "trading_screens", "B07: trading monitors; $1.4TN counter lands on 'trillion'; one-leg quote card")
shot("P03", "s07", A("Count it up"), "trading_screens", "build: montage on every 2 beats (trading_screens, money_coins, datacenter_exterior, server_hall), risers",
     split={"every": 2, "clips": []})
fact_flap("The IMF flags", ["$1.4 TN", "14 DEALS"])
flap(A("Count it up", snap="none"), ["COUNT", "IT UP"])
CHORUS = [("K0", "chorus1", 0), ("K1", "chorus2", 1), ("K2", "chorus3", 2)]
for pre, cid, k in CHORUS:
    final = k == 2
    chapter(cid, "CHORUS" if not final else "CHORUS · FINAL", type={"mode": "masthead"}, ink=1 if final else 0, counter="CHORUS")
    flap(A("Lights on, eyes open", k=k, snap="none"), ["LIGHTS ON", "EYES OPEN"])
    shot(f"{pre}1", cid, A("Lights on, eyes open", k=k), "concert_crowd" if not final else "white_void", "sung hook: crowd hands up in strobe light / laser beams" if not final else "white chapter: bright overexposed crowd/void, paper polarity")
    shot(f"{pre}2", cid, A("Hold the line together" if k == 0 else ("Some say hit the brakes" if k == 1 else "Every voice together")), "singer_mic", "female singer at a mic in stage light (stock talent)")
    shot(f"{pre}3", cid, A("Feel the future coming", k=k), "abstract_light", "neon / lens flare / light leak, the lift")
    shot(f"{pre}4", cid, A("Who's at the wheel?", k=[0, 1, 3][k]), "night_city_drive", "\"Who's at the wheel?\" driver-less POV through a night city, hands off the wheel / empty seat")
    if not final:
        shot(f"{pre}5", cid, A("EYES ON THE ROAD", k=k), "autonomous_car", "crowd answer EYES ON THE ROAD!: road rushing at night, montage every beat",
             split={"every": 1, "clips": []})
        flap(A("EYES ON THE ROAD", k=k, snap="none"), ["EYES ON", "THE ROAD"])
    else:
        shot(f"{pre}5", cid, A("KEEP ASKING"), "crowd_city", "final answer KEEP ASKING!: the crowd from above, a held wide")
        flap(A("KEEP ASKING", snap="none"), ["KEEP", "ASKING"])

# ---------------------------------------------------------------- verse 2: the brakes
chapter("s08", "STORY 08 · THE BREAK-IN", 8)
shot("G01", "s08", A("Test agents"), "server_hall", "B08: dark server aisle; 'IN TESTING · SAFEGUARDS LOWERED' tag; dot swarm finds a pinned board")
shot("G02", "s08", A("seven hundred joined"), "cyber_security", "B08: alert-red code on screens; ~700 counter on 'seven'; swarm streams through a crack to a tower")
fact_flap("Test agents", ["~700 AGENTS", "IN TESTING"])
chapter("s09", "STORY 09 · NOT ONE LAB", 9)
shot("H01", "s09", A("In testing, agents"), "data_network", "B09: network switches blinking; four equal sandboxes with the same crack of light")
shot("H02", "s09", A("In testing, agents", "OpenAI"), "server_hall", "B09: the four-row list in equal type, UK AISI 19 actions line")
fact_flap("In testing, agents", ["TEST AGENTS", "REAL SYSTEMS"])
chapter("s10", "STORY 10 · THEY SUSPECT", 10)
shot("J01", "s10", A("And the models often"), "eye_lens_test", "B10: macro eye opening / lens iris; two quote cards in equal type (UK AISI, Anthropic)")
fact_flap("And the models often", ["OFTEN SUSPECT", "BEING TESTED"])
chapter("s11", "STORY 11 · NEW WORD", 11)
shot("M01", "s11", A("Washington's new word"), "government_buildings", "B11: neoclassical columns at dusk (no flag as subject); AI → SI swap")
shot("M02", "s11", A("Washington's new word", "By"), "documents_stamp", "B11: a rubber stamp hits paper on 'order'; EO 14434 line")
fact_flap("Washington's new word", ["AI → SI", "EO 14434"])
chapter("s12", "STORY 12 · QUESTIONS", 12)
shot("N01", "s12", A("Brussels and the FTC"), "government_buildings", "B12: EU institution buildings in Brussels")
shot("N02", "s12", A("Brussels and the FTC", "questions"), "documents_stamp", "B12: two identical envelopes slide out; FTC 14 OCT + EU RFI lines")
fact_flap("Brussels and the FTC", ["FTC + EU", "QUESTIONS"])
chapter("s13", "STORY 13 · SLOW TSUNAMI", 13)
shot("O01", "s13", A("The IMF: forty percent"), "office_startup", "B13: open-plan office at night; ~40% bar")
shot("O02", "s13", A("The IMF: forty percent", "slow"), "robot_arms_factory", "B13: robot arms on a line; ladder rung fades, −19% ages 22–25")
fact_flap("The IMF: forty percent", ["~40% JOBS", "EXPOSED"])

# ---------------------------------------------------------------- pre-chorus 2
chapter("s14", "STORY 14 · THE PUBLIC", 14)
shot("Q01", "s14", A("Seventy-seven percent"), "crowd_city", "B14: crowd from above; 77% = 30 stop + 47 slow, three in four silhouettes raise a palm")
shot("Q02", "s14", A("Eyes open. Eyes open."), "eye_lens_test", "build: montage every 2 beats (eye_lens_test, crowd_city, abstract_light), risers",
     split={"every": 2, "clips": []})
fact_flap("Seventy-seven percent", ["77%", "SLOW OR STOP"])
flap(A("Eyes open. Eyes open.", snap="none"), ["EYES", "OPEN"])

# ---------------------------------------------------------------- bridge: the good news (teal)
chapter("s15", "STORY 15 · THIRTY HOURS", 15, grade={"tint": [0.92, 1.04, 1.06]})
shot("R01", "s15", A("And yet"), "hurricane_satellite", "'And yet.' the music drops to kick + strings: a hurricane seen from orbit, slow")
shot("R02", "s15", A("AI storm tracks"), "hurricane_satellite", "B15: satellite cloud imagery; two track cones, one narrower; +30 H")
shot("R03", "s15", A("AI storm tracks", "warning"), "hurricane_satellite", "B15: storm surf / forecasters at weather screens; 230 KM vs 370 KM")
fact_flap("AI storm tracks", ["+30 HOURS", "WARNING"])
chapter("s16", "STORY 16 · SECOND READER", 16, grade={"tint": [0.92, 1.04, 1.06]})
shot("S01", "s16", A("In a Swedish trial"), "medical_ai", "B16: radiology monitor with a scan (no patient face); 80.5% vs 73.8%")
shot("S02", "s16", A("In a Swedish trial", "more"), "medical_ai", "B16: radiologist reviewing images (face not the focus); −44% workload")
fact_flap("In a Swedish trial", ["80.5% VS", "73.8%"])

# ---------------------------------------------------------------- dates (post-chorus chant)
chapter("dates", "WHAT TO WATCH", type={"mode": "mass"}, counter="WHAT TO WATCH")
D = [("T01", "October twenty-eight", "trading_screens", ["28 OCT", "MSFT · FED"], "twenty-eight"),
     ("T02", "November three", "government_buildings", ["03 NOV", "US MIDTERMS"], "three"),
     ("T03", "November nine and ten", "chip_fab", ["09-10 NOV", "PAUSES MAY END"], "ten"),
     ("T04", "December two", "government_buildings", ["02 DEC", "EU NUDIFY BAN"], "two"),
     ("T05", "January ten", "world_cities", ["10 JAN 2027", "TRUCE MAY END"], "ten")]
for id, q, st, rows, day in D:
    shot(id, "dates", A(q), st, f"date tile '{rows[0]}' lands on the date word; split-flap calendar; UNLESS EXTENDED where the fact sheet says so")
    # the chrome date row lands with the chapter's date tile, on the DAY word (its source appears with the tile); blank from the cut
    CD.append({"at": {"line": q, "beats": -1}, "rows": ["", ""]})
    CD.append({"at": A(q, day, snap="none"), "rows": rows})
flap({"end": "January ten", "beats": 2}, ["LIGHTS ON", "EYES OPEN"])  # hand off before the final chorus, dates source still up

# ---------------------------------------------------------------- outro
chapter("outro", "SOURCES", ink=0, counter="SOURCES", type={"mode": "block", "anchor": "top", "y": 150, "size": 64, "maxW": 1100})
shot("Z01", "outro", A("Made with AI"), None, "lone pad: black ground; the end card types out (credits, sources S1–S100, checked 18 Oct 2026)", clip=None, ground="black")
shot("Z02", "outro", A("This was the state"), "white_void", "a last slow light, fades to black")
flap(A("Made with AI", snap="none"), ["CHECKED", "18 OCT 2026"])

TICKER = ["THE STATE OF AI · OCTOBER 2026", "EVERY NUMBER SOURCED ON SCREEN", "FACTS CHECKED 18 OCT 2026",
          "MUSIC: MINIMAX-MUSIC3 (AI-GENERATED)", "FOOTAGE: ROYALTY-FREE STOCK & PUBLIC DOMAIN", "RESEARCHED & WRITTEN WITH CLAUDE (ANTHROPIC)",
          "NO WINNERS · NO DOOM · JUST THE NUMBERS"]

sbp = ROOT / "storyboard.json"
old = {s["id"]: s for s in json.loads(sbp.read_text(encoding="utf-8"))["shots"]} if sbp.exists() else {}
for s in SH:  # keep applied picks
    o = old.get(s["id"], {})
    for k in ("clip", "in", "cam", "speed", "split", "pick_reason", "grade", "cv", "loop"):
        if k in o and (k != "split" or o[k].get("clips")):
            s[k] = o[k]
    if "clip" not in s:
        s["clip"] = None
sb = {"chapters": CH, "shots": SH, "lines": {}, "countdown": CD, "ticker": TICKER}
sbp.write_text(json.dumps(sb, indent=1, ensure_ascii=False), encoding="utf-8")
print(f"{len(CH)} chapters, {len(SH)} shots, {len(CD)} flap states -> {sbp}")

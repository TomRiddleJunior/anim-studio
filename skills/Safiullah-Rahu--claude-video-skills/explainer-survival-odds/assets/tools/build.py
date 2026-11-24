"""Build step for "Survival Odds · The Rig · Day 1": reads vo/script.json + vo/data/vo.json (Kokoro word times) and writes
  assets/lib/film-vo.js   window.FILM_VO = {dur, lines:{id:{t0,t1,words:[[w,s,e]]}}, T:{shot boundaries}}
  compositions/hud.html   the flat layer: the AI odds ring (tools/odds_ring.py), the HUD clock, tags, chips, the radio
                          panel, the countdown, "?", the map card, the supplies card, the plan, end cards, captions
  out/<key>.srt           the caption phrases (for the analyzer's WPM and for posting)
  index.html              root composition (world + hud + mix) with the real duration
  score/timing.json       shot clock, captions, sound cues (incl. the ring's sting / ticks / delta pops / glitch)
Every time is derived from a word in the voice-over, so re-voicing re-times the whole film.
usage: python -I tools/build.py
"""
import html
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from odds_ring import OddsRing  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = os.path.basename(ROOT)
SCRIPT = json.load(open(os.path.join(ROOT, "vo", "script.json"), encoding="utf-8"))
VO = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
DUR = round(VO["duration"], 2)
LINES = {l["id"]: l for l in VO["lines"]}
SPEC = {l["id"]: l for l in SCRIPT["lines"]}
COL = {"w": "#ffffff", "r": "#ff5a45", "g": "#46d483", "y": "#f7b733"}
TAG_TOP = 444            # the tag band sits under the ring (the ring + its label end at y ~400)


def norm(s):
    return re.sub(r"[^a-z0-9']", "", s.lower())


def L(i):
    return LINES[i]


def w(i, word, k=0):
    hits = [x for x in LINES[i]["words"] if norm(x["w"]).startswith(norm(word))]
    if not hits:
        raise KeyError(f"{i}:{word}")
    return hits[min(k, len(hits) - 1)]["start"]


# ------------------------------------------------------------------ shot boundaries (single source of truth)
T = {}
T["A1"] = 0.0                                # hook: the rig in the storm, the flare, orange clouds; the ring at 71 % (sting)
T["A2"] = w("l01", "consider") - 0.15        # closer drone past the flare boom (green wash on "lucky")
T["B"] = L("l02")["start"] - 0.35            # black beat: the rig small in the sea, the coast's glow, red eyes on the shore
T["C"] = L("l03")["start"] - 0.35            # control room: Mira at the console (name tag)
T["D"] = w("l03", "She", 1) - 0.15           # pull back out of the window: the height, the sea (140 KM)
T["E"] = L("l04")["start"] - 0.3             # control-room wide: empty chairs, the wall screen behind (plant 1)
T["E2"] = w("l04", "Tonight") - 0.2          # the gull on the rail, watching her through the window (dry gag)
T["F1"] = L("l05")["start"] - 0.25           # the pressure gauges
T["F2"] = w("l05", "Log") - 0.2              # the logbook
T["F3"] = w("l05", "Dinner") - 0.2           # dinner for one in the microwave
T["G"] = L("l06")["start"] - 0.3             # red wash: her face
T["H"] = L("l07")["start"] - 0.35            # dim: 9:40, the radio wakes
T["H2"] = w("l07", "The", 1) - 0.25          # the radio close + the typed panel (plant 2 on its third line)
T["I"] = L("l08")["start"] - 0.25            # Mira at the radio: the helicopter calls
T["I2"] = w("l08", "Ten") - 0.25             # outside: the helideck lights blink on; the countdown
T["J"] = L("l09")["start"] - 0.3             # she looks up the stairs at the helideck, a helicopter's lights in the sky ("?")
T["J2"] = w("l09", "said") - 0.12            # front: she shakes her head on "no"
T["K"] = L("l10")["start"] - 0.3             # telephoto: the heliport, a crowd at the fence (red eyes)
T["K2"] = w("l10", "helicopter") - 0.3       # the helicopter turns back, its lights shrinking (deadpan)
T["L1"] = L("l11")["start"] - 0.3            # "So Mira decided to stay." (green)
T["L2"] = w("l11", "The") - 0.25             # underwater: the dead sink past the legs into black
T["M"] = L("l12")["start"] - 0.3             # crane up from the waterline to the deck; the 140 KM map
T["N"] = L("l13")["start"] - 0.3             # the storeroom: RATIONS · 12 CREW · 30 DAYS; the card
T["O1"] = L("l14")["start"] - 0.3            # the watermaker: water into a jug
T["O2"] = w("l14", "And") - 0.2              # the flare and the generator skid (the card lifts away)
T["O3"] = w("l14", "gas") + 0.24             # the generator door (plant 3, the sticker), the card back: POWER ∞
T["Q1"] = L("l15")["start"] - 0.35           # the boat ladder winched up out of the waves
T["Q2"] = w("l15", "She", 1) - 0.2           # chain + padlock on the helideck stair gate (CUT OFF)
T["R"] = L("l16")["start"] - 0.35            # the desk: the plan ticks
T["R2"] = L("l17")["start"] - 0.25           # the ring at its biggest (97 %); "On paper": lamp flicker, dim
T["S"] = L("l18")["start"] - 0.35            # black beat: the coast's glow goes out section by section (plant 4); ??
T["Z1"] = L("l18")["end"] + 0.4              # end card 1
T["Z2"] = T["Z1"] + 2.7                      # end card 2
T = {k: round(v, 3) for k, v in T.items()}

# ------------------------------------------------------------------ the odds track (identity device)
ring = OddsRing(start=71)
ring.chip("YOU, AT HOME: 4%", 0.0, T["B"] - 0.1, "r")
ring.recalc(w("l07", "Outbreak"), -13, "OUTBREAK")
ring.recalc(w("l09", "no"), +14, "SAID NO")
ring.recalc(w("l11", "sink"), +15, "THE DEAD SINK")
ring.recalc(w("l13", "year"), +4, "FOOD · 1 YEAR")
ring.recalc(w("l14", "drinking") + 0.38, +3, "WATER")
ring.recalc(w("l14", "Forever"), +3, "POWER · OWN GAS")
ring.pulse(w("l17", "Ninety"), w("l17", "On"))
ring.glitch(w("l18", "forgot"))
COMPACT = []                                  # (t0, t1) ranges where the ring shrinks to a badge (face close-ups)
for a, b in COMPACT:
    ring.compact(a, b)

# ------------------------------------------------------------------ film-vo.js
fv = {"dur": DUR, "fps": 30, "T": T, "odds": [[round(t, 3), v] for t, v in ring.track()],
      "lines": {l["id"]: {"t0": l["start"], "t1": l["end"], "words": [[x["w"], x["start"], x["end"]] for x in l["words"]]} for l in VO["lines"]}}
open(os.path.join(ROOT, "assets", "lib", "film-vo.js"), "w", encoding="utf-8").write(
    "/* generated by tools/build.py from vo/data/vo.json */\nwindow.FILM_VO = " + json.dumps(fv, separators=(",", ":")) + ";\n")

# ------------------------------------------------------------------ captions: one phrase at a time, coloured by meaning
caps = []
for lid, spec in SPEC.items():
    words = LINES[lid]["words"]
    k = 0
    for text, col in spec["caps"]:
        n = len(text.replace("|", " ").split())
        chunk = words[k:k + n]
        assert len(chunk) == n, (lid, text)
        caps.append({"lid": lid, "text": text, "col": col, "t0": chunk[0]["start"], "t1": chunk[-1]["end"]})
        k += n
    assert k == len(words), (lid, k, len(words))
for i, c in enumerate(caps):
    nxt = caps[i + 1]["t0"] if i + 1 < len(caps) else DUR
    c["on"] = round(max(0.0, c["t0"] - 0.06), 3)
    c["off"] = round(min(nxt - 0.04, c["t1"] + 0.7, T["Z1"] - 0.05), 3)

# ------------------------------------------------------------------ overlay events
els, tl, cues = [], [], []


def clip(eid, t0, t1, inner, cls="", style=""):
    els.append(f'<div class="clip {cls}" id="{eid}" data-start="{t0:.3f}" data-duration="{max(0.05, t1 - t0):.3f}" style="{style}">{inner}</div>')


def pop(eid, t0, t1, kind="pop"):
    if kind == "pop":
        tl.append(f'tl.fromTo("#{eid} > .in", {{opacity: 0, scale: 0.72}}, {{opacity: 1, scale: 1, duration: 0.24, ease: "back.out(2.2)"}}, {t0:.3f});')
    elif kind == "rise":
        tl.append(f'tl.fromTo("#{eid} > .in", {{opacity: 0, y: 26}}, {{opacity: 1, y: 0, duration: 0.32, ease: "power3.out"}}, {t0:.3f});')
    tl.append(f'tl.to("#{eid} > .in", {{opacity: 0, duration: 0.2, ease: "none"}}, {t1 - 0.2:.3f});')


def tag(eid, t0, t1, title, sub=None, col="y", top=TAG_TOP):
    s = f'<div class="in tag {col}"><div class="tt">{html.escape(title)}</div>' + (f'<div class="ts">{html.escape(sub)}</div>' if sub else "") + "</div>"
    clip(eid, t0, t1, s, "tagw", f"top:{top}px;left:0;right:0;")
    pop(eid, t0, t1)
    cues.append({"t": round(t0, 3), "type": "tag", "col": col})


# the odds ring
r_els, r_tl, r_cues = ring.build()
els += r_els; tl += r_tl; cues += r_cues

# HUD clock (top-left): DAY 1 · time · NIGHT · STORM
HUD_ON, HUD_OFF = T["C"] + 0.25, T["S"]
clip("hudbox", HUD_ON, HUD_OFF, '<div class="in hud"><div class="day"><span class="dot"></span>DAY 1</div><div class="time"></div><div class="sub">NIGHT · STORM</div></div>')
tl.append(f'tl.fromTo("#hudbox > .in", {{opacity: 0, x: -24}}, {{opacity: 1, x: 0, duration: 0.35, ease: "power2.out"}}, {HUD_ON:.3f});')
tl.append(f'tl.to("#hudbox > .in", {{opacity: 0, duration: 0.25}}, {HUD_OFF - 0.25:.3f});')
times = [(HUD_ON, "9:31 PM", "w"), (w("l07", "nine"), "9:40 PM", "y"), (T["I"], "9:41 PM", "w"), (T["K"], "9:44 PM", "w"), (T["M"], "9:58 PM", "w"),
         (T["N"], "10:20 PM", "w"), (T["Q1"], "11:05 PM", "w"), (T["R"], "11:58 PM", "w")]
for i, (t0, txt, c) in enumerate(times):
    t1 = times[i + 1][0] if i + 1 < len(times) else HUD_OFF
    clip(f"tm{i}", t0, t1, f'<div class="in tm {c}">{txt}</div>', "tmw")
    if i == 0:
        tl.append(f'tl.fromTo("#tm{i} > .in", {{opacity: 0}}, {{opacity: 1, duration: 0.35}}, {t0:.3f});')
    else:
        tl.append(f'tl.fromTo("#tm{i} > .in", {{opacity: 0, y: 22}}, {{opacity: 1, y: 0, duration: 0.28, ease: "power3.out"}}, {t0:.3f});')
    if i + 1 < len(times):
        tl.append(f'tl.to("#tm{i} > .in", {{opacity: 0, y: -22, duration: 0.24, ease: "power2.in"}}, {t1 - 0.02:.3f});')
    else:
        tl.append(f'tl.to("#tm{i} > .in", {{opacity: 0, duration: 0.25}}, {t1 - 0.25:.3f});')

tag("nm", w("l03", "Meera"), T["D"] + 0.25, "MIRA · 33", "CONTROL-ROOM OPERATOR", "y")
tag("ft1", w("l03", "hundred") - 0.05, T["E"], "140 KM", "OUT AT SEA", "y")
chips = [("PRESSURES", w("l05", "Check")), ("WEATHER", w("l05", "Log")), ("DINNER FOR ONE", w("l05", "Dinner"))]
row = '<div class="chiprow">' + "".join(f'<div class="chip g" id="ch{i}"><span class="ck">✓</span>{html.escape(c)}</div>' for i, (c, _) in enumerate(chips)) + "</div>"
clip("chips", chips[0][1] - 0.05, T["G"], f'<div class="in">{row}</div>', "tagw", f"top:{TAG_TOP}px;left:0;right:0;")
tl.append(f'tl.set("#chips > .in", {{opacity: 1}}, {chips[0][1] - 0.05:.3f});')
for i, (c, t0) in enumerate(chips):
    tl.append(f'tl.fromTo("#ch{i}", {{opacity: 0, scale: 0.7}}, {{opacity: 1, scale: 1, duration: 0.22, ease: "back.out(2.4)"}}, {t0:.3f});')
    cues.append({"t": round(t0, 3), "type": "chip"})
tl.append(f'tl.to("#chips > .in", {{opacity: 0, duration: 0.2}}, {T["G"] - 0.2:.3f});')

# the radio panel: the shore base (3 lines, the third small: plant 2), then the helicopter's line
RP0, RP1 = T["H2"] + 0.05, T["I2"]
plines = [("Outbreak in Port Ness.", "r", w("l07", "Outbreak")), ("All flights stop at midnight.", "w", w("l07", "All")),
          ("SHORE CONTROL ROOM CLOSING 23:59", "p2", w("l07", "midnight") + 0.5), ("HELICOPTER ▸ ONE SEAT LEFT · 10 MIN", "y", w("l08", "One") - 0.1)]
inner = '<div class="in radio"><div class="rh">SHORE BASE · CH 16</div>' + "".join(f'<div class="rl {c}" id="rl{i}">{html.escape(s)}</div>' for i, (s, c, _) in enumerate(plines)) + "</div>"
clip("rp", RP0, RP1, inner, "tagw", f"top:{TAG_TOP - 6}px;left:0;right:0;")
pop("rp", RP0, RP1, "rise")
cues.append({"t": round(RP0, 3), "type": "panel"})
for i, (s, c, t0) in enumerate(plines):
    n = len(s)
    dur = min(1.1, n * 0.04)
    tl.append(f'tl.fromTo("#rl{i}", {{clipPath: "inset(0 100% 0 0)"}}, {{clipPath: "inset(0 0% 0 0)", duration: {dur:.3f}, ease: "steps({n})"}}, {t0 - 0.05:.3f});')
    cues.append({"t": round(t0 - 0.05, 3), "type": "type", "n": n, "dur": round(dur, 3)})
# signal rings over the radio while it crackles (H): screen position of the radio in shot H
RING_X, RING_Y = 560, 1085
rings = "".join(f'<div class="ring" id="rg{i}"></div>' for i in range(3))
RG0 = w("l07", "crackled") - 0.2
clip("rings", RG0, T["H2"], f'<div class="in rings">{rings}</div>', "", f"position:absolute;left:{RING_X}px;top:{RING_Y}px;width:0;height:0;")
tl.append(f'tl.set("#rings > .in", {{opacity: 1}}, {RG0:.3f});')
for i in range(3):
    tl.append(f'tl.set("#rg{i}", {{scale: 0.2, opacity: 0}}, 0);')
t = RG0
while t < T["H2"] - 0.3:
    for i in range(3):
        tl.append(f'tl.fromTo("#rg{i}", {{scale: 0.2, opacity: 0.9}}, {{scale: 1.6, opacity: 0, duration: 1.05, ease: "power1.out", immediateRender: false}}, {t + i * 0.32:.3f});')
    t += 1.05

# the countdown chip: 10:00 counting down (one span per second)
CD0, CD1 = w("l08", "Ten") - 0.05, w("l09", "no") + 0.35
secs = int(CD1 - CD0) + 1
spans = "".join(f'<span class="cdv" id="cd{i}">{"10:00" if i == 0 else "9:%02d" % (60 - i)}</span>' for i in range(secs))
clip("cd", CD0, CD1, f'<div class="in cdc"><span class="cdi">⏱</span><span class="cdn">{spans}</span></div>', "tagw", f"top:{TAG_TOP}px;left:0;right:0;")
pop("cd", CD0, CD1)
for i in range(secs):
    tl.append(f'tl.set("#cd{i}", {{opacity: 1}}, {CD0 + i:.3f});')
    if i:
        tl.append(f'tl.set("#cd{i - 1}", {{opacity: 0}}, {CD0 + i:.3f});')
        cues.append({"t": round(CD0 + i, 3), "type": "tick"})
cues.append({"t": round(CD0, 3), "type": "chip"})

# "?" over her head while she looks at the helideck (screen position = her head in shot J)
QM_X, QM_Y, QM0 = 245, 900, w("l09", "looked")
clip("qm", QM0 - 0.05, T["J2"] + 0.05, '<div class="in qm">?</div>', "", f"position:absolute;left:{QM_X}px;top:{QM_Y}px;")
tl.append(f'tl.fromTo("#qm > .in", {{opacity: 0, y: 30, scale: 0.4}}, {{opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(3)"}}, {QM0 - 0.05:.3f});')
tl.append(f'tl.to("#qm > .in", {{y: -10, duration: 0.45, ease: "sine.inOut", yoyo: true, repeat: 1}}, {QM0 + 0.3:.3f});')
tl.append(f'tl.to("#qm > .in", {{opacity: 0, duration: 0.15}}, {T["J2"] - 0.1:.3f});')
cues.append({"t": round(QM0 - 0.05, 3), "type": "question"})

tag("ft3", w("l10", "heliport") - 0.05, T["K2"], "PORT NESS", "HELIPORT", "y")
tag("ft4", w("l10", "land") - 0.05, T["L1"], "ONE WAY IN", None, "r")
tag("ft5", w("l11", "sink") + 0.05, T["M"] + 0.4, "WATER = WALL", None, "g")

# the map card: Port Ness at the top, the rig at the bottom, a dashed line drawing between them, 140 KM
MP0, MP1 = w("l12", "hundred") - 0.1, T["N"]
mapsvg = ('<svg viewBox="0 0 560 360" width="560" height="360">'
          '<path d="M0 0 H560 V70 C470 92 400 62 330 84 C250 108 190 74 120 92 C70 104 30 88 0 98 Z" fill="#20282e" stroke="#5d6a74" stroke-width="2"/>'
          + "".join(f'<circle cx="{x}" cy="{y}" r="2.6" fill="#ffc27a"/>' for x, y in [(150, 40), (170, 52), (196, 36), (214, 60), (240, 46), (262, 30), (282, 56), (300, 42), (320, 64), (342, 38), (230, 70), (190, 66)])
          + '<text x="240" y="28" fill="#e9edf6" font-family="Inter" font-weight="700" font-size="22" letter-spacing="2">PORT NESS</text>'
          '<path id="mline" d="M282 300 L262 92" stroke="#f7b733" stroke-width="5" stroke-dasharray="14 10" fill="none"/>'
          '<g transform="translate(282 306)"><rect x="-13" y="-13" width="26" height="26" fill="#ec6a1c" stroke="#fff" stroke-width="3"/><path d="M-6 13 L-10 26 M6 13 L10 26" stroke="#fff" stroke-width="3"/></g>'
          '<text x="300" y="214" fill="#f7b733" font-family="Oswald" font-weight="700" font-size="54">140 KM</text>'
          '<text x="210" y="352" fill="#cfd6e2" font-family="Inter" font-weight="700" font-size="20" letter-spacing="2">THE RIG</text></svg>')
clip("map", MP0, MP1, f'<div class="in mapc">{mapsvg}</div>', "tagw", f"top:{TAG_TOP}px;left:0;right:0;")
pop("map", MP0, MP1, "rise")
tl.append(f'tl.fromTo("#mline", {{attr: {{"stroke-dashoffset": 240}}, opacity: 0}}, {{attr: {{"stroke-dashoffset": 0}}, opacity: 1, duration: 0.9, ease: "power2.out"}}, {MP0 + 0.25:.3f});')
cues.append({"t": round(MP0, 3), "type": "panel"})

tag("iv0", w("l13", "twelve") - 0.05, w("l13", "For") - 0.1, "12 CREW × 30 DAYS", None, "y")
# the supplies card (cream): food at "year"; it lifts away for the flare shot (O2) and comes back with power at "Forever"
CD_A, CD_B, CD_C, CD_D = w("l13", "year") - 0.12, T["O2"], T["O3"], T["Q1"]
card = ('<div class="in card"><div class="ch">SUPPLIES · DAY 1</div>'
        '<div class="row" id="cr0"><span>Food: 12 crew × 30 days</span><b>≈ 1 year</b></div><div class="bar"><i class="o" id="b0"></i></div>'
        '<div class="row" id="cr1"><span>Water: the watermaker</span><b>∞</b></div><div class="bar" id="cb1"><i class="bl" id="b1"></i></div>'
        '<div class="row" id="cr2"><span>Power: its own gas</span><b>∞</b></div><div class="bar" id="cb2"><i class="gr" id="b2"></i></div>'
        '<div class="fn">Rough estimate for one person</div></div>')
clip("card", CD_A, CD_D, card, "tagw", f"top:{TAG_TOP - 14}px;left:0;right:0;")
tl.append(f'tl.fromTo("#card > .in", {{opacity: 0, y: -40, rotation: -6}}, {{opacity: 1, y: 0, rotation: -1.5, duration: 0.42, ease: "back.out(1.6)"}}, {CD_A:.3f});')
tl.append(f'tl.set(["#cr1", "#cb1", "#cr2", "#cb2"], {{opacity: 0.18}}, {CD_A:.3f});')
tl.append(f'tl.fromTo("#b0", {{scaleX: 0}}, {{scaleX: 0.92, duration: 0.6, ease: "power2.out"}}, {CD_A + 0.25:.3f});')
tWat = w("l14", "drinking") + 0.38
tl.append(f'tl.to(["#cr1", "#cb1"], {{opacity: 1, duration: 0.2}}, {tWat - 0.1:.3f});')
tl.append(f'tl.fromTo("#b1", {{scaleX: 0}}, {{scaleX: 0.99, duration: 0.6, ease: "power2.out"}}, {tWat:.3f});')
tl.append(f'tl.to("#card > .in", {{opacity: 0, y: -60, duration: 0.3, ease: "power2.in"}}, {CD_B - 0.15:.3f});')
tl.append(f'tl.fromTo("#card > .in", {{opacity: 0, y: -40}}, {{opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.6)", immediateRender: false}}, {CD_C:.3f});')
tFor = w("l14", "Forever")
tl.append(f'tl.to(["#cr2", "#cb2"], {{opacity: 1, duration: 0.2}}, {tFor - 0.12:.3f});')
tl.append(f'tl.fromTo("#b2", {{scaleX: 0}}, {{scaleX: 0.99, duration: 0.6, ease: "power2.out"}}, {tFor:.3f});')
tl.append(f'tl.to("#card > .in", {{opacity: 0, duration: 0.2}}, {CD_D - 0.2:.3f});')
cues += [{"t": round(CD_A, 3), "type": "card"}, {"t": round(CD_C, 3), "type": "card"}]

tag("ft7", w("l15", "chained") - 0.05, T["R"], "CUT OFF", "LADDER UP · GATE CHAINED", "g")

# the survival plan checklist
items = [("Food", w("l16", "Food"), w("l16", "Check", 0)), ("Water", w("l16", "Water"), w("l16", "Check", 1)), ("Power", w("l16", "Power"), w("l16", "Check", 2))]
PL0, PL1 = w("l16", "Food") - 0.25, T["S"]
rows = "".join(f'<div class="pi" id="pi{i}"><span class="box"><svg viewBox="0 0 24 24"><path id="tk{i}" d="M5 12.5 L10 17 L19 7" /></svg></span><span class="pt">{n}</span><span class="pc" id="pc{i}"> — check</span></div>' for i, (n, _, _) in enumerate(items))
clip("plan", PL0, PL1, f'<div class="in plan"><div class="ph">MIRA\'S SURVIVAL PLAN</div>{rows}</div>', "tagw", f"top:{TAG_TOP}px;left:0;right:0;")
pop("plan", PL0, PL1, "rise")
cues.append({"t": round(PL0, 3), "type": "panel"})
for i, (n, ta, tc) in enumerate(items):
    tl.append(f'tl.fromTo("#pi{i}", {{opacity: 0, x: -14}}, {{opacity: 1, x: 0, duration: 0.2, ease: "power2.out"}}, {ta - 0.05:.3f});')
    tl.append(f'tl.fromTo("#tk{i}", {{strokeDashoffset: 30}}, {{strokeDashoffset: 0, duration: 0.22, ease: "power2.out"}}, {tc:.3f});')
    cues.append({"t": round(tc, 3), "type": "check"})
    tl.append(f'tl.fromTo("#pc{i}", {{opacity: 0}}, {{opacity: 1, duration: 0.15}}, {tc:.3f});')
tl.append(f'tl.to("#plan > .in", {{opacity: 0.45, duration: 0.5}}, {w("l17", "On") - 0.1:.3f});')
EXTRA_CUES = [{"t": round(w("l17", "On") + 0.05, 3), "type": "flicker"}, {"t": round(T["Z1"] + 0.1, 3), "type": "sting_end"}]

# end cards
E1 = ('<div class="in end1"><div class="e1a">WHAT DID SHE</div><div class="e1b">FORGET?</div>'
      '<div class="pill w">TELL ME IN THE COMMENTS <span>»</span></div></div>')
clip("end1", T["Z1"], T["Z2"], E1, "", "position:absolute;left:0;right:0;top:720px;")
tl.append(f'tl.set("#end1 > .in", {{opacity: 1}}, {T["Z1"]:.3f});')
tl.append(f'tl.fromTo("#end1 .e1a", {{opacity: 0, y: 30}}, {{opacity: 1, y: 0, duration: 0.3, ease: "power3.out"}}, {T["Z1"]:.3f});')
tl.append(f'tl.fromTo("#end1 .e1b", {{opacity: 0, scale: 1.25}}, {{opacity: 1, scale: 1, duration: 0.3, ease: "power3.out"}}, {T["Z1"] + 0.18:.3f});')
tl.append(f'tl.fromTo("#end1 .pill", {{opacity: 0, y: 16}}, {{opacity: 1, y: 0, duration: 0.3, ease: "power2.out"}}, {T["Z1"] + 0.6:.3f});')
tl.append(f'tl.to("#end1 > .in", {{opacity: 0, duration: 0.3}}, {T["Z2"] - 0.3:.3f});')
E2 = ('<div class="in end2"><div class="glow"></div><div class="e2s">SURVIVAL ODDS</div><div class="e2a">THE RIG</div><div class="e2b">DAY 2</div>'
      '<div class="pill r">FOLLOW FOR DAY 2</div><div class="e2h">@whitelightai</div></div>')
clip("end2", T["Z2"], DUR, E2, "", "position:absolute;left:0;right:0;top:600px;")
tl.append(f'tl.fromTo("#end2 > .in", {{opacity: 0, scale: 0.94}}, {{opacity: 1, scale: 1, duration: 0.5, ease: "power2.out"}}, {T["Z2"]:.3f});')
tl.append(f'tl.fromTo("#end2 .glow", {{opacity: 0.5, scale: 0.9}}, {{opacity: 1, scale: 1.08, duration: {DUR - T["Z2"]:.3f}, ease: "sine.inOut"}}, {T["Z2"]:.3f});')

# captions
for i, c in enumerate(caps):
    txt = "<br>".join(html.escape(p) for p in c["text"].split("|"))
    clip(f"cp{i}", c["on"], c["off"], f'<div class="in cap" style="color:{COL[c["col"]]}">{txt}</div>', "capw")
    tl.append(f'tl.fromTo("#cp{i} > .in", {{opacity: 0, y: 10}}, {{opacity: 1, y: 0, duration: 0.12, ease: "power2.out"}}, {c["on"]:.3f});')
    tl.append(f'tl.to("#cp{i} > .in", {{opacity: 0, duration: 0.08, ease: "none"}}, {c["off"] - 0.08:.3f});')

CSS = open(os.path.join(ROOT, "tools", "hud.css"), encoding="utf-8").read() + ring.css() + """
    #root .tagw { display: flex; justify-content: center; }
    #root .radio { width: 940px; }
    #root .radio .rl { font: 700 44px/1.42 Inter, sans-serif; }
    #root .radio .rl.p2 { font: 700 39px/1.5 Inter, sans-serif; color: #b9c2d0; letter-spacing: 0.01em; }
    #root .radio .rl.y { color: #f7b733; font: 700 38px/1.5 Inter, sans-serif; margin-top: 6px; padding-top: 8px; border-top: 1.5px dashed rgba(247,183,51,0.45); }
    #root .cdc { display: inline-flex; align-items: center; gap: 14px; padding: 12px 26px; border-radius: 14px; border: 2.5px solid #f7b733; background: rgba(9, 13, 26, 0.86); color: #f7b733; }
    #root .cdc .cdi { font: 700 38px/1 Inter, sans-serif; }
    #root .cdc .cdn { position: relative; width: 118px; height: 54px; }
    #root .cdc .cdv { position: absolute; left: 0; top: 0; opacity: 0; font: 700 50px/54px Inter, sans-serif; font-variant-numeric: tabular-nums; }
    #root .mapc { padding: 18px 24px 14px; border-radius: 16px; border: 2.5px solid #f7b733; background: rgba(8, 12, 22, 0.88); box-shadow: 0 14px 40px rgba(0,0,0,0.5); }
    #root .plan { width: 640px; }
    #root .e2s { position: relative; font: 700 30px/1 Inter, sans-serif; color: #f7b733; letter-spacing: 0.42em; padding-left: 0.42em; margin-bottom: 16px; }
    #root .e2a { font-size: 64px; letter-spacing: 0.22em; padding-left: 0.22em; }
    #root .e2h { position: relative; margin-top: 26px; font: 600 28px/1 Inter, sans-serif; color: rgba(230,236,246,0.8); letter-spacing: 0.04em; }
"""

hud = f"""<template>
  <style>{CSS}  </style>
  <div id="root" data-composition-id="hud" data-width="1080" data-height="1920" data-layout-allow-overflow data-layout-allow-overlap>
    {chr(10).join("    " + e for e in els)}
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
      {chr(10).join("      " + x for x in tl)}
      window.__timelines["hud"] = tl;
    }})();
  </script>
</template>
"""
open(os.path.join(ROOT, "compositions", "hud.html"), "w", encoding="utf-8").write(hud)


# ------------------------------------------------------------------ SRT (caption phrases) + index.html
def ts(t):
    h, r = divmod(t, 3600)
    m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s % 1) * 1000)):03d}"


os.makedirs(os.path.join(ROOT, "out"), exist_ok=True)
with open(os.path.join(ROOT, "out", KEY + ".srt"), "w", encoding="utf-8") as f:
    for i, c in enumerate(caps, 1):
        f.write(f"{i}\n{ts(c['t0'])} --> {ts(c['t1'])}\n{c['text'].replace('|', ' ')}\n\n")

INDEX = open(os.path.join(ROOT, "tools", "index.tmpl.html"), encoding="utf-8").read().replace("{DUR}", str(DUR))
open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(INDEX)
cues += [{"t": round(T["Z1"], 3), "type": "endcard"}, {"t": round(T["Z2"], 3), "type": "endcard2"}]
cues += [{"t": round(t0, 3), "type": "clock"} for (t0, _, _) in times[1:]]
cues += EXTRA_CUES
json.dump({"T": T, "caps": caps, "dur": DUR, "odds": [[round(t, 3), v] for t, v in ring.track()], "cues": sorted(cues, key=lambda c: c["t"])},
          open(os.path.join(ROOT, "score", "timing.json"), "w", encoding="utf-8"), indent=1)
print(f"duration {DUR} s · {len(caps)} captions · shots {len(T)}")
for k_, v in T.items():
    print(f"  {k_:3s} {v:7.2f}")
print("odds", [(round(t, 2), v) for t, v in ring.track()])

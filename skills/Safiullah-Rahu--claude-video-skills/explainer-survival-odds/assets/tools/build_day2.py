"""Build step for "Survival Odds · The Rig · Day 2": reads vo/script.json + vo/data/vo.json (Kokoro word times) and writes
  assets/lib/film-vo.js   window.FILM_VO = {dur, lines:{id:{t0,t1,words:[[w,s,e]]}}, T:{shot boundaries}}
  compositions/hud.html   the flat layer: the AI odds ring opening at ?? (tools/odds_ring.py), the HUD clock (DAY 4 night,
                          DAY 5 dawn), the replay chips, the radio-panel replay, the supplies card, the split, the A/B option
                          cards with their own ?? rings, the map card, the vote end cards, captions
  out/<key>.srt           the caption phrases
  index.html              root composition (world + hud + mix) with the real duration
  score/timing.json       shot clock, captions, sound cues, the planned black beats (for QA)
Every time is derived from a word in the voice-over, so re-voicing re-times the whole film.
usage: python -I tools/build.py
"""
import html
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from odds_ring import MINI_CSS, OddsRing, mini_ring  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = os.path.basename(ROOT)
SCRIPT = json.load(open(os.path.join(ROOT, "vo", "script.json"), encoding="utf-8"))
VO = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
DUR = round(VO["duration"], 2)
LINES = {l["id"]: l for l in VO["lines"]}
SPEC = {l["id"]: l for l in SCRIPT["lines"]}
COL = {"w": "#ffffff", "r": "#ff5a45", "g": "#46d483", "y": "#f7b733", "b": "#5b9bff"}
BLUE, RED = "#2f7cf6", "#ff5a45"
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
T["A1"] = 0.0                                # frame 1: the rig lit in the storm; ring ??; on "off" the power dies
T["B1"] = w("l02", "No") - 0.2               # "No gas.": the gauges fall to zero
T["B2"] = w("l02", "No", 1) - 0.18           # "No power.": the screens black out
T["B3"] = w("l02", "No", 2) - 0.18           # "No lights.": the emergency lights flicker and die
T["BK"] = L("l02")["end"] + 0.15             # black beat: the dark rig, red eyes on the shore
T["C"] = L("l03")["start"] - 0.15            # Mira with the torch (DAY 4 · 11:59 PM)
T["D"] = L("l04")["start"] - 0.3             # the control room wide in torchlight (REMOTE OPERATED)
T["P1"] = L("l05")["start"] - 0.3            # replay: the wall screen (LINK LOST)
T["P2"] = L("l06")["start"] - 0.3            # replay: the radio panel (CLOSING 23:59)
T["P3a"] = L("l07")["start"] - 0.3           # her torch finds the generator door
T["P3b"] = w("l07", "Seventy") - 0.25        # the sticker full frame
T["P4"] = L("l08")["start"] - 0.3            # replay: the coast goes dark
T["W1"] = w("l08", "link") - 0.2             # the dark window, the gull on the sill
T["W2"] = L("l09")["start"] - 0.25           # the gull looks in, flies off on "left"
T["R1"] = L("l10")["start"] - 0.3            # dawn (DAY 5 · 6:40 AM): Mira with the torch in the storeroom
T["R2"] = L("l11")["start"] - 0.25           # the RATIONS shelves in torchlight
T["R3"] = L("l12")["start"] - 0.25           # the tap's last drip, the tank at 40 L
T["R3b"] = w("l12", "Forty") - 0.2           # the tank's sight glass at 40 L
T["R4"] = L("l13")["start"] - 0.25           # the rain catcher
T["R5"] = L("l14")["start"] - 0.25           # Mira in a blanket, her breath
T["R6"] = w("l14", "nights") - 0.3           # the thermometer: 5 °C
T["F0"] = L("l15")["start"] - 0.3            # Mira at the rail; the split
T["FA1"] = L("l16")["start"] - 0.2           # A: the restart panel, her hands on the wheel
T["FA2"] = w("l16", "One") - 0.2             # the valve; the what-if flame on "burns"
T["FA3"] = L("l17")["start"] - 0.2           # what if: the flare relit, boats turning toward it
T["FB1"] = L("l18")["start"] - 0.2           # B: the lifeboat in its davit, FUEL · 24 H
T["FB2"] = w("l18", "hundred") - 0.35        # above the lifeboat; the map card 140 KM
T["BK2"] = L("l19")["start"] - 0.2           # black beat: the dark coast, red eyes, the lifeboat's light
T["CARDS"] = L("l20")["start"] - 0.25        # both option cards; the main ring at 21 %
T["FACE"] = L("l21")["start"] - 0.25         # Mira close, determined
T["Z1"] = L("l21")["end"] + 0.4              # end card 1: A OR B?
T["Z2"] = T["Z1"] + 2.8                      # end card 2: DAY 3
T = {k: round(v, 3) for k, v in T.items()}
DIPS = ["BK", "BK2", "Z2"]                   # planned dips through black (QA)
DARK = [("BK", "C"), ("BK2", "CARDS"), ("Z2", None)]   # planned dark stretches for the edge band scan

# ------------------------------------------------------------------ the odds track: ?? -> 23 -> 27 -> 21 -> 26 -> 21
ring = OddsRing(start=None, reveal_from=97)
ring.chip("DAY 1: 97%", 0.0, T["B1"] - 0.1, "g")
ring.reveal(w("l01", "off"), 23, "SHORE LINK LOST")
ring.recalc(w("l11", "food"), +4, "FOOD · 1 YEAR")
ring.recalc(w("l12", "litres"), -6, "WATER · 40 L")
ring.recalc(w("l13", "rains"), +5, "RAIN")
ring.recalc(w("l14", "heat"), -5, "COLD")
RECALC_WORDS = [("l01", "off"), ("l11", "food"), ("l12", "litres"), ("l13", "rains"), ("l14", "heat")]
COMPACT = [(T["FACE"], T["Z1"])]               # the face close-up: the ring shrinks to a badge
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


# HUD clock (top-left): DAY n · time · sub line; hidden during the replays (a replay chip takes its place)
def clock(eid, t0, t1, day, time, sub, col="w"):
    clip(eid, t0, t1, f'<div class="in hud"><div class="day"><span class="dot"></span>{day}</div><div class="tm {col}">{time}</div><div class="sub">{html.escape(sub)}</div></div>', "", "left:66px;top:160px;")
    tl.append(f'tl.fromTo("#{eid} > .in", {{opacity: 0, x: -24}}, {{opacity: 1, x: 0, duration: 0.35, ease: "power2.out"}}, {t0:.3f});')
    tl.append(f'tl.to("#{eid} > .in", {{opacity: 0, duration: 0.22}}, {t1 - 0.22:.3f});')


clock("ck1", T["C"] + 0.25, T["P1"], "DAY 4", "11:59 PM", "72 H WITHOUT SHORE")
clock("ck2", T["W1"], T["R1"], "DAY 4", "11:59 PM", "72 H WITHOUT SHORE")
clock("ck3", T["R1"] + 0.1, T["FACE"], "DAY 5", "6:40 AM", "NO POWER · RAIN")
cues += [{"t": round(T["C"] + 0.25, 3), "type": "clock"}, {"t": round(T["R1"] + 0.1, 3), "type": "clock"}]


# replay chips: where each clue was in Day 1 (top-left, in place of the clock)
def replay(eid, t0, t1, when):
    clip(eid, t0, t1, f'<div class="in rpc"><div class="rpa">SEEN IN</div><div class="rpb">DAY 1 · {when}</div></div>', "", "left:62px;top:168px;")
    tl.append(f'tl.fromTo("#{eid} > .in", {{opacity: 0, x: -30}}, {{opacity: 1, x: 0, duration: 0.3, ease: "power3.out"}}, {t0:.3f});')
    tl.append(f'tl.to("#{eid} > .in", {{opacity: 0, duration: 0.2}}, {t1 - 0.2:.3f});')
    cues.append({"t": round(t0, 3), "type": "replay"})


replay("rp1", T["P1"] + 0.05, T["P2"], "0:17")
replay("rp2", T["P2"] + 0.05, T["P3a"], "0:35")
replay("rp3", T["P3a"] + 0.05, T["P4"], "1:12")
replay("rp4", T["P4"] + 0.05, T["W1"], "1:24")

tag("ro", w("l04", "run") - 0.05, T["P1"], "REMOTE OPERATED", "FROM THE SHORE", "y")

# P2: the radio panel, replayed (already typed); the third line lights up on "midnight"
RP0, RP1 = T["P2"] + 0.1, T["P3a"]
plines = [("Outbreak in Port Ness.", "r"), ("All flights stop at midnight.", "w"), ("SHORE CONTROL ROOM CLOSING 23:59", "p2")]
inner = '<div class="in radio"><div class="rh">SHORE BASE · CH 16</div>' + "".join(f'<div class="rl {c}" id="rl{i}">{html.escape(s)}</div>' for i, (s, c) in enumerate(plines)) + "</div>"
clip("rp", RP0, RP1, inner, "tagw", f"top:{TAG_TOP - 6}px;left:0;right:0;")
pop("rp", RP0, RP1, "rise")
tl.append(f'tl.set(["#rl0", "#rl1", "#rl2"], {{clipPath: "inset(0 0% 0 0)"}}, {RP0:.3f});')
tMid = w("l06", "midnight")
tl.append(f'tl.to(["#rl0", "#rl1"], {{opacity: 0.35, duration: 0.3}}, {w("l06", "shore") - 0.1:.3f});')
tl.append(f'tl.fromTo("#rl2", {{backgroundColor: "rgba(247,183,51,0)", color: "#b9c2d0", scale: 1}}, {{backgroundColor: "rgba(247,183,51,0.95)", color: "#1a1206", scale: 1.06, duration: 0.25, ease: "power2.out"}}, {tMid - 0.12:.3f});')
cues += [{"t": round(RP0, 3), "type": "panel"}, {"t": round(tMid - 0.12, 3), "type": "highlight"}]

# the supplies card, DAY 5 (the dawn recount): empty rows that fill as the recount goes
CA, CB = w("l10", "still") - 0.1, T["R6"]
rows = [("Food: rations, cold", "≈ 1 year", "g", w("l11", "food")), ("Water: the tank", "40 L", "r", w("l12", "litres")),
        ("Rain: tarp + barrels", "most days", "g", w("l13", "rains")), ("Heat", "none · 5 °C", "r", w("l14", "heat"))]
card = '<div class="in card c4"><div class="ch">SUPPLIES · DAY 5</div>' + "".join(
    f'<div class="row" id="sr{i}"><span>{html.escape(a)}</span><b class="{c}" id="sv{i}">{html.escape(b)}</b></div>' for i, (a, b, c, _) in enumerate(rows)) + '<div class="fn">For one person, no power</div></div>'
clip("card", CA, CB, card, "tagw", f"top:{TAG_TOP - 14}px;left:0;right:0;")
tl.append(f'tl.fromTo("#card > .in", {{opacity: 0, y: -40, rotation: -6}}, {{opacity: 1, y: 0, rotation: -1.5, duration: 0.42, ease: "back.out(1.6)"}}, {CA:.3f});')
tl.append(f'tl.set(["#sr0", "#sr1", "#sr2", "#sr3"], {{opacity: 0.22}}, {CA:.3f});')
tl.append(f'tl.set(["#sv0", "#sv1", "#sv2", "#sv3"], {{opacity: 0}}, {CA:.3f});')
for i, (_, _, _, ta) in enumerate(rows):
    tl.append(f'tl.to("#sr{i}", {{opacity: 1, duration: 0.2}}, {ta - 0.1:.3f});')
    tl.append(f'tl.fromTo("#sv{i}", {{opacity: 0, scale: 0.6}}, {{opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2.4)"}}, {ta:.3f});')
tl.append(f'tl.to("#card > .in", {{opacity: 0, duration: 0.2}}, {CB - 0.2:.3f});')
cues.append({"t": round(CA, 3), "type": "card"})

# the split on "choices": the frame divides into a blue A half and a red B half
SP0, SP1 = w("l15", "choices") - 0.05, T["FA1"]
clip("split", SP0, SP1, '<div class="in split"><div class="sh a"><span>A</span></div><div class="sh b"><span>B</span></div><div class="sl"></div></div>', "", "left:0;top:0;width:1080px;height:1920px;")
tl.append(f'tl.set("#split > .in", {{opacity: 1}}, {SP0:.3f});')
tl.append(f'tl.fromTo("#split .sh.a", {{xPercent: -100}}, {{xPercent: 0, duration: 0.35, ease: "power3.out"}}, {SP0:.3f});')
tl.append(f'tl.fromTo("#split .sh.b", {{xPercent: 100}}, {{xPercent: 0, duration: 0.35, ease: "power3.out"}}, {SP0:.3f});')
tl.append(f'tl.fromTo("#split .sl", {{scaleY: 0}}, {{scaleY: 1, duration: 0.3, ease: "power2.out"}}, {SP0 + 0.15:.3f});')
cues.append({"t": round(SP0, 3), "type": "split"})


# the option cards: a letter, a title, a small ?? ring (their odds stay hidden until the vote)
def opt_card(uid, letter, title, sub, col, t0, t1, size=104):
    mr, mtl = mini_ring(uid + "m", t0, t1, size, col)
    tl.extend(mtl)
    return (f'<div class="oc" style="border-color:{col}"><div class="ol" style="background:{col}">{letter}</div>'
            f'<div class="ot"><div class="o1">{html.escape(title)}</div><div class="o2">{html.escape(sub)}</div></div>{mr}</div>')


CA0, CA1 = w("l16", "A") - 0.05, T["FB1"]
clip("cardA", CA0, CA1, '<div class="in">' + opt_card("oA", "A", "RESTART THE RIG", "BY HAND · ODDS HIDDEN", BLUE, CA0, CA1) + "</div>", "tagw", f"top:{TAG_TOP}px;left:0;right:0;")
pop("cardA", CA0, CA1)
CB0, CB1 = w("l18", "B") - 0.05, T["CARDS"]
clip("cardB", CB0, CB1, '<div class="in">' + opt_card("oB", "B", "LIFEBOAT TO SHORE", "140 KM · ODDS HIDDEN", RED, CB0, CB1) + "</div>", "tagw", f"top:{TAG_TOP}px;left:0;right:0;")
pop("cardB", CB0, CB1)
cues += [{"t": round(CA0, 3), "type": "optcard"}, {"t": round(CB0, 3), "type": "optcard"}]
# (no HUD fuel tag: the sticker on the hull says FUEL · 24 H / 6 KNOTS in the world)

# the map card again (FB2): the rig to Port Ness, 140 KM
MP0, MP1 = w("l18", "hundred") - 0.1, T["BK2"]
mapsvg = ('<svg viewBox="0 0 560 360" width="560" height="360">'
          '<path d="M0 0 H560 V70 C470 92 400 62 330 84 C250 108 190 74 120 92 C70 104 30 88 0 98 Z" fill="#20282e" stroke="#5d6a74" stroke-width="2"/>'
          + "".join(f'<circle cx="{x}" cy="{y}" r="3" fill="#ff3a2a"/>' for x, y in [(60, 96), (110, 94), (170, 86), (230, 92), (300, 86), (350, 80), (420, 74), (480, 80), (530, 72)])
          + '<text x="240" y="40" fill="#e9edf6" font-family="Inter" font-weight="700" font-size="22" letter-spacing="2">PORT NESS</text>'
          '<path id="mline" d="M282 300 L262 92" stroke="#ff5a45" stroke-width="5" stroke-dasharray="14 10" fill="none"/>'
          '<g transform="translate(282 306)"><rect x="-13" y="-13" width="26" height="26" fill="#ec6a1c" stroke="#fff" stroke-width="3"/><path d="M-6 13 L-10 26 M6 13 L10 26" stroke="#fff" stroke-width="3"/></g>'
          '<text x="300" y="214" fill="#f7b733" font-family="Oswald" font-weight="700" font-size="54">140 KM</text>'
          '<text x="210" y="352" fill="#cfd6e2" font-family="Inter" font-weight="700" font-size="20" letter-spacing="2">THE RIG</text></svg>')
clip("map", MP0, MP1, f'<div class="in mapc">{mapsvg}</div>', "tagw", f"top:{TAG_TOP + 190}px;left:0;right:0;")
pop("map", MP0, MP1, "rise")
tl.append(f'tl.fromTo("#mline", {{attr: {{"stroke-dashoffset": 240}}, opacity: 0}}, {{attr: {{"stroke-dashoffset": 0}}, opacity: 1, duration: 0.9, ease: "power2.out"}}, {MP0 + 0.25:.3f});')
cues.append({"t": round(MP0, 3), "type": "panel"})

# both cards side by side (l20), then end card 1 keeps them
BC0, BC1 = T["CARDS"] + 0.1, T["Z2"]
pair = ('<div class="in pair">' + opt_card("pA", "A", "RESTART THE RIG", "ODDS: ??", BLUE, BC0, BC1, 96) + opt_card("pB", "B", "LIFEBOAT TO SHORE", "ODDS: ??", RED, BC0, BC1, 96) + "</div>")
clip("pair", BC0, BC1, pair, "", "position:absolute;left:0;right:0;top:640px;")
tl.append(f'tl.set("#pair > .in", {{opacity: 1}}, {BC0:.3f});')
tl.append(f'tl.fromTo("#pair .oc:first-child", {{opacity: 0, x: -80}}, {{opacity: 1, x: 0, duration: 0.35, ease: "power3.out"}}, {BC0:.3f});')
tl.append(f'tl.fromTo("#pair .oc:last-child", {{opacity: 0, x: 80}}, {{opacity: 1, x: 0, duration: 0.35, ease: "power3.out"}}, {BC0 + 0.12:.3f});')
tl.append(f'tl.to("#pair > .in", {{y: -250, scale: 0.92, duration: 0.45, ease: "power2.inOut"}}, {T["Z1"] - 0.05:.3f});')
tl.append(f'tl.to("#pair > .in", {{opacity: 0, duration: 0.25}}, {T["FACE"]:.3f});')
tl.append(f'tl.to("#pair > .in", {{opacity: 1, duration: 0.25, immediateRender: false}}, {T["Z1"]:.3f});')
tl.append(f'tl.to("#pair > .in", {{opacity: 0, duration: 0.3}}, {T["Z2"] - 0.3:.3f});')
cues.append({"t": round(BC0, 3), "type": "cards"})

# end cards
EXTRA_CUES = [{"t": round(T["Z1"] + 0.1, 3), "type": "sting_end"}]
E1 = ('<div class="in end1"><div class="e1a">A OR B?</div>'
      '<div class="pill w">COMMENT A OR B <span>·</span> THE MOST VOTES DECIDES DAY 3</div></div>')
clip("end1", T["Z1"], T["Z2"], E1, "", "position:absolute;left:0;right:0;top:1000px;")
tl.append(f'tl.set("#end1 > .in", {{opacity: 1}}, {T["Z1"]:.3f});')
tl.append(f'tl.fromTo("#end1 .e1a", {{opacity: 0, scale: 1.25}}, {{opacity: 1, scale: 1, duration: 0.3, ease: "power3.out"}}, {T["Z1"] + 0.1:.3f});')
tl.append(f'tl.fromTo("#end1 .pill", {{opacity: 0, y: 16}}, {{opacity: 1, y: 0, duration: 0.3, ease: "power2.out"}}, {T["Z1"] + 0.5:.3f});')
tl.append(f'tl.to("#end1 > .in", {{opacity: 0, duration: 0.3}}, {T["Z2"] - 0.3:.3f});')
E2 = ('<div class="in end2"><div class="glow"></div><div class="e2s">SURVIVAL ODDS</div><div class="e2a">THE RIG</div><div class="e2b">DAY 3</div>'
      '<div class="pill r">FOLLOW FOR DAY 3</div><div class="e2h">@whitelightai</div></div>')
clip("end2", T["Z2"], DUR, E2, "", "position:absolute;left:0;right:0;top:600px;")
tl.append(f'tl.fromTo("#end2 > .in", {{opacity: 0, scale: 0.94}}, {{opacity: 1, scale: 1, duration: 0.5, ease: "power2.out"}}, {T["Z2"]:.3f});')
tl.append(f'tl.fromTo("#end2 .glow", {{opacity: 0.5, scale: 0.9}}, {{opacity: 1, scale: 1.08, duration: {DUR - T["Z2"]:.3f}, ease: "sine.inOut"}}, {T["Z2"]:.3f});')

# captions
for i, c in enumerate(caps):
    txt = "<br>".join(html.escape(p) for p in c["text"].split("|"))
    clip(f"cp{i}", c["on"], c["off"], f'<div class="in cap" style="color:{COL[c["col"]]}">{txt}</div>', "capw")
    tl.append(f'tl.fromTo("#cp{i} > .in", {{opacity: 0, y: 10}}, {{opacity: 1, y: 0, duration: 0.12, ease: "power2.out"}}, {c["on"]:.3f});')
    tl.append(f'tl.to("#cp{i} > .in", {{opacity: 0, duration: 0.08, ease: "none"}}, {c["off"] - 0.08:.3f});')

CSS = open(os.path.join(ROOT, "tools", "hud.css"), encoding="utf-8").read() + ring.css() + MINI_CSS + """
    #root .tagw { display: flex; justify-content: center; }
    #root .hud .tm { height: 72px; }
    #root .radio { width: 940px; }
    #root .radio .rl { font: 700 44px/1.42 Inter, sans-serif; }
    #root .radio .rl.p2 { font: 700 39px/1.5 Inter, sans-serif; color: #b9c2d0; letter-spacing: 0.01em; border-radius: 8px; padding: 0 10px; margin: 4px -10px 0; transform-origin: 0 50%; }
    #root .rpc { padding: 10px 18px 12px; border-radius: 12px; border: 2.5px solid #9fb8ff; background: rgba(9, 13, 26, 0.84); box-shadow: 0 8px 22px rgba(0,0,0,0.45); }
    #root .rpc .rpa { font: 700 18px/1 Inter, sans-serif; color: #9fb8ff; letter-spacing: 0.24em; }
    #root .rpc .rpb { font: 600 46px/1.1 Oswald, sans-serif; color: #fff; letter-spacing: 0.02em; margin-top: 4px; }
    #root .card.c4 { width: 820px; }
    #root .card .row b.g { color: #1f8a4c; } #root .card .row b.r { color: #c0301e; }
    #root .card .row b { display: inline-block; transform-origin: 100% 50%; }
    #root .split { position: absolute; inset: 0; }
    #root .split .sh { position: absolute; top: 0; bottom: 0; width: 540px; display: flex; align-items: center; justify-content: center; }
    #root .split .sh.a { left: 0; background: linear-gradient(90deg, rgba(47,124,246,0.42), rgba(47,124,246,0.12)); }
    #root .split .sh.b { right: 0; background: linear-gradient(270deg, rgba(255,90,69,0.42), rgba(255,90,69,0.12)); }
    #root .split .sh span { font: 700 260px/1 Oswald, sans-serif; color: rgba(255,255,255,0.82); text-shadow: 0 8px 40px rgba(0,0,0,0.5); margin-top: -200px; }
    #root .split .sl { position: absolute; left: 538px; top: 0; width: 4px; height: 1920px; background: #fff; box-shadow: 0 0 18px rgba(255,255,255,0.8); transform-origin: 50% 0; }
    #root .oc { display: flex; align-items: center; gap: 20px; padding: 16px 20px 16px 16px; border-radius: 18px; border: 3px solid; background: rgba(8, 12, 22, 0.88); box-shadow: 0 14px 40px rgba(0,0,0,0.5); }
    #root .oc .ol { width: 78px; height: 78px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font: 700 60px/1 Oswald, sans-serif; color: #fff; flex: none; }
    #root .oc .ot { min-width: 0; }
    #root .oc .o1 { font: 600 46px/1.05 Oswald, sans-serif; color: #fff; letter-spacing: 0.02em; white-space: nowrap; }
    #root .oc .o2 { font: 700 20px/1.3 Inter, sans-serif; color: #c9d2e2; letter-spacing: 0.12em; margin-top: 6px; white-space: nowrap; }
    #root .pair { display: flex; flex-direction: column; align-items: center; gap: 26px; }
    #root .pair .oc { width: 760px; justify-content: space-between; }
    #root .mapc { padding: 18px 24px 14px; border-radius: 16px; border: 2.5px solid #ff5a45; background: rgba(8, 12, 22, 0.88); box-shadow: 0 14px 40px rgba(0,0,0,0.5); }
    #root .e1a { font: 700 150px/1 Oswald, sans-serif; color: #fff; }
    #root .end1 .pill { font: 700 27px/1 Inter, sans-serif; }
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
# story cues for the sound design
S_CUES = [("shutdown", w("l01", "off")), ("gauge", w("l02", "gas")), ("power_off", w("l02", "power")), ("emerg", w("l02", "lights")),
          ("boom", T["BK"]), ("torch", T["C"] + 0.2), ("link_lost", w("l05", "screen")), ("sticker", w("l07", "shuts")),
          ("gull_fly", w("l09", "left")), ("drip", T["R3"]), ("valve", T["FA2"] + 0.2), ("fire", w("l16", "burns")),
          ("flare_on", T["FA3"]), ("davit", T["FB1"]), ("boom", T["BK2"])]
cues += [{"t": round(t0, 3), "type": k} for k, t0 in S_CUES]
cues += [{"t": round(T["Z1"], 3), "type": "endcard"}, {"t": round(T["Z2"], 3), "type": "endcard2"}]
cues += EXTRA_CUES
json.dump({"T": T, "caps": caps, "dur": DUR, "odds": [[round(t, 3), v] for t, v in ring.track()], "cues": sorted(cues, key=lambda c: c["t"]),
           "dips": DIPS, "dark": [[T[a], (T[b] if b else DUR + 1)] for a, b in DARK], "recalc_words": RECALC_WORDS},
          open(os.path.join(ROOT, "score", "timing.json"), "w", encoding="utf-8"), indent=1)
print(f"duration {DUR} s · {len(caps)} captions · shots {len(T)}")
for k_, v in T.items():
    print(f"  {k_:5s} {v:7.2f}")
print("odds", [(round(t, 2), v) for t, v in ring.track()])

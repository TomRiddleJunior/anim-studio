"""money-news builder: vo/data/vo.json (Kokoro word times) -> every timed file of the HyperFrames project.

writes  assets/lib/mn-timeline.js   window.MN_TL = {dur, scenes, words}  (the world player reads the 3D shot ranges)
        compositions/cards.html     the 2D editorial cards (cream serif cards, dark chart cards, split-flap, phone CTA)
        compositions/captions.html  bold condensed uppercase captions, built word by word, one coloured keyword
        index.html                  root composition (world canvas, cards, captions, mixed audio)
        score/                      sound.json (music bed), data/vo.json + data/cues.json (SFX on the visible actions)
        out/money-news.srt          one cue per spoken phrase (QA reads WPM from it)

usage: python -I tools/build.py
"""
import json
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = os.path.basename(ROOT)
VO = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
L = {l["id"]: l for l in VO["lines"]}
DUR = round(VO["duration"] + 0.02, 2)
W, H = 1080, 1920


def wt(lid, i, off=0.0, end=False):
    w = L[lid]["words"][i]
    return round((w["end"] if end else w["start"]) + off, 3)


def ls(lid, off=0.0):
    return round(L[lid]["start"] + off, 3)


def le(lid, off=0.0):
    return round(L[lid]["end"] + off, 3)


# ----------------------------------------------------------------------------------------------- scene schedule
PUSH = 0.30  # card push-in length
SCENES = [
    dict(id="S1", kind="3d", shot="warehouse", t0=0.0),
    dict(id="S2", kind="3d", shot="cabin", t0=ls("h2", -0.12)),
    dict(id="S3", kind="card", card="ticker", theme="cream", t0=ls("f1", -0.16), tin="push"),
    dict(id="S4", kind="card", card="chart", theme="dark", t0=wt("f1", 3, -0.12), tin="push"),
    dict(id="S5", kind="card", card="worst", theme="dark", t0=ls("f2", -0.1), tin="cut"),
    dict(id="S6", kind="card", card="strange", theme="cream", t0=ls("s1", -0.14), tin="push"),
    dict(id="S7", kind="3d", shot="board", t0=ls("q1", -0.14), tin="fade"),
    dict(id="S8", kind="3d", shot="receipt", t0=ls("q3", -0.12)),
    dict(id="S9", kind="3d", shot="stacks", t0=ls("q4", -0.12)),
    dict(id="S10", kind="card", card="twist", theme="cream", t0=ls("t1", -0.14), tin="push"),
    dict(id="S11", kind="3d", shot="cabin2", t0=ls("t2", -0.12), tin="streak"),
    dict(id="S12", kind="3d", shot="hangar", t0=wt("t3", 0, -0.06)),
    dict(id="S13", kind="card", card="why", theme="cream", t0=ls("w1", -0.14), tin="push"),
    dict(id="S14", kind="card", card="slider", theme="dark", t0=ls("w4", -0.14), tin="push"),
    dict(id="S15", kind="card", card="flap", theme="cream", t0=ls("c1", -0.14), tin="tiles"),
    dict(id="S16", kind="card", card="phone", theme="dark", t0=ls("e1", -0.16), tin="shrink"),
]
for i, s in enumerate(SCENES):
    s["t1"] = SCENES[i + 1]["t0"] if i + 1 < len(SCENES) else DUR
OUT_T = {"push": PUSH, "tiles": 0.36, "shrink": 0.45, "cut": 0.0}  # how long the previous scene must stay visible
REVEAL = {"fade": 0.14, "streak": 0.26}                           # a card that wipes off a 3D scene
for i, s in enumerate(SCENES):
    nxt = SCENES[i + 1] if i + 1 < len(SCENES) else None
    s["hold"] = OUT_T.get(nxt.get("tin", "cut"), 0.0) if nxt and nxt["kind"] == "card" else 0.0
    s["pre"] = REVEAL.get(s.get("tin"), 0.0) if s["kind"] == "3d" else 0.0
    if nxt and nxt["kind"] == "3d" and nxt.get("tin") in REVEAL:
        s["hold"] = REVEAL[nxt["tin"]]

# sub-shot anchors the world player needs
ANCH = {
    "S1_dark": wt("h1", 9, -0.05), "S2_end": SCENES[2]["t0"],
    "S7_flip0": wt("q1", 2), "S7_wait": wt("q2", 1),
    "S8_cut": wt("q3", 13, -0.12), "S8_total": wt("q3", 19), "S8_stamp": wt("q3", 27),
    "S9_a": wt("q4", 4), "S9_la": wt("q4", 2), "S9_lb": wt("q4", 7), "S9_b": wt("q4", 10),
    "S11_eng": wt("t2", 6), "S11_dive": wt("t3", 0, -0.35),
    "S12_cut": wt("t3", 9, -0.08), "S12_neck": wt("t3", 15),
}

# ----------------------------------------------------------------------------------------------- captions
RED, YEL, GRN, BLU, INK = "#ff3b30", "#ffc93c", "#2ecc71", "#5aa2ff", "#141414"
INKB = "#1f5fd6"  # the keyword colour for ink captions on paper/cream (yellow does not read on cream)


def tok(lid, i, text=None, col=None, strike=False):
    return dict(t=wt(lid, i), text=text if text is not None else L[lid]["words"][i]["w"].strip(",.?").upper(), col=col, strike=strike)


BR = "BR"
# each phrase: (tokens, style) ; a phrase lasts until the next phrase in the same scene, or the scene end
CAPS = [
    ("S1", "hero", [tok("h1", 0, "BOEING"), BR, tok("h1", 1, "JUST"), tok("h1", 2, "LOST", RED)]),
    ("S1", "hero", [tok("h1", 3, "ABOUT"), BR, tok("h1", 4, "$16", YEL), tok("h1", 5, "BILLION", YEL)]),
    ("S1", "hero", [tok("h1", 7, "IN"), tok("h1", 8, "A"), BR, tok("h1", 9, "SINGLE", RED), tok("h1", 10, "DAY", RED)]),
    ("S2", "top", [tok("h2", 0), tok("h2", 1), tok("h2", 2, "REASON", YEL)]),
    ("S2", "top", [tok("h2", 3), tok("h2", 4), tok("h2", 5), BR, tok("h2", 6), tok("h2", 7), BR, tok("h2", 8, "WINDOW", YEL), tok("h2", 9)]),
    ("S7", "top", [tok("q1", 0), tok("q1", 1), tok("q1", 2, "SPOOKED", RED), BR, tok("q1", 3, "INVESTORS?")]),
    ("S7", "top", [tok("q2", 0, "THE"), tok("q2", 1, "WAIT.", YEL)]),
    ("S8", "low", [tok("q3", 4, "AROUND"), tok("q3", 5, "500", INKB), BR, tok("q3", 10, "JETS"), tok("q3", 11, "THIS"), tok("q3", 12, "YEAR")]),
    ("S8", "low", [tok("q3", 13, "NINE"), tok("q3", 14, "MONTHS"), tok("q3", 15, "IN")]),
    ("S8", "low", [tok("q3", 18, "DELIVERED"), BR, tok("q3", 19, "367", INKB)]),
    ("S9", "top", [tok("q4", 0, "NEXT"), tok("q4", 1, "YEAR'S"), BR, tok("q4", 2, "FREE"), tok("q4", 3, "CASH?")]),
    ("S9", "top", [tok("q4", 4, "$3", YEL), tok("q4", 5, "BILLION", YEL)]),
    ("S9", "top", [tok("q4", 7, "WALL"), tok("q4", 8, "STREET"), BR, tok("q4", 9, "WANTED"), tok("q4", 10, "$5.5B", BLU)]),
    ("S11", "top", [tok("t2", 0, "IT"), tok("t2", 1, "ISN'T"), BR, tok("t2", 2, "DEMAND", None, True)]),
    ("S11", "top", [tok("t2", 3, "AND"), tok("t2", 4, "IT"), tok("t2", 5, "ISN'T"), BR, tok("t2", 6, "ENGINES", None, True)]),
    ("S12", "top", [tok("t3", 0, "IT'S"), tok("t3", 1, "THE"), BR, tok("t3", 2, "WINGS", YEL)]),
    ("S12", "top", [tok("t3", 3, "BOEING"), tok("t3", 4, "BUILDS"), BR, tok("t3", 5, "EVERY"), tok("t3", 6, "737"), tok("t3", 7, "WING"), BR, tok("t3", 8, "ITSELF", YEL)]),
    ("S12", "top", [tok("t3", 13, "ITS"), tok("t3", 14, "BIGGEST"), BR, tok("t3", 15, "BOTTLENECK", RED)]),
    ("S14", "top", [tok("w4", 1, "A"), tok("w4", 2, "STEADY"), tok("w4", 3, "47", YEL), BR, tok("w4", 4, "JETS"), tok("w4", 5, "A"), tok("w4", 6, "MONTH")]),
    ("S14", "top", [tok("w4", 7, "NOW"), tok("w4", 8, "SLIPS"), tok("w4", 9, "TO"), BR, tok("w4", 10, "EARLY", RED), tok("w4", 11, "2027", RED)]),
    ("S15", "inkTop", [tok("c1", 0, "THE"), tok("c1", 1, "MARKET"), tok("c1", 2, "ISN'T", "#8a857a"), tok("c1", 3, "ASKING")]),
    ("S15", "inkTop", [tok("c2", 0, "IT'S"), tok("c2", 1, "ASKING")]),
    ("S16", "cta", [tok("e1", 0, "BUYING", GRN), tok("e1", 1, "CHANCE", GRN), BR, tok("e1", 2, "OR"), tok("e1", 3, "WARNING", RED), tok("e1", 4, "SIGN?", RED)]),
    ("S16", "cta", [tok("e1", 5, "TELL"), tok("e1", 6, "ME"), tok("e1", 7, "IN"), tok("e1", 8, "THE"), BR, tok("e1", 9, "COMMENTS", YEL)]),
    ("S16", "cta", [tok("e2", 1, "FOLLOW", YEL), tok("e2", 2, "FOR"), tok("e2", 3, "THE"), BR, tok("e2", 4, "DAILY"), tok("e2", 5, "MARKET"), tok("e2", 6, "STORY")]),
]
STYLE = {  # top px of the block, alignment, colour, shadow
    "hero": dict(top=560, align="center", col="#ffffff", sh="0 6px 26px rgba(0,0,0,.65), 0 2px 4px rgba(0,0,0,.6)", size=118),
    "top": dict(top=300, align="left", col="#ffffff", sh="0 6px 26px rgba(0,0,0,.6), 0 2px 4px rgba(0,0,0,.55)", size=104),
    "low": dict(top=1330, align="left", col=INK, sh="0 0 16px rgba(242,239,232,.95), 0 0 6px rgba(242,239,232,.95), 0 0 2px rgba(242,239,232,1)", size=104),
    "inkTop": dict(top=330, align="center", col=INK, sh="none", size=84),
    "cta": dict(top=210, align="center", col="#ffffff", sh="0 6px 26px rgba(0,0,0,.6)", size=92),
}
scene_of = {s["id"]: s for s in SCENES}


def caption_html():
    els, tw = [], []
    by_scene = {}
    for sid, st, toks in CAPS:
        by_scene.setdefault(sid, []).append((st, toks))
    k = 0
    for sid, phrases in by_scene.items():
        sc = scene_of[sid]
        for j, (st, toks) in enumerate(phrases):
            S = STYLE[st]
            t_in = min(x["t"] for x in toks if x != BR) - 0.04
            if sid == "S1" and j == 0:
                t_in = 0.0  # the first frame already carries the subject
            t_out = (min(x["t"] for x in phrases[j + 1][1] if x != BR) - 0.05) if j + 1 < len(phrases) else sc["t1"] + sc["hold"] * 0.5
            t_out = min(t_out, sc["t1"] + sc["hold"])
            spans = []
            for i, x in enumerate(toks):
                if x == BR:
                    spans.append("<br>")
                    continue
                cid = f"k{k}_{i}"
                style = f' style="color:{x["col"]}"' if x["col"] else ""
                cls = "w s" if x["strike"] else "w"
                spans.append(f'<span class="{cls}" id="{cid}"{style}>{x["text"]}</span> ')
                t = 0.0 if (sid == "S1" and j == 0 and i == 0) else x["t"] - 0.03
                tw.append(f'tl.fromTo("#{cid}", {{opacity: 0, y: 26}}, {{opacity: 1, y: 0, duration: 0.09, ease: "power2.out"}}, {t:.3f});')
                if x["strike"]:
                    tw.append(f'tl.fromTo("#{cid} i", {{scaleX: 0}}, {{scaleX: 1, duration: 0.18, ease: "power2.inOut"}}, {x["t"] + 0.32:.3f});')
            inner = "".join(spans).replace('class="w s" ', 'class="w s" ')
            inner = inner.replace("</span> <br>", "</span><br>")
            # strike line element inside struck words
            for x in toks:
                if x != BR and x["strike"]:
                    inner = inner.replace(f'>{x["text"]}</span>', f'>{x["text"]}<i></i></span>', 1)
            els.append(f'<div class="clip cap {st}" id="cap{k}" data-start="{t_in:.3f}" data-duration="{max(0.1, t_out - t_in):.3f}" '
                       f'style="top:{S["top"]}px;text-align:{S["align"]};color:{S["col"]};text-shadow:{S["sh"]};font-size:{S["size"]}px">'
                       f'<div class="line" id="cl{k}">{inner}</div></div>')
            tw.append(f'tl.to("#cl{k}", {{opacity: 0, duration: 0.07, ease: "none"}}, {t_out - 0.075:.3f});')
            k += 1
    return f"""<template>
  <style>
    @font-face {{ font-family: "Oswald"; src: url("assets/fonts/Oswald_wght_.ttf"); font-weight: 200 700; }}
    #root {{ position: absolute; inset: 0; overflow: hidden; pointer-events: none; }}
    /* measured on the source (720x1280 x1.5): heavy condensed caps, cap height 75-105 px, block top at 15-17 % of the
       height on 3D shots (left-aligned at 12 %), centred and lower (29 %) on the opening shot, ink-black on cream */
    #root .cap {{ position: absolute; left: 118px; right: 118px; font-family: "Oswald", sans-serif; font-weight: 700;
      line-height: 1.02; letter-spacing: 0.005em; text-transform: uppercase; }}
    #root .cap .w {{ display: inline-block; position: relative; }}
    #root .cap .s i {{ position: absolute; left: -4%; right: -4%; top: 52%; height: 0.11em; background: #ff3b30; transform-origin: 0 50%; display: block; }}
  </style>
  <div id="root" data-composition-id="captions" data-width="{W}" data-height="{H}">
    {chr(10).join("    " + e for e in els).strip()}
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
      {chr(10).join("      " + x for x in tw).strip()}
      window.__timelines["captions"] = tl;
    }})();
  </script>
</template>
"""


# ----------------------------------------------------------------------------------------------- cards
def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;")


CLOSES = [("OCT 13", 186.49), ("OCT 14", 184.66), ("OCT 15", 188.73), ("OCT 16", 190.21), ("OCT 19", 191.42), ("OCT 20", 190.47),
          ("OCT 21", 192.28), ("OCT 22", 187.55), ("OCT 23", 188.35), ("OCT 26", 188.31), ("OCT 27", 168.18)]


def chart_svg():
    x0, x1, y0, y1, lo, hi = 40, 860, 40, 520, 164.0, 196.0
    pts = []
    for i, (_, c) in enumerate(CLOSES):
        x = x0 + (x1 - x0) * i / (len(CLOSES) - 1)
        y = y1 - (c - lo) / (hi - lo) * (y1 - y0)
        pts.append((round(x, 1), round(y, 1)))
    white = " ".join(f"{x},{y}" for x, y in pts[:-1])
    red = f"{pts[-2][0]},{pts[-2][1]} {pts[-1][0]},{pts[-1][1]}"
    area = f"{pts[-2][0]},{pts[-2][1]} {pts[-1][0]},{pts[-1][1]} {pts[-1][0]},{y1} {pts[-2][0]},{y1}"
    grid = "".join(f'<line x1="{x0}" x2="{x1}" y1="{y1 - (v - lo) / (hi - lo) * (y1 - y0):.1f}" y2="{y1 - (v - lo) / (hi - lo) * (y1 - y0):.1f}" class="gl"/>'
                   f'<text x="{x1 + 12}" y="{y1 - (v - lo) / (hi - lo) * (y1 - y0) + 7:.1f}" class="ax">${v}</text>' for v in (170, 180, 190))
    return pts, f"""<svg width="960" height="600" viewBox="0 0 960 600" class="chart">
        <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff3b30" stop-opacity=".35"/><stop offset="1" stop-color="#ff3b30" stop-opacity="0"/></linearGradient></defs>
        {grid}
        <polygon id="ch-area" points="{area}" fill="url(#rg)" opacity="0"/>
        <polyline id="ch-w" points="{white}" class="lw" pathLength="1"/>
        <polyline id="ch-r" points="{red}" class="lr" pathLength="1"/>
        <circle id="ch-dot" cx="{pts[-1][0]}" cy="{pts[-1][1]}" r="11" fill="#ff3b30"/>
        <circle id="ch-ring" cx="{pts[-1][0]}" cy="{pts[-1][1]}" r="11" fill="none" stroke="#ff3b30" stroke-width="3"/>
        <text x="{x0}" y="{y1 + 46}" class="ax">OCT 13</text><text x="{x1}" y="{y1 + 46}" class="ax" text-anchor="end">OCT 27</text>
      </svg>"""


def flap_tiles(prefix, rows, cols):
    out = []
    for r in range(rows):
        for c in range(cols):
            out.append(f'<div class="tile" id="{prefix}{r}_{c}"><b></b><span id="{prefix}{r}_{c}t">&nbsp;</span></div>')
    return "".join(out)


def cards_html():
    S = {s["card"]: s for s in SCENES if s["kind"] == "card"}
    clips, tw = [], []

    def clip(card, inner, extra_cls=""):
        s = S[card]
        start, end = s["t0"], s["t1"] + s["hold"]
        clips.append(f'<div class="clip scene {s["theme"]} {extra_cls}" id="sc-{card}" data-start="{start:.3f}" data-duration="{end - start:.3f}">'
                     f'<div class="panel" id="pn-{card}">{inner}</div></div>')
        tin = s.get("tin", "cut")
        if tin == "push":
            tw.append(f'tl.fromTo("#pn-{card}", {{y: {H}}}, {{y: 0, duration: {PUSH}, ease: "power3.out"}}, {start:.3f});')
        elif tin == "tiles":
            pass
        # how this card leaves when the next scene is 3D and reveals itself
        nxt = SCENES[SCENES.index(s) + 1] if SCENES.index(s) + 1 < len(SCENES) else None
        if nxt and nxt["kind"] == "3d" and nxt.get("tin") == "fade":
            tw.append(f'tl.to("#pn-{card}", {{opacity: 0, duration: {REVEAL["fade"]}, ease: "none"}}, {s["t1"]:.3f});')
        if nxt and nxt["kind"] == "3d" and nxt.get("tin") == "streak":
            tw.append(f'tl.to("#pn-{card}", {{x: -{W + 80}, duration: {REVEAL["streak"]}, ease: "power3.in"}}, {s["t1"]:.3f});')
        return s

    # ---- S3 ticker (cream)
    s = S["ticker"]
    t = wt("f1", 0)
    letters = "".join(f'<span id="bw{i}">{c}</span>' for i, c in enumerate("BOEING"))
    clip("ticker", f"""
      <div class="lbl" id="tk-l" style="top:640px">U.S. PLANEMAKER</div>
      <div class="wordmark" id="tk-w" style="top:690px">{letters}</div>
      <div class="lbl" id="tk-t" style="top:930px">TICKER</div>
      <div class="flap" id="tk-f" style="top:985px;left:{(W - (2 * 168 + 16 + 40)) // 2}px;grid-template-columns:repeat(2,168px)">{flap_tiles("tkf", 1, 2)}</div>
      <div class="chip" id="tk-c" style="top:1255px">ON THE NYSE</div>""")
    for i in range(6):
        tw.append(f'tl.fromTo("#bw{i}", {{opacity: 0, y: 30}}, {{opacity: 1, y: 0, duration: 0.12, ease: "power2.out"}}, {t + 0.035 * i:.3f});')
    tw.append(f'tl.fromTo("#tk-l", {{opacity: 0}}, {{opacity: 1, duration: 0.2}}, {s["t0"] + 0.05:.3f});')
    tw.append(f'tl.fromTo("#tk-t", {{opacity: 0}}, {{opacity: 1, duration: 0.2}}, {wt("f1", 1) - 0.1:.3f});')
    tw.append(f'flapTo(["tkf0_0", "tkf0_1"], "BA", {wt("f1", 1):.3f}, 0.55, 0.08);')
    tw.append(f'tl.fromTo("#tk-c", {{opacity: 0, scale: 0.6}}, {{opacity: 1, scale: 1, duration: 0.22, ease: "back.out(2)"}}, {wt("f1", 2, 0.12):.3f});')

    # ---- S4 chart (dark)
    s = S["chart"]
    pts, svg = chart_svg()
    tf = wt("f1", 3)
    clip("chart", f"""
      <div class="pillrow" style="top:250px"><span class="tpill">BA</span><span class="tname">BOEING CO · NYSE</span></div>
      <div class="lbl dk" id="ch-l" style="top:420px">FELL ALMOST</div>
      <div class="bigpct" id="ch-p" style="top:470px"><span class="arr">&#8595;</span><span id="ch-n">0.0</span>%</div>
      <div class="chartwrap" style="top:820px;left:60px">{svg}
        <div class="ptag" id="ch-c" style="left:{pts[-2][0] - 210}px;top:{pts[-2][1] - 78}px">OCT 26 CLOSE $188.31</div>
        <div class="ptag red" id="ch-e" style="left:{pts[-1][0] - 150}px;top:{pts[-1][1] + 30}px">$168.18</div>
        <div class="ptag ghost" id="ch-d" style="left:{pts[-1][0] - 250}px;top:{pts[-1][1] - 120}px">TUE · OCT 27</div>
      </div>""")
    tw.append(f'tl.fromTo("#ch-w", {{strokeDashoffset: 1}}, {{strokeDashoffset: 0, duration: 0.55, ease: "power1.inOut"}}, {s["t0"] + 0.15:.3f});')
    tw.append(f'tl.fromTo("#ch-c", {{opacity: 0}}, {{opacity: 1, duration: 0.2}}, {s["t0"] + 0.55:.3f});')
    tw.append(f'tl.fromTo("#ch-l", {{opacity: 0, y: 16}}, {{opacity: 1, y: 0, duration: 0.15}}, {tf:.3f});')
    tw.append(f'tl.fromTo("#ch-r", {{strokeDashoffset: 1}}, {{strokeDashoffset: 0, duration: 0.42, ease: "power2.in"}}, {wt("f1", 4):.3f});')
    tw.append(f'tl.fromTo("#ch-area", {{opacity: 0}}, {{opacity: 1, duration: 0.3}}, {wt("f1", 4, 0.3):.3f});')
    tw.append(f'tl.fromTo("#ch-p", {{opacity: 0, scale: 0.85}}, {{opacity: 1, scale: 1, duration: 0.16, ease: "back.out(2)"}}, {wt("f1", 4):.3f});')
    tw.append(f'countTo("ch-n", 0, 10.7, 1, {wt("f1", 4):.3f}, {wt("f1", 6, 0.1) - wt("f1", 4):.3f});')
    tw.append(f'tl.fromTo("#ch-e", {{opacity: 0, x: -20}}, {{opacity: 1, x: 0, duration: 0.2}}, {wt("f1", 4, 0.42):.3f});')
    tw.append(f'tl.fromTo("#ch-ring", {{attr: {{r: 11}}, opacity: 1}}, {{attr: {{r: 46}}, opacity: 0, duration: 0.9, ease: "power1.out", repeat: 2}}, {wt("f1", 4, 0.42):.3f});')
    tw.append(f'tl.fromTo("#ch-d", {{opacity: 0}}, {{opacity: 1, duration: 0.2}}, {wt("f1", 8):.3f});')

    # ---- S5 worst day (dark)
    s = S["worst"]
    months = ["APR '25", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN '26", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT '26"]
    step = 120
    ruler = "".join(f'<div class="mk" style="left:{i * step}px"><i></i><span>{m}</span></div>' for i, m in enumerate(months))
    clip("worst", f"""
      <div class="worst" id="wd-a" style="top:520px">WORST DAY</div>
      <div class="lbl dk" id="wd-b" style="top:760px">IN MORE THAN</div>
      <div class="bignum" id="wd-c" style="top:800px"><span id="wd-n">0</span><span id="wd-plus">+</span></div>
      <div class="months" id="wd-m" style="top:1090px">MONTHS</div>
      <div class="ruler" style="top:1300px"><div class="strip" id="wd-r">{ruler}</div><div class="marker"></div></div>""")
    tw.append(f'tl.fromTo("#wd-a", {{opacity: 0, scale: 1.3}}, {{opacity: 1, scale: 1, duration: 0.16, ease: "power3.out"}}, {wt("f2", 1, -0.04):.3f});')
    tw.append(f'tl.fromTo("#wd-b", {{opacity: 0}}, {{opacity: 1, duration: 0.15}}, {wt("f2", 3):.3f});')
    c0, c1 = wt("f2", 4), wt("f2", 10, 0.05)
    tw.append(f'tl.fromTo("#wd-c", {{opacity: 0}}, {{opacity: 1, duration: 0.1}}, {c0:.3f});')
    tw.append(f'countTo("wd-n", 0, 18, 0, {c0:.3f}, {c1 - c0:.3f});')
    tw.append(f'tl.fromTo("#wd-plus", {{opacity: 0, scale: 0.4}}, {{opacity: 1, scale: 1, duration: 0.18, ease: "back.out(3)"}}, {c1:.3f});')
    tw.append(f'tl.fromTo("#wd-m", {{opacity: 0, y: 20}}, {{opacity: 1, y: 0, duration: 0.15}}, {wt("f2", 9):.3f});')
    tw.append(f'tl.fromTo("#wd-r", {{x: {W // 2 - 18 * step}}}, {{x: {W // 2 - 0 * step - 60}, duration: {c1 - c0 + 0.3:.3f}, ease: "power2.inOut"}}, {c0:.3f});')

    # ---- S6 strange part (cream)
    s = S["strange"]
    serif = "".join(f'<span id="sp{i}">{w}</span> ' for i, w in enumerate(["The", "strange", "part?"]))
    clip("strange", f"""
      <div class="serif" style="top:280px">{serif}</div>
      <div class="scard" id="sc1" style="top:500px">
        <div class="sh"><svg width="44" height="44" viewBox="0 0 44 44"><rect x="4" y="22" width="16" height="16" rx="2" fill="#3b7bf2"/><rect x="24" y="22" width="16" height="16" rx="2" fill="#3b7bf2"/><rect x="14" y="5" width="16" height="16" rx="2" fill="#6aa0ff"/></svg>
          <span>ORDER BACKLOG</span><div class="gchip" id="sc1c">RECORD<small>ALL-TIME HIGH</small></div></div>
        <div class="sl">A YEAR AGO</div><div class="barrow"><div class="bar grey" id="sc1a" style="width:{int(600 * 636 / 745)}px"></div><b class="bv grey" id="sc1av">$636B</b></div>
        <div class="sl">NOW</div><div class="barrow"><div class="bar blue" id="sc1b" style="width:600px"></div><b class="bv blue" id="sc1bv">$<span id="sc1n">0</span>B</b></div>
      </div>
      <div class="scard" id="sc2" style="top:1010px">
        <div class="sh"><svg width="44" height="44" viewBox="0 0 44 44"><path d="M22 3 L25 17 L41 25 L41 29 L25 25 L24 36 L29 40 L29 42 L22 40 L15 42 L15 40 L20 36 L19 25 L3 29 L3 25 L19 17 Z" fill="#3b7bf2"/></svg>
          <span>JETS ON ORDER</span></div>
        <div class="sl">A YEAR AGO</div><div class="barrow"><div class="bar grey" id="sc2a" style="width:{int(600 * 5900 / 6300)}px"></div><b class="bv grey" id="sc2av">5,900+</b></div>
        <div class="sl">NOW</div><div class="barrow"><div class="bar blue" id="sc2b" style="width:600px"></div><b class="bv blue" id="sc2bv"><span id="sc2n">0</span>+</b></div>
      </div>""")
    for i in range(3):
        tw.append(f'tl.fromTo("#sp{i}", {{opacity: 0, y: 14}}, {{opacity: 1, y: 0, duration: 0.12}}, {wt("s1", i, -0.02):.3f});')
    tw.append(f'tl.fromTo("#sc1", {{opacity: 0, y: 120}}, {{opacity: 1, y: 0, duration: 0.3, ease: "power3.out"}}, {wt("s2", 0, -0.05):.3f});')
    tw.append(f'tl.fromTo("#sc1a", {{scaleX: 0}}, {{scaleX: 1, duration: 0.4, ease: "power2.out"}}, {wt("s2", 1):.3f});')
    tw.append(f'tl.fromTo("#sc1b", {{scaleX: 0}}, {{scaleX: 1, duration: 1.0, ease: "power2.out"}}, {wt("s2", 6):.3f});')
    tw.append(f'countTo("sc1n", 0, 745, 0, {wt("s2", 6):.3f}, {wt("s2", 10) - wt("s2", 6):.3f});')
    tw.append(f'tl.fromTo("#sc1av", {{opacity: 0}}, {{opacity: 1, duration: 0.2}}, {wt("s2", 1, 0.25):.3f});')
    tw.append(f'tl.fromTo("#sc1bv", {{opacity: 0}}, {{opacity: 1, duration: 0.12}}, {wt("s2", 6):.3f});')
    tw.append(f'tl.fromTo("#sc2av", {{opacity: 0}}, {{opacity: 1, duration: 0.2}}, {wt("s2", 12, 0.4):.3f});')
    tw.append(f'tl.fromTo("#sc2bv", {{opacity: 0}}, {{opacity: 1, duration: 0.12}}, {wt("s2", 15):.3f});')
    tw.append(f'tl.fromTo("#sc1c", {{opacity: 0, scale: 0.4, rotation: -8}}, {{opacity: 1, scale: 1, rotation: 0, duration: 0.25, ease: "back.out(2.5)"}}, {wt("s2", 6):.3f});')
    tw.append(f'tl.fromTo("#sc2", {{opacity: 0, y: 120}}, {{opacity: 1, y: 0, duration: 0.3, ease: "power3.out"}}, {wt("s2", 12, -0.05):.3f});')
    tw.append(f'tl.fromTo("#sc2a", {{scaleX: 0}}, {{scaleX: 1, duration: 0.35, ease: "power2.out"}}, {wt("s2", 12, 0.15):.3f});')
    tw.append(f'tl.fromTo("#sc2b", {{scaleX: 0}}, {{scaleX: 1, duration: 0.9, ease: "power2.out"}}, {wt("s2", 15):.3f});')
    tw.append(f'countTo("sc2n", 0, 6300, 0, {wt("s2", 15):.3f}, {wt("s2", 17) - wt("s2", 15):.3f}, true);')

    # ---- S10 twist (cream)
    s = S["twist"]
    clip("twist", f"""
      <div class="ink76" style="top:740px"><span id="tw0">BUT</span> <span id="tw1">HERE'S</span> <span id="tw2">THE</span></div>
      <div class="tape" id="tw-t" style="top:850px"><div class="tt" id="tw-tt">TWIST</div><div class="tg" id="tw-g1">TWIST</div><div class="tg" id="tw-g2">TWIST</div></div>
      <div class="grey60" style="top:1130px"><span id="tw4">ALMOST</span> <span id="tw5">NO</span> <span id="tw6">ONE</span><br><span id="tw7">IS</span> <span id="tw8">MENTIONING</span></div>""")
    for i, wi in enumerate([0, 1, 2]):
        tw.append(f'tl.fromTo("#tw{i}", {{opacity: 0, y: 18}}, {{opacity: 1, y: 0, duration: 0.1}}, {wt("t1", wi, -0.02):.3f});')
    tt = wt("t1", 3, -0.02)
    tw.append(f'tl.fromTo("#tw-t", {{opacity: 0, scale: 1.35, rotation: -1.5}}, {{opacity: 1, scale: 1, rotation: -1.5, duration: 0.14, ease: "power4.out"}}, {tt:.3f});')
    tw.append(f'tl.fromTo("#tw-g1", {{opacity: 0.9, x: -26}}, {{opacity: 0, x: 0, duration: 0.22, ease: "steps(5)"}}, {tt:.3f});')
    tw.append(f'tl.fromTo("#tw-g2", {{opacity: 0.9, x: 22}}, {{opacity: 0, x: 0, duration: 0.22, ease: "steps(4)"}}, {tt:.3f});')
    for i, wi in enumerate([4, 5, 6, 7, 8]):
        tw.append(f'tl.fromTo("#tw{4 + i}", {{opacity: 0}}, {{opacity: 1, duration: 0.1}}, {wt("t1", wi, -0.02):.3f});')

    # ---- S13 why does that matter (cream)
    s = S["why"]
    serif = "".join(f'<span id="wy{i}">{w}</span> ' for i, w in enumerate(["Why", "does", "that", "matter?"]))
    w2w = [("AIRLINES", 1), ("PAY", 2), ("MOST", 3), ("BR", 0), ("OF", 4), ("THE", 5), ("PRICE", 7), ("BR", 0), ("ON", 8), ("DELIVERY", 9)]
    sent = "".join("<br>" if a == "BR" else f'<span id="wa{i}"{" class=g" if a == "DELIVERY" else ""}>{a}</span> ' for i, (a, _) in enumerate(w2w))
    note = """<svg class="note" id="wy-note" width="300" height="140" viewBox="0 0 300 140"><rect x="2" y="2" width="296" height="136" rx="8" fill="#d6dcbf" stroke="#4d6b52" stroke-width="3"/>
        <rect x="12" y="12" width="276" height="116" rx="4" fill="none" stroke="#6a8a6e" stroke-width="2"/><ellipse cx="150" cy="70" rx="40" ry="34" fill="#cbd3b0" stroke="#4d6b52" stroke-width="3"/>
        <text x="24" y="44" font-family="Georgia" font-weight="700" font-size="30" fill="#3d5a44">100</text><text x="276" y="120" text-anchor="end" font-family="Georgia" font-weight="700" font-size="30" fill="#3d5a44">100</text>
        <rect x="132" y="0" width="36" height="140" fill="#d9b13b" opacity=".9"/></svg>"""
    clip("why", f"""
      <div class="serif" style="top:280px">{serif}</div>
      <div class="ink84" id="wy-s" style="top:620px">{sent}</div>
      <div class="lcard" id="wy-a" style="top:600px"><div class="ic"><svg width="60" height="60" viewBox="0 0 60 60"><rect x="12" y="8" width="36" height="46" rx="4" fill="none" stroke="#141414" stroke-width="4"/><rect x="22" y="4" width="16" height="9" rx="2" fill="#141414"/><path d="M19 26h22M19 34h22M19 42h14" stroke="#141414" stroke-width="3.5"/></svg></div>
        <div class="tx"><b>THE ORDER</b><small>A PROMISE TO BUY</small></div><div class="pchip grey" id="wy-ac">PROMISE</div></div>
      <div class="lcard" id="wy-b" style="top:880px"><div class="ic"><svg width="60" height="60" viewBox="0 0 44 44"><path d="M22 3 L25 17 L41 25 L41 29 L25 25 L24 36 L29 40 L29 42 L22 40 L15 42 L15 40 L20 36 L19 25 L3 29 L3 25 L19 17 Z" fill="#141414"/></svg></div>
        <div class="tx"><b>THE DELIVERY</b><small>THE JET IS HANDED OVER</small></div><div class="pchip green" id="wy-bc">CASH</div></div>
      {note}""")
    for i in range(4):
        tw.append(f'tl.fromTo("#wy{i}", {{opacity: 0, y: 14}}, {{opacity: 1, y: 0, duration: 0.12}}, {wt("w1", i, -0.02):.3f});')
    for i, (a, wi) in enumerate(w2w):
        if a != "BR":
            tw.append(f'tl.fromTo("#wa{i}", {{opacity: 0, y: 22}}, {{opacity: 1, y: 0, duration: 0.09}}, {wt("w2", wi, -0.03):.3f});')
    tw.append(f'tl.to("#wy-s", {{opacity: 0, y: -40, duration: 0.18, ease: "power2.in"}}, {wt("w3", 0, -0.2):.3f});')
    tw.append(f'tl.fromTo("#wy-a", {{opacity: 0, y: 90}}, {{opacity: 1, y: 0, duration: 0.28, ease: "power3.out"}}, {wt("w3", 1, -0.08):.3f});')
    tw.append(f'tl.fromTo("#wy-ac", {{opacity: 0, scale: 0.5}}, {{opacity: 1, scale: 1, duration: 0.22, ease: "back.out(2.5)"}}, {wt("w3", 4):.3f});')
    tw.append(f'tl.fromTo("#wy-b", {{opacity: 0, y: 90}}, {{opacity: 1, y: 0, duration: 0.28, ease: "power3.out"}}, {wt("w3", 6, -0.08):.3f});')
    tw.append(f'tl.fromTo("#wy-note", {{x: 700, y: 520, rotation: 40, opacity: 0}}, {{x: 0, y: 0, rotation: -9, opacity: 1, duration: 0.42, ease: "power3.out"}}, {wt("w3", 8, -0.25):.3f});')
    tw.append(f'tl.fromTo("#wy-bc", {{opacity: 0, scale: 0.5}}, {{opacity: 1, scale: 1, duration: 0.22, ease: "back.out(2.5)"}}, {wt("w3", 8):.3f});')

    # ---- S14 rate slider (dark)
    s = S["slider"]
    vmin, vmax, tw_ = 36, 54, 860

    def sx(v):
        return int((v - vmin) / (vmax - vmin) * tw_)
    ticks = "".join(f'<div class="tk" style="left:{sx(v)}px"><i></i><span>{v}</span></div>' for v in (38, 42, 47, 52))
    clip("slider", f"""
      <div class="lbl dk" style="top:640px">737 RATE · JETS PER MONTH</div>
      <div class="slider" style="top:730px;left:{(W - tw_) // 2}px;width:{tw_}px">
        <div class="track"></div>{ticks}
        <div class="knob" id="sl-k"><div class="kl" id="sl-kl">47 / MO</div></div>
      </div>
      <div class="mini" id="sl-a" style="left:70px;top:1000px"><small>PLAN · MAY 2026</small><b>STABLE AT 47</b><em id="sl-ae">THIS SUMMER</em><div class="strike" id="sl-as"></div></div>
      <div class="mini red" id="sl-b" style="left:550px;top:1000px"><small>NOW · OCT 27</small><b>STABLE AT 47</b><em class="r">EARLY 2027</em></div>""")
    tw.append(f'tl.fromTo("#sl-k", {{x: {sx(38)}}}, {{x: {sx(42)}, duration: 0.3, ease: "power2.out"}}, {s["t0"] + 0.2:.3f});')
    tw.append(f'tl.to("#sl-k", {{x: {sx(47)}, duration: 0.5, ease: "power2.inOut"}}, {wt("w4", 3, -0.05):.3f});')
    tw.append(f'tl.fromTo("#sl-kl", {{opacity: 0}}, {{opacity: 1, duration: 0.15}}, {wt("w4", 3, 0.3):.3f});')
    tw.append(f'tl.fromTo("#sl-a", {{opacity: 0, y: 60}}, {{opacity: 1, y: 0, duration: 0.25, ease: "power3.out"}}, {wt("w4", 4):.3f});')
    tw.append(f'tl.fromTo("#sl-as", {{scaleX: 0}}, {{scaleX: 1, duration: 0.22, ease: "power2.inOut"}}, {wt("w4", 8):.3f});')
    tw.append(f'tl.to("#sl-a", {{opacity: 0.45, duration: 0.2}}, {wt("w4", 8, 0.2):.3f});')
    tw.append(f'tl.fromTo("#sl-b", {{opacity: 0, y: 60}}, {{opacity: 1, y: 0, duration: 0.25, ease: "power3.out"}}, {wt("w4", 10, -0.1):.3f});')

    # ---- S15 split-flap close (cream)
    s = S["flap"]
    COLS, ROWS = 9, 3
    clip("flap", f"""
      <div class="tilewipe" id="fl-wipe">{''.join(f'<i id="fw{i}"></i>' for i in range(60))}</div>
      <div class="board" id="fl-b" style="top:700px"><div class="flap big" style="grid-template-columns:repeat({COLS},96px)">{flap_tiles("fl", ROWS, COLS)}</div></div>""")
    for i in range(60):
        r_, c_ = divmod(i, 6)
        tw.append(f'tl.fromTo("#fw{i}", {{scale: 0}}, {{scale: 1.02, duration: 0.16, ease: "power2.out"}}, {s["t0"] + 0.012 * (r_ + c_):.3f});')
    tw.append(f'tl.set("#fl-wipe", {{opacity: 0}}, {s["t0"] + 0.4:.3f});')
    tw.append(f'tl.fromTo("#fl-b", {{opacity: 0, y: 40}}, {{opacity: 1, y: 0, duration: 0.25, ease: "power3.out"}}, {s["t0"] + 0.3:.3f});')

    def rowtxt(txt):
        return txt.center(COLS)[:COLS]
    p1 = [rowtxt("IF IT CAN"), rowtxt("SELL"), rowtxt("PLANES")]
    p2 = [rowtxt("IF IT CAN"), rowtxt("BUILD THE"), rowtxt("WINGS")]
    for r_ in range(ROWS):
        ids = json.dumps([f"fl{r_}_{c}" for c in range(COLS)])
        tw.append(f'flapTo({ids}, {json.dumps(p1[r_])}, {wt("c1", [4, 6, 7][r_], -0.05):.3f}, 0.36, 0.03);')
        if p2[r_] != p1[r_]:
            col = json.dumps("#ffc93c" if r_ == 2 else "")
            tw.append(f'flapTo({ids}, {json.dumps(p2[r_])}, {wt("c2", [2, 3, 5][r_], -0.05):.3f}, 0.36, 0.03, {col});')

    # ---- S16 phone CTA (dark)
    s = S["phone"]
    thumbs = "".join(f'<div class="th" style="background:{bg}"><b>{tx}</b></div>' for tx, bg in
                     [("OIL", "#3a2a1c"), ("RATES", "#1c2a3a"), ("CHIPS", "#21331f"), ("GOLD", "#3a331a"), ("JOBS", "#2b1f38"), ("BA &#8595;", "#3a1c1c")])
    mini_board = "".join(f'<div class="mt{" y" if r == 2 else ""}">{c if c != " " else "&nbsp;"}</div>' for r, row in enumerate(p2) for c in row)
    clip("phone", f"""
      <div class="glow"></div>
      <div class="phone" id="ph">
        <div class="scr">
          <div class="reel" id="ph-reel"><div class="mhead">IT'S ASKING</div><div class="mboard">{mini_board}</div>
            <div class="side"><i></i><i></i><i></i></div><div class="handle"><span class="av">LL</span>ledgerlane</div></div>
          <div class="sheet" id="ph-sheet" data-layout-allow-overlap><div class="grab"></div><div class="stitle">Comments</div>
            <div class="cmt"><span class="av">LL</span><div><b>ledgerlane</b> Buying chance or warning sign?</div></div>
            <div class="opt g" id="ph-o1">BUYING CHANCE</div><div class="opt r" id="ph-o2">WARNING SIGN</div>
            <div class="inp">Add a comment…</div></div>
          <div class="prof" id="ph-prof"><div class="ptop"><span class="avb">LL</span><div class="pn"><b>Ledger Lane</b><small>The daily market story</small></div></div>
            <div class="fbtn" id="ph-f"><span id="ph-f1">Follow</span><span id="ph-f2">Following</span></div><div class="tap" id="ph-tap"></div>
            <div class="grid">{thumbs}</div></div>
        </div>
        <div class="island"></div>
      </div>
      <div class="disc">NOT FINANCIAL ADVICE</div>""")
    t0 = s["t0"]
    tw.append(f'tl.fromTo("#ph", {{rotationY: -18, rotationX: 8, y: 60, transformPerspective: 2400}}, {{rotationY: -9, rotationX: 4, y: 0, duration: {DUR - t0:.3f}, ease: "power1.out"}}, {t0:.3f});')
    tw.append(f'tl.fromTo("#ph-sheet", {{y: 900}}, {{y: 0, duration: 0.35, ease: "power3.out"}}, {wt("e1", 5, -0.05):.3f});')
    tw.append(f'tl.fromTo("#ph-o1", {{opacity: 0, x: -30}}, {{opacity: 1, x: 0, duration: 0.2}}, {wt("e1", 7):.3f});')
    tw.append(f'tl.fromTo("#ph-o2", {{opacity: 0, x: 30}}, {{opacity: 1, x: 0, duration: 0.2}}, {wt("e1", 8):.3f});')
    tw.append(f'tl.fromTo("#ph-prof", {{x: 560}}, {{x: 0, duration: 0.35, ease: "power3.inOut"}}, {ls("e2", -0.15):.3f});')
    tf_ = wt("e2", 1, 0.12)
    tw.append(f'tl.fromTo("#ph-tap", {{scale: 0, opacity: 0.7}}, {{scale: 3, opacity: 0, duration: 0.45, ease: "power2.out"}}, {tf_:.3f});')
    tw.append(f'tl.fromTo("#ph-f", {{scale: 1}}, {{scale: 0.92, duration: 0.08, yoyo: true, repeat: 1}}, {tf_:.3f});')
    tw.append(f'tl.set("#ph-f", {{backgroundColor: "#2b2f3a"}}, {tf_ + 0.08:.3f});')
    tw.append(f'tl.set("#ph-f1", {{opacity: 0}}, {tf_ + 0.08:.3f}); tl.set("#ph-f2", {{opacity: 1}}, {tf_ + 0.08:.3f});')
    # the flap card shrinking into the phone screen (the previous scene's panel)
    fs = S["flap"]
    tw.append(f'tl.to("#pn-flap", {{scale: 0.49, y: 175, borderRadius: 150, duration: {OUT_T["shrink"]}, ease: "power3.inOut"}}, {fs["t1"]:.3f});')
    tw.append(f'tl.fromTo("#pn-phone", {{opacity: 0}}, {{opacity: 1, duration: 0.3}}, {t0:.3f});')

    css = CARD_CSS
    return f"""<template>
  <style>{css}</style>
  <div id="root" data-composition-id="cards" data-width="{W}" data-height="{H}">
    {chr(10).join("    " + c for c in clips).strip()}
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
      const CH = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      // split-flap tiles and count-ups are pure functions of time, evaluated by one clock tween (seek-safe in any order)
      const FLAPS = {{}}, COUNTS = [];
      function flapTo(ids, txt, t, dur, stagger, col) {{
        ids.forEach((id, i) => {{
          const f = FLAPS[id] || (FLAPS[id] = {{ el: document.getElementById(id + "t"), tile: document.getElementById(id), segs: [] }});
          const last = f.segs[f.segs.length - 1];
          const from = last ? last.to : " ", fromCol = last ? last.col : "", to = txt[i] || " ";
          const same = from === to;
          f.segs.push({{ t: t + i * stagger, dur: same ? 0.001 : dur, from, fromCol, to, col: col === undefined ? fromCol : (col || ""), seed: (i * 13 + id.length * 7) % CH.length }});
          if (!same) tl.fromTo(f.tile.querySelector("b"), {{ scaleY: 1 }}, {{ scaleY: -1, duration: 0.07, ease: "none", repeat: 3, yoyo: true }}, t + i * stagger);
        }});
      }}
      function flapAt(T) {{
        Object.values(FLAPS).forEach((f) => {{
          let ch = f.segs[0].from, col = f.segs[0].fromCol;
          for (const s of f.segs) {{
            if (T < s.t) break;
            if (T >= s.t + s.dur) {{ ch = s.to; col = s.col; continue; }}
            ch = CH[Math.floor(((T - s.t) / s.dur) * 9 + s.seed) % CH.length]; col = s.fromCol; break;
          }}
          f.el.textContent = ch === " " ? "\\u00a0" : ch; f.tile.style.color = col;
        }});
      }}
      function countTo(id, a, b, dec, t, dur, comma) {{ COUNTS.push({{ el: document.getElementById(id), a, b, dec, t, dur: Math.max(0.05, dur), comma }}); }}
      function countAt(T) {{
        COUNTS.forEach((c) => {{
          const u = Math.min(1, Math.max(0, (T - c.t) / c.dur)), v = c.a + (c.b - c.a) * (1 - (1 - u) * (1 - u));
          c.el.textContent = c.comma ? Math.round(v).toLocaleString("en-US") : v.toFixed(c.dec);
        }});
      }}
      {chr(10).join("      " + x for x in tw).strip()}
      const clk = {{ t: 0 }};
      tl.to(clk, {{ t: {DUR}, duration: {DUR}, ease: "none", onUpdate: () => {{ flapAt(clk.t); countAt(clk.t); }} }}, 0);
      flapAt(0); countAt(0);
      window.__timelines["cards"] = tl;
    }})();
  </script>
</template>
"""


CARD_CSS = """
    @font-face { font-family: "Oswald"; src: url("assets/fonts/Oswald_wght_.ttf"); font-weight: 200 700; }
    @font-face { font-family: "DM Serif Display"; src: url("assets/fonts/DMSerifDisplay-Regular.ttf"); }
    @font-face { font-family: "Roboto Mono"; src: url("assets/fonts/RobotoMono_wght_.ttf"); font-weight: 100 700; }
    @font-face { font-family: "Inter"; src: url("assets/fonts/Inter_opsz-wght_.ttf"); font-weight: 100 900; }
    #root { position: absolute; inset: 0; overflow: hidden; }
    #root .scene { position: absolute; inset: 0; }
    #root .panel { position: absolute; inset: 0; overflow: hidden; transform-origin: 50% 50%; }
    #root .cream .panel { background: #ebe7dc; background-image:
      radial-gradient(ellipse at 50% 38%, rgba(255,255,255,.55), rgba(255,255,255,0) 60%),
      radial-gradient(ellipse at 50% 120%, rgba(120,104,80,.18), rgba(0,0,0,0) 60%),
      url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.3  0 0 0 0 0.27  0 0 0 0 0.2  0 0 0 .09 0'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>"); }
    #root .dark .panel { background: radial-gradient(ellipse at 50% 30%, #182031 0%, #0c111b 55%, #06080d 100%); }
    #root .lbl { position: absolute; left: 0; right: 0; text-align: center; font: 700 26px/1 "Inter", sans-serif; letter-spacing: .22em; color: #8a857a; }
    #root .lbl.dk { color: #b9bfca; font-size: 30px; }
    #root .wordmark { position: absolute; left: 0; right: 0; text-align: center; font: 800 150px/1.2 "Inter", sans-serif; letter-spacing: .03em; color: #23262d; }
    #root .wordmark span { display: inline-block; }
    #root .chip { position: absolute; left: 50%; width: 300px; margin-left: -150px; text-align: center; background: #111215; color: #fff; border-radius: 40px;
      font: 700 28px/66px "Inter", sans-serif; letter-spacing: .12em; }
    #root .flap { position: absolute; display: grid; gap: 16px; padding: 20px; background: #17181c; border-radius: 26px;
      box-shadow: 0 30px 60px rgba(0,0,0,.35), inset 0 2px 0 rgba(255,255,255,.06); }
    #root .flap .tile { position: relative; height: 210px; background: linear-gradient(#2a2b31 0 49.5%, #000 49.5% 50.5%, #24252a 50.5%); border-radius: 12px;
      color: #f4f2ec; font: 700 150px/210px "Roboto Mono", monospace; text-align: center; overflow: hidden; }
    #root .flap .tile b { position: absolute; left: 0; right: 0; top: 0; height: 50%; background: rgba(255,255,255,.05); transform-origin: 50% 100%; }
    #root .flap.big { gap: 7px; padding: 22px; }
    #root .flap.big .tile { height: 132px; font-size: 84px; line-height: 132px; border-radius: 9px; }
    #root .board { position: absolute; left: 0; right: 0; display: flex; justify-content: center; }
    #root .board .flap { position: relative; }
    #root .tilewipe { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(6, 180px); grid-auto-rows: 192px; }
    #root .tilewipe i { display: block; background: #ebe7dc; transform-origin: 50% 50%; }
    #root .pillrow { position: absolute; left: 90px; display: flex; gap: 18px; align-items: center; }
    #root .tpill { background: #222a3a; color: #fff; font: 800 26px/50px "Inter"; padding: 0 20px; border-radius: 12px; letter-spacing: .06em; }
    #root .tname { color: #8f97a6; font: 700 24px/1 "Inter"; letter-spacing: .14em; }
    #root .bigpct { position: absolute; left: 0; right: 0; text-align: center; font: 700 250px/1.1 "Oswald", sans-serif; color: #ff3b30;
      text-shadow: 0 0 60px rgba(255,59,48,.35); transform-origin: 50% 50%; }
    #root .bigpct .arr { font-size: 210px; margin-right: 12px; position: relative; top: -12px; }
    #root .chartwrap { position: absolute; width: 960px; height: 600px; }
    #root .chart .gl { stroke: rgba(255,255,255,.08); stroke-width: 2; }
    #root .chart .ax { fill: #79818f; font: 500 22px "Roboto Mono"; }
    #root .chart .lw { fill: none; stroke: #e9edf3; stroke-width: 5; stroke-linejoin: round; stroke-dasharray: 1; }
    #root .chart .lr { fill: none; stroke: #ff3b30; stroke-width: 6; stroke-linejoin: round; stroke-dasharray: 1; filter: drop-shadow(0 0 10px rgba(255,59,48,.7)); }
    #root .ptag { position: absolute; font: 600 24px/44px "Roboto Mono"; color: #c9ced8; padding: 0 14px; border-radius: 10px; background: rgba(255,255,255,.07); white-space: nowrap; }
    #root .ptag.red { background: #ff3b30; color: #fff; font-weight: 700; font-size: 30px; line-height: 54px; }
    #root .ptag.ghost { background: none; color: #ffc93c; font-weight: 700; }
    #root .worst { position: absolute; left: 0; right: 0; text-align: center; font: 700 170px/1 "Oswald"; color: #ff3b30; transform-origin: 50% 50%; text-shadow: 0 0 50px rgba(255,59,48,.3); }
    #root .bignum { position: absolute; left: 0; right: 0; text-align: center; font: 700 280px/1.05 "Oswald"; color: #fff; }
    #root .bignum #wd-plus { color: #ffc93c; display: inline-block; }
    #root .months { position: absolute; left: 0; right: 0; text-align: center; font: 600 86px/1 "Oswald"; color: #ffc93c; letter-spacing: .04em; }
    #root .ruler { position: absolute; left: 0; right: 0; height: 120px; overflow: hidden; -webkit-mask-image: linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent); }
    #root .ruler .strip { position: absolute; top: 0; left: 0; height: 120px; width: 2400px; border-top: 2px solid rgba(255,255,255,.18); }
    #root .ruler .mk { position: absolute; top: 0; width: 120px; margin-left: -60px; text-align: center; }
    #root .ruler .mk i { display: block; margin: 0 auto; width: 3px; height: 26px; background: rgba(255,255,255,.4); }
    #root .ruler .mk span { display: block; margin-top: 14px; font: 500 22px "Roboto Mono"; color: #8c94a2; white-space: nowrap; }
    #root .ruler .marker { position: absolute; left: 50%; top: -2px; margin-left: -14px; border: 14px solid transparent; border-top: 22px solid #ff3b30; }
    #root .serif { position: absolute; left: 0; right: 0; text-align: center; font: 400 92px/1.1 "DM Serif Display", serif; color: #141414; letter-spacing: -.01em; }
    #root .serif span { display: inline-block; }
    #root .scard { position: absolute; left: 66px; width: 948px; height: 420px; background: linear-gradient(#fbfaf7, #f2f0ea); border-radius: 30px;
      box-shadow: 0 30px 70px rgba(70,60,40,.18), 0 2px 0 rgba(255,255,255,.9) inset, 0 0 0 1px rgba(0,0,0,.04); padding: 40px 54px; }
    #root .scard .sh { display: flex; align-items: center; gap: 22px; font: 800 34px/1 "Inter"; letter-spacing: .12em; color: #141414; height: 70px; }
    #root .gchip { margin-left: auto; background: #1ea152; color: #fff; border-radius: 18px; font: 700 40px/1 "Oswald"; padding: 14px 22px 8px; text-align: center; letter-spacing: .04em; }
    #root .gchip small { display: block; font: 800 14px/1.6 "Inter"; letter-spacing: .14em; }
    #root .sl { font: 800 24px/1 "Inter"; letter-spacing: .14em; color: #8a857a; margin: 26px 0 14px; }
    #root .barrow { display: flex; align-items: center; gap: 24px; height: 56px; }
    #root .bar { height: 52px; border-radius: 26px; transform-origin: 0 50%; }
    #root .bar.grey { background: linear-gradient(#cfcbc1, #b3aea2); }
    #root .bar.blue { background: linear-gradient(90deg, #2a63d8, #5c9cf7); box-shadow: 0 8px 22px rgba(47,111,228,.35); }
    #root .bv { font: 700 52px/1 "Oswald"; }
    #root .bv.grey { color: #8e897d; } #root .bv.blue { color: #2a63d8; }
    #root .ink76 { position: absolute; left: 0; right: 0; text-align: center; font: 700 80px/1 "Oswald"; color: #141414; }
    #root .ink76 span, #root .grey60 span, #root .ink84 span { display: inline-block; }
    #root .tape { position: absolute; left: 50%; width: 640px; margin-left: -320px; height: 250px; background: #f7c531; transform-origin: 50% 50%;
      box-shadow: 0 16px 40px rgba(120,90,0,.25); }
    #root .tape .tt, #root .tape .tg { position: absolute; inset: 0; text-align: center; font: 700 220px/250px "Oswald"; color: #111; }
    #root .tape .tg { color: rgba(255,40,40,.75); mix-blend-mode: multiply; }
    #root .tape .tg + .tg { color: rgba(40,120,255,.7); }
    #root .grey60 { position: absolute; left: 0; right: 0; text-align: center; font: 600 66px/1.1 "Oswald"; color: #8a8577; }
    #root .ink84 { position: absolute; left: 0; right: 0; text-align: center; font: 700 96px/1.05 "Oswald"; color: #141414; }
    #root .ink84 .g { color: #1ea152; }
    #root .lcard { position: absolute; left: 76px; width: 928px; height: 220px; background: linear-gradient(#fbfaf7, #f2f0ea); border-radius: 28px;
      box-shadow: 0 26px 60px rgba(70,60,40,.18), 0 0 0 1px rgba(0,0,0,.04); display: flex; align-items: center; padding: 0 44px; gap: 30px; }
    #root .lcard .ic { width: 96px; height: 96px; border-radius: 22px; background: #ecebe6; display: flex; align-items: center; justify-content: center; }
    #root .lcard .tx b { display: block; font: 700 64px/1 "Oswald"; color: #141414; }
    #root .lcard .tx small { display: block; margin-top: 12px; font: 800 22px/1 "Inter"; letter-spacing: .14em; color: #8a857a; }
    #root .pchip { margin-left: auto; border-radius: 40px; font: 700 40px/1 "Oswald"; padding: 16px 30px 12px; letter-spacing: .05em; color: #fff; }
    #root .pchip.grey { background: #a39e92; } #root .pchip.green { background: #1ea152; box-shadow: 0 10px 26px rgba(30,161,82,.35); }
    #root .note { position: absolute; left: 640px; top: 1150px; filter: drop-shadow(0 18px 24px rgba(0,0,0,.25)); }
    #root .slider { position: absolute; height: 200px; }
    #root .slider .track { position: absolute; left: 0; right: 0; top: 40px; height: 12px; border-radius: 6px; background: linear-gradient(90deg, #3b7bf2, #9b5de5 55%, #ff3b30); box-shadow: 0 0 24px rgba(120,100,255,.35); }
    #root .slider .tk { position: absolute; top: 70px; width: 80px; margin-left: -40px; text-align: center; }
    #root .slider .tk i { display: block; margin: 0 auto; width: 3px; height: 18px; background: rgba(255,255,255,.45); }
    #root .slider .tk span { display: block; margin-top: 10px; font: 700 40px/1 "Oswald"; color: #aab1be; }
    #root .knob { position: absolute; left: -30px; top: 16px; width: 60px; height: 60px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 10px rgba(255,255,255,.15), 0 0 40px rgba(255,255,255,.6); }
    #root .knob .kl { position: absolute; left: 50%; bottom: 80px; width: 220px; margin-left: -110px; text-align: center; font: 700 52px/1 "Oswald"; color: #ffc93c; }
    #root .mini { position: absolute; width: 460px; height: 380px; border-radius: 28px; background: linear-gradient(#141b29, #0e131d); border: 2px solid rgba(255,255,255,.12); padding: 44px 40px; }
    #root .mini.red { border-color: #ff3b30; box-shadow: 0 0 50px rgba(255,59,48,.25), inset 0 0 40px rgba(255,59,48,.08); }
    #root .mini small { display: block; font: 800 22px/1 "Inter"; letter-spacing: .14em; color: #8f97a6; }
    #root .mini b { display: block; margin-top: 50px; font: 700 54px/1 "Oswald"; color: #fff; }
    #root .mini em { display: block; margin-top: 26px; font: normal 700 62px/1 "Oswald"; color: #e8ebf0; white-space: nowrap; }
    #root .mini em.r { color: #ff3b30; }
    #root .mini .strike { position: absolute; left: 30px; right: 30px; top: 224px; height: 10px; background: #ff3b30; transform-origin: 0 50%; border-radius: 5px; }
    #root .glow { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 55%, rgba(110,80,255,.30), rgba(0,0,0,0) 55%), radial-gradient(ellipse at 50% 100%, #1c1440, #07060f 70%); }
    #root .phone { position: absolute; left: 50%; top: 560px; width: 560px; height: 1150px; margin-left: -280px; border-radius: 86px; background: #0b0b0e;
      box-shadow: 0 0 0 4px #2b2c33, 0 0 0 7px #0e0e12, 0 60px 120px rgba(0,0,0,.7), 0 0 120px rgba(110,80,255,.25); transform-style: preserve-3d; }
    #root .phone .island { position: absolute; left: 50%; top: 26px; width: 150px; height: 42px; margin-left: -75px; border-radius: 22px; background: #000; }
    #root .phone .scr { position: absolute; inset: 16px; border-radius: 72px; overflow: hidden; background: #ebe7dc; }
    #root .reel { position: absolute; inset: 0; background: #ebe7dc; }
    #root .reel .mhead { position: absolute; top: 250px; left: 0; right: 0; text-align: center; font: 700 44px/1 "Oswald"; color: #141414; }
    #root .reel .mboard { position: absolute; top: 340px; left: 50%; width: 470px; margin-left: -235px; display: grid; grid-template-columns: repeat(9, 1fr); gap: 4px;
      background: #17181c; padding: 12px; border-radius: 14px; box-shadow: 0 16px 30px rgba(0,0,0,.3); }
    #root .reel .mt { height: 66px; background: linear-gradient(#2a2b31 0 49%, #000 49% 51%, #24252a 51%); border-radius: 5px; color: #f4f2ec; font: 700 40px/66px "Roboto Mono"; text-align: center; }
    #root .reel .mt.y { color: #ffc93c; }
    #root .reel .side { position: absolute; right: 24px; top: 640px; display: grid; gap: 34px; }
    #root .reel .side i { display: block; width: 52px; height: 52px; border-radius: 50%; background: rgba(20,20,20,.18); }
    #root .reel .handle { position: absolute; left: 30px; bottom: 120px; font: 700 28px/1 "Inter"; color: #141414; display: flex; align-items: center; gap: 14px; }
    #root .av { display: inline-flex; width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, #6f5cff, #2fd1a0); color: #fff; font: 800 22px/52px "Inter"; justify-content: center; }
    #root .sheet { position: absolute; left: 0; right: 0; bottom: 0; height: 620px; background: #fff; border-radius: 40px 40px 0 0; padding: 22px 34px; box-shadow: 0 -20px 40px rgba(0,0,0,.25); }
    #root .sheet .grab { width: 80px; height: 8px; border-radius: 4px; background: #d5d5d5; margin: 0 auto 22px; }
    #root .sheet .stitle { text-align: center; font: 800 30px/1 "Inter"; color: #141414; margin-bottom: 34px; }
    #root .sheet .cmt { display: flex; gap: 18px; font: 500 28px/1.35 "Inter"; color: #222; }
    #root .sheet .cmt b { font-weight: 800; margin-right: 8px; }
    #root .sheet .opt { margin: 26px 0 0 70px; display: inline-block; border-radius: 30px; padding: 14px 26px; font: 700 30px/1 "Oswald"; letter-spacing: .04em; color: #fff; }
    #root .sheet .opt.g { background: #1ea152; } #root .sheet .opt.r { background: #ff3b30; margin-left: 14px; }
    #root .sheet .inp { position: absolute; left: 30px; right: 30px; bottom: 40px; border-radius: 34px; background: #f1f1f1; color: #8a8a8a; font: 500 26px/68px "Inter"; padding: 0 28px; }
    #root .prof { position: absolute; inset: 0; background: #0f1016; padding: 120px 30px 0; }
    #root .prof .ptop { display: flex; align-items: center; gap: 24px; }
    #root .prof .avb { display: inline-flex; width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, #6f5cff, #2fd1a0); color: #fff; font: 800 46px/120px "Inter"; justify-content: center; box-shadow: 0 0 0 5px #0f1016, 0 0 0 8px #6f5cff; }
    #root .prof .pn b { display: block; font: 800 40px/1.1 "Inter"; color: #fff; }
    #root .prof .pn small { display: block; margin-top: 8px; font: 500 24px/1 "Inter"; color: #9aa0ad; }
    #root .fbtn { position: relative; margin-top: 40px; height: 80px; border-radius: 18px; background: #3a6df0; color: #fff; font: 800 30px/80px "Inter"; text-align: center; }
    #root .fbtn span { position: absolute; inset: 0; } #root #ph-f2 { opacity: 0; }
    #root .tap { position: absolute; left: 50%; top: 290px; width: 80px; height: 80px; margin-left: -40px; border-radius: 50%; background: rgba(255,255,255,.7); }
    #root .prof .grid { margin-top: 40px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
    #root .prof .th { height: 230px; border-radius: 8px; display: flex; align-items: flex-end; padding: 14px; }
    #root .prof .th b { font: 700 34px/1 "Oswald"; color: #fff; }
    #root .disc { position: absolute; left: 0; right: 0; top: 1790px; text-align: center; font: 700 22px/1 "Inter"; letter-spacing: .24em; color: #6f7484; }
"""


# ----------------------------------------------------------------------------------------------- SRT, cues, timeline, index
def srt():
    def ts(t):
        h, r = divmod(t, 3600)
        m, s = divmod(r, 60)
        return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}"
    out, n = [], 1
    for l in VO["lines"]:
        words = l["words"]
        chunk = []
        for i, w in enumerate(words):
            chunk.append(w)
            if len(chunk) >= 7 or i == len(words) - 1 or w["w"].endswith((".", "?", ",")) and len(chunk) >= 3:
                txt = " ".join(x["w"] for x in chunk).replace("[B-A](/bˈi ˈA/)", "B-A")
                out.append(f"{n}\n{ts(chunk[0]['start'])} --> {ts(chunk[-1]['end'])}\n{txt}\n")
                n += 1
                chunk = []
    return "\n".join(out)


def cues():
    c = []

    def add(t, typ, gain=0.6, dur=None, pitch=1.0, pan=0.0):
        d = {"t": round(t, 3), "type": typ, "gain": gain, "pitch": pitch, "pan": pan}
        if dur:
            d["dur"] = dur
        c.append(d)
    for s in SCENES[1:]:
        tin = s.get("tin", "cut")
        if tin in ("push", "tiles", "shrink"):
            add(s["t0"] - 0.05, "whoosh", 0.45, 0.4)
        elif tin == "streak":
            add(s["t0"] - 0.08, "swoosh", 0.55, 0.45)
        elif tin == "fade":
            add(s["t0"], "woosh_low", 0.4, 0.5)
        else:
            add(s["t0"] - 0.04, "woosh_low", 0.45, 0.4)
    add(0.0, "impact", 0.55)
    add(ANCH["S1_dark"], "drop", 0.5, 0.6)
    for i in range(5):  # the light rows clunk off
        add(ANCH["S1_dark"] + 0.12 * i, "thud", 0.25 + 0.05 * i, 0.2, 0.8 + 0.05 * i)
    for k in range(10):  # split-flap clatter: ticker
        add(wt("f1", 1) + 0.055 * k, "tick", 0.22, 0.05, 1.2 + 0.02 * (k % 3))
    add(wt("f1", 4), "woosh_low", 0.5, 0.5, 0.7)
    add(wt("f1", 4, 0.42), "impact", 0.5)
    add(wt("f2", 1, -0.04), "impact", 0.55)
    for k in range(9):
        add(wt("f2", 4) + 0.075 * k, "tick", 0.16, 0.05, 1.5)
    add(wt("s2", 0), "pop", 0.4)
    add(wt("s2", 6), "pop", 0.45, None, 1.2)
    add(wt("s2", 12), "pop", 0.4)
    for k in range(18):  # board flaps
        add(ANCH["S7_flip0"] + 0.07 * k, "tick", 0.2, 0.05, 1.0 + 0.03 * (k % 4))
    for k in range(int((ANCH["S8_total"] - ls("q3")) / 0.07)):  # printer
        add(ls("q3") + 0.07 * k, "tick", 0.12, 0.04, 2.0 + 0.1 * (k % 3))
    add(ANCH["S8_stamp"], "stamp", 0.7)
    for k in range(3):
        add(ANCH["S9_a"] + 0.25 * k, "thud", 0.45, 0.25)
    for k in range(6):
        add(ANCH["S9_b"] + 0.13 * k, "thud", 0.4, 0.25, 0.9)
    add(ls("t1", -0.9), "riser", 0.35, 0.9)
    add(wt("t1", 3), "impact", 0.65)
    add(wt("t2", 2, 0.32), "scribble", 0.3, 0.2)
    add(wt("t2", 6, 0.32), "scribble", 0.3, 0.2)
    add(ANCH["S11_dive"], "riser", 0.35, 0.4)
    add(wt("t3", 0, -0.04), "impact", 0.7)
    for k in range(6):
        add(wt("t3", 0) + 0.12 * k, "thud", 0.3, 0.2, 0.7)
    add(wt("w3", 4), "pop", 0.4)
    add(wt("w3", 8, -0.2), "paper", 0.5)
    add(wt("w3", 8), "coin", 0.4)
    add(wt("w4", 3, -0.05), "click", 0.4)
    add(wt("w4", 8), "scribble", 0.3, 0.2)
    for r_ in range(3):
        for k in range(7):
            add(wt("c1", [4, 6, 7][r_], -0.05) + 0.05 * k, "tick", 0.16, 0.05, 1.1)
    for r_ in range(1, 3):
        for k in range(7):
            add(wt("c2", [2, 3, 5][r_], -0.05) + 0.05 * k, "tick", 0.16, 0.05, 1.1)
    add(wt("e1", 5, -0.05), "notif", 0.4)
    add(wt("e2", 1, 0.12), "click", 0.55)
    add(wt("e2", 1, 0.2), "success", 0.3)
    return sorted(c, key=lambda x: x["t"])


def main():
    tl = {"dur": DUR, "anch": ANCH, "scenes": SCENES,
          "words": {lid: [[w["w"], round(w["start"], 3), round(w["end"], 3)] for w in l["words"]] for lid, l in L.items()}}
    open(os.path.join(ROOT, "assets", "lib", "mn-timeline.js"), "w", encoding="utf-8").write(
        "/* generated by tools/build.py from vo/data/vo.json */\nwindow.MN_TL = " + json.dumps(tl, ensure_ascii=False) + ";\n")
    open(os.path.join(ROOT, "compositions", "captions.html"), "w", encoding="utf-8").write(caption_html())
    open(os.path.join(ROOT, "compositions", "cards.html"), "w", encoding="utf-8").write(cards_html())
    open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(f"""<!doctype html>
<html lang="en" data-size="{W}x{H}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <script src="assets/lib/three.global.js"></script>
    <script src="assets/lib/money-kit.js"></script>
    <script src="assets/lib/mn-timeline.js"></script>
    <script src="assets/lib/mn-shots.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: {W}px; height: {H}px; overflow: hidden; background: #050608; }}
      #root {{ position: relative; width: 100%; height: 100%; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="{W}" data-height="{H}">
      <div id="world" data-composition-id="world" data-composition-src="compositions/world.html" data-start="0" data-duration="{DUR}" data-track-index="0" data-track-kind="graphics" data-width="{W}" data-height="{H}" style="z-index: 1"></div>
      <div id="cards" data-composition-id="cards" data-composition-src="compositions/cards.html" data-start="0" data-duration="{DUR}" data-track-index="1" data-track-kind="graphics" data-width="{W}" data-height="{H}" style="z-index: 3"></div>
      <div id="captions" data-composition-id="captions" data-composition-src="compositions/captions.html" data-start="0" data-duration="{DUR}" data-track-index="2" data-track-kind="captions" data-width="{W}" data-height="{H}" style="z-index: 5"></div>
      <audio id="mix" class="clip" src="assets/audio/final.m4a" data-start="0" data-duration="{DUR}" data-track-index="20" data-volume="1"></audio>
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
""")
    sc = os.path.join(ROOT, "score")
    os.makedirs(os.path.join(sc, "data"), exist_ok=True)
    os.makedirs(os.path.join(sc, "audio"), exist_ok=True)
    shutil.copy(os.path.join(ROOT, "vo", "data", "vo.json"), os.path.join(sc, "data", "vo.json"))
    shutil.copy(os.path.join(ROOT, "vo", "audio", "vo.wav"), os.path.join(sc, "audio", "vo.wav"))
    json.dump({"duration": DUR, "sfx": cues()}, open(os.path.join(sc, "data", "cues.json"), "w"), indent=1)
    t10, t11 = scene_of["S10"]["t0"], scene_of["S16"]["t0"]
    json.dump({"preset": "doc-pulse", "bpm": 100, "key": -2, "sections": [{"t": 0, "energy": 2}, {"t": scene_of["S6"]["t0"], "energy": 1},
               {"t": t10 - 0.9, "energy": 3}, {"t": scene_of["S13"]["t0"], "energy": 2}, {"t": t11, "energy": 1}],
               "end_hit": True, "music_under_voice_db": -19, "duck_db": 5, "music_alone_db": -9, "sfx_db": -7, "lufs": -14, "reverb": 0.15},
              open(os.path.join(sc, "sound.json"), "w"), indent=1)
    os.makedirs(os.path.join(ROOT, "out"), exist_ok=True)
    open(os.path.join(ROOT, "out", KEY + ".srt"), "w", encoding="utf-8").write(srt())
    print("dur", DUR, "· scenes", [(s["id"], round(s["t0"], 2)) for s in SCENES])
    print("anchors", {k: round(v, 2) for k, v in ANCH.items()})


if __name__ == "__main__":
    main()

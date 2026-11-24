"""Writes the six ticket scenes (compositions/t-<id>.html) and the score cue list (score/data/cues.json)
from one table, so the copy, the timing and the sound effects can never drift apart.

usage: python -I tools/build_scenes.py            (run from the project root)

Every line of copy here traces to FACTS.md. Times are scene-local seconds; the scene's own start and length
are its host's data-start / data-duration in index.html (SCHEDULE below must match).
"""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EV = json.loads((ROOT / "tools" / "evidence.json").read_text())

COL_W = 840            # evidence column width (px)
EV_HEAD = 60           # evidence header height
EV_MAXH = 820          # max screenshot height

SCHEDULE = {"boot": (0, 6), "hormuz": (6, 10), "alaska": (16, 10), "israel": (26, 8), "brazil": (34, 8),
            "serbia": (42, 10), "venezuela": (52, 8), "board": (60, 8), "end": (68, 4)}

TICKETS = [
    dict(id="hormuz", pre="hz", num="2610-001", sev="SEV-1", title="Strait of Hormuz", loc="STRAIT OF HORMUZ",
         meta="26.6°N 56.3°E · Iran / Oman", rows=[],
         chips=[(2.4, "CLOSED 28 FEB"), (3.55, "REOPENED 8 APR"), (4.7, "CLOSED AGAIN"), (5.85, "STILL CLOSED")],
         ev=dict(outlet="USNI News", date="9 Oct 2026", t=2.8, box=4.0, mode="box", push=1.04),
         line=dict(t=5.95, text="Known issue. Workaround: diesel at $6.28 a gallon.",
                   src="US average diesel price, week of 19 Oct · EIA")),
    dict(id="alaska", pre="ak", num="2610-002", sev="SEV-2", title="Alaska Senate race", loc="JUNEAU, ALASKA",
         meta="58.3°N 134.4°W · Juneau", rows=[(2.2, "BUG", "Two candidates named Sullivan.")],
         chips=[(2.6, "ELECTION DAY · 3 NOV")],
         ev=dict(outlet="AP via WDBJ7", date="23 Oct 2026", t=2.9, box=3.8, mode="under", push=1.04),
         line=dict(t=4.3, text="Proposed patch: certify the result only if Sen. Dan Sullivan wins.",
                   src="Filed by: U.S. Justice Department"),
         quote=dict(t=6.2, text="“I’m the one that said do it.”", who="President Trump, 23 Oct (AP)")),
    dict(id="israel", pre="il", num="2610-003", sev="SEV-2", title="Israel election", loc="JERUSALEM",
         meta="31.8°N 35.2°E · Jerusalem", rows=[],
         bar=dict(t=2.4, label="Building majority…", value=52, of=61, src="Netanyahu bloc · Channel 12 exit poll"),
         chips=[(3.8, "LOADING")],
         ev=dict(outlet="CNN", date="27 Oct 2026", t=2.8, box=3.9, mode="box", push=1.04),
         line=dict(t=4.5, text="Election complete. Result: still loading.", src=None)),
    dict(id="brazil", pre="br", num="2610-004", sev="SEV-3", title="Brazil runoff", loc="BRASÍLIA",
         meta="15.8°S 47.9°W · Brasília",
         rows=[(2.3, None, "Lula re-elected for a fourth term at 80. Turned 81 two days later.")],
         chips=[(2.6, "51%+"), (4.9, "DISPUTED")],
         ev=dict(outlet="NPR", date="25 Oct 2026", t=2.8, box=3.8, mode="box", push=1.04),
         line=dict(t=4.6, text="Runner-up has filed a bug report.", src="Flávio Bolsonaro is challenging the result · AP")),
    dict(id="serbia", pre="rs", num="2610-005", sev="SEV-2", title="Serbia parliament", loc="BELGRADE",
         meta="44.8°N 20.5°E · Belgrade", rows=[(2.3, "WINNER", "Student List")],
         chips=[(2.6, "2.2M vs 1.7M VOTES")], chip_note="per Vučić",
         ev=dict(outlet="Euronews", date="25 Oct 2026", t=2.8, box=3.8, mode="box", push=1.04),
         line=dict(t=4.2, text="Ticket closed by: students.", src=None),
         quote=dict(t=5.6, text="“It is clear that we have lost these elections.”",
                    who="Aleksandar Vučić, 25 Oct (Al Jazeera)")),
    dict(id="venezuela", pre="ve", num="2610-006", sev="SEV-3", title="Venezuela", loc="CARACAS",
         meta="10.5°N 66.9°W · Caracas",
         rows=[(2.3, "USER", "María Corina Machado"), (2.45, None, "Back online after ~10 months away.")],
         chips=[(2.7, "BACK ONLINE")],
         ev=dict(outlet="NPR via WGCU", date="25 Oct 2026", t=2.8, box=3.8, mode="box", push=1.04),
         line=dict(t=4.6, text="Next request: an election date.", src=None)),
]

E = html.escape

CSS = """
    #root { position: absolute; inset: 0; overflow: hidden; }
    #root .loc { position: absolute; left: 604px; top: 286px; height: 48px; }
    #root .loc-in { display: inline-block; padding: 0 14px; height: 48px; line-height: 48px; border-radius: 6px;
      background: rgba(7, 24, 37, 0.9); font: 700 28px/48px var(--font-mono), monospace; letter-spacing: 0.08em;
      color: var(--color-ink); white-space: nowrap; }
    #root .ticket { position: absolute; left: 96px; top: 374px; width: 808px; }
    #root .tk-in { padding: 24px 32px 28px; background: rgba(7, 24, 37, 0.92); border: 1.5px solid rgba(234, 246, 255, 0.22);
      border-radius: 10px; }
    #root .tk-row1 { display: flex; justify-content: space-between; align-items: center;
      font: 400 28px/40px var(--font-mono), monospace; letter-spacing: 0.04em; color: #9fb8cc; }
    #root .tk-sev { border: 1.5px solid rgba(234, 246, 255, 0.5); border-radius: 6px; padding: 0 10px; line-height: 36px;
      color: var(--color-ink); }
    #root .tk-title { font: 900 60px/1.05 var(--font-display), sans-serif; letter-spacing: -0.02em; margin-top: 8px; }
    #root .tk-meta { font: 400 28px/40px var(--font-mono), monospace; letter-spacing: 0.04em; color: #9fb8cc; margin-top: 6px; }
    #root .tk-row { font: 400 32px/1.25 var(--font-display), sans-serif; margin-top: 14px; }
    #root .tk-row b { font: 700 28px/1 var(--font-mono), monospace; letter-spacing: 0.06em; color: #9fb8cc; margin-right: 14px; }
    #root .tk-status { display: flex; align-items: center; gap: 16px; margin-top: 18px; }
    #root .tk-status > span:first-child { font: 400 28px/44px var(--font-mono), monospace; letter-spacing: 0.06em; color: #9fb8cc; }
    #root .chip { display: inline-block; height: 48px; overflow: hidden; border-radius: 6px; background: var(--color-accent);
      color: #140700; padding: 0 16px; vertical-align: middle; }
    #root .chip-roll { display: flex; flex-direction: column; }
    #root .chip-roll > span { display: block; height: 48px; font: 700 30px/48px var(--font-mono), monospace;
      letter-spacing: 0.04em; white-space: nowrap; }
    #root .chip-note { font: 400 28px/44px var(--font-mono), monospace; color: #9fb8cc; }
    #root .bar { margin-top: 16px; }
    #root .bar-top { display: flex; justify-content: space-between; font: 400 30px/40px var(--font-display), sans-serif; }
    #root .bar-top b { font: 700 32px/40px var(--font-mono), monospace; }
    #root .bar-track { position: relative; height: 16px; margin-top: 10px; border-radius: 8px; background: rgba(234, 246, 255, 0.16); overflow: hidden; }
    #root .bar-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; border-radius: 8px; background: var(--color-ink);
      transform-origin: 0 50%; }
    #root .bar-src { font: 400 28px/40px var(--font-mono), monospace; color: #9fb8cc; margin-top: 8px; }
    #root .line { position: absolute; left: 96px; bottom: 84px; width: 808px; }
    #root .line-in { padding: 20px 32px 24px; background: rgba(7, 24, 37, 0.92); border-radius: 10px; }
    #root .line-k { font: 400 28px/40px var(--font-mono), monospace; letter-spacing: 0.06em; color: #9fb8cc; }
    #root .line-t { font: 700 48px/1.12 var(--font-display), sans-serif; letter-spacing: -0.01em; margin-top: 4px; }
    #root .line-t span { display: inline-block; }
    #root .line-s { font: 400 28px/38px var(--font-mono), monospace; color: #9fb8cc; margin-top: 10px; }
    #root .ev { position: absolute; left: 984px; width: 840px; }
    #root .ev-in { border-radius: 10px; overflow: hidden; background: #071825; border: 1.5px solid rgba(234, 246, 255, 0.22); }
    #root .ev-head { height: 60px; padding: 0 20px; display: flex; align-items: center; gap: 14px;
      font: 400 28px/60px var(--font-mono), monospace; letter-spacing: 0.04em; color: var(--color-ink); white-space: nowrap; }
    #root .ev-head b { font-weight: 700; }
    #root .ev-frame { position: relative; overflow: hidden; }
    #root .ev-zoom { position: relative; width: 840px; }
    #root .ev-zoom img { display: block; width: 840px; height: auto; }
    #root .ev-box { position: absolute; border: 5px solid var(--color-accent); border-radius: 6px; }
    #root .ev-box.under { border: none; border-bottom: 7px solid var(--color-accent); border-radius: 0; }
    #root .quote { position: absolute; left: 1024px; width: 760px; bottom: 96px; }
    #root .quote-in { padding: 28px 34px 30px; background: rgba(7, 24, 37, 0.96); border: 1.5px solid rgba(234, 246, 255, 0.3);
      border-radius: 10px; }
    #root .quote-t { font: 700 54px/1.12 var(--font-display), sans-serif; letter-spacing: -0.01em; }
    #root .quote-w { font: 400 28px/40px var(--font-mono), monospace; color: #9fb8cc; margin-top: 16px; }
"""


def ticket_html(tk):
    sid, p = tk["id"], tk["pre"]
    d = SCHEDULE[sid][1]
    x_out = d - 0.9            # exits start
    end = d - 0.5              # clips end after their exit tween
    ev = tk["ev"]
    info = EV[sid]
    scale = min(COL_W / info["w"], EV_MAXH / info["h"])
    img_h = round(info["h"] * scale)
    ev_top = round(550 - (EV_HEAD + img_h) / 2)
    kx, ky, kw, kh = info["key_pct"]
    pad_x, pad_y = 0.8, 0.9      # % padding around the key line
    box = (kx - pad_x, ky - pad_y, kw + 2 * pad_x, kh + 2 * pad_y)
    origin = (max(0.0, kx - pad_x), ky + kh / 2)   # left edge of the key line stays put during the push

    rows = "".join(
        f'<div class="tk-row" id="{p}-row{i}">{f"<b>{E(k)}</b>" if k else ""}{E(v)}</div>' for i, (_, k, v) in enumerate(tk["rows"]))
    bar = ""
    if tk.get("bar"):
        b = tk["bar"]
        bar = (f'<div class="bar" id="{p}-bar"><div class="bar-top"><span>{E(b["label"])}</span>'
               f'<b><span id="{p}-count">0</span> / {b["of"]} seats</b></div>'
               f'<div class="bar-track"><div class="bar-fill" id="{p}-fill"></div></div>'
               f'<div class="bar-src">{E(b["src"])}</div></div>')
    chips = "".join(f"<span>{E(c)}</span>" for _, c in tk["chips"])
    note = f'<span class="chip-note" id="{p}-note">{E(tk["chip_note"])}</span>' if tk.get("chip_note") else ""
    line = tk["line"]
    words = "".join(f"<span>{E(w)}</span> " for w in line["text"].split(" "))
    line_src = f'<div class="line-s">{E(line["src"])}</div>' if line.get("src") else ""
    q = tk.get("quote")
    quote = ""
    if q:
        quote = (f'\n    <div id="{p}-quote" class="clip quote" data-start="{q["t"]}" data-duration="{round(end - q["t"], 2)}" data-track-index="5">'
                 f'<div class="quote-in" id="{p}-quote-in"><div class="quote-t">{E(q["text"])}</div>'
                 f'<div class="quote-w">— {E(q["who"])}</div></div></div>')
    box_cls = "ev-box under" if ev["mode"] == "under" else "ev-box"
    t_ticket = 2.2
    return f"""<template>
  <style>{CSS}
    #{p}-ev {{ top: {ev_top}px; }}
    #{p}-frame {{ height: {img_h}px; }}
    #{p}-zoom {{ transform-origin: {origin[0]:.2f}% {origin[1]:.2f}%; }}
    #{p}-box {{ left: {box[0]:.2f}%; top: {box[1]:.2f}%; width: {box[2]:.2f}%; height: {box[3]:.2f}%; }}
  </style>
  <div id="root" data-composition-id="t-{sid}" data-width="1920" data-height="1080">
    <div id="{p}-loc" class="clip loc" data-start="2.0" data-duration="{round(end - 2.0, 2)}" data-track-index="1"><span class="loc-in" id="{p}-loc-in">{E(tk["loc"])}</span></div>
    <div id="{p}-ticket" class="clip ticket" data-start="{t_ticket}" data-duration="{round(end - t_ticket, 2)}" data-track-index="2">
      <div class="tk-in" id="{p}-tk-in">
        <div class="tk-row1" id="{p}-r1"><span>TICKET #{E(tk["num"])}</span><span class="tk-sev">{E(tk["sev"])}</span></div>
        <div class="tk-title" id="{p}-title">{E(tk["title"])}</div>
        <div class="tk-meta" id="{p}-meta">{E(tk["meta"])}</div>
        {rows}{bar}
        <div class="tk-status" id="{p}-status"><span>STATUS</span><span class="chip" id="{p}-chip" data-layout-allow-overflow><span class="chip-roll" id="{p}-roll">{chips}</span></span>{note}</div>
      </div>
    </div>
    <div id="{p}-ev" class="clip ev" data-start="{ev["t"]}" data-duration="{round(end - ev["t"], 2)}" data-track-index="3">
      <div class="ev-in" id="{p}-ev-in">
        <div class="ev-head"><span>EVIDENCE</span><span>·</span><b>{E(ev["outlet"])}</b><span>·</span><span>{E(ev["date"])}</span></div>
        <div class="ev-frame" id="{p}-frame" data-layout-allow-overflow><div class="ev-zoom" id="{p}-zoom"><img id="{p}-img" src="assets/evidence/{sid}.png" alt="{E(ev["outlet"])} headline, {E(ev["date"])}" /><div class="{box_cls}" id="{p}-box"></div></div></div>
      </div>
    </div>
    <div id="{p}-line" class="clip line" data-start="{line["t"]}" data-duration="{round(end - line["t"], 2)}" data-track-index="4">
      <div class="line-in" id="{p}-line-in"><div class="line-k">RELEASE NOTE</div><div class="line-t" id="{p}-words">{words.strip()}</div>{line_src}</div>
    </div>{quote}
  </div>
  <script>
    (function () {{
      const P = "{p}", D = {d}, XOUT = {x_out};
      const tl = gsap.timeline({{ paused: true }});
      const $ = (s) => document.getElementById(P + "-" + s);
      // location tag: whole line blurs in
      tl.fromTo($("loc-in"), {{ opacity: 0, filter: "blur(8px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.2, ease: "power4.out" }}, 2.0);
      // ticket card: clip reveal from the top, rows stagger in
      tl.fromTo($("tk-in"), {{ clipPath: "inset(0% 0% 100% 0% round 10px)", y: 36 }}, {{ clipPath: "inset(0% 0% 0% 0% round 10px)", y: 0, duration: 0.55, ease: "expo.out" }}, {t_ticket});
      const rowsIn = [$("r1"), $("title"), $("meta")].concat([...document.querySelectorAll("#{p}-tk-in .tk-row, #{p}-bar")]).concat([$("status")]);
      rowsIn.forEach((el, i) => tl.fromTo(el, {{ opacity: 0, x: -18 }}, {{ opacity: 1, x: 0, duration: 0.4, ease: "expo.out" }}, {t_ticket} + 0.08 + i * 0.07));
      // chip: slot roll between states, a short flash on each landing
      const CH = {json.dumps([c[0] for c in tk["chips"]])};
      tl.fromTo($("chip"), {{ scale: 0.7, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.3, ease: "power3.out" }}, CH[0]);
      CH.forEach((t, k) => {{
        if (k > 0) tl.to($("roll"), {{ y: -48 * k, duration: 0.24, ease: "power3.out" }}, t);
        tl.fromTo($("chip"), {{ backgroundColor: "#FFE1CC" }}, {{ backgroundColor: "#FF6B1A", duration: 0.25, ease: "power2.out" }}, t);
      }});
      if ($("note")) tl.fromTo($("note"), {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3 }}, CH[0] + 0.2);
      // evidence: slides in from the right, slow push toward the key line, the box draws on
      tl.fromTo($("ev-in"), {{ x: 48, opacity: 0, filter: "blur(8px)" }}, {{ x: 0, opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "expo.out" }}, {ev["t"]});
      tl.fromTo($("zoom"), {{ scale: 1 }}, {{ scale: {ev["push"]}, duration: XOUT - {ev["t"]}, ease: "none" }}, {ev["t"]});
      tl.fromTo($("box"), {{ clipPath: "inset(0% 100% 0% 0%)" }}, {{ clipPath: "inset(0% 0% 0% 0%)", duration: 0.4, ease: "power2.out" }}, {ev["box"]});
      // deadpan release note: word by word, blur to sharp
      tl.fromTo($("line-in"), {{ opacity: 0 }}, {{ opacity: 1, duration: 0.15 }}, {line["t"]});
      const words = [...document.querySelectorAll("#{p}-words span")];
      words.forEach((w, i) => tl.fromTo(w, {{ opacity: 0, filter: "blur(6px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.13, ease: "power2.out" }}, {line["t"]} + 0.1 + i * 0.067));
{bar_js(tk)}{quote_js(tk)}
      // exits: blur out, staggered
      const outs = [$("loc-in"), $("tk-in"), $("ev-in"), $("line-in")].concat($("quote-in") ? [$("quote-in")] : []);
      outs.forEach((el, i) => tl.to(el, {{ opacity: 0, filter: "blur(8px)", duration: 0.25, ease: "power2.in" }}, XOUT + i * 0.05));
      window.__timelines["t-{sid}"] = tl;
    }})();
  </script>
</template>
"""


def bar_js(tk):
    if not tk.get("bar"):
        return ""
    b = tk["bar"]
    p = tk["pre"]
    frac = b["value"] / b["of"]
    return f"""      // progress bar: counts to {b["value"]} of {b["of"]}, then stalls
      const cnt = {{ v: 0 }};
      tl.fromTo(cnt, {{ v: 0 }}, {{ v: {b["value"]}, duration: 1.2, ease: "power2.out", onUpdate: () => ($("count").textContent = Math.round(cnt.v)) }}, {b["t"] + 0.3});
      tl.fromTo($("fill"), {{ scaleX: 0 }}, {{ scaleX: {frac:.4f}, duration: 1.2, ease: "power2.out" }}, {b["t"] + 0.3});
"""


def quote_js(tk):
    q = tk.get("quote")
    if not q:
        return ""
    return f"""      // quote card: scales up from 0.94 with blur, over the evidence
      tl.fromTo($("quote-in"), {{ scale: 0.94, opacity: 0, filter: "blur(8px)" }}, {{ scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.45, ease: "expo.out" }}, {q["t"]});
"""


def cues():
    """Sound effects on visible actions, rotated takes, scene times made absolute."""
    sfx = []
    whooshes = [("whoosh", 1.0), ("swoosh", 0.9), ("woosh_low", 1.0), ("whoosh", 1.12), ("swoosh", 1.08), ("woosh_low", 0.92)]
    pops = [1.0, 1.12, 0.94, 1.2, 1.06, 0.9]
    # boot: soft ticks on the three typed lines, a blip as each ping lights
    for t in (0.1, 1.2, 2.8):
        sfx.append(dict(t=t, type="tick", gain=0.35))
    sfx.append(dict(t=2.03, type="blip_up", gain=0.4))
    for i in range(5):
        sfx.append(dict(t=3.63 + 0.25 * i, type="blip", gain=0.28, pitch=1.0 + 0.06 * i))
    pop_i = 0
    for i, tk in enumerate(TICKETS):
        s, d = SCHEDULE[tk["id"]]
        kind, pitch = whooshes[i]
        sfx.append(dict(t=round(s + 0.05, 3), type=kind, gain=0.5, pitch=pitch, dur=0.6))            # fly
        sfx.append(dict(t=round(s + 1.15, 3), type="zoom_in", gain=0.42, pitch=pitch, dur=0.9))      # dive
        for t, _ in tk["chips"]:
            sfx.append(dict(t=round(s + t + 0.03, 3), type="pop", gain=0.55, pitch=pops[pop_i % len(pops)]))
            pop_i += 1
        sfx.append(dict(t=round(s + tk["ev"]["t"] + 0.02, 3), type="slide", gain=0.35, pitch=0.95 + 0.03 * i))
        sfx.append(dict(t=round(s + tk["ev"]["box"] + 0.02, 3), type="scribble", gain=0.3))
        if tk.get("quote"):
            sfx.append(dict(t=round(s + tk["quote"]["t"] + 0.03, 3), type="thud", gain=0.45))
        if tk.get("bar"):
            sfx.append(dict(t=round(s + tk["bar"]["t"] + 1.52, 3), type="error", gain=0.3))
        sfx.append(dict(t=round(s + d - 0.88, 3), type="swoosh" if i % 2 else "woosh_low", gain=0.32, pitch=1.1, dur=0.5))  # pull-out
    b0 = SCHEDULE["board"][0]
    for i in range(6):
        sfx.append(dict(t=round(b0 + 1.23 + 0.3 * i, 3), type="pop", gain=0.5, pitch=pops[i]))
    sfx.append(dict(t=SCHEDULE["end"][0] + 0.3, type="stamp", gain=0.4))
    return dict(duration=72, sfx=sorted(sfx, key=lambda c: c["t"]))


if __name__ == "__main__":
    for tk in TICKETS:
        (ROOT / "compositions" / f"t-{tk['id']}.html").write_text(ticket_html(tk), encoding="utf-8")
    (ROOT / "score" / "data").mkdir(parents=True, exist_ok=True)
    (ROOT / "score" / "data" / "cues.json").write_text(json.dumps(cues(), indent=1), encoding="utf-8")
    print("wrote", len(TICKETS), "ticket scenes and score/data/cues.json")

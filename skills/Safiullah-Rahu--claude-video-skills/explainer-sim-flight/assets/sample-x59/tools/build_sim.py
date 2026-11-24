"""Sim-flight short — wires the narration to the HyperFrames project.

Writes: assets/lib/sim-vo.js (word + line times), compositions/world.html (the three.js shot player for
assets/lib/sim-shots.js), compositions/captions.html (phrase captions + the format's chrome: watermark, info cards,
illustration note, tags, picture-in-picture frame), index.html (1080 x 1920), score/ (cues, voice, sound.json).

usage: python -I tools/build_sim.py            (then tools/ambience.py, engine sound.py, ffmpeg -> assets/audio/final.m4a)
"""
import json
import os
import re
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
DUR = round(VO["duration"], 2)
W, H = 1080, 1920
L = {l["id"]: l for l in VO["lines"]}


def norm(s):
    return re.sub(r"[^a-z0-9']", "", s.lower())


def wt(line, word, k=0):
    hits = [x for x in L[line]["words"] if norm(x["w"]).startswith(norm(word))]
    return hits[min(k, len(hits) - 1)]["start"]


def line0(i):
    return L[i]["start"] - 0.28


# ---------------------------------------------------------------- caption chunks (the source: 2-6 words, phrase breaks, hand-set)
CH = {
    "l01": ["A jet built", "to break the sound barrier,", "without the big boom."],
    "l02": ["It's NASA's X-59,", "built by Lockheed Martin", "for quiet supersonic flight."],
    "l03": ["An airliner flies over land,", "but slower than sound."],
    "l04": ["A fighter jet goes faster,", "but its sonic boom", "rattles windows."],
    "l05": ["This one wants both."],
    "l06": ["In 1973,", "the U.S. banned", "civilian supersonic flight", "over land."],
    "l07": ["The secret is its shape."],
    "l08": ["On most supersonic jets,", "shock waves", "from the nose and wings", "merge into one big boom."],
    "l09": ["The X-59's long, thin nose", "is almost a third", "of its length."],
    "l10": ["Stretched out like that,", "the shock waves don't merge."],
    "l11": ["The engine sits on top,", "aiming its noise", "away from the ground."],
    "l12": ["So people below", "should hear a soft thump,", "if anything at all."],
    "l13": ["The cockpit sits", "almost halfway back,", "with no forward window."],
    "l14": ["The pilot looks ahead", "on a 4K screen,", "fed by cameras."],
    "l15": ["It's built to cruise", "at Mach 1.4,", "about 925 miles an hour."],
    "l16": ["NASA will fly it", "over U.S. towns", "and ask people", "what they heard."],
    "l17": ["That helps regulators", "set a noise limit", "for supersonic flight", "over land."],
    "l18": ["The hard part", "is proving it works", "in real air."],
    "l19": ["In 2003,", "an F-5E jet", "with a reshaped body", "made a quieter boom."],
    "l20": ["The X-59 first flew", "on October 28, 2025."],
    "l21": ["On June 5, 2026,", "it went supersonic", "for the first time."],
    "l22": ["The chase plane's booms", "drowned out any sound", "from the X-59."],
    "l23": ["By October,", "it was flying", "at Mach 1.4", "and 55,000 feet."],
    "l24": ["Next,", "NASA measures the thump,", "then flies over towns", "to see if anyone hears it."],
}


def chunks():
    out = []
    for line in VO["lines"]:
        ws, k = line["words"], 0
        for text in CH[line["id"]]:
            n = len(text.split())
            seg = ws[k:k + n]
            assert len(seg) == n and norm(seg[0]["w"]) == norm(text.split()[0]), (line["id"], text, [x["w"] for x in seg])
            out.append((seg[0]["start"], text))
            k += n
        assert k == len(ws), (line["id"], k, len(ws))
    res = []
    for i, (t0, text) in enumerate(out):
        nxt = out[i + 1][0] if i + 1 < len(out) else DUR
        res.append(dict(t0=round(t0, 3), t1=round(nxt, 3), text=text))
    return res


# ---------------------------------------------------------------- chrome schedule (cards / notes / tags / inset), in sync with sim-shots.js
def schedule():
    c = []
    cut = {k: line0(k) for k in L}
    # info card on the reveal (name + one-line spec), as in the source ~1.5 s after the cut
    c.append(dict(kind="card", t0=cut["l02"] + 1.5, t1=cut["l03"], title="X-59", sub="NASA Quesst X-plane · 99.7 ft long · built by Lockheed Martin", bar="#e8892b"))
    c.append(dict(kind="note", t0=cut["l02"] + 0.07, t1=cut["l03"], text="Illustration based on NASA imagery"))
    # mechanism: the inset (what the pilot sees)
    c.append(dict(kind="inset", t0=cut["l14"] + 0.06, t1=cut["l15"] - 0.0, title="What the pilot sees", sub="eXternal Vision System · cameras feed a 4K display (illustration)"))
    # illustration scenes (towns, microphones)
    c.append(dict(kind="tag", t0=cut["l16"] + 0.07, t1=cut["l18"], text="Illustration · communities not shown"))
    # history: F-5E recreation + card
    c.append(dict(kind="card", t0=cut["l19"] + 0.9, t1=cut["l20"], title="F-5E Shaped Sonic Boom Demonstration", sub="Northrop F-5E · reshaped fuselage · flown 2003–2004", bar="#f2f2f2"))
    c.append(dict(kind="tag", t0=cut["l19"] + 0.07, t1=cut["l20"], text="Recreation"))
    # milestones
    c.append(dict(kind="card", t0=cut["l20"] + 0.9, t1=cut["l21"], title="U.S. Air Force Plant 42, Palmdale", sub="X-59 first flight · Oct 28, 2025 · 67 minutes · 230 mph", bar="#f2f2f2"))
    c.append(dict(kind="tag", t0=cut["l20"] + 0.07, t1=cut["l21"], text="Recreation"))
    c.append(dict(kind="card", t0=cut["l21"] + 0.9, t1=cut["l22"], title="First supersonic flight", sub="June 5, 2026 · Mach 1.1 · 43,400 ft · NASA F-15 chase", bar="#f2f2f2"))
    c.append(dict(kind="tag", t0=cut["l21"] + 0.07, t1=cut["l23"], text="Recreation"))
    c.append(dict(kind="card", t0=cut["l23"] + 0.9, t1=cut["l24"], title="Mission conditions reached", sub="Mach 1.4 · 55,000 ft · flight of Oct 21, 2026", bar="#f2f2f2"))
    c.append(dict(kind="tag", t0=cut["l24"] + 0.07, t1=wt("l24", "then") - 0.15, text="Illustration"))
    return c


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def main():
    lib = os.path.join(ROOT, "assets", "lib")
    words = {l["id"]: [[x["w"], round(x["start"], 3), round(x["end"], 3)] for x in l["words"]] for l in VO["lines"]}
    starts = {l["id"]: round(l["start"], 3) for l in VO["lines"]}
    open(os.path.join(lib, "sim-vo.js"), "w", encoding="utf-8").write(
        "/* generated by tools/build_sim.py from vo/data/vo.json */\nwindow.SIM_VO = " + json.dumps({"dur": DUR, "lines": words, "starts": starts}) + ";\n")

    comp = os.path.join(ROOT, "compositions")
    open(os.path.join(comp, "world.html"), "w", encoding="utf-8").write(f"""<template>
  <style>
    #root {{ position: absolute; inset: 0; overflow: hidden; background: #8b7a66; }}
    #world-canvas {{ position: absolute; left: 0; top: 0; width: {W}px; height: {H}px; }}
  </style>
  <div id="root" data-composition-id="world" data-width="{W}" data-height="{H}">
    <canvas id="world-canvas" width="{W}" height="{H}" data-layout-allow-overflow></canvas>
  </div>
  <script>
    (function () {{
      const DUR = {DUR};
      const norm = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, "");
      const V = {{
        w(line, word, k) {{
          const hits = window.SIM_VO.lines[line].filter((x) => norm(x[0]).startsWith(norm(word)));
          if (!hits.length) throw new Error("no word " + line + ":" + word);
          return hits[Math.min(k || 0, hits.length - 1)][1];
        }},
        l(line) {{ return window.SIM_VO.starts[line]; }},
      }};
      const K = window.SIM.create({{ canvas: document.getElementById("world-canvas"), width: {W}, height: {H}, scale: window.SIM_SCALE || 1 }});
      window.SIM_ENVS(K);
      const C = window.SIM_CRAFT(K);
      const film = window.SIM_FILM(K, C, V);
      let ready = false, lastT = -1, curT = 0;
      function draw(t) {{
        curT = t;
        t = Math.round(t * 10000) / 10000;
        if (!ready || t === lastT) return;
        lastT = t;
        film.render(Math.min(t, DUR - 1 / 60));
      }}
      window.__hf = window.__hf || {{}};
      window.__hf.buildReady = window.__hf.buildReady || {{}};
      window.__hf.buildReady.world = K.ready.then(() => {{ ready = true; lastT = -1; draw(curT); }});
      window.addEventListener("hf-seek", (e) => draw(e.detail.time));
      const tl = gsap.timeline({{ paused: true }});
      const clock = {{ t: 0 }};
      tl.to(clock, {{ t: DUR, duration: DUR, ease: "none", onUpdate: () => draw(clock.t) }}, 0);
      window.__timelines["world"] = tl;
    }})();
  </script>
</template>
""")

    ch = chunks()
    sc = schedule()
    caps = "\n    ".join(f'<div class="clip cap" id="cap{k}" data-start="{c["t0"]}" data-duration="{round(c["t1"] - c["t0"], 3)}"><span class="cw">{esc(c["text"])}</span></div>'
                         for k, c in enumerate(ch))
    els, anims = [], []
    for k, c in enumerate(sc):
        d = round(c["t1"] - c["t0"], 3)
        if c["kind"] == "card":
            els.append(f'<div class="clip card" id="card{k}" data-start="{round(c["t0"], 3)}" data-duration="{d}" style="--bar:{c["bar"]}"><div class="ct">{esc(c["title"])}</div><div class="cs">{esc(c["sub"])}</div></div>')
            anims.append(f'tl.fromTo("#card{k}", {{ opacity: 0, x: 5 }}, {{ opacity: 1, x: 0, duration: 0.16, ease: "power2.out" }}, {round(c["t0"], 3)});')
        elif c["kind"] == "note":
            els.append(f'<div class="clip note" id="note{k}" data-start="{round(c["t0"], 3)}" data-duration="{d}"><span>{esc(c["text"])}</span></div>')
            anims.append(f'tl.fromTo("#note{k}", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.12, ease: "none" }}, {round(c["t0"], 3)});')
        elif c["kind"] == "tag":
            els.append(f'<div class="clip tag" id="tag{k}" data-start="{round(c["t0"], 3)}" data-duration="{d}"><span>{esc(c["text"])}</span></div>')
            anims.append(f'tl.fromTo("#tag{k}", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.12, ease: "none" }}, {round(c["t0"], 3)});')
        elif c["kind"] == "inset":
            hud = hud_svg()
            els.append(f'<div class="clip inset" id="inset{k}" data-start="{round(c["t0"], 3)}" data-duration="{d}"><div class="ib ib-t"></div><div class="ib ib-l"></div><div class="ib ib-r"></div>'
                       f'<div class="iband"><div class="it">{esc(c["title"])}</div><div class="is">{esc(c["sub"])}</div></div>{hud}</div>')
            anims.append(f'tl.fromTo("#inset{k}", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.15, ease: "none" }}, {round(c["t0"], 3)});')
    chrome = "\n    ".join(els)
    an = "\n      ".join(anims)
    open(os.path.join(comp, "captions.html"), "w", encoding="utf-8").write(f"""<template>
  <style>
    @font-face {{ font-family: "Bahnschrift"; src: local("Bahnschrift"); font-weight: 300 700; font-stretch: 75% 100%; font-display: block; }}
    #root {{ position: absolute; inset: 0; overflow: hidden; font-family: "Bahnschrift", sans-serif; }}
    /* channel mark — top-left, ~3 % of frame height */
    #root .wm {{ position: absolute; left: 46px; top: 163px; height: 54px; display: flex; align-items: center; gap: 11px; opacity: 0.86;
      filter: drop-shadow(0 1px 3px rgba(0,0,0,0.45)); }}
    #root .wm svg {{ width: 47px; height: 54px; }}
    #root .wm span {{ font-weight: 600; font-size: 34px; color: #ececea; letter-spacing: 0.005em; font-stretch: 100%; }}
    /* captions — white, semibold DIN, soft dark shadow, centred on 69 % height */
    #root .cap {{ position: absolute; left: 100px; right: 100px; top: 1329px; height: 0; display: flex; align-items: center; justify-content: center; }}
    #root .cw {{ display: block; max-width: 860px; text-align: center; font-weight: 600; font-size: 59px; line-height: 1.3; color: #f3f3ef; letter-spacing: 0.012em;
      text-shadow: 0 0 16px rgba(0,0,0,0.55), 0 0 6px rgba(0,0,0,0.35), 0 2px 3px rgba(0,0,0,0.35); }}
    /* info card — dark rounded box, coloured bar left, bold name + spec line */
    #root .card {{ position: absolute; left: 48px; top: 276px; height: 105px; padding: 0 18px 0 17px; background: rgba(23,24,27,0.94); border-radius: 0 9px 9px 0;
      display: flex; flex-direction: column; justify-content: center; box-shadow: -8px 0 0 0 var(--bar); }}
    #root .card .ct {{ font-weight: 600; font-size: 40px; line-height: 1.12; color: #ffffff; }}
    #root .card .cs {{ font-weight: 400; font-size: 31px; line-height: 1.2; color: #d0d0cd; white-space: nowrap; }}
    /* illustration note (thin bar) and tags, mid-left */
    #root .note, #root .tag {{ position: absolute; left: 40px; top: 1120px; height: 56px; display: flex; align-items: center; }}
    #root .note span {{ display: block; padding: 0 16px 0 17px; height: 56px; line-height: 56px; background: rgba(17,18,20,0.88); border-radius: 0 7px 7px 0;
      font-weight: 600; font-size: 30px; color: #f5f5f3; box-shadow: -5px 0 0 0 #c9c9c6; }}
    #root .tag span {{ display: block; padding: 0 17px; height: 58px; line-height: 58px; background: rgba(17,18,20,0.9); border-radius: 6px;
      font-weight: 600; font-size: 30px; color: #f5f5f3; }}
    /* picture-in-picture frame around the WebGL inset (image hole 48..1032 x 285..840) */
    #root .inset {{ position: absolute; left: 0; top: 0; width: {W}px; height: {H}px; }}
    #root .ib {{ position: absolute; background: #141518; }}
    #root .ib-t {{ left: 39px; top: 276px; width: 1002px; height: 9px; border-radius: 9px 9px 0 0; }}
    #root .ib-l {{ left: 39px; top: 285px; width: 9px; height: 555px; box-shadow: -3px 0 0 0 #ededeb; }}
    #root .ib-r {{ left: 1032px; top: 285px; width: 9px; height: 555px; }}
    #root .iband {{ position: absolute; left: 39px; top: 840px; width: 1002px; height: 98px; background: #18191c; border-radius: 0 0 9px 9px; padding: 14px 0 0 19px;
      box-shadow: -3px 0 0 0 #ededeb; }}
    #root .iband .it {{ font-weight: 600; font-size: 32px; color: #ffffff; line-height: 1.15; }}
    #root .iband .is {{ font-weight: 400; font-size: 23px; color: #c7c7c4; line-height: 1.5; }}
    #root .hud {{ position: absolute; left: 48px; top: 285px; width: 984px; height: 555px; }}
  </style>
  <div id="root" data-composition-id="captions" data-width="{W}" data-height="{H}">
    <div class="wm"><svg viewBox="0 0 47 54"><path d="M3 50 L23.5 4 L44 50 L23.5 36 Z" fill="#ececea"/><path d="M23.5 36 L44 50 L23.5 44 L3 50 Z" fill="#bdbdba"/></svg><span>Vectorwing</span></div>
    {chrome}
    {caps}
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
      {an}
      window.__timelines["captions"] = tl;
    }})();
  </script>
</template>
""")

    open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(f"""<!doctype html>
<html lang="en" data-size="{W}x{H}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <script src="assets/lib/three.global.js"></script>
    <script src="assets/lib/sim-config.js"></script>
    <script src="assets/lib/sim-kit.js"></script>
    <script src="assets/lib/sim-craft.js"></script>
    <script src="assets/lib/sim-envs.js"></script>
    <script src="assets/lib/sim-vo.js"></script>
    <script src="assets/lib/sim-shots.js"></script>
    <style>
      @font-face {{ font-family: "Bahnschrift"; src: local("Bahnschrift"); font-weight: 300 700; font-stretch: 75% 100%; font-display: block; }}
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: {W}px; height: {H}px; overflow: hidden; background: #8b7a66; }}
      .font-din {{ font-family: "Bahnschrift", sans-serif; }}
      #root {{ position: relative; width: 100%; height: 100%; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="{W}" data-height="{H}">
      <div id="world" data-composition-id="world" data-composition-src="compositions/world.html" data-start="0" data-duration="{DUR}" data-track-index="0" data-track-kind="graphics" data-width="{W}" data-height="{H}" style="z-index: 1"></div>
      <div id="captions" data-composition-id="captions" data-composition-src="compositions/captions.html" data-start="0" data-duration="{DUR}" data-track-index="1" data-track-kind="captions" data-width="{W}" data-height="{H}" style="z-index: 5"></div>
      <audio id="mix" class="clip" src="assets/audio/final.m4a" data-start="0" data-duration="{DUR}" data-track-index="20" data-volume="1"></audio>
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
""")
    cfg = os.path.join(lib, "sim-config.js")
    if not os.path.exists(cfg):
        open(cfg, "w", encoding="utf-8").write("/* render scale for the 3D layer: 1 = full 1080x1920 (final), 0.5 = draft */\nwindow.SIM_SCALE = 1;\n")

    # ---- sound project: voice + synthesized ambience bed (tools/ambience.py) + a few effects
    sd = os.path.join(ROOT, "score")
    os.makedirs(os.path.join(sd, "data"), exist_ok=True)
    os.makedirs(os.path.join(sd, "audio"), exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "vo", "data", "vo.json"), os.path.join(sd, "data", "vo.json"))
    shutil.copy2(os.path.join(ROOT, "vo", "audio", "vo.wav"), os.path.join(sd, "audio", "vo.wav"))
    cues = []

    def cue(t, kind, gain=0.5, pitch=1.0):
        cues.append({"t": round(t, 3), "type": kind, "gain": gain, "pitch": pitch})
    cue(wt("l05", "this") - 0.3, "whoosh", 0.45, 0.8)
    cue(line0("l07"), "woosh_low", 0.3)
    cue(line0("l18"), "woosh_low", 0.25)
    cue(line0("l24"), "whoosh", 0.3, 0.7)
    json.dump({"duration": DUR, "sfx": sorted(cues, key=lambda c: c["t"])}, open(os.path.join(sd, "data", "cues.json"), "w"), indent=0)
    json.dump({"preset": "none", "music_file": "audio/bed.wav", "duck_db": 2, "music_under_voice_db": -15, "music_alone_db": -14,
               "sfx_db": -10, "lufs": -14.1, "reverb": 0.1}, open(os.path.join(sd, "sound.json"), "w"), indent=1)
    # shot table for the ambience generator
    json.dump({"duration": DUR, "cuts": {k: round(line0(k), 3) for k in L}, "words": {"l05_this": wt("l05", "this"), "l05_both": wt("l05", "both"),
               "l08_merge": wt("l08", "merge"), "l17_noise": wt("l17", "noise"), "l19_made": wt("l19", "made"), "l24_then": wt("l24", "then")}},
              open(os.path.join(sd, "data", "shots.json"), "w"), indent=1)
    print("sim", DUR, "s ·", len(ch), "caption chunks ·", len(sc), "chrome items ·", len(cues), "cues")
    for c in ch:
        print(f'  {c["t0"]:6.2f} {c["text"]}')


def hud_svg():
    g = "#7dff9a"
    ladder = "".join(f'<line x1="402" y1="{278 + d * 46}" x2="462" y2="{278 + d * 46}" stroke="{g}" stroke-width="2"/><line x1="522" y1="{278 + d * 46}" x2="582" y2="{278 + d * 46}" stroke="{g}" stroke-width="2"/>'
                     f'<text x="590" y="{284 + d * 46}" fill="{g}" font-size="16" font-family="Bahnschrift, sans-serif">{abs(d) * 5}</text>' for d in (-2, -1, 1, 2))
    return (f'<svg class="hud" viewBox="0 0 984 555" style="opacity:0.85">'
            f'<line x1="300" y1="278" x2="684" y2="278" stroke="{g}" stroke-width="2"/>{ladder}'
            f'<path d="M472 278 L492 290 L512 278" fill="none" stroke="{g}" stroke-width="2.5"/>'
            f'<rect x="60" y="258" width="92" height="40" fill="none" stroke="{g}" stroke-width="2"/><text x="72" y="286" fill="{g}" font-size="24" font-family="Bahnschrift, sans-serif">280</text>'
            f'<rect x="832" y="258" width="104" height="40" fill="none" stroke="{g}" stroke-width="2"/><text x="842" y="286" fill="{g}" font-size="24" font-family="Bahnschrift, sans-serif">5200</text>'
            f'<text x="60" y="44" fill="{g}" font-size="20" font-family="Bahnschrift, sans-serif">XVS</text><text x="856" y="44" fill="{g}" font-size="20" font-family="Bahnschrift, sans-serif">CAM 1</text>'
            f'</svg>')


if __name__ == "__main__":
    main()

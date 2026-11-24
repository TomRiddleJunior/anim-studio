"""Gold-studio reel — wires the narration to the HyperFrames project.

Writes: assets/lib/gold-vo.js (word times), compositions/world.html (the three.js shot player for
assets/lib/gold-shots.js, with sub-frame motion blur), compositions/captions.html (2-5-word top captions, one clip
each), index.html (1080 x 1920), score/ (sound.json, cues.json, voice) for the explainer engine's sound.py.

usage: python -I tools/build.py
"""
import json
import os
import re
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
DUR = round(VO["duration"], 2)
W, H = 1080, 1920

# caption chunks per line ("|" = new caption); lines missing here are title cards (no caption)
CHUNKS = {
    "l01": "Alaska and Alberta | both struck it | rich selling oil.",
    "l02": "Alaska turned it into an | eighty-eight-billion-dollar fund.",
    "l03": "Alberta's fund is | about a quarter | of that.",
    "l05": "In nineteen seventy-six, | Alaskans voted to | save part of | their oil money.",
    "l06": "At least | twenty-five percent | of oil royalties | goes in,",
    "l07": "to one giant fund, | and those savings | can only be invested.",
    "l08": "They invested it, | and it just kept | growing.",
    "l09": "Now it pays out | about three point eight | billion dollars a year, | for dividends | and public services,",
    "l10": "and the fund | is still growing.",
    "l11": "Alberta went the | other way.",
    "l12": "It took in about | eighteen billion dollars | of resource revenue | last year alone.",
    "l13": "The plan back | in nineteen seventy-six?",
    "l13b": "To save thirty cents | of every resource dollar.",
    "l15": "In nineteen eighty-seven, | the deposits stopped.",
    "l16": "Not one new dollar | went in until | two thousand six.",
    "l17": "Two places.",
    "l18": "Same oil.",
    "l19": "Alaska kept saving.",
    "l20": "Alberta stopped | for nineteen years.",
}
TITLE_LINES = ["l04", "l14"]


def norm(s):
    return re.sub(r"[^a-z0-9']", "", s.lower())


def captions():
    out = []
    lines = {l["id"]: l for l in VO["lines"]}
    for lid, spec in CHUNKS.items():
        words = lines[lid]["words"]
        k = 0
        for ch in [c.strip() for c in spec.split("|")]:
            n = len(ch.split())
            ws = words[k:k + n]
            assert [norm(x["w"]) for x in ws] == [norm(x) for x in ch.split()], (lid, ch, [x["w"] for x in ws])
            out.append(dict(t0=ws[0]["start"] - 0.03, text=ch, line=lid))
            k += n
        assert k == len(words), (lid, k, len(words))
    out.sort(key=lambda c: c["t0"])
    # a caption stays until the next one (or a title card, or the end)
    cuts = sorted([lines[i]["start"] - 0.12 for i in TITLE_LINES])
    for i, c in enumerate(out):
        nxt = out[i + 1]["t0"] if i + 1 < len(out) else DUR
        for tc in cuts:
            if c["t0"] < tc < nxt:
                nxt = tc
        c["t1"] = nxt
    return out


WORLD = """<template>
  <style>
    #root {{ position: absolute; inset: 0; overflow: hidden; background: #000; }}
    #world-canvas {{ position: absolute; left: 0; top: 0; width: {W}px; height: {H}px; }}
  </style>
  <div id="root" data-composition-id="world" data-width="{W}" data-height="{H}">
    <canvas id="world-canvas" width="{W}" height="{H}" data-layout-allow-overflow></canvas>
  </div>
  <script>
    (function () {{
      const DUR = {DUR};
      const norm = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, "");
      const VOL = window.GOLD_VO.lines;
      const V = {{
        dur: DUR,
        line(id) {{ return VOL[id]; }},
        w(line, word, k) {{
          const hits = VOL[line].words.filter((x) => norm(x[0]).startsWith(norm(word)));
          if (!hits.length) throw new Error("no word " + line + ":" + word);
          return hits[Math.min(k || 0, hits.length - 1)][1];
        }},
      }};
      const SCALE = window.GOLD_SCALE || 1;
      const K = window.GOLD.create({{ canvas: document.getElementById("world-canvas"), width: Math.round({W} * SCALE), height: Math.round({H} * SCALE), base: "assets/" }});
      const film = window.GOLD_FILM(K, V);
      const SH = film.shots;
      let ready = false, lastT = -1, curT = 0;
      function idx(t) {{ let i = 0; while (i < SH.length - 1 && t >= SH[i + 1].t0) i++; return i; }}
      function run(i, t) {{
        const s = SH[i], t1 = i < SH.length - 1 ? SH[i + 1].t0 : DUR;
        if (film.reset[s.set]) film.reset[s.set]();
        const st = s.fn(t, Math.min(1, Math.max(0, (t - s.t0) / (t1 - s.t0))));
        st.t = t;
        return st;
      }}
      function draw(t) {{
        curT = t;
        t = Math.round(t * 10000) / 10000;
        if (!ready || t === lastT) return;
        lastT = t;
        const i = idx(t), s = SH[i], t1 = i < SH.length - 1 ? SH[i + 1].t0 : DUR;
        const n = s.mb ? Math.max(1, Math.round(s.mb(t))) : 1;
        const sh = s.shutter || 1 / 30;
        let st;
        for (let k = 0; k < n; k++) {{
          const tt = n > 1 ? Math.min(t1 - 1e-4, Math.max(s.t0, t + sh * (k / (n - 1) - 0.5))) : t;
          st = run(i, tt);
          st.t = t;
          K.frame(st, {{ k, n }});
        }}
        K.post(st, n);
      }}
      window.__goldDraw = draw;
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
"""

CAPS = """<template>
  <style>
    #root {{ position: absolute; inset: 0; overflow: hidden; }}
    #root .cap {{ position: absolute; left: 70px; right: 70px; top: 254px; height: 60px; display: flex; align-items: center; justify-content: center; }}
    #root .cw {{ display: inline-block; font: 520 44px/1 "Inter", sans-serif; color: #efe7df; text-align: center; white-space: nowrap;
      letter-spacing: -0.012em; text-shadow: 0 0 14px rgba(0, 0, 0, 0.75), 0 2px 5px rgba(0, 0, 0, 0.6); }}
  </style>
  <div id="root" data-composition-id="captions" data-width="{W}" data-height="{H}">
    {els}
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
      {anims}
      window.__timelines["captions"] = tl;
    }})();
  </script>
</template>
"""

INDEX = """<!doctype html>
<html lang="en" data-size="{W}x{H}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <script src="assets/lib/three.global.js"></script>
    <script src="assets/lib/gold-kit.js"></script>
    <script src="assets/lib/gold-vo.js"></script>
    <script src="assets/lib/gold-map.js"></script>
    <script src="assets/lib/gold-shots.js"></script>
    <style>
      @font-face {{ font-family: "Inter"; src: url("assets/fonts/Inter_opsz-wght_.ttf") format("truetype"); font-weight: 100 900; font-display: block; }}
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: {W}px; height: {H}px; overflow: hidden; background: #000; }}
      .font-inter {{ font-family: "Inter", sans-serif; }}
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
"""


def main():
    lib = os.path.join(ROOT, "assets", "lib")
    lines = {l["id"]: {"start": round(l["start"], 3), "end": round(l["end"], 3),
                       "words": [[x["w"], round(x["start"], 3), round(x["end"], 3)] for x in l["words"]]} for l in VO["lines"]}
    open(os.path.join(lib, "gold-vo.js"), "w", encoding="utf-8").write(
        "/* generated by tools/build.py from vo/data/vo.json */\nwindow.GOLD_VO = " + json.dumps({"dur": DUR, "lines": lines}) + ";\n")
    comp = os.path.join(ROOT, "compositions")
    os.makedirs(comp, exist_ok=True)
    open(os.path.join(comp, "world.html"), "w", encoding="utf-8").write(WORLD.format(W=W, H=H, DUR=DUR))
    caps = captions()
    els = "\n    ".join(f'<div class="clip cap" id="cap{k}" data-start="{round(c["t0"], 3)}" data-duration="{round(c["t1"] - c["t0"], 3)}"><span class="cw" id="cw{k}">{c["text"]}</span></div>'
                       for k, c in enumerate(caps))
    anims = "\n      ".join(
        f'tl.fromTo("#cw{k}", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.1, ease: "power1.out" }}, {round(c["t0"], 3)});'
        + (f' tl.to("#cw{k}", {{ opacity: 0, duration: 0.066, ease: "none" }}, {round(c["t1"] - 0.066, 3)});' if c["t1"] < DUR - 0.01 else "")
        for k, c in enumerate(caps))
    open(os.path.join(comp, "captions.html"), "w", encoding="utf-8").write(CAPS.format(W=W, H=H, els=els, anims=anims))
    open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(INDEX.format(W=W, H=H, DUR=DUR))
    json.dump([{"t0": round(c["t0"], 3), "t1": round(c["t1"], 3), "text": c["text"]} for c in caps],
              open(os.path.join(ROOT, "vo", "data", "captions.json"), "w", encoding="utf-8"), indent=0)
    n = score()
    print("gold-studio", DUR, "s ·", len(caps), "captions ·", n, "sfx cues")


def score():
    """Sound project for engine/audio/sound.py: voice, the synthesized bed (tools/make_bed.py) and effects on the
    picture's events (times mirror assets/lib/gold-shots.js)."""
    sd = os.path.join(ROOT, "score")
    os.makedirs(os.path.join(sd, "data"), exist_ok=True)
    os.makedirs(os.path.join(sd, "audio"), exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "vo", "data", "vo.json"), os.path.join(sd, "data", "vo.json"))
    shutil.copy2(os.path.join(ROOT, "vo", "audio", "vo.wav"), os.path.join(sd, "audio", "vo.wav"))
    L = {l["id"]: l for l in VO["lines"]}

    def w(line, word, k=0):
        hits = [x for x in L[line]["words"] if norm(x["w"]).startswith(norm(word))]
        return hits[min(k, len(hits) - 1)]["start"]
    st = lambda i: L[i]["start"]
    en = lambda i: L[i]["end"]
    cues = []

    def cue(t, kind, gain=0.5, pitch=1.0, dur=None):
        c = {"t": round(max(0.0, t), 3), "type": kind, "gain": gain, "pitch": pitch}
        if dur:
            c["dur"] = dur
        cues.append(c)
    # 1 open: two drops, pull back, coins stacking, label glitches
    cue(0.0, "whoosh", 0.25, 1.2); cue(0.2, "thud", 0.45, 0.8)
    cue(0.45, "whoosh", 0.22, 1.25); cue(0.7, "thud", 0.42, 0.85)
    cue(w("l01", "rich") - 0.2, "riser", 0.18, 0.8, 1.0)
    cue(w("l02", "into") - 0.08, "whoosh", 0.35, 0.8)
    for k in range(10):
        cue(w("l02", "eighty") + k * 0.11, "coin", 0.16, 0.9 + 0.04 * k)
    cue(w("l02", "eighty") + 0.05, "glitch", 0.22); cue(w("l02", "eighty") + 0.45, "glitch", 0.16); cue(w("l02", "fund"), "glitch", 0.16)
    for k in range(4):
        cue(w("l03", "about") + k * 0.12, "coin", 0.14, 0.95 + 0.05 * k)
    # 2 title card
    cue(st("l04") - 0.12, "impact", 0.38, 0.8); cue(w("l04", "why") - 0.04, "sparkle", 0.22)
    # 3 hero
    cue(st("l05") - 0.08, "woosh_low", 0.3)
    for k in range(5):
        cue(w("l05", "voted") - 0.1 + k * 0.07, "pop", 0.16, 0.8 + 0.06 * k)
    cue(w("l05", "save"), "sparkle", 0.22, 0.9)
    cue(st("l06") - 0.2, "whoosh", 0.42, 1.1)
    # 4 ring + safe
    for k in range(6):
        cue(w("l06", "twenty") + k * 0.12, "tick", 0.22, 1.0 + 0.05 * k)
    cue(w("l06", "percent") + 0.25, "ding", 0.18, 0.9)
    cue(st("l07") - 0.12, "whoosh", 0.4, 0.95)
    for k in range(16):
        cue(st("l07") + 0.2 + k * 0.13, "coin", 0.13, 0.85 + 0.03 * (k % 6))
    cue(w("l07", "only") - 0.1 + 0.26, "impact", 0.45, 1.1)
    for k in range(5):
        cue(w("l07", "only") + 0.32 + k * 0.1, "tick", 0.16, 0.8)
    # 5 chart
    cue(st("l08") - 0.1, "impact", 0.28, 0.9); cue(st("l08") + 0.1, "riser", 0.18, 1.0, 2.0)
    for k in range(6):
        cue(w("l09", "three") + k * 0.13, "tick", 0.18, 1.05)
    cue(w("l09", "dividends"), "pop", 0.25); cue(w("l09", "public"), "pop", 0.25, 1.06); cue(w("l09", "services"), "pop", 0.25, 1.12)
    cue(st("l11") - 0.05, "woosh_low", 0.32, 0.9)
    # 6 map
    cue(st("l12") - 0.1, "whoosh", 0.3, 0.8)
    for k in range(6):
        cue(w("l12", "eighteen") + k * 0.12, "tick", 0.18, 1.0)
    cue(st("l13") - 0.16, "whoosh", 0.42, 1.15)
    # 7 coin + grid
    cue(st("l13") + 0.05, "coin", 0.35, 0.7); cue(st("l13") + 0.6, "sparkle", 0.18)
    for k in range(6):
        cue(st("l13") + 0.55 + k * 0.06, "pop", 0.1, 0.7 + 0.05 * k)
    cue(w("l13b", "thirty") - 0.15, "glitch", 0.2)
    for k in range(10):
        cue(w("l13b", "every") + 0.55 + k * 0.07, "coin", 0.14, 1.0 + 0.03 * k)
    cue(w("l13b", "dollar") - 0.25, "swoosh", 0.3)
    # 8 red title
    cue(st("l14") - 0.1, "impact", 0.42, 0.7); cue(w("l14", "twist") - 0.05, "glitch", 0.25, 0.8)
    # 9 plant
    for k in range(3):
        cue(st("l15") + 0.1 + k * 0.28, "thud", 0.35, 0.75 + 0.05 * k)
    cue(st("l15") + 1.0, "woosh_low", 0.2)
    cue(w("l15", "deposits") - 0.1, "stamp", 0.35, 0.8)
    cue(w("l16", "two") - 0.25, "whoosh", 0.2, 1.3); cue(w("l16", "two") + 0.25, "coin", 0.4, 0.9); cue(w("l16", "two") + 0.6, "coin", 0.25, 1.0)
    # 10 ending
    t_end = st("l17") - 0.12
    cue(t_end, "whoosh", 0.25, 1.2); cue(t_end + 0.22, "thud", 0.45, 0.8); cue(t_end + 0.3, "whoosh", 0.22, 1.25); cue(t_end + 0.55, "thud", 0.42, 0.85)
    cue(w("l18", "same") - 0.05, "pop", 0.3, 0.9)
    cue(st("l19") - 0.15, "whoosh", 0.35, 0.8)
    for k in range(10):
        cue(w("l19", "kept") + k * 0.12, "coin", 0.15, 0.9 + 0.04 * k)
    for k in range(3):
        cue(st("l20") + 0.1 + k * 0.15, "coin", 0.13, 0.95)
    json.dump({"duration": DUR, "sfx": sorted(cues, key=lambda c: c["t"])}, open(os.path.join(sd, "data", "cues.json"), "w"), indent=0)
    json.dump({"preset": "none", "music_file": "audio/bed.wav", "end_hit": False, "music_under_voice_db": -14.5, "music_alone_db": -8,
               "duck_db": 3, "sfx_db": -9, "lufs": -12.6},
              open(os.path.join(sd, "sound.json"), "w"), indent=1)
    return len(cues)


if __name__ == "__main__":
    main()

"""Gold-studio reel (template) — wires the narration to the HyperFrames project.

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

# ---- per-film config -------------------------------------------------------------------------------------------
# caption chunks per line ("|" = new caption, 2-5 words, numbers spelled out as spoken); lines not listed are chunked
# automatically (break after , . ? !, otherwise every 3 words); TITLE_LINES are title cards (no caption)
CHUNKS = {
    "l01": "Two places | found the | same resource.",
    "l02": "One saved it.",
}
TITLE_LINES = ["l03"]
# effects: (line, word, offset s, type, gain, pitch) — types from engine/audio/sound.py
CUES = [
    ("l01", "two", -0.12, "whoosh", 0.25, 1.2), ("l01", "two", 0.09, "thud", 0.45, 0.8),
    ("l01", "places", 0.0, "whoosh", 0.22, 1.25), ("l01", "found", 0.0, "thud", 0.42, 0.85),
    ("l02", "one", -0.08, "whoosh", 0.35, 0.8), ("l02", "saved", 0.0, "coin", 0.2, 1.0), ("l02", "saved", 0.15, "coin", 0.16, 1.1),
    ("l03", "here", -0.12, "impact", 0.38, 0.8), ("l03", "how", -0.04, "sparkle", 0.22, 1.0),
]
SOUND = {"preset": "none", "music_file": "audio/bed.wav", "end_hit": False, "music_under_voice_db": -14.5, "music_alone_db": -8,
         "duck_db": 3, "sfx_db": -9, "lufs": -12.6}


def norm(s):
    return re.sub(r"[^a-z0-9']", "", s.lower())


def auto_chunks(words):
    out, cur = [], []
    for x in words:
        cur.append(x["w"])
        if re.search(r"[,.?!]$", x["w"]) or len(cur) == 3:
            out.append(" ".join(cur))
            cur = []
    if cur:
        out.append(" ".join(cur))
    return " | ".join(out)


def captions():
    out = []
    lines = {l["id"]: l for l in VO["lines"]}
    for lid in [l["id"] for l in VO["lines"] if l["id"] not in TITLE_LINES]:
        words = lines[lid]["words"]
        spec = CHUNKS.get(lid) or auto_chunks(words)
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
    cues = []
    for line, word, off, kind, gain, pitch in CUES:
        cues.append({"t": round(max(0.0, w(line, word) + off), 3), "type": kind, "gain": gain, "pitch": pitch})
    json.dump({"duration": DUR, "sfx": sorted(cues, key=lambda c: c["t"])}, open(os.path.join(sd, "data", "cues.json"), "w"), indent=0)
    json.dump(SOUND, open(os.path.join(sd, "sound.json"), "w"), indent=1)
    return len(cues)


if __name__ == "__main__":
    main()

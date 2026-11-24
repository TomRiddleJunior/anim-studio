"""Rules-horror 3D reel — wires the narration to the HyperFrames project.

Writes
  assets/lib/film-vo.js       line + word times (window.FILM_VO)
  compositions/world.html     the three.js shot player for assets/lib/film-shots.js (+ a 2-D overlay canvas for the
                              in-scene choice labels), with motion-blur "previous camera" and hand-held drift
  compositions/captions.html  2-3 words at a time, white heavy uppercase, low-centre (the format's caption system)
  index.html                  1080 x 1920, 30 fps root
  out/<name>.srt              the captions beside the render (the QA counts words per minute from it)

usage: python -I tools/build_film.py        (after the engine's tts.py has voiced vo/script.json)
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = os.path.basename(ROOT)
VO = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
SCRIPT = json.load(open(os.path.join(ROOT, "vo", "script.json"), encoding="utf-8"))
CFG = SCRIPT.get("film", {})
DUR = round(float(os.environ.get("DUR_OVERRIDE", VO["duration"])), 2)
W, H, FPS = 1080, 1920, 30
LIBS = CFG.get("libs", ["rh3d-core.js", "rh3d-mannequin.js", "rh3d-props.js", "rh3d-garage.js"])

# caption system measured on the source (720x1280 -> x1.5): Montserrat-like heavy caps, cap height ~61 px at 1920,
# centred at ~69 % of the height; 1-3 words, a break after every punctuation mark, single long words alone.
CAP_Y = CFG.get("cap_y", 1268)          # centre line, px (inside the 9:16 safe band: above 80 %, below 8 %)
CAP_SIZE = CFG.get("cap_size", 84)
MAX_WORDS, MAX_CHARS = 3, 15
FUNCTION_WORDS = {"the", "a", "an", "of", "to", "your", "my", "in", "at", "on", "and", "but", "or", "for", "with", "you", "is"}
ACCENT = set(CFG.get("accent_words", ["red", "run", "rule", "one."]))
ACCENT_HEX = CFG.get("accent_hex", "#ff3b30")


def plain(text):
    return re.sub(r"\[([^\]]+)\]\(/[^)]*/\)", r"\1", text)


def chunk_words(words):
    """words: [{w, start, end}] -> list of lists. Greedy, punctuation-closed, function words carried forward."""
    out, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        txt = " ".join(x["w"] for x in cur)
        nxt = words[i + 1]["w"] if i + 1 < len(words) else None
        end_punct = bool(re.search(r"[.,!?;:…]$", w["w"]))
        too_long = nxt is not None and (len(cur) >= MAX_WORDS or len(txt) + 1 + len(nxt) > MAX_CHARS)
        if end_punct or nxt is None or too_long:
            # do not end a chunk on a dangling function word unless it closes a phrase
            if not end_punct and nxt is not None and len(cur) > 1 and re.sub(r"[^a-z']", "", w["w"].lower()) in FUNCTION_WORDS:
                carry = cur.pop()
                out.append(cur)
                cur = [carry]
                continue
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return out


def captions():
    """[(on, off, html, n_words, line_id)]: on at the first word's onset; held until the next caption (contiguous, as
    in the source); in a pause longer than 0.7 s it leaves 0.45 s after its last word."""
    chunks = []
    for li, line in enumerate(VO["lines"]):
        for c in chunk_words(line["words"]):
            chunks.append((c, line["id"]))
    out = []
    for k, (c, lid) in enumerate(chunks):
        on = c[0]["start"] + 0.02
        nxt_on = chunks[k + 1][0][0]["start"] + 0.02 if k + 1 < len(chunks) else DUR
        last_end = c[-1]["end"]
        off = nxt_on if nxt_on - last_end <= 0.7 else last_end + 0.45
        words = []
        for x in c:
            t = x["w"].upper()
            key = re.sub(r"[^a-z.]", "", x["w"].lower())
            if key in ACCENT or key.rstrip(".") in ACCENT:
                t = f'<span class="acc">{t}</span>'
            words.append(t)
        out.append((round(on, 3), round(off, 3), " ".join(words), len(c), lid))
    return out


WORLD = r"""<template>
  <style>
    #root { position: absolute; inset: 0; overflow: hidden; background: #000; }
    #world-canvas, #ovl { position: absolute; left: 0; top: 0; width: __W__px; height: __H__px; }
    @font-face { font-family: "MontserratRH"; src: url("assets/fonts/Montserrat_wght_.ttf") format("truetype"); font-weight: 100 900; }
  </style>
  <div id="root" data-composition-id="world" data-width="__W__" data-height="__H__">
    <canvas id="world-canvas" width="__W__" height="__H__" data-layout-allow-overflow></canvas>
    <canvas id="ovl" width="__W__" height="__H__" data-layout-allow-overflow></canvas>
  </div>
  <script>
    (function () {
      const DUR = __DUR__, FPS = __FPS__;
      const VOD = window.FILM_VO;
      const norm = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, "");
      const V = {
        L(id) { const l = VOD.lines[id]; if (!l) throw new Error("no line " + id); return l; },
        /** onset of the k-th word in line id that starts with `word` */
        w(id, word, k) {
          const hits = VOD.lines[id].words.filter((x) => norm(x[0]).startsWith(norm(word)));
          if (!hits.length) throw new Error("no word " + id + ":" + word);
          return hits[Math.min(k || 0, hits.length - 1)][1];
        },
        we(id, word, k) {
          const hits = VOD.lines[id].words.filter((x) => norm(x[0]).startsWith(norm(word)));
          if (!hits.length) throw new Error("no word " + id + ":" + word);
          return hits[Math.min(k || 0, hits.length - 1)][2];
        },
        dur: DUR,
      };
      const K = window.RH3D.create(Object.assign({ canvas: document.getElementById("world-canvas"), width: __W__, height: __H__ }, window.FILM_CREATE || {}));
      const film = window.FILM(K, V);
      const SH = film.shots;
      const ovl = document.getElementById("ovl").getContext("2d");
      const ease = (u) => -(Math.cos(Math.PI * u) - 1) / 2;
      const lerp3 = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
      const val = (x, u) => (Array.isArray(x) ? x[0] + (x[1] - x[0]) * u : x);
      function shotAt(t) { let i = 0; while (i < SH.length - 1 && t >= SH[i + 1].t0) i++; return i; }
      function camState(i, t) {
        const s = SH[i], t1 = i < SH.length - 1 ? SH[i + 1].t0 : DUR;
        const u = Math.min(1, Math.max(0, (t - s.t0) / (t1 - s.t0)));
        const e = (s.ease || ease)(u);
        const c = { cam: lerp3(s.cam[0], s.cam[1], e), look: lerp3(s.look[0], s.look[1], e), fov: val(s.fov || 30, e), roll: val(s.roll || 0, e), u, e };
        if (s.path) Object.assign(c, s.path(t, u, e));
        const hh = window.RH3D.handheld(t, s.hand == null ? 1 : s.hand, (s.seed || i) + 1);
        c.cam = [c.cam[0] + hh.pos[0], c.cam[1] + hh.pos[1], c.cam[2] + hh.pos[2]];
        c.rot = hh.rot;
        if (s.shake) { const k = s.shake(t); c.rot = [c.rot[0] + k * Math.sin(t * 91), c.rot[1] + k * Math.sin(t * 77 + 1), c.rot[2] + k * 0.6 * Math.sin(t * 63 + 2)]; }
        return c;
      }
      let ready = false, lastT = -1, curT = 0;
      function draw(t) {
        curT = t;
        t = Math.round(t * 10000) / 10000;
        if (!ready || t === lastT) return;
        lastT = t;
        const i = shotAt(t), s = SH[i];
        const t1 = i < SH.length - 1 ? SH[i + 1].t0 : DUR;
        const u0 = Math.min(1, Math.max(0, (t - s.t0) / (t1 - s.t0)));
        // order matters: frames render out of order, so the world and the cast are posed from t before any camera
        // path or prop reads a bone position
        film.reset(t, s, i);
        const extra = s.fn ? s.fn(t, u0, (s.ease || ease)(u0)) || {} : {};
        if (film.post) film.post(t, s, i);
        const c = camState(i, t);
        const st = Object.assign({ cam: c.cam, look: c.look, fov: c.fov, roll: c.roll, rot: c.rot, focus: val(s.focus, c.e), aperture: val(s.aperture, c.e),
          maxBlur: s.maxBlur, exposure: val(s.exposure, c.e), t, mblur: s.mblur == null ? 0.5 : s.mblur }, film.look ? film.look(t, s, i) : {}, extra);
        if (st.mblur > 0) { const p = camState(i, t - 1 / FPS); st.prev = { cam: p.cam, look: p.look, fov: p.fov, roll: p.roll, rot: p.rot }; }
        K.render(st);
        ovl.clearRect(0, 0, __W__, __H__);
        if (film.overlay) film.overlay(ovl, t, s, i, K);
      }
      window.__hf = window.__hf || {};
      window.__hf.buildReady = window.__hf.buildReady || {};
      const fontP = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load('800 30px "MontserratRH"'), document.fonts.load('900 30px "MontserratRH"')]).catch(() => null) : Promise.resolve();
      window.__hf.buildReady.world = Promise.all([K.ready, fontP]).then(() => { if (film.init) film.init(); ready = true; lastT = -1; draw(curT); });
      window.addEventListener("hf-seek", (e) => draw(e.detail.time));
      const tl = gsap.timeline({ paused: true });
      const clock = { t: 0 };
      tl.to(clock, { t: DUR, duration: DUR, ease: "none", onUpdate: () => draw(clock.t) }, 0);
      window.__timelines["world"] = tl;
    })();
  </script>
</template>
"""


def main():
    lib = os.path.join(ROOT, "assets", "lib")
    lines = {l["id"]: {"t0": round(l["start"], 3), "t1": round(l["end"], 3), "text": plain(l["text"]),
                       "words": [[x["w"], round(x["start"], 3), round(x["end"], 3)] for x in l["words"]]} for l in VO["lines"]}
    open(os.path.join(lib, "film-vo.js"), "w", encoding="utf-8").write(
        "/* generated by tools/build_film.py from vo/data/vo.json */\nwindow.FILM_VO = "
        + json.dumps({"dur": DUR, "fps": FPS, "lines": lines}, separators=(",", ":")) + ";\n")

    comp = os.path.join(ROOT, "compositions")
    os.makedirs(comp, exist_ok=True)
    open(os.path.join(comp, "world.html"), "w", encoding="utf-8").write(
        WORLD.replace("__W__", str(W)).replace("__H__", str(H)).replace("__DUR__", str(DUR)).replace("__FPS__", str(FPS)))

    ch = captions()
    els = "\n    ".join(f'<div class="clip cap" id="cap{k}" data-start="{c[0]}" data-duration="{round(c[1] - c[0], 3)}"><div class="t" id="ct{k}">{c[2]}</div></div>'
                       for k, c in enumerate(ch))
    pops = "\n      ".join(
        f'tl.fromTo("#ct{k}", {{ opacity: 0, scale: 1.06 }}, {{ opacity: 1, scale: 1, duration: 0.09, ease: "power2.out" }}, {c[0]});' for k, c in enumerate(ch))
    open(os.path.join(comp, "captions.html"), "w", encoding="utf-8").write(f"""<template>
  <style>
    @font-face {{ font-family: "MontserratRH"; src: url("assets/fonts/Montserrat_wght_.ttf") format("truetype"); font-weight: 100 900; }}
    #root {{ position: absolute; inset: 0; overflow: hidden; }}
    /* source: heavy geometric sans caps, white, soft dark drop shadow, no box; 1-3 words; centred low (~69 % height) */
    #root .cap {{ position: absolute; left: 65px; right: 65px; top: {CAP_Y}px; height: 0; display: flex; justify-content: center; align-items: center; }}
    #root .t {{ display: inline-block; font: 800 {CAP_SIZE}px/1.0 "MontserratRH", "Montserrat", "Arial Black", sans-serif; color: #ffffff; text-align: center;
      white-space: nowrap; letter-spacing: -0.012em; text-transform: uppercase;
      text-shadow: 0 4px 14px rgba(0,0,0,0.62), 0 1px 3px rgba(0,0,0,0.75), 0 0 1px rgba(0,0,0,0.9); transform-origin: 50% 50%; }}
    #root .acc {{ color: {ACCENT_HEX}; }}
  </style>
  <div id="root" data-composition-id="captions" data-width="{W}" data-height="{H}">
    {els}
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
      {pops}
      window.__timelines["captions"] = tl;
    }})();
  </script>
</template>
""")

    scripts = "\n    ".join(f'<script src="assets/lib/{x}"></script>' for x in ["three.global.js"] + LIBS + ["film-vo.js", "film-shots.js"])
    open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(f"""<!doctype html>
<html lang="en" data-size="{W}x{H}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    {scripts}
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: {W}px; height: {H}px; overflow: hidden; background: #000; }}
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

    def ts(t):
        h, r = divmod(t, 3600)
        m, s = divmod(r, 60)
        return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s % 1) * 1000)) % 1000:03d}"
    os.makedirs(os.path.join(ROOT, "out"), exist_ok=True)
    with open(os.path.join(ROOT, "out", NAME + ".srt"), "w", encoding="utf-8") as f:
        for k, c in enumerate(ch):
            f.write(f"{k + 1}\n{ts(c[0])} --> {ts(c[1])}\n{re.sub(r'<[^>]+>', '', c[2])}\n\n")
    print(NAME, DUR, "s ·", len(ch), "captions ·", sum(c[3] for c in ch), "words")
    if os.environ.get("VERBOSE"):
        for c in ch:
            print(f"  {c[0]:6.2f}-{c[1]:6.2f} {c[4]}  {re.sub(r'<[^>]+>', '', c[2])}")


if __name__ == "__main__":
    main()

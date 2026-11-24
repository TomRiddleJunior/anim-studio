"""Write index.html and compositions/world.html for the math race (1080 x 1920, 30 fps, one canvas + the mix).
The film's timing lives in assets/lib/film.js; the shared constants (length, tempo, first beat) are here and in
tools/sound_design.py (both read CFG below via score/config.json).

usage: python -I tools/build.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = {"dur": 15.6, "bpm": 103.0, "beat0": -0.26, "crossBeats": [8, 16, 21], "dropBeat": 8, "revealBeat": 24}  # bar 2 (the drop + reveal) lands at 4.40 s; the source's energy is full from ~3.5 s, its reveal at ~4.75 s


def main():
    os.makedirs(os.path.join(ROOT, "score"), exist_ok=True)
    json.dump(CFG, open(os.path.join(ROOT, "score", "config.json"), "w"), indent=1)
    D = CFG["dur"]
    index = f"""<!doctype html>
<html lang="en" data-size="1080x1920">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <script src="assets/lib/race.js"></script>
    <script src="assets/lib/film.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #0b0a0f; }}
      #root {{ position: relative; width: 100%; height: 100%; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{D}" data-width="1080" data-height="1920">
      <div id="world" data-composition-id="world" data-composition-src="compositions/world.html" data-start="0" data-duration="{D}" data-track-index="0" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index: 1"></div>
      <audio id="mix" class="clip" src="assets/audio/final.m4a" data-start="0" data-duration="{D}" data-track-index="20" data-volume="1"></audio>
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
"""
    world = f"""<template>
  <style>
    @font-face {{ font-family: "MPoppins"; src: url("assets/fonts/Poppins-Medium.ttf"); font-weight: 500; }}
    @font-face {{ font-family: "MPoppins"; src: url("assets/fonts/Poppins-SemiBold.ttf"); font-weight: 600; }}
    @font-face {{ font-family: "MBask"; src: url("assets/fonts/LibreBaskerville-Italic_wght_.ttf"); font-style: italic; font-weight: 400 700; }}
    @font-face {{ font-family: "MBaskR"; src: url("assets/fonts/LibreBaskerville_wght_.ttf"); font-weight: 400 700; }}
    #root {{ position: absolute; inset: 0; overflow: hidden; background: #0b0a0f; }}
    #world-canvas {{ position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; }}
    #fontwarm {{ position: absolute; left: -9999px; top: 0; font-family: MPoppins, MBask, MBaskR; }}
  </style>
  <div id="root" data-composition-id="world" data-width="1080" data-height="1920">
    <canvas id="world-canvas" width="1080" height="1920" data-layout-allow-overflow></canvas>
    <div id="fontwarm"><span style="font-family: MPoppins; font-weight: 500">a</span><span style="font-family: MPoppins; font-weight: 600">a</span><span style="font-family: MBask; font-style: italic">y</span><span style="font-family: MBaskR">2</span></div>
  </div>
  <script>
    (function () {{
      const DUR = {D};
      const film = window.MATH_FILM(document.getElementById("world-canvas"), {json.dumps(CFG)});
      let ready = false, lastT = -1, curT = 0;
      function draw(t) {{
        curT = t;
        t = Math.round(t * 10000) / 10000;
        if (!ready || t === lastT) return;
        lastT = t;
        film.draw(t);
      }}
      const fonts = Promise.all(["500 25px MPoppins", "600 48px MPoppins", "italic 400 44px MBask", "400 44px MBaskR"].map((f) => document.fonts.load(f)));
      window.__film = {{ film, draw: (t) => {{ lastT = -1; draw(t); }} }};
      window.__hf = window.__hf || {{}};
      window.__hf.buildReady = window.__hf.buildReady || {{}};
      window.__hf.buildReady.world = fonts.then(() => {{ ready = true; lastT = -1; draw(curT); }});
      window.addEventListener("hf-seek", (e) => draw(e.detail.time));
      const tl = gsap.timeline({{ paused: true }});
      const clock = {{ t: 0 }};
      tl.to(clock, {{ t: DUR, duration: DUR, ease: "none", onUpdate: () => draw(clock.t) }}, 0);
      window.__timelines["world"] = tl;
    }})();
  </script>
</template>
"""
    open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(index)
    os.makedirs(os.path.join(ROOT, "compositions"), exist_ok=True)
    open(os.path.join(ROOT, "compositions", "world.html"), "w", encoding="utf-8").write(world)
    print("built", CFG)


if __name__ == "__main__":
    main()

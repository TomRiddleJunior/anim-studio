"""Build the retro-desktop project from the voice-over (after engine/audio/tts.py has written vo/data/vo.json + vo/audio/vo.wav):

  assets/lib/vo-data.js   window.VO = {dur, lines: {id: {s, e, words: [[w, s, e], ...]}}, env: [mouth 0..1 per frame at 30 fps],
                          caps: [{s, e, words: [[w, s, e], ...]}]}  (caption chunks: 1-4 words, <= 22 characters, a break
                          after , . ? ! : ; the source's karaoke band: the spoken word sits in a navy block)
  index.html, compositions/world.html   (1080 x 1920, 30 fps, one canvas, the mix as one audio track)
  out/<name>.srt          sentence captions on word times (beside the render, so the QA counts words per minute)

usage: python -I tools/build.py
"""
import json
import os
import re

import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = os.path.basename(ROOT)
VO = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
DUR = round(VO["duration"], 2)
FPS = 30


def chunks(words):
    out, cur = [], []
    for k, w in enumerate(words):
        cur.append(w)
        txt = " ".join(x["w"] for x in cur)
        nxt = words[k + 1]["w"] if k + 1 < len(words) else ""
        if re.search(r"[,.?!:;]$", w["w"]) or len(cur) >= 4 or len(txt) + 1 + len(nxt) > 22:
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    # never leave a lone short word at the end of a sentence when it fits with the previous chunk
    i = 1
    while i < len(out):
        prev = out[i - 1]
        if len(out[i]) == 1 and not re.search(r"[,.?!:;]$", prev[-1]["w"]) and len(" ".join(x["w"] for x in prev + out[i])) <= 24 and len(prev) < 4:
            out[i - 1] = prev + out[i]
            del out[i]
        else:
            i += 1
    return out


def mouth_env():
    a, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), always_2d=False)
    if a.ndim > 1:
        a = a.mean(axis=1)
    hop = sr // FPS
    n = int(DUR * FPS) + 1
    a = np.pad(a, (0, max(0, n * hop - len(a))))
    fr = a[: n * hop].reshape(n, hop)
    db = 20 * np.log10(np.sqrt((fr ** 2).mean(axis=1)) + 1e-9)
    k = np.clip((db + 42) / 26, 0, 1)
    # attack fast, release slower; plus a small jitter so the mouth flaps on syllables
    out, v = [], 0.0
    for x in k:
        v = x if x > v else v * 0.55 + x * 0.45
        out.append(v)
    return [round(float(x), 2) for x in out]


def srt_time(t):
    h, r = divmod(t, 3600)
    m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s % 1) * 1000)):03d}"


def main():
    lines = {}
    caps = []
    for l in VO["lines"]:
        ws = [[w["w"], round(w["start"], 3), round(w["end"], 3)] for w in l["words"]]
        lines[l["id"]] = {"s": l["start"], "e": l["end"], "text": l["text"], "words": ws}
        for c in chunks(l["words"]):
            caps.append({"s": round(c[0]["start"] - 0.06, 3), "e": round(c[-1]["end"], 3), "words": [[w["w"], round(w["start"], 3), round(w["end"], 3)] for w in c]})
    # a chunk stays up until the next one starts (or 0.45 s after its last word when there is a pause)
    for i, c in enumerate(caps):
        nxt = caps[i + 1]["s"] if i + 1 < len(caps) else DUR
        c["e"] = round(min(nxt, c["e"] + 0.45) if nxt - c["e"] > 0.45 else nxt, 3)
    data = {"dur": DUR, "lines": lines, "env": mouth_env(), "caps": caps}
    lib = os.path.join(ROOT, "assets", "lib")
    os.makedirs(lib, exist_ok=True)
    open(os.path.join(lib, "vo-data.js"), "w", encoding="utf-8").write("window.VO = " + json.dumps(data, separators=(",", ":")) + ";\n")

    os.makedirs(os.path.join(ROOT, "out"), exist_ok=True)
    with open(os.path.join(ROOT, "out", NAME + ".srt"), "w", encoding="utf-8") as f:
        k = 1
        for l in VO["lines"]:
            ws = l["words"]
            for j in range(0, len(ws), 9):
                ch = ws[j:j + 9]
                f.write(f"{k}\n{srt_time(ch[0]['start'])} --> {srt_time(ch[-1]['end'])}\n{' '.join(w['w'] for w in ch)}\n\n")
                k += 1

    index = f"""<!doctype html>
<html lang="en" data-size="1080x1920">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <script src="assets/lib/retro-kit.js"></script>
    <script src="assets/lib/vo-data.js"></script>
    <script src="assets/lib/hash-data.js"></script>
    <script src="assets/lib/film.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #cac1a4; }}
      #root {{ position: relative; width: 100%; height: 100%; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="1080" data-height="1920">
      <div id="world" data-composition-id="world" data-composition-src="compositions/world.html" data-start="0" data-duration="{DUR}" data-track-index="0" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index: 1"></div>
      <audio id="mix" class="clip" src="assets/audio/final.m4a" data-start="0" data-duration="{DUR}" data-track-index="20" data-volume="1"></audio>
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
"""
    open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(index)
    world = f"""<template>
  <style>
    #root {{ position: absolute; inset: 0; overflow: hidden; background: #cac1a4; }}
    #world-canvas {{ position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; }}
  </style>
  <div id="root" data-composition-id="world" data-width="1080" data-height="1920">
    <canvas id="world-canvas" width="1080" height="1920" data-layout-allow-overflow></canvas>
  </div>
  <script>
    (function () {{
      const DUR = {DUR};
      const film = window.FILM_CREATE(document.getElementById("world-canvas"));
      let lastT = -1;
      function draw(t) {{
        t = Math.round(t * 10000) / 10000;
        if (t === lastT) return;
        lastT = t;
        film.draw(t);
      }}
      window.__film = {{ film, draw: (t) => {{ lastT = -1; draw(t); }} }};
      window.addEventListener("hf-seek", (e) => draw(e.detail.time));
      const tl = gsap.timeline({{ paused: true }});
      const clock = {{ t: 0 }};
      tl.to(clock, {{ t: DUR, duration: DUR, ease: "none", onUpdate: () => draw(clock.t) }}, 0);
      window.__timelines["world"] = tl;
      draw(0);
    }})();
  </script>
</template>
"""
    os.makedirs(os.path.join(ROOT, "compositions"), exist_ok=True)
    open(os.path.join(ROOT, "compositions", "world.html"), "w", encoding="utf-8").write(world)
    nw = sum(len(l["words"]) for l in VO["lines"])
    print(f"{NAME}: {DUR} s, {len(VO['lines'])} lines, {nw} words ({nw / DUR * 60:.1f} wpm), {len(caps)} caption chunks")


if __name__ == "__main__":
    main()

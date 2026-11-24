"""Shell scenes for build_film.py: globe, top bar, the opening (split-flap departures board -> whip to a cabin window
-> push through the window into space), the summary (flat-map unwrap + split-flap arrivals board), the end card, the
root index.html and the sound project. Always called from build_film.py."""
import json
import os
import shutil
import subprocess

GLYPHS = "ABCDEFGHIJKLMNOPRSTUVWXYZ"  # flaps spin letters only; numbers land whole (no invented digits on screen)


def flap_cells(prefix, text, n_cells, start, dt_k, flips, seed):
    """HTML cells + schedule rows [id, final, start, flips, seed] for one split-flap field"""
    text = text.ljust(n_cells)[:n_cells]
    html, sched = [], []
    for k, ch in enumerate(text):
        cid = f"{prefix}-{k}"
        html.append(f'<span class="fc" id="{cid}"><b></b><i></i></span>')
        spin = 0 if (ch == " " or ch.isdigit()) else flips + (k * 3 + seed) % 4
        sched.append([cid, ch, round(start + k * dt_k, 3), spin, (seed * 7 + k * 5) % len(GLYPHS)])
    return "".join(html), sched


FLAP_JS = """
      const GL = "%s", DT = 0.06;
      const cells = {};
      FL.forEach((f) => { const el = document.getElementById(f[0]); cells[f[0]] = { b: el.querySelector("b"), i: el.querySelector("i") }; });
      function flaps(t) {
        for (const [id, fin, st, n, sd] of FL) {
          const c = cells[id];
          let ch = " ", ph = -1;
          if (t >= st) {
            const u = (t - st) / DT, k = Math.floor(u);
            if (k >= n) ch = fin;
            else { ch = GL[(sd + k * 7) %% GL.length]; ph = u - k; }
          }
          if (c.b.textContent !== ch) c.b.textContent = ch;
          c.i.style.transform = ph >= 0 ? "scaleY(" + (1 - ph).toFixed(3) + ")" : "scaleY(0)";
        }
      }""" % GLYPHS

FLAP_CSS = """
    #root .fc { position: relative; display: inline-block; overflow: hidden; border-radius: 5px; text-align: center; color: #f4f1e8;
      background: linear-gradient(#2a2d33 0 49%, #08090b 49% 51%, #1f2227 51% 100%); box-shadow: 0 2px 3px rgba(0, 0, 0, 0.6); }
    #root .fc b { display: block; font: 700 1em/1 "Roboto Mono", monospace; }
    #root .fc i { position: absolute; left: 0; right: 0; top: 0; height: 50%; background: linear-gradient(#34373e, #23262b);
      transform-origin: 50% 100%; transform: scaleY(0); border-bottom: 1px solid #000; }
    #root .st .fc { color: #ffb020; }
"""


def write_shell(OPEN, ROOT, DUR, SCHED, ORDER, BOARD, LEDGER_WORDS, END_T, STAMP_END, BOOT_STAMP, HOT, w, ls, le, cue,
                PAPER_CSS, jag, stamp_html, CUES, STAMPS):
    comp = os.path.join(ROOT, "compositions")
    has_bed = os.path.exists(os.path.join(ROOT, "score", "audio", "bed.flac"))  # MiniMax-Music3 bed, else synthesized score
    F1 = SCHED["hormuz"]["F"]
    RISE = BOARD["rise"]
    CITY = {"hormuz": "STRAIT OF HORMUZ", "alaska": "JUNEAU, ALASKA", "israel": "JERUSALEM", "brazil": "BRASÍLIA",
            "serbia": "BELGRADE", "venezuela": "CARACAS"}
    SHORT = {"hormuz": "HORMUZ", "alaska": "JUNEAU", "israel": "JERUSALEM", "brazil": "BRASÍLIA", "serbia": "BELGRADE", "venezuela": "CARACAS"}
    STATUS = {"hormuz": "CLOSED", "alaska": "IN COURT", "israel": "DELAYED", "brazil": "DISPUTED", "serbia": "CONCEDED", "venezuela": "ARRIVED"}

    # ------------------------------------------------------------------ globe
    hot_js = json.dumps([dict(id=k, lat=v["lat"], lon=v["lon"], patch=v["patch"]) for k, v in HOT.items()])
    arcs = json.dumps([[ORDER[i], ORDER[i + 1]] for i in range(len(ORDER) - 1)])
    open(os.path.join(comp, "globe.html"), "w", encoding="utf-8").write(f"""<template>
  <style>
    #root {{ position: absolute; inset: 0; overflow: hidden; }}
    #globe-ground {{ position: absolute; inset: 0; background: radial-gradient(circle at 62% 50%, #0d2639 0%, #08192a 40%, #050f19 78%); }}
    #globe-canvas {{ position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }}
    #globe-vig {{ position: absolute; inset: 0; opacity: 0;
      background: radial-gradient(ellipse 72% 70% at 50% 50%, rgba(3, 10, 16, 0) 52%, rgba(3, 10, 16, 0.62) 100%); }}
  </style>
  <div id="root" data-composition-id="globe" data-width="1920" data-height="1080">
    <div id="globe-ground"></div>
    <canvas id="globe-canvas" width="1920" height="1080" data-layout-allow-overflow></canvas>
    <div id="globe-vig"></div>
  </div>
  <script>
    (function () {{
      const DUR = {DUR}, SHUT = 0.555 / 30;
      const canvas = document.getElementById("globe-canvas");
      const vig = document.getElementById("globe-vig");
      const g = window.EarthOSGlobe.create({{
        canvas, width: 1920, height: 1080,
        earth: "assets/img/earth-bluemarble-5400.jpg",
        dots: window.LAND_DOTS,
        hotspots: {hot_js},
        arcs: {arcs},
        colors: {{ dot: "#EAF6FF", core: "#0A1E2E", rim: "#96CDFF", accent: "#FF6B1A", arc: "#EAF6FF" }},
      }});
      let ready = false, lastT = -1, curT = 0;
      function draw(t) {{
        curT = t;
        t = Math.round(t * 10000) / 10000;
        if (!ready || t === lastT) return;
        lastT = t;
        const st = window.FILM.stateAt(t);
        // motion blur: how far the image travels during a 200-degree shutter decides the sub-frame count
        const a = window.FILM.stateAt(t - SHUT / 2), b = window.FILM.stateAt(t + SHUT / 2);
        const pa = window.FILM.project(a, st.lat, st.lon), pb = window.FILM.project(b, st.lat, st.lon);
        const m = Math.hypot(pa.x - pb.x, pa.y - pb.y) + 900 * Math.abs(Math.log(a.alt / b.alt)) + 900 * Math.abs((a.roll - b.roll) * Math.PI / 180);
        const n = Math.max(1, Math.min(24, Math.round(m / 7)));
        if (n < 2) g.render(st);
        else {{
          const subs = [];
          for (let k = 0; k < n; k++) subs.push(window.FILM.stateAt(t + (k / (n - 1) - 0.5) * SHUT));
          g.renderBlur(subs);
        }}
        vig.style.opacity = (st.patch ? 0.9 * st.patch.amt : 0).toFixed(3);
      }}
      window.__hf = window.__hf || {{}};
      window.__hf.buildReady = window.__hf.buildReady || {{}};
      window.__hf.buildReady.globe = g.ready.then(() => {{ ready = true; lastT = -1; draw(curT); }});
      window.addEventListener("hf-seek", (e) => draw(e.detail.time));
      const tl = gsap.timeline({{ paused: true }});
      const clock = {{ t: 0 }};
      tl.to(clock, {{ t: DUR, duration: DUR, ease: "none", onUpdate: () => draw(clock.t) }}, 0);
      window.__timelines["globe"] = tl;
    }})();
  </script>
</template>
""")

    # ------------------------------------------------------------------ top bar (flight info) + imagery credit
    hud_dur = round(RISE - F1, 3)
    digits = "".join(f"<span>{i + 1}</span>" for i in range(6))
    rolls = 'tl.set("#hud-roll span:not(:first-child)", { opacity: 0 }, 0);\n      ' + "\n      ".join(
        f'tl.to("#hud-roll", {{ y: {-40 * i}, duration: 0.26, ease: "power3.out" }}, {SCHED[tk]["F"] - F1 + 0.3:.3f});\n      '
        f'tl.to("#hud-roll span:nth-child({i})", {{ opacity: 0, duration: 0.2 }}, {SCHED[tk]["F"] - F1 + 0.3:.3f});\n      '
        f'tl.to("#hud-roll span:nth-child({i + 1})", {{ opacity: 1, duration: 0.2 }}, {SCHED[tk]["F"] - F1 + 0.3:.3f});'
        for i, tk in enumerate(ORDER) if i > 0)
    open(os.path.join(comp, "hud.html"), "w", encoding="utf-8").write(f"""<template>
  <style>
    #root {{ position: absolute; inset: 0; overflow: hidden; }}
    #root .bar {{ position: absolute; left: 0; right: 0; top: 0; height: 72px; display: flex; align-items: center;
      justify-content: space-between; padding: 0 64px; background: linear-gradient(rgba(5, 15, 25, 0.86), rgba(5, 15, 25, 0.62));
      border-bottom: 1.5px solid rgba(234, 246, 255, 0.16); font: 400 28px/40px "IBM Plex Mono", monospace; letter-spacing: 0.05em; color: #9fb8cc; }}
    #root .bar b {{ font-weight: 700; color: #eaf6ff; letter-spacing: 0.12em; }}
    #root .cnt {{ display: flex; align-items: center; gap: 12px; }}
    #root .dig {{ display: inline-block; height: 40px; overflow: hidden; color: #ffb020; font-weight: 700; }}
    #root .dig-roll {{ display: flex; flex-direction: column; }}
    #root .dig-roll span {{ display: block; height: 40px; }}
  </style>
  <div id="root" data-composition-id="hud" data-width="1920" data-height="1080">
    <div class="bar" id="hud-bar"><span><b>HOLDING PATTERN</b> · the week in world news · 28 Oct 2026</span>
      <span class="cnt">STOP <span class="dig" data-layout-allow-overflow><span class="dig-roll" id="hud-roll">{digits}</span></span> OF 6</span></div>
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
      tl.fromTo("#hud-bar", {{ opacity: 0, y: -24 }}, {{ opacity: 1, y: 0, duration: 0.45, ease: "expo.out" }}, 0.1);
      {rolls}
      tl.to("#hud-bar", {{ opacity: 0, y: -24, duration: 0.3, ease: "power2.in" }}, {hud_dur - 0.35:.3f});
      window.__timelines["hud"] = tl;
    }})();
  </script>
</template>
""")
    open(os.path.join(comp, "credit.html"), "w", encoding="utf-8").write("""<template>
  <style>
    #root { position: absolute; inset: 0; overflow: hidden; }
    #root .cr { position: absolute; right: 40px; bottom: 26px; font: 400 22px/28px "IBM Plex Mono", monospace; color: rgba(234, 246, 255, 0.7);
      letter-spacing: 0.03em; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8); }
  </style>
  <div id="root" data-composition-id="credit" data-width="1920" data-height="1080">
    <div class="cr" id="cr-t" data-layout-ignore>Earth imagery: NASA Earth Observatory (Blue Marble)</div>
  </div>
  <script>
    (function () {
      const tl = gsap.timeline({ paused: true });
      tl.fromTo("#cr-t", { opacity: 0 }, { opacity: 1, duration: 0.6 }, %s);
      window.__timelines["credit"] = tl;
    })();
  </script>
</template>
""" % round(OPEN["board_out"] + 0.6, 3))

    # ------------------------------------------------------------------ opening: departures board -> cabin window
    b0, p0, p1 = OPEN["board_out"], OPEN["push0"], OPEN["push1"]
    odur = round(p1 + 0.15, 3)
    d0 = w("o1", "good") - 0.1
    s0 = w("o2", "none") - 0.05
    rows_html, FL = "", []
    for i, tk in enumerate(ORDER):
        hn, sn = flap_cells(f"dn{i}", f"0{i + 1}", 2, w("o2", "six") + i * 0.09, 0.0, 0, i)
        hd, sd = flap_cells(f"dd{i}", CITY[tk], 16, d0 + i * 0.45 + 0.08, 0.03, 4, i + 3)
        hs, ss = flap_cells(f"ds{i}", STATUS[tk], 8, s0 + i * 0.14, 0.03, 5, i + 11)
        FL += sn + sd + ss
        rows_html += f'<div class="dep-row" style="top:{258 + i * 118}px;"><span class="c-n">{hn}</span><span class="c-d">{hd}</span><span class="c-s st">{hs}</span></div>'
        for k in range(4):
            cue(d0 + i * 0.45 + 0.08 + k * 0.11, "click", 0.14, 1.1 + 0.07 * ((i + k) % 3))
        for k in range(3):
            cue(s0 + i * 0.14 + k * 0.1, "click", 0.15, 1.25 + 0.06 * ((i + k) % 3))
    cue(0.12, "ding", 0.45, 1.26)
    cue(0.45, "ding", 0.45, 1.0)
    cue(b0 + 0.02, "swoosh", 0.5, 1.0)
    cue(b0 + 0.55, "ding", 0.38, 1.5)
    cue(p0 + 0.35, "whoosh", 0.55, 0.85)
    seat_svg = ('<svg viewBox="0 0 64 64" width="64" height="64"><circle cx="32" cy="12" r="7"/><path d="M22 24h20l4 22H18z"/>'
                '<path d="M14 40h36v6H14z"/><path d="M24 46h5v12h-5zM35 46h5v12h-5z"/></svg>')
    open(os.path.join(comp, "opening.html"), "w", encoding="utf-8").write(f"""<template>
  <style>
    #root {{ position: absolute; inset: 0; overflow: hidden; }}
    {FLAP_CSS}
    #root .board {{ position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 30%, #1a1d22 0%, #0b0d10 70%); }}
    #root .dep-h {{ position: absolute; left: 157px; right: 157px; top: 86px; display: flex; align-items: baseline; justify-content: space-between;
      border-bottom: 2px solid #2c3036; padding-bottom: 18px; }}
    #root .dep-t {{ font: 900 72px/1 "Inter", sans-serif; letter-spacing: 0.06em; color: #f4f1e8; display: flex; align-items: center; gap: 22px; }}
    #root .dep-t svg {{ fill: #ffb020; }}
    #root .dep-r {{ font: 500 30px/36px "IBM Plex Mono", monospace; letter-spacing: 0.08em; color: #9fb8cc; white-space: nowrap; }}
    #root .dep-r b {{ color: #f4f1e8; font-weight: 700; }}
    #root .dep-cols {{ position: absolute; left: 157px; top: 204px; font: 600 28px/32px "IBM Plex Mono", monospace; letter-spacing: 0.24em; color: #ffb020; }}
    #root .dep-cols span {{ position: absolute; white-space: nowrap; }}
    #root .dep-row {{ position: absolute; left: 157px; height: 84px; }}
    #root .dep-row > span {{ position: absolute; top: 0; display: flex; gap: 5px; }}
    #root .dep-row .fc {{ width: 54px; height: 84px; }}
    #root .dep-row .fc b {{ font-size: 60px; line-height: 84px; }}
    #root .c-n {{ left: 0; }}
    #root .c-d {{ left: 154px; }}
    #root .c-s {{ left: 1134px; }}
    #root .wall {{ position: absolute; inset: 0; transform-origin: 960px 560px; }}
    #root .wall-bg {{ position: absolute; inset: 0; background-color: #d9d3c8;
      background-image: url(assets/img/paper-grain.jpg), linear-gradient(90deg, #bdb6aa 0%, #ddd8ce 22%, #e6e1d8 50%, #d8d2c7 78%, #b8b1a5 100%);
      background-size: 900px, 100% 100%; background-blend-mode: multiply;
      -webkit-mask-image: url(assets/img/window-mask.png); mask-image: url(assets/img/window-mask.png);
      -webkit-mask-size: 1920px 1080px; mask-size: 1920px 1080px; }}
    #root .rim {{ position: absolute; left: 700px; top: 180px; width: 520px; height: 760px; border-radius: 260px;
      box-shadow: inset 0 0 0 14px #ece7dd, inset 0 0 0 17px rgba(0, 0, 0, 0.22), inset 0 14px 34px 22px rgba(0, 0, 0, 0.42),
        0 0 0 30px #d6d0c4, 0 0 0 32px rgba(0, 0, 0, 0.14), 0 22px 46px 34px rgba(0, 0, 0, 0.2); }}
    #root .sign {{ position: absolute; left: 860px; top: 52px; width: 200px; height: 96px; border-radius: 14px; background: #2a2b2e;
      box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255, 255, 255, 0.4); display: grid; place-items: center; }}
    #root .sign svg {{ fill: #45474c; }}
    #root .sign-on svg {{ fill: #ffb020; filter: drop-shadow(0 0 10px rgba(255, 176, 32, 0.8)); }}
    #root .sign-on {{ position: absolute; inset: 0; display: grid; place-items: center; opacity: 0; }}
  </style>
  <div id="root" data-composition-id="opening" data-width="1920" data-height="1080">
    <div class="wall" id="op-wall" data-layout-allow-overflow>
      <div class="wall-bg"></div>
      <div class="rim"></div>
      <div class="sign">{seat_svg}<div class="sign-on" id="op-sign">{seat_svg}</div></div>
    </div>
    <div class="board" id="op-board" data-layout-allow-overflow>
      <div class="dep-h"><div class="dep-t"><svg viewBox="0 0 64 64" width="64" height="64"><path d="M58 28 36 26 24 6h-6l7 20-14 1-5-7H2l4 12-4 12h4l5-7 14 1-7 20h6l12-20 22-2c3 0 4-2 4-4s-1-4-4-4z"/></svg>DEPARTURES</div>
        <div class="dep-r"><b>HOLDING PATTERN</b> · 28 OCT 2026</div></div>
      <div class="dep-cols"><span style="left:0">STOP</span><span style="left:154px">DESTINATION</span><span style="left:1134px">STATUS</span></div>
      {rows_html}
    </div>
  </div>
  <script>
    (function () {{
      const FL = {json.dumps(FL, ensure_ascii=False)};
      {FLAP_JS}
      const tl = gsap.timeline({{ paused: true }});
            // whip from the board to the cabin window (the planet outside barely moves: it is far away)
      tl.to("#op-board", {{ x: -1920, duration: 0.46, ease: "expo.inOut" }}, {b0:.3f});
      tl.to("#op-board", {{ filter: "blur(16px)", duration: 0.23, ease: "power2.in" }}, {b0:.3f});
      tl.fromTo("#op-wall", {{ x: 1920, filter: "blur(16px)" }}, {{ x: 0, duration: 0.46, ease: "expo.inOut" }}, {b0:.3f});
      tl.to("#op-wall", {{ filter: "blur(0px)", duration: 0.23, ease: "power2.out" }}, {b0 + 0.23:.3f});
      tl.fromTo("#op-sign", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.08 }}, {b0 + 0.55:.3f});
      // push through the window into space
      tl.to("#op-wall", {{ scale: 6.5, duration: {p1 - p0:.3f}, ease: "power3.in" }}, {p0:.3f});
      tl.to("#op-wall", {{ opacity: 0, duration: 0.3, ease: "power1.in" }}, {p1 - 0.3:.3f});
      const clock = {{ t: 0 }};
      tl.to(clock, {{ t: {odur}, duration: {odur}, ease: "none", onUpdate: () => flaps(clock.t) }}, 0);
      flaps(0);
      window.__timelines["opening"] = tl;
    }})();
  </script>
</template>
""")

    # ------------------------------------------------------------------ summary: arrivals board + flat-map labels
    bstart = round(RISE + 0.3, 3)
    bdur2 = round(END_T + 0.45 - bstart, 3)
    a0 = bstart + 0.75
    arv_html, AF = "", []
    for i, tk in enumerate(ORDER):
        hn, sn = flap_cells(f"an{i}", f"0{i + 1}", 2, a0 - bstart + i * 0.12, 0.0, 0, i)
        hc, sc = flap_cells(f"ac{i}", SHORT[tk], 9, a0 - bstart + i * 0.12 + 0.05, 0.025, 3, i + 5)
        word = dict(LEDGER_WORDS)[tk]
        ts = w("r2", word) - 0.28 - bstart
        hs, ss = flap_cells(f"as{i}", STATUS[tk], 8, ts, 0.025, 4, i + 17)
        AF += sn + sc + ss
        arv_html += f'<div class="arv-row" style="top:{132 + i * 72}px;"><span class="c-n">{hn}</span><span class="c-c">{hc}</span><span class="c-s st">{hs}</span></div>'
        for k in range(3):
            cue(a0 + i * 0.12 + 0.05 + k * 0.08, "click", 0.12, 1.2 + 0.05 * k)
        for k in range(3):
            cue(ts + bstart + k * 0.08, "click", 0.18, 1.3 + 0.06 * k)
        cue(w("r2", word) + 0.05, "tick", 0.3, 1.1)
    labels = ""
    offs = {"hormuz": (16, 6), "alaska": (-20, -46), "israel": (-62, 14), "brazil": (16, 4), "serbia": (-30, -48), "venezuela": (-62, -18)}
    for i, tk in enumerate(ORDER):
        labels += f'<div class="mlab" id="ml-{tk}" data-lat="{HOT[tk]["lat"]}" data-lon="{HOT[tk]["lon"]}" data-ox="{offs[tk][0]}" data-oy="{offs[tk][1]}">0{i + 1}</div>'
    flash = "".join(f'tl.fromTo("#ml-{tk}", {{ color: "#ffb020" }}, {{ color: "#eaf6ff", duration: 0.8, ease: "power2.out", immediateRender: false }}, {w("r2", dict(LEDGER_WORDS)[tk]) - bstart:.3f});\n      '
                    for tk in ORDER)
    open(os.path.join(comp, "board.html"), "w", encoding="utf-8").write(f"""<template>
  <style>
    #root {{ position: absolute; inset: 0; overflow: hidden; }}
    {FLAP_CSS}
    #root .arv {{ position: absolute; left: 50px; top: 236px; width: 640px; height: 600px; border-radius: 12px;
      background: radial-gradient(ellipse at 50% 20%, #1a1d22 0%, #0b0d10 80%); box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55); }}
    #root .arv-h {{ position: absolute; left: 28px; right: 28px; top: 24px; display: flex; align-items: baseline; justify-content: space-between;
      border-bottom: 2px solid #2c3036; padding-bottom: 12px; }}
    #root .arv-t {{ font: 900 46px/1 "Inter", sans-serif; letter-spacing: 0.06em; color: #f4f1e8; }}
    #root .arv-d {{ font: 500 28px/32px "IBM Plex Mono", monospace; letter-spacing: 0.06em; color: #9fb8cc; }}
    #root .arv-row {{ position: absolute; left: 28px; height: 46px; }}
    #root .arv-row > span {{ position: absolute; top: 0; display: flex; gap: 3px; }}
    #root .arv-row .fc {{ width: 26px; height: 46px; }}
    #root .arv-row .fc b {{ font-size: 30px; line-height: 46px; }}
    #root .arv .c-n {{ left: 0; }}
    #root .arv .c-c {{ left: 76px; }}
    #root .arv .c-s {{ left: 362px; }}
    #root .mlab {{ position: absolute; left: 0; top: 0; font: 700 30px/34px "IBM Plex Mono", monospace; color: #eaf6ff; letter-spacing: 0.04em;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9); opacity: 0; }}
  </style>
  <div id="root" data-composition-id="board" data-width="1920" data-height="1080">
    <div class="arv" id="arv" data-layout-allow-overflow>
      <div class="arv-h"><div class="arv-t">ARRIVALS</div><div class="arv-d">28 OCT 2026</div></div>
      {arv_html}
    </div>
    {labels}
  </div>
  <script>
    (function () {{
      const START = {bstart}, DUR = {bdur2}, FLAT1 = {BOARD["flat1"]};
      const FL = {json.dumps(AF, ensure_ascii=False)};
      {FLAP_JS}
      const tl = gsap.timeline({{ paused: true }});
      tl.fromTo("#arv", {{ x: -720, filter: "blur(14px)" }}, {{ x: 0, filter: "blur(0px)", duration: 0.5, ease: "expo.out" }}, 0.45);
      {flash}tl.to("#arv", {{ x: -760, filter: "blur(14px)", duration: 0.34, ease: "power3.in" }}, {END_T - bstart:.3f});
      // map labels follow the flat-map pings (same plane the globe kit unwraps to: x = 1.003, y = lat, z = -lon)
      const labs = [...document.querySelectorAll("#root .mlab")].filter((el) => el.closest('[data-composition-id="board"]'));
      function place(t) {{
        const c = window.FILM.cameraAt(t);
        const zc = c.alt - 0.003;
        const vis = window.FILM.sstep(FLAT1 - 0.2, FLAT1 + 0.4, t);
        labs.forEach((el) => {{
          const lat = +el.dataset.lat * Math.PI / 180, lon = +el.dataset.lon * Math.PI / 180;
          const x = 960 + c.ox + window.FILM.PXS * lon / zc + (+el.dataset.ox);
          const y = 540 + c.oy - window.FILM.PXS * lat / zc + (+el.dataset.oy);
          el.style.transform = "translate(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px)";
          el.style.opacity = vis.toFixed(3);
        }});
      }}
      const clock = {{ t: 0 }};
      tl.to(clock, {{ t: DUR, duration: DUR, ease: "none", onUpdate: () => {{ place(START + clock.t); flaps(clock.t); }} }}, 0);
      flaps(0);
      window.__timelines["board"] = tl;
    }})();
  </script>
</template>
""")
    cue(RISE + 0.1, "woosh_low", 0.55)
    cue(BOARD["flat0"], "riser", 0.4)
    cue(BOARD["flat1"] - 0.05, "impact", 0.5)
    cue(bstart + 0.45, "swoosh", 0.45)

    # ------------------------------------------------------------------ end card
    estart = END_T
    edur = round(DUR - estart, 3)
    thank = "Thank you for flying with us."
    e_js = f"""tl.fromTo("#en-k", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3 }}, 0.3);
      tl.fromTo("#en-l1", {{ opacity: 0, filter: "blur(8px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.2, ease: "power4.out" }}, {ls("e1") - estart:.3f});
      tl.fromTo("#en-big", {{ yPercent: 105 }}, {{ yPercent: 0, duration: 0.32, ease: "power3.out" }}, {w("e1", "november") - estart - 0.05:.3f});
      tl.fromTo("#en-thx", {{ clipPath: "inset(-20% 100% -20% 0%)" }}, {{ clipPath: "inset(-20% 0% -20% 0%)", duration: {len(thank) / 30:.3f}, ease: "steps({len(thank)})" }}, {ls("e2") - estart:.3f});
      tl.fromTo("#en-stamp", {{ opacity: 0, scale: 1.38 }}, {{ opacity: 0.93, scale: 1, duration: 0.07, ease: "power4.in" }}, {STAMP_END - estart - 0.07:.3f});
      tl.to("#en-stamp", {{ scale: 0.986, duration: 0.05 }}, {STAMP_END - estart:.3f});
      tl.to("#en-stamp", {{ scale: 1, duration: 0.09 }}, {STAMP_END - estart + 0.05:.3f});
      tl.fromTo("#en-stamp .ghost", {{ opacity: 0.32, scale: 1 }}, {{ opacity: 0, scale: 1.22, duration: 0.26 }}, {STAMP_END - estart:.3f});
      tl.fromTo("#en-src", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.5 }}, {STAMP_END - estart + 0.5:.3f});"""
    stamp = stamp_html("en-stamp", "HOLDING|PATTERN", 40, 396, 60, -6, "EXIT · 28 OCT 2026", "THE WEEK IN WORLD NEWS").replace('class="stamp"', 'class="stamp en-stamp"')
    open(os.path.join(comp, "end.html"), "w", encoding="utf-8").write(f"""<template>
  <style>{PAPER_CSS}
    #root .ec {{ position: absolute; left: 96px; top: 300px; width: 600px; }}
    #root .en-k {{ font: 400 28px/36px "IBM Plex Mono", monospace; letter-spacing: 0.04em; color: #9fb8cc; white-space: nowrap; }}
    #root .en-l1 {{ font: 700 50px/1.1 "Inter", sans-serif; color: #eaf6ff; margin-top: 18px; }}
    #root .en-mask {{ overflow: hidden; margin-top: 6px; }}
    #root .en-big {{ font: 900 190px/1 "Inter", sans-serif; letter-spacing: -0.03em; color: #eaf6ff; }}
    #root .en-thx {{ font: 400 32px/42px "IBM Plex Mono", monospace; color: #9fb8cc; margin-top: 26px; white-space: pre; }}
    #root .en-stamp {{ left: 40px; top: 396px; }}
    #root .en-src {{ position: absolute; left: 96px; bottom: 36px; width: 610px; font: 400 20px/26px "IBM Plex Mono", monospace; color: #9fb8cc; }}
  </style>
  <div id="root" data-composition-id="end" data-width="1920" data-height="1080">
    <div class="ec" data-layout-allow-overflow>
      <div class="en-k" id="en-k">ALL STOPS COMPLETE · 28 OCT 2026</div>
      <div class="en-l1" id="en-l1">Next departure:</div>
      <div class="en-mask"><div class="en-big" id="en-big">3 Nov</div></div>
      <div class="en-thx" id="en-thx" data-n="{len(thank)}">{thank}</div>
      {stamp}
    </div>
    <div class="en-src" id="en-src" data-layout-ignore>Sources: USNI News · US EIA · AP via WDBJ7 · CNN · NBC · NPR · Euronews · Al Jazeera · NPR via WGCU (9–27 Oct 2026). Headline screenshots cropped, never edited. {"Music: MiniMax-Music3." if has_bed else "Score and sound synthesized in code."}</div>
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
      {e_js}
      window.__timelines["end"] = tl;
    }})();
  </script>
</template>
""")
    cue(ls("e2"), "type", 0.3)
    cue(STAMP_END, "stamp", 0.8, 0.8)
    for s in STAMPS:
        if s != STAMP_END and not any(abs(s - (w("r2", wd) + 0.02)) < 0.01 for _, wd in LEDGER_WORDS):
            cue(s, "stamp", 0.75)

    # ------------------------------------------------------------------ root
    def host(cid, src, start, dur, z, track):
        return (f'      <div id="{cid}" data-composition-id="{cid}" data-composition-src="compositions/{src}.html" data-start="{start}" '
                f'data-duration="{dur}" data-track-index="{track}" data-track-kind="graphics" data-width="1920" data-height="1080" style="z-index: {z}"></div>')
    hosts = [host("globe", "globe", 0, DUR, 1, 0), host("credit", "credit", 0, DUR, 9, 1),
             host("opening", "opening", 0, odur, 7, 2), host("hud", "hud", F1, hud_dur, 6, 3)]
    for i, tk in enumerate(ORDER):
        S = SCHED[tk]
        hosts.append(host(f"stop-{tk}", f"stop-{tk}", S["F"], round(S["Q"] - S["F"] + 0.05, 3), 5, 4 + i))
    hosts.append(host("board", "board", bstart, bdur2, 5, 10))
    hosts.append(host("end", "end", estart, edur, 5, 11))
    fonts = "\n".join(
        f'      @font-face {{ font-family: "{fam}"; src: url("assets/fonts/{fn}") format("truetype"); font-weight: {wt}; font-style: {st}; font-display: block; }}'
        for fam, fn, wt, st in [("Oswald", "Oswald_wght_.ttf", "200 700", "normal"),
                                 ("Playfair Display", "PlayfairDisplay_wght_.ttf", "400 900", "normal"),
                                 ("Roboto Mono", "RobotoMono_wght_.ttf", "100 700", "normal"),
                                 ("Libre Baskerville", "LibreBaskerville_wght_.ttf", "400 700", "normal"),
                                 ("Libre Baskerville", "LibreBaskerville-Italic_wght_.ttf", "400 700", "italic")])
    open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <script src="assets/lib/three.global.js"></script>
    <script src="assets/data/land-dots.js"></script>
    <script src="assets/lib/earth-os-globe.js"></script>
    <script src="assets/lib/film-data.js"></script>
    <script src="assets/lib/film.js"></script>
    <script src="assets/lib/desk.js"></script>
    <style>
{fonts}
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #050f19; }}
      /* Name every family in a font-family declaration outside any <template>: the compiler only embeds these. */
      .font-inter {{ font-family: "Inter", sans-serif; }}
      .font-mono {{ font-family: "IBM Plex Mono", monospace; }}
      .font-oswald {{ font-family: "Oswald", sans-serif; }}
      .font-playfair {{ font-family: "Playfair Display", serif; }}
      .font-roboto-mono {{ font-family: "Roboto Mono", monospace; }}
      .font-baskerville {{ font-family: "Libre Baskerville", serif; }}
      #root {{ position: relative; width: 100%; height: 100%; font-family: "Inter", sans-serif; color: #eaf6ff; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="1920" data-height="1080">
{chr(10).join(hosts)}
      <audio id="mix" class="clip" src="assets/audio/final.m4a" data-start="0" data-duration="{DUR}" data-track-index="20" data-volume="1"></audio>
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
""")

    # ------------------------------------------------------------------ sound project
    sd = os.path.join(ROOT, "score")
    os.makedirs(os.path.join(sd, "data"), exist_ok=True)
    os.makedirs(os.path.join(sd, "audio"), exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "vo", "data", "vo.json"), os.path.join(sd, "data", "vo.json"))
    # a light cabin-PA colour on the captain: band-limited, a touch of presence, still fully intelligible
    ff = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(ROOT))), "explainer-styles", "engine", "node_modules", "ffmpeg-static", "ffmpeg.exe")
    if not os.path.exists(ff):
        ff = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"
    subprocess.run([ff, "-y", "-v", "error", "-i", os.path.join(ROOT, "vo", "audio", "vo.wav"), "-af",
                    "highpass=f=170,lowpass=f=7200,equalizer=f=2600:t=q:w=1.2:g=2.5", "-ar", "48000", "-c:a", "pcm_f32le",
                    os.path.join(sd, "audio", "vo.wav")], check=True)
    CUES.sort(key=lambda c: c["t"])
    json.dump({"duration": DUR, "sfx": CUES}, open(os.path.join(sd, "data", "cues.json"), "w"), indent=0)
    cfg = {"preset": "tech-glow", "bpm": 120, "key": 0,
           "sections": [{"t": 0, "energy": 1}, {"t": round(OPEN["board_out"], 2), "energy": 2}, {"t": round(F1, 2), "energy": 2},
                        {"t": round(RISE, 2), "energy": 3}, {"t": round(END_T, 2), "energy": 1}, {"t": round(STAMP_END + 0.3, 2), "energy": 0}],
           "end_hit": True, "music_under_voice_db": -16, "music_alone_db": -8, "sfx_db": -4, "lufs": -14, "reverb": 0.3}
    if has_bed:  # MiniMax-Music3 instrumental, chosen by tools/gen_music.py + a listen/measure pass
        cfg.update({"music_file": "audio/bed.flac", "music_offset": round(OPEN["board_out"], 2), "music_trim": 0.0, "music_under_voice_db": -15})
    json.dump(cfg, open(os.path.join(sd, "sound.json"), "w"), indent=1)

"""Shell scenes for build_v2.py: globe, HUD, boot, board (flat-map summary), end card, the root index.html and
the sound cue list. Separate file only to keep build_v2.py readable; it is always called from there."""
import json
import os
import shutil


def write_shell(ROOT, DUR, SCHED, ORDER, BOARD, LEDGER_WORDS, END_T, STAMP_END, BOOT_STAMP, HOT, w, ls, le, cue,
                PAPER_CSS, jag, stamp_html, CUES, STAMPS):
    comp = os.path.join(ROOT, "compositions")
    F1 = SCHED["hormuz"]["F"]
    RISE = BOARD["rise"]

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
      window.__earthOS = {{ g, draw }};
      const tl = gsap.timeline({{ paused: true }});
      const clock = {{ t: 0 }};
      tl.to(clock, {{ t: DUR, duration: DUR, ease: "none", onUpdate: () => draw(clock.t) }}, 0);
      window.__timelines["globe"] = tl;
    }})();
  </script>
</template>
""")

    # ------------------------------------------------------------------ HUD (top bar + imagery credit)
    hud_dur = round(RISE - F1, 3)
    digits = "".join(f"<span>{i + 1}</span>" for i in range(6))
    # non-current digits are faded out (a rolled-away digit still counts as text for the contrast check)
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
    #root .bar b {{ font-weight: 700; color: #eaf6ff; }}
    #root .cnt {{ display: flex; align-items: center; gap: 12px; }}
    #root .dig {{ display: inline-block; height: 40px; overflow: hidden; color: #ff6b1a; font-weight: 700; }}
    #root .dig-roll {{ display: flex; flex-direction: column; }}
    #root .dig-roll span {{ display: block; height: 40px; }}
  </style>
  <div id="root" data-composition-id="hud" data-width="1920" data-height="1080">
    <div class="bar" id="hud-bar"><span><b>EARTH OS 26.10</b> · weekly patch notes · 28 Oct 2026</span>
      <span class="cnt">TICKET <span class="dig" data-layout-allow-overflow><span class="dig-roll" id="hud-roll">{digits}</span></span> OF 6</span></div>
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

    # ------------------------------------------------------------------ credit (whole film, small print)
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
      tl.fromTo("#cr-t", { opacity: 0 }, { opacity: 1, duration: 0.6 }, 1.0);
      window.__timelines["credit"] = tl;
    })();
  </script>
</template>
""")

    # ------------------------------------------------------------------ boot
    bdur = round(F1 + 0.3, 3)
    t1, t2, t3 = w("boot1", "earth"), w("boot2", "weekly"), w("boot3", "six")
    title = "EARTH OS 26.10"
    sub = "weekly patch notes · 28 Oct 2026"
    open(os.path.join(comp, "boot.html"), "w", encoding="utf-8").write(f"""<template>
  <style>{PAPER_CSS}
    #root .boot {{ position: absolute; left: 120px; top: 330px; width: 820px; }}
    #root .b1 {{ font: 900 96px/1 "Inter", sans-serif; letter-spacing: -0.02em; color: #eaf6ff; white-space: pre; }}
    #root .b2 {{ font: 400 34px/44px "IBM Plex Mono", monospace; letter-spacing: 0.04em; color: #9fb8cc; margin-top: 22px; white-space: pre; }}
    #root .b3 {{ font: 700 58px/1.1 "Inter", sans-serif; color: #eaf6ff; margin-top: 34px; }}
    #root .b3 em {{ font-style: normal; color: #ff6b1a; }}
    #root .bstamp {{ left: 300px; top: 300px; }}
  </style>
  <div id="root" data-composition-id="boot" data-width="1920" data-height="1080">
    <div class="boot" id="boot-col" data-layout-allow-overflow>
      <div class="b1" id="boot-l1" data-n="{len(title)}">{title}</div>
      <div class="b2" id="boot-l2" data-n="{len(sub)}">{sub}</div>
      <div class="b3" id="boot-l3"><em>6</em> open tickets</div>
      {stamp_html("boot-stamp", "6 OPEN", 300, 300, 86, -8).replace('class="stamp"', 'class="stamp bstamp"')}
    </div>
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
      const type = (sel, t, n, cps) => tl.fromTo(sel, {{ clipPath: "inset(-20% 100% -20% 0%)" }}, {{ clipPath: "inset(-20% 0% -20% 0%)", duration: n / cps, ease: "steps(" + n + ")" }}, t);
      type("#boot-l1", {t1:.3f}, {len(title)}, 18);
      type("#boot-l2", {t2:.3f}, {len(sub)}, 34);
      tl.fromTo("#boot-l3", {{ opacity: 0, filter: "blur(8px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.18, ease: "power4.out" }}, {t3:.3f});
      tl.fromTo("#boot-stamp", {{ opacity: 0, scale: 1.38 }}, {{ opacity: 0.93, scale: 1, duration: 0.07, ease: "power4.in" }}, {BOOT_STAMP - 0.07:.3f});
      tl.to("#boot-stamp", {{ scale: 0.986, duration: 0.05 }}, {BOOT_STAMP:.3f});
      tl.to("#boot-stamp", {{ scale: 1, duration: 0.09 }}, {BOOT_STAMP + 0.05:.3f});
      tl.fromTo("#boot-stamp .ghost", {{ opacity: 0.32, scale: 1 }}, {{ opacity: 0, scale: 1.22, duration: 0.26 }}, {BOOT_STAMP:.3f});
      tl.to("#boot-col", {{ opacity: 0, filter: "blur(10px)", x: -40, duration: 0.3, ease: "power2.in" }}, {F1 - 0.2:.3f});
      window.__timelines["boot"] = tl;
    }})();
  </script>
</template>
""")
    for t in (t1, t2, t3):
        cue(t, "type", 0.3)
    cue(BOOT_STAMP, "stamp", 0.75)

    # ------------------------------------------------------------------ board: ledger + flat-map labels
    bstart = round(RISE + 0.3, 3)
    bdur2 = round(END_T + 0.4 - bstart, 3)
    names = {"hormuz": "Hormuz", "alaska": "Alaska", "israel": "Israel", "brazil": "Brazil", "serbia": "Serbia", "venezuela": "Venezuela"}
    words = {"hormuz": "CLOSED", "alaska": "FILED", "israel": "LOADING", "brazil": "DISPUTED", "serbia": "CONCEDED", "venezuela": "HOME"}
    LW, LH = 560, 800
    rows = ""
    for i, tk in enumerate(ORDER):
        y = 196 + i * 96
        rows += (f'<div class="lg-row" id="lg-r{i}" style="top:{y}px;"><span class="lg-id">#00{i + 1}</span>{names[tk]}</div>'
                 + stamp_html(f"lg-s{i}", words[tk], 318, y - 12, 31, -7 + (i % 3) * 2.5).replace('class="stamp"', 'class="stamp lg-st"'))
    labels = ""
    offs = {"hormuz": (16, 6), "alaska": (-20, -46), "israel": (-78, 14), "brazil": (16, 4), "serbia": (-30, -48), "venezuela": (-82, -18)}
    for i, tk in enumerate(ORDER):
        labels += f'<div class="mlab" id="ml-{tk}" data-lat="{HOT[tk]["lat"]}" data-lon="{HOT[tk]["lon"]}" data-ox="{offs[tk][0]}" data-oy="{offs[tk][1]}">00{i + 1}</div>'
    stamp_js = ""
    for i, (tk, word) in enumerate(LEDGER_WORDS):
        t = w("r2", word) + 0.02 - bstart
        stamp_js += (f'tl.fromTo("#lg-s{i}", {{ opacity: 0, scale: 1.4 }}, {{ opacity: 0.93, scale: 1, duration: 0.07, ease: "power4.in" }}, {t - 0.07:.3f});\n      '
                     f'tl.fromTo("#lg-s{i} .ghost", {{ opacity: 0.3, scale: 1 }}, {{ opacity: 0, scale: 1.25, duration: 0.24 }}, {t:.3f});\n      '
                     f'tl.fromTo("#ml-{ORDER[i]}", {{ color: "#ff6b1a" }}, {{ color: "#eaf6ff", duration: 0.8, ease: "power2.out" }}, {t:.3f});\n      ')
        cue(t + bstart, "stamp", 0.55, 1.15 - 0.05 * i)
    row_js = "".join(f'tl.fromTo("#lg-r{i}", {{ opacity: 0, x: -14 }}, {{ opacity: 1, x: 0, duration: 0.3, ease: "expo.out" }}, {1.3 + i * 0.11:.3f});\n      ' for i in range(6))
    open(os.path.join(comp, "board.html"), "w", encoding="utf-8").write(f"""<template>
  <style>{PAPER_CSS}
    #root .ledger {{ position: absolute; left: 56px; top: 150px; width: {LW}px; height: {LH}px; }}
    #root .lg-h1 {{ position: absolute; left: 40px; top: 44px; font: 700 40px/46px "Libre Baskerville", serif; letter-spacing: 0.12em; color: #23211e; }}
    #root .lg-h2 {{ position: absolute; left: 40px; top: 102px; font: 600 24px/30px "Roboto Mono", monospace; letter-spacing: 0.08em; color: #6b665e; }}
    #root .lg-rule {{ position: absolute; left: 40px; right: 40px; top: 152px; height: 3px; background: #23211e; }}
    #root .lg-row {{ position: absolute; left: 40px; font: 700 32px/40px "Inter", sans-serif; color: #23211e; white-space: nowrap; }}
    #root .lg-id {{ display: inline-block; width: 92px; font: 600 26px/40px "Roboto Mono", monospace; color: #6b665e; }}
    #root .lg-st {{ mix-blend-mode: multiply; }}
    #root .lg-st .stamp-in {{ border-width: 4px; outline-width: 2px; outline-offset: -10px; padding: 10px 16px 6px; border-radius: 7px; }}
    #root .lg-foot {{ position: absolute; left: 40px; right: 40px; bottom: 34px; font: italic 400 24px/32px "Libre Baskerville", serif; color: #6b665e; }}
    #root .mlab {{ position: absolute; left: 0; top: 0; font: 700 30px/34px "IBM Plex Mono", monospace; color: #eaf6ff; letter-spacing: 0.04em;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9); opacity: 0; }}
  </style>
  <div id="root" data-composition-id="board" data-width="1920" data-height="1080">
    <div class="doc ledger" id="lg" data-layout-allow-overflow style="transform: none;">
      <div class="doc-in" id="lg-in"><div class="paper idx" style="--pc:#f2ede1; clip-path: {jag(LW, LH, 77, '')};">
        <div class="lg-h1">WEEKLY REPORT</div><div class="lg-h2">EARTH OS 26.10 · 28 OCT 2026</div><div class="lg-rule"></div>
        {rows}
        <div class="lg-foot" id="lg-foot">6 tickets · 1 closed by its users</div>
      </div></div>
    </div>
    {labels}
  </div>
  <script>
    (function () {{
      const START = {bstart}, DUR = {bdur2}, FLAT1 = {BOARD["flat1"]};
      const tl = gsap.timeline({{ paused: true }});
      tl.fromTo("#lg-in", {{ opacity: 0, scale: 1.12, rotation: 2.5, y: -20 }}, {{ opacity: 1, scale: 1, rotation: 0, y: 0, duration: 0.36, ease: "power3.out" }}, 1.0);
      {row_js}{stamp_js}tl.fromTo("#lg-foot", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3 }}, {le("r2") + 0.1 - bstart:.3f});
      tl.to("#lg-in", {{ opacity: 0, x: -120, filter: "blur(10px)", duration: 0.32, ease: "power3.in" }}, {END_T - bstart:.3f});
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
      tl.to(clock, {{ t: DUR, duration: DUR, ease: "none", onUpdate: () => place(START + clock.t) }}, 0);
      window.__timelines["board"] = tl;
    }})();
  </script>
</template>
""")
    cue(RISE + 0.1, "woosh_low", 0.55)
    cue(BOARD["flat0"], "riser", 0.4)
    cue(BOARD["flat1"] - 0.05, "impact", 0.5)
    cue(RISE + 1.32, "paper", 0.45)

    # ------------------------------------------------------------------ end card
    estart = END_T
    edur = round(DUR - estart, 3)
    thank = "Thank you for your patience."
    e_js = f"""tl.fromTo("#en-l1", {{ opacity: 0, filter: "blur(8px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.2, ease: "power4.out" }}, {ls("e1") - estart:.3f});
      tl.fromTo("#en-big", {{ yPercent: 105 }}, {{ yPercent: 0, duration: 0.32, ease: "power3.out" }}, {w("e1", "november") - estart - 0.05:.3f});
      tl.fromTo("#en-thx", {{ clipPath: "inset(-20% 100% -20% 0%)" }}, {{ clipPath: "inset(-20% 0% -20% 0%)", duration: {len(thank) / 30:.3f}, ease: "steps({len(thank)})" }}, {ls("e2") - estart:.3f});
      tl.fromTo("#en-stamp", {{ opacity: 0, scale: 1.38 }}, {{ opacity: 0.93, scale: 1, duration: 0.07, ease: "power4.in" }}, {STAMP_END - estart - 0.07:.3f});
      tl.to("#en-stamp", {{ scale: 0.986, duration: 0.05 }}, {STAMP_END - estart:.3f});
      tl.to("#en-stamp", {{ scale: 1, duration: 0.09 }}, {STAMP_END - estart + 0.05:.3f});
      tl.fromTo("#en-stamp .ghost", {{ opacity: 0.32, scale: 1 }}, {{ opacity: 0, scale: 1.22, duration: 0.26 }}, {STAMP_END - estart:.3f});
      tl.fromTo("#en-src", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.5 }}, {STAMP_END - estart + 0.5:.3f});"""
    open(os.path.join(comp, "end.html"), "w", encoding="utf-8").write(f"""<template>
  <style>{PAPER_CSS}
    #root .ec {{ position: absolute; left: 96px; top: 300px; width: 640px; }}
    #root .en-k {{ font: 400 28px/36px "IBM Plex Mono", monospace; letter-spacing: 0.02em; color: #9fb8cc; white-space: nowrap; }}
    #root .en-l1 {{ font: 700 50px/1.1 "Inter", sans-serif; color: #eaf6ff; margin-top: 18px; }}
    #root .en-mask {{ overflow: hidden; margin-top: 6px; }}
    #root .en-big {{ font: 900 190px/1 "Inter", sans-serif; letter-spacing: -0.03em; color: #eaf6ff; }}
    #root .en-thx {{ font: 400 32px/42px "IBM Plex Mono", monospace; color: #9fb8cc; margin-top: 26px; white-space: pre; }}
    #root .en-stamp {{ left: 70px; top: 420px; }}
    #root .en-src {{ position: absolute; left: 96px; bottom: 70px; width: 780px; font: 400 22px/30px "IBM Plex Mono", monospace; color: #9fb8cc; }}
  </style>
  <div id="root" data-composition-id="end" data-width="1920" data-height="1080">
    <div class="ec" data-layout-allow-overflow>
      <div class="en-k">EARTH OS 26.10 · END OF PATCH NOTES</div>
      <div class="en-l1" id="en-l1">Next scheduled update:</div>
      <div class="en-mask"><div class="en-big" id="en-big">3 Nov</div></div>
      <div class="en-thx" id="en-thx" data-n="{len(thank)}">{thank}</div>
      {stamp_html("en-stamp", "PENDING", 70, 420, 92, -8).replace('class="stamp"', 'class="stamp en-stamp"')}
    </div>
    <div class="en-src" id="en-src" data-layout-ignore>Sources: USNI News 9 Oct · US EIA 20 Oct · AP via WDBJ7 23 Oct · CNN, NBC 27 Oct · NPR 25 Oct · AP 26 Oct · Euronews, Al Jazeera 25 Oct · NPR via WGCU 25 Oct. Headlines are screenshots of the outlets' pages, cropped, never edited.</div>
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
        if s not in (BOOT_STAMP, STAMP_END) and not any(abs(s - (w("r2", wd) + 0.02)) < 0.01 for _, wd in LEDGER_WORDS):
            cue(s, "stamp", 0.75)

    # ------------------------------------------------------------------ root
    def host(cid, src, start, dur, z, track):
        return (f'      <div id="{cid}" data-composition-id="{cid}" data-composition-src="compositions/{src}.html" data-start="{start}" '
                f'data-duration="{dur}" data-track-index="{track}" data-track-kind="graphics" data-width="1920" data-height="1080" style="z-index: {z}"></div>')
    hosts = [host("globe", "globe", 0, DUR, 1, 0), host("credit", "credit", 0, DUR, 9, 1),
             host("boot", "boot", 0, bdur, 4, 2), host("hud", "hud", F1, hud_dur, 6, 3)]
    for i, tk in enumerate(ORDER):
        S = SCHED[tk]
        hosts.append(host(f"t-{tk}", f"t-{tk}", S["F"], round(S["Q"] - S["F"] + 0.05, 3), 5, 4 + i))
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
    <div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="1920" data-height="1080"
>
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
    shutil.copy2(os.path.join(ROOT, "vo", "audio", "vo.wav"), os.path.join(sd, "audio", "vo.wav"))
    CUES.sort(key=lambda c: c["t"])
    json.dump({"duration": DUR, "sfx": CUES}, open(os.path.join(sd, "data", "cues.json"), "w"), indent=0)
    json.dump({"preset": "tech-glow", "bpm": 120, "key": 0,
               "sections": [{"t": 0, "energy": 1}, {"t": round(F1, 2), "energy": 2}, {"t": round(RISE, 2), "energy": 3},
                            {"t": round(END_T, 2), "energy": 1}, {"t": round(STAMP_END + 0.3, 2), "energy": 0}],
               "end_hit": True, "music_under_voice_db": -16, "music_alone_db": -8, "sfx_db": -4, "lufs": -14, "reverb": 0.3},
              open(os.path.join(sd, "sound.json"), "w"), indent=1)

/* Holding Pattern — the paper layer of one stop.
 *
 * DESK.mount(cfg) pins the ticket's documents to the ground every frame (FILM.place) and returns helpers that add
 * the paper grammar to the scene's GSAP timeline: drop, type, count, bar, dots, box, highlight, strike, rise,
 * stamp, chip. Times passed to helpers are ROOT seconds (they come straight from the narration's word times);
 * the helpers convert them to the scene's local time.
 *
 *   cfg = { comp, start, dur, hot: {lat, lon},
 *           docs: [{id, lat, lon, w, h, rot}],          // outer element #id gets the ground transform
 *           thread: {doc, x, y} }                         // red thread from the ping to a pin on a document
 */
(function () {
  "use strict";
  function mount(cfg) {
    const F = window.FILM;
    const tl = gsap.timeline({ paused: true });
    const L = (t) => Math.max(0, t - cfg.start);
    const els = cfg.docs.map((d) => ({ d, el: document.getElementById(d.id) }));
    const thread = cfg.thread ? document.getElementById(cfg.comp + "-thread") : null;
    const threadDoc = cfg.thread ? cfg.docs.find((d) => d.id === cfg.thread.doc) : null;

    // motion blur for the paper, matched to the globe's accumulation blur: the ground under the screen centre is
    // projected at both ends of a 200-degree shutter; the paper layer is rotated onto that direction, blurred along
    // x by an SVG filter, and rotated back (zoom adds a little isotropic blur).
    const SHUT = 0.555 / 30;
    const rot = document.getElementById(cfg.comp + "-drot"), blur = document.getElementById(cfg.comp + "-dblur");
    const unrot = document.getElementById(cfg.comp + "-desk"), gb = document.getElementById(cfg.comp + "-mbg");
    function motion(t, st) {
      if (!rot) return;
      const a = F.stateAt(t - SHUT / 2), b = F.stateAt(t + SHUT / 2);
      const pa = F.project(a, st.lat, st.lon), pb = F.project(b, st.lat, st.lon);
      const vx = pb.x - pa.x, vy = pb.y - pa.y, m = Math.hypot(vx, vy);
      const z = 900 * Math.abs(Math.log(a.alt / b.alt)) + 900 * Math.abs(((a.roll - b.roll) * Math.PI) / 180);
      if (m < 3 && z < 3) {
        rot.style.transform = unrot.style.transform = "none";
        blur.style.filter = "none";
        return;
      }
      const th = (Math.atan2(vy, vx) * 180) / Math.PI;
      rot.style.transform = `rotate(${th.toFixed(2)}deg)`;
      unrot.style.transform = `rotate(${(-th).toFixed(2)}deg)`;
      gb.setAttribute("stdDeviation", `${(m / 2.6 + z / 9).toFixed(2)} ${(z / 9).toFixed(2)}`);
      blur.style.filter = `url(#${cfg.comp}-mb)`;
    }

    function update(t) {
      const st = F.stateAt(t);
      const b = F.basis(st);
      motion(t, st);
      let threadPin = null;
      els.forEach(({ d, el }) => {
        if (!el) return;
        const p = F.place(st, d, b);
        const vis = F.sstep(0.3, 0.46, p.k) * (p.z > 0 ? 1 : 0);
        el.style.opacity = vis.toFixed(3);
        el.style.visibility = vis > 0.001 ? "visible" : "hidden";
        el.style.transform = `translate(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px) rotate(${(p.a + (d.rot || 0)).toFixed(3)}deg) scale(${p.k.toFixed(4)}) translate(${(-d.w / 2).toFixed(1)}px, ${(-d.h / 2).toFixed(1)}px)`;
        if (threadDoc && d === threadDoc) {
          const a = ((p.a + (d.rot || 0)) * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
          const lx = (cfg.thread.x - d.w / 2) * p.k, ly = (cfg.thread.y - d.h / 2) * p.k;
          threadPin = { x: p.x + lx * c - ly * s, y: p.y + lx * s + ly * c, vis };
        }
      });
      if (thread && threadPin) {
        const h = F.project(st, cfg.hot.lat, cfg.hot.lon, 1.0025);
        const line = thread.querySelector("line");
        line.setAttribute("x1", h.x.toFixed(1)); line.setAttribute("y1", h.y.toFixed(1));
        line.setAttribute("x2", threadPin.x.toFixed(1)); line.setAttribute("y2", threadPin.y.toFixed(1));
        thread.style.opacity = (threadPin.vis * (thread.dataset.amt ? +thread.dataset.amt : 1)).toFixed(3);
      }
    }
    const clock = { t: 0 };
    tl.to(clock, { t: cfg.dur, duration: cfg.dur, ease: "none", onUpdate: () => update(cfg.start + clock.t) }, 0);
    update(cfg.start);

    const $ = (id) => (typeof id === "string" ? document.getElementById(id) : id);
    const api = {
      tl, L, update,
      // paper drops onto the ground: in from slightly above (bigger) and settles, 0.34 s
      drop(id, t, o = {}) {
        tl.fromTo($(id), { opacity: 0, scale: o.from || 1.16, rotation: o.spin || 2.4, y: -20 },
          { opacity: 1, scale: 1, rotation: 0, y: 0, duration: 0.34, ease: "power3.out" }, L(t));
      },
      // typewriter: a monospace line uncovered character by character (steps), cps characters a second
      type(id, t, cps = 28) {
        const el = $(id);
        const n = Math.max(1, (el.dataset.n ? +el.dataset.n : el.textContent.length));
        tl.fromTo(el, { clipPath: "inset(-20% 100% -20% 0%)" },
          { clipPath: "inset(-20% 0% -20% 0%)", duration: n / cps, ease: `steps(${n})` }, L(t));
        return t + n / cps;
      },
      // count-up that LANDS at `land` (the spoken number): appears at `from`, power3.out tail
      count(id, land, from, to, dur, fmt) {
        const el = $(id);
        const o = { v: from };
        const f = fmt || ((v) => Math.round(v).toString());
        el.textContent = f(from);
        tl.fromTo(o, { v: from }, { v: to, duration: dur, ease: "power3.out", onUpdate: () => (el.textContent = f(o.v)) }, L(land - dur * 0.82));
      },
      bar(id, land, dur = 1.2) {
        tl.fromTo($(id), { scaleX: 0 }, { scaleX: 1, duration: dur, ease: "power3.out" }, L(land - dur * 0.82));
      },
      dots(sel, t, dur, color) {
        const list = [...document.querySelectorAll(sel)];
        if (!list.length) return;
        tl.fromTo(list, { backgroundColor: "#d6cab6" }, { backgroundColor: color, duration: 0.12, ease: "power2.out",
          stagger: { each: dur / list.length } }, L(t));
      },
      box(id, t, dur = 0.38) {
        tl.fromTo($(id), { clipPath: "inset(-10% 100% -10% -2%)" }, { clipPath: "inset(-10% -2% -10% -2%)", duration: dur, ease: "power2.out" }, L(t));
      },
      highlight(id, t, dur = 0.32) {
        tl.fromTo($(id), { scaleX: 0 }, { scaleX: 1, duration: dur, ease: "none" }, L(t));
      },
      strike(id, t) {
        tl.fromTo($(id), { scaleX: 0 }, { scaleX: 1, duration: 0.22, ease: "power2.inOut" }, L(t));
      },
      rise(id, t, dur = 0.2) {
        tl.fromTo($(id), { yPercent: 105 }, { yPercent: 0, duration: dur, ease: "power3.out" }, L(t));
      },
      fade(id, t, dur = 0.14, to = 1) {
        tl.fromTo($(id), { opacity: 0 }, { opacity: to, duration: dur, ease: "power1.out" }, L(t));
      },
      // rubber stamp: 2-frame slam from 138 % with a ghost; the camera shake comes from FILM (same time list)
      stamp(id, t) {
        const el = $(id);
        tl.fromTo(el, { opacity: 0, scale: 1.38 }, { opacity: 0.93, scale: 1, duration: 0.07, ease: "power4.in" }, L(t) - 0.07);
        tl.to(el, { scale: 0.986, duration: 0.05, ease: "power1.out" }, L(t));
        tl.to(el, { scale: 1, duration: 0.09, ease: "power1.inOut" }, L(t) + 0.05);
        const g = el.querySelector(".ghost");
        if (g) tl.fromTo(g, { opacity: 0.32, scale: 1.0 }, { opacity: 0, scale: 1.22, duration: 0.26, ease: "power2.out" }, L(t));
      },
      // digital status chip: slot roll to row k with an orange flash (mirrors the paper stamp)
      chip(chipId, rollId, t, k, rowH = 44) {
        const rows = [...$(rollId).children];
        rows.forEach((r, i) => i !== 0 && tl.set(r, { opacity: 0 }, 0));
        tl.to(rows[k - 1], { opacity: 0, duration: 0.2 }, L(t));
        tl.fromTo(rows[k], { opacity: 0 }, { opacity: 1, duration: 0.2, immediateRender: false }, L(t));
        tl.to($(rollId), { y: -rowH * k, duration: 0.24, ease: "power3.out" }, L(t));
        tl.fromTo($(chipId), { backgroundColor: "#FFE1CC" }, { backgroundColor: "#FF6B1A", duration: 0.25, ease: "power2.out", immediateRender: false }, L(t));
      },
    };
    return api;
  }
  window.DESK = { mount };
})();

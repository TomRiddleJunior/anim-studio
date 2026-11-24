/* guardian-film.js — turns window.FILM (written by tools/timeline.py) into per-frame render state: the shot camera
 * (eased push/drift + a little hand-held), parallax and depth of field, the acting (breathing, nods, gestures, blinks,
 * head tilts, brows, smile, lip-sync from the voice envelope), the Guardian's voice glow and pulses, the clock, the
 * particles, the grade; then draws the plate (guardian-gl.js) and the overlay (guardian-overlay.js).
 * GFILM.create(glCanvas, overlayCanvas) -> { ready, render(t) }
 */
(function () {
  "use strict";
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const sm = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const EASE = {
    inout: (u) => -(Math.cos(Math.PI * u) - 1) / 2,
    out: (u) => 1 - Math.pow(1 - u, 3),
    in: (u) => u * u * u,
    linear: (u) => u,
  };

  function create(glCanvas, ovlCanvas) {
    const F = window.FILM;
    const L = F.landmarks;
    const R = window.GRD.create(glCanvas, { base: F.plateBase || "assets/plate/", landmarks: L });
    const ctx = ovlCanvas.getContext("2d");
    const FPS = F.fps || 30;

    const arr = (a, t) => { if (!a || !a.length) return 0; const f = clamp(t * FPS, 0, a.length - 1); const i = Math.floor(f), k = f - i; return a[i] * (1 - k) + a[Math.min(i + 1, a.length - 1)] * k; };
    // ramps: [{t0, t1, a, in, out}] -> sum of smooth plateaus
    const ramp = (list, t) => (list || []).reduce((s, r) => s + r.a * sm(r.t0, r.t0 + (r.in || 0.35), t) * (1 - sm(r.t1, r.t1 + (r.out || 0.45), t)), 0);
    // impulses: [{t, a, d}] -> damped bumps
    const bump = (list, t) => (list || []).reduce((s, r) => { const d = t - r.t; if (d < 0 || d > 2.5) return s; const dur = r.d || 0.55; return s + r.a * Math.sin(Math.min(1, d / dur) * Math.PI) * Math.exp(-d * 0.8); }, 0);

    function shotAt(t) { const S = F.shots; let i = 0; while (i < S.length - 1 && t >= S[i + 1].t0) i++; return i; }
    function camAt(i, t) {
      const s = F.shots[i]; const t1 = i < F.shots.length - 1 ? F.shots[i + 1].t0 : F.dur;
      const u = clamp((t - s.t0) / Math.max(0.01, t1 - s.t0), 0, 1); const e = (EASE[s.ease] || EASE.inout)(u);
      const c0 = s.cam0, c1 = s.cam1 || s.cam0;
      const c = { x: c0.x + (c1.x - c0.x) * e, y: c0.y + (c1.y - c0.y) * e, z: c0.z + (c1.z - c0.z) * e, roll: (c0.roll || 0) + ((c1.roll || 0) - (c0.roll || 0)) * e };
      const hh = s.hand == null ? 1 : s.hand, sd = i * 7.3;
      c.x += hh * (1.3 * Math.sin(t * 0.61 + sd) + 0.6 * Math.sin(t * 1.73 + sd * 2)) / c.z;
      c.y += hh * (1.1 * Math.sin(t * 0.53 + sd * 3) + 0.5 * Math.sin(t * 1.37 + sd)) / c.z;
      c.roll += hh * 0.0012 * Math.sin(t * 0.41 + sd);
      if (s.punch) { const k = sm(s.punch.t, s.punch.t + 0.25, t); c.z *= 1 + s.punch.a * k; }
      // keep plate shots inside the plate
      if (!s.sky) {
        const hw = 540 / c.z, hh2 = 960 / c.z;
        c.x = clamp(c.x, hw, 1402 - hw); c.y = clamp(c.y, hh2, 1122 - hh2);
      }
      c.u = u; return c;
    }
    const toScreen = (c, wx, wy, depth) => {
      let dx = (wx - c.x) * c.z * depth, dy = (wy - c.y) * c.z * depth;
      const cr = Math.cos(-c.roll), sr = Math.sin(-c.roll);
      return [540 + cr * dx - sr * dy, 960 + sr * dx + cr * dy];
    };

    function particles(S, c, t, tEff, shot) {
      const back = [], front = [];
      const push = (A, x, y, size, inten, col) => { if (x < -60 || x > 1140 || y < -60 || y > 1980) return; A.push(x, y, size, inten, col[0], col[1], col[2]); };
      const zs = Math.sqrt(c.z);
      // gold dust motes at three depths
      const N = 120;
      for (let i = 0; i < N; i++) {
        const h1 = hash(i * 3.1), h2 = hash(i * 7.7 + 1), h3 = hash(i * 1.9 + 5), h4 = hash(i * 5.3 + 9);
        const depth = 0.55 + 1.2 * h3;
        const span = [1800, 2600];
        let x = -200 + h1 * span[0] + 22 * Math.sin(tEff * (0.2 + 0.3 * h4) + i);
        let y = -800 + ((h2 * span[1] - tEff * (8 + 16 * h4)) % span[1] + span[1]) % span[1];
        if (!shot.sky && (y < -100 || y > 1250)) continue;
        const [sx, sy] = toScreen(c, x, y, depth);
        const tw = 0.6 + 0.4 * Math.sin(tEff * (1.5 + 2 * h1) + i);
        const big = depth > 1.25;
        const size = (big ? 10 + 18 * h1 : 2.5 + 5 * h1) * zs * (depth > 1 ? depth : 1);
        const inten = (big ? 0.10 : 0.55) * tw * (S.dustGain || 1);
        push(depth > 1 ? front : back, sx, sy, size, inten, [1.0, 0.74, 0.42]);
      }
      // blue data sparks rising from the medallion on his voice pulses
      const med = S.medScreen;
      (F.pulses || []).forEach((tp, k) => {
        const age = t - tp; if (age < 0 || age > 1.9) return;
        for (let j = 0; j < 3; j++) {
          const h = hash(k * 13.1 + j * 3.7), h2 = hash(k * 5.9 + j * 11.3);
          const wx = L.guardian.medallion[0] + (h - 0.5) * 50 * age + 9 * Math.sin(age * 5 + j);
          const wy = L.guardian.medallion[1] - (50 + 70 * h2) * age - 10 * age * age;
          const [sx, sy] = toScreen(c, wx, wy, 1);
          push(front, sx, sy, (3 + 4 * h) * zs, 0.9 * (1 - age / 1.9) * (S.sparkGain || 1), [0.45, 0.9, 1.0]);
        }
      });
      // a faint drift of blue particles inside the hood (never eyes: random, slow, dim)
      for (let i = 0; i < 16; i++) {
        const a = hash(i * 2.3) * 6.283 + tEff * (0.05 + 0.08 * hash(i)), r = Math.sqrt(hash(i * 4.1)) * 0.85;
        const wx = 600 + Math.cos(a) * 52 * r + 6 * Math.sin(tEff * 0.3 + i), wy = 345 + Math.sin(a) * 68 * r - ((tEff * 6 + i * 13) % 30);
        const [sx, sy] = toScreen(c, wx, wy, 1);
        push(front, sx, sy, (2.2 + 2 * hash(i + 7)) * zs, (0.10 + 0.12 * hash(i + 3)) * (0.6 + 0.4 * Math.sin(tEff * 1.3 + i)), [0.35, 0.7, 1.0]);
      }
      // medallion halo
      push(front, med[0], med[1], 110 * c.z, 0.02 + 0.06 * S.medGlow, [0.35, 0.8, 1.0]);
      return [new Float32Array(back), new Float32Array(front)];
    }

    function stateAt(t, frame) {
      const i = shotAt(t), s = F.shots[i];
      const c = camAt(i, t);
      const A = F.acting || {};
      const envG = arr(F.env.G, t), envL = arr(F.env.L, t);
      const fr = F.freeze || { t0: 1e9, t1: 1e9 };
      const frozen = t >= fr.t0 && t < fr.t1;
      const tEff = t < fr.t0 ? t : t < fr.t1 ? fr.t0 : t - (fr.t1 - fr.t0);
      // ---------- Guardian
      const G = L.guardian;
      const gb = Math.sin(2 * Math.PI * tEff / 4.6);
      const nod = bump(A.nods, t) + ramp(A.gNod, t);
      const lean = ramp(A.gLean, t);
      const gest = bump(A.gestures, t);
      const gCtl = [
        { c: [G.chest[0], G.chest[1], 430, 2 + 40], p: [G.breath_pivot[0], G.breath_pivot[1], 1 + 0.003 * gb, 1 + 0.0075 * gb] },
        { c: [G.hood_center[0], G.hood_center[1], 600, 1 + 10], p: [G.hood_pivot[0], G.hood_pivot[1], 0.03 * nod + 0.004 * Math.sin(tEff * 0.5), 0] },
        { c: [G.hood_center[0], G.hood_center[1], 600, 0 + 10], p: [lean * 6 + 1.6 * nod, lean * 3 + 2.2 * nod, 0, 0] },
        { c: [G.hand_raised[0], G.hand_raised[1], 400, 0 + 20], p: [2.6 * Math.sin(tEff * 0.83) + 2.5 * gest, 2.2 * Math.sin(tEff * 1.21 + 1) - 5.5 * gest, 0, 0] },
        { c: [G.hand_raised[0], G.hand_raised[1], 400, 1 + 20], p: [300, 705, 0.015 * Math.sin(tEff * 0.67 + 2) - 0.03 * gest, 0] },
        { c: [G.hand_low[0], G.hand_low[1], 300, 0 + 30], p: [1.6 * Math.sin(tEff * 0.71 + 2) + 1.2 * gest, 1.4 * Math.sin(tEff * 1.07) - 1.5 * gest, 0, 0] },
      ];
      // medallion screen position (follows the breathing roughly)
      const medW = [G.medallion[0], G.medallion[1] - 0.0075 * gb * (G.breath_pivot[1] - G.medallion[1]) * 0.8];
      const wink = bump(A.wink ? [{ t: A.wink, a: 1, d: 0.35 }] : [], t);
      const medGlow = 0.15 + 0.95 * envG + 1.8 * wink + ramp(A.medBoost, t);
      const lineBase = 0.04 + 0.42 * envG + 0.6 * wink + 0.35 * ramp(A.medBoost, t);
      const pulses = [];
      (F.pulses || []).forEach((tp) => { const age = t - tp; if (age >= 0 && age < 2.4) pulses.push([age * 430, 0.6 * Math.exp(-age * 1.15)]); });
      pulses.sort((a, b) => b[1] - a[1]);
      // ---------- girl
      const Lg = L.girl;
      const lb = Math.sin(2 * Math.PI * tEff / 3.4);
      const tilt = 0.006 * Math.sin(tEff * 0.45 + 1) + ramp(A.lTilt, t) + bump(A.lTiltB, t);
      const tiltLag = 0.006 * Math.sin((tEff - 0.3) * 0.45 + 1) + ramp(A.lTilt, t - 0.3) + bump(A.lTiltB, t - 0.3);
      const lLean = ramp(A.lLean, t);
      const sway = 0.011 * Math.sin(tEff * 1.25) + 0.007 * Math.sin(tEff * 2.1 + 1) + 0.9 * tiltLag + 0.004 * lLean;
      let blink = 0;
      (A.blinks || []).forEach((tb) => { const d = t - tb; if (d < 0 || d > 0.32) return; const b = d < 0.075 ? d / 0.075 : d < 0.13 ? 1 : 1 - (d - 0.13) / 0.16; blink = Math.max(blink, clamp(b, 0, 1)); });
      blink = blink * blink * (3 - 2 * blink);
      const brow = ramp(A.brows, t) + bump(A.browsB, t);
      const smile = ramp(A.smile, t);
      const widen = ramp(A.widen, t);
      const mouth = clamp(Math.pow(envL, 0.72) * 1.05, 0, 0.92);
      const M = Lg.mouth;
      const lCtl = [
        // body (applied first)
        { c: [Lg.torso[0], Lg.torso[1], 420, 2 + 30], p: [Lg.breath_pivot[0], Lg.breath_pivot[1], 1 + 0.002 * lb, 1 + 0.008 * lb] },
        { c: [Lg.head_center[0], Lg.head_center[1], 700, 1 + 10], p: [Lg.neck_pivot[0], Lg.neck_pivot[1], tilt, 0] },
        { c: [Lg.head_center[0], Lg.head_center[1], 700, 0 + 10], p: [-6.5 * lLean, 1.8 * lLean - 1.2 * lb * 0.5, 0, 0] },
        { c: [Lg.ponytail_center[0], Lg.ponytail_center[1], 700, 1 + 20], p: [Lg.ponytail_anchor[0], Lg.ponytail_anchor[1], sway, 0] },
        // face (applied after)
        { c: [M.chin[0], M.chin[1], 16, 0], p: [0, 5.4 * mouth, 0, 0] },
        { c: [Lg.brows.far[0], Lg.brows.far[1], 11, 0], p: [0, -2.2 * brow, 0, 0] },
        { c: [Lg.brows.near[0], Lg.brows.near[1], 17, 0], p: [0.3 * brow, -3.0 * brow, 0, 0] },
        { c: [M.left[0] + 1, M.left[1], 7, 0], p: [-0.3 * smile, -1.5 * smile, 0, 0] },
        { c: [M.right[0], M.right[1], 8, 0], p: [0.6 * smile, -1.9 * smile, 0, 0] },
        { c: [1035, 508, 15, 0], p: [0, -1.1 * smile, 0, 0] },
        { c: [1046, 463, 17, 2], p: [1046, 463, 1 + 0.05 * widen, 1 + 0.08 * widen] },
        { c: [985, 457, 12, 2], p: [985, 457, 1 + 0.04 * widen, 1 + 0.07 * widen] },
      ];
      // ---------- clock
      const clock = [arr(F.clock.s, t), arr(F.clock.m, t), arr(F.clock.h, t), arr(F.clock.glow, t)];
      const clockBlur = [arr(F.clock.bs, t), arr(F.clock.bm, t), arr(F.clock.bm, t) / 12];
      // ---------- grade
      const g = Object.assign({ expo: 1.0, sat: 1.02, vig: 0.4, bloom: s.sky ? 0.55 : 0.42, grain: 0.032, contrast: 1.04 }, s.grade || {});
      const warm = F.warm ? sm(F.warm.t0, F.warm.t0 + (F.warm.d || 2.5), t) * (F.warm.a || 0.6) : 0;
      const cool = frozen ? 0.35 * sm(fr.t0, fr.t0 + 0.4, t) : (t >= fr.t1 ? 0.35 * (1 - sm(fr.t1, fr.t1 + 1.6, t)) : 0);
      g.bloom += 0.25 * warm;
      const fade = F.fadeIn ? 1 - sm(0, F.fadeIn, t) : 0;
      const parallax = s.parallax == null ? 0.06 : s.parallax;
      const S = {
        cam: c, time: tEff, frame, sky: !!s.sky, fg: s.fg !== false,
        bgLod: s.bgLod == null ? (s.sky ? 0.2 : 0.8) : s.bgLod, charLod: s.charLod || 0,
        bgOff: [(c.x - s.cam0.x) * parallax, (c.y - s.cam0.y) * parallax], charOff: [0, 0],
        gCtl, lCtl, lBody: 4, blink: [blink, blink], mouth,
        med: medW, medGlow, lineBase, pulses, rim: 0.5 + 0.5 * Math.sin(tEff * 2.3) * Math.sin(tEff * 0.7 + 1),
        clock, clockBlur, grade: g, warm, cool, fade, freeze: frozen ? 1 : 0, ringC: F.ringC,
        dustGain: s.dust == null ? 1 : s.dust, sparkGain: 1, bloomThr: s.sky ? 0.64 : 0.72,
      };
      S.medScreen = toScreen(c, medW[0], medW[1], 1);
      [S.ptsBack, S.ptsFront] = particles(S, c, t, tEff, s);
      return { S, shot: s, i };
    }

    function render(t) {
      const frame = Math.round(t * FPS);
      const { S, shot } = stateAt(t, frame);
      R.render(S);
      ctx.clearRect(0, 0, 1080, 1920);
      window.GOV.draw(ctx, F, t, shot, frame);
    }
    return { ready: R.ready, render, stateAt };
  }
  window.GFILM = { create };
})();

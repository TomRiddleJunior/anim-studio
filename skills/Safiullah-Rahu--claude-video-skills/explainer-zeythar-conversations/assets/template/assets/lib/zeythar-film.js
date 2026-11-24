/* zeythar-film.js — turns window.FILM (written by tools/timeline.py) into per-frame render state: the shot camera
 * (eased push/drift + a little hand-held), parallax and depth of field, the acting (breathing, hood tilts and nods, the
 * open hand turning; her blinks, gaze, brows, smile, head tilt, chin lift, laugh, lip-sync from her voice envelope),
 * Zeythar's voice light (orb, medallion, rune pulses), the clock, particles, grade; then draws the plate (zeythar-gl.js),
 * the hologram layer (zeythar-holo.js) and the overlay (zeythar-overlay.js).
 * ZFILM.create(glCanvas, overlayCanvas) -> { ready, render(t), stateAt(t) }
 */
(function () {
  "use strict";
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const sm = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const EASE = { inout: (u) => -(Math.cos(Math.PI * u) - 1) / 2, out: (u) => 1 - Math.pow(1 - u, 3), in: (u) => u * u * u, linear: (u) => u };

  // world-space extents of each orb morph around the orb centre (as zeythar-holo.js draws them; tools/layout_check.py
  // keeps the same boxes): the clock hands fade out inside the active box + 40 screen px
  const MORPH_BOX = {
    log: [-150, -197, 70, -39], bubbles: [-120, -92, 120, 92], notepad: [-104, -104, 114, 82], sun_moon: [-104, -64, 114, 48],
    tally: [-50, -32, 50, 32], bubbles_reviewed: null,
  };
  const GENERIC_BOX = [-90, -80, 90, 80];

  function create(glCanvas, ovlCanvas) {
    const F = window.FILM;
    const L = F.landmarks;
    const R = window.ZGL.create(glCanvas, { base: F.plateBase || "assets/plate/", landmarks: L });
    const HO = window.ZHOLO.create(1080, 1920);
    const ctx = ovlCanvas.getContext("2d");
    const FPS = F.fps || 30;
    const A = F.acting || {};
    // cumulative voice energy (orb ring phase runs faster while he speaks)
    const cumZ = new Float32Array(F.env.Z.length); { let s = 0; for (let i = 0; i < F.env.Z.length; i++) { s += F.env.Z[i] / FPS; cumZ[i] = s; } }

    const arr = (a, t) => { if (!a || !a.length) return 0; const f = clamp(t * FPS, 0, a.length - 1); const i = Math.floor(f), k = f - i; return a[i] * (1 - k) + a[Math.min(i + 1, a.length - 1)] * k; };
    const ramp = (list, t) => (list || []).reduce((s, r) => s + r.a * sm(r.t0, r.t0 + (r.in || 0.35), t) * (1 - sm(r.t1, r.t1 + (r.out || 0.45), t)), 0);
    const bump = (list, t) => (list || []).reduce((s, r) => { const d = t - r.t; if (d < 0 || d > 2.5) return s; const dur = r.d || 0.55; return s + r.a * Math.sin(Math.min(1, d / dur) * Math.PI) * Math.exp(-d * 0.8); }, 0);
    const bumpList = (ts, t, dur) => (ts || []).reduce((s, x) => { const d = t - x; if (d < 0 || d > dur) return s; return s + Math.sin(d / dur * Math.PI); }, 0);

    function shotAt(t) { const S = F.shots; let i = 0; while (i < S.length - 1 && t >= S[i + 1].t0) i++; return i; }
    function camAt(i, t) {
      const s = F.shots[i]; const t1 = i < F.shots.length - 1 ? F.shots[i + 1].t0 : F.dur;
      const u = clamp((t - s.t0) / Math.max(0.01, t1 - s.t0), 0, 1); const e = (EASE[s.ease] || EASE.inout)(u);
      const c0 = s.cam0, c1 = s.cam1 || s.cam0;
      const c = { x: c0.x + (c1.x - c0.x) * e, y: c0.y + (c1.y - c0.y) * e, z: c0.z + (c1.z - c0.z) * e, roll: 0 };
      const hh = s.hand == null ? 1 : s.hand, sd = i * 7.3;
      c.x += hh * (1.3 * Math.sin(t * 0.61 + sd) + 0.6 * Math.sin(t * 1.73 + sd * 2)) / c.z;
      c.y += hh * (1.1 * Math.sin(t * 0.53 + sd * 3) + 0.5 * Math.sin(t * 1.37 + sd)) / c.z;
      c.roll += hh * 0.0012 * Math.sin(t * 0.41 + sd);
      if (!s.sky) {
        const hw = 540 / c.z, hh2 = 960 / c.z;
        c.x = clamp(c.x, hw, 1402 - hw); c.y = clamp(c.y, hh2, 1122 - hh2);
      }
      c.u = u;
      const cr = Math.cos(-c.roll), sr = Math.sin(-c.roll);
      c.toS = (wx, wy, depth) => { const d = depth || 1; const dx = (wx - c.x) * c.z * d, dy = (wy - c.y) * c.z * d; return [540 + cr * dx - sr * dy, 960 + sr * dx + cr * dy]; };
      return c;
    }

    function particles(S, c, t, shot) {
      const back = [], front = [];
      const push = (Ar, x, y, size, inten, col) => { if (x < -60 || x > 1140 || y < -60 || y > 1980) return; Ar.push(x, y, size, inten, col[0], col[1], col[2]); };
      const zs = Math.sqrt(c.z);
      for (let i = 0; i < 110; i++) {
        const h1 = hash(i * 3.1), h2 = hash(i * 7.7 + 1), h3 = hash(i * 1.9 + 5), h4 = hash(i * 5.3 + 9);
        const depth = 0.55 + 1.2 * h3;
        let x = -200 + h1 * 1800 + 22 * Math.sin(t * (0.2 + 0.3 * h4) + i);
        let y = -800 + ((h2 * 2600 - t * (6 + 12 * h4)) % 2600 + 2600) % 2600;
        if (!shot.sky && (y < -100 || y > 1250)) continue;
        const [sx, sy] = c.toS(x, y, depth);
        const tw = 0.6 + 0.4 * Math.sin(t * (1.5 + 2 * h1) + i);
        const big = depth > 1.25;
        const size = (big ? 10 + 18 * h1 : 2.5 + 5 * h1) * zs * (depth > 1 ? depth : 1);
        push(depth > 1 ? front : back, sx, sy, size, (big ? 0.09 : 0.5) * tw * (S.dustGain || 1), [1.0, 0.74, 0.42]);
      }
      const med = S.medScreen;
      (F.pulses || []).forEach((tp, k) => {
        const age = t - tp; if (age < 0 || age > 1.9) return;
        for (let j = 0; j < 3; j++) {
          const h = hash(k * 13.1 + j * 3.7), h2 = hash(k * 5.9 + j * 11.3);
          const wx = L.zeythar.medallion[0] + (h - 0.5) * 50 * age + 9 * Math.sin(age * 5 + j);
          const wy = L.zeythar.medallion[1] - (50 + 70 * h2) * age - 10 * age * age;
          const [sx, sy] = c.toS(wx, wy, 1);
          push(front, sx, sy, (3 + 4 * h) * zs, 0.75 * (1 - age / 1.9), [0.45, 0.8, 1.0]);
        }
      });
      // a faint drift of blue particles inside the hood (never eyes: random, slow, dim)
      for (let i = 0; i < 16; i++) {
        const a = hash(i * 2.3) * 6.283 + t * (0.05 + 0.08 * hash(i)), r = Math.sqrt(hash(i * 4.1)) * 0.8;
        const wx = 515 + Math.cos(a) * 62 * r + 6 * Math.sin(t * 0.3 + i), wy = 340 + Math.sin(a) * 85 * r - ((t * 6 + i * 13) % 30);
        const [sx, sy] = c.toS(wx, wy, 1);
        push(front, sx, sy, (2.2 + 2 * hash(i + 7)) * zs, (0.09 + 0.10 * hash(i + 3)) * (0.6 + 0.4 * Math.sin(t * 1.3 + i)), [0.35, 0.62, 1.0]);
      }
      push(front, med[0], med[1], 100 * c.z, 0.02 + 0.05 * S.medGlow, [0.35, 0.7, 1.0]);
      return [new Float32Array(back), new Float32Array(front)];
    }

    function stateAt(t, frame, crisp) {
      const i = shotAt(t), s = F.shots[i];
      const c = camAt(i, t);
      const envZ = arr(F.env.Z, t), envL = arr(F.env.L, t);
      // ---------- Zeythar
      const Z = L.zeythar;
      const still = clamp(ramp(A.still, t), 0, 1), idle = 1 - 0.7 * still;
      const gb = Math.sin(2 * Math.PI * t / 4.6);
      const nod = bump(A.zNod, t), tilt = bump(A.zTilt, t);
      const turn = ramp(A.handTurn, t), lift = ramp(A.handLift, t);
      const zCtl = [
        { c: [Z.chest[0], Z.chest[1], 430, 2 + 40], p: [Z.breath_pivot[0], Z.breath_pivot[1], 1 + 0.003 * gb, 1 + 0.007 * gb] },
        { c: [Z.hood_center[0], Z.hood_center[1], 600, 1 + 10], p: [Z.hood_pivot[0], Z.hood_pivot[1], 0.026 * nod - 0.03 * tilt + 0.004 * idle * Math.sin(t * 0.5), 0] },
        { c: [Z.hood_center[0], Z.hood_center[1], 600, 0 + 10], p: [1.2 * nod - 2.2 * tilt, 2.0 * nod + 0.6 * tilt, 0, 0] },
        { c: [Z.hand_raised[0], Z.hand_raised[1], 380, 0 + 20], p: [2.2 * idle * Math.sin(t * 0.83) + 1.5 * turn, 1.8 * idle * Math.sin(t * 1.21 + 1) - 5.5 * lift, 0, 0] },
        { c: [Z.hand_raised[0], Z.hand_raised[1], 380, 1 + 20], p: [Z.wrist[0], Z.wrist[1], 0.012 * idle * Math.sin(t * 0.67 + 2) - 0.05 * turn - 0.02 * lift, 0] },
        { c: [Z.hand_low[0], Z.hand_low[1], 300, 0 + 30], p: [1.4 * idle * Math.sin(t * 0.71 + 2), 1.2 * idle * Math.sin(t * 1.07), 0, 0] },
      ];
      const medW = [Z.medallion[0], Z.medallion[1] - 0.007 * gb * (Z.breath_pivot[1] - Z.medallion[1]) * 0.8];
      const boost = ramp(A.orbBoost, t), dim = clamp(ramp(A.orbDim, t), 0, 1), opulse = bumpList(A.orbPulse, t, 0.45);
      const medGlow = 0.15 + 0.9 * envZ + 0.3 * boost;
      const lineBase = 0.05 + 0.40 * envZ + 0.15 * boost;
      const pulses = [];
      (F.pulses || []).forEach((tp) => { const age = t - tp; if (age >= 0 && age < 2.4) pulses.push([age * 430, 0.6 * Math.exp(-age * 1.15)]); });
      pulses.sort((a, b) => b[1] - a[1]);
      const orbB = clamp((0.55 + 0.55 * envZ + 0.45 * boost + 0.8 * opulse) * (1 - 0.6 * dim), 0, 1.6);
      const orbSpeed = t * 0.8 + 2.4 * arr(cumZ, t);
      // ---------- girl
      const G = L.girl;
      const lb = Math.sin(2 * Math.PI * t / 3.6);
      const tiltL = 0.005 * Math.sin(t * 0.45 + 1) + ramp(A.lTilt, t) + bump(A.lTiltB, t);
      const tiltLag = 0.005 * Math.sin((t - 0.35) * 0.45 + 1) + ramp(A.lTilt, t - 0.35);
      const liftL = ramp(A.lLift, t), drop = ramp(A.lDrop, t), nodL = bump(A.nods, t);
      const laugh = (A.laugh || []).reduce((acc, r) => { const d = t - r.t; if (d < 0 || d > r.d) return acc; return acc + r.a * Math.sin(d / r.d * Math.PI); }, 0);
      let blink = 0;
      (A.blinks || []).forEach((tb) => { const d = t - tb; if (d < 0 || d > 0.32) return; const b = d < 0.075 ? d / 0.075 : d < 0.13 ? 1 : 1 - (d - 0.13) / 0.16; blink = Math.max(blink, clamp(b, 0, 1)); });
      (A.slowBlinks || []).forEach((tb) => { const d = t - tb; if (d < 0 || d > 0.7) return; const b = d < 0.16 ? d / 0.16 : d < 0.34 ? 1 : 1 - (d - 0.34) / 0.36; blink = Math.max(blink, clamp(b, 0, 1)); });
      blink = blink * blink * (3 - 2 * blink);
      const squint = ramp(A.squint, t);
      const lid = Math.max(blink, squint);
      const brow = ramp(A.brows, t), browOne = ramp(A.browOne, t), knit = ramp(A.knit, t);
      const smile = clamp(ramp(A.smile, t) + 0.6 * laugh, 0, 1.1), widen = ramp(A.widen, t);
      const gx = ramp(A.gazeX, t), gy = ramp(A.gazeY, t);
      const mouth = clamp(Math.pow(envL, 0.62) * 1.1, 0, 1.0);
      const M = G.mouth;
      const ef = G.eyes.far, en = G.eyes.near;
      const lCtl = [
        // body (applied first)
        { c: [G.torso[0], G.torso[1], 430, 2 + 30], p: [G.breath_pivot[0], G.breath_pivot[1], 1 + 0.002 * lb, 1 + 0.007 * lb] },
        { c: [G.head_center[0], G.head_center[1], 700, 1 + 10], p: [G.tilt_pivot[0], G.tilt_pivot[1], tiltL, 0] },
        { c: [G.head_center[0], G.head_center[1], 700, 0 + 10], p: [-1.2 * drop, -2.6 * liftL + 2.4 * drop + 2.0 * nodL - 1.4 * laugh - 0.5 * lb, 0, 0] },
        { c: [G.torso[0], G.torso[1] - 140, 520, 0 + 30], p: [0, -2.6 * laugh, 0, 0] },
        { c: [G.hair_center[0], G.hair_center[1], 700, 1 + 20], p: [G.hair_anchor[0], G.hair_anchor[1], 0.6 * tiltLag + 0.004 * Math.sin(t * 1.1) + 0.003 * Math.sin(t * 1.9 + 1), 0] },
        // face (applied after)
        { c: [M.lower_lip[0] + 2, M.lower_lip[1] + 5, 19, 0 + 50], p: [0, 5.8 * mouth, 0, 0] },
        { c: [G.brows.far[0], G.brows.far[1], 9, 0], p: [0.8 * knit, -2.0 * brow + 0.9 * knit, 0, 0] },
        { c: [G.brows.near[0], G.brows.near[1], 15, 0], p: [0.3 * brow, -2.6 * brow - 3.0 * browOne + 0.6 * knit, 0, 0] },
        { c: [G.brows.near[0] - 16, G.brows.near[1] + 3, 8, 0], p: [-1.4 * knit, 1.0 * knit, 0, 0] },
        { c: [M.left[0], M.left[1], 6, 0 + 60], p: [-0.3 * smile, -1.4 * smile, 0, 0] },
        { c: [M.right[0], M.right[1], 8, 0 + 60], p: [0.8 * smile, -2.0 * smile, 0, 0] },
        { c: [1040, 370, 16, 0 + 60], p: [0, -1.2 * smile, 0, 0] },
        { c: [ef.iris[0] + 1, ef.iris[1], 11, 2], p: [ef.iris[0] + 1, ef.iris[1], 1 + 0.04 * widen, 1 + 0.09 * widen] },
        { c: [en.iris[0] + 9, en.iris[1], 18, 2], p: [en.iris[0] + 9, en.iris[1], 1 + 0.04 * widen, 1 + 0.09 * widen] },
        { c: [ef.iris[0], ef.iris[1], 10, 0 + 40], p: [1.3 * gx, 1.3 * gy, 0, 0] },
        { c: [en.iris[0], en.iris[1], 13, 0 + 40], p: [1.8 * gx, 1.7 * gy, 0, 0] },
      ];
      // ---------- clock
      const clock = [arr(F.clock.m, t), arr(F.clock.h, t), arr(F.clock.glow, t)];
      // ---------- the hands' look and the hole the orb / an active morph cuts in them
      const OL = L.zeythar.orb;
      const endK = F.orbEnd ? sm(F.orbEnd.t0, F.orbEnd.t0 + 1.4, t) : 0;
      const ox = OL[0] + (702 - OL[0]) * endK, oy = OL[1] + (588 - OL[1]) * endK;
      let mk = 0, act = null;
      (F.morphs || []).forEach((m) => { const k = sm(m.t0, m.t0 + 0.4, t) * (1 - sm(m.t1 - 0.4, m.t1, t)); if (k > mk) { mk = k; act = m; } });
      const orr = 112 * 1.05 * (1 - 0.55 * mk) * (1 - 0.6 * endK);
      let hole = [ox - orr, oy - orr, ox + orr, oy + orr];
      if (act && mk > 0.02) {
        const sc = 0.7 + 0.3 * (1 - Math.pow(1 - mk, 3));
        let b = act.kind === "bubbles_reviewed" ? [772 - 150 - ox, 392 - 200 - oy, 772 + 150 - ox, 392 + 200 - oy] : (MORPH_BOX[act.kind] || GENERIC_BOX);
        b = b.map((v) => v * sc);
        hole = [Math.min(hole[0], ox + b[0]), Math.min(hole[1], oy + b[1]), Math.max(hole[2], ox + b[2]), Math.max(hole[3], oy + b[3])];
      }
      const mg = 40 / c.z;
      hole = [hole[0] - mg, hole[1] - mg, hole[2] + mg, hole[3] + mg];
      // the painted dial is defocused in the key art (its ring edges rise over ~8 px): the hands get the same edge
      // softness plus the shot's mip blur, and 30 % less light; the final clock close-up keeps them sharp
      const sharp = s.type === "CLOCK_CU";
      const bgl = s.bgLod == null ? (s.sky ? 0.2 : 0.8) : s.bgLod;
      const handLook = sharp ? [1.4 + 2.0 * bgl, 0.0] : [4.2 + 1.2 * bgl, 0.30];
      // ---------- grade
      const g = Object.assign({ expo: 1.0, sat: 1.03, vig: 0.4, bloom: s.sky ? 0.52 : 0.42, grain: 0.032, contrast: 1.04 }, s.grade || {});
      const GE = F.gradeEv || {};
      const soft = GE.soft ? sm(GE.soft.t0, GE.soft.t0 + 1.2, t) * (1 - sm(GE.soft.t1, GE.soft.t1 + 1.0, t)) : 0;
      const dawn = GE.dawn ? sm(GE.dawn.t0, GE.dawn.t0 + 3.0, t) * (1 - sm(GE.dawn.t1 + 1.2, GE.dawn.t1 + 2.6, t)) * 0.65 : 0;
      g.contrast -= 0.06 * soft; g.bloom += 0.10 * soft; g.expo -= 0.02 * soft;
      const parallax = s.parallax == null ? 0.06 : s.parallax;
      const S = {
        cam: c, time: t, frame, sky: !!s.sky, fg: s.fg !== false,
        bgLod: s.bgLod == null ? (s.sky ? 0.2 : 0.8) : s.bgLod, charLod: s.charLod || 0,
        bgOff: [(c.x - s.cam0.x) * parallax, (c.y - s.cam0.y) * parallax], charOff: [0, 0],
        zCtl, lCtl, lBody: 5, blink: [lid, lid], mouth, mouthK: 5.4,
        med: medW, medGlow, lineBase, pulses, rim: 0.5 + 0.5 * Math.sin(t * 2.3) * Math.sin(t * 0.7 + 1),
        clock, hole, holeF: 18 / c.z, handLook, grade: g, warm: 0.22 * soft, dawn, fade: 0, ringC: F.ringC,
        dustGain: s.dust == null ? 1 : s.dust, bloomThr: s.sky ? 0.64 : 0.72,
      };
      S.medScreen = c.toS(medW[0], medW[1], 1);
      [S.ptsBack, S.ptsFront] = particles(S, c, t, s);
      const ho = HO.draw(F, t, c, { orbB, orbSpeed, envZ }, crisp);
      S.holoAdd = HO.add; S.holoOver = HO.over; S.holoAddOn = ho.addOn; S.holoOverOn = ho.overOn;
      return { S, shot: s, i, mouth, envL, blink: lid };
    }

    function render(t) {
      const frame = Math.round(t * FPS);
      ctx.clearRect(0, 0, 1080, 1920);
      const { S, shot } = stateAt(t, frame, ctx);
      R.render(S);
      window.ZOV.draw(ctx, F, t, shot, frame);
    }
    return { ready: R.ready, render, stateAt };
  }
  window.ZFILM = { create };
})();

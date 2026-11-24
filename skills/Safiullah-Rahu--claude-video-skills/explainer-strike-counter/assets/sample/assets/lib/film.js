/* film.js — "The Rusted Lock" (strike-counter format, 14.0 s seamless loop).
   A white stick figure cranks the key of a giant rusted padlock. TURNS counts 0 -> 100 with motion-smeared turns and
   nothing gives; a scan line shows the inside: the rust around the bolt is cracked through and a heap of rust dust has
   built up. Turn 101 snaps it: the shackle jumps, gold light and rays pour out. Then the light fades, a new locked
   padlock takes its place, the counter rolls back to 0 and the figure grips the key again: the last frame is the first.
   window.SK_FILM(K) -> { draw(t), DUR, T }. Pure function of t. */
window.SK_FILM = function (K) {
  const { ctx, clamp, lerp, sstep, lin, eio, eout, ein, back, rng, mixc } = K;
  const DUR = 14.0;
  const T = {
    t1: 0.5, t2: 1.5, race0: 1.5, race1: 6.0,
    c1: [2.07, 6.38], c2: [6.53, 9.86], c3: [10.53, 11.88], c4: [12.03, 13.32],
    scan: [6.8, 7.42], tired: [6.05, 6.7], rise: [8.62, 9.3], grip: [9.3, 9.6], wind: [9.6, 9.78], burst: 10.0,
    recoil: [10.06, 10.6], akimbo: [10.75, 11.25], reset: [13.22, 13.95],
  };
  const CAP = {
    c1: ["Not even a click."],
    c2: ["But inside, the rust was giving way."],
    c3: ["The 101st turn", "didn't open it alone."],
    c4: ["The hundred before it", "wore the rust thin."],
  };

  // ------------------------------------------------------------------ layout
  const AX = 570, AY = 1100, R = 96;                    // key axis and knob radius
  const B = { x: 490, y: 950, w: 540, h: 380, r: 46 };  // padlock body (bottom on the floor at 1330)
  const SH = { lx: 620, rx: 920, cy: 795, w: 62, lBot: 1046, rBot: 1056 };
  const FLOOR = 1330;
  const A0 = -2.356;                                    // knob angle at turn 0 (up-left), screen radians

  // ------------------------------------------------------------------ the counter (measured on the source)
  const RACE = [[1.5, 2], [1.83, 4], [2.0, 7], [2.17, 11], [2.33, 16], [2.5, 21], [4.67, 85], [4.83, 89], [5.0, 92],
    [5.17, 95], [5.33, 97], [5.5, 98], [5.67, 99], [5.999, 99], [6.0, 100]];
  function count(t) {
    if (t < T.t1) return 0;
    if (t < T.t2) return 1;
    if (t < T.race1) {
      for (let i = 0; i < RACE.length - 1; i++) {
        const [a, na] = RACE[i], [b, nb] = RACE[i + 1];
        if (t >= a && t < b) return Math.floor(lerp(na, nb, (t - a) / (b - a)) + 1e-6);
      }
      return 99;
    }
    if (t < T.burst) return 100;
    return 101;
  }
  const INC = [];                                       // time each count is reached
  { let last = 0; for (let ms = 0; ms <= 10050; ms++) { const t = ms / 1000, n = count(t); while (n > last) { last++; INC.push([last, t]); } } }

  // ------------------------------------------------------------------ the visible crank (turns, float)
  const RT = [];                                        // race table: turns after 2 at 1 ms steps
  {
    const sp = (t) => t < 2.1 ? lerp(2.5, 5, (t - 1.5) / 0.6) : t < 4.6 ? 5 : t < 5.75 ? lerp(5, 2.2, (t - 4.6) / 1.15) : lerp(2.2, 1.6, (t - 5.75) / 0.25);
    let acc = 0; const raw = [0];
    for (let ms = 1500; ms < 6000; ms++) { acc += sp(ms / 1000) / 1000; raw.push(acc); }
    const N = Math.round(acc), k = N / acc;
    for (const v of raw) RT.push(v * k);
    RT.N = N;
  }
  const NR = 2 + RT.N;                                  // whole turns at the end of the race (turn 100 lands here)
  function phi(t) {
    if (t <= 0) return 0;
    if (t <= T.t1) return Math.pow(t / T.t1, 2.4);
    if (t <= 1.0) return 1 + 0.012 * Math.sin((t - 0.5) * 30) * (1 - (t - 0.5) / 0.5);
    if (t <= T.t2) return 1 + Math.pow((t - 1.0) / 0.5, 2.2);
    if (t <= T.race1) return 2 + RT[Math.min(RT.length - 1, Math.round((t - 1.5) * 1000))];
    if (t <= T.grip[0]) return NR;
    if (t <= T.wind[0]) return NR + 0.008 * Math.sin((t - T.grip[0]) * 40) * lin(T.grip[0], T.grip[0] + 0.1, t);
    if (t <= T.wind[1]) return NR - 0.045 * eout((t - T.wind[0]) / (T.wind[1] - T.wind[0]));
    if (t <= T.burst) return NR - 0.045 + 1.045 * Math.pow((t - T.wind[1]) / (T.burst - T.wind[1]), 1.7);
    return NR + 1;
  }
  const knobAt = (ph) => { const a = A0 + Math.PI * 2 * ph; return [AX + R * Math.cos(a), AY + R * Math.sin(a), a]; };

  // ------------------------------------------------------------------ poses
  const FEET = { f: [446, 1312], b: [318, 1312] };
  function crankPose(t) {
    const [kx, ky] = knobAt(phi(t));
    const nx = (kx - AX) / R, ny = (ky - AY) / R;
    const strain = t < T.t2 ? 0.04 * Math.sin(t * 9) * (t < T.t1 ? 1 : 0.6) : 0;
    return {
      hip: [380 + 30 * Math.max(0, nx) + 8 * nx, 1152 + 10 * Math.max(0, ny)],
      torso: 0.14 + 0.26 * nx + 0.3 * Math.max(0, ny) + strain, headTilt: 0.12 - 0.06 * ny,
      hands: [[kx, ky], [kx - 5, ky + 7]], feet: [FEET.f, FEET.b],
    };
  }
  const TIRED = (t) => ({ hip: [300, 1168 + 2.5 * Math.sin(t * 8.6)], torso: 0.56 + 0.035 * Math.sin(t * 8.6), headTilt: 0.34,
    hands: [[364, 1222], [346, 1228]], feet: [[404, 1312], [268, 1312]] });
  const STAND = (t) => ({ hip: [380, 1128 + 1.2 * Math.sin(t * 5)], torso: 0.05, headTilt: -0.14,
    hands: [[414, 1232], [392, 1236]], feet: [[452, 1312], [326, 1312]] });
  const AFTER = (t) => ({ hip: [352, 1130 + 1.0 * Math.sin(t * 3.4)], torso: -0.09, headTilt: -0.3,
    hands: [[402, 1236], [336, 1238]], feet: [[436, 1312], [300, 1312]] });
  // wonder: chest open, head up to the light, arms a little out from the sides
  const AKIMBO = (t) => ({ hip: [350, 1124 + 1.0 * Math.sin(t * 3.4)], torso: -0.06, headTilt: -0.34,
    hands: [[424, 1196 + 3 * Math.sin(t * 2.2)], [292, 1200]], feet: [[436, 1312], [300, 1312]] });
  function mixPose(a, b, u) {
    const L2 = (p, q) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u)];
    const step = (p, q) => { const v = L2(p, q); if (Math.abs(p[0] - q[0]) > 6) v[1] -= 22 * Math.sin(Math.PI * u); return v; };
    return { hip: L2(a.hip, b.hip), torso: lerp(a.torso, b.torso, u), headTilt: lerp(a.headTilt, b.headTilt, u),
      hands: [L2(a.hands[0], b.hands[0]), L2(a.hands[1], b.hands[1])], feet: [step(a.feet[0], b.feet[0]), step(a.feet[1], b.feet[1])] };
  }
  function pose(t) {
    if (t < T.tired[0]) return crankPose(t);
    if (t < T.tired[1]) return mixPose(crankPose(T.tired[0]), TIRED(t), eio(lin(T.tired[0], T.tired[1], t)));
    if (t < T.rise[0]) return TIRED(t);
    if (t < T.rise[1]) return mixPose(TIRED(t), STAND(t), eio(lin(T.rise[0], T.rise[1], t)));
    if (t < T.grip[0]) return STAND(t);
    if (t < T.grip[1]) return mixPose(STAND(t), crankPose(t), eio(lin(T.grip[0], T.grip[1], t)));
    if (t < T.recoil[0]) return crankPose(t);
    if (t < T.recoil[1]) return mixPose(crankPose(T.recoil[0]), AFTER(t), eout(lin(T.recoil[0], T.recoil[1], t)));
    if (t < T.akimbo[0]) return AFTER(t);
    if (t < T.akimbo[1]) return mixPose(AFTER(t), AKIMBO(t), eio(lin(T.akimbo[0], T.akimbo[1], t)));
    if (t < T.reset[0]) return AKIMBO(t);
    if (t < T.reset[1]) return mixPose(AKIMBO(t), crankPose(DUR), eio(lin(T.reset[0], T.reset[1], t)));
    return crankPose(DUR);
  }

  // ------------------------------------------------------------------ release light and lock states
  const light = (t) => t < T.burst ? 0 : eout(lin(T.burst, T.burst + 0.8, t)) * (1 - sstep(T.reset[0], T.reset[0] + 0.5, t)) * (1 + 0.04 * Math.sin(t * 4.1));
  const rayK = (t) => t < T.burst ? 0 : sstep(T.burst, 12.7, t) * (1 - sstep(T.reset[0], T.reset[0] + 0.5, t));
  const openK = (t) => t < T.burst ? 0 : back(lin(T.burst, T.burst + 0.2, t), 2.4);
  const oldA = (t) => 1 - sstep(13.26, 13.62, t);
  const newA = (t) => sstep(13.36, 13.72, t);
  const scanY = (t) => B.y + B.h * eio(lin(T.scan[0], T.scan[1], t));
  const xrayK = (t) => t < T.scan[0] ? 0 : t < T.burst ? 1 : 1 - sstep(T.burst + 0.05, T.burst + 0.42, t);
  const crackK = (t) => t < T.scan[0] ? 0 : t < T.burst ? 0.75 + 0.25 * Math.sin((t - 7) * 5.2) : 1 - 0.3 * sstep(10.6, 12, t);
  const warmK = (t) => (t < T.burst ? 0 : eout(lin(T.burst, T.burst + 0.6, t))) * (1 - sstep(13.2, 13.62, t));

  // ------------------------------------------------------------------ textures (drawn once)
  function canvasOf(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  const r0 = rng(41);
  const SOLID = canvasOf(B.w, B.h), XRAY = canvasOf(B.w, B.h);
  {
    const c = SOLID.getContext("2d");
    K.rr(0, 0, B.w, B.h, B.r, c); c.save(); c.clip();
    const g = c.createLinearGradient(0, 0, 0, B.h); g.addColorStop(0, "#474d56"); g.addColorStop(0.45, "#3a3f47"); g.addColorStop(1, "#272a30");
    c.fillStyle = g; c.fillRect(0, 0, B.w, B.h);
    const sg = c.createLinearGradient(0, 0, B.w, 0); sg.addColorStop(0, "rgba(255,255,255,0.05)"); sg.addColorStop(0.55, "rgba(0,0,0,0)"); sg.addColorStop(1, "rgba(0,0,0,0.22)");
    c.fillStyle = sg; c.fillRect(0, 0, B.w, B.h);
    for (let y = 40; y < B.h - 10; y += 38) { c.fillStyle = "rgba(18,20,24,0.75)"; c.fillRect(0, y, B.w, 2); c.fillStyle = "rgba(110,118,130,0.22)"; c.fillRect(0, y + 2, B.w, 1); }
    for (let i = 0; i < 90; i++) {
      const x = r0() * B.w, y = Math.pow(r0(), 0.7) * B.h, s = 5 + r0() * 34;
      c.fillStyle = `rgba(${105 + r0() * 40 | 0},${50 + r0() * 25 | 0},${22 + r0() * 12 | 0},${0.12 + r0() * 0.3})`;
      c.beginPath(); c.ellipse(x, y, s, s * (0.4 + r0() * 0.5), r0() * 3, 0, Math.PI * 2); c.fill();
    }
    for (let i = 0; i < 26; i++) {
      const x = 20 + r0() * (B.w - 40), y0 = r0() * B.h * 0.7, L = 40 + r0() * 140;
      const sgr = c.createLinearGradient(0, y0, 0, y0 + L); sgr.addColorStop(0, "rgba(140,72,30,0.35)"); sgr.addColorStop(1, "rgba(140,72,30,0)");
      c.fillStyle = sgr; c.fillRect(x, y0, 2 + r0() * 3, L);
    }
    for (let i = 0; i < 700; i++) { c.fillStyle = r0() < 0.5 ? "rgba(150,82,38,0.45)" : "rgba(20,22,26,0.4)"; c.fillRect(r0() * B.w, r0() * B.h, 1 + r0() * 2.5, 1 + r0() * 2.5); }
    for (const [x, y] of [[28, 28], [B.w - 28, 28], [28, B.h - 28], [B.w - 28, B.h - 28]]) {
      c.fillStyle = "#2b2f35"; c.beginPath(); c.arc(x, y, 11, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#5c636d"; c.beginPath(); c.arc(x - 2, y - 2, 7, 0, Math.PI * 2); c.fill();
    }
    c.restore();
    K.rr(1.5, 1.5, B.w - 3, B.h - 3, B.r - 1, c);
    const rim = c.createLinearGradient(0, 0, B.w, B.h); rim.addColorStop(0, "rgba(175,183,196,0.6)"); rim.addColorStop(0.5, "rgba(120,128,140,0.25)"); rim.addColorStop(1, "rgba(60,64,72,0.1)");
    c.strokeStyle = rim; c.lineWidth = 3; c.stroke();
  }
  {
    const c = XRAY.getContext("2d");
    K.rr(0, 0, B.w, B.h, B.r, c); c.save(); c.clip();
    const g = c.createLinearGradient(0, 0, 0, B.h); g.addColorStop(0, "#3a4c63"); g.addColorStop(0.5, "#2b384a"); g.addColorStop(1, "#1f2836");
    c.fillStyle = g; c.fillRect(0, 0, B.w, B.h);
    c.strokeStyle = "rgba(150,195,240,0.07)"; c.lineWidth = 1;
    for (let x = 15; x < B.w; x += 30) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, B.h); c.stroke(); }
    for (let y = 15; y < B.h; y += 30) { c.beginPath(); c.moveTo(0, y); c.lineTo(B.w, y); c.stroke(); }
    for (let y = 40; y < B.h - 10; y += 38) { c.fillStyle = "rgba(150,195,240,0.10)"; c.fillRect(0, y, B.w, 1.5); }
    // cylinder + cam lever
    const cx = AX - B.x, cy = AY - B.y;
    c.strokeStyle = "rgba(190,222,255,0.7)"; c.lineWidth = 3;
    c.fillStyle = "rgba(170,205,240,0.10)"; c.beginPath(); c.arc(cx, cy, 50, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.arc(cx, cy, 31, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 16; c.strokeStyle = "rgba(170,205,240,0.28)"; c.lineCap = "round";
    c.beginPath(); c.moveTo(cx + 24, cy - 34); c.lineTo(160, 70); c.stroke();
    c.lineWidth = 2.5; c.strokeStyle = "rgba(190,222,255,0.65)";
    c.beginPath(); c.moveTo(cx + 24, cy - 34); c.lineTo(160, 70); c.stroke();
    // spring under the bolt
    c.beginPath(); c.moveTo(300, 82); for (let k = 0; k < 7; k++) c.lineTo(300 + (k % 2 ? 12 : -12), 92 + k * 8); c.lineTo(300, 150); c.stroke();
    c.fillStyle = "rgba(170,205,240,0.18)"; c.fillRect(280, 150, 40, 12); c.strokeRect(280, 150, 40, 12);
    // the rust heap: 100 turns' worth of grind, on the floor of the case
    const base = B.h - 6, cxh = 285;  // the heap sits under the bolt
    const hg = c.createLinearGradient(0, base - 60, 0, base); hg.addColorStop(0, "#a0592a"); hg.addColorStop(1, "#5a2d12");
    c.fillStyle = hg; c.beginPath(); c.moveTo(40, base);
    for (let x = 40; x <= 500; x += 6) { const h = 78 * Math.exp(-Math.pow((x - cxh) / 135, 2)) + 3 * Math.sin(x * 0.21) + 2 * (r0() - 0.5); c.lineTo(x, base - Math.max(0, h)); }
    c.lineTo(500, base); c.closePath(); c.fill();
    for (let i = 0; i < 420; i++) { const x = 70 + r0() * 410, hmax = 78 * Math.exp(-Math.pow((x - cxh) / 135, 2)); const y = base - r0() * hmax; c.fillStyle = r0() < 0.5 ? "rgba(215,130,60,0.7)" : "rgba(70,32,12,0.6)"; c.fillRect(x, y, 2, 2); }
    c.restore();
    K.rr(1.5, 1.5, B.w - 3, B.h - 3, B.r - 1, c); c.strokeStyle = "rgba(170,210,250,0.6)"; c.lineWidth = 3; c.stroke();
  }
  // rust crust around the bolt (blob circles) and the hairline cracks through it (absolute coords)
  const CRUST = [], CRACKS = [];
  {
    const r = rng(77);
    for (let i = 0; i < 26; i++) { const x = 630 + (i / 25) * 290 + (r() - 0.5) * 10; CRUST.push([x, 1015 + (r() - 0.5) * 12, 16 + r() * 20, r()]); }
    for (const [x, y] of [[620, 1015], [920, 1015]]) for (let k = 0; k < 4; k++) CRUST.push([x + (r() - 0.5) * 30, y + (r() - 0.5) * 34, 18 + r() * 12, r()]);
    for (let i = 0; i < 11; i++) {
      const pts = []; let x = 635 + r() * 275, y = 1000 + r() * 30, a = r() * Math.PI * 2;
      pts.push([x, y]);
      const n = 4 + (r() * 4 | 0);
      for (let k = 0; k < n; k++) { a += (r() - 0.5) * 1.4; const L = 8 + r() * 13; x += Math.cos(a) * L; y += Math.sin(a) * L * 0.8; pts.push([x, clamp(y, 982, 1050)]); }
      CRACKS.push(pts);
    }
  }
  // particles: flakes + sparks on every counted turn, the burst, grains trickling inside (x-ray)
  const PARTS = [];
  {
    const r = rng(5);
    const rust = ["#7a4320", "#5e3417", "#a65d2a", "#8c4f24"];
    for (const [n, t0] of INC) {
      const big = n <= 2 || n === 100;
      const nf = big ? 7 : 2, ns = big ? 5 : (r() < 0.55 ? 1 : 0);
      for (let k = 0; k < nf; k++) PARTS.push({ t0: t0 + r() * 0.03, x: AX - 30 + (r() - 0.5) * 40, y: AY + 26 + (r() - 0.5) * 30, vx: -40 - r() * 120, vy: -30 - r() * 140, g: 1500, life: 0.75 + r() * 0.3, kind: "flake", size: 2.5 + r() * 3.5, rot: r() * 6, spin: (r() - 0.5) * 16, col: rust[r() * 4 | 0] });
      for (let k = 0; k < ns; k++) { const a = -Math.PI * (0.55 + r() * 0.6); const v = 260 + r() * 360; PARTS.push({ t0: t0 + r() * 0.02, x: AX - 22 + (r() - 0.5) * 20, y: AY - 6 + (r() - 0.5) * 30, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 900, life: 0.16 + r() * 0.16, kind: "spark", size: 12 + r() * 14 }); }
    }
    for (let k = 0; k < 54; k++) { const a = -Math.PI * (0.08 + r() * 0.84); const v = 380 + r() * 760; const fromHole = r() < 0.6; PARTS.push({ t0: T.burst + r() * 0.05, x: fromHole ? SH.lx + (r() - 0.5) * 40 : AX - 40, y: fromHole ? B.y - 4 : AY - 10, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 1100, life: 0.45 + r() * 0.5, kind: "spark", size: 16 + r() * 22 }); }
    for (let k = 0; k < 40; k++) { const a = -Math.PI * (0.15 + r() * 0.7); const v = 160 + r() * 420; PARTS.push({ t0: T.burst + r() * 0.06, x: SH.lx + (r() - 0.5) * 50, y: B.y - 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 1700, life: 0.9 + r() * 0.5, kind: "flake", size: 4 + r() * 6, rot: r() * 6, spin: (r() - 0.5) * 14, col: rust[r() * 4 | 0] }); }
  }
  const GRAINS = []; { const r = rng(9); for (let i = 0; i < 16; i++) GRAINS.push([640 + r() * 270, r() * 1.6, 0.5 + r() * 0.5]); }

  // ------------------------------------------------------------------ drawing pieces
  function shackle(dy, a, xray) {
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(0, dy);
    const top = B.y + 30, rad = (SH.rx - SH.lx) / 2, cx = (SH.lx + SH.rx) / 2;
    const path = () => { ctx.beginPath(); ctx.moveTo(SH.lx, top); ctx.lineTo(SH.lx, SH.cy); ctx.arc(cx, SH.cy, rad, Math.PI, Math.PI * 2); ctx.lineTo(SH.rx, top); };
    ctx.lineCap = "butt";
    path(); ctx.strokeStyle = "#5d636b"; ctx.lineWidth = SH.w; ctx.stroke();
    ctx.save(); ctx.translate(-12, -6); path(); ctx.strokeStyle = "rgba(170,178,188,0.55)"; ctx.lineWidth = 12; ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(16, 4); path(); ctx.strokeStyle = "rgba(25,27,31,0.55)"; ctx.lineWidth = 14; ctx.stroke(); ctx.restore();
    // rust bands on the shackle
    ctx.strokeStyle = "rgba(128,64,26,0.55)"; ctx.lineWidth = SH.w - 6;
    for (const [a0, a1] of [[1.1, 1.25], [1.62, 1.7], [1.83, 1.95]]) { ctx.beginPath(); ctx.arc(cx, SH.cy, rad, Math.PI * a0, Math.PI * a1); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(SH.lx, SH.cy + 40); ctx.lineTo(SH.lx, SH.cy + 85); ctx.moveTo(SH.rx, SH.cy + 20); ctx.lineTo(SH.rx, SH.cy + 50); ctx.stroke();
    ctx.restore();
  }
  function innerParts(t, dy, a) {      // x-ray only: legs inside the case, bolt, crust, cracks, trickling grains
    ctx.save(); ctx.globalAlpha *= a;
    const leg = (x, bot) => {
      ctx.fillStyle = "rgba(175,208,242,0.16)"; ctx.strokeStyle = "rgba(195,225,255,0.7)"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.rect(x - SH.w / 2, B.y + dy, SH.w, bot - B.y); ctx.fill(); ctx.stroke();
    };
    leg(SH.lx, SH.lBot); leg(SH.rx, SH.rBot);
    const open = openK(t), bx = 34 * clamp(open, 0, 1.2);
    ctx.fillStyle = "rgba(180,212,245,0.22)"; ctx.strokeStyle = "rgba(200,228,255,0.75)";
    K.rr(642 + bx, 1003, 256, 24, 10); ctx.fill(); ctx.stroke();
    const crustA = t < T.burst ? 1 : 1 - lin(T.burst, T.burst + 0.06, t);
    if (crustA > 0) {
      ctx.globalAlpha *= crustA;
      for (const [x, y, s, v] of CRUST) { ctx.fillStyle = v < 0.5 ? "rgba(112,56,22,0.93)" : "rgba(132,66,26,0.9)"; ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.78, v * 3, 0, Math.PI * 2); ctx.fill(); }
      const r = rng(13); for (let i = 0; i < 80; i++) { const c = CRUST[i % CRUST.length]; ctx.fillStyle = "rgba(190,110,50,0.6)"; ctx.fillRect(c[0] + (r() - 0.5) * c[2] * 1.4, c[1] + (r() - 0.5) * c[2], 2, 2); }
      ctx.globalAlpha /= crustA;
    }
    if (t > T.scan[1] && t < T.burst) {   // grains still falling from the crust onto the heap
      for (const [x, ph, sp] of GRAINS) { const u = ((t - T.scan[1]) * sp + ph) % 1; const y = lerp(1045, 1318 - 78 * Math.exp(-Math.pow((x - 775) / 135, 2)), u * u); ctx.fillStyle = `rgba(210,120,50,${0.8 * (1 - u)})`; ctx.fillRect(x, y, 3, 3); }
    }
    ctx.restore();
  }
  function cracks(k) {
    if (k <= 0.001) return;
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (const [w, col] of [[11, `rgba(255,140,40,${0.22 * k})`], [5, `rgba(255,175,80,${0.55 * k})`], [2.2, `rgba(255,235,185,${0.95 * k})`]]) {
      ctx.strokeStyle = col; ctx.lineWidth = w;
      for (const pts of CRACKS) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke(); }
    }
    ctx.restore();
  }
  function body(t, a, opts) {        // opts: {xray: 0..1 with scan line, warm, crack, open, inner}
    ctx.save(); ctx.globalAlpha *= a;
    ctx.drawImage(SOLID, B.x, B.y);
    if (opts.warm > 0.001) {
      ctx.save(); K.rr(B.x, B.y, B.w, B.h, B.r); ctx.clip();
      ctx.globalCompositeOperation = "screen";
      const g = ctx.createRadialGradient(SH.lx, B.y, 20, SH.lx, B.y, 640);
      g.addColorStop(0, `rgba(205,150,90,${0.75 * opts.warm})`); g.addColorStop(0.55, `rgba(120,88,58,${0.6 * opts.warm})`); g.addColorStop(1, `rgba(60,44,30,${0.45 * opts.warm})`);
      ctx.fillStyle = g; ctx.fillRect(B.x, B.y, B.w, B.h);
      ctx.restore();
    }
    if (opts.xray > 0.001) {
      ctx.save(); ctx.beginPath(); ctx.rect(B.x - 10, B.y - 200, B.w + 20, opts.scanY - (B.y - 200)); ctx.clip();
      ctx.globalAlpha *= opts.xray; ctx.drawImage(XRAY, B.x, B.y);
      innerParts(t, -75 * opts.open, 1);
      ctx.restore();
    }
    ctx.restore();
  }
  function escutcheon(t, glow) {
    ctx.save();
    const g = ctx.createRadialGradient(AX - 14, AY - 16, 4, AX, AY, 62);
    g.addColorStop(0, "#5d646e"); g.addColorStop(1, "#30343a");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(AX, AY, 60, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(160,168,180,0.45)"; ctx.lineWidth = 2.5; ctx.stroke();
    for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + k * Math.PI * 2 / 3; ctx.fillStyle = "#23262b"; ctx.beginPath(); ctx.arc(AX + Math.cos(a) * 47, AY + Math.sin(a) * 47, 4.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "#050506"; ctx.beginPath(); ctx.arc(AX, AY, 34, 0, Math.PI * 2); ctx.fill();
    if (glow > 0.001) { K.glow(AX, AY, 120, [255, 190, 100], 0.55 * glow); ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(255,214,150,${0.9 * glow})`; ctx.beginPath(); ctx.arc(AX, AY, 34, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    ctx.restore();
  }
  function keyBar(ph, a, ghost) {
    const ang = A0 + Math.PI * 2 * ph;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(AX, AY); ctx.rotate(ang);
    const L = R + 26;
    if (!ghost) { ctx.fillStyle = "rgba(0,0,0,0.35)"; K.rr(-L + 6, -22 + 8, 2 * L, 46, 23); ctx.fill(); }
    const g = ctx.createLinearGradient(0, -23, 0, 23); g.addColorStop(0, "#c4c9cf"); g.addColorStop(0.5, "#a3a9b0"); g.addColorStop(1, "#7c828a");
    ctx.fillStyle = ghost ? "#8e949b" : g; K.rr(-L, -23, 2 * L, 46, 23); ctx.fill();
    if (!ghost) {
      ctx.fillStyle = "rgba(128,64,26,0.5)"; K.rr(-L + 10, -10, 26, 20, 8); ctx.fill(); K.rr(L - 50, -16, 18, 30, 7); ctx.fill();
      ctx.fillStyle = "#16181b"; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * (R - 34), 0, 9, 0, Math.PI * 2); ctx.fill(); }
      const c = ctx.createRadialGradient(-8, -8, 3, 0, 0, 33); c.addColorStop(0, "#b6bcc3"); c.addColorStop(1, "#5f656c");
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, 31, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(30,32,36,0.6)"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "#d3d7dc"; ctx.beginPath(); ctx.arc(R, 0, 20, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#9097a0"; ctx.beginPath(); ctx.arc(R, 0, 12, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  function capA(t, [a, b]) { return Math.min(eout(lin(a, a + 0.33, t)), 1 - lin(b - 0.15, b, t)); }

  // ------------------------------------------------------------------ the frame
  function draw(t) {
    t = clamp(t, 0, DUR);
    if (t >= DUR - 1e-4) t = 0;                 // the loop point is frame 0
    K.clear("#000");
    const L = light(t), W_ = warmK(t);
    K.rays({ x: SH.lx, y: B.y - 30, k: rayK(t) * 0.75, t, n: 9, a0: -2.85, a1: -0.3, len: 1650, width: 0.085 });
    K.rays({ x: SH.lx, y: B.y - 30, k: rayK(t) * 0.45, t: t + 3, n: 7, a0: -2.7, a1: -0.45, len: 1400, width: 0.04, seed: 8 });
    K.glow(SH.lx + 40, B.y - 20, 760, [255, 170, 80], 0.34 * L);
    K.glow(SH.lx, B.y - 10, 300, [255, 205, 130], 0.55 * L);
    K.ground({ warm: W_, glowX: 700, glowW: 560 });

    const oa = oldA(t), na = t > 13.3 ? newA(t) : 0;
    const open = openK(t);
    // old lock (the one being opened)
    shackle(-75 * open, oa, false);
    if (open > 0.02 && oa > 0) {               // light pouring out of the freed shackle hole
      ctx.save(); ctx.globalAlpha = oa; ctx.globalCompositeOperation = "lighter";
      const g = ctx.createLinearGradient(0, B.y - 120, 0, B.y + 6); g.addColorStop(0, "rgba(255,200,120,0)"); g.addColorStop(1, `rgba(255,220,160,${0.7 * L})`);
      ctx.fillStyle = g; ctx.fillRect(SH.lx - SH.w / 2 - 6, B.y - 120, SH.w + 12, 126);
      ctx.restore();
    }
    body(t, oa, { xray: xrayK(t), scanY: t < T.scan[1] ? scanY(t) : B.y + B.h + 10, warm: W_, open });
    if (oa > 0) {
      ctx.save(); ctx.globalAlpha = oa;
      if (open > 0.02) { K.glow(SH.lx, B.y + 2, 90, [255, 225, 160], 0.9 * L); ctx.fillStyle = `rgba(255,236,190,${0.95 * Math.min(1, L * 1.4)})`; ctx.beginPath(); ctx.ellipse(SH.lx, B.y + 3, SH.w / 2 + 2, 7, 0, 0, Math.PI * 2); ctx.fill(); }
      cracks(crackK(t) * (t < T.burst ? xrayK(t) * (t < T.scan[1] ? clamp((scanY(t) - 1000) / 40, 0, 1) : 1) : 1));
      ctx.restore();
    }
    // the new lock (reset to the first frame)
    if (na > 0) { shackle(0, na, false); body(t, na, { xray: 0, scanY: 0, warm: 0, open: 0 }); }
    if (t < T.scan[0]) {                       // scan line idle: nothing; during the scan: the line
    } else if (t < T.scan[1] + 0.12) {
      ctx.save(); K.rr(B.x - 4, B.y - 4, B.w + 8, B.h + 8, B.r + 4); ctx.clip();
      K.scan({ y: scanY(t), x0: B.x - 4, x1: B.x + B.w + 4, a: 1 - lin(T.scan[1], T.scan[1] + 0.12, t) });
      ctx.restore();
    }
    escutcheon(t, Math.max(L * oa, 0));

    // key + motion smear
    const ph = phi(t), v = (phi(t) - phi(Math.max(0, t - 1 / 60))) * 60;
    if (Math.abs(v) > 1.1 && t < T.burst + 0.02) {
      const k = clamp((Math.abs(v) - 1.1) / 3, 0, 1);
      ctx.save(); ctx.globalAlpha = 0.11 * k; ctx.strokeStyle = "#e9edf2"; ctx.lineWidth = 40; ctx.lineCap = "round";
      const a1 = A0 + Math.PI * 2 * ph, a0 = A0 + Math.PI * 2 * phi(Math.max(0, t - 0.07));
      ctx.beginPath(); ctx.arc(AX, AY, R, a0, a1); ctx.stroke(); ctx.restore();
      for (let g = 3; g >= 1; g--) keyBar(phi(Math.max(0, t - g * 0.024)), [0, 0.34, 0.22, 0.12][g] * k, true);
    }
    keyBar(ph, 1, false);

    K.particles(PARTS, t, FLOOR);

    // figure (+ arm ghosts while cranking fast)
    const P = pose(t);
    const warmFig = (t < T.burst ? 0 : eout(lin(T.burst, T.burst + 0.6, t))) * (1 - sstep(13.2, 13.6, t));
    if (Math.abs(v) > 1.1 && t < T.burst + 0.02) {
      const k = clamp((Math.abs(v) - 1.1) / 3, 0, 1);
      for (let g = 3; g >= 1; g--) { const q = pose(Math.max(0, t - g * 0.024)); K.figure({ ...q, armsOnly: true, a: [0, 0.3, 0.18, 0.09][g] * k, warm: warmFig }); }
    }
    K.figure({ ...P, warm: warmFig });

    // counter
    const n = count(t);
    let roll = null;
    if (t >= 13.34) roll = { from: 101, to: 0, u: lin(13.34, 13.62, t) };
    const pop = (t >= T.t1 && t < T.t1 + 0.25 ? 0.1 * (1 - lin(T.t1, T.t1 + 0.25, t)) : 0) + (t >= T.t2 && t < T.t2 + 0.2 ? 0.07 * (1 - lin(T.t2, T.t2 + 0.2, t)) : 0)
      + (t >= 6.0 && t < 6.35 ? 0.1 * (1 - eout(lin(6.0, 6.35, t))) : 0) + (t >= T.burst && t < T.burst + 0.5 ? 0.16 * (1 - eout(lin(T.burst, T.burst + 0.5, t))) : 0);
    const flash = (t >= 6.0 && t < 6.45 ? 1 - lin(6.0, 6.45, t) : 0) + (t >= T.burst && t < 13.3 ? Math.max(0.25, 1 - lin(T.burst, T.burst + 0.7, t)) * (1 - lin(13.0, 13.3, t)) : 0);
    const gold = t >= T.burst ? 1 - lin(13.36, 13.6, t) : 0;
    const shown = roll ? (roll.u >= 1 ? 0 : 101) : n;
    K.counter({ n: shown, label: (roll && roll.u > 0.5) || shown !== 1 ? "TURNS" : "TURN", gold, pop, flash: Math.min(1, flash), roll });

    // captions
    if (!window.SK_NO_CAPTIONS) for (const key of ["c1", "c2", "c3", "c4"]) {
      const a = capA(t, T[key]);
      if (a > 0) K.caption({ lines: CAP[key], a, rise: 10 * (1 - eout(lin(T[key][0], T[key][0] + 0.33, t))) });
    }
    if (t >= T.burst && t < T.burst + 0.4) K.glow(SH.lx, B.y, 520, [255, 214, 150], 0.5 * (1 - eout(lin(T.burst, T.burst + 0.4, t))));
  }
  return { draw, DUR, T, count, phi, INC };
};

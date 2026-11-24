/* riddle-cutaway kit: a seek-safe Canvas2D shot player + flat-vector primitives (dark outline, pastel fills) for the
   "cutaway building riddle" reel format. Everything drawn is a pure function of t.
   RC.create({canvas, width, height}) -> K ; K.play(shots) ; K.render(t)
   shot = {t0, xf (cross-dissolve s), draw(ctx, lt, u, t)} ; t1 = next shot's t0 */
(function () {
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const E = {
    lin: (t) => t,
    io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    o: (t) => 1 - Math.pow(1 - t, 3),
    i: (t) => t * t * t,
    sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    back: (t) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  };
  const ramp = (t, a, b, e) => { const u = clamp((t - a) / Math.max(1e-6, b - a)); return e ? e(u) : u; };
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003) / 1000003; }; }

  // palette measured on the source (SKILL.md §4) + our night colours
  const P = {
    ink: "#2b2f38", slate: "#424b59", slateLt: "#5a6474", grey: "#828993", greyLt: "#a9afb8", cream: "#f0e9d8", beige: "#ded4ba",
    sky: "#b7d0dc", skyDay: "#8fcbe6", amber: "#e8a53a", amberDk: "#c9852a", brown: "#895c33", brownLt: "#a8743f", wood: "#9a6638",
    night: "#2a3350", nightLt: "#39446a", stair: "#c9ccd6", stairDk: "#aeb3c0", white: "#fbf8f1", red: "#d9544a", teal: "#4f9a98",
    rooms: ["#f6d9c0", "#f4cfcf", "#dcdcef", "#d5e8d4", "#f2e8c8", "#e3d3ea"],
    pill: "#1f2633", gold: "#f2b630",
  };

  function create({ canvas, width, height }) {
    const ctx = canvas.getContext("2d");
    const off = document.createElement("canvas");
    off.width = width; off.height = height;
    const octx = off.getContext("2d");
    let shots = [];
    const K = {
      W: width, H: height, ctx, P, E, D, ramp, clamp, lerp, rng,
      ready: Promise.all([
        document.fonts ? document.fonts.load('700 40px "RSlab"') : Promise.resolve(),
        document.fonts ? document.fonts.load('400 40px "RSlabR"') : Promise.resolve(),
      ]).catch(() => {}),
      play(list) { shots = list.slice().sort((a, b) => a.t0 - b.t0); },
      shotAt(t) { let k = 0; for (let i = 0; i < shots.length; i++) if (shots[i].t0 <= t) k = i; return k; },
      render(t) {
        const k = K.shotAt(t), s = shots[k];
        const t1 = k + 1 < shots.length ? shots[k + 1].t0 : 1e9;
        const xf = s.xf || 0;
        if (k > 0 && xf > 0 && t < s.t0 + xf) {
          drawShot(ctx, shots[k - 1], t, s.t0 + xf);
          drawShot(octx, s, t, t1);
          ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = E.sine(clamp((t - s.t0) / xf)); ctx.drawImage(off, 0, 0); ctx.restore();
        } else drawShot(ctx, s, t, t1);
      },
    };
    function drawShot(c, s, t, t1) {
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
      c.fillStyle = s.bg || P.night; c.fillRect(0, 0, width, height);
      const lt = t - s.t0, u = clamp(lt / Math.max(0.01, t1 - s.t0));
      s.draw(c, lt, u, t);
      c.restore();
    }
    return K;
  }

  // ---------------------------------------------------------------- helpers
  const D = {};
  const LW = 3;
  D.cam = (c, x, y, s = 1, W = 1080, H = 1920) => c.setTransform(s, 0, 0, s, W / 2 - x * s, H / 2 - y * s); // world (x, y) -> frame centre
  D.st = (c, col = P.ink, lw = LW) => { c.strokeStyle = col; c.lineWidth = lw; c.lineJoin = "round"; c.lineCap = "round"; c.stroke(); };
  D.fs = (c, fill, col = P.ink, lw = LW) => { if (fill) { c.fillStyle = fill; c.fill(); } if (col) D.st(c, col, lw); };
  D.rect = (c, x, y, w, h, fill, col = P.ink, lw = LW) => { c.beginPath(); c.rect(x, y, w, h); D.fs(c, fill, col, lw); };
  D.rr = (c, x, y, w, h, r, fill, col = P.ink, lw = LW) => { c.beginPath(); c.roundRect(x, y, w, h, r); D.fs(c, fill, col, lw); };
  D.ell = (c, x, y, rx, ry, fill, col = P.ink, lw = LW) => { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2); D.fs(c, fill, col, lw); };
  D.line = (c, x0, y0, x1, y1, col = P.ink, lw = LW) => { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); D.st(c, col, lw); };
  D.text = (c, txt, x, y, size, col, o = {}) => {
    c.save(); c.font = `${o.weight || 700} ${size}px ${o.font || '"RSlab", Rockwell, serif'}`; c.textAlign = o.align || "center"; c.textBaseline = o.base || "middle";
    c.fillStyle = col; c.fillText(txt, x, y); c.restore();
  };
  // dark rounded pill with text (the source's caption / counter style), drawn in screen space
  D.pill = (c, txt, cx, cy, size, o = {}) => {
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha *= o.a == null ? 1 : o.a;
    c.font = `700 ${size}px "RSlab", Rockwell, serif`;
    const w = c.measureText(txt).width + size * 1.1, h = size * 1.55;
    const sc = o.scale == null ? 1 : o.scale;
    c.translate(cx, cy); c.scale(sc, sc);
    c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, h * 0.22); c.fillStyle = o.bg || P.pill; c.fill();
    c.fillStyle = o.col || P.white; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, 0, size * 0.04);
    c.restore();
  };

  // ---------------------------------------------------------------- characters (flat, outlined)
  // head with dot eyes; o: x, y (centre), r, skin, hair ("bald" | "bun" | "beard" | "short"), eyes ("open" | "closed" | "wide" | "laugh"),
  // mouth ("flat" | "smile" | "open" | "o" | "snore"), glasses, look (-1..1), tilt
  D.head = (c, o) => {
    const r = o.r || 40;
    c.save(); c.translate(o.x, o.y); c.rotate(o.tilt || 0);
    if (o.hair === "bun") { D.ell(c, -r * 0.1, -r * 1.05, r * 0.42, r * 0.36, "#2a1f1c"); }
    D.ell(c, 0, 0, r, r * 1.02, o.skin || "#f0c49a");
    if (o.hair === "bun") { c.beginPath(); c.ellipse(0, -r * 0.18, r * 1.0, r * 0.88, 0, Math.PI * 1.02, Math.PI * 1.98); c.lineTo(r * 0.98, -r * 0.1); c.quadraticCurveTo(0, -r * 0.62, -r * 0.98, -r * 0.1); c.closePath(); D.fs(c, "#2a1f1c"); }
    if (o.hair === "bald") { c.beginPath(); c.arc(0, 0, r * 0.98, Math.PI * 0.82, Math.PI * 1.08); D.st(c, "#9a9aa0", r * 0.22); c.beginPath(); c.arc(0, 0, r * 0.98, -Math.PI * 0.08, Math.PI * 0.18); D.st(c, "#9a9aa0", r * 0.22); }
    if (o.hair === "short") { c.beginPath(); c.ellipse(0, -r * 0.2, r * 1.02, r * 0.9, 0, Math.PI, Math.PI * 2); c.closePath(); D.fs(c, "#3a2a22"); }
    if (o.hair === "beard") {
      c.beginPath(); c.ellipse(0, -r * 0.32, r * 0.96, r * 0.7, 0, Math.PI * 1.08, Math.PI * 1.92); c.closePath(); D.fs(c, "#2a201c");
      c.beginPath(); c.moveTo(-r * 0.9, r * 0.25); c.quadraticCurveTo(-r * 0.8, r * 1.2, 0, r * 1.22); c.quadraticCurveTo(r * 0.8, r * 1.2, r * 0.9, r * 0.25);
      c.quadraticCurveTo(r * 0.45, r * 0.7, 0, r * 0.66); c.quadraticCurveTo(-r * 0.45, r * 0.7, -r * 0.9, r * 0.25); c.closePath(); D.fs(c, "#2a201c");
    }
    const lx = (o.look || 0) * r * 0.12, ey = -r * 0.08, ex = r * 0.36;
    const eyes = o.eyes || "open";
    for (const sx of [-1, 1]) {
      if (eyes === "closed") { c.beginPath(); c.arc(sx * ex, ey, r * 0.13, 0.15 * Math.PI, 0.85 * Math.PI); D.st(c, P.ink, r * 0.07); }
      else if (eyes === "laugh") { c.beginPath(); c.arc(sx * ex, ey + r * 0.08, r * 0.13, 1.15 * Math.PI, 1.85 * Math.PI); D.st(c, P.ink, r * 0.07); }
      else { const er = eyes === "wide" ? r * 0.12 : r * 0.09; D.ell(c, sx * ex, ey, r * 0.19, r * (eyes === "wide" ? 0.22 : 0.19), "#fbf8f1", P.ink, r * 0.04); D.ell(c, sx * ex + lx, ey + r * 0.02, er, er * (eyes === "wide" ? 1.15 : 1), P.ink, null); D.ell(c, sx * ex + lx + er * 0.3, ey - er * 0.25, er * 0.3, er * 0.3, "#fff", null); }
    }
    if (o.glasses) { for (const sx of [-1, 1]) D.ell(c, sx * ex, ey, r * 0.24, r * 0.22, null, P.ink, r * 0.06); D.line(c, -ex + r * 0.24, ey, ex - r * 0.24, ey, P.ink, r * 0.06); }
    D.ell(c, -r * 0.55, r * 0.28, r * 0.14, r * 0.1, "rgba(220,110,100,0.35)", null); D.ell(c, r * 0.55, r * 0.28, r * 0.14, r * 0.1, "rgba(220,110,100,0.35)", null);
    const m = o.mouth || "flat", my = r * 0.42;
    if (m === "smile") { c.beginPath(); c.arc(0, my - r * 0.12, r * 0.24, 0.15 * Math.PI, 0.85 * Math.PI); D.st(c, P.ink, r * 0.07); }
    else if (m === "open" || m === "snore") { D.ell(c, 0, my, r * (m === "snore" ? 0.2 : 0.17), r * (m === "snore" ? 0.16 : 0.14), "#7a2e2e", P.ink, r * 0.05); }
    else if (m === "o") { D.ell(c, 0, my, r * 0.09, r * 0.11, "#7a2e2e", P.ink, r * 0.05); }
    else if (m === "laugh") { c.beginPath(); c.moveTo(-r * 0.3, my - r * 0.06); c.quadraticCurveTo(0, my + r * 0.4, r * 0.3, my - r * 0.06); c.closePath(); D.fs(c, "#7a2e2e", P.ink, r * 0.05); }
    else { D.line(c, -r * 0.14, my, r * 0.14, my, P.ink, r * 0.07); }
    c.restore();
  };
  // a person standing (side-ish front view): x, y = feet; o: s, skin, shirt, pants, hair, eyes, mouth, glasses, arm (rad, right arm), armL, walk, carry ("case" | "tray")
  D.person = (c, o) => {
    const s = o.s || 1;
    c.save(); c.translate(o.x, o.y); c.scale(s * (o.f || 1), s);
    const wk = o.walk || 0;
    for (const [sx, k] of [[-14, 1], [14, -1]]) { // legs
      c.save(); c.translate(sx, -150); c.rotate(k * wk * 0.35);
      D.rr(c, -13, 0, 26, 150, 8, o.pants || "#4a4f5c"); D.rr(c, -16, 138, 36, 16, 6, "#2a2a30");
      c.restore();
    }
    D.rr(c, -40, -300, 80, 170, 22, o.shirt || P.teal); // torso
    if (o.stripes) { c.save(); c.beginPath(); c.roundRect(-40, -300, 80, 170, 22); c.clip(); for (let k = -3; k < 4; k++) D.line(c, k * 20, -300, k * 20, -130, o.stripes, 5); c.restore(); D.rr(c, -40, -300, 80, 170, 22, null); }
    if (o.vest) { c.beginPath(); c.moveTo(-40, -270); c.lineTo(-10, -170); c.lineTo(-10, -130); c.lineTo(-40, -130); c.closePath(); D.fs(c, o.vest); c.beginPath(); c.moveTo(40, -270); c.lineTo(10, -170); c.lineTo(10, -130); c.lineTo(40, -130); c.closePath(); D.fs(c, o.vest); }
    const arm = (side, a) => { c.save(); c.translate(side * 38, -285); c.rotate(a); D.rr(c, -11, 0, 22, 120, 10, o.shirt || P.teal); D.ell(c, 0, 126, 13, 13, o.skin || "#f0c49a"); c.restore(); };
    arm(-1, o.armL != null ? o.armL : 0.15); arm(1, o.arm != null ? o.arm : -0.15);
    if (o.carry === "case") { D.rr(c, 40, -150, 80, 60, 8, "#7a4e9a"); D.line(c, 60, -150, 60, -165); D.line(c, 100, -150, 100, -165); D.line(c, 60, -165, 100, -165); }
    if (o.carry === "tray") { D.rr(c, -70, -205, 140, 12, 4, "#c9ccd6"); D.rr(c, -20, -240, 36, 36, 6, P.white); c.beginPath(); c.arc(18, -222, 9, -1.2, 1.2); D.st(c); }
    D.head(c, Object.assign({}, o, { x: 0, y: -350, r: 48 }));
    c.restore();
  };
  // a guest in bed (side cutaway): bed x0..x1 at floor y; headboard at the `head` side (-1 left, 1 right); o: sit 0..1 (sitting up), skin, shirt, stripes, hair,
  // eyes, mouth, glasses, arm (receiver to the ear 0..1), blanket colour, occupied
  D.bed = (c, x0, x1, y, o) => {
    const hd = o.head || 1, hx = hd > 0 ? x1 : x0, w = x1 - x0;
    D.rr(c, x0, y - 70, w, 70, 6, o.frame || "#8a5a36");               // bed frame
    D.rr(c, hd > 0 ? x1 - 22 : x0 - 8, y - 190, 30, 190, 8, o.frame || "#8a5a36"); // headboard
    D.rr(c, x0 + 6, y - 112, w - 12, 46, 14, P.white);                 // mattress
    const px = hx - hd * 70;
    if (o.occupied !== false) {
      const sit = o.sit || 0;
      // body under the blanket, head on the pillow or sitting up
      const headX = px - hd * lerp(0, 40, sit), headY = y - lerp(150, 250, sit);
      D.rr(c, px - 46, y - 150, 92, 40, 16, "#ffffff");                 // pillow
      if (sit > 0.05) {
        c.save(); c.translate(headX, y - 120); c.rotate(-hd * (1 - sit) * 1.2);
        D.rr(c, -38, -110 * sit - 20, 76, 110 * sit + 30, 20, o.shirt || P.teal);
        if (o.stripes) { c.save(); c.beginPath(); c.roundRect(-38, -110 * sit - 20, 76, 110 * sit + 30, 20); c.clip(); for (let k = -3; k < 4; k++) D.line(c, k * 18, -200, k * 18, 40, o.stripes, 5); c.restore(); D.rr(c, -38, -110 * sit - 20, 76, 110 * sit + 30, 20, null); }
        c.restore();
      }
      // blanket
      c.beginPath(); c.moveTo(hd > 0 ? x0 + 10 : x1 - 10, y - 66);
      const bx = px - hd * lerp(40, 70, sit);
      c.lineTo(hd > 0 ? x0 + 10 : x1 - 10, y - 120); c.quadraticCurveTo((x0 + x1) / 2, y - (o.lump || 160), bx, y - lerp(118, 100, sit)); c.lineTo(bx, y - 66); c.closePath();
      D.fs(c, o.blanket || "#5b7fb5");
      if (sit < 0.05 && o.arm) { /* lying with the receiver */ }
      D.head(c, Object.assign({}, o, { x: headX, y: headY, r: o.r || 44, tilt: -hd * (1 - sit) * 1.3 + (o.tilt || 0) }));
      if (o.arm) { // receiver at the ear
        c.save(); c.translate(headX - hd * 46, headY + 10); c.rotate(hd * 0.5);
        D.rr(c, -12, -40, 24, 80, 10, "#2e3440"); c.restore();
      }
    } else {
      D.rr(c, px - 46, y - 150, 92, 40, 16, "#ffffff");
      D.rr(c, x0 + 10, y - 124, w - 20, 58, 10, o.blanket || "#5b7fb5");
    }
  };
  // desk phone: x, y = base centre; ring 0..1 shakes it and draws ring lines; lifted hides the handset
  D.phone = (c, x, y, s = 1, o = {}) => {
    c.save(); c.translate(x + (o.ring ? Math.sin(o.t * 60) * 3 * o.ring : 0), y); c.scale(s, s);
    D.rr(c, -34, -30, 68, 30, 8, o.col || "#c9544a");
    D.rr(c, -14, -24, 28, 14, 3, "#f6f0e2", P.ink, 2);
    if (!o.lifted) { c.beginPath(); c.moveTo(-40, -30); c.quadraticCurveTo(0, -56, 40, -30); c.lineTo(36, -24); c.quadraticCurveTo(0, -44, -36, -24); c.closePath(); D.fs(c, o.col || "#c9544a"); }
    if (o.ring) { c.save(); c.globalAlpha *= o.ring; for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(sx * 30, -40, 26 + k * 16 + (o.t * 60 % 16), sx > 0 ? -1.0 : Math.PI - 0.0 - 1.0 + 2.0 - 1.0, sx > 0 ? 0.0 : Math.PI); D.st(c, P.ink, 3); } c.restore(); }
    c.restore();
  };
  // a "Z" (sleep / snore) glyph
  D.zz = (c, x, y, size, a = 1, col = P.ink) => { c.save(); c.globalAlpha *= a; D.text(c, "Z", x, y, size, col, { weight: 700 }); c.restore(); };
  D.qmark = (c, x, y, size, a = 1) => { c.save(); c.globalAlpha *= a; D.text(c, "?", x, y, size, P.red, { weight: 700 }); c.restore(); };
  // sound waves (arcs) travelling from (x, y) in direction dir (1 right, -1 left)
  D.waves = (c, x, y, t, k, dir = 1, col = P.ink, n = 4, span = 220) => {
    if (k <= 0) return;
    c.save(); c.globalAlpha *= k;
    for (let i = 0; i < n; i++) {
      const ph = ((t * 1.6 + i / n) % 1), r = 30 + ph * span;
      c.globalAlpha = k * (1 - ph);
      c.beginPath(); c.arc(x, y, r, dir > 0 ? -0.6 : Math.PI - 0.6, dir > 0 ? 0.6 : Math.PI + 0.6); D.st(c, col, 6);
    }
    c.restore();
  };

  window.RC = { create, D, P, E, ramp, clamp, lerp, rng };
})();

/* riddle-cutaway kit EXTENSION (v2, batch 8b): shared building blocks lifted out of the first film + new costume options.
   Load after kit.js. Everything is additive: kit.js behaves exactly as before.
   D.headX(c, o)       D.head + o.hairType ("curly" | "kid" | "long"), o.hairCol, o.hat ("chef" | "cap" | "nurse" | "bandana"), o.moustache
   D.personX(c, o)     D.person + o.apron, o.coat (long coat colour), o.carry ("pans" | "glass" | "clipboard" | "cake"), o.hatOpts via headX
   D.stairCore(c, n, y, FH, x0, x1)   the stair core of one floor (two flights, plate, big number)
   D.counterPill(c, txt, a)           top-centre counter (amber digits) at y 219
   D.frameView(c, label, stamp, tint) framed reveal view: a colour-blend tint + scan lines + corner brackets + label + timestamp
   D.ringTimer(c, x, y, r, n, frac, pulse)   the countdown ring
   D.cardFooter(c, t, upT, cy)        "Comment your answer" -> "Time's up" pill
   D.wallClock(c, x, y, r, hours, minutes, o)   an analog wall clock (hands from h/m, numerals)
   D.burst(c, x, y, r, txt, k, col)   a comic starburst ("BANG!") */
(function () {
  const { D, P, lerp, ramp, E } = window.RC;
  D.headX = (c, o) => {
    const r = o.r || 40, hc = o.hairCol || "#3a2a22";
    c.save(); c.translate(o.x, o.y); c.rotate(o.tilt || 0);
    if (o.hairType === "long" || o.hairType === "curly") { // hair behind the head
      c.beginPath(); c.ellipse(0, r * 0.15, r * 1.18, r * 1.25, 0, 0, Math.PI * 2); D.fs(c, hc);
    }
    if (o.hairType === "kid") for (const sx of [-1, 1]) D.ell(c, sx * r * 1.05, r * 0.05, r * 0.32, r * 0.42, hc);
    c.restore();
    D.head(c, Object.assign({}, o, { hair: o.hair || "none" }));
    c.save(); c.translate(o.x, o.y); c.rotate(o.tilt || 0);
    if (o.hairType === "curly") for (let k = 0; k < 9; k++) { const a = Math.PI * (1.05 + k * 0.1); D.ell(c, Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92, r * 0.3, r * 0.28, hc); }
    if (o.hairType === "long" || o.hairType === "kid") { c.beginPath(); c.ellipse(0, -r * 0.25, r * 1.02, r * 0.82, 0, Math.PI * 1.03, Math.PI * 1.97); c.lineTo(r * 0.95, -r * 0.05); c.quadraticCurveTo(r * 0.2, -r * 0.55, -r * 0.95, -r * 0.05); c.closePath(); D.fs(c, hc); }
    if (o.moustache) { c.beginPath(); c.moveTo(-r * 0.36, r * 0.36); c.quadraticCurveTo(0, r * 0.12, r * 0.36, r * 0.36); c.quadraticCurveTo(0, r * 0.26, -r * 0.36, r * 0.36); D.fs(c, o.moustacheCol || "#2a201c"); }
    if (o.hat === "chef") { D.rr(c, -r * 0.8, -r * 1.25, r * 1.6, r * 0.42, r * 0.1, "#fbf8f1"); for (const [dx, rr] of [[-r * 0.45, r * 0.45], [0, r * 0.55], [r * 0.45, r * 0.45]]) D.ell(c, dx, -r * 1.45, rr, rr * 0.9, "#fbf8f1"); D.rr(c, -r * 0.8, -r * 1.25, r * 1.6, r * 0.42, r * 0.1, "#fbf8f1"); }
    if (o.hat === "cap") { c.beginPath(); c.ellipse(0, -r * 0.45, r * 0.98, r * 0.7, 0, Math.PI, Math.PI * 2); c.closePath(); D.fs(c, o.hatCol || "#c9544a"); D.rr(c, -r * 0.1, -r * 0.55, r * 1.25, r * 0.22, r * 0.1, o.hatCol || "#c9544a"); }
    if (o.hat === "nurse") { c.beginPath(); c.moveTo(-r * 0.7, -r * 0.75); c.lineTo(-r * 0.55, -r * 1.25); c.lineTo(r * 0.55, -r * 1.25); c.lineTo(r * 0.7, -r * 0.75); c.closePath(); D.fs(c, "#fbf8f1"); D.line(c, -r * 0.12, -r * 1.0, r * 0.12, -r * 1.0, P.red, r * 0.08); D.line(c, 0, -r * 1.12, 0, -r * 0.88, P.red, r * 0.08); }
    if (o.hat === "bandana") { c.beginPath(); c.ellipse(0, -r * 0.4, r * 1.0, r * 0.68, 0, Math.PI, Math.PI * 2); c.closePath(); D.fs(c, o.hatCol || "#3f7fbf"); D.ell(c, r * 0.95, -r * 0.35, r * 0.2, r * 0.14, o.hatCol || "#3f7fbf"); }
    c.restore();
  };
  D.personX = (c, o) => {
    const s = o.s || 1;
    const base = Object.assign({}, o);
    delete base.carry;
    // body via the kit, head re-drawn with headX on top
    c.save(); c.translate(o.x, o.y); c.scale(s * (o.f || 1), s);
    if (o.coat) { D.rr(c, -46, -305, 92, 250, 24, o.coat); }
    c.restore();
    D.person(c, Object.assign(base, { hair: "none", eyes: o.eyes, carry: o.carry === "case" || o.carry === "tray" ? o.carry : undefined }));
    c.save(); c.translate(o.x, o.y); c.scale(s * (o.f || 1), s);
    if (o.coat) { c.beginPath(); c.moveTo(-40, -290); c.lineTo(-46, -60); c.lineTo(-6, -60); c.lineTo(0, -250); c.lineTo(6, -60); c.lineTo(46, -60); c.lineTo(40, -290); D.fs(c, null, P.ink, 3); }
    if (o.apron) { D.rr(c, -32, -250, 64, 150, 10, o.apron); D.line(c, -32, -250, -38, -292, P.ink, 3); D.line(c, 32, -250, 38, -292, P.ink, 3); }
    if (o.carry === "pans") for (const sx of [-1, 1]) { c.save(); c.translate(sx * 70, -330 + (o.panUp || 0) * -60); c.rotate(sx * (0.3 + (o.panUp || 0) * 0.6)); D.ell(c, 0, 0, 46, 46, "#5a6070"); D.ell(c, 0, 0, 36, 36, "#3a3f4a", null); D.rr(c, -6, 40, 12, 70, 5, "#2b2f38"); c.restore(); }
    if (o.carry === "glass") { c.save(); c.translate(70, -190); D.rr(c, -16, -40, 32, 48, 5, "rgba(180,220,240,0.9)"); D.rect(c, -14, -22 + (o.glassLevel != null ? (1 - o.glassLevel) * 28 : 0), 28, 28 * (o.glassLevel != null ? o.glassLevel : 1), "rgba(110,170,220,0.9)", null); c.restore(); }
    if (o.carry === "clipboard") { c.save(); c.translate(56, -200); c.rotate(-0.15); D.rr(c, -30, -44, 60, 84, 6, "#a8743f"); D.rect(c, -22, -34, 44, 66, P.white, P.ink, 2); for (let k = 0; k < 4; k++) D.line(c, -16, -22 + k * 14, 14, -22 + k * 14, "#9aa0aa", 2); c.restore(); }
    c.restore();
    D.headX(c, Object.assign({}, o, { x: o.x, y: o.y - 350 * s, r: 48 * s, tilt: (o.tilt || 0) }));
  };
  D.stairCore = (c, n, y, FH, x0, x1, o = {}) => {
    D.rect(c, x0, y - FH, x1 - x0, FH, o.col || P.stair, null);
    const flight = (ax, ay, bx, by) => { c.beginPath(); c.moveTo(ax, ay); const N = 7; for (let k = 1; k <= N; k++) { const xa = lerp(ax, bx, (k - 0.5) / N), xb = lerp(ax, bx, k / N); c.lineTo(xa, lerp(ay, by, (k - 1) / N)); c.lineTo(xa, lerp(ay, by, k / N)); c.lineTo(xb, lerp(ay, by, k / N)); }
      c.lineTo(bx, by + 26); c.lineTo(ax, ay + 26); c.closePath(); D.fs(c, P.stairDk, P.ink, 2.4); D.line(c, ax, ay - 40, bx, by - 40, P.ink, 2.4); };
    flight(x0 + 20, y, x1 - 30, y - FH / 2);
    D.rect(c, x1 - 40, y - FH / 2, 40, 14, P.stairDk, P.ink, 2.4);
    flight(x1 - 40, y - FH / 2, x0 + 30, y - FH + 14);
    D.text(c, String(o.label != null ? o.label : n), x0 + 60, y - FH * 0.72, 54, "#9b8a73");
    D.rr(c, x0 + 24, y - FH + 30, 74, 26, 4, P.cream, P.ink, 2); D.text(c, "Stairs", x0 + 61, y - FH + 43, 15, P.ink);
  };
  D.counterPill = (c, txt, a = 1) => D.pill(c, txt, 540, 219, 52, { col: P.amber, a });
  D.frameView = (c, label, stamp, tint, o = {}) => {
    const W = 1080, H = 1920;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    if (tint) { c.globalCompositeOperation = "color"; c.fillStyle = tint; c.fillRect(0, 0, W, H); c.globalCompositeOperation = "source-over"; }
    c.fillStyle = o.scan || "rgba(20,20,20,0.10)"; for (let y = 0; y < H; y += 6) c.fillRect(0, y, W, 2);
    for (const [x, y, sx, sy] of [[60, 470, 1, 1], [1020, 470, -1, 1], [60, 1760, 1, -1], [1020, 1760, -1, -1]]) { c.beginPath(); c.moveTo(x, y + sy * 70); c.lineTo(x, y); c.lineTo(x + sx * 70, y); D.st(c, P.white, 6); }
    c.font = '700 24px "RSlab", Rockwell, serif';
    const lw = c.measureText(label).width + 70;
    D.rr(c, 70, 485, lw, 46, 8, "rgba(31,38,51,0.92)", null); D.ell(c, 96, 508, 9, 9, P.red, null); D.text(c, label, 112, 509, 24, P.white, { align: "left" });
    D.rr(c, 700, 1690, 300, 46, 8, "rgba(31,38,51,0.92)", null); D.text(c, stamp, 850, 1714, 24, P.white);
    c.restore();
  };
  D.ringTimer = (c, x, y, r, n, frac, pulse = 1) => {
    c.save(); c.translate(x, y); c.scale(pulse, pulse);
    D.ell(c, 0, 0, r, r, P.white, P.ink, 4);
    if (n > 0) { c.beginPath(); c.arc(0, 0, r * 0.91, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); D.st(c, P.red, r * 0.13); }
    D.text(c, String(n), 0, r * 0.05, r, P.ink);
    c.restore();
  };
  D.cardFooter = (c, t, upT, cy = 1390) => {
    const up = ramp(t, upT - 0.25, upT + 0.05, E.back);
    if (up < 0.5) { D.rr(c, 300, cy - 30, 64, 50, 12, P.amber, P.ink, 3); c.beginPath(); c.moveTo(316, cy + 16); c.lineTo(308, cy + 38); c.lineTo(334, cy + 18); D.fs(c, P.amber); D.text(c, "Comment your answer", 640, cy - 4, 46, P.ink); }
    else D.pill(c, "Time's up", 540, cy, 64, { col: P.amber, scale: up });
  };
  D.wallClock = (c, x, y, r, hours, minutes, o = {}) => {
    D.ell(c, x, y, r + r * 0.08, r + r * 0.08, o.rim || "#3a4152");
    D.ell(c, x, y, r, r, o.face || P.white, P.ink, Math.max(2, r * 0.03));
    for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; D.line(c, x + Math.sin(a) * r * 0.82, y - Math.cos(a) * r * 0.82, x + Math.sin(a) * r * 0.92, y - Math.cos(a) * r * 0.92, P.ink, Math.max(2, r * 0.035)); }
    if (o.numerals) for (const k of [12, 3, 6, 9]) { const a = (k % 12) * Math.PI / 6; D.text(c, String(k), x + Math.sin(a) * r * 0.68, y - Math.cos(a) * r * 0.68, r * 0.2, P.ink); }
    const mA = (minutes / 60) * Math.PI * 2, hA = ((hours % 12) + minutes / 60) / 12 * Math.PI * 2;
    D.line(c, x, y, x + Math.sin(hA) * r * 0.5, y - Math.cos(hA) * r * 0.5, P.ink, Math.max(3, r * 0.07));
    D.line(c, x, y, x + Math.sin(mA) * r * 0.78, y - Math.cos(mA) * r * 0.78, o.minCol || P.ink, Math.max(2, r * 0.045));
    D.ell(c, x, y, r * 0.06, r * 0.06, P.red, null);
  };
  D.burst = (c, x, y, r, txt, k = 1, col = "#ffd65a") => {
    if (k <= 0) return;
    c.save(); c.translate(x, y); c.scale(k, k); c.rotate(-0.08);
    c.beginPath(); const N = 14; for (let i = 0; i <= N * 2; i++) { const a = i * Math.PI / N, rr = i % 2 ? r * 0.62 : r; i ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    c.closePath(); D.fs(c, col, P.ink, 5);
    D.text(c, txt, 0, 4, r * 0.42, P.ink);
    c.restore();
  };
})();

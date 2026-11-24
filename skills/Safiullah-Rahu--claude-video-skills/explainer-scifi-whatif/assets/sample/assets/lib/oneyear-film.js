/* oneyear-film.js — "One Year Away" (16:9 sci-fi what-if). window.ONEYEAR(canvas, V) -> { draw(t), scenes }
   Scenes are drawn whole; a scene with xf > 0 dissolves in over xf seconds (the outgoing scene keeps moving). */
window.ONEYEAR = function (canvas, V) {
  const ctx = canvas.getContext("2d");
  const off = document.createElement("canvas"); off.width = 1920; off.height = 1080;
  const G1 = window.SCIFI.kit(ctx), G2 = window.SCIFI.kit(off.getContext("2d"));
  const { clamp, lerp, sm, eo, eio, P } = G1;
  const S = (id) => V.L(id).start, E = (id) => V.L(id).end, w = (id, word, k) => V.w(id, word, k);
  const sc = [];
  const scene = (t0, o) => { o.t0 = t0; sc.push(o); return o; };

  // ---- common sets ----
  function cabin(G, t, o) {
    o = o || {};
    const c = G.ctx;
    G.ground("#141c2c", "#070b14");
    // wall panels
    c.strokeStyle = "rgba(120,140,170,0.10)"; c.lineWidth = 2;
    for (let x = 60; x < 1920; x += 240) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 1080); c.stroke(); }
    c.fillStyle = "#0d1320"; c.fillRect(0, 860, 1920, 220);
    c.fillStyle = "rgba(98,232,244,0.10)"; c.fillRect(0, 858, 1920, 3);
    // the window
    const wx = o.wx || 1180, wy = o.wy || 430, wr = o.wr || 300;
    c.save(); c.beginPath(); c.arc(wx, wy, wr, 0, Math.PI * 2); c.clip();
    c.fillStyle = "#02040a"; c.fillRect(wx - wr, wy - wr, wr * 2, wr * 2);
    G.stars(t, { seed: 11, n: 160, x: wx - wr, y: wy - wr, w: wr * 2, h: wr * 2, speed: o.warp || 0, cx: wx, cy: wy, drift: o.warp ? 0 : 6 });
    if (o.view) o.view(wx, wy, wr);
    c.restore();
    c.lineWidth = 26; c.strokeStyle = "#c9d1dc"; c.beginPath(); c.arc(wx, wy, wr + 12, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 6; c.strokeStyle = "#8a96a6"; c.beginPath(); c.arc(wx, wy, wr + 28, 0, Math.PI * 2); c.stroke();
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; c.fillStyle = "#6a7686"; c.beginPath(); c.arc(wx + Math.cos(a) * (wr + 12), wy + Math.sin(a) * (wr + 12), 5, 0, Math.PI * 2); c.fill(); }
    // console
    c.fillStyle = "#1b2436"; G.rr(120, 760, 520, 120, 18); c.fill();
    for (let k = 0; k < 12; k++) { const on = Math.sin(t * (1 + k * 0.37) + k) > 0.2; c.fillStyle = on ? (k % 3 ? P.cyan : P.orange) : "#2a3446"; c.fillRect(150 + k * 38, 790, 18, 8); }
    c.fillStyle = "#0b1a24"; G.rr(160, 815, 200, 46, 8); c.fill();
    G.text(o.screenTxt || "NAV · NOMINAL", 172, 846, { size: 18, weight: 500, fam: G.F.mono, color: P.cyan });
  }
  function seatYou(G, t, x, y, expr, look) { // seated, facing right
    const c = G.ctx;
    c.fillStyle = "#2a3346"; G.rr(x - 70, y - 190, 40, 200, 14); c.fill(); G.rr(x - 70, y - 30, 170, 34, 12); c.fill();
    G.person(Object.assign({}, G.YOU, { x: x, y: y + 4, s: 1.0, t, seat: true, expr: expr || "calm", look: look == null ? 0.6 : look, armR: "lap", armL: "lap", seed: 3 }));
  }
  function hangarFloor(G, t) {
    const c = G.ctx;
    G.ground("#0e1a2e", "#05080f", [600, 700, 700, "rgba(60,110,180,0.25)"]);
    c.fillStyle = "#0a1220"; c.fillRect(0, 820, 1920, 260);
    c.strokeStyle = "rgba(98,232,244,0.12)"; c.lineWidth = 2; for (let x = -200; x < 2200; x += 160) { c.beginPath(); c.moveTo(x, 820); c.lineTo(x - 300, 1080); c.stroke(); }
    G.glowDot(560, 830, 420, "rgba(98,232,244,0.18)", 1);
  }

  // ======================= A · cold open =======================
  scene(0, { draw(G, t, lt) {
    const c = G.ctx;
    cabin(G, t, { wx: 1250, wy: 470, wr: 330, view: (x, y, r) => { G.planet(x + r * 0.25, y + r * 0.95, r * 0.75, { seed: 5, rot: t * 0.01 }); } });
    // OTTO in front of the window, humming
    const hum = t > S("o3") + 1.2;
    G.otto({ x: 1250, y: 520, s: 1.05, t, screen: hum ? (sw, sh, tt) => { G.flower(0, -6, 12, P.cyan, 3); } : null });
    if (hum) for (let k = 0; k < 3; k++) { const ph = ((t * 0.6 + k / 3) % 1); G.text(k % 2 ? "♪" : "♫", 1350 + ph * 120 + k * 10, 420 - ph * 160, { size: 42, color: P.cyan, a: Math.sin(ph * Math.PI), glow: 12 }); }
    const bubT = w("o3", "talking") - 0.2;
    if (t > bubT && t < S("o5")) G.alpha(G.pop(t, bubT, 0.3).a, () => G.bubble("SEE YOU LATER, ALLIGATOR!", 1250, 290, { size: 28, tail: 30 }));
    seatYou(G, t, 1640, 860, t > S("o3") + 2 ? "worried" : "calm", -0.7);
    // left: the two clocks of the story
    const k1 = { a: 1, s: 1 }, k2 = G.pop(t, S("o2") - 0.1, 0.4);
    G.text("POV: your robot started talking like her", 150, 150, { size: 34, weight: 600, color: "#d8dde6", a: k1.a });
    G.text("SHIP TIME", 160, 330, { size: 22, weight: 600, ls: 6, color: P.grey, a: k1.a });
    G.text("1 YEAR", 150, 460, { size: 130, weight: 500, fam: G.F.mono, color: P.white, a: k1.a, glow: 16 });
    if (t > S("o2") - 0.1) {
      const yrs = Math.round(70 * eo((t - S("o2") + 0.1) / 1.4));
      G.text("EARTH TIME", 160, 570, { size: 22, weight: 600, ls: 6, color: P.grey, a: k2.a });
      G.text(yrs + " YEARS", 150, 700, { size: 130, weight: 500, fam: G.F.mono, color: P.cyan, a: k2.a, glow: 22 });
      G.text("2031 → " + (2031 + yrs), 160, 760, { size: 28, weight: 600, ls: 3, color: P.yellow, a: k2.a });
    }
    // polaroid of Mia at eight
    if (t > S("o4") - 0.15) {
      const p = G.pop(t, S("o4") - 0.15, 0.45);
      G.save(() => { c.translate(560, 880); c.rotate(-0.08); c.scale(p.s, p.s); c.globalAlpha = p.a;
        c.fillStyle = "#f3efe6"; c.shadowColor = "rgba(0,0,0,0.6)"; c.shadowBlur = 30; c.fillRect(-120, -150, 240, 280); c.shadowBlur = 0;
        c.fillStyle = "#2b4d7a"; c.fillRect(-104, -134, 208, 200);
        G.person(Object.assign({}, G.MIA(8), { x: 0, y: 70, s: 0.62, t, expr: "smile", armR: "wave" }));
        G.text("MIA · 8", 0, 110, { size: 30, weight: 700, fam: G.F.hand, color: "#2b2b33", align: "center" });
      });
    }
  } });

  // ======================= B · docking =======================
  const tB = S("o5") - 0.15;
  scene(tB, { draw(G, t, lt) {
    const green = sm((t - w("o5", "green")) / 0.4);
    cabin(G, t, { wx: 1220, wy: 450, wr: 320, screenTxt: green > 0.5 ? "DOCK · CLEARED" : "DOCK · HOLD", view: (x, y, r) => {
      const c = G.ctx; c.fillStyle = "#1a2232"; G.rr(x - 210, y - 120, 420, 250, 30); c.fill(); c.strokeStyle = "#3a4558"; c.lineWidth = 6; c.stroke();
      c.fillStyle = "#0b1018"; G.rr(x - 120, y - 70, 240, 160, 20); c.fill();
      G.glowDot(x, y - 150, 120, green > 0.5 ? "rgba(95,224,160,0.9)" : "rgba(255,90,106,0.7)", 1);
      c.fillStyle = green > 0.5 ? P.green : P.red; c.beginPath(); c.arc(x, y - 150, 16, 0, Math.PI * 2); c.fill();
      G.text("GATE 7", x, y + 30, { size: 30, weight: 700, ls: 6, color: "#8fa0b6", align: "center" });
    } });
    const turn = 1 - eio((t - w("o5", "turns")) / 0.9);
    G.otto({ x: 1000, y: 560, s: 1.05, t, turn, face: turn < 0.5 ? "idle" : "flat" });
    seatYou(G, t, 380, 860, "calm", 0.6);
    const bt = S("o6") - 0.1;
    if (t > bt) G.alpha(G.pop(t, bt, 0.3).a, () => G.bubble(G.typed("SOMEONE'S WAITING AT THE GATE.", t, bt, 26), 1000, 330, { size: 30, tail: 0 }));
  } });

  // ======================= REW · rewind smear =======================
  const tR = w("o7", "back") - 0.25, tRe = S("n1") - 0.1;
  scene(tR, { xf: 0.35, draw(G, t, lt) {
    const c = G.ctx; const u = clamp((t - tR) / (tRe - tR), 0, 1);
    G.ground("#0a0f1a", "#03050a");
    c.save(); c.filter = `blur(${6 + 10 * Math.sin(u * Math.PI)}px)`;
    for (let k = 0; k < 24; k++) { const y = (k * 47 + t * 900) % 1080; c.fillStyle = `rgba(150,190,230,${0.05 + 0.05 * (k % 3)})`; c.fillRect(0, y, 1920, 6 + (k % 4) * 3); }
    c.restore();
    const yr = Math.round(lerp(2101, 2031, eio(u)));
    const s = String(yr).split("").map((d, i) => (u < 0.85 && i > 1 && Math.sin(t * 60 + i) > 0.3) ? String((+d + 3) % 10) : d).join("");
    G.text("◀◀", 960, 470, { size: 70, color: P.white, align: "center", glow: 20 });
    G.text(s, 960, 640, { size: 150, weight: 500, fam: G.F.mono, color: P.white, align: "center", glow: 24 });
  } });

  // ======================= C · NOW HIRING =======================
  const tC = S("n1") - 0.1;
  scene(tC, { draw(G, t, lt) {
    const c = G.ctx;
    hangarFloor(G, t);
    G.ship(560, 600, 1.15, { thrust: 0 });
    c.fillStyle = "#0b1624"; G.rr(470, 760, 180, 46, 10); c.fill(); G.text("READY", 560, 793, { size: 26, weight: 700, ls: 4, color: P.cyan, align: "center", glow: 10 });
    G.card(940, 170, 760, 560);
    G.text("NOW HIRING · 2031", 1320, 250, { size: 30, weight: 700, ls: 9, color: P.yellow, align: "center" });
    G.text("DEEP SPACE COURIER", 1320, 320, { size: 44, weight: 700, color: P.white, align: "center" });
    const m = Math.round(5000000 * eo((t - S("n1") - 0.2) / 2.6));
    G.text("$" + m.toLocaleString("en-US"), 1320, 450, { size: 110, weight: 800, color: P.yellow, align: "center", glow: 18 });
    c.fillStyle = P.cyan; c.shadowColor = P.cyan; c.shadowBlur = 20; G.rr(1110, 500, 420, 96, 18); c.fill(); c.shadowBlur = 0;
    G.text("FLY 1 YEAR", 1320, 564, { size: 40, weight: 800, color: "#06121a", align: "center" });
    const chips = [["1 PILOT", w("n2", "pilot")], ["1 ROBOT", w("n2", "robot")], ["1 ROUND TRIP", w("n2", "trip")]];
    chips.forEach(([s2, tt], i) => { if (t > tt - 0.15) G.alpha(G.pop(t, tt - 0.15, 0.3).a, () => { c.strokeStyle = "rgba(98,232,244,0.6)"; c.lineWidth = 2; G.rr(990 + i * 230, 625, 210, 50, 25); c.stroke(); G.text(s2, 1095 + i * 230, 659, { size: 22, weight: 700, ls: 2, color: P.cyan, align: "center" }); }); });
    G.text("*Earth time may differ. Terms on page 41.", 1320, 712, { size: 15, weight: 500, color: "#8a93a2", align: "center" });
  } });
  // C2 · the contract on paper (a bright insert, like the source's paper cards)
  const tC2 = S("n3") - 0.15;
  scene(tC2, { draw(G, t, lt) {
    const c = G.ctx;
    G.ground("#1a1410", "#0a0806");
    const z = 1 + 0.08 * eio((t - tC2) / 3.5);
    c.save(); c.translate(960, 560); c.scale(z, z); c.rotate(-0.012);
    c.fillStyle = P.paper; c.shadowColor = "rgba(0,0,0,0.6)"; c.shadowBlur = 40; c.fillRect(-760, -470, 1520, 1000); c.shadowBlur = 0;
    G.text("COURIER AGREEMENT · DEEPARC", -680, -380, { size: 40, weight: 800, ls: 3, color: "#1b2230" });
    c.fillStyle = "#1b2230"; c.fillRect(-680, -355, 1360, 3);
    const rows = ["1. Term of service: one (1) year, measured on board.", "2. Compensation: $5,000,000, paid on signature.", "3. Crew: one (1) pilot, one (1) maintenance robot.", "4. Route: out to deep space, and back.", "5. Cruise speed: 99.99% of the speed of light."];
    rows.forEach((r, i) => G.text(r, -680, -270 + i * 62, { size: 30, weight: 500, fam: G.F.mono, color: "#2a3140" }));
    G.text("Signature: ____________________", -680, 120, { size: 30, weight: 500, fam: G.F.mono, color: "#2a3140" });
    const fp = sm((t - w("n4", "Earth") + 0.15) / 0.35);
    G.text("* Earth time may differ.", -680, 300, { size: 22, weight: 500, fam: G.F.mono, color: "#6a6f78", a: 1 - fp });
    if (fp > 0) {
      c.save(); c.rotate(-0.05); c.globalAlpha = fp;
      c.strokeStyle = "#d8323e"; c.lineWidth = 8; G.rr(-640, 230, 1100, 130, 18); c.stroke();
      G.text("* EARTH TIME: ≈ 70 YEARS", -90, 318, { size: 64, weight: 800, ls: 3, color: "#d8323e", align: "center" });
      c.restore();
    }
    c.restore();
  } });

  // ======================= D · physics =======================
  function clockFace(G, x, y, r, ang, label, col, light) {
    const c = G.ctx;
    if (!light) G.glowDot(x, y, r * 1.6, "rgba(98,232,244,0.12)", 1);
    c.fillStyle = light ? "#f7f9fc" : "#0e1726"; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.strokeStyle = col; c.lineWidth = 6; c.stroke();
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; c.strokeStyle = light ? "rgba(20,33,58,0.55)" : "rgba(220,230,240,0.6)"; c.lineWidth = 4; c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82); c.lineTo(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92); c.stroke(); }
    c.strokeStyle = col; c.lineWidth = 8; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(ang) * r * 0.72, y - Math.cos(ang) * r * 0.72); c.stroke();
    c.lineWidth = 6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(ang / 12) * r * 0.45, y - Math.cos(ang / 12) * r * 0.45); c.stroke();
    c.fillStyle = col; c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.fill();
    G.text(label, x, y + r + 60, { size: 28, weight: 700, ls: 5, color: col, align: "center" });
  }
  const tD1 = S("p1") - 0.15;
  scene(tD1, { draw(G, t, lt) {
    const c = G.ctx;
    G.ground("#e6ecf2", "#cdd7e2");
    c.strokeStyle = "rgba(20,33,58,0.08)"; c.lineWidth = 2; for (let x = 0; x < 1920; x += 48) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 1080); c.stroke(); } for (let y = 0; y < 1080; y += 48) { c.beginPath(); c.moveTo(0, y); c.lineTo(1920, y); c.stroke(); }
    G.text("TIME DILATION", 960, 175, { size: 54, weight: 800, ls: 6, color: "#14213a", align: "center" });
    G.text("SPECIAL RELATIVITY · 1905", 960, 225, { size: 22, weight: 600, ls: 5, color: "#4a5a72", align: "center" });
    const slow = sm((t - S("p2")) / 2.0);
    clockFace(G, 620, 560, 190, (t - tD1) * 6.0, "AT REST", "#1f8fa0", true);
    clockFace(G, 1300, 560, 190, (t - tD1) * lerp(6.0, 0.8, slow), "MOVING", "#c98a12", true);
    // a little ship racing under the moving clock
    if (t > S("p2") - 0.1) { G.ship(1300 + Math.sin(t * 2) * 6, 850, 0.25, { thrust: 0.8, label: false }); G.text(Math.round(lerp(10, 99, slow)) + "% LIGHT SPEED", 1300, 945, { size: 22, weight: 700, ls: 3, color: "#c98a12", align: "center" }); }
  } });
  const tD3 = S("p3") - 0.15;
  scene(tD3, { draw(G, t, lt) {
    const c = G.ctx;
    G.ground("#0a1222", "#03060c"); G.stars(t, { seed: 6, n: 200, a: 0.7 });
    const ex = 700, ey = 560;
    G.planet(ex, ey, 230, { seed: 8, rot: t * 0.02 });
    c.strokeStyle = "rgba(98,232,244,0.35)"; c.lineWidth = 2; c.setLineDash([8, 10]); c.beginPath(); c.ellipse(ex, ey, 420, 150, -0.25, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
    const a = (t - tD3) * 0.5 - 0.6; const sx = ex + Math.cos(a) * 420 * Math.cos(-0.25) - Math.sin(a) * 150 * Math.sin(-0.25), sy = ey + Math.cos(a) * 420 * Math.sin(-0.25) + Math.sin(a) * 150 * Math.cos(-0.25);
    c.fillStyle = "#d9e0e8"; c.fillRect(sx - 14, sy - 10, 28, 20); c.fillStyle = "#3d6fd0"; c.fillRect(sx - 52, sy - 7, 34, 14); c.fillRect(sx + 18, sy - 7, 34, 14);
    G.tag("GPS · 20,200 KM UP", sx + 70, sy - 110, { px: sx, py: sy, size: 24 });
    const b = G.pop(t, w("p3", "correct") - 0.1, 0.35);
    G.alpha(b.a, () => { G.card(1180, 300, 560, 150, { border: "rgba(98,232,244,0.6)" }); G.text("CLOCKS IN ORBIT RUN FAST BY", 1460, 355, { size: 22, weight: 700, ls: 2, color: P.grey, align: "center" }); G.text("38 µs / DAY", 1460, 420, { size: 54, weight: 800, color: P.cyan, align: "center", glow: 12 }); });
    const d = G.pop(t, w("p3", "drift") - 0.1, 0.35);
    G.alpha(d.a, () => {
      G.card(1180, 500, 560, 300, { border: "rgba(255,90,106,0.6)" });
      c.save(); G.rr(1200, 520, 520, 190, 14); c.clip(); c.fillStyle = "#1c2a24"; c.fillRect(1200, 520, 520, 190);
      c.strokeStyle = "#2f4a3c"; c.lineWidth = 10; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(1200 + k * 110, 520); c.lineTo(1150 + k * 110, 710); c.stroke(); } c.beginPath(); c.moveTo(1200, 600); c.lineTo(1720, 640); c.stroke();
      const dr = eio((t - w("p3", "drift")) / 2.0);
      const px = 1330 + 260 * dr, py = 610 + 20 * dr;
      G.glowDot(1330, 612, 30, "rgba(98,232,244,0.8)", 1);
      c.fillStyle = P.red; c.beginPath(); c.arc(px, py - 26, 18, Math.PI, 0); c.lineTo(px, py); c.closePath(); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(px, py - 26, 7, 0, Math.PI * 2); c.fill();
      c.restore();
      G.text("UNCORRECTED: ≈ 10 KM A DAY", 1460, 760, { size: 26, weight: 800, ls: 2, color: P.red, align: "center" });
    });
  } });
  const tD4 = S("p4") - 0.15;
  scene(tD4, { xf: 0.6, draw(G, t, lt) {
    const c = G.ctx;
    G.ground("#0c1424", "#04070f"); G.stars(t, { seed: 9, n: 150, a: 0.5 });
    G.text("NASA TWINS STUDY", 960, 150, { size: 30, weight: 700, ls: 8, color: P.grey, align: "center" });
    // orbit side
    G.planet(520, 1180, 520, { seed: 2, rot: t * 0.01 });
    c.fillStyle = "#c9d1dc"; c.fillRect(330, 470, 380, 16); c.fillRect(500, 430, 40, 96); c.fillStyle = "#3d6fd0"; c.fillRect(330, 440, 70, 76); c.fillRect(640, 440, 70, 76);
    const astro = { suit: "#eef1f4", suitD: "#c3cbd5", skin: "#e2b08a", skinD: "#c4906a", hair: "#7a6a5e", legs: "#c3cbd5", shoes: "#9aa6b4" };
    G.person(Object.assign({}, astro, { x: 520 + Math.sin(t) * 6, y: 420 + Math.sin(t * 1.3) * 8, s: 0.8, t, expr: "smile" }));
    G.person(Object.assign({}, astro, { suit: "#3a5a8a", suitD: "#2a4468", legs: "#2a3346", x: 1400, y: 820, s: 0.8, t, expr: "calm" }));
    c.fillStyle = "#1a2536"; c.fillRect(1100, 820, 600, 8);
    G.text("IN ORBIT · 340 DAYS", 520, 170, { size: 26, weight: 700, ls: 3, color: P.cyan, align: "center" });
    G.text("ON EARTH", 1400, 470, { size: 26, weight: 700, ls: 3, color: P.yellow, align: "center" });
    const r = G.pop(t, w("p4", "younger") - 0.1, 0.4);
    G.alpha(r.a, () => { G.card(660, 860, 600, 120, { border: "rgba(98,232,244,0.6)" }); G.text("CAME HOME YOUNGER BY < 0.01 s", 960, 935, { size: 32, weight: 800, color: P.cyan, align: "center", glow: 10 }); });
  } });
  const tD5 = S("p5") - 0.15;
  scene(tD5, { xf: 0.6, draw(G, t, lt) {
    const c = G.ctx;
    const warp = sm((t - w("p6", "ninety") + 0.1) / 1.2);
    G.ground("#0a1020", "#03050a");
    G.stars(t, { seed: 13, n: 220, speed: warp * 6, a: 0.6 });
    G.text("HOW FAST HAVE WE GONE?", 960, 200, { size: 40, weight: 800, ls: 4, color: P.white, align: "center" });
    const bx = 260, bw = 1400;
    const row = (y, label, frac, col, t0, val) => {
      const k = eo((t - t0) / 1.2);
      G.text(label, bx, y - 22, { size: 24, weight: 700, ls: 3, color: col });
      c.fillStyle = "#162034"; G.rr(bx, y, bw, 34, 17); c.fill();
      c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 16; G.rr(bx, y, Math.max(10, bw * frac * k), 34, 17); c.fill(); c.shadowBlur = 0;
      G.text(val, bx + bw, y - 22, { size: 30, weight: 800, fam: G.F.mono, color: col, align: "right" });
    };
    row(420, "FASTEST PROBE EVER (2024)", 0.00064, P.yellow, w("p5", "fastest") - 0.1, "0.064% c");
    if (t > S("p6") - 0.2) row(640, "YOUR SHIP", 0.9999, P.cyan, S("p6") - 0.1, "99.99% c");
    G.text("c = THE SPEED OF LIGHT", 960, 860, { size: 22, weight: 600, ls: 5, color: P.grey, align: "center" });
  } });
  const tD7 = S("p7") - 0.15;
  scene(tD7, { xf: 0.6, draw(G, t, lt) {
    const c = G.ctx;
    G.ground("#0c1424", "#04070f"); G.stars(t, { seed: 14, n: 140, a: 0.5 });
    const tg = c.createLinearGradient(960, 0, 1920, 0); tg.addColorStop(0, "#0b4652"); tg.addColorStop(1, "#08343e"); c.fillStyle = tg; c.fillRect(960, 0, 960, 1080);
    c.fillStyle = "rgba(98,232,244,0.35)"; c.fillRect(959, 0, 3, 1080);
    const k = eo((t - w("p7", "seventy") + 0.3) / 1.6);
    G.text("YOU", 560, 330, { size: 30, weight: 700, ls: 8, color: P.grey, align: "center" });
    G.text("1", 560, 560, { size: 220, weight: 500, fam: G.F.mono, color: P.white, align: "center", glow: 18 });
    G.text("YEAR", 560, 650, { size: 44, weight: 800, ls: 6, color: P.white, align: "center" });
    G.text("EARTH", 1360, 330, { size: 30, weight: 700, ls: 8, color: P.grey, align: "center" });
    G.text(String(Math.max(1, Math.round(70 * k))), 1360, 560, { size: 220, weight: 500, fam: G.F.mono, color: P.cyan, align: "center", glow: 24 });
    G.text("YEARS", 1360, 650, { size: 44, weight: 800, ls: 6, color: P.cyan, align: "center" });
    G.text("γ ≈ 70.7 AT 99.99% c", 960, 840, { size: 24, weight: 600, ls: 4, color: P.yellow, align: "center", a: k });
  } });

  // ======================= E · Mia =======================
  const tE = S("m1") - 0.15;
  scene(tE, { draw(G, t, lt) {
    const c = G.ctx;
    G.ground("#3a2c52", "#141224", [1500, 520, 900, "rgba(255,150,90,0.5)"]);
    // the hangar mouth with dusk outside
    const g = c.createLinearGradient(0, 160, 0, 760); g.addColorStop(0, "#4a4678"); g.addColorStop(0.55, "#e07a60"); g.addColorStop(1, "#ffc184");
    c.fillStyle = g; G.rr(980, 160, 820, 600, 10); c.fill();
    G.stars(t, { seed: 21, n: 40, x: 980, y: 160, w: 820, h: 200, a: 0.6 });
    G.ship(1430, 620, 0.62, { thrust: 0 });
    c.fillStyle = "#0e1320"; c.fillRect(0, 760, 1920, 320);
    c.fillStyle = "rgba(242,168,106,0.18)"; c.fillRect(980, 760, 820, 4);
    // you and Mia
    const hold = t > w("m4", "drawing") - 0.2;
    G.person(Object.assign({}, G.YOU, { x: 620, y: 900, s: 1.25, t, expr: t > S("m3") ? "smile" : "calm", look: 0.6, armR: t > w("m3", "One") - 0.2 && t < S("m4") ? "reach" : "down", seed: 1 }));
    G.person(Object.assign({}, G.MIA(8), { x: 880, y: 900, s: 1.25, t, flip: true, expr: t > w("m3", "One") ? "happy" : "smile", look: -0.6, armR: hold ? "reach" : (t > S("m3") - 0.1 && t < S("m4") ? "reach" : "down"), seed: 2,
      holding: hold ? (hx, hy) => { const c2 = G.ctx; c2.save(); c2.translate(hx, hy - 30); c2.rotate(0.1); c2.fillStyle = "#f6f1e6"; c2.fillRect(-36, -28, 72, 56); c2.strokeStyle = "#3d6fd0"; c2.lineWidth = 3; c2.strokeRect(-20, -14, 26, 26); c2.restore(); } : null }));
    const tg = G.pop(t, w("m1", "Mia") - 0.15, 0.35);
    G.alpha(tg.a, () => G.tag("MIA · 8", 1000, 360, { px: 880, py: 520, size: 30 }));
    if (t > w("m2", "money") - 0.2) G.alpha(G.pop(t, w("m2", "money") - 0.2, 0.3).a, () => G.tag("$5,000,000 → MIA'S FUTURE", 140, 180, { size: 28, bg: P.yellow }));
    if (t > w("m3", "promise") - 0.3 && t < w("m3", "One") - 0.1) G.bubble("PROMISE?", 880, 560, { size: 30, tail: -10 });
    if (t > w("m3", "One") - 0.2 && t < S("m4")) G.bubble("ONE YEAR.", 600, 520, { size: 30, tail: 10 });
    // the drawing, big
    const d = sm((t - w("m4", "robot") + 0.25) / 0.45);
    if (d > 0) { G.ctx.fillStyle = `rgba(4,6,12,${0.55 * d})`; G.ctx.fillRect(0, 0, 1920, 1080); G.kidDrawing(1000, 540 + (1 - d) * 500, 1160, 860, -0.04, 1); }
  } });

  // ======================= F · OTTO =======================
  const tF = S("r1") - 0.15;
  const ottoFace = (t) => "flat";
  scene(tF, { draw(G, t, lt) {
    cabin(G, t, { wx: 1300, wy: 440, wr: 300, warp: 2.2 });
    G.otto({ x: 960, y: 560, s: 1.15, t, face: "flat" });
    seatYou(G, t, 380, 860, "calm", 0.6);
    const tg = G.pop(t, w("r1", "Otto") - 0.15, 0.35);
    G.alpha(tg.a, () => G.tag("OTTO · MAINTENANCE UNIT", 1180, 640, { px: 1020, py: 560, size: 30 }));
    if (t > w("r1", "humor") - 0.3) G.alpha(G.pop(t, w("r1", "humor") - 0.3, 0.3).a, () => G.tag("HUMOR: 0%", 1180, 730, { size: 26, bg: P.red, color: "#1a0508" }));
    const says = [["SYSTEMS NORMAL.", w("r2", "exactly") - 0.1], ["GOOD NIGHT.", w("r2", "three") - 0.05], ["DRINK WATER.", w("r2", "things") + 0.15]];
    says.forEach(([s, tt], i) => { if (t > tt) G.alpha(G.pop(t, tt, 0.25).a, () => G.bubble(s, 960, 300 - i * 0 + (i - 1) * 0, { size: 28, tail: 0 })); });
  } });
  const tF2 = S("r3") - 0.15;
  scene(tF2, { xf: 0.7, draw(G, t, lt) {
    const c = G.ctx;
    G.ground("#0a1020", "#03050a"); G.stars(t, { seed: 31, n: 200, a: 0.6 });
    G.planet(260, 560, 150, { seed: 4, rot: t * 0.02 });
    const sx = 1500 + (t - tF2) * 18;
    // message waves from Earth, stretched out behind a ship racing away
    for (let k = 0; k < 7; k++) { const r = 180 + ((t - tF2) * 70 + k * 210) % 1500; c.strokeStyle = `rgba(98,232,244,${0.35 * (1 - r / 1700)})`; c.lineWidth = 3; c.beginPath(); c.arc(260, 560, r, -0.5, 0.5); c.stroke(); }
    G.ship(sx, 560, 0.42, { thrust: 1 });
    G.text("MESSAGES FROM EARTH", 620, 380, { size: 24, weight: 700, ls: 4, color: P.cyan });
    G.alpha(G.pop(t, w("r3", "quiet") - 0.2, 0.3).a, () => { G.card(1180, 160, 560, 110, { border: "rgba(98,232,244,0.5)" }); G.text("INBOX · 0 NEW", 1460, 232, { size: 40, weight: 800, ls: 3, color: P.white, align: "center" }); });
    const k = G.pop(t, w("r4", "barely") - 0.2, 0.4);
    G.alpha(k.a, () => { G.card(560, 790, 800, 150); G.text("6 MONTHS ON BOARD", 960, 850, { size: 28, weight: 700, ls: 3, color: P.grey, align: "center" }); G.text("= 1 DAY OF NEWS", 960, 910, { size: 46, weight: 800, color: P.yellow, align: "center", glow: 12 }); });
  } });

  // ======================= G · turnaround =======================
  const tG = S("u1") - 0.15;
  scene(tG, { draw(G, t, lt) {
    const c = G.ctx;
    G.ground("#0a1020", "#03050a");
    const turn = eio((t - S("u1")) / 1.6);
    G.stars(t, { seed: 41, n: 220, speed: 3 + 2 * (1 - Math.abs(turn - 0.5) * 2), a: 0.7 });
    const comp = sm((t - S("u2")) / 1.0);
    if (comp > 0) {
      G.planet(1660, 560, 150, { seed: 4, rot: t * 0.02 });
      for (let k = 0; k < 24; k++) { const r = 160 + ((t - tG) * 400 + k * 52) % 1300; c.strokeStyle = `rgba(98,232,244,${0.5 * comp * (1 - r / 1450)})`; c.lineWidth = 3; c.beginPath(); c.arc(1660, 560, r, Math.PI - 0.45, Math.PI + 0.45); c.stroke(); }
    }
    G.ship(720, 560, 0.62, { rot: Math.PI * turn, thrust: 0.8 });
    G.alpha(G.pop(t, S("u1"), 0.3).a * (1 - comp), () => G.text("TURNAROUND · MONTH 6", 720, 300, { size: 30, weight: 700, ls: 6, color: P.white, align: "center" }));
    const k = G.pop(t, w("u3", "five") - 0.3, 0.35);
    G.alpha(k.a, () => { G.card(230, 790, 960, 150, { border: "rgba(98,232,244,0.6)" }); G.text("EVERY DAY ON BOARD", 710, 850, { size: 26, weight: 700, ls: 3, color: P.grey, align: "center" }); G.text("≈ 141 DAYS OF HER LIFE ARRIVE", 710, 912, { size: 42, weight: 800, color: P.cyan, align: "center", glow: 12 }); });
  } });
  const tG2 = S("u4") - 0.15;
  scene(tG2, { xf: 0.5, draw(G, t, lt) {
    const c = G.ctx;
    G.ground("#0c1424", "#04070f"); G.stars(t, { seed: 44, n: 120, a: 0.4 });
    G.text("INCOMING MESSAGES", 960, 170, { size: 30, weight: 700, ls: 8, color: P.grey, align: "center" });
    const tiles = [
      [w("u4", "twelve"), 12, "2035", { braces: true, expr: "smile" }],
      [w("u4", "eighteen"), 18, "2041", { cap: true, expr: "happy" }],
      [w("u4", "twenty"), 25, "2048", { badge: true, expr: "smile" }],
    ];
    tiles.forEach(([tt, age, yr, ex], i) => {
      if (t < tt - 0.2) return;
      const p = G.pop(t, tt - 0.2, 0.4);
      const x = 160 + i * 560, y = 300;
      G.save(() => { c.globalAlpha = p.a; c.translate(x + 250, y + 200); c.scale(p.s, p.s); c.translate(-250, -200);
        G.card(0, 0, 500, 400, { border: "rgba(98,232,244,0.8)", fill: "#dfe8f2" });
        c.save(); G.rr(14, 14, 472, 300, 14); c.clip(); const g = c.createLinearGradient(0, 14, 0, 314); g.addColorStop(0, "#8cc8f2"); g.addColorStop(1, "#4a86c8"); c.fillStyle = g; c.fillRect(14, 14, 472, 300);
        G.person(Object.assign({}, G.MIA(age), ex, { x: 250, y: 470, s: 1.15, t, seed: i + 4 }));
        c.restore();
        c.fillStyle = "rgba(0,0,0,0.45)"; c.beginPath(); c.arc(440, 62, 26, 0, Math.PI * 2); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.moveTo(432, 48); c.lineTo(452, 62); c.lineTo(432, 76); c.fill();
        G.text("MIA · " + age, 30, 365, { size: 30, weight: 800, color: "#14213a" });
        G.text("SENT " + yr, 470, 365, { size: 22, weight: 600, ls: 2, fam: G.F.mono, color: "#1f6f80", align: "right" });
      });
    });
    if (t > w("u4", "badge") - 0.2) G.alpha(G.pop(t, w("u4", "badge") - 0.2, 0.3).a, () => G.tag("DEEPARC · ENGINEERING", 1310, 760, { px: 1440, py: 640, size: 24 }));
  } });

  // ======================= H · OTTO changes =======================
  const tH = S("c1") - 0.15;
  scene(tH, { draw(G, t, lt) {
    const c = G.ctx;
    cabin(G, t, { wx: 1320, wy: 430, wr: 290, warp: 2.2 });
    const hum = t > S("c2") - 0.1 && t < S("c3");
    const flowers = t > w("c4", "flowers") - 0.3;
    const joke = t > S("c3") - 0.1 && t < S("c4");
    const glitch = t > S("c5") - 0.1;
    G.otto({ x: 960, y: 560, s: 1.15, t, face: joke ? "happy" : "idle", arm: joke ? Math.max(0, Math.sin((t - S("c3")) * 3)) : 0,
      screen: flowers ? (sw, sh, tt) => { const k = clamp((t - w("c4", "flowers") + 0.3) / 1.0, 0, 1); G.alpha(1, () => { for (let i = 0; i < 3; i++) if (k > i / 3) G.flower(-36 + i * 36, -8 + (i % 2) * 6, 9, i % 2 ? "#ff8ac0" : P.cyan, 2.5); }); if (glitch && Math.sin(t * 40) > 0.6) { c.fillStyle = "rgba(98,232,244,0.4)"; c.fillRect(-60, -6, 120, 4); } } : null });
    if (hum) for (let k = 0; k < 4; k++) { const ph = ((t * 0.7 + k / 4) % 1); G.text(k % 2 ? "♪" : "♫", 1060 + ph * 140, 430 - ph * 180, { size: 46, color: P.cyan, a: Math.sin(ph * Math.PI), glow: 12 }); }
    if (hum) G.alpha(G.pop(t, S("c2") - 0.1, 0.3).a, () => G.tag("PLAYING: LULLABY.WAV", 1170, 640, { size: 24 }));
    if (joke) G.alpha(G.pop(t, S("c3") - 0.1, 0.3).a, () => G.bubble("WHY DO STARS GO TO SCHOOL? TO GET BRIGHTER!", 960, 320, { size: 26, tail: 0 }));
    seatYou(G, t, 380, 860, t > S("c3") ? "worried" : "calm", 0.6);
    if (glitch) G.alpha(G.pop(t, S("c5") - 0.1, 0.3).a, () => G.tag("DIAGNOSTIC: ???", 1170, 640, { size: 26, bg: P.red, color: "#1a0508" }));
  } });

  // ======================= I · the log =======================
  const tI = S("x1") - 0.15;
  scene(tI, { draw(G, t, lt) {
    const c = G.ctx;
    G.ground("#14100c", "#070504");
    c.save(); c.translate(960, 540); c.rotate(0.01);
    c.fillStyle = P.paper; c.shadowColor = "rgba(0,0,0,0.6)"; c.shadowBlur = 40; c.fillRect(-800, -480, 1600, 980); c.shadowBlur = 0;
    G.text("OTTO · UPDATE LOG", -730, -400, { size: 36, weight: 800, ls: 5, color: "#1b2230" });
    c.fillStyle = "#1b2230"; c.fillRect(-730, -378, 1460, 3);
    const mods = ["hum_lullaby()", "joke_pack_v2", "draw_flower()", "say_goodnight()", "laugh_track", "story_mode", "voice_warmth", "doodle_screen", "check_on_him()", "alligator.txt"];
    const scroll = Math.max(0, (t - S("x2") + 0.3) * 9);
    const hl = sm((t - w("x2", "same") + 0.1) / 0.4);
    c.save(); c.beginPath(); c.rect(-760, -360, 1520, 640); c.clip();
    for (let i = 0; i < 40; i++) {
      const n = i + Math.floor(scroll); const y = -310 + i * 52 - (scroll % 1) * 52;
      if (y > 300) break;
      const yr = Math.min(2101, 2053 + Math.floor(n * 0.048));
      G.text("#" + String(1 + n * 103).padStart(4, "0") + "   " + yr + "   " + mods[n % mods.length].padEnd(18, " "), -730, y, { size: 28, weight: 500, fam: G.F.mono, color: "#2a3140" });
      if (hl > 0) { c.fillStyle = `rgba(245,200,74,${0.55 * hl})`; c.fillRect(350, y - 30, 380 * hl, 40); }
      G.text("SIGNED: MIA", 370, y, { size: 28, weight: 700, fam: G.F.mono, color: "#2a3140" });
    }
    c.restore();
    const k = G.pop(t, w("x2", "Four") - 0.1, 0.35);
    G.alpha(k.a, () => { c.fillStyle = "#1b2230"; G.rr(260, 330, 470, 100, 14); c.fill(); G.text(Math.round(4112 * eo((t - w("x2", "Four")) / 1.4)).toLocaleString("en-US") + " PATCHES", 495, 397, { size: 40, weight: 800, color: P.yellow, align: "center" }); });
    c.restore();
    const s2 = G.pop(t, w("x2", "same") - 0.1, 0.35);
    G.alpha(s2.a, () => G.tag("ONE AUTHOR: MIA", 230, 880, { size: 34, bg: P.cyan }));
  } });
  const tI2 = S("x3") - 0.15;
  scene(tI2, { draw(G, t, lt) {
    const c = G.ctx;
    G.ground("#0a1222", "#03060c"); G.stars(t, { seed: 51, n: 140, a: 0.5 });
    const age = Math.round(lerp(22, 72, eio((t - w("x4", "fifty") + 0.2) / 3.2)));
    const yr = 2045 + (age - 22);
    // staff ID
    G.save(() => { c.translate(560, 540); c.rotate(-0.03);
      c.fillStyle = "#f3efe6"; c.shadowColor = "rgba(0,0,0,0.6)"; c.shadowBlur = 40; G.rr(-330, -210, 660, 420, 22); c.fill(); c.shadowBlur = 0;
      c.fillStyle = "#1d2a44"; G.rr(-330, -210, 660, 74, 22); c.fill(); c.fillRect(-330, -160, 660, 24);
      G.text("DEEPARC · STAFF", -300, -160, { size: 26, weight: 700, ls: 6, color: "#e9edf2" });
      c.fillStyle = "#2b4d7a"; G.rr(-300, -100, 220, 270, 12); c.fill();
      c.save(); G.rr(-300, -100, 220, 270, 12); c.clip(); G.person(Object.assign({}, G.MIA(age > 60 ? 70 : 25), { hair: age > 55 ? "#d8d8d4" : age > 40 ? "#7a5a48" : "#5a3524", x: -190, y: 300, s: 1.05, t, badge: true, expr: "smile", seed: 9 })); c.restore();
      G.text("MIA", -50, -40, { size: 54, weight: 800, color: "#1b2230" });
      G.text("SOFTWARE ENGINEER", -50, 10, { size: 26, weight: 700, ls: 2, color: "#3a4558" });
      G.text("PROJECT: OTTO", -50, 60, { size: 26, weight: 700, ls: 2, color: "#3a4558" });
      G.text("JOINED 2045 · AGE 22", -50, 110, { size: 22, weight: 600, ls: 1, color: "#6a7486" });
      G.text("YEAR " + yr, -50, 165, { size: 30, weight: 700, fam: G.F.mono, color: P.suit });
    });
    // code flowing out to a tiny ship
    const flow = sm((t - w("x4", "sent") + 0.2) / 0.6);
    if (flow > 0) {
      G.ship(1660, 360, 0.2, { thrust: 0.5, label: false });
      const lines = ["otto.hum(lullaby)", "otto.joke(stars)", "otto.draw(flower)", "otto.say('goodnight')", "if (lonely) talk()"];
      for (let k = 0; k < 10; k++) { const ph = ((t * 0.35 + k / 10) % 1); const x = lerp(920, 1600, ph), y = lerp(560, 370, ph) + Math.sin(k * 3 + t) * 30; G.text(lines[k % lines.length], x, y, { size: 22, weight: 500, fam: G.F.mono, color: P.cyan, a: flow * Math.sin(ph * Math.PI), glow: 8 }); }
    }
    if (t > w("x4", "line") - 0.2) G.alpha(G.pop(t, w("x4", "line") - 0.2, 0.3).a, () => G.tag("ONE LINE OF CODE AT A TIME", 1080, 820, { size: 30, bg: P.yellow }));
  } });
  const tI3 = S("x5") - 0.15;
  scene(tI3, { draw(G, t, lt) {
    const c = G.ctx;
    cabin(G, t, { wx: 1400, wy: 380, wr: 260, warp: 1.5 });
    const k = eo((t - tI3) / 1.2);
    G.otto({ x: 900, y: 560, s: lerp(1.9, 2.15, k), t, screen: (sw, sh) => { G.save(() => { c.scale(0.27, 0.27); G.kidDrawing(0, 0, 440, 280, 0, 1); }); } });
    const items = [["EVERY JOKE", w("x5", "joke")], ["EVERY SONG", w("x5", "song")], ["EVERY FLOWER", w("x5", "flower")]];
    items.forEach(([s, tt], i) => { if (t > tt - 0.15) G.alpha(G.pop(t, tt - 0.15, 0.3).a, () => G.text(s, 1380, 760 + i * 70, { size: 44, weight: 800, ls: 3, color: i === 2 ? "#ff8ac0" : P.white })); });
    if (t > w("x5", "her") - 0.1) G.alpha(G.pop(t, w("x5", "her") - 0.1, 0.3).a, () => G.text("= MIA", 1380, 990, { size: 52, weight: 800, color: P.yellow, glow: 16 }));
  } });

  // ======================= J · the gate =======================
  const tJ = S("e1") - 0.15;
  const gateOpen = w("e1", "opens") + 0.1;
  scene(tJ, { draw(G, t, lt) {
    const c = G.ctx;
    G.ground("#141c2c", "#070b14");
    c.fillStyle = "#0d1320"; c.fillRect(0, 880, 1920, 200);
    // gate frame + doors
    const op = eio((t - gateOpen) / 1.4);
    const gx = 1140, gw = 560;
    c.fillStyle = "#fff6e0"; c.fillRect(gx, 200, gw, 680); G.glowDot(gx + gw / 2, 540, 700, "rgba(255,236,200,0.25)", 1);
    G.glowDot(gx + gw / 2, 560, 600 * op + 50, "rgba(255,236,200,0.45)", op);
    // Mia at 78 with a flower, inside the light
    if (op > 0.05) G.person(Object.assign({}, G.MIA(78), { x: gx + gw / 2 + 20, y: 880, s: 1.2, t, flip: true, expr: t > S("e3") ? "happy" : "smile", look: -0.5, armL: "cane", armR: "hold", seed: 6,
      holding: (hx, hy) => { G.flower(hx + 6, hy - 40, 12, "#ff6aa0", 4); c.fillStyle = "#f5c84a"; c.beginPath(); c.arc(hx + 6, hy - 40, 6, 0, Math.PI * 2); c.fill(); } }));
    const dg = c.createLinearGradient(0, 200, 0, 880); dg.addColorStop(0, "#d7dee7"); dg.addColorStop(1, "#a9b4c2"); c.fillStyle = dg; c.fillRect(gx - op * gw / 2, 200, gw / 2, 680); c.fillRect(gx + gw / 2 + op * gw / 2, 200, gw / 2, 680); c.fillStyle = "rgba(20,30,48,0.35)"; c.fillRect(gx + gw / 2 - 2 + op * gw / 2, 200, 4, 680);
    c.strokeStyle = "#8a96a6"; c.lineWidth = 14; c.strokeRect(gx - 7, 193, gw + 14, 694);
    c.fillStyle = "#1b2436"; c.fillRect(gx, 140, gw, 50); G.text("ARRIVALS · GATE 7", gx + gw / 2, 176, { size: 28, weight: 700, ls: 6, color: P.green, align: "center" });
    // you (walking forward on e3) and OTTO
    const walk = sm((t - S("e3")) / 3.0);
    G.person(Object.assign({}, G.YOU, { x: lerp(420, 860, walk), y: 940, s: 1.3, t, walk: walk > 0.02 && walk < 0.98, expr: t > S("e2") ? "smile" : "wide", look: 0.6, seed: 8 }));
    G.otto({ x: lerp(210, 560, walk), y: 640, s: 0.8, t, face: "happy" });
    if (t > S("e4") - 0.1 && t < E("e4") + 0.25) {
      const p = G.pop(t, S("e4") - 0.1, 0.35);
      G.alpha(p.a, () => { c.fillStyle = "rgba(4,6,12,0.82)"; G.rr(460, 890, 1000, 116, 24); c.fill(); G.text("WOULD YOU TAKE THE JOB?", 960, 968, { size: 54, weight: 800, color: "#f2f4f6", align: "center" }); });
    }
  } });

  // ======================= K · CTA =======================
  const tK = E("e4") + 0.25;
  scene(tK, { draw(G, t, lt) {
    const c = G.ctx;
    G.ground("#0c1222", "#03050a"); G.stars(t, { seed: 61, n: 220, a: 0.7 });
    const p = G.pop(t, tK, 0.35);
    G.save(() => { c.globalAlpha = p.a; c.translate(960, 470); c.scale(p.s, p.s);
      c.fillStyle = "#f2f4f6"; G.rr(-70, -60, 140, 96, 20); c.fill(); c.beginPath(); c.moveTo(-20, 34); c.lineTo(-40, 70); c.lineTo(10, 34); c.fill();
      c.fillStyle = "#1b2230"; for (let k = -1; k <= 1; k++) { c.beginPath(); c.arc(k * 34, -12, 9, 0, Math.PI * 2); c.fill(); } });
    G.text("TELL ME IN THE COMMENTS", 960, 620, { size: 44, weight: 800, ls: 4, color: P.yellow, align: "center", a: p.a, glow: 14 });
  } });
  const tK2 = tK + 2.3;
  scene(tK2, { xf: 0.6, draw(G, t, lt) {
    G.ground("#0c1222", "#03050a"); G.stars(t, { seed: 61, n: 220, a: 0.7 });
    const p = G.pop(t, tK2, 0.5);
    G.text("A NEW WHAT-IF EVERY WEEK", 960, 500, { size: 34, weight: 700, ls: 8, color: "#d8dde6", align: "center", a: p.a });
    G.text("FOLLOW", 960, 600, { size: 72, weight: 800, ls: 12, color: P.cyan, align: "center", a: p.a, glow: 22 });
    G.ctx.fillStyle = P.cyan; G.alpha(p.a, () => G.ctx.fillRect(840, 640, 240 * G.eo((t - tK2) / 1.2), 5));
  } });

  sc.sort((a, b) => a.t0 - b.t0);

  // ---- HUD values per section ----
  function pad(n, l) { return String(Math.floor(n)).padStart(l, "0"); }
  function fmtShip(days, frac) { const tot = days * 86400 + frac; const d = Math.floor(tot / 86400), h = Math.floor(tot % 86400 / 3600), m = Math.floor(tot % 3600 / 60), s = tot % 60;
    return (d >= 365 ? "1y " + pad(d - 365, 3) : "0y " + pad(d, 3)) + "d " + pad(h, 2) + ":" + pad(m, 2) + ":" + pad(s, 2) + "." + pad((s % 1) * 1000, 3); }
  function hudFor(t) {
    if (t >= tK) return null;
    if (t < tR) { // landing: the last seconds of the year roll over on "seventy"
      const roll = S("o2") + 0.3; const secs = 364 * 86400 + 86400 - (roll - t);
      return ["SHIP TIME", "EARTH · 2101", fmtShip(0, secs), { valC: t > roll ? P.yellow : P.cyan }];
    }
    if (t < tC) return ["SHIP TIME", "EARTH · ◀◀", fmtShip(0, Math.max(0, 365 * 86400 * (1 - (t - tR) / (tC - tR)))), {}];
    if (t < tF) return ["SHIP TIME", "FLASHBACK · 2031", fmtShip(0, (t - tC) * 1.0), {}];
    // the voyage: ship days map to story beats, Earth year = 2031 + 70.7 * days/365
    const keys = [[tF, 20], [tG, 180], [tH, 300], [tI, 330], [tJ, 364.9]];
    let d = 364.9;
    for (let i = 0; i < keys.length - 1; i++) if (t >= keys[i][0] && t < keys[i + 1][0]) d = lerp(keys[i][1], keys[i + 1][1], (t - keys[i][0]) / (keys[i + 1][0] - keys[i][0]));
    const yr = Math.min(2101, Math.floor(2031 + 70.7 * d / 365));
    if (t < tJ) return ["SHIP TIME", "EARTH · " + yr, fmtShip(d, (t * 7.3) % 86400), {}];
    const left = Math.max(0, gateOpen - t);
    return [left > 0 ? "GATE OPENS IN" : "GATE OPEN", "EARTH · 2101", "00:00:" + pad(left, 2) + "." + pad((left % 1) * 1e6, 6), { valC: P.yellow }];
  }

  function draw(t) {
    let i = 0; while (i < sc.length - 1 && t >= sc[i + 1].t0) i++;
    const s = sc[i];
    ctx.save(); ctx.clearRect(0, 0, 1920, 1080);
    if (s.xf && t - s.t0 < s.xf && i > 0) {
      const prev = sc[i - 1];
      prev.draw(G1, t, t - prev.t0);
      const oc = off.getContext("2d"); oc.save(); oc.clearRect(0, 0, 1920, 1080); s.draw(G2, t, t - s.t0); oc.restore();
      ctx.globalAlpha = sm((t - s.t0) / s.xf); ctx.drawImage(off, 0, 0); ctx.globalAlpha = 1;
    } else s.draw(G1, t, t - s.t0);
    ctx.restore();
    const h = hudFor(t);
    if (h) G1.hud(h[0], h[1], h[2], h[3]);
    G1.vignette(0.55); G1.grain(t, 0.05);
    // fade in from black on frame 0 is not wanted (first frame must work as a still); fade out at the very end
    const endF = clamp((t - (V.dur - 0.5)) / 0.5, 0, 1); if (endF > 0) { ctx.fillStyle = `rgba(0,0,0,${endF})`; ctx.fillRect(0, 0, 1920, 1080); }
  }
  return { draw, scenes: sc };
};

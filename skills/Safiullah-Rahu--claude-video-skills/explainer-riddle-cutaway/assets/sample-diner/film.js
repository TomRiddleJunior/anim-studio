/* "One Fright, No Water" (riddle-diner): the classic hiccups riddle, made PG (a cook bangs two pans instead of anything
   violent), in the cutaway-building riddle format. window.RC_FILM(K, V) -> {shots, T, cd0}. Needs kit.js + kit-ext.js. */
window.RC_FILM = function (K, V) {
  const { D, P, E, ramp, lerp, rng } = K;
  const L = (id) => V.L(id).start, Le = (id) => V.L(id).end, w = V.w;
  const W = 1080, H = 1920;
  const BASE = 2400, FH = 340, Y = (n) => BASE - (n - 1) * FH;
  const XA0 = 24, XA1 = 452, XB0 = 468, XB1 = 862, XS0 = 878, XS1 = 1080;
  const F1 = Y(1);
  const COLS = { 2: ["#f4cfcf", "#dcdcef"], 3: ["#d5e8d4", "#f6d9c0"], 4: ["#e3d3ea", "#f2e8c8"] };
  // the cast
  const GUEST = { skin: "#f2c9a0", hairType: "curly", hairCol: "#b5482e", coat: "#4f8a5b", shirt: "#4f8a5b", pants: "#3b3f4c" };
  const COOK = { skin: "#c98b5e", hat: "chef", moustache: true, shirt: "#fbf8f1", apron: "#e9ecef", pants: "#4a4f5c" };
  const NEWCOOK = { skin: "#8d5a3b", hat: "bandana", hatCol: "#3f7fbf", shirt: "#fbf8f1", apron: "#e9ecef", pants: "#4a4f5c" };
  const THEO = { skin: "#e8b88a", hat: "cap", hatCol: "#c9544a", glasses: true, shirt: "#3f7fbf", pants: "#3b3f4c" };
  const stars = (() => { const r = rng(9); return Array.from({ length: 30 }, () => [r(), r(), 0.6 + r() * 1.4]); })();
  const hic = (t, period = 2.3, ph = 0) => { const q = ((t + ph) % period) / period; return q < 0.07 ? Math.sin(q / 0.07 * Math.PI) : 0; }; // a hiccup jolt 0..1

  // ---------------------------------------------------------------- the building
  const win = (c, x, y, w, h, day) => { D.rect(c, x, y, w, h, day ? P.skyDay : "#f2a66a"); D.line(c, x + w / 2, y, x + w / 2, y + h); D.line(c, x, y + h / 2, x + w, y + h / 2); D.rect(c, x, y, w, h, null); };
  const flat = (c, n, side, o = {}) => { // an apartment unit
    const y = Y(n), x0 = side ? XB0 : XA0, x1 = side ? XB1 : XA1;
    D.rect(c, x0, y - FH + 16, x1 - x0, FH - 16, COLS[n][side], null);
    win(c, side ? 700 : 120, y - 270, 110, 100, o.day);
    D.rect(c, side ? 560 : 300, y - 230, 70, 230, "#9b6a3e"); D.ell(c, side ? 618 : 358, y - 115, 4, 4, P.amber, null);
    D.text(c, `${n}${side ? "B" : "A"}`, side ? 595 : 335, y - 205, 18, P.cream);
    if (n === 3 && side) { // her flat: a table with a plate (dinner -> hiccups)
      D.rect(c, 700, y - 90, 130, 12, "#8a5a36"); D.line(c, 710, y - 78, 710, y); D.line(c, 820, y - 78, 820, y); D.ell(c, 760, y - 95, 30, 7, P.white);
    } else { D.rr(c, side ? 500 : 60, y - 80, 200, 80, 14, side ? "#7a9ac0" : "#c98a5a"); D.rr(c, side ? 500 : 60, y - 120, 200, 46, 14, side ? "#6a88ac" : "#b5794c"); }
    if (o.dim) D.rect(c, x0, y - FH + 16, x1 - x0, FH - 16, `rgba(40,30,60,${o.dim})`, null);
  };
  const diner = (c, t, st = {}) => {
    const y = F1, top = y - FH + 16;
    D.rect(c, XA0, top, XB1 - XA0, FH - 16, "#f3e6c8", null);
    D.rect(c, XA0, top, XB1 - XA0, 22, "#5fb3a3", null);
    for (let k = 0; k < 42; k++) D.rect(c, XA0 + k * 20, y - 20, 20, 20, k % 2 ? "#2b2f38" : "#f3efe6", null);
    // menu board, wall clock, pass-through to the kitchen
    D.rr(c, 70, top + 40, 200, 90, 8, "#2b2f38"); D.text(c, "MENU", 170, top + 62, 24, P.amber); for (let k = 0; k < 3; k++) D.line(c, 95, top + 85 + k * 14, 245, top + 85 + k * 14, "#c9ccd6", 3);
    D.wallClock(c, 335, top + 80, 36, st.clockH != null ? st.clockH : 6, st.clockM != null ? st.clockM : 5, { rim: "#c9544a" });
    D.rect(c, 420, top + 40, 230, 100, "#9aa3ad"); D.rect(c, 420, top + 40, 230, 100, null); D.rect(c, 430, top + 50, 210, 80, "#6f7a86", null); D.rr(c, 470, top + 52, 120, 26, 4, "#b8c0c8");
    // booth (left) with two customers sipping
    D.rr(c, 40, y - 150, 40, 150, 6, "#c9544a"); D.rr(c, 190, y - 150, 40, 150, 6, "#c9544a"); D.rect(c, 85, y - 110, 100, 14, "#e9ecef"); D.line(c, 135, y - 96, 135, y);
    for (const [x, f, sk] of [[95, 1, "#f0c49a"], [175, -1, "#7a4a32"]]) D.head(c, { x, y: y - 175, r: 26, skin: sk, eyes: "open", mouth: "smile", look: f });
    D.rr(c, 120, y - 132, 14, 22, 3, "rgba(180,220,240,0.9)"); D.rr(c, 150, y - 132, 14, 22, 3, "rgba(180,220,240,0.9)");
    // staff behind the counter
    if (st.cook !== false) D.personX(c, Object.assign({ x: st.cookX || 390, y, s: 0.7, arm: st.cookArm != null ? st.cookArm : -0.3, armL: st.cookArmL != null ? st.cookArmL : 0.3, eyes: st.cookEyes || "open", mouth: st.cookMouth || "flat", carry: st.pans ? "pans" : undefined, panUp: st.panUp || 0 }, st.newCook ? NEWCOOK : COOK));
    D.personX(c, Object.assign({ x: 705, y, s: 0.64, arm: st.theoArm != null ? st.theoArm : 0.2, armL: st.theoArmL != null ? st.theoArmL : -0.2, eyes: st.theoEyes || "open", mouth: st.theoMouth || "flat", look: st.theoLook || 0, carry: st.theoGlass ? "glass" : undefined }, THEO));
    // the counter, stools, register, straws
    D.rect(c, 240, y - 150, 560, 150, "#c9544a"); D.rect(c, 240, y - 162, 560, 16, "#e9ecef"); D.line(c, 240, y - 100, 800, y - 100, "#e9ecef", 6);
    D.rr(c, 610, y - 205, 76, 45, 6, "#3a4152"); D.rr(c, 618, y - 199, 60, 20, 3, "#a8e0b0"); D.text(c, st.reg || "$0.00", 648, y - 189, 14, P.ink);
    // straws: a dispenser; fly out when knocked (st.straws 0..1)
    D.rr(c, 555, y - 215, 34, 55, 5, "rgba(200,220,235,0.85)");
    const sk = st.straws || 0;
    for (let k = 0; k < 7; k++) { const a = -1.6 + k * 0.5; const d = sk * (80 + k * 22); c.save(); c.translate(572 + Math.cos(a) * d, y - 230 - Math.sin(-a) * d * 0.6 + sk * sk * 120); c.rotate(-0.3 + k * 0.25 + sk * 3 * (k % 2 ? 1 : -1)); D.rect(c, -3, -30, 6, 60, ["#c9544a", "#5fb3a3", "#e8a53a"][k % 3], P.ink, 1.5); c.restore(); }
    if (st.glassOnCounter) { D.rr(c, 470, y - 205, 28, 44, 5, "rgba(180,220,240,0.9)"); D.rect(c, 472, y - 192, 24, 30, "rgba(110,170,220,0.9)", null); }
    if (st.sparePans) for (const [x, r] of [[792, 30], [838, 24]]) { D.line(c, x, y - 300, x, y - 280, P.ink, 3); D.ell(c, x, y - 250, r, r, "#5a6070"); D.ell(c, x, y - 250, r * 0.75, r * 0.75, "#3a3f4a", null); }
    if (st.sparePans) { D.rr(c, 752, y - 318, 106, 24, 4, P.cream, P.ink, 2); D.text(c, "FOR HICCUPS", 805, y - 306, 12, P.ink); }
    for (const x of [300, 420, 540]) { D.line(c, x, y - 60, x, y - 4, "#9aa0aa", 6); D.ell(c, x, y - 64, 30, 10, "#c9544a"); }
    // the customer in front of the counter
    if (st.guest) { const g = st.guest; const j = g.jolt || 0;
      D.personX(c, Object.assign({ x: g.x, y: y - j * 10, s: 0.66, f: g.f || 1, walk: g.walk || 0, arm: g.arm != null ? g.arm : 0.15, armL: g.armL != null ? g.armL : -0.15, eyes: j > 0.3 ? "wide" : (g.eyes || "open"), mouth: j > 0.3 ? "o" : (g.mouth || "flat"), carry: g.glass ? "glass" : undefined, glassLevel: g.glassLevel }, GUEST)); }
  };
  const building = (c, t, st = {}) => {
    const grd = c.createLinearGradient(0, 0, 0, Y(4) - FH);
    if (st.day) { grd.addColorStop(0, "#8fcbe6"); grd.addColorStop(1, "#cfe8f2"); } else { grd.addColorStop(0, "#5a4a7a"); grd.addColorStop(1, "#f2a66a"); }
    c.fillStyle = grd; c.fillRect(-600, -400, 2400, Y(4) - FH + 400);
    D.rect(c, -600, BASE + 16, 2400, 600, "#3a3f4a", null);
    for (let k = -4; k < 10; k++) D.rect(c, k * 220, BASE + 150, 110, 10, "#e8e2d0", null);
    D.rect(c, -600, BASE + 16, 2400, 40, "#9a9ea6", P.ink, 2);
    D.rect(c, 0, Y(4) - FH - 40, W, BASE - (Y(4) - FH - 40) + 16, P.slate, null);
    D.rect(c, 160, Y(4) - FH - 90, 120, 50, P.slateLt); D.rect(c, 640, Y(4) - FH - 70, 70, 30, P.slateLt);
    for (let n = 1; n <= 4; n++) {
      if (n === 1) diner(c, t, st.diner || {});
      else { flat(c, n, 0, { day: st.day, dim: st.dim }); flat(c, n, 1, { day: st.day, dim: st.dim }); }
      D.stairCore(c, n, Y(n), FH, XS0, XS1);
      D.rect(c, 0, Y(n), W, 16, P.grey); D.rect(c, 0, Y(n) - FH, W, 16, P.grey);
      if (n > 1) D.rect(c, XA1, Y(n) - FH, XB0 - XA1, FH, P.slate, null);
      D.rect(c, XB1, Y(n) - FH, XS0 - XB1, FH, P.slate, null);
    }
    D.rect(c, XB1, F1 - 240, XS0 - XB1, 240, "#9b6a3e"); // the door from the stairs into the diner
    if (st.people) st.people(c);
  };
  const stairPos = (p) => { // p in floors above floor 1 (0 = floor 1, 2 = floor 3)
    const k = Math.floor(p), f = p - k, y = Y(1 + k);
    if (f < 0.5) { const q = f / 0.5; return { x: lerp(XS0 + 40, XS1 - 50, q), y: lerp(y, y - FH / 2, q), face: 1 }; }
    const q = (f - 0.5) / 0.5; return { x: lerp(XS1 - 50, XS0 + 40, q), y: lerp(y - FH / 2, y - FH, q), face: -1 };
  };
  const bubble = (c, x, y, txt, k = 1, size = 34) => { if (k <= 0) return; c.save(); c.translate(x, y); c.scale(k, k); c.font = `700 ${size}px "RSlab", Rockwell, serif`; const bw = c.measureText(txt).width + 44;
    D.rr(c, -bw / 2, -36, bw, 72, 24, P.white); c.beginPath(); c.moveTo(-20, 34); c.lineTo(-40, 64); c.lineTo(4, 34); D.fs(c, P.white); D.text(c, txt, 0, 2, size, P.ink); c.restore(); };
  const glassIcon = (c, x, y, s = 1) => { c.save(); c.translate(x, y); c.scale(s, s); D.rr(c, -18, -26, 36, 52, 6, "rgba(180,220,240,0.95)"); D.rect(c, -15, -8, 30, 30, "rgba(110,170,220,0.95)", null); c.restore(); };
  const exterior = (c, t, o) => {
    const z = o.zoom || 1; c.setTransform(z, 0, 0, z, 540 - 540 * z, 1100 - 1100 * z - 120); // -120: the DINER sign sits above the bottom pill
    const g = c.createLinearGradient(0, 0, 0, 1750);
    if (o.day) { g.addColorStop(0, "#7fc1e3"); g.addColorStop(1, "#d6eef6"); } else { g.addColorStop(0, "#3d3466"); g.addColorStop(0.55, "#b06a7a"); g.addColorStop(1, "#f2a66a"); }
    c.fillStyle = g; c.fillRect(-100, -100, 1300, 2200);
    if (!o.day) { for (const [sx, sy, r] of stars.slice(0, 18)) D.ell(c, sx * 1080, sy * 500, r, r, "#f3e9ff", null); D.ell(c, 820, 1180, 90, 90, "#ffcf7a", null); }
    else { D.ell(c, 860, 360, 70, 70, "#ffd65a"); for (const [x, y, s] of [[160, 300, 1], [640, 520, 0.8]]) for (const [dx, dy, r] of [[0, 0, 50], [50, -20, 60], [100, 0, 48]]) D.ell(c, x + dx * s, y + dy * s, r * s, r * 0.8 * s, "#ffffff", null); }
    D.rect(c, 60, 1050, 180, 700, o.day ? "#a7b9c8" : "#5a4a6a", null); D.rect(c, 860, 1150, 180, 600, o.day ? "#b4c4d0" : "#4a3f5c", null);
    const bx = 260, bw = 560, top = 760;
    D.rect(c, bx, top, bw, 1750 - top, o.day ? "#e9d6c0" : "#a66f5a");
    for (let f = 0; f < 3; f++) for (let k = 0; k < 3; k++) { const x = bx + 50 + k * 170, y = top + 50 + f * 220; D.rect(c, x, y, 120, 140, o.day ? P.sky : "#ffd889"); D.line(c, x + 60, y, x + 60, y + 140); D.line(c, x, y + 70, x + 120, y + 70); }
    // the diner: awning, sign, big window, door
    for (let k = 0; k < 8; k++) { c.beginPath(); c.moveTo(bx + k * 70, 1460); c.lineTo(bx + (k + 1) * 70, 1460); c.lineTo(bx + (k + 1) * 70 + 6, 1530); c.lineTo(bx + k * 70 + 6, 1530); c.closePath(); D.fs(c, k % 2 ? P.white : "#c9544a"); }
    D.rr(c, bx + 150, 1380, 260, 70, 10, P.pill); D.text(c, "DINER", bx + 280, 1416, 50, o.day ? P.white : "#ff8a7a");
    if (!o.day) { c.save(); c.globalAlpha = 0.35; D.text(c, "DINER", bx + 280, 1416, 50, "#ff8a7a"); c.restore(); }
    D.rect(c, bx + 30, 1560, 330, 170, o.day ? P.sky : "#ffe6a8"); D.line(c, bx + 195, 1560, bx + 195, 1730);
    D.rect(c, bx + 400, 1560, 110, 190, "#9b6a3e");
    if (o.sick) { D.rr(c, bx + 412, 1590, 86, 64, 4, P.white, P.ink, 2); D.text(c, "COOK", bx + 455, 1610, 18, P.red); D.text(c, "OFF SICK", bx + 455, 1636, 15, P.ink); }
    D.rect(c, -100, 1750, 1300, 400, "#3a3f4a", null); D.rect(c, -100, 1750, 1300, 30, "#9a9ea6", P.ink, 2);
    for (let k = 0; k < 6; k++) D.rect(c, k * 220 - 40, 1880, 110, 10, "#e8e2d0", null);
    for (const x of [140, 960]) { D.rect(c, x - 8, 1620, 16, 130, "#6b4a2e"); D.ell(c, x, 1600, 46, 46, "#5f8f5a"); }
  };

  // ---------------------------------------------------------------- timing
  const cd0 = Le("r10") - 0.25;
  const T = {
    o1: 0, o1b: w("r01", "into") - 0.15, o2: L("r02") - 0.12, o3: L("r03") - 0.1, o4: L("r04") - 0.25, o5: L("r05") - 0.25, o6: L("r06") - 0.12,
    o7: L("r07") - 0.12, o8: L("r08") - 0.15, o9: L("r09") - 0.15, card: L("r10") - 0.15, n1: Le("r11") + 0.3, x1: w("r12", "and") - 0.1,
    x2: L("r14") - 0.12, x3: L("r15") - 0.12, x4: L("r16") - 0.12, x5: L("r17") - 0.1, m1: L("r18") - 0.25, m2: L("r19") - 0.12,
    m3: w("r19", "hangs") - 0.15, end: L("r20") - 0.2, loop: V.duration - 0.45,
    o2b: w("r02", "slams") - 0.08, o3b: w("r03", "walks") - 0.1, o4b: w("r04", "crazy") - 0.45, o6b: w("r06", "drinks") - 0.1,
    o8b: w("r08", "no") - 0.1, x4b: w("r16", "bang") - 0.06, m3b: w("r19", "just") - 0.1,
  };
  const replayTint = "rgba(214,150,60,0.6)";
  let OV = null; // camera override for the insert shots (a closer framing of the same moment = a palette cut)
  const cam = (c, x, y, s) => (OV ? D.cam(c, OV[0], OV[1], OV[2]) : D.cam(c, x, y, s));

  const shots = [
    { // O1 hook: she runs DOWN the stairs from 3B (counter 3 -> 1)
      t0: T.o1, draw(c, lt, u, t) {
        const p = 2 - ramp(t, 0, T.o1b - 0.2, E.io) * 2, pos = stairPos(Math.max(0.001, Math.min(p, 1.999)));
        D.cam(c, 540, lerp(Y(3) - 330, F1 - 560, ramp(t, 0.05, T.o1b - 0.1, E.io)), 1.12);
        building(c, t, { diner: { guest: null }, people: (c) => D.personX(c, Object.assign({ x: pos.x, y: pos.y, s: 0.62, f: -pos.face, walk: Math.sin(t * 11), arm: -0.6, armL: 0.6, jolt: hic(t, 2.2) }, GUEST)) });
        D.counterPill(c, String(Math.max(1, Math.min(3, 1 + Math.floor(p + 0.02)))));
      } },
    { // O1b in the diner: she asks for a glass of water (bubble with a glass)
      t0: T.o1b, draw(c, lt, u, t) {
        D.cam(c, 470, F1 - 190, 1.85 + lt * 0.02);
        const walkIn = ramp(lt, 0, 0.9, E.o);
        building(c, t, { diner: { guest: { x: lerp(820, 470, walkIn), f: -1, walk: walkIn < 1 ? Math.sin(t * 11) : 0, jolt: hic(t, 2.2, 0.6) } } });
        const ask = ramp(t, w("r01", "glass") - 0.3, w("r01", "glass"), E.back);
        if (ask > 0) { bubble(c, 560, F1 - 360, "        ", ask, 34); glassIcon(c, 560, F1 - 362, 0.8 * ask); }
        D.counterPill(c, "6:05");
      } },
    { // O2 the cook grabs two pans and slams them right behind her (BANG)
      t0: T.o2, draw(c, lt, u, t) { o2(c, t, () => D.cam(c, 450, F1 - 200, 1.9 + lt * 0.02)); } },
    { // O2b insert: the pans and the BANG, close (a palette cut)
      t0: T.o2b, draw(c, lt, u, t) { o2(c, t, () => D.cam(c, 515, F1 - 355, 3.8 + lt * 0.05)); } },
  ];
  function o2(c, t, camFn) {
        camFn();
        const grab = ramp(t, w("r02", "grabs") - 0.2, w("r02", "grabs") + 0.3), slam = ramp(t, w("r02", "slams") - 0.05, w("r02", "slams") + 0.12);
        const jump = slam > 0 ? Math.max(0, 1 - (t - w("r02", "slams")) * 2.2) : 0;
        building(c, t, { diner: { cookX: 545, pans: grab > 0.5, panUp: grab > 0.5 ? 1 - slam : 0, cookArm: grab > 0.5 ? -2.6 + slam * 0.8 : -0.3, cookArmL: grab > 0.5 ? 2.6 - slam * 0.8 : 0.3, cookEyes: "wide",
          guest: { x: 470, f: -1, jolt: Math.max(jump, hic(t, 2.2, 1.2) * (slam > 0 ? 0 : 1)) } } });
        D.burst(c, 520, F1 - 430, 110, "BANG!", slam * (1 - ramp(t, w("r02", "slams") + 0.6, w("r02", "slams") + 0.9)));
  }
  const shots2 = [
    { // O3 she jumps, smiles, says thank you, walks out without drinking
      t0: T.o3, draw(c, lt, u, t) {
        cam(c, 520, F1 - 200, 2.0 + lt * 0.02);
        const out = ramp(t, w("r03", "walks") - 0.1, Le("r03") + 0.2, E.io);
        const ty = ramp(t, w("r03", "thank") - 0.2, w("r03", "thank"), E.back) * (1 - ramp(t, w("r03", "walks"), w("r03", "walks") + 0.2));
        building(c, t, { diner: { glassOnCounter: true, guest: { x: lerp(470, 900, out), f: out > 0.02 ? 1 : -1, walk: out > 0.02 && out < 1 ? Math.sin(t * 11) : 0, mouth: "smile", eyes: lt < 0.5 ? "wide" : "open", jolt: lt < 0.4 ? 1 - lt * 2.5 : 0 } } });
        bubble(c, 600, F1 - 360, "Thank you!", ty, 34);
      } },
    { // O4 Theo the cashier watches every evening; it drives him crazy ("?")
      t0: T.o4, draw(c, lt, u, t) {
        cam(c, 650, F1 - 180, 2.25 + lt * 0.012);
        const q = ramp(t, w("r04", "crazy") - 0.5, w("r04", "crazy"));
        building(c, t, { diner: { cook: true, theoArmL: q > 0.5 ? -2.6 : -0.2, theoEyes: q > 0.5 ? "wide" : "open", theoMouth: q > 0.5 ? "o" : "flat", theoLook: -1, glassOnCounter: true } });
        if (q > 0) for (let k = 0; k < 3; k++) D.qmark(c, 650 + k * 44, F1 - 330 - Math.abs(Math.sin(t * 5 + k)) * 12, 40, q);
      } },
    { // O5 the anomaly: the cook is off sick (dusk exterior, a sign on the door)
      t0: T.o5, draw(c, lt, u, t) { exterior(c, t, { sick: ramp(t, w("r05", "sick") - 0.3, w("r05", "sick")) > 0.5, zoom: 1.12 - lt * 0.03 }); } },
    { // O6 the new cook just hands her the water; she drinks the whole glass
      t0: T.o6, draw(c, lt, u, t) {
        cam(c, 450, F1 - 200, 1.9 + lt * 0.025);
        const drink = ramp(t, w("r06", "drinks") - 0.1, Le("r06") + 0.2);
        building(c, t, { diner: { newCook: true, cookX: 420, cookArm: -1.2, guest: { x: 470, f: -1, glass: true, glassLevel: 1 - drink, arm: -1.2 - drink * 1.0, jolt: hic(t, 2.0, 0.3) } } });
      } },
    { // O7 no smile, no thank you; she leaves looking worse (still jolting: the planted clue)
      t0: T.o7, draw(c, lt, u, t) {
        cam(c, 520, F1 - 200, 2.1 + lt * 0.02);
        const out = ramp(t, w("r07", "leaves") - 0.1, Le("r07") + 0.3, E.io);
        building(c, t, { diner: { newCook: true, guest: { x: lerp(480, 900, out), f: out > 0.02 ? 1 : -1, walk: out > 0.02 && out < 1 ? Math.sin(t * 11) : 0, mouth: "flat", eyes: "open", jolt: hic(t, 1.6, 0.5) } } });
        const sad = ramp(t, w("r07", "no") - 0.1, w("r07", "no") + 0.2) * (1 - ramp(t, w("r07", "leaves") - 0.1, w("r07", "leaves") + 0.1));
        if (sad > 0) bubble(c, 610, F1 - 360, "...", sad, 40);
      } },
    { // O8 Theo checks the water: fine; the booth customers drink normally
      t0: T.o8, draw(c, lt, u, t) {
        cam(c, 470, F1 - 180, 1.75 + lt * 0.015);
        const sip = ramp(t, w("r08", "checks") - 0.1, w("r08", "checks") + 0.3);
        building(c, t, { diner: { newCook: true, theoGlass: sip > 0.5, theoArm: sip > 0.5 ? -1.3 : 0.2, theoLook: 0 } });
        const ok = ramp(t, w("r08", "fine") - 0.1, w("r08", "fine") + 0.1, E.back);
        if (ok > 0) { c.save(); c.translate(690, F1 - 330); c.scale(ok, ok); D.ell(c, 0, 0, 30, 30, "#5fb35a"); D.line(c, -13, 0, -3, 11, P.white, 6); D.line(c, -3, 11, 15, -11, P.white, 6); c.restore(); }
      } },
    { // O9 the question (dusk exterior)
      t0: T.o9, draw(c, lt, u, t) { exterior(c, t, { zoom: 1.04 + lt * 0.05 }); } },
    { // CARD: pans vs water, a real 10 s countdown
      t0: T.card, bg: P.cream, draw(c, lt, u, t) { card(c, t); } },
    { // N1 the next evening, Theo replays the diner camera (a monitor by the register)
      t0: T.n1, draw(c, lt, u, t) {
        cam(c, 690, F1 - 200, 2.3 + lt * 0.06);
        building(c, t, { diner: { theoLook: 1, theoArm: -0.9 } });
        c.save(); c.translate(780, F1 - 330); D.rr(c, -70, -50, 140, 100, 8, "#1f2633"); D.rect(c, -60, -42, 120, 84, "#c98a4a", null);
        D.text(c, "REPLAY", 0, -26, 16, P.white); D.text(c, "×0.25", 0, 0, 22, "#ffe6a8"); D.ell(c, -48, -28, 5, 5, P.red, null); c.restore();
      } },
    { // X1 the replay: every few seconds, her shoulders jump (slow motion, amber tint)
      t0: T.x1, draw(c, lt, u, t) {
        cam(c, 490, F1 - 175, 2.75 + lt * 0.02);
        const j = hic(lt, 1.15, 0.2);
        building(c, t, { diner: { cookX: 360, guest: { x: 470, f: -1, jolt: j, mouth: "flat" } } });
        D.frameView(c, "DINER CAM · REPLAY ×0.25", "TUE 18:05:12", replayTint);
      } },
    { // X2 Hic. Hic. Hic. She has the hiccups (HIC bubbles on each word)
      t0: T.x2, draw(c, lt, u, t) {
        cam(c, 490, F1 - 175, 2.75 + lt * 0.02);
        const hits = [w("r14", "hic", 0), w("r14", "hic", 1), w("r14", "hic", 2)];
        let j = 0; for (const h of hits) { const d = t - h + 0.05; if (d > 0 && d < 0.35) j = Math.max(j, Math.sin(d / 0.35 * Math.PI)); }
        building(c, t, { diner: { cookX: 360, guest: { x: 470, f: -1, jolt: j, mouth: "flat" } } });
        hits.forEach((h, i) => { const nx = i < 2 ? hits[i + 1] - 0.03 : Le("r14") + 0.5; const k = ramp(t, h - 0.05, h + 0.12, E.back) * (t < nx ? 1 : 0); if (k > 0) bubble(c, [590, 615, 600][i], F1 - 285 - i * 10, "HIC!", k, 32); });
        { const n = hits.filter((h) => t > h - 0.05).length; if (n > 0) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); D.rr(c, 80, 1590, 230, 64, 14, "rgba(31,38,51,0.9)", null); D.text(c, `HIC ×${n}`, 195, 1623, 34, "#ffe6a8"); c.restore(); } }
        D.frameView(c, "DINER CAM · REPLAY ×0.25", "TUE 18:05:14", replayTint);
      } },
    { // X3 she never wanted the water; she wanted a fright (the cook sneaks up with the pans)
      t0: T.x3, draw(c, lt, u, t) {
        cam(c, 490, F1 - 175, 2.75 + lt * 0.02);
        building(c, t, { diner: { cookX: lerp(330, 545, ramp(lt, 0, 1.8, E.io)), pans: true, panUp: 1, cookArm: -2.6, cookArmL: 2.6, cookEyes: "open", cookMouth: "smile", guest: { x: 470, f: -1, jolt: hic(lt, 1.15, 0.5) } } });
        D.frameView(c, "DINER CAM · REPLAY ×0.25", "TUE 18:05:16", replayTint);
      } },
    { // X4 Bang go the pans, she jumps, the hiccups stop (the limit tag)
      t0: T.x4, draw(c, lt, u, t) {
        cam(c, 490, F1 - 175, 2.75 + lt * 0.02);
        const b = w("r16", "bang"), slam = ramp(t, b - 0.05, b + 0.1), jump = slam > 0 ? Math.max(0, 1 - (t - b) * 1.6) : 0;
        building(c, t, { diner: { cookX: 545, pans: true, panUp: 1 - slam, cookArm: -2.6 + slam * 0.8, cookArmL: 2.6 - slam * 0.8, cookEyes: "wide",
          guest: { x: 470, f: -1, jolt: jump, mouth: t > w("r16", "stop") ? "smile" : "flat", eyes: t > w("r16", "stop") ? "open" : undefined } } });
        D.burst(c, 575, F1 - 330, 85, "BANG!", slam * (1 - ramp(t, b + 0.7, b + 1.0)));
        const ok = ramp(t, w("r16", "stop") - 0.1, w("r16", "stop") + 0.15, E.back);
        if (ok > 0) { c.save(); c.translate(580, F1 - 250); c.scale(ok * 0.8, ok * 0.8); D.rr(c, -80, -30, 160, 60, 20, P.white); D.text(c, "HIC ×0", 0, 2, 28, "#3a8a4a"); c.restore(); }
        D.frameView(c, "DINER CAM · REPLAY ×0.25", "TUE 18:05:19", replayTint);
      } },
    { // X5 the water didn't work: the anomaly evening replayed, still HIC
      t0: T.x5, draw(c, lt, u, t) {
        cam(c, 490, F1 - 175, 2.75 + lt * 0.02);
        const j = hic(lt, 0.9, 0.1);
        building(c, t, { diner: { newCook: true, guest: { x: 470, f: -1, glass: true, glassLevel: 0, arm: -1.0, jolt: j, mouth: "flat" } } });
        if (j > 0.2) bubble(c, 570, F1 - 300, "HIC!", Math.min(1, j * 1.4) * 0.8, 30);
        D.frameView(c, "DINER CAM · REPLAY · WED", "WED 18:05:40", "rgba(120,150,190,0.55)");
      } },
    { // M1 Theo laughs so hard he knocks over the straws
      t0: T.m1, draw(c, lt, u, t) {
        cam(c, 650, F1 - 190, 2.3);
        const knock = ramp(t, w("r18", "knocks") - 0.1, w("r18", "straws") + 0.5, E.o);
        c.save(); c.translate(0, Math.abs(Math.sin(t * 14)) * 5);
        building(c, t, { diner: { theoEyes: "laugh", theoMouth: "laugh", theoArm: -0.3 - Math.abs(Math.sin(t * 7)) * 0.5, theoArmL: 1.2 + knock * 0.8, straws: knock } });
        c.restore();
      } },
    { // M2 the next morning (day exterior)
      t0: T.m2, draw(c, lt, u, t) { exterior(c, t, { day: true, zoom: 1.02 + lt * 0.05 }); } },
    { // M3 two spare pans by the register, "FOR HICCUPS"
      t0: T.m3, draw(c, lt, u, t) {
        cam(c, 700, F1 - 230, 2.2 + lt * 0.02);
        building(c, t, { day: true, diner: { sparePans: ramp(t, T.m3, T.m3 + 0.3) > 0.5, theoMouth: "smile", theoArm: -2.6 + Math.sin(t * 8) * 0.25, clockH: 8, clockM: 30, reg: "OPEN" } });
      } },
    { // END the opening composition; it loops into frame 1
      t0: T.end, draw(c, lt, u, t) {
        cam(c, 540, Y(3) - 330, 1.12);
        const pos = stairPos(1.999);
        building(c, t, { diner: {}, people: (c) => D.personX(c, Object.assign({ x: pos.x, y: pos.y, s: 0.62, f: -pos.face, jolt: hic(t, 2.2) }, GUEST)) });
        D.counterPill(c, "3");
        const fo = ramp(t, w("r20", "follow") - 0.2, w("r20", "follow") + 0.1, E.back) * (1 - ramp(t, T.loop - 0.15, T.loop));
        if (fo > 0) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = Math.min(1, fo); D.ell(c, 262, 1500, 30, 30, P.amber, P.ink, 3); D.line(c, 262, 1484, 262, 1516, P.ink, 5); D.line(c, 246, 1500, 278, 1500, P.ink, 5); c.restore(); }
      } },
  ];

  function card(c, t) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    D.rect(c, 0, 0, W, H, P.cream, null);
    const panel = (x, title, pans) => {
      D.rr(c, x, 300, 380, 560, 16, pans ? "#f6e0d0" : "#dce8f2", P.ink, 4);
      D.rr(c, x + 70, 280, 240, 56, 10, P.pill, null); D.text(c, title, x + 190, 308, 30, P.white);
      D.headX(c, { x: x + 190, y: 650, r: 88, skin: GUEST.skin, hairType: "curly", hairCol: GUEST.hairCol, mouth: pans ? "smile" : "flat", eyes: pans ? "open" : "wide" });
      if (pans) { D.burst(c, x + 190, 450, 95, "BANG!", 1); D.text(c, "Thank you!", x + 190, 805, 36, P.ink); }
      else { glassIcon(c, x + 190, 450, 2.4); D.text(c, "no thanks", x + 190, 805, 36, P.ink); }
    };
    panel(80, "pans", true); panel(620, "water", false);
    const sec = t < cd0 ? 0 : Math.min(10, t - cd0), shown = Math.max(0, 10 - Math.floor(sec));
    const frac = t < cd0 ? 1 : (sec >= 10 ? 0 : 1 - (sec % 1));
    const pulse = 1 + 0.08 * Math.max(0, 1 - (sec % 1) * 5) * (sec > 0 && sec < 10 ? 1 : 0);
    D.ringTimer(c, 540, 1180, 110, shown, frac, pulse);
    D.cardFooter(c, t, L("r11"), 1390);
  }
  const all = shots.concat(shots2);
  const at = (t0) => all.find((s) => s.t0 === t0);
  const insert = (t0, baseT0, ov) => { const base = at(baseT0); return { t0, draw(c, lt, u, t) { OV = typeof ov === "function" ? ov(lt) : ov; base.draw(c, lt, u, t); OV = null; } }; };
  all.push(
    insert(T.o3b, T.o3, (lt) => [560, F1 - 520, 1.12 + lt * 0.02]),       // she leaves: the building wide (sky + flats)
    insert(T.o4b, T.o4, (lt) => [705, F1 - 255, 3.6 + lt * 0.05]),        // Theo, close
    insert(T.o6b, T.o6, (lt) => [500, F1 - 250, 3.6 + lt * 0.05]),        // the glass draining, close
    insert(T.o8b, T.o8, (lt) => [140, F1 - 160, 3.2 + lt * 0.05]),        // the booth couple drinking normally (red booth)
    insert(T.x4b, T.x4, (lt) => [540, F1 - 290, 4.2 + lt * 0.05]),        // the replay BANG, close
    insert(T.m3b, T.m3, (lt) => [815, F1 - 270, 4.0 + lt * 0.04]),        // the spare pans + FOR HICCUPS sign
  );
  return { shots: all, T, cd0 };
};

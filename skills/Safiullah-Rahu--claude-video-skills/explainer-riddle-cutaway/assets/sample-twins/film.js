/* "Born Second, Born First" (riddle-twins): the classic daylight-saving twins riddle in the cutaway-building riddle format.
   Facts kept exact: US/Canada rule, DST ends on the first Sunday in November at 2:00 AM, when clocks go back to 1:00 AM,
   so 1:00-1:59 happens twice. Ivy 1:55 (first 1:55), June 25 min later = 1:20 (second pass). Needs kit.js + kit-ext.js. */
window.RC_FILM = function (K, V) {
  const { D, P, E, ramp, lerp, rng } = K;
  const L = (id) => V.L(id).start, Le = (id) => V.L(id).end, w = V.w;
  const W = 1080, H = 1920;
  const BASE = 2400, FH = 340, Y = (n) => BASE - (n - 1) * FH;
  const XA0 = 24, XA1 = 452, XB0 = 468, XB1 = 862, XS0 = 878, XS1 = 1080;
  const F2 = Y(2);
  const COLS = { 3: ["#dcdcef", "#d5e8d4"], 4: ["#f2e8c8", "#f4cfcf"] };
  const HANA = { skin: "#c68c64", hair: "bun", hat: "nurse", shirt: "#5fb3a3", pants: "#5fb3a3" };
  const MOM = { skin: "#f0c49a", hair: "bun", shirt: "#b7d0dc", blanket: "#e8d7f0", r: 34 };
  const DAD = { skin: "#f0c49a", hair: "short", shirt: "#7a6aa8", pants: "#3b3f4c" };
  const GRAN = { skin: "#e8b88a", hairType: "curly", hairCol: "#d8d8dc", shirt: "#c98a5a", pants: "#4a4f5c", glasses: true };
  const KID = { skin: "#f0c49a", hairType: "kid", hairCol: "#6a3e2a", pants: "#3b3f4c" };
  const stars = (() => { const r = rng(4); return Array.from({ length: 50 }, () => [r(), r(), 0.6 + r() * 1.5]); })();
  const leaves = (() => { const r = rng(12); return Array.from({ length: 22 }, () => [r() * 1080, r() * 1900, 0.5 + r(), r() * 6.28, ["#d9822b", "#c9544a", "#e8b04a"][Math.floor(r() * 3)]]); })();

  // ---------------------------------------------------------------- the hospital cutaway
  const nightWin = (c, x, y, w, h) => { D.rect(c, x, y, w, h, P.night); c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); for (const [sx, sy, r] of stars.slice(0, 7)) D.ell(c, x + sx * w, y + sy * h, r, r, "#e8ecf6", null); c.restore(); D.line(c, x + w / 2, y, x + w / 2, y + h); D.rect(c, x, y, w, h, null); };
  const bassinet = (c, x, y, col, tag, o = {}) => { // a clear bassinet on a stand with a swaddled baby + name tag
    D.line(c, x - 30, y, x - 22, y - 70, "#9aa0aa", 5); D.line(c, x + 30, y, x + 22, y - 70, "#9aa0aa", 5);
    D.rr(c, x - 45, y - 120, 90, 54, 18, "rgba(200,225,240,0.85)");
    if (o.baby !== false) { D.ell(c, x + 6, y - 112, 30, 18, col); D.ell(c, x - 22, y - 116, 15, 15, "#f0c49a"); c.beginPath(); c.arc(x - 22, y - 118, 5, 0.2 * Math.PI, 0.8 * Math.PI); D.st(c, P.ink, 2); }
    if (tag) { D.rr(c, x - 38, y - 64, 76, 26, 6, col, P.ink, 2); D.text(c, tag, x, y - 51, 15, P.ink); }
  };
  const room4 = (c, t, st) => { // the delivery room, floor 2 left
    const y = F2;
    D.rect(c, XA0, y - FH + 16, XA1 - XA0, FH - 16, "#e6eef2", null);
    nightWin(c, 60, y - 270, 100, 100);
    D.rr(c, 180, y - 300, 70, 26, 4, P.cream, P.ink, 2); D.text(c, "ROOM 4", 215, y - 287, 14, P.ink);
    D.wallClock(c, 300, y - 255, 34, st.h != null ? st.h : 1, st.m != null ? st.m : 50, { rim: "#5fb3a3" });
    D.bed(c, 40, 280, y, Object.assign({ head: -1, sit: 0.55, eyes: st.momEyes || "open", mouth: st.momMouth || "smile", frame: "#c9ccd6" }, MOM));
    if (st.family) { D.personX(c, Object.assign({ x: 335, y, s: 0.58, arm: 0.2, armL: -0.2, mouth: "smile" }, DAD)); D.personX(c, Object.assign({ x: 410, y, s: 0.54, arm: -0.3, mouth: "smile" }, GRAN)); }
    if (st.b1) bassinet(c, 322, y, "#f4b6c6", st.tags ? "IVY" : null);
    if (st.b2) bassinet(c, 405, y, "#f6dd8a", st.tags ? "JUNE" : null);
  };
  const station = (c, t, st) => { // the nurses' station with the big ward clock, floor 2 right
    const y = F2;
    D.rect(c, XB0, y - FH + 16, XB1 - XB0, FH - 16, "#dff0ea", null);
    D.wallClock(c, 760, y - 240, st.bigR || 62, st.h != null ? st.h : 3, st.m != null ? st.m : 10, { numerals: true, rim: "#3a4152" });
    D.rr(c, 478, y - 300, 112, 34, 6, "#5fb3a3"); D.text(c, "MATERNITY", 534, y - 283, 14, P.white);
    if (st.calendar) { D.rr(c, 612, y - 322, 70, 76, 6, P.white, P.ink, 2); D.rect(c, 612, y - 322, 70, 22, P.red, P.ink, 2); D.text(c, "NOV", 647, y - 311, 13, P.white); D.text(c, "2", 647, y - 279, 30, P.ink); D.text(c, "SUN", 647, y - 256, 11, P.ink); }
    if (st.hana !== false) D.personX(c, Object.assign({ x: st.hx || 640, y, s: 0.64, arm: st.arm != null ? st.arm : 0.4, armL: st.armL != null ? st.armL : -0.5, eyes: st.eyes || "open", mouth: st.mouth || "flat", look: st.look || 0, carry: st.clip ? "clipboard" : undefined }, HANA));
    D.rect(c, 500, y - 140, 340, 140, "#b8c4cc"); D.rect(c, 500, y - 152, 340, 16, "#e9ecef");
    D.rr(c, 520, y - 205, 70, 50, 5, "#3a4152"); D.rr(c, 528, y - 199, 54, 34, 3, "#9fd6c8");
    if (st.certs) { D.rr(c, 620, y - 168, 70, 18, 3, P.white, P.ink, 2); D.rr(c, 700, y - 166, 70, 18, 3, P.white, P.ink, 2); }
    if (st.dropClip != null && st.dropClip > 0) { c.save(); c.translate(lerp(690, 760, st.dropClip), lerp(y - 220, y - 20, st.dropClip * st.dropClip)); c.rotate(st.dropClip * 3); D.rr(c, -30, -42, 60, 84, 6, "#a8743f"); D.rect(c, -22, -32, 44, 64, P.white, P.ink, 2); c.restore(); }
  };
  const genericWard = (c, n, side) => {
    const y = Y(n), x0 = side ? XB0 : XA0, x1 = side ? XB1 : XA1;
    D.rect(c, x0, y - FH + 16, x1 - x0, FH - 16, COLS[n][side], null);
    nightWin(c, side ? 700 : 120, y - 270, 110, 100);
    D.rr(c, side ? 500 : 60, y - 80, 200, 70, 8, "#c9ccd6"); D.rr(c, side ? 506 : 66, y - 112, 188, 36, 12, P.white); D.rr(c, side ? 640 : 200, y - 120, 50, 46, 10, "#7a9ac0");
    if (n === 3 && side) { for (let k = 0; k < 3; k++) bassinet(c, 560 + k * 90, y, ["#f4b6c6", "#9fc9e8", "#f6dd8a"][k], null, { baby: k !== 1 }); }
    D.rect(c, x0, y - FH + 16, x1 - x0, FH - 16, "rgba(30,36,60,0.18)", null);
  };
  const lobby = (c) => {
    const y = Y(1);
    D.rect(c, XA0, y - FH + 16, XB1 - XA0, FH - 16, "#ecf2f0", null);
    D.rect(c, 40, y - 260, 170, 260, P.sky); D.line(c, 125, y - 260, 125, y); D.rect(c, 40, y - 260, 170, 260, null);
    D.rr(c, 300, y - 300, 300, 60, 8, "#c9544a"); D.text(c, "EMERGENCY · MATERNITY", 450, y - 270, 20, P.white);
    D.rect(c, 360, y - 140, 300, 140, "#b8c4cc"); D.rect(c, 360, y - 152, 300, 16, "#e9ecef");
    for (const x of [700, 770]) { D.rr(c, x - 26, y - 70, 52, 50, 8, "#5fb3a3"); D.rect(c, x - 26, y - 20, 6, 20, P.ink, null); D.rect(c, x + 20, y - 20, 6, 20, P.ink, null); }
    D.rect(c, 250, y - 90, 50, 90, "#b56a3a"); D.ell(c, 275, y - 120, 40, 34, "#6a9a5a");
  };
  const hospital = (c, t, st = {}) => {
    D.rect(c, -600, -400, 2400, Y(4) - FH + 400, P.night, null);
    for (const [sx, sy, r] of stars) D.ell(c, -300 + sx * 1700, -300 + sy * (Y(4) - FH + 260), r, r, "#dfe6f5", null);
    D.rect(c, -600, BASE + 16, 2400, 600, "#3a3f4a", null);
    for (let k = -4; k < 10; k++) D.rect(c, k * 220, BASE + 150, 110, 10, "#e8e2d0", null);
    D.rect(c, -600, BASE + 16, 2400, 40, "#9a9ea6", P.ink, 2);
    D.rect(c, 0, Y(4) - FH - 40, W, BASE - (Y(4) - FH - 40) + 16, "#5d6b7a", null);
    D.rect(c, 120, Y(4) - FH - 110, 210, 70, "#e9ecef"); D.line(c, 225, Y(4) - FH - 100, 225, Y(4) - FH - 50, P.red, 10); D.line(c, 200, Y(4) - FH - 75, 250, Y(4) - FH - 75, P.red, 10);
    for (let n = 1; n <= 4; n++) {
      if (n === 1) lobby(c);
      else if (n === 2) { room4(c, t, st.room || {}); station(c, t, st.station || {}); }
      else { genericWard(c, n, 0); genericWard(c, n, 1); }
      D.stairCore(c, n, Y(n), FH, XS0, XS1);
      D.rect(c, 0, Y(n), W, 16, P.grey); D.rect(c, 0, Y(n) - FH, W, 16, P.grey);
      if (n > 1) D.rect(c, XA1, Y(n) - FH, XB0 - XA1, FH, "#5d6b7a", null);
      D.rect(c, XB1, Y(n) - FH, XS0 - XB1, FH, "#5d6b7a", null);
    }
    if (st.people) st.people(c);
  };
  const party = (c, t, st = {}) => { // the twins' birthday (a home cutaway, warm light)
    if (OV) { const [cx, cy, z] = OV; c.setTransform(z, 0, 0, z, 540 - cx * z, 960 - cy * z); } else c.setTransform(1, 0, 0, 1, 0, 0);
    D.rect(c, 0, 0, W, H, "#f6e3c6", null);
    D.rect(c, 0, 1700, W, 220, "#b8865a", null); for (let k = 0; k < 12; k++) D.line(c, k * 100, 1700, k * 100 - 60, 1920, "#a3744c", 3);
    for (let k = 0; k < 14; k++) { const x = 40 + k * 76; c.beginPath(); c.moveTo(x, 300); c.lineTo(x + 38, 360 + (k % 2) * 10); c.lineTo(x + 76, 300); D.fs(c, ["#c9544a", "#5fb3a3", "#e8a53a"][k % 3]); }
    D.line(c, 0, 300, W, 300, P.ink, 3);
    for (const [x, y, col] of [[140, 520, "#f4b6c6"], [220, 470, "#f6dd8a"], [880, 500, "#9fc9e8"], [960, 560, "#f4b6c6"]]) { D.line(c, x, y + 70, x + 10, y + 260, P.ink, 2); D.ell(c, x, y, 56, 68, col); }
    D.rr(c, 330, 520, 420, 70, 10, "#fbf8f1", P.ink, 3); D.text(c, "HAPPY BIRTHDAY", 540, 556, 40, "#c9544a");
    // the twins (identical faces, different colours) behind the table
    D.personX(c, Object.assign({ x: 330, y: 1700, s: 1.55, shirt: "#f4b6c6", eyes: st.ivyEyes || "open", mouth: st.ivyMouth || "flat", arm: st.ivyArm != null ? st.ivyArm : 0.2, armL: st.ivyArmL != null ? st.ivyArmL : -0.2 }, KID));
    D.personX(c, Object.assign({ x: 750, y: 1700, s: 1.55, shirt: "#f6dd8a", eyes: st.juneEyes || "open", mouth: st.juneMouth || "flat", arm: st.juneArm != null ? st.juneArm : 0.2, armL: st.juneArmL != null ? st.juneArmL : -0.2 }, KID));
    D.rr(c, 100, 1400, 880, 44, 10, "#c98a5a"); D.rect(c, 140, 1444, 34, 256, "#a8743f"); D.rect(c, 906, 1444, 34, 256, "#a8743f");
    for (const [cx, out] of [[400, st.ivyOut || 0], [680, st.juneOut || 0]]) {
      D.rr(c, cx - 120, 1280, 240, 120, 16, "#fbf8f1"); D.rect(c, cx - 120, 1310, 240, 20, "#f4b6c6", null); D.rr(c, cx - 120, 1280, 240, 120, 16, null);
      for (let k = 0; k < 5; k++) { const x = cx - 76 + k * 38; D.rr(c, x - 6, 1236, 12, 46, 4, ["#5fb3a3", "#e8a53a", "#c9544a"][k % 3]);
        if (out < 1) { c.save(); c.globalAlpha = 1 - out; D.ell(c, x, 1222 - Math.sin(t * 9 + k) * 3, 9, 15, "#ffc65a", "#e8862b", 2); c.restore(); }
        else { c.save(); c.globalAlpha = Math.max(0, 1 - (out - 1)); D.line(c, x, 1226, x + 8, 1186, "#9aa0aa", 3); c.restore(); } }
    }
  };
  const exterior = (c, t, o) => {
    const z = o.zoom || 1; c.setTransform(z, 0, 0, z, 540 - 540 * z, 1100 - 1100 * z);
    D.rect(c, -100, -100, 1300, 2200, P.night, null);
    for (const [sx, sy, r] of stars) D.ell(c, sx * 1080, sy * 1100, r, r, "#dfe6f5", null);
    D.ell(c, 860, 360, 56, 56, "#f6efd2"); D.ell(c, 884, 344, 50, 50, P.night, null);
    D.rect(c, 40, 1120, 200, 630, "#2f3a58", null); D.rect(c, 860, 1200, 200, 550, "#344064", null);
    const bx = 250, bw = 580, top = 740;
    D.rect(c, bx, top, bw, 1750 - top, "#d8dde2");
    D.rect(c, bx + 190, top - 110, 200, 80, "#e9ecef"); D.line(c, bx + 290, top - 100, bx + 290, top - 40, P.red, 12); D.line(c, bx + 260, top - 70, bx + 320, top - 70, P.red, 12);
    D.rr(c, bx + 130, top + 20, 320, 56, 8, P.pill); D.text(c, "HOSPITAL", bx + 290, top + 49, 36, P.white);
    for (let f = 0; f < 3; f++) for (let k = 0; k < 4; k++) { const x = bx + 40 + k * 135, y = top + 120 + f * 230; const lit = (f * 4 + k) % 3 !== 1 || (f === 1); D.rect(c, x, y, 95, 140, lit ? "#ffe6a8" : "#2a3350"); D.line(c, x + 47, y, x + 47, y + 140); }
    D.rect(c, bx + 210, 1590, 160, 160, "#a9d3e6"); D.line(c, bx + 290, 1590, bx + 290, 1750);
    D.rr(c, bx + 170, 1540, 240, 40, 6, P.red); D.text(c, "MATERNITY", bx + 290, 1561, 26, P.white);
    D.rect(c, -100, 1750, 1300, 400, "#3a3f4a", null); D.rect(c, -100, 1750, 1300, 30, "#9a9ea6", P.ink, 2);
    for (const x of [150, 950]) { D.rect(c, x - 9, 1600, 18, 150, "#6b4a2e"); D.ell(c, x, 1570, 60, 52, "#c9772b"); }
    for (const [x0, y0, s, ph, col] of leaves) { const y = (y0 + t * 60 * s) % 1900, x = x0 + Math.sin(t * 1.3 + ph) * 30; c.save(); c.translate(x, y); c.rotate(t * 2 + ph); D.ell(c, 0, 0, 12 * s, 6 * s, col, P.ink, 1.5); c.restore(); }
  };
  const tag = (c, txt, x, y, col, k = 1) => { if (k <= 0) return; c.save(); c.translate(x, y); c.scale(k, k); c.font = '700 30px "RSlab", Rockwell, serif'; const tw = c.measureText(txt).width + 36; D.rr(c, -tw / 2, -26, tw, 52, 10, col, P.ink, 3); D.text(c, txt, 0, 2, 30, P.ink); c.restore(); };
  const certCard = (c, x, y, name, time, col, s = 1) => { c.save(); c.translate(x, y); c.scale(s, s); D.rr(c, -150, -110, 300, 220, 10, "#fffaf0", P.ink, 4); D.rect(c, -150, -110, 300, 40, col, P.ink, 4);
    D.text(c, "BIRTH CERTIFICATE", 0, -90, 18, P.ink); D.text(c, name, 0, -30, 44, P.ink); D.text(c, "born " + time, 0, 30, 36, "#3a4152"); D.line(c, -110, 70, 110, 70, "#9aa0aa", 2); D.text(c, "SUN · NOV 2", 0, 88, 16, "#6a7380"); c.restore(); };
  const clockOf = (min) => { const m = ((min % 720) + 720) % 720; return { h: Math.floor(m / 60), m: m % 60 }; }; // minutes since 0:00 -> {h, m}

  // ---------------------------------------------------------------- timing
  const cd0 = Le("r10") - 0.25;
  const T = {
    o1: 0, o2: L("r02") - 0.12, o2b: w("r02", "twenty") - 0.15, o3: L("r03") - 0.1, o4: L("r04") - 0.25, o5: L("r05") - 0.25, o6: L("r06") - 0.12,
    o7: L("r07") - 0.12, o7b: w("r07", "so") - 0.1, o8: L("r08") - 0.15, o9: L("r09") - 0.15, card: L("r10") - 0.15, n1: Le("r11") + 0.3,
    x1: L("r13") - 0.12, x2: L("r14") - 0.12, x3: L("r15") - 0.1, x4: L("r16") - 0.12, m1: L("r17") - 0.25, m2: L("r18") - 0.12,
    end: L("r19") - 0.2, loop: V.duration - 0.45,
    o2i: w("r02", "exactly") - 0.1, o3i: w("r03", "everybody") - 0.1, o4i: w("r04", "checks") - 0.1, o7i: w("r07", "younger") - 0.1,
    x1i: w("r13", "november") - 0.15, x2i: w("r14", "two") - 0.1, x3i: w("r15", "1") - 0.1, m1i: w("r17", "drops") - 0.1, m2i: w("r18", "june") - 0.1,
  };
  const tint = "rgba(150,125,215,0.55)";
  let OV = null; // camera override for the insert shots (a closer framing of the same moment = a palette cut)
  const cam = (c, x, y, s) => (OV ? D.cam(c, OV[0], OV[1], OV[2]) : D.cam(c, x, y, s));

  const shots = [
    { // O1 hook: rising from the lobby to the maternity ward; the time pill rolls 1:48 -> 1:54
      t0: T.o1, draw(c, lt, u, t) {
        const k = ramp(t, 0.05, T.o2 - 0.2, E.io);
        cam(c, 540, lerp(Y(1) - 300, F2 - 330, k), 1.12);
        hospital(c, t, { room: { h: 1, m: Math.round(lerp(48, 54, k)), momEyes: "closed", momMouth: "flat" }, station: { h: 1, m: Math.round(lerp(48, 54, k)), hana: true, arm: 0.3 } });
        D.counterPill(c, `1:${String(Math.round(lerp(48, 54, k))).padStart(2, "0")}`);
      } },
    { // O2 Ivy first, at exactly 1:55
      t0: T.o2, draw(c, lt, u, t) {
        cam(c, 260, F2 - 190, 1.95 + lt * 0.02);
        const b1 = ramp(t, w("r02", "ivy") - 0.1, w("r02", "ivy") + 0.3, E.back);
        hospital(c, t, { room: { h: 1, m: 55, b1: b1 > 0.5, tags: true } });
        tag(c, "IVY · 1:55", 330, F2 - 330, "#f4b6c6", ramp(t, w("r02", "exactly") - 0.1, w("r02", "exactly") + 0.2, E.back));
        D.counterPill(c, "1:55");
      } },
    { // O2b twenty-five minutes later, June (the pill shows elapsed time, not the clock: no giveaway)
      t0: T.o2b, draw(c, lt, u, t) {
        cam(c, 300, F2 - 190, 1.95 + lt * 0.02);
        const b2 = ramp(t, w("r02", "june") - 0.1, w("r02", "june") + 0.3, E.back);
        hospital(c, t, { room: { h: 1, m: 55, b1: true, b2: b2 > 0.5, tags: true, momMouth: "smile" } });
        D.counterPill(c, `+${Math.min(25, Math.round(ramp(t, T.o2b, w("r02", "later") + 0.2) * 25))} min`);
      } },
    { // O3 Ivy is the big sister; everybody agrees (family nodding)
      t0: T.o3, draw(c, lt, u, t) {
        cam(c, 300, F2 - 180, 1.85 + lt * 0.03);
        hospital(c, t, { room: { h: 2, m: 40, b1: true, b2: true, tags: true, family: ramp(t, w("r03", "everybody") - 0.3, w("r03", "everybody")) > 0.5 } });
        tag(c, "BIG SISTER", 330, F2 - 330, "#f4b6c6", ramp(t, w("r03", "big") - 0.1, w("r03", "big") + 0.2, E.back));
      } },
    { // O4 Nurse Hana writes the certificates, checks every time twice
      t0: T.o4, draw(c, lt, u, t) {
        cam(c, 680, F2 - 175, 2.05 + lt * 0.012);
        const wr = Math.sin(t * 10) * 0.12;
        hospital(c, t, { station: { h: 4, m: 10, arm: -0.9 + wr, look: 0.5, certs: true, clip: false } });
      } },
    { // O5 then she reads them back (night exterior, autumn leaves)
      t0: T.o5, draw(c, lt, u, t) { exterior(c, t, { zoom: 1.12 - lt * 0.03 }); } },
    { // O6 Ivy 1:55, June 1:20 (the two certificates; Hana's "?")
      t0: T.o6, bg: "#dff0ea", draw(c, lt, u, t) {
        c.setTransform(1, 0, 0, 1, 0, 0); D.rect(c, 0, 0, W, H, "#dff0ea", null);
        D.rect(c, 0, 1300, W, 620, "#b8c4cc", null); D.rect(c, 0, 1284, W, 18, "#e9ecef", null);
        certCard(c, 290, 820, "IVY", "1:55 AM", "#f4b6c6", ramp(t, w("r06", "ivy") - 0.1, w("r06", "ivy") + 0.2, E.back) * 1.5);
        certCard(c, 790, 820, "JUNE", "1:20 AM", "#f6dd8a", ramp(t, w("r06", "june") - 0.1, w("r06", "june") + 0.2, E.back) * 1.5);
        D.headX(c, Object.assign({ x: 540, y: 1560, r: 120, eyes: "wide", mouth: "o", look: 0 }, HANA));
        const q = ramp(t, w("r06", "june") + 0.3, w("r06", "june") + 0.6);
        for (let k = 0; k < 3; k++) D.qmark(c, 430 + k * 110, 1340 - Math.abs(Math.sin(t * 5 + k)) * 16, 70, q);
      } },
    { // O7 on paper the younger came first: the birthday cake
      t0: T.o7, draw(c, lt, u, t) {
        party(c, t, { juneOut: ramp(t, w("r07", "birthday") - 0.2, w("r07", "birthday") + 0.6), juneMouth: "o", juneEyes: "closed", ivyMouth: "flat", ivyArm: -0.7, ivyArmL: 0.7 });
        const zo = !!OV; c.setTransform(1, 0, 0, 1, 0, 0); // the certificate is a screen overlay (also in the zoomed insert)
        certCard(c, zo ? 230 : 540, zo ? 650 : 760, "JUNE", "1:20 AM", "#f6dd8a", (zo ? 0.95 : 0.9) * ramp(zo ? 1 : lt, 0.1, 0.4, E.back));
      } },
    { // O7b ... so the older twin blows out her candles second
      t0: T.o7b, draw(c, lt, u, t) {
        party(c, t, { juneOut: 1.5, juneMouth: "smile", ivyOut: ramp(t, w("r07", "candles") - 0.2, w("r07", "second") + 0.3), ivyMouth: "o", ivyEyes: "closed" });
        tag(c, "2nd", 330, 1020, "#f4b6c6", ramp(t, w("r07", "second") - 0.1, w("r07", "second") + 0.2, E.back)); tag(c, "1st", 750, 1020, "#f6dd8a", ramp(lt, 0, 0.3, E.back));
      } },
    { // O8 Hana checks again: no typo; same room, same night, same clock (pan to the ward clock)
      t0: T.o8, draw(c, lt, u, t) {
        const pan = ramp(t, w("r08", "same") - 0.2, w("r08", "clock") + 0.2, E.io);
        cam(c, lerp(660, 760, pan), lerp(F2 - 175, F2 - 240, pan), lerp(2.05, 3.0, pan));
        hospital(c, t, { station: { h: 4, m: 20, clip: true, arm: -1.0, look: 0.6, eyes: "wide" } });
        const ok = ramp(t, w("r08", "typo") - 0.2, w("r08", "typo") + 0.1, E.back) * (1 - pan);
        if (ok > 0) tag(c, "no typo", 640, F2 - 330, "#c9ecc0", ok);
      } },
    { // O9 the question (night exterior)
      t0: T.o9, draw(c, lt, u, t) { exterior(c, t, { zoom: 1.04 + lt * 0.05 }); } },
    { // CARD
      t0: T.card, bg: P.cream, draw(c, lt, u, t) { card(c, t); } },
    { // N1 the answer was hanging on the ward wall (push in to the big clock)
      t0: T.n1, draw(c, lt, u, t) {
        const p = ramp(lt, 0, 2.8, E.io);
        cam(c, lerp(680, 760, p), lerp(F2 - 180, F2 - 240, p), lerp(2.0, 3.6, p));
        hospital(c, t, { station: { h: 1, m: 50, clip: true, look: 0.8, calendar: true, hx: 560 } });
      } },
    { // X1 first Sunday in November; at 2 AM the clocks went back one hour (the framed clock view)
      t0: T.x1, draw(c, lt, u, t) {
        cam(c, 720, F2 - 230, 4.2 + lt * 0.02);
        const a = ramp(t, w("r13", "2") - 0.6, w("r13", "2"), E.io), b = ramp(t, w("r13", "back") - 0.1, w("r13", "hour") + 0.3, E.io);
        const tm = clockOf(lerp(lerp(115, 120, a), 60, b) ); // 1:55 -> 2:00, then back to 1:00
        hospital(c, t, { station: { h: tm.h, m: tm.m, bigR: 62, calendar: true, hana: false } });
        D.frameView(c, "WARD CLOCK · SUN NOV 2", `SUN ${String(tm.h || 12).padStart(2, "0")}:${String(Math.floor(tm.m)).padStart(2, "0")}`, tint);
        if (b > 0.05 && b < 0.98) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = Math.sin(b * Math.PI); for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(540 + 160, 1000, 330 + k * 26, -1.9 + k * 0.1, -0.9 + k * 0.1, true); D.st(c, P.white, 8); } c.restore(); }
      } },
    { // X2 Ivy at 1:55; five minutes later two o'clock turned back into one o'clock
      t0: T.x2, draw(c, lt, u, t) {
        cam(c, 560, F2 - 190, 1.85 + lt * 0.015);
        const a = ramp(t, w("r14", "five") - 0.2, w("r14", "later") + 0.2, E.io), b = ramp(t, w("r14", "back") - 0.2, w("r14", "one", 1) + 0.3, E.io);
        const tm = clockOf(lerp(lerp(115, 120, a), 60, b));
        hospital(c, t, { room: { h: tm.h, m: tm.m, b1: true, tags: true }, station: { h: tm.h, m: tm.m, bigR: 62, calendar: true, look: 0.8, hx: 560 } });
        tag(c, "IVY · 1:55", 385, F2 - 330, "#f4b6c6", 1);
        tag(c, "2:00 → 1:00", 700, F2 - 330, "#d9c8f2", ramp(t, w("r14", "back") - 0.1, w("r14", "back") + 0.2, E.back));
        D.frameView(c, "WARD REPLAY · NOV 2", `SUN ${String(tm.h || 12).padStart(2, "0")}:${String(Math.floor(tm.m)).padStart(2, "0")}`, tint);
      } },
    { // X3 June twenty minutes later, at 1:20 the second time the clock showed it
      t0: T.x3, draw(c, lt, u, t) {
        cam(c, 560, F2 - 190, 1.85 + lt * 0.015);
        const a = ramp(t, w("r15", "twenty") - 0.2, w("r15", "1") + 0.2, E.io);
        const tm = clockOf(lerp(60, 80, a));
        hospital(c, t, { room: { h: tm.h, m: tm.m, b1: true, b2: a > 0.95, tags: true, momMouth: "smile" }, station: { h: tm.h, m: tm.m, bigR: 62, calendar: true, look: 0.8, hx: 560 } });
        tag(c, "JUNE · 1:20", 410, F2 - 330, "#f6dd8a", ramp(t, w("r15", "1") - 0.1, w("r15", "1") + 0.2, E.back));
        tag(c, "1:20 (2nd time)", 695, F2 - 400, "#d9c8f2", ramp(t, w("r15", "second") - 0.1, w("r15", "second") + 0.2, E.back));
        D.frameView(c, "WARD REPLAY · NOV 2", `SUN ${String(tm.h || 12).padStart(2, "0")}:${String(Math.floor(tm.m)).padStart(2, "0")}`, tint);
      } },
    { // X4 25 minutes younger, 35 minutes older on paper: the clock-time ribbon (the limit tag)
      t0: T.x4, bg: "#efe9fb", draw(c, lt, u, t) {
        c.setTransform(1, 0, 0, 1, 0, 0); D.rect(c, 0, 0, W, H, "#efe9fb", null);
        const k = ramp(lt, 0, 0.6, E.o);
        c.translate(540, 900); c.scale(1.3, 1.3); c.translate(-540, -900);
        // the real timeline (top): Ivy 1:55 -> +25 min -> June ; the clock timeline (bottom): June 1:20 ... Ivy 1:55
        D.text(c, "REAL TIME", 540, 640, 34, "#6a5a9a");
        D.line(c, 140, 740, 140 + 800 * k, 740, P.ink, 8);
        if (k > 0.2) { D.ell(c, 220, 740, 26, 26, "#f4b6c6"); D.text(c, "IVY", 220, 800, 28, P.ink); }
        if (k > 0.9) { D.ell(c, 860, 740, 26, 26, "#f6dd8a"); D.text(c, "JUNE", 860, 800, 28, P.ink); D.text(c, "+25 min", 540, 700, 30, "#3a8a4a"); }
        const k2 = ramp(t, w("r16", "thirty") - 0.2, w("r16", "paper") + 0.2, E.o);
        D.text(c, "ON THE CLOCK", 540, 1000, 34, "#6a5a9a");
        D.line(c, 140, 1100, 140 + 800 * k2, 1100, P.ink, 8);
        if (k2 > 0.2) { D.ell(c, 220, 1100, 26, 26, "#f6dd8a"); D.text(c, "JUNE 1:20", 220, 1160, 26, P.ink); }
        if (k2 > 0.9) { D.ell(c, 860, 1100, 26, 26, "#f4b6c6"); D.text(c, "IVY 1:55", 860, 1160, 26, P.ink); D.text(c, "35 min earlier", 540, 1060, 30, "#c9544a"); }
        D.wallClock(c, 540, 1330, 100, 1, Math.round(lerp(0, 59, (lt * 0.6) % 1)), { numerals: true, rim: "#6a5a9a" });
        D.frameView(c, "WARD REPLAY · NOV 2", "1:00 – 1:59 × 2", null, { scan: "rgba(80,60,140,0.06)" });
      } },
    { // M1 Hana laughs so hard she drops her clipboard
      t0: T.m1, draw(c, lt, u, t) {
        cam(c, 670, F2 - 185, 2.25);
        const drop = ramp(t, w("r17", "drops") - 0.1, w("r17", "clipboard") + 0.5, E.i);
        c.save(); c.translate(0, Math.abs(Math.sin(t * 14)) * 5);
        hospital(c, t, { station: { h: 4, m: 45, eyes: "laugh", mouth: "laugh", arm: -0.3 - Math.abs(Math.sin(t * 7)) * 0.5, armL: 1.2, dropClip: drop } });
        c.restore();
      } },
    { // M2 Ivy is older, June has the paperwork; they still argue every birthday
      t0: T.m2, draw(c, lt, u, t) {
        const arg = Math.sin(t * 6);
        party(c, t, { ivyOut: 1.5, juneOut: 1.5, ivyMouth: "open", juneMouth: "smile", ivyArm: -1.9 + arg * 0.2, juneArm: -2.2, ivyEyes: "open", juneEyes: "open" });
        const zo = !!OV; if (zo) c.setTransform(1, 0, 0, 1, 0, 0);
        certCard(c, zo ? 860 : 830, zo ? 860 : 820, "JUNE", "1:20 AM", "#f6dd8a", (zo ? 0.8 : 0.75) * ramp(t, w("r18", "paperwork") - 0.2, w("r18", "paperwork"), E.back));
        const say = ramp(t, w("r18", "ivy") - 0.1, w("r18", "ivy") + 0.2, E.back);
        if (say > 0) { c.save(); c.translate(260, 860); c.scale(say, say); D.rr(c, -150, -46, 300, 92, 28, P.white); D.text(c, "I'm older!", 0, 2, 40, P.ink); c.restore(); }
      } },
    { // END the opening composition; loops into frame 1
      t0: T.end, draw(c, lt, u, t) {
        cam(c, 540, Y(1) - 300, 1.12);
        hospital(c, t, { room: { h: 1, m: 48, momEyes: "closed", momMouth: "flat" }, station: { h: 1, m: 48, arm: 0.3 } });
        D.counterPill(c, "1:48");
        const fo = ramp(t, w("r19", "follow") - 0.2, w("r19", "follow") + 0.1, E.back) * (1 - ramp(t, T.loop - 0.15, T.loop));
        if (fo > 0) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = Math.min(1, fo); D.ell(c, 262, 1500, 30, 30, P.amber, P.ink, 3); D.line(c, 262, 1484, 262, 1516, P.ink, 5); D.line(c, 246, 1500, 278, 1500, P.ink, 5); c.restore(); }
      } },
  ];

  function card(c, t) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    D.rect(c, 0, 0, W, H, P.cream, null);
    const panel = (x, title, name, h, m, col) => {
      D.rr(c, x, 300, 380, 560, 16, col, P.ink, 4);
      D.rr(c, x + 40, 280, 300, 56, 10, P.pill, null); D.text(c, title, x + 190, 308, 28, P.white);
      D.wallClock(c, x + 190, 520, 120, h, m, { numerals: true, rim: "#3a4152" });
      D.text(c, name, x + 190, 690, 44, P.ink); D.text(c, `${h}:${String(m).padStart(2, "0")} AM`, x + 190, 745, 36, "#3a4152");
      D.rr(c, x + 140, 780, 100, 56, 6, P.white, P.ink, 2); D.rect(c, x + 140, 780, 100, 18, P.red, P.ink, 2); D.text(c, "SUN · NOV", x + 190, 818, 15, P.ink);
    };
    panel(80, "born first", "IVY", 1, 55, "#fbe3ea"); panel(620, "born second", "JUNE", 1, 20, "#fbf1cf");
    const sec = t < cd0 ? 0 : Math.min(10, t - cd0), shown = Math.max(0, 10 - Math.floor(sec));
    const frac = t < cd0 ? 1 : (sec >= 10 ? 0 : 1 - (sec % 1));
    const pulse = 1 + 0.08 * Math.max(0, 1 - (sec % 1) * 5) * (sec > 0 && sec < 10 ? 1 : 0);
    D.ringTimer(c, 540, 1180, 110, shown, frac, pulse);
    D.cardFooter(c, t, L("r11"), 1390);
  }
  const at = (t0) => shots.find((s) => s.t0 === t0);
  const insert = (t0, baseT0, ov) => { const base = at(baseT0); return { t0, bg: base.bg, draw(c, lt, u, t) { OV = typeof ov === "function" ? ov(lt) : ov; base.draw(c, lt, u, t); OV = null; } }; };
  shots.push(
    insert(T.o2i, T.o2, (lt) => [330, F2 - 204, 3.4 + lt * 0.05]),        // Ivy's bassinet + tag, close
    insert(T.o3i, T.o3, (lt) => [370, F2 - 200, 3.4 + lt * 0.05]),        // the family smiling, close
    insert(T.o4i, T.o4, (lt) => [660, F2 - 190, 3.8 + lt * 0.05]),        // Hana writing, close
    insert(T.o7i, T.o7, (lt) => [740, 1220, 2.0 + lt * 0.04]),            // June's cake, close (party zoom)
    insert(T.x1i, T.x1, (lt) => [717, F2 - 261, 4.8 + lt * 0.05]),        // the ward clock turning back, NOV 2 calendar to its left
    insert(T.x2i, T.x2, (lt) => [728, F2 - 214, 3.5 + lt * 0.04]),        // the clock turning back + the whole 2:00 -> 1:00 tag
    insert(T.x3i, T.x3, (lt) => [410, F2 - 150, 4.2 + lt * 0.05]),        // June's bassinet at 1:20, close
    insert(T.m1i, T.m1, (lt) => [650, F2 - 230, 3.8 + lt * 0.04]),        // Hana laughing, close
    insert(T.m2i, T.m2, (lt) => [760, 1050, 1.9 + lt * 0.04]),            // June with the paperwork, close
  );
  return { shots, T, cd0 };
};

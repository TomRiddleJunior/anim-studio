/* fb-kit.js — "fable storybook" drawing kit (Canvas 2D, 1080x1920, pure functions of their arguments).
   Flat storybook vector with soft shading in a dusky purple palette: dusk/night/day skies, hills, a wooden hen house
   (outside and inside), original animal characters (hen, fox, owl narrator), the format's overlays (cream label card
   with a yellow underline, DAY pill + tally marks, a hanging sign that gets crossed out, speech bubbles, a photo card
   with an "A FABLE" tag, karaoke captions) and the lesson-section pieces (navy stage, house icons, billboards, a peg
   person, big percentages). Fonts (loaded by compositions/world.html): FBNunito (Nunito variable). */
(function () {
  const FB = {};
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const lin = (a, b, x) => clamp((x - a) / (b - a), 0, 1);
  const sstep = (a, b, x) => { const u = lin(a, b, x); return u * u * (3 - 2 * u); };
  const eio = (u) => { u = clamp(u, 0, 1); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
  const eout = (u) => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
  const back = (u, k = 1.8) => { u = clamp(u, 0, 1); const c3 = k + 1; return 1 + c3 * Math.pow(u - 1, 3) + k * Math.pow(u - 1, 2); };
  function rng(seed) { let a = seed >>> 0; return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hex = (h) => { h = h.replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
  const mixc = (a, b, u) => { const A = hex(a), B = hex(b); return `rgb(${Math.round(lerp(A[0], B[0], u))},${Math.round(lerp(A[1], B[1], u))},${Math.round(lerp(A[2], B[2], u))})`; };
  const mix3 = (a, b, c, u) => (u < 0.5 ? mixc(a, b, u * 2) : mixc(b, c, (u - 0.5) * 2));
  FB.util = { clamp, lerp, lin, sstep, eio, eout, back, rng, hex, mixc };

  // palette (measured on the source: dusk sky, plum walls, navy lesson stage, cream cards, mustard accent)
  const P = {
    ink: "#2a1d33", cream: "#f3eadb", creamHi: "#fbf4e8", yellow: "#f2c14e", mustard: "#e2a93b", pink: "#d64b6e",
    navy0: "#30457a", navy1: "#1b2646", plum: "#3a2b44", plumD: "#2b1f34", plank: "#4a3552", plankL: "#5a4363",
    duskTop: "#b88ea6", duskBot: "#e9b38c", nightTop: "#1d2240", nightBot: "#4b3c66", dayTop: "#a9c3d9", dayBot: "#efd9b9",
    hill1: "#9d7ca3", hill2: "#7d5f88", ground: "#5b466a", grass: "#6d567a",
  };
  FB.P = P;

  FB.create = function ({ canvas, width = 1080, height = 1920 }) {
    let ctx = canvas.getContext("2d");
    const W = width, H = height;
    const K = { ctx, W, H, P, clamp, lerp, lin, sstep, eio, eout, back, rng, hex, mixc };
    K.setCtx = (c) => { ctx = c; K.ctx = c; };          // draw the next pieces into another canvas (offscreen buffers)
    const fonts = ["900 64px FBNunito", "800 40px FBNunito", "700 30px FBNunito"];
    K.ready = (document.fonts ? Promise.all(fonts.map((f) => document.fonts.load(f))) : Promise.resolve()).then(() => true);

    // ------------------------------------------------------------ primitives
    K.rr = function (x, y, w, h, r, c) {
      c = c || ctx; r = Math.max(0, Math.min(r, w / 2, h / 2));
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    };
    K.circle = (x, y, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); ctx.fill(); };
    K.ell = (x, y, rx, ry, rot, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, Math.PI * 2); ctx.fill(); };
    K.poly = (pts, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fill(); };
    K.font = (w, px) => `${w} ${px}px FBNunito`;
    K.text = function (s, x, y, o = {}) {
      ctx.save(); ctx.font = K.font(o.w || 900, o.px || 40);
      ctx.textAlign = o.align || "center"; ctx.textBaseline = o.base || "middle";
      if ("letterSpacing" in ctx) ctx.letterSpacing = (o.ls || 0) + "px";
      ctx.globalAlpha *= o.a == null ? 1 : o.a;
      if (o.stroke) { ctx.lineJoin = "round"; ctx.strokeStyle = o.stroke; ctx.lineWidth = o.sw || 8; ctx.strokeText(s, x, y); }
      ctx.fillStyle = o.col || P.ink; ctx.fillText(s, x, y);
      ctx.restore();
    };
    K.glow = function (x, y, r, rgb, a) {
      if (a <= 0.002) return;
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`); g.addColorStop(0.4, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a * 0.4})`); g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
    };
    K.cone = function (x, y, len, w0, w1, rgb, a) {     // soft light cone pointing down
      if (a <= 0.002) return;
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const g = ctx.createLinearGradient(0, y, 0, y + len);
      g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`); g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w0 / 2, y); ctx.lineTo(x + w0 / 2, y); ctx.lineTo(x + w1 / 2, y + len); ctx.lineTo(x - w1 / 2, y + len); ctx.closePath(); ctx.fill();
      ctx.restore();
    };
    K.shade = (a, col) => { if (a <= 0.002) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.fillStyle = col || "#0c0a1c"; ctx.fillRect(0, 0, W, H); ctx.restore(); };
    K.vignette = function (a = 0.4) {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const g = ctx.createRadialGradient(W / 2, H * 0.46, H * 0.3, W / 2, H * 0.5, H * 0.78);
      g.addColorStop(0, "rgba(10,6,20,0)"); g.addColorStop(1, `rgba(10,6,20,${a})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    };
    // grain: 4 pre-made tiles, cycled by frame
    const GR = [];
    for (let k = 0; k < 4; k++) {
      const c = document.createElement("canvas"); c.width = 270; c.height = 480; const g = c.getContext("2d");
      const im = g.createImageData(270, 480); const r = rng(100 + k);
      for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
      g.putImageData(im, 0, 0); GR.push(c);
    }
    K.grain = function (t, a = 0.045) {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.globalCompositeOperation = "overlay";
      ctx.imageSmoothingEnabled = false; ctx.drawImage(GR[Math.floor(t * 12) % 4], 0, 0, W, H); ctx.restore();
    };

    // ------------------------------------------------------------ outdoors
    /* sky: tod 0 = dusk, 1 = night, 2 = day (fractional values blend) */
    K.sky = function (tod, y0 = -600, y1 = 1150) {
      const pick = (k) => { const set = [[P.duskTop, P.duskBot], [P.nightTop, P.nightBot], [P.dayTop, P.dayBot]]; return set[k]; };
      const k0 = Math.floor(tod) % 3, k1 = (k0 + 1) % 3, u = tod - Math.floor(tod);
      const top = mixc(pick(k0)[0], pick(k1)[0], u), bot = mixc(pick(k0)[1], pick(k1)[1], u);
      const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, top); g.addColorStop(1, bot);
      ctx.fillStyle = g; ctx.fillRect(-2000, y0 - 2000, W + 4000, y1 - y0 + 2000);
    };
    K.sun = function (x, y, r, a = 1, moon = false) {
      ctx.save(); ctx.globalAlpha *= a;
      K.glow(x, y, r * 3.2, moon ? [220, 215, 255] : [255, 225, 170], 0.35);
      K.circle(x, y, r, moon ? "#e9e4f2" : "#f7e3b2");
      if (moon) { ctx.globalCompositeOperation = "destination-out"; K.circle(x + r * 0.45, y - r * 0.2, r * 0.85, "#000"); }
      else { K.circle(x - r * 0.15, y - r * 0.15, r * 0.82, "rgba(255,244,214,0.6)"); }
      ctx.restore();
    };
    K.stars = function (a, seed = 4, area = [-200, -500, 1280, 700]) {
      if (a <= 0.01) return;
      const r = rng(seed); ctx.save();
      for (let i = 0; i < 70; i++) { const x = lerp(area[0], area[2], r()), y = lerp(area[1], area[3], r()), s = 1 + r() * 2.2; ctx.globalAlpha = a * (0.4 + 0.6 * r()); K.circle(x, y, s, "#f2ecff"); }
      ctx.restore();
    };
    K.hills = function (tod) {
      const dark = tod === 1 ? 1 : 0;
      const c1 = mixc(P.hill1, "#3d3560", dark * 0.7), c2 = mixc(P.hill2, "#2e2850", dark * 0.7);
      ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(-1500, 1100);
      for (let x = -1500; x <= 2600; x += 40) ctx.lineTo(x, 1010 - 70 * Math.sin(x * 0.0042 + 0.6) - 40 * Math.sin(x * 0.011));
      ctx.lineTo(2600, 1400); ctx.lineTo(-1500, 1400); ctx.closePath(); ctx.fill();
      ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(-1500, 1150);
      for (let x = -1500; x <= 2600; x += 40) ctx.lineTo(x, 1085 - 45 * Math.sin(x * 0.0055 + 2.1) - 20 * Math.sin(x * 0.017));
      ctx.lineTo(2600, 1400); ctx.lineTo(-1500, 1400); ctx.closePath(); ctx.fill();
    };
    K.ground = function (tod, y = 1160) {
      const dark = tod === 1 ? 0.6 : 0;
      const g = ctx.createLinearGradient(0, y, 0, y + 800);
      g.addColorStop(0, mixc(P.grass, "#2f2748", dark)); g.addColorStop(0.18, mixc(P.ground, "#2a2240", dark)); g.addColorStop(1, mixc("#2b2036", "#151026", dark));
      ctx.fillStyle = g; ctx.fillRect(-2000, y, W + 4000, 2400);
      const r = rng(17); ctx.strokeStyle = mixc("#8a7396", "#4a4068", dark); ctx.lineWidth = 3; ctx.lineCap = "round";
      for (let i = 0; i < 60; i++) { const x = -400 + r() * 1900, yy = y + 6 + r() * 30; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x - 4, yy - 12 - r() * 8); ctx.moveTo(x + 5, yy); ctx.lineTo(x + 8, yy - 10 - r() * 6); ctx.stroke(); }
    };
    K.fence = function (x0, x1, y, tod) {
      const c = mixc("#6e5470", "#3a3150", tod === 1 ? 0.6 : 0), cd = mixc("#553f5a", "#2c2542", tod === 1 ? 0.6 : 0);
      ctx.fillStyle = cd; ctx.fillRect(x0, y - 70, x1 - x0, 12); ctx.fillRect(x0, y - 36, x1 - x0, 12);
      for (let x = x0; x <= x1; x += 90) { ctx.fillStyle = c; K.rr(x - 11, y - 100, 22, 104, 5); ctx.fill(); K.poly([[x - 11, y - 100], [x, y - 114], [x + 11, y - 100]], c); }
    };
    /* the hen house from outside: centre-bottom (cx, by), door 0..1 ajar, glow = window light */
    K.coopOut = function (cx, by, o = {}) {
      const tod = o.tod || 0, night = tod === 1 ? 0.55 : 0, glow = o.glow == null ? 1 : o.glow;
      const pl = mixc(P.plankL, "#3a2d4c", night), pd = mixc(P.plank, "#2c2240", night), roof = mixc("#3c2a44", "#231b33", night);
      const x0 = cx - 210, x1 = cx + 210, top = by - 350, bot = by - 80;
      ctx.fillStyle = mixc("#3a2a40", "#221a30", night);                              // stilts
      for (const sx of [x0 + 24, x0 + 150, x1 - 150, x1 - 24]) ctx.fillRect(sx - 9, bot - 10, 18, 90);
      ctx.fillStyle = "rgba(20,12,30,0.35)"; ctx.beginPath(); ctx.ellipse(cx, by + 4, 260, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pd; ctx.fillRect(x0, top, x1 - x0, bot - top);                    // body planks
      for (let x = x0; x < x1; x += 42) { ctx.fillStyle = (Math.floor((x - x0) / 42) % 2) ? pl : pd; ctx.fillRect(x, top, 42, bot - top); ctx.fillStyle = "rgba(20,12,28,0.35)"; ctx.fillRect(x, top, 2, bot - top); }
      ctx.fillStyle = "rgba(20,12,28,0.25)"; ctx.fillRect(x0, top, x1 - x0, 26);
      // round window with lamplight
      K.circle(x0 + 110, top + 120, 44, mixc("#2a1e33", "#1c1428", night));
      K.circle(x0 + 110, top + 120, 34, mixc("#f0b874", "#f6c98a", night)); K.glow(x0 + 110, top + 120, 120, [246, 190, 120], 0.35 * glow);
      ctx.fillStyle = "#2a1e33"; ctx.fillRect(x0 + 108, top + 86, 4, 68); ctx.fillRect(x0 + 76, top + 118, 68, 4);
      // door (arched), bolted / ajar
      const dx = cx + 70, dw = 110, dt = top + 130;
      ctx.fillStyle = "#1a1224"; K.rr(dx, dt, dw, bot - dt, 18); ctx.fill();
      const aj = o.door || 0;
      if (aj > 0.01) { ctx.save(); K.rr(dx, dt, dw, bot - dt, 18); ctx.clip(); ctx.fillStyle = "#f2b56d"; ctx.globalAlpha = 0.85 * glow; ctx.fillRect(dx, dt, dw * aj, bot - dt); ctx.restore(); }
      ctx.save(); ctx.translate(dx + dw, 0); ctx.scale(1 - 0.85 * aj, 1); ctx.translate(-(dx + dw), 0);
      ctx.fillStyle = mixc("#3e2b47", "#261d36", night); K.rr(dx, dt, dw, bot - dt, 18); ctx.fill();
      ctx.strokeStyle = "rgba(15,8,22,0.5)"; ctx.lineWidth = 3; for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(dx + k * dw / 3, dt + 8); ctx.lineTo(dx + k * dw / 3, bot); ctx.stroke(); }
      ctx.fillStyle = "#c9a24a"; K.circle(dx + 18, (dt + bot) / 2, 7, "#c9a24a");
      ctx.restore();
      // ramp
      ctx.fillStyle = mixc("#5b4262", "#33284a", night); ctx.beginPath(); ctx.moveTo(dx + 10, bot); ctx.lineTo(dx + dw - 6, bot); ctx.lineTo(dx + dw + 120, by); ctx.lineTo(dx + 70, by); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(20,12,28,0.4)"; ctx.lineWidth = 3; for (let k = 1; k < 5; k++) { const u = k / 5; ctx.beginPath(); ctx.moveTo(lerp(dx + 10, dx + 70, u), lerp(bot, by, u)); ctx.lineTo(lerp(dx + dw - 6, dx + dw + 120, u), lerp(bot, by, u)); ctx.stroke(); }
      // roof
      ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x0 - 40, top + 14); ctx.lineTo(cx, top - 150); ctx.lineTo(x1 + 40, top + 14); ctx.lineTo(x1 + 40, top + 34); ctx.lineTo(x0 - 40, top + 34); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(255,230,240,0.08)"; ctx.lineWidth = 4;
      for (let k = 1; k < 5; k++) { const u = k / 5; ctx.beginPath(); ctx.moveTo(lerp(x0 - 40, cx, u), lerp(top + 14, top - 150, u) + 6); ctx.lineTo(lerp(x1 + 40, cx, u), lerp(top + 14, top - 150, u) + 6); ctx.stroke(); }
      ctx.fillStyle = mixc("#d7a65a", "#8c6a44", night); K.rr(cx - 4, top - 205, 8, 60, 3); ctx.fill();   // vane
      K.poly([[cx - 2, top - 210], [cx + 40, top - 196], [cx + 2, top - 186]], mixc("#d7a65a", "#8c6a44", night));
      return { door: [dx + dw / 2, (dt + bot) / 2], window: [x0 + 110, top + 120], top, bot, x0, x1 };
    };

    // ------------------------------------------------------------ indoors
    K.coopIn = function (o = {}) {
      const lamp = o.lamp == null ? 1 : o.lamp;
      ctx.fillStyle = P.plumD; ctx.fillRect(-1500, -1500, W + 3000, 2750 + 1500);
      for (let x = -1500; x < W + 1500; x += 70) {
        const k = Math.floor((x + 1500) / 70);
        ctx.fillStyle = k % 3 === 0 ? "#3f2e48" : k % 3 === 1 ? "#372840" : "#43314d"; ctx.fillRect(x, -1500, 70, 2750);
        ctx.fillStyle = "rgba(14,8,22,0.45)"; ctx.fillRect(x, -1500, 3, 2750);
        const r = rng(k + 3); for (let j = 0; j < 4; j++) { const y = -300 + r() * 1500; ctx.fillStyle = "rgba(14,8,22,0.35)"; K.circle(x + 20 + r() * 30, y, 3.5, "rgba(14,8,22,0.4)"); }
      }
      ctx.fillStyle = "#2a1f33"; ctx.fillRect(-1500, 395, W + 3000, 44); ctx.fillStyle = "rgba(255,220,240,0.06)"; ctx.fillRect(-1500, 395, W + 3000, 6);
      // nest boxes on the left wall
      for (let i = 0; i < 3; i++) {
        const bx = 40 + i * 190, by = 760;
        ctx.fillStyle = "#2b2034"; ctx.fillRect(bx, by - 150, 176, 150);
        ctx.fillStyle = "#1d1526"; ctx.fillRect(bx + 12, by - 136, 152, 120);
        ctx.fillStyle = "#8c7158"; ctx.beginPath(); ctx.ellipse(bx + 88, by - 24, 70, 18, 0, Math.PI, 0); ctx.fill();
        const r = rng(50 + i); ctx.strokeStyle = "#a88b69"; ctx.lineWidth = 2.5; for (let j = 0; j < 14; j++) { const x = bx + 24 + r() * 128; ctx.beginPath(); ctx.moveTo(x, by - 22); ctx.lineTo(x + (r() - 0.5) * 30, by - 34 - r() * 12); ctx.stroke(); }
        ctx.fillStyle = "#4a3653"; ctx.fillRect(bx - 4, by - 6, 184, 16);
      }
      // floor
      const g = ctx.createLinearGradient(0, 1240, 0, 1700); g.addColorStop(0, "#6a5266"); g.addColorStop(0.35, "#4e3b52"); g.addColorStop(1, "#21182b");
      ctx.fillStyle = g; ctx.fillRect(-1500, 1240, W + 3000, 1400);
      ctx.fillStyle = "rgba(20,12,28,0.5)"; ctx.fillRect(-1500, 1236, W + 3000, 8);
      const r = rng(9); ctx.lineCap = "round";
      for (let j = 0; j < 160; j++) { const x = -300 + r() * 1700, y = 1250 + Math.pow(r(), 1.4) * 260; ctx.strokeStyle = `rgba(${170 + r() * 40 | 0},${140 + r() * 30 | 0},${100 + r() * 20 | 0},${0.25 + r() * 0.35})`; ctx.lineWidth = 2 + r() * 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 18 + r() * 26, y + (r() - 0.5) * 10); ctx.stroke(); }
      // lantern + light
      if (o.lantern !== false) {
        const lx = o.lx || 640, ly = 470;
        ctx.strokeStyle = "#1a1224"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx, 439); ctx.lineTo(lx, ly - 30); ctx.stroke();
        K.rr(lx - 22, ly - 32, 44, 60, 8); ctx.fillStyle = "#2a1d33"; ctx.fill();
        K.rr(lx - 15, ly - 24, 30, 44, 6); ctx.fillStyle = mixc("#5a4040", "#ffd593", lamp); ctx.fill();
        K.glow(lx, ly, 260, [255, 196, 120], 0.42 * lamp);
        K.cone(lx, ly + 20, 880, 60, 760, [255, 205, 140], 0.13 * lamp);
        K.glow(lx, 1250, 520, [255, 190, 120], 0.12 * lamp);
      }
      // motes
      const rm = rng(31); ctx.fillStyle = "rgba(255,226,180,0.5)";
      for (let i = 0; i < 26; i++) { const x = 300 + rm() * 700, y = 500 + ((rm() * 700 + (o.t || 0) * (10 + rm() * 14)) % 760); K.circle(x, y, 1.5 + rm() * 2, "rgba(255,226,180,0.45)"); }
    };
    /* the door seen from inside (right wall): ajar 0..1 shows the night gap; bolt 0..1 */
    K.doorIn = function (o = {}) {
      const x = 800, y = 700, w = 230, h = 545, aj = o.ajar || 0;
      ctx.fillStyle = "#170f20"; ctx.fillRect(x - 14, y - 14, w + 28, h + 14);
      const gap = aj * 150;
      if (gap > 0.5) {
        const g = ctx.createLinearGradient(x, 0, x + gap, 0); g.addColorStop(0, o.outside || "#3a3e74"); g.addColorStop(1, "#262850");
        ctx.fillStyle = g; ctx.fillRect(x, y, gap, h);
        K.stars(0.6, 77, [x, y, x + gap, y + h * 0.5]);
      }
      ctx.save(); ctx.translate(x + gap, 0);
      ctx.fillStyle = "#4a3653"; ctx.fillRect(0, y, w - gap * 0.4, h);
      ctx.strokeStyle = "rgba(14,8,22,0.55)"; ctx.lineWidth = 4;
      for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(k * (w - gap * 0.4) / 4, y); ctx.lineTo(k * (w - gap * 0.4) / 4, y + h); ctx.stroke(); }
      ctx.fillStyle = "#33253c"; ctx.fillRect(0, y + 80, w - gap * 0.4, 30); ctx.fillRect(0, y + h - 120, w - gap * 0.4, 30);
      ctx.restore();
      const bolt = o.bolt == null ? 0 : o.bolt;      // a bar dropped across the door
      if (bolt > 0.01) { ctx.save(); ctx.translate(x + w / 2, y + 300 - (1 - bolt) * 260); ctx.rotate((1 - bolt) * -0.5); ctx.fillStyle = "#6e4f3b"; K.rr(-140, -16, 280, 32, 6); ctx.fill(); ctx.fillStyle = "rgba(255,230,200,0.12)"; ctx.fillRect(-138, -14, 276, 6); ctx.restore(); }
      return { gapX: x, gapW: gap, y, h };
    };

    // ------------------------------------------------------------ characters
    const HEN_COLS = [["#f3e7d6", "#d9c7b1", "#e4d4bf"], ["#d6ad80", "#b48b62", "#c79c70"], ["#c8bfd2", "#a99fb5", "#b8aec3"], ["#fbf6ee", "#e2d8cb", "#efe6da"]];
    /* hen: feet at (x,y), s scale, dir 1 right / -1 left; o: {col 0..3, bob, look, eye: 'n'|'wide'|'happy'|'worried'|'closed', talk 0..1, flap 0..1, peck 0..1} */
    K.hen = function (x, y, s, o = {}) {
      const [cb, cs, cw] = HEN_COLS[(o.col || 0) % 4];
      ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.dir || 1), s);
      const bob = o.bob || 0, flap = o.flap || 0;
      ctx.strokeStyle = "#e2953a"; ctx.lineWidth = 5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-10, -30); ctx.lineTo(-12, 0); ctx.lineTo(-22, 2); ctx.moveTo(-12, 0); ctx.lineTo(-2, 2); ctx.moveTo(12, -30); ctx.lineTo(13, 0); ctx.lineTo(3, 2); ctx.moveTo(13, 0); ctx.lineTo(23, 2); ctx.stroke();
      ctx.translate(0, bob);
      K.ell(0, -2, 34, 6, 0, "rgba(20,10,30,0.25)");
      // tail
      ctx.fillStyle = cs; ctx.beginPath(); ctx.moveTo(-36, -70); ctx.quadraticCurveTo(-78, -120, -66, -132); ctx.quadraticCurveTo(-52, -112, -44, -110); ctx.quadraticCurveTo(-52, -136, -38, -140); ctx.quadraticCurveTo(-30, -112, -18, -96); ctx.closePath(); ctx.fill();
      // body
      ctx.fillStyle = cb; ctx.beginPath(); ctx.ellipse(0, -66, 50, 42, -0.12, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, -66, 50, 42, -0.12, 0, Math.PI * 2); ctx.clip(); K.ell(-6, -32, 56, 24, 0, cs); ctx.globalAlpha = 0.5; K.ell(10, -88, 30, 14, -0.3, "#fffaf2"); ctx.restore();
      // speckles for the tan hen
      if ((o.col || 0) % 4 === 1) { const r = rng(4); for (let i = 0; i < 9; i++) K.circle(-30 + r() * 50, -90 + r() * 44, 3, "rgba(120,80,50,0.45)"); }
      // wing
      ctx.save(); ctx.translate(-6, -70); ctx.rotate(-0.25 - flap * 0.9); K.ell(-4, 4, 30, 19, 0, cw); ctx.strokeStyle = "rgba(90,60,70,0.25)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-4, 4, 18, 0.3, 2.4); ctx.stroke(); ctx.restore();
      if (flap > 0.05) { ctx.save(); ctx.translate(6, -70); ctx.rotate(0.6 + flap * 0.9); K.ell(6, 0, 26, 15, 0, cs); ctx.restore(); }
      // head
      const peck = o.peck || 0, look = o.look || 0;
      ctx.save(); ctx.translate(30 + peck * 10, -112 + peck * 30); ctx.rotate(peck * 0.6 + look * 0.15);
      K.ell(-6, 16, 18, 22, 0.2, cb);
      K.circle(0, 0, 25, cb);
      K.circle(-8, -24, 8.5, "#cf566a"); K.circle(3, -27, 10, "#d65c70"); K.circle(14, -23, 8, "#cf566a");
      const tk = o.talk || 0;
      K.poly([[21, -6], [40, 0], [21, 5]], "#eaa338");
      K.poly([[21, 5], [36, 4 + tk * 9], [21, 9 + tk * 2]], "#d38a2a");
      ctx.fillStyle = "#cf566a"; ctx.beginPath(); ctx.ellipse(19, 15, 5, 8, 0, 0, Math.PI * 2); ctx.fill();
      K.circle(8, 8, 6, "rgba(232,140,150,0.45)");
      const e = o.eye || "n";
      if (e === "happy") { ctx.strokeStyle = P.ink; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(9, -3, 6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
      else if (e === "closed") { ctx.strokeStyle = P.ink; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(9, -5, 6, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
      else {
        const wide = e === "wide" ? 1 : 0;
        if (wide) K.circle(9, -4, 10, "#fffaf3");
        K.circle(9 + look * 2, -4, wide ? 5 : 6, P.ink); K.circle(10.5 + look * 2, -6, 2, "#fff");
        if (e === "worried") { ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(1, -16); ctx.lineTo(15, -13); ctx.stroke(); }
      }
      ctx.restore();
      ctx.restore();
    };
    /* fox: feet centre (x,y), s, dir; o: {walk phase (rad) or null, sit, look, eye: 'sly'|'open', tail sway} */
    K.fox = function (x, y, s, o = {}) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.dir || 1), s);
      const orange = o.dark ? "#3a2340" : "#cf7445", shade = o.dark ? "#2c1a32" : "#a85532", cream = o.dark ? "#3a2340" : "#f2dcc0", sock = "#3d2236";
      const ph = o.walk == null ? null : o.walk;
      const bob = ph == null ? 0 : Math.abs(Math.sin(ph)) * -5;
      K.ell(0, -2, 120, 10, 0, "rgba(20,10,30,0.28)");
      const leg = (lx, a, front) => { ctx.save(); ctx.translate(lx, -70 + bob); ctx.rotate(a); ctx.fillStyle = front ? orange : shade; K.rr(-10, 0, 20, 72, 9); ctx.fill(); ctx.fillStyle = sock; K.rr(-10, 46, 20, 26, 9); ctx.fill(); ctx.restore(); };
      const sw = (k) => (ph == null ? 0 : Math.sin(ph + k) * 0.38);
      leg(-62, sw(Math.PI), false); leg(52, sw(0), false);
      // tail
      const ts = (o.tail || 0) + (ph == null ? 0 : Math.sin(ph * 0.5) * 0.08);
      ctx.save(); ctx.translate(-92, -106 + bob); ctx.rotate(-0.25 + ts);
      ctx.fillStyle = orange; ctx.beginPath(); ctx.moveTo(0, -12); ctx.quadraticCurveTo(-70, -60, -128, -22); ctx.quadraticCurveTo(-140, 10, -110, 22); ctx.quadraticCurveTo(-60, 30, 0, 14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = cream; ctx.beginPath(); ctx.moveTo(-104, -30); ctx.quadraticCurveTo(-146, -18, -128, 14); ctx.quadraticCurveTo(-112, 24, -96, 18); ctx.quadraticCurveTo(-118, -2, -104, -30); ctx.closePath(); ctx.fill();
      ctx.restore();
      // body
      ctx.save(); ctx.translate(0, bob);
      K.ell(0, -100, 104, 46, 0, orange);
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, -100, 104, 46, 0, 0, Math.PI * 2); ctx.clip(); K.ell(12, -62, 80, 24, 0, cream); K.ell(-10, -140, 90, 18, 0, "rgba(255,220,190,0.15)"); ctx.restore();
      ctx.restore();
      leg(-40, sw(0), true); leg(72, sw(Math.PI), true);
      // head
      ctx.save(); ctx.translate(98, -138 + bob); ctx.rotate(o.look || 0);
      K.ell(-8, 18, 34, 30, -0.4, orange);
      K.poly([[-10, -26], [-22, -78], [10, -34]], orange); K.poly([[16, -30], [24, -80], [40, -26]], orange);
      K.poly([[-10, -34], [-17, -66], [2, -38]], "#f2c3a8"); K.poly([[20, -36], [25, -68], [33, -32]], "#f2c3a8");
      K.poly([[-22, -78], [-18, -62], [-14, -70]], sock); K.poly([[24, -80], [22, -64], [30, -70]], sock);
      K.circle(10, -6, 36, orange);
      ctx.fillStyle = orange; ctx.beginPath(); ctx.moveTo(20, -22); ctx.quadraticCurveTo(78, -6, 82, 4); ctx.quadraticCurveTo(70, 22, 18, 26); ctx.closePath(); ctx.fill();
      ctx.fillStyle = cream; ctx.beginPath(); ctx.moveTo(14, 6); ctx.quadraticCurveTo(60, 4, 80, 6); ctx.quadraticCurveTo(68, 24, 16, 28); ctx.quadraticCurveTo(0, 22, 14, 6); ctx.closePath(); ctx.fill();
      K.ell(-2, 22, 26, 14, 0.3, cream);
      K.circle(82, 2, 8, sock);
      if (o.eye === "glow") { K.ell(26, -14, 10, 5, -0.15, "#f6d36a"); K.glow(26, -14, 40, [255, 220, 120], 0.5); }
      else {
        K.ell(26, -14, 10, 7, -0.1, "#f6d36a"); K.ell(27, -14, 2.8, 6, 0, sock);
        if (o.eye !== "open") { ctx.fillStyle = orange; ctx.beginPath(); ctx.ellipse(26, -20, 13, 8, -0.15, Math.PI, 0); ctx.fill(); ctx.strokeStyle = sock; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(14, -17); ctx.lineTo(39, -19); ctx.stroke(); }
        ctx.strokeStyle = sock; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(48, 14); ctx.quadraticCurveTo(60, 20, 72, 12); ctx.stroke();
      }
      ctx.restore();
      ctx.restore();
    };
    /* just a paw (for the door gap): tip at (x,y), pointing dir (rad) */
    K.paw = function (x, y, s, ang) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
      ctx.fillStyle = "#cf7445"; K.rr(-130, -18, 120, 36, 18); ctx.fill();
      ctx.fillStyle = "#3d2236"; K.rr(-34, -20, 40, 40, 18); ctx.fill();
      K.circle(2, -11, 6, "#5a3448"); K.circle(4, 0, 6, "#5a3448"); K.circle(2, 11, 6, "#5a3448");
      ctx.restore();
    };
    /* owl narrator: feet at (x,y); o: {wing 0..1 (right wing raised), blink, look, worried, scarf} */
    K.owl = function (x, y, s, o = {}) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      K.ell(0, -2, 40, 7, 0, "rgba(20,10,30,0.28)");
      ctx.strokeStyle = "#e2953a"; ctx.lineWidth = 5; ctx.lineCap = "round";
      for (const fx of [-14, 14]) { ctx.beginPath(); ctx.moveTo(fx, -10); ctx.lineTo(fx - 6, 0); ctx.moveTo(fx, -10); ctx.lineTo(fx, 1); ctx.moveTo(fx, -10); ctx.lineTo(fx + 6, 0); ctx.stroke(); }
      const bob = o.bob || 0; ctx.translate(0, bob);
      K.ell(0, -62, 46, 56, 0, "#7b6893");
      K.ell(0, -48, 32, 36, 0, "#9c8ab1");
      ctx.strokeStyle = "rgba(90,70,110,0.5)"; ctx.lineWidth = 2.5;
      for (let r = 0; r < 3; r++) for (let c = -1; c <= 1; c++) { ctx.beginPath(); ctx.arc(c * 14 + (r % 2) * 7, -64 + r * 14, 6, 0.2, Math.PI - 0.2); ctx.stroke(); }
      // wings
      ctx.save(); ctx.translate(-40, -70); ctx.rotate(0.25); K.ell(0, 14, 13, 32, 0, "#66557d"); ctx.restore();
      const wg = o.wing || 0;
      ctx.save(); ctx.translate(40, -78); ctx.rotate(-0.25 - wg * 1.9); K.ell(0, 14, 13, 32, 0, "#66557d"); ctx.restore();
      // scarf
      ctx.fillStyle = "#e2a93b"; ctx.beginPath(); ctx.ellipse(0, -86, 40, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(18, -82); ctx.rotate(0.25 + Math.sin((o.t || 0) * 2) * 0.05); ctx.fillStyle = "#e2a93b"; K.rr(-9, 0, 18, 40, 5); ctx.fill(); ctx.fillStyle = "#b9802a"; ctx.fillRect(-9, 12, 18, 5); ctx.fillRect(-9, 24, 18, 5); ctx.restore();
      ctx.fillStyle = "#b9802a"; ctx.fillRect(-36, -88, 72, 4);
      // head
      K.ell(0, -118, 44, 36, 0, "#7b6893");
      K.poly([[-38, -134], [-46, -168], [-20, -146]], "#7b6893"); K.poly([[38, -134], [46, -168], [20, -146]], "#7b6893");
      K.circle(-16, -120, 22, "#efe2d0"); K.circle(16, -120, 22, "#efe2d0");
      const bl = o.blink || 0, lk = o.look || 0;
      if (bl > 0.5) { ctx.strokeStyle = P.ink; ctx.lineWidth = 4; for (const ex of [-16, 16]) { ctx.beginPath(); ctx.arc(ex, -122, 8, 0.2, Math.PI - 0.2); ctx.stroke(); } }
      else { for (const ex of [-16, 16]) { K.circle(ex + lk * 3, -120, 10, P.ink); K.circle(ex + 3 + lk * 3, -124, 3.5, "#fff"); } }
      if (o.worried) { ctx.strokeStyle = "#4b3a5e"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-30, -146); ctx.lineTo(-8, -140); ctx.moveTo(30, -146); ctx.lineTo(8, -140); ctx.stroke(); }
      K.poly([[-6, -108], [6, -108], [0, -94]], "#eaa338");
      K.circle(-28, -104, 6, "rgba(230,140,170,0.35)"); K.circle(28, -104, 6, "rgba(230,140,170,0.35)");
      ctx.restore();
    };

    // ------------------------------------------------------------ overlays
    /* label card at the top: lines (CAPS), a alpha, pop 0..1 (scale in), rot, y centre */
    K.label = function ({ lines, a = 1, pop = 1, y = 300, rot = -0.018, px = 42, x = 540, dark = false }) {
      if (a <= 0.01) return;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(rot); const sc = lerp(0.82, 1, back(pop, 2)); ctx.scale(sc, sc);
      ctx.font = K.font(900, px); if ("letterSpacing" in ctx) ctx.letterSpacing = (px * 0.07) + "px";
      const ws = lines.map((s) => ctx.measureText(s).width), w = Math.max(...ws) + 70, lh = px * 1.28, h = lines.length * lh + 36;
      ctx.shadowColor = "rgba(12,6,22,0.45)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
      ctx.fillStyle = dark ? "#3b2640" : P.cream; K.rr(-w / 2, -h / 2, w, h, 12); ctx.fill();
      ctx.shadowColor = "transparent";
      if (!dark) { ctx.fillStyle = "rgba(255,255,255,0.35)"; K.rr(-w / 2, -h / 2, w, 6, 3); ctx.fill(); }
      ctx.fillStyle = dark ? "#d9c7e6" : P.ink; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      lines.forEach((s, i) => ctx.fillText(s, 0, -((lines.length - 1) * lh) / 2 + i * lh + 2));
      if (!dark) { ctx.fillStyle = P.mustard; K.rr(-w / 2 + 22, h / 2 - 13, 64, 7, 3.5); ctx.fill(); }
      ctx.restore();
    };
    /* stamp (yellow outline, tilted) */
    K.stamp = function ({ text, x, y, a = 1, pop = 1, rot = -0.12, px = 40 }) {
      if (a <= 0.01) return;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(rot); const sc = lerp(1.6, 1, eout(pop)); ctx.scale(sc, sc);
      ctx.font = K.font(900, px); if ("letterSpacing" in ctx) ctx.letterSpacing = (px * 0.1) + "px";
      const w = ctx.measureText(text).width + 50, h = px * 1.5;
      ctx.strokeStyle = P.mustard; ctx.lineWidth = 6; K.rr(-w / 2, -h / 2, w, h, 12); ctx.stroke();
      ctx.fillStyle = P.mustard; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, 0, 3);
      ctx.restore();
    };
    K.dayPill = function ({ day, x, y, a = 1, pop = 1 }) {
      if (a <= 0.01) return;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); const sc = lerp(1.25, 1, eout(pop)); ctx.scale(sc, sc);
      ctx.font = K.font(900, 34); if ("letterSpacing" in ctx) ctx.letterSpacing = "3px";
      const s = "DAY " + day, w = ctx.measureText(s).width + 50;
      ctx.shadowColor = "rgba(10,6,22,0.5)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;
      ctx.fillStyle = "#22355f"; K.rr(0, -27, w, 54, 27); ctx.fill(); ctx.shadowColor = "transparent";
      ctx.fillStyle = "#d6ddf3"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(s, 25, 2);
      ctx.restore();
    };
    /* tally marks: n marks in groups of five, wrapping at perRow groups; last one drawn with progress u */
    K.tally = function ({ n, x, y, a = 1, perRow = 8, h = 58, gap = 15, groupGap = 28, rowGap = 78, lastU = 1 }) {
      if (a <= 0.01 || n <= 0) return;
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = "#ebe1d2"; ctx.lineWidth = 6; ctx.lineCap = "round";
      const gw = 4 * gap + groupGap;
      for (let i = 0; i < n; i++) {
        const g = Math.floor(i / 5), k = i % 5, row = Math.floor(g / perRow), col = g % perRow;
        const gx = x + col * gw, gy = y + row * rowGap;
        const u = i === n - 1 ? lastU : 1;
        ctx.beginPath();
        if (k < 4) { const xx = gx + k * gap + ((i * 7) % 3 - 1); ctx.moveTo(xx, gy); ctx.lineTo(xx + 1, gy + h * u); }
        else { ctx.moveTo(gx - 8, gy + h * 0.72); ctx.lineTo(gx - 8 + (3 * gap + 16) * u, gy + h * 0.72 - 34 * u); }
        ctx.stroke();
      }
      ctx.restore();
    };
    /* the hanging sign: centre (x,y) of the board, lines, a, swing (rad), cross 0..1 (scribble draw-on) */
    K.sign = function ({ lines, x, y, a = 1, swing = 0, cross = 0, w = 300, h = 150, px = 44 }) {
      if (a <= 0.01) return;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y - h / 2 - 60); ctx.rotate(swing);
      ctx.strokeStyle = "#c9a477"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-w * 0.38, 60); ctx.lineTo(0, 0); ctx.lineTo(w * 0.38, 60); ctx.stroke();
      K.circle(0, 0, 6, "#2a1d33");
      ctx.translate(0, 60 + h / 2);
      ctx.shadowColor = "rgba(10,6,22,0.5)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
      ctx.fillStyle = "#86644f"; K.rr(-w / 2, -h / 2, w, h, 12); ctx.fill(); ctx.shadowColor = "transparent";
      ctx.strokeStyle = "rgba(40,20,20,0.4)"; ctx.lineWidth = 4; K.rr(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 9); ctx.stroke();
      ctx.font = K.font(900, px); ctx.fillStyle = "#f1e2c9"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; if ("letterSpacing" in ctx) ctx.letterSpacing = "2px";
      lines.forEach((s, i) => ctx.fillText(s, 0, -((lines.length - 1) * px * 1.1) / 2 + i * px * 1.1 + 3));
      if (cross > 0.001) {                     // red zig-zag scribble across the board, drawn on
        const pts = []; const N = 9;
        for (let i = 0; i <= N; i++) pts.push([-w * 0.46 + (i / N) * w * 0.92, (i % 2 ? -1 : 1) * h * 0.2 + (i === 0 ? 10 : 0)]);
        const L = cross * N;
        ctx.strokeStyle = P.pink; ctx.lineWidth = 9; ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i <= Math.ceil(L) && i <= N; i++) { const u = Math.min(1, L - (i - 1)); ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)); }
        ctx.stroke();
      }
      ctx.restore();
    };
    /* speech bubble: text lines, anchor = tail tip (tx,ty), box centred above at (x,y) */
    K.bubble = function ({ lines, x, y, tx, ty, a = 1, pop = 1, px = 38, small = false, quote = true }) {
      if (a <= 0.01) return;
      ctx.save(); ctx.globalAlpha = a;
      const sc = lerp(0.6, 1, back(pop, 2.2)); ctx.translate(tx, ty); ctx.scale(sc, sc); ctx.translate(-tx, -ty);
      ctx.font = K.font(900, px); if ("letterSpacing" in ctx) ctx.letterSpacing = (small ? 1 : 2) + "px";
      const ls = quote ? lines.map((s, i) => (i === 0 ? "“" : "") + s + (i === lines.length - 1 ? "”" : "")) : lines;
      const w = Math.max(...ls.map((s) => ctx.measureText(s).width)) + (small ? 40 : 60), lh = px * 1.22, h = ls.length * lh + (small ? 20 : 34);
      ctx.shadowColor = "rgba(10,6,22,0.45)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
      ctx.fillStyle = small ? "#e9def0" : "#f7f0e6";
      K.rr(x - w / 2, y - h / 2, w, h, small ? 20 : 26); ctx.fill();
      const bx = clamp(tx, x - w / 2 + 30, x + w / 2 - 30), by = ty < y ? y - h / 2 : y + h / 2;
      ctx.beginPath(); ctx.moveTo(bx - 16, by); ctx.lineTo(tx, ty); ctx.lineTo(bx + 16, by); ctx.closePath(); ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.fillStyle = small ? "#3a2b4a" : P.ink; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ls.forEach((s, i) => ctx.fillText(s, x, y - ((ls.length - 1) * lh) / 2 + i * lh + 2));
      ctx.restore();
    };
    /* banner held up (the irony beat) */
    K.banner = function ({ text, x, y, w = 420, a = 1, pop = 1 }) {
      if (a <= 0.01) return;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y + (1 - eout(pop)) * 40);
      ctx.fillStyle = "#6e4f3b"; ctx.fillRect(-w / 2 - 6, -10, 10, 120); ctx.fillRect(w / 2 - 4, -10, 10, 120);
      ctx.shadowColor = "rgba(10,6,22,0.4)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;
      ctx.fillStyle = "#e8b74a"; K.rr(-w / 2, -40, w, 70, 8); ctx.fill(); ctx.shadowColor = "transparent";
      ctx.font = K.font(900, 34); if ("letterSpacing" in ctx) ctx.letterSpacing = "2px"; ctx.fillStyle = "#3b2414"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, 0, -3);
      ctx.restore();
    };
    /* photo card frame around an offscreen image (the fable shrinks into a picture) */
    K.photo = function ({ img, x, y, s, rot = -0.03, a = 1, tag = "A FABLE", tagA = 1, border = 1 }) {
      if (a <= 0.01) return;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
      const bw = 26 * border;
      ctx.shadowColor = "rgba(8,6,20,0.55)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
      ctx.fillStyle = "#f4ecdf"; ctx.fillRect(-W / 2 - bw, -H / 2 - bw, W + 2 * bw, H + 2 * bw);
      ctx.shadowColor = "transparent";
      ctx.drawImage(img, -W / 2, -H / 2, W, H);
      if (tagA > 0.01) {
        ctx.save(); ctx.globalAlpha *= tagA; ctx.translate(-W / 2 + 120, -H / 2 - 10); ctx.rotate(-0.08);
        ctx.font = K.font(900, 54); if ("letterSpacing" in ctx) ctx.letterSpacing = "4px";
        const w = ctx.measureText(tag).width + 70;
        ctx.fillStyle = "#e5b23e"; K.rr(-w / 2, -42, w, 84, 42); ctx.fill();
        ctx.fillStyle = "#3b2414"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(tag, 0, 4);
        ctx.restore();
      }
      ctx.restore();
    };

    // ------------------------------------------------------------ the lesson stage
    K.navy = function () {
      const g = ctx.createRadialGradient(W / 2, H * 0.42, 60, W / 2, H * 0.45, H * 0.75);
      g.addColorStop(0, P.navy0); g.addColorStop(1, P.navy1);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    };
    /* house icon, base centre (x,y), size s; sign 0..1 = tiny sign in the window; board 0..1 = big lawn billboard */
    const HC = ["#efe3d3", "#e3d4ea", "#f1d9a8", "#d9cbe0", "#efe6d8"];
    K.house = function (x, y, s, o = {}) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= o.a == null ? 1 : o.a;
      const c = HC[(o.c || 0) % HC.length];
      K.ell(0, 0, 58, 6, 0, "rgba(10,10,30,0.3)");
      ctx.fillStyle = c; K.rr(-44, -70, 88, 70, 6); ctx.fill();
      K.poly([[-54, -66], [0, -112], [54, -66]], o.roof || "#8a5f7a");
      ctx.fillStyle = "#3a2d4c"; K.rr(-12, -38, 24, 38, 4); ctx.fill();
      ctx.fillStyle = "#56709e"; ctx.fillRect(-36, -58, 18, 16); ctx.fillRect(18, -58, 18, 16);
      if (o.sign > 0.01) { const k = back(o.sign, 2.4); ctx.fillStyle = P.yellow; ctx.fillRect(17, -60 + (1 - k) * 6, 22 * k, 20 * k); ctx.fillStyle = "#3b2414"; ctx.fillRect(20, -54, 16 * k, 3 * k); ctx.fillRect(20, -48, 12 * k, 3 * k); }
      if (o.board > 0.01) {
        const k = back(o.board, 2.0);
        ctx.save(); ctx.translate(30, 0); ctx.scale(k, k);
        ctx.fillStyle = "#5c4433"; ctx.fillRect(-26, -64, 6, 64); ctx.fillRect(24, -64, 6, 64);
        ctx.fillStyle = "#f2e2b8"; K.rr(-44, -112, 92, 56, 5); ctx.fill(); ctx.strokeStyle = "#c9a35a"; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = "#b8483e"; ctx.fillRect(-34, -100, 72, 9); ctx.fillRect(-34, -84, 54, 9);
        ctx.restore();
      }
      ctx.restore();
    };
    /* big billboard (readable), base centre */
    K.billboard = function (x, y, s, a = 1) {
      if (a <= 0.01) return;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s);
      ctx.fillStyle = "#5c4433"; ctx.fillRect(-150, -170, 16, 170); ctx.fillRect(134, -170, 16, 170);
      ctx.shadowColor = "rgba(10,6,22,0.45)"; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
      ctx.fillStyle = "#f2e2b8"; K.rr(-210, -370, 420, 220, 10); ctx.fill(); ctx.shadowColor = "transparent";
      ctx.strokeStyle = "#c9a35a"; ctx.lineWidth = 6; K.rr(-200, -360, 400, 200, 8); ctx.stroke();
      ctx.save(); ctx.translate(-4, -296); ctx.rotate(-0.04); ctx.font = K.font(900, 66); ctx.fillStyle = "#b8483e"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; if ("letterSpacing" in ctx) ctx.letterSpacing = "3px"; ctx.fillText("DRIVE", 0, 0); ctx.rotate(0.06); ctx.fillText("CAREFULLY", 6, 72); ctx.restore();
      ctx.restore();
    };
    /* peg person (lesson section), feet at (x,y) */
    K.peg = function (x, y, s, o = {}) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= o.a == null ? 1 : o.a;
      const c = o.col || "#e9dff0";
      K.ell(0, 0, 30, 5, 0, "rgba(10,10,30,0.3)");
      ctx.fillStyle = c; K.rr(-26, -78, 52, 78, 22); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.25)"; K.rr(-20, -72, 16, 50, 8); ctx.fill();
      K.circle(0, -102, 28, c);
      K.circle(-9, -104, 4, P.ink); K.circle(9, -104, 4, P.ink);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.beginPath(); if (o.smile) ctx.arc(0, -96, 8, 0.3, Math.PI - 0.3); else { ctx.moveTo(-6, -90); ctx.lineTo(6, -90); } ctx.stroke();
      if (o.badge > 0.01) { const k = back(o.badge, 2.4); ctx.save(); ctx.translate(0, -44); ctx.scale(k, k); K.circle(0, 0, 18, P.yellow); ctx.font = K.font(900, 15); ctx.fillStyle = "#3b2414"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("YES", 0, 1); ctx.restore(); }
      ctx.restore();
    };
    K.tag = function ({ text, x, y, a = 1, pop = 1, col = P.mustard, tc = "#3b2414", px = 30 }) {
      if (a <= 0.01) return;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); const sc = lerp(0.6, 1, back(pop, 2.2)); ctx.scale(sc, sc);
      ctx.font = K.font(900, px); if ("letterSpacing" in ctx) ctx.letterSpacing = "2px";
      const w = ctx.measureText(text).width + 40;
      ctx.shadowColor = "rgba(10,6,22,0.4)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
      ctx.fillStyle = col; K.rr(-w / 2, -px * 0.8, w, px * 1.6, px * 0.8); ctx.fill(); ctx.shadowColor = "transparent";
      ctx.fillStyle = tc; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, 0, 2);
      ctx.restore();
    };

    // ------------------------------------------------------------ karaoke captions
    /* chunks: [{t0, t1, lines:[[ [word, start, end], ... ], ...]}]; current word yellow, said words cream, upcoming grey */
    K.captions = function (chunks, t, y = 1432, px = 64) {
      const c = chunks.find((k) => t >= k.t0 && t < k.t1);
      if (!c) return;
      const a = Math.min(c.t0 <= 0 ? 1 : (t - c.t0) / 0.08, 1, (c.t1 - t) / 0.08);
      ctx.save(); ctx.globalAlpha = clamp(a, 0, 1);
      ctx.font = K.font(900, px); ctx.textBaseline = "middle"; ctx.textAlign = "left";
      if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
      const lh = px * 1.14, sp = ctx.measureText(" ").width;
      c.lines.forEach((line, li) => {
        const ws = line.map((w) => ctx.measureText(w[0]).width);
        const tot = ws.reduce((s, v) => s + v, 0) + sp * (line.length - 1);
        let x = W / 2 - tot / 2; const yy = y - ((c.lines.length - 1) * lh) / 2 + li * lh;
        line.forEach((w, i) => {
          const st = t < w[1] ? 0 : t < Math.max(w[2], w[1] + 0.12) ? 1 : 2;
          ctx.lineJoin = "round"; ctx.lineWidth = 10; ctx.strokeStyle = "rgba(34,22,44,0.92)";
          ctx.shadowColor = "rgba(8,4,16,0.5)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
          ctx.strokeText(w[0], x, yy); ctx.shadowColor = "transparent";
          ctx.fillStyle = st === 1 ? P.yellow : st === 2 ? "#fbf3e6" : "#a89cb2";
          ctx.fillText(w[0], x, yy);
          x += ws[i] + sp;
        });
      });
      ctx.restore();
    };
    return K;
  };
  window.FB = FB;
})();

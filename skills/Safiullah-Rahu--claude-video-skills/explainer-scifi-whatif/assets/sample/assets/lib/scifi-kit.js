/* scifi-kit.js — flat-vector 16:9 sci-fi what-if kit (canvas 2D, 1920x1080). window.SCIFI.kit(ctx) -> G
   Night-navy grounds, soft glows, a HUD box, a hover robot with a screen face (OTTO), round-headed people, ships,
   planets, cards, typed text and rolling counters. Everything is a pure function of the arguments (seek-safe). */
(function () {
  const P = {
    bg0: "#04070f", bg1: "#0a1220", bg2: "#151b29", bg3: "#1d2638", panel: "rgba(8,12,22,0.86)", line: "#323c4f",
    cyan: "#62e8f4", cyanD: "#2a8f9a", yellow: "#f5c84a", red: "#ff5a6a", green: "#5fe0a0", white: "#e9edf2", grey: "#8f98a6",
    orange: "#ff9a3c", suit: "#e8743b", suitD: "#b9552a", mia: "#f2c94c", miaD: "#c99a2c", skin: "#e7b68e", skinD: "#c98f68", hair: "#4a2f24",
    robot: "#eef2f6", robotD: "#c4ccd6", screen: "#0d1420", paper: "#efe6d2",
  };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const sm = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const eo = (u) => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
  const eio = (u) => { u = clamp(u, 0, 1); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
  const back = (u) => { u = clamp(u, 0, 1); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
  function mulberry(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function kit(ctx) {
    const W = 1920, H = 1080;
    const F = { sans: "Poppins", mono: "JetBrains Mono", hand: "Caveat" };
    function font(size, weight, fam) { ctx.font = `${weight || 600} ${size}px "${fam || F.sans}"`; }
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
    function text(s, x, y, o) {
      o = o || {};
      font(o.size || 24, o.weight || 600, o.fam);
      ctx.letterSpacing = (o.ls || 0) + "px";
      ctx.textAlign = o.align || "left"; ctx.textBaseline = o.base || "alphabetic";
      ctx.fillStyle = o.color || P.white;
      if (o.glow) { ctx.shadowColor = o.glowC || o.color || P.white; ctx.shadowBlur = o.glow; }
      const ga = ctx.globalAlpha;
      ctx.globalAlpha = ga * clamp(o.a == null ? 1 : o.a, 0, 1);
      ctx.fillText(s, x, y);
      ctx.globalAlpha = ga;
      ctx.shadowBlur = 0; ctx.letterSpacing = "0px";
    }
    function measure(s, o) { font(o.size || 24, o.weight || 600, o.fam); ctx.letterSpacing = (o.ls || 0) + "px"; const w = ctx.measureText(s).width; ctx.letterSpacing = "0px"; return w; }
    function typed(s, t, t0, cps) { const n = Math.floor(clamp((t - t0) * (cps || 30), 0, s.length)); return s.slice(0, n); }
    function alpha(a, fn) { const g = ctx.globalAlpha; ctx.globalAlpha = g * clamp(a, 0, 1); fn(); ctx.globalAlpha = g; }
    function save(fn) { ctx.save(); fn(); ctx.restore(); }
    function pop(t, t0, d) { const u = clamp((t - t0) / (d || 0.35), 0, 1); return { a: sm(u * 1.6), s: 0.85 + 0.15 * back(u) }; }

    // ---------- grounds ----------
    function ground(top, bottom, glow) {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top || P.bg1); g.addColorStop(1, bottom || P.bg0);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      if (glow) { const r = ctx.createRadialGradient(glow[0], glow[1], 0, glow[0], glow[1], glow[2]); r.addColorStop(0, glow[3]); r.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = r; ctx.fillRect(0, 0, W, H); }
    }
    const starCache = {};
    function stars(t, o) {
      o = o || {}; const n = o.n || 260, seed = o.seed || 7, spd = o.speed || 0, cx = o.cx == null ? W / 2 : o.cx, cy = o.cy == null ? H / 2 : o.cy;
      const key = seed + ":" + n; if (!starCache[key]) { const r = mulberry(seed); starCache[key] = Array.from({ length: n }, () => [r(), r(), r(), r()]); }
      const S = starCache[key];
      const x0 = o.x || 0, y0 = o.y || 0, w = o.w || W, h = o.h || H;
      ctx.save(); if (o.clip) { o.clip(); ctx.clip(); }
      for (const [a, b, c, d] of S) {
        let x = x0 + a * w, y = y0 + b * h;
        const tw = 0.55 + 0.45 * Math.sin(t * (1 + d * 3) + c * 20);
        const sz = 0.6 + c * 1.8;
        if (spd > 0) { // streaks radiating from (cx, cy)
          const dx = x - cx, dy = y - cy; const L = Math.hypot(dx, dy) + 1;
          const k = ((d + t * spd * 0.25) % 1); const px = cx + dx * (0.2 + k * 1.4), py = cy + dy * (0.2 + k * 1.4);
          const len = spd * 40 * k * (0.5 + c);
          ctx.strokeStyle = `rgba(220,240,255,${0.25 + 0.6 * k})`; ctx.lineWidth = sz;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + dx / L * len, py + dy / L * len); ctx.stroke();
        } else {
          if (o.drift) x = x0 + ((a * w + t * o.drift * (0.3 + c)) % w);
          ctx.fillStyle = `rgba(230,240,255,${(0.35 + 0.65 * c) * tw * (o.a == null ? 1 : o.a)})`;
          ctx.fillRect(x, y, sz, sz);
        }
      }
      ctx.restore();
    }
    let grainCv = null;
    function grain(t, a) {
      if (!grainCv) { grainCv = document.createElement("canvas"); grainCv.width = 256; grainCv.height = 256; const g = grainCv.getContext("2d"); const id = g.createImageData(256, 256); const r = mulberry(99); for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } g.putImageData(id, 0, 0); }
      const f = Math.floor(t * 30); const ox = (f * 73) % 256, oy = (f * 151) % 256;
      ctx.save(); ctx.globalAlpha = a == null ? 0.045 : a; ctx.globalCompositeOperation = "overlay";
      for (let y = -oy; y < H; y += 256) for (let x = -ox; x < W; x += 256) ctx.drawImage(grainCv, x, y);
      ctx.restore();
    }
    function vignette(k) {
      const r = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
      r.addColorStop(0, "rgba(0,0,0,0)"); r.addColorStop(1, `rgba(0,0,0,${k == null ? 0.6 : k})`);
      ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
    }
    function glowDot(x, y, r, c, a) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c); g.addColorStop(1, "rgba(0,0,0,0)"); alpha(a == null ? 1 : a, () => { ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }); }

    // ---------- HUD box (top-right) ----------
    function hud(label, right, value, o) {
      o = o || {};
      const x = 1380, y = 30, w = 510, h = 112;
      alpha(o.a == null ? 1 : o.a, () => {
        rr(x, y, w, h, 16); ctx.fillStyle = "rgba(6,10,18,0.84)"; ctx.fill(); ctx.strokeStyle = "rgba(120,135,160,0.45)"; ctx.lineWidth = 2; ctx.stroke();
        text(label, x + 28, y + 38, { size: 17, weight: 600, ls: 4.5, color: "#e4e8ee" });
        text(right, x + w - 26, y + 36, { size: 15, weight: 600, ls: 3.5, color: o.rightC || P.grey, align: "right" });
        text(value, x + w - 24, y + 86, { size: 31, weight: 500, fam: F.mono, color: o.valC || P.cyan, align: "right", glow: o.glow == null ? 10 : o.glow, glowC: o.valC || P.cyan });
      });
    }

    // ---------- people ----------
    // a round-headed figure. o: {x, y (feet), s, suit, suitD, head, hair, style:'you'|'mia', age, look (-1..1), expr, walk, t, arm:{l,r}, seat}
    function person(o) {
      const s = o.s || 1, t = o.t || 0;
      ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s * (o.flip ? -1 : 1), s);
      const kid = o.age != null && o.age < 14, old = o.age != null && o.age > 65;
      const H0 = kid ? 0.72 : 1;          // body height factor
      const bob = o.walk ? Math.abs(Math.sin(t * 6)) * 4 : Math.sin(t * 1.6) * 1.2;
      const hunch = old ? 10 : 0;
      // legs
      const legL = 120 * H0, hipY = -legL;
      const sw = o.walk ? Math.sin(t * 6) * 18 : 0;
      ctx.lineCap = "round"; ctx.strokeStyle = o.legs || "#2a3142"; ctx.lineWidth = 22 * (kid ? 0.85 : 1);
      if (o.seat) { ctx.beginPath(); ctx.moveTo(-14, hipY + 50); ctx.lineTo(40, hipY + 52); ctx.lineTo(44, 0); ctx.moveTo(14, hipY + 50); ctx.lineTo(62, hipY + 52); ctx.lineTo(66, 0); ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(-12, hipY); ctx.lineTo(-12 + sw, -6); ctx.moveTo(12, hipY); ctx.lineTo(12 - sw, -6); ctx.stroke(); }
      ctx.fillStyle = o.shoes || "#1c2130";
      if (!o.seat) { rr(-26 + sw, -14, 30, 14, 6); ctx.fill(); rr(-2 - sw, -14, 30, 14, 6); ctx.fill(); } else { rr(32, -14, 32, 14, 6); ctx.fill(); rr(54, -14, 32, 14, 6); ctx.fill(); }
      ctx.translate(hunch * 0.6, (o.seat ? 50 : 0) - bob + hunch * 0.3);
      // torso (puffer / coat with stripes)
      const tw = kid ? 92 : 104, th = (kid ? 118 : 150);
      const ty = hipY - th + 16;
      const tg = ctx.createLinearGradient(-tw / 2, 0, tw / 2, 0); tg.addColorStop(0, o.suit); tg.addColorStop(1, o.suitD || o.suit);
      rr(-tw / 2, ty, tw, th, kid ? 30 : 34); ctx.fillStyle = tg; ctx.fill();
      if (o.coat) { ctx.beginPath(); ctx.moveTo(-tw / 2, ty + th - 10); ctx.lineTo(-tw / 2 - 14, ty + th + 26); ctx.lineTo(tw / 2 + 14, ty + th + 26); ctx.lineTo(tw / 2, ty + th - 10); ctx.closePath(); ctx.fillStyle = o.suitD || o.suit; ctx.fill(); }
      ctx.strokeStyle = "rgba(0,0,0,0.16)"; ctx.lineWidth = 3;
      for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-tw / 2 + 6, ty + th * k / 4); ctx.quadraticCurveTo(0, ty + th * k / 4 + 6, tw / 2 - 6, ty + th * k / 4); ctx.stroke(); }
      ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, ty + 14); ctx.lineTo(0, ty + th - 8); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.14)"; rr(-tw / 2 + 10, ty + 14, 18, th * 0.55, 9); ctx.fill();
      if (o.badge) { ctx.fillStyle = "#f4f6f8"; rr(10, ty + 40, 34, 24, 4); ctx.fill(); ctx.fillStyle = P.cyan; ctx.fillRect(10, ty + 40, 34, 6); ctx.strokeStyle = "#cfd6de"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(18, ty + 40); ctx.lineTo(0, ty + 8); ctx.moveTo(36, ty + 40); ctx.lineTo(0, ty + 8); ctx.stroke(); }
      if (o.patch) { ctx.fillStyle = "#f4f6f8"; ctx.beginPath(); ctx.arc(-24, ty + 42, 11, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = P.suitD; ctx.beginPath(); ctx.arc(-24, ty + 42, 5, 0, Math.PI * 2); ctx.fill(); }
      // arms
      const arm = (side, pose) => {
        const sx = side * (tw / 2 - 6), sy = ty + 22;
        let ex, ey, hx, hy;
        const p = pose || "down";
        if (p === "down") { ex = sx + side * 8; ey = sy + 52; hx = sx + side * 4 + (o.walk ? -side * sw * 0.6 : 0); hy = sy + 104; }
        else if (p === "wave") { ex = sx + side * 40; ey = sy - 14; hx = sx + side * 46 + Math.sin(t * 9) * 12; hy = sy - 70; }
        else if (p === "reach") { ex = sx + side * 48; ey = sy + 16; hx = sx + side * 96; hy = sy + 10; }
        else if (p === "hold") { ex = sx + side * 26; ey = sy + 44; hx = sx + side * 4 + 30 * side; hy = sy + 52; }
        else if (p === "lap") { ex = sx + side * 10; ey = sy + 50; hx = sx + side * 40; hy = sy + 70; }
        else if (p === "cane") { ex = sx + side * 22; ey = sy + 48; hx = sx + side * 40; hy = sy + 92; }
        else if (p === "hug") { ex = sx + side * 34; ey = sy + 24; hx = sx - side * 10; hy = sy + 38; }
        ctx.strokeStyle = o.suitD || o.suit; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
        ctx.fillStyle = o.skin || P.skin; ctx.beginPath(); ctx.arc(hx, hy, 10, 0, Math.PI * 2); ctx.fill();
        if (p === "cane") { ctx.strokeStyle = "#7a5a3a"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + 10, hy + (o._footY || 150)); ctx.stroke(); }
        return [hx, hy];
      };
      o._footY = -(ty + 22 + 92) - ((o.seat ? 50 : 0) - bob + hunch * 0.3) + 0; const hl = arm(-1, o.armL), hrr = arm(1, o.armR);
      if (o.holding) o.holding(hrr[0], hrr[1]);
      // head
      const hr = kid ? 52 : 50, hyc = ty - hr + 8;
      ctx.save(); ctx.translate((o.look || 0) * 4, hyc);
      if (o.style === "mia" || o.buns) { // buns behind the head
        ctx.fillStyle = o.hair || P.hair; ctx.beginPath(); ctx.arc(-hr * 0.78, -hr * 0.62, hr * 0.34, 0, Math.PI * 2); ctx.arc(hr * 0.78, -hr * 0.62, hr * 0.34, 0, Math.PI * 2); ctx.fill();
      }
      const hg = ctx.createRadialGradient(-hr * 0.35, -hr * 0.4, hr * 0.2, 0, 0, hr * 1.1); hg.addColorStop(0, o.skin || P.skin); hg.addColorStop(1, o.skinD || P.skinD);
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0, 0, hr, 0, Math.PI * 2); ctx.fill();
      // hair cap
      ctx.fillStyle = o.hair || P.hair; ctx.beginPath();
      if (o.style === "mia" || o.buns) { ctx.arc(0, 0, hr * 1.02, Math.PI * 1.03, Math.PI * 1.97); ctx.quadraticCurveTo(hr * 0.6, -hr * 0.2, 0, -hr * 0.42); ctx.quadraticCurveTo(-hr * 0.6, -hr * 0.2, -hr * 1.0, -hr * 0.05); }
      else { ctx.arc(0, 0, hr * 1.03, Math.PI * 1.02, Math.PI * 1.98); ctx.quadraticCurveTo(hr * 0.4, -hr * 0.5, -hr * 0.2, -hr * 0.52); ctx.quadraticCurveTo(-hr * 0.7, -hr * 0.4, -hr * 1.0, -hr * 0.1); }
      ctx.fill();
      if (o.cap) { ctx.fillStyle = "#1c2130"; ctx.fillRect(-hr * 0.9, -hr * 1.15, hr * 1.8, 12); ctx.beginPath(); ctx.moveTo(-hr * 0.6, -hr * 1.1); ctx.lineTo(hr * 0.6, -hr * 1.1); ctx.lineTo(0, -hr * 0.85); ctx.fill(); ctx.strokeStyle = P.yellow; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hr * 0.7, -hr * 1.1); ctx.lineTo(hr * 0.9, -hr * 0.6); ctx.stroke(); }
      // face
      const lk = (o.look || 0) * hr * 0.18, e = o.expr || "calm";
      const blink = (Math.sin(t * 0.9 + (o.seed || 0)) > 0.985) || e === "closed";
      ctx.fillStyle = "#2a1d1a";
      for (const ex of [-hr * 0.34, hr * 0.34]) {
        if (blink || e === "happy") { ctx.strokeStyle = "#2a1d1a"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(ex + lk, hr * 0.06, 7, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
        else { ctx.beginPath(); ctx.ellipse(ex + lk, hr * 0.02, 6.5, e === "wide" ? 10 : 8.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ex + lk + 2, hr * 0.02 - 3, 2.2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#2a1d1a"; }
        if (e === "worried") { ctx.strokeStyle = "#2a1d1a"; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(ex + lk - 9, -hr * 0.2 + (ex < 0 ? 4 : -4) * 0); ctx.lineTo(ex + lk + 9, -hr * 0.2 + (ex < 0 ? -5 : 5) * -1); ctx.stroke(); }
      }
      ctx.fillStyle = "rgba(230,110,110,0.28)"; ctx.beginPath(); ctx.ellipse(-hr * 0.55 + lk, hr * 0.3, 9, 6, 0, 0, Math.PI * 2); ctx.ellipse(hr * 0.55 + lk, hr * 0.3, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#5a2a24"; ctx.lineWidth = 3.5; ctx.beginPath();
      if (e === "smile" || e === "happy") ctx.arc(lk, hr * 0.32, 11, Math.PI * 0.15, Math.PI * 0.85);
      else if (e === "worried" || e === "sad") ctx.arc(lk, hr * 0.5, 9, Math.PI * 1.2, Math.PI * 1.8);
      else if (e === "open" || e === "wide") { ctx.fillStyle = "#5a2a24"; ctx.ellipse(lk, hr * 0.4, 7, 8, 0, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.moveTo(lk - 8, hr * 0.42); ctx.lineTo(lk + 8, hr * 0.42); }
      ctx.stroke();
      if (o.braces && (e === "smile" || e === "happy")) { ctx.fillStyle = "#fff"; ctx.fillRect(lk - 9, hr * 0.38, 18, 6); ctx.fillStyle = "#9aa3ad"; for (let k = -2; k <= 2; k++) ctx.fillRect(lk + k * 4 - 1, hr * 0.38, 2, 6); }
      if (o.glasses) { ctx.strokeStyle = "#3a3a44"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-hr * 0.34 + lk, hr * 0.02, 12, 0, Math.PI * 2); ctx.arc(hr * 0.34 + lk, hr * 0.02, 12, 0, Math.PI * 2); ctx.stroke(); }
      ctx.restore();
      ctx.restore();
    }
    const YOU = { suit: P.suit, suitD: P.suitD, skin: "#d9a07a", skinD: "#b97f5c", hair: "#2e2018", style: "you", legs: "#2b3346", patch: true };
    const MIA = (age) => {
      const old = age > 65;
      return { suit: old ? "#e9c45a" : P.mia, suitD: old ? "#c79f3a" : P.miaD, skin: P.skin, skinD: P.skinD, hair: old ? "#e6e6e2" : "#5a3524", style: "mia", age, legs: age < 14 ? "#3a5a8a" : "#3a4458", coat: age < 14 };
    };

    // ---------- OTTO (hover robot with a screen face) ----------
    // o: {x, y (centre), s, t, face:'idle'|'blink'|'happy'|'flat'|'side', screen(fn(w,h)) custom, turn (0 front .. 1 profile), arm}
    function otto(o) {
      const s = o.s || 1, t = o.t || 0;
      const bob = Math.sin(t * 2.2) * 6;
      ctx.save(); ctx.translate(o.x, o.y + bob); ctx.scale(s, s);
      // thruster glow
      glowDot(0, 128, 70, "rgba(98,232,244,0.55)", 0.8 + 0.2 * Math.sin(t * 13));
      ctx.fillStyle = "#9aa6b4"; rr(-26, 104, 52, 16, 8); ctx.fill();
      // arms
      const armA = o.arm || 0;
      ctx.strokeStyle = P.robotD; ctx.lineWidth = 14; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-74, 20); ctx.lineTo(-96, 64); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(74, 20); ctx.lineTo(96 + armA * 30, 64 - armA * 80); ctx.stroke();
      ctx.fillStyle = "#3a4456"; ctx.beginPath(); ctx.arc(-96, 66, 9, 0, Math.PI * 2); ctx.arc(96 + armA * 30, 66 - armA * 80, 9, 0, Math.PI * 2); ctx.fill();
      // egg body
      const bg = ctx.createRadialGradient(-30, -40, 10, 0, 0, 120); bg.addColorStop(0, "#ffffff"); bg.addColorStop(1, P.robotD);
      ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(0, 10, 84, 104, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.12)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 70, 66, 18, 0, 0, Math.PI); ctx.stroke();
      ctx.fillStyle = P.orange; ctx.beginPath(); ctx.arc(0, 66, 6, 0, Math.PI * 2); ctx.fill();
      // antenna
      ctx.strokeStyle = "#9aa6b4"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, -92); ctx.lineTo(0, -128); ctx.stroke();
      glowDot(0, -132, 26, "rgba(255,154,60,0.9)", 0.6 + 0.4 * Math.sin(t * 5));
      ctx.fillStyle = P.orange; ctx.beginPath(); ctx.arc(0, -132, 8, 0, Math.PI * 2); ctx.fill();
      // screen
      const turn = o.turn || 0;
      const sw = 128 * (1 - turn * 0.45), sx = -sw / 2 + turn * 34;
      rr(sx, -58, sw, 82, 26); ctx.fillStyle = P.screen; ctx.fill(); ctx.strokeStyle = "#2a3446"; ctx.lineWidth = 4; ctx.stroke();
      ctx.save(); rr(sx + 4, -54, sw - 8, 74, 22); ctx.clip(); ctx.translate(sx + sw / 2, -17);
      if (o.screen) o.screen(sw - 8, 74, t);
      else {
        const f = o.face || "idle"; const blink = Math.sin(t * 1.3 + 2) > 0.97;
        ctx.fillStyle = P.cyan; ctx.shadowColor = P.cyan; ctx.shadowBlur = 14;
        const ex = 26 * (1 - turn * 0.5);
        for (const x of [-ex + turn * 10, ex + turn * 10]) {
          if (f === "happy") { ctx.strokeStyle = P.cyan; ctx.lineWidth = 7; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(x, 6, 12, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
          else if (f === "flat" || blink) { rr(x - 14, -3, 28, 7, 3); ctx.fill(); }
          else if (f === "worried") { rr(x - 9, -14, 18, 26, 9); ctx.fill(); }
          else { rr(x - 9, -16, 18, 30, 9); ctx.fill(); }
        }
        ctx.shadowBlur = 0;
      }
      ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,0.08)"; rr(sx + 10, -52, sw * 0.35, 10, 5); ctx.fill();
      ctx.restore();
    }
    // flower doodle (cyan/pink line art) for OTTO's screen and the child's drawing
    function flower(x, y, r, c, lw) {
      ctx.strokeStyle = c; ctx.lineWidth = lw || 3; ctx.lineCap = "round";
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.7, r * 0.42, a, 0, Math.PI * 2); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(x, y, r * 0.42, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + r * 1.2); ctx.quadraticCurveTo(x - r * 0.3, y + r * 2.2, x + r * 0.1, y + r * 3.0); ctx.stroke();
    }
    // a child's crayon drawing of a robot holding a flower
    function kidDrawing(x, y, w, h, rot, a) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.globalAlpha *= a == null ? 1 : a;
      ctx.fillStyle = "#f6f1e6"; ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 24; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowBlur = 0;
      const k = w / 420;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      const wob = (n) => Math.sin(n * 12.9898) * 2.2 * k;
      ctx.strokeStyle = "#3d6fd0"; ctx.lineWidth = 6 * k;
      ctx.beginPath(); ctx.ellipse(-30 * k + wob(1), 40 * k, 70 * k, 88 * k, 0.05, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "#333"; ctx.beginPath(); ctx.roundRect(-82 * k, -22 * k, 104 * k, 58 * k, 14 * k); ctx.stroke();
      ctx.fillStyle = "#2fbfd0"; ctx.fillRect(-62 * k, -2 * k, 14 * k, 18 * k); ctx.fillRect(-10 * k, -2 * k, 14 * k, 18 * k);
      ctx.strokeStyle = "#e8743b"; ctx.lineWidth = 5 * k; ctx.beginPath(); ctx.moveTo(-30 * k, -70 * k); ctx.lineTo(-30 * k, -100 * k); ctx.stroke(); ctx.fillStyle = "#e8743b"; ctx.beginPath(); ctx.arc(-30 * k, -106 * k, 10 * k, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#555"; ctx.lineWidth = 6 * k; ctx.beginPath(); ctx.moveTo(38 * k, 40 * k); ctx.lineTo(96 * k, 0); ctx.stroke();
      flower(112 * k, -34 * k, 22 * k, "#e04a8a", 6 * k); ctx.fillStyle = "#f5c84a"; ctx.beginPath(); ctx.arc(112 * k, -34 * k, 9 * k, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#4caf50"; ctx.lineWidth = 6 * k; ctx.beginPath(); ctx.moveTo(-170 * k, 150 * k); ctx.lineTo(170 * k, 150 * k); ctx.stroke();
      ctx.fillStyle = "#f5c84a"; ctx.beginPath(); ctx.arc(150 * k, -150 * k, 28 * k, 0, Math.PI * 2); ctx.fill();
      text("OTTO", -150 * k, -140 * k, { size: 34 * k, weight: 700, fam: F.hand, color: "#3d6fd0" });
      text("love Mia", 80 * k, 186 * k, { size: 30 * k, weight: 700, fam: F.hand, color: "#e04a8a" });
      ctx.restore();
    }

    // ---------- ship, planets ----------
    function ship(x, y, s, o) {
      o = o || {};
      ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.flip ? -1 : 1), s); if (o.rot) ctx.rotate(o.rot);
      if (o.thrust) glowDot(-250, 0, 140 * o.thrust, "rgba(98,232,244,0.9)", 0.9);
      const g = ctx.createLinearGradient(0, -60, 0, 60); g.addColorStop(0, "#f4f7fa"); g.addColorStop(1, "#b9c3cf");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(260, 0); ctx.bezierCurveTo(200, -60, -40, -64, -200, -48); ctx.lineTo(-230, -20); ctx.lineTo(-230, 20); ctx.lineTo(-200, 48); ctx.bezierCurveTo(-40, 64, 200, 60, 260, 0); ctx.fill();
      ctx.fillStyle = P.suit; ctx.beginPath(); ctx.moveTo(-200, 10); ctx.lineTo(180, 14); ctx.lineTo(176, 24); ctx.lineTo(-200, 22); ctx.fill();
      ctx.fillStyle = "#0e1622"; ctx.beginPath(); ctx.moveTo(210, -6); ctx.bezierCurveTo(170, -40, 110, -40, 92, -22); ctx.lineTo(120, -6); ctx.fill();
      ctx.fillStyle = "#c4ccd6"; ctx.beginPath(); ctx.moveTo(-120, -44); ctx.lineTo(-190, -110); ctx.lineTo(-150, -110); ctx.lineTo(-60, -46); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-120, 44); ctx.lineTo(-190, 110); ctx.lineTo(-150, 110); ctx.lineTo(-60, 46); ctx.fill();
      if (o.label !== false) text("DEEPARC", -40, -8, { size: 22, weight: 700, ls: 4, color: "#4a5568" });
      ctx.restore();
    }
    function planet(x, y, r, o) {
      o = o || {};
      glowDot(x, y, r * 1.35, o.atm || "rgba(110,170,255,0.35)", 1);
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
      const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r); g.addColorStop(0, o.c0 || "#4f8fe0"); g.addColorStop(1, o.c1 || "#1d3f7a"); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
      const rot = o.rot || 0; const r2 = mulberry(o.seed || 3);
      ctx.fillStyle = o.land || "#4fa86a";
      for (let k = 0; k < 9; k++) { const a = r2() * Math.PI * 2, d = r2() * r * 0.8; ctx.beginPath(); ctx.ellipse(x + ((Math.cos(a) * d + rot * r) % (2 * r) + 3 * r) % (2 * r) - r, y + Math.sin(a) * d, r * (0.18 + r2() * 0.22), r * (0.1 + r2() * 0.16), r2() * 3, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = "rgba(255,255,255,0.55)"; for (let k = 0; k < 8; k++) { const a = r2() * Math.PI * 2, d = r2() * r; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d, r * 0.25, r * 0.05, r2(), 0, Math.PI * 2); ctx.fill(); }
      const sh = ctx.createLinearGradient(x - r, y, x + r, y); sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(0.6, "rgba(0,0,0,0.1)"); sh.addColorStop(1, "rgba(0,0,10,0.65)"); ctx.fillStyle = sh; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
      ctx.restore();
    }

    // ---------- cards / labels ----------
    function card(x, y, w, h, o) {
      o = o || {};
      rr(x, y, w, h, o.r || 22); ctx.fillStyle = o.fill || "rgba(6,10,20,0.88)"; ctx.fill();
      ctx.strokeStyle = o.border || "rgba(245,200,74,0.55)"; ctx.lineWidth = o.lw || 2; ctx.stroke();
    }
    function tag(s, x, y, o) { // a filled label with a leader line to (px, py)
      o = o || {}; const size = o.size || 30; const w = measure(s, { size, weight: 700, ls: o.ls || 0 }) + 36, h = size + 22;
      if (o.px != null) { ctx.strokeStyle = o.bg || P.cyan; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(o.px, o.py); ctx.lineTo(x, y + h / 2); ctx.stroke(); ctx.fillStyle = o.bg || P.cyan; ctx.beginPath(); ctx.arc(o.px, o.py, 7, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "rgba(98,232,244,0.4)"; ctx.beginPath(); ctx.arc(o.px, o.py, 22, 0, Math.PI * 2); ctx.stroke(); }
      const x0 = o.align === "right" ? x - w : x;
      ctx.fillStyle = o.bg || P.cyan; ctx.shadowColor = o.bg || P.cyan; ctx.shadowBlur = 18; ctx.fillRect(x0, y, w, h); ctx.shadowBlur = 0;
      text(s, x0 + 18, y + h / 2 + size * 0.36, { size, weight: 700, ls: o.ls || 0, color: o.color || "#06121a" });
      return w;
    }
    function bubble(s, x, y, o) {
      o = o || {}; const size = o.size || 30;
      const w = Math.max(80, measure(s, { size, weight: 700, ls: 1 }) + 48), h = size + 34;
      rr(x - w / 2, y - h, w, h, 18); ctx.fillStyle = o.fill || "#f2efe6"; ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + (o.tail || -20) - 12, y - 2); ctx.lineTo(x + (o.tail || -20) + 12, y - 2); ctx.lineTo(x + (o.tail || -20) * 1.6, y + 22); ctx.fill();
      text(s, x, y - h / 2 + size * 0.36, { size, weight: 700, ls: 1, color: o.color || "#1b2230", align: "center" });
    }
    function rollNum(n, digits) { return String(Math.floor(n)).padStart(digits || 1, "0"); }

    return { W, H, P, F, ctx, clamp, lerp, sm, eo, eio, back, mulberry, rr, text, measure, typed, alpha, save, pop, ground, stars, grain, vignette, glowDot, hud, person, YOU, MIA, otto, flower, kidDrawing, ship, planet, card, tag, bubble, rollNum };
  }
  window.SCIFI = { kit };
})();

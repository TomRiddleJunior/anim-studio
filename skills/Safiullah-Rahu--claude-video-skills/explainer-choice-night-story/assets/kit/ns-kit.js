/* ns-kit.js — "choice night story" drawing kit (flat 2D, Canvas 2D, 1080x1920).
   Everything is a pure function of its arguments: the film calls these per frame, so seeking is exact.
   Generic pieces: the stick-figure keeper, snow/rain, moon, stars, the HUD (night counter, clock, place line, chips),
   the handwritten rules sheet (typed rules, a scratched-out rule with a peeking word), the step counter, the wall clock,
   the log card, the rule card, the speaker tag, the two-button vote card, fades and flashes.
   Fonts (loaded by compositions/world.html): NSOswald (titles, captions, HUD), NSInter (small caps lines), NSCaveat (handwriting). */
(function () {
  const NS = {};
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const eio = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const eout = (u) => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
  const back = (u, k = 1.9) => { u = clamp(u, 0, 1); const c3 = k + 1; return 1 + c3 * Math.pow(u - 1, 3) + k * Math.pow(u - 1, 2); };
  function rng(seed) {
    let a = seed >>> 0;
    return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  NS.util = { clamp, lerp, sstep, eio, eout, back, rng };

  NS.create = function ({ canvas, width = 1080, height = 1920 }) {
    const ctx = canvas.getContext("2d");
    const W = width, H = height;
    const K = { ctx, W, H, clamp, lerp, sstep, eio, eout, back, rng };
    const fonts = ["700 80px NSOswald", "500 40px NSOswald", "600 40px NSOswald", "700 30px NSInter", "500 30px NSInter", "500 50px NSCaveat", "700 50px NSCaveat"];
    K.ready = (document.fonts ? Promise.all(fonts.map((f) => document.fonts.load(f))) : Promise.resolve()).then(() => true);

    // ---------------------------------------------------------------- primitives
    K.rr = function (x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    };
    K.font = (w, px, fam) => `${w} ${px}px ${fam === "inter" ? "NSInter" : fam === "hand" ? "NSCaveat" : "NSOswald"}`;
    K.text = function (s, x, y, o = {}) {
      ctx.save();
      ctx.font = K.font(o.w || 700, o.px || 40, o.fam);
      ctx.textAlign = o.align || "left"; ctx.textBaseline = o.base || "alphabetic";
      if ("letterSpacing" in ctx) ctx.letterSpacing = (o.ls || 0) + "px";
      ctx.globalAlpha *= o.a == null ? 1 : o.a;
      if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = o.blur || 10; ctx.shadowOffsetY = o.sy || 3; }
      if (o.stroke) { ctx.lineJoin = "round"; ctx.lineWidth = o.sw || 6; ctx.strokeStyle = o.stroke; ctx.strokeText(s, x, y); }
      ctx.fillStyle = o.col || "#fff"; ctx.fillText(s, x, y);
      ctx.restore();
    };
    K.measure = function (s, w, px, fam, ls) {
      ctx.save(); ctx.font = K.font(w, px, fam); if ("letterSpacing" in ctx) ctx.letterSpacing = (ls || 0) + "px";
      const m = ctx.measureText(s).width; ctx.restore(); return m;
    };
    K.glow = function (x, y, r, col, a = 1, mode = "lighter") {
      ctx.save(); ctx.globalCompositeOperation = mode; ctx.globalAlpha *= a;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
    };
    K.vgrad = function (y0, y1, stops) {
      const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g;
    };
    K.fill = function (col, a = 1) { ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col; ctx.fillRect(-50, -50, W + 100, H + 100); ctx.restore(); };
    K.vignette = function (k = 0.55, inner = 0.45) {
      ctx.save(); const g = ctx.createRadialGradient(W / 2, H * 0.48, H * inner * 0.5, W / 2, H * 0.48, H * 0.78);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${k})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    };
    K.poly = function (pts, col, stroke, lw) {
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
      if (col) { ctx.fillStyle = col; ctx.fill(); }
      if (stroke) { ctx.lineWidth = lw || 3; ctx.strokeStyle = stroke; ctx.lineJoin = "round"; ctx.stroke(); }
    };

    // ---------------------------------------------------------------- sky
    K.sky = function (top = "#0a1124", bot = "#1f2d50", y0 = 0, y1 = H) { ctx.fillStyle = K.vgrad(y0, y1, [[0, top], [1, bot]]); ctx.fillRect(-2000, -2000, W + 4000, H + 4000); };
    K.stars = function (seed, n, t, area = [0, 0, W, H * 0.55], a = 1) {
      const r = rng(seed); ctx.save();
      for (let i = 0; i < n; i++) {
        const x = lerp(area[0], area[2], r()), y = lerp(area[1], area[3], Math.pow(r(), 1.3)), s = 0.8 + r() * 2.2, ph = r() * 6.28;
        ctx.globalAlpha = a * (0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * (0.8 + r()) + ph)));
        ctx.fillStyle = "#dfe8ff"; ctx.fillRect(x, y, s, s);
      }
      ctx.restore();
    };
    K.moon = function (x, y, r, a = 1) {
      ctx.save(); ctx.globalAlpha *= a;
      K.glow(x, y, r * 3.4, "rgba(200,215,255,0.22)");
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fillStyle = "#e9e4cf"; ctx.fill();
      ctx.fillStyle = "rgba(170,160,135,0.45)";
      [[-0.3, -0.25, 0.2], [0.28, 0.1, 0.14], [-0.05, 0.38, 0.11], [0.35, -0.35, 0.08], [-0.42, 0.15, 0.07]].forEach(([dx, dy, rr]) => {
        ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, rr * r, 0, 6.283); ctx.fill();
      });
      ctx.restore();
    };
    K.cloud = function (x, y, s, col = "#25345a", a = 1) {
      ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col; ctx.beginPath();
      ctx.ellipse(x, y, 90 * s, 26 * s, 0, 0, 6.283); ctx.ellipse(x - 40 * s, y - 10 * s, 42 * s, 30 * s, 0, 0, 6.283);
      ctx.ellipse(x + 26 * s, y - 22 * s, 48 * s, 38 * s, 0, 0, 6.283); ctx.fill(); ctx.restore();
    };
    /* snow: n flakes, seeded; fall speed px/s, wind px/s, sway; area = [x0,y0,x1,y1]; deterministic in t */
    K.snow = function (t, o = {}) {
      const r = rng(o.seed || 7), n = o.n || 120, A = o.area || [-40, -40, W + 40, H + 40];
      const w = A[2] - A[0], h = A[3] - A[1];
      ctx.save(); ctx.fillStyle = o.col || "#eef3ff";
      for (let i = 0; i < n; i++) {
        const x0 = r() * w, y0 = r() * h, sz = lerp(o.size ? o.size[0] : 2, o.size ? o.size[1] : 6, r()), sp = lerp(o.speed ? o.speed[0] : 60, o.speed ? o.speed[1] : 140, r());
        const ph = r() * 6.28, sw = 8 + r() * 22;
        let y = (y0 + sp * t) % h; if (y < 0) y += h;
        let x = (x0 + (o.wind || 0) * t + Math.sin(t * (0.7 + r() * 0.8) + ph) * sw) % w; if (x < 0) x += w;
        ctx.globalAlpha = (o.a == null ? 0.85 : o.a) * (0.5 + 0.5 * r());
        ctx.beginPath(); ctx.arc(A[0] + x, A[1] + y, sz / 2, 0, 6.283); ctx.fill();
      }
      ctx.restore();
    };
    K.rain = function (t, o = {}) {
      const r = rng(o.seed || 11), n = o.n || 160;
      ctx.save(); ctx.strokeStyle = o.col || "rgba(190,205,235,0.45)"; ctx.lineWidth = o.lw || 2;
      for (let i = 0; i < n; i++) {
        const x0 = r() * (W + 200) - 100, y0 = r() * H, sp = 1400 + r() * 700, len = 26 + r() * 30;
        const y = (y0 + sp * t) % (H + 80) - 40, x = x0 + (o.wind || -0.12) * y;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (o.wind || -0.12) * len, y + len); ctx.stroke();
      }
      ctx.restore();
    };
    K.fog = function (t, o = {}) { /* soft drifting fog bands */
      const r = rng(o.seed || 21), n = o.n || 9, A = o.area || [0, 0, W, H];
      ctx.save(); ctx.globalCompositeOperation = o.mode || "source-over";
      for (let i = 0; i < n; i++) {
        const y = lerp(A[1], A[3], r()), rx = 300 + r() * 420, ry = 80 + r() * 160, sp = (12 + r() * 30) * (r() < 0.5 ? -1 : 1);
        let x = (r() * (A[2] - A[0] + 2 * rx) + sp * t) % (A[2] - A[0] + 2 * rx); if (x < 0) x += A[2] - A[0] + 2 * rx;
        x += A[0] - rx;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
        g.addColorStop(0, o.col || "rgba(205,214,228,0.55)"); g.addColorStop(1, "rgba(205,214,228,0)");
        ctx.globalAlpha = (o.a == null ? 1 : o.a) * (0.5 + 0.5 * r());
        ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx); ctx.translate(-x, -y); ctx.fillStyle = g;
        ctx.fillRect(x - rx, y - rx, 2 * rx, 2 * rx); ctx.restore();
      }
      ctx.restore();
    };

    // ---------------------------------------------------------------- the keeper (stick figure)
    /* o: x, y (feet), s (scale), view "front" | "side" | "back", dir (+1 right, -1 left, side view), walk (phase rad, null = still),
          expr "neutral" | "worried" | "shock" | "determined" | "side" (suspicious side-eye), look [dx,dy] (-1..1), blink 0..1,
          armL / armR: hand offsets [dx,dy] from the shoulder (front view) or {a: angle} (side), lantern: "L" | "R" | null,
          seated (draw from the waist up), hat/coat/scarf colours. */
    K.KEEPER = { hat: "#c63b30", hatBand: "#9f2c24", pom: "#efe7d8", coat: "#466340", coatDark: "#2c4228", scarf: "#d9a23a", skin: "#f7f4ee", ink: "#2a2420", boot: "#3a2c24" };
    K.keeper = function (o) {
      const P = Object.assign({}, K.KEEPER, o.colors || {});
      const s = o.s || 1, view = o.view || "front", dir = o.dir || 1;
      ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s, s);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      const legH = 76, coatH = 100, headR = 46;
      const hipY = -legH, shY = hipY - coatH + 12, headY = hipY - coatH - 36;
      const ph = o.walk == null ? null : o.walk;
      const bob = ph == null ? 0 : Math.abs(Math.sin(ph)) * -4;
      ctx.translate(0, bob);
      const breathe = Math.sin((o.t || 0) * 2.1) * 1.2;
      // legs
      if (!o.seated) {
        ctx.strokeStyle = P.ink; ctx.lineWidth = 6.5;
        const legs = view === "side" ? [-1, 1] : [-1, 1];
        legs.forEach((k) => {
          let fx = k * 15, fy = 0;
          if (ph != null) {
            const sw = Math.sin(ph + (k > 0 ? 0 : Math.PI));
            if (view === "side") { fx = dir * sw * 22; fy = -Math.max(0, Math.cos(ph + (k > 0 ? 0 : Math.PI))) * 10 + (o.stepRise ? -Math.max(0, sw) * o.stepRise : 0); }
            else { fx = k * 14 + sw * 5; fy = -Math.max(0, sw) * 7; }
          }
          const hx = view === "side" ? dir * 2 : k * 11;
          ctx.beginPath(); ctx.moveTo(hx, hipY + 4); ctx.lineTo(fx, fy - 6); ctx.stroke();
          ctx.fillStyle = P.boot; ctx.beginPath();
          ctx.ellipse(fx + (view === "side" ? dir * 7 : k * 3), fy - 5, 15, 8, 0, 0, 6.283); ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.beginPath(); ctx.ellipse(fx + (view === "side" ? dir * 9 : k * 3), fy - 8, 8, 3, 0, 0, 6.283); ctx.fill();
        });
      }
      // coat
      const cw = view === "side" ? 52 : 68;
      ctx.fillStyle = P.coat; ctx.strokeStyle = P.coatDark; ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-cw / 2 + 6, shY - 6); ctx.quadraticCurveTo(0, shY - 14 - breathe, cw / 2 - 6, shY - 6);
      ctx.lineTo(cw / 2 + 4, hipY + 8); ctx.quadraticCurveTo(0, hipY + 16, -cw / 2 - 4, hipY + 8); ctx.closePath();
      ctx.fill(); ctx.stroke();
      if (view !== "back") {
        ctx.strokeStyle = P.coatDark; ctx.lineWidth = 2.5;
        if (view === "front") {
          ctx.beginPath(); ctx.moveTo(0, shY + 8); ctx.lineTo(0, hipY + 12); ctx.stroke();
          ctx.strokeRect(-26, hipY - 30, 16, 14); ctx.strokeRect(10, hipY - 30, 16, 14);
          ctx.fillStyle = "#c9c3b5"; [shY + 26, shY + 48, shY + 70].forEach((yy) => { ctx.beginPath(); ctx.arc(-6, yy, 2.6, 0, 6.283); ctx.fill(); });
        } else {
          ctx.strokeRect(dir * 2 - 9, hipY - 32, 18, 14);
        }
      }
      // scarf
      ctx.fillStyle = P.scarf; ctx.strokeStyle = "#a9771f"; ctx.lineWidth = 2.5;
      K.rr(-cw / 2 + 4, shY - 16, cw - 8, 20, 9); ctx.fill(); ctx.stroke();
      if (view === "front") { K.rr(12, shY, 13, 40, 5); ctx.fill(); ctx.stroke(); }
      else if (view === "side") { const sw = ph == null ? 0 : Math.sin(ph * 0.5) * 4; K.rr(-dir * 22 - 6 + sw, shY - 2, 12, 34, 5); ctx.fill(); ctx.stroke(); }
      // arms
      const sx = view === "side" ? 0 : cw / 2 - 4;
      const arm = (side, hand) => {
        const shx = side * sx, shy = shY + 6;
        let hx, hy;
        if (hand && hand.length) { hx = shx + hand[0]; hy = shy + hand[1]; }
        else if (view === "side") { const sw = ph == null ? 0 : Math.sin(ph + (side > 0 ? Math.PI : 0)) * 20; hx = shx + dir * sw; hy = shy + 62; }
        else { hx = side * (sx + 8); hy = shy + 64; }
        ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(shx, shy); ctx.lineTo(hx, hy); ctx.stroke();
        ctx.fillStyle = P.skin; ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hx, hy, 9, 0, 6.283); ctx.fill(); ctx.stroke();
        return [hx, hy];
      };
      const hL = arm(-1, o.armL), hR = arm(1, o.armR);
      if (o.lantern) {
        const [lx, ly] = o.lantern === "L" ? hL : hR;
        ctx.strokeStyle = "#2b2622"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx, ly + 6); ctx.lineTo(lx, ly + 16); ctx.stroke();
        ctx.fillStyle = "#3a332c"; K.rr(lx - 13, ly + 14, 26, 8, 3); ctx.fill(); K.rr(lx - 13, ly + 48, 26, 8, 3); ctx.fill();
        ctx.fillStyle = "#ffd27a"; K.rr(lx - 10, ly + 22, 20, 26, 4); ctx.fill();
        ctx.fillStyle = "#fff4cf"; ctx.beginPath(); ctx.ellipse(lx, ly + 36, 4, 7, 0, 0, 6.283); ctx.fill();
        K.glow(lx, ly + 36, 120, "rgba(255,190,90,0.55)", o.lanternK == null ? 1 : o.lanternK);
      }
      // head
      const hx = 0, hy = headY;
      ctx.fillStyle = P.skin; ctx.strokeStyle = P.ink; ctx.lineWidth = 3.8;
      ctx.beginPath(); ctx.arc(hx, hy, headR, 0, 6.283); ctx.fill(); ctx.stroke();
      // face
      if (view !== "back") {
        const lk = o.look || [0, 0];
        const ex = view === "side" ? dir * 20 : 0, sep = view === "side" ? 12 : 16;
        const eyeY = hy + 4 + lk[1] * 4, eyeX = ex + lk[0] * 7;
        const expr = o.expr || "neutral", bl = clamp(o.blink || 0, 0, 1);
        ctx.fillStyle = P.ink; ctx.strokeStyle = P.ink;
        const eyes = view === "side" ? [eyeX - dir * 2 - sep / 2, eyeX - dir * 2 + sep / 2 + dir * 6] : [eyeX - sep, eyeX + sep];
        eyes.forEach((exx, i) => {
          if (expr === "shock") {
            ctx.fillStyle = "#fff"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(exx, eyeY - 2, 9 * (1 - bl * 0.9), 0, 6.283); ctx.fill(); ctx.stroke();
            ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(exx + lk[0] * 3, eyeY - 2 + lk[1] * 2, 3.6, 0, 6.283); ctx.fill();
          } else if (bl > 0.6) {
            ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(exx - 5, eyeY); ctx.lineTo(exx + 5, eyeY); ctx.stroke();
          } else {
            ctx.beginPath(); ctx.ellipse(exx, eyeY, 5.2, 5.6 * (1 - bl), 0, 0, 6.283); ctx.fill();
          }
        });
        // brows
        ctx.lineWidth = 3.4;
        const brow = (exx, side) => {
          let y0 = eyeY - 14, inner = 0, lift = 0;
          if (expr === "worried") { inner = -6; }
          if (expr === "shock") { y0 -= 7; inner = -3; }
          if (expr === "determined") { inner = 6; }
          if (expr === "side" && side > 0) { inner = 5; y0 += 2; }
          if (expr === "side" && side < 0) { lift = -3; }
          const ix = exx - side * 7, ox = exx + side * 7;
          ctx.beginPath(); ctx.moveTo(ix, y0 + inner + lift); ctx.lineTo(ox, y0 - inner * 0.2 + lift); ctx.stroke();
        };
        if (view === "side") { brow(eyes[0], -dir); brow(eyes[1], dir); } else { brow(eyes[0], -1); brow(eyes[1], 1); }
        // mouth
        const mx = view === "side" ? ex + dir * 6 : lk[0] * 5, my = hy + 26;
        ctx.lineWidth = 3;
        if (expr === "shock") { ctx.fillStyle = P.ink; ctx.beginPath(); ctx.ellipse(mx, my + 2, 6, 8, 0, 0, 6.283); ctx.fill(); }
        else if (expr === "worried") { ctx.beginPath(); ctx.moveTo(mx - 9, my + 3); ctx.quadraticCurveTo(mx - 3, my - 3, mx, my + 1); ctx.quadraticCurveTo(mx + 4, my + 4, mx + 9, my - 1); ctx.stroke(); }
        else if (expr === "determined") { ctx.beginPath(); ctx.moveTo(mx - 9, my + 1); ctx.lineTo(mx + 9, my + 1); ctx.stroke(); }
        else if (expr === "smile") { ctx.beginPath(); ctx.arc(mx, my - 6, 10, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke(); }
        else { ctx.beginPath(); ctx.moveTo(mx - 7, my); ctx.lineTo(mx + 7, my); ctx.stroke(); }
      }
      // beanie
      ctx.fillStyle = P.hat; ctx.strokeStyle = P.ink; ctx.lineWidth = 3.4;
      const capY = hy - 12;
      ctx.beginPath(); ctx.moveTo(-headR - 3, capY); ctx.bezierCurveTo(-headR - 2, hy - headR - 26, headR + 2, hy - headR - 26, headR + 3, capY); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = P.hatBand; K.rr(-headR - 6, capY - 6, headR * 2 + 12, 20, 9); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "rgba(0,0,0,0.22)"; ctx.lineWidth = 2;
      for (let k = -headR; k <= headR; k += 11) { ctx.beginPath(); ctx.moveTo(k, capY - 3); ctx.lineTo(k, capY + 11); ctx.stroke(); }
      ctx.fillStyle = P.pom; ctx.strokeStyle = P.ink; ctx.lineWidth = 3;
      const pomX = view === "side" ? -dir * 8 : 0;
      ctx.beginPath(); ctx.arc(pomX, hy - headR - 22, 14, 0, 6.283); ctx.fill(); ctx.stroke();
      ctx.restore();
      return { head: [o.x, o.y + (headY + bob) * s], r: headR * s, handL: [o.x + hL[0] * s, o.y + (hL[1] + bob) * s], handR: [o.x + hR[0] * s, o.y + (hR[1] + bob) * s] };
    };

    // ---------------------------------------------------------------- HUD
    /* st: a (alpha), night "NIGHT 1 / 7", time "9:00", ampm "PM", place "…", chips [{text, col, check, pop}], timeCol */
    K.hud = function (st) {
      if (!st || st.a <= 0) return;
      ctx.save(); ctx.globalAlpha = st.a;
      const x = 62;
      ctx.fillStyle = "#ef5a4a"; ctx.beginPath(); ctx.arc(x + 7, 113, 7, 0, 6.283); ctx.fill();
      K.text(st.night || "NIGHT 1 / 7", x + 22, 122, { w: 600, px: 25, col: "#ef5a4a", ls: 1.5 });
      const tw = K.measure(st.time, 700, 104, null, 0);
      K.text(st.time, x - 2, 238, { w: 700, px: 104, col: st.timeCol || "#ffffff", shadow: "rgba(0,0,0,0.35)", blur: 12 });
      K.text(st.ampm || "PM", x + tw + 10, 238, { w: 600, px: 36, col: st.timeCol || "#ffffff" });
      K.text(st.place, x, 278, { w: 700, px: 19, fam: "inter", col: "#c9ced8", ls: 1.2 });
      let cx = x;
      (st.chips || []).forEach((c) => {
        const label = (c.check ? "✓ " : "") + c.text;
        const w = K.measure(label, 500, 25, null, 1) + 30;
        const sc = c.pop == null ? 1 : c.pop;
        ctx.save(); ctx.translate(cx + w / 2, 322); ctx.scale(sc, sc); ctx.translate(-(cx + w / 2), -322);
        ctx.fillStyle = c.fill || "rgba(10,14,24,0.55)"; K.rr(cx, 300, w, 46, 9); ctx.fill();
        ctx.lineWidth = 2.6; ctx.strokeStyle = c.col; ctx.stroke();
        K.text(label, cx + 15, 333, { w: 500, px: 25, col: c.col, ls: 1 });
        ctx.restore();
        cx += w + 14;
      });
      ctx.restore();
    };

    // ---------------------------------------------------------------- rules sheet
    /* st: x,y,w,h, title, rules [{n, lines:[…], typed 0..1}], scratch {i (index), k 0..1, k2 0..1, peek "word", peekAt [line, charIndex]},
           sign "— I.", torn (bottom-right corner), pin */
    K.sheet = function (st) {
      const { x, y, w, h } = st;
      ctx.save();
      // shadow + paper
      ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.beginPath();
      ctx.moveTo(x + 16, y + 18); ctx.lineTo(x + w + 16, y + 18); ctx.lineTo(x + w + 16, y + h + 20); ctx.lineTo(x + 16, y + h + 20); ctx.closePath(); ctx.fill();
      const paper = new Path2D();
      const tear = [[w, h - 210], [w - 34, h - 178], [w - 6, h - 150], [w - 52, h - 118], [w - 18, h - 92], [w - 70, h - 60], [w - 40, h - 26], [w - 96, h]];
      paper.moveTo(x, y); paper.lineTo(x + w, y);
      if (st.torn !== false) { tear.forEach(([px, py]) => paper.lineTo(x + px, y + py)); } else { paper.lineTo(x + w, y + h); }
      paper.lineTo(x, y + h); paper.closePath();
      ctx.fillStyle = K.vgrad(y, y + h, [[0, "#f6efdc"], [1, "#ece2c8"]]); ctx.fill(paper);
      ctx.save(); ctx.clip(paper);
      // ruled lines + margin
      ctx.strokeStyle = "rgba(120,150,190,0.28)"; ctx.lineWidth = 2;
      for (let yy = y + (st.rule0 || 168); yy < y + h - 20; yy += st.lh || 76) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); }
      ctx.strokeStyle = "rgba(205,90,80,0.55)"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x + 92, y); ctx.lineTo(x + 92, y + h); ctx.stroke();
      // paper fibres
      const r = rng(st.seed || 5); ctx.fillStyle = "rgba(120,100,60,0.05)";
      for (let i = 0; i < 260; i++) ctx.fillRect(x + r() * w, y + r() * h, 2 + r() * 5, 1 + r() * 2);
      ctx.restore();
      ctx.lineWidth = 2; ctx.strokeStyle = "rgba(90,70,40,0.25)"; ctx.stroke(paper);
      // torn fold shadow
      if (st.torn !== false) { ctx.fillStyle = "rgba(40,25,15,0.85)"; ctx.beginPath(); ctx.moveTo(x + w, y + h - 210); tear.forEach(([px, py]) => ctx.lineTo(x + px + 10, y + py + 8)); ctx.lineTo(x + w + 6, y + h + 4); ctx.closePath(); ctx.globalCompositeOperation = "destination-over"; ctx.fill(); ctx.globalCompositeOperation = "source-over"; }
      // pin
      ctx.fillStyle = "#b8352b"; ctx.beginPath(); ctx.arc(x + w / 2, y + 18, 11, 0, 6.283); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.beginPath(); ctx.arc(x + w / 2 - 3, y + 15, 3.5, 0, 6.283); ctx.fill();
      // title
      const tpx = st.titlePx || 62;
      K.text(st.title, x + w / 2, y + 108, { w: 700, px: tpx, fam: "hand", col: "#2d2b36", align: "center" });
      const tw = K.measure(st.title, 700, tpx, "hand");
      ctx.strokeStyle = "#2d2b36"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + w / 2 - tw / 2 - 6, y + 126); ctx.quadraticCurveTo(x + w / 2, y + 131, x + w / 2 + tw / 2 + 8, y + 124); ctx.stroke();
      // rules
      const lh = st.lh || 76, px = st.px || 52;
      let ly = y + (st.text0 || 228);
      (st.rules || []).forEach((rl, i) => {
        const total = rl.lines.join("").length; let shown = Math.round(total * clamp(rl.typed, 0, 1));
        if (rl.typed > 0) K.text(rl.n + ".", x + 50, ly, { w: 700, px: px * 0.92, fam: "hand", col: "#c0473c", align: "center" });
        const y0 = ly;
        rl.lines.forEach((ln, j) => {
          const part = ln.slice(0, Math.max(0, Math.min(ln.length, shown)));
          shown -= ln.length;
          if (part.length) K.text(part, x + 118, ly, { w: 500, px, fam: "hand", col: "#2c2a35" });
          ly += lh;
        });
        if (st.scratch && st.scratch.i === i) {
          const sc = st.scratch, lines = rl.lines.length;
          const drawScribble = (k, seed, thick, yoff) => {
            if (k <= 0) return;
            const rr = rng(seed); ctx.save(); ctx.strokeStyle = "#16151b"; ctx.lineWidth = thick; ctx.lineJoin = "round";
            for (let j = 0; j < lines; j++) {
              const yy = y0 + j * lh - px * 0.32 + yoff, x0 = x + 104, x1 = x + w - 40 - (j === lines - 1 ? 120 : 0);
              const n = 26, upto = clamp(k * lines - j, 0, 1) * n;
              ctx.beginPath();
              for (let q = 0; q <= upto; q++) { const xx = lerp(x0, x1, q / n), yy2 = yy + (q % 2 ? -1 : 1) * (14 + rr() * 16) + (rr() - 0.5) * 8; q ? ctx.lineTo(xx, yy2) : ctx.moveTo(xx, yy2); }
              ctx.stroke();
            }
            ctx.restore();
          };
          // the peek word stays readable: scribbles skip a small window around it
          if (sc.peek) {
            const [pl, pc] = sc.peekAt; const lnTxt = rl.lines[pl];
            const before = K.measure(lnTxt.slice(0, pc), 500, px, "hand"), pw = K.measure(sc.peek, 500, px, "hand");
            ctx.save(); ctx.beginPath(); ctx.rect(x - 20, y0 - 200, w + 60, lines * lh + 400);
            ctx.rect(x + 118 + before - 4, y0 + pl * lh - px * 0.85, pw + 8, px * 1.05); ctx.clip("evenodd");
            drawScribble(sc.k, 101, 7, 0); drawScribble(sc.k2 || 0, 202, 6, 8); ctx.restore();
            if (sc.glint) K.glow(x + 118 + before + pw / 2, y0 + pl * lh - px * 0.3, 90, "rgba(255,240,200,0.6)", sc.glint);
          } else { drawScribble(sc.k, 101, 7, 0); drawScribble(sc.k2 || 0, 202, 6, 8); }
        }
        ly += st.gap == null ? 14 : st.gap;
      });
      if (st.sign && st.signA > 0) K.text(st.sign, x + w - 210, y + h - 240, { w: 700, px: 54, fam: "hand", col: "#2c2a35", a: st.signA });
      ctx.restore();
    };

    // ---------------------------------------------------------------- counters, clock, cards
    K.counter = function (n, a, done, x = 712, y = 398, prog = 0) {
      if (a <= 0) return; ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = "rgba(10,13,22,0.82)"; K.rr(x, y, 200, 138, 16); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 2; ctx.stroke();
      K.text("STEP", x + 100, y + 38, { w: 600, px: 22, fam: "inter", col: "#9aa3b2", align: "center", ls: 2 });
      K.text(String(n), x + 100, y + 116, { w: 700, px: 74, col: done ? "#3ec27a" : "#efb02e", align: "center" });
      // progress tube
      ctx.fillStyle = "#dcdcd8"; K.rr(x + 238, y + 40, 18, 230, 9); ctx.fill();
      ctx.fillStyle = "#c54434"; K.rr(x + 236, y + 30, 22, 18, 6); ctx.fill();
      ctx.fillStyle = done ? "#3ec27a" : "#efb02e"; K.rr(x + 242, y + 266 - 222 * prog, 10, 222 * prog, 5); ctx.fill();
      ctx.restore();
    };
    K.clock = function (cx, cy, r, h, m, sec) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.beginPath(); ctx.arc(cx + 10, cy + 14, r + 10, 0, 6.283); ctx.fill();
      ctx.fillStyle = "#6b4a33"; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.283); ctx.fill();
      ctx.fillStyle = "#4e3423"; ctx.beginPath(); ctx.arc(cx, cy, r * 0.9, 0, 6.283); ctx.fill();
      ctx.fillStyle = "#efe8d6"; ctx.beginPath(); ctx.arc(cx, cy, r * 0.86, 0, 6.283); ctx.fill();
      ctx.strokeStyle = "#1e1c22";
      for (let i = 0; i < 60; i++) {
        const a = i / 60 * 6.283, big = i % 5 === 0, r0 = r * (big ? 0.72 : 0.78), r1 = r * 0.82;
        ctx.lineWidth = big ? 8 : 3; ctx.beginPath(); ctx.moveTo(cx + Math.sin(a) * r0, cy - Math.cos(a) * r0); ctx.lineTo(cx + Math.sin(a) * r1, cy - Math.cos(a) * r1); ctx.stroke();
      }
      const hand = (ang, len, wdt, col) => { ctx.strokeStyle = col; ctx.lineWidth = wdt; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(cx - Math.sin(ang) * len * 0.12, cy + Math.cos(ang) * len * 0.12); ctx.lineTo(cx + Math.sin(ang) * len, cy - Math.cos(ang) * len); ctx.stroke(); };
      hand(((h % 12) + m / 60) / 12 * 6.283, r * 0.45, 13, "#1e1c22");
      hand((m + sec / 60) / 60 * 6.283, r * 0.68, 9, "#1e1c22");
      hand(sec / 60 * 6.283, r * 0.74, 4, "#b8372d");
      ctx.fillStyle = "#1e1c22"; ctx.beginPath(); ctx.arc(cx, cy, 13, 0, 6.283); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.beginPath(); ctx.ellipse(cx - r * 0.25, cy - r * 0.4, r * 0.5, r * 0.25, -0.5, 0, 6.283); ctx.fill();
      ctx.restore();
    };
    /* log card: x,y,w,h, line1 (typed k1), line2, a */
    K.logCard = function (st) {
      if (st.a <= 0) return; ctx.save(); ctx.globalAlpha = st.a;
      const { x, y, w, h } = st;
      ctx.fillStyle = "rgba(0,0,0,0.35)"; K.rr(x + 14, y + 16, w, h, 8); ctx.fill();
      ctx.fillStyle = "#e6dcc3"; K.rr(x + 22, y + 22, w, h, 8); ctx.fill();
      ctx.fillStyle = "#f3ead5"; K.rr(x, y, w, h, 8); ctx.fill();
      ctx.strokeStyle = "rgba(120,150,190,0.25)"; ctx.lineWidth = 2;
      [y + 112, y + 190].forEach((yy) => { ctx.beginPath(); ctx.moveTo(x + 30, yy); ctx.lineTo(x + w - 30, yy); ctx.stroke(); });
      const s1 = st.line1.slice(0, Math.round(st.line1.length * clamp(st.k1, 0, 1)));
      K.text(s1, x + 44, y + 96, { w: 700, px: 66, fam: "hand", col: "#2a2833" });
      K.text(st.line2, x + 44, y + 176, { w: 500, px: 38, fam: "hand", col: "#6b6676", a: st.k2 == null ? 1 : st.k2 });
      ctx.restore();
    };
    K.ruleCard = function (st) {
      if (st.a <= 0) return; ctx.save(); ctx.globalAlpha = st.a;
      const sc = st.s == null ? 1 : st.s; ctx.translate(540, st.y + st.h / 2); ctx.scale(sc, sc); ctx.translate(-540, -(st.y + st.h / 2));
      ctx.fillStyle = "rgba(70,18,16,0.86)"; K.rr(90, st.y, 900, st.h, 18); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = "#e0574a"; ctx.stroke();
      K.text(st.title, 540, st.y + 68, { w: 600, px: 40, col: "#f06a5a", align: "center", ls: 2 });
      K.text(st.text, 540, st.y + 150, { w: 500, px: 54, fam: "hand", col: "#fbefe6", align: "center" });
      ctx.restore();
    };
    K.tag = function (txt, x, y, col, a = 1, px = 24) {
      if (a <= 0) return; K.text(txt, x, y, { w: 600, px, col, align: "center", ls: 2, a, shadow: "rgba(0,0,0,0.6)", blur: 8, sy: 2 });
    };
    /* vote card: y, a, s (scale), head (red line), q (question), b1/b2 labels, foot, pulse t */
    K.voteCard = function (st) {
      if (st.a <= 0) return; ctx.save(); ctx.globalAlpha = st.a;
      const x = 90, w = 900, y = st.y, h = st.h || 640;
      const sc = st.s == null ? 1 : st.s; ctx.translate(540, y + h / 2); ctx.scale(sc, sc); ctx.translate(-540, -(y + h / 2));
      ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
      ctx.fillStyle = "#f4ede0"; K.rr(x, y, w, h, 26); ctx.fill(); ctx.shadowColor = "rgba(0,0,0,0)";
      if (st.series) K.text(st.series, 540, y + 62, { w: 600, px: 21, fam: "inter", col: "#8b8478", align: "center", ls: 2.5 });
      K.text(st.head, 540, y + 132, { w: 600, px: 46, col: "#c8392f", align: "center", ls: 0.5 });
      K.text(st.q, 540, y + 232, { w: 700, px: st.qpx || 84, col: "#1d1c21", align: "center" });
      const by = y + 300, bw = 372, bh = 116, gap = 36;
      const bx1 = 540 - gap / 2 - bw, bx2 = 540 + gap / 2;
      const p1 = st.pulse ? 1 + 0.035 * Math.max(0, Math.sin(st.pulse * 3.2)) : 1, p2 = st.pulse ? 1 + 0.035 * Math.max(0, Math.sin(st.pulse * 3.2 + Math.PI)) : 1;
      [[bx1, "#2f9e62", st.b1, p1], [bx2, "#d64535", st.b2, p2]].forEach(([bx, col, lab, p]) => {
        ctx.save(); ctx.translate(bx + bw / 2, by + bh / 2); ctx.scale(p, p); ctx.translate(-(bx + bw / 2), -(by + bh / 2));
        ctx.fillStyle = col; K.rr(bx, by, bw, bh, 18); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.12)"; K.rr(bx, by, bw, bh * 0.45, 18); ctx.fill();
        K.text(lab, bx + bw / 2, by + 78, { w: 700, px: 52, col: "#ffffff", align: "center", ls: 1 });
        ctx.restore();
      });
      K.text(st.foot, 540, y + h - 70, { w: 500, px: 25, col: "#57524b", align: "center", ls: 1 });
      if (st.foot2) K.text(st.foot2, 540, y + h - 34, { w: 500, px: 21, fam: "inter", col: "#8b8478", align: "center", ls: 1.5 });
      ctx.restore();
    };
    K.fade = function (a, col = "#000") { if (a > 0.001) K.fill(col, clamp(a, 0, 1)); };
    return K;
  };
  window.NS = NS;
})();

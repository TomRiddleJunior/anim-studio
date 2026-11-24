/* strike-kit.js — "strike counter" minimal-loop drawing kit (Canvas 2D, 1080x1920).
   The format: pure black, a white stick figure doing one physical action over and over, a big mono counter with a
   small letter-spaced label, a hidden-progress reveal (scan line), and a gold release (light, rays, sparks).
   Every function is a pure function of its arguments, so the film can be seeked to any frame.
   Fonts (loaded by compositions/world.html): SKMono (JetBrains Mono 700), SKInter (Inter variable). */
(function () {
  const SK = {};
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const lin = (a, b, x) => clamp((x - a) / (b - a), 0, 1);
  const eio = (u) => { u = clamp(u, 0, 1); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
  const eout = (u) => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
  const ein = (u) => Math.pow(clamp(u, 0, 1), 3);
  const back = (u, k = 1.9) => { u = clamp(u, 0, 1); const c3 = k + 1; return 1 + c3 * Math.pow(u - 1, 3) + k * Math.pow(u - 1, 2); };
  function rng(seed) {
    let a = seed >>> 0;
    return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const hex = (h) => { h = h.replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
  const mixc = (a, b, u) => { const A = hex(a), B = hex(b); return `rgb(${Math.round(lerp(A[0], B[0], u))},${Math.round(lerp(A[1], B[1], u))},${Math.round(lerp(A[2], B[2], u))})`; };
  const rgba = (rgb, a) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
  SK.util = { clamp, lerp, sstep, lin, eio, eout, ein, back, rng, hex, mixc, rgba };

  /* two-bone IK: root (sx,sy) -> target, lengths l1/l2, bend +1 = joint on the clockwise side of the root->target line
     (screen coords: reaching right, +1 puts the elbow below; for legs pointing down, -1 puts the knee forward/right). */
  function ik(sx, sy, tx, ty, l1, l2, bend) {
    let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy);
    const maxd = l1 + l2 - 0.5;
    if (d > maxd) { tx = sx + (dx / d) * maxd; ty = sy + (dy / d) * maxd; dx = tx - sx; dy = ty - sy; d = maxd; }
    d = Math.max(d, Math.abs(l1 - l2) + 1);
    const a = Math.atan2(dy, dx);
    const b = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    const ang = a + bend * b;
    return { jx: sx + Math.cos(ang) * l1, jy: sy + Math.sin(ang) * l1, ex: tx, ey: ty };
  }
  SK.ik = ik;

  SK.create = function ({ canvas, width = 1080, height = 1920 }) {
    const ctx = canvas.getContext("2d");
    const W = width, H = height;
    const K = { ctx, W, H, clamp, lerp, sstep, lin, eio, eout, ein, back, rng, hex, mixc, rgba, ik };
    const fonts = ["700 88px SKMono", "700 46px SKInter", "600 26px SKInter"];
    K.ready = (document.fonts ? Promise.all(fonts.map((f) => document.fonts.load(f))) : Promise.resolve()).then(() => true);

    K.rr = function (x, y, w, h, r, c) {
      c = c || ctx; r = Math.min(r, w / 2, h / 2);
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    };
    K.clear = function (col) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = col || "#000"; ctx.fillRect(0, 0, W, H); };

    /* the floor: a hairline at y, a dark band fading to black (source: #101018 at the line, #0a0b10, black by +190 px);
       warm = 0..1 adds the release's ground glow centred on glowX */
    K.ground = function ({ y = 1330, warm = 0, glowX = 700, glowW = 520 } = {}) {
      const g = ctx.createLinearGradient(0, y, 0, y + 280);
      g.addColorStop(0, "#111219"); g.addColorStop(0.25, "#0a0b10"); g.addColorStop(0.68, "#030303"); g.addColorStop(1, "#000000");
      ctx.fillStyle = g; ctx.fillRect(0, y, W, 280);
      ctx.fillStyle = "#1a1c25"; ctx.fillRect(0, y, W, 2);
      if (warm > 0.001) {
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        ctx.beginPath(); ctx.rect(0, y, W, H - y); ctx.clip();          // an elliptical pool on the floor, no hard edges
        ctx.translate(glowX, y + 4); ctx.scale(1, 0.32);
        const r = ctx.createRadialGradient(0, 0, 10, 0, 0, glowW);
        r.addColorStop(0, `rgba(150,105,55,${0.55 * warm})`); r.addColorStop(0.45, `rgba(95,62,30,${0.32 * warm})`); r.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = r; ctx.fillRect(-glowW, -glowW, glowW * 2, glowW * 2);
        ctx.restore();
      }
    };

    /* the counter: big mono number + small letter-spaced label. gold 0..1 (white -> #f3b753), pop = extra scale,
       flash 0..1 = glow behind the digits; roll = {from, to, u} slides the old number up and the new one in */
    K.counter = function ({ n, label = "STRIKES", x = 540, y = 432, px = 88, gold = 0, pop = 0, flash = 0, roll = null, labelY = 482, a = 1 }) {
      ctx.save(); ctx.globalAlpha = a;
      const col = mixc("#f3f3f3", "#f3b753", gold);
      const drawNum = (s, dy, al) => {
        ctx.save(); ctx.globalAlpha *= al;
        ctx.translate(x, y - px * 0.36 + dy); ctx.scale(1 + pop, 1 + pop);
        ctx.font = `700 ${px}px SKMono`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        if (flash > 0.001) { ctx.shadowColor = gold > 0.5 ? `rgba(255,200,110,${0.9 * flash})` : `rgba(255,255,255,${0.8 * flash})`; ctx.shadowBlur = 34 * flash; }
        ctx.fillStyle = col; ctx.fillText(s, 0, 0);
        ctx.restore();
      };
      if (roll && roll.u > 0 && roll.u < 1) {
        const u = eio(roll.u);
        ctx.save(); ctx.beginPath(); ctx.rect(0, y - px * 1.05, W, px * 1.25); ctx.clip();
        drawNum(String(roll.from), -px * 1.1 * u, 1 - u);
        drawNum(String(roll.to), px * 1.1 * (1 - u), u);
        ctx.restore();
      } else drawNum(String(roll && roll.u >= 1 ? roll.to : n), 0, 1);
      ctx.font = "600 26px SKInter"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if ("letterSpacing" in ctx) ctx.letterSpacing = "8px";
      ctx.fillStyle = "#8a8e98"; ctx.fillText(label, x + 4, labelY);
      ctx.restore();
    };

    /* caption: Inter 700 46 px, #f3f3f3, centred; lines = array; a = alpha; rise = px offset (fades in rising) */
    K.caption = function ({ lines, a = 1, rise = 0, y = 1430, px = 46, lh = 58 }) {
      if (a <= 0.001) return;
      ctx.save(); ctx.globalAlpha = a;
      ctx.font = `700 ${px}px SKInter`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if ("letterSpacing" in ctx) ctx.letterSpacing = "-0.3px";
      ctx.fillStyle = "#f3f3f3";
      const y0 = y - ((lines.length - 1) * lh) / 2 + rise;
      lines.forEach((s, i) => ctx.fillText(s, W / 2, y0 + i * lh));
      ctx.restore();
    };

    /* the stick figure (source build): thick white capsules, round head, round feet; back limbs a cool grey; the
       front arm carries a thin dark outline so it reads over the torso. Facing right.
       p = {hip:[x,y], torso (rad, + leans right), tlen 150, headR 33, headTilt, hands:[[front],[back]], feet:[[front],[back]],
            warm 0..1 (lit by the release), a, armsOnly, arm:[l1,l2], leg:[l1,l2], lw 33} -> returns joint positions */
    K.figure = function (p) {
      const lw = p.lw || 33, tl = p.tlen || 150, hr = p.headR || 33;
      const [l1, l2] = p.arm || [110, 104];
      const [g1, g2] = p.leg || [99, 97];
      const warm = p.warm || 0;
      const front = mixc("#fbfbfb", "#feefdb", warm), backc = mixc("#c3c7cd", "#d9c8b0", warm);
      const hx = p.hip[0], hy = p.hip[1], tor = p.torso || 0;
      const sx = hx + Math.sin(tor) * tl, sy = hy - Math.cos(tor) * tl;
      const ht = tor + (p.headTilt || 0);
      const nx = sx + Math.sin(ht) * (hr + 12), ny = sy - Math.cos(ht) * (hr + 12);
      const A0 = ik(sx, sy + 4, p.hands[1][0], p.hands[1][1], l1, l2, p.bendB == null ? 1 : p.bendB);
      const A1 = ik(sx, sy + 4, p.hands[0][0], p.hands[0][1], l1, l2, p.bendF == null ? 1 : p.bendF);
      const L0 = ik(hx - 3, hy, p.feet[1][0], p.feet[1][1], g1, g2, -1);
      const L1 = ik(hx + 3, hy, p.feet[0][0], p.feet[0][1], g1, g2, -1);
      const seg = (pts, col, w, outline) => {
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        if (outline) { ctx.strokeStyle = "#0b0b0c"; ctx.lineWidth = w + 7; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.stroke(); }
        ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.stroke();
      };
      const dot = (x, y, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
      ctx.save(); ctx.globalAlpha *= p.a == null ? 1 : p.a;
      if (!p.armsOnly) {
        seg([hx - 3, hy, L0.jx, L0.jy, L0.ex, L0.ey], backc, lw - 1);
        dot(L0.ex + 6, L0.ey + 2, 19, backc);
      }
      seg([sx, sy + 4, A0.jx, A0.jy, A0.ex, A0.ey], backc, lw - 2, false);
      dot(A0.ex, A0.ey, 16, backc);
      if (!p.armsOnly) {
        seg([hx, hy + 6, sx, sy], front, lw + 6);
        dot(nx, ny, hr, front);
        seg([hx + 3, hy, L1.jx, L1.jy, L1.ex, L1.ey], front, lw);
        dot(L1.ex + 6, L1.ey + 2, 19, front);
      }
      seg([sx, sy + 4, A1.jx, A1.jy, A1.ex, A1.ey], front, lw - 1, true);
      dot(A1.ex, A1.ey, 17, front);
      ctx.restore();
      return { shoulder: [sx, sy], head: [nx, ny], hands: [[A1.ex, A1.ey], [A0.ex, A0.ey]], elbows: [[A1.jx, A1.jy], [A0.jx, A0.jy]] };
    };

    /* soft radial glow, additive */
    K.glow = function (x, y, r, rgb, a) {
      if (a <= 0.001) return;
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(rgb, a)); g.addColorStop(0.35, rgba(rgb, a * 0.45)); g.addColorStop(1, rgba(rgb, 0));
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.restore();
    };

    /* god rays fanning from (x,y): n soft wedges between angles a0..a1 (rad, screen), each slowly breathing with t */
    K.rays = function ({ x, y, k, t = 0, n = 9, a0 = -2.75, a1 = -0.35, len = 1500, width = 0.07, rgb = [255, 196, 110], seed = 3 }) {
      if (k <= 0.001) return;
      const r = rng(seed);
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < n; i++) {
        const u = n === 1 ? 0.5 : i / (n - 1);
        const ang = lerp(a0, a1, u) + (r() - 0.5) * 0.12 + Math.sin(t * 0.6 + i * 1.7) * 0.012;
        const w = width * (0.6 + r() * 0.8);
        const al = k * (0.10 + r() * 0.10) * (0.85 + 0.15 * Math.sin(t * 1.3 + i * 2.1));
        const L = len * (0.7 + r() * 0.4);
        const g = ctx.createRadialGradient(x, y, 0, x, y, L);
        g.addColorStop(0, rgba(rgb, al)); g.addColorStop(0.5, rgba(rgb, al * 0.45)); g.addColorStop(1, rgba(rgb, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.arc(x, y, L, ang - w, ang + w); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    };

    /* horizontal scan line (the hidden-progress reveal): a bright core with a cyan bloom, clipped by the caller */
    K.scan = function ({ y, x0, x1, a = 1 }) {
      if (a <= 0.001) return;
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const g = ctx.createLinearGradient(0, y - 26, 0, y + 26);
      g.addColorStop(0, "rgba(120,190,255,0)"); g.addColorStop(0.5, `rgba(150,210,255,${0.35 * a})`); g.addColorStop(1, "rgba(120,190,255,0)");
      ctx.fillStyle = g; ctx.fillRect(x0, y - 26, x1 - x0, 52);
      ctx.fillStyle = `rgba(225,242,255,${0.95 * a})`; ctx.fillRect(x0, y - 1.5, x1 - x0, 3);
      ctx.restore();
    };

    /* particles from events: list of {t0, x, y, vx, vy, g, life, kind: "spark"|"flake"|"chip", size, rot, seed};
       floorY stops falling bits. Drawn only while alive. */
    K.particles = function (list, t, floorY = 1330) {
      ctx.save();
      for (const p of list) {
        const age = t - p.t0;
        if (age < 0 || age > p.life) continue;
        const u = age / p.life;
        let x = p.x + p.vx * age, y = p.y + p.vy * age + 0.5 * (p.g || 0) * age * age;
        if (y > floorY - 2) y = floorY - 2;
        if (p.kind === "spark") {
          const vx = p.vx, vy = p.vy + (p.g || 0) * age, sp = Math.hypot(vx, vy) || 1;
          const L = (p.size || 18) * (1 - u * 0.6);
          ctx.globalCompositeOperation = "lighter";
          ctx.strokeStyle = `rgba(255,${190 + Math.round(50 * (1 - u))},120,${(1 - u) * 0.95})`;
          ctx.lineWidth = 2.6; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - (vx / sp) * L, y - (vy / sp) * L); ctx.stroke();
        } else {
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 1 - sstep(0.6, 1, u);
          ctx.fillStyle = p.col || "#7a4320";
          ctx.save(); ctx.translate(x, y); ctx.rotate((p.rot || 0) + age * (p.spin || 4));
          const s = p.size || 6;
          ctx.beginPath(); ctx.moveTo(-s, -s * 0.5); ctx.lineTo(s * 0.7, -s * 0.8); ctx.lineTo(s, s * 0.4); ctx.lineTo(-s * 0.4, s * 0.8); ctx.closePath(); ctx.fill();
          ctx.restore(); ctx.globalAlpha = 1;
        }
      }
      ctx.restore();
    };

    K.flash = function (rgb, a) { if (a <= 0.001) return; ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = rgba(rgb, a); ctx.fillRect(0, 0, W, H); ctx.restore(); };
    return K;
  };
  window.SK = SK;
})();

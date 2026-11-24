/* guardian-overlay.js — the 2-D layer over the plate: holographic rule cards with animated abstract icons, the top
 * countdown counter, word-synced captions, the typed opening question, "NOW" in blue light and the end card.
 * Everything is a pure function of time. GOV.draw(ctx, F, t, shot) where F = window.FILM (from tools/timeline.py).
 * Icons are abstract (never human figures): GOV.ICONS[name](ctx, cx, cy, size, u, t), u = progress 0..1.
 */
(function () {
  "use strict";
  const FONT = '"MontserratGD", "Montserrat", "Arial Black", sans-serif';
  const CY = "#6fe8ff", CYB = "rgba(111,232,255,", WHITE = "#ffffff", WARM = "#fff0d8", GOLD = "#ffc46b";
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const sm = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const easeOut = (u) => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
  const easeBack = (u) => { u = clamp(u, 0, 1); const c = 1.70158; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  function glowStroke(ctx, w, col, blur) { ctx.lineWidth = w; ctx.strokeStyle = col; ctx.shadowColor = col; ctx.shadowBlur = blur; ctx.stroke(); ctx.shadowBlur = 0; }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  // ------------------------------------------------------------------ icons (abstract, line-drawn, animated)
  const ICONS = {
    steps(ctx, cx, cy, s, u, t) {          // ten glowing steps light one by one
      const n = 10, sw = s * 0.085, sh = s * 0.072, x0 = cx - n * sw / 2, y0 = cy + n * sh / 2;
      const lit = u * 1.25 * n;
      for (let i = 0; i < n; i++) {
        const x = x0 + i * sw, y = y0 - (i + 1) * sh;
        const on = clamp(lit - i, 0, 1);
        ctx.beginPath(); ctx.moveTo(x, y + sh); ctx.lineTo(x, y); ctx.lineTo(x + sw, y);
        glowStroke(ctx, 3, on > 0.5 ? "#ffe9b0" : CYB + "0.55)", on > 0.5 ? 14 : 6);
        if (on > 0) { ctx.fillStyle = `rgba(255,214,140,${0.55 * on})`; ctx.fillRect(x + 2, y + 2, sw - 3, sh * (i + 1) - 2); }
      }
      // an orb hopping up the lit steps
      const k = clamp(Math.floor(lit), 0, n - 1), f = clamp(lit - Math.floor(lit), 0, 1);
      const ox = x0 + (k + 0.5 + f) * sw, oy = y0 - (k + 1) * sh - s * 0.05 - Math.sin(f * Math.PI) * s * 0.06;
      ctx.beginPath(); ctx.arc(Math.min(ox, x0 + n * sw - sw * 0.5), oy, s * 0.035, 0, 7); ctx.fillStyle = "#fff6dc"; ctx.shadowColor = "#ffd27a"; ctx.shadowBlur = 20; ctx.fill(); ctx.shadowBlur = 0;
    },
    flames(ctx, cx, cy, s, u, t) {         // two small flames lean together and grow brighter
      const lean = 0.08 + 0.32 * easeOut(u * 1.3), gap = s * (0.2 - 0.09 * easeOut(u * 1.2)), br = 0.45 + 0.55 * easeOut(u * 1.4);
      [-1, 1].forEach((sd, i) => {
        ctx.save(); ctx.translate(cx + sd * gap, cy + s * 0.22); ctx.rotate(-sd * lean);
        const fl = 1 + 0.06 * Math.sin(t * 13 + i * 2) + 0.04 * Math.sin(t * 21 + i);
        const hgt = s * (0.36 + 0.1 * br) * fl, wd = s * 0.13;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-wd * 1.4, -hgt * 0.35, -wd * 0.3, -hgt * 0.75, 0, -hgt);
        ctx.bezierCurveTo(wd * 0.3, -hgt * 0.75, wd * 1.4, -hgt * 0.35, 0, 0);
        const g = ctx.createLinearGradient(0, 0, 0, -hgt); g.addColorStop(0, `rgba(255,190,90,${0.8 * br})`); g.addColorStop(1, `rgba(120,230,255,${0.55 * br})`);
        ctx.fillStyle = g; ctx.shadowColor = "#ffb85a"; ctx.shadowBlur = 26 * br; ctx.fill(); ctx.shadowBlur = 0;
        glowStroke(ctx, 2.5, `rgba(255,240,210,${0.7 + 0.3 * br})`, 10);
        ctx.restore();
      });
      ctx.beginPath(); ctx.moveTo(cx - s * 0.36, cy + s * 0.24); ctx.lineTo(cx + s * 0.36, cy + s * 0.24); glowStroke(ctx, 2, CYB + "0.5)", 6);
    },
    moon_bubble(ctx, cx, cy, s, u, t) {    // a crescent moon over a closed speech bubble
      const mx = cx + s * 0.16, my = cy - s * 0.2, r = s * 0.17;
      ctx.save(); ctx.beginPath(); ctx.arc(mx, my, r, 0, 7); ctx.arc(mx + r * 0.45, my - r * 0.25, r * 0.86, 0, 7, true);
      ctx.fillStyle = "rgba(255,236,190,0.92)"; ctx.shadowColor = "#ffe0a0"; ctx.shadowBlur = 22; ctx.fill("evenodd"); ctx.restore(); ctx.shadowBlur = 0;
      for (let i = 0; i < 5; i++) {
        const sx = cx + (hash(i + 3) - 0.5) * s * 0.8, sy = cy - s * 0.38 + hash(i + 9) * s * 0.3, a = 0.3 + 0.7 * Math.abs(Math.sin(t * 1.7 + i * 1.3));
        ctx.beginPath(); ctx.arc(sx, sy, 2.2, 0, 7); ctx.fillStyle = `rgba(200,240,255,${a})`; ctx.fill();
      }
      const bx = cx - s * 0.08, by = cy + s * 0.16, bw = s * 0.5, bh = s * 0.28;
      rr(ctx, bx - bw / 2, by - bh / 2, bw, bh, bh * 0.45); ctx.moveTo(bx - bw * 0.18, by + bh / 2); ctx.lineTo(bx - bw * 0.3, by + bh / 2 + s * 0.09); ctx.lineTo(bx - bw * 0.02, by + bh / 2);
      ctx.fillStyle = "rgba(20,50,90,0.6)"; ctx.fill(); glowStroke(ctx, 3, CY, 12);
      // the words inside fade, then a calm closed line (waiting one night)
      const close = sm(0.25, 0.6, u);
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(bx - bw * 0.2 + i * bw * 0.2, by, 4.5, 0, 7); ctx.fillStyle = `rgba(160,235,255,${0.9 * (1 - close)})`; ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(bx - bw * 0.28 * close, by); ctx.lineTo(bx + bw * 0.28 * close, by); glowStroke(ctx, 3.5, `rgba(255,240,200,${close})`, 10);
    },
    question_door(ctx, cx, cy, s, u, t) {  // a "?" that opens into a door of light
      const op = sm(0.3, 0.75, u);
      const dw = s * 0.34, dh = s * 0.6, dx = cx - dw / 2, dy = cy - dh / 2 + s * 0.04;
      // light spilling
      ctx.save(); ctx.globalAlpha = op;
      const g = ctx.createLinearGradient(cx, dy, cx, dy + dh + s * 0.25); g.addColorStop(0, "rgba(255,240,200,0.95)"); g.addColorStop(1, "rgba(255,200,120,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(dx, dy + dh); ctx.lineTo(dx + dw, dy + dh); ctx.lineTo(dx + dw + s * 0.22, dy + dh + s * 0.22); ctx.lineTo(dx - s * 0.22, dy + dh + s * 0.22); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,244,214,0.95)"; ctx.shadowColor = "#ffdc9a"; ctx.shadowBlur = 30; ctx.fillRect(dx + 3, dy + 3, dw - 6, dh - 6); ctx.shadowBlur = 0;
      // the door leaf swinging open (a narrowing panel)
      const leaf = dw * (1 - op * 0.82);
      ctx.fillStyle = "rgba(16,48,92,0.92)"; ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + leaf, dy + dh * 0.05 * op); ctx.lineTo(dx + leaf, dy + dh - dh * 0.05 * op); ctx.lineTo(dx, dy + dh); ctx.closePath(); ctx.fill();
      ctx.restore();
      rr(ctx, dx, dy, dw, dh, 6); glowStroke(ctx, 3.5, CY, 12);
      // the question mark, fading as the door opens
      ctx.save(); ctx.globalAlpha = 1 - op * 0.85; ctx.font = `900 ${Math.round(s * 0.5)}px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#dff8ff"; ctx.shadowColor = CY; ctx.shadowBlur = 20; ctx.fillText("?", cx, cy + s * 0.03); ctx.restore(); ctx.shadowBlur = 0;
    },
    heartbeat_path(ctx, cx, cy, s, u, t) { // a heartbeat line steadying into a straight path
      const x0 = cx - s * 0.5, x1 = cx + s * 0.12, y = cy - s * 0.02, prog = clamp(u * 1.35, 0, 1);
      ctx.beginPath(); ctx.moveTo(x0, y);
      const N = 120;
      for (let i = 1; i <= N * prog; i++) {
        const f = i / N, x = x0 + (x1 - x0) * f;
        const amp = s * 0.3 * Math.pow(1 - f, 1.4);
        const ph = (f * 5) % 1; const spike = ph > 0.42 && ph < 0.58 ? Math.sin((ph - 0.42) / 0.16 * Math.PI * 2) : 0;
        ctx.lineTo(x, y - spike * amp);
      }
      glowStroke(ctx, 3.5, CY, 14);
      // the path to the horizon
      const pv = sm(0.55, 0.9, u);
      if (pv > 0) {
        ctx.save(); ctx.globalAlpha = pv;
        const hx = cx + s * 0.48, hy = cy - s * 0.16;
        ctx.beginPath(); ctx.moveTo(x1, y - s * 0.06); ctx.lineTo(hx, hy); ctx.moveTo(x1, y + s * 0.06); ctx.lineTo(hx, hy + 2); glowStroke(ctx, 2.5, "#ffe2a8", 10);
        for (let k = 0; k < 4; k++) { const f = ((t * 0.6 + k / 4) % 1); const xa = x1 + (hx - x1) * f, ya = y + (hy - y) * f; ctx.beginPath(); ctx.arc(xa, ya, 3 * (1 - f) + 1, 0, 7); ctx.fillStyle = "rgba(255,230,180,0.9)"; ctx.fill(); }
        ctx.beginPath(); ctx.arc(hx, hy, 6, 0, 7); ctx.fillStyle = "#fff4d6"; ctx.shadowColor = "#ffd27a"; ctx.shadowBlur = 18; ctx.fill(); ctx.shadowBlur = 0;
        ctx.restore();
      }
    },
    ring_mend(ctx, cx, cy, s, u, t) {      // a cracked ring mending with light
      const R = s * 0.3, heal = sm(0.15, 0.8, u), gap = 0.42 * (1 - heal);
      ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2 + gap, -Math.PI / 2 - gap + Math.PI * 2); glowStroke(ctx, 9, "rgba(111,232,255,0.85)", 14);
      // the crack: a zigzag across the gap
      const a0 = -Math.PI / 2 - gap, a1 = -Math.PI / 2 + gap;
      if (gap > 0.01) {
        ctx.beginPath();
        for (let i = 0; i <= 6; i++) { const a = a0 + (a1 - a0) * i / 6, rr2 = R + (i % 2 ? 7 : -7) * (1 - heal); const x = cx + Math.cos(a) * rr2, y2 = cy + Math.sin(a) * rr2; i ? ctx.lineTo(x, y2) : ctx.moveTo(x, y2); }
        glowStroke(ctx, 2, `rgba(255,220,150,${0.4 + 0.6 * heal})`, 10);
      }
      // gold light running along the seam
      const run = sm(0.5, 1, u);
      ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2 - 0.3 - run * Math.PI, -Math.PI / 2 + 0.3 + run * Math.PI); glowStroke(ctx, 5, `rgba(255,214,140,${0.25 + 0.75 * heal})`, 20);
      for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (hash(i) - 0.5) * 0.9, d = R + (hash(i + 5) - 0.5) * 30 * heal; const tw = Math.abs(Math.sin(t * 3 + i)); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 2 + 2 * tw, 0, 7); ctx.fillStyle = `rgba(255,235,190,${heal * tw})`; ctx.fill(); }
    },
    progress_ring(ctx, cx, cy, s, u, t) {  // a progress ring closing to 100 %
      const R = s * 0.3, p = clamp(easeOut(u * 1.25), 0, 1);
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); glowStroke(ctx, 8, "rgba(111,232,255,0.18)", 0);
      ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); glowStroke(ctx, 9, p >= 0.999 ? "#ffe2a8" : CY, 16);
      ctx.font = `900 ${Math.round(s * 0.17)}px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = p >= 0.999 ? "#fff1d0" : "#dff8ff";
      ctx.shadowColor = p >= 0.999 ? "#ffcf7a" : CY; ctx.shadowBlur = 14; ctx.fillText(Math.round(p * 100) + "%", cx, cy + 2); ctx.shadowBlur = 0;
      if (p >= 0.999) { const k = clamp((u * 1.25 - 1) * 4, 0, 1); ctx.beginPath(); ctx.arc(cx, cy, R + 12 + 30 * k, 0, 7); glowStroke(ctx, 3, `rgba(255,226,168,${1 - k})`, 12); }
    },
    seed(ctx, cx, cy, s0, u, t) {          // a seed sprouting
      const s = s0 * 1.25; cy += s0 * 0.06;
      const gy = cy + s * 0.26, g = sm(0.1, 0.8, u), lf = sm(0.45, 0.95, u);
      ctx.beginPath(); ctx.moveTo(cx - s * 0.36, gy); ctx.quadraticCurveTo(cx, gy - 8, cx + s * 0.36, gy); glowStroke(ctx, 3, "rgba(255,206,140,0.7)", 8);
      ctx.beginPath(); ctx.ellipse(cx, gy + 4, s * 0.06, s * 0.04, -0.3, 0, 7); ctx.fillStyle = "rgba(255,200,120,0.85)"; ctx.fill();
      const top = gy - s * 0.42 * g, sway = Math.sin(t * 1.6) * s * 0.02 * g;
      ctx.beginPath(); ctx.moveTo(cx, gy); ctx.quadraticCurveTo(cx - s * 0.05, gy - s * 0.2 * g, cx + sway, top); glowStroke(ctx, 4, "#9ff3c8", 12);
      [-1, 1].forEach((sd) => {
        if (lf <= 0) return;
        ctx.save(); ctx.translate(cx + sway, top + s * 0.04); ctx.rotate(sd * (0.5 + 0.5 * (1 - lf))); ctx.scale(lf, lf);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(sd * s * 0.12, -s * 0.1, sd * s * 0.2, -s * 0.02); ctx.quadraticCurveTo(sd * s * 0.1, s * 0.04, 0, 0);
        ctx.fillStyle = "rgba(140,240,190,0.55)"; ctx.fill(); glowStroke(ctx, 2.5, "#bff8dc", 10); ctx.restore();
      });
    },
    mirror(ctx, cx, cy, s, u, t) {         // an empty mirror frame, glowing
      const rx = s * 0.2, ry = s * 0.3, on = sm(0, 0.4, u);
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); ctx.fillStyle = "rgba(8,24,52,0.75)"; ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, rx - 4, ry - 4, 0, 0, 7); ctx.clip();
      const sx = cx - rx * 2 + ((t * 0.35) % 1) * rx * 4;
      const g = ctx.createLinearGradient(sx - 40, cy - ry, sx + 40, cy + ry); g.addColorStop(0, "rgba(160,235,255,0)"); g.addColorStop(0.5, `rgba(200,245,255,${0.35 * on})`); g.addColorStop(1, "rgba(160,235,255,0)");
      ctx.fillStyle = g; ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2); ctx.restore();
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); glowStroke(ctx, 4, CY, 16 + 10 * on);
      ctx.beginPath(); ctx.ellipse(cx, cy, rx + 10, ry + 10, 0, 0, 7); glowStroke(ctx, 2, `rgba(255,214,140,${0.4 + 0.5 * on})`, 10);
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * (rx + 10), cy + Math.sin(a) * (ry + 10), 4, 0, 7); ctx.fillStyle = "#ffe2a8"; ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(cx, cy + ry + 10); ctx.lineTo(cx, cy + ry + s * 0.08); ctx.moveTo(cx - s * 0.1, cy + ry + s * 0.08); ctx.lineTo(cx + s * 0.1, cy + ry + s * 0.08); glowStroke(ctx, 3, CYB + "0.7)", 8);
    },
    clock_stop(ctx, cx, cy, s, u, t) {     // a clock whose hands spin, then stop at the top
      const R = s * 0.3;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fillStyle = "rgba(8,24,52,0.6)"; ctx.fill(); glowStroke(ctx, 4, CY, 14);
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ctx.beginPath(); ctx.moveTo(cx + Math.sin(a) * R * 0.82, cy - Math.cos(a) * R * 0.82); ctx.lineTo(cx + Math.sin(a) * R * 0.94, cy - Math.cos(a) * R * 0.94); glowStroke(ctx, i % 3 ? 2 : 4, CYB + "0.8)", 4); }
      const stop = 0.35, f = clamp(u / stop, 0, 1), spin = (1 - Math.pow(1 - f, 3)) * Math.PI * 6;
      const am = spin, ah = spin / 12;
      [[am, R * 0.78, 3.5], [ah, R * 0.5, 6]].forEach(([a, l, w]) => { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(a) * l, cy - Math.cos(a) * l); glowStroke(ctx, w, "#ffe2a8", 12); });
      ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 7); ctx.fillStyle = "#ffe2a8"; ctx.fill();
      const k = sm(stop, stop + 0.2, u); if (k > 0) { ctx.beginPath(); ctx.arc(cx, cy - R, 7 + 4 * Math.sin(t * 6), 0, 7); ctx.fillStyle = `rgba(255,240,200,${k})`; ctx.shadowColor = "#ffd27a"; ctx.shadowBlur = 24; ctx.fill(); ctx.shadowBlur = 0; }
    },
    // ---- generic icons for future episodes
    hourglass(ctx, cx, cy, s, u, t) {
      const w = s * 0.22, h = s * 0.32, fl = clamp(u, 0, 1);
      ctx.beginPath(); ctx.moveTo(cx - w, cy - h); ctx.lineTo(cx + w, cy - h); ctx.lineTo(cx + 4, cy); ctx.lineTo(cx + w, cy + h); ctx.lineTo(cx - w, cy + h); ctx.lineTo(cx - 4, cy); ctx.closePath(); glowStroke(ctx, 3.5, CY, 12);
      ctx.fillStyle = "rgba(255,214,140,0.85)";
      ctx.beginPath(); const tt = (1 - fl) * h * 0.85; ctx.moveTo(cx - w * tt / h, cy - tt); ctx.lineTo(cx + w * tt / h, cy - tt); ctx.lineTo(cx, cy - 2); ctx.closePath(); ctx.fill();
      ctx.beginPath(); const bb = fl * h * 0.85; ctx.moveTo(cx - w, cy + h - 2); ctx.lineTo(cx + w, cy + h - 2); ctx.lineTo(cx + w * (1 - bb / h), cy + h - bb); ctx.lineTo(cx - w * (1 - bb / h), cy + h - bb); ctx.closePath(); ctx.fill();
      if (fl < 1) { ctx.fillRect(cx - 1.5, cy, 3, h * 0.9); }
    },
    key(ctx, cx, cy, s, u, t) {
      const r = s * 0.12, a = -0.2 + 0.4 * sm(0.3, 0.8, u);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
      ctx.beginPath(); ctx.arc(-s * 0.18, 0, r, 0, 7); ctx.moveTo(-s * 0.18 + r, 0); ctx.lineTo(s * 0.3, 0); ctx.moveTo(s * 0.2, 0); ctx.lineTo(s * 0.2, s * 0.09); ctx.moveTo(s * 0.28, 0); ctx.lineTo(s * 0.28, s * 0.07);
      glowStroke(ctx, 5, "#ffe2a8", 16); ctx.restore();
    },
    compass(ctx, cx, cy, s, u, t) {
      const R = s * 0.3, a = Math.sin(t * 2) * 0.6 * (1 - sm(0.2, 0.8, u)) + 0.4;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); glowStroke(ctx, 4, CY, 12);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(0, -R * 0.8); ctx.lineTo(R * 0.14, 0); ctx.lineTo(0, R * 0.8); ctx.lineTo(-R * 0.14, 0); ctx.closePath(); ctx.fillStyle = "rgba(255,214,140,0.8)"; ctx.fill(); ctx.restore();
    },
    heart(ctx, cx, cy, s, u, t) {
      const k = 1 + 0.06 * Math.sin(t * 6) * sm(0.2, 0.6, u), w = s * 0.3 * k;
      ctx.beginPath(); ctx.moveTo(cx, cy + w * 0.9); ctx.bezierCurveTo(cx - w * 1.4, cy - w * 0.1, cx - w * 0.6, cy - w * 1.1, cx, cy - w * 0.35);
      ctx.bezierCurveTo(cx + w * 0.6, cy - w * 1.1, cx + w * 1.4, cy - w * 0.1, cx, cy + w * 0.9); ctx.fillStyle = `rgba(255,170,140,${0.3 + 0.4 * u})`; ctx.fill(); glowStroke(ctx, 4, "#ffd2b0", 16);
    },
    mountain(ctx, cx, cy, s, u, t) {
      ctx.beginPath(); ctx.moveTo(cx - s * 0.4, cy + s * 0.25); ctx.lineTo(cx - s * 0.08, cy - s * 0.25); ctx.lineTo(cx + s * 0.1, cy); ctx.lineTo(cx + s * 0.2, cy - s * 0.12); ctx.lineTo(cx + s * 0.4, cy + s * 0.25); glowStroke(ctx, 4, CY, 12);
      const p = sm(0.2, 0.9, u); ctx.beginPath(); ctx.arc(cx - s * 0.4 + (s * 0.32) * p, cy + s * 0.25 - s * 0.5 * p, 6, 0, 7); ctx.fillStyle = "#ffe2a8"; ctx.shadowColor = "#ffd27a"; ctx.shadowBlur = 16; ctx.fill(); ctx.shadowBlur = 0;
    },
    bulb(ctx, cx, cy, s, u, t) {
      const on = sm(0.3, 0.6, u), R = s * 0.2;
      ctx.beginPath(); ctx.arc(cx, cy - s * 0.06, R, Math.PI * 0.8, Math.PI * 2.2); ctx.lineTo(cx + R * 0.45, cy + s * 0.18); ctx.lineTo(cx - R * 0.45, cy + s * 0.18); ctx.closePath();
      ctx.fillStyle = `rgba(255,226,160,${0.8 * on})`; ctx.shadowColor = "#ffd27a"; ctx.shadowBlur = 40 * on; ctx.fill(); ctx.shadowBlur = 0; glowStroke(ctx, 3.5, on > 0.5 ? "#fff0c8" : CY, 12);
      ctx.beginPath(); ctx.moveTo(cx - R * 0.4, cy + s * 0.23); ctx.lineTo(cx + R * 0.4, cy + s * 0.23); ctx.moveTo(cx - R * 0.3, cy + s * 0.28); ctx.lineTo(cx + R * 0.3, cy + s * 0.28); glowStroke(ctx, 3, CY, 6);
    },
  };

  // ------------------------------------------------------------------ the holographic card
  function circuitCorner(ctx, x, y, sx, sy, a) {
    ctx.beginPath(); ctx.moveTo(x + sx * 4, y + sy * 46); ctx.lineTo(x + sx * 4, y + sy * 18); ctx.lineTo(x + sx * 18, y + sy * 4); ctx.lineTo(x + sx * 70, y + sy * 4);
    ctx.lineTo(x + sx * 80, y + sy * 14); ctx.lineTo(x + sx * 118, y + sy * 14);
    glowStroke(ctx, 2.5, `rgba(120,236,255,${a})`, 10);
    ctx.beginPath(); ctx.arc(x + sx * 124, y + sy * 14, 4.5, 0, 7); glowStroke(ctx, 2, `rgba(120,236,255,${a})`, 8);
    ctx.beginPath(); // hexagon node like the cloak's
    const hx = x + sx * 4, hy = y + sy * 54; for (let i = 0; i < 6; i++) { const an = i * Math.PI / 3; const px = hx + Math.cos(an) * 6, py = hy + Math.sin(an) * 6; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath();
    glowStroke(ctx, 2, `rgba(120,236,255,${a})`, 8);
  }
  function wrapLines(ctx, text, maxW) {
    const words = text.split(/\s+/), lines = []; let cur = "";
    words.forEach((w) => { const tr = cur ? cur + " " + w : w; if (ctx.measureText(tr).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tr; });
    if (cur) lines.push(cur); return lines;
  }
  function card(ctx, c, t, frame) {
    const tin = clamp((t - c.t0) / 0.42, 0, 1), tout = clamp((c.t1 - t) / 0.28, 0, 1);
    if (tin <= 0 || tout <= 0) return;
    const [x, y, w, h] = c.zone;
    const boot = easeBack(tin), vis = Math.min(1, tin * 2.2) * tout;
    // hologram flicker in the first frames
    const fl = tin < 1 ? (hash(frame * 1.7 + c.n) > 0.35 ? 1 : 0.45) : 1;
    ctx.save();
    ctx.globalAlpha = vis * fl;
    const cx = x + w / 2, cyy = y + h / 2;
    ctx.translate(cx, cyy); ctx.scale(1 - 0.06 * (1 - tout), Math.max(0.03, boot) * (0.7 + 0.3 * tout)); ctx.translate(-cx, -cyy);
    // panel
    rr(ctx, x, y, w, h, 22);
    const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, "rgba(14,44,96,0.66)"); g.addColorStop(1, "rgba(6,18,44,0.78)");
    ctx.fillStyle = g; ctx.fill();
    rr(ctx, x, y, w, h, 22); glowStroke(ctx, 2.6, "rgba(120,236,255,0.95)", 22);
    rr(ctx, x + 9, y + 9, w - 18, h - 18, 15); glowStroke(ctx, 1, "rgba(120,236,255,0.28)", 0);
    // scanlines + a travelling scan band
    ctx.save(); rr(ctx, x, y, w, h, 22); ctx.clip();
    ctx.fillStyle = "rgba(140,230,255,0.045)"; for (let yy = y; yy < y + h; yy += 4) ctx.fillRect(x, yy, w, 1);
    const band = y + ((t - c.t0) * 0.55 % 1) * (h + 120) - 60;
    const bg = ctx.createLinearGradient(0, band - 50, 0, band + 50); bg.addColorStop(0, "rgba(140,230,255,0)"); bg.addColorStop(0.5, "rgba(140,230,255,0.10)"); bg.addColorStop(1, "rgba(140,230,255,0)");
    ctx.fillStyle = bg; ctx.fillRect(x, band - 50, w, 100); ctx.restore();
    // corner circuitry (matches the cloak lines)
    circuitCorner(ctx, x, y, 1, 1, 0.9); circuitCorner(ctx, x + w, y + h, -1, -1, 0.9);
    // numeral + title + icon: three layouts by the zone's shape
    const row = w / h >= 1.7;               // icon on the right, text on the left
    const wide = !row && w >= 540;
    const numS = row ? 116 : wide ? 132 : 108;
    ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
    ctx.font = `900 ${numS}px ${FONT}`;
    const numTxt = String(c.n);
    const nx = x + 32, ny = y + 30 + numS * 0.74;
    ctx.fillStyle = "#e9fbff"; ctx.shadowColor = CY; ctx.shadowBlur = 26; ctx.fillText(numTxt, nx, ny); ctx.shadowBlur = 0;
    const nw = ctx.measureText(numTxt).width;
    const textR = row ? x + w * 0.58 : x + w - 30;
    let tx, tmax, ts, lines, lh, ty0;
    const chars = Math.floor(clamp((t - c.t0 - 0.18) / 0.5, 0, 1) * c.title.length + 0.001);
    if (row) {                               // title under the numeral, in the left column
      tx = nx; tmax = textR - tx; ts = 38; ctx.font = `800 ${ts}px ${FONT}`;
      lines = wrapLines(ctx, c.title.toUpperCase(), tmax);
      const widest = () => Math.max(...lines.map((l) => ctx.measureText(l).width));
      while ((lines.length > 3 || widest() > tmax) && ts > 22) { ts -= 2; ctx.font = `800 ${ts}px ${FONT}`; lines = wrapLines(ctx, c.title.toUpperCase(), tmax); }
      lh = ts * 1.12; ty0 = ny + 14 + ts;
    } else {                                 // title beside the numeral
      tx = nx + nw + 24; tmax = textR - tx; ts = wide ? 40 : 35; ctx.font = `800 ${ts}px ${FONT}`;
      lines = wrapLines(ctx, c.title.toUpperCase(), tmax);
      const widest = () => Math.max(...lines.map((l) => ctx.measureText(l).width));
      while ((lines.length > 3 || widest() > tmax) && ts > 22) { ts -= 2; ctx.font = `800 ${ts}px ${FONT}`; lines = wrapLines(ctx, c.title.toUpperCase(), tmax); }
      lh = ts * 1.12; ty0 = y + 30 + numS * 0.37 - (lines.length - 1) * lh / 2 + ts * 0.36;
    }
    let left = chars;
    ctx.fillStyle = WHITE; ctx.shadowColor = "rgba(111,232,255,0.6)"; ctx.shadowBlur = 10;
    lines.forEach((ln, i) => { const s2 = ln.slice(0, Math.max(0, left)); left -= ln.length + 1; ctx.fillText(s2, tx, ty0 + i * lh); });
    ctx.shadowBlur = 0;
    let icx, icy, isz;
    if (row) {
      const sx = x + w * 0.6;
      ctx.beginPath(); ctx.moveTo(sx, y + 28); ctx.lineTo(sx, y + h - 28); glowStroke(ctx, 1.4, "rgba(120,236,255,0.45)", 4);
      isz = Math.min(h - 40, x + w - sx - 20) * 1.08; icx = (sx + x + w) / 2; icy = y + h / 2;
    } else {
      const sepY = y + 30 + numS * 0.9 + (lines.length > 2 && !wide ? 10 : 0);
      ctx.beginPath(); ctx.moveTo(x + 32, sepY); ctx.lineTo(x + w - 32, sepY); glowStroke(ctx, 1.4, "rgba(120,236,255,0.45)", 4);
      const iconTop = sepY + 8, iconH = y + h - 18 - iconTop;
      isz = Math.min(iconH * 1.12, w * 0.74); icx = x + w / 2; icy = iconTop + iconH / 2;
    }
    const iu = clamp((t - c.t0 - 0.25) / Math.max(0.6, c.t1 - c.t0 - 0.5), 0, 1);
    const fn = ICONS[c.icon] || ICONS.compass;
    ctx.save(); fn(ctx, icx, icy, isz, iu, t); ctx.restore();
    ctx.restore();
  }

  // ------------------------------------------------------------------ counter (top)
  function counter(ctx, F, t, shot) {
    const C = F.counter; if (!C || t < C.t0 || t > C.t1 + 0.4) return;
    if (shot && shot.counter === false) return;     // hidden on face close-ups (it would sit on a forehead or the hood)
    const vis = sm(C.t0, C.t0 + 0.35, t) * (1 - sm(C.t1, C.t1 + 0.4, t));
    let cur = C.ticks[0], prev = null;
    for (let i = 0; i < C.ticks.length; i++) if (t >= C.ticks[i].t) { prev = i ? C.ticks[i - 1] : null; cur = C.ticks[i]; }
    const since = t - cur.t, k = clamp(since / 0.3, 0, 1);
    const x = (shot && shot.counterX) || 540, y = C.y || 300, R = 66;
    ctx.save(); ctx.globalAlpha = vis;
    // backing disc
    ctx.beginPath(); ctx.arc(x, y, R + 14, 0, 7); ctx.fillStyle = "rgba(6,20,48,0.55)"; ctx.fill();
    // one segment per rule (ten by default): the remaining ones lit
    const NS = C.total || 10, seg = 2 * Math.PI / NS;
    for (let i = 0; i < NS; i++) {
      const a0 = -Math.PI / 2 + i * seg + 0.05, a1 = a0 + seg - 0.1;
      const lit = i < cur.n;
      ctx.beginPath(); ctx.arc(x, y, R, a0, a1);
      glowStroke(ctx, lit ? 6 : 3, lit ? (cur.n === 1 ? "#ffe2a8" : CY) : "rgba(111,232,255,0.18)", lit ? 14 : 0);
    }
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    if (prev && k < 1) { ctx.save(); ctx.globalAlpha = vis * (1 - k); ctx.font = `900 ${Math.round(74 * (1 + 0.5 * k))}px ${FONT}`; ctx.fillStyle = "#e9fbff"; ctx.fillText(String(prev.n), x, y + 3 - 30 * k); ctx.restore(); }
    ctx.globalAlpha = vis * (prev ? k : 1);
    ctx.font = `900 ${Math.round(74 * (prev ? (0.7 + 0.3 * easeBack(k)) : 1))}px ${FONT}`;
    ctx.fillStyle = cur.n === 1 ? "#fff1d0" : "#e9fbff"; ctx.shadowColor = cur.n === 1 ? "#ffcf7a" : CY; ctx.shadowBlur = 24 + 30 * (1 - k);
    ctx.fillText(String(cur.n), x, y + 4); ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ------------------------------------------------------------------ captions (word-synced)
  function captions(ctx, F, t, shot) {
    const caps = F.captions; let c = null;
    for (let i = 0; i < caps.length; i++) if (t >= caps[i].t0 && t < caps[i].t1) { c = caps[i]; break; }
    if (!c) return;
    const y = (shot && shot.capY) || F.capY || 1420;
    const size = c.size || 72;
    ctx.save(); ctx.font = `800 ${size}px ${FONT}`; ctx.textBaseline = "middle"; ctx.textAlign = "left";
    try { ctx.letterSpacing = "-1px"; } catch (e) { /* older canvas */ }
    const words = c.words.map((w) => ({ ...w, txt: w.w.toUpperCase() }));
    const sp = size * 0.26;
    const widths = words.map((w) => ctx.measureText(w.txt).width);
    const total = widths.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
    let x = 540 - total / 2;
    const base = c.who === "L" ? WARM : WHITE, acc = c.who === "L" ? GOLD : CY;
    const fade = Math.min(sm(c.t0, c.t0 + 0.06, t), 1 - sm(c.t1 - 0.08, c.t1, t));
    words.forEach((w, i) => {
      const on = t >= w.t0 - 0.03;
      const k = clamp((t - w.t0 + 0.03) / 0.12, 0, 1);
      const sc = on ? 1 + 0.1 * (1 - easeOut(k)) : 1;
      ctx.save(); ctx.translate(x + widths[i] / 2, y); ctx.scale(sc, sc);
      ctx.globalAlpha = fade * (on ? 1 : 0.0);
      ctx.lineJoin = "round"; ctx.lineWidth = 9; ctx.strokeStyle = "rgba(0,0,0,0.38)"; ctx.strokeText(w.txt, -widths[i] / 2, 0);
      ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
      ctx.fillStyle = w.acc ? acc : base; ctx.fillText(w.txt, -widths[i] / 2, 0);
      if (w.acc) { ctx.shadowOffsetY = 0; ctx.shadowColor = acc; ctx.shadowBlur = 18; ctx.fillText(w.txt, -widths[i] / 2, 0); }
      ctx.restore();
      x += widths[i] + sp;
    });
    ctx.restore();
  }

  // ------------------------------------------------------------------ the opening question (ghost -> typed on her words)
  function question(ctx, F, t) {
    const Q = F.question; if (!Q || t > Q.t1 + 0.5) return;
    const out = 1 - sm(Q.t1, Q.t1 + 0.45, t);
    ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    try { ctx.letterSpacing = "-1px"; } catch (e) { /* */ }
    Q.rows.forEach((row) => {
      let size = row.size;
      ctx.font = `${row.weight || 800} ${size}px ${FONT}`;
      const words = row.words;
      let ws = words.map((w) => ctx.measureText(w.w.toUpperCase()).width);
      let tot = ws.reduce((a, b) => a + b, 0) + size * 0.26 * (words.length - 1);
      while (tot > 960 && size > 40) {            // keep every row inside the action-safe width
        size -= 2; ctx.font = `${row.weight || 800} ${size}px ${FONT}`;
        ws = words.map((w) => ctx.measureText(w.w.toUpperCase()).width); tot = ws.reduce((a, b) => a + b, 0) + size * 0.26 * (words.length - 1);
      }
      const sp = size * 0.26;
      let x = 540 - tot / 2;
      words.forEach((w, i) => {
        const k = clamp((t - w.t0 + 0.04) / 0.14, 0, 1);
        ctx.save(); ctx.translate(x + ws[i] / 2, row.y); const sc = k > 0 && k < 1 ? 1 + 0.08 * (1 - k) : 1; ctx.scale(sc, sc);
        ctx.globalAlpha = out * (0.34 + 0.66 * k);
        ctx.shadowColor = "rgba(0,0,0,0.75)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4;
        ctx.fillStyle = k > 0 ? WARM : "rgba(255,240,216,0.9)"; ctx.fillText(w.w.toUpperCase(), 0, 0);
        if (k > 0) { ctx.shadowOffsetY = 0; ctx.shadowColor = "rgba(255,190,110,0.85)"; ctx.shadowBlur = 22 * k; ctx.fillText(w.w.toUpperCase(), 0, 0); }
        ctx.restore();
        x += ws[i] + sp;
      });
    });
    ctx.restore();
  }

  // ------------------------------------------------------------------ "NOW" in blue light
  function nowText(ctx, F, t) {
    const N = F.now; if (!N || t < N.t0 || t > N.t1) return;
    const k = clamp((t - N.t0) / 0.7, 0, 1), out = 1 - sm(N.t1 - 0.35, N.t1, t);
    ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `900 ${N.size || 170}px ${FONT}`;
    try { ctx.letterSpacing = "6px"; } catch (e) { /* */ }
    const x = N.x || 540, y = N.y || 640;
    // reveal left to right with a bright leading edge
    const tw = ctx.measureText("NOW").width;
    ctx.save(); ctx.beginPath(); ctx.rect(x - tw / 2 - 20, y - 140, (tw + 40) * easeOut(k), 280); ctx.clip();
    ctx.globalAlpha = out;
    ctx.fillStyle = "rgba(200,246,255,0.95)"; ctx.shadowColor = CY; ctx.shadowBlur = 50; ctx.fillText("NOW", x, y);
    ctx.shadowBlur = 18; ctx.fillStyle = "#ffffff"; ctx.fillText("NOW", x, y);
    ctx.restore();
    if (k < 1) { const ex = x - tw / 2 - 20 + (tw + 40) * easeOut(k); const g = ctx.createRadialGradient(ex, y, 0, ex, y, 120); g.addColorStop(0, "rgba(200,246,255,0.9)"); g.addColorStop(1, "rgba(120,230,255,0)"); ctx.fillStyle = g; ctx.globalAlpha = out; ctx.fillRect(ex - 120, y - 120, 240, 240); }
    ctx.restore();
  }

  // ------------------------------------------------------------------ end card
  function endCard(ctx, F, t) {
    const E = F.endcard; if (!E || t < E.t0) return;
    const k = sm(E.t0, E.t0 + 0.6, t);
    ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    try { ctx.letterSpacing = "-1px"; } catch (e) { /* */ }
    E.rows.forEach((r, i) => {
      const kk = sm(E.t0 + i * 0.18, E.t0 + i * 0.18 + 0.5, t);
      ctx.globalAlpha = kk; ctx.font = `${r.weight || 900} ${r.size}px ${FONT}`;
      ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4; ctx.fillStyle = r.color || WARM;
      ctx.fillText(r.text, 540, r.y + 18 * (1 - kk));
      ctx.shadowOffsetY = 0; ctx.shadowColor = "rgba(255,190,110,0.7)"; ctx.shadowBlur = 20; ctx.fillText(r.text, 540, r.y + 18 * (1 - kk));
    });
    if (E.sub) {
      const kk = sm(E.t0 + 0.5, E.t0 + 1.0, t); ctx.globalAlpha = kk;
      ctx.font = `800 ${E.sub.size}px ${FONT}`; const tw = ctx.measureText(E.sub.text).width + 64;
      rr(ctx, 540 - tw / 2, E.sub.y - E.sub.size * 0.95, tw, E.sub.size * 1.5, E.sub.size * 0.75);
      ctx.fillStyle = "rgba(6,20,48,0.6)"; ctx.fill(); glowStroke(ctx, 2.5, CY, 16);
      ctx.fillStyle = "#e9fbff"; ctx.shadowColor = CY; ctx.shadowBlur = 12; ctx.fillText(E.sub.text, 540, E.sub.y); ctx.shadowBlur = 0;
    }
    ctx.restore();
    void k;
  }

  function draw(ctx, F, t, shot, frame) {
    question(ctx, F, t);
    counter(ctx, F, t, shot);
    (F.cards || []).forEach((c) => card(ctx, c, t, frame));
    nowText(ctx, F, t);
    endCard(ctx, F, t);
    captions(ctx, F, t, shot);
  }
  window.GOV = { draw, ICONS, card };
})();

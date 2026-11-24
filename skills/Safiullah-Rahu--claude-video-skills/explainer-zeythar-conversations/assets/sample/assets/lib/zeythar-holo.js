/* zeythar-holo.js — the hologram layer of "Conversations Beyond Time": Zeythar's orb (core + precessing rings whose
 * brightness and speed follow his voice), its morphs (log, speech bubbles, REVIEWED stamps, notepad + pen + timer,
 * sun-and-moon arc, tally marks, plus a generic icon library for future episodes) and his name tag.
 * Drawn per frame in WORLD space (key-art px, projected through the shot camera) onto two 2-D canvases:
 *   add  — black background, everything that emits light (added to the scene before bloom)
 *   over — transparent, the dark glass behind text (composited "over" before the add layer)
 * ZHOLO.create(W, H) -> { add, over, draw(F, t, cam, st) -> {addOn, overOn} }.  Icons are abstract: never a figure.
 */
(function () {
  "use strict";
  const FONT = '"MontserratGD", "Montserrat", "Arial Black", sans-serif';
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const sm = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const easeOut = (u) => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
  const easeBack = (u) => { u = clamp(u, 0, 1); const c = 1.70158; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const CY = [111, 225, 255], BLUE = [70, 150, 255], AMBER = [255, 196, 107], WHITE = [235, 250, 255];
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a, 0, 1).toFixed(3)})`;

  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function chamfer(ctx, x, y, w, h, c) { ctx.beginPath(); ctx.moveTo(x + c, y); ctx.lineTo(x + w - c, y); ctx.lineTo(x + w, y + c); ctx.lineTo(x + w, y + h - c); ctx.lineTo(x + w - c, y + h); ctx.lineTo(x + c, y + h); ctx.lineTo(x, y + h - c); ctx.lineTo(x, y + c); ctx.closePath(); }
  function glow(ctx, col, a, w, blur) { ctx.lineWidth = w; ctx.strokeStyle = rgba(col, a); ctx.shadowColor = rgba(col, Math.min(1, a * 1.2)); ctx.shadowBlur = blur; ctx.stroke(); ctx.shadowBlur = 0; }
  function dot(ctx, x, y, r, col, a, blur) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.5, r), 0, 7); ctx.fillStyle = rgba(col, a); ctx.shadowColor = rgba(col, a); ctx.shadowBlur = blur || 0; ctx.fill(); ctx.shadowBlur = 0; }
  let CRISP = null, OVER = null;     // the overlay context: readable letters go there (after bloom), their glow stays in the light layer
  function text(ctx, s, x, y, size, weight, col, a, align, blur, spacing, maxW) {
    if (!s) return;
    let sz = size;
    const set = (c) => { c.font = `${weight} ${Math.round(sz)}px ${FONT}`; c.textAlign = align || "center"; c.textBaseline = "middle"; try { c.letterSpacing = (spacing || 0) * sz / size + "px"; } catch (e) { /* */ } };
    set(ctx);
    if (maxW) while (ctx.measureText(s).width > maxW && sz > 6) { sz -= 1; set(ctx); }
    ctx.fillStyle = rgba(col, a * 0.55); ctx.shadowColor = rgba(col, a * 0.9); ctx.shadowBlur = (blur || 0) * 1.3 + 2; ctx.fillText(s, x, y); ctx.shadowBlur = 0;
    try { ctx.letterSpacing = "0px"; } catch (e) { /* */ }
    if (CRISP) {
      CRISP.save(); CRISP.setTransform(ctx.getTransform()); CRISP.globalAlpha = ctx.globalAlpha;
      set(CRISP);
      CRISP.lineJoin = "round"; CRISP.lineWidth = Math.max(1.5, sz * 0.10); CRISP.strokeStyle = `rgba(2,14,28,${(0.55 * a).toFixed(3)})`; CRISP.strokeText(s, x, y);
      CRISP.fillStyle = rgba([Math.min(255, col[0] + 30), Math.min(255, col[1] + 15), Math.min(255, col[2] + 10)], a); CRISP.fillText(s, x, y);
      CRISP.restore();
    }
  }

  // ------------------------------------------------------------------ the orb (sx, sy screen centre, s = screen px per world px)
  function orb(ctx, sx, sy, s, t, b, speed, scale, ringK) {
    if (b <= 0.01) return;
    const R = 112 * s * scale;
    // halo
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, R * 0.9);
    g.addColorStop(0, rgba([120, 200, 255], 0.30 * b)); g.addColorStop(0.35, rgba([60, 120, 255], 0.10 * b)); g.addColorStop(1, rgba([30, 60, 160], 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, R * 0.9, 0, 7); ctx.fill();
    // rings: four ellipses precessing, electrons running along them
    const rings = [[0.10, 0.30, 1.0], [1.15, 0.26, -0.8], [2.2, 0.34, 0.65], [2.75, 0.18, -1.15]];
    rings.forEach(([a0, ratio, w], k) => {
      if (ringK <= 0.01) return;
      const th = a0 + w * 0.22 * speed;
      const rr2 = ratio * (0.85 + 0.25 * Math.sin(t * 0.7 * w + k));
      const rx = R * (0.96 - 0.06 * k), ry = rx * rr2;
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(th);
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 7);
      glow(ctx, k % 2 ? BLUE : CY, 0.75 * b * ringK, Math.max(1.2, 1.6 * s * scale), 10 * s);
      // electron
      const ph = speed * (1.3 + 0.4 * k) * (k % 2 ? -1 : 1) + k * 1.7;
      dot(ctx, Math.cos(ph) * rx, Math.sin(ph) * ry, 2.8 * s * scale, WHITE, 0.95 * b * ringK, 12 * s);
      ctx.restore();
    });
    // core
    const cr = 13 * s * scale * (0.9 + 0.25 * b);
    const cg = ctx.createRadialGradient(sx, sy, 0, sx, sy, cr * 2.4);
    cg.addColorStop(0, rgba([255, 255, 255], 0.95 * Math.min(1, b + 0.2))); cg.addColorStop(0.3, rgba([170, 235, 255], 0.75 * b)); cg.addColorStop(1, rgba([60, 140, 255], 0));
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(sx, sy, cr * 2.4, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(sx, sy, cr * 1.15, 0, 7); glow(ctx, CY, 0.6 * b, Math.max(1, 1.2 * s), 8 * s);
    // sparkles
    for (let i = 0; i < 9; i++) {
      const a = hash(i) * 6.283 + t * (0.15 + 0.2 * hash(i + 3)) * (i % 2 ? 1 : -1), d = R * (0.4 + 0.75 * hash(i + 7));
      const tw = Math.pow(Math.abs(Math.sin(t * (1.1 + hash(i + 9)) + i)), 3);
      dot(ctx, sx + Math.cos(a) * d, sy + Math.sin(a) * d * 0.8, 1.6 * s * scale, WHITE, 0.8 * tw * b, 6 * s);
    }
  }

  // ------------------------------------------------------------------ morphs (each draws around the orb centre; k = 0..1 presence)
  function bubble(ctx, x, y, w, h, a, tail, fill) {
    rr(ctx, x - w / 2, y - h / 2, w, h, h * 0.45);
    ctx.moveTo(x - w * 0.18 * tail, y + h / 2); ctx.lineTo(x - w * 0.32 * tail, y + h / 2 + h * 0.38); ctx.lineTo(x - w * 0.02 * tail, y + h / 2);
    if (fill) { ctx.fillStyle = rgba([10, 40, 90], 0.0); }
    glow(ctx, CY, a, Math.max(1.2, h * 0.07), h * 0.35);
    for (let i = 0; i < 3; i++) dot(ctx, x - w * 0.2 + i * w * 0.2, y, h * 0.08, WHITE, a * 0.9, h * 0.2);
  }
  function stamp(ctx, x, y, s, a, rot, label) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const w = s * 1.0, h = s * 0.3;
    chamfer(ctx, -w / 2, -h / 2, w, h, h * 0.15);
    glow(ctx, [255, 120, 90], a, Math.max(1.2, h * 0.09), h * 0.4);
    text(ctx, label, 0, h * 0.04, h * 0.56, 900, [255, 150, 110], a, "center", h * 0.3, h * 0.04);
    ctx.restore();
  }
  const MORPH = {
    log(ctx, m, sx, sy, s, t, k) {             // a small ledger: MON 2:41 · TUE 3:05 · WED 2:30
      const px = sx - 40 * s, py = sy - 118 * s, w = 210 * s, h = 150 * s;
      ctx.save(); ctx.globalAlpha = k;
      // projection beam from the orb
      const bg = ctx.createLinearGradient(sx, sy, px, py + h / 2);
      bg.addColorStop(0, rgba(CY, 0.20)); bg.addColorStop(1, rgba(CY, 0.03));
      ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(px - w / 2, py + h / 2); ctx.lineTo(px + w / 2, py + h / 2); ctx.closePath(); ctx.fill();
      if (OVER) { OVER.save(); OVER.setTransform(ctx.getTransform()); OVER.globalAlpha = k * 0.85; chamfer(OVER, px - w / 2, py - h / 2, w, h, 10 * s); OVER.fillStyle = "rgba(4,26,40,0.88)"; OVER.fill(); OVER.restore(); }
      chamfer(ctx, px - w / 2, py - h / 2, w, h, 10 * s); glow(ctx, CY, 0.85, Math.max(1.2, 1.6 * s), 10 * s);
      text(ctx, "SLEEP LOG", px - w / 2 + 14 * s, py - h / 2 + 17 * s, 12 * s, 800, CY, 0.75, "left", 4 * s, 1.5 * s);
      ctx.beginPath(); ctx.moveTo(px - w / 2 + 12 * s, py - h / 2 + 30 * s); ctx.lineTo(px + w / 2 - 12 * s, py - h / 2 + 30 * s); glow(ctx, CY, 0.4, 1, 0);
      (m.rows || []).forEach((r, i) => {
        const u = clamp((t - r.t) / 0.28, 0, 1); if (u <= 0) return;
        const [day, tm] = r.text.split(" ");
        const yy = py - h / 2 + (54 + 32 * i) * s;
        const last = i === m.rows.length - 1;
        const col = last ? AMBER : WHITE;
        const n = Math.ceil(u * r.text.length);
        text(ctx, day.slice(0, n), px - w / 2 + 16 * s, yy, 24 * s, 800, col, 0.95, "left", 8 * s, 1 * s);
        if (n > day.length) text(ctx, (tm || "").slice(0, n - day.length - 1), px + w / 2 - 16 * s, yy, 24 * s, 800, col, 0.95, "right", 8 * s, 1 * s);
        if (last && u >= 1) { const bl = 0.5 + 0.5 * Math.sin(t * 9); dot(ctx, px + w / 2 - 8 * s, yy, 2.6 * s, AMBER, bl, 6 * s); }
      });
      ctx.restore();
    },
    bubbles(ctx, m, sx, sy, s, t, k) {         // the rings break into a ring of small glowing speech bubbles
      ctx.save(); ctx.globalAlpha = k;
      const n = 7, R = (70 + 28 * easeOut(k)) * s;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + i * 2 * Math.PI / n + (t - m.t0) * 0.35;
        const x = sx + Math.cos(a) * R, y = sy + Math.sin(a) * R * 0.78;
        const bob = Math.sin(t * 2.2 + i) * 2 * s;
        bubble(ctx, x, y + bob, 36 * s, 24 * s, 0.9, i % 2 ? 1 : -1);
      }
      ctx.restore();
    },
    bubbles_reviewed(ctx, m, sx, sy, s, t, k, cam, toS) {   // in the wide: the bubbles orbit in the gap between them; stamps
      ctx.save(); ctx.globalAlpha = k;
      const [cx, cy] = toS(772, 392);
      const n = 7, rx = 112 * s, ry = 175 * s;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + i * 2 * Math.PI / n + (t - m.t0) * 0.42;
        const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
        const front = 0.75 + 0.25 * Math.cos(a);
        bubble(ctx, x, y, 66 * s, 44 * s, 0.9 * front, i % 2 ? 1 : -1);
        const ts = (m.stamps || [])[i];
        if (ts != null && t >= ts) {
          const u = clamp((t - ts) / 0.16, 0, 1);
          const sc = 1 + 0.6 * (1 - easeBack(u));
          stamp(ctx, x + 4 * s, y + 2 * s, 74 * s * sc, 0.95 * front * Math.min(1, u * 2), -0.22 + 0.1 * hash(i), "REVIEWED");
        }
      }
      // after the last small stamp: one big REVIEWED stamp slams into the middle of the orbit (readable on a phone)
      const st = m.stamps || [];
      if (st.length && t >= st[st.length - 1] + 0.25) {
        const u = clamp((t - st[st.length - 1] - 0.25) / 0.18, 0, 1);
        stamp(ctx, cx, cy + 10 * s, 300 * s * (1 + 0.7 * (1 - easeBack(u))), Math.min(1, u * 2), -0.16, "REVIEWED");
      }
      ctx.restore();
    },
    notepad(ctx, m, sx, sy, s, t, k) {         // a holographic notepad, a pen writing, and a 10:00 timer
      ctx.save(); ctx.globalAlpha = k;
      const px = sx - 34 * s, py = sy + 2 * s, w = 118 * s, h = 150 * s;
      ctx.save(); ctx.translate(px, py); ctx.rotate(-0.06);
      rr(ctx, -w / 2, -h / 2, w, h, 8 * s); glow(ctx, CY, 0.9, Math.max(1.2, 1.8 * s), 12 * s);
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-w / 2 + (22 + i * 25) * s, -h / 2, 4 * s, 0, 7); glow(ctx, CY, 0.8, Math.max(1, 1.2 * s), 4 * s); }
      // lines being written: one line per beat of the voice, from the line's start
      const prog = clamp((t - m.t0 - 0.3) / Math.max(1.0, m.t1 - m.t0 - 0.8), 0, 1);
      const nLines = 6, done = prog * nLines;
      let tip = [-w / 2 + 14 * s, -h / 2 + 30 * s];
      for (let i = 0; i < nLines; i++) {
        const f = clamp(done - i, 0, 1); if (f <= 0) break;
        const y = -h / 2 + (30 + i * 19) * s, x0 = -w / 2 + 14 * s, x1 = x0 + (w - 30 * s) * (0.55 + 0.4 * hash(i + 4)) * f;
        ctx.beginPath(); ctx.moveTo(x0, y);
        for (let x = x0; x <= x1; x += 2 * s) ctx.lineTo(x, y + Math.sin((x - x0) / (5 * s) + i) * 2.2 * s);
        glow(ctx, WHITE, 0.85, Math.max(1, 1.4 * s), 5 * s);
        tip = [x1, y];
      }
      // the pen
      ctx.save(); ctx.translate(tip[0] + 2 * s, tip[1] - 2 * s); ctx.rotate(-0.75 + 0.08 * Math.sin(t * 14));
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -46 * s); ctx.moveTo(-3.5 * s, -42 * s); ctx.lineTo(-3.5 * s, -6 * s); ctx.lineTo(0, 0); ctx.lineTo(3.5 * s, -6 * s); ctx.lineTo(3.5 * s, -42 * s);
      glow(ctx, AMBER, 0.95, Math.max(1.2, 1.6 * s), 8 * s);
      ctx.restore();
      ctx.restore();
      // the timer
      const tx = sx + 78 * s, ty = sy - 70 * s, R = 34 * s;
      ctx.beginPath(); ctx.arc(tx, ty, R, 0, 7); glow(ctx, CY, 0.35, Math.max(1, 1.5 * s), 0);
      const tstart = (m.marks && m.marks.length) ? m.marks[0] : m.t0 + 0.2;     // 10:00 until "pen", then it runs
      const run = clamp((t - tstart) / 3.0, 0, 1);
      ctx.beginPath(); ctx.arc(tx, ty, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - run * 0.08)); glow(ctx, AMBER, 0.9, Math.max(1.5, 3 * s), 10 * s);
      const secs = Math.max(0, 600 - Math.floor(run * 3));
      const lab = m.timer || `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
      text(ctx, run > 0.34 ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}` : lab, tx, ty + 1 * s, 19 * s, 800, WHITE, 0.95, "center", 8 * s, 0, R * 1.6);
      ctx.restore();
    },
    sun_moon(ctx, m, sx, sy, s, t, k) {        // a soft glow forms a small arc: moon on the left, sun rising on the right
      ctx.save(); ctx.globalAlpha = k;
      const R = 84 * s, cx = sx, cy = sy + 24 * s;
      const draw = easeOut(clamp((t - m.t0) / 0.7, 0, 1));
      ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, Math.PI + Math.PI * draw); glow(ctx, [255, 220, 170], 0.75, Math.max(1.2, 2 * s), 10 * s);
      ctx.beginPath(); ctx.moveTo(cx - R - 14 * s, cy); ctx.lineTo(cx + R + 14 * s, cy); glow(ctx, CY, 0.35, Math.max(1, 1.2 * s), 0);
      // moon (left end)
      const mx = cx - R, my = cy;
      ctx.save(); ctx.beginPath(); ctx.arc(mx, my, 14 * s, 0, 7); ctx.arc(mx + 7 * s, my - 4 * s, 12 * s, 0, 7, true);
      ctx.fillStyle = rgba([200, 225, 255], 0.9); ctx.shadowColor = rgba([150, 200, 255], 0.9); ctx.shadowBlur = 14 * s; ctx.fill("evenodd"); ctx.restore();
      // the sun climbing the arc from the right end
      const sa = Math.PI * 2 - Math.PI * 0.42 * easeOut(clamp((t - m.t0 - 0.4) / 2.0, 0, 1));
      const ux = cx + Math.cos(sa) * R, uy = cy + Math.sin(sa) * R;
      if (draw > 0.6) {
        const sk = sm(0.6, 1.0, draw);
        dot(ctx, ux, uy, 13 * s * sk, AMBER, 0.95, 20 * s);
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + t * 0.4; ctx.beginPath(); ctx.moveTo(ux + Math.cos(a) * 18 * s, uy + Math.sin(a) * 18 * s); ctx.lineTo(ux + Math.cos(a) * 25 * s, uy + Math.sin(a) * 25 * s); glow(ctx, AMBER, 0.8 * sk, Math.max(1, 1.6 * s), 6 * s); }
      }
      ctx.restore();
    },
    tally(ctx, m, sx, sy, s, t, k) {           // four tally marks, one by one
      ctx.save(); ctx.globalAlpha = k;
      const n = (m.marks || []).length || 4, gap = 24 * s, hh = 58 * s;
      const x0 = sx - (n - 1) * gap / 2;
      for (let i = 0; i < n; i++) {
        const ti = (m.marks || [])[i]; if (ti == null || t < ti) continue;
        const u = easeOut(clamp((t - ti) / 0.14, 0, 1));
        const x = x0 + i * gap + Math.sin(i * 2.1) * 2 * s;
        ctx.beginPath(); ctx.moveTo(x - 3 * s, sy - hh / 2); ctx.lineTo(x + 3 * s, sy - hh / 2 + hh * u);
        glow(ctx, i === n - 1 ? AMBER : WHITE, 0.95, Math.max(2, 5 * s), 14 * s);
      }
      ctx.restore();
    },
    // ---- a generic library for future episodes (abstract, never a figure)
    heart(ctx, m, sx, sy, s, t, k) { ctx.save(); ctx.globalAlpha = k; const w = 46 * s * (1 + 0.05 * Math.sin(t * 6));
      ctx.beginPath(); ctx.moveTo(sx, sy + w * 0.9); ctx.bezierCurveTo(sx - w * 1.4, sy - w * 0.1, sx - w * 0.6, sy - w * 1.1, sx, sy - w * 0.35); ctx.bezierCurveTo(sx + w * 0.6, sy - w * 1.1, sx + w * 1.4, sy - w * 0.1, sx, sy + w * 0.9);
      glow(ctx, [255, 160, 150], 0.95, Math.max(1.5, 2.5 * s), 14 * s); ctx.restore(); },
    phone(ctx, m, sx, sy, s, t, k) { ctx.save(); ctx.globalAlpha = k; const w = 60 * s, h = 110 * s; rr(ctx, sx - w / 2, sy - h / 2, w, h, 10 * s); glow(ctx, CY, 0.9, Math.max(1.2, 2 * s), 10 * s);
      for (let i = 0; i < 3; i++) { const y = sy - h / 2 + (22 + i * 26) * s; rr(ctx, sx - w / 2 + 8 * s, y, w * (0.5 + 0.3 * hash(i)), 16 * s, 6 * s); glow(ctx, i === 2 ? AMBER : WHITE, 0.8 * clamp((t - m.t0) * 3 - i, 0, 1), 1.2 * s, 4 * s); }
      ctx.restore(); },
    hourglass(ctx, m, sx, sy, s, t, k) { ctx.save(); ctx.globalAlpha = k; const w = 34 * s, h = 52 * s, fl = clamp((t - m.t0) / Math.max(1, m.t1 - m.t0), 0, 1);
      ctx.beginPath(); ctx.moveTo(sx - w, sy - h); ctx.lineTo(sx + w, sy - h); ctx.lineTo(sx + 3 * s, sy); ctx.lineTo(sx + w, sy + h); ctx.lineTo(sx - w, sy + h); ctx.lineTo(sx - 3 * s, sy); ctx.closePath(); glow(ctx, CY, 0.9, 2 * s, 10 * s);
      ctx.fillStyle = rgba(AMBER, 0.8); ctx.fillRect(sx - w * 0.6, sy + h * (1 - 0.8 * fl), w * 1.2, h * 0.8 * fl); ctx.restore(); },
    coin(ctx, m, sx, sy, s, t, k) { ctx.save(); ctx.globalAlpha = k; const sq = Math.abs(Math.cos(t * 3)); ctx.beginPath(); ctx.ellipse(sx, sy, 40 * s * Math.max(0.1, sq), 40 * s, 0, 0, 7); glow(ctx, AMBER, 0.95, 3 * s, 14 * s); ctx.restore(); },
    question(ctx, m, sx, sy, s, t, k) { ctx.save(); ctx.globalAlpha = k; text(ctx, "?", sx, sy, 90 * s, 900, CY, 0.95, "center", 20 * s); ctx.restore(); },
    bulb(ctx, m, sx, sy, s, t, k) { ctx.save(); ctx.globalAlpha = k; const R = 34 * s, on = sm(0.3, 0.7, clamp((t - m.t0) / 1.2, 0, 1));
      ctx.beginPath(); ctx.arc(sx, sy - 8 * s, R, Math.PI * 0.8, Math.PI * 2.2); ctx.lineTo(sx + R * 0.45, sy + 30 * s); ctx.lineTo(sx - R * 0.45, sy + 30 * s); ctx.closePath();
      glow(ctx, on > 0.5 ? AMBER : CY, 0.95, 2.5 * s, 10 + 30 * on * s); ctx.restore(); },
    document(ctx, m, sx, sy, s, t, k) {        // terms and conditions: a page whose lines scroll by, too fast to read
      ctx.save(); ctx.globalAlpha = k; const w = 96 * s, h = 128 * s;
      rr(ctx, sx - w / 2, sy - h / 2, w, h, 6 * s); glow(ctx, CY, 0.9, Math.max(1.2, 1.8 * s), 10 * s);
      text(ctx, "TERMS", sx, sy - h / 2 + 14 * s, 13 * s, 800, AMBER, 0.95, "center", 4 * s, 1.5 * s);
      ctx.save(); rr(ctx, sx - w / 2 + 4 * s, sy - h / 2 + 26 * s, w - 8 * s, h - 32 * s, 4 * s); ctx.clip();
      const off = ((t - m.t0) * 60 * s) % (12 * s);
      for (let i = -1; i < 10; i++) { const y = sy - h / 2 + 32 * s + i * 12 * s - off; ctx.beginPath(); ctx.moveTo(sx - w / 2 + 10 * s, y); ctx.lineTo(sx - w / 2 + 10 * s + (w - 20 * s) * (0.55 + 0.4 * hash(i + Math.floor((t - m.t0) * 5))), y); glow(ctx, WHITE, 0.7, Math.max(1, 1.3 * s), 3 * s); }
      ctx.restore(); ctx.restore(); },
    graph_down(ctx, m, sx, sy, s, t, k) { ctx.save(); ctx.globalAlpha = k; const p = clamp((t - m.t0) / 1.2, 0, 1); ctx.beginPath(); ctx.moveTo(sx - 70 * s, sy - 40 * s);
      for (let i = 1; i <= 20 * p; i++) { const f = i / 20; ctx.lineTo(sx - 70 * s + 140 * s * f, sy - 40 * s + 80 * s * f + Math.sin(f * 12) * 10 * s); } glow(ctx, [255, 120, 100], 0.95, 3 * s, 10 * s); ctx.restore(); },
    graph_up(ctx, m, sx, sy, s, t, k) { ctx.save(); ctx.globalAlpha = k; const p = clamp((t - m.t0) / 1.2, 0, 1); ctx.beginPath(); ctx.moveTo(sx - 70 * s, sy + 40 * s);
      for (let i = 1; i <= 20 * p; i++) { const f = i / 20; ctx.lineTo(sx - 70 * s + 140 * s * f, sy + 40 * s - 80 * s * f + Math.sin(f * 12) * 10 * s); } glow(ctx, [140, 255, 190], 0.95, 3 * s, 10 * s); ctx.restore(); },
  };

  // ------------------------------------------------------------------ the name tag (world box), forms on his first line
  function nameTag(over, add, T, t, toS, s) {
    if (!T || t < T.t0) return [false, false];
    const [x0, y0] = toS(T.box[0], T.box[1]), [x1, y1] = toS(T.box[2], T.box[3]);
    if (x1 < 0 || x0 > 1080 || y1 < 0 || y0 > 1920) return [false, false];
    const w = x1 - x0, h = y1 - y0, c = 10 * s;
    const u = t - T.t0;
    const border = easeOut(clamp(u / 0.5, 0, 1)), glass = sm(0.15, 0.5, u), txt = clamp((u - 0.3) / 0.55, 0, 1);
    const fl = u < 0.6 ? (hash(Math.floor(t * 30) * 1.3) > 0.3 ? 1 : 0.45) : 1;
    // glass (over)
    over.save(); over.globalAlpha = glass * 0.82 * fl;
    chamfer(over, x0, y0, w, h, c);
    const g = over.createLinearGradient(x0, y0, x0, y1); g.addColorStop(0, "rgba(10,52,64,0.86)"); g.addColorStop(1, "rgba(5,30,42,0.92)");
    over.fillStyle = g; over.fill(); over.restore();
    // border traced in, text typed (add)
    add.save(); add.globalAlpha = fl;
    chamfer(add, x0, y0, w, h, c);
    add.setLineDash([2 * (w + h) * border, 4 * (w + h)]);
    glow(add, [120, 235, 255], 0.9, Math.max(1.2, 1.4 * s), 8 * s);
    add.setLineDash([]);
    const r1 = T.rows[0], r2 = T.rows[1];
    const n1 = Math.ceil(clamp(txt * 1.6, 0, 1) * r1.length), n2 = Math.ceil(clamp(txt * 1.6 - 0.6, 0, 1) * r2.length);
    // the full words set the size (so typing does not grow them), then the typed part is drawn left-anchored on that layout
    add.font = `800 ${Math.round(h * 0.30)}px ${FONT}`;
    let s1 = h * 0.30; while (add.measureText(r1).width + r1.length * h * 0.02 > w * 0.84 && s1 > 6) { s1 -= 1; add.font = `800 ${Math.round(s1)}px ${FONT}`; }
    const w1 = add.measureText(r1).width + r1.length * s1 * 0.06;
    add.font = `700 ${Math.round(h * 0.14)}px ${FONT}`;
    let s2 = h * 0.14; while (add.measureText(r2).width + r2.length * s2 * 0.2 > w * 0.80 && s2 > 5) { s2 -= 1; add.font = `700 ${Math.round(s2)}px ${FONT}`; }
    const w2 = add.measureText(r2).width + r2.length * s2 * 0.2;
    text(add, r1.slice(0, n1), x0 + (w - w1) / 2, y0 + h * 0.42, s1, 800, [140, 240, 255], 0.98, "left", 6 * s, s1 * 0.06);
    text(add, r2.slice(0, n2), x0 + (w - w2) / 2, y0 + h * 0.74, s2, 700, [190, 245, 255], 0.92, "left", 3 * s, s2 * 0.2);
    // scan line
    if (u < 1.2) { const sy2 = y0 + h * ((u * 1.4) % 1); add.fillStyle = rgba(CY, 0.25 * (1 - u / 1.2)); add.fillRect(x0 + 2, sy2, w - 4, Math.max(1, 1.5 * s)); }
    add.restore();
    return [true, true];
  }

  function create(W, H) {
    const add = document.createElement("canvas"); add.width = W; add.height = H;
    const over = document.createElement("canvas"); over.width = W; over.height = H;
    const A = add.getContext("2d"), O = over.getContext("2d");
    let lastAdd = true, lastOver = true;
    function draw(F, t, cam, st, crisp) {
      CRISP = crisp || null; OVER = O;
      const toS = cam.toS;
      const s = cam.z;
      if (lastAdd) { A.globalCompositeOperation = "source-over"; A.fillStyle = "#000"; A.fillRect(0, 0, W, H); }
      if (lastOver) O.clearRect(0, 0, W, H);
      let addOn = false, overOn = false;
      A.globalCompositeOperation = "lighter";
      // the orb, its morphs
      const OL = F.landmarks.zeythar.orb;
      const end = F.orbEnd ? sm(F.orbEnd.t0, F.orbEnd.t0 + 1.4, t) : 0;
      const wx = OL[0] + (702 - OL[0]) * end, wy = OL[1] + (588 - OL[1]) * end;
      const [sx, sy] = toS(wx, wy);
      const reach = 260 * s;
      if (sx > -reach && sx < W + reach && sy > -reach && sy < H + reach) {
        let mk = 0, active = null;
        (F.morphs || []).forEach((m) => {
          const kin = sm(m.t0, m.t0 + 0.4, t), kout = 1 - sm(m.t1 - 0.4, m.t1, t);
          const k = kin * kout; if (k > mk) { mk = k; active = m; }
        });
        const b = st.orbB * (1 - 0.65 * end);
        const ringK = 1 - 0.9 * mk;
        orb(A, sx, sy, s, t, b * (1 - 0.5 * mk), st.orbSpeed, (1 - 0.55 * mk) * (1 - 0.6 * end), ringK);
        if (active && mk > 0.002) {
          const fn = MORPH[active.kind];
          const sc = 0.7 + 0.3 * easeOut(mk);
          A.save(); A.translate(sx, sy); A.scale(sc, sc); A.translate(-sx, -sy);
          if (fn) fn(A, active, sx, sy, s, t, mk, cam, toS);
          A.restore();
        }
        addOn = true;
      }
      const [a2, o2] = nameTag(O, A, F.tag, t, toS, s);
      addOn = addOn || a2; overOn = overOn || o2;
      A.globalCompositeOperation = "source-over";
      lastAdd = addOn; lastOver = overOn;
      if ((F.morphs || []).some((m) => m.kind === "log" && t > m.t0 && t < m.t1)) overOn = true;
      return { addOn, overOn };
    }
    return { add, over, draw, MORPH };
  }
  window.ZHOLO = { create, MORPH };
})();

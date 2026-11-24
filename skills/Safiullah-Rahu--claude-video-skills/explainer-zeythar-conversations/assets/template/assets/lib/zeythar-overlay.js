/* zeythar-overlay.js — the 2-D layer over the plate (after the grade, so it stays crisp): word-synced captions coloured
 * by speaker (the girl warm white with amber keywords, Zeythar cyan with bright keywords), the top category chip and
 * series label for the first seconds, and the end card. Pure function of time: ZOV.draw(ctx, F, t, shot, frame).
 */
(function () {
  "use strict";
  const FONT = '"MontserratGD", "Montserrat", "Arial Black", sans-serif';
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const sm = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const easeOut = (u) => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
  const STY = {
    L: { base: "#fff1dc", acc: "#ffc46b", glow: "rgba(255,180,90,0.85)" },
    Z: { base: "#9ff1ff", acc: "#e9fdff", glow: "rgba(90,220,255,0.95)" },
  };
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function captions(ctx, F, t, shot) {
    const caps = F.captions; let c = null;
    for (let i = 0; i < caps.length; i++) if (t >= caps[i].t0 && t < caps[i].t1) { c = caps[i]; break; }
    if (!c) return;
    const y = (shot && shot.capY) || F.capY || 1420;
    let size = c.size || 70;
    const st = STY[c.who] || STY.L;
    ctx.save(); ctx.textBaseline = "middle"; ctx.textAlign = "left";
    const words = c.words.map((w) => ({ ...w, txt: w.w.toUpperCase() }));
    let widths, total, sp;
    for (;;) {
      ctx.font = `800 ${size}px ${FONT}`;
      try { ctx.letterSpacing = "-1px"; } catch (e) { /* */ }
      sp = size * 0.26;
      widths = words.map((w) => ctx.measureText(w.txt).width);
      total = widths.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
      if (total <= 940 || size <= 44) break;
      size -= 2;
    }
    let x = 540 - total / 2;
    const fade = Math.min(sm(c.t0, c.t0 + 0.05, t), 1 - sm(c.t1 - 0.07, c.t1, t));
    words.forEach((w, i) => {
      const on = t >= w.t0 - 0.03;
      const k = clamp((t - w.t0 + 0.03) / 0.12, 0, 1);
      const sc = on ? 1 + 0.1 * (1 - easeOut(k)) : 1;
      ctx.save(); ctx.translate(x + widths[i] / 2, y); ctx.scale(sc, sc);
      ctx.globalAlpha = fade * (on ? 1 : 0);
      ctx.lineJoin = "round"; ctx.lineWidth = 9; ctx.strokeStyle = "rgba(0,0,0,0.42)"; ctx.strokeText(w.txt, -widths[i] / 2, 0);
      ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
      ctx.fillStyle = w.acc ? st.acc : st.base; ctx.fillText(w.txt, -widths[i] / 2, 0);
      if (w.acc || c.who === "Z") { ctx.shadowOffsetY = 0; ctx.shadowColor = st.glow; ctx.shadowBlur = w.acc ? 20 : 10; ctx.fillText(w.txt, -widths[i] / 2, 0); }
      ctx.restore();
      x += widths[i] + sp;
    });
    ctx.restore();
  }

  function chip(ctx, F, t) {
    const C = F.chip; if (!C || t > C.t1 + 0.6) return;
    const vis = (1 - sm(C.t1, C.t1 + 0.55, t));
    ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "middle";
    // category pill
    ctx.font = `800 30px ${FONT}`;
    try { ctx.letterSpacing = "3px"; } catch (e) { /* */ }
    const tw = ctx.measureText(C.category).width + 52, ph = 54, py = 262;
    ctx.globalAlpha = vis;
    rr(ctx, 540 - tw / 2, py - ph / 2, tw, ph, ph / 2);
    ctx.fillStyle = "rgba(6,22,40,0.62)"; ctx.fill();
    ctx.lineWidth = 2.2; ctx.strokeStyle = "rgba(120,236,255,0.95)"; ctx.shadowColor = "rgba(111,232,255,0.9)"; ctx.shadowBlur = 14; ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = "#e6fbff"; ctx.shadowColor = "rgba(111,232,255,0.7)"; ctx.shadowBlur = 8; ctx.fillText(C.category, 540, py + 1); ctx.shadowBlur = 0;
    // series label
    ctx.font = `700 26px ${FONT}`;
    try { ctx.letterSpacing = "7px"; } catch (e) { /* */ }
    ctx.fillStyle = "rgba(255,236,206,0.95)"; ctx.shadowColor = "rgba(0,0,0,0.85)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 2;
    ctx.fillText(C.series, 540, py + 62);
    ctx.restore();
  }

  function endCard(ctx, F, t) {
    const E = F.endcard; if (!E || t < E.t0) return;
    ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    try { ctx.letterSpacing = "-1px"; } catch (e) { /* */ }
    const ys = E.y || [282, 360];
    E.rows.forEach((r, i) => {
      const kk = sm(E.t0 + i * 0.18, E.t0 + i * 0.18 + 0.5, t);
      let size = i === 0 ? 50 : 62;
      ctx.font = `900 ${size}px ${FONT}`;
      while (ctx.measureText(r).width > 960 && size > 34) { size -= 2; ctx.font = `900 ${size}px ${FONT}`; }
      ctx.globalAlpha = kk;
      ctx.shadowColor = "rgba(0,0,0,0.85)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4; ctx.fillStyle = "#fff1dc";
      ctx.fillText(r, 540, ys[i] + 18 * (1 - kk));
      ctx.shadowOffsetY = 0; ctx.shadowColor = "rgba(255,180,90,0.7)"; ctx.shadowBlur = 20; ctx.fillText(r, 540, ys[i] + 18 * (1 - kk));
    });
    const k2 = sm(E.t0 + 0.5, E.t0 + 1.0, t);
    if (E.sub && k2 > 0) {
      ctx.globalAlpha = k2; ctx.font = `800 36px ${FONT}`;
      try { ctx.letterSpacing = "2px"; } catch (e) { /* */ }
      const tw = ctx.measureText(E.sub).width + 64, y = ys[1] + 84;
      rr(ctx, 540 - tw / 2, y - 40, tw, 58, 29);
      ctx.fillStyle = "rgba(6,20,40,0.62)"; ctx.shadowBlur = 0; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = "#6fe8ff"; ctx.shadowColor = "#6fe8ff"; ctx.shadowBlur = 16; ctx.stroke(); ctx.shadowBlur = 0;
      ctx.fillStyle = "#e9fbff"; ctx.textBaseline = "middle"; ctx.fillText(E.sub, 540, y - 11);
    }
    const k3 = sm(E.t0 + 0.9, E.t0 + 1.5, t);
    if (E.series && k3 > 0) {
      ctx.globalAlpha = k3; ctx.textBaseline = "middle"; ctx.font = `700 26px ${FONT}`;
      try { ctx.letterSpacing = "7px"; } catch (e) { /* */ }
      ctx.fillStyle = "rgba(255,236,206,0.95)"; ctx.shadowColor = "rgba(0,0,0,0.85)"; ctx.shadowBlur = 10;
      ctx.fillText(E.series, 540, E.seriesY || 1460);
    }
    ctx.restore();
  }

  function draw(ctx, F, t, shot, frame) {
    chip(ctx, F, t);
    endCard(ctx, F, t);
    captions(ctx, F, t, shot);
    void frame;
  }
  window.ZOV = { draw };
})();

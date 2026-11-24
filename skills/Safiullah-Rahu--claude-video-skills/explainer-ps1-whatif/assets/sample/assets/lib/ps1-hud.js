/* ps1-hud.js — the VHS HUD of a PS1 what-if: title, AGE / LIVED counter, REWIND / PLAY labels, a TAKE counter,
   one-sentence pixel captions and the end card, all from window.HUD_CONFIG(V) (see rewind-hud-config.js).
   window.HUD_DRAW(ctx, t, V) draws one frame (pure function of t). Labels: REWIND/PLAY here; for PAUSE/PLAY swap
   rewIcon for a two-bar icon and the label text. */
(function () {
  const PF = () => window.PIXFONT;
  const COL = { age: "#f8d868", white: "#f4f2ec", ink: "#120a14", red: "#d83c3c", blue: "#7fb0f2", sky: "#98d8f8", take: "#f8d868" };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const sm = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };

  const build = (V) => window.HUD_CONFIG(V);

  function counter(t, segs, def) {
    let v = def, moving = false;
    for (const [a, b, f, to] of segs) {
      if (t >= a) { if (t < b) { const u = (t - a) / Math.max(0.001, b - a); v = Math.round(f + (to - f) * u * u); moving = true; } else v = to; }
    }
    return { v, moving };
  }
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  function rewIcon(ctx, x, y, s, fill, ink) { // two left-pointing pixel triangles, 7 rows tall
    const tri = (x0) => { for (let r = 0; r < 7; r++) { const half = 3 - Math.abs(3 - r); for (let c = 3 - half; c <= 3; c++) cell(x0 + c, r); } };
    const cells = []; const cell = (cx, cy) => cells.push([cx, cy]);
    tri(0); tri(4);
    const k = Math.max(2, Math.round(s * 0.5));
    ctx.fillStyle = ink; for (const [cx, cy] of cells) ctx.fillRect(x + cx * s - k, y + cy * s - k, s + 2 * k, s + 2 * k);
    ctx.fillStyle = fill; for (const [cx, cy] of cells) ctx.fillRect(x + cx * s, y + cy * s, s, s);
  }
  function playIcon(ctx, x, y, s, fill, ink) {
    const cells = []; for (let r = 0; r < 7; r++) { const half = 3 - Math.abs(3 - r); for (let c = 0; c <= half; c++) cells.push([c, r]); }
    const k = Math.max(2, Math.round(s * 0.5));
    ctx.fillStyle = ink; for (const [cx, cy] of cells) ctx.fillRect(x + cx * s - k, y + cy * s - k, s + 2 * k, s + 2 * k);
    ctx.fillStyle = fill; for (const [cx, cy] of cells) ctx.fillRect(x + cx * s, y + cy * s, s, s);
  }
  function txt(ctx, s, x, y, scale, fill, align, o) {
    PF().draw(ctx, s, x, y, scale, Object.assign({ fill, outline: COL.ink, outlineW: 0.5, shadow: COL.ink, shadowD: 1, align: align || "center" }, o || {}));
  }

  let D = null;
  window.HUD_DRAW = function (ctx, t, V) {
    if (!D) D = build(V);
    ctx.clearRect(0, 0, 1080, 1920);
    ctx.imageSmoothingEnabled = false;
    const end = t >= D.end;
    // ---- title (0 .. titleOff)
    if (t < D.titleOff) {
      const a = 1 - sm((t - D.titleOff + 0.3) / 0.3);
      ctx.globalAlpha = a;
      const T3 = D.title || ["WHAT IF YOU COULD", "REWIND", "10 SECONDS?"];
      const big = Math.min(19, Math.floor(980 / (6 * T3[1].length)));
      txt(ctx, T3[0], 540, 182, 8, COL.white);
      txt(ctx, T3[1], 540, 272, big, t < (D.flip == null ? 1.0 : D.flip) ? COL.red : COL.blue);
      if (T3[2]) txt(ctx, T3[2], 540, 272 + Math.round(big * 8.42), 9, COL.white);
      ctx.globalAlpha = 1;
    }
    // ---- HUD
    if (t >= D.hudOn && !end) {
      let age = D.age0 || 24; for (const [a, v] of D.ages) if (t >= a) age = v;
      const lv = counter(t, D.lived, D.age0 || 24);
      const pop = sm((t - D.hudOn) / 0.15);
      ctx.globalAlpha = pop;
      txt(ctx, "AGE " + age, 540, 176, 12, COL.age);
      txt(ctx, "LIVED " + fmt(lv.v) + " YEARS", 540, 290, 7, lv.moving ? COL.sky : COL.white);
      ctx.globalAlpha = 1;
    }
    if (!end) {
      // ---- REWIND / PLAY labels (top-left)
      let lastR = -9, lastP = -9;
      for (const r of D.rewinds) if (t >= r) lastR = r;
      for (const p of D.plays) if (t >= p) lastP = p;
      const y = 372, s = 9;
      if (lastR > lastP && t - lastR < 0.9) { rewIcon(ctx, 58, y, s, COL.white, COL.ink); txt(ctx, "REWIND", 160, y, s, COL.white, "left"); }
      else if (lastR > lastP) { if (Math.floor(t * 3) % 2 === 0) rewIcon(ctx, 40, 382, 5, COL.white, COL.ink); }
      else if (lastP > lastR && t - lastP < 0.9) { playIcon(ctx, 62, y, s, COL.white, COL.ink); txt(ctx, "PLAY", 140, y, s, COL.white, "left"); }
      // ---- TAKE counter (top-right)
      for (const [a, b, f, to, label, hold] of D.takes) {
        if (t >= a && t < hold) {
          const u = clamp((t - a) / Math.max(0.001, b - a), 0, 1);
          const v = Math.round(f + (to - f) * u * u);
          txt(ctx, label + " " + fmt(v), 1012, 384, 8, COL.take, "right");
        }
      }
    }
    // ---- captions: one sentence at a time, low centre (block bottom <= 1296)
    if (!end) {
      for (const c of V.caps) {
        if ((D.skipCaps || []).indexOf(c.id) >= 0) continue;
        if (t >= c.on && t < c.off) {
          const n = c.lines.length, s = 6, lh = 11 * s;
          const top = 1296 - (n - 1) * lh - 9 * s;
          c.lines.forEach((ln, i) => PF().draw(ctx, ln, 540, top + i * lh, s, { fill: COL.white, outline: COL.ink, outlineW: 0.5, shadow: "rgba(18,10,20,0.85)", shadowD: 1, align: "center" }));
        }
      }
    }
    // ---- end card
    if (end) {
      const u = sm((t - D.end) / 0.35);
      ctx.globalAlpha = u;
      const ET = D.endText || ["Would you", "press REWIND?"];
      txt(ctx, ET[0], 540, 640, 11, COL.white);
      txt(ctx, ET[1], 540, 760, 11, COL.sky);
      rewIcon(ctx, 468, 930, 18, COL.sky, COL.ink);
      ctx.globalAlpha = 1;
    }
  };
})();

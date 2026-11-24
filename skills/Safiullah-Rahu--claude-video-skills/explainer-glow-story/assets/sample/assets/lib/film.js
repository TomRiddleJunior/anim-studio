/* "Unheard" (glow-voicemail) — 19 stations of glowing objects along one continuous camera path through navy fog.
 * GLOW_FILM(G, V) -> { update(t) -> render state }.  V: word/line times from vo/data/vo.json (tools/build.py).
 * Stations sit ~2.1 m apart along -z, zig-zagging 0.85 m sideways so the next one waits just outside the frame;
 * the camera holds on each with a slow push, then trucks + pans to the next in ~1 s (0 cuts). Every change is keyed
 * to a word of the voice-over.
 */
window.GLOW_FILM = function (G, V) {
  "use strict";
  const T = G.T, C = G.C, D = G.D, sstep = G.sstep, lerp = G.lerp, clamp = G.clamp;
  const easeIO = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const easeO = (u) => 1 - Math.pow(1 - u, 3);
  const fade = (t, a, b) => sstep(a, b, t);
  const win = (t, a, b, fi, fo) => sstep(a - fi, a, t) * (1 - sstep(b, b + fo, t));
  const q = (x, k) => Math.round(x * k) / k;
  const w = V.w, we = V.we, L = V.L;
  const A = (x, y, z) => new T.Vector3(x, y, z);
  const add = (a, x, y, z) => [a.x + x, a.y + y, a.z + z];
  const PX = (p, x, y, z) => p.g.position.set(x, y, z);
  const easeBack = (u) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
  // UI pop-in (the source's cards appear by scaling up): scale 0 -> 1 with a small overshoot over d seconds from a
  const pop = (g, t, a, d) => { const u = clamp((t - a) / (d || 0.38), 0, 1); const k = u <= 0 ? 1e-4 : Math.max(1e-4, easeBack(u)); g.scale.setScalar(k); return u; };

  // ------------------------------------------------------------------ shared drawing
  function wrap(ctx, words, maxW) {
    const lines = [[]]; let cur = 0;
    const sp = ctx.measureText(" ").width;
    words.forEach((wd, i) => {
      const ww = ctx.measureText(wd).width;
      if (cur > 0 && cur + sp + ww > maxW) { lines.push([]); cur = 0; }
      lines[lines.length - 1].push(i); cur += (cur > 0 ? sp : 0) + ww;
    });
    return lines;
  }
  // a chat/voicemail-transcript bubble: tail left (his, amber) or right (hers, ice); words reveal with s.rev[i] alpha
  function bubbleDraw(text, side, col, size) {
    const words = text.split(" ");
    return (ctx, CW, CH, s, px, mg, o) => {
      const c = s.col || col;
      const x = mg * px, y = mg * px, bw = o.w * px, bh = o.h * px, r = 0.026 * px;
      D.stroke(ctx, () => {
        D.rr(ctx, x + 3, y + 3, bw - 6, bh - 6, r);
        const tx = side === "l" ? x + 0.03 * px : x + bw - 0.03 * px, ty = y + bh - 3;
        ctx.moveTo(tx, ty); ctx.lineTo(tx + (side === "l" ? -0.028 : 0.028) * px, ty + 0.03 * px); ctx.lineTo(tx + (side === "l" ? 0.03 : -0.03) * px, ty);
      }, { color: c, alpha: 0.85, lw: 3.2, glow: 22 });
      ctx.font = D.font(size * px, 500, "p");
      const lines = wrap(ctx, words, bw - 0.06 * px);
      const lh = size * px * 1.32, y0 = y + bh / 2 - (lines.length - 1) * lh / 2;
      const sp = ctx.measureText(" ").width;
      lines.forEach((ln, li) => {
        const tw = ln.reduce((a, i) => a + ctx.measureText(words[i]).width, 0) + sp * (ln.length - 1);
        let xx = x + bw / 2 - tw / 2;
        ln.forEach((i) => {
          const a = s.rev ? s.rev[i] : 1;
          if (a > 0.01) D.text(ctx, words[i], xx, y0 + li * lh, { size: size * px, weight: 500, fam: "p", align: "left", color: s.textCol || C.white, alpha: a * (s.textK != null ? s.textK : 0.46), glow: size * px * 0.07, glowColor: c });
          xx += ctx.measureText(words[i]).width + sp;
        });
      });
    };
  }
  function revealOf(id, t, n) { // per-word alpha from the voice-over's word starts
    const ws = L(id).words;
    return Array.from({ length: n }, (_, i) => { const wd = ws[Math.min(i, ws.length - 1)]; return q(fade(t, wd[1] - 0.04, wd[1] + 0.1), 10); });
  }
  function labelPanel(text, wM, hM, o) {
    o = o || {};
    return G.panel({ w: wM, h: hM, noSlab: true, margin: 0.01, hdr: o.hdr || 1.3, cw: o.cw || 900,
      draw: (ctx, CW, CH, s) => D.text(ctx, s.text || text, CW / 2, CH / 2, { size: CH * (o.k || 0.5), weight: o.weight || 600, ls: o.ls != null ? o.ls : 8, color: s.color || o.color || C.ice, fam: o.fam || "p", alpha: s.alpha != null ? s.alpha : 1, glow: CH * (o.k || 0.5) * 0.12 }) });
  }
  function greetingDraw(o) { // the greeting card: play disc, "Greeting", owner line, small waveform
    return (ctx, CW, CH, s, px, mg, p) => {
      const x = mg * px, y = mg * px, bw = p.w * px, bh = p.h * px;
      const col = s.col || C.ice;
      D.edge(ctx, px, mg, p.w, p.h, p.r, col, 0.5 + 0.4 * (s.hot || 0), 3);
      const cx = x + 0.07 * px, cy = y + bh / 2;
      D.stroke(ctx, () => { ctx.beginPath(); ctx.arc(cx, cy, 0.036 * px, 0, 7); }, { color: col, alpha: 0.9, lw: 3, glow: 16 });
      D.play(ctx, cx + 0.004 * px, cy, 0.034 * px, col, 0.95);
      D.text(ctx, "Greeting", x + 0.13 * px, cy - 0.022 * px, { size: 0.027 * px, weight: 600, fam: "p", align: "left", color: C.white, alpha: 0.48, glow: 0.027 * px * 0.07 });
      D.text(ctx, s.sub || "June  ·  0:04", x + 0.13 * px, cy + 0.024 * px, { size: 0.02 * px, weight: 500, align: "left", color: C.iceDim, alpha: 0.85, glow: 0 });
      const n = 16, wx0 = x + bw - 0.135 * px, wx1 = x + bw - 0.03 * px;
      for (let i = 0; i < n; i++) {
        const xx = wx0 + (i + 0.5) / n * (wx1 - wx0);
        const a = 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7 + 0.4) * Math.sin(i * 0.53 + 1.2));
        const played = s.ph != null && i / n < s.ph;
        const hh = a * 0.05 * px * (s.amp != null ? s.amp : 1);
        D.stroke(ctx, () => { ctx.beginPath(); ctx.moveTo(xx, cy - hh / 2); ctx.lineTo(xx, cy + hh / 2); }, { color: played ? (s.playCol || C.blue) : col, alpha: played ? 1 : 0.55, lw: 0.004 * px, glow: 10 });
      }
      if (s.warn > 0.01) { /* drawn by the separate warning label */ }
    };
  }

  // deep frosted glass under the voices (the source's dark cards): white text reads on it, the glow stays on the rim
  const ICE_GLASS = { color: "#86b4e6", emi: "#16304a", emiI: 1.0, opacity: 0.97, env: 0.5, rough: 0.4 };
  const AMB_GLASS = { color: "#e6a878", emi: "#2c1a0c", emiI: 1.0, opacity: 0.97, env: 0.5, rough: 0.4 };

  // ------------------------------------------------------------------ stations
  const S = [];
  const lightsAt = []; // per station: (t, k) -> lights

  // ===== S1 · WAVE — "I erase people's voices for a living. Voicemail, I mean."
  const A1 = A(0, 0, 0);
  const env1 = (i) => 0.18 + 0.82 * Math.pow(Math.abs(Math.sin(i * 0.77 + 0.3) * Math.sin(i * 0.31 + 1.1) + 0.25 * Math.sin(i * 2.3)), 0.8);
  const wave = G.panel({ w: 0.5, h: 0.3, r: 0.035, hdr: 2.7, cw: 1100,
    draw: (ctx, CW, CH, s, px, mg) => {
      D.edge(ctx, px, mg, 0.5, 0.3, 0.035, C.iceDim, 0.42, 3);
      const x0 = (mg + 0.045) * px, x1 = (mg + 0.455) * px, cy = (mg + 0.15) * px, n = 44;
      const bwid = (x1 - x0) / n * 0.46;
      if (s.m < 1) {
        for (let i = 0; i < n; i++) {
          const xx = x0 + (i + 0.5) / n * (x1 - x0);
          const er = (i + 0.5) / n < s.e;
          const hh = er ? 0.004 * px : env1(i) * 0.17 * px;
          D.stroke(ctx, () => { ctx.beginPath(); ctx.moveTo(xx, cy - hh / 2); ctx.lineTo(xx, cy + hh / 2); }, { color: er ? C.iceDim : C.amber, alpha: (er ? 0.55 : 1) * (1 - s.m), lw: bwid, glow: er ? 6 : 16 });
        }
        if (s.e > 0.001 && s.e < 0.999) {
          const hx = x0 + s.e * (x1 - x0);
          D.stroke(ctx, () => { ctx.beginPath(); ctx.moveTo(hx, cy - 0.11 * px); ctx.lineTo(hx, cy + 0.11 * px); }, { color: C.white, alpha: 1, lw: 4, glow: 30 });
        }
      }
      if (s.m > 0) {
        const k = easeO(s.m);
        D.voicemail(ctx, CW / 2, cy - 0.01 * px, 0.3 * px * (0.6 + 0.4 * k), C.amber, s.m, 0.013 * px);
        D.text(ctx, "VOICEMAIL", CW / 2, cy + 0.085 * px, { size: 0.02 * px, weight: 600, ls: 9, color: C.iceDim, alpha: k, fam: "p", glow: 0 });
      }
    } });
  PX(wave, A1.x, A1.y, A1.z);
  S.push({ name: "wave", on: [-9, 5.5], objs: () => [wave.g], A: A1, update(t) {
    const v = win(t, -1, 4.0, 0.5, 0.7);
    const e = q(sstep(0.12, L("l01").end, t), 60), m = q(fade(t, w("l02", "Voicemail") - 0.15, w("l02", "Voicemail") + 0.65), 30);
    wave.set({ e, m }, v);
  }, lights(t) {
    const v = win(t, -1, 4.1, 0.5, 0.8), m = fade(t, 2.7, 3.6);
    return [{ pos: add(A1, 0.12, 0.2, -0.45), color: C.amber, i: 3.2 * v * (1 - 0.3 * m), fog: 1.6 },
      { pos: add(A1, -0.5, 0.6, 1.0), color: "#a9c2ee", i: 1.6 * v, fog: 0.15 }];
  } });

  // ===== S2 · GRID + WIPE KEY + 300 — "When a mailbox fills up, I wipe it. Three hundred a day."
  const A2 = A(0.12, -0.04, -2.1);
  const tiles = [];
  const tileBase = [0.42, 0.66, 0.3, 0.55, 0.78, 0.36, 0.5, 0.71, 0.27, 0.62, 0.45, 0.58];
  const SPECIAL = 4;
  for (let i = 0; i < 12; i++) {
    const tw = 0.13, th = 0.088;
    const p = G.panel({ w: tw, h: th, r: 0.014, d: 0.022, margin: 0.025, hdr: 2.4, cw: 360,
      draw: (ctx, CW, CH, s, px, mg) => {
        const col = s.full ? C.amber : C.iceDim;
        D.edge(ctx, px, mg, tw, th, 0.014, s.flash > 0.05 ? C.white : col, 0.45 + 0.5 * Math.max(s.full ? 1 : 0, s.flash), 2.5);
        D.mailbox(ctx, (mg + 0.03) * px, (mg + 0.036) * px, 0.034 * px, col, 0.9);
        const bx = (mg + 0.058) * px, bw = 0.058 * px, by = (mg + 0.05) * px;
        D.fill(ctx, () => D.rr(ctx, bx, by, bw, 0.008 * px, 0.004 * px), { color: C.greyDim, alpha: 0.9 });
        if (s.f > 0.01) D.fill(ctx, () => D.rr(ctx, bx, by, bw * s.f, 0.008 * px, 0.004 * px), { color: s.full ? C.amber : C.ice, alpha: 0.95, glow: 10 });
        D.text(ctx, s.full ? "FULL" : Math.round(s.f * 40) + "/40", bx + bw, (mg + 0.03) * px, { size: 0.0145 * px, weight: 600, align: "right", color: s.full ? C.amber : C.iceDim, glow: 0, ls: 1 });
      } });
    const cx = (i % 3 - 1) * 0.145, cy = (1.5 - Math.floor(i / 3)) * 0.1 + 0.05;
    PX(p, A2.x + cx, A2.y + cy, A2.z);
    tiles.push(p);
  }
  const wipeKey = G.key({ w: 0.2, h: 0.08, label: "WIPE", size: 0.03 });
  wipeKey.g.position.set(A2.x, A2.y - 0.235, A2.z + 0.03);
  const big300 = G.panel({ w: 0.4, h: 0.2, noSlab: true, margin: 0.01, hdr: 1.7, cw: 1000,
    draw: (ctx, CW, CH, s, px) => {
      D.text(ctx, "300", CW / 2, CH * 0.42, { size: 0.12 * px, weight: 600, fam: "p", color: C.white, glowColor: C.ice, glow: 22, alpha: s.a });
      D.text(ctx, "A DAY", CW / 2, CH * 0.82, { size: 0.022 * px, weight: 600, fam: "p", ls: 10, color: C.iceDim, alpha: s.a, glow: 0 });
    } });
  big300.g.position.set(A2.x, A2.y + 0.07, A2.z + 0.09);
  S.push({ name: "grid", on: [2.6, 9.8], objs: () => [...tiles.map((p) => p.g), wipeKey.g, big300.g], A: A2, update(t) {
    const v = win(t, 3.9, 8.4, 0.5, 0.7);
    const tf = w("l03", "fills"), tw = w("l03", "wipe"), t300 = w("l04", "Three");
    const dim = 1 - 0.85 * fade(t, t300 - 0.1, t300 + 0.35);
    tiles.forEach((p, i) => {
      let f = tileBase[i], full = false, flash = 0;
      if (i === SPECIAL) {
        f = lerp(0.72, 1.0, fade(t, tf - 0.35, tf + 0.35));
        full = f > 0.985 && t < tw + 0.05;
        const dr = fade(t, tw + 0.02, tw + 0.42);
        f = f * (1 - dr) + 0.02 * dr;
        flash = Math.max(0, 1 - Math.abs(t - (tw + 0.12)) / 0.25);
      }
      const tc = t300 - 0.3 + ((i * 5) % 12) * 0.07; // the wipe cascade
      const ph = fade(t, tc, tc + 0.12) * (1 - fade(t, tc + 0.12, tc + 0.4));
      if (t > t300 - 0.35) { flash = Math.max(flash, ph); f = f * (1 - fade(t, tc, tc + 0.25)) + 0.04 * fade(t, tc, tc + 0.25); }
      p.set({ f: q(f, 40), full, flash: q(flash, 10) }, v * (i === SPECIAL ? 1 : dim) * (i === SPECIAL && t > t300 - 0.1 ? dim : 1));
    });
    const kp = Math.max(0, 1 - Math.abs(t - (tw + 0.06)) / 0.16);
    wipeKey.press(easeO(clamp(kp * 1.5, 0, 1)));
    wipeKey.set({ edge: kp > 0.1 ? C.white : C.iceDim, edgeA: 0.5 + 0.5 * kp }, v * dim);
    const a3 = fade(t, t300 - 0.05, t300 + 0.3);
    big300.g.scale.setScalar(0.94 + 0.06 * easeO(a3));
    big300.set({ a: 1 }, v * a3);
  }, lights(t) {
    const v = win(t, 3.9, 8.5, 0.6, 0.8);
    const tf = w("l03", "fills"), tw = w("l03", "wipe");
    const am = fade(t, tf - 0.2, tf + 0.3) * (1 - fade(t, tw, tw + 0.4));
    return [{ pos: add(A2, 0.05, 0.22, -0.45), color: "#9fbcf0", i: 2.4 * v, fog: 1.1 },
      { pos: add(A2, 0.0, 0.12, -0.25), color: C.amber, i: (0.2 + 1.8 * am) * v, fog: 1.4 }];
  } });

  // ===== S3 · LOCKED PLAY — "We're never allowed to listen."
  const A3 = A(-0.05, 0.05, -4.2);
  const playDraw = (R) => (ctx, CW, CH, s, px, mg) => {
    const col = s.col || C.iceDim;
    D.stroke(ctx, () => { ctx.beginPath(); ctx.arc(CW / 2, CH / 2, R * px - 4, 0, 7); }, { color: col, alpha: 0.6 + 0.4 * (s.hot || 0), lw: 3, glow: 20 });
    D.play(ctx, CW / 2 + 0.012 * px, CH / 2, R * 0.75 * px, col, s.pa != null ? s.pa : 0.45);
  };
  const play1 = G.panel({ w: 0.22, h: 0.22, r: 0.11, d: 0.04, margin: 0.03, hdr: 2.2, cw: 700, draw: playDraw(0.11) });
  PX(play1, A3.x, A3.y, A3.z);
  const lock1 = G.padlock({ s: 0.07 });
  lock1.g.position.set(A3.x + 0.07, A3.y - 0.07, A3.z + 0.035);
  const lab3 = labelPanel("PLAYBACK RESTRICTED", 0.44, 0.05, { k: 0.34, color: C.iceDim, ls: 5 });
  lab3.g.position.set(A3.x, A3.y - 0.17, A3.z + 0.01);
  S.push({ name: "lock1", on: [6.8, 12.0], objs: () => [play1.g, [lock1.g, 1], lab3.g], A: A3, update(t) {
    const v = win(t, 8.2, 10.6, 0.5, 0.7);
    const hot = fade(t, w("l05", "listen") - 0.2, w("l05", "listen") + 0.3);
    play1.set({ hot: 0, pa: 0.4 }, v);
    lock1.set({ open: 0, drop: 0, glow: (0.35 + 0.65 * hot) * v });
    lab3.set({ color: hot > 0.5 ? C.ice : C.iceDim }, v);
  }, lights(t) {
    const v = win(t, 8.2, 10.7, 0.6, 0.8);
    return [{ pos: add(A3, -0.05, 0.3, -0.4), color: "#9fbcf0", i: 2.0 * v, fog: 1.2 }, { pos: add(A3, 0.2, 0.15, -0.25), color: C.amber, i: 0.6 * v, fog: 0.4 }];
  } });

  // ===== S4 · LIST -> 412 -> unheard dots — "Last winter, one box wouldn't stop filling. 412 messages. None of them heard."
  const A4 = A(0.1, 0.0, -6.3);
  const ROWS = 11, RH = 0.05;
  const ids = Array.from({ length: ROWS + 8 }, (_, i) => `MBX ${String(4110 + i * 37).padStart(4, "0")}-${String((i * 53) % 97).padStart(2, "0")}`);
  const LH = 0.6;
  const list = G.panel({ w: 0.42, h: LH, r: 0.035, hdr: 2.3, cw: 900,
    draw: (ctx, CW, CH, s, px, mg) => {
      D.edge(ctx, px, mg, 0.42, LH, 0.035, C.iceDim, 0.35, 3);
      ctx.save();
      D.rr(ctx, mg * px + 6, mg * px + 6, 0.42 * px - 12, LH * px - 12, 0.03 * px); ctx.clip();
      const cy = (mg + LH / 2) * px;
      for (let k = 0; k < ids.length; k++) {
        const y = cy + ((k - 7) * RH + s.off) * px;
        if (y < mg * px - 0.03 * px || y > (mg + LH) * px + 0.03 * px) continue;
        const edgeFade = 1 - Math.pow(Math.abs(y - cy) / (LH * 0.52 * px), 3);
        const sp = k === 7;
        const col = sp && s.hl > 0 ? C.amber : C.iceDim;
        const a = Math.max(0, edgeFade) * (sp ? 1 : 0.75);
        if (sp && s.hl > 0) D.stroke(ctx, () => D.rr(ctx, (mg + 0.02) * px, y - RH * 0.42 * px, 0.38 * px, RH * 0.84 * px, 0.012 * px), { color: C.amber, alpha: 0.7 * s.hl, lw: 2.5, glow: 16 });
        D.fill(ctx, () => { ctx.beginPath(); ctx.arc((mg + 0.045) * px, y, 0.008 * px, 0, 7); }, { color: sp && s.hl > 0 ? C.amber : C.blue, alpha: a, glow: 10 });
        D.text(ctx, ids[k], (mg + 0.07) * px, y, { size: 0.019 * px, weight: 500, align: "left", color: col, alpha: a * 0.9, glow: 0 });
        const cnt = sp ? (s.cnt >= 412 ? "412" : String(s.cnt)) : String(20 + (k * 7) % 21) + "/40";
        D.text(ctx, cnt, (mg + 0.39) * px, y, { size: 0.019 * px, weight: 600, align: "right", color: sp && s.hl > 0 ? C.amber : col, alpha: a, glow: sp ? 12 : 0 });
      }
      ctx.restore();
    } });
  PX(list, A4.x, A4.y, A4.z);
  const big412 = G.panel({ w: 0.42, h: 0.2, noSlab: true, margin: 0.01, hdr: 2.0, cw: 1000,
    draw: (ctx, CW, CH, s, px) => {
      D.text(ctx, "412", CW / 2, CH * 0.42, { size: 0.125 * px, weight: 600, fam: "p", color: C.amberHot, glowColor: C.amber, glow: 26 });
      D.text(ctx, s.sub || "MESSAGES", CW / 2, CH * 0.84, { size: 0.021 * px, weight: 600, fam: "p", ls: 10, color: s.subCol || C.iceDim, glow: 0 });
    } });
  big412.g.position.set(A4.x, A4.y + 0.12, A4.z + 0.14);
  const unheard = G.dots({ n: 412, r: 0.0052 });
  unheard.g.position.set(A4.x, A4.y - 0.14, A4.z + 0.12);
  const UC = 21, UP = 0.0168;
  const uxy = (i) => [((i % UC) - (UC - 1) / 2) * UP, -(Math.floor(i / UC) - 9.5) * UP * 0.92];
  S.push({ name: "list", on: [9.0, 19.5], objs: () => [list.g, big412.g, [unheard.g, 1]], A: A4, update(t) {
    const v = win(t, 10.4, 18.0, 0.6, 0.8);
    const tOne = w("l06", "one"), tStop = w("l06", "stop"), t412 = w("l07", "Four"), tNone = w("l08", "None");
    const off = -RH * 6 * (1 - easeIO(fade(t, 10.4, tOne + 0.25)));
    const hl = fade(t, tOne - 0.1, tOne + 0.2);
    const cnt = Math.round(lerp(398, 412, fade(t, tStop - 0.2, L("l06").end + 0.1)));
    const d412 = fade(t, t412 - 0.15, t412 + 0.3);
    list.set({ off: q(off, 2000), hl: q(hl, 10), cnt }, v * (1 - 0.94 * d412));
    big412.g.scale.setScalar(0.92 + 0.08 * easeO(d412));
    big412.set({ sub: t > tNone - 0.1 ? "UNHEARD" : "MESSAGES", subCol: t > tNone - 0.1 ? C.blue : C.iceDim }, v * d412);
    const dv = v * fade(t, tNone - 0.3, tNone);
    unheard.g.visible = dv > 0.01;
    if (unheard.g.visible) unheard.set((i) => {
      const [x, y] = uxy(i);
      const rr = Math.hypot(x, y * 1.2) / 0.2;
      const ti = tNone - 0.25 + rr * 0.75;
      const k = easeO(fade(t, ti, ti + 0.22));
      return [x, y, 0, k, C.blue, 2.4 * dv * (0.75 + 0.25 * Math.sin(i * 1.7 + t * 2.0))];
    });
  }, lights(t) {
    const v = win(t, 10.4, 18.1, 0.6, 0.8);
    const tOne = w("l06", "one"), t412 = w("l07", "Four");
    return [{ pos: add(A4, 0.0, 0.25, -0.5), color: C.amber, i: (0.5 + 2.6 * fade(t, tOne - 0.2, t412 + 0.3)) * v, fog: 1.5 },
      { pos: add(A4, -0.4, 0.65, 1.50), color: "#a9c2ee", i: 1.65 * v, fog: 0.2 }];
  } });

  // ===== S5 · SAME NUMBER — "All from one number."
  const A5 = A(-0.08, 0.08, -8.4);
  const pill = G.panel({ w: 0.42, h: 0.075, r: 0.0375, d: 0.024, margin: 0.025, hdr: 2.3, cw: 900,
    draw: (ctx, CW, CH, s, px, mg) => {
      D.edge(ctx, px, mg, 0.42, 0.075, 0.0375, C.iceDim, 0.55, 3);
      D.phone(ctx, (mg + 0.04) * px, CH / 2, 0.032 * px, C.ice, 0.95);
      D.text(ctx, "555-0148", (mg + 0.075) * px, CH / 2, { size: 0.03 * px, weight: 500, align: "left", color: C.white, ls: 2, glowColor: C.ice });
      D.text(ctx, "VOICEMAIL", (mg + 0.355) * px, CH / 2, { size: 0.0145 * px, weight: 600, align: "right", color: C.iceDim, ls: 4, glow: 0 });
      D.fill(ctx, () => { ctx.beginPath(); ctx.arc((mg + 0.385) * px, CH / 2, 0.008 * px, 0, 7); }, { color: C.blue, glow: 12 });
    } });
  PX(pill, A5.x, A5.y, A5.z);
  const pills = [pill];
  for (let i = 1; i < 9; i++) {
    const s = pill.slab.clone(), f = pill.face.clone();
    const gg = new T.Group(); gg.add(s); gg.add(f); G.scene.add(gg);
    gg.position.set(A5.x - i * 0.03, A5.y + i * 0.05, A5.z - i * 0.22);
    pills.push({ g: gg, face: f });
  }
  S.push({ name: "pills", on: [16.4, 21.4], objs: () => pills.map((p) => p.g), A: A5, update(t) {
    const v = win(t, 17.8, 19.9, 0.6, 0.7);
    pill.set({}, v);
    pills.forEach((p, i) => { if (i) p.face.visible = v > 0.002; });
  }, lights(t) {
    const v = win(t, 17.8, 20.0, 0.6, 0.8);
    return [{ pos: add(A5, -0.3, 0.45, -1.0), color: "#9fbcf0", i: 2.8 * v, fog: 1.4 }, { pos: add(A5, 0.3, 0.45, 1.10), color: "#a9c2ee", i: 0.88 * v, fog: 0.2 }];
  } });

  // ===== S6 · CLOCK — "Every Sunday. Six p.m."
  const A6 = A(0.1, 0.0, -10.5);
  const clk = G.clock({ r: 0.15 });
  clk.g.position.set(A6.x, A6.y + 0.03, A6.z);
  const sun = G.panel({ w: 0.11, h: 0.055, r: 0.014, d: 0.02, margin: 0.02, hdr: 2.5, cw: 360,
    draw: (ctx, CW, CH, s, px, mg) => { const col = s.on ? C.amber : C.iceDim; D.edge(ctx, px, mg, 0.11, 0.055, 0.014, col, 0.5 + 0.4 * s.on, 2.5); D.text(ctx, "SUN", CW / 2, CH / 2, { size: 0.026 * px, weight: 600, fam: "p", ls: 5, color: s.on ? C.amberHot : C.iceDim, glow: s.on ? 14 : 0 }); } });
  PX(sun, A6.x + 0.17, A6.y + 0.235, A6.z + 0.02);
  const six = labelPanel("6:00 PM", 0.3, 0.06, { k: 0.62, color: C.amberHot, ls: 6, hdr: 2.6 });
  six.g.position.set(A6.x, A6.y - 0.18, A6.z + 0.02);
  S.push({ name: "clock", on: [18.3, 24.0], objs: () => [clk.g, sun.g, six.g], A: A6, update(t) {
    const v = win(t, 19.7, 22.4, 0.6, 0.7);
    const tSun = w("l10", "Sunday"), tSix = w("l10", "Six");
    const u = fade(t, 19.6, tSix + 0.05);
    const hrs = lerp(2.55, 6.0, easeO(u));
    clk.set({ h: hrs, glow: v * (0.55 + 0.45 * fade(t, tSix - 0.1, tSix + 0.2)) });
    clk.g.visible = true;
    sun.set({ on: t > tSun - 0.05 ? 1 : 0 }, v);
    const s6 = fade(t, tSix - 0.05, tSix + 0.3);
    six.set({}, v * s6);
  }, lights(t) {
    const v = win(t, 19.7, 22.5, 0.6, 0.8);
    const tSix = w("l10", "Six");
    return [{ pos: add(A6, 0.02, 0.18, -0.4), color: C.amber, i: (1.8 + 1.8 * fade(t, tSix - 0.2, tSix + 0.4)) * v, fog: 1.8 },
      { pos: add(A6, -0.4, 0.85, 1.40), color: "#b8ccee", i: 1.54 * v, fog: 0.15 }];
  } });

  // ===== S7 · WEEKS WALL — "Four hundred and twelve Sundays."
  const A7 = A(-0.06, 0.05, -12.6);
  const WC = 26, WR = 16, WP = 0.0152;
  const weeks = G.dots({ n: WC * WR, r: 0.0056, square: true });
  weeks.g.position.set(A7.x, A7.y, A7.z);
  weeks.g.rotation.y = -0.38;
  const wxy = (i) => { const c = i % WC, r = Math.floor(i / WC); return [(c - (WC - 1) / 2) * WP, -(r - (WR - 1) / 2) * WP - Math.floor(r / 2) * 0.006 + 0.024]; };
  const lab7 = labelPanel("412 SUNDAYS", 0.34, 0.05, { k: 0.5, color: C.amberHot, ls: 10, hdr: 2.4 });
  lab7.g.position.set(A7.x - 0.02, A7.y + 0.19, A7.z + 0.01);
  lab7.g.rotation.y = -0.38;
  const lab7b = labelPanel("ALMOST 8 YEARS", 0.34, 0.04, { k: 0.5, color: C.iceDim, ls: 9 });
  lab7b.g.position.set(A7.x - 0.02, A7.y - 0.16, A7.z + 0.01);
  lab7b.g.rotation.y = -0.38;
  S.push({ name: "weeks", on: [20.8, 26.5], objs: () => [[weeks.g, 1], lab7.g, lab7b.g], A: A7, update(t) {
    const v = win(t, 22.2, 25.0, 0.6, 0.7);
    const t0 = L("l11").start - 0.1, t1 = L("l11").end + 0.1;
    const lit = 412 * easeIO(fade(t, t0, t1));
    weeks.g.visible = v > 0.005;
    if (weeks.g.visible) weeks.set((i) => {
      const [x, y] = wxy(i);
      const on = i < lit;
      const fresh = on ? Math.max(0, 1 - (lit - i) / 25) : 0;
      return [x, y, 0, 1, on ? C.amber : C.iceDim, v * (on ? 1.05 + 2.2 * fresh : 0.55)];
    });
    lab7.set({}, v * fade(t, t0 + 0.4, t0 + 0.9));
    lab7b.set({}, v * fade(t, t1 - 0.6, t1));
  }, lights(t) {
    const v = win(t, 22.2, 25.1, 0.6, 0.8);
    return [{ pos: add(A7, 0.1, 0.2, -0.45), color: C.amber, i: 2.4 * v, fog: 1.5 }, { pos: add(A7, -0.4, 0.75, 1.40), color: "#a9c2ee", i: 1.10 * v, fog: 0.15 }];
  } });

  // ===== S8 · JUNE + BILL — "The box belonged to a woman named June. June died eight years ago. Someone still paid her bill."
  const A8 = A(0.08, 0.0, -14.7);
  const june = G.panel({ w: 0.4, h: 0.44, r: 0.035, hdr: 1.9, cw: 900,
    draw: (ctx, CW, CH, s, px, mg) => {
      D.edge(ctx, px, mg, 0.4, 0.44, 0.035, C.iceDim, 0.38, 3);
      D.text(ctx, "MAILBOX OWNER", CW / 2, (mg + 0.045) * px, { size: 0.016 * px, weight: 600, fam: "p", ls: 8, color: C.iceDim, glow: 0 });
      const ring = s.dead > 0.5 ? "#8fa0bd" : C.amber;
      D.avatar(ctx, CW / 2, (mg + 0.16) * px, 0.085 * px, ring, 1 - 0.3 * s.dead, "she");
      D.text(ctx, "June", CW / 2, (mg + 0.3) * px, { size: 0.05 * px, weight: 600, fam: "p", color: C.white, glowColor: C.ice, glow: 12 });
      if (s.dates > 0) D.text(ctx, "1941  —  2018", CW / 2, (mg + 0.36) * px, { size: 0.024 * px, weight: 500, color: C.iceDim, alpha: s.dates, glow: 0, ls: 2 });
    } });
  PX(june, A8.x, A8.y, A8.z);
  const bill = G.paper({ w: 0.21, h: 0.28, cw: 640, draw: (ctx, CW, CH) => {
    ctx.fillStyle = "#e9e4d8"; ctx.fillRect(0, 0, CW, CH);
    const r = G.rng(5);
    for (let i = 0; i < 2600; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? "120,110,95" : "255,255,250"},${0.04 + r() * 0.06})`; ctx.fillRect(r() * CW, r() * CH, 1 + r() * 2, 1); }
    ctx.fillStyle = "#3b3a3a"; ctx.font = `600 ${CW * 0.06}px GPoppins, Arial`; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText("MONTHLY STATEMENT", CW * 0.08, CH * 0.08);
    ctx.font = `500 ${CW * 0.04}px GInter, Arial`; ctx.fillStyle = "#6a6764";
    ctx.fillText("Line: June  ·  voicemail plan", CW * 0.08, CH * 0.15);
    ctx.fillRect(CW * 0.08, CH * 0.19, CW * 0.84, 2);
    const mo = ["JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN"];
    mo.forEach((m, i) => {
      const y = CH * (0.26 + i * 0.085);
      ctx.fillStyle = "#4a4846"; ctx.font = `500 ${CW * 0.045}px GInter, Arial`; ctx.textAlign = "left"; ctx.fillText(m, CW * 0.1, y);
      ctx.fillStyle = "#9a958f"; ctx.fillText("· · · · · · · · ·", CW * 0.27, y);
      ctx.save(); ctx.translate(CW * 0.76, y); ctx.rotate(-0.12 + (i % 3) * 0.06);
      ctx.strokeStyle = "rgba(214,110,40,0.85)"; ctx.lineWidth = 3; D.rr(ctx, -CW * 0.1, -CH * 0.026, CW * 0.2, CH * 0.052, 6); ctx.stroke();
      ctx.fillStyle = "rgba(214,110,40,0.9)"; ctx.font = `700 ${CW * 0.045}px GPoppins, Arial`; ctx.textAlign = "center"; ctx.fillText("PAID", 0, 2);
      ctx.restore();
    });
  } });
  bill.set({});
  S.push({ name: "june", on: [23.4, 33.4], objs: () => [june.g, [bill.g, 1]], A: A8, update(t) {
    const v = win(t, 24.8, 31.9, 0.6, 0.8);
    const tDied = w("l14", "died"), tBill = L("l15").start;
    june.set({ dead: q(fade(t, tDied - 0.1, tDied + 0.5), 10), dates: q(fade(t, tDied + 0.1, tDied + 0.6), 10) }, v * (1 - 0.35 * fade(t, tBill, tBill + 0.5)));
    // the bill pops in where it rests (a short slide from the left, never through the caption band or the frame edge)
    const u = easeO(fade(t, tBill - 0.35, tBill + 0.3));
    bill.g.visible = u > 0.001 && t < 33.5;
    pop(bill.g, t, tBill - 0.35);
    bill.g.position.set(A8.x + 0.15 - 0.05 * (1 - u), A8.y - 0.1, A8.z + 0.14);
    bill.g.rotation.set(-0.06, -0.3 + 0.1 * (1 - u), -0.07 - 0.06 * (1 - u));
  }, lights(t) {
    const v = win(t, 24.8, 32.0, 0.6, 0.8);
    const tDied = w("l14", "died"), tBill = L("l15").start;
    const cold = fade(t, tDied - 0.2, tDied + 0.8);
    return [{ pos: add(A8, 0.0, 0.25, -0.45), color: cold > 0.5 ? "#9fb6e6" : C.amber, i: (2.6 - 0.8 * cold) * v, fog: 1.4 },
      { pos: add(A8, 0.45, 0.4, 0.9), color: "#ffcf9e", i: (0.6 + 2.2 * fade(t, tBill - 0.3, tBill + 0.3)) * v, fog: 0.25 }];
  } });

  // ===== S9 · NINE SECONDS column — "Every message was nine seconds long."
  const A9 = A(-0.05, 0.0, -16.8);
  const C9H = 0.54;
  const col9 = G.panel({ w: 0.36, h: C9H, r: 0.035, hdr: 2.3, cw: 900,
    draw: (ctx, CW, CH, s, px, mg) => {
      D.edge(ctx, px, mg, 0.36, C9H, 0.035, C.iceDim, 0.35, 3);
      ctx.save(); D.rr(ctx, mg * px + 6, mg * px + 6, 0.36 * px - 12, C9H * px - 12, 0.03 * px); ctx.clip();
      const cy = (mg + C9H / 2) * px;
      for (let k = -8; k <= 8; k++) {
        const y = cy + (k * 0.042 + s.off) * px;
        const ef = Math.max(0, 1 - Math.pow(Math.abs(y - cy) / (C9H * 0.52 * px), 2.2));
        const hl = k === 0;
        if (hl) D.stroke(ctx, () => D.rr(ctx, (mg + 0.02) * px, y - 0.019 * px, 0.32 * px, 0.038 * px, 0.01 * px), { color: C.amber, alpha: 0.6 * s.hl, lw: 2.5, glow: 14 });
        D.text(ctx, "SUN  6:00 PM", (mg + 0.04) * px, y, { size: 0.017 * px, weight: 500, align: "left", color: C.iceDim, alpha: ef * 0.75, glow: 0 });
        D.text(ctx, "0:09", (mg + 0.32) * px, y, { size: 0.026 * px, weight: 600, fam: "p", align: "right", color: hl && s.hl > 0.5 ? C.amberHot : C.white, alpha: ef, glow: 14, glowColor: hl ? C.amber : C.ice });
      }
      ctx.restore();
    } });
  PX(col9, A9.x, A9.y, A9.z);
  S.push({ name: "nine", on: [30.3, 36.2], objs: () => [col9.g], A: A9, update(t) {
    const v = win(t, 31.7, 34.7, 0.6, 0.7);
    const t9 = w("l16", "nine");
    col9.set({ off: q(-0.042 * 3 * (1 - easeIO(fade(t, 31.6, t9 + 0.2))), 2000), hl: q(fade(t, t9 - 0.1, t9 + 0.3), 10) }, v);
  }, lights(t) {
    const v = win(t, 31.7, 34.8, 0.6, 0.8);
    return [{ pos: add(A9, 0.0, 0.25, -0.45), color: "#9fbcf0", i: 2.4 * v, fog: 1.3 }, { pos: add(A9, 0.12, 0.05, -0.3), color: C.amber, i: 0.8 * v, fog: 0.5 }];
  } });

  // ===== S9b · the 9-second track — "Nobody says much in nine seconds."
  const A9b = A(0.1, -0.04, -18.6);
  const track = G.panel({ w: 0.46, h: 0.17, r: 0.03, hdr: 2.4, cw: 1000,
    draw: (ctx, CW, CH, s, px, mg) => {
      D.edge(ctx, px, mg, 0.46, 0.17, 0.03, C.iceDim, 0.42, 3);
      const x0 = (mg + 0.04) * px, x1 = (mg + 0.42) * px, cy = (mg + 0.085) * px;
      D.text(ctx, "MESSAGE 412 OF 412", x0, (mg + 0.03) * px, { size: 0.0145 * px, weight: 600, fam: "p", ls: 6, align: "left", color: C.iceDim, glow: 0 });
      // mostly silence: a flat line with a small breath and a short burst near the end
      ctx.save();
      const N = 160;
      for (let i = 0; i < N; i++) {
        const u = i / (N - 1), xx = x0 + u * (x1 - x0);
        let a = 0.012 + 0.006 * Math.abs(Math.sin(i * 2.1));
        if (u > 0.36 && u < 0.42) a += 0.03 * Math.sin((u - 0.36) / 0.06 * Math.PI);
        if (u > 0.64 && u < 0.86) a += 0.11 * Math.pow(Math.abs(Math.sin(i * 0.9) * Math.sin((u - 0.64) / 0.22 * Math.PI)), 0.7);
        const hh = a * px * 0.55;
        D.stroke(ctx, () => { ctx.beginPath(); ctx.moveTo(xx, cy - hh); ctx.lineTo(xx, cy + hh); }, { color: u > 0.6 ? C.amber : C.iceDim, alpha: u > 0.6 ? 0.95 : 0.6, lw: 2.2, glow: u > 0.6 ? 8 : 0 });
      }
      ctx.restore();
      D.text(ctx, "0:00", x0, (mg + 0.145) * px, { size: 0.016 * px, weight: 500, align: "left", color: C.iceDim, glow: 0 });
      D.text(ctx, "0:09", x1, (mg + 0.145) * px, { size: 0.016 * px, weight: 600, align: "right", color: C.ice, glow: 0 });
      D.fill(ctx, () => { ctx.beginPath(); ctx.arc(x0, cy, 0.008 * px, 0, 7); }, { color: C.white, glow: 14 });
    } });
  PX(track, A9b.x, A9b.y, A9b.z);
  S.push({ name: "track", on: [33.2, 38.6], objs: () => [track.g], A: A9b, update(t) {
    const v = win(t, 34.6, 37.1, 0.6, 0.7);
    track.set({}, v);
  }, lights(t) {
    const v = win(t, 34.6, 37.2, 0.6, 0.8);
    return [{ pos: add(A9b, 0.1, 0.2, -0.4), color: "#9fbcf0", i: 2.0 * v, fog: 1.2 }, { pos: add(A9b, 0.15, 0.0, -0.3), color: C.amber, i: 0.7 * v, fog: 0.5 }];
  } });

  // ===== S10 · WIPE toggle + greeting warning — "I was supposed to wipe it. A wipe erases her greeting, too."
  const A10 = A(-0.05, 0.0, -20.5);
  const tog10 = G.toggle({ w: 0.2, h: 0.09, label: "WIPE BOX" });
  tog10.g.position.set(A10.x, A10.y - 0.13, A10.z + 0.02);
  const greet10 = G.panel({ w: 0.42, h: 0.15, r: 0.03, hdr: 2.4, cw: 1000, glass: ICE_GLASS, draw: greetingDraw() });
  PX(greet10, A10.x, A10.y + 0.16, A10.z);
  const warn10 = G.panel({ w: 0.42, h: 0.05, noSlab: true, margin: 0.01, hdr: 2.5, cw: 1000,
    draw: (ctx, CW, CH, s, px) => { D.warn(ctx, CW * 0.2, CH / 2, 0.03 * px, C.amber, 1); D.text(ctx, "ERASED WITH THE BOX", CW * 0.24, CH / 2, { size: 0.019 * px, weight: 600, fam: "p", ls: 6, align: "left", color: C.amberHot }); } });
  warn10.g.position.set(A10.x, A10.y + 0.045, A10.z + 0.01);
  const cursor = (() => { // a glowing pointer arrow (extruded)
    const s = new T.Shape(); s.moveTo(0, 0); s.lineTo(0, -0.04); s.lineTo(0.011, -0.03); s.lineTo(0.019, -0.047); s.lineTo(0.026, -0.043); s.lineTo(0.018, -0.027); s.lineTo(0.031, -0.026); s.closePath();
    const m = G.M(new T.ExtrudeGeometry(s, { depth: 0.004, bevelEnabled: false }), G.emissive(C.white, 2.2));
    return m;
  })();
  S.push({ name: "wipe", on: [35.6, 43.2], objs: () => [tog10.g, greet10.g, warn10.g, [cursor, 1]], A: A10, update(t) {
    const v = win(t, 37.0, 41.7, 0.6, 0.7);
    const tW = w("l18", "wipe"), tEr = w("l19", "erases");
    tog10.set({ on: 0, labelColor: C.ice }, v);
    const u = easeIO(fade(t, L("l18").start - 0.2, tW + 0.25));
    cursor.visible = v > 0.01;
    cursor.position.set(A10.x + lerp(0.2, -0.035, u) + 0.004 * Math.sin(t * 3), A10.y + lerp(-0.32, -0.125, u), A10.z + 0.06);
    G.setEmi(cursor.material, C.white, 2.2 * v * (1 - fade(t, tEr - 0.4, tEr)));
    const hot = fade(t, tEr - 0.15, tEr + 0.3);
    pop(greet10.g, t, L("l19").start - 0.2);
    greet10.set({ hot: q(hot, 10), col: C.ice }, v * fade(t, L("l19").start - 0.2, L("l19").start + 0.15));
    warn10.set({}, v * hot);
  }, lights(t) {
    const v = win(t, 37.0, 41.8, 0.6, 0.8);
    const tEr = w("l19", "erases");
    return [{ pos: add(A10, 0.0, 0.3, -0.45), color: "#9fbcf0", i: 2.2 * v, fog: 1.2 },
      { pos: add(A10, 0.12, 0.12, -0.3), color: C.amber, i: 1.6 * fade(t, tEr - 0.2, tEr + 0.4) * v, fog: 0.8 }];
  } });

  // ===== S11 · RULE BREAK — "So I did something I'm not allowed to do. I pressed play."
  const A11 = A(0.08, 0.05, -22.6);
  const play2 = G.panel({ w: 0.26, h: 0.26, r: 0.13, d: 0.045, margin: 0.035, hdr: 2.4, cw: 760, draw: playDraw(0.13) });
  PX(play2, A11.x, A11.y, A11.z);
  const lock2 = G.padlock({ s: 0.085 });
  lock2.g.position.set(A11.x, A11.y - 0.035, A11.z + 0.05);
  const lab11 = labelPanel("RESTRICTED", 0.3, 0.05, { k: 0.5, color: C.ice, ls: 12 });
  lab11.g.position.set(A11.x, A11.y + 0.19, A11.z + 0.01);
  S.push({ name: "lock2", on: [40.1, 47.8], objs: () => [play2.g, [lock2.g, 1], lab11.g], A: A11, update(t) {
    const v = win(t, 41.5, 46.3, 0.6, 0.6);
    const tPr = w("l21", "pressed"), tPl = w("l21", "play");
    const op = fade(t, tPr - 0.05, tPr + 0.3), dr = fade(t, tPr + 0.25, tPr + 1.0);
    lock2.set({ open: op, drop: dr * dr, glow: v * (0.7 + 0.3 * Math.sin(t * 2.0)) * (1 - dr) });
    const pk = Math.max(0, 1 - Math.abs(t - (tPl + 0.05)) / 0.18);
    play2.g.position.z = A11.z - 0.008 * easeO(clamp(pk * 1.6, 0, 1));
    const hot = fade(t, tPl - 0.05, tPl + 0.2);
    play2.set({ hot: q(hot, 10), pa: q(0.4 + 0.6 * hot, 10), col: hot > 0.5 ? C.amber : C.iceDim }, v);
    lab11.set({}, v * (1 - fade(t, tPr, tPr + 0.4)));
  }, lights(t) {
    const v = win(t, 41.5, 46.4, 0.6, 0.8);
    const tPl = w("l21", "play");
    const hot = fade(t, tPl - 0.05, tPl + 0.5);
    return [{ pos: add(A11, 0.0, 0.25, -0.45), color: hot > 0.3 ? C.amber : "#9fbcf0", i: (2.0 + 1.6 * hot) * v, fog: 1.4 + 0.8 * hot },
      { pos: add(A11, -0.3, 0.65, 1.20), color: "#b8ccee", i: 1.43 * v, fog: 0.15 }];
  } });

  // ===== S12 · HIS MESSAGE — m1 "Hi, June. Just wanted to hear you." then l22 "He wasn't calling to say anything."
  const A12 = A(-0.06, 0.02, -24.7);
  const env = V.env || {};
  const player = G.panel({ w: 0.44, h: 0.17, r: 0.03, hdr: 2.4, cw: 1000,
    draw: (ctx, CW, CH, s, px, mg) => {
      D.edge(ctx, px, mg, 0.44, 0.17, 0.03, C.iceDim, 0.45, 3);
      const x0 = (mg + 0.035) * px, x1 = (mg + 0.405) * px, cy = (mg + 0.095) * px;
      D.text(ctx, "555-0148", x0, (mg + 0.03) * px, { size: 0.019 * px, weight: 600, fam: "p", align: "left", color: C.white, glow: 0 });
      D.text(ctx, "SUN  ·  6:00 PM", x1, (mg + 0.03) * px, { size: 0.015 * px, weight: 500, align: "right", color: C.iceDim, glow: 0 });
      const e = env.m1 || [];
      const N = 120;
      for (let i = 0; i < N; i++) {
        const u = i / (N - 1), xx = x0 + u * (x1 - x0);
        const ev = e.length ? e[Math.min(e.length - 1, Math.floor(u * e.length))] : 0.1;
        const hh = (0.003 + 0.05 * ev) * px;
        const played = u <= s.ph;
        D.stroke(ctx, () => { ctx.beginPath(); ctx.moveTo(xx, cy - hh / 2); ctx.lineTo(xx, cy + hh / 2); }, { color: played ? C.amber : C.iceDim, alpha: played ? 1 : 0.5, lw: 2.6, glow: played ? 10 : 0 });
      }
      const hx = x0 + s.ph * (x1 - x0);
      D.fill(ctx, () => { ctx.beginPath(); ctx.arc(hx, cy, 0.008 * px, 0, 7); }, { color: C.white, glow: 16 });
      D.text(ctx, s.tc, x0, (mg + 0.148) * px, { size: 0.015 * px, weight: 600, align: "left", color: C.amberHot, glow: 0 });
      D.text(ctx, "0:09", x1, (mg + 0.148) * px, { size: 0.015 * px, weight: 500, align: "right", color: C.iceDim, glow: 0 });
    } });
  PX(player, A12.x, A12.y + 0.13, A12.z);
  const B1 = "Hi, June. Just wanted to hear you.";
  const bub12 = G.panel({ w: 0.46, h: 0.15, r: 0.03, hdr: 2.6, cw: 1000, glass: AMB_GLASS, draw: bubbleDraw(B1, "l", C.amber, 0.034) });
  PX(bub12, A12.x, A12.y - 0.07, A12.z + 0.05);
  S.push({ name: "msg", on: [44.7, 54.6], objs: () => [player.g, bub12.g], A: A12, update(t) {
    const v = win(t, 46.1, 53.1, 0.6, 0.7);
    const m1 = L("m1");
    // the 9-second message: the playhead starts at 0:04 (the silent part) when play is pressed and ends at 0:09
    const ph = lerp(4 / 9, 1, fade(t, w("l21", "play") + 0.1, m1.end + 0.35));
    const tc = "0:0" + Math.min(9, Math.floor(ph * 9 + 1e-6));
    const grey = fade(t, L("l22").start - 0.1, L("l22").start + 0.6);
    player.set({ ph: q(ph, 240), tc }, v * (1 - 0.5 * grey));
    pop(bub12.g, t, m1.start - 0.4);
    bub12.set({ rev: revealOf("m1", t, 7), col: grey > 0.5 ? C.grey : C.amber, fill: 1 - 0.6 * grey }, v * fade(t, m1.start - 0.4, m1.start - 0.1) * (1 - 0.35 * grey));
  }, lights(t) {
    const v = win(t, 46.1, 53.2, 0.6, 0.8);
    const grey = fade(t, L("l22").start - 0.1, L("l22").start + 0.8);
    return [{ pos: add(A12, 0.05, 0.2, -0.45), color: C.amber, i: (2.8 - 1.4 * grey) * v, fog: 1.6 - 0.6 * grey },
      { pos: add(A12, -0.35, 0.65, 1.30), color: "#b8ccee", i: 1.32 * v, fog: 0.15 }];
  } });

  // ===== S13 · TWIST — l23 "He was calling to hear this." g1 "Hi, it's June. Leave me something nice."
  const A13 = A(0.08, 0.05, -26.8);
  const greet13 = G.panel({ w: 0.42, h: 0.15, r: 0.03, hdr: 2.5, cw: 1000, glass: ICE_GLASS, draw: greetingDraw() });
  PX(greet13, A13.x, A13.y + 0.12, A13.z);
  const B2 = "Hi, it's June. Leave me something nice.";
  const bub13 = G.panel({ w: 0.46, h: 0.15, r: 0.03, hdr: 2.6, cw: 1000, glass: ICE_GLASS, draw: bubbleDraw(B2, "r", C.ice, 0.034) });
  PX(bub13, A13.x, A13.y - 0.09, A13.z + 0.05);
  S.push({ name: "greet", on: [51.5, 60.0], objs: () => [greet13.g, bub13.g], A: A13, update(t) {
    const v = win(t, 52.9, 58.5, 0.6, 0.7);
    const g1 = L("g1");
    const ph = fade(t, g1.start - 0.1, g1.end + 0.1);
    greet13.set({ hot: q(fade(t, w("l23", "this") - 0.2, w("l23", "this") + 0.3), 10), ph: q(ph, 22), col: C.ice, playCol: C.blue, sub: "June  ·  0:04" }, v);
    pop(bub13.g, t, g1.start - 0.4);
    bub13.set({ rev: revealOf("g1", t, 7) }, v * fade(t, g1.start - 0.4, g1.start - 0.1));
  }, lights(t) {
    const v = win(t, 52.9, 58.6, 0.6, 0.8);
    const g1 = L("g1");
    return [{ pos: add(A13, 0.0, 0.2, -0.45), color: "#bcd4ff", i: (1.8 + 1.4 * fade(t, g1.start - 0.4, g1.start + 0.4)) * v, fog: 1.6 },
      { pos: add(A13, 0.3, 0.55, 1.20), color: "#d8e6ff", i: 1.10 * v, fog: 0.15 }];
  } });

  // ===== S14 · EVERY SUNDAY — a column of identical amber bubbles receding into the fog
  const A14 = A(-0.04, 0.0, -28.9);
  const B3 = "Just wanted to hear you.";
  const sb = G.panel({ w: 0.42, h: 0.085, r: 0.026, d: 0.022, margin: 0.03, hdr: 2.4, cw: 900, glass: AMB_GLASS, draw: bubbleDraw(B3, "l", C.amber, 0.025) });
  PX(sb, A14.x, A14.y, A14.z);
  const stack = [];
  for (let i = 1; i < 26; i++) {
    const s = sb.slab.clone(), f = sb.face.clone();
    const gg = new T.Group(); gg.add(s); gg.add(f); G.scene.add(gg);
    gg.position.set(A14.x - i * 0.018, A14.y + i * 0.03, A14.z - i * 0.21);
    gg.rotation.y = 0.05 * Math.sin(i * 1.3);
    stack.push(f);
  }
  S.push({ name: "stack", on: [56.9, 62.7], objs: () => [sb.g, ...stack.map((f) => f.parent)], A: A14, update(t) {
    const v = win(t, 58.3, 61.2, 0.6, 0.6);
    sb.set({}, v);
    stack.forEach((f) => { f.visible = v > 0.002; });
  }, lights(t) {
    const v = win(t, 58.3, 61.3, 0.6, 0.8);
    const u = fade(t, 59.4, 61.0);
    return [{ pos: add(A14, -0.25 - 0.4 * u, 0.25 + 0.2 * u, -0.6 - 1.2 * u), color: C.amber, i: 2.6 * v, fog: 1.7 }, { pos: add(A14, 0.2, 0.55, 1.20), color: "#ffd6a8", i: 0.99 * v, fog: 0.2 }];
  } });

  // ===== S15 · STRANGER — l25 "Wipe it, and next Sunday he gets a stranger."
  const A15 = A(0.08, 0.0, -31.4);
  const B4 = "The person you are calling is not available.";
  const strDraw = bubbleDraw(B2, "r", C.ice, 0.034), strDraw2 = bubbleDraw(B4, "r", C.grey, 0.031);
  const bub15 = G.panel({ w: 0.46, h: 0.15, r: 0.03, hdr: 2.6, cw: 1000, glass: ICE_GLASS,
    draw: (ctx, CW, CH, s, px, mg, o) => {
      if (s.g > 0.001 && s.g < 0.999) { // glitch: draw both, offset in horizontal slices
        const tmp = document.createElement("canvas"); tmp.width = CW; tmp.height = CH;
        const tc = tmp.getContext("2d");
        (s.f % 2 ? strDraw2 : strDraw)(tc, CW, CH, { textCol: s.f % 2 ? C.iceDim : C.white }, px, mg, o);
        const r = G.rng(1 + s.f * 7);
        for (let y = 0; y < CH; y += 18) { const dx = (r() - 0.5) * 60 * (r() < 0.4 ? 1 : 0.1); ctx.drawImage(tmp, 0, y, CW, 18, dx, y, CW, 18); }
      } else if (s.g >= 0.999) strDraw2(ctx, CW, CH, { textCol: "#b9c2d2" }, px, mg, o);
      else strDraw(ctx, CW, CH, {}, px, mg, o);
    } });
  PX(bub15, A15.x, A15.y + 0.03, A15.z);
  const lab15 = labelPanel("DEFAULT GREETING", 0.36, 0.045, { k: 0.48, color: C.grey, ls: 9 });
  lab15.g.position.set(A15.x, A15.y + 0.16, A15.z + 0.01);
  S.push({ name: "stranger", on: [59.5, 65.8], objs: () => [bub15.g, lab15.g], A: A15, update(t) {
    const v = win(t, 60.9, 64.3, 0.6, 0.7);
    const tS = w("l25", "stranger");
    const g = fade(t, tS - 0.25, tS + 0.2);
    bub15.set({ g: q(g, 20), f: Math.floor(t * 15) % 4 }, v);
    lab15.set({}, v * fade(t, tS + 0.1, tS + 0.5));
  }, lights(t) {
    const v = win(t, 60.9, 64.4, 0.6, 0.8);
    const tS = w("l25", "stranger");
    const g = fade(t, tS - 0.2, tS + 0.6);
    return [{ pos: add(A15, 0.0, 0.2, -0.45), color: g > 0.5 ? "#7f8ba0" : "#bcd4ff", i: (2.2 - 1.0 * g) * v, fog: 1.4 - 0.5 * g },
      { pos: add(A15, -0.3, 0.65, 1.20), color: "#b8ccee", i: 0.99 * v, fog: 0.15 }];
  } });

  // ===== S16 · THE VIEWER — "You probably know a number like that. One you'd call just to hear hello."
  const A16 = A(-0.05, 0.0, -33.5);
  const favs = [["M", "Mom"], ["D", "Dad"], ["G", "Grandpa Lou"], ["S", "Sam"], ["H", "Home"]];
  const ph16 = G.phone({ w: 0.29, h: 0.58, draw: (ctx, CW, CH, s, px, mg) => {
    const x = mg * px, bw = 0.29 * px;
    D.text(ctx, "6:00", x + 0.04 * px, (mg + 0.03) * px, { size: 0.016 * px, weight: 600, align: "left", color: C.iceDim, glow: 0 });
    D.text(ctx, "Favorites", x + 0.03 * px, (mg + 0.085) * px, { size: 0.034 * px, weight: 600, fam: "p", align: "left", color: C.white, glow: 10 });
    favs.forEach(([ini, nm], i) => {
      const y = (mg + 0.15 + i * 0.065) * px;
      const hl = i === 0 ? s.hl : 0;
      const col = hl > 0.5 ? C.amber : C.iceDim;
      if (hl > 0) D.fill(ctx, () => D.rr(ctx, x + 0.015 * px, y - 0.027 * px, bw - 0.03 * px, 0.054 * px, 0.014 * px), { color: C.amber, alpha: 0.13 * hl, glow: 18 });
      D.stroke(ctx, () => { ctx.beginPath(); ctx.arc(x + 0.045 * px, y, 0.018 * px, 0, 7); }, { color: col, alpha: 0.9, lw: 2.5, glow: 10 });
      D.text(ctx, ini, x + 0.045 * px, y + 1, { size: 0.017 * px, weight: 600, fam: "p", color: col, glow: 0 });
      D.text(ctx, nm, x + 0.075 * px, y, { size: 0.022 * px, weight: 500, align: "left", color: hl > 0.5 ? C.amberHot : C.white, alpha: 0.92, glow: hl > 0.5 ? 12 : 0 });
      if (i === 0) D.heart(ctx, x + bw - 0.08 * px, y, 0.02 * px, C.amber, 0.4 + 0.6 * hl);
      D.phone(ctx, x + bw - 0.04 * px, y, 0.02 * px, col, 0.8);
    });
    const cb = s.call;
    if (cb > 0) {
      const cy = (mg + 0.5) * px, cx = x + bw / 2;
      D.fill(ctx, () => { ctx.beginPath(); ctx.arc(cx, cy, 0.032 * px * (1 + 0.06 * Math.sin(s.pulse * 6.28)), 0, 7); }, { color: C.amber, alpha: 0.85 * cb, glow: 30 });
      D.phone(ctx, cx, cy, 0.03 * px, "#1a1208", cb);
      D.text(ctx, "calling Mom…", cx, cy - 0.055 * px, { size: 0.017 * px, weight: 500, color: C.amberHot, alpha: cb, glow: 0 });
    }
  } });
  ph16.g.position.set(A16.x, A16.y, A16.z);
  ph16.g.rotation.y = 0.12;
  S.push({ name: "phone", on: [63.6, 70.7], objs: () => [ph16.g], A: A16, update(t) {
    const v = win(t, 63.9, 69.2, 0.6, 0.7);
    const tN = w("l26", "number"), tH = w("l27", "hello");
    ph16.set({ hl: q(fade(t, tN - 0.2, tN + 0.3), 10), call: q(fade(t, tH - 0.3, tH + 0.1), 10), pulse: q((t * 1.2) % 1, 12) }, v);
  }, lights(t) {
    const v = win(t, 63.9, 69.3, 0.6, 0.8);
    const tN = w("l26", "number");
    return [{ pos: add(A16, 0.0, 0.3, -0.45), color: "#9fbcf0", i: 2.0 * v, fog: 1.3 },
      { pos: add(A16, 0.15, 0.1, -0.3), color: C.amber, i: (0.4 + 1.8 * fade(t, tN - 0.2, tN + 0.5)) * v, fog: 0.9 }];
  } });

  // ===== S17 · KINDNESS — "So I cleared his messages. And I kept her voice."
  const A17 = A(0.08, 0.04, -35.6);
  const counter = G.panel({ w: 0.4, h: 0.15, r: 0.03, hdr: 2.5, cw: 1000,
    draw: (ctx, CW, CH, s, px, mg) => {
      D.edge(ctx, px, mg, 0.4, 0.15, 0.03, s.n === 0 ? C.ice : C.iceDim, 0.45, 3);
      D.mailbox(ctx, (mg + 0.055) * px, CH / 2, 0.05 * px, s.n === 0 ? C.ice : C.amber, 0.95);
      D.text(ctx, String(s.n), (mg + 0.25) * px, CH / 2 - 0.012 * px, { size: 0.07 * px, weight: 600, fam: "p", color: s.n === 0 ? C.white : C.amberHot, glowColor: s.n === 0 ? C.ice : C.amber, glow: 26 });
      D.text(ctx, s.n === 0 ? "CLEARED" : "MESSAGES", (mg + 0.25) * px, CH / 2 + 0.047 * px, { size: 0.016 * px, weight: 600, fam: "p", ls: 8, color: C.iceDim, glow: 0 });
    } });
  PX(counter, A17.x, A17.y + 0.19, A17.z);
  const greet17 = G.panel({ w: 0.42, h: 0.15, r: 0.03, hdr: 2.5, cw: 1000, glass: ICE_GLASS, draw: greetingDraw() });
  PX(greet17, A17.x, A17.y + 0.005, A17.z + 0.01);
  const tog17 = G.toggle({ w: 0.2, h: 0.09, label: "KEEP GREETING" });
  tog17.g.position.set(A17.x, A17.y - 0.16, A17.z + 0.02);
  S.push({ name: "keep", on: [68.6, 75.1], objs: () => [counter.g, greet17.g, tog17.g], A: A17, update(t) {
    const v = win(t, 68.8, 73.6, 0.6, 0.7);
    const tC = w("l28", "cleared"), tK = w("l29", "kept");
    const n = Math.round(412 * (1 - easeIO(fade(t, tC - 0.1, tC + 0.85))));
    counter.set({ n }, v);
    const k = fade(t, tK - 0.1, tK + 0.35);
    const ta = L("l28").end + 0.15;
    pop(greet17.g, t, ta); pop(tog17.g, t, ta + 0.12);
    greet17.set({ hot: q(k, 10), col: k > 0.5 ? C.amber : C.ice, playCol: C.amber, ph: k > 0.5 ? 1 : 0, sub: k > 0.5 ? "June  ·  kept" : "June  ·  0:04" }, v * fade(t, ta, ta + 0.3));
    tog17.set({ on: easeIO(k), labelColor: k > 0.5 ? C.amberHot : C.ice, onColor: C.amber }, v * fade(t, ta + 0.12, ta + 0.42));
  }, lights(t) {
    const v = win(t, 68.8, 73.7, 0.6, 0.8);
    const tK = w("l29", "kept");
    const warm = fade(t, tK - 0.3, tK + 1.0);
    return [{ pos: add(A17, 0.0, 0.25, -0.45), color: warm > 0.4 ? C.amber : "#9fbcf0", i: (2.0 + 1.5 * warm) * v, fog: 1.3 + 0.6 * warm },
      { pos: add(A17, -0.3, 0.2, 0.6), color: warm > 0.4 ? "#ffd2a0" : "#b8ccee", i: 1.1 * v, fog: 0.2 }];
  } });

  // ===== S18 · CODA — Sunday, 6 p.m.: it rings, her greeting answers, the beep, his nine seconds, "1 new message"
  const A18 = A(0.0, 0.05, -37.8);
  const lab18 = labelPanel("SUNDAY  ·  6:00 PM", 0.4, 0.045, { k: 0.48, color: C.iceDim, ls: 10 });
  lab18.g.position.set(A18.x, A18.y + 0.335, A18.z + 0.0);
  const callBtn = G.panel({ w: 0.12, h: 0.12, r: 0.06, d: 0.035, margin: 0.03, hdr: 2.4, cw: 500,
    draw: (ctx, CW, CH, s, px) => {
      const col = s.beep > 0.3 ? C.amberHot : (s.live ? C.ice : C.amber);
      D.stroke(ctx, () => { ctx.beginPath(); ctx.arc(CW / 2, CH / 2, 0.06 * px - 4, 0, 7); }, { color: col, alpha: 0.85, lw: 3, glow: 20 });
      D.phone(ctx, CW / 2, CH / 2, 0.055 * px, col, 1);
    } });
  PX(callBtn, A18.x, A18.y + 0.19, A18.z);
  const ring18 = G.rings({ n: 3, r0: 0.064, r1: 0.05 });
  ring18.g.position.set(A18.x, A18.y + 0.19, A18.z + 0.005);
  const bub18a = G.panel({ w: 0.44, h: 0.13, r: 0.03, hdr: 2.6, cw: 1000, glass: ICE_GLASS, draw: bubbleDraw(B2, "r", C.ice, 0.031) });
  PX(bub18a, A18.x + 0.02, A18.y + 0.02, A18.z + 0.02);
  const bub18b = G.panel({ w: 0.44, h: 0.1, r: 0.028, hdr: 2.5, cw: 1000, glass: AMB_GLASS, draw: bubbleDraw(B3, "l", C.amber, 0.027) });
  PX(bub18b, A18.x - 0.02, A18.y - 0.12, A18.z + 0.045);
  const new18 = G.panel({ w: 0.36, h: 0.045, noSlab: true, margin: 0.01, hdr: 2.4, cw: 900,
    draw: (ctx, CW, CH, s, px) => { D.fill(ctx, () => { ctx.beginPath(); ctx.arc(CW * 0.17, CH / 2, 0.008 * px, 0, 7); }, { color: C.blue, glow: 12 }); D.text(ctx, "1 NEW MESSAGE", CW * 0.21, CH / 2, { size: 0.018 * px, weight: 600, fam: "p", ls: 8, align: "left", color: C.ice, glow: 0 }); } });
  new18.g.position.set(A18.x, A18.y - 0.215, A18.z + 0.02);
  S.push({ name: "coda", on: [71.9, 99], objs: () => [lab18.g, callBtn.g, ring18.g, bub18a.g, bub18b.g, new18.g], A: A18, update(t) {
    const v = win(t, 73.3, 99, 0.6, 1);
    const g2 = L("g2"), m2 = L("m2");
    const tBeep = g2.end + 0.45;
    lab18.set({}, v);
    const live = t > g2.start - 0.35;
    const beep = Math.max(0, 1 - Math.abs(t - (tBeep + 0.1)) / 0.3);
    callBtn.set({ live, beep: q(beep, 10) }, v);
    ring18.set((t * 0.8) % 1, v * fade(t, 73.6, 74.0) * (1 - fade(t, g2.start - 0.5, g2.start - 0.15)), C.amber);
    pop(bub18a.g, t, g2.start - 0.4); pop(bub18b.g, t, m2.start - 0.4);
    bub18a.set({ rev: revealOf("g2", t, 7) }, v * fade(t, g2.start - 0.4, g2.start - 0.1));
    bub18b.set({ rev: revealOf("m2", t, 5) }, v * fade(t, m2.start - 0.4, m2.start - 0.1));
    new18.set({}, v * fade(t, m2.end + 0.35, m2.end + 0.85));
  }, lights(t) {
    const v = win(t, 73.3, 99, 0.6, 1);
    const g2 = L("g2"), m2 = L("m2");
    return [{ pos: add(A18, 0.05, 0.25, -0.5), color: t > m2.start - 0.4 ? C.amber : "#bcd4ff", i: 2.4 * v, fog: 1.6 },
      { pos: add(A18, -0.3, 0.3, 0.7), color: "#d8e6ff", i: (0.8 + 0.6 * fade(t, g2.start, g2.start + 0.5)) * v, fog: 0.15 }];
  } });

  // ------------------------------------------------------------------ camera path (one take)
  // keys: [t, pos, look, fov, aperture]; each segment eases in-out (zero velocity at keys); holds are slow pushes
  const FOV = 40;
  const K = [];
  const frameH = (d) => 2 * d * Math.tan(FOV / 2 * Math.PI / 180);
  const DS = 0.9; // global framing: objects fill ~65 % of the width, as in the source
  function hold(Ap, t0, t1, d0, d1, o) {
    o = o || {};
    d0 *= DS; d1 *= DS;
    const c = o.c || [0, 0, 0];                  // content centre offset from the anchor
    const cx = Ap.x + c[0], cy = Ap.y + c[1], cz = Ap.z + c[2];
    const ly0 = cy - 0.16 * frameH(d0), ly1 = cy - 0.16 * frameH(d1);
    const dx0 = o.dx0 || 0, dx1 = o.dx1 != null ? o.dx1 : dx0 * 0.5, dy0 = o.dy0 || 0, dy1 = o.dy1 != null ? o.dy1 : dy0;
    K.push([t0, [cx + dx0, ly0 + dy0, cz + d0], [cx + (o.lx0 || 0), ly0 + (o.ly0 || 0), cz], o.ap || 9, Ap]);
    K.push([t1, [cx + dx1, ly1 + dy1, cz + d1], [cx + (o.lx1 != null ? o.lx1 : (o.lx0 || 0)), ly1 + (o.ly1 != null ? o.ly1 : (o.ly0 || 0)), cz], o.ap || 9, Ap]);
  }
  hold(A1, 0.0, 3.95, 1.75, 1.6, { dx0: 0.05, dx1: -0.02, ap: 8 });
  hold(A2, 4.85, 8.3, 2.05, 1.92, { c: [0, 0.02, 0], dx0: -0.06, dx1: 0.02, ap: 9 });
  hold(A3, 9.1, 10.5, 1.55, 1.45, { c: [0, -0.02, 0], dx0: 0.04, dx1: 0.0, ap: 10 });
  hold(A4, 11.5, 14.0, 2.05, 1.95, { c: [0, 0.0, 0], dx0: -0.05, dx1: -0.02, ap: 9 });
  hold(A4, 14.0, 17.95, 1.95, 1.75, { c: [0, 0.0, 0.12], dx1: 0.02, ap: 9 });
  hold(A5, 18.9, 19.85, 1.75, 1.68, { c: [-0.04, 0.06, -0.3], dx0: 0.2, dx1: 0.15, lx0: -0.02, ap: 12 });
  hold(A6, 20.7, 22.3, 1.7, 1.58, { c: [0, 0.02, 0], dx0: -0.12, dx1: 0.04, ap: 10 });
  hold(A7, 23.2, 24.85, 1.65, 1.55, { c: [0, 0.02, 0], dx0: -0.3, dx1: -0.16, ap: 13 });
  hold(A8, 25.85, 30.1, 2.0, 1.85, { c: [0, 0.0, 0], dx0: -0.04, dx1: 0.0, ap: 9 });
  hold(A8, 30.1, 31.75, 1.85, 1.78, { c: [0.06, -0.02, 0.05], dx1: 0.05, ap: 9 });
  hold(A9, 32.7, 34.55, 2.15, 2.0, { c: [0, 0.02, 0], dx0: 0.04, dx1: 0.0, ap: 9 });
  hold(A9b, 35.4, 37.0, 1.9, 1.8, { c: [0, 0.0, 0], dx0: -0.05, dx1: 0.0, ap: 9 });
  hold(A10, 38.0, 39.0, 1.5, 1.42, { c: [0, -0.1, 0], ap: 10 });
  hold(A10, 39.7, 41.55, 1.95, 1.88, { c: [0, 0.04, 0], ap: 9 });
  hold(A11, 42.6, 46.1, 1.75, 1.5, { c: [0, 0.03, 0], dx0: 0.03, dx1: 0.0, ap: 10 });
  hold(A12, 47.0, 52.95, 1.95, 2.05, { c: [0, 0.03, 0], dx0: -0.03, dx1: 0.04, ap: 9 });
  hold(A13, 53.8, 58.4, 1.95, 1.8, { c: [0, 0.02, 0], dx0: 0.04, dx1: 0.0, ap: 9 });
  hold(A14, 59.6, 61.0, 1.7, 1.45, { c: [0, 0.0, 0], dx0: 0.06, dx1: -0.02, lx1: -0.03, ly1: 0.06, ap: 13 });
  hold(A15, 61.9, 64.1, 1.95, 1.85, { c: [0, 0.06, 0], ap: 9 });
  hold(A16, 65.2, 69.0, 2.0, 1.85, { c: [0, 0.04, 0], dx0: -0.06, dx1: 0.0, ap: 9 });
  hold(A17, 70.1, 71.45, 2.0, 1.95, { c: [0, 0.07, 0], ap: 9 });
  hold(A17, 72.3, 73.4, 1.95, 1.85, { c: [0, 0.02, 0], ap: 9 });
  hold(A18, 74.4, 81.0, 2.0, 1.85, { c: [0, 0.06, 0], dx0: 0.04, dx1: 0.0, ap: 9 });
  hold(A18, 81.0, 84.2, 1.85, 2.4, { c: [0, 0.06, 0], ap: 9 });
  for (let i = 1; i < K.length; i++) if (K[i][0] <= K[i - 1][0]) K[i][0] = K[i - 1][0] + 0.001;
  // Transit grammar: when the camera leaves a station (its last key) that station scales out in 0.32 s while the next
  // one, waiting straight ahead ~2 m deeper, pops in already inside the frame (0.42 s, small overshoot); the camera then
  // pushes to it. So the next object is framed within ~0.3 s and nothing is ever half off-frame on a hold.
  const lastKey = (a) => { let tt = null; K.forEach((k) => { if (k[4] === a) tt = k[0]; }); return tt; };
  S.forEach((st, j) => {
    st.tout = j === S.length - 1 ? 1e9 : lastKey(st.A);
    st.tin = j === 0 ? -1e9 : lastKey(S[j - 1].A) + 0.02;
    st.on = [st.tin, st.tout + 0.4];
  });
  const easeIn = (u) => u * u * u;
  const stationScale = (st, t) => {
    const ui = clamp((t - st.tin) / 0.42, 0, 1), uo = clamp((t - st.tout) / 0.32, 0, 1);
    return Math.max(1e-4, (st.tin < -1e8 ? 1 : (ui <= 0 ? 0 : easeBack(ui))) * (1 - easeIn(uo)));
  };

  function camAt(t) {
    let i = 0;
    while (i < K.length - 2 && t >= K[i + 1][0]) i++;
    const a = K[i], b = K[i + 1];
    const u = clamp((t - a[0]) / (b[0] - a[0]), 0, 1);
    const long = b[0] - a[0] > 1.6;
    const e = long ? (u * u * (3 - 2 * u)) * 0.35 + u * 0.65 : easeIO(u); // holds: near-linear drift; transits: ease in-out
    const mix = (x, y) => [lerp(x[0], y[0], e), lerp(x[1], y[1], e), lerp(x[2], y[2], e)];
    const tr = !long ? Math.sin(Math.PI * u) : 0; // mid-transit: open the aperture a little (motion softness)
    return { pos: mix(a[1], b[1]), look: mix(a[2], b[2]), ap: lerp(a[3], b[3], e) + 6 * tr };
  }

  // ------------------------------------------------------------------ per-frame state
  function update(t) {
    S.forEach((s) => {
      const roots = s.objs().map((o) => (Array.isArray(o) ? o : [o, 0]));
      roots.forEach(([ob]) => ob.scale.setScalar(1));
      s.update(t);
      const inside = t >= s.on[0] && t <= s.on[1];
      const k = stationScale(s, t);
      roots.forEach(([ob, managed]) => { if (!inside) ob.visible = false; else if (!managed) ob.visible = true; ob.scale.multiplyScalar(k); });
    });
    let lights = [];
    // a station's back light sits in front of the next station (they are in line): fade it out as the camera leaves,
    // and fade the incoming station's lights in after its pop, so no light hangs on the camera path mid-transit
    S.forEach((s) => {
      const lk = (s.tin < -1e8 ? 1 : sstep(s.tin + 0.1, s.tin + 0.55, t)) * (1 - sstep(s.tout, s.tout + 0.35, t));
      if (lk <= 0.001) return;
      lights = lights.concat(s.lights(t).map((l) => Object.assign({}, l, { i: l.i * lk })).filter((l) => l.i > 0.01));
    });
    lights.sort((a, b) => b.i - a.i);
    lights = lights.slice(0, 4);
    const c = camAt(t);
    // handheld weight: slow, small, seeded
    const hx = Math.sin(t * 0.31 + 1.0) * 0.006 + Math.sin(t * 0.73 + 0.2) * 0.0028;
    const hy = Math.sin(t * 0.27 + 2.0) * 0.005 + Math.sin(t * 0.61 + 0.5) * 0.0024;
    const lx = Math.sin(t * 0.23 + 3.0) * 0.004, ly = Math.sin(t * 0.19 + 1.0) * 0.0035;
    const black = fade(t, 82.5, 83.9);
    return { t, cam: [c.pos[0] + hx, c.pos[1] + hy, c.pos[2]], look: [c.look[0] + hx * 0.6 + lx, c.look[1] + hy * 0.6 + ly, c.look[2]], fov: FOV,
      roll: Math.sin(t * 0.17) * 0.25, focus: c.look, aperture: c.ap, lights, black, motes: 1 };
  }
  return { update, stations: S, keys: K };
};

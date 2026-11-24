/* sm-kit.js — "stickman night choice" drawing kit (flat 2D at night, Canvas 2D, 1080x1920).
   Pure functions of their arguments (seek-exact). The look: navy-black flat rooms and buildings with faint lighter
   edges, a white-outline stick figure (round head ring, single-line limbs), cool phone glow, a top-left HUD (red DAY
   line, big condensed clock, mono stat lines), a dark phone UI with a text thread, a red RULE tag, an A/B vote stack.
   Fonts (compositions/world.html): SMCond = Oswald (clock, RULE tag, vote), SMMono = Roboto Mono (HUD lines),
   SMUI = Inter (phone UI). SM.create({canvas}) -> K. */
(function () {
  const SM = {};
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
  SM.util = { clamp, lerp, sstep, eio, eout, back, rng };

  SM.create = function ({ canvas, width = 1080, height = 1920 }) {
    const ctx = canvas.getContext("2d");
    const W = width, H = height;
    const K = { ctx, W, H, clamp, lerp, sstep, eio, eout, back, rng };
    const fonts = ["600 80px SMCond", "500 40px SMCond", "700 30px SMMono", "500 30px SMMono", "600 30px SMUI", "400 30px SMUI", "200 80px SMUI"];
    K.ready = (document.fonts ? Promise.all(fonts.map((f) => document.fonts.load(f))) : Promise.resolve()).then(() => true);
    K.COL = { bg: "#05070d", navy: "#0c1223", wall: "#0e1426", shape: "#151c31", edge: "#232c47", line: "#c9cdd6", red: "#e8434a", lime: "#c8f53c", blue: "#2d5bd1", warm: "#ffcf86", win: "#e9eefc" };
    const C = K.COL;

    K.rr = function (x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    };
    K.fam = (f) => (f === "mono" ? "SMMono" : f === "ui" ? "SMUI" : "SMCond");
    K.text = function (s, x, y, o = {}) {
      ctx.save(); ctx.font = `${o.w || 600} ${o.px || 40}px ${K.fam(o.fam)}`;
      ctx.textAlign = o.align || "left"; ctx.textBaseline = o.base || "alphabetic";
      if ("letterSpacing" in ctx) ctx.letterSpacing = (o.ls || 0) + "px";
      ctx.globalAlpha *= o.a == null ? 1 : o.a;
      if (o.rot) { ctx.translate(x, y); ctx.rotate(o.rot); x = 0; y = 0; }
      if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = o.blur || 12; ctx.shadowOffsetY = o.sy || 0; }
      ctx.fillStyle = o.col || "#fff"; ctx.fillText(s, x, y); ctx.restore();
    };
    K.measure = function (s, w, px, fam, ls) { ctx.save(); ctx.font = `${w} ${px}px ${K.fam(fam)}`; if ("letterSpacing" in ctx) ctx.letterSpacing = (ls || 0) + "px"; const m = ctx.measureText(s).width; ctx.restore(); return m; };
    K.glow = function (x, y, r, col, a = 1, mode = "lighter") {
      if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = mode; ctx.globalAlpha *= a;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
    };
    K.fill = function (col, a = 1) { ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col; ctx.fillRect(-4000, -4000, W + 8000, H + 8000); ctx.restore(); };
    K.fade = function (a, col = "#000") { if (a > 0.001) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = clamp(a, 0, 1); ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); ctx.restore(); } };
    K.vgrad = (y0, y1, st) => { const g = ctx.createLinearGradient(0, y0, 0, y1); st.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
    K.vignette = function (k = 0.55) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); const g = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.22, W / 2, H * 0.5, H * 0.78); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${k})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); };
    /* a flat shape with a faint lighter top edge (the format's rooms are flat navy blocks) */
    K.block = function (x, y, w, h, fill = C.shape, edge = C.edge, r = 6) { K.rr(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 2; ctx.stroke(); };

    // ------------------------------------------------------------ the stick figure (side view, faces +x)
    function seg(x, y, l1, a1, l2, a2) { const kx = x + Math.sin(a1) * l1, ky = y + Math.cos(a1) * l1; const fx = kx + Math.sin(a2) * l2, fy = ky + Math.cos(a2) * l2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke(); return [fx, fy]; }
    const POSES = {
      stand: { lean: 0, legs: [[0.12, 0.05], [-0.1, -0.05]], arms: [[0.2, 0.1], [-0.15, -0.05]], hip: 0 },
      sit: { lean: 0.08, legs: [[1.5, 0.05], [1.45, 0.0]], arms: [[0.9, 2.6], [0.4, 0.9]], hip: 70 },          // on a bed edge, phone at the face
      sitlow: { lean: 0.25, legs: [[2.4, -0.6], [2.3, -0.75]], arms: [[1.6, 2.9], [1.1, 1.2]], hip: 140 },        // on the floor, knees up, phone up
      freeze: { lean: -0.05, legs: [[0.25, 0.1], [-0.2, -0.05]], arms: [[0.5, 0.2], [-0.4, -0.3]], hip: 0 },
      run: null,
    };
    K.stick = function (o) {
      const s = o.s || 1, dir = o.dir == null ? 1 : o.dir;
      let P = POSES[o.pose || "stand"] || POSES.stand;
      if (o.pose === "run" || o.walk != null) { const ph = o.walk || 0, sn = Math.sin(ph), cs = Math.cos(ph), run = o.pose === "run" ? 1 : 0.55; P = { lean: 0.15 * run, hip: -Math.abs(sn) * 8, legs: [[0.7 * run * sn, 0.7 * run * sn - 0.8 * Math.max(0, -cs)], [-0.7 * run * sn, -0.7 * run * sn - 0.8 * Math.max(0, cs)]], arms: [[-0.8 * run * sn, -0.8 * run * sn + 1.2 * run], [0.8 * run * sn, 0.8 * run * sn + 1.2 * run]] }; }
      if (o.mix && o.pose2) { const Q = POSES[o.pose2]; const m = o.mix; const L = (a, b) => a.map((v, i) => Array.isArray(v) ? L(v, b[i]) : lerp(v, b[i], m)); P = { lean: lerp(P.lean, Q.lean, m), hip: lerp(P.hip, Q.hip, m), legs: L(P.legs, Q.legs), arms: L(P.arms, Q.arms) }; }
      ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s * dir, s);
      ctx.strokeStyle = o.col || C.line; ctx.lineWidth = o.lw || 13; ctx.lineCap = "round"; ctx.lineJoin = "round";
      const hipY = -170 + P.hip, body = 150;
      const shx = Math.sin(P.lean) * body, shy = hipY - Math.cos(P.lean) * body;
      seg(0, hipY, 86, P.legs[1][0], 86, P.legs[1][1]);
      seg(0, hipY, 86, P.legs[0][0], 86, P.legs[0][1]);
      ctx.beginPath(); ctx.moveTo(0, hipY); ctx.lineTo(shx, shy); ctx.stroke();
      const hand = seg(shx, shy + 14, 70, P.arms[0][0], 62, P.arms[0][1]);
      seg(shx, shy + 14, 70, P.arms[1][0], 62, P.arms[1][1]);
      const R = 72, hx = shx + Math.sin(P.lean) * (R + 6) + 6, hy = shy - R - 6;
      if (o.headFill) { ctx.fillStyle = o.headFill; ctx.beginPath(); ctx.arc(hx, hy, R, 0, 6.283); ctx.fill(); }
      ctx.beginPath(); ctx.arc(hx, hy, R, 0, 6.283); ctx.stroke();
      if (o.phone) { // phone in the front hand, screen toward the face
        ctx.save(); ctx.translate(hand[0], hand[1]); ctx.rotate(-0.35);
        ctx.fillStyle = "#0b0d12"; K.rr(-16, -34, 32, 60, 7); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = "#3a3f4a"; ctx.stroke();
        ctx.fillStyle = o.phoneLit ? "#cfe0ff" : "#1c2232"; K.rr(-11, -28, 22, 48, 4); ctx.fill(); ctx.restore();
      }
      ctx.restore();
      const X = (px) => o.x + px * s * dir, Y = (py) => o.y + py * s;
      return { head: [X(hx), Y(hy)], hand: [X(hand[0]), Y(hand[1])], r: R * s };
    };

    // ------------------------------------------------------------ HUD (measured on the source, 1080 px frame)
    /* st: {a, day: "DAY 1", time: "11:48", ampm: "PM", rows: [[label, value, valueCol]], dot (blink 0..1), glitch 0..1} */
    K.hud = function (st) {
      if (!st || st.a <= 0) return;
      ctx.save(); ctx.globalAlpha = st.a;
      const x = 70;
      const dk = st.dot == null ? 1 : st.dot;
      K.glow(78, 249, 26, "rgba(232,67,74,0.7)", dk); ctx.fillStyle = `rgba(232,67,74,${0.35 + 0.65 * dk})`; ctx.beginPath(); ctx.arc(78, 249, 8, 0, 6.283); ctx.fill();
      K.text(st.day || "DAY 1", 100, 261, { w: 700, px: 30, fam: "mono", col: C.red, ls: 7 });
      const tw = K.measure(st.time, 600, 124, null, -1);
      K.text(st.time, x + 4, 373, { w: 600, px: 124, col: st.timeCol || "#f2f2ec", ls: -1, shadow: "rgba(0,0,0,0.6)", blur: 10 });
      K.text(st.ampm || "PM", x + 14 + tw, 373, { w: 500, px: 48, col: "#cfd0cc", ls: 0 });
      ctx.fillStyle = "rgba(170,176,190,0.45)"; ctx.fillRect(x, 407, 380, 2);
      (st.rows || []).forEach(([lab, val, vc, pop], i) => {
        const y = 447 + i * 41;
        K.text(lab, x, y, { w: 500, px: 26, fam: "mono", col: "#8d93a0", ls: 5 });
        const lw = K.measure(lab, 500, 26, "mono", 5);
        const sc = pop == null ? 1 : pop;
        ctx.save(); ctx.translate(x + lw + 20, y - 9); ctx.scale(sc, sc); K.text(val, 0, 9, { w: 700, px: 26, fam: "mono", col: vc || "#f2f2ec", ls: 3 }); ctx.restore();
      });
      ctx.restore();
    };

    // ------------------------------------------------------------ phone UI
    /* o: {x, y (centre), s, rot, a, screen: "lock" | "thread", glow, tint (red flash 0..1), dim (0..1)}
       lock: {time, date, note: {from, text}, noteK, battery}
       thread: {name, sub, msgs: [{me, t, k (0..1 reveal), status}], typing (0..1), input: "text", kb (0..1 keyboard)} */
    K.phone = function (o) {
      const a = o.a == null ? 1 : o.a; if (a <= 0) return;
      const w = 600, h = 1240;
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(o.x, o.y); ctx.rotate(o.rot == null ? 0.035 : o.rot); const sc = o.s == null ? 1 : o.s; ctx.scale(sc, sc);
      K.glow(0, 0, 900, "rgba(120,140,200,0.10)", o.glow == null ? 1 : o.glow);
      ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 50;
      K.rr(-w / 2, -h / 2, w, h, 70); ctx.fillStyle = "#0e1016"; ctx.fill(); ctx.shadowBlur = 0;
      ctx.lineWidth = 4; ctx.strokeStyle = "#2c3039"; ctx.stroke();
      ctx.save(); K.rr(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 62); ctx.clip();
      ctx.fillStyle = "#111319"; ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = "#000"; K.rr(-90, -h / 2 + 26, 180, 50, 25); ctx.fill();
      const L = -w / 2 + 50, T0 = -h / 2;
      if (o.screen === "lock") {
        const S = o.lock || {};
        K.text(S.date || "Saturday, November 14", 0, T0 + 210, { w: 500, px: 30, fam: "ui", col: "#d8dbe2", align: "center" });
        K.text(S.time || "11:48", 0, T0 + 360, { w: 200, px: 170, fam: "ui", col: "#eef0f4", align: "center" });
        if (S.battery != null) { // big battery readout
          const bk = S.batteryK == null ? 1 : S.batteryK;
          ctx.save(); ctx.globalAlpha *= bk; ctx.translate(0, T0 + 560);
          ctx.strokeStyle = "#d8dbe2"; ctx.lineWidth = 6; K.rr(-120, -50, 230, 100, 18); ctx.stroke(); ctx.fillStyle = "#d8dbe2"; K.rr(114, -18, 14, 36, 4); ctx.fill();
          ctx.fillStyle = S.battery <= 20 ? C.red : S.battery <= 35 ? "#f0a030" : "#5be06a"; K.rr(-110, -40, 210 * S.battery / 100, 80, 12); ctx.fill();
          K.text(S.battery + "%", 0, 120, { w: 600, px: 64, fam: "ui", col: "#eef0f4", align: "center" }); ctx.restore();
        }
        if (S.note && (S.noteK == null || S.noteK > 0)) {
          const k = S.noteK == null ? 1 : S.noteK; ctx.save(); ctx.globalAlpha *= clamp(k * 2, 0, 1); ctx.translate(0, T0 + (S.noteY || 470) + (1 - eout(k)) * 40);
          ctx.fillStyle = "rgba(60,64,76,0.75)"; K.rr(-250, -54, 500, 108, 26); ctx.fill();
          ctx.fillStyle = "#3a3f4a"; ctx.beginPath(); ctx.arc(-196, 0, 28, 0, 6.283); ctx.fill(); K.text("ME", -196, 10, { w: 700, px: 22, fam: "ui", col: "#c9cdd6", align: "center" });
          K.text(S.note.from, -150, -8, { w: 600, px: 27, fam: "ui", col: C.red }); K.text(S.note.text, -150, 28, { w: 400, px: 24, fam: "ui", col: "#d8dbe2" });
          K.text("now", 220, -8, { w: 400, px: 20, fam: "ui", col: "#9aa0ac", align: "right" }); ctx.restore();
        }
      } else {
        const S = o.thread || {};
        // header
        K.text("‹", L - 6, T0 + 172, { w: 400, px: 56, fam: "ui", col: "#c9cdd6" });
        ctx.fillStyle = "#2a2e38"; ctx.beginPath(); ctx.arc(L + 64, T0 + 158, 34, 0, 6.283); ctx.fill(); K.text(S.avatar || "ME", L + 64, T0 + 168, { w: 700, px: 24, fam: "ui", col: "#c9cdd6", align: "center" });
        K.text(S.name || "Me", L + 116, T0 + 152, { w: 600, px: 32, fam: "ui", col: "#eef0f4" });
        K.text(S.sub || "", L + 116, T0 + 188, { w: 400, px: 23, fam: "ui", col: C.red });
        ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.fillRect(-w / 2, T0 + 222, w, 2);
        let y = T0 + 262;
        (S.msgs || []).forEach((m) => {
          const k = m.k == null ? 1 : m.k; if (k <= 0) return;
          const px = 33, tw = K.measure(m.t, 400, px, "ui"), bw = tw + 48, bh = 70;
          const bx = m.me ? w / 2 - 40 - bw : L - 14;
          ctx.save(); ctx.globalAlpha *= clamp(k * 2.5, 0, 1); const sc2 = lerp(0.85, 1, back(k, 1.6));
          ctx.translate(bx + (m.me ? bw : 0), y + bh / 2); ctx.scale(sc2, sc2); ctx.translate(-(bx + (m.me ? bw : 0)), -(y + bh / 2));
          ctx.fillStyle = m.me ? C.blue : (m.hi ? "#3a2a30" : "#2a2c33"); K.rr(bx, y, bw, bh, 26); ctx.fill();
          K.text(m.t, bx + 24, y + 46, { w: 400, px, fam: "ui", col: m.me ? "#f2f5ff" : "#e6e7ea" });
          ctx.restore();
          y += bh + 16;
          if (m.status) { K.text(m.status, w / 2 - 44, y + 8, { w: 400, px: 22, fam: "ui", col: "#8a909c", align: "right", a: clamp(k * 2, 0, 1) }); y += 30; }
        });
        if (S.typing > 0) { ctx.save(); ctx.globalAlpha *= clamp(S.typing * 3, 0, 1); ctx.fillStyle = "#2a2c33"; K.rr(L - 14, y, 110, 64, 26); ctx.fill(); for (let i = 0; i < 3; i++) { ctx.fillStyle = `rgba(200,204,214,${0.4 + 0.6 * Math.max(0, Math.sin((o.t || 0) * 7 - i * 0.8))})`; ctx.beginPath(); ctx.arc(L + 18 + i * 26, y + 32, 8, 0, 6.283); ctx.fill(); } ctx.restore(); }
        // input + keyboard
        if (S.kb > 0) {
          ctx.save(); ctx.globalAlpha *= S.kb; const ky = h / 2 - 360 + (1 - eout(S.kb)) * 200;
          ctx.fillStyle = "#1a1c23"; ctx.fillRect(-w / 2, ky, w, 400);
          ctx.fillStyle = "#24272f"; K.rr(-w / 2 + 30, ky + 20, w - 120, 56, 28); ctx.fill(); K.text(S.input || "Message", -w / 2 + 56, ky + 58, { w: 400, px: 26, fam: "ui", col: S.input ? "#e6e7ea" : "#6a707c" });
          ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(w / 2 - 56, ky + 48, 26, 0, 6.283); ctx.fill();
          const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
          rows.forEach((r_, ri) => { const n = r_.length, kw = 48, gap = 6, x0 = -(n * (kw + gap) - gap) / 2; for (let i = 0; i < n; i++) { ctx.fillStyle = "#3a3d46"; K.rr(x0 + i * (kw + gap), ky + 110 + ri * 76, kw, 64, 8); ctx.fill(); K.text(r_[i], x0 + i * (kw + gap) + kw / 2, ky + 152 + ri * 76, { w: 400, px: 26, fam: "ui", col: "#d8dbe2", align: "center" }); } });
          ctx.restore();
        }
      }
      if (o.tint > 0) { ctx.fillStyle = `rgba(110,10,22,${0.45 * o.tint})`; ctx.fillRect(-w / 2, -h / 2, w, h); }
      if (o.dim > 0) { ctx.fillStyle = `rgba(0,0,0,${o.dim})`; ctx.fillRect(-w / 2, -h / 2, w, h); }
      ctx.restore();
      ctx.restore();
    };

    // ------------------------------------------------------------ RULE tag, vote stack, end card
    K.ruleTag = function (txt, x, y, o = {}) {
      const a = o.a == null ? 1 : o.a; if (a <= 0) return;
      const px = o.px || 64, w = K.measure(txt, 600, px, null, 1) + 44, h = px * 1.3;
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(o.rot == null ? -0.06 : o.rot); const sc = o.s == null ? 1 : o.s; ctx.scale(sc, sc);
      ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 18; ctx.fillStyle = C.red; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 3; ctx.strokeRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12);
      K.text(txt, 0, px * 0.36, { w: 600, px, col: "#fff", align: "center", ls: 1 });
      ctx.restore();
    };
    /* the A/B stack: q (question), A/B: {t, k}, foot k, small k, part {t, k}; y0 = question baseline */
    K.voteStack = function (o) {
      const a = o.a == null ? 1 : o.a; if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a; const y0 = o.y0 || 800;
      K.text(o.q, 540, y0, { w: 600, px: 98, col: "#f2f2ec", align: "center", ls: 0, a: o.qk == null ? 1 : o.qk });
      const pill = (y, letter, txt, k, tk, icon) => {
        if (k <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(k * 3, 0, 1);
        const x = 160, w = 760, h = 98; ctx.fillStyle = "rgba(22,27,42,0.92)"; K.rr(x, y, w, h, 14); ctx.fill(); ctx.strokeStyle = "rgba(200,206,220,0.55)"; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = "#f2f2ec"; ctx.beginPath(); ctx.arc(x + 54, y + h / 2, 30, 0, 6.283); ctx.fill(); K.text(letter, x + 54, y + h / 2 + 15, { w: 600, px: 42, col: "#0c1223", align: "center" });
        if (tk > 0) { const n = Math.round(txt.length * clamp(tk, 0, 1)); K.text(txt.slice(0, n), x + 106, y + h / 2 + 22, { w: 500, px: 60, col: "#f2f2ec", ls: 0.5 });
          if (tk >= 1) { ctx.strokeStyle = "rgba(220,224,232,0.8)"; ctx.lineWidth = 3; if (icon === "freeze") { K.rr(x + w - 70, y + 28, 36, 44, 4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + w - 52, y + 36); ctx.lineTo(x + w - 52, y + 64); ctx.stroke(); } else { ctx.beginPath(); ctx.moveTo(x + w - 70, y + 70); ctx.lineTo(x + w - 52, y + 30); ctx.lineTo(x + w - 34, y + 70); ctx.moveTo(x + w - 62, y + 56); ctx.lineTo(x + w - 42, y + 56); ctx.stroke(); } } }
        ctx.restore();
      };
      pill(y0 + 50, "A", o.A.t, o.A.k, o.A.tk, "freeze");
      pill(y0 + 170, "B", o.B.t, o.B.k, o.B.tk, "roof");
      if (o.fk > 0) { const y = y0 + 355; ctx.save(); ctx.globalAlpha *= clamp(o.fk * 3, 0, 1);
        const p1 = "COMMENT ", p2 = "A", p3 = " OR ", p4 = "B", px = 66; const ws = [p1, p2, p3, p4].map((s) => K.measure(s, 600, px)); let x = 540 - ws.reduce((s, v) => s + v, 0) / 2;
        [[p1, "#f2f2ec"], [p2, C.lime], [p3, "#f2f2ec"], [p4, C.lime]].forEach(([s, c], i) => { K.text(s, x, y, { w: 600, px, col: c }); x += ws[i]; }); ctx.restore(); }
      if (o.sk > 0) K.text(o.small || "THE MOST VOTED CHOICE DECIDES", 540, y0 + 398, { w: 500, px: 23, fam: "mono", col: "#8d93a0", align: "center", ls: 6, a: clamp(o.sk * 3, 0, 1) });
      if (o.pk > 0) { ctx.save(); const k = back(clamp(o.pk, 0, 1), 2); ctx.translate(540, y0 + 498); ctx.scale(lerp(0.7, 1, k), lerp(0.7, 1, k)); K.text(o.part || "LOOP 5", 0, 0, { w: 600, px: 82, col: C.red, align: "center", a: clamp(o.pk * 3, 0, 1) }); ctx.restore(); }
      ctx.restore();
    };
    return K;
  };
  window.SM = SM;
})();

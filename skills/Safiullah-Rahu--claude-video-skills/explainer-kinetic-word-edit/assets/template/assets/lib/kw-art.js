/* kw-art.js — every image in the kinetic-word film, drawn in code on 2D canvases (seeded, deterministic).
   KWART.figure()            sinking faceless figure, rim-lit from the surface (transparent canvas)
   KWART.title(lines, o)     condensed-serif underwater title (Playfair Display squeezed to ~58 %)
   KWART.wood(w, h)          painted grey-white planks, vertical, seams + grain
   KWART.sheet(lines, hi)    torn spiral-notebook sheet with typed lines; returns {canvas, words:[{x0,x1}] of line `hi`, lineY}
   KWART.polaroid(kind, cap) polaroid with a painted mini scene: "lighthouse" | "moon" | "boat"
   KWART.tape(w, h, seed)    a strip of translucent paper tape with torn ends
   KWART.ticket()            ferry ticket stub, KWART.mug(), KWART.pen()
   KWART.shadow(canvas, blur, alpha)  soft drop-shadow version of any alpha canvas
   KWART.note(text, prog)    note paper with marker handwriting drawn on to `prog` (0..1)
   KWART.qmark()             giant speckled question mark                                                       */
(function () {
  const KWART = {};
  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  const rngOf = (s) => window.KW.rng(s);

  KWART.shadow = (src, blur = 18, alpha = 0.5, pad = 60) => {
    const c = mk(src.width + pad * 2, src.height + pad * 2), x = c.getContext("2d");
    x.filter = `blur(${blur}px)`;
    x.drawImage(src, pad, pad);
    x.filter = "none";
    x.globalCompositeOperation = "source-in";
    x.fillStyle = `rgba(20,18,16,${alpha})`;
    x.fillRect(0, 0, c.width, c.height);
    return c;
  };

  // ------------------------------------------------------------------ underwater figure
  KWART.figure = () => {
    const W = 760, H = 1180, c = mk(W, H), x = c.getContext("2d");
    const sil = mk(W, H), s = sil.getContext("2d");
    const r = rngOf(5);
    s.lineCap = "round"; s.lineJoin = "round";
    s.fillStyle = "#000"; s.strokeStyle = "#000";
    // hair floating up from the head: one soft mass, then loose strands
    s.beginPath(); s.moveTo(340, 404);
    s.bezierCurveTo(318, 330, 286, 280, 300, 214);
    s.bezierCurveTo(322, 250, 340, 240, 350, 196);
    s.bezierCurveTo(372, 236, 392, 236, 418, 186);
    s.bezierCurveTo(424, 250, 440, 300, 428, 350);
    s.bezierCurveTo(424, 380, 420, 394, 416, 404);
    s.closePath(); s.fill();
    for (let i = 0; i < 12; i++) {
      const a = -0.8 + (i / 11) * 1.6, x0 = 380 + Math.sin(a) * 40, y0 = 380 - Math.cos(a) * 34;
      const len = 160 + r() * 110, sway = (r() - 0.5) * 70;
      s.lineWidth = 3 + r() * 5;
      s.beginPath(); s.moveTo(x0, y0);
      s.bezierCurveTo(x0 + Math.sin(a) * 30 + sway * 0.3, y0 - len * 0.35, x0 + Math.sin(a) * 50 - sway, y0 - len * 0.7, x0 + Math.sin(a) * 60 + sway, y0 - len);
      s.stroke();
    }
    // head
    s.beginPath(); s.ellipse(380, 400, 44, 52, 0.12, 0, Math.PI * 2); s.fill();
    // arms raised toward the surface
    const limb = (pts, w0, w1) => {
      for (let k = 0; k < pts.length - 1; k++) {
        const u = k / (pts.length - 1);
        s.lineWidth = w0 + (w1 - w0) * u;
        s.beginPath(); s.moveTo(pts[k][0], pts[k][1]); s.lineTo(pts[k + 1][0], pts[k + 1][1]); s.stroke();
      }
    };
    // one arm reaching up to the light, the other drifting out to the side (asymmetric, unposed)
    limb([[330, 486], [300, 420], [282, 352], [290, 282], [300, 224]], 42, 24);
    limb([[436, 488], [486, 480], [536, 468], [584, 440], [622, 408]], 42, 24);
    s.beginPath(); s.ellipse(302, 204, 17, 30, -0.1, 0, Math.PI * 2); s.fill();
    s.beginPath(); s.ellipse(640, 394, 30, 17, -0.6, 0, Math.PI * 2); s.fill();
    // neck + torso in a short jacket; its back hem lifts a little in the water
    s.beginPath();
    s.moveTo(362, 440); s.lineTo(404, 440);
    s.quadraticCurveTo(452, 462, 458, 520);
    s.quadraticCurveTo(462, 620, 470, 700);
    s.quadraticCurveTo(505, 700, 528, 672);          // hem corner lifting
    s.quadraticCurveTo(512, 724, 468, 742);
    s.lineTo(318, 744);
    s.quadraticCurveTo(286, 736, 268, 704);
    s.quadraticCurveTo(290, 706, 302, 698);
    s.quadraticCurveTo(300, 610, 306, 520);
    s.quadraticCurveTo(314, 462, 362, 440);
    s.closePath(); s.fill();
    // trousers: one knee drawn up, the other leg hanging, feet first
    limb([[350, 720], [338, 810], [326, 900], [338, 990], [348, 1070]], 54, 34);
    limb([[420, 726], [462, 790], [498, 852], [466, 930], [440, 1004]], 54, 34);
    s.beginPath(); s.ellipse(356, 1086, 34, 16, 0.25, 0, Math.PI * 2); s.fill();
    s.beginPath(); s.ellipse(430, 1020, 34, 16, -0.5, 0, Math.PI * 2); s.fill();

    // body colour: lit from above
    x.drawImage(sil, 0, 0);
    x.globalCompositeOperation = "source-in";
    const g = x.createLinearGradient(0, 120, 0, H);
    g.addColorStop(0, "#1a3e5c"); g.addColorStop(0.35, "#0c2538"); g.addColorStop(1, "#040d16");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // fabric folds on the coat (darker streaks)
    x.globalCompositeOperation = "source-atop";
    x.strokeStyle = "rgba(0,0,0,0.35)"; x.lineWidth = 6;
    for (let i = 0; i < 9; i++) { x.beginPath(); const xx = 280 + i * 26; x.moveTo(xx, 520); x.quadraticCurveTo(xx + (r() - 0.5) * 60, 660, xx + (i - 4) * 22, 810); x.stroke(); }
    // rim light: the silhouette minus itself shifted down
    const rim = mk(W, H), rx = rim.getContext("2d");
    rx.drawImage(sil, 0, 0);
    rx.globalCompositeOperation = "destination-out";
    rx.drawImage(sil, 3, 9);
    rx.globalCompositeOperation = "source-in";
    rx.fillStyle = "#8fd0f2"; rx.fillRect(0, 0, W, H);
    x.globalCompositeOperation = "source-over";
    x.globalAlpha = 0.85; x.filter = "blur(1.5px)"; x.drawImage(rim, 0, 0); x.filter = "none"; x.globalAlpha = 1;
    return c;
  };

  KWART.title = (lines, o) => {
    o = Object.assign({ size: 300, color: "#3a80b4", sx: 0.58, lead: 0.92, font: "KWSerif" }, o || {});
    const W = 1200, H = Math.round(o.size * o.lead * lines.length + o.size * 0.5), c = mk(W, H), x = c.getContext("2d");
    x.fillStyle = o.color; x.textAlign = "center"; x.textBaseline = "alphabetic";
    x.font = `900 ${o.size}px ${o.font}`;
    lines.forEach((ln, i) => {
      x.save(); x.translate(W / 2, o.size * 0.95 + i * o.size * o.lead); x.scale(o.sx, 1); x.fillText(ln, 0, 0); x.restore();
    });
    return c;
  };

  // ------------------------------------------------------------------ desk
  KWART.wood = (W, H) => {
    const c = mk(W, H), x = c.getContext("2d"), r = rngOf(11);
    const pw = 124;
    for (let px = -20, k = 0; px < W; px += pw, k++) {
      const v = 214 + Math.round((r() - 0.5) * 16);
      x.fillStyle = `rgb(${v},${v - 3},${v - 9})`;
      x.fillRect(px, 0, pw, H);
      // grain: long wavy lines
      for (let g = 0; g < 26; g++) {
        const gx = px + 6 + r() * (pw - 12), a = 0.05 + r() * 0.1, ph = r() * 6, amp = 1 + r() * 3;
        x.strokeStyle = `rgba(90,86,80,${a})`; x.lineWidth = 0.6 + r() * 1.6;
        x.beginPath();
        for (let y = 0; y <= H; y += 20) { const xx = gx + Math.sin(y * 0.004 + ph) * amp + Math.sin(y * 0.021 + ph * 2) * 0.8; y ? x.lineTo(xx, y) : x.moveTo(xx, y); }
        x.stroke();
      }
      // a knot now and then
      if (r() < 0.55) {
        const ky = r() * H, kx = px + 20 + r() * (pw - 40);
        for (let q = 0; q < 6; q++) { x.strokeStyle = `rgba(80,74,66,${0.12 + q * 0.02})`; x.lineWidth = 1.2; x.beginPath(); x.ellipse(kx, ky, 4 + q * 3.2, 9 + q * 7, 0, 0, Math.PI * 2); x.stroke(); }
      }
      // seam
      x.fillStyle = "rgba(70,66,60,0.85)"; x.fillRect(px, 0, 4, H);
      x.fillStyle = "rgba(255,255,255,0.35)"; x.fillRect(px + 4, 0, 2, H);
    }
    // worn paint / dirt mottling
    const id = x.getImageData(0, 0, W, H), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 14; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    x.putImageData(id, 0, 0);
    return c;
  };

  // torn notebook sheet: lines typed in KWMono; `hi` = index of the line the highlighter will sweep
  KWART.sheet = (lines, hi) => {
    const W = 1000, H = 1240, c = mk(W, H), x = c.getContext("2d"), r = rngOf(23);
    // torn bottom-right edge
    const path = new Path2D();
    path.moveTo(26, 20); path.lineTo(W - 24, 26);
    let y = 30;
    path.lineTo(W - 22, H * 0.70);
    for (let xx = W - 22; xx > 30; xx -= 18) { y = H * 0.70 + (W - xx) * 0.24 + (r() - 0.5) * 34; path.lineTo(xx, Math.min(H - 20, y)); }
    path.lineTo(26, H - 30);
    path.closePath();
    x.save(); x.clip(path);
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#fbfaf6"); g.addColorStop(1, "#ecebe5");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // paper fibre
    for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(120,115,105,${r() * 0.05})`; x.fillRect(r() * W, r() * H, 1 + r() * 2, 1); }
    // rules
    x.strokeStyle = "rgba(120,150,190,0.38)"; x.lineWidth = 2;
    for (let ly = 184; ly < H; ly += 74) { x.beginPath(); x.moveTo(110, ly); x.lineTo(W, ly); x.stroke(); }
    // spiral holes
    for (let hy = 70; hy < H - 40; hy += 72) {
      x.fillStyle = "rgba(0,0,0,0.0)";
      x.save(); x.globalCompositeOperation = "destination-out"; x.beginPath(); x.arc(64, hy, 17, 0, Math.PI * 2); x.fill(); x.restore();
      x.strokeStyle = "rgba(60,58,54,0.35)"; x.lineWidth = 3; x.beginPath(); x.arc(64, hy, 18, 0.2, Math.PI * 1.2); x.stroke();
    }
    // typed lines
    x.fillStyle = "#26231f"; x.font = "500 50px KWMono"; x.textBaseline = "alphabetic";
    const words = [];
    let lineY = 0;
    lines.forEach((ln, i) => {
      const ly = 170 + i * 74, lx = 130;
      x.save(); x.translate(lx, ly); x.rotate((r() - 0.5) * 0.004);
      x.fillText(ln, 0, 0); x.restore();
      if (i === hi) {
        lineY = ly; let cx = lx;
        ln.split(" ").forEach((wd) => { const ww = x.measureText(wd).width; words.push({ x0: cx, x1: cx + ww }); cx += ww + x.measureText(" ").width; });
      }
    });
    x.restore();
    // a slight curl shadow on the torn edge
    x.strokeStyle = "rgba(0,0,0,0.08)"; x.lineWidth = 6; x.stroke(path);
    return { canvas: c, words, lineY, lineH: 50 };
  };

  const paint = {
    lighthouse(x, S, r) {
      const g = x.createLinearGradient(0, 0, 0, S); g.addColorStop(0, "#4c3f78"); g.addColorStop(0.45, "#d9776a"); g.addColorStop(0.62, "#f2b36e"); g.addColorStop(0.63, "#2b4a6b"); g.addColorStop(1, "#0f2236");
      x.fillStyle = g; x.fillRect(0, 0, S, S);
      x.fillStyle = "rgba(255,220,170,0.5)"; for (let i = 0; i < 14; i++) x.fillRect(S * 0.2 + r() * S * 0.6, S * (0.64 + i * 0.02), 20 + r() * 50, 2);
      x.fillStyle = "#1a2230"; x.beginPath(); x.moveTo(0, S * 0.7); x.lineTo(S * 0.42, S * 0.58); x.lineTo(S * 0.62, S * 0.66); x.lineTo(S * 0.62, S); x.lineTo(0, S); x.fill();
      // tower
      x.fillStyle = "#f1ece2"; x.beginPath(); x.moveTo(S * 0.33, S * 0.6); x.lineTo(S * 0.36, S * 0.3); x.lineTo(S * 0.44, S * 0.3); x.lineTo(S * 0.47, S * 0.6); x.fill();
      x.fillStyle = "#b8403a"; for (let k = 0; k < 3; k++) x.fillRect(S * 0.335 + k * 0.004 * S, S * (0.36 + k * 0.08), S * 0.13 - k * 0.006 * S, S * 0.035);
      x.fillStyle = "#222"; x.fillRect(S * 0.355, S * 0.24, S * 0.09, S * 0.06);
      x.fillStyle = "#ffe9a8"; x.fillRect(S * 0.37, S * 0.25, S * 0.06, S * 0.04);
      const bg = x.createLinearGradient(S * 0.4, 0, S, 0); bg.addColorStop(0, "rgba(255,240,190,0.7)"); bg.addColorStop(1, "rgba(255,240,190,0)");
      x.fillStyle = bg; x.beginPath(); x.moveTo(S * 0.42, S * 0.27); x.lineTo(S, S * 0.12); x.lineTo(S, S * 0.32); x.fill();
    },
    moon(x, S, r) {
      const g = x.createLinearGradient(0, 0, 0, S); g.addColorStop(0, "#08121f"); g.addColorStop(0.55, "#1b2f45"); g.addColorStop(0.56, "#0c1a29"); g.addColorStop(1, "#050b13");
      x.fillStyle = g; x.fillRect(0, 0, S, S);
      for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.7})`; x.fillRect(r() * S, r() * S * 0.5, 1.5, 1.5); }
      const mg = x.createRadialGradient(S * 0.62, S * 0.28, 2, S * 0.62, S * 0.28, S * 0.3); mg.addColorStop(0, "rgba(255,248,220,0.55)"); mg.addColorStop(1, "rgba(255,248,220,0)");
      x.fillStyle = mg; x.fillRect(0, 0, S, S);
      x.fillStyle = "#f6f0d6"; x.beginPath(); x.arc(S * 0.62, S * 0.28, S * 0.085, 0, Math.PI * 2); x.fill();
      for (let i = 0; i < 26; i++) { const yy = S * 0.58 + i * S * 0.016, ww = (30 + r() * 60) * (1 - i / 30); x.fillStyle = `rgba(250,240,200,${0.55 - i * 0.018})`; x.fillRect(S * 0.62 - ww / 2 + (r() - 0.5) * 20, yy, ww, 2.5); }
      x.fillStyle = "#04080d"; x.beginPath(); x.moveTo(S * 0.18, S * 0.6); x.lineTo(S * 0.3, S * 0.6); x.lineTo(S * 0.27, S * 0.63); x.lineTo(S * 0.2, S * 0.63); x.fill();
      x.fillRect(S * 0.237, S * 0.52, 3, S * 0.08);
    },
    boat(x, S, r) {
      const g = x.createLinearGradient(0, 0, 0, S); g.addColorStop(0, "#5f8f9a"); g.addColorStop(1, "#24505c");
      x.fillStyle = g; x.fillRect(0, 0, S, S);
      x.strokeStyle = "rgba(220,240,240,0.35)"; x.lineWidth = 2;
      for (let i = 0; i < 26; i++) { const yy = r() * S, xx = r() * S; x.beginPath(); x.ellipse(xx, yy, 18 + r() * 40, 3 + r() * 4, 0, 0, Math.PI * 2); x.stroke(); }
      x.fillStyle = "rgba(0,0,0,0.25)"; x.beginPath(); x.ellipse(S * 0.52, S * 0.66, S * 0.26, S * 0.05, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = "#f4f1e8"; x.beginPath(); x.moveTo(S * 0.26, S * 0.55); x.lineTo(S * 0.76, S * 0.55); x.lineTo(S * 0.66, S * 0.65); x.lineTo(S * 0.36, S * 0.65); x.fill();
      x.fillStyle = "#e2ded2"; x.beginPath(); x.moveTo(S * 0.36, S * 0.55); x.lineTo(S * 0.51, S * 0.3); x.lineTo(S * 0.66, S * 0.55); x.fill();
      x.fillStyle = "#cfcabc"; x.beginPath(); x.moveTo(S * 0.51, S * 0.3); x.lineTo(S * 0.51, S * 0.55); x.lineTo(S * 0.66, S * 0.55); x.fill();
    },
  };
  KWART.polaroid = (kind, cap, seed) => {
    const W = 420, H = 512, c = mk(W, H), x = c.getContext("2d"), r = rngOf(seed || 3);
    x.fillStyle = "#f5f3ee"; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(110,105,95,${r() * 0.05})`; x.fillRect(r() * W, r() * H, 2, 1); }
    const S = 364, ix = 28, iy = 28;
    const pc = mk(S, S), px = pc.getContext("2d");
    paint[kind](px, S, r);
    // a little film fade + grain on the print
    px.fillStyle = "rgba(255,240,220,0.08)"; px.fillRect(0, 0, S, S);
    x.drawImage(pc, ix, iy);
    x.strokeStyle = "rgba(0,0,0,0.25)"; x.lineWidth = 1; x.strokeRect(ix, iy, S, S);
    x.fillStyle = "#2b2a28"; x.font = "600 46px KWHand"; x.textBaseline = "alphabetic";
    x.save(); x.translate(44, 466); x.rotate(-0.02); x.fillText(cap, 0, 0); x.restore();
    return c;
  };
  KWART.tape = (w, h, seed) => {
    const c = mk(w, h), x = c.getContext("2d"), r = rngOf(seed || 9);
    x.beginPath(); x.moveTo(0, 0);
    for (let xx = 0; xx <= w; xx += 8) x.lineTo(xx, (r() - 0.5) * 6 + 3);
    x.lineTo(w, h);
    for (let xx = w; xx >= 0; xx -= 8) x.lineTo(xx, h - 3 + (r() - 0.5) * 6);
    x.closePath();
    x.fillStyle = "rgba(214,196,160,0.78)"; x.fill();
    x.globalCompositeOperation = "source-atop";
    for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.12})`; x.fillRect(r() * w, r() * h, 3, 1); }
    return c;
  };
  KWART.ticket = () => {
    const W = 640, H = 250, c = mk(W, H), x = c.getContext("2d"), r = rngOf(31);
    x.fillStyle = "#ece2c8"; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 1200; i++) { x.fillStyle = `rgba(120,100,70,${r() * 0.06})`; x.fillRect(r() * W, r() * H, 2, 1); }
    x.save(); x.globalCompositeOperation = "destination-out";
    for (let yy = 12; yy < H; yy += 26) { x.beginPath(); x.arc(0, yy, 8, 0, Math.PI * 2); x.fill(); }
    x.beginPath(); x.arc(560, 60, 16, 0, Math.PI * 2); x.fill();
    x.restore();
    x.strokeStyle = "rgba(90,70,50,0.6)"; x.setLineDash([6, 6]); x.lineWidth = 2; x.beginPath(); x.moveTo(470, 10); x.lineTo(470, H - 10); x.stroke(); x.setLineDash([]);
    x.fillStyle = "#5b4630"; x.font = "700 44px KWGeo"; x.fillText("HARBOUR FERRY", 40, 80);
    x.font = "500 30px KWMono"; x.fillText("single · deck", 40, 130); x.fillText("No 0417   22:40", 40, 178);
    x.font = "700 64px KWGeo"; x.fillText("A", 515, 200);
    return c;
  };
  KWART.mug = () => {
    const S = 520, c = mk(S, S), x = c.getContext("2d");
    x.fillStyle = "#e9e6df"; x.beginPath(); x.arc(250, 260, 220, 0, Math.PI * 2); x.fill();
    x.fillStyle = "#e9e6df"; x.beginPath(); x.ellipse(470, 280, 70, 40, 0.1, 0, Math.PI * 2); x.fill();
    x.fillStyle = "rgba(0,0,0,0)"; x.save(); x.globalCompositeOperation = "destination-out"; x.beginPath(); x.ellipse(470, 280, 40, 18, 0.1, 0, Math.PI * 2); x.fill(); x.restore();
    const g = x.createRadialGradient(230, 240, 20, 250, 260, 190); g.addColorStop(0, "#5a3b26"); g.addColorStop(1, "#24160d");
    x.fillStyle = g; x.beginPath(); x.arc(250, 260, 185, 0, Math.PI * 2); x.fill();
    x.fillStyle = "rgba(255,255,255,0.25)"; x.beginPath(); x.ellipse(200, 200, 70, 30, -0.6, 0, Math.PI * 2); x.fill();
    x.strokeStyle = "rgba(255,255,255,0.6)"; x.lineWidth = 6; x.beginPath(); x.arc(250, 260, 214, 3.6, 5.2); x.stroke();
    return c;
  };
  KWART.pen = () => {
    const W = 700, H = 60, c = mk(W, H), x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#3a3a3e"); g.addColorStop(0.4, "#16161a"); g.addColorStop(1, "#050506");
    x.fillStyle = g; x.beginPath(); x.moveTo(40, 14); x.lineTo(620, 14); x.lineTo(690, 30); x.lineTo(620, 46); x.lineTo(40, 46); x.quadraticCurveTo(10, 30, 40, 14); x.fill();
    x.fillStyle = "#b9b9be"; x.fillRect(110, 8, 140, 8);
    x.fillStyle = "rgba(255,255,255,0.35)"; x.fillRect(50, 18, 560, 4);
    return c;
  };

  // crumpled-note paper + marker handwriting drawn on to prog
  KWART.note = (c, lines, prog) => {
    const W = c.width, H = c.height, x = c.getContext("2d"), r = rngOf(41);
    x.clearRect(0, 0, W, H);
    x.fillStyle = "#f3f1ea"; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 1600; i++) { x.fillStyle = `rgba(110,105,95,${r() * 0.05})`; x.fillRect(r() * W, r() * H, 2, 1); }
    x.strokeStyle = "rgba(120,150,190,0.3)"; x.lineWidth = 2;
    for (let ly = 120; ly < H; ly += 70) { x.beginPath(); x.moveTo(0, ly); x.lineTo(W, ly); x.stroke(); }
    // torn top edge holes
    x.fillStyle = "#cfcac0"; for (let hx = 30; hx < W; hx += 46) { x.beginPath(); x.arc(hx, 16, 7, 0, Math.PI * 2); x.fill(); }
    // handwriting: reveal glyph by glyph with a soft leading edge
    x.fillStyle = "#151417"; x.textBaseline = "alphabetic";
    let total = 0; lines.forEach((l) => (total += l.text.length));
    let shown = prog * total;
    lines.forEach((l) => {
      x.font = `400 ${l.size}px KWMarker`;
      let cx = l.x;
      for (let k = 0; k < l.text.length; k++) {
        const ch = l.text[k], a = Math.max(0, Math.min(1, shown - k));
        const cw = x.measureText(ch).width;
        if (a > 0) { x.save(); x.globalAlpha = a; x.translate(cx, l.y + (k % 3 - 1) * 2); x.rotate(l.rot || 0); x.fillText(ch, 0, 0); x.restore(); }
        cx += cw * 0.96;
      }
      shown -= l.text.length;
    });
  };

  KWART.qmark = () => {
    const W = 1100, H = 1700, c = mk(W, H), x = c.getContext("2d"), r = rngOf(51);
    x.fillStyle = "#f3f3f1"; x.textAlign = "center"; x.textBaseline = "alphabetic";
    x.font = "800 1880px KWGeo";
    x.fillText("?", W / 2, H * 0.93);
    // speckle + grain only on the glyph
    x.globalCompositeOperation = "source-atop";
    for (let i = 0; i < 5200; i++) { const s = r() < 0.9 ? 1.5 : 3 + r() * 5; x.fillStyle = `rgba(40,40,40,${0.08 + r() * 0.35})`; x.beginPath(); x.arc(r() * W, r() * H, s, 0, Math.PI * 2); x.fill(); }
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "rgba(255,255,255,0.0)"); g.addColorStop(1, "rgba(0,0,0,0.12)");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    return c;
  };

  window.KWART = KWART;
})();

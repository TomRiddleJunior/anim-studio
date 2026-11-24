/* film.js — "lofi-otter": six painterly night scenes of a small otter, one quiet line each (~22.3 s, 70 BPM bars).
   Each scene paints its static layers once (bg / mid / fg canvases with an 80 px bleed) and draws its living parts per
   frame. The camera drifts (zoom 1.00 -> 1.04 plus a slow pan) and every layer moves by its own depth factor (parallax).
   window.LOFI_FILM(V) -> { ready: Promise, draw(ctx, t), scenes }  (V.L(id) gives {start, end}). */
window.LOFI_FILM = function (V) {
  const { clamp, lerp, sstep, eio, rng } = LOFI.util;
  const W = 1080, H = 1920, M = 90;
  const BAR = 60 / 70 * 4; // 3.4286 s
  const CUTS = [0, BAR, 2 * BAR, 3 * BAR, 4.5 * BAR, 5.5 * BAR];
  const END = 22.3;

  function layer(paint, o = {}) { // paint into a (W+2M) x (H+2M) canvas whose origin is the frame's (0,0)
    const c = LOFI.canvas(W + 2 * M, H + 2 * M), x = c.getContext("2d");
    x.translate(M, M); paint(x);
    if (o.blur) { const c2 = LOFI.canvas(c.width, c.height), x2 = c2.getContext("2d"); x2.filter = `blur(${o.blur}px)`; x2.drawImage(c, 0, 0); return finish(c2, o); }
    return finish(c, o);
  }
  function finish(c, o) { const x = c.getContext("2d"); x.setTransform(1, 0, 0, 1, 0, 0); LOFI.brush(x, o.kd == null ? 0.5 : o.kd, o.kl == null ? 0.25 : o.kl, o.off || [0, 0]); return c; }

  // ================================================================== scene 1: café window, rain
  const S1 = {
    paint() {
      this.bg = layer((x) => {
        x.fillStyle = LOFI.lin(x, 0, -M, 0, H, [[0, "#1b3a44"], [0.55, "#2a5560"], [1, "#16323a"]]); x.fillRect(-M, -M, W + 2 * M, H + 2 * M);
        // facade across the street
        x.fillStyle = "#2f5a63"; x.fillRect(-M, 120, W + 2 * M, 900);
        const r = rng(4);
        for (let row = 0; row < 3; row++) for (let col = 0; col < 6; col++) {
          const wx = -40 + col * 200, wy = 200 + row * 230, lit = r() < 0.3;
          x.fillStyle = "#23464f"; x.fillRect(wx - 10, wy - 12, 120, 190);
          x.fillStyle = lit ? "#d99a55" : "#1c3a42"; x.fillRect(wx, wy, 100, 166);
          x.fillStyle = "rgba(0,0,0,0.25)"; x.fillRect(wx + 48, wy, 5, 166); x.fillRect(wx, wy + 80, 100, 5);
          if (lit) LOFI.glow(x, wx + 50, wy + 80, 160, "rgba(255,170,90,0.25)");
        }
        // shop fronts at street level with warm glows
        x.fillStyle = "#1b343a"; x.fillRect(-M, 900, W + 2 * M, 260);
        [[30, "#e08a45"], [330, "#d97a3a"], [700, "#e3934c"], [960, "#cf7438"]].forEach(([sx, col]) => {
          x.fillStyle = col; x.fillRect(sx, 940, 170, 200); LOFI.glow(x, sx + 85, 1040, 260, "rgba(255,150,70,0.35)");
          x.fillStyle = "rgba(30,40,40,0.5)"; x.fillRect(sx + 80, 940, 8, 200);
        });
        // wet street with reflections
        x.fillStyle = LOFI.lin(x, 0, 1160, 0, 1400, [[0, "#244a52"], [1, "#183238"]]); x.fillRect(-M, 1160, W + 2 * M, 400);
        [[115, "rgba(240,150,80,0.35)"], [415, "rgba(240,140,70,0.3)"], [785, "rgba(240,155,85,0.35)"], [1045, "rgba(230,130,70,0.3)"]].forEach(([rx, col]) => { x.fillStyle = col; x.fillRect(rx - 40, 1170, 80, 220); });
        // a street lamp
        x.fillStyle = "#14262b"; x.fillRect(600, 520, 14, 640); LOFI.glow(x, 607, 520, 120, "rgba(255,210,150,0.5)");
      }, { blur: 3.5, kd: 0.35, kl: 0.25 });
      this.mid = layer((x) => {
        // dark café wall around the window; window x 70..1010, y 150..1240
        x.fillStyle = "#0e1a1e"; x.beginPath(); x.rect(-M, -M, W + 2 * M, H + 2 * M); x.rect(1010, 150, -940, 1090); x.fill("evenodd");
        // awning scallops seen through the top of the glass
        x.fillStyle = "#13262c"; x.fillRect(70, 150, 940, 70);
        for (let k = 0; k < 12; k++) { x.beginPath(); x.arc(110 + k * 80, 220, 40, 0, Math.PI); x.fill(); }
        // mullions
        x.fillStyle = "#0b1518"; [380, 700].forEach((mx) => x.fillRect(mx - 14, 150, 28, 1090));
        x.fillStyle = "#16262b"; x.fillRect(60, 1236, 960, 26);
        // pendant lamp cord + shade
        x.strokeStyle = "#0a1012"; x.lineWidth = 4; x.beginPath(); x.moveTo(560, -M); x.lineTo(560, 300); x.stroke();
        x.fillStyle = "#1a2426"; x.beginPath(); x.moveTo(470, 360); x.quadraticCurveTo(560, 270, 650, 360); x.closePath(); x.fill();
        // floor tiles
        x.fillStyle = "#16292e"; x.fillRect(-M, 1500, W + 2 * M, 600);
        for (let i = 0; i < 16; i++) for (let j = 0; j < 7; j++) if ((i + j) % 2) { x.fillStyle = "#1f3a40"; x.beginPath(); const y0 = 1500 + j * 70, sc = 1 + j * 0.25; x.moveTo(-200 + i * 100 * sc, y0); x.lineTo(-200 + (i + 1) * 100 * sc, y0); x.lineTo(-200 + (i + 1) * 100 * (sc + 0.25), y0 + 70); x.lineTo(-200 + i * 100 * (sc + 0.25), y0 + 70); x.fill(); }
        // a second table at left (empty)
        x.fillStyle = "#3a2216"; x.beginPath(); x.ellipse(170, 1300, 230, 46, 0, 0, 6.283); x.fill();
        x.fillStyle = "#54301c"; x.beginPath(); x.ellipse(170, 1290, 230, 40, 0, 0, 6.283); x.fill();
        x.fillStyle = "#24140c"; x.fillRect(160, 1320, 22, 280);
      }, { kd: 0.45, kl: 0.18 });
      this.fg = layer((x) => {
        // two bentwood chairs in the foreground
        const chair = (cx, cy, s) => {
          x.save(); x.translate(cx, cy); x.scale(s, s); x.strokeStyle = "#1a0f0a"; x.lineWidth = 16; x.lineCap = "round";
          x.beginPath(); x.moveTo(-90, 0); x.bezierCurveTo(-110, -260, 110, -260, 90, 0); x.stroke();
          x.lineWidth = 9; x.beginPath(); x.moveTo(-60, -40); x.bezierCurveTo(-70, -190, 70, -190, 60, -40); x.stroke();
          x.lineWidth = 14; x.beginPath(); x.moveTo(-100, 0); x.lineTo(-110, 330); x.moveTo(100, 0); x.lineTo(115, 330); x.stroke();
          x.fillStyle = "#2a160c"; x.beginPath(); x.ellipse(0, 10, 120, 30, 0, 0, 6.283); x.fill();
          x.restore();
        };
        chair(150, 1560, 1.3); chair(930, 1600, 1.5);
      }, { blur: 5, kd: 0.3, kl: 0.15 });
    },
    cam: (u) => [lerp(1.0, 1.035, eio(u)), lerp(-12, 18, u), lerp(0, -10, u)],
    draw(c, lt, cam) {
      const { px } = cam;
      px(c, 0.5, () => { c.drawImage(this.bg, -M, -M); c.save(); c.beginPath(); c.rect(70, 150, 940, 1090); c.clip();
        // a passer-by with an umbrella outside
        const wx = lerp(-160, 1240, (lt + 0.6) / 6.5);
        c.globalAlpha = 0.55; c.fillStyle = "#0f1f24"; c.beginPath(); c.ellipse(wx, 1010, 90, 34, 0, Math.PI, 0); c.fill(); c.fillRect(wx - 3, 1010, 6, 70);
        c.fillRect(wx - 24, 1040, 48, 120); c.fillRect(wx - 20, 1160, 14, 70 + Math.sin(lt * 8) * 8); c.fillRect(wx + 6, 1160, 14, 70 - Math.sin(lt * 8) * 8); c.globalAlpha = 1;
        LOFI.rain(c, lt, { seed: 2, n: 150, area: [60, 150, 1020, 1240], col: "rgba(190,225,230,0.35)", speed: [1100, 1600] });
        c.restore(); });
      px(c, 0.8, () => { c.drawImage(this.mid, -M, -M);
        c.save(); c.beginPath(); c.rect(70, 150, 940, 1090); c.clip(); LOFI.drops(c, lt, { seed: 4, n: 120, trails: 10, area: [70, 220, 1010, 1240] }); c.restore();
        // lamp bulb + its cone of light
        c.fillStyle = "#ffe2a8"; c.beginPath(); c.ellipse(560, 356, 44, 12, 0, 0, 6.283); c.fill();
        LOFI.glow(c, 560, 380, 520, `rgba(255,190,110,${0.42 + 0.02 * Math.sin(lt * 9)})`);
        c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = LOFI.lin(c, 0, 360, 0, 1200, [[0, "rgba(255,200,120,0.22)"], [1, "rgba(255,200,120,0)"]]);
        c.beginPath(); c.moveTo(500, 360); c.lineTo(620, 360); c.lineTo(900, 1200); c.lineTo(220, 1200); c.closePath(); c.fill(); c.restore();
      });
      px(c, 1.0, () => {
        LOFI.glow(c, 640, 900, 420, "rgba(255,170,90,0.22)");
        LOFI.char(c, (x) => LOFI.otter(x, "cafe", { x: 590, y: 985, s: 1.9, t: lt, eyes: "half", paws: false }), { lights: [[560, 420, 700, "rgba(255,170,90,0.28)"], [300, 760, 360, "rgba(110,200,215,0.22)"]], shade: "rgba(10,25,30,0.10)" });
        // the otter's table and the two cups
        c.fillStyle = "#3c2215"; c.beginPath(); c.ellipse(700, 1232, 300, 58, 0, 0, 6.283); c.fill();
        c.fillStyle = LOFI.lin(c, 400, 1200, 1000, 1240, [[0, "#6a3c22"], [1, "#4a2a18"]]); c.beginPath(); c.ellipse(700, 1220, 300, 50, 0, 0, 6.283); c.fill();
        c.fillStyle = "#24140c"; c.fillRect(686, 1270, 30, 330);
        const cup = (cx, cy, full) => { c.fillStyle = "#e7ddcf"; c.beginPath(); c.ellipse(cx, cy + 6, 46, 12, 0, 0, 6.283); c.fill(); c.fillStyle = "#efe6d8"; LOFI.rr(c, cx - 28, cy - 50, 56, 56, 12); c.fill(); c.strokeStyle = "#efe6d8"; c.lineWidth = 7; c.beginPath(); c.arc(cx + 30, cy - 26, 12, -1.2, 1.2); c.stroke();
          if (full) { c.fillStyle = "#4a2a18"; c.beginPath(); c.ellipse(cx, cy - 50, 26, 6, 0, 0, 6.283); c.fill(); } };
        cup(900, 1214, false); cup(760, 1206, true);
        LOFI.char(c, (x) => { x.translate(590, 985); x.scale(1.9, 1.9); LOFI.paw(x, 76, 118, 1.15, 0.4); LOFI.paw(x, 116, 119, 1.15, -0.3); }, { lights: [[560, 420, 900, "rgba(255,170,90,0.3)"]] });
        LOFI.steam(c, lt, 760, 1150, { n: 3, h: 190, a: 0.45, s: 26 });
        LOFI.glow(c, 470, 820, 260, "rgba(120,200,210,0.10)");
        LOFI.glow(c, 700, 1100, 360, "rgba(255,170,90,0.18)");
      });
      px(c, 1.3, () => c.drawImage(this.fg, -M, -M));
    },
  };

  // ================================================================== scene 2: floating in a puddle, top-down
  const PUDDLE = [[140, 520], [420, 380], [760, 430], [1000, 620], [1030, 980], [930, 1360], [1000, 1640], [700, 1780], [330, 1700], [90, 1460], [40, 1080], [70, 760]];
  const S2 = {
    paint() {
      this.bg = layer((x) => {
        x.fillStyle = "#2e3743"; x.fillRect(-M, -M, W + 2 * M, H + 2 * M);
        const r = rng(8); for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${r() < 0.5 ? "200,210,225" : "10,12,18"},${0.05 + r() * 0.12})`; x.fillRect(-M + r() * (W + 2 * M), -M + r() * (H + 2 * M), 2 + r() * 4, 2 + r() * 4); }
        // the curb at the top-right
        x.fillStyle = "#59616e"; x.beginPath(); x.moveTo(380, -M); x.lineTo(W + M, -M); x.lineTo(W + M, 200); x.closePath(); x.fill();
        x.fillStyle = "#6b7482"; x.beginPath(); x.moveTo(420, -M); x.lineTo(W + M, -M); x.lineTo(W + M, 150); x.closePath(); x.fill();
        x.strokeStyle = "#1d242d"; x.lineWidth = 10; x.beginPath(); x.moveTo(370, -M); x.lineTo(W + M, 205); x.stroke();
        // fallen leaves
        [[260, 260, 0.6, "#c0662e"], [880, 1840, -0.4, "#b5552a"], [120, 1780, 1.2, "#cf8a3a"]].forEach(([lx, ly, a, col]) => { x.save(); x.translate(lx, ly); x.rotate(a); x.fillStyle = col; x.beginPath(); x.moveTo(-40, 0); x.quadraticCurveTo(0, -26, 40, 0); x.quadraticCurveTo(0, 26, -40, 0); x.fill(); x.strokeStyle = "rgba(60,25,10,0.6)"; x.lineWidth = 2; x.beginPath(); x.moveTo(-40, 0); x.lineTo(46, 0); x.stroke(); x.restore(); });
        // the puddle: wet rim, then water with the sky and a lamp reflection
        x.fillStyle = "#232a34"; LOFI.blob(x, PUDDLE.map(([a, b]) => [a + (a - 540) * 0.06, b + (b - 1080) * 0.04]), 30, 2); x.fill();
        x.fillStyle = LOFI.lin(x, 0, 380, 0, 1780, [[0, "#47678c"], [0.5, "#3b5b80"], [1, "#2c4566"]]); LOFI.blob(x, PUDDLE, 24, 3); x.fill();
        x.save(); LOFI.blob(x, PUDDLE, 24, 3); x.clip();
        x.fillStyle = "rgba(160,190,225,0.18)"; x.beginPath(); x.ellipse(620, 820, 380, 120, -0.5, 0, 6.283); x.fill();
        LOFI.glow(x, 260, 640, 260, "rgba(255,200,130,0.5)"); LOFI.glow(x, 260, 640, 70, "rgba(255,235,190,0.8)");
        x.strokeStyle = "rgba(20,30,45,0.6)"; x.lineWidth = 6; x.beginPath(); x.moveTo(260, 640); x.lineTo(160, 380); x.stroke(); // the lamp post reflected
        x.restore();
        x.strokeStyle = "rgba(200,220,245,0.35)"; x.lineWidth = 4; LOFI.blob(x, PUDDLE, 24, 3); x.stroke();
      }, { kd: 0.45, kl: 0.25 });
    },
    cam: (u) => [lerp(1.0, 1.04, eio(u)), lerp(10, -14, u), lerp(-8, 10, u)],
    draw(c, lt, cam) {
      const { px } = cam;
      px(c, 0.85, () => {
        c.drawImage(this.bg, -M, -M);
        c.save(); LOFI.blob(c, PUDDLE, 24, 3); c.clip();
        // ripples from raindrops
        const r = rng(12);
        for (let i = 0; i < 26; i++) {
          const per = 0.9 + r() * 1.2, ph = r() * per, x0 = 80 + r() * 940, y0 = 420 + r() * 1300, age = ((lt + ph) % per) / per;
          const rad = 8 + age * 70; c.strokeStyle = `rgba(210,228,250,${0.45 * (1 - age)})`; c.lineWidth = 2.5; c.beginPath(); c.ellipse(x0, y0, rad, rad * 0.8, 0, 0, 6.283); c.stroke();
          if (age > 0.3) { c.beginPath(); c.ellipse(x0, y0, rad * 0.6, rad * 0.48, 0, 0, 6.283); c.stroke(); }
        }
        // rings around the floating otter
        for (let k = 0; k < 3; k++) { const a = ((lt * 0.5 + k / 3) % 1); c.strokeStyle = `rgba(200,220,245,${0.3 * (1 - a)})`; c.lineWidth = 3; c.beginPath(); c.ellipse(560, 1090, 290 + a * 170, 420 + a * 170, -0.32, 0, 6.283); c.stroke(); }
        c.restore();
      });
      px(c, 1.0, () => {
        // the paper boat drifting
        const bx = lerp(840, 760, lt / 3.5), by = lerp(1500, 1440, lt / 3.5);
        c.save(); c.translate(bx, by); c.rotate(-0.5 + Math.sin(lt * 1.3) * 0.08);
        c.fillStyle = "rgba(20,30,45,0.35)"; c.beginPath(); c.ellipse(4, 10, 64, 26, 0, 0, 6.283); c.fill();
        c.fillStyle = "#e9e3d6"; c.beginPath(); c.moveTo(-60, 0); c.lineTo(60, 0); c.lineTo(36, 22); c.lineTo(-36, 22); c.closePath(); c.fill();
        c.fillStyle = "#d3ccbd"; c.beginPath(); c.moveTo(-30, 0); c.lineTo(0, -46); c.lineTo(30, 0); c.closePath(); c.fill(); c.restore();
        LOFI.char(c, (x) => LOFI.otter(x, "float", { x: 545, y: 960, s: 1.85, t: lt, rot: -0.32 + lt * 0.012 }), { lights: [[260, 640, 600, "rgba(255,190,120,0.22)"], [800, 1300, 600, "rgba(120,160,220,0.18)"]], shade: "rgba(20,35,60,0.12)" });
      });
      LOFI.rain(c, lt, { seed: 21, n: 70, col: "rgba(215,230,250,0.4)", speed: [1500, 2100], len: [40, 90], slant: 0.05 });
    },
  };

  // ================================================================== scene 3: in bed, from above, phone face down
  const S3 = {
    paint() {
      this.bg = layer((x) => {
        x.fillStyle = "#151c38"; x.fillRect(-M, -M, W + 2 * M, H + 2 * M);
        // bed frame + sheet
        x.fillStyle = "#26305c"; x.fillRect(40, 60, 1000, 1900);
        x.fillStyle = "#1b2347"; x.fillRect(40, 60, 1000, 70);
        x.fillStyle = LOFI.lin(x, 0, 120, 0, 1900, [[0, "#5b6fa5"], [1, "#4b5d92"]]); x.fillRect(90, 140, 900, 1800);
        // pillows (striped)
        const pillow = (px_, py, a) => { x.save(); x.translate(px_, py); x.rotate(a); x.fillStyle = "#8ea3d6"; LOFI.rr(x, -190, -110, 380, 220, 60); x.fill();
          x.save(); LOFI.rr(x, -190, -110, 380, 220, 60); x.clip(); x.strokeStyle = "rgba(240,245,255,0.5)"; x.lineWidth = 9; for (let k = -170; k < 190; k += 44) { x.beginPath(); x.moveTo(k, -120); x.quadraticCurveTo(k + 10, 0, k, 120); x.stroke(); } x.restore();
          x.fillStyle = "rgba(20,30,70,0.25)"; LOFI.rr(x, -190, 40, 380, 70, 40); x.fill(); x.restore(); };
        pillow(300, 560, -0.08); pillow(720, 590, 0.1);
        // blanket covering the lower part, folded back at the top
        x.fillStyle = LOFI.lin(x, 0, 760, 0, 1900, [[0, "#7e93c9"], [1, "#5a6ea8"]]);
        LOFI.blob(x, [[60, 1000], [400, 950], [700, 990], [1030, 950], [1050, 1400], [1040, 1960], [40, 1960], [50, 1400]], 30, 5); x.fill();
        x.fillStyle = "#97aadb"; LOFI.blob(x, [[60, 1000], [400, 950], [700, 990], [1030, 950], [1020, 1070], [700, 1090], [400, 1060], [70, 1110]], 16, 6); x.fill();
        x.strokeStyle = "rgba(240,245,255,0.35)"; x.lineWidth = 8; for (let k = 0; k < 9; k++) { x.beginPath(); x.moveTo(110 + k * 105, 1120); x.quadraticCurveTo(140 + k * 105, 1500, 100 + k * 110, 1900); x.stroke(); }
        x.strokeStyle = "rgba(20,30,70,0.35)"; x.lineWidth = 14; [[200, 1100, 600, 1500], [700, 1000, 950, 1650], [150, 1600, 520, 1850]].forEach(([a, b, c_, d]) => { x.beginPath(); x.moveTo(a, b); x.quadraticCurveTo((a + c_) / 2 + 60, (b + d) / 2, c_, d); x.stroke(); });
        // headphones on the blanket
        x.save(); x.translate(240, 1560); x.rotate(-0.4); x.strokeStyle = "#202024"; x.lineWidth = 16; x.beginPath(); x.arc(0, 0, 80, Math.PI * 0.9, Math.PI * 2.1); x.stroke();
        x.fillStyle = "#2a2a30"; LOFI.rr(x, -112, -10, 48, 74, 18); x.fill(); LOFI.rr(x, 64, -10, 48, 74, 18); x.fill(); x.restore();
      }, { kd: 0.45, kl: 0.22 });
    },
    cam: (u) => [lerp(1.0, 1.035, eio(u)), lerp(-10, 10, u), lerp(10, -6, u)],
    draw(c, lt, cam) {
      const { px } = cam;
      px(c, 0.9, () => {
        c.drawImage(this.bg, -M, -M);
        // phone face down on the sheet, its light leaking at the edges
        c.save(); c.translate(220, 960); c.rotate(-0.55);
        LOFI.glow(c, 0, 0, 150, `rgba(140,220,255,${0.22 + 0.06 * Math.sin(lt * 2.4)})`);
        c.fillStyle = "#1c2030"; LOFI.rr(c, -46, -90, 92, 180, 16); c.fill(); c.strokeStyle = "rgba(150,225,255,0.5)"; c.lineWidth = 2; c.stroke();
        c.fillStyle = "#2a2f42"; c.beginPath(); c.arc(-22, -64, 10, 0, 6.283); c.fill(); c.restore();
      });
      px(c, 1.0, () => {
        // breathing blanket bump over the curled body + the otter's head on the pillow
        const b = 1 + Math.sin(lt * 2.0) * 0.015;
        c.save(); c.translate(610, 1190); c.scale(1.15, b * 1.1);
        c.fillStyle = LOFI.rad(c, -60, -80, 20, 360, [[0, "#a9badf"], [1, "#6b80b9"]]); LOFI.blob(c, [[-300, -160], [0, -260], [280, -150], [320, 120], [120, 260], [-220, 220], [-330, 40]], 20, 9); c.fill();
        c.strokeStyle = "rgba(30,40,80,0.35)"; c.lineWidth = 10; c.beginPath(); c.moveTo(-200, -60); c.quadraticCurveTo(-20, 40, 180, -20); c.moveTo(-160, 120); c.quadraticCurveTo(40, 160, 220, 90); c.stroke();
        c.restore();
        LOFI.char(c, (x) => LOFI.otter(x, "curl", { x: 540, y: 820, s: 2.0, t: lt, rot: 0.35 }), { lights: [[900, 900, 700, "rgba(140,170,255,0.28)"]], shade: "rgba(20,30,80,0.22)" });
      });
      // moonlight through the window (a pane-shaped patch with a cross shadow), drops sliding through it
      c.save(); c.globalCompositeOperation = "screen";
      const sh = lt * 6;
      c.translate(sh, 0);
      const pane = [[640, 900], [1160, 980], [1080, 1820], [520, 1720]];
      c.beginPath(); pane.forEach(([x0, y0], i) => (i ? c.lineTo(x0, y0) : c.moveTo(x0, y0))); c.closePath(); c.clip();
      c.fillStyle = "rgba(130,160,235,0.30)"; c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = "multiply"; c.strokeStyle = "rgba(40,50,100,0.55)"; c.lineWidth = 26;
      c.beginPath(); c.moveTo(900, 940); c.lineTo(800, 1770); c.moveTo(580, 1310); c.lineTo(1120, 1400); c.stroke();
      const r = rng(31); c.fillStyle = "rgba(30,40,90,0.55)";
      for (let i = 0; i < 26; i++) { const x0 = 520 + r() * 620, sp = 40 + r() * 90, y0 = 900 + ((r() * 900 + sp * lt) % 900); c.beginPath(); c.ellipse(x0, y0, 6, 10, 0, 0, 6.283); c.fill(); c.fillRect(x0 - 2, y0 - 40 - r() * 40, 4, 40); }
      c.restore();
    },
  };

  // ================================================================== scene 4: standing still in a passing crowd
  function person(seed, s, col) { // a soft passer-by sprite (pre-blurred later): hair, face, coat, scarf, legs, maybe an umbrella or a bag
    const r = rng(seed), c = LOFI.canvas(420, 1100), x = c.getContext("2d");
    x.translate(210, 1060); x.scale(s, s);
    const skin = ["#c9a088", "#8d6450", "#e0b89a", "#6e4a36"][Math.floor(r() * 4)];
    const scarf = ["#b0563c", "#d9b25a", "#6f8fa8", "#9a4a6a"][Math.floor(r() * 4)];
    x.fillStyle = "#24201f"; x.fillRect(-72, -380, 58, 360); x.fillRect(16, -380, 58, 360);
    x.fillStyle = "#151313"; x.beginPath(); x.ellipse(-44, -14, 48, 18, 0, 0, 6.283); x.ellipse(46, -14, 48, 18, 0, 0, 6.283); x.fill();
    x.fillStyle = col; LOFI.rr(x, -112, -770, 224, 450, 70); x.fill();
    x.fillStyle = "rgba(255,255,255,0.08)"; LOFI.rr(x, -112, -770, 70, 450, 50); x.fill();
    x.fillStyle = scarf; LOFI.rr(x, -70, -790, 140, 50, 22); x.fill();
    x.fillStyle = skin; x.beginPath(); x.ellipse(0, -850, 58, 68, 0, 0, 6.283); x.fill();
    x.fillStyle = "#1e1714"; x.beginPath(); x.ellipse(0, -885, 62, 44, 0, Math.PI, 0); x.fill();
    if (r() < 0.45) { x.fillStyle = "#1c1c22"; x.beginPath(); x.ellipse(0, -960, 230, 90, 0, Math.PI, 0); x.fill(); x.fillRect(-5, -960, 10, 170); }
    else if (r() < 0.6) { x.fillStyle = "#3a2a20"; LOFI.rr(x, 96, -560, 74, 120, 14); x.fill(); }
    return c;
  }
  const S4 = {
    paint() {
      this.bg = layer((x) => {
        x.fillStyle = "#3a3b44"; x.fillRect(-M, -M, W + 2 * M, H + 2 * M);
        x.fillStyle = "#46454d"; x.fillRect(-M, -M, 560, 1500); x.fillStyle = "#3e3e46"; x.fillRect(470, -M, W, 1500);
        // windows with warm interiors + a balcony rail
        [[60, 220], [270, 220], [660, 160], [880, 160]].forEach(([wx, wy]) => { x.fillStyle = "#1c1d22"; x.fillRect(wx - 12, wy - 12, 164, 274); x.fillStyle = "#3a332c"; x.fillRect(wx, wy, 140, 250); LOFI.glow(x, wx + 70, wy + 140, 150, "rgba(255,170,90,0.22)"); });
        x.strokeStyle = "#1b1c20"; x.lineWidth = 6; x.beginPath(); x.moveTo(40, 520); x.lineTo(460, 520); for (let k = 40; k <= 460; k += 30) { x.moveTo(k, 520); x.lineTo(k, 600); } x.stroke();
        // the doorway with warm light
        x.fillStyle = "#1a1715"; x.fillRect(640, 640, 300, 620); x.fillStyle = "#6b4a2a"; x.fillRect(662, 662, 256, 598);
        LOFI.glow(x, 790, 900, 360, "rgba(255,170,90,0.35)"); x.fillStyle = "#ffcf8a"; x.beginPath(); x.arc(790, 610, 16, 0, 6.283); x.fill(); LOFI.glow(x, 790, 610, 120, "rgba(255,200,120,0.6)");
        // pavement, wet, with reflections
        x.fillStyle = LOFI.lin(x, 0, 1260, 0, 2000, [[0, "#3a3c44"], [1, "#24252b"]]); x.fillRect(-M, 1260, W + 2 * M, 900);
        x.strokeStyle = "rgba(0,0,0,0.25)"; x.lineWidth = 4; for (let k = -2; k < 9; k++) { x.beginPath(); x.moveTo(k * 160, 1260); x.lineTo(k * 260 - 300, 2000); x.stroke(); }
        x.beginPath(); x.moveTo(-M, 1420); x.lineTo(W + M, 1420); x.moveTo(-M, 1640); x.lineTo(W + M, 1640); x.stroke();
        x.fillStyle = "rgba(255,170,90,0.18)"; x.fillRect(740, 1270, 100, 360);
        // a bench at left and the lamppost
        x.fillStyle = "#3a2a20"; x.fillRect(-M, 1180, 200, 26); x.fillRect(-M, 1240, 200, 24); x.fillStyle = "#1b1b1e"; x.fillRect(80, 1206, 16, 120);
        x.strokeStyle = "#232b28"; x.lineWidth = 22; x.lineCap = "round"; x.beginPath(); x.moveTo(930, 1430); x.lineTo(930, 380); x.quadraticCurveTo(930, 240, 800, 260); x.stroke();
        x.fillStyle = "#232b28"; x.beginPath(); x.moveTo(740, 300); x.quadraticCurveTo(800, 230, 860, 300); x.closePath(); x.fill();
      }, { blur: 2, kd: 0.45, kl: 0.22 });
      this.sprites = [];
      for (let i = 0; i < 9; i++) {
        const sp = person(40 + i, 0.9 + (i % 3) * 0.08, ["#2e3448", "#5a3a34", "#4a4a3a", "#6b5a48", "#3a2f3f"][i % 5]);
        const c = LOFI.canvas(sp.width, sp.height), x = c.getContext("2d"); x.filter = `blur(${4 + (i % 3) * 2.5}px)`; x.drawImage(sp, 0, 0); this.sprites.push(c);
      }
    },
    cam: (u) => [lerp(1.0, 1.03, eio(u)), lerp(0, 8, u), lerp(0, -6, u)],
    draw(c, lt, cam) {
      const { px } = cam;
      px(c, 0.6, () => {
        c.drawImage(this.bg, -M, -M);
        LOFI.glow(c, 800, 300, 200, `rgba(255,210,140,${0.5 + 0.03 * Math.sin(lt * 7)})`);
        // far walkers (behind the otter)
        this.walkers(c, lt, 0);
      });
      px(c, 1.0, () => {
        c.fillStyle = "rgba(0,0,0,0.35)"; c.beginPath(); c.ellipse(540, 1735, 220, 34, 0, 0, 6.283); c.fill();
        LOFI.char(c, (x) => LOFI.otter(x, "stand", { x: 540, y: 1235, s: 1.9, t: lt }), { lights: [[820, 900, 700, "rgba(255,170,90,0.25)"], [200, 700, 500, "rgba(150,170,210,0.18)"]], shade: "rgba(30,30,40,0.12)" });
        LOFI.glow(c, 540, 1150, 420, "rgba(255,200,90,0.14)"); LOFI.glow(c, 800, 900, 500, "rgba(255,170,90,0.10)");
      });
      px(c, 1.25, () => this.walkers(c, lt, 1));
      LOFI.rain(c, lt, { seed: 41, n: 140, col: "rgba(200,205,220,0.3)", speed: [1300, 1900] });
    },
    walkers(c, lt, front) {
      const r = rng(front ? 77 : 55);
      const n = front ? 5 : 6;
      for (let i = 0; i < n; i++) {
        const sp = this.sprites[(i * 2 + front) % this.sprites.length], dir = r() < 0.5 ? 1 : -1, v = (front ? 520 : 300) + r() * 240, ph = r() * 3000;
        const s = front ? 1.6 + r() * 0.4 : 0.85 + r() * 0.25, yb = front ? 2150 + r() * 120 : 1500 + r() * 80;
        const span = W + 900; const xx = ((ph + v * lt) % span) - 450; const x = dir > 0 ? xx : W - xx;
        c.save(); c.globalAlpha = front ? 0.5 + r() * 0.15 : 0.6 + r() * 0.2;
        for (let k = 0; k < 3; k++) { c.globalAlpha *= k ? 0.55 : 1; c.drawImage(sp, x - 210 * s - dir * k * 22, yb - 1100 * s, 420 * s, 1100 * s); }
        c.restore();
      }
    },
  };

  // ================================================================== scene 5: an early night, side view
  const S5 = {
    paint() {
      this.bg = layer((x) => {
        x.fillStyle = "#262b40"; x.fillRect(-M, -M, W + 2 * M, H + 2 * M);
        // the window at right with the rainy city
        x.fillStyle = LOFI.lin(x, 0, 120, 0, 1180, [[0, "#1d2847"], [1, "#2f3d63"]]); x.fillRect(560, 120, 560, 1060);
        const r = rng(51);
        [[600, 560, 160, "#1a2038"], [740, 300, 150, "#202741"], [880, 620, 200, "#1a2038"], [1000, 420, 140, "#1d2440"]].forEach(([bx, by, bw, col]) => {
          x.fillStyle = col; x.fillRect(bx, by, bw, 1200 - by);
          for (let wy = by + 30; wy < 1160; wy += 46) for (let wx = bx + 16; wx < bx + bw - 20; wx += 34) if (r() < 0.32) { x.fillStyle = r() < 0.7 ? "#e2a35a" : "#f0c27a"; x.fillRect(wx, wy, 16, 22); LOFI.glow(x, wx + 8, wy + 11, 30, "rgba(255,180,90,0.35)"); }
        });
        x.fillStyle = "#1c2033"; x.fillRect(780, 180, 40, 120); // a spire on the tall block
        // sheer curtain on the window's left edge + frame
        x.fillStyle = "rgba(200,205,230,0.18)"; x.fillRect(560, 100, 90, 1100);
        x.strokeStyle = "#141827"; x.lineWidth = 26; x.strokeRect(560, 120, 600, 1060);
        // prints on the wall
        [[110, 320, 130, 170], [290, 420, 110, 140], [140, 580, 100, 120]].forEach(([fx, fy, fw, fh]) => { x.fillStyle = "#171a28"; x.fillRect(fx, fy, fw, fh); x.fillStyle = "#3f4766"; x.fillRect(fx + 12, fy + 12, fw - 24, fh - 24); x.fillStyle = "#57628a"; x.beginPath(); x.moveTo(fx + 20, fy + fh - 20); x.lineTo(fx + fw / 2, fy + 30); x.lineTo(fx + fw - 20, fy + fh - 20); x.fill(); });
        // headboard + bed
        x.fillStyle = "#4a3021"; LOFI.rr(x, -40, 860, 120, 520, 20); x.fill();
        x.fillStyle = "#c7b9a4"; LOFI.blob(x, [[40, 980], [300, 940], [380, 1040], [300, 1130], [60, 1140]], 14, 2); x.fill();
        x.fillStyle = "#a99a86"; LOFI.blob(x, [[70, 1050], [330, 1010], [430, 1110], [320, 1180], [80, 1190]], 14, 3); x.fill();
        x.fillStyle = LOFI.lin(x, 0, 1120, 0, 1500, [[0, "#d8cfc2"], [1, "#b3a796"]]); x.fillRect(40, 1150, 1100, 120);
        x.fillStyle = LOFI.lin(x, 0, 1180, 0, 1700, [[0, "#4c5a45"], [1, "#2f382c"]]);
        LOFI.blob(x, [[260, 1190], [700, 1170], [1120, 1200], [1130, 1700], [380, 1740], [300, 1480]], 20, 7); x.fill();
        x.strokeStyle = "rgba(20,25,18,0.45)"; x.lineWidth = 12; [[420, 1300, 800, 1420], [600, 1500, 1000, 1560], [380, 1620, 760, 1700]].forEach(([a, b, c_, d]) => { x.beginPath(); x.moveTo(a, b); x.quadraticCurveTo((a + c_) / 2, (b + d) / 2 - 40, c_, d); x.stroke(); });
        x.fillStyle = "#3a2419"; x.fillRect(-M, 1700, W + 2 * M, 400);
      }, { kd: 0.5, kl: 0.22 });
      this.fg = layer((x) => {
        // nightstand, lamp, mug, books, and a pothos in the foreground
        x.fillStyle = "#3b2618"; x.fillRect(-M, 1420, 330, 600); x.fillStyle = "#523522"; x.fillRect(-M, 1400, 340, 40);
        x.fillStyle = "#26303a"; LOFI.rr(x, 20, 1330, 150, 30, 6); x.fill(); x.fillStyle = "#6b3a2a"; LOFI.rr(x, 30, 1300, 140, 30, 6); x.fill();
        x.fillStyle = "#3a2a22"; x.fillRect(60, 1180, 18, 220); x.fillStyle = "#e0b070"; x.beginPath(); x.moveTo(-10, 1190); x.lineTo(150, 1190); x.lineTo(110, 1080); x.lineTo(30, 1080); x.closePath(); x.fill();
        x.fillStyle = "#5a4a40"; LOFI.rr(x, 200, 1320, 70, 82, 14); x.fill(); x.strokeStyle = "#5a4a40"; x.lineWidth = 8; x.beginPath(); x.arc(274, 1356, 18, -1.2, 1.2); x.stroke();
        const leaf = (lx, ly, s, a) => { x.save(); x.translate(lx, ly); x.rotate(a); x.scale(s, s); x.fillStyle = "#18241a"; x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(40, -40, 90, -10, 100, 30); x.bezierCurveTo(60, 50, 20, 40, 0, 0); x.fill(); x.restore(); };
        for (let k = 0; k < 14; k++) leaf(-40 + k * 18, -60 + k * 70, 1.1, 0.6 + k * 0.2);
        for (let k = 0; k < 10; k++) leaf(-60 + (k % 3) * 60, 1780 + k * 20, 1.6, -1.2 + k * 0.4);
      }, { blur: 2.5, kd: 0.4, kl: 0.15 });
    },
    cam: (u) => [lerp(1.0, 1.035, eio(u)), lerp(14, -10, u), lerp(0, -8, u)],
    draw(c, lt, cam) {
      const { px } = cam;
      px(c, 0.7, () => {
        c.drawImage(this.bg, -M, -M);
        c.save(); c.beginPath(); c.rect(573, 133, 574, 1034); c.clip();
        LOFI.rain(c, lt, { seed: 52, n: 90, area: [560, 120, 1160, 1180], col: "rgba(180,200,240,0.35)" });
        LOFI.drops(c, lt, { seed: 53, n: 60, trails: 7, area: [573, 133, 1147, 1167] });
        c.restore();
      });
      px(c, 1.0, () => { LOFI.glow(c, 400, 1050, 500, "rgba(255,170,90,0.16)"); LOFI.char(c, (x) => LOFI.otter(x, "sprawl", { x: 520, y: 1110, s: 1.5, t: lt }), { lights: [[60, 1150, 900, "rgba(255,170,80,0.35)"], [1000, 600, 500, "rgba(120,150,230,0.15)"]] }); });
      px(c, 1.2, () => {
        c.drawImage(this.fg, -M, -M);
        LOFI.glow(c, 70, 1150, 620, `rgba(255,170,80,${0.4 + 0.02 * Math.sin(lt * 5)})`);
        LOFI.steam(c, lt, 235, 1310, { n: 3, h: 150, a: 0.35, s: 18 });
      });
    },
  };

  // ================================================================== scene 6: the window seat
  const S6 = {
    paint() {
      this.bg = layer((x) => {
        x.fillStyle = LOFI.lin(x, 0, 150, 0, 1300, [[0, "#20264d"], [0.6, "#373e70"], [1, "#2a2f55"]]); x.fillRect(-M, -M, W + 2 * M, H + 2 * M);
        const r = rng(61);
        // far blocks with lit windows
        for (let b = 0; b < 9; b++) {
          const bx = -60 + b * 140 + r() * 40, bw = 110 + r() * 80, by = 640 + r() * 220;
          x.fillStyle = b % 2 ? "#1f2445" : "#262b52"; x.fillRect(bx, by, bw, 900);
          for (let wy = by + 20; wy < 1250; wy += 34) for (let wx = bx + 10; wx < bx + bw - 14; wx += 26) if (r() < 0.25) { x.fillStyle = r() < 0.75 ? "#e9b56a" : "#b9c8f0"; x.fillRect(wx, wy, 10, 14); }
          x.fillStyle = "rgba(230,235,250,0.6)"; x.fillRect(bx, by - 6, bw, 8); // snow on the roofs
        }
        // the river with reflections
        x.fillStyle = "#1b2040"; x.fillRect(-M, 1150, W + 2 * M, 160);
        for (let k = 0; k < 18; k++) { x.fillStyle = `rgba(255,190,110,${0.15 + r() * 0.2})`; x.fillRect(r() * W, 1160 + r() * 140, 30 + r() * 60, 4); }
      }, { blur: 3, kd: 0.3, kl: 0.2 });
      this.mid = layer((x) => {
        // wall around the window (x 150..930, y 150..1290), the grid, the sill
        x.fillStyle = "#2a2d3d"; x.beginPath(); x.rect(-M, -M, W + 2 * M, H + 2 * M); x.rect(930, 150, -780, 1140); x.fill("evenodd");
        x.strokeStyle = "#555a6d"; x.lineWidth = 30; x.strokeRect(150, 150, 780, 1140);
        x.strokeStyle = "#4a4f62"; x.lineWidth = 12;
        [410, 670].forEach((gx) => { x.beginPath(); x.moveTo(gx, 150); x.lineTo(gx, 1290); x.stroke(); });
        [430, 710, 1000].forEach((gy) => { x.beginPath(); x.moveTo(150, gy); x.lineTo(930, gy); x.stroke(); });
        x.fillStyle = "#5c6175"; x.fillRect(110, 1290, 860, 40); x.fillStyle = "#3a3e4f"; x.fillRect(120, 1330, 840, 70);
        x.fillStyle = "#23263a"; x.fillRect(-M, 1400, W + 2 * M, 700);
        // curtain rod
        x.fillStyle = "#3a3d4c"; x.fillRect(80, 104, 920, 12);
      }, { kd: 0.45, kl: 0.2 });
      this.fg = layer((x) => {
        // the back of a sofa
        x.fillStyle = "#30333f"; LOFI.blob(x, [[-M, 1640], [300, 1600], [560, 1650], [820, 1600], [W + M, 1640], [W + M, 2100], [-M, 2100]], 20, 4); x.fill();
        x.strokeStyle = "rgba(10,12,20,0.6)"; x.lineWidth = 10; x.beginPath(); x.moveTo(540, 1650); x.lineTo(530, 2050); x.stroke();
      }, { blur: 4, kd: 0.35, kl: 0.12 });
    },
    cam: (u) => [lerp(1.0, 1.035, eio(u)), lerp(-8, 8, u), lerp(-6, 6, u)],
    draw(c, lt, cam) {
      const { px } = cam;
      px(c, 0.5, () => {
        c.drawImage(this.bg, -M, -M);
        c.save(); c.beginPath(); c.rect(150, 150, 780, 1140); c.clip();
        LOFI.bokeh(c, lt, { seed: 62, n: 14, area: [150, 1120, 930, 1300], size: [12, 26], a: 0.5 });
        LOFI.rain(c, lt * 0.12, { seed: 63, n: 130, area: [150, 150, 930, 1290], col: "rgba(240,244,255,0.75)", speed: [600, 1100], len: [4, 7], lw: 5, slant: 0.15 });
        c.restore();
      });
      px(c, 0.8, () => {
        c.drawImage(this.mid, -M, -M);
        // sheer curtains with a slow sway
        [[150, 1], [930, -1]].forEach(([cx, s]) => {
          c.save(); c.fillStyle = "rgba(225,230,245,0.22)"; c.beginPath(); c.moveTo(cx - s * 110, 110);
          for (let y = 110; y <= 1400; y += 60) c.lineTo(cx + s * (70 + 30 * Math.sin(y * 0.012 + lt * 0.8)) - s * 0, y);
          c.lineTo(cx - s * 130, 1400); c.closePath(); c.fill();
          c.strokeStyle = "rgba(240,244,255,0.18)"; c.lineWidth = 6; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(cx - s * (90 - k * 40), 110); c.quadraticCurveTo(cx - s * (80 - k * 40) + Math.sin(lt * 0.8 + k) * 10, 760, cx - s * (100 - k * 40), 1400); c.stroke(); }
          c.restore();
        });
      });
      px(c, 1.0, () => {
        LOFI.char(c, (x) => LOFI.otter(x, "sill", { x: 540, y: 935, s: 1.5, t: lt }), { lights: [[540, 500, 600, "rgba(150,170,255,0.25)"], [540, 1500, 700, "rgba(255,170,100,0.12)"]], shade: "rgba(30,30,70,0.12)" });
        // the mug and a little plant on the sill
        c.fillStyle = "#cfc9d6"; LOFI.rr(c, 800, 1210, 80, 84, 14); c.fill(); c.strokeStyle = "#cfc9d6"; c.lineWidth = 10; c.beginPath(); c.arc(884, 1250, 20, -1.2, 1.2); c.stroke();
        LOFI.steam(c, lt, 840, 1190, { n: 3, h: 170, a: 0.4, s: 22 });
        c.fillStyle = "#6b4a3a"; LOFI.rr(c, 210, 1236, 70, 58, 10); c.fill();
        c.fillStyle = "#3f6a4a"; [[-0.5, 46], [0, 60], [0.5, 46]].forEach(([a, l]) => { c.save(); c.translate(245, 1236); c.rotate(a); c.beginPath(); c.ellipse(0, -l / 2, 12, l / 2, 0, 0, 6.283); c.fill(); c.restore(); });
        LOFI.glow(c, 540, 1000, 420, "rgba(150,170,255,0.10)");
      });
      px(c, 1.3, () => c.drawImage(this.fg, -M, -M));
    },
  };

  const SCENES = [S1, S2, S3, S4, S5, S6];
  SCENES.forEach((s, i) => { s.t0 = CUTS[i]; s.t1 = i + 1 < CUTS.length ? CUTS[i + 1] : END; });
  const ready = LOFI.ready().then(() => { SCENES.forEach((s) => s.paint()); return true; });

  function draw(ctx, t) {
    let i = 0; while (i + 1 < SCENES.length && t >= SCENES[i + 1].t0) i++;
    const s = SCENES[i], lt = t - s.t0, u = clamp(lt / (s.t1 - s.t0), 0, 1);
    const [z, panX, panY] = s.cam(u);
    const px = (c, p, fn) => { // apply the camera at depth p
      c.save(); c.translate(W / 2, H / 2); c.scale(1 + (z - 1) * p, 1 + (z - 1) * p); c.translate(-W / 2 - panX * p, -H / 2 - panY * p); fn(); c.restore();
    };
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#0a0c14"; ctx.fillRect(0, 0, W, H);
    s.draw(ctx, lt, { px });
    // grade: a cool-warm split, vignette, grain
    LOFI.vignette(ctx, 0.55);
    LOFI.grain(ctx, t, 0.07);
    ctx.restore();
  }
  return { ready, draw, scenes: SCENES, CUTS, END, BAR };
};

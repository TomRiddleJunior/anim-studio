/* retro-kit.js — a generic retro desktop ("TerraOS 96") drawn on one 1080x1920 canvas, everything a pure function of
   the time the film passes in. No fonts, images or logos: an original 5x7 bitmap font, pixel icons drawn as tiny vector
   paths and thresholded, bevelled windows, a taskbar, a CRT monitor case with the caption band on its chin, a cursor,
   and an original presenter ("Pia") drawn in flat toon vector with lip-sync from the voice envelope.
   window.RETRO.create(canvas) -> K with draw helpers; see film.js for the shot list. */
(function () {
  "use strict";
  const W = 1080, H = 1920;
  const C = {
    caseTop: "#d5cdb5", case: "#cac1a4", caseLo: "#bdb497", caseLine: "#a99f80", caseDk: "#8f866a",
    teal: "#007a7c", tealHi: "#0b8b8c", tealDk: "#006466",
    face: "#c0c0c0", faceHi: "#ffffff", faceLt: "#dfdfdf", faceSh: "#808080", faceDk: "#0b0b0b",
    titleA: "#0a2479", titleB: "#2a78d2", titleIA: "#7a7a7a", titleIB: "#b9b9b9",
    navy: "#0b0b86", paper: "#fafaf5", ink: "#151515", grey: "#6a6a6a", lgrey: "#9a9a9a",
    cap: "#fdfdde", red: "#d22b2b", redDk: "#8a1414", green: "#22a046", greenDk: "#13652a", amber: "#f0ae22",
    gold: "#f2c026", goldDk: "#a87a08", cyan: "#27b6d8", purple: "#7b49d6", pink: "#e85a8a", black: "#0b0b0b",
  };

  // ---------------------------------------------------------------- 5x7 bitmap font (original), 9 rows with descenders
  const F = {
    A: ".###.|#...#|#...#|#####|#...#|#...#|#...#", B: "####.|#...#|#...#|####.|#...#|#...#|####.",
    C: ".###.|#...#|#....|#....|#....|#...#|.###.", D: "####.|#...#|#...#|#...#|#...#|#...#|####.",
    E: "#####|#....|#....|####.|#....|#....|#####", F: "#####|#....|#....|####.|#....|#....|#....",
    G: ".###.|#...#|#....|#.###|#...#|#...#|.####", H: "#...#|#...#|#...#|#####|#...#|#...#|#...#",
    I: "###|.#.|.#.|.#.|.#.|.#.|###", J: "..###|...#.|...#.|...#.|#..#.|#..#.|.##..",
    K: "#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#", L: "#....|#....|#....|#....|#....|#....|#####",
    M: "#.....#|##...##|#.#.#.#|#..#..#|#.....#|#.....#|#.....#", N: "#...#|##..#|#.#.#|#..##|#...#|#...#|#...#",
    O: ".###.|#...#|#...#|#...#|#...#|#...#|.###.", P: "####.|#...#|#...#|####.|#....|#....|#....",
    Q: ".###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#", R: "####.|#...#|#...#|####.|#.#..|#..#.|#...#",
    S: ".####|#....|#....|.###.|....#|....#|####.", T: "#####|..#..|..#..|..#..|..#..|..#..|..#..",
    U: "#...#|#...#|#...#|#...#|#...#|#...#|.###.", V: "#...#|#...#|#...#|#...#|#...#|.#.#.|..#..",
    W: "#.....#|#.....#|#.....#|#..#..#|#..#..#|#..#..#|.##.##.", X: "#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#",
    Y: "#...#|#...#|.#.#.|..#..|..#..|..#..|..#..", Z: "#####|....#|...#.|..#..|.#...|#....|#####",
    a: ".....|.....|.###.|....#|.####|#...#|.####", b: "#....|#....|####.|#...#|#...#|#...#|####.",
    c: ".....|.....|.###.|#....|#....|#....|.###.", d: "....#|....#|.####|#...#|#...#|#...#|.####",
    e: ".....|.....|.###.|#...#|#####|#....|.###.", f: "..##.|.#...|####.|.#...|.#...|.#...|.#...",
    g: ".....|.....|.####|#...#|#...#|#...#|.####|....#|.###.", h: "#....|#....|####.|#...#|#...#|#...#|#...#",
    i: ".#.|...|##.|.#.|.#.|.#.|###", j: "..#|...|.##|..#|..#|..#|..#|#.#|.#.",
    k: "#...|#...|#..#|#.#.|##..|#.#.|#..#", l: "##.|.#.|.#.|.#.|.#.|.#.|###",
    m: ".......|.......|###.##.|#..#..#|#..#..#|#..#..#|#..#..#", n: ".....|.....|####.|#...#|#...#|#...#|#...#",
    o: ".....|.....|.###.|#...#|#...#|#...#|.###.", p: ".....|.....|####.|#...#|#...#|#...#|####.|#....|#....",
    q: ".....|.....|.####|#...#|#...#|#...#|.####|....#|....#", r: ".....|.....|#.##.|##..#|#....|#....|#....",
    s: ".....|.....|.####|#....|.###.|....#|####.", t: ".#..|.#..|####|.#..|.#..|.#..|..##",
    u: ".....|.....|#...#|#...#|#...#|#...#|.####", v: ".....|.....|#...#|#...#|#...#|.#.#.|..#..",
    w: ".......|.......|#.....#|#..#..#|#..#..#|#..#..#|.##.##.", x: ".....|.....|#...#|.#.#.|..#..|.#.#.|#...#",
    y: ".....|.....|#...#|#...#|#...#|#...#|.####|....#|.###.", z: ".....|.....|#####|...#.|..#..|.#...|#####",
    0: ".###.|#...#|#..##|#.#.#|##..#|#...#|.###.", 1: ".#.|##.|.#.|.#.|.#.|.#.|###",
    2: ".###.|#...#|....#|...#.|..#..|.#...|#####", 3: "####.|....#|....#|.###.|....#|....#|####.",
    4: "...#.|..##.|.#.#.|#..#.|#####|...#.|...#.", 5: "#####|#....|####.|....#|....#|#...#|.###.",
    6: ".###.|#....|#....|####.|#...#|#...#|.###.", 7: "#####|....#|...#.|..#..|.#...|.#...|.#...",
    8: ".###.|#...#|#...#|.###.|#...#|#...#|.###.", 9: ".###.|#...#|#...#|.####|....#|....#|.###.",
    ".": ".|.|.|.|.|.|#", ",": "..|..|..|..|..|.#|.#|#.", ":": ".|.|#|.|.|#|.", ";": "..|..|.#|..|..|.#|.#|#.",
    "!": "#|#|#|#|#|.|#", "?": ".###.|#...#|....#|...#.|..#..|.....|..#..", "-": "....|....|....|####|....|....|....",
    "_": ".....|.....|.....|.....|.....|.....|#####", "/": "....#|....#|...#.|..#..|.#...|#....|#....",
    "'": "#|#|.|.|.|.|.", '"': "#.#|#.#|...|...|...|...|...", "(": "..#|.#.|#..|#..|#..|.#.|..#",
    ")": "#..|.#.|..#|..#|..#|.#.|#..", "+": ".....|..#..|..#..|#####|..#..|..#..|.....",
    "=": ".....|.....|#####|.....|#####|.....|.....", "$": "..#..|.####|#.#..|.###.|..#.#|####.|..#..",
    "%": "##..#|##..#|...#.|..#..|.#...|#..##|#..##", "&": ".##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#",
    "@": ".###.|#...#|#.###|#.#.#|#.###|#....|.###.", "#": ".#.#.|.#.#.|#####|.#.#.|#####|.#.#.|.#.#.",
    "*": ".....|#.#.#|.###.|#####|.###.|#.#.#|.....", "<": "...#|..#.|.#..|#...|.#..|..#.|...#",
    ">": "#...|.#..|..#.|...#|..#.|.#..|#...", "[": "##|#.|#.|#.|#.|#.|##", "]": "##|.#|.#|.#|.#|.#|##",
    "{": "..#|.#.|.#.|#..|.#.|.#.|..#", "}": "#..|.#.|.#.|..#|.#.|.#.|#..", "|": "#|#|#|#|#|#|#",
    "^": ".#.|#.#|...|...|...|...|...", "~": ".....|.....|.##.#|#.##.|.....|.....|.....",
    "·": ".|.|.|#|.|.|.", "…": ".....|.....|.....|.....|.....|.....|#.#.#", "→": ".....|...#.|....#|#####|....#|...#.|.....",
    "←": ".....|.#...|#....|#####|#....|.#...|.....", "²": "##.|..#|.#.|###|...|...|...", "×": ".....|.....|#...#|.#.#.|..#..|.#.#.|#...#",
    "≠": ".....|...#.|#####|..#..|#####|.#...|.....", "✓": ".....|....#|...#.|#.#..|.#...|.....|.....", "\\": "#....|#....|.#...|..#..|...#.|....#|....#",
  };
  const F5 = { M: "#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#", W: "#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.",
    m: ".....|.....|##.#.|#.#.#|#.#.#|#.#.#|#...#", w: ".....|.....|#...#|#...#|#.#.#|#.#.#|.#.#." };
  const GL = {}, GL5 = {};
  const mk = (src, dst) => { for (const k in src) { const rows = src[k].split("|"); while (rows.length < 9) rows.push(".".repeat(rows[0].length)); dst[k] = { w: rows[0].length, rows }; } };
  mk(F, GL); mk(F5, GL5);
  const gget = (ch, mono) => (mono && GL5[ch]) || GL[ch] || GL["?"];
  GL[" "] = { w: 3, rows: Array(9).fill("...") };
  const glyphCache = new Map();
  function glyph(ch, s, col, bold, mono) {
    const key = ch + "|" + s + "|" + col + "|" + (bold ? 1 : 0) + (mono ? "m" : "");
    let c = glyphCache.get(key);
    if (c) return c;
    const g = gget(ch, mono);
    c = document.createElement("canvas");
    c.width = Math.max(1, (g.w + (bold ? 1 : 0)) * s);
    c.height = 9 * s;
    const x = c.getContext("2d");
    x.fillStyle = col;
    for (let r = 0; r < 9; r++) for (let q = 0; q < g.w; q++) if (g.rows[r][q] === "#") {
      x.fillRect(q * s, r * s, s, s);
      if (bold) x.fillRect((q + 1) * s, r * s, s, s);
    }
    glyphCache.set(key, c);
    return c;
  }
  // text width in px. opt: {bold, mono (cell width), sp (extra letter spacing in font px)}
  function tw(str, s, opt) {
    opt = opt || {};
    let w = 0;
    for (const ch of String(str)) {
      const g = gget(ch, opt.mono);
      const gw = opt.mono ? opt.mono : g.w + (opt.bold ? 1 : 0);
      w += (gw + 1 + (opt.sp || 0)) * s;
    }
    return Math.max(0, w - (1 + (opt.sp || 0)) * s);
  }
  // draw text; y is the TOP of the cap line. align: left|center|right
  function text(ctx, str, x, y, s, col, opt) {
    opt = opt || {};
    str = String(str);
    const w = tw(str, s, opt);
    let cx = Math.round(opt.align === "center" ? x - w / 2 : opt.align === "right" ? x - w : x);
    y = Math.round(y);
    if (opt.shadow) {
      const o = opt.shadowOff || s;
      text(ctx, str, cx + o, y + o, s, opt.shadow, Object.assign({}, opt, { shadow: null, align: "left" }));
    }
    for (const ch of str) {
      const g = gget(ch, opt.mono);
      const gw = opt.mono ? opt.mono : g.w + (opt.bold ? 1 : 0);
      if (ch !== " ") {
        const gc = glyph(ch, s, col, opt.bold, opt.mono);
        const dx = opt.mono ? Math.floor((opt.mono - g.w) / 2) * s : 0;
        ctx.drawImage(gc, cx + dx, y);
      }
      cx += (gw + 1 + (opt.sp || 0)) * s;
    }
    return w;
  }

  // ---------------------------------------------------------------- deterministic noise
  function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; }
  function rnd(i, j) { return hash((i | 0) * 7919 + (j | 0) * 104729 + 17); }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const sm = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const eo = (k) => { k = clamp(k, 0, 1); return 1 - Math.pow(1 - k, 3); };
  const eio = (k) => { k = clamp(k, 0, 1); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
  const back = (k, o) => { k = clamp(k, 0, 1); o = o == null ? 1.7 : o; return 1 + (o + 1) * Math.pow(k - 1, 3) + o * Math.pow(k - 1, 2); };

  // ---------------------------------------------------------------- pixel icons: tiny vector drawings, thresholded
  const R = 20; // icon design grid
  const IC = {};
  function P(g, pts, fill, stroke, lw) {
    g.beginPath(); g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 1.2; g.stroke(); }
  }
  function Rc(g, x, y, w, h, fill, stroke, lw) { if (fill) { g.fillStyle = fill; g.fillRect(x, y, w, h); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 1.2; g.strokeRect(x, y, w, h); } }
  function Ci(g, x, y, r, fill, stroke, lw) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 1.2; g.stroke(); } }
  const K0 = "#101010";
  IC.doc = (g) => { P(g, [4, 1.5, 12.5, 1.5, 16.5, 5.5, 16.5, 18.5, 4, 18.5], "#fff", K0); P(g, [12.5, 1.5, 12.5, 5.5, 16.5, 5.5], "#d8d8d8", K0); for (let i = 0; i < 5; i++) Rc(g, 6.5, 8 + i * 2, 7.5, 0.9, "#4a4a4a"); };
  IC.fingerprint = (g) => { Ci(g, 10, 10, 8.6, "#e9e4ff", K0); g.strokeStyle = "#5a2fc2"; g.lineWidth = 1.15; for (let r = 1.8; r < 8; r += 1.9) { g.beginPath(); g.arc(10, 11.2, r, Math.PI * 1.08, Math.PI * 1.98 + r * 0.08); g.stroke(); } g.beginPath(); g.moveTo(10, 11.2); g.lineTo(10, 15.5); g.stroke(); g.beginPath(); g.arc(10, 11.2, 5.6, 0.1, 0.9); g.stroke(); };
  IC.salt = (g) => { P(g, [5, 7, 15, 7, 16, 18.5, 4, 18.5], "#fbfbfb", K0); Rc(g, 4.5, 3, 11, 4.5, "#9aa3ad", K0); Ci(g, 7.5, 5.2, 0.7, K0); Ci(g, 10, 5.2, 0.7, K0); Ci(g, 12.5, 5.2, 0.7, K0); Rc(g, 6, 11, 8, 4, "#c9e7f5"); Rc(g, 6.5, 12, 1, 1, "#7aa"); Rc(g, 9.5, 13, 1, 1, "#7aa"); Rc(g, 12, 12, 1, 1, "#7aa"); };
  IC.rainbow = (g) => { Rc(g, 2, 3, 16, 14, "#fff", K0); const cols = ["#e8423c", "#f39a2b", "#f5d531", "#3fb64b", "#2f8ee0", "#7b49d6"]; for (let i = 0; i < 6; i++) Rc(g, 2.6, 4 + i * 2.1, 2.6, 2.1, cols[i]); for (let i = 0; i < 6; i++) Rc(g, 6.5, 4.7 + i * 2.1, 10, 0.8, "#777"); };
  IC.hourglass = (g) => { Rc(g, 4, 2, 12, 2, "#a8742a", K0); Rc(g, 4, 16, 12, 2, "#a8742a", K0); P(g, [5.5, 4, 14.5, 4, 10.6, 10, 14.5, 16, 5.5, 16, 9.4, 10], "#eef6ff", K0); P(g, [7, 15.4, 13, 15.4, 10, 12.6], "#e0b04a"); P(g, [7.6, 5.4, 12.4, 5.4, 10, 8.4], "#e0b04a"); };
  IC.chip = (g) => { for (let i = 0; i < 5; i++) { Rc(g, 4.6 + i * 2.4, 1.5, 1.2, 3, "#d9b03a"); Rc(g, 4.6 + i * 2.4, 15.5, 1.2, 3, "#d9b03a"); } Rc(g, 3, 4.5, 14, 11, "#1f7a3a", K0); Rc(g, 6, 7, 8, 6, "#222", "#0a0a0a", 0.8); Rc(g, 7, 8, 2, 1, "#555"); };
  IC.key = (g) => { Ci(g, 6, 10, 4.6, "#f2c026", K0); Ci(g, 6, 10, 1.7, "#a87a08"); P(g, [10, 8.6, 18.5, 8.6, 18.5, 11.4, 17, 11.4, 17, 13.6, 15, 13.6, 15, 11.4, 13.4, 11.4, 13.4, 13, 11.6, 13, 11.6, 11.4, 10, 11.4], "#f2c026", K0); };
  IC.lock = (g) => { g.strokeStyle = K0; g.lineWidth = 3.4; g.beginPath(); g.arc(10, 8.5, 4.2, Math.PI, 0); g.lineTo(14.2, 10); g.moveTo(5.8, 8.5); g.lineTo(5.8, 10); g.stroke(); g.strokeStyle = "#9aa3ad"; g.lineWidth = 1.6; g.stroke(); Rc(g, 3.5, 9.5, 13, 9, "#f2c026", K0); Rc(g, 9.2, 12, 1.6, 3.6, "#5a3d00"); };
  IC.unlock = (g) => { g.strokeStyle = K0; g.lineWidth = 3.4; g.beginPath(); g.arc(13, 6.5, 4.2, Math.PI, -0.15); g.moveTo(8.8, 6.5); g.lineTo(8.8, 10); g.stroke(); g.strokeStyle = "#9aa3ad"; g.lineWidth = 1.6; g.stroke(); Rc(g, 3.5, 9.5, 13, 9, "#f2c026", K0); Rc(g, 9.2, 12, 1.6, 3.6, "#5a3d00"); };
  IC.pc = (g) => { Rc(g, 2, 2, 16, 12, "#d8d0b4", K0); Rc(g, 4, 4, 12, 8, "#007a7c", K0); Rc(g, 5, 5, 4, 1, "#7fd"); P(g, [6, 14, 14, 14, 15.5, 17, 4.5, 17], "#c9c0a3", K0); Rc(g, 3, 17, 14, 1.8, "#b5ac8f", K0); };
  IC.server = (g) => { Rc(g, 5, 1.5, 10, 17, "#d8d0b4", K0); for (let i = 0; i < 3; i++) Rc(g, 7, 4 + i * 3, 6, 1.6, "#5c5a52", K0, 0.6); Ci(g, 12.4, 15.5, 1, "#3ed268", K0, 0.6); };
  IC.globe = (g) => { Ci(g, 10, 10, 8.4, "#2f86da", K0); g.strokeStyle = "#cfe9ff"; g.lineWidth = 1; g.beginPath(); g.ellipse(10, 10, 3.6, 8.2, 0, 0, Math.PI * 2); g.moveTo(1.8, 10); g.lineTo(18.2, 10); g.moveTo(3.2, 6); g.lineTo(16.8, 6); g.moveTo(3.2, 14); g.lineTo(16.8, 14); g.moveTo(10, 1.6); g.lineTo(10, 18.4); g.stroke(); Ci(g, 10, 10, 8.4, null, K0); };
  IC.db = (g) => { g.fillStyle = "#8fa9c8"; g.beginPath(); g.ellipse(10, 4.5, 7, 2.6, 0, 0, Math.PI * 2); g.fill(); Rc(g, 3, 4.5, 14, 11, "#8fa9c8"); g.beginPath(); g.ellipse(10, 15.5, 7, 2.6, 0, 0, Math.PI); g.fill(); g.strokeStyle = K0; g.lineWidth = 1.2; g.beginPath(); g.ellipse(10, 4.5, 7, 2.6, 0, 0, Math.PI * 2); g.moveTo(3, 4.5); g.lineTo(3, 15.5); g.ellipse(10, 15.5, 7, 2.6, 0, Math.PI, 0, true); g.lineTo(17, 4.5); g.stroke(); g.strokeStyle = "#4f6c90"; g.beginPath(); g.ellipse(10, 8.5, 7, 2.6, 0, 0.1, Math.PI - 0.1); g.moveTo(17, 12.2); g.ellipse(10, 12.2, 7, 2.6, 0, 0, Math.PI); g.stroke(); };
  IC.magnifier = (g) => { g.strokeStyle = K0; g.lineWidth = 4.2; g.beginPath(); g.moveTo(12, 12); g.lineTo(17.5, 17.5); g.stroke(); g.strokeStyle = "#c81e1e"; g.lineWidth = 2.4; g.stroke(); Ci(g, 8.5, 8.5, 6.4, "#d42a2a", K0); Ci(g, 8.5, 8.5, 4, "#fff"); Ci(g, 8.5, 8.5, 1.9, "#111"); };
  IC.warn = (g) => { P(g, [10, 2, 18.6, 17.5, 1.4, 17.5], "#f5c82a", K0); Rc(g, 9.1, 7, 1.8, 6, K0); Rc(g, 9.1, 14.3, 1.8, 1.8, K0); };
  IC.error = (g) => { Ci(g, 10, 10, 8.4, "#d42a2a", K0); g.strokeStyle = "#fff"; g.lineWidth = 2.4; g.beginPath(); g.moveTo(6.4, 6.4); g.lineTo(13.6, 13.6); g.moveTo(13.6, 6.4); g.lineTo(6.4, 13.6); g.stroke(); };
  IC.check = (g) => { Ci(g, 10, 10, 8.4, "#22a046", K0); g.strokeStyle = "#fff"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(5.6, 10.4); g.lineTo(8.8, 13.4); g.lineTo(14.6, 6.8); g.stroke(); };
  IC.question = (g) => { Ci(g, 10, 10, 8.4, "#fff", K0); g.fillStyle = K0; g.font = "bold 13px Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("?", 10, 10.8); };
  IC.mail = (g) => { Rc(g, 2, 4.5, 16, 11.5, "#fff", K0); g.strokeStyle = K0; g.lineWidth = 1.2; g.beginPath(); g.moveTo(2, 4.5); g.lineTo(10, 11); g.lineTo(18, 4.5); g.stroke(); };
  IC.bank = (g) => { P(g, [10, 2, 18.5, 6.5, 1.5, 6.5], "#d9d4c6", K0); for (let i = 0; i < 4; i++) Rc(g, 3.2 + i * 4, 7.5, 1.9, 7.5, "#ece8dc", K0, 0.9); Rc(g, 1.8, 15, 16.4, 3, "#d9d4c6", K0); };
  IC.cart = (g) => { g.strokeStyle = K0; g.lineWidth = 1.6; g.beginPath(); g.moveTo(1.5, 3.5); g.lineTo(4.5, 3.5); g.lineTo(7, 13); g.lineTo(16, 13); g.stroke(); P(g, [5, 5.5, 18, 5.5, 16.4, 11, 6.5, 11], "#e85a8a", K0); Ci(g, 7.8, 16, 1.6, K0); Ci(g, 15, 16, 1.6, K0); };
  IC.cloud = (g) => { g.fillStyle = "#fff"; g.strokeStyle = K0; g.lineWidth = 1.2; g.beginPath(); g.arc(6.5, 12, 3.6, Math.PI * 0.5, Math.PI * 1.5); g.arc(10.5, 8, 4.6, Math.PI * 1.05, Math.PI * 1.95); g.arc(14.5, 11.6, 3.9, Math.PI * 1.5, Math.PI * 0.5); g.closePath(); g.fill(); g.stroke(); };
  IC.gpu = (g) => { Rc(g, 1.5, 5, 17, 10, "#2d3138", K0); Ci(g, 6.2, 10, 3.6, "#555b66", K0, 0.9); Ci(g, 13.8, 10, 3.6, "#555b66", K0, 0.9); Ci(g, 6.2, 10, 1, "#aaa"); Ci(g, 13.8, 10, 1, "#aaa"); Rc(g, 3, 15, 10, 2.2, "#d9b03a", K0, 0.8); Rc(g, 1.5, 4, 17, 1.4, "#3ed268"); };
  IC.stopwatch = (g) => { Rc(g, 8.6, 1.5, 2.8, 2.2, "#9aa3ad", K0); Ci(g, 10, 11, 7.2, "#fff", K0); g.strokeStyle = "#d42a2a"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(10, 11); g.lineTo(13, 7.4); g.stroke(); Ci(g, 10, 11, 1, K0); };
  IC.vault = (g) => { Rc(g, 2, 2.5, 16, 15, "#8a95a3", K0); Rc(g, 4, 4.5, 12, 11, "#a9b3bf", K0, 0.9); Ci(g, 10, 10, 3.6, "#e6e9ec", K0); g.strokeStyle = K0; g.lineWidth = 1; g.beginPath(); g.moveTo(10, 6.4); g.lineTo(10, 13.6); g.moveTo(6.4, 10); g.lineTo(13.6, 10); g.stroke(); Rc(g, 15.8, 6, 1.4, 2.6, K0); Rc(g, 15.8, 11.4, 1.4, 2.6, K0); };
  IC.folder = (g) => { P(g, [1.5, 4, 7.5, 4, 9, 6, 18.5, 6, 18.5, 17, 1.5, 17], "#f2c94c", K0); Rc(g, 1.5, 8, 17, 1, "#c9992a"); };
  IC.floppy = (g) => { P(g, [2, 2, 16, 2, 18, 4, 18, 18, 2, 18], "#2b3f8f", K0); Rc(g, 5, 2.6, 9, 6, "#c9ced6", K0, 0.8); Rc(g, 11, 3.4, 2, 4, "#2b3f8f"); Rc(g, 4.5, 11, 11, 6.4, "#f4f1e8", K0, 0.8); };
  IC.monitor = (g) => { Rc(g, 1.5, 2.5, 17, 13, "#111", K0); g.strokeStyle = "#3ed268"; g.lineWidth = 1.3; g.beginPath(); g.moveTo(3, 12); g.lineTo(6, 12); g.lineTo(8, 6); g.lineTo(10.5, 13); g.lineTo(13, 4.5); g.lineTo(17, 4.5); g.stroke(); Rc(g, 6, 16, 8, 2, "#9aa3ad", K0, 0.8); };
  IC.gear = (g) => { g.fillStyle = "#9aa3ad"; g.strokeStyle = K0; g.lineWidth = 1.1; g.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = i % 2 ? 6.2 : 8.4; g.lineTo(10 + Math.cos(a) * r, 10 + Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke(); Ci(g, 10, 10, 2.6, "#e9e9e9", K0); };
  IC.spark = (g) => { P(g, [10, 1.5, 12, 8, 18.5, 10, 12, 12, 10, 18.5, 8, 12, 1.5, 10, 8, 8], "#ffd23f", K0); Ci(g, 10, 10, 1.6, "#fff"); };
  IC.table = (g) => { Rc(g, 2, 3, 16, 14, "#fff", K0); Rc(g, 2, 3, 16, 3, "#9fb6d6", K0); for (let i = 0; i < 3; i++) Rc(g, 2, 9 + i * 3, 16, 0.6, "#888"); Rc(g, 8, 3, 0.6, 14, "#888"); };
  IC.wordlist = (g) => { Rc(g, 3, 1.5, 14, 17, "#fff", K0); for (let i = 0; i < 6; i++) Rc(g, 5, 4 + i * 2.3, 4 + (i * 37 % 6), 1, "#c81e1e"); };
  IC.shield = (g) => { P(g, [10, 1.5, 17.5, 4.5, 17, 11, 10, 18.5, 3, 11, 2.5, 4.5], "#2f86da", K0); g.strokeStyle = "#fff"; g.lineWidth = 2; g.beginPath(); g.moveTo(6.5, 10); g.lineTo(9, 12.5); g.lineTo(13.8, 7); g.stroke(); };
  IC.user = (g, o) => { o = o || {}; Rc(g, 1.5, 1.5, 17, 17, o.bg || "#e8eef6", K0); Ci(g, 10, 8.2, 3.9, o.skin || "#c98c62", K0, 0.9); P(g, [3.5, 18.5, 4.5, 14, 7.5, 12.6, 12.5, 12.6, 15.5, 14, 16.5, 18.5], o.shirt || "#2f86da", K0, 0.9); if (o.hair) { g.fillStyle = o.hair; g.beginPath(); g.arc(10, 7.2, 4.1, Math.PI, 0); g.fill(); } };
  // users (the db rows): different portraits
  const USERS = { ana: { bg: "#f6e3c9", skin: "#d9a07a", hair: "#3a2318", shirt: "#d65a3a" }, ben: { bg: "#dde9f6", skin: "#8a5a3c", hair: "#1a1410", shirt: "#2f86da" },
    cy: { bg: "#e4f2df", skin: "#efc9a6", hair: "#c9862e", shirt: "#3fa44b" }, dee: { bg: "#efe2f6", skin: "#b07a52", hair: "#5a2f8a", shirt: "#7b49d6" } };
  for (const u in USERS) IC["u_" + u] = (g) => IC.user(g, USERS[u]);
  const iconCache = new Map();
  function iconCanvas(name, res) {
    res = res || R;
    const key = name + "|" + res;
    let c = iconCache.get(key);
    if (c) return c;
    c = document.createElement("canvas");
    c.width = res; c.height = res;
    const g = c.getContext("2d");
    g.scale(res / R, res / R);
    (IC[name] || IC.question)(g);
    // threshold alpha -> crisp pixel art
    const im = g.getImageData(0, 0, res, res), d = im.data;
    for (let i = 0; i < d.length; i += 4) d[i + 3] = d[i + 3] > 110 ? 255 : 0;
    g.putImageData(im, 0, 0);
    iconCache.set(key, c);
    return c;
  }
  function icon(ctx, name, x, y, size, opt) {
    opt = opt || {};
    const c = iconCanvas(name, opt.res || R);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (opt.alpha != null) ctx.globalAlpha *= opt.alpha;
    if (opt.rot) { ctx.translate(x + size / 2, y + size / 2); ctx.rotate(opt.rot); ctx.drawImage(c, -size / 2, -size / 2, size, size); }
    else ctx.drawImage(c, Math.round(x), Math.round(y), size, size);
    ctx.restore();
  }

  // ---------------------------------------------------------------- cursors (bitmaps)
  const CUR = {
    arrow: ["B...........", "BB..........", "BWB.........", "BWWB........", "BWWWB.......", "BWWWWB......", "BWWWWWB.....", "BWWWWWWB....",
      "BWWWWWWWB...", "BWWWWWWWWB..", "BWWWWWWWWWB.", "BWWWWWWBBBBB", "BWWWBWWB....", "BWWBBWWB....", "BWB..BWWB...", "BB...BWWB...",
      "B.....BWWB..", "......BWWB..", ".......BB..."],
    hand: [".....BB.........", "....BWWB........", "....BWWB........", "....BWWB........", "....BWWB........", "....BWWBBB......",
      "....BWWBWWBBB...", "....BWWBWWBWWBB.", ".BB.BWWBWWBWWBWB", "BWWBBWWWWWWWWBWB", "BWWWBWWWWWWWWWWB", ".BWWBWWWWWWWWWWB",
      "..BWWWWWWWWWWWWB", "..BWWWWWWWWWWWB.", "...BWWWWWWWWWWB.", "...BWWWWWWWWWB..", "....BWWWWWWWWB..", "....BWWWWWWWWB..", "....BBBBBBBBBB.."],
    grab: ["................", "................", "................", "................", "....BB.BB.BB....", "...BWWBWWBWWBB..",
      "...BWWBWWBWWBWB.", "..BBWWWWWWWWBWB.", ".BWBWWWWWWWWWWB.", ".BWWWWWWWWWWWWB.", "..BWWWWWWWWWWWB.", "..BWWWWWWWWWWWB.",
      "...BWWWWWWWWWWB.", "...BWWWWWWWWWB..", "....BWWWWWWWWB..", "....BWWWWWWWWB..", "....BBBBBBBBBB.."],
    wait: ["BBBBBBBBBBB", "BWWWWWWWWWB", ".BWWWWWWWB.", ".BWYYYYYWB.", "..BWYYYWB..", "...BWYWB...", "....BWB....", "...BWWWB...",
      "..BWWYWWB..", ".BWWYYYWWB.", ".BWYYYYYWB.", "BWWWWWWWWWB", "BBBBBBBBBBB"],
  };
  const curCache = new Map();
  function cursorCanvas(kind) {
    let c = curCache.get(kind);
    if (c) return c;
    const rows = CUR[kind];
    c = document.createElement("canvas");
    c.width = rows[0].length; c.height = rows.length;
    const g = c.getContext("2d");
    for (let r = 0; r < rows.length; r++) for (let q = 0; q < rows[r].length; q++) {
      const ch = rows[r][q];
      if (ch === ".") continue;
      g.fillStyle = ch === "B" ? "#000" : ch === "Y" ? "#d9b03a" : "#fff";
      g.fillRect(q, r, 1, 1);
    }
    curCache.set(kind, c);
    return c;
  }
  const HOT = { arrow: [0, 0], hand: [5, 0], grab: [8, 5], wait: [5, 6] };
  function cursor(ctx, kind, x, y, s) {
    s = s || 3;
    const c = cursorCanvas(kind), h = HOT[kind] || [0, 0];
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha *= 0.28;
    ctx.drawImage(c, Math.round(x - h[0] * s) + 4, Math.round(y - h[1] * s) + 5, c.width * s, c.height * s);
    ctx.globalAlpha /= 0.28;
    ctx.restore();
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.filter = "none";
    ctx.drawImage(c, Math.round(x - h[0] * s), Math.round(y - h[1] * s), c.width * s, c.height * s);
    ctx.restore();
  }

  // ---------------------------------------------------------------- bevels and widgets
  const U = 3; // bevel unit
  function bevel(ctx, x, y, w, h, raised, deep) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const a = raised ? C.faceHi : C.faceDk, b = raised ? C.faceDk : C.faceHi, a2 = raised ? C.faceLt : C.faceSh, b2 = raised ? C.faceSh : C.faceLt;
    ctx.fillStyle = a; ctx.fillRect(x, y, w, U); ctx.fillRect(x, y, U, h);
    ctx.fillStyle = b; ctx.fillRect(x, y + h - U, w, U); ctx.fillRect(x + w - U, y, U, h);
    if (deep !== false) {
      ctx.fillStyle = a2; ctx.fillRect(x + U, y + U, w - 2 * U, U); ctx.fillRect(x + U, y + U, U, h - 2 * U);
      ctx.fillStyle = b2; ctx.fillRect(x + U, y + h - 2 * U, w - 2 * U, U); ctx.fillRect(x + w - 2 * U, y + U, U, h - 2 * U);
    }
  }
  function panel(ctx, x, y, w, h, fill, raised) { ctx.fillStyle = fill || C.face; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); bevel(ctx, x, y, w, h, raised !== false); }
  function sunken(ctx, x, y, w, h, fill) { ctx.fillStyle = fill || "#fff"; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); bevel(ctx, x, y, w, h, false); }
  function button(ctx, x, y, w, h, label, opt) {
    opt = opt || {};
    const down = !!opt.down;
    panel(ctx, x, y, w, h, opt.fill || C.face, !down);
    if (opt.focus) { ctx.strokeStyle = C.black; ctx.lineWidth = 2; ctx.setLineDash([2, 2]); ctx.strokeRect(x + 8, y + 8, w - 16, h - 16); ctx.setLineDash([]); }
    if (label) text(ctx, label, x + w / 2 + (down ? 2 : 0), y + h / 2 - 3.5 * (opt.s || 3) + (down ? 2 : 0), opt.s || 3, opt.col || C.ink, { align: "center", bold: opt.bold !== false });
  }
  function checkbox(ctx, x, y, on, s) {
    s = s || 30;
    sunken(ctx, x, y, s, s, "#fff");
    if (on > 0) {
      ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.lineCap = "square";
      ctx.beginPath(); ctx.moveTo(x + s * 0.24, y + s * 0.52);
      const k = clamp(on, 0, 1);
      if (k < 0.4) ctx.lineTo(x + s * (0.24 + 0.2 * k / 0.4), y + s * (0.52 + 0.22 * k / 0.4));
      else { ctx.lineTo(x + s * 0.44, y + s * 0.74); ctx.lineTo(x + s * (0.44 + 0.34 * (k - 0.4) / 0.6), y + s * (0.74 - 0.5 * (k - 0.4) / 0.6)); }
      ctx.stroke(); ctx.restore();
    }
  }
  function radio(ctx, x, y, on, s) {
    s = s || 30;
    ctx.save();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s / 2 - 2, 0, 7); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = C.faceSh; ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s / 2 - 2, Math.PI * 0.75, Math.PI * 1.75); ctx.stroke();
    ctx.strokeStyle = C.faceHi; ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s / 2 - 2, Math.PI * 1.75, Math.PI * 0.75); ctx.stroke();
    if (on > 0) { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s * 0.18 * clamp(on, 0, 1), 0, 7); ctx.fill(); }
    ctx.restore();
  }
  // segmented progress bar (navy blocks)
  function progress(ctx, x, y, w, h, frac, col) {
    sunken(ctx, x, y, w, h, "#fff");
    const bw = 18, gap = 4, inner = w - 2 * U - 6, n = Math.floor(inner / (bw + gap));
    const k = Math.floor(clamp(frac, 0, 1) * n + 1e-6);
    ctx.fillStyle = col || C.navy;
    for (let i = 0; i < k; i++) ctx.fillRect(Math.round(x + U + 4 + i * (bw + gap)), Math.round(y + U + 4), bw, Math.round(h - 2 * U - 8));
  }
  function field(ctx, x, y, w, h, str, opt) {
    opt = opt || {};
    sunken(ctx, x, y, w, h, opt.fill || "#fff");
    const s = opt.s || 4;
    const ty = y + h / 2 - 3.5 * s;
    let tw_ = 0;
    if (str) tw_ = text(ctx, str, x + 14, ty, s, opt.col || C.ink, { mono: opt.mono, bold: opt.bold });
    if (opt.caret) { ctx.fillStyle = C.ink; ctx.fillRect(Math.round(x + 14 + tw_ + s), Math.round(ty - s), Math.max(2, s / 2 | 0), 9 * s); }
  }

  // ---------------------------------------------------------------- windows
  const TB = 48; // title bar height
  function titleBar(ctx, x, y, w, title, opt) {
    opt = opt || {};
    const active = opt.active !== false;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    if (opt.red) { g.addColorStop(0, "#7a0d0d"); g.addColorStop(1, "#d23a3a"); }
    else if (active) { g.addColorStop(0, C.titleA); g.addColorStop(1, C.titleB); }
    else { g.addColorStop(0, C.titleIA); g.addColorStop(1, C.titleIB); }
    ctx.fillStyle = g;
    const h = opt.h || TB - 8;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), h);
    let tx = x + 12;
    if (opt.icon) { icon(ctx, opt.icon, x + 8, y + (h - 30) / 2, 30); tx = x + 46; }
    if (opt.big) text(ctx, title, tx + 8, y + h / 2 - 3.5 * opt.big, opt.big, "#fff", { bold: true, sp: 1.2, shadow: "rgba(0,0,30,.55)", shadowOff: Math.max(3, opt.big * 0.6 | 0) });
    else text(ctx, title, tx, y + h / 2 - 11, 3, "#fff", { bold: true });
    // buttons
    const bs = h - 10, by = y + 5;
    let bx = x + w - 8 - bs;
    const glyphs = opt.buttons || (opt.small ? ["x"] : ["x", "max", "min"]);
    for (const gname of glyphs) {
      panel(ctx, bx, by, bs + 2, bs, C.face, true);
      ctx.fillStyle = C.ink;
      const cx = bx + (bs + 2) / 2, cy = by + bs / 2;
      if (gname === "x") { ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - 7, cy - 6); ctx.lineTo(cx + 7, cy + 6); ctx.moveTo(cx + 7, cy - 6); ctx.lineTo(cx - 7, cy + 6); ctx.stroke(); ctx.restore(); }
      else if (gname === "max") { ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.strokeRect(cx - 8, cy - 7, 16, 14); ctx.fillRect(cx - 8, cy - 8, 16, 4); }
      else if (gname === "min") ctx.fillRect(cx - 7, cy + 4, 12, 4);
      bx -= bs + 6;
    }
  }
  // a window: frame + title bar (+ menu) ; returns client rect. opt: {title, icon, active, menu, red, big, fill, small}
  function win(ctx, x, y, w, h, opt) {
    opt = opt || {};
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    // drop shadow
    ctx.fillStyle = "rgba(0,20,25,.32)";
    ctx.fillRect(x + 10, y + 12, w, h);
    ctx.fillStyle = C.face;
    ctx.fillRect(x, y, w, h);
    bevel(ctx, x, y, w, h, true);
    const th = opt.big ? 74 : TB - 8;
    titleBar(ctx, x + 6, y + 6, w - 12, opt.title || "", Object.assign({}, opt, { h: th }));
    let cy = y + 6 + th + 4;
    if (opt.menu) {
      let mx = x + 16;
      for (const m of opt.menu) { const ww = text(ctx, m, mx, cy + 8, 3, C.ink, {}); ctx.fillStyle = C.ink; ctx.fillRect(mx, cy + 8 + 8 * 3, 5 * 3, 3); mx += ww + 30; }
      if (opt.menuRight) text(ctx, opt.menuRight, x + w - 18, cy + 8, 3, C.ink, { align: "right" });
      cy += 40;
    }
    const pad = 8;
    const cr = { x: x + pad, y: cy + 2, w: w - 2 * pad, h: y + h - pad - cy - 2 };
    if (opt.fill !== "none") {
      if (opt.fill === "face") { /* grey client */ }
      else sunken(ctx, cr.x, cr.y, cr.w, cr.h, opt.fill || C.paper);
    }
    return cr;
  }
  // Win-95 style "zoom rect" when a window opens/closes: k 0..1 from rect a to rect b
  function zoomRect(ctx, a, b, k) {
    const r = { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k) };
    ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 3; ctx.setLineDash([9, 6]);
    ctx.strokeRect(Math.round(r.x), Math.round(r.y), Math.round(r.w), Math.round(r.h));
    ctx.restore();
  }
  function menu(ctx, x, y, items, hi, s) {
    s = s || 4;
    const w = Math.max(...items.map((m) => tw(m, s, { bold: true }))) + 60, ih = 13 * s;
    panel(ctx, x, y, w, items.length * ih + 12, C.face, true);
    items.forEach((m, i) => {
      if (i === hi) { ctx.fillStyle = C.navy; ctx.fillRect(x + 6, y + 6 + i * ih, w - 12, ih); }
      text(ctx, m, x + 24, y + 6 + i * ih + (ih - 7 * s) / 2, s, i === hi ? "#fff" : C.ink, { bold: true });
    });
    return { w, h: items.length * ih + 12, ih };
  }
  // speech bubble label (PROBLEM. / SIMPLE.) ; tail points to (tx, ty)
  function bubble(ctx, cx, cy, label, k, tail) {
    if (k <= 0) return;
    const s = 5, w = tw(label, s, { bold: true, sp: 1.6 }) + 56, h = 9 * s + 30;
    ctx.save();
    const sc = back(k, 2.2);
    ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
    const x = Math.round(cx - w / 2), y = Math.round(cy - h / 2);
    ctx.fillStyle = "rgba(0,30,30,.35)"; ctx.fillRect(x + 7, y + 8, w, h);
    ctx.fillStyle = "#fff"; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = C.black; ctx.lineWidth = 4; ctx.strokeRect(x, y, w, h);
    if (tail) {
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(x + 40, y + h - 2); ctx.lineTo(x + 34 + tail, y + h + 26); ctx.lineTo(x + 70, y + h - 2); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 40, y + h); ctx.lineTo(x + 34 + tail, y + h + 26); ctx.lineTo(x + 70, y + h); ctx.stroke();
    }
    text(ctx, label, cx, cy - 3.5 * s - 2, s, C.ink, { align: "center", bold: true, sp: 1.6 });
    ctx.restore();
  }

  // ---------------------------------------------------------------- monitor case, desktop, taskbar
  const SCR = { x: 21, y: 21, w: 1038, h: 1356, r: 24 };
  const TASK_Y = SCR.y + SCR.h - 48;
  let scanPat = null, noiseCan = null;
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function caseBack(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, C.caseTop); g.addColorStop(0.72, C.case); g.addColorStop(1, C.caseLo);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // bezel inset around the screen
    ctx.save(); rr(ctx, SCR.x - 9, SCR.y - 9, SCR.w + 18, SCR.h + 18, SCR.r + 8); ctx.fillStyle = "#b3aa8c"; ctx.fill(); ctx.restore();
    ctx.save(); rr(ctx, SCR.x - 4, SCR.y - 4, SCR.w + 8, SCR.h + 8, SCR.r + 4); ctx.fillStyle = "#3a3a36"; ctx.fill(); ctx.restore();
    // chin seam
    ctx.fillStyle = "rgba(120,110,80,.35)"; ctx.fillRect(0, SCR.y + SCR.h + 18, W, 2);
    ctx.fillStyle = "rgba(255,255,240,.35)"; ctx.fillRect(0, SCR.y + SCR.h + 20, W, 2);
  }
  function chin(ctx, t, led) {
    const y = 1662;
    for (let i = 0; i < 14; i++) { ctx.fillStyle = "rgba(110,100,72,.55)"; ctx.fillRect(60 + i * 16, y - 18, 7, 36); ctx.fillStyle = "rgba(255,255,240,.25)"; ctx.fillRect(67 + i * 16, y - 18, 2, 36); }
    // floppy slot
    ctx.save(); rr(ctx, 381, y - 20, 318, 40, 8); ctx.fillStyle = "#bfb698"; ctx.fill(); ctx.strokeStyle = "rgba(110,100,72,.6)"; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    ctx.fillStyle = "#3b382f"; ctx.fillRect(405, y - 3, 270, 6);
    // brand badge (invented)
    text(ctx, "TERRA 96", 540, y + 52, 3, "rgba(120,110,80,.85)", { align: "center", bold: true, sp: 2 });
    // LED + power button
    ctx.save();
    const on = led == null ? 1 : led;
    ctx.fillStyle = on > 0.5 ? "#3ed268" : "#2a8a45";
    ctx.beginPath(); ctx.arc(941, y, 9, 0, 7); ctx.fill();
    if (on > 0.5) { ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(941, y, 18, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    rr(ctx, 970, y - 22, 60, 44, 8); ctx.fillStyle = "#d5cdb3"; ctx.fill(); ctx.strokeStyle = "rgba(110,100,72,.6)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }
  function desktop(ctx, t) {
    ctx.save(); rr(ctx, SCR.x, SCR.y, SCR.w, SCR.h, SCR.r); ctx.clip();
    const g = ctx.createRadialGradient(540, 620, 120, 540, 700, 980);
    g.addColorStop(0, C.tealHi); g.addColorStop(1, C.tealDk);
    ctx.fillStyle = g; ctx.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
    ctx.restore();
  }
  function screenFX(ctx, t) {
    // scanlines + slow noise + glass, clipped to the screen
    if (!scanPat) {
      const c = document.createElement("canvas"); c.width = 4; c.height = 4; const g = c.getContext("2d");
      g.fillStyle = "rgba(0,0,0,.075)"; g.fillRect(0, 3, 4, 1); g.fillStyle = "rgba(255,255,255,.02)"; g.fillRect(0, 0, 4, 1);
      scanPat = ctx.createPattern(c, "repeat");
      noiseCan = document.createElement("canvas"); noiseCan.width = 256; noiseCan.height = 256;
      const n = noiseCan.getContext("2d"), im = n.createImageData(256, 256);
      for (let i = 0; i < 256 * 256; i++) { const v = rnd(i, 3) * 255; im.data[i * 4] = v; im.data[i * 4 + 1] = v; im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 14; }
      n.putImageData(im, 0, 0);
    }
    ctx.save(); rr(ctx, SCR.x, SCR.y, SCR.w, SCR.h, SCR.r); ctx.clip();
    ctx.fillStyle = scanPat; ctx.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
    const f = Math.floor(t * 12);
    const ox = Math.floor(rnd(f, 1) * 256), oy = Math.floor(rnd(f, 2) * 256);
    ctx.globalAlpha = 0.6;
    for (let yy = SCR.y - oy; yy < SCR.y + SCR.h; yy += 256) for (let xx = SCR.x - ox; xx < SCR.x + SCR.w; xx += 256) ctx.drawImage(noiseCan, xx, yy);
    ctx.globalAlpha = 1;
    // CRT corner falloff + glass sheen
    const v = ctx.createRadialGradient(540, 700, 520, 540, 700, 1050);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.22)");
    ctx.fillStyle = v; ctx.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
    const gl = ctx.createLinearGradient(0, SCR.y, 400, SCR.y + 500);
    gl.addColorStop(0, "rgba(255,255,255,.07)"); gl.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gl; ctx.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
    ctx.restore();
  }
  function taskbar(ctx, tasks, clock, activeIdx, startDown) {
    const y = TASK_Y, x0 = SCR.x, w = SCR.w;
    ctx.save(); rr(ctx, SCR.x, SCR.y, SCR.w, SCR.h, SCR.r); ctx.clip();
    ctx.fillStyle = C.face; ctx.fillRect(x0, y, w, 48);
    ctx.fillStyle = C.faceHi; ctx.fillRect(x0, y + 3, w, 3);
    ctx.restore();
    button(ctx, x0 + 10, y + 9, 150, 36, "", { down: startDown });
    icon(ctx, "spark", x0 + 18, y + 13, 28);
    text(ctx, "Start", x0 + 52, y + 16, 3, C.ink, { bold: true });
    let bx = x0 + 168;
    (tasks || []).forEach((tk, i) => {
      let lab = typeof tk === "string" ? tk : tk.label; const ic = typeof tk === "string" ? null : tk.icon;
      const bw = Math.min(250, Math.max(130, tw(lab, 3, { bold: true }) + (ic ? 62 : 30)));
      while (lab.length > 3 && tw(lab, 3, { bold: true }) > bw - (ic ? 62 : 30)) lab = lab.slice(0, -2) + "…";
      if (bx + bw > x0 + w - 180) return;
      button(ctx, bx, y + 9, bw, 36, "", { down: i === activeIdx });
      if (ic) icon(ctx, ic, bx + 10, y + 13, 28);
      text(ctx, lab, bx + (ic ? 46 : 14) + (i === activeIdx ? 2 : 0), y + 16 + (i === activeIdx ? 1 : 0), 3, C.ink, { bold: true });
      bx += bw + 6;
    });
    sunken(ctx, x0 + w - 172, y + 9, 160, 36, C.face);
    text(ctx, clock || "7:30 PM", x0 + w - 92, y + 16, 3, C.ink, { align: "center", bold: true });
  }
  function taskSlot(i) { return { x: SCR.x + 168 + i * 200, y: TASK_Y + 9, w: 190, h: 36 }; }

  // ---------------------------------------------------------------- captions on the chin (karaoke: navy block on the spoken word)
  const CAP_Y = 1470;
  function caption(ctx, words, cur, k) {
    // words: [{w}], cur: index of the spoken word (-1 none, words.length = all past)
    if (!words || !words.length || k <= 0) return;
    const s = 5, gap = 30;
    const ws = words.map((x) => tw(x.w, s, { bold: true }));
    const total = ws.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
    const bw = total + 64, bh = 96;
    const x = Math.round(540 - bw / 2), y = Math.round(CAP_Y - bh / 2);
    ctx.save();
    ctx.globalAlpha *= clamp(k, 0, 1);
    ctx.fillStyle = "rgba(90,80,50,.55)"; ctx.fillRect(x + 7, y + 7, bw, bh);
    ctx.fillStyle = C.cap; ctx.fillRect(x, y, bw, bh);
    ctx.strokeStyle = C.black; ctx.lineWidth = 3; ctx.strokeRect(x + 1.5, y + 1.5, bw - 3, bh - 3);
    let cx = x + 32;
    const ty = y + bh / 2 - 3.5 * s - 2;
    words.forEach((wd, i) => {
      if (i === cur) { ctx.fillStyle = C.navy; ctx.fillRect(cx - 10, y + 16, ws[i] + 20, bh - 32); }
      text(ctx, wd.w, cx, ty, s, i === cur ? "#fff" : i < cur ? C.ink : "#5c5c5c", { bold: true });
      cx += ws[i] + gap;
    });
    ctx.restore();
  }

  // ---------------------------------------------------------------- presenter "Pia" (original): afro puff, red round glasses, mustard cardigan
  const PC = { skin: "#8d5a3b", skinSh: "#74482e", hair: "#241816", hairHi: "#3d2a25", band: "#e2574c", glass: "#c8322e", tee: "#26346a",
    cardi: "#dba23c", cardiSh: "#b9832a", pants: "#56663a", pantsSh: "#46552e", shoe: "#f6f4ee", sole: "#e2574c", ol: "#1c1414", mug: "#f4f1e8", pencil: "#f2c026" };
  const POSE = {
    idle: { L: [-8, 62], R: [10, 16] }, point: { L: [-8, 62], R: [40, 175] }, explain: { L: [-8, 62], R: [24, 128] },
    shrug: { L: [-42, -128], R: [42, 128] }, thumbs: { L: [-8, 62], R: [30, 160] }, wave: { L: [-8, 62], R: [140, 170] },
    present: { L: [-8, 62], R: [30, 112] }, hold: { L: [-8, 62], R: [-6, 56] },
  };
  function limb(ctx, pts, w, col, ol) {
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.strokeStyle = ol; ctx.lineWidth = w + 9; ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  }
  const dir = (a) => [Math.sin(a * Math.PI / 180), Math.cos(a * Math.PI / 180)];
  function mixPose(p1, p2, k) {
    const a = POSE[p1] || POSE.idle, b = POSE[p2] || a, o = {};
    for (const s of ["L", "R"]) o[s] = [lerp(a[s][0], b[s][0], k), lerp(a[s][1], b[s][1], k)];
    return o;
  }
  // st: {x (feet centre), y (feet), s (scale), pose, pose2, pk, mouth 0..1, blink 0..1, look [-1..1], t, lift, tilt, mug}
  function pia(ctx, st) {
    const t = st.t || 0, P = mixPose(st.pose || "idle", st.pose2 || st.pose || "idle", st.pk == null ? 1 : st.pk);
    const sc = st.s || 1;
    ctx.save();
    ctx.translate(st.x, st.y - (st.lift || 0));
    ctx.scale(sc, sc);
    if (st.swing) ctx.rotate(st.swing);
    const br = Math.sin(t * 2 * Math.PI / 3.6) * 2.2; // breath
    const ol = PC.ol;
    // shadow on the taskbar edge
    if (!st.lift || st.lift < 4) { ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(0, 2, 92, 10, 0, 0, 7); ctx.fill(); }
    // legs
    const hipY = -335, kneeY = -178;
    limb(ctx, [[-30, hipY], [-36, kneeY], [-38, -46]], 46, PC.pants, ol);
    limb(ctx, [[30, hipY], [36, kneeY], [38, -46]], 46, PC.pants, ol);
    ctx.fillStyle = PC.pantsSh; ctx.fillRect(-62, -70, 48, 16); ctx.fillRect(14, -70, 48, 16);
    // sneakers (high-tops)
    for (const sx of [-1, 1]) {
      ctx.save(); ctx.translate(sx * 40, 0);
      ctx.fillStyle = PC.shoe; ctx.strokeStyle = ol; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-24 * (sx < 0 ? 1.4 : 1), -4); ctx.lineTo(-22, -58); ctx.lineTo(18, -58); ctx.quadraticCurveTo(22, -26, 38 * (sx > 0 ? 1.25 : 0.7) + (sx < 0 ? 0 : 0), -18); ctx.quadraticCurveTo(50 * (sx > 0 ? 1.1 : 0.55), -10, 46 * (sx > 0 ? 1.1 : 0.55), -2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = PC.sole; ctx.fillRect(-26 * (sx < 0 ? 1.3 : 1), -12, 70 * (sx > 0 ? 1.08 : 0.82), 9);
      ctx.strokeStyle = ol; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-14, -48); ctx.lineTo(10, -44); ctx.moveTo(-14, -38); ctx.lineTo(12, -34); ctx.stroke();
      ctx.restore();
    }
    // torso
    ctx.save(); ctx.translate(0, br * 0.3);
    const shY = -548;
    ctx.fillStyle = PC.tee; ctx.strokeStyle = ol; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-62, shY + 6); ctx.quadraticCurveTo(-76, -440, -64, hipY + 10); ctx.lineTo(64, hipY + 10); ctx.quadraticCurveTo(76, -440, 62, shY + 6); ctx.quadraticCurveTo(0, shY - 10, -62, shY + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    // tee print: a tiny pixel key
    ctx.fillStyle = PC.pencil; ctx.fillRect(-12, -470, 10, 10); ctx.fillRect(-2, -467, 22, 4); ctx.fillRect(14, -467, 4, 9); ctx.fillRect(8, -467, 4, 7);
    // cardigan panels (open)
    ctx.fillStyle = PC.cardi;
    for (const sx of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(sx * 64, shY + 4); ctx.quadraticCurveTo(sx * 82, -440, sx * 74, hipY + 26); ctx.lineTo(sx * 30, hipY + 30); ctx.quadraticCurveTo(sx * 26, -420, sx * 22, shY + 2); ctx.quadraticCurveTo(sx * 42, shY - 4, sx * 64, shY + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = PC.cardiSh; ctx.fillRect(sx > 0 ? 36 : -66, hipY - 30, 30, 26); ctx.strokeRect(sx > 0 ? 36 : -66, hipY - 30, 30, 26); ctx.fillStyle = PC.cardi;
      // ribbed hem
      ctx.strokeStyle = PC.cardiSh; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(sx * (36 + i * 9), hipY + 12); ctx.lineTo(sx * (36 + i * 9), hipY + 26); ctx.stroke(); } ctx.strokeStyle = ol; ctx.lineWidth = 5;
    }
    for (let i = 0; i < 3; i++) { ctx.fillStyle = "#f4ead2"; ctx.beginPath(); ctx.arc(-24, -500 + i * 52, 5, 0, 7); ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 5; }
    ctx.restore();
    // arms
    const shL = [-70, shY + 16 + br * 0.3], shR = [70, shY + 16 + br * 0.3];
    const UA = 150, FA = 134;
    function arm(side, a1, a2) {
      const s0 = side < 0 ? shL : shR;
      const d1 = dir(a1), d2 = dir(a2);
      const el = [s0[0] + d1[0] * UA, s0[1] + d1[1] * UA], wr = [el[0] + d2[0] * FA, el[1] + d2[1] * FA];
      limb(ctx, [s0, el, wr], 40, PC.cardi, ol);
      // cuff
      ctx.save(); ctx.translate(wr[0] - d2[0] * 14, wr[1] - d2[1] * 14); ctx.rotate(-a2 * Math.PI / 180);
      ctx.fillStyle = PC.cardiSh; ctx.fillRect(-23, -8, 46, 14); ctx.strokeStyle = ol; ctx.lineWidth = 4; ctx.strokeRect(-23, -8, 46, 14); ctx.restore();
      return { el, wr, d2 };
    }
    function hand(wr, d2, kind, side) {
      ctx.save(); ctx.translate(wr[0] + d2[0] * 14, wr[1] + d2[1] * 14);
      ctx.fillStyle = PC.skin; ctx.strokeStyle = ol; ctx.lineWidth = 4.5;
      if (kind === "point") {
        ctx.rotate(Math.atan2(d2[1], d2[0]));
        ctx.beginPath(); ctx.ellipse(4, 0, 20, 17, 0, 0, 7); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.roundRect(14, -7, 38, 13, 6); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(6, -15, 10, 7, -0.4, 0, 7); ctx.fill(); ctx.stroke();
      } else if (kind === "thumb") {
        ctx.beginPath(); ctx.ellipse(0, 0, 19, 20, 0, 0, 7); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.roundRect(-6 * side, -42, 13, 30, 6); ctx.fill(); ctx.stroke();
      } else if (kind === "open") {
        ctx.rotate(Math.atan2(d2[1], d2[0]) - Math.PI / 2);
        ctx.beginPath(); ctx.ellipse(0, 6, 19, 22, 0, 0, 7); ctx.fill(); ctx.stroke();
        for (let i = -1; i <= 2; i++) { ctx.beginPath(); ctx.roundRect(-16 + i * 9 + 4, 18, 9, 24 - Math.abs(i - 0.5) * 4, 4); ctx.fill(); ctx.stroke(); }
        ctx.beginPath(); ctx.ellipse(-20 * side, 0, 7, 12, 0.5 * side, 0, 7); ctx.fill(); ctx.stroke();
      } else { // relaxed fist: a mitten with knuckle lines and a thumb
        ctx.rotate(Math.atan2(d2[1], d2[0]) - Math.PI / 2);
        ctx.beginPath(); ctx.roundRect(-18, -10, 36, 38, 13); ctx.fill(); ctx.stroke();
        ctx.lineWidth = 3; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-9 + i * 9, 17); ctx.lineTo(-9 + i * 9, 27); ctx.stroke(); }
        ctx.lineWidth = 4.5; ctx.beginPath(); ctx.ellipse(-16 * side, 2, 7, 12, 0.35 * side, 0, 7); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }
    // back arm (L, holds the mug) first
    const aL = arm(-1, P.L[0], P.L[1]);
    if (st.mug !== false) {
      ctx.save(); ctx.translate(aL.wr[0] + 14, aL.wr[1] - 6);
      ctx.fillStyle = PC.mug; ctx.strokeStyle = ol; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.roundRect(-8, -34, 50, 58, 7); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(46, -6, 13, -1.2, 1.2); ctx.stroke();
      ctx.fillStyle = PC.band; ctx.fillRect(-4, -18, 42, 9);
      // steam
      ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 4;
      for (let i = 0; i < 2; i++) { const ph = t * 1.4 + i * 1.7; ctx.beginPath(); ctx.moveTo(8 + i * 18, -40); ctx.bezierCurveTo(8 + i * 18 + Math.sin(ph) * 8, -56, 8 + i * 18 - Math.sin(ph) * 8, -66, 8 + i * 18, -82); ctx.stroke(); }
      ctx.restore();
    }
    hand(aL.wr, aL.d2, "fist", -1);
    // neck + head
    const hy = -640 + br * 0.5, tilt = (st.tilt || 0) + Math.sin(t * 0.9) * 0.015;
    ctx.save(); ctx.translate(0, hy); ctx.rotate(tilt);
    ctx.fillStyle = PC.skin; ctx.strokeStyle = ol; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.roundRect(-20, 30, 40, 58, 8); ctx.fill(); ctx.stroke();
    // afro puff behind (high bun) + side volume
    ctx.fillStyle = PC.hair;
    const puff = (cx, cy, r, n, seed) => { ctx.beginPath(); for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, rr2 = r * (0.9 + 0.1 * Math.sin(i * 2.3 + seed)); const x = cx + Math.cos(a) * rr2, y = cy + Math.sin(a) * rr2; if (i) ctx.quadraticCurveTo(cx + Math.cos(a - Math.PI / n) * r * 1.12, cy + Math.sin(a - Math.PI / n) * r * 1.12, x, y); else ctx.moveTo(x, y); } ctx.closePath(); ctx.fill(); ctx.stroke(); };
    puff(0, -128, 82, 14, 1);
    // pencil through the puff
    ctx.save(); ctx.translate(30, -150); ctx.rotate(0.55); ctx.fillStyle = PC.pencil; ctx.fillRect(-6, -78, 12, 96); ctx.strokeRect(-6, -78, 12, 96); ctx.fillStyle = "#e9c9a0"; ctx.beginPath(); ctx.moveTo(-6, 18); ctx.lineTo(0, 34); ctx.lineTo(6, 18); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#e88"; ctx.fillRect(-6, -90, 12, 12); ctx.strokeRect(-6, -90, 12, 12); ctx.restore();
    puff(0, -18, 84, 16, 2.4);
    // head band
    ctx.fillStyle = PC.band; ctx.beginPath(); ctx.ellipse(0, -66, 70, 14, 0, Math.PI * 1.02, Math.PI * 1.98); ctx.lineTo(62, -54); ctx.ellipse(0, -54, 64, 12, 0, Math.PI * 1.98, Math.PI * 1.02, true); ctx.closePath(); ctx.fill(); ctx.stroke();
    // ears + hoops
    ctx.fillStyle = PC.skin;
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 62, 0, 13, 19, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.strokeStyle = "#e8b632"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(sx * 64, 26, 9, 0, 7); ctx.stroke(); ctx.strokeStyle = ol; ctx.lineWidth = 5; }
    // face
    ctx.fillStyle = PC.skin; ctx.beginPath(); ctx.ellipse(0, 2, 62, 74, 0, 0, 7); ctx.fill(); ctx.stroke();
    // hair edge over forehead
    ctx.fillStyle = PC.hair; ctx.beginPath(); ctx.ellipse(0, -52, 64, 24, 0, Math.PI, 0); ctx.quadraticCurveTo(40, -40, 0, -38); ctx.quadraticCurveTo(-40, -40, -64, -52); ctx.fill();
    // cheeks
    ctx.fillStyle = "rgba(220,90,80,.22)"; ctx.beginPath(); ctx.ellipse(-36, 28, 13, 8, 0, 0, 7); ctx.ellipse(36, 28, 13, 8, 0, 0, 7); ctx.fill();
    // eyes (look direction)
    const lx = (st.look ? st.look[0] : 0.4) * 5, ly = (st.look ? st.look[1] : 0) * 4;
    const bl = clamp(st.blink || 0, 0, 1);
    for (const sx of [-1, 1]) {
      const ex = sx * 24, ey = -6;
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(ex, ey, 12, 14 * (1 - bl * 0.92), 0, 0, 7); ctx.fill();
      if (bl < 0.7) { ctx.fillStyle = "#1a1210"; ctx.beginPath(); ctx.arc(ex + lx, ey + ly + 1, 6.5, 0, 7); ctx.fill(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ex + lx + 2.5, ey + ly - 2, 2.2, 0, 7); ctx.fill(); }
      ctx.lineWidth = 3.5; ctx.beginPath(); ctx.ellipse(ex, ey, 12, 14 * (1 - bl * 0.92), 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      // brows
      const bu = (st.brow || 0) * 6;
      ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(ex - 13, -36 - bu + (sx < 0 ? 2 : 0)); ctx.quadraticCurveTo(ex, -44 - bu, ex + 13, -36 - bu + (sx > 0 ? 2 : 0)); ctx.stroke();
    }
    // glasses (round, red)
    ctx.strokeStyle = PC.glass; ctx.lineWidth = 6;
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * 24, -5, 22, 0, 7); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-3, -9); ctx.quadraticCurveTo(0, -13, 3, -9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-46, -9); ctx.lineTo(-60, -12); ctx.moveTo(46, -9); ctx.lineTo(60, -12); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 3; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * 24, -5, 15, -2.4, -1.7); ctx.stroke(); }
    ctx.strokeStyle = ol;
    // nose
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-4, 14); ctx.quadraticCurveTo(-10, 26, -2, 28); ctx.moveTo(6, 27); ctx.quadraticCurveTo(10, 26, 9, 22); ctx.stroke();
    // mouth (lip sync)
    const m = clamp(st.mouth || 0, 0, 1);
    if (m < 0.08) {
      ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(-18, 44); ctx.quadraticCurveTo(0, 54 + (st.smile || 0) * 4, 18, 44); ctx.stroke();
    } else {
      const mw = 16 + m * 6, mh = 6 + m * 15;
      ctx.fillStyle = "#4a1414"; ctx.beginPath(); ctx.moveTo(-mw, 42); ctx.quadraticCurveTo(0, 38, mw, 42); ctx.quadraticCurveTo(mw * 0.6, 42 + mh * 1.4, 0, 42 + mh * 1.3); ctx.quadraticCurveTo(-mw * 0.6, 42 + mh * 1.4, -mw, 42); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.fillRect(-mw * 0.62, 41, mw * 1.24, Math.min(6, mh * 0.4));
      if (m > 0.4) { ctx.fillStyle = "#d4575a"; ctx.beginPath(); ctx.ellipse(0, 42 + mh * 1.05, mw * 0.45, mh * 0.28, 0, 0, 7); ctx.fill(); }
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-mw, 42); ctx.quadraticCurveTo(0, 38, mw, 42); ctx.quadraticCurveTo(mw * 0.6, 42 + mh * 1.4, 0, 42 + mh * 1.3); ctx.quadraticCurveTo(-mw * 0.6, 42 + mh * 1.4, -mw, 42); ctx.closePath(); ctx.stroke();
    }
    ctx.restore();
    // collar of the tee over the neck base
    ctx.save(); ctx.translate(0, br * 0.3); ctx.fillStyle = PC.tee; ctx.strokeStyle = ol; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-26, shY - 4); ctx.quadraticCurveTo(0, shY + 22, 26, shY - 4); ctx.stroke(); ctx.restore();
    // front arm (R)
    const kindR = (st.pose === "point" || st.pose2 === "point") && (st.pk == null || st.pk > 0.5) ? "point" : st.pose === "thumbs" ? "thumb" : (st.pose === "explain" || st.pose === "shrug" || st.pose === "wave" || st.pose === "present") ? "open" : "fist";
    const aR = arm(1, P.R[0], P.R[1]);
    hand(aR.wr, aR.d2, kindR, 1);
    if (st.pose === "shrug") { /* open left hand too */ }
    ctx.restore();
    return { head: [st.x, st.y - (st.lift || 0) + (hy - 120) * sc], hand: [st.x + (aR.wr[0]) * sc, st.y - (st.lift || 0) + aR.wr[1] * sc] };
  }

  window.RETRO = {
    W, H, C, SCR, TASK_Y, CAP_Y, GL, tw, text, icon, iconCanvas, cursor, bevel, panel, sunken, button, checkbox, radio, progress, field, win, titleBar,
    zoomRect, menu, bubble, caseBack, chin, desktop, screenFX, taskbar, taskSlot, caption, pia, POSE, rr,
    util: { clamp, lerp, sm, eo, eio, back, rnd, hash },
  };
})();

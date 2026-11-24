/* film.js — "Endure": a fast quote-card collage cut on the beat (9:16), public-domain aphorisms on code-drawn cards.
   Cards: C1 white card built word by word + a pink flash card -> C2 printed page, highlighter + "& one more" ladder
   -> C3 engraved boulder pusher in a spotlight -> C4 engraved Titan holding the sky -> C5 concrete wall, stencil words
   -> C6 white-line sketch of the boulder pusher on black, drawing itself.
   Transitions: word pop with a horizontal smear, pink flash, pillow pop-in (pincushion warp), vertical whip, hard cut,
   horizontal whip. Everything is a pure function of t.   window.FILM(K, CFG) -> { draw(t) }                          */
window.FILM = function (K, CFG) {
  const THREE = K.THREE, KW = window.KW, A = window.QCART, E = KW.ease, seg = KW.seg, lerp = KW.lerp;
  const W = K.W, H = K.H, DUR = CFG.dur, B = 60 / CFG.bpm, b0 = CFG.beat0 || 0;
  const bt = (k) => b0 + k * B;
  const T = {
    w1: bt(1), w2: bt(2), pink: bt(4), page: bt(8), boulder: bt(11), titan: bt(14), whip: bt(17), wall: bt(18),
    s1: bt(18), s2: bt(19), s3: bt(20), s4: bt(21), sketch: bt(22.5),
  };
  // a variant can pin any change to an exact time (e.g. to another track's grid): CFG.times = { sketch: 13.17, ... }
  if (CFG.times) Object.assign(T, CFG.times);
  const F = { sans: "QCSans", serif: "QCSerif", serifI: "QCSerifI", stencil: "QCStencil" };

  // ---------------------------------------------------------------- static art (built once)
  const pageTex = A.paper(W, H, [228, 224, 216], 5);
  const whiteTex = A.paper(W, H, [251, 250, 246], 9);
  const concrete = A.concrete(W, H);
  // C3: boulder pusher in a spotlight; background engraved with lines whose width follows a radial light
  const SPOT = [380, 600];
  const pusherPr = A.pusherPrims(1.0, 30, 600);
  const boulderCard = A.engrave(W, H, pusherPr, {
    spacing: 6.5,
    bg: (x, y) => {
      const d = Math.hypot((x - SPOT[0]) * 1.0, (y - SPOT[1]) * 0.85);
      const tone = 0.22 + 0.76 * Math.exp(-Math.pow(d / 360, 2)) + 0.06 * (A.fbm(x * 0.01, y * 0.01) - 0.5);
      return { tone, ph: (x * 0.34 + y * 0.94) / 6.5 + 0.6 * Math.sin(x * 0.006 + y * 0.004), ph2: (x * 0.94 - y * 0.34) / 7 };
    },
  });
  // C4: the Titan, cropped by the right edge like a book plate
  const titanPr = A.titanPrims(0.98, 360, 470);
  const titanCard = A.engrave(W, H, titanPr, { spacing: 6.5, paper: [251, 250, 246] });
  A.globeDetail(titanCard, 360 + 560 * 0.98, 470 + 470 * 0.98, 262 * 0.98);
  // C6: the sketch strokes (the same figure, re-placed)
  const sketchStrokes = A.sketch(A.pusherPrims(1.04, -14, 200));

  // stencil words on a transparent canvas (bridged letters + overspray), multiplied onto the concrete
  function stencilWord(str, px) {
    const pad = 60, c0 = document.createElement("canvas").getContext("2d");
    c0.font = `400 ${px}px ${F.stencil}`;
    const w = Math.ceil(c0.measureText(str).width) + pad * 2, h = Math.ceil(px * 1.05) + pad * 2;
    const t = document.createElement("canvas"); t.width = w; t.height = h; const x = t.getContext("2d");
    x.font = `400 ${px}px ${F.stencil}`; x.textBaseline = "alphabetic"; x.fillStyle = "#000";
    x.fillText(str, pad, pad + px * 0.88);
    // bridges: two thin horizontal cuts through every letter
    x.globalCompositeOperation = "destination-out";
    x.fillRect(0, pad + px * 0.88 - px * 0.47, w, px * 0.035);
    x.fillRect(0, pad + px * 0.88 - px * 0.16, w, px * 0.03);
    const o = document.createElement("canvas"); o.width = w; o.height = h; const ox = o.getContext("2d");
    ox.filter = "blur(7px)"; ox.globalAlpha = 0.45; ox.drawImage(t, 0, 0); ox.filter = "none"; ox.globalAlpha = 1;
    // speckled overspray
    const rn = KW.rng(px + str.length);
    ox.globalCompositeOperation = "source-atop";
    for (let k = 0; k < 2600; k++) { ox.fillStyle = `rgba(255,255,255,${rn() * 0.7})`; ox.fillRect(rn() * w, rn() * h, 2, 2); }
    ox.globalCompositeOperation = "source-over";
    ox.globalAlpha = 0.93; ox.drawImage(t, 0, 0); ox.globalAlpha = 1;
    return { c: o, w, h, pad };
  }
  const SW = [["FIRE", 330, 700, T.s1], ["TESTS", 330, 1010, T.s2], ["GOLD.", 330, 1320, T.s3]].map(([s, px, y, t0]) => Object.assign(stencilWord(s, px), { y, t0 }));
  const SEN = Object.assign(stencilWord("SENECA", 92), { y: 1585, t0: T.s4 });

  // ---------------------------------------------------------------- card painters (2-D, into a 1080x1920 canvas)
  const cvA = document.createElement("canvas"), cvB = document.createElement("canvas");
  cvA.width = cvB.width = W; cvA.height = cvB.height = H;
  const texA = K.tex(cvA), texB = K.tex(cvB);
  texA.generateMipmaps = texB.generateMipmaps = false; texA.minFilter = texB.minFilter = THREE.LinearFilter;

  function textBlock(x, lines, o) {
    // lines: [{s, t0}] ; draws centred lines; the newest word smears in for 2 frames
    x.textAlign = o.align || "center"; x.textBaseline = "middle"; x.font = o.font; x.fillStyle = o.color;
    lines.forEach((ln, i) => {
      const y = o.y + i * o.lh;
      const age = o.t - (ln.t0 === undefined ? -9 : ln.t0);
      if (age < 0) return;
      if (o.shadow) { x.save(); x.fillStyle = o.shadow; x.filter = "blur(1.5px)"; x.fillText(ln.s, o.x + 4, y + 5); x.restore(); }
      if (age < 0.07) {                                    // horizontal smear pop
        const u = age / 0.07;
        x.save(); x.globalAlpha = 0.22;
        for (let k = -3; k <= 3; k++) x.fillText(ln.s, o.x + k * (1 - u) * 22, y);
        x.restore();
      } else x.fillText(ln.s, o.x, y);
    });
  }
  const mixHex = (a, b, u) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A_ = p(a), B_ = p(b); return `rgb(${A_.map((v, i) => Math.round(v + (B_[i] - v) * u)).join(",")})`; };

  const CARDS = [
    { t0: 0, t1: T.page, zoom: (t) => 1 + 0.05 * seg(t, 0, T.pink) + 0.12 * E.out2(seg(t, T.pink, T.page)), paint(x, t) {
      const u = E.out2(seg(t, T.pink, T.pink + 0.62));
      x.drawImage(whiteTex, 0, 0);
      if (t >= T.pink) { x.save(); x.globalAlpha = 1 - u; x.fillStyle = "#cd7c88"; x.fillRect(0, 0, W, H); x.restore(); }
      if (t < T.pink) {
        textBlock(x, [{ s: "A journey", t0: -1 }, { s: "of a thousand", t0: T.w1 }, { s: "miles", t0: T.w2 }].filter((l) => t >= l.t0),
          { t, font: `400 92px ${F.sans}`, color: "#141414", x: 540, y: 850, lh: 112 });
      } else {
        textBlock(x, [{ s: "begins with", t0: T.pink }, { s: "a single step.", t0: T.pink }],
          { t, font: `500 104px ${F.sans}`, color: mixHex("#4a0f1c", "#111111", u), x: 540, y: 880, lh: 122, shadow: `rgba(60,40,40,${0.3 + 0.15 * u})` });
        x.save(); x.globalAlpha = seg(t, T.pink + 0.25, T.pink + 0.5); x.font = `400 36px ${F.sans}`; x.fillStyle = "#8a8580"; x.textAlign = "center";
        x.fillText("— Lao Tzu", 540, 1090); x.restore();
      }
    } },
    { t0: T.page, t1: T.boulder + 0.1, zoom: (t) => 1.0 + 0.13 * E.out2(seg(t, T.page, T.boulder)), drift: (t) => [0, -0.03 * seg(t, T.page, T.boulder)], paint(x, t) {
      x.drawImage(pageTex, 0, 0);
      // gutter shadow on the left like a bound page
      const g = x.createLinearGradient(0, 0, 160, 0); g.addColorStop(0, "rgba(0,0,0,0.22)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, 160, H);
      const X0 = 170, Y0 = 560, LH = 128;
      x.font = `400 118px ${F.serif}`; x.textBaseline = "alphabetic"; x.textAlign = "left";
      const hw = x.measureText("One step.").width;
      // highlighter (multiply, ragged ends), swept on in 0.12 s
      const hu = E.out3(seg(t, T.page + 0.05, T.page + 0.2));
      x.save(); x.globalCompositeOperation = "multiply"; x.fillStyle = "#d9f23a";
      x.beginPath(); x.moveTo(X0 - 18, Y0 - 98); x.lineTo(X0 - 18 + (hw + 40) * hu, Y0 - 102); x.lineTo(X0 - 14 + (hw + 40) * hu, Y0 + 26); x.lineTo(X0 - 22, Y0 + 30); x.closePath(); x.fill(); x.restore();
      x.fillStyle = "#1d1b18"; x.fillText("One step.", X0, Y0);
      for (let k = 0; k < 8; k++) {
        const tk = T.page + 0.1 + k * (B / 4);
        if (t < tk) break;
        const a = 0.92 - k * 0.08, bl = Math.max(0, k - 2) * 1.3;
        x.save(); x.globalAlpha = a * E.out2(seg(t, tk, tk + 0.05)); x.filter = bl > 0 ? `blur(${bl}px)` : "none"; x.fillStyle = "#34312c";
        x.fillText("& one more", X0 + 6, Y0 + LH * (k + 1)); x.restore();
      }
    } },
    { t0: T.boulder, t1: T.titan, zoom: (t) => 1.0 + 0.07 * E.io(seg(t, T.boulder, T.titan)), paint(x, t) {
      x.drawImage(boulderCard, 0, 0);
      x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "#121110"; x.font = `400 64px ${F.serif}`;
      ["The obstacle", "on the road", "helps us", "on this road."].forEach((s, i) => x.fillText(s, SPOT[0], SPOT[1] - 126 + i * 80));
      x.font = `400 32px ${F.serifI}`; x.fillStyle = "#3a3633"; x.fillText("— Marcus Aurelius", SPOT[0], SPOT[1] + 210);
    } },
    { t0: T.titan, t1: T.wall + 0.25, zoom: (t) => 1.0 + 0.06 * E.io(seg(t, T.titan, T.whip)), drift: (t) => [-0.62 * E.in3(seg(t, T.whip, T.wall + 0.1)), 0],
      blur: (t) => [E.in2(seg(t, T.whip, T.wall)) * 120, 0], paint(x, t) {
      x.drawImage(titanCard, 0, 0);
      x.textAlign = "left"; x.textBaseline = "middle"; x.font = `500 76px ${F.sans}`;
      const L = ["There is no", "easy way", "from the earth", "to the stars."];
      x.save(); x.shadowColor = "rgba(251,250,246,1)"; x.shadowBlur = 18; x.fillStyle = "#101010";
      L.forEach((s, i) => x.fillText(s, 64, 600 + i * 94)); x.restore();
      x.fillStyle = "#101010"; L.forEach((s, i) => x.fillText(s, 64, 600 + i * 94));
      x.font = `400 34px ${F.sans}`; x.fillStyle = "#77736d"; x.fillText("— Seneca", 66, 600 + 4 * 94 + 6);
    } },
    { t0: T.wall, t1: T.sketch + 1.0, zoom: (t) => 1.0 + 0.1 * E.out2(seg(t, T.wall, T.sketch + 0.5)), paint(x, t) {
      x.drawImage(concrete, 0, 0);
      x.save(); x.globalCompositeOperation = "multiply";
      [...SW, SEN].forEach((s) => {
        if (t < s.t0) return;
        const u = E.out3(seg(t, s.t0, s.t0 + 0.1)), sc = lerp(1.06, 1, u);
        x.globalAlpha = Math.min(1, 0.4 + u);
        x.save(); x.translate(500, s.y); x.scale(sc, sc); x.drawImage(s.c, -s.w / 2, -s.h / 2); x.restore();
      });
      x.restore();
    } },
    { t0: T.sketch, t1: DUR + 1, zoom: (t) => 1.0 + 0.05 * seg(t, T.sketch + 0.6, DUR), paint(x, t) {
      x.fillStyle = "#070707"; x.fillRect(0, 0, W, H);
      const rn = KW.rng(3);
      x.fillStyle = "rgba(255,255,255,0.05)"; for (let k = 0; k < 500; k++) x.fillRect(rn() * W, rn() * H, 2, 2);
      QCART.drawStrokes(x, sketchStrokes, E.out2(seg(t, T.sketch + 0.02, T.sketch + (CFG.sketchDraw || 0.75))), { width: 2.4 });
    } },
  ];

  // ---------------------------------------------------------------- compositor: card A, optional card B (pillow / slide)
  const comp = K.shader(`varying vec2 vUv; uniform sampler2D tA, tB; uniform float sA, sB, kB, hasB, grain, t, vig, aspect, bOp;
      uniform vec2 oA, oB, mbA, mbB, res; ${KW.noiseGLSL}
    vec3 sampA(vec2 uv){ vec2 u = (uv - .5 - oA) / sA + .5; vec3 c = vec3(0.);
      for (int i = 0; i < 16; i++){ vec2 q = u + mbA * (float(i) / 15. - .5) / res; c += texture2D(tA, clamp(q, 0., 1.)).rgb; }
      return c / 16.; }
    vec4 sampB(vec2 uv){ vec2 p = uv - .5 - oB; p /= sB; vec2 pa = vec2(p.x * aspect, p.y); float r2 = dot(pa, pa) / (.25 * aspect * aspect + .25);
      // pincushion "pillow": clamp r2 where r(1 + k r^2) stops growing, so points outside the card always map outside it
      float r2c = kB < 0. ? min(r2, 1. / (3. * abs(kB) + 1e-4)) : r2;
      vec2 q = p * (1. + kB * r2c);
      if (abs(q.x) > .5 || abs(q.y) > .5) return vec4(0.);
      vec3 c = vec3(0.);
      for (int i = 0; i < 16; i++){ vec2 qq = q + .5 + mbB * (float(i) / 15. - .5) / res; c += texture2D(tB, clamp(qq, 0., 1.)).rgb; }
      // soft drop shadow edge
      return vec4(c / 16., 1.); }
    void main(){
      vec3 c = sampA(vUv);
      if (hasB > .5) { vec4 b = sampB(vUv);
        // a dark halo just outside the incoming card
        vec2 p = (vUv - .5 - oB) / sB; float edge = max(abs(p.x), abs(p.y));
        c *= 1. - .35 * smoothstep(.62, .5, edge) * (1. - b.a) * bOp;
        c = mix(c, b.rgb, b.a * bOp); }
      vec2 d = vUv - .5; d.x *= aspect; c *= 1. - vig * smoothstep(.35, .95, length(d) * 1.2);
      c += (hash12(vUv * res + fract(t * 7.3) * 500.) - .5) * grain;
      gl_FragColor = vec4(c, 1.); }`,
    { tA: { value: texA }, tB: { value: texB }, sA: { value: 1 }, sB: { value: 1 }, kB: { value: 0 }, hasB: { value: 0 }, grain: { value: 0.035 }, t: { value: 0 },
      vig: { value: 0.18 }, aspect: { value: W / H }, bOp: { value: 1 }, oA: { value: new THREE.Vector2() }, oB: { value: new THREE.Vector2() },
      mbA: { value: new THREE.Vector2() }, mbB: { value: new THREE.Vector2() }, res: { value: new THREE.Vector2(W, H) } });

  const ctxA = cvA.getContext("2d"), ctxB = cvB.getContext("2d");
  function paint(card, cv, x, t) { x.save(); x.clearRect(0, 0, W, H); card.paint(x, t); x.restore(); }
  // transitions into card i (index): kind + window
  const TR = {
    1: { kind: "pillow", t0: T.page - 0.02, d: 0.16, s0: 0.78, k0: -0.6 },
    2: { kind: "vwhip", t0: T.boulder - 0.1, d: 0.2 },
    3: { kind: "cut" },
    4: { kind: "pillow", t0: T.wall - 0.02, d: 0.16, s0: 0.78, k0: -0.6 },
    5: { kind: "pillow", t0: T.sketch - 0.02, d: CFG.sketchGrow || 0.96, s0: 0.5, k0: -0.3, ease: "in2", fadeIn: 0.12 },
  };
  function draw(t) {
    t = Math.max(0, Math.min(DUR - 1e-4, t));
    let i = 0;
    while (i < CARDS.length - 1 && t >= CARDS[i + 1].t0 - (TR[i + 1] && TR[i + 1].kind === "vwhip" ? 0.1 : 0) - 0.02) i++;
    const u = comp.uniforms;
    u.t.value = t; u.hasB.value = 0; u.mbA.value.set(0, 0); u.mbB.value.set(0, 0); u.oA.value.set(0, 0); u.oB.value.set(0, 0); u.kB.value = 0; u.bOp.value = 1;
    const cur = CARDS[i], tr = TR[i];
    const setA = (card, tt) => { u.sA.value = card.zoom ? card.zoom(tt) : 1; const dr = card.drift ? card.drift(tt) : [0, 0]; u.oA.value.set(dr[0], dr[1]); const bl = card.blur ? card.blur(tt) : [0, 0]; u.mbA.value.set(bl[0], bl[1]); };
    if (tr && tr.kind === "pillow" && t < tr.t0 + tr.d && i > 0) {
      // previous card keeps running underneath, the new one pops in with a pincushion warp
      const prev = CARDS[i - 1];
      paint(prev, cvA, ctxA, t); texA.needsUpdate = true; setA(prev, t);
      paint(cur, cvB, ctxB, t); texB.needsUpdate = true;
      const v = (tr.ease === "lin" ? (u) => u : tr.ease === "in2" ? E.in2 : tr.ease === "out2" ? E.out2 : E.out3)(seg(t, tr.t0, tr.t0 + tr.d));
      u.hasB.value = 1; u.sB.value = lerp(tr.s0, 1, v) * (cur.zoom ? cur.zoom(t) : 1); u.kB.value = tr.k0 * (1 - v);
      if (tr.fadeIn) u.bOp.value = seg(t, tr.t0, tr.t0 + tr.fadeIn);       // the last card eases in over a few frames
    } else if (tr && tr.kind === "vwhip" && t < tr.t0 + tr.d && i > 0) {
      const prev = CARDS[i - 1], v = E.io(seg(t, tr.t0, tr.t0 + tr.d));
      paint(prev, cvA, ctxA, t); texA.needsUpdate = true; setA(prev, t);
      u.oA.value.y += -v; u.mbA.value.set(0, 260 * Math.sin(Math.PI * v));
      paint(cur, cvB, ctxB, t); texB.needsUpdate = true;
      u.hasB.value = 1; u.sB.value = cur.zoom(t); u.oB.value.set(0, 1 - v); u.mbB.value.set(0, 260 * Math.sin(Math.PI * v)); u.kB.value = 0;
    } else {
      paint(cur, cvA, ctxA, t); texA.needsUpdate = true; setA(cur, t);
    }
    K.quad(comp, null);
  }
  return { draw, T, CARDS };
};

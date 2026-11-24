/* film.js — "The Fox at the Door" (fable-storybook format, 60 fps).
   A fox gets into a hen house one small request at a time (one paw, one feather, one egg ... the key), then the reel
   steps out of the fable into the lesson: the foot-in-the-door effect (Freedman & Fraser, 1966, Experiment 2: 76.0 %
   of people first asked for a tiny safe-driving sign later agreed to a huge lawn sign, against 16.7 % asked cold).
   Every beat is keyed to the narration's word times (V.w(line, word)). window.FB_FILM(K, V) -> {draw(t)}. */
window.FB_FILM = function (K, V) {
  const { ctx, W, H, P, clamp, lerp, lin, sstep, eio, eout, back, rng } = K;
  const DUR = V.duration;
  const w = (id, word, k) => V.w(id, word, k);
  const L = (id) => V.L(id);
  // ---------------------------------------------------------------- the clock (seconds), from the narration
  const T = {
    zin: L("bolt").start - 0.5,                       // zoom through the door into the coop
    bolted: w("bolt", "bolted"), ask: L("ask").start, onePaw: w("ask", "one"), sign: L("ask").end + 0.12,
    yes: L("yes").start, saidYes: w("yes", "yes"), more: L("more").start, night2: w("more", "next"), feather: w("more", "feather"),
    night3: w("more", "then"), egg: w("more", "egg"), little: L("little").start, whisper: w("little", "whispered"),
    weeks: L("weeks").start - 0.08, keyL: L("key").start, key: w("key", "key"), nice: L("nice").start, thanked: w("nice", "thanked"),
    habit: L("habit").start, saying: w("habit", "saying"), fable: L("fable").start, pattern: w("fable", "pattern"), foot: w("fable", "foot"),
    study: L("study").start, tiny: w("study", "tiny"), big: L("big").start, huge: w("big", "huge"),
    res1: L("res1").start, seventy: w("res1", "seventy"), res2: L("res2").start, seventeen: w("res2", "seventeen"),
    why: L("why").start, small: w("why", "small"), see: w("why", "see"), next: L("next").start, never: w("next", "never"),
    q: L("q").start, qEnd: L("q").end,
  };
  T.zout1 = T.weeks + 0.05; T.zin2 = T.keyL - 0.42;            // weeks: out to the time-lapse and back in
  T.zout2 = T.fable - 0.12; T.shrink = T.fable + 0.45; T.navy = T.fable + 1.35;
  T.cardIn = T.q - 0.45; T.cardFull = T.q + 0.55; T.zout3 = T.qEnd + 0.15;

  // ---------------------------------------------------------------- helpers
  const BUF = document.createElement("canvas"); BUF.width = W; BUF.height = H;
  const bctx = BUF.getContext("2d");
  const BUF2 = document.createElement("canvas"); BUF2.width = W; BUF2.height = H;
  const b2ctx = BUF2.getContext("2d");
  let C = ctx;                                         // the film's current target; K.setCtx moves the kit with it
  const kitCtx = ctx;
  function useCtx(c) { C = c; K.setCtx(c); }
  function fresh(c) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; }
  function renderTo(fn) { const keep = C; useCtx(bctx); fresh(bctx); fn(); useCtx(keep); }
  function renderTo2(fn, alpha) { const keep = C; useCtx(b2ctx); fresh(b2ctx); fn(); useCtx(keep); C.save(); C.setTransform(1, 0, 0, 1, 0, 0); C.globalAlpha = alpha; C.drawImage(BUF2, 0, 0); C.restore(); }
  function cam(z, cx, cy) { C.setTransform(z, 0, 0, z, W / 2 - z * cx, H / 2 - z * cy); }
  const pop = (t, t0, d = 0.28) => lin(t0, t0 + d, t);
  const on = (t, t0, t1, fi = 0.18, fo = 0.18) => Math.min(lin(t0, t0 + fi, t), 1 - lin(t1 - fo, t1, t));
  const wob = (t, k = 1) => Math.sin(t * 2.2 * k);

  // ---------------------------------------------------------------- EXTERIOR
  function exterior(t, o) {
    const tod = o.tod == null ? 0 : o.tod;
    K.sky(tod);
    const dayK = tod > 1 ? Math.min(1, tod - 1) * (tod < 2.5 ? 1 : 0) : 0;
    const nightK = tod <= 1 ? sstep(0.3, 1, tod) : 1 - sstep(1, 1.6, tod);
    K.stars(nightK, 4);
    if (nightK < 0.98) K.sun(o.sunX || 200, 770 - 260 * dayK, 70, 1 - nightK);
    if (nightK > 0.02) K.sun(820, 360, 46, nightK, true);
    K.hills(nightK > 0.5 ? 1 : 0);
    K.ground(nightK > 0.5 ? 1 : 0, 1170);
    K.fence(-40, 220, 1196, nightK > 0.5 ? 1 : 0);
    const c = K.coopOut(470, 1196, { tod: nightK > 0.5 ? 1 : 0, door: o.door || 0, glow: 1 });
    K.owl(140, 1084, 0.78, { t, blink: (t % 3.3) > 3.15 ? 1 : 0, look: o.owlLook || 0.4, worried: o.owlWorried, bob: Math.sin(t * 2) * 1.5 });
    if (o.fox) K.fox(o.fox[0], 1206, 0.86, { dir: -1, walk: o.fox[1], look: o.fox[2] || 0, eye: o.foxEye || "sly", dark: o.foxDark });
    return c;
  }

  // ---------------------------------------------------------------- INTERIOR
  const HENS = [
    [135, 1272, 0, 1], [262, 1262, 2, 1], [392, 1270, 3, 1], [520, 1266, 1, 1], [640, 1276, 0, -1],
    [196, 1318, 1, 1], [330, 1322, 0, 1], [462, 1318, 2, 1], [590, 1326, 3, -1], [96, 1338, 3, 1],
  ];
  function hens(t, mood) {
    HENS.forEach(([x, y, col, dir], i) => {
      const ph = t * 2.3 + i * 1.7;
      let o = { col, dir, bob: Math.sin(ph) * 2, eye: "n", look: 0.5 };
      if (mood.panic > 0.01) { o.eye = "wide"; o.flap = mood.panic * (0.5 + 0.5 * Math.sin(t * 24 + i)); o.bob = Math.sin(t * 18 + i) * 4 * mood.panic; }
      if (mood.happy) o.eye = "happy";
      if (mood.worried) o.eye = "worried";
      if (mood.toward) o.dir = 1;
      if (mood.nod != null) { const k = clamp((t - mood.nod - i * 0.16) / 0.3, 0, 1); o.peck = Math.sin(k * Math.PI) * 0.6; o.eye = "closed"; }
      if (mood.gone && mood.gone.includes(i)) return;
      K.hen(360 + (x - 360) * 1.07, y, 1.12, o);
    });
  }
  function wallCount(t, day, n, a, lastAt) {
    K.dayPill({ day, x: 70, y: 470, a, pop: lastAt == null ? 1 : pop(t, lastAt, 0.3) });
    K.tally({ n, x: 96, y: 520, a, perRow: 6, h: 48, gap: 13, groupGap: 24, rowGap: 64, lastU: lastAt == null ? 1 : eout(lin(lastAt, lastAt + 0.25, t)) });
  }
  function interior(t, o) {
    K.coopIn({ t, lamp: o.lamp == null ? 1 : o.lamp, lx: 470 });
    const d = K.doorIn({ ajar: o.ajar || 0, bolt: o.bolt == null ? 1 : o.bolt });
    if (o.signA > 0.01) K.sign({ lines: ["ONE PAW", "ONLY"], x: 660, y: 760, a: o.signA, swing: o.swing || 0, cross: o.cross || 0, w: 250, h: 128, px: 40 });
    if (o.count) wallCount(t, o.count[0], o.count[1], o.count[2] == null ? 1 : o.count[2], o.count[3]);
    if (o.shadow > 0.01) {               // the fox's long shadow across the floor
      C.save(); C.globalAlpha = 0.55 * o.shadow; C.fillStyle = "#120a1c";
      C.beginPath(); C.moveTo(d.gapX + 10, 1245); C.lineTo(d.gapX + d.gapW, 1245); C.lineTo(300, 1520); C.lineTo(40, 1520); C.closePath(); C.fill(); C.restore();
    }
    if (o.foxPeek > 0.01) {              // the fox in the doorway: dark, eyes catching the lamp
      C.save(); C.beginPath(); C.rect(d.gapX, d.y, d.gapW + 2, d.h); C.clip();
      K.fox(d.gapX + d.gapW * 0.5 + 140 - 60 * o.foxPeek, 1250, 1.05, { dir: -1, dark: true, eye: "glow", look: -0.05 });
      C.restore();
    }
    if (o.paw > 0.01) K.paw(d.gapX + 10 - 70 * eout(o.paw) + 40, 1030, 1.0, Math.PI);
    hens(t, o.mood || {});
    if (o.props) o.props(d);
  }

  // ---------------------------------------------------------------- props
  function feather(x, y, a, rot) { C.save(); C.translate(x, y); C.rotate(rot); C.globalAlpha *= a; C.fillStyle = "#f6efe4"; C.beginPath(); C.ellipse(0, 0, 34, 11, 0, 0, Math.PI * 2); C.fill(); C.strokeStyle = "#cdbfae"; C.lineWidth = 2.5; C.beginPath(); C.moveTo(-40, 2); C.lineTo(30, -1); C.stroke(); C.restore(); }
  function egg(x, y, a, rot) { C.save(); C.translate(x, y); C.rotate(rot); C.globalAlpha *= a; C.fillStyle = "#f3e3c8"; C.beginPath(); C.ellipse(0, 0, 20, 26, 0, 0, Math.PI * 2); C.fill(); C.fillStyle = "rgba(255,255,255,0.5)"; C.beginPath(); C.ellipse(-6, -8, 6, 9, -0.3, 0, Math.PI * 2); C.fill(); C.restore(); }
  function keyIcon(x, y, s, a, rot) { C.save(); C.translate(x, y); C.rotate(rot); C.scale(s, s); C.globalAlpha *= a; C.strokeStyle = "#e8b74a"; C.lineWidth = 9; C.beginPath(); C.arc(-34, 0, 18, 0, Math.PI * 2); C.stroke(); C.fillStyle = "#e8b74a"; C.fillRect(-16, -5, 64, 10); C.fillRect(30, 0, 8, 18); C.fillRect(42, 0, 8, 13); K.glow(0, 0, 70, [255, 210, 120], 0.25); C.restore(); }

  // ---------------------------------------------------------------- NAVY lesson
  const owlNavy = (t, a, wing) => { if (a <= 0.01) return; C.save(); C.globalAlpha = a; K.owl(150, 1336 + (1 - a) * 60, 1.0, { t, wing, look: 0.6, blink: (t % 2.9) > 2.75 ? 1 : 0 }); C.restore(); };
  const ROOFS = ["#8a5f7a", "#5f6f9e", "#9b6a5a", "#6f5a8a"];
  function grid(t, x0, y0, cols, rows, n, yes, t0, dt, s, sel, tA) {
    let k = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (k >= n) return;
      const i = k++, x = x0 + c * 98 * s, y = y0 + r * 92 * s;
      const order = sel.indexOf(i);
      const b = order >= 0 && order < yes ? lin(t0 + order * dt, t0 + order * dt + 0.22, t) : 0;
      K.house(x, y, 0.62 * s, { c: i, roof: ROOFS[i % 4], board: b, a: lin(tA + i * 0.02, tA + 0.2 + i * 0.02, t) });
    }
  }
  const SEL25 = (() => { const r = rng(12); const a = [...Array(25).keys()]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; })();
  const SEL24 = [3, 10, 16, 21];
  function lesson(t) {
    K.navy();
    // title (fable -> study)
    const tA = on(t, T.pattern - 0.25, T.study + 0.25, 0.25, 0.3);
    if (tA > 0) {
      K.text("THE PATTERN", 540, 330, { px: 30, ls: 9, col: "#c6cde6", a: tA });
      const k = eout(lin(T.foot, T.foot + 0.35, t));
      if (k > 0) { K.text("FOOT IN THE", 540, 440, { px: 96, col: "#fbf3e6", a: tA * k, ls: 2 }); K.text("DOOR", 540, 552, { px: 124, col: P.yellow, a: tA * k, ls: 4 }); }
    }
    // the study: a street of six houses, tiny signs pop in the windows
    const sA = on(t, T.study - 0.05, T.res1 - 0.1, 0.3, 0.35);
    if (sA > 0) {
      K.label({ lines: ["A 1966 STUDY"], a: on(t, T.study + 0.05, T.big - 0.05, 0.12, 0.15), pop: pop(t, T.study + 0.05) });
      K.text("Palo Alto, California", 540, 405, { px: 34, w: 800, col: "#c6cde6", a: on(t, T.study + 0.3, T.big - 0.05, 0.2, 0.15) });
      K.label({ lines: ["TWO WEEKS LATER"], dark: true, a: on(t, T.big, T.res1 - 0.1, 0.12, 0.25), pop: pop(t, T.big) });
      K.stamp({ text: "HUGE SIGN", x: 590, y: 352, a: on(t, T.huge, T.res1 - 0.1, 0.05, 0.25), pop: lin(T.huge, T.huge + 0.18, t) });
      const z = 1 + 0.75 * eio(lin(T.big + 0.4, T.huge, t));
      C.save(); C.globalAlpha = sA; C.translate(540, 1050); C.scale(z, z); C.translate(-540 + (z - 1) * 60, -1050);
      C.strokeStyle = "#2a3c6c"; C.lineWidth = 8; C.beginPath(); C.moveTo(40, 1052); C.lineTo(1040, 1052); C.stroke();
      for (let i = 0; i < 6; i++) {
        const x = 140 + i * 160;
        const sg = lin(T.tiny + 0.12 * i, T.tiny + 0.12 * i + 0.25, t);
        K.house(x, 1050, 1.45, { c: i, roof: ROOFS[i % 4], sign: sg, a: lin(T.study - 0.05 + i * 0.07, T.study + 0.25 + i * 0.07, t) });
      }
      C.restore();
      if (t > T.huge - 0.05) { const k = back(lin(T.huge, T.huge + 0.35, t), 1.6); K.billboard(700, 1100, 0.95 * k, sA); }
    }
    // the results: two grids of houses (25 asked small first, 24 asked cold), billboards pop
    const gA = on(t, T.res1 - 0.15, T.why + 0.1, 0.3, 0.3);
    if (gA > 0) {
      C.save(); C.globalAlpha = gA;
      K.tag({ text: "ASKED FOR THE TINY SIGN FIRST", x: 540, y: 480, pop: pop(t, T.res1), a: 1 });
      grid(t, 150, 600, 5, 5, 25, 19, T.seventy - 0.1, 0.075, 1.0, SEL25, T.res1 + 0.05);
      const pc = Math.round(76 * eout(lin(T.seventy - 0.1, T.seventy + 1.4, t)));
      if (t > T.seventy - 0.15) K.text(pc + "%", 830, 740, { px: 150, col: P.yellow, a: lin(T.seventy - 0.15, T.seventy + 0.05, t) });
      if (t > T.seventy + 0.6) K.text("said yes to the huge sign", 830, 840, { px: 34, w: 800, col: "#c6cde6", a: lin(T.seventy + 0.6, T.seventy + 0.9, t) });
      const bA = lin(T.res2 - 0.1, T.res2 + 0.2, t);
      if (bA > 0) {
        C.save(); C.globalAlpha *= bA;
        K.tag({ text: "ASKED COLD", x: 380, y: 1010, pop: pop(t, T.res2), col: "#c6cde6", tc: "#1d2747" });
        grid(t, 150, 1100, 6, 4, 24, 4, T.seventeen - 0.05, 0.16, 0.82, SEL24, T.res2 + 0.05);
        if (t > T.seventeen - 0.1) K.text(Math.round(17 * eout(lin(T.seventeen - 0.1, T.seventeen + 0.9, t))) + "%", 860, 1200, { px: 120, col: "#fbf3e6", a: lin(T.seventeen - 0.1, T.seventeen + 0.1, t) });
        C.restore();
      }
      C.restore();
    }
    // why: a small yes changes how you see yourself; next: every ask only a little bigger
    const yA = on(t, T.why + 0.05, DUR, 0.3, 0.2);
    if (yA > 0 && t < T.cardFull + 0.1) {
      K.label({ lines: ["A SMALL YES CHANGES", "HOW YOU SEE YOURSELF"], a: on(t, T.small - 0.1, T.next + 0.05, 0.15, 0.2), pop: pop(t, T.small - 0.1) });
      K.label({ lines: ["NO STEP FEELS BIG"], a: on(t, T.next + 0.1, DUR, 0.15, 0.2), pop: pop(t, T.next + 0.1) });
      const px = lerp(540, 300, eio(lin(T.next, T.next + 0.6, t)));
      C.save(); C.globalAlpha = yA;
      C.strokeStyle = "#2a3c6c"; C.lineWidth = 8; C.beginPath(); C.moveTo(40, 1122); C.lineTo(1040, 1122); C.stroke();
      K.peg(px, 1120, 1.55, { col: "#e9dff0", badge: lin(T.small + 0.35, T.small + 0.6, t), smile: t > T.see });
      K.tag({ text: t < T.see + 0.1 ? "SAID YES ONCE" : "SOMEONE WHO SAYS YES", x: px, y: 860, pop: t < T.see + 0.1 ? pop(t, T.small + 0.3) : pop(t, T.see + 0.1), a: on(t, T.small + 0.3, T.next + 0.3, 0.1, 0.2) });
      K.tag({ text: "YOU", x: px, y: 860, pop: pop(t, T.next + 0.3), a: lin(T.next + 0.3, T.next + 0.45, t) });
      if (t > T.next) {   // the asks, each only a little bigger, sliding up to YOU
        const asks = [["PAW", 0.62], ["FEATHER", 0.78], ["EGG", 0.94], ["KEY", 1.16]];
        asks.forEach(([s, k], i) => {
          const t0 = T.next + 0.25 + i * 0.32, u = eout(lin(t0, t0 + 0.45, t));
          if (u <= 0) return;
          const x = lerp(1250, 440 + i * 150 + 6 * i * i, u), bw = 140 * k, bh = 128 * k;
          C.save(); C.globalAlpha *= u; C.shadowColor = "rgba(8,6,20,0.4)"; C.shadowBlur = 12; C.shadowOffsetY = 6;
          C.fillStyle = i === 3 ? "#e8b74a" : "#c9b38f"; K.rr(x - bw / 2, 1122 - bh, bw, bh, 10); C.fill(); C.shadowColor = "transparent";
          C.fillStyle = "rgba(60,40,20,0.25)"; C.fillRect(x - bw / 2, 1122 - bh * 0.62, bw, 8 * k);
          K.text(s, x, 1122 - bh / 2 - 8, { px: 24 * k + 8, col: "#3b2414" });
          C.restore();
        });
        const rk = lin(T.never + 0.55, T.never + 0.85, t);
        if (rk > 0) { const x = 440 + 3 * 150 + 54, r = 108 * back(rk, 2); C.save(); C.strokeStyle = P.pink; C.lineWidth = 6; C.globalAlpha = yA * rk; C.beginPath(); C.arc(x, 1048, r, 0, Math.PI * 2); C.stroke(); for (let k2 = 0; k2 < 4; k2++) { const a = k2 * Math.PI / 2 + 0.3; C.beginPath(); C.moveTo(x + Math.cos(a) * (r - 14), 1048 + Math.sin(a) * (r - 14)); C.lineTo(x + Math.cos(a) * (r + 14), 1048 + Math.sin(a) * (r + 14)); C.stroke(); } C.restore(); }
      }
      C.restore();
    }
    const owlA = Math.max(on(t, T.fable + 1.1, T.res1 - 0.05, 0.35, 0.3), on(t, T.why - 0.1, DUR, 0.35, 0.2));
    const wing = t < T.study ? 0.6 * sstep(T.foot - 0.3, T.foot, t) : t < T.big ? 0.45 + 0.1 * Math.sin(t * 3) : t > T.why ? 0.5 * sstep(T.small - 0.2, T.small + 0.1, t) : 0.2;
    owlNavy(t, owlA, wing);
  }

  // ---------------------------------------------------------------- the beats
  function sceneAt(t) {
    // 0 hook: exterior at dusk, the fox walks up to the hen house
    if (t < T.zin + 0.42) {
      const fx = lerp(1010, 815, eout(lin(0, 2.15, t)));
      const walking = t < 2.15;
      return { kind: "ext", o: { fox: [fx, walking ? t * 9 : null, walking ? 0 : -0.06], owlLook: -0.8 } };
    }
    return { kind: "int" };
  }
  function intState(t) {
    const o = { mood: {}, bolt: 1, ajar: 0, signA: 0, lamp: 1 };
    // bolt: the bar drops on "bolted", panic
    o.bolt = t < T.bolted - 0.2 ? 0 : eout(lin(T.bolted - 0.2, T.bolted + 0.15, t));
    o.mood.panic = t < T.ask + 0.4 ? 1 : 1 - lin(T.ask + 0.4, T.ask + 1.0, t);
    if (t >= T.yes) { o.mood.panic = 0; }
    // the sign appears after the fox's ask, swings
    if (t > T.sign - 0.1) { o.signA = lin(T.sign - 0.1, T.sign + 0.1, t); o.swing = 0.12 * Math.exp(-(t - T.sign) * 2.2) * Math.sin((t - T.sign) * 9); }
    // yes: the door opens a crack, the paw comes in
    if (t > T.saidYes - 0.1) { o.bolt = 1 - eout(lin(T.saidYes - 0.4, T.saidYes - 0.05, t)); o.ajar = 0.32 * eout(lin(T.saidYes - 0.05, T.saidYes + 0.4, t)); o.paw = lin(T.saidYes + 0.1, T.saidYes + 0.6, t) * (1 - lin(T.night2 - 0.3, T.night2, t)); o.mood.happy = t < T.night2; }
    if (t > T.saidYes + 0.3) { const d = t < T.night2 ? 1 : t < T.night3 ? 2 : t < T.weeks ? 3 : 41; const n = d === 41 ? 41 : d; const last = d === 1 ? T.saidYes + 0.3 : d === 2 ? T.night2 : d === 3 ? T.night3 : null; o.count = [d, n, 1, last]; }
    if (t > T.whisper - 0.3 && t < T.weeks) { o.count = [6, 6, 1, null]; }
    if (t > T.keyL - 0.6) { o.count = [41, 41, 1, null]; o.ajar = 0.32; o.bolt = 0; o.mood.worried = t < T.nice; }
    if (t > T.key + 0.05) o.cross = eout(lin(T.key + 0.05, T.key + 0.6, t));
    if (t > T.key + 0.6) o.cross = 1;
    if (t > T.thanked - 0.2) { o.mood.worried = false; o.mood.happy = t < T.habit; }
    // habit: the door swings wide, the fox in the doorway, the hens nod yes one after another
    if (t > T.habit - 0.1) { o.ajar = 0.32 + 0.68 * eout(lin(T.habit - 0.1, T.habit + 0.7, t)); o.foxPeek = lin(T.habit + 0.2, T.habit + 0.9, t); o.shadow = lin(T.habit + 0.2, T.habit + 1.0, t); o.lamp = 1 - 0.35 * lin(T.habit, T.habit + 0.8, t); o.mood.nod = T.saying + 0.1; o.mood.toward = true; }
    if (t > T.cardIn) { o.ajar = 1; o.foxPeek = 0; o.shadow = 0.6; o.lamp = 0.7; o.mood = { worried: true, toward: true }; o.count = [41, 41, 1, null]; o.cross = 1; o.signA = 1; }
    return o;
  }
  function intProps(t) {
    return (d) => {
      // the ask: speech bubble from the door
      const bA = on(t, T.onePaw - 0.05, T.sign + 0.1, 0.06, 0.15);
      if (bA > 0) K.bubble({ lines: ["JUST ONE PAW."], x: 760, y: 560, tx: 860, ty: 660, a: bA, pop: pop(t, T.onePaw - 0.05, 0.3), px: 40 });
      // one feather out
      if (t > T.feather - 0.2 && t < T.feather + 1.0) { const u = eio(lin(T.feather - 0.2, T.feather + 0.8, t)); feather(lerp(560, d.gapX + 40, u), lerp(1130, 980, u) - Math.sin(u * Math.PI) * 60, 1 - lin(0.85, 1, u), u * 3); }
      if (t > T.feather - 0.3 && t < T.night3) K.bubble({ lines: ["ONE FEATHER?"], x: 760, y: 590, tx: 850, ty: 680, a: on(t, T.night2 + 0.1, T.night3 - 0.05, 0.08, 0.12), pop: pop(t, T.night2 + 0.1), px: 34, small: true });
      if (t > T.egg - 0.25 && t < T.egg + 1.0) { const u = eio(lin(T.egg - 0.25, T.egg + 0.7, t)); egg(lerp(520, d.gapX + 50, u), lerp(1230, 1215, u), 1 - lin(0.9, 1, u), u * 9); }
      if (t > T.night3 && t < T.little) K.bubble({ lines: ["ONE EGG?"], x: 760, y: 590, tx: 850, ty: 680, a: on(t, T.night3 + 0.1, T.little - 0.05, 0.08, 0.12), pop: pop(t, T.night3 + 0.1), px: 34, small: true });
      // whisper: it's only a little
      if (t > T.whisper - 0.2 && t < T.weeks + 0.1) {
        [[255, 990, 0], [469, 1030, 0.38], [114, 1060, 0.76]].forEach(([x, y, dt]) => {
          const a = on(t, T.whisper + dt, T.weeks + 0.05, 0.08, 0.15);
          K.bubble({ lines: ["It's only a little."], x, y: y - 40, tx: x + 20, ty: y + 18, a, pop: pop(t, T.whisper + dt), px: 30, small: true, quote: false });
        });
      }
      // the key: the fox asks through the gap; a hen slides the key out after the thanks
      if (t > T.key - 0.1 && t < T.nice) K.bubble({ lines: ["THE KEY?"], x: 760, y: 590, tx: 860, ty: 690, a: on(t, T.key - 0.1, T.nice - 0.05, 0.08, 0.12), pop: pop(t, T.key - 0.1), px: 38 });
      if (t > T.thanked && t < T.habit + 0.3) {
        const bk = on(t, T.thanked, T.habit + 0.3, 0.1, 0.3);
        K.cone(330, 380, 980, 120, 440, [255, 220, 150], 0.22 * bk);
        K.banner({ text: "THANK YOU, FOX!", x: 330, y: 1080, w: 430, a: bk, pop: pop(t, T.thanked, 0.35) });
        const u = eio(lin(T.thanked + 0.9, T.habit, t));
        keyIcon(lerp(560, d.gapX + 50, u), lerp(1180, 1090, u), 0.9, 1 - lin(0.9, 1, u), u * 2);
      }
      // habit: one small "yes" per hen
      if (t > T.saying) {
        [[119, 1252], [255, 1242], [394, 1250], [531, 1246], [660, 1256]].forEach(([x, y], i) => {
          const t0 = T.saying + 0.12 + i * 0.22;
          K.bubble({ lines: ["Yes."], x: x + 18, y: y - 205, tx: x + 34, ty: y - 160, a: on(t, t0, T.fable + 0.2, 0.06, 0.2), pop: pop(t, t0, 0.22), px: 28, small: true, quote: false });
        });
      }
    };
  }
  function intCam(t) {
    // [zoom, cx, cy]
    if (t < T.ask + 0.2) return [lerp(1.1, 1.0, eout(lin(T.zin, T.zin + 1.0, t))), 540, 990];
    if (t < T.yes) return [lerp(1.0, 1.42, eio(lin(T.ask + 0.2, T.onePaw + 0.3, t))), lerp(540, 800, eio(lin(T.ask + 0.2, T.onePaw + 0.3, t))), lerp(990, 975, eio(lin(T.ask + 0.2, T.onePaw + 0.3, t)))];
    if (t < T.little) return [lerp(1.42, 1.05, eio(lin(T.yes - 0.1, T.yes + 0.6, t))), lerp(800, 560, eio(lin(T.yes - 0.1, T.yes + 0.6, t))), lerp(975, 970, eio(lin(T.yes - 0.1, T.yes + 0.6, t)))];
    if (t < T.weeks) return [lerp(1.05, 1.3, eio(lin(T.little, T.whisper + 0.4, t))), lerp(560, 400, eio(lin(T.little, T.whisper + 0.4, t))), lerp(970, 1040, eio(lin(T.little, T.whisper + 0.4, t)))];
    if (t < T.nice) return [lerp(1.12, 1.0, eout(lin(T.zin2, T.zin2 + 0.9, t))), 560, 960];
    if (t < T.habit) return [lerp(1.0, 1.12, eio(lin(T.nice, T.habit, t))), 520, 1000];
    if (t > T.cardIn) return [lerp(1.0, 1.06, lin(T.cardIn, T.zout3, t)), 560, 960];
    return [lerp(1.12, 1.16, eio(lin(T.habit, T.fable, t))), lerp(520, 545, eio(lin(T.habit, T.fable, t))), 990];
  }
  function drawInterior(t) {
    const [z, cx, cy] = intCam(t);
    cam(z, cx, cy);
    const o = intState(t);
    o.props = intProps(t);
    interior(t, o);
    // night dips between the days (planned)
    C.setTransform(1, 0, 0, 1, 0, 0);
    for (const tn of [T.night2, T.night3]) { const k = Math.max(0, 1 - Math.abs(t - tn) / 0.22); if (k > 0) K.shade(0.42 * k, "#0d1030"); }
  }
  function drawExterior(t, o, zoom) {
    const [z, cx, cy] = zoom || [1, 540, 960];
    cam(z, cx, cy);
    exterior(t, o);
    C.setTransform(1, 0, 0, 1, 0, 0);
  }
  const DOOR = [595, 1046];                       // the coop door, world coords (exterior)

  function labelFor(t) {
    const Ls = [
      [0, T.zin + 0.25, ["A FOX AT THE HEN HOUSE"]],
      [T.zin + 0.45, T.ask + 0.3, ["THE DOOR STAYED SHUT"]],
      [T.yes + 0.1, T.more - 0.05, ["IT SEEMED HARMLESS"]],
      [T.more + 0.05, T.little - 0.05, ["A LITTLE MORE EACH NIGHT"]],
      [T.weeks, T.zin2 + 0.3, ["WEEKS LATER…"]],
      [T.zin2 + 0.35, T.nice - 0.05, ["THEN THE KEY"]],
      [T.habit + 0.1, T.zout2 + 0.2, ["YES. YES. YES."]],
      [T.cardIn + 0.25, DUR + 1, ["WHICH YES SHOULD", "THEY HAVE REFUSED?"]],
    ];
    for (const [a, b, lines] of Ls) {
      if (t >= a && t < b) { const al = a === 0 ? Math.min(1, (b - t) / 0.15) : on(t, a, b, 0.06, 0.15); K.label({ lines, a: al, pop: a === 0 ? 1 : pop(t, a, 0.3) }); }
    }
  }

  // ---------------------------------------------------------------- frame
  function draw(t) {
    t = clamp(t, 0, DUR - 1e-4);
    useCtx(kitCtx);
    kitCtx.setTransform(1, 0, 0, 1, 0, 0); kitCtx.globalAlpha = 1; kitCtx.globalCompositeOperation = "source-over";
    const fox0 = (tt) => [lerp(1010, 815, eout(lin(0, 2.15, tt))), tt < 2.15 ? tt * 9 : null, tt < 2.15 ? 0 : -0.06];

    if (t < T.zin) {                                                         // 1 hook (exterior)
      const z = 1 + 0.06 * eio(lin(0, T.zin, t));
      drawExterior(t, { fox: fox0(t), owlLook: -0.8 }, [z, 540, 960]);
    } else if (t < T.zin + 0.5) {                                            // zoom through the door
      const u = eio(lin(T.zin, T.zin + 0.5, t));
      drawInterior(t);
      renderTo(() => drawExterior(t, { fox: fox0(t), door: u * 0.8, owlLook: -0.8 }, [lerp(1.06, 4.2, u), lerp(540, DOOR[0], u), lerp(960, DOOR[1], u)]));
      kitCtx.globalAlpha = 1 - sstep(0.35, 0.95, u); kitCtx.drawImage(BUF, 0, 0); kitCtx.globalAlpha = 1;
    } else if (t < T.zout1) {
      drawInterior(t);
    } else if (t < T.zin2 + 0.45) {                                          // weeks: out, time-lapse, back in
      const uo = eio(lin(T.zout1, T.zout1 + 0.45, t)), ui = eio(lin(T.zin2, T.zin2 + 0.45, t));
      const tod = lerp(0, 6, lin(T.zout1 + 0.3, T.zin2 + 0.05, t));       // dusk -> night -> day, twice
      const foxHere = Math.floor(tod * 2) % 2 === 0;
      const ext = () => drawExterior(t, { tod: tod % 3, fox: foxHere ? [790, null, -0.05] : null, owlLook: -0.6, door: 0.25 }, [lerp(4.2, 1.0, uo) + lerp(0, 3.2, ui), lerp(DOOR[0], 540, uo) + (DOOR[0] - 540) * ui, lerp(DOOR[1], 960, uo) + (DOOR[1] - 960) * ui]);
      if (t < T.zout1 + 0.45) { drawInterior(t); renderTo(ext); kitCtx.globalAlpha = sstep(0.05, 0.6, uo); kitCtx.drawImage(BUF, 0, 0); kitCtx.globalAlpha = 1; }
      else if (t < T.zin2) { ext(); }
      else { drawInterior(t); renderTo(ext); kitCtx.globalAlpha = 1 - sstep(0.35, 0.95, ui); kitCtx.drawImage(BUF, 0, 0); kitCtx.globalAlpha = 1; }
    } else if (t < T.zout2) {
      drawInterior(t);
    } else if (t < T.navy + 0.6) {                                            // out to the night, shrink into a photo card
      const uo = eio(lin(T.zout2, T.zout2 + 0.5, t));
      const scene = () => {
        if (t < T.zout2 + 0.5) { drawInterior(t); renderTo2(() => drawExterior(t, { tod: 1, fox: [700, null, -0.1], foxDark: true, foxEye: "glow", door: 1, owlWorried: true, owlLook: 0.6 }, [lerp(4.2, 1.0, uo), lerp(DOOR[0], 540, uo), lerp(DOOR[1], 960, uo)]), sstep(0.05, 0.6, uo)); }
        else drawExterior(t, { tod: 1, fox: [700, null, -0.1], foxDark: true, foxEye: "glow", door: 1, owlWorried: true, owlLook: 0.6 }, [1, 540, 960]);
      };
      const us = eio(lin(T.shrink, T.shrink + 0.6, t)), ud = eio(lin(T.navy - 0.2, T.navy + 0.45, t));
      if (us <= 0) { scene(); }
      else {
        renderTo(scene);
        useCtx(kitCtx); lesson(t);
        K.photo({ img: BUF, x: 540, y: lerp(960, 900, us) + 1300 * ud, s: lerp(1, 0.74, us), rot: lerp(0, -0.035, us), a: 1 - 0.3 * ud, tagA: lin(T.shrink + 0.3, T.shrink + 0.5, t), border: us });
      }
    } else if (t < T.cardIn) {
      lesson(t);
    } else if (t < T.cardFull) {                                            // the fable card flies back in and fills the frame
      const ui = eio(lin(T.cardIn, T.cardIn + 0.45, t)), uf = eio(lin(T.cardIn + 0.45, T.cardFull, t));
      lesson(t);
      renderTo(() => drawInterior(t));
      useCtx(kitCtx);
      K.photo({ img: BUF, x: 540, y: lerp(2400, 920, ui) + lerp(0, 40, uf), s: lerp(0.74, 1.0, uf), rot: lerp(-0.035, 0, uf), a: 1, tagA: 1 - uf, border: 1 - uf });
    } else if (t < T.zout3) {
      drawInterior(t);
    } else {                                                                  // last: out to the dusk again, the fox walks up (= frame 0)
      const uo = eio(lin(T.zout3, T.zout3 + 0.55, t));
      const tt = lerp(0, 0.06, lin(T.zout3 + 0.55, DUR, t));
      const ext = () => drawExterior(t, { fox: fox0(tt), owlLook: -0.8 }, [lerp(4.2, 1.0, uo), lerp(DOOR[0], 540, uo), lerp(DOOR[1], 960, uo)]);
      if (uo < 1) { drawInterior(t); renderTo(ext); kitCtx.globalAlpha = sstep(0.05, 0.6, uo); kitCtx.drawImage(BUF, 0, 0); kitCtx.globalAlpha = 1; }
      else ext();
    }
    useCtx(kitCtx); C.setTransform(1, 0, 0, 1, 0, 0); C.globalAlpha = 1;
    if (t < T.navy - 0.4 || t > T.cardIn) labelFor(t);
    K.vignette(0.32);
    K.grain(t, 0.05);
    if (!window.FB_NO_CAPTIONS) K.captions(V.chunks.map((c, i) => (i === 0 ? { ...c, t0: 0 } : c)), t);
  }
  return { draw, T };
};

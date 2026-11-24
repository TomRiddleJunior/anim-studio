/* layer-stack-horror — "What it really takes to run a haunted house".
 * The layer-stack format played straight for 13 chapters (warm paper, static presenter, a build on every stressed
 * word, a red stamp per failure, a stack row per fix, a crowd blow-up, the halftone 'months later' wipe), then the
 * callback turns: the paper dims a little over the last chapters, the final chapter goes to night (pale ink on
 * near-black), the clickers read 12 out / 11 in, and one tall faceless figure walks out last. Lights out, red "12 / 11".
 * Fiction: Hollow Pines Haunt does not exist. Hidden re-watch details: the figure stands in the pines in chapter 01 and
 * in the back of the Halloween crowd in chapter 11. */
X.boot(async (X) => {
  await X.loadVO();
  const spec = await (await fetch('script.json')).json();
  const C = K.C, S = K.S, G = K.G;
  K.canvas();
  const ids = spec.lines.map((l) => l.id).filter((id) => /^c\d\d$/.test(id)); // c14b / c14c belong to chapter c14
  const END = X.vo.duration;
  const T0 = ids.map((id, i) => (i === 0 ? 0 : X.line(id).start - 0.1));
  const T1 = ids.map((id, i) => (i < ids.length - 1 ? T0[i + 1] : END));
  const nrm = (s) => s.toLowerCase().replace(/[^a-z0-9$%']/g, '');
  const wd = (id, w, n = 0) => X.word(id, w, n);
  const wf = (id, ...ws) => { const L = X.line(id); for (const w of ws) { const hit = L.words.find((x) => nrm(x.w).startsWith(nrm(w))); if (hit) return hit.start; } return L.start; };
  const W = (p) => G(p, {}); // animation wrapper (never tween a group that carries a transform attribute)
  const clamp = (u) => Math.max(0, Math.min(1, u));
  const LAY = [['01', 'THE BARN'], ['02', 'HEADCOUNT'], ['03', 'TRIGGER PADS'], ['04', 'HAZE · DETECTORS'], ['05', 'SAFE WORD'], ['06', 'TIMED TICKETS']].map(([n, label]) => ({ n, label }));
  const TAGS = ['just open friday', 'the maze', 'headcount', 'too early', 'trigger pads', 'screaming', 'opening night', 'haze', 'room four', 'safe word', 'halloween', 'timed tickets', 'a year later', 'at closing'];
  // the last chapter's beats (shared with scratch/score.py: blackout = end of the last line + 1.45 s)
  const tEndV = X.line('c14c').end, tBlack = tEndV + 1.45, tCount = tBlack + 1.7;
  const tagList = ids.map((id, i) => [T0[i], i === ids.length - 1 ? tCount : T1[i], `// ${String(i + 1).padStart(2, '0')} — ${TAGS[i]}`]);
  tagList.push([tCount, END + 1, '// 15 — count again']);
  K.tags(tagList);
  // the paper dims very slightly over the last chapters (variant deviation: the source canvas never changes)
  const DIM = { 8: '#f5f2ec', 9: '#f0ece5', 10: '#ebe7df', 11: '#e7e2d9', 12: '#e3ded4', 13: '#ddd7cc' };
  Object.entries(DIM).forEach(([i, c]) => K.canvasTo(T0[+i], c));
  const WIDE = new Set([0, 4, 10, 12, 13]);
  const chap = (i, build) => {
    const holder = WIDE.has(i) ? K.world : G(K.world, { transform: 'translate(660 850) scale(1.15) translate(-660 -850)' });
    const g = X.scene(ids[i], T0[i], T1[i], null, holder);
    const o = X.scene(ids[i] + 'o', T0[i], T1[i], null, K.over);
    build(g, o, T0[i], T1[i], ids[i]);
  };
  /** mini layer stack; the newest row (index n-1) slides in from the right at tNew */
  const miniStack = (p, x, y, w, n, tNew, o = {}) => {
    const st = K.stack(p, x, y, w, LAY.slice(0, n), { fresh: n - 1, rh: o.rh || 40, size: o.size || 21, gap: 5 });
    if (tNew != null) {
      const r = st.rows[n - 1];
      K.slideIn(r, tNew, 'right', 320, { dur: 0.22, ease: 'power3.out', sfx: 'slide' });
      K.puff(p, x + w / 2, r.y + 44, tNew + 0.2, 0.8);
      X.sfx(tNew + 0.22, 'thud', { gain: 0.25 });
    }
    return st;
  };
  const tick = (t, g = 0.22) => X.sfx(t, 'blip', { gain: g });
  const queue = (p, xs, y, s, seed, o = {}) => xs.map((x, i) => {
    const q = W(p);
    const pal = [[C.skin4, '#6a9a7a', '#b38b5d'], [C.skin3, '#c9a067', '#1e1f24'], [C.skin1, '#7f6f96', '#2a1d19'], [C.skin2, '#4f8a8a', '#8a4a2c'], ['#a8714e', '#b06a52', '#2a1d19']][(i + seed) % 5];
    const pp = K.person(q, x, y, s, { skin: pal[0], shirt: pal[1], hairC: pal[2], cap: (i + seed) % 4 === 2 ? C.navy : null, frown: o.frown });
    q.p = pp;
    return q;
  });

  // ---------------------------------------------------------------- presenter (static, as in the source)
  const PW = W(K.pres);
  K.presenter(PW, 14, 590);
  const zoomT = wd('c01', 'So') - 0.05;
  gsap.set(PW, { autoAlpha: 0 });
  X.tl.set(PW, { autoAlpha: 1 }, zoomT);
  X.tl.fromTo(PW, { x: -190 }, { x: 0, duration: 0.42, ease: 'power3.inOut', immediateRender: false }, zoomT);
  [[T0[4], T0[5]], [T0[10], T0[11]], [T0[12], END + 1]].forEach(([a, b]) => { X.tl.set(PW, { autoAlpha: 0 }, a); X.tl.set(PW, { autoAlpha: 1 }, b); });

  // ================================================================ 01 just open friday (wide, zoom-out reveal)
  chap(0, (g, o, t0, t1, id) => {
    const cam = W(g); cam.id = 'c01cam';
    gsap.set(cam, { svgOrigin: '0 0', scale: 1.37, x: -372, y: -386 });
    X.tl.to(cam, { scale: 1, x: 0, y: 0, duration: 0.42, ease: 'power3.inOut' }, zoomT);
    X.sfx(zoomT, 'woosh_low', { gain: 0.35 });
    // scenery: a row of pines (the "hollow pines"), the moon, the field
    const back = W(cam);
    const rnd = X.rand(5);
    S('path', { d: 'M240,1075 L1080,1075', stroke: '#dcd7cd', 'stroke-width': 3 }, back);
    K.moon(back, 990, 420, 34);
    const pinesX = [];
    for (let x = 262; x < 1100; x += 62) pinesX.push(x + rnd() * 18);
    pinesX.forEach((x, i) => { if (i < pinesX.length - 1) K.pine(back, x, 1068 + rnd() * 10, 0.75 + rnd() * 0.35, { fill: rnd() < 0.5 ? C.pine : C.pine2 }); });
    // hidden: the figure stands among the last pines, pale as a shadow (re-watch detail)
    const hid = W(back);
    K.figure(hid, 1018, 1070, 0.72, { fill: '#e2ded6', line: '#d8d3ca', sw: 2, shadow: false });
    K.pine(back, pinesX[pinesX.length - 1] + 20, 1074, 0.95, { fill: C.pine2 });
    gsap.set(hid, { opacity: 0 });
    X.tl.to(hid, { opacity: 1, duration: 0.4, ease: 'none' }, wf(id, 'three'));
    // "what everyone thinks": a postcard of a dark hallway and a guy in a mask
    const pc = W(cam);
    K.card(pc, 460, 560, 410, 310, { r: 16 });
    K.mono(pc, 482, 594, '// a haunted house', { size: 20, weight: 600, fill: '#8d8a84' });
    K.pop(pc, t0 + 0.18, { sfx: 'paper', bump: false });
    const hall = W(pc);
    K.rrect(hall, 482, 612, 366, 236, 6, '#2a2b31', 3);
    const hl = S('path', { d: 'M482,612 L612,686 M848,612 L718,686 M482,848 L612,770 M848,848 L718,770', stroke: '#55565e', 'stroke-width': 3 }, hall);
    K.rrect(hall, 612, 686, 106, 84, 2, '#121216', 2.5);
    S('path', { d: 'M530,640 l0,40 M800,640 l0,40', stroke: '#fde099', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.8 }, hall);
    K.pop(hall, wd(id, 'haunted') + 0.12, { sfx: 'click', gain: 0.25 });
    X.drawOn(hl, wd(id, 'dark'), 0.3);
    const guy = W(pc);
    K.person(guy, 665, 770, 0.5, { skin: C.skin2, shirt: '#3a3c43', hair: false, bob: 0 });
    S('ellipse', { cx: 665, cy: 711, rx: 18, ry: 22, fill: '#f4f1ea', ...K.stroke(2) }, guy);
    S('path', { d: 'M657,706 l6,0 M668,706 l6,0 M660,722 l10,0', stroke: C.ink, 'stroke-width': 3, 'stroke-linecap': 'round' }, guy);
    K.pop(guy, wd(id, 'guy'), { sfx: 'pop', gain: 0.25 });
    K.pulse(cam, 665, 730, 90, wd(id, 'mask'), { before: pc, hold: 0.5 });
    // townsfolk with opinions
    const tw = [[400, 'spooky!', 0.42, '#5b6b8c'], [905, 'boo?', 0.7, '#b06a52'], [650, 'a mask!', 2.7, '#4f9a6c']].map(([x, s, dt, col]) => {
      const w = W(cam); K.walker(w, x, 1236, 1.6, col);
      const b = W(cam); K.bubble(b, x - 70, 1060, s, { size: 30, tail: 'left' }); K.pop(b, t0 + dt, { gain: 0.22, pitch: 0.9 + dt });
      return [w, b];
    });
    const ring = S('circle', { cx: 665, cy: 715, r: 40, fill: 'none', stroke: C.red, 'stroke-width': 2.5, opacity: 0 }, cam);
    X.tl.to(ring, { attr: { r: 380 }, opacity: 0.8, duration: 0.45, ease: 'power2.out' }, wd(id, 'haunted') - 0.1);
    X.tl.to(ring, { opacity: 0, duration: 0.25 }, wd(id, 'haunted') + 0.45);
    X.sfx(wd(id, 'haunted') - 0.1, 'swoosh', { gain: 0.25 });
    const that = W(cam); K.bubble(that, 690, 900, "that's it?", { size: 30, tail: 'left' });
    K.pop(that, wd(id, 'mask') + 0.25, { gain: 0.2 });
    [pc, that, ...tw.flat()].forEach((e, i) => K.popOut(e, zoomT + 0.04 + i * 0.03));
    // crane + barn drop ("rent a barn")
    const cr = W(cam);
    K.crane(cr, 470, 470, 1120, { tx: 676 });
    K.slideIn(cr, wd(id, 'So') - 0.03, 'right', 700, { dur: 0.3, ease: 'power3.out', sfx: 'whoosh' });
    const bw = W(cam);
    const barn = K.barn(bw, 532, 1072, 286, 196, { sign: 'HOLLOW PINES' });
    const cables = S('path', { d: 'M676,562 L566,790 M676,562 L786,790', ...K.stroke(3), fill: 'none' }, bw);
    const hookLine = S('path', { d: 'M676,562 L676,-300', ...K.stroke(3) }, bw);
    const tDrop = wd(id, 'rent') - 0.18;
    gsap.set(bw, { y: -860, autoAlpha: 0 });
    X.tl.set(bw, { autoAlpha: 1 }, tDrop);
    X.tl.to(bw, { y: 0, duration: 0.42, ease: 'power2.in' }, tDrop);
    X.sfx(tDrop, 'slide', { gain: 0.3 });
    K.puff(cam, 690, 1072, tDrop + 0.42, 1.3);
    X.sfx(tDrop + 0.42, 'thud', { gain: 0.5 });
    X.tl.to([cables, hookLine], { opacity: 0, duration: 0.1 }, tDrop + 0.55);
    const rent = W(cam); K.pill(rent, 840, 730, 'RENTED ✓', { fill: C.green, size: 20, padX: 12, padY: 12, font: K.F.label, weight: 800 });
    K.pop(rent, wd(id, 'barn') + 0.2, { sfx: 'coin', gain: 0.2 });
    // fog machine + rolling fog
    const fm = W(cam);
    const mach = K.fogMachine(fm, 900, 1076, 0.72);
    K.pop(fm, wd(id, 'buy'), { sfx: 'pop' });
    K.fog(cam, 950, 1040, wd(id, 'fog'), t1, { dx: -460, dy: 50, n: 13, r: 44, seed: 4, gap: 0.09 });
    X.sfx(wd(id, 'fog'), 'woosh_low', { gain: 0.3, dur: 0.8 });
    // three scarers
    const kinds = ['ghost', 'scarecrow', 'pumpkin'];
    const tS = [wd(id, 'hire'), wf(id, 'three'), wf(id, 'scarers', 'scare', 'actors')];
    const scs = kinds.map((k, i) => { const w = W(cam); const sc = K.scarer(w, 380 + i * 140, 1262, 0.78, k); K.pop(w, tS[i], { sfx: 'boing', gain: 0.22, pitch: 0.9 + i * 0.12 }); return sc; });
    scs[0].boo(tS[2] + 0.35, 0.4);
    // open on Friday: the haunt itself, live
    const mw = W(cam);
    const m = K.haunt(mw, 948, 1262, 0.62, { face: 'grin' });
    K.pop(mw, wd(id, 'open'), { sfx: 'boing' });
    m.wave(wd(id, 'open') + 0.25, 2);
    const fri = W(cam); K.pill(fri, 900, 900, 'OPEN FRI · 7 PM', { anchor: 'middle', fill: C.red, size: 22, padX: 14, padY: 14, font: K.F.label, weight: 800 });
    K.pop(fri, wd(id, 'Friday'), { sfx: 'blip_up' });
    K.say(cam, 760, 1086, 'boo!', wd(id, 'Friday') + 0.12, { tail: 'right', size: 30 });
    K.still(back, bw, cr, fm, mw);
  });

  // ================================================================ 02 the maze
  chap(1, (g, o, t0, t1, id) => {
    const mz = W(g);
    const maze = K.maze(mz, 300, 450, 7, 6, 64, 11);
    K.pill(mz, 300, 392, 'THE MAZE', { size: 20, padX: 12, padY: 12 });
    K.dropIn(mz, t0 + 0.04, 700, { dur: 0.26, sfx: 'drop' });
    const route = maze.route.map(([c, r]) => maze.cell(c, r));
    const seg = []; let L = 0;
    for (let i = 1; i < route.length; i++) { const d = Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]); seg.push([L, d]); L += d; }
    const trail = S('path', { d: '', fill: 'none', stroke: C.blue, 'stroke-width': 5, 'stroke-dasharray': '10 9', 'stroke-linecap': 'round' }, mz);
    const dot = G(mz, {}); S('circle', { cx: 0, cy: 0, r: 15, fill: C.blue, stroke: '#fff', 'stroke-width': 4 }, dot);
    const tA = wd(id, 'gets'), tB = wd(id, 'midnight') + 0.3;
    X.every((t) => {
      const u = clamp((t - tA) / (tB - tA)), s = u * L;
      let d = `M${route[0][0]},${route[0][1]}`, px = route[0][0], py = route[0][1];
      for (let i = 1; i < route.length; i++) {
        const [a, len] = seg[i - 1];
        if (s >= a + len) { d += ` L${route[i][0]},${route[i][1]}`; px = route[i][0]; py = route[i][1]; continue; }
        const k = (s - a) / len; px = route[i - 1][0] + (route[i][0] - route[i - 1][0]) * k; py = route[i - 1][1] + (route[i][1] - route[i - 1][1]) * k; d += ` L${px.toFixed(1)},${py.toFixed(1)}`; break;
      }
      trail.setAttribute('d', d);
      dot.setAttribute('transform', `translate(${px.toFixed(1)} ${py.toFixed(1)})`);
    });
    gsap.set(dot, { opacity: 0 }); X.tl.set(dot, { opacity: 1 }, wd(id, 'guest'));
    tick(wd(id, 'guest'), 0.25);
    const end = route[route.length - 1];
    [[end[0] + 40, end[1] - 30], [end[0] - 50, end[1] - 50]].forEach(([x, y], i) => { const q = W(mz); K.qmark(q, x, y, 52, C.red); K.pop(q, wd(id, 'lost') + i * 0.12, { gain: 0.16 }); });
    K.pulse(g, 524, 642, 260, wd(id, 'maze'), { before: mz, hold: 0.5 });
    // midnight
    const ck = W(g); const clk = K.clock(ck, 880, 560, 58, [11, 40]);
    K.pop(ck, wd(id, 'midnight') - 0.1, { sfx: 'tick' });
    X.tl.to(clk.mm, { rotation: 120, svgOrigin: '880 560', duration: 0.4, ease: 'power2.inOut' }, wd(id, 'midnight'));
    X.tl.to(clk.hh, { rotation: 10, svgOrigin: '880 560', duration: 0.4, ease: 'power2.inOut' }, wd(id, 'midnight'));
    X.sfx(wd(id, 'midnight') + 0.4, 'tock', { gain: 0.3 });
    const mn = W(g); K.moon(mn, 960, 420, 30); K.pop(mn, wd(id, 'midnight') + 0.15, { sfx: false });
    // the haunt is worried, the scarers go looking
    const mw = W(g); const m = K.haunt(mw, 900, 1236, 0.58, { face: 'worried' });
    K.slideIn(mw, t0 + 0.2, 'right', 400, { dur: 0.22, sfx: false });
    K.say(g, 620, 900, 'anyone in here?', wd(id, 'midnight') + 0.1, { tail: 'right', size: 28, out: wd(id, 'asleep') - 0.05 });
    const tSc = wf(id, 'scarers', 'scare', 'actors');
    const sc = [['ghost', 330], ['scarecrow', 470]].map(([k, x], i) => { const w = W(g); K.scarer(w, x, 1230, 0.55, k); K.slideIn(w, tSc + i * 0.08, 'left', 400, { dur: 0.18, gain: 0.2 }); return w; });
    const beam = S('path', { d: 'M520,1110 L760,1020 L760,1200 Z', fill: C.yellow, opacity: 0 }, g);
    X.tl.to(beam, { opacity: 0.55, duration: 0.08 }, wd(id, 'find'));
    // asleep in a coffin
    const tC = wd(id, 'asleep') - 0.06;
    K.flyOut(mz, tC, -700, 0, 0.18);
    X.tl.to(beam, { opacity: 0, duration: 0.08 }, tC);
    K.restage(ck, tC, { x: -560, y: 0, scale: 0.8, svgOrigin: '880 560' }, 0.25);
    const cf = W(g);
    const cof = K.coffin(cf, 580, 900, 1.05);
    K.dropIn(cf, tC + 0.06, 600, { dur: 0.24, sfx: 'thud' });
    const zz = [0, 1, 2].map((i) => { const z = W(g); K.text(z, 420 + i * 30, 840 - i * 38, 'z', { size: 34 + i * 8, weight: 800, fill: C.blue, font: K.F.label }); K.pop(z, wd(id, 'asleep') + 0.15 + i * 0.1, { sfx: i ? false : 'bubble', gain: 0.15 }); return z; });
    m.face(wd(id, 'coffin'), 'shock');
    const st = K.stamp(o, 600, 690, 'LOST GUEST', { size: 112, rot: -8 });
    K.pulse(o, 600, 700, 230, wd(id, 'coffin') + 0.05, { hold: 0.6 });
    K.slam(st, wd(id, 'coffin') + 0.05);
    K.still(cf);
  });

  // ================================================================ 03 headcount
  chap(2, (g, o, t0, t1, id) => {
    const sw = W(g); miniStack(sw, 270, 1118, 260, 2, wd(id, 'headcount'), { rh: 44, size: 20 });
    // a small barn between the two doors
    const bn = W(g); K.barn(bn, 430, 880, 140, 100, {});
    K.dropIn(bn, t0 + 0.05, 600, { dur: 0.24, sfx: 'drop' });
    // two clickers
    const ci = W(g); const cin = K.clicker(ci, 360, 640, 0.9, { label: 'ENTRANCE' });
    const co = W(g); const cout = K.clicker(co, 640, 640, 0.9, { label: 'EXIT' });
    K.pop(ci, wd(id, 'clicker'), { sfx: 'click', dur: 0.2 });
    K.pop(co, wd(id, 'clicker', 1), { sfx: 'click', dur: 0.2 });
    K.pulse(g, 360, 640, 120, wd(id, 'entrance'), { before: ci, hold: 0.4 });
    K.pulse(g, 640, 640, 120, wd(id, 'exit'), { before: co, hold: 0.4 });
    // live board
    const bd = W(g); const board = K.headBoard(bd, 680, 760, 290, 250, { in: '200', out: '200', delta: 'in − out = 0' });
    K.slideIn(bd, wd(id, 'live') - 0.08, 'right', 600, { dur: 0.22, sfx: 'pop' });
    // guests stream through: IN clicks at x 360, OUT clicks at x 640
    const tS = wd(id, 'entrance') - 0.25, per = 0.28, trav = 1.5, N = 10, x0 = 250, x1 = 668;
    const walkers = [];
    for (let i = 0; i < N; i++) { const w = G(g, { opacity: 0 }); K.walker(w, 0, 0, 1.5, ['#5b6b8c', '#b06a52', '#4f9a6c', '#7a6690'][i % 4]); walkers.push(w); }
    const crossT = (i, xx) => tS + i * per + trav * (xx - x0) / (x1 - x0);
    X.every((t) => walkers.forEach((w, i) => {
      const u = (t - tS - i * per) / trav;
      if (u < 0 || u > 1 || t > t1) { w.setAttribute('opacity', 0); return; }
      const x = x0 + (x1 - x0) * u;
      const inside = x > 445 && x < 555;
      w.setAttribute('transform', `translate(${x.toFixed(1)} ${(905 - Math.abs(Math.sin(u * 18)) * 4).toFixed(1)})`);
      w.setAttribute('opacity', inside ? 0 : 1);
    }));
    for (let i = 0; i < N; i++) {
      const a = crossT(i, 360), b = crossT(i, 640);
      cin.press(a, 201 + i, i % 2 === 0); cout.press(b, 201 + i, i % 2 === 1);
      X.tl.set(board.inN, { textContent: String(201 + i) }, a + 0.04);
      X.tl.set(board.outN, { textContent: String(201 + i) }, b + 0.04);
    }
    // the difference ticks live, then lands on zero at closing
    X.every((t) => {
      if (t < tS || t > t1) return;
      let n = 0; for (let i = 0; i < N; i++) if (t >= crossT(i, 360) + 0.04 && t < crossT(i, 640) + 0.04) n++;
      board.delta.textContent = `in − out = ${n}`;
      board.delta.setAttribute('fill', n ? '#f2c66d' : '#7fe0a0');
    });
    const tZ = wd(id, 'zero');
    const ok = W(g); K.check(ok, 950, 760, 26);
    K.pop(ok, tZ, { sfx: 'success', gain: 0.3 });
    K.pulse(g, 825, 990, 150, tZ, { before: bd, hold: 0.7, fill: C.greenL });
    const cl = W(g); K.pill(cl, 680, 1060, 'CLOSING · 11 PM', { fill: C.dark, size: 20, padX: 12, padY: 12 });
    K.pop(cl, wd(id, 'closing'), { sfx: 'tock', gain: 0.25 });
    // the haunt talks
    const mw = W(g); const m = K.haunt(mw, 640, 1236, 0.56, { face: 'happy' });
    K.slideIn(mw, wd(id, 'headcount') + 0.15, 'right', 500, { dur: 0.22, sfx: false });
    m.face(tZ, 'grin'); m.hop(tZ + 0.05);
    K.say(g, 690, 1080, "everyone's out ✓", tZ + 0.12, { tail: 'left', size: 26 });
    const mn = W(g); K.pill(mn, 360, 790, 'IN', { anchor: 'middle', fill: C.blue, size: 18, padX: 10, padY: 8 });
    const mo = W(g); K.pill(mo, 640, 790, 'OUT', { anchor: 'middle', fill: C.red, size: 18, padX: 10, padY: 8 });
    K.pop(mn, wd(id, 'entrance') + 0.15, { gain: 0.15 }); K.pop(mo, wd(id, 'exit') + 0.15, { gain: 0.15 });
    K.still(bn);
  });

  // ================================================================ 04 too early
  chap(3, (g, o, t0, t1, id) => {
    const rm = W(g);
    S('rect', { x: 298, y: 478, width: 470, height: 520, rx: 10, fill: C.shadow }, rm);
    K.rrect(rm, 290, 470, 470, 520, 10, '#efe9df', 3);
    S('rect', { x: 292, y: 912, width: 466, height: 76, fill: '#ddd3c5' }, rm);
    S('path', { d: 'M290,912 L760,912', ...K.stroke(3) }, rm);
    K.pill(rm, 290, 412, 'ROOM 1 · THE PUMPKIN', { size: 20, padX: 12, padY: 12 });
    // the doorway the queue looks through
    K.rrect(rm, 668, 640, 92, 272, 3, C.bg, 3);
    K.dropIn(rm, t0 + 0.03, 700, { dur: 0.26, sfx: 'drop' });
    // the scarer behind the curtain
    const scw = W(g); const sc = K.scarer(scw, 380, 990, 0.82, 'pumpkin');
    const cu = W(g);
    S('path', { d: 'M300,476 L420,476 L420,988 C400,980 380,996 360,988 C340,980 320,996 300,988 Z', fill: '#7d3f37', ...K.stroke(3) }, cu);
    S('path', { d: 'M330,480 L326,984 M360,480 L362,984 M392,480 L388,984', stroke: '#5f2d27', 'stroke-width': 4 }, cu);
    const tJ = wd(id, 'jumps');
    gsap.set(scw, { x: 0 });
    X.tl.to(scw, { x: 170, duration: 0.14, ease: 'power3.out' }, tJ - 0.08);
    sc.boo(tJ);
    X.tl.to(cu, { x: -20, skewX: -6, transformOrigin: '50% 0%', duration: 0.12, yoyo: true, repeat: 1 }, tJ - 0.08);
    const boo = W(g); K.booBubble(boo, 560, 600, 'BOO!', { tail: 'left' });
    K.pop(boo, tJ + 0.05, { sfx: 'whoosh', gain: 0.3 });
    // too early: the next guest is still outside
    const tE = wd(id, 'early');
    const far = W(g); K.pill(far, 380, 540, 'next guest: 40 s away', { fill: C.red, size: 20, padX: 12, padY: 12 });
    K.pop(far, tE, { sfx: 'error', gain: 0.25 });
    K.pulse(g, 520, 560, 160, tE, { hold: 0.5 });
    // the queue outside watches
    const qs = queue(g, [830, 925, 1015], 1252, 0.86, 1);
    qs.forEach((q, i) => K.slideIn(q, wd(id, 'whole') - 0.08 + i * 0.06, 'right', 400, { dur: 0.18, gain: 0.15 }));
    const kidW = W(g); const kid = K.person(kidW, 720, 1252, 0.62, { skin: C.skin2, shirt: C.orange, hairC: '#5a3b22' });
    K.slideIn(kidW, wd(id, 'queue'), 'down', 300, { dur: 0.18, gain: 0.15 });
    const eyes = [830, 925, 1015, 720].map((x, i) => { const e = W(g); K.eyesOn(e, x, i < 3 ? 1060 : 1135, 0.85); K.pop(e, wd(id, 'watches') + i * 0.06, { sfx: i ? false : 'blip', gain: 0.15 }); return e; });
    const look = S('path', { d: 'M900,1080 L600,860 M760,1130 L600,880', fill: 'none', stroke: C.blue, 'stroke-width': 4, 'stroke-dasharray': '10 9', opacity: 0 }, g);
    X.tl.to(look, { opacity: 0.8, duration: 0.1 }, wd(id, 'watches') + 0.1);
    K.march(look, 60);
    const tr = W(g); K.pill(tr, 300, 1036, 'THE TRICK: HIDE HERE', { fill: C.dark, size: 18, padX: 12, padY: 12 });
    K.pop(tr, wd(id, 'trick'), { sfx: 'blip_up', gain: 0.2 });
    // nobody screams; one kid waves
    const dots = W(g); K.bubble(dots, 860, 880, '…', { size: 44, tail: 'left' });
    K.pop(dots, wd(id, 'Nobody'), { sfx: 'bubble', gain: 0.18 });
    X.tl.to(sc.g, { rotation: 8, duration: 0.25, ease: 'power2.out' }, wd(id, 'screams'));
    K.say(g, 470, 700, 'boo…?', wd(id, 'screams') + 0.1, { tail: 'left', size: 28 });
    const arm = W(kidW);
    S('path', { d: 'M736,1190 C750,1170 760,1150 758,1130', fill: 'none', stroke: C.orange, 'stroke-width': 9, 'stroke-linecap': 'round' }, arm);
    S('circle', { cx: 758, cy: 1124, r: 8, fill: C.skin2, ...K.stroke(2) }, arm);
    gsap.set(arm, { autoAlpha: 0, svgOrigin: '736 1190' });
    X.tl.set(arm, { autoAlpha: 1 }, wd(id, 'kid'));
    X.tl.to(arm, { rotation: 22, duration: 0.12, yoyo: true, repeat: 5, ease: 'power1.inOut' }, wd(id, 'kid'));
    const hi = W(g); K.bubble(hi, 620, 1000, 'hi!', { size: 30, tail: 'right' });
    K.pop(hi, wd(id, 'waves'), { sfx: 'bubble', gain: 0.18 });
    const st = K.stamp(o, 620, 760, 'SPOILED', { size: 130, rot: -8 });
    K.pulse(o, 620, 760, 240, wd(id, 'waves') + 0.12, { hold: 0.7 });
    K.slam(st, wd(id, 'waves') + 0.12);
    K.still(rm, cu);
  });

  // ================================================================ 05 trigger pads (wide pipeline, no presenter)
  chap(4, (g, o, t0, t1, id) => {
    const sw = W(g); miniStack(sw, 50, 420, 300, 3, wd(id, 'trigger'), { rh: 40, size: 20 });
    const belt = W(g);
    const cv = K.conveyor(belt, 30, 1110, 1020, ['01 STEP', '02 DELAY', '03 BUZZ', '04 BOO']);
    K.slideIn(belt, t0 + 0.02, 'down', 700, { dur: 0.24 });
    // trigger log (the system talks in its own terminal)
    const tw = W(g);
    const term = K.terminal(tw, 560, 400, 480, 230, 'TRIGGER LOG', { ver: 'room 2', n: 4, size: 22 });
    K.slideIn(tw, wd(id, 'pads') - 0.05, 'right', 600, { dur: 0.22, sfx: 'slide' });
    const pdw = W(g); const pad = K.pad(pdw, 56, 1040, 210);
    K.pop(pdw, wd(id, 'pads'), { sfx: 'pop' });
    // the guest walks onto the pad
    const gw = W(g); const gst = K.guest(gw, 0, 0, 0.8, { skin: C.skin4, shirt: '#6a9a7a', hairC: '#b38b5d' });
    const tG = wd(id, 'guest') - 0.1, tSt = wd(id, 'steps');
    K.walk(gst, -90, 170, 1088, tG, tSt, { s: 0.8, step: 0.2 });
    pad.press(tSt, 0.8);
    X.sfx(tSt, 'click', { gain: 0.45 });
    cv.light(tSt, 0);
    K.pulse(g, 170, 1040, 120, tSt, { hold: 0.5 });
    term.typeLine(0, '19:02:11  PAD 2   stepped', tSt + 0.05, 70);
    // timer
    const tm = W(g);
    K.card(tm, 290, 690, 250, 230, { r: 16 });
    K.mono(tm, 312, 728, 'DELAY', { size: 22, weight: 700, fill: '#8d8a84' });
    S('circle', { cx: 415, cy: 820, r: 62, fill: 'none', stroke: '#e8e5df', 'stroke-width': 13 }, tm);
    const ringFg = S('circle', { cx: 415, cy: 820, r: 62, fill: 'none', stroke: C.red, 'stroke-width': 13, 'stroke-dasharray': `${2 * Math.PI * 62}`, 'stroke-dashoffset': 0, transform: 'rotate(-90 415 820)' }, tm);
    const tv = K.text(tm, 415, 838, '2.0', { size: 50, weight: 900, font: 'Oswald, sans-serif', anchor: 'middle' });
    const tD = wd(id, 'two');
    K.pop(tm, tD - 0.1, { sfx: 'pop' });
    X.tl.fromTo(ringFg, { attr: { 'stroke-dashoffset': 0 } }, { attr: { 'stroke-dashoffset': 2 * Math.PI * 62 }, duration: 0.95, ease: 'none', immediateRender: false }, tD + 0.05);
    K.flicker(tv, tD + 0.05, tD + 1.0, (k) => Math.max(0, 2 - k * 0.2).toFixed(1));
    X.tl.set(tv, { textContent: 'GO' }, tD + 1.0);
    X.sfx(tD + 0.05, 'tick', { gain: 0.25 }); X.sfx(tD + 0.5, 'tock', { gain: 0.25 });
    cv.light(wd(id, 'delay'), 0, false); cv.light(wd(id, 'delay'), 1);
    term.typeLine(1, '19:02:11  DELAY   2.0 s', wd(id, 'delay'), 70, false);
    // wires
    const wire = S('path', { d: 'M200,1040 C220,980 250,940 290,900 M540,800 C590,810 620,850 630,880', fill: 'none', stroke: C.dark2, 'stroke-width': 6, 'stroke-dasharray': '12 9' }, g);
    gsap.set(wire, { opacity: 0 }); X.tl.to(wire, { opacity: 1, duration: 0.1 }, wd(id, 'pad'));
    K.march(wire, 70);
    // earpiece
    const ew = W(g); const ear = K.earpiece(ew, 680, 960, 1.55);
    const tBz = wd(id, 'buzz');
    K.pop(ew, tBz - 0.12, { sfx: false });
    ear.buzz(tBz);
    cv.light(tBz, 1, false); cv.light(tBz, 2);
    K.pulse(g, 680, 920, 140, wf(id, "actor's", 'earpiece'), { before: ew, hold: 0.5 });
    term.typeLine(2, '19:02:13  EAR 2   buzz', tBz, 70, false);
    K.say(g, 720, 700, 'go!', wf(id, 'earpiece') + 0.05, { tail: 'left', size: 32 });
    // the scare: the actor waits in a doorway at the last stage
    const dr = W(g);
    K.rrect(dr, 842, 806, 166, 298, 4, '#26272d', 3);
    S('rect', { x: 834, y: 798, width: 182, height: 306, fill: 'none', stroke: C.trim, 'stroke-width': 6 }, dr);
    K.pill(dr, 925, 744, 'ROOM 2', { anchor: 'middle', size: 20, padX: 12, padY: 12 });
    K.dropIn(dr, t0 + 0.25, 600, { dur: 0.22, sfx: 'drop' });
    const scw = W(g); const sc = K.scarer(scw, 925, 1104, 1.0, 'ghost');
    K.slideIn(scw, wd(id, 'then'), 'right', 300, { dur: 0.16, sfx: 'swoosh' });
    const tBoo = wd(id, 'boo');
    sc.boo(tBoo);
    cv.light(tBoo, 2, false); cv.light(tBoo, 3);
    term.typeLine(3, '19:02:13  ROOM 2  BOO ✓', tBoo, 70, false);
    const bb = W(g); K.booBubble(bb, 760, 690, 'BOO!', { tail: 'right', size: 60 });
    K.pop(bb, tBoo, { sfx: 'whoosh', gain: 0.35 });
    X.tl.to(gst.inner, { y: -44, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.out' }, tBoo + 0.05);
    const ah = W(g); K.bubble(ah, 40, 820, 'AAAH!', { size: 38, red: true, weight: 900, tail: 'right' });
    K.pop(ah, tBoo + 0.12, { gain: 0.2 });
    K.pulse(g, 910, 960, 180, tBoo, { hold: 0.6 });
    // camera follows the signal along the stages
    K.camTo(g, tSt - 0.15, 1.08, 170, 920, 0.4);
    K.camTo(g, tD - 0.12, 1.08, 415, 920, 0.4);
    K.camTo(g, tBz - 0.12, 1.08, 680, 920, 0.4);
    K.camTo(g, tBoo - 0.25, 1.0, 540, 960, 0.35);
    K.still(belt, pdw, dr);
  });

  // ================================================================ 06 screaming
  chap(5, (g, o, t0, t1, id) => {
    const wl = W(g);
    S('rect', { x: 708, y: 540, width: 46, height: 470, fill: C.shadow }, wl);
    K.rrect(wl, 700, 530, 46, 470, 4, '#e8dccd', 3);
    for (let y = 564; y < 1000; y += 34) S('path', { d: `M700,${y} L746,${y}`, stroke: '#cdbca8', 'stroke-width': 3 }, wl);
    S('path', { d: 'M280,1000 L1040,1000', ...K.stroke(3) }, wl);
    K.slideIn(wl, t0 + 0.03, 'up', 500, { dur: 0.2, sfx: 'slide' });
    const pdw = W(g); const pad = K.pad(pdw, 300, 958, 170);
    K.pop(pdw, t0 + 0.1, { sfx: false });
    const gw = W(g); const gst = K.guest(gw, 380, 998, 0.95, { skin: C.skin3, shirt: '#c9a067', cap: C.navy });
    K.slideIn(gw, wd(id, 'every') - 0.05, 'left', 400, { dur: 0.18 });
    pad.press(wd(id, 'scare') - 0.15, 0.6);
    const scw = W(g); const sc = K.scarer(scw, 590, 1000, 0.85, 'scarecrow');
    K.slideIn(scw, wd(id, 'scare') - 0.1, 'right', 200, { dur: 0.14, sfx: false });
    sc.boo(wd(id, 'scare'));
    const bb = W(g); K.booBubble(bb, 560, 640, 'BOO!', { tail: 'left', size: 46 });
    K.pop(bb, wd(id, 'scare'), { sfx: 'whoosh', gain: 0.3 });
    const tL = wd(id, 'lands');
    X.tl.to(gst.inner, { y: -46, duration: 0.11, yoyo: true, repeat: 1, ease: 'power2.out' }, tL);
    const ah = W(g); K.bubble(ah, 280, 690, 'AAAAH!', { size: 40, red: true, weight: 900, tail: 'right' });
    K.pop(ah, tL + 0.05, { gain: 0.2 });
    // the right person
    const tR = wd(id, 'right');
    const tg = W(g);
    S('circle', { cx: 380, cy: 900, r: 120, fill: 'none', stroke: C.red, 'stroke-width': 5 }, tg);
    S('path', { d: 'M380,760 L380,800 M380,1000 L380,1040 M240,900 L280,900 M480,900 L520,900', stroke: C.red, 'stroke-width': 5, 'stroke-linecap': 'round' }, tg);
    K.pop(tg, tR, { sfx: 'blip_up', gain: 0.25 });
    const rp = W(g); K.pill(rp, 300, 1040, 'RIGHT PERSON ✓', { fill: C.green, size: 18, padX: 10, padY: 10, font: K.F.label, weight: 800 });
    K.pop(rp, wd(id, 'person'), { sfx: 'ding', gain: 0.2 });
    // the queue outside only hears it
    const qs = queue(g, [820, 915, 1005], 1252, 0.86, 3);
    qs.forEach((q, i) => K.slideIn(q, wd(id, 'queue') - 0.06 + i * 0.06, 'down', 400, { dur: 0.18, gain: 0.14 }));
    const tH = wd(id, 'hears');
    const waves = [0, 1, 2].map((i) => { const w = S('path', { d: 'M0,-60 A60,60 0 0,1 0,60', fill: 'none', stroke: C.red, 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0 }, g); return w; });
    X.every((t) => waves.forEach((w, i) => {
      const u = (t - tH - i * 0.15) / 0.8;
      if (u < 0 || u > 1 || t > t1) { w.setAttribute('opacity', 0); return; }
      w.setAttribute('transform', `translate(${(560 + u * 360).toFixed(1)} 900) scale(${(0.6 + u * 0.8).toFixed(2)})`);
      w.setAttribute('opacity', (1 - u).toFixed(2));
    }));
    X.sfx(tH, 'whoosh', { gain: 0.2 });
    [[780, 960, '!!'], [880, 940, 'ooh…'], [990, 960, 'me next!']].forEach(([x, y, s], i) => { const b = W(g); K.bubble(b, x - 40, y - 60, s, { size: 24, tail: 'left' }); K.pop(b, wd(id, 'screaming') + i * 0.1, { gain: 0.15, pitch: 1 + i * 0.1 }); });
    // tickets sell
    const tk = W(g);
    K.card(tk, 760, 420, 230, 160, { r: 16 });
    K.mono(tk, 780, 456, '// tickets sold', { size: 17, weight: 600, fill: '#8d8a84' });
    const n = K.text(tk, 875, 540, '120', { size: 70, weight: 900, font: 'Oswald, sans-serif', anchor: 'middle' });
    K.pop(tk, wd(id, 'outside'), { gain: 0.2 });
    X.countUp(n, 120, 164, wd(id, 'screaming'), 0.7);
    X.sfx(wd(id, 'screaming'), 'riser', { gain: 0.2, dur: 0.6 });
    const ga = W(g); const gau = K.gauge(ga, 470, 560, 54, { title: 'scream meter', v0: 10, text: '3 / 10' });
    K.slideIn(ga, wd(id, 'Now') + 0.05, 'left', 300, { dur: 0.2, gain: 0.15 });
    X.tl.to(gau.needle, { rotation: 170, duration: 0.4, ease: 'back.out(2)' }, tL);
    X.tl.set(gau.val, { textContent: '10 / 10', attr: { fill: C.green } }, tL + 0.1);
    K.still(wl, pdw);
  });

  // ================================================================ 07 opening night
  chap(6, (g, o, t0, t1, id) => {
    const rm = W(g);
    S('rect', { x: 298, y: 478, width: 470, height: 470, rx: 10, fill: C.shadow }, rm);
    K.rrect(rm, 290, 470, 470, 470, 10, '#efe9df', 3);
    S('path', { d: 'M290,540 L760,540', ...K.stroke(2.5) }, rm);
    K.pill(rm, 290, 412, 'ROOM 2', { size: 20, padX: 12, padY: 12 });
    K.dropIn(rm, t0 + 0.03, 700, { dur: 0.24, sfx: 'drop' });
    const dw = W(g); const det = K.detector(dw, 525, 566, 1.0);
    K.dropIn(dw, t0 + 0.12, 300, { dur: 0.2, sfx: 'click' });
    const on = W(g); K.pill(on, 800, 470, 'OPENING NIGHT', { fill: C.red, size: 20, padX: 12, padY: 12, font: K.F.label, weight: 800 });
    K.pop(on, wd(id, 'opening'), { sfx: 'blip_up' });
    const fw = W(g); const fm = K.fogMachine(fw, 360, 930, 0.72);
    K.pop(fw, wd(id, 'night'), { sfx: 'pop' });
    const clip = S('clipPath', { id: 'room2clip' }, X.defs); S('rect', { x: 292, y: 542, width: 466, height: 396 }, clip);
    const fogG = G(g, { 'clip-path': 'url(#room2clip)' });
    const tF = wd(id, 'fog');
    K.fog(fogG, 440, 900, tF, t1, { dx: 300, dy: 340, n: 18, r: 70, seed: 9, gap: 0.06, grow: 0.5 });
    X.sfx(tF, 'woosh_low', { gain: 0.35, dur: 1.0 });
    // alarm
    const tA = wd(id, 'smoke');
    X.tl.set(det.led, { attr: { fill: '#ff4b33' } }, tA);
    K.shake(dw, tA, 6, 0.5);
    const beep = W(g); K.bubble(beep, 560, 600, 'BEEP! BEEP!', { red: true, size: 30, weight: 900, tail: 'left' });
    K.pop(beep, tA + 0.05, { sfx: 'beep', gain: 0.3 });
    [0.25, 0.5, 0.75].forEach((dt) => X.sfx(tA + 0.05 + dt, 'beep', { gain: 0.22 }));
    K.pulse(g, 525, 560, 120, tA, { hold: 0.8 });
    const blw = W(g); const bel = K.bell(blw, 860, 640, 1.0);
    K.pop(blw, wd(id, 'alarm'), { sfx: false });
    X.tl.to(blw, { rotation: 14, transformOrigin: '50% 10%', duration: 0.06, repeat: 9, yoyo: true, ease: 'none' }, wd(id, 'alarm'));
    // three fire trucks join the queue
    const qs = queue(g, [330, 420], 1252, 0.8, 2);
    qs.forEach((q, i) => K.slideIn(q, wd(id, 'three') - 0.15 + i * 0.05, 'left', 300, { dur: 0.16, gain: 0.12 }));
    const trucks = [560, 760, 960].map((x, i) => { const w = W(g); K.firetruck(w, x, 1248, 0.62); gsap.set(w, { x: 700, autoAlpha: 0 }); X.tl.set(w, { autoAlpha: 1 }, wd(id, 'three') + i * 0.18); X.tl.to(w, { x: 0, duration: 0.3, ease: 'power3.out' }, wd(id, 'three') + i * 0.18); return w; });
    X.sfx(wd(id, 'three'), 'whoosh', { gain: 0.3 });
    X.sfx(wd(id, 'trucks'), 'horn', { gain: 0.25, dur: 0.35 });
    const ql = W(g); K.pill(ql, 300, 1074, 'QUEUE →', { fill: C.dark, size: 18, padX: 10, padY: 10 });
    K.pop(ql, wd(id, 'join'), { sfx: 'blip', gain: 0.15 });
    const mw = W(g); const m = K.haunt(mw, 920, 920, 0.58, { face: 'worried' });
    K.slideIn(mw, t0 + 0.22, 'right', 400, { dur: 0.2, sfx: false });
    m.face(tA, 'shock'); K.jitter(m.jit, tA, t1, 6, 4);
    K.say(g, 790, 700, 'is that real?', wd(id, 'fire') + 0.05, { tail: 'right', size: 26 });
    const st = K.stamp(o, 600, 820, 'FALSE ALARM', { size: 112, rot: -8 });
    K.pulse(o, 600, 820, 240, wd(id, 'queue') + 0.05, { hold: 0.6 });
    K.slam(st, wd(id, 'queue') + 0.05);
    K.still(rm, fw, dw);
  });

  // ================================================================ 08 haze
  chap(7, (g, o, t0, t1, id) => {
    const sw = W(g); miniStack(sw, 270, 1080, 270, 4, wd(id, 'haze'), { rh: 34, size: 16 });
    const hw = W(g); const hm = K.fogMachine(hw, 350, 700, 0.8, { label: 'HAZE' });
    K.pop(hw, wd(id, 'haze') - 0.05, { sfx: 'pop' });
    K.fog(g, 432, 660, wd(id, 'machine'), t1, { dx: 220, dy: 30, n: 8, r: 26, op: 0.55, seed: 2, gap: 0.12, grow: 0.9 });
    const fp = W(g); const plan = K.floorplan(fp, 600, 420, 410, 300, { title: 'DETECTOR MAP' });
    K.slideIn(fp, wd(id, 'map') - 0.1, 'right', 600, { dur: 0.2, sfx: 'paper' });
    plan.dots.forEach((d, i) => { X.tl.set(d, { autoAlpha: 1 }, wd(id, 'every') + i * 0.1); tick(wd(id, 'every') + i * 0.1, 0.15); });
    K.pulse(g, 805, 590, 170, wd(id, 'detector'), { before: fp, hold: 0.6 });
    // sign-off sheet
    const dw = W(g);
    K.doc(dw, 600, 770, 250, 300, { title: 'SIGN-OFF', tsize: 26, lines: 0 });
    const rows = ['fog plan', 'detectors', 'exits'].map((s, i) => { const r = W(dw); S('rect', { x: 622, y: 836 + i * 50, width: 26, height: 26, rx: 4, fill: '#fff', ...K.stroke(2.5) }, r); K.text(r, 662, 857 + i * 50, s, { size: 24, weight: 600 }); return r; });
    K.dropIn(dw, wd(id, 'sign') - 0.12, 700, { dur: 0.24, sfx: 'paper' });
    rows.forEach((r, i) => { const c = W(dw); S('path', { d: `M626,${849 + i * 50} l8,8 l14,-16`, fill: 'none', stroke: C.green, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, c); K.pop(c, wd(id, 'with') + i * 0.12, { sfx: i ? false : 'blip_up', gain: 0.15 }); });
    const sig = S('path', { d: 'M626,1030 c10,-20 20,-20 24,0 c4,16 14,-24 24,-4 c8,14 16,-10 30,-4 l40,0', fill: 'none', stroke: C.blue, 'stroke-width': 4, 'stroke-linecap': 'round' }, dw);
    X.drawOn(sig, wd(id, 'officer'), 0.35);
    X.sfx(wd(id, 'officer'), 'scribble', { gain: 0.25, dur: 0.35 });
    // the fire officer
    const ofw = W(g); K.person(ofw, 930, 1252, 1.0, { skin: C.skin3, shirt: '#2f3a52', cap: C.red });
    K.slideIn(ofw, wd(id, 'fire') - 0.08, 'down', 500, { dur: 0.2, gain: 0.2 });
    // before the doors open
    const ck = W(g); K.pill(ck, 330, 1000, '6:59 PM', { fill: C.dark, size: 22, padX: 12, padY: 12 });
    K.pop(ck, wd(id, 'before'), { sfx: 'tick', gain: 0.25 });
    const dr = W(g); K.pill(dr, 900, 1000, 'DOORS 7:00 ✓', { anchor: 'middle', fill: C.green, size: 22, padX: 14, padY: 12, font: K.F.label, weight: 800 });
    K.pop(dr, wd(id, 'open'), { sfx: 'success', gain: 0.25 });
    K.say(g, 820, 880, 'signed ✓', wd(id, 'doors'), { tail: 'right', size: 26 });
    K.still(hw);
  });

  // ================================================================ 09 room four (the paper starts to dim; drone creeps in)
  chap(8, (g, o, t0, t1, id) => {
    const ww = W(g);
    const wall = K.wall(ww, 290, 500, 730, 490, { dx: 450, dw: 150, seam: '#e8dccd' });
    K.dropIn(ww, t0 + 0.03, 700, { dur: 0.26, sfx: 'drop' });
    const rp = W(g); K.pill(rp, 290, 440, 'ROOM 4', { size: 20, padX: 12, padY: 12 });
    K.pop(rp, wd(id, 'room'), { sfx: 'blip', gain: 0.2 });
    const gw = W(g); const gst = K.guest(gw, 430, 990, 1.0, { skin: C.skin1, shirt: '#7f6f96', hairC: '#2a1d19', frown: true });
    K.slideIn(gw, wd(id, 'guest') - 0.06, 'left', 400, { dur: 0.18 });
    const tP = wd(id, 'panics');
    K.jitter(gst.inner, tP, t1, 6, 3);
    const ex = W(g); K.excl(ex, 480, 760, 24); K.pop(ex, tP, { sfx: 'error', gain: 0.25 });
    const sweat = W(g); S('path', { d: 'M470,800 q8,12 0,16 q-8,-4 0,-16 Z', fill: '#8fd3f0', ...K.stroke(2) }, sweat); K.pop(sweat, tP + 0.15, { sfx: false });
    // can't find the way out: every wall says no
    [[340, 640], [640, 600], [930, 660]].forEach(([x, y], i) => { const c = W(g); K.cross(c, x, y, 24); K.pop(c, wd(id, 'find') - 0.1 + i * 0.14, { sfx: 'error', gain: 0.18, pitch: 1 + i * 0.1 }); });
    const arr = S('path', { d: 'M450,840 C520,760 600,760 640,800 M450,840 C380,760 340,700 340,670', fill: 'none', stroke: C.blue, 'stroke-width': 5, 'stroke-dasharray': '10 9', opacity: 0 }, g);
    X.tl.to(arr, { opacity: 1, duration: 0.1 }, wd(id, "can't")); K.march(arr, 70);
    // the exit is painted to look like a wall
    const tW = wf(id, 'painted');
    const rl = W(g);
    K.rrect(rl, -40, -26, 80, 52, 10, C.red, 3); S('path', { d: 'M0,26 L0,80', ...K.stroke(6) }, rl);
    S('rect', { x: -36, y: -22, width: 72, height: 14, fill: '#e8dccd' }, rl);
    gsap.set(rl, { x: 815, y: 640, autoAlpha: 0 });
    X.tl.set(rl, { autoAlpha: 1 }, tW - 0.1);
    X.tl.to(rl, { y: 940, duration: 0.5, ease: 'power1.inOut' }, tW - 0.1);
    X.tl.to(rl, { autoAlpha: 0, duration: 0.1 }, tW + 0.45);
    X.sfx(tW - 0.1, 'scribble', { gain: 0.25, dur: 0.5 });
    const tLk = wd(id, 'look');
    X.tl.set(wall.seam, { attr: { stroke: C.red, 'stroke-width': 5 } }, tLk);
    K.pulse(ww, 815, 830, 160, tLk, { hold: 0.9 });
    const lab = W(g); K.pill(lab, 815, 600, 'EXIT (painted over)', { anchor: 'middle', fill: C.red, size: 18, padX: 10, padY: 10 });
    K.pop(lab, tLk + 0.1, { sfx: 'blip_up', gain: 0.2 });
    const mw = W(g); const m = K.haunt(mw, 930, 1236, 0.56, { face: 'worried' });
    K.slideIn(mw, t0 + 0.25, 'right', 400, { dur: 0.2, sfx: false });
    K.say(g, 700, 1060, "it's right there!", wd(id, 'way', 1) + 0.05, { tail: 'right', size: 26 });
    const st = K.stamp(o, 600, 760, 'PANIC', { size: 150, rot: -8 });
    K.pulse(o, 600, 760, 220, wd(id, 'wall') + 0.08, { hold: 0.7 });
    K.slam(st, wd(id, 'wall') + 0.08);
    K.still(ww);
  });

  // ================================================================ 10 safe word
  chap(9, (g, o, t0, t1, id) => {
    const sw = W(g); miniStack(sw, 270, 1068, 260, 5, wd(id, 'safe'), { rh: 30, size: 15 });
    const cd = W(g);
    K.card(cd, 290, 420, 300, 150, { r: 16 });
    K.mono(cd, 312, 456, '// safe word', { size: 18, weight: 600, fill: '#8d8a84' });
    K.text(cd, 440, 532, 'PUMPKIN', { size: 56, weight: 900, font: 'Oswald, sans-serif', anchor: 'middle', fill: C.red });
    K.pop(cd, wd(id, 'word'), { sfx: 'stamp', gain: 0.3 });
    const wl = W(g); const wall = K.wall(wl, 770, 600, 230, 390, { dx: 56, dw: 120 });
    K.slideIn(wl, t0 + 0.05, 'right', 500, { dur: 0.2, sfx: 'slide' });
    const gw = W(g); const gst = K.guest(gw, 360, 990, 0.9, { skin: C.skin1, shirt: '#7f6f96', hairC: '#2a1d19', frown: true });
    K.slideIn(gw, t0 + 0.12, 'left', 400, { dur: 0.18, gain: 0.15 });
    const say = W(g); K.bubble(say, 300, 680, 'PUMPKIN!', { red: true, size: 34, weight: 900, tail: 'left' });
    K.pop(say, wd(id, 'Say'), { gain: 0.25 });
    // red light
    const bw = W(g); const bc = K.beacon(bw, 640, 640, 1.0);
    K.pop(bw, wd(id, 'red') - 0.08, { sfx: 'pop' });
    bc.on(wd(id, 'light'), t1);
    X.sfx(wd(id, 'light'), 'beep', { gain: 0.25, pitch: 0.6, dur: 0.4 });
    K.pulse(g, 640, 600, 140, wd(id, 'light'), { before: bw, hold: 0.8 });
    // every scarer freezes
    const scs = ['ghost', 'scarecrow', 'pumpkin'].map((k, i) => { const w = W(g); const sc = K.scarer(w, 520 + i * 105, 990, 0.52, k); K.pop(w, wd(id, 'Say') + 0.1 + i * 0.08, { sfx: i ? false : 'boing', gain: 0.18 }); return [w, sc]; });
    const tFz = wd(id, 'freezes');
    scs.forEach(([w, sc], i) => { K.jitter(sc.g, wd(id, 'red'), tFz, 5, 3); const pz = W(g); K.rrect(pz, 520 + i * 105 - 20, 800, 40, 40, 20, C.blue, 2.5); S('path', { d: `M${520 + i * 105 - 6},${810} l0,20 M${520 + i * 105 + 6},810 l0,20`, stroke: '#fff', 'stroke-width': 5, 'stroke-linecap': 'round' }, pz); K.pop(pz, tFz + i * 0.07, { sfx: i ? false : 'blip_down', gain: 0.2 }); X.tl.to(w, { opacity: 0.55, duration: 0.15 }, tFz + i * 0.07); });
    // the hidden door opens
    const tO = wd(id, 'opens');
    wall.open(tO - 0.1);
    K.pulse(wl, 886, 860, 130, tO, { hold: 0.8, fill: C.greenL });
    const path = S('path', { d: 'M420,1000 C520,1060 740,1060 866,990', fill: 'none', stroke: C.green, 'stroke-width': 6, 'stroke-dasharray': '12 9', opacity: 0 }, g);
    X.tl.to(path, { opacity: 1, duration: 0.1 }, wd(id, 'wall')); K.march(path, 70);
    K.say(g, 790, 470, 'this way →', wd(id, 'wall'), { tail: 'right', size: 26 });
    X.tl.set(gst.inner.mouth, { attr: { d: 'M-6,-164 q6,5 12,0' } }, tO);
    K.still(wl);
  });

  // ================================================================ 11 halloween (wide, crowd blow-up)
  chap(10, (g, o, t0, t1, id) => {
    gsap.set(g, { scale: 1.0, svgOrigin: '540 1260' });
    K.camTo(g, wd(id, 'people') - 0.2, 1.1, 540, 1260, 1.2, 'power2.inOut');
    const cal = W(g); K.calendar(cal, 60, 400, 'OCTOBER', '31', { w: 230, h: 220, bigSize: 96, sub: 'halloween' });
    K.pop(cal, t0 + 0.03, { sfx: 'paper', dur: 0.25 });
    const so = W(g); K.pill(so, 175, 650, 'SOLD OUT', { anchor: 'middle', fill: C.red, size: 26, padX: 16, padY: 14, font: K.F.label, weight: 900 });
    K.pop(so, wd(id, 'sells'), { sfx: 'stamp', gain: 0.35 });
    const ckw = W(g); K.clock(ckw, 400, 500, 56, [7, 0]);
    K.pop(ckw, wd(id, 'seven') - 0.1, { sfx: 'pop' });
    K.shake(ckw, wd(id, 'seven'), 6, 0.5);
    X.sfx(wd(id, 'seven'), 'beep', { gain: 0.25 });
    const ctr = W(g);
    K.card(ctr, 770, 380, 220, 170, { r: 16 });
    K.mono(ctr, 790, 418, '// people here', { size: 17, weight: 600, fill: '#8d8a84' });
    const n = K.text(ctr, 880, 506, '0', { size: 76, weight: 900, font: 'Oswald, sans-serif', anchor: 'middle' });
    K.pop(ctr, wd(id, 'Halloween'), { gain: 0.2 });
    X.countUp(n, 0, 2000, wd(id, 'Two') - 0.1, 0.7);
    X.sfx(wd(id, 'Two') - 0.1, 'riser', { gain: 0.3, dur: 0.7 });
    const pk = W(g); K.rrect(pk, 620, 420, 70, 70, 12, C.blue, 3); K.text(pk, 655, 476, 'P', { size: 52, weight: 900, fill: '#fff', anchor: 'middle' });
    K.pop(pk, wd(id, 'parking'), { sfx: 'pop' });
    // the barn + the haunt in the middle
    const bn = W(g); K.barn(bn, 360, 900, 260, 170, { sign: 'HOLLOW PINES' });
    K.pop(bn, wd(id, 'Halloween') + 0.15, { gain: 0.15 });
    const mw = W(g); const m = K.haunt(mw, 780, 905, 0.66, { face: 'grin', hat: true });
    K.pop(mw, wd(id, 'Halloween') + 0.25, { sfx: false });
    // crowd rises (the figure stands in the back row)
    const clip = S('clipPath', { id: 'crowdclip' }, X.defs); S('rect', { x: -200, y: 0, width: 1480, height: 1265 }, clip);
    const cwc = G(g, { 'clip-path': 'url(#crowdclip)' });
    const cw = W(cwc);
    const crowd = K.crowd(cw, -40, 1120, 800, 8, 0.42, 31);
    const fig = W(cw); K.figure(fig, 862, 878, 0.6, { fill: '#cdc8bf', line: '#b4aea4', sw: 2.5, shadow: false });
    crowd.insertBefore(fig, crowd.children[20] || null); // behind row 1, in front of row 0
    gsap.set(cw, { y: 560, autoAlpha: 0 });
    X.tl.set(cw, { autoAlpha: 1 }, wd(id, 'people') - 0.15);
    X.tl.to(cw, { y: 0, duration: 0.9, ease: 'power2.out' }, wd(id, 'people') - 0.15);
    X.sfx(wd(id, 'people') - 0.15, 'whoosh', { gain: 0.35, dur: 0.8 });
    const qs = [[60, 780, 'how long?'], [720, 800, 'is it scary?'], [250, 900, 'my feet!'], [820, 930, 'boo!']];
    qs.forEach(([x, y, s], i) => { const b = W(o); K.bubble(b, x, y, s, { size: 26 }); K.pop(b, wd(id, 'show') + i * 0.14, { gain: 0.18, pitch: 0.9 + i * 0.1 }); });
    // the queue wraps the parking lot
    const qp = S('path', { d: 'M120,760 C300,700 520,720 640,640 C700,600 760,560 720,500 C690,450 610,470 600,520', fill: 'none', stroke: C.red, 'stroke-width': 7, 'stroke-dasharray': '12 9', opacity: 0 }, o);
    X.tl.to(qp, { opacity: 0.9, duration: 0.1 }, wd(id, 'wraps')); K.march(qp, 80);
    X.sfx(wd(id, 'wraps'), 'swoosh', { gain: 0.2 });
    // the maze jams solid
    const tJ = wd(id, 'jams');
    m.face(wd(id, 'maze'), 'shock');
    m.face(tJ, 'dizzy');
    K.jitter(m.jit, wd(id, 'maze'), t1, 9, 6);
    X.tl.to(g, { scale: 1.18, duration: 0.12, ease: 'power3.out', svgOrigin: '540 1260' }, tJ);
    const blob = S('path', { d: 'M520,330 C780,250 1140,380 1120,700 C1100,1000 780,1090 480,1020 C120,940 40,660 220,480 C300,400 400,350 520,330 Z', fill: C.salmon, opacity: 0 }, g);
    g.insertBefore(blob, bn);
    [cal, ckw, ctr, so, pk, bn].forEach((e, i) => K.flyOut(e, tJ - 0.02 + i * 0.02, (i % 2 ? 1 : -1) * 500, -300, 0.2));
    X.tl.to(qp, { opacity: 0, duration: 0.08 }, tJ);
    X.tl.to(blob, { opacity: 0.92, duration: 0.08 }, tJ);
    const big = W(o);
    K.text(big, 660, 780, '2,000', { size: 250, weight: 900, font: 'Oswald, sans-serif', fill: C.red, anchor: 'middle', attrs: { stroke: C.ink, 'stroke-width': 4, 'paint-order': 'stroke' } });
    K.pill(big, 660, 820, 'IN ONE MAZE', { anchor: 'middle', fill: C.dark, size: 26, padX: 16, padY: 14 });
    K.slam(big, tJ, { sfx: 'impact', gain: 0.6 });
    K.papers(o, 600, 760, 22, tJ, { dist: 560, dur: 1.2, seed: 8 });
    K.still(bn, mw);
    X.tl.to(cw, { y: 520, duration: 0.24, ease: 'power2.in' }, t1 - 0.26);
    X.tl.to(blob, { opacity: 0, duration: 0.22, ease: 'none' }, t1 - 0.24);
    X.tl.to(big, { opacity: 0, scale: 0.8, transformOrigin: '50% 50%', duration: 0.2 }, t1 - 0.22);
  });

  // ================================================================ 12 timed tickets
  chap(11, (g, o, t0, t1, id) => {
    K.papers(g, 540, 600, 10, t0 - 0.4, { dist: 600, dur: 1.2, seed: 12 });
    const sw = W(g); miniStack(sw, 270, 1040, 260, 6, wd(id, 'timed'), { rh: 28, size: 14 });
    const tix = ['7:00:00', '7:01:30', '7:03:00'].map((s, i) => { const w = W(g); K.ticket(w, 600 + i * 40, 420 + i * 78, s, { w: 250, sub: 'group of 6', stub: i === 0 ? C.red : C.blue }); K.slideIn(w, wd(id, 'tickets') - 0.1 + i * 0.09, 'right', 600, { dur: 0.2, gain: 0.18 }); return w; });
    // a group of six
    const gp = W(g);
    K.card(gp, 290, 420, 230, 170, { r: 16 });
    K.mono(gp, 310, 454, '// one group', { size: 17, weight: 600, fill: '#8d8a84' });
    const heads = [];
    for (let i = 0; i < 6; i++) { const h = W(gp); S('circle', { cx: 340 + (i % 3) * 64, cy: 500 + Math.floor(i / 3) * 52, r: 20, fill: [C.skin1, C.skin2, C.skin3, C.skin4, '#a8714e', C.skin2][i], ...K.stroke(2.5) }, h); heads.push(h); }
    K.pop(gp, wd(id, 'Groups') - 0.05, { gain: 0.2 });
    K.cascade(heads, wd(id, 'Groups') + 0.08, 0.05);
    const x6 = W(g); K.pill(x6, 490, 400, '× 6', { fill: C.red, size: 24, padX: 12, padY: 10, font: K.F.label, weight: 900 });
    K.pop(x6, wd(id, 'six'), { sfx: 'blip_up' });
    // every ninety seconds
    const tm = W(g);
    K.card(tm, 300, 640, 210, 200, { r: 16 });
    S('circle', { cx: 405, cy: 745, r: 58, fill: 'none', stroke: '#e8e5df', 'stroke-width': 12 }, tm);
    const ring = S('circle', { cx: 405, cy: 745, r: 58, fill: 'none', stroke: C.blue, 'stroke-width': 12, 'stroke-dasharray': `${2 * Math.PI * 58}`, 'stroke-dashoffset': 0, transform: 'rotate(-90 405 745)' }, tm);
    const sec = K.text(tm, 405, 762, '90', { size: 48, weight: 900, font: 'Oswald, sans-serif', anchor: 'middle' });
    const tN = wd(id, 'ninety');
    K.pop(tm, wd(id, 'every') - 0.05, { gain: 0.2 });
    X.every((t) => { if (t < tN || t > t1) return; const u = ((t - tN) / 1.1) % 1; ring.setAttribute('stroke-dashoffset', (u * 2 * Math.PI * 58).toFixed(1)); sec.textContent = String(Math.round(90 * (1 - u))); });
    X.sfx(tN, 'tick', { gain: 0.25 }); X.sfx(tN + 1.1, 'tick', { gain: 0.25 }); X.sfx(tN + 2.2, 'tick', { gain: 0.2 });
    // groups flow through, clickers at both doors keep score
    const ci = W(g); const cin = K.clicker(ci, 640, 840, 0.7, { label: 'IN' });
    const co = W(g); const cout = K.clicker(co, 900, 840, 0.7, { label: 'OUT' });
    K.pop(ci, wd(id, 'clickers') - 0.05, { sfx: 'click', dur: 0.2 });
    K.pop(co, wd(id, 'clickers') + 0.08, { sfx: false, dur: 0.2 });
    [wd(id, 'keep'), wd(id, 'score'), wd(id, 'both')].forEach((t, i) => { cin.press(t, 6 * (i + 1), true); cout.press(t + 0.12, 6 * (i + 1), false); });
    const same = W(g); K.pill(same, 770, 960, 'IN = OUT ✓', { anchor: 'middle', fill: C.green, size: 22, padX: 14, padY: 12, font: K.F.label, weight: 800 });
    K.pop(same, wd(id, 'doors'), { sfx: 'success', gain: 0.25 });
    K.pulse(g, 770, 860, 170, wd(id, 'doors'), { before: ci, hold: 0.6, fill: C.greenL });
    K.stream(g, 5, (it, i) => { for (let k = 0; k < 6; k++) S('circle', { cx: (k % 3) * 22 - 22, cy: Math.floor(k / 3) * 22 - 11, r: 9, fill: [C.blue, C.red, C.green][(i + k) % 3], ...K.stroke(2) }, it); }, (u) => [560 + u * 480, 1060], wd(id, 'seconds'), 0.45, 1.0, { fade: true, sfx: 'blip' });
    const mw = W(g); const m = K.haunt(mw, 960, 1240, 0.5, { face: 'happy', hat: true });
    K.slideIn(mw, t0 + 0.2, 'right', 300, { dur: 0.2, sfx: false });
    K.say(g, 760, 1090, 'next group!', wd(id, 'seconds') + 0.1, { tail: 'right', size: 24, out: wd(id, 'doors') - 0.1 });
  });

  // ================================================================ 13 months later (halftone wipe, full stack)
  chap(12, (g, o, t0, t1, id) => {
    K.halftone(t0 - 0.34, 0.84, { ox: 760, oy: 700 });
    const cal = W(g);
    const cg = K.calendar(cal, 360, 560, '2027', 'NOV', { w: 340, h: 330, bigSize: 150 });
    X.tl.set(cg.big, { textContent: 'MAR' }, t0 + 0.5);
    X.tl.set(cg.big, { textContent: 'JUL' }, t0 + 0.62);
    X.tl.set(cg.big, { textContent: 'OCT' }, t0 + 0.74);
    [0.5, 0.62, 0.74].forEach((dt) => X.sfx(t0 + dt, 'paper', { gain: 0.25 }));
    X.tl.to(cal, { scale: 0, opacity: 0, transformOrigin: '50% 50%', duration: 0.12 }, t0 + 0.84);
    const tS = t0 + 0.9;
    const all = W(g);
    X.tl.fromTo(all, { scale: 0.92 }, { scale: 1.04, svgOrigin: '540 900', duration: t1 - tS, ease: 'none', immediateRender: false }, tS);
    K.show(all, tS);
    X.sfx(tS, 'whoosh', { gain: 0.3 });
    K.halo(all, 530, 470, 170);
    const st = K.stack(all, 210, 640, 640, LAY, { rh: 64, gap: 10, size: 34 });
    K.statusBar(all, 190, 640 + 6 * 74 + 4, 680, 'HOLLOW PINES · haunt', 'OPEN · SEASON 2');
    const mw = W(all); const m = K.haunt(mw, 530, 632, 0.95, { face: 'grin', hat: true });
    m.wave(tS + 0.2, 2);
    st.rows.forEach((r, i) => { gsap.set(r, { x: 400, opacity: 0 }); X.tl.to(r, { x: 0, opacity: 1, duration: 0.18, ease: 'power3.out' }, tS + i * 0.035); });
    [[3, 'safe'], [4, 'safe'], [5, 'timed'], [1, 'counted'], [2, 'scary']].forEach(([ri, w], k) => st.addCheck(wd(id, w) + (k === 1 ? 0.08 : 0), ri));
    st.addCheck(wd(id, 'scary') + 0.15, 0);
    const c1 = W(g); K.shield(c1, 120, 560, 1.0); K.pill(c1, 120, 650, 'safe', { anchor: 'middle', fill: C.dark, size: 18, padX: 10, padY: 10 });
    K.pop(c1, wd(id, 'safe'), { gain: 0.2 });
    const c2 = W(g); K.clock(c2, 960, 560, 50, [7, 1]); K.pill(c2, 960, 640, 'timed', { anchor: 'middle', fill: C.dark, size: 18, padX: 10, padY: 10 });
    K.pop(c2, wd(id, 'timed'), { gain: 0.2 });
    const c3 = W(g); const cc = G(c3, {}); K.clicker(cc, 960, 960, 0.55, {}); K.pill(c3, 960, 1030, 'counted', { anchor: 'middle', fill: C.dark, size: 18, padX: 10, padY: 10 });
    K.pop(c3, wd(id, 'counted'), { gain: 0.2 });
    const c4 = W(g); K.scarer(c4, 110, 1040, 0.5, 'ghost'); K.pill(c4, 110, 1060, 'scary', { anchor: 'middle', fill: C.dark, size: 18, padX: 10, padY: 10 });
    K.pop(c4, wd(id, 'very'), { gain: 0.2 });
    X.tl.to(c4, { y: -18, duration: 0.1, yoyo: true, repeat: 1 }, wd(id, 'scary'));
    const live = W(g); K.mono(live, 1040, 290, '// season 2', { size: 24, weight: 400, fill: C.tagGrey, anchor: 'end' });
    K.show(live, tS);
  });

  // ================================================================ 14 at closing (the turn)
  chap(13, (g, o, t0, t1, id) => {
    const tFri = wd('c14', 'Friday'), tClose = wd('c14', 'closing'), tMatch = wd('c14', 'match');
    const tEl = wd('c14b', 'Eleven'), tTw = wd('c14c', 'Twelve');
    const tNight = tClose + 0.1, NF = 0.45;
    const DOOR = 280, GROUND = 1180, SPEED = 320;
    // four guests leave before closing (OUT 8 -> 11); guest 3 crosses the door line exactly on "closing"
    const gStart = [0, 1, 2, 3].map((i) => tClose - 0.19 - (3 - i) * 0.42);
    const crossAt = (ts) => ts + 60 / SPEED;
    const figStart = tMatch - 0.45, figStop = figStart + 2.0, FIGX = 575;
    const exitSet = (p, night) => {
      const P = night
        ? { wall: '#1a191d', plank: '#2a292f', door: '#030304', ground: '#16161a', trim: '#3a3940', sign: '#1b221d', signTxt: '#3e5546', pine: '#1b211d', pineHi: '#262e28', moon: '#2a2a2e' }
        : { wall: C.barn, plank: '#954835', door: '#26272d', ground: '#d4cdc1', trim: C.trim, sign: C.green, signTxt: '#fff', pine: C.pine2, pineHi: '#a9c2a6', moon: C.yellow };
      if (night) S('rect', { x: 0, y: 0, width: 1080, height: 1920, fill: C.night }, p);
      const mo = W(p); S('path', { d: 'M178,382 A40,40 0 1,0 220,437 A32,32 0 1,1 178,382 Z', fill: P.moon, ...K.stroke(3) }, mo);
      [730, 810, 885, 960, 1040].forEach((x, i) => K.pine(p, x, GROUND + 2, 1.0 + (i % 3) * 0.18, { fill: P.pine, hi: P.pineHi }));
      S('rect', { x: -20, y: GROUND, width: 1120, height: 760, fill: P.ground }, p);
      S('path', { d: `M-20,${GROUND} L1100,${GROUND}`, ...K.stroke(3) }, p);
      const wallG = W(p);
      S('path', { d: 'M-20,600 L470,600 L470,1180 L-20,1180 Z', fill: P.wall, ...K.stroke(3) }, wallG);
      for (let x = 20; x < 470; x += 46) S('path', { d: `M${x},604 L${x},1176`, stroke: P.plank, 'stroke-width': 3 }, wallG);
      S('path', { d: 'M-20,556 L500,556 L470,600 L-20,600 Z', fill: night ? '#0d0d10' : C.roof, ...K.stroke(3) }, wallG);
      K.rrect(wallG, 190, 862, 180, 318, 3, P.door, 3);
      S('rect', { x: 182, y: 854, width: 196, height: 326, fill: 'none', stroke: P.trim, 'stroke-width': 6 }, wallG);
      K.pill(wallG, 280, 790, 'EXIT', { anchor: 'middle', fill: P.sign, color: P.signTxt, size: 26, padX: 16, padY: 12, font: K.F.label, weight: 800 });
      const board = K.headBoard(p, 560, 400, 460, 270, { in: '11', out: '8', delta: 'in − out = 3', fill: night ? '#0f0f12' : '#17181d' });
      const cin = K.clicker(p, 690, 860, 0.85, { label: 'ENTRANCE', n: '0011', fill: night ? '#2a2b31' : '#c9ccd3', face: night ? '#1a1b20' : '#e3e5ea', metal: night ? '#55565e' : '#b9bcc4' });
      const cout = K.clicker(p, 910, 860, 0.85, { label: 'EXIT', n: '0008', fill: night ? '#2a2b31' : '#c9ccd3', face: night ? '#1a1b20' : '#e3e5ea', metal: night ? '#55565e' : '#b9bcc4' });
      // guests (clipped to the doorway's right) and, at night, the figure
      const clipId = night ? 'exitClipN' : 'exitClipD';
      const cl = S('clipPath', { id: clipId }, X.defs); S('rect', { x: 192, y: 0, width: 1000, height: 1300 }, cl);
      const lay = G(p, { 'clip-path': `url(#${clipId})` });
      const pal = [[C.skin4, '#6a9a7a', '#b38b5d', '#45464d'], [C.skin3, '#c9a067', '#1e1f24', '#3a4a6a'], [C.skin1, '#7f6f96', '#2a1d19', '#45464d'], [C.skin2, '#4f8a8a', '#8a4a2c', '#5c5e66']];
      gStart.forEach((ts, i) => {
        const c = pal[i];
        const gg = night ? K.guest(lay, 0, 0, 0.95, { skin: '#2c2a2b', shirt: '#26272d', hairC: '#121214', pants: '#1c1d21', shadow: false, eye: '#5d5850' })
          : K.guest(lay, 0, 0, 0.95, { skin: c[0], shirt: c[1], hairC: c[2], pants: c[3], shadow: false });
        K.walk(gg, DOOR, DOOR + 1000, GROUND, ts, ts + 1000 / SPEED, { s: 0.95, step: 0.2 });
      });
      let fig = null;
      if (night) {
        fig = K.figure(lay, 0, 0, 0.95, { fill: '#040405', line: '#b9b3a7', lineOp: 0.8, sw: 2.5, shadowFill: '#000' });
        K.walk(fig, DOOR, FIGX, GROUND, figStart, figStop, { s: 0.95, step: 0.42, ease: (u) => 1 - (1 - u) * (1 - u) });
      }
      return { board, cin, cout, fig, wallG };
    };
    const dayG = W(g);
    const day = exitSet(dayG, false);
    const ncam = W(g);
    const nightG = W(ncam);
    const night = K.inNight(() => exitSet(nightG, true));
    K.slideIn(day.wallG, t0 + 0.03, 'left', 560, { dur: 0.16, sfx: 'whoosh', bump: false });
    K.slideIn(day.board, t0 + 0.1, 'right', 520, { dur: 0.16, sfx: 'slide', bump: false });
    gsap.set(nightG, { opacity: 0 });
    X.tl.to(nightG, { opacity: 1, duration: NF, ease: 'power1.inOut' }, tNight);
    X.tl.set(dayG, { autoAlpha: 0 }, tNight + NF + 0.05);
    X.sfx(tNight, 'thud', { gain: 0.55 });
    X.sfx(tNight + 0.04, 'click', { gain: 0.35, pitch: 0.6 });
    // the counts (both copies); clicks are quiet, the last one is not
    const sets = [day, night];
    gStart.forEach((ts, i) => {
      const tc = crossAt(ts), v = 8 + i;
      sets.forEach((s, k) => {
        s.cout.press(tc, v, k === 0 && tc > t0 + 0.05);
        X.tl.set(s.board.outN, { textContent: String(v) }, tc + 0.04);
        X.tl.set(s.board.delta, { textContent: `in − out = ${11 - v}` }, tc + 0.04);
      });
    });
    const tZero = crossAt(gStart[3]) + 0.04;
    sets.forEach((s) => { X.tl.set(s.board.delta, { attr: { fill: '#7fe0a0' }, textContent: 'in − out = 0 ✓' }, tZero); });
    const calp = W(g); K.pill(calp, 560, 330, 'FRI · 11:58 PM', { fill: C.dark, size: 22, padX: 14, padY: 12 });
    K.pop(calp, tFri, { sfx: 'blip', gain: 0.2 });
    X.tl.to(calp, { autoAlpha: 0, duration: 0.2 }, tNight);
    // the twelfth
    const tFx = crossAt(figStart);
    sets.forEach((s) => {
      s.cout.press(tFx, 12, false);
      X.tl.set(s.board.outN, { textContent: '12', attr: { fill: C.glow } }, tFx + 0.04);
      X.tl.set(s.board.delta, { textContent: 'in − out = −1', attr: { fill: C.glow } }, tFx + 0.04);
      X.tl.set(s.board.dot, { attr: { fill: C.glow } }, tFx + 0.04);
    });
    X.sfx(tFx, 'click', { gain: 0.6, pitch: 0.75 });
    const bx = night.board.box;
    const glowOut = K.redGlow(nightG, bx.x + bx.w * 0.75, bx.y + 140, 120, 0);
    X.tl.to(glowOut, { opacity: 0.32, duration: 0.3 }, tFx + 0.04);
    // "Eleven went in." / "Twelve came out."
    const pulseClick = (cl, t, col) => {
      const ringP = S('circle', { cx: 0, cy: 0, r: 70, fill: 'none', stroke: col, 'stroke-width': 4, opacity: 0 }, cl);
      X.tl.fromTo(ringP, { attr: { r: 60 }, opacity: 0.9 }, { attr: { r: 96 }, opacity: 0, duration: 0.7, ease: 'power2.out', immediateRender: false }, t);
    };
    pulseClick(night.cin, tEl, '#d4cec2');
    X.tl.set(night.board.inN, { attr: { fill: '#ffffff' } }, tEl);
    pulseClick(night.cout, tTw, C.glow);
    X.tl.to(glowOut, { opacity: 0.5, attr: { rx: 150, ry: 96 }, duration: 0.6 }, tTw);
    // the camera leans in on the figure while nobody speaks
    X.tl.to(ncam, { scale: 1.34, svgOrigin: `${FIGX} 1020`, duration: tBlack - tTw, ease: 'power1.inOut' }, tTw);
    X.tl.to(night.fig.head, { rotation: -9, svgOrigin: '2 -268', duration: 1.1, ease: 'power2.inOut' }, tEndV + 0.15);
    // lights out: a 6-frame fade to black; only the red count is left
    const black = S('rect', { x: 0, y: 0, width: 1080, height: 1920, fill: '#000', opacity: 0 }, o);
    X.tl.to(black, { opacity: 1, duration: 6 / 30, ease: 'power1.in' }, tBlack);
    const fin = G(K.top, {});
    gsap.set(fin, { autoAlpha: 0 });
    X.tl.set(fin, { autoAlpha: 1 }, tBlack + 0.1);
    const halo = K.redGlow(fin, 540, 900, 330, 0.5);
    X.every((t) => { if (t >= tBlack) halo.setAttribute('opacity', (0.42 + 0.1 * Math.sin((t - tBlack) * 2.4)).toFixed(3)); });
    const stp = K.stamp(fin, 540, 900, '12 / 11', { size: 210, rot: -8, color: '#e2452e', fillBg: '#0a0a0c', fillOp: 1, sub: 'OUT  /  IN' });
    K.slam(stp, tBlack + 0.1, { sfx: 'click', gain: 0.01 });
  });

  // ---------------------------------------------------------------- captions (on top of everything)
  const keys = {};
  spec.lines.forEach((l) => { keys[l.id] = l.keys || []; });
  K.captions({
    keys,
    merges: [{ line: 'c11', from: 'two', n: 2, show: '2,000' }],
    shows: { 'c14b:0': '11', 'c14c:0': '12' },
    night: { t: wd('c14', 'the') - 0.05, dark: '#ece7dd', grey: '#77736c', selFill: '#2a3550', selLine: '#5b84d6', handle: '#5b84d6' },
    lastHold: tBlack - X.line('c14c').end - 0.05,
  });
  // emphasis: on every caption keyword the newest element of the chapter thumps and nudges its neighbours
  // (not in the last chapter: there, nothing moves unless it has to)
  spec.lines.forEach((l) => {
    if (!/^c(0\d|1[0-3])$/.test(l.id)) return;
    const cg = document.getElementById(l.id + 'cam') || document.getElementById(l.id);
    const has = (k) => X.line(l.id).words.some((w) => nrm(w.w).startsWith(nrm(k)));
    const kt = (keys[l.id] || []).filter(has).map((k) => (wx(l.id, k) !== X.line(l.id).start ? wx(l.id, k) : wd(l.id, k)));
    kt.forEach((t) => K.emphasize(cg, t));
    let last = -9, n = 0; const all = [...kt];
    X.line(l.id).words.forEach((w) => {
      if (nrm(w.w).length < 6 || all.some((t) => Math.abs(t - w.start) < 0.6) || w.start - last < 0.6) return;
      K.emphasize(cg, w.start, { amt: 0.06, nudge: 0.45, back: ++n }); last = w.start; all.push(w.start);
    });
  });
  function wx(id, w, n = 0) { const ws = X.line(id).words.filter((x) => nrm(x.w) === nrm(w)); return (ws[n] || ws[0] || X.line(id)).start; }
  X.end(END);
});

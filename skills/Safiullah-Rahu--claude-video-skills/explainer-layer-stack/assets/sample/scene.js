/* layer-stack sample — "Just put it online": what a small bakery's website really needs.
 * 20 chapters, each a hard cut to a new set on the same warm canvas; one build event every ~0.8 s on a stressed word. */
X.boot(async (X) => {
  await X.loadVO();
  const spec = await (await fetch('script.json')).json();
  const C = K.C, S = K.S, G = K.G;
  K.canvas();
  const ids = spec.lines.map((l) => l.id);
  const END = X.vo.duration;
  const T0 = ids.map((id, i) => (i === 0 ? 0 : X.line(id).start - 0.1));
  const T1 = ids.map((id, i) => (i < ids.length - 1 ? T0[i + 1] : END));
  const wd = (id, w, n = 0) => X.word(id, w, n);
  const nrm = (s) => s.toLowerCase().replace(/[^a-z0-9$%']/g, '');
  const wx = (id, w, n = 0) => { const ws = X.line(id).words.filter((x) => nrm(x.w) === nrm(w)); return (ws[n] || ws[0] || X.line(id)).start; };
  const W = (p) => G(p, {}); // animation wrapper (never tween a group that carries a transform attribute)
  const LAY = [['01', 'SERVER'], ['02', 'DOMAIN · DNS'], ['03', 'DATABASE'], ['04', 'BACKUPS'], ['05', 'HTTPS'], ['06', 'CDN'], ['07', 'CACHE + BALANCER'], ['08', 'MONITORING']].map(([n, label]) => ({ n, label }));
  const TAGS = ['just put it online', 'the first customer', 'dns', 'brand', 'the last loaf', 'one file', 'database', 'exactly once', '2 a.m.', 'backups', 'café wifi', 'https', 'far away', 'cdn', 'saturday', 'balancer', 'mystery', 'monitor', 'months later', 'one friday'];
  K.tags(ids.map((id, i) => [T0[i], T1[i], `// ${String(i + 1).padStart(2, '0')} — ${TAGS[i]}`]));
  // prop scale: the source's props fill the right two-thirds a little more than ours did -> sets with the presenter
  // are drawn 15 % larger about the diagram centre (wide / full-frame chapters keep their own framing)
  const WIDE = new Set([0, 6, 14, 18, 19]);
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

  // ---------------------------------------------------------------- presenter (static, as in the source)
  const PW = W(K.pres);
  K.presenter(PW, 14, 590);
  const zoomT = wd('c01', 'server') - 0.05;
  gsap.set(PW, { autoAlpha: 0 });
  X.tl.set(PW, { autoAlpha: 1 }, zoomT);
  X.tl.fromTo(PW, { x: -190 }, { x: 0, duration: 0.42, ease: 'power3.inOut', immediateRender: false }, zoomT);
  [[T0[6], T0[7]], [T0[14], T0[15]], [T0[18], END + 1]].forEach(([a, b]) => { X.tl.set(PW, { autoAlpha: 0 }, a); X.tl.set(PW, { autoAlpha: 1 }, b); });

  // ================================================================ 01 just put it online
  chap(0, (g, o, t0, t1, id) => {
    const cam = W(g); cam.id = 'c01cam';
    gsap.set(cam, { svgOrigin: '0 0', scale: 1.37, x: -372, y: -386 });
    X.tl.to(cam, { scale: 1, x: 0, y: 0, duration: 0.42, ease: 'power3.inOut' }, zoomT);
    X.sfx(zoomT, 'woosh_low', { gain: 0.35 });
    // shops
    const back = W(cam);
    const shops = [[520, 1056, 104, 330, 'CAFÉ', '#f3e7d2', '#d9cbb3', 2], [670, 1040, 100, 400, 'BOOKS', '#eef1f6', '#cdd4e1', 5], [815, 1056, 100, 300, 'FLORIST', '#f5e4dc', '#dcc5bb', 7], [960, 1046, 100, 360, 'GYM', '#e9f0e6', '#c9d6c4', 9]];
    shops.forEach(([x, y, w, h, lab, b, s, seed]) => { K.building(back, x, y, w, h, { label: lab, base: b, side: s, seed, cols: 3 }); K.tree(back, x - 44, y + 4, 0.9); K.walker(back, x + 30, y - 2, 1.1, ['#2a2b31', '#5b6b8c', '#45464d'][seed % 3]); });
    const bake = W(cam);
    const bk = K.building(bake, 350, 1070, 150, 440, { base: '#ffffff', side: '#dfe6f3', stripe: C.blue, seed: 11, lit: 0.6 });
    K.tree(bake, 300, 1076, 1); K.tree(bake, 420, 1070, 1.05); K.walker(bake, 380, 1066, 1.15, C.blue);
    S('path', { d: 'M350,560 L350,600', ...K.stroke(3) }, bake);
    K.brandSticker(bake, 248, 504, 'crumbwell', 0.95);
    // bubbles (shops all want the same thing)
    const bubbles = [
      [300, 430, 'our own site!', true, 0.24], [420, 560, 'we need a website!', false, 0.4], [650, 470, 'online. now.', false, 0.56],
      [760, 590, 'a website, please!', false, 0.74], [600, 650, 'our own site!', false, 0.92],
    ].map(([x, y, s, red, dt]) => { const b = W(cam); K.bubble(b, x, y, s, { red, size: 30 }); K.pop(b, t0 + dt + 0.05, { gain: 0.22, pitch: 0.9 + dt / 3 }); return b; });
    // red ring sweeps out (the "everyone" beat)
    const ring = S('circle', { cx: 660, cy: 760, r: 40, fill: 'none', stroke: C.red, 'stroke-width': 2.5, opacity: 0 }, cam);
    X.tl.to(ring, { attr: { r: 420 }, opacity: 0.8, duration: 0.45, ease: 'power2.out' }, wd(id, 'website') - 0.15);
    X.tl.to(ring, { opacity: 0, duration: 0.25 }, wd(id, 'website') + 0.4);
    X.sfx(wd(id, 'website') - 0.15, 'swoosh', { gain: 0.25 });
    bubbles.forEach((b, i) => K.popOut(b, wd(id, 'rent') + i * 0.03));
    X.tl.to(back, { opacity: 0.55, duration: 0.3 }, zoomT + 0.2);
    // crane + server box
    const cr = W(cam);
    const crane = K.crane(cr, 470, 470, 1120, { tx: 740 });
    K.slideIn(cr, wd(id, 'So') - 0.05, 'right', 700, { dur: 0.32, ease: 'power3.out', sfx: 'whoosh' });
    const boxW = W(cam);
    const box = K.serverBox(boxW, 540, 860, 430, 210, { label: 'SERVER', num: '01', labelSize: 50 });
    const cables = S('path', { d: 'M760,562 L570,840 M760,562 L990,840', ...K.stroke(3), fill: 'none' }, boxW);
    const tDrop = wd(id, 'rent') - 0.05;
    S('path', { d: 'M740,562 L740,-300', ...K.stroke(3) }, boxW);
    gsap.set(boxW, { y: -860, autoAlpha: 0 });
    X.tl.set(boxW, { autoAlpha: 1 }, tDrop - 0.25);
    X.tl.to(boxW, { y: 0, duration: 0.67, ease: 'power2.inOut' }, tDrop - 0.25);
    X.sfx(tDrop - 0.25, 'slide', { gain: 0.3 });
    K.puff(cam, 740, 1066, tDrop + 0.42, 1.3);
    X.sfx(tDrop + 0.42, 'thud', { gain: 0.5 });
    X.tl.to(cables, { opacity: 0, duration: 0.1 }, tDrop + 0.6);
    X.tl.to(boxW.querySelector('path:last-child'), { opacity: 0, duration: 0.1 }, tDrop + 0.6);
    // "copy your shop onto it": a page card rides the hook down into the slot
    const page = W(cam);
    const pc = K.card(page, 685, 600, 110, 84, { r: 8 });
    S('rect', { x: 686.5, y: 601.5, width: 107, height: 18, rx: 6, fill: C.blue }, pc);
    K.loaf(pc, 717, 664, 0.42); K.loaf(pc, 765, 664, 0.42);
    gsap.set(page, { autoAlpha: 0 });
    const tCopy = wd(id, 'copy');
    X.tl.set(page, { autoAlpha: 1 }, tCopy - 0.05);
    X.tl.fromTo(page, { y: -120 }, { y: 160, duration: 0.5, ease: 'power2.in', immediateRender: false }, tCopy);
    X.tl.to(page, { scaleY: 0, transformOrigin: '50% 100%', duration: 0.12, ease: 'power1.in' }, tCopy + 0.5);
    X.sfx(tCopy + 0.5, 'click', { gain: 0.4 });
    X.tl.set(box.disp, { textContent: 'shop ✓' }, tCopy + 0.62);
    X.sfx(tCopy + 0.62, 'blip_up', { gain: 0.3 });
    // "put your logo on top"
    const lg = W(cam);
    K.logo(lg, 930, 905, 1.3);
    K.pop(lg, wd(id, 'logo'), { sfx: 'pop' });
    X.tl.fromTo(lg, { rotation: -25 }, { rotation: 0, duration: 0.35, ease: 'back.out(3)', transformOrigin: '50% 50%', immediateRender: false }, wd(id, 'logo'));
    // mascot goes live on top of the box
    const mw = W(cam);
    const m = K.mascot(mw, 720, 830, 0.95, { face: 'grin' });
    K.pop(mw, wd(id, 'send'), { sfx: 'boing' });
    m.wave(wd(id, 'send') + 0.3, 2);
    const live = W(cam);
    K.pill(live, 800, 640, 'LIVE', { fill: C.red, size: 26, padX: 16, padY: 16, font: K.F.label, weight: 800 });
    K.pop(live, wd(id, 'customers') + 0.05, { gain: 0.25 });
    const ip = W(cam);
    const ipp = K.pill(ip, 830, 760, '203.0.113.7', { fill: '#fff', color: C.ink, sw: 3, size: 26, padX: 16, padY: 16 });
    S('path', { d: 'M812,790 l-50,40', ...K.stroke(3), 'stroke-dasharray': '6 6' }, ip);
    K.pop(ip, wd(id, 'address'), { sfx: 'blip_up' });
    // density: upload progress on the box screen, the site says hello
    K.flicker(box.disp, wd(id, 'copy'), wd(id, 'copy') + 0.6, (k) => 'copy ' + Math.min(100, k * 17) + '%');
    K.say(cam, 400, 560, 'hello, world!', wd(id, 'customers'), { tail: 'right', size: 30 });
    K.still(back, bake, cr, boxW, page, lg, mw);
  });

  // ================================================================ 02 the first customer
  chap(1, (g, o, t0, t1, id) => {
    // pale skyline + road
    const sky = W(g);
    const rnd = X.rand(21);
    for (let x = 240; x < 1080; x += 70) {
      const h = 120 + rnd() * 160;
      S('rect', { x, y: 1000 - h, width: 62, height: h, fill: '#ece8e0', stroke: '#d8d3ca', 'stroke-width': 2 }, sky);
      for (let yy = 1000 - h + 18; yy < 985; yy += 30) for (let xx = x + 10; xx < x + 56; xx += 18) S('rect', { x: xx, y: yy, width: 9, height: 12, fill: '#ddd8ce' }, sky);
    }
    S('rect', { x: 240, y: 1000, width: 860, height: 110, fill: '#e9e6e0' }, sky);
    S('path', { d: 'M240,1000 L1080,1000 M240,1110 L1080,1110', stroke: '#cfcac1', 'stroke-width': 3 }, sky);
    S('path', { d: 'M250,1055 L1080,1055', stroke: '#fff', 'stroke-width': 6, 'stroke-dasharray': '30 26' }, sky);
    // server + mascot, top right
    const srv = W(g);
    const inner = G(srv, { transform: 'translate(880 700) scale(0.62)' });
    K.serverBox(inner, -150, 0, 300, 160, { label: 'SERVER' });
    const m = K.mascot(srv, 880, 690, 0.62);
    K.dropIn(srv, t0 + 0.05, 600, { dur: 0.32 });
    // customer with phone (big bust, as in the source)
    const cu = W(g);
    const cust = K.person(cu, 420, 1300, 1.7, { skin: C.skin2, shirt: '#5b6b8c', hairC: '#5a3b22', phone: true });
    K.slideIn(cu, wd(id, 'customer') - 0.05, 'left', 520, { dur: 0.2, ease: 'back.out(1.4)' });
    // browser window grows out of the phone
    const ww = W(g);
    const win = K.window(ww, 290, 380, 600, 380, 'new tab', { addr: true, dot: '#bbb' });
    gsap.set(ww, { scale: 0, svgOrigin: '500 1180' });
    X.tl.to(ww, { scale: 1, duration: 0.3, ease: 'back.out(1.5)' }, wd(id, 'types') - 0.12);
    X.sfx(wd(id, 'types') - 0.12, 'pop', { gain: 0.3 });
    const tType = wd(id, 'types') + 0.12;
    K.type(win.addr, '203.0.118.7', tType, 22);
    // wrong digit: red ring + note
    const wrong = W(g);
    const ax = 340 + K.measure('203.0.11', 24, 500, K.F.mono) + K.measure('8', 24, 500, K.F.mono) / 2;
    S('ellipse', { cx: ax, cy: 469, rx: 18, ry: 22, fill: 'none', stroke: C.red, 'stroke-width': 4 }, wrong);
    K.pill(wrong, ax + 20, 406, 'should be 3', { fill: C.red, size: 18, padX: 10, padY: 10 });
    K.pop(wrong, wd(id, 'digit'), { sfx: 'error', gain: 0.3 });
    K.pulse(g, ax, 469, 90, wd(id, 'digit'), { before: ww, hold: 0.6 });
    K.shake(cu, wd(id, 'wrong'), 10, 0.3);
    // the page that loads: a tyre garage
    const pg = W(g);
    K.text(pg, 320, 560, 'TYRE GARAGE', { size: 44, weight: 900, font: 'Oswald, sans-serif' });
    K.mono(pg, 320, 600, 'tyres · exhausts · brakes', { size: 20, fill: '#8d8a84' });
    const tys = [0, 1, 2].map((i) => { const ty = W(pg); K.tyre(ty, 370 + i * 92, 680, 40); return ty; });
    const ord = W(pg);
    K.pill(ord, 640, 650, '4 tyres · ordered ✓', { fill: C.green, size: 22, padX: 14, padY: 14, font: K.F.label, weight: 800 });
    K.show(pg, wd(id, 'orders') - 0.05);
    tys.forEach((ty, i) => K.dropIn(ty, wd(id, 'orders') - 0.05 + i * 0.07, 300, { dur: 0.3, sfx: i ? false : 'drop' }));
    K.pop(ord, wd(id, 'tyres'), { sfx: 'ding' });
    // van gag: a tyre van rolls in and honks
    const vw = W(g);
    K.van(vw, 740, 1100, 1.15, { fill: C.crane, label: 'TYRES', icon: (gg) => K.tyre(gg, -96, -70, 16) });
    gsap.set(vw, { x: 560 });
    X.tl.to(vw, { x: 0, duration: 0.45, ease: 'power3.out' }, wd(id, 'from') - 0.1);
    X.sfx(wd(id, 'from') - 0.1, 'whoosh', { gain: 0.3 });
    const beep = W(g);
    K.bubble(beep, 800, 880, 'BEEP!', { fill: C.crane, size: 34, weight: 900, tail: 'left' });
    K.pop(beep, wd(id, 'garage') + 0.12, { sfx: 'horn', gain: 0.35 });
    X.tl.set(cust.mouth, { attr: { d: 'M-9,-92 q9,-7 18,0' } }, wd(id, 'garage'));
    const st = K.stamp(o, 620, 860, 'WRONG SHOP', { size: 118, rot: -7 });
    K.pulse(o, 600, 860, 230, wd(id, 'garage') + 0.18, { hold: 0.7 });
    K.slam(st, wd(id, 'garage') + 0.18);
    // "so you buy a domain": clear the stage, the server takes the centre, the name drops on
    const tSo = wd(id, 'So') - 0.08;
    K.flyOut(ww, tSo, -700, 0); K.flyOut(pg, tSo, -700, 0);
    X.tl.to([wrong, st, beep], { opacity: 0, duration: 0.1 }, tSo);
    X.tl.to(vw, { x: -1100, duration: 0.4, ease: 'power2.in' }, tSo);
    X.sfx(tSo, 'whoosh', { gain: 0.3 });
    K.restage(srv, tSo + 0.05, { x: -300, y: 70, scale: 1.25, svgOrigin: '880 700' }, 0.34);
    const dm = W(g);
    K.pill(dm, 470, 560, 'crumbwell.shop', { fill: '#fff', color: C.blue, sw: 3, size: 34, padX: 20, padY: 20, font: K.F.label, weight: 800 });
    K.logo(dm, 440, 588, 0.8);
    K.dropIn(dm, wd(id, 'buy') - 0.05, 500, { dur: 0.3, sfx: 'coin' });
    K.pulse(g, 600, 640, 200, wd(id, 'domain') - 0.1, { before: srv, hold: 0.5 });
    m.hop(wd(id, 'domain') + 0.05);
    m.face(wd(id, 'domain'), 'grin');
    // density
    const q1 = W(g); K.bubble(q1, 520, 900, 'uh… 203.0.11…?', { size: 30, tail: 'left' });
    K.pop(q1, wd(id, 'that'), { sfx: 'bubble', gain: 0.2 }); K.popOut(q1, wd(id, 'orders') - 0.1);
    const xx = W(ww); K.cross(xx, 845, 469, 17);
    K.pop(xx, wd(id, 'wrong'), { sfx: 'error', gain: 0.25 });
    K.say(g, 690, 650, "that's me!", wd(id, 'domain') + 0.15, { tail: 'left', size: 30 });
  });
  // ================================================================ 03 dns
  chap(2, (g, o, t0, t1, id) => {
    const tw = W(g);
    const term = K.terminal(tw, 270, 430, 520, 320, 'DNS RECORD', { ver: 'v1', n: 3, size: 30 });
    K.slideIn(tw, t0 + 0.03, 'left', 700, { rot: -6, dur: 0.24, origin: '530 590' });
    const kw = W(g);
    K.keyboard(kw, 300, 800, 440);
    gsap.set(kw, { y: 520 });
    X.tl.to(kw, { y: 0, duration: 0.26, ease: 'back.out(1.3)' }, t0 + 0.14);
    X.sfx(t0 + 0.14, 'slide', { gain: 0.25 });
    // stack + mascot at right
    const side = W(g);
    const sw = W(side);
    miniStack(sw, 800, 1010, 250, 2, wd(id, 'record') + 0.15, { rh: 50, size: 22 });
    const mw = W(side);
    const m = K.mascot(mw, 925, 1008, 0.9);
    K.slideIn(side, t0 + 0.2, 'right', 500, { dur: 0.24, sfx: false });
    X.tl.fromTo(mw, { y: 55 }, { y: 0, duration: 0.2, ease: 'back.out(2)', immediateRender: false }, wd(id, 'record') + 0.15);
    K.pulse(g, 925, 1020, 150, wd(id, 'record') + 0.2, { hold: 0.6 });
    m.wave(wd(id, 'record') + 0.4, 1);
    // typing (keys flash while typing)
    term.typeLine(0, 'crumbwell.shop', wd(id, 'DNS'), 40);
    term.typeLine(1, 'A    203.0.113.7', wd(id, 'turns') - 0.2, 42);
    term.typeLine(2, 'TTL  3600', wd(id, 'address') - 0.3, 40);
    X.tl.set(term.lines[1], { attr: { fill: C.salmon } }, wd(id, 'address'));
    const tB = wd(id, 'into') - 0.05;
    // second half: lookups ride a belt through the DNS booth
    X.tl.to(tw, { x: -620, rotation: -8, opacity: 0, duration: 0.22, ease: 'power3.in', svgOrigin: '530 590' }, tB);
    X.tl.to(kw, { y: 300, opacity: 0, duration: 0.2, ease: 'power3.in' }, tB);
    X.sfx(tB, 'whoosh', { gain: 0.3 });
    K.restage(side, tB + 0.05, { y: -60 }, 0.3);
    const belt = W(g);
    K.conveyor(belt, 250, 1060, 560, [], { move: true });
    K.station(belt, 460, 800, 170, 260, 'DNS', { size: 30 });
    const ctr = W(belt);
    K.card(ctr, 270, 590, 250, 140, { r: 14 });
    K.mono(ctr, 292, 628, 'lookups', { size: 20, fill: '#8d8a84', weight: 600 });
    const n = K.text(ctr, 292, 702, '1,046', { size: 64, weight: 900, font: 'Oswald, sans-serif', fill: C.red });
    K.slideIn(belt, tB + 0.06, 'down', 700, { dur: 0.26, ease: 'power3.out', sfx: 'slide' });
    for (let i = 0; i < 6; i++) {
      const ti = tB + 0.28 + i * 0.3;
      const env = W(belt);
      K.pill(env, 270, 996, 'crumbwell.shop?', { fill: '#fff', color: C.ink, sw: 2.5, size: 20, padX: 12, padY: 12 });
      gsap.set(env, { autoAlpha: 0 });
      X.tl.set(env, { autoAlpha: 1 }, ti);
      X.tl.fromTo(env, { x: -140 }, { x: 190, duration: 0.36, ease: 'none', immediateRender: false }, ti);
      X.tl.set(env, { autoAlpha: 0 }, ti + 0.36);
      const out = W(belt);
      K.pill(out, 640, 996, '203.0.113.7', { fill: C.blue, size: 20, padX: 12, padY: 12 });
      gsap.set(out, { autoAlpha: 0 });
      X.tl.set(out, { autoAlpha: 1 }, ti + 0.38);
      X.tl.fromTo(out, { x: 0 }, { x: 260, opacity: 0, duration: 0.45, ease: 'none', immediateRender: false }, ti + 0.38);
      X.tl.set(n, { textContent: (1047 + i).toLocaleString('en-US') }, ti + 0.38);
      tick(ti + 0.38, 0.16);
    }
    // density
    const map = W(g); K.pill(map, 270, 355, 'crumbwell.shop  →  203.0.113.7', { fill: C.dark, size: 22, padX: 16, padY: 16 });
    K.pop(map, wd(id, 'turns'), { sfx: 'blip_up', gain: 0.25 });
    X.tl.to(map, { opacity: 0, duration: 0.1 }, wd(id, 'into') - 0.05);
    K.say(g, 640, 640, 'found me ✓', wd(id, 'visitor'), { tail: 'right', size: 30 });
  });

  // ================================================================ 04 brand
  chap(3, (g, o, t0, t1, id) => {
    const mw = W(g);
    const m = K.mascot(mw, 740, 1230, 1.6, { face: 'worried' });
    K.dropIn(mw, t0 + 0.02, 900, { dur: 0.34, ease: 'back.out(1.2)' });
    const th1 = W(g);
    K.thought(th1, 300, 540, 330, 150, ['what\'s', 'my name?'], { tailX: 0.85 });
    K.pop(th1, t0 + 0.2, { sfx: 'bubble' });
    const tN = wd(id, 'name');
    K.popOut(th1, tN - 0.02, 0.1);
    const th2 = W(g);
    K.thought(th2, 280, 540, 380, 150, ['I\'m', { t: 'crumbwell.shop', fill: C.blue }], { tailX: 0.85 });
    K.pop(th2, tN + 0.08, { sfx: 'pop' });
    m.face(tN, 'happy'); m.armUp(tN);
    K.pulse(g, 740, 1010, 300, tN, { hold: 1.0 });
    const ex = W(g);
    K.excl(ex, 920, 700, 30);
    K.pop(ex, tN + 0.12, { sfx: 'blip_up' });
    m.hatOn(wd(id, 'remember'));
    m.face(wd(id, 'remember') + 0.35, 'grin');
    // bunting
    const bw = W(g);
    const bun = K.bunting(bw, 250, 1080, 430, { n: 14 });
    K.dropIn(bw, wd(id, 'land') - 0.08, 300, { dur: 0.32, ease: 'back.out(1.6)', sfx: 'swoosh' });
    bun.flags.forEach((f, i) => { const bb = f.getBBox(); const cx = bb.x + bb.width / 2, cy = bb.y; X.every((t) => { if (t > t0 && t < t1) f.setAttribute('transform', `rotate(${(Math.sin(t * 5 + i) * 6).toFixed(2)} ${cx} ${cy})`); }); });
    // menu card
    const mc = W(g);
    const card = K.card(mc, 260, 760, 350, 320, { r: 16 });
    K.logo(card, 296, 798, 0.65);
    K.text(card, 324, 810, 'MENU', { size: 30, weight: 900 });
    const items = ['Sourdough', 'Cinnamon rolls', 'Rye'];
    const rows = items.map((it, i) => { const r = W(mc); K.loaf(r, 302, 886 + i * 66, 0.46); K.text(r, 338, 897 + i * 66, it, { size: 28, weight: 600 }); return r; });
    K.slideIn(mc, wd(id, 'menu') - 0.12, 'left', 700, { dur: 0.24 });
    rows.forEach((r, i) => K.pop(r, wd(id, 'menu') + 0.1 + i * 0.1, { gain: 0.15, pitch: 1 + i * 0.1 }));
    X.tl.to(th2, { x: -40, y: -60, scale: 0.85, transformOrigin: '0% 0%', duration: 0.3, ease: 'power3.inOut' }, wd(id, 'menu') - 0.12);
    m.hop(wd(id, 'finally'), 34);
    // "Real." sticker
    const rs = W(o);
    const rg = G(rs, { transform: 'translate(560 690) rotate(-6)' });
    K.rrect(rg, -210, -94, 420, 164, 32, C.red, 4);
    K.logo(rg, -150, -12, 0.95);
    K.text(rg, 36, 38, 'Real.', { size: 128, weight: 700, fill: '#fff', anchor: 'middle', font: '"Playfair Display", serif', attrs: { 'font-style': 'italic' } });
    K.pulse(o, 560, 690, 280, wd(id, 'real'), { hold: 0.8 });
    K.camTo(g, wd(id, 'real') - 0.05, 1.07, 700, 900, 0.35);
    K.slam(rs, wd(id, 'real'));
    [0, 1, 2, 3].forEach((i) => { const h = W(g); K.heart(h, 880 + i * 40, 860 - i * 34, 1.1); K.dropIn(h, wd(id, 'shop') + i * 0.06, 200, { dur: 0.25, ease: 'back.out(2)', sfx: i ? false : 'sparkle' }); });
    // density
    const lockp = W(g); K.pill(lockp, 290, 1110, 'crumbwell.shop ✓', { fill: C.dark, size: 24, padX: 16, padY: 16, font: K.F.label, weight: 700 });
    K.pop(lockp, wd(id, 'type'), { sfx: 'blip_up', gain: 0.25 });
    K.say(g, 790, 560, 'welcome in!', wd(id, 'land') + 0.1, { tail: 'left', size: 30 });
    [[640, 820], [900, 900], [700, 1000]].forEach(([x, y], i) => { const sp = W(g); K.sparkle(sp, x, y, 1.6, i % 2 ? C.blue : C.red); K.pop(sp, wd(id, 'finally') + i * 0.07, { sfx: i ? false : 'sparkle', gain: 0.15 }); });
  });

  // ================================================================ 05 the last loaf
  chap(4, (g, o, t0, t1, id) => {
    // shelf with one loaf + stock tag
    const sh = W(g);
    S('rect', { x: 640, y: 600, width: 400, height: 20, rx: 4, fill: '#c89a64', ...K.stroke(3) }, sh);
    S('path', { d: 'M670,620 l0,44 M1010,620 l0,44', ...K.stroke(4) }, sh);
    const lf = W(sh); K.loaf(lf, 840, 590, 1.4);
    const tag = W(sh);
    K.rrect(tag, 900, 470, 140, 62, 10, '#fff', 3);
    const stock = K.text(tag, 970, 513, '1 left', { size: 32, weight: 800, anchor: 'middle' });
    K.dropIn(sh, t0 + 0.04, 500, { dur: 0.3 });
    // desk with mascot behind
    const dk = W(g);
    const mw = W(dk);
    const m = K.mascot(mw, 860, 1000, 0.95);
    K.rrect(dk, 660, 990, 390, 110, 12, '#5a72bd', 3);
    K.rrect(dk, 682, 1008, 346, 46, 8, C.navy, 0);
    K.mono(dk, 704, 1040, 'ORDERS', { size: 26, weight: 700, fill: '#fff', ls: 2 });
    K.mono(dk, 1010, 1040, '#41', { size: 22, weight: 700, fill: C.red, anchor: 'end' });
    K.slideIn(dk, t0 + 0.12, 'right', 600, { dur: 0.26 });
    // two customers
    const c1 = W(g), c2 = W(g);
    const p1 = K.person(c1, 350, 1300, 1.45, { skin: C.skin4, shirt: '#6a9a7a', hairC: '#b38b5d', phone: true });
    const p2 = K.person(c2, 560, 1300, 1.45, { skin: C.skin3, shirt: '#c9a067', cap: C.navy, phone: true });
    K.slideIn(c1, wd(id, 'two') - 0.05, 'left', 520, { dur: 0.2 });
    K.slideIn(c2, wd(id, 'people') - 0.05, 'down', 500, { dur: 0.2 });
    const b1 = W(g), b2 = W(g);
    K.bubble(b1, 270, 900, 'buy!', { size: 38 });
    K.bubble(b2, 480, 900, 'buy!', { size: 38 });
    K.pop(b1, wd(id, 'order'), { gain: 0.25 });
    K.pop(b2, wd(id, 'order') + 0.12, { gain: 0.25, pitch: 1.1 });
    X.tl.to(lf, { scale: 1.15, transformOrigin: '50% 100%', duration: 0.12, yoyo: true, repeat: 1 }, wd(id, 'sourdough'));
    K.pulse(sh, 840, 560, 120, wd(id, 'sourdough'), { hold: 0.7 });
    // same second
    const tS = wd(id, 'same');
    [[280, 860], [490, 860]].forEach(([x, y], i) => { const tg = W(g); K.pill(tg, x, y, '12:00:01', { fill: C.dark, size: 24, padX: 12, padY: 12 }); K.pop(tg, tS + i * 0.06, { sfx: 'tick', gain: 0.3 }); });
    K.popOut(b1, tS - 0.02); K.popOut(b2, tS);
    // both confirmed
    const tB = wd(id, 'confirms');
    const r1 = W(g), r2 = W(g);
    K.ticket(r1, 420, 660, 'ORDER #4102 ✓', { stub: C.green, w: 230, sub: 'sourdough ×1' });
    K.ticket(r2, 420, 744, 'ORDER #4103 ✓', { stub: C.green, w: 230, sub: 'sourdough ×1' });
    K.dropIn(r1, tB, 500, { dur: 0.28, sfx: 'success' });
    K.dropIn(r2, wd(id, 'both'), 500, { dur: 0.28, sfx: 'success' });
    m.face(tB, 'grin'); m.hop(tB + 0.05, 24);
    // you only baked one
    X.tl.set(stock, { textContent: '0 left' }, wd(id, 'only'));
    X.tl.set(stock, { textContent: '−1 left', attr: { fill: C.red } }, wd(id, 'baked'));
    tick(wd(id, 'only')); X.sfx(wd(id, 'baked'), 'error', { gain: 0.3 });
    K.shake(tag, wd(id, 'baked'), 8, 0.3);
    m.face(wd(id, 'baked'), 'shock');
    K.shake(dk, wd(id, 'baked'), 6, 0.3);
    K.jitter(m.jit, wd(id, 'baked'), t1, 7, 4);
    K.papers(g, 540, 760, 12, wd(id, 'one'), { dist: 520, dur: 1.0, seed: 21 });
    const st = K.stamp(o, 600, 820, 'SOLD TWICE', { size: 120, rot: -8 });
    K.pulse(o, 620, 820, 250, wd(id, 'one'), { hold: 0.7 });
    K.slam(st, wd(id, 'one'));
    // density
    K.say(g, 640, 690, 'order confirmed!', wd(id, 'happily'), { tail: 'right', size: 28, out: wx(id, 'You') - 0.05 });
    const neg = W(g); K.excl(neg, 1046, 466, 24);
    K.pop(neg, wd(id, 'baked') + 0.05, { sfx: false });
  });

  // ================================================================ 06 one file
  chap(5, (g, o, t0, t1, id) => {
    const dw = W(g);
    const doc = K.doc(dw, 290, 440, 440, 540, { title: 'orders.txt', lines: 0, tsize: 32 });
    K.dropIn(dw, t0 + 0.03, 800, { dur: 0.32, ease: 'back.out(1.3)', sfx: 'paper' });
    const mw = W(g);
    const m = K.mascot(mw, 905, 1230, 1.05, { face: 'worried', hat: true });
    K.slideIn(mw, t0 + 0.15, 'right', 500, { dur: 0.24, sfx: false });
    const lines = ['#4098  rye ×2', '#4099  rolls ×6', '#4100  rye ×1', '#4101  sourdough ×1'];
    const lt = [wd(id, 'every'), wd(id, 'order'), wd(id, 'lives'), wd(id, 'one')];
    lines.forEach((l, i) => { const e = K.mono(dw, 318, 540 + i * 58, '', { size: 28, weight: 600 }); K.type(e, l, lt[i], 60, false); X.sfx(lt[i], 'type', { gain: 0.18 }); });
    const one = W(g);
    K.pill(one, 600, 380, '1 file · no locks', { fill: C.dark, size: 24, padX: 14, padY: 14 });
    K.dropIn(one, wd(id, 'file') - 0.1, 400, { dur: 0.26, sfx: 'blip' });
    K.pulse(g, 510, 700, 260, wd(id, 'file'), { before: dw, hold: 0.5 });
    // two saves race to the same line
    const slot = 540 + 4 * 58;
    const s1 = W(g), s2 = W(g);
    K.pill(s1, 250, slot - 32, 'save #4102', { fill: C.blue, size: 24, padX: 12, padY: 12 });
    K.pill(s2, 650, slot - 32, 'save #4103', { fill: C.red, size: 24, padX: 12, padY: 12 });
    K.slideIn(s1, wd(id, 'two') - 0.05, 'left', 600, { dur: 0.28, ease: 'power2.out' });
    K.slideIn(s2, wd(id, 'saves'), 'right', 600, { dur: 0.28, ease: 'power2.out' });
    const tT = wd(id, 'trample');
    X.tl.to(s1, { x: 120, duration: 0.18, ease: 'power2.in' }, tT - 0.18);
    X.tl.to(s2, { x: -260, duration: 0.18, ease: 'power2.in' }, tT - 0.18);
    const garb = K.mono(dw, 318, slot, '', { size: 28, weight: 700, fill: C.red });
    X.tl.set(garb, { textContent: '#4103  sour#4102dou' }, tT);
    X.tl.set(garb, { textContent: '#41█2  so█rdough ×█' }, tT + 0.1);
    X.tl.set(garb, { textContent: '#4103  sour#4102dou' }, tT + 0.2);
    K.flyOut(s1, tT + 0.04, -300, -200, 0.2); K.flyOut(s2, tT + 0.04, 300, -200, 0.2);
    X.sfx(tT, 'glitch', { gain: 0.4 });
    K.shake(dw, tT, 12, 0.4);
    K.papers(g, 510, slot, 9, tT, { dist: 420, dur: 1.0, seed: 6 });
    K.pulse(g, 510, slot, 200, tT, { before: dw, hold: 0.5 });
    m.face(tT, 'dizzy'); m.squash(tT);
    K.jitter(m.jit, wd(id, 'two') - 0.1, t1, 6, 4);
    [[800, 900], [1010, 880], [905, 830]].forEach(([x, y], i) => { const q = W(g); K.qmark(q, x, y, 64); K.pop(q, tT + 0.15 + i * 0.1, { gain: 0.15 }); });
    // density
    K.say(g, 640, 880, 'saving…', wd(id, 'saves'), { tail: 'right', size: 30, out: wd(id, 'trample') - 0.02 });
    const lww = W(g); K.pill(lww, 300, 1010, 'LAST WRITE WINS', { fill: C.red, size: 24, padX: 16, padY: 14, font: K.F.label, weight: 800 });
    K.pop(lww, wd(id, 'each'), { sfx: 'stamp', gain: 0.25 });
    // stream: orders keep arriving into the one file
    K.stream(g, 6, (it, i) => K.ticket(it, -80, -32, `#40${98 + i}`, { w: 160, stub: C.blue }), (u) => [110 + u * 200, 640 + u * 30], wd(id, 'every'), 0.35, 0.6, { fade: true, scale: (u) => 1 - u * 0.6, until: wd(id, 'two') });
  });
  // ================================================================ 07 database (wide pipeline, no presenter)
  chap(6, (g, o, t0, t1, id) => {
    const sw = W(g);
    miniStack(sw, 50, 420, 300, 3, wd(id, 'database'), { rh: 40, size: 20 });
    const belt = W(g);
    const cv = K.conveyor(belt, 30, 1110, 1020, ['01 CHECK', '02 RESERVE', '03 WRITE', '04 COMMIT']);
    K.slideIn(belt, t0 + 0.02, 'down', 700, { dur: 0.26 });
    const gate = W(g); K.station(gate, 70, 800, 200, 310, 'CHECK');
    K.slideIn(gate, t0 + 0.12, 'up', 500, { dur: 0.22, sfx: 'slide' });
    // crane rail with a padlock on the hook (reserve)
    const rail = W(g);
    K.rrect(rail, 380, 560, 660, 26, 13, C.dark, 3);
    for (let x = 400; x < 1030; x += 40) S('circle', { cx: x, cy: 573, r: 4, fill: '#666' }, rail);
    const trol = W(rail);
    K.rrect(trol, 420, 552, 80, 42, 8, C.dark2, 3);
    const lockArm = S('path', { d: 'M460,594 L460,700', ...K.stroke(4) }, trol);
    const lk = W(trol); K.padlock(lk, 460, 740, 0.8, { fill: C.red });
    K.slideIn(rail, t0 + 0.2, 'right', 700, { dur: 0.25, sfx: 'whoosh' });
    // database
    const dbw = W(g);
    const db = K.db(dbw, 600, 820, 200, 230, { label: '1,203 rows' });
    K.dropIn(dbw, wd(id, 'database') + 0.05, 700, { dur: 0.32 });
    // mascot at the end
    const mw = W(g);
    const m = K.mascot(mw, 950, 1100, 0.7, { hat: true });
    K.slideIn(mw, t0 + 0.3, 'right', 400, { dur: 0.24, sfx: false });
    // transaction bracket
    const br = W(g);
    const bracket = S('path', { d: 'M60,770 L60,740 L1020,740 L1020,770', fill: 'none', stroke: C.blue, 'stroke-width': 4, 'stroke-dasharray': '14 10' }, br);
    const tl = W(br); K.pill(tl, 540, 716, 'TRANSACTION', { anchor: 'middle', fill: C.blue, size: 20, padX: 14, padY: 12 });
    gsap.set(br, { autoAlpha: 0 });
    X.tl.set(br, { autoAlpha: 1 }, wd(id, 'transaction'));
    X.tl.fromTo(bracket, { attr: { 'stroke-dashoffset': 600 }, opacity: 0 }, { attr: { 'stroke-dashoffset': 0 }, opacity: 1, duration: 0.3, immediateRender: false }, wd(id, 'transaction'));
    K.pop(tl, wd(id, 'transaction') + 0.05, { sfx: 'swoosh' });
    // order ticket rides the belt
    const tk = W(g);
    K.ticket(tk, 80, 1036, '#4102', { sub: 'sourdough ×1', w: 160 });
    gsap.set(tk, { autoAlpha: 0, y: -200 });
    X.tl.set(tk, { autoAlpha: 1 }, wd(id, 'order') - 0.1);
    X.tl.to(tk, { y: 0, duration: 0.25, ease: 'bounce.out' }, wd(id, 'order') - 0.1);
    X.sfx(wd(id, 'order') + 0.1, 'drop', { gain: 0.3 });
    const tC = wd(id, 'check');
    K.camTo(g, tC - 0.15, 1.12, 160, 1000, 0.45);
    X.tl.to(tk, { x: 20, duration: 0.3, ease: 'power2.inOut' }, tC - 0.1);
    cv.light(tC, 0);
    const ok = W(g); K.pill(ok, 170, 950, 'stock: 1 ✓', { anchor: 'middle', fill: C.green, size: 20, padX: 12, padY: 12 });
    K.pop(ok, wd(id, 'stock'), { sfx: 'ding', gain: 0.25 });
    K.pulse(g, 170, 960, 130, wd(id, 'stock'), { hold: 0.5 });
    const tR = wd(id, 'reserve');
    K.camTo(g, tR - 0.15, 1.12, 440, 1000, 0.45);
    X.tl.to(tk, { x: 300, duration: 0.35, ease: 'power2.inOut' }, tR - 0.1);
    cv.light(tR, 0, false); cv.light(tR, 1);
    X.tl.to(trol, { x: 0, duration: 0.25, ease: 'power2.inOut' }, tR - 0.1);
    X.tl.to(lockArm, { attr: { d: 'M460,594 L460,940' }, duration: 0.25, ease: 'power2.in' }, wd(id, 'loaf') - 0.25);
    X.tl.to(lk, { y: 240, duration: 0.25, ease: 'power2.in' }, wd(id, 'loaf') - 0.25);
    X.sfx(wd(id, 'loaf'), 'click', { gain: 0.45 });
    const tW = wd(id, 'write');
    K.camTo(g, tW - 0.1, 1.12, 700, 1000, 0.45);
    X.tl.to(lockArm, { attr: { d: 'M460,594 L460,700' }, duration: 0.2 }, tW - 0.15);
    X.tl.to(lk, { y: 0, duration: 0.2 }, tW - 0.15);
    X.tl.to(tk, { x: 560, duration: 0.3, ease: 'power2.inOut' }, tW - 0.05);
    X.tl.to(tk, { scale: 0.2, opacity: 0, transformOrigin: '50% 50%', duration: 0.15 }, tW + 0.25);
    cv.light(tW, 1, false); cv.light(tW, 2);
    X.tl.set(db.label, { textContent: '1,204 rows' }, wd(id, 'order', 1));
    X.tl.to(db.rows[0], { attr: { fill: C.green }, duration: 0.1 }, wd(id, 'order', 1));
    tick(wd(id, 'order', 1), 0.3);
    const tCm = wd(id, 'commit');
    K.camTo(g, tCm - 0.1, 1.12, 960, 1000, 0.35);
    K.camTo(g, wd(id, 'All') - 0.1, 1.0, 540, 1000, 0.45);
    cv.light(tCm, 2, false); cv.light(tCm, 3);
    const big = W(g); K.check(big, 950, 860, 34);
    K.pop(big, tCm, { sfx: 'success', gain: 0.35 });
    K.pulse(g, 950, 900, 170, tCm, { hold: 0.6 });
    m.face(tCm, 'grin'); m.armUp(tCm);
    // second order: none of it
    const tk2 = W(g);
    K.ticket(tk2, 80, 1036, '#4103', { sub: 'sourdough ×1', w: 160, stub: C.dark3 });
    gsap.set(tk2, { autoAlpha: 0, y: -200 });
    X.tl.set(tk2, { autoAlpha: 1 }, wd(id, 'All') - 0.05);
    X.tl.to(tk2, { y: 0, duration: 0.22, ease: 'bounce.out' }, wd(id, 'All') - 0.05);
    X.tl.to(tk2, { x: 20, duration: 0.2 }, wx(id, 'or') - 0.15);
    const no = W(g); K.pill(no, 170, 890, 'stock: 0 ✗', { anchor: 'middle', fill: C.red, size: 20, padX: 12, padY: 12 });
    K.pop(no, wx(id, 'or'), { sfx: 'error', gain: 0.3 });
    K.pulse(g, 170, 900, 130, wx(id, 'or'), { hold: 0.5 });
    X.tl.to(tk2, { x: -40, rotation: -6, duration: 0.2, ease: 'back.out(3)', transformOrigin: '50% 50%' }, wd(id, 'none'));
    X.tl.to(tk2, { opacity: 0.35, duration: 0.2 }, wd(id, 'none') + 0.2);
    const rb = W(g); K.pill(rb, 60, 990, 'rolled back', { fill: '#8d8a84', size: 18, padX: 10, padY: 10 });
    K.pop(rb, wd(id, 'none') + 0.1, { sfx: 'blip_down', gain: 0.25 });
    // density: a SQL log types one statement per stage
    const sql = W(g);
    K.rrect(sql, 566, 386, 470, 150, 12, C.shadow, 0);
    K.rrect(sql, 560, 380, 470, 150, 12, '#17181d', 3);
    K.mono(sql, 580, 410, 'orders db · log', { size: 16, fill: '#8d909a', weight: 600 });
    K.slideIn(sql, wd(id, 'transaction') - 0.1, 'right', 600, { sfx: 'slide' });
    const sq = [['BEGIN', 'transaction'], ['SELECT stock → 1', 'stock'], ['UPDATE stock = 0', 'loaf'], ['INSERT order #4102', 'write'], ['COMMIT ✓', 'commit'], ['ROLLBACK #4103', 'none']];
    const sqEl = [0, 1, 2].map((i) => K.mono(sql, 580, 446 + i * 32, '', { size: 22, weight: 600, fill: '#e9e7e2' }));
    sq.forEach(([str, w], i) => {
      const tt = w === 'none' ? wd(id, 'none') : wd(id, w);
      const el = sqEl[i % 3];
      if (i >= 3) X.tl.set(sqEl, { textContent: '' }, tt - 0.01);
      K.type(el, str, tt, 70, i === 0);
      if (str.startsWith('COMMIT')) X.tl.set(el, { attr: { fill: '#7fe0a0' } }, tt);
      if (str.startsWith('ROLLBACK')) X.tl.set(el, { attr: { fill: '#ff8a7a' } }, tt);
    });
  });

  // ================================================================ 08 exactly once
  chap(7, (g, o, t0, t1, id) => {
    const w1 = W(g);
    const a = K.window(w1, 260, 440, 420, 360, 'crumbwell.shop');
    K.check(w1, 316, 566, 30);
    K.text(w1, 360, 578, 'Order confirmed', { size: 32, weight: 800 });
    K.loaf(w1, 326, 680, 0.75);
    K.mono(w1, 374, 692, 'sourdough ×1', { size: 24, weight: 600, fill: '#6b6862' });
    K.dropIn(w1, t0 + 0.04, 900, { dur: 0.32, ease: 'back.out(1.3)', sfx: 'pop' });
    const p1w = W(g); K.person(p1w, 450, 1300, 1.45, { skin: C.skin4, shirt: C.green, hairC: '#b38b5d', phone: true });
    K.slideIn(p1w, t0 + 0.12, 'down', 500, { dur: 0.22 });
    const x1 = W(g); K.excl(x1, 668, 450, 36, C.blue, '1');
    K.pop(x1, wd(id, 'exactly'), { sfx: 'ding', gain: 0.3 });
    K.pulse(g, 470, 620, 230, wd(id, 'exactly'), { before: w1, hold: 0.7 });
    const w2 = W(g);
    K.window(w2, 700, 520, 360, 320, 'crumbwell.shop');
    K.loaf(w2, 760, 646, 0.7);
    K.text(w2, 806, 658, 'sourdough', { size: 28, weight: 700, fill: '#9a978f' });
    const so = W(w2); K.pill(so, 880, 740, 'SOLD OUT', { anchor: 'middle', fill: '#8d8a84', size: 28, padX: 18, padY: 16, font: K.F.label, weight: 900 });
    K.slideIn(w2, wd(id, 'second') - 0.08, 'right', 500, { dur: 0.26, sfx: 'pop' });
    K.pop(so, wd(id, 'sold'), { sfx: 'stamp', gain: 0.25 });
    const p2w = W(g); K.person(p2w, 890, 1300, 1.4, { skin: C.skin3, shirt: C.orange, cap: C.navy, phone: true });
    K.slideIn(p2w, wd(id, 'person') - 0.1, 'right', 500, { dur: 0.22 });
    // but: one disk
    const tBut = wd(id, 'But');
    [w1, x1, p1w].forEach((e, i) => K.flyOut(e, tBut + i * 0.03, -700, 0));
    [w2, p2w].forEach((e, i) => K.flyOut(e, tBut + 0.05 + i * 0.03, 700, 0));
    X.sfx(tBut, 'whoosh', { gain: 0.3 });
    const sv = W(g);
    K.serverBox(sv, 330, 760, 380, 190, { label: 'SERVER' });
    K.dropIn(sv, wd(id, 'all') - 0.05, 900, { dur: 0.32, sfx: 'thud' });
    const hd = W(g); K.hdd(hd, 870, 850, 0.95);
    K.pulse(g, 870, 850, 170, wd(id, 'disk') - 0.05, { before: hd, hold: 0.8 });
    K.pop(hd, wd(id, 'disk') - 0.1, { sfx: 'blip_up' });
    const lab = W(g); K.pill(lab, 870, 1010, '1 disk', { anchor: 'middle', fill: C.red, size: 26, padX: 16, padY: 14 });
    K.pop(lab, wd(id, 'disk') + 0.1, { gain: 0.2 });
    // density
    const aw = W(g); K.bubble(aw, 700, 930, 'aww, sold out', { size: 28, tail: 'right' });
    K.pop(aw, wd(id, 'sees'), { sfx: 'bubble', gain: 0.2 }); K.popOut(aw, wd(id, 'But') - 0.05);
    const spf = W(g); K.pill(spf, 330, 1010, '1 disk = 1 point of failure', { fill: C.red, size: 22, padX: 14, padY: 14, font: K.F.label, weight: 800 });
    K.pop(spf, wx(id, 'one'), { sfx: 'error', gain: 0.25 });
  });

  // ================================================================ 09 2 a.m.
  chap(8, (g, o, t0, t1, id) => {
    const ck = W(g); K.clock(ck, 400, 560, 76, [2, 0]);
    K.dropIn(ck, t0 + 0.04, 600, { dur: 0.3, sfx: 'tick' });
    const mo = W(g); K.moon(mo, 590, 520, 52);
    [[640, 470], [700, 560], [600, 600]].forEach(([x, y], i) => K.sparkle(mo, x, y, 0.7, C.yellow2));
    K.pop(mo, wd(id, 'two') + 0.12, { gain: 0.15 });
    const sv = W(g);
    const box = K.serverBox(sv, 300, 900, 400, 200, { label: 'SERVER', disp: 'zzz' });
    K.slideIn(sv, t0 + 0.08, 'left', 600, { dur: 0.26 });
    const mw = W(g);
    const m = K.mascot(mw, 500, 870, 0.9, { face: 'sleep', hat: true });
    K.slideIn(mw, t0 + 0.08, 'left', 600, { dur: 0.26, sfx: false });
    const z = W(g);
    ['z', 'Z', 'Z'].forEach((c, i) => K.text(z, 600 + i * 26, 700 - i * 30, c, { size: 30 + i * 8, weight: 900, fill: C.blue }));
    X.every((t) => { if (t > t0 && t < t1) z.setAttribute('transform', `translate(0 ${(-((t * 30) % 20)).toFixed(1)})`); });
    const hd = W(g); const disk = K.hdd(hd, 880, 900, 1.0);
    K.slideIn(hd, t0 + 0.16, 'right', 500, { dur: 0.26 });
    gsap.set(disk.crack, { attr: { 'stroke-dasharray': 400, 'stroke-dashoffset': 400 } });
    const tD = wd(id, 'dies');
    X.tl.to(disk.crack, { attr: { 'stroke-dashoffset': 0 }, duration: 0.18, ease: 'power2.in' }, tD - 0.15);
    X.sfx(tD - 0.1, 'impact', { gain: 0.45 });
    K.shake(hd, tD, 10, 0.4); K.shake(sv, tD, 6, 0.3);
    box.leds.forEach((l) => X.tl.set(l, { attr: { fill: C.red } }, tD));
    X.tl.set(box.disp, { textContent: 'DISK FAIL', attr: { fill: '#ff7a6b' } }, tD);
    K.puff(g, 880, 760, tD, 1.4);
    K.pulse(g, 880, 900, 200, tD, { before: hd, hold: 1.0 });
    m.face(tD, 'shock'); m.hop(tD, 30);
    K.jitter(m.jit, tD + 0.3, t1, 8, 5);
    X.tl.set(z, { autoAlpha: 0 }, tD);
    // orders die with it
    const tO = wd(id, 'orders');
    const ctr = W(g);
    const cnt = K.text(ctr, 850, 480, 'orders: 2,814', { size: 48, weight: 900, font: 'Oswald, sans-serif', fill: C.red, anchor: 'middle' });
    K.pop(ctr, wd(id, 'three'), { sfx: 'blip' });
    X.countUp(cnt, 2814, 0, tO, 0.6, (v) => 'orders: ' + Math.round(v).toLocaleString('en-US'));
    X.sfx(tO, 'blip_down', { gain: 0.3 });
    K.papers(g, 510, 980, 16, wd(id, 'three'), { dist: 520, dur: 1.3, seed: 3 });
    // density
    K.say(g, 560, 640, 'zzz… huh?!', wd(id, 'dies') + 0.1, { tail: 'left', size: 30 });
    K.still(sv, mw, hd);
  });

  // ================================================================ 10 backups
  chap(9, (g, o, t0, t1, id) => {
    const sw = W(g);
    miniStack(sw, 248, 1020, 250, 4, wd(id, 'backups'), { rh: 36, size: 18 });
    const dbw = W(g);
    K.db(dbw, 590, 780, 190, 200, { label: 'orders db' });
    K.dropIn(dbw, t0 + 0.03, 800, { dur: 0.3 });
    const mw = W(g); const m = K.mascot(mw, 975, 1250, 0.7, { hat: true });
    K.slideIn(mw, t0 + 0.12, 'right', 400, { dur: 0.24, sfx: false });
    const dests = [[300, 'SAME SERVER', 'srv'], [540, 'OTHER DISK', 'disk'], [790, 'OTHER CITY', 'city']];
    const cards = dests.map(([x, lab, kind], i) => {
      const c = W(g);
      K.card(c, x, 430, 230, 150, { r: 16 });
      if (kind === 'srv') { K.rrect(c, x + 85, 460, 60, 62, 6, C.dark, 3); S('circle', { cx: x + 130, cy: 476, r: 4, fill: '#3fd48a' }, c); }
      if (kind === 'disk') { const hh = G(c, { transform: `translate(${x + 115} 492) scale(0.34)` }); K.hdd(hh, 0, 0, 1); }
      if (kind === 'city') { [[0, 50], [26, 70], [52, 40]].forEach(([dx, h]) => S('rect', { x: x + 76 + dx, y: 522 - h, width: 24, height: h, fill: '#dfe6f3', ...K.stroke(2.5) }, c)); }
      K.mono(c, x + 115, 556, lab, { size: 19, weight: 700, anchor: 'middle', ls: 1 });
      K.dropIn(c, wd(id, 'three') - 0.05 + i * 0.08, 600, { dur: 0.3, sfx: i ? false : 'drop' });
      return c;
    });
    const ctr = W(g);
    K.card(ctr, 850, 860, 190, 120, { r: 14 });
    K.mono(ctr, 945, 892, 'COPIES', { size: 17, weight: 700, anchor: 'middle', fill: '#8d8a84', ls: 2 });
    const n = K.text(ctr, 945, 955, '0/3', { size: 54, weight: 900, anchor: 'middle', font: 'Oswald, sans-serif' });
    K.slideIn(ctr, wd(id, 'three') + 0.15, 'right', 400, { dur: 0.24, gain: 0.2 });
    K.pulse(g, 945, 920, 140, wd(id, 'city') + 0.15, { hold: 0.7 });
    const arrive = [wd(id, 'copies') + 0.35, wd(id, 'storage') + 0.2, wd(id, 'city') + 0.15];
    dests.forEach(([x], i) => {
      const ex = x + 115, ey = 582, sx = 685, sy = 770;
      const path = S('path', { d: `M${sx},${sy} C${sx},${sy - 110} ${ex},${ey + 110} ${ex},${ey}`, fill: 'none', stroke: C.dark2, 'stroke-width': 7, 'stroke-dasharray': '12 9' }, g);
      K.march(path, 60);
      gsap.set(path, { opacity: 0 });
      X.tl.to(path, { opacity: 1, duration: 0.15 }, wd(id, 'copies') - 0.1 + i * 0.08);
      const pk = W(g);
      K.rrect(pk, -18, -14, 36, 28, 5, C.blue, 2.5);
      gsap.set(pk, { autoAlpha: 0 });
      const ta = arrive[i] - 0.4;
      X.tl.set(pk, { autoAlpha: 1 }, ta);
      const L = path.getTotalLength();
      const prox = { u: 0 };
      X.tl.to(prox, { u: 1, duration: 0.4, ease: 'power1.inOut', onUpdate: () => { const pt = path.getPointAtLength(prox.u * L); pk.setAttribute('transform', `translate(${pt.x} ${pt.y})`); } }, ta);
      X.tl.set(pk, { autoAlpha: 0 }, arrive[i]);
      const ck = K.check(cards[i], x + 205, 452, 18);
      gsap.set(ck, { scale: 0, transformOrigin: '50% 50%' });
      X.tl.to(ck, { scale: 1, duration: 0.25, ease: 'back.out(3)' }, arrive[i]);
      X.tl.set(n, { textContent: `${i + 1}/3`, attr: { fill: i === 2 ? C.green : C.ink } }, arrive[i]);
      X.sfx(arrive[i], i === 2 ? 'success' : 'blip_up', { gain: 0.3 });
      K.pulse(g, x + 115, 505, 110, arrive[i], { hold: 0.4 });
      K.restage(pk, arrive[i] - 0.01, {}, 0.01);
    });
    gsap.set(g, { scale: 1.25, svgOrigin: '680 900' });
    K.camTo(g, wd(id, 'three') - 0.2, 1.0, 680, 900, 0.5);
    // restore test
    const rs = W(g); K.pill(rs, 560, 1040, 'RESTORE TEST ✓', { fill: C.green, size: 20, padX: 14, padY: 12 });
    K.pop(rs, wd(id, 'restore'), { sfx: 'ding', gain: 0.3 });
    K.pulse(g, 680, 900, 170, wd(id, 'restore'), { before: dbw, hold: 0.6 });
    const back = W(g); const ar = S('path', { d: 'M905,600 C905,700 780,760 760,800', fill: 'none', stroke: C.green, 'stroke-width': 5, 'stroke-linecap': 'round' }, back);
    S('path', { d: 'M772,786 l-14,18 l22,0', fill: 'none', stroke: C.green, 'stroke-width': 5, 'stroke-linecap': 'round' }, back);
    K.show(back, wd(id, 'test'));
    X.drawOn(ar, wd(id, 'test'), 0.3);
    // bad morning, not a dead bakery
    const mg = W(g); K.mug(mg, 780, 1190, 1.3);
    K.dropIn(mg, wd(id, 'morning') - 0.1, 500, { dur: 0.3, sfx: 'pop' });
    m.face(wd(id, 'dead'), 'worried'); m.face(wd(id, 'not'), 'grin'); m.hop(wd(id, 'bakery'));
    const bk = W(g);
    K.pill(bk, 860, 990, 'bakery ✓', { fill: '#fff', color: C.ink, sw: 3, size: 22, padX: 12, padY: 12 });
    K.pop(bk, wd(id, 'bakery'), { sfx: 'success', gain: 0.25 });
    // density
    K.say(g, 740, 1080, 'phew.', wd(id, 'not'), { tail: 'right', size: 30, sfx: 'pop' });
    // stream: copies keep flowing down every cable
    const cab = [...g.querySelectorAll('path')].filter((q) => q.getAttribute('stroke-dasharray') === '12 9');
    cab.forEach((c, j) => { const L = c.getTotalLength(); K.stream(g, 5, (it) => K.rrect(it, -20, -15, 40, 30, 6, C.blue, 2.5), (u) => { const pt = c.getPointAtLength(u * L); return [pt.x, pt.y]; }, wd(id, 'two') + j * 0.12, 0.42, 0.55, { sfx: false, until: wd(id, 'Now') }); });
  });

  // ================================================================ 11 café wifi
  chap(10, (g, o, t0, t1, id) => {
    const sign = W(g);
    K.rrect(sign, 270, 1030, 260, 70, 12, C.dark, 3);
    K.text(sign, 300, 1078, 'CAFÉ', { size: 34, weight: 900, fill: '#fff', font: 'Oswald, sans-serif', ls: 2 });
    const wf = K.wifi(sign, 470, 1086, 0.55, '#fff');
    K.dropIn(sign, wd(id, 'café') - 0.08, 500, { dur: 0.3, sfx: 'pop' });
    // window with a card form and the warning
    const ww = W(g);
    const win = K.window(ww, 260, 450, 560, 360, 'checkout', { addr: true });
    win.addr.textContent = 'crumbwell.shop/pay';
    K.mono(ww, 300, 680, 'card', { size: 20, fill: '#8d8a84', weight: 600 });
    K.rrect(ww, 300, 694, 460, 52, 10, '#f6f4f0', 2.5);
    const cardTxt = K.mono(ww, 318, 730, '', { size: 24, weight: 600 });
    K.dropIn(ww, wd(id, 'pays') - 0.15, 900, { dur: 0.32, ease: 'back.out(1.3)', sfx: 'pop' });
    K.type(cardTxt, '1234 5678 9012 3456', wd(id, 'pays') + 0.15, 30);
    const warn = W(g);
    K.pill(warn, 600, 540, '⚠ Not secure', { fill: C.red, size: 22, padX: 12, padY: 12, font: K.F.label, weight: 800 });
    K.slideIn(warn, wd(id, 'not') - 0.05, 'right', 300, { dur: 0.18, sfx: 'error' });
    K.pulse(g, 680, 560, 160, wd(id, 'not'), { before: ww, hold: 0.8 });
    K.shake(ww, wd(id, 'secure'), 8, 0.3);
    // customer at a table
    const cw = W(g);
    K.person(cw, 420, 1280, 1.35, { skin: C.skin1, shirt: C.blue, hairC: '#2a1d19', phone: true });
    S('rect', { x: 250, y: 1262, width: 400, height: 20, rx: 6, fill: '#c89a64', ...K.stroke(3) }, cw);
    const cupw = W(cw); K.mug(cupw, 590, 1260, 0.85);
    K.slideIn(cw, wd(id, 'customer') - 0.05, 'left', 600, { dur: 0.22 });
    // snoop with a magnifier
    const sn = W(g);
    K.snoop(sn, 930, 1280, 1.3);
    gsap.set(sn, { x: 480, autoAlpha: 0 }); X.tl.set(sn, { autoAlpha: 1 }, wd(id, 'because') - 0.2);
    X.tl.to(sn, { x: 0, duration: 0.6, ease: 'power2.out' }, wd(id, 'because') - 0.2); X.sfx(wd(id, 'because') - 0.2, 'slide', { gain: 0.25 });
    // postcard crosses the room
    const pcw = W(g);
    K.card(pcw, 0, 0, 230, 110, { r: 8 });
    K.pill(pcw, 14, 12, 'HTTP', { fill: C.red, size: 16, padX: 8, padY: 8 });
    K.mono(pcw, 16, 80, 'card 1234 5678', { size: 19, weight: 700 });
    gsap.set(pcw, { x: 360, y: 850, autoAlpha: 0, rotation: -4 });
    const tX = wd(id, 'crosses');
    X.tl.set(pcw, { autoAlpha: 1 }, wd(id, 'plain') - 0.05);
    X.tl.to(pcw, { x: 640, y: 870, rotation: 3, duration: 0.8, ease: 'power1.inOut' }, tX - 0.25);
    X.sfx(tX - 0.25, 'swoosh', { gain: 0.3 });
    const mg = W(g); K.magnifier(mg, 0, 0, 62);
    gsap.set(mg, { x: 1000, y: 1050, autoAlpha: 0 });
    X.tl.set(mg, { autoAlpha: 1 }, wd(id, 'because'));
    X.tl.to(mg, { x: 760, y: 930, duration: 0.5, ease: 'power2.inOut' }, wd(id, 'room') - 0.2);
    // readable: big zoom bubble
    const zb = W(o);
    K.card(zb, 610, 640, 400, 120, { r: 60 });
    K.mono(zb, 810, 716, 'card 1234 5678', { size: 30, weight: 800, anchor: 'middle', fill: C.red });
    K.pop(zb, wd(id, 'readable'), { sfx: 'ding', gain: 0.3 });
    K.pulse(o, 810, 700, 240, wd(id, 'readable'), { hold: 0.8 });
    const ex = W(o); K.excl(ex, 1000, 640, 24);
    K.pop(ex, wd(id, 'text') + 0.05, { sfx: 'error', gain: 0.25 });
    X.every((t) => { if (t > t0 && t < t1) wf.arcs.forEach((a, i) => a.setAttribute('opacity', (0.4 + 0.6 * ((Math.floor(t * 4) + i) % 3 === 0 ? 1 : 0.3)).toFixed(2))); });
    // density: more cards cross the room in the clear, the customer is paying
    const pay = W(g); K.bubble(pay, 290, 960, 'paying…', { size: 30, tail: 'right' });
    K.pop(pay, wd(id, 'pays'), { sfx: 'bubble', gain: 0.2 }); K.popOut(pay, wd(id, 'browser'));
    [1, 2].forEach((k) => {
      const pc = W(g); K.card(pc, 0, 0, 200, 96, { r: 8 }); K.pill(pc, 12, 10, 'HTTP', { fill: C.red, size: 14, padX: 7, padY: 7 }); K.mono(pc, 14, 72, 'name: Sam', { size: 18, weight: 700 });
      gsap.set(pc, { x: 360, y: 850, autoAlpha: 0, rotation: -4 });
      const ts = wd(id, 'crosses') - 0.25 + k * 0.35;
      X.tl.set(pc, { autoAlpha: 1 }, ts);
      X.tl.to(pc, { x: 600 + k * 30, y: 820 + k * 70, rotation: 3, duration: 0.6, ease: 'power1.inOut' }, ts);
      X.sfx(ts, 'swoosh', { gain: 0.15 });
    });
    // stream: every request crosses the room in the clear
    K.stream(g, 8, (it, i) => { K.card(it, -100, -46, 200, 92, { r: 8 }); K.pill(it, -88, -36, 'HTTP', { fill: C.red, size: 14, padX: 7, padY: 7 }); K.mono(it, -86, 26, i % 2 ? 'card 1234…' : 'name: Sam', { size: 18, weight: 700 }); }, (u, i) => [420 + u * 420, 900 + Math.sin(u * 3.14) * -60 + (i % 3) * 40], wd(id, 'HTTP'), 0.3, 0.9, { fade: true });
  });

  // ================================================================ 12 https
  chap(11, (g, o, t0, t1, id) => {
    const sw = W(g);
    miniStack(sw, 248, 960, 250, 5, wd(id, 'HTTPS'), { rh: 36, size: 18 });
    const ce = W(g);
    const cc = K.card(ce, 330, 450, 420, 270, { r: 14 });
    S('rect', { x: 344, y: 464, width: 392, height: 242, rx: 8, fill: 'none', stroke: C.blue2, 'stroke-width': 2, 'stroke-dasharray': '4 4' }, cc);
    K.text(cc, 540, 520, 'CERTIFICATE', { size: 34, weight: 900, anchor: 'middle', ls: 3, font: 'Oswald, sans-serif' });
    K.mono(cc, 540, 566, 'crumbwell.shop', { size: 26, weight: 700, anchor: 'middle', fill: C.blue });
    K.mono(cc, 540, 604, 'issued by a certificate authority', { size: 16, weight: 500, anchor: 'middle', fill: '#8d8a84' });
    const seal = G(cc); S('circle', { cx: 690, cy: 680, r: 34, fill: C.red, ...K.stroke(3) }, seal); S('path', { d: 'M674,708 l-10,40 l20,-12 l8,18 l6,-40', fill: C.red, ...K.stroke(2.5) }, seal);
    K.dropIn(ce, wd(id, 'certificate') - 0.12, 900, { dur: 0.32, ease: 'back.out(1.3)', sfx: 'paper' });
    K.pulse(g, 540, 585, 250, wd(id, 'proves'), { before: ce, hold: 0.8 });
    const vf = W(g); K.check(vf, 400, 680, 24);
    K.pop(vf, wd(id, 'yours'), { sfx: 'ding', gain: 0.3 });
    // lock closes
    const lw = W(g); const lock = K.padlock(lw, 900, 620, 1.5, { fill: '#c9ccd3' });
    gsap.set(lock.shackle, { y: -22 });
    K.pop(lw, wd(id, 'everything') - 0.1, { gain: 0.2 });
    X.tl.to(lock.shackle, { y: 0, duration: 0.12, ease: 'power3.in' }, wd(id, 'encrypted'));
    X.tl.set(lock.querySelector('rect'), { attr: { fill: C.green } }, wd(id, 'encrypted') + 0.12);
    X.sfx(wd(id, 'encrypted') + 0.12, 'click', { gain: 0.5 });
    K.pulse(g, 900, 640, 140, wd(id, 'encrypted') + 0.1, { before: lw, hold: 0.6, fill: C.greenL });
    // sealed envelope crosses the room
    const ev = W(g); K.envelope(ev, 0, 0, 220, 140, { seal: true });
    gsap.set(ev, { x: 330, y: 820, autoAlpha: 0 });
    X.tl.set(ev, { autoAlpha: 1 }, wd(id, 'everything'));
    X.tl.to(ev, { x: 600, y: 850, duration: 0.8, ease: 'power1.inOut' }, wd(id, 'gets'));
    X.sfx(wd(id, 'gets'), 'swoosh', { gain: 0.3 });
    const sn = W(g); K.snoop(sn, 930, 1280, 1.3);
    K.slideIn(sn, wd(id, 'everything'), 'right', 400, { dur: 0.22, sfx: false });
    const mg = W(g); K.magnifier(mg, 760, 930, 62);
    K.slideIn(mg, wd(id, 'gets'), 'right', 400, { dur: 0.22, sfx: false });
    const zb = W(o);
    K.card(zb, 610, 990, 400, 120, { r: 60 });
    const noise = K.mono(zb, 810, 1066, 'x9#qL@7!vz%2', { size: 30, weight: 800, anchor: 'middle', fill: '#8d8a84' });
    K.pop(zb, wd(id, 'listening'), { sfx: 'pop', gain: 0.25 });
    const glyphs = '#@%&*!?x9qLvz27K$';
    X.every((t) => { if (t > wd(id, 'listening') && t < t1) { const k = Math.floor(t * 12); let s = ''; for (let i = 0; i < 12; i++) s += glyphs[(k * 7 + i * 13) % glyphs.length]; noise.textContent = s; } });
    const st = K.stamp(o, 620, 1120, 'UNREADABLE', { size: 112, rot: -9 });
    K.pulse(o, 680, 1170, 230, wd(id, 'noise'), { hold: 0.7 });
    K.slam(st, wd(id, 'noise'));
    // density
    [1, 2].forEach((k) => {
      const e2 = W(g); K.envelope(e2, 0, 0, 180, 116, { seal: true });
      gsap.set(e2, { x: 330, y: 820, autoAlpha: 0 });
      const ts = wd(id, 'gets') + k * 0.32;
      X.tl.set(e2, { autoAlpha: 1 }, ts);
      X.tl.to(e2, { x: 560 + k * 20, y: 800 + k * 80, duration: 0.6, ease: 'power1.inOut' }, ts);
    });
    const enc = W(g); K.pill(enc, 800, 720, 'encrypted ✓', { fill: C.green, size: 22, padX: 14, padY: 14, font: K.F.label, weight: 800 });
    K.pop(enc, wd(id, 'encrypted') + 0.15, { sfx: 'ding', gain: 0.2 });
    // stream: now every request travels sealed
    K.stream(g, 8, (it) => K.envelope(it, -80, -52, 160, 104, { seal: true }), (u, i) => [420 + u * 400, 880 + Math.sin(u * 3.14) * -60 + (i % 3) * 40], wd(id, 'gets'), 0.3, 0.9, { fade: true });
  });

  // ================================================================ 13 far away
  chap(12, (g, o, t0, t1, id) => {
    const gw = W(g);
    K.globe(gw, 650, 800, 270);
    K.dropIn(gw, t0 + 0.03, 1000, { dur: 0.36, ease: 'back.out(1.2)', sfx: 'pop' });
    X.tl.fromTo(gw, { rotation: -4 }, { rotation: 3, duration: t1 - t0, ease: 'none', svgOrigin: '650 800', immediateRender: false }, t0);
    const op = W(g); K.pin(op, 560, 650, C.dark, 'your server');
    K.pop(op, t0 + 0.2, { sfx: 'drop', gain: 0.25 });
    const sy = W(g); K.pin(sy, 820, 960, C.red, 'Sydney');
    K.dropIn(sy, wd(id, 'Sydney') - 0.1, 300, { dur: 0.26, sfx: 'drop' });
    K.pulse(g, 820, 930, 120, wd(id, 'Sydney'), { before: gw, hold: 0.8 });
    const bl = W(g); K.person(bl, 940, 1290, 1.25, { skin: C.skin2, shirt: '#d06d8a', hairC: '#8a4a2c', phone: true });
    K.slideIn(bl, wd(id, 'blogger') - 0.05, 'right', 400, { dur: 0.2 });
    // the post
    const post = W(g);
    K.card(post, 800, 440, 230, 250, { r: 16 });
    K.photo(post, 820, 466, 190, 150);
    [0, 1, 2].forEach((i) => K.heart(post, 840 + i * 34, 650, 0.8));
    K.slideIn(post, wd(id, 'posts') - 0.05, 'right', 500, { dur: 0.24, sfx: 'notif' });
    // photos crawl along the arc
    const arc = S('path', { d: 'M560,612 C640,520 900,700 820,922', fill: 'none', stroke: C.red, 'stroke-width': 6, 'stroke-dasharray': '12 10' }, g);
    K.march(arc, 30);
    gsap.set(arc, { opacity: 0 });
    X.tl.to(arc, { opacity: 1, duration: 0.2 }, wd(id, 'every') - 0.1);
    const L = arc.getTotalLength();
    [0, 1, 2, 3, 4].forEach((i) => {
      const ph = W(g); K.photo(ph, -55, -40, 110, 80, i);
      gsap.set(ph, { autoAlpha: 0 });
      const ts = wd(id, 'photo') + i * 0.28;
      X.tl.set(ph, { autoAlpha: 1 }, ts);
      const pr = { u: 0 };
      X.tl.to(pr, { u: 0.92, duration: 2.6, ease: 'none', onUpdate: () => { const pt = arc.getPointAtLength(pr.u * L); ph.setAttribute('transform', `translate(${pt.x} ${pt.y})`); } }, ts);
      X.sfx(ts, 'slide', { gain: 0.15 });
    });
    const sv = W(g); const sm = G(sv, { transform: 'translate(470 640) scale(0.42)' }); K.miniServer(sm, 0, 0, 1);
    K.pop(sv, wd(id, 'small'), { sfx: 'blip' });
    // load time
    const lt = W(g);
    K.card(lt, 260, 1080, 270, 140, { r: 16 });
    K.mono(lt, 285, 1118, 'page load', { size: 19, weight: 600, fill: '#8d8a84' });
    const val = K.text(lt, 285, 1190, '0.4 s', { size: 62, weight: 900, font: 'Oswald, sans-serif', fill: C.red });
    const sp = S('path', { d: 'M478,1150 a22,22 0 1,1 -22,-22', fill: 'none', stroke: C.red, 'stroke-width': 6, 'stroke-linecap': 'round' }, lt);
    X.every((t) => { if (t > t0 && t < t1) sp.setAttribute('transform', `rotate(${(t * 360) % 360} 478 1150)`); });
    K.slideIn(lt, wd(id, 'Eight') - 0.25, 'left', 500, { dur: 0.22, sfx: 'pop' });
    K.pulse(g, 395, 1150, 170, wd(id, 'seconds'), { before: lt, hold: 0.8 });
    X.countUp(val, 0.4, 8, wd(id, 'Eight'), 0.6, (v) => v.toFixed(1) + ' s');
    X.sfx(wd(id, 'Eight'), 'riser', { gain: 0.25, dur: 0.6 });
    K.camTo(g, wd(id, 'Eight') - 0.1, 1.12, 640, 900, 0.5);
    K.papers(o, 640, 820, 10, wd(id, 'latency'), { dist: 500, dur: 1.0, seed: 31 });
    const st = K.stamp(o, 560, 820, 'LATENCY', { size: 170, rot: -9 });
    K.pulse(o, 640, 820, 260, wd(id, 'latency'), { hold: 0.6 });
    K.slam(st, wd(id, 'latency'));
    // density: likes keep climbing, the phone keeps loading
    const likes = K.text(post, 940, 666, '♥ 0', { size: 22, weight: 800, fill: C.red, anchor: 'middle' });
    K.flicker(likes, wd(id, 'posts'), t1, (k) => '♥ ' + (k * 37 + 12).toLocaleString('en-US'));
    K.say(g, 660, 1000, 'loading…', wd(id, 'crawls'), { tail: 'right', size: 30, out: wd(id, 'Eight') - 0.3 });
    // stream: photos crawl along the long arc
    K.stream(g, 9, (it, i) => K.photo(it, -50, -36, 100, 72, i), (u) => { const pt = arc.getPointAtLength(u * L); return [pt.x, pt.y]; }, wd(id, 'crawls'), 0.32, 1.6, { fade: true, ease: (u) => u });
    K.still(gw, op, sy, sv);
  });

  // ================================================================ 14 cdn
  chap(13, (g, o, t0, t1, id) => {
    const gw = W(g); K.globe(gw, 650, 760, 250);
    K.pulse(g, 650, 760, 300, wd(id, 'CDN'), { before: gw, hold: 0.7, fill: C.blueL });
    const sw = W(g); miniStack(sw, 248, 1040, 250, 6, wd(id, 'CDN'), { rh: 34, size: 17 });
    const op = W(g); K.pin(op, 565, 620, C.dark, 'origin');
    const edges = [[470, 700, 'edge'], [520, 900, 'edge'], [790, 640, 'edge'], [810, 900, 'Sydney']];
    const ew = edges.map(([x, y, lab], i) => {
      const e = W(g);
      const sm = G(e, { transform: `translate(${x} ${y}) scale(0.3)` }); K.miniServer(sm, 0, 0, 1);
      K.pill(e, x, y + 12, lab, { anchor: 'middle', fill: lab === 'Sydney' ? C.red : C.dark, size: 16, padX: 8, padY: 8 });
      K.dropIn(e, wd(id, 'servers') - 0.1 + i * 0.09, 500, { dur: 0.28, sfx: i ? false : 'drop' });
      return e;
    });
    // copies fly out
    [...edges, ...edges].forEach(([x, y], i) => {
      const ph = W(g); K.photo(ph, -48, -36, 96, 72, i);
      gsap.set(ph, { autoAlpha: 0, x: 565, y: 590 });
      const ts = wd(id, 'copies') + (i % 4) * 0.1 + (i >= 4 ? 0.7 : 0);
      X.tl.set(ph, { autoAlpha: 1 }, ts);
      X.tl.to(ph, { x, y: y - 80, duration: 0.4, ease: 'power2.out' }, ts);
      X.tl.to(ph, { autoAlpha: 0, duration: 0.15 }, ts + 0.9);
      X.sfx(ts, 'swoosh', { gain: 0.18, pitch: 1 + i * 0.1 });
    });
    // customers near each edge
    edges.forEach(([x, y], i) => {
      const c = W(g);
      [[-50, 30], [44, 40]].forEach(([dx, dy]) => { S('path', { d: `M${x},${y - 20} L${x + dx},${y + dy - 10}`, stroke: C.green, 'stroke-width': 3, 'stroke-dasharray': '4 5' }, c); S('circle', { cx: x + dx, cy: y + dy, r: 11, fill: C.skin2, ...K.stroke(2) }, c); });
      K.pop(c, wd(id, 'close') + i * 0.07, { gain: 0.12 });
    });
    // Sydney from Sydney
    const ring = S('circle', { cx: 810, cy: 870, r: 30, fill: 'none', stroke: C.green, 'stroke-width': 6, opacity: 0 }, g);
    X.tl.to(ring, { attr: { r: 110 }, opacity: 0.9, duration: 0.4 }, wd(id, 'Sydney'));
    X.tl.to(ring, { opacity: 0, duration: 0.3 }, wd(id, 'Sydney') + 0.4);
    const lt = W(g);
    K.card(lt, 760, 1080, 270, 140, { r: 16 });
    K.mono(lt, 785, 1118, 'page load', { size: 19, weight: 600, fill: '#8d8a84' });
    const val = K.text(lt, 785, 1190, '8.0 s', { size: 62, weight: 900, font: 'Oswald, sans-serif', fill: C.red });
    K.slideIn(lt, wd(id, 'customer') - 0.1, 'right', 500, { dur: 0.22, sfx: 'pop' });
    K.pulse(g, 895, 1150, 170, wd(id, 'loads'), { before: lt, hold: 0.8, fill: C.greenL });
    X.countUp(val, 8, 0.6, wd(id, 'loads'), 0.5, (v) => v.toFixed(1) + ' s');
    X.tl.set(val, { attr: { fill: C.green } }, wd(id, 'loads') + 0.5);
    X.sfx(wd(id, 'loads'), 'zoom_out', { gain: 0.25 });
    const ck = W(g); K.check(ck, 1000, 1110, 22);
    K.pop(ck, wd(id, 'Sydney', 1), { sfx: 'success', gain: 0.3 });
    // density
    edges.forEach(([x, y], i) => { const c = W(g); K.pill(c, x, y - 120, 'cached ✓', { anchor: 'middle', fill: C.green, size: 16, padX: 8, padY: 8 }); K.pop(c, wd(id, 'close') + 0.25 + i * 0.08, { sfx: i ? false : 'blip_up', gain: 0.15 }); });
    // stream: copies keep landing on the edge servers
    edges.forEach(([x, y], j) => K.stream(g, 4, (it, i) => K.photo(it, -40, -30, 80, 60, i + j), (u) => [565 + (x - 565) * u, 590 + (y - 80 - 590) * u], wd(id, 'images') + j * 0.1, 0.45, 0.5, { fade: true, sfx: false }));
    K.still(gw, op, ...ew);
  });

  // ================================================================ 15 saturday (zoomed crowd, no presenter)
  chap(14, (g, o, t0, t1, id) => {
    gsap.set(g, { scale: 1.0, svgOrigin: '540 1260' });
    K.camTo(g, wd(id, 'people') - 0.2, 1.1, 540, 1260, 1.2, 'power2.inOut');
    const cal = W(g); K.calendar(cal, 60, 400, 'SATURDAY', '9:00', { w: 230, h: 220, bigSize: 84, sub: 'morning' });
    K.pop(cal, t0 + 0.03, { sfx: 'paper', dur: 0.25 });
    const ckw = W(g); const ck = K.clock(ckw, 380, 500, 56, [9, 0]);
    K.pop(ckw, wd(id, 'hits') - 0.1, { sfx: 'pop' });
    K.shake(ckw, wd(id, 'hits'), 6, 0.6);
    X.sfx(wd(id, 'hits'), 'beep', { gain: 0.3 });
    const tvw = W(g); const tv = K.tv(tvw, 600, 420, 200, 140);
    K.logo(tvw, tv.screen.x + tv.screen.w / 2, tv.screen.y + tv.screen.h / 2, 1.1);
    K.pop(tvw, wd(id, 'TV'), { sfx: 'pop' });
    const ot = W(g); K.bubble(ot, 640, 300, 'on TV!', { size: 26, red: true });
    K.pop(ot, wd(id, 'mentions'), { gain: 0.2 });
    const ctr = W(g);
    K.card(ctr, 830, 380, 220, 170, { r: 16 });
    K.mono(ctr, 850, 418, '// visitors now', { size: 17, weight: 600, fill: '#8d8a84' });
    const n = K.text(ctr, 940, 506, '0', { size: 76, weight: 900, font: 'Oswald, sans-serif', anchor: 'middle' });
    K.pop(ctr, wd(id, 'show'), { gain: 0.2 });
    X.countUp(n, 0, 2000, wd(id, 'two') - 0.1, 0.7);
    X.sfx(wd(id, 'two') - 0.1, 'riser', { gain: 0.3, dur: 0.7 });
    const sm = W(g); K.pill(sm, 940, 560, 'SAME MINUTE', { anchor: 'middle', fill: C.red, size: 18, padX: 10, padY: 10 });
    K.pop(sm, wd(id, 'minute'), { sfx: 'blip_up' });
    // server + mascot in the middle
    const sv = W(g);
    const box = K.serverBox(sv, 370, 760, 330, 150, { label: 'SERVER', rpm: 500 });
    const mw = W(g); const m = K.mascot(mw, 535, 738, 0.66, { face: 'worried', hat: true });
    K.pop(sv, wd(id, 'TV') + 0.2, { gain: 0.15 });
    K.pop(mw, wd(id, 'TV') + 0.3, { sfx: false });
    // crowd rises
    const clip = S('clipPath', { id: 'crowdclip' }, X.defs); S('rect', { x: -200, y: 0, width: 1480, height: 1265 }, clip);
    const cwc = G(g, { 'clip-path': 'url(#crowdclip)' });
    const cw = W(cwc);
    const crowd = K.crowd(cw, -40, 1120, 800, 8, 0.42, 31);
    gsap.set(cw, { y: 560, autoAlpha: 0 });
    X.tl.set(cw, { autoAlpha: 1 }, wd(id, 'people') - 0.15);
    X.tl.to(cw, { y: 0, duration: 0.9, ease: 'power2.out' }, wd(id, 'people') - 0.15);
    X.sfx(wd(id, 'people') - 0.15, 'whoosh', { gain: 0.35, dur: 0.8 });
    const qs = [[60, 800, 'sourdough?'], [720, 820, 'are you open?'], [250, 920, 'one croissant!'], [820, 950, 'hello??']];
    qs.forEach(([x, y, s], i) => { const b = W(o); K.bubble(b, x, y, s, { size: 26 }); K.pop(b, wd(id, 'open') + i * 0.14, { gain: 0.18, pitch: 0.9 + i * 0.1 }); });
    // melts
    const tM = wd(id, 'melts');
    m.face(wd(id, 'one', 0), 'shock');
    K.shake(sv, wd(id, 'server') - 0.1, 7, 0.5);
    box.leds.forEach((l) => X.tl.set(l, { attr: { fill: C.red } }, wd(id, 'server')));
    X.tl.set(box.disp, { textContent: '503', attr: { fill: '#ff7a6b' } }, wd(id, 'server'));
    m.face(tM, 'dizzy');
    K.jitter(m.jit, wd(id, 'one', 0), t1, 9, 6);
    X.tl.to(g, { scale: 1.18, duration: 0.12, ease: 'power3.out', svgOrigin: '540 1260' }, tM);
    const blob = S('path', { d: 'M520,330 C780,250 1140,380 1120,700 C1100,1000 780,1090 480,1020 C120,940 40,660 220,480 C300,400 400,350 520,330 Z', fill: C.salmon, opacity: 0 }, g);
    g.insertBefore(blob, sv);
    g.appendChild(sv); g.appendChild(mw);
    [cal, ckw, tvw, ctr, ot, sm].forEach((e, i) => K.flyOut(e, tM - 0.02 + i * 0.02, (i % 2 ? 1 : -1) * 500, -300, 0.2));
    X.tl.to(blob, { opacity: 0.92, duration: 0.08 }, tM);
    const big = W(o);
    K.text(big, 660, 780, '503', { size: 290, weight: 900, font: 'Oswald, sans-serif', fill: C.red, anchor: 'middle', attrs: { stroke: C.ink, 'stroke-width': 4, 'paint-order': 'stroke' } });
    K.pill(big, 660, 820, 'SERVICE UNAVAILABLE', { anchor: 'middle', fill: C.dark, size: 26, padX: 16, padY: 14 });
    K.slam(big, tM, { sfx: 'impact', gain: 0.6 });
    K.papers(o, 600, 760, 26, tM, { dist: 560, dur: 1.2, seed: 8 });
    // density
    [[430, 760, 'is it 9?'], [880, 860, 'lunch?!']].forEach(([x, y, s2], i) => { const b = W(o); K.bubble(b, x, y, s2, { size: 26 }); K.pop(b, wd(id, 'minute') + i * 0.12, { gain: 0.16 }); });
    K.still(sv, mw);
    // the crowd drains away just before the cut (keeps the cut soft, like the source's papers-and-white change)
    X.tl.to(cw, { y: 520, duration: 0.24, ease: 'power2.in' }, t1 - 0.26);
    X.tl.to(blob, { opacity: 0, duration: 0.22, ease: 'none' }, t1 - 0.24);
    X.tl.to(big, { opacity: 0, scale: 0.8, transformOrigin: '50% 50%', duration: 0.2 }, t1 - 0.22);
  });

  // ================================================================ 16 balancer
  chap(15, (g, o, t0, t1, id) => {
    K.papers(g, 540, 600, 10, t0 - 0.4, { dist: 600, dur: 1.2, seed: 12 });
    const sw = W(g); miniStack(sw, 248, 1040, 250, 7, wd(id, 'cache'), { rh: 31, size: 15 });
    // cache grid
    const cw = W(g);
    K.card(cw, 300, 440, 280, 230, { r: 14 });
    K.text(cw, 322, 484, 'CACHE', { size: 28, weight: 900 });
    const hits = K.mono(cw, 560, 482, 'hits 0', { size: 18, weight: 600, anchor: 'end', fill: '#8d8a84' });
    const tiles = [];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) tiles.push(K.rrect(cw, 322 + c * 82, 508 + r * 76, 70, 62, 8, '#efece6', 2.5));
    K.dropIn(cw, wd(id, 'cache') - 0.1, 800, { dur: 0.3, sfx: 'pop' });
    K.pulse(g, 440, 560, 170, wd(id, 'pages'), { before: cw, hold: 0.7, fill: C.greenL });
    tiles.forEach((tt, i) => { X.tl.set(tt, { attr: { fill: C.greenL } }, wd(id, 'pages') + i * 0.08); tick(wd(id, 'pages') + i * 0.08, 0.1); });
    X.countUp(hits, 0, 214, wd(id, 'never'), 0.8, (v) => 'hits ' + Math.round(v));
    // balancer
    const fw = W(g); K.funnel(fw, 640, 520, 170, 'VISITORS');
    K.dropIn(fw, wd(id, 'load') - 0.15, 700, { dur: 0.3, sfx: 'pop' });
    const lb = W(g);
    K.rrect(lb, 630, 690, 190, 60, 12, C.dark, 3);
    K.mono(lb, 725, 728, 'BALANCER', { size: 20, weight: 700, fill: '#fff', anchor: 'middle', ls: 1 });
    K.pop(lb, wd(id, 'balancer'), { sfx: 'blip_up' });
    K.pulse(g, 725, 720, 150, wd(id, 'balancer'), { before: lb, hold: 0.6 });
    const sx = [560, 725, 890];
    const branches = sx.map((x) => { const b = S('path', { d: `M725,750 C725,820 ${x},840 ${x},900`, fill: 'none', stroke: C.dark2, 'stroke-width': 7, 'stroke-dasharray': '12 9' }, g); K.march(b, 70); return b; });
    branches.forEach((b, i) => { gsap.set(b, { opacity: 0 }); X.tl.to(b, { opacity: 1, duration: 0.1 }, wd(id, 'three') + i * 0.08); });
    const srv = sx.map((x, i) => { const s = W(g); const ms = G(s, { transform: `translate(${x} 1070) scale(0.85)` }); K.miniServer(ms, 0, 0, 1, { label: `#${i + 1}` }); K.dropIn(s, wd(id, 'three') - 0.1 + i * 0.1, 700, { dur: 0.3, sfx: i ? false : 'drop' }); return s; });
    // sick server
    const tS = wd(id, 'skips');
    const sick = W(g); K.cross(sick, 950, 920, 22);
    K.pop(sick, tS, { sfx: 'error', gain: 0.3 });
    K.pulse(g, 890, 1010, 130, tS, { before: srv[2], hold: 0.8 });
    K.shake(srv[2], tS, 8, 0.3);
    X.tl.to(srv[2], { opacity: 0.45, duration: 0.15 }, tS);
    X.tl.set(branches[2], { attr: { stroke: '#c9c6c0' } }, tS);
    // visitor dots stream: round robin, skipping #3 after tS
    const dots = [];
    for (let i = 0; i < 18; i++) dots.push(S('circle', { r: 9, fill: [C.blue, C.red, C.green, C.orange][i % 4], ...K.stroke(2), opacity: 0 }, g));
    const tStart = wd(id, 'spreads');
    gsap.set(g, { scale: 1.2, svgOrigin: '440 560' });
    K.camTo(g, wd(id, 'load') - 0.25, 1.0, 440, 560, 0.5);
    X.every((t) => {
      dots.forEach((d, i) => {
        const tt = t - tStart - i * 0.17;
        if (tt < 0 || tt > 0.9 || t > t1) { d.setAttribute('opacity', 0); return; }
        const tgt = t - tt > tS ? i % 2 : i % 3;
        let x, y;
        if (tt < 0.4) { const u = tt / 0.4; x = 725 + Math.sin(i * 1.7) * 50 * (1 - u); y = 470 + u * 250; }
        else { const u = (tt - 0.4) / 0.5; const b = branches[tgt]; const L = b.getTotalLength(); const pt = b.getPointAtLength(u * L); x = pt.x; y = pt.y; }
        d.setAttribute('cx', x.toFixed(1)); d.setAttribute('cy', y.toFixed(1)); d.setAttribute('opacity', 1);
      });
    });
    for (let i = 0; i < 18; i += 2) X.sfx(tStart + i * 0.17 + 0.4, 'blip', { gain: 0.08, pitch: 1 + (i % 4) * 0.1 });
    // load gauge
    const gg = W(g); const gau = K.gauge(gg, 935, 560, 64, { title: 'server load', v0: 160, text: '98 %' });
    K.slideIn(gg, wd(id, 'cache') + 0.15, 'right', 400, { dur: 0.22, gain: 0.15 });
    X.tl.to(gau.needle, { rotation: 40, duration: 0.8, ease: 'power2.inOut' }, wd(id, 'spreads'));
    X.countUp(gau.val, 98, 41, wd(id, 'spreads'), 0.8, (v) => Math.round(v) + ' %');
    X.tl.set(gau.val, { attr: { fill: C.green } }, wd(id, 'spreads') + 0.8);
    // density
    [0, 2, 4].forEach((ti, i) => { const h = W(g); K.pill(h, 322 + (ti % 3) * 82 + 35, 508 + Math.floor(ti / 3) * 76 + 18, 'HIT', { anchor: 'middle', fill: C.green, size: 15, padX: 6, padY: 6 }); K.pop(h, wd(id, 'change') + i * 0.1, { sfx: i ? false : 'blip_up', gain: 0.15 }); });
  });

  // ================================================================ 17 mystery
  chap(16, (g, o, t0, t1, id) => {
    const tLine = wd(id, 'Was');
    const a = W(g);
    const win = K.window(a, 280, 470, 480, 300, 'crumbwell.shop/checkout');
    K.cross(a, 340, 600, 26);
    K.text(a, 380, 612, 'Payment failed', { size: 32, weight: 800, fill: C.red });
    K.mono(a, 310, 680, 'error · try again later', { size: 20, fill: '#8d8a84' });
    K.dropIn(a, wd(id, 'checkout') - 0.15, 900, { dur: 0.32, ease: 'back.out(1.3)', sfx: 'error' });
    K.pulse(g, 400, 600, 150, wd(id, 'fails'), { before: a, hold: 0.8 });
    const mw = W(g); const m = K.mascot(mw, 910, 1040, 1.0, { face: 'worried', hat: true });
    K.slideIn(mw, t0 + 0.05, 'right', 500, { dur: 0.24, sfx: false });
    m.tilt(wd(id, 'why'), -8);
    K.jitter(m.jit, wd(id, 'fails'), wd(id, 'Was') - 0.12, 5, 3);
    const ppl = [[340, C.skin4, '#6a9a7a'], [560, C.skin3, '#c9a067'], [780, C.skin1, '#7f6f96']].map(([x, sk, sh], i) => {
      const p = W(g); K.person(p, x, 1300, 1.15, { skin: sk, shirt: sh, frown: true }); K.slideIn(p, wd(id, 'some') + i * 0.08, 'down', 420, { dur: 0.2, gain: 0.15 }); return p;
    });
    [[300, 1010], [520, 1000], [740, 1010], [960, 760]].forEach(([x, y], i) => { const q = W(g); K.qmark(q, x, y, 56); K.pop(q, wd(id, 'why') - 0.2 + i * 0.08, { gain: 0.15 }); });
    K.flyOut(a, tLine - 0.12, -700, 0, 0.16); K.flyOut(mw, tLine - 0.12, 600, 0, 0.16);
    ppl.forEach((pp, i) => K.restage(pp, tLine - 0.1, { y: 60 }, 0.25));
    // line-up
    const lu = W(g);
    S('rect', { x: 278, y: 450, width: 780, height: 520, rx: 16, fill: C.shadow }, lu);
    K.rrect(lu, 270, 440, 780, 520, 16, '#e7e5e0', 4);
    K.rrect(lu, 270, 440, 780, 60, 16, C.dark, 4);
    for (let i = 0; i < 6; i++) { S('path', { d: `M290,${540 + i * 70} L1030,${540 + i * 70}`, stroke: '#c9c6c0', 'stroke-width': 2 }, lu); K.mono(lu, 1022, 534 + i * 70, `${190 - i * 20}`, { size: 14, fill: '#9a978f', anchor: 'end' }); }
    K.mono(lu, 296, 480, 'LINE-UP', { size: 22, weight: 700, fill: '#fff', ls: 3 });
    K.mono(lu, 1030, 480, 'case #4104 · checkout', { size: 16, fill: '#8d909a', anchor: 'end' });
    K.dropIn(lu, tLine - 0.05, 900, { dur: 0.3, ease: 'power3.out', sfx: 'shutter' });
    const sus = [[400, 'server', 'SERVER'], [650, 'database', 'DATABASE'], [900, 'payment', 'PAYMENT']];
    sus.forEach(([x, w, lab], i) => {
      const s = W(g);
      if (i === 0) { const b = G(s, { transform: `translate(${x} 900) scale(0.7)` }); K.miniServer(b, 0, 0, 1); K.eyesOn(s, x, 820, 1.1); }
      if (i === 1) { K.db(s, x - 70, 760, 140, 150, {}); K.eyesOn(s, x, 820, 1.1); }
      if (i === 2) { K.rrect(s, x - 80, 770, 160, 110, 12, C.blue, 3); S('rect', { x: x - 80, y: 795, width: 160, height: 20, fill: C.dark }, s); K.eyesOn(s, x, 845, 1.1); }
      const plate = W(s); K.pill(plate, x, 930, `#${i + 1} ${lab}`, { anchor: 'middle', fill: C.red, size: 18, padX: 10, padY: 10 });
      const cone = S('path', { d: `M${x - 30},500 L${x + 30},500 L${x + 110},960 L${x - 110},960 Z`, fill: '#fff3c4', opacity: 0 }, lu);
      const tw = wd(id, w);
      K.dropIn(s, tLine + 0.1 + i * 0.08, 600, { dur: 0.28, sfx: false });
      X.tl.set(cone, { opacity: 0.85 }, tw);
      X.tl.set(cone, { opacity: 0 }, tw + 0.5);
      K.pop(plate, tw, { sfx: 'thud', gain: 0.3 });
      X.tl.to(s, { y: -30, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out' }, tw);
    });
    // density
    [[200, 1000, 'card declined?', 'fails'], [640, 1000, 'still spinning…', 'people']].forEach(([x, y, s2, w]) => { const b = W(g); K.bubble(b, x, y, s2, { size: 26 }); K.pop(b, wd(id, w), { gain: 0.18 }); K.popOut(b, tLine - 0.12); });
  });

  // ================================================================ 18 monitoring
  chap(17, (g, o, t0, t1, id) => {
    const sw = W(g); miniStack(sw, 248, 1010, 250, 8, wd(id, 'monitoring'), { rh: 28, size: 14 });
    const camw = W(g); const cam = K.camera(camw, 300, 920, 0.95);
    K.dropIn(camw, t0 + 0.05, 600, { dur: 0.3, sfx: 'pop' });
    X.tl.fromTo(cam.head, { rotation: 20 }, { rotation: -6, duration: 0.6, ease: 'power2.inOut', immediateRender: false }, wd(id, 'uptime'));
    X.tl.to(cam.head, { rotation: 12, duration: 0.6, ease: 'power2.inOut' }, wd(id, 'log'));
    X.tl.to(cam.head, { rotation: 26, duration: 0.6, ease: 'power2.inOut' }, wd(id, 'alert'));
    // uptime panel
    const up = W(g); const pu = K.panel(up, 520, 430, 520, 190, 'UPTIME', { sub: 'every 1 min', dot: C.green });
    K.slideIn(up, wd(id, 'uptime') - 0.12, 'right', 700, { dur: 0.24, sfx: 'pop' });
    for (let i = 0; i < 14; i++) { const b = K.rrect(up, 545 + i * 34, 500 + (i % 3) * 6, 24, 70 - (i % 3) * 6, 5, C.green, 0); gsap.set(b, { scaleY: 0, transformOrigin: '50% 100%' }); X.tl.to(b, { scaleY: 1, duration: 0.12, ease: 'back.out(2)' }, wd(id, 'check') + i * 0.045); }
    X.sfx(wd(id, 'check'), 'tick', { gain: 0.25 }); X.sfx(wd(id, 'minute'), 'tock', { gain: 0.25 });
    K.camTo(g, wd(id, 'uptime'), 1.1, 780, 520, 0.4);
    K.camTo(g, wd(id, 'log') - 0.1, 1.1, 780, 760, 0.4);
    K.camTo(g, wd(id, 'alert') - 0.1, 1.1, 780, 980, 0.4);
    K.camTo(g, wd(id, 'someone'), 1.0, 640, 800, 0.4);
    // logs
    const lgw = W(g);
    K.rrect(lgw, 526, 646, 520, 220, 14, C.shadow, 0);
    K.rrect(lgw, 520, 640, 520, 220, 14, '#17181d', 3);
    K.mono(lgw, 540, 676, 'LOGS', { size: 22, weight: 700, fill: '#fff', ls: 1 });
    K.mono(lgw, 610, 676, 'live tail', { size: 16, fill: '#8d909a' });
    K.slideIn(lgw, wd(id, 'log') - 0.12, 'right', 700, { dur: 0.24, sfx: 'pop' });
    ['09:14:02 GET /menu 200 41ms', '09:14:02 POST /order 201 88ms', '09:14:03 GET /pay 502 3.1s', '09:14:03 GET / 200 12ms'].forEach((l, i) => {
      const e = K.mono(lgw, 540, 716 + i * 36, '', { size: 20, weight: 500, fill: i === 2 ? '#ff8a7a' : '#d6d4ce' });
      K.type(e, l, wd(id, 'every', 1) - 0.1 + i * 0.12, 90, i === 0);
    });
    // alerts
    const al = W(g); const pa = K.panel(al, 520, 885, 520, 170, 'ALERTS', { dot: C.red });
    K.slideIn(al, wd(id, 'alert') - 0.12, 'right', 700, { dur: 0.24, sfx: 'pop' });
    K.pulse(g, 600, 960, 140, wd(id, 'wakes'), { before: al, hold: 0.8 });
    const bw = W(al); K.bell(bw, 590, 980, 0.9);
    const ph = W(al); K.pill(ph, 650, 952, 'checkout 5xx → on-call', { fill: C.red, size: 20, padX: 12, padY: 14 });
    K.slideIn(ph, wd(id, 'wakes'), 'right', 200, { dur: 0.18, sfx: 'notif' });
    X.tl.to(bw, { rotation: 14, transformOrigin: '50% 10%', duration: 0.06, repeat: 7, yoyo: true, ease: 'none' }, wd(id, 'wakes'));
    X.sfx(wd(id, 'wakes'), 'beep', { gain: 0.25 });
  });

  // ================================================================ 19 months later
  chap(18, (g, o, t0, t1, id) => {
    K.halftone(t0 - 0.34, 0.84, { ox: 760, oy: 700 });
    const cal = W(g);
    const cg = K.calendar(cal, 360, 560, '2026', 'JUN', { w: 340, h: 330, bigSize: 150 });
    X.tl.set(cg.big, { textContent: 'JUL' }, t0 + 0.56);
    X.tl.set(cg.big, { textContent: 'AUG' }, t0 + 0.68);
    X.tl.set(cg.big, { textContent: 'NOV' }, t0 + 0.8);
    [0.56, 0.68, 0.8].forEach((dt) => X.sfx(t0 + dt, 'paper', { gain: 0.25 }));
    X.tl.to(cal, { scale: 0, opacity: 0, transformOrigin: '50% 50%', duration: 0.12 }, t0 + 0.9);
    // the full stack
    const tS = t0 + 0.96;
    const all = W(g);
    X.tl.fromTo(all, { scale: 0.92 }, { scale: 1.04, svgOrigin: '540 900', duration: t1 - tS, ease: 'none', immediateRender: false }, tS);
    K.show(all, tS);
    X.sfx(tS, 'whoosh', { gain: 0.3 });
    K.halo(all, 530, 430, 170);
    const st = K.stack(all, 210, 600, 640, LAY, { rh: 62, gap: 10, size: 34 });
    K.statusBar(all, 190, 600 + 8 * 72 + 4, 680, 'CRUMBWELL · bakery', 'ONLINE');
    const mw = W(all); const m = K.mascot(mw, 530, 592, 0.95, { face: 'grin', hat: true });
    m.wave(tS + 0.2, 2);
    st.rows.forEach((r, i) => { gsap.set(r, { x: 400, opacity: 0 }); X.tl.to(r, { x: 0, opacity: 1, duration: 0.18, ease: 'power3.out' }, tS + i * 0.035); });
    [[1, 'fast'], [3, 'backed'], [4, 'secure'], [7, 'watched']].forEach(([ri, w]) => st.addCheck(wd(id, w), ri));
    [0, 2, 5, 6].forEach((ri, k) => st.addCheck(wd(id, 'watched') + 0.15 + k * 0.06, ri));
    // callouts
    const c1 = W(g); const gg = K.gauge(c1, 120, 440, 64, { title: 'page load', v0: 30, text: '0.6 s', valFill: C.green });
    K.pop(c1, wd(id, 'fast'), { gain: 0.2 });
    const c2 = W(g); [0, 1, 2].forEach((i) => { const hh = G(c2, { transform: `translate(${66 + i * 44} ${930 + i * 10}) scale(0.48)` }); K.hdd(hh, 0, 0, 1); });
    K.pill(c2, 110, 1030, '3 copies', { anchor: 'middle', fill: C.dark, size: 18, padX: 10, padY: 10 });
    K.pop(c2, wd(id, 'backed'), { gain: 0.2 });
    const c3 = W(g); K.shield(c3, 960, 930, 1.25); K.padlock(c3, 960, 935, 0.72, { fill: '#fff' });
    K.pill(c3, 960, 1035, 'secure', { anchor: 'middle', fill: C.dark, size: 18, padX: 10, padY: 10 });
    K.pop(c3, wd(id, 'secure'), { gain: 0.2 });
    const c4 = W(g); const cm = G(c4, { transform: 'translate(880 700) scale(0.75)' }); K.camera(cm, 0, 0, 1);
    K.pill(c4, 960, 730, 'watched', { anchor: 'middle', fill: C.dark, size: 18, padX: 10, padY: 10 });
    K.pop(c4, wd(id, 'watched'), { gain: 0.2 });
    const live = W(g); K.mono(live, 1040, 290, '// live 152 days', { size: 24, weight: 400, fill: C.tagGrey, anchor: 'end' });
    K.show(live, tS);
  });

  // ================================================================ 20 one friday
  chap(19, (g, o, t0, t1, id) => {
    const all = W(g);
    const st = K.stack(all, 30, 700, 440, LAY, { rh: 46, gap: 8, size: 23 });
    st.rows.forEach((r, i) => st.addCheck(null, i));
    const sb = K.statusBar(all, 20, 700 + 8 * 54 + 2, 460, 'CRUMBWELL', 'ALL CHECKS ✓');
    const mw = W(all); const m = K.mascot(mw, 250, 694, 0.66, { face: 'happy', hat: true });
    const cu = W(g); const cust = K.person(cu, 880, 1300, 1.3, { skin: C.skin3, shirt: '#3b8c8c', hairC: '#1e1f24', phone: true });
    K.slideIn(cu, wd(id, 'customer') - 0.05, 'right', 500, { dur: 0.22 });
    K.slideIn(all, t0 + 0.02, 'left', 500, { dur: 0.26, sfx: 'slide' });
    const ww = W(g);
    const win = K.window(ww, 530, 430, 520, 380, 'new tab', { addr: true, dot: '#bbb' });
    K.dropIn(ww, wd(id, 'types') - 0.15, 900, { dur: 0.32, ease: 'back.out(1.3)', sfx: 'pop' });
    K.type(win.addr, 'crumbwell.shop', wd(id, 'crumbwell'), 18);
    // can't be reached
    const err = W(ww);
    S('path', { d: 'M600,580 L650,580 L668,598 L668,670 L600,670 Z', fill: '#fff', stroke: '#9a978f', 'stroke-width': 4 }, err);
    S('path', { d: 'M616,648 q18,-14 36,0 M620,616 l6,6 M626,616 l-6,6 M644,616 l6,6 M650,616 l-6,6', stroke: '#9a978f', 'stroke-width': 3.5, fill: 'none' }, err);
    K.text(err, 690, 612, 'This site can\'t', { size: 30, weight: 700, fill: '#5d5a55' });
    K.text(err, 690, 650, 'be reached', { size: 30, weight: 700, fill: '#5d5a55' });
    K.mono(err, 600, 730, 'ERR_CONNECTION_TIMED_OUT', { size: 18, fill: '#9a978f' });
    K.show(err, wd(id, 'this') - 0.05);
    X.sfx(wd(id, 'this') - 0.05, 'error', { gain: 0.3 });
    m.face(wd(id, 'reached'), 'dizzy'); m.squash(wd(id, 'reached'));
    K.jitter(m.jit, wd(id, 'reached') + 0.3, t1, 6, 4);
    K.pulse(g, 760, 630, 200, wd(id, 'this'), { before: ww, hold: 0.8 });
    X.tl.set(cust.mouth, { attr: { d: 'M-9,-92 q9,-7 18,0' } }, wd(id, 'reached'));
    K.shake(ww, wd(id, 'reached'), 8, 0.3);
    // the cause
    const tB = wd(id, 'Because');
    st.recolor(tB, 1, C.red);
    const ex = W(all); K.excl(ex, 500, 700 + 6 * 54 + 23, 20);
    K.pop(ex, tB, { sfx: 'error', gain: 0.3 });
    K.pulse(all, 250, 700 + 6 * 54 + 23, 170, tB, { hold: 1.2 });
    K.shake(st.rows[1], tB, 10, 0.35);
    X.tl.set(sb.right, { textContent: 'DNS ✗', attr: { fill: '#ff7a6b' } }, tB);
    K.flyOut(ww, wd(id, 'edited') - 0.18, 600, -100, 0.18);
    const tw = W(g);
    const term = K.terminal(tw, 530, 440, 520, 260, 'DNS RECORD', { ver: 'v2 · Fri', n: 3, size: 26 });
    const dx8 = 556 + K.measure('+ A   203.0.11', 26, 500, K.F.mono) + K.measure('8', 26, 500, K.F.mono) / 2;
    K.slideIn(tw, wd(id, 'edited') - 0.08, 'right', 700, { dur: 0.24, sfx: 'pop' });
    term.lines[0].textContent = '- A   203.0.113.7';
    X.tl.set(term.lines[0], { attr: { fill: '#8d8e94' } }, wd(id, 'edited'));
    const strike = S('path', { d: 'M556,530 L820,530', stroke: C.red, 'stroke-width': 4 }, tw);
    X.drawOn(strike, wd(id, 'DNS'), 0.25);
    term.typeLine(1, '+ A   203.0.118.7', wd(id, 'record'), 30);
    const circ = W(tw);
    S('ellipse', { cx: dx8, cy: 569, rx: 18, ry: 24, fill: 'none', stroke: C.red, 'stroke-width': 4 }, circ);
    K.pill(circ, dx8 + 26, 590, '1 digit', { fill: C.red, size: 18, padX: 10, padY: 10 });
    K.pop(circ, wd(id, 'digit'), { sfx: 'error', gain: 0.3 });
    K.pulse(tw, dx8, 569, 90, wd(id, 'digit'), { hold: 0.9 });
    // Friday 5:58 pm
    const cal = W(g); K.calendar(cal, 560, 740, 'FRIDAY', 'FRI', { w: 220, h: 220, bigSize: 100, sub: '5:58 PM' });
    K.dropIn(cal, wd(id, 'Friday') - 0.12, 700, { dur: 0.3, sfx: 'paper' });
    const ck = W(g); K.clock(ck, 850, 840, 52, [5, 58]);
    K.dropIn(ck, wd(id, 'Friday') + 0.02, 700, { dur: 0.3, sfx: 'tick' });
    K.shake(ck, wd(id, 'typed'), 6, 0.4);
    const stp = K.stamp(o, 430, 980, 'ONE WRONG DIGIT', { size: 104, rot: -8, sub: 'friday · 5:58 pm · nobody checked' });
    K.pulse(o, 270, 960, 280, wd(id, 'home'), { hold: 2 });
    K.papers(o, 300, 960, 12, wd(id, 'home'), { dist: 520, dur: 1.2, seed: 41 });
    K.shake(all, wd(id, 'home'), 10, 0.4);
    K.slam(stp, wd(id, 'home'));
    // density
    const huh = W(g); K.bubble(huh, 700, 1000, 'huh?', { size: 32, tail: 'right' });
    K.pop(huh, wd(id, 'reached') + 0.1, { sfx: 'bubble', gain: 0.2 });
    K.say(g, 40, 480, 'where did I go?', wd(id, 'Because') + 0.1, { tail: 'right', size: 28 });
    // density
    const neq = W(g); K.pill(neq, 830, 712, '8 ≠ 3', { fill: C.red, size: 34, padX: 18, padY: 16, font: K.F.label, weight: 900 });
    K.pop(neq, wd(id, 'typed'), { sfx: 'error', gain: 0.25 });
    K.say(g, 560, 1110, 'nobody checked.', wd(id, 'went'), { tail: 'left', size: 28 });
  });

  // ---------------------------------------------------------------- captions (on top of everything)
  const keys = {};
  spec.lines.forEach((l) => { keys[l.id] = l.keys || []; });
  keys.c15 = ['Saturday', 'TV', '2', 'minute', 'melts'];
  K.captions({
    keys,
    merges: [{ line: 'c03', from: 'crumbwell', n: 3, show: 'crumbwell.shop' }, { line: 'c20', from: 'crumbwell', n: 3, show: 'crumbwell.shop' },
      { line: 'c09', from: 'two', n: 2, show: '2 a.m.' }, { line: 'c15', from: 'two', n: 2, show: '2,000' }],
  });
  // emphasis: on every caption keyword the newest element of the chapter thumps and nudges its neighbours
  spec.lines.forEach((l) => {
    const cg = document.getElementById(l.id + 'cam') || document.getElementById(l.id);
    const has = (k) => X.line(l.id).words.some((w) => nrm(w.w).startsWith(nrm(k)));
    const kt = (keys[l.id] || []).filter(has).map((k) => (wx(l.id, k) !== X.line(l.id).start ? wx(l.id, k) : wd(l.id, k)));
    kt.forEach((t) => K.emphasize(cg, t));
    // lighter beats on the other long (stressed) words, never closer than 0.6 s to another beat
    let last = -9, n = 0; const all = [...kt];
    X.line(l.id).words.forEach((w) => {
      if (nrm(w.w).length < 6 || all.some((t) => Math.abs(t - w.start) < 0.6) || w.start - last < 0.6) return;
      K.emphasize(cg, w.start, { amt: 0.06, nudge: 0.45, back: ++n }); last = w.start; all.push(w.start);
    });
  });
  X.end(END);
});

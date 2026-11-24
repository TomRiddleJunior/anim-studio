/* layer-stack template — 3 chapters: hook (crane drops the SERVER), failure (stamp), fix (a row slides onto the
 * layer stack + 0/3 → 3/3 counter). Copy this folder, rewrite script.json, keep the chap()/miniStack pattern. */
X.boot(async (X) => {
  await X.loadVO();
  const spec = await (await fetch('script.json')).json();
  const C = K.C, S = K.S, G = K.G;
  K.canvas();
  const ids = spec.lines.map((l) => l.id);
  const END = Math.max(X.vo.duration || 0, 12);
  const T0 = ids.map((id, i) => (i === 0 ? 0 : X.line(id).start - 0.1));
  const T1 = ids.map((id, i) => (i < ids.length - 1 ? T0[i + 1] : END));
  const wd = (id, w, n = 0) => X.word(id, w, n);
  const nrm = (s2) => s2.toLowerCase().replace(/[^a-z0-9$%']/g, '');
  const W = (p) => G(p, {}); // animate wrappers, never a group that carries its own transform
  const LAY = [['01', 'SERVER'], ['02', 'BACKUPS']].map(([n, label]) => ({ n, label }));
  const TAGS = ['just put it online', '2 a.m.', 'backups'];
  K.tags(ids.map((id, i) => [T0[i], T1[i], `// ${String(i + 1).padStart(2, '0')} — ${TAGS[i]}`]));
  // sets that share the frame with the presenter are drawn 15 % larger about the diagram centre (the source's prop scale)
  const WIDE = new Set([0]);
  const chap = (i, build) => {
    const holder = WIDE.has(i) ? K.world : G(K.world, { transform: 'translate(660 850) scale(1.15) translate(-660 -850)' });
    const g = X.scene(ids[i], T0[i], T1[i], null, holder);
    const o = X.scene(ids[i] + 'o', T0[i], T1[i], null, K.over);
    build(g, o, T0[i], T1[i], ids[i]);
  };
  // presenter: static at the left; enters with the first camera pull-back
  const PW = W(K.pres);
  K.presenter(PW, 14, 590);
  const zoomT = wd('c01', 'server') - 0.05;
  gsap.set(PW, { autoAlpha: 0 });
  X.tl.set(PW, { autoAlpha: 1 }, zoomT);
  X.tl.fromTo(PW, { x: -190 }, { x: 0, duration: 0.42, ease: 'power3.inOut', immediateRender: false }, zoomT);

  // 01 hook: street of shops → crane lowers the SERVER box → camera pulls back
  chap(0, (g, o, t0, t1, id) => {
    const cam = W(g); cam.id = 'c01cam';
    gsap.set(cam, { svgOrigin: '0 0', scale: 1.37, x: -372, y: -386 });
    X.tl.to(cam, { scale: 1, x: 0, y: 0, duration: 0.42, ease: 'power3.inOut' }, zoomT);
    const back = W(cam);
    [[540, 1056, 'CAFÉ', 2], [700, 1040, 'BOOKS', 5], [860, 1056, 'GYM', 7]].forEach(([x, y, lab, seed]) => K.building(back, x, y, 100, 340, { label: lab, seed }));
    const bake = W(cam);
    K.building(bake, 350, 1070, 150, 440, { base: '#fff', side: '#dfe6f3', stripe: C.blue, seed: 11 });
    K.brandSticker(bake, 248, 504, 'crumbwell', 0.95);
    [[300, 430, 'our own site!', true], [480, 560, 'we need a website!', false], [700, 470, 'online. now.', false]].forEach(([x, y, s, red], i) => {
      const b = W(cam); K.bubble(b, x, y, s, { red, size: 30 }); K.pop(b, t0 + 0.2 + i * 0.16); K.popOut(b, wd(id, 'rent') + i * 0.03);
    });
    const cr = W(cam);
    K.crane(cr, 470, 470, 1120, { tx: 760 });
    K.slideIn(cr, wd(id, 'So') - 0.05, 'right', 700, { dur: 0.32, ease: 'power3.out', sfx: 'whoosh' });
    const boxW = W(cam);
    K.serverBox(boxW, 540, 860, 430, 210, { label: 'SERVER', labelSize: 50 });
    const tDrop = wd(id, 'rent') - 0.05;
    gsap.set(boxW, { y: -860, autoAlpha: 0 });
    X.tl.set(boxW, { autoAlpha: 1 }, tDrop - 0.25);
    X.tl.to(boxW, { y: 0, duration: 0.67, ease: 'power2.inOut' }, tDrop - 0.25);
    K.puff(cam, 760, 1066, tDrop + 0.42, 1.3);
    X.sfx(tDrop + 0.42, 'thud', { gain: 0.5 });
    const lg = W(cam); K.logo(lg, 930, 905, 1.3);
    K.pop(lg, wd(id, 'logo'));
    const mw = W(cam); const m = K.mascot(mw, 720, 830, 0.95, { face: 'grin' });
    K.pop(mw, wd(id, 'top'), { sfx: 'boing' });
    m.wave(wd(id, 'top') + 0.3, 2);
    K.still(back, bake, cr, boxW, lg, mw); // set pieces never get jostled
    K.say(cam, 400, 560, 'hello, world!', wd(id, 'top') + 0.3, { tail: 'right', size: 30 }); // the product talks
  });

  // 02 failure: the disk dies → stamp
  chap(1, (g, o, t0, t1, id) => {
    const ck = W(g); K.clock(ck, 400, 560, 76, [2, 0]);
    K.dropIn(ck, t0 + 0.04, 600, { dur: 0.3, sfx: 'tick' });
    const sv = W(g); const box = K.serverBox(sv, 300, 900, 400, 200, { label: 'SERVER', disp: 'zzz' });
    K.slideIn(sv, t0 + 0.08, 'left', 600, { dur: 0.26 });
    const mw = W(g); const m = K.mascot(mw, 500, 870, 0.9, { face: 'sleep' });
    K.still(sv, mw);
    const hd = W(g); const disk = K.hdd(hd, 880, 900, 1.0);
    K.slideIn(hd, t0 + 0.16, 'right', 500, { dur: 0.26 });
    gsap.set(disk.crack, { attr: { 'stroke-dasharray': 400, 'stroke-dashoffset': 400 } });
    const tD = wd(id, 'dies');
    X.tl.to(disk.crack, { attr: { 'stroke-dashoffset': 0 }, duration: 0.18 }, tD - 0.15);
    K.shake(hd, tD, 10, 0.4);
    box.leds.forEach((l) => X.tl.set(l, { attr: { fill: C.red } }, tD));
    m.face(tD, 'shock'); m.hop(tD, 30); K.jitter(m.jit, tD + 0.3, t1, 8, 5);
    K.pulse(g, 880, 900, 200, tD, { before: hd });
    const st = K.stamp(o, 600, 760, 'GONE', { size: 150, rot: -8 });
    K.slam(st, wd(id, 'order'));
    K.papers(o, 520, 900, 14, wd(id, 'order'), { dist: 500, dur: 1.1 });
  });

  // 03 fix: a row slides onto the stack, three copies, counter 0/3 → 3/3
  chap(2, (g, o, t0, t1, id) => {
    const sw = W(g);
    const st = K.stack(sw, 248, 1080, 250, LAY, { fresh: 1, rh: 40, size: 20 });
    K.slideIn(st.rows[1], wd(id, 'backups'), 'right', 320, { dur: 0.22, ease: 'power3.out', sfx: 'slide' });
    K.puff(sw, 373, st.rows[1].y + 44, wd(id, 'backups') + 0.2, 0.8);
    const dbw = W(g); K.db(dbw, 590, 780, 190, 200, { label: 'orders db' });
    K.dropIn(dbw, t0 + 0.03, 800, { dur: 0.3 });
    const ctr = W(g); K.card(ctr, 850, 860, 190, 120, { r: 14 });
    K.mono(ctr, 945, 892, 'COPIES', { size: 17, weight: 700, anchor: 'middle', fill: '#8d8a84', ls: 2 });
    const n = K.text(ctr, 945, 955, '0/3', { size: 54, weight: 900, anchor: 'middle', font: 'Oswald, sans-serif' });
    K.slideIn(ctr, wd(id, 'three'), 'right', 400, { dur: 0.24 });
    ['SAME SERVER', 'OTHER DISK', 'OTHER CITY'].forEach((lab, i) => {
      const x = 300 + i * 245, c = W(g);
      K.card(c, x, 430, 230, 120, { r: 16 });
      K.mono(c, x + 115, 500, lab, { size: 19, weight: 700, anchor: 'middle', ls: 1 });
      K.dropIn(c, wd(id, 'three') - 0.05 + i * 0.08, 600, { dur: 0.3, sfx: i ? false : 'drop' });
      const path = S('path', { d: `M685,770 C685,660 ${x + 115},662 ${x + 115},552`, fill: 'none', stroke: C.dark2, 'stroke-width': 7, 'stroke-dasharray': '12 9' }, g);
      K.march(path, 60);
      const ta = wd(id, 'copies') + 0.3 + i * 0.35;
      const ck = K.check(c, x + 205, 452, 18); gsap.set(ck, { scale: 0, transformOrigin: '50% 50%' });
      X.tl.to(ck, { scale: 1, duration: 0.25, ease: 'back.out(3)' }, ta);
      X.tl.set(n, { textContent: `${i + 1}/3`, attr: { fill: i === 2 ? C.green : C.ink } }, ta);
      X.sfx(ta, i === 2 ? 'success' : 'blip_up', { gain: 0.3 });
    });
    const mg = W(g); K.mug(mg, 780, 1190, 1.3);
    K.dropIn(mg, wd(id, 'morning') - 0.1, 500, { dur: 0.3, sfx: 'pop' });
  });

  const keys = {};
  spec.lines.forEach((l) => { keys[l.id] = l.keys || []; });
  K.captions({ keys, merges: [{ line: 'c02', from: 'two', n: 2, show: '2 a.m.' }] });
  // event density (SKILL.md §6): every caption keyword makes the newest element thump and nudge its neighbours,
  // other long words get a lighter beat, never closer than 0.6 s
  spec.lines.forEach((l) => {
    const cg = document.getElementById(l.id + 'cam') || document.getElementById(l.id);
    const ws = X.line(l.id).words;
    const kt = (keys[l.id] || []).map((k) => ws.find((w) => nrm(w.w).startsWith(nrm(k)))).filter(Boolean).map((w) => w.start);
    kt.forEach((t) => K.emphasize(cg, t));
    let last = -9, n = 0;
    ws.forEach((w) => {
      if (nrm(w.w).length < 6 || kt.some((t) => Math.abs(t - w.start) < 0.6) || w.start - last < 0.6) return;
      K.emphasize(cg, w.start, { amt: 0.06, nudge: 0.45, back: ++n }); last = w.start;
    });
  });
  X.end(END);
});

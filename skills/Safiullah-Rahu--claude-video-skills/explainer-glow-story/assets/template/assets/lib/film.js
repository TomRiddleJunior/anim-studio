/* Glow-story TEMPLATE film: 3 stations, ~10 s. Copy this file's patterns; the full 19-station film is
 * assets/sample/assets/lib/film.js ("Unheard").
 *
 * GLOW_FILM(G, V) -> { update(t) -> render state }
 *   V.L(id) -> { start, end, words: [[w, s, e]] }   V.w(id, word, k) -> a word's start time (from vo/data/vo.json)
 * A station = objects built once + update(t) (glows, pops, counters keyed to words) + lights(t) + a visibility window.
 * The camera = hold() keys: a slow push on each station, then an eased ~1 s push to the next one, which waits straight
 * ahead ~2 m deeper and pops in (already inside the frame) as the old one scales out (one take, 0 cuts).
 */
window.GLOW_FILM = function (G, V) {
  "use strict";
  const T = G.T, C = G.C, D = G.D, sstep = G.sstep, lerp = G.lerp, clamp = G.clamp;
  const easeIO = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const easeO = (u) => 1 - Math.pow(1 - u, 3);
  const easeBack = (u) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
  const fade = (t, a, b) => sstep(a, b, t);
  const win = (t, a, b, fi, fo) => sstep(a - fi, a, t) * (1 - sstep(b, b + fo, t));
  const q = (x, k) => Math.round(x * k) / k;
  const pop = (g, t, a, d) => { const u = clamp((t - a) / (d || 0.38), 0, 1); g.scale.setScalar(u <= 0 ? 1e-4 : Math.max(1e-4, easeBack(u))); };
  const w = V.w, L = V.L;
  const A = (x, y, z) => new T.Vector3(x, y, z);
  const add = (a, x, y, z) => [a.x + x, a.y + y, a.z + z];
  const S = [];

  // ===== S1 · the job's object at frame 0: an envelope glyph on frosted glass
  const A1 = A(0, 0, 0);
  const env = G.panel({ w: 0.46, h: 0.3, r: 0.035, hdr: 2.4, cw: 1000, draw: (ctx, CW, CH, s, px, mg) => {
    D.edge(ctx, px, mg, 0.46, 0.3, 0.035, C.iceDim, 0.45, 3);
    D.mailbox(ctx, CW / 2, CH / 2 - 0.01 * px, 0.2 * px, C.amber, 1);
    D.text(ctx, "RETURN TO SENDER", CW / 2, CH / 2 + 0.1 * px, { size: 0.018 * px, weight: 600, fam: "p", ls: 8, color: C.iceDim, alpha: s.a, glow: 0 });
  } });
  env.g.position.copy(A1);
  S.push({ A: A1, objs: () => [env.g], update(t) { env.set({ a: q(fade(t, 0.8, 1.4), 10) }, win(t, -1, 2.6, 0.5, 0.6)); },
    lights: (t) => { const v = win(t, -1, 2.7, 0.5, 0.8); return [{ pos: add(A1, 0.1, 0.2, -0.45), color: C.amber, i: 3 * v, fog: 1.6 }, { pos: add(A1, -0.5, 0.9, 1.5), color: "#a9c2ee", i: 1.5 * v, fog: 0.15 }]; } });

  // ===== S2 · the number: "400" counting up, a ring of dots filling
  const A2 = A(0.1, 0.0, -2.1);
  const num = G.panel({ w: 0.42, h: 0.2, noSlab: true, margin: 0.01, hdr: 2.0, cw: 1000, draw: (ctx, CW, CH, s, px) => {
    D.text(ctx, String(s.n), CW / 2, CH * 0.45, { size: 0.12 * px, weight: 600, fam: "p", color: C.amberHot, glowColor: C.amber, glow: 24 });
    D.text(ctx, "TIMES", CW / 2, CH * 0.86, { size: 0.02 * px, weight: 600, fam: "p", ls: 10, color: C.iceDim, glow: 0 });
  } });
  num.g.position.set(A2.x, A2.y + 0.02, A2.z + 0.05);
  const ring = G.dots({ n: 120, r: 0.006 });
  ring.g.position.copy(A2);
  S.push({ A: A2, objs: () => [num.g, [ring.g, 1]], update(t) {
    const v = win(t, 2.6, 6.2, 0.5, 0.6), t4 = w("l02", "four"), tEnd = L("l02").end;
    num.set({ n: Math.round(400 * easeO(fade(t, t4 - 0.1, tEnd))) }, v);
    ring.g.visible = v > 0.01;
    const k = fade(t, t4 - 0.1, tEnd);
    if (ring.g.visible) ring.set((i) => { const a = i / 120 * Math.PI * 2; const on = i / 120 < k; return [Math.sin(a) * 0.2, Math.cos(a) * 0.2, 0, on ? 1 : 0.6, on ? C.amber : C.greyDim, v * (on ? 2.2 : 0.5)]; });
  }, lights: (t) => { const v = win(t, 2.6, 6.3, 0.5, 0.8); return [{ pos: add(A2, 0, 0.2, -0.45), color: C.amber, i: 2.6 * v, fog: 1.6 }]; } });

  // ===== S3 · the voice: a transcript bubble that pops in and reveals word by word with the line
  const A3 = A(-0.05, 0.0, -4.2);
  const words = "Please. Keep this one.".split(" ");
  const bub = G.panel({ w: 0.44, h: 0.13, r: 0.03, hdr: 2.5, cw: 1000, glass: { color: "#e6a878", emi: "#2c1a0c", emiI: 1.0, opacity: 0.97, env: 0.5, rough: 0.4 }, draw: (ctx, CW, CH, s, px, mg) => {
    D.stroke(ctx, () => D.rr(ctx, mg * px + 3, mg * px + 3, 0.44 * px - 6, 0.13 * px - 6, 0.026 * px), { color: C.amber, alpha: 0.85, lw: 3.2, glow: 22 });
    ctx.font = D.font(0.034 * px, 500, "p");
    const sp = ctx.measureText(" ").width, tw = words.reduce((a, x) => a + ctx.measureText(x).width, 0) + sp * (words.length - 1);
    let x = CW / 2 - tw / 2;
    words.forEach((wd, i) => { if (s.rev[i] > 0.01) D.text(ctx, wd, x, CH / 2, { size: 0.034 * px, weight: 500, fam: "p", align: "left", color: C.white, alpha: s.rev[i] * 0.46, glowColor: C.amber, glow: 0.034 * px * 0.07 }); x += ctx.measureText(wd).width + sp; });
  } });
  bub.g.position.copy(A3);
  S.push({ A: A3, objs: () => [bub.g], update(t) {
    const m1 = L("m1"), v = win(t, 5.0, 99, 0.5, 1);
    pop(bub.g, t, m1.start - 0.4);
    const rev = words.map((_, i) => q(fade(t, m1.words[Math.min(i, m1.words.length - 1)][1] - 0.04, m1.words[Math.min(i, m1.words.length - 1)][1] + 0.1), 10));
    bub.set({ rev }, v * fade(t, m1.start - 0.4, m1.start - 0.1));
  }, lights: (t) => { const v = win(t, 5.0, 99, 0.5, 1); return [{ pos: add(A3, 0, 0.2, -0.45), color: C.amber, i: 2.4 * v, fog: 1.6 }, { pos: add(A3, -0.3, 0.6, 1.3), color: "#b8ccee", i: 1.1 * v, fog: 0.15 }]; } });

  // ------------------------------------------------------------------ camera (one take)
  const FOV = 40, K = [];
  const frameH = (d) => 2 * d * Math.tan(FOV / 2 * Math.PI / 180);
  function hold(Ap, t0, t1, d0, d1, o) { // content centre at 34 % of the frame height (captions live at 66 %)
    o = o || {};
    const ly0 = Ap.y - 0.16 * frameH(d0), ly1 = Ap.y - 0.16 * frameH(d1);
    K.push([t0, [Ap.x + (o.dx0 || 0), ly0, Ap.z + d0], [Ap.x, ly0, Ap.z], o.ap || 9, Ap]);
    K.push([t1, [Ap.x + (o.dx1 || 0), ly1, Ap.z + d1], [Ap.x, ly1, Ap.z], o.ap || 9, Ap]);
  }
  const DUR = V.duration;
  hold(A1, 0.0, L("l01").end + 0.1, 1.75, 1.6, { dx0: 0.04 });
  hold(A2, L("l02").start + 0.4, L("l02").end + 0.1, 1.7, 1.55, { dx0: -0.05 });
  hold(A3, L("m1").start - 0.3, DUR + 0.2, 1.75, 1.6);
  // stations pop in when the camera leaves the previous one and scale out when it leaves them; lights follow
  const lastKey = (a) => { let tt = null; K.forEach((k) => { if (k[4] === a) tt = k[0]; }); return tt; };
  S.forEach((st, j) => { st.tout = j === S.length - 1 ? 1e9 : lastKey(st.A); st.tin = j === 0 ? -1e9 : lastKey(S[j - 1].A) + 0.02; st.on = [st.tin, st.tout + 0.4]; });
  const stationScale = (st, t) => { const ui = clamp((t - st.tin) / 0.42, 0, 1), uo = clamp((t - st.tout) / 0.32, 0, 1);
    return Math.max(1e-4, (st.tin < -1e8 ? 1 : (ui <= 0 ? 0 : easeBack(ui))) * (1 - uo * uo * uo)); };
  function camAt(t) {
    let i = 0;
    while (i < K.length - 2 && t >= K[i + 1][0]) i++;
    const a = K[i], b = K[i + 1], u = clamp((t - a[0]) / (b[0] - a[0]), 0, 1);
    const long = b[0] - a[0] > 1.6, e = long ? (u * u * (3 - 2 * u)) * 0.35 + u * 0.65 : easeIO(u);
    const mix = (x, y) => [lerp(x[0], y[0], e), lerp(x[1], y[1], e), lerp(x[2], y[2], e)];
    return { pos: mix(a[1], b[1]), look: mix(a[2], b[2]), ap: lerp(a[3], b[3], e) + (long ? 0 : 6 * Math.sin(Math.PI * u)) };
  }
  function update(t) {
    S.forEach((s) => {
      const roots = s.objs().map((o) => (Array.isArray(o) ? o : [o, 0]));
      roots.forEach(([ob]) => ob.scale.setScalar(1));
      s.update(t);
      const inside = t >= s.on[0] && t <= s.on[1], k = stationScale(s, t);
      roots.forEach(([ob, managed]) => { if (!inside) ob.visible = false; else if (!managed) ob.visible = true; ob.scale.multiplyScalar(k); });
    });
    let lights = [];
    S.forEach((s) => {
      const lk = (s.tin < -1e8 ? 1 : sstep(s.tin + 0.1, s.tin + 0.55, t)) * (1 - sstep(s.tout, s.tout + 0.35, t));
      if (lk > 0.001) lights = lights.concat(s.lights(t).map((l) => Object.assign({}, l, { i: l.i * lk })).filter((l) => l.i > 0.01));
    });
    lights = lights.sort((a, b) => b.i - a.i).slice(0, 4);
    const c = camAt(t);
    const hx = Math.sin(t * 0.31 + 1.0) * 0.006, hy = Math.sin(t * 0.27 + 2.0) * 0.005;
    return { t, cam: [c.pos[0] + hx, c.pos[1] + hy, c.pos[2]], look: [c.look[0] + hx * 0.6, c.look[1] + hy * 0.6, c.look[2]], fov: FOV,
      roll: Math.sin(t * 0.17) * 0.25, focus: c.look, aperture: c.ap, lights, black: fade(t, DUR - 1.0, DUR - 0.1) };
  }
  return { update, stations: S, keys: K };
};

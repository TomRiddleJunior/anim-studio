/* Template film (~10.7 s): the format's grammar in three beats, driven by the narration's word times.
   1 hook outside at dusk (label, the fox walks up, the owl watches) -> zoom through the door
   2 inside: the predator's promise as a bubble that becomes a sign; DAY 1-3 with tallies and night dips
   3 "It's a fable": the frame shrinks into an A FABLE photo card, the navy stage, a two-colour title.
   Replace the clock (T), the labels and the sets with your own fable; the sample's film.js is the full 60 s reference. */
window.FB_FILM = function (K, V) {
  const { ctx, W, H, P, clamp, lerp, lin, sstep, eio, eout } = K;
  const DUR = V.duration;
  const T = { knock: V.w("hook", "knocked"), offer: V.L("offer").start, nothing: V.w("offer", "nothing"), turn: V.L("turn").start, pattern: V.w("turn", "pattern") };
  T.zin = T.offer - 0.55; T.sign = V.L("offer").end + 0.1; T.shrink = T.turn + 0.3;
  const BUF = document.createElement("canvas"); BUF.width = W; BUF.height = H; const b = BUF.getContext("2d");
  let C = ctx;
  const use = (c) => { C = c; K.setCtx(c); };
  const cam = (z, cx, cy) => C.setTransform(z, 0, 0, z, W / 2 - z * cx, H / 2 - z * cy);
  const on = (t, a, z, fi = 0.15, fo = 0.15) => Math.min(lin(a, a + fi, t), 1 - lin(z - fo, z, t));
  const DOOR = [595, 1046];
  function outside(t, zoom) {
    cam(...zoom);
    K.sky(0); K.sun(200, 770, 70, 1); K.hills(0); K.ground(0, 1170); K.fence(-40, 220, 1196, 0);
    K.coopOut(470, 1196, { door: 0 });
    K.owl(140, 1084, 0.78, { t, look: -0.8, blink: (t % 3.3) > 3.15 ? 1 : 0 });
    const walking = t < 2.2;
    K.fox(lerp(1010, 815, eout(lin(0, 2.2, t))), 1206, 0.86, { dir: -1, walk: walking ? t * 9 : null });
    C.setTransform(1, 0, 0, 1, 0, 0);
  }
  function inside(t) {
    cam(lerp(1.1, 1.0, eout(lin(T.zin, T.zin + 1, t))), 560, 980);
    K.coopIn({ t, lx: 470 });
    K.doorIn({ ajar: 0, bolt: 1 });
    const sA = lin(T.sign - 0.1, T.sign + 0.1, t);
    if (sA > 0) K.sign({ lines: ["NOTHING", "AT ALL"], x: 660, y: 760, a: sA, swing: 0.12 * Math.exp(-(t - T.sign) * 2.2) * Math.sin((t - T.sign) * 9), w: 250, h: 128, px: 40 });
    const day = t < T.sign + 0.5 ? 0 : t < T.sign + 0.9 ? 1 : t < T.sign + 1.3 ? 2 : 3;
    if (day) { K.dayPill({ day, x: 70, y: 470 }); K.tally({ n: day, x: 96, y: 520, perRow: 6, h: 48, gap: 13, groupGap: 24 }); }
    [[119, 1252, 0], [255, 1242, 2], [394, 1250, 3], [531, 1246, 1], [196, 1318, 1], [330, 1322, 0], [462, 1318, 2]].forEach(([x, y, col], i) => K.hen(x, y, 1.12, { col, bob: Math.sin(t * 2.3 + i) * 2, eye: t < T.nothing ? "wide" : "happy" }));
    const bA = on(t, T.nothing - 0.05, T.sign + 0.1);
    if (bA > 0) K.bubble({ lines: ["NOTHING AT ALL."], x: 760, y: 560, tx: 860, ty: 660, a: bA, pop: lin(T.nothing - 0.05, T.nothing + 0.25, t) });
    C.setTransform(1, 0, 0, 1, 0, 0);
    for (const tn of [T.sign + 0.9, T.sign + 1.3]) { const k = Math.max(0, 1 - Math.abs(t - tn) / 0.2); if (k > 0) K.shade(0.42 * k, "#0d1030"); }
  }
  function draw(t) {
    t = clamp(t, 0, DUR - 1e-4);
    use(ctx); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    if (t < T.zin) outside(t, [1 + 0.05 * eio(lin(0, T.zin, t)), 540, 960]);
    else if (t < T.zin + 0.5) {
      const u = eio(lin(T.zin, T.zin + 0.5, t));
      inside(t);
      use(b); b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; outside(t, [lerp(1.05, 4.2, u), lerp(540, DOOR[0], u), lerp(960, DOOR[1], u)]); use(ctx);
      ctx.globalAlpha = 1 - sstep(0.35, 0.95, u); ctx.drawImage(BUF, 0, 0); ctx.globalAlpha = 1;
    } else if (t < T.shrink) inside(t);
    else {
      use(b); b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; inside(t); use(ctx);
      K.navy();
      const k = eout(lin(T.pattern - 0.1, T.pattern + 0.3, t));
      K.text("THE PATTERN", 540, 330, { px: 30, ls: 9, col: "#c6cde6", a: lin(T.shrink + 0.6, T.shrink + 0.9, t) });
      if (k > 0) { K.text("YOUR IDEA", 540, 440, { px: 96, col: "#fbf3e6", a: k }); K.text("HERE", 540, 552, { px: 124, col: P.yellow, a: k }); }
      K.owl(150, 1336, 1.0, { t, wing: 0.6 * k, look: 0.6, blink: (t % 2.9) > 2.75 ? 1 : 0 });
      const us = eio(lin(T.shrink, T.shrink + 0.6, t)), ud = eio(lin(T.shrink + 0.9, T.shrink + 1.5, t));
      K.photo({ img: BUF, x: 540, y: lerp(960, 900, us) + 1900 * ud, s: lerp(1, 0.74, us), rot: lerp(0, -0.035, us), tagA: lin(T.shrink + 0.3, T.shrink + 0.5, t), border: us });
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (t < T.zin + 0.2) K.label({ lines: ["A KNOCK AT DUSK"], a: Math.min(1, (T.zin + 0.2 - t) / 0.15) });
    else if (t < T.shrink) K.label({ lines: ["IT ASKED FOR NOTHING"], a: on(t, T.zin + 0.45, T.shrink), pop: lin(T.zin + 0.45, T.zin + 0.75, t) });
    K.vignette(0.32); K.grain(t, 0.05);
    if (!window.FB_NO_CAPTIONS) K.captions(V.chunks.map((c, i) => (i === 0 ? { ...c, t0: 0 } : c)), t);
  }
  return { draw, T };
};

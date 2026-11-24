/* Template film (dark parable): 3 shots, ~11 s. Copy the pattern: each shot = {t0, xf, draw(c, lt, u, t)}, timed on the
   voice with V.L(id).start / V.w(id, word). The full 27-shot film is ../../sample/film.js. */
window.DP_FILM = function (K, V) {
  const { D, P, E, ramp, lerp } = K;
  const L = (id) => V.L(id).start, w = V.w;
  const T = { s1: 0, s2: L("t02") - 0.15, s3: L("t03") - 0.3 };
  const shots = [
    { // hook: the hand from above drives the stake; the gold rope ties the baby elephant (frame 1 works as a still)
      t0: T.s1, draw(c, lt) {
        D.grid(c, 1180, 540, 1); D.camp(c, 1180, 0.8);
        D.push(c, 540, 1400, 1 + lt * 0.03);
        const drive = ramp(lt, 0, 1.2, E.o), sx = 250, sy = 1600, sh = lerp(300, 200, drive);
        const e = D.elephant(c, { x: 640, y: 1640, s: 2.05, baby: 1, eye: "open", trunk: 0.15 });
        D.stake(c, sx, sy, sh, { below: 30, lw: 3 });
        const tie = ramp(lt, 0.25, 1.4, E.io);
        D.rope(c, sx + 8, sy - 150, lerp(sx + 10, e.back.x, tie), lerp(sy - 150, e.back.y, tie), { sag: 70, taut: 0.2, w: 7, blur: 20 });
        D.handDown(c, sx, sy - sh - 40 - ramp(lt, 1.6, 2.6, E.io) * 1100, 1.45);
      } },
    { // the struggle, then the stop: the rope goes slack
      t0: T.s2, draw(c, lt, u, t) {
        D.grid(c, 1180, 540, 1);
        D.push(c, 560, 1450, 1.12 + lt * 0.04);
        const stop = ramp(t, w("t02", "stopped") - 0.3, w("t02", "stopped") + 0.4, E.io);
        const lean = (0.5 + 0.5 * Math.sin(lt * 5.2)) * (1 - stop);
        const e = D.elephant(c, { x: 590 + lean * 18, y: 1560, s: 1.55, baby: 1, lean, eye: stop > 0.5 ? "sad" : "open", head: stop * 0.16 });
        D.stake(c, 150, 1530, 130, { below: 0 });
        D.rope(c, 154, 1430, e.back.x, e.back.y, { taut: 1 - stop, sag: 40 });
      } },
    { // the concept named: a giant low-angle elephant beside the tiny stake
      t0: T.s3, xf: 0.5, draw(c, lt) {
        D.grid(c, 1450, 540, 1);
        D.push(c, 420, 1600, 1 + lt * 0.05);
        const e = D.elephant(c, { x: 700, y: 1650, s: 2.6, baby: 0, eye: "closed", head: 0.14 });
        D.stake(c, 250, 1655, 50, { below: 0, lw: 2 });
        D.rope(c, 253, 1620, e.back.x, e.back.y, { taut: 0, sag: 24, w: 4 });
      } },
  ];
  return { shots, T };
};

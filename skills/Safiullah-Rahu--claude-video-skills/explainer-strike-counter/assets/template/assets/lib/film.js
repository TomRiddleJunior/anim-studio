/* Template film (6.0 s): the format's grammar on a neutral prop. A figure pushes a heavy crate; PUSHES counts 0 -> 20
   with smeared pushes and the crate doesn't move; a scan line shows the inside (the wheels under it have been freeing a
   little with every push); push 21 rolls it, gold light from underneath, rays. Replace this file with your own metaphor
   (keep the clock structure: slow first counts, the race, the rest + reveal, the last one, the release, the loop). */
window.SK_FILM = function (K) {
  const { ctx, clamp, lerp, sstep, lin, eio, eout, back, rng } = K;
  const DUR = 6.0;
  const T = { race: [0.4, 2.6], reveal: [2.9, 3.3], last: 4.0, cap1: [0.5, 2.8], cap2: [2.85, 3.95], cap3: [4.3, 5.6] };
  const BOX = { x: 520, y: 1010, w: 420, h: 320 };
  const keys = [[0.4, 0], [0.6, 1], [1.0, 4], [2.2, 18], [2.6, 20]];
  const count = (t) => { if (t < 0.4) return 0; if (t >= T.last) return 21; for (let i = 0; i < keys.length - 1; i++) { const [a, na] = keys[i], [b, nb] = keys[i + 1]; if (t >= a && t < b) return Math.floor(lerp(na, nb, (t - a) / (b - a))); } return 20; };
  const push = (t) => t < T.race[1] ? Math.max(0, Math.sin(t * (t < 1 ? 9 : 22))) : t > T.last - 0.25 && t < T.last + 0.1 ? 1 : 0;
  const release = (t) => t < T.last ? 0 : eout(lin(T.last, T.last + 0.7, t)) * (1 - sstep(5.6, 5.95, t));
  const slide = (t) => t < T.last ? 0 : 60 * eout(lin(T.last, T.last + 0.6, t)) * (1 - sstep(5.6, 5.95, t));
  function pose(t, p) {
    const lean = 0.35 + 0.18 * p, hx = 390 + 18 * p;
    return { hip: [hx, 1150], torso: lean, headTilt: 0.15, hands: [[BOX.x + 6, 1110], [BOX.x + 2, 1150]], feet: [[452, 1312], [300, 1312]] };
  }
  function crate(t) {
    const dx = slide(t), x = BOX.x + dx;
    ctx.save();
    ctx.fillStyle = "#3d342c"; K.rr(x, BOX.y, BOX.w, BOX.h, 14); ctx.fill();
    ctx.strokeStyle = "#5a4c3e"; ctx.lineWidth = 6; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x, BOX.y + k * 80); ctx.lineTo(x + BOX.w, BOX.y + k * 80); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x + 20, BOX.y + 20); ctx.lineTo(x + BOX.w - 20, BOX.y + BOX.h - 20); ctx.stroke();
    // the inside (x-ray above the scan line): wheels, and how far each has worked loose (the hidden progress)
    const sy = BOX.y + BOX.h * eio(lin(T.reveal[0], T.reveal[1], t));
    if (t > T.reveal[0] && t < T.last + 0.3) {
      ctx.save(); ctx.beginPath(); ctx.rect(x - 5, BOX.y - 5, BOX.w + 10, sy - BOX.y + 5); ctx.clip();
      ctx.globalAlpha = 1 - lin(T.last, T.last + 0.3, t);
      ctx.fillStyle = "#24324a"; K.rr(x, BOX.y, BOX.w, BOX.h, 14); ctx.fill();
      for (const wx of [x + 90, x + BOX.w - 90]) { ctx.strokeStyle = "rgba(190,222,255,0.8)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(wx, BOX.y + BOX.h - 60, 44, 0, Math.PI * 2); ctx.stroke(); K.glow(wx, BOX.y + BOX.h - 60, 70, [255, 190, 90], 0.5 + 0.2 * Math.sin(t * 6)); }
      ctx.restore();
      if (t < T.reveal[1] + 0.1) K.scan({ y: sy, x0: x, x1: x + BOX.w, a: 1 - lin(T.reveal[1], T.reveal[1] + 0.1, t) });
    }
    ctx.restore();
  }
  function draw(t) {
    t = clamp(t, 0, DUR); if (t >= DUR - 1e-4) t = 0;
    K.clear("#000");
    const L = release(t);
    K.rays({ x: BOX.x + 200 + slide(t), y: 1300, k: L, t, n: 9 });
    K.glow(BOX.x + 200 + slide(t), 1320, 600, [255, 180, 90], 0.4 * L);
    K.ground({ warm: L, glowX: 740 });
    crate(t);
    const p = push(t), v = Math.abs(push(t) - push(Math.max(0, t - 1 / 60))) * 60;
    if (v > 4 && t < T.race[1]) for (let g = 2; g >= 1; g--) K.figure({ ...pose(t, push(Math.max(0, t - g * 0.03))), armsOnly: true, a: 0.25 / g });
    K.figure({ ...pose(t, p), warm: L });
    const n = count(t);
    K.counter({ n, label: n === 1 ? "PUSH" : "PUSHES", gold: t >= T.last ? 1 - sstep(5.6, 5.9, t) : 0, flash: t >= T.last && t < T.last + 0.6 ? 1 - lin(T.last, T.last + 0.6, t) : 0 });
    const cap = (lines, [a, b]) => K.caption({ lines, a: Math.min(eout(lin(a, a + 0.3, t)), 1 - lin(b - 0.15, b, t)), rise: 10 * (1 - eout(lin(a, a + 0.3, t))) });
    cap(["It wouldn't budge."], T.cap1); cap(["Underneath, it was loosening."], T.cap2); cap(["Push 21 got the credit.", "The first 20 did the work."], T.cap3);
  }
  return { draw, DUR, T, count };
};

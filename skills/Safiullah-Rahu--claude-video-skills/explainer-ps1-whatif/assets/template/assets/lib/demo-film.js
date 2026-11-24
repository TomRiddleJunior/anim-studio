/* demo-film.js — a 4-shot demo of the PS1 what-if grammar (hook title -> the mistake -> REWIND -> PLAY -> end card).
   window.FILM(K, W, V) -> { frame(t), shots }. Copy the structure of the sample's rewind-film.js for a full reel. */
window.FILM = function (K, W, V) {
  const C = W.cast, clamp = K.clamp, lerp = K.lerp, sm = K.smooth;
  const eio = (u) => { u = clamp(u, 0, 1); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
  const L3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const S = (id) => V.L(id).start;
  const LIGHT = { sun: { dir: [-0.45, -1, 0.35], col: "#fff1dc", k: 0.95 }, amb: { sky: "#c3cbd8", gnd: "#958a7c" }, fog: { col: "#cfd4da", near: 45, far: 260 }, bloom: 0.5, haze: 0.7 };
  const stepY = (z) => (z <= -14 ? 1.6 : z >= -10.8 ? 0.16 : 0.2 * (Math.floor((-10.8 - z) / 0.4) + 1));
  const phaseOf = (d) => d / 0.69 * Math.PI;
  function tripAct(a, clean) { // a = story seconds; the rewind is this clock running backwards
    const v = 1.05, z0 = -14.6, aT = 1.4;
    if (clean || a < aT) {
      const z = z0 + v * a, st = { pos: [0.55, stepY(z), z], walk: { phase: phaseOf(z + 30), amt: 1 }, expr: clean && a > aT + 0.2 ? "smile" : "neutral", blink: a };
      if (clean) { const b = Math.max(0, 1 - Math.abs(a - aT) / 0.3); st.add = { hipL: [-0.55 * b, 0, 0], knL: [0.9 * b, 0, 0] }; st.pos[1] += 0.06 * b; }
      return st;
    }
    const u = sm((a - aT) / 0.6), zT = z0 + v * aT, z = zT + 1.5 * u;
    return { pos: [0.55, lerp(stepY(zT), stepY(z) - 0.62, u), z], ry: 0.12 * u, pose: "relaxed", pose2: "fall", k: u, expr: u < 0.15 ? "surprised" : "worried" };
  }
  const RW = (t, a, b) => (t < a || t > b ? 0 : Math.min(1, (t - a) / 0.06, (b - t) / 0.16));
  const aOf = (t) => t - 1.95;
  const sh = [];
  const shot = (t0, fn) => sh.push({ t0, fn });
  shot(0, (tt, u, t) => { C.you.set(tripAct(aOf(t), false)); return { cam: L3([5.6, 2.3, -1.0], [4.8, 2.2, -2.6], eio(u)), look: [0.2, 2.5, -14], fov: 52 }; });
  shot(S("h2"), (tt, u, t) => { C.you.set(tripAct(aOf(t), false)); return { cam: L3([5.6, 2.3, -11.2], [5.3, 2.2, -11.0], u), look: L3([0.5, 1.4, -12.8], [0.5, 0.9, -12.0], eio(u)), fov: 50 }; });
  const ra = S("h3") - 0.05, rb = S("h4") - 0.05;
  shot(ra, (tt, u, t) => { C.you.set(tripAct(lerp(aOf(ra), 0.55, eio(u)), false)); return { cam: [5.4, 2.25, -11.1], look: [0.5, 1.2, -12.5], fov: 50, rew: RW(t, ra, rb) }; });
  shot(rb, (tt, u, t) => { C.you.set(tripAct(0.55 + (t - rb) * 1.05, true)); return { cam: L3([1.4, 1.0, -7.6], [1.2, 1.05, -8.2], u), look: L3([0.55, 1.9, -13.2], [0.55, 1.4, -11.0], eio(u)), fov: 50 }; });
  shot(V.endCard, (tt, u) => ({ cam: L3([24, 40, 14], [24, 44, 15], u), look: [22, 0, 2], fov: 50 }));
  function frame(t) {
    let i = 0; while (i < sh.length - 1 && t >= sh[i + 1].t0) i++;
    const s = sh[i], t1 = i < sh.length - 1 ? sh[i + 1].t0 : V.dur, tt = t - s.t0, u = clamp(tt / Math.max(0.001, t1 - s.t0), 0, 1);
    W.show(["city"]); W.hideCast(); W.phone.visible = false; W.petals.visible = false;
    for (let k = 0; k < W.cars.length; k++) { const c = W.cars[k], sp = k % 2 ? 1 : -1; c.visible = true; c.position.set(((k * 41 + t * 6 * sp) % 160 + 160) % 160 - 80, 0, sp > 0 ? -2.6 : 2.6); c.rotation.set(0, sp > 0 ? 0 : Math.PI, 0); }
    return Object.assign({ t, sun: LIGHT.sun, amb: LIGHT.amb, fog: LIGHT.fog, bloom: LIGHT.bloom, haze: LIGHT.haze, expo: 1.08 }, s.fn(tt, u, t));
  }
  return { frame, shots: sh };
};

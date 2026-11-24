/* money-news shot list: one function per 3D scene -> the render state for time t (absolute seconds).
 * Times come from window.MN_TL (tools/build.py, from the Kokoro word times), so a re-voiced script re-times every move.
 * Camera rules (SKILL.md §6): every 3D shot moves (dolly, push-in or orbit) and drifts like a handheld rig; every light
 * change sits on a spoken word; motion blur only on whips and fast tilts.
 */
window.MN_SHOTS = function (K, TL) {
  const A = TL.anch;
  const sc = {}; TL.scenes.forEach((s) => (sc[s.id] = s));
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const L3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const io = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const out3 = (u) => 1 - Math.pow(1 - u, 3);
  const sm = (a, b, t) => { const u = clamp((t - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const U = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  // handheld drift: two incommensurate sines per axis, amplitude in metres
  const drift = (t, a) => [a * (Math.sin(t * 0.83) * 0.6 + Math.sin(t * 1.91 + 1.3) * 0.4), a * 0.7 * (Math.sin(t * 1.13 + 0.4) * 0.6 + Math.sin(t * 2.37) * 0.4), 0];
  const add = (p, d) => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];

  const S = {};
  // S1 · warehouse of pallets: dolly down the aisle; on "single day" the light rows go out from the far end to us; whip out
  S.S1 = (t) => {
    const s = sc.S1, u = U(t, s.t0, s.t1), e = out3(u);
    const cam = add(L3([0, 4.7, 8.5], [0, 4.1, 2.6], e), drift(t, 0.03));
    let look = [0, -4.0, -26 + 5.9 * e];
    const td = A.S1_dark;
    const dark = t < td ? -999 : lerp(-75, cam[2] + 9, Math.pow(U(t, td, td + 1.0), 0.8));
    let mb = [0, 0];
    const w = U(t, s.t1 - 0.16, s.t1);
    if (w > 0) { look = [look[0] + 14 * w * w, look[1], look[2]]; mb = [170 * w, 0]; }
    return { set: "warehouse", cam, look, fov: 50, focus: 13, aperture: 4, maxBlur: 20, mblur: mb, exposure: 0.88,
      p: { dark, darkK: 0.04, t } };
  };
  // S2 · window seat: push toward the half-shaded window; the wing glows soft outside (focus on the window frame)
  S.S2 = (t) => {
    const s = sc.S2, u = U(t, s.t0, s.t1 + s.hold), e = io(u);
    const cam = add(L3([0.2, 0.07, 0.78], [0.11, 0.03, 0.5], e), drift(t, 0.006));
    const look = [-0.25, -0.5, -2.0];
    const win = U(t, s.t0, s.t0 + 0.14);
    return { set: "cabin", cam, look, fov: 44, focus: [0, 0, -0.06], aperture: 12, maxBlur: 40, mblur: [-150 * (1 - win) * (win < 1 ? 1 : 0), 0],
      exposure: 0.88, p: { shade: 0.34, sun: 1, inside: 1 } };
  };
  // S7 · departures board: low push; rows flip to DELAYED from "spooked" and are all red on "wait"
  S.S7 = (t) => {
    const s = sc.S7, u = U(t, s.t0 - s.pre, s.t1), e = io(u);
    const cam = add(L3([1.6, 2.0, 10.6], [0.9, 2.3, 8.8], e), drift(t, 0.02));
    return { set: "board", cam, look: [0.05, 4.75, 0], fov: 36, focus: [0, 4.2, 0], aperture: 10, maxBlur: 40,
      p: { flip: sm(A.S7_flip0, A.S7_wait + 0.25, t), t } };
  };
  // S8 · receipt: (a) printer + header, slow tilt down; (b) a fast tilt down 367 lines to the total; stamp on "won't"
  S.S8 = (t) => {
    const s = sc.S8, R = K.SETS.receipt;
    const yHead = R.yOf(150), yTot = R.yOf(K.RC.totalY + 60);
    if (t < A.S8_cut) {
      const e = io(U(t, s.t0, A.S8_cut));
      const ly = lerp(yHead - 0.15, R.yOf(640), e);
      const cam = add([0.3, ly + 0.25, lerp(3.75, 3.45, e)], drift(t, 0.004));
      return { set: "receipt", cam, look: [0.0, ly, 0.2], fov: 30, focus: [0, ly, 0.22], aperture: 7, maxBlur: 30, p: { stamp: 0 } };
    }
    const t0 = A.S8_cut, t1 = A.S8_total + 0.12;
    const u = U(t, t0, t1), e = io(u);
    const y0 = R.yOf(720);
    const yEnd = yTot - 0.3;                                    // the total block lands in the upper half, captions below
    const ly = lerp(y0, yEnd, e);
    const dt = 1 / 30, e2 = io(U(t + dt, t0, t1));
    const vy = (lerp(y0, yEnd, e2) - ly) / dt;                 // scene units / s
    const hold = U(t, t1, s.t1 + s.hold);
    const cam = add([0.16, ly + 0.18, lerp(3.75, 3.5, out3(hold))], drift(t, 0.004));
    return { set: "receipt", cam, look: [0.0, ly, 0.2], fov: 30, focus: [0, ly, 0.22], aperture: 7, maxBlur: 30,
      mblur: [0, clamp(-vy * 1150 / 40, -190, 190)], p: { stamp: U(t, A.S8_stamp, A.S8_stamp + 0.16) } };
  };
  // S9 · two stacks: slow orbit; $3B drops in brick by brick under a warm spot, then the $5.5B expected stack, cool spot
  S.S9 = (t) => {
    const s = sc.S9, u = U(t, s.t0, s.t1 + s.hold), e = io(u);
    const ang = lerp(-30, -10, e) * Math.PI / 180, r = lerp(10.6, 9.6, e), h = lerp(5.4, 4.4, e);
    const cam = add([Math.sin(ang) * r, h, Math.cos(ang) * r], drift(t, 0.02));
    return { set: "stacks", cam, look: [0, 1.7, 0.3], fov: 36, focus: [0, 1.5, 0], aperture: 9, maxBlur: 36,
      p: { la: sm(A.S9_la - 0.25, A.S9_la + 0.05, t), lb: sm(A.S9_lb - 0.1, A.S9_lb + 0.2, t),
        a: clamp((t - A.S9_a) / 0.26, 0, 3), b: clamp((t - A.S9_b) / 0.14, 0, 6) } };
  };
  // S11 · back at the window: the shade lifts, focus pulls from the frame to the engine on "engines", then a dive
  S.S11 = (t) => {
    const s = sc.S11, u = U(t, s.t0 - s.pre, A.S11_dive), e = io(u);
    let cam = add(L3([0.14, 0.05, 0.62], [0.06, 0.0, 0.3], e), drift(t, 0.005));
    let fov = 44, flash = 0, mb = [0, 0];
    const fe = sm(A.S11_eng - 0.1, A.S11_eng + 0.45, t);
    const fDist = lerp(0.62, 6.5, fe);
    const d = U(t, A.S11_dive, s.t1);
    if (d > 0) { cam = L3(cam, [-0.02, -0.06, 0.03], d * d); fov = lerp(44, 20, d * d); flash = 0.9 * Math.pow(d, 3); }
    return { set: "cabin", cam, look: [-0.25, -0.5, -2.0], fov, focus: fDist, aperture: 12, maxBlur: 40, flash, mblur: mb, exposure: 0.88,
      p: { shade: lerp(0.34, 0.0, sm(s.t0 - s.pre, s.t0 + 0.7, t)), sun: 1.1, inside: 1 } };
  };
  // S12 · the wing on its jigs: (a) lamps bang on row by row on "It's the wings", low dolly along the leading edge;
  //       (b) high angle from the tip end looking back down the span
  S.S12 = (t) => {
    const s = sc.S12;
    const flash = 0.8 * Math.pow(1 - U(t, s.t0, s.t0 + 0.3), 2);
    if (t < A.S12_cut) {
      const e = io(U(t, s.t0, A.S12_cut));
      const cam = add(L3([0.2, 6.8, 10.0], [1.0, 6.1, 7.4], e), drift(t, 0.02));
      return { set: "hangar", cam, look: L3([5.0, 2.8, -8.0], [5.6, 3.0, -9.0], e), fov: 44, focus: [3.0, 3.4, 0.0], aperture: 8, maxBlur: 40, flash,
        p: { lights: sm(s.t0 + 0.02, s.t0 + 0.9, t), warm: 1, t } };
    }
    const e = io(U(t, A.S12_cut, s.t1 + s.hold));
    const cam = add(L3([11.5, 7.6, -14.5], [10.4, 7.0, -12.4], e), drift(t, 0.02));
    return { set: "hangar", cam, look: [3.0, 3.4, 1.0], fov: 38, focus: [7.0, 4.0, -8.5], aperture: 9, maxBlur: 40,
      p: { lights: 1, warm: 1, t } };
  };
  return S;
};

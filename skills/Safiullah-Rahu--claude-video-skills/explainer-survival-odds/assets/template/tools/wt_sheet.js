/* look sheet for Mira: 8 one-second views on the upper deck under a neutral fill (face, 3/4s, profile, back, full body, hard hat) */
window.FILM_CREATE = Object.assign({}, window.SURVIVAL.rig.CREATE);
window.FILM_BUILD = function (K) { const Rg = window.SURVIVAL.rig(K); const hz = K.hazel(window.SURVIVAL.rig.MIRA); const mira = window.SURVIVAL.rig.dressMira(K, hz); return { Rg, hz, mira }; };
window.FILM = function (K, V, X) {
  const { Rg, hz } = X; const DU = Rg.P.DU;
  const P = [-6, DU, 2.0], H = DU + 1.66;
  const ST = { exposure: 1.0, moonI: 1.2, hemiI: 0.4, envI: 0.5, aperture: 5, sat: 0.95, flareI: 0.5, floodI: 0.6, crI: 0.6, rainK: 0, rays: 0, moonK: 0, starK: 0, cloudK: 1 };
  const cam = (yawDeg, dist, y, lookY) => { const a = yawDeg * Math.PI / 180; return { c: [P[0] + Math.sin(a) * dist, y, P[2] + Math.cos(a) * dist], l: [P[0], lookY, P[2]] }; };
  const shot = (t0, yaw, dist, y, ly, fov, set, hat) => { const c = cam(yaw, dist, y, ly); return { t0, cam: [c.c, c.c], look: [c.l, c.l], fov,
    st: Object.assign({}, ST, { focus: c.l, fill: { p: [c.c[0] * 0.6 + P[0] * 0.4, H + 0.5, c.c[2] * 0.6 + P[2] * 0.4], c: "#fff0e0", i: 2.2 } }),
    fn(t) { hz.setHat(!!hat); hz.set(Object.assign({ pos: P, ry: 0, t, blink: 0 }, set)); return {}; } }; };
  const shots = [
    shot(0, 0, 0.72, H, H - 0.02, 30, { pose: "stand", expr: "calm" }),
    shot(1, -35, 0.72, H, H - 0.02, 30, { pose: "stand", expr: "worried", head: [-6, 4] }),
    shot(2, 35, 0.72, H, H - 0.02, 30, { pose: "stand", expr: "determined", head: [4, -2] }),
    shot(3, 90, 0.8, H, H - 0.03, 30, { pose: "stand", expr: "neutral" }),
    shot(4, 160, 0.85, H, H - 0.04, 32, { pose: "stand", expr: "calm" }),
    shot(5, 0, 2.7, DU + 1.0, DU + 0.92, 42, { pose: "stand", expr: "calm" }),
    shot(6, 25, 2.5, DU + 1.1, DU + 0.95, 42, { pose: "rail", expr: "determined" }, true),
    shot(7, -30, 0.85, H, H, 30, { pose: "stand", expr: "neutral", head: [0, -4] }, true),
  ];
  return { shots, reset() {}, base: {} };
};

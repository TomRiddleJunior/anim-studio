/* lids check: Mira's expressions front-on (Day 1 'determined' vs Day 2's), 3/4, hat, blanket, torch */
window.FILM_CREATE = Object.assign({}, window.SURVIVAL.rig.CREATE);
window.FILM_BUILD = function (K) { const Rg = window.SURVIVAL.rig(K); const hz = K.hazel(window.SURVIVAL.rig.MIRA); const mira = window.SURVIVAL.rig.dressMira(K, hz); hz.EXPR.det1 = Object.assign({}, hz.EXPR.determined, { lid: -22, low: 14 }); return { Rg, hz, mira }; };
window.FILM = function (K, V, X) {
  const { Rg, hz } = X; const DU = Rg.P.DU;
  const P = [-6, DU, 2.0], H = DU + 1.66;
  const ST = { exposure: 1.0, moonI: 1.2, hemiI: 0.4, envI: 0.5, aperture: 5, sat: 0.95, flareI: 0.5, floodI: 0.6, crI: 0.6, rainK: 0, rays: 0, moonK: 0, starK: 0, cloudK: 1 };
  const cam = (yawDeg, dist, y, lookY) => { const a = yawDeg * Math.PI / 180; return { c: [P[0] + Math.sin(a) * dist, y, P[2] + Math.cos(a) * dist], l: [P[0], lookY, P[2]] }; };
  const shot = (t0, yaw, dist, y, ly, fov, set, hat, bl) => { const c = cam(yaw, dist, y, ly); return { t0, cam: [c.c, c.c], look: [c.l, c.l], fov,
    st: Object.assign({}, ST, { focus: c.l, fill: { p: [c.c[0] * 0.6 + P[0] * 0.4, H + 0.5, c.c[2] * 0.6 + P[2] * 0.4], c: "#fff0e0", i: 2.2 } }),
    fn(t) { hz.setHat(!!hat); hz.setBlanket(!!bl); hz.set(Object.assign({ pos: P, ry: 0, t, blink: 0 }, set)); return {}; } }; };
  const shots = [
    shot(0, 0, 0.72, H, H - 0.02, 30, { pose: "stand", expr: "calm" }),
    shot(1, 0, 0.72, H, H - 0.02, 30, { pose: "stand", expr: "worried" }),
    shot(2, 0, 0.72, H, H - 0.02, 30, { pose: "stand", expr: "det1" }),
    shot(3, 0, 0.72, H, H - 0.02, 30, { pose: "stand", expr: "determined" }),
    shot(4, 35, 0.72, H, H - 0.02, 30, { pose: "stand", expr: "determined", head: [4, -2] }),
    shot(5, -10, 0.85, H, H, 30, { pose: "stand", expr: "determined", head: [0, 0] }, true),
    shot(6, 15, 1.1, H - 0.15, H - 0.2, 34, { pose: "desk", expr: "worried", pos: [P[0], DU, P[2]], ry: 0 }, false, true),
    shot(7, 30, 1.6, H - 0.1, H - 0.25, 40, { pose: "flash", tool: "flash", expr: "worried" }),
  ];
  return { shots, reset() {}, base: {} };
};

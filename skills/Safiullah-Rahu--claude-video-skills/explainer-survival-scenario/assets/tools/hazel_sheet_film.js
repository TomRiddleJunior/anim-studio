/* character sheet for Hazel v2: 8 one-second shots inside the cab */
window.FILM_CREATE = { forest: { near: 300, mid: 300, far: 300, ring: 30 }, cars: 0, eyes: 0 };
window.FILM = function (K, V, X) {
  const { Tw, hz } = X;
  const F = Tw.TOP + 0.1;
  const P = [-0.95, F, 0.45], H = F + 1.72; // standing; head centre ~ F + 1.72
  const ST = { exposure: 1.0, lampI: 3.4, lanI: 1.8, moonI: 1.6, hemiI: 0.3, envI: 0.5, aperture: 6, sat: 0.92, fill: { p: [0.2, F + 1.9, 1.2], c: "#ffd2a8", i: 0.6 } };
  const cam = (yawDeg, dist, y, lookY) => { const a = (80 + yawDeg) * Math.PI / 180; return { c: [P[0] + Math.sin(a) * dist, y, P[2] + Math.cos(a) * dist], l: [P[0], lookY, P[2]] }; };
  const shot = (t0, yaw, dist, y, ly, fov, set, extra) => { const c = cam(yaw, dist, y, ly); return { t0, cam: [c.c, c.c], look: [c.l, c.l], fov, st: Object.assign({}, ST, { focus: c.l }, extra || {}), fn(t) { hz.set(Object.assign({ pos: P, ry: 80, t, blink: 0 }, set)); return {}; } }; };
  const shots = [
    shot(0, 0, 0.75, H, H - 0.02, 30, { pose: "stand", expr: "calm" }),
    shot(1, -35, 0.75, H, H - 0.02, 30, { pose: "stand", expr: "worried", head: [-6, 4] }),
    shot(2, 35, 0.75, H, H - 0.02, 30, { pose: "stand", expr: "determined", head: [4, -2] }),
    shot(3, 150, 0.85, H, H - 0.04, 32, { pose: "stand", expr: "calm" }),
    shot(4, 0, 2.6, F + 1.1, F + 0.95, 42, { pose: "stand", expr: "calm" }),
    shot(5, 40, 2.4, F + 1.1, F + 0.95, 42, { pose: "think", expr: "worried" }),
    { t0: 6, cam: [[-1.62, F + 1.44, -1.9], [-1.62, F + 1.44, -1.9]], look: [[0.12, F + 1.2, -1.2], [0.12, F + 1.2, -1.2]], fov: 34,
      st: Object.assign({}, ST, { focus: [0.15, F + 1.25, -1.18], lampI: 2.2, lanI: 1.8, fill: null }), fn(t) { hz.set({ pos: [0.15, F, -1.18], ry: 180, pose: "sit", head: [24, 12], expr: "calm", t, blink: 0 }); return {}; } },
    shot(7, -60, 1.6, F + 1.5, F + 1.3, 36, { pose: "binoc", tool: "binoc", expr: "neutral" }),
  ];
  return { shots, reset() {}, base: {} };
};

// Shared timing for the news-noir reel: shots, word onsets, helpers. Everything is a pure function of t (seconds).
(function () {
  const V = window.VO, DUR = V.dur;
  // unknown line ids (a template with fewer lines) read as times far past the end, so their events never fire
  const W = new Proxy(V.W, { get: (o, k) => (k in o ? o[k] : new Array(64).fill(1e6)) });
  const T = new Proxy(V.T, { get: (o, k) => (k in o ? o[k] : 1e6) });
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lin = (t, a, b) => clamp((t - a) / (b - a));
  const mix = (a, b, u) => a + (b - a) * u;
  const E = {
    io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    out: (x) => 1 - Math.pow(1 - x, 3),
    in: (x) => x * x * x,
    sine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
    back: (x, s = 1.7) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
  };
  const K = 0.08;
  // kind: "2d" drawn on the flat canvas, "3d" rendered by three.js; light: white background (captions get a box)
  const SH = [
    { id: "photo", t0: 0, kind: "2d", box: true },
    { id: "desk", t0: T.names - K, kind: "3d", box: true, xf: 0.4 },
    { id: "card", t0: T.card - K, kind: "2d" },
    { id: "map", t0: T.archive - K, kind: "2d", light: true, box: true, xf: 0.28 },
    { id: "network", t0: T.network - K, kind: "2d" },
    { id: "tape", t0: T.tape - K, kind: "3d" },
    { id: "portrait", t0: T.promise - K, kind: "2d" },
    { id: "blueprint", t0: T.register - K, kind: "2d" },
    { id: "link", t0: T.proof - K, kind: "2d" },
    { id: "globe", t0: T.lost - K, kind: "2d", light: true, box: true },
    { id: "corridor", t0: T.scale - K, kind: "3d", box: true },
    { id: "quotes", t0: T.quotes - K, kind: "2d" },
    { id: "zero", t0: T.reports - K, kind: "2d" },
    { id: "cabinet", t0: T.next - K, kind: "3d" },
  ];
  SH.forEach((s, k) => { s.t1 = k + 1 < SH.length ? SH[k + 1].t0 : DUR + 0.5; s.k = k; });
  const shotAt = (t) => { for (let k = SH.length - 1; k >= 0; k--) if (t >= SH[k].t0) return SH[k]; return SH[0]; };
  const pulse = (t, at, w) => Math.exp(-Math.pow((t - at) / w, 2));
  window.FILM = { V, W, T, DUR, SH, shotAt, lin, mix, clamp, E, pulse, K };
})();

// Shared timing and story state for the world (three.js) and hud (DOM) compositions.
// Everything is a pure function of t (seconds). Word onsets come from timing.js (Kokoro word times).
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
  const K = 0.08; // cuts land this far before the word

  // ---------- shots (13): id, start, set, location pill
  const SH = [
    { id: "hook", t0: 0, set: "barrier", loc: "NIEUWE WATERWEG · 2023" },
    { id: "map", t0: T.storm - K, set: "map", loc: "NORTH SEA · 21 DEC 2023" },
    { id: "channel", t0: W.channel[11] - K, set: "barrier", loc: "NIEUWE WATERWEG · 2023" },
    { id: "section", t0: T.parts - K, set: "section", loc: null },
    { id: "agency", t0: T.agency - K, set: "barrier", loc: "NIEUWE WATERWEG · 2023" },
    { id: "bos", t0: W.agency[9] - 0.1, set: "barrier", loc: "HOEK VAN HOLLAND · 2023" },
    { id: "gauge", t0: T.rule - K, set: "barrier", loc: "ROTTERDAM · TRIGGER" },
    { id: "evening", t0: T.evening - K, set: "barrier", loc: "NIEUWE WATERWEG · 2023" },
    { id: "docks", t0: W.halt[3] - K, set: "barrier", loc: "NIEUWE WATERWEG · 2023" },
    { id: "joint", t0: W.gates[6] - K, set: "barrier", loc: "NIEUWE WATERWEG · 2023" },
    { id: "panel", t0: T.time - K, set: "barrier", loc: "NIEUWE WATERWEG · 2023" },
    { id: "sink", t0: T.sink - K, set: "barrier", loc: "NIEUWE WATERWEG · 2023" },
    { id: "six", t0: T.six - K, set: "barrier", loc: "NIEUWE WATERWEG · 2023" },
  ];
  SH.forEach((s, k) => { s.t1 = k + 1 < SH.length ? SH[k + 1].t0 : DUR + 0.5; s.k = k; });
  const shotAt = (t) => { for (let k = SH.length - 1; k >= 0; k--) if (t >= SH[k].t0) return SH[k]; return SH[0]; };

  // ---------- story state
  const tSwing = W.gates[6], tSank = W.sink[7], tSeal = W.sink[8];
  // arm angle: -0.95 = in its dock (open), 0 = closed across the channel
  function phi(t) {
    if (t < SH[1].t0) return mix(-0.95, -0.62, E.io(lin(t, W.hook[5], SH[1].t0 - 0.2))); // flash-forward in the hook
    return mix(-0.95, 0, E.io(lin(t, tSwing, tSank + 0.2)));
  }
  const swing = (t) => (phi(t) + 0.95) / 0.95;
  // gate base height (units of 10 m): dry dock -1.6, floating -1.1, sunk -1.75
  function gateY(t) {
    if (t < SH[1].t0) return mix(-1.6, -1.15, E.io(lin(t, 1.2, 2.6)));
    let y = mix(-1.6, -1.1, E.io(lin(t, W.halt[5], W.halt[7] + 0.7)));
    y = mix(y, -1.78, E.io(lin(t, tSank, tSeal + 0.5)));
    return y;
  }
  function dockWater(t) {
    if (t < SH[1].t0) return E.io(lin(t, 0.3, 2.0));
    return E.io(lin(t, W.halt[5] - 0.1, W.halt[7] + 0.4));
  }
  // cyan shipping lane: 1 = open to ships, ~0.12 = halted
  function lane(t) {
    if (t < SH[1].t0) return mix(1, 0.12, E.io(lin(t, W.hook[5], W.hook[5] + 0.8)));
    return mix(1, 0.12, E.io(lin(t, W.halt[2] - 0.2, W.halt[2] + 0.6)));
  }
  // HUD: status and gap readout
  function status(t) {
    if (t < SH[1].t0) return t < W.hook[5] ? "OPEN" : "CLOSED";
    if (t < W.evening[4]) return "OPEN";
    if (t < tSeal) return "CLOSING";
    return "CLOSED";
  }
  function gap(t) { // metres between the gate tips
    if (t < SH[1].t0) return 360;
    return Math.round(360 * (1 - E.io(lin(t, tSwing + 0.6, tSeal + 0.25))));
  }
  const amber = (t) => (t < SH[1].t0 ? t >= W.hook[5] : t >= tSwing);

  window.FILM = { V, W, T, DUR, SH, shotAt, lin, mix, clamp, E, phi, swing, gateY, dockWater, lane, status, gap, amber,
    tSwing, tSank, tSeal };
})();

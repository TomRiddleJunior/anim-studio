/* Earth OS director — turns a film schedule into the globe kit's per-frame state, as a pure function of time.
 *
 *   const D = EarthOSDirector.create({
 *     hotspots: [{ id, lat, lon }],                       // same list the globe kit gets
 *     tickets:  [{ id, s, d }],                           // root seconds: start + length of each ticket scene
 *     boot:  { from: { lat, lon, alt, ox }, to: { lat, lon, alt, ox }, t: 6, pings: { id: secondsLit } },
 *     board: { t: 60, view: { lat, lon, alt, ox } },      // optional pull-back to the full orb
 *     end:   { t: 68, drift: { lon: -5, alt: 0.1 } },     // optional slow drift after the board
 *     dur: 72,
 *     hold: { dive: 0.17, push: 0.145, ox: -440, oy: -230 },   // dive altitude, end-of-hold altitude, screen shift
 *     flyAlt: 2.0, assemble: 2.5,
 *   });
 *   globe.render(D.stateAt(t));
 *
 * Ticket anatomy (scene-local seconds): fly 0-1.1 along the great circle (alt swells on long hops), dive 1.1-2.2
 * on log altitude (dots -> texture -> patch), hold until d-0.9 (slow push), pull-out d-0.9..d (patch -> texture ->
 * dots). The arc from the previous hotspot draws during the fly and is eaten by its tail during the dive.
 */
(function () {
  "use strict";
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const E = {
    linear: (u) => u,
    "power2.inOut": (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2),
    "power2.in": (u) => u * u,
    "power2.out": (u) => 1 - (1 - u) * (1 - u),
    "power3.out": (u) => 1 - Math.pow(1 - u, 3),
    "sine.inOut": (u) => -(Math.cos(Math.PI * u) - 1) / 2,
  };
  function vec(p) {
    const la = (p.lat * Math.PI) / 180, lo = (p.lon * Math.PI) / 180;
    return [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
  }
  function angle(a, b) {
    const A = vec(a), B = vec(b);
    return Math.acos(clamp(A[0] * B[0] + A[1] * B[1] + A[2] * B[2], -1, 1));
  }
  function slerpLL(a, b, u) {
    const A = vec(a), B = vec(b), w = angle(a, b);
    if (w < 1e-6) return { lat: a.lat, lon: a.lon };
    const s1 = Math.sin((1 - u) * w) / Math.sin(w), s2 = Math.sin(u * w) / Math.sin(w);
    const v = [A[0] * s1 + B[0] * s2, A[1] * s1 + B[1] * s2, A[2] * s1 + B[2] * s2];
    const n = Math.hypot(v[0], v[1], v[2]);
    return { lat: (Math.asin(v[2] / n) * 180) / Math.PI, lon: (Math.atan2(v[1], v[0]) * 180) / Math.PI };
  }

  function create(c) {
    const H = Object.assign({ dive: 0.17, push: 0.145, ox: -440, oy: -230 }, c.hold || {});
    const FLY = c.flyAlt || 2.0;
    const byId = {};
    c.hotspots.forEach((h) => (byId[h.id] = h));
    const b0 = c.boot.from, b1 = c.boot.to;
    const K = [
      { t: 0, lat: b0.lat, lon: b0.lon, alt: b0.alt, ox: b0.ox || 0, oy: 0 },
      { t: c.boot.t, lat: b1.lat, lon: b1.lon, alt: b1.alt, ox: b1.ox || 0, oy: 0, pos: "sine.inOut", altE: "sine.inOut" },
    ];
    let prev = b1;
    c.tickets.forEach((tk) => {
      const h = byId[tk.id];
      const ang = angle(prev, h);
      K.push({ t: tk.s + 1.1, lat: h.lat, lon: h.lon, alt: FLY, ox: 0, oy: 0, pos: "power2.inOut", altE: "power2.out", hop: (0.9 * ang) / Math.PI });
      K.push({ t: tk.s + 2.2, lat: h.lat, lon: h.lon, alt: H.dive, ox: H.ox, oy: H.oy, pos: "linear", altE: "power2.inOut" });
      K.push({ t: tk.s + tk.d - 0.9, lat: h.lat, lon: h.lon, alt: H.push, ox: H.ox, oy: H.oy, pos: "linear", altE: "linear" });
      K.push({ t: tk.s + tk.d, lat: h.lat, lon: h.lon, alt: 1.45, ox: 0, oy: 0, pos: "linear", altE: "power2.in", oxE: "power2.inOut" });
      prev = h;
    });
    if (c.board) {
      const v = c.board.view;
      K.push({ t: c.board.t + 1.6, lat: v.lat, lon: v.lon, alt: v.alt, ox: v.ox || 0, oy: 0, pos: "power2.inOut", altE: "power2.out" });
      const dr = (c.end && c.end.drift) || { lon: -8, alt: 0.15 };
      K.push({ t: c.dur, lat: v.lat, lon: v.lon + dr.lon, alt: v.alt + dr.alt, ox: v.ox || 0, oy: 0, pos: "linear", altE: "linear" });
    } else if (K[K.length - 1].t < c.dur) {
      const last = K[K.length - 1];
      K.push(Object.assign({}, last, { t: c.dur, pos: "linear", altE: "linear", hop: 0 }));
    }

    function cameraAt(t) {
      let i = 1;
      while (i < K.length - 1 && t > K[i].t) i++;
      const a = K[i - 1], b = K[i];
      const u = clamp((t - a.t) / (b.t - a.t), 0, 1);
      const up = E[b.pos || "linear"](u), ua = E[b.altE || "linear"](u), uo = E[b.oxE || b.pos || "linear"](u);
      const ll = slerpLL(a, b, up);
      const alt = Math.exp(Math.log(a.alt) + (Math.log(b.alt) - Math.log(a.alt)) * ua) + (b.hop || 0) * Math.sin(Math.PI * u);
      return { lat: ll.lat, lon: ll.lon, alt, ox: a.ox + (b.ox - a.ox) * uo, oy: a.oy + (b.oy - a.oy) * uo };
    }

    function stateAt(t) {
      const cam = cameraAt(t);
      const s = { t, lat: cam.lat, lon: cam.lon, alt: cam.alt, ox: cam.ox, oy: cam.oy, tilt: 0, look: 0 };
      s.assemble = clamp(t / (c.assemble || 2.5), 0, 1);
      s.core = s.assemble > 0.45 ? 1 : 0;
      s.tex = 0; s.dots = 1; s.patch = null; s.pings = {}; s.arcs = [];
      const pings = c.boot.pings || {};
      c.hotspots.forEach((h) => {
        const on = pings[h.id] == null ? 0 : sstep(pings[h.id], pings[h.id] + 0.35, t);
        s.pings[h.id] = on * (c.board && t >= c.board.t ? 1 : 0.5);
      });
      c.tickets.forEach((tk, i) => {
        const u = t - tk.s;
        if (u < -0.2 || u > tk.d) return;
        s.pings[tk.id] = Math.max(s.pings[tk.id], 0.5 + 0.5 * sstep(-0.2, 0.6, u));
        const din = sstep(1.25, 1.85, u), dout = sstep(tk.d - 0.75, tk.d - 0.2, u);
        s.tex = din * (1 - dout);
        s.dots = 1 - sstep(1.35, 1.95, u) * (1 - sstep(tk.d - 0.55, tk.d - 0.05, u));
        s.patch = { id: tk.id, amt: sstep(1.55, 2.1, u) * (1 - sstep(tk.d - 0.9, tk.d - 0.45, u)) };
        if (i > 0) {
          const head = E["power2.inOut"](clamp((u + 0.15) / 1.05, 0, 1));
          const tail = E["power2.in"](clamp((u - 0.7) / 0.9, 0, 1));
          s.arcs.push({ i: i - 1, head, tail, amt: 1 - sstep(1.4, 1.7, u) });
        }
      });
      return s;
    }
    return { stateAt, cameraAt, keys: K };
  }

  window.EarthOSDirector = { create, angle, slerpLL };
})();

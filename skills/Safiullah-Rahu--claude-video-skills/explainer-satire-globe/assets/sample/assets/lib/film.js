/* Holding Pattern — the film's one camera.
 *
 * Every layer reads the same pure function of root time:
 *   FILM.stateAt(t)        -> the globe state for EarthOSGlobe.render (camera lat/lon/alt/roll/ox/oy + looks)
 *   FILM.place(st, doc)    -> where a paper document pinned to the ground (doc.lat/lon, desk size w x h) sits on
 *                             screen: {x, y, a (deg), k (scale)}, by projecting it through the exact camera the
 *                             globe uses (fov 35, look at the centre, roll about the view axis, view offset).
 * So the dossier sheets lie on the real NASA imagery and stay glued to it through dives, whips and pull-outs.
 * Keys and stamps come from tools/build_v2.py (assets/lib/film-data.js, window.FILM_DATA).
 */
(function () {
  "use strict";
  const D = window.FILM_DATA;
  const D2R = Math.PI / 180;
  const W = 1920, H = 1080, FOV = 35;
  const PXS = H / 2 / Math.tan((FOV / 2) * D2R);
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const E = {
    linear: (u) => u,
    "power2.inOut": (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2),
    "power2.in": (u) => u * u,
    "power2.out": (u) => 1 - (1 - u) * (1 - u),
    "power3.out": (u) => 1 - Math.pow(1 - u, 3),
    "power3.inOut": (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
    "sine.inOut": (u) => -(Math.cos(Math.PI * u) - 1) / 2,
    "sine.out": (u) => Math.sin((u * Math.PI) / 2),
    "expo.inOut": (u) => (u === 0 ? 0 : u === 1 ? 1 : u < 0.5 ? Math.pow(2, 20 * u - 10) / 2 : (2 - Math.pow(2, -20 * u + 10)) / 2),
  };

  // ---- geometry (same layout as EarthOSGlobe.ll)
  function ll(lat, lon, r) {
    const phi = (90 - lat) * D2R, th = (lon + 180) * D2R;
    return [-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th)];
  }
  function vec(p) {
    const la = p.lat * D2R, lo = p.lon * D2R;
    return [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
  }
  function angle(a, b) {
    const A = vec(a), B = vec(b);
    return Math.acos(clamp(A[0] * B[0] + A[1] * B[1] + A[2] * B[2], -1, 1));
  }
  function slerpLL(a, b, u) {
    const w = angle(a, b);
    if (w < 1e-7) return { lat: a.lat + (b.lat - a.lat) * u, lon: a.lon + (b.lon - a.lon) * u };
    const A = vec(a), B = vec(b);
    const s1 = Math.sin((1 - u) * w) / Math.sin(w), s2 = Math.sin(u * w) / Math.sin(w);
    const v = [A[0] * s1 + B[0] * s2, A[1] * s1 + B[1] * s2, A[2] * s1 + B[2] * s2];
    const n = Math.hypot(v[0], v[1], v[2]);
    return { lat: (Math.asin(v[2] / n) * 180) / Math.PI, lon: (Math.atan2(v[1], v[0]) * 180) / Math.PI };
  }

  // ---- camera keys: {t, lat, lon, alt, r, ox, oy, e (position ease), ae (altitude ease), hop}
  const K = D.keys;
  function cameraAt(t) {
    let i = 1;
    while (i < K.length - 1 && t > K[i].t) i++;
    const a = K[i - 1], b = K[i];
    const u = clamp((t - a.t) / Math.max(1e-6, b.t - a.t), 0, 1);
    const up = E[b.e || "linear"](u), ua = E[b.ae || b.e || "linear"](u);
    const p = slerpLL(a, b, up);
    const alt = Math.exp(Math.log(a.alt) + (Math.log(b.alt) - Math.log(a.alt)) * ua) + (b.hop || 0) * Math.sin(Math.PI * u);
    return {
      lat: p.lat, lon: p.lon, alt,
      roll: (a.r || 0) + ((b.r || 0) - (a.r || 0)) * up,
      ox: (a.ox || 0) + ((b.ox || 0) - (a.ox || 0)) * up,
      oy: (a.oy || 0) + ((b.oy || 0) - (a.oy || 0)) * up,
    };
  }

  // rubber-stamp hits shake the whole camera (globe and paper together): ~0.3 s, decaying
  function shakeAt(t) {
    let x = 0, y = 0;
    for (const s of D.stamps) {
      const dt = t - s;
      if (dt < 0 || dt > 0.32) continue;
      const amp = 10 * Math.exp(-dt * 13);
      x += amp * Math.sin(dt * 97 + 1.3);
      y += amp * Math.cos(dt * 83 + 0.4);
    }
    return { x, y };
  }

  function stateAt(t) {
    const c = cameraAt(t);
    const sh = shakeAt(t);
    const s = {
      t, lat: c.lat, lon: c.lon, alt: c.alt, roll: c.roll, ox: c.ox + sh.x, oy: c.oy + sh.y, tilt: 0, look: 0,
      assemble: clamp((t - D.assemble[0]) / (D.assemble[1] - D.assemble[0]), 0, 1), tex: 0, dots: 1, patch: null, pings: {}, arcs: [], flat: 0, atmo: 1, pingScale: 1,
    };
    s.core = s.assemble > 0.45 ? 1 : 0;
    D.hot.forEach((h) => {
      const on = sstep(D.openPing[h.id], D.openPing[h.id] + 0.35, t);
      s.pings[h.id] = on * 0.5;
    });
    D.stops.forEach((tk, i) => {
      if (t < tk.F - 0.2 || t > tk.Q + 0.05) return;
      s.pings[tk.id] = Math.max(s.pings[tk.id], 0.5 + 0.5 * sstep(tk.F - 0.2, tk.F + 0.6, t));
      const din = sstep(tk.F + 1.25, tk.F + 1.85, t), dout = sstep(tk.P + 0.15, tk.P + 0.7, t);
      s.tex = Math.max(s.tex, din * (1 - dout));
      s.dots = Math.min(s.dots, 1 - sstep(tk.F + 1.35, tk.F + 1.95, t) * (1 - sstep(tk.P + 0.35, tk.P + 0.85, t)));
      const pa = sstep(tk.F + 1.55, tk.F + 2.1, t) * (1 - sstep(tk.P, tk.P + 0.45, t));
      if (pa > 0.001) s.patch = { id: tk.id, amt: pa };
      if (i > 0) {
        const u = t - tk.F;
        const head = E["power2.inOut"](clamp((u + 0.15) / 1.05, 0, 1));
        const tail = E["power2.in"](clamp((u - 0.7) / 0.9, 0, 1));
        s.arcs.push({ i: i - 1, head, tail, amt: 1 - sstep(1.4, 1.7, u) });
      }
    });
    // the finale: pull back, unwrap the planet into a flat map, every ping lit
    const B = D.board;
    if (t >= B.rise) {
      s.tex = Math.max(s.tex, sstep(B.rise, B.rise + 0.6, t));
      s.dots = Math.min(s.dots, 1 - sstep(B.rise, B.rise + 0.7, t));
      s.flat = E["power3.inOut"](clamp((t - B.flat0) / (B.flat1 - B.flat0), 0, 1));
      D.hot.forEach((h) => (s.pings[h.id] = Math.max(s.pings[h.id], sstep(B.rise, B.rise + 0.5, t))));
      (B.pingHits || []).forEach((p) => {
        const dt = t - p.t;
        if (dt > -0.05 && dt < 0.9) s.pings[p.id] = 1;
      });
      s.pingScale = 1 + 0.25 * sstep(B.flat0, B.flat1, t);
    }
    s.atmo = sstep(0.45, 1.1, s.alt);
    return s;
  }

  // ---- the globe camera's projection, reproduced (three.js PerspectiveCamera, lookAt(origin), rotateZ(roll))
  function basis(st) {
    const P = ll(st.lat - (st.tilt || 0), st.lon, 1 + st.alt);
    const n = Math.hypot(P[0], P[1], P[2]);
    const z = [P[0] / n, P[1] / n, P[2] / n];
    // x = normalize(up x z), up = (0,1,0)
    let x = [z[2], 0, -z[0]];
    const xn = Math.hypot(x[0], x[1], x[2]) || 1;
    x = [x[0] / xn, x[1] / xn, x[2] / xn];
    const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    const r = (st.roll || 0) * D2R, c = Math.cos(r), s = Math.sin(r);
    const xr = [x[0] * c + y[0] * s, x[1] * c + y[1] * s, x[2] * c + y[2] * s];
    const yr = [-x[0] * s + y[0] * c, -x[1] * s + y[1] * c, -x[2] * s + y[2] * c];
    return { P, x: xr, y: yr, z };
  }
  function projectWith(b, st, X) {
    const d = [X[0] - b.P[0], X[1] - b.P[1], X[2] - b.P[2]];
    const zc = -(d[0] * b.z[0] + d[1] * b.z[1] + d[2] * b.z[2]);
    const xc = d[0] * b.x[0] + d[1] * b.x[1] + d[2] * b.x[2];
    const yc = d[0] * b.y[0] + d[1] * b.y[1] + d[2] * b.y[2];
    return { x: W / 2 + (st.ox || 0) + (PXS * xc) / zc, y: H / 2 + (st.oy || 0) - (PXS * yc) / zc, z: zc };
  }
  function project(st, lat, lon, r) {
    return projectWith(basis(st), st, ll(lat, lon, r || 1));
  }

  // A document pinned to the ground: its centre projects exactly; its scale and angle come from a 40-desk-px step
  // east (desk px = ground px at the reference altitude).
  function place(st, doc, b) {
    b = b || basis(st);
    const C = projectWith(b, st, ll(doc.lat, doc.lon, 1.0005));
    const dl = 40 / (D.ppd * Math.cos(doc.lat * D2R));
    const Ep = projectWith(b, st, ll(doc.lat, doc.lon + dl, 1.0005));
    const dx = Ep.x - C.x, dy = Ep.y - C.y;
    return { x: C.x, y: C.y, a: (Math.atan2(dy, dx) * 180) / Math.PI, k: Math.hypot(dx, dy) / 40, z: C.z };
  }

  window.FILM = { data: D, stateAt, cameraAt, project, place, basis, E, clamp, sstep, PXS };
})();

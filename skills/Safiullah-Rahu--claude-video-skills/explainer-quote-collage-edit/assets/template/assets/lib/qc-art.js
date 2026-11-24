/* qc-art.js — engraving-style figures and card textures for the quote-collage edit, all drawn in code (seeded).
   The engraving engine rasterises simple 3-D primitives (spheres, tapered limbs, ellipsoids, flat polygons) into a
   tone map + a "line phase" per pixel, then inks parallel lines whose WIDTH follows the tone (like a burin line
   engraving), with cross-hatching in the darks and contour lines where parts overlap.
     QCART.engrave(W, H, prims, opt) -> canvas      opt: {bg: fn(x,y)->{tone, ph}, paper: [r,g,b], ink: [r,g,b], spacing}
     QCART.pusher(W, H, opt) / QCART.titan(W, H)    the two figures (prim lists + a few hand-placed details)
     QCART.sketch(prims) -> strokes                 white-line scribble version (list of polylines, in draw order)
     QCART.concrete(W, H), QCART.paper(W, H)        card textures                                                  */
(function () {
  const QCART = {};
  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  const rngOf = (s) => window.KW.rng(s);
  // value noise + fbm (deterministic)
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vn = (x, y) => { const i = Math.floor(x), j = Math.floor(y), f = x - i, g = y - j, u = f * f * (3 - 2 * f), v = g * g * (3 - 2 * g);
    return (hash(i, j) * (1 - u) + hash(i + 1, j) * u) * (1 - v) + (hash(i, j + 1) * (1 - u) + hash(i + 1, j + 1) * u) * v; };
  const fbm = (x, y, o = 4) => { let a = 0.5, s = 0; for (let k = 0; k < o; k++) { s += a * vn(x, y); x = x * 2.03 + 1.7; y = y * 2.03 + 9.2; a *= 0.5; } return s; };
  QCART.fbm = fbm;
  const L = (() => { const v = [-0.55, -0.7, 0.55], n = Math.hypot(...v); return v.map((a) => a / n); })();

  // ---------------------------------------------------------------- engraving engine
  QCART.engrave = (W, H, prims, opt) => {
    opt = Object.assign({ spacing: 7, paper: [244, 241, 234], ink: [22, 20, 18], contour: true }, opt || {});
    const N = W * H;
    const zb = new Float32Array(N).fill(-1e9), tone = new Float32Array(N).fill(1), ph1 = new Float32Array(N), ph2 = new Float32Array(N), id = new Int16Array(N).fill(-1);
    // contour key per primitive: its group, unless it asks for its own edge (an arm over the torso)
    const gk = prims.map((p, k) => (p.edge ? 1000 + k : (p.g === undefined ? k : p.g)));
    if (opt.bg) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const b = opt.bg(x, y); const i = y * W + x; tone[i] = b.tone; ph1[i] = b.ph; ph2[i] = b.ph2 === undefined ? b.ph * 0.7 + x * 0.06 : b.ph2; id[i] = b.id === undefined ? -1 : b.id; }
    }
    const sp = opt.spacing;
    const put = (i, z, t, a, b, pid) => { if (z > zb[i]) { zb[i] = z; tone[i] = t; ph1[i] = a; ph2[i] = b; id[i] = pid; } };
    const shade = (nx, ny, nz, amb = 0.12, k = 1.0) => Math.max(0, Math.min(1, amb + k * Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]) * 1.05 - 0.12 * (1 - nz)));
    prims.forEach((p, pid) => {
      const tv = p.tone || 0, rough = p.rough || 0, s2 = p.sp || sp;
      if (p.type === "sphere") {
        const x0 = Math.max(0, Math.floor(p.cx - p.r)), x1 = Math.min(W - 1, Math.ceil(p.cx + p.r)), y0 = Math.max(0, Math.floor(p.cy - p.r)), y1 = Math.min(H - 1, Math.ceil(p.cy + p.r));
        const tb = (p.tilt === undefined ? 0.5 : p.tilt), cb = Math.cos(tb), sb = Math.sin(tb);
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const nx = (x - p.cx) / p.r, ny = (y - p.cy) / p.r, rr = nx * nx + ny * ny;
          if (rr >= 1) continue;
          const nz = Math.sqrt(1 - rr);
          let t = shade(nx, ny, nz) + tv;
          if (rough) t += rough * (fbm(x * 0.03, y * 0.03) - 0.5) + rough * 0.6 * (fbm(x * 0.11, y * 0.11) - 0.5);
          const ny2 = ny * cb - nz * sb, nz2 = ny * sb + nz * cb;
          const lat = Math.asin(Math.max(-1, Math.min(1, ny2))), lon = Math.atan2(nx, nz2);
          put(y * W + x, (p.z || 0) + nz * p.r * 0.001, t, lat * p.r / s2, lon * p.r / (s2 * 1.1), pid);
        }
      } else if (p.type === "limb") {
        const ax = p.a[0], ay = p.a[1], bx = p.b[0], by = p.b[1], dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
        const R = Math.max(p.ra, p.rb);
        const x0 = Math.max(0, Math.floor(Math.min(ax, bx) - R)), x1 = Math.min(W - 1, Math.ceil(Math.max(ax, bx) + R)), y0 = Math.max(0, Math.floor(Math.min(ay, by) - R)), y1 = Math.min(H - 1, Math.ceil(Math.max(ay, by) + R));
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const px = x - ax, py = y - ay;
          let u = (px * ux + py * uy) / len;
          const uc = Math.max(0, Math.min(1, u));
          // muscle swell in the middle of the limb
          const r = (p.ra + (p.rb - p.ra) * uc) * (1 + (p.swell || 0) * Math.sin(Math.PI * uc));
          const cx = ax + dx * uc, cy = ay + dy * uc, ex = x - cx, ey = y - cy, d = Math.hypot(ex, ey);
          if (d >= r) continue;
          let nx, ny, nz;
          const sgn = ex * -uy + ey * ux;     // signed perpendicular distance
          if (u < 0 || u > 1) { nx = ex / r; ny = ey / r; nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)); }
          else { const s = sgn / r; nx = -uy * s; ny = ux * s; nz = Math.sqrt(Math.max(0, 1 - s * s)); }
          const s = Math.max(-1, Math.min(1, sgn / r));
          let t = shade(nx, ny, nz) + tv;
          if (rough) t += rough * (fbm(x * 0.05, y * 0.05) - 0.5);
          const ring = (u * len + s * s * r * 0.45) / (p.sp || sp);
          const along = Math.asin(s) * r / ((p.sp || sp) * 1.05);
          put(y * W + x, (p.z || 0) + nz * r * 0.001, t, p.along ? along : ring, p.along ? ring : along, pid);
        }
      } else if (p.type === "blob") {
        const c = Math.cos(p.rot || 0), sn = Math.sin(p.rot || 0), R = Math.max(p.rx, p.ry);
        const x0 = Math.max(0, Math.floor(p.cx - R)), x1 = Math.min(W - 1, Math.ceil(p.cx + R)), y0 = Math.max(0, Math.floor(p.cy - R)), y1 = Math.min(H - 1, Math.ceil(p.cy + R));
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const qx = (x - p.cx) * c + (y - p.cy) * sn, qy = -(x - p.cx) * sn + (y - p.cy) * c;
          const ex = qx / p.rx, ey = qy / p.ry, rr = ex * ex + ey * ey;
          if (rr >= 1) continue;
          const nz = Math.sqrt(1 - rr), nx = (ex * c - ey * sn), ny = (ex * sn + ey * c);
          let t = shade(nx * 0.95, ny * 0.95, nz) + tv;
          if (rough) t += rough * (fbm(x * 0.05, y * 0.05) - 0.5);
          put(y * W + x, (p.z || 0) + nz * R * 0.001, t, (qy + ex * ex * p.rx * 0.35) / (p.sp || sp), Math.asin(Math.max(-1, Math.min(1, ex))) * p.rx / ((p.sp || sp) * 1.05), pid);
        }
      } else if (p.type === "poly") {
        const m = mk(W, H), mx = m.getContext("2d", { willReadFrequently: true });
        mx.fillStyle = "#fff"; mx.beginPath(); p.pts.forEach(([x, y], k) => (k ? mx.lineTo(x, y) : mx.moveTo(x, y))); mx.closePath(); mx.fill();
        const d = mx.getImageData(0, 0, W, H).data;
        const a = (p.ang || 0.6), ca = Math.cos(a), sa = Math.sin(a);
        for (let i = 0; i < N; i++) {
          if (d[i * 4 + 3] < 128) continue;
          const x = i % W, y = (i - x) / W;
          let t = (p.toneFn ? p.toneFn(x, y) : 0.6) + tv;
          if (rough) t += rough * (fbm(x * 0.02, y * 0.02) - 0.5) + rough * 0.5 * (fbm(x * 0.09, y * 0.09) - 0.5);
          const w = (p.wave || 0) * Math.sin(x * 0.02 + y * 0.013);
          put(i, p.z || 0, t, (x * ca + y * sa) / (p.sp || sp) + w, (x * -sa + y * ca) / ((p.sp || sp) * 1.1), pid);
        }
      }
    });
    // ink
    const c = mk(W, H), x = c.getContext("2d"), img = x.createImageData(W, H), o = img.data;
    const [pr, pg, pb] = opt.paper, [ir, ig, ib] = opt.ink;
    const fr = (v) => { const f = v - Math.floor(v); return Math.min(f, 1 - f); };   // distance to nearest line centre, 0..0.5
    for (let i = 0; i < N; i++) {
      const T = Math.max(0, Math.min(1, tone[i]));
      const w1 = 0.5 * Math.pow(1 - T, 0.85) * 0.98;
      const d1 = fr(ph1[i]);
      let ink = 1 - Math.max(0, Math.min(1, (d1 - w1) / 0.09 + 0.5));
      if (T < 0.5) { const w2 = 0.5 * Math.pow((0.5 - T) / 0.5, 0.9) * 0.85; const d2 = fr(ph2[i]); ink = Math.max(ink, 1 - Math.max(0, Math.min(1, (d2 - w2) / 0.09 + 0.5))); }
      if (T < 0.16) { const d3 = fr(ph1[i] * 0.5 + ph2[i] * 0.5); ink = Math.max(ink, 1 - Math.max(0, Math.min(1, (d3 - 0.3) / 0.09 + 0.5))); }
      if (T > 0.93) ink *= Math.max(0, (1 - T) / 0.07);
      // contours where one primitive meets another (or the background)
      if (opt.contour) {
        const xx = i % W;
        if (xx < W - 2 && i + 2 * W < N && id[i] >= 0) {
          const a = id[i], b = id[i + 1], d = id[i + W];
          const ka = gk[a], kb = b >= 0 ? gk[b] : -1, kd = d >= 0 ? gk[d] : -1;
          if ((ka !== kb && zb[i] >= zb[i + 1]) || (ka !== kd && zb[i] >= zb[i + W])) ink = Math.max(ink, 0.92);
        } else if (id[i] < 0 && xx < W - 1 && i + W < N && (id[i + 1] >= 0 || id[i + W] >= 0)) ink = Math.max(ink, 0.92);
      }
      const k = ink * 0.94;
      o[i * 4] = pr + (ir - pr) * k; o[i * 4 + 1] = pg + (ig - pg) * k; o[i * 4 + 2] = pb + (ib - pb) * k; o[i * 4 + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return c;
  };

  // ---------------------------------------------------------------- the boulder pusher (side view, uphill to the right)
  // returns the primitive list in a 1080 x 1300 frame (scale/offset with s, ox, oy)
  QCART.pusherPrims = (s = 1, ox = 0, oy = 0) => {
    const P = (x, y) => [ox + x * s, oy + y * s];
    const R = (r) => r * s;
    const slopeY = (x) => 1060 - 0.30 * (x - 60);
    const F = { g: 7, tone: -0.26, rough: 0.12, sp: 5.2 * s };                                   // every body part shares one contour group
    const f = (o) => Object.assign({}, F, o);
    return [
      { type: "poly", g: 1, pts: [P(-40, slopeY(-40) + 10), P(1120, slopeY(1120) + 10), P(1120, 1400), P(-40, 1400)], z: -5,
        toneFn: (x, y) => 0.62 - 0.35 * Math.min(1, Math.max(0, ((y - oy) / s - slopeY((x - ox) / s)) / 260)), rough: 0.35, ang: -0.29, sp: 6.5 * s },
      { type: "sphere", g: 2, cx: ox + 760 * s, cy: oy + 600 * s, r: R(275), z: 1, rough: 0.28, tilt: 0.35, sp: 6.5 * s },
      // back leg, extended and driving
      f({ type: "limb", a: P(300, 745), b: P(215, 885), ra: R(54), rb: R(38), swell: 0.18, z: 2 }),
      f({ type: "limb", a: P(215, 885), b: P(118, 1032), ra: R(38), rb: R(21), swell: 0.3, z: 2.1 }),
      f({ type: "blob", cx: ox + 100 * s, cy: oy + 1046 * s, rx: R(46), ry: R(17), rot: -0.25, z: 2.2 }),
      // glutes / hips
      f({ type: "blob", cx: ox + 300 * s, cy: oy + 738 * s, rx: R(72), ry: R(60), rot: -0.6, z: 2.6 }),
      // torso: a long, deep wedge leaning into the stone, ribcage + back
      f({ type: "limb", a: P(300, 725), b: P(450, 575), ra: R(62), rb: R(78), swell: 0.06, z: 3.4, along: true }),
      f({ type: "blob", cx: ox + 418 * s, cy: oy + 590 * s, rx: R(100), ry: R(74), rot: -0.75, z: 3.5 }),
      // front leg, bent (edge: it crosses the torso line)
      f({ type: "limb", a: P(338, 770), b: P(432, 880), ra: R(56), rb: R(38), swell: 0.18, z: 4, edge: true }),
      f({ type: "limb", a: P(432, 880), b: P(392, 985), ra: R(38), rb: R(21), swell: 0.3, z: 4.1, edge: true }),
      f({ type: "blob", cx: ox + 404 * s, cy: oy + 996 * s, rx: R(44), ry: R(16), rot: -0.25, z: 4.2, edge: true }),
      // head, tucked between the arms, with a dark mass of hair
      f({ type: "blob", cx: ox + 488 * s, cy: oy + 520 * s, rx: R(50), ry: R(56), rot: -0.5, z: 3.6 }),
      f({ type: "blob", cx: ox + 470 * s, cy: oy + 500 * s, rx: R(46), ry: R(40), rot: -0.5, z: 3.65, tone: -0.42, sp: 4.5 * s, rough: 0.3 }),
      // far arm (lower), then the near arm with a deltoid
      f({ type: "limb", a: P(470, 610), b: P(530, 650), ra: R(32), rb: R(26), swell: 0.3, z: 3.0 }),
      f({ type: "limb", a: P(530, 650), b: P(505, 712), ra: R(25), rb: R(17), swell: 0.25, z: 3.0 }),
      f({ type: "blob", cx: ox + 502 * s, cy: oy + 724 * s, rx: R(20), ry: R(26), rot: 0.2, z: 3.05 }),
      f({ type: "blob", cx: ox + 452 * s, cy: oy + 548 * s, rx: R(46), ry: R(40), rot: -0.6, z: 3.85, edge: true }),
      f({ type: "limb", a: P(458, 548), b: P(530, 498), ra: R(34), rb: R(27), swell: 0.32, z: 3.9, edge: true }),
      f({ type: "limb", a: P(530, 498), b: P(505, 436), ra: R(26), rb: R(18), swell: 0.25, z: 3.9, edge: true }),
      f({ type: "blob", cx: ox + 500 * s, cy: oy + 424 * s, rx: R(21), ry: R(28), rot: 0.3, z: 3.95, edge: true }),
    ];
  };

  // ---------------------------------------------------------------- the Titan holding the sky (kneeling, sphere on the shoulders)
  QCART.titanPrims = (s = 1, ox = 0, oy = 0) => {
    const P = (x, y) => [ox + x * s, oy + y * s];
    const R = (r) => r * s;
    const F = (o) => Object.assign({ g: 7, tone: -0.24, rough: 0.12, sp: 5.2 * s }, o);
    return [
      { type: "poly", g: 1, pts: [P(60, 1262), P(1000, 1196), P(1100, 1500), P(0, 1500)], z: -5, toneFn: () => 0.55, rough: 0.4, ang: 0.1, sp: 6 * s },
      // the celestial sphere resting on the shoulders (meridians + a band drawn after)
      { type: "sphere", g: 2, cx: ox + 560 * s, cy: oy + 470 * s, r: R(262), z: 1, tilt: 0.9, sp: 7 * s, tone: 0.05 },
      // kneeling: near thigh forward, shin down; far knee on the ground, foot back
      F({ type: "limb", a: P(470, 1030), b: P(420, 1222), ra: R(60), rb: R(40), swell: 0.18, z: 3 }),
      F({ type: "limb", a: P(420, 1222), b: P(250, 1240), ra: R(38), rb: R(22), swell: 0.25, z: 3.1 }),
      F({ type: "limb", a: P(530, 1020), b: P(668, 1066), ra: R(64), rb: R(44), swell: 0.16, z: 5, edge: true }),
      F({ type: "limb", a: P(668, 1066), b: P(650, 1238), ra: R(42), rb: R(23), swell: 0.3, z: 5.1, edge: true }),
      F({ type: "blob", cx: ox + 676 * s, cy: oy + 1248 * s, rx: R(50), ry: R(17), rot: 0, z: 5.2, edge: true }),
      // drape over the hips
      F({ type: "blob", cx: ox + 505 * s, cy: oy + 1010 * s, rx: R(104), ry: R(62), rot: 0.18, z: 4.5, tone: 0.06, sp: 5 * s }),
      // torso: a wedge from waist to a broad chest, lines along the body
      F({ type: "limb", a: P(515, 990), b: P(525, 805), ra: R(78), rb: R(112), swell: 0.04, z: 4, along: true }),
      F({ type: "blob", cx: ox + 470 * s, cy: oy + 830 * s, rx: R(62), ry: R(52), rot: -0.3, z: 4.05 }),
      F({ type: "blob", cx: ox + 580 * s, cy: oy + 830 * s, rx: R(62), ry: R(52), rot: 0.3, z: 4.05 }),
      // head bowed under the weight, dark hair and beard
      F({ type: "blob", cx: ox + 505 * s, cy: oy + 742 * s, rx: R(54), ry: R(62), rot: 0.35, z: 4.3 }),
      F({ type: "blob", cx: ox + 520 * s, cy: oy + 712 * s, rx: R(56), ry: R(40), rot: 0.35, z: 4.32, tone: -0.42, sp: 4.5 * s, rough: 0.3 }),
      F({ type: "blob", cx: ox + 492 * s, cy: oy + 784 * s, rx: R(36), ry: R(30), rot: 0.4, z: 4.34, tone: -0.3, sp: 4.5 * s, rough: 0.3 }),
      // arms raised along the sphere: near arm in front (edge), far arm behind
      F({ type: "blob", cx: ox + 428 * s, cy: oy + 790 * s, rx: R(48), ry: R(42), rot: -0.6, z: 4.55, edge: true }),
      F({ type: "limb", a: P(430, 790), b: P(345, 682), ra: R(40), rb: R(31), swell: 0.3, z: 4.6, edge: true }),
      F({ type: "limb", a: P(345, 682), b: P(318, 548), ra: R(30), rb: R(21), swell: 0.25, z: 4.6, edge: true }),
      F({ type: "blob", cx: ox + 318 * s, cy: oy + 530 * s, rx: R(23), ry: R(32), rot: -0.15, z: 4.65, edge: true }),
      F({ type: "blob", cx: ox + 622 * s, cy: oy + 790 * s, rx: R(48), ry: R(42), rot: 0.6, z: 3.55 }),
      F({ type: "limb", a: P(620, 790), b: P(722, 690), ra: R(38), rb: R(30), swell: 0.3, z: 3.6 }),
      F({ type: "limb", a: P(722, 690), b: P(800, 560), ra: R(29), rb: R(21), swell: 0.25, z: 3.6 }),
      F({ type: "blob", cx: ox + 806 * s, cy: oy + 544 * s, rx: R(23), ry: R(32), rot: 0.4, z: 3.65 }),
    ];
  };

  // star chart detail drawn over the sphere after engraving: a band, ticks and a few star dots
  QCART.globeDetail = (cv, cx, cy, r, seed = 3) => {
    const x = cv.getContext("2d"), rn = rngOf(seed);
    x.save(); x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.clip();
    x.strokeStyle = "rgba(20,18,16,0.85)"; x.lineWidth = 3;
    x.beginPath(); x.ellipse(cx, cy + r * 0.1, r * 1.0, r * 0.32, -0.35, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.ellipse(cx, cy + r * 0.1, r * 1.0, r * 0.25, -0.35, 0, Math.PI * 2); x.stroke();
    for (let k = 0; k < 48; k++) { const a = (k / 48) * Math.PI * 2, ex = Math.cos(a) * r, ey = Math.sin(a) * r * 0.285;
      const px = cx + ex * Math.cos(-0.35) - ey * Math.sin(-0.35), py = cy + r * 0.1 + ex * Math.sin(-0.35) + ey * Math.cos(-0.35);
      x.beginPath(); x.moveTo(px, py); x.lineTo(px, py + 8); x.stroke(); }
    x.fillStyle = "rgba(255,255,255,0.95)";
    for (let k = 0; k < 26; k++) { const a = rn() * 6.28, d = Math.sqrt(rn()) * r * 0.85; const px = cx + Math.cos(a) * d, py = cy + Math.sin(a) * d;
      x.beginPath(); x.arc(px, py, 3 + rn() * 4, 0, 6.28); x.fill(); x.strokeStyle = "rgba(20,18,16,0.9)"; x.lineWidth = 1.5; x.stroke(); }
    x.restore();
  };

  // ---------------------------------------------------------------- white-line sketch strokes from a primitive list
  QCART.sketch = (prims, seed = 7) => {
    const rn = rngOf(seed), strokes = [];
    const jit = (pts, amp, n = 2) => { for (let k = 0; k < n; k++) strokes.push(pts.map(([x, y], i) => [x + (rn() - 0.5) * amp + Math.sin(i * 0.7 + k) * amp * 0.3, y + (rn() - 0.5) * amp])); };
    prims.forEach((p) => {
      if (p.type === "limb") {
        const [ax, ay] = p.a, [bx, by] = p.b, dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
        for (const side of [-1, 1]) {
          const pts = [];
          for (let k = 0; k <= 12; k++) { const u = k / 12, r = (p.ra + (p.rb - p.ra) * u) * (1 + (p.swell || 0) * Math.sin(Math.PI * u)); pts.push([ax + dx * u - uy * r * side, ay + dy * u + ux * r * side]); }
          jit(pts, 4, 2);
        }
        // a few cross contours (muscle lines)
        for (let k = 1; k < 3; k++) { const u = k / 3, r = p.ra + (p.rb - p.ra) * u, cx = ax + dx * u, cy = ay + dy * u, pts = [];
          for (let q = 0; q <= 8; q++) { const s = -1 + (2 * q) / 8; pts.push([cx - uy * r * s + ux * r * 0.3 * (1 - s * s), cy + ux * r * s + uy * r * 0.3 * (1 - s * s)]); }
          jit(pts, 3, 1); }
      } else if (p.type === "blob") {
        const pts = [], c = Math.cos(p.rot || 0), s = Math.sin(p.rot || 0);
        for (let k = 0; k <= 28; k++) { const a = (k / 28) * Math.PI * 2.1; const ex = Math.cos(a) * p.rx, ey = Math.sin(a) * p.ry; pts.push([p.cx + ex * c - ey * s, p.cy + ex * s + ey * c]); }
        jit(pts, 4, 2);
      } else if (p.type === "sphere") {
        for (let k = 0; k < 3; k++) { const pts = []; for (let q = 0; q <= 60; q++) { const a = (q / 60) * Math.PI * 2.05 + k; const rr = p.r * (1 + (rn() - 0.5) * 0.04); pts.push([p.cx + Math.cos(a) * rr, p.cy + Math.sin(a) * rr]); } strokes.push(pts); }
        // scribble fill: loose loops inside the stone
        for (let k = 0; k < 24; k++) {
          const pts = [], a0 = rn() * 6.28, r0 = p.r * (0.3 + rn() * 0.65), cx = p.cx + (rn() - 0.5) * p.r * 0.4, cy = p.cy + (rn() - 0.5) * p.r * 0.4;
          for (let q = 0; q <= 40; q++) { const a = a0 + (q / 40) * Math.PI * (1.2 + rn() * 0.3); const rr = r0 * (0.85 + 0.15 * Math.sin(q * 0.5)); const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr * (0.75 + rn() * 0.2);
            if (Math.hypot(px - p.cx, py - p.cy) < p.r * 0.98) pts.push([px, py]); }
          if (pts.length > 4) strokes.push(pts);
        }
      } else if (p.type === "poly") {
        // ground: a few long hatch lines along the slope edge
        const [a, b] = [p.pts[0], p.pts[1]];
        for (let k = 0; k < 9; k++) { const o = k * 14 + rn() * 8, f0 = 0.0 + rn() * 0.3, f1 = 0.55 + rn() * 0.45;
          const pts = []; for (let q = 0; q <= 10; q++) { const u = f0 + (f1 - f0) * q / 10; pts.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + o]); }
          jit(pts, 3, 1); }
      }
    });
    return strokes;
  };
  QCART.drawStrokes = (x, strokes, prog, opt) => {
    opt = Object.assign({ color: "255,255,255", width: 2.2 }, opt || {});
    const total = strokes.reduce((a, s) => a + s.length - 1, 0);
    let left = prog * total;
    x.lineCap = "round"; x.lineJoin = "round";
    strokes.forEach((s, k) => {
      if (left <= 0) return;
      const n = Math.min(s.length - 1, left);
      x.strokeStyle = `rgba(${opt.color},${0.55 + 0.4 * ((k * 37) % 10) / 10})`;
      x.lineWidth = opt.width * (0.7 + 0.6 * ((k * 53) % 10) / 10);
      x.beginPath(); x.moveTo(s[0][0], s[0][1]);
      for (let i = 1; i <= Math.floor(n); i++) x.lineTo(s[i][0], s[i][1]);
      const f = n - Math.floor(n);
      if (f > 0 && Math.floor(n) + 1 < s.length) { const a = s[Math.floor(n)], b = s[Math.floor(n) + 1]; x.lineTo(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f); }
      x.stroke();
      left -= s.length - 1;
    });
  };

  // ---------------------------------------------------------------- textures
  QCART.concrete = (W, H) => {
    const c = mk(W, H), x = c.getContext("2d"), img = x.createImageData(W, H), d = img.data, rn = rngOf(17);
    for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
      const i = (y * W + xx) * 4;
      let v = 0.58 + 0.22 * (fbm(xx * 0.004, y * 0.004) - 0.5) + 0.16 * (fbm(xx * 0.03, y * 0.03, 3) - 0.5) + 0.08 * (vn(xx * 0.4, y * 0.4) - 0.5);
      const stain = Math.max(0, fbm(xx * 0.002 + 5, y * 0.006, 3) - 0.55) * 0.6;
      v -= stain;
      // warm light from the upper left, falling off
      const warm = Math.max(0, 1 - Math.hypot(xx - 120, y + 200) / 1500);
      d[i] = 255 * Math.min(1, v * (0.92 + 0.35 * warm)); d[i + 1] = 255 * Math.min(1, v * (0.9 + 0.2 * warm)); d[i + 2] = 255 * Math.min(1, v * (0.9 + 0.02 * warm)); d[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    // pits
    for (let k = 0; k < 900; k++) { x.fillStyle = `rgba(40,36,32,${0.15 + rn() * 0.35})`; x.beginPath(); x.arc(rn() * W, rn() * H, 0.6 + rn() * 2.2, 0, 6.28); x.fill(); }
    // a wall corner at the right: a lit return face + a dark seam
    const g = x.createLinearGradient(W - 170, 0, W, 0); g.addColorStop(0, "rgba(0,0,0,0.35)"); g.addColorStop(0.06, "rgba(255,255,255,0.18)"); g.addColorStop(1, "rgba(255,255,255,0.32)");
    x.fillStyle = g; x.fillRect(W - 170, 0, 170, H);
    const v2 = x.createLinearGradient(0, 0, 0, H); v2.addColorStop(0, "rgba(120,70,20,0.22)"); v2.addColorStop(0.35, "rgba(0,0,0,0)"); v2.addColorStop(1, "rgba(0,0,0,0.25)");
    x.fillStyle = v2; x.fillRect(0, 0, W, H);
    return c;
  };
  QCART.paper = (W, H, tint = [226, 222, 214], seed = 5) => {
    const c = mk(W, H), x = c.getContext("2d"), img = x.createImageData(W, H), d = img.data;
    for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
      const i = (y * W + xx) * 4;
      const n = 0.06 * (fbm(xx * 0.01 + seed, y * 0.01) - 0.5) + 0.05 * (vn(xx * 0.6, y * 0.6) - 0.5) + 0.03 * (vn(xx * 0.08, y * 1.5) - 0.5);
      d[i] = tint[0] * (1 + n); d[i + 1] = tint[1] * (1 + n); d[i + 2] = tint[2] * (1 + n); d[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return c;
  };

  window.QCART = QCART;
})();

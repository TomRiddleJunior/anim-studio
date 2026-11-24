/* rh3d-mannequin.js — posable two-tone mannequin with a drawn face decal (needs rh3d-core.js).
 *
 *   const hero = RH3D.mannequin(K, { name: "hero" });                       // ivory shell, graphite joints
 *   const twin = RH3D.mannequin(K, { name: "twin", skin: "black", face: "glow" }); // wet black, glowing dot eyes
 *   const extra = RH3D.mannequin(K, { name: "c1", skin: "grey", face: "blank" });   // faceless grey crowd figure
 *   hero.set({ pos: [x, 0, z], ry: 180, pose: "stand", pose2: "phone", mix: 0.6, walk: { phase, amt },
 *              look: [yaw, pitch], lookAt: [x, y, z], face: "worried", face2: "scared", faceMix: 0.3, blink: 0..1,
 *              breathe: t, add: { shR: [x, y, z] }, phone: true, rootY: 0 });
 *
 * Skeleton (character faces +Z, its left = +X; every limb hangs along −Y from its joint):
 *   root → hips → waist → chest → neck → head (+ face cap)
 *   chest → shL/shR → elL/elR → wrL/wrR → hand        hips → hipL/hipR → knL/knR → anL/anR → foot
 * Rotation signs (degrees): arm/leg forward = −x, knee bend = +x, elbow bend = −x, head down = +x, head to its
 * left = +y, left arm out = +z, right arm out = −z.
 *
 * Face decal: a spherical cap 0.4 % above the head with planar UVs (so the drawing keeps its proportions seen from the
 * front), textured by a 512² canvas redrawn only when the expression parameters change. Expressions are numeric and
 * blend (FACES below); eye/mouth kinds switch at faceMix 0.5. The "glow" face draws white dots used as an emissive map.
 */
(function () {
  const RH3D = window.RH3D;
  const D2R = Math.PI / 180;
  let faceCount = 0;

  // ------------------------------------------------------------------ expressions (canvas px on a 512 canvas)
  // brow: dy (− = up), tilt (+ = inner ends up), arch, th (thickness), len
  // eye: kind oval|ring|closed|dot, open (vertical scale), sx (width scale), lid (0..1 flat top lid), look [dx, dy], pupil (ring), hl (highlight)
  // mouth: kind line|curve|o|wobble|none, w (width), curve (+ smile), open (o height)
  const FACES = {
    neutral:    { brow: { dy: 0, tilt: 0, arch: 6, th: 13, len: 70 }, eye: { kind: "oval", open: 1, sx: 1, lid: 0, look: [0, 0], pupil: 0.3, hl: 1 }, mouth: { kind: "line", w: 34, curve: 0, open: 0 } },
    worried:    { brow: { dy: -8, tilt: 18, arch: 2, th: 13, len: 66 }, eye: { kind: "oval", open: 0.94, sx: 0.96, lid: 0, look: [0, 5], pupil: 0.3, hl: 1 }, mouth: { kind: "wobble", w: 32, curve: -3, open: 0 } },
    scared:     { brow: { dy: -20, tilt: 24, arch: 0, th: 13, len: 66 }, eye: { kind: "ring", open: 1.08, sx: 1.12, lid: 0, look: [0, 0], pupil: 0.3, hl: 1 }, mouth: { kind: "o", w: 18, curve: 0, open: 22 } },
    determined: { brow: { dy: 8, tilt: -18, arch: 0, th: 15, len: 72 }, eye: { kind: "oval", open: 0.82, sx: 1, lid: 0.32, look: [0, 0], pupil: 0.3, hl: 1 }, mouth: { kind: "line", w: 40, curve: -1.5, open: 0 } },
    hopeful:    { brow: { dy: -12, tilt: 9, arch: 9, th: 12, len: 68 }, eye: { kind: "oval", open: 1.07, sx: 1.04, lid: 0, look: [0, -5], pupil: 0.3, hl: 1.35 }, mouth: { kind: "curve", w: 40, curve: 9, open: 0 } },
    closed:     { brow: { dy: 3, tilt: 2, arch: 5, th: 12, len: 66 }, eye: { kind: "closed", open: 0, sx: 1, lid: 0, look: [0, 0], pupil: 0.3, hl: 0 }, mouth: { kind: "line", w: 30, curve: 1, open: 0 } },
    annoyed:    { brow: { dy: 10, tilt: -24, arch: -2, th: 15, len: 72 }, eye: { kind: "oval", open: 0.84, sx: 1, lid: 0.36, look: [0, 0], pupil: 0.3, hl: 1 }, mouth: { kind: "line", w: 28, curve: -1, open: 0 } },
    smile:      { brow: { dy: -6, tilt: 4, arch: 11, th: 12, len: 68 }, eye: { kind: "oval", open: 1, sx: 1, lid: 0, look: [0, 0], pupil: 0.3, hl: 1.1 }, mouth: { kind: "curve", w: 54, curve: 15, open: 0 } },
    shocked:    { brow: { dy: -30, tilt: 12, arch: 6, th: 13, len: 66 }, eye: { kind: "ring", open: 1.22, sx: 1.22, lid: 0, look: [0, 0], pupil: 0.22, hl: 1 }, mouth: { kind: "o", w: 24, curve: 0, open: 32 } },
    sad:        { brow: { dy: -4, tilt: 22, arch: -2, th: 12, len: 64 }, eye: { kind: "oval", open: 0.62, sx: 1, lid: 0.42, look: [0, 9], pupil: 0.3, hl: 0.7 }, mouth: { kind: "curve", w: 36, curve: -8, open: 0 } },
    glow:       { brow: { dy: 0, tilt: 0, arch: 0, th: 0, len: 0 }, eye: { kind: "dot", open: 1, sx: 1, lid: 0, look: [0, 0], pupil: 0.3, hl: 0 }, mouth: { kind: "none", w: 0, curve: 0, open: 0 } },
    blank:      { brow: { dy: 0, tilt: 0, arch: 0, th: 0, len: 0 }, eye: { kind: "none", open: 1, sx: 1, lid: 0, look: [0, 0], pupil: 0.3, hl: 0 }, mouth: { kind: "none", w: 0, curve: 0, open: 0 } },
  };

  // ------------------------------------------------------------------ poses (degrees per joint; missing = 0)
  const base = { shL: [0, 0, 7], shR: [0, 0, -7], elL: [-10, 0, 0], elR: [-10, 0, 0], knL: [3, 0, 0], knR: [3, 0, 0], hipL: [-2, 0, 0], hipR: [-2, 0, 0] };
  const P = (o) => Object.assign({}, base, o);
  const POSES = {
    stand: P({}),
    tall: P({ chest: [-4, 0, 0], neck: [-3, 0, 0], shL: [4, 0, 9], shR: [4, 0, -9] }),
    freeze: P({ chest: [3, 0, 0], neck: [6, 0, 0], shL: [4, 0, 3], shR: [4, 0, -3], elL: [-6, 0, 0], elR: [-6, 0, 0], wrL: [0, 0, -6], wrR: [0, 0, 6] }),
    phone: P({ neck: [12, 0, 0], head: [14, 0, 0], shR: [-16, 12, -4], elR: [-100, 0, 0], wrR: [-24, 0, 0] }),
    phoneUp: P({ neck: [0, 0, 0], head: [-4, 0, 0], shR: [-48, 30, -6], elR: [-92, 0, 0], wrR: [-30, 0, 0] }),
    phoneEar: P({ head: [4, 0, -6], shR: [-30, 40, -40], elR: [-140, 0, 0], wrR: [0, 60, 0] }),
    reach: P({ shR: [-74, 0, -14], elR: [-12, 0, 0], wrR: [-8, 0, 0], neck: [-2, 0, 0] }),
    point: P({ shR: [-86, 0, -4], elR: [-4, 0, 0], neck: [-4, 0, 0] }),
    shrug: P({ shL: [-22, 0, 34], shR: [-22, 0, -34], elL: [-82, 0, 0], elR: [-82, 0, 0], wrL: [0, -70, 0], wrR: [0, 70, 0], neck: [4, 0, 0] }),
    palmOut: P({ shR: [-34, 0, -40], elR: [-50, 0, 0], wrR: [0, 80, 0], neck: [2, 0, 0] }),
    holdCard: P({ neck: [14, 0, 0], head: [8, 0, 0], shL: [-34, -10, 10], shR: [-34, 10, -10], elL: [-86, 0, 0], elR: [-86, 0, 0], wrL: [0, -40, 0], wrR: [0, 40, 0] }),
    cower: P({ chest: [10, 0, 0], neck: [8, 0, 0], shL: [-46, 0, 16], shR: [-46, 0, -16], elL: [-128, 0, 0], elR: [-128, 0, 0], hipL: [-14, 0, 0], hipR: [-14, 0, 0], knL: [26, 0, 0], knR: [26, 0, 0], anL: [-12, 0, 0], anR: [-12, 0, 0], rootY: -0.06 }),
    lookBack: P({ waist: [0, 14, 0], chest: [0, 22, 0], neck: [0, 20, 0], head: [0, 30, 0] }),
    slump: P({ chest: [16, 0, 0], neck: [14, 0, 0], head: [8, 0, 0], shL: [-6, 0, 4], shR: [-6, 0, -4] }),
    // sitting on a low kerb (seat ~0.18 m): forearms on the knees
    sitLow: P({ rootY: -0.68, hips: [-8, 0, 0], chest: [16, 0, 0], neck: [6, 0, 0], hipL: [-112, -8, 8], hipR: [-112, 8, -8], knL: [128, 0, 0], knR: [128, 0, 0], anL: [-20, 0, 0], anR: [-20, 0, 0],
      shL: [-40, 0, 10], shR: [-40, 0, -10], elL: [-58, 0, 0], elR: [-58, 0, 0] }),
    // chair height (0.46 m seat)
    sitChair: P({ rootY: -0.47, hipL: [-90, -4, 4], hipR: [-90, 4, -4], knL: [90, 0, 0], knR: [90, 0, 0], shL: [-8, 0, 8], shR: [-8, 0, -8], elL: [-40, 0, 0], elR: [-40, 0, 0] }),
    type: P({ rootY: -0.47, chest: [10, 0, 0], neck: [6, 0, 0], hipL: [-90, -4, 4], hipR: [-90, 4, -4], knL: [90, 0, 0], knR: [90, 0, 0], shL: [-40, 0, 6], shR: [-40, 0, -6], elL: [-58, 0, 0], elR: [-58, 0, 0], wrL: [12, 0, 0], wrR: [12, 0, 0] }),
    // lying on the back (root pitched by the shot: rx −90), holding a phone above the face
    lie: P({ shL: [0, 0, 12], shR: [0, 0, -12], elL: [-6, 0, 0], elR: [-6, 0, 0], knL: [6, 0, 0], knR: [6, 0, 0] }),
    liePhone: P({ shL: [0, 0, 12], shR: [-70, 10, -10], elR: [-84, 0, 0], wrR: [-30, 80, 0], elL: [-6, 0, 0], knL: [6, 0, 0], knR: [6, 0, 0], neck: [10, 0, 0] }),
    handGlass: P({ shR: [-96, 0, -10], elR: [-34, 0, 0], wrR: [60, 0, 0], neck: [-2, 0, 0] }),
    armsCrossed: P({ shL: [-30, -30, 12], shR: [-30, 30, -12], elL: [-120, -10, 0], elR: [-120, 10, 0] }),
    headDown: P({ chest: [8, 0, 0], neck: [18, 0, 0], head: [16, 0, 0], shL: [-2, 0, 4], shR: [-2, 0, -4] }),
  };
  const JOINTS = ["hips", "waist", "chest", "neck", "head", "shL", "elL", "wrL", "shR", "elR", "wrR", "hipL", "knL", "anL", "hipR", "knR", "anR"];

  /** procedural walk/run cycle: phase in radians (one stride = 2π), returns joint deltas (deg) and root bob */
  function gait(phase, amt, run) {
    const s = Math.sin(phase), c = Math.cos(phase), A = amt == null ? 1 : amt, R = run ? 1.7 : 1;
    const kneeL = Math.max(0, Math.sin(phase + 1.2)) * 46 * R + 4, kneeR = Math.max(0, Math.sin(phase + Math.PI + 1.2)) * 46 * R + 4;
    return {
      d: {
        hipL: [-24 * R * s * A, 0, 0], hipR: [24 * R * s * A, 0, 0],
        knL: [kneeL * A, 0, 0], knR: [kneeR * A, 0, 0],
        anL: [(-8 * Math.sin(phase + 0.4) - kneeL * 0.18) * A, 0, 0], anR: [(8 * Math.sin(phase + 0.4) - kneeR * 0.18) * A, 0, 0],
        shL: [20 * R * s * A, 0, 0], shR: [-20 * R * s * A, 0, 0], elL: [(-14 - 8 * R) * A, 0, 0], elR: [(-14 - 8 * R) * A, 0, 0],
        hips: [0, 5 * s * A, 2.5 * c * A], chest: [run ? 8 * A : 0, -7 * s * A, -1.5 * c * A], head: [0, 3 * s * A, 0],
      },
      bob: (Math.abs(c) * 0.03 - 0.02) * A * R,
    };
  }

  function drawFace(g, S, f, glowMode) {
    g.clearRect(0, 0, S, S);
    const ink = glowMode ? "#ffffff" : "#0b0b0d";
    const cx = S / 2, ey = S / 2 - 4, ex = 94;
    const E = f.eye, B = f.brow, Mo = f.mouth;
    g.lineCap = "round"; g.lineJoin = "round";
    // eyes
    for (const side of [-1, 1]) {
      const x = cx + side * ex + E.look[0], y = ey + E.look[1];
      const rx = 30 * E.sx, ry = 43 * Math.max(0, E.open);
      if (E.kind === "none") continue;
      if (E.kind === "dot") {
        g.fillStyle = ink; g.beginPath(); g.arc(cx + side * 64, ey - 18, 12, 0, 7); g.fill();
        continue;
      }
      if (E.kind === "closed" || E.open < 0.14) {
        g.strokeStyle = ink; g.lineWidth = 9.5;
        g.beginPath(); g.moveTo(x - 28, y - 2); g.quadraticCurveTo(x, y + 15, x + 28, y - 2); g.stroke();
        continue;
      }
      g.save();
      if (E.lid > 0) { g.beginPath(); g.rect(x - 60, y - ry + E.lid * ry * 1.1 + (side * 0), 120, 200); g.clip(); }
      if (E.kind === "ring") {
        g.fillStyle = "#fbfaf6"; g.beginPath(); g.ellipse(x, y, rx * 1.05, ry * 0.95, 0, 0, 7); g.fill();
        g.strokeStyle = ink; g.lineWidth = 7.5; g.stroke();
        g.fillStyle = ink; g.beginPath(); g.arc(x + E.look[0] * 0.3, y + E.look[1] * 0.3, Math.max(5, rx * E.pupil), 0, 7); g.fill();
      } else {
        g.fillStyle = ink; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill();
        if (E.hl > 0) {
          g.fillStyle = "rgba(255,255,255,0.96)";
          g.beginPath(); g.ellipse(x + rx * 0.32, y - ry * 0.36, 6.5 * E.hl, 7.5 * E.hl, 0.4, 0, 7); g.fill();
          g.beginPath(); g.arc(x - rx * 0.3, y + ry * 0.34, 2.6 * E.hl, 0, 7); g.fill();
        }
      }
      if (E.lid > 0) { g.restore(); g.save(); g.strokeStyle = ink; g.lineWidth = 6; const ly = y - ry + E.lid * ry * 1.1; g.beginPath(); g.moveTo(x - rx * 1.1, ly + side * 0); g.lineTo(x + rx * 1.1, ly); g.stroke(); }
      g.restore();
    }
    // brows: tapered felt-tip strokes
    if (B.th > 0) {
      for (const side of [-1, 1]) {
        const BL = B.len * 1.12, BT = B.th * 1.28;
        const x0 = cx + side * (ex - BL * 0.5), x1 = cx + side * (ex + BL * 0.5); // inner -> outer
        const yb = ey - 86 + B.dy;
        const yi = yb - B.tilt * 0.5, yo = yb + B.tilt * 0.5;
        const mx = (x0 + x1) / 2, my = (yi + yo) / 2 - B.arch;
        g.strokeStyle = ink;
        for (let k = 0; k < 4; k++) {
          g.globalAlpha = k === 0 ? 1 : 0.55;
          g.lineWidth = k === 0 ? BT : BT * (0.38 + 0.08 * k);
          const j = (k - 1.5) * BT * 0.16;
          g.beginPath(); g.moveTo(x0, yi + j * 0.6); g.quadraticCurveTo(mx, my + j, x1 - side * 2, yo + j * 0.4 + 1.5); g.stroke();
        }
        g.globalAlpha = 1;
      }
    }
    // mouth
    const my = ey + 106;
    g.strokeStyle = ink; g.fillStyle = ink; g.lineWidth = 9;
    if (Mo.kind === "line" || Mo.kind === "curve") {
      g.beginPath(); g.moveTo(cx - Mo.w / 2, my - Mo.curve * 0.25); g.quadraticCurveTo(cx, my + Mo.curve, cx + Mo.w / 2, my - Mo.curve * 0.25); g.stroke();
    } else if (Mo.kind === "wobble") {
      g.beginPath();
      for (let i = 0; i <= 16; i++) { const u = i / 16, x = cx - Mo.w / 2 + Mo.w * u, y = my + Math.sin(u * Math.PI * 3) * 3.2 - Mo.curve * Math.sin(u * Math.PI); i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    } else if (Mo.kind === "o") {
      g.beginPath(); g.ellipse(cx, my + 4, Mo.w / 2, Math.max(4, Mo.open / 2), 0, 0, 7); g.fill();
    }
  }

  function mixFace(a, b, k) {
    if (!b || k <= 0) return a;
    if (k >= 1) return b;
    const out = {};
    for (const part of ["brow", "eye", "mouth"]) {
      const o = {}, A = a[part], Bp = b[part];
      for (const key in A) {
        const va = A[key], vb = Bp[key];
        if (typeof va === "number") o[key] = va + (vb - va) * k;
        else if (Array.isArray(va)) o[key] = va.map((x, i) => x + (vb[i] - x) * k);
        else o[key] = k < 0.5 ? va : vb;
      }
      out[part] = o;
    }
    return out;
  }

  function mannequin(K, o) {
    o = Object.assign({ name: "hero", skin: "ivory", face: "neutral", s: 1 }, o || {});
    const T = K.T;
    const black = o.skin === "black", grey = o.skin === "grey";   // grey: faceless crowd figures (face: "blank")
    const shellHex = o.shell || (black ? "#060708" : grey ? "#8e8d89" : "#e6e1d7");
    const jointHex = o.joint || (black ? "#141518" : grey ? "#55575a" : "#3b3e44");
    const shell = K.mat(shellHex, { phys: true, rough: black ? 0.16 : 0.4, clearcoat: black ? 1 : 0.32, ccRough: black ? 0.05 : 0.34, env: black ? 1 : 0.8, unique: true });
    const joint = K.mat(jointHex, { phys: true, rough: black ? 0.2 : 0.42, clearcoat: black ? 0.8 : 0.2, ccRough: 0.2, env: 1, unique: true });
    const root = K.G({ name: o.name }, o.parent);
    const B = {};
    const seg = (prof, n) => { const p = prof.slice().reverse(); return K.lathe(p, n || 28); };
    const add = (geo, m, pos, parent, sc) => { const mesh = K.M(geo, m, { x: pos[0], y: pos[1], z: pos[2] }, parent); if (sc) mesh.scale.set(sc[0], sc[1], sc[2]); return mesh; };

    B.hips = K.G({ y: 0.95 }, root);
    add(seg([[0, 0.075], [0.085, 0.07], [0.118, 0.03], [0.132, -0.02], [0.125, -0.07], [0.09, -0.105], [0.04, -0.12], [0, -0.122]]), shell, [0, 0, 0], B.hips, [1.16, 1, 0.8]);
    B.waist = K.G({ y: 0.085 }, B.hips);
    add(K.sph(0.074, 28, 18), joint, [0, 0, 0], B.waist, [1.1, 0.85, 0.85]);
    B.chest = K.G({ y: 0.045 }, B.waist);
    add(seg([[0, 0.405], [0.06, 0.398], [0.118, 0.37], [0.152, 0.31], [0.158, 0.22], [0.142, 0.12], [0.112, 0.05], [0.088, 0.0], [0, -0.004]]), shell, [0, 0, 0], B.chest, [1.13, 1, 0.74]);
    B.neck = K.G({ y: 0.405 }, B.chest);
    add(K.cyl(0.03, 0.036, 0.1, 18), joint, [0, 0.03, 0], B.neck);
    B.head = K.G({ y: 0.075 }, B.neck);
    const R = 0.142, HY = 1.06;
    B.headMesh = add(K.sph(R, 48, 34), shell, [0, 0.136, 0], B.head, [1, HY, 1]);
    // face cap: planar UVs over the front
    const capG = new T.SphereGeometry(R * 1.004, 40, 30, Math.PI / 2 - 1.2, 2.4, Math.PI / 2 - 1.1, 2.2);
    const pa = capG.attributes.position, ua = capG.attributes.uv, KX = 0.95;
    for (let i = 0; i < pa.count; i++) ua.setXY(i, 0.5 + pa.getX(i) / (2 * R * KX), 0.5 + pa.getY(i) / (2 * R * KX));
    ua.needsUpdate = true;
    const S = 512;
    const faceTex = K.canvasTex("face:" + o.name + ":" + (++faceCount), S, S, () => {}, { fresh: true, clamp: true });
    const glowMode = o.face === "glow";
    const capM = glowMode
      ? new T.MeshStandardMaterial({ color: "#000000", map: faceTex, emissive: "#ffffff", emissiveMap: faceTex, emissiveIntensity: o.eyeGlow || 7, transparent: true, depthWrite: false, roughness: 0.2, alphaTest: 0.02 })
      : new T.MeshStandardMaterial({ color: "#ffffff", map: faceTex, transparent: true, depthWrite: false, roughness: 0.42, metalness: 0, alphaTest: 0.02 });
    capM.polygonOffset = true; capM.polygonOffsetFactor = -2; capM.polygonOffsetUnits = -2;
    const cap = K.M(capG, capM, { y: 0.136, cast: false, receive: true, ro: 2 }, B.head);
    cap.scale.set(1, HY, 1);
    cap.layers.set(K.LAYER.NODEPTH);

    function arm(side) {
      const L = side > 0, k = L ? "L" : "R";
      const sh = B["sh" + k] = K.G({ x: side * 0.192, y: 0.325 }, B.chest);
      add(K.sph(0.052, 24, 16), joint, [0, 0, 0], sh);
      add(seg([[0, -0.01], [0.034, -0.025], [0.043, -0.06], [0.041, -0.16], [0.035, -0.25], [0.026, -0.275], [0, -0.282]]), shell, [0, 0, 0], sh);
      const el = B["el" + k] = K.G({ y: -0.29 }, sh);
      add(K.sph(0.033, 20, 14), joint, [0, 0, 0], el);
      add(seg([[0, -0.008], [0.03, -0.02], [0.035, -0.05], [0.031, -0.17], [0.025, -0.235], [0.018, -0.252], [0, -0.258]]), shell, [0, 0, 0], el);
      const wr = B["wr" + k] = K.G({ y: -0.262 }, el);
      add(K.sph(0.022, 16, 12), joint, [0, 0, 0], wr);
      const hand = B["hand" + k] = K.G({ y: -0.02 }, wr);
      add(K.sph(0.05, 24, 16), shell, [0, -0.055, 0.004], hand, [0.44, 1.12, 0.92]);           // palm + fingers (mitten)
      add(K.sph(0.024, 16, 12), shell, [-side * 0.0, -0.035, 0.035], hand, [0.75, 1.5, 0.8]);    // thumb, toward the front
    }
    arm(1); arm(-1);
    function leg(side) {
      const k = side > 0 ? "L" : "R";
      const hip = B["hip" + k] = K.G({ x: side * 0.094, y: -0.035 }, B.hips);
      add(K.sph(0.062, 24, 16), joint, [0, 0, 0], hip);
      add(seg([[0, -0.01], [0.055, -0.03], [0.066, -0.08], [0.058, -0.26], [0.046, -0.4], [0.038, -0.425], [0, -0.43]]), shell, [0, 0, 0], hip);
      const kn = B["kn" + k] = K.G({ y: -0.432 }, hip);
      add(K.sph(0.044, 20, 14), joint, [0, 0, 0], kn);
      add(seg([[0, -0.006], [0.04, -0.02], [0.046, -0.07], [0.04, -0.25], [0.031, -0.39], [0.026, -0.405], [0, -0.41]]), shell, [0, 0, 0], kn);
      const an = B["an" + k] = K.G({ y: -0.415 }, kn);
      add(K.sph(0.029, 16, 12), joint, [0, 0, 0], an);
      add(K.sph(0.06, 24, 14), shell, [0, -0.034, 0.045], an, [0.75, 0.52, 2.0]);
    }
    leg(1); leg(-1);
    root.traverse((m) => { if (m.isMesh && m !== cap) { m.castShadow = true; m.receiveShadow = true; } });
    if (o.s !== 1) root.scale.setScalar(o.s);

    // phone (held in the right hand; screen faces the hand's +z after the pose's wrist twist)
    const phone = K.G({ name: o.name + ":phone" }, B.handR);
    phone.position.set(0.0, -0.085, 0.058);
    phone.rotation.set(0, 0, Math.PI);   // top of the screen toward the fingertips: upright in a POV
    const phBody = K.M(K.rbox(0.072, 0.152, 0.009, 0.011, 0.002), K.mat("#0d0e10", { phys: true, rough: 0.25, clearcoat: 1, metal: 0.4 }), { rx: 0 }, phone);
    const phScreenM = K.glow("#ffffff", 1.0, {});
    const phScreen = K.M(new T.PlaneGeometry(0.064, 0.142), phScreenM, { z: 0.0052, cast: false, receive: false }, phone);
    const phLight = new T.PointLight("#cfe0ff", 0, 1.4, 2);
    phLight.position.set(0, 0.02, 0.3); phone.add(phLight);
    phone.visible = false;

    // drips (wet skin): small falling drops, deterministic in t
    const drips = [];
    if (o.wet) {
      const dm = K.mat("#050506", { phys: true, rough: 0.05, clearcoat: 1, ccRough: 0.02 });
      const g = K.sph(0.008, 10, 8);
      const anchors = [["handL", 0, -0.11, 0.01], ["handR", 0, -0.11, 0.01], ["head", 0.06, 0.0, 0.1]];
      anchors.forEach((a, i) => { const m = K.M(g, dm, { cast: false }, root); m.scale.set(1, 2.2, 1); drips.push({ m, a, ph: i * 0.37 }); });
    }

    let faceKey = "";
    const st = { lookYaw: 0, lookPitch: 0 };
    const tmp = new T.Vector3(), tmp2 = new T.Vector3(), q = new T.Quaternion(), e = new T.Euler();
    function setFace(f) {
      const key = JSON.stringify(f);
      if (key === faceKey) return;
      faceKey = key;
      drawFace(faceTex.userData.ctx, S, f, glowMode);
      faceTex.needsUpdate = true;
    }
    setFace(FACES[o.face] || FACES.neutral);

    /** pose the whole figure. See header for fields. */
    function set(p) {
      p = p || {};
      const pa = POSES[p.pose || "stand"] || POSES.stand, pb = p.pose2 ? POSES[p.pose2] : null, k = p.mix || 0;
      const G = p.walk ? gait(p.walk.phase || 0, p.walk.amt == null ? 1 : p.walk.amt, p.walk.run) : null;
      for (const j of JOINTS) {
        const a = pa[j] || [0, 0, 0], b = pb ? pb[j] || [0, 0, 0] : a;
        let x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k, z = a[2] + (b[2] - a[2]) * k;
        if (G && G.d[j]) { x += G.d[j][0]; y += G.d[j][1]; z += G.d[j][2]; }
        if (p.add && p.add[j]) { x += p.add[j][0]; y += p.add[j][1]; z += p.add[j][2]; }
        B[j].rotation.set(x * D2R, y * D2R, z * D2R, j.startsWith("sh") ? "ZXY" : "XYZ");
      }
      const ry0 = (pa.rootY || 0) + ((pb ? pb.rootY || 0 : pa.rootY || 0) - (pa.rootY || 0)) * k;
      const pos = p.pos || [0, 0, 0];
      root.position.set(pos[0], pos[1] + ry0 + (G ? G.bob : 0) + (p.rootY || 0), pos[2]);
      root.rotation.set((p.rx || 0) * D2R, (p.ry || 0) * D2R, (p.rz || 0) * D2R, "YXZ");
      // breathing
      if (p.breathe != null) {
        const b = Math.sin(p.breathe * Math.PI * 2 * (p.breathRate || 0.24));
        B.chest.rotation.x += -b * 0.9 * D2R * (p.breathAmt || 1);
        B.shL.position.y = 0.325 + b * 0.003 * (p.breathAmt || 1); B.shR.position.y = B.shL.position.y;
      }
      // head look: yaw/pitch offsets in degrees, or a world target
      let ly = 0, lp = 0;
      if (p.look) { ly = p.look[0]; lp = p.look[1]; }
      if (p.lookAt) {
        root.updateMatrixWorld(true);
        B.neck.getWorldPosition(tmp);
        tmp2.fromArray(p.lookAt).sub(tmp);
        B.neck.parent.getWorldQuaternion(q);
        tmp2.applyQuaternion(q.invert());
        const yaw = Math.atan2(tmp2.x, tmp2.z) / D2R, pitch = -Math.atan2(tmp2.y, Math.hypot(tmp2.x, tmp2.z)) / D2R;
        const w = p.lookAmt == null ? 1 : p.lookAmt;
        ly += Math.max(-75, Math.min(75, yaw)) * w; lp += Math.max(-40, Math.min(45, pitch)) * w;
      }
      B.neck.rotation.y += ly * 0.4 * D2R; B.head.rotation.y += ly * 0.6 * D2R;
      B.neck.rotation.x += lp * 0.4 * D2R; B.head.rotation.x += lp * 0.6 * D2R;
      if (p.tilt) B.head.rotation.z += p.tilt * D2R;
      // face
      if (!glowMode) {
        let f = mixFace(FACES[p.face || o.face || "neutral"] || FACES.neutral, p.face2 ? FACES[p.face2] : null, p.faceMix || 0);
        if (p.blink) { f = JSON.parse(JSON.stringify(f)); f.eye.open = f.eye.open * (1 - p.blink); if (p.blink > 0.86) f.eye.kind = "closed"; }
        if (p.faceAdd) { f = JSON.parse(JSON.stringify(f)); for (const part in p.faceAdd) Object.assign(f[part], p.faceAdd[part]); }
        setFace(f);
      } else if (p.eyeGlow != null) capM.emissiveIntensity = p.eyeGlow;
      // phone
      phone.visible = !!p.phone;
      if (p.phoneLight != null) phLight.intensity = p.phoneLight;
      // drips
      if (drips.length && p.t != null) {
        root.updateMatrixWorld(true);
        drips.forEach((d) => {
          const cyc = 1.6 + d.ph, u = ((p.t + d.ph * 3.1) % cyc) / cyc;
          B[d.a[0]].localToWorld(tmp.set(d.a[1], d.a[2], d.a[3]));
          root.worldToLocal(tmp);
          const fall = u < 0.55 ? 0 : (u - 0.55) / 0.45;
          d.m.position.set(tmp.x, tmp.y - 4.9 * Math.pow(fall * 0.55, 2), tmp.z);
          d.m.scale.set(1, 1.6 + fall * 2.4, 1);
          d.m.visible = tmp.y - 4.9 * Math.pow(fall * 0.55, 2) > 0.01;
        });
      }
    }
    set({});
    /** world position of a named bone (or [x,y,z] offset in that bone's space) */
    function at(bone, off) { root.updateMatrixWorld(true); const v = new T.Vector3().fromArray(off || [0, 0, 0]); B[bone].localToWorld(v); return [v.x, v.y, v.z]; }
    function eyes() { return at("head", [0, 0.136, 0.125]); }
    return { root, B, set, at, eyes, faceTex, cap, capM, phone, phScreen, phScreenM, phLight, shell, joint, setFace, drawFace: (f) => setFace(f) };
  }

  RH3D.mannequin = mannequin;
  RH3D.FACES = FACES;
  RH3D.POSES = POSES;
  RH3D.gait = gait;
  RH3D.drawFace = drawFace;
})();

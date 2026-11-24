/* scene.js — the 3D stage: one modern phone floating over a glossy floor in a dark studio with soft bokeh lights.
 * CHATFILM.create(glCanvas, uiCanvas) -> { render(t) }: everything is a pure function of time (frames render out of order).
 * Units are centimetres. No logos or brand marks: a generic phone with a titanium band and a camera island. */
(function () {
  const T = THREE, TM = window.CHAT_TIMING, HANDOVERS = TM.handovers || (TM.handover ? [TM.handover] : []);
  const BW = 7.06, BH = 14.66, BD = 0.83, BR = 1.19;          // body
  const SW = 6.5, SH = SW * 852 / 393, SR = 0.91;              // display (19.5 : 9)
  const FLOOR = -8.25;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const eio = (u) => { u = clamp(u, 0, 1); return u * u * u * (u * (6 * u - 15) + 10); };
  function hash(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  function rrShape(w, h, r) {
    const s = new T.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
    s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
    s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, 1.5 * Math.PI, false);
    return s;
  }
  function canvasTex(w, h, fn, srgb) {
    const c = document.createElement("canvas"); c.width = w; c.height = h; fn(c.getContext("2d"), w, h);
    const tx = new T.CanvasTexture(c); if (srgb !== false) tx.colorSpace = T.SRGBColorSpace; return tx;
  }

  function create(glCanvas, uiCanvas) {
    const renderer = new T.WebGLRenderer({ canvas: glCanvas, antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(2); renderer.setSize(1080, 1920, false);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.autoClear = false;
    const scene = new T.Scene(); scene.background = new T.Color(0x05060d);
    const camera = new T.PerspectiveCamera(26, 1080 / 1920, 1, 600);

    // ---- reflections: a small light box, prefiltered
    const es = new T.Scene(); es.background = new T.Color(0x04050a);
    const panel = (w, h, col, k, pos) => { const c = new T.Color(col).multiplyScalar(k); const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide, toneMapped: false })); m.position.set(pos[0], pos[1], pos[2]); m.lookAt(0, 0, 0); es.add(m); };
    panel(34, 12, 0xffffff, 7, [0, 34, 6]);
    panel(7, 44, 0x8fbcff, 6, [-36, 2, 10]);
    panel(7, 44, 0xff8fd8, 5, [36, 0, 8]);
    panel(46, 6, 0xffd9a8, 2.2, [0, -30, 16]);
    panel(10, 10, 0xffffff, 5, [-20, 26, 30]);
    panel(60, 60, 0x2a2f55, 1, [0, 0, -50]);
    const pm = new T.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(es, 0.035).texture;

    // ---- backdrop: a horizon glow, mirrored below it so the floor reads as glossy
    const HZ = 0.435;                                           // the horizon's height in the texture (0 bottom .. 1 top)
    const bgTex = canvasTex(512, 1024, (g, w, h) => {
      const hy = h * (1 - HZ);
      const up = g.createLinearGradient(0, 0, 0, hy);
      up.addColorStop(0, "#020309"); up.addColorStop(0.5, "#060818"); up.addColorStop(0.82, "#0d0f30"); up.addColorStop(1, "#1a1a52");
      g.fillStyle = up; g.fillRect(0, 0, w, hy);
      const dn = g.createLinearGradient(0, hy, 0, h);
      dn.addColorStop(0, "#1a1a52"); dn.addColorStop(0.12, "#0e0f33"); dn.addColorStop(0.4, "#060718"); dn.addColorStop(1, "#020308");
      g.fillStyle = dn; g.fillRect(0, hy, w, h - hy);
      const blob = (x, y, rx, ry, col) => { g.save(); g.translate(x, y); g.scale(1, ry / rx); const rg = g.createRadialGradient(0, 0, 0, 0, 0, rx); rg.addColorStop(0, col); rg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = rg; g.fillRect(-rx, -rx, 2 * rx, 2 * rx); g.restore(); };
      g.globalCompositeOperation = "lighter";
      blob(w * 0.16, hy - 30, 300, 210, "rgba(40,110,255,0.42)"); blob(w * 0.86, hy - 50, 320, 230, "rgba(225,60,190,0.32)"); blob(w * 0.5, hy, 300, 130, "rgba(110,90,255,0.20)");
      blob(w * 0.16, hy + 40, 280, 120, "rgba(40,110,255,0.18)"); blob(w * 0.86, hy + 50, 300, 130, "rgba(225,60,190,0.13)");
      blob(w * 0.5, hy - 4, 420, 44, "rgba(255,200,160,0.07)");
    });
    const bg = new T.Mesh(new T.PlaneGeometry(260, 520), new T.MeshBasicMaterial({ map: bgTex, toneMapped: false, depthWrite: false }));
    bg.position.set(0, FLOOR + 520 * (0.5 - HZ), -120); bg.renderOrder = -10; scene.add(bg);

    // ---- bokeh lights (and their dimmer twins under the floor)
    const discTex = canvasTex(128, 128, (g) => {
      const rg = g.createRadialGradient(64, 64, 0, 64, 64, 62);
      rg.addColorStop(0, "rgba(255,255,255,0.55)"); rg.addColorStop(0.72, "rgba(255,255,255,0.62)"); rg.addColorStop(0.9, "rgba(255,255,255,0.95)"); rg.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
    });
    const softTex = canvasTex(128, 128, (g) => { const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64); rg.addColorStop(0, "rgba(255,255,255,1)"); rg.addColorStop(0.4, "rgba(255,255,255,0.35)"); rg.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = rg; g.fillRect(0, 0, 128, 128); });
    const PAL = [0x6aa8ff, 0xff7ad9, 0xffc27a, 0x8effe0, 0xb69cff, 0xffffff];
    const orbs = [];
    for (let i = 0; i < 54; i++) {
      const z = -14 - hash(i * 3 + 1) * 86, spread = 0.62 * (40 - z);
      const o = { x: (hash(i * 3 + 2) - 0.5) * spread, y0: hash(i * 3 + 3), z, size: 1.3 + hash(i * 7) * hash(i * 7 + 1) * 6.5, sp: 0.25 + hash(i * 5) * 0.55, ph: hash(i * 11) * 6.28, a: 0.10 + hash(i * 13) * 0.3 };
      const col = PAL[Math.floor(hash(i * 17) * PAL.length)];
      const mk = () => { const s = new T.Sprite(new T.SpriteMaterial({ map: discTex, color: col, transparent: true, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false })); s.scale.setScalar(o.size); scene.add(s); return s; };
      o.s = mk(); o.m = mk(); orbs.push(o);
    }
    // dust close to the phone
    const dust = [];
    for (let i = 0; i < 70; i++) {
      const d = { x: (hash(i * 19 + 5) - 0.5) * 26, y0: hash(i * 23 + 7), z: -10 + hash(i * 29 + 9) * 22, sp: 0.12 + hash(i * 31) * 0.3, ph: hash(i * 37) * 6.28, a: 0.12 + hash(i * 41) * 0.35 };
      d.s = new T.Sprite(new T.SpriteMaterial({ map: softTex, color: 0xcfe0ff, transparent: true, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
      d.s.scale.setScalar(0.07 + hash(i * 43) * 0.12); scene.add(d.s); dust.push(d);
    }

    // ---- the phone (built twice: the real one and its reflection)
    const uiTex = new T.CanvasTexture(uiCanvas); uiTex.colorSpace = T.SRGBColorSpace; uiTex.generateMipmaps = false; uiTex.minFilter = T.LinearFilter; uiTex.magFilter = T.LinearFilter;
    const b = 0.11;
    const frameG = new T.ExtrudeGeometry(rrShape(BW - 2 * b, BH - 2 * b, BR - b), { depth: BD - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 6, curveSegments: 40 });
    frameG.translate(0, 0, -(BD - 2 * b) / 2);
    const glassG = new T.ShapeGeometry(rrShape(BW - 0.15, BH - 0.15, BR - 0.075), 40);
    const dispG = new T.ShapeGeometry(rrShape(SW, SH, SR), 40);
    { const p = dispG.attributes.position, uv = dispG.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + SW / 2) / SW, (p.getY(i) + SH / 2) / SH); uv.needsUpdate = true; }
    const frameM = new T.MeshStandardMaterial({ color: 0xb8b3a9, metalness: 1, roughness: 0.27, envMapIntensity: 1.6 });
    const glassM = new T.MeshPhysicalMaterial({ color: 0x030304, metalness: 0, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.0 });
    const dispM = new T.MeshBasicMaterial({ map: uiTex, toneMapped: false });
    const glareM = new T.MeshPhysicalMaterial({ color: 0x000000, metalness: 0, roughness: 0.06, transparent: true, blending: T.AdditiveBlending, depthWrite: false, envMapIntensity: 0.55 });
    const btnG = (len) => new T.BoxGeometry(0.09, len, 0.26);
    function buildPhone() {
      const p = new T.Group();
      p.add(new T.Mesh(frameG, frameM));
      const gl = new T.Mesh(glassG, glassM); gl.position.z = BD / 2 + 0.002; p.add(gl);
      const d = new T.Mesh(dispG, dispM); d.position.z = BD / 2 + 0.004; p.add(d);
      const gr = new T.Mesh(glassG, glareM); gr.position.z = BD / 2 + 0.007; gr.renderOrder = 5; p.add(gr);
      [[BW / 2 + 0.01, 2.1, 1.7], [-BW / 2 - 0.01, 4.5, 0.62], [-BW / 2 - 0.01, 3.2, 1.05], [-BW / 2 - 0.01, 1.85, 1.05]].forEach(([x, y, len]) => { const m = new T.Mesh(btnG(len), frameM); m.position.set(x, y, 0); p.add(m); });
      return p;
    }
    const phone = buildPhone(); scene.add(phone);
    const mirrorRoot = new T.Group(); mirrorRoot.scale.y = -1; mirrorRoot.position.y = 2 * FLOOR; scene.add(mirrorRoot);
    const phone2 = buildPhone(); mirrorRoot.add(phone2);

    // halo behind the phone
    const halo = new T.Sprite(new T.SpriteMaterial({ map: softTex, color: 0x9fb8ff, transparent: true, opacity: 0.2, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
    halo.scale.set(30, 40, 1); halo.position.set(0, 0, -3); halo.renderOrder = -5; scene.add(halo);

    // ---- floor: a dark, slightly see-through sheet over the mirrored world, with a contact shadow and the screen's spill
    const floorTex = canvasTex(512, 512, (g) => {
      const rg = g.createRadialGradient(256, 256, 0, 256, 256, 256);
      rg.addColorStop(0, "rgba(6,7,16,0.80)"); rg.addColorStop(0.25, "rgba(6,7,16,0.72)"); rg.addColorStop(0.7, "rgba(6,7,16,0.35)"); rg.addColorStop(1, "rgba(6,7,16,0)");
      g.fillStyle = rg; g.fillRect(0, 0, 512, 512);
    });
    const floor = new T.Mesh(new T.PlaneGeometry(240, 240), new T.MeshBasicMaterial({ map: floorTex, transparent: true, depthWrite: false, toneMapped: false }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, FLOOR, -30); floor.renderOrder = 2; scene.add(floor);
    const shadow = new T.Mesh(new T.PlaneGeometry(13, 5.4), new T.MeshBasicMaterial({ map: canvasTex(256, 128, (g) => { const rg = g.createRadialGradient(128, 64, 0, 128, 64, 128); rg.addColorStop(0, "rgba(0,0,0,0.85)"); rg.addColorStop(0.5, "rgba(0,0,0,0.4)"); rg.addColorStop(1, "rgba(0,0,0,0)"); g.save(); g.scale(1, 0.5); g.translate(0, 64); g.fillStyle = rg; g.fillRect(0, -64, 256, 256); g.restore(); }), transparent: true, depthWrite: false, toneMapped: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.set(0, FLOOR + 0.01, 0); shadow.renderOrder = 3; scene.add(shadow);
    const spill = new T.Mesh(new T.PlaneGeometry(26, 20), new T.MeshBasicMaterial({ map: softTex, color: 0xdfe8ff, transparent: true, opacity: 0.16, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
    spill.rotation.x = -Math.PI / 2; spill.position.set(0, FLOOR + 0.02, 6.5); spill.renderOrder = 4; scene.add(spill);

    scene.add(new T.AmbientLight(0xffffff, 0.15));
    const key = new T.DirectionalLight(0xffffff, 1.4); key.position.set(-8, 14, 16); scene.add(key);

    // ---- overlay: vignette
    const oScene = new T.Scene(), oCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const vig = new T.Mesh(new T.PlaneGeometry(2, 2), new T.MeshBasicMaterial({ map: canvasTex(256, 256, (g) => { const rg = g.createRadialGradient(128, 128, 124, 128, 128, 190); rg.addColorStop(0, "rgba(0,0,0,0)"); rg.addColorStop(1, "rgba(0,0,0,0.34)"); g.fillStyle = rg; g.fillRect(0, 0, 256, 256); }), transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
    oScene.add(vig);

    // ---- camera keys: [time, look-at height, distance]; eased between consecutive keys
    const keys = [];
    const TYPE = [-2.25, 34.6], tn = TM.turns;
    keys.push([0, -1.2, 40.5]); keys.push([1.5, TYPE[0], TYPE[1]]);
    tn.forEach((u, i) => {
      const read = i === tn.length - 1 ? [0.45, 34.9] : i % 2 === 1 ? [0.5, 35.1] : [0.6, 35.3];     // the whole phone in frame while a reply plays
      keys.push([u.send - 0.05, TYPE[0], TYPE[1] - 0.7]);                  // slow creep in while typing
      keys.push([u.send + 1.0, read[0], read[1]]);
      const nextUp = i < tn.length - 1 ? tn[i + 1].kbUp : TM.dur + 1;
      if (i < tn.length - 1) { keys.push([nextUp - 0.15, read[0] - 0.15, read[1] - 0.8]); keys.push([nextUp + 0.95, TYPE[0], TYPE[1]]); }
      else { keys.push([u.done + 1.2, read[0] - 0.1, read[1] - 0.7]); keys.push([TM.dur, -0.2, 37.5]); }
    });
    function camAt(t) {
      let i = 0; while (i < keys.length - 2 && t >= keys[i + 1][0]) i++;
      const a = keys[i], c = keys[i + 1], u = eio((t - a[0]) / (c[0] - a[0]));
      return [lerp(a[1], c[1], u), lerp(a[2], c[2], u)];
    }
    // every key press nudges the phone a little; the handover swings it
    const taps = []; tn.forEach((u) => { u.keys.forEach((e) => taps.push([e.t, e.kind === "char" ? 1 : 1.4])); taps.push([u.send - 0.08, 2.4]); });
    function tapAt(t) { let s = 0; for (let i = 0; i < taps.length; i++) { const dt = t - taps[i][0]; if (dt < 0) break; if (dt < 0.22) s += taps[i][1] * Math.exp(-dt / 0.045) * Math.sin(Math.min(1, dt / 0.012) * Math.PI / 2); } return s; }

    function render(t) {
      window.CHATUI.draw(t); uiTex.needsUpdate = true;
      const tap = tapAt(t);
      let hx = 0, hy = 0, hr = 0, hz = 0;
      for (const ho of HANDOVERS) { const u = (t - ho.t0) / ho.dur; if (u > 0 && u < 1) { const e = Math.sin(Math.PI * u); hr = 0.34 * Math.sin(2 * Math.PI * u) * e; hz = -0.07 * e * Math.sin(2 * Math.PI * u); hx = 0.7 * Math.sin(2 * Math.PI * u) * e; hy = -0.45 * e; } }
      const set = (p) => {
        p.position.set(hx + 0.08 * Math.sin(0.27 * t + 2), 0.11 * Math.sin(0.83 * t) + hy - tap * 0.012, -tap * 0.03);
        p.rotation.set(-0.028 + 0.02 * Math.sin(0.43 * t) + tap * 0.0035, 0.085 * Math.sin(0.31 * t + 1.0) + hr, 0.011 * Math.sin(0.37 * t + 2) + hz);
      };
      set(phone); set(phone2);
      const kb = window.CHATUI.kbK(t);
      spill.material.opacity = 0.13 + 0.05 * kb; shadow.position.x = phone.position.x; halo.position.x = phone.position.x * 0.6;
      orbs.forEach((o) => {
        const yy = -4 + ((o.y0 + t * o.sp * 0.012) % 1) * 44, xx = o.x + 1.4 * Math.sin(0.11 * t + o.ph);
        const tw = 0.72 + 0.28 * Math.sin(0.6 * t + o.ph * 3);
        o.s.position.set(xx, yy, o.z); o.s.material.opacity = o.a * tw;
        o.m.position.set(xx, 2 * FLOOR - yy, o.z); o.m.material.opacity = o.a * tw * 0.32;
      });
      dust.forEach((d) => { d.s.position.set(d.x + 0.8 * Math.sin(0.2 * t + d.ph), -9 + ((d.y0 + t * d.sp * 0.02) % 1) * 22, d.z); d.s.material.opacity = d.a * (0.6 + 0.4 * Math.sin(0.9 * t + d.ph)); });
      const c = camAt(t), ang = 0.075 * Math.sin(0.23 * t + 0.4) + 0.02 * Math.sin(0.61 * t);
      camera.position.set(c[1] * Math.sin(ang), c[0] + 0.9 + 0.35 * Math.sin(0.19 * t + 1), c[1] * Math.cos(ang));
      camera.lookAt(0, c[0], 0);
      renderer.clear(); renderer.render(scene, camera); renderer.clearDepth(); renderer.render(oScene, oCam);
    }
    return { render, renderer };
  }
  window.CHATFILM = { create };
})();

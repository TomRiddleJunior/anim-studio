/* kw-kit.js — kinetic-word-edit render kit (three.js r170, no colour management: canvas colours map 1:1 to output).
   KW.create({canvas, width, height}) -> K
     K.rt(scale?)                      half-float render target (MSAA 4 at full size)
     K.quad(material, target, clear?)  draw a full-screen pass into a target (null = canvas)
     K.post(src, P)                    bloom + defocus/motion blur + CA + grade + grain + vignette + flash/fade -> canvas
     K.mix(a, b, amt, mode, target)    crossfade (mode 0) / luma burn (mode 1) of two targets
     K.tex(canvas)                     CanvasTexture with sane defaults
     K.text(str, opt)                  {canvas, tex, w, h} text texture (font, size, color, scaleX, glow, stroke, pad)
     K.noiseGLSL                       value-noise / fbm GLSL snippet
   KW.rng(seed), KW.ease, KW.seg(t,a,b), KW.clamp, KW.lerp, KW.smooth
   Everything is a pure function of t: no state is carried between frames. */
(function () {
  const THREE = window.THREE;
  THREE.ColorManagement.enabled = false;
  const KW = {};
  KW.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  KW.lerp = (a, b, u) => a + (b - a) * u;
  KW.seg = (t, a, b) => KW.clamp((t - a) / (b - a));
  KW.smooth = (x) => { x = KW.clamp(x); return x * x * (3 - 2 * x); };
  KW.ease = {
    io: (u) => -(Math.cos(Math.PI * KW.clamp(u)) - 1) / 2,
    out2: (u) => 1 - (1 - KW.clamp(u)) ** 2,
    out3: (u) => 1 - (1 - KW.clamp(u)) ** 3,
    out5: (u) => 1 - (1 - KW.clamp(u)) ** 5,
    in2: (u) => KW.clamp(u) ** 2,
    in3: (u) => KW.clamp(u) ** 3,
    outExpo: (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * KW.clamp(u))),
    inExpo: (u) => (u <= 0 ? 0 : Math.pow(2, 10 * KW.clamp(u) - 10)),
    outBack: (u) => { u = KW.clamp(u); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2; },
  };
  KW.rng = function (seed) {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  };
  // deterministic 1-D smooth noise for camera drift etc.
  KW.n1 = (x, seed = 0) => {
    const h = (i) => { const s = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453; return s - Math.floor(s); };
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return h(i) * (1 - u) + h(i + 1) * u - 0.5;
  };

  KW.noiseGLSL = `
    float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
    float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
      return mix(mix(hash12(i), hash12(i+vec2(1,0)), u.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), u.x), u.y); }
    float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 5; i++){ s += a * vnoise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; } return s; }
  `;

  const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;

  KW.create = function (opt) {
    const W = opt.width, H = opt.height;
    const renderer = new THREE.WebGLRenderer({ canvas: opt.canvas, antialias: false, preserveDrawingBuffer: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.autoClear = false;
    const K = { THREE, renderer, W, H };

    K.rt = (scale = 1, samples) => new THREE.WebGLRenderTarget(Math.round(W * scale), Math.round(H * scale), {
      type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: scale === 1, samples: samples === undefined ? (scale === 1 ? 4 : 0) : samples,
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false,
    });

    const qcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const qgeo = new THREE.PlaneGeometry(2, 2);
    const qmesh = new THREE.Mesh(qgeo, null);
    qmesh.frustumCulled = false;
    const qscene = new THREE.Scene();
    qscene.add(qmesh);
    K.quad = (mat, target, clear = true) => {
      qmesh.material = mat;
      renderer.setRenderTarget(target || null);
      if (clear) { renderer.setClearColor(0x000000, 1); renderer.clear(true, true, true); }
      renderer.render(qscene, qcam);
    };
    K.shader = (frag, uniforms, extra) => new THREE.ShaderMaterial(Object.assign({
      vertexShader: VS, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false,
    }, extra || {}));

    K.tex = (canvas, opt2) => {
      const t = new THREE.CanvasTexture(canvas);
      t.colorSpace = THREE.NoColorSpace;
      t.anisotropy = 8;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.generateMipmaps = true;
      if (opt2 && opt2.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
      t.needsUpdate = true;
      return t;
    };

    // text texture: opt = {font: "900 200px X", color, scaleX, glow: [color, blur], stroke: [color, width], fill: true, pad, ls (letter spacing px), grad: [top, bottom]}
    K.text = (str, o) => {
      o = Object.assign({ font: "700 160px sans-serif", color: "#fff", scaleX: 1, pad: 40, fill: true, ls: 0 }, o || {});
      const c0 = document.createElement("canvas").getContext("2d");
      c0.font = o.font;
      if ("letterSpacing" in c0) c0.letterSpacing = o.ls + "px";
      const m = c0.measureText(str);
      const asc = m.actualBoundingBoxAscent || parseFloat(o.font.match(/(\d+)px/)[1]) * 0.75;
      const desc = m.actualBoundingBoxDescent || parseFloat(o.font.match(/(\d+)px/)[1]) * 0.2;
      const tw = Math.ceil(m.width * o.scaleX), th = Math.ceil(asc + desc);
      const cw = tw + o.pad * 2, ch = th + o.pad * 2;
      const cv = document.createElement("canvas");
      cv.width = cw; cv.height = ch;
      const c = cv.getContext("2d");
      c.font = o.font;
      if ("letterSpacing" in c) c.letterSpacing = o.ls + "px";
      c.textBaseline = "alphabetic";
      c.translate(o.pad, o.pad + asc);
      c.scale(o.scaleX, 1);
      let fs = o.color;
      if (o.grad) { const g = c.createLinearGradient(0, -asc, 0, desc); g.addColorStop(0, o.grad[0]); g.addColorStop(1, o.grad[1]); fs = g; }
      if (o.glow) { c.shadowColor = o.glow[0]; c.shadowBlur = o.glow[1]; }
      if (o.stroke) { c.lineJoin = "round"; c.strokeStyle = o.stroke[0]; c.lineWidth = o.stroke[1]; c.strokeText(str, 0, 0); }
      if (o.fill) { c.fillStyle = fs; c.fillText(str, 0, 0); if (o.glow) { c.shadowBlur = 0; c.fillText(str, 0, 0); } }
      return { canvas: cv, tex: K.tex(cv), w: cw, h: ch, tw, th, asc, pad: o.pad };
    };

    // ---------------------------------------------------------------- passes
    const rtA = K.rt(1), rtB = K.rt(1), rtM = K.rt(1, 0), rtF = K.rt(1, 0);
    K.targets = { A: rtA, B: rtB, M: rtM, F: rtF };
    const levels = [];
    for (let i = 1; i <= 6; i++) levels.push(K.rt(1 / Math.pow(2, i), 0));
    const ups = levels.map((l) => new THREE.WebGLRenderTarget(l.width, l.height, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false }));

    const matThresh = K.shader(`varying vec2 vUv; uniform sampler2D tSrc; uniform float thr, knee; uniform vec2 hp;
      void main(){ vec3 c = (texture2D(tSrc, vUv).rgb*4. + texture2D(tSrc, vUv+hp).rgb + texture2D(tSrc, vUv-hp).rgb
                   + texture2D(tSrc, vUv+vec2(hp.x,-hp.y)).rgb + texture2D(tSrc, vUv-vec2(hp.x,-hp.y)).rgb)/8.;
        float l = max(c.r, max(c.g, c.b)); float s = clamp((l - thr + knee) / (2.*knee + 1e-4), 0., 1.); s = s*s*knee;
        float w = max(s, l - thr) / max(l, 1e-4); gl_FragColor = vec4(c * w, 1.); }`,
      { tSrc: { value: null }, thr: { value: 0.8 }, knee: { value: 0.3 }, hp: { value: new THREE.Vector2() } });
    const matDown = K.shader(`varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 hp;
      void main(){ vec3 c = texture2D(tSrc, vUv).rgb*4. + texture2D(tSrc, vUv+hp).rgb + texture2D(tSrc, vUv-hp).rgb
                   + texture2D(tSrc, vUv+vec2(hp.x,-hp.y)).rgb + texture2D(tSrc, vUv-vec2(hp.x,-hp.y)).rgb; gl_FragColor = vec4(c/8., 1.); }`,
      { tSrc: { value: null }, hp: { value: new THREE.Vector2() } });
    const matUp = K.shader(`varying vec2 vUv; uniform sampler2D tSrc, tAdd; uniform vec2 hp; uniform float wAdd;
      void main(){ vec3 s = texture2D(tSrc, vUv+vec2(-hp.x*2.,0.)).rgb + texture2D(tSrc, vUv+vec2(-hp.x,hp.y)).rgb*2. + texture2D(tSrc, vUv+vec2(0.,hp.y*2.)).rgb
        + texture2D(tSrc, vUv+vec2(hp.x,hp.y)).rgb*2. + texture2D(tSrc, vUv+vec2(hp.x*2.,0.)).rgb + texture2D(tSrc, vUv+vec2(hp.x,-hp.y)).rgb*2.
        + texture2D(tSrc, vUv+vec2(0.,-hp.y*2.)).rgb + texture2D(tSrc, vUv+vec2(-hp.x,-hp.y)).rgb*2.;
        gl_FragColor = vec4(s/12. + texture2D(tAdd, vUv).rgb * wAdd, 1.); }`,
      { tSrc: { value: null }, tAdd: { value: null }, hp: { value: new THREE.Vector2() }, wAdd: { value: 1 } });

    const matMix = K.shader(`varying vec2 vUv; uniform sampler2D tA, tB; uniform float amt, ga, gb; uniform int mode; ${KW.noiseGLSL}
      void main(){ vec3 a = texture2D(tA, vUv).rgb * ga, b = texture2D(tB, vUv).rgb * gb;
        if (mode == 0) { gl_FragColor = vec4(mix(a, b, amt), 1.); return; }
        if (mode == 2) { gl_FragColor = vec4(a + b * amt, 1.); return; }
        // burn: a noisy luminance front eats A, its edge glows ember-orange, B shows through
        float n = fbm(vUv * vec2(3., 5.3)) * .8 + (1. - vUv.y) * .35;
        float e = amt * 1.4 - .2; float m = smoothstep(e - .06, e + .06, n);
        float edge = smoothstep(.12, 0., abs(n - e)) * (1. - abs(amt*2.-1.));
        vec3 c = mix(b, a, m) + vec3(1.6, .7, .2) * edge * 2.2;
        gl_FragColor = vec4(c, 1.); }`,
      { tA: { value: null }, tB: { value: null }, amt: { value: 0 }, mode: { value: 0 }, ga: { value: 1 }, gb: { value: 1 } });
    // mode 0 crossfade, 1 burn, 2 add (a*ga + b*gb*amt)
    K.mix = (a, b, amt, mode, target, ga = 1, gb = 1) => {
      matMix.uniforms.tA.value = a.texture; matMix.uniforms.tB.value = b.texture;
      matMix.uniforms.amt.value = amt; matMix.uniforms.mode.value = mode || 0;
      matMix.uniforms.ga.value = ga; matMix.uniforms.gb.value = gb;
      K.quad(matMix, target || rtM);
      return target || rtM;
    };

    const matPost = K.shader(`varying vec2 vUv; uniform sampler2D tSrc, tBloom; uniform vec2 res, mbDir; uniform float mbAmt, defocus, bloom,
        exposure, ca, vig, grain, flash, fade, time, sat, contrast; uniform vec3 flashCol, lift, gain; uniform float swirl; ${KW.noiseGLSL}
      vec3 samp(vec2 uv){ vec2 d = (uv - .5); float k = ca * dot(d, d);
        return vec3(texture2D(tSrc, uv - d*k).r, texture2D(tSrc, uv).g, texture2D(tSrc, uv + d*k).b); }
      void main(){
        vec2 uv = vUv; vec3 c = vec3(0.);
        float blurOn = step(.01, mbAmt + defocus);
        if (blurOn > .5) {
          float tw = 0.;
          for (int i = 0; i < 24; i++) {
            float fi = float(i); float a = fi * 2.39996; float r = sqrt((fi + .5) / 24.);
            vec2 o = vec2(cos(a), sin(a)) * r * defocus + mbDir * (fi / 23. - .5) * mbAmt;
            c += samp(uv + o / res); tw += 1.;
          }
          c /= tw;
        } else c = samp(uv);
        c += texture2D(tBloom, uv).rgb * bloom;
        c *= exposure;
        float l = dot(c, vec3(.299, .587, .114));
        c = mix(vec3(l), c, sat);
        c = (c - .5) * contrast + .5;
        c = c * gain + lift;
        vec2 d = uv - .5; d.x *= ${(W / H).toFixed(4)};
        c *= 1. - vig * smoothstep(.25, .95, length(d) * 1.25);
        c = mix(c, flashCol, flash);
        c *= 1. - fade;
        float g = hash12(uv * res + fract(time * 7.13) * 400.) - .5;
        c += g * grain;
        // soft shoulder so highlights roll off instead of clipping hard
        c = c / (1. + max(c - .85, 0.) * 1.2);
        gl_FragColor = vec4(clamp(c, 0., 1.), 1.); }`,
      { tSrc: { value: null }, tBloom: { value: null }, res: { value: new THREE.Vector2(W, H) }, mbDir: { value: new THREE.Vector2(0, 0) }, mbAmt: { value: 0 },
        defocus: { value: 0 }, bloom: { value: 0.6 }, exposure: { value: 1 }, ca: { value: 0 }, vig: { value: 0.3 }, grain: { value: 0.03 }, flash: { value: 0 },
        fade: { value: 0 }, time: { value: 0 }, sat: { value: 1 }, contrast: { value: 1 }, flashCol: { value: new THREE.Color(1, 1, 1) },
        lift: { value: new THREE.Vector3(0, 0, 0) }, gain: { value: new THREE.Vector3(1, 1, 1) }, swirl: { value: 0 } });

    K.bloom = (src, thr, knee) => {
      matThresh.uniforms.tSrc.value = src.texture;
      matThresh.uniforms.thr.value = thr; matThresh.uniforms.knee.value = knee;
      matThresh.uniforms.hp.value.set(0.5 / src.width, 0.5 / src.height);
      K.quad(matThresh, levels[0]);
      for (let i = 1; i < levels.length; i++) {
        matDown.uniforms.tSrc.value = levels[i - 1].texture;
        matDown.uniforms.hp.value.set(0.5 / levels[i - 1].width, 0.5 / levels[i - 1].height);
        K.quad(matDown, levels[i]);
      }
      let cur = levels[levels.length - 1];
      for (let i = levels.length - 2; i >= 0; i--) {
        matUp.uniforms.tSrc.value = cur.texture; matUp.uniforms.tAdd.value = levels[i].texture; matUp.uniforms.wAdd.value = 1;
        matUp.uniforms.hp.value.set(0.5 / cur.width, 0.5 / cur.height);
        K.quad(matUp, ups[i]);
        cur = ups[i];
      }
      return cur;
    };

    // P: {bloom, thr, knee, exposure, defocus, mb:[dx,dy], ca, vig, grain, flash, flashCol:[r,g,b], fade, sat, contrast, lift:[], gain:[], t}
    K.post = (src, P) => {
      const b = K.bloom(src, P.thr === undefined ? 0.75 : P.thr, P.knee === undefined ? 0.3 : P.knee);
      const u = matPost.uniforms;
      u.tSrc.value = src.texture; u.tBloom.value = b.texture;
      const mb = P.mb || [0, 0];
      const ml = Math.hypot(mb[0], mb[1]);
      u.mbAmt.value = ml; u.mbDir.value.set(ml > 0 ? mb[0] / ml : 0, ml > 0 ? mb[1] / ml : 0);
      u.defocus.value = P.defocus || 0;
      u.bloom.value = P.bloom === undefined ? 0.6 : P.bloom;
      u.exposure.value = P.exposure === undefined ? 1 : P.exposure;
      u.ca.value = P.ca || 0; u.vig.value = P.vig === undefined ? 0.35 : P.vig; u.grain.value = P.grain === undefined ? 0.035 : P.grain;
      u.flash.value = P.flash || 0; const fc = P.flashCol || [1, 1, 1]; u.flashCol.value.setRGB(fc[0], fc[1], fc[2]);
      u.fade.value = P.fade || 0; u.time.value = P.t || 0; u.sat.value = P.sat === undefined ? 1 : P.sat; u.contrast.value = P.contrast === undefined ? 1 : P.contrast;
      const li = P.lift || [0, 0, 0], ga = P.gain || [1, 1, 1];
      u.lift.value.set(li[0], li[1], li[2]); u.gain.value.set(ga[0], ga[1], ga[2]);
      K.quad(matPost, null);
    };

    // render a three scene + camera into a target; bg (optional material) is drawn first as a full-screen pass
    K.render = (scene, camera, target, bgMat) => {
      renderer.setRenderTarget(target);
      renderer.setClearColor(0x000000, 1);
      renderer.clear(true, true, true);
      if (bgMat) { qmesh.material = bgMat; renderer.render(qscene, qcam); renderer.clearDepth(); }
      if (scene) renderer.render(scene, camera);
    };

    // a textured plane (meters = px / pxPerM); centred, with optional pivot offset
    K.plane = (texObj, pxPerM, mopt) => {
      const w = texObj.w / pxPerM, h = texObj.h / pxPerM;
      const geo = new THREE.PlaneGeometry(w, h, (mopt && mopt.segX) || 1, (mopt && mopt.segY) || 1);
      const mat = new THREE.MeshBasicMaterial(Object.assign({ map: texObj.tex, transparent: true, depthWrite: false, toneMapped: false }, (mopt && mopt.mat) || {}));
      const m = new THREE.Mesh(geo, mat);
      m.userData.w = w; m.userData.h = h;
      return m;
    };

    // fonts: wait for every family the film declares
    K.ready = (opt.fonts && opt.fonts.length ? Promise.all(opt.fonts.map((f) => document.fonts.load(f))) : Promise.resolve()).then(() => document.fonts.ready);
    return K;
  };

  window.KW = KW;
})();

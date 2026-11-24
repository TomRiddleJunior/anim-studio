/* guardian-gl.js — WebGL2 plate renderer for "The Guardian & the girl".
 *
 * Draws one frame of the key-art plate as layers (inpainted background, Guardian, girl) with a gaussian "liquify"
 * warp per layer (Live2D-like controls masked by region maps), the girl's blinks (closed-lid texture + a drawn lash
 * line) and mouth (jaw warp + dark interior), the Guardian's voice glow (cyan circuit-line pulses + medallion), a
 * code-drawn clock (hands with angular motion blur, rings and sky beyond the plate for the wide layout), a
 * foreground stone parapet over a warm void, point-sprite particles, bloom, vignette, grade and grain.
 *
 * GRD.create(canvas, { base: "assets/plate/", landmarks }) -> { ready: Promise, render(state) }
 * World coordinates are SOURCE pixels of the 1402 x 1122 key art (y down). The state is built by guardian-film.js.
 */
(function () {
  "use strict";
  const SRC = [1402, 1122];

  const VS = `#version 300 es
  in vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const COMMON = `#version 300 es
  precision highp float;
  uniform vec2 uRes;
  uniform vec4 uCam;            // world centre x, y, zoom (screen px per source px), roll (rad)
  const vec2 SRC = vec2(1402.0, 1122.0);
  vec2 worldAt(vec2 fc) {
    vec2 s = vec2(fc.x, uRes.y - fc.y) - 0.5 * uRes;
    s /= uCam.z;
    float c = cos(uCam.w), sn = sin(uCam.w);
    s = vec2(c * s.x - sn * s.y, sn * s.x + c * s.y);
    return uCam.xy + s;
  }
  float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  vec2 hash22(vec2 p) { float n = hash21(p); return vec2(n, hash21(p + n + 17.17)); }
  float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y); }
  float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }
  `;

  // ---------------------------------------------------------------- background: plate bg, sky, rings, clock, void
  const FS_BG = COMMON + `
  uniform sampler2D uBg;
  uniform float uBgLod; uniform vec2 uBgOff;
  uniform vec4 uClock;          // second, minute, hour angle (rad, 0 = 12 o'clock, clockwise), hand glow
  uniform vec3 uClockBlur;      // trailing angular blur (rad) for second, minute, hour
  uniform vec2 uClockC;         // hand centre
  uniform vec3 uRingC;          // ring centre x, y, outer radius
  uniform float uSky;           // 1 = draw the procedural world beyond the plate (wide layouts)
  uniform float uTime, uWarm, uFreeze;
  out vec4 o;

  vec3 skyCol(vec2 w) {
    float h = clamp(-w.y / 760.0, 0.0, 1.0);
    vec3 c = mix(vec3(0.10, 0.13, 0.33), vec3(0.025, 0.035, 0.11), pow(h, 0.8));
    float neb = fbm(w * 0.0042 + vec2(3.1, 7.7));
    c += vec3(0.16, 0.08, 0.30) * smoothstep(0.45, 0.85, neb) * 0.55;
    c += vec3(0.05, 0.10, 0.25) * smoothstep(0.5, 0.9, fbm(w * 0.009 + 1.3)) * 0.5;
    // stars: one per 22-px cell, twinkling
    vec2 cell = floor(w / 22.0), f = fract(w / 22.0);
    vec2 sp = hash22(cell);
    float d = length(f - sp) * 22.0;
    float br = pow(hash21(cell + 3.7), 9.0) * 1.6 + 0.04;
    float tw = 0.75 + 0.25 * sin(uTime * (1.0 + 2.0 * hash21(cell + 9.1)) + 6.28 * sp.x);
    c += vec3(0.75, 0.82, 1.0) * br * tw * exp(-d * d / 1.6);
    return c;
  }
  // the clock's golden rings + spokes continued above the plate
  vec3 rings(vec2 w, vec3 base) {
    vec2 d = w - uRingC.xy; float r = length(d); float R = uRingC.z;
    float ang = atan(d.x, -d.y);
    vec3 gold = vec3(1.0, 0.66, 0.30);
    float soft = 7.0;
    float outer = exp(-pow((r - R) / 24.0, 2.0)) * 1.25 + exp(-pow((r - R) / 70.0, 2.0)) * 0.35;
    float rim2 = exp(-pow((r - (R + 56.0)) / 9.0, 2.0)) * 0.55;
    float inner = exp(-pow((r - (R - 120.0)) / 13.0, 2.0)) * 0.75;
    float inner2 = exp(-pow((r - (R - 205.0)) / 9.0, 2.0)) * 0.5;
    // spokes every 30 degrees between the inner rings and the outer ring (the clock frame)
    float k = ang / (3.14159265 / 6.0); float sd = abs(fract(k + 0.5) - 0.5) * (3.14159265 / 6.0) * r;
    float spoke = exp(-pow(sd / 11.0, 2.0)) * smoothstep(R - 205.0, R - 180.0, r) * (1.0 - smoothstep(R - 30.0, R - 5.0, r)) * 0.55;
    // roman-numeral-like blocks on the band between inner rings
    float kk = ang / (3.14159265 / 6.0); float bd = abs(fract(kk) - 0.5) * (3.14159265 / 6.0) * r;
    float block = smoothstep(26.0, 20.0, bd) * smoothstep(R - 196.0, R - 186.0, r) * (1.0 - smoothstep(R - 138.0, R - 128.0, r));
    float bars = block * (0.5 + 0.5 * step(0.5, fract(bd / 9.0))) * 0.6;
    float g = outer + rim2 + inner + inner2 + spoke + bars;
    vec3 c = base * (1.0 - 0.35 * clamp(g, 0.0, 1.0)) + gold * g * 0.9;
    // warm bloom around the big ring
    c += vec3(0.9, 0.45, 0.15) * exp(-pow((r - R) / 160.0, 2.0)) * 0.18;
    return c;
  }
  float handA(vec2 w, float a, float len, float wid, float tail, float soft) {
    vec2 d = w - uClockC;
    vec2 dir = vec2(sin(a), -cos(a));
    float along = dot(d, dir); float across = dot(d, vec2(-dir.y, dir.x));
    float t = clamp((along + tail) / (len + tail), 0.0, 1.0);
    float ww = wid * mix(1.0, 0.35, t);                  // tapers toward the tip
    float inA = smoothstep(-tail - soft, -tail + soft, along) * (1.0 - smoothstep(len - soft, len + soft, along));
    return inA * (1.0 - smoothstep(ww - soft, ww + soft, abs(across)));
  }
  float handBlur(vec2 w, float a, float blur, float len, float wid, float tail, float soft) {
    if (blur < 0.004) return handA(w, a, len, wid, tail, soft);
    float acc = 0.0;
    for (int i = 0; i < 8; i++) { float f = float(i) / 7.0; acc += handA(w, a - blur * f, len, wid, tail, soft) * (1.0 - 0.75 * f); }
    return min(1.0, acc / 3.2);
  }
  vec3 voidCol(vec2 w) {
    float v = clamp((w.y - 1122.0) / 640.0, 0.0, 1.0);
    vec3 c = mix(vec3(0.46, 0.21, 0.08), vec3(0.04, 0.018, 0.015), smoothstep(0.0, 0.8, v));
    c += vec3(0.5, 0.22, 0.08) * fbm(vec2(w.x * 0.004, w.y * 0.006 - uTime * 0.03)) * (1.0 - v) * 0.5;
    // warm bokeh discs
    vec2 cell = floor(w / 120.0), f = fract(w / 120.0);
    vec2 sp = hash22(cell) * 0.7 + 0.15;
    float d = length(f - sp) * 120.0;
    float rad = 14.0 + 26.0 * hash21(cell + 2.0);
    c += vec3(1.0, 0.62, 0.30) * 0.11 * hash21(cell + 5.0) * smoothstep(rad, rad - 3.0, d) * (1.0 - v * 0.7);
    return c;
  }
  void main() {
    vec2 w = worldAt(gl_FragCoord.xy);
    vec2 wb = w + uBgOff;
    vec3 col;
    vec3 plate = textureLod(uBg, clamp(wb, vec2(0.5), SRC - 0.5) / SRC, uBgLod).rgb;
    if (uSky > 0.5 && wb.y < 60.0) {
      vec3 s = rings(wb, skyCol(wb));
      col = mix(s, plate, smoothstep(-6.0, 60.0, wb.y));
    } else if (uSky > 0.5 && wb.y > 1110.0) {
      col = mix(plate, voidCol(wb), smoothstep(1110.0, 1140.0, wb.y));
    } else col = plate;
    // code-drawn hands on the inpainted face (behind the characters)
    float soft = 1.6 + 2.2 * uBgLod;
    vec3 hcol = vec3(1.0, 0.80, 0.50);
    float aH = handBlur(wb, uClock.z, uClockBlur.z, 205.0, 11.0, 34.0, soft);
    float aM = handBlur(wb, uClock.y, uClockBlur.y, 318.0, 7.5, 46.0, soft);
    float aS = handBlur(wb, uClock.x, uClockBlur.x, 336.0, 2.4, 78.0, soft);
    float hub = 1.0 - smoothstep(15.0 - soft, 15.0 + soft, length(wb - uClockC));
    float gem = exp(-dot(wb - uClockC, wb - uClockC) / 30.0);
    float a = max(max(aH, aM), max(aS * 0.9, hub));
    col = mix(col, hcol * (0.85 + 0.5 * uClock.w), a * 0.92);
    // halo around the hands
    float dh = length(wb - uClockC);
    col += vec3(1.0, 0.62, 0.28) * (aH + aM + aS) * 0.12 * (1.0 + uClock.w);
    col += vec3(0.35, 0.75, 1.0) * gem * (0.9 + 0.6 * uClock.w);
    o = vec4(col, 1.0);
  }`;

  // ---------------------------------------------------------------- characters: warps, lids, mouth, glow, parapet
  const FS_CH = COMMON + `
  uniform sampler2D uG, uL, uClosed, uLines, uRegG, uRegL;
  uniform float uCharLod; uniform vec2 uCharOff;
  uniform vec4 uGc[8]; uniform vec4 uGp[8]; uniform int uGn;
  uniform vec4 uLc[14]; uniform vec4 uLp[14]; uniform int uLn; uniform int uLnBody;
  uniform float uEyeT[64]; uniform float uEyeLd[64]; uniform float uEyeB[64];
  uniform vec4 uEyeX;           // far x0, x1, near x0, x1
  uniform vec2 uBlink;          // far, near (0 open .. 1 closed)
  uniform float uMouth;         // 0..1 open
  uniform vec4 uMouthLR; uniform vec2 uMouthC;   // left xy, right xy; bezier control
  uniform vec4 uClosedRect;
  uniform float uLineBase, uMedGlow; uniform vec2 uMed; uniform vec2 uPulse[6];
  uniform float uRim, uTime, uSky, uFg;
  out vec4 o;

  vec2 applyCtl(vec2 p, vec4 c, vec4 q, sampler2D reg) {
    float ty = mod(c.w, 10.0); float ch = floor(c.w / 10.0);
    vec2 d = p - c.xy; float w = exp(-dot(d, d) / (2.0 * c.z * c.z));
    if (ch > 0.5) { vec4 rr = textureLod(reg, clamp(p, vec2(0.5), SRC - 0.5) / SRC, 0.0); w *= ch < 1.5 ? rr.r : ch < 2.5 ? rr.g : ch < 3.5 ? rr.b : rr.a; }
    if (ty < 0.5) return p - q.xy * w;
    if (ty < 1.5) { float a = -q.z * w; vec2 r = p - q.xy; return q.xy + vec2(cos(a) * r.x - sin(a) * r.y, sin(a) * r.x + cos(a) * r.y); }
    vec2 r = p - q.xy; vec2 s = 1.0 + (q.zw - 1.0) * w; return q.xy + r / s;
  }
  vec4 tex(sampler2D t, vec2 p, float lod) { return textureLod(t, p / SRC, lod); }
  float eyeArr(int which, int arr, float s) {     // arr 0 top 1 lid 2 bottom; s in [0, 31]
    int i0 = int(floor(s)); int i1 = min(i0 + 1, 31); float f = s - float(i0);
    int b = which * 32;
    if (arr == 0) return mix(uEyeT[b + i0], uEyeT[b + i1], f);
    if (arr == 1) return mix(uEyeLd[b + i0], uEyeLd[b + i1], f);
    return mix(uEyeB[b + i0], uEyeB[b + i1], f);
  }
  vec4 lid(vec4 c, vec2 r, int which, float x0, float x1, float b, bool outerLeft) {
    if (b < 0.002 || r.x < x0 || r.x > x1) return c;
    float s = (r.x - x0) / (x1 - x0) * 31.0;
    float top = eyeArr(which, 0, s), ld = eyeArr(which, 1, s), bt = eyeArr(which, 2, s);
    float edge = ld + b * (bt - ld);
    float on = smoothstep(0.0, 0.07, b);
    float u = (r.x - x0) / (x1 - x0);
    float ends = smoothstep(0.0, 0.10, u) * smoothstep(1.0, 0.90, u);
    vec2 cu = (r - uClosedRect.xy) / (uClosedRect.zw - uClosedRect.xy);
    vec3 skin = textureLod(uClosed, cu, 0.0).rgb;
    if (r.y >= top - 4.0 && r.y <= edge) {
      float shade = 0.955 - 0.12 * smoothstep(edge - 6.0, edge, r.y);
      float a = on * ends * smoothstep(top - 4.0, top + 0.6, r.y);
      c.rgb = mix(c.rgb, skin * shade * c.a, a);
    }
    float dist = r.y - edge;
    float outer = outerLeft ? 1.0 - u : u;
    float lw = mix(0.55, 1.45, smoothstep(0.15, 0.95, outer));
    float la = (1.0 - smoothstep(lw * 0.45, lw, abs(dist + 0.25))) * on * smoothstep(0.0, 0.1, u) * smoothstep(1.0, 0.9, u);
    // a small flick at the outer corner
    c.rgb = mix(c.rgb, vec3(0.10, 0.05, 0.04) * c.a, la * 0.93);
    if (dist > 0.0 && dist < 3.2) c.rgb *= 1.0 - 0.28 * (1.0 - dist / 3.2) * on * ends;
    return c;
  }
  float mouthY(float x, out float u) {
    vec2 L = uMouthLR.xy, R = uMouthLR.zw;
    u = clamp((x - L.x) / (R.x - L.x), 0.0, 1.0);
    return (1.0 - u) * (1.0 - u) * L.y + 2.0 * u * (1.0 - u) * uMouthC.y + u * u * R.y;
  }
  vec3 parapet(vec2 w, out float a) {
    float top = 1099.0 + 2.5 * sin(w.x * 0.011 + 1.3) + 3.0 * (fbm(vec2(w.x * 0.018, 3.0)) - 0.5);
    a = smoothstep(top - 1.8, top + 1.8, w.y) * (1.0 - smoothstep(top + 190.0, top + 250.0, w.y));
    float n = fbm(w * vec2(0.010, 0.022)), n2 = fbm(w * 0.06 + 4.0);
    vec3 stone = mix(vec3(0.13, 0.10, 0.09), vec3(0.23, 0.17, 0.13), n) * (0.85 + 0.3 * n2);
    float lip = exp(-pow((w.y - top - 4.0) / 4.5, 2.0));
    stone += vec3(1.0, 0.56, 0.26) * lip * (0.55 + 0.1 * uRim);
    float dn = clamp((w.y - top) / 210.0, 0.0, 1.0);
    stone *= mix(1.0, 0.45, smoothstep(0.05, 0.85, dn));
    stone += vec3(0.55, 0.25, 0.09) * smoothstep(0.55, 1.0, dn) * 0.35;     // warm bounce from the void
    // block joints: vertical seams every ~210 px (jittered) and one horizontal course line
    float bx = (w.x + 37.0 + 60.0 * step(top + 96.0, w.y)) / 210.0;
    float sd = abs(fract(bx) - 0.5) * 210.0;
    float below = smoothstep(top + 9.0, top + 14.0, w.y);
    stone *= 1.0 - 0.38 * (1.0 - smoothstep(0.8, 2.6, sd)) * below;
    stone *= 1.0 - 0.32 * exp(-pow((w.y - top - 96.0) / 1.6, 2.0));
    stone += vec3(0.5, 0.28, 0.14) * 0.10 * exp(-pow((w.y - top - 99.0) / 2.0, 2.0));
    return stone;
  }
  void main() {
    vec2 w = worldAt(gl_FragCoord.xy) - uCharOff;
    vec4 outc = vec4(0.0);
    // ---- the Guardian
    vec2 pg = w;
    for (int i = 0; i < 8; i++) { if (i >= uGn) break; pg = applyCtl(pg, uGc[i], uGp[i], uRegG); }
    vec4 cg = tex(uG, clamp(pg, vec2(0.5), SRC - 0.5), uCharLod);
    if (pg.x < 0.0 || pg.y < 0.0 || pg.x > SRC.x || pg.y > SRC.y) cg = vec4(0.0);
    if (cg.a > 0.001) {
      vec4 ln = tex(uLines, pg, uCharLod * 0.7);
      float d = length(pg - uMed);
      float pulse = 0.0;
      for (int k = 0; k < 6; k++) { pulse += uPulse[k].y * exp(-pow((d - uPulse[k].x) / 30.0, 2.0)); }
      float glow = ln.r * (uLineBase + pulse * 1.25);
      cg.rgb += vec3(0.22, 0.78, 1.0) * glow * 0.75 * cg.a;
      cg.rgb += vec3(0.30, 0.80, 1.0) * ln.g * uMedGlow * 0.42 * cg.a;
      // warm rim flicker on the lit edges
      float warm = max(0.0, cg.r - cg.b) * cg.a;
      cg.rgb += cg.rgb * warm * uRim * 0.35;
    }
    outc = cg;
    // ---- the girl (body controls, then face controls)
    vec2 q = w;
    for (int i = 0; i < 14; i++) { if (i >= uLnBody) break; q = applyCtl(q, uLc[i], uLp[i], uRegL); }
    vec2 r = q;
    for (int i = 0; i < 14; i++) { if (i >= uLn) break; if (i < uLnBody) continue; r = applyCtl(r, uLc[i], uLp[i], uRegL); }
    vec4 cl = tex(uL, clamp(r, vec2(0.5), SRC - 0.5), uCharLod);
    if (r.x < 0.0 || r.y < 0.0 || r.x > SRC.x || r.y > SRC.y) cl = vec4(0.0);
    if (cl.a > 0.001) {
      cl = lid(cl, r, 0, uEyeX.x, uEyeX.y, uBlink.x, true);
      cl = lid(cl, r, 1, uEyeX.z, uEyeX.w, uBlink.y, false);
      if (uMouth > 0.01) {
        float u; float my = mouthY(q.x, u);
        float taper = pow(max(0.0, sin(3.14159 * clamp((u - 0.06) / 0.88, 0.0, 1.0))), 0.75);
        float up = my - 0.45 * uMouth * taper, lo = my + uMouth * 5.6 * taper;
        float inside = smoothstep(up - 0.6, up + 0.5, q.y) * (1.0 - smoothstep(lo - 0.7, lo + 0.4, q.y)) * smoothstep(0.02, 0.12, taper);
        float depth = clamp((q.y - up) / max(0.5, lo - up), 0.0, 1.0);
        vec3 inner = mix(vec3(0.10, 0.025, 0.03), vec3(0.30, 0.09, 0.09), smoothstep(0.6, 1.0, depth));
        cl.rgb = mix(cl.rgb, inner * cl.a, inside * 0.88);
      }
      float warm = max(0.0, cl.r - cl.b) * cl.a;
      cl.rgb += cl.rgb * warm * uRim * 0.25;
    }
    outc = cl + outc * (1.0 - cl.a);
    // ---- foreground parapet (wide layouts and any shot that reaches the plate's bottom)
    if (uFg > 0.5 && w.y > 1094.0) {
      float pa; vec3 pc = parapet(w + uCharOff * 0.6, pa);
      outc = vec4(pc * pa, pa) + outc * (1.0 - pa);
    }
    o = outc;
  }`;

  // ---------------------------------------------------------------- particles (additive point sprites)
  const VS_PT = `#version 300 es
  in vec4 aP;      // screen x, y (px, y down), size px, intensity
  in vec3 aC;      // colour
  uniform vec2 uRes;
  out vec3 vC; out float vI;
  void main() { vec2 c = aP.xy / uRes * 2.0 - 1.0; gl_Position = vec4(c.x, -c.y, 0.0, 1.0); gl_PointSize = aP.z; vC = aC; vI = aP.w; }`;
  const FS_PT = `#version 300 es
  precision highp float; in vec3 vC; in float vI; out vec4 o;
  void main() { vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0; float a = exp(-r * 4.0) + 0.35 * exp(-r * 1.2); o = vec4(vC * a * vI, 0.0); }`;

  // ---------------------------------------------------------------- bloom + final
  const FS_BRIGHT = COMMON + `
  uniform sampler2D uSrc; uniform float uThr; out vec4 o;
  void main() { vec2 uv = gl_FragCoord.xy / uRes; vec3 c = vec3(0.0);
    vec2 px = 1.0 / uRes;
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) c += texture(uSrc, uv + vec2(x, y) * px * 0.75).rgb;
    c /= 9.0; float l = max(c.r, max(c.g, c.b)); float k = smoothstep(uThr, uThr + 0.35, l); o = vec4(c * k, 1.0); }`;
  const FS_BLUR = COMMON + `
  uniform sampler2D uSrc; uniform vec2 uDir; out vec4 o;
  void main() { vec2 uv = gl_FragCoord.xy / uRes; vec3 c = texture(uSrc, uv).rgb * 0.2270;
    c += (texture(uSrc, uv + uDir * 1.3846).rgb + texture(uSrc, uv - uDir * 1.3846).rgb) * 0.3162;
    c += (texture(uSrc, uv + uDir * 3.2308).rgb + texture(uSrc, uv - uDir * 3.2308).rgb) * 0.0703;
    o = vec4(c, 1.0); }`;
  const FS_FINAL = COMMON + `
  uniform sampler2D uScene, uB1, uB2, uB3;
  uniform float uBloom, uExpo, uSat, uVig, uGrain, uFrame, uWarm, uCool, uFade, uContrast;
  out vec4 o;
  vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec3 c = texture(uScene, uv).rgb;
    vec3 b = texture(uB1, uv).rgb * 0.5 + texture(uB2, uv).rgb * 0.8 + texture(uB3, uv).rgb * 1.1;
    c += b * uBloom;
    c *= uExpo;
    // warm swell / time-stop cool
    c *= mix(vec3(1.0), vec3(1.12, 1.0, 0.86), uWarm);
    c += vec3(0.05, 0.025, 0.0) * uWarm;
    c = mix(c, c * vec3(0.86, 0.95, 1.12), uCool);
    // tone: a soft shoulder that keeps the painted look (mostly linear below 0.8)
    vec3 t = mix(c, aces(c * 1.05), 0.35);
    float l = dot(t, vec3(0.2126, 0.7152, 0.0722));
    t = mix(vec3(l), t, uSat);
    t = (t - 0.5) * uContrast + 0.5;
    vec2 q = uv - 0.5; q.x *= uRes.x / uRes.y;
    float v = 1.0 - uVig * smoothstep(0.25, 0.95, length(q * vec2(1.0, 0.85)) * 1.25);
    t *= v;
    float g = hash21(gl_FragCoord.xy + vec2(uFrame * 17.0, uFrame * 31.0)) - 0.5;
    t += g * uGrain;
    t *= 1.0 - uFade;
    o = vec4(clamp(t, 0.0, 1.0), 1.0);
  }`;

  function compile(gl, type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error("shader: " + gl.getShaderInfoLog(s) + "\n" + src.split("\n").slice(0, 5).join("\n"));
    return s;
  }
  function program(gl, vs, fs) {
    const p = gl.createProgram(); gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, "aPos"); gl.bindAttribLocation(p, 0, "aP"); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("link: " + gl.getProgramInfoLog(p));
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); const nm = info.name.replace(/\[0\]$/, ""); u[nm] = gl.getUniformLocation(p, info.name); }
    return { p, u };
  }
  function loadImage(src) {
    return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error("image " + src)); im.src = src; });
  }

  function create(canvas, opt) {
    const W = canvas.width, H = canvas.height;
    const gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true, alpha: false });
    if (!gl) throw new Error("WebGL2 unavailable");
    gl.getExtension("EXT_color_buffer_float"); gl.getExtension("EXT_color_buffer_half_float");
    const L = opt.landmarks;
    const base = opt.base || "assets/plate/";
    const P = {
      bg: program(gl, VS, FS_BG), ch: program(gl, VS, FS_CH), bright: program(gl, VS, FS_BRIGHT), blur: program(gl, VS, FS_BLUR),
      fin: program(gl, VS, FS_FINAL),
    };
    const ptProg = (function () {
      const p = gl.createProgram(); gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VS_PT)); gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, FS_PT));
      gl.bindAttribLocation(p, 0, "aP"); gl.bindAttribLocation(p, 1, "aC"); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("pt link: " + gl.getProgramInfoLog(p));
      return { p, uRes: gl.getUniformLocation(p, "uRes") };
    })();
    // full-screen triangle
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const ptVao = gl.createVertexArray(); gl.bindVertexArray(ptVao);
    const ptBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 28, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 28, 16);
    gl.bindVertexArray(null);

    function rt(w, h, half) {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      if (half) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      if (!ok && half) return rt(w, h, false);
      return { t, f, w, h };
    }
    const scene = rt(W, H, true);
    const lv = [[W / 4, H / 4], [W / 8, H / 8], [W / 16, H / 16]].map(([w, h]) => [rt(Math.round(w), Math.round(h), true), rt(Math.round(w), Math.round(h), true)]);

    const T = {};
    function upload(img, premult, mip) {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premult);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      if (mip) gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }
    const files = L.files;
    const ready = Promise.all([
      ["bg", files.bg, false, true], ["g", files.guardian, true, true], ["l", files.girl, true, true], ["closed", files.girl_closed, false, false],
      ["lines", files.lines, false, true], ["regG", files.regions_guardian, false, false], ["regL", files.regions_girl, false, false],
    ].map(([k, f, pm, mip]) => loadImage(base + f).then((im) => { T[k] = upload(im, pm, mip); })));

    const eye = L.girl.eyes;
    const eyeT = new Float32Array(64), eyeLd = new Float32Array(64), eyeB = new Float32Array(64);
    ["far", "near"].forEach((k, i) => { const s = eye[k].samples; for (let j = 0; j < 32; j++) { eyeT[i * 32 + j] = s.top[j]; eyeLd[i * 32 + j] = s.lid[j]; eyeB[i * 32 + j] = s.bottom[j]; } });
    const eyeX = [eye.far.samples.x0, eye.far.samples.x1, eye.near.samples.x0, eye.near.samples.x1];
    const M = L.girl.mouth; const mc = [2 * M.mid[0] - (M.left[0] + M.right[0]) / 2, 2 * M.mid[1] - (M.left[1] + M.right[1]) / 2];
    const cr = L.girl.closed_crop;

    function bindTex(prog, name, unit, tex) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(prog.u[name], unit); }
    function draw(fbo, w, h) { gl.bindFramebuffer(gl.FRAMEBUFFER, fbo ? fbo.f : null); gl.viewport(0, 0, w, h); gl.bindVertexArray(vao); gl.drawArrays(gl.TRIANGLES, 0, 3); }
    function ctlArrays(list, n) {
      const c = new Float32Array(n * 4), p = new Float32Array(n * 4);
      list.slice(0, n).forEach((k, i) => { c.set(k.c, i * 4); p.set(k.p, i * 4); });
      return [c, p];
    }
    function points(arr) {
      if (!arr || !arr.length) return;
      gl.useProgram(ptProg.p); gl.uniform2f(ptProg.uRes, W, H);
      gl.bindVertexArray(ptVao); gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf);
      gl.bufferData(gl.ARRAY_BUFFER, arr, gl.DYNAMIC_DRAW);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      gl.drawArrays(gl.POINTS, 0, arr.length / 7);
      gl.disable(gl.BLEND); gl.bindVertexArray(null);
    }

    function render(S) {
      const cam = [S.cam.x, S.cam.y, S.cam.z, S.cam.roll || 0];
      // 1) background
      let pr = P.bg; gl.useProgram(pr.p);
      gl.uniform2f(pr.u.uRes, W, H); gl.uniform4fv(pr.u.uCam, cam);
      bindTex(pr, "uBg", 0, T.bg);
      gl.uniform1f(pr.u.uBgLod, S.bgLod || 0); gl.uniform2fv(pr.u.uBgOff, S.bgOff || [0, 0]);
      gl.uniform4fv(pr.u.uClock, S.clock); gl.uniform3fv(pr.u.uClockBlur, S.clockBlur || [0, 0, 0]);
      gl.uniform2fv(pr.u.uClockC, L.clock.center); gl.uniform3fv(pr.u.uRingC, S.ringC || [700, 442, 690]);
      gl.uniform1f(pr.u.uSky, S.sky ? 1 : 0); gl.uniform1f(pr.u.uTime, S.time); gl.uniform1f(pr.u.uWarm, S.warm || 0); gl.uniform1f(pr.u.uFreeze, S.freeze || 0);
      draw(scene, W, H);
      // 2) particles behind the characters
      gl.bindFramebuffer(gl.FRAMEBUFFER, scene.f); gl.viewport(0, 0, W, H); points(S.ptsBack);
      // 3) characters (premultiplied over)
      pr = P.ch; gl.useProgram(pr.p);
      gl.uniform2f(pr.u.uRes, W, H); gl.uniform4fv(pr.u.uCam, cam);
      bindTex(pr, "uG", 0, T.g); bindTex(pr, "uL", 1, T.l); bindTex(pr, "uClosed", 2, T.closed); bindTex(pr, "uLines", 3, T.lines);
      bindTex(pr, "uRegG", 4, T.regG); bindTex(pr, "uRegL", 5, T.regL);
      gl.uniform1f(pr.u.uCharLod, S.charLod || 0); gl.uniform2fv(pr.u.uCharOff, S.charOff || [0, 0]);
      const [gc, gp] = ctlArrays(S.gCtl, 8); gl.uniform4fv(pr.u.uGc, gc); gl.uniform4fv(pr.u.uGp, gp); gl.uniform1i(pr.u.uGn, Math.min(8, S.gCtl.length));
      const [lc, lp] = ctlArrays(S.lCtl, 14); gl.uniform4fv(pr.u.uLc, lc); gl.uniform4fv(pr.u.uLp, lp);
      gl.uniform1i(pr.u.uLn, Math.min(14, S.lCtl.length)); gl.uniform1i(pr.u.uLnBody, S.lBody);
      gl.uniform1fv(pr.u.uEyeT, eyeT); gl.uniform1fv(pr.u.uEyeLd, eyeLd); gl.uniform1fv(pr.u.uEyeB, eyeB); gl.uniform4fv(pr.u.uEyeX, eyeX);
      gl.uniform2fv(pr.u.uBlink, S.blink || [0, 0]); gl.uniform1f(pr.u.uMouth, S.mouth || 0);
      gl.uniform4fv(pr.u.uMouthLR, [M.left[0], M.left[1], M.right[0], M.right[1]]); gl.uniform2fv(pr.u.uMouthC, mc);
      gl.uniform4fv(pr.u.uClosedRect, cr);
      gl.uniform1f(pr.u.uLineBase, S.lineBase || 0.2); gl.uniform1f(pr.u.uMedGlow, S.medGlow || 0.3); gl.uniform2fv(pr.u.uMed, S.med || L.guardian.medallion);
      const pu = new Float32Array(12); (S.pulses || []).slice(0, 6).forEach((x, i) => { pu[i * 2] = x[0]; pu[i * 2 + 1] = x[1]; });
      gl.uniform2fv(pr.u.uPulse, pu);
      gl.uniform1f(pr.u.uRim, S.rim || 0); gl.uniform1f(pr.u.uTime, S.time); gl.uniform1f(pr.u.uSky, S.sky ? 1 : 0); gl.uniform1f(pr.u.uFg, S.fg === false ? 0 : 1);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      draw(scene, W, H);
      gl.disable(gl.BLEND);
      // 4) particles in front (dust, sparks, glows)
      gl.bindFramebuffer(gl.FRAMEBUFFER, scene.f); gl.viewport(0, 0, W, H); points(S.ptsFront);
      // 5) bloom
      pr = P.bright; gl.useProgram(pr.p); gl.uniform2f(pr.u.uRes, lv[0][0].w, lv[0][0].h); bindTex(pr, "uSrc", 0, scene.t); gl.uniform1f(pr.u.uThr, S.bloomThr || 0.62);
      draw(lv[0][0], lv[0][0].w, lv[0][0].h);
      for (let i = 0; i < 3; i++) {
        const [a, b] = lv[i];
        if (i > 0) { pr = P.blur; gl.useProgram(pr.p); gl.uniform2f(pr.u.uRes, a.w, a.h); bindTex(pr, "uSrc", 0, lv[i - 1][0].t); gl.uniform2f(pr.u.uDir, 0, 0); draw(a, a.w, a.h); }
        pr = P.blur; gl.useProgram(pr.p); gl.uniform2f(pr.u.uRes, a.w, a.h);
        for (let k = 0; k < 2; k++) {
          bindTex(pr, "uSrc", 0, a.t); gl.uniform2f(pr.u.uDir, 1 / a.w, 0); draw(b, a.w, a.h);
          bindTex(pr, "uSrc", 0, b.t); gl.uniform2f(pr.u.uDir, 0, 1 / a.h); draw(a, a.w, a.h);
        }
      }
      // 6) final
      pr = P.fin; gl.useProgram(pr.p); gl.uniform2f(pr.u.uRes, W, H);
      bindTex(pr, "uScene", 0, scene.t); bindTex(pr, "uB1", 1, lv[0][0].t); bindTex(pr, "uB2", 2, lv[1][0].t); bindTex(pr, "uB3", 3, lv[2][0].t);
      const g = S.grade || {};
      gl.uniform1f(pr.u.uBloom, g.bloom == null ? 0.55 : g.bloom); gl.uniform1f(pr.u.uExpo, g.expo == null ? 1.0 : g.expo);
      gl.uniform1f(pr.u.uSat, g.sat == null ? 1.0 : g.sat); gl.uniform1f(pr.u.uVig, g.vig == null ? 0.38 : g.vig);
      gl.uniform1f(pr.u.uGrain, g.grain == null ? 0.035 : g.grain); gl.uniform1f(pr.u.uFrame, S.frame || 0);
      gl.uniform1f(pr.u.uWarm, S.warm || 0); gl.uniform1f(pr.u.uCool, S.cool || 0); gl.uniform1f(pr.u.uFade, S.fade || 0);
      gl.uniform1f(pr.u.uContrast, g.contrast == null ? 1.04 : g.contrast);
      draw(null, W, H);
    }
    return { ready, render, gl };
  }
  window.GRD = { create, SRC };
})();

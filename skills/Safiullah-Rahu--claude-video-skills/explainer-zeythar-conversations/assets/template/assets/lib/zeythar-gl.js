/* zeythar-gl.js — WebGL2 plate renderer for "Conversations Beyond Time" (Zeythar & the girl).
 *
 * Draws one frame of the key-art plate as layers (inpainted background, Zeythar, the girl) with a gaussian "liquify"
 * warp per layer (Live2D-like controls masked by region maps), the girl's blinks (closed-lid texture + a drawn lash
 * line), gaze (the iris moves inside the eye openings), lip-sync (jaw warp with the hand masked out + a dark mouth
 * interior), Zeythar's voice light (rune-line pulses + medallion), the code-drawn clock (hour + minute hands on the
 * inpainted dial; sky, rings and a dark ledge beyond the plate for the wide layout), point-sprite particles, the
 * holographic layer (orb, morphs, name tag: two 2-D canvases from zeythar-holo.js, composited BEFORE bloom so the
 * hologram glows into the scene), bloom, vignette, grade (warm soften, dawn tint) and grain.
 *
 * ZGL.create(canvas, { base: "assets/plate/", landmarks }) -> { ready: Promise, render(state) }
 * World coordinates are SOURCE pixels of the 1402 x 1122 key art (y down). The state is built by zeythar-film.js.
 */
(function () {
  "use strict";
  const SRC = [1402, 1122];
  const NZ = 8, NL = 20;

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

  // ---------------------------------------------------------------- background: plate bg, sky, rings, clock, ledge
  const FS_BG = COMMON + `
  uniform sampler2D uBg;
  uniform float uBgLod; uniform vec2 uBgOff;
  uniform vec3 uClock;          // minute, hour angle (rad, 0 = 12 o'clock, clockwise), hand glow
  uniform vec2 uClockC;         // hand centre
  uniform vec2 uHandLen;        // hour, minute length
  uniform vec3 uRingC;          // ring centre x, y, outer radius
  uniform vec4 uHole;           // world rect (x0, y0, x1, y1) of the orb / active morph + margin: the hands fade out inside
  uniform float uHoleF;         // its feather (world px)
  uniform vec2 uHandLook;       // hand edge softness (world px, matched to the painted dial's defocus), dim (0..1)
  uniform float uSky;           // 1 = draw the code world beyond the plate (wide layouts)
  uniform float uTime;
  out vec4 o;

  vec3 skyCol(vec2 w) {
    float h = clamp(-w.y / 760.0, 0.0, 1.0);
    vec3 c = mix(vec3(0.11, 0.14, 0.36), vec3(0.03, 0.04, 0.13), pow(h, 0.8));
    float neb = fbm(w * 0.0042 + vec2(3.1, 7.7));
    c += vec3(0.18, 0.09, 0.32) * smoothstep(0.45, 0.85, neb) * 0.55;
    c += vec3(0.05, 0.11, 0.27) * smoothstep(0.5, 0.9, fbm(w * 0.009 + 1.3)) * 0.5;
    vec2 cell = floor(w / 20.0), f = fract(w / 20.0);
    vec2 sp = hash22(cell);
    float d = length(f - sp) * 20.0;
    float br = pow(hash21(cell + 3.7), 9.0) * 1.6 + 0.05;
    float tw = 0.75 + 0.25 * sin(uTime * (1.0 + 2.0 * hash21(cell + 9.1)) + 6.28 * sp.x);
    c += vec3(0.75, 0.82, 1.0) * br * tw * exp(-d * d / 1.5);
    return c;
  }
  // the clock's golden frame continued above the plate: the outer ring with its window panels, a rim, an inner ring,
  // spokes every 30 degrees, numeral blocks
  vec3 rings(vec2 w, vec3 base) {
    vec2 d = w - uRingC.xy; float r = length(d); float R = uRingC.z;
    float ang = atan(d.x, -d.y);
    vec3 gold = vec3(1.0, 0.68, 0.32);
    float band = smoothstep(R - 70.0, R - 58.0, r) * (1.0 - smoothstep(R + 58.0, R + 70.0, r));      // the window band
    float k = ang / (3.14159265 / 36.0); float wd = abs(fract(k) - 0.5) * (3.14159265 / 36.0) * r;   // window mullions
    float win = band * (0.55 + 0.45 * smoothstep(5.0, 9.0, wd)) * (0.8 + 0.2 * fbm(vec2(ang * 30.0, r * 0.02)));
    float edges = exp(-pow((r - (R - 64.0)) / 6.0, 2.0)) + exp(-pow((r - (R + 64.0)) / 7.0, 2.0)) * 0.9;
    float rim2 = exp(-pow((r - (R + 120.0)) / 10.0, 2.0)) * 0.6;
    float inner = exp(-pow((r - (R - 170.0)) / 11.0, 2.0)) * 0.7;
    float ks = ang / (3.14159265 / 6.0); float sd = abs(fract(ks + 0.5) - 0.5) * (3.14159265 / 6.0) * r;
    float spoke = exp(-pow(sd / 9.0, 2.0)) * smoothstep(R - 340.0, R - 300.0, r) * (1.0 - smoothstep(R - 80.0, R - 66.0, r)) * 0.6;
    float g = win * 0.85 + edges + rim2 + inner + spoke;
    vec3 c = base * (1.0 - 0.45 * clamp(g, 0.0, 1.0)) + gold * g * 0.85;
    c += vec3(0.95, 0.50, 0.18) * exp(-pow((r - R) / 150.0, 2.0)) * 0.22;
    return c;
  }
  float handA(vec2 w, float a, float len, float wid, float tail, float soft) {   // soft = edge half-ramp (world px)
    vec2 d = w - uClockC;
    vec2 dir = vec2(sin(a), -cos(a));
    float along = dot(d, dir); float across = dot(d, vec2(-dir.y, dir.x));
    float t = clamp((along + tail) / (len + tail), 0.0, 1.0);
    float ww = wid * mix(1.0, 0.32, t);
    float inA = smoothstep(-tail - soft, -tail + soft, along) * (1.0 - smoothstep(len - soft, len + soft, along));
    // a small diamond near the tip, like the painted hand's pointer
    float tipd = abs(along - len * 0.80) / (len * 0.06) + abs(across) / (wid * 1.6);
    float tk = clamp(soft / (wid * 1.6), 0.15, 0.9);
    float tip = (1.0 - smoothstep(1.0 - tk, 1.0 + tk, tipd)) * (1.0 - 0.35 * smoothstep(0.2, 0.9, tk));
    return max(inA * (1.0 - smoothstep(ww - soft, ww + soft, abs(across))), tip);
  }
  vec3 ledgeCol(vec2 w) {
    float v = clamp((w.y - 1122.0) / 640.0, 0.0, 1.0);
    vec3 c = mix(vec3(0.20, 0.09, 0.06), vec3(0.025, 0.018, 0.03), smoothstep(0.0, 0.7, v));
    c += vec3(0.35, 0.16, 0.07) * fbm(vec2(w.x * 0.004, w.y * 0.006 - uTime * 0.02)) * (1.0 - v) * 0.4;
    vec2 cell = floor(w / 120.0), f = fract(w / 120.0);
    vec2 sp = hash22(cell) * 0.7 + 0.15;
    float d = length(f - sp) * 120.0;
    float rad = 14.0 + 26.0 * hash21(cell + 2.0);
    c += vec3(1.0, 0.62, 0.30) * 0.07 * hash21(cell + 5.0) * smoothstep(rad, rad - 3.0, d) * (1.0 - v * 0.7);
    return c;
  }
  void main() {
    vec2 w = worldAt(gl_FragCoord.xy);
    vec2 wb = w + uBgOff;
    vec3 col;
    vec3 plate = textureLod(uBg, clamp(wb, vec2(0.5), SRC - 0.5) / SRC, uBgLod).rgb;
    if (uSky > 0.5 && wb.y < 50.0) {
      vec3 s = rings(wb, skyCol(wb));
      col = mix(s, plate, smoothstep(-8.0, 50.0, wb.y));
    } else if (uSky > 0.5 && wb.y > 1110.0) {
      col = mix(plate, ledgeCol(wb), smoothstep(1110.0, 1140.0, wb.y));
    } else col = plate;
    if (uSky > 0.5 && (wb.x < 0.0 || wb.x > SRC.x)) col = mix(col, rings(wb, skyCol(wb)) * 0.8, 0.85);
    // code-drawn hands on the inpainted dial (behind the characters)
    // the hands sit IN the painted dial: the same defocus as the plate's clock in this shot (uHandLook.x, world px)
    // and dimmed (uHandLook.y); they fade out inside the orb's / morph's box so they never read as a staff or a pointer
    float soft = uHandLook.x, dim = uHandLook.y;
    vec3 hcol = vec3(1.0, 0.80, 0.50);
    float aH = handA(wb, uClock.y, uHandLen.x, 7.5, 26.0, soft);
    float aM = handA(wb, uClock.x, uHandLen.y, 5.2, 36.0, soft);
    float dc = length(wb - uClockC);
    float hub = 1.0 - smoothstep(12.0 - soft, 12.0 + soft, dc);
    float a = max(max(aH, aM), hub);
    float rx = max(uHole.x - wb.x, wb.x - uHole.z), ry = max(uHole.y - wb.y, wb.y - uHole.w);
    float hole = 1.0 - smoothstep(-uHoleF, 0.0, max(rx, ry));
    float keep = 1.0 - 0.96 * hole;
    a *= keep;
    // a soft dark under-shadow so the gold reads on the bright parts of the dial
    float sh = max(handA(wb + vec2(-2.5, -3.5), uClock.y, uHandLen.x, 9.0, 26.0, soft * 2.0), handA(wb + vec2(-2.5, -3.5), uClock.x, uHandLen.y, 6.5, 36.0, soft * 2.0));
    col *= 1.0 - 0.35 * (1.0 - 0.6 * dim) * sh * keep * (1.0 - a);
    col = mix(col, hcol * (0.85 + 0.5 * uClock.z) * (1.0 - dim), a * mix(0.94, 0.85, dim));
    col += vec3(1.0, 0.62, 0.28) * (aH + aM) * keep * 0.10 * (1.0 + uClock.z) * (1.0 - dim);
    col += vec3(1.0, 0.75, 0.40) * exp(-dc * dc / 60.0) * 0.6 * uClock.z * keep * (1.0 - dim);
    o = vec4(col, 1.0);
  }`;

  // ---------------------------------------------------------------- characters: warps, lids, gaze, mouth, glow, ledge
  const FS_CH = COMMON + `
  uniform sampler2D uZ, uL, uClosed, uLines, uRegZ, uRegL, uRegL2;
  uniform float uCharLod; uniform vec2 uCharOff;
  uniform vec4 uZc[${NZ}]; uniform vec4 uZp[${NZ}]; uniform int uZn;
  uniform vec4 uLc[${NL}]; uniform vec4 uLp[${NL}]; uniform int uLn; uniform int uLnBody;
  uniform float uEyeT[64]; uniform float uEyeLd[64]; uniform float uEyeB[64];
  uniform vec4 uEyeX;           // far x0, x1, near x0, x1
  uniform vec2 uBlink;          // far, near (0 open .. 1 closed)
  uniform float uMouth, uMouthK;   // 0..1 open; interior depth (source px at full open)
  uniform vec4 uMouthLR; uniform vec2 uMouthC;
  uniform vec4 uClosedRect;
  uniform float uLineBase, uMedGlow; uniform vec2 uMed; uniform vec2 uPulse[6];
  uniform float uRim, uTime, uSky, uFg;
  out vec4 o;

  vec2 applyCtl(vec2 p, vec4 c, vec4 q, sampler2D reg, sampler2D reg2) {
    float ty = mod(c.w, 10.0); float ch = floor(c.w / 10.0);
    vec2 d = p - c.xy; float w = exp(-dot(d, d) / (2.0 * c.z * c.z));
    if (ch > 0.5) {
      vec2 uv = clamp(p, vec2(0.5), SRC - 0.5) / SRC;
      if (ch < 4.5) { vec4 rr = textureLod(reg, uv, 0.0); w *= ch < 1.5 ? rr.r : ch < 2.5 ? rr.g : ch < 3.5 ? rr.b : rr.a; }
      else { vec4 rr = textureLod(reg2, uv, 0.0); w *= ch < 5.5 ? rr.r : ch < 6.5 ? rr.g : rr.b; }
    }
    if (ty < 0.5) return p - q.xy * w;
    if (ty < 1.5) { float a = -q.z * w; vec2 r = p - q.xy; return q.xy + vec2(cos(a) * r.x - sin(a) * r.y, sin(a) * r.x + cos(a) * r.y); }
    vec2 r = p - q.xy; vec2 s = 1.0 + (q.zw - 1.0) * w; return q.xy + r / s;
  }
  vec4 tex(sampler2D t, vec2 p, float lod) { return textureLod(t, p / SRC, lod); }
  float eyeArr(int which, int arr, float s) {
    int i0 = int(floor(s)); int i1 = min(i0 + 1, 31); float f = s - float(i0);
    int b = which * 32;
    if (arr == 0) return mix(uEyeT[b + i0], uEyeT[b + i1], f);
    if (arr == 1) return mix(uEyeLd[b + i0], uEyeLd[b + i1], f);
    return mix(uEyeB[b + i0], uEyeB[b + i1], f);
  }
  vec4 lid(vec4 c, vec2 r, int which, float x0, float x1, float b, bool outerLeft, float tone) {
    if (b < 0.002 || r.x < x0 || r.x > x1) return c;
    float s = (r.x - x0) / (x1 - x0) * 31.0;
    float top = eyeArr(which, 0, s), ld = eyeArr(which, 1, s), bt = eyeArr(which, 2, s);
    float edge = ld + b * (bt - ld);
    float on = smoothstep(0.0, 0.07, b);
    float u = (r.x - x0) / (x1 - x0);
    float ends = smoothstep(0.0, 0.10, u) * smoothstep(1.0, 0.90, u);
    vec2 cu = (r - uClosedRect.xy) / (uClosedRect.zw - uClosedRect.xy);
    vec3 skin = textureLod(uClosed, cu, 0.0).rgb;
    if (r.y >= top - 3.0 && r.y <= edge) {
      // a lid: skin, a soft crease shadow near the top, darker toward the lash edge
      float shade = 0.94 - 0.13 * smoothstep(edge - 5.0, edge, r.y) - 0.05 * exp(-pow((r.y - top - 1.5) / 1.4, 2.0));
      float a = on * ends * smoothstep(top - 3.0, top + 0.6, r.y);
      float side = outerLeft ? mix(0.80, 1.0, smoothstep(0.0, 0.75, u)) : mix(1.0, 0.88, smoothstep(0.4, 1.0, u));
      vec3 warmT = outerLeft ? vec3(1.0, 0.86, 0.76) : vec3(1.0);   // the far lid is in warm shadow, not grey
      c.rgb = mix(c.rgb, skin * shade * tone * side * warmT * c.a, a);
    }
    float dist = r.y - edge;
    float outer = outerLeft ? 1.0 - u : u;
    float lw = mix(0.6, 1.5, smoothstep(0.15, 0.95, outer));
    float la = (1.0 - smoothstep(lw * 0.45, lw, abs(dist + 0.25))) * on * smoothstep(0.0, 0.1, u) * smoothstep(1.0, 0.9, u);
    c.rgb = mix(c.rgb, vec3(0.09, 0.04, 0.04) * c.a, la * 0.92);
    if (dist > 0.0 && dist < 3.0) c.rgb *= 1.0 - 0.25 * (1.0 - dist / 3.0) * on * ends;
    return c;
  }
  float mouthY(float x, out float u) {
    vec2 L = uMouthLR.xy, R = uMouthLR.zw;
    u = clamp((x - L.x) / (R.x - L.x), 0.0, 1.0);
    return (1.0 - u) * (1.0 - u) * L.y + 2.0 * u * (1.0 - u) * uMouthC.y + u * u * R.y;
  }
  vec3 ledge(vec2 w, out float a) {
    float top = 1100.0 + 2.5 * sin(w.x * 0.011 + 1.3) + 3.0 * (fbm(vec2(w.x * 0.018, 3.0)) - 0.5);
    a = smoothstep(top - 1.8, top + 1.8, w.y) * (1.0 - smoothstep(top + 220.0, top + 280.0, w.y));
    float n = fbm(w * vec2(0.010, 0.022)), n2 = fbm(w * 0.06 + 4.0);
    vec3 stone = mix(vec3(0.09, 0.07, 0.07), vec3(0.17, 0.12, 0.10), n) * (0.85 + 0.3 * n2);
    float lip = exp(-pow((w.y - top - 4.0) / 4.5, 2.0));
    stone += vec3(1.0, 0.56, 0.26) * lip * (0.42 + 0.08 * uRim);
    float dn = clamp((w.y - top) / 230.0, 0.0, 1.0);
    stone *= mix(1.0, 0.40, smoothstep(0.05, 0.85, dn));
    float bx = (w.x + 37.0 + 60.0 * step(top + 100.0, w.y)) / 210.0;
    float sd = abs(fract(bx) - 0.5) * 210.0;
    float below = smoothstep(top + 9.0, top + 14.0, w.y);
    stone *= 1.0 - 0.38 * (1.0 - smoothstep(0.8, 2.6, sd)) * below;
    stone *= 1.0 - 0.32 * exp(-pow((w.y - top - 100.0) / 1.6, 2.0));
    return stone;
  }
  void main() {
    vec2 w = worldAt(gl_FragCoord.xy) - uCharOff;
    vec4 outc = vec4(0.0);
    // ---- Zeythar
    vec2 pz = w;
    for (int i = 0; i < ${NZ}; i++) { if (i >= uZn) break; pz = applyCtl(pz, uZc[i], uZp[i], uRegZ, uRegZ); }
    vec4 cz = tex(uZ, clamp(pz, vec2(0.5), SRC - 0.5), uCharLod);
    if (pz.x < 0.0 || pz.y < 0.0 || pz.x > SRC.x || pz.y > SRC.y) cz = vec4(0.0);
    if (cz.a > 0.001) {
      vec4 ln = tex(uLines, pz, uCharLod * 0.7);
      float d = length(pz - uMed);
      float pulse = 0.0;
      for (int k = 0; k < 6; k++) { pulse += uPulse[k].y * exp(-pow((d - uPulse[k].x) / 30.0, 2.0)); }
      float glow = ln.r * (uLineBase + pulse * 1.25);
      cz.rgb += vec3(0.25, 0.62, 1.0) * glow * 0.70 * cz.a;
      cz.rgb += vec3(0.32, 0.78, 1.0) * ln.g * uMedGlow * 0.40 * cz.a;
      float warm = max(0.0, cz.r - cz.b) * cz.a;
      cz.rgb += cz.rgb * warm * uRim * 0.30;
    }
    outc = cz;
    // ---- the girl (body controls, then face controls)
    vec2 q = w;
    for (int i = 0; i < ${NL}; i++) { if (i >= uLnBody) break; q = applyCtl(q, uLc[i], uLp[i], uRegL, uRegL2); }
    vec2 r = q;
    for (int i = 0; i < ${NL}; i++) { if (i >= uLn) break; if (i < uLnBody) continue; r = applyCtl(r, uLc[i], uLp[i], uRegL, uRegL2); }
    vec4 cl = tex(uL, clamp(r, vec2(0.5), SRC - 0.5), uCharLod);
    if (r.x < 0.0 || r.y < 0.0 || r.x > SRC.x || r.y > SRC.y) cl = vec4(0.0);
    if (cl.a > 0.001) {
      cl = lid(cl, r, 0, uEyeX.x, uEyeX.y, uBlink.x, true, 0.95);
      cl = lid(cl, r, 1, uEyeX.z, uEyeX.w, uBlink.y, false, 0.97);
      if (uMouth > 0.01) {
        float u; float my = mouthY(q.x, u);
        float taper = pow(max(0.0, sin(3.14159 * clamp((u - 0.04) / 0.92, 0.0, 1.0))), 0.7);
        float up = my - 0.55 * uMouth * taper, lo = my + uMouth * uMouthK * taper;
        float inside = smoothstep(up - 0.6, up + 0.5, q.y) * (1.0 - smoothstep(lo - 0.7, lo + 0.4, q.y)) * smoothstep(0.02, 0.12, taper);
        float depth = clamp((q.y - up) / max(0.5, lo - up), 0.0, 1.0);
        vec3 inner = mix(vec3(0.13, 0.035, 0.04), vec3(0.50, 0.17, 0.17), smoothstep(0.55, 1.0, depth));   // dark mouth, tongue low
        // upper teeth: a soft light band under the upper lip, centre of the mouth only, when it is well open
        float teeth = smoothstep(0.45, 0.85, uMouth) * (1.0 - smoothstep(0.9, 2.2, q.y - up)) * smoothstep(0.35, 0.8, taper) * smoothstep(0.12, 0.3, u) * (1.0 - smoothstep(0.7, 0.88, u));
        inner = mix(inner, vec3(0.90, 0.84, 0.80), teeth * 0.55);
        cl.rgb = mix(cl.rgb, inner * cl.a, inside * 0.9);
      }
      float warm = max(0.0, cl.r - cl.b) * cl.a;
      cl.rgb += cl.rgb * warm * uRim * 0.22;
    }
    outc = cl + outc * (1.0 - cl.a);
    // ---- foreground ledge (wide layouts only)
    if (uFg > 0.5 && uSky > 0.5 && w.y > 1094.0) {
      float pa; vec3 pc = ledge(w + uCharOff * 0.6, pa);
      outc = vec4(pc * pa, pa) + outc * (1.0 - pa);
    }
    o = outc;
  }`;

  // ---------------------------------------------------------------- particles (additive point sprites)
  const VS_PT = `#version 300 es
  in vec4 aP; in vec3 aC;
  uniform vec2 uRes;
  out vec3 vC; out float vI;
  void main() { vec2 c = aP.xy / uRes * 2.0 - 1.0; gl_Position = vec4(c.x, -c.y, 0.0, 1.0); gl_PointSize = aP.z; vC = aC; vI = aP.w; }`;
  const FS_PT = `#version 300 es
  precision highp float; in vec3 vC; in float vI; out vec4 o;
  void main() { vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0; float a = exp(-r * 4.0) + 0.35 * exp(-r * 1.2); o = vec4(vC * a * vI, 0.0); }`;

  // ---------------------------------------------------------------- holo composite, bloom, final
  const FS_HOLO = COMMON + `
  uniform sampler2D uSrc; uniform float uGain; out vec4 o;
  void main() { vec2 uv = vec2(gl_FragCoord.x / uRes.x, 1.0 - gl_FragCoord.y / uRes.y); vec4 c = texture(uSrc, uv); o = vec4(c.rgb * uGain, c.a); }`;
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
  uniform float uBloom, uExpo, uSat, uVig, uGrain, uFrame, uWarm, uDawn, uFade, uContrast;
  out vec4 o;
  vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec3 c = texture(uScene, uv).rgb;
    vec3 b = texture(uB1, uv).rgb * 0.5 + texture(uB2, uv).rgb * 0.8 + texture(uB3, uv).rgb * 1.1;
    c += b * uBloom;
    c *= uExpo;
    c *= mix(vec3(1.0), vec3(1.10, 1.0, 0.88), uWarm);
    c += vec3(0.04, 0.02, 0.0) * uWarm;
    // dawn: a faint warm rose-gold light from her side (screen right), rising
    float side = smoothstep(0.35, 1.05, uv.x) * (0.55 + 0.45 * smoothstep(0.2, 0.9, uv.y));
    c = mix(c, c * vec3(1.16, 1.02, 0.86) + vec3(0.06, 0.03, 0.01), uDawn * side);
    vec3 t = mix(c, aces(c * 1.05), 0.35);
    float l = dot(t, vec3(0.2126, 0.7152, 0.0722));
    t = mix(vec3(l), t, uSat);
    t = (t - 0.5) * uContrast + 0.5;
    vec2 q = uv - 0.5; q.x *= uRes.x / uRes.y;
    float v = 1.0 - uVig * smoothstep(0.25, 0.95, length(q * vec2(1.0, 0.85)) * 1.25);
    t *= v;
    float fr = mod(uFrame, 59.0); float g = hash21(gl_FragCoord.xy * 0.73 + vec2(fr * 13.7, fr * 7.3)) - 0.5;   // small offsets: no float-precision stripes
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
    gl.bindAttribLocation(p, 0, "aPos"); gl.linkProgram(p);
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
      bg: program(gl, VS, FS_BG), ch: program(gl, VS, FS_CH), holo: program(gl, VS, FS_HOLO), bright: program(gl, VS, FS_BRIGHT),
      blur: program(gl, VS, FS_BLUR), fin: program(gl, VS, FS_FINAL),
    };
    const ptProg = (function () {
      const p = gl.createProgram(); gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VS_PT)); gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, FS_PT));
      gl.bindAttribLocation(p, 0, "aP"); gl.bindAttribLocation(p, 1, "aC"); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("pt link: " + gl.getProgramInfoLog(p));
      return { p, uRes: gl.getUniformLocation(p, "uRes") };
    })();
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
    function upload(img, premult, mip, tex) {
      const t = tex || gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
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
      ["bg", files.bg, false, true], ["z", files.zeythar, true, true], ["l", files.girl, true, true], ["closed", files.girl_closed, false, false],
      ["lines", files.lines, false, true], ["regZ", files.regions_zeythar, false, false], ["regL", files.regions_girl, false, false],
      ["regL2", files.regions_girl2, false, false],
    ].map(([k, f, pm, mip]) => loadImage(base + f).then((im) => { T[k] = upload(im, pm, mip); })));
    T.holoAdd = gl.createTexture(); T.holoOver = gl.createTexture();

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
    function holo(canvas, tex, additive, gain) {
      upload(canvas, true, false, tex);
      const pr = P.holo; gl.useProgram(pr.p); gl.uniform2f(pr.u.uRes, W, H); bindTex(pr, "uSrc", 0, tex); gl.uniform1f(pr.u.uGain, gain);
      gl.enable(gl.BLEND);
      if (additive) gl.blendFunc(gl.ONE, gl.ONE); else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      draw(scene, W, H);
      gl.disable(gl.BLEND);
    }

    function render(S) {
      const cam = [S.cam.x, S.cam.y, S.cam.z, S.cam.roll || 0];
      // 1) background
      let pr = P.bg; gl.useProgram(pr.p);
      gl.uniform2f(pr.u.uRes, W, H); gl.uniform4fv(pr.u.uCam, cam);
      bindTex(pr, "uBg", 0, T.bg);
      gl.uniform1f(pr.u.uBgLod, S.bgLod || 0); gl.uniform2fv(pr.u.uBgOff, S.bgOff || [0, 0]);
      gl.uniform3fv(pr.u.uClock, S.clock); gl.uniform2fv(pr.u.uClockC, L.clock.center); gl.uniform2fv(pr.u.uHandLen, [L.clock.hand_hour, L.clock.hand_min]);
      gl.uniform3fv(pr.u.uRingC, S.ringC || [679, 395, 652]); gl.uniform4fv(pr.u.uHole, S.hole || [0, 0, 0, 0]); gl.uniform1f(pr.u.uHoleF, S.holeF || 8);
      gl.uniform2fv(pr.u.uHandLook, S.handLook || [2.8, 0.0]);
      gl.uniform1f(pr.u.uSky, S.sky ? 1 : 0); gl.uniform1f(pr.u.uTime, S.time);
      draw(scene, W, H);
      // 2) particles behind the characters
      gl.bindFramebuffer(gl.FRAMEBUFFER, scene.f); gl.viewport(0, 0, W, H); points(S.ptsBack);
      // 3) characters (premultiplied over)
      pr = P.ch; gl.useProgram(pr.p);
      gl.uniform2f(pr.u.uRes, W, H); gl.uniform4fv(pr.u.uCam, cam);
      bindTex(pr, "uZ", 0, T.z); bindTex(pr, "uL", 1, T.l); bindTex(pr, "uClosed", 2, T.closed); bindTex(pr, "uLines", 3, T.lines);
      bindTex(pr, "uRegZ", 4, T.regZ); bindTex(pr, "uRegL", 5, T.regL); bindTex(pr, "uRegL2", 6, T.regL2);
      gl.uniform1f(pr.u.uCharLod, S.charLod || 0); gl.uniform2fv(pr.u.uCharOff, S.charOff || [0, 0]);
      const [zc, zp] = ctlArrays(S.zCtl, NZ); gl.uniform4fv(pr.u.uZc, zc); gl.uniform4fv(pr.u.uZp, zp); gl.uniform1i(pr.u.uZn, Math.min(NZ, S.zCtl.length));
      const [lc, lp] = ctlArrays(S.lCtl, NL); gl.uniform4fv(pr.u.uLc, lc); gl.uniform4fv(pr.u.uLp, lp);
      gl.uniform1i(pr.u.uLn, Math.min(NL, S.lCtl.length)); gl.uniform1i(pr.u.uLnBody, S.lBody);
      gl.uniform1fv(pr.u.uEyeT, eyeT); gl.uniform1fv(pr.u.uEyeLd, eyeLd); gl.uniform1fv(pr.u.uEyeB, eyeB); gl.uniform4fv(pr.u.uEyeX, eyeX);
      gl.uniform2fv(pr.u.uBlink, S.blink || [0, 0]); gl.uniform1f(pr.u.uMouth, S.mouth || 0); gl.uniform1f(pr.u.uMouthK, S.mouthK || 5.0);
      gl.uniform4fv(pr.u.uMouthLR, [M.left[0], M.left[1], M.right[0], M.right[1]]); gl.uniform2fv(pr.u.uMouthC, mc);
      gl.uniform4fv(pr.u.uClosedRect, cr);
      gl.uniform1f(pr.u.uLineBase, S.lineBase || 0.2); gl.uniform1f(pr.u.uMedGlow, S.medGlow || 0.3); gl.uniform2fv(pr.u.uMed, S.med || L.zeythar.medallion);
      const pu = new Float32Array(12); (S.pulses || []).slice(0, 6).forEach((x, i) => { pu[i * 2] = x[0]; pu[i * 2 + 1] = x[1]; });
      gl.uniform2fv(pr.u.uPulse, pu);
      gl.uniform1f(pr.u.uRim, S.rim || 0); gl.uniform1f(pr.u.uTime, S.time); gl.uniform1f(pr.u.uSky, S.sky ? 1 : 0); gl.uniform1f(pr.u.uFg, S.fg === false ? 0 : 1);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      draw(scene, W, H);
      gl.disable(gl.BLEND);
      // 4) particles in front, then the hologram layer (orb, morphs, name tag)
      gl.bindFramebuffer(gl.FRAMEBUFFER, scene.f); gl.viewport(0, 0, W, H); points(S.ptsFront);
      if (S.holoOver && S.holoOverOn) holo(S.holoOver, T.holoOver, false, 1.0);
      if (S.holoAdd && S.holoAddOn) holo(S.holoAdd, T.holoAdd, true, S.holoGain || 1.0);
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
      gl.uniform1f(pr.u.uBloom, g.bloom == null ? 0.5 : g.bloom); gl.uniform1f(pr.u.uExpo, g.expo == null ? 1.0 : g.expo);
      gl.uniform1f(pr.u.uSat, g.sat == null ? 1.0 : g.sat); gl.uniform1f(pr.u.uVig, g.vig == null ? 0.38 : g.vig);
      gl.uniform1f(pr.u.uGrain, g.grain == null ? 0.032 : g.grain); gl.uniform1f(pr.u.uFrame, S.frame || 0);
      gl.uniform1f(pr.u.uWarm, S.warm || 0); gl.uniform1f(pr.u.uDawn, S.dawn || 0); gl.uniform1f(pr.u.uFade, S.fade || 0);
      gl.uniform1f(pr.u.uContrast, g.contrast == null ? 1.04 : g.contrast);
      draw(null, W, H);
    }
    return { ready, render, gl };
  }
  window.ZGL = { create, SRC };
})();

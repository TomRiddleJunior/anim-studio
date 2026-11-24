# Cookbook: techniques with code

All snippets assume a scene class (engine.md §4) with `const { renderer, comp, lyrics, audio: au } = this.ctx`,
`f: Frame`, `t = f.t`, and imports from `../engine/*` and `./_kit`. The starter scenes contain complete versions.

## Contents
1. Karaoke line (fit, wrap, wipe) · 2. Glyph choreography · 3. Text on a path · 4. Pen writing ·
5. Text made of atoms · 6. Beat choreography · 7. Custom transitions · 8. Engraved shading in GLSL ·
9. 3D worlds · 10. Paper plates · 11. Instruments and counters · 12. Sparks and emitters ·
13. Audio reactivity with taste · 14. Porting outside three.js / shader code

## 1. Karaoke line
```ts
// init(): lay out every line this window owns once
this.P = plate(!!this.ctx.params.invert);
this.fam = F.display(100, 800);
for (const l of lyrics.linesStartingIn(this.ctx.start - 0.35, this.ctx.end))
  this.flows.set(l.i, fitWords(l.words, this.fam, W - 2 * SAFE, 520, { max: 170, maxRows: 3, text: (w) => styleCase(w.w) }));
// render(): the featured line, words wiped glyph by glyph, the sung word in the accent
const l = featuredLine(lyrics, t, this.ctx.start, this.ctx.end, 0.45, 0.9);
if (l) {
  const fl = this.flows.get(l.i)!, x0 = SAFE, y0 = H / 2 - fl.height / 2 + fl.size * 0.74;
  const cur = activeWord(l, t);
  fl.boxes.forEach((b, i) => drawWord(c, b.text, this.fam, fl.size, x0 + b.x, y0 + b.y,
    Lyrics.wordProgress(b.word, t), i === cur && t < b.word.end ? rgba('accent') : this.P.inkA(1), this.P.faint));
}
```
Legato lines: hand the slot over on the new line's first word, never before the old line's last word ends
(`lines.ts → slot()`), or put the next line elsewhere (a cue rail).

## 2. Glyph choreography (per-letter motion with kerning intact)
```ts
const lay = layout(text, fam, size);                 // kerned x per glyph
lay.glyphs.forEach((g, k) => {
  const e = ease.outExpo(clamp((t - t0 - k * 0.028) / 0.42));   // stagger 28 ms per glyph
  c.fillText(g.ch, x + g.x, baseline + (1 - e) * size);          // rise from below (clip the row first)
});
```
Split a word into sung/unsung pieces with `glyphX(text, i, fam, size)` for the second piece's x.
Width/weight expression: `F.display(lerp(125, 62, pressure), lerp(300, 900, pressure))` picks the nearest static
face (only varies if `F.widths('display').length > 1`).

## 3. Text on a path
```ts
const pts = Array.from({ length: 97 }, (_, i) => { const x = (W * i) / 96; return { x, y: path(x, t) }; });
const Ls = polylineLengths(pts), s0 = (Ls[Ls.length - 1]! - lay.width) / 2;
lay.glyphs.forEach((g) => {
  const p = pointAtLength(pts, Ls, s0 + g.x + g.w / 2);
  c.save(); c.translate(p.x, p.y); c.rotate(p.angle); c.fillText(g.ch, -g.w / 2, 0); c.restore();
});
```
Ride a smoothed version of a busy curve (its fundamental) so the text stays readable (`wave.ts`).

## 4. Pen writing, synced to the voice
```ts
const st = strokeText(line.text, 'script', 150);            // polylines + char ranges (optical kerning)
const times = Lyrics.charTimes(line);                       // [start, end] per character
// render():
const len = writtenLength(st, times, t);
c.save(); c.translate(x, y); c.lineWidth = 3; c.lineCap = c.lineJoin = 'round'; c.strokeStyle = P.inkA(1);
const head = drawStrokeText(c, st, len);                    // returns the pen position
c.restore();
if (head) motifHead(lb, P, x + head.x, y + head.y, t);     // the motif is the pen
```

## 5. Text made of atoms
Homes from `textPoints(word, fam, size, step)`, a hashed scatter position per point, and a spring driven by the
word's start: `k = springStep(t - (w.start - 0.12), 2.2, 0.55)`, `pos = scatter + (home - scatter) * k`. Drift
while scattered with analytic noise (`fbm2(x, y + t * 0.07)`), never integrated state. Release on the next line
(`particles.ts`). 5–20 k points per line are fine in a LineBatch (`seg2(x, y, x + 0.01, y, 2.2, rgb, a)` = a dot).

## 6. Beat choreography
```ts
const db = au.timeOfBar(Math.floor(f.bar + 1e-4));              // this bar's downbeat
return { zoom: 1 + 0.012 * pulse(t, db, 0.1) };                  // punch-in on the downbeat
const travel = (tt: number) => { const b = au.beatAt(tt), i = Math.floor(b);   // hold, then snap into each beat
  return i + ease.inOutCubic(clamp((b - i - 0.55) / 0.45)); };
const kicks = au.events('kick', this.ctx.start, this.ctx.end).map(([k]) => k);  // precompute in init()
const lastKick = kicks.filter((k) => k <= t).pop() ?? -9;          // …and count/pulse on them
const shake = 12 * pulse(t, lastKick, 0.06);
return { shake: [shake * (hash(frameIdx(t), 1) - 0.5) * 2, shake * (hash(frameIdx(t), 2) - 0.5) * 2], flash: 0.2 * f.a.snare };
const k = keys(t, [[t0, 0], [t0 + 0.35, 1, ease.inOutExpo], [t1, 1], [t1 + 0.2, 0, ease.inCubic]]); // keyframed move
const beatLen = 60 / au.bpm, tt = t < t0 ? t : t0 + ((t - t0) % beatLen);   // stutter: render the first beat again and again
```
Anchor moments to lyrics, not seconds: `const w = lyrics.get('hold the line').words[1]; const tDrop = w.start;`.

## 7. Custom transitions (the previous plate under this one)
```ts
override handlesTransition = true;       // engine stops crossfading; overlap the windows in timeline.ts
render(f: Frame, out) {
  // …render this plate into out…
  if (f.under && f.tin < 1) {            // f.tin: 0→1 across the overlap
    comp.draw(renderer, f.under, out, { opacity: 1 - ease.inCubic(f.tin), scale: [1 + f.tin * 0.2, 1 + f.tin * 0.2] });
  }
}
```
Prefer hard cuts with continuity (the motif ends where the next plate starts it) over dissolves.

## 8. Engraved shading in GLSL
```ts
this.globe = new FSPass(/* glsl */ `
  uniform float t; uniform vec2 L;
  void main() {
    vec2 p = (FRAG_PX - vec2(960.0, 540.0)) / 360.0;        // logical px → unit disc
    float r = length(p);
    vec3 col = C_BG;
    if (r < 1.0) {
      vec3 n = vec3(p.x, -p.y, sqrt(1.0 - r * r));
      float lit = sat(dot(n, normalize(vec3(L, 0.8))));
      // hatching = ink: on paper dense lines darken; in the dark, lines are light, so lit areas get more lines
      float shade = DARK ? lit : 1.0 - lit;
      float ink = engrave(FRAG_PX / 7.0, shade, 1.0, 0.6) * aaFill(r - 1.0);
      col = mix(C_BG, C_FG, ink);
    }
    fragColor = vec4(col, 1.0);
  }`, { t: { value: 0 }, L: { value: new THREE.Vector2(-0.5, 0.4) } });
```
Raymarched objects: march an SDF, compute the normal and a light, then shade with `hatch()` along a surface
parameter (follow the form) rather than screen space; draw silhouettes with `pxLine(abs(d)/fwidth(d), 0.5, 1.5)`.
Heavy raymarching: render into `makeRT(W / 2, H / 2)` and composite (`comp.draw(renderer, rt.texture, out)`), or
supersample with `SS_TAP` (gl.ts). Keep to the palette (`C_*`), linear colour, HDR only for the accent.

## 9. 3D worlds
Lines in 3D (cheap, crisp, stylish): `new LineBatch(20000, { screen2D: false, blend: P.lineBlend })`,
`lb.seg(ax, ay, az, bx, by, bz, widthPx, r, g, b, a)`, `lb.render(renderer, out, camera)` (tunnel.ts). Project
a 3D point to place 2D type: `v.set(x, y, z).project(cam)` → `((v.x + 1) / 2 * W, (1 - v.y) / 2 * H)`.
Meshes: a `THREE.Scene` with `ShaderMaterial`s (prepend `GLSL_COMMON` to your fragment shader to get the palette),
then `clearRT(renderer, out, LIN.bg); renderer.setRenderTarget(out); renderer.render(scene3, cam);` — targets are
linear HDR with a depth buffer; the engine has `autoClear = false`, so clear yourself. Camera paths as functions of
t (`keys`, `travel`, splines) — never integrate velocity across frames.

## 10. Paper plates
`const P = plate(true)` swaps ground and ink for this plate (bone paper with ink lines in a dark video, or the
reverse); draw with `P.inkA()`, `P.faint`, `P.lineBlend` ('normal' on paper: ink, no glow) and return
`{ paper: 1, bloom: 0.2, bloomThreshold: 1.3 }` for light plates. Paper texture: `Ground` with `hatch` > 0, or an
FSPass with `fbm` fibres; stamps: accent `fillText` at a small rotation with a noise mask (`destination-out` specks).

## 11. Instruments and counters
Readouts, meters, odometers and labels are where a video's voice lives. Mono (`F.mono`), small, letter-spaced
(`label()`), hairline tick bars (`hair()`), numbers from data (`au.bpm`, `timecode(t)`, bar/beat counters,
envelope values). A number that "rolls" to a new value: `lerp(a, b, ease.outExpo(clamp((t - tHit) / 0.9)))`,
with `v.toFixed(2)` and per-digit vertical offsets for an odometer. Deadpan footnotes beat decoration.

## 12. Sparks and emitters
Particles born on a fixed clock with hashed properties, positions as closed-form functions of age:
`motifSparks(lb, P, t, (tb) => headPositionAt(tb), { rate: 80, life: 0.45 })` (_kit.ts). The head position is a
function of the birth time, so each particle keeps its identity in every motion-blur sub-frame. A time-varying rate:
emit on the max rate's clock and thin by `hash(n) * rateMax < rate(tb)`.

## 13. Audio reactivity with taste
Pick one or two couplings per plate and make them structural (the camera steps on beats, a counter ticks on kicks,
the trace amplitude follows `low`), not everything throbbing with `rms`. Envelopes (`f.a.low`, `.vocal`, `.drums`)
for continuous motion; onsets (`f.a.kick`, `.snare`, `au.events`) for events; the lyric for meaning. Silence
matters: let a plate hold still when the band drops out (`f.a.drums < 0.05`).

## 14. Porting outside three.js / shader code (ThreeUI, Shadertoy, CodePen)
Useful as starting points (references/inspiration.md), but they assume a live loop. To port: replace the clock
(`clock.getElapsedTime()`, `performance.now()`, `iTime`) with `f.t` or the plate's local time `f.lt`; replace
`Math.random()` with `mulberry32(seed)` / `hash(i, …)` in `init()`; remove `requestAnimationFrame`, the renderer
creation and resize handlers (use `this.ctx.renderer` and render into `out`); convert colours to palette roles
(linear: `LIN.x`, GLSL `C_X`); replace any integration/feedback (`position += velocity`) with closed-form motion;
Shadertoy: `iResolution` → `vec2(1920, 1080)` with `FRAG_PX`, `fragCoord` → `FRAG_PX` (y up), `mainImage` →
`main` writing `fragColor`; dispose geometries/materials in `dispose()`. Credit the source if its licence asks.

# Engine guide (for scene authors)

The video is a web app (`app/`: TypeScript + three.js, run with Node + Vite) that renders any song time `t`
deterministically at 1920×1080 logical px (or 3840×2160 with `--scale 2`). The same code drives the live
preview and the offline 60 fps export. Derived from mexicat/pdoom-video (MIT); generalized so the palette,
fonts and post-processing come from the project's `style.json` and the song from `song.json`.

## Contents
1. Running things
2. Project layout
3. Data: lyrics and audio
4. Writing a scene (template + rules)
5. Toolbox (gl, lines, type, stroke, karaoke, edit, util, _kit)
6. Style: palette roles, polarity, post
7. Typography rules
8. Output scale (4K)
9. Motion blur and sampling
10. Performance

## 1. Running things

All commands from `<project>/app`:

- Preview (dev server with hot reload): `npx vite --port 5173` → http://localhost:5173/?t=23.0
  (space play/pause, ←/→ ±1 s, shift ±5 s, `,`/`.` ±1 frame, `[`/`]` previous/next timeline entry,
  `l` loop the entry, `h` hide the UI). In Claude Code you can open it with the Browser pane tools.
- **Stills — the main way to check your work; then LOOK at the PNGs with the Read tool:**
  `node scripts/render.mjs stills --t 12.5,13.0,14.2 --only verse1 --out ../out/wip/verse1`
- One still per timeline entry: `node scripts/render.mjs stills --entries --out ../out/wip/entries`
- Storyboard (one frame per entry on one sheet): `node scripts/render.mjs sheet --entries --cols 5 --out ../out/wip/board.png`
- Contact sheet of a range: `node scripts/render.mjs sheet --from 1.5 --to 9 --n 16 --cols 4 --only verse1 --out ../out/wip/v1.png`
- Frames around every cut: `node scripts/render.mjs sheet --cuts --out ../out/wip/cuts.png`
- Short clip (judge motion): `node scripts/render.mjs video --from 20 --to 25 --only chorus1 --samples 4 --preset veryfast --out ../out/wip/c1.mp4`
- `--only a,b` loads only those timeline entries (fast; isolates you from other broken scenes). Without a
  matching entry nothing renders (the ground colour), so the entry must exist in `src/timeline.ts`.
- Typecheck: `npx tsc --noEmit -p tsconfig.json` (fast; do it after every scene edit).
- The render script prints `SCENE ERRORS` (a scene that threw in init/render renders dark red) and a
  `BROWSER LOG` (console errors, HTTP 404s such as a missing font) — read them.
- GPU check: `node scripts/render.mjs gpu` must name your GPU (ANGLE D3D11 / Metal / Vulkan), not SwiftShader.

## 2. Project layout

```
<project>/
  song.json            title, artist, audio path, lyrics path, language, credits, fps
  style.json           palette roles, font families, post defaults, type case, motif, per-scene defaults, idiom
  audio/<song>         the song (mp3/wav/m4a/flac)
  lyrics/lyrics.txt    one sung line per line, [Section] tags; pron.json / fixes.json (optional)
  data/lyrics.json     word timings (from gmv.py analyze)        data/audio.json  beats, sections, envelopes, onsets
  analysis/qa/         alignment report + QA plots to look at
  docs/TREATMENT.md    the concept / style bible / plate list (you write it)
  app/src/timeline.ts  the edit (gmv.py plan writes a first cut)
  app/src/scenes/*.ts  one module per plate; _kit.ts shared helpers
  app/src/engine/*     the engine (rarely edited)
  app/public/fonts/    static font faces + fonts.json (gmv.py fonts)
  out/                 renders
```

## 3. Data

- `lyrics` (`engine/lyrics.ts`): `lines[]` with `text, start, end, words[], section?`; each word
  `{w, start, end, conf, syl?}` (word-level; `syl` = per-letter/compound-part timings for acronyms and
  hyphenated words). **Find lines by content, never hard-code times:** `const l = this.ctx.lyrics.get('hold the line')`,
  `l.words[3].start`, `lyrics.get('eyes open', 2)` for the third occurrence.
  Helpers: `Lyrics.wordProgress(word, t)` (0..1 sung progress, syllable-aware), `Lyrics.lineCharProgress(line, t)`
  (chars sung so far, for per-glyph wipes), `Lyrics.charTimes(line)` (per-char [start,end] for stroke writing),
  `lyrics.findWords('love')`, `lyrics.linesStartingIn(t0, t1)` (the lines a window owns), `lineAt`, `lastLine`, `nextLine`.
- `audio` (`engine/audio.ts`): `beats[]`, `downbeats[]`, `sections[] {name,start,end}`, `bpm`, `meter`, `key`,
  `beatAt(t)` (continuous beat index), `barAt(t)`, `timeOfBeat(i)`, `timeOfBar(k)`, `nearestBeat(t)`,
  `events('kick'|'snare'|'hat'|'vocal', t0, t1)` → `[time, strength][]`, `env(name, t)` for
  `rms|low|mid|high|vocal|drums|bass|other` (0..1), `envPeak`, `hit(kind, t, halfLife)` decaying pulses, `section(t)`.
- Every `Frame` carries `f.a` = `{rms,low,mid,high,vocal,drums,bass,other,kick,snare,hat,vonset}`,
  `f.beat, f.bar, f.beatPhase, f.barPhase`, `f.lt` (local time), `f.p` (0..1 through the window).
- `this.ctx.song` = song.json (title, artist, credits…); `this.ctx.params` = the timeline entry's params.

## 4. Writing a scene

One file `app/src/scenes/<name>.ts` default-exporting a class extending `Scene` (`engine/scene.ts`), plus
helper files `scenes/<name>-*.ts` if it grows. Register it in `src/timeline.ts` with `E(id, '<name>', start, end, {params})`.

```ts
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba, STYLE } from '../engine/palette';
import { F, font } from '../engine/type';
import { Lyrics, type Line } from '../engine/lyrics';
import { SAFE, featuredLine, fitWords, drawWord, activeWord } from '../engine/karaoke';
import { Ground, plate, label, type Plate } from './_kit';

export default class MyPlate extends Scene {
  bg = new FSPass(`uniform float t, kick; void main(){ fragColor = vec4(C_BG * (1.0 + 0.2 * kick), 1.0); }`, { t: { value: 0 }, kick: { value: 0 } });
  text = new Layer2D();
  P!: Plate;
  lines: Line[] = [];
  override init() {                       // build geometry, precompute layouts/outlines (async allowed)
    this.P = plate(!!this.ctx.params.invert);
    this.lines = this.ctx.lyrics.linesStartingIn(this.ctx.start - 0.35, this.ctx.end);
  }
  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, lyrics } = this.ctx;
    this.bg.u.t!.value = f.t; this.bg.u.kick!.value = f.a.kick;
    this.bg.render(renderer, out);        // fullscreen shader → out (overwrites it)
    const c = this.text.ctx; this.text.clear();
    const l = featuredLine(lyrics, f.t, this.ctx.start, this.ctx.end);
    if (l) { /* lay out with fitWords, draw each word with drawWord(…, Lyrics.wordProgress(w, f.t), …) */ }
    comp.draw(renderer, this.text.upload(), out); // alpha-over onto out
    return { zoom: 1 + 0.01 * f.a.kick };           // post overrides (optional)
  }
}
```

Rules:

- **Deterministic**: output must be a pure function of `f.t` (and seeded randomness: `mulberry32(seed)`,
  `hash(...)`, `noise1/2/3`, `fbm1/2`). Never `Math.random()`, `Date.now()`, `performance.now()` for visuals.
  The export averages many sub-frames per frame, rendered out of order. If you truly need simulation state
  (particles with forces, feedback buffers) set `stateful = true`, reset in `reset()`, integrate with `f.dt`;
  the engine fast-forwards after seeks, but such a scene can only be exported with a fixed `--samples N`.
  Prefer analytic motion (positions as functions of t) — see the particles starter scene.
- `render()` must fully overwrite `out` (a HalfFloat linear-HDR target). Colours are **linear**; in dark styles
  values > ~1 bloom (bloomThreshold 1.0 by default), so fg type (~0.85) stays crisp and the accent glows only
  when pushed (`glow('accent', 2.5)`). Use palette roles: GLSL `C_BG, C_BG2, C_DIM, C_MID, C_FG, C_ACCENT,
  C_HOT, C_DEEP, C_RARE` (+ extras), TS `LIN.accent`, Canvas2D `rgba('accent', a)`.
- A window owns the lyric lines that START inside it (`linesStartingIn(start - 0.35, end)`); it must render every
  one of them readably and in sync (the plan never cuts inside a line; don't either).
- `ctx.params` holds the timeline entry's params (one module can serve several entries: `slam` n=1..4).
  Also merge the style's defaults: `Object.assign(this.o, STYLE.scenes?.myplate ?? {}, params)`.
- Transitions: by default the engine crossfades overlapping entries. Most cuts should be **hard cuts on the
  beat before a line / on downbeats** (windows that touch, the default from `plan`). For custom transitions set
  `handlesTransition = true` and composite `f.under` (the previous scene's frame) yourself using `f.tin` (0→1).
- Post overrides you can return: `exposure, bloom, bloomThreshold, bloomKnee, bloomRadius, halation, ca, grain,
  vignette, hud, frame (crop marks 0..1), paper (HUD ink for light plates), fade, flash, shake:[x,y], zoom,
  invert`. Never return `undefined` values (build the object conditionally). Defaults: `engine/post.ts` + style.json.
- Performance: aim for < 25 ms/frame at 1080p. Canvas2D layers cost ~2–4 ms to upload each; don't use more than
  2–3 per scene. Precompute layouts, outlines and point sets in `init()`.

## 5. Toolbox

- `gl.ts`: `FSPass(frag, uniforms)` fullscreen GLSL3 pass (has `vUv`, writes `fragColor`, gets `GLSL_COMMON`),
  `this.ctx.comp.draw(renderer, tex, target, {mode:'normal'|'add'|'screen'|'multiply'|'max'|'replace', opacity, tint, scale, offset})`,
  `Layer2D` (1920×1080 logical Canvas2D → sRGB texture; `new Layer2D(w, h, 1)` for a deliberately low-res layer),
  `makeRT()` / `makeRT(w, h)` (HDR target in logical px), `clearRT(renderer, rt, [r,g,b])`, `SCALE/PW/PH`, `SS_TAP`.
- `glsl/common.ts` (`GLSL_COMMON`): palette consts, `DARK`, hashes, `snoise(vec2|vec3)`, `fbm`, `curl2`, 2D/3D SDFs,
  `smin/smax`, `aaFill`, `aaStroke`, `pxLine`, `rampLine`, **`hatch(u, darkness)` and `engrave(uv, darkness, freq, angle)`**
  for engraving-style shading, `heat(x)` accent ramp, `inkOver`, `toSRGB/toLinear`.
- `lines.ts`: `LineBatch(capacity, {screen2D, worldWidth, blend:'add'|'max'|'normal'})` — GPU capsule segments,
  2D pixels (y down) or 3D with a camera (`screen2D:false`, then `render(renderer, out, camera)`). `seg2`, `seg`,
  `polyline`. Colours linear, can exceed 1 for glow. 10k–200k segments per frame is fine. Use `blend: P.lineBlend`
  (additive on dark grounds, normal ink on paper).
- `type.ts`: fonts from `public/fonts/fonts.json`. `F.display(width 50–150, weight 100–900)` (the lyric voice; the
  nearest static instance — width only varies if the family has a width axis: check `F.widths('display')`),
  `F.displayItalic()`, `F.text(weight, italic)` (the rare second register), `F.mono(weight, italic)` (machine/UI voice),
  `F.has(role)`. `font(family, px)` → CSS font string. `metrics(family)` → `{cap, x, ascent, descent}` in em.
  `layout(text, family, size, tracking)` → per-glyph x/advance with kerning (draw glyph i at `glyphs[i].x`),
  `glyphX(text, i, family, size)` (where text[i..] starts when drawing a word in pieces — never `measure(text.slice(0,i))`),
  `fitSize`, `measure`, `textPath2D` (outline Path2D), `textPathCommands`, `textPoints(text, family, size, step)`
  ("text made of atoms"), `smart(s)` / `plain(s)` (typographic ↔ typewriter quotes).
- `stroke.ts`: single-stroke plotter/engraving fonts (`script`, `hscript`, `sans`, `readable`, `tech`, `serif`,
  `osmotron`, `felix`): `strokeText(text, font, size)`, `drawStrokeText(ctx2d, st, lengthPx)` → pen head position,
  `writtenLength(st, Lyrics.charTimes(line), t)` to sync writing to word timings. Optical kerning built in.
- `karaoke.ts`: `SAFE` (96 px title-safe margin), `featuredLine(lyrics, t, t0, t1, pre, hold)`, `visibleLines`,
  `flowWords(words, family, size, maxWidth, {align, lineHeight, text, balance})` (balanced wrapping → word boxes),
  `fitWords(words, family, maxW, maxH, {max, maxRows})` (largest size that fits), `drawWord(ctx, text, family, size, x, y,
  progress, sungColour, unsungColour, 'glyph'|'clip'|'word')` (kerned wipe), `lineVis`, `activeWord`, `wordHit`, `held`, `snapIn`.
- `edit.ts` (timeline only): `cut(q, nth)` = the beat at/before the first word of the nth line containing q;
  `cutLine(i)`, `after(q, nth)` = first downbeat after that line ends, `section(name, nth)`, `bar(k)`,
  `downbeat(t)`, `beat(t)`, `E(id, sceneFile, start, end, {params, post, caption, maxSamples})`.
- `util.ts`: `clamp, lerp, remap, smoothstep, ease.*, prog(x,a,b,ease), keys(t, [[t,v,ease],…]), springStep, pulse,
  mulberry32, hash, frameIdx, noise1/2/3, fbm1/2, polylineLengths, pointAtLength, window01`.
- `scenes/_kit.ts`: `plate(invert)` → colour roles for this plate (`ground, ink, light, inkA(a), faint, lineBlend`),
  `Ground` (background pass: mottle, engraved hatch field, hairline grid, kick lift), `label()` (mono annotation),
  `timecode`, `hair()` (crisp hairline), `motifHead` / `motifSparks` (the running motif: a point of light on dark
  plates, an ink dot on paper).
- `hud.ts`: crop-mark frame (`post.frame`, off by default; use at the bookends) and optional plate captions
  (`caption: {fig, text}` on a timeline entry).

## 6. Style: palette roles, polarity, post

`style.json` defines roles, not hues: `bg` (ground), `bg2`, `dim`, `mid`, `fg` (type/ink), `accent` (the one signal
colour), `hot`, `deep`, `rare` (+ extras). `DARK` (palette.ts / GLSL) says whether bg is darker than fg. Write scenes
against roles and `plate()` so they work in both polarities: dark plates light things up (additive glow, bloom);
paper plates put ink down (normal blending, no glow, hatching for shade). `plate(true)` inverts one plate (a paper
plate in a dark video) — the accent stays the accent. Post defaults come from style.json `post` (light styles get
lower bloom, threshold > 1). See references/styles.md.

## 7. Typography rules

- Proportional text gets the font's kerning: whole strings through Canvas2D get it for free; glyph-by-glyph drawing
  must use `layout()` / `glyphX()`. Adjacent runs in different fonts or sizes have no kerning between them: set that
  gap by eye.
- Lyrics come with typographic punctuation (`don’t`, `’cause`, `“Just`): `Word.w` and `Line.text` go through `smart()`;
  `lyrics.get()` matches straight or curly quotes. Hard-coded display strings use ’ “ ” … – — × − too. Mono UI text
  keeps typewriter quotes where it shows typed input (`plain()`).
- No outlined or haloed type; no glyphs from outside the project's font families (draw missing symbols).
- Keep lyric text inside the title-safe area (≥ 96 px from the edges) unless the plate is deliberately breaking it.

## 8. Output scale (4K)

`--scale 2` renders a true 3840×2160 frame. Scenes keep laying out in logical 1920×1080 px (`W`, `H` never change):
render targets from `makeRT()` and `Layer2D` backing canvases are physical; LineBatch widths stay logical;
in GLSL use `FRAG_PX` (not `gl_FragCoord.xy`) with logical sizes, and `pxLine`/`rampLine` for fwidth hairlines
(`hatch`, `engrave`, `aaStroke` already do). Offscreen canvases you create yourself: make them `SCALE`× larger.
Check a scene at both scales: downscaled, the 4K frame must look like the 1080p one, only sharper.

## 9. Motion blur and sampling

The export renders each frame as the average of sub-frames over the shutter (`--shutter 0.2` = a fifth of the
frame, centred on the frame's time). `--samples N` is fixed; `--samples auto` steps 4 → 12 → 36 → 108 → 324 per
frame until more sub-frames change the image by less than `--tol` levels (default 3): still frames stop at 12,
camera moves at 36, whips/slams at 108–324. What this asks of scenes:

- Output depends on `f.t` only (sub-frames are out of order). Nothing may count `render()` calls.
- Per-frame flicker/jitter keyed to 60 fps uses `frameIdx(t)`, never `Math.floor(t * 60)` (which double-exposes).
- Noise seeded by continuous t is resampled every sub-frame and slows convergence: seed with `frameIdx(t)` unless
  it should smooth out. Cap a noisy entry with `maxSamples: 108` in the timeline.
- Particle emitters with time-varying rates pass the rate as a function of birth time (see `motifSparks`).
- Shaders that supersample internally use `SS_TAP` (see gl.ts) so each sub-frame takes one tap.
- Post parameters (shake, flash, zoom, fades) are read once per frame (1/8 into the shutter).

## 10. Performance

Aim < 25 ms/frame at 1080p for 1 sample (`node scripts/render.mjs perf --from 20 --to 25 --only id`). The final
export multiplies that by the sub-frame count (auto: typically ×12–36), so a 3-minute song at ~30 ms/frame and ~24
sub-frames on average renders in roughly 1–2 h at 1080p; 4K ~3–4× longer. Cheap wins: fewer Canvas2D layers, cache
layouts/Path2Ds, LineBatch instead of Canvas strokes for thousands of lines, raymarch at half resolution into a
`makeRT(W/2, H/2)` and upsample, cap `maxSamples` where noise converges slowly.

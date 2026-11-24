# map-films engine

A code-only map-explainer engine in the Johnny Harris / RealLifeLore look: real Sentinel-2 satellite close-ups over
a drawn navy sea, a vintage paper map for everything wider, a boiling red marker on top, physical paper callouts,
one continuous camera. One HTML canvas page renders every frame as a pure function of time; Python tools fetch the
imagery, record and time the voice, synthesize the sound and render through headless Edge.

A new film needs only two files: `<slug>/story.js` and `<slug>/script.json`. The first film is `diomede/`.

```
map-films/
  _vendor/            d3 7.9, topojson-client 3.1, world-atlas 2.0.2, NE geographic lines, fonts, tiles/2016/ (cache)
  engine/
    film.html         the page: film.html?story=<slug>&fmt=16x9|9x16[&t=12.5]
    js/core.js        math, easing, the pop spring, seeded noise, word keys (MF.Timing)
    js/geo.js         rotated d3 mercator in world units, atlas → Path2D, paper tile pyramid, map labels
    js/sat.js         masked satellite mosaics over the navy sea + teal halo, cross-faded by zoom
    js/ink.js         boiling marker strokes, circles, scribbles, handwriting
    js/props.js       paper props: Tag, CountTag, Strip, Calendar, Stamp, Tracker, EndCard, SwimPath
    js/film.js        camera, story compiler, subframe renderer, WebGL accumulation, post, HUD, window.__mf
    data/*.js         vendor JSON wrapped as JS globals (vendor.py)
    assets/           paper.png, grain.png (textures.py)
    audio/kit.py      synthesized SFX + music bed (numpy)
    tools/*.py        the pipeline (below)
  <slug>/
    story.js script.json      the two files you write
    vo/   tiles/   audio/   out/   out/qa/     generated
```

## Pipeline (every command)

Python = anaconda `python` (numpy 1.26.4 pinned: never let pip upgrade it). Kokoro = `"$HOME/.generative-music-video/venv/Scripts/python.exe"`.
Run from `map-films`.

| step | command | writes |
|---|---|---|
| 0 once | `python -I engine/tools/vendor.py` · `python -I engine/tools/textures.py` | `engine/data/*.js`, `engine/assets/*.png` |
| 1 imagery | `python -I engine/tools/satellite.py <slug> [--dry-run]` | `_vendor/tiles/2016/…`, `<slug>/tiles/z*_land.png, z*_halo.png, z*_check.jpg, mosaics.js` |
| 2 stub times | `python -I engine/tools/stub.py <slug>` (2.9 words/s, 0.2 s pauses) | `<slug>/vo/timing.js` (build the picture before any voice) |
| 3 names | `<kokoro> -I engine/tools/phonemes.py "Diomede" "[Diomede](/dˈIəmˌid/)"` (`--say <slug> …` writes test wavs) | prints misaki phonemes |
| 4 voice | `<kokoro> -I engine/tools/voice.py <slug>` | `vo/lines/*.wav`, `vo/vo.wav` (48 k), `vo/joined.json` |
| 5 word times | `python -I engine/tools/align.py <slug>` | `vo/timing.js/.json`, `vo/whisper.json`; prints a per-line whisper check |
| 6 look | `python -I engine/tools/render.py <slug> --fmt 16x9 --sheet 30` (also `--stills a,b,c`, `--beats`, `--crop t:x,y,w,h`, `--samples N`) | `out/qa/sheet_*.jpg`, stills, crops |
| 7 sound | `python -I engine/tools/mix.py <slug>` | `audio/final.wav` (-14 LUFS), `bed.wav`, `sfx.wav`, `cues.json`; prints the gates |
| 8 render | `bash engine/tools/render_locked.sh <slug> 16x9 9x16 --workers 3` (wraps `render.py <slug> --fmt F --video`) | `out/<slug>_16x9.mp4`, `out/<slug>_9x16.mp4` |
| 9 QA | `python -I engine/tools/qa.py <slug> --fmt 16x9 --frames 1.5,20,39.9` | `out/qa/sweep_*_a/b.jpg`, `mp4_*.png`, `qa_*.json` |

`render.py --cues` prints the SFX cue list the page compiled. `kit.py` run directly writes `engine/audio/kit/*.wav` previews.
Full renders must hold the shared lock (`render_locked.sh` does: it waits while `map-films/.render-lock` exists,
`mkdir`s it per format and `rmdir`s after). Run them in the background. The PC renders on the integrated GPU:
≈ 0.5 s per frame per worker with 8 blur samples, 1–1.5 s on fast zooms (up to 40 samples), a few seconds when a
worker first renders a paper-map zoom level.

Voice: this engine uses the PyTorch **Kokoro-82M v1.0** install (same model and voices as kokoro-onnx, misaki G2P)
instead of kokoro-onnx. Music and SFX are synthesized in numpy (`engine/audio/kit.py`): nothing downloaded, nothing
to license. Imagery is EOX Sentinel-2 cloudless **2016** only (CC BY 4.0, credited in frame on every satellite shot);
the paper map credits Natural Earth.

## script.json

```json
{"slug": "diomede", "title": "Diomede: See Tomorrow", "voice": "am_michael", "speed": 1.18,
 "lead": 0.6, "hold": 1.5, "maxPause": 0.28, "pauseTo": 0.2,
 "respell": {"Diomede": "[Diomede](/dˈIəmˌid/)", "Gorbachev": "[Gorbachev](/ɡˈɔɹbəʧˌɔf/)"},
 "lines": [{"id": "hook", "text": "From this island, you can see tomorrow."}, …]}
```
- About 10 short lines per 30 s; one wav per line; joined with 0.3 s, then every pause over `maxPause` → `pauseTo`
  (never the lead-in or the tail). `lead` = silence before the first word; `hold` = picture held after the last word.
- `respell` is applied to the spoken text only (whole-word, case-sensitive); the script text stays the key source.
- Line `id`s are what story keys and `line:` keys refer to. Words are split on whitespace, so `Seventy-seven` is one word.

## story.js

```js
MF.story({
  slug, title,
  lon0: -169,                 // projection centre (rotate the d3 mercator so the story never meets the antimeridian cut)
  sat: {threshold: 5, levels: [{z: 9, center: [lon, lat], km: [w, h]},
                               {z: 11, …, landOnly: true, padKm: 6},
                               {z: 13, …, landOnly: true, padKm: 1.5, weak: -12}]},
  places: {name: [lon, lat], …},               // used by camera focus and event anchors
  lines:  {name: {geo: 'International Date Line' | coords: [[lon, lat]…], replace: [{lat: [a, b], lon}],
                  lat: [south, north], reverse: true, extend: true}},
  paper:  {colors: {'Russia': 0, …}, labels: [{text, at: [lon, lat], kind: 'country'|'sea'|'place', size: 8-16, z: [zmin, zmax], rot}],
           style: {…PaperMap overrides}},
  sound:  {bpm: 90, sections: [{at: KEY, energy: 0-3}], hit: KEY, bedDb: -12, duck: -9},
  camera: [{at: 'START', focus, z, off}, {at: KEY, to: KEY | dur: s, focus, z, off, ease: 'quart'|'sine'|'linear'}, …],
  events: [{type, at: KEY, out: KEY, …}, …],
  drift: {px: 2, deg: 0.06},                    // handheld drift (default)
});
```

**Per-format values.** Any value written `{h: <16:9>, v: <9:16>}` resolves to one of the two, anywhere in the story
(camera z/off/focus, offsets, sizes, positions). 9:16 is re-framed, never cropped: give the camera its own zoom and
offset, stack tags inside the 1080-wide frame, keep text out of the bottom ~18 % (IG UI). The split frame always
follows the real line.

### Word keys (never seconds)

| key | time |
|---|---|
| `"tomorrow"` | start of the 1st "tomorrow" in the script |
| `"Diomede#2"` | start of the 2nd "Diomede" (repeats like "is", "the", "line" need `#n`) |
| `"Date Line"` / `"Date Line>"` | a word sequence: start of its first word / end of its last |
| `"curtain/The#2"` | the 2nd "The" inside line `curtain` |
| `"1987@+0.15"` | any key plus an offset in seconds after `@` |
| `"line:swim"` / `"line:swim>"` | start / end of a line |
| `"START"`, `"END"` | 0 / end of the last word (`"END@+1.5"` = the end of the hold) |

Matching ignores case, apostrophes and outer punctuation. A key that doesn't match throws with its name. Because
everything is keyed to words, re-recording the voice (or swapping stub ↔ real timing) re-times the whole film.

### Camera

World units: web mercator, 256 = the globe, rotated so `lon0` is x = 128. Camera = focus (world) + its screen offset
`off` (px from frame centre) + zoom `Z` at 2^Z px per unit (Z = slippy zoom: 12–13 for an island, 5 for an ocean, 3.5
for a hemisphere). Moves interpolate Z linearly under the ease (quartic in-out when |ΔZ| > 0.6, else sine) and move
the focus zoom-aware (a fixed pivot), so pull-outs read like Google Earth. Satellite → paper between Z 9.3 and 7.3.
Moves with |ΔZ| > 1.5 get a whoosh automatically. Keep moves sequential (each starts where the last ended).

### Event types

Common fields: `at` (KEY, appear), `out` (KEY, exit: shrink + fade 0.22 s), `place` (name or `[lon, lat]`: anchor
that moves with the map) + `off: [dx, dy]` px, or `screen: [x, y]` (rides only the handheld drift), `rot` (deg),
`seed`. Every event declares exactly one SFX at its own time (listed).

| type | fields | draws | sfx |
|---|---|---|---|
| `circle` | `place`, `km: [rx, ry]` (world) or `px: [rx, ry]` (screen-sized), `dur`, `turns` (1.12), `tilt`, `width` | boiling marker loop, 1.1–1.13 turns | marker |
| `write` | `text`, `size`, `rot`, `dur`, `align` | Permanent Marker handwriting, written left→right | scribble |
| `stroke` | `line` (a `lines` name) or `coords`, `dur`, `width` (7–10), `dash`, `ease`, `from` (place: draw outward both ways from there), `sfx: false` | marker polyline on the map | marker |
| `border` | `line`/`coords`, `dur`, `width`, `dash` | dashed map-ink line drawing on | pen |
| `measure` | `from`, `to` (places), `dur`, `tickKm` | dashed red measuring line with end ticks | marker |
| `count` | `value`, `decimals`, `unit`, `from`, `countAt`, `countTo` (KEYs), `label` | black paper tag counting up | slide + tick |
| `tag` | `title`, `sub`, `subAt` (KEY: subtitle types in), `color` (bar), `tsize`, `ssize`, `tape` | cream tag, colour bar, tape | slide + typing |
| `strip` | `text`, `highlight` (substring), `hlAt` (KEY), `hlDur`, `size`, `font: 'type'\|'title'` | torn paper strip, yellow highlighter swipe | slide + highlight |
| `calendar` | `header`, `front: {big, small}`, `back: {big, small, color}`, `flipAt` (KEY), `band` (colour), `scale` | tear-off page; on `flipAt` it flips over the binding | slide + page |
| `stamp` | `text`, `size`, `rot`, `color` | red rubber stamp; impact exactly at `at`, 16 px decaying camera shake | impact |
| `tracker` | `title`, `rows: [{label, value, at?}, {label, timer: {from, value, at: KEY, end: KEY}}]` (timer in minutes, shown h:mm) | date/time/counter card | slide + tick |
| `path` | `coords`, `end` (KEY), `cross: {line, at: KEY}` (crosses that line exactly on the word), `sfx` | dotted trail + moving marker | splash (or `sfx`) |
| `split` | `line`, `west: {color, alpha}`, `east: {…}`, `labels: [{text, side, at, out, y, dx, size}]` | two tinted sides divided by the real line, paper tags naming each side | swish + slide |
| `endcard` | `text`, `scribbleAt`, `replace`, `replaceAt` (KEYs), `w`, `h`, `size`, `handSize` | paper card; number scribbled out, punchline written in marker | slide + scribble ×2 |
| `sfx` | `sound` (kit name), `dur`, `gain` | — | that sound |

Kit sounds: `marker pen highlight scribble slide page tape whoosh_out whoosh_in impact typing tick swish splash`.

**Added for `bir-tawil`** (all opt-in; details in `CHANGES.md`):

| type / field | fields | draws | sfx |
|---|---|---|---|
| `area` | `coords` or `line`, `color`, `alpha` (0.3), `hatch` (px), `hatchColor`, `hatchAlpha`, `hatchW`, `edge`, `fade`, `layer` (2) | a tinted / hatched map region (under the marker, over split tints) | highlight (or `sfx`) |
| `pricetag` | `front` / `back`: {title, big, small, color, band}, `flipAt` (KEY), `w`, `h`, `color` | manila tag on a string; turns over on `flipAt` | slide + page |
| `ink: '#hex'` | on `circle`, `write`, `stroke`, `border`, `measure` | a second marker colour (under 45 %, highlight 70 % to white) | — |
| `sep: ','` | on `count` | thousands separator ("2,060 KM²") | — |
| `holes: [[[lon, lat]…]]` | on `split` (west/east or north/south) | regions left untinted | — |
| story `hud: {shade: 0–1}` | — | warm multiply band behind the lat/long + EOX credit over bright imagery | — |

### Look (fixed by the engine)

Paper map: ocean `#A9C2C4`, land `#ECE2CA`, countries in `#E6C1A7 #EEDAA4 #D2DEB8` (greedy 3-colouring, pin with
`paper.colors`), dark-brown coast 1.25 px over three soft water-lining strokes (30, 19, 10 px), dashed brown borders,
10° graticule at 26 %, Cormorant Garamond 700 labels 8–16 px (×1.2 on the reel). Satellite: masked land over a navy sea
(`#14304A` → `#0B1E31`), teal halo `#2A6274`, live lat/long in Special Elite bottom-left, EOX credit bottom-right.
Over everything: paper texture multiplied (85 % paper, 22 % satellite), warm vignette, 7 % grain. Marker `#D9291D`,
dark underlay 1.6 px wider, pink 30 % highlight up-left, resampled every 26 px, ±1.5 px wobble re-rolled 8×/s.
Pop-ins: spring (ζ 0.48, 19 rad/s) from 55 % with a rotation settle. Handheld drift ±2 px / 0.06°. No creator names,
logos or catchphrases in frame; every prop is drawn in code.

## Rendering

- `render.py` serves `map-films/` on `127.0.0.1:<random>` (same origin, so WebGL and `toDataURL` accept the images),
  opens `film.html` in headless Edge (`channel="msedge"`), and per frame calls `__mf.frame(t)` then grabs the canvas as
  PNG into ffmpeg (H.264 CRF 19, yuv420p). `--workers N` splits the frame range across N Edge processes and concats
  the segments; audio/final.wav is muxed as AAC 256k.
- Motion blur: subframes over half a frame (180° shutter), accumulated in a WebGL2 RGBA32F framebuffer inside the
  page (one grab per output frame). Samples = clamp(ceil(max screen displacement of the frame corners over the
  shutter / 2.5 px), 8, 40), so fast zooms don't ghost.
- Page API (`window.__mf`): `state` ('loading'|'ready'|'error'), `error`, `info()` → {W, H, fps, duration, speechEnd,
  stub, story, cues, words, sound, webgl}, `frame(t, {samples})`, `grab(type)`, `frameData(i)`. `?dump=1` loads only
  the story (+ timing) — the tools read `sat`, cues and the sound plan this way, so story.js is the single source.

## Making a new film

1. Fact-check, write `script.json` (draft), copy `diomede/story.js` as a template: set `lon0` (≈ the subject's
   longitude), `places`, the three `sat.levels` around the subject (z9 covering the view at Z ≈ 8.5, z11 and z13
   `landOnly`), `paper.labels`, `lines` you need, then the camera and events keyed to words.
2. `satellite.py <slug>` → look at `tiles/z*_check.jpg` (red = mask outline). Tune `threshold` / per-level `weak`.
3. `stub.py <slug>` → `render.py --sheet 30` in both formats → fix what doesn't read at phone size → crops.
4. After script approval: `phonemes.py` on every name → `respell` → `voice.py` → `align.py` (read the line check)
   → re-check the sheets (keys re-time automatically) → `mix.py` → `render_locked.sh` → `qa.py` on the mp4s.

## Gotchas we hit

- **EOX licence:** only `s2cloudless_3857` (2016) is CC BY 4.0; 2017+ layers are CC BY-NC-SA. Template order is
  `…/g/{z}/{y}/{x}.jpg`. Open-ocean tiles are a flat navy fill. Fetch sequentially, ≥ 0.3 s apart, cache forever.
- **Land mask:** "R − B > 5" misses shaded or snowy cliffs (R ≈ B) at z13 → per-level `weak: -12` hysteresis seeded
  by R − B > 5, then keep only components the coarser level also calls land (drops clouds and sea ice). Never use
  `weak` where turbid water or ice touches land: at z11 it flooded the whole sea.
- **Coarse mosaics mid-zoom** showed a worse coastline than the fine one they hand over to → `satellite.py` writes
  each finer mask into the coarser levels inside its coverage before cutting them out.
- **d3 + clip extent:** a polygon reaching the pole or read as inverted paints land over the sea → drop Antarctica and
  every polygon whose `d3.geoArea` > 2π (`MF.Geo.cleanPolys`). Project with `precision(0)`.
- **Natural Earth's 1:10m date line** sits on 169°W in the Bering Strait; the treaty meridian (168°58′37″W) is ~1 km
  east and is what passes between the Diomedes → `lines.*.replace`. Latitude bands must interpolate their cut points,
  and adjacent bands should overlap ~0.4° or the joint between two strokes shows.
- **Paper tiles** need a few px of bleed or seams appear between tiles; half-zoom levels cross-fade so line widths and
  labels never pop. Labels are drawn per frame in screen space.
- **Ink during zooms:** sample spacing is taken from the camera at the boil time (`floor(t·8)/8`), so the wobble only
  re-rolls on the boil instead of swimming every frame.
- **Global names:** the page defines only `MF.*` and `window.__mf`. If a renderer injects a global with the same name
  as yours, every frame renders black while stills look fine — `qa.py`'s YAVG dip scan catches it.
- **Duplicate keys in an object literal** silently keep the last one (a timer written `{to: 126, …, to: 'tomorrow#2'}`
  showed NaN:NaN) → timers are `{from, value, at, end}`.
- **Kokoro / misaki:** "Diomede" → dɪˈOmd ("de-owned" to whisper); respelled dˈIəmˌid. "Gorbachev" → -ʃɛv; respelled
  ɡˈɔɹbəʧˌɔf. "Lynne Cox" is fine. Whisper writes numbers as digits ("3 .8", "77", "21") and homophones ("to islands"):
  `align.py` maps whisper words onto the script's words (difflib, unmatched spans share time by length) and its line
  check compares spoken forms.
- **Pause shrinking** must skip the lead-in and tail, or the lead disappears.
- **Anaconda has no soundfile** → the tools read/write wavs with `scipy.io.wavfile`.
- **Length:** 111 words at speed 1.18 speak in ≈ 38.3 s; Diomede uses a 0.6 s lead so the film is 40.3 s with the hold.
- **Grain vs bitrate:** per-pixel grain is incompressible: at CRF 19 the first Diomede render was ~69 Mbps (350 MB for
  40 s). The grain tile is now blurred to ~2 px and overlaid at 0.34 (≈ 7 % on paper, ≈ 9 % on the dark sea), which
  cut the bitrate by ~40 %.
- **True peak:** AAC adds ~0.4 dB of overshoot, so `mix.py` limits samples to -1.6 dBFS to stay at ≤ -1 dBTP in the mp4.
- **QA dips are expected at paper ↔ satellite crossings** (the YAVG drops ~30 % in 0.2 s on a fast zoom); a real fault
  shows as YAVG < 8 or an isolated one-frame dip.

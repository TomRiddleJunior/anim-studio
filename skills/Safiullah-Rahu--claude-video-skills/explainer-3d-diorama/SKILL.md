---
name: explainer-3d-diorama
description: "Makes calm educational / corporate explainers set in small 3D dioramas — one floating cut-away world block at a time (a core-sample slab, a tile mosaic, a factory island) centred on a seamless parchment or fog ground, a slow orbiting camera that never cuts, soft contact shadows, layered cross-sections, ideas told as physical object swaps (flip-swap, turf peel, mosaic split, rain-and-pile), faceless mannequins, burned-in subtitles or thin HUD callouts, and a calm narrator. Real three.js (WebGL) rendered frame-by-frame inside the engine. Use for \"3D diorama explainer\", \"isometric 3D miniature\", \"low-poly explainer like Let's Talk About Soil\", \"clay render corporate explainer like Munters\", \"museum-miniature / tilt-shift 3D\", NGO or science-policy films (soil, water, climate, cities), B2B service or process explainers with a model on a plinth. Builds on explainer-engine."
---
# 3D diorama explainer (parchment low-poly · clay fog)

> `ENGINE` = `~/.claude/skills/explainer-engine/engine` (the **explainer-engine** skill: renderer, voice, score, QA). Rendered sample of this skill: `the sample film (the render is not included in this repository)` (source in `assets/sample/`).

One small world at a time, presented like a museum miniature: a slab of soil with visible strata, a city block, a
garden cut in half to show its layers. It floats centred on a seamless vignetted ground, lit softly from the upper left,
while the camera holds, drifts and occasionally glides to a new framing. Every claim becomes a physical event on the hero
object (it tumbles over and lands as something else, a turf sheet peels back, tiles split away, drops rain into a jar).
Two skins: **parchment low-poly** (flat-shaded facets on a warm radial backdrop, white subtitles: an NGO / science
film) and **clay fog** (white clay in navy fog, thin white HUD callouts: corporate service). Built from frame analysis
of 2 source videos (references/sources.md; full analysis in references/analysis.md). Original work only: your own
topic, models, mannequins and organisation; never a client's product cabinet, van livery, logos or partner wall.

Reference build: `assets/sample/` → `out\3d-diorama.mp4`, "Where the Rain Goes":
74.9 s, how a rain garden cleans stormwater, parchment skin, 0 hard cuts. Peak load is ≈ 32 k triangles and ≈ 2 k draw
calls (the 9-slab mosaic); it renders 1080p30 at 13–18 fps with 2 workers on an Intel UHD 770 iGPU (ANGLE / D3D11).

## 1. Signature traits
- **One hero diorama, centred** at 40–60 % of frame width on a 30–40° three-quarter view, lots of empty ground around it.
- **Cut-away world block.** Tiles are core samples: coloured top, dark soil sides (topsoil band), floating a little
  above the ground with a soft contact shadow. Cross-sections show strata, roots, pipes, groundwater.
- **Flat-shaded low poly** (icosahedron trees, prism roofs, box cars, faceted lawns with per-face colour noise), or
  matte white clay in fog for the corporate skin.
- **The camera never cuts.** Near-holds (drift ≈ 1°/s) broken up by eased arrival moves; set changes hide inside camera
  moves, flips, splits and the act-break fade to black.
- **Objects act, not people.** Flip-swap, peel, split, rain-and-pile, glow, count. Faceless mannequins appear as "us".
- **Every statistic gets a human-scale proxy** (20 drops into a measuring jar, per person, a city).
- **Minimal text.** One-line burned-in subtitles (parchment) or thin line callouts / counters (clay); never headlines.
- **Calm narration** at 105–135 WPM over an ambient pad bed; physical foley on events.

## 2. Target metrics
QA compares `out/qa/metrics.json` with this table. Sources: Soil (RIFS Potsdam, 324 s) / Munters (116 s).

| metric | Soil / Munters | target (60–90 s piece) | reference sample |
|---|---|---|---|
| cuts_per_min | 0.19 / 0.52 (one cut to black / one hidden in a whip) | 0–0.5 | 0.0 ¹ |
| scene_changes_per_min | 5.74 / 13.5 | 6–13 | 9.61 |
| scene_len_median s | 7.08 / 3.0 | 3–7 | 2.5 ² |
| motion_mean / p90 | 6.11 / 19.1 · 8.37 / 18.3 | 6–8.5 / 17–20 | 7.04 / 22.0 ³ |
| hold_frac | 0.252 / 0.113 | 0.11–0.25 | 0.196 |
| colourfulness | 29.3 / 30.6 | 28–32 | 31.9 |
| brightness | 0.547 / 0.600 | 0.54–0.60 | 0.538 |
| dark_frame_frac | 0.167 / 0.086 | 0.08–0.17 | 0.133 |
| WPM overall | 105.5 / 133.9 | 105–135 | 119.4 |
| loudness LUFS | −16.3 / −23.8 | −16 | −16.0 |
| palette (k-means) | #15120d #b4a873 #928755 #d0c48c #52503b | parchment family | #b9ae7d #20170f #c9bf8e #817548 #9f956b |

¹ The act break is a 0.85 s fade to black, not a hard cut. A hard cut to black under a pause is also on-style (1 cut).
² A 75-s piece states one claim every 2.5–4 s (Munters pace) because it lists nouns. Scenes come out shorter than in
the 5-min Soil film; merge neighbouring framings to lengthen them (§6).
³ p90 runs slightly hot because a 75-s film packs ~12 arrival moves. Spread big changes over longer moves (≥ 1.6 s for
pull-backs, fades from black ≥ 1.4 s, the day–night swing ≥ 0.8 s) before cutting moves.

## 3. Script formula
| % runtime | beat | sample ("Where the Rain Goes") |
|---|---|---|
| 0–14 % | **Poetic hook in three short sentences** over a dark-to-light reveal | "Rain falls on a city. / On roofs, on roads, on parking lots. / And almost none of it soaks in." |
| 14–26 % | **Statistic with a physical proxy**, one per set, contrasted | "On a forest floor, about one drop in ten runs off. / In a dense city, more than half does." (20 drops → jars at 10 % / 55 %) |
| 26–38 % | **The loss**: list of nouns, one event each, then a dark set | "it picks up oil, tyre dust and fertiliser, / and storm drains carry it, often untreated, into the river." |
| 38–40 % | **Fade to black → the turn** | "But there is a gentle fix." |
| 40–75 % | **How it works**: the object opens (peel → split) into a layered cross-section; one label per spoken noun | "Water pools… Mulch traps the grit. A sandy soil mix filters the rest. Microbes break down oil, and roots take up nutrients. Cleaner water seeps down…" |
| 75–82 % | **Time passes** (day–night, a small character beat) | "In a day or two it's dry again, too soon for mosquitoes to breed." |
| 82–96 % | **Scale up + hope**: the tile becomes one of a mosaic | "One garden is small. Street by street, they make a city a sponge again." |
| 96–100 % | **CTA → paper wipe → end card** (org wordmark, one line) | "It can start with the rain on your own roof." |

- Sentences of 5–12 words; lists delivered noun by noun; statistics only with a proxy and only if you are sure (the
  sample uses the well-known natural-cover vs 75–100 % impervious runoff figures, 10 % vs 55 %).
- **Kokoro:** `bm_george` speed **0.95** (≈ 154 wpm while speaking), `lead` 1.0, `tail` 3–4 (end card). Gaps 0.4–0.6
  inside a beat, 0.7–0.9 between beats, **1.5 before the turn** (it plays over black). Overall ≈ 118 WPM. For the clay /
  corporate skin use `am_michael` at 1.0 with 0.25–0.4 gaps (≈ 134 WPM).
- British spellings match the British voice (tyre, fertiliser); subtitles show the script text as written.

## 4. Visual system
| role | parchment low-poly | clay fog |
|---|---|---|
| backdrop (CSS radial on the stage) | `#e2d9ad → #d5ca99 → #bfb381 → #9d915f → #8b8050` | `#4a6d92 → #3a5c7e → #2a3c51 → #1b2738` + `FogExp2(0x2c4058, 0.06)` |
| paper mottling | `X.paper('#808080')` overlay blend, 0.55 | same, 0.3 |
| soil / strata | soil `#2e2119`, mid `#3d2c20`, topsoil band `#241a13` | clay grey `#777e83` |
| hero locals | grass `#737d44 / #5f6a35 / #858f52`, leaves `#4e6b2a…#7c8f45`, walls `#e2d8c3`, roofs `#8a5a44 #7b6a5c`, asphalt `#56575a` | white clay `#d6d1cc`: in this skin `D.mat` pulls every colour 84 % toward it (`{keep: true}` opts out; water and windows keep theirs) |
| cross-section | mulch `#6b4a2f`, sandy soil mix `#a5885a`, gravel `#8d8b84` + pebbles `#c4c0b6`, roots `#e2cfa4`, groundwater `#4a7fa6` | — |
| water | `#4f8cbf` Phong (shininess 90, slight emissive); polluted `#6f6a44` | dark glossy plane with grid |
| one accent | ochre raincoat `#c49a35` / warm windows at night `#f2c37a` | emissive windows `#f1c27a`, warning red `#c0392b` |
| dark sets | shade layer `#15120d` at 0.86 (storm, underground, night) | night navy `#1b2d3e` |
| text | white Inter 500: subtitles 36 px at y 1004, labels 34 px | white Inter/Montserrat 500 HUD numbers 30–36 px |

Light: hemisphere (sky `#fff3dc`, ground `#6d5e40`, 1.45) + one shadow-casting key from the upper left (az −40°, el 52°,
2.6) + a cool fill. PCF shadows, radius 5, 2048 map; the shadow frustum follows the camera target. Colourfulness lives
in small hero objects; the ground and soil keep the frame near 30. Composition: hero centred, three-quarter top-down;
close-ups go low and tight; callouts sit beside the model on elbow leaders, never over it.

## 5. Characters & objects (assets/kit.js → `const D = await DIO.init(X, {skin})`)
| builder | what it makes |
|---|---|
| `D.tile({w,d,h,top,soil,bands})` | core-sample slab, top at y = 0; `.userData.body` (BoxGeometry, materials `[+x,-x,+y,-y,+z,-z]`) |
| `D.tree({seed,h,kind,crowns})` | trunk + 1–3 jittered icosahedron crowns or a 2-cone conifer; tagged `userData.kind='tree'` |
| `D.house({w,d,h,flat,floors,cols,winW,winH,roofMat})` | box + extruded gable (or flat roof), window grid in `D.windowMat` (glows with `D.night`) |
| `D.car({color,s,ry})`, `D.cloud({seed,n,size})`, `D.plant({kind:'grass'|'flower'|'reed'|'shrub'})` | props |
| `D.mannequin({coat,trousers,s})` | faceless low-poly person (≈ 0.18 u tall), `.userData.body/head` for idle sway |
| `D.jar({h,r,glass})` → `{group,set(level)}` | measuring jar with a half mark: the statistic proxy |
| `D.dropGeo(size)`, `D.waterMat()`, `D.blob(w,d)` | teardrop lathe, water material, soft contact shadow |
| `D.box`, `D.mesh`, `D.group`, `D.mat(color,{phong,basic,opacity,unique,emissive})`, `D.jitter(geo,amt,seed)` | low-level |
Rules: chunky, ≤ 50 k triangles and ≤ 2–3 k draw calls per frame on an iGPU, flat shading everywhere, per-face colour noise on big surfaces, people
small and faceless, the hero object is the actor. Use `{unique:true}` for any material you animate.

## 6. Motion grammar
**Everything is a function of t.** `D.anim(obj, {'position.y': [[t, v, ease], …], scale: […], visible: […], color: [[t,[r,g,b]]]})`,
`D.track(keys)`, `D.prog(t,t0,t1,ease)`, `D.onFrame(fn)`. Keys hold outside their range; the ease shapes the segment
arriving at a key. Colours are sRGB triplets.

**Camera** (`D.camKeys` over `D.rig {az, el, r, tx, ty, tz, fov, keyAz, shadowSize}`), written as a path of states:
| move | ease | duration | use |
|---|---|---|---|
| near-hold drift | `none`, only 40 % of the written travel (camPath rule) | while a line plays | default; gives 15–20 % holds |
| arrival (new framing per claim / noun) | `power3.inOut` | 0.8–1.2 s | land 0.1–0.2 s after the stressed word |
| reveal / pull-back / crane | `power2.inOut` or `sine.inOut` | 1.6–2.8 s | set changes, the energy peak (mosaic crane) |
| push into a cut face | `power2.inOut` | 1.5–2 s | cross-section, underground |
Physical events: flips 0.55 s `power2.inOut` + 0.45 lift + 0.3 s landing dip; splits 0.7 s (out `power2.out`, drop
gravity `u²`, stagger 0.06 s); assembly drop 0.5 s `u²` + damped bounce, stagger 0.1 s; pops `back.out(2.2)` 0.4–0.45 s,
stagger 0.045 s; drops fall 0.36 s (`u²`), squash, then sink or slide. **Idle life:** `D.sway(trees, {amp: 0.022})`,
plants 0.06, mannequin body/head sines, flowing particles, a drifting cloud.

## 7. Transitions (catalogue → kit)
| id | name | build | frames @30 | when |
|---|---|---|---|---|
| T1 | slow orbit / hold-drift | camPath DRIFT segments | whole lines | default |
| T2 | flip-swap | `pair = D.flipPair({h})`, build A in `pair.a`, B in `pair.b`; `D.flip(pair, [t0, t1…], {axis})`; axis = (cos az, 0, −sin az) of the camera | 16 + 9 | "on a forest floor… / in a city…" face A ↔ B |
| T3 | turf peel | `D.peelSheet(w,d,top,under,{keys:[[t,0],[t+0.75,1]]})` page-curl deformer (rotate the group to choose the curl direction), then lift + shrink it away | 22 | revealing what is under a surface |
| T4 | mosaic split | `D.split(parts, t, {centre, out, drop, stagger})`; a half that returns: one `D.anim` with z/y/visible keys | 20–25 | city → one street; opening the cross-section |
| T4r | assemble | `D.assemble(parts, t, {height, stagger})` | 15 each | "street by street" mosaic |
| T5 | rain-and-pile | `D.rain`, `D.rings`, `D.flow(path)` (runoff, pollutants, pipes, percolation); per-drop scripted physics into `D.jar` (sample `dropSet`) | 2–3 s | every statistic |
| T6 | fade to black between acts | `D.fade([[t,0],[t+0.85,1],[t2,1],[t2+1.4,0]])` | 25 + 42 | the turn |
| T7 | paper-sheet wipe | `D.paperWipe(t, {dur: 0.85})` crumpled sheet in camera space, flattening to paper colour; then an HTML end card | 26 | to the end card |
| T9 | push into an opening / cut face | camera push + `D.shade` darkening (underground) | 45–60 | the "loss" act |
| — | shutter cut-away | a soil plate over a cut face scales to 0 (`scale.y`) to reveal a pipe / layer | 15 | showing what is inside a tile |
| — | day–night | `D.night([[t,0],[t+0.75,1],…])` + `keyAz` sweep (dims key/hemi, lights windows, darkens ground) | 25 + 25 | time passing |
| T10/T11 | HUD counter / callout bloom | `D.label({text, anchor: Vector3|fn, t0, t1, dx, dy})` (6 f leader draw, ring pulse, text rise); counters with `X.countUp` on an HTML/SVG node | 6–7 | one per spoken noun |
| T13/T15 | tilt into clouds / bubbles | `D.cloud` banks + camera tilt; bubbles = transparent spheres with a miniature inside (clay skin) | 75 | corporate lists |

## 8. Sound
`sound.json`: `{"preset": "ambient-space", "bpm": 80, "sections": [{"t":0,"energy":1},{"t":<black>,"energy":0},
{"t":<turn+1>,"energy":1},{"t":<cross-section>,"energy":2},{"t":<mosaic>,"energy":3},{"t":<end card>,"energy":0}],
"music_under_voice_db": -17, "sfx_db": -4, "lufs": -16}`. Energy 0 under the black makes the turn breathe; energy 3
(timpani + bright pad, auto riser) lands on the scale-up.
| visual event | sfx |
|---|---|
| rain bed | overlapping long `swoosh` (dur 4–4.5, pitch 0.65–0.75, gain 0.14–0.18) |
| drop lands / runoff into jar | `drop` (gain 0.1, pitch 0.85–1.3) / `bubble` |
| flip (D.flip adds) / split / assemble | `whoosh` + `thud` / `slide` / `thud` per tile |
| pollutant nouns | oil `drop` low, tyre `woosh_low`, fertiliser bag `paper` |
| drain, pipe, plume | `woosh_low`, `bubble` pitch 0.45–0.5 |
| peel / paper wipe | `paper` + `swoosh` |
| plants and gardens pop | `pop` gain 0.12–0.16 every 2nd–3rd, `sparkle` once |
| label bloom (D.label adds) / microbes / nutrients | `tick` / `sparkle` / `chime` + `blip_up` |
VO: calm, unhurried, no emphasis tricks; the music is ducked 8 dB under speech by sound.py.

## 9. Build recipe
1. Copy `assets/template/` to the project (it carries `vendor/three.module.min.js` r170 + licence and `kit.js`). The
   engine serves only the project folder and `/engine/`, so three.js must live inside the project. Refresh it with
   `npm install three@0.170.0` in a scratch folder and copy `build/three.module.min.js` (standalone ES module in r170).
2. Write `script.json` (beat map §3), then `ENGINE/make.sh <proj> --draft --workers 2` once to get `data/vo.json`.
3. In `scene.js`, read every time from words (`X.word`), build each diorama once, give each a visibility window
   (`D.onFrame(t => g.visible = …)` / `D.window`), and move the ground (`D.anim(D.ground, {'position.y': …})`) to sit
   0.2 below the current slab.
4. Write the camera as one `camPath` of states (sample `scene.js`): arrival per claim, drift between.
5. Looks over time: `D.fade`, `D.shade` (storm / underground darkness), `D.light`, `D.night`.
6. Labels (`D.label`) and `D.subtitles({size: 36, top: 1004, until})` last; then `X.end(END)`.
7. Stills at every beat: `node ENGINE/render.mjs <proj> --stills …`, then `make.sh <proj> --draft --skip-tts`, measure
   the draft with `analyze_video.py` (motion and holds are resolution-independent), then the full render with
   `--workers 2` (WebGL pages are GPU-bound; 3+ workers contend on an iGPU).

**How the WebGL route works** (`DIO.init`): `await import('./vendor/three.module.min.js')` inside `X.boot`; a
1920×1080 canvas inserted between the CSS backdrop and `#svg`; `WebGLRenderer({alpha: true, antialias: true,
preserveDrawingBuffer: true})`, pixel ratio 1, transparent clear; ground = `ShadowMaterial` plane (shadows only, so the
CSS backdrop stays seamless). One `X.every(t => D.frame(t))` evaluates camera tracks → user `onFrame` functions → camera
+ light rig → overlay updates (labels project `Vector3.project(camera)` to stage px) → `renderer.render`. No
requestAnimationFrame, no clock, no `Math.random` (use `X.rand`). If WebGL fails (`GL RENDERER` missing, black canvas),
fall back to an isometric SVG diorama (analysis §11: three face tones 100/78/62 %, 8 pre-projected azimuths).

## 10. QA checklist
- Stills: hook frame, each flip mid-tumble (90°), each statistic proxy, the split, every label, the black, the night,
  the mosaic, the wipe. Text ≥ 34 px; callouts inside 96 px margins; subtitles one line.
- Metrics gates (§2): holds ≥ 0.11 (add drift-holds), motion 6–8.5 (add arrival moves), dark 8–17 % (storm / under-
  ground / night / black), colourfulness ≈ 30 (large neutral ground + soil; desaturate grass if > 33).
- Profile spikes before the full render: decode at 6 fps 160×90 and print per-second mean diffs
  (the **explainer-launch-promo** skill's `assets/motion_curve.py out/draft.mp4` does exactly this; the sample's
  own scratch helpers are not included in this repo); fades from black, light-direction sweeps and fast crane moves are
  the usual p90 culprits. Make a contact sheet of the stills with any montage tool.
- Gotchas: `Color.setRGB` needs `THREE.SRGBColorSpace` for hex-like triplets (the kit does it); hand-built
  `BufferGeometry` needs explicit normals (zero-area strips → NaN normals); animated shared materials change every mesh
  (use `unique`); `D.split` and a later return conflict (one `D.anim` instead); hide a cut face until its reveal (a
  pipe slot visible in the overview reads as a bug); rain streaks thicker than 0.007 u look like sticks in close-ups;
  falling objects that cast shadows leave stray dots on the ground (`cast: false`); keep the flip axis perpendicular to
  the camera azimuth at flip time.
- Don't: cut between angles, fill the frame with text, use photoreal textures or real logos, mix the two skins, move
  fast except for one energy peak, end without a CTA and an end card.

Files: references/analysis.md · references/sources.md · assets/kit.js · assets/template/ (index.html, kit.js, scene.js,
script.json, sound.json, vendor/three.module.min.js + three.LICENSE)

---
name: explainer-engineering-hud
description: "Makes a 60-75 s vertical 9:16 engineering explainer about a real safety system, in the format of a viral Instagram reel (@app.engineering, 241k likes): a dark isometric 3D night diorama (navy sea with a faint grid, slate land with stepped blocks), a top-left HUD that stays on the whole film (a status cell such as POWER LIVE/CUT or BARRIER OPEN/CLOSED and a live readout that turns amber with down-chevrons and finally counts), a location pill under it, cyan glow lines for the thing that works and red glow lines/rings for the threat, a map shot with one CC-licensed photo inset and its credit line, a cut-away block that explains the physics with two labelled layers, a sensor that pulses, a panel with two bars and a big amber number, a grid of icons for the scale, and two result counters that turn green. Captions sit in a dark box, 2-4 words, the spoken words bright and the next ones grey. Built in code with HyperFrames + three.js (one world composition with several sets, fitted cameras, bloom) and a DOM HUD; Kokoro narration; an original synthesized ~117 BPM bed and SFX with a no-music mix; every number double-sourced in FACTS.md. Use for 'engineering explainer like app.engineering', 'how X stopped a disaster', 'automatic safety system explained', 'HUD explainer with live readout', 'storm barrier / earthquake brakes / tuned mass damper / dam spillway explainer', 'dark 3D infrastructure reel'. Builds on hyperframes and the explainer engine (TTS, analyzer)."
---
# Engineering HUD — one real safety system, told as a live readout

Reverse-engineered from one Instagram reel (**@app.engineering**, `DfYdn-mSWSg`, 65.9 s, about 241k likes; analysed
locally for reference only, see `references/sources.md` and Appendix A). The format is a **true-story engineering
explainer**: a hook that states the outcome as a surprising action ("X cut/closed/stopped its own Y before Z"), the
setting on a map, the physics in a cut-away, the system's rule, the moment it fired, the mechanism up close, a number
for the margin, the readout counting, the scale, and two result counters. A HUD in the top-left carries the story's
state the whole time.

Sample: `assets/sample/` — **"The sea gate that closes itself"** (69.5 s): Rotterdam's Maeslantkering closing
automatically during Storm Pia, 21 Dec 2023 (BARRIER OPEN → CLOSING → CLOSED, GAP ~360 m → 0 m). Facts in
`assets/sample/FACTS.md`.

## 1. Signature traits
- **A HUD that is the story's state.** Top-left panel, two cells divided by a hairline: a **status** (label + dot +
  word: LIVE/CUT, OPEN/CLOSED) and a **readout** (label + `~number unit`). The readout turns amber with stacked
  down-chevrons when the action starts and only *counts* late in the film (the payoff). A **location pill**
  (`PLACE · YEAR`) under the panel changes with the scene.
- **Dark isometric diorama.** Navy sea with a faint grid, slate land covered in low stepped blocks, high three-quarter
  cameras with a narrow field of view, slow drifts/orbits, never handheld.
- **Two glow colours with meanings.** Cyan = the system/the safe path (rail power, the open shipping lane, sensors,
  dotted signal arcs). Red = the threat (wave fronts, rings, surge lines). Amber = the action/the margin (brake
  lights, the readout once it changes, the big number). Green = the result.
- **One real photo** as a framed inset on the map shot with a credit line under it (CC licence).
- **A cut-away physics block** with two labelled things (`○ P-WAVE · FAST, WEAK`, `● S-WAVE · SLOW, STRONG`; ours
  `○ TIDE · ON SCHEDULE`, `● SURGE · WIND-DRIVEN`).
- **The operator as a plain card** (the source shows the operator's logo; this skill never does: plain text).
- **The sensor moment**: a close-up of one sensor whose glow blooms on the key word, with an expanding ring.
- **Brackets** with a big number and a small letter-spaced sub-label (`≈160 km` / `SHIROISHI – KITAKAMI`; ours `360 m`
  / `CHANNEL WIDTH`, `210 m` / `EACH GATE · 22 m HIGH`).
- **A panel with two bars** (the action vs the threat, hatched amber for the margin) and a **big amber number**.
- **A grid of icons** for the scale, filling amber one by one, turning green on the result word; then **two counters**
  that turn green on their words.

## 2. Measured metrics
Source: analyzer `metrics.json` + hand counts from 2 fps sweeps. Sample: `assets/sample/out/qa/` (gates.json).

| metric | source | sample (final) | gate |
|---|---|---|---|
| duration | 65.9 s | 69.5 s (+5.5 %) | ±15 % |
| words · WPM overall | 172 · 156.6 | 168 · 150.2 (−4 %) | ±20 % |
| shots (hand count) · cuts/min | 13 · 10.9 | 13 · 10.4 (−5 %) | ±20 % |
| analyzer cuts/min · scene changes/min | 0 · 0 (one navy palette: the detector sees no cuts) | 2.59 · 6.04 | explained, see below |
| brightness · colourfulness | 0.173 · 24.2 | 0.202 · 32.7 | — (ours has more cyan and amber on screen) |
| motion mean | 2.61 | 2.49 | — |
| loudness · true peak | −14.1 LUFS | −14.1 LUFS · −1.8 dBTP | −14 ±1, ≤ −1 dBTP |
| voice over bed | (music bed, ~117 BPM) | 11.5 dB | ≥ 10 dB |
| first word | 0.0 s | 0.18 s | ≤ 0.4 s |

**Cuts.** The analyzer finds no cuts in the source because every set shares the same navy palette and dark frames;
by eye it has 13 shots (cuts at 8.0, 14.0, 17.8, 28.0, 30.2, 33.8, 38.2, 42.6, 46.4, 50.4, 53.4, 58.0 s). Compare
hand counts with hand counts, and report the analyzer number as information.

## 3. Beat map (% of runtime) and script formula
| % | beat | source (shape) | sample |
|---|---|---|---|
| 0–11 | **Hook**: the outcome as an action the system took on its own, with the date, over the system in motion; the HUD flips on the action word | the operator acted on its own trains just before the threat arrived | a computer closed Rotterdam's door to the sea, no human gave the order |
| 11–21 | **Setting** on a map: where the threat came from (red rings), where the system runs (cyan line), the photo inset with its credit | the quake's origin offshore; trains at full speed | Storm Pia driving the North Sea; the open shipping channel |
| 21–26 | **The scale of what's exposed** in a close shot with a bracket or the readout | the train at ~270 km/h | 360 m bracket across the channel, a ship passing |
| 26–41 | **The physics**: "You see, every X has two …" in a cut-away block, two labels | two kinds of seismic waves | tide + surge |
| 41–50 | **The operator's answer**: a plain card, then the sensors/brain | sensors on the coast and track | the water agency hands the decision to a computer, BOS |
| 50–58 | **The rule / the trigger**: one sensor close-up that blooms on the key word | an island sensor felt it first | +3.0 m NAP at Rotterdam → it closes itself |
| 58–65 | **The moment**: wide, threat lines arriving, cyan goes grey, status flips | power cut over ~170 km | the forecast crossed the line; ships halted (CLOSING) |
| 65–74 | **The mechanism up close** with a dimension label | the brakes engage (macro of the bogies) | docks flood; 210 m gates swing on 10 m ball joints |
| 74–78 | **The margin** as a panel: two bars + a big amber number | ~10 s head start | ~2 h to close |
| 78–84 | **The readout counts** to its end state; the threat meets the system | speed 270 → 100 | gates sink, GAP 360 → 0, CLOSED |
| 84–90 | **The scale** as an icon grid filling amber → green | an icon per train on the line | all six big barriers shut |
| 90–100 | **Result counters** turning green on their words | 0 derailed, 0 hurt | 1.5M people behind it, 0 human commands needed |

- **170–185 words**, 15–17 lines, plain present-day sentences; ~157 WPM overall (~180 while speaking). Kokoro
  `am_michael` at speed 1.10–1.12, gaps 0.16–0.42 s. Numbers spoken in words in `vo/script.json` and shown as digits
  in the captions (`tools/film.json` "subs").
- Name the operator with a plain card; never put a logo on screen.
- Every number gets two sources in `FACTS.md` before it is recorded. Drop a claim ("a first", "the biggest ever") if
  any source contradicts it.

## 4. Visual system
| role | source (measured) | sample |
|---|---|---|
| sea | `#0b1e2b`/`#1b2430`, faint grid | water `#0e2435` + grid lines `#1d3a50` at 45 % (8-unit spacing) |
| land | `#1d222b`–`#252b35` stepped blocks | land `#222a36` (sides `#121821`), instanced blocks `#1e2531` + stepped tops `#27303d` |
| cyan (system) | ~`#39d7ff` with bloom | `MeshBasicMaterial` HDR (0.32, 1.75, 2.3) + additive halo tube |
| red (threat) | ~`#ff3b4e` | HDR (2.6, 0.22, 0.32) + halo |
| amber (action) | `#ffb23f` | readout, chevrons, big number, work lights |
| green (result) | `#36e0a0` | tiles, counters |
| white subject | the train | the gates and truss `#d6dbe1`/`#c4cad1` |
| light | soft, cool, no hard shadows | hemisphere `#b9cce4`/`#0a0f16` 1.9 + key `#c4d6ea` 1.25, NeutralToneMapping, bloom 0.5 (r 0.45, threshold 0.95) |

**HUD geometry (1080×1920, measured on the source and kept):** panel x 62–1018, y 197–334, radius 20, fill
`rgba(14,19,26,.86)`, 1.5 px border `rgba(160,180,200,.16)`. Labels Space Grotesk 700 31 px, letter-spacing .16em,
`#9aa6b2`, at y 215. Values 64 px at y 247. Divider x 440. Status dot 30 px at x 100. Chevrons at x 924. Pill x 62,
y 357–414, Space Grotesk 700 32 px, letter-spacing .14em.

**Captions:** Inter 800 52 px in a dark box (`rgba(12,16,22,.86)`, radius 18, padding 16/30), 2–4 words (≤ 24
characters); words already spoken `#f6f8fa`, the next ones `#7c8791`; the box fades in over 0.14 s with a 10 px rise.
The source centres them at y 1472 (77 %); this skill centres them at **y 1236** to stay inside the 1300 px key-text
line. Keep subjects out of y 1180–1290.

**Safe area:** HUD from y 197; panels from y 448; tags and brackets anywhere above y 1150; photo inset y 650–1112
with the credit at y 1124.

## 5. Shot grammar and transitions
- 12–14 shots, hard cuts only (0.08 s before the word), every shot moving: orbit (±4–10°) and push (8–16 %).
- Shot types, in order: hook diorama → map (rings, inset) → close of the exposed thing (bracket) → cut-away block →
  operator card over a top view → sensors/brain with dotted arcs → sensor close-up (bloom) → wide with threat lines →
  mechanism close-up (bracket) → joint/part macro → panel over a wide → the readout counting over a wide → scale grid
  and counters over one slow orbit to the end.
- **Fit cameras instead of guessing.** The 9:16 frame sees only ~±11° across; a scene laid out in real proportions
  never fits by eye. `tools/camfit.py` random-searches a camera so named points land on chosen pixels (spec JSON:
  `want` points with target px, `visible` points, ranges for fov, distance, elevation, azimuth, target). Then drift it
  with `{p, t, f, z, r}` (start, target, fov, zoom-in factor, orbit degrees).

## 6. Motion grammar
- Cameras: sine ease over the whole shot. Panels slide 24 px up while fading (0.3 s, cubic out). Tags scale .92 → 1.
  Brackets draw their line over the fade. Icon tiles pop 6 % on their beat. The big number lands with a back-out.
- Readout: hold the value until the action, amber + chevrons bobbing 3 px at 5 Hz, then count with the real geometry
  (the sample computes the gap from the arm angle) and stop exactly on the result word.
- Glows: sensors pulse (exp bell, 0.35–0.45 s), rings expand and fade (1.4 s), dotted arcs draw in 0.8 s.

## 7. Caption system
- `tools/build.py` turns `vo/data/vo.json` into `assets/lib/timing.js`: lines, display words (with digit
  substitutions), and phrases of ≤ 4 words/24 characters broken at punctuation. A phrase is on from its first word −
  0.08 s until the next phrase (same line) or its last word + 0.6 s. `out/<key>.srt` is written from the same data.
- The HUD composition rebuilds the caption box only when the phrase or the number of spoken words changes.

## 8. Sound
- The source has an original music bed (~117 BPM by beat tracking, low-end swells at 4–8, 24–28 and 48–52 s) under a
  dry male narrator. **Never** use the source's audio or a commercial track in the file (`POST.md` suggests an
  in-app library track instead).
- `tools/sound_design.py`: A-minor pad (Am–F–C–G), sub pulses in 8ths, a 16th arpeggio from the map shot, half-time
  kick under the physics, four-on-the-floor from the action to the seal, a brighter C-major turn for the result;
  energy curve by section; ducked under the voice (−45 % envelope). SFX: whoosh on every cut, two-tone status
  beeps, sonar pings (sensor/brain), panel blips, water rush, metal groan for moving parts, a deep thud on the seal,
  counter ticks while the readout counts, tile pops, a chime on the result.
- Mix: voice 1.0, music 0.2, SFX 0.26 → voice ~11–14 dB over bed+SFX; `audiolib.master` at −14 LUFS, ceiling −2 dBTP
  (AAC adds ~0.5 dB). `score/nomusic.wav` = the same mix without the music stem; `out/<key>_nomusic.mp4` is a remux.

## 9. Retention devices
- First word ≤ 0.2 s over a moving shot with the HUD on; the status flips on the hook's action word.
- **Flash-forward hook**: the action starts in the hook, then the film rewinds (status back to normal) and earns it.
- The readout sits on screen all film and pays off at ~80 %.
- A new visual event every ~2 s (cut, tag, bracket, bar, tile, counter).
- Result counters on the last line; the last frame holds them green.

## 10. Do / don't
- **Do** keep the HUD, the pill and the caption box on every frame; keep cyan = system, red = threat, amber = action,
  green = result; show one real photo with its licence on screen; put both sources for every number in FACTS.md.
- **Do** frame with `camfit.py` and check every shot in a snapshot before rendering.
- **Don't** show an operator's logo, a brand on a ship or a train livery (crop it out of the photo); don't claim
  "first"/"biggest" unless no source disagrees; don't let a tube glow fill the frame (keep lane radius ≤ 0.25 units at
  ~120 units camera distance).

## 11. Code recipe
```bash
cp -r ~/.claude/skills/explainer-engineering-hud/assets/template my-reel && cd my-reel     # 3-shot demo
# 1) vo/script.json (lines with ids), tools/film.json (key, subs, phrase limits, cover_t, hand_cuts_per_min)
python -X utf8 -I <engine>/audio/tts.py vo            # Kokoro -> vo/audio/vo.wav, vo/data/vo.json
python -X utf8 -I tools/build.py                      # -> assets/lib/timing.js, out/<key>.srt, root duration
python -X utf8 -I tools/make_geo.py <natural-earth-dir>   # map rings -> assets/lib/geo.js (edit LON0/LAT0/BOX)
# 2) assets/lib/film.js: shots (id, t0 from word onsets, set, loc) + story state functions (status, readout, ...)
#    compositions/world.html: sets + CAM table + per-shot state; compositions/hud.html: HUD, pill, panels, captions
python -X utf8 -I tools/camfit.py cams/<shot>.json   # fit a camera; paste {p,t,f} into CAM
python -X utf8 -I tools/sound_design.py               # -> assets/audio/final.m4a + nomusic.m4a, score/levels.json
npx -y hyperframes@0.8.210 check --json && npx -y hyperframes@0.8.210 snapshot --at <one time per shot> --no-end -o scratch/snap
bash <render_locked.sh> "$PWD" out/master_r1.mp4 delivery           # shared lock if the machine is shared
python -X utf8 -I tools/qa.py encode out/master_r1.mp4             # CRF 19 + AAC, nomusic remux, cover.jpg
python -X utf8 -I <engine>/qa/analyze_video.py out/<key>.mp4 out/qa
python -X utf8 -I tools/qa.py qa <source metrics.json> <source hand cuts/min>   # sweeps, dips, Whisper, gates.json
```
- `world.html` pattern: three.js 0.186 via the import map in `index.html` (`t3-loader.mjs` exposes `window.T3`);
  `window.__hf.buildReady.world` builds everything once; `render3(t)` is a pure function of t (shot → set visibility,
  camera, state, DOM anchors via `project()`), registered on a paused GSAP timeline and on `hf-seek`.
- Sets live far apart in one scene (`x = ±5000`, `z = 5000`) and are toggled per shot; fog distances per shot.
- 3D-anchored tags and brackets are DOM in `world.html` positioned from projected points after
  `scene.updateMatrixWorld()`.

## 12. Gotchas met on the sample
- **Real proportions don't fit a 9:16 frame.** At ~120 units, the frame is ~45 units wide. Fit cameras
  (`camfit.py`), and move secondary props (the brain building, the coast) closer than reality for composition.
- **ACES crushes a navy night to black.** Use NeutralToneMapping and a bright hemisphere (1.9) with dark albedos.
- **Glow tubes read huge in close shots** and vanish in wide ones: size them for the median camera distance and keep
  halos at 14–16 % opacity.
- **Extruded shapes**: `ExtrudeGeometry` on a plan polygon needs `rotateX(-π/2)` with z negated; material index 0 is
  the caps (top), 1 the sides. Douglas–Peucker on a closed ring returns two points unless you split it first.
- **The physics block** must sit in the upper-middle of the frame (render 1 put it behind the captions): fit the
  camera with the block's front corners as `want` points around y 780–1120 (`tools/cams/section.json`); give the
  water face vertex colours at least (0.07, 0.2, 0.32) or it reads black.
- **Hide the chevrons** once the readout reaches its end state (they mean "still decreasing").
- **The trigger close-up blows out** with a big sprite and bloom: keep the halo ≤ 1.6 units and ring halos ≤ 0.12.
- **Lint**: every composition needs its own `@font-face` for non-bundled fonts; text under 28 px is only a warning.

Files: `references/sources.md` · `tools/` (build.py, make_geo.py, camfit.py, camproj.py, sound_design.py, audiolib.py,
qa.py, film.json example) · `assets/template/` (runnable 3-shot demo) · `assets/sample/` (the full Maeslantkering
project: compositions, film.js, tools, vo script, FACTS/SCRIPT/SAMPLE/POST; no rendered media and no third-party
photo).

## Appendix A — source analysis (`DfYdn-mSWSg`)
65.92 s, 1080×1920, 30 fps · 172 words, 156.6 WPM · −14.1 LUFS · brightness 0.173, colourfulness 24.2, 100 % dark
frames · palette `#1b2430` 25 %, `#0b1e2b` 24 %, `#080d15` 20 %, `#0b141c` 18 %, `#0f1923` 7 %, greys `#757e81`,
`#35454d`, `#d5d2c9` · motion mean 2.61 (p90 3.77), 3 % held frames · music bed ~117 BPM · narrator median f0 ~132 Hz.

| t (s) | shot | what happens |
|---|---|---|
| 0.0–8.0 | hook diorama | train on a viaduct, a sensor on an islet with a dotted arc to the train; HUD flips LIVE → CUT at 1.5 s, the speed turns amber with chevrons; red wave line crosses; brake lights |
| 8.0–14.0 | map | the region rotating, red epicentre ring pulses at 9 s; pill changes to the line's name at 11.5 s; CC BY-SA photo inset 12–14 s with the credit under it |
| 14.0–17.8 | close | the train side-on under the cyan power line |
| 17.8–28.0 | cut-away block | concentric red rings from a buried focus; labels for the fast weak wave and the slow strong wave; camera orbits |
| 28.0–30.2 | operator card | a white card over the track (the source shows a logo; we use text) |
| 30.2–33.8 | sensors | sensors along the coast and track with thin lines to the track |
| 33.8–38.2 | sensor close | the islet sensor; its glow blooms with a ring at 37 s; pill changes to the islet's name |
| 38.2–42.6 | wide | red arcs arrive, cyan goes grey; status flips at 39.5 s; a bracket ≈160 km with place names |
| 42.6–46.4 | macro | the bogies; brake lights glow amber; chevrons appear |
| 46.4–50.4 | panel | CUT dot bar vs SHAKING red bar with an amber hatch; ~10 s in amber |
| 50.4–53.4 | wide | the strong wave sweeps; a red "~1 min" tag |
| 53.4–58.0 | tracking close | speed counts 270 → 100 (54.5–56 s) |
| 58.0–65.9 | wide + panels | a 9×3 grid of train icons fills amber; at 62 s two counters (0 / 0), icons turn green at 63 s, second counter green at 64.5 s |

Caption timing: phrases of 2–5 words appear 0.05–0.1 s before their first word; words switch grey → white on their
onsets; the box is centred at y 1472 (we move it to 1236).

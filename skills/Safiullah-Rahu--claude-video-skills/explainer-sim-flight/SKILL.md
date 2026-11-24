---
name: explainer-sim-flight
description: Makes vertical (9:16) game-engine-look photoreal aircraft / vehicle explainer reels in code, in the format of @detailfuse's helicopter-to-jet reel (DfAgNpXAL9p) — one aircraft flown through chase-cam, flyby and orbit shots over desert scrub, forested hills, misty pines, rocky mountains, a cloud sea and snowy peaks with motion-blurred ground, sun haze and spinning-rotor blur; comparison shots (another aircraft, a fighter on afterburner); in-world mechanism shots; white DIN captions of 2–6 words at ~69 % height, a small channel mark top-left, a dark info card (name + one-line spec), an "Illustration based on … imagery" note, Recreation/Illustration tags and one picture-in-picture card; one calm male narrator at ~160 WPM over aircraft ambience (no music); ends on its opening shot. Use for "sim-flight style", "DetailFuse-style", "flight-sim / Unreal-look aircraft explainer", "X-plane explainer reel", "how this aircraft works" shorts, military/aerospace/vehicle tech explainers, any 9:16 photoreal 3D machine explainer built without footage. Real three.js PBR renderer (terrain, instanced trees, analytic sky + aerial perspective, shadows, velocity motion blur, bloom, grade) inside HyperFrames. Builds on explainer-engine.
---
# Sim-flight — game-engine photoreal aircraft explainer reel

A 95–100 s vertical reel that looks like flight-sim footage: one aircraft, always the hero, filmed by chase rigs that
keep it nearly still in frame while the ground streaks past in motion blur; a hard cut on almost every sentence; a calm
male narrator explaining the machine step by step; tiny, quiet chrome (channel mark, DIN captions, an info card, an
"Illustration based on …" note). Built from frame-by-frame analysis of 1 source reel (references/sources.md,
references/analysis.md). The sample is NASA's X-59 (`assets/sample/`). Original work only: own channel mark,
own script, every fact sourced, every recreated scene tagged.

## 1. Signature traits
- **Chase-cam hero**: the aircraft sits in the upper half, sharp, 3/4 rear or side; the near ground streaks (camera +
  object velocity motion blur, long shutter). Every shot moves; nothing holds still.
- **Environment rotation**: desert scrub → forested hills → green hills → runway → pines in dawn mist → canopy from
  above → rocky mountains → cloud sea → river canyon → dusk illustration → snowy peaks → back to the desert (loop).
- **Hard cuts only**, ≈0.28 s before the sentence they illustrate; 25–28 shots; median scene ≈ 3 s.
- **Mechanism in-world**: parts move on the model, effects live in the scene (shock-wave shells, glowing pressure rings,
  afterburner flames, spinning-prop discs) — never diagrams, arrows or labels.
- **DIN chrome**: white semibold DIN captions (2–6 words, hard swap on the first word, soft dark shadow) centred at
  0.692 H; mark top-left; dark info card with a coloured bar on reveals; thin-bar "Illustration based on … imagery"
  note; "Recreation" / "Illustration" tags; one PiP card.
- **Sound**: one calm male VO (~160 WPM), no music — aircraft ambience (rumble, wind, turbine whine, prop drone,
  afterburner roar, booms) switching with the cuts, ~16 dB under the voice, −14 LUFS.
- **Loop ending**: the last line plays over the opening shot.

## 2. Target metrics (source DfAgNpXAL9p → sample `assets/sample/out/qa/metrics.json`, render v3)
| metric | source | gate | sample |
|---|---|---|---|
| duration | 97.98 s | ±10 % | 98.99 s ✓ |
| scene changes / min | 14.7 | ±15 % | 15.76 ✓ (+7 %) |
| median scene length | 3.0 s | ±15 % | 3.34 s ✓ (+11 %) |
| WPM (overall) | 161.1 | ±10 % | 157.6 ✓ |
| colourfulness | 39.5 | ±12 % | 36.0 ✓ (−9 %) |
| brightness | 0.443 | ±12 % | 0.462 ✓ (+4 %) |
| motion mean | 12.93 | ±20 % | 10.88 ✓ (−16 %) |
| loudness | −14.1 LUFS | ±1 LU | −14.4 ✓ |
| hard cuts / min (not gated) | 11.0 | — | 6.1 |
All eight gates pass. History: render v1 had median scene 3.66 s (a same-environment cut merged two scenes) and a
river-bank shot blocked by a tree; v3 re-staged every cut as a change of environment, angle or light (every cut now
registers, d ≥ 0.33) and every shot passes the `K.audit` framing/occluder check. Not gated but off: the analyzer's
hard-cut detector (ffmpeg scene score) finds only 6.1 cuts/min although the film has 27 hard cuts — cuts between two
motion-blurred views with similar luminance score below its threshold; motion is the tightest gate (whole aircraft in
frame + iGPU-friendly speeds); saturation +8 %.

## 3. Script formula
Beat map (% of runtime): hook — the impossible-sounding feat in one sentence (0–5) · reveal + who built it, info card
(5–10) · contrast pair "A … can …, but … / A … is …, but …" → "This one does both" (10–19) · the rule/problem it solves
(19–24) · mechanism in 5–7 one-shot steps (24–55) · what it is for, illustration scenes (55–68) · "The hard part is …"
(68–71) · history: who tried before, recreation + card (71–76) · the tests that proved it, recreation + cards (76–94)
· next step + date over the opening shot (94–100).
Lines 4–17 words; concrete numbers (speeds, years, altitudes) with attributions ("NASA says"); no rhetorical questions.
Voice: Kokoro `am_michael`, speed 1.24, lead 0.12 s, gaps 0.15–0.35 s (tts.py adds ~0.2 s of trim margin) → ~158 WPM.
Captions are hand-chunked per line in `film.json` ("In 1973," / "the U.S. banned" / "civilian supersonic flight" /
"over land."). Every fact goes in `FACTS.md` with its URL and date checked.

## 4. Visual system
- Palette is the world's, not a brand's: warm desert #a9875f–#cdb08a with scrub #2e2c19; olive-green canopy
  #3a5418–#64852a with shadow #1b2e10; sky zenith #3f6aa6 → haze #cdb498 (warm) / #aebcc4 (cool); cloud sea
  #c6c5c4–#f3f2ef; dusk zenith #1b3572 → horizon #ff9850. Grade per env (`grade:` in sim-envs.js) + a master
  display gain 0.88 / gamma 1.1 (brightness ≈ 0.45 like the source).
- Type (Bahnschrift = DIN; declared with `src: local("Bahnschrift")`): caption 600 59 px, line-height 1.3, #f3f3ef,
  max-width 720 px, centre y 1329 px; mark 34 px + 47×54 icon at (46, 163); card title 600 40 px, spec 400 31 px
  #d0d0cd, box at (48, 276) h 105 px, fill rgba(23,24,27,.94), 8 px bar (#e8892b hero reveal, #f2f2f2 others); note /
  tag 600 30 px in a 56 px box at (40, 1120), note bar 5 px #c9c9c6; PiP image 984×555 at (48, 285) in a 9 px #141518
  frame + 98 px title band.
- Safe zones: nothing important below 0.75 H (captions sit at 0.69 H) or right of 0.96 W.
- Lens: bloom (threshold ≈1.1), vignette 0.28–0.34, chromatic fringe 0.6, grain 0.022, ACES.

## 5. Characters & objects (assets/kit)
- `SIM.create({canvas,width,height,scale,maxEnvs})` → K. `K.env(name, spec)` registers a landscape built lazily (≤2
  live; older ones are disposed). Spec: `sun {az,el,color,i}`, `hemi`, `sky {zenith,haze,sunHaze,hazeI,glow,cirrus,band,lift}`,
  `fog {d,fall,max,mist,mistFall}`, `grade`, `terrain {h(x,z,N), half, res, pow, layers:[{tex:{cols,cells,spots,ridged,…},scale}],
  rock, patch, snow}`, `veg:[{type:"broad|pine|pine2|spruce|scrub|grass|rock", n, area, scale, cols, density, maxSlope}]`,
  `build(group,K,h)`. Trees are merged lumpy crowns (position-hash displacement, sphere normals, vertex-colour AO and
  mottling): `broad` (6 clumps), `pine` (tiered), `pine2` (Scots pine: bare trunk, flat clumps on top), `spruce`
  (cone to the ground); cluster them with a density function (`forestD`) and mix species for varied silhouettes.
- `K.render(state)` extras: `heat: [{p, r, k}]` (screen-space heat shimmer behind nozzles, in the blur pass), `inset`
  (PiP from a second camera), `roll`, `blur`, `maxBlur`, `shadowAt/shadowExt`, `near/far`.
- `K.audit(state)` → `{box, inFrame, margin, size, camAGL, blocked}`: projects the hero's vertices (framing, crop), marches
  the height field (camera under terrain, terrain between camera and hero) and tests instance bounding spheres
  (trees between camera and hero). Run it at 5 times per shot before any render (`auditAll()` in the test page).
- `SIM_CRAFT(K)` → C: `C.x59()` (loft fuselage with vertex livery, canopy bubble, top nacelle + inlet + nozzle,
  cranked-delta wing, canards, stabilators, fin + T-tail, decals, gear group), `C.fighter({twin,len,paint})`
  (afterburner `ab(level,t)`), `C.turboprop()` (prop discs `spin(t)`), `C.rotorDisc(R,blades,col)`,
  `C.shock(parent,{mach,len,at,strength})` (Mach-cone shell), `C.ring(parent)` (pressure ring), `C.decal`.
  `C.fighter({twin:true})` is an F-15-like airframe: chined loft, raked intakes with dark mouths + splitter plates,
  cropped-delta wing, dogtooth stabilators, canted twin fins with rudder lines, framed bubble canopy, 14-petal titanium
  nozzles with inner glow, gear group (`userData.gear`), nozzle positions (`userData.nozzles`) for heat shimmer;
  `{twin:false}` gives an F-5-like single-fin airframe.
  `C.loft`, `C.surface` (planform extrude), `C.finGeo`, `C.fly(obj,p,dir,bank,pitch)`, `C.local(obj,x,y,z)`.
- Materials: `C.paint(color,{vc,rep,clearcoat})` = MeshPhysical + panel-line normal/roughness canvas maps, hero mask.
  Any material you add must go through `K.patch(m, {hero})` (aerial perspective; hero = alpha 0 for motion blur).
- Ten envs in `sim-envs.js`: desert (runway with edge lines, centre dashes, TDZ bars, aiming point, piano keys, "22",
  rubber deposits and joints; apron, hangars, tower, edge lights), hills (clustered mixed forest + grass/scrub around the
  comparison camera, detail-noise normal maps, thicker aerial haze), pines (dawn: sun low ahead for backlight, ground-fog
  layer `mist 0.008 / mistFall 0.35`, Scots pine + pine + spruce mix, fine grass), rocky, clouds, stratos (high-altitude
  sky over a near cloud deck, for record-flight shots with ground motion), river, dusk (town + microphones), snow, high.

## 6. Motion grammar
| move | how | numbers |
|---|---|---|
| chase | camera = `C.local(craft, dx, dy, dz)`, look = local point ahead/below | craft 120–260 m/s, 20–45 m AGL, fov 40–52 |
| side tracking | camera beside + slightly ahead, long lens | 45–75 m off, fov 26–38 |
| flyby | static/slow camera, craft passes | blur 0.6–0.8 |
| orbit close-up | `a = a0 + u·0.2–0.4 rad/s` around the craft | 25–45 m |
| bank drift | `bank = b0 + 3·sin(0.7 t)` | ±3–14° |
| chrome | card fade 0.16 s power2.out + 5 px slide; note/tag 0.12 s; inset 0.15 s | out on the next cut |
Motion blur: `blur` 0.4–1.0 (shutter fraction), `maxBlur` 0.07 UV; the first frame after a cut has no history.
Motion metric: only a camera moving against near, textured ground raises it. Static cameras, sky backdrops and smooth
water read as "still" (sample: static runway camera 2.7, 55,000-ft orbit 1.9, low chase over scrub 13–15). Keep the
whole aircraft in frame (audit `inFrame` ≥ 0.97) and get motion from speed and low altitude, not from tight crops.

## 7. Transitions
Hard cut only (`add(t0, name, fn)` in sim-shots.js; t0 = line start − 0.28 s or a word − 0.1–0.3 s). Every cut must
be a real change of view, as in the source: a different environment, angle or light, so that the colour histogram of
1 s windows jumps by ≥ 0.3 (`scenes.py` prints d per cut; < 0.3 merges two scenes). Same-env neighbours need a
different sky/ground split (looking up vs down, deck vs deep-blue sky). Avoid internal histogram jumps (a camera
panning across the sun, flashing rings, a craft filling the frame) or they count as extra scenes. Last shot re-uses
the opening shot's function (`desertChase(t, offset)`).

## 8. Sound
`tools/ambience.py` synthesizes the bed per shot (jet = rumble + wind + ~6 kHz whine; prop drone; afterburner; wind;
crickets; high) plus events (double-crack boom, soft thump, whoosh) → `score/audio/bed.wav`; `sound.json` uses it as
`music_file` with `duck_db 2`, `music_under_voice_db −15`, `lufs −14.1` (engine sound.py). Measured on the sample:
speech −15.7 dBFS RMS, pauses −30.4 dBFS (source −14.5 / −31.1).

## 9. Build recipe
```bash
cp -r ~/.claude/skills/explainer-sim-flight/assets/template my-reel && cd my-reel
cp ~/.claude/skills/explainer-sim-flight/assets/kit/*.js assets/lib/        # sim-kit, sim-craft, sim-envs
# 1) vo/script.json (lines l01..), voice + check
$EXPLAINER_PY -I ~/.claude/skills/explainer-engine/engine/audio/tts.py vo
# 2) film.json: caption chunks, chrome (cards/notes/tags/inset), ambience per cut, events
# 3) assets/lib/sim-shots.js: one add(t0, name, fn) per shot (patterns: assets/sample-x59/assets/lib/sim-shots.js)
python -I tools/build_sim.py
$EXPLAINER_PY -I tools/ambience.py && $EXPLAINER_PY -I ~/.claude/skills/explainer-engine/engine/audio/sound.py score
ffmpeg -y -i score/audio/final.wav -c:a aac -b:a 256k assets/audio/final.m4a
# 4) drafts: shot audit + 2 fps sheets + 6 fps metric estimate in headless Edge (assets/sample-x59/tools), then SIM_SCALE = 0.5 snapshots
npx -y hyperframes@0.8.210 lint && npx -y hyperframes@0.8.210 snapshot --at 1,6,12 --timeout 120000
# 5) final: SIM_SCALE = 1, one render
npx -y hyperframes@0.8.210 render -o out/reel.mp4 -q delivery --workers 3
```
Vertical 9:16 is native. For 16:9: set W/H to 1920×1080 in build_sim.py, widen fovs ~1.6× (vertical fov stays
similar), move captions to y ≈ 0.80 H and the card to the top-left at the same pixel sizes.

## 10. QA checklist
- Shot audit before any render: `auditAll()` → every shot `inFrame` ≥ 0.97 (whole aircraft readable; intentional
  close-ups excepted), `blocked 0`, `camAGL` > 1 m. Then a 2 fps contact sheet of the whole film (`check_sheets.py`
  on a headless export) and again on the rendered MP4: look for occluders, empty frames, cropped aircraft, cameras in
  terrain, translucent shock shells sweeping across the lens.
- Stills: hero sharp; near ground streaked; horizon/sky present in chase shots; card text fits one line; note and tag
  never overlap captions; PiP image sits inside its frame.
- Gates (§2): run `engine/qa/analyze_video.py`; before the one full render, estimate on a 6 fps headless export
  (copy `assets/sample-x59/tools/{test.html,server.py,headless.mjs,estimate.py,scenes.py,shotmotion.py}` into `<project>/scratch/`; `python -I scratch/server.py 8732`, then `node scratch/headless.mjs "return auditAll();"`) — brightness and median scene length are the fragile ones.
- Do: tag recreations and illustrations; put every number in FACTS.md; keep one aircraft the hero.
- Don't: embed agency logos or photos; use diagrams/arrows; let a camera sit inside a shock shell (big translucent
  planes); cut on dissolves.

## 11. Gotchas (hit on the sample)
- **Intel iGPU + MSAA + FloatType depth texture = garbage frames** (magenta speckles, streaks). Use the default
  `UnsignedIntType` depth (24-bit) — `depthType: "float"` only on other GPUs.
- `patch` is a reserved word in GLSL ES 3.0 (tessellation) — a uniform named `patch` silently kills the terrain shader.
- `PMREMGenerator.fromScene` leaves a stale viewport on the default framebuffer: the kit resets it before the final pass.
- A ring built with `CircleGeometry.rotateX(-π/2)` must read `position.xz` in its shader, not `.xy`.
- A hidden Browser pane throttles the page (3 s/frame); drive the test page with headless Edge and these flags:
  `--use-gl=angle --use-angle=d3d11 --enable-webgl --ignore-gpu-blocklist` (otherwise SwiftShader).
- Building all nine envs in one page runs an iGPU out of memory: `maxEnvs: 2` disposes the least recently used.
- HyperFrames lint needs `@font-face { font-family: "Bahnschrift"; src: local("Bahnschrift"); }` for system fonts.
- Shock-shell band animation with high contrast creates histogram flicker that the scene-change metric counts as cuts.
- Exposure alone barely lowers the brightness metric (ACES shoulder on skies/clouds); use the master display gain.
- Ground cameras must clear the instanced vegetation: the first sample render had a tree crown filling half the frame in
  a river-bank shot (and no aircraft visible). `K.audit` now catches it (`blocked`); keep vegetation density 0 within
  ~150 m of a fixed camera (`Math.hypot(x - cx, z - cz) < 170 ? 0 : …`).
- Pulling cameras back to show the whole aircraft lowered the motion metric from 10.6 to 9.2; it came back (11.1) only
  with faster, lower flight over textured ground and a near cloud deck (`stratos`) for the high-altitude shots.
- A shock shell on a narrow, orbiting shot becomes a huge translucent sheet when the camera enters the cone: shorter,
  narrower cones (`mach: 2, len: 20`) and low strength for orbit shots.
- Shell heredocs containing Python triple quotes and `rm` of globbed paths are blocked here; write patch scripts to files.

Files: references/analysis.md · references/sources.md · assets/kit/ (sim-kit.js, sim-craft.js, sim-envs.js) ·
assets/template/ (3-shot demo, voiced and mixed, renders as-is: film.json, vo/, assets/lib/sim-shots.js, tools/build_sim.py,
tools/ambience.py) · assets/sample-x59/ (the X-59 sample's 28-shot sim-shots.js, build/ambience/compare tools, the headless
estimator, script.json, FACTS.md) · rendered sample: the sample film (the render is not included in this repository) (+ out/qa/compare.jpg)

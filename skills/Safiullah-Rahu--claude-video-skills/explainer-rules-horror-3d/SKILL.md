---
name: explainer-rules-horror-3d
description: "Makes a vertical 9:16 second-person 'rules' horror story reel (80-100 s) in realistic, physically lit 3D, in the format of a viral Instagram series (play.malo 'Subway Part 1', 480k likes): 'Imagine you…' plus isolation piled up in concrete facts (the exit shut, 2 % battery, no signal, the way out reopens at 06:00), a found rule card with the rest torn off, a smile that dismisses it, an exact time that triggers a light event, a sound that approaches and stops right behind you, a black twin revealed beside the hero, and two numbered in-scene choice labels (1 / 2) that jump to the top corners under 'So... what would you do?'. The hero is a posable two-tone mannequin with a drawn cartoon face (neutral, worried, scared, determined, hopeful, closed, annoyed, smile, shocked, sad); 12-13 hard cuts a minute across wides, over-the-shoulders, ECUs, phone/card/clock inserts and POVs; 2-3-word white heavy caps captions low-centre. Built in code with HyperFrames + three.js and a reusable kit: wet concrete with planar mirror reflections, raymarched volumetric haze lit by every fixture, fluorescent and sodium practicals, a PMREM of the set itself on glossy shells and car paint, soft shadows, half-res bokeh DOF, camera motion blur, bloom with anamorphic streaks, ACES grade, grain; a synthesized horror sound kit (room tone, tube buzz, slam, relay clunks, drone, wet drag, breathing, sting). Use for 'rules horror', 'what would you do story', 'second-person horror short', 'mannequin story reel', 'play.malo style', 'subway / garage / mall / hospital at night rules', 'choose 1 or 2 ending', 'Part 1 series horror', or any interactive scary micro-story; the mannequin and lighting kit also serve calm story reels (see §12). Builds on explainer-engine."
---
# Rules horror 3D — "Imagine you…", one rule, one light event, two choices

Reverse-engineered from one Instagram reel (**play.malo**, `DfIjwMcN-XQ`, "Subway Part 1", 98.8 s, 480,123 likes,
5,283 comments; `references/analysis.md`, `references/sources.md`). The format is a **second-person survival
micro-story with a found rule** that ends by handing the viewer the decision. The look is a realistic 3D location at
night with a white mannequin hero whose drawn face carries every emotion, and a black twin as the threat. Original
work only: our garage, our rule card, our two-tone mannequin (ivory shell, graphite joints, egg head, our face
drawing). Sample: `the sample film (the render is not included in this repository)` — "Level −4" (95.0 s).
Series samples (batch 6; these projects are not included in this release): `samples\rules-elevator\out\rules-elevator.mp4` — "Between Floors" (Part 2, 97.4 s: an
office elevator, a mirror that shows the twin, the doors open on Level −4) and `samples\rules-store\out\rules-store.mp4`
— "After Closing" (Part 3, 93.7 s: a generic furniture showroom at night, floor arrows that turn around). Each has SCRIPT.md,
SAMPLE.md (gates, what reads well, what is weaker), POST.md and out/qa/.

## 1. Identity (signature traits)
- **You are the character.** Present tense, second person, no names. The hero mannequin is "you".
- **Isolation in four concrete facts**, each with its own insert: the way in shuts behind you, a phone at 2–3 %, no
  signal, a sign that says when the way out reopens (05:30 / 06:00).
- **A found rule**: a sheet/card titled like staff instructions, "Rule 1: …", the rest torn off with rule 2 half
  readable (a rewatch hook). "You smile. It's probably a joke." Then an exact time (midnight) triggers it.
- **The light is the event** (a blackout in the source; rows of light turning red toward you in ours). Then a sound
  approaches, slows, and stops **right behind you**. The black twin is revealed standing behind the hero.
- **The choice ending**: "You have two choices." Two numbered pills pinned in the scene (blue 1, red 2) with leader
  lines to what they mean, then pinned to the top corners; the last caption is "So... what would you do?".
- **Realistic 3D, grey-lit then dark**: one location, wet glossy floor, fluorescent tubes, haze, signage that carries
  information, depth of field on every close shot.

## 2. Measured pacing targets
Source: engine analyzer metrics (analysed locally for reference only). Sample: the Level −4 render's `out/qa/metrics.json`
(the sample project is not included in this release).

| metric | source | sample | gate |
|---|---|---|---|
| duration | 98.75 s | 94.98 s | 80–100 s |
| WPM | 156.8 | 152.9 (-2.5 %) | ±20 % |
| scene changes / min | 12.15 | 14.53 (+19.6 %) | ±20 % (9.7–14.6) |
| analyzer cuts / min | 12.76 | 19.58 | — (real shots: source ≈ 40–45, ours 32) |
| brightness · dark-frame share | 0.242 · 0.667 | 0.337 · 0.389 | — (ours is brighter in the setup, darker after midnight) |
| colourfulness | 15.0 | 29.1 | ours higher by design (red phase), see §4 |
| motion mean | 7.26 | 9.14 (+25.9 %) | — (every shot moves; keep fast tracking out of dark shots) |
| loudness | −14.0 LUFS | -14.2 LUFS · -1.1 dBTP · bed 17.4 dB under | −14 ±1, TP ≤ −1 dBTP, voice ≥ 10 dB over the bed |
| first word · subject in frame 0 | 0.0 s · yes | 0.16 s · yes | ≤ 0.4 s · yes |

- Real shot count matters more than the analyzer's: ~32–45 shots in 95–100 s (median 2.2–2.7 s), with 3–5 long
  inserts (the card, a POV) of 4–6 s. The analyzer under-counts cuts between two grey or two dark frames.
- Narration ~250 words for 95 s: Kokoro `am_michael` at speed 1.08 (≈ 186 WPM while speaking), gaps 0.06–0.32 s,
  planned beats 0.5–0.8 s (after the slam, after "right behind you").

## 3. Beat map (% runtime)
| % | beat | source | ours (Level −4) |
|---|---|---|---|
| 0–4 | **Hook**: "Imagine you…" + the stakes in one sentence over a one-point wide of the lone figure | you missed the last train | "Imagine you get locked inside an underground garage." |
| 4–12 | **The way in shuts** (a flash/slam), place name on a sign | gates slam · station sign | the shutter slams · LEVEL −4 stencil |
| 12–15 | **Alone + open loop** | you are alone | "completely alone. And nobody told you the rules." (push to the lit booth) |
| 15–30 | **Isolation facts**, one insert each | 3 % · no signal · next train 05:30 · stuck for the night | 2 % · no service · lifts locked · barrier opens 06:00 · "the whole night down here" |
| 30–48 | **The found rule**: notice → the card → rule 1 → torn | driver's booth, a rule about empty trains | attendant booth, "If the lights turn red, do not run" |
| 48–54 | **Dismissal**: smile, walk away | a staff prank | "a joke for the new guy" |
| 54–60 | **Exact time → light event** | 23:59 → 00:00, every light goes out | 23:59 → 00:00, the far row turns red |
| 60–73 | **Approach**: something comes, slowly; the rule recalled | headlights, silent empty train, footsteps; the note again | rows go red toward you; something wet drags; the card again, rule circled |
| 73–83 | **It stops right behind you** + a body sensation | footsteps stop, warm breath | the drag stops, the twin is there, a cold drip on the shoulder |
| 83–96 | **Two choices** (labels in scene → top corners) | doors closing: GET ON / STAY | the exit shutter rises: RUN / STAND STILL |
| 96–100 | **"So... what would you do?"** on the hero's ECU, hold | | |

## 4. Visual system
| role | source (measured) | ours |
|---|---|---|
| setup light | grey fluorescent, `#7a7a77` walls, `#535350` floor | cool-white tubes `#eaf0ff` (rows of 3 battens, a spot per row), sodium wall packs `#ffa64a`, a warm booth lamp |
| dark phase | blue-black `#0b1013`, single sources | red rows `#ff2410` (tubes glow red, cage lamps on), the near rows stay white, the exit's cold light `#dce8ff` |
| accent | amber dot-matrix, red LED clock, red seats | the same three: amber dot-matrix board, red 7-segment clock, red as the rule colour (captions + light) |
| floor | glossy wet with streak reflections | sealed concrete (roughness 0.46–0.59) + 16 puddles (0.05) mirroring through a planar reflection |
| hero | white glossy mannequin, black drawn face | ivory shell `#e6e1d7` (clearcoat 0.32), graphite joints `#3b3e44`, egg head (1.06), face decal |
| threat | glossy black, white dot eyes | wet black `#060708` (clearcoat 1), emissive dot eyes ×7, falling drips |
| grade | soft, desaturated, vignette | ACES, sat 0.9 (0.84 red phase), vignette 0.42, bloom 0.13, streak 0.06–0.12, grain 0.04, CA 0.0016 |

- **Safe area**: captions at y 1268 px (66 %), labels inside x 6–94 %, top pills at y 214 px (11 %); nothing important
  below 80 %.
- **One focal light per shot**: every shot places `G.key` (a shadow-casting spot) on the subject; everything else is
  practicals. The colour accent is red only.

## 5. Characters (`assets/kit/rh3d-mannequin.js`)
- `RH3D.mannequin(K, { name, skin: "ivory" | "black", face: "neutral" | "glow", wet, eyeGlow, s })` → `man`.
- Skeleton (faces +Z, its left = +X, limbs hang along −Y): `root → hips → waist → chest → neck → head`,
  `chest → shL/shR → elL/elR → wrL/wrR → handL/handR`, `hips → hipL/hipR → knL/knR → anL/anR`. Signs: arm/leg forward
  −x, knee bend +x, elbow bend −x, head down +x, head to its left +y, left arm out +z.
- `man.set({ pos, ry, rx, pose, pose2, mix, walk: { phase, amt, run }, look: [yaw, pitch], lookAt: [x,y,z], face,
  face2, faceMix, faceAdd, blink, breathe: t, breathRate, breathAmt, add: { joint: [x,y,z] }, phone, phoneLight, tilt, t })`.
- **Poses** (`RH3D.POSES`): stand, tall, freeze, phone, phoneUp, phoneEar, reach, point, shrug, palmOut, holdCard,
  cower, lookBack, slump, sitLow, sitChair, type, lie, liePhone, handGlass, armsCrossed, headDown. Blend two with `mix`;
  `RH3D.gait(phase, amt, run)` adds a walk/run cycle (one stride = 2π, ≈ 1.38 m).
- **Faces** (`RH3D.FACES`, drawn on a 512² canvas, numeric and blendable): neutral, worried, scared, determined,
  hopeful, closed, annoyed, smile, shocked, sad, glow (the twin's dot eyes). The decal is a spherical cap with planar
  UVs, so the drawing keeps its proportions from the front; it redraws only when parameters change.
- Helpers: `man.at(bone, offset)` world position (camera paths, props), `man.eyes()`, the phone (`man.phone`,
  `man.phScreenM` takes a canvas texture from `RH3D.phoneScreenTex` + `RH3D.phoneUI`).
- Character sheet: `assets/kit/character_sheet.jpg` (every face and pose).
- Crowds (added for `motivation-ten-years`): `mannequin({ skin: "grey", face: "blank", lod: 0.4 })` builds a
  cheap faceless figure; `RH3D.mergeFigure(K, man)` → `{ shell, joint }` geometries for an `InstancedMesh`
  (`RH3D.instancedFigures` in `rh3d-rooms.js`). Pose the proto once per crowd posture (stand, heads-up, seated).

## 6. Transitions
| name | build | when |
|---|---|---|
| hard cut | `t0 = word onset − 0.06 s` | every shot; 0 dissolves |
| slam flash | `flash` 0.5 → 0 over 0.2 s + `shake` 1.1° decaying 6/s, motion blur 0.7 | the way in shuts |
| light event | rows switch with a 0.36 s tube flicker (`FLK`) then red ramps in 0.26 s, keyed to words | the trigger and each "next row" |
| drop-out reveal | every red lamp drops to 4 % for 0.22 s (exposure 0.25) and returns with the twin in frame | "right behind you" |
| rack focus | `focus` lerped between two distances inside one shot | noticing something |
| label move | pinned pills → top-corner pills on the next cut | the second choice line |

## 7. Motion grammar
- Every shot moves: a 0.3–1.4 m dolly or push over its length (eased), plus hand-held drift (`RH3D.handheld`,
  amplitude 0.5–1.4). Inserts drift 2–10 cm. POVs get amplitude 1.4.
- Characters: breathing always on (0.24 Hz; 0.6–0.8 Hz when scared), blinks on beats, head looks with `lookAt`,
  expressions blend over 0.3–0.6 s. Walks are tied to distance (no foot slide), ramp height from `rampY(z)`.
- Light changes are events, keyed to words, never decoration. Faces stay readable (luma ≥ 0.25) in the dark phase:
  the near rows stay white and the key is a warm-white spot.

## 8. Caption system (`tools/build_film.py`)
- 1–3 words, ≤ 15 characters, a break after every punctuation mark, a dangling function word carried forward;
  numbers spelled as spoken ("TWO PERCENT").
- Montserrat 800, 84 px, uppercase, white, `text-shadow 0 4px 14px rgba(0,0,0,.62)`, no box, centred at y 1268,
  a 1.06 → 1.0 pop over 3 frames on the word onset; held until the next caption (contiguous), out 0.45 s after the last
  word when a pause is longer than 0.7 s.
- Accent words in red `#ff3b30` (`film.accent_words`: red, run, rule, one.).
- Choice labels (world overlay canvas): dark pill `rgba(12,12,14,.9)`, 3.5 px white border, radius 16, number disc
  (blue `#2f7cf6`, red `#ff3b30`), Montserrat 800 38 px, leader line 3 px white ending in a ringed dot at the projected
  3-D target; then both pills at the top corners (y 214) to the end, pulsing on their spoken word.

## 9. Sound (`tools/garage_bed.py` → engine `sound.py`)
| layer | level vs voice | when |
|---|---|---|
| room tone (ventilation rumble, air, mains, fan) | −30 dB | always |
| tube buzz (120 Hz + harmonics, crackle) | −34 dB × share of white rows | until the red reaches you |
| footsteps (concrete, garage reverb RT60 2.6 s) | one-shot | walking shots |
| shutter fall rattle + slam (thump, inharmonic clang, rattle) | peak −5 dB | the slam |
| phone chirp · dead call button · midnight double beep | −8 dB | inserts |
| relay clunk + flicker ticks per row, louder as rows get nearer | peak −5 dB | each row switch |
| red drone (41.2/41.6 Hz beating, 55 Hz, noise breath) | −22 dB | from the first red, dips on the reveal |
| wet drag (slow pulls, brighter and louder as it nears) | −17 dB | "you hear it" → "stops" (dead stop) |
| heartbeat 72 → 92 bpm | −22 dB | "Slow." → the reveal |
| reveal zap + sting · final hit | peak −5/−6 dB | the reveal · "do?" |
| breathing behind (close, panned right) | −18 dB | the reveal → end |
| drip plip (close) | −8 dB | "drips" |
- The voice copy is peak-limited (look-ahead 4 ms, release 60 ms) so loudnorm stays linear; `music_under_voice_db` is
  computed so the engine keeps these relative levels; −14 LUFS, TP −1.5 dBTP. The bed sits 17.4 dB under the
  voice while speaking. No music, no melody.

## 10. Retention devices
- Hook ≤ 0.4 s with the stakes in the first sentence; frame 0 = the figure in the place.
- Open loop by 15 %: "nobody told you the rules" (ours 14.8 %), paid at 36–47 %.
- An insert or event every 2–4 s; escalations at most 8 s apart (the Level −4 sample's SCRIPT.md shows this; the sample is not included).
- A visible speed for the threat (rows switching toward you, the trail growing) so the viewer counts down with you.
- The callback (the card again, rule circled) right before the turn; the turn at 75–87 %.
- The dilemma must pit the rule against instinct (don't run ↔ the exit opens); the labels make the comment a vote.
- Rewatch hooks: rule 2 half readable; the trail visible in backgrounds before the reveal.
- Post caption: "Part 1 · Comment 1 or 2" (the series promise).

## 11. Do / don't
- Do: keep every event on a narration word; keep the twin unseen until the stop; keep faces readable in the dark;
  put signage in the world (phone, card, clock, board) instead of overlays.
- Don't: gore, injury, weapons, real places or brands; jump-scare noise blasts (the sting stays ≤ −5 dB re voice);
  dissolves; captions over a face (keep eyes above y 1180 in ECUs); more than one accent colour.

## 12. Code recipe
```bash
ENGINE=~/.claude/skills/explainer-engine/engine; PY="$HOME/.generative-music-video/venv/Scripts/python.exe"
cp -r ~/.claude/skills/explainer-rules-horror-3d/assets/template "samples/my-rules"   # runnable 15 s demo
cd "samples/my-rules"
# 1) vo/script.json (engine tts.py format; "film" block for caption options); voice it, check it
"$PY" -I "$ENGINE/audio/tts.py" vo
# 2) the film: assets/lib/film-shots.js — FILM(K, V) builds the set (RH3D.garage or your own), the cast, bakes the
#    environments, and returns { shots, reset, post, overlay }. Shots: { t0: cut(line, word), cam: [from, to],
#    look: [from, to], fov, focus, aperture, hand, ease, path(t), shake(t), fn(t, u) -> render state }.
#    reset(t) poses the WORLD from t only (frames render out of order); fn poses the cast; post reads bone positions.
# 3) captions + world player + index + SRT
python -I tools/build_film.py
# 4) sound: bed + limited voice, then the engine mix
"$PY" -I tools/garage_bed.py            # cues come from vo/script.json "sound_cues"; missing cues skip their layer
"$PY" -I "$ENGINE/audio/sound.py" score
ffmpeg -y -i score/audio/final.wav -c:a aac -b:a 256k assets/audio/final.m4a
# 5) look before rendering: snapshots per shot (cheap, ~1.5 s a frame)
npx -y hyperframes@0.8.210 snapshot --at <mid-time of each shot> --no-end -o scratch/snap
# 6) render through the shared lock (≈ 0.3 s a frame on the iGPU with 2 workers)
bash "tools/render_locked.sh" "$PWD" out/<name>.mp4 delivery
# 7) QA
python -I "$ENGINE/qa/analyze_video.py" out/<name>.mp4 out/qa      # SRT beside the mp4 gives WPM
python -I tools/qa_sheets.py all [--ref <reference.mp4>]   # 2 fps sweep, YAVG dips; compare.jpg only with --ref (edit BEATS; copy from assets/tools/)
python -I tools/whisper_check.py          # Whisper small vs the script (an interpreter with faster_whisper)
```
- **Kit modules** (`assets/kit/`): `rh3d-core.js` (renderer, materials, canvas textures, concrete generator, lights
  registry, PMREM-of-the-set env bakes, wet floors, fixture glow, volumetric haze, DOF, motion blur, bloom/streak,
  grade), `rh3d-mannequin.js` (§5), `rh3d-props.js` (phone UI, rule card, dot-matrix LED, 7-segment clock, tube and
  cage fixtures, procedural cars, contact shadows, floor decals), `rh3d-garage.js` (the Level −4 set: rows that switch
  white/red, ramp + shutter + beacon, barrier, booth, lifts, cars, wet trail, two shadow keys, env bakes),
  `rh3d-rooms.js` (calm story sets, from build E: `RH3D.bedroom` with `R.state("evening" | "future" | "morning")`,
  a window sun/moon through the haze, a lamp, a 7-seg clock, a dated calendar and a wardrobe mirror with a
  reflection double `RH3D.mirrorDouble(man2, pose, R.mirror.x)`; `RH3D.office` night cubicles with instanced
  seated workers; `RH3D.crowd` a fog field of 130 instanced faceless figures; `RH3D.photo(K, cam, w, h, expo)`
  renders a still into a canvas for a phone screen). Add it to `film.libs` in `vo/script.json`.
- **New sets (batch 6, Parts 2 and 3)** — additive modules in `assets/kit/` (nothing in the other kit files changed;
  they only add pose names to the shared table):
  - `rh3d-elevator.js` → `RH3D.elevator(K, { office, garage, shaft })` ("Between Floors"): a brushed-steel cabin
    (handrails, stone floor, 2 × 2 LED ceiling `E.light(white, red, flicker)`, centre-opening cabin + landing doors
    `E.doors(u)`, a 5 × 7 dot-matrix floor display `E.display.set("v B2")`, a panel whose lowest button is B2, bell +
    speaker grille, 7-seg clock, service sticker, the taped card `E.card(circled)`, lit rings `E.button(label, on)`,
    a door-seam light strip `E.gap(v)`); a back-wall **mirror** built as a hole into a mirrored copy of the interior
    (`scale.x = −1`, image lights; `E.photoBackdrop` renders what the doors open onto for the mirror): pose the
    reflection with `RH3D.mirrorDouble(dbl, pose, E.mirrorX())`, and put anything that must exist *only in the mirror*
    (the twin) in that room; a **shaft cutaway** (twin shaft, landings with light leaking through the leaves, ropes,
    counterweight, car-top lamp, `E.shaftSet.carY(y)`); an office lift lobby; `E.attachGarage(G, objs)` opens Level −4
    behind lift 1 (doorway cut into the wall with matching UVs, recess hidden, a `−4` column). The cabin is translated
    between stages and `E.stage("office" | "garage" | "shaft")` shows one set at a time; write cabin shots in cabin-local
    metres and convert with `E.wAt(stage, p)`. Helpers: `RH3D.collect(K, build)` (every object a set created, to
    show/hide it), `RH3D.reach(man, pose, bone, offset, target, joints)` (a small IK for a finger on a button or a hand
    on a rail; cache the result), `RH3D.dotMatrix`, `RH3D.brushed`; poses `sitFloor`, `grabRail`, `pressBtn`.
  - `rh3d-store.js` → `RH3D.store(K, {})` ("After Closing"): a generic big-box furniture showroom with no brand
    (charcoal signs that say only BEDROOMS, LIVING ROOMS, KITCHENS, EXIT), a 6.5 m dark ceiling with trusses and ducts,
    a painted winding walkway `S.pathAt(s)`, room sets (office desk + the card, sofa, kitchen, two bedrooms; the hiding
    bed has a price tag and 0.4 m clearance, the other a duvet whose hidden shape flattens `S.duvet(h)`), 15 floor
    arrows that glow red and turn half a turn `S.arrow(i, red, turn)`, 4 high-bay sections `S.section(i, on, flicker)`
    while the room-set lamps stay warm `S.lampsOn(v)`, glass entrance doors with an hours sign and an outside roller
    shutter `S.shutter(open)`, a plain far door whose green EXIT sign switches on `S.exitSign(on, flicker)`, wet
    footprints along the walkway `S.steps(n)` (the list `S.feet` with each step's arc length), a PA speaker, a nightstand alarm clock `S.clock`, red spill lights
    `S.red(i, pos, I)`, a line of light under the far door `S.doorGlow(v)`, front displays `S.front` (a bed vignette
    and a sofa vignette in the wedge a wide from the doors sees); plus `RH3D.phoneTripod(K, man)` (mini tripod + REC dot), `RH3D.phoneCamUI` (camera-app screen)
    and poses `prone`, `sofaBack`, `handle`. Big dark sets need a real fill (`hemi` ≈ 0.6) and lamps of 2–3, or whole
    shots go black.
- **Swappable voice, one wav per line** (from build E, see `samples/motivation-ten-years/SAMPLE.md` → revoice):
  `tools/voice_kokoro.py` (or any TTS) → `vo/lines/<id>.wav`; `tools/join_vo.py` trims each clip by energy and
  lays the lines out with the script's `gap`s → `vo/audio/vo.wav`; `tools/align_vo.py` (faster-whisper `small`,
  no initial prompt) → `vo/data/vo.json`. Key every shot and cue to words (`cut(line, word)`), so a new voice is
  join + align + build + render. `build_film.py` also takes `film.hold_text` ("LINE ONE|LINE TWO"): the closing
  line held in full to the end, kept out of the SRT.
  `film.cap_shadow` sets a wider dark halo for white captions over pale subjects (ivory figures, morning light).
- **Lighting kit for other stories** (E, the motivational reel, uses it): `K.light.spot/point/dir/hemi` (register any
  light for the haze with `vol` or `K.light.haze(L, gain)`), `K.fixtureGlow(mat)` + `K.glowPts` for practicals that
  must light ceilings, `K.env.bake(name, probe, prep)` per lighting state, `st.fog` per shot (`dens`, `hFall`, `noise`,
  `g`, `lightGain`), `st.refl` for wet floors, `st.fade` to black, `st.flash`, `st.exposure`, `st.sat`, `st.lift/gain`
  for a split-tone grade (cold grey future vs warm morning). A window sun is a `K.light.dir` (+ `cast`) or a strong
  spot through a frame registered for the haze.
- **Gotchas hit on the sample**:
  - Looking down +Z, world +X is on the **left** of the screen. Most of the first framing misses were this.
  - Frames render out of order: never carry state between frames (board text, visibility); pose the cast before any
    camera path reads a bone (`build_film.py` calls `reset → fn → post → camera`).
  - A glossy shell reflects the env's horizon as a hard line across the head: bake the env with the tubes at 30 %
    (`G.envTube`) and keep the shell's clearcoat ≤ 0.35 with roughness ≥ 0.34.
  - Spots pointing down leave the slab black: `K.fixtureGlow` on the ceiling/beams.
  - Graphite joints read black under red light (a "ball" on the shoulder): land props on the white shell.
  - Haze in front of a bright opening whites out a shot: thin it per shot (`FOGL`) and lower the source's `vol`.
  - `alphaMap` reads the green channel: a card's back needs its own blank texture (`ruleCard({ blank: true })`).
  - More haze-registered lights than the 16 slots: the core keeps the 16 brightest as seen from the camera.
  - Parked cars and columns block over-the-shoulders: check the camera is not inside a car footprint or behind a column.
  - The scene-change gate counts histogram jumps 1 s apart (threshold 0.28, ≥ 1.5 s apart), so it also counts
    in-shot light events (the slam, the red reaching the hero) and fast camera travel through changing light. Budget
    ~23 events for 95 s: merge short shot pairs into one move, keep cameras slow in the red, and **ramp** exposure /
    haze / key changes inside a shot (≥ 2 s) instead of stepping them. Renders are deterministic, so a change only
    moves events near the frames it touches; recompute the event list from the mp4 (engine `scene_changes`) in seconds.
  - HyperFrames' delivery preset writes ~870 MB for 95 s here (grain and dither barely compress): deliver a CRF 22 x264
    encode of the master (≈ 45 MB, indistinguishable at phone scale).
  - Shell heredocs with Python triple quotes fail here: write patch scripts with the Write tool.
  - Mirror close-ups: a figure at a mirror leans to ~0.24 m from the glass, so a camera straight behind him sees
    his own head. Come in ~30° off the mirror's axis past his shoulder, with the camera path computed from
    `dbl.at("head", …)` so it follows the pose.
  - Kokoro clips carry ~0.6 s of silence each: trim by energy before laying out pauses, or the WPM drops ~10 %.
- **Gotchas hit on Parts 2 and 3** (batch 6):
  - A cutaway wall is single-sided, so it vanishes from outside, but it still **casts** shadows from its back face: a
    key outside it lights nothing. Give cutaway walls `cast: false`.
  - `K.glow(hex, 0)` stores a zero base colour, so anything later scaled from `userData.base` never lights: make
    switchable glows at hdr 1 and turn them off.
  - The props LED board's 6-dot cells overlap two-character floors ("B2"): use `RH3D.dotMatrix` (5 × 7 font).
  - The HyperFrames render re-mixes the audio ~0.7 dB quieter (−14.9 LUFS from a −14.2 mix): deliver the engine's
    `final.m4a` untouched over the re-encoded video, cut with `-t <video duration>` — `-shortest` with a copied audio
    stream ended the video 3.5 s early (`assets/tools/deliver.sh`: encode + analyzer + sheets + scene events + Whisper).
  - `engine/audio/sound.py` writes `final.wav` as int32 PCM: scale by 2³¹ before Whisper, or it hears gibberish.
  - Whisper long-form can drop a phrase that sits on a 30-s window edge ("service from six a.m." at 27.7 s): the
    `assets/tools/whisper_check2.py` also transcribes line by line from the same mix; read both passes.
  - The engine analyzer reads the first `.srt` in `out/`: delete the template's `template.srt` from a new project.
  - Scene-change budget: an insert of ≤ 1.4 s between two different shots counts once (the second jump is within the
    1.5 s gap); a bright cabin → dark shaft → red cabin sequence costs two events per cut. Plan the light changes and
    the event list before render 1 (`assets/tools/scene_events.py` lists every event with its shot).
  - The open loop by 15 % needs the hook lines fast when the brief's opening is long (48 words before "And nobody" in
    After Closing): voice them line by line (`voice_kokoro.py` → `join_vo.py` → `align_vo.py`) at 1.2–1.3, and
    `assets/tools/regap_vo.py` re-times the aligned words when only pauses change. The engine `tts.py` keeps Kokoro's
    in-line sentence pauses (~0.7 s each).
  - Spoken "B one" vs caption "B1": `film.cap_merge` in `build_film.py` merges two spoken words into one caption token.
  - A 9:16 one-point wide sees only about ±0.25 × distance to each side (fov ≈ 50): ±1 m at a figure 4 m away. Room
    sets beside the walkway never get into it; the frame shows whatever stands on the axis behind the figure (in After
    Closing's first cut, the blank backs of partitions, which read as an office). Put a display inside that wedge
    (`S.front` in `rh3d-store.js`: a bed against the nearest partition, a sofa behind it), with lamps that stay on.
  - Signs and inserts with text: keep the text above y ≈ 1150, because the caption band is ≈ 1235–1300. Frame the sign
    smaller and higher instead of filling the frame with it.
  - A plain door in the dark needs its own light at a strength that reads 15 m away (a spot of ≈ 40 here, ≈ 18 close
    up), a leaf that is not too metallic (metal ≈ 0.2, or it only mirrors the black hall), and ideally a line of light
    under it (`S.doorGlow`).
  - Check the scene-change budget before the delivery render: snapshot the whole film at 2 fps and run
    `assets/tools/scene_est.py` on that folder and on the last mp4. It applies the analyzer's histogram rule
    (it counted 18 where the analyzer counted 19), so the difference between the two runs is what the changes cost.

## 13. QA gates
- Snapshots of every shot before the render; the 2 fps sweep of the real mp4 after it (look at all of it).
- Metric gates (§2), `compare.jpg` (12 matched beats vs a reference, when `--ref` is given), YAVG dips (only the planned drop-out and the
  shutter slam may flag), Whisper `small` (names and numbers exact), loudness and TP, captions inside the safe band.
- Files: references/analysis.md · references/sources.md · assets/kit/ (with `rh3d-elevator.js`, `rh3d-store.js`) ·
  assets/tools/ · assets/template/ (runnable demo) · the full "Level −4" sample project is not included in this release · the batch-6
  projects `samples/rules-elevator/` and `samples/rules-store/` are not included either

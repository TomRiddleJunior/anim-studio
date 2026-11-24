---
name: explainer-twist-tale
description: "Makes a vertical 9:16 'twist tale' Short (55-70 s) in the format of a 92M-view Shorts channel (Ricks Clips): a real piece of history, law, statistics or science told as a fast micro-story — a one-sentence impossible-sounding hook, a 'You see,' pivot, doubters who laugh it off, a twist, then the real mechanism and a last line that re-reads the hook — voiced by one casual narrator at ~215 wpm, cut every ~2 s (3-frame dissolves) with the camera always moving, a 3D toon cast (big white sphere heads with drawn faces, capsule bodies, stick limbs, ball hands, hats) acting in bright, saturated, textured cel-shaded 3D sets with ink outlines, and 1-2-word captions. Built in code with HyperFrames + three.js: toon-shaded primitive sets with procedural textures and an ink-outline pass, an IK-posed 3D cast with face textures, props and signs drawn on canvas, a shot list keyed to the narration's word times, Kokoro TTS and a synthesized bed. Use for 'Ricks Clips style', 'story Shorts', 'history/fact Shorts with a twist', 'faceless YouTube Shorts / TikTok explainer', 'the ancient X that…', 'why X keeps happening', 'levels of X', 'X vs Y paradox', 'doodle characters in 3D', 'viral short-form storytelling', or a trending topic told as a 60-second tale."
---
# Twist tale — a real mechanism told as a 60-second story with a twist

Reverse-engineered from all 12 Shorts of **Ricks Clips** (@RicksClips3000: 92.4M views in 12 days, 11 of 12 over 1M;
`references/analysis.md`). The format is a **mechanism, not a look**: a true, slightly unbelievable fact is staged as a
tiny story with doubters and a reveal, read fast, cut fast, captioned word by word. Our version keeps the mechanism
and changes the taste: code-rendered toon dioramas with drawn ink outlines, our own 3D toon cast, yellow keyword
captions, and sourced facts. Samples: `the sample film (the render is not included in this repository)` — "Why Black
Friday Is Called Black Friday" (kit v2: the 3D cast and the bright look; **start from this one**), and
`the sample film (the render is not included in this repository)` — "The Man Who Moved Every Clock" (kit v1: flat doodle billboards, darker sets).
Third sample: `the sample film (the render is not included in this repository)` — "The Missile Steered by a Pigeon" (kit v2 with a
non-human lead: a toon pigeon built from primitives in its shot file; 65.2 s, 22 scene changes/min, motion 13.2,
colourfulness 84 at grade `sat` 1.14, −14.4 LUFS, real 3-frame crossfades; facts in its FACTS.md).

## 1. The formula (what every high-view video does)
| % runtime | beat | sample |
|---|---|---|
| 0–8 | **Hook**: one concrete, impossible-sounding act + stakes, 13–22 words | "A man begged his country for eight years to change every clock, and the first country to do it was their enemy." |
| 8–20 | **"You see,"** + the one line of context the hook needs; the protagonist in a specific moment | "You see, William Willett was a builder near London, and one summer morning he rode his horse past houses with the blinds still down." |
| 20–45 | **The attempt**: the plan in plain words, numbers spoken | "Every Sunday in April, push every clock forward twenty minutes…" "…two and a half million pounds on lighting." |
| 45–60 | **Doubters / stall**: authorities laugh or do nothing; repetition beats | "And then, nothing happened. Year after year, the clocks stayed exactly where they were." |
| 60–75 | **Twist**: the turn nobody expected | "Just over a year later, Germany, at war with Britain, needed to save coal… Three weeks later, Britain copied its enemy." |
| 75–95 | **"You see," + the mechanism** in one image | "It's the same sun. Moving the clock just moves your day to where the light already is…" |
| 95–100 | **Last line re-reads the hook** (a callback or a timely kicker); no CTA, no outro | "And this Sunday, when Americans set their clocks back, they're putting his idea away for the winter." |

- **Pick real mechanisms.** Real history/systems dramatized: 7.6–28.5M views; pure fiction fables: 0.3–1.5M. A
  workplace/culture angle drives comments (Japan: 10,000). Topics list: `references/topics.md`.
- **Titles** are curiosity gaps about an object or practice: "The Ancient Jar That Warned an Empire", "Why Cashiers Keep
  Winning The Lottery", "Levels of Pirate Cannonballs", "X vs Y". Ours: "The Man Who Moved Every Clock".
- **Facts**: every fact line maps to a `FACTS.md` row; framing lines carry no facts or forecasts; no invented quotes of
  real people; no likenesses or caricatures — real people are generic doodles, living politicians are not drawn.
  Do not add drama the sources do not support (the sample never says Willett was "laughed at": the record says
  Parliament considered it and did nothing).

## 2. Measured targets
Sources: 12 Shorts (`references/analysis.md`, per-video table). Samples: `out/qa/metrics.json` of each.

| metric | source range (12 Shorts) | v1 Willett (flat doodles) | v2 Black Friday (3D cast) | target |
|---|---|---|---|---|
| length | 41–78 s (median 60) | 66.3 s | 59.3 s | 55–70 s |
| narration | 208–243 wpm overall; speech gaps 8–14 % | 206 overall, 232 speaking | 194 overall, 220 speaking | 205–235 |
| scene changes / min · median | 17.1–26.8 · 1.8–2.9 s | 19.9 · 2.0 s | 23.3 · 2.2 s | 18–26 · 1.8–2.8 s |
| cuts | 0–1.3 hard cuts / min; the rest 1–3-frame dissolves or camera moves | hard cuts | 3-frame dissolves | dissolves |
| motion mean | 13.5–21.3 | 12.5 | 17.8 | 13–21 |
| colourfulness · brightness | 58–87 · 0.52–0.72 | 51.1 · 0.54 (too dull) | 77.8 · 0.76 | 60–85 · 0.6–0.75 |
| loudness | −14.0 to −15.1 LUFS; bed 6–9 dB under the voice | −14.3 LUFS, −1.2 dBTP | −14.3 LUFS, −1.3 dBFS peak | −14 ± 1 |
| likes / views | 1.8–4.4 % | — | — | — |

## 3. Look (our taste) — bright, saturated, real 3D
The source frames are **bright** (light walls, cream floors, blue sky), **saturated** (red/blue/teal/yellow outfits,
striped and dotted clothes) and **deep** (wide lenses, low cameras, streets receding, foreground props). Kit v2 does
all three; the v1 sample (dark brown/green sets, flat billboards) measured too dull and too flat.
- **Light**: three r170 divides diffuse light by π, so v1's sun 1.55 + hemi 1.15 lit faces at only ~0.86 of their colour.
  v2 uses hemisphere 1.9 (sky white, ground lilac-grey) + one shadowed sun 1.35 and a light ramp `[150, 214, 255]`: lit
  faces ≈ 1.0 × colour, turned faces ≈ 0.85, cast shadows ≈ 0.6 — soft toon shading, never muddy. Grade in the ink pass:
  saturation × 1.3, gamma 0.9, lift 0.02, vignette 0.12.
- **Sets**: primitives (`box · cyl · cone · sphere · ico · torus · roof · slab`) + **procedural canvas textures**
  (`K.ctex`: planks, tiles, wallpaper, brick, asphalt with lane marks, facades with framed glass windows, stripes, dots,
  sky gradient with clouds) and dressing helpers (`K.sky · car · tree · lamp · trafficLight · building`). Light, warm
  walls (mint, sky, peach, pink) with one saturated band; streets of differently coloured buildings; 1960s pastel cars.
  Then the **ink pass**: edges where view-space normals or linear depth jump, 12 taps at 3 px.
- **Cast (3D)**: `K.toon(id, { outfit, pattern, hat, hatc, hair, moustache, tie, badge, belt, apron, scarf, glove, h })`
  — a white sphere head (scaled 1.07 × 0.97) with a face texture projected onto its front (`assets/faces/<expr>[-m].svg`
  from `make_assets.py faces`: 20 expressions incl. dread, confused, whistle, tired, talk; `-m` adds a moustache), a
  capsule body (solid, stripes or dots), stick limbs by two-bone IK, ball hands, ellipsoid feet, hats (peaked police cap,
  fedora with PRESS card, bowler, beanie, cap). `a.pose(name, k)` (stand, arms_up, cheer, wave, point/pointL, pointUp,
  hold, holdUp, shrug, hands_head, facepalm, think, whistle, stop, direct, type, tuba, drum, sit, sitslump,
  present/presentL, bags, sign), `a.walk(phase, stride)`, `a.hold(obj, "R" | "L" | "both" | "chest", offset)`,
  `a.set(expr)`, `a.turn` (yaw offset from facing the camera, for 3/4 views). Head ≈ 39 % of height, like the source.
- **Composition for 9:16**: wide lenses (fov 46–56), cameras at chest height or lower; shoot crowds **down a sidewalk**
  (people walking toward the lens, storefronts receding) rather than across it; stack sign text in two lines; keep
  key props above y ≈ 1250 px so captions never cover them.
- **Cuts**: a 3-frame (0.1 s) dissolve out of every previous shot (the source's 1–3-frame dissolves); set `cut: true` on
  a shot for a hard cut. The world player renders the previous shot's last frame into a buffer and mixes it.
- **Captions**: 1–2-word chunks (glue words joined to the next word, ≤ 13 characters), Fredoka 700 at 104 px, white with
  an 18 px ink stroke and an 8 px drop shadow, centred at y 1300–1460 (68–76 %); numbers and the story's key nouns in
  yellow `#ffd84d`; each chunk pops 82 % → 100 % in 0.09 s.
- **Props with text** are canvas textures (`K.ctex("sign", …)` or a `ctx()` helper in the shot file) or SVGs, drawn with
  system fonts (Arial Black, Georgia, Courier New, Segoe Print for chalk) — page web fonts are not available to them.
  Text shrinks to fit 90 % of the card width.

## 4. Edit and motion
- A new shot every 1.8–2.9 s (one per clause), cut on the narration word it illustrates (`T(line, word) − 0.06 s`).
  Hard cuts; the camera always moves inside a shot (push-in, drift, crane up to a clock), eased in and out.
- Shot grammar from the source: establishing → character medium → **prop close-up on the key noun** (the clock face,
  the pamphlet cover, the calendar page) → reaction → wide. Gags in the background (a tumbleweed rolls through the
  silent chamber on "nothing happened").
- **Frame maths for 9:16**: visible height = 2·d·tan(fov/2), width = 0.5625 × height (≈ 0.48·d at fov 46). Characters
  read at 40–60 % of frame height → d ≈ 3–4 m for a 1.6 m doodle; anything more than ±0.24·d sideways is off-screen.
- **Seek-safe**: every shot first runs its set's `reset()` (visibility, positions, expressions, clocks), then its `fn`.

## 5. Voice and sound
- Kokoro `am_michael`, speed 1.36 (1.2–1.28 on lines with numbers, which slur at full speed), gaps 0.1–0.3 s, lead 0.2
  → ~216 wpm overall, ~232 while speaking. Check with Whisper `small`; rephrase anything misheard ("Fourteen months" was
  heard as "for 10 months" → "Just over a year later").
- Bed: the engine's `curious-marimba` at 112 BPM, −15 dB under the voice, energy dipping on the sad beat and lifting on
  the twist; SFX on actions (tick on clock jumps, coin, paper, swoosh on 1 in 4 cuts, ding on the twist); −14 LUFS.

## 6. Build
```bash
cp -r ~/.claude/skills/explainer-twist-tale/assets/sample-blackfriday my-tale && cd my-tale   # kit v2 (3D cast)
# 1) write vo/script.json (engine format), voice it, check it with Whisper
$EXPLAINER_PY -I ~/.claude/skills/explainer-engine/engine/audio/tts.py vo
# 2) face textures (+ any SVG props), then write assets/lib/tale-shots.js (sets + cast + shots + reset);
#    edit HL / PAIRS / cues in tools/build_tale.py for the story
python -I tools/make_assets.py faces
# 3) word times -> captions, world player, index.html, sound project; mix
python -I tools/build_tale.py
$EXPLAINER_PY -I ~/.claude/skills/explainer-engine/engine/audio/sound.py score   # then: ffmpeg -i score/audio/final.wav -c:a aac -b:a 256k assets/audio/final.m4a
npx -y hyperframes@0.8.210 check --json && npx -y hyperframes@0.8.210 snapshot --at <one time per shot>
npx -y hyperframes@0.8.210 render -o out/tale.mp4 -q delivery
```
Kit: `assets/kit/tale-kit.js` v2 (`TALE.create` → `set · box · cyl · cone · sphere · ico · torus · roof · slab · plane ·
clock · sky · car · tree · lamp · trafficLight · building · toon · actor · ctex · render`), shot list pattern in
`assets/sample-blackfriday/assets/lib/tale-shots.js` (`window.TALE_FILM(K, V)` returns `{ shots, reset }`;
`V.w(line, word, k)` gives word times), `assets/tools/make_assets.py`, `assets/tools/build_tale.py`. Sound effects
used here and added to the engine: `horn`, `whistle`.

## 7. Gotchas (hit on the sample)
- **Ink lines vanish at 1–2 px** once the frame is scaled: sample at ≥ 3 px in 12 directions.
- **Clock hands**: `clock.set(h, m)` adds m/60 to h — animate with total minutes (`setM(clock, M)`), never a
  fractional hour plus minutes.
- Characters behind desks and props disappear: check each snapshot for a hidden face; put the actor beside the prop.
- A horizontal diagram never fits 9:16 — make charts vertical (the sample's day chart runs midnight → midnight
  top to bottom).
- Objects that must not get ink (light beams, glows) need a normal-pass shader that discards *and* writes a colour, or
  WebGL logs "missing fragment shader outputs".
- Shell heredocs with Python triple quotes break in this environment — write patch scripts to files.
- **`V.w(line, word)` returns the first word that starts with `word`**: in "Black Friday is the day stores go from red ink
  to black" the ledger never turned because "black" hit "Black Friday" — pass `k` (`w("l11", "black", 1)`). An easing
  window whose start is after its end silently stays at 0.
- `side: T.FrontSide` is `0`: test `!= null`, never `||`, or a one-sided card falls back to double-sided — two back-to-back
  cards then z-fight in the ink pass and come out hatched with ink.
- Book pages laid on a bevelled slab sit under the bevel (the bevel adds its size to the height) — lift them above it.
- Foreground poles (lamps, traffic lights) right in front of a sidewalk camera fill a third of a 9:16 frame — clear them.
- A wide sign or banner never fits 9:16 at a readable distance: stack it ("BLACK / FRIDAY", "LOS / ANGELES").
- Kokoro said "Lowe's Angels" for "Los Angeles" at speed 1.2; a misaki phoneme override fixes it:
  `[Los Angeles](/lɔs ˈænʤələs/)` (Whisper heard it correctly; the caption shows "Los Angeles").
- **Never sample the buffer you are drawing into.** Until 29 Oct 2026 `render()` kept the dissolve buffer bound as
  `tP` while drawing into it; WebGL dropped that draw ("Feedback loop formed between Framebuffer and active
  Texture" in `hyperframes check`), so every dissolve faded in from black. The kit now binds the colour buffer during
  the `toPrev` pass. The QA dark-frame check missed it; check cuts with ffmpeg `signalstats` (per-frame YAVG).
- `V.w(line, "the", k)` also counts "Then" (startsWith): in "Then, in 2024, the pigeon bomb… The Ig Nobel…" the plaque
  shot started 2 s early until `k` was 2. A bevelled `K.slab` bulges ~0.012 m past its depth and swallows a picture
  set flush on its front (the pigeon's screens came out black): set the bezel back.
- Shells seen from inside (open `DoubleSide`/`BackSide` cylinders: a cut-away nose, a cockpit, a bin) drop out of the
  front-face normal pass; give them a double-sided `userData.nmat` that flips the normal with `gl_FrontFacing`.
- Saturated sets (a red train, red curtains, a red carpet) took colourfulness to 92.5 at `sat` 1.3, above the channel's
  87: pass `look: { sat: 1.14 }` to `TALE.create` for such a film (the pigeon sample measured 84).

Files: references/analysis.md (channel teardown, per-video table) · references/sources.md · references/topics.md ·
assets/kit/tale-kit.js (v2) · assets/tools/ · assets/sample-blackfriday/ (the Black Friday short, kit v2, full source) ·
assets/sample/ (the Willett short, kit v1)

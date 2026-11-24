---
name: explainer-gold-studio
description: "Makes a vertical 9:16 'dark gold studio' money-comparison reel (about 60 s) in the format of a 65k-like Instagram finance reel (@moneydecoded.au): two places that share one resource, two outcomes, told in a black photographic 3D studio — glossy flag spheres on matte black oil drums over a reflective floor, a warm gold spotlight glow, gold coin stacks that grow, gold 3D numbers that count up, glossy black pawn 'people' that turn gold, a ring gauge for a rate, coins pouring into a steel safe, a green line chart with a flag marker, a dotted map with ships, a $1 coin that becomes a 100-coin grid, a gold serif-italic title card and a red one for the twist, small white top captions, a calm male narrator at ~150 wpm over a dark low bed, ending on the opening image resolved. Built in code with HyperFrames + three.js: a PBR studio renderer (physical materials, generated environment, blurred planar floor reflections, bloom, depth of field, sub-frame motion blur), canvas-drawn flags, Natural Earth dot maps, Kokoro TTS and a synthesized bed. Use for 'MoneyDecoded style', 'Norway vs Australia fund reel', 'country A vs country B money explainer', 'sovereign wealth fund / tax / royalties comparison', 'gold coins 3D finance reel', 'dark luxury 3D explainer', 'why X is rich and Y isn't', 'where did the money go' Shorts/Reels/TikTok. Builds on explainer-engine."
---
# Gold studio — two places, one resource, two outcomes, in a black 3D studio

Built from a frame-by-frame analysis of one Instagram reel (@moneydecoded.au, DeX3-QSyCBI, 61.6 s, 65k likes;
`references/sources.md`, `references/analysis.md`). The format: a 60-second comparison where every quantity is a
physical gold object on a black stage, one coloured glow per beat, two serif-italic title cards cutting the reel into
hook / mechanism / twist, and an ending that returns to the opening image, resolved. Original work only: our topics,
script, flags drawn in code, our own channel name in the post caption, no copied sentences.
Sample: `the sample film (the render is not included in this repository)` — "Alaska vs Alberta" (oil savings funds, official figures in
`assets/sample/FACTS.md`, post caption with a "Figures:" line in `assets/sample/CAPTION.md`).

**Vertical 9:16, 1080×1920, 30 fps.** For 16:9, set `W, H = 1920, 1080` in `tools/build.py` and widen the camera
(fov 28–30, pull the camera back ~30 %); move numbers beside the subject instead of above it.

## 1. Signature traits
- **One black studio**: near-black reflective floor with blurred reflections, no walls; frames average 0.13 brightness.
- **A coloured glow behind the subject**, one at a time: gold (saved, good), green (growth), red (loss, twist).
- **Places are glossy flag spheres on matte black oil drums** with embossed silver names; money is always gold metal:
  coin stacks that grow under a sphere, a river of coins into a safe, 3D gold numbers with a short extrusion.
- **People are glossy black pawns** that rise from the floor and turn gold.
- **Data as objects**: a ring gauge for a rate, a dashed-grid line chart with a flag-sphere marker, a dotted map with
  ships and dotted routes, a $1 coin that becomes a 10×10 coin grid for "x cents in every dollar".
- **Two serif-italic title cards** (a gold card that announces the explanation, then a red card for the twist) built
  word by word with a glitch-smear reveal.
- **Small white captions at the top** (0.14–0.16 H), 2–5 words, numbers spelled out, 3-frame fades.
- Calm male narrator ~150 wpm, a dark sustained bed ~10 dB under, whooshes / coin clinks / ticks; ends on the
  opening image with the answer shown (tall stack vs short stack).

## 2. Target metrics
Source: engine analyzer metrics (analysed locally for reference only). Sample: `assets/sample/out/qa/metrics.json`
(same analyzer; WPM from a Whisper-small transcript of each video, as for the source).

| metric | source | sample (Alaska vs Alberta) | gate | target for new reels |
|---|---|---|---|---|
| duration | 61.6 s | 61.4 s | ±10 % ✓ | 55–68 s |
| scene changes / min · median | 2.92 · 16.97 s | 2.93 · 17.85 s | ±15 % ✓ | 2.5–3.4 · 14–20 s |
| look changes at | 2.7 (glow on), 22.0 (chart), 47.0 (red card) | 2.0, 23.0, 46.7 | — | exactly these three |
| WPM (Whisper) | 150.9 | 138.8 (script 149) | ±10 % ✓ | 140–160 |
| colourfulness · brightness | 27.5 · 0.133 | 27.9 · 0.144 | ±12 % ✓ | 25–30 · 0.12–0.15 |
| motion mean · p90 | 5.77 · 13.7 | 5.13 · 13.2 | ±20 % ✓ | 5–6.5 |
| hold fraction | 0.057 | 0.038 | — | < 0.08 |
| loudness | −14.1 LUFS | −13.9 LUFS | ±1 LU ✓ | −14 |
| hard cuts (analyzer) | 2 (1.95 / min) | 0 | — | see note |

Notes. *Cuts*: both reels have 7 real hard cuts (into the two title cards, the chart, the map, the plant, the
ending); the analyzer's ffmpeg scene score misses cuts between near-black frames, so this number is noise here.
*WPM*: Whisper writes "1976", "25%", "$3.8 billion" as one token each, so a script with many spoken numbers reads
~7 % lower than its script count. *Saturation* (not gated) is higher in ours (0.51 vs 0.36): our blacks carry a warm
tint; colourfulness, the gated colour measure, matches.
*Scene changes are a threshold effect*: the analyzer counts 1-s colour-histogram jumps ≥ 0.28. Every jump from
near-black to a big glow counts. Keep exactly three: let the gold glow come up hard on the hook, make the chart's green
glow strong, make the red title card's glow big; keep everything else (whips, the map cut, the plant cut) under it by
holding brightness similar on both sides (§10).

## 3. Script formula
~150 words, 19–21 lines of 2–14 words, one rhetorical question, no CTA in the video.

| % runtime | beat | pattern → sample | picture |
|---|---|---|---|
| 0–16 | Hook, 3 lines | both places got rich from one resource / A's result as a fund size / B's result (the contrast as a number) → "Alaska and Alberta both struck it rich selling oil. Alaska turned it into an eighty-eight-billion-dollar fund. Alberta's fund is about a quarter of that." | two spheres drop onto drums → pull back, stack + gold label |
| 16–19 | Gold title card | 2 words + serif word: "Here's *why.*" | black, gold glow |
| 19–36 | A's mechanism, 3 lines | a principle, a rate (%), where the money goes → "In 1976, Alaskans voted to save part of their oil money. At least twenty-five percent of oil royalties goes in, to one giant fund, and those savings can only be invested." | stack + people turn gold → ring gauge → coins pour into a safe |
| 36–54 | A's result | growth + what it pays each year → "They invested it, and it just kept growing. Now it pays out about $3.8 billion a year, for dividends and public services, and the fund is still growing." | green chart, count-up, 3 icon tiles |
| 54–57 | Turn | one line: B did the opposite | red line on the same chart |
| 57–65 | B's scale | how much B earns → "It took in about eighteen billion dollars of resource revenue last year alone." | dotted map, routes, count-up |
| 65–75 | B's share | "x cents in every dollar" → "The plan back in 1976? To save thirty cents of every resource dollar." | $1 coin → 100-coin grid, 30 turn gold |
| 75–78 | Red title card | "And here's the *twist.*" | black, red glow |
| 78–89 | Twist, 2 lines, ends on a year | "In 1987, the deposits stopped. Not one new dollar went in until 2006." | plant rises, red "$0" → a gold coin drops |
| 89–100 | Ending, 4 short lines | "Two places. Same oil. Alaska kept saving. Alberta stopped for nineteen years." | spheres again, "=", tall stack vs short |

- **Facts**: official sources only, each with its as-of date, listed in `FACTS.md`; mixed currencies are labelled
  (US$ / C$) and any comparison converts at a cited rate. Neutral verbs (kept, saved, stopped, paid) — the contrast
  comes from the numbers. If a key number can't be sourced, change the angle.
- **Post caption** (not in the video): 4 short paragraphs + a question + "Follow <channel> for more" + a
  **"Figures:"** line naming every number, its source and date (`assets/sample/CAPTION.md`).
- **Voice**: Kokoro blend `am_fenrir,am_onyx` (pitch median ~85 Hz like the source's 89 Hz), speed 1.26 → ~194 wpm
  while speaking, lead 0.05 s, gaps 0.25–0.8 s (longest before each title card and after the hook's second line).
  Kokoro clips a soft onset at the start of a line ("Alaska" was heard as "Laskin", "Save" as "they have"): use a
  misaki override `[Alaska](/æˈlæskə/)` or start the line with a consonant ("To save …"). Check with Whisper small.
- **Captions**: hand-chunk each line in `CHUNKS` (`tools/build.py`): 2–5 words, break at commas and phrase edges,
  numbers spelled exactly as spoken ("eighty-eight-billion-dollar fund."). Title-card lines get no caption.

## 4. Visual system
| role | hex | where |
|---|---|---|
| studio black / floor | #020202–#0c0c0c (floor material #050505) | everything |
| gold glow | #c98a3a (core reads #a47732 after grading) | behind the subject, hook, hero, safe, coin, ending |
| gold metal | base #f3c46a (PBR), reads #997031 → #fdefa3 | coins, numbers, gilded pawns |
| gauge yellow | #ecbb1c × 1.3 (emissive) | ring arc |
| chart mint / green glow | line #7cf5cb × 2.4, fill rgba(46,170,108,.85→.16), glow #1f6a44 | chart |
| red line / red glow / red serif | #ff5a52 / #8f1d1b / #ff4a4f | turn, twist |
| caption white | #efe7df with a dark halo | captions |

**Typography** (H = frame height): captions Inter 520, 44 px, letter-spacing −0.012em, cap top 0.139 H, centred.
Big numbers Montserrat 800 gold with a dark extrusion, cap 0.036–0.072 H; sub-labels Montserrat 800 white caps,
cap 0.012–0.021 H, just under the number. Title cards: Inter 600 white (cap 0.026–0.028 H at 0.37–0.39 H) + an
old-style serif italic word (system Garamond Italic, fallback Libre Baskerville Italic, faux-bolded 2–3 %) at
0.49–0.53 H, cap 0.085–0.10 H. Chart values Montserrat 800 white cap 0.012 H; years Inter 600 grey.
**Layout**: subject column 0.2–0.8 W; numbers upper right (0.25–0.40 H) or centred under a chart (0.6 H); nothing
important below 0.82 H (reflections only — Instagram's caption area) or in the right 12 %.
**Light and lens**: PMREM studio environment (soft box above-front-left → the round highlight on every sphere, side
strips, a warm card behind); one shadowed spot key; a warm point light that rises with the glow; fov 34–36;
depth of field always on (aperture 0.7–1.0, focus on the subject); bloom 0.5–0.75; ACES; vignette 0.35; grain 0.016;
global grade 0.74 and saturation 0.82 (`grade`, `sat` in the shot state).

## 5. Objects (kit `assets/kit/gold-kit.js`, `GOLD.create`)
`K.set(name, { env, floor })` · `K.barrel({ x, text })` (matte drum, chrome ribs, embossed silver name) ·
`K.flagSphere({ flag: "alaska" | "alberta" | fn(ctx) })` (draw new flags in `flagTex`) · `K.coinStack({ x, y, r, max })`
→ `.set(n)` returns its height (fractional n drops the top coin in) · `K.coinSwarm({ max, r, mat })` → `begin / put /
end` for pours, flights and grids · `K.pawn({ x, z, s })` → `userData.gild(k)` black→gold · `K.ring({ R })` →
`userData.setArc(frac)` (clockwise from 12) · `K.safe({ s })` → `userData.hinge`, `userData.dial` · `K.tank`, `K.box`,
`K.cyl`, `K.sphere` · `K.iconTile("dividend" | "school" | "road" | "cross")` · `K.dots(list)` (instanced map dots) ·
`K.glow({ color, size, x, y, z, soft })` → `setK(v)` · `K.label(spec, { cap, gain, flash })` → `show(reveal, opacity)`,
`set(text)` (count-ups), `fit(capWorld)`, `tw()` · `K.atScreen(obj, sx, sy, depth)` → place labels by screen position
(returns world height of the screen at that depth; size labels as `fit(capFrac * hw)` inside the state's `after()`).
Dotted maps: `tools/make_map.py <Region> [natural-earth-dir]` writes `assets/lib/gold-map.js` from Natural Earth 1:10m GeoJSON
(default folder `data/ne/` in the project, or `$GOLD_NE`; orthographic, hex grid,
highlighted region in gold, routes and label anchors; edit `LON0, LAT0` and the route list for a new region).

## 6. Motion grammar
| move | ease | frames | notes |
|---|---|---|---|
| drop-in (spheres) | quadratic fall + 0.12 bounce | 8 + 7 | from above the frame, 6 motion-blur samples |
| crane pull-back | cosine in-out | 10 | then keep drifting (never stop) |
| stack growth | cubic out | 25–35 | coins land on the spoken number |
| label glitch-in / out | squash 0.08→1 + 9-tap smear + flash | 5 / 4 | every number and title word |
| count-up | cubic out | 25–45 | lands on the spoken figure |
| pawns rise / gild | back(1.5) / cosine | 12 / 14, stagger 2–5 | centre out |
| whip pan | quadratic in / cosine | 6–13 | 7 samples, 1/30 s shutter |
| rotate-in, spin-in | cubic out | 11 / 32 | ring, $1 coin |
| door slam | quintic out | 8 | 7 samples |
| camera drift in holds | linear | whole shot | 5–15 % travel, orbit 10–20°; glows breathe ±10 % |

## 7. Transitions
Hard cut (to title cards, chart, map, plant, ending) · whip pan in one continuous space (ring → safe sit 6 m apart in
the `vault` set) · crane down / pull back · zoom-out reveal (map) · directional smear (map → coin: the look target
jumps 6 m over 5 frames with 8 blur samples) · rise from the floor (pawns, tanks) · colour-glow swap (red → gold).
Motion blur: give a shot `mb(t) → samples` and `shutter`; the player renders the shot at n instants inside the
shutter, averages them in HDR and post-processes once.

## 8. Sound
`tools/make_bed.py`: dark bed (detuned-saw pads + sub drone changing chord every 3.5 s, soft 72-bpm pulse, sparse
bell glints, drops under the title cards, resolve at the end), markers in `score/bed.json`. Mixed by the engine's
`sound.py` with `music_file`: `music_under_voice_db −14.5`, `duck_db 3`, `sfx_db −9`, `lufs −12.6` (the AAC mux
lands at ≈ −14). Effects (`CUES` / `score()` in `tools/build.py`): whoosh + thud on drops, whoosh on pull-backs and
whips, coin clinks on stacks and pours, glitch on number reveals, impact on title cuts, sparkle on the serif word,
ticks under count-ups, pops on tiles, stamp on "$0".

## 9. Build recipe
```bash
cp -r ~/.claude/skills/explainer-gold-studio/assets/template my-reel && cd my-reel
# 1) facts first (FACTS.md), then vo/script.json; voice it and check it
$EXPLAINER_PY -I ~/.claude/skills/explainer-engine/engine/audio/tts.py vo
# check the voice with Whisper small (explainer-styles tools/transcribe.py --model small <dir>); fix misheard words
# 2) shots: assets/lib/gold-shots.js (start from assets/kit/gold-shots.sample.js — every beat of the sample is there)
#    captions: CHUNKS / TITLE_LINES / CUES in tools/build.py; map: python -I tools/make_map.py <Region>
python -I tools/build.py
$EXPLAINER_PY -I tools/make_bed.py
$EXPLAINER_PY -I ~/.claude/skills/explainer-engine/engine/audio/sound.py score
ffmpeg -y -i score/audio/final.wav -c:a aac -b:a 256k assets/audio/final.m4a
npx -y hyperframes@0.8.210 check --json && npx -y hyperframes@0.8.210 snapshot --at <one time per beat> --no-end
npx -y hyperframes@0.8.210 render -o out/reel.mp4 -q delivery          # ~3 min for 61 s on an integrated GPU
python -I <engine>/qa/analyze_video.py out/reel.mp4 out/qa             # put a Whisper-small .vtt next to the mp4 first
python -I tools/compare.py <reference.mp4> out/reel.mp4 out/qa/compare.jpg beats.json
```
Put ffmpeg/ffprobe on PATH before HyperFrames. Each shot: `{ t0, set, fn(t) → state, mb, shutter }`; the state
holds `set, cam, look, fov, focus, aperture, bloom, warmI/warmPos, keyI/keyPos, rimI, envI, grade, sat, after()`.
`V.w(line, word, k)` gives word times — time every event to a word.

## 10. QA checklist and gotchas
- Snapshot every beat; compare with the source sheets; run the analyzer and hit §2. Then make `compare.jpg`
  (10–12 matched beats) and fix the weakest pairs at least twice.
- **Brightness and scene changes move together.** If brightness is high or extra look changes appear: shrink glows
  (size 4–9 world units, k 0.2–0.6), lower `grade`, keep the floor dark (it must never look lit). Find extra events
  with `assets/tools/lookcmp.py` (per-second brightness, share of pixels above 64, colourfulness, and the analyzer's look-change events for source and sample); an event at a cut means the two sides differ in how much of the
  frame leaves black — dim the brighter side (e.g. fade the chart's green before the map cut).
- **Motion too low**: never hold the camera; 5–15 % drift or a slow orbit in every shot, glows breathing ±10 %,
  key light sweeping down a stack. **hold_frac** counts frames with almost no change.
- **InstancedMesh with moving instances must set `frustumCulled = false`** — three caches the bounding sphere once
  and silently culls the coins later (the pour vanished).
- **Seeded RNG**: hash the seed (the kit's `rng` does) — a plain LCG gives near-identical first values for seeds
  1000, 1001, … and every coin followed the same path.
- Labels draw with page fonts loaded through `FontFace` in `K.ready`; use system Garamond for the serif word (do not
  ship it); Libre Baskerville Italic is the fallback.
- Keep the flag design on the front 40 % of the sphere's texture (`u` 0.3–0.7, `v` 0.3–0.72) or it wraps out of view.
- Coins pouring into an open safe must curve in through the front opening (quadratic Bézier via a point in front of
  it), not fall through the roof.
- Shell heredocs with Python triple quotes fail here — write patch scripts with the Write tool.

Files: references/analysis.md · references/sources.md · assets/kit/gold-kit.js · assets/kit/gold-shots.sample.js ·
assets/tools/ (build_sample.py, make_bed.py, make_map.py, compare.py, lookcmp.py) · assets/template/ (7-s starter: two drums,
glow, stack + label, gold title card; runs as-is)

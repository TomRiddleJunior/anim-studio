---
name: explainer-quote-collage-edit
description: "Makes a vertical 9:16 motivational quote-card collage edit (~14 s) in the format of a viral Instagram edit (@ebiko_editz, 'DISCIPLINE', 161k likes): a change on every beat of a phonk-style beat - a white card that builds a proverb word by word (each new word smears in sideways), a pink flash card that swaps to the second half, a slow push with a grey drop shadow, a printed page that pops in with a pincushion 'pillow' warp on the drop (highlighter swept under one line, a repeating '& …' ladder that fades and blurs down the page), an engraving-style figure (a man pushing a boulder) in a hatched field with the quote in a spotlight halo (vertical whip in), a white book plate with an engraved Titan holding the sky beside the quote (hard cut), a horizontal whip, a concrete wall where stencil words spray in one per beat, and a final white-line sketch of the boulder pusher on black that pops in and draws itself. Everything is drawn in code: paper and concrete textures, a line-engraving engine (tone-modulated line width, contour-following hatching, cross-hatching, contours), stencil type with bridges and overspray, and the beat (pitched 808 slides, FM cowbell riff, break, drop) synthesized in numpy; two mixes (full + SFX-only). Use for 'quote edit', 'motivational edit', 'stoic quotes reel', 'discipline edit', 'quote card collage', 'aphorism reel', 'ebiko editz style', 'engraving Sisyphus Atlas quotes', 'fast quote cuts on the beat', 'phonk quote edit', or any short public-domain quote montage cut on the beat. Builds on hyperframes; reuses the kw-kit compositor from explainer-kinetic-word-edit."
---
# Quote-collage edit — a card on every beat, engraved figures, a stencil wall, a sketch to end

Reverse-engineered frame by frame from one Instagram reel (**@ebiko_editz**, `DfWiiKOshhF`, "DISCIPLINE", 14.1 s, 1:1,
161k likes; `references/sources.md`). The format is a 14-second rhythm piece: short quotes on changing materials,
one visual change per beat or two, figures from classical myth as engravings, and a closing sketch. Our version keeps
the card order, the transitions and the beat structure, and replaces every quote, card, texture, figure and the music
with our own: public-domain aphorisms (Lao Tzu, Marcus Aurelius in George Long's 1862 translation, Seneca), cards and
engravings drawn in code, an original beat.

Sample: `the sample film (the render is not included in this repository)` — "Endure"
(14.0 s, 9:16; `_nomusic.mp4` beside it; SCRIPT.md, SAMPLE.md, POST.md, out/qa/; the sample project is not included).

## 1. Signature traits
- **Cut on the beat**: a visual change every 1–3 beats (0.6–1.8 s); the biggest change (the page) lands on the drop.
- **Materials as rhythm**: white card → pink flash → printed page → dark engraving → white plate → concrete → black.
  Same idea (keep going), new surface every time.
- **Words arrive in pieces**: the first card builds a two-part proverb word by word; the wall sprays one word per beat.
- **The pillow pop**: the next card appears at ~80 % size with concave (pincushion) edges over the old one and snaps to
  full frame in 3–5 frames. Used three times (page, wall, sketch).
- **Engraved myth figures** (boulder pusher, a Titan holding the sky) as the visual metaphor, never explained.
- **A highlighter + ladder**: one line highlighted neon yellow-green, then the same short phrase repeated down the page,
  each line fainter and more out of focus (depth of field).
- **End on a drawing**: a white line sketch on black, no text.

## 2. Measured metrics (engine analyzer)
Source: the engine analyzer's metrics (not included). Sample: the owner's QA `metrics.json` / `gates.json` (not included).

| metric | source | sample (render 3, delivered) | gate |
|---|---|---|---|
| duration | 14.14 s (1:1) | 14.0 s (9:16) | ±15 % |
| hard cuts / min | 12.73 (3: 2.40, 8.37, 10.70 s) | 12.86 (3: 2.33, 8.13, 10.43 s); render 2 had 4 (the sketch pop scored 0.72) | ±20 % |
| scene changes / min | 16.97 (4: 1.83, 4.83, 6.50, 10.50 s) | 17.14 (4: 1.83, 6.00, 7.67, 10.00 s); render 2 had 5 | ±20 % |
| visual changes by eye | 12 in 14 s (≈ 1 per 1.2 s) | 13 in 14 s | — |
| words / voice | none | none | — |
| motion · brightness · colourfulness | 20.1 · 0.739 · 13.5 | 10.4 · 0.682 · 8.9 | — (ours calmer, paper and stone) |
| loudness | −14.1 LUFS | −14.2 LUFS, TP −1.2 dBTP; SFX-only twin −17.1 LUFS, TP −1.4 | −14 ±1, ≤ −1 dBTP |
| first change | frame 0 (a word) | frame 0 (a word) | ≤ 0.4 s |
| unplanned black / flash frames | — | 0 (the 2 YAVG steps are designed cuts) | 0 |

- **The last card decides two gates.** The source's black sketch card scores 0.21 (under the 0.33 cut threshold)
  and sits in the last second, where the histogram rule cannot count it. Pop it in on one frame and it becomes a 4th
  cut and a 5th scene change. Start it at 50 % with a mild warp, fade it in over 0.12 s and grow it with an ease-in to
  the end (`TR[5]` in `film.js`): the histogram distance keeps rising to the last frame, so no peak is counted
  (render 3: peak scene score 0.10 at the pop).

- The analyzer's hard cuts here are the pink flash, the cut to the white plate and the pillow into the wall; the
  histogram scene changes are the pink card, the page drop, the engraving and the wall. `tools/scene_est.py` prints
  both rules for any mp4; run the same histogram loop in the browser before rendering.
- The sketch card at the very end is not counted when fewer than ~1 s of video follows it: keep the film at the
  source's 14.0 s, which also keeps the scene-change rate in the gate.

## 3. Beat map and card formula (103.4 BPM, beat = 0.580 s)
| beat · s | source | ours ("Endure") | transition |
|---|---|---|---|
| b0 · 0.0 | white card, one word | "A journey" | frame 0 |
| b1, b2 · 0.6, 1.2 | + words of a proverb's first half | "of a thousand" · "miles" | sideways smear pop (2 frames) |
| b4 · 2.3 | PINK flash card, second half | "begins with / a single step." (+ "— Lao Tzu") | hard cut, pink fades to white over 0.6 s, maroon text turns black |
| b4–b8 | slow push, drop shadow | push 1.05 → 1.17 | — |
| b8 · 4.6 | DROP: printed page, highlighter + "& …" ladder | "One step." + "& one more" ×7 cascading on 16ths | pillow pop-in |
| b11 · 6.4 | engraving: boulder pusher, quote in a spotlight halo | Marcus Aurelius 5.20 (Long): "The obstacle on the road helps us on this road." | vertical whip (new card from the top) |
| b14 · 8.1 | white plate: engraved Titan + sans quote | Seneca, *Hercules Furens*: "There is no easy way from the earth to the stars." | hard cut |
| b17 · 9.9 | the plate whips left | — | horizontal whip with motion blur |
| b18–b21 · 10.4–12.2 | concrete wall, stencil words one per beat | FIRE · TESTS · GOLD. · SENECA (*De Providentia* 5.10) | pillow pop-in, then spray-ins |
| b22.5 · 13.1 | black card, white-line sketch of the boulder pusher | the sketch draws itself in 0.7 s | slow pillow pop (0.62 → 1) |
| 14.0 | end | | |

**Card formula:** 5 quotes, ≤ 11 words each, from public-domain sources (check the translation's date). Card 1 = a
two-part proverb split across the pink flash (first half built word by word). Card 2 = one imperative + a repeated
fragment (the ladder). Cards 3–4 = two quotes that match an engraved figure (effort / weight). Card 5 = three short
words for the wall. End on the first figure, drawn as a sketch. Attribution in small type on every quote card (an
upgrade over the source, which has none).

## 4. Visual system (9:16, 1080 × 1920)
| card | palette | type |
|---|---|---|
| white card | paper `#fbfaf6` with soft fibre noise; text `#141414`; shadow `rgba(60,40,40,.35)` blurred, offset (4, 5) | Inter 400 92 px → 500 104 px for the second half |
| pink flash | `#cd7c88` fading to the white card in 0.62 s; text `#4a0f1c` → `#111` | Inter 500 104 px |
| printed page | `#e4e0d8` paper + gutter shadow at left; highlighter `#d9f23a` multiply with ragged ends; ink `#1d1b18` / `#34312c` | Libre Baskerville 400 118 px; ladder lines −8 % opacity and +1.3 px blur per line |
| engraving | paper `#f4f1ea`, ink `#161412`; field lines at ~70°; spotlight radius 360 px | quote Libre Baskerville 64 px; attribution italic 32 px |
| white plate | `#fbfaf6`; engraving; star sphere band + ticks + white star dots | Inter 500 76 px with a paper-coloured halo; attribution 34 px `#77736d` |
| concrete | fbm concrete, warm top-left light, stains, pits, a lit wall return at the right | Bebas Neue 330 px stencil (two bridges per letter), 7 px overspray, multiplied into the wall |
| sketch | `#070707`, white strokes 1.7–3.7 px at 55–95 % | — |

- **Safe area**: quotes between y 450 and 1450; the wall words between 600 and 1600; nothing below 1600 except the
  bottom of figures. Left margin 64 px.
- **Square → vertical** (the visible change): cards fill the full 9:16 frame; the ladder gets 8 lines; the engravings
  are composed tall (figure low, quote high in the light); the wall stacks three words.

## 5. Transitions (compositor shader in `assets/lib/film.js`)
| name | build | where |
|---|---|---|
| smear pop | the new word drawn 7× at ±(1−u)·22 px, alpha 0.22, for 0.07 s | words on card 1 |
| pink flash | full pink, alpha → 0 over 0.62 s (out2) under the new text | b4 |
| pillow pop-in | incoming card B sampled at q = p / s · (1 + k·r²) with s 0.78 → 1 and k −0.6 → 0 (out3, 0.16 s); a dark halo just outside B; A keeps moving underneath | page, wall, sketch (0.7 s) |
| vertical whip | A slides down, B comes from the top, 0.2 s io, 16-tap vertical blur ∝ sin(πu)·260 px | page → engraving |
| horizontal whip | A drifts −0.62 frame widths (in3) with blur up to 120 px | plate → wall |
| hard cut | — | engraving → plate |
| push | every card scales 1.0 → 1.06–1.17 over its life (out2/io) | all |

## 6. Motion grammar
- Every card moves (push-in, the page also drifts up 3 %); the wall words spray in with a 1.06 → 1 scale.
- Changes land ON the beat (`bt(k) = beat0 + k·B`); in-card events (words, ladder lines) on 8ths and 16ths.
- Nothing eases out slowly except the final sketch; the cut energy comes from short (≤ 0.2 s) transitions.

## 7. Caption system
The cards are the text. No captions, no SRT (no voice). Attribution lines are the only small type.

## 8. Sound (`tools/sound_design.py`, numpy only)
| section | build |
|---|---|
| intro b0–b4 | pitched 808 on every 8th with a 5–10 semitone downward glide (tanh drive), FM cowbell riff (E minor, original), no drums |
| break b4–b8 (pink) | 808 out; sustained E-minor pad, a rising bell arpeggio that accelerates (8ths → 16ths → 32nds), a clap roll, a noise riser |
| drop b8–b22.5 | kick on 1 and the "and" of 4, clap on 2 and 4, 16th hats (open on the last), 808 slides, cowbell riff with a dotted-8th delay; a low hit on the drop |
| out b22.5–end | everything stops; one long 808 with a 12-semitone glide and the riff's reverb tail; fade |
| SFX | ticks per word, a fwoop on the flash, a pop per pillow, highlighter squeak, ladder ticks, whooshes on both whips, a paper slap on the hard cut, a spray burst per stencil word, a chalk scratch while the sketch draws |
| mix | SFX peaks 6 dB under the music's loud windows; −14 LUFS, TP −1.5; `nomusic.m4a` = the SFX stem at the same gain |

## 9. Retention devices
- Frame 0 has words on it; something changes every ≤ 1.2 s; the drop is a new world (page) at 33 %.
- The pink flash is the only colour before the drop: a thumb-stopper at 2.3 s.
- The ladder (one phrase repeating, fading) and the stencil spray are the "rhythm" cards; the engravings are the
  "weight" cards; the sketch is a quiet button that loops back to a white card.

## 10. Do / don't
- Do: use public-domain quotes and say who said them; check translations (Long 1862 for Marcus Aurelius; translate
  Latin yourself); draw figures yourself (the engraving engine); keep quotes ≤ 11 words.
- Don't: reuse the source's quotes, cards, AI engravings or its audio; use a modern copyrighted translation (e.g. the
  popular 2002 rendering of *Meditations* 5.20); put text below 1600 px; let a card hold longer than 3 beats.

## 11. Code recipe
```bash
SK=~/.claude/skills/explainer-quote-collage-edit; PY="$HOME/.generative-music-video/venv/Scripts/python.exe"
cp -r "$SK/assets/template" "samples/quote-collage-<name>"; cd "$_"
# 1) cards: edit assets/lib/film.js -> CARDS (paint functions + zoom/drift/blur), TR (transitions per card), T (beats)
#    figures: assets/lib/qc-art.js -> pusherPrims / titanPrims (spheres, limbs, blobs, polys) + engrave() options
#    look-dev with no lock: python -m http.server 8766 --bind 127.0.0.1 ; open your look-dev page (scratch/dev.html, not included) ; sheet([t...]) / crop()
# 2) sound: film.json (dur, bpm, beat0) -> both mixes
"$PY" -X utf8 -I tools/sound_design.py
# 3) snapshots, render, deliver + QA (through the lock)
bash "tools/with_render_lock.sh" npx --yes hyperframes@0.8.210 snapshot --at <t,...> --no-end -o scratch/snap
bash "tools/render_locked.sh" "$PWD" scratch/master.mp4 delivery
bash "tools/with_render_lock.sh" bash tools/deliver.sh scratch/master.mp4
```
- **Engraving engine** (`QCART.engrave(W, H, prims, {spacing, bg, paper, ink})`): rasterises `sphere` (latitude lines
  around a tilted axis, longitude cross-hatch), `limb` (tapered capsule with a muscle `swell`; ring lines that bow
  around the limb, or `along: true`), `blob` (ellipsoid), `poly` (flat region with straight hatching at `ang`), each
  with `tone` offset, `rough` (fbm), `sp` (line spacing), `z`, `g` (contour group) and `edge` (own contour). Per pixel:
  tone from a top-left light → line width w = 0.5·(1−T)^0.85; cross-hatch under T < 0.5; a third diagonal under 0.16;
  contours only between groups or around `edge` parts (so a figure does not look jointed like a mannequin). `bg(x, y)`
  supplies a tone + line phase for the whole field (the spotlight card). ~6 s to build three cards at init.
- `QCART.sketch(prims)` → jittered white strokes (limb sides, cross contours, blob outlines, circle + scribble loops,
  ground hatch); `QCART.drawStrokes(ctx, strokes, prog)` draws them on in order.
- `QCART.concrete(W, H)`, `QCART.paper(W, H, tint)`, `QCART.globeDetail(canvas, cx, cy, r)`.
- `tools/`: `sound_design.py` + `audiolib.py`, `scene_est.py` (both analyzer rules), `deliver.sh`, `qa.py` (reference
  compare only with the optional `--ref`), `whisper_check.py` (skips when `voice` is false), `analyze_src.py`, `tile.py`, `spec.py`.

## 12. Gotchas (hit on the sample)
- **The pincushion folds**: `q = p·(1 + k·r²)` with k < 0 stops growing past r² = 1/(3|k|), so at small scales every
  screen pixel maps inside the card and the "pillow" covers the whole frame on its first frame. Clamp r² there
  (`r2c` in `sampB`); the outside then always maps outside. Side effect: with s 0.78 and k −0.6 the clamped card still
  overshoots the frame on its first frame (f_min = 2/3), so the page and wall pops read as a radial punch-in; for a
  visible smaller concave card on frame 1, start at s ≤ 0.6.
- **Same paper, invisible pillow**: a page popping in over a white card barely reads; the pop needs ≥ 2 frames at
  ≤ 0.93 scale (out3, not outExpo) and the dark halo outside the incoming card.
- **Mannequin look**: contours drawn between every primitive make ball joints. Group the body (`g`) and give only the
  parts that cross in front (`edge`) their own contour; darken the figure (tone −0.25) and tighten line spacing (5.2).
- **Whip edges**: sampling outside the card returned black and showed a black bar during the horizontal whip; clamp
  the UV to the card instead.
- **Ending length**: a hard change in the last second is not counted by the histogram rule; at 14.2 s our sketch
  counted (21/min), at 14.0 s it did not (17/min, the source's rate).
- A global `sed` of `14.2` also rewrote `gsap@3.14.2` in index.html.
- The analyzer's cut rule is ffmpeg's scene score > 0.33; the pillow into the wall scores ≈ 0.33 in the source, so it
  may or may not count. Check with `tools/scene_est.py`.

## 13. Variant: cut to the source's own audio (Instagram "Use audio")
When the post will use the original reel's sound through the app's "Use audio" (a licensed in-app route, credited by
Instagram), re-time the cut to that audio's grid. No file ever contains the source audio: every script decodes it in
memory and writes numbers only.
1. `tools/source_grid.py <source.mp4> grid.json` → tempo, beat 0 phase, flux and bass at each beat, top onsets, the
   drop (biggest bass rise) and where the bass stops. DISCIPLINE: 101.84 BPM (0.5892 s), beat 0 at 0.21 s, drop at
   beat 8 (4.92 s), bass stops at beat 22 (13.17 s); the source cuts ~0.1–0.2 s ahead of its flux peaks.
2. A variant config (`film_ig.json`): `bpm`, `beat0` from the grid; `times` pins changes that are not on the default
   beat (`{"sketch": 13.17}`); `sketchGrow` / `sketchDraw` fit the last card into the time left. `film.js` reads all
   of these from `window.FILM_CFG`; the default film is unchanged.
3. Copy the project into `scratch/ig/project`, write its `cfg.js`, and make its sound with
   `tools/sound_design.py <film_ig.json> <variant dir>`: our SFX only, −22 LUFS, TP ≤ −3, no music.
4. Render the variant through the lock, encode it with that SFX track, and score it with
   `tools/onset_score.py <source.mp4> times.json [our.mp4]`: offset 0.00 must be the best offset. Sample: scheduled
   changes score 4.58 at 0.00 (12 changes), against 0.43 for the default cut (whose best offset was 0.4–0.8 s and drifted).
5. POST.md: the "Use audio" steps (open the source reel → its audio → Use audio → upload, start 0:00, lower our sound),
   and the caveat that it works only if the creator allows audio reuse.

---
name: explainer-layer-stack
description: "Vertical 9:16 'what it really takes' engineering explainer reel — a warm off-white canvas, a static full-body presenter at the far left, and on the right a flat thin-ink vector 'system' diagram rebuilt every chapter (isometric shops, a crane lowering a black box, chat windows, a screen-face mascot, terminals typing, conveyors with numbered stages 01-04, marching-dash cables to three cards with a 0/3 → 3/3 counter, a line-up board, a crowd that explodes into a huge red number), each new layer sliding onto a small numbered layer-stack widget (base row black, newest row terracotta); a ladder of 'Then X broke → So you add LAYER → Now it works' beats with a red rubber stamp per failure, a halftone 'months later' wipe to the full checked stack, and a callback ending where one tiny Friday edit undoes it all; mono chapter tag top-left (// 07 — rag), karaoke captions with grey spoken words and keywords boxed in a light-blue design-tool selection with round handles; one fast male narrator ~200 WPM, UI sound effects, no music. Use for 'virex.explains style', 'layer stack explainer', 'everything you bolt around X', 'what it takes to run Y', 'system design explained in a reel', 'AI/RAG/infra/devops explainer with a presenter', 'each layer added after something broke', tech-architecture or product-anatomy reels. Also has two complete tone variants: emotional (a named character and one small object, sourced numbers, a felt-piano bed, the callback inverted into a warm success stamp) and horror / Halloween (played straight until the callback turns, the paper dims to a night set, drone, blackout and one sting). Builds on explainer-engine."
---
# Layer-stack — presenter + piece-by-piece system diagram reel

> `ENGINE` = `~/.claude/skills/explainer-engine/engine` (the **explainer-engine** skill: renderer, voice, score, QA). Rendered sample of this skill: `the sample film (the render is not included in this repository)` (source in `assets/sample/`).

A product that people think is "one thing" is rebuilt layer by layer, each layer bolted on after something
concrete broke. One warm canvas, one static narrator character at the left, and a flat ink-outline prop world on
the right that hard-cuts to a new arrangement every ~6 s while a small **layer stack** grows row by row. Builds
land on every stressed word (~1.5 per second), failures end in a red rubber stamp, and the reel ends on a callback:
the very first failure returns through one small human edit. Built from frame analysis of 1 source reel
(references/sources.md, references/analysis.md). **Original work only**: design your own presenter (never a known
character), your own mascot, brand and script; no channel marks.

**Format: vertical 1080×1920, 30 fps, 115–140 s** (`<html data-size="1080x1920">`). For 16:9: `data-size="1920x1080"`,
presenter at x 40–300 (feet at 92 % H, height 60 % H), diagram in x 360–1880, captions centred at 86 % H, chapter tag
at the same 12 % / 7.6 % offsets; scale everything else by H.

## 1. Signature traits
- **Warm canvas `#faf8f4` that never changes**, no texture, no grain, no gradients; flat fills, 3 px ink outlines,
  hard grey offset shadows, flat ground ellipses.
- **Static full-body presenter at the far left** (x 14–213, head 30.7 %, feet 68 % of H, 37 % tall), holding a prop
  at the hip; never animates; absent in the opening zoom, in wide chapters (pipeline, crowd) and the last two.
- **20 chapters, hard cut each** (on the first word of a sentence); chapter tag `// NN — two words` in mono grey.
- **A build on every stressed word**: slide-ins from off-frame with a tilt that straightens, drop-ins with bounce,
  pops out of a point, crane drops, typing terminals, counters, marching-dash cables, re-stages.
- **The layer stack**: numbered rows (`0N` mono + heavy caps label), base row black, newest row terracotta, slides
  in from the right with a dust puff; the final state gets green check circles and a dark status bar.
- **Failure = stamp**: big condensed caps in a thick double red rule on paper fill, rotated −7…−9°, slams in 2 f
  over a salmon halo; salmon halos mark every focal event.
- **Karaoke captions**: 1–7 words on ≤ 2 centred lines at 79–82 % H, newest word dark semibold, spoken words grey,
  keywords dark in a **light-blue selection box with two round handles**.
- **Two full-frame moments**: a crowd scene that blows up into a huge red number on a salmon splat, and a **halftone
  dot wipe** into "months later" + the complete checked stack. Ends on a stamp, no CTA.

## 2. Target metrics
Gates from the brief (± tolerance) vs the source and this skill's sample (`assets/sample/out/qa/metrics.json`).

| metric | source | gate | sample | note |
|---|---|---|---|---|
| duration | 128.6 s | ±10 % | 131.4 s | ✓ +2 % |
| scene changes / min · median | 0.93 · 20.7 s | ±15 % | 0.91 · 19.3 s | ✓ only the crowd blow-up and the halftone wipe register |
| hard cuts / min | 0 | 0 | 0 | ✓ chapter cuts on white score < 0.2; full-frame moments kept under ffmpeg's 0.33 (see §7) |
| build events / min (`assets/tools/events.py`, peaks > 1.5 · > 5) | 105.6 · 87.4 | ±15 % | 107.3 · 90.9 | ✓ the real pacing measure on a white canvas |
| motion mean / p90 | 6.47 / 13.65 | ±20 % | 5.36 / 9.67 | ✓ −17 % |
| WPM | 197.9 | ±10 % | 198.2 | ✓ (am_puck, speed 1.24, gaps 0.1 s) |
| colourfulness · brightness | 17.7 · 0.904 | ±12 % | 19.5 · 0.899 | ✓ +10 % — mute crowd/shirt colours, keep halos ≤ 0.45 opacity |
| loudness | −14.2 LUFS | ±1 LU | −14.4 | ✓ |
| hold_frac | 0.012 | — | 0.042 | the source's Instagram re-encode adds ~1 grey level of codec flicker even on still frames |

**How the density was reached** (from 2.8 → 5.4 motion, 32 → 91 events/min, measured): a calm 5 s of the source
(23.2–28.2 s) holds ~8 discrete builds plus two continuous ones (a question typing, a confidence number flickering
every 0.1 s), and its entrances take 2–4 frames. The kit now does the same by default — entrances capped at
4–7 frames (`K.SPEED`); every entrance pushes the neighbours already standing in the set away and lets them spring
back (`K.bumpAround`, the source re-balances its layout on each arrival); every caption keyword makes the newest
element thump +10 % and nudge its neighbours, other long words get a lighter beat ≥ 0.6 s apart (`K.emphasize`,
loop in the template); the product talks in dark typing bubbles (`K.say`); live numbers flicker (`K.flicker`);
messages stream along wires (`K.stream`); sets that share the frame with the presenter are drawn 15 % larger
about (660, 850). Set pieces that something stands on (buildings, a box under the mascot, a globe with pins) are
marked `K.still(…)` so they never jostle. Do **not** add a global camera drift — the source frame is locked between
events (measured).

## 3. Script formula
- **Length** ~420–435 words for ~130 s at ~200 WPM (Kokoro `am_puck`, speed 1.24, `gap` 0.1, `lead` 0.12; one
  line per chapter; tts.py adds ~0.2 s around each line which gives the source's 0.3–0.5 s sentence pauses).
- **Beat map** (% of runtime): 0–6 hook (everyone wants it → naive build in 4 verbs → it goes live) · 6–18 failure 1
  → fix 1 → benefit · 18–37 failure 2 → *why* → fix 2 as a **4-stage pipeline** → benefit · 37–89 five more
  failure → fix pairs (9–15 s each; one is a crowd/rush that blows up) · 89–93 recap as adjectives ("Months later,
  X is fast, backed up, secure, and fully watched.") · 93–100 **callback**: failure 1 returns because someone made
  one small edit on a Friday.
- **Sentence rules**: failures start with "Then …", fixes with "So you add …" + a list of 2–4 parts, benefits with
  "Now …"; second person, present tense, one concrete absurd example per failure (wrong digit → orders tyres;
  two people buy the last loaf). Numbers only where they are true or clearly part of the fictional story.
- **Captions**: put 1–2 keywords per sentence in `keys` (script.json); merge spoken URLs/numbers for display
  (`merges: [{line, from:'crumbwell', n:3, show:'crumbwell.shop'}]`).
- Facts: every general claim sourced in `FACTS.md` (what, value, URL, date checked).

## 4. Visual system
| role | hex |
|---|---|
| canvas | `#faf8f4` |
| ink outlines / black boxes / screens | `#1e1f24` / `#1b1c21` / `#1d2233` |
| caption dark / grey | `#131a27` / `#929194` |
| selection fill / line / handles | `#d3dff5` / `#3b78e7` / `#2e7af9` |
| chapter tag | `#7d7b77` |
| terracotta (stamps, new row, warnings) | `#c05d3b` |
| salmon halo | `#ebc3b5` |
| brand blue / navy / light | `#2f5bd8` / `#22345c` / `#d6e4fb` |
| window yellow · success green · tree | `#fde099` · `#2da160` · `#8db689` |
| shadow | `#d9d6d0` |

**Type** (engine fonts): captions Inter 650 / 450 at 66 px, line pitch 74 px, single-line baseline y 1533;
chapter tag Roboto Mono 400 24 px at (134, 147); stack labels Inter 800 tight; prop labels Roboto Mono 600 caps;
counters Oswald 900; stamps Oswald 700 caps 100–170 px; sticker Playfair Display italic.
**Layout**: presenter x 14–213; diagram x 240–1080, y 380–1310 (may run off the right edge); nothing informative
below 84 % H except captions.

## 5. Characters & objects (kit.js)
- `K.presenter(p, 14, 590)` — original "admin": curly dark hair cloud, round glasses, mustard overshirt, navy tee,
  olive trousers, rust sneakers, clipboard at the hip, lanyard. **Static.** Wrap in `W()` to show/hide.
- `K.mascot(p, x, y, s, {face, hat})` — the product as a browser window on legs with a **dark screen face**;
  `m.face(t, 'happy|grin|worried|shock|sad|sleep|dizzy|wink')`, `m.hatOn(t)`, `m.wave(t)`, `m.hop(t)`,
  `m.squash(t)`, `m.armUp(t)`, `m.tilt(t)`; `K.jitter(m.jit, t0, t1)` for nerves.
- Props: `K.building`, `K.tree`, `K.walker`, `K.crane`, `K.serverBox` (fan spins), `K.miniServer`, `K.window`
  (chat/browser, `addr:true`), `K.terminal` (+ `term.typeLine(i, str, t, cps)` with riding cursor), `K.keyboard`,
  `K.db`, `K.doc`, `K.ticket`, `K.padlock`, `K.shield`, `K.envelope`, `K.globe` + `K.pin`, `K.photo`, `K.calendar`,
  `K.clock`, `K.gauge`, `K.tv`, `K.mug`, `K.hdd`, `K.bell`, `K.camera`, `K.panel`, `K.funnel`, `K.van`, `K.tyre`,
  `K.loaf`, `K.person` (bust, `phone`/`cap`/`frown`), `K.crowd` (bobbing), `K.snoop` + `K.magnifier`, `K.logo`,
  `K.brandSticker`, `K.pill`, `K.bubble`, `K.thought`, `K.check`, `K.cross`, `K.excl`, `K.qmark`, `K.heart`.
- Stack: `K.stack(p, x, y, w, layers, {fresh, rh, size})` → `.rows`, `.addCheck(t, i)`, `.recolor(t, i, fill)`;
  `K.statusBar`; conveyor `K.conveyor(p, x, y, w, ['01 CHECK', …])` → `.light(t, i)`; `K.station`.

## 6. Motion grammar
| move | kit call | frames | ease |
|---|---|---|---|
| slide in from off-frame (cards, people, terminal) | `K.slideIn(el, t, side, 500–700, {rot})` | 4–5 | back.out(1.6) |
| drop in with bounce | `K.dropIn(el, t, 500–900)` | 7 | back.out(1.4) |
| pop out of a point | `K.pop(el, t, {origin})` | 5 | back.out(2.6) |
| crane lower on cables | sample c01 | 20 | power2.inOut + `K.puff` + thud |
| keyboard rise | sample c03 | 8 | back.out(1.3) |
| typing | `term.typeLine` / `K.type` | 30–60 cps | linear |
| stamp slam | `K.stamp` + `K.slam(el, t)` | 2 + 3 rebound | sets (130 % ghost → 100 %) |
| salmon halo | `K.pulse(p, x, y, r, t, {before})` | 7 in, hold 0.5–1 s | back.out(1.8) |
| re-stage / exit | `K.restage`, `K.flyOut` | 7–10 | power3.inOut / power3.in |
| camera zoom / dolly (named moments only) | `K.camTo(g, t, scale, cx, cy)` | 12–15 | power3.inOut |
| live cables | `K.march(path, speed)` on a 12/9 dash, 7 px dark | continuous | — |
| nerves | `K.jitter(m.jit, t0, t1)` | continuous | 24 Hz noise |
| make room (automatic on every entrance) | `K.bumpAround(el, t)` — neighbours ±72 px, damped spring τ 0.22 s, period 0.4 s | 8–12 | spring |
| stressed-word thump | `K.emphasize(chapterGroup, t, {amt, nudge})` | 6 | power2 yoyo |
| the product talks | `K.say(p, x, y, text, t, {tail, out})` — dark bubble pops from its tail, text types at 48 cps | 4 + typing | back.out |
| live number | `K.flicker(el, t0, t1, fmt)` — a new value every 0.1 s | continuous | — |
| message stream | `K.stream(p, n, make, path, t0, period, travel)` | continuous | smoothstep |
| idle life | mascot hover (9 px), people bob (6 px) — built in | continuous | abs-sine |
Entrances are 4–7 frames (source 2–5); stagger lists 0.07–0.1 s; land a move on (or 2–4 f before) its word; a new
visible change every ~0.6 s.

## 7. Transitions
| name | build | frames | use |
|---|---|---|---|
| chapter hard cut | `X.scene(name, t0, t1)` per chapter, t0 = line start − 0.1 s | 1 | every chapter |
| zoom-out reveal | chapter group from scale 1.37 to 1 while the presenter slides in | 12 | opening only |
| re-stage | old elements `K.flyOut`, main element `K.restage` to a new slot, new ones drop in | 8–10 | mid-chapter turns |
| crowd blow-up | `K.crowd` rises, big red number slams over a salmon splat (opacity ≥ 0.9 so it leaves the background histogram bin), papers burst; in the last 0.25 s the crowd drains down and the splat fades, then the cut to white | — | the rush chapter |
| halftone wipe | `K.halftone(t0 − 0.34, 0.84)` dots grow, hold, shrink; radius ∝ √progress so the covered area changes linearly (max ffmpeg scene score 0.22, source 0.26) | 25 | into "months later" |
Chapter changes in the source are plain 1-frame cuts (measured at 7.57, 12.70, 17.20 s); on a white canvas their
ffmpeg scene score stays at 0.16–0.30, under the 0.33 cut threshold, so the analyzer reads 0 cuts — keep sets airy
and never cut from a full-frame fill straight to white.

## 8. Sound
`sound.json`: `{"preset": "none", "sfx_db": -4, "lufs": -14.2, "end_hit": false}` — **no music** (source VO gaps
are silent). One fast male voice (`am_puck` 1.24). SFX on every build: `swoosh`/`whoosh` slides, `pop` pops,
`drop`/`thud` landings, `type` typing, `stamp` slams, `blip`/`blip_up` counters and checks, `error` warnings,
`success` completions, `horn` for vehicle gags, `paper` for documents, `riser` under count-ups.

## 9. Build recipe
1. Copy `assets/template/` to `samples/<name>/`; it runs as a 3-chapter demo (`ENGINE/make.sh <dir> --draft`).
2. Write `script.json`: one line per chapter (~20), `keys` per line; run TTS (make.sh does it) and check it with
   Whisper; respell misheard words.
3. In `scene.js` keep the `chap(i, build)` + `miniStack()` + `K.tags` + `K.captions` + emphasis-loop frame (see the
   sample `assets/sample/scene.js` for all 20 chapters). Per chapter: one set, 10–15 builds on words (a new
   change every ~0.6 s), one `K.say` for the product, one stamp per failure, one stack row per fix, `K.pulse`
   behind each focal event, `K.still` on anything something stands on.
4. Hide the presenter for wide/full-frame chapters (`X.tl.set(PW, {autoAlpha: 0}, t)`).
5. `--stills` at every chapter, then a draft, then `make.sh <dir> --skip-tts --workers 3`.
6. Build `out/qa/compare.jpg` with `python -I assets/tools/compare.py <source.mp4> <ours.mp4> out/qa/compare.jpg "srcT:ourT:label" …` (10–12 beats) and iterate twice on the weakest pairs.

## 10. QA checklist
- Stills: presenter never overlaps a caption; nothing informative below 84 % H; stamps span 55–85 % of the width;
  stack rows readable at phone size (labels ≥ 20 px); captions ≤ 2 lines.
- Gates: duration, scene changes (exactly the two full-frame moments), WPM, colourfulness, brightness, LUFS as §2.
- Pacing: `python -I assets/tools/events.py <mp4> <out.json> 5` → 75–100 build peaks/min (source 87.4); motion mean
  ≥ 5.2 (source 6.47). Per chapter, anything under ~3 needs more builds, a `K.say`, a stream or a re-stage.
- Cuts: run ffmpeg's scene score over the render; every frame must stay < 0.33 (the analyzer then reads 0 cuts).
- Don't: drift the camera, add music, grain or gradients, animate the presenter, use the source's character,
  logo or sentences.

## 11. Tone variants: emotional and horror
The format stays: warm canvas, static presenter, chapter tags, karaoke captions, a build on every stressed word, red
failure stamps, stack rows, one full-frame blow-up, the halftone "months later" wipe and a Friday callback. Story,
pacing, sound and the ending change. Each variant is a complete project with its own kit additions and a full recipe
(`VARIANT.md`). When a tone is asked for ("moving", "heartwarming", "emotional", "scary", "creepy", "Halloween"), copy
that project instead of `assets/template/`.

| | emotional: lost dog | horror: haunted house |
|---|---|---|
| project · recipe | `assets/sample-emotional/` · `VARIANT.md` | `assets/sample-horror/` · `VARIANT.md` |
| film | `the sample film (the render is not included in this repository)` (95.8 s, 14 chapters) | `the sample film (the render is not included in this repository)` (89.7 s, 14 chapters) |
| premise | Everything that has to work for a microchip's one number to bring a fictional dog, Maple, home. The callback is inverted to success: a green "SHE'S HOME" stamp, and the old tag goes back on her collar. | A fictional haunted attraction (Hollow Pines) built layer by layer and played straight. The callback is the headcount coming back wrong (12 out, 11 in) as a faceless figure walks out last. |
| canvas | Unchanged `#faf8f4`; teal and honey accents; red only for failures. | Unchanged for ch. 01–08, then one small step darker per chapter cut. The last chapter crossfades to a night copy of the set (pale ink on `#121216`), then a 6-frame blackout and a red "12 / 11" on black. |
| voice | `af_heart` 1.0 (~168 WPM), longer pauses before the recap and the callback. | `am_puck` 1.22 (~198 WPM), slowing in the last chapter. |
| sound | Softer UI SFX (`sfx_db −9`) plus a synthesized felt-piano bed (−22 dB). It rises on the callback, and its chord rings alone on the stamp. | UI SFX, a low drone from ch. 09, a heartbeat, 1.45 s of true silence, one sting on the blackout. |
| kit additions | `kit-warm.js`: `K.dog` (Maple: wag, perk, droop, tagOff/tagOn), `K.chip`, `K.scanner`, `K.recordCard`, `K.drawer`, `K.phone`, `K.shelter`, … Presenter `prop: 'leash'`; `K.say` measures mono text correctly. | `kit-horror.js`: `K.canvasTo`, `K.NIGHT` + `K.inNight` (build a set twice and crossfade), `K.barn`, `K.pine`, `K.haunt` mascot, `K.scarer`, `K.figure`, `K.guest` + `K.walk`. |
| facts | Two sourced numbers (Lord et al., JAVMA 2009: 53 shelters, 58 % of looked-up chips registered) plus AVMA guidance, all in `FACTS.md`. | Fiction, no factual claims. |
| measured | 0 hard cuts · 88.9 build events/min · motion 4.12 · 168 WPM · brightness 0.91 · −14.2 LUFS | 0 hard cuts · 82.3 build events/min · motion 5.09 · 198 WPM · brightness 0.78 (first 70 %: 0.90) · −14.3 LUFS |

- **Emotional rules**: one character with a name and one small object that returns at the end, no gags, numbers only
  where sourced, the bed stays in a warm major key and only lifts at the end.
- **Horror rules**: play it completely straight until the callback. Hide the figure once or twice earlier for rewatches.
  No gore. Change the canvas only on cuts.
- **Gotchas**:
  - Slower narration lowers the motion number, so add a small camera push per chapter.
  - GSAP turns number-like text ("0009") into 9, so set counter digits per frame.
  - `K.flicker` leaves a stale value unless the final value is set separately.
  - `K.still` must be set before later entrances.
  - `K.type` empties its text at build time.

Files: references/analysis.md · references/sources.md · assets/kit.js · assets/template/ · assets/tools/ (events.py, compare.py)

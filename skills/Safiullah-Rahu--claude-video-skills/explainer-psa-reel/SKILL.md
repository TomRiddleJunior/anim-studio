---
name: explainer-psa-reel
description: Makes vertical (9:16) Hinglish / Hindi public-awareness reels in the "medical-plate" Instagram format — hard-cut cards on aged cream paper, dark specimen boards, brown spotlight boards and mint action cards with a red floor band; a thin top rule with tiny mono labels ("STEP 1 · FIG. 11"); a two-line romanised heading top-left (small black setup + huge red condensed punch line that blurs in on the stressed word); cut-out people with paper edges, vintage anatomical engravings, flip-clock counters, pies, isotype rows, red X marks, rubber stamps, kraft tape labels, a phone dialling 112, glowing beat words, and a "family group mein bhejo" + HAAN / NA comment-poll ending. Use for "health awareness reel", "first-aid / CPR / stroke / heart-attack / dengue reel", "Hinglish explainer reel", "sciencetein-style" or "kashur scientist-style" PSA, "what most people do wrong" safety reels, "3 steps to save a life", Indian public-health / safety / civic-awareness shorts in Hindi, Urdu or Hinglish (or any language with romanised headings). Builds on explainer-engine.
---
# PSA-reel — Hinglish medical-plate awareness reel

> `ENGINE` = `~/.claude/skills/explainer-engine/engine` (the **explainer-engine** skill: renderer, voice, score, QA). Rendered sample of this skill: `the sample film (the render is not included in this repository)` (source in `assets/sample/`).

A one-minute life-skill lesson told as **a stack of medical-textbook plates shown one at a time and hard-cut on a
calm, nearly non-stop Hindi/Hinglish voice**. Every card = one ground, one top rule with a figure number, one two-line
heading, one picture; the stressed word lands as a big red condensed line; small paper props (stamps, tape, X marks,
flip tiles) mark each fact; the ending asks the viewer to send it to the family group and answer a HAAN / NA poll.
Built from frame-by-frame analysis of 1 source reel (references/sources.md, references/analysis.md). Original work
only: your own topic, people, wording; never the source's account names, footage or exact lines.

Format: **vertical 1080×1920, 30 fps, 50–110 s**. `index.html` declares `<html lang="en" data-size="1080x1920">`;
`--draft` renders 540×960. **16:9 version:** set `data-size="1920x1080"`, keep heading sizes relative to H, put the
heading block top-left and the picture in the right two-thirds (PK.card/PK.head read X.W/X.H; re-place props by hand).

## 1. Signature traits
- **Hard cuts only**, one card per VO sentence (2–7.5 s, median ≈ 5 s); no camera moves except a slow push on some cards.
- **Grounds by meaning**: cream paper + vignette (problem), dark grid "specimen" board (inside the body), brown
  spotlight board (time / "you" / rhythm / poll), mint + dark-red floor band (action, good news, share). ⅓ of the
  runtime on dark boards.
- **Top rule**: tiny tracked mono label left (GALAT, STEP 2, TIME IS BRAIN · SAVER 2006) + "FIG. n" right, thin rule
  under it, binder dots down the left edge.
- **Two-line romanised heading**: ink setup line ("ZYAADA LOG") + red punch line ("YE KEHTE HAIN") that blur-fades in
  (5 f) on the stressed word. Headings are the captions — no subtitles.
- **One picture per card**: ordinary local people as cut-outs with a paper edge + soft shadow; vintage engravings
  (white line on the dark board, ink on cream); a small infographic kit (flip tiles, pie/clock pie, isotype, numbered
  circles, bubble, checklist, tape, stamp, phone, ambulance, glow beat words).
- **Red is rationed** to the punch line + the one thing that matters; green only for the right answer.
- **Beat map**: relatable emergency + "aap kya karoge?" → GALAT → stakes in the body with a running counter → one
  statistic → numbered steps → myth-buster → "koi bhi" → family group → comment poll + FOLLOW + SHARE → fade.

## 2. Target metrics
| metric | source De6U-P2qMvw | sample (BE FAST, 70 s) | target |
|---|---|---|---|
| hard cuts / min (analyser) | 6.05 | 6.83 | 5–8 (real card changes ≈ 11–15 / min; cream→cream cuts read weakly) |
| scene changes / min | 8.81 | 9.39 | 8–10.5 |
| median scene / median shot (s) | 5.0 / 7.17 | 4.33 / 6.5 | 4–5.5 / 5.5–8 |
| motion mean / p90 | 3.43 / 3.90 | 3.95 / 4.19 | 3–4.5 / 3.5–4.5 |
| hold_frac | 0.40 | 0.45 | 0.35–0.50 (static cards + one idle loop on about half of them) |
| colourfulness / saturation | 31.3 / 0.22 | 31.0 / 0.21 | 27–35 / 0.18–0.25 |
| brightness / dark-frame fraction | 0.57 / 0.34 | 0.57 / 0.29 | 0.52–0.62 / 0.28–0.40 |
| WPM overall | 146 | 148 | 140–155 |
| loudness | −14.1 LUFS, LRA 2.0 | −14.1, LRA 2.4 | −14 ± 1, LRA ≤ 3 |
Deliberate deviation: the sample is 70 s (source 109 s) and has 17 cards, so cards are a little shorter (the six BE FAST
letters run as a 2–3 s-per-card montage, like the source's short three-steps bridge cards).

## 3. Script formula
| % runtime | beat | card(s) | pattern |
|---|---|---|---|
| 0–9 % | **Hook** | 1 | place + sudden event in one breath, then "aap kya karoge?" (handwritten on the card) |
| 9–15 % | **GALAT** | 1 | "Zyaada log…" + the 1–2 wrong reactions, each crossed with a red X |
| 15–30 % | **Stakes in the body** | 2–3 | name it (engraving), mechanism in one clause, a counter that runs while VO says "har minute" |
| 30–40 % | **Statistic / window / "it's you"** | 1–2 | one round, checkable number (pie, clock pie, isotype); "pehchaanna aapko hai" / "sirf aap" |
| 40–80 % | **Steps** | 3–7 | "bas ye N kaam" or an acronym; each step = number circle + action picture + one checkable detail |
| 80–88 % | **Myth-buster / don't** | 1–2 | the fear or wrong reflex → stamp |
| 88–100 % | **Koi bhi → family group → poll** | 3 | family cut-out with labels · phone chat · HAAN / NA poll + FOLLOW + SHARE + disclaimer line, fade |
- **Voice**: Kokoro Hindi `hm_omega` (warm male, like the source; `hm_psi`, `hf_alpha`, `hf_beta` also work), Devanagari
  text, English medical words written in Devanagari (ब्रेन स्ट्रोक, टाइम), numbers spelled in Hindi (एक सौ बारह). `speed`
  1.1, `gap` 0.26, `lead` 0.35, `tail` 2.2 → ≈ 148 WPM overall. Kokoro Hindi has no word timestamps — `tts.py`
  estimates them (±0.15 s), so time moves on **distinct words** with `PK.w(id, 'word')`.
- **Headings** romanised Hinglish, ≤ 3 words per line ("PAANI, KHAANA?" / "ABHI NAHI"). Line 2 = the stressed VO word.
- **Facts**: every number must be checkable; put the source in the mono label ("TIME IS BRAIN · SAVER 2006") and list
  claims + sources in the project's FACTS.md. Add the disclaimer ("SIRF JAAGRUKTA KE LIYE · EMERGENCY 112") on the
  last card. No fake doctors, no real people's faces.
- Sample lines (BE FAST): "संडे लंच पे दादाजी बोलते बोलते अचानक अटक जाएं, हाथ से कप गिर जाए। आप क्या करोगे?" ·
  "ज़्यादा लोग कहते हैं, लेट जाओ, सुबह तक ठीक हो जाओगे।" · "बिना इलाज, हर मिनट लगभग उन्नीस लाख न्यूरॉन्स खत्म होते हैं।"

## 4. Visual system
| role | hex | |
|---|---|---|
| cream ground centre / edge / corner | `#d2c9af` · `#ad9f83` · `#857a63` | heavy elliptical vignette |
| mint ground / floor band | `#d2e4cb` → `#879a83` / `#803a32` (top edge `#8e443b`) | floor = bottom 12 % |
| brown board / spotlight | `#28231f` / `#6f6352` (warm `#6a4434`) | spot at centre or lower centre |
| specimen board / grid | `#1e1e1e` / white 4.5 % lines every 54 px | sprocket column + vertical mono text on the right edge |
| ink / light ink | `#22170d` / `#d6d0c4` | heading line 1 on paper / on dark |
| punch red / stamp red / X red / hand red | `#b8323a` / `#ba343c` / `#cf3b3c` / `#a83739` | |
| mono label / rule | `#60543e` / `#7f7154` (dark: `#8d877c` / `#4b463f`) | |
| paper card / bubble / tile | `#e9e1cb` / `#efe7d6` / `#f0e8d9` + brass `#a8916a` | |
| right-answer greens | stamp `#3d743a`, call `#45b05c`, chat `#3e7a56` | |
Typography (engine fonts, 1080×1920): heading line 1 **Oswald 700** 71 px (+1.2 px same-colour stroke = Anton-like
weight) at baseline 236; line 2 Oswald 700 **171 px** red, cap-top at 255, auto-shrinks to ≤ 72 % W; top label
**Roboto Mono 500** 19 px, tracking 4.5, baseline 129, rule at 151; tape / checklist / poll Oswald 600–700 46–76 px;
handwriting **Caveat 700** 74–92 px rotated −6…−9°; glow words Oswald 700 380 px. Margins: text x = 48, right label
x = 1035. Keep all text inside y 120–1600 and out of the right 12 % below mid-frame; big figures may run to the bottom.
Texture: per-ground canvas paint (vignette, fibres, folds at 23 % / 63 % W, faint ruling, binder dots) + `X.grain(0.05)`.

## 5. Characters & objects (assets/kit.js → `window.PK`)
- `PK.person(parent, x, y, o)` — front-view cut-out (feet at x, y; ≈ 700·scale tall): `top` kurta|shirt|hoodie|kameez|saree,
  `bottom` pyjama|trousers|jeans|salwar, `hair` short|white|long|bun, `jacket`, `dupatta`, `glasses`, `moustache`,
  `bindi`, `print`; paper edge + shadow via `PK.cutF(scale)`. Returns `armL/armR` (rotate about the shoulder with
  `svgOrigin:'0 0'`), `mouth`, `lidL/lidR`, `droop(t)` (face-droop acting). Clip a big scale for busts/close-ups.
- Props: `PK.table` (long cloth hides legs), `PK.cup` (`.cup` animates), `PK.plate`, `PK.glass`, `PK.pillow`,
  `PK.alarm`, `PK.ambulance`, `PK.garland` (marigold swag), `PK.phone` dial/chat.
- Engravings: `PK.brain` (lateral plate: contour-line gyri with an echo line, hatching, glow; `vessels(t)`, `clot(t)`,
  `spread(t0,t1)`, `dim`, `beat(t0,t1,hz)`), `PK.eye` (frontal, hatched), `PK.snellen` (`blur(t)` smears + half-veils),
  `PK.ecg` (heart topics). Contour helper `PK.contours(fn, …)` makes any organic engraving texture.
- Infographics: `PK.flip` (tiles; `set(t, text)`, `run(t0,t1,values)`), `PK.pie`, `PK.clockPie(hours)`, `PK.isotype`
  (`red`, `redAt`), `PK.circle` (numbered / lettered, Ø 168–180), `PK.bubble`, `PK.check` (`cross`, `tick`),
  `PK.tape` (multi-word reveal), `PK.stamp`, `PK.x`, `PK.hand`, `PK.arrow` ("5 CM"), `PK.glowWord`, `PK.poll`, `PK.pill`.

## 6. Motion grammar (30 fps)
| move | kit call | frames | ease |
|---|---|---|---|
| card change | `PK.card` (X.scene) | 0 — hard cut 0.14 s before the line | — |
| heading line 1 | `PK.head` | 2–3 f fade, 0.05 s after the cut | none |
| heading line 2 | `PK.head` | 5 f opacity + 6 f blur 9 → 0 | power2.out |
| object pop | `PK.pop` | 6 f, scale 0.15 → 1 | back.out(2.2) |
| stamp | `PK.stamp` | 3 f, scale 1.35 → 1 | expo.out |
| red X | `PK.x` | 3 f per stroke, 2 f apart | power2.out |
| tape | `PK.tape` | 4 f scaleX from the left | power2.out |
| slide-in | `PK.slide` | 10–11 f from off-card | power3.out |
| isotype build | `PK.isotype` | 1 figure / 1.5 f | power2.out |
| pie / clock sweep | `PK.pie`, `PK.clockPie` | 36–40 f | power1.inOut |
| counters | `PK.flip.run` | value every 1–4 f, flap shade 3 f | stepped |
| handwriting | `PK.hand` | write-on 12–25 f | none |
| idle (one per card at most) | `PK.push` 1 → 1.035–1.07 over the card · `PK.flicker` · `PK.pulse` · `brain.beat` · `X.every` loops | whole card | linear / sine |
| flash / end | `PK.flash` (1 f red, 7 f decay) · `PK.fadeOut` (18 f) | | |
Most cards hold still between events (hold ≈ 40–45 %): never add idle motion to every card.

## 7. Transitions
| name | build | frames | when |
|---|---|---|---|
| hard cut | consecutive `PK.card` spans | 0 | every card change (never wipes, whips or zooms) |
| blur-in punch line | `PK.head(…, tLine2)` | 5–6 | on the stressed word of each card |
| pose swap / acting | tween the person parts (`armR`, `droop`, sway about the feet with `svgOrigin`) | 10 | the hook's event, sign demos |
| red flash | `PK.flash(t)` | 1 + 7 | an injury or the clot moment |
| fade to black | `PK.fadeOut(END − 0.65)` | 18 | last card only |

## 8. Sound
`sound.json`: `{"preset": "doc-pulse", "bpm": 96, "key": -2, "sections": [energy 1 for the hook, 2 from the stakes,
1 for the window, 2 through the steps, 1 for the ending], "music_under_voice_db": -19, "duck_db": 6, "sfx_db": -3,
"lufs": -14, "end_hit": false}` → a low pad/e-piano/tick bed ~17 dB under the voice, LRA ≈ 2.4 (the source is flat).
SFX map: pop → cut-outs/circles · stamp → stamps · error + scribble → red X · paper → tape/cards · woosh_low (soft) →
red punch line · tick/tock → flip tiles and clocks · heartbeat → hook tension and the organ glow pulses (stop them at
the critical moment) · beep (pitch 0.7–1.0) → phone digits, two-tone beep pairs (0.69/0.86) → siren with the ambulance ·
blip/notif → chat bubbles · impact → the acronym reveal. VO: calm, warm, conversational, no long pauses.

## 9. Build recipe
1. Copy `assets/template/` (index.html, kit.js, scene.js, script.json, sound.json) to the project folder.
2. Write FACTS.md first (claims + sources), then script.json: one Devanagari line per card, 140–175 words for 60–70 s.
3. `ENGINE/audio/tts.py` via `make.sh <project> --draft --workers 3`; read the printed line times; check that every
   stressed word you will sync on is a **distinct** word in its line (`PK.w(id, 'शब्द', nth)`).
4. In scene.js list the line ids, `cutAt = line.start − 0.14`, and build one block per card:
   `PK.card` → `PK.head(c, l1, l2, c.t0 + 0.05, w(id, stressed))` → picture (`PK.person` / engraving / infographic) →
   1–3 marks timed to the words they name (`PK.stamp`, `PK.tape`, `PK.x`, `PK.hand`, counters) → optional idle loop.
5. Ground rhythm: alternate cream / dark / mint so ≈ ⅓ of the time is dark; mint only for actions and sharing.
6. `node ENGINE/render.mjs <project> --stills …` at the end of every card; look at them; then the full render
   `make.sh <project> --skip-tts --workers 3` and compare `out/qa/metrics.json` with §2.

## 10. QA checklist
- Stills: heading never collides with the picture (picture starts ≥ y 450); line 2 fits (auto-shrink kicks in > 72 % W);
  text ≥ 36 px except the mono label row and disclaimer; nothing important under the IG rail (right 12 %, y > 960) or
  caption zone (y > 1575) except figures and the floor band.
- Each card: hard cut, line 1 within 3 f, line 2 on the stressed word, ≤ 4 events, red only on the punch + one object.
- Metric gates: scene changes 8–10.5 / min, hold 0.35–0.50, colourfulness 27–35, dark-frame 0.28–0.40, WPM 140–155,
  −14 LUFS.
- Do: ordinary local people, round checkable numbers, FIG. numbers incrementing, a disclaimer, the HAAN / NA poll.
- Don't: whip pans, zoom transitions, kinetic word-by-word captions, emoji, real brand/app UIs, real people,
  medical advice beyond the cited sources (e.g. never "give aspirin").
- Engine notes: `X.word` strips Devanagari vowel signs (so 'बी' matches 'बस') — use `PK.w`; `X.drawOn` replaces dash
  arrays (use `stroke-dasharray` only on static paths); keep transforms on `PK.place` inner groups so pops never fight
  placement.

Files: references/analysis.md · references/sources.md · assets/kit.js · assets/template/

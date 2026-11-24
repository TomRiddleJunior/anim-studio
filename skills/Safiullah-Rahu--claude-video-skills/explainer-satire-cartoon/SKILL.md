---
name: explainer-satire-cartoon
description: "Makes fast vertical satirical news-cartoon reels (9:16, 45–65 s): chunky toy-like bobble-head characters with one hard violet cel-shade band and thin plum outlines, warm cream offices and sky-blue exteriors, hard cuts every ~2.7 s with 1-frame white flashes and camera orbits, props that literalise every clause (a wall calendar with a circled date, a desk sign that flips to ON HOLD, a poll arrow that shoots up, a costume that pops on), price-sign counters that scramble, roll and finally explode, an everyman in loungewear who pays the price, a deadpan narrator at ~230 WPM with no music, and small yellow outlined captions at 70 % height. Structure: cold-open claim → \"So why…?\" → each side's motive → the deal → the cost to you → the promise → a callback punchline. Use for \"satirical cartoon reel\", \"political satire explainer\", \"potato-crimes style\", \"Instagram/TikTok satire short\", \"why politicians time X around elections\", \"cartoon that explains a scandal\", fast captioned 3D-toy cartoon shorts about incentives, prices or policy — with fictional characters. Builds on explainer-engine."
---
# Satire cartoon (vertical reel)

> `ENGINE` = `~/.claude/skills/explainer-engine/engine` (the **explainer-engine** skill: renderer, voice, score, QA). Rendered sample of this skill: `the sample film (the render is not included in this repository)` (source in `assets/sample/`).

A 45–65 s vertical reel that tells a pattern of self-interest as a claim, at a gallop: a sardonic narrator (≈ 230 WPM,
no music) and a hard cut on every sentence, each sentence acted out by **toy-like bobble-head figures** — big heads,
stubby legs, mitten hands, one hard **violet cel-shade band**, thin plum outlines, paper grain — in warm cream rooms and
sky-blue exteriors. Props carry the argument: a calendar with the date circled, a sign that flips, an arrow that shoots
up, and **price-sign counters whose numbers scramble and leap** until the last line explodes them. An everyman in
loungewear stands in for the viewer. Built from frame analysis of 1 source reel (references/sources.md, 252 k likes).
**Original work only — never caricature or quote real, living people; use a fictional place and cast.**
Format is **9:16, 1080×1920, 30 fps** (source 720×1280 @ 24). For 16:9, see §9.

## 1. Signature traits
- **Hard cuts every 1.5–5 s (median 2.7 s, ~18.5/min)**, landing ~2 frames before each sentence; 1-frame white
  **flash frames** on reveals; 1–2 camera **orbits** around the prize; one **whip pan**; the camera always drifts.
- **Toy figures**: head ≈ 37 % of height, eyes = big white ovals with tiny pupils, mitten hands, ball shoes or
  slippers; one hard shade band (cool violet multiply), soft key gradient, `#2d2333`-ish outlines, grain.
- **One sentence = one shot = one literal gag** (sample: on hold → sign flips, dusted off → dust off the speech,
  holds still → a gnome gets paved flat, keep the potholes → a voter drops into one, re-elected → a rosette on the
  pothole).
- **The calendar** with the date(s) circled appears in the hook, at "So why…?", and flips past the date at the end.
- **Counters as price signs**: blue sign, yellow top strip, dark insets, yellow rounded digits; scramble → roll →
  exponential explosion on the punchline; a black LED read-out in a red frame for "your" running total.
- **The everyman** (loungewear, droopy eyes) appears at the turn and in every consequence, and ends the film.
- **Captions**: 2–5 words, Inter 800, yellow `#ece44c`, dark outline, centred at **70 % height**, hard switches.
- **Sound**: dry fast VO, **no music bed**, SFX on gags (whoosh, sparkle, thud/splash, tick, stamp), −14 LUFS.

## 2. Target metrics
Source = the engine analyzer's metrics for reel De6-7n8I4Q4. QA reads `out/qa/metrics.json`.

| metric | source | target | sample build (64.7 s) |
|---|---|---|---|
| cuts_per_min | 18.51 (4 of 20 are flash frames) | 17–21 | 20.4 (incl. 1 flash frame) |
| shot_len_median (s) · p10/p90 | 2.71 · 1.54/4.75 | 2.4–3.0 | 2.67 · 1.26/4.84 |
| scene_changes_per_min · median scene | 21.29 · 2.33 s | 19–23 · 2.0–2.6 | 20.4 · 2.16 |
| cuts in first 15 s | 6 | 5–6 | 5 |
| motion_mean / p90 | 13.15 / 33.0 | 11.5–14 / 28–36 | 11.9 / 31.6 |
| hold_frac | 0.013 | < 0.03 | 0.003 |
| colourfulness / saturation | 68.5 / 0.359 | 64–74 / 0.33–0.37 | 72.8 / 0.345 |
| brightness | 0.755 | 0.73–0.77 | 0.760 |
| WPM overall | 228.6 | 215–235 | 225.4 |
| LUFS / silence | −14.1 / 0.7 s | −14 / ≤ 1 s | −14.3 / 0 |
| duration | 64.8 s | 45–65 s | 64.7 s |

Deliberate deviations: `animated_frac` reads 1.0 (source 0.68 — its 3D gradients fool the flat detector); motion is
~5 % lower because SVG figures have fewer high-contrast details than the source's 3D renders — add orbits, whips and
full-body acting rather than shrinking holds. The kit applies a light global `saturate(1.06)` in index.html to reach
the source's saturation; remove it if a palette is already rich. No music, matching the source; an optional bed
(`playful-bounce`, `music_under_voice_db: -26`) is acceptable if a brand wants one.

## 3. Script formula
**Length 180–260 words for 45–65 s.** Kokoro `am_michael`, **speed 1.45** (≈ 258 WPM while speaking), `gap` 0–0.2 s
per line (tts.py adds ~0.2 s trim padding, so real pauses are 0.2–0.45 s like the source), `lead` 0.25, `tail` 1.3.

| % runtime | beat | job of the line (write it fresh) | sample line (fictional) |
|---|---|---|---|
| 0–8 | **Cold-open claim** + timing twist | name the actor and the act, then reveal the self-serving timing | "Port Fennick is getting every pothole fixed at once, and Mayor Bunbury picked the week himself: right before his election." |
| 8–23 | **The object, escalated** + one self-promotion gag | introduce the thing, exaggerate its habit or scale, then mock the actor's showmanship | "Meet the town's only steamroller." / "It sleeps under a tarp eleven months a year, then spends two frantic weeks paving anything that holds still." / "He's even dusted off his speech: same as last time, new date." |
| 23–26 | **"So why…?"** (the only question) | ask the turn in five words | "So why around his election?" |
| 26–45 | **Motive A** → (a real-world name for it) | cause → effect → payoff for the actor; one checkable term | "Fix a road in March, and nobody remembers by November. Fix it the week they vote, and he's a local hero." / "Economists even have a name for it: the political budget cycle." |
| 45–58 | **The deal + the pressure on voters** | the accomplice's price; the actor's leverage | "One meeting with Gus at Smoothly Paving, and every crew is booked for late October. His only question: overtime?" / "And his campaign slogan practically writes itself: re-elect me, or keep the potholes." |
| 58–82 | **The cost to you** + the switch-on before the vote | second person; three escalating hits; the counter jumps just before the vote | "Your bike finds one on Monday, your car finds two on Tuesday, and by Friday the big one has its own mailbox." / "…and weekly repairs leap from zero to four hundred, just in time for the ballot box." |
| 82–91 | **The promise** | the actor's reassurance, staged as sainthood | "Ask what comes next, and he swears the roads are in safe hands." |
| 91–100 | **Callback punchline** | pay off an earlier setup (the tarp) and land on the viewer's thing | "Then the tarp goes back on, and the crews go back on holiday." / "As for the pothole outside your door? Re-elected, for four more years." |

**Originality rule.** Reuse the beat map, never the source's sentences or pictures. The source's own sentence
frames and its opening composition (two figures flanking the object, thumbs up, on a star rug) are not templates.
Stage your own reveal (sample: a ribbon cutting) and build the callback on your own setup line.

**Facts rule.** Satire of a pattern, not of a person: fictional town, people, company, dates and counters; numbers
only inside the fiction (absurd on purpose). Any real-world term or figure must be checkable — list it in the
project's `FACTS.md` (sample: *political budget cycle* — Rogoff 1990 AER; Rogoff & Sibert 1988; Brender & Drazen
2005). Never put words in the mouth of a real person, never use real politicians' likenesses or party marks.

## 4. Visual system
**Palette** (`K.C`): cream `#fbf3db`/`#f4e7ca` · navy `#2b417e`/`#222543` · prize olive `#7b8646` · gold `#e8b85a` ·
hangar `#615765`/`#575375`/`#7d7081` + red lamps `#ff5a4f` · sky `#3d8be0`→`#9fd3f7` · wood `#c78b57`/`#a5683d`/`#8a5233`
· pink room `#dcbeb8` + violet top `#8a6c8a` · sign blue `#3360cc`, inset `#1d2550`, digits `#f6e43c`, strip `#f2c430` ·
alert red `#d8473c` · car yellow `#f7ce3f` · booths floor `#f0c689`, wall `#e6ecf3` · outline `#2b2235` (never black).
**Shading**: `K.paint(color, mode)` — `cyl` (limbs/torso: light → base → hard stop at 0.68 → violet shade), `sphere`
(heads: radial, hard stop at 0.8), `side` (props: wide band at 0.58), `vert` (planes), `flat`. Shade colour =
`K.shade(c)` (multiply toward `#7a72b4`). **Line**: 4.5 px non-scaling plum outline (`K.OUT`). **Texture**:
`X.grain(0.035, 12)`.
**Typography**: captions Inter 800 37 px (0.019 H), fill `#ece44c`, stroke `#1b1822` 7 px (`K.captions`); digits
Fredoka 700; labels Fredoka 700 38 px; calendar months / VOTE / NOV Montserrat 900; desk signs Montserrat 900
`skewX(-9)`; chalk Patrick Hand.
**Layout (1080×1920)**: caption band centred at y = 1344 (70 %); faces at 35–55 % height; signs/billboards/calendars
in the upper right; keep meaning out of the bottom 18 % (y > 1575) and the right 12 % rail (x > 950) — set dressing only.

## 5. Characters & objects
`P = K.toon(layer, spec)` — feet at (x, y), height ≈ 1000·s. Spec: `skin top topKind (suit|tweed|hoodie|vest|dress|
cardigan|tee) pants pantsKind (tartan|stripes) shoes shoeKind (slipper) hair (messy|mayor|tufts|bob|bun|afro|short|
quiff|curlers) hairC browC stache (walrus|short) beard glasses chain tie bow hat (hard) cuffs body (round|slim) party`.
API: `P.pose(t, name)` (rest hips thumbs thumbR waveR swearR pointUp pointL pointR presentR cheer wide shrug plead chin
headHands lounge surrender tiny holdR holdBoth salute fists pointFwd) · `P.face(t, name)` (neutral happy smile smug
shocked yell angry tired sad think blissful worried) · `P.look(t, dx, dy)` · `P.turn(t, ±1)` · `P.walk(t0, t1, {x,y})`
· `P.hop(t)` · `P.set(t, {sink, lean, hr, squash})` · `P.prop(t, 'hard'|'halo', on)` · `P.slotL/slotR` (hand-local group
for held props; +y points along the forearm, wrap in `rotate(180)` for an upward hand). Arms render in front of the
head (chin, cheeks). Pass `vis: ctx.vis` so idle hooks run only while the shot is visible.
Cast rules: actors in suits/uniforms with one silhouette gag each (walrus moustache, hard hat); the **everyman** in
loungewear (hoodie + tartan/striped pyjama trousers + slippers), droopy eyes, stubble.
**Props**: `K.steamroller` (+`.spin`) · `K.tarp` · `K.calendar(L,x,y,w,{circle:[month,day,label],cones})` (`.ring` for
`X.drawOn`, `.hl`, `.cells`) · `K.tearCal(...).flip(t)` · `K.priceSign(L,x,y,{rows:[[label,val]],w,rh})` (`.rows` = text
els) · `K.led(L,x,y,w,h,val,{label})` (auto-fits) · `K.pothole` · `K.car` · `K.bike` (`.front`) · `K.mailbox` (`.flag`) ·
`K.duck` · `K.podium` · `K.desk` · `K.deskSign(L,x,y,'A','B').flip(t)` · `K.easel` (`.arrow`, `.head`) · `K.chalkboard`
· `K.billboard` (`.screen` clip group) · `K.umbrella` · `K.booth` (`.curtain`, `.feet`) · `K.beacon` · `K.crest` ·
`K.cone` · `K.cloud` · `K.tree` · `K.house` · `K.ballot` · `K.window(…,{curtains})` · ceremony: `K.ribbon(L,x0,x1,y,{h})`
(`.snip(t)`) · `K.scissors(P.slotR)` (`.snip(t)`) · `K.rosette(L,x,y,s,label,{above})`. Puppet extras: `shades: true`
(sunglasses), pose `showR` (holds a sheet up beside the face; put it in `rotate(150)` inside `slotR`).
**Sets** (draw into a layer): `K.officeBG` · `K.floorRug` · `K.hangar({cx,cy})` · `K.outdoor({horizon})` ·
`K.shopfront` · `K.road` · `K.stage` · helpers `K.sky` `K.rectV` `K.floor({vpx,vpy,n,rows})`.

## 6. Motion grammar
| event | build | duration (30 fps) | ease |
|---|---|---|---|
| pose change on the stressed word | `P.pose(t-0.1, name)` | 8 f | back.out(1.5) |
| face swap | `P.face(t, name)` | 4 f | power2.out |
| gleam | `K.flash(t, 0.8)` + `K.sparkles(layer, pts, t+0.06)` | 1 f flash + 5 f fade; twinkles 0.9 s | back.out(3) / power2.in |
| drop-in / costume pop | `P.prop(t,'hard',true)` + `K.burst` + sparkles | 2 f + 9 f settle | back.out(3) |
| sign flip | `K.deskSign(...).flip(t)` | 2 f squash + 3 f open | power2.in / back.out(2) |
| arrow shoots up | `X.drawOn(easel.arrow, t, 0.55, 'power2.in')` then head | 16 f | power2.in |
| counter scramble | `K.counter(el,v).slot(t0, t0+0.4, '212')` (+ ticks) | 12 f | per-frame random |
| mechanical roll | `.roll(t0, t1, from, to)` | 5–20 f | quad |
| meter explosion | `.exp(t0, END, from, to)` + accelerating ticks + riser | to the last frame | p² in log space |
| hit / splash | `K.splash(layer, x, y, t)` + `K.shake` + `P.set(t,{sink})` | 0.5 s | parabola |
| walk | `P.walk(t0, t1, {x, y})` | any | sine.inOut |
| idle | automatic: breathe, sway, blink every 3.3 s | — | sine |
Stagger 2–4 f between crowd reactions; nothing holds > 1 s without drift (shot drift 1.2–3 %/s scale, 15–35 px/s).

## 7. Transitions
| name | build | frames | when |
|---|---|---|---|
| **hard cut** | separate `K.shot(name, t0, t1)`; `t0 = X.line(id).start − 0.07` | 0 | every sentence (the base edit) |
| **flash frame** | `K.flash(t)` at a cut or a reveal | 1 + 5 | prize gleam, halo, tarp-off |
| **orbit** | `K.orbit(ctx, t, dx≈900, 1.0, {r:-2})` with layers p 0.6 / 1 / 1.5 and a fg occluder | 30 f | the hook; the promise |
| **whip pan** | `K.whip(ctx, t, {x,y,s}, 0.3)` (directional blur) | 9 f | to a second victim in the same set |
| **cut-in punch** | `K.punch(ctx, t, 1.12, 0.35, true)` | 4 f | on "tiny", on the deal |
| **crane / follow** | `K.move(ctx, t, {...}, dur, 'power2.inOut')` | 0.6–2 s | falling / rolling objects, tilt down to a pothole |
| **screen switch** | billboard `.screen` content toggled + `K.burst` | 1 f | the threat |
| **settle push** | `K.move` from s 1.14 → 1 at a shot start | 1.2 s | the first shot |

## 8. Sound
`sound.json`: `{"preset": "none", "sfx_db": -4, "lufs": -14}` — the source has **no music** (gaps fall to −40 dB).
SFX map: gleam → `sparkle`/`chime` · orbit/whip → `woosh_low`/`whoosh` · prop pop → `pop` · sign flip → `click`+`stamp`
· pothole hit → `thud`+`boing` (splash) · scramble/roll → `tick` (every 0.06–0.07 s) + `blip_up` · arrow → `riser` ·
win → `success` · calendar page → `paper` · ballot sinking → `bubble` · horn → `beep` · ending meter → accelerating
`tick` + low `riser` (fills the tail so silence stays < 1 s). VO: deadpan, no smiles in the voice, the joke lands by
timing — keep pauses ≤ 0.45 s.

## 9. Build recipe
1. Copy `assets/template/` (index.html with `data-size="1080x1920"`, kit.js, scene.js, script.json, sound.json).
2. Write the beat map (§3) and `script.json` (one line per sentence, ids per beat); run
   `ENGINE/make.sh <proj> --draft --workers 3` once to get `data/vo.json`; check WPM 215–235.
3. In `scene.js`: one `K.shot` per sentence (cut = line start − 0.07); 8–10 sets from `K.officeBG / K.hangar /
   K.outdoor+K.shopfront+K.road / K.stage / pink room / wood room / queue / booths`; cast with `K.toon`; put every pose,
   prop event and counter change on `X.word(id, 'word')`.
4. Hook: stage your own reveal of the actor with the object (sample: a ribbon cutting — `K.ribbon` + `K.scissors`
   snip, `K.flash`, `K.sparkles`), then `K.orbit` to the calendar and `X.drawOn(cal.ring)` on the date word.
5. Middle: literal gags per clause; the everyman at the calendar on "So why…?"; counters on price signs.
6. End: `tearCal.flip` past the date, pay off the setup object (the tarp drops back on), `counter.exp` to an absurd
   total, one last gag on the viewer's thing (`K.rosette` on the pothole).
7. `K.captions(X.vo, {size: 37})`, `X.grain(0.035)`, `X.end(vo.duration + 0.45)`.
8. `--stills` at every shot midpoint → full render → compare `out/qa/metrics.json` with §2; iterate.
**16:9 version**: `data-size="1920x1080"`, viewBox 1920×1080, keep the same sets but frame wider (characters at 55–70 %
of height, signs on the right third), captions at 0.80 H; cut rate unchanged.

## 10. QA checklist
- Stills: hook (actor and prize both readable, your own staging — not the source's two-figure pose), "So why…?" (hand at chin, circled date), every
  counter frame (digits fit their insets; `K.led` auto-fits), the last frame (meter number fully on screen).
- Gates: cuts/min 17–21, median shot 2.4–3.0 s, motion_mean ≥ 11.5, hold_frac < 0.03, colourfulness 64–74,
  brightness 0.73–0.77, WPM 215–235, −14 LUFS, silence ≤ 1 s.
- Do: hard cuts on sentences; one literal gag per clause; keep the camera moving; violet shade, plum outlines; captions
  at 70 % with 2–5 words; fictional people; absurd counters only inside the fiction.
- Don't: real politicians, real party logos, real quotes; the source's sentence frames or opening composition; music beds that bury the VO; fades or wipes between shots;
  black outlines or grey shadows; captions in the bottom 18 %; a held frame > 1 s; explanations longer than one line.
Files: references/analysis.md · references/sources.md · assets/kit.js · assets/template/

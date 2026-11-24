# PSA-reel — Hinglish "medical-plate" public-awareness reel (vertical, hard-cut cards, red punch headings)

Analysed 2026-10-27 from `insta/frames/De6U-P2qMvw/` (metrics, sheets) plus my own measurements on the 720×1280 30 fps
MP4: 2 fps contact sheets over the whole reel (`samples/psa-reel/scratch/src/sheet_00…06.jpg`), 30 fps strips around
every cut, pop, count-up, slide-in, flash and the ending (`hs1…hs4.jpg`), 22 full-res stills (`full_*.jpg`, rows
`rowA…rowF.jpg`), a per-frame difference scan (cut times, still fraction per second), pixel sampling on full-res
stills, and an audio pass (EBU R128, RMS percentiles, band energies, spectrograms `spec_0_20.png`, `spec_70_90.png`,
F0 estimate). Values marked *inferred* could not be measured directly.

---

## 1. Identity

A 109 s Instagram awareness reel that explains a life-saving skill (hands-only CPR) as **a stack of medical-textbook
plates shown one at a time and hard-cut on the narration**. Every card is a flat ground — aged **cream paper** with a
heavy vignette, a **dark "specimen" board** with a faint grid, a **dark brown board with a warm spotlight**, or a
**mint-green action card with a dark-red floor band** — topped by a thin rule with tiny mono labels ("STEP 1 ·
FIG. 11") like a figure plate. Under the rule sits the reel's caption system: a **two-line romanised-Hinglish heading
top-left** — a small black condensed-caps setup line and, on the stressed word, a huge **red condensed
punch line** that blurs in. The middle of the card carries **one idea in one picture**: realistic photo
cut-outs of Indian people on the flat ground with soft shadows, **vintage anatomical engravings** (heart, nervous system,
ribcage) glowing on dark boards, and a small infographic kit (flip-clock counters, a pie chart, isotype people with one
red, red numbered circles, speech bubble, checklist with crossed items, kraft tape labels, rubber stamps, a phone dialling
112, an ambulance, glowing beat words). A calm, warm male Hindi/Hinglish voice talks almost without pause at 146 WPM over
a low tension bed; heart-monitor beeps and a flat-line tone open it. It ends on an **"anyone can do it" family**, a
**"send it to the family group"** phone, and a **comment poll** (a yes/no question with two checkboxes) with a red
FOLLOW + SHARE pill, then fades to black.

## 2. Source analysed

| id | account | dur (s) | cuts/min | scene changes/min | median shot / scene (s) | motion mean / p90 | hold_frac | colourfulness | brightness | WPM | LUFS |
|---|---|---|---|---|---|---|---|---|---|---|---|
| De6U-P2qMvw | sciencetein + kashur_scientist_urdu (collab), "Original audio", ~53.4k likes | 109.0 | 6.05 | 8.81 | 7.17 / 5.0 | 3.43 / 3.90 | 0.398 | 31.3 | 0.57 | 146.4 | −14.1 |

720×1280, 30 fps, AAC HE 44.1 kHz stereo. Saturation 0.217, flat_mean 0.613, dark-frame fraction **0.339** (a third of
the reel is on dark boards), `animated_frac` 1.0, first cut 11.67 s (the analyser), 1 cut in the first 15 s. k-means
palette: `#cec1a3` 31 % · `#a99f85` 19 % · `#272421` 14 % · `#cdd6c0` 12 % · `#1b1a18` 10 % · `#3e332d` 7 % ·
`#6a534a` 5 % · `#bc3f37` 2.6 % (the red). The post caption restates the hook, the per-minute statistic, the three
steps, a share ask, a yes/no comment poll and an awareness disclaimer. Motion by decile: 2.0 · 3.9 · 3.1 · 4.6 ·
2.2 · 1.6 · 3.5 · 5.3 · 4.1 · 4.1.

## 3. Measured pacing

| quantity | value | what it means |
|---|---|---|
| real card changes (my frame-diff scan) | **20 hard cuts → 21 cards**, mean card 5.2 s, median 5.2 s, min 2.1 s, max 7.5 s | the analyser's 11 cuts miss cream→cream cuts (similar histograms); every card change is a hard cut |
| card durations (s) | 6.40 · 5.27 · 2.63 · 5.40 · 7.50 · 7.33 · 3.24 · 4.03 · 4.83 · 2.07 · 5.13 · 2.97 · 6.47 · 7.03 · 6.10 · 4.33 · 5.80 · 7.00 · 4.07 · 5.23 · 6.19 | one VO sentence (sometimes two) per card; short cards (2–3 s) are bridges (the three-steps card, the 112 call card) |
| scene changes | 8.8 / min, median scene 5.0 s | colour-histogram changes; ground alternation (cream / dark / mint) makes most cuts register |
| motion | mean 3.4, p90 3.9 | low: cards hold still; motion comes from pops, count-ups and the cut itself |
| hold_frac | **0.40** | 40 % of frames are frozen. Per-second still fraction ranges 0.0–1.0: 21 of 109 s are 100 % still (e.g. 30–31 s pie, 42–43 s, 71–72 s, 84 s) |
| event density | ~3.4 visual events per card (heading 1, punch line, 1–3 pops / stamps / labels) | something changes every 1–1.5 s while the VO runs |
| WPM | 146 overall; VO nearly continuous (quietest 0.1 s windows are only breaths) | dense, conversational |

**Cut times (s):** 6.40 · 11.67 · 14.30 · 19.70 · 27.20 · 34.53 · 37.77 · 41.80 · 46.63 · 48.70 · 53.83 · 56.80 · 63.27 ·
70.30 · 76.40 · 80.73 · 86.53 · 93.53 · 97.60 · 102.83 · fade to black 108.4–109.0.

**Shot list (card · ground · label | heading | what happens):**

| # | t (s) | ground | top label | heading (beat; red line time) | action (frame-accurate where measured) |
|---|---|---|---|---|---|
| 1 | 0.00 | cream | EMERGENCY · FIG. 1 | hook: collapse at a wedding or the gym (red line 3.57) | a groom cut-out in a cream sherwani hangs mid-fall, drifting; wedding string-lights twinkle across the top; a red glowing ECG line crosses the card with monitor beeps; dumbbell + towel pop in at 2.0 (the gym alternative); 3.70–4.03 the falling pose slides down + rotates and swaps to a lying pose (10 f); a red "breathing stopped" stamp slams at 4.37 (3 f); flat-line tone 4.4–6.3; a handwritten red second-person question writes on at 5.5 |
| 2 | 6.40 | cream | GALAT · FIG. 2 | what most people do wrong (red line 7.63) | lota pouring water pops 7.50 (4 f); red X 9.0; group filming on phones pops 9.47 (4 f); second red X 11.4 |
| 3 | 11.67 | brown spotlight (centre) | TIME · FIG. 3 | the few minutes that decide it (red line 12.5) | flip clock 05:00 pops (4 f) and counts down 05→04→03→02→00 in 0.5 s steps; a handwritten red half-line fades in 13.0 |
| 4 | 14.30 | dark grid | CARDIAC ARREST · FIG. 4 | name the condition: sudden cardiac arrest (red line 15.5) | white-line engraving of a heart with a red inner glow that pulses, ECG beating along the bottom; 18.5 the glow drains (heart greys out) + flat-line tone 18.6–20 |
| 5 | 19.70 | dark grid | EVERY MINUTE · FIG. 5 | per-minute survival loss (22.0 / red line 25.5) | engraving of brain + spinal cord + nerves of one arm; brain glows red 20.0; flip counter "0 MIN / 100%" pops 22.4 and ticks to "5 MIN / 050%" by 26.5 (~12 values/s); the figure dims |
| 6 | 27.20 | cream | INDIA DATA · FIG. 6 | most cases happen outside hospital (red line 30.5) | cream disc pops 28.6 (6 f); red sector sweeps clockwise from 12 o'clock 28.8–30.0; "70%" label; kraft tape strip at the bottom collects three place words (32.0 · 33.0 · 33.5), each on its spoken word |
| 7 | 34.53 | brown spotlight (low) | NO DOCTOR · FIG. 7 | no doctor present, only the bystander (red line 36.5) | the man lies in a pool of light; a red person pictogram grows from its base beside him 36.47–36.67 |
| 8 | 37.77 | cream | INDIA: 1.3% TO 9.8% · FIG. 8 | how few bystanders give CPR (red line 39.5) | 2 × 5 isotype people pop one per frame (38.87–39.33); the first turns red 39.60; red stamp 41.0 |
| 9 | 41.80 | mint + floor | GOOD NEWS · FIG. 9 | good news: immediate CPR multiplies survival (red line 44.5) | flip tile 1X → 2X → 3X; green up-triangle pops 45.5 |
| 10 | 46.63 | cream | — · FIG. 10 | bridge: just three steps (red line 47.5) | red 1, black 2, red 3 circles pop in a row |
| 11 | 48.70 | cream | STEP 1 · FIG. 11 | step 1: tap and shout (red line 51.0) | lying man; red ① pops; speech bubble (the rescuer's call-out) 51.0; CHECK card with two boxes (response, breathing) 51.5, each crossed (52.0, 53.0) |
| 12 | 53.83 | mint + floor | STEP 1 · FIG. 11 | step 1b: call 112 (red line 54.2) | phone pops with overshoot (53.90–54.17, rotated −4°), digits type 1 · 11 · 112, green call button pulses |
| 13 | 56.80 | cream | STEP 2 · FIG. 12 | step 2: hand position (red line 59.4) | ribcage engraving (ink on cream), dashed red ellipse on the lower sternum, black ②; hands slide in from the right 59.17–59.43 (8 f); a handwritten red reminder (straight elbows) 62.0 |
| 14 | 63.27 | cream | STEP 3 · FIG. 13 | step 3: push hard and fast (red line 65.0) | rescuer-on-patient cut-out with a gentle compression bob; red ③; "5 CM" + double arrow 66.0; tape "100-120 PER MIN" 68.5 |
| 15 | 70.30 | brown spotlight | RHYTHM · FIG. 14 | rhythm: two per second (red line 72.5) | two huge glowing count words (cream / red) hard-switch on the beat 73.1 → 76.3 |
| 16 | 76.40 | cream | DON'T STOP · FIG. 15 | don't stop until help arrives (red line 77.0) | rescuer cut-out; ambulance slides in from the right 77.83–78.17 (10 f) + two-tone siren |
| 17 | 80.73 | mint + floor | HANDS-ONLY · FIG. 16 | myth 1: mouth-to-mouth (red line 81.0) | tape with the myth as a question 82.5; red two-word answer 84.0; interlocked hands pop 85.0; green stamp **HANDS-ONLY CPR** 85.5 |
| 18 | 86.53 | dark grid | RIBS · FIG. 17 | myth 2: a cracked rib (red line 90.0) | x-ray ribcage; 1-frame red flash + red crack zig-zag 88.70; green tape with a ✓ (ribs heal) 91.0; red stamp with a ✗ (a life does not) 92.5 |
| 19 | 93.53 | cream | ANYONE · FIG. 18 | empowerment: anyone can do it (red line 94.5) | family of four cut-out; family-role labels pop over heads 96–97 |
| 20 | 97.60 | mint + floor | SHARE · FIG. 19 | share ask: the family group (red line 99.0) | phone pops from small (6 f); green "Family" chat header; CPR card message + bubbles stagger in |
| 21 | 102.83 | brown | TELL US · FIG. 20 | comment poll (red line 103.3) | poll card pops (4 f, −2°); FOLLOW + SHARE pill 104.0; ✓ in the yes box 106.0, red "?" in the no box 106.5; fade to black 108.4–109.0 |

## 4. Script & narrative structure (transcript beat map)

Beat map from the Whisper transcript (Devanagari, Hindi with English medical terms); the VO itself is not reproduced:

| % runtime | t (s) | beat | card(s) |
|---|---|---|---|
| 0–6 % | 0–6.4 | **Hook: relatable collapse + question** | 1 |
| 6–11 % | 6.4–11.7 | **What most people do wrong** | 2 (GALAT) |
| 11–25 % | 11.7–27.2 | **Stakes: name it, show it in the body, per-minute decay** | 3–5 |
| 25–38 % | 27.2–41.8 | **The statistic + "it's you"** | 6–8 |
| 38–43 % | 41.8–46.6 | **Good news multiplier** | 9 |
| 43–80 % | 46.6–86.5 | **"Just 3 things"** — numbered steps, each split into 1–3 cards (do · detail · rhythm · don't stop) | 10–16 |
| 74–86 % | 80.7–93.5 | **Myth-busters** (fear removal) | 17–18 |
| 86–90 % | 93.5–97.6 | **Empowerment** | 19 |
| 90–94 % | 97.6–102.8 | **Share ask** | 20 |
| 94–100 % | 102.8–109 | **Comment poll** | 21 |

- **Hook pattern.** Place + sudden event in one breath, then a direct second-person question written by hand on
  the card. Monitor beeps → flat-line = the emergency in sound.
- **Wrong-way card** before any explanation (GALAT label, red X over each wrong action).
- **Stakes in the body**: one engraving per organ, a counter that runs while the narrator says "har minute".
- **Numbers on screen only as big, round, checkable figures** (70 %, 10 in 100, 2–3×, 5 cm, 100–120/min, 112), and the
  mono label sometimes carries the source range ("INDIA: 1.3% TO 9.8%").
- **Steps as numbered red/black circles**; each step card = number + one action picture + one checkable detail.
- **Ending**: empowerment → share → poll (two-option checkbox) → follow pill; the caption carries an awareness
  disclaimer that recommends proper CPR training.

## 5. Visual system

**Palette (sampled on full-res stills).**

| role | hex | use |
|---|---|---|
| cream ground, centre / edge / corner | `#c7bea6` · `#b5a78a` · `#928770` (top `#c0b498`) | problem / narrative cards; strong elliptical vignette |
| mint ground, centre / edge | `#c7dbc0` · `#a6b8a0` | action / good-news cards |
| mint floor band | `#803a32` (top edge `#883e37`) | bottom 12 % of every mint card (y ≥ 0.88 H) |
| brown board, edge / spotlight centre | `#28231f` · `#7d7260` | emotional / time cards; warm pool of light at centre or lower centre |
| specimen board | `#1c1c1c`–`#222222`, grid lines ≈ `#2b2b2b` | anatomy cards (engravings in white line) |
| ink (heading line 1, isotype, tape text) | `#22170d` (warm black) | |
| light ink on dark boards | `#cfccc4` | heading line 1 on dark grounds |
| punch red | **`#b43239`–`#bb3239`** | heading line 2, pie, pictogram, circles, pill, X marks |
| stamp red / ECG red | `#ba343c` / `#ce4f51` + glow | stamps, glowing traces |
| handwriting red | `#a83739` | script notes |
| mono label / rule | `#60543e` / `#7f7154` | top label row |
| paper card (checklist, poll, bubble) | `#e9e1cb` / `#efe7dc` | |
| flip tile face / frame / bezel | `#f0e8d9` / `#28211a` / brass `#a8916a` | |
| stamp green / call green / chat green | `#3d743a` / `#45b05c` / `#3e7a56` | the "right" answers only |
| glow word | cream `#f5e5d6` and red, both with a red halo | rhythm beats |

Red is 2.6 % of all pixels: it is reserved for the punch line, the one highlighted object, X marks, stamps.

**Typography (closest engine fonts, sizes as a fraction of frame height H).**

| role | look | engine font | size |
|---|---|---|---|
| heading line 1 (setup) | heavy condensed grotesque caps (Anton-like), ink | **Oswald 700** (+1–2 px same-colour stroke to fatten) | cap height 3.0 % H → font-size 3.7 % H (≈ 70 px at 1920) |
| heading line 2 (punch) | same, red | Oswald 700 | cap height 7.2 % H → font-size 8.9 % H (≈ 170 px); shrinks to fit ≤ ~68 % of width |
| top label + FIG. n | tiny tracked mono caps | **Roboto Mono 500**, letter-spacing ≈ 0.25 em | cap 0.7 % H → ≈ 18 px |
| tape / checklist / poll / bubble text | condensed caps, ink | Oswald 600–700 | cap 1.8–3 % H |
| handwritten note | red brush-script lower case, rotated −8…−12° | **Caveat 700** | x-height ≈ 2 % H |
| flip-clock digits | condensed bold in tiles | Oswald 700 | glyph ≈ 5–6 % H |
| glow beat words | ultra-heavy condensed | Oswald 700 + stroke + glow | cap ≈ 15 % H |

**Layout grid & safe zones (720×1280 measured → fractions).** Left text margin 4.4 % W, right label margin 4.2 % W.
Top label baseline 6.7 % H, rule 7.9 % H (full width between margins, 1 px at 720). Heading line 1 cap-top 9.2 % H,
baseline 12.3 % H; line 2 cap-top 13.3 % H, baseline 20.5 % H. Content zone 25–90 % H, horizontally centred; big
cut-outs span 80–90 % W. Binder dots: x = 2.9 % W, every 11.8 % H from 4.7 % H, Ø ≈ 0.7 % W, grey. Two faint vertical
paper folds at ≈ 23 % and 63 % W and a faint horizontal ruling on cream/mint. Dark specimen boards carry a column of
sprocket dashes on the right edge (x ≈ 96 % W) and a vertical mono "… SPECIMEN SCAN" line beside it. The reel ignores
the Instagram caption area for big figures (the family's feet sit at 93 % H, the floor band covers 88–100 %) but keeps
**all text inside 6–83 % H** (the FOLLOW + SHARE pill is the lowest text, centre 80 % H); nothing important sits in the
right 12 % below 60 % H.

**Texture & light.** Grounds are flat with a heavy radial vignette (corner ≈ −30 % luminance), faint fibres, faint
guides; no paper grain on the cut-outs. Every cut-out has a soft contact/drop shadow (offset ≈ 1 % W down-right, blur
≈ 1.5 % W, 30–35 %). Engravings on dark boards are white-line plates with a red inner glow.

## 6. Caption system

There are **no burned-in subtitles**. The two-line heading is the caption: it paraphrases the sentence in 2–5 romanised
words. Line 1 appears with (or 2–3 f after) the cut; line 2 lands on the stressed word 0.8–2.5 s into the card.
Secondary text = labels on objects (tape, stamp, checklist, handwritten note, pictogram labels), each timed to the word
it names.

## 7. Characters & objects

- **People = realistic photo cut-outs of ordinary Indian people** (groom in sherwani, guests in saris filming, a man in a
  white kurta lying down, a woman in a blue kurta doing compressions on a man in jeans, a family of four). No outline, a
  soft shadow, placed flat on the ground, mostly static (one pose swap, one compression bob). For original work without
  photos: stylised cut-out illustrations with a paper edge and a drop shadow, same casting and clothes.
- **Anatomy = vintage engraving plates**: hatching, contour lines, labels-free; white line on the dark grid (heart,
  brain + nerves, x-ray ribcage) or ink on cream (ribcage + hands).
- **Infographic kit**: flip tiles (cream face, dark frame, brass bezel, centre split), cream pie disc with a lighter rim,
  isotype people (round head + rounded body, ink, one red), numbered circles (red/black, cream numeral, Ø ≈ 17 % W),
  speech bubble (cream rounded rect), checklist card ("CHECK" mono label, square boxes, red ✗ + strike-through), torn
  kraft tape labels, rubber stamps (double rule, rotated ±5°, red for wrong / green for right), phone (thick dark
  bezel, cream screen, green call button with pulse ring, rotated ±4°), ambulance cut-out, red person pictogram, green
  up-triangle, double arrow with a measurement ("5 CM"), poll card with two checkboxes, red FOLLOW + SHARE pill.

## 8. Motion grammar (30 fps)

| move | frames | ease | notes |
|---|---|---|---|
| card change | 0 (hard cut) | — | never a wipe, whip or zoom; camera never moves |
| heading line 1 in | 2–3 f fade, 0–4 f after the cut | linear/power1 | |
| heading line 2 in | **4–6 f opacity + blur** (ghost ≈ 30 % at f 1–2) | power2.out | on the stressed word |
| cut-out / object pop | 4–6 f, scale 0.15 → ~1.06 → 1 | back.out(2) | origin centre; pictograms grow from their base |
| isotype build | 1 figure per 1–2 f | instant per figure | then one recolours red in 1 f |
| pie sweep | disc pop 6 f, sector sweep ≈ 36 f | power1.inOut | clockwise from 12 o'clock |
| flip counter | tiles pop 4 f; values hard-swap every 2–4 f (count-up) or every 15 f (countdown) | stepped | flap shading on change |
| stamp slam | 2–3 f, scale 1.3 → 1, opacity 0.4 → 1 | expo.out | + thud |
| red X | 2–3 f per stroke | power2.out | |
| slide-in (hands, ambulance) | 8–10 f from off-card | power3.out | no overshoot |
| pose swap (fall) | 10 f slide + rotate + crossfade | power2.in | |
| red flash | 1 f ≈ 45 % red, decays over 6 f | power2.out | marks the "crack" |
| handwritten note | write-on ≈ 15–20 f | linear | |
| glow beat word | hard switch every 18 f (0.6 s) | — | |
| idle | none on 21 of 109 s; one loop on some cards (twinkle, ECG glow, heart pulse, compression bob ~2 Hz, call ring ~1 Hz) | sine | |
| end | fade to black ≈ 18 f | linear | |

## 9. Transition catalogue

1. **Hard cut card → card** (20×). Ground colour alternates by meaning: cream = problem/narrative, dark grid = inside
   the body, brown spotlight = time / you / emotion, mint + red floor = action / good news / share.
2. **Blur-fade punch line** (21×) — the only "transition" inside a card.
3. **Pose swap** (1×) — the falling cut-out drops into the lying pose.
4. **Red flash** (1×) — 1-frame tint marking an injury.
5. **Fade to black** (1×) — the last 0.6 s.

## 10. Sound

- **VO**: one warm male voice (median F0 ≈ 140 Hz), conversational Hindi with English medical terms, nearly no pauses
  (146 WPM overall), delivery calm but urgent; numbers read in Hindi ("ek sau baarah").
- **Music**: a low sustained pad / drone with a soft low pulse (low-band autocorrelation hints at a ~0.45–0.5 s period,
  *inferred* ~120–130 bpm), 20–40 % of energy below 150 Hz, never drops out, sits far under the voice. Loudness
  −14.1 LUFS integrated, **LRA 2.0 LU** (flat, compressed), RMS p5…p95 −33…−12 dBFS.
- **SFX** (spectrogram): 1 kHz monitor beeps every ≈ 0.85 s for 0–4 s, a **flat-line tone** 4.4–6.3 s (on the
  breathing-stops line) and again 18.6–20 s (heart stops); a two-tone siren (≈ 690 / 860 Hz) 78.2–79.5 s with the ambulance; soft
  transients on several cuts and pops (*inferred* paper/whoosh/pop hits).

## 11. Formation rules (to make another reel like it)

1. **Vertical 9:16, 30 fps, 60–110 s, hard cuts only**; one card per VO sentence, cards 2–7.5 s (median ≈ 5 s).
2. Every card = **ground + top rule (mono label left, "FIG. n" right) + two-line heading top-left + one picture**.
   Increment FIG. on every card (a repeated step may reuse its number).
3. Heading: line 1 small ink setup (2–3 words), line 2 big red punch (1–3 words) on the stressed word, blur-fade in
   5 f. Romanised Hinglish, all caps, never full sentences.
4. Ground by meaning: cream (problem), dark grid (anatomy), brown spotlight (time / "you" / rhythm), mint + red floor
   (action, good news, share). About a third of the runtime on dark boards.
5. Beat map: hook (place + sudden event + "aap kya karoge?") → GALAT card with red X's → stakes in the body with a
   running counter → one big statistic + "it's you" → good-news multiplier → "bas ye N kaam" numbered steps (each step
   1–3 cards) → myth-busters (red stamp for the fear, green for the truth) → "koi bhi kar sakta hai" family →
   "family group mein bhejo" phone → comment poll HAAN / NA + FOLLOW + SHARE → fade.
6. People are ordinary, local, full-figure cut-outs with soft shadows; anatomy is a vintage engraving; numbers sit in
   flip tiles, pies, isotype rows or tape — always round and checkable, with the source in the mono label when useful.
7. Motion is economical: pops (4–6 f back.out), stamps (2–3 f), slides (8–10 f), stepped counters; no camera moves;
   40 % of frames frozen; at most one idle loop per card.
8. Red is rationed to the punch line + the one thing that matters on the card; green only for the right answer.
9. Sound: continuous VO ~146 WPM, low drone bed, monitor beep / flat-line / siren as diegetic cues, pops and thuds on
   visual events, loudness −14 LUFS with little range.
10. Keep text inside 6–83 % H and out of the right 12 % below mid-frame; big figures may run to the bottom edge.
11. Close with a disclaimer in the caption or a small line (awareness only; get proper training).

**16:9 variant (if asked):** keep the card grammar; put the heading block top-left at the same sizes relative to H,
the picture in the right two-thirds, the binder dots on the left edge; cards stay hard-cut.

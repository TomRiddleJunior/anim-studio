# Layer-stack — presenter + piece-by-piece "system" diagram reel (warm canvas, selection-box captions)

Analysed 2026-10-29 from Instagram reel `DfCi2s4zNno` (@virex.explains, 128.6 s, 30,467 likes, 346 comments, 24K
followers, "Original audio"). Analysed locally for reference only: the engine analyzer's metrics plus my own
measurements — 2 fps frames of the whole reel, full-resolution stills, 30 fps strips around every chapter cut, caption
change, crane drop, stamp, the halftone wipe and the crowd explosion, caption-band strips at 6.7 fps for 0–30 s, pixel
colour sampling, a diagram/presenter/caption motion split, a camera-drift test, the analyzer's own scene-change
function and an RMS/onset analysis of the audio. Values marked *inferred* could not be measured.

---

## 1. Identity

A fast, dry **"what it really takes" engineering explainer**. One warm off-white canvas never changes. A
**full-body narrator character stands at the far left, static, for ~80 % of the reel**; the right two-thirds hold a
**flat vector "system" illustration in thin ink outlines with flat fills and soft grey ground shadows** that is
rebuilt in every chapter: the story is a ladder of *failure → layer added → it works now* beats, and each added
layer slides onto a small **layer-stack widget** (numbered rows, base row black, the newest row terracotta). The
product is personified as a **mascot with a screen face** that reacts to everything. A **tiny mono chapter tag**
(`// 07 — rag`) sits top-left; **karaoke captions** at 79 % height show 1–7 words at a time, the newest word dark,
spoken words grey, and keywords boxed in a **light-blue design-tool selection with two round handles**. Red is used
for warnings: rubber stamps (COMPETITOR, MADE UP, PROMPT INJECTION, SKIPPED THE EVALS), red pills, a huge red number
on a salmon splat. One fast male voice, SFX on every build, no music. It ends on a callback — the first failure
returns because of one small Friday edit — with a stamp, and stops.

## 2. Source

| id | account | dur (s) | cuts/min | scene changes/min | scene len median (s) | motion mean / p90 | hold_frac | colourfulness | brightness | WPM | LUFS |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DfCi2s4zNno | @virex.explains — a company's own AI as the system built around a model: 8 layers, each added after something broke | 128.57 | 0.00 | 0.93 | 20.67 | 6.47 / 13.65 | 0.012 | 17.7 | 0.904 | 197.9 | −14.2 |

720×1280, 30 fps, HE-AAC 48 kHz. Palette (k-means): `#f8f5f2` 76.7 % · `#232529` 5.3 % · `#bab5b2` 4.6 % ·
`#766f74` 4.4 % · `#fcfcfc` 3.9 % · `#dadcde` 3.4 % · `#f2f2f4` 1.1 % · `#eeddc8` 0.6 %. Saturation 0.052.

## 3. Measured pacing

| quantity | value | what it means |
|---|---|---|
| chapters | **20** in 128.6 s (mean 6.4 s, 3.0–10.4 s); each opens with a **hard cut** to a new set | 01 your own AI 0.0 · 02 the first customer 7.6 · 03 system prompt 12.7 · 04 brand 17.2 · 05 facts 23.1 · 06 blind 30.7 · 07 rag 34.5 · 08 quotes 42.9 · 09 wants 47.7 · 10 mcp 50.7 · 11 payroll 57.1 · 12 rbac 62.4 · 13 inject 70.4 · 14 guard 80.8 · 15 monday 87.0 · 16 router 94.3 · 17 mystery 101.6 · 18 observe 108.1 · 19 months later 114.9 · 20 one friday 119.4 |
| hard cuts (analyzer) | 0 | white-canvas cuts change < 30 % of the histogram, so ffmpeg's scene score never fires |
| scene changes | **2** (93.8 s explosion → white, 114.5 s halftone wipe) → 0.93 / min, median 20.7 s | only full-frame events register; this metric is not the pacing |
| **build events** (diagram-region peaks, `events.py`, 10 fps, 0.3 s refractory) | **105.6 / min** (> 1.5 grey levels), 99.5 (> 3), **87.4 / min (> 5)**; median gap 0.5–0.7 s | the real pacing: **a new build every ~0.6 s**; a manual count gives 19 events in ch01 (7.6 s) and 12 in ch03 (4.5 s) ≈ 150 / min in dense chapters |
| motion mean / median | 6.47 / 4.19; 45 % of 1/6-s steps exceed 5 | the diagram is in near-constant motion: pops, slide-ins, re-layouts, typing, flickering screen faces, papers, cascades |
| motion split | captions 0.69 · presenter 0.0 (static) · diagram 5.35 | the presenter never moves; there is **no camera drift** (no global scale/shift between calm frames, residual = raw diff) |
| motion by chapter | 7.5 · 4.1 · 7.0 · 4.0 · 4.1 · 7.3 · 5.8 · 6.0 · 6.9 · 4.8 · 5.3 · 5.1 · 3.9 · 6.4 · **12.5** · 5.3 · 6.1 · 8.2 · **18.8** · 6.8 | spikes at the crowd explosion and the halftone wipe |
| hold_frac | 0.012 | a frame is almost never frozen: captions change every ~0.27 s while speaking |
| WPM | 197.9 overall, **234 while speaking** (55 gaps ≥ 0.25 s, 19.7 s total) | one very fast narrator |
| a calm 5 s (23.2–28.2 s, 30 fps) | 8 discrete builds (bubble pop, typing dots, sticker slap, face swap, re-stage, meter pop, sunglasses face, "$716" bubble) + 2 continuous (question typing 1.6 s, confidence % flickering every 0.1 s) | even "calm" chapters change something every ~0.6 s |
| entrance speed | customer slide 3 f (7.60–7.70), window pop 3 f (8.23–8.33), terminal slide 1–2 f (12.70–12.73), keyboard rise 4 f, stack card 2 f (13.10–13.17) | entrances are 2–5 frames, then a settle |
| chapter cuts (ffmpeg scene score) | max 0.296 (42.9), 0.23 (12.7), 0.16 (7.57); halftone 0.26; crowd→white 0.21 | all under the analyzer's 0.33 threshold → 0 cuts measured |
| codec flicker | on visually identical frames (44.6–45.0) the diagram region still differs by ~1.0 grey level (1,580 px > 20 levels at 360×640) | Instagram's 1 Mbps re-encode; raises the source's event/motion floor slightly |
| colour | colourfulness 17.7, brightness 0.904 | a pale page with small saturated accents |

## 4. Timed shot list (source)

- **0.0–7.6 // 01 — your own AI.** Zoomed-in isometric street (company tower with a logo sign + BANK, SHOP, CLINIC,
  STUDIO) fills the width; 5 speech bubbles pop 0.3–0.9 s ("our own AI!" in terracotta, "AI. Now.", "we need AI!"…);
  a thin red ring sweeps out (1.2–1.5); a crane rail slides in from the right (1.6) and a black **01 MODEL** box
  descends on cables over the city (1.9–2.4); the camera **zooms out** (2.4–2.5, ~4 f) revealing the **presenter at
  the left**; a "GPT" plate is lowered into the box slot (2.6–3.0); "Claude" types on its screen (3.8); an API sticker
  (4.6), a blue logo badge (5.3), the robot mascot pops onto the box (6.6) and a NOVA sign (6.9).
- **7.6 // 02 — the first customer.** Hard cut: pale skyline + road, robot + MODEL small top right; customer bust
  slides in from the left in 4 f (7.6–7.7); chat window pops out of a point in 4 f (8.23–8.33); the question types;
  two delivery vans drive in (10–11) with a "BEEP!"; the answer (it names the competitor) in a terracotta bubble;
  **COMPETITOR stamp** slams (12.2) with a salmon halo; the caption keyword box flashes dark for 1 frame.
- **12.7 // 03 — system prompt.** Hard cut: black terminal slides in from the left with a −6° tilt (2 f) and settles,
  keyboard rises from below (12.8–12.95, power out), typing ≈ 60 cps with a red block cursor; the **SYSTEM PROMPT**
  card slides from the right onto MODEL with a grey dust puff (13.1–13.5); the terminal folds onto a conveyor where
  envelopes ride and a message counter ticks 10 → 48 (14.5–17).
- **17.2 // 04 — brand.** Robot alone, large; a thought bubble asks who it works for, then answers with the brand name (17.7) +
  "!" badge; branded cap drops on; navy/blue bunting; chat bubbles in brand voice; a terracotta **"Yours."** script
  sticker slams over the scene (22.4).
- **23.1 // 05 — facts** · **30.7 // 06 — blind.** Driver with a box ↔ robot at a blue HELP DESK; question types;
  a confidence meter 99 % → 104 %; huge "$500" bubble; the refund-policy document with "$50 max" circled red;
  **MADE UP** stamp (31.5); filing cabinet slides in, robot blindfolded, counter "0 of 1,284", papers fly, "?"s.
- **34.5 // 07 — rag** (no presenter, wide). Mini stack top-left (RAG new/red), a conveyor with labelled stages
  **01 SPLIT · 02 EMBED · 03 STORE · 04 RETRIEVE**, a CUT blade station, an f(x) station, a vector-database cylinder
  with a dark screen of moving dots (count 8 → 12,480 vectors), dark vector chips cascading, a magnet on a crane rail
  picks the right chunk ("$50 max" pops on the robot, 41.3).
- **42.9 // 08 — quotes** · **47.7 // 09 — wants.** Answer with a citation + green check and salmon halo; at 45.1 the
  whole layout **re-stages** (window shrinks to a corner, people drop in with bounce, robot moves) — "just fix it!",
  "refund it!" bubbles, "NOT ENOUGH" stamp.
- **50.7 // 10 — mcp.** Three dark-titled cards (ORDERS · TICKETS · TEAM CHAT) on a rail, MCP pills pop, thick dark
  **marching-dash cables** connect them to the robot, a "DONE 0/3 → 3/3" counter turns green, TOOLS·MCP row rises
  into the stack with a salmon puff.
- **57.1 // 11 — payroll** · **62.4 // 12 — rbac.** New hire asks the manager's salary; robot reads the PAYROLL safe,
  "$184,000 / year" splat; role-rules card, OAuth badge, safe gets a **DENIED** stamp.
- **70.4 // 13 — inject** · **80.8 // 14 — guard.** Email with a hidden red line, magnifier sweeps, refunds count up
  $30,547 → $48,204, **PROMPT INJECTION** stamp (79.3) on a salmon burst; a CHECKPOINT gate with input filter,
  injection detection, PII mask.
- **87.0 // 15 — monday** (no presenter, zoomed). Calendar MONDAY 27, ringing alarm clock, counter 0 → 2,000
  "ALL AT ONCE", a dense crowd fills the bottom half (bobbing), "Where's my parcel?" bubbles; **"$3,940/day"** slams
  over a salmon splat with flying papers (93.4) → hard cut back to white with papers settling (94.3, presenter back).
- **94.3 // 16 — router** · **101.6 // 17 — mystery** · **108.1 // 18 — observe.** Cache grid + inbox funnel +
  router to SMALL/BIG model, token gauge drops $2,980 → $1,300; wrong answer, shrugging people, a dark **LINE-UP**
  board with #1 prompt · #2 document · #3 tool; security camera + TRACE / LOGS / EVALS panels.
- **114.9 // 19 — months later.** **Halftone wipe** (114.8–115.3: black dots grow to cover the frame in ~6 f, hold
  2 f, shrink away in ~7 f), calendar pages flip JUN → JUL → AUG → NOV, then the **full 8-row stack** with the robot
  on top in a salmon halo; green checks pop down the rows; callouts (calendar, "$ low" tag, "your docs", shield
  "secure"); `// live 149 days` mono top right.
- **119.4–128.6 // 20 — one friday.** Stack left, customer right; the first question returns, the competitor van
  honks again; SYSTEM PROMPT row turns red; terminal "v2 · Fri" with a struck-through rule; FRI 5:58 PM calendar +
  clock; **SKIPPED THE EVALS** stamp (126.9); hold ~1.5 s; the reel ends (no CTA, no logo).

## 5. Script & narrative structure

Whisper transcript (425 words) checked against the burned-in captions. Formula, per layer:
**"Then [someone] [does X], and [product] [fails, concretely]. → So you add [LAYER]: [2–4 parts in a list]. → Now
[product] [benefit]."** Eight layers, then a recap and a callback.

| % runtime | beat | line template |
|---|---|---|
| 0–6 % | **Hook**: everybody wants it → the naive build in 4 verbs → it gets a name | "Every [kind of organisation] wants its own [thing], so you [3–4 naive build steps] and give it a [name]." |
| 6–18 % | failure 1 → layer 1 → benefit | "Then [a user] [asks something ordinary], and [product] [fails in a concrete, absurd way], so you [add layer 1]." |
| 18–37 % | failure 2 (made-up answer) → explanation → layer 2 (a 4-stage pipeline) → benefit | "[Product] [invented the answer] because [the missing input it never had]. So you build [layer 2]: [stages]…" |
| 37–89 % | five more failure → layer pairs, each 9–15 s, one concrete absurd example each (salary, injected email, Monday rush, untraceable wrong answer) | "Then [a busy moment] [arrives], and [a cost or load] [blows up]." |
| 89–93 % | **Recap** as adjectives | "[Time] later, [product] is [adjective], [adjective], [adjective] and [adjective]." |
| 93–100 % | **Callback**: failure 1 returns because of one small human edit | "…because someone [made one small edit] [at a careless moment] and [skipped the check]." |

Line rules: second person ("you"), present tense, short clauses chained with "and"; concrete numbers in the
failures ($500 vs 50, 2,000 employees); every fix sentence starts with **"So you add/build/write"**, every failure
with **"Then"**, every benefit with **"Now"**. No question to camera, no CTA.

## 6. Visual system

**Palette (sampled from full-res pixels).**

| role | hex | use |
|---|---|---|
| canvas | `#faf8f4` | the whole frame, never changes |
| ink | `#1e1f24` (outlines), `#14151a` black boxes, `#0a1821` screens | 2 px outlines at 720 (3 px at 1080) |
| caption dark / grey | `#131a27` / `#929194` | newest + keyword words / spoken words |
| selection | fill `#d3dff5`, line `#3b78e7` (1.5 px), handles `#2e7af9` (r 6 px at 720) | keyword box |
| chapter tag | `#7d7b77` | mono text |
| terracotta (warning, newest layer, stamps) | `#c05d3b` (`#be5d3b`) | stamps, red bubbles, new stack row, red pills |
| salmon halo | `#ebc3b5` | emphasis circles / splats behind focal events |
| blue accent | `#2f5bd8` / navy `#22345c`, light `#d6e4fb` | logo, cap, desk, bunting |
| windows yellow | `#fde099` | lit building windows |
| greens | tree `#8db689`, success `#2da160` | check circles, trees |
| ground shadow | `#d9d6d0` / `#c4c2be` | flat ellipses under objects, hard offset card shadows |

**Typography (engine look-alikes).** Captions: geometric grotesque → **Inter** 650 (dark) / 450 (grey), cap height
2.5 % of H (66 px at 1920). Chapter tag: mono with slashed zero → **Roboto Mono** 400, 24 px, `// NN — words`.
Stack rows: heavy semi-condensed grotesque → **Inter** 800, tight tracking; index numbers Roboto Mono grey.
Labels on props: Roboto Mono caps; big counters: condensed bold (Oswald 900); stamps: condensed heavy caps in a
double rule; sticker: bold italic script ("Yours.") → Playfair Display italic.

**Shapes & line.** Isometric 3/4 buildings, front-oblique boxes (front + top + side), rounded cards (r 14–18 px at
1080) with a **hard grey offset shadow** (+6, +7 px), pills, speech bubbles with a short tail, ground ellipses.
Flat fills, one shade tone on side faces, no gradients, no texture, no grain.

**Layout grid (1080×1920 coordinates).** Presenter box x 14–213, y 590–1306 (head 30.7 %, feet 68.0 % of H,
height 37.3 %, width 18.5 %). Diagram region x ≈ 240–1080, y ≈ 380–1310 (it may run off the right edge: crane
rails, conveyors). Chapter tag at x 134 (12.4 % W), baseline y ≈ 147 (7.6 %). Captions centred, single-line
baseline y 1533 (79.8 %), two lines at 1497 / 1571. Nothing below 84 % except caption descenders; the bottom
16 % and right edge carry no information (Instagram UI). Wide chapters (rag, monday, the ending) drop the presenter
and use the full width.

## 7. Characters & objects

- **Presenter**: a detailed, semi-realistic full-body illustration, **completely static** (0.0 measured motion
  outside overlaps), holding a prop (laptop) at the hip, absent in 0–2.4 s, the wide RAG chapter, the Monday crowd
  and the final two chapters. *For original work design your own character with a different silhouette.*
- **Mascot** = the product: white body, **dark screen face** with cyan eyes/mouth, antenna, chest logo; gets a
  branded cap in the brand chapter; reacts with face swaps (smile, worried, blindfolded, shocked), hops, arm waves,
  nervous jitter.
- **Props**: crane rail + hook, black box with fan and screen, chat window (logo + name + green dot), dark terminal +
  keyboard, conveyor with numbered stage pills, stations (CUT, f(x)), database cylinder with a dark dot-screen, stack
  cards, counters ("0/3", "0 of 1,284"), document with a red circle, filing cabinet, safe, calendar + alarm clock,
  crowd, gauge, funnel, LINE-UP board, security camera, panels (TRACE/LOGS/EVALS), shields, price tags.
- **The layer stack**: rows 44 px tall at 720 (≈ 66 px at 1080), white with ink outline, index `0N` mono grey, label
  heavy caps, two dots at the right; base row black; the newest row terracotta; final state gets green check circles
  and a dark status bar `● NOVA · parcelco … ONLINE`.

## 8. Motion grammar (30 fps strips)

| move | frames | easing / detail |
|---|---|---|
| chapter change | **hard cut**, 1 f | the new set's first elements are already entering on the cut |
| slide-in (cards, terminal, customers) | 2–4 f travel from off-frame, 3–5 f settle | back.out, often with a −4…−8° tilt that straightens |
| pop (windows, bubbles, pills) | 3–5 f | scale 0 → 1.08 → 1 from the point of origin (a phone, a mouth) |
| drop / bounce (people, cards) | 4–6 f | fall from above, bounce settle |
| crane lower | ~15 f | power2.inOut on cables, dust puff on landing |
| keyboard rise | 4–5 f | power3.out from below |
| typing | 30–60 cps | red block cursor rides the line |
| stamp slam | 2 f | 125–130 % ghost → 100 %, small rebound, thud; salmon halo behind |
| salmon halo | 6–8 f in, holds 0.5–1.5 s | filled circle grows behind the focal element |
| re-stage | 6–9 f | everything on screen moves to a new layout (45.1 s) |
| counters | 0.5–1.5 s | digits change every frame (0 → 2,000; 8 → 12,480) |
| marching cables | continuous | thick dark dashes crawl toward the target |
| crowd | continuous | each head bobs on its own phase |
| camera | zoom-out reveal (ch01, 4 f), push-in (ch15), halftone wipe (ch19) | otherwise the frame is locked: no drift |

## 9. Caption system (measured, 6.7 fps + 30 fps)

- Chunks of **1–7 words (mean ≈ 4.2) on 1–2 centred lines**, ≤ ~16–18 characters per line; a comma ends a line, a
  period/question ends the chunk; line 2 completes the chunk.
- Each word **appears on its spoken time** with a 2–3 f blur-in (blurred → sharp); the newest word is **dark
  semibold**, every earlier word drops to **grey regular** at once; the line re-centres instantly; the block
  re-centres vertically when line 2 starts (single-line baseline 79.8 % H; two lines 78.0 % / 81.8 %).
- **Keywords** (≈ 1 per chunk, nouns and numbers) stay dark and get a **selection box**: a top-left handle appears
  first, the box sweeps open in 2 f, the bottom-right handle lands; box = text + ~0.2 em padding, top 0.95 em above
  the baseline, bottom 0.23 em below.
- Chunk exit: fade out in 3–4 f right before the next chunk's first word; blank frames appear only in pauses.
- Accent: the keyword box flashes dark navy for 1–2 f on a stamp slam or under the halftone wipe.

## 10. Sound

- **One male narrator**, American, fast and dry (197.9 WPM overall, 234 WPM while speaking), pauses 0.3–0.5 s at
  sentence ends.
- **No music bed**: VO gaps fall to −55…−65 dB RMS (digital silence) between SFX; speech median −18.7 dB.
- **SFX on build events**: gaps that are not silent sit at −19…−33 dB (whooshes, pops, thuds, clicks, typing); 22
  strong onsets fall inside VO gaps; centroid in gaps ≈ 3 kHz (bright UI sounds).
- Integrated loudness **−14.2 LUFS**.

## 11. Do / Don't

**Do**
1. Keep one canvas colour for the whole reel; change sets with hard cuts on sentence starts.
2. Keep the presenter static at the left; drop it only for wide or full-frame chapters.
3. Put a build on (or 2–4 f before) every stressed word — about one every 0.6 s — and keep something moving.
4. Grow the layer stack chapter by chapter; the newest row is terracotta, the base row black.
5. Use stamps for the punchline of each failure, salmon halos for emphasis, red only for warnings.
6. Caption with the karaoke + selection-box system exactly; chapter tag in mono, lowercase.
7. End on the callback stamp; no CTA, no logo card.

**Don't**
1. Don't drift or shake the camera between events — the frame is locked except for the named zooms.
2. Don't use gradients, textures, glows or grain; flat fills, ink outlines, hard grey shadows only.
3. Don't add music.
4. Don't caption more than two lines or let captions drop below ~84 % of the height.

## 12. Formation rules (to make another reel like it)

1. Pick a product that people think is "one thing" and list the 6–9 layers it really needs; give each a concrete,
   slightly absurd failure.
2. Write: hook (everyone wants it → naive build in four verbs → it gets a name) · failure/fix/benefit × N with
   "Then … So you add … Now …" · recap of adjectives · callback where the first failure returns through one tiny
   human mistake. ~420 words for ~2 minutes, read at ~200 WPM.
3. One chapter per beat (20 chapters in 2 minutes), each a hard cut to a new arrangement of the same prop world;
   tag it `// NN — two words`.
4. Every fix chapter adds a row to the layer stack; every failure chapter ends in a stamp; two chapters go full
   frame (a crowd explosion and the halftone "months later").
5. Measure pacing as build events per minute (≈ 90–105 / min), not as colour-histogram scene changes (≈ 1 / min on
   this canvas).

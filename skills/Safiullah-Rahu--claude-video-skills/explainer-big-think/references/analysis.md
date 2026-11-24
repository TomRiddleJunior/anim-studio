# Big Think — expert interview with animated b-roll and graphic packaging

Scope: the user asked for the **animation only**. Big Think's short explainers are documentary interviews: one expert,
no narrator. The "animation" is packaging laid over the interview: typographic paper cards, lower-thirds, kinetic text
over footage, archival photos in mock slide or film-strip frames, a few seconds of flat motion graphics, and a lot of
**licensed stock CGI and stock footage** used as b-roll. This file describes how that layer is built and cut into the
interview, so it can be rebuilt in code around original footage or procedural b-roll.

Evidence used: metrics.json, timeline/strips/opening/animated sheets, transcripts. I also made extra measurements:
- 2 s contact sheets of every video, and 8 fps bursts around each graphic build.
- k-means palettes of single frames.
- An interview-vs-b-roll classifier: 0.5 s thumbnails matched by correlation against 12–18 reference frames of the
  locked-off interview angles, threshold 0.80–0.82, checked visually on a 1 s strip.

---

## 1. Identity

An expert sits on a wooden chair in front of a **white seamless paper backdrop set up inside a large, warm real room**
(brick loft with factory windows, arched-window loft with plants, green-panelled library). The edit alternates a
**wide shot that shows the whole room and the backdrop** with a chest-up medium shot where the white paper fills the
frame. Every 4–10 s the voice continues over b-roll: cinematic stock clips, stock 3D CGI (glowing neurons, planets,
receptor proteins), archival photos inside rounded "old slide" frames or 35 mm film strips, and **typographic cards:
black high-contrast serif on an off-white, grey-speckled paper texture with a heavy grey vignette**, numbered with a
small black square. Key phrases pop onto footage in big white serif, often **tucked behind a foreground object**.
Names sit on "label-tape" boxes: white serif on black, then black italic on white. A small monochrome boxed-monogram
bug stays top-right all the time. The graphics are calm and bookish; the footage carries the motion.

## 2. Sources analysed

| id | title (upload) | dur s | cuts/min | median shot s | motion | colourful | WPM | LUFS | metric `animated_frac` |
|---|---|---|---|---|---|---|---|---|---|
| dTjgrG2UY30 | Why haven't we found aliens? A physicist shares the most popular theories (Brian Cox, 2023-09) | 766 | 17.6 | 2.09 | 7.29 | 23.5 | 145 | −16.8 | 0.572 |
| 4NJddyPpl44 | Don't hire the smartest job candidate (Tyler Cowen, 2023-02) | 412 | 17.6 | 2.77 | 10.05 | 23.4 | 141 | −14.4 | 0.447 |
| yS9FBB19Ws0 | How psychedelics work, explained in under 6 minutes (Matthew Johnson, 2022-10) | 336 | 25.7 | 2.04 | 13.74 | 28.7 | 148 | −22.8 | 0.530 |

Measured layer shares. Interview vs b-roll comes from the classifier; designed graphics were counted by hand on
2 s sheets.

| video | interview on screen | b-roll inserts / min | b-roll run median (p10–p90, max) | interview run median (p90) | designed graphics* | of which flat vector motion graphics |
|---|---|---|---|---|---|---|
| Cox | 55 % | 3.4 | 7.0 s (1.0–16.5, 27.5) | 6.0 s (19) | 16 % (14 % without lower-third/credits/end card) | ~0 % |
| Cowen | 36 % | 3.8 | 9.5 s (3.0–17.5, 21.5) | 5.0 s (13) | 23 % (18 %) | ~2 % (8 s) |
| Johnson | 41 % | 6.4 | 3.8 s (1.8–11.0, 18) | 3.5 s (7) | 28 % (23 %) | ~3 % (flow chart) |

\*Designed graphics = typographic cards, text over footage, framed archival, screenshot/document treatments, lower-
thirds, credits, end card. Stock CGI (3D medical / space renders) is extra: ~12 % in Johnson and ~8 % in Cox.

## 3. Measured pacing

- **The metric trap.** The white seamless backdrop of the medium shot scores 0.60–0.71 flatness, so `animated_frac`
  (0.45–0.57) mostly counts the interview as animation. Real designed graphics are **14–23 %** of runtime; real
  bespoke vector animation is **under 3 %**.
- Cuts 17.6–25.7/min, median shot 2.0–2.8 s, p10 0.6–0.9 s, p90 4.1–7.6 s. That is 2–3× Veritasium. Most cuts happen
  **inside b-roll runs** (2–4 stock clips per run, ~2 s each) or as wide ↔ medium angle changes inside interview runs.
- Rhythm: `interview 3.5–6 s → b-roll 4–10 s → interview …`. Overall 3.4–6.4 b-roll inserts per minute; the shorter
  the video, the faster (Johnson's 5:36 runs at 6.4/min).
- Interview time is split between **wide (set reveal) and medium**. The angle changes every 3–8 s. A digital punch-in
  of ×1.2–1.3 on the same take (Cox 6:28.4 → 6:28.6) hides jump cuts.
- Motion 7.3–13.7 mean: stock CGI fly-throughs and glitch transitions push Johnson to 13.7 (p90 35). `hold_frac`
  0.08–0.19. Deciles are fairly flat, with no big dip. Cowen's first decile is 15.0 because of a fast screenshot
  montage.
- Cold open before the series title card: Cox 77 s, Johnson 57 s, Cowen 53 s. B-roll starts within 3–5 s.
- Targets for a rebuild: **a cut every 2–3 s; b-roll insert every 9–18 s, lasting 4–10 s; a designed graphic about
  every 30–40 s; numbered section cards every 60–90 s** in list-style episodes.

## 4. Script and narrative structure

There is no narrator. Structure comes from the interviewee's answers, cut into a monologue, plus on-screen text.

| time | beat | what is on screen |
|---|---|---|
| 0–3 s | strongest framing line, spoken to camera | wide or medium; the boxed bug fades in at ~0.5 s |
| 3–60/77 s | **cold open**: the thesis, illustrated literally | b-roll matches the nouns ("color green" → a green aurora, then a green data tunnel). A key phrase is typeset over the wide shot as it is spoken ("Not enough talent"). Lower-third at ~12–15 s or ~70 s |
| 53–77 s | **series / episode card** 2–4 s | "series name" in bold serif + italic serif on dark CGI, or episode title over silhouette footage with "a [brand] interview" byline |
| +2–6 s | topic card | paper card, a question or topic with a short underline ("How psychedelics work") |
| body | **numbered sections** (Cox 1–7) or chapter-named sections (metadata has 4–9 chapters) | each section opens with a ~6 s paper card: number box + title. The previous section's title is often echoed as white text over the wide shot just before the next card |
| last 10–15 s | reflective one-liner, no "thanks for watching" | medium shot |
| end | credits 3–6 s ("Courtesy of …" stock list on dark CGI), then **end card 5–6 s with a different voice** giving the membership / business CTA ("Want to dive deeper? Become a … member…") | label-tape text on white or black |

- Hook pattern: an authority statement in the expert's own voice (credentials shown by a lower-third or, in Cowen's
  case, a 9 s montage of web pages and press about him), a concrete number ("$550 trillion"), then the counter-
  intuitive claim that is the title.
- Section handover: hard cut to a paper card. The number box pops, the title rises, holds 2–3 s, and the card rolls
  away to the first b-roll of the new section.
- Literal illustration is the rule: every concrete noun in the answer gets a shot within ~0.5 s of being spoken
  (mushrooms, pills, MRI, orchids, Earth, nuclear test). Abstract nouns get kinetic text.

## 5. Visual system

**Palette roles** (k-means on single frames):

| role | hex | notes |
|---|---|---|
| paper card centre | `#FAFAFA` → `#F3F3F3` | off-white |
| paper card vignette edge | `#DCDCDC` → `#C9C9C9` | radial, starts ~45 % from centre |
| card ink / text | `#161616` | near-black |
| speckle grain | `#161616` dots 0.5–2 px, ~0.2 % coverage, plus faint grey fibres | static, not animated |
| label-tape box | `#0B0B0B` with white `#FFFFFF` text; second line white box with `#111` italic | lower-thirds, lists, end card |
| interview backdrop (as exposed) | `#BFBDBC` medium shot / `#E8E8E6` wide | slightly grey, low saturation |
| room surround | warm wood `#4B3924` / `#6B5C44`, brick, green panelling `#2E2F17` / `#494534` | the "set within a set" |
| CGI accent | deep blue `#131D3F` / `#223166`, electric cyan highlights | brains, neurons, synapses |
| flat motion graphics (Cowen) | starfield `#060811`, grey discs `#A6A7AA`, blue disc `#122FA1`, coral disc ≈ `#C8615B`, white 2 px outline squares | only ~8 s per video |
| archival | B&W, warm worn frame edge ≈ `#A08A6A` on black | slide / film-strip frames |
| highlight marker | ≈ `#F2EC6E` at ~70 % | documents |

Overall colourfulness is low (23–29); saturation comes only from stock footage.

- **Shape language:** rectangles and boxes. Label tapes have square corners and 10–14 px padding at 1080p. The number
  box is a solid black square. The slide frame is a rounded rect (radius ~12 % of its height) with worn, burnt edges.
  Film strips show 35 mm sprocket holes and edge printing. Circles appear only in the rare flat motion graphics.
- **Line work:** almost none. Hand-drawn white curved arrows, 3 px with an open arrowhead, point at people in archival
  photos. Underlines are 3–4 px under the last word of a topic card. Molecule skeletal formulas are black 3 px lines
  with serif atom labels.
- **Texture:** paper grain plus vignette on every card. Film-strip and slide frames carry dust and edge burn. Nothing
  else is textured.
- **Lighting / depth:**
  - The cards are flat.
  - Depth comes from **text-behind-object compositing**: title text sits between the background plate and a foreground
    element. Examples: the mushroom cap overlaps the "P" of "Psilocybin"; a rotating protein ribbon crosses "Serotonin
    2A"; the Earth sits over "great" in "The great silence".
  - Stock CGI brings its own glow and bokeh.
- **Composition:**
  - Paper-card content is centred, with the title just below centre (y ≈ 55 %).
  - Kinetic text over the wide shot goes into the empty side of the room: left third for "Not / enough / talent" at
    x ≈ 14 %; right of the subject for the label list at x ≈ 53 %.
  - Lower-third: left edge at 10 % of width, bottom at ~90 % of height.
  - Bug top-right, inset ~4.5 % from the top and right edges.
- **Typography (free look-alikes; sizes at 1080p):**
  - Main face: a high-contrast bold serif. Source Serif 4 Bold / Semibold, Newsreader Display Bold or Libre Caslon
    Display; italics from the same family.
  - Paper card title: ~100–110 px font, sentence case, black. Number box ~100 px square, numeral ~60 px white.
  - Topic card: ~80 px with a 3–4 px underline under the last word.
  - Text over footage: 100–150 px white, sentence case, often 1–3 stacked lines with leading ~1.0. A soft shadow is
    optional; usually there is none.
  - Lower-third: name ~60 px bold white on black (box ~94 px tall); title ~36 px italic black on white (box ~64 px tall).
  - Label-tape lists: ~50 px white on black, one item per line, 10 px gap.
  - Series card: line 1 bold roman ~110 px, line 2 bold italic ~110 px, byline ~30 px italic.
  - Credits: ~18 px.
  - Text volume: 1–4 words per card, 3–8 per lower-third; never paragraphs, except quoted research papers shown as
    documents.

## 6. Characters and objects

- **No drawn characters.** People are the real interviewee plus stock actors in lifestyle footage (offices, therapy
  sessions, forests, labs) chosen as visual metaphors, not as documentary evidence.
- **Objects:**
  - Stock 3D medical renders: neurons with glowing synapses, receptor proteins as rainbow ribbon models, translucent
    brains.
  - Space renders: planets, a spaceship, the Moon, three Earths in a row.
  - Hand-drawn-look molecule diagrams, always captioned with the compound name in white serif at the bottom, or black
    on paper.
  - Flow chart: compound → arrow → neurotransmitter → arrow → system, black serif with thin vertical arrows on paper.
  - Archival portraits and documents. Web-page and research-paper screenshots on black, with yellow highlights.
- Flat motion graphics (Cowen 5:23–5:29): solid discs with thin white contour lines (a planet-like coral disc with
  curved white lines), overlapping grey discs, a blue disc with an outlined square, and a ring with a single dot
  orbiting. Built like a minimalist infographic, with captions in the same serif ("ADHD", "Autism").

## 7. Camera and transitions catalogue

| # | transition / build | frame-by-frame (8 fps strips) | duration @24 fps | frequency |
|---|---|---|---|---|
| 1 | **Hard cut** interview ↔ b-roll and between stock clips | — | 0 | >90 % of cuts |
| 2 | **Punch-in cut** | same take scaled ×1.2–1.3, cut on a pause | 0 | 1–3 per video |
| 3 | **Paper card roll-down / roll-up** | a white card slides **down from the top** over the wide shot (Cox 2:38.35 → 2:38.72); it leaves by **sliding up**, uncovering the next shot from the bottom edge (Cox 5:16.6 → 5:17.0, 9:53.6 → 9:53.8). The edge is hard and horizontal, with no shadow | 9–12 f, `power2.inOut` | every section card |
| 4 | **Number-box pop** | the empty card holds 0.5–0.8 s → a black square appears small and rotated ~45°, then scales to full while rotating to 0° over 3 strip frames → holds alone ~1.2 s | 9 f pop (`back.out(1.2)`), then hold | every numbered card |
| 5 | **Title rise** | the title appears under the box through a mask, rising from its baseline (top half cut in the first frame) | 5–6 f, `power3.out` | every card |
| 6 | **Lower-third grow** | a small black block appears at the left → the name box extends left→right, text revealed by the box → the white subtitle box follows 6 f later in the same way. Exit: subtitle first, then name | 9 f per box, stagger 6 f; hold 4–5 s | once, sometimes twice |
| 7 | **Label-tape list** | each item's black box grows left→right as the speaker names it; items stack downwards ~2 s apart (Cox 9:00.6 → 9:09) | 6 f per item | list moments |
| 8 | **Word-synced kinetic text** | each word fades or blur-ins on its spoken syllable ("Not" 9.57 s, "enough" +0.25 s, "talent" +0.38 s), stacked left-aligned in empty room space | 2–3 f per word, hold 1–2 s after the last word | 2–4 per video |
| 9 | **Text over footage, centred** | a single serif title fades up over b-roll, 2–3 s hold, sometimes behind a foreground object | 4–6 f fade | ~1 per minute |
| 10 | **Slide-projector archival** | B&W photo in a rounded worn frame on black. Photos change through a 2–4 f **blank white slide**. The name label writes on left→right (~8 f) and a curved white arrow draws on (~10 f) | photos ~1.5–2.5 s each | 1–2 sequences |
| 11 | **Film-strip pan** | 35 mm negative frames on a paper background drift horizontally at constant speed (~5 % of width per second). Names centred on each frame. Ends with a **zoom into one frame** to full screen (Cowen 1:46.5 → 1:47.0) | pan 5–20 s; zoom 12 f `power2.in` | Cowen only |
| 12 | **Document push and crash zoom** | screenshots or papers on black, slow push 1.0 → 1.3 over ~2 s; a fast zoom to the highlighted sentence | push 48 f linear-ish; crash zoom ~14 f | 2–3 per video |
| 13 | **RGB glitch / light-leak** | 1–2 frames of chromatic offset, smeared colour and pixel drag between the interview and CGI b-roll (Johnson 0:04.3, 2:12.5, 0:37.5) | 3–5 f | psychedelics video only |
| 14 | **Coloured panel wipe** | coral panels slide in from the left and right edges to cover the frame, then the next shape is revealed (Cowen 5:23.7 → 5:23.9) | ~6 f | flat motion graphics only |
| 15 | **Logo-line build** | brand boxes appear and then the wordmark wipes on under a title (Cowen 0:52.4 → 0:53.0) | ~14 f | series / title cards |

The camera on designed elements is static. Footage brings its own motion (slow-mo, drone drifts, gimbal pushes).
Paper cards never move once built.

## 8. Motion grammar

- **Build fast, hold long, leave cleanly.** Every designed element builds in 0.2–0.4 s, holds 2–5 s and leaves in
  0.3–0.5 s (or on a cut). A numbered card lasts ~6 s in total: 0.6 s empty paper → 0.4 s box pop → 1.2 s box alone →
  0.25 s title rise → ~3 s hold → 0.45 s roll-up.
- **Easing:** `power3.out` for reveals, `power2.inOut` for roll-down/roll-up and pans, a slight `back.out(1.2)` only on
  the rotated number box. Linear for film-strip drift and document pushes.
- **Stagger:** lower-third boxes 6 f apart; list items one per spoken item (~2 s); kinetic words on syllables
  (0.25–0.4 s apart).
- **On-the-word rule:** b-roll cuts land on the stressed noun (±3 f); kinetic text lands on the word itself. That word
  sync is the main source of energy, since the graphics themselves barely move.
- **Idle motion:** none on graphics. Slow internal motion in footage and CGI (rotating protein, drifting particles,
  flying camera) keeps the frame alive.
- **Breathing room:** the wide shot is used as a pause and as a text canvas, typically 3–8 s.

## 9. Sound (inferred from transcripts and metrics; I cannot hear the audio)

- Voice: the interviewee's natural, articulate conversational speech at **141–148 WPM**, slower than a narrator.
  Disfluencies are cut out; the edits are hidden by b-roll and punch-ins. No narrator, apart from **a second voice
  for the end-card CTA**.
- Music (inferred): a continuous ambient / cinematic electronic underscore (soft pads, pulses, piano), ducked about
  18–24 dB under the voice, swelling on title cards and the series card. Captions carry no music tags, which suggests
  a bed rather than featured cues.
- SFX (inferred): whoosh or glitch hits on the RGB transitions (Johnson), soft paper or swish sounds on card roll-downs.
- Loudness is inconsistent across uploads (−14.4 / −16.8 / −22.8 LUFS); silence ≈ 0–5 s. For a rebuild, normalise to
  −14 LUFS.

## 10. Do / Don't

**Do**
1. Cut to b-roll **on the stressed noun**, within ±3 frames, and keep b-roll literal.
2. Alternate a wide "set reveal" with a medium shot. Use the wide as a pause and as space for kinetic text.
3. Use one high-contrast serif family (bold + italic) for every text element.
4. Make section cards from off-white paper with grain and a strong grey vignette, black type and a small black number
   square.
5. Roll paper cards down from the top and away upward, with hard edges, in 10–12 frames.
6. Put names on label-tape boxes: name white-on-black, role italic black-on-white, growing left→right.
7. Typeset the speaker's key phrase word by word, in sync with the syllables.
8. Composite titles **behind** a foreground object in about one title in three.
9. Present archival material inside a physical metaphor (slide frame, film strip) with a hand-drawn arrow and label.
10. Keep graphics static once built; let footage provide motion.
11. Open with a ~1 min cold open before the series card.
12. End abruptly on the speaker's best line, then credits and an end card with a different-voice CTA.

**Don't**
1. Don't animate the graphics with idle motion, bounces or parallax.
2. Don't use saturated brand colours on cards: black, white, grey only. Colour comes from footage.
3. Don't put more than ~4 words on a card or more than ~8 in a lower-third.
4. Don't use cross-dissolves as the default; hard cuts carry the edit. Glitch transitions are an occasional seasoning.
5. Don't leave the interviewee on screen more than ~20 s without b-roll or an angle change (p90 interview run is 7–19 s).
6. Don't let a stock clip run longer than ~3 s inside a b-roll run.
7. Don't use sans-serif display type for titles.
8. Don't add drop shadows to label tapes or cards.
9. Don't use a narrator voice inside the body; the expert's own words carry it.
10. Don't treat `animated_frac` as an animation share for interview formats.
11. Don't copy the brand's monogram, wordmark, series names or end-card copy; design an original bug and series card.
12. Don't present stock CGI as original animation; for a code rebuild, replace it with procedural visuals (§11).

## 11. Replication recipe (SVG/HTML + GSAP, frame-by-frame render)

**Constraint:** the format depends on filmed interview footage plus licensed stock. Code can build the whole graphic
layer and the edit grammar. For a **code-only original**, use one of these:
- **Variant A (recommended):** first-person expert-style Kokoro voice over a looping, softly Ken-Burns'd photo of the
  speaker on a seamless backdrop (your own photo or an illustration), alternating "wide" (scale 0.55, room plate
  visible) and "medium" (scale 1.0) crops on the same image to fake the two angles.
- **Variant B:** audio-only interview with procedural b-roll throughout. Generative particles, SVG molecules, map
  fly-overs and gradient "CGI-like" orbs (radial gradients + `feGaussianBlur` + additive blending) stand in for stock.

**Layer stack:** `footage/b-roll plate` → `fg-matte plate` (for text-behind-object: the same plate with a hand- or
auto-cut alpha mask of the foreground object) → `kinetic text` (between the two plates) → `lower-third / label tapes`
→ `paper card` (full-frame, slides as one unit) → `bug` (top-right, always on) → `glitch fx` (optional).

**Paper card (SVG):**
```html
<svg viewBox="0 0 1920 1080">
  <defs>
    <radialGradient id="vig" cx="50%" cy="50%" r="70%">
      <stop offset="0" stop-color="#FAFAFA"/><stop offset=".55" stop-color="#F1F1F1"/><stop offset="1" stop-color="#C6C6C6"/>
    </radialGradient>
    <filter id="speckle"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="7"/>
      <feColorMatrix values="0 0 0 0 .09  0 0 0 0 .09  0 0 0 0 .09  0 0 0 -60 52"/></filter>
  </defs>
  <g id="card">
    <rect width="1920" height="1080" fill="url(#vig)"/>
    <rect width="1920" height="1080" filter="url(#speckle)" opacity=".5"/>
    <g id="numbox" transform="translate(960 470)"><rect x="-50" y="-50" width="100" height="100" fill="#111"/>
      <text y="22" text-anchor="middle" style="font:700 62px 'Source Serif 4';fill:#fff">1</text></g>
    <clipPath id="titleMask"><rect x="0" y="520" width="1920" height="140"/></clipPath>
    <text id="title" clip-path="url(#titleMask)" x="960" y="610" text-anchor="middle"
          style="font:700 104px 'Source Serif 4';fill:#161616">Original section title</text>
  </g>
</svg>
```
```js
const card = gsap.timeline()
  .fromTo('#card', {yPercent:-100}, {yPercent:0, duration:0.45, ease:'power2.inOut'})          // roll down
  .from('#numbox', {scale:0, rotation:45, transformOrigin:'50% 50%', duration:0.38, ease:'back.out(1.2)'}, '+=0.6')
  .from('#title', {y:120, duration:0.25, ease:'power3.out'}, '+=1.2')                           // rise through mask
  .to('#card', {yPercent:-100, duration:0.45, ease:'power2.inOut'}, '+=3.0');                   // roll away up
```
Use `yPercent:-100` for the exit so the next shot is uncovered from the bottom edge upward, which matches the source.

**Lower-third:** two `<g>` with a black `rect` (name) and a white `rect` (role) whose `width` tweens 0 → full over 9 f
(`power3.out`). Text sits in a clipPath tied to the rect. The role box starts 6 f later. Hold 4.5 s; exit in reverse
order with a 6 f stagger.

**Word-synced kinetic text:** take Kokoro word timestamps. For each word, `tl.from(word, {opacity:0, filter:'blur(8px)',
duration:0.1}, t_word)`. Left-aligned stack at x = 14 %, 150 px, leading 1.0, white. Hold 1.5 s after the last word,
then cut.

**Text behind object:** render the plate twice. The top copy is clipped to the foreground mask (SVG `<mask>` from a
pre-cut PNG alpha). Place the serif title between the copies, fade it up over 5 f, hold 2.5 s.

**Slide-projector archival:** a black field with a centred rounded rect (rx = 12 % of height) and an inner shadow of
burnt edges (radial gradient from `#A08A6A` at 85 % to transparent). Images swap through 3 frames of a `#F4F1EA` blank
slide. The label writes on with a clipPath width tween over 8 f; a curved arrow path draws on with
`stroke-dashoffset` over 10 f.

**Film strip:** a `<pattern>` for sprockets on a dark strip, frames 1.4:1, names centred in white serif ~48 px. Translate
the strip with linear motion at −96 px/s. The final frame scales to fill the screen over 12 f (`power2.in`).

**Roller-blind section change:** the whole card group moves only on `yPercent`; nothing inside it moves.

**RGB glitch (optional):** for 4 frames, three copies of the outgoing and incoming frames with `mix-blend-mode:screen`
and channel colour matrices, offset ±12–30 px horizontally. Add a 60 px-tall horizontal slice displacement
(`feDisplacementMap` driven by stepped turbulence), and a white light-leak radial gradient at 40 % opacity.

**The 5 shots that most define the style:**
1. **Numbered paper card** (above). About 6 s; once per section.
2. **Wide set-reveal with kinetic words.** The whole room, the subject small and centred on the seamless backdrop,
   1–3 stacked serif words appearing on syllables in the empty side of the frame.
3. **Medium interview with a label-tape lower-third** growing left→right at ~12 s.
4. **Literal b-roll title with depth.** A cinematic plate (procedural in code: a glowing orb or molecule) with the
   compound or concept name in big white serif, partly hidden behind the foreground object.
5. **Archival in a physical frame.** Slide-projector rounded frame with arrow and label, or a horizontally drifting
   35 mm strip with names. Then hard cut back to the interview.

**Edit skeleton for a 6-minute original:** 0:00–0:55 cold open (thesis, 6–8 b-roll inserts, one kinetic phrase,
lower-third at 0:12) → 0:55 series card (3 s) → topic card (3 s) → 4–6 sections of 50–70 s, each `section card 6 s →
interview/b-roll alternation (interview 3.5–6 s, b-roll 4–10 s, cut every 2–3 s) → one text-over-footage title` →
closing line → credits 4 s → end card 5 s with a CTA voice.

## 12. Per-video notes (animation and graphics only)

- **Brian Cox / aliens (dTjgrG2UY30).** The clearest card system: a topic card ("Are we alone in the universe?")
  followed by **7 numbered paper cards**, one per hypothesis (~6 s each). Each section's name is echoed as white serif
  over the wide shot before the next card rolls down. A label-tape list (three stacked risks) builds item by item
  beside the speaker. Slide-projector archival (Fermi, a 1970s astronomer, protest photos) with hand-drawn arrows.
  B-roll is mostly photo-real space renders and nature footage; the three-Earths shot carries "The great silence"
  behind the planet. No bespoke flat animation. Interview on screen 55 %, the most of the three. Credits on a grey
  CGI saucer, then a white end card.
- **Tyler Cowen / talent (4NJddyPpl44).** Opens with a 9 s **credentials montage**: pushes on screenshots of the
  speaker's institutional profile, podcast site, course channel and a newspaper article. Then the word-synced "Not /
  enough / talent" over the green-library wide shot. Research papers on black with yellow highlights and crash zooms.
  An episode title card over office silhouettes ("How FOMO can help you identify talent / with … / a … interview") at
  0:53. **Film-strip sequences** of mid-century music-industry photos with names. The only real flat motion graphics
  of the three: 8 s of discs, squares and rings on a starfield labelled "ADHD" and "Autism". B-roll is otherwise
  lifestyle stock. Interview 36 %.
- **Matthew Johnson / psychedelics (yS9FBB19Ws0).** The most motion: 25.7 cuts/min, 6.4 b-roll inserts per minute,
  RGB-glitch transitions. A series card on a glowing CGI brain at 0:57, then the topic card "How psychedelics work"
  with an underline. **Molecule skeletal formulas** on paper, captioned (four together as "The classic
  psychedelics"). Text-behind-object titles (Psilocybin, Serotonin 2A). A 3-step flow chart (compound → serotonin →
  glutamate system) built one arrow at a time on paper. Heavy stock medical CGI (synapse release, receptor ribbons,
  neuroplasticity). Ends on a CGI spiral tunnel (credits), then a black end card.

## 13. Source-list issues

- **The channel's current output is not this format.** In `raw/channel_listing.txt`, 18 of the 25 most recent Big
  Think uploads are 40 min or longer (median 4045 s, about 67 min), and at least 9 have "Full Interview" in their
  80-character-truncated titles. Only 7 are under 15 min. The 5–13-minute animated-b-roll explainers that vidpros
  recommends (uploads from 2022–23) are now a minority format. A rebuild should copy these older edited explainers,
  not the current feed.
- **Not an animation channel.** vidpros lists it among explainer channels. Bespoke animation is under 3 % of runtime.
  The "animated" look is mostly licensed stock CGI plus typographic packaging around an interview. It is useful as a
  **graphic-packaging and edit-rhythm reference**, not as an animation-style reference.
- **`animated_frac` (0.45–0.57) is inflated** by the white seamless backdrop. Use the measured 14–23 % designed-graphics
  share instead.
- The Cowen video spends its first 9 s on screenshots of third-party websites and press about the speaker. That is
  credential framing; do not treat it as part of the visual style to imitate.
- Channel attribution is correct for all three videos (uploader Big Think); nothing is mislabelled.

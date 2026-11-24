---
name: explainer-big-think
description: "Big Think-style expert-interview explainer packaging in code — a talking expert on a white seamless backdrop inside a warm loft, cut every 2–3 s between wide / medium / punch-in framings and b-roll, wrapped in the bookish graphics layer (speckled paper section cards with a black number box, label-tape lower-thirds and lists, word-synced serif kinetic text, archival plates in slide-projector or 35 mm film-strip frames, text tucked behind objects, simple \"stock CGI\" neurons, RGB glitch hits). Use for \"Big Think style\", \"expert interview explainer\", \"talking-head with b-roll and title cards\", \"documentary interview graphics package\", \"lower thirds + chapter cards\", or any one-idea expert monologue (science, psychology, economics) where no footage exists — the speaker is an original illustrated person. Builds on explainer-engine."
---
# Big Think — expert interview + graphic packaging

> `ENGINE` = `~/.claude/skills/explainer-engine/engine` (the **explainer-engine** skill: renderer, voice, score, QA). Rendered sample of this skill: `the sample film (the render is not included in this repository)` (source in `assets/sample/`).

An expert, seated on a wooden chair in front of a white paper sweep set up inside a big warm room, explains one idea
in their own voice. The edit never rests: wide "set reveal" ↔ chest-up medium ↔ ×1.25 punch-in, b-roll on every concrete
noun, and a calm, bookish graphics layer — black-on-off-white speckled paper cards that roll down like blinds, white serif
words that land on syllables, label tapes, archival plates in physical frames. The graphics barely move; the cutting and
the footage carry the energy. Code-only rebuild: the expert is an ORIGINAL flat-vector person (`BT.expert`) in a drawn loft
(`BT.studio`), stock CGI becomes canvas neurons / spheres / synapses (`BT.cgi`). Built from frame analysis of 3 source
videos (references/sources.md). Original work only: own expert, own monogram bug, own series name, own end card.

## 1. Signature traits
- **Interview set within a set**: white seamless backdrop + roll tube in a warm loft (brick, arched factory windows, bookshelves, wood floor, softbox). Wide shows the room; medium is all grey-white paper with a blurred room sliver at one edge.
- **Cut every 2–3 s** on the stressed word: framing changes inside interview runs, hard cuts to b-roll, punch-ins hide "jump cuts".
- **Paper cards**: off-white, grain + speckle + heavy grey vignette, near-black bold serif, small black number square that pops rotated 45° → 0°, title rising through a mask; card rolls **down from the top** and leaves **upward**.
- **Label tapes**: white bold serif on black, italic black on white; grow left→right (lower-third, lists, end card).
- **Word-synced kinetic serif** in the empty side of the wide shot, 1–3 stacked lines, blur/fade-in on the syllable.
- **Archival in a physical frame**: B&W plates in a rounded burnt slide frame (blank white slide between plates, write-on label + hand-drawn arrow) or a drifting 35 mm strip that ends in a zoom into one frame.
- **Text behind an object** (~1 title in 3), centred white serif over b-roll.
- **Monochrome boxed-monogram bug** top-right, always on. Colour comes only from "footage" (room, CGI, plates).

## 2. Target metrics
| metric | source range (3 videos) | target | sample (big-think.mp4, 66.5 s) |
|---|---|---|---|
| scene_changes_per_min | 14.1–23.0 | 15–23 | 21.7 |
| scene_len_median s | 2.16–3.67 | 2.2–3.5 | 2.34 |
| cuts_per_min | 17.6–25.7 | 17–26 | 18.1 |
| shot_len_median s | 2.04–2.77 | 2.0–3.0 | 2.58 |
| motion_mean | 7.3–13.7 | 7–14 | 10.0 |
| hold_frac | 0.08–0.19 | 0.06–0.2 | 0.063 |
| colourfulness | 23.4–28.7 | 21–30 | 22.5 |
| brightness | 0.40–0.52 | 0.40–0.55 | 0.544 |
| dark_frame_frac | 0.175–0.25 | 0.15–0.25 | 0.197 |
| WPM | 141–148 | 141–148 | 144.4 |
| LUFS | −14.4 / −16.8 / −22.8 | −15 | −15.0 |
| interview on screen | 36–55 % | 35–50 % | ~38 % |
| b-roll inserts / min | 3.4–6.4 | 5–8 (short piece) | ~7 |
Deliberate deviations: a 66 s piece compresses the 53–77 s cold open to ~10 s and section cards from ~6 s to ~2.4 s
(voice J-cuts under the card); designed graphics are ~45 % of runtime instead of 14–23 % because the sample exists to
show the whole package and there is no real footage to carry the b-roll. That extra neutral paper is why brightness sits
at the top and colourfulness at the bottom of the range: keep paper shots short, put the end card on dim CGI, tone
archival plates lightly sepia (`BT.sepia`) and give the medium camera a warm grade — those moves took the first render
from colourfulness 14.7 / brightness 0.61 / dark 0.09 to the values above.

## 3. Script formula
One expert, first person, no narrator; ends abruptly on the best line; then credits and a **different-voice** CTA.
| % runtime | beat | on screen |
|---|---|---|
| 0–6 % | framing line to camera ("Most of us treat X as a failure. I think that's backwards.") | medium + lower-third at ~0.8 s, punch-in on sentence 2 |
| 6–15 % | thesis, literal b-roll | wide + kinetic words, CGI b-roll (glitch in), medium |
| 15–21 % | series card + topic card (music swell, no voice) | sphere CGI + original series title → paper topic card with underline |
| 21–40 % | setup: the historical study / the story | slide-projector archival, film strip, plates |
| 40–90 % | 3 numbered sections, 1–2 sentences each | card → diagram / interview / label tapes / doc push / text-behind-object |
| 90–93 % | closing line ("That's the moment to …") | wide → medium → punch-in |
| 93–100 % | credits 1 s, end card with CTA in a second voice | tunnel CGI, black label tapes on white |
- Literal rule: every concrete noun gets a shot within ~0.3 s (brain → neurons, published → title page, measured → stopwatch). Abstract nouns get kinetic type.
- Kokoro: `af_heart` (expert) at **speed 1.2** (≈183 wpm speaking) with gaps 0.3–0.4 s inside answers, 1.0 s before a section card, 3.6 s for series+topic cards → 144 WPM overall. CTA: `bm_george` 1.1. Spell numbers as words ("eighteen eighty-five").
- No fake quotes from real people; a real historical figure may appear as an *illustrated stand-in* plate with a name label. Disclose the fictional expert in the credits.

## 4. Visual system
| role | hex |
|---|---|
| paper centre → vignette edge | `#FAFAFA` → `#F3F3F3` → `#DCDCDC` → `#C4C4C4` (radial) |
| ink / card type | `#161616`; number box `#111` |
| label tape | `#0B0B0B` + white; role box white + `#111` italic |
| medium backdrop (as exposed) | ≈ `#C4C1BD` (room raster + 19 % `#3A3532` grade + falloff) |
| wide backdrop | `#ECEAE6`, edges `#CFCCC6` |
| room | brick `#764A36`±, mortar `#5A3E2E`, shelves `#3A2A1E`, floor `#4E3522`→`#7C5735`, windows `#F7F5EE` |
| CGI | bg `#1E3070`→`#111B44`→`#03050D`, glow `rgba(50,120,255)`, core `#A0DCFF`, synapse vesicles `#FFEC96` |
| archival | greys 22–235, burn `#A08A6A`→`#1A1008`, blank slide `#F4F1EA` |
| marker | `#F2EC6E` @ 70 %, multiply |
- Type: **Libre Baskerville** only (700 roman for titles/tapes, 400 italic for roles/labels/axes). Card title 92 px, topic 78 px + 4 px underline under the last word, kinetic 90–130 px white (fit to the empty side), lower-third 50/30 px, tapes 46–54 px, series 104 px roman + italic, credits 24 px. Caveat 700 for handwriting (notes, index cards). ≤ 4 words per card, ≤ 8 per lower-third.
- Composition: card number box centre (960, 452), title baseline y 612; lower-third left x 192, bottom y 972; kinetic stack x 312 (left bookshelf), label tapes x 1096 (right of subject); bug inset 86 px right / 49 px top.
- Texture: paper grain/speckle on cards and diagrams (static); film noise + dust on archival; global grain 0.045 @ 12 fps.

## 5. Characters & objects
- **`BT.expert(parent, {lines, gestures, nods, visible})`** — seated fictional expert (local units: head top y 0, feet y 1000; placed at world (960, 420) × 0.45). Layer order: chair back → hair back → seat → legs (crossed) → neck → torso (breathes) → lapels/top/necklace → arms (shoulder pivot ±128,300; elbow 192 below) → head (ears, face shade, blush, eyes with blink lids, brows, nose, mouth, front hair, glasses). Lip-flap from VO word times (syllables ≈ vowel groups), blinks every 2.4–5 s, idle head sway, nods with brow lift, gestures `{t, d, arm:'R'|'L'|'B', amt}` blending REST → UP/OPEN with smoothstep. Change palette via `o.skin/hair/jacket/top`.
- **`BT.studio(parent)`** — loft raster (1.5× canvas) + pre-blurred copy for medium shots (depth of field) + medium exposure grade; **`BT.shot(st, t0, t1, 'wide'|'med'|'punch'|'medR')`** schedules framings with a slow drift (pure function of t).
- **`BT.cgi(parent, t0, t1, {mode})`** — canvas in foreignObject: `field` (glowing neurons, pulses, bokeh; `fadeAt` dims 60 %), `sphere` (network globe for series card), `synapse` (terminal, vesicles, transmitter crossing; `build` ramps receptors), `tunnel` (credits).
- **Plates** (B&W stand-ins): `BT.plates.portrait` (generic bearded 19th-c. scholar, cabinet-card oval), `.book` (title page lines), `.indexCard` (hand-lettered word, returns the text for a write-on), `.watch` (+ `BT.tickWatch`).
- **Diagrams on paper**: `BT.diagram.axes` (black 3 px, italic labels, ticks), `BT.diagram.curve` (Catmull-Rom through data points) + `X.drawOn`.

## 6. Motion grammar
| move | ease | frames @24 |
|---|---|---|
| card roll-down / roll-up | `power2.inOut` | 10 / 10 |
| number box pop (scale .15, rot 45 → 1, 0) | `back.out(1.2)` | 9, at roll-in + 3 |
| title rise through mask | `power3.out` | 6, box + 6 |
| topic underline | `power2.out` | 7 |
| tape / lower-third grow (left→right) | `power3.out` | 6–9, role box +6 |
| tape shrink exit | `power2.in` | 7, role first |
| kinetic word blur-in | `power1.out` | 3, starting 1 f before the word |
| centred title fade | `power1.out` | 5 |
| label write-on / arrow draw | `power1.inOut` | 8 / 10 |
| film-strip drift | linear | ~150 px/s, then zoom 10 f `power2.in` |
| doc push / crash zoom | linear 1.0→1.1 / `power2.in` | shot / ~10 |
| camera drift in every shot | linear | wide 1.0→1.035, med 3.9→3.99 |
Build fast, hold, leave on a cut; graphics have no idle motion — the expert (breath, blinks, lips, gestures), CGI, steam, ticking watch and camera drift keep frames alive.

## 7. Transitions
| name | build | frames | use |
|---|---|---|---|
| hard cut | shot windows end/start on the same t | 0 | > 90 % of changes |
| punch-in | `BT.shot(..., 'punch')` after `'med'` | 0 | 2nd sentence of an answer, closing line |
| paper roll-down / roll-up | `BT.paperCard` | 10 + 10 | every section / topic card; reveal the next shot from below |
| RGB glitch | `BT.glitch(L.world, t)` | 4 | interview → CGI only, 1–2 per piece |
| slide change | `BT.slideFrame` plates, auto 3-frame blank slide + shutter | 3 | archival sequences |
| film-strip zoom-in | `BT.filmStrip({zoomTo, zoomAt})` then cut to the full-frame plate | 10 | end of a strip |
| crash zoom | `BT.docPush({crashAt, focus})` | ~10 | out of documents |
| logo-line build | `BT.seriesTitle` | 14 | series card |

## 8. Sound
`sound.json`: `doc-pulse`, 92 bpm, energy 1 under answers, 2 on the series card and from section 2, 1 for the close; `music_under_voice_db −21`, `sfx_db −5`, `lufs −15`, `end_hit false` (the source ends abruptly).
SFX map: card roll-down `paper`, number box `click`, roll-up `slide`; tapes/lower-third `slide` (0.12–0.16); glitch `glitch`; slide changes `shutter`; write-on/markers/curve draw `scribble`; strip/doc zooms `zoom_in`; review markers `blip_up`; watch `tick`/`tock` per second; series card `whoosh` + `blip`; fades `woosh_low`; CTA end card `slide`. Keep all SFX quiet — this is a voice-led format.

## 9. Build recipe
1. Copy `assets/template/` (includes kit.js) to the project; it renders a 12 s demo as-is.
2. Write `script.json`: hook + thesis, setup, 3 one-or-two-sentence sections, closing line, CTA line with another voice; run `make.sh <p> --draft` once to get `data/vo.json`; tune `speed`/gaps to 141–148 WPM.
3. In `scene.js` write the EDL as `T.x = X.word(line, word) - 0.05` for every cut; schedule interview shots with `BT.shot`, b-roll with `X.scene`/`BT.cgi`/`BT.slideFrame`/`BT.filmStrip`/`BT.docPush`, cards with `BT.paperCard` (roll-down in the gap before the line, `tOut` ~0.3–0.5 s after the voice resumes).
4. Per beat: hook → `med` + `BT.lowerThird`, `punch`; thesis → `wide` + `BT.kinetic`, `BT.cgi` + `BT.glitch`; series → `BT.cgi sphere` + `BT.seriesTitle`, topic `BT.paperCard({topic:true})`; history → `BT.slideFrame` (+`BT.annotate`), `BT.filmStrip`; sections → card, diagram (`BT.diagram`), `BT.labelTape` list over `wide`, `BT.docPush`, `BT.titleOver` with a foreground group drawn after it; close → `wide`, `med`, `punch`; `BT.cgi tunnel` credits, `BT.endCard`; `BT.bug` + `X.grain(0.045)`.
5. Stills at every beat (`render.mjs --stills`), then `make.sh <p> --skip-tts --fps 24 --workers 3`.

## 10. QA checklist
- Stills: medium (lower-third legible, bug visible on grey paper), wide (kinetic text fully over the dark shelf, never over the backdrop or a window), each card mid-pop, each plate, text-behind-object (object hides ≤ 1–2 letters), end card.
- Metric gates: cuts/min 17–26, median shot 2–3 s, WPM 141–148, colourfulness 21–30, brightness ≤ 0.55, dark frames ≥ 0.15. If cuts are low, split a long interview shot wide → medium (medium ↔ punch-in cuts are NOT detected: same histogram). If colour is low / brightness high, you have too much paper.
- Lower-third must finish its exit (name leaves 6 f after role) before the next cut; card titles start ≥ 1.5 × size below the mask so ascenders never peek during the roll-in.
- Do: cut on the stressed noun; one serif family; hard horizontal card edges; static graphics; disclose the fictional speaker.
- Don't: drop shadows on tapes/cards, saturated card colours, cross-dissolves as default, > 4 words on a card, a real channel's bug/series/end-card copy, an interviewee alone > 8 s without a cut.

Files: references/analysis.md · references/sources.md · assets/kit.js · assets/template/ · full reference build: `assets/sample/scene.js` in the explainer-styles workspace (every helper in use, 32 shots).

## Later evidence
Added after the skill was written (read when extending the style):
- `references/channel-extras-addendum.md` — 2026 Big Think: white backdrop and paper cards gone; true cutting 15–18/min at a lower threshold

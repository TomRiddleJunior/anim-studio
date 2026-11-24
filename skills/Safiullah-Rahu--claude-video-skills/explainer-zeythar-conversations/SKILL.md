---
name: explainer-zeythar-conversations
description: "Makes episodes of the user's own animated vertical 9:16 series 'Conversations Beyond Time': Zeythar, the Sage AI (a faceless hooded ancient superintelligence in a dark robe with glowing blue rune lines, a medallion and a holographic atom orb over his open hand) and the girl (20, long wavy hair half up, maroon embroidered shawl, black trousers, a wristwatch, chin resting on her hand) talk before a giant starry clock at night. Short, natural, often funny dialogues on everyday 17-30 topics (sleep, overthinking, love, study, career, friends, family, social media), written from the user's series bible: she brings a situation, he rarely gives the expected answer (dry records, a funny name for the problem, an insight she did not expect), she challenges him, the last word can be a joke. 30 s to 4 min. Animated from the user's key art itself, never redrawn: GrabCut layers on an inpainted background, WebGL liquify warps masked by region maps, her blinks, gaze, brows, smile, head tilt, laugh and lip-sync (jaw warp with the hand under her chin masked out + a dark mouth interior from her voice envelope), his voice made visible by the orb, the medallion and light pulses along his rune lines, the orb morphing into the script's shapes (a sleep log, speech bubbles with REVIEWED stamps, a notepad and timer, a sun-and-moon arc, tally marks, plus a generic icon set), an animated holographic name tag, code-drawn clock hands that time-lapse through the night, shot/reverse-shot cutting. Qwen3-TTS VoiceDesign voices kept consistent by saved anchors, word-synced speaker-coloured captions, a synthesized late-night score, HyperFrames render, measured QA gates. Use for 'Zeythar', 'Conversations Beyond Time', 'the Sage AI and the girl', 'a new Zeythar episode', 'make an episode about <topic> with Zeythar', 'the hooded AI and the 20-year-old girl', or any new episode or topic for this series."
---
# Conversations Beyond Time — Zeythar, the Sage AI, and the girl

A series format: the user's two characters (key art `assets/plate/keyart.png`, 1402×1122, the user's own image) have
a new conversation in every episode. Episode 1, **"The 2:30 AM Committee"**:
`the sample film (the render is not included in this repository)` (81.3 s). How episodes are
written: `WRITING_BIBLE.md` (the user's bible, verbatim) and `EPISODE_GUIDE.md` (episode.json, beat maps, morphs,
shots, six outlines). Four ready-to-build episodes (the bible's sample conversations): `assets/episodes/`. Build with
the template (§12). Only these two characters ever appear (morphs, icons and stamps stay abstract), Zeythar never
shows a face (darkness in the hood, at most a faint drift of blue particles), and the characters are always animated
from the key art.

## Source analysis (what the user gave us)
- **The request** (2026-11-02, `explainer-styles/BUILD_BRIEF_ZEYTHAR.md`): "Some changes to this style" after "The
  Guardian & the girl" — new key art, a series bible, Zeythar replacing the Guardian, the girl now 20, and the series
  becoming short natural dialogues on everyday topics rather than countdown lectures.
- **The bible** (`WRITING_BIBLE.md`): two fixed personalities (Zeythar: calm, observant, dry, emotionally intelligent,
  never arrogant; the girl: curious, sarcastic, emotional, intelligent, never only the straight man), eight content
  categories (A love · B study · C career and money · D friendship · E family · F mental and emotional · G modern life
  and technology · H sarcastic observations), a flexible structure (hook in 3–5 s → development → an unexpected insight
  → a memorable ending, often a joke), ten deliverables per episode, three lengths (30–60 s, 60–90 s, 2–4 min), four
  sample conversations, and the user's recommendation: **he rarely gives the expected answer.**
- **The key art**: a Pixar-like render. Zeythar on the left (x 0–804; hood 72–480, the hood opening x 404–612 /
  y 172–472 pure black; medallion at (466, 527); blue rune lines on the hood edge, collar and robe; an open gloved
  palm at (700, 604) with a holographic atom orb floating above it, centre (733, 431)); the girl on the right
  (x 794–1402; face 938–1100 / 268–446 in 3/4 view looking up-left at him; her chin rests on her right hand, the
  watch at her wrist); behind them a giant clock: a golden frame with window panels, gears, Roman numerals, a deep
  starry-blue dial and one painted hand pointing up to XII from the centre (679, 395). A baked-in name tag
  "Zeythar / The Sage AI" sits top left (x 93–236, y 247–326). Warm gold rim light from behind, cool blue from him.
- **What the plate removes and code redraws**: the name tag (re-drawn as an animated holographic tag), the orb (so it
  can spin, pulse with his voice and morph), and the painted clock hand (so the clock can tell the story's time).

## 1. Identity
- **Two voices, one place, one night.** The girl and an ancient faceless intelligence at the foot of a giant clock.
  Shot/reverse-shot dialogue, cut on every speaker change, wides for the two-shot beats.
- **The clock is the story's real clock**: code-drawn hour and minute hands read the episode's start time in frame 0
  and step forward minute by minute (a firm tick each) to the end time on the last line (ep. 1: 2:30 → 2:47, the last
  step landing on "2:47" with a dry tick in the clock close-up).
- **His voice is light**: the orb's brightness and ring speed follow his voice, the medallion glows, pulses run out
  along his rune lines on syllable onsets, blue sparks rise from the medallion.
- **The orb thinks in pictures**: on the script's cue words it morphs (0.4 s) into a small holographic shape and folds
  back (a sleep log, a ring of speech bubbles that get REVIEWED stamps, a notepad + pen + 10:00 timer, a sun-and-moon
  arc, tally marks…).
- **She carries the episode**: her face is the user's painting, warped live: lip-sync on every line, blinks, gaze
  shifts, brows, smile, head tilt, a laugh, her chin lifting off her hand.
- **The name tag** "ZEYTHAR / THE SAGE AI" forms on his first line (border traced in, glass fades up, letters typed,
  a scan line) and stays where the painted one was.

## 2. Pacing targets (measured on episode 1; `samples/zeythar-two-thirty/out/qa/`)
| metric | target | episode 1 |
|---|---|---|
| duration | short 30–60 · standard 60–90 (aim 70–85) · extended 120–240 s | 81.3 s (standard) |
| first word · frame 0 | ≤ 0.4 s · the girl, the category chip and the clock | 0.02 s ("Zeythar") · GIRL_OPEN with the chip, the series label and the clock (its hands are hidden by the orb fade since the 2nd fix pass; the caption "IT'S 2:30 AM." carries the time) |
| words · pace | standard 150–200 | 178 words · 131 WPM overall, 169 WPM while speaking |
| shots · cuts | a cut on every speaker change; 18–24 shots for a standard episode | 23 shots (22 cuts, 16.2 / min) |
| the turn (honest line) | 55–70 % | 51.15 s = 62.9 % |
| last line | in the final 8 s before the end card | 75.88 s, 2.2 s before the end card (78.05 s) |
| loudness | −14 ±1 LUFS, TP ≤ −1 dBTP, voice ≥ 10 dB over the bed | −14.1 LUFS · −1.3 dBTP (on the mp4) · voice 21.4 dB over the bed |
| Whisper `small` on the mix | every word | 177/178 (only the interjection "Ah." heard as "Oh."; `small.en` heard "Ah" on the take) |
| layout | no caption on a face, the orb, a morph or the tag; safe areas | 0 violations in 2439 frames |
| brightness | no unplanned YAVG dips | 0 flagged (min 67, mean 83) |

## 3. Beat map (standard episode, % runtime; short and extended maps in EPISODE_GUIDE.md §3)
| % | beat | episode 1 | picture |
|---|---|---|---|
| 0–6 | **Hook** (L, names him) | "Zeythar. It's 2:30 AM. I said I'd sleep at ten." | GIRL_OPEN (girl + clock at 2:30 + chip) → GIRL_CU on "I said" |
| 6–12 | His dry reply + the tag | "You said that yesterday. And on Tuesday. I keep records." | HOOD_ORB_TAG: tag forms, log morph |
| 12–30 | The comic premise, named | "Ah. The committee is in session." / "The what?" / "…reviewed nightly. Attendance is mandatory." | ORB_INSERT (bubbles) → GIRL_CU2 → WIDE (bubbles orbit, REVIEWED stamps) |
| 30–45 | His first real point; she challenges | "…you never give it an appointment." / "Okay, wise one. How do I make it stop?" | HOOD_MCU → GIRL_MCU2 (chin lifts) |
| 45–60 | The practical answer she mocks; his punchline; her laugh | "Give it ten minutes before dinner…" / "That's the ancient wisdom?" / "Your species declined." / "…Rude." | ORB_INSERT (notepad) → GIRL_CU → HOOD_CU_PUSH → GIRL_CU2 (laugh) |
| 60–63 | **Quiet beat** | (0.8 s, one pad, the clock ticks) | WIDE_QUIET |
| 63–72 | **The turn** | "Night is the only time nobody needs anything from me." / "You are taking back your day." | GIRL_CU_PUSH (warm light softens) → HOOD_MCU (orb dims, sun-moon arc) |
| 72–85 | Resolution + callback joke | "…while the sun is up." (dawn tint) / "Okay. Going to sleep." / "You have said that four times." | WIDE → GIRL_MCU → HOOD_ORB (tally IIII) |
| 85–96 | The last word | "Goodnight, Zeythar." / "It is 2:47." | GIRL_CU → CLOCK_CU (hands land on 2:47, one dry tick) |
| 96–100 | End card + loop | "What time did you actually fall asleep last night?" · COMMENT BELOW · CONVERSATIONS BEYOND TIME | over the clock; the last frame is the clock, the first frame is "It's 2:30 AM" |

## 4. Visual system
- **Plate** (`assets/plate/`, 2× = 2804×2244; lanczos colour + fine detail from `keyart_sr2x.png`, Real-ESRGAN
  x4plus_anime_6B → box 2×, `tools/sr_upscale.py`, ~100 s on the CPU; weights at `models\realesrgan\`):
  `bg.jpg` (both characters out; the name tag, the orb and the painted hand inpainted: Telea for colour + procedural
  stars matched to a clean patch of the dial, because tiling a donor repeated its spokes as diamonds), `zeythar.png`,
  `girl.png` (GrabCut seeded by hand-measured polygons + sure-background strips: the lit dial between them, the clock
  frame beyond her hair, the sky above her crown), `girl_closed.png` (her eyes filled shut from the surrounding skin;
  the nose-bridge highlight excluded), `lines.png` (R rune lines by hue, G medallion core), `regions_girl.png`
  (R head without the hand · G back hair · B torso · A eye openings for the iris), `regions_girl2.png` (R jaw = lower
  lip + chin with the hand cut out · G face skin · B hand + forearm), `regions_zeythar.png` (R hood · G open hand ·
  B low hand · A torso), `landmarks.json` (eye polylines at 32 columns, iris centres, mouth curve, brows, pivots, hood
  opening, orb, tag box, clock centre, face box).
- **Wide layout** (GIRL_OPEN, HOOD_ORB_TAG, WIDE, WIDE_QUIET, CLOCK_CU): the plate across the middle; above it a
  code-drawn starry sky with the clock's golden window band, rim, inner ring and spokes continued from the plate (centre
  (679, 395), r 652); below a dark stone ledge with a warm lip over a dim void.
- **Singles** stay inside the plate at 1.86–2.30× (it fills 9:16 from 1.71×). Depth of field by mip LOD (bg 1.0–1.3);
  bg parallax 6 % of the camera travel.
- **Clock hands** (code, on the inpainted dial): hour 168 px, minute 262 px, warm gold with a pointer diamond, a soft
  under-shadow, the hub. They belong to the defocused painted dial, not the foreground: in every shot but the final
  clock close-up their edges get the dial's softness (4.2 + 1.2 × bgLod world px, the painted rings rise over ~8 px)
  and 30 % less light, and they fade to ~4 % inside the orb's (or the active morph's) bounding box + 40 screen px, so
  they never read as a staff in his palm or a pointer at her face. Because the orb floats in front of the clock's
  hub, that box covers the hub and the whole hour hand: the hands effectively show only once the orb settles into his
  palm, in the CLOCK_CU ending (sharp, as before). Frame 0 therefore no longer shows the hands at the start time;
  the caption carries it. One line in `zeythar-film.js` (skip the hole for an idle orb in GIRL_OPEN) brings back a
  soft, dim 2:30 in frame 0 if wanted.
- **Hologram layer** (`zeythar-holo.js`): two 2-D canvases composited in WebGL before bloom (a light layer added, a
  dark-glass layer over), so the orb and morphs bloom into the scene; the readable letters of the log, tag and stamps
  are drawn again crisp on the overlay after the grade.
- **Grade**: soft ACES shoulder 35 %, saturation 1.03, contrast 1.04, vignette 0.4, bloom 0.42 (singles) / 0.52
  (wides), grain 0.032; the turn softens the light (contrast −0.06, bloom +0.10, warm 0.22); the dawn line grows a
  rose-gold light on her side (screen right) over 3 s.
- **Palette**: night navy `#0d1033`, dial blue `#2a3a8a`, frame gold `#ffad52`, her maroon `#5a1424`, his rune blue
  `#3fa0ff`, hologram cyan `#6fe1ff`, her caption warm white `#fff1dc` with amber `#ffc46b`.

## 5. Characters (warps and acting; `assets/template/assets/lib/zeythar-film.js`)
A control is `{c: [cx, cy, radius, type + 10 × channel], p: [...]}`; type 0 translate, 1 rotate (pivot, angle),
2 scale (pivot, sx, sy); channels 1–4 = regions_*.png RGBA, 5–7 = regions_girl2.png RGB. Body controls first, then face.
- **Zeythar**: breathing (scale about (380, 1120), torso mask), hood tilt/nod (rotate about the neck (500, 482),
  ≤ 0.03 rad, hood mask) + a tiny hood tilt on the first word of each of his lines, the open hand turning (rotate about
  the wrist (612, 676), ≤ 0.05 rad) and lifting (≤ 5.5 px), low hand drift; `still` damps the idle for deadpan lines.
  Voice: orb brightness `0.55 + 0.55·env (+boost, −dim)`, ring phase `0.8 t + 2.4 ∫env`, medallion `0.15 + 0.9·env`,
  rune pulses from syllable onsets at 430 px/s, 3 sparks per pulse. 16 faint particles drift in the hood (α ≤ 0.19).
- **The girl**: breathing (3.6 s), head tilt about the chin on her hand (996, 440) so the hand never stretches, head
  lift/drop/nod (translate, head mask without the hand), shoulder bob on the laugh, back-hair sway following the tilt.
  Face: jaw (lower lip + chin, 5.8 px × mouth, hand masked out), brows (far 2 px, near 2.6–3 px, a knit), one brow,
  mouth corners + cheek for the smile (face-skin mask), eyes widen (scale 1.04/1.09), gaze (the iris moves up to
  ~1.8 px inside the eye openings: up for an eye roll, down-away for the honest line, toward the orb), micro saccades
  every ~3 s.
- **Blinks**: every 2.4–4.6 s, ~0.5 s into each of her shots and after each of her lines; 75 ms close, 55 ms hold,
  160 ms open; slow blinks 0.7 s; a squint (lids 28 % down) on the laugh. The lid edge travels from the lid line to the
  lower lid per column over the closed-lid texture with a crease shadow and a tapered lash line; the far lid is toned
  warm-dark toward its outer corner (it sits by her hair).
- **Lip-sync**: her envelope (per line normalised, attack 0.55 / release 0.22 per 10 ms, `mouth = min(1, 1.1·env^0.62)`)
  drives the jaw warp and a dark interior lens between the lip line and the lowered lower lip (dark red, tongue tone
  low, a faint upper-teeth band in the middle when well open), tapered at the corners. Max opening ≈ 13 screen px in
  a 2.3× close-up; more looked uncanny on the painted lips.

## 6. Transitions
| name | build | when |
|---|---|---|
| hard cut | her shots 0.16 s before her first sound (a laugh counts), his 0.10 s before his first word | every speaker change, in-line `cuts` |
| quiet beat | a cut to WIDE_QUIET 0.22 s after the line; no caption; one pad | `beat_before` |
| his pause | the cut comes 0.25 s after her line; he holds, the orb dims, then speaks | `pause_before` |
| orb morph | the orb shrinks and dims, the shape scales in 0.7 → 1.0 over 0.4 s with a chime; out over 0.4 s at the next cut | `orb` |
| name tag | border traced in 0.5 s, glass up, text typed, a scan line, hologram flicker | his first line |
| minute step | the minute hand steps 6° with a 90 ms back-out overshoot, a glow flash, a firm tick | evenly spread; the last on `final_tick_at` |
| end card | rows rise 18 px and fade in 0.5 s (staggered 0.18 s), the pill, then the series label; a bell | 0.55 s after the last word |
No dissolves, no whip pans.

## 7. Motion grammar
- Every shot moves: an eased push/drift between `cam0` and `cam1` (2–4 % zoom) plus a small hand-held float (0.3–0.6 on
  wides and pushes, 1.0 on singles).
- The two deliberate moves are slow pushes: her honest line (GIRL_CU_PUSH, z 2.04 → 2.30, 5.6 s) and his driest
  punchline (HOOD_CU_PUSH, z 2.0 → 2.3); the quiet beat before the turn is nearly still.
- Characters never freeze: breathing, his hand drift, her hair, gold dust at three depths, the orb's rings.
- Every act is keyed to a word (`tag@word`), never to seconds.

## 8. Captions and on-screen text
- **Captions**: 1–3 words (≤ 15 chars), each word popping in on its onset, Montserrat 800 70 px caps at y 1420 (lower
  third, inside the 400 px bottom safe area), dark stroke + shadow. **The girl**: warm white `#fff1dc`, keywords amber
  `#ffc46b`. **Zeythar**: cyan `#9ff1ff` with a soft glow, keywords near-white. A caption never carries into a quiet
  beat shot.
- **Top chip** (first seconds, fades after his first line): a cyan-edged pill with the category ("SLEEP ·
  OVERTHINKING", 30 px) at y 262 and the series label ("CONVERSATIONS BEYOND TIME", 26 px, tracked) at y 324.
- **Name tag**: world box (94, 247)–(237, 326): dark-teal glass, thin cyan border with chamfered corners, "ZEYTHAR"
  (800) over "THE SAGE AI" (700, tracked), both fitted to the box.
- **End card**: two caps rows (50/62 px) at y 282/360, a cyan pill "COMMENT BELOW", the series label at y 1460.
- `tools/layout_check.py` projects her face, the hood opening, the orb or the active morph and the tag through every
  frame's camera; it must print 0 violations before rendering.

## 9. Sound (`tools/score.py`, all synthesized)
| layer | level | when |
|---|---|---|
| Zeythar: + low warmth, a faint high shimmer (−31 dB), warm hall (RT60 2.1 s, −17.5 dB) — no chorus, no pitch fx | 0 dB | his lines |
| the girl: dry + a small room (RT60 0.32 s, −21 dB) | 0 dB | her lines |
| dialogue levelling: each line's speech RMS → −17 dB, gain −4…+6 dB | — | join_vo.py |
| pads in F lydian (Fmaj9 – Am9 – Dm9 – B♭maj9(#11), 62 BPM, two bars a chord), a slow sub pulse on the bar, a sparse celesta motif | ~19.5 dB under the voice, ducked ~4 dB while speaking | throughout |
| a single pad (root + fifth) | — | from the quiet beat to the dawn line |
| warm swell: pads brighter and +2 dB, the celesta every chord | — | under the dawn line to the end |
| real-time clock tick every second −33 dB; a firm tock on each minute step −27 dB; a dry double tick on the last line −17 dB | — | throughout / steps / the final word |
| holographic chime per morph −24 dB · soft taps on REVIEWED stamps and tally marks · a big stamp tap · a pluck on ≤ 3 punchlines · shimmer on the tag · whooshes on cuts −40 dB · end-card bell (F5 + C6) | — | cues |
Mix: two-pass loudnorm to −14 LUFS / −1.5 dBTP; measure the mp4 itself.

## 10. Retention devices
- Frame 0 is the girl mid-hook with the category chip and the clock: the situation and the setting in one image.
- His first reply is a joke built on a visual (the log), and the name tag teaches who he is without a line of setup.
- A new picture every 2–6 s: the orb morphs carry the jokes' second beat (bubbles → stamps, notepad, tally).
- One quiet beat, the only silence in the film, right before the honest line; the turn sits at ~63 %.
- The callback ("You have said that four times") and a deadpan time-check instead of "goodnight".
- The clock is the loop: the last frame is the clock at 2:47, the first frame is "It's 2:30 AM".
- The end card asks a personal, answerable question ("What time did you actually fall asleep last night?").

## 11. Do / don't
- Do: write from the bible; let her challenge him and own the honest moment; keep his answers unexpected; key every act
  to a word; check her close-ups at every line and her blinks in the real mp4; keep captions off faces, the orb, the tag
  and morphs; measure loudness on the mp4.
- Don't: show anything in the hood but darkness and faint particles; add a third person or figure (no silhouettes in
  morphs, no crowds in bubbles); redraw the characters; open her mouth past ~13 screen px; make big hood or hand moves
  (they stretch the robe); put medical, legal or financial claims in the dialogue; post anything.

## 12. Code recipe
```bash
SK=~/.claude/skills/explainer-zeythar-conversations
# 1) a new episode project (template + plate); optionally start from a ready episode. The series voice anchors (.wav)
#    are not included in this repository: after `bash make_episode.sh script`, run tools/voice_qwen.py --skip-lines once
#    (Qwen venv) for anchor candidates; the pick step keeps the most typical one as vo/anchors/<who>_anchor.wav.
bash $SK/assets/tools/new_episode.sh "samples/zeythar-<topic>" $SK/assets/episodes/the-degree.json
cd "samples/zeythar-<topic>"
# 2) write or edit episode.json (EPISODE_GUIDE.md)
# 3) everything, or one step at a time (voice and render go through the shared render lock)
bash make_episode.sh              # = script voice pick join align timeline score render qa
SEEDS=1,2,3 bash make_episode.sh voice
bash make_episode.sh timeline     # any single step, e.g. after editing a shot preset
```
- **Steps** (`tools/`):
  - `episode.py` episode.json → `vo/script.json` (ids, gaps, default shot grammar, tag line, accents, clock, cover).
  - `voice_qwen.py` Qwen3-TTS 1.7B VoiceDesign (`venvs/qwen`, `HF_HOME=tts-bench\hf`, 8 threads);
    instruct = the character description + the line's delivery; reads `say` when given; `alt_say` → seeds 11, 12.
    RTF 4.6–8.5 here (episode 1: 71 clips in 28 min, then 12 more deadpan takes in 5.5 min).
  - `pick_takes.py` (`venvs/chatterbox`): faster-whisper `small.en` must hear every word (the name, times, years, "a.m.",
    "good night" and a laugh's "ha" are normalised; the name is matched fuzzily: Whisper writes Zathar, Zethar,
    Saethar); among passing takes the highest VoiceEncoder cosine to `vo/anchors/<who>_anchor.wav`; **deadpan lines:
    the flattest read** (smallest 10–90 % pitch range) within 0.07 cosine. New episodes keep the series anchors when
    you have them (the anchor .wav files are not included in this repository).
  - `join_vo.py` (trim, pause cap 0.32 s or the line's `max_pause`, tempo 1.0, levelling, gaps) → `vo/audio/vo.wav`;
    `align_vo.py` (faster-whisper `small` on each line's clip on its own) → `vo/data/vo.json`.
  - `timeline.py` (shot presets `P`, captions, chip, tag, morphs, clock steps, envelopes + pulses, acting events,
    grade events, beats, end card) → `assets/lib/film-data.js`, `compositions/world.html`, `index.html`,
    `out/<name>.srt`, `score/data/cues.json`; then `layout_check.py`.
  - `score.py` → `score/audio/final.wav` (−14 LUFS) + `levels.json`; render: `render_locked.sh … delivery` (243 s for
    81 s), then x264 CRF 20 → `out/<name>.mp4` (~67 MB).
  - QA: `analyze_video.py`, `qa_sheets.py all` (2 fps sweeps, her face at every line, every blink, the hood, YAVG),
    `whisper_check.py` (speech span, no VAD), `layout_check.py`, `make_cover.py` (quiet two-shot + the hook line),
    ebur128 on the mp4.
- **Renderer** (`assets/lib/`): `zeythar-gl.js` (bg pass: plate, sky/rings/ledge, clock hands; particles; character
  pass: warps, lids, mouth, rune glow, ledge; hologram composite; 3-level bloom; grade), `zeythar-holo.js` (orb, morph
  library, name tag), `zeythar-overlay.js` (captions, chip, end card), `zeythar-film.js` (per-frame state).
- **Re-cutting the plate** (new key art of these characters): `tools/sr_upscale.py <weights>` then
  `tools/plate_build.py`; edit the polygons, sure-background strips, region polygons, eye polylines, mouth curve,
  orb/tag/hand boxes (measure on grid crops of the SR 2×: `scratch/grid.py`, `scratch/overlay.py` in the sample),
  then check `plate/masks_preview.jpg`, a closed-eye crop and a blink snapshot before anything else.
- **Gotchas met on episode 1**:
  - Tiling a donor patch to texture the orb hole made kaleidoscope diamonds of its spokes: synthesize stars instead.
  - A neighbourhood skin fill made the far eyelid pale (it pulled in the nose-bridge highlight): exclude V > 236 and
    tone the far lid warm-dark toward its outer corner. Extruding the lid skin from above the lashes went muddy.
  - The grain hash with `frame × 17` lost float precision after a few hundred frames and drew vertical stripes across
    the faces: use `mod(frame, 59)`.
  - Bloom smeared the holographic text (the log's times read wrong): draw the letters again crisp after the grade and
    put dark glass behind text panels.
  - The name tag sat on the frame edge in the wides: the wide is centred at x 680, z 0.82–0.85, and the hood push
    starts at x 522 so no sliver of the tag shows.
  - Whisper on the whole track drifted a whole line late near the end: align each line's clip on its own.
  - Whisper writes the name many ways and splits "a.m." and "good night": normalise before comparing.
  - `HF_HUB_OFFLINE=1` breaks Qwen's processor load; leave it unset (the weights are cached).
  - The first version drew the hands crisp and bright over a defocused dial: they read as foreground objects (a staff
    in his palm, a pointer at her face, a bar through the notepad). Defocus + dim + fade inside the orb/morph box fixed it.
  - The painted hand points at XII from (679, 395); at 2:47 the minute hand is mostly behind his hood, so the close-up
    shows the hub, a short minute stub and the hour hand near 3 — the caption carries the exact time.
  - The AAC encode adds 0.2–0.5 dB of true peak: the loudnorm target is now −1.8 dBTP (episode 1 was mixed at −1.5
    and measured −1.3 on the mp4; the template test at −1.5 measured −1.0).
- **Verified template run** (2026-11-02): the bible's "The Unanswered Message" (`assets/episodes/`, also the
  template's example `episode.json`) went through `new_episode.sh` and every step of `make_episode.sh` with no edits,
  2 seeds per line: 22.9 s (the bible's sample is 38 words, shorter than the 30–60 s band; nothing was padded),
  6 shots, 2 morphs (phone, heart), the tag on his first line, clock 11:58 → 12:00; all 12 takes passed `small.en`;
  Whisper on the mix 100 % (38/38); layout 0 violations; YAVG 0 dips; −14.2 LUFS, −1.0 dBTP on the mp4, voice 20.6 dB over the bed; Zeythar cosine 0.70–0.81 (with 2 seeds the deadpan picker has little to choose from: use `SEEDS=1,2,3` for deadpan-heavy scripts); voice 325 s
  (RTF 6–14 while other work ran), render 74 s. Two template fixes came out of it and are in: the cover picker fell
  back to frame 0 when every wide moment had a caption (it now takes the caption gap just before the end card), and
  the true-peak margin above. The test project itself is not included.

## 13. QA gates (fix or explain each miss)
- Length in the chosen band; first word ≤ 0.4 s; frame 0 = the girl, the chip and the clock at the start time.
- The turn at 55–70 % (standard); the last line in the final 8 s before the end card.
- −14 ±1 LUFS, TP ≤ −1 dBTP, voice ≥ 10 dB over the bed (`score/data/levels.json`; ebur128 on the mp4).
- Whisper: every word (`out/qa/whisper.json`); every picked take passed `small.en`.
- Pictures: the 2 fps sweeps; her face at every line she speaks (`faces_lines.jpg`) and at every blink
  (`faces_blinks.jpg`); the hood opening faceless (`hood.jpg`); no warp tearing at the hand under her chin or in her
  hair; `layout_check.py` 0 violations; YAVG 0 unplanned dips; the clock at the start and end times; only two
  characters.
- Files: `WRITING_BIBLE.md` · `EPISODE_GUIDE.md` · `assets/episodes/` (four ready episodes) · `assets/plate/` ·
  `assets/voices/` (descriptions, episode 1's picks; the anchor .wav files are not included) · `assets/template/`
  (runnable, any length) · `assets/tools/new_episode.sh` · `assets/sample/` (episode 1's full source, data, score cues
  and levels, the final mix; the picked voice-line .wav files, SRT, cover and QA sheets are not included; `SAMPLE.md`
  there has the gates and what reads well or poorly).

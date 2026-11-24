# The 2:30 AM Committee · how it was built, the gates, what reads well and what is weaker

Episode 1 of the user's series **Conversations Beyond Time** (Zeythar, the Sage AI, and the girl). Brief:
`explainer-styles/BUILD_BRIEF_ZEYTHAR.md`; script: `SCRIPT.md` (used as written); bible: `assets/ref/SERIES_BIBLE.md`.
Film `out/zeythar-two-thirty.mp4` (1080×1920, 30 fps, 81.3 s, H.264 CRF 20, 67 MB) with `out/zeythar-two-thirty.srt`,
`out/cover.jpg`, `out/qa/`; post copy `POST.md`. The skill made from it:
`~/.claude/skills/explainer-zeythar-conversations/`. Pipeline copied from `samples/guardian-ten-years/` (left untouched)
and adapted from the countdown format to dialogue.

## What was built
1. **Plate** (`tools/plate_build.py` → `plate/`), re-measured for the new key art on grid crops of the Real-ESRGAN 2×
   (`assets/ref/keyart_sr2x.png`, 101 s on the CPU). GrabCut per character from hand polygons plus sure-background strips
   (the lit dial between them, the clock frame beyond her hair, the sky over her crown and left of her fingers); the
   name tag, the orb and the painted clock hand inpainted (Telea + procedural stars matched to a clean patch of the
   dial); her closed-lid texture from the surrounding skin (nose highlight excluded); rune-line + medallion mask; three
   region maps (her head without the hand, back hair, torso, eye openings; jaw with the hand cut out, face skin,
   hand + forearm; his hood, open hand, low hand, torso). Landmarks: eye polylines, irises, mouth curve, brows, pivots
   (her head tilts about the chin on her hand, so the hand never stretches), hood opening, orb, tag box, clock centre
   (679, 395).
2. **Renderer** (`assets/lib/zeythar-gl.js`, `zeythar-holo.js`, `zeythar-overlay.js`, `zeythar-film.js`), WebGL2 in a
   HyperFrames composition: sky/rings/ledge for the wide layout, code clock hands (minute steps with an overshoot),
   liquify warps, blinks, gaze, brows, smile, laugh, lip-sync with a mouth interior, rune pulses, the hologram layer
   (orb + six morphs + the name tag, composited before bloom; text redrawn crisp after the grade), bloom, grade
   (warm soften on the turn, dawn tint), captions coloured by speaker, chip and end card.
3. **Voices**: Qwen3-TTS 1.7B VoiceDesign with the brief's two descriptions + each line's delivery; 3 anchor seeds per
   character, 3 seeds per line, 2 fallback reads for "Rude.", then 3 more seeds for four deadpan lines with a flatter
   instruct (83 clips; RTF 4.6–8.5). `tools/pick_takes.py`: every take must pass faster-whisper `small.en` (the name,
   times, years, "a.m." and a laugh's "ha" normalised; 74 of the 77 line takes passed); anchor = the candidate most typical of all
   the takes (Z seed 1, mean cosine 0.796; L seed 2, 0.717); per line the highest VoiceEncoder cosine, and for
   **deadpan lines the flattest read** (10–90 % pitch range) within 0.07 of it. Picks: l01 3 · l02 3 · l03 2 · l04 1 ·
   l05 3 · l06 6 · l07 1 · l08 1 · l09 2 · l10 1 · l11 3 · l12 2 · l13 2 · l14 1 · l15 2 · l16 1 · l17 1 · l18 1 · l19 1 ·
   l20 3 · l21 1. Cosine to the anchor: Zeythar 0.74–0.87, the girl 0.58–0.84 (lowest: "…Oh." 0.58, "The what?" 0.65,
   "…Rude." 0.69). Deadpan pitch ranges: l02 6.2, l06 3.8, l12 6.6, l19 5.9, l21 8.7 semitones.
4. **Timing**: `join_vo.py` (trim, pause cap 0.32 s, 0.6 s on line 12 for the beat before "Your species", tempo 1.0 for
   both, levelling to −17 dB, speaker-change gaps 0.26 s, the 0.8 s beat before line 14, 0.75 s pause before line 15,
   0.5 s beat before line 18) → 81.3 s with no speed-up; `align_vo.py` (faster-whisper `small` per line clip, 177/178
   script words matched); `timeline.py` (23 shots, 85 captions, 6 morphs, 17 minute steps, 35 blinks + 1 slow blink).
5. **Sound** (`tools/score.py`): Zeythar warm hall + a faint shimmer far down; the girl dry with a small room; F-lydian
   pads, a sub pulse on the bar and a sparse celesta; a single pad from the quiet beat to the dawn line, then a warm
   swell; a real-time tick, firmer ticks on the minute steps, a dry final tick on "2:47"; chimes per morph, taps for the
   stamps and tally marks, plucks on "mandatory", "declined" and "times"; the end-card bell; two-pass loudnorm.

## Gates (measured on the final mp4)
| gate | target | measured | status |
|---|---|---|---|
| length | 60–90 s (aim 70–85) | 81.3 s | pass |
| first word · frame 0 | ≤ 0.4 s · girl + chip + 2:30 clock | "Zeythar" at 0.02 s · frame 0 = GIRL_OPEN: her, the chip and series label, the clock (`out/qa/frame0.png`). Since the hands fix the orb's box hides the hands in frame 0; the caption "IT'S 2:30 AM." gives the time | pass for girl + chip; the 2:30 hands no longer show (see the hands fix) |
| the turn | 55–70 % | line 14 at 51.15 s = 62.9 % | pass |
| last line | final 8 s before the end card | "It is 2:47." at 75.88 s, end card 78.05 s (2.2 s) | pass |
| loudness | −14 ±1 LUFS | −14.1 LUFS (ebur128 on the mp4) | pass |
| true peak | ≤ −1 dBTP | −1.3 dBTP (mp4) · −1.5 (final.wav) | pass |
| voice over bed | ≥ 10 dB | 21.4 dB while speaking (stems, after the limiter) | pass |
| Whisper | every line right | 177/178 words with `small` on the final mix (speech span, no VAD); the one difference is line 4's interjection "Ah." heard as "Oh." (`small.en` heard "Ah" on the picked take). Every picked take passed `small.en`. | pass with that note |
| shots | ~18–24 | 23 shots, 22 cuts (16.2 / min, median 3.4 s; analyzer agrees) | pass |
| contact sheets | look at all of it | `out/qa/sweep_2fps_1.jpg`, `_2.jpg` (163 frames) | done |
| her face | every line she speaks + blinks | `faces_lines.jpg` (11 lines × 4–6 frames, 58 tiles), `faces_blinks.jpg` (23 blinks × 4 phases) | see below |
| captions vs face/orb/tag/morph | none | 0 violations in 2439 frames (`out/qa/layout.json`) | pass |
| warp tearing · safe areas | none · top 220 / bottom 400 / 40 px sides | hand under her chin and hair clean across tilts, the chin lift and the laugh; captions 1377–1463, chip 235–340, end card 240–480 + 1460, tag inside 40 px in every shot that shows it | pass |
| faceless · two characters | — | hood opening dark in every check (`out/qa/hood.jpg`); morphs abstract | pass |
| clock | 2:30 at the start, 2:47 at the end | the time logic is unchanged (2:30 → 2:47, the last step on "2:47"); the hands now show only outside the orb's box, which in practice means the CLOCK_CU ending, where 2:47 reads as before (sharp) | 2:47 pass; 2:30 not visible in frame 0 |
| brightness | no YAVG dips | 0 flagged (min 67.4, mean 82.8, max 99.3) | pass |

## What reads well
- **The characters are the key art.** At 2.2–2.3× her close-ups hold up; the warps read as life (breathing, a head tilt
  that pivots at the chin so the hand under it never moves, hair sway, his hand drift).
- **Her listening and reacting** read: brow raises, the knit on "The what?", one brow up on "That's it?", the chin
  lift on "Okay, wise one", a squint and shoulder bobs on the laugh, eyes dropping on the honest line, the widen on
  "…Oh.", smiles; micro saccades keep the eyes alive.
- **Blinks** close column by column with a tapered lash line; the near eye's closed lid looks like a lid.
- **The orb carries the jokes**: the log ("WED 2:30" in amber) lands "I keep records"; the bubbles orbiting between
  them with REVIEWED stamps and a final big stamp make the committee visible; the notepad + pen + 10:00 timer, the
  sun-and-moon arc and the IIII tally all read on a phone. The orb glows and spins faster with his voice.
- **The name tag** forms like a hologram on his first line and sits exactly where the painted one was.
- **Pacing**: a cut on every speaker change, the quiet wide before the turn is the only silence, the push-in on her
  honest line and the hood push on "Your species declined" are the two deliberate moves, and the end card loops back
  to the opening.
- **Deadpan**: picking the flattest read made line 6 ("…Attendance is mandatory.") genuinely flat (3.8 semitones) and
  lines 2, 12 and 19 dry (5.9–6.6); the hall reverb keeps him resonant without sounding robotic.

## What is weaker (honest)
- **Lip-sync is jaw-and-gap, not visemes.** The lower lip drops up to ~13 screen px in a close-up with a dark interior
  and a faint teeth band; it reads clearly as talking and follows syllables, but the mouth shape never changes (no
  "oo" or "ee"), the upper lip barely moves, and at its widest the interior is a flat dark slit. Bigger openings looked
  uncanny on the painted lips, so it stays here.
- **The far eyelid** (the eye by her hair) is a filled patch: at blink speed it passes, on a paused closed frame it is a
  little lighter and smoother than the shadowed skin around it.
- **Expressions are small by design**: brows move 2–3 px, the smile lifts the corners ~2 px; on the phone the smile
  and the brow knit read, the eye roll ("replaying") is subtle (the iris moves ~2 px). There is no new pose or angle:
  every shot is the same painting.
- **The laugh** is a short "Hah" in the picked take (the VoiceDesign "(laughs)" read worked on one of three seeds); the
  acting adds the bobs and squint, but it is a chuckle, not a laugh.
- **Voice consistency**: Zeythar is consistent (0.74–0.87); the girl's one-word lines ("…Oh.", "The what?") drift from
  her anchor (0.58–0.65) and line 18 is bright (pitch range 15 st). Line 21 "It is 2:47." is the least flat of the
  deadpan lines (8.7 st): dry, but with a slight lift.
- **The clock at 2:47**: the minute hand points left (282°) and is mostly behind his hood, so the close-up shows the hub,
  a short minute stub and the hour hand near 3; it reads as "quarter to three", and the caption gives the exact time.
- **The time-lapse is mostly invisible now**: after the hands fix, the orb's box hides the hands wherever the orb is
  in place, so the 2:30 → 2:47 progress is heard (ticks, minute-step tocks) and seen only at the end, not in frame 0
  or the wides.
- **The wide's lower third** is a code-drawn dark ledge over a dim void: correct and calm, but empty compared with the
  painted plate (the cover shows it most).
- **Gears do not rotate**: the background gears are partly occluded and touch the frame bars, so a disc rotation would
  have dragged the frame with them; skipped as the brief allows.

## Rebuild
```bash
cd "samples/zeythar-two-thirty"
export HF_HOME="tts-bench\\hf" TORCH_THREADS=8
python -I tools/episode.py episode.json voices.json
bash ../../tools/with_render_lock.sh "tts-bench/venvs/qwen/Scripts/python.exe" -I tools/voice_qwen.py --seeds 1,2,3   # resumes
"tts-bench/venvs/chatterbox/Scripts/python.exe" -I tools/pick_takes.py
PY="$HOME/.generative-music-video/venv/Scripts/python.exe"
"$PY" -I tools/join_vo.py && python -I tools/align_vo.py && "$PY" -I tools/timeline.py && python -I tools/layout_check.py
"$PY" -I tools/score.py && "ffmpeg-bin/node_modules/ffmpeg-static/ffmpeg.exe" -y -i score/audio/final.wav -c:a aac -b:a 256k assets/audio/final.m4a
bash ../../tools/render_locked.sh "$PWD" out/zeythar-two-thirty.master.mp4 delivery     # 243-259 s
# x264 CRF 20 -> out/zeythar-two-thirty.mp4; QA: qa_sheets.py all, whisper_check.py, layout_check.py, make_cover.py, ebur128
```

## Iterations
- Plate 1: background chunks in both cut-outs (dial left of her crown, frame panels right of her hair, a spike by his
  hood peak, dial strip by his hood edge) → tighter outlines + sure-background strips. The orb fill showed kaleidoscope
  diamonds (mirror-tiled donor spokes) → procedural stars.
- Snapshot 1: the name tag text overflowed the box; the log's times smeared by bloom; hands busy under the orb → text
  fitted to the box, crisp letters after the grade + dark glass, hands washed out near the orb core.
- Faces 1: mouth openings tiny with a grey "teeth" line; vertical stripes over the faces (grain hash precision) →
  jaw on the lower lip with a sharp lip-line mask, `mod(frame, 59)` grain. Blinks 1–4: the far lid was a pale disc →
  nose highlight excluded from the skin fill, a tighter far-lid region, warm-dark tone toward its outer corner (a lid
  extruded from the skin above the lashes went muddy and was dropped).
- Layout: the tag sat on the frame edge in the wides and as a sliver at the start of the hood push → wides re-centred
  (x 680, z 0.82–0.85), the push starts at x 522. A caption carried into the quiet beat → capped at the beat's cut.
- Voice: four deadpan lines re-voiced with "flat monotone" in the instruct; the picker now prefers the flattest take.
  Whisper on the whole track drifted a line late near the end → per-line alignment.
- Render 2: mouth opening up to 5.8 px source with a warmer interior and a soft teeth band.
- Hands fix (render 3, final; the coordinator's review): the code hands were crisp and bright over the defocused dial
  and read as foreground objects (a staff in his palm at 7.2 s, a crisp "T" by the orb at 0.5 s, a pointer at her face
  at 53 s and 61.5 s, a bar through the notepad at 35.5 s). Now they take the dial's defocus (edges 4.2 + 1.2 × bgLod
  world px) and 30 % less light, and fade to ~4 % inside the orb's or active morph's box + 40 screen px; CLOCK_CU keeps
  them sharp. Consequence: the orb sits in front of the clock's hub, so its box hides the hub and the whole hour hand
  in every shot where the orb is in place, including frame 0; the hands effectively appear only in the 2:47 close-up.
  The render-2 film is kept in `scratch/v1/`, with before/after frames.

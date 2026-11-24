# One Year Away · SAMPLE (explainer-scifi-whatif)

**"One Year Away"** — a 16:9 (1920×1080) sci-fi what-if about time dilation, 176.3 s.
Skill: `~/.claude/skills/explainer-scifi-whatif\` · source reel: @explanators `DffMkrzTg5q` (301.8 s).
Deliverables: `out/scifi-oneyear.mp4`, `out/scifi-oneyear_nomusic.mp4`, `out/scifi-oneyear.srt`, `out/cover.jpg`,
`out/qa/`, `FACTS.md`.

## Build
- Script: 44 lines, 448 words, Kokoro blend `am_onyx,am_michael` at 1.08 (`vo/script.json`); `tools/build.py`
  (END_CARD=5.3) writes `assets/lib/film-vo.js`, the SRT and the index duration.
- Film: one Canvas 2D composition: `assets/lib/scifi-kit.js` (grounds, stars, HUD box, people, OTTO, ships, planets,
  cards, tags, bubbles, the child's drawing) and `assets/lib/oneyear-film.js` (22 scenes, cuts and 0.35–0.7 s dissolves,
  the HUD per act). Fonts: Poppins, JetBrains Mono, Caveat (OFL) from `assets/fonts/`.
- Sound: `tools/sound_design.py` (original D-minor ambient score + SFX), two mixes at the same gain.
- QA: `tools/qa.py`, `tools/whisper_check.py` (+ `vo/whisper_alt.json` for numbers Whisper writes as digits),
  `tools/cut_est.py` (predicts the analyzer's cuts from snapshots).

## Renders
- **Render 1** (483 s for 5,289 frames, 2 workers, iGPU): duration, WPM, loudness, peaks, voice level, stream lengths,
  frame counts, dips and Whisper passed (after giving Whisper the digit forms of the numbers); analyzer cuts 0.68/min and
  scene changes 0.34/min failed badly: every scene sat on the same night-navy palette, so neither detector saw the cuts.
- **Between renders:** the source's own device added at act changes: the contract as a full-screen paper insert, the
  physics on a pale textbook page, Earth's half of the "1 vs 70" card in teal, the child's drawing full-frame, bright
  message tiles, the update log as a printout, the staff ID cut in, light gate doors and a brighter dusk; the money
  counter rolls from the first word; the play icons moved off the faces. `tools/cut_est.py` predicted 10–11 cuts.
- **Render 2** (430 s): delivered. All gates pass except scene changes, 2.72/min (8 histogram events) against 3.50–5.24.
  Cuts now pass (3.06/min, 9 cuts). **Explained miss:** the source's 22 scene events come from ~20 large bright or
  coloured inserts over 5 minutes (snow, green washes, Earth close-ups, a forest, pink cells, parchment, newspapers); the
  3-minute cut keeps 8 such inserts and the rest of the film on one palette, as the format's look requires.
  A third render (not run; needs the coordinator's OK) could add 2–3 events: a full-frame green Earth close-up on the
  turnaround, a brighter dusk hangar, and a white flash on the gate opening.

## Gates (delivered file)
| gate | value | target | result |
|---|---|---|---|
| size | 1920x1080 |  | PASS |
| fps | 30.0 |  | PASS |
| duration_s | 176.3 | 150.0-180.0 | PASS |
| cuts_per_min | 3.06 | 3.58 | PASS |
| scene_changes_per_min | 2.72 | 4.37 | FAIL |
| wpm_overall | 152.5 | 162.6 | PASS |
| first_word_s | 0.21 |  | PASS |
| loudness_lufs | -14.1 |  | PASS |
| true_peak_dbtp | -1.8 |  | PASS |
| nomusic_lufs | -14.1 |  | PASS |
| nomusic_true_peak_dbtp | -1.8 |  | PASS |
| voice_over_bed_db | 14.54 |  | PASS |
| streams_match | [176.3, 176.25, 176.3, 176.25] |  | PASS |
| frame_counts_equal | [5289, 5289] |  | PASS |
| unplanned_dips | 0 | listed in yavg.json; review each | PASS |
| whisper (small, every line) | mean recall 1.0 | every line ≥ 0.8 | PASS |
| voice over music alone | 16.0 dB | — | — |

## What reads well
- The cold open states the ending in numbers (1 YEAR / 70 YEARS) with OTTO humming at the window; the why is held to 80 %.
- The NOW HIRING card, the contract's fine print turning into "EARTH TIME ≈ 70 YEARS", and the HUD that re-labels per act
  (EARTH · 2101 → FLASHBACK · 2031 → EARTH · 2066 → GATE OPENS IN) carry the format's grammar.
- Real physics told in clean cards (time dilation on a textbook page, GPS 38 µs/day and the drifting pin, the twins
  study, the Parker probe sliver vs the 99.99 % bar, γ ≈ 70.7, the Doppler "1 day of news in 6 months").
- The twist is planted three times (the lullaby, the drawing, the flower) and pays off on OTTO's screen and at the gate.

## What is weaker
- Flat-vector people are simpler than the source's; Mia's ageing is told by hair colour and props.
- Compressing 5 minutes into 3 drops the source's long "future world" tour; the middle is shorter and more diagrammatic.
- The gate scene is static apart from the doors and a short walk; a hug or a hand on the glass would land harder.
- The score is synthesized; it supports the voice but has no melodic theme beyond OTTO's six-note lullaby.
- The staff-ID scene (145–154 s) leaves the right half of the frame empty until the lines of code fly out.
- The outbound and turnaround diagrams (98–118 s) are long holds on small elements; they read on a TV, less on a phone.

## Deviations (and why)
- 176.3 s instead of ~300 s: the brief asks for ≤ 180 s so it posts as a reel.
- The source's closing self-promo card is replaced by a follow card.
- Paper inserts (the contract, the textbook page, the printout, the drawing) are brighter than the source's average:
  they are the source's own device (paper cards between dark scenes) and they make act changes register as cuts.

## Source → ours
| source | ours |
|---|---|
| 10 planned years, 1,000 actual; the person you loved stopped your wake-up | 1 year for you, 70 on Earth; the robot started talking like your sister |
| a white humanoid robot greets you in 3026 | OTTO, a hover robot with a screen face, at the docking gate |
| NOW HIRING · 2026, long sleep program, $2,000,000, SLEEP 10 YEARS | NOW HIRING · 2031, deep space courier, $5,000,000, FLY 1 YEAR + the fine print |
| frozen frogs, 0 humans brought back | relativity, GPS clocks, the twins study, the Parker probe, 99.99 % c, γ ≈ 70.7 |
| the future world, the digital dark age | the outbound silence (1 day of news) and the flood of messages on the way home |
| the record: court case, the list, the cover-up, she saved you | the record: the update log, 4,112 patches, one author: Mia |
| she froze herself beside you; she wakes in 7 minutes | she is 78 at the gate, holding a flower; the countdown opens the doors |
| a question about your first words to her | would you take the job? |

# Rewind · SAMPLE (explainer-ps1-whatif)

**"Rewind"** — what if you could rewind ten seconds? A 9:16 PS1-era low-poly what-if on tape, 121.6 s.
Skill: `~/.claude/skills/explainer-ps1-whatif\` · source reel: @yastor200 `DfDOGC3BP0k` (119.1 s).
Deliverables: `out/ps1-rewind.mp4`, `out/ps1-rewind_nomusic.mp4`, `out/ps1-rewind.srt`, `out/cover.jpg`, `out/qa/`.

## Build
- Script: 46 lines, 248 words, Kokoro `am_michael` 1.03 (`vo/script.json` → `vo/data/vo.json`); `tools/build.py` writes
  `assets/lib/film-vo.js`, the SRT and the index duration.
- Film: three.js r170 + `assets/lib/ps1-kit.js` (the PS1 pipeline), `rewind-sets.js` (city, apartment, office, restaurant,
  cafe, phone; 10 extras, the hero, her, wedding variants, an interviewer, a barista), `rewind-film.js` (50 shots),
  `rewind-hud-config.js` + `ps1-hud.js` (title, AGE/LIVED, REWIND/PLAY, TAKE/LOOP, captions, end card), `pixfont.js`.
- Sound: `tools/sound_design.py` (original bed + SFX), two mixes at the same gain.
- QA: `tools/qa.py` (encode, sweeps, analyzer gates), `tools/whisper_check.py`, `tools/cut_est.py` (predicts the
  analyzer's cuts from snapshots before rendering).

## Renders
- **Render 1** (275 s for 3,649 frames, 2 workers, iGPU): every gate passed except analyzer cuts/min, 12.83 (26 of 53 edit
  points detected): the evening/night apartment third (80–113 s) was dark and low-contrast, so its cuts and the flicker
  montage did not register; 3 YAVG flags in the window time-lapse (93.8–94.1 s).
- **Between renders:** brighter night/evening interiors (exposure 1.22, ambient ×1.4), her close-ups warm and his cold
  blue in the leaving scene, the office rewind moved to a close-up, the pillow shot re-framed from above the chin, a gentler
  time-lapse (< 2 Hz, small exposure swing), grain on the low-res grid (file 246 → 196 MB). `tools/cut_est.py` on snapshots
  predicted 40 detections; the encoded file gave 30 (the estimator runs ~0.05 high near the 0.33 threshold).
- **Render 2** (223 s): delivered. All gates pass except analyzer cuts/min, 14.8 (30 detected) against 16.9–25.4.
  **Explained miss:** the edit has 53 hard cuts (26.1/min, more than the source's 42 detected); the 23 undetected ones are
  same-angle rewinds by design (the press is not a cut) and dark night cuts below the detector's ~33/255 mean-difference
  threshold. Scene changes, which the same analyzer counts from colour histograms, pass (18.25/min vs 17.64).
  A third render (not run; needs the coordinator's OK) could lift ~6 more night cuts over the threshold by alternating
  wide/close framing with stronger light changes in 84–110 s.

## Gates (delivered file)
| gate | value | target | result |
|---|---|---|---|
| size | 1080x1920 |  | PASS |
| fps | 30.0 |  | PASS |
| duration_s | 121.63 | 101.2-136.9 | PASS |
| cuts_per_min | 14.8 | 21.16 | FAIL |
| scene_changes_per_min | 18.25 | 17.64 | PASS |
| wpm_overall | 120.4 | 133.0 | PASS |
| first_word_s | 0.18 |  | PASS |
| loudness_lufs | -14.2 |  | PASS |
| true_peak_dbtp | -1.6 |  | PASS |
| nomusic_lufs | -14.1 |  | PASS |
| nomusic_true_peak_dbtp | -1.9 |  | PASS |
| voice_over_bed_db | 14.93 |  | PASS |
| streams_match | [121.63333333333334, 121.6, 121.63333333333334, 121.6] |  | PASS |
| frame_counts_equal | [3649, 3649] |  | PASS |
| unplanned_dips | 0 | listed in yavg.json; review each | PASS |
| whisper (small, every line) | mean recall 1.0 | every line ≥ 0.8 | PASS |
| voice over music alone | 17.0 dB | — | — |

## What reads well
- The PS1 pipeline sells the era: 4× pixels, vertex wobble on camera moves, affine texture swim on the steps and floors,
  15-bit dither in the gradients, blob shadows, fog on the far skyline.
- The rewind is literal: the fall plays backwards up the steps with the tear, then the clean take plays forward;
  the same grammar carries the alarm, the joke, the free throws (shot, clank, rewind, again), the hello and the loop.
- The counters tell the story without words: TAKE 2 → 60 → 9 → 31 → 14 → 40, LOOP 9,999, LIVED 24 → 41 → 144.
- The callback: TAKE 14 (her laugh at the bus stop) returns on washed-out tape before the last line.
- The pixel font is original (no font file), crisp at every size, and matches the source's HUD grammar.

## What is weaker
- Characters are box-and-sphere people with 32×32 faces: readable, but less detailed than the source's skinned humans;
  close-ups read as toys (that is the PS1 look, but the emotional beats lean on the narration).
- Hands are blocks and there is no lip sync beyond a talk/neutral swap.
- The source's "big use" is a travel montage of famous places; ours is a montage of small fixes, so the middle third has
  fewer postcard images.
- The night apartment third is darker than the source's last third, and it is why the analyzer misses cuts there.
- The face-on-the-pillow shot (15–19 s) still reads as an egg seen from above; a side profile on the pillow would be clearer.
- The end-card aerial is mostly one pink roof; the source's aerial shows a street crossing with cars and people.
- In three close-ups (her laugh at 53 s and 88 s, her CU at 103 s) the caption sits just under the chin: inside the
  safe band and off the mouth, but close.
- The bed is a simple synthesized pad; it supports but does not lift the twist the way a composed score would.

## Deviations (and why)
- Captions sit with their block bottom at y 1296 (the source centres them at y 1338) to stay inside the 168–1300 safe band.
- The HUD starts at y 176 (source y 118) to clear the app's top bar.
- No sponsor card (the brief).
- A real PS1 pipeline instead of the source's modern engine look (the brief asks for the PS1 look done properly).

## Source → ours
| source | ours |
|---|---|
| the stop-time title question, PAUSE at 1.0 s | "what if you could rewind 10 seconds?" title, the power word red → blue at 1.0 s, REWIND at 6.0 s |
| saving a stranger from a bus, she credits luck | tripping on library steps, a passer-by never looked up |
| alarm / insult reply / exam with DAY n | alarm (TAKE 60) / a joke (TAKE 9) / an interview / free throws (TAKE 31) |
| the walk around the world | typo, wrong turn, awkward word: "no mistakes, only takes" |
| bus girl → date → marriage → the kids question | bus-stop girl (take 14) → date (micro-rewinds) → wedding (40 versions of the vows) |
| body vs mind, LIVED → 200 → 1,200 | every rewind is lived again, LIVED 41; the best ten seconds looped for a hundred years, LIVED 144 |
| her laugh too loud, the flicker, "pause" | she leaves, 200 takes of the same words, "she never met take one" |
| the end-card question about pressing pause | Would you press REWIND? |

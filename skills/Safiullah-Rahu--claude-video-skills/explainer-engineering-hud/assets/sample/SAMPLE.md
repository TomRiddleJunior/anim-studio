# SAMPLE — "The sea gate that closes itself" (explainer-engineering-hud)

Source format: @app.engineering reel `DfYdn-mSWSg` (65.9 s, dark 3D engineering HUD explainer). Our story: Rotterdam's
Maeslantkering storm surge barrier closing automatically during Storm Pia, 21 Dec 2023. Kit #96.

## Build
- HyperFrames 0.8.210 project: `index.html` → `compositions/world.html` (three.js 0.186: four sets — barrier diorama,
  map, cross-section, trigger gauge — toggled per shot; bloom; DOM tags and brackets from projected points) +
  `compositions/hud.html` (HUD panel, location pill, photo inset, agency card, time panel, barrier grid, counters,
  karaoke captions). Story state in `assets/lib/film.js` (status, gap readout, arm angle, gate height, dock water,
  lane) as pure functions of t.
- Voice: Kokoro `am_michael`, speed 1.12 (`vo/script.json`); timing and captions: `tools/build.py` → `assets/lib/timing.js`,
  `out/enghud-maeslant.srt`.
- Map: `tools/make_geo.py <natural-earth-dir>` (Natural Earth 1:10m, public domain) → `assets/lib/geo.js`.
- Cameras: fitted with `tools/camfit.py` (specs in `tools/cams/`), drifted with orbit + zoom per shot.
- Sound: `tools/sound_design.py` (original ~117 BPM bed, SFX, ducking, −14 LUFS, −2 dBTP ceiling) →
  `assets/audio/final.m4a` + `nomusic.m4a`.
- Delivery and QA: `tools/qa.py encode|qa` (CRF 19 + AAC, no-music remux, cover, 2 fps sweeps, black/flash check,
  faster-whisper `small`, gates) + the engine analyzer.

## Gates
Measured on the delivery file (`out/qa/gates.json`, `out/qa/metrics.json`).

| gate | value | result |
|---|---|---|
| size | 1080x1920 | PASS |
| fps | 30.0 | PASS |
| duration_s (src 65.9, +-15%) | 69.53 | PASS |
| streams_match (video s, audio s; both files) | [69.533, 69.5, 69.533, 69.5] | PASS |
| video_frames equal | [2086, 2086] | PASS |
| wpm (src 156.6, +-20%) | 150.2 | PASS |
| analyzer cuts/min (src 0.00) | 2.59 | info |
| analyzer scene changes/min (src 0.00) | 6.04 | info |
| hand-counted cuts/min (src 10.93) | 10.36 | PASS |
| loudness_lufs | -14.1 | PASS |
| true_peak_dbtp | -1.8 | PASS |
| nomusic_true_peak_dbtp | -1.9 | PASS |
| voice_over_bed_db | 11.47 | PASS |
| first_word_s | 0.18 | PASS |
| whisper_full_all_lines | 0.962 | PASS |
| whisper_nomusic_all_lines | 0.968 | PASS |
| unplanned_dark_or_flash_frames | [] | PASS |
| brightness (src 0.173) | 0.202 | info |
| colourfulness (src 24.2) | 32.7 | info |
| motion_mean (src 2.61) | 2.49 | info |

## Renders
- Render 1 (master_r1, 2,086 frames, ~2.5 min at delivery quality, 2 workers): every gate passed, but the cross-section
  block sat behind the captions in the lower half, the +3.0 m NAP tag was cut at the left edge, the 360 m label sat
  under the bracket next to the caption, and the chevrons stayed on after the gap reached 0.
- Render 2 (master_r2, final): the section camera re-fitted with `tools/camfit.py` (block in the upper-middle), tag and
  bracket label moved, chevrons hidden once CLOSED. All gates pass. A third render is not needed for the gates; it
  would only buy polish (see below).

## What reads well
- The HUD carries the story: OPEN → CLOSING → CLOSED and the GAP readout counting 360 → 0 with the gates.
- Cyan/red/amber/green keep their meanings from the first frame to the last.
- The fitted cameras make the barrier read as a whole object in the 9:16 frame.

## What is weaker
- The cross-section block is small and seen from low (about 10°), so the tide/surge story is told mostly by the
  colour change and two small tags; the source's block is chunkier and its rings bolder.
- The ball-joint macro reads as a grey dome on a ring; it needs a socket housing and the truss chords meeting it.
- The dry-dock flooding is hard to see in the docks shot (the water rises under the gate but the dock floor is dark).
- The sink shot frames the closed gates small in the middle; a closer, lower camera would sell the moment better.
- Whisper writes "meters" for "metres", so two lines score 0.86–0.87 recall (still above the 0.85 line).
- Analyzer cuts 2.6/min and scene changes 6.0/min against the source's 0/0: the source's detector reads its single
  navy palette as one shot; by hand both have 13 shots (10.9 vs 10.4 cuts/min, −5 %).

## Deviations from the source (and why)
- Captions centred at y 1236 instead of ~1472 (the brief's key-text line is ~1300).
- The operator appears as a plain-text card, never a logo (brief).
- A three-state status (OPEN / CLOSING / CLOSED) instead of two: the closing takes two hours, so a middle state is
  truer (a visible upgrade).
- The readout is tied to the real geometry (the gap is computed from the arm angle).
- 69.5 s vs 65.9 s (+5.5 %): the story needs one more beat (the dry docks) than the source's.

## Source → ours
| source | ours |
|---|---|
| POWER LIVE/CUT + SPEED ~270 km/h | BARRIER OPEN/CLOSING/CLOSED + GAP ~360 m |
| train on a viaduct, sensor on an islet, dotted arc | the north gate in its dock, the BOS node, dotted arc |
| map of the region, epicentre ring, photo inset of the train | Dutch coast map, Storm Pia rings, photo inset of the real barrier (CC BY-SA) |
| cut-away block, P-wave / S-wave | cut-away block, tide / surge |
| operator logo card | plain text card (RIJKSWATERSTAAT) |
| sensors on coast and track; the islet sensor felt it first | tide gauges → BOS; the +3.0 m NAP trigger blooms |
| power cut over ~170 km (bracket) | ships halted, CLOSING; 210 m gate bracket |
| brakes kick in (macro) | ball joint (macro) |
| ~10 s head-start panel | ~2 h closing panel |
| speed counts 270 → 100 | gap counts 360 → 0 |
| two dozen train icons | six storm-barrier tiles |
| 0 derailed / 0 hurt | 1.5M people behind it / 0 human commands needed |

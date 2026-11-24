# SAMPLE — The Rusted Lock (explainer-strike-counter)

A 14.0 s, 1080×1920, 30 fps seamless loop. A white stick figure cranks the key of a giant rusted padlock; TURNS counts
0 → 100 with smeared, speeding turns while the caption says nothing is happening; a scan line shows the inside (the rust
round the bolt cracked through, a heap of rust dust on the floor of the case); turn 101 snaps it open in gold light; then
a new locked padlock takes its place, the counter rolls back to 0 and the last frame is the first.

## Build
- HyperFrames 0.8.210, one canvas composition (`compositions/world.html`) drawing `assets/lib/strike-kit.js` (the format
  kit: figure with two-bone IK, counter with roll/pop/flash, caption cards, rays, glow, scan line, particles) and
  `assets/lib/film.js` (this reel: the padlock, its x-ray inside, the key crank, timings, the loop). Pure function of t.
- Fonts: JetBrains Mono 700 (counter; OFL), Inter variable (label and captions; OFL), both in `assets/fonts/` with
  their licences.
- Sound: `tools/score.py` (numpy only): sfx stem + music stem, two masters at -14 LUFS / -2 dBTP, `assets/audio/final.m4a`.
- Delivery: `tools/deliver.sh` (CRF 19 + remux of the same video with the no-music mix), `tools/qa.py` (analyzer,
  sweep, compare, YAVG, streams, loudness, loop seam), `tools/srt.py`, `tools/cover.py`.

## Renders
2 renders (2 workers, shared lock): render 1 35 s for 420 frames; render 2 in a 56 s locked job with delivery, QA and
the cover. Snapshots before render 1 covered every beat (3 rounds, ~10 s each); the fixes they drove: lock and figure
moved apart (the figure overlapped the case), a full-frame flash at 10.0 s replaced by a local glow (it read as a brown
flash frame), legs shortened and the standing poses raised (the figure crouched in every pose), an awkward hands-on-hips
pose replaced by an open stance looking up into the light, softer two-layer rays. Render 2 fixed what the render-1
sweep showed: the floor glow ended in a hard horizontal edge under the captions (now a clipped ellipse) and the
resting figure's head touched the key (it now steps back). A third render is not needed.

## Gates (out/qa/gates.json)
| gate | source | ours | pass |
|---|---|---|---|
| length ±15 % | 14.06 s | 14.00 s | yes |
| cuts/min ±20 % | 0 | 0 | yes |
| scene changes/min ±20 % | 0 | 0 | yes |
| WPM | no narration | no narration | n/a |
| first frame a still; first visual change ≤ 0.4 s | — | the figure at the lock, 0 TURNS; change at 0.03 s | yes |
| loudness full | -14.2 LUFS | -14.2 LUFS, TP -1.4 dBTP | yes |
| loudness no-music | — | -14.2 LUFS, TP -1.5 dBTP | yes |
| voice over bed | no voice | no voice | n/a |
| Whisper | no speech | no speech | n/a |
| captions in the safe area | y 1450 | y 1400-1460 (counter y 360-490) | yes |
| unplanned black/flash frames | — | 0 flags (YAVG min 27.0, mean 31.7) | yes |
| streams match, equal frame counts | — | 14.000/14.000 s, 420 = 420 frames (both files) | yes |
| loop seam (ours) | not a loop | last vs first frame mean diff 0.17/255; audio -41.5 dB at the end, -48.5 dB at the start | yes |

Look: brightness 0.079 (source 0.070), colourfulness 12.1 (9.6), motion 2.49 (1.69, our smear is denser), dark frames
100 % (100 %).

## What reads well
- The counter carries the story the way the source's does: the singular label at 1, the race, 100 glowing white, 101 gold.
- The x-ray beat: the heap of rust dust is a picture of "the work you couldn't see", which the source only implies.
- The release: the shackle jump, sparks, the light coming out of the hole and rays; the figure lit cream.
- The loop: nothing jumps at the seam; the restart says "next lock" without a word.

## What is weaker
- A crank is a less violent action than a hammer, so the race has less impact; the smear helps but the hammer's arcs
  read faster on a phone.
- The figure stands close to the lock and its arms cross the case during the crank; the silhouette is busier than the
  source's clean figure-left / object-right split.
- The x-ray inside (bolt, crust, cracks) is small at phone size; the heap and the glowing cracks carry it, the bolt
  itself does not read.

## Deviations
- A seamless loop (the source ends on the lit hold and jumps back to black).
- No creator logo top right (the source carries one).
- Captions at y 1400-1460 instead of 1450-1508 (the house safe band).
- Music: an original synthesized bed under the sound effects (the source's audio is its creator's own); the no-music
  file carries the sound effects only.

## Source → ours
| source | ours |
|---|---|
| white stick figure, hammer | the same figure build (front limbs white, back limbs grey, dark outline on the front arm), a key crank |
| a boulder | a giant laminated padlock with rust |
| STRIKES 0 → 100, singular at 1, race with smeared swings | TURNS 0 → 100, singular at 1, race with smeared turns (ghost bars + arms + arc) |
| scan line reveals a hidden crack | scan line reveals cracked rust round the bolt + a heap of rust dust |
| 101st strike splits it in gold light | 101st turn snaps the shackle open in gold light |
| four short caption cards (no visible progress / hidden progress / not the last one / all the ones before) | four new lines with the same four jobs |
| ends lit | ends by resetting to frame 0 (seamless loop) |

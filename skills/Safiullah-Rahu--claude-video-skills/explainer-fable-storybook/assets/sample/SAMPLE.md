# SAMPLE — The Fox at the Door (explainer-fable-storybook)

A 60.6 s, 1080×1920, **60 fps** narrated fable. A fox talks its way into a hen house one small request at a time (one
paw, one feather, one egg … the key); then "it's a fable", the frame becomes a photo card, and a navy stage shows the
real pattern — the **foot-in-the-door effect** — with the numbers of Freedman & Fraser's 1966 study (Experiment II:
76.0 % of 25 people first asked to show a tiny safe-driving sign later agreed to a huge lawn sign; 16.7 % of 24 asked
cold); the card returns and the reel ends on "which yes should the hens have refused?" over the opening shot.
Facts and sources: FACTS.md. Script and shot list: SCRIPT.md.

## Build
- Narration: Kokoro `bm_george`, speed 1.25 (the engine's `audio/tts.py`), 18 lines, 156 words.
- `tools/build.py --fps 60`: word times + karaoke caption groups (`assets/lib/vo-data.js`), `compositions/world.html`,
  `index.html` (`data-fps="60"`), `out/fable-fox-door.srt`.
- One canvas composition: `assets/lib/fb-kit.js` (the format kit: skies, hills, the hen house outside and inside,
  hen / fox / owl, label, stamp, DAY pill, tally, sign + scribble, bubbles, banner, photo card, navy stage, house icons,
  billboard, peg person, karaoke captions, grain, vignette) + `assets/lib/film.js` (this reel: the clock from word
  times, 18 beats, cameras, zoom-throughs, the photo-card turn and return, the lesson stage).
- Sound: `tools/score.py` (voice + an original 80 BPM F-major storybook bed + ~70 synthesized effects; ducking; two
  masters at -14 LUFS / -2 dBTP).
- Delivery/QA: `tools/deliver.sh` (FILM_FPS=60), `tools/qa.py`, `tools/whisper_check.py`, `tools/cover.py`.

## Renders
- Snapshots before render 1: 3 rounds (68 stills). Fixes they drove: the kit drew into the main canvas while a scene was
  meant to go into a buffer (added `K.setCtx`), the first caption invisible on frame 0, hens' faces under the captions in
  the door push-in (camera cy 900 → 975), a cluttered tally wall (6 groups a row), tiny window signs and ask boxes
  (bigger), the final coop view cropping the DAY pill.
- Render 1 (241 s, 3,638 frames): every gate passed. Fixes for render 2: the result grids popped in 0.6 s after the line
  began (an empty stage), hens a little small in the wide shots (×1.12), the DAY pill cropped during the habit push
  (camera cx).
- Render 2 (336 s with the lock shared): all gates pass again; the gates below are from render 2. A third render was
  not needed.

## Gates (out/qa/gates.json, out/qa/whisper.txt)
| gate | source | ours | pass |
|---|---|---|---|
| length ±15 % | 55.55 s | 60.63 s (+9 %) | yes |
| fps | 60 | 60 | yes |
| cuts/min ±20 % | 0 | 0 | yes |
| scene changes/min ±20 % | 8.64 | 8.91 (+3 %) | yes |
| WPM ±20 % | 160.9 | 150.4 (-7 %) | yes |
| first word / first visual change ≤ 0.4 s | — | 0.18 s / 0.017 s; frame 0 = label + fox + grey first caption | yes |
| loudness full | -14.1 LUFS | -14.2 LUFS, TP -1.9 dBTP | yes |
| loudness no-music | — | -14.2 LUFS, TP -1.9 dBTP | yes |
| voice over bed | ~14 dB | 14.6 dB over music + sfx (15.7 over music) | yes |
| Whisper hears every line | — | 18/18 (worst 0.83: "paw" heard as "poor", "So" dropped) | yes |
| captions in the safe area | ~1572-1644 | 1395-1468; labels at y 300; no caption over a face | yes |
| unplanned black/flash frames | — | 0 (night dips are planned and gradual) | yes |
| streams match, equal frame counts | — | video 60.634 / audio 60.620 s; 3,638 = 3,638 frames | yes |

Look: brightness 0.382 (0.329), colourfulness 34.2 (27.8), motion 4.47 (6.08), dark frames 1.6 % (26.8 %: our coop is
lantern-lit and the source's well is darker).

## What reads well
- The label-per-beat rhythm and the sign arc (bubble → sign → crossed out) carry the fable even muted.
- The tally wall going from 1 mark to 41 in one cut-free pull-out/push-in.
- The photo-card turn and return; the closing frame matches the opening one.
- The lesson's grids show the real group sizes and counts (19 of 25, 4 of 24) while the percentages count up.

## What is weaker
- The hens are small in the wide coop shots; the source's crowd fills more of the frame and its camera works closer.
- Motion is lower than the source's (4.4 vs 6.1): fewer character moves per beat, and the lesson stage is mostly pops.
- The British narrator says "paw" like "poor"; the on-screen bubble and caption carry the word.
- The fox's silhouette in the doorway is small; the threat is implied rather than staged.

## Deviations
- 60.6 s against 55.6 s (within the gate): the lesson needs the study's who/what/when/numbers.
- Captions sit at the house safe band (y 1395-1468) rather than the source's lower position.
- No creator watermark; an owl narrator instead of the source's character; a hen house instead of a well.
- Music: an original synthesized bed; the no-music file carries voice + effects.

## Source → ours
| source | ours |
|---|---|
| a snake falls into a well of mice | a fox walks up to a hen house |
| a reasonable-sounding rule in a bubble → a sign on the wall | "just one paw" → sign ONE PAW / ONLY |
| DAY 0-9-180 + tallies, a mouse taken per step | DAY 1-41 + tallies, a feather, an egg, then the key |
| crowd bubbles of self-reassurance | "It's only a little." × 3 |
| the sign scribbled out | the same, when the fox asks for the key |
| a banner praising the predator, in a beam | "THANK YOU, FOX!" in a beam |
| one by one in spotlights | the door wide, the fox in the doorway, "Yes." × 5 |
| A FABLE photo card → navy: an overline + a two-colour title naming the idea | the same: THE PATTERN / FOOT IN THE DOOR |
| pegs, dividers, a stamp, YOU + target | a street, tiny signs, a billboard + stamp, the study's grids and numbers, a peg with a YES badge, growing asks + target |
| the card returns, a question, the opening shot | the same |

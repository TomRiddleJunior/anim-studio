# SAMPLE — "The 1:12 Call" (riddle-hotel)

The first film built with the `explainer-riddle-cutaway` skill (batch 8, build agent A, 2026-11-06).
- **Source format:** @oddlinearchive `DfLF1TVgTXf`, the floor-20 lift-and-umbrella riddle (87.7 s).
- **Ours:** a different classic lateral-thinking riddle, "the man in the hotel who phones the next room and hangs up" (91.2 s).
  The answer is that 306 snores.

## Deliverables
- **`out/riddle-hotel.mp4`:** 1080×1920, 30 fps, x264 CRF 19, AAC. The full mix: voice, an original 100 BPM marimba bed and SFX.
- **`out/riddle-hotel_nomusic.mp4`:** the same video stream (stream-copied) with voice + SFX, including the countdown clicks.
- **`out/riddle-hotel.srt`:** every spoken word. **`out/cover.jpg`:** the cover.
- **`out/qa/`:** 5 sweep sheets (all 182 tiles looked at, plus a direct check of the last second), metrics, gates, yavg, compare.jpg, Whisper.

## Build
1. **Voice:** `vo/script.json` (22 lines, 230 words) → Kokoro `am_eric` at 1.12. There is a 10.6 s `gap` before "Time's up." so the countdown is a real 10 s.
2. **Build:** `tools/build.py` writes the word data, 23 paraphrase pills (`pills()`), the world host, the index, the SRT and `timing.json` (countdown start 39.42 s).
3. **Film:** `assets/lib/kit.js` (Canvas2D shot player + flat character kit: heads, people, beds, phones, waves) + `assets/lib/film.js`. The film file holds:
   - the hotel cutaway (5 floors, rooms 305/306, the lobby with its switchboard, stairs);
   - the exterior and the countdown card;
   - 25 shots, each anchored on a word.
4. **Sound:** `tools/sound_design.py` writes both mixes (−14 LUFS, TP −2).
5. **Render and deliver:** HyperFrames 0.8.210 delivery (about 2 min per render), then `tools/deliver.sh` and `tools/qa_all.sh`.

## Gates (final render, `out/qa/gates.json`)
| gate | target | result | |
|---|---|---|---|
| length | 87.7 s ±15 % | 91.2 s (+3.9 %) | pass |
| WPM | 163.4 ±20 % | 151.3 (−7.4 %) | pass |
| cuts / min | 14.36 ±20 % | 14.47 (+0.8 %) | pass |
| scene changes / min | 10.94 ±20 % | 9.87 (−9.8 %) | pass |
| first frame a still; first word ≤ 0.4 s | — | frame 1 = the cutaway, the counter "1", the man at the foot of the stairs; first word 0.21 s | pass |
| loudness full / no-music | −14 ±1 LUFS, TP ≤ −1 | −14.0 / −1.9 dBTP; −14.0 / −1.8 dBTP | pass |
| voice over bed | ≥ 10 dB | 21.0 dB (bed); 13.3 dB over bed + SFX | pass |
| Whisper hears every line | ≥ 0.85 per line | all 22 lines, mean 0.993 | pass |
| pills in the safe area; none over a face | top y 369, bottom y 1500 (78 %) | checked on all 182 tiles | pass |
| unplanned black / flash frames | 0 | 0. Two planned bright-to-dark hard cuts are marked in `tools/qa_config.json`: card → night building at 51.4 s, morning exterior → desk at 85.2 s | pass |
| stream lengths match | no `-shortest` | video 91.200 s / audio 91.195 s (both files) | pass |

**Whisper notes:** "tea" comes back as "tee", "snorer" as "snore", and "1:12" as "112". These are homophones or number formats; every line is heard.

**Other measured differences.**
- Motion 5.55 against 7.62. The source tracks its lift through 10–20 floors several times; our climbs cover 2 floors.
- Brightness 0.59 against 0.70. Ours is a night story: navy sky and dimmed rooms. The source is day and rain.
- Colourfulness 36.3 against 39.6.

## Renders
1. **Render 1:** scene changes 7.89/min (−28 %, a miss) and motion 4.60. All other gates passed.
2. **Render 2, final:**
   - a **night-vision recolour** of the x-ray reveal shots (a "color" blend in teal plus faint scan lines). It is a visible upgrade, and each reveal shot now changes the palette, so scene changes rose to 9.87/min;
   - more camera motion: a pan across floor 3 in the call shot, a tilt in "wide awake", pushes and pulls on the exteriors and a pan in the two-minute shot;
   - the two planned bright-to-dark cuts marked in the QA config.
3. **Before render 1** (snapshot pass): the structural column that cut the lobby clock in half was removed.

## What reads well
- **The cutaway** is legible at phone size: pastel rooms, a slate structure, the stair core with big floor numbers, and the counter pill rolling 1 → 3, then 1:11 → 1:12.
- **The clue is fair and visual.** Both beds sit against the shared wall, head to head, so the reveal shows the snore crossing the wall into 305. The countdown card's two panels (306 booked: 1 call; 306 empty: no call) hint without answering.
- **The countdown is real**: 10 → 0 in seconds, a click per second, "Time's up" on the narrator's line.
- **The reveal grammar maps cleanly.** The source's lift cam becomes our x-ray / night-vision view, then the device in close-ups: the ring, "Hello?", the click.
- **The limit tag** "Two quiet minutes" with a draining 2:00 timer is the quotable line, and the ending loops into frame 1.

## What is weaker
- **The characters are simple kit figures.** Heads on pillows read well, but the standing and sitting bodies are stiffer than the source's hand-drawn cast.
- **Small text:** the lobby clock is partly covered by Nadia's raised arm (1:20, 9:05). The morning-exterior insert of 305 walking into a top-floor window is tiny.
- **The night-vision tint** also recolours the red "?" marks in the two-minute shot (they read grey-green).
- **Motion** stays below the source (fewer and shorter tracking moves).
- **The countdown card's comparison panels and ring** are smaller than the source's bars and timer (compare.jpg #8); the card has more empty cream.

## Deviations from the source
- **The bottom pill** sits at 78 % (y 1500) rather than 85 %, to stay out of Instagram's bottom UI.
- **Night instead of day + rain.** The reveal uses an x-ray / night-vision cutaway instead of CCTV (hotels don't film rooms), and an x-ray label replaces the source's CCTV label.
- **Sound:** the source has no music bed. Ours adds one (dropped in `_nomusic`), plus a low 1 Hz pulse under the countdown clicks.
- **Type:** the film was rendered with Rockwell Bold (local), standing in for the source's Bree-like slab serif. The shipped build files now load Roboto Slab (SIL OFL, not shipped; see assets/template/assets/fonts/README.md).

## The riddle
A classic lateral-thinking puzzle (a guest in a hotel can't sleep, phones a room, hangs up without speaking, falls asleep:
the neighbour was snoring). It is retold here with our own characters (the guest in 305, the bearded snorer in 306, Nadia
the night receptionist), place, clue card and dialogue. No real people, brands or logos appear; "HOTEL" is a generic sign.

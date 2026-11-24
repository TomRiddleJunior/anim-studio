# SAMPLE — "One Fright, No Water" (riddle-diner)

The second film built with the `explainer-riddle-cutaway` skill (follow-up task, build agent A, 2026-11-07).
- **Source format:** @oddlinearchive `DfLF1TVgTXf`, the floor-20 lift-and-umbrella riddle (87.7 s).
- **Ours:** the classic hiccups riddle, made PG (87.0 s).
  - A woman asks for water every evening; the cook bangs two pans behind her instead, and she thanks him.
  - The night the new cook just gives her the water, she leaves unhappy.
  - The answer: she has hiccups, and a fright cures them.
  - Nothing violent appears: the "fright" is two pans.

## Deliverables
- **`out/riddle-diner.mp4`:** 1080×1920, 30 fps, x264 CRF 19, AAC. The full mix: voice, an original 112 BPM diner-jazz bed (upright bass, brushes, vibraphone) and SFX.
- **`out/riddle-diner_nomusic.mp4`:** the same video stream (stream-copied) with voice + SFX, including the countdown clicks.
- **`out/riddle-diner.srt`:** every spoken word. **`out/cover.jpg`:** the cover.
- **`out/qa/`:** 5 sweep sheets (all 174 tiles looked at), metrics, gates, yavg, compare.jpg, Whisper.

## Build
1. **Voice:** `vo/script.json` (20 lines, 236 words) → Kokoro `am_eric` at 1.07. A 10.6 s `gap` before "Time's up." makes the countdown a real 10 s.
2. **Build:** `tools/build.py` writes the word data, 20 paraphrase pills, the world host, the index, the SRT and `timing.json` (countdown from 44.17 s).
3. **Film:** `assets/lib/kit.js` + `assets/lib/kit-ext.js` + `assets/lib/film.js`.
   - **`kit-ext.js`** is new and shared with riddle-twins. It adds chef, cap, nurse and bandana hats, curly and long hair, a moustache, pans, a glass, a framed reveal view, a BANG! burst, the ring timer, wall clocks and the stair core.
   - **`film.js`** holds:
     - the corner building, with flats 2A–4B over a diner (counter, stools, booth, menu, wall clock, kitchen hatch, register, straws);
     - the dusk and morning exteriors;
     - the countdown card;
     - 22 word-anchored shots (one of them the BANG close-up), plus 6 camera-override inserts.
4. **Sound:** `tools/sound_design.py` writes both mixes (−14 LUFS, TP −2).
   - The bed is G minor through the mystery, B-flat major after the reveal, and a 1 Hz pulse under the countdown.
   - The SFX are a pan BANG, the door bell, a pour, gulps, the clicks, straws and a register bell.
   - The "hic" sounds play only inside the replay.
5. **Render and deliver:** HyperFrames 0.8.210 delivery (about 3 min per render), then `tools/deliver.sh` and `tools/qa_all.sh`.

## Gates (final render, `out/qa/gates.json`)
| gate | target | result | |
|---|---|---|---|
| length | 87.7 s ±15 % | 87.0 s (−0.8 %) | pass |
| WPM | 163.4 ±20 % | 161.4 (−1.2 %) | pass |
| cuts / min | 14.36 ±20 % | 15.86 (+10.4 %) | pass |
| scene changes / min | 10.94 ±20 % | 11.03 (+0.8 %) | pass |
| first frame a still; first word ≤ 0.4 s | — | frame 1 = the building at dusk, counter "3", her on the 3rd-floor landing; first word 0.21 s | pass |
| loudness full / no-music | −14 ±1 LUFS, TP ≤ −1 | −14.0 / −1.8 dBTP; −14.0 / −1.8 dBTP | pass |
| voice over bed | ≥ 10 dB | 21.0 dB (bed); 13.9 dB over bed + SFX | pass |
| Whisper hears every line | ≥ 0.85 per line | all 20 lines, mean 1.00 | pass |
| pills in the safe area; none over a face | top y 369, bottom y 1500 (78 %) | checked on all 174 tiles | pass |
| unplanned black / flash frames | 0 | 0. One planned bright-to-dark cut is marked in `tools/qa_config.json`: card → diner at 56.0 s | pass |
| stream lengths match | no `-shortest` | video 87.000 s / audio 86.975 s (both files) | pass |

**Whisper notes:**
- "6:05" comes back as "six, zero five", and "hic" as "hick".
- "a fright" is heard as "to fright", and "Follow for more" as "follow from more".
- A one-word hallucination ("you") lands on the silent loop tail.
- All 20 lines score 1.00 after the number and homophone aliases.

**Other measured differences.**
- Motion is 4.67 against the source's 7.62. Our camera moves are pushes and one stair descent; the source tracks a lift through 10–20 floors.
- Colourfulness is 55.2 against 39.6. Ours has a red counter, a green coat, a dusk sky and an amber replay tint.
- Brightness is 0.68 against 0.70.

## Renders
1. **Render 1:**
   - Cuts were 8.98/min (−37 %) and scene changes 6.90/min (−37 %), both misses. Motion was 3.68.
   - Duration, WPM, loudness, streams and Whisper passed. One line missed: "Bang go the pans" was heard as "Bango".
2. **Render 2:**
   - **Camera-override inserts**, each a closer framing of the same moment:
     - the BANG close-up;
     - the building wide as she leaves;
     - Theo's "?" close-up;
     - the new cook handing over the glass;
     - the booth couple drinking normally;
     - the BANG replay close-up;
     - the FOR HICCUPS pans.
   - Each insert is a hard cut with a new palette, so cuts rose to 15.86/min and scene changes to 11.03/min.
   - r16 was rephrased to "The pans go bang, she jumps, and the hiccups stop."
   - The BANG insert was reframed so the burst sits below the top pill.
   - The YAVG card → diner cut was marked as planned.
3. **Render 3, final** (approved by the coordinator for two fixes only):
   - The X5 pill changed from "Water doesn't stop hiccups" (a general health claim, and a wrong one) to "The water didn't work", which matches r17.
   - The dusk and morning exterior was lifted 120 px (one `setTransform`), so the DINER sign now sits above the bottom pill.
   - Every other gate is unchanged: cuts 15.86, scene changes 11.03, motion 4.67.
4. **Snapshot passes before render 1:**
   - The register was moved so it no longer hid Theo.
   - The spare pans were moved off his face, and the cook was offset so his face shows.
   - The three HIC bubbles became one bubble at a time plus a HIC ×n counter.

## What reads well
- **The fair clue is visual and silent.** Her shoulders jolt in every setup shot, but the "hic" is heard only in the replay. Viewers who notice the jolt can solve it; nobody hears the answer early.
- **The countdown card hints without answering.** The "pans" panel shows a BANG, a smile and "Thank you!"; the "water" panel shows a glass, a flat face and "no thanks". The ring runs 10 → 0 with a click per second, and "Time's up" lands on the narrator's line.
- **The reveal is a picture.** In the amber DINER CAM · REPLAY ×0.25 view, a HIC bubble appears on each spoken "hic". BANG! follows, the counter drops to HIC ×0 and she smiles.
- **The blue Wednesday replay** shows the water failing: she drinks and still hics.
- **The limit tag** "One fright. No water." and the payoff: FOR HICCUPS pans on hooks by the register, with Theo waving.
- **The loop:** the end returns to frame 1, with the counter at 3 and "6:05, every evening".

## What is weaker
- **The bottom pill still crosses the awning stripes** on the dusk exteriors. Since render 3 the DINER sign itself is clear.
- **N1 is static.** It runs 56–60 s, Theo by the REPLAY monitor with no pill and only a slow push.
- **The straw cup is ambiguous.** At close-up sizes the striped straw cup by the register reads like a fan.
- **The source moves more:** motion is 4.67 against 7.62.
- **The figures are simple.** The kit figures are stiffer than the source's hand-drawn cast, and the new cook is half-hidden behind her head in the hand-over insert.

## Deviations from the source
- **The bottom pill** sits at 78 % (y 1500) rather than 85 %, to stay out of Instagram's bottom UI.
- **The reveal camera:** a diner replay (amber, then blue for Wednesday) stands in for the source's lift CCTV.
- **Sound:** the source has no music bed. Ours adds one, dropped in `_nomusic`.
- **Type:** the film was rendered with Rockwell Bold (local), standing in for the source's Bree-like slab serif. The shipped build files now load Roboto Slab (SIL OFL, not shipped; see assets/template/assets/fonts/README.md).

## The riddle
- **Origin:** a classic lateral-thinking puzzle. A person asks a bartender for water; the bartender produces a fright instead, and the person thanks him and leaves: the hiccups were cured.
- **Our retelling is PG.** The fright is two pans banged together, with no weapon of any kind.
- **Our own material:** the characters (the woman from 3B, Marco the cook, the new cook, Theo the night cashier), the place, the clue card and the dialogue.
- **No real people, brands or logos appear.** "DINER" is a generic sign.

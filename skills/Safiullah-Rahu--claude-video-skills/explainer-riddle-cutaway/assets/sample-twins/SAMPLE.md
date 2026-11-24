# SAMPLE — "Born Second, Born First" (riddle-twins)

The third film built with the `explainer-riddle-cutaway` skill (follow-up task, build agent A, 2026-11-07).
- **Source format:** @oddlinearchive `DfLF1TVgTXf`, the floor-20 lift-and-umbrella riddle (87.7 s).
- **Ours:** the classic daylight-saving twins riddle (89.0 s).
  - Ivy is born at 1:55 AM. June is born 25 minutes later, yet her certificate says 1:20 AM.
  - The answer: it was the night the clocks went back, so 1:00–1:59 happened twice.
  - Every year, the older twin blows out her candles second.

## Deliverables
- **`out/riddle-twins.mp4`:** 1080×1920, 30 fps, x264 CRF 19, AAC. The full mix: voice, an original 84 BPM lullaby bed (music box, pizzicato, woodblock clock ticks) and SFX.
- **`out/riddle-twins_nomusic.mp4`:** the same video stream (stream-copied) with voice + SFX, including the countdown clicks.
- **`out/riddle-twins.srt`:** every spoken word. **`out/cover.jpg`:** the cover.
- **`out/qa/`:** 5 sweep sheets (all 178 tiles looked at), metrics, gates, yavg, compare.jpg, Whisper.

## Build
1. **Voice:** `vo/script.json` (19 lines, 221 words) → Kokoro `am_eric` at 1.12. A 10.6 s `gap` before "Time's up." makes the countdown a real 10 s.
2. **Build:** `tools/build.py` writes the word data, 20 paraphrase pills, the world host, the index, the SRT and `timing.json` (countdown from 43.00 s).
3. **Film:** `assets/lib/kit.js` + `assets/lib/kit-ext.js` (shared with riddle-diner) + `assets/lib/film.js`. The film file holds:
   - **The hospital cutaway:**
     - the lobby (EMERGENCY · MATERNITY);
     - Room 4: Mum in bed, two bassinets, a small room clock;
     - the nurses' station: a big ward clock, the NOV 2 calendar, Nurse Hana;
     - the upper wards and nursery, and the stair core.
   - **Other scenes:** the night exterior with falling leaves, the twins' birthday party, the certificate cards and the countdown card.
   - **Shots:** 20 word-anchored shots, plus 9 camera-override inserts.
4. **Sound:** `tools/sound_design.py` writes both mixes (−14 LUFS, TP −2).
   - The bed is D minor through the mystery and F major after X3.
   - The SFX are newborn cries, a pen scribble, a party horn, a tape-rewind sweep under the clock spin and a 2:00 chime.
5. **Render and deliver:** HyperFrames 0.8.210 delivery (about 3 min per render), then `tools/deliver.sh` and `tools/qa_all.sh`.

## Gates (final render, `out/qa/gates.json`)
| gate | target | result | |
|---|---|---|---|
| length | 87.7 s ±15 % | 89.0 s (+1.4 %) | pass |
| WPM | 163.4 ±20 % | 149.0 (−8.8 %) | pass |
| cuts / min | 14.36 ±20 % | 15.51 (+8.0 %) | pass |
| scene changes / min | 10.94 ±20 % | 10.79 (−1.4 %) | pass |
| first frame a still; first word ≤ 0.4 s | — | frame 1 = the hospital cutaway, counter "1:48"; first word 0.21 s | pass |
| loudness full / no-music | −14 ±1 LUFS, TP ≤ −1 | −14.0 / −1.9 dBTP; −14.0 / −1.9 dBTP | pass |
| voice over bed | ≥ 10 dB | 21.0 dB (bed); 12.9 dB over bed + SFX | pass |
| Whisper hears every line | ≥ 0.85 per line | all 19 lines, mean 1.00 | pass |
| pills in the safe area; none over a face | top y 369, bottom y 1500 (78 %) | checked on all 178 tiles | pass |
| unplanned black / flash frames | 0 | 0. Three planned bright-to-dark cuts are marked in `tools/qa_config.json`: ward → night exterior at 19.7 s, ward → night exterior at 37.3 s, party → the night END shot at 85.3 s | pass |
| stream lengths match | no `-shortest` | video 88.967 s / audio 88.940 s (both files) | pass |

**Whisper notes:**
- Times come back as digits ("1.55", "1.20", "25", "2 a.m."), and "Hana" as "Hannah" or "Hanna".
- `tools/whisper_check.py` now spells heard digits as words and maps "a.m." → "am" and "Hannah" → "Hana". With that, all 19 lines score 1.00.

**Other measured differences.**
- Motion is 5.25 against the source's 7.62.
- Colourfulness is 28.8 against 39.6. A hospital at night is pale teal and grey, and the reveal is a violet tint.
- Brightness is 0.78 against 0.70.

## Renders
1. **Render 1:**
   - Cuts were 10.12/min (−30 %) and scene changes 8.77/min (−20 %), both misses. Motion was 4.06.
   - Duration, WPM, loudness, streams and Whisper passed.
2. **Render 2:**
   - **Nine camera-override inserts**, each a closer framing of the same moment:
     - Ivy's bassinet with IVY · 1:55;
     - the family close-up;
     - Hana writing;
     - June's cake;
     - the NOV 2 calendar (reframed in render 3);
     - the ward clock turning back;
     - June's bassinet at 1:20;
     - Hana laughing;
     - June with her certificate.
   - Cuts rose to 16.19/min and scene changes to 11.46/min.
   - Fixes:
     - The clock stamps were rounded to whole minutes.
     - The certificate cards are drawn in screen space inside the zoomed party inserts.
     - Two inserts were reframed so the top pill no longer covers the clock or the name tags.
3. **Render 3, final** (approved by the coordinator for two fixes only):
   - **X1:** the insert across "the clocks went back" (59.6–63.4 s) was a calendar close-up that pushed the clock off-frame. It is now the whole ward clock with the NOV 2 calendar small at its left. The spin 1:55 → 2:00 → 1:00 plays on screen, readable, under the pill.
   - **X2:** the close-up was widened so the whole "2:00 → 1:00" tag is in frame, below the "One hour, twice" pill.
   - The gentler X1 reframe registers as a softer cut: cuts went from 16.19 to 15.51/min and scene changes from 11.46 to 10.79/min. Both still pass.
4. **Snapshot passes before render 1:**
   - Mum got a bun; she had no hair because `D.bed` uses the plain head.
   - The bassinets were narrowed, and the family is now drawn behind the bassinets so the name tags show.
   - The party was rescaled, the calendar moved out from behind Hana, and the edge-cut tags repositioned.

## What reads well
- **The time pill hides the jump.** It rolls 1:48 → 1:54 → 1:55, then counts +5 → +25 min for June, so viewers never see the clock reach 2:00 before the reveal.
- **The certificates set up a fair contradiction.** IVY 1:55 AM and JUNE 1:20 AM are shown big, both dated SUN · NOV 2. The birthday-candle line turns the riddle into a picture: June blows out her candles first, with "1st" and "2nd" tags.
- **The countdown card hints without answering.** Each panel has a clock face and a SUN · NOV calendar chip: the fair clue. The ring runs 10 → 0 with a click per second, and "Time's up" lands on the narrator's line.
- **The reveal is a picture.** In the violet ● WARD CLOCK view, the big ward clock reaches 2:00, then its hands sweep back to 1:00 while the narrator says "the clocks went back" (60.5–63 s). The replay does it again under a "2:00 → 1:00" tag (66–68 s), then runs on to 1:20 for June's bassinet.
- **The REAL TIME / ON THE CLOCK ribbons** show "+25 min" against "35 min earlier".
- **The limit tag** is "One hour, twice". The ending loops into frame 1, with the counter at 1:48 and "Twins, Room 4".

## What is weaker
- **Two small crowding spots.** At the end of the X1 push (62.5–63.4 s) the clock rim touches the right frame edge, though the numerals stay readable. In the X2 close-up the "2:00 → 1:00" tag covers the small WARD REPLAY frame label.
- **The X4 ribbons are small** (labels about 25–40 px at full size) and leave a lot of empty lavender.
- **O6 floats Hana's head.** Her head pokes up over a plain grey band under the certificates, with no desk detail.
- **Motion and colour run below the source** (5.25 against 7.62 motion; 28.8 against 39.6 colourfulness). The hospital palette is pale.
- **WPM is 149.** It is within the gate but the slowest of the three films.

## Deviations from the source
- **The bottom pill** sits at 78 % (y 1500) rather than 85 %, to stay out of Instagram's bottom UI.
- **The reveal camera:** a framed ward-clock replay (violet) stands in for the lift CCTV.
- **Sound:** the source has no music bed. Ours adds one, dropped in `_nomusic`.
- **Type:** the film was rendered with Rockwell Bold (local), standing in for the source's Bree-like slab serif. The shipped build files now load Roboto Slab (SIL OFL, not shipped; see assets/template/assets/fonts/README.md).

## Time facts and sources
- **The US rule:** daylight saving time ends at 2:00 AM local time on the first Sunday in November, and clocks are set back to 1:00 AM. The source is 15 U.S.C. §260a, as amended by the Energy Policy Act of 2005, §110. Canada's provinces that observe DST follow the same dates.
- **The repeated hour:** 1:00–1:59 happens twice.
- **The births:**
  - Ivy is born at the first 1:55.
  - Five minutes later, 2:00 daylight time becomes 1:00 standard time.
  - June is born 20 minutes after that, at the second 1:20.
  - So June is 25 minutes younger in real time, and her clock time is 35 minutes earlier (1:55 − 1:20).
- **The date:** "SUN · NOV 2" matches 2 November 2025, the first Sunday of that November.
- **The EU rule** is given in the pinned comment, not on screen. Clocks go back on the last Sunday in October: 3:00 → 2:00 in Central European time, and 2:00 → 1:00 in the UK, Ireland and Portugal.

## The riddle
- **Origin:** a classic lateral-thinking puzzle (twins born across the end of daylight saving time, the younger with the earlier time).
- **Our own material:** the characters (Ivy, June, Mum, Dad, Grandma and Nurse Hana), the place, the clue card and the dialogue.
- **No real people, brands or logos appear.** "HOSPITAL" and "MATERNITY" are generic signs. Nothing violent or unsafe is shown.

# Sources — explainer-riddle-cutaway

## The source reel (analysed 2026-11-06, batch 8, build agent A)
- **Instagram reel** `DfLF1TVgTXf` by **@oddlinearchive**, a version of the classic lift riddle (floor 20, rain) with a security
  guard as the observer. 606,515 likes and 5,714 comments as of 2026-11-06. Audio: "Original audio (oddlinearchive)".
  https://www.instagram.com/reel/DfLF1TVgTXf/
- 720×1280, 30 fps, 87.7 s. Analysed locally for reference only; nothing from it is redistributed.

## What was measured
- **Engine analyzer** (metrics.json, not included):
  - 87.74 s, 21 cuts (14.36/min, median shot 2.73 s, first cut 5.23 s), 10.94 scene changes/min;
  - motion 7.62, brightness 0.70, colourfulness 39.6, palette, −14.1 LUFS;
  - 163.4 WPM (239 words), silence 15.8 s.
  - Whisper small transcript.
- **rea-video decompose** (outputs not included): "No sustained music bed detected"; voice pitch ~165.8 Hz; 78
  SFX candidates (whooshes on cuts, pops on pills, one click per countdown second, dings).
- **Our measurements** (sheets not included):
  - a 2 fps sweep (175 frames) and full-size frames of key moments;
  - narrator f0 by autocorrelation (median 164 Hz, p10/p90 134/239);
  - gap levels (digital silence in the countdown apart from the clicks);
  - pill geometry: top pill at 19 %, bottom at 85 %, counter at 11 %, slab serif ~33 px on 720.
- **Kokoro voice test** for the narrator match (`tools/voicetest.py`): `am_eric` 160 Hz is the closest to the source's 164 Hz.

## The sample's riddle
- "The man in the hotel" is a classic lateral-thinking puzzle: a hotel guest can't sleep, phones a room, hangs up without
  speaking and falls asleep, because the neighbour was snoring. The film retells it in our own words, with our own
  characters (the guest in 305, the snorer in 306, Nadia the night receptionist), place and clue card.

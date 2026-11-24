# SAMPLE — "Hungary opens the secret police files" (explainer-news-noir)

Source format: @thelondonletter reel `DfcftGoIo4D` (65.9 s, black-and-white news summary). Our story: on 4 Nov 2026
Hungary put its communist-era state security records online (Reuters, Euronews/MTI, Daily News Hungary, Portfolio,
Origo). Kit #97.

## How the story was picked (section 0 of the skill)
Candidates from Wikipedia's current-events pages for 30 Oct – 7 Nov 2026 and news searches: the Binance theft
(earlier films in this project already cover a Binance hack), a cyberattack wave on supermarket freezers in Europe (single source),
the NASA Swift observatory re-entry, China's Antarctic law, US measles at a 35-year high, and Hungary's files.
Hungary's files scored highest for the format (a document, a place, a network, an object, a big number, two quotable
voices, a "zero" and a dated next step) and is about institutions, not allegations against anyone; nobody in the
database is named.

## Build
- HyperFrames 0.8.210: `compositions/world.html` holds a WebGL canvas (three.js 0.186 sets: desk, tape drive,
  archive corridor, card catalogue) under a Canvas 2D layer (photo spotlights, rings, labels, the card, dotted map and
  globe, the network graph, the blueprint, the link test, quote and zero cards); `compositions/hud.html` holds the
  1–2-word captions and the grain. Shots in `assets/lib/film.js`.
- Photos prepared offline in black and white (`tools/prep_photo.py`): the hook (Elekes Andor, CC BY 4.0) and the
  portrait (Norbert Banhalmi, CC BY-SA 4.0), both Wikimedia Commons, credit lines on screen.
- Voice: Kokoro `bm_george`, speed 1.25; timing `tools/build.py` (≤ 2 words per caption).
- Maps: `tools/make_geo.py <natural-earth-dir> Hungary` → dotted Europe + globe.
- Sound: `tools/sound_design.py` (72 BPM D-minor bed, SFX) → `assets/audio/final.m4a` + `nomusic.m4a`.
- QA: `tools/qa.py` + the engine analyzer.

## Gates
Measured on the delivery file (`out/qa/gates.json`, `out/qa/metrics.json`).

| gate | value | result |
|---|---|---|
| size | 1080x1920 | PASS |
| fps | 30.0 | PASS |
| duration_s (src 65.9, +-15%) | 71.6 | PASS |
| streams_match (video s, audio s; both files) | [71.6, 71.57, 71.6, 71.57] | PASS |
| video_frames equal | [2148, 2148] | PASS |
| wpm (src 153.9, +-20%) | 134.9 | PASS |
| analyzer cuts/min (src 3.64) | 5.03 | info |
| analyzer scene changes/min (src 6.37) | 6.7 | info |
| hand-counted cuts/min (src 12.75) | 11.74 | PASS |
| loudness_lufs | -14.1 | PASS |
| true_peak_dbtp | -2.0 | PASS |
| nomusic_true_peak_dbtp | -2.0 | PASS |
| voice_over_bed_db | 13.03 | PASS |
| first_word_s | 0.16 | PASS |
| whisper_full_all_lines | 0.982 | PASS |
| whisper_nomusic_all_lines | 0.987 | PASS |
| unplanned_dark_or_flash_frames | [] | PASS |
| brightness (src 0.190) | 0.218 | info |
| colourfulness (src 0.3) | 0.7 | info |
| motion_mean (src 6.62) | 4.88 | info |

## Renders
- Render 1 (master_r1, 2,148 frames, ~2.5 min): the tape reels wobbled (spun about the wrong Euler axis), the dotted
  map and globe were too faint, the card catalogue sat low and filled the frame behind the captions, the desk label
  was hard to read on paper, and two white → black hard cuts were flagged as dips (they are planned) together with an
  apostrophe mismatch in the Whisper check ("informers'").
- Render 2 (master_r2, final): reels spin on their axis, darker dots and a deeper map zoom, the cabinet smaller and
  higher under a brighter spot, the desk label in a dark box, the corridor caption in a box; the two cuts listed as
  planned dips and the Whisper normaliser ignores apostrophes. All gates pass. A third render is not needed.

## What reads well
- The hook does exactly what the source does with a licensed photo: dim, ring, label, then the spotlight moves to the
  second subject (a phone in the crowd = "anyone can search").
- Labels on every noun keep the eye busy while the captions stay tiny.
- The fairness devices (NOT PROOF, two quotes, the zero card) make the story careful without slowing it.

## What is weaker
- The desk shot is busy: the ~60,000 label overlaps the register heading and the camera is close.
- The blueprint ledger is small and generic; the source's chip blueprint has more callouts.
- The quote and zero cards are plain type on black (faithful to the source, but the weakest frames to look at).
- The file is large (121 MB for 71.6 s) because the grain changes every frame.
- Analyzer cuts 5.0/min vs 3.6 (+38 %): our 2D and 3D shots differ more in brightness than the source's, so the
  detector catches more of the cuts; by hand 15 vs 15 shots (11.7 vs 12.8 cuts/min, −8 %), and scene changes
  6.7 vs 6.4/min (+5 %).
- 71.6 s against 65.9 s (+8.6 %), inside the ±15 % gate; WPM 134.9 vs 153.9 (−12 %).

## Deviations from the source (and why)
- Captions at y 1270 instead of ~1450 (key-text line ~1300).
- No faces beyond the PM (both photos CC-licensed with credits); the people in the network graph are silhouettes.
- 71.6 s vs 65.9 s (+8.6 %).
- The source's "company mark" under the map is replaced by a plain mono line naming the archive.

## Source → ours
| source | ours |
|---|---|
| bar photo: ring + label on two people, spotlight moves | parliament-steps photo: ring on the PM, spotlight moves to a phone in the crowd |
| a redacted memo on a desk + "the FT reports" | a redacted register and a registration card on a desk + "Reuters and Euronews report" |
| cut-out of a person with leader-line labels | the Form 6 card as a cut-out with leader-line labels |
| dotted map, pin on the company's city | dotted Europe map, pin on Budapest and the archive |
| portraits and a target ring linked by dashed lines | officer ring → network member → others (silhouettes) |
| a chip with its heatsink lifting | a tape drive with a reel lifting |
| the second person under a spotlight with a dated tag | the PM's portrait with PLEDGE KEPT / ACCESS DELAYED tags |
| chip blueprint | the 1957–1962 register as a line drawing |
| "no link established" X | "not proof" X |
| globe with a route | globe with 1956 and 1988–89 pins |
| corridor + $4.8BN | corridor + ~150,000, a third known |
| "Routine" / "A smear" | "Very incomplete" / "Dignity and humanity" |
| 0 charged | 0 informer reports published |
| white Capitol model + deadline tags | white card-catalogue model + 9,000+ files, due 25 Feb 2027 |

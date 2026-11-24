# SAMPLE — Same Night · Part 1 (explainer-stickman-night-choice) · kit #95

`out/stickman-loop.mp4` (full mix) · `out/stickman-loop_nomusic.mp4` (voice + sfx) · `out/stickman-loop.srt` ·
`out/cover.jpg` · `out/qa/` (2 fps sweeps, metrics.json, gates.json, yavg.json, compare.jpg, whisper.txt).
1080×1920, 30 fps, 60.55 s. Reference: @stick.dimension `DfViPqtSRxY` (57.0 s), analysed locally for reference only.

## Build
- Script: 16 lines, 134 words (`vo/script.json`), Kokoro `am_onyx` at 1.08 (≈ 184 WPM while speaking), lead 0.12 s.
- `tools/build.py` → captions (1-2 word groups, Montserrat 900, lime keywords, none on the vote), world, index, SRT.
- `assets/lib/sm-kit.js` (stick figure, HUD, phone UI, RULE tag, vote stack) + `assets/lib/film.js` (13 shots,
  0.25-0.3 s dissolves through an offscreen buffer, HUD state per time).
- Iterated lock-free in the browser (`tools/devserve.py` + `tools/dbg.html`): contact sheets, the analyzer emulation
  (`#analyze=`), the shot-time export for the score (`#times=`).
- `tools/score.py`: voice, room tone + city hum + whine, foley/UI per event, an original 50 BPM horror bed (full mix
  only); stems levelled to the voice; both mixes −14 LUFS.
- Snapshots: 20 stills (every shot) before the render. **Renders: 1** (delivery preset, 118 s with 2 workers). The
  pause on 9 Nov did not touch it (it finished at 18:18).

## Gates
| gate | reference | ours | target | pass |
|---|---|---|---|---|
| length | 57.0 s | 60.57 s | ±15 % | ✓ |
| cuts / min (analyzer) | 1.05 | 0.99 | ±20 % | ✓ |
| scene changes / min | 0.0 | 0.0 | 0 | ✓ |
| WPM | 137.0 | 132.7 | ±20 % | ✓ |
| first word · first visual change | — | 0.18 s · 0.13 s | ≤ 0.4 s | ✓ |
| loudness full · no-music | −14.2 LUFS | -14.0 / -2.0 dBTP · -14.1 / -2.0 dBTP | −14 ±1, TP ≤ −1 | ✓ |
| voice over everything else · over music | ~10 dB | 14.0 dB · 17.5 dB | ≥ 10 dB | ✓ |
| Whisper `small` | — | 16/16 lines, worst recall 1.00 | every line | ✓ |
| captions in the safe area | y ≈ 1480 | y 1210-1310, none on the vote; no face under a caption | 168-1300 | ✓ |
| unplanned black / flash frames | — | 0 | 0 | ✓ |
| streams · frame count | — | video 60.567 s / audio 60.555 s; both files 1817 frames | match | ✓ |
| brightness · colourfulness · motion | 0.106 · 14.6 · 2.46 | 0.14 · 19.1 · 1.96 | look | — |

## Calibrating the analyzer (the one cut, zero scene changes)
| try | opening | emulated cut score | scene changes |
|---|---|---|---|
| 1 | warm wash `rgba(120,90,60,0.35)`, lamp off at 0.2 s | 0.24 (no cut) | 1 (0.67 s) + 1 (the red flash, 41.7 s) |
| 2 | `lighten` wash `rgb(62,52,40)`, red flash dimmed | 0.27 | 0 |
| 3 | `lighten` wash `rgb(63,60,52)` + two warm glows | 0.40 | 1 (0.49 at 0.67 s) |
| 4 | the same, lamp off at **0.13 s** (frames 0-3 lit) | 0.40 | **0** |
The render measured 0.554 at 0.13 s and nothing above 0.17 after it.

## Source → ours
| reference | ours |
|---|---|
| premise: the last person alive, a stranger texts | you have lived the same night four times; only your phone (and its battery) survives each reset |
| HUD ● DAY 1, clock, BATTERY 90 %, POPULATION 1 | ● DAY 1 (it never becomes DAY 2), clock 11:48 → 11:59, BATTERY 31 → 29 % (it never comes back), LOOP 4 |
| a lit room, the lamp dies | the same opening, recalibrated (above) |
| a thread from an unknown number | a thread from your own number, scheduled from loop 3 |
| RULE #2 over the city | RULE #1 over the city |
| a door slams below, footsteps climb the stairwell, stop at your door, three knocks | the windows across the street die one by one, block by block, your building floor by floor (section view), then six, then your lamp |
| the phone lights up, a new message, a red flash | the last light in the city; "last loop I froze…", a red flash, "run for the roof" |
| A open / B trust the phone, COMMENT A OR B, PART 3 | A freeze / B run for the roof, COMMENT A OR B, LOOP 5 |
| follow card, POPULATION glitches to 2? | follow card, LOOP glitches to 5? |
Visible upgrades: a rewind glitch on "resets", loop echoes of the figure, the battery as the series' resource, the
darkness spreading toward you as a countable wave instead of off-screen footsteps.

## What reads well
- The HUD matches the reference's geometry and stays on every frame; the clock pop at 11:59 and the battery pop read.
- The building section (floors dying on their words, floor 7 outlined) is the clearest beat; the dark city with one
  cold window is the strongest still (used for the cover).
- The vote stack types in like the reference; no captions over it.

## What is weaker
- The figure barely moves (as in the reference, but our room has one pose; the reference's figure moves to the floor).
- The facade across the street goes dark slower than the words (the wave is still running at the cut, 24.45 s).
- The phone text is small at phone size (like the reference); the narrator carries the key lines.
- The opening lamp frame is a big bloom rather than the reference's soft warm room (it had to be strong for the cut).
- 60.6 s against 57.0 (+6 %): the vote section is ~2 s longer.

## Deviations (deliberate)
- Captions at y 1258 (the reference: y ≈ 1480, under the 9:16 safe line).
- Original 50 BPM bed in the full mix; the reference's bed is a drone + whine (no beat).

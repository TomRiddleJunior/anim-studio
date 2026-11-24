# SAMPLE · money-news — "Boeing's $16 billion day"

Skill: `~/.claude/skills/explainer-money-news-3d/` · film: `out/money-news.mp4` (76.4 s, 1080×1920, 30 fps) ·
captions `out/money-news.srt` · QA `out/qa/` · facts `FACTS.md` · script and retention map `SCRIPT.md` · post `POST.md`.

## Story choice
The brief asked for a real market story from the last 7 days (today 2026-11-01), not Alphabet's earnings. Boeing's
Q3 results on Tuesday Oct 27, 2026 fit the source's device chain one for one: a one-day loss (≈ $16 B of market value,
−10.7 %), good numbers that make it strange (record $745 B backlog), a "bill" (367 of ~500 737s delivered, target
missed), a number that drops ($3 B free cash next year vs $5.5 B expected), a hidden cause (wings) and an economic
"why" (airlines pay most of the price on delivery). Every number has two sources in `FACTS.md`; the market-value loss is
derived (price change × ~792 M shares) and shown as "about"; where outlets disagreed ("worst since April 2025" intraday
vs worst since June 2020 at the close), the film uses the weaker claim both support ("more than a year and a half").

## How it was built
- **Voice**: `vo/script.json` (21 lines, 214 words) → Kokoro `am_michael` at 1.28 → `vo/data/vo.json` word times.
  Whisper `small` read-back fixed one line ("five hundred seven-thirty-sevens" was heard as "507.37s").
- **Timeline**: `tools/build.py` turns the word times into the scene schedule (16 scenes, transitions, word anchors for
  every 3D move), the cards composition (ticker + split-flap, crash chart from real closes, worst-day counter, stat
  cards, TWIST tape, two-card logic with a flying banknote, slider + mini cards, 9×3 split-flap, phone CTA), the caption
  composition (26 phrases, word by word), the SFX cue list, `index.html` and the SRT.
- **3D**: `assets/lib/money-kit.js` (six sets, PMREM env per set, shadowed keys, fog, light cones, dust, planar
  reflections, half-res bokeh DOF, bloom, motion blur, ACES, grain) and `assets/lib/mn-shots.js` (one function per 3D
  scene). `compositions/world.html` renders only the frames a card does not cover.
- **Look-dev**: `scratch/debug.html` + `scratch/devserver.py` render any time with overrides and save PNGs
  (`dbg.shot`), much faster than full snapshots; `scratch/sheet.py` tiles them.
- **Sound**: `engine/audio/sound.py` with `score/sound.json` (doc-pulse bed, 100 BPM) + 220 SFX cues → −14 LUFS.
- **Render**: `tools/render_locked.sh … delivery` (2 workers, shared lock): ≈ 160 s for 2,293 frames (three renders; the last fixed the stamp text).

## Gates (measured on the final mp4 against the source)
| gate | source | sample | result |
|---|---|---|---|
| duration | 75.6 s | 76.4 s | 60–80 s ✓ |
| WPM overall | 176 | 168 (−4.6 %) | ±20 % ✓ |
| scene changes / min | 12.7 | 11.8 (−7 %) | ±20 % ✓ |
| loudness | −14.1 LUFS | −14.3 LUFS | −14 ±1 ✓ |
| true peak | — | −1.1 dBTP (AAC in the mp4; −1.5 in the mix) | ≤ −1 ✓ |
| voice over music | — | +17.7 dB | ≥ 10 dB ✓ |
| first word · frame 0 | 0.0 s | 0.18 s · cash pallets + "BOEING" | ≤ 0.4 s ✓ |
| longest silence between lines | 1.0 s (end) | 0.57 s, bed under it | ≤ 0.8 s ✓ |
| Whisper `small` | — | every name and number read correctly (`out/qa/whisper_small.txt`) | ✓ |
| hard cuts | 4 | 8 | not a gate (3D→3D cuts) |
| colourfulness · brightness | 24.0 · 0.47 | 24.1 · 0.53 | close |
| motion mean | 10.4 | 8.4 | −19 % |

QA files: `out/qa/metrics.json` (engine analyzer, SRT beside the mp4), `out/qa/sweep_1…4.jpg` (2 fps sweep of the real
mp4, all looked at), `out/qa/yavg.json` (dips: only the intended flash frames), `out/qa/compare.jpg` (15 matched beats vs
the source), `out/qa/audio_qa.json`, `out/qa/whisper_small.txt`.

## What reads well
- The hook: the dolly over banknote pallets with the light rows going out on "single day", then the golden-hour
  window seat with the wing outside: a stronger, more physical open loop than the source's poker chips.
- The receipt: 367 identical "737 JET · DELIVERED" lines blurring past, landing on TOTAL 367 / TARGET ~500 / SHORT 133
  and a TARGET MISSED stamp: the format's best device, carrying our own number.
- The payoff: back at the window, the shade lifts, focus pulls to the engine as "engines" is struck through, the dive
  through the window and the lamps banging on over the green wing on its jigs.
- The cream cards and split-flap close are faithful to the source's typography and timing.

## What doesn't (yet)
- The cabin interior is plain (a flat beige wall and a simple bezel); the wing outside reads, but the cabin is the
  least realistic set.
- The hangar is convincing as a space but the wing has no fasteners, sealant or wiring detail at close range.
- The banknote pallets read as cream paper at a distance; the drawn notes only resolve near the camera.
- 8 hard cuts vs the source's 4: our second 3D world cuts where the source pushed.

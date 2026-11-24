# REVIEW v3 — Holding Pattern (in-flight captain)

Render: `out/satire-globe.mp4` — 145.9 s, 1920 x 1080, 30 fps, H.264 + AAC, 230.5 MB at `-q delivery`, rendered in
4 min 18 s (HyperFrames 0.8.210, screenshot capture, Intel iGPU, 4 workers). Earlier cuts kept: `out/satire-globe-v1.mp4`
(72 s Earth OS, music-only), `out/satire-globe-v2-earthos.mp4` (129 s Earth OS, narrated), sources in `v1/` and `v2/` (these renders and folders are not included in this repository).
Rebuild: `python -I tools/build_film.py`, then `sound.py score` and encode `assets/audio/final.m4a`.

## What changed from v2 (on request)
- All "Earth OS 26.10", ticket, patch-notes and bug/user language removed — on screen and in the voice.
- New framing chosen by the user from three offered (captain · phone line · weather): an airline flight. Opening =
  split-flap DEPARTURES board (destinations flip on the welcome, stop numbers on "six stops", statuses on "none of
  them are on time") → whip to a cabin window with the dotted orb outside and the seatbelt sign → push through the
  window into space. Each stop opens with a cabin chime; statuses are departure-board words and passport stamps;
  the recap is a split-flap ARRIVALS board on the flat map; the title "HOLDING PATTERN" lands last as an exit stamp.
- Narration rewritten as captain's announcements (309 words, Kokoro bm_george 1.18, light PA EQ); every fact line is
  mapped to a FACTS.md row (v3 section); framing lines carry no facts or forecasts.
- **Music: synthesized score** (the engine's `tech-glow`, 120 BPM: energy 1 under the departures board, 2 from the
  cabin window, 3 into the recap, end hit after the title stamp). A MiniMax-Music3 bed was tried first at the user's
  request — a new take cannot be generated without the dead RTX 3090 (CPU: ~26 s per autoregressive frame), so an
  existing MiniMax instrumental from the State of the World project was mixed in; the user then chose the synthesized
  score. That bed is kept as `music/bed-minimax-seed7.flac` (not included in this repository); copying it to `score/audio/bed.flac` and rebuilding
  switches the film back (`sound.py` `music_file`).

## Measured
- `npx hyperframes check --json`: ok, 0 warnings.
- QA: cuts 0 · scene changes 9.5/min (median 4.8 s) · motion 5.85 / p90 17.7 · hold 0.178 (the board's still rows and
  data-card holds) · colourfulness 35.1 · saturation 0.44 · brightness 0.43 · dark frames 0.34.
- Audio (synthesized score): −14.2 LUFS integrated, true peak −1.2 dBTP, LRA 2.2 LU.
  **Measured, not heard.**

## Fixed during review
- Board header wrapped into the DEPARTURES title → shortened, nowrap.
- 5.6 s still stretch on the board → destination rows staggered 0.45 s, stop numbers land on "six stops".
- First frame faded in (empty thumbnail) → the board is fully visible on frame 0.
- Arrivals board: JERUSALEM ran into its status → narrower cells, status column moved right.
- Serbia showed "≈0.0M" before its count → numbers fade in when their count starts.
- Stamps re-placed for the passport layout (ARRIVED off the label, IN COURT within the names card); end stamp clear of
  the sources line.
- Lint: a bare `font-family: "Roboto Mono"` inside a scene is flagged → `font:` shorthand.

## Weakest shots
- The cabin window is a flat panel (no depth of the wall itself); it works because the whip and push are fast.
- 146 s is long for social cuts; the stops average ~17 s each.
- The score is synthesized: upbeat and steady, but simpler than a produced track; a fresh MiniMax take with the
  airline-lounge caption (`music/caption.txt`, `tools/gen_music.py`) needs a CUDA GPU.

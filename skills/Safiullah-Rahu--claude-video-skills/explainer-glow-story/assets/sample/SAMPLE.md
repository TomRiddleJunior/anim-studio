# Unheard · how it was built, and the gates

The sample for `~/.claude/skills/explainer-glow-story` (format from @4k.tv `DfIGvFNse8c`). 84.0 s, 1080×1920, 30 fps,
0 cuts. Film: `out/glow-voicemail.mp4` (12 Mbit/s H.264 + the mastered AAC mix, ~127 MB) · captions
`out/glow-voicemail.srt` · QA `out/qa/` · cover `out/cover.jpg` (57.6 s: June's greeting card and her bubble).
Delivered film = **render 5** (after the coordinator's fix pass, below).

## Pipeline
1. `vo/script.json` → Kokoro (`engine/audio/tts.py`): narrator `af_heart` 0.96; him `bm_george` 0.84; June `bf_emma`
   0.9 → `vo/audio/vo.wav`, `vo/data/vo.json` (word times).
2. `tools/build.py` → `assets/lib/vo-data.js` (word times + the real envelope of his message for the player waveform),
   `compositions/captions.html` (57 phrases, the source's grey-with-a-lit-word system, none under the phone voices),
   `compositions/world.html`, `index.html`, `out/glow-voicemail.srt`. `--mask` writes a QA-only index (objects white on
   black, captions hidden) for `tools/frame_check.py`.
3. `assets/lib/film.js`: 19 stations along one camera path, **in line** (2.1 m apart in depth, ≤ 0.12 m sideways), each
   with its objects, a word-keyed `update(t)`, two lights; `hold()` camera keys (slow push on each, ~1 s eased push to
   the next). Stations **pop in** when the camera leaves the previous one and **scale out** when it leaves them (timings
   derived from the keys); lights fade with them. `assets/lib/glow-kit.js`: glass/metal/paper objects, emissive canvas
   faces, raymarched volumetric fog, bokeh DOF, motes, bloom, ACES grade, grain, mask mode.
4. `tools/score.py` (+ `piano.py`): narrator, telephone-line voices, hiss/clicks/breaths/ring/beep, four quiet foley
   ticks, a felt piano in A minor; limiter + two-pass linear loudnorm → `score/final.wav` (unchanged in the fix pass).
5. `hyperframes check` (0 errors; `dead_stretch` warnings during the phone voices: the checker only sees DOM changes),
   snapshots, the mask check, the full render through `tools/render_locked.sh` (2 workers, ~3.6 min on the Intel UHD
   770), then one encode under `with_render_lock.sh` that muxes `score/final.wav` in (HyperFrames' own audio pass had left
   the mix at −14.9 LUFS).

## Fix pass (coordinator's three issues) — what changed
1. **June's bubble and the greeting card were hard to read** (pale ice fill, white text smeared by bloom; "Greeting"
   bloomed out at 40-44 s, 57.6 s, 75-80 s). Now:
   - her bubbles and all three greeting cards sit on **deep ice-blue frosted glass** (colour `#86b4e6`, emissive
     `#16304a`, opacity 0.97, env 0.5; it renders around `#16304a`-`#1c3a58`); his bubbles on deep amber-brown glass
     (`#e6a878` / `#2c1a0c`) — they read too and now match;
   - the additive bubble fill is gone (the colour is the glass); the **glow stays on the rim and the halo light**;
   - words that must be read are drawn at an effective intensity of ~1.2 (text alpha 0.46 on the 2.6 face; "Greeting"
     0.48; labels at HDR 1.3 instead of 1.7) with a canvas halo of 0.07 × the font size (≈ 2-4 px on screen), and the
     bloom threshold rose from 0.65 to 0.75. Letters are sharp at 41 s, 57.6 s (the cover) and 75-81 s.
2. **The caption sat on the 0:09 column at ~34 s.** The column is now 0.54 m tall (was 0.78), framing puts the content
   centre at 34 % of the height (was 36 %), the 41 s toggle beat sits higher, and the bill pops in where it rests
   instead of sliding up through the band. `tools/frame_check.py` on **672 mask frames (every 0.125 s): 0 object pixels
   in the caption band** (y 1222-1302, x 130-950).
3. **Objects entering cut off / half off the edge (37 s, 43 s), near-empty transits.** New transit grammar: the next
   station waits straight ahead and **pops in already inside the frame** (0.42 s, small overshoot) the moment the camera
   leaves the current one, which **scales out** in 0.32 s; the camera then pushes ~2 m in ~1 s. The next object is
   framed within ~0.3 s of every transit start. Back lights (now on the camera path) fade out in 0.35 s as the camera
   leaves a station, and in after the next one pops, so no hot spots mid-transit. The bubble-stack dolly and the pill
   deck were reframed; the weeks wall's unlit squares are ice-blue so it reads on arrival; the 39 s card pops after the
   tilt starts. Mask check: **0 held frames and 0 transit frames touching any of the four frame edges**.
- Unchanged: script, VO, mix, word timings, the one take (0 cuts), length.

## Gates (measured on render 5, `out/glow-voicemail.mp4`)
| gate | source | ours | verdict |
|---|---|---|---|
| duration | 65-85 s brief (source 77.8 s) | **83.96 s** | pass (near the top of the range) |
| hard cuts | 0 | **0** | pass |
| WPM overall (analyzer, from the SRT) | 132.7 | **124.3** (−6.3 %); tts count 132.2 | pass (±20 %) |
| scene changes / min | 0.77 | **0.0** | miss, explained below |
| loudness | −14 ±1 LUFS | **−13.9 LUFS** (loudnorm read −13.99) | pass |
| true peak | ≤ −1 dBTP | **−2.17 dBTP** | pass |
| voice over music | ≥ 10 dB | **20.7 dB** (piano ~21 dB under while the voice speaks) | pass |
| hook | first word ≤ 0.4 s, subject on frame 0 | **0.16 s**; frame 0 = the amber waveform about to be erased | pass |
| Whisper `small` | every name and number right | 185 vs 187 words, ratio 0.978: "June", "412", "300", "nine", "eight", "Six p.m." all right; the only differences are "voice mail" (spacing), "p m", and "One you'd call" heard as "when you'd call" (a homophone; the caption reads right) | pass |
| YAVG dips | none | **0** | pass |
| caption band / frame edges (mask, 672 frames) | none | **0 / 0** | pass |
| 2 fps sweep (`out/qa/sweep_1.jpg`, `sweep_2.jpg`) | looked at | no cut, no empty slab, an object in every transit frame, readable words sharp | pass |
| compare (`out/qa/compare.jpg`) | 12 beats matched by role | hook object · morph · big number · amber row · clock · day count · repeated column · RESTRICTED lock · profile dates · twist object · viewer phone · kindness setting | — |

Not gated, for reference: motion 2.59 (source 1.98; render 2 was 3.96 — pushing straight ahead instead of trucking
sideways calmed it), p90 6.05 (4.74), brightness 0.173 (0.155), colourfulness 17.5 (12.0).

## Misses and deviations, explained
- **Scene changes 0.0 vs 0.77/min.** The source's single scene change is its black "4K" logo card at 72 s. We do not copy
  a channel card; our film ends on a 1.4 s fade from dark navy to black, which stays in the analyzer's darkest histogram
  bin and so is not counted. In absolute terms the difference is one event; the format's rule (0 cuts, one colour family
  for 70 s) holds.
- **Motion +31 %.** A real 3-D camera pushes ~2 m between 19 stations, the fog drifts and the motes float; the brief
  asks for a moving camera and a change every 2-3 s. Holds are slow pushes, never still.
- **Colourfulness +46 %, brightness +12 %.** The amber halos are real light scattered in volumetric fog.
- **84 s** is close to the 85 s ceiling: the story needs its 31 lines; the epilogue (74-84 s) is the rewatch device.

## Iterations
1. First snapshots: objects too large at a 30° fov, fog invisible, a padlock visible *through* glass two stations
   ahead, "300" blown out → fov 40°, glass opacity 0.96, fills 1.2-1.5 m out, 3-D noise stretched, march capped, halos ×7.
2. Stations visible early → visibility windows; empty slabs → pop-ins; orphan words → wider bubbles.
3. Render 1 → closer framing, toggle hold, number glue in captions, softer labels, cloudier fog (render 2).
4. Coordinator's fix pass → voice glass + text intensity rule, caption-band clearance, the pop-through transit grammar
   with light fades, the mask frame check (renders 3-5; render 5 delivered).

## What reads well / what doesn't
- Well: the hook (a voice erased on frame 0); the padlock planted at 10 % and opened at 54 %; his message as its real
  waveform; the receding column of amber bubbles on "Every Sunday, he did."; her greeting, now sharp on deep blue glass,
  glitching into the default; the bill with eight PAID stamps; transits that always show the next object.
- Less well: the fog reads as dark atmosphere with halos rather than the source's visible cloud blotches; June's avatar
  is icon-like rather than a face; the camera never fully stops (holds 0.8 % vs the source's 21 %).

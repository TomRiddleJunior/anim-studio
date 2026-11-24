---
name: explainer-glow-story
description: "Makes a vertical 9:16 first-person micro-story reel (65-85 s) told with glowing UI objects floating in dark navy fog, in one continuous camera move with 0 cuts, in the format of a viral Instagram reel (@4k.tv, reel DfIGvFNse8c, 162k likes): a narrator with a strange job confesses it in the first line, an anomaly built from numbers, a rule the narrator breaks, a twist that recontextualises everything, a line to the viewer and a quiet act of kindness as the last line. Each line gets its own object (a key, an avatar card, a clock, a list, a lock marked RESTRICTED, a toggle, a phone, chat bubbles) in warm amber against cold ice-blue; captions are one 1-4 word phrase low-centre in grey with the spoken word lit white; a quiet felt piano. Built in code with HyperFrames + three.js and made physical: smoked frosted-glass slabs with bevelled edges and clearcoat, brushed anisotropic metal, paper, emissive canvas faces that bloom, a volumetric fog raymarched through 3-D noise and lit by point lights (halos behind objects), bokeh depth of field, dust motes as true circles of confusion, film grain; a voicemail/telephone sound kit (line EQ, ring, beep, breath). Use for 'glow story', '4k.tv style', 'glowing UI objects in fog', 'dark navy motion graphics story', 'first-person twist story reel', 'grief / tender twist short', 'strange job confession', 'one-take UI storytelling', 'storytime reel with icons', or any short confession told through interface objects. Builds on explainer-engine."
---
# Glow story — a first-person confession told with glowing objects in navy fog, one take

Reverse-engineered from one Instagram reel (**@4k.tv**, `DfIGvFNse8c`, 77.8 s, 161,690 likes; frame-by-frame notes in
§14 and `references/sources.md`). The format is a **first-person micro-story with a twist**: a narrator with an odd
job, an anomaly in numbers, a broken rule, a twist that recontextualises the first line, a line to the viewer and a
small kindness as the last line. The look is a dark navy fog in which one glowing interface object per line floats,
filmed in **one continuous camera move**. Original work only: our story, our objects, our sample.

Sample: `the sample film (the render is not included in this repository)` — **"Unheard"** (84.0 s): "I erase
people's voices for a living." A voicemail wiper finds a box with 412 unheard messages, all from one number, every
Sunday at 6 p.m.; the box belonged to June, who died eight years ago; every message is nine seconds long. The narrator
breaks the rule and presses play: "Hi, June. Just wanted to hear you." The twist: he was never leaving messages, he was
calling to hear her greeting ("Hi, it's June. Leave me something nice."), and a wipe would erase it. Last line: "So I
cleared his messages. And I kept her voice." Coda: Sunday, 6 p.m., her greeting answers again.

## 1. Signature traits
- **One take, 0 cuts.** The camera drifts from object to object through fog; every change is a pop-in, a morph, a counter,
  a slide or a push to the next object. The analyzer must read 0 cuts.
- **One object per line**, centred in the upper part of the frame (content centre at 34 % of the height, nothing in the
  caption band at 64-68 %): the job's object (a key, a waveform), a grid, a big number, a list with one amber row, a clock, a count of days, a
  profile card with dates, a column of identical values, a padlock "RESTRICTED", a toggle with a cursor, a message player,
  chat bubbles, a phone, a setting switched on.
- **Two colour families**: warm **amber** = the person who matters, the past, the anomaly; cold **ice-blue** = the system,
  the other voice, the present. Everything else is navy and grey. Colour lives only in emissive lines and halos.
- **Captions**: one 1-4 word phrase at 66 % of the height, light grotesk, grey; the spoken word lit white. No caption
  while a bubble on screen carries the words.
- **Sound**: one close narrator + a quiet felt piano ~20 dB under. Our sample adds a telephone kit for the voicemail
  voices (line EQ, hiss, clicks, a ring, the record beep, breaths) and four near-silent foley ticks.

## 2. Target metrics
Source: engine analyzer metrics (analysed locally for reference only). Sample: the sample render's `out/qa/metrics.json` (not included; the project is `assets/sample/`).

| metric | source | sample "Unheard" | gate |
|---|---|---|---|
| duration | 77.8 s (68 s story + 10 s epilogue/logo) | 84.0 s | 65-85 s |
| hard cuts | 0 | 0 | 0 |
| scene changes / min | 0.77 (its one change = the black logo card) | 0.0 (we end on a 1.4 s fade, no logo card: one event fewer) | ±20 % or explained |
| WPM overall | 132.7 | 124.3 (analyzer, from the SRT) / 132.2 (tts) | ±20 % |
| first word · first frame | 0.1 s · the DELETE key | 0.16 s · the glowing waveform being erased | ≤ 0.4 s · subject on frame 0 |
| loudness · true peak | −14.1 LUFS | −13.9 LUFS · −2.3 dBTP (mastered mix remuxed in, see §12) | −14 ±1 · ≤ −1 dBTP |
| voice over music | ~20 dB | 20.7 dB | ≥ 10 dB |
| brightness · colourfulness | 0.155 · 12.0 | 0.185 · 17.6 (amber halos in real fog) | not gated |
| motion mean | 1.98 | 3.96 (a moving 3-D camera; see §6) | not gated; the brief asks for a moving camera |

## 3. Script formula (beat map, % of the spoken story)
| % | beat | ours ("Unheard") |
|---|---|---|
| 0 | **Hook**: the job, stated as something shocking, on the first word | "I erase people's voices for a living." |
| 3-5 | **Deflating clarification** (turns shock into curiosity) | "Voicemail, I mean." |
| 5-12 | **Routine with a number** + **the rule** stated early (so breaking it lands) | "When a mailbox fills up, I wipe it. Three hundred a day. We're never allowed to listen." |
| 12-15 | **Open loop** | "Last winter, one box wouldn't stop filling." |
| 15-35 | **The anomaly in numbers** (3-4 numbers, one per line) | 412 messages · none heard · one number · Sunday 6 p.m. · 412 Sundays |
| 35-45 | **Who / a death / a detail that doesn't fit** | June died eight years ago · someone still paid her bill · every message is nine seconds |
| 45-55 | **The stakes** (what the job would destroy) | "I was supposed to wipe it. A wipe erases her greeting, too." |
| 55-60 | **The rule broken** | a one-line admission + "I pressed play." |
| 60-75 | **Twist that recontextualises** (a second voice may speak) | his 9 s: "Hi, June. Just wanted to hear you." → "He was calling to hear this." → her greeting |
| 75-85 | **Consequence** + **line to the viewer** | "Wipe it, and next Sunday he gets a stranger." · "You probably know a number like that." |
| 85-100 | **The quiet kindness** as the last line (recontextualises line 1) | "So I cleared his messages. And I kept her voice." |
| + | **Epilogue**: the two voices once more, then a fade | Sunday 6:00 PM: ring, her greeting, the beep, his line, "1 NEW MESSAGE" |

- 28-32 lines, 2-9 words each, **165-175 words**, ~130 WPM overall (~185 while speaking at Kokoro 0.96).
- The twist must be **tender and plausible**: grief, routine, technology doing something human. Never name an emotion; no
  crying, no music swell. Numbers are exact and repeated ("Four hundred and twelve messages… Four hundred and twelve
  Sundays").
- Write numbers in words for Kokoro ("Four hundred and twelve"); "Six p.m." reads well.

## 4. Visual system
| role | source (measured) | ours (kit `LOOK`) |
|---|---|---|
| fog / background | `#171e29` `#0f161e` `#262a34` `#0a1016`, lighter `#3f414a` patches | raymarched in-scatter, `amb` (0.0145, 0.0205, 0.034) linear, cloud lighting from 3-D noise |
| amber (him, the anomaly) | `#e8a25a`-ish | `#ffb25e`, hot `#ffd29a` |
| ice (the system, her) | `#cfe0ff`, `#7fa3e6` | `#cfe2ff`, dim `#8fa6c8`, blue dots `#6f9bff` |
| neutral | greys | `#6c7689`, `#3a4352` |
| glass | smoked navy cards, 1-2 px glowing edge | `MeshPhysicalMaterial` opacity 0.96, roughness 0.34, clearcoat 1, a frosted colour map, bevel 8 mm, emissive `#0c1422` |
| voice glass (bubbles, greeting card) | dark cards under bright text | ice: colour `#86b4e6`, emissive `#16304a`, opacity 0.97, env 0.5 (renders ≈ `#16304a`-`#1c3a58`); amber: `#e6a878` / emissive `#2c1a0c` |
| metal | — (flat icons) | brushed anisotropic `MeshPhysicalMaterial` (metalness 1, roughness 0.2-0.36, streak roughness map) |

- **Light**: per station one **focal light behind the object** (halo in the fog: forward scattering, `fog` gain 1.2-1.8) and
  one soft fill 1.2-1.5 m in front and above (never close: a near front light makes a hot clearcoat spot on the glass).
  Because the next station waits straight ahead, a station's back light sits on the camera path: lights fade out in
  0.35 s when the camera leaves their station and fade in 0.1-0.55 s after the next one pops.
- **Fog**: density ramps from 0.09/m near the lens to 0.42/m beyond 4.4 m, so the in-focus object (1.4-2.0 m) is clear
  and the next station 4-6 m away is a ghost; march capped at 9 m so cloud structure stays visible (a saturated march
  is flat). 28 steps at half resolution, jittered, occluded by depth.
- **Grade**: ACES filmic, saturation 0.82, vignette 0.55, navy toe lift, 3-level bloom 0.22 above 0.75, chromatic fringe
  1.1 px, seeded grain 0.032. Brightness ~0.17, colourfulness ~15.
- **Text intensity rule**: rims, icons, waveforms and big numbers may glow (face HDR 2.3-2.6). Words that must be READ
  (bubble text, card titles, labels) are drawn at an effective intensity of ≤ ~1.3 (text alpha 0.46 on a 2.6 face, labels
  at HDR 1.3) with a canvas halo of 0.07 × the font size (a 2-4 px glow on screen), on a dark glass fill, so the bloom
  never smears letters into the fill.
- **Layout (9:16)**: vertical fov 40°; content centre at 34 % of the height (`hold()` aims the camera 16 % of the frame
  height below the content), objects ~60-70 % of the width, content ≤ ~50 % of the frame height, and **no object pixel
  in the caption band** (y 1222-1302 px) at any frame, checked by `tools/frame_check.py`.

## 5. Objects (the kit: `assets/kit/glow-kit.js`)
`const G = GLOW.create({ canvas, width: 1080, height: 1920, look: {...} })`, then:
- `G.panel({ w, h, r, d, hdr, cw, margin, glass, noSlab, draw(ctx, CW, CH, state, px, mg, panel) })` → a bevelled
  frosted-glass slab + an additive emissive canvas face (`px` = canvas pixels per metre). `p.set(state, glow)` redraws only
  when `state` changes (JSON key) and fades the face with `glow` (seek-safe). `noSlab: true` = a floating label.
- `G.key({ w, h, label })` (`press(k)`), `G.toggle({ w, h, label })` (`set({ on, onColor, labelColor }, a)`),
  `G.padlock({ s })` (`set({ open, drop, glow })`: shackle pops, then the lock falls away), `G.clock({ r })`
  (`set({ h: hours, glow })`), `G.phone({ w, h, draw })`, `G.dots({ n, r, square })` (instanced emissive discs/squares,
  `set(i => [x, y, z, scale, hex, hdr])`), `G.rings({ n, r0, r1 })` (incoming call), `G.paper({ w, h, draw })` (a lit,
  slightly curled sheet: bills, notes).
- Drawing helpers `G.D`: `rr`, `text` (glow + crisp core, letter-spacing), `stroke`, `fill`, `edge` (the glowing card
  edge), icons `voicemail`, `play`, `mailbox`, `phone`, `heart`, `warn`, `check`, `avatar(kind "she"|"he")`.
- `G.render({ t, cam, look, fov, roll, focus, aperture, lights: [{ pos, color, i, fog, spot }], black, exposure, fog })`.
  With `window.GLOW_MASK = true` (set by `tools/build.py --mask`) it draws every visible object white on black with no
  post, for the framing check.
- Every emissive thing either sits on a slab (the face) or is opaque geometry (dots, hands, rings): both write depth,
  so the fog and the depth of field treat them correctly. Faces write depth only where their strokes are solid
  (alpha-tested depth material), never in their glow margin.

## 6. Motion grammar
- **Camera**: `hold(anchor, t0, t1, d0, d1, opts)` keys per station: a slow push (8-12 % closer) while the lines play,
  then an eased **~1 s push** to the next station, which waits **straight ahead, 2.1 m deeper, ≤ 0.12 m to the side**.
- **Station pop (the transit grammar)**: each station is hidden until the camera leaves the previous one; then it **pops
  in already inside the frame** (scale 0 → 1, 0.42 s, 1.4 overshoot) while the old station **scales out** (0.32 s, ease
  in). The pop timings derive from the `hold()` keys (`st.tin`, `st.tout`), so the next object is framed within ~0.3 s,
  nothing is ever half off-frame on a hold, and no object enters cut off at an edge. Holds are near-linear, pushes ease
  in-out; the aperture opens slightly mid-push. Handheld weight: ±6 mm, ±0.25° roll, slow sines.
- **Objects**: faces fade up as the camera arrives; late objects **pop** (scale 0 → 1 with a 1.4 overshoot in 0.38 s,
  the source's card pop); counters ease out (398 → 412, 412 → 0); bubbles reveal word by word on the voice's word times;
  the clock hands sweep and settle on the spoken time; the padlock opens then drops; a cursor glides to a toggle and
  hovers.
- **Light changes are ramps ≥ 0.3 s** (amber floods on "kept", the cold switch on "died"), never flashes.
- Something changes every 1.5-3 s; the longest still moment is ~3 s under the rule-break.

## 7. Transitions (0 cuts)
| name | build | when |
|---|---|---|
| pop-through | old station scales out (0.32 s) as the next pops in ahead (0.42 s); the camera pushes ~2 m in ~1 s | between stations, starting on the last word of a beat |
| pop-in | `pop(group, t, start)` | bubbles, late cards, toggles, the bill (never show an empty slab, never slide through the caption band) |
| morph on a canvas face | state-driven drawing (bars → flat line → voicemail glyph) | the clarifying beat |
| dim-and-replace | the old face dims to 0.06-0.15, the new floating label pops in front | big numbers over lists/grids |
| tilt within a station | two `hold()`s on one anchor with different content centres | toggle → card above it |
| glitch swap | horizontal-slice offsets for 0.4 s between two drawings | the "stranger" default greeting |
| final fade | `black` ramps 1.4 s at the end | the last hold (no logo card) |

## 8. Caption system
`tools/build.py` writes `compositions/captions.html` from `vo/data/vo.json`:
- phrases of 1-4 words / ≤ 21 characters, breaking at punctuation; a lone sentence-final word borrows the previous word
  ("allowed / to listen."); spoken numbers stay together ("Four hundred and twelve / messages.");
- `font: 440 47px "GInter"` (Inter variable), centre at y 1262 px (65.7 %), grey `#7d838e`, the spoken word `#f4f6fa`
  with a faint glow, 0.06 s on / 0.1 s back; phrase fade-in 0.14 s with a 6 px rise, fade-out 0.12 s;
- lines with `"who"` other than the narrator get **no caption** (their bubble is the caption) but **are** in the SRT.

## 9. Sound (`tools/score.py`, data in `vo/script.json["score"]`)
- Narrator `af_heart` 0.96 (close, a 0.45 s room at 6 %); second voices through `phone_line()` (320-3300 Hz, tanh
  saturation, presence bump): him `bm_george` 0.84, June `bf_emma` 0.9.
- `events`: `hiss` spans, `click`, `breath`, `ring` (440+480 Hz, warbled), `beep` (1 kHz, 0.42 s), foley `glass` / `metal`
  at times like `"l21:play+0.12"`, `"m1.start-0.85"`, `"g2.end+0.42"`.
- `piano`: felt piano in A minor from the first frame (8-bar loop, bar ≈ 3.7 s); `dyn` thins it to bass + one note under
  the rule-break (velocity < 0.65), opens it at the twist; an open Fmaj(add9) rings from `final` to the end. ~18 dB under
  the voice before a 3 dB sidechain dip (≈ 21 dB while speaking).
- Pre-gain + look-ahead limiter (ceiling −2.6 dBFS) so the two-pass `loudnorm` stays **linear**; −14 LUFS, TP ≤ −1.5.

## 10. Retention devices (and where they sit in "Unheard")
| device | time |
|---|---|
| hook: the job's object glowing at frame 0, first word 0.16 s | 0.0 |
| deflating clarification | 2.8 |
| the rule stated early | 8.7 |
| open loop (12 %) | 11.1 |
| escalation every 6-10 s: 412 → Sunday 6 p.m. → 412 Sundays → June died → nine seconds → greeting would be erased → rule broken | 14 · 20 · 23 · 28 · 32 · 39 · 42 |
| second voice (the payoff of "never allowed to listen") | 47.3 |
| twist (66 %) + her voice | 53.4 · 55.7 |
| line to the viewer (77 %) | 64.8 |
| kindness, recontextualising line 1 (86 %) | 72.0 |
| epilogue that replays both voices (rewatch device), then a fade | 74-84 |

## 11. Do / don't
- Do: one object per line; numbers on screen exactly as spoken; amber for what matters; pop late objects in; pop the
  next station in straight ahead as the old one scales out; light it from behind; put readable words on dark glass at
  ≤ 1.3 intensity; keep captions grey with one lit word.
- Do: let the second voice be heard through a phone line and shown as a bubble (no caption under it).
- Don't: cuts, whip pans, camera shake, flashes, kinetic captions, bright backgrounds, saturated colour fields, a music
  swell, an empty glass slab on screen (pop it), a light right in front of glass, an object in the caption band, a pale
  fill under white text (the bloom smears it), an object half off-frame on a hold.
- Don't copy the source's story, its DELETE-key/hand illustration, its corridor or its "4K" logo card.

## 12. Build recipe
```bash
cp -r ~/.claude/skills/explainer-glow-story/assets/template my-glow && cd my-glow     # runnable 10.4 s, 3 stations
# 1) the script: vo/script.json (narrator lines + optional "who" lines with their own voices + "score")
~/.generative-music-video/venv/Scripts/python.exe -I "engine/audio/tts.py" vo
# 2) the stations: assets/lib/film.js — one object (or group) per line, update(t) keyed to V.w(line, word),
#    lights(t), a visibility window, hold() camera keys. The full 19-station film: assets/sample/assets/lib/film.js
python -I tools/build.py          # vo-data.js, captions.html, world.html, index.html, out/<name>.srt
python -I tools/score.py          # score/final.wav, assets/audio/final.m4a, score/levels.json
export PATH="engine/node_modules/ffmpeg-static:ffmpeg-bin/node_modules/ffprobe-static/bin/win32/x64:$PATH"
npx -y hyperframes@0.8.210 check --json
npx -y hyperframes@0.8.210 snapshot -o scratch/snap --at 0,3.6,7.8 --no-end     # ~10 s per batch: iterate here
python -I tools/look_metrics.py scratch/snap                                       # brightness/colour vs source
python -I tools/build.py --mask && npx -y hyperframes@0.8.210 snapshot -o scratch/mask --at <every 0.125 s> --no-end --keep   # ~2 min
python -I tools/frame_check.py scratch/mask && python -I tools/build.py             # caption band + edges, then back to normal
bash "tools/render_locked.sh" "$PWD" out/<name>_master.mp4 delivery   # run in background
ffmpeg -i out/<name>_master.mp4 -i score/final.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 20 -maxrate 12M \
  -bufsize 24M -pix_fmt yuv420p -c:a aac -b:a 256k -shortest -movflags +faststart out/<name>.mp4   # under with_render_lock.sh
```
- **Mux the mastered audio** (`score/final.wav`) into the posting copy: HyperFrames' own audio pass returned the mix at
  −14.9 LUFS with a raised peak; the mastered file is −13.9 LUFS / −2.3 dBTP.
- Render time on the Intel UHD 770 (2 workers): 84 s of film in ~3.7 min. The delivery master is ~650 MB (grain is
  expensive to encode): always make the 12 Mbit/s copy for posting (~125 MB).
- `python` = the generative-music-video venv (numpy, scipy, soundfile); whisper needs `~/anaconda3/python` (faster-whisper).

## 13. QA gates
```bash
~/anaconda3/python -I "engine/qa/analyze_video.py" out/<name>.mp4 out/qa   # SRT beside the mp4
python -I tools/qa_sheets.py out/<name>.mp4 [--ref <reference.mp4>]   # out/qa/sweep_1.jpg + sweep_2.jpg (2 fps, LOOK at them), yavg.json; compare.jpg only with --ref
~/anaconda3/python -I tools/whisper_check.py out/<name>.mp4   # out/qa/whisper.txt: every line vs the script
```
- Gates: duration 65-85 s; 0 cuts; WPM within ±20 % of 132.7; −14 ±1 LUFS, TP ≤ −1, voice ≥ 10 dB over music; first word
  ≤ 0.4 s with the subject on frame 0; no YAVG dips; Whisper reads every name and number.
- `tools/frame_check.py` on mask frames every 0.125 s (672 for 84 s): **0 caption-band hits, 0 frames (held or transit) touching any of the four edges**.
- In the sweep: no frame without an object for more than ~0.3 s, no empty slabs, readable words sharp (2-4 px halo) on
  dark glass, the next station never sharp in the background, text readable at phone size.
- `hyperframes check` reports `dead_stretch` while a second voice speaks: the checker only sees DOM changes, and those
  stretches change on the WebGL canvas (bubble words, playhead). Expected.
- Gotchas met on the sample:
  - A front fill closer than ~1 m to glass makes a hot clearcoat spot that reads as a flare; put fills 1.2-1.5 m out.
  - Transparent glass that writes depth shows unfogged objects behind it: keep glass opacity ≥ 0.95 and stagger stations
    so the one two stations ahead is not directly behind the current one.
  - Content faces must not write depth in their margin (a fog-free frame around every card); the kit's alpha-tested face
    depth material handles it. Free-floating additive cards would be attenuated by the full fog depth: use real geometry.
  - Value-noise fbm bunches near 0.5: stretch the 3-D noise to 0-255 or the fog has no structure; cap the march (9 m) or
    the in-scatter saturates to a flat colour.
  - Station objects ahead are visible early in a 40° frame: give each station a visibility window (derived from the
    `hold()` keys) and pop it in; with lateral offsets, objects entered cut off at the frame edge (fixed in render 3).
  - Bloom smears bright text into a pale additive fill: colour the glass, not the face, and keep text ≤ 1.3 intensity.
  - Kokoro's peaks push `loudnorm` into dynamic mode: limit first (score.py does).
  - Whisper hears "One you'd call…" as "when you'd call…" (a homophone, not a misread; the caption is right).

## 14. Source analysis (frame by frame)
Measured: 77.8 s; 0 hard cuts; 0.77 scene changes/min (the only one is the fade to the black "4K" logo card at 72 s);
132.7 WPM overall (~152 while speaking, 172 words); motion 1.98 (p90 4.74, holds 21 %); brightness 0.155, colourfulness
12.0, saturation 0.41; palette `#171e29` 25 %, `#0f161e` 22 %, `#262a34` 21 %, `#0a1016` 12 %, `#3f414a` 8.5 %, black 7.7 %;
−14.1 LUFS; narrator f0 median 192 Hz; piano bed ~20 dB under the voice peaks.

| t (s) | beat | on screen |
|---|---|---|
| 0.1 | hook: the job, stated as a shock | a dark keyboard, a glowing DELETE key, a silhouetted finger; a figure at a desk behind |
| 2.6 | deflating clarification | the key dissolves into a 3×4 grid of avatar circles |
| 4.3 | the routine's input | one avatar grows into a profile card; a document icon slides in |
| 6.2 | the routine with a number | check badge; "DELETED 001…005"; a big glowing "400" over a list |
| 10.1 | open loop | a scrolling list, one dot turns amber |
| 13.2 | the person (a death) | zoom into that avatar: a circle with a warm halo, "1951 — 2023" |
| 15.8 | the anomaly: an exact time | an analogue clock sweeping to 7:00, "7:00 AM" |
| 18.4 | the anomaly: one recipient | a bubble slides from the clock to a small avatar |
| 21.0 | the message itself (the bubble carries the words) | one big amber bubble; no caption under it |
| 22-26 | how, and how many | a stack of amber bubbles, "1,084 MORNINGS" |
| 26.2 | the stakes (the job would end it) | a STOP toggle, a cursor hovering |
| 28-38 | the second anomaly: a reply, every day | 7:00 amber bubbles answered by 7:01 blue ones; a short reply; a column of "7:01", one highlighted with a sparkle |
| 39.2 | the anomaly's punchline | the column collapses into one thin amber line |
| 42.3 | the rule broken | a card with a padlock, "RESTRICTED", blurred terms |
| 45.0 | the second person (a death) | her avatar, "1954 — 2025" |
| 48.5 | twist | a phone "7:01 · REPEAT DAILY"; a hospital bed with a monitor line |
| 53.2 | the twist as an image | a corridor of dots receding to a vanishing point, two lights |
| 58.5 | consequence: the narrator is the only witness | a silhouette whose glasses reflect the bubbles, pulled back to a desk |
| 60.6 | line to the viewer | a phone with a chat list, a finger |
| 64.4 | callback to the first image | the DELETE key again, unpressed (callback) |
| 65.9 | the kindness (last line) | two avatars with amber online dots, "STILL ACTIVE" |
| 68-71 | epilogue (Whisper's VAD missed it) | the 7:00 amber bubble / the 7:01 blue reply |
| 72-77.8 | — | black, the channel's logo, piano tail |

Files: references/sources.md · assets/kit/glow-kit.js · assets/tools/ (build.py, score.py, piano.py, qa_sheets.py,
look_metrics.py, whisper_check.py, frame_check.py) · assets/template/ (runnable 3-station demo) · assets/sample/ (the full "Unheard" project)

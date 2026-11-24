---
name: explainer-satire-globe
description: "Makes a narrated satirical world-news film in HyperFrames (HTML-to-video) on one camera that fuses a real three.js NASA Blue Marble globe (dotted land orb, great-circle flights, orange pings, dives onto 4096 px NASA patches, a finale where the planet unwraps into a flat world map), a paper-dossier layer whose documents lie ON the real terrain at lat/lon (real headline screenshots captured with `hyperframes capture` as pinned clippings, typed verbatim quote slips, red rubber/passport stamps that slam on the voice, a red thread from the ping, whip pans with matched motion blur), and investigative data cards (Oswald headlines, count-ups, comparison bars, a seat hemicycle, struck-through twist numbers). The sample frames the week as an airline flight: a deadpan captain's cabin announcements (local Kokoro TTS with a PA EQ), a split-flap departures board that flips each story's status, a whip to a cabin window and a push through it into space, passport-style status stamps, an arrivals board on the flat map, and an upbeat synthesized score (or a MiniMax-Music3 bed via the engine mixer). 100-150 s, one continuous flight, no hard cuts. Use for 'satirical news recap', 'weekly world news in a funny way', 'global politics explainer with a globe', 'news roundup with newspaper/tweet screenshots', 'three.js globe video', 'dotted globe / orb', '3D world map with hotspots', 'split-flap departures board', 'in-flight / airline parody', 'dossier on a map', 'documents on satellite imagery', 'data cards + globe', 'HyperFrames globe'. Other framings (an OS patch-notes parody, a phone line, a weather forecast) reuse the same kit."
---
# Satire globe — the week's news, flown and filed

A narrated satirical news film where **the framing carries the joke and every fact is real**. The sample, *Holding
Pattern* (`samples/satire-globe`, 146 s, 28 Oct 2026), is an airline flight: a split-flap DEPARTURES board flips six
destinations and their statuses ("none of them are on time"), the camera whips to a cabin window, pushes through it
into space, and a deadpan captain announces each stop as the camera flies the great circle and dives onto the NASA
imagery of the place. There, the case file is already lying on the terrain: the outlet's own page as a pinned clipping
with the key line boxed, a typed verbatim slip, an investigative data card whose number counts up on the spoken word,
and a red passport-style stamp with the status (CLOSED · IN COURT · DELAYED · DISPUTED · CONCEDED · ARRIVED). The
finale pulls back, **unwraps the planet into a flat world map** beside a split-flap ARRIVALS board whose statuses flip
on the recap, and lands the title as an exit stamp. Read the `hyperframes` skill first (contract, work loop, review);
this skill is the look, the copy formula and the kit. It borrows the paper grammar of **explainer-dossier-editorial**
(English edition) and the card system of **explainer-data-cards**. Earlier framings of the same sample (an "Earth OS
patch notes" parody, music-only and narrated) stay in the project folder as `v1/`, `v2/` and their renders.

## 1. Identity and signature traits
- **Three layers, one camera** (`assets/kit/film.js`): every layer reads one pure function of root time.
  - *globe* — one three.js canvas for the whole film (`compositions/globe.html`, kit `earth-os-globe.js`): 12,355 land
    dots on a dark core (assembling from a swirling cloud), NASA Blue Marble 5400 px with a fresnel rim and an
    atmosphere shell, 4096 px patches (240 px/deg) for the dives, camera roll, a flat-map unwrap, accumulation blur.
  - *paper* — documents pinned to lat/lon (`assets/kit/desk.js`): desk px = ground px at the reference altitude 0.145
    (206 px/deg); `FILM.place()` projects each document through the exact globe camera.
  - *frame furniture* — whatever the framing needs, in screen space: here a split-flap departures/arrivals board, a
    cabin wall with a window and a seatbelt sign, a top bar (title · date · STOP n OF 6), an arrival strip (place,
    lat/long, STATUS chip), a location tag pinned beside the ping and a red thread to the first document's pin.
- **Paper on the planet**: newsprint clippings (real screenshot, torn edge, red pin, tape, orange key-line box), a
  ruled index card (status history typed per line), typed slips (verbatim quotes only), data cards (cream ruled sheet,
  `| IN-FLIGHT BRIEFING` chrome, `STOP 0n / 06`, `SOURCE / …` footer with an orange progress rule).
- **Colour has a job per world**: board amber `#ffb020` (statuses, counter); ping orange `#FF6B1A` (pings, chips);
  data orange `#c14800` (numbers, the subject's bar, key-line boxes); stamp red `#c4342a` (judgement words only).
- **Stamps**: passport style (small mono "STATUS · date" line, the word in Playfair Display 900, a small place line,
  8 px double rule, grunge mask, multiply), 2-frame slam from 138 % + ghost + a 0.3 s camera shake shared by globe and
  paper, on the voice's status word. Never on a screenshot or a real person's quote.
- **Type**: Inter (titles) · IBM Plex Mono (console) · Roboto Mono (flaps, typewriter) · Oswald 700 + stroke (data) ·
  Playfair Display 900 (stamps) · Libre Baskerville (index card) — reading text ≥ 28 px at its camera scale.

## 2. Measured metrics of the sample
`out/qa/metrics.json` (`engine/qa/analyze_video.py`), `hyperframes check`, ffmpeg ebur128.

| metric | sample (Holding Pattern) | target for new films |
|---|---|---|
| hard cuts | 0 | 0 (one flight; the opening whip is a camera move) |
| scene changes per min / median scene | 9.5 / 4.8 s | 9–12 / 3.5–5 s |
| motion mean / p90 | 5.85 / 17.7 | 5.5–7.5 / 15–22 |
| hold fraction | 0.178 | ≤ 0.2 (boards and data cards hold still on purpose) |
| colourfulness / saturation / brightness | 35.1 / 0.44 / 0.43 | 30–40 / 0.4–0.6 / 0.35–0.5 |
| narration | 309 words, 159 wpm speaking, 127 overall | 145–165 / 115–130 |
| loudness (integrated / true peak / LRA) | −14.2 LUFS / −1.2 dBTP / 2.2 LU (synthesized score) | −14 ± 1 / ≤ −1 |
| `hyperframes check` | ok, 0 warnings | ok |
| render (Intel iGPU, 4 workers) | 4 min 18 s for 4,375 frames | — |

## 3. Framing, script and copy formula
Pick one **deadpan institutional voice** whose vocabulary already contains status words, so each story compresses to
one honest status: an airline captain (sample), an OS changelog ("ticket closed by its users"), an automated phone
line ("for the Strait of Hormuz, press one"), a weather forecast ("outlook: unsettled"). The voice's genre supplies the
opening set piece (departures board / boot screen / ringing line / forecast sting) and the summary (arrivals board /
ticket board / menu recap / long-range outlook).

Sample voice (Kokoro `bm_george`, speed 1.18, opening 1.08–1.1, ~300 words, 159 wpm while speaking):

| beat | voice | on screen |
|---|---|---|
| opening | "Good evening, ladies and gentlemen. This is your captain speaking. / We'll be making six stops this week. I'm afraid none of them are on time. / Please keep your seatbelts fastened." | departures board: destinations flip, stop numbers land on "six stops", statuses flip on "none of them are on time"; whip to the window; seatbelt sign; push through |
| stop intro (over fly + dive) | "On your left, the Strait of Hormuz." · "Coming up on the right, Juneau, Alaska." · "Below us, Israel…" · "We are now crossing Brazil." · "Approaching Belgrade." · "And finally, Caracas." | chime, flight arc, dive; tag, strip and documents land as the place is named |
| facts | 2–4 short sentences of sourced fact | index card / clipping + slip / data card, whips between them |
| status | "It remains closed." · "The matter is now in court." · "Passengers should expect delays." · "The runner-up has lodged a complaint." · "the ruling party has conceded." · "Welcome home." | passport stamp + chip roll on the status word |
| recap | "A quick recap before we land. One strait, closed. One lawsuit, in court. One count, delayed…" | flat map + arrivals board, one flip and one ping flash per phrase |
| end | "Our next departure is scheduled for November the third. Thank you for flying with us, and for your patience." | "Next departure: 3 Nov", title stamp on "patience" |

**Satire rules** (non-negotiable):
- Real facts only, each traced to a FACTS.md row, with a narration-line → row map; framing lines carry no facts and
  make no forecasts ("expect delays" — never "a short delay").
- No invented quotes, posts, tweets, numbers or headlines. Quotes are read with the speaker named and appear verbatim
  on a typed slip with speaker, date and outlet. Screenshots are cropped and scaled, never retouched.
- No caricatures or drawn faces of real people; real photos appear only inside the screenshots.
- Punch at situations and systems, not voters, victims or groups; no casualties, motives or forecasts.
- Footnote where a joke could be misread ("Runner-up Flávio Bolsonaro is challenging the result · AP").
- Split-flap boards spin letters only; numbers land whole (a spinning digit flashes invented figures).

## 4. Research, FACTS.md, voice and music
1. 5–7 stories from the past 7–10 days with a checkable state change; 2+ sources each.
2. `FACTS.md`: `# | fact as used | source`, a "deliberately left out" line, the narration-line → row map.
3. `vo/script.json` (engine format) → `$EXPLAINER_PY -I ~/.claude/skills/explainer-engine/engine/audio/tts.py vo`.
   Check names with Whisper `small` (Kokoro reads "María" as "Mariah", accent or not). Long colons and commas add
   pauses; trim words rather than pushing the speed past ~1.22.
4. Music: a **MiniMax-Music3** instrumental (`assets/tools/gen_music.py`, the official ComfyUI graph; caption
   "instrumental only, no vocals…", lyrics of section tags only) mixed through the engine's `sound.py` with
   `"music_file"` / `"music_offset"` in `score/sound.json` (ducked and levelled like the synthesized score). MiniMax
   needs a CUDA GPU: on CPU its 8 B autoregressive stage ran ~26 s per frame (25 frames per second of music), so a
   2-minute bed would take about a day — use an existing take, a GPU, or the synthesized `tech-glow` score (the
   sample's choice). Measure
   the take's loudness profile and place its natural breaks on the film's transitions (the sample's 120–125 s break
   lands on the last pull-out; the final section enters with the unwrap).
5. `python -I tools/build_film.py` turns word times into everything else (camera keys, events, sound cues, sound.json).

## 5. Screenshot capture and cropping
- `npx hyperframes capture <article-url> -o captures/<story> --skip-assets --skip-vision --max-screenshots 3 --json`
  → `screenshots/scroll-000.png` (1920 x 1080, 1x). `BLOCKED.md` or a challenge page means it failed: use another
  outlet or a syndicated copy. **Never bypass Cloudflare or paywalls.**
- `assets/tools/make_evidence.py` crops masthead + headline + lead image/paragraph and prints the key-line box in %.
- Captures are 1x: show clippings at ≤ 1.25x. A key sentence in body text stays small — box it on the clipping and
  type it verbatim, large, on a slip beside it.

## 6. Build (the kit)
- `assets/kit/earth-os-globe.js` — renderer: `create({...}).render(state)` / `.renderBlur(states)`; state = camera
  (lat, lon, alt, roll, ox, oy) + looks (assemble, dots, tex, patch, pings, arcs, flat 0–1, atmo, pingScale).
- `assets/kit/film.js` — `FILM.stateAt / cameraAt / project / place`, reading `window.FILM_DATA` (keys, stamps,
  stops, board, assemble window, opening pings) written by the build script.
- `assets/kit/desk.js` — `DESK.mount(cfg)` pins documents every frame and blurs the paper layer; helpers taking ROOT
  times: `drop · type (steps) · count (lands on a word) · bar · dots · box · highlight · strike · rise · fade · stamp ·
  chip`.
- `assets/tools/build_film.py` + `build_film_shell.py` — the sample's generator: per-stop desks (documents in desk px
  around the ping, camera beats `(t, "whip"|"push", (x, y, s, roll), dur)`), the split-flap boards (`flap_cells`, a
  per-frame flap function), the cabin-window opening, the summary, index.html and the sound project. Copy them and
  replace the desks and the framing copy; the worked sample is in `assets/sample/`.
- `assets/tools/gen_music.py` (MiniMax via ComfyUI), `make_land_dots.py`, `make_patches.py`, `make_evidence.py`;
  textures `paper-grain.jpg`, `stamp-grunge.png`, `window-mask.png` in `assets/sample/assets/img/`.
- Imagery: NASA Blue Marble NG only; credit "Earth imagery: NASA Earth Observatory (Blue Marble)" on screen. three.js
  r170 vendored as `assets/lib/three.global.js`.

## 7. Camera, layout and motion
- Fly 1.1 s `power2.inOut` at alt 2.0 (hop 0.9·angle/π) → dive 1.1 s onto the first document (s 0.9–1.0, ping + tag +
  document in one frame) → breathing holds (+1.1 %/s, +0.05°/s roll) → whip 0.37 s `expo.inOut` to a 3.5 % overshoot
  with a ±1.6° roll kick + 0.15 s settle (start 0.3–0.45 s before its line) → pull-out 0.85 s `power2.in`.
- Documents inside the patch (±1,100 px), tops ≥ 150 px (strips own 0–136; desk keys use oy +46), data cards at
  s 1.04–1.12, clippings ~0.9–1.0, a 640 x 112 corridor beside the ping for the tag.
- **Opening set piece**: a full-frame screen-space scene above the globe. The cabin wall is a textured panel masked by
  a PNG with a rounded window hole; the globe composition shows through it. Whip from the board to the wall with both
  elements moving together (no gap) and a 16 px blur peak; the far planet barely moves, which sells the parallax.
  Push through the window by scaling the wall from the window's centre (6.5x, power3.in) while the camera closes in.
- **Split-flap boards**: one schedule row per cell `[id, final, start, flips, seed]`; each frame a cell shows blank,
  a seeded letter (60 ms per flip, the upper-half flap scaling 1 → 0) or its final glyph. Destinations flip ~0.45 s
  apart per row, statuses on the voice's word; numbers appear whole.
- **Motion blur (200° shutter)**: globe = 2–24 averaged sub-frame renders; paper = SVG `feGaussianBlur` along the same
  ground motion vector (layer rotated onto it and back). Leave HyperFrames' `data-motion-blur` off over WebGL.
- Finale: pull back to alt 2.55, `flat` 0 → 1 over 1.7 s while the camera moves to lat 0, lon 0, alt 9.7, ox +322: a
  1,120 px map right of a 640 px board, all six pings visible, numbered labels from the same plane maths.

## 8. Sound
`score/sound.json` + `score/data/cues.json` + `score/data/vo.json` + `score/audio/vo.wav` (the build applies a light
PA EQ to the captain: highpass 170 Hz, lowpass 7.2 kHz, +2.5 dB at 2.6 kHz) + optional `score/audio/bed.flac`, then
`$EXPLAINER_PY -I ~/.claude/skills/explainer-engine/engine/audio/sound.py score` → `final.wav` → AAC `final.m4a` in
`assets/audio/`. Sample: `tech-glow` 120 BPM, energy 1 board / 2 window and stops / 3 summary / 1 end card / 0 + end
hit, `music_under_voice_db −16` (the user preferred it to a MiniMax bed); with a bed: `music_under_voice_db −15`. SFX: ding-dong (two `ding`s, pitch 1.26 → 1.0) before each announcement, `click`
bursts per flap row, `swoosh` per whip, `whoosh`/`woosh_low` flights and dives, `paper` drops, `type`, `scribble`,
`tick` on counts, `stamp`, `riser` + `impact` on the unwrap; `lufs −14`.

## 9. Render and QA
```bash
# HyperFrames needs ffmpeg AND ffprobe on PATH (`npx hyperframes doctor`); the explainer-engine's ffmpeg-static plus
# the npm package ffprobe-static work.
python -I tools/build_film.py                        # after any change to the voice, desks or timing
$EXPLAINER_PY -I ~/.claude/skills/explainer-engine/engine/audio/sound.py score   # then encode final.m4a
npx -y hyperframes@0.8.210 check --json              # fix errors, weigh warnings (dead stretches on boards!)
npx -y hyperframes@0.8.210 snapshot --at <beats>     # board flips, the whip, the window, landings, stamps, unwrap
npx -y hyperframes@0.8.210 render -o out/film.mp4 -q delivery
python -I ~/.claude/skills/explainer-engine/engine/qa/analyze_video.py out/film.mp4 out/qa
```

## 10. Gotchas (all hit on the sample)
- **Fonts**: the compiler embeds only families named in `font-family` rules outside templates; non-bundled families
  need `@font-face` in index.html. The linter flags a bare `font-family: "Roboto Mono"` inside a scene — use the
  `font:` shorthand there.
- **GSAP `fromTo` renders its from-state immediately**: pass `immediateRender: false` to later flashes.
- `rise()` needs a mask parent with a size (an absolutely positioned child collapses the mask to 0 px).
- Stamps inside a clipped `.paper` are cut at its edge: size them (font × 0.72 × letters × 1.06 + 70 px) to fit.
- Rolled-away chip rows and counter digits count as text for the contrast check: fade every non-current row.
- A still board fails `dead_stretch` (> 3 s): stagger the flips over the voice and land extra fields on later words.
- A fade-in on frame 0 fails `first_frame_empty`: start the opening scene fully visible.
- Count-ups show their start value from build time — fade the number in when its count starts.
- `python -I` drops the script dir from `sys.path`: insert it before importing a sibling module.
- Capture: Cloudflare/paywalled outlets write `BLOCKED.md`. Never bypass; use syndicated copies.

Files: references/analysis.md · references/sources.md · assets/kit/ (film.js, desk.js, earth-os-globe.js; v1
director + ui css) · assets/tools/ (build_film.py, build_film_shell.py, gen_music.py, make_*.py) · assets/template/
(v1 runnable, music-only) · assets/sample/ (Holding Pattern source)

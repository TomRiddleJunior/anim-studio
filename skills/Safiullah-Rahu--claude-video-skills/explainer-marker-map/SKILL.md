---
name: explainer-marker-map
description: "Code-only map explainer in the Johnny Harris / RealLifeLore look: real Sentinel-2 satellite close-ups (EOX cloudless 2016, CC BY 4.0) cut out over a drawn navy sea, a vintage paper map for every wider view, a boiling red marker drawn on top, physical paper callouts (taped tags, torn strips with highlighter, tear-off calendar pages, price tags, clocks, passports, a red rubber stamp), one continuous camera with Google-Earth pull-outs, a calm fast narrator (Kokoro am_michael). One HTML canvas page renders every frame as a pure function of time; events are keyed to words, not seconds. Renders 1920x1080 and a re-laid 1080x1920 reel. Use for 'map explainer', 'Johnny Harris style', 'RealLifeLore style', 'satellite + paper map video', 'red marker on a map', a border / island / exclave / date line / route story with one surprising fact, 'map reel', 'geography short'. Not for the dark 3D map-plate documentary look (that is explainer-map-documentary)."
---
# Marker-map explainer: satellite close-ups, paper map, red marker

**What it makes.** A 30–45 s map story told in one continuous camera:
- real satellite imagery for the close-ups;
- a vintage paper map for everything wider;
- a red marker that boils like ink;
- paper props that slap in on their words.

Everything is drawn in code. There is no AI imagery and no stock footage.

**Where things live:**
- **Working install:** `map-films\`. `engine/` is the renderer and tools, `_vendor/` holds data, fonts and the tile cache, and there is one folder per film.
- **Engine docs:** `engine/README.md` has every command, the `story.js` schema, the word-key syntax and all the event types. `engine/CHANGES.md` lists the props added by later films.
- **Original spec:** `PROMPT.md` in this skill, the user's prompt verbatim. It is the reference for the look.
- **Fresh machine:** `bash setup/setup.sh "<root>"` copies `engine/` from this skill and installs `_vendor`.

**Rendered samples**, each with a CRF 19 master, an `_upload` copy (~85 MB) and a `POST.md`:
- `map-films/diomede/out/diomede_{16x9,9x16}.mp4`: "See Tomorrow", the date line between the Diomedes, 40.3 s.
- `map-films/point-roberts/out/…`: "Four Borders to School", a US exclave below the 49th parallel, 40.2 s.
- `map-films/bir-tawil/out/…`: "Nobody's Land", the 1899 vs 1902 lines, 41.8 s.

Their `story.js` and `script.json` are copied into `examples/` as templates.

## Workflow (keep this order)

1. **Get the story.** Ask for a map story in one line (a place, border, island, route or line, plus one surprising fact) and the length (30–45 s). If they have none, pitch **3**, each with a hook line in the form "From this ___, you can ___", and let them pick (they may pick all three). Ask about the format too: the 16:9 master, the 9:16 reel, or both. Both come from the same page.
2. **Fact-check every fact on Wikipedia before you write a word.** Note the source for each beat. Anything only implied, such as "into tomorrow", gets flagged to the user.
3. **Write the script** in short lines, about 10 per 30 s at about 175 wpm. That is 110–120 words for 40–45 s; `am_michael` at 1.18 speaks 111 words in about 38.5 s. Map each line to its beat (below). **Show the script and wait for approval before recording any voice.** Build the picture against stub timings meanwhile (`stub.py`).
4. **Build** (see `engine/README.md` §Pipeline). Commands:
   - `satellite.py <slug>`
   - `stub.py`
   - `render.py --sheet 30` in both formats; look at the sheets and crops and fix what doesn't read at phone size;
   - after approval: `phonemes.py` on every place name and add it to `respell`;
   - `voice.py`;
   - `align.py`, then read its per-line Whisper check;
   - `mix.py`;
   - `render_locked.sh <slug> 16x9 9x16`;
   - `qa.py`.
5. **Check the finished mp4s, not the page.**
   - Make a 1 fps contact sheet of each format and look at it.
   - Run faster-whisper on the final *mixed* audio and diff it against the script, to catch music masking the voice.
   - Check every on-screen fact against the script's sources.
6. **Deliver.** Make an upload copy (`-crf 22 -maxrate 16M -bufsize 32M`, AAC 192k, `+faststart`), because the CRF 19 masters run about 200 MB for 40 s. Write `POST.md` in a calm tone, with the AI-voice line and the imagery credit line. For a reel, add it to `reels-upload-kit\make_kit.py`.

## Beat structure (the spec)

The camera never cuts. Every event is keyed to a word.

| beat | what happens |
|---|---|
| hook (0 s) | tight on satellite of the subject; a red marker circle draws around it on the key word, with a handwritten word beside it |
| names | a paper tag slaps onto each place on its name; its subtitle types in on the next word |
| key number | a dashed red measuring line or route draws in; a black tag counts up to the number |
| context | a Google-Earth pull-out (about 1.3 s) from satellite to the paper map at continent or ocean scale; the big line, border or route draws in red marker with a handwritten label; dive straight back in |
| consequence | 2 physical props (calendar pages, clocks, price tags, passports, flags) pop in on their words, and one flips |
| local twist | torn paper strips with a yellow highlighter swipe |
| story | a red stamp slams the year with a camera shake; the frame splits into two tinted sides along the real line; a tracker card (date, time, counter); a dotted path with a moving marker crosses the line on the right word |
| ending | pull all the way back to the big map with both sides tinted and a red circle on the subject; a paper end card whose number is scribbled out and replaced in marker by the punchline; hold 1.5 s after the last word |

## Look (fixed by the engine; see PROMPT.md for every value)

- **Satellite:** masked land over a navy sea (`#14304A` → `#0B1E31`) with a teal shallow halo, a live lat/long readout bottom-left (Special Elite), and the EOX credit bottom-right.
- **Paper map:** ocean `#A9C2C4`, land `#ECE2CA`, pastel countries, brown coast with water-lining, dashed borders, a 10° graticule, Cormorant Garamond labels.
- **Over everything:** a paper texture, 7 % grain and a warm vignette.
- **Marker:** `#D9291D` with an underlay and a highlight, re-rolled 8×/s. A second ink colour is allowed for a second line (Bir Tawil's 1902 line is blue).
- **Pop-ins:** a spring (ζ 0.48, 19 rad/s) from 55 % scale, with handheld drift.
- **Banned:** AI video or images, stock footage, word-by-word captions, hard cuts, any frame where nothing moves, icon packs, glossy gradients or glass UI. No creator names, logos or catchphrases in frame.

## Sound and voice

- **Voice:** Kokoro `am_michael` at 1.18, one wav per line, joined. Pauses over 0.28 s are shrunk to 0.2 s, but never the lead-in or the tail.
  - On this PC it runs on the PyTorch Kokoro-82M install (`~/.generative-music-video/venv`, misaki G2P), not kokoro-onnx; it's the same model.
  - Respell names with the `[word](/phonemes/)` syntax: Diomede → `dˈIəmˌid`, Gorbachev → `ɡˈɔɹbəʧˌɔf`. Bir Tawil and Halaib are respelled in `examples/bir-tawil/script.json`.
- **Word times:** faster-whisper small.en (int8, CPU) on the final wav, mapped onto the script's words.
- **Music and SFX** are synthesized in numpy (`engine/audio/kit.py`): a tense bed, marker, scribble, slide, page, tape, whoosh, impact, typing, tick, swish and splash. Nothing is downloaded and there's nothing to license. Each event declares exactly one SFX.
- **Mix:** the voice sits 10 dB or more over the bed, and the bed ducks under every word. −14 LUFS, true peak ≤ −1 dBTP, H.264 CRF 19 plus AAC.

## Gotchas (from the three films; more in engine/README.md)

- **EOX licence:** only `s2cloudless_3857` (2016) is CC BY 4.0; 2017 and later are CC BY-NC-SA.
  - The tile path is `…/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg`.
  - Fetch sequentially at 2 requests/s or slower and cache forever.
  - Credit line: `Imagery: Sentinel-2 cloudless 2016 by EOX IT Services GmbH (contains modified Copernicus Sentinel data 2016), CC BY 4.0`.
- **Land mask:** "red minus blue > 5" fails in some regions.
  - Snowy or shaded cliffs at Diomede needed the per-level `weak` hysteresis.
  - Point Roberts (green fields, turbid water) needed a film-specific mask (`examples/point-roberts/tools/fetch_tiles.py`).
  - Inland deserts (Bir Tawil) are all land; just keep the coast right on the wide shots.
  - Always look at `tiles/z*_check.jpg`.
- **Lines no dataset has**, like Bir Tawil's 1902 administrative boundary, get built from Wikipedia's coordinates (`examples/bir-tawil/tools/build_geo.py`). Say so in the film's README.
- **Natural Earth's date line** sits on 169°W in the Bering Strait, but the treaty meridian runs about 1 km east. Use `lines.*.replace`.
- **d3 clip extent:** drop Antarctica and any ring whose `d3.geoArea` is over 2π. Wrap the JSON as JS globals, because `file://` can't fetch.
- **Global names:** if a global of yours shares a name with one the renderer injects, every frame renders black while stills look fine. The page defines only `MF.*` and `window.__mf`. `qa.py`'s YAVG scan catches it.
- **Motion-blur samples:** scale them with zoom speed (8 to 40), or fast zooms ghost.
- **Bitrate:** per-pixel grain is incompressible, so the grain tile is blurred to about 2 px. Make the `_upload` copy anyway.
- **Whisper misses:** Whisper mishears some names that Kokoro says correctly ("Blaine" → "blame"). Check the phonemes before respelling, and put the name on screen as a tag.
- **Weak opening:** if the hook circle is keyed to the last word of a long first line, the film opens on 2–3 s of plain satellite. It's acceptable, but a nearer key word or a slow push-in reads better on a reel.
- **Shared PC:** the canvas renders on the integrated GPU, at about 0.5–1.5 s per frame per worker. Full renders hold `map-films/.render-lock` (`render_locked.sh` does it) and run in the background. Only additive engine changes are allowed, made while holding `.engine-edit-lock`; after one, re-render 3 Diomede stills and confirm they're pixel-identical.

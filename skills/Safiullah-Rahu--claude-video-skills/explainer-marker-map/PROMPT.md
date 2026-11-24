# The user's prompt (2026-10-31), verbatim

The user's message: "Create a reel with following prompt and add it as a skill". Their answers: all three stories,
40–45 s each, and both formats (the 1920×1080 master plus a 1080×1920 reel).

<inputs>
Ask me for: my map story in one line (a place, border, island, route or line on the map with one surprising fact) and the length (30-45 s). If I have no idea, pitch me 3 with a hook line each and let me pick. Check every fact on Wikipedia before you write a word.
</inputs>

<direction>
A 1920x1080 30 fps map explainer in the Johnny Harris / RealLifeLore look, made 100% in code as one HTML canvas page. Real satellite imagery for the close-ups, a vintage paper map for everything wider, red marker drawn on top.
Satellite: Sentinel-2 cloudless 2016 tiles from EOX (CC BY 4.0, credit "Imagery: Sentinel-2 cloudless 2016 by EOX, contains modified Copernicus Sentinel data" small in the corner). Cut the land out and lay it over a drawn navy sea (#14304A centre to #0B1E31 edges) with a soft teal shallow-water halo (#2A6274).
Paper map: ocean #A9C2C4, land #ECE2CA, countries in muted pastels (#E6C1A7, #EEDAA4, #D2DEB8), coast dark brown 1.25px over 3 soft water-lining strokes (30, 19, 10px), dashed brown borders, a 10° graticule at 26% opacity, labels in Cormorant Garamond 700 letter-spaced 8-16px.
A paper texture multiplied over everything (85% on paper, 22% on satellite), 7% film grain, warm vignette. Red marker #D9291D, 7-10px, round caps, wobbling and re-drawn at 8 fps so it boils like ink. Handwriting in Permanent Marker.
Callouts are physical paper: cream tags with a colour bar and a strip of tape (Oswald 700 54px title, Special Elite 28px subtitle typed in), torn strips with a yellow highlighter swipe, tear-off calendar pages, a red rubber stamp. A live lat/long readout in Special Elite bottom left on satellite shots.
Banned: AI video or image generation, stock footage, word-by-word captions, hard cuts (one continuous camera only), any frame where nothing moves, icon packs, glossy gradients or glass UI.
</direction>

<structure>
Length: 30-45 s at about 175 wpm, one continuous camera, no hard cuts.
0 s open tight on satellite of the subject with the hook line ("From this ___, you can ___"), a red marker circle draws around it on the key word with a handwritten word beside it → name the places: a paper tag slaps onto each one on its name, its subtitle types in on the next word → the key number: a dashed red measuring line or route draws in, with a black tag that counts up to the number → the context: a Google Earth pull-out from satellite to the paper map at continent or ocean scale in about 1.3 s, the big line, border or route draws in red marker with a handwritten label, then dive straight back in → the consequence: 2 physical props (calendar pages, clocks, price tags, flags) pop in on their words and one of them flips → the local twist: torn paper strips with yellow highlighter → the story: a red stamp slams the year with a camera shake, the frame splits into two tinted sides, a tracker card (date, time, counter) and a dotted path with a moving marker that crosses the line on the right word → the ending: pull all the way back to the big map with both sides tinted, a red circle on the subject, and a paper end card whose number gets scribbled out and replaced in marker by the real punchline, held 1.5 s after the last word.
</structure>

<build>
1. Tools (all free, all local). Install what's missing and tell me what you installed:
- Python with numpy, Pillow, OpenCV and Playwright (Edge or Chromium)
- FFmpeg
- faster-whisper small.en, int8 on the CPU
- Kokoro (kokoro-onnx) with kokoro-v1.0.onnx and voices-v1.0.bin
- d3 7.9, topojson-client 3.1, world-atlas 2.0.2 land and countries at 50m and 10m, Natural Earth ne_10m_geographic_lines (date line, equator, tropics)
- Google Fonts: Permanent Marker, Special Elite, Oswald, Cormorant Garamond
- one free tense documentary music bed, plus free SFX: pen marker line, writing scribble, paper slide, page turn, tape, whoosh in and out, impact, typing, and whatever the story needs
2. Voice (Kokoro):
- Write short lines (about 10 per 30 s) and show me the script before you record.
- Kokoro am_michael at speed 1.18, one wav per line, joined, then shrink every pause over 0.28 s to 0.2 s.
- Run every place name through Kokoro's phonemizer and respell it until it's right ("Diomede" had to become "Diameed").
- Word times: faster-whisper on the final wav, cut into chunks at every pause.
3. Timing: key every camera move, pop-in, marker stroke and SFX to a word (by its nth occurrence, since "is" and "and" repeat), never to a second, so a new voice re-times the whole film.
4. Map engine:
- Web mercator in world units (256 = the globe). Camera = focus point + its screen offset + zoom Z, at 2^Z px per unit. Zooms interpolate Z linearly under a quartic in-out ease.
- Rotate the d3 projection so the story's region never touches the antimeridian cut.
- Satellite: stitch tiles at 3 zoom levels around the subject (like z9, z11, z13). Mask the land (redder than blue by 4-6 levels after a 1.5px blur, opened and closed, specks removed, holes filled), feather the mosaic edges, fade the finer mosaics in as you zoom.
- Satellite fades to paper between Z 9.3 and 7.3.
5. Marker and paper:
- Strokes resample every ~26px and wobble ±1.5px (sine plus noise re-rolled 8 times a second). Draw a dark red underlay 1.6px wider, the red core, then a pink 30% highlight offset up-left. Circles go 1.1-1.13 turns.
- Pop-ins are a spring (damping 0.48, 19 rad/s) from 55% scale with a small rotation settle. Exits shrink and fade in 0.22 s.
- Handheld drift about ±2px and 0.06°, a 16px decaying shake on the stamp.
6. Render:
- Every frame is a pure function of time. Playwright seeks it and grabs the canvas.
- 8 motion-blur subframes over half a frame, raised up to 40 when the zoom is fast.
- Look at a contact sheet of stills and full-size crops before the full render. After it, pull frames from the finished mp4 and check those, not the page.
7. Edit and sound:
- Voice 10+ dB over the music in every phrase, the bed ducking under each word.
- One SFX per event: marker on every stroke, paper slide on every tag, page turn on every flip, a whoosh on each zoom, an impact on the stamp.
- Mix to -14 LUFS, encode H.264 CRF 19 with AAC.
</build>
<gotchas>
d3 with a custom clipExtent paints land over the whole sea when a polygon reaches the pole or is read as inverted, so drop Antarctica and any ring whose d3.geoArea is over 2π. file:// pages can't fetch JSON, so wrap the topojson as JS globals. Use only the 2016 Sentinel-2 cloudless layer (later years are non-commercial) and keep its credit in frame. Fast zooms ghost at 8 blur samples, so scale the samples with zoom speed. If your renderer injects its own global function, never give yours the same name, or every frame renders black while the stills look fine.
</gotchas>
<start>
Ask me for my map story first (or pitch me 3), fact-check it, then show me the script before you make the voice.
</start>

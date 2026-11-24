---
name: explainer-news-noir
description: "Makes a 60-75 s vertical 9:16 black-and-white news summary reel about a CURRENT story, in the format of a viral Instagram news reel (@thelondonletter, 75k likes): a licensed news photo in B&W with a punch-in, a spotlight that dims everything but the subject, targeting rings and thin boxed mono labels, a document on a desk under a spotlight, a cut-out with leader-line labels popping on the words, a dotted map on white, circle silhouettes linked by dashed lines, 3D hardware in an exploded view, a line-drawn blueprint, a 'link not proven' X, a dotted globe with dated pins, a corridor with a big counting number, two quote cards between hairlines, a zero card, and a 3D white model of the institution with deadline tags. Captions are one or two small words at a time. Built in code with HyperFrames + three.js (desk, hardware, corridor and model sets) and a Canvas 2D layer (photos, maps, graphs, cards), grain and vignette; Kokoro narration; an original synthesized dark bed and SFX with a no-music mix. Includes a story-picking and fact-check step: a story from the last ~3 weeks, about events or institutions (not allegations against individuals), every claim double-sourced in FACTS.md, people only from public-domain or CC photos with a credit line. Use for 'news noir reel', 'London Letter style', 'black and white news explainer', 'investigative news summary reel', 'this week in news reel with labels and rings', 'redacted memo / dossier news reel'. Builds on hyperframes and the explainer engine."
---
# News noir — one current story, black and white, labels on everything

Reverse-engineered from one Instagram reel (**@thelondonletter**, `DfcftGoIo4D`, 65.9 s, about 75k likes; analysed
locally for reference only, see `references/sources.md` and Appendix A). The format is a **one-story news summary**
told as an investigation board: a real photo identifies the subject, a document carries the news, labels name every
thing on screen, a map says where, a graph says who is linked to whom, hardware shows what is at stake, a number gives
the scale, two short quotes give both sides, a zero says what has *not* happened, and a dated deadline ends it.

Sample: `assets/sample/` — **"Hungary opens the secret police files"** (71.6 s): on 4 Nov 2026 Hungary put its
communist-era state security records online. Facts in `assets/sample/FACTS.md`.

## 0. Pick the story and fact-check it (every run)
1. **Find candidates from the last ~3 weeks.** Read the day pages of Wikipedia's current-events portal
   (`Portal:Current_events/<YYYY> <Month> <D>`) and two news front pages; list 5–8 candidates.
2. **Keep only stories about events or institutions.** Not allegations against an individual (no "X is accused of"),
   no crime suspects, no private people, nothing graphic. A person may appear only as the official who acts
   (minister, agency head) and only from a public-domain or CC-licensed photo (Wikimedia Commons, US-government works)
   with author and licence recorded; never an agency photo (AP, Reuters, Getty, AFP) or a screenshot of one.
3. **Score for the format**: does it have a document, a place, a network of institutions, an object (hardware), one
   big number, two quotable sides, a "not yet / zero" and a dated next step? Pick the one with the most.
4. **Double-source every claim** (wire + a second outlet, ideally one local): fetch each article, list facts with
   numbers, and write `FACTS.md` (claim | source 1 | source 2) **before** writing the script. Where sources differ,
   use the safer figure or wording ("lost" vs "destroyed") and note it. Quotes on cards must be a fragment that
   appears in both sources' translations.
5. Put the publication date and the "as of" date in `FACTS.md`; re-check on the day of posting.

## 1. Signature traits
- **Black and white only** (saturation ≈ 0): pure black grounds, white type, greys for secondary text; two white
  shots (map, globe) break the black and register as scene changes.
- **Rings and labels**: a thin circle with crosshair ticks and a partial dashed outer ring locks onto the subject;
  labels are uppercase mono in thin 1.5 px boxes (white line + grey line), joined by hairline leaders with a dot.
- **Spotlight dimming**: the photo dims to ~30 % except a soft circle on the subject; the spotlight then pans to a
  second subject in the same photo (the source pans from one person to another; we pan from the speaker to a phone in
  the crowd).
- **Small captions**: one or two words, ~40 px, centred low; a translucent grey box on busy or white shots.
- **3D props as evidence**: a document on a desk, hardware that opens (exploded view), a corridor of storage with a
  number glowing over a growing stack, a white clay model of the institution under a spotlight.
- **Fairness devices**: an X with "NOT PROOF" / "NO LINK ESTABLISHED", two quote cards for two sides, a zero card.

## 2. Measured metrics
| metric | source | sample (final) | gate |
|---|---|---|---|
| duration | 65.9 s | 71.6 s (+8.6 %) | ±15 % |
| words · WPM overall | 169 · 153.9 | 160 · 134.9 (−12 %) | ±20 % |
| shots (hand count) · cuts/min | 15 · 12.8 | 15 · 11.7 (−8 %) | ±20 % |
| analyzer cuts/min · scene changes/min | 3.64 · 6.37 | 5.03 · 6.70 (cuts +38 %, explained: our 2D/3D shots differ more in brightness, so the detector catches more of the same cuts; scenes +5 %) | ±20 % or explained |
| saturation · brightness | 0.003 · 0.19 | 0.004 · 0.218 | B&W |
| loudness · true peak | −14.6 LUFS | −14.1 LUFS · −2.0 dBTP | −14 ±1, ≤ −1 dBTP |
| voice over bed | (music bed) | 13.0 dB | ≥ 10 dB |
| first word | 0.0 s | 0.16 s | ≤ 0.4 s |

## 3. Beat map (% of runtime) and script formula
| % | beat | source (shape) | sample |
|---|---|---|---|
| 0–12 | **Who + what**: an introduction of the official over a real photo, ring + label; the spotlight moves to the second subject on the news verb | two people in one photo | the PM; then a phone in the crowd (anyone can search) |
| 12–19 | **The document** on a desk + **attribution** to the outlets | a memo + the newspaper it came from | the register and a registration card; ~60,000 names |
| 19–26 | **What it is**: a cut-out with leader-line labels popping on the nouns | who the second person is | the card: name, job, grounds for recruitment |
| 26–32 | **Where**: dotted map on white, pin + label | the firm's city | Budapest, the state security archive |
| 32–39 | **How it worked**: rings, silhouettes, dashed links | who is linked to whom | officer → network member → others |
| 39–46 | **The object**: 3D hardware, exploded on the verb | a computer chip | the magnetic-tape drive, ~55,000 names |
| 46–52 | **The decision-maker** cut-out + two dated tags | what the first person did | pledge kept / access delayed 1990–2026 |
| 52–58 | **A blueprint** of a second record with callouts | the chip diagram | the 1957–1962 register |
| 58–63 | **The caveat**: dashed link + X | the link is not proven | a name is not proof |
| 63–70 | **Globe** with dated pins | a dated route between two capitals | files lost 1956 and 1988–89 |
| 70–78 | **The number** over a corridor and a growing stack | a dollar figure | ~150,000 agents, a third known |
| 78–87 | **Two quote cards** (two sides) | a one-word quote from each side | "Very incomplete" / "Dignity and humanity" |
| 87–91 | **Zero card** | what has not happened yet | 0 informer reports published |
| 91–100 | **What's next**: 3D white model + dated tags | Congress deadline | 9,000+ recruitment files due 25 Feb 2027 |

- **160–180 words**, 15 lines, short declaratives, past tense for the event, present for the state of things. One
  British male narrator: Kokoro `bm_george` at 1.20–1.25 (the source voice is ~104 Hz male).
- Every proper noun on screen as a label; every number on screen as a label or the big counter.

## 4. Visual system
| role | source | sample |
|---|---|---|
| ground | `#000`/`#020202` (58 %) | `#000`, vignette to 85 % at the corners |
| white shots | `#f4f4f3` | `#f1f1ef` map and globe |
| type | white `#f2f2f2`, greys `#a9a9a9`, `#616161` | same |
| photos | B&W, contrast up | PIL greyscale + contrast 1.1 offline (no CSS filters on media) |
| 3D | grey clay under one spotlight, no colour | `MeshStandardMaterial` greys, SpotLight 16–42 (scene-dependent), NeutralToneMapping, bloom 0.28 |
| grain | fine, everywhere | 4 seeded 540×960 noise tiles, one per frame, `screen` at 8.5 % |

- **Labels**: Roboto Mono 700 25 px line 1 + 500 21 px line 2, letter-spacing .12em, 12 px padding, box
  `rgba(0,0,0,.55)` with a 1.5 px `rgba(235,235,235,.55)` stroke (white boxes on the white shots).
- **Rings**: r 70–92 px, 2 px white, dashed outer arc at 1.32 r rotating slowly, four ticks.
- **Captions**: Inter 500 40 px at y 1270 (the source sits at ~1450; we keep key text above 1300), 1–2 words
  (≤ 16 characters), grey box `rgba(120,120,120,.62)` on the photo, desk, map and globe shots.
- **Credit lines**: Roboto Mono 21 px grey at y 1352 on every shot that shows a photo.

## 5. Shot grammar and transitions
- 14–15 shots; hard cuts except a 0.4 s dissolve from the photo to the desk and a 0.28 s fade into the white map.
- 2D shots (photo, cut-out, map, graph, portrait, blueprint, link, globe, quotes, zero) are drawn on one Canvas 2D
  layer; 3D shots (desk, hardware, corridor, model) on a WebGL canvas below it; labels over 3D are drawn on the 2D
  layer from projected points.
- Camera language: slow push (+4–8 %) on photos, an orbit of 10–18° on 3D props, a downward pan across the graph, a
  rotating globe that settles on the country, a slow zoom into the dotted map.

## 6. Motion grammar
- Labels and rings fade in over 0.25–0.35 s (cubic out) on their word; leaders draw from the subject outward.
- Spotlight pans ease over 0.6 s; the ring's dashed arc turns at ~0.5 rad/s.
- Hardware: the moving part lifts 0.9 units and tilts 50° over ~1.5 s on its verb; reels spin.
- Counters run 1.1 s (cubic out) and land on the noun; the stack builds box by box (back-out pop).

## 7. Caption system
- `tools/build.py` (same as the engineering skill) with phrases of ≤ 2 words/16 characters; on 0.04 s before the
  first word. `out/<key>.srt` from the same data.

## 8. Sound
- The source has an original dark bed (ticks at ~144 BPM, a steady sub from 16 s, the low end dipping under the memo).
  Never embed the source audio or a commercial track; `POST.md` suggests an in-app library track.
- `tools/sound_design.py`: D-minor sub drone with slow beating, a low muted-piano motif one note per beat at 72 BPM, a
  two-hit heartbeat kick, 16th clock ticks, energy curve (thin under the document, up for the number). SFX: camera
  shutter on ring locks, typewriter keys on labels, paper slide on the document, whoosh into the white map, tape whir
  and a clunk, counter roll, low booms on the quote and zero cards, a drawer slide on the last shot.
- Mix: voice 1.0, music 0.4, SFX 0.3 → voice ~13 dB over bed+SFX; −14 LUFS, ceiling −2 dBTP; a no-music remux.

## 9. Retention devices
- A real face and a ring within 1.3 s; a label, ring, line or number on almost every phrase.
- Attribution early; the caveat (X) before the big number; two quote cards; the zero card; a dated next step as the
  last frame (a reason to follow).

## 10. Do / don't
- **Do** run §0 every time; keep the whole film colourless; put a credit line on every photo; prefer documents,
  objects, maps and silhouettes over faces.
- **Don't** use agency photos or screenshots of articles; don't name private people or anyone accused; don't put a
  paraphrase in quote marks; don't show logos (write institutions as plain mono labels).

## 11. Code recipe
```bash
cp -r ~/.claude/skills/explainer-news-noir/assets/template my-news && cd my-news     # 3-shot demo
# 0) FACTS.md first (section 0). Photos: download CC/PD files, record author + licence, then
python -X utf8 -I tools/prep_photo.py <in.jpg> assets/photo/<name>_bw.jpg [crop x0 y0 w h]   # B&W + contrast
# 1) vo/script.json, tools/film.json (subs, max_words 2, max_chars 16)
python -X utf8 -I <engine>/audio/tts.py vo && python -X utf8 -I tools/build.py
python -X utf8 -I tools/make_geo.py <natural-earth-dir> <Country>    # dotted Europe + globe -> assets/lib/geo.js
# 2) assets/lib/film.js (shots: id, t0, kind 2d/3d, light, box, xf) ; compositions/world.html draw2d()/render3()
python -X utf8 -I tools/sound_design.py
npx -y hyperframes@0.8.210 check --json && npx -y hyperframes@0.8.210 snapshot --at <one per shot> --no-end -o scratch/snap
bash <render_locked.sh> "$PWD" out/master_r1.mp4 delivery
python -X utf8 -I tools/qa.py encode out/master_r1.mp4 && python -X utf8 -I <engine>/qa/analyze_video.py out/<key>.mp4 out/qa
python -X utf8 -I tools/qa.py qa <source metrics.json> <source hand cuts/min>
```
- `world.html` helpers: `label(x, y, line1, line2, alpha, {align, box, fill, stroke, s1, s2})`, `ring(x, y, r, a,
  spin)`, `leader(x0, y0, x1, y1, a)`, `dashed(x0, y0, x1, y1, a, progress, arrow)`, `silhouette(x, y, r, a, shade)`,
  `spotImage(img, cx, cy, scale, ox, oy, base, spots[])` (dim + soft spots through an offscreen mask), `credit(text,
  a)`. 3D sets: `desk`, `tape` (swap for the story's object), `corridor` (number over a stack), `cabinet` (the
  institution model).

## 12. Gotchas met on the sample
- **SpotLight intensity is physical** (candela, decay): 120–260 blew every 3D shot to white; 16–42 is right at 6–10 m.
- **Cameras too close** make props fill the frame: start 8–10 units from a desk or cabinet, 10+ down a corridor.
- **Dot size on zoom**: dots of 0.13·k px at 64 px/deg look like a carpet; keep k ≤ 40 and r ≈ 0.085·k.
- **Labels collide** with the subject on the map: put them on the leader end with a white box.
- **Thumbnails from Wikimedia** only come in standard widths (e.g. 1280 px); other widths return an error page.
- **Fonts in canvas**: `document.fonts.load()` every weight you draw before the first frame, or the first frames use
  a fallback.
- **Quotes**: a translated quote must be a fragment both sources print; otherwise paraphrase without quote marks.
- **Spinning reels wobbled** in render 1: with three.js's XYZ Euler order, a cylinder tilted with `rotation.x = π/2`
  must spin with `rotation.y` (its own axis), not `rotation.z`.
- **Faint dotted maps**: grey `#9c9c9a` dots on `#f1f1ef` vanish at phone size; use `#6f6f6d` and black for the
  country, and globe dots at ≥ 45 % alpha.
- **White → black hard cuts** (map → graph, globe → corridor) trip a black-frame detector; list them as planned in
  `tools/film.json` `planned_dips`.
- **Captions over light 3D props** (the box stack) need the grey box too (`box: true` on the shot).
- **The institution model** reads like the source's only when it is small, high in the frame and brightly lit: aim
  the camera at the plinth (target y ≈ 0.25), 11–12 units away, spot 60 with a 0.3 rad cone.
- **Grain makes big files**: the per-frame noise layer puts a 71 s CRF 19 delivery at ~120 MB. Fine for upload; lower
  the grain opacity or refresh it every second frame if size matters.

Files: `references/sources.md` · `tools/` (build.py, make_geo.py, prep_photo.py, sound_design.py, audiolib.py, qa.py)
· `assets/template/` (runnable 3-shot demo) · `assets/sample/` (the full project without rendered media or photos).

## Appendix A — source analysis (`DfcftGoIo4D`)
65.90 s, 1080×1920, 30 fps · 169 words, 153.9 WPM · −14.6 LUFS · colourfulness 0.3, saturation 0.003, brightness
0.19, 86 % dark frames · palette `#000` 32 %, `#020202` 27 %, `#f4f4f3` 13 %, `#0a0a0a`, `#161616`, `#2f2f2f`,
`#a9a9a9`, `#616161` · analyzer 4 cuts (3.64/min), 6.37 scene changes/min, motion mean 6.62 · bed with ticks at
~144 BPM · narrator median f0 ~104 Hz (British male).

| t (s) | shot | what happens |
|---|---|---|
| 0–7.5 | photo | full B&W photo; 1.0 s punch-in, the rest dims, ring + two-line label on the first face; at 4.0 s the spotlight moves to the second person with a two-line label; a dim place/date corner label |
| 7.5–13 | desk | dissolve to a memo with redaction bars, a photo print and a pen under a spotlight; slow rotation |
| 13–17.3 | cut-out | the person on black; boxed labels with leader lines pop on the nouns |
| 17.3–21.2 | dotted map (white) | a dotted globe zooms into the region, a pin + label, a company mark under it |
| 21.3–27 | graph (black) | circle portraits and a target ring linked by dashed lines; a "recruited" label; pan |
| 27–33 | 3D hardware | a chip on a board with the heatsink lifting (exploded) |
| 33–36 | cut-out | the second person under a spotlight; a dated tag bottom-left |
| 36–38 | blueprint | a line drawing of the chip with boxed callouts |
| 38–40 | link test | chip icon -- dashed line -- portrait; an X and "no link established" |
| 40–45 | dotted globe (white) | rotating globe, two pins and a dashed route |
| 45–54 | corridor | a data-hall corridor, boxes stacking, a dollar figure counting up above them |
| 54–60 | quote cards | two cards between hairlines (party name, "on the …", a one-word quote) |
| 60–61 | zero card | a label and a big 0 |
| 61–66 | 3D model | a white model of the institution under a spotlight, a two-line header and two deadline tags |

Captions: 1–3 words, ~34 px, centred at ~1450 px, white; grey translucent box on the photo, memo and white shots.

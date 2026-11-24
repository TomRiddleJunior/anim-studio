# 3D map-plate documentary: plans as physical objects in a dark virtual museum, cut like a film

Analysed 2026-10-27. Primary source: "The $41 Billion Plan for Tokyo" (Hoog, 2023, `ZADlkbr7Avg`), posted in the
Reddit thread by a commenter as "The 40M Plan for Tokyo" (no reason given). Supporting reference,
poster frame only: Giant Ant's "Eco Justice // A Tale of Two Valleys" (2012), an illustrated 2D map narrative.
Inputs: `frames/ZADlkbr7Avg/` (metrics, timeline, opening, shots_1/2 = 72 sampled shot mid-frames, strips,
animated, ending, transcript); frame-exact strips at 3-frame steps (`scratch_reddit/hg_a.jpg`, `hg_b.jpg`);
stills and a legend crop (`hg_stills.jpg`, `hg_plate_full.png`); single-frame k-means palettes. Audio was never
heard.

**Sibling:** `3d-diorama` uses the same 3D kit (see its §11 for the three.js setup) but is short, uses a
continuous camera and works in metaphors. This style is long-form, cut like live-action documentary, and stages
**evidence** (maps, plans, archival photos) as physical objects.

---

## 1. Identity

A 10–15 minute narrated history or urbanism documentary in which **every map and plan is a physical object
photographed in a dark 3D studio**. Coastlines are laser-cut black acrylic plates with peach/salmon land, white
coastline lines and hatched zones. Proposed plans are **extruded coloured blocks** (yellow, maroon, blue) standing
on the plate, with a small colour-key legend. Real terrain is a **satellite-textured relief tile** floating on a
grey studio floor. Historical plans hang as **framed prints in a dark gallery corridor** whose ceiling lights flick
on row by row. Portraits lie as halftone prints on a wooden floor. Architecture appears as **white clay or wire
models on a blue-gradient sea**, and routes and outlines **glow as emissive orange neon** that draws itself.
Archival photos and film (black-and-white and early colour) are intercut full-frame. The camera creeps (slow
trucks, push-ins, rack focus, top-down cranes) and the edit **cuts between angles of the same model every ≈ 5 s,
like documentary coverage**. The frame is a cinematic **2:1** (1280 × 640). The palette is dark and desaturated,
with one warm accent.

## 2. Sources analysed

| id | title (uploader, year) | dur s | fps / frame | cuts/min | median shot s (p10–p90) | scenes/min | motion mean / p90 | hold | colourfulness | WPM | LUFS |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ZADlkbr7Avg | The $41 Billion Plan for Tokyo (Hoog, 2023) | 762.9 | 24 / **1280 × 640 (2:1)** | **9.36** (119 cuts) | **5.52 (2.08–12.42)** | 8.97 (median 5.3 s) | 6.43 / 13.18 | **0.068** | 24.0 | 145.3 | −21.1 |
| vimeo 53447230 | Eco Justice // A Tale of Two Valleys (Giant Ant, 2012) — **poster only** | 132 | — | — | — | — | — | — | — | — | — |

| extra measurements (Hoog) | value |
|---|---|
| first cut, cuts in the first 15 s | 8.6 s, 2 |
| brightness, saturation, dark frames | 0.359, 0.284, **31.5 %** |
| silence | 2.2 s (music under nearly everything) |
| motion deciles | **10.6** 6.0 6.7 2.9 3.9 6.9 4.3 4.1 **9.4 9.5** (a dramatic opening, a calm middle, a busier finale) |
| chapters (YouTube) | 8: the radical vision; post-war population crisis; three named plans; architectural metabolism; radical water-city designs; the linear bay city; the bay's actual growth |
| `animated_frac` | 0.641 (archival and photoreal renders read as "footage") |

**Shot-type mix** (by eye, from the 72 sampled shot mid-frames; ±5 %):

| shot type | share |
|---|---|
| map plates (black acrylic + peach land + extruded plan blocks + legend) | ≈ 42 % |
| satellite-relief terrain tiles (incl. top-down) | ≈ 14 % |
| white clay / wire architecture models on a blue-gradient sea or dark ground | ≈ 14 % |
| virtual gallery corridor, framed prints, portrait prints on wood | ≈ 12 % |
| archival photographs and film (B&W and colour) | ≈ 11 % |
| old drawings/documents as paper objects (with glowing overlays) | ≈ 5 % |
| end card | ≈ 1 % |

## 3. Measured pacing

| quantity | target | practice |
|---|---|---|
| duration | 8–15 min | long-form YouTube documentary; chapters every 1–2 min |
| hard cuts | 7–11/min, median shot 4–7 s | cut between angles of the same model (wide → close → detail) and between object types |
| first 15 s | 2 cuts | the opening runs one dramatic camera move per "This is…" line |
| camera | always moving (hold ≈ 7 %) | slow trucks/push-ins at ≈ 1–3 % of the frame width per second; nothing is ever still |
| motion mean | 5–7 | calm, because the motion is slow camera drift; spikes come from fast fly-ins and archival footage |
| speech | 140–150 WPM, near wall-to-wall (2 s of silence in 12.7 min) | conversational documentary voice with rhetorical questions |
| brightness | 0.30–0.40, dark frames ≈ 30 % | low-key lighting; the subject is lit and the surroundings fall to black |
| colourfulness | ≈ 20–28 | desaturated greys + peach land + one warm glow accent |

## 4. Script & narrative structure

**Beat map (762.9 s)**

| s | % | beat | picture |
|---|---|---|---|
| 0–19 | 0–2.5 | **deictic triple hook**: "This is [city]. This is its bay. And this is [architect]'s plan…" with one picture per sentence | a satellite relief tile on a grey floor (slow orbit) → a dive toward the bay → dark plan blocks rise out of the water → top-down → a close angle on the blocks |
| 19–43 | 2.5–5.5 | **stakes + questions**: it was one of many radical plans; why on water? why do they look like this? plus a self-aware joke about the dramatic intro | a dark gallery with a framed plan under a spotlight; a row of map plates on a table |
| 43–120 | 5.5–16 | context: post-war devastation, migration, a housing shortage | archival smoke, crowds and students; a map with orange city blobs |
| 120–300 | 16–39 | plan 1 and plan 2: who proposed them, why, what they would have built | portraits on wood; gallery corridor; map plates with extruded zones and a legend; a satellite tile with a planned spine |
| 300–600 | 39–79 | the architectural movement and the radical water-city designs | glowing orange bars and grids; white clay megastructures on a blue sea; an old drawing with a neon outline that pulses |
| 600–720 | 79–94 | the headline plan in depth (the linear city across the bay) | wire models; the satellite bay with the spine; plates compared side by side |
| 720–757 | 94–99 | **epilogue**: none were built, but the city crept into the bay anyway (a % reclaimed today); dreams continue | plates with the actual reclaimed land; archival street life |
| 757–763 | 99–100 | **credit card**: white text on black naming the book the video relied on, then a thank-you | — |

**Structural devices**
- The hook names the place, the place's feature and the plan in three escalating sentences, each over a new camera
  position.
- Questions frame the film; the answer is a chronology told through **people → plans → consequences**.
- Plans are **compared on identical plates side by side** (rows of 4–6 plates, 0:23, 9:37, 12:12), so differences
  read instantly.
- There is no CTA, no channel sting and no presenter. The ending is the factual epilogue plus a source credit.

## 5. Visual system

### Palette (single-frame k-means at 2:42, 3:56, 5:00, 8:00 + `metrics.json`)

| role | hex | notes |
|---|---|---|
| void / plate black | #0e0c0d – #151015 (22 % of pixels overall) | glossy acrylic and the unlit studio |
| studio floor / table | grey #545c60, #6d767a, #8a979d | soft-gradient seamless floor |
| land (lit) | peach/salmon ≈ #e3b19c *eyeballed* (k-means #a47d6f in shadow, #c1b2b1 highlights) | the land layer on every plate |
| plan block colours | maroon #641525, yellow #b2a041 → lit ≈ #e0c35a *eyeballed*, blue-white, red, green | one colour per zone type, always matched in the legend |
| emissive accent | orange glow, core #ad681b → bloom #572309 on black; the brightest highlights near white | routes, outlines, blasts, "energy" |
| sea for models | blue gradient #2f4966 → #97aec1 | white clay models float on it |
| wood (portrait floor) | #a4814f (6 % in metrics) | the warm table for printed documents |
| archival | B&W and faded colour | not graded to match; kept as found |
| text | white / light grey | labels, legend, credits |

Rules: neutral greys and black dominate; peach land is the constant; plan colours appear only as zone codes; a
single warm glow (orange) marks importance or energy.

### Object language
- **Map plate:** a black acrylic slab (≈ 1.6:1, bevelled glossy edge, 1–2 cm thick at model scale) on a grey
  floor. Peach land is raised a few millimetres; coastlines are fine white lines; zones are white diagonal
  hatching; proposed structures are extruded blocks (heights 1–4 % of the plate width) in zone colours.
- **Satellite relief tile:** a rectangular terrain chunk with real-looking aerial texture and soft displacement,
  floating with a thin shadow; water rendered as a matte brown-grey plane.
- **Gallery:** a dark corridor with black ribbed or wood walls, rectangular fluorescent ceiling panels, framed
  plans and photos as matte prints with spotlights. Lights switch on panel by panel.
- **Prints on wood:** portraits and emblems as halftone/engraving prints lying on wide wooden floorboards, shot
  top-down or at 45°.
- **Architecture models:** white clay (megastructure towers, island cities, plug-in capsules) or white wire frames,
  on a blue-gradient sea or a black ground.
- **Emissive lines:** neon tubes (orange) that extrude along a path or pulse around an outline on a paper map.

### Lighting, depth, camera optics
Low-key soft top light; a falloff vignette into black; **shallow depth of field** on every close plate shot
(foreground and background plates blurred); gentle bloom on emissive lines; slight film softness. Lenses read as
35–50 mm for plates (perspective visible), longer for detail shots, and wide for corridors.

### Composition (2:1 frame)
Plates are shot at a low 20–35° elevation so that perspective recession fills the wide frame diagonally. Rows of
plates run edge to edge. Top-down satellite shots centre the bay. The legend sits lower-left at ≈ 3 % x, 70–90 %
y. Labels sit beside features in small caps. Archival images fill the frame.

### Typography
| use | look | free look-alike | size at 1080p-equivalent (1920 × 960) |
|---|---|---|---|
| legend | a coloured square (≈ 14 px) + a label in the same colour, 4 rows | Montserrat 500 | ≈ 26 px (18 px cap height) |
| place labels on plates | small white caps, wide tracking ("FUTTSU") | Montserrat 600 | ≈ 22 px |
| source credit on archival | thin grey sans, bottom-left ("[source] Documentary") | Inter 300 | ≈ 26 px |
| end card | white centred sans, two short paragraphs | Inter 500 | ≈ 34 px |

Text is rare: no titles, no captions, no kinetic type. The only text is information in the world.

## 6. Characters & objects

- **No characters.** People appear only in archival photos/film and as printed portraits. Their names are spoken,
  not captioned (one source label is the exception).
- **The plan is the protagonist.** Each plan gets its own plate (same base map, different blocks) so it can be
  compared and so the camera can "walk" it.
- **Recurring objects:** the base map plate, the satellite tile of the region, the gallery corridor, the wooden
  floor for documents, white clay models, glowing neon lines.

## 7. Camera & transitions catalogue

Measured at 24 fps.

| # | move / transition | build | duration | easing | frequency |
|---|---|---|---|---|---|
| T1 | **Hard cut between coverage angles** (232.1 → 232.25 s, 446.5 → 446.6 s) | the same plate cut from a wide to a closer angle, or a side to a top view; the move continues in the same direction | 0 f | — | the main edit (119 cuts) |
| T2 | **Creeping truck along a plate row** (22.6–24.5 s) | the camera trucks laterally along a row of 6 plates at ≈ 2–3 % of the frame width per second, low angle, shallow DOF | 2–6 s | linear (with eased ends) | ≈ 6× |
| T3 | **Slow push-in on a plate** (155.5–158.5 s) | a near-static push (≈ 1 % scale per second) on a detail with labels; rack focus from the foreground hatching to the block | 3–8 s | sine.inOut | constant |
| T4 | **Dramatic fly-in** (0–15 s) | an orbit around the relief tile, a dive toward the bay, blocks rising out of the water (each block extrudes in 6–10 f, staggered), then a cut to top-down | 4–5 s per move | power2.inOut | the hook; 2–3× later |
| T5 | **Lights-on gallery reveal** (77.5–78.9 s) | a black frame; ceiling light panels switch on one row at a time (≈ 6 f apart) from front to back, revealing a corridor with a framed print at the end; slow dolly forward | ≈ 1.5 s + dolly | step lighting | ≈ 5× |
| T6 | **Neon line extrusion** (298–301 s) | an emissive orange tube grows along its path in the dark at constant speed, bloom on the leading end | 2–3 s | linear | ≈ 6× |
| T7 | **Outline pulse on a document** (560–562 s) | a glowing outline sits on a paper map and pulses (brightness ±30 % over ≈ 1 s), then a cut to a closer angle where the glow has calmed to a thin line | 1–2 s | sine | ≈ 4× |
| T8 | **Blocks rise / zones fill** (6–8 s; plates passim) | extruded plan blocks grow up out of the plate (scaleY 0 → 1) with a 2–4 f stagger, or hatch/colour fills wipe across a zone | 0.5–1.5 s | power3.out | per plan |
| T9 | **Archival insert** (48–60 s, 11:46–12:05) | a hard cut to full-frame archival film/photo with a slow push (photos) or native motion (film), 2–5 s, then back to the models | 2–5 s | — | ≈ 11 % of shots |
| T10 | **Top-down crane** (8.6–12 s) | the camera looks straight down at the satellite tile, slow rotation or drift, plan blocks visible as dark shapes | 3–4 s | sine | ≈ 8× |
| T11 | **Glow blast** (98–101 s) | a white-orange glow fills the top of the frame over a mound of particles, with streaks running down the walls (an explosion metaphor) | ≈ 3 s | expo.out | 1× |
| T12 | **Cut to the end card** (12:39.6 s) | a hard cut from the last archival news print to white text on black | 0 f | — | end |

## 8. Motion grammar

- **The camera carries the motion; objects hold.** Plates, models and prints are static props; the camera drifts
  at a constant slow speed with eased ends. Hold frames are only ≈ 7 %.
- **Events are reveals:** blocks rise, lights turn on, neon draws, a glow pulses, a zone fills. Each happens once,
  on the noun that names it, then the shot holds while the camera keeps drifting.
- **Cutting:** a cut every 4–7 s, usually on a sentence boundary. Cuts keep the movement direction (match on
  motion) and alternate wide and close shots. Archival inserts land on historical facts (dates, people, crowds).
- **Rhythm against narration:** the hook gives one image per "This is…" sentence; rhetorical questions get the
  gallery (contemplative); facts get plates; consequences get archival.

## 9. Sound (inferred)

- **VO:** one male narrator, conversational and slightly wry ("Seriously, why?"), at 145 WPM, almost no pauses.
- **Music:** a continuous ambient/electronic documentary score (*inferred*: pulses and pads, swelling for the
  hook and the finale, deciles 1 and 9–10), with "[Music]" breaks between chapters in the captions (2:05).
- **SFX:** room-tone hum and light-switch clunks in the gallery, low booms for reveals, a whoosh on fly-ins
  (*inferred*).
- **Loudness:** −21.1 LUFS; target −16 for web.

## 10. Do / Don't

**Do**
1. Turn every map and plan into a physical object: a black acrylic plate with peach land, a white coastline and
   extruded zone blocks.
2. Keep one base map for the whole film, so each plan is a different plate of the same region.
3. Shoot plates at a low 20–35° angle with shallow depth of field in a 2:1 frame.
4. Cut between angles of the same model every 4–7 s, matching the direction of the camera drift.
5. Keep the camera always creeping (≈ 1–3 % of the frame width per second); let objects hold.
6. Put a 4-row colour legend lower-left whenever zone colours appear.
7. Use the dark gallery corridor (lights switching on row by row) for people, questions and historical documents.
8. Intercut archival photos and film at about 10 % of shots, full-frame and unretouched.
9. Reserve one emissive accent (orange neon) for routes, outlines and "energy" moments.
10. Open with a deictic triple ("This is X. This is its Y. And this is Z's plan.") over three camera positions.
11. Compare plans by lining up identical plates side by side.
12. End on the factual epilogue and a source credit, not a CTA.

**Don't**
1. Don't use flat 2D map animation; everything is lit, with depth (see `vox` for paper cut-out maps).
2. Don't add kinetic type, lower thirds or captions; text is legend, labels and the end card only.
3. Don't light brightly; keep brightness ≈ 0.35 and about a third of frames dark.
4. Don't let the camera stop; static frames read as slides.
5. Don't colour-grade archival material to match the renders.
6. Don't use more than one glow colour.
7. Don't use characters or mascots; people exist only in archive images.
8. Don't change the base map's style or scale between plans.
9. Don't cut faster than about 2 s or hold a single shot longer than about 12 s (the p10–p90 range).
10. Don't render satellite textures you have no rights to; use open data (e.g. Copernicus/Sentinel, public-domain
    relief) or stylised procedural terrain.
11. Don't copy the channel's specific plate designs or its end-card wording.
12. Don't use a 16:9 frame if you want this look; 2:1 is part of it.

## 11. Replication recipe (code)

**Rendering:** three.js in the engine page (setup as in the `explainer-3d-diorama` analysis, `references/analysis.md` §11), canvas 1920 × 960 (2:1) inside a
1920 × 1080 stage letterboxed in black, or a 1920 × 960 output if the platform allows. 24 fps. Use the `doc-pulse`
or `ambient-space` sound preset.

**Scene kit**
- `plate(mapGeoJSON, zones)`: build a black box (`MeshPhysicalMaterial`, roughness 0.25, clearcoat 1) of
  1.6 × 1 × 0.04 units; extrude the land polygons 0.004 high in peach (`MeshStandardMaterial` #e3b19c, roughness
  0.8); draw coastlines as `Line2` at 2 px in white; add hatching as an alpha-texture plane per zone; extrude plan
  blocks per zone (heights 0.01–0.04) in zone colours. Use a GeoJSON from open data, projected to plate
  coordinates.
- `reliefTile(heightmap, texture)`: a `PlaneGeometry(1.6, 1, 256, 160)` displaced by a heightmap, using an open
  satellite/hillshade texture or a procedural one.
- `gallery()`: a box corridor with ribbed black walls, `RectAreaLight` ceiling panels (intensity animated as step
  functions for T5), and framed print planes with spotlights.
- `neon(pathPoints)`: a `TubeGeometry` with an emissive orange material whose `drawRange` grows over time (T6),
  plus an `UnrealBloomPass` if a GPU is available; otherwise a cheap glow (an additive sprite trail).
- Depth of field: `BokehPass` (GPU) or a fake: render the plate sharp and composite blurred foreground/background
  copies with an SVG `feGaussianBlur` mask.

**Edit model:** script the film as a **shot list**, not one continuous camera. Each shot is
`{start, end, set: "plate:planA", cam: {from, to, fov, focus}, events: [...]}`. Cuts happen when one shot ends,
and the camera tween is linear with 0.4 s eased ends. Place shot boundaries on `vo.json` sentence boundaries,
aiming at a 5.5 s median.

```js
shots.forEach(s => {
  X.tl.set(world, { set: s.set }, s.start);                                    // swap the visible set (hard cut)
  X.tl.fromTo(camState, s.cam.from, { ...s.cam.to, duration: s.end - s.start, ease: "none" }, s.start);
  (s.events || []).forEach(e => EVENTS[e.type](e, X.word(e.line, e.word)));   // blocks rise / lights on / neon on the noun
});
EVENTS.blocksRise = (e, at) => e.blocks.forEach((b, i) => X.tl.fromTo(b.scale, { y: 0.001 }, { y: 1, duration: 0.6, ease: "power3.out" }, at + i * 3 / 24));
EVENTS.lightsOn  = (e, at) => e.panels.forEach((p, i) => X.tl.set(p, { intensity: 12 }, at + i * 6 / 24));
EVENTS.neon      = (e, at) => X.tl.to(e.tube.geometry.drawRange, { count: e.tube.geometry.index.count, duration: e.dur, ease: "none" }, at);
```

**Archival:** use only public-domain or licensed footage and photos (national archives, Wikimedia Commons with a
clear licence) as `<video>`/`<img>` planes or full-frame HTML layers between 3D shots. Add a slow 1.5 %/s push on
stills.

**Defining shots and how to build them**
1. **Deictic hook:** a relief tile on a grey floor, orbiting (shot 1), a dive to the bay (shot 2), plan blocks
   rising out of the water (shot 3), each on its "This is…" sentence.
2. **Plate row truck:** 6 identical plates with different plans in a row; the camera trucks along at 2.5 %/s, low
   angle, shallow DOF.
3. **Plate detail with legend:** a close push on extruded blocks, the legend lower-left, one place label, rack
   focus.
4. **Gallery reveal:** black → ceiling panels switching on row by row → a slow dolly toward a framed plan under a
   spotlight while the narrator asks a question.
5. **Neon in the dark:** an orange tube extruding along a route over a dark plate or into the void, with bloom.
6. **Clay megastructure on a blue sea:** a white clay model on a blue gradient, a slow orbit, soft shadow, for each
   radical design.

## 12. Per-video notes

**The $41 Billion Plan for Tokyo (12 min 43 s)**
- 119 hard cuts but almost no holds (6.8 %): it is edited like live action while being entirely rendered (apart
  from the archival material).
- The 2:1 aspect ratio is consistent throughout.
- A self-aware joke in the hook ("why is this introduction so dramatic?") gives a prestige look a casual voice.
- The end card credits a published book as the main source. Credit sources the same way.

**Eco Justice // A Tale of Two Valleys (poster only)**
- The poster shows an illustrated 2D map: a white river line through orange grain-textured land on black, with
  tiny pictogram towns and factories. It suggests a flat, textured 2D dialect of map storytelling. No motion,
  pacing or sound could be measured, because only the poster frame was available.

## 13. Source-list issues

- The thread comment titles it "The 40M Plan for Tokyo"; the video is "The $41 Billion Plan for Tokyo".
- It was posted alongside two short 3D brand/NGO pieces (Munters, Soil) that belong to a different grammar
  (`3d-diorama`).
- `animated_frac` (0.641) understates how much is rendered. About 89 % of shots are 3D renders; the remainder is
  archival.

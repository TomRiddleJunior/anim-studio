---
name: explainer-map-documentary
description: "Map-plate geography / urbanism documentary in code (Hoog-style, \"The $41 Billion Plan for Tokyo\") — every map and plan is a physical object in a dark 3D studio: black acrylic plates with peach land, white coastlines, extruded zone blocks and a colour-key legend, a procedural aerial terrain tile on a grey floor, a lights-on gallery corridor of framed prints, white clay models on a blue-gradient sea, emissive orange neon routes that draw themselves, black-and-white archival plates, all in a letterboxed 2:1 frame, hard-cut every ~5.5 s like live-action coverage under an investigative narrator. 3D is faked with CSS perspective + rotateX planes and stacked-copy extrusions; outlines come from Natural Earth (public domain). Use for \"Hoog style\", \"geography documentary\", \"urbanism / infrastructure explainer\", \"the $X plan for <city>\", \"why <country> is below sea level\", \"3D map documentary\", \"map plates with a legend\", \"history of a megaproject\", RealLifeLore / Wendover-like map explainers that should look like physical models. Builds on explainer-engine."
---
# Map documentary — plans as physical objects, cut like film

> `ENGINE` = `~/.claude/skills/explainer-engine/engine` (the **explainer-engine** skill: renderer, voice, score, QA). Rendered sample of this skill: `the sample film (the render is not included in this repository)` (source in `assets/sample/`).

A long-form narrated history/urbanism documentary in which **every map and plan is a lit physical object**: laser-cut
black acrylic plates with raised peach land and white coastlines, proposed works as extruded coloured blocks with a
small legend, a terrain tile floating on a grey seamless floor, a dark gallery whose ceiling lights flick on row by
row, white clay models on a blue sea, orange neon that draws routes, and ungraded archival plates. The camera always
creeps; the edit hard-cuts between coverage angles every ~5.5 s; text exists only *in the world* (labels, legend,
end-card credit). Built from frame analysis of 1 source video + 1 poster (references/sources.md). **Original work
only** — your own story and models; real geography only from open data (Natural Earth); never the channel's plate
designs, end-card wording or imagery.

## 1. Signature traits
- **Letterboxed 2:1** (1920×960 inside 1920×1080, 60 px bars) — part of the look; dark, low-key, ~⅓ dark frames.
- **Acrylic map plate**: black glossy slab with bevel highlight, peach land raised a few units (side layer + lit top),
  white 1.5-unit coastline, dark neighbours, thin rivers, small white caps labels with wide tracking.
- **Plans = extruded blocks** rising on the noun (yellow reclaimed land with white hatching, maroon works), a
  4-row colour key printed on the plate whenever zone colours appear.
- **One base map for the whole film**; plans are compared on **identical plates side by side** (row truck).
- **Other object types**: aerial terrain tile on a grey floor (hook), lights-on gallery with framed engravings
  (questions, people, history), white clay models on a blue-gradient sea (structures), physical cross-section model.
- **One glow colour**: orange neon tubes (routes, dams, "the line") with bloom and a hot leading tip.
- **Edit like live action**: hard cuts on sentence boundaries, wide ↔ close of the same model, camera never still.
- Deictic triple hook ("This is X. This is its Y. And this is Z.") over three camera positions; factual epilogue +
  white-on-black source credit, no CTA.

## 2. Target metrics
Source: ZADlkbr7Avg (Hoog, 12.7 min). QA: `out/qa/metrics.json` (sample = `samples/map-documentary`, 75 s, 24 fps).

| metric | source | target | sample |
|---|---|---|---|
| cuts_per_min | 9.36 | 8–10.5 | **8.8** |
| shot_len_median s (p10/p90) | 5.52 (2.1/12.4) | 4.5–6 | 5.62 (4.1/10.2) |
| scene_changes_per_min / scene_len_median | 8.97 / 5.34 | 8–10 / 4.5–6 | **8.8 / 5.17** |
| first cut / cuts in first 15 s | 8.6 s / 2 | 7–9 s / 2 | 10.5 s / 1 (see note) |
| motion_mean / p90 | 6.43 / 13.2 | 5–7 / 8–13 | 5.48 / 7.9 |
| hold_frac | 0.068 | ≤0.10 | 0.049 |
| colourfulness / saturation | 24.0 / 0.28 | 20–28 / 0.22–0.30 | 28.6 / 0.233 |
| brightness / dark_frame_frac | 0.36 / 0.32 | 0.30–0.40 / 0.2–0.35 | 0.35 / 0.32 |
| WPM overall | 145 | 138–150 | 141 |
| LUFS | −21.1 (web target −16) | −14 … −16 | −15.2 |

**Deliberate deviations:** the 60 px letterbox bars (11 % of every frame, pure black, saturation 0) are not in the
1280×640 source file, so saturation reads lower and brightness/dark frames shift; a 75 s film compresses 12 minutes
of pacing, so the opening fly-in and the closing row truck are proportionally longer and the camera drifts ~2× faster
than Hoog's 1–3 %/s creep (flat vector plates produce less measured motion than satellite textures and archival film).
The hook's oblique-tile → top-down-tile cut (7.5 s) scores 0.23 at ffmpeg's 0.33 cut threshold (same soft-textured
tile on both sides), so it counts as a scene change but not a hard cut; give the two sides different colour mass
(sea vs land) and it will register. Motion p90 stays ≈ 8 because there is no real archival film (illustrated plates
only) — push and pan the archival plates and keep the opening fly-in and closing truck fast to compensate.

## 3. Script formula
Beat map (% of runtime; sample times "Below the Sea", 75 s):

| % | beat | picture |
|---|---|---|
| 0–13 | **deictic triple hook** — "This is the Netherlands. This is the North Sea, higher than about a quarter of it. And this is how the Dutch keep them apart." | terrain tile orbit → dive to the coast → (cut) top-down, coast wall + dams rise |
| 13–20 | **the question + wry turn** — "So why build a country below the sea? Nobody did. It sank." | gallery lights on row by row, dolly to a framed engraving |
| 20–40 | **mechanism / context** in 2–3 shots (people → plans → consequences) | cross-section model wide → close; clay polder model |
| 40–60 | **plan 1, plan 2** on the base plate: marker, neon line, extrusion, legend | plate close-ups, a historical "cover" state |
| 60–70 | **the crisis** (archival) and **the answer** (works rising on the plate) | 2 archival plates → plate with blocks + legend |
| 70–85 | **the headline structure** as a clay model doing its job | barrier model, gates drop on the verb |
| 85–96 | **epilogue** — it is never finished | identical plates side by side, the defended line glows |
| 96–100 | **source credit card** — hard cut, white text on black | — |

- Narrator: one conversational, slightly wry investigative voice; rhetorical questions; one self-aware joke early.
- Kokoro `am_michael`, speed 1.02–1.05, gaps 0.3–0.6 s (0.8 between hook sentences), tail ≈ 3 s for the credit.
  Kokoro speaks ~170 wpm at 1.05 → overall ≈ 140–145 WPM with gaps. Spell numbers as words when the rhythm matters
  ("thirty-two kilometre"), digits for years.
- Facts: only what you can stand behind; prefer "about a quarter", "nearly seven metres", "over eighteen hundred".

## 4. Visual system
| role | hex | notes |
|---|---|---|
| plate acrylic / edge / bevel | `#131519` / `#0a0b0d` / `#6a6e76` | glossy black slab, 2 px bevel highlight, moving sheen band |
| land top (near → far) / land side | `#ebb198` → `#cf9178` / `#83594b` | raised 4 units; white coast `#fff` 1.5 |
| neighbours / their borders | `#2d2b30` / `#676168` | context only; rivers `rgba(255,240,232,.5)` 1.1 |
| zone: reclaimed / works / third | `#e2c25a` (side `#8c7431`) + white hatch / `#a52a3e` (side `#6e1626`) / `#c9d8e6` | one colour per zone type, matched in the legend |
| neon | tube `#ff8a2a`, core `#fff0dc`, bloom blur ≈ glow/2.4 | the only glow colour |
| studio floor | `#93a0a6` → `#62717a` → `#2f3d49` → `#151c22` | bluish greys (source #8b989c/#627075/#2e3d4d) |
| clay / sea for models | `#eef0f1`…`#a8afb6` / `#a3b8c9` → `#2f4966` → `#1b2b3d` | faces shaded by orientation |
| archival | sepia matrix + blur 0.9, vignette, dust | never graded to match the renders |
| text | white / `#8b8282` (secondary) | Montserrat 600 caps, tracking 0.28–0.42 em; legend Montserrat 500; credit Inter 500 32 px |

Composition: plates shot at 20–35° elevation (`rx` 54–66) so recession fills the wide frame diagonally; tops-downs
(`rx` 0–5) for maps; eye level (`rx` 89.5) for the corridor. Labels 14–26 plate units (≈ 22–45 px on screen),
legend lower-left of the subject, place labels beside features. DOF: tilt-shift bands (`dof` 0.1–0.95).

## 5. Characters & objects (kit.js)
No characters — people exist only as archival silhouettes. Objects:
- `K.plate(set, {cx, cy, s, labels})` → `{root, layer(z), w(px,py), pt(key), zTop}` acrylic plate of `GEO`
  (`K.proj(lon, lat)` → plate units; `plate.w(...K.proj(lon, lat))` → set coords for camera targets).
- `K.extrude(plate, {d, mask:{white,black}, n, h, top, side, hatch})` → `setH(h)` stacked-copy extrusion (masks cut
  lakes/holes, e.g. province − lake = reclaimed land). `K.extrudeStroke` = a wall along a stroked path (coast line).
- `K.box(parent, {x,y,z,w,d,h,rz,c})` → `setH(h)` 5-face CSS box (dams, pillars, slabs; hides at h≈0).
- `K.neon(layer, d)` → `set(u, glow)`; `K.marker(layer, {at, text, sub})` → `set(u, t)`; `K.label`, `K.legend`.
- `K.terrain(set)` procedural aerial tile (parcel strips oriented by region, towns at real coordinates, rivers, dunes).
- `K.gallery(set, {rows})` → `setLights(i => 0|1, end)`; `K.frame3d(parent, {x,y,z,w,h,rz,draw})` framed print.
- `K.claySea`, `K.windmill(parent)` (`setSail`, `setS`), `K.floor`, `K.shadow`, `K.vplane`, `K.flat`, `K.g3`.
- `K.archival(X, t0, t1, draw, {push, pan, tone})` full-frame B&W plate with weave/flicker/dust; `K.endCard`.
- `art.js` (sample illustrations): `A.engravingPolder` (ink engraving print), `A.planPrint`, `A.flood`, `A.breach`.

## 6. Motion grammar
| move | how | timing | ease |
|---|---|---|---|
| camera creep (every shot) | `K.shot` from→to, drift profile | whole shot, 3–10°/shot orbit + dolly 100–200 | linear with eased ends (`e` 0.03–0.08) |
| dramatic fly-in (hook) | `keys` with a dive | 3–4 s | `power3.inOut` |
| blocks rise / zone extrudes | `setH(h·R(t,t0,dur,'power3.out'))`, 3–4 f stagger | 0.5–1.4 s on the noun | power3.out |
| neon draws | `neon.set(R(t,t0,dur,'none'))` | 1.4–1.8 s, constant speed | none |
| lights on | panels step on 6 f (0.25 s) apart, front → back | ≈ 2 s | step |
| gates / drops | z tween, 2 f stagger | 0.5 s | power2.in |
| marker | ring back.out + leader draw + text fade, pulse every 1.6 s | 0.8 s | power2.out |
| archival | push 3–4 %/s + pan 15–25 px/s + 12 fps weave | whole plate | linear |
Objects hold after their event; the camera keeps moving. Nothing is ever static (hold ≈ 6 %).

## 7. Transitions
| name | build | when |
|---|---|---|
| hard cut between coverage angles (T1) | consecutive `K.shot`s on the same set, wide ↔ close, keep drift direction | the main edit, every 4–7 s |
| hard cut to a different object type | switch set (tile → gallery → model → plate) | each new idea |
| lights-on reveal (T5) | `gal.setLights` stepped, black first frame | questions / history |
| neon extrusion (T6) | `K.neon` grows on the verb | routes, dams, outlines |
| blocks rise (T8) | `K.box/K.extrude setH` staggered | each plan |
| archival insert (T9) | `K.blank` set + `K.archival` on the SVG layer | crises, dates, crowds |
| top-down crane (T10) | `rx` 0–5, slow `rz` turn, tile fills frame | after the hook dive |
| historical "cover" state | acrylic-coloured layer over land that existed later, faded out on "pumped dry" | before/after on one plate |
| cut to end card (T12) | `K.endCard` hard cut | end |
No dissolves, no wipes, no kinetic type.

## 8. Sound
`sound.json`: `ambient-space` (pads + bells; energy 2 hook → 1 question → 2 plans → 3 crisis → 2 → 0 credit),
`music_under_voice_db −17`, `sfx_db −3`, `lufs −15`, `end_hit false`. SFX on visual events only: `woosh_low` (fly-in,
wall/extrusion rising), `whoosh` (dive, truck), `click` per light panel (+ one low `thud`), `thud` per block,
`riser` under a neon draw, `slide` (dikes), `stamp` (gates), `drop`/`bubble` (drainage), `impact` on the archival cut.

## 9. Build recipe
1. `cp -r assets/template my-film` (index.html, scene.js, script.json, sound.json, kit.js, art.js, data/geo.js).
2. Geography: download the Natural Earth 10m GeoJSON (see `assets/tools/extract_geo.py` docstring) into
   `my-film/data/ne/`, edit `CONFIG` (lat window, centre lon, countries, lakes, rivers, provinces, points), run
   `python -I extract_geo.py data/ne data/geo.js preview.png`, LOOK at the preview. The first entry of
   `CONFIG.countries` becomes `GEO.focus` (peach land, `K.focus()`), the rest `GEO.others` (dark context land);
   pass `K.terrain(set, {cities: [[lon, lat, size], …]})` for your region's towns. Place structures at their real
   coordinates, then verify on a top-down debug still (`rx 0`) that they sit where the 1:10m coast shows water; drop
   features the 1:10m data cannot resolve rather than drawing them on land.
3. Write `script.json` to the beat map; run `ENGINE/make.sh my-film --draft --workers 3`.
4. Shot list in scene.js: cut times = line starts − 0.1…0.2 s; one `K.set` per object type; `K.shot` per cut; events
   on `X.word(...)`. Hook: tile `keys` (orbit → dive) then a top-down on the same tile. Keep one base plate.
5. `node ENGINE/render.mjs my-film --stills ...` at every cut ± 0.2 s and every event; then the full render
   `ENGINE/make.sh my-film --skip-tts --fps 24 --workers 3`.

## 10. QA checklist
- Stills: hook frames (tile fills the frame), every cut pair (the two sides must differ in colour mass or the cut
  will not register), each extrusion at full height, legend legible and in frame, end card.
- Gates: cuts/min 8–10.5, median shot 4.5–6, motion_mean ≥ 5, hold ≤ 0.10, dark frames 0.2–0.35, LUFS −15 ± 1.
- **Planes > ~6000 px silently fail to rasterize** in headless Edge (black floor) — keep floors ≤ 5600 and make the
  gradient reach its dark stop before the plane edge (kit clamps `spread`).
- Zero-height boxes must hide (kit does); time-gate every layer so "today" shots never show later states.
- `%` on negative time is negative in JS — wrap phase math (`((t % p) + p) % p`).
- Do: real outlines only, labels/legend in the world, one glow colour, camera always moving.
- Don't: flat 2D maps, kinetic captions, a second glow colour, bright high-key lighting, invented coastlines,
  copied channel plate designs or end-card wording, real archival photos without a licence (illustrate instead).

Files: references/analysis.md · references/sources.md · assets/kit.js · assets/art.js · assets/tools/extract_geo.py · assets/template/

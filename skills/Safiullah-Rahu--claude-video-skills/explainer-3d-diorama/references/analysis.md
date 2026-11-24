# 3D miniature diorama explainer: one small world on a seamless ground, a slow camera, physical object swaps

Analysed 2026-10-27 from two links posted together by a commenter in the Reddit thread (with no stated reasons):
"Let's Talk About Soil" (RIFS Potsdam / Global Soil Week, 2012, `1ND5Jl-jjmI`) and "Munters Service Agreements –
for peace of mind" (Munters, 2023, `N6g_IhC3HtQ`). Inputs: `frames/<id>/` sheets and metrics; frame-exact strips at
4-frame steps (`scratch_reddit/soil_a.jpg`, `soil_b.jpg`, `mu_a.jpg`, `mu_b.jpg`); per-frame change profiles
(`soil_fd.txt`, `mu_fd.txt`); single-frame k-means palettes. Audio was never heard.

**This is the corpus's first fully 3D style.** The engine renders SVG/HTML, so §11 gives a three.js route and an SVG
fallback. **Sibling:** `map-documentary` (Hoog) uses the same rendering kit, but its grammar is long-form
documentary with hard cuts and archival media. This style is short, uses a continuous camera and works in
metaphors.

---

## 1. Identity

A 2–5 minute narrated explainer set in **one small 3D world at a time, presented like a museum miniature**: a slab
of soil, a farm mosaic of tiles, a factory island on a plinth. Each sits **centred on a seamless ground** (a
vignetted parchment backdrop, or fog over a dark sea) and is lit softly from above. The camera **never cuts**: it
orbits, dollies, tilts up into clouds and dives through walls. Ideas are expressed by **physically swapping the
object**: a soil slab flips over and becomes gold bars; turf flips onto soil like a page; crates rain down and
splinter; grains fall through an hourglass; a factory's rooms glow red where things go wrong. People, when present,
are **faceless mannequins** (low-poly or white clay). Text is minimal: burned-in subtitles in the NGO skin, thin
line-icon HUD callouts and counters in the corporate skin.

**Two skins**
- **Parchment low-poly (Soil):** flat-shaded low-poly models (Cinema-4D-era), a warm parchment radial backdrop,
  physics vignettes, a slow reflective VO with subtitles.
- **Clay fog (Munters):** white-clay global-illumination renders, atmospheric fog, depth of field, navy/steel-blue
  grade, emissive windows, thin white HUD icons with leader lines, a brisk corporate VO.

## 2. Sources analysed

| id | title (uploader, year) | dur s | fps | cuts/min | median shot s | scenes/min (median) | motion mean / p90 | hold | colourfulness | WPM | LUFS |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1ND5Jl-jjmI | Let's Talk About Soil – English – subtitled (RIFS Potsdam, 2012) | 324.1 | 25 | 0.19 | 162.0 | 5.74 (7.1 s) | 6.11 / 19.06 | 0.252 | 29.3 | 105.5 | −16.3 |
| N6g_IhC3HtQ | Munters Service Agreements – for peace of mind (Munters, 2023) | 115.6 | 25 | 0.52 | 57.8 | 13.5 (3.0 s) | 8.37 / 18.25 | 0.113 | 30.6 | 133.9 | −23.8 |

| extra measurements | Soil | Munters |
|---|---|---|
| hard cuts | 1 (253.4 s, to black between acts) | 1 (86.0 s, inside a whip through a city map) |
| set changes counted by hand | ≈ 35 sets, ≈ 7 s each (agrees with `scene_len_median` 7.1 s) | ≈ 20 sets in 115 s, ≈ 4.5 s each |
| exact-hold frames / near-hold | 30 % / 38.5 % | 16.7 % / 23 % |
| motion bursts | 28.3/min (median 9 f, p90 61 f) | 20.3/min (median 4 f, p90 106 f: long continuous camera moves) |
| animated_frac | 0.685 (3D read as "footage") | 0.828 |
| brightness / dark frames | 0.547 / 16.7 % | 0.600 / 8.6 % |
| silence | 10.8 s | 3.5 s |
| motion deciles | 6.1 5.9 9.4 7.3 5.3 4.2 5.3 7.7 5.2 4.7 (even; physics peaks in the first third) | 9.7 8.5 6.2 1.2 7.7 10.1 11.3 **19.0** 8.7 1.4 (peak at the city fly-over and bubbles) |

## 3. Measured pacing

| quantity | target | practice |
|---|---|---|
| duration | 1.5–5.5 min | corporate ≈ 2 min; NGO/science ≈ 5 min |
| hard cuts | 0–0.5/min | only a fade/cut to black between acts, or a cut hidden inside a whip |
| set change | every 4–8 s | one statistic or claim per set; the camera move carries the hand-over |
| motion mean | 5–9 (p90 ≈ 18–19) | gentle drifts with short physics/fly-through spikes |
| holds | 10–30 % | the camera rarely stops; an object holds while the camera keeps orbiting |
| speech | 105–135 WPM | NGO: slow, poetic, with pauses (silence 3 %); corporate: brisk, no pauses |
| loudness | −16 to −24 LUFS | target −16 |
| dark frames | 8–17 % | dark sets for "loss" or "risk" beats (space, darkness, fog at night) |

## 4. Script & narrative structure

**Soil (NGO / science policy, 324 s)**

| s | % | beat |
|---|---|---|
| 0–17 | 0–5 | **poetic hook** in three short sentences ("We overlook it. We walk all over it…"); black, then low-angle walking feet, then a man looking at camera |
| 17–36 | 5–11 | the subject named; why it matters: a forest tile, a soil slab, turf flips on, a farm mosaic |
| 36–62 | 11–19 | how it forms: decomposition, "10 cm in 2,000 years" as an **hourglass of soil grains** |
| 62–135 | 19–42 | the losses as a **statistic cascade** with physical scale proxies: forest cut, erosion, 24 billion t, 3.4 t per person (crates rain and splinter), $70 per person (banknote, then towering money stacks), city sprawl ("an area as large as Berlin": a city tile) |
| 135–215 | 42–66 | value and conflict: the slab turns to gold bars, land grabbing (a briefcase), displaced families, hunger (an empty bed), a second Earth "we might not want to rely on" (Earth in space) |
| 215–253 | 66–78 | attention and the metaphor of debt: a to-do list, supermarket shelves, "a bank account into which we never make any deposits" |
| 253–277 | 78–85 | **the turn**: "But there is good news" after a cut to black |
| 277–303 | 85–94 | principles and rights: a fenced soil tile on a white paper sheet, "not a factory", "safeguarded by the law" |
| 303–324 | 94–100 | **call to action** ("Now it's up to us…") over a final farm diorama with the man; the end card is a URL plus 10 partner logos on white |

**Munters (corporate service, 116 s)**

| s | % | beat |
|---|---|---|
| 0–9 | 0–8 | logo on white dissolves through clouds onto a factory island at sea; credibility claim ("used by almost all major industries") |
| 9–19 | 8–16 | the two variables (humidity, temperature) as HUD gauges counting in fog |
| 19–31 | 16–27 | **stakes as a question** ("what is at stake when…?"); a building cutaway whose rooms turn red |
| 31–52 | 27–45 | the risk list (downtime, lost production, quality, energy cost, repair cost, safety, lifetime), **one HUD callout per noun** on a plinth model |
| 52–60 | 45–52 | proactive vs corrective: a wrench in the clouds |
| 60–83 | 52–72 | the people and network: mannequin technicians unpack parts beside the product cabinet; a van crosses a sea bridge |
| 83–103 | 72–89 | **anaphoric application list** ("from the clean room to the museum, from the … to the …"): a city fly-over, then floating bubbles with a miniature inside each |
| 103–116 | 89–100 | CTA (contact the team), clouds, logo on a blue sky gradient (7 s) |

**Common rules:** no presenter and no title card. The hook is either a three-beat poetic line or a brand
credibility claim. Every claim gets **one physical metaphor object**, centred. Statistics are always given a
human-scale proxy (per person, a city, an hourglass). Lists are delivered as rapid set changes or callouts, one per
spoken noun. The end is a turn to hope or to service, a CTA and logos.

## 5. Visual system

### Palettes (single-frame k-means and `metrics.json`)

| role | Parchment low-poly (Soil) | Clay fog (Munters) |
|---|---|---|
| backdrop | parchment radial: centre #d9ce9f / #d0cc90 → mid #bcb080 → edge #928758 (darker vignette corners) | fog navy #253445 / #1b2738 → steel #365879 / #43678c; daylight sets in clay grey #cac1bd / #aba39f |
| hero material | soil #1f1712 / #231915, grass #757d3f / #4e5627, wheat #ecda97, wood #5c493d | white clay #d6d1cc, mid grey #777e83 |
| accent | gold (bars), white paper #f4f1eb, banknote grey-green | emissive warm windows (#f1c27a *eyeballed*), problem rooms in muted red-magenta #54364a → glowing red, brand blue #3d77b7 (logo, end sky #2e6eb3 → #7e98c6) |
| dark sets | black/near-black #15120d (space, the darkness act) | night navy #1b2d3e |
| text | white subtitles | white HUD lines and numbers |

Rules: one backdrop family per film; the hero objects carry the local colour; one emissive or metallic accent per
skin (gold / warm windows / red warning). Colourfulness stays at about 30 in both.

### Shape and material language
- **Parchment low-poly:** flat-shaded facets (trees as 1–2-level icosahedra, people as faceted mannequins with
  hair caps and barely-there faces), square tiles 1 unit wide with soil sides visible (a "core sample"), wooden
  crates, an hourglass with turned posts, simple furniture. Shadows are soft and contact-tight. Small detail is
  kept (cows, tractors, a farmhouse) but stays chunky.
- **Clay fog:** everything in a matte white/grey clay (roughness ≈ 0.9) except glass, emissive windows and the
  logo; architecture as cutaway shells; the product as a monolithic cabinet; mannequins with caps and no faces;
  water as a dark glossy plane with a faint grid; volumetric clouds.

### Lighting, depth, atmosphere
- Soil: one soft key from the upper left, soft ambient, short soft shadows, no fog. The backdrop vignette does
  the depth.
- Munters: soft sky light plus a low warm or cold key, **exponential fog** that swallows the horizon, depth of
  field on close-ups, rim light on silhouettes, emissive sources that bloom slightly.
- Both: a single hero object or cluster in the centre third, with lots of empty backdrop around it.

### Composition
The hero sits centred at 40–60 % of the frame width on a three-quarter top-down angle (≈ 30–40° elevation).
Close-ups go low and tight. HUD callouts sit around the hero on elbow leader lines without overlapping it.
Subtitles go bottom-centre in the lowest 8 %.

### Typography
- Soil: white sans subtitles (≈ 30 px at 1080p), bottom-centre, one line, timed to the VO. A handwritten to-do list
  prop carries the only stylised text. The end card has small grey sans text and partner logos on white.
- Munters: no running text. HUD numbers in a clean geometric sans (≈ 30–36 px: "47 %", "33 °C"), thin-line icons
  (gauge, thermometer, shield, wrench) in white 2–3 px strokes inside circular badges, and the logo on the end
  sky. Free look-alikes: Inter / Montserrat 500.

## 6. Characters & objects

- **Mannequins, not characters.** Soil uses a faceted man in a blue shirt who appears three times (hook, mid-film,
  ending) as "us". Munters uses white-clay technicians with caps who unpack parts and tap a tablet. Neither has a
  face to read; their bodies do simple tasks (walk, carry, tap, look).
- **The hero object is the actor.** Slab, tile, hourglass, crate, gold, briefcase, bed, supermarket shelf,
  factory island, cabinet, wrench, van, bubble.
- **Object verbs:** flip (rotate 90–180° to reveal a new object underneath), peel (a surface layer rolls off like a
  sheet), rain (many copies fall and pile up or smash), split (tiles slide apart), glow (rooms or windows light
  up), count (HUD numbers tick), enclose (a fence rises around a tile), float (miniatures inside bubbles).
- Build an original object kit for each topic. Do not reuse a client's product cabinet design or logos.

## 7. Camera & transitions catalogue

Measured at 25 fps; durations in frames at 25 fps.

| # | transition | build | duration | easing | frequency |
|---|---|---|---|---|---|
| T1 | **Slow orbit / turntable** (Soil 136–138.5 s) | the hero rotates or the camera orbits at ≈ 5–8°/s, 30–40° elevation, while the VO speaks | 2–6 s | linear or sine.inOut | the default between events |
| T2 | **Flip-swap** (Soil 138.5–138.9 s) | the hero tumbles over (≈ 90–120°) toward the camera and lands as a different object (soil slab → gold bars) | ≈ 10 f | power2.inOut | ≈ 6× |
| T3 | **Peel / page-turn layer** (Soil 26.9–27.4 s) | a surface sheet (turf) curls on from one edge and flips flat onto the base tile, revealing a new state | ≈ 14 f | power3.inOut | 2–3× |
| T4 | **Mosaic split** (Soil 35.2–35.9 s) | a tiled diorama breaks apart: tiles slide out and drop away one by one while the camera keeps moving, leaving one tile | ≈ 18 f | power2.in | 2–3× |
| T5 | **Rain-and-pile physics** (Soil 100–103 s; 52–55 s) | many copies (crates, grains, coins) fall into frame and pile up or smash into splinters on a tile | 2–3 s | gravity (baked) | for every big statistic |
| T6 | **Fade/cut to black between acts** (Soil 215.9–216.6, 253.4 s) | the scene darkens to black over ≈ 18 f, or a hard cut to black under a pause | 0–18 f | sine.in | 2× |
| T7 | **Paper-sheet wipe** (Soil 276.3–277.0 s) | a white crumpled sheet flies in and flattens beneath the next hero, replacing the backdrop | ≈ 18 f | power3.out | 1–2× |
| T8 | **Logo dissolve through clouds** (Munters 3.1–4.4 s) | the logo on white cross-dissolves while clouds part onto the hero island | ≈ 32 f | sine.inOut | opening |
| T9 | **Push through an opening into darkness** (Munters 9.8–10.7 s) | the camera dollies into a door until it fills the frame and goes dark, then HUD elements appear in fog | ≈ 22 f | expo.in | 2× |
| T10 | **HUD counter overlay** (Munters 11–14 s) | thin white line icons (gauge, thermometer) fade up in fog; numbers tick ±1 per 2–4 f while needles rotate | ≈ 3 s | linear count | 1–2× |
| T11 | **Callout bloom** (Munters 41–44 s) | round icon badges pop beside model features on elbow leader lines, one per spoken risk noun (≈ 0.3–0.5 s apart), each a 4–6 f pop with a 6 f line draw | 4–6 f each | back.out(1.5) | 1 list |
| T12 | **Light-streak whip** (Munters 28.2–28.4 s) | horizontal bright streaks smear across the frame for 4–5 f, hiding a set change | ≈ 5 f | — | 1–2× |
| T13 | **Tilt-up into clouds** (Munters 48–51 s) | the camera tilts up off the model into fog, then a cloud bank (≈ 75 f); the next set descends out of the clouds | ≈ 3 s | sine.inOut | 2–3× |
| T14 | **Fly-over swoop** (Munters 84–86.4 s) | the camera skims fast over a white-clay city with motion blur, cranes up to top-down, and the city becomes a map that whips into the next set (the measured cut is hidden here) | ≈ 60 f | power2.inOut | 1× (energy peak) |
| T15 | **Bubble vignettes** (Munters 88–103 s) | macro water droplets/bubbles drift past, each holding a miniature of one application; one bubble per spoken item | ≈ 2.5 s each | sine drift | 1 list |

## 8. Motion grammar

- **The camera is always moving, slowly:** orbits at 5–8°/s, dollies at ≈ 2–4 % of the frame width per second,
  ease in and out at both ends. Objects mostly hold while the camera travels.
- **Events are physical** and obey gravity, inertia and settling: flips land with a small bounce, rain piles up,
  tiles drop with acceleration. Bake physics offline so renders are deterministic.
- **One event per claim:** a statistic gets one physical event; a list gets one callout or bubble per noun.
- **Holds** come from a slow orbit rather than freezing (Soil 30 % exact holds; Munters 17 %).
- **Rhythm against narration:** the object swap lands on the key noun or number; HUD numbers count while the
  variable is named; set changes ride camera moves that begin in the pause before a sentence.

## 9. Sound (inferred)

- **VO:** Soil has one male narrator, slow and reflective (105 WPM) with deliberate pauses, plus English
  subtitles. Munters has a calm corporate male narrator at 134 WPM.
- **Music:** Soil an ambient/acoustic piano-and-strings bed (*inferred*); Munters a soft corporate pulse rising for
  the fly-over (*inferred*).
- **SFX:** physical foley for the events (crates smashing, grains pouring, turf flapping, wind in the clouds) and
  soft UI ticks for HUD callouts (*inferred*).
- **Loudness:** −16.3 (Soil) and −23.8 LUFS (Munters). Target −16.

## 10. Do / Don't

**Do**
1. Present one small world at a time, centred on a seamless vignetted backdrop or fog.
2. Keep the camera moving slowly (orbit 5–8°/s, gentle dollies) and never hard-cut inside an act.
3. Turn every claim into a physical event on the hero object: flip, peel, rain, split, glow.
4. Give every statistic a human-scale proxy (per person, a city, an hourglass).
5. Use faceless mannequins for people; let objects do the acting.
6. Choose one skin: flat-shaded low-poly on parchment, or white clay in fog with DOF.
7. Light softly from above with short soft shadows; add fog and bloom only in the clay skin.
8. Pop HUD callouts on elbow leader lines, one per spoken noun, around (not over) the model.
9. Hide set changes in camera moves (a tilt into clouds, a push through a door, a fly-over swoop).
10. Mark acts with a fade or cut to black, and turn to hope or service at about 80 %.
11. Burn in subtitles for NGO/international pieces (one line, bottom-centre).
12. Bake physics and particle simulations offline into keyframes so every frame renders identically.

**Don't**
1. Don't cut between angles; this is not documentary coverage (that is `map-documentary`).
2. Don't use photoreal textures or real-world logos on the models; keep clay or faceted surfaces.
3. Don't put more than one hero cluster on screen at a time.
4. Don't let people's faces or lip-sync carry meaning.
5. Don't mix the warm parchment and cold fog skins in one film.
6. Don't fill the frame with text; the HUD is icons and numbers, the subtitles one line.
7. Don't move the camera fast except for one energy peak (a fly-over) per film.
8. Don't use real-time physics in the render loop (non-deterministic frames).
9. Don't overload the scene with polygons or post effects if the render machine has no strong GPU.
10. Don't end without a CTA and a logo or partner card.
11. Don't use more than one emissive/metal accent colour per skin.
12. Don't copy the source's product cabinet, branded van livery or partner logos.

## 11. Replication recipe (code)

**Preferred route: three.js inside the engine page.** Add three.js (pin a version, e.g. `three@0.169.0`) to the
project and render one frame per seek:

```js
// index.html: <canvas id="gl" width="1920" height="1080"> under the SVG overlay; the stage background is the backdrop
const renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 200);
// Parchment skin: transparent canvas over a CSS radial gradient backdrop
stage.style.background = "radial-gradient(ellipse at 50% 45%, #d9ce9f 0%, #bcb080 55%, #928758 100%)";
const mat = c => new THREE.MeshLambertMaterial({ color: c, flatShading: true });          // low-poly facets
// Clay skin instead: scene.fog = new THREE.FogExp2(0x253445, 0.035); MeshStandardMaterial({ color: 0xd6d1cc, roughness: 0.9 })
scene.add(new THREE.HemisphereLight(0xfff6e0, 0x5a5040, 0.9));
const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(-4, 8, 5); key.castShadow = true; scene.add(key);

const camState = { az: 0, el: 35, r: 9, tx: 0, ty: 0, tz: 0 };   // GSAP tweens these; the camera is derived
X.every(t => {
  const a = THREE.MathUtils.degToRad(camState.az), e = THREE.MathUtils.degToRad(camState.el);
  cam.position.set(camState.tx + camState.r * Math.cos(e) * Math.sin(a), camState.ty + camState.r * Math.sin(e),
                   camState.tz + camState.r * Math.cos(e) * Math.cos(a));
  cam.lookAt(camState.tx, camState.ty, camState.tz);
  baked.apply(t);                    // physics keyframes baked offline (cannon-es → JSON of positions/quaternions)
  renderer.render(scene, cam);
});
X.tl.to(camState, { az: 40, duration: 6, ease: "sine.inOut" }, 12);              // T1 orbit
X.tl.to(slab.rotation, { x: Math.PI * 0.6, duration: 10 / 25, ease: "power2.inOut" }, swapAt)   // T2 flip-swap
    .set(slab, { visible: false }, swapAt + 5 / 25).set(gold, { visible: true }, swapAt + 5 / 25);
```

**Performance and determinism:** keep scenes under ≈ 50 k triangles and use at most one shadow-casting light; skip
SSAO/bloom passes unless a GPU is available (headless Edge falls back to software WebGL without one). Seed every
procedural scatter (`X.rand`). Bake physics, particles and cloth (the turf peel can be a hand-keyed bend
deformer) offline.

**SVG fallback (parchment skin only):** pre-project each tile and box with a fixed isometric camera into SVG
polygons, shading the three visible faces at fixed tones (top 100 %, left 78 %, right 62 % of the base colour), and
fake the orbit by switching between 8 pre-rendered azimuths. Good enough for tile mosaics and slabs; not for fog,
DOF or clay.

**HUD overlay (clay skin):** an SVG layer above the canvas. Each callout projects a 3D anchor to screen space every
frame (`v.project(cam)`), draws an elbow leader (6 f draw) and pops a 64 px circular badge with a 2.5 px white line
icon. Counters use `X.countUp`.

**Defining shots and how to build them**
1. **Core-sample slab on parchment:** a 1 × 1 × 0.25 soil tile with visible soil sides, turntable orbit at 6°/s,
   one-line subtitle, then a flip-swap into the metaphor object (gold bars).
2. **Farm mosaic:** a 3 × 3 grid of tiles (forest, wheat, pasture with cows, farmhouse) that splits apart tile by
   tile (T4) as the VO moves to the loss.
3. **Statistic rain:** crates fall out of darkness and splinter on a grey tile while the number is spoken (T5).
4. **Clay island in fog:** a factory on a circular plinth in a dark sea of fog; warm windows; the camera orbits;
   HUD callouts bloom one per risk noun (T11).
5. **Cloud tilt and bubbles:** tilt up into clouds (T13); descend into floating bubbles, each holding a miniature
   application (T15); end on a clean blue sky with the logo.

## 12. Per-video notes

**Let's Talk About Soil (324 s)**
- 2012 Cinema-4D-style low-poly with burned-in English subtitles (the title marks this upload as the English
  subtitled version).
- One hard cut (to black at 4:13) marks the turn to "good news".
- The longest single metaphor runs: the hourglass of soil (48–62 s) and the money stacks (110–125 s).
- The end card holds 10 partner logos on white for ≈ 16 s.

**Munters Service Agreements (116 s)**
- A continuous camera for the whole film (one cut hidden inside the fly-over whip).
- The red-room cutaway and the HUD callouts carry the "risk" section without any on-screen words.
- The application list ("from the clean room to the museum…") maps one bubble to each noun.
- The brand's product cabinet and logo appear on models. Replace them with a generic hero in original work.

## 13. Source-list issues

- The thread gives no reason for either pick. Both were posted in the same comment together with the Hoog
  documentary, which belongs to a different style (`map-documentary`).
- `animated_frac` reads 0.685 and 0.828: 3D renders are partly classified as footage. Use these videos'
  metrics for pacing, not for the animation share.

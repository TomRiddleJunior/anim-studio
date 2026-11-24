---
name: explainer-survival-scenario
description: "Makes a vertical 9:16 'survival scenario' story reel (80-110 s) in the format of a viral Instagram series (@survival.stories_en, 'The Lighthouse · Day 1', 504k likes), rebuilt as a physically lit 3D diorama: a thesis hook (why this place is a lucky one to be in when the outbreak starts, then a one-line warning that opens the loop), one named character with an age and a job, a calm routine broken by a radio message, a reasoned decision (a 'what if' about the danger), the place's one advantage, an inventory with numbers, a three-item checklist that gets ticked, a one-line reversal (the plan looks complete, but one thing was missed), and two end cards (a question for the comments, then the next day with a follow prompt). A flat HUD stays on top: a night clock top-left (DAY 1 · 9:47 PM, ticking), name/fact tags, chips, a typed radio panel, a cream supplies card, a survival-plan checklist, a '?' over the head, one caption phrase at a time coloured by meaning (red danger, green safe, amber facts). Built in code with HyperFrames + three.js: 3-patch procedural mountain terrain, ~9k instanced swaying conifers, drifting moonlit valley fog, a burning town with smoke, a headlight convoy, a 30 m steel lookout tower with a furnished cab (Osborne firefinder, labelled supply locker), a maquette-grade posable heroine with calm/worried/determined expressions (sheen fabric with woven normals, wrap-lit skin, parted hair and ponytail), moon shadows through window mullions, warm practical lights, screen-space light shafts, bokeh DOF, bloom, colour washes, grain; a synthesized night bed (wind, tension drone, crickets) and story SFX. Use for 'survival scenario reel', 'what would you do story', 'zombie apocalypse at a <place> series', 'Day 1 / Day 2 survival story', 'survival.stories style', 'cliffhanger story reel with HUD clock and checklist', or any place-plus-plan-plus-fatal-flaw story told in parts. Builds on explainer-engine (TTS, QA) and hyperframes."
---
# Survival scenario — one place, one plan, one thing forgotten (Day 1 of a series)

Reverse-engineered from one Instagram reel (**@survival.stories_en**, `De0HQ6Mpycw`, "The Lighthouse · Day 1", 110.5 s,
504k likes, 3.1k comments; source notes in **Appendix A** below, sources in `references/sources.md`). The format is a
narrated **thought experiment**: the narrator states why a place is safe, introduces one person, breaks their routine with
a message, walks through a reasoned decision, inventories their supplies, ticks a checklist, then pulls the rug with a
one-line reversal and asks the viewer to answer in the comments before Day 2.
This skill keeps the beat map, HUD/caption system and pacing, and makes it **more realistic** (a lit 3D diorama instead of
flat vector) and **more eye-catching** (a moving camera, one strong light per shot, a reveal every ≤ 5 s).
Sample: `the sample film (the render is not included in this repository)` — "The Fire Tower · Day 1"
(98.3 s): a fire lookout alone on a 30 m tower when a valley town falls; the advantage is one ladder that can be pulled up.
More samples on other worlds (kit v2.1, §14; the rendered sample films below are not included in this release):
- `samples\survival-vault\out\survival-vault.mp4`, "The Vault · Day 1" (97.7 s): a night guard seals herself in her bank's vault (forgot: air).
- `samples\survival-icestation\out\survival-icestation.mp4`, "The Ice Station · Day 1" (95.3 s): a winter-over meteorologist sends the last plane away (forgot: summer thaws the frozen).

Batch 7 (kit v2.2, §5 and §15), each with its own lead:
- `samples\survival-spacestation\out\survival-spacestation.mp4`, "The Space Station · Day 1" (99.7 s): Ines turns the cargo ship away (forgot: the ship was also the station's engine).
- `samples\survival-volcano\out\survival-volcano.mp4`, "The Volcano · Day 1" (101.0 s): Leila, on a ridge hut ringed by lava, sends the helicopter away (forgot: the eruption is ending and the crust hardens into a road).
- `samples\survival-warehouse\out\survival-warehouse.mp4`, "The Warehouse Store · Day 1" (94.6 s): Dario, the first male lead, locks himself in on Thanksgiving night (forgot: the doors open at 5 AM on a timer).
- `samples\survival-bunker\out\survival-bunker.mp4`, "The Doomsday Bunker · Day 1" (95.9 s): Grace, the caretaker, keeps a billionaire's bunker for herself (forgot: it opens for the owner's face, and he lands at 5:40).
- `samples\survival-castle\out\survival-castle.mp4`, "The Wedding Castle · Day 1" (100.0 s): Maya, the wedding planner, raises the drawbridge (forgot: the midnight fireworks).
- `samples\survival-monastery\out\survival-monastery.mp4`, "The Monastery on the Rock · Day 1" (97.8 s): Elif cuts the basket rope (forgot: visitor 41 is still up there).

## 1. Signature traits
- **A place that sounds safe** + **one person** (name · age · job tag) + **one routine** + **one message** that breaks it.
- **Reasoned, not heroic**: the character considers the obvious move, stops, and the narrator explains *why* in one
  "what if…" sentence. Then the place's **single advantage** stated as a rule (e.g. "Zombies can't climb").
- **Numbers**: an inventory said item by item with quantities, then a card with bars and a rough duration.
- **A checklist payoff** at ~80 % (a three-item checklist, each item ticked on its word) and the **turn** at ~90 %
  (a one-line reversal: the plan holds in theory, but one thing was missed).
- **HUD clock** top-left ticking through one night; **tags** that pop near the top; **captions one phrase at a time**,
  coloured by meaning; **colour washes** on emotional beats; **two black beats** (open loop + cliffhanger) where the place
  sits small in the dark surrounded by **red eyes**.
- **End cards**: a two-line question (white line + red last word) with a comment-prompt pill, then the place name, a big
  red day number and a follow pill, in red with a glow. The answer is never said (it is planted for rewatchers).

## 2. Target metrics
Source: engine analyzer metrics (analysed locally for reference only). Sample: the Fire Tower delivery render's `out/qa/`
(metrics, gates); the sample project itself is not included in this release.

| metric | source | sample (final) | gate |
|---|---|---|---|
| duration | 110.5 s | 98.3 s | 80–100 s (brief) |
| WPM overall | 134 | 135.5 (+1 %) | ±20 % |
| scene changes / min | 3.26 | 9.16 (×2.8, explained below) | ±20 % |
| hard cuts / min | 1.63 | 3.05 | — (we cut more; see §6) |
| motion mean | 1.78 | 4.33 | may exceed (brief asks for life) |
| brightness · colourfulness | 0.228 · 36.6 | 0.258 · 44.9 | dark film, ±30 % |
| loudness · true peak | −14.6 LUFS · — | −14.3 LUFS · −1.1 dBTP | −14 ±1 LUFS, ≤ −1 dBTP |
| voice over bed+SFX | (no bed) | 13.3 dB (bed alone 20 dB) | ≥ 10 dB |
| first word | 0.1 s | 0.18 s | ≤ 0.4 s |

**Measured on the delivery render** (`out/qa/metrics.json`, `gates.json`). Hook, duration, WPM, loudness, true peak,
voice level, YAVG (0 unplanned dips) and Whisper all pass.

**Scene changes are an explained miss: 9.16/min against 3.26** (7.93 before the Hazel v2 pass).
- The analyzer counts a scene change when the 64-bin colour histogram of frames 1 s apart moves by ≥ 0.28.
- The source's sets share one flat navy palette, so it registers only 6 of its 13 set changes. Counted by eye from the
  timeline: lighthouse, black, interior, radio, pier, crowd, map, storeroom, door, ladder, desk, black, card, card.
  That is 13 in 110.5 s = 7.1/min.
- Ours registers 15 in 98.3 s = 9.2/min (×1.3 of the source's real set-change density). Our lit warm interiors against cold exteriors make every set change visible to the histogram.
- **Tried:** 1.0–2.0 s cross-dissolves (the `xf` shot option, kept in the player) did not move the count, because camera moves inside a shot (pull-backs from a lit window, tilt-ups) shift the palette too. Darker catwalk shots shaved 0.1 off d but not enough.
- **Not done:** flattening every shot into one navy palette would satisfy the metric but undo the brief's realism, its accent-light rule and its "something changes every 2–3 s".
- **If a client needs the metric:** keep interiors under one dim warm practical, keep the warm areas below a quarter of the frame, and alternate interior and exterior no more than 4 times per film.

**Other deviations.**
- Cuts 3.05/min against 1.63, and motion 4.33 against 1.78. The brief asks for a moving camera and a change every 2–3 s.
- Colourfulness +23 % (the warm accent light) and brightness +13 %.

## 3. Beat map (% of runtime) and script formula
| % | beat | example line (Fire Tower) |
|---|---|---|
| 0–9 | **Thesis hook** over the hero shot of the place; a **green wash** on the safe-place phrase | "When the dead start to walk, a fire tower is the place to be. Consider the high ground yours." |
| 9–13 | **Open loop** on a black beat with red eyes | "As long as nothing gets overlooked." |
| 13–25 | **Meet + routine**: name, age, job, the distance/height fact, three routine items (chips) | "Meet Hazel. She's thirty-four. She watches the forest for fires, from a cabin a hundred feet up. … Scan for smoke, log the weather, radio in: all clear." |
| 25–28 | **Turn**, red wash | one short line that ends the calm (write your own) |
| 28–39 | **Message**: a dim beat on the time, the device wakes, a typed panel | "At nine fifty-two, the radio crackled. Dispatch… Outbreak in Silver Fork. All units, stay out of town." |
| 39–44 | **First instinct** + "?" | "…take the truck and drive home. But she stopped." |
| 44–52 | **The reasoning** (the crowd/danger), red tag + wash | "What if the whole town is driving up this road… One road, and some of those cars carry the infected. Going down is too dangerous." |
| 52–63 | **Decision + the one advantage** as a rule + a "= WALL" tag and a distance/height line | "So Hazel decided to stay… Zombies can't climb. A hundred feet of steel, better than any wall." |
| 63–77 | **Inventory** item by item (tags) → supplies **card** | "Sixty cans of chili, twenty pounds of rice, eight jugs of water, and a rain barrel on the roof. That could last her for weeks." |
| 77–83 | **Lockdown**: two physical actions (green "CUT OFF" tag) | "She pulled the bottom ladder up. She bolted the trapdoor behind her." |
| 83–90 | **Plan = payoff**: checklist ticks, then a one-line doubt with a dim | three items, each ticked on its word, then one short line of doubt |
| 90–94 | **Cliffhanger** on the black beat, eyes closer | "But Hazel overlooked something." |
| 94–100 | **End cards** (silent in the source) | WHAT DID SHE MISS? · THE FIRE TOWER DAY 2 |

- **200–250 words**, 20–22 lines, phrases of 2–6 words; the narrator speaks in the past tense, third person, plainly.
- **The forgotten thing** must be plausible, answerable, and *planted*, never said. Sample: she is a *fire* lookout in the
  driest week (routine "scan for smoke", a FIRE DANGER EXTREME dial on the wall, "RH 9 %" in the log, the town burning
  up the valley; with the ladder up there is no fast way down and no water to fight a fire). Leave room for rival answers
  (keys, batteries, water) — arguments are comments.
- **Voice**: one deep male narrator, median f0 ~100 Hz. Kokoro blend `am_onyx,am_michael` (103 Hz, p10/p90 86/131 vs the
  source's 96, 75/133), speed 1.02 (≈ 172 WPM while speaking; 0.95 for the last line). Gaps 0.36 s default, 0.6–0.9 s
  before beats that need air. Check with Whisper `small` (numbers come back as digits; that is fine).

## 4. Visual system (realism layer)
| role | source (flat) | ours (lit 3D) |
|---|---|---|
| night | navy `#0d1831`/`#1a243d` flat fill | sky dome (zenith `rgb(.007,.013,.036)` → horizon `.05,.075,.14`, hashed stars, moon glow), fog `#1b2a50` FogExp2 2.4e-4 for layered ridges, hemisphere `#3e5590`/`#1a2216` |
| key light | none | **moon**: directional `#a8bcff` 2.4, 19° up, from the NNE, 2048 PCF-soft shadow over ±46 m (mullion shadows on the cab floor) |
| warm accent | lamp glow sprite | desk lamp (point `#ffb062`, cube shadow, far 7 m) + hanging lantern (`#ffb874`) inside; **yard light** (`#ffbf78`) at the base; cab windows glow from outside (lamp 9, lantern 5 in exterior shots) |
| place | lighthouse, sea | 3-patch terrain (3 m / 11 m / 60 m) with a summit, a valley channel to the town, a ring of ridged ranges; ~9k instanced conifers swaying (vertex wind, shadowed); 6 drifting fog sheets in the valley; a town (900 lights, fire glow, 3 smoke columns); a switchback road + 24-car headlight convoy |
| props | flat icons | 30 m steel tower (legs, girts, X-braces, ladder with a retractable bottom flight + winch, landings), catwalk + railing, cab (panels, mullions, physical glass, hip roof with rain barrel + catcher, solar panel), furnished interior (firefinder with map, desk, radio with a lit LCD + TX LED, lamp, log book, mug, chair, bunk, locker with 60 instanced chili cans, rice sacks, water jugs, first aid, fire-danger dial, topo map, hatch + bolt), a pickup truck |
| grade | — | ACES filmic, sat 0.92, contrast 1.06, vignette 0.36, bloom 0.14, chromatic fringe 0.0016, grain 0.032, blue lift; colour washes in the composite: green `[.25,.95,.5]` 0.3, red `[1,.18,.12]` 0.4–0.55, amber-red 0.3 under the radio |
| depth | — | half-res scatter-as-gather bokeh DOF (aperture 0–2 wides, 6–12 interiors), screen-space light shafts toward the moon (`raySky`) or the cab (`rayAt`) |

- **Safe area**: captions centred at 74 % (y 1350–1520 of 1920), sides ≥ 64 px; HUD from y 160 (below the top 8 %);
  tags at y 330 (17 %); nothing important in the bottom 20 %.
- **One strong focal light per shot** (moon, cab glow, lamp, yard light, radio LCD); the accent colour is warm orange
  against the blue night; Hazel's jacket (`#c65a22`) is the warm accent in every interior.

## 5. Characters
- `K.hazel()` (`assets/kit/survival-kit.js`, **v2**) is a stylised figure built to the standard of a premium vinyl collectible or a feature-animation maquette. Everything is generated:
  - **Body:** swept superellipse shells (`sweepGeo`) give a real silhouette. Neck; sloped shoulders; a chest that tapers to the waist; a jacket with a stand collar (open at the front), hem band, cuffs, zip and pull, yoke and side seams (`tubeGeo` along the surface), flap hand-warmer pockets and a zipped chest pocket; an undershirt collar; trousers with knees and hem flare; boots with vamp, sole, heel and laces.
  - **Limbs:** tapered sleeves and legs on shoulder, elbow, hip and knee joints. Mitten hands with a thumb; the fingers curl per pose (`curl`).
  - **Head:** a sculpted sphere with cranium, jaw taper, chin, cheeks and eye sockets, plus vertex-colour blush.
  - **Eyes:** clearcoat sclera, a textured iris cap, a catchlight, upper and lower lids with a lash line, and gaze via `look`.
  - **Face:** a nose bridge, tip and alae; ears; brows and lips as morph-target tubes. `fz(x, y)` gives the exact front surface, so features sit on the skin.
  - **Hair:** a hairline-cut cap with a side parting groove, volume and soft sculpted locks; two swept fringe locks; a tapered ponytail with a green tie that sways with `t`; strand normals plus a colour-streak map.
- **Materials:**
  - **Fabric:** `MeshPhysicalMaterial` with sheen and a woven normal map, procedural plain weave on the jacket and twill on the trousers.
  - **Skin:** wrap lighting with a warm terminator scatter, done by patching `RE_Direct_Physical` in `skinMat()`, so it reads soft, not plastic.
  - **Hair:** sheen for the soft rim.
- **Other leads (kit v2.2).** Every option is additive; with none, Hazel renders exactly as before. The six batch-7 leads are presets in their world modules (`SURVIVAL.space.INES`, `.volcano.LEILA`, `.warehouse.DARIO`, `.bunker.GRACE`, `.castle.MAYA`, `.monastery.ELIF`); start a new lead from the nearest one and change several features at once, or it reads as Hazel in a new outfit.
  - `build: "male"`: a flat, broad torso, shoulders at ±0.19, a thicker neck, sleeves and hands (×1.13), a wider collar.
  - `skin`, `skinSheen` (keep it close to the skin tone: a pink sheen turned olive skin peach), `earIn` (inner ear), plus the v2.1 `lip`, `brow`.
  - `iris: [[r,g,b] top, [r,g,b] bottom]` (a flat list of six numbers also works).
  - `stubble: 0..1`: a cool vertex-colour beard shadow, kept off the lips; for close-ups add a dot layer as `dressDario` does.
  - `hairStyle: "pony" | "short" | "bob"`, `part: -1` (mirror the parting), `fringe: false`. Short and bob caps are a grid whose bottom row is the hairline, so the edge never stair-steps.
  - `face: {…}`, defaults = Hazel; an unknown key logs a console warning:
    - head: `w` 0.92 width, `len` 1.12 height, `jaw` 0.22 taper, `jawW` 0 jaw width, `chin` 0.1 forward, `cheek` 0.004 fullness, `cheekX` 0.052 cheekbone position, `blush` 1.
    - eyes: `eyeX` 0.033, `eyeY` 0.012, `eyeZ` 0.0765 or `"fit"` (the centres sit on the sculpted surface; use it when `w`, `len` or the eye position change), `eyeS` 1 size, `lid` / `lowLid` lid offsets (deg), `tilt` outer-corner lift (deg).
    - nose: `nose` size, `noseW` width (tip and nostrils), `noseL` length (a longer bridge, a lower tip), `noseZ` projection, `noseTip` tip size, `noseY` tip height (m), `nostrils` spread, `bridge` thickness, `bridgeW` width.
    - brows: `browY` height, `browArch` arch ×, `browLift` raises the middle (m), `browIn` moves the inner end toward the nose (m), `browInY` raises it (m), `browLen` length ×, `browT` thickness ×.
    - lips: `lipW` width (and the mouth interior), `lipT` fullness, `lipY` height (m), `lipLo` lower-lip centre (m).
  - The handle also returns `FC` (the resolved face), `MB`, `TOR` (the torso rings, for garments built on the body), `binoc`, `mic`, `flash`, `mats.skinV` (the head skin, for a freckle or stubble map) and `mats.lipM`.
  - `assets/kit/survival-kit.v2.1.js` is the previous kit. The three batch-7 patches were merged under these names, and the six module presets were converted (the castle and monastery leads use `eyeZ: "fit"`).
- `hz.set({ pos, ry, pose, pose2, k, head: [yaw, pitch], look: [x, y], expr, expr2, ek, armR, lean, twist, blink, tool, flashI, beamK, visible, t })`.
- **Expressions (`expr`):**
  - `calm`: soft smile, relaxed lids.
  - `neutral`.
  - `worried`: inner brows up, wider lids, parted mouth with the corners down.
  - `determined`: brows down and in, narrowed lids, pressed mouth.
  - Blend two with `expr2` + `ek`. The sample shows worried on the turn, the "?", the valley and the doubt beat; determined on "decided to stay" and the ladder; calm while she writes the plan.
- **Poses:** `stand`, `binoc`, `radio`, `rail`, `think`, `sit`, `flash` (with spot light and beam), `winch`, `crouch`. Breathing, blinks and the ponytail sway come automatically from `t`.
- **Framing rules:**
  - Every shot where she speaks to the story shows her face: front, 3/4 or profile.
  - A back view only where the silhouette clearly reads (binoculars against the moonlit window).
  - The 11:58 desk shot is a 3/4 front from the north-west corner, with the desk lamp (1.25) key-lighting her face from the front left and the logbook, pencil, mug and binoculars in frame.
  - Never light her face from behind with the lamp. `assets/tools/hazel_sheet_film.js` is a character-sheet shot list for iterating on her look (8 views, ~10 s per snapshot): use it as `assets/lib/film.js` in a copy of the template, with `window.FILM_VO = {dur: 8, fps: 30, T: {}, lines: {}}` and the HUD host and audio removed from `index.html`.
- **Set dressing that reads:**
  - an Osborne firefinder on a pedestal in the middle of the cab (map disc, brass ring, alidade bar, front sight with a hair wire, rear peep sight);
  - two pinned topo maps;
  - the logbook with a pencil, a mug, binoculars, the radio with a lit LCD;
  - a fire-danger dial;
  - the supply locker with printed shelf labels (CHILI · 60 CANS, RICE · 20 LB, WATER · 8 JUGS, FIRST AID), rice sacks, water jugs, cans and a first-aid box with a white cross.

## 6. Shot grammar and transitions
- 20–24 shots for ~100 s: **establishing hero** (tower, moon, ranges) → **drone orbit** (green wash) → **black aerial with
  red eyes** → interior medium → **pull-back reveal** of the height → POV/OTS at the window (moon) → red-wash medium →
  device close-up (dim, then lit) → device close-up 2 with typed panel → **POV down** to the vehicle → front medium with
  "?" → **telephoto** of the danger (burning town, convoy) → reaction → decision → **crane up** the advantage → inventory
  dolly → **roof insert** → wide with the card → night action at the base (flashlight, ladder) → **tilt up** the tower to the lit cab (the hatch is told by sound) →
  desk medium (checklist, lamp flicker) → black aerial (eyes gathered) → end cards.
- Every shot **moves** (push, pull, orbit, crane, dolly, zoom); something changes at least every 2–3 s (cut, tag, chip,
  typed line, clock roll, light change, wash).
- Transitions: hard cuts; **dips through black** (0.28 s) into both black beats; washes ramp over 0.3 s (1.8 s for the
  red wash in the valley). Light changes happen on cuts or as slow ramps. The player also supports a cross-dissolve per
  shot (`xf: seconds`; the outgoing shot keeps moving under a fading overlay canvas). The sample uses none (see §2).
- The source has 3 hard cuts in 110 s; we cut on beats (~1 cut per sentence) — scene-change rate is measured by palette
  shifts, so keep exteriors and interiors in the same night palette and let the washes and black beats carry the changes.

## 7. Motion grammar
- Camera eases (in-out cubic for reveals, linear for aerial descents). Push-ins 5–12 %, pull-back 30 m, crane 35 m.
- Overlay motion: tags pop (scale 0.72 → 1, back.out 2.2, 0.24 s) and fade out 0.2 s before the next beat; chips pop one by
  one on their words; panel lines type with `steps(n)` clip-path (45 ms/char); clock digits roll up (22 px, 0.28 s); the
  "?" bounces 4×; the card drops with a −6° → −1.5° settle and bars fill 0.6 s; checklist ticks draw (stroke-dashoffset).
- World motion: forest sway (amplitude 1.2 % of tree height), fog drift, smoke rise, convoy at 7 m/s, eyes blinking,
  lamp flicker on the doubt beat, ladder slide (4.2 m over the line), hatch close (0.7 s), bolt (0.25 s).

## 8. Caption system
- One phrase at a time (2–6 words; the script's `caps` list splits each line), Oswald 700 78 px / 1.06, centred, max 2
  lines, `-webkit-text-stroke: 7px rgba(4,6,14,.9)` with `paint-order: stroke fill` + a soft shadow.
- Colour = meaning: **red** `#ff5a45` danger/threat, **green** `#46d483` safety/advantage/"check", **amber** `#f7b733`
  names, ages, times, numbers, distances; white otherwise. The whole phrase takes the colour (as in the source).
- On = first word − 0.06 s (0.12 s rise), off = next phrase − 0.04 s or line end + 0.7 s.

## 9. Sound
- Source: dry voice only, silent end cards. **Ours** (deliberate, for retention): a synthesized bed at **−20 dB under the
  voice** — wind through pines (muffled −7 dB inside), a tension drone (A1/E2 with beating) whose level follows the beat
  map (0.3 calm → 0.85 valley → 1.0 cliffhanger) plus an uneasy minor-second partial when tension > 0.6, crickets in calm
  exteriors — and story SFX: booms on both black beats (riser into the second), whooshes on scene changes, heartbeat under
  the turn, radio static + squelch + filtered chatter, typing ticks, UI pops by tag colour, clock ticks, pen ticks, distant
  sirens + engine rumble, winch ratchet + clank, hatch thud + bolt scrape, lamp buzz, end-card hits, then a fade to silence.
- `tools/sound_design.py` (all synthesized; levels in `score/levels.json`); two-pass loudnorm −14 LUFS, TP −1.5.

## 10. Retention devices (measure them)
- Hook ≤ 1 s with the subject on frame 1; open loop by 10 %; a reveal every ≤ 5 s; payoff (checklist) at 80–86 %; turn at
  ~90 %; a two-card ending that forces a comment and a follow; a rewatch reward (the planted answer).
- No dead air > 0.8 s except planned beats (the three longest gaps, 0.86–0.91 s, carry a boom tail, a heartbeat and a
  riser). Write the device list into the project's `SCRIPT.md`.

## 11. Do / don't
- **Do**: keep the beat map; name, age and job in the first 15 %; numbers in amber; one advantage stated as a rule; a
  physical lockdown action; tick the checklist on the words; plant the answer three times; end on the two cards.
- **Do**: light every exterior for readability (moon ≥ 2.2, albedo of trees/ground ≥ `#2f5c3d`/`#26382a`, yard/practical
  lights); test POV shots at exposure × 3 first — darkness hides composition errors.
- **Don't**: say the answer; show gore or real places/brands; light the face from behind or hide it in a beat that needs
  her reaction; let a tree, prop or wall
  sit within 0.5 m of a camera (render 1 had a tree trunk and a radio face filling frames); put captions below 80 %.

## 12. Code recipe
```bash
cp -r ~/.claude/skills/explainer-survival-scenario/assets/template my-reel && cd my-reel      # runnable 23 s demo
# the template ships without its generated files (vo/data/vo.json, film-vo.js, hud.html, score/timing.json, final.m4a):
# run the voice step, build.py and sound_design.py below first, then check / snapshot / render
# 1) vo/script.json: lines with "shot", "caps" [[phrase, r|g|y|w]], "hud", "tags", "chips"; end-card text in "end"
"$HOME/.generative-music-video/venv/Scripts/python.exe" -I "engine/audio/tts.py" vo
python -I tools/build.py                 # film-vo.js (shot clock), hud.html, out/<key>.srt, index.html, score/timing.json
# 2) assets/lib/film.js: one entry per shot {t0: T.key, cam:[a,b], look:[a,b], fov, st:{…}, fn(t,u,e,st){ hz.set(…); return {…} }}
#    (the full 23-shot Fire Tower film is not included in this release; assets/tools/build.py was its builder)
"$HOME/.generative-music-video/venv/Scripts/python.exe" -I tools/sound_design.py
export PATH="engine/node_modules/ffmpeg-static:ffmpeg-bin/node_modules/ffprobe-static/bin/win32/x64:$PATH"
npx -y hyperframes@0.8.210 check --json && npx -y hyperframes@0.8.210 snapshot --at <one time per shot>   # ~10 s for 9 frames
bash "tools/render_locked.sh" "$PWD" "out/<key>.mp4" delivery            # shared lock, run in background
python -I "engine/qa/analyze_video.py" out/<key>.mp4 out/qa             # SRT beside the mp4
python -I tools/qa.py [out/<key>.mp4] [--ref <reference.mp4>] [--ref-metrics <metrics.json>]   # YAVG dips, 2 fps sweeps, gates.json; compare.jpg only with --ref
```
- Kit API: `SURVIVAL.create({canvas,width,height,look,forest,cars,eyes})` → `K.world()` (terrain, forest, fog, town, road,
  cars, eyes; `meshH(x,z)` = the mesh's real height) · `K.tower()` (→ `Tw.low`, `trap`, `bolt`, `crank`, `doorL/R`, `disp`,
  `tx`, `lampL`, `lanL`, `yardL`, `TOP` 30, `C` 2.15, `LX/LZ` ladder) · `K.hazel()` · `K.render(st)` with
  `{t, cam, look, fov, roll, focus, aperture, exposure, sat, vig, bloom, black, tint, rays, rayAt, raySky, rayCol, rayLen,
  moonI, hemiI, envI, lampI, lanI, yardI, fill:{p,c,i}, fogD, fogK, carsK, glowK, townK, eyesK, eyesScale, eyesGather,
  starK, wind}`. Everything is a pure function of `st` → seek-safe.
- Performance (Intel iGPU, 2 workers): render 1,037 s for 2,949 frames (≈ 2.8 fps; 581 s before Hazel v2's physical materials) at `delivery` with 2 workers; the master is ~575 MB because of the grain, so re-encode it through the lock (`with_render_lock.sh ffmpeg … -c:v libx264 -preset slow -crf 19 -maxrate 14M -bufsize 28M`); `snapshot` costs ~1 s per frame (iterate there, render twice at most).

## 13. QA gates
- `analyze_video.py` (duration, WPM via the SRT, scene changes, motion, brightness, loudness) against the table in §2.
- **2 fps sweep sheets of the real mp4** (`out/qa/sweep_*.jpg`) — look at every tile: captions in the safe area, no face
  close-ups, no prop filling the frame, every shot readable at phone brightness.
- **YAVG dip check** (`out/qa/yavg.json`): flags `v < 0.6·min(nbrs)` or `v < prev − 50`; only the planned dips through
  black (into B, Q and the last card) may flag.
- `out/qa/compare.jpg` (only when `qa.py --ref` is given): 14 matched beats reference | ours (hook, thesis payoff, open loop,
  meet, chips, turn, panel, "?", danger, advantage, card, checklist, cliffhanger, DAY 2).
- Whisper `small` on the final mix: every line, names and numbers.
- Loudness −14 ±1 LUFS, TP ≤ −1 dBTP, voice ≥ 10 dB over bed+SFX (`score/levels.json`).
- Gotchas met on the sample: 
  - **Debug dark shots at exposure × 3 first.** The truck POV, the black beat and the end aerial all looked "empty". In each case the content was there but too dark, or blocked by a tree skirt or a prop. Once the composition is confirmed, raise the light.
  - **Keep trees clear.** The tree skirt radius is about 0.2 × height. Keep a 24 m clearing round the tower and 8 m on each side of any road, or the canopy covers the props.
  - **Keep cameras off props.** A camera 0.4 m from the radio saw only its front panel; frame small props from at least 1.1 m with a wide fov. `rbox` bevels add `min(r/2, d/4)` to each face, so decals must sit beyond `d/2 + bevel`.
  - **The catwalk deck is solid under the cab.** The hatch can't be seen from below; tell the trapdoor with sound and a tilt up to the cab.
  - **Red eyes under the canopy are invisible from the air.** Keep them in open ground (clearing edge, road) and gather them toward the base with `eyesGather`.
  - **Check every overlay wrapper.** End card 1 never appeared in render 1: its children were tweened but the `.in` wrapper stayed at opacity 0. Read the end of the sweep.
  - **Shell heredocs with Python triple quotes fail here.** Write patch scripts with the Write tool.

## 14. Other worlds and re-dresses (kit v2.1)
The kit change is additive: every default is the v2 value, and the Fire Tower template renders pixel-identical.
- **A film brings its own world** with `window.FILM_BUILD(K) → X` in `film.js`. `compositions/world.html` calls it when present; otherwise it builds `K.world()`, `K.tower()` and `K.hazel()` as before. Load the module after `survival-kit.js` in `index.html` (the films' `build.py` writes the tag).
- **`create()` options:**
  - `moonDir`, `moonCol`, `bg`, `fogCol`, `hemi`;
  - `shadow: {half, far, dist, center}`;
  - `sky: {zen, hor}`, `env: {zen, hor, mside, gnd}`, `envScene(es)`.
- **New calls and state:**
  - `K.buildSky()` gives the dome, moon and stars without the forest world.
  - `K.onRender(fn)` is a per-frame hook for a module's own state.
  - `st.moonK` (0 hides the disc), `st.glowDir/glowCol`, `st.shadowAt`.
  - `hz.set({ br, tool2 })`: a slow deep breath, and a left-hand tool.
- **Re-dress the rig.** `K.hazel({ jacket, jacketSheen, jacketRough, trim, trimSheen, seam, pants, pantsSheen, boot, sole, under, hair, hairStreaks, hairSheen, brow, tie, lip, pony:{y,z}|false, chestPocket, handPockets })`.
  - It returns `spine, head, neck, hips, legs, face, pony, surf(y, angle), frontZ, fz, mats` and `tool(name, obj, hand)`, so props sit on the real surfaces.
  - Add poses straight into `hz.POSES`.
- **`survival-vault.js`.** `SURVIVAL.vault(K)` builds:
  - a 33 × 16-block night grid with procedural lit windows (from world position, no textures), about 3k instanced streetlights with light pools, a wet avenue and downtown towers with a fire glow, smoke, headlights and emergency flashes;
  - the bank: fluted, uplit columns, carved `BANK` and `EST. 1908`, a pediment, bronze doors and grilles;
  - the marble lobby with a moonlit skylight grid, the teller line, velvet ropes, the security desk and a 6-screen CCTV wall drawn per frame (`st.cctv`);
  - a 3.2 m round door (`st.doorA`, `boltK`, `wheelA`) with the `AIRTIGHT SEAL · CLASS 3` plate, boltwork and the time lock (`OPENS MON 08:00`, `st.dial`);
  - the vault: deposit boxes, the vent with `VENT · OFF WHEN SEALED`, and `st.supplies` that pop in;
  - her car, and eyes in the streets.
  - `SURVIVAL.vault.dressRosa(K, hz)` adds a navy guard: silver badge, chest radio (`setRadio(k)`), epaulettes, sleeve patch, pen, clipboard, notebook, carry box, and the poses `tap`, `pushbar`, `pull`, `setdial`, `floor`, `carry`, `chestradio`.
- **`survival-ice.js`.** `SURVIVAL.ice(K)` builds:
  - a plateau with sastrugi, glints and drifting ground snow;
  - **four folding aurora curtains** (`st.auroraK`). They also drive the key light: the kit's moon light, low in the north, pale green.
    - Aurora v2: the hem rises and falls along each curtain, the height varies, segments fade in and out along the length, and the hem carries a thin bright fringe with a soft glow (faintly pink) hanging below it; the tops go violet.
    - The fix it came from: a constant base height gave a straight-edged flat band in every low wide shot. A ragged, high-frequency hem over dark sky reads as a mountain skyline, so keep the hem smooth and glowing.
  - two modules on stilts with lit windows and floodlights;
  - an 18 m guyed mast with a beacon and a dial thermometer (`st.thermo`, `st.frost`); an empty flag pole, a snowcat, the balloon shed and balloon (`st.balloon`);
  - a 2.2 km skiway whose lights go out one by one (`st.runway`), and a far plane that is only lights (`st.planeK/planeT`);
  - the weather office: a north window, the satellite phone (`phoneK`), the logbook chart with its dotted summer line, the `SUN RETURNS · AUG 24` calendar and the radio;
  - the freezer (`freezerA`), the fuel bladders and the snow melter;
  - eyes on the snow (`eyesI` dims them, `eyesBlink`).
  - `SURVIVAL.ice.dressNoor(K, hz)` adds a quilted red parka, a fur ruff with the hood down, a grey beanie with amber goggles pushed up, a snowflake patch and a hand mic, plus the poses `write`, `phone`, `micsit`, `hold`, `release`, `window`.
- **Tools** (in `assets/tools/`):
  - `snap.py`: one still per shot plus a labelled sheet.
  - `sheet.py`: a pose and look sheet in a scratch world-only project, about 30 s per round.
  - `reveals.py`: the longest gap between reveals.
  - `whisper_check.py`: recall per line.
  - `qa_all.sh`: the analyzer, `qa.py` and Whisper, run in one locked job.
- **Gotchas met on these two films:**
  - **Point lights without shadows light rooms through their walls.** The street lamps lit the lobby. Set their intensity per shot (`streetI` ≈ 0.06 inside).
  - **Pure metal (metalness > 0.8) renders black under a night environment map.** Keep big hero props near 0.45.
  - **A glossy desk top mirrors a bright screen wall into the lens.** Make it matte.
  - **Body parts can block a prop.** A raised counter hid her chest radio; a centre window mullion cut through her face.
  - **The moon is fixed for the whole film.** Compose the hero shot first, then solve `moonDir` for where it should sit on screen (the bank: 24° azimuth, 28° up).
  - **Desk props seen from outside need a low sill.**
  - **Size goggles and hats to the head's radius at that height, not at its equator.**
  - **Watch the HUD band.** Tags at y 330 cover a standing face framed high; frame faces at 33–45 % of the height.
  - **A world module must call `K.buildSky()`,** or there is no sky, moon or stars.
  - **Never add `-shortest` when muxing the new mix onto a master.** ffmpeg cut the video 3.5 s early and end card 2 was lost. `tools/deliver.sh` maps the master's video and `assets/audio/final.m4a` without it. Check that the stream durations match.
  - **AAC raises the true peak by about 0.5 dB.** A −1.5 dBTP mix measured −1.0 in the mp4, so mix to −2.0.
  - **A low practical alone makes a floating mask.**
    - A floor lantern lit only Rosa's face, so her black hair and navy jacket fell into black (The Vault, P/P2).
    - The fix: the lantern kept in frame below the captions, a warm key cheated above it (a spot on head and shoulders, so the hands stay out of it), a cool rim spot from behind, and a little cool ambient. It lives in the film's `FILM_BUILD` and is driven by shot-state keys through `K.onRender`.
  - **A half-lit face needs a fill.** Aim for the shadow side at about half the lit side. Measure a luminance row across the face in a snapshot, and put a temporary ramp of fill intensity across one shot to pick the value in a single snapshot run.
- **Delivery:** `tools/deliver.sh <master>`, run under `with_render_lock.sh`, does the CRF 19 encode, muxes in the current mix and runs `qa_all.sh`. `tools/cover.py <world-only frame> "THE TITLE"` makes `out/cover.jpg`. To get a world-only frame, snapshot a copy of the project with the hud and mix tracks removed from `index.html`; `snapshot --composition` cannot be combined with `--at`.

## 15. Batch 7 worlds (kit v2.2)
Six worlds, each a module in `assets/kit/` with its lead preset and a `dress<Lead>(K, hz)` re-dress. Wire it as in §14: `window.FILM_CREATE = SURVIVAL.<world>.CREATE`; `FILM_BUILD` builds the world, then `K.hazel(SURVIVAL.<world>.<LEAD>)`, then the dress. Copy the world module from `assets/kit/` into the project's `assets/lib/`. The template's `assets/lib/survival-kit.js` is already v2.2 (since 4 Nov 2026; Hazel renders bit-identical to v2.1). The modules need v2.2; the samples' build notes are in each project's `SKILL_NOTES.md`.
- **`survival-space.js`.** `SURVIVAL.space(K)`, `.INES`, `.dressInes`, `.dirOf(az, el)`.
  - It builds Earth as one shader sphere (radius 23,400 m, 1,500 m below the station, so every angle from orbit is right): fictional continents, city lights in three layers that turn red cluster by cluster (`redK`), and an airglow and sunrise arc.
  - Also the station, in four modes (`st.set`: `orbit`, `in`, `globe`, `sea`), and the lab (cupola console, comms panel, grow box, food lockers, aft hatch). `Sp.setSun(dir)` re-aims the key light (it mutates `K.MOON_DIR`); call it in every shot.
  - Ines has floating curls (about 300 helix tubes), a teal flight suit and a headset.
  - Gotchas: a practical light 0.2 m from the floating lead blew her jacket to white, so keep practicals away from her or above her head. A backlit station reads as a silhouette, so light it from the front with the low sun. `orbitA0` sets where the ground track starts; survey it so the hook is not over open ocean.
- **`survival-volcano.js`.** `SURVIVAL.volcano(K)`, `.LEILA`, `.dressLeila(K, hz, Vo)` (it borrows the world's mug and knife). The handle returns `volH(x, z)`, `lavaY`, `chan` and the marks `P`.
  - It builds black basalt with carved channels and lava ribbons. The lava surface is a two-phase flowmap with Voronoi crust plates that move as a plug (`crustK`, `lavaI`, `flowK`).
  - Also the crater glow, plumes, ash sheets and sparks; the ridge hut (seismograph `seisK`, gas meter `gasK`, scanner `scanCh`), the helipad and the rope bridge (`bridge: {drop, burn}`); a valley camp of 720 tents; and the helicopter as lights only.
  - Leila wears a braid on a hairline-grid cap.
  - Gotchas: make the ribbons double-sided, 0.4 m over the lava, and sink the coarser terrain patches 18 m and 45 m under the finer one, or the channels vanish from the air. One strong light makes everything orange: keep the ground colour dark red, the walls grey and the lamp pale. Inside the hut keep `lavaLightK` near 0.1, and key her face with the cool `monI` spot.
- **`survival-warehouse.js`.** `SURVIVAL.warehouse(K)`, `.DARIO`, `.dressDario` (`setBud(inEar)`).
  - It builds the lot and light poles, the tilt-up facade with its banner, the glass doors and the key panel (`keyA`, `doorScr`), and a floor of pallet racks under high-bay lamps with haze cones (`lampsK`, `coneK`).
  - Also an interior key light `roofL` (`roofI`, `roofAt`), a second PMREM (`st.envIn`), the forklift, the TV wall, the dock shutters, the highway, and the 520-figure queue (`queueK`).
  - Dario has the hoodie collar lowered, a hi-vis vest built on `surf`, and a stubble dot layer.
  - Gotchas: a roof that casts shadows blacks out a top-lit interior. Turn off `castShadow` on the roof, deck and joists, and light the floor with its own directional light. Additive cones take their brightness from the local height, not `uv.y`.
- **`survival-bunker.js`.** `SURVIVAL.bunker(K)`, `.GRACE`, `.dressGrace` (`setRobe(k)`, a robe built on `hz.TOR`).
  - It builds nested terrain patches, a peak of `exp(−k·r)` lobes with radial spurs (Gaussian peaks read as domes), and a stratified 13 m cliff with the ring blast door (`doorA`, `wheelA`, `ringChase`).
  - Also the tunnel keypad (`keyScr`), and the atrium: a pool, a waterfall, a fake LED sky (`skyK`, `skyGlitch`, lit by `skyI`), the tablet (`tabScr`) and koi (`feed`). Then six rooms, the jet as lights only, and a second moon disc (`moon2*`).
  - Its lights are a fixed pool re-aimed per set from `RIGS` (`st.rig`, `rigK`, `ptsX`), so the light count never changes and no shader recompiles. `st.moonLightDir` re-aims the key light per shot.
  - Gotchas: sink each coarser terrain patch under the finer one, or a coarse cell rises over the door. Vertex colours are linear: keep the rock grey near `#86827c`, or the mountain goes black. Warm light plus a peach sheen turns deep brown skin orange; add a cool fill near her face and set exposure to 0.8–0.92.
- **`survival-stone.js`** (shared by the castle and the monastery). `SURVIVAL.stone(K)` gives:
  - materials: `stoneM`, `rockM`, `conglomM`, `plankM`, `plasterM`;
  - candles: `candle` and `candelabra`, driven by `candleK`, `gutter` and `flameOut`;
  - `mist`, `water` (a planar mirror, `st.mirror`), `trees`, `eyes`;
  - `bake(group, skip)`, which merges static meshes by material (the castle went from about 4,000 draw calls to a few hundred);
  - hair helpers: `SURVIVAL.hair.hide`, `.curls`, `.bun`.
  - Call `finish()` last, after every `K.onRender` hook, or the flames and the mirror pass are missing.
- **`survival-castle.js`.** `SURVIVAL.castle(K)`, `.MAYA`, `.dressMaya` (a curly bob, an ivory blazer, and a headset sized from `hz.FC`).
  - It builds the walls, towers and gatehouse, a drawbridge on chains (`bridgeA`), fairy lights (`fairyK`), floods (`upI`, `floodI`), and a moat with a mirror lobe.
  - Also the lawn with its firework rack (`ledK`), the great hall with a face light rig (`keyI…`, `rimI…`), the kitchen, a highway jam (`hwyK`) and eyes.
  - Gotchas: dark stone needs a moon of 5–6.5. A moat 0.9 m below the lawn is invisible from eye height, so raise the water and add a pond lobe. Reuse the mirror pass's shadow maps and let only the lights that are on cast cube and spot shadows; together these took the castle's render from 2,284 s to 1,277 s.
- **`survival-monastery.js`.** `SURVIVAL.monastery(K)`, `.ELIF`, `.dressElif` (a low bun, a cardigan, an apron).
  - It builds a 400 m conglomerate pillar (`pillarR`: lumps, bedding notches, a rounded top) with nine lesser pillars and a mist sea. On top: the gift shop, the chapel and the winch house.
  - Also the basket (`basketY`, `basketSway`, `ropeCut`), the village and the bus (`villageK`, `busT`), and lights per room (`shopI`, `chapelI`, `cellarI`, `winchI`).
  - Gotchas: a normal map needs uvs (the apron bib rendered black without them). Check the winding of hand-built cylinders: faces pointing inward read black, and a `MeshNormalMaterial` view shows it at once. A strong blue moon bleaches warm skin; her shots use moon 3.2 and a warm fill of 2.6.
- **Met in several of these films:**
  - A pose moves the head off its mark. Aim close-ups at the head's world position after `hz.set()` (each film's `headAt()`), and frame held props from their `localToWorld`.
  - Decals inside `rbox` bevels vanish; place them at `d/2 + min(r/2, d/4) + 2 mm`.
  - The 9:16 frame sees only ±11° across at fov 44, and screen right is −x when the camera looks along +z.
  - Keep a lead's skin one colour across lights: near-neutral fills at most 1 near the face, and check five face shots side by side before rendering.

Files: references/sources.md · assets/kit/ (survival-kit.js v2.2, survival-kit.v2.1.js, survival-vault.js, survival-ice.js, survival-space.js, survival-volcano.js, survival-warehouse.js, survival-bunker.js, survival-stone.js, survival-castle.js, survival-monastery.js) · assets/tools/ (build.py, sound_design.py, qa.py, snap.py,
sheet.py, reveals.py, whisper_check.py, qa_all.sh, deliver.sh, cover.py, hazel_sheet_film.js) · assets/template/ (runnable 23 s demo after the voice step) · the full "Fire Tower · Day 1" sample project (23 shots) is not included in this release

## Appendix A — source analysis (`De0HQ6Mpycw`)
Analysed locally for reference only: engine metrics, opening/timeline/strips/ending sheets, a 2 fps sweep and 19
full-resolution grabs. (This appendix stands in for `references/analysis.md`.)

**Numbers.** 110.46 s, 720×1280, 30 fps · 3 hard cuts (1.63/min, first at 10.6 s into the black beat) · 3.26 scene
changes/min (median scene 9.8 s) · motion 1.78 (p90 3.87, 42 % held frames) · brightness 0.228, colourfulness 36.6,
94.5 % dark frames · palette navy `#0d1831` 28 %, `#1a243d` 25 %, `#0b1326` 18 %, black 10 %, plum `#341c28`, rust
`#683f2d`, slate `#435463`, tan `#d2b893` · 247 words, 134 WPM (≈160 speaking) · one male narrator, median f0 96 Hz
(p10/p90 75/133) · **voice only**: gaps fall to −70 dB, end cards (105–110.5 s) silent · −14.6 LUFS.

| t (s) | beat | picture / overlay |
|---|---|---|
| 0.1–10.5 | thesis hook | lighthouse centred, moon upper right, beam sweeping, sea; green wash 7.0–9.6 s on the safe-place words; captions red → white → green |
| 10.6–14.0 | open loop | hard cut to black: a tiny lighthouse, four white corner dots, dozens of red eye pairs, radial vignette; red caption |
| 14.0–28 | meet + routine | interior (yellow raincoat, window + moon, desk, lamp, mug, radio); HUD on (● DAY 1 / 11:39 PM / NIGHT); name tag (NAME · AGE / JOB); a distance tag; three ✓ routine chips |
| 28–31 | turn | red wash, the turn caption |
| 31–43 | the message | dim + clock to 11:40; radio close-up with antenna signal rings, rust-brown wash; red-bordered radio panel (sender · channel) types 3 lines (first red) |
| 43–49 | first instinct | pier, red boat, city lights; a distance tag; "?" over her head |
| 49–58 | reasoning | the city pier packed with a crowd; a red danger tag; red wash |
| 58–70 | decision + advantage | top-down map: sunburst island, coast + crowd dots; the advantage rule as a green tag, a dashed distance line, an "= WALL" tag |
| 70–85 | inventory | storeroom shelves fill item by item with tags; cream supplies card (title, 3 bars with durations, a one-line footnote) |
| 85–92 | lockdown | iron door (a label tag), pier ladder lifts (a green cut-off tag); 12:10 AM |
| 92–101 | plan = payoff | navy panel, amber border, the plan title, 3 checkbox rows ticked on the spoken word; 12:25 AM; dims on the doubt line |
| 102–105 | cliffhanger | the black beat again, beam sweeps once; the red cliffhanger caption |
| 105–107.5 | end card 1 | a two-line question, white line + red last word (Oswald), white comment-prompt pill with » over the dark lighthouse |
| 107.5–110.5 | end card 2 | black + red radial glow: the place name letter-spaced, a big red day number, a red follow pill |

**Overlay measurements (720 px source; ×1.5 for 1080).** HUD at x 28: "● DAY 1" Inter bold 16 px `#ef5a4a` (y 42), time
Oswald ~44 px white (y 77), "NIGHT" Inter 13 px grey (y 106); hidden on black beats and end cards; ticks 11:39 → 11:40 →
11:42 → 11:45 → 11:58 → 12:10 AM → 12:25 AM. Tags: navy box, 2 px border coloured by meaning, radius ~10, Oswald 600 title
+ Inter subtitle, centred at y ≈ 13 % or above the subject; pop with overshoot. Captions: Oswald bold ~50 px with a dark
outline, centred at y 990 (77 %), one 2–6-word phrase at a time, the whole phrase coloured by meaning. Washes: green
(the safe-place hook), black (both loops), red (turn, crowd), rust (radio). Character: flat, nearly static; sets change around her;
camera static except slow zooms; life comes from pop-ins, typing, the clock, the beam passing the window.

**What we keep / change.** Kept: the beat map and percentages, HUD/tags/chips/panel/card/checklist, one-phrase coloured
captions, washes, black beats with red eyes, both end cards, one narrator ~134 WPM. Changed (brief): lit 3D diorama,
always-moving camera, more shots, a synthesized bed + SFX, captions centred at 74 % (clear of the bottom 20 %).


# Gold-studio — dark-studio 3D money comparison reel (two places, one resource, two outcomes)

Frame-by-frame analysis of one Instagram reel, made for the `explainer-gold-studio` skill. Analysed locally for
mechanics only: no footage, audio, flags-as-assets or channel identity is reused; the sample's facts and script are new.

## 1. Identity
A 60-second vertical reel that compares what two places did with the same natural-resource money. Everything happens
in one **black photographic studio**: a reflective black floor with soft, blurred reflections, no visible walls, and a
**warm gold spotlight glow** that hangs behind the subject like light on a backdrop. The two places are **glossy
flag-textured spheres sitting on matte black oil drums** with embossed silver names. Money is always physical and
gold: coin stacks grow under a sphere, coins pour into a steel safe, 3D gold numbers count up, people are glossy black
pawns that turn gold. Each beat is one object on the black stage under one coloured glow (gold for the winner, green
for growth, red for the loser and the twist). A calm male narrator reads short lines at ~151 wpm; small white
captions sit high in the frame. Two serif-italic title cards (one in gold that announces the explanation, one in red
that announces the worst part) cut the reel into hook / mechanism / twist. The ending returns to the opening two-sphere image, now
resolved (one tall gold stack, one small).

## 2. Source analysed
| id | account | length | likes | followers | audio | topic |
|---|---|---|---|---|---|---|
| DeX3-QSyCBI | @moneydecoded.au | 61.6 s | 65,178 | 11K | original | Norway's gas fund vs Australia's gas tax |

Measured (engine analyzer, the same as for the samples; analysed locally for reference only):

| metric | value | note |
|---|---|---|
| duration | 61.62 s | 720×1280, 30 fps |
| hard cuts (analyzer) | 2 (1.95 / min) | first at 22.13 s; dark cuts score low, see §3 for the 7 real cuts |
| scene changes / min · median | 2.92 · 16.97 s | colour-histogram changes 1 s apart: the reel changes *look* rarely |
| motion mean · p90 | 5.77 · 13.73 | slow camera drifts, short fast moves |
| hold fraction | 0.057 | almost never static |
| colourfulness · saturation · brightness | 27.5 · 0.355 · 0.133 | very dark, low colour except accents |
| dark-frame fraction | 1.00 | every sampled frame is "dark" |
| palette (share) | #050303 31 %, #0e0b09 16 %, #1d160e 15 %, #010101 14 %, #2f2d1e 11 %, #5d4229 7 %, #9a7158 3 %, #e1d6be 3 % | near-black + warm browns |
| loudness | −14.1 LUFS | |
| words · WPM | 155 · 150.9 | Whisper small; ~194 wpm while speaking |
| motion by decile | 4.9 4.3 7.4 10.8 1.7 7.0 9.4 4.8 3.7 3.7 | peaks: coin pour (3rd–4th), chart/map (6th–7th) |

## 3. Shot list (1-fps sheets + 2 fps + 30 fps strips around every change)
Times in seconds. "Cut" = hard cut; everything else is a camera move inside one continuous studio.

| # | time | shot | camera | event detail |
|---|---|---|---|---|
| 1 | 0.00–4.63 | two-up: Norway sphere on NORWAY drum (left), Australia on AUSTRALIA (right) | slow push-in ~15 % over 4.6 s, camera slightly above drum tops (tops read as ellipses) | spheres **drop in from above the frame** with motion blur (left 0.00→0.20, right 0.50→0.75); gold glow fades in behind on "rich" (2.3–3.0) and the drums pick up a warm rim |
| 2 | 4.63–10.10 | wide two-up | **pull-back + crane up in 8 frames** with motion blur, then slow drift | coin stack grows under Norway's sphere (5.0–6.0); gold "$2" (extruded, 5.2), "TRILLION" (5.5), "FUND" (6.25) glitch in to the right of the stack; label glitches out at 9.0; coins hop off Australia's drum and fly out right (on the hook's third line, 9.0–10.0) |
| 3 | 10.10–11.63 (cut) | title card on black | slow push-in (~6 %) | "Let" 10.17, "us" 10.45 white sans; "explain." gold serif italic 10.6 with an over-exposed flash, then a gold radial glow behind it |
| 4 | 11.63–15.80 (cut) | Norway sphere on top of the tall stack | **crane down + pull back** 11.7→13.5 revealing stack and NORWAY drum; light sweep runs down the coins | glossy black pawns rise out of the floor (13.9–14.6) in a row of 5 + a row behind, then turn gold from the centre out (15.0–15.8) as the stack goes emissive |
| 5 | 15.80–16.00 | whip pan (6 frames, heavy accumulation blur) | | the stack smears left, a chrome ring swings in from the right |
| 6 | 16.0–19.0 | ring gauge | locked, tiny drift | chrome ring (diameter ~0.46 H, centre 0.52 H); white drum glyph inside (16.7–17.3), replaced by a count-up "x%" + "TAX" while a **yellow arc fills clockwise from 12 o'clock** (17.4–18.2) to 78 % |
| 7 | 19.0–21.5 | whip pan right to an open steel safe | 3/4 view from front-left | a **river of gold coins** pours from top-left into the open safe (19.3–21.0); door swings shut in 6 frames (21.2–21.4) |
| 8 | 21.5–22.13 | safe front, centred | slight push | dial spins with motion blur and stops |
| 9 | 22.13–35.5 (cut) | line chart on black, **green radial glow top-left**, dashed grid | starts close on the first point, **pulls back while the line draws** (22.5–25.0), then tilts down so the chart sits in the upper half | flag-sphere marker rides the tip with a white value label counting $0.0T → $2.4T; "1998" / "2026" small grey; at 26.0 a gold "$4B" → "$60B" count-up + "A YEAR" below, small coins drop from the line into it; three metallic icon tiles pop in (cross 29.0, house 29.5, road 30.0); at 33.4 number and tiles collapse, Australia's marker runs a **red line** flat along the baseline, red glow bottom-right |
| 10 | 35.5–40.03 (cut) | dotted world map lying on the floor | **zoom-out** from a tilted close-up (35.6–36.4), slow push, tilt up 37.5–38.0 | Australia in gold dots, land elsewhere grey-white dots; white bold "AUSTRALIA"; white ships on dotted routes to CHINA / KOREA / JAPAN (small labels); "$12B" → "$50B" gold count-up (36.4–37.3) + "OF GAS A YEAR" |
| 11 | 40.03–40.3 | directional smear (whip down, 8 frames) to black | | |
| 12 | 40.3–46.17 | gold "$1" coin under a gold glow | locked | the coin spins in (40.3–41.0); a crowd of glossy black pawns rises into the lower third (41.0–41.6); the coin becomes a 10×10 grid of small coin-rings (44.0), 3 turn gold and drop to the people (44.4–45.0); the grid slides out right; "3¢" gold + "IN EVERY $1" white |
| 13 | 46.17–48.0 (cut) | red title card | slow push | the lead-in word by word; the key word in red serif italic with a red radial glow; the last word white |
| 14 | 48.0–54.93 (cut) | white LNG plant on the black floor | slow push / drift | domed white tanks rise from the floor with motion blur (48.4–49.0), then process towers and a flare stack with a glowing tip; red glow + red "$0" + white "TAX PAID" (50.6–51.1); a gold coin drops in from the left and settles (53.6–54.2); red glow fades to gold |
| 15 | 54.93–61.62 (cut) | the opening two-up again | as shot 1, then pull back 57.6–58.4 | spheres drop in again; white emissive "=" between the drums (56.3); Norway's stack rises tall with the gold glow (58.6–59.1); a small LNG plant and a ship carrying coins sail away right (60.4–61.3); end on the resolved image |

Real hard cuts: 10.10, 11.63, 22.13, 35.50, 46.17, 48.00, 54.93 (7 → 6.8 / min). The analyzer counts only two
because cuts between near-black frames score low; scene changes (look changes) 2.9 / min.
Shot lengths: 4.6, 5.5, 1.5, 4.2, 3.0, 3.1, 13.4, 4.5, 5.9, 1.8, 6.9, 6.7 s — long shots with moves inside them.

## 4. Script and beat map
The transcript is not reproduced (155 words; the burned-in captions were the ground truth). The beats:

| % runtime | beat | lines | words | visual |
|---|---|---|---|---|
| 0–16 | **Hook**: both places got rich from the same resource; A's result as a fund size; B's opposite result | 3 | 23 | two spheres → stack + gold label |
| 16–19 | **Title card**: the gold explain card (two words + a serif key word) | 1 | 3 | black + gold serif |
| 19–36 | **A's mechanism**: a principle, a rate (%), where the money goes | 3 | 26 | stack + people → ring gauge → safe |
| 36–54 | **A's result**: growth + what it pays for each year | 3 | 29 | green chart, count-up, 3 icon tiles |
| 54–57 | **Turn**: one line saying B did the opposite | 1 | 5 | red line |
| 57–65 | **B's scale** (how much B earns) | 1 | 13 | dotted map + count-up |
| 65–75 | **B's share** as "x cents in every dollar" | 2 | 18 | $1 coin → 100-coin grid |
| 75–78 | **Title card**: the red worst-part card (a lead-in + a serif key word) | 1 | 5 | black + red serif |
| 78–89 | **Twist**: the specific fact, ending on a year (nothing paid until that year) | 2 | 15 | plant + red $0 → gold coin |
| 89–100 | **Ending**: four short lines: the two places, the shared resource, what A did, what B did | 4 | 13 | spheres again, "=", stacks |

Rules: lines of 4–14 words; every number is a round, spoken figure; one rhetorical question; no CTA in the video
(the CTA and a "Figures:" sources line live in the post caption). The ending repeats the hook's image and resolves
it in four short lines.

## 5. Visual system
**Palette** (sampled from full-res frames):
| role | hex |
|---|---|
| studio black / floor | #020202 – #0c0c0c (floor #0b0b0b near camera, #121114 drum body) |
| gold glow core (behind subject) | #a47732, falling off to #715025 → #23140c → black |
| gold metal (coins, numbers) | median #997031, highlights #bf9759 – #fdefa3 |
| title gold (key word) | #b18d4e, lit #f4d98c |
| gauge yellow | #f4d95f |
| chart line mint | #7cf5cb; chart glow green #20623f |
| red line / glow | line #e9534c, glow #601313 → #270504 |
| red title "worst" | #d83d40 – #f74147, glow #751816 |
| caption white | #e8dedb – #ece4dc (warm white), peak #ffffff |
| flag spheres | Norway red #ee2c4c, navy #373069 (as rendered) |

**Typography** (fractions of frame height H):
| element | look | size / position |
|---|---|---|
| captions | grotesk Medium (Inter 500–560 is the match: double-storey a, straight-tailed y), warm white, soft dark halo | cap height 0.0164 H (≈ 44 px font at 1920), cap top 0.139 H, baseline 0.155 H, centred; width 0.2–0.53 W |
| big gold numbers ("$2", "$60B", "$50B", "3¢") | heavy geometric sans (Montserrat ExtraBold-like), gold metal with a short dark extrusion | cap 0.035–0.07 H |
| sub-labels ("TRILLION", "FUND", "TAX", "A YEAR", "OF GAS A YEAR", "TAX PAID") | same family, white, all caps | cap 0.012–0.022 H, 0.4–0.7 H below the number |
| ring number ("78%") | white heavy sans with glow | cap 0.045 H |
| title cards | gold card: a two-word lead-in in white grotesk SemiBold (cap ~0.028 H, at 0.37 H) + the key word in gold old-style serif italic (Garamond-like, word width ~0.62 W, at ~0.53 H); red card: a three-word lead-in (cap 0.024 H at 0.39 H) + the key word in red serif italic + the last word white | |
| chart values / years | white bold 0.012 H / grey 0.007 H | |

**Layout**: subject column x 0.2–0.8 W; captions at the top (0.13–0.16 H) — the reel keeps the bottom 20 % for
reflections only (Instagram's caption area), nothing important on the right 12 %. Numbers sit upper-right of the
subject (0.25–0.40 H) or centred under a chart (0.6 H).

**Light and lens**: one key soft box above-front-left (round specular dot on every sphere), thin rim strips, a coloured
radial glow behind the subject (gold / green / red), a warm light that tints the drums when the glow comes up. Long
lens feel (~35–50 mm equivalent), shallow depth of field (background and far reflections soft), bloom on gold and on
emissive text, a mild vignette. Floor reflections are strong but blurred and fade with distance.

## 6. Objects
- **Flag spheres**: glossy (clear-coat) balls, flag wrapped once around, design centred on the front; sit on drums.
- **Oil drums**: matte black, three thin chrome ribs, embossed silver all-caps name centred on the front.
- **Coin stacks**: 40–50 coins with bevelled rims (horizontal ridges read clearly), grow from the drum top, pushing the
  sphere up; coins drop on with motion blur.
- **Pawn people**: abstract chess-pawn figures (round body, round head), glossy black → polished gold.
- **Ring gauge**: thin chrome outer ring + thick inner band (yellow fill / grey remainder) + number inside.
- **Safe**: brushed-steel cube, door hinged left, 8–10 chrome bolts in a circle and a spoked dial.
- **Chart**: dashed horizontal grid, mint line with a soft green area fill, flag-sphere marker at the tip.
- **Map**: hex grid of small round dots on the floor; highlighted country in gold dots, the rest grey-white; dotted
  white routes; small white ships.
- **Icon tiles**: dark metallic rounded cubes with a white glyph (cross, house, road).
- **Plant**: white glossy domed tanks, slim towers, a flare stack with a glowing tip.

## 7. Transitions and camera moves (frame counts at 30 fps)
| name | frames | how it looks | where |
|---|---|---|---|
| drop-in | 6–8 | object falls from above frame with accumulation motion blur, tiny bounce | spheres (0.0, 0.5, 54.9) |
| crane pull-back | 8 | fast dolly back + up with blur, then a slow drift continues | 4.63, 57.6 |
| glitch-in label | 4–6 | text appears as a squashed, horizontally smeared, over-bright bar that opens vertically and settles | every number/word label and title word |
| hard cut to black title | 0 | cut, words build on black | 10.10, 46.17 |
| crane down reveal | 50 | close on the top of a stack, crane down and back to the whole object | 11.7–13.5 |
| whip pan | 6–8 | horizontal pan with heavy ghosted blur; next object enters from the side | 15.8, 19.0 |
| rotate-in | 9 | ring swings in from the right, rotating from edge-on to face-on | 16.0 |
| door slam | 6 | safe door closes with blur | 21.2 |
| pull back while drawing | 75 | chart: camera retreats as the line grows | 22.5–25.0 |
| zoom-out reveal | 22 | map: from a tilted close-up out to the region | 35.6–36.4 |
| directional smear | 8 | the whole frame streaks down and fades to black | 40.03 |
| spin-in | 20 | coin spins about its vertical axis and settles face-on | 40.3 |
| rise from floor | 10–20 | objects (pawns, tanks) rise out of the floor, staggered | 13.9, 41.0, 48.4 |
| colour-glow swap | 15–20 | red glow fades to gold behind the same set | 53.8 |

## 8. Motion grammar
- Ease-outs with a little overshoot for arrivals (drops, pops, tiles), smooth in-outs for camera moves.
- The camera never fully stops: 1–5 % drift or push during every hold.
- Count-ups run 0.8–1.5 s with an ease-out and land as the narrator says the number.
- Staggers: pawns rise centre-out (~0.07 s apart), gild centre-out (~0.18 s apart); icon tiles 0.5 s apart on the
  words they illustrate.
- Fast moves carry real motion blur (accumulation ghosts), slow moves none.

## 9. Caption system
- 2–5 words per caption (mean ~3), broken at commas and phrase edges (sample: "In nineteen seventy-six, | Alaskans
  voted to | save part of | their oil money.") — numbers **spelled out** as spoken ("twenty-five percent",
  "eighty-eight-billion-dollar fund.").
- In at the first word (−1 frame), 3-frame opacity fade; out in 2 frames when the next caption comes. A caption stays
  through the pause until the next one; none during the title cards (their words replace it). No highlight colour, no
  box, no pop.

## 10. Sound
- One calm male narrator (pitch median 89 Hz, p10 60, p90 128), ~194 wpm while speaking, 150.9 overall; pauses of
  0.4–1.1 s between lines (longest before each title card and after the hook's second line).
- Music: a dark, sustained cinematic bed — low pads and sub-bass that move every ~3.5 s, no drums on top; it drops
  under the two title cards. Bed ~10 dB under the voice (speech −16.7 dB vs pauses −27.2 dB RMS).
- SFX: soft whooshes on whips and pull-backs, low impacts on the title cuts, coin clinks on stacks and the pour, ticks
  under count-ups. Mix −14.1 LUFS.

## 11. Formation rules (to make another reel like it)
1. Pick **two places, one resource, two outcomes** with official numbers; the twist is a single fact with a year.
2. Write ~150 words in the beat map of §4; spell numbers in the captions; one rhetorical question; end by repeating
   the hook image in four short lines.
3. One black studio, one subject per beat, one coloured glow per beat (gold = saved / good, green = growth, red =
   loss / twist). Never more than one accent colour at a time besides gold.
4. Every quantity is a physical object: stacks for totals, a ring for a rate, a safe for "saved", a chart for growth,
   a dotted map for scale, a coin grid for "x cents in every dollar", a plant/factory for the industry.
5. Two serif-italic title cards (gold, then red) split hook / mechanism / twist.
6. Cuts only into title cards, into a new "board" (chart, map) and back to the ending; everything else is a camera
   move in the same studio — so scene changes stay ~3 / min and shots run 4–13 s.
7. Small white captions at the top; numbers as gold 3D type with a white all-caps sub-label.
8. Real motion blur on drops and whips; DOF and bloom always on; blurred floor reflections everywhere.

## 12. Do / Don't
- Do keep frames dark (mean brightness ~0.13) — glows are local, never fill the frame.
- Do let numbers land on the spoken word; let labels glitch out before the next beat.
- Don't add on-screen sources, logos, lower thirds or a CTA in the video; the sources go in the post caption.
- Don't light the floor; it should read black with reflections only.

## 13. Replication in code (what the skill does)
three.js r170 inside HyperFrames: MeshPhysicalMaterial everywhere, a generated PMREM studio environment, a planar
floor reflection (world mirrored, clipped at the floor, blurred), HDR target with MSAA, bloom from a mip chain,
depth of field mixed by a circle of confusion from the depth buffer, ACES tone mapping, sub-frame accumulation for
motion blur on fast moves, label planes with a glitch-reveal shader, flags drawn on canvas, Natural Earth dots for
the map. Captions are an HTML overlay. See `skills/explainer-gold-studio/`.

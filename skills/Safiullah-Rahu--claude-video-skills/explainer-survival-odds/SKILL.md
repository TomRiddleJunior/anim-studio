---
name: explainer-survival-odds
description: "Makes SURVIVAL ODDS, the page's recurring identity series: vertical 9:16 lit-3D survival-scenario episodes (85-102 s) in which an AI odds ring, top-right, scores the lead's chances live. Day 1: a thesis hook ('If the zombie apocalypse catches you at X… consider yourself lucky') with the ring snapping in at a 'lucky' 60-75 % and a 'YOU, AT HOME: 4%' chip on frame 1, one named lead with an age and a job, a calm routine, a radio message (the ring drops: '−13% OUTBREAK'), a refusal people will argue with ('+14% SAID NO'), the place's one advantage as a rule ('+15% THE DEAD SINK'), an inventory with numbers, a checklist, 'Ninety-seven percent. On paper.', then 'But she forgot one thing' as the ring glitches to a red ??, and end cards 'WHAT DID SHE FORGET?' + 'SURVIVAL ODDS · THE <PLACE> · DAY 2'. Day 2: the answer revealed, the odds recomputed, an A/B vote with both options' odds hidden. Each recalculation pops a delta chip, rolls tabular digits like a slot counter (one tick a step) and sweeps the arc; the same synthesized 'calculating' sting plays on frame 1 of every episode. Builds on explainer-survival-scenario (kit v2.2 → v2.3, HUD, captions, sound, QA, delivery) with HyperFrames + three.js; ships the first world module, The Rig (a storm sea, a gas platform with a burning flare, interiors, an underwater cut-away, the coast). Use for 'survival odds', 'AI odds', 'what are her chances', 'the page's identity series', 'Day 1 / Day 2 survival episodes', 'a new Survival Odds episode', 'odds ring survival reel'."
---
# Survival Odds — the page's identity series (lit-3D survival scenario + an AI odds ring)

**What it is.** The lit-3D survival scenario (`explainer-survival-scenario`) brings most of the owner's page views and nearly all
of its follows; nothing else holds viewers (§2). This skill keeps that engine exactly and adds
one device that is ours: **the AI odds ring**, a live score in the top-right corner that recalculates as each fact lands
and glitches to `??` at the twist. Episode 1 is the sample: `explainer-styles/samples/odds-rig/out/odds-rig.mp4` (its project is `assets/sample/`),
"The Rig · Day 1" (Mira, 33, alone on a remotely operated gas platform 140 km out at sea; 92.6 s). Episode 2,
"The Rig · Day 2" (the shutdown, the replays, the recount, the A/B vote; 88.25 s), is measured in
`references/day2_example.md` (its project lives in `explainer-styles/samples/odds-rig-day2`; not copied here).
Read the parent skill's SKILL.md (§2–§15) first: every kit API, gotcha and delivery rule there applies here.

## 1. Identity bible (every episode — check each box)
- [ ] Series name **SURVIVAL ODDS**; episodes are `THE <PLACE> · DAY <n>`.
- [ ] **The ring**, top-right, clear of the HUD clock: Ø 210 px, stroke 12 px over a thin track, value in tabular digits
      (66 px Inter 700) with a small `%`, `AI ODDS` (20 px, letter-spaced 0.32 em) under it. Right margin 64 px, top
      168 px (the top 8 % stays clear). Colour by value: ≥ 75 green `#46d483`, 45–74 amber `#f7b733`, < 45 red `#ff5a45`,
      `??` red.
- [ ] **Recalculation** on the fact's word: a delta chip beside the ring (`+15% THE DEAD SINK` green, `−13% OUTBREAK`
      red), the digits roll ≈ 0.5 s (fast, then easing into the value; one soft tick per step), the arc sweeps 0.6 s
      ease-out, a small pulse as it lands. One recalculation at a time, ≥ 3 s apart (`OddsRing.build()` asserts it).
- [ ] **The twist**: on "forgot one thing" the ring glitches 0.6 s (RGB split, scrambled digits, sliced, the arc
      jumping) and lands on a red `??` with a dashed red ring turning slowly.
- [ ] **The sting**: the same 0.62 s "calculating" sound (soft rising blips D5 G5 B5 E6 into a low click) on frame 1
      as the ring snaps in; quietly again on end card 1 (`odds_sound.sting`, deterministic).
- [ ] **Frame 1 works as a still**: the place as a hero shot in strong light, the ring already showing the starting odds,
      a comparison chip under it: `YOU, AT HOME: 4%`. No title card, first word ≤ 0.4 s.
- [ ] **End cards**: card 1 `WHAT DID SHE / FORGET?` + `TELL ME IN THE COMMENTS »`, the ring at `??`; card 2
      `SURVIVAL ODDS` · `THE <PLACE>` · `DAY 2` + `FOLLOW FOR DAY 2` + a small `@whitelightai`.
- [ ] Everything else from the parent skill: the HUD clock (`DAY 1 · 9:40 PM` + a sub line), tags, chips, the typed
      radio panel, the cream supplies card, the checklist, one caption phrase at a time coloured by meaning, colour
      washes, **two black beats with red eyes**, the lit-3D diorama look, a maquette-grade lead with her own face, the
      deep male narrator (Kokoro `am_onyx,am_michael`, 1.06; 0.95 on the last line).
- [ ] The answer is **planted three or four times and never said**; the narration never names it.
- [ ] The last fifteen seconds stay serious (checklist → "On paper" → cliffhanger).

## 2. Why it works
- **The survival format is the page.** On the owner's page the lit-3D survival reels bring most of the views and almost all of the follows, and they are the only format with strong interaction rates (the measured figures are kept private).
- **The biggest reference hits share three things:** a personal-stakes premise ("if the apocalypse catches you…"), **a
  number on screen that keeps changing** (the PS1 reel's AGE / LIVED counter, 1.0M likes; strike counters; "40 DEAD"),
  and an ending that asks the viewer to act. The **A/B vote** is the strongest comment engine: 8.5 comments per 100
  likes against 0.3–1.4 for everything else.
- **What our comments say:** the top comment is a "she forgot ___" joke (8,852 likes); the next argue with one decision
  (Noor turning the plane away: 8,343 and 3,504 likes); an answer solved in hours kills the thread (The Vault's
  AIRTIGHT plate); viewers ask for Day 2 and notice when two leads share a face.
- **So the ring:** the viewer scores along with a number that keeps changing (the counter hook); the disputable decision
  gets a visible number (+14 % for refusing the helicopter, so people argue with the number, not just the choice); the
  twist gets a picture (97 % → `??`); and it fits the page's bio, "World in the perception of AI": the AI does the maths
  and the AI is wrong. Day 2 adds the A/B vote.
- **Burst posting hurt** (11 reels on 8 Nov: median 3.9K views against 52–93K at one or two a day): see §10.

## 3. Day 1 beat map with the odds track
Measured on Episode 1 (92.6 s; `assets/sample/SCRIPT.md` has every line with times).

| % | beat | the ring | Episode 1 |
|---|---|---|---|
| 0 | **Hook** over the hero shot; green wash on "lucky" | snaps in at the start value with the sting; `YOU, AT HOME: 4%` chip | 71 % (amber) on frame 1 |
| 7–10 | **Open loop**, black beat, red eyes, boom | holds | "But only if you don't make one fatal mistake." |
| 11–28 | **Meet + routine** (name · age · job tag; the distance; three chips); plant 1 in the background | holds | Mira · 33 · control-room operator; 140 KM; ✓ PRESSURES ✓ WEATHER ✓ DINNER FOR ONE |
| 28–31 | **Turn**, red wash | holds | "But tonight, her life changed forever." |
| 32–39 | **Message**: dim beat on the clock, the device wakes, the typed panel; plant 2 as a small line | **drop** on the threat's word (−8…−15) | −13 % OUTBREAK → 58 % (32.25 s, 34.8 %) |
| 39–46 | **The offer + the refusal** (the decision people argue with), "?" | **biggest positive move** on the refusal | +14 % SAID NO → 72 % (42.09 s, 45.4 %) |
| 47–55 | **The reasoning** (what if…), red tag; the dry line on a deadpan beat | holds | ONE WAY IN; the helicopter's lights shrinking |
| 56–65 | **Decision + the advantage as a rule** (green); "= WALL" | **big positive move** on the rule's word | +15 % THE DEAD SINK → 87 % (54.60 s, 59.0 %), green |
| 66–80 | **Inventory** → the supplies card (one row per fact) | small moves, +3…+5 each, ≥ 3 s apart | +4 % FOOD → 91 (65.71) · +3 % WATER → 94 (68.99) · +3 % POWER → 97 (72.62) |
| 80–84 | **Lockdown**: two physical actions, green `CUT OFF`; plant 3 just before it | holds at the peak | ladder up, gate chained |
| 84–87 | **Checklist** ticks on "Check" | holds | Food? Water? Power? Check. (84.8 / 85.5 / 86.2 %) |
| 88–90 | **"<N> percent. On paper."** — the narrator reads the ring | **pulse** (×1.22, glow) on the number | "Ninety-seven percent. On paper." (87.7 %), lamp flicker |
| 91–93 | **Cliffhanger** on the second black beat; plant 4 | **glitch → ??** on "forgot" | 84.94 s (91.7 %) |
| 94–100 | **End cards** (silent but for hits and the quiet sting) | `??`, slowly turning dashed ring | card 1 86.85 s, card 2 89.55 s |

**Script shape** (from the parent §3): 220–250 words, 17–20 lines, past tense, third person, plain; the narrator never
names the answer; line 17 reads the ring's number aloud ("Ninety-seven percent. On paper.").

## 4. Day 2 template (the answer, the recompute, the vote) — measured on "The Rig · Day 2" (88.25 s)
Same identity, same lead, same narrator, ring, HUD, captions, sound kit and QA; 85–100 s; ~205 words, 21 lines.
`references/day2_example.md` has Ep. 2's lines, odds track and shot list with times; the kit pieces are
`OddsRing(start=None, reveal_from=<Day 1 peak>)` + `ring.reveal()`, `mini_ring()` (assets/kit/odds_ring.py), the Day 2
world states in `survival-rig.js` (power-down, torch, dawn, lifeboat, restart panel, what-if fire, boats' lights) and
`assets/tools/build_day2.py` (replay chips, the panel replay, the recount card, the split, option cards, vote cards).

| % | beat | the ring | Ep. 2 |
|---|---|---|---|
| 0 | **Cold open on the consequence** over Day 1's hero framing | frame 1 at a red **`??`** (dashed, turning) + chip `DAY 1: <peak>%`; the sting | the rig lit in the storm, "Seventy-two hours after the shore went quiet…" |
| 4–6 | **The reveal word**: the place dies on screen (lights out in sections, the generator winds down, the flare shrinks out) | **`??` → glitch 0.35 s → roll from the Day 1 peak to the low value in strides (~24 steps, 0.95 s)**, chip `−74% SHORE LINK LOST` | "off" 4.08 s (4.6 %): 97 → 23, lands 5.38 |
| 7–9 | Three quick inserts, one per loss, then **black beat 1** (red eyes) | holds | gauges → 0, screens die, emergency lights die; dip at 8.21 |
| 10–19 | **The answer, said plainly** ("That was the one thing she forgot. It was run from the shore.") with the lead, worried, by torchlight | holds | HUD `DAY 4 · 11:59 PM · 72 H WITHOUT SHORE` |
| 19–38 | **The plant replays**, one line each, every plant at full size, now the focus; chip `SEEN IN DAY 1 · m:ss` in the clock's place; Day 1 lighting, desaturated and cooled | holds | P1 16.5 s (LINK → LINK LOST), P2 19.0 s (the line lit amber), P3 23.4 s (sticker full frame, torchlit), P4 29.7 s (the coast going out) |
| 38–42 | **The dry gag pays off** | holds | the gull leaves (36.3 s) |
| 43–63 | **The recount** in a second palette (Ep. 2: a grey storm dawn, `DAY 5 · 6:40 AM`), a cream card with empty rows filling as each fact lands; the bed returns, sparser | **4 small moves, both ways, ≥ 3 s apart**, each on its own word | +4 FOOD 40.47 (45.9 %) · −6 WATER 45.06 (51.1 %) · +5 RAIN 48.15 (54.6 %) · −5 COLD 52.00 (58.9 %): 23 → 27 → 21 → 26 → 21 |
| 63–66 | **"She had two choices."** The frame splits: a blue A half, a red B half | holds | split on "choices" 56.41 |
| 66–78 | **Option A**: its cost shown as a what-if (red), its upside as a what-if (cool grade) | main ring holds; card A's own ring at `??` | restart panel + valve wheel, a flame on "burns"; the flare relit, boats turning toward it |
| 78–87 | **Option B**: its cost (a number on a sticker) + the map; **black beat 2** on the danger it leads to | card B's ring at `??` | FUEL · 24 H, 140 KM, the red-eyed coast with the lifeboat's light between |
| 87–91 | **"The AI has run the numbers on both."** Both cards side by side | both rings at `??`, the main ring at the current value | 21 % |
| 91–93 | **"A or B? What would you do?"** The lead close, looking at us, **determined** (open lids) | the ring shrinks to a badge | |
| 93–100 | **The vote**: end card 1 `A OR B?` + both cards + `COMMENT A OR B · THE MOST VOTES DECIDES DAY 3` (the quiet sting); card 2 `SURVIVAL ODDS · THE <PLACE> · DAY 3` + `FOLLOW FOR DAY 3` | both cards `??` | 82.50 s / 85.31 s |

Rules: never reveal the options' odds before the vote; never let one option look obviously right (each has a shown
cost and a shown upside, both as what-ifs); the narrator never says which is better. Day 3 plays the winning option
out with its odds revealed on screen (the losing option's odds in a small chip).

## 5. Episode generator (how to pick the next one)
1. **A place that sounds safe for one clear reason** (a rule the dead can't beat: water, height, cold, a vault door, a
   fence, an island, a time lock). Real-world plausible, no real brands or sites. Good next places: a lighthouse on a
   tidal island, a deep-sea research vessel, a glacier hut, a dam control room, an automated grain silo, a prison's
   empty wing, a cable-car station, a nuclear bunker museum.
2. **One lead, a new face every time** (§7): name, age, a job that explains why she is there, alone.
3. **The decision people will argue with**: she refuses the obvious rescue (the plane, the boat, the helicopter, the
   convoy). Give it the biggest positive move and one "what if…" line of reasoning. This is the comment fight.
4. **The answer about 5 % of viewers find** on a first watch: something that follows from how the place works (an
   automation, a timer, a dependency, a season), planted 3–4 times, never said, never zoomed onto. Test it: if a plant
   is readable in the first viewing as *the* answer, make it smaller or move it to the background. Avoid one-word
   giveaways printed in the hero shot (The Vault's AIRTIGHT plate killed its thread in hours).
5. **The joke blank**: one funny, harmless thing she plainly "forgot" that viewers will offer first ("she forgot the
   seagull's rent"). Put it on screen as a visual gag (Ep. 1: the gull on the window sill, turning to the lens).
6. **A 3–4-item rival answer list** the film supports, so the comments argue: Ep. 1: the flare (the only light at sea:
   boats will come), the helicopter she refused, the storms, the gas itself, the dead floating back up, the seagull.
7. **The odds numbers** by §6, written into the script table before voicing.
Write the script table like `briefs/identity/BUILD_BRIEF_SURVIVAL_ODDS.md`: narration | on-screen (plants marked P) | odds.

## 6. The odds maths rule
- **Start "lucky": 60–75 %** (amber). Ep. 1: 71.
- **Each fact moves the ring ±3–15** points. Threats subtract (the outbreak, a crowd, a lost route); advantages add.
- **The refusal is the biggest positive move** (the disputable decision gets the biggest number). Ep. 1's fixed track
  gave the refusal +14 and the advantage +15: the two biggest moves, one point apart. In new episodes keep the refusal
  strictly the largest.
- **Inventory items are small** (+3 to +5 each), so the climb to the peak feels earned, and the ring turns green ≥ 75.
- **"On paper" lands at 94–98 %**, read aloud by the narrator ("Ninety-seven percent. On paper.").
- **Then `??`** on "forgot one thing" (red). Never show a low number on Day 1: the drop is Day 2's.
- At most 7 recalculations; ≥ 3 s apart; each on the fact's own word (not the end of the sentence).
- The comparison chip on frame 1 is a fixed low number for "you, at home" (4 %): the hook says "consider yourself lucky".

## 7. Visual system (the parent's look, plus)
| role | the parent (lit-3D diorama) | The Rig (Ep. 1) |
|---|---|---|
| night / sky | navy dome, stars, moon | storm: a dark slate dome, two cloud layers (290 m, 170 m) lit orange from below by the flare (`cloudGlow`), stars at 0.15 |
| key light | the moon (directional + shadows) | a cool storm light from the south-west, 38° up (no disc), 1.4 outside; the **flare** is the warm key (point light 2600, flickering, optional cube shadow `flareShadow`) |
| place | terrain, forest, the tower | a Gerstner sea (8 trains, spatially modulated, foam at the legs, an analytic reflection of the flare-lit clouds, a lit underside), the platform, rain streaks, the coast 6 km north (town lights in 6 sections, a heliport, a crowd at a fence, red eyes on the shore) |
| accent | warm practicals vs the blue night | the flare's orange vs the black sea; deck floods (white); the helideck's green ring; the lead's orange coverall |
| grade | ACES, bloom, grain, washes | same; **heat shimmer** over the flame (kit v2.3 `warpAt/warpK/warpR`) |
- **The lead looks new every episode** (the comments notice). Mira: a black blunt bob with a straight fringe (a fringe
  shell built on `hz.fz`), East Asian features via `face{}` (almond eyes: lid 15, lowLid 10, tilt 9, the eye groups
  narrowed ×0.78; a low, flat bridge; straight brows), light-medium warm skin `#c48a64`, an orange offshore coverall
  with reflective bands and a charcoal fleece collar, a white hard hat on deck only. `out/qa/look_compare.jpg` in the
  sample sets her against Hazel, Rosa, Noor, Ines, Leila, Grace, Maya and Elif. Build a look sheet before any shot.
- **Safe area**: the ring + its label end at y ≈ 400; tags, panels and cards start at **y 444** (not the parent's 330);
  captions centred at 74 % (y 1350–1520); faces at 40–55 % in panel shots (below the panel, above the captions).

## 8. The ring (spec + code)
`assets/kit/odds_ring.py` is the overlay: pure Python, it emits markup, CSS and GSAP lines (all `tl.set`/tweens at fixed
times, seek-safe) and sound cues.
```python
from odds_ring import OddsRing
ring = OddsRing(start=71)                              # size 210, stroke 12, right 64, top 168, roll 0.5, sweep 0.6
ring.chip("YOU, AT HOME: 4%", 0.0, T["B"] - 0.1, "r")  # the comparison chip under the ring (frame 1)
ring.recalc(w("l07", "Outbreak"), -13, "OUTBREAK")     # delta chip + rolling digits + arc sweep (asserts >= 3 s apart)
ring.pulse(w("l17", "Ninety"), w("l17", "On"))         # the peak, read aloud
ring.glitch(w("l18", "forgot"))                        # 0.6 s glitch -> red ??
ring.compact(t0, t1)                                   # shrink to a 0.62 badge in a face close-up (not needed in Ep. 1)
els, tl, cues = ring.build(); css = ring.css(); track = ring.track()
```
- One span per value the counter passes (plus 12 scramble values and `??`), toggled with `tl.set` (no onUpdate, so it
  seeks cleanly); step times ease out (`t + roll·(1 − (1 − k/n)^2.2)`), each step a `odds_tick` cue.
- The arc is an SVG circle with `stroke-dasharray = C`, `stroke-dashoffset` tweened with `attr`; its colour and the
  ring's `--oc` glow switch with `tl.set` on the step that crosses 45 or 75.
- The glitch: two ghost copies (sepia + hue-rotate red/cyan, `mix-blend-mode: screen`) jittered per step, the face
  clipped with random `inset()` slices, the arc jumping; then `??`, `%` hidden, a dashed red arc turning 360° in 9 s.
- Later `fromTo`s on the same element pass `immediateRender: false` (else the last tween's from-state shows at t=0).

## 9. Captions, HUD, overlays
As the parent §8 (Oswald 700 78 px, stroke 7 px, one 2–6-word phrase, coloured by meaning, centred at 74 %), with
the tag band moved to y 444. Ep. 1's overlay set (`tools/build.py`): the clock (`DAY 1 · 9:31 → 9:40 (amber) → … 11:58
PM`, sub `NIGHT · STORM`), name tag, a distance tag, three routine chips, the typed panel `SHORE BASE · CH 16` (two
lines, then a smaller grey third line = plant 2, then the helicopter's line in amber), radio rings, a `⏱ 10:00`
countdown (one span per second), "?", red/green tags, a **map card** (the coast, the rig, a dashed line drawing,
`140 KM`), the cream supplies card (rows light up on their words; it lifts away for the flare shot and returns for
POWER ∞), the plan, the end cards.

## 10. Sound (and the identity sting)
`assets/kit/odds_sound.py` (numpy only, deterministic): `sting` (frame 1 at 0.62 gain; end card 1 at 0.3), `tick`
(per digit step; the pitch climbs with the roll going up, falls going down), `delta` (rising two-tone + a glint for +;
a falling, slightly sour two-tone for −), `pulse` (the peak), `glitch` (gated bit-crushed noise + a falling square),
`land` (a low thud with a sour D2/E♭2 tail when `??` lands).
`tools/sound_design.py` (Ep. 1): ambience by zone (storm wind with whistles, rain, the swell's washes, the flare's
roar near it, the control room's hum with a dip on "On paper", the underwater hush), story SFX keyed to words (radio
static/squelch/chatter, typing, the gauge tink, pen scratch, microwave hum + ding, **a gull cry after "seagulls"**,
relay clicks, rotor thump, a distant crowd, the plunge + bubbles, the pump + pouring, the generator, the winch ratchet +
clank + draining water, the chain + padlock, pen ticks, the lamp buzz, booms, a riser, end hits), the ring bus, and
**an original music bed** (76 BPM D minor: a filtered bass pulse, a pad, a sparse high "data" arpeggio, a soft kick
when tense; it lifts to the relative major on "decided to stay" and **drops out on "On paper"**).
**Two mixes:** full (`score/audio/final.wav`) and no-music (`final_nomusic.wav`: voice + ambience + SFX + the ring's
sounds). Levels under speech: ambience −23.5 dB, music −20.5 dB, SFX peaks −6.5 dB and the ring −6 dB under the voice
peaks → voice over everything else 11.2 dB (full), 11.7 dB (no music). Two-pass loudnorm −14 LUFS, TP −2.0.

## 11. Shot grammar (32 shots in Ep. 1)
Hook aerial (drifting in) → closer drone (green wash) → **black aerial** (the place small, the far glow, red eyes) →
the lead 3/4 at her station (name tag) → **pull back through the window** (height + sea) → the room wide (plant 1
behind her) → **the gag** (the gull at the window sill, turning to the lens) → three routine inserts → red-wash face →
dim device close-up (rings) → the lead listening (panel above) → the lead with the handset → outside: lights blink on
(countdown) → from behind her looking up at the rescue ("?") → front: the head shake on "no" → **telephoto** of the danger
(crowd at a fence, red eyes) → the rescue's lights shrinking (deadpan) → determined face (green) → **underwater
cut-away** (the dead sinking past the legs) → crane up from the waterline (map card) → inventory dolly → insert →
the flare wide (heat shimmer) → the plant-3 door with the card back → night action ×2 → desk (plan) → push-in, the ring
at its peak, "On paper" flicker → **black aerial** (plant 4: the coast goes dark section by section; `??`) → end cards.
Every shot moves; something changes every ≤ 5 s; hard cuts; dips through black into both black beats.

## 12. Posting playbook
- **Cadence:** one episode every second day, nothing else posted on those days; never more than two reels in a day,
  ~20–24 h apart. First post the unposted survival films (Volcano, Wedding Castle, Monastery). Day 2 of an episode
  goes up 2–4 days after Day 1, once its comments have a top answer.
- **Caption template:** `She's alone <where> when <the threat>. The AI gives her <start> %.` ⏎ `<the refusal> and does
  the maths: <advantage>, <two inventory facts>. <peak> %. On paper.` ⏎ `But <Name> forgot one thing. What was it?`
- **Pinned comment:** `The AI said <peak> %. It missed something that's in the video three times. What did <Name>
  forget? Wrong answers welcome too: she forgot ___.` (The blank invites the joke answers that top the comments.)
- **5 hashtags (Instagram's cap):** `#survival #zombie #whatwouldyoudo #storytime #ai`.
- **Cover template** (`tools/cover.py <world frame> "THE <PLACE>" <day> <start odds>`): the hook frame; `SURVIVAL ODDS`
  (amber, letter-spaced) + `THE <PLACE>` (white) + `DAY n` (red glow) top-left; the ring at the starting odds top-right;
  one line in an amber band: "She has a plan. She forgot one thing." Everything inside the 3:4 grid crop (y 240–1680).
- **YouTube Shorts:** title `Survival Odds: The <Place>, Day <n> (she forgot one thing)`; a two-sentence description
  that discloses the AI voice and the code-made animation.
- Post the full mix; keep `_nomusic.mp4` for an in-app library track (POST.md has the note).

## 13. Code recipe
```bash
export EXPLAINER_STYLES=<your explainer-styles folder>   # engine/ (TTS, analyzer, ffmpeg-static) + tools/ (the render lock)
cp -r ~/.claude/skills/explainer-survival-odds/assets/template "$EXPLAINER_STYLES/samples/my-ep" && cd "$EXPLAINER_STYLES/samples/my-ep"   # runnable 21 s demo
# 1) vo/script.json (the fixed narration, caps per line); voice it:
"$HOME/.generative-music-video/venv/Scripts/python.exe" -I "$EXPLAINER_STYLES/engine/audio/tts.py" vo
# 2) tools/build.py: the shot clock T (each boundary from a word), the odds track (OddsRing), the overlays
python -I tools/build.py          # film-vo.js, hud.html, out/<key>.srt, index.html, score/timing.json (+ the odds track)
# 3) a world module in assets/lib/ (copy assets/kit/survival-rig.js as the pattern) + assets/lib/film.js (one entry per shot)
python -I tools/patch_kit.py      # only if your survival-kit.js is v2.2 (the template ships v2.3)
python -I tools/wt.py <film.js> <name> 8 survival-rig     # throwaway world tests, 8 views per run (under the lock)
python -I tools/sheet.py look                                # the lead's look sheet (tools/wt_sheet.js; before any shot)
"$HOME/.generative-music-video/venv/Scripts/python.exe" -I tools/sound_design.py   # both mixes, levels.json
python -I tools/snap.py scratch/s1 0.5 "" "<plant times>"  # one still per shot + extras, labelled sheet (under the lock)
bash "$EXPLAINER_STYLES/tools/render_locked.sh" "$PWD" scratch/<key>_master_r1.mp4 delivery   # background
bash "$EXPLAINER_STYLES/tools/with_render_lock.sh" bash tools/deliver.sh scratch/<key>_master_r1.mp4
# a sound-only change after the picture is accepted: rebuild the mixes, then stream-copy the delivered video
cp out/<key>.mp4 scratch/video_graded.mp4 && bash "$EXPLAINER_STYLES/tools/with_render_lock.sh" bash tools/remux.sh scratch/video_graded.mp4
python -I tools/cover_frame.py 0.5 "THE <PLACE>"            # world-only frame -> out/cover.jpg
# a Day 2 episode: start from the Day 1 project, then tools/build_day2.py -> tools/build.py, assets/kit/film_day2.js
# -> assets/lib/film.js, tools/sound_design_day2.py -> tools/sound_design.py (all word-timed: re-voice, then rebuild)
python -I tools/cover_frame.py 4.75 "THE <PLACE>" "The shore went quiet. Now she has to choose." 2 "??"   # Day 2 cover
```
- Tools find the shared pieces through `tools/paths.py` (`EXPLAINER_STYLES`, `FFMPEG`, `FFPROBE`, `RENDER_LOCK`; defaults: two
  levels above the project, the engine's ffmpeg-static, PATH). No tool holds a local absolute path.
- World module pattern (`survival-rig.js`): `SURVIVAL.<world>(K)` builds everything, registers one `K.onRender` hook
  reading `st` (pure function of the state), bakes static groups by material (`bake`, ~10× fewer draw calls), and
  exports the lead preset + `dress<Lead>(K, hz)`. Wire it as the parent §14: `FILM_CREATE`, `FILM_BUILD`.
- **The Rig's state keys:** `flareI, flareShadow, cloudGlow, floodI, winGlow, crI, lampI, monI, scrK, radioK, txK, micro,
  storeI, utilI, genI, waterK, jugK, heliDeckK, heliBlink, ladder, chain, gull, gullRy, gullHead, heliK, heliP, heliYaw,
  heliBank, heliHalo, coastK, coastCut (0..6 sections off), townS, glowK (kit), shoreEyesK, shoreEyeS, shoreEyeSep,
  crowdK, heliportI, rainK, cloudK, scudK, under, uwFog, deadK, sinkT, swell, foam, seaRefl, seaK, warpK` and Mira's
  `hz.setHat(bool)`. Marks are in `Rg.P` (decks DM 14 / DU 21, MOD, CR, STO, UTL, HD, FL_TIP, GEN, STAIR, LADDER,
  COAST_Z, HELI, SEAT, WINS_N, WY0/WY1, legC(y)).
- Render (iGPU, 2 workers, delivery preset): ~590 s for Ep. 1's 92.6 s (591 s and 587 s). Delivery + full QA
  (`deliver.sh`) ~3.5 min. An optional per-shot grade goes in `score/grade.vf` (one ffmpeg `-vf` chain applied in the
  encode, e.g. `lutyuv=y='16+(val-16)*0.92':enable='between(t,51.38,53.02)'`): the fix for a gate missed by a hair
  when another render needs the user's OK. Fix the shot in film.js for the next render and delete the file.

## 14. QA gates (measure on the delivery file; `tools/qa.py`, `qa_all.sh`)
| gate | target |
|---|---|
| duration | 85–102 s |
| WPM (analyzer, SRT) · first word | ±20 % of 134 · ≤ 0.4 s |
| frame 1 | the place + the ring at the starting odds + the comparison chip |
| loudness · true peak | −14 ±1 LUFS, ≤ −1 dBTP, **both mixes** |
| voice over everything else | ≥ 10 dB (full and no-music) |
| Whisper `small` | every line heard (≥ 0.85 word recall per line against the captions); every recalculation word heard (`recalc_words` in timing.json) |
| YAVG | 0 unplanned black/flash frames |
| **edge band scan** | no solid black band ≥ 24 px touching the top or bottom edge outside the planned black beats (every frame at 10 fps: rows with mean luma < 6 and std < 3; `band_scan`) |
| streams | video = audio length (±0.05 s) in both files, the same frame count; never `-shortest` with stream copy |
| captions | safe area on every sweep tile; nothing important in the bottom 20 % |
| plants | each ≥ 28 px cap height at 1080 wide, ≥ 1 s on screen, never the focus |
| the ring | every recalculation ≥ 3 s apart; the glitch lands on `??` before end card 1 |
Also: the 2 fps sweep (look at every tile), `compare.jpg` against the format's source beats (local only, never shipped),
`look_compare.jpg`, the odds track in `gates.json`.

## 15. Gotchas (met building Ep. 1 and Ep. 2; the parent's §11–§15 still apply)
- **Point-sprite eyes didn't draw** (a `THREE.Points` ShaderMaterial with a per-pair offset attribute compiled clean
  and rendered nothing). Eyes are **instanced glow spheres** (`eyeInst`): one `InstancedMesh`, pairs, blink by scale.
- **Eyes inside heads**: a glow sphere centred inside the head sphere is invisible; put eyes ≥ 0.03 m in front of the
  face surface, and if the body sways, sway the eyes with it (or don't tilt the heads).
- **Baking breaks `getWorldPosition`** on the merged meshes: keep a list of positions (the helideck halos sat at sea
  level until they were computed from geometry).
- **Screen right is −x when looking along +z** (again): the gull was off-frame right; solve framings numerically.
- **The window, the monitors and the face**: from outside, a seated face behind a console is hidden by monitor backs;
  frame through the gap between monitors and a window pane (solve the line of sight against both).
- **A lit window from outside needs a glow plane** (`winGlow`): the real interior seen through 10 % glass is too dim.
- **The sky dome shows below the horizon underwater**: add a gradient dome round the camera (`under`), a teal fog, and
  a lit underside on the sea material (`gl_FrontFacing`).
- **A regular swell reads as corduroy from the air**: 8 trains with a spatial amplitude modulation (value noise at
  ~3λ) and distance fades per wavelength.
- **Shore features on a coarse land mesh** sink into it: place them ≥ 3.5 m over the analytic height.
- **Kit gotcha, again**: decals inside an `rbox` bevel vanish (the radio's LCD).
- **The flare billboard seen steeply from below** looks like a puff; frame the flame from ≤ 30° below its axis.
- **A face in a panel shot sits below the panel, above the captions** (y ≈ 800–1250): aim the look point at the chest.
- **Heredocs with Python and backticks fail in this shell**: write patch scripts with the Write tool.
- **Snapshots are cheap, renders are not**: 7 snapshot rounds settled every shot before render 1; render 2 fixed
  only what render 1's QA and sweep found (two YAVG steps, the voice, the last caption, the coast). Measure YAVG on
  the snapshot PNGs before rendering (Y ≈ 16 + 219 × mean luma): a bright close-up or pale wall cut against a night
  shot drops > 50 and fails the gate; keep neighbours across a cut within ~45.
- **Kokoro mispronounces names and compounds**: "Mira" came out MY-ra (Whisper heard "Myra") and "helideck"
  "heli-tick". Respell in the voice text only (`Meera`, `heli-deck`), keep the captions' spelling, look words up by
  the voiced form (`w("l03", "Meera")`, `w("l15", "heli")`), and let `whisper_check.py` compare against the captions.
- **A solid prop hides its inside**: the microwave's plate never showed through a window on a solid box. Build a
  hollow shell (top, bottom, sides, back, a dark door frame) and a glass texture with alpha (smoke, a dot mesh, one
  highlight), lit by a small point light inside.
- **The last caption ran into end card 1**: cap every caption's off time at `T["Z1"] − 0.05`.
- **Ring ticks can eat a word's last consonant**: Ep. 1's +15 roll sat on the /k/ of "They sink" and Whisper heard
  "sin". `sound_design.py` ducks the ring bus −10 dB over a listed word's acoustic end (`DUCK = [("l11", "sink", -10.0)]`:
  the last 10 ms window within 30 dB of the word's peak, −0.28 s to +0.05 s, after levelling). List every word a ring
  event lands on whose last sound is a stop (k, t, p) or an s.
- **The 10 fps band scan rounds to the nearest frame**: its sample labelled 84.0 s was the first black frame of a
  beat starting at 84.03 s. `qa.py` pads planned windows by half a sample interval; check a flagged frame by frame
  (`select`, `-fps_mode passthrough`) before changing the picture.
- **A closer, warmer framing raises YAVG**: L1 moved closer for render 2 and its cut into the dark underwater shot
  became a 50.3 step (gate 50). Re-measure every changed shot's cut neighbours on the snapshots, not only the ones
  that failed before.

- **Ep. 2: a single letter is not a word to Kokoro**: "A." was read as the article and "Ay" as "I" (Whisper heard "I or
  B"). Use Kokoro's inline phoneme override in the voice text, `[A](/ˈA/)` and `[B](/bˈi/)`; the token text stays "A"
  / "B", so captions and word lookups still match. Test any respelling with Whisper on the raw voice before building.
- **Ep. 2: never one lone bright frame in a flicker**: a 0.1 s "on" slot that a cut shortened to one frame failed the
  YAVG flash rule (render 1, the monitors dying). Flicker in segments of ≥ 2 frames and end every flicker dark, well
  before the cut (`B2`: dark 2 frames, back 2 frames, dead).
- **Ep. 2: measure every cut before rendering**: snapshot each boundary at T − 0.04 and T + 0.04 (62 stills) and
  compute Y ≈ 16 + 219 × mean luma; three cuts were > 50 (a torchlit white label into dawn, a fire into night, a bright
  face into end card 1) and were fixed by darkening the outgoing shot's last 0.4–0.9 s (`exposure` ramps, a torch that
  clicks off) and lifting the incoming one.
- **Ep. 2: dark rooms need a planned light**: after the shutdown the kit's practicals are off; a face needs `st.fill`
  of 3–3.5 at ~1 m (cool, "from the window") plus the kit's `flash` tool or the world's free torch (`torchK`, `torchP`,
  `torchAt`); `hemiI` 0.6 keeps the room from going to pure black. The kit torch's cone hardly shows; aim the free torch
  for the pools of light instead.
- **Ep. 2: a grey dawn is cheap**: one `dawn` uniform lerps the kit's sky dome (`zenC`/`horC`, found by traversal), the
  cloud base colour, the sea's analytic reflection, the fog/background and the hemisphere + moon colours. The kit's
  hemisphere is navy by default: without the colour change, "dawn" stays blue-black.
- **Ep. 2: the HUD clock and in-world text**: replays put a `SEEN IN DAY 1 · m:ss` chip in the clock's place, and no
  shot frames readable in-world text beside the clock.
- **Ep. 2: Mira's "determined"** read as sleepy in Ep. 1 (lid −22 plus her face's lid 15). `dressMira` now sets
  `hz.EXPR.determined.lid = −44` (narrowed brows, open eyes); check expressions on `tools/wt_expr.js` (a look sheet
  of calm / worried / old determined / new determined, 3/4, hat, blanket, torch).
- **Ep. 2: a torch the viewer can read** (render 3, after review): the kit's `flash` tool (a thin dark tube, the arm held
  straight out at the lens) read as "reaching for nothing". `dressMira` registers a handheld `torch` tool (a yellow body,
  a black head, a bright lens + a camera-facing halo), a bent-arm `torch` pose (hand at chest height, angled forward and
  down) and `hz.torchWorld()`; the film feeds its tip and direction to the world's free torch (`torchOut()` in
  film_day2.js: a cone with `torchBeam` ~2.4 over 5 m + a pool where it lands). Stage it so the pool lands on something
  in frame (Ep. 2: Mira beside the console, face 3/4 to the camera, the beam onto the console) and light the face with a
  cool fill from the window side (face luma 0.59 measured).
- **Ep. 2: a post-shutdown room still has to read at phone size**: no frame of a wide should fall below ~70 % of the
  Day 1 room's YAVG (Ep. 2's wide: ≥ 60 against Day 1's 74–90): a cold window light (`winColdI`), a cold window glow
  (`winGlow` + `winGlowCol`), `hemiI` ~1.1, the torch pool, and the lead at ≥ ⅓ of the frame height.
- **Ep. 2: lights at sea are not boats**: radial halos on the horizon read as half-domes. Boats need a hull, a lit
  cabin, a mast with a white masthead light and red / green side lights (each shown only from its own side), at
  75–700 m from a camera near the water, with the flare-lit clouds behind the rig for a silhouette.
- **Ep. 2: the story day on every card**: the recount card said DAY 4 under a DAY 5 clock (fixed in render 3); a card's
  day comes from the clock it sits under.
- **Ep. 2: a world prop added for one episode is in every later framing**: the lifeboat, the tarp and the restart
  panel now show in the hero framing too (consistent for the series; the Day 1 sample keeps its own copy of the module).

Files: references/sources.md · references/day2_example.md · assets/kit/ (survival-rig.js
with the Day 2 states, odds_ring.py with reveal() + mini_ring(), film_day2.js (Ep. 2's shot list), odds_sound.py,
survival-kit.js v2.3, patch_kit.py) · assets/tools/ (build.py, sound_design.py, qa.py, qa_all.sh, deliver.sh, snap.py,
wt.py, sheet.py, wt_sheet.js, paths.py, cover.py, cover_frame.py, whisper_check.py, reveals.py, sweep_only.py,
odds_ring.py, odds_sound.py, remux.sh, build_day2.py, sound_design_day2.py, wt_expr.js) ·
assets/template/ (a runnable 21 s demo with the ring) · assets/sample/ (the full "The Rig · Day 1" project, without mp4s,
the voice wav or reference frames: re-voice it with tts.py before running sound_design.py)

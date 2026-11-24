# Satire-cartoon — fast satirical news cartoon reel (toy-like cel-shaded bobble-heads, hard cuts, counters that leap)

Analysed 2026-10-27 from `insta/frames/De6-7n8I4Q4/` (metrics, sheets) plus my own measurements on the 720×1280 24 fps
MP4: 2 fps contact sheets of the whole reel (`samples/satire-cartoon/scratch/src/sh2_00…05.jpg`), 24 fps strips around
every transition and gag (`hf_A…L`: flash + gleam, orbit, cage drop, sign flip, costume change, price scramble, whip pan,
starburst, halo flash, rock drop + calendar flip, final meter), a per-frame cut / flash / motion probe (`tools/probe.py`),
k-means palettes on 18 full-res frames (`tools/km.py`), a caption-pixel probe (`tools/cap.py`) and an RMS / spectral-flux
pass over the soundtrack against the Whisper word times (`tools/aud.py`). Values marked *inferred* could not be measured.

---

## 1. Identity

A 65 s vertical **political satire** told like a children's toy commercial gone wrong. **Chunky, toy-like 3D-cartoon
figures** — big round heads (~37 % of the body), stubby legs, mitten hands, oversized white oval eyes with tiny pupils —
rendered with **one hard cel-shade band** (a cool violet multiply on the side away from the key light), soft key-light
gradients, **thin dark plum outlines** and a fine paper grain. They act out every clause of a deadpan, very fast
narration (229 WPM) in **warm cream rooms and sky-blue exteriors**: an office with gold curtains, an arched violet
hangar, a courtroom in wood, a queue outside a beige building under a billboard, a gas station, polling booths, a rally.
The edit is **hard cuts every ~2.7 s** (18.5 / min) with **1-frame white flashes** on the reveals, and the camera never
stops inside a shot (orbits, pushes, a whip). **Props carry the argument**: a wall calendar with two circled dates and
little bombs around them, a TRIAL desk sign that flips to ON HOLD, a poll chart whose red arrow shoots up, a WAR button,
and above all **gas-price signs and a pump read-out whose numbers scramble and leap absurdly**. An **everyman in a green
hoodie and striped pyjama trousers** stands in for the viewer and suffers the consequence. Small **yellow captions with
a dark outline** sit at 70 % of the frame height, 2–5 words at a time. Structure: claim → "So why…?" → each side's
motive → the deal → what it costs *you* → the promise → a callback punchline on the counter.

## 2. Source analysed

| id | account · reel | dur (s) | cuts/min | scene changes/min | median shot / scene (s) | motion mean / p90 | hold_frac | colourfulness | WPM | LUFS |
|---|---|---|---|---|---|---|---|---|---|---|
| De6-7n8I4Q4 | potatocrimesofficial — satirical cartoon claiming two leaders time a bombing around their elections; ends on a gas-price punchline (≈ 252 k likes, original audio) | 64.8 | 18.51 | 21.29 | 2.71 / 2.33 | 13.15 / 33.0 | 0.013 | 68.5 | 228.6 | −14.1 |

Other facts: 720×1280, **24 fps**, H.264 + HE-AAC 48 kHz; saturation 0.359; brightness 0.755; dark-frame fraction 0;
`animated_frac` 0.677 (the soft gradients + grain read partly "photographic" to the flatness detector — it is fully
rendered animation); shot length p10 / p90 1.54 / 4.75 s; first cut 2.0 s (a flash frame); 6 cuts in the first 15 s.
Palette (k-means, whole reel): `#f2f0e4` 22 % · `#3b405f` 18 % · `#e5cda8` 16 % · `#90613c` 14 % · `#cf8a52` 9 % ·
`#5094e2` 7 % · `#9dceee` 7 % · `#82918f` 7 %. Caption text in `meta.json` names real, living politicians — **a sample must
never do that**; we keep the formula, not the people (see §12).

## 3. Measured pacing

| quantity | value | what it means in practice |
|---|---|---|
| hard cuts | **18.5 / min**, median shot 2.71 s, p10 1.54, p90 4.75 | a new set-up roughly every sentence; shots are 1.5–5 s, almost never longer |
| scene changes | 21.3 / min, median scene 2.33 s | the colour-histogram counter adds orbits and a whip to the cuts |
| cuts in first 15 s | 6 | the hook stacks five set-ups (office, hangar, runway, sky, desert) before "So why…?" |
| flash frames | 4 (2.00, 53.04, 53.08, 53.58 s) | the analyzer counts them as cuts — they are **1-frame white flashes** on a reveal |
| motion mean / p90 | **13.2 / 33.0** | continuous camera (3D orbits, pushes) + full-body acting; p90 from orbits, whips, cage drops |
| hold_frac | **0.013** | nothing is ever frozen — idle sway, blinking, a rotating siren, drifting camera |
| motion by decile | 20.3 · 14.1 · 10.3 · 7.0 · 13.3 · 17.2 · 14.7 · 9.4 · 13.2 · 12.0 | front-loaded hook (orbit + flash + bomb drop), a calm courtroom stretch, a busy gas-station / polling middle-end |
| colourfulness / saturation / brightness | 68.5 / 0.36 / 0.755 | bright, warm, mid-saturated: cream + navy + sky blue + wood + sign blue/yellow |
| WPM | **228.6 overall**, ~242 while speaking | one breath per sentence; pauses 0.15–0.48 s (median ≈ 0.28) |
| loudness | −14.1 LUFS integrated; speech ≈ −15 dB RMS, gaps fall to −37 … −48 dB | dry VO, **no music bed**, sparse SFX |

**Timed shot list (source, s; ✂ = hard cut, ⚡ = flash frame):**
0.0 office on a navy star rug: both leaders flank a giant upright olive bomb, thumbs up, grinning · ⚡2.00 1-frame
white flash, 4-point twinkles gleam on the bomb for ~0.9 s · 3.0–4.0 **orbit** around the bomb (it sweeps past as a
foreground occluder) to a wall calendar; one leader circles a date · ✂5.17 violet arched hangar with red lamps:
two soldiers gaze at the bomb, a row of small bombs behind · ✂6.75 runway: the bomb hangs from a crane hook over a
bomber; camera cranes down to a pilot who shrugs (the size beat) · ✂8.42 sky: a cargo plane, the bomb rolls
out of the back (9.5), opens a red/white parachute (10.0) — camera follows it down · ✂11.13 desert city, the cloud
rises, blocks flattened (12.0) · ✂12.96 podium on a blue backdrop: the second leader quoted — he pinches a tiny bomb (14.0),
cut-in to a wider angle with a mushroom cloud on the screen behind (14.5) · ✂15.21 **everyman at the calendar**,
fist on chin, eyes dart to the circled dates (the narrator's "why" question) · ✂17.13 courtroom: the defendant sweats; a judge shakes a
gavel; **a cage drops on him** at "prison" (20.57–20.62) and lifts at "the war" (22.5); wider angle with a red
**rotating siren** (23.0); **desk sign TRIAL flips to ON HOLD** (25.47–25.59); an easel chart's **red arrow shoots up**
(26.43–26.93) and he cheers · ✂27.33 outdoor queue of voters, a billboard screen, an "OCT 27" date card · ✂29.25 an
office: one leader kneels and pleads at a desk with a big red **WAR button**; the other gives a thumbs-up; a
**helmet arcs onto the pleader's head** with a star sparkle (33.23–33.65) · ✂34.00 queue: the billboard switches to
an angry face pointing at the voters; they gasp · ✂38.54 hangar: the other leader waves, a "3 NOV" sign behind ·
✂42.04 **gas station**: the everyman by a pump; the pump display **scrambles** (43.15–43.6) and the DIESEL / GAS sign
**rolls** 3.75 → 4.29 in 5 frames (44.2); **whip pan** past a yellow car to a bearded man (44.74–44.95) as the
pump total leaps $2.31 → $13.02 → $81.70 · ✂46.75 supermarket aisle, price tags flying (the inflation beat) ·
✂48.29 polling booths; the sign in the window rolls to $6.99 with a **starburst** outside (50.19–50.36); voters step out
· ✂51.67 rally from behind the crowd, arms wide · ✂⚡53.04 podium with a **halo** (flash, halo pops at 53.65) ·
54.5 he turns and walks behind a curtain where the bomb waits · ✂56.38 gas station: he points up, then a **rock drops
on his foot** with an impact star (58.45) (a literal gag on the promise's idiom); the tear-off calendar **flips 3 → 4** (59.45–59.6) ·
60.0 the cargo plane and the parachute bomb drift down behind the sign · ✂61.88 the everyman at the pump, the meter
creeps $61.20 → $61.83 ($0.03 per frame) then **explodes exponentially** to $2,191.73 while a burst goes off behind
the station (62.6) · end 64.8 (no logo, no CTA).

## 4. Script & narrative structure

Transcript (Whisper): 247 words, 64.8 s. One idea per sentence; each sentence gets its own shot and its own literal
visual gag (a word about prison → a cage drops, "on hold" → the sign flips, "up" → the arrow, a falling idiom → a rock).

| % runtime | beat | content (described, not quoted) | visual device |
|---|---|---|---|
| 0–8 | **Cold-open claim**: who + what + the hook twist | names both leaders and the big weapon, then the twist that its date is timed to their own elections | both flank the prize, thumbs up; flash + gleam; orbit to the calendar, a date circled |
| 8–23 | **The object, escalated** — name, size, delivery, a quote | the weapon's nickname, its size, its delivery by parachute, its blast radius, then a belittling quote from a leader | 4 fast set-ups (hangar, runway, sky, desert) then the podium pinch gag |
| 23–26 | **The "why" question** | the turn, asked by the narrator | the everyman at the calendar, fist on chin |
| 26–45 | **Motive A** (one side's self-interest) → the ask → the go-ahead | trial → war pauses it → polls rise → the date → the ask → the go-ahead | cage drop/lift, sign flip, siren, arrow, queue + date card, kneeling + costume pop |
| 45–58 | **The threat to the voters** + **motive B** | a threat aimed at the voters; the other side wants it *after* its own vote | billboard switches to an angry face; hangar with the other date |
| 58–82 | **Consequence for the viewer** (prices) → a warning about one more price rise before the vote | gas past $4, diesel at a record, inflation; gas spikes as people vote | gas-station counters scramble/roll/leap; whip to a second sufferer; booths + starburst |
| 82–91 | **The promise** | a promise of no attack before the midterms and of falling fuel prices | halo flash; walk behind the curtain to the prize; rock-on-foot gag |
| 91–100 | **Callback punchline** | callback: after the date something does fall, but it is the bomb, not the fuel price | calendar flips past the date; the prize floats down behind; the everyman's meter explodes |

- **Hook pattern:** a factual-sounding claim naming both actors, then a twist clause about timing; the first visual
  is the two actors posing proudly with the object.
- **Rhythm:** sentences of 8–20 words, one per shot; 0.15–0.5 s pauses; no rhetorical questions except the single
  "So why…?" at 23 %.
- **Ending:** the callback reuses the promise's own idiom, applied to something else, and the last word is the
  viewer's own thing (their fuel bill). No sign-off.

## 5. Visual system

**Palette roles (sampled hex, full-res frames).**

| role | hex | use |
|---|---|---|
| room cream | `#fbf3db` · `#f4e7ca` · floor `#f2e5c8` | offices, hall floors (≈ 22 % of all pixels) |
| navy | `#2b417e` · deep `#222543` | suits, rug, podium |
| prize olive | `#788146` · `#72723e` | the bomb (the "object" colour) |
| warm hair / wood | `#cd8950` · gold `#e1b65f` · `#e9bb7d` | hair, curtains, trims |
| hangar violet-grey | `#615765` · `#575375` · ribs `#7d7081` · red lamps `#ff5a4f` | hangar set |
| sky | `#71b3ee` · `#84c4f4` · `#4f9ae8` · pale `#e2f3fb` | exteriors, backdrops |
| courtroom wood | `#c78b57` · `#a5683d` · `#925b38` · wall `#f3e7cd` | courtroom |
| room pink | `#dcbeb8` + violet ceiling shadow `#766f7b` | the everyman's room |
| sign blue / digit yellow | `#335cc8` · `#3a5eb3` / `#f4db4b` · `#f8ce40` | price signs; digits on `#1d2550`-ish insets |
| pump / alert red | `#d8473c` · `#df463a` | pump body, calendar header, siren |
| car yellow | `#f7ce3f` | the yellow car / van |
| polling | floor `#f0c689`, wall `#e6ecf3`, curtains white/blue-grey | booths |
| outline | `#2d2333` · `#322933` (dark plum, never black) | every silhouette |
| caption | `#e6df48` with a near-black outline | captions only |

**Shading.** One hard cel band per form, on the side away from a key light at the upper left / front. The shadow is a
**cool violet multiply** (green hoodie `#739679` → `#4a7f96`-ish shade; skin goes mauve), not a darker version of the
hue. Lit side has a soft gradient toward a lighter tone (the "soft 3D toy" read). Contact shadows under feet.

**Line.** Dark plum outlines ~2–3 px at 720 wide (≈ 3–4.5 px at 1080), round joins, on silhouettes and major inner
edges (lapels, curtains); interior detail lines thinner.

**Texture.** A fine, static-looking paper / film grain over everything (*inferred* overlay).

**Composition (9:16).** Characters fill the frame: in mediums the head sits at 35–50 % height and the body runs off
the bottom; props sit top-right (signs, billboards, calendars) or right (calendar on the wall). The caption band at
70 % usually lands on a torso. Nothing important in the bottom 18 % (Instagram caption/buttons) — only feet, floor,
pump bases; the right 12 % holds set dressing only.

**Typography (free look-alikes in the engine).**

| role | source look | engine font | size (fraction of H) |
|---|---|---|---|
| captions | bold grotesque, lowercase as spoken, yellow, thin dark outline | **Inter 800**, fill `#ece44c`, stroke `#1b1822` 6–7 px paint-order stroke | **0.017–0.019 H** (≈ 34–37 px at 1920); centre at **0.70 H** |
| price digits | heavy rounded bold | **Fredoka 700**, `#f6e43c` on `#1d2550` | 0.05–0.08 H on signs; 0.035 H on read-outs |
| sign labels (DIESEL / GAS) | rounded bold caps, white | Fredoka 700 | 0.018–0.022 H |
| calendar months, VOTE, OCT 27 | heavy geometric caps, white on red / blue | **Montserrat 900** | 0.025–0.03 H |
| desk signs (TRIAL / ON HOLD) | heavy italic caps, black then red | Montserrat 900 + `skewX(-9)` | 0.03 H |

## 6. Characters & objects

- **Construction:** head ≈ 37 % of standing height, body ≈ 33 %, legs ≈ 30 %; head an ellipse slightly taller than
  wide with ears; eyes = large white ovals with outline + small black pupils, the far eye allowed to break the head
  contour in 3/4; brows are thick strokes that carry the emotion; mouths simple (smile, O, grimace, wavy); mitten hands
  with a separate thumb; ball shoes or slippers. Suits get a white shirt V, a tie and cuffs.
- **Acting:** thumbs-up, pointing, pleading on one knee, fist on chin, hands on cheeks, arms wide, cheering fists,
  saluting, a smug lean-back. Emotions are big: sweat drops, red anger veins, eyes widening, a sly half-lid.
- **The everyman:** one recurring "you" figure in loungewear (green hoodie + striped pyjama trousers + slippers),
  droopy eyes; appears at the turn ("So why…?") and for every consequence; ends the film.
- **Prop language:** the prize as a trophy object; the wall calendar with two circled dates (+ little bombs around
  them); a tear-off calendar that flips; desk name sign; poll easel; big red button; billboard screen; price sign on a
  pole with yellow top strip and dark insets; pump read-out (black, red frame); polling booths; a parachute.
- **Literalisation:** every idiom becomes an object event — prison → cage, on hold → sign flip, shoot up → arrow,
  a falling idiom → rock on foot, a soaring idiom → price tags flying.

## 7. Camera & transitions catalogue

| # | move / transition | construction (24 fps strips) | duration | easing | count |
|---|---|---|---|---|---|
| 1 | **Hard cut** | on the sentence start (cut lands 0–3 frames before the first word) | — | — | ≈ 17 |
| 2 | **Flash frame** | 1 frame washed ~85 % white, recover over 4 frames (2.00–2.17) — used on a gleam or a reveal | 5 f | power2.in | 4 |
| 3 | **Orbit** | camera arcs ~60° around the prize; prize = foreground occluder sweeping across; background slides slower | ≈ 24 f (3.0–4.0) | sine/power2.inOut | 2 |
| 4 | **Push / drift** | slow continuous push-in or lateral drift on every hold | whole shot | linear-ish | always |
| 5 | **Crane / follow** | camera follows a falling or rolling object (parachute, cargo) | 1–2.5 s | sine.inOut | 3 |
| 6 | **Whip pan** | fast lateral move to a second subject in the same set, slight blur | 5–6 f (44.74–44.95) | expo.inOut | 1 |
| 7 | **Cut-in / angle change** | same set, tighter or wider angle on a punchline (podium → wide with screen) | cut | — | 3 |
| 8 | **Screen switch** | billboard / TV content swaps (poster → angry face), sometimes with a burst | 1 f | — | 2 |

## 8. Motion grammar

- **Gleam:** flash frame + 4–6 four-point twinkles that pop (2 f), spin, and fade over ~0.9 s.
- **Drop-in prop (cage, helmet):** falls in 1–2 frames, lands with a 4–6-frame squash/settle; helmet arcs over the
  head for 8 f, lands with a star sparkle.
- **Sign flip:** the placard rotates about its bottom edge: 2 f squash to edge-on, 2 f new face (TRIAL → ON HOLD).
- **Counters (the signature):** (a) **scramble** — random values every 1–2 frames for 0.4–0.5 s, then land;
  (b) **mechanical roll** — 3.75 → 3.95 → 4.13 → 4.25 → 4.29 over 5 frames; (c) **creep then explode** — the final
  meter adds a cent-scale step every frame, then grows exponentially to an absurd total by the last frame.
- **Arrow:** the poll line draws on in ~12 frames and leaves the chart; the character cheers on the next beat.
- **Bursts:** starburst explosion 4–5 frames (yellow/white jagged star), impact star on a hit.
- **Idle life:** characters sway and breathe, blink, sweat; a rotating siren glow; camera never fully still
  (hold_frac 0.013).
- **Acting on the word:** pose changes and props land on (or 1–3 frames before) the stressed word.

## 9. Sound

*Analysed numerically (RMS, spectral flux against Whisper word times); not listened to.*
- **VO:** one male narrator, dry, deadpan-sardonic, very fast (≈ 242 WPM while speaking); speech RMS ≈ −15 dB.
- **No music bed:** pauses between sentences fall to −37 … −48 dB.
- **SFX:** sparse but present on the big visual events (louder transients at 44.35 s ≈ −10 dB during the price scream,
  impacts / whooshes *inferred*).
- **Loudness:** −14.1 LUFS integrated, 0.7 s total silence (< −45 dB for ≥ 0.6 s).

## 10. Formation rules (how to make another one)

1. Pick a pattern of self-interest with two dates and a cost to ordinary people; tell it as a claim, not a question.
2. Script 180–260 words for 45–65 s at ~230 WPM: one sentence = one shot = one literal gag; exactly one
   "So why…?" at ~23 %; end on a callback that pays off an earlier setup and lands on the viewer's thing. Write every
   line fresh: the source's own sentence frames (its quote frame, its polling line, its threat line, its callback
   line) are not templates.
3. Cast: the actor(s) in suits + one everyman in loungewear who appears at the turn and at the end.
4. Build 8–10 sets: a warm cream office, a moody hangar/depot, a sky/overhead shot, a podium on a blue backdrop, the
   everyman's room with the calendar, an institutional wood room, an outdoor queue under a billboard, the consequence
   location with a price-sign counter, polling booths, a rally.
5. Cut hard on sentence starts every 1.5–5 s (median 2.7); keep the camera drifting in every shot; add 1–2 orbits, one
   whip, 2–4 flash frames on reveals.
6. Make the numbers physical: a sign or read-out that scrambles, rolls and finally explodes on the last line.
7. Literalise every idiom with a prop event (cage, sign flip, arrow, rock, parachute).
8. Draw toys: big heads, one hard violet shade band, soft key gradient, thin plum outlines, mitten hands, grain.
9. Small yellow outlined captions, 2–5 words, at 70 % height; hard switches; keep the bottom 18 % free of meaning.
10. Dry fast VO, no music, SFX on gags; −14 LUFS.

## 11. Replication recipe (code)

**Layer stack** (bottom → top): per-shot group (X.scene) with a background rect → **camera group** with parallax
layers (`ctx.layer(p)`: bg 0.6–0.8, mid 1.0, fg 1.2–1.5) → props & puppets (SVG paths with cel gradients: a linear
gradient with a hard stop at 0.68 for limbs, a radial with a hard stop at 0.8 for heads; outline `#2b2235`
`vector-effect: non-scaling-stroke`) → **overlays**: flash rect, captions, grain (`X.grain(0.035)`), and a light global
`saturate(1.06)` on the SVG.

**Recipes.** Puppet = feet-origin rig with two-segment arms (shoulder + elbow rotations), swappable hands, eyes with
clipped pupils and a skin-coloured lid rect, mouth set, brow strokes, props (hard hat, halo) and a slot group in each
hand; idle sway / breathe / blink in a per-frame hook. Counters = text driven by time segments (set / scramble / roll /
exponential), a pure function of t. Orbit = parallax pan with a slight roll. Whip = 0.3 s camera move + horizontal
`feGaussianBlur` driven by sin²(πp). Flash = white rect, 1 frame at 0.85 then a 0.17 s fade.

**The 5 shots that define the style** (as the source stages them — re-stage each one in your own composition; the
sample opens on a ribbon cutting instead of the two-figure thumbs-up pose, and ends on a rosette for the pothole).
1. **The proud pose** — the actors flank the prize, thumbs up; flash + gleam; orbit to the circled calendar.
2. **"So why…?"** — the everyman, fist on chin, eyes darting to the circled date.
3. **The flip** — an institutional sign flips (TRIAL → ON HOLD) while an alarm light turns.
4. **The counter** — the everyman under a price sign whose digits scramble and leap; whip to a second victim.
5. **The callback** — the calendar flips past the date, the prize floats down behind, the meter explodes on "your …".

## 12. Per-video notes

- The source caricatures two real, living heads of government and states contested claims as fact; its caption lists
  no sources. **Our sample does not**: fictional town, fictional people, a pattern (pre-election spending) told as a
  joke, numbers inside a fictional town only, and one real term (*political budget cycle*) with citations (FACTS.md).
- 24 fps, flashes counted as cuts by the analyzer (4 of the 20 "cuts" are flash frames).
- `animated_frac` 0.677 undercounts (gradients + grain); treat as fully animated.

---

## Comparison: what makes "satire-cartoon" a distinct type

| axis | **Infographics Show** (`infographics-show.md`) | **Crashcourse** (`crashcourse.md`) | **Satire-cartoon** (this) |
|---|---|---|---|
| look | flat vector, no outlines, two-tone | flat outline-free story inserts | **toy-like cel-shaded 3D-cartoon: one violet shade band, plum outlines, grain** |
| edit | animated transitions, almost no hard cuts | host + inserts | **hard cuts every ~2.7 s + flash frames + orbits** |
| narrator | second person, sardonic, ~210 WPM | fast teacher, ~190 WPM | **third-person claim, deadpan, ~230 WPM, no music** |
| who stands in for the viewer | the "you" puppet in every shot | the host | **one everyman in loungewear who appears at the turn and the end** |
| numbers | tags, gauges | cards | **price-sign counters that scramble, roll and explode** |
| ending | question to the comments | thanks + sign-off | **callback punchline on "your <thing>"; no CTA** |
| format | 16:9 | 16:9 | **9:16 reel, captions at 70 % height** |

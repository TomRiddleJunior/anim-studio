# Sim-flight — game-engine photoreal aircraft explainer reel (chase cams, motion-blurred ground, DIN captions, info cards)

Source: Instagram reel `DfAgNpXAL9p` by @detailfuse (a helicopter-to-jet explainer, 98.0 s, 64,479 likes,
333 comments, account ~4K followers, original audio). Analysed locally for reference only (720×1280 / 30 fps): 2 fps
contact frames, 30 fps strips around all 25 cuts, full-resolution crops of every chrome element, a soundtrack probe
(RMS per 100 ms, spectrograms). Sample built from it: `assets/sample/` (NASA X-59).

## 1. Identity
A one-aircraft explainer that looks like footage from a flight-sim / game engine (Unreal-style PBR, aerial haze, sun
glare, heavy motion blur on the near ground), cut like a reel: a hard cut on almost every sentence, the aircraft always
the hero, close chase-cam framings that put the airframe in the upper half and let blurred terrain stream through the
lower half. One calm male narrator explains how the machine works in plain words (problem → the trick, step by step →
what it is for → the hard part → history → test → status → date), with white DIN-style captions of 2–6 words at ~69 %
height. Recurring chrome is tiny and quiet: a channel mark top-left, a dark info card (name + spec line) on reveal shots,
a thin-bar "Illustration based on … artwork" note, and "Recreation" / "Illustration" tags on re-enacted or hypothetical
scenes. No music; the bed is aircraft ambience. It ends by cutting back to its opening shot (loop).

## 2. Source and metrics
| field | value |
|---|---|
| id / account | DfAgNpXAL9p / detailfuse — https://www.instagram.com/reel/DfAgNpXAL9p/ |
| duration / fps / size | 97.98 s · 30 fps · 720×1280 (9:16) |
| cuts (analyzer) | 18 → 11.0 /min; my 30 fps diff finds 25 hard cuts (incl. 2 flash frames at 65.2 s) |
| scene changes / min · median scene | 14.7 · 3.0 s (shot length mean 5.16 s, median 4.8 s, p10–p90 1.5–9.0 s) |
| first cut | 4.63 s; 3 cuts in the first 15 s |
| motion mean / p90 | 12.9 / 22.9 (strong: blurred terrain in nearly every shot) |
| hold fraction / animated fraction | 0.002 / 0.031 |
| colourfulness · saturation · brightness | 39.5 · 0.387 · 0.443 |
| dark-frame fraction | 0.082 (dusk "illustration" scenes) |
| palette (share) | #15130d 17 % · #99938b 16 % · #362f20 16 % · #7f6952 13 % · #5b4f3a 12 % · #bab3ab 12 % · #5b7aa3 10 % · #2e4879 6 % |
| loudness | −14.1 LUFS; speech RMS median −14.5 dBFS, pauses −31 dBFS (bed ≈ 16 dB under the voice) |
| words / WPM | 263 (Whisper) · 161 WPM overall (~179 while speaking) |

## 3. Timed shot list (cuts at 30 fps; all hard cuts — no dissolves, no wipes)
| # | in–out (s) | shot | camera | chrome |
|---|---|---|---|---|
| 1 | 0–4.63 | aircraft over desert scrub, rotors spinning | close chase, rear-left, above; ground streaks | wm |
| 2 | 4.63–10.03 | side tracking over forested hills | long lens alongside; blurred canopy foreground | note (+0.07 s), card (+1.5 s) |
| 3 | 10.03–13.63 | helicopter over green hills (comparison) | wide, near static, slight follow | — |
| 4 | 13.63–16.50 | fighter jet rolling on afterburner | low rear 3/4 on the runway, asphalt blur | — |
| 5 | 16.50–17.30 | hovering aircraft over pines | low, looking up | — |
| 6 | 17.30–18.43 | small aircraft in the sky | telephoto, trees blurred at bottom | — |
| 7 | 18.43–23.30 | lift-off from a misty pine clearing at dawn | low in tall grass | — |
| 8 | 23.30–27.47 | rotors tilting forward over forest canopy | top 3/4, slow orbit | — |
| 9 | 27.47–32.20 | transition to jet, rocky mountain behind | side tracking | — |
| 10–12 | 32.20–44.60 | mechanism close-ups above a cloud sea (blades stop, fold) | extreme close orbit on the part | — |
| 13 | 44.60–51.73 | "now it's a jet" over a river canyon | chase, fast blur | picture-in-picture artwork card 44.67–48.6 |
| 14–19 | 51.73–66.57 | use cases at dusk, toy-like soldier figures, glowing rings, strike | varied, short (1.5–3.8 s) | tag "Illustration · no weapons announced" |
| 20 | 66.57–71.47 | the hard part, over snowy mountains | high, from above-behind | — |
| 21–22 | 71.47–79.20 | Boeing X-50A recreation in the desert, crash | chase/side | card + tag "Recreation" |
| 23–24 | 79.20–90.53 | rocket-sled test on rails in New Mexico | static, low | card + tag "Recreation" |
| 25 | 90.53–93.80 | hangar, being built | interior | — |
| 26 | 93.80–97.98 | sled, then the opening desert chase again (loop) | — | — |

Cuts land 0.17–0.4 s **before** the first word of a sentence (median ≈ 0.28 s); a few cut mid-sentence on a phrase.

## 4. Palette (sampled on full-resolution frames)
- Desert: sand #a9875f → #cdb08a, scrub #2e2c19–#47402a, haze #d4bea3 → sky #6f8fb6.
- Forest/hills: sunlit canopy #6f8a2c–#9ab048, shadow #1d2f12, distant ridges blue-grey #8e9aa3.
- Sky: zenith #4c78b6 → horizon haze #c9c3bb (warm) or #b9c6cf (cool); clouds #f2f1ee with #b8b8b8 shade.
- Dusk scenes: zenith #1f3268, horizon #f39a5e, red-lit ground #8a2416.
- Chrome: caption white #f1f1ec; card fill #1c1d20 at ~94 %; note fill #121314 at ~88 %; card bar orange #e8892b
  on the hero reveal, white #f2f2f2 on other cards; note bar light grey #c9c9c6; text grey #c8c8c5.

## 5. Typography (DIN family — Bahnschrift is a near-identical match)
Sizes as a fraction of frame height H (1920 px values in brackets):
| element | font | size | position |
|---|---|---|---|
| caption | DIN SemiBold, white, soft dark shadow (blur ≈ 0.008 H, ~55 % black) | cap ≈ 0.021 H (font ≈ 59 px), line-height 1.3 | centred on 0.692 H; 1 line or 2 lines (wrap at ~0.62 W) |
| watermark | icon (≈0.029 H) + DIN SemiBold ≈ 34 px, white ~86 % | — | left 0.043 W, centre 0.099 H |
| info card title | DIN SemiBold ≈ 40 px white | card h 0.055 H (105 px) | left 0.044 W, top 0.144 H; 8 px coloured bar left |
| info card spec | DIN Regular ≈ 31 px #d0d0cd, items joined by " · " | — | one line |
| note | DIN SemiBold ≈ 30 px white on #121314 | box h 0.029 H | left 0.037 W, top 0.583 H; 5 px light bar left |
| tag | DIN SemiBold ≈ 30 px, no bar | same box | same position as the note |
| PiP card | image 0.911 W × 0.289 H (16:9) in a 9 px dark frame, title band 98 px below | — | 0.144–0.488 H |

## 6. Caption system
- Phrase chunks of 2–6 words (mean ≈ 3.7), broken at commas and before connectives (that/and/but/from/for/on/at/to/like);
  dates and numbers get their own chunk ("In 2028,"). ~70 chunks in 98 s.
- Each chunk appears exactly on its first word (hard swap, no animation) and stays through the pause until the next
  chunk; never blank between chunks. Wraps to two centred lines when wider than ~0.62 W.
- No keyword highlight, no colour change, no emoji.

## 7. Motion grammar
- Camera: always moving; chase rigs locked to the aircraft (it barely moves in frame) while the ground streaks;
  side tracking with a long lens (fov ≈ 25–35°) for profiles; slow orbits (≤ 10°/s) for mechanism close-ups; static
  low cameras for ground scenes. Slight bank/roll drift on the aircraft (±3–10°).
- Motion blur: camera/object velocity blur with a long shutter — near ground smeared into streaks, aircraft sharp
  (moves with the camera), spinning rotors as translucent discs with 2–3 ghost blades.
- Chrome motion: card fades in over 5 frames (0.15–0.17 s, ease-out) with a ~3 px slide; note/tag fade in over ~3
  frames 2 frames after the cut; all chrome disappears on the next hard cut. Inset card fades in over ~4 frames.
- Lens: slight bloom on sun/glints, vignette, mild chromatic fringe, game-engine sharpness, light grain.

## 8. Transition catalogue
| type | frames | use |
|---|---|---|
| hard cut | 0 | every scene change (25×) |
| flash frames | 2–3 | explosion hits only (65.2 s) |
| loop cut | 0 | last shot returns to the first shot's framing so the reel loops |

## 9. Sound
- One calm male narrator (American, warm, unhurried but dense: 161 WPM overall, ~179 while speaking), short pauses
  0.4–1.2 s between sentences.
- No music. Continuous aircraft ambience: low rumble (20–300 Hz), wind rush, a faint turbine whine band (~5.8–6.2 kHz)
  on jet shots, rotor chop on rotor shots, explosions/impacts on events; it switches with each cut.
- Levels: voice ≈ −14.5 dBFS RMS, bed in pauses ≈ −31 dBFS; integrated −14.1 LUFS.

## 10. Script formula (beat map by % of runtime)
| % | beat | line pattern |
|---|---|---|
| 0–5 | hook: the impossible-sounding feat in one sentence | "[A vehicle] that [does two things that seem incompatible], in one sentence." |
| 5–10 | reveal + who built it (info card) | "It's the [name], from [maker] and [agency], for [purpose]." |
| 10–19 | contrast pair → "this one does both" | "[Type A] can [strength], but [weakness]. [Type B] is [strength], but [weakness]." |
| 19–53 | mechanism in 5–6 numbered-feeling steps, one shot each | "It [step 1]… Then [step 2]… As it [step 3]… By then [step 4]… Then [step 5]…" |
| 53–68 | what it's for (illustration scenes) | "So it could [use]… [Agency] says later versions might [use]…" |
| 68–73 | the hard part | "The hard part is [the open problem]…" |
| 73–81 | history: who tried before and what happened (recreation) | "[A rival] tried [it] [N] years ago… [what happened to the prototypes]" |
| 81–92 | the test that proved it (recreation + card) | "So [maker] put [it] on [a test rig]… [maker] says that's a first." |
| 92–100 | status + date, loop back to the opening shot | "[Status now]. In [year], [the next step toward the real thing]." |
Sentences 4–17 words; every number is concrete (speeds, years, distances); attributions ("DARPA says", "Bell says").

## 11. Formation rules (to make another one)
1. One real aircraft/vehicle, modelled procedurally and labelled "Illustration based on … imagery/artwork".
2. 9:16, 30 fps, ~95–100 s, a hard cut on (≈0.28 s before) nearly every sentence; 20–26 shots; median scene ≈ 3 s.
3. Every shot moves: chase rigs over terrain that streaks with motion blur; the hero stays sharp.
4. Environments rotate every 1–3 shots: desert scrub → forested hills → grass hills → runway → pines in mist →
   canopy → rocky mountains → cloud sea → river canyon → dusk → snowy peaks → desert again.
5. Mechanism = in-world 3D (parts move on the model, in-world FX like glowing rings), never diagrams or arrows.
6. Chrome only: watermark, captions, info card on reveals, note, Recreation/Illustration tags, one PiP card.
7. Calm male VO ~160 WPM, aircraft ambience bed ~16 dB under it, no music, −14 LUFS.
8. End on the opening shot.

## 12. Sample notes (X-59)
Topic swap: NASA's X-59 (Lockheed Martin Skunk Works). Same beat map: hook (break the sound barrier without the boom)
→ reveal + card → contrast (airliner slower than sound / fighter boom rattles windows → "This one wants both") → 1973 ban
→ mechanism (shape; nose + wing shocks merge on normal jets; long nose; engine on top; soft thump; no forward window;
4K screen fed by cameras; Mach 1.4) → use (fly over U.S. towns, ask people) → regulators → hard part → history (F-5E
Shaped Sonic Boom Demonstration, recreation) → tests (first flight Oct 28 2025, first supersonic flight June 5 2026,
chase plane's booms drowned it out, Mach 1.4 at 55,000 ft by October 2026) → next steps → loop to the opening shot.
The rotor-specific mechanism shots become in-world shock-wave shells and ground pressure rings; the DARPA artwork PiP
becomes an "eXternal Vision System" PiP (the pilot's camera view), since agency imagery may not be embedded.

### Sample shot list (28 shots, 27 hard cuts, every cut a change of environment, angle or light; `assets/sample/assets/lib/sim-shots.js`)
| t0 (s) | shot | env | line |
|---|---|---|---|
| 0.00 | desert-chase (X-59 whole on a diagonal, rear-left above, scrub streaking) | desert | l01 hook |
| 3.66 | hills-reveal (3/4 front-left over the canopy; note + card) | hills | l02 |
| 9.00 | hills-airliner (turboprop against a forested hillside, camera on a grassy knoll) | hills | l03 |
| 12.61 | runway-fighter (F-15-like on afterburner, heat shimmer, hangars and tower) | desert airfield | l04 |
| 16.39 | pines-pass (from the meadow, looking up) | pines | l05 |
| 18.25 | pines-mist (dawn, backlit pines, the jet crossing over the sun) | pines | l06 |
| 20.40 | pines-tops (chase over the canopy) | pines | l06 |
| 23.29 | canopy-shape (planform from above) | hills | l07 |
| 24.92 | desert-merge (fighter with one merged shock cone, side-rear chase) | desert | l08 |
| 28.34 | canopy-boom (rings sweeping the canopy) | hills | l08 |
| 30.43 | rocky-nose (side view of the whole jet, ridge behind) | rocky | l09 |
| 34.87 | clouds-shocks (separate weak cones) | clouds | l10 |
| 37.92 | clouds-engine (above-behind, deck below, deep-blue sky) | stratos | l11 |
| 40.43 | clouds-thump (rings on the cloud tops) | clouds | l11–l12 |
| 45.49 | high-cockpit (side profile: cockpit almost halfway back) | stratos | l13 |
| 47.67 | river-xvs (chase; PiP from l14) | river | l13–l14 |
| 53.04 | river-fast (3/4 front pass) | river | l15 |
| 55.70 | river-chase (low rear chase down the river) | river | l15 |
| 58.45 | dusk-town (Illustration tag; jet above the rooftops) | dusk | l16–l17 |
| 63.90 | dusk-mics (microphones, ground rings) | dusk | l17 |
| 67.09 | snow-cross | snow | l18 |
| 70.16 | desert-f5 (Recreation + card) | desert | l19 |
| 75.29 | runway-x59 (gear-down take-off from the scrub side; card) | desert airfield | l20 |
| 79.85 | high-chase (with the F-15; card) | stratos | l21 |
| 84.36 | high-f15 (from below, deep-blue sky) | high | l22 |
| 88.37 | high-cruise (from above over the deck; card) | stratos | l23 |
| 93.20 | dusk-mics-end (Illustration) | dusk | l24 |
| 95.26 | desert-chase-end (= opening shot, loop) | desert | l24 |

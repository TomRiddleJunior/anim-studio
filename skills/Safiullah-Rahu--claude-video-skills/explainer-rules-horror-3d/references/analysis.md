# Source analysis · `DfIjwMcN-XQ` (play.malo, "Subway Part 1", 480,123 likes, 5,283 comments)

Analysed locally for reference only (engine metrics, frame sheets at 2 and 8 fps, a sweep, a Whisper transcript).
720 × 1280, 30 fps, 98.75 s. The post caption is the part title plus series hashtags (the format is a series, and
the comment box is the ending).

## 1. Measured

| metric | value | note |
|---|---|---|
| duration | 98.75 s | |
| analyzer cuts · cuts/min | 21 · 12.76 | ffmpeg scene score > 0.33. At 0.12 the same video has ~45 cuts: many cuts join two grey, similar frames and score low. Real shot count ≈ 40–45 (≈ 26/min), median shot ≈ 2.2 s |
| scene changes/min · median scene | 12.15 · 2.67 s | 64-bin histogram distance 1 s apart |
| first cut | 4.3 s | a 3-frame white flash where the gate slams |
| shot length p10 / p90 | 1.47 / 12.46 s | the long ones are the note insert and the train arrival |
| WPM | 156.8 (258 words) | about 175 while speaking |
| brightness · dark-frame share | 0.242 · 0.667 | first half grey-lit, second half near-black blue |
| colourfulness · saturation | 15.0 · 0.25 | near-monochrome grey with three accents: amber dot-matrix, red seats/LED, blue/yellow train livery |
| motion mean · p90 | 7.26 · 11.85 | moving cameras in nearly every shot (push-ins, slow orbit, tracking) |
| hold fraction | 0.015 | the frame almost never stops |
| loudness | −14.0 LUFS | narration over a quiet tense bed |
| palette | `#535350` `#000000` `#7a7a77` `#353533` `#1b1f20` `#0b1013` `#040708` `#c6c6c4` | |

## 2. Shot list (from opening.jpg, timeline.jpg, shots_1.jpg, strips.jpg, ending.jpg, and a 0.12 cut scan)

| t (s) | shot | what the line says (paraphrased) | note |
|---|---|---|---|
| 0.0 | one-point wide down the platform, low camera, figure walking away in the centre, train leaving left, wet glossy floor with streak reflections of the tube lights | (the hook: you missed the last train) | the hook frame: subject + place at once |
| 2.5 | second wide, closer, train tail leaving | (the train leaves) |  |
| 3.9 | medium: figure at the exit stairs, green EXIT sign; 4.30–4.37 white flash; the folding gate is shut | (the gate shuts behind you) | the flash is the "slam" |
| 6.1 | insert: blue station sign on white tiles, slow push | (the station's name) | place name as a sign |
| 7.8 | high wide from the platform end: tiny figure, amber "NEXT TRAIN 05:30" board | (you are alone) |  |
| 9.6 | medium front: pulls out the phone, annoyed brows | (the phone comes out) |  |
| 11.0 | insert: phone in the white mitten hand, lock screen 23:41, "3 % Battery low" in red; 12.6 flips to "No Service" and 23:42 | (battery %, then no service) | the time ticks a minute between inserts |
| 13.5 | ECU face: angled brows, flat mouth | (no signal at all) |  |
| 15.0 | from behind: looks up at the board | (looking at the departure board) |  |
| 16.9 | insert: dot-matrix NEXT TRAIN 05:30 (amber, glow) | (the next train time (shown as digits)) |  |
| 19.9 | medium-wide: sits on red bench seats, then closer | (no choice but to stay the night) |  |
| 24.0 | over-the-shoulder from beside the seated figure | (noticing something in the booth) |  |
| 26.3 | the empty driver's booth, a sheet on the glass, slow push | (a sheet of paper on the glass) |  |
| 29.0 | insert, one long push over ~11 s with drifts: title, STAFF ONLY, rule 1, rule 2 half visible, torn edge, tape at the corners | (what the note says; the rest torn off) | rule 2 half visible = a rewatch hook |
| 40.0 | ECU: smile (curved mouth, soft brows) | (the dismissal: a joke) | the dismissal |
| 42.1 | wide: the booth, figure walks away |  |  |
| 44.3 | insert: red 7-segment clock on tiles 23:59 → 00:00 | (the trigger time) |  |
| 48.0 | blackout; figure faintly lit, worried | (every light goes out) | the light change is the event |
| 51.0 | POV down the tunnel: two headlights approach; 56–58 the train sweeps past camera (motion peak) | (headlights; a train arrives) |  |
| 58.0 | ECU: ring eyes, wavy mouth | (something is wrong) |  |
| 59.6 | wide side: silent train, small figure | (the train makes no sound) |  |
| 63.4 | doors open, white light from inside, figure in silhouette; 65.1 empty car interior (blue seats) | (doors open; nobody inside) |  |
| 68.5 | the note again, rule 1 boxed in red | (you remember the note) | callback |
| 69.9 | dark wide, board 05:30 glowing; 73.6 black legs walking | (footsteps, very slow) | footsteps are shown as legs only |
| 78.1 | two-shot: the white figure in front (ring eyes, O mouth), the black twin right behind its shoulder, small white dot eyes | (they stop right behind you) | the reveal |
| 80.8 | ECU: the black head, glossy, two white dots; 83.2 ECU white face | (breath on your neck; breathing) |  |
| 86.1 | both in the doorway, doors closing | (the doors start to close) |  |
| 88.3 | wide: labels "1 (option A)" (blue number disc) → the door, "2 (option B)" (red number disc) → the platform, thin white leader lines ending in dots | (two choices: option 1) | in-scene, pinned to targets |
| 91.3 | the white figure shrugs, label 2 pointing at its open palm | (option 2: stay in the dark) |  |
| 93.1 | labels jump to the top corners and stay; ECU twin / white face alternate | (with whatever is behind you; the question) | the question is the last caption |

## 3. Systems

- **Hero**: white glossy artist's mannequin (ball joints at shoulder, elbow, wrist, hip, knee, ankle; barrel chest;
  ball waist), a big sphere head with a drawn cartoon face: thick black brows with felt-marker edges, black oval eyes
  with one white catchlight, short mouth line. Expressions are drawn swaps: annoyed (brows down), smile (curve),
  worried (brows up, wavy mouth), scared (ring eyes with a centre dot, O mouth).
- **Threat**: the same mannequin in glossy black, two small white dot eyes, no other features. Shown only after the
  footsteps stop, always next to the hero first.
- **Set**: one realistic location, rendered with soft GI, glossy wet floor, fluorescent tubes, haze in the distance,
  depth of field on every close shot. Signage carries information (station name, departure board, clock, note).
- **Light as plot**: bright grey for the setup; the turn is a lighting event (blackout at midnight), then dark
  blue-black with single sources (headlights, the train interior).
- **Captions**: Montserrat-like heavy caps, white, soft dark shadow, no box, 2–3 words, centred at ~69 % of the
  height, hard on/off on the word onset, numbers spelled out (one exception: the train time as digits on the board shot).
- **Labels**: dark rounded pill, 2 px white border, a coloured number disc (blue 1, red 2), white caps text, a thin white
  leader to a dot on the target; then both pills jump to the top corners for the final shots.
- **Sound**: one calm male narrator (dry), a low tense bed, small SFX (gate slam, phone, train) kept under the voice.
- **Ending device**: the narrator offers two choices and asks what you would do, with the labels on screen — the
  comments become the game ("1" / "2"), and "Part 1" makes Part 2 a promise.

## 4. What we keep, what we change

Kept: second person present tense; isolation piled up in four concrete facts (shut exit, battery %, no signal, a time
the way out reopens); a found rule with the rest torn off; a dismissal with a smile; an exact time as the trigger; a
light change as the event; a sound that approaches and stops right behind you; the twin revealed beside the hero; the
note as a callback; two in-scene numbered labels that move to the top corners; the last caption is the question.

Changed for realism and retention: physically lit garage (wet concrete with planar reflections, volumetric haze, sodium
and fluorescent practicals, car paint and glossy shells reflecting a PMREM of the set, contact shadows, bokeh DOF,
motion blur, grain, chromatic aberration); the light event is spatial (rows turn red one by one toward the viewer),
so the threat has a visible speed; the threat leaves a wet trail before it is seen; a red accent rule across the
captions and the light; the dilemma is sharpened (the rule says don't run, the exit opens).

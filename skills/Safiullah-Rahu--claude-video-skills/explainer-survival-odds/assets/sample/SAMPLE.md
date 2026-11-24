# SAMPLE — Survival Odds · The Rig · Day 1 (explainer-survival-odds, episode 1)

`out/odds-rig.mp4` (full mix: voice, ambience, sound effects, the ring's sting and ticks, an original 76 BPM bed made in
code) · `out/odds-rig_nomusic.mp4` (the same video stream; everything but the bed) · `out/odds-rig.srt` ·
`out/cover.jpg` · `out/qa/` (2 fps sweeps, metrics.json, gates.json, yavg.json, bands.json, whisper_small.txt,
whisper_check.json, look_compare.jpg; compare.jpg is local only). 1080×1920, 30 fps, **92.60 s**, 2,778 frames.
Format reference: @survival.stories_en "The Lighthouse · Day 1" (110.5 s), analysed locally for reference only.

## Build
- **Script:** the brief's 18 lines, 223 words, word for word (`vo/script.json`; SCRIPT.md has every line, shot, the odds
  track and the plants with times). Kokoro `am_onyx,am_michael` at 1.06, the last line at 0.95; gaps 0.3–0.6 s, tail
  6.0 s. **TTS-only respellings** (`Meera`, `heli-deck`): render 1's voice said MY-ra and "heli-tick" (Whisper heard
  "Myra"); the captions, SRT and name tag keep Mira / helideck. The re-voice was tested in `scratch/vo2` first (Whisper
  then heard "Mira" and "heli deck") and is 0.37 s shorter.
- **World:** `assets/lib/survival-rig.js` (a small gas platform on four jacket legs: two decks, the module with the
  control room, storeroom and utility room, the helideck, the flare boom, the generator housing, the boat-landing
  ladder; a Gerstner sea with foam and an underwater look; storm clouds lit by the flare; rain; the coast 6 km away
  with a town, a heliport, a crowd and red eyes; the dead sinking; a helicopter; a gull) on survival-kit v2.3.
  `assets/lib/film.js`: 33 shots, each boundary on a word (`tools/build.py`).
- **Lead:** Mira, 33, a new look (black blunt bob with a straight fringe, East Asian features via `face{}`, light-medium
  warm skin, orange coverall with reflective bands, grey fleece collar, a white hard hat on deck only), checked on a
  look sheet against the eight earlier leads (`out/qa/look_compare.jpg`) before any shot.
- **The ring:** `tools/odds_ring.py` (OddsRing: chip, recalc, pulse, glitch, compact) writes the overlay and the cue
  list; `tools/odds_sound.py` makes the sting, ticks, delta hits, pulse, glitch and land sounds; both mixes carry them.
- **Sound:** `tools/sound_design.py`: storm and flare ambience by zone, the sea, rain on steel, radio, microwave, tap,
  winch ratchet, chain and padlock, gull, heartbeat, the ring bus, the bed (drops out on "On paper"). Voice over
  everything else 11.11 dB (full) / 11.67 dB (no music); music 20.5 dB under the voice. The ring bus ducks 10 dB
  under the end of "sink" (54.725–55.055 s; see the audio-only update below).
- **Snapshots before rendering:** 12 rounds, 225 stills (`scratch/s1`–`s12`). Rounds 1–8 settled every shot before
  render 1; round 9 re-shot all 33 shots plus the four plants at full size on the new voice; rounds 10–12 checked the
  three render-2 fixes (the microwave, the generator door, the YAVG of F3 and O3 measured on the PNGs).
- **Renders: 2** (delivery preset, iGPU, through `render_locked.sh`): **591 s** and **587 s**. No third render.

## Render 1 → render 2
Render 1 (92.97 s voice) passed every gate but two: **2 unplanned YAVG steps** (F3 → G at 26.37 s, 152.8 → 77.5: the
bright microwave close-up; O3 → Q1 at 74.07 s, 159.4 → 68.6: the pale generator door against the night ladder shot)
and Whisper's "Myra" / "heli-tick". The sweep also showed a coast too faint for plant 4, oversized helideck halos at the
end of D, a far L1 and a gull lying flat. Render 2 changed only those: the re-voice (all times moved by ≤ 0.38 s), the
last caption capped before end card 1, F3 darker with a hollow microwave (a dotted smoked-glass door, the tray meal
turning inside: the solid box had hidden the plate), O3 wider and darker with a larger sticker, D ending on the whole
rig, halos 0.85×, the coast's town lights larger (`townS` 1.6 → 2.6) with a stronger glow (they now go out visibly, section by section), L1
closer, the gull upright.

Render 2's QA found two things, both fixed in the encode, with no third render:
1. **One unplanned YAVG step at the L1 → L2 cut (53.03 s), 93.5 → 43.2 (a 50.3 drop; the gate is 50).** The closer L1
   is brighter than render 1's. Fix: `score/grade.vf`, an optional per-shot grade `tools/deliver.sh` applies in the
   encode: `lutyuv=y='16+(val-16)*0.92'` on 51.38–53.02 s (L1 only; both its ends are hard cuts, so no step inside the
   shot). The step is now 86.8 → 43.2. A future render should drop L1's fill (2.0 → 1.6) and delete `grade.vf`.
2. **One edge-band "violation" at 84.0 s.** Checked frame by frame (`scratch/bandcheck.py`): the 10 fps sample
   labelled 84.0 s is source frame 2521 (84.033 s), the first frame of the planned black beat S; frame 2520 (R2's last)
   has no band. The fps filter rounds to the nearest sample, so a sample can be the frame up to half an interval later.
   `tools/qa.py` now pads each planned window by half a sample interval at its start.

## Audio-only update (after the picture was accepted)
Whisper heard l11's "They sink" as "They sin": the +15 roll's ticks (54.675–55.105 s) sat on the word's final
/k/ (the burst is at about 54.97–55.02 s, some 22 dB under the vowel). `tools/sound_design.py` now ducks the ring bus
−10 dB over the word's acoustic end (the last 10 ms window within 30 dB of the word's peak, found at 55.005 s), from
0.28 s before it to 0.05 s after (54.725–55.055 s, 40 ms ramps), after the bus is levelled, so the ring's level
elsewhere is unchanged; the roll stays audible and the digits still roll on screen. Both mixes were rebuilt and
remuxed onto the delivered video with `tools/remux.sh` (video stream copy from a copy of the graded render-2 file,
AAC 256k, `-t` to the composition length, no `-shortest`), then the full QA ran again. Whisper `small` now hears
"The dead can't swim, they sink." in the full transcript and on line 11 cut alone from both files.

## Gates (measured on the delivered files)
| gate | reference | ours | target | pass |
|---|---|---|---|---|
| length | 110.46 s | **92.60 s** | 85–102 s | ✓ |
| WPM (analyzer, SRT) · first word | 134.2 | 144.5 · 0.18 s | ±20 % of 134 · ≤ 0.4 s | ✓ |
| frame 1 | — | the rig, the flare, the lit H, the ring at 71 % + `YOU, AT HOME: 4%`, the sting | place + ring + chip | ✓ |
| loudness · true peak (full) | −14.6 | −14.3 LUFS · −1.9 dBTP | −14 ±1, ≤ −1 | ✓ |
| loudness · true peak (no music) | — | −14.3 LUFS · −1.8 dBTP | −14 ±1, ≤ −1 | ✓ |
| voice over everything else | — | 11.11 dB full · 11.67 dB no music · music alone 20.5 dB | ≥ 10 dB | ✓ |
| Whisper `small` | — | 18/18 lines at 1.00 (mean 1.000); "Mira", "heli deck" and "they sink" heard | every line | ✓ |
| YAVG | — | 0 unplanned (2 planned: the dips into B and S) | 0 | ✓ |
| edge black bands (10 fps) | — | 0 outside the planned beats (S 84.03 s on, end cards) | none ≥ 24 px | ✓ |
| streams | — | both files: video 92.600 s, audio 92.600 s, 2,778 frames | match | ✓ |
| captions | y ≈ 1695 | one phrase at a time, Oswald 78 px centred at 74 %; never over a face (sweep) | safe band | ✓ |
| plants | — | P1 17.39–19.57 · P2 35.29–38.41 · P3 72.22–73.67 · P4 84.49–86.29 (then dark); all ≥ 1 s; P3's two lines ≈ 44 px and 30 px high at 1080 wide (measured on the delivered frame at 73.0 s) | ≥ 28 px, ≥ 1 s, never the focus | ✓ |
| the ring | — | recalculations 9.8, 12.5, 11.1, 3.3, 3.6 s apart; the glitch on "forgot" (84.94) lands on ?? at 85.54 < end card 1 (86.85) | ≥ 3 s; ?? before card 1 | ✓ |
| cuts / min · scene changes / min | 1.63 · 3.26 | 18.14 · 16.85 | — | explained miss (parent §2: the 3D format cuts every 2–4 s) |
| brightness · colourfulness · motion | 0.228 · 36.6 · 1.78 | 0.331 · 44.4 · 7.91 | look | — |

## The odds track (delivered)
71 (0.00, the sting) → −13 OUTBREAK 58 (32.25) → +14 SAID NO 72 (42.09) → +15 THE DEAD SINK 87 (54.60, green) → +4 FOOD
· 1 YEAR 91 (65.71) → +3 WATER 94 (68.99) → +3 POWER · OWN GAS 97 (72.62) → the pulse on "Ninety-seven" (81.22) → the
glitch on "forgot" (84.94) → ?? (85.54), held through both end cards (the quiet sting on card 1 at 86.95).

## What reads well
- The ring: it is on frame 1 with the sting, every move has a chip, rolling digits and ticks, the narrator reads the
  number, and the glitch to a red ?? lands the cliffhanger as a picture.
- Plant 4: the coast's band of town lights goes out section by section while the red eyes on the shore stay; the
  horizon goes black under "But Mira forgot one thing".
- The routine beats: the gauges, the weather log, the microwave with the meal turning; the gull at the window turning
  to the lens on "seagulls".
- Mira is clearly a new person next to the eight earlier leads (`look_compare.jpg`), in the coverall, the fleece collar
  and the hard hat outside.
- The underwater cut-away (dark figures sinking past the jacket legs) and the crane up from the waterline.

## What is weaker
- **Faces stay maquette-simple:** in the close shots (G, L1) the expression changes are small, and L1's "determined"
  lids read as half-closed eyes.
- **Q1 (the ladder) does not show Mira at the winch clearly;** the beat reads as the ladder rising.
- **K2's helicopter is a glowing dot;** "turns back" leans on the caption and the shrinking light.
- **D's pull-out passes through the module** for about half a second (13.0–13.5 s).
- **The L1 grade is encode-side:** the source (film.js) still renders L1 brighter; see above.
- **Plant 3 is the most findable plant:** the sticker sits mid-left in the shot about power, under the supplies card.
  It is small and never pointed at, but more viewers than the target ~5 % may read it.
- **Cuts and scene changes run far above the reference** (18.1 and 16.9 / min against 1.6 and 3.3): the format's 3D
  version keeps a 2–4 s shot rhythm on purpose; the reference holds illustrated frames for ~28 s.
- **The refusal (+14) is not strictly the largest move** (+15 for the sink), as the brief's fixed track sets them.

## Deviations (deliberate)
- TTS-only respellings `Meera` and `heli-deck` (captions unchanged).
- Gaps between lines set to 0.3–0.6 s and the tail to 6.0 s (no words changed), as in render 1.
- The L1 grade in the encode (`score/grade.vf`) instead of a third render; the band scan's half-interval padding.
- The ring duck under "sink" (audio only, after the picture was accepted).
- Masters: `scratch/odds-rig_master_r1.mp4`, `scratch/odds-rig_master_r2.mp4` (kept; the delivered files come from r2;
  `scratch/video_r2_graded.mp4` is the graded video the audio-only remux copied; `scratch/audio_r2/` holds the
  previous mixes).

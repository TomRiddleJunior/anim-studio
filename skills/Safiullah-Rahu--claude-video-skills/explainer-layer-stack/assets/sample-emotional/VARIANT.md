# Variant: layer-stack, emotional ("What it really takes to bring a lost dog home")

Film: `out/layer-stack-emotional.mp4`, 1080×1920, 30 fps. Built from `samples/layer-stack/` with the explainer engine
(`engine/make.sh <dir>`). This is the reusable recipe for a warm, moving layer-stack reel. The format stays the same;
the tone changes.

## What stays the format (recognisable in the first frame)
- The warm canvas `#faf8f4` (unchanged, no grain, no gradients), 3 px ink outlines, hard grey offset shadows.
- The static full-body presenter at the far left (same character), hidden in the full-frame chapter, the pipeline
  chapter and the last two chapters.
- A hard cut on every chapter, the mono chapter tag `// 07 — new phone`, and the same karaoke captions with
  light-blue selection boxes on keywords.
- The numbered layer stack (base row black, newest row terracotta, slides in from the right with a dust puff),
  red rubber stamps on every failure, salmon halos, `K.say` dark bubbles, the build-on-every-stressed-word density
  (`K.bumpAround`, `K.emphasize`, streams, flickers), the 4-stage conveyor for fix 2, one full-frame blow-up into a
  huge red number, the halftone "months later" wipe to the full checked stack, and the Friday callback ending.

## What changes for the emotional tone
| layer | base (tech explainer) | emotional variant |
|---|---|---|
| subject | a product rebuilt layer by layer | an everyday object (a microchip) and everything that has to work for it to bring a lost dog home |
| protagonist | screen-faced mascot (the product) | **one fictional dog, Maple** (`K.dog`), on screen in 10 of 14 chapters, so the stakes have a face |
| script formula | "Then X broke → So you add … → Now …", absurd gags (tyres, sold twice) | the same ladder, but each "Then" is a small, ordinary way she could fail to come home; no jokes, no gags |
| numbers | fictional dashboard numbers | 2 sourced numbers spoken plainly (53 shelters, 58%), one sourced ranking shown as bars without values |
| small object | none | **her collar tag**: left behind on the fence in c02, found in the drawer in c14, clipped back on in the last second |
| length / pace | 20 chapters, 131 s, ~200 WPM | 14 chapters, 95.8 s, ~170 WPM |
| delivery | am_puck 1.24, fast | **af_heart 1.0** (a warmer female voice that fits the presenter), gap 0.3 s, longer pauses before the recap (0.55 s) and the callback (0.6 s) |
| sound | no music, UI SFX at `sfx_db -4` | the same UI SFX, softer (`sfx_db -9`, gains 0.1–0.25), plus a **synthesized felt-piano bed** (`tools/bed.py`, F major, 64 bpm) under the voice at −22 dB, ducked 6 dB; it rises 3.5 dB on the callback and ends on one rolled chord on the stamp, ringing alone |
| palette accents | brand blue + terracotta | the same plus a muted **teal** (collar, leash, lookup, calendar headers), honey/cream for the dog, brass for the tag; red stays reserved for failures |
| ending | callback failure, red stamp "ONE WRONG DIGIT" | callback **success**: the first failure (the tag left behind) returns as the old tag in a drawer with the old phone number struck out; the phone rings; a **green** stamp "SHE'S HOME" with the sub "two years · forty miles · one number"; Maple comes in and the old tag flies back onto her collar |
| hold | stamp at the very end | about 2.9 s of hold after the last word: stamp, then her entrance, then the tag, over the piano chord alone |

Earned, not manipulative: no illness or injury, no crying, no sad music under failures (the bed stays in a warm major
key throughout and only lifts at the end); the emotion comes from the object (the tag) and the gesture (it goes back
on her collar).

## Script formula (emotional)
1. Hook (0–8 %): "Everyone thinks [object] does [the hopeful thing]. It's [plain physical description]. That's it."
2. Introduce the one character by name with the first small object ("This is Maple. Her tag has your phone number…").
3. 4–5 failure → fix pairs, each failure a quiet, ordinary miss (left behind, points to nobody, disconnected,
   silent, which one?). Failure stamps stay red and short.
4. One sourced statistic as the full-frame blow-up, spoken plainly.
5. Recap as adjectives, then "Then one Friday, [time] later, [the good version of the first failure] … And your
   phone rings." Last stamp warm, then a silent gesture with the first object.

## Kit additions (all in `kit-warm.js` unless noted)
- `K.leashOn(g)` + `K.presenter(p, x, y, s, { prop: 'leash' })` (**kit.js edit**): the presenter holds a teal leash
  instead of the clipboard.
- `K.dog(p, x, y, s, o)`: Maple, an original sitting terrier mix (honey coat, cream bib, one perked and one floppy ear,
  white blaze, teal collar, brass tag), ~280 px tall at s = 1. Idle breathing, tail sway and blinks are built in;
  `d.wag(t0, t1, amp, hz)`, `d.perk`, `d.relax`, `d.droop`, `d.tilt`, `d.happy`, `d.calm`, `d.blink`, `d.hop`,
  `d.tagOff`, `d.tagOn`, `d.swingTag`; options `tag:false`, `flip`, `tongue`, `t0/t1` (blink window).
- `K.collarProp` (a loose collar with its tag, swinging from a nail), `K.rice`, `K.chip` (glass capsule, ferrite rod,
  copper coil that lights with `.lit(t)`), `K.chipMini` (dot-matrix glyph), `K.scanner` (loop-head reader; `up:true`
  puts the body above the loop so the loop hovers over a dog's back; `.disp`, `.beam(t0, t1, weak)`; `dusty`,
  `fill`, `label`), `K.paw`, `K.shelter`, `K.house`, `K.phone` (`.screen`, `.ring(t, dur)`), `K.drawer`
  (`.tag`, `.drawer`, `.tagAt`), `K.fence`, `K.battery`, `K.satellite`, `K.recordCard` (registry record with
  `.vals` and `.rowY`).
- `K.window(..., { logo: false })` (**kit.js edit**): draws a paw instead of the sample's bakery logo.
- `K.say` measures its text in `o.font` (**kit.js fix**): mono bubbles (chip numbers) no longer overflow.
- `K.emphasize(g, t, { win, halo })` (**kit.js edit**): `win` widens the look-back for the newest element (default 5 s;
  this film uses 9 s for its longer chapters), and `halo: <fill>` adds a soft pulse behind the thumped element.
- `scene.js` sets `K.BUMP.amp = 84` (base 72) and runs the emphasis loop on 4+ letter words at ≥ 0.45 s spacing,
  with halos on keywords (salmon and teal alternating).
- c03 uses the base kit's `K.terminal` as a "MICROCHIP" card that types `id 899 000 417 202 365 / battery none ✗ /
  GPS none ✗`, which mirrors the base's DNS terminal beat.
- Tools in `tools/`: `bed.py` (felt-piano bed), `yavg.py` (signalstats brightness-dip check),
  `motion_by_chapter.py` (the analyzer's motion measure per chapter).
- Scene helper `lens(p, cx, cy, r, tx, ty)` in `scene.js`: a round magnifier inset with a dashed leader (chip under
  the skin, the tag up close).
- Colour tokens added to `K.C`: `coat`, `coatS`, `cream`, `teal`, `tealL`, `brass`, `copper`, `glass`, `warmGreen`,
  `sage`.

## Sound recipe
`sound.json`: `{"preset": "none", "music_file": "audio/bed.wav", "music_under_voice_db": -22, "duck_db": 6,
"sfx_db": -9, "lufs": -14.2}`. Run `python -I tools/bed.py <dir>` after TTS (it reads `data/vo.json` for the
callback start and the stamp time), then `make.sh <dir> --skip-tts`. The bed is a numpy felt piano: inharmonic
partials with pitch-dependent decay, a 12 ms attack, a muffled low-pass and a short dark plate.

## Gates (measured on the final render)
| gate (brief) | target | measured | |
|---|---|---|---|
| duration | 70–100 s | 95.8 s | ✓ |
| analyzer hard cuts | 0 | 0 (max ffmpeg scene score 0.277, at the halftone) | ✓ |
| scene changes | full-frame moments only | 1.25/min = 2: the 58% blow-up (36.4 s) and the halftone (79 s) | ✓ |
| WPM | 160–190 | 168.4 | ✓ |
| build events/min (`events.py`, > 5) | 60–100 | 88.9 | ✓ |
| motion mean | ≥ 4 | 4.12 (p90 7.47) | ✓ |
| colourfulness | 15–30 | 21.8 | ✓ |
| brightness | 0.85–0.92 | 0.910 | ✓ |
| loudness | −14.2 LUFS ± 1 | −14.2 | ✓ |
| YAVG dips | explain each | 0 flagged; min 31 at 79.5 s is the halftone wipe (designed, changes smoothly) | ✓ |
| hold_frac | — | 0.094 (base 0.042) | slower read |

Bed levels in the final mix: about −22 dB under the voice while speaking, −17 dB in the gaps, +6.5 dB from the
callback, and the closing chord alone over the last 2.9 s. Compare sheet: `out/qa/compare.jpg` (10 matched beats).

**How motion reached 4.0** (it is the hard gate at ~170 WPM): the analyzer squashes 9:16 frames to 160×90 at 6 fps,
so only large-area change counts. First render 3.42. A stronger idle on the dog did almost nothing (3.46). Emphasis
on every 4+ letter word at ≥ 0.45 s spacing with a 9 s look-back window, plus a soft halo behind the thumped element
on keywords: 3.60. One named-moment push-in and release per chapter (`K.camTo` 1.06–1.12 on the focal event, as the
base does in 7 chapters; no drift): 3.87. Bumps at 84 px (base 72), a reveal zoom on the full-frame chapter and two
more push-ins: 4.01. The c03 terminal card: 4.12. `tools/motion_by_chapter.py` reproduces the analyzer's measure
per chapter, so you can see which chapters fall short.

## Gotchas
- `X.word` matches by prefix: `wd(id, 'it', 1)` hit "it's"/"on it" before "That's it"; count occurrences or use `wx`.
- `K.type` (via `X.typeOn`) empties the element at build time. To strike out and retype a value, save the text and
  restore it right after the `K.type` call.
- `K.still` must be set **before** later entrances in the same chapter, or earlier bumps already jostle the piece
  (the registry cylinders wandered).
- A pill whose text changes later overflows (the width is measured once); swap two pills instead.
- `K.say` used Inter widths for mono strings (fixed in this copy's kit.js).
- Stamps centred at x 560 at 120 px+ reach the presenter; centre them at x ≈ 615 and keep them ≤ 112 px for 11–12
  characters. Place each stamp clear of the dog's face (it is the one face that matters here): NO BEEP and
  UNREGISTERED sit high, over the scanner or shelter.
- Push-ins on a set that includes the small left stack crop it unless the `svgOrigin` x sits at the stack's left edge.
- A loud halftone wipe still passes the YAVG dip check because the dot radius grows with √progress (linear luminance).
- The analyzer's motion measure ignores outline-level life (breathing, tail wags); see "How motion reached 4.0".
- Brief lead figures that were not used: the 52.2% vs 21.9% (dogs) and 38.5% vs 1.8% (cats) return rates could not
  be checked against the paper's full text (403); see FACTS.md.
- Bash heredocs with Python triple quotes fail on this machine; write patch scripts with the Write tool.

# SAMPLE — The Dark Mine (explainer-whatif-survival-2d) · kit #94

`out/survival2d-mine.mp4` (full mix) · `out/survival2d-mine_nomusic.mp4` (voice + sfx) · `out/survival2d-mine.srt` ·
`out/cover.jpg` · `out/qa/` (2 fps sweeps, metrics.json, gates.json, yavg.json, bands.json, compare.jpg, whisper.txt).
1080×1920, 30 fps, 155.43 s. Reference: @what_if_survival `DfUvZx9Bl_f` (148.4 s), analysed locally for reference only.

## Build
- Script: 45 lines, 430 words (`vo/script.json`), Kokoro `am_michael` at 1.25 (≈ 212 WPM while speaking; the first
  draft at 1.1 ran 211 s and was cut to 430 words).
- `tools/build.py` → karaoke captions (2-4 words, Poppins ExtraBold, the spoken word yellow), world, index, SRT.
- `assets/lib/sv-kit.js` (inked primitives, paper grain, hatching, hero, the dead, tags, title, cards, stamps,
  checklist, gauge, meter, vote) + `assets/lib/film.js` (49 shots, hard cuts on word onsets).
- Iterated lock-free in the browser (`tools/devserve.py` + `tools/dbg.html`): three contact-sheet passes (the lower
  frame was empty rock → the world underneath; characters too small → closer cameras), three analyzer-emulation passes
  (below), the shot-time export for the score.
- `tools/score.py`: voice, ambience (wind, mine air, drips, the chamber fan that stops on Day 14), ~120 foley/UI
  events keyed to words, an original 80 BPM D-minor bed (full mix only); stems levelled to the voice; both mixes
  −14 LUFS.
- Snapshots: 50 stills (every shot) before the first render; two camera nudges after them (Day 1 and Day 14 keep the
  hero's face out of the caption band).
- **Renders: 3** (delivery preset, 2 workers, ~20 min each; the grain makes the encode heavy; render 3 approved by the user, see below). An earlier attempt was
  killed by the 9 Nov pause before it wrote anything; it left `out/.survival2d-mine_master.hf-transaction-z6DAql`
  (not removed by hand). Render 1 passed every gate except cuts/min (14.67: our emulation had scored downscaled frames)
  and the old dip check (8 flags, all hard cuts to darker sets, which the corrected check ignores). Render 2 adds a
  0.26 s dissolve on ten cuts between similar shots, frames Day 14 and the breathe map better: every gate passes.

## Render 3 (approved by the user): the black-band fix
The review of render 2 found solid black bands at the bottom of the zoomed-out section shots (up to 524 px; 25.2-27.1,
36.2-38.1, 57.9-59.6, 84.6-88.0, 107.4-114.1, 125.2-127.2 s): the rock in `mountain()` was drawn to a fixed depth (y 2900)
and the pulled-back cameras looked past it. Fix: `K.strata(…, { floor: true })` continues the deepest band 12,000 px down
and 6,000 px sideways with its own speckles (a separate seed), used in `mountain()` and `under()`; everything above the
old bottom edge, the blue water line included, is pixel-identical. Checked with 12 snapshots (`scratch/snap_fix/`, a mid
frame and the worst frame of each interval: 0 px of band) before rendering. `tools/qa.py` now scans every frame at
10 fps for solid black rows touching the top or bottom edge (`out/qa/bands.json`): render 3 has no band ≥ 24 px (the
largest is 2 px at the top edge for 0.3 s at 29.7 s). Render 3 took 1,224 s. Masters kept: `out/survival2d-mine_master_r2.mp4`
(render 2) and `out/survival2d-mine_master.mp4` (render 3); the render-1 master copy in scratch was deleted earlier to
save space.

## Gates
| gate | reference | ours | target | pass |
|---|---|---|---|---|
| length | 148.35 s | 155.43 s (+4.8 %) | ±15 % | ✓ |
| cuts / min (analyzer) | 10.52 | 10.81 (render 1: 14.67; renders 2 and 3: 10.81) | ±20 % | ✓ |
| scene changes / min | 19.01 | 16.99 | ±20 % | ✓ |
| WPM | 161.8 | 162.9 | ±20 % | ✓ |
| first word · first frame | 0.0 s · tag | 0.16 s · the 40 DEAD tag on frame 1 | ≤ 0.4 s | ✓ |
| loudness full · no-music | −14.1 LUFS | -14.0 / -2.0 dBTP · -14.0 / -2.0 dBTP | −14 ±1, TP ≤ −1 | ✓ |
| voice over everything else · over music | ~15-20 dB | 15.9 dB · 19.6 dB | ≥ 10 dB | ✓ |
| Whisper `small` | — | 45/45 lines ≥ 0.8, worst 0.86 ("plan": the three one-word items) | every line | ✓ |
| captions in the safe area | y ≈ 1695 | y 1220-1300; no face under a caption (Day 14: the hat brim touches) | 168-1300 | ✓ |
| edge black bands (10 fps scan) | — | 0 frames with a band ≥ 24 px; worst 2 px | none ≥ 24 px | ✓ |
| unplanned black / flash frames | — | 0 | 0 | ✓ |
| streams · frame count | — | video 155.434 s / audio 155.425 s; both files 4663 frames | match | ✓ |
| brightness · colourfulness · motion | 0.502 · 46.1 · 7.29 | 0.41 · 37.8 · 5.28 | look | — |

## Tuning the cut and scene-change rates before rendering (analyzer emulation)
| pass | change | cuts/min | scene changes/min |
|---|---|---|---|
| 1 | first full cut | 8.49 | 14.28 |
| 2 | close-ups of the tank, the batteries, the first-aid box, the door; a blue-hour dam; a glare insert; a tighter portal | 8.49 | 16.60 |
| 3 | contrast at near-threshold cuts (inside shot, Day 5 undimmed, the map zoom, the pull-out start, a darker explainer) | 10.81 (emulated at 270×480) | 17.37 |
| render 1 | measured by the analyzer on the delivery | **14.67** | 16.99 |
| render 2 | ten 0.26 s dissolves (lamp off, the green light, the hideout, fixing it, food, the fan, the line, the dam, RULE 1, the call); the emulation now scores full-size frames | **10.81** | **16.99** |
| render 3 | `floor: true` under the section views (no other change) | **10.81** | **16.99** |
Gates: 10.52 ±20 % (8.4-12.6) and 19.01 ±20 % (15.2-22.8).

## Source → ours
| reference | ours |
|---|---|
| 40 DEAD over a pier chase at sunset; a jump into the sea | 40 DEAD over a mine-yard chase at sunset; a run into the adit |
| the dead can't swim: decay gas makes them float, they can't dive | the dead can't see in the dark: a dead cornea clouds over within hours (magnifier + a lens POV) |
| swim down, 10 M, 20 M | lamp off, hand on the rail, down a zig-zag decline, −100 M, −200 M |
| a seabed lab, a moon pool held by air pressure | a refuge chamber built for trapped miners, an airlock + positive pressure |
| five inventory cards | five inventory cards (600 ration packs, rock drip, stream turbine + batteries, medkit, pickaxe) |
| air via a hose from a buoy; the pump runs on diesel brought by a boat | air via one shaft; the fan runs on the line from an unmanned dam |
| RULE 1 never go up (decompression), 17 h in a back room | RULE 1 never go up by day (dark-adapted eyes are dazzled), only at night: 300 m of ladder, 2 hours |
| DAY 1/5/10, the dead floating above a porthole | DAY 1/5/10 on a camera feed, the dead ringed round the shaft top staring down |
| DAY 14 the boat doesn't come; YOUR PLAN AIR → DIESEL; 6 days | DAY 14 the fan stops (the vent ribbon drops); AIR → THE DAM; AIR: 6 DAYS |
| a family on a boat with full tanks; call vs go alone 600 m to the fuel dock | a family at the dam switching lines off; call vs 2 h of ladder + 600 m to open a capped shaft so the mine breathes by itself |
Visible upgrades: the world underneath in every exterior (the mine's old level runs under the yard), a POV lens and a
glare insert for the rule, the second-shaft natural-ventilation idea for the solo option, captions inside the safe area.

## What reads well
- The format's grammar lands: tag on frame 1, the two-line title, a label on nearly every sentence, the cream cards
  line by line, two stamps, the checklist turning into the dependency, the gauge, the route map, the vote card.
- The mine's palette steps (sunset → brown section → steel interior → cream cards → green monitor → night) keep it
  varied; the shaft-top ring of the dead is the creepiest still.
- Karaoke captions with the outline read on every background.

## What is weaker
- Less lush than the reference's paintings: flat fills and procedural rock instead of painted light; long stretches of
  plain strata in the lower third of section views.
- The hero has one face (dots + brows) and few poses; the reference's hero acts more.
- Some cards cover the action (the reference does this too) and a few close-ups are static.
- 155.4 s against 148.4 (+4.8 %): the script carries ~30 more words.
- Day 14: the hat brim touches the top of the caption band; the breathe map crops the YOU box slightly.
- The floor fix fills the old black with more plain rock, so the pulled-back section views are a little darker and
  emptier at the bottom than the closer shots (brightness 0.41 against the reference's 0.50).

## Deviations (deliberate)
- Captions at y 1258 (the reference: y ≈ 1695, under the 9:16 safe line); the action band sits at y 300-1180.
- An original 80 BPM bed in the full mix (the reference's bed is a soft continuous pad).

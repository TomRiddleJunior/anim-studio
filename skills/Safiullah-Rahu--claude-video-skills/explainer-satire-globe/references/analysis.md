# Design rationale and metrics — samples/satire-globe ("Earth OS 26.10", 28 Oct 2026)

## Why this form
- The request combined satire, real screenshots, a 3D globe, dotted orbs and futuristic UI. Treating the planet as an
  operating system makes the UI *the joke* rather than decoration: a ticket card, a status chip and a release note
  are a deadpan register that can carry real facts without editorialising.
- One continuous flight (no hard cuts) keeps six unrelated stories in one world. The globe is the home stage; every
  story is a stop on a route, and the arc from the previous hotspot carries the eye (story.md "a flight through one
  world").
- Dots -> texture -> patch inside each dive gives the three asked-for looks (dotted orb, real 3D world map, globe) one
  job each: the orb is "the system", the texture is "the planet", the patch is "the place".
- The left/right hold layout repeats on purpose (a ticket template). Variety is rationed per ticket: a chip cycle
  (Hormuz), a quote (Alaska, Serbia), a progress bar (Israel), a chip flip (Brazil), a user row (Venezuela).

## What each number is for
| choice | value | reason |
|---|---|---|
| fly / dive / pull-out | 1.1 / 1.1 / 0.9 s | a dive per ticket inside 2 bars at 120 BPM; UI lands on bar 2 |
| dive altitude | 2.0 -> 0.17 -> 0.145 (log) | constant perceived zoom speed; 0.145 shows ~9 deg of arc across 1920 px, about native 240 px/deg |
| hold offset | ox -440, oy -230 | hotspot at (520, 310): ping visible above the left column, right column free for evidence |
| patch | 17 deg lat x 17/cos(lat) deg lon, +2.2 deg east, 4096 px square | equal ground size at any latitude; extra imagery where the offset frame looks |
| dots | Fibonacci 42,000 -> 12,355 land | ~12 px spacing at orb distance; 5 px dots read as a dotted map, not noise |
| pings | disc 8 px, rings 10-68 px, constant on screen | readable at orb and dive distances alike; rings drawn from t (period 1.33 s) |
| UI | panels 0.9 alpha, 1.5 px stroke, 28 px floor | legible over bright desert/snow imagery without glass or blur |
| accent | #FF6B1A on 4 roles only | status reads instantly; nothing else competes |
| chip states | >= 1.15 s each | craft floor for 3-word lines |
| release notes | <= 12 words, 48 px, held to d-0.9 | 0.5 s + 0.3 s a word before exits |

## Measured on the render (out/qa/metrics.json)
- duration 72.0 s; cuts 0; scene changes 10.0/min; median scene 5.67 s.
- motion mean 5.69, p90 16.1; motion deciles 2.6 / 5.7 / 11.0 / 9.7 / 7.6 / 4.4 / 5.0 / 6.8 / 3.6 / 0.7 (boot calm,
  peak in the long Hormuz -> Alaska -> Israel hops, quiet board and end card).
- hold fraction 0.106 (the board read and the end-card hold); flat_mean 0.43, animated_frac 0.36 (imagery is textured).
- colourfulness 36.3, saturation 0.60, brightness 0.32, dark-frame fraction 0.56 (orb shots on the navy ground).
- palette: #051620 28 % / #0B1C2B 22 % / #35331C 12 % / #9E8875 9 % / #5D5B53 9 % / #DDE2E8 8 % / #182D46 8 % /
  #15417E 5 %.
- audio: -14.0 LUFS integrated, -11.6 short-term max, -1.4 dBTP true peak, LRA 4.1 LU, no clipping, no silence.
- hyperframes check: 0 findings. Render: ~155 MB H.264 18 Mbps at -q delivery, about 2 min on an Intel iGPU.

## Review notes that shaped the kit
- Frame 0 read as a star field (banned default) -> tight swirling scatter shell.
- Evidence push-ins cropped headlines -> origin at the key line's left edge, push 1.04.
- Board arcs became long chords across the frame -> arcs only during flights.
- Monospace fell back to Courier because template-only font names are not embedded -> literal font rules in index.html.
- Remaining weak spots: the Hormuz key sentence is ~19 px (screenshot body text); Alaska is on the far limb of the
  board view; the boot shows only the pings on the visible hemisphere.

## Re-using it for another week
1. New FACTS.md, 5-7 stories, captures, tools/hotspots.json.
2. make_patches.py (tiles you need), make_evidence.py (edit CARDS boxes per page), paste patch bounds into
   globe.html, edit the TICKETS table in build_scenes.py, run it, adjust the boot/board/end copy.
3. check -> snapshot --review -> REVIEW.md -> render -> analyze; compare against section 2 of SKILL.md.

## v2 — narrated, with the paper-dossier and data-card layers (129 s)
Request: "add Paper-dossier editorial · English edition and Investigative data cards to this video, make it stunning",
then "also add narration".

### Why paper ON the planet
- Intercutting three styles (globe → desk → card) would read as three films. Laying the dossier on the terrain makes
  them one world: the NASA patch *is* the desk, so the place stays on screen while its paperwork is read. The dossier
  skill's desk of torn posters becomes real geography; its whip pans become pans across a region.
- The data-cards system is used as a document type on that desk (cream ruled sheet, chrome, source footer, one orange
  subject per card), not as a separate full-frame world, so the camera grammar never changes.
- Stamps carry the OS joke into paper: the status word is stamped on a document and the OS chip rolls to the same word
  80 ms later, so the two registers rhyme.
- The v1 ticket template (left card / right evidence ×6) was the main monotony; v2 gives each ticket its own device
  (index card + slip, names card + quote slip, hemicycle, 51 % + struck age, votes bars + slip, months cells).

### What each number is for
| choice | value | reason |
|---|---|---|
| reference altitude | 0.145 → 206 px/deg | at s = 1 the 240 px/deg patch is ~1:1; whips and pushes stay within s 0.9–1.22 so terrain stays sharp |
| desk oy | +46 px | console strips own the top 136 px; paper frames centre in the free 136–1080 band |
| first landing | s 0.9–1.0 on the first document | ping + tag + document in one frame; the place is named as it lands |
| whip | 0.37 s expo.inOut + 3.5 % overshoot, ±1.6° roll, 0.15 s settle | the dossier skill's 11 + 4 frame whip, adapted to a camera over a sphere |
| breathing | +1.1 %/s scale, +0.05°/s roll | the dossier's "no frozen hold" rule; the data-card holds still read as still |
| shutter | 200° (0.555 frame) | matches HyperFrames' recommended smear; globe 2–24 samples, paper SVG blur on the same vector |
| voice | bm_george 1.22, gaps 0.36–0.85 s | 146 s at 1.08 dragged; 129 s at 1.22 keeps 153 wpm while speaking with stamps on beats |
| flat map | alt 9.7, ox +300, 1.7 s power3.inOut | 1,120 px map beside a 560 px ledger; all six pings visible at once |

### Measured (sample)
See SKILL.md §2. v1 for comparison: 72 s, 0 cuts, 10.0 scene changes/min, motion 5.69, hold 0.106, colourfulness
36.3, −14.0 LUFS.

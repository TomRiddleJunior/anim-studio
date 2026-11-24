# Engine changes

Additive, backward-compatible changes only. Each entry lists what changed and how it was verified. Edit engine
files only while holding `map-films/.engine-edit-lock` (mkdir … rmdir).

## 2026-10-31 · point-roberts agent

All four are opt-in: existing stories (Diomede) don't use them and render identically.

1. **`clock` event** (`props.js` `MF.Clock`, `film.js` compile case). A paper clock face with a strip of tape. The minute
   hand sweeps `minutes` (default 40) from `sweepAt` (KEY) to `sweepTo` (KEY), or over `sweepDur` s. The swept sector
   fills with red marker, and a torn strip tucked under the face counts up (`unit`, default `'MIN'`, `usize` 40).
   Other fields: `r` (face radius, 112), `startMin` (where the hands start, 0 = 12:00), and the usual `place`/`screen`,
   `off`, `rot`, `out`. SFX: slide on the pop and tick during the sweep.
2. **`passport` event** (`props.js` `MF.Passport`). A closed navy booklet (`cover`, `title` 'PASSPORT', generic
   embossed star, no real seal) pops in. On `flipAt` (KEY) the cover swings open over the spine, and the spread
   recentres. `stamps: [{text, sub, color, at?}]` (up to 4, in a 2 × 2 grid) thump on, each at its own `at` KEY or
   `stampGap` s apart (0.3) once the cover is open. Other fields: `header` (typed line on the page), `w`/`h`
   (236 × 326), `flipDur` (0.5). SFX: slide on the pop, page on the flip, and a soft impact per stamp (`stampGain`,
   default −13 dB under the impact level; it does not shake the camera).
3. **North/south `split`** (`film.js` `Split.drawNS`). This is used when the event has `north: {color, alpha}` and
   `south: {…}` instead of `west`/`east`, for a border that runs east–west, like the 49th parallel.
   - The `line` runs west → east. It may start off the top of the frame, for example coming down 141°W:
     - north is the line closed over the top;
     - south is the line closed under the bottom and around the left, so Alaska falls on the south side.
   - The reveal grows from the line.
   - Labels use `side: 'north'|'south'`, with `x` (the screen x, default the centre) and `dy` (the distance from the
     line, 110 / 150 px on the reel), plus the existing `at`, `out` and `size`.
   - The west/east path is unchanged.
4. **Tracker counters** (`props.js` `MF.Tracker`). A timer row with `fmt: 'n'` shows a plain integer (plus an optional
   `unit`) instead of h:mm, for example `{label: 'YEARS', timer: {from: 0, value: 39, at, end, fmt: 'n'}}`. There is also
   a new card field, `vsize` (the value font size, default 42), for long values.

Verified by rendering Diomede 16:9 stills at t = 20.8 s (calendar flip), 31.9 s (split, tracker, swim path) and 38.9 s
(end card on the paper map) before and after the change, with
`python -I point-roberts/tools/diomede_check.py render before|after` then `compare before after`. They are
pixel-identical (max diff 0).

## 2026-10-31 · bir-tawil agent

All opt-in: a story that doesn't use these fields renders exactly as before.

1. **Second marker colour** (`ink.js` `MF.inkSet`, `MF.inkPaths(…, ink)`, `film.js`). `circle`, `write`, `stroke`, `border`
   and `measure` take an optional `ink: '#hex'` (or `{core, under, hi}`). The under-stroke is the colour at 45 %
   brightness and the highlight is 70 % towards white at 30 % alpha. Without `ink` the red marker is unchanged.
2. **`area` event** (`film.js` `Area`). A tinted map region from `coords` ([[lon, lat]…]) or a `line`, fading in at `at`
   over `fade` (0.35 s) and out at `out` (0.3 s). Fields: `color`, `alpha` (0.3), `hatch` (spacing in px: 45° hatching in
   screen space, clipped to the region), `hatchColor`, `hatchAlpha` (0.6), `hatchW` (3), `edge` (colour) + `edgeW`,
   `layer` (2: above split tints, under marker). SFX: `highlight` (or `sfx: '<kit name>' | false`).
3. **`pricetag` event** (`props.js` `MF.PriceTag`). A pointed manila tag with a punched hole, a colour band and a string.
   `front` / `back`: {title, big, small, color, band, bigSize, smallSize, titleSize}. On `flipAt` (KEY) it turns over
   about its vertical axis (`flipDur` 0.5 s) and shows the back, with the point mirrored. Other fields: `w` (330), `h` (196),
   `color`, plus the usual `place`/`screen`, `off`, `rot`, `scale`, `out`. SFX: slide on the pop, page on the flip.
4. **`count` thousands separator** (`props.js` `MF.CountTag.fmt`). `sep: ','` groups the integer part ("2,060 KM²").
5. **`split` holes** (`film.js` `Split.clipHoles`). `holes: [[[lon, lat]…], …]` are regions that both tints leave
   out, for example an unclaimed pocket on the line. Works for west/east and north/south splits.

Verified by rendering Diomede stills before and after, with `python -I bir-tawil/tools/diomede_check.py render
before|after --times 2.5,20.8,31.9,38.9` (16:9) and `--times 31.3 --fmt 9x16`, then `compare before after`. All five are
pixel-identical (max diff 0).
6. **HUD shade** (`film.js` `hud`, bir-tawil agent, second pass). A story-level `hud: {shade: 0–1}` darkens a band
   behind the bottom HUD row on satellite shots: 120 px in 16:9 and 380 px on the reel, at the satellite's alpha. The
   band is a multiply gradient, warm so that sand turns brown rather than olive. It also gives the EOX credit a small drop
   shadow, so the lat/long and the credit stay legible over bright imagery such as desert or snow. Off by default.
   Verified with the same five Diomede stills after each revision (`… render after2|after3|after4`,
   `compare before after4`), all pixel-identical.
7. **README** (bir-tawil agent): a short table "Added for `bir-tawil`" under the event types lists entries 1–6.
   Documentation only, so no render check was needed.

/* Point Roberts: Four Borders to School — story for the map-films engine (see engine/README.md).
   Every time is a word key; every per-format value is {h: <16:9>, v: <9:16>}.
   Facts (SCRIPTS.md B, Wikipedia "Point Roberts, Washington", checked 2026-10-31): 1846 Oregon Treaty → 49th parallel;
   drive through Canada ≈ 40 km; the school is K–3, older kids ride ≈ 40 min through B.C. to Blaine, four crossings a
   round trip; "the best gated community" quote; water deal with the Greater Vancouver Water District, 28 Aug 1987. */
const US = '#2F5D8A', CA = '#B8352A';
const B49 = 49.002;   // the surveyed boundary at Point Roberts (the suburb/forest edge in the 2016 imagery), not 49.000

// Alaska–Canada land border (world-atlas 10m, the arc the two countries share, Douglas-Peucker 0.02°): 141°W, then the panhandle
const ALASKA = [[-141.0044, 69.651], [-140.9936, 60.3047], [-140.5328, 60.2186], [-140.4248, 60.2929], [-139.9676, 60.1882], [-139.6796, 60.3267], [-139.0784, 60.3402], [-139.1828, 60.0734], [-139.0028, 59.9771], [-138.6968, 59.8944], [-138.5996, 59.7542], [-137.6096, 59.2392], [-137.4836, 58.9927], [-137.5088, 58.9403], [-137.4872, 58.8998], [-136.8392, 59.148], [-136.5692, 59.1717], [-136.4648, 59.2882], [-136.4684, 59.4621], [-136.3208, 59.4587], [-136.2452, 59.528], [-136.3496, 59.5921], [-135.464, 59.7897], [-135.0176, 59.5601], [-135.0248, 59.4773], [-135.0968, 59.4182], [-134.9923, 59.3811], [-135.0176, 59.3355], [-134.9815, 59.2966], [-134.6935, 59.2358], [-134.6107, 59.1447], [-134.4523, 59.0974], [-134.3875, 59.0366], [-134.3983, 58.9741], [-134.3299, 58.9623], [-134.3155, 58.9032], [-134.2219, 58.8424], [-133.8295, 58.7175], [-133.6279, 58.5469], [-133.3939, 58.4034], [-133.4299, 58.3713], [-133.4155, 58.3308], [-133.1671, 58.1467], [-133.0735, 58.0083], [-132.2311, 57.196], [-132.3427, 57.0812], [-132.0331, 57.0289], [-132.1087, 56.8583], [-131.8711, 56.7942], [-131.8891, 56.7486], [-131.8387, 56.6827], [-131.8243, 56.5932], [-131.5615, 56.5932], [-131.1007, 56.4075], [-130.7587, 56.345], [-130.6471, 56.2623], [-130.4707, 56.2251], [-130.4023, 56.1221], [-130.0927, 56.1018], [-130.0279, 56.0242], [-130.0207, 55.9077]];
// …down Portland Canal, west along Dixon Entrance, 10-20 km off the outer coast of Haida Gwaii and Vancouver Island (open sea has
// no US-Canada line; hugging the coast keeps the tint edge on the coastline, not on a made-up line at sea), through Juan de Fuca, Haro Strait and Boundary Pass, up the Strait of Georgia to the 49th parallel
const SEA = [[-130.07, 55.62], [-130.17, 55.3], [-130.38, 55.02], [-130.64, 54.76], [-132.68, 54.66], [-133.3, 54.2],
  [-133.25, 53.5], [-132.6, 52.8], [-131.4, 51.95], [-128.65, 50.85], [-128.2, 50.15], [-126.75, 49.35], [-125.95, 49.0],
  [-125.3, 48.7], [-124.75, 48.49], [-124.0, 48.28], [-123.32, 48.22],
  [-123.22, 48.32], [-123.21, 48.5], [-123.25, 48.67], [-123.1, 48.75], [-123.0, 48.79], [-123.12, 48.86], [-123.322, B49]];

// the school run / the drive: Point Roberts → Tyee Dr crossing → 56 St → Hwy 17 → Hwy 99 → Peace Arch → Blaine
// (traced on the z13 mosaic; ≈ 38 km of polyline, the article's "about 40 km")
const ROUTE = [[-123.066, 48.983], [-123.0685, 48.993], [-123.0685, B49], [-123.0685, 49.037], [-123.036, 49.0645],
  [-123.021, 49.090], [-122.989, 49.0918], [-122.934, 49.0918], [-122.895, 49.0915], [-122.857, 49.0896],
  [-122.823, 49.079], [-122.796, 49.057], [-122.774, 49.037], [-122.760, 49.0155], [-122.7567, B49], [-122.749, 48.9936]];

MF.story({
  slug: 'point-roberts',
  title: 'Point Roberts: Four Borders to School',
  lon0: -123,                        // projection centre: the antimeridian cut lands at 57°E, far from the story

  sat: {
    threshold: 5,                    // (unused here: point-roberts/tools/fetch_tiles.py builds the mosaics with a PNW mask)
    levels: [
      { z: 9, center: [-123.0, 49.0], km: [600, 600] },
      { z: 11, center: [-122.95, 49.05], km: [140, 120], landOnly: true, padKm: 6 },
      { z: 13, center: [-122.93, 49.02], km: [46, 28], landOnly: true, padKm: 1.5 },
    ],
  },

  sound: {
    bpm: 90,
    sections: [{ at: 'START', energy: 1 }, { at: 'out', energy: 2 }, { at: '1987', energy: 3 }, { at: 'Bought', energy: 2 }],
    hit: 'borders',                  // low hit as the punchline is written
  },

  places: {
    pr: [-123.055, 48.987],          // Point Roberts (middle of the peninsula south of the line)
    tsaw: [-123.075, 49.028],        // Tsawwassen, Delta, B.C.
    blaine: [-122.749, 48.993],
    prCross: [-123.0685, B49],       // Point Roberts–Boundary Bay crossing (Tyee Dr / 56 St)
    peaceArch: [-122.7567, B49],     // Peace Arch / Douglas crossing
    route: { h: [-122.905, 49.036], v: [-122.915, 49.04] },
    west: { h: [-119.0, 48.6], v: [-119.6, 48.4] },
  },

  lines: {
    border49: { coords: [[-141.0, 85]].concat(ALASKA, SEA, [[-60, B49]]) },     // the real US–Canada line, west → east
    treaty49: { coords: [[-114.06, B49], [-123.322, B49]] },                   // 1846: the Rockies → the Strait of Georgia
    neck: { coords: [[-123.096, B49], [-123.027, B49]] },                      // across the Tsawwassen peninsula
    route: { coords: ROUTE },
  },

  paper: {
    colors: { Canada: 0, 'United States of America': 1 },
    labels: [
      { text: 'Canada', at: [-116.2, 51.0], kind: 'country', size: 16, z: [5.6, 7.9] },
      { text: 'United States', at: [-115.6, 46.2], kind: 'country', size: 15, z: [5.6, 7.9] },
      { text: 'British Columbia', at: [-122.6, 51.4], kind: 'country', size: 12, z: [5.6, 7.9] },
      { text: 'Alberta', at: [-112.6, 52.3], kind: 'country', size: 11, z: [5.6, 7.9] },
      { text: 'Washington', at: [-120.4, 47.4], kind: 'country', size: 12, z: [5.6, 7.9] },
      { text: 'Oregon', at: [-120.6, 43.9], kind: 'country', size: 12, z: [5.6, 7.9] },
      { text: 'Idaho', at: [-114.6, 44.2], kind: 'country', size: 11, z: [5.6, 7.9] },
      { text: 'Montana', at: [-109.6, 47.1], kind: 'country', size: 11, z: [5.6, 7.9] },
      { text: 'Pacific\nOcean', at: [-127.0, 46.6], kind: 'sea', size: 15, z: [5.6, 7.9] },
      { text: 'Vancouver', at: [-123.12, 49.28], kind: 'place', size: 12, z: [5.6, 9.4] },
      { text: 'Seattle', at: [-122.33, 47.61], kind: 'place', size: 12, z: [5.6, 9.4] },
      { text: 'Victoria', at: [-123.37, 48.43], kind: 'place', size: 10, z: [6.6, 9.4] },
      { text: 'Point Roberts', at: [-123.055, 48.985], kind: 'place', size: 11, z: [7.4, 9.6] },
      { text: 'Blaine', at: [-122.749, 48.993], kind: 'place', size: 10, z: [7.6, 9.6] },
      { text: 'Strait of Georgia', at: [-123.75, 49.35], kind: 'sea', size: 10, z: [7.9, 9.6], rot: -32 },
      { text: 'Juan de Fuca Strait', at: [-124.0, 48.27], kind: 'sea', size: 9, z: [7.9, 9.6], rot: -8 },
    ],
  },

  /* camera: the first entry is the opening state; each later entry is a move {at, to | dur, focus, z, off, ease} */
  camera: [
    { at: 'START', focus: 'pr', z: { h: 13.3, v: 13.15 }, off: { h: [0, 40], v: [0, 60] } },
    { at: 'START', to: 'line:hook>', z: { h: 13.45, v: 13.3 } },
    { at: 'line:name', to: 'Water', z: { h: 13.5, v: 13.35 } },
    { at: 'Water', to: 'drive', focus: [-123.058, 48.997], z: { h: 13.12, v: 12.98 }, off: { h: [0, 30], v: [0, 40] } },
    { at: 'drive', to: 'forty', focus: 'route', z: { h: 12.55, v: 11.85 }, off: [0, 0] },
    { at: 'forty', to: 'Zoom', z: { h: 12.6, v: 11.9 } },
    { at: 'out@-0.12', dur: 1.3, focus: 'west', z: { h: 7.0, v: 6.95 } },                                  // Google Earth pull-out
    { at: 'out@+1.18', to: 'below/Point', z: { h: 7.1, v: 7.05 } },
    { at: 'below/Point', dur: 1.25, focus: 'pr', z: { h: 12.95, v: 12.8 }, off: { h: [-60, 60], v: [0, 120] } },   // dive back in
    { at: 'below/Point@+1.25', to: 'After', z: { h: 13.05, v: 12.9 } },
    { at: 'After', to: 'kids@+0.4', focus: 'route', z: { h: 12.55, v: 11.85 }, off: [0, 0] },
    { at: 'kids@+0.4', to: 'Locals', z: { h: 12.6, v: 11.9 } },
    { at: 'Locals', to: 'gated/America', focus: 'pr', z: { h: 12.95, v: 12.85 }, off: { h: [-250, 60], v: [0, 60] } },
    { at: 'gated/America', to: 'Bought', z: { h: 13.03, v: 12.93 } },
    { at: 'Bought', to: 'end/school', focus: 'pr', z: { h: 6.2, v: 6.6 }, off: { h: [0, -210], v: [0, -360] } },  // all the way back
    { at: 'end/school', to: 'END@+1.5', z: { h: 6.3, v: 6.7 } },
  ],

  events: [
    // ── hook: "From this town, you can't reach the rest of your country without leaving it."
    { type: 'circle', at: 'leaving@-0.08', dur: 0.6, place: 'pr', km: [3.3, 2.2], tilt: -0.05, out: 'line:canada' },
    { type: 'write', at: 'leaving@+0.32', text: 'USA?', place: 'pr', off: { h: [430, -60], v: [250, -340] }, size: { h: 76, v: 70 }, rot: -7, out: 'line:canada' },

    // ── names
    { type: 'tag', at: 'Point', title: 'POINT ROBERTS', sub: 'Washington, USA', subAt: 'Washington', place: 'pr', color: US,
      off: { h: [-330, 250], v: [-40, 340] }, rot: 2, out: 'drive' },
    { type: 'stroke', at: 'Canada@-0.05', dur: 0.55, line: 'neck', width: 9, out: 'Zoom' },
    { type: 'tag', at: 'Canada', title: 'CANADA', sub: 'Delta, B.C.', subAt: 'fourth', place: 'tsaw', color: CA,
      off: { h: [-40, -70], v: [0, -150] }, rot: -2, out: 'drive' },

    // ── key number: "The drive to the rest of America: forty kilometres, through Canada."
    { type: 'stroke', at: 'drive', dur: 2.0, line: 'route', width: 8, dash: [18, 13], out: 'Zoom' },
    { type: 'tag', at: 'America', title: 'BLAINE', sub: 'mainland USA', subAt: 'America@+0.35', place: 'blaine', color: US,
      tsize: 46, off: { h: [-40, 120], v: [-150, 195] }, rot: -2, out: 'Zoom' },
    { type: 'count', at: 'forty', countTo: 'kilometres>', value: 40, decimals: 0, unit: 'KM', label: 'BY ROAD, VIA B.C.',
      screen: { h: [900, 850], v: [370, 1400] }, rot: 2.5, out: 'Zoom' },

    // ── context: pull out; 1846; the 49th parallel in red marker; dive back in
    { type: 'tag', at: '1846', title: 'OREGON TREATY', sub: '1846', subAt: '1846@+0.45', place: [-120.2, 46.6], color: '#7A5A3A',
      tsize: 44, off: { h: [0, 0], v: [40, 40] }, rot: -1.5, out: 'line:below' },
    { type: 'stroke', at: 'split', dur: 1.35, line: 'treaty49', width: 10 },
    { type: 'write', at: 'forty-ninth', text: '49° N', place: [-118.4, B49], off: { h: [0, -56], v: [0, -62] }, size: { h: 66, v: 62 }, rot: -4, out: 'below/Point@+0.3' },

    // ── consequence: school stops at grade 3; the 40-minute ride; four crossings
    { type: 'tag', at: 'third', title: 'GRADE 3', sub: 'local school: K–3', subAt: 'third@+0.15', place: 'pr', color: '#3E7A4A',
      off: { h: [470, 120], v: [0, 360] }, rot: -2, out: 'kids' },
    { type: 'path', at: 'kids', end: 'Blaine>', coords: ROUTE, out: 'Locals', sfx: 'pen' },
    // the name on screen as it's said: whisper hears "Canada to blame" (an LM prior; misaki's blˈAn is right, and whisper
    // hears "Blaine" in other sentences), so the label carries it
    { type: 'tag', at: 'Blaine@-0.1', title: 'BLAINE', place: 'blaine', color: US, tsize: 44,
      off: { h: [-30, 118], v: [-150, 190] }, rot: 2, out: 'Locals' },
    { type: 'clock', at: 'ride/forty', sweepAt: 'ride/forty', sweepTo: 'Blaine', minutes: 40,
      screen: { h: [700, 800], v: [290, 480] }, rot: 3, out: 'Locals' },
    { type: 'passport', at: 'Four', flipAt: 'crossings', header: 'ONE SCHOOL DAY', screen: { h: [1190, 795], v: [770, 490] }, rot: -3, out: 'Locals',
      stamps: [{ text: 'CANADA', sub: 'IN · AM', color: CA }, { text: 'U.S.A.', sub: 'IN · AM', color: US },
               { text: 'CANADA', sub: 'IN · PM', color: CA }, { text: 'U.S.A.', sub: 'IN · PM', color: US }] },
    { type: 'circle', at: 'crossings/border', dur: 0.4, place: 'prCross', px: [28, 28], tilt: 0.1, out: 'Locals' },
    { type: 'circle', at: 'crossings@+0.1', dur: 0.4, place: 'peaceArch', px: [28, 28], tilt: -0.1, out: 'Locals' },

    // ── local twist
    { type: 'strip', at: 'Locals', text: 'LOCALS CALL IT', screen: { h: [1440, 250], v: [400, 330] }, rot: -2.5, size: { h: 40, v: 38 }, out: 'Since' },
    { type: 'strip', at: 'gated/the', text: 'THE BEST GATED COMMUNITY', highlight: 'BEST GATED COMMUNITY', hlAt: 'best', hlDur: 0.7,
      screen: { h: [1400, 365], v: [540, 445] }, rot: 1.5, size: { h: 50, v: 41 }, out: 'Since' },
    { type: 'strip', at: 'gated/in', text: 'IN AMERICA', screen: { h: [1600, 478], v: [720, 560] }, rot: -1.5, size: { h: 40, v: 38 }, out: 'Since' },

    // ── story: stamp, split frame along the real border, tracker card, the water crossing the line
    { type: 'stamp', at: '1987', text: '1987', screen: { h: [1490, 300], v: [560, 400] }, rot: -8, out: 'tap' },
    { type: 'split', at: '1987@+0.22', line: 'border49', north: { color: '#D0503A', alpha: 0.26 }, south: { color: '#5C9DDB', alpha: 0.25 }, out: 'END@+5',
      labels: [
        { text: 'CANADA', side: 'north', at: '1987@+0.3', out: 'Bought', x: { h: 1170, v: 250 } },
        { text: 'USA', side: 'south', at: '1987@+0.3', out: 'Bought', x: { h: 1170, v: 250 } },
        { text: 'CANADA', side: 'north', at: 'end/Forty', x: { h: 1330, v: 820 }, dy: { h: 90, v: 120 } },
        { text: 'USA', side: 'south', at: 'end/Forty', x: { h: 1330, v: 820 }, dy: { h: 90, v: 120 } },
      ] },
    { type: 'tracker', at: 'even', title: 'THE WATER', screen: { h: [1560, 820], v: [540, 1395] }, rot: 1.5, w: 600, vsize: 38, out: 'end/Forty',
      rows: [
        { label: 'DEAL', value: '28 AUG 1987' },
        { label: 'SOURCE', value: 'GREATER VANCOUVER', at: 'Vancouver' },
        { label: 'YEARS', timer: { from: 0, value: 39, at: 'water/water', end: 'Vancouver>', fmt: 'n' } },
      ] },
    { type: 'path', at: 'tap', end: 'Vancouver>', cross: { line: 'border49', at: 'border#2' }, out: 'Bought@+0.5',
      coords: [[-123.066, 49.031], [-123.066, 49.018], [-123.0655, 49.007], [-123.064, 48.998], [-123.061, 48.991]] },

    // ── ending: the circle on Point Roberts, the end card
    { type: 'circle', at: 'end/school', dur: 0.55, place: 'pr', px: { h: [34, 28], v: [32, 26] }, tilt: -0.2 },
    { type: 'endcard', at: 'end/Forty', text: '40 MIN', scribbleAt: 'end/Four', replace: '4 BORDERS', replaceAt: 'borders',
      screen: { h: [960, 790], v: [540, 1250] }, w: { h: 660, v: 620 }, h: 400, handSize: { h: 100, v: 92 } },
  ],
});

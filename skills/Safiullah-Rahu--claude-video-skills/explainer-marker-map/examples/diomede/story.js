/* Diomede: See Tomorrow — story for the map-films engine (see engine/README.md).
   Every time is a word key; every per-format value is {h: <16:9>, v: <9:16>}. */
const US = '#2F5D8A', RU = '#B8352A';

MF.story({
  slug: 'diomede',
  title: 'Diomede: See Tomorrow',
  lon0: -169,                        // projection centre: the antimeridian cut lands at 11°E, far from the story

  sat: {
    threshold: 5,
    levels: [
      { z: 9, center: [-168.98, 65.77], km: [320, 280] },
      { z: 11, center: [-168.98, 65.77], km: [100, 100], landOnly: true, padKm: 6 },
      { z: 13, center: [-169.0, 65.77], km: [24, 16], landOnly: true, padKm: 1.5, weak: -12 },   // shaded cliffs read bluish
    ],
  },

  sound: {
    bpm: 90,
    sections: [{ at: 'START', energy: 1 }, { at: 'back', energy: 2 }, { at: '1987', energy: 3 }, { at: 'Reagan', energy: 2 }],
    hit: 'end/hours',                 // low hit as the punchline is written
  },

  places: {
    big: [-169.0599, 65.7825],       // Big Diomede (Ratmanov), centroid of the z13 land mask
    little: [-168.9224, 65.7519],    // Little Diomede (Krusenstern)
    bdEast: [-169.0132, 65.7822],    // the closest pair of coast points: 3.80 km apart on the mask
    ldWest: [-168.9534, 65.7584],
    gap: [-168.9833, 65.7703],
    pair: [-169.008, 65.778],
    strait: [-169.0, 65.2],
    bigmap: { h: [-169, 57], v: [-169, 58] },
  },

  // the 1867 boundary (and the date line) runs due north along 168°58′37″W between the islands; NE's 1:10m line uses 169°W
  lines: {
    dateline: { geo: 'International Date Line', replace: [{ lat: [65.5, 68.01], lon: -168.9769 }], lat: [49.6, 80] },
    datelineS: { geo: 'International Date Line', replace: [{ lat: [65.5, 68.01], lon: -168.9769 }], lat: [-14, 50.4] },
    datelineN: { geo: 'International Date Line', replace: [{ lat: [65.5, 68.01], lon: -168.9769 }], lat: [80, 85], reverse: true },
    datelineFull: { geo: 'International Date Line', replace: [{ lat: [65.5, 68.01], lon: -168.9769 }], extend: true },
  },

  paper: {
    colors: { Russia: 0, 'United States of America': 1, Canada: 2 },
    labels: [
      { text: 'Russia', at: [172, 66.6], kind: 'country', size: 16, z: [4.2, 7.6] },
      { text: 'Alaska', at: [-153, 65.6], kind: 'country', size: 16, z: [3.2, 7.6] },
      { text: 'U.S.A.', at: [-153, 64.2], kind: 'country', size: 11, z: [4.2, 7.6] },
      { text: 'Bering Sea', at: [-175.5, 58.6], kind: 'sea', size: 14, z: [3.6, 7.4] },
      { text: 'Chukchi Sea', at: [-168.5, 70.2], kind: 'sea', size: 13, z: [4.2, 7.6] },
      { text: 'Arctic Ocean', at: [-162, 75.2], kind: 'sea', size: 14, z: [3.0, 7.0] },
      { text: 'Gulf of Alaska', at: [-146, 57.4], kind: 'sea', size: 12, z: [3.6, 6.8] },
      { text: 'Pacific Ocean', at: [-165, 40], kind: 'sea', size: 16, z: [2.5, 4.6] },
      { text: 'Sea of Okhotsk', at: [149, 55.5], kind: 'sea', size: 11, z: [3.2, 5.6] },
      { text: 'Russia', at: [105, 63], kind: 'country', size: 16, z: [2.5, 4.2] },
      { text: 'Canada', at: [-104, 60], kind: 'country', size: 16, z: [2.5, 5.4] },
      { text: 'United States', at: [-100, 40], kind: 'country', size: 13, z: [2.5, 5.0] },
      { text: 'China', at: [104, 35], kind: 'country', size: 13, z: [2.5, 4.6] },
      { text: 'Mongolia', at: [103, 46.8], kind: 'country', size: 11, z: [2.5, 4.6] },
      { text: 'Japan', at: [139, 37.5], kind: 'country', size: 10, z: [2.8, 5.0] },
      { text: 'Nome', at: [-165.41, 64.5], kind: 'place', size: 11, z: [4.6, 8.8] },
      { text: 'Anadyr', at: [177.51, 64.73], kind: 'place', size: 11, z: [4.6, 8.8] },
      { text: 'Provideniya', at: [-173.23, 64.42], kind: 'place', size: 10, z: [5.7, 8.8] },
      { text: 'Uelen', at: [-169.81, 66.16], kind: 'place', size: 10, z: [5.6, 9.0] },
      { text: 'Wales', at: [-168.09, 65.61], kind: 'place', size: 10, z: [5.6, 9.0] },
    ],
  },

  /* camera: the first entry is the opening state; each later entry is a move {at, to | dur, focus, z, off, ease} */
  camera: [
    { at: 'START', focus: 'pair', z: { h: 12.18, v: 12.16 }, off: { h: [0, 14], v: [0, -40] } },
    { at: 'START', to: 'line:hook>', z: { h: 12.31, v: 12.27 } },
    { at: 'line:little', to: 'line:big', focus: { h: [-168.995, 65.775], v: [-169.0, 65.776] }, z: { h: 12.36, v: 12.31 } },
    { at: 'line:big', to: 'line:gap', focus: { h: [-169.015, 65.777], v: [-169.012, 65.777] }, z: { h: 12.4, v: 12.34 } },
    { at: 'line:gap', to: 'Pull', focus: { h: [-168.996, 65.774], v: [-169.0, 65.775] }, z: { h: 12.62, v: 12.52 }, off: { h: [0, 0], v: [0, -40] } },
    { at: 'back@-0.12', dur: 1.3, focus: { h: 'strait', v: [-169, 63.4] }, z: { h: 5.0, v: 4.7 }, off: [0, 0] },                 // Google Earth pull-out
    { at: 'back@+1.18', to: 'dateline/line', z: { h: 5.14, v: 4.84 } },
    { at: 'dateline/line', dur: 1.0, focus: { h: [-168.995, 65.776], v: 'pair' }, z: { h: 12.3, v: 12.22 }, off: { h: [0, 10], v: [0, -40] } }, // dive back in
    { at: 'Monday@+0.6', to: 'line:curtain', z: { h: 12.37, v: 12.28 } },
    { at: 'line:curtain', to: 'Then', z: { h: 12.5, v: 12.38 } },
    { at: 'Then', to: 'Reagan', z: { h: 12.4, v: 12.3 } },
    { at: 'Reagan', to: 'end/Two', focus: 'bigmap', z: { h: 3.55, v: 3.95 }, off: { h: [0, -150], v: [0, -420] } },  // all the way back
    { at: 'end/Two', to: 'END@+1.5', z: { h: 3.66, v: 4.05 } },
  ],

  events: [
    // ── hook: "From this island, you can see tomorrow."
    { type: 'circle', at: 'tomorrow@-0.08', dur: 0.6, place: 'big', km: [3.35, 4.65], tilt: -0.1, out: 'line:gap' },
    { type: 'write', at: 'tomorrow@+0.32', text: 'TOMORROW', place: 'big', off: { h: [520, -290], v: [455, -330] }, size: { h: 72, v: 66 }, rot: -7, out: 'line:gap' },

    // ── names
    { type: 'tag', at: 'Diomede', title: 'LITTLE DIOMEDE', sub: 'Alaska, USA · pop. 77', subAt: 'Alaska', place: 'little', color: US,
      off: { h: [335, -15], v: [-150, 270] }, rot: 2, out: 'Pull' },
    { type: 'tag', at: 'Diomede#2', title: 'BIG DIOMEDE', sub: 'Russia · pop. 0', subAt: 'Russia', place: 'big', color: RU,
      off: { h: [-330, 250], v: [60, -545] }, rot: -2.5, out: 'Pull' },

    // ── key number: "The gap between them? Three point eight kilometres."
    { type: 'measure', at: 'gap', dur: 0.55, from: 'bdEast', to: 'ldWest', out: 'Pull' },
    { type: 'count', at: 'Three', countTo: 'kilometres>', value: 3.8, decimals: 1, unit: 'KM', place: 'gap',
      off: { h: [270, -230], v: [250, -250] }, rot: 2.5, out: 'Pull' },

    // ── context: pull out, the border, the date line in red marker, dive back in
    { type: 'border', at: 'border', dur: 1.3, line: 'dateline' },
    { type: 'stroke', at: 'International@-0.05', dur: 0.85, line: 'dateline', from: 'gap', width: 9 },
    { type: 'write', at: 'International@+0.15', text: 'DATE LINE', place: [-163.6, 71.3], off: { h: [0, 0], v: [150, 40] }, size: { h: 58, v: 54 }, rot: -6, out: 'Monday' },

    // ── consequence: two calendar pages; Big Diomede's flips to +21 h
    { type: 'calendar', at: 'Monday@+0.18', header: 'LITTLE DIOMEDE · USA', front: { big: 'MON', small: '12:00' }, place: 'little',
      off: { h: [390, -270], v: [16, -650] }, rot: 3, scale: { h: 1, v: 0.95 }, band: US, out: 'line:curtain' },
    { type: 'calendar', at: 'Tuesday', header: 'BIG DIOMEDE · RUSSIA', front: { big: 'TUE', small: '09:00' },
      back: { big: '+21 H', small: 'AHEAD', color: '#B3261C' }, flipAt: 'Twenty-one', place: 'big',
      off: { h: [-385, -40], v: [45, -370] }, rot: -3, scale: { h: 1, v: 0.95 }, band: RU, out: 'line:curtain' },

    // ── local twist
    { type: 'strip', at: 'Cold', text: 'COLD WAR', screen: { h: [1230, 250], v: [640, 560] }, rot: -3, size: 46, out: 'Then' },
    { type: 'strip', at: 'curtain/The#2', text: 'THE ICE CURTAIN', highlight: 'ICE CURTAIN', hlAt: 'Ice', hlDur: 0.45,
      screen: { h: [1300, 380], v: [580, 690] }, rot: 1.5, size: 54, out: 'Then' },

    // ── story: stamp, split frame, tracker card, the swim across the line
    { type: 'stamp', at: '1987', text: '1987', screen: { h: [1440, 400], v: [585, 1330] }, rot: -8, out: 'Six-degree' },
    { type: 'split', at: '1987@+0.22', line: 'datelineFull', west: { color: '#D0503A', alpha: 0.26 }, east: { color: '#5C9DDB', alpha: 0.25 }, out: 'END@+5',
      labels: [
        { text: 'USSR', side: 'west', at: '1987@+0.3', out: 'Reagan' },
        { text: 'USA', side: 'east', at: '1987@+0.3', out: 'Reagan' },
        { text: 'TOMORROW', side: 'west', at: 'her', y: { h: 118, v: 230 } },
        { text: 'TODAY', side: 'east', at: 'her', y: { h: 118, v: 230 } },
      ] },
    { type: 'tracker', at: 'Six-degree', title: 'THE SWIM', screen: { h: [1590, 835], v: [540, 1430] }, rot: 1.5, out: 'Reagan',
      rows: [
        { label: 'DATE', value: '7 AUG 1987' },
        { label: 'WATER', value: '6 °C', at: 'water' },
        { label: 'TIME', timer: { from: 0, value: 126, at: 'water/Two', end: 'tomorrow#2' } },   // minutes, shown h:mm
      ] },
    { type: 'path', at: 'water/Two', end: 'tomorrow#2', cross: { line: 'dateline', at: 'cross/line' }, out: 'Reagan',
      coords: [[-168.9556, 65.7592], [-168.966, 65.7632], [-168.977, 65.7680], [-168.990, 65.7738], [-169.0012, 65.7786], [-169.0108, 65.7818]] },

    // ── ending: the rest of the date line, the circle, the end card
    { type: 'stroke', at: 'Reagan@+0.5', dur: 1.2, line: 'datelineS', width: 9, ease: 'linear' },
    { type: 'stroke', at: 'Reagan@+0.5', dur: 0.4, line: 'datelineN', width: 9, ease: 'linear', sfx: false },
    { type: 'circle', at: 'islands', dur: 0.55, place: 'pair', px: { h: [50, 42], v: [46, 40] }, tilt: -0.2 },
    { type: 'endcard', at: 'end/Three', text: '3.8 KM', scribbleAt: 'end/Twenty-one', replace: '21 HOURS', replaceAt: 'end/hours',
      screen: { h: [960, 800], v: [540, 1260] }, w: { h: 640, v: 620 }, h: 400 },
  ],
});

/* Bir Tawil: Nobody's Land — story for the map-films engine (see engine/README.md).
   Every time is a word key; every per-format value is {h: <16:9>, v: <9:16>}.
   Geometry: no vendored source has the 1902 line or a Bir Tawil polygon (world-atlas draws the de-facto border on 22°N
   with Bir Tawil inside Sudan), so BIR_TAWIL, HALAIB and LINE_1902 are built by bir-tawil/tools/build_geo.py from
   Wikipedia's figures (sides 95/46/26/49 km, 2,060 km²; Halaib 20,580 km², Alshalateen on its northern boundary). */
const EG = '#B8352A', SD = '#2F5D8A', BLUE = '#2459A8', NOBODY = '#7A6A55';

const BIR_TAWIL = [[33.18, 22.0], [33.2429, 21.9503], [33.2961, 21.9222], [33.3494, 21.8779], [33.4026, 21.8608], [33.4558, 21.8237], [33.5042, 21.8065], [33.5478, 21.7604], [33.5817, 21.7333], [33.6349, 21.7206], [33.693, 21.7288], [33.7462, 21.7052], [33.7994, 21.7215], [33.8526, 21.7107], [33.9059, 21.7324], [33.9591, 21.726], [34.0075, 21.7595], [34.0269, 21.8056], [34.0375, 21.8535], [34.0569, 21.9005], [34.0627, 21.9494], [34.09, 22.0]];
const HALAIB = [[34.09, 22.0], [36.884, 22.0], [36.8914, 22.0061], [36.8986, 22.0179], [36.8986, 22.0297], [36.895, 22.0669], [36.8734, 22.0736], [36.8338, 22.0956], [36.8194, 22.1091], [36.8086, 22.1209], [36.7942, 22.1513], [36.7906, 22.1581], [36.7834, 22.1648], [36.7654, 22.175], [36.7582, 22.1766], [36.7546, 22.1733], [36.751, 22.1665], [36.7474, 22.1614], [36.733, 22.1598], [36.715, 22.1699], [36.625, 22.2493], [36.5638, 22.2965], [36.5422, 22.31], [36.5062, 22.3286], [36.4414, 22.3556], [36.4234, 22.3978], [36.427, 22.4266], [36.4054, 22.4485], [36.4018, 22.4485], [36.4054, 22.4333], [36.391, 22.4384], [36.373, 22.4451], [36.3442, 22.4671], [36.3118, 22.4924], [36.2974, 22.5228], [36.2902, 22.5684], [36.2758, 22.592], [36.2254, 22.6359], [36.1966, 22.6511], [36.121, 22.6765], [36.0418, 22.69], [35.9842, 22.6933], [35.9698, 22.6984], [35.9554, 22.7052], [35.9446, 22.7136], [35.941, 22.717], [35.923, 22.7221], [35.887, 22.7356], [35.8474, 22.7626], [35.8294, 22.7845], [35.815, 22.7997], [35.8114, 22.8115], [35.8006, 22.8234], [35.7862, 22.8335], [35.7826, 22.8419], [35.7718, 22.8909], [35.7646, 22.9078], [35.7574, 22.923], [35.743, 22.9314], [35.725, 22.9314], [35.7502, 22.8858], [35.7646, 22.8706], [35.7358, 22.8842], [35.6962, 22.9314], [35.6746, 22.9669], [35.6674, 22.9821], [35.653, 23.0733], [35.635, 23.1104], [35.6206, 23.1391], [35.6039, 23.165], [35.4256, 23.1501], [35.3049, 23.1077], [35.1845, 23.0261], [35.0549, 22.9712], [34.9454, 22.8613], [34.8174, 22.7911], [34.7292, 22.6701], [34.6034, 22.5888], [34.5174, 22.4746], [34.4034, 22.3866], [34.3387, 22.2614], [34.236, 22.1988], [34.1726, 22.0815]];
const LINE_1902 = [[33.18, 22.0], [33.2429, 21.9503], [33.2961, 21.9222], [33.3494, 21.8779], [33.4026, 21.8608], [33.4558, 21.8237], [33.5042, 21.8065], [33.5478, 21.7604], [33.5817, 21.7333], [33.6349, 21.7206], [33.693, 21.7288], [33.7462, 21.7052], [33.7994, 21.7215], [33.8526, 21.7107], [33.9059, 21.7324], [33.9591, 21.726], [34.0075, 21.7595], [34.0269, 21.8056], [34.0375, 21.8535], [34.0569, 21.9005], [34.0627, 21.9494], [34.09, 22.0], [34.1726, 22.0815], [34.236, 22.1988], [34.3387, 22.2614], [34.4034, 22.3866], [34.5174, 22.4746], [34.6034, 22.5888], [34.7292, 22.6701], [34.8174, 22.7911], [34.9454, 22.8613], [35.0549, 22.9712], [35.1845, 23.0261], [35.3049, 23.1077], [35.4256, 23.1501], [35.6039, 23.165]];

MF.story({
  slug: 'bir-tawil',
  title: "Bir Tawil: Nobody's Land",
  lon0: 34,                          // projection centre: the antimeridian cut lands at 146°W, far from the story

  sat: {
    threshold: 5,
    levels: [
      { z: 7, center: [34.5, 22.5], km: [1750, 1900] },                                   // wide fallback during zooms
      { z: 9, center: [34.5, 22.5], km: [930, 890], landOnly: true, padKm: 20 },         // Nile, Lake Nasser, Red Sea
      { z: 10, center: [34.9, 22.25], km: [500, 420], landOnly: true, padKm: 8 },        // Bir Tawil, Halaib, the coast
    ],
  },
  satStyle: { fadeIn: [1.4, 0.65] },  // z10 fully in by Z 9.35, where both territories fit the 16:9 frame
  hud: { shade: 0.55 },               // dark band under the lat/long + EOX credit: bright sand washes out cream text

  sound: {
    bpm: 90,
    sections: [{ at: 'START', energy: 1 }, { at: 'out', energy: 2 }, { at: '2000', energy: 3 }, { at: 'end/Two', energy: 2 }],
    hit: 'zero',
  },

  places: {
    bt: [33.7035, 21.8802],          // Bir Tawil, centroid of the constructed polygon
    halaib: [35.4447, 22.4097],      // Hala'ib Triangle, centroid
    both: { h: [35.03, 22.43], v: [35.05, 22.43] },
    ctx: { h: [31.6, 22.9], v: [31.4, 23.6] },
    push: { h: [34.4, 22.5], v: [34.6, 22.55] },
    eastHalaib: { h: [36.0, 22.16], v: [36.2, 22.12] },
    bigmap: { h: [32.6, 21.7], v: [33.2, 22.4] },
  },

  lines: {
    p22: { coords: [[24.998, 22.0], [36.884, 22.0]] },             // 1899: the 22nd parallel, Libya tripoint → Red Sea
    l1902: { coords: LINE_1902 },                                    // 1902: round Bir Tawil, then Halaib's NW edge
    btRing: { coords: BIR_TAWIL.concat([BIR_TAWIL[0]]) },
    split22: { coords: [[-30, 22.0], [100, 22.0]] },
  },

  paper: {
    colors: { Egypt: 1, Sudan: 2, Libya: 0, 'Saudi Arabia': 0, Chad: 1 },
    labels: [
      { text: 'Egypt', at: [29.8, 26.6], kind: 'country', size: 16, z: [4.8, 8.4] },
      { text: 'Sudan', at: [30.4, 17.6], kind: 'country', size: 16, z: [4.8, 8.4] },
      { text: 'Libya', at: [21.6, 26.4], kind: 'country', size: 14, z: [4.8, 7.6] },
      { text: 'Chad', at: [19.4, 16.6], kind: 'country', size: 12, z: [4.8, 7.2] },
      { text: 'Saudi Arabia', at: [42.6, 24.0], kind: 'country', size: 14, z: [4.8, 7.6] },
      { text: 'Eritrea', at: [38.6, 16.2], kind: 'country', size: 10, z: [5.4, 7.6] },
      { text: 'Yemen', at: [46.0, 15.6], kind: 'country', size: 10, z: [4.8, 6.8] },
      { text: 'Red Sea', at: [38.3, 20.4], kind: 'sea', size: 14, rot: 57, z: [4.8, 8.6] },
      { text: 'Mediterranean Sea', at: [26.5, 33.3], kind: 'sea', size: 12, z: [4.8, 7.0] },
      { text: 'Cairo', at: [31.24, 30.04], kind: 'place', size: 11, z: [4.8, 7.4] },
      { text: 'Aswan', at: [32.9, 24.09], kind: 'place', size: 11, z: [5.6, 8.8] },
      { text: 'Wadi Halfa', at: [31.35, 21.8], kind: 'place', size: 10, z: [5.9, 8.8] },
      { text: 'Port Sudan', at: [37.22, 19.62], kind: 'place', size: 11, z: [5.6, 8.8] },
      { text: 'Khartoum', at: [32.56, 15.5], kind: 'place', size: 11, z: [4.8, 7.4] },
      { text: 'Jeddah', at: [39.19, 21.49], kind: 'place', size: 11, z: [5.6, 8.4] },
      { text: 'Shalateen', at: [35.5856, 23.1317], kind: 'place', size: 10, z: [6.8, 9.4] },
      { text: 'Bir Tawil', at: [33.7, 21.5], kind: 'place', dot: false, size: 11, z: [6.8, 9.4] },
      { text: 'Halaib', at: [35.55, 22.42], kind: 'place', dot: false, size: 11, z: [6.8, 9.4] },
    ],
  },

  /* camera: the first entry is the opening state; each later entry is a move {at, to | dur, focus, z, off, ease} */
  camera: [
    { at: 'START', focus: 'bt', z: { h: 10.05, v: 9.97 }, off: { h: [0, 20], v: [0, -110] } },
    { at: 'START', to: 'line:hook>', z: { h: 10.17, v: 10.07 } },
    { at: 'line:name', to: 'line:size', z: { h: 10.23, v: 10.11 } },
    { at: 'line:size', to: 'Zoom', z: { h: 10.3, v: 10.16 } },
    { at: 'out@-0.12', dur: 1.3, focus: 'ctx', z: { h: 6.5, v: 6.15 }, off: [0, 0] },                     // pull-out
    { at: 'out@+1.18', to: 'y1902/In', z: { h: 6.62, v: 6.26 } },
    { at: 'y1902/In', to: 'drew', focus: 'push', z: { h: 7.24, v: 7.0 } },                                // in on the bends
    { at: 'drew', to: 'y1902/land@-0.15', z: { h: 7.3, v: 7.05 } },
    { at: 'y1902/land@-0.15', dur: 1.0, focus: 'both', z: { h: 9.35, v: 8.8 }, off: { h: [0, 30], v: [0, -60] } }, // dive back in
    { at: 'Each@+0.45', to: 'line:nobody', z: { h: 9.42, v: 8.86 } },
    { at: 'line:nobody', to: 'line:twist', focus: 'bt', z: { h: 10.0, v: 9.95 }, off: { h: [-250, 40], v: [0, 260] } },
    { at: 'line:twist', to: 'line:twist>', z: { h: 10.08, v: 10.02 } },
    { at: 'line:twist>', to: 'y2000/Sudan', focus: 'eastHalaib', z: { h: 9.45, v: 9.3 }, off: { h: [0, 0], v: [0, 0] } },
    { at: 'y2000/Sudan', to: 'since/Egypt', z: { h: 9.52, v: 9.36 } },
    { at: 'since/Egypt@+0.15', to: 'end/Two', focus: 'bigmap', z: { h: 6.2, v: 5.9 }, off: { h: [0, -170], v: [0, -400] } }, // all the way back
    { at: 'end/Two', to: 'END@+1.5', z: { h: 6.3, v: 5.98 } },
  ],

  events: [
    // ── hook: "From this desert, you're standing on land no country claims."
    { type: 'circle', at: 'claims@-0.08', dur: 0.6, place: 'bt', km: [60, 26], tilt: -0.04, out: 'line:size' },
    { type: 'write', at: 'claims@+0.34', text: "NOBODY'S", place: 'bt', off: { h: [-390, -290], v: [-180, -270] }, size: { h: 74, v: 66 }, rot: -7, out: 'line:size' },

    // ── names
    { type: 'tag', at: 'Bir', title: 'BIR TAWIL', sub: 'unclaimed', subAt: 'Tawil', place: 'bt', color: NOBODY,
      off: { h: [560, 195], v: [110, 300] }, rot: 2, out: 'Zoom' },
    { type: 'tag', at: 'Egypt', title: 'EGYPT', sub: 'no claim', subAt: 'neither', place: 'bt', color: EG,
      off: { h: [-40, -335], v: [-20, -470] }, rot: -2, out: 'Zoom' },
    { type: 'tag', at: 'Sudan', title: 'SUDAN', sub: 'no claim', subAt: 'size/country', place: 'bt', color: SD,
      off: { h: [60, 335], v: [-170, 480] }, rot: 2.5, out: 'Zoom' },

    // ── key number: the dashed outline, the count to 2,060 km²
    { type: 'stroke', at: 'Two', dur: 1.15, line: 'btRing', dash: [22, 15], width: 7, ease: 'inOut', out: 'out@+0.5' },
    { type: 'count', at: 'Two', countTo: 'kilometres>', value: 2060, decimals: 0, sep: ',', unit: 'KM²', place: 'bt',
      off: { h: [-560, 175], v: [20, -300] }, rot: -2.5, out: 'Zoom' },

    // ── context: two lines on the paper map
    { type: 'write', at: '1899', text: '1899', place: [29.4, 22.0], off: { h: [0, -60], v: [10, -64] }, size: { h: 66, v: 60 }, rot: -5, out: 'Each' },
    { type: 'stroke', at: 'straight@-0.12', dur: 0.95, line: 'p22', width: 8 },
    { type: 'write', at: 'twenty-second', text: '22° N', place: [36.3, 22.0], off: { h: [10, 48], v: [-40, 54] }, size: 44, rot: -3, out: 'Each' },
    { type: 'write', at: '1902', text: '1902', place: [34.15, 23.15], off: { h: [0, 0], v: [0, 0] }, size: { h: 64, v: 58 }, rot: -6, ink: BLUE, out: 'Each' },
    { type: 'stroke', at: 'drew', dur: 1.7, line: 'l1902', width: 8, ink: BLUE },

    // ── consequence: each country's line gives it Halaib; price tags; Bir Tawil's flips to NO SEA
    { type: 'write', at: 'picks', text: 'EGYPT', place: [35.2, 22.0], off: { h: [0, -38], v: [0, -40] }, size: { h: 46, v: 44 }, rot: -2, out: 'line:nobody' },
    { type: 'write', at: 'halaib/line', text: 'SUDAN', place: [34.86, 22.66], off: { h: [26, 24], v: [26, 24] }, size: { h: 46, v: 44 }, rot: -40, ink: BLUE, out: 'line:nobody' },
    { type: 'area', at: 'Halaib', coords: HALAIB, color: '#F2C230', alpha: 0.16, hatch: 15, hatchColor: '#F7D44C', hatchAlpha: 0.5, hatchW: 3, out: 'line:twist' },
    { type: 'pricetag', at: 'Halaib@+0.12', place: 'halaib', color: '#C99A22', front: { title: 'HALAIB', big: '20,580', small: 'km²' },
      off: { h: [300, 60], v: [170, 20] }, rot: 4, out: 'line:twist' },
    { type: 'pricetag', at: 'Ten', place: 'bt', color: NOBODY, front: { title: 'BIR TAWIL', big: '2,060', small: 'km²' },
      back: { title: 'BIR TAWIL', big: 'NO SEA', small: 'landlocked', color: '#B3261C' }, flipAt: 'sea',
      off: { h: [40, -250], v: [210, -330] }, rot: -4, out: 'line:twist' },

    // ── "Bir Tawil gets nobody." / local twist
    { type: 'area', at: 'nobody', coords: BIR_TAWIL, color: '#F3ECDD', alpha: 0.12, hatch: 13, hatchColor: '#F6F0E4', hatchAlpha: 0.45, hatchW: 2.5, out: 'y2000/Sudan' },
    { type: 'strip', at: 'twist/No', text: 'NO TOWNS', screen: { h: [1390, 250], v: [330, 330] }, rot: -3, size: 50, out: 'line:y2000' },
    { type: 'strip', at: 'twist/No#2', text: 'NO COAST', screen: { h: [1470, 390], v: [700, 330] }, rot: 2, size: 50, out: 'line:y2000' },
    { type: 'strip', at: 'Just', text: 'HERDERS AND GOLD MINERS', highlight: 'GOLD MINERS', hlAt: 'gold', hlDur: 0.45,
      screen: { h: [1360, 545], v: [540, 480] }, rot: -1.5, size: { h: 46, v: 42 }, out: 'line:y2000' },

    // ── story: stamp, split at 22°N (Bir Tawil left untinted), tracker, Sudan's forces leaving Halaib
    { type: 'stamp', at: '2000', text: '2000', screen: { h: [1460, 330], v: [560, 420] }, rot: -8, out: 'line:since' },
    { type: 'split', at: '2000@+0.22', line: 'split22', north: { color: '#D0503A', alpha: 0.24 }, south: { color: '#5C9DDB', alpha: 0.24 },
      holes: [BIR_TAWIL], out: 'END@+5',
      labels: [
        { text: 'EGYPT', side: 'north', at: '2000@+0.3', x: { h: 430, v: 290 }, dy: { h: 120, v: 150 }, out: 'end/Two' },
        { text: 'SUDAN', side: 'south', at: '2000@+0.3', x: { h: 430, v: 290 }, dy: { h: 120, v: 150 }, out: 'end/Two' },
      ] },
    { type: 'tracker', at: 'y2000/Sudan', title: 'HALAIB', screen: { h: [1590, 820], v: [600, 1420] }, rot: 1.5, out: 'end/Two',
      rows: [
        { label: 'SUDAN OUT', value: 'JAN 2000' },
        { label: 'RUN BY', value: 'EGYPT', at: 'since/Egypt' },
        { label: 'YEARS', timer: { from: 0, value: 26, at: 'since/Egypt', end: 'line:since>', fmt: 'n' } },
      ] },
    { type: 'path', at: 'y2000/Sudan', end: 'line:y2000>', cross: { line: 'split22', at: 'y2000/out' }, sfx: 'pen', out: 'end/Two',
      coords: [[36.05, 22.55], [36.17, 22.38], [36.3, 22.2], [36.4, 22.05], [36.47, 21.88], [36.52, 21.7]] },

    // ── ending: the big map, the circle, the end card
    { type: 'circle', at: 'end/desert', dur: 0.55, place: 'bt', px: { h: [46, 36], v: [44, 34] }, tilt: -0.15 },
    { type: 'endcard', at: 'end/Two', label: 'OWNERS', text: '2', scribbleAt: 'end/with', replace: '0', replaceAt: 'zero',
      screen: { h: [960, 805], v: [540, 1250] }, w: { h: 560, v: 560 }, h: 400, size: 170, handSize: 150 },
  ],
});

// THE STATE OF THE WORLD — segments `gaza`, `sudan` and `montage` (the end of verse 1, before pre-chorus 1).
//
// gaza:    the gaza_tents plate with ink type set on its paper sky: kicker + headline, then the attributed chip
//          "100+ AID GROUPS" and the quote "exists in name only" landing word by word. Line 2 cuts to the
//          night globe pushed in on the Strip (the Strip lit vermilion) with the Health Ministry counter and the
//          five soldiers as a parallel smaller figure. Line 3 cuts back to the camp: two equal, attributed columns.
// sudan:   the sudan_drought plate (vermilion sky): headline, then "~20 million in acute hunger" and the IPC
//          famine-RISK alert. The Tigray line cuts to the globe on Ethiopia / Eritrea with the two attributed claims.
// montage: the same globe hands off without a seam, then hops (zoom out, turn, zoom in) to each place on its name:
//          Pakistan–Afghanistan, eastern DR Congo, Myanmar, Haiti. A pin + mono label each, and a running list.
// Facts and source labels: research/FACTSHEET.md, stories 3 and 4 and §4 (the "also on the map" montage).
import type { Segment, X } from '../x';
import type { PostOverrides } from '../../engine/scene';
import { norm, type Word } from '../../engine/lyrics';
import {
  W, H, C, PAPER, INK, RED, SLATE, FONT, text, label, source, pill, hair, scrim,
  appear, vanish, countTo, measure, clamp, ease, lerp, wrap,
} from '../kit';
import { drawGlobe, country, visible, type GlobeView, type Highlight } from '../globe';
import { geoPath, geoDistance, type GeoProjection } from 'd3-geo';

type Ctx = CanvasRenderingContext2D;
type LL = [number, number];

// ------------------------------------------------------------------------------------------------ timing helpers
/** A word of any segment's lyric (X.W only searches the current segment; the Tigray hand-off spans two). */
function wd(X: X, seg: string, q: string, nth = 0): Word {
  const words = X.ly.lines.filter((l) => l.section === seg).flatMap((l) => l.words);
  const qs = q.split(/\s+/).map(norm).filter(Boolean);
  let seen = 0;
  for (let i = 0; i + qs.length <= words.length; i++) {
    if (qs.every((qq, j) => norm(words[i + j]!.w) === qq) && seen++ === nth) return words[i]!;
  }
  throw new Error(`word "${q}" not in segment ${seg}`);
}
const segOf = (X: X, id: string) => X.segs.find((s) => s.id === id)!;
/** The nearest beat to `at` if it is within `max` seconds, else `at` (cuts snap to the grid, never off the word). */
function snapBeat(X: X, at: number, max = 0.12) {
  const tb = X.tBeat(Math.round(X.beat(at)));
  return Math.abs(tb - at) <= max ? tb : at;
}
/** A small zoom punch on every kick (the verse kicks fall on the story beats: 55.2, 60.2, 65.1, 70.0, 75.0, 79.9). */
const kickPunch = (X: X, o: PostOverrides): PostOverrides => ({ ...o, zoom: (o.zoom ?? 1) * (1 + 0.014 * X.hit('kick', X.t, 0.13)) });

// ------------------------------------------------------------------------------------------------ type helpers
/** Text rising into place through a clip line (k 0..1). Returns the text width. */
function rise(c: Ctx, s: string, x: number, y: number, fam: string, size: number, col: string, k: number, o: { track?: number; alpha?: number } = {}) {
  const w = measure(s, fam, size, o.track ?? 0);
  if (k <= 0 || (o.alpha ?? 1) <= 0) return w;
  c.save();
  c.beginPath(); c.rect(x - size * 0.3, y - size * 1.08, w + size * 0.6, size * 1.42); c.clip();
  text(c, s, x, y + (1 - k) * size * 1.05, fam, size, col, { track: o.track, alpha: o.alpha });
  c.restore();
  return w;
}
/** Words of a phrase rising one by one, each on its own time; returns the right edge. */
function riseWords(c: Ctx, parts: { s: string; t0: number; col: string }[], x: number, y: number, fam: string, size: number, t: number, alpha = 1) {
  let xx = x;
  const sp = measure(' ', fam, size);
  for (const p of parts) {
    const w = rise(c, p.s, xx, y, fam, size, p.col, appear(t, p.t0, 0.45), { alpha });
    xx += w + sp;
  }
  return xx - sp;
}
/** A bordered mono chip (attribution tag). ink = dark type on light ground. Returns its width. */
function chip(c: Ctx, s: string, x: number, y: number, k: number, o: { size?: number; ink?: boolean; fill?: string } = {}) {
  const size = o.size ?? 16, fam = FONT.mono(600), track = size * 0.12, padX = size * 0.75, dot = size * 0.55;
  const tw = measure(s.toUpperCase(), fam, size, track), w = padX * 2 + dot + size * 0.6 + tw, h = size * 2;
  if (k <= 0) return w;
  const fg = o.ink ? INK : PAPER;
  c.save();
  c.globalAlpha *= clamp(k * 1.4);
  c.translate(0, (1 - k) * 10);
  if (o.fill) { c.fillStyle = o.fill; c.fillRect(x, y - h * 0.7, w * k, h); }
  c.strokeStyle = fg(0.85); c.lineWidth = 1.5; c.strokeRect(x + 0.75, y - h * 0.7 + 0.75, w * k - 1.5, h - 1.5);
  c.beginPath(); c.rect(x, y - h, w * k, h * 1.5); c.clip();
  c.fillStyle = RED(); c.fillRect(x + padX, y - size * 0.62, dot, dot);
  text(c, s.toUpperCase(), x + padX + dot + size * 0.6, y, fam, size, fg(0.95), { track });
  c.restore();
  return w;
}
/** A pin with a beat-synced pulse ring and a mono label on a leader line. */
function pin(c: Ctx, X: X, p: GeoProjection, v: GlobeView, ll: LL, t0: number, o: { hot?: boolean; text?: string; side?: 'left' | 'right'; alpha?: number; size?: number; up?: number; down?: boolean } = {}) {
  const t = X.t;
  if (!visible(v, ll[0], ll[1])) return;
  const xy = p(ll);
  if (!xy) return;
  const k = appear(t, t0, 0.35) * (o.alpha ?? 1);
  if (k <= 0) return;
  const [x, y] = xy, col = o.hot ? RED : PAPER;
  c.save();
  c.globalAlpha *= k;
  // a ring that blooms on every beat (and once more on landing)
  const ph = ((X.beat(t) % 1) + 1) % 1;
  c.strokeStyle = col(0.55 * (1 - ph)); c.lineWidth = 1.4;
  c.beginPath(); c.arc(x, y, 7 + ph * 26, 0, Math.PI * 2); c.stroke();
  const land = clamp((t - t0) / 0.6);
  if (land < 1) { c.strokeStyle = col(0.8 * (1 - land)); c.lineWidth = 2; c.beginPath(); c.arc(x, y, 8 + land * 60, 0, Math.PI * 2); c.stroke(); }
  c.fillStyle = col(); c.beginPath(); c.arc(x, y, 6 * ease.outBack(clamp((t - t0) / 0.35)), 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(10,16,32,0.9)'; c.lineWidth = 1.5; c.stroke();
  if (o.text) {
    const right = (o.side ?? 'right') === 'right', up = o.up ?? 30, size = o.size ?? 18;
    const lx = x + (right ? 1 : -1) * up, ly = y + (o.down ? up : -up);
    const u = ease.outCubic(clamp((t - t0 - 0.04) / 0.22));
    c.strokeStyle = PAPER(0.75); c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(x, y); c.lineTo(lerp(x, lx, u), lerp(y, ly, u)); c.lineTo(lerp(x, lx, u) + (right ? 18 : -18) * u, lerp(y, ly, u)); c.stroke();
    const fam = FONT.mono(600), tw = measure(o.text, fam, size, size * 0.12);
    const tx = right ? lx + 26 : lx - 26 - tw;
    c.beginPath(); c.rect(right ? tx - 4 : tx - 4, ly - size * 1.2, (tw + 8) * u, size * 1.8); c.clip();
    c.fillStyle = 'rgba(10,16,32,0.72)'; c.fillRect(tx - 8, ly - size * 1.0, tw + 16, size * 1.5);
    text(c, o.text, tx, ly + size * 0.36, fam, size, o.hot ? RED() : PAPER(0.98), { track: size * 0.12 });
  }
  c.restore();
}
/** A night grade under the chrome band (as tech-climate does) so the scene's mono chrome stays legible over a plate. */
function topShade(c: Ctx, a: number, h = 150, col = '8,13,28') {
  if (a <= 0) return;
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.55, `rgba(${col},${a * 0.6})`); g.addColorStop(1, `rgba(${col},0)`);
  c.fillStyle = g; c.fillRect(0, 0, W, h);
}
/** A quiet geographic name on the map (slate mono), only while on the visible hemisphere. */
function placeName(c: Ctx, p: GeoProjection, v: GlobeView, ll: LL, s: string, a: number, size = 14) {
  if (a <= 0 || !visible(v, ll[0], ll[1])) return;
  const xy = p(ll);
  if (!xy) return;
  label(c, s, xy[0], xy[1], SLATE(0.95), size, { align: 'center', alpha: a, w: 500 });
}

// ------------------------------------------------------------------------------------------------ camera helpers
const shortest = (d: number) => ((d % 360) + 540) % 360 - 180;
function mixView(a: GlobeView, b: GlobeView, w: number): GlobeView {
  return {
    lon: a.lon + shortest(b.lon - a.lon) * w, lat: lerp(a.lat, b.lat, w),
    r: Math.exp(lerp(Math.log(a.r), Math.log(b.r), w)),
    cx: lerp(a.cx ?? 960, b.cx ?? 960, w), cy: lerp(a.cy ?? 540, b.cy ?? 540, w),
  };
}
/** A hop between two views: zoom out, turn, zoom in (the dip grows with the distance). east forces the direction. */
function hop(a: GlobeView, b: GlobeView, e: number, east = false): GlobeView {
  const dl = east ? ((b.lon - a.lon) % 360 + 360) % 360 : shortest(b.lon - a.lon);
  const ang = geoDistance([a.lon, a.lat], [b.lon, b.lat]);
  const dip = Math.min(1.25, ang * 0.85) * Math.sin(Math.PI * e);
  return {
    lon: a.lon + dl * e, lat: lerp(a.lat, b.lat, e),
    r: Math.exp(lerp(Math.log(a.r), Math.log(b.r), e) - dip),
    cx: lerp(a.cx ?? 960, b.cx ?? 960, e), cy: lerp(a.cy ?? 540, b.cy ?? 540, e),
  };
}

// ------------------------------------------------------------------------------------------------ geography
const PAL = country('palestine');
/** The Gaza Strip: the small western ring of Natural Earth's Palestine multipolygon. */
const GAZA: any = (() => {
  if (!PAL) return null;
  const polys: number[][][][] = PAL.geometry.type === 'Polygon' ? [PAL.geometry.coordinates] : PAL.geometry.coordinates;
  const g = polys.find((pg) => pg[0]!.reduce((s, q) => s + q[0]!, 0) / pg[0]!.length < 34.6);
  return g ? { type: 'Polygon', coordinates: g } : null;
})();
const LL_TIGRAY: LL = [39.25, 13.75];
/** A neutral lift of the land in view (uniform slate, no emphasis) so the coast reads on the night globe. */
const lift = (names: string[], a: number): Highlight[] => names.map((name) => ({ name, col: C.slate, alpha: 0.13 * a }));
const LIFT_LEVANT = ['Egypt', 'Israel', 'Palestine', 'Jordan', 'Lebanon', 'Syria', 'Saudi Arabia', 'Cyprus', 'Iraq', 'Turkey'];
const LIFT_HORN = ['Sudan', 'S. Sudan', 'Djibouti', 'Somalia', 'Somaliland', 'Yemen', 'Saudi Arabia', 'Kenya', 'Egypt'];

// ================================================================================================ GAZA
function gazaOpen(c: Ctx, X: X) {
  const t = X.t, s = X.seg, tEnd = X.W("Gaza's").start;
  c.fillStyle = '#F4EEDF'; c.fillRect(0, 0, W, H);
  // zoomed and dropped so the horizon sits low: the paper sky is the page the type is set on
  X.plate(c, 'gaza_tents', { a: s.t0 - 0.6, b: tEnd + 0.3, z: [1.2, 1.25], x: [0.03, 0.012], y: [0.1, 0.105] });
  topShade(c, 0.6);
  const out = vanish(t, tEnd + 0.2, 0.3);
  // kicker + serif headline in ink on the paper sky
  pill(c, s.kicker ?? '', 120, 206, { size: 15, alpha: appear(t, s.t0, 0.4) * out });
  const fam = FONT.serif(800);
  const tw = rise(c, s.title ?? '', 114, 312, fam, 96, INK(), appear(t, s.t0 + 0.1, 0.6), { track: -2, alpha: out });
  const hu = ease.outCubic(clamp((t - s.t0 - 0.35) / 0.9));
  if (hu > 0) hair(c, 120, 350, 120 + tw * hu, 350, INK(0.4 * out), 1.2);
  // "aid groups say …" → the attributed chip (FACTSHEET S45: "more than 100 organisations", framed as aid groups),
  // then the quote word by word, "in name only" in vermilion
  const tAid = X.W('aid').start;
  const cw = chip(c, '100+ aid groups', 120, 420, appear(t, tAid, 0.4) * out, { ink: true, size: 19 });
  const say = appear(t, X.W('say').start, 0.35) * out;
  if (say > 0) text(c, 'say the ceasefire', 120 + cw + 20, 421, FONT.sans(500), 30, INK(0.85), { alpha: say });
  const qf = FONT.serif(700), qs = 80, qy = 518;
  const xEnd = riseWords(c, [
    { s: '“exists', t0: X.W('exists').start, col: INK() },
    { s: 'in', t0: X.W('in name only').start, col: RED() },
    { s: 'name', t0: X.W('name').start, col: RED() },
    { s: 'only.”', t0: X.W('only').start, col: RED() },
  ], 112, qy, qf, qs, t, out);
  const xIn = 112 + measure('“exists ', qf, qs);
  const ul = ease.outCubic(clamp((t - X.W('name').start) / 0.45));
  if (ul > 0) { c.fillStyle = RED(0.9 * out); c.fillRect(xIn, qy + 14, (xEnd - xIn) * ul, 5); }
  const sa = appear(t, X.W('only').start + 0.1, 0.4) * out;
  if (sa > 0) source(c, 'JOINT NGO STATEMENT (AMNESTY) · 9 OCT 2026', 120, qy + 52, INK(0.65), { alpha: sa });
}

function gazaCount(c: Ctx, X: X) {
  const t = X.t, tA = X.W("Gaza's").start, tB = snapBeat(X, X.W('Israel').start);
  const push = ease.inOutQuad(clamp((t - tA) / (tB - tA)));
  const v0 = X.view(t);
  // a deliberate slow push-in on the Strip, wide enough to read the coast (the idle drift is held so the Strip
  // stays put beside the counter; this shot is cut in and out, so it never has to meet a neighbour's globe)
  const v: GlobeView = { ...v0, lon: 34.0, lat: 31.25, r: 9200 * Math.exp(0.38 * push), cx: 1280, cy: 540 };
  c.fillStyle = C.night; c.fillRect(0, 0, W, H);
  const p = drawGlobe(c, { ...v, highlights: lift(LIFT_LEVANT, 1) }, t);
  if (!p) return;
  // the Strip, lit on "Gaza's", its outline breathing with the beat
  const kG = appear(t, tA, 0.5);
  if (GAZA && kG > 0) {
    const path = geoPath(p, c);
    const ph = ((X.beat(t) % 1) + 1) % 1;
    c.save();
    c.beginPath(); path(GAZA);
    c.strokeStyle = RED(0.5 * kG * (1 - ph)); c.lineWidth = 3 + 16 * ph; c.lineJoin = 'round'; c.stroke();
    c.fillStyle = RED(0.95 * kG); c.fill();
    c.strokeStyle = 'rgba(255,122,77,0.9)'; c.lineWidth = 1.5; c.stroke();
    c.restore();
  }
  // a soft night pool under the counter column: the Sinai coast runs right through the numerals otherwise
  scrim(c, 120, 250, 640, 470, 0.62 * appear(t, X.W('health').start - 0.1, 0.5), '9,15,32');
  const kP = appear(t, tA + 0.25, 0.6);
  placeName(c, p, v, [32.9, 32.75], 'MEDITERRANEAN SEA', kP, 16);
  placeName(c, p, v, [35.0, 30.55], 'ISRAEL', kP, 17);
  placeName(c, p, v, [33.6, 29.9], 'EGYPT', kP, 17);
  placeName(c, p, v, [36.6, 30.9], 'JORDAN', kP, 17);
  pin(c, X, p, v, [34.36, 31.43], tA + 0.1, { text: 'GAZA STRIP', side: 'right', up: 52, size: 22 });

  // the counter (left, over the sea)
  const x = 140;
  const tH = X.W('health').start, tN = X.W('1,490').start, tK = X.W('killed').start, tF = X.W('Five').start;
  rise(c, 'GAZA HEALTH MINISTRY', x, 286, FONT.mono(600), 22, PAPER(0.95), appear(t, tH, 0.4), { track: 3 });
  const kN = appear(t, tN, 0.35);
  if (kN > 0) {
    const nf = FONT.serif(700), ns = 250;
    const num = countTo(t, tN, 0, 1490, 1.05);
    const plus = clamp((t - tN - 1.0) / 0.25);
    c.save(); c.globalAlpha *= kN; c.translate(0, (1 - kN) * 22);
    const nw = text(c, num, x - 8, 512, nf, ns, RED(), { track: -5 });
    if (plus > 0) text(c, '+', x - 8 + nw + 8, 512 - ns * 0.3, nf, ns * 0.55, RED(), { alpha: plus });
    c.restore();
  }
  rise(c, 'KILLED SINCE THE CEASEFIRE', x, 576, FONT.mono(600), 28, PAPER(), appear(t, tK, 0.4), { track: 3.5 });
  const hu = ease.outCubic(clamp((t - tK - 0.1) / 0.6));
  if (hu > 0) hair(c, x, 604, x + 660 * hu, 604, PAPER(0.4), 1);
  const sa = appear(t, tK + 0.25, 0.4);
  if (sa > 0) source(c, 'GAZA HEALTH MINISTRY VIA AP, TIMES OF ISRAEL · TO 14 OCT 2026', x, 632, SLATE(), { alpha: sa });
  // the parallel, smaller figure: five Israeli soldiers over the same period
  const kF = appear(t, tF, 0.4);
  if (kF > 0) {
    const tS = X.W('soldiers').start;
    const w5 = rise(c, '5', x - 4, 786, FONT.serif(700), 140, PAPER(), kF);
    rise(c, 'ISRAELI SOLDIERS KILLED', x + w5 + 28, 728, FONT.mono(600), 24, PAPER(0.97), appear(t, tS - 0.15, 0.4), { track: 3 });
    rise(c, 'IN GAZA, SAME PERIOD', x + w5 + 28, 762, FONT.mono(500), 19, PAPER(0.75), appear(t, tS, 0.4), { track: 2.4 });
    const sb = appear(t, X.W('also').start, 0.4);
    if (sb > 0) source(c, 'AP / TIMES OF ISRAEL · OCT 2026', x + w5 + 28, 790, SLATE(), { alpha: sb });
  }
}

function gazaPositions(c: Ctx, X: X) {
  const t = X.t, s = X.seg, tB = snapBeat(X, X.W('Israel').start);
  c.fillStyle = '#F4EEDF'; c.fillRect(0, 0, W, H);
  // the camp again, tighter and lower: two voices set on the sky, given the same weight
  X.plate(c, 'gaza_tents', { a: tB, b: s.t1 + 0.6, z: [1.24, 1.28], x: [-0.05, -0.065], y: [0.118, 0.122] });
  topShade(c, 0.6);
  scrim(c, 980, 190, 760, 250, 0.7, '243,239,230');
  const col = (who: string, said: string[], src: string, x: number, t0: number, tSay: number[]) => {
    const k = appear(t, t0, 0.4);
    if (k <= 0) return;
    const hf = FONT.mono(600), hs = 22;
    c.fillStyle = INK(0.92 * k); c.fillRect(x, 202, 12, 12);
    const ww = rise(c, who, x + 26, 215, hf, hs, INK(), k, { track: 3.5 });
    rise(c, 'SAYS', x + 26 + ww + 14, 215, FONT.mono(400), hs, INK(0.55), appear(t, t0 + 0.12, 0.4), { track: 3.5 });
    const hu = ease.outCubic(clamp((t - t0) / 0.7));
    hair(c, x, 240, x + 720 * hu, 240, INK(0.5), 1.2);
    said.forEach((ln, i) => rise(c, ln, x - 3, 322 + i * 74, FONT.serif(700), 66, INK(), appear(t, tSay[i] ?? tSay[0]!, 0.5), { track: -1 }));
    const sa = appear(t, tSay[tSay.length - 1]! + 0.3, 0.4);
    if (sa > 0) source(c, src, x, 322 + said.length * 74 - 14, INK(0.62), { alpha: sa });
  };
  // each line of a position lands on the words that carry it ("says it targets" / "threats"; "says it won't disarm" / "strikes")
  col('ISRAEL', ['Its strikes target', 'threats to troops.'], 'AP · 15 OCT 2026', 120, X.W('Israel').start, [X.W('says').start, X.W('threats').start]);
  col('HAMAS', ['It will not disarm while', 'strikes continue.'], 'TIMES OF ISRAEL · 12 OCT 2026', 1010, X.W('Hamas').start, [X.W('says', 1).start, X.W('strikes').start]);
  // a hairline divides the two positions, drawn when the second voice arrives
  const du = ease.outCubic(clamp((t - X.W('Hamas').start) / 0.5));
  if (du > 0) hair(c, 960, 196, 960, 196 + 290 * du, INK(0.35), 1);
}

const gaza: Segment = {
  draw(c, X) {
    const t = X.t, s = X.seg;
    if (t < s.t0 - 0.12) return; // a 3-frame cut-in on the downbeat
    c.globalAlpha *= clamp((t - (s.t0 - 0.12)) / 0.12);
    const tG = X.W("Gaza's").start, tP = snapBeat(X, X.W('Israel').start);
    if (t < tG + 0.22) gazaOpen(c, X);
    if (t >= tG && t < tP) {
      c.save(); c.globalAlpha *= ease.inOutQuad(clamp((t - tG) / 0.22)); gazaCount(c, X); c.restore();
    }
    if (t >= tP) gazaPositions(c, X);
  },
  post: kickPunch,
};

// ================================================================================================ SUDAN
function sudanPlate(c: Ctx, X: X) {
  const t = X.t, s = X.seg, tG = X.W('In Tigray').start;
  c.fillStyle = '#E0461F'; c.fillRect(0, 0, W, H);
  X.plate(c, 'sudan_drought', { a: s.t0, b: tG + 0.4, z: [1.04, 1.1], x: [0.012, -0.008] });
  topShade(c, 0.62); // the chrome's red counter vanishes on the vermilion sky without it
  const x = 880, tN = X.W('20').start;
  // kicker + headline, ink on the vermilion sky
  const out = vanish(t, tN - 0.02, 0.25);
  pill(c, s.kicker ?? '', x, 262, { size: 14, fill: INK(0.94), col: PAPER(), alpha: appear(t, s.t0, 0.4) * out });
  const hf = FONT.serif(800);
  rise(c, 'Famine risk and', x - 4, 352, hf, 84, INK(), appear(t, s.t0 + 0.08, 0.55), { track: -1.5, alpha: out });
  rise(c, 'a new Tigray war', x - 4, 440, hf, 84, INK(), appear(t, s.t0 + 0.22, 0.55), { track: -1.5, alpha: out });
  // ~20 million in acute hunger (UN)
  const kN = appear(t, tN, 0.4);
  const end = vanish(t, tG + 0.05, 0.2);
  if (kN > 0) {
    const nf = FONT.serif(700);
    c.save(); c.globalAlpha *= end;
    // "about 20 million": the tilde set at the numerals' size, the count landing on "20"
    const w0 = rise(c, '~', x - 8, 392, nf, 200, INK(0.85), kN);
    const w1 = rise(c, '20', x - 8 + w0 + 4, 420, nf, 250, INK(), kN, { track: -6 });
    rise(c, 'million', x + w0 + w1 + 16, 420, FONT.serif(700), 110, INK(), appear(t, X.W('million').start, 0.4), { track: -1 });
    rise(c, 'IN ACUTE HUNGER', x, 488, FONT.mono(600), 32, INK(), appear(t, X.W('acute').start - 0.08, 0.4), { track: 4.5 });
    const sa = appear(t, X.W('hunger').start, 0.4);
    if (sa > 0) source(c, 'UN · 16 OCT 2026', x, 522, INK(0.8), { alpha: sa });
    // the IPC alert: a famine-RISK alert, not a famine classification
    const kA = appear(t, X.W('alert').start, 0.4);
    if (kA > 0) {
      const bx = x, by = 568, bw = 760, bh = 128, ew = bw * ease.outCubic(kA);
      c.save(); c.globalAlpha *= clamp(kA * 1.5);
      c.fillStyle = PAPER(0.97); c.fillRect(bx, by, ew, bh);
      c.beginPath(); c.rect(bx, by, ew, bh); c.clip();
      c.fillStyle = INK(); c.fillRect(bx, by, 10, bh);
      const af = FONT.mono(600);
      const aw = text(c, 'FAMINE-RISK ALERT', bx + 36, by + 56, af, 38, INK(), { track: 4 });
      const ru = ease.outCubic(clamp((t - X.W('famine').start) / 0.5));
      if (ru > 0) { c.fillStyle = RED(); c.fillRect(bx + 36, by + 70, aw * ru, 5); }
      // the sung line names Darfur only; the alert covers "parts of" it (FACTSHEET Story 4 fact 2, S49)
      const kD = appear(t, X.W('Darfur').start, 0.35);
      text(c, 'PARTS OF DARFUR', bx + 36, by + 106, FONT.mono(600), 19, INK(0.92), { track: 2.4, alpha: 0.3 + 0.7 * kD });
      text(c, 'SOURCE · IPC · 12 OCT 2026', bx + bw - 26, by + 106, FONT.mono(500), 15, INK(0.66), { track: 2, align: 'right' });
      c.restore();
    }
    c.restore();
  }
}

/** The Tigray camera: X.view() resting on Sudan, nudged east onto Ethiopia / Eritrea, easing back to the shared
 *  camera across the sudan → montage boundary (both segments call this, so the hand-off is seamless). */
function hornCam(X: X, t: number): GlobeView {
  const v = X.view(t);
  const tIn = wd(X, 'sudan', 'In Tigray').start, sud = segOf(X, 'sudan');
  const push = ease.inOutQuad(clamp((t - tIn) / 3.8));
  const tgt: GlobeView = { lon: 38.3 + 0.35 * push, lat: 13.0, r: 3000 * (1 + 0.1 * push), cx: 1300, cy: 600 };
  const w = 1 - ease.inOutCubic(clamp((t - (sud.t1 - 0.3)) / 1.3));
  return mixView(v, tgt, w);
}
/** The Tigray overlay leaves as "Elsewhere" begins (both segments share the same clock for it). */
const hornOut = (X: X, t: number) => vanish(t, wd(X, 'montage', 'Elsewhere').start - 0.02, 0.26);
function hornHighlights(X: X, t: number): Highlight[] {
  const out = hornOut(X, t);
  return [
    { name: 'Ethiopia', col: C.slate, alpha: 0.36 * appear(t, wd(X, 'sudan', 'Ethiopia').start, 0.4) * out },
    { name: 'Eritrea', col: C.slate, alpha: 0.36 * appear(t, wd(X, 'sudan', 'Eritrea').start, 0.4) * out },
  ];
}
function hornOverlay(c: Ctx, X: X, t: number, p: GeoProjection, v: GlobeView) {
  const tIn = wd(X, 'sudan', 'In Tigray').start, tTig = wd(X, 'sudan', 'Tigray').start;
  const tEth = wd(X, 'sudan', 'Ethiopia').start, tEri = wd(X, 'sudan', 'Eritrea').start, tWhich = wd(X, 'sudan', 'which').start;
  const out = hornOut(X, t);
  if (out <= 0 || t < tIn) return;
  placeName(c, p, v, [33.4, 15.6], 'SUDAN', appear(t, tIn, 0.5) * out * 0.85, 17);
  placeName(c, p, v, [38.6, 10.4], 'ETHIOPIA', appear(t, tEth, 0.4) * out, 19);
  placeName(c, p, v, [38.15, 16.15], 'ERITREA', appear(t, tEri, 0.4) * out, 19);
  pin(c, X, p, v, LL_TIGRAY, tTig - 0.1, { hot: true, text: 'TIGRAY', side: 'right', up: 40, size: 24, alpha: out, down: true });
  // two attributed claims: parallel panels on the left, the same weight for each side. Each line lands on the word
  // that carries it: ETHIOPIA on "Ethiopia", "Accuses Eritrea" on "accuses", "of invasion." on "Eritrea"; the ERITREA
  // panel opens on "which" with its denial (the overlay must clear for "Elsewhere", so "denies" itself is too late).
  const tAcc = wd(X, 'sudan', 'accuses').start;
  const card = (y: number, who: string, said: string[], t0: number, tSay: number[]) => {
    const k = appear(t, t0, 0.4);
    if (k <= 0) return;
    const ph = 64 + said.length * 60 + 18, open = ease.outExpo(clamp((t - t0) / 0.4));
    c.save(); c.globalAlpha *= out;
    c.fillStyle = 'rgba(12,19,36,0.9)'; c.fillRect(120, y, 560 * open, ph);
    c.fillStyle = PAPER(0.9); c.fillRect(120, y, 4, ph * open);
    c.beginPath(); c.rect(120, y, 560 * open, ph); c.clip();
    rise(c, who, 150, y + 44, FONT.mono(600), 22, PAPER(0.95), k, { track: 3.5 });
    said.forEach((ln, i) => rise(c, ln, 148, y + 112 + i * 60, FONT.serif(700), 52, PAPER(), appear(t, tSay[i] ?? tSay[0]!, 0.45), { track: -0.5 }));
    c.restore();
  };
  card(272, 'ETHIOPIA', ['Accuses Eritrea', 'of invasion.'], tEth, [tAcc, tEri]);
  card(504, 'ERITREA', ['Denies it.'], tWhich, [tWhich + 0.08]);
  // the shared source sits under the claims column from the first claim on (no attributed claim without its source)
  const sa = appear(t, tAcc + 0.3, 0.4) * out;
  if (sa > 0) source(c, 'UN NEWS · 10 OCT 2026', 122, 688, SLATE(), { alpha: sa });
}

function hornGlobe(c: Ctx, X: X, t: number) {
  const v = hornCam(X, t);
  c.fillStyle = C.night; c.fillRect(0, 0, W, H);
  const p = drawGlobe(c, { ...v, highlights: [...lift(LIFT_HORN, hornOut(X, t)), ...hornHighlights(X, t)] }, t);
  if (p) hornOverlay(c, X, t, p, v);
}

const sudan: Segment = {
  draw(c, X) {
    const t = X.t, s = X.seg;
    if (t < s.t0) return; // hard cut from Gaza on the beat
    const tG = X.W('In Tigray').start;
    if (t < tG) sudanPlate(c, X); else hornGlobe(c, X, t);
  },
  post: kickPunch,
};

// ================================================================================================ MONTAGE
interface Stop { v: GlobeView; arr: number; dep: number; pin: LL; label: string; hl: string[]; east?: boolean }
function stops(X: X): Stop[] {
  const P = X.W('Pakistan').start, E = X.W('eastern').start, M = X.W('Myanmar').start, Hh = X.W('Haiti').start;
  return [
    { v: { lon: 69.0, lat: 31.6, r: 1550, cx: 1240, cy: 580 }, arr: P, dep: E - 0.62, pin: [70.4, 33.4], label: 'PAKISTAN–AFGHANISTAN', hl: ['Pakistan', 'Afghanistan'] },
    { v: { lon: 26.6, lat: -2.4, r: 1400, cx: 1260, cy: 580 }, arr: E, dep: M - 0.4, pin: [29.2, -1.6], label: 'EASTERN DR CONGO', hl: ['Dem. Rep. Congo'] },
    { v: { lon: 95.4, lat: 20.4, r: 1550, cx: 1260, cy: 580 }, arr: M, dep: Hh - 0.4, pin: [96.0, 21.2], label: 'MYANMAR', hl: ['Myanmar'] },
    { v: { lon: -73.6, lat: 18.9, r: 2100, cx: 1260, cy: 580 }, arr: Hh, dep: Hh + 0.24, pin: [-72.4, 18.8], label: 'HAITI', hl: ['Haiti'], east: true },
  ];
}
const rest = (s: Stop, t: number): GlobeView => ({ ...s.v, r: s.v.r * (1 + 0.05 * clamp(t - s.arr, 0, 3)) });
function montageCam(X: X, t: number, S: Stop[]): GlobeView {
  const f0 = S[0]!.arr - 0.9;
  if (t < f0) return hornCam(X, t);
  if (t < S[0]!.arr) return hop(hornCam(X, t), S[0]!.v, ease.inOutCubic((t - f0) / (S[0]!.arr - f0)));
  for (let i = 0; i < S.length - 1; i++) {
    const a = S[i]!, b = S[i + 1]!;
    if (t < a.dep) return rest(a, t);
    if (t < b.arr) return hop(rest(a, a.dep), b.v, ease.inOutCubic((t - a.dep) / (b.arr - a.dep)), b.east);
  }
  const last = S[S.length - 1]!;
  if (t < last.dep) return rest(last, t);
  // hand back to the shared camera (eastward, the way the hops turned). pre1 dissolves in over [t1 - 0.6, t1] drawing
  // X.view() itself, so the return lands just before t1: the two globes converge inside the dissolve, not after it.
  const back = Math.max(0.3, X.seg.t1 - 0.04 - last.dep);
  return mixView(rest(last, last.dep), X.view(t), ease.inOutCubic(clamp((t - last.dep) / back)));
}

const montage: Segment = {
  draw(c, X) {
    const t = X.t, s = X.seg, S = stops(X);
    // sudan carries the frame to the boundary and the montage takes over at full opacity with the identical
    // globe and Tigray cards: a seamless hand-off (a layered cross-fade of identical content would dip the cards)
    if (t < s.t0) return;
    const v = montageCam(X, t, S);
    // highlights: the current place in vermilion as the camera lands; places already named stay as a quiet trace
    const hl: Highlight[] = [...lift(LIFT_HORN, hornOut(X, t)), ...hornHighlights(X, t)];
    S.forEach((st, i) => {
      const next = S[i + 1];
      const dimmed = next ? clamp((t - st.dep) / 0.3) : 0;
      st.hl.forEach((n) => {
        const tj = n === 'Afghanistan' ? X.W('Afghanistan').start - 0.1 : st.arr - 0.14;
        // the trace stays quiet: a departed place can swing in behind the headline column on the next hop
        hl.push({ name: n, alpha: appear(t, tj, 0.18) * lerp(0.82, 0.15, dimmed), outline: dimmed < 0.5 });
      });
    });
    c.fillStyle = C.night; c.fillRect(0, 0, W, H);
    const p = drawGlobe(c, { ...v, highlights: hl }, t);
    if (!p) return;
    hornOverlay(c, X, t, p, v);
    S.forEach((st, i) => {
      const here = S[i + 1] ? t < st.dep + 0.2 : true;
      const fade = S[i + 1] ? 1 - clamp((t - st.dep) / 0.2) : 1;
      pin(c, X, p, v, st.pin, st.arr - 0.16, { hot: here, text: here ? st.label : undefined, side: 'right', up: 38, size: 24, alpha: here ? lerp(0.55, 1, fade) : 0.55 });
    });
    // the running list (left): the header on "Elsewhere, violence", then each name lands on its word
    const tE = X.W('Elsewhere').start + 0.03, tV = X.W('violence').start;
    const kL = appear(t, tE, 0.4);
    if (kL > 0) {
      pill(c, s.kicker ?? 'ALSO ON THE MAP', 120, 272, { size: 15, alpha: kL });
      const hf = FONT.serif(800), hs = 72;
      const w1 = rise(c, 'Elsewhere,', 114, 364, hf, hs, PAPER(), appear(t, tE, 0.45), { track: -1.5 });
      rise(c, 'violence', 114 + w1 + measure(' ', hf, hs), 364, hf, hs, RED(), appear(t, tV, 0.45), { track: -1.5 });
      const hu = ease.outCubic(clamp((t - tV) / 0.6));
      if (hu > 0) hair(c, 120, 398, 120 + 560 * hu, 398, PAPER(0.35), 1);
      const rows: { parts: { s: string; t0: number }[]; t0: number }[] = [
        { parts: [{ s: 'Pakistan', t0: X.W('Pakistan').start }, { s: '–Afghanistan', t0: X.W('Afghanistan').start }], t0: S[0]!.arr },
        { parts: [{ s: 'Eastern', t0: X.W('eastern').start }, { s: 'DR Congo', t0: X.W('Congo').start }], t0: S[1]!.arr },
        { parts: [{ s: 'Myanmar', t0: X.W('Myanmar').start }], t0: S[2]!.arr },
        { parts: [{ s: 'Haiti', t0: X.W('Haiti').start }], t0: S[3]!.arr },
      ];
      rows.forEach((row, i) => {
        if (t < row.t0 - 0.05) return;
        const y = 466 + i * 64, cur = t < (rows[i + 1]?.t0 ?? 1e9);
        const col = cur ? PAPER() : PAPER(0.5);
        label(c, String(i + 1).padStart(2, '0'), 120, y - 10, cur ? RED() : SLATE(0.9), 17, { w: 600 });
        let xx = 172;
        const fam = FONT.serif(700), size = 52;
        row.parts.forEach((pt, j) => {
          const w = rise(c, pt.s, xx, y, fam, size, col, appear(t, pt.t0, 0.3));
          const nx = row.parts[j + 1];
          xx += w + (nx && !nx.s.startsWith('–') ? measure(' ', fam, size) : 0);
        });
      });
    }
  },
  post: kickPunch,
};

export const segments: Record<string, Segment> = { gaza, sudan, montage };

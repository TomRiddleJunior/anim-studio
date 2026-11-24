// THE GULF (5 lines) and UKRAINE (1 line).
//
// gulf    — the shared globe lands on the Gulf, framed on Iran. Title card + dated tag "28 FEB 2026"; Iran lights up on
//           "Iran"; two parallel attributed claim chips (Washington / Tehran) with a Tehran pin; a mini timeline
//           (8 APR ceasefire · 14 JUL blockade) while the camera slides to the Gulf of Oman and a dashed blockade line
//           draws on; a Hormuz close-up with a beat-stepped shipping lane and the Kpler bar pair (17.15 vs ~11.6 mb/d);
//           then a wipe on the downbeat into the Yemen plate: locator inset with a Taiz pin and the WHO counter (1,282).
// ukraine — hard cut on the downbeat back to the shared globe (mid-flight, landing on Ukraine) with the title card and
//           a struck-through CEASEFIRE; wipe on the next downbeat into the grid plate: UN HRMMU counter 2,570, +59%.
//
// The gulf→ukraine boundary is owned by this module on both sides: instead of the 0.6 s cross-fade it is a hard cut
// on the downbeat before "In Ukraine" (gulf holds full opacity until the cut; ukraine draws nothing before it).
import type { Segment, X } from '../x';
import {
  W as FW, H as FH, PAPER, INK, RED, SLATE, NIGHT, FONT, text, label, source, hair, pill, scrim,
  appear, vanish, clamp, ease, lerp, measure, rgbaHex, C,
} from '../kit';
import { drawGlobe, country, type GlobeView, type Pin } from '../globe';
import { geoMercator, geoPath, geoContains, type GeoProjection } from 'd3-geo';
import { merge } from 'topojson-client';
import world50 from 'world-atlas/countries-50m.json';

// ------------------------------------------------------------------------------------------------ shared helpers
const ww = (X: X, q: string, n = 0) => X.W(q, n).start;
const we = (X: X, q: string, n = 0) => X.W(q, n).end;

/** Snap a word time to the nearest beat when it is within `tol` s (cuts land on the grid, never late on the word). */
function snapBeat(X: X, t: number, tol = 0.14) {
  const b = Math.round(X.beat(t)), tb = X.tBeat(b);
  return Math.abs(tb - t) <= tol ? tb : t;
}
/** The gulf→ukraine cut: the downbeat at/before Ukraine's first word. */
function ukraineCut(X: X) {
  const u = X.segs.find((s) => s.id === 'ukraine');
  const v0 = u ? u.vo0 : X.seg.t1;
  return X.tBar(Math.round(X.bar(v0)));
}

/** Text revealed upward out of a clip line (outExpo k 0..1). */
function rise(c: CanvasRenderingContext2D, s: string, x: number, y: number, fam: string, size: number, col: string, k: number,
  o: { align?: CanvasTextAlign; track?: number } = {}) {
  if (k <= 0) return;
  c.save();
  const w = measure(s, fam, size, o.track ?? 0) + 40;
  const x0 = o.align === 'right' ? x - w + 20 : o.align === 'center' ? x - w / 2 : x - 20;
  c.beginPath(); c.rect(x0, y - size * 1.02, w, size * 1.32); c.clip();
  c.globalAlpha *= clamp(k * 1.6);
  text(c, s, x, y + (1 - k) * size * 0.95, fam, size, col, { align: o.align, track: o.track });
  c.restore();
}

/** Night shade over the left of the frame so type reads over the map. */
function leftShade(c: CanvasRenderingContext2D, a: number, w = 1150) {
  if (a <= 0) return;
  const g = c.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, NIGHT(0.86 * a)); g.addColorStop(0.45, NIGHT(0.62 * a)); g.addColorStop(1, NIGHT(0));
  c.fillStyle = g; c.fillRect(0, 0, w, FH);
}

/** A plate wiping in from the left with a vermilion leading edge (0.4 s outExpo from t0). Returns the wipe progress. */
function plateWipe(c: CanvasRenderingContext2D, X: X, id: string, t0: number, o: Parameters<X['plate']>[2]) {
  const k = ease.outExpo(clamp((X.t - t0) / 0.42));
  if (k <= 0) return 0;
  c.save();
  if (k < 1) { c.beginPath(); c.rect(0, 0, FW * k, FH); c.clip(); }
  X.plate(c, id, o);
  c.restore();
  if (k < 0.995) { c.fillStyle = RED(); c.fillRect(FW * k - 6, 0, 6, FH); }
  return k;
}

/** Counter value string. */
const fmt = (v: number, dec = 0) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
function counting(t: number, t0: number, d: number, to: number, dec = 0) {
  return fmt(lerp(0, to, ease.outCubic(clamp((t - t0) / d))), dec);
}

/** Zoom punch after cut times (decays over ~0.25 s). */
function punch(t: number, cuts: number[], amt = 0.035) {
  let z = 0;
  for (const tc of cuts) if (t >= tc) z = Math.max(z, amt * Math.exp(-(t - tc) / 0.12));
  return z;
}

// ------------------------------------------------------------------------------------------------ geography
const TEHRAN: [number, number] = [51.39, 35.69];
const HORMUZ: [number, number] = [56.35, 26.55];
/** Shipping lane: Persian Gulf → Strait of Hormuz → Gulf of Oman. */
const LANE: [number, number][] = [[50.4, 27.2], [52.5, 26.5], [54.7, 26.2], [55.8, 26.45], [56.35, 26.62], [56.8, 26.3], [57.25, 25.55], [58.3, 24.9], [59.6, 24.3]];
/** Blockade line across the Gulf of Oman / Arabian Sea approaches (schematic). */
const BLOCKADE: [number, number][] = [[59.85, 22.55], [60.6, 23.6], [61.55, 25.05]];

/**
 * Ukraine within its internationally recognised borders. Natural Earth (world-atlas 50m) files Crimea under Russia, so
 * highlighting 'Ukraine' alone would draw Russia's annexation as fact. Merge Crimea (the Russia polygon containing
 * Simferopol) into Ukraine with the shared arcs dissolved, so the fill has no seam at the isthmus.
 */
let ukraineGeo: any | null | undefined;
function ukraineWhole(): any | null {
  if (ukraineGeo !== undefined) return ukraineGeo;
  try {
    const topo = world50 as any, geoms: any[] = topo.objects.countries.geometries;
    const ua = geoms.find((g) => g.properties?.name === 'Ukraine'), ru = geoms.find((g) => g.properties?.name === 'Russia');
    const ruF = country('russia');
    const k = ru && ruF?.geometry?.type === 'MultiPolygon'
      ? (ruF.geometry.coordinates as any[]).findIndex((poly) => geoContains({ type: 'Polygon', coordinates: poly } as any, [34.1, 44.95]))
      : -1;
    ukraineGeo = ua && k >= 0 ? merge(topo, [ua, { type: 'Polygon', arcs: ru.arcs[k] }]) : country('ukraine');
  } catch { ukraineGeo = country('ukraine'); }
  return ukraineGeo;
}

/** Months of 2026 (day-of-year at the 1st). */
const DOY0 = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const doy = (m: number, d: number) => DOY0[m - 1]! + d;

// ------------------------------------------------------------------------------------------------ gulf camera
type D = [number, number, number];
const mixD = (a: D, b: D, u: number): D => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
function gulfCam(X: X): GlobeView {
  const v = X.view();
  const D0: D = [0, 0, 1], IRAN: D = [-1, 4.5, 0.85], OMAN: D = [1.9, 1.5, 1.0], STRAIT: D = [0.25, 2.2, 1.36];
  let d = mixD(D0, IRAN, ease.inOutCubic(X.u(X.seg.t0, X.seg.t0 + 1.5)));
  const cf = ww(X, 'ceasefire'), tk = ww(X, 'Tanker'), ym = ww(X, 'Yemen');
  d = mixD(d, OMAN, ease.inOutCubic(X.u(cf - 0.1, cf + 1.4)));
  d = mixD(d, STRAIT, ease.inOutCubic(X.u(tk - 0.05, tk + 1.3)));
  d = mixD(d, D0, ease.inOutCubic(X.u(ym + 0.6, ym + 2.0))); // hidden under the plate: hand the camera back
  return { ...v, lon: v.lon + d[0], lat: v.lat + d[1], r: v.r * d[2] };
}

/** Projected polyline, drawn on to fraction u, optionally dashed with an offset. */
function geoLine(c: CanvasRenderingContext2D, p: GeoProjection, pts: [number, number][], u: number, col: string, w: number, dash?: [number, number], off = 0) {
  if (u <= 0) return;
  const xy = pts.map((q) => p(q)).filter((q): q is [number, number] => !!q);
  if (xy.length < 2) return;
  const seg: number[] = []; let L = 0;
  for (let i = 1; i < xy.length; i++) { const l = Math.hypot(xy[i]![0] - xy[i - 1]![0], xy[i]![1] - xy[i - 1]![1]); seg.push(l); L += l; }
  let left = L * clamp(u);
  c.save(); c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
  if (dash) { c.setLineDash(dash); c.lineDashOffset = -off; }
  c.beginPath(); c.moveTo(xy[0]![0], xy[0]![1]);
  for (let i = 1; i < xy.length && left > 0; i++) {
    const f = Math.min(1, left / seg[i - 1]!);
    c.lineTo(lerp(xy[i - 1]![0], xy[i]![0], f), lerp(xy[i - 1]![1], xy[i]![1], f));
    left -= seg[i - 1]!;
  }
  c.stroke(); c.restore();
}

// ------------------------------------------------------------------------------------------------ gulf graphics
function titleCard(c: CanvasRenderingContext2D, X: X, t0: number, tOut: number, x: number, y: number, size: number, lines: string[]) {
  const t = X.t, out = vanish(t, tOut, 0.28);
  if (t < t0 || out <= 0) return;
  c.save(); c.globalAlpha *= out; c.translate(0, -(1 - out) * 20);
  const kp = appear(t, t0, 0.45);
  c.save(); c.globalAlpha *= kp; c.translate((1 - kp) * -16, 0);
  pill(c, X.seg.kicker ?? '', x, y - size * 1.25, { size: 15 });
  c.restore();
  lines.forEach((s, i) => rise(c, s, x, y + i * size * 1.04, FONT.serif(800), size, PAPER(), appear(t, t0 + 0.08 + i * 0.1, 0.55), { track: -size * 0.015 }));
  c.restore();
}

/** Two parallel attributed claim chips. */
function claimChip(c: CanvasRenderingContext2D, x: number, y: number, w: number, k: number, kLine: number, who: string, verb: string, claim: string, sub: string) {
  if (k <= 0) return;
  const h = 178;
  c.save(); c.globalAlpha *= clamp(k * 1.4); c.translate(0, (1 - k) * 18);
  c.fillStyle = NIGHT(0.82); c.fillRect(x, y, w, h);
  c.strokeStyle = PAPER(0.16); c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  c.fillStyle = PAPER(0.92); c.fillRect(x, y, w * ease.outCubic(clamp(k)), 3);
  const lw = label(c, who, x + 26, y + 44, PAPER(0.96), 15, { w: 600 });
  label(c, verb, x + 26 + lw + 10, y + 44, SLATE(0.95), 15);
  const cw = text(c, claim, x + 24, y + 112, FONT.serif(700), 56, PAPER(), { track: -0.6 });
  // underline below the descenders ("Aggression")
  if (kLine > 0) hair(c, x + 26, y + 134, x + 26 + (cw - 4) * ease.outCubic(kLine), y + 134, PAPER(0.55), 1.5);
  label(c, sub, x + 26, y + 156, SLATE(0.95), 12);
  c.restore();
}

function timeline(c: CanvasRenderingContext2D, X: X, x0: number, x1: number, y: number) {
  const t = X.t;
  const tA = ww(X, 'A ceasefire'), tCf = ww(X, 'ceasefire'), tFr = ww(X, 'froze'), tBl = ww(X, 'blockade'), tHo = ww(X, 'holds');
  const tOut = ww(X, 'Tanker') + 0.05;
  const k = Math.min(appear(t, tA - 0.05, 0.4), vanish(t, tOut, 0.25));
  if (k <= 0) return;
  const d0 = doy(2, 1), d1 = doy(10, 18);
  const xd = (m: number, d: number) => lerp(x0, x1, (doy(m, d) - d0) / (d1 - d0));
  c.save(); c.globalAlpha *= k;
  // axis + months
  const ua = ease.outCubic(clamp((t - tA) / 0.55));
  hair(c, x0, y, lerp(x0, x1, ua), y, PAPER(0.35), 1);
  ['FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', ''].forEach((m, i) => {
    const xx = xd(i + 2, 1), km = clamp((ua - (xx - x0) / (x1 - x0)) * 6);
    if (km <= 0) return;
    hair(c, xx, y, xx, y + 8, PAPER(0.35 * km));
    label(c, m, xx + 4, y + 26, SLATE(0.85 * km), 11);
  });
  // today
  label(c, '18 OCT', x1, y + 26, PAPER(0.8 * clamp((ua - 0.95) * 20)), 11, { align: 'right', w: 600 });
  // war: 28 Feb → 8 Apr (solid), then frozen (dashed) from the ceasefire
  const xW = xd(2, 28), xC = xd(4, 8), xB = xd(7, 14);
  const uw = ease.outCubic(clamp((t - tA - 0.1) / 0.4));
  c.fillStyle = PAPER(0.85); c.fillRect(xW, y - 4, (xC - xW) * uw, 8);
  dot(c, xW, y, 6, PAPER(), uw);
  tag(c, xW, y - 26, '28 FEB', 'WAR BEGINS', uw, PAPER(0.8), 'above');
  label(c, 'THE WAR SO FAR · 2026', x0, y - 100, PAPER(0.9 * clamp(ua * 2)), 13, { w: 600 });
  const kc = appear(t, tCf - 0.04, 0.35);
  if (kc > 0) {
    ring(c, xC, y, 8, PAPER(), kc);
    tag(c, xC, y - 26, '8 APR', 'CEASEFIRE', kc, PAPER(), 'above');
    const uf = ease.inOutQuad(clamp((t - tFr) / 0.9));
    c.save(); c.setLineDash([3, 6]); hair(c, xC + 9, y, lerp(xC + 9, x1, uf), y, PAPER(0.9), 2); c.restore();
  }
  const kb = appear(t, tBl - 0.04, 0.35);
  if (kb > 0) {
    const ub = ease.outCubic(clamp((t - tBl) / Math.max(0.3, tHo - tBl + 0.1)));
    c.fillStyle = RED(); c.fillRect(xB, y - 5, (x1 - xB) * ub, 10);
    dot(c, xB, y, 8, RED(), kb);
    tag(c, xB, y - 26, '14 JUL', 'US BLOCKADE REINSTATED', kb, RED(), 'above');
    const kh = appear(t, tHo, 0.3);
    if (kh > 0) { c.save(); c.globalAlpha *= kh; c.fillStyle = RED(); c.beginPath(); c.moveTo(x1 + 2, y - 11); c.lineTo(x1 + 16, y); c.lineTo(x1 + 2, y + 11); c.fill(); c.restore(); }
  }
  source(c, 'UK HOUSE OF COMMONS LIBRARY · AXIOS · 2026', x0, y + 56, SLATE(0.95), { alpha: clamp(ua * 2) });
  c.restore();
}
function dot(c: CanvasRenderingContext2D, x: number, y: number, r: number, col: string, k: number) {
  if (k <= 0) return; c.fillStyle = col; c.beginPath(); c.arc(x, y, r * ease.outBack(clamp(k)), 0, Math.PI * 2); c.fill();
}
function ring(c: CanvasRenderingContext2D, x: number, y: number, r: number, col: string, k: number) {
  if (k <= 0) return; c.fillStyle = NIGHT(); c.strokeStyle = col; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, r * ease.outBack(clamp(k)), 0, Math.PI * 2); c.fill(); c.stroke();
}
function tag(c: CanvasRenderingContext2D, x: number, y: number, date: string, what: string, k: number, col: string, where: 'above' | 'below') {
  if (k <= 0) return;
  c.save(); c.globalAlpha *= clamp(k * 1.3); c.translate(0, (1 - k) * (where === 'above' ? 10 : -10));
  if (where === 'above') {
    hair(c, x, y + 12, x, y + 18, col, 1);
    label(c, date, x - 2, y - 26, SLATE(0.95), 11);
    text(c, what, x - 2, y, FONT.sans(600), 19, col);
  } else {
    label(c, date, x - 2, y - 22, SLATE(0.95), 11);
    text(c, what, x - 2, y + 2, FONT.sans(600), 17, col);
  }
  c.restore();
}

function barPair(c: CanvasRenderingContext2D, X: X, x: number, base: number, tOut: number) {
  const t = X.t;
  const tTk = ww(X, 'Tanker'), tHz = ww(X, 'Hormuz'), tFl = ww(X, 'flows'), t30 = ww(X, '30%'), tBw = ww(X, 'below');
  const k = Math.min(appear(t, tTk + 0.05, 0.4), vanish(t, tOut, 0.25));
  if (k <= 0) return;
  const hmax = 360, cw = 150, gap = 64, x2 = x + cw + gap;
  const h1 = hmax, h2 = hmax * (11.6 / 17.15);
  c.save(); c.globalAlpha *= k;
  // header
  label(c, 'OIL THROUGH THE STRAIT OF HORMUZ', x, base - hmax - 118, PAPER(0.95), 15, { w: 600 });
  label(c, 'MILLION BARRELS PER DAY', x, base - hmax - 94, SLATE(0.95), 12);
  hair(c, x, base, x + 2 * cw + gap + 200, base, PAPER(0.4), 1);
  // pre-war column (the baseline)
  const u1 = ease.outCubic(clamp((t - tHz) / 0.6)), beat = X.hit('kick', t, 0.12);
  if (u1 > 0) {
    c.fillStyle = PAPER(0.14); c.fillRect(x, base - h1 * u1, cw, h1 * u1);
    c.strokeStyle = PAPER(0.6); c.lineWidth = 1.2; c.strokeRect(x + 0.5, base - h1 * u1 + 0.5, cw - 1, h1 * u1);
    text(c, '17.15', x, base - h1 * u1 - 16, FONT.serif(700), 58, PAPER(clamp(u1 * 2)), { track: -1 });
  }
  label(c, 'PRE-WAR', x, base + 30, PAPER(0.85 * clamp(u1 * 3)), 13, { w: 600 });
  label(c, 'BASELINE', x, base + 50, SLATE(0.9 * clamp(u1 * 3)), 12);
  // now column
  const u2 = ease.outCubic(clamp((t - tFl) / 0.7));
  if (u2 > 0) {
    c.fillStyle = RED(); c.fillRect(x2, base - h2 * u2, cw, h2 * u2);
    c.fillStyle = rgbaHex(C.hot, 0.35 * beat); c.fillRect(x2, base - h2 * u2, cw, h2 * u2);
    label(c, 'ABOUT', x2, base - h2 * u2 - 70, RED(clamp(u2 * 2)), 11, { w: 600 });
    text(c, '11.6', x2, base - h2 * u2 - 16, FONT.serif(700), 58, RED(clamp(u2 * 2.5 - 0.6)), { track: -1 });
  }
  label(c, 'WEEK TO 13 OCT', x2, base + 30, PAPER(0.85 * clamp(u2 * 3)), 13, { w: 600 });
  label(c, '2026', x2, base + 50, SLATE(0.9 * clamp(u2 * 3)), 12);
  // the gap
  const u3 = ease.outCubic(clamp((t - t30 + 0.06) / 0.45));
  if (u3 > 0) {
    const yTop = base - h1, yNow = base - h2, bx = x2 + cw + 22;
    c.save(); c.setLineDash([5, 6]); hair(c, x + cw, yTop, lerp(x + cw, bx + 10, u3), yTop, PAPER(0.7), 1.2); c.restore();
    hair(c, bx, yTop, bx, lerp(yTop, yNow, u3), RED(), 2);
    hair(c, bx - 6, yTop, bx + 6, yTop, RED(), 2);
    if (u3 > 0.98) hair(c, bx - 6, yNow, bx + 6, yNow, RED(), 2);
    const ym = (yTop + yNow) / 2;
    c.save(); c.globalAlpha *= u3;
    // the sung phrase, verbatim: "about 30% below pre-war" (no minus sign: "−30% below" would be a double negative)
    label(c, 'ABOUT', bx + 24, ym - 30, RED(), 11, { w: 600 });
    text(c, '30%', bx + 20, ym + 16, FONT.serif(700), 52, RED(), { track: -1 });
    const kp = appear(t, tBw - 0.05, 0.3);
    label(c, 'BELOW PRE-WAR', bx + 24, ym + 44, PAPER(0.9 * kp), 11, { w: 600 });
    c.restore();
  }
  source(c, 'KPLER VIA TRADING ECONOMICS · WEEK TO 13 OCT 2026', x, base + 88, SLATE(0.95), { alpha: clamp(u1 * 2) });
  c.restore();
}

// ------------------------------------------------------------------------------------------------ yemen inset
const YEMEN_NEIGHBOURS = ['saudi arabia', 'oman', 'eritrea', 'djibouti', 'somalia', 'somaliland', 'ethiopia', 'sudan', 'united arab emirates'];
let insetCache: { key: string; p: GeoProjection } | null = null;
function insetProj(x: number, y: number, w: number, h: number) {
  const key = `${x},${y},${w},${h}`;
  if (insetCache?.key === key) return insetCache.p;
  const ye = country('yemen');
  const p = geoMercator();
  if (ye) p.fitExtent([[x + 34, y + 30], [x + w - 20, y + h - 22]], ye);
  insetCache = { key, p };
  return p;
}
/**
 * Ink-on-paper locator: Yemen in ink, its neighbours in tint. The lyric names the two parties ("Houthi-Saudi"), not a
 * place, so the inset carries no city pin (pins land only on the words that name them): on "Houthi-Saudi" Saudi Arabia
 * firms up, on "war" the caption's first half lands, on "back" its date ("resumed Jul 2026", fact 5).
 */
function yemenInset(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, k: number, kSaudi: number, kWar: number, kBack: number) {
  if (k <= 0) return;
  const p = insetProj(x, y, w, h), path = geoPath(p, c);
  c.save(); c.globalAlpha *= clamp(k * 1.3); c.translate(0, (1 - k) * 14);
  c.fillStyle = PAPER(0.94); c.fillRect(x, y, w, h);
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  for (const n of YEMEN_NEIGHBOURS) {
    const f = country(n); if (!f) continue;
    const sa = n === 'saudi arabia' ? kSaudi : 0;
    c.beginPath(); path(f); c.fillStyle = INK(0.1 + 0.12 * sa); c.fill(); c.strokeStyle = INK(0.35); c.lineWidth = 0.7; c.stroke();
  }
  const ye = country('yemen');
  if (ye) { c.beginPath(); path(ye); c.fillStyle = INK(0.88); c.fill(); }
  label(c, 'SAUDI ARABIA', x + w * 0.52, y + 30, INK(0.45 + 0.4 * kSaudi), 10, { align: 'center', w: kSaudi > 0.5 ? 600 : 500 });
  c.restore();
  c.strokeStyle = INK(0.55); c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  label(c, 'YEMEN', x, y - 14, INK(0.9), 14, { w: 600 });
  if (kWar > 0) {
    const s1 = 'HOUTHI–SAUDI WAR', yc = y + h + 30;
    c.save(); c.globalAlpha *= kWar; c.translate(0, (1 - kWar) * 8);
    const w1 = label(c, s1, x, yc, INK(0.92), 13, { w: 600 });
    c.restore();
    if (kBack > 0) {
      c.save(); c.globalAlpha *= kBack; c.translate((1 - kBack) * -8, 0);
      label(c, '· RESUMED JUL 2026', x + w1 + 10, yc, INK(0.75), 13, { w: 600 });
      c.restore();
    }
  }
  c.restore();
}

// ------------------------------------------------------------------------------------------------ segments
export const segments: Record<string, Segment> = {
  gulf: {
    draw(c, X) {
      const t = X.t, cutU = ukraineCut(X);
      if (t >= cutU) return; // the ukraine segment has cut in, opaque
      if (t > X.seg.t1) c.globalAlpha = 1; // hold to the downbeat cut (this module owns both sides of the boundary)

      const tFeb = ww(X, 'February'), tIran = ww(X, 'Iran'), tWar = ww(X, 'war'), tKill = ww(X, 'killed');
      const tWash = ww(X, 'Washington'), tSelf = ww(X, 'self-defence'), tTeh = ww(X, 'Tehran'), tAgg = ww(X, 'aggression');
      const tCf = ww(X, 'ceasefire'), tFroze = ww(X, 'froze'), tBlk = ww(X, 'blockade'), tTk = ww(X, 'Tanker'), tHz = ww(X, 'Hormuz'), tFl = ww(X, 'oil');
      const tYem = snapBeat(X, ww(X, 'Yemen'));
      const tTitle = snapBeat(X, tFeb - 0.12, 0.2); // the beat just before "In February"
      const tTitleOut = tIran - 0.18;

      // ---------------- globe (until the Yemen plate has fully wiped in)
      if (t < tYem + 0.5) {
        const v = gulfCam(X);
        const kIran = ease.outCubic(clamp((t - tIran + 0.05) / 0.4));
        const frozen = ease.inOutQuad(clamp((t - tFroze) / 0.8));
        const chart = ease.inOutQuad(clamp((t - tTk) / 0.6)); // the flow chart's red bar becomes the frame's hot value
        const iranA = kIran * (lerp(lerp(0.92, 0.55, frozen), 0.3, chart) + 0.08 * X.hit('kick') * (1 - chart));
        const pins: Pin[] = [{ lon: TEHRAN[0], lat: TEHRAN[1], text: 'TEHRAN', t0: tTeh - 0.05, side: 'right' }];
        if (t > tHz - 0.1) pins.push({ lon: HORMUZ[0], lat: HORMUZ[1], text: 'STRAIT OF HORMUZ', t0: tHz - 0.05, side: 'right' });
        const pinsShown = pins.filter((pn) => !(pn.text === 'TEHRAN' && t > tCf - 0.1));
        const p = drawGlobe(c, { ...v, highlights: kIran > 0 ? [{ name: 'Iran', alpha: iranA }] : [], pins: pinsShown }, t);
        if (p) {
          // IRAN label on the country
          const li = p([55.2, 32.6]);
          if (li && kIran > 0) {
            const kl = Math.min(appear(t, tIran, 0.45), vanish(t, tTk, 0.3));
            label(c, 'IRAN', li[0], li[1], PAPER(0.95 * kl), 26, { align: 'center', w: 600 });
          }
          // blockade line + label (from "blockade"), the lane (from "oil")
          const ub = ease.inOutCubic(clamp((t - tBlk + 0.05) / 0.6));
          if (ub > 0) {
            const dim = lerp(1, 0.5, ease.inOutQuad(X.u(tTk, tTk + 0.6))); // recedes once the flow data takes over
            geoLine(c, p, BLOCKADE, ub, RED(dim), 3.2, [10, 8], 0);
            const lb = p(BLOCKADE[BLOCKADE.length - 1]!);
            if (lb) label(c, 'US BLOCKADE', lb[0] + 16, lb[1] - 6, RED(clamp(ub * 2) * dim), 14, { w: 600 });
          }
          const ul = ease.inOutCubic(clamp((t - tFl) / 0.9));
          if (ul > 0) {
            const b = X.beat(), step = Math.floor(b) + ease.outExpo(b - Math.floor(b)); // dashes step forward on every beat
            geoLine(c, p, LANE, 1, PAPER(0.18 * ul), 7);
            geoLine(c, p, LANE, ul, PAPER(0.9), 2.2, [14, 10], step * 24);
          }
        }
        leftShade(c, 1);

        // ---------------- line 1: title card + dated tag
        titleCard(c, X, tTitle, tTitleOut, 120, 330, 84, ['A war on pause,', 'a strait under fire']);
        {
          const kIn = appear(t, tFeb - 0.03, 0.5), out = vanish(t, tWash - 0.08, 0.28);
          if (kIn > 0 && out > 0) {
            // the dated tag rises into the headline's place as the headline leaves
            const m = ease.inOutCubic(clamp((t - tTitleOut) / 0.55));
            const y = lerp(560, 360, m), size = lerp(46, 92, m);
            c.save(); c.globalAlpha *= out;
            c.fillStyle = RED(); c.fillRect(120, y - size * 0.86 - 22, lerp(0, 64, ease.outCubic(kIn)), 4);
            rise(c, '28 FEB 2026', 118, y, FONT.serif(700), size, PAPER(), kIn, { track: -size * 0.01 });
            const kW = appear(t, tWar, 0.4), kK = appear(t, tKill, 0.4);
            c.save(); c.globalAlpha *= kW; text(c, 'US AND ISRAELI STRIKES BEGIN THE WAR', 122, y + 50, FONT.mono(500), 17, PAPER(0.92), { track: 2.2 }); c.restore();
            c.save(); c.globalAlpha *= kK; text(c, 'SUPREME LEADER KILLED', 122, y + 80, FONT.mono(600), 17, PAPER(), { track: 2.2 }); c.restore();
            source(c, 'UK HOUSE OF COMMONS LIBRARY · CFR · OCT 2026', 122, y + 120, SLATE(0.95), { alpha: kW });
            c.restore();
          }
        }

        // ---------------- line 2: Washington / Tehran
        {
          const out = vanish(t, tCf - 0.04, 0.26);
          const k1 = appear(t, tWash - 0.04, 0.45), k2 = appear(t, tTeh - 0.04, 0.45);
          if (out > 0 && k1 > 0) {
            c.save(); c.globalAlpha *= out;
            label(c, 'TWO READINGS OF THE SAME WAR', 120, 280, SLATE(0.95 * k1), 13, { w: 600 });
            claimChip(c, 120, 304, 400, k1, clamp((t - tSelf) / 0.5), 'WASHINGTON', 'CITES', 'Self-defence', 'UNDER THE UN CHARTER');
            claimChip(c, 544, 304, 400, k2, clamp((t - tAgg) / 0.5), 'TEHRAN', 'CALLS IT', 'Aggression', 'IN BREACH OF THE UN CHARTER');
            source(c, 'UK HOUSE OF COMMONS LIBRARY · CFR · 2026', 120, 516, SLATE(0.95), { alpha: k1 });
            c.restore();
          }
        }

        // ---------------- line 3: the timeline
        timeline(c, X, 140, 1060, 800);

        // ---------------- line 4: the bar pair
        barPair(c, X, 140, 750, tYem);
      }

      // ---------------- line 5: Yemen plate, wiping in on the downbeat
      if (t >= tYem) {
        const tBack = ww(X, 'back'), tWho = ww(X, 'WHO'), tCounts = ww(X, 'counts'), t1200 = ww(X, '1,200');
        plateWipe(c, X, 'yemen_highlands', tYem, { a: tYem, b: X.seg.t1 + 1.2, z: [1.03, 1.09], x: [0.012, -0.004] });
        // paper pool behind the type (top-left sky)
        scrim(c, 120, 150, 470, 520, 0.55 * appear(t, tYem + 0.2, 0.5), '243,239,230');
        const kIn = appear(t, tYem + 0.18, 0.5);
        yemenInset(c, 140, 168, 380, 210, kIn, appear(t, ww(X, 'Houthi-Saudi') - 0.05, 0.4), appear(t, ww(X, 'war', 1) - 0.05, 0.4), appear(t, tBack - 0.04, 0.35));
        // WHO counter
        const kc = appear(t, tWho - 0.05, 0.45);
        if (kc > 0) {
          c.save(); c.globalAlpha *= kc; c.translate(0, (1 - kc) * 16);
          label(c, 'WHO COUNTS', 140, 452, INK(0.75), 14, { w: 600 });
          label(c, 'DEAD IN YEMEN · 6 AUG–11 OCT 2026', 140, 474, INK(0.95), 14, { w: 600 });
          const cStart = tCounts - 0.1, dur = Math.max(0.6, t1200 + 0.3 - cStart);
          const s = counting(t, cStart, dur, 1282);
          const pulse = 1 + 0.03 * ease.outCubic(clamp(1 - (t - (cStart + dur)) / 0.3)) * (t > cStart + dur ? 1 : 0);
          const kn = appear(t, cStart - 0.08, 0.3);
          if (kn > 0) {
            c.save(); c.globalAlpha *= kn; c.translate(136, 608 + (1 - kn) * 20); c.scale(pulse, pulse);
            text(c, s, 0, 0, FONT.serif(700), 150, RED(), { track: -3 });
            c.restore();
          }
          const wNum = measure('1,282', FONT.serif(700), 150, -3);
          hair(c, 140, 632, 140 + wNum * ease.outCubic(clamp((t - cStart) / dur)), 632, INK(0.45), 1);
          source(c, 'WHO / HEALTH CLUSTER SITREP #7 · 13 OCT 2026', 140, 658, INK(0.7));
          c.restore();
        }
      }
    },
    post(X, o) {
      const t = X.t;
      const tYem = snapBeat(X, ww(X, 'Yemen'));
      const z = punch(t, [tYem], 0.03) + 0.006 * X.hit('kick', t, 0.1);
      return { ...o, zoom: (o.zoom ?? 1) * (1 + z) };
    },
  },

  ukraine: {
    draw(c, X) {
      const t = X.t, cut = ukraineCut(X);
      if (t < cut) return;
      const tUkr = ww(X, 'Ukraine'), tNo = ww(X, 'no'), tUN = ww(X, 'UN'), tNum = ww(X, '2,570');
      const tCiv = ww(X, 'civilians'), tYear = ww(X, 'this'), tSep = ww(X, 'September'), tUp = ww(X, 'up'), t59 = ww(X, '59%');
      const cut2 = X.tBar(Math.floor(X.bar(tNum))); // the downbeat before the number

      // ---------------- the globe, landing on Ukraine, with the title card
      if (t < cut2 + 0.5) {
        const v = X.view();
        const kU = ease.outCubic(clamp((t - tUkr + 0.05) / 0.4));
        const p = drawGlobe(c, { ...v, highlights: [] }, t);
        if (p) {
          // the highlight, drawn over the globe (same look as drawGlobe's: 0.9 fill + hot outline), Crimea included
          const ua = kU > 0 ? ukraineWhole() : null;
          if (ua) {
            const a = kU * (0.9 + 0.1 * X.hit('kick')), path = geoPath(p, c);
            c.beginPath(); path(ua);
            c.fillStyle = rgbaHex(C.red, a * 0.9); c.fill();
            c.strokeStyle = rgbaHex(C.hot, a); c.lineWidth = 1.3; c.stroke();
          }
          const lu = p([31.6, 49.2]), lr = p([39.5, 53.6]);
          if (lu) label(c, 'UKRAINE', lu[0], lu[1], PAPER(0.95 * kU), 22, { align: 'center', w: 600 });
          if (lr) label(c, 'RUSSIA', lr[0], lr[1], SLATE(0.8 * kU), 15, { align: 'center' });
        }
        leftShade(c, 1, 1000);
        titleCard(c, X, cut, cut2 + 0.2, 120, 420, 92, ['A winter war', 'on the grid']);
        // CEASEFIRE, struck through on "no"
        const kc = Math.min(appear(t, tNo - 0.15, 0.35), vanish(t, cut2 + 0.2, 0.25));
        if (kc > 0) {
          c.save(); c.globalAlpha *= kc;
          const w = text(c, 'CEASEFIRE', 122, 640, FONT.mono(600), 30, PAPER(lerp(0.95, 0.62, clamp((t - tNo - 0.3) / 0.4))), { track: 6 });
          const us = ease.outExpo(clamp((t - tNo) / 0.35));
          c.fillStyle = RED(); c.fillRect(116, 628, (w + 4) * us, 5);
          label(c, 'NONE IN FORCE', 122, 676, RED(clamp((t - tNo - 0.25) / 0.3)), 13, { w: 600 });
          c.restore();
        }
      }

      // ---------------- the grid plate + the UN HRMMU counter
      if (t >= cut2) {
        plateWipe(c, X, 'ukraine_grid', cut2, { a: cut2, b: X.seg.t1 + 0.8, z: [1.03, 1.09], x: [-0.01, 0.006], duo: 0.28 });
        const x = 620, NS = 190; // counter size: leaves the +59% chip clear of the pylon
        scrim(c, x - 20, 170, 560, 360, 0.55 * appear(t, cut2 + 0.15, 0.5));
        const k = appear(t, cut2 + 0.08, 0.45);
        c.save(); c.globalAlpha *= k; c.translate(0, (1 - k) * 14);
        label(c, 'UN MONITORS · HRMMU', x, 200, PAPER(0.9), 15, { w: 600 });
        // the count lands on "2,570"
        const cStart = tNum - 0.05, dur = 1.0;
        const s = counting(t, cStart, dur, 2570);
        const land = t > cStart + dur ? ease.outCubic(clamp(1 - (t - (cStart + dur)) / 0.35)) : 0;
        const kn = appear(t, cStart - 0.08, 0.3);
        if (kn > 0) {
          c.save(); c.globalAlpha *= kn; c.translate(x - 6, 392 + (1 - kn) * 24); c.scale(1 + 0.025 * land, 1 + 0.025 * land);
          text(c, s, 0, 0, FONT.serif(700), NS, PAPER(), { track: -4 });
          c.restore();
        }
        const wNum = measure('2,570', FONT.serif(700), NS, -4);
        hair(c, x, 430, x + wNum * ease.outCubic(clamp((t - cStart) / dur)), 430, PAPER(0.4), 1);
        const kc = appear(t, tCiv - 0.04, 0.4);
        c.save(); c.globalAlpha *= kc; text(c, 'civilians killed', x, 480, FONT.serif(600), 44, PAPER(), { track: -0.5 }); c.restore();
        const ky = appear(t, tYear - 0.04, 0.4);
        const wc = measure('civilians killed', FONT.serif(600), 44, -0.5);
        c.save(); c.globalAlpha *= ky; label(c, 'JAN–SEP 2026', x + wc + 22, 478, PAPER(0.9), 16, { w: 600 }); c.restore();
        source(c, 'UN HRMMU · 16 OCT 2026', x, 512, SLATE(0.95), { alpha: kc });
        c.restore();
        // +59% y/y
        const k5 = appear(t, tUp - 0.06, 0.4);
        if (k5 > 0) {
          const xr = x + wNum + 18, yr = 252, wr = 186, hr = 128;
          c.save(); c.globalAlpha *= clamp(k5 * 1.5); c.translate(0, (1 - k5) * 14);
          c.fillStyle = NIGHT(0.9); c.fillRect(xr, yr, wr, hr);
          c.fillStyle = RED(); c.fillRect(xr, yr, wr * ease.outCubic(k5), 3);
          rise(c, '+59%', xr + 14, yr + 78, FONT.serif(700), 64, RED(), k5, { track: -1 });
          label(c, 'VS JAN–SEP 2025', xr + 16, yr + 108, PAPER(0.92), 12, { w: 600 });
          c.restore();
        }
        void t59; void tUN; void tSep;
      }
    },
    post(X, o) {
      const t = X.t, cut = ukraineCut(X), cut2 = X.tBar(Math.floor(X.bar(ww(X, '2,570'))));
      const z = punch(t, [cut, cut2], 0.035) + 0.006 * X.hit('kick', t, 0.1);
      return { ...o, zoom: (o.zoom ?? 1) * (1 + z) };
    },
  },
};

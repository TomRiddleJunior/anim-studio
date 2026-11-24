// SEGMENTS · aid, ballots, economy — the second verse of "Under Strain" (stories 5–7 of the World Briefing).
//
// aid      warehouse plate + title on the cut that opens the verse → aid bars on "funding … down almost 30%" (the 2025 bar
//          drops out of the 2023 bar and shrinks, leaving the lost money as a hatched ghost; the years light as sung)
//          → night globe pushing into DR Congo on "In Congo" → Ebola clinic plate with the WHO counters on "9,000"
//          → NO APPROVED VACCINE stamp on "No".
// ballots  (holds aid's last frame until a hard cut on "Hungary's") ballots plate + a results board in ink (Hungary,
//          then Bangladesh · Nepal, every part landing on its word) → globe over South America on "Right-wing"
//          (Chile, Peru, Colombia light as named) → Brazil split bar on "Brazil's", runoff note on "too close".
// economy  (holds the Brazil frame until the beat before "An oil shock") oil/chip plate with a night card that turns its
//          pages on the words: title → Brent (on "Brent", y/y tag on "80%") → policy-rate stairs (on "Fed", "ECB",
//          the risers rise on "raising").
//
// Cuts between these three segments are hard cuts on words: the later segment draws the earlier one's frame (a pure
// function of t, so identical) until its cut. Every number is from research/FACTSHEET.md, printed with its source.
import type { Segment, X } from '../x';
import type { PostOverrides } from '../../engine/scene';
import { norm, type Word } from '../../engine/lyrics';
import { geoPath } from 'd3-geo';
import {
  C, W, H, PAPER, INK, RED, SLATE, FONT, text, label, source, scrim, hair, appear, vanish, countTo, clamp, ease, lerp,
  measure, rrect,
} from '../kit';
import { drawGlobe, country, type GlobeView } from '../globe';

type Ctx = CanvasRenderingContext2D;

// ================================================================== helpers
/** X re-targeted at another segment of this module (its words, its seg info) — used to draw a neighbour's frame. */
function asSeg(X: X, id: string): X {
  const seg = X.segs.find((s) => s.id === id) ?? X.seg;
  const lines = X.ly.lines.filter((l) => l.section === id);
  const words = lines.flatMap((l) => l.words);
  const Wf = (q: string, nth = 0): Word => {
    const qs = q.split(/\s+/).map(norm).filter(Boolean);
    let seen = 0;
    for (let i = 0; i + qs.length <= words.length; i++) {
      if (qs.every((qq, j) => norm(words[i + j]!.w) === qq) && seen++ === nth) return words[i]!;
    }
    throw new Error(`word "${q}" not in segment ${id}`);
  };
  return { ...X, seg, lines, W: Wf };
}

/** Text rising into a mask (the headline entrance). Returns the width. */
function rise(c: Ctx, s: string, x: number, y: number, fam: string, size: number, col: string, k: number, o: { align?: CanvasTextAlign; track?: number } = {}) {
  const w = measure(s, fam, size, o.track ?? 0);
  if (k <= 0) return w;
  const x0 = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
  c.save();
  c.beginPath(); c.rect(x0 - 24, y - size * 1.08, w + 48, size * 1.42); c.clip();
  text(c, s, x, y + (1 - k) * size * 1.15, fam, size, col, { align: o.align, track: o.track });
  c.restore();
  return w;
}

/** Kicker pill that wipes open from the left. */
function kicker(c: Ctx, s: string, x: number, y: number, k: number, o: { fill?: string; col?: string; size?: number } = {}) {
  const size = o.size ?? 15, fam = FONT.mono(600), str = s.toUpperCase();
  const tw = measure(str, fam, size, size * 0.14) + size * 1.4;
  if (k <= 0) return tw;
  c.save();
  c.beginPath(); c.rect(x - 2, y - size * 1.4, (tw + 4) * k, size * 2.2); c.clip();
  c.fillStyle = o.fill ?? RED(); rrect(c, x, y - size * 1.2, tw, size * 1.75, size * 0.9); c.fill();
  text(c, str, x + size * 0.7, y, fam, size, o.col ?? PAPER(), { track: size * 0.14 });
  c.restore();
  return tw;
}

/** Split a headline into ≤2 lines: before " and " when it has one, else the most balanced break. */
function headLines(s: string, fam: string, size: number, maxW: number): string[] {
  if (measure(s, fam, size) <= maxW) return [s];
  const i = s.indexOf(' and ');
  if (i > 0) return [s.slice(0, i), s.slice(i + 1)];
  const ws = s.split(' ');
  let best: string[] = [s], bw = Infinity;
  for (let k = 1; k < ws.length; k++) {
    const a = ws.slice(0, k).join(' '), b = ws.slice(k).join(' ');
    const m = Math.max(measure(a, fam, size), measure(b, fam, size));
    if (m < bw) { bw = m; best = [a, b]; }
  }
  return best;
}

/** Story opener: kicker pill + serif headline (seg.kicker / seg.title). Returns the last baseline. */
function titleBlock(c: Ctx, X: X, x: number, y: number, t0: number, o: { size: number; col: string; maxW: number; lh?: number }) {
  const t = X.t, fam = FONT.serif(800);
  kicker(c, X.seg.kicker ?? '', x, y, appear(t, t0, 0.35));
  const lines = headLines(X.seg.title ?? '', fam, o.size, o.maxW);
  const lh = o.size * (o.lh ?? 1.02);
  let yy = y + o.size * 1.1;
  lines.forEach((l, i) => {
    rise(c, l, x, yy, fam, o.size, o.col, appear(t, t0 + 0.07 + i * 0.09, 0.6), { track: -o.size * 0.012 });
    if (i < lines.length - 1) yy += lh;
  });
  return yy;
}

/** Words of a short mono line revealed one by one on their own times. */
function wordsOn(c: Ctx, parts: [string, number][], x: number, y: number, t: number, size: number, col: (i: number) => string, o: { serif?: boolean; w?: number } = {}) {
  const fam = o.serif ? FONT.serif(o.w ?? 700) : FONT.mono(o.w ?? 600), track = o.serif ? -size * 0.01 : size * 0.12;
  let xx = x;
  parts.forEach(([s, t0], i) => {
    const str = o.serif ? s : s.toUpperCase();
    const k = appear(t, t0 - 0.03, 0.4);
    rise(c, str, xx, y, fam, size, col(i), k, { track });
    xx += measure(str + ' ', fam, size, track);
  });
  return xx - x;
}

/** Full-frame plate with a Ken Burns move and a small breath on the kick. */
function plate(c: Ctx, X: X, id: string, a: number, b: number, o: { z?: [number, number]; x?: [number, number]; y?: [number, number]; duo?: number; bg?: string } = {}) {
  c.fillStyle = o.bg ?? C.paper; c.fillRect(0, 0, W, H);
  const p = 0.006 * X.hit('kick', X.t, 0.16);
  const z = o.z ?? [1.02, 1.08];
  X.plate(c, id, { a, b, z: [z[0] + p, z[1] + p], x: o.x, y: o.y, duo: o.duo });
}

/** Diagonal hatching inside the current path (call after building a path). */
function hatchPath(c: Ctx, col: string, gap = 12, w = 1.6, off = 0) {
  c.save(); c.clip();
  c.strokeStyle = col; c.lineWidth = w; c.beginPath();
  const o = ((off % gap) + gap) % gap;
  for (let i = -H - gap + o; i < W; i += gap) { c.moveTo(i, 0); c.lineTo(i + H, H); }
  c.stroke(); c.restore();
}

/** A decaying zoom punch from t0. */
const punch = (t: number, t0: number, amp: number, hl = 0.13) => (t < t0 ? 0 : amp * Math.pow(0.5, (t - t0) / hl));

// ================================================================== AID
const AID_X = 830;

function aidDraw(c: Ctx, X: X) {
  const t = X.t;
  // a crisp cut on the beat that opens the verse (the chorus keeps the screen until then)
  const k = clamp((t - (X.seg.t0 - 0.05)) / 0.1);
  if (k <= 0) return;
  const tCongo = X.W('In').start - 0.03, tNum = X.W('9,000').start - 0.03;
  c.save(); c.globalAlpha *= k;
  if (t < tCongo) aidWarehouse(c, X, tCongo);
  else if (t < tNum) aidGlobe(c, X, tCongo);
  else aidClinic(c, X, tNum);
  c.restore();
}

function aidWarehouse(c: Ctx, X: X, tEnd: number) {
  const t = X.t, t0 = X.seg.t0;
  plate(c, X, 'aid_warehouse', t0 - 0.1, tEnd + 0.4, { z: [1.03, 1.1], x: [0.01, -0.012], duo: 0.3, bg: C.night });
  scrim(c, AID_X - 40, 150, 860, 380, 0.6);
  c.save(); c.globalAlpha *= vanish(t, tEnd, 0.25);
  titleBlock(c, X, AID_X, 170, t0, { size: 84, col: PAPER(), maxW: 920 });
  aidBars(c, X, AID_X, 342);
  c.restore();
}

function aidBars(c: Ctx, X: X, x: number, y: number) {
  const t = X.t;
  const tF = X.W('funding').start, tD = X.W('down').start, t30 = X.W('30%').start;
  const t23 = X.W('2023').start, t25 = X.W('2025').start;
  const k = appear(t, tF - 0.04, 0.35);
  if (k <= 0) return;
  c.save(); c.globalAlpha *= k;
  label(c, 'International humanitarian assistance · US$', x, y, PAPER(0.92), 15, { w: 600 });
  hair(c, x, y + 16, x + 820 * ease.outCubic(clamp((t - tF) / 0.6)), y + 16, PAPER(0.35));
  const bx = x + 92, L = 480, max = 47.4, bh = 32, vx = bx + L + 18;
  const y1 = y + 64, y2 = y + 126;
  // years light up as they are sung
  const yr = (s: string, yy: number, tw: number, hot: boolean) => {
    const lit = appear(t, tw - 0.03, 0.25);
    text(c, s, x, yy, FONT.mono(600), 22, lit > 0 ? (hot ? RED() : PAPER()) : PAPER(0.55), { track: 1 });
    if (lit > 0) { c.fillStyle = hot ? RED() : PAPER(0.9); c.fillRect(x, yy + 8, 56 * lit, 2); }
  };
  // 2023: grows on "funding"
  const u1 = ease.outExpo(clamp((t - tF) / 0.6));
  yr('2023', y1, t23, false);
  c.fillStyle = PAPER(0.9); c.fillRect(bx, y1 - 22, L * u1, bh);
  text(c, '$47.4bn', vx, y1, FONT.mono(600), 22, PAPER(), { alpha: clamp(u1 * 2 - 0.8) });
  // 2025: a copy of the 2023 bar drops into row 2 on "down", then shrinks to 33.3 by the end of "30%"
  if (t >= tD - 0.04) {
    const dr = ease.outCubic(clamp((t - tD + 0.04) / 0.28));
    const sh = ease.inOutCubic(clamp((t - tD - 0.12) / Math.max(0.35, t30 + 0.3 - tD - 0.12)));
    const len = (L * lerp(max, 33.3, sh)) / max, yy = lerp(y1, y2, dr);
    yr('2025', y2, t25, true);
    // the lost money: hatched ghost
    if (sh > 0) {
      c.beginPath(); c.rect(bx + len, yy - 22, L - len, bh);
      hatchPath(c, RED(0.55), 9, 1.4, X.beat() * 4.5);
      c.save(); c.setLineDash([5, 4]); c.strokeStyle = RED(0.9); c.lineWidth = 1.4; c.strokeRect(bx + len, yy - 22, L - len, bh); c.restore();
    }
    c.fillStyle = sh > 0.02 ? RED() : PAPER(0.9); c.fillRect(bx, yy - 22, len, bh);
    text(c, '$33.3bn', vx, y2, FONT.mono(600), 22, RED(), { alpha: clamp((sh - 0.85) * 7) });
  }
  source(c, 'Global Humanitarian Assistance Report 2026', x, y2 + 50, PAPER(0.7));
  c.restore();
}

function aidGlobe(c: Ctx, X: X, tA: number) {
  const t = X.t;
  c.fillStyle = C.night; c.fillRect(0, 0, W, H);
  const tC = X.W('Congo').start, tE = X.W('Ebola').start;
  const v0 = X.view();
  const u = ease.outExpo(clamp((t - tA) / 1.3));
  const kc = appear(t, tC - 0.03, 0.3);
  const v: GlobeView = { ...v0, lon: v0.lon - 8 * (1 - u), lat: v0.lat + 3 * (1 - u), r: v0.r * lerp(0.74, 1, u), highlights: [{ name: 'DR Congo', col: C.red, alpha: kc }] };
  const p = drawGlobe(c, v, t);
  // label + leader to the country
  scrim(c, 110, 400, 560, 160, 0.5);
  const kL = appear(t, tC - 0.03, 0.5), kE = appear(t, tE - 0.03, 0.35);
  const lw = rise(c, 'DR Congo', 140, 500, FONT.serif(800), 104, PAPER(), kL, { track: -1.5 });
  const xy = p ? p([23.6, -2.9]) : null;
  if (xy && kL > 0) {
    const x1 = 140 + lw + 30, y1 = 466;
    const m = ease.outCubic(clamp((t - tC) / 0.45));
    c.save(); c.strokeStyle = PAPER(0.7); c.lineWidth = 1.2; c.beginPath(); c.moveTo(x1, y1);
    c.lineTo(lerp(x1, xy[0], m), lerp(y1, xy[1], m)); c.stroke();
    c.fillStyle = PAPER(); c.beginPath(); c.arc(xy[0], xy[1], 5 * m, 0, Math.PI * 2); c.fill(); c.restore();
  }
  if (xy && kc > 0) { // the outbreak pulses out from the country on every beat
    c.save();
    for (let i = 0; i < 2; i++) {
      const ph = (((X.beat() + i * 0.5) % 1) + 1) % 1;
      c.strokeStyle = PAPER(0.6 * (1 - ph) * kc); c.lineWidth = 1.6;
      c.beginPath(); c.arc(xy[0], xy[1], 14 + 190 * ease.outCubic(ph), 0, Math.PI * 2); c.stroke();
    }
    c.restore();
  }
  c.save(); c.globalAlpha *= kE; c.translate(0, (1 - kE) * 10);
  label(c, 'Ebola outbreak · Bundibugyo strain', 144, 552, RED(), 17, { w: 600 });
  c.restore();
}

function aidClinic(c: Ctx, X: X, tA: number) {
  const t = X.t, tNo = X.W('No').start;
  plate(c, X, 'ebola_clinic', tA - 0.1, tA + 3.4, { z: [1.06, 1.1], y: [0.022, 0.034], x: [0.004, -0.006] });
  scrim(c, 560, 140, 800, 150, 0.6, '247,242,228');
  const cx = 960;
  const k0 = appear(t, tA, 0.35);
  label(c, 'Ebola · DR Congo', cx, 152, INK(0.75), 15, { align: 'center', alpha: k0, w: 600 });
  const famN = FONT.serif(800), famW = FONT.serif(600), sN = 112, sW = 40, tr = -2.2, gap = 60;
  const wA = measure('9,066', famN, sN, tr), wB = measure('4,381', famN, sN, tr);
  const wa = measure(' cases', famW, sW), wb = measure(' deaths', famW, sW);
  let x = cx - (wA + wa + gap + wB + wb) / 2;
  const y = 262;
  const tB = tA + 0.42;
  const hotA = 1 - appear(t, tNo - 0.03, 0.3);           // the red passes to the vaccine stamp on "No"
  const colA = `rgba(${Math.round(lerp(11, 228, hotA))},${Math.round(lerp(18, 87, hotA))},${Math.round(lerp(32, 46, hotA))},1)`;
  const kA = appear(t, tA, 0.45), kB = appear(t, tB, 0.45);
  rise(c, countTo(t, tA, 0, 9066, 0.9), x, y, famN, sN, colA, kA, { track: tr });
  rise(c, ' cases', x + wA, y, famW, sW, INK(0.8), kA);
  x += wA + wa + gap;
  rise(c, countTo(t, tB, 0, 4381, 0.9), x, y, famN, sN, INK(), kB, { track: tr });
  rise(c, ' deaths', x + wB, y, famW, sW, INK(0.8), kB);
  source(c, 'WHO via UN News · data to 13 Oct 2026', cx, 300, INK(0.62), { align: 'center', alpha: kB });
  // the stamp
  const ks = appear(t, tNo - 0.03, 0.4);
  if (ks > 0) {
    const s = 'NO APPROVED VACCINE FOR THIS STRAIN', fam = FONT.mono(600), size = 21;
    const w = measure(s, fam, size, size * 0.14) + 44, h = 48, yb = 322;
    c.save();
    c.beginPath(); c.rect(cx - (w / 2) * ks, yb - 2, w * ks, h + 4); c.clip();
    c.fillStyle = RED(); c.fillRect(cx - w / 2, yb, w, h);
    text(c, s, cx, yb + 32, fam, size, PAPER(), { align: 'center', track: size * 0.14 });
    c.restore();
  }
}

function aidPost(X: X, o: PostOverrides): PostOverrides {
  const t = X.t;
  const z = punch(t, X.W('30%').start, 0.018) + punch(t, X.W('9,000').start - 0.03, 0.022) + punch(t, X.W('No').start, 0.012);
  return { ...o, zoom: (o.zoom ?? 1) + z };
}

// ================================================================== BALLOTS
const ballotsCut = (X: X) => X.W("Hungary's").start - 0.06;

function ballotsDraw(c: Ctx, X: X) {
  const t = X.t, cut = ballotsCut(X);
  // until aid's own fade-out begins, aid alone draws (layering a translucent copy over it would wash it out); then this
  // segment draws aid's frame opaquely until the cut
  if (t < X.seg.t0) return;
  if (t < cut) { aidDraw(c, asSeg(X, 'aid')); return; }
  const tR = X.W('Right-wing').start - 0.04;
  if (t < tR) ballotsBoard(c, X, cut, tR);
  else ballotsGlobe(c, X, tR);
}

function ballotsBoard(c: Ctx, X: X, tA: number, tEnd: number) {
  const t = X.t, x = 120;
  plate(c, X, 'ballots', tA - 0.1, tEnd + 0.3, { z: [1.025, 1.075], x: [0.012, -0.004] });
  scrim(c, 90, 150, 660, 420, 0.6, '247,242,228');
  const yb = titleBlock(c, X, x, 166, tA, { size: 70, col: INK(), maxW: 640 });
  const tH = X.W("Hungary's").start, tO = X.W('Orbán').start, tCo = X.W('conceded').start, tDf = X.W('defeat').start;
  const tB = X.W('Bangladesh').start, tN = X.W('Nepal').start, tNew = X.W('new').start, tGov = X.W('governments').start;
  const hot2 = t >= tNew - 0.03;
  const row = (y: number, tRule: number, name: [string, number][], res: [string, number][], hot: boolean) => {
    const u = ease.outCubic(clamp((t - tRule + 0.03) / 0.5));
    if (u <= 0) return;
    hair(c, x, y - 54, x + 600 * u, y - 54, INK(0.35), 1.2);
    wordsOn(c, name, x, y, t, 52, () => INK(), { serif: true, w: 700 });
    wordsOn(c, res, x + 2, y + 34, t, 18, () => (hot ? RED() : INK(0.78)));
  };
  const r1 = yb + 96, r2 = r1 + 104;
  row(r1, tH, [['Hungary', tH]], [['Orbán', tO], ['conceded', tCo], ['defeat', tDf], ['· 12 Apr', tDf + 0.16]], !hot2);
  row(r2, tB, [['Bangladesh', tB], ['· Nepal', tN]], [['New', tNew], ['governments', tGov]], hot2);
  source(c, 'Reuters · ANI · Wikipedia · 2026', x, r2 + 70, INK(0.62), { alpha: appear(t, tH, 0.4) });
}

function ballotsGlobe(c: Ctx, X: X, tA: number) {
  const t = X.t;
  c.fillStyle = C.night; c.fillRect(0, 0, W, H);
  const tCh = X.W('Chile').start, tPe = X.W('Peru').start, tCol = X.W('Colombia').start;
  const tBr = X.W("Brazil's").start, tToo = X.W('too').start, tClose = X.W('close').start;
  // camera: from the shared view, fly fast onto South America; on "close" ease back to the shared view (which is
  // already flying on to the next story)
  const v0 = X.view();
  const tg = { lon: -61, lat: -16, r: 820, cx: 1380, cy: 540 };
  const w = lerp(0.5, 1, ease.outExpo(clamp((t - tA) / 1.1))) * (1 - ease.inOutCubic(clamp((t - tClose) / 0.95)));
  const dl = ((tg.lon - v0.lon + 540) % 360) - 180;
  const kBr = appear(t, tBr - 0.03, 0.4);
  const dim = lerp(1, 0.55, kBr);
  const v: GlobeView = {
    lon: v0.lon + dl * w, lat: lerp(v0.lat, tg.lat, w), r: Math.exp(lerp(Math.log(v0.r), Math.log(tg.r), w)),
    cx: lerp(v0.cx ?? 1250, tg.cx, w), cy: lerp(v0.cy ?? 560, tg.cy, w),
    highlights: [
      { name: 'Chile', col: C.red, alpha: appear(t, tCh - 0.03, 0.3) * dim },
      { name: 'Peru', col: C.red, alpha: appear(t, tPe - 0.03, 0.3) * dim },
      { name: 'Colombia', col: C.red, alpha: appear(t, tCol - 0.03, 0.3) * dim },
    ],
  };
  const p = drawGlobe(c, v, t);
  if (kBr > 0) {
    const br = country('Brazil');
    if (br && p) {
      const path = geoPath(p, c);
      c.save(); c.globalAlpha *= kBr;
      c.beginPath(); path(br); hatchPath(c, PAPER(0.5), 11, 1.5, X.beat() * 5.5);
      c.beginPath(); path(br); c.strokeStyle = PAPER(0.95); c.lineWidth = 2; c.stroke();
      c.restore();
    }
  }
  // left panel
  scrim(c, 70, 200, 640, 640, 0.78);
  const x = 120, kT = appear(t, tA, 0.5);
  c.save(); c.globalAlpha *= lerp(1, 0.4, kBr);
  label(c, 'Latin America', x, 250, PAPER(0.75), 15, { alpha: kT, w: 600 });
  rise(c, 'Right-wing presidents', x, 320, FONT.serif(800), 56, PAPER(), kT, { track: -0.7 });
  const rows: [string, string, number][] = [['Chile', 'Kast', tCh], ['Peru', 'Fujimori', tPe], ['Colombia', 'de la Espriella', tCol]];
  rows.forEach(([n, who, tw], i) => {
    const k = appear(t, tw - 0.03, 0.4), y = 384 + i * 54;
    if (k <= 0) return;
    hair(c, x, y - 36, x + 520 * ease.outCubic(k), y - 36, PAPER(0.18));
    c.fillStyle = RED(k); c.fillRect(x, y - 22, 10, 10);
    rise(c, n, x + 24, y - 8, FONT.serif(700), 36, PAPER(), k);
    label(c, who, x + 520, y - 10, PAPER(0.88 * k), 16, { align: 'right', w: 600 });
  });
  source(c, 'Wikipedia · read 18 Oct 2026', x, 384 + 3 * 54 - 22, SLATE(0.95), { alpha: appear(t, tCol, 0.4) });
  c.restore();
  // Brazil split bar
  if (kBr > 0) {
    const y0 = 620, bw = 520, u = ease.outCubic(clamp((t - tBr) / 0.7));
    c.save(); c.globalAlpha *= kBr; c.translate(0, (1 - kBr) * 16);
    label(c, 'Brazil · first round · 4 Oct', x, y0, PAPER(0.85), 15, { w: 600 });
    label(c, 'Flávio Bolsonaro', x, y0 + 40, PAPER(0.72), 14);
    label(c, 'Lula', x + bw, y0 + 40, PAPER(0.72), 14, { align: 'right' });
    // official results land as type (no count-up through vote shares nobody got), both at once (no candidate first)
    const kN = appear(t, tBr + 0.04, 0.45);
    rise(c, '47.03%', x, y0 + 98, FONT.serif(800), 56, PAPER(), kN, { track: -1 });
    rise(c, '45.16%', x + bw, y0 + 98, FONT.serif(800), 56, PAPER(0.85), kN, { align: 'right', track: -1 });
    const by = y0 + 118, bh = 22;
    c.fillStyle = PAPER(0.08); c.fillRect(x, by, bw, bh);
    c.fillStyle = PAPER(0.92); c.fillRect(x, by, bw * 0.4703 * u, bh);
    c.fillStyle = SLATE(0.95); c.fillRect(x + bw - bw * 0.4516 * u, by, bw * 0.4516 * u, bh);
    const pulse = X.hit('kick', t, 0.15);
    c.fillStyle = RED(); c.fillRect(x + bw / 2 - 1.5, by - 10 - pulse * 4, 3, bh + 20 + pulse * 8);
    const kr = appear(t, tToo - 0.03, 0.35);
    c.save(); c.globalAlpha *= kr;
    label(c, 'Runoff 25 Oct · polls within the margin of error', x, by + 62, RED(), 15, { w: 600 });
    c.restore();
    source(c, 'TSE via Investidor10 / Wikipedia · 4 Oct 2026', x, by + 92, SLATE(0.95));
    c.restore();
  }
}

function ballotsPost(X: X, o: PostOverrides): PostOverrides {
  const t = X.t;
  if (t < ballotsCut(X)) return aidPost(asSeg(X, 'aid'), o);
  const z = punch(t, ballotsCut(X), 0.016) + punch(t, X.W('Right-wing').start - 0.04, 0.02) + punch(t, X.W("Brazil's").start, 0.014);
  return { ...o, zoom: (o.zoom ?? 1) + z };
}

// ================================================================== ECONOMY
/** The beat before "An oil shock" (the Brazil line has finished by then). */
const econCut = (X: X) => X.tBeat(Math.round(X.beat(X.W('An').start)));

function economyDraw(c: Ctx, X: X) {
  const t = X.t, cut = econCut(X);
  if (t < X.seg.t0) return;
  if (t < cut) { ballotsDraw(c, asSeg(X, 'ballots')); return; }
  plate(c, X, 'oil_chip', cut - 0.1, X.seg.t1 + 0.6, { z: [1.03, 1.09], x: [0.006, -0.01] });
  const tBrent = X.W('Brent').start - 0.03, tThe = X.W('The').start - 0.03;
  // the card
  // the title page is a short card; it grows to the chart's height on the "Brent" downbeat
  const cx0 = 590, cy0 = 150, cw = 740, ch = lerp(296, 440, ease.outExpo(clamp((t - tBrent) / 0.5)));
  const kr = ease.outExpo(clamp((t - cut) / 0.32));            // the red rule draws…
  const kc = ease.outExpo(clamp((t - cut - 0.08) / 0.45));     // …and the card unrolls under it
  c.save();
  if (kc > 0) {
    c.save(); c.shadowColor = 'rgba(11,18,32,0.4)'; c.shadowBlur = 44; c.shadowOffsetY = 14;
    c.fillStyle = 'rgba(10,16,32,0.96)'; c.fillRect(cx0, cy0, cw, ch * kc); c.restore();
  }
  c.beginPath(); c.rect(cx0, cy0, cw, ch * kc); c.clip();
  const x0 = cx0 + 40;
  // page 1: title
  if (t < tBrent) {
    c.save(); c.globalAlpha *= vanish(t, tBrent, 0.2);
    titleBlock(c, X, x0, cy0 + 72, cut, { size: 62, col: PAPER(), maxW: 660 });
    c.restore();
  }
  // page 2: Brent
  if (t >= tBrent && t < tThe) {
    c.save(); c.globalAlpha *= vanish(t, tThe, 0.22);
    econBrent(c, X, x0, cy0, tBrent);
    c.restore();
  }
  // page 3: rates
  if (t >= tThe - 0.02) econRates(c, X, x0, cy0, tThe);
  c.restore();
  c.fillStyle = RED(); c.fillRect(cx0, cy0, cw * kr, 5);
}

function econBrent(c: Ctx, X: X, x0: number, cy0: number, tB: number) {
  const t = X.t, t80 = X.W('80%').start;
  const k = appear(t, tB, 0.35);
  c.save(); c.globalAlpha *= k;
  label(c, 'Brent crude · US$ per barrel', x0, cy0 + 60, PAPER(0.9), 15, { w: 600 });
  // the headline number climbs with the line
  const big = `$${countTo(t, tB + 0.05, 72, 109.86, 1.0, 2)}`;
  const wBig = measure('$109.86', FONT.serif(800), 112, -2);
  rise(c, big, x0, cy0 + 178, FONT.serif(800), 112, RED(), appear(t, tB, 0.45), { track: -2 });
  label(c, '16 Oct close', x0 + wBig + 28, cy0 + 112, PAPER(0.75), 14);
  const kp = appear(t, t80 - 0.03, 0.35);
  if (kp > 0) kicker(c, '+77–79% y/y', x0 + wBig + 28, cy0 + 162, kp, { size: 17 });
  // slope: late-June weekly-close low → 16 Oct close
  const lo = 70, hi = 112, yB = cy0 + 352, hh = 128;
  const Y = (v: number) => yB - ((v - lo) / (hi - lo)) * hh;
  const xa = x0 + 14, xb = x0 + 560, ya = Y(72), yb2 = Y(109.86);
  for (let g = 0; g <= 2; g++) hair(c, x0, yB - (hh * g) / 2, x0 + 660, yB - (hh * g) / 2, PAPER(g === 0 ? 0.25 : 0.08));
  const u = ease.inOutCubic(clamp((t - tB - 0.05) / 1.0));
  c.strokeStyle = RED(); c.lineWidth = 3; c.beginPath(); c.moveTo(xa, ya); c.lineTo(lerp(xa, xb, u), lerp(ya, yb2, u)); c.stroke();
  c.fillStyle = PAPER(); c.beginPath(); c.arc(xa, ya, 5, 0, Math.PI * 2); c.fill();
  c.fillStyle = RED(); c.beginPath(); c.arc(lerp(xa, xb, u), lerp(ya, yb2, u), 6 + 4 * X.hit('kick', t, 0.15), 0, Math.PI * 2); c.fill();
  label(c, 'Late-June low ~$72', xa, ya + 30, PAPER(0.7), 13);
  label(c, '16 Oct', xb + 14, yb2 + 5, RED(), 13, { alpha: clamp((u - 0.8) * 5), w: 600 });
  source(c, 'Trading Economics · Yahoo Finance · weekly closes to 16 Oct 2026', x0, cy0 + 412, SLATE(0.95));
  c.restore();
}

function econRates(c: Ctx, X: X, x0: number, cy0: number, tA: number) {
  const t = X.t, tF = X.W('Fed').start, tE = X.W('ECB').start, tR = X.W('raising').start;
  const k = appear(t, tA, 0.3);
  c.save(); c.globalAlpha *= k;
  label(c, 'Central banks · rate hikes', x0, cy0 + 60, PAPER(0.9), 15, { w: 600 });
  const rr = ease.outExpo(clamp((t - tR + 0.03) / 0.55)); // risers rise on "raising"
  const stair = (x: number, tw: number, steps: number, name: string, rate: string, note: string) => {
    const kk = appear(t, tw - 0.03, 0.4);
    if (kk <= 0) return;
    const yb = cy0 + 236, sw = 300, step = 52, n = steps + 1, tread = sw / n;
    // treads draw on with the name; the risers lift them on "raising"
    const ut = ease.outCubic(clamp((t - tw + 0.03) / 0.5));
    c.save();
    c.lineWidth = 3; c.lineCap = 'square';
    for (let i = 0; i < n; i++) {
      const lift = i === 0 ? 0 : step * Math.min(i, steps) * rr;
      const xa = x + i * tread, xb = xa + tread * ut;
      if (xa > x + sw * ut) break;
      c.strokeStyle = PAPER(0.9); c.beginPath(); c.moveTo(xa, yb - lift); c.lineTo(Math.min(xb, x + sw * ut), yb - lift); c.stroke();
      if (i > 0 && rr > 0) {
        c.strokeStyle = RED(); c.beginPath(); c.moveTo(xa, yb - step * (i - 1) * rr); c.lineTo(xa, yb - lift); c.stroke();
      }
    }
    if (rr > 0.6) { // arrowhead on the top step
      const ax = x + sw + 6, ay = yb - step * steps * rr;
      c.fillStyle = RED(clamp((rr - 0.6) * 2.5)); c.beginPath(); c.moveTo(ax, ay - 12); c.lineTo(ax + 10, ay); c.lineTo(ax - 10, ay); c.closePath(); c.fill();
    }
    c.restore();
    rise(c, name, x, cy0 + 314, FONT.serif(800), 50, PAPER(), kk);
    rise(c, rate, x, cy0 + 354, FONT.mono(600), 26, PAPER(), appear(t, tw + 0.05, 0.4), { track: 1 });
    label(c, note, x, cy0 + 386, PAPER(0.78), 14, { alpha: clamp(rr * 1.5), w: 600 });
  };
  stair(x0, tF, 1, 'Fed', '3.75–4.00%', 'First hike since Jul 2023');
  stair(x0 + 350, tE, 2, 'ECB', '2.50%', 'Hiked twice');
  source(c, 'Federal Reserve · 16 Sep 2026 · ECB · 10 Sep 2026', x0, cy0 + 418, SLATE(0.95), { alpha: appear(t, tF, 0.4) });
  c.restore();
}

function economyPost(X: X, o: PostOverrides): PostOverrides {
  const t = X.t, cut = econCut(X);
  if (t < cut) return ballotsPost(asSeg(X, 'ballots'), o);
  const z = punch(t, cut, 0.018) + punch(t, X.W('80%').start, 0.016) + punch(t, X.W('raising').start, 0.014);
  return { ...o, zoom: (o.zoom ?? 1) + z };
}

// ================================================================== export
export const segments: Record<string, Segment> = {
  aid: { draw: aidDraw, post: aidPost },
  ballots: { draw: ballotsDraw, post: ballotsPost },
  economy: { draw: economyDraw, post: economyPost },
};

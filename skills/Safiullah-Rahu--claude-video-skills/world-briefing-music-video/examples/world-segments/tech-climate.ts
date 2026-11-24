// THE STATE OF THE WORLD — segments `ai` (TECHNOLOGY) and `climate` (CLIMATE).
//
// ai:      line 1 — the datacenter plate drifting into its corridor (the cooling towers kept clear on the right) under a
//          night side-grade; kicker + headline on the opening beat; the IEA capex bar pair lands on the words (2025 bar
//          on "spending", the 2026 base on "up", the red "about +75%" extension on "75%"), then "now above global oil & gas
//          production investment" is set word by word as it is sung.
//          line 2 — the shared night globe (X.view(), US West Coast); two identically styled, attributed lab cards
//          (OpenAI on "OpenAI", Anthropic's CEO on "Anthropic's"); each card's words light as they are sung.
// climate: the ai tail is repeated under the cross-fade so "pace the frontier" stays on screen while it is sung; the
//          el_nino plate cuts in on the next downbeat:
//          line 1 — kicker + headline in ink on the paper sky; NOAA's 83% on the dark sea with a 100-tick strip;
//          line 2 — the glacier_valley plate cut on "Nepal", a dateline on "glacier", the 1,400+ counter on "count" (the
//          only number of the line: the sheet's ~5,300 missing is not sung, so it stays off screen);
//          line 3 — the globe opens on Nepal and flies to Antalya; COP31 card, then the COP31 President's quote lit word
//          by word ("jeopardy" the frame's one hot value: Türkiye steps back to a quiet outline); the camera whips back to
//          X.view() in one beat, landing before the pre-chorus starts fading in, so the hand-off shows one globe.
// Light plates get a night grade under the chrome band (topShade) so the scene's chrome stays legible.
// Every number is from research/FACTSHEET.md (Story 8, Story 9; the quote is S173) and carries a source line.
import { geoOrthographic, geoPath } from 'd3-geo';
import type { Segment, X } from '../x';
import { country, type GlobeView } from '../globe';
import { norm, type Word } from '../../engine/lyrics';
import {
  W, H, PAPER, RED, SLATE, FONT, text, label, source, pill, hair, scrim,
  appear, vanish, life, countTo, measure, clamp, ease, lerp,
} from '../kit';

type Ctx = CanvasRenderingContext2D;
const INKC = 'rgb(11,18,32)';

// ------------------------------------------------------------------------------------------------ helpers
/** A word of another segment's lyrics (the climate segment repeats the ai tail under the cross-fade). */
function Wsec(X: X, sec: string, q: string, nth = 0): Word {
  const words = X.ly.lines.filter((l) => l.section === sec).flatMap((l) => l.words);
  const qs = q.split(/\s+/).map(norm).filter(Boolean);
  let seen = 0;
  for (let i = 0; i + qs.length <= words.length; i++) {
    if (qs.every((qq, j) => norm(words[i + j]!.w) === qq) && seen++ === nth) return words[i]!;
  }
  throw new Error(`word "${q}" not in segment ${sec}`);
}

/** Decaying punch that starts at t0. */
const punch = (t: number, t0: number, amp: number, hl = 0.12) => (t < t0 ? 0 : amp * Math.pow(0.5, (t - t0) / hl));

/** Text that rises into place from behind its own baseline mask (k 0..1). Left-aligned. Returns its width. */
function rise(c: Ctx, s: string, x: number, y: number, fam: string, size: number, col: string, k: number, o: { track?: number } = {}) {
  const w = measure(s, fam, size, o.track ?? 0);
  if (k <= 0) return w;
  c.save();
  c.beginPath(); c.rect(x - 8, y - size * 1.08, w + 16, size * 1.42); c.clip();
  text(c, s, x, y + (1 - k) * size * 1.15, fam, size, col, { track: o.track });
  c.restore();
  return w;
}

/** A night grade over a light plate, strongest at the edge where the type sits. */
function sideShade(c: Ctx, a: number, w = 1300, right = false, col = '8,13,28') {
  if (a <= 0) return;
  const g = right ? c.createLinearGradient(W, 0, W - w, 0) : c.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.45, `rgba(${col},${a * 0.78})`); g.addColorStop(1, `rgba(${col},0)`);
  c.fillStyle = g;
  if (right) c.fillRect(W - w, 0, w, H); else c.fillRect(0, 0, w, H);
}

/** A night grade under the chrome band so the scene's mono chrome stays legible over a light plate's sky/ceiling. */
function topShade(c: Ctx, a: number, h = 150, col = '8,13,28') {
  if (a <= 0) return;
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.55, `rgba(${col},${a * 0.6})`); g.addColorStop(1, `rgba(${col},0)`);
  c.fillStyle = g; c.fillRect(0, 0, W, h);
}

/** Kicker pill + serif headline (the story's title card), rising in at tIn and lifting out by tOut. */
function storyTitle(c: Ctx, X: X, x: number, y: number, tIn: number, tOut: number, o: { size?: number; ink?: boolean; lines?: string[] } = {}) {
  const t = X.t, size = o.size ?? 84, lines = o.lines ?? [X.seg.title ?? ''];
  const k = appear(t, tIn, 0.55), v = vanish(t, tOut, 0.3);
  if (k <= 0 || v <= 0) return;
  c.save();
  c.globalAlpha *= v;
  c.translate(0, -(1 - v) * 24);
  const pk = appear(t, tIn, 0.35);
  c.save(); c.translate((1 - pk) * -24, 0);
  pill(c, X.seg.kicker ?? '', x, y - size - 22, { size: 15, alpha: pk, fill: RED(), col: PAPER() });
  c.restore();
  lines.forEach((ln, i) => rise(c, ln, x, y + i * size * 1.02, FONT.serif(800), size, o.ink ? INKC : PAPER(), ease.outExpo(clamp((t - tIn - 0.08 - i * 0.09) / 0.6)), { track: -size * 0.012 }));
  c.restore();
}

/** Mix the shared camera a toward a deliberate view b by u (lon the short way, r in log space). */
function mixView(a: GlobeView, b: { lon: number; lat: number; r: number; cx?: number; cy?: number }, u: number): GlobeView {
  if (u <= 0) return a;
  const dl = ((b.lon - a.lon + 540) % 360) - 180;
  return {
    ...a, lon: a.lon + dl * u, lat: lerp(a.lat, b.lat, u), r: Math.exp(lerp(Math.log(a.r), Math.log(b.r), u)),
    cx: lerp(a.cx ?? 960, b.cx ?? a.cx ?? 960, u), cy: lerp(a.cy ?? 540, b.cy ?? a.cy ?? 540, u),
  };
}
/** The same orthographic projection drawGlobe uses, for overlays drawn on top of X.globe. */
const project = (v: GlobeView) =>
  geoOrthographic().scale(v.r).translate([v.cx ?? 960, v.cy ?? 540]).rotate([-(v.lon + (v.spin ?? 0)), -v.lat, 0]).clipAngle(90).precision(0.4);

/** Words that light as they are sung: [token, its lyric word start]; dim before. Returns the drawn width. */
function litLine(c: Ctx, toks: [string, number][], x: number, y: number, fam: string, size: number, t: number, o: { lit?: string; dim?: string; hot?: Record<number, string> } = {}) {
  let xx = x;
  const sp = measure(' ', fam, size);
  toks.forEach(([s, t0], i) => {
    const on = clamp((t - t0 + 0.04) / 0.12);
    const col = on > 0.5 ? (o.hot?.[i] ?? o.lit ?? PAPER()) : (o.dim ?? PAPER(0.34));
    const w = text(c, s, xx, y, fam, size, col);
    xx += w + sp;
  });
  return xx - sp - x;
}

// ------------------------------------------------------------------------------------------------ ai, line 2
// (drawn by ai, and repeated by climate under the cross-fade until "frontier" has been sung)
function labCard(c: Ctx, x: number, y: number, w: number, t: number, tIn: number,
  o: { who: string; date: string; rows: [string, number][][]; size: number; src: string; dim?: number }) {
  const k = appear(t, tIn, 0.45);
  if (k <= 0) return 0;
  const lh = o.size * 1.12, h = 74 + o.rows.length * lh + 46;
  c.save();
  c.globalAlpha *= k * (o.dim ?? 1);
  c.translate((1 - k) * -40, 0);
  c.fillStyle = 'rgba(9,15,30,0.9)'; c.fillRect(x, y, w, h);
  c.fillStyle = PAPER(0.9); c.fillRect(x, y, 4, h);
  label(c, o.who, x + 34, y + 42, PAPER(0.96), 17, { w: 600 });
  label(c, o.date, x + w - 30, y + 42, SLATE(), 15, { align: 'right', w: 500 });
  hair(c, x + 34, y + 58, x + 34 + (w - 64) * ease.outCubic(clamp((t - tIn - 0.1) / 0.5)), y + 58, PAPER(0.22));
  o.rows.forEach((r, i) => litLine(c, r, x + 34, y + 74 + (i + 0.82) * lh, FONT.serif(700), o.size, t));
  source(c, o.src, x + 34, y + h - 22, SLATE(0.95));
  c.restore();
  return h;
}

function aiLine2(c: Ctx, X: X) {
  const t = X.t, A = (q: string, n = 0) => Wsec(X, 'ai', q, n).start;
  const tAnth = A("Anthropic's"), tEnd = Wsec(X, 'ai', 'frontier').end;
  // the shared camera on the US West Coast; the cards sit over the Pacific
  X.globe(c, { ...X.view() });
  const out = vanish(t, tEnd + 0.3, 0.3);
  if (out <= 0) return;
  c.save(); c.globalAlpha *= out;
  // two identically styled cards side by side: each lab's move in its own stated terms
  const w = 800, y = 372, tOpen = A('OpenAI');
  // the header echoes the story title: line 1 was the build-out, line 2 is the brake
  const hk = appear(t, tOpen - 0.08, 0.5);
  if (hk > 0) {
    c.save(); c.globalAlpha *= hk;
    c.fillStyle = RED(); c.fillRect(128, 296, 12, 12);
    rise(c, 'THE BRAKE', 152, 308, FONT.mono(600), 18, PAPER(0.96), ease.outExpo(clamp((t - tOpen) / 0.45)), { track: 18 * 0.14 });
    hair(c, 128, 330, 128 + (W - 256) * ease.outCubic(clamp((t - tOpen) / 0.7)), 330, PAPER(0.22));
    c.restore();
  }
  labCard(c, 128, y, w, t, tOpen - 0.08, {
    who: 'OPENAI', date: '29 SEP', size: 64, src: 'AP · SEP 2026', dim: lerp(1, 0.62, appear(t, tAnth, 0.5)),
    rows: [[['Cancelled', A('cancelled')], ['a', A('a')], ['release,', A('release')]], [['citing', A('citing')], ['safety', A('safety')]]],
  });
  labCard(c, W - 128 - w, y, w, t, tAnth - 0.08, {
    who: 'ANTHROPIC CEO', date: '12 SEP', size: 64, src: 'AP · SEP 2026',
    rows: [[['‘Pace', A('pace')], ['the', A('the', 1)]], [['frontier’', A('frontier')]]],
  });
  c.restore();
}

// ------------------------------------------------------------------------------------------------ ai
const ai: Segment = {
  draw(c, X) {
    const t = X.t, s = X.seg, Wd = X.W;
    const tBig = Wd('Big').start, tSpend = Wd('spending').start, tUp = Wd('up').start, t75 = Wd('75%').start;
    const tAbove = Wd('above').start, tInv = Wd('investment'), tOpen = Wd('OpenAI').start;

    // ---- background: line 1 = datacenter plate; line 2 = the shared globe
    const toGlobe = ease.inOutCubic(clamp((t - (tOpen - 0.3)) / 0.3));
    if (toGlobe > 0) aiLine2(c, X);
    if (toGlobe >= 1) return;
    c.save(); c.globalAlpha *= 1 - toGlobe;
    const kick = X.hit('kick', t, 0.1) * 0.004;
    // zoomed and drifted right so the corridor's cooling-tower window sits in the right third, clear of the chart
    X.plate(c, 'datacenter', { a: s.t0 - 0.6, b: tOpen, z: [1.27 + kick, 1.35 + kick], x: [0.125, 0.15], duo: 0.2 });
    sideShade(c, 0.9 * appear(t, s.t0 - 0.4, 0.8, ease.outCubic), 1260);
    topShade(c, 0.6);

    // ---- title (kicker + serif headline) on the opening beat, until the 2025 bar grows
    storyTitle(c, X, 128, 282, s.t0 - 0.05, tBig + 0.22, { size: 84, lines: ['The build-out', 'and the brake'] });

    // ---- the IEA bar pair
    const vis = life(t, tBig + 0.08, tInv.end + 0.12, 0.45, 0.25);
    if (vis > 0) {
      c.save(); c.globalAlpha *= vis;
      // L1 keeps the 2026 bar + its numeral on the darkened racks, clear of the plate's red cooling towers
      const x = 128, y = 412, bx = 240, L1 = 250, bh = 58;
      label(c, 'BIG TECH CAPEX', x, y, PAPER(0.96), 18, { w: 600 });
      label(c, 'CAPITAL SPENDING · LARGEST TECH COMPANIES', x, y + 26, SLATE(), 13);
      hair(c, x, y + 46, x + 900 * ease.outCubic(clamp((t - tBig) / 0.6)), y + 46, PAPER(0.28));
      // 2025
      const r1 = y + 110, u1 = ease.outExpo(clamp((t - tSpend) / 0.7));
      label(c, '2025', x, r1 + 8, PAPER(0.9), 20, { w: 600 });
      c.fillStyle = PAPER(0.92); c.fillRect(bx, r1 - bh / 2, Math.max(2, L1 * u1), bh);
      if (u1 > 0.3) text(c, '>$400bn', bx + L1 * u1 + 22, r1 + 18, FONT.serif(700), 54, PAPER(), { alpha: clamp((u1 - 0.3) * 2) });
      // 2026 = the 2025 base (ghost) + the red extension: "about +75%" (IEA: "expected to rise about 75%")
      const r2 = r1 + 90, ub = ease.outExpo(clamp((t - tUp) / 0.5)), ue = ease.outExpo(clamp((t - t75) / 0.9));
      label(c, '2026', x, r2 + 2, PAPER(0.9), 20, { w: 600 });
      label(c, 'EXPECTED', x, r2 + 24, SLATE(), 11);
      c.fillStyle = PAPER(0.3); c.fillRect(bx, r2 - bh / 2, Math.max(2, L1 * ub), bh);
      const pump = 1 + 0.02 * X.hit('kick', t, 0.1);
      if (ue > 0) { c.fillStyle = RED(); c.fillRect(bx + L1, r2 - bh / 2, 0.75 * L1 * ue * pump, bh); }
      if (ue > 0.15) {
        const pk = 1 + punch(t, t75 + 0.1, 0.08, 0.14);
        const na = clamp((ue - 0.15) * 2);
        // read left to right as sung: "ABOUT +75%" (mono qualifier centred on the numeral's cap height)
        c.save(); c.translate(bx + L1 * (1 + 0.75 * ue) + 24, r2 + 30); c.scale(pk, pk);
        const aw = label(c, 'ABOUT', 0, -27, PAPER(0.92), 17, { w: 600, alpha: na });
        text(c, '+75%', aw + 14, 0, FONT.serif(800), 96, RED(), { alpha: na, track: -2 });
        c.restore();
      }
      source(c, 'IEA · APR 2026', x, r2 + bh / 2 + 44, PAPER(0.72));
      // "now above global oil & gas production investment", set as it is sung
      const toks: [string, number][] = [['NOW', tAbove], ['ABOVE', tAbove + 0.06], ['GLOBAL', Wd('global').start], ['OIL', Wd('oil').start],
        ['&', Wd('and').start], ['GAS', Wd('gas').start], ['PRODUCTION', tInv.start - 0.06], ['INVESTMENT', tInv.start]];
      const ya = r2 + 140;
      if (t > tAbove - 0.1) {
        hair(c, x, ya - 50, x + 900 * ease.outCubic(clamp((t - tAbove) / 0.5)), ya - 50, PAPER(0.18));
        let xx = x, yy = ya;
        const fam = FONT.sans(600), size = 38;
        for (const [w0, t0] of toks) {
          const k = ease.outExpo(clamp((t - t0) / 0.35));
          if (k <= 0) break;
          if (w0 === 'PRODUCTION') { xx = x; yy = ya + size * 1.18; }
          xx += rise(c, w0, xx, yy, fam, size, w0 === 'ABOVE' ? RED() : PAPER(0.97), k, { track: 1 }) + measure(' ', fam, size) + 2;
        }
      }
      c.restore();
    }
    c.restore();
  },
  post(X, o) {
    const t = X.t;
    const z = 0.005 * X.hit('kick', t, 0.09) + punch(t, X.W('75%').start, 0.012, 0.16) + punch(t, X.W('OpenAI').start - 0.02, 0.008, 0.12);
    return { ...o, zoom: (o.zoom ?? 1) * (1 + z) };
  },
};

// ------------------------------------------------------------------------------------------------ climate
const TURKEY = { lon: 35.5, lat: 37.6, r: 2350, cx: 1290, cy: 560 };
const ANTALYA: [number, number] = [30.71, 36.9];

/** The whip back to the shared camera: one beat long, landing on the last beat before the pre-chorus starts to fade
 *  in over us (t1 - 0.6). From then on both segments draw the identical X.view() globe, so the cross-fade shows no
 *  ghost. */
function whipWin(X: X): [number, number] {
  const b1 = Math.floor(X.beat(X.seg.t1 - 0.6));
  return [X.tBeat(b1 - 1), X.tBeat(b1)];
}
function climateView(X: X, t: number): GlobeView {
  const v = X.view(t);
  const tCop = X.W('COP31').start, tAnt = X.W('Antalya').start, [w0, w1] = whipWin(X);
  const goIn = ease.inOutCubic(clamp((t - (tCop - 0.05)) / Math.max(0.6, tAnt - tCop + 0.05)));
  const back = 1 - ease.inOutCubic(clamp((t - w0) / Math.max(0.2, w1 - w0)));
  return mixView(v, TURKEY, Math.min(goIn, back));
}

/** A country drawn over the globe: a light vermilion wash with a crisp outline. */
function landmark(c: Ctx, v: GlobeView, name: string, a: number, wash = 0.22) {
  const f = country(name);
  if (!f || a <= 0) return;
  const path = geoPath(project(v), c);
  c.save(); c.globalAlpha *= a;
  c.beginPath(); path(f); c.fillStyle = RED(wash); c.fill();
  c.lineJoin = 'round'; c.strokeStyle = RED(0.95); c.lineWidth = 1.8; c.stroke();
  c.restore();
}

const climate: Segment = {
  draw(c, X) {
    const t = X.t, Wd = X.W;
    const tHist = Wd('historic').start, tEl = Wd('El').start;
    const tNepal = Wd('Nepal').start, tGlac = Wd('glacier').start, tAuth = Wd('authorities').start, t1400 = Wd('1,400').start;
    const tCop = Wd('COP31').start, tOpens = Wd('opens').start, tAnt = Wd('Antalya').start, tPres = Wd('president').start;
    const t15 = Wd('1.5').start, tJeo = Wd('jeopardy');
    const tAiEnd = Wsec(X, 'ai', 'frontier').end;
    const tCut = X.tBar(Math.ceil(X.bar(tAiEnd) - 0.02)); // the first downbeat after "frontier"

    // ---------------- the ai tail under the cross-fade
    const toPlate = clamp((t - (tCut - 0.06)) / 0.12);
    if (toPlate < 1) aiLine2(c, X);

    // ---------------- line 1: El Niño (plate)
    const toNepal = clamp((t - (tNepal - 0.06)) / 0.12);
    if (toPlate > 0 && toNepal < 1) {
      c.save(); c.globalAlpha *= toPlate;
      const kick = X.hit('kick', t, 0.1) * 0.004;
      X.plate(c, 'el_nino', { a: tCut - 0.3, b: tNepal + 0.3, z: [1.03 + kick, 1.1 + kick], x: [0.0, -0.03] });
      topShade(c, 0.6);
      // title in ink on the paper sky, over a paper band
      const tv = life(t, tCut, tHist - 0.05, 0.5, 0.3);
      if (tv > 0) {
        c.save(); c.globalAlpha *= tv;
        const g = c.createLinearGradient(0, 120, 0, 400);
        g.addColorStop(0, 'rgba(243,239,230,0)'); g.addColorStop(0.25, 'rgba(243,239,230,0.8)'); g.addColorStop(0.8, 'rgba(243,239,230,0.8)'); g.addColorStop(1, 'rgba(243,239,230,0)');
        c.fillStyle = g; c.fillRect(0, 120, W, 280);
        c.restore();
      }
      storyTitle(c, X, 128, 320, tCut, tHist - 0.05, { size: 76, ink: true });
      // NOAA 83%: on the dark sea right of the warm current
      const sv = life(t, tHist - 0.04, tNepal - 0.08, 0.45, 0.2);
      if (sv > 0) {
        c.save(); c.globalAlpha *= sv;
        sideShade(c, 0.5, 760, true);
        const x = 1316, y = 630;
        // a navy pool under the block: invisible on the dark sea, it quiets the warm current's edge under the ticks
        scrim(c, x - 10, y - 200, 520, 300, 0.55, '8,13,28');
        label(c, 'NOAA', x, y - 196, RED(), 17, { w: 600 });
        label(c, 'CHANCE OF A ‘HISTORIC’ EL NIÑO · OCT–DEC', x, y - 168, PAPER(0.95), 16, { w: 600 });
        const pk = 1 + punch(t, tEl, 0.05, 0.14);
        c.save(); c.translate(x, y); c.scale(pk, pk);
        const nw = text(c, `${countTo(t, tHist, 0, 83, 0.9)}`, 0, 0, FONT.serif(800), 196, PAPER(), { track: -4 });
        text(c, '%', nw + 6, 0, FONT.serif(700), 98, PAPER(0.95));
        c.restore();
        // 100 ticks, 83 lit red as the count runs; every tenth taller
        const ty = y + 32, n = Math.round(83 * ease.outCubic(clamp((t - tHist) / 0.9)));
        for (let i = 0; i < 100; i++) {
          c.fillStyle = i < n ? RED() : PAPER(0.22);
          c.fillRect(x + i * 5, ty, 2.6, i % 10 === 0 ? 30 : 22);
        }
        source(c, 'NOAA CPC · OCT 2026', x, ty + 64, PAPER(0.72));
        c.restore();
      }
      c.restore();
    }

    // ---------------- line 2: Nepal (plate)
    const toGlobe = ease.inOutCubic(clamp((t - (tCop - 0.18)) / 0.3));
    if (toNepal > 0 && toGlobe < 1) {
      c.save(); c.globalAlpha *= toNepal;
      const kick = X.hit('kick', t, 0.1) * 0.004;
      X.plate(c, 'glacier_valley', { a: tNepal - 0.1, b: tCop + 0.3, z: [1.04 + kick, 1.12 + kick], y: [0.0, 0.02] });
      sideShade(c, 0.8 * appear(t, tNepal, 0.5), 1250);
      topShade(c, 0.72);
      // the snow ridge sits right under the chrome's segment counter: a soft night pool in that corner keeps it legible
      scrim(c, 1560, -40, 360, 120, 0.6, '8,13,28');
      const x = 128;
      // dateline on "glacier"
      const dv = life(t, tGlac - 0.04, tCop + 0.05, 0.4, 0.25);
      if (dv > 0) {
        c.save(); c.globalAlpha *= dv;
        c.fillStyle = RED(); c.fillRect(x, 190, 12, 12);
        rise(c, 'GLACIER COLLAPSE · 26 AUG · NEPAL–TIBET BORDER', x + 24, 202, FONT.mono(600), 17, PAPER(0.95), ease.outExpo(clamp((t - tGlac) / 0.4)), { track: 17 * 0.14 });
        c.restore();
      }
      // "authorities count over 1,400 dead": the one number of the line (the sheet's ~5,300 missing is not sung, so
      // it stays off screen)
      const nv = life(t, tAuth - 0.04, tCop + 0.05, 0.4, 0.25);
      if (nv > 0) {
        c.save(); c.globalAlpha *= nv;
        const y = 380, tLand = t1400, pk = 1 + punch(t, tLand, 0.05, 0.14);
        c.save(); c.translate(x, y); c.scale(pk, pk);
        const nw = text(c, countTo(t, tAuth, 0, 1400, tLand - tAuth), 0, 0, FONT.serif(800), 180, PAPER(), { track: -4 });
        if (t > tLand) text(c, '+', nw + 8, -12, FONT.serif(700), 120, RED());
        c.restore();
        label(c, 'DEAD', x, y + 44, PAPER(0.95), 20, { w: 600 });
        source(c, 'UN NEWS, CITING NEPAL AUTHORITIES · 9 OCT 2026', x, y + 78, PAPER(0.72));
        c.restore();
      }
      c.restore();
    }

    // ---------------- line 3: COP31 (globe: Nepal -> Antalya -> back to the shared camera)
    if (toGlobe > 0) {
      c.save(); c.globalAlpha *= toGlobe;
      const v = climateView(X, t);
      X.globe(c, v);
      const leave = 1 - ease.inOutCubic(clamp((t - tCop - 0.4) / 1.0));
      landmark(c, v, 'Nepal', 0.85 * leave, 0.3);
      const whip = vanish(t, whipWin(X)[0] + 0.3, 0.3); // the map marks clear in the whip's first half
      // Türkiye steps back to a quiet outline once the quote lands, so "jeopardy" is the frame's one hot value
      const quiet = lerp(1, 0.45, appear(t, tPres - 0.05, 0.6, ease.outCubic));
      landmark(c, v, 'Turkey', appear(t, tAnt - 0.12, 0.5) * whip * quiet, 0.14);
      // Antalya: a vermilion point whose rings pulse on the beat, and a mono label
      const p = project(v)(ANTALYA);
      const pa = appear(t, tAnt, 0.4) * whip;
      if (p && pa > 0) {
        const [px, py] = p;
        c.save(); c.globalAlpha *= pa;
        for (let i = 0; i < 2; i++) {
          const ph = (((X.beat() + i * 0.5) % 1) + 1) % 1;
          c.strokeStyle = RED(0.7 * (1 - ph)); c.lineWidth = 1.5;
          c.beginPath(); c.arc(px, py, 7 + ph * 34, 0, Math.PI * 2); c.stroke();
        }
        c.fillStyle = PAPER(); c.beginPath(); c.arc(px, py, 7.5, 0, Math.PI * 2); c.fill();
        c.fillStyle = RED(); c.beginPath(); c.arc(px, py, 5, 0, Math.PI * 2); c.fill();
        const lx = px + 46, ly = py + 64;
        c.strokeStyle = PAPER(0.75); c.lineWidth = 1.2; c.beginPath(); c.moveTo(px + 6, py + 6); c.lineTo(lx - 10, ly - 8); c.stroke();
        rise(c, 'ANTALYA', lx, ly, FONT.mono(600), 22, PAPER(), ease.outExpo(clamp((t - tAnt - 0.05) / 0.4)), { track: 3 });
        c.restore();
      }
      const out = vanish(t, tJeo.end + 0.28, 0.28);
      if (out > 0) {
        c.save(); c.globalAlpha *= out;
        const x = 128, w = 700, k = appear(t, tCop, 0.45);
        // COP31 card: the name on "COP31"; the card opens a row for its dates on "opens" and its city on "Antalya"
        const grow = ease.outExpo(clamp((t - tOpens) / 0.45)), ch = lerp(166, 230, grow);
        c.save(); c.globalAlpha *= k; c.translate((1 - k) * -40, 0);
        c.fillStyle = 'rgba(9,15,30,0.9)'; c.fillRect(x, 250, w, ch);
        c.fillStyle = PAPER(0.9); c.fillRect(x, 250, 4, ch);
        rise(c, 'COP31', x + 34, 362, FONT.serif(800), 96, PAPER(), ease.outExpo(clamp((t - tCop) / 0.6)), { track: -2 });
        rise(c, 'ANTALYA, TÜRKIYE', x + 34, 428, FONT.mono(600), 24, PAPER(0.95), ease.outExpo(clamp((t - tAnt) / 0.5)), { track: 3 });
        rise(c, '9–20 NOV', x + w - 34 - measure('9–20 NOV', FONT.mono(600), 24, 3), 428, FONT.mono(600), 24, PAPER(0.95), ease.outExpo(clamp((t - tOpens) / 0.5)), { track: 3 });
        source(c, 'AFP · 8 OCT 2026', x + 34, 250 + ch - 14);
        c.restore();
        // the president's quote, lit as it is sung
        const qk = appear(t, tPres - 0.05, 0.45);
        if (qk > 0) {
          c.save(); c.globalAlpha *= qk; c.translate((1 - qk) * -30, 0);
          const y = 590;
          c.fillStyle = 'rgba(9,15,30,0.9)'; c.fillRect(x, y - 70, w, 250);
          c.fillStyle = PAPER(0.9); c.fillRect(x, y - 70, 4, 250);
          const fam = FONT.serif(700), size = 52, q = Wd('warns').start;
          litLine(c, [['‘The', q], ['1.5C', t15], ['target', t15 + 0.12]], x + 34, y + 12, fam, size, t, { dim: PAPER(0.4) });
          litLine(c, [['is', Wd('is').start], ['in', Wd('in', 2).start], ['jeopardy’', tJeo.start]], x + 34, y + 12 + size * 1.1, fam, size, t, { dim: PAPER(0.4), hot: { 2: RED() } });
          label(c, '— COP31 PRESIDENT · 8 OCT', x + 34, y + 138, PAPER(0.9), 16, { w: 600 });
          source(c, 'CLIMATE HOME NEWS · 8 OCT 2026', x + 34, y + 164);
          c.restore();
        }
        c.restore();
      }
      c.restore();
    }
  },
  post(X, o) {
    const t = X.t;
    const z = 0.005 * X.hit('kick', t, 0.09) + punch(t, X.W('historic').start, 0.01, 0.16) + punch(t, X.W('1,400').start, 0.01, 0.16)
      + punch(t, X.W('Antalya').start, 0.008, 0.16) + punch(t, X.W('jeopardy').start, 0.008, 0.16);
    return { ...o, zoom: (o.zoom ?? 1) * (1 + z) };
  },
};

export const segments: Record<string, Segment> = { ai, climate };

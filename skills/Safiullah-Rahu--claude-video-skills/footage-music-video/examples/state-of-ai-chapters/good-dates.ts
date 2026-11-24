// THE STATE OF AI · OCT 2026 — group "good-dates": the hopeful bridge (s15 B15, s16 B16, MINT accent) and the
// chanted WHAT TO WATCH dates (coral accent), handing off to the final chorus. ROUND 2: integrated over the real
// footage in the house style of ../brief (opaque panels with corner brackets, cream caveat tags, mono source lines in
// the panel footers, numbers that LAND whole on their word — nothing ever counts through a value the sheet doesn't print).
//
//   s15  B15 THIRTY HOURS   "And yet." keeps its breath (R01: lyric only). On the R02 cut the figure panel (5-DAY TRACK
//                           ERROR: AI MODEL vs PHYSICS ENSEMBLE, footer SOURCE · NATURE · AUG 2026) opens on the right — a
//                           schematic storm eye over a coastline — and the beat's caveat tag EVALUATION CO-AUTHORED BY THE
//                           DEVELOPER wipes on under it, complete on "AI" (before any B15 figure, ours or the chrome's).
//                           "AI" the AI MODEL cone grows (mint), full as 230 KM lands; "storm" the PHYSICS ENSEMBLE cone
//                           (white, dashed) widens OUT of it (never drawn narrower than the AI cone), full as 370 KM lands;
//                           a CV box marks the REAL hurricane eye in R02 (no link to the schematic: the figure's numbers are
//                           2023–24 averages, not this storm). On the tail of "tracks:" the headline panel (lower left)
//                           opens with its label and footer source; +30 H lands whole on "thirty". "warning." pulses the AI cone.
//   s16  B16 SECOND READER  On the cut the results panel opens on the right (header SCREENING SENSITIVITY, AI-SUPPORTED vs
//                           STANDARD, footer SOURCE · THE LANCET (MASAI TRIAL) · JAN 2026 typed by "In"); "trial"
//                           105,934 WOMEN, SWEDEN; "AI-supported" the two bars grow; 80.5% / 73.8% land whole on
//                           "mammograms:"; "more cancers" marks the gap between the bars (no new number); "found," a
//                           cream card opens with SCREEN-READING WORKLOAD (INTERIM ANALYSIS) and the caveat tag AI DOES
//                           NOT REPLACE RADIOLOGISTS; −44% lands whole on "lighter".
//   dates WHAT TO WATCH     the WHAT TO WATCH panel (lower left): a split-flap date settles the month on the month word
//                           and the day on the day word (no in-between leaf shows a digit), with the date's source typed
//                           into the panel footer from the month word (complete long before the day lands); for the two
//                           conditional dates the caveat tag UNLESS EXTENDED rides the panel header from the month word
//                           (before any digit of the date, ours or the chrome's) until the date leaves the board. A cream
//                           event card (right) fills row by row on the event words (the conditional ones repeat the tag
//                           with their row) and leaves at the next line or the next cut, whichever is first; a calendar
//                           strip along the bottom (OCT → JAN, AS OF 18 OCT 2026) drops a marker per date — only the date
//                           whose source is in the footer carries its label (and its caveat), earlier dates stay as bare
//                           ticks. Swell (after "end."): 10 JAN 2027 holds whole — board, year flap, header caveat, footer
//                           source, card, strip label — while a coral playhead runs the strip (bare ticks flare as it
//                           passes) and the zoom builds into a white flash that hands off to the white final chorus. No
//                           recap, no new facts in the swell.
// The bridge lines (s15/s16) are drawn here in MINT (storyboard.d/good-dates.json sets them to mode 'none'); the
// date chant uses the standard block (mode 'block' overrides the chapter's 'mass', which collided with the chrome).
// Every time is anchored to lyric words (X.L / word lookups) or the beat grid after the last word; pure function of X.t.
import type { Chapter, X } from '../x';
import type { Line, Word } from '../../engine/lyrics';
import type { PostOverrides } from '../../engine/scene';
import { font, measure } from '../../engine/type';
import { clamp, ease, hash, lerp, pulse } from '../../engine/util';
import { FONT, C, WHITE, CORAL, INK, rgbaHex, text, hair, appear } from '../kit';
import { cvBox } from '../cards';
import { panel, caveatTag, sourceLine, landText, enter, typedBy, leave, DUR, PANEL_BG, HEAD_H, FOOT_H } from '../brief';

type Ctx = CanvasRenderingContext2D;
const PI = Math.PI;
const MINT = (a = 1) => rgbaHex(C.mint, a);
const CELL = 'rgb(14,15,18)';

// ------------------------------------------------------------------ anchoring helpers
const fold = (s: string) => s.toLowerCase().replace(/[^a-z0-9\-–]/g, '');
/** The first word of line L whose folded text equals q (throws while authoring if the lyric changed). */
function wf(L: Line, q: string, nth = 0): Word {
  const ws = L.words.filter((w) => fold(w.w) === fold(q));
  const w = ws[nth];
  if (!w) throw new Error(`word "${q}" not in line "${L.text}"`);
  return w;
}
const lastW = (L: Line) => L.words[L.words.length - 1]!;

// ------------------------------------------------------------------ small drawing helpers
const mono = (c: Ctx, s: string, x: number, y: number, size: number, col: string, o: { w?: number; align?: CanvasTextAlign; alpha?: number } = {}) =>
  text(c, s, x, y, FONT.mono(o.w ?? 400), size, col, { track: size * 0.12, align: o.align, alpha: o.alpha });
const monoW = (s: string, size: number, w = 400) => measure(s, FONT.mono(w), size, size * 0.12);

/** Greedy word wrap for a given font. */
function wrap(s: string, fam: string, size: number, maxW: number, track = 0) {
  const out: string[] = [];
  let cur = '';
  for (const w of s.split(' ')) {
    const nx = cur ? `${cur} ${w}` : w;
    if (cur && measure(nx, fam, size, track) > maxW) { out.push(cur); cur = w; } else cur = nx;
  }
  if (cur) out.push(cur);
  return out;
}

/** Wrap to the fewest lines, balanced (no orphan word). */
function wrapBal(s: string, fam: string, size: number, maxW: number, track = 0) {
  const g = wrap(s, fam, size, maxW, track);
  if (g.length < 2) return g;
  let lo = maxW * 0.35, hi = maxW;
  for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; if (wrap(s, fam, size, mid, track).length <= g.length) hi = mid; else lo = mid; }
  return wrap(s, fam, size, hi, track);
}
/** A card headline row: one line at up to 54 px if it fits at >= 44 px, else balanced lines at 50 px. */
function fitRow(s: string, fam: string, maxW: number) {
  const w1 = measure(s, fam, 100, -1);
  const one = Math.min(54, (100 * maxW) / Math.max(1, w1));
  if (one >= 44) return { lines: [s], size: one };
  return { lines: wrapBal(s, fam, 50, maxW, -1), size: 50 };
}

// ------------------------------------------------------------------ the bridge lyric, in MINT
// The scene draws block lines with a coral current word; the bridge's accent is mint, so its three lines are set to
// mode 'none' (storyboard.d/good-dates.json) and drawn here exactly as lyricBlock lays them out (same font, size,
// wrap, pop, hairline, show/hide window from the board), with mint in place of coral. Every sung word is marked.
interface Laid { w: Word; x: number; y: number }
function layLine(L: Line, size: number, fam: string, maxW: number) {
  const sp = measure(' ', fam, size);
  const laid: Laid[] = [];
  let x = 0, y = 0;
  for (const w of L.words) {
    const ww = measure(w.w, fam, size, -size * 0.02);
    if (x > 0 && x + ww > maxW) { x = 0; y += size * 1.02; }
    laid.push({ w, x, y });
    x += ww + sp;
  }
  return { laid, height: y + size, width: Math.max(0, ...laid.map((l) => l.x + measure(l.w.w, fam, size, -size * 0.02))) };
}
function lineWin(X: X, L: Line) {
  const lt = X.board.lineTypes.find((x) => x.line.i === L.i);
  if (!lt) return null;
  const t = X.t;
  if (t < lt.showAt || t > lt.hideAt + 0.13) return null;
  const fade = 1 - ease.inCubic(clamp((t - lt.hideAt) / 0.12));
  if (fade <= 0) return null;
  const size = lt.size ?? 74, fam = FONT.grot(lt.weight ?? 800), maxW = lt.maxW ?? 980, x0 = lt.x ?? 72;
  const lay = layLine(L, size, fam, maxW);
  const yTop = lt.anchor === 'bottom' ? (lt.y ?? 900) - lay.height : (lt.y ?? 160);
  return { lt, fade, size, fam, maxW, x0, yTop, ...lay };
}
/** The soft dark pool under the block over footage (drawn first, under the graphics, as the scene does). The bright
 *  radiology plates (S01 scans, S02 light box) get a deeper pool. */
function mintScrim(c: Ctx, X: X, L: Line, deep = 0) {
  if (X.base?.kind !== 'clip') return;
  const g0 = lineWin(X, L);
  if (!g0) return;
  const r = { x: g0.x0, y: g0.yTop, w: g0.width, h: g0.height + 26 };
  const vis = clamp((X.t - g0.lt.showAt) / 0.2) * g0.fade;
  const cx = r.x + r.w * 0.45, cy = r.y + r.h * 0.5, rx = r.w * 0.78 + 160, ry = r.h * 0.95 + 120;
  c.save();
  c.globalAlpha *= vis;
  c.translate(cx, cy); c.scale(rx / ry, 1);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, ry);
  g.addColorStop(0, `rgba(5,6,8,${0.58 + 0.24 * deep})`); g.addColorStop(0.55, `rgba(5,6,8,${0.34 + 0.3 * deep})`); g.addColorStop(1, 'rgba(5,6,8,0)');
  c.fillStyle = g; c.fillRect(-ry, -ry, 2 * ry, 2 * ry);
  c.restore();
}
function mintLine(c: Ctx, X: X, L: Line) {
  const g = lineWin(X, L);
  if (!g) return;
  const t = X.t;
  const inK = ease.outExpo(clamp((t - g.lt.showAt) / 0.25));
  let ai = -1;
  L.words.forEach((w, i) => { if (t >= w.start - 0.02) ai = i; });
  c.save();
  c.globalAlpha *= g.fade;
  g.laid.forEach((l, i) => {
    const sung = t >= l.w.start - 0.02;
    const current = i === ai && t < l.w.end + 0.08;
    const col = current ? MINT() : sung ? WHITE(0.97) : g.lt.ghost !== false ? MINT(0.22 * inK) : null;
    if (!col) return;
    const pop = sung ? 1 + 0.06 * (1 - ease.outCubic(clamp((t - l.w.start) / 0.18))) : 1;
    c.save();
    c.translate(g.x0 + l.x, g.yTop + l.y + g.size * 0.8);
    c.scale(pop, pop);
    text(c, l.w.w, 0, 0, g.fam, g.size, col, { track: -g.size * 0.02 });
    c.restore();
    if (sung) X.mark(l.w);
  });
  const ruleY = g.yTop + g.height + 26;
  const rk = ease.outCubic(clamp((t - L.start) / 0.5));
  hair(c, g.x0, ruleY, g.x0 + Math.min(g.maxW, 620) * rk, ruleY, WHITE(0.7), 1.2);
  c.restore();
}

// ================================================================== s15 · B15 · THIRTY HOURS
const SRC_B15 = 'SOURCE · NATURE · AUG 2026';
const TAG15 = 'EVALUATION CO-AUTHORED BY THE DEVELOPER';   // fact sheet §2 (B15 balance): the on-screen caveat wording
const S15 = {
  fig: { x: 1110, y: 290, w: 720, h: 470 },     // track-cone figure (right column): header 330, footer 728; caveat tag 772
  head: { x: 110, y: 600, w: 640, h: 322 },     // +30 H headline panel (lower left)
  eye: { x: 1200, y: 494 }, xe: 1612,           // storm eye → end of the 5-day cone
  rPhys: 110, rAI: 110 * (230 / 370),           // cone radius at the end ∝ 5-day track error (370 KM vs 230 KM)
};
/** R02's real hurricane eye (with its central dense overcast), source-frame 0..1, measured on the conformed frames. */
const R02_EYE: [number, number, number, number] = [0.418, 0.578, 0.486, 0.662];

// ------------------------------------------------------------------ the chrome board's carry-over source
// The chrome's headline board (flaps.ts; rows from storyboard.json `countdown`) can keep the previous story's row past
// this chapter's first cut, and each old cell only leaves when its staggered flip starts. While any VALUE glyph of that
// row (digit, %, +, decimal point) is still standing, its source rides under the chrome block (house source line,
// backed), so the number is never up without its source. The window mirrors the chrome's phrase board (chrome.ts: 14
// cols) and flaps.ts' stagger (cell r,k starts at tc + (r·cols + k)·stag/2 + k·stag, stag 0.03) — an upper bound if that
// stagger is tightened. Pure function of t; draws nothing once the old row's value cells are all flipping.
const CHROME_COLS = 14, CHROME_STAG = 0.03;
const isVal = (g: string) => /[0-9%+.,]/.test(g);
const flapNorm = (s: string) => s.toUpperCase().replace(/[–—]/g, '-').trim();
/** When the chrome's headline board turns to the row whose first line reads `first` (dash-insensitive), or null. */
function chromeAt(X: X, first: string): number | null {
  const e = X.board.countdown.find(([, rows]) => flapNorm(rows[0] ?? '') === flapNorm(first));
  return e ? e[0] : null;
}
function chromeCarry(c: Ctx, X: X, src: string) {
  const cd = X.board.countdown, t = X.t, t0 = X.ch.t0;
  let ip = -1;
  for (let i = 0; i < cd.length; i++) if (cd[i]![0] < t0 - 1e-3) ip = i;
  const prev = cd[ip], next = cd[ip + 1];
  if (!prev || t < t0) return;
  const tn = next ? next[0] : Infinity;
  let gone = -Infinity;
  prev[1].slice(0, 2).forEach((row, r) => {
    const a = row.toUpperCase(), b = (next?.[1][r] ?? '').toUpperCase();
    for (let k = 0; k < Math.min(a.length, CHROME_COLS); k++) {
      if (!isVal(a[k]!) || a[k] === (b[k] ?? ' ')) continue;   // an unchanged cell belongs to the new row
      gone = Math.max(gone, tn + (r * CHROME_COLS + k) * CHROME_STAG * 0.5 + k * CHROME_STAG + 1 / 24);
    }
  });
  if (t >= gone) return;
  sourceLine(c, src, 1830, 258, { align: 'right', back: true });
}

/** Storm-eye glyph: an open eye with two spiral arms, spinning (counter-clockwise, as seen from orbit in the north). */
function stormEye(c: Ctx, x: number, y: number, r: number, rot: number, col: string) {
  c.save();
  c.translate(x, y); c.rotate(rot);
  c.strokeStyle = col; c.lineCap = 'round';
  c.lineWidth = Math.max(2, r * 0.13);
  c.beginPath(); c.arc(0, 0, r * 0.3, 0, PI * 2); c.stroke();
  for (const s of [0, PI]) {
    c.beginPath();
    for (let i = 0; i <= 28; i++) {
      const u = i / 28, th = s + u * 2.4, rad = r * (0.3 + 0.75 * Math.pow(u, 1.15));
      const px = Math.cos(th) * rad, py = Math.sin(th) * rad;
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.lineWidth = Math.max(2, r * 0.15); c.stroke();
  }
  c.restore();
}

/** A forecast cone from the eye along +x, grown to g (0..1): tapered sides and a round 5-day cap. */
function cone(c: Ctx, ex: number, ey: number, xe: number, rEnd: number, g: number) {
  const xc = lerp(ex, xe, g), r = Math.max(4, rEnd * g), r0 = 4;
  c.beginPath();
  c.moveTo(ex, ey - r0);
  c.lineTo(xc, ey - r);
  c.arc(xc, ey, r, -PI / 2, PI / 2);
  c.lineTo(ex, ey + r0);
  c.closePath();
}

/** Coastline points (deterministic), top → bottom along the right edge of the figure. */
function coastPts(x0: number, y0: number, y1: number) {
  const pts: [number, number][] = [];
  for (let i = 0, y = y0; y <= y1; i++, y += 16) pts.push([x0 + 14 * Math.sin(i * 0.55) + (hash(i, 51) - 0.5) * 18 + (y - y0) * 0.05, y]);
  return pts;
}

function drawS15(c: Ctx, X: X) {
  const t = X.t;
  const LY = X.L('And yet'), L = X.L('AI storm tracks');
  const tAnd = LY.words[0]!.start;
  const tAI = wf(L, 'AI').start, tStorm = wf(L, 'storm').start;
  const tThirty = wf(L, 'thirty').start, tWarn = wf(L, 'warning').start;
  const tV1 = tAI + 0.12, tV2 = tStorm + 0.12;   // contact frames of the support values 230 KM / 370 KM
  const out = leave(t, X.ch.t1);
  // the figure arrives with the cut to the closer storm (R02) on the tail of "yet.": "And yet." keeps its breath on R01
  const r02 = X.S('R02');
  const tFig = r02 && r02.t0 > tAnd && r02.t0 < tAI ? r02.t0 : tAI - 0.27;

  mintScrim(c, X, LY); mintScrim(c, X, L);

  // ---- CV box on the REAL hurricane eye in R02, on "storm" (drawn here rather than in storyboard.d: the eye sits in
  // bright cloud, where the storyboard's white brackets vanish — the ink variant reads). It only names the eye in the
  // footage: nothing links it to the schematic, whose numbers are 2023–24 averages, not this storm's track.
  const r02on = !!r02 && X.shot.id === r02.id && X.base?.kind === 'clip';
  if (r02on) {
    c.save(); c.globalAlpha *= out * leave(t, r02!.t1, 0.12);
    cvBox(c, X.px(R02_EYE), 'STORM EYE', t, tStorm, { ink: true, cross: true });
    c.restore();
  }

  // ---- the beat's caveat, free-standing under the figure: complete on "AI", before the first B15 figure appears
  // anywhere (230 KM here, the chrome's +30 HOURS from "AI"), and up for the rest of the chapter
  const F = S15.fig, { eye } = S15;
  caveatTag(c, TAG15, F.x, F.y + F.h + 12, { k: enter(t, tAI - DUR.tag, DUR.tag), alpha: out });

  // ---- the track-cone figure (right column), open from the R02 cut; its footer source is complete by "AI" (before 230
  // KM's first frame, and before the chrome starts turning to +30 HOURS on that word)
  panel(c, F.x, F.y, F.w, F.h, {
    k: enter(t, tFig, DUR.panel + 0.08), alpha: out,
    title: '5-DAY TRACK ERROR: AI MODEL vs PHYSICS ENSEMBLE',
    source: SRC_B15, sourceU: typedBy(t, tAI + 0.02),
    draw: (p) => {
      const top = p.body.y, bot = p.body.y + p.body.h;
      // coastline + land hatching on the right
      const pts = coastPts(F.x + F.w - 86, top + 12, bot - 82);
      const ck = ease.outCubic(clamp((t - tFig) / 0.6));
      const nShow = Math.max(2, Math.floor(pts.length * ck));
      c.save();
      c.beginPath();
      c.moveTo(pts[0]![0], pts[0]![1]);
      for (let i = 1; i < nShow; i++) c.lineTo(pts[i]![0], pts[i]![1]);
      c.lineTo(F.x + F.w, pts[nShow - 1]![1]); c.lineTo(F.x + F.w, pts[0]![1]); c.closePath();
      c.save(); c.clip();
      c.strokeStyle = WHITE(0.13); c.lineWidth = 1;
      for (let d = -400; d < 600; d += 9) { c.beginPath(); c.moveTo(F.x + F.w - 120 + d, top); c.lineTo(F.x + F.w - 120 + d - 380, top + 380); c.stroke(); }
      c.restore();
      c.beginPath();
      c.moveTo(pts[0]![0], pts[0]![1]);
      for (let i = 1; i < nShow; i++) c.lineTo(pts[i]![0], pts[i]![1]);
      c.strokeStyle = WHITE(0.62); c.lineWidth = 1.5; c.stroke();
      c.restore();
      // cones: the AI model (mint) grows from the eye on "AI", reaching its full 5-day length on 230 KM's contact frame;
      // the physics ensemble (white, dashed, drawn underneath) then WIDENS out of the AI cone on "storm", full on 370 KM's
      // contact frame — on no frame is the physics cone drawn narrower or shorter than the AI cone
      const gA = ease.outCubic(clamp((t - (tV1 - 0.18)) / 0.18)), gP = ease.outCubic(clamp((t - (tV2 - 0.18)) / 0.18));
      if (gP > 0 && gA > 0) {
        c.save(); c.globalAlpha *= clamp(gP * 4);
        cone(c, eye.x, eye.y, S15.xe, lerp(S15.rAI, S15.rPhys, gP), gA);
        c.fillStyle = WHITE(0.07); c.fill();
        c.setLineDash([7, 5]); c.strokeStyle = WHITE(0.75); c.lineWidth = 1.5; c.stroke(); c.setLineDash([]);
        c.restore();
      }
      if (gA > 0) {
        const pw = pulse(t, tWarn, 0.18);
        cone(c, eye.x, eye.y, S15.xe, S15.rAI, gA);
        c.fillStyle = MINT(0.2 + 0.18 * pw); c.fill();
        c.strokeStyle = MINT(1); c.lineWidth = 2 + 1.5 * pw; c.stroke();
      }
      // track centre line + the 5-day radius dimensions (physics up, AI down), drawn on as each value lands
      if (gA > 0) {
        c.save(); c.setLineDash([2, 6]); hair(c, eye.x, eye.y, lerp(eye.x, S15.xe, gA), eye.y, WHITE(0.55), 1.2); c.restore();
      }
      const dA = clamp((t - (tV1 - 0.04)) / 0.12), dP = clamp((t - (tV2 - 0.04)) / 0.12);
      if (dP > 0) {
        hair(c, S15.xe, eye.y, S15.xe, eye.y - S15.rPhys * dP, WHITE(0.9), 1.5);
        hair(c, S15.xe - 7, eye.y - S15.rPhys * dP, S15.xe + 7, eye.y - S15.rPhys * dP, WHITE(0.9), 1.5);
      }
      if (dA > 0) {
        hair(c, S15.xe, eye.y, S15.xe, eye.y + S15.rAI * dA, MINT(1), 2);
        hair(c, S15.xe - 7, eye.y + S15.rAI * dA, S15.xe + 7, eye.y + S15.rAI * dA, MINT(1), 2);
      }
      // the storm eye (on top of the cones' origin)
      const ek = appear(t, tFig + 0.04, 0.3);
      if (ek > 0) {
        c.save(); c.globalAlpha *= ek;
        c.fillStyle = PANEL_BG; c.beginPath(); c.arc(eye.x, eye.y, 26, 0, PI * 2); c.fill();
        stormEye(c, eye.x, eye.y, 30, -(t - tAnd) * 2.2, WHITE(0.95));
        c.restore();
      }
      // legend: AI MODEL 230 KM (mint) · PHYSICS ENSEMBLE 370 KM (white); each value lands whole on its contact frame
      const legend = (y: number, tv: number, name: string, val: string, col: string, dashed: boolean) => {
        const k = appear(t, tv - 0.14, 0.2);
        if (k <= 0) return;
        c.save(); c.globalAlpha *= k;
        c.strokeStyle = col; c.lineWidth = dashed ? 1.5 : 2.5;
        if (dashed) c.setLineDash([7, 5]);
        c.beginPath(); c.moveTo(F.x + 24, y - 5); c.lineTo(F.x + 60, y - 5); c.stroke();
        c.setLineDash([]);
        mono(c, name, F.x + 74, y, 14, col, { w: 600 });
        c.restore();
        landText(c, val, F.x + 74 + monoW(name, 14, 600) + 16, y + 1, FONT.mono(800), 22, col, t, tv, { track: 22 * 0.12, amp: 0.3 });
      };
      legend(bot - 46, tV1, 'AI MODEL', '230 KM', MINT(), false);
      legend(bot - 16, tV2, 'PHYSICS ENSEMBLE', '370 KM', WHITE(0.92), true);
    },
  });

  // ---- the headline (lower left): the panel opens with its label on the tail of "tracks:" (after the storm's entrances
  // have settled); its footer source is typed by "thirty", where +30 H lands whole (the only string it ever shows)
  const Hd = S15.head, tHd = tThirty - 0.36;
  panel(c, Hd.x, Hd.y, Hd.w, Hd.h, {
    k: enter(t, tHd, DUR.panel), alpha: out,
    source: SRC_B15, sourceU: typedBy(t, tThirty),
    draw: () => {
      landText(c, '+30 H', Hd.x + 26, Hd.y + 196, FONT.grot(900), 200, MINT(), t, tThirty, { track: -4, amp: 0.16 });
      const la = appear(t, tHd, 0.2);
      mono(c, 'MORE HURRICANE WARNING AT EQUAL 5-DAY', Hd.x + 30, Hd.y + 236, 19, WHITE(0.95), { w: 600, alpha: la });
      mono(c, 'TRACK ACCURACY (2023–24 STORMS)', Hd.x + 30, Hd.y + 262, 19, WHITE(0.95), { w: 600, alpha: la });
    },
  });

  mintLine(c, X, LY); mintLine(c, X, L);
}

// ================================================================== s16 · B16 · SECOND READER
const SRC_B16 = 'SOURCE · THE LANCET (MASAI TRIAL) · JAN 2026';
const S16 = {
  res: { x: 1110, y: 290, w: 720, h: 318 },     // results panel (right column): header 330, footer 576
  card: { x: 1110, y: 640, w: 720, h: 222 },    // −44% workload card
  bar: { x: 1134, w: 420, h: 30 },
};

function drawS16(c: Ctx, X: X) {
  const t = X.t;
  const L = X.L('In a Swedish trial');
  const tIn = L.words[0]!.start, tSwe = wf(L, 'Swedish').start, tTrial = wf(L, 'trial').start, tAIs = wf(L, 'AI-supported').start;
  const tMam = wf(L, 'mammograms').start, tMore = wf(L, 'more').start, tCancers = wf(L, 'cancers').start;
  const tLight = wf(L, 'lighter').start;
  const out = leave(t, X.ch.t1);

  mintScrim(c, X, L, 1);
  // the chrome may still be showing B15's +30 HOURS across the cut: its source rides under the chrome until it flips
  chromeCarry(c, X, SRC_B15);

  // ---- results panel: sensitivity, AI-SUPPORTED vs STANDARD. Opens on the S01 cut (the chapter's start, just before
  // "In", the word the chrome's flap starts on); its footer source is typed by "In" — complete before the chrome's
  // first 80.5% digit can settle, even if the chrome's state moves onto the cut — and both values land on "mammograms:"
  const R = S16.res, B = S16.bar;
  panel(c, R.x, R.y, R.w, R.h, {
    k: enter(t, Math.min(X.ch.t0, tIn - 0.22), DUR.panel), alpha: out,
    title: 'SCREENING SENSITIVITY, AI-SUPPORTED vs STANDARD',
    source: SRC_B16, sourceU: typedBy(t, Math.min(tSwe + 0.12, tIn)),
    draw: (p) => {
      const y0 = p.body.y;
      // the label's second half, whole (never typed: a partly typed 105,934 would be a number the sheet doesn't print)
      mono(c, '105,934 WOMEN, SWEDEN', R.x + 16, y0 + 26, 13, WHITE(0.72), { alpha: appear(t, tTrial - 0.08, 0.25) });
      const g = ease.outCubic(clamp((t - tAIs) / Math.max(0.2, tMam - tAIs)));
      const rows = [
        { name: 'AI-SUPPORTED', v: '80.5%', f: 0.805, col: MINT(), y: y0 + 78 },
        { name: 'STANDARD', v: '73.8%', f: 0.738, col: WHITE(0.92), y: y0 + 156 },
      ];
      // the two rows (names + empty 0–100 % tracks) stand from the panel's opening; the bars fill on "AI-supported"
      const rk = appear(t, tIn - 0.05, 0.3);
      for (const r of rows) {
        if (rk > 0) {
          c.save(); c.globalAlpha *= rk;
          mono(c, r.name, B.x, r.y, 15, r.col, { w: 600 });
          c.fillStyle = WHITE(0.1); c.fillRect(B.x, r.y + 12, B.w, B.h);
          if (g > 0) { c.fillStyle = r.col; c.fillRect(B.x, r.y + 12, B.w * r.f * g, B.h); }
          c.restore();
        }
        landText(c, r.v, R.x + R.w - 24, r.y + 44, FONT.grot(900), 74, r.col, t, tMam, { align: 'right', track: -2, amp: 0.24 });
      }
      // "more cancers found": the gap between the two bars (no number — the two values already say it)
      const mk = appear(t, tMore, 0.3);
      if (mk > 0) {
        const xs = B.x + B.w * 0.738, xa = B.x + B.w * 0.805;
        c.save(); c.globalAlpha *= mk;
        c.setLineDash([3, 4]);
        hair(c, xs, rows[1]!.y + 12, xs, lerp(rows[1]!.y + 12, rows[0]!.y + 4, ease.outCubic(mk)), WHITE(0.8), 1.2);
        c.setLineDash([]);
        const ck = pulse(t, tCancers, 0.25);
        c.strokeStyle = WHITE(0.95); c.lineWidth = 1.5 + 1.5 * ck;
        c.strokeRect(xs, rows[0]!.y + 9, xa - xs, B.h + 6);
        c.fillStyle = WHITE(0.35 * ck); c.fillRect(xs, rows[0]!.y + 12, xa - xs, B.h);
        c.restore();
      }
    },
  });

  // ---- the second number: −44% screen-reading workload. The cream card opens across "found," with its label and the
  // caveat tag (complete before the number); −44% lands whole on "lighter". Its source is the results panel's footer
  // (same trial), which stays up to the chapter's end.
  const K = S16.card;
  panel(c, K.x, K.y, K.w, K.h, {
    paper: true, k: enter(t, tLight - 0.3, DUR.panel), alpha: out,
    draw: () => {
      const nw = landText(c, '−44%', K.x + 24, K.y + 128, FONT.grot(900), 120, INK(0.96), t, tLight, { track: -4, amp: 0.2 });
      const la = appear(t, tLight - 0.24, 0.25);
      hair(c, K.x + 26, K.y + 154, lerp(K.x + 26, K.x + K.w - 26, la), K.y + 154, INK(0.7), 1.5);
      const lx = K.x + 24 + nw + 28;
      mono(c, 'SCREEN-READING WORKLOAD', lx, K.y + 86, 17, INK(0.92), { w: 600, alpha: la });
      mono(c, '(INTERIM ANALYSIS)', lx, K.y + 112, 17, INK(0.92), { w: 600, alpha: la });
      caveatTag(c, 'AI DOES NOT REPLACE RADIOLOGISTS', K.x + 26, K.y + 174, { ink: true, k: enter(t, tLight - 0.28, DUR.tag) });
    },
  });

  mintLine(c, X, L);
}

// ================================================================== dates · WHAT TO WATCH
// ------------------------------------------------------------------ mechanical split-flap (local; the kit board has no
// leaf fall). Each changed cell falls through the drum a few leaves (old top folds over the hinge, the new bottom lands),
// in-between leaves coral like the chrome board. A state's time is when it SETTLES: every changed cell lands its final
// glyph within ~one frame of it (left → right), so a date lands on its word. In-between leaves never show a digit (a
// letter stands in), so no frame reads as a real-looking wrong date. States from `fastFrom` on fall fewer, quicker
// leaves (the swell's recap riffle on eighth notes).
const DRUM = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:-–?!/';
const LETTERS = 'AHKMNRWXY';            // stand-ins for in-between digits: no half of these reads as part of a numeral
interface Flaps {
  x: number; y: number; cols: number; rows: number; cw: number; ch: number; gap?: number;
  states: [number, string[]][];      // [settle time, rows]
  dt?: number; steps?: number; stagger?: number; seed?: number; glyph?: number;
  fastFrom?: number;
}
const chAt = (rows: string[], r: number, k: number) => (rows[r] ?? '').toUpperCase()[k] ?? ' ';
function hinge(c: Ctx, x: number, y: number, w: number, h: number) {
  const lw = 1.5 + h * 0.006;
  c.fillStyle = 'rgba(0,0,0,0.72)'; c.fillRect(x, y + h / 2 - lw / 2, w, lw);
  if (h > 60) {
    const pw = Math.max(2, w * 0.035), ph = Math.max(4, h * 0.05);
    c.fillStyle = 'rgba(255,255,255,0.14)';
    c.fillRect(x + 1, y + h / 2 - ph / 2, pw, ph); c.fillRect(x + w - 1 - pw, y + h / 2 - ph / 2, pw, ph);
  }
}
function flapStatic(c: Ctx, x: number, y: number, w: number, h: number, g: string, col: string) {
  c.fillStyle = CELL; c.fillRect(x, y, w, h);
  c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(x, y, w, h / 2);
  if (g !== ' ') { c.fillStyle = col; c.fillText(g, x + w / 2, y + h / 2 + h * 0.03); }
  hinge(c, x, y, w, h);
}
function leaf(c: Ctx, x: number, y: number, w: number, h: number, g: string, col: string, half: 0 | 1, sy: number, shade: number) {
  if (sy <= 0.002) return;
  const hy = y + h / 2, y0 = half ? hy : y;
  c.save();
  c.translate(0, hy); c.scale(1, sy); c.translate(0, -hy);
  c.beginPath(); c.rect(x, y0, w, h / 2); c.clip();
  c.fillStyle = CELL; c.fillRect(x, y0, w, h / 2);
  if (!half) { c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(x, y0, w, h / 2); }
  if (g !== ' ') { c.fillStyle = col; c.fillText(g, x + w / 2, y + h / 2 + h * 0.03); }
  if (shade > 0.003) { c.fillStyle = `rgba(0,0,0,${Math.min(0.9, shade).toFixed(3)})`; c.fillRect(x, y0, w, h / 2); }
  c.restore();
}
function flapFall(c: Ctx, x: number, y: number, w: number, h: number, a: string, z: string, p: number, colA: string, colZ: string) {
  leaf(c, x, y, w, h, z, colZ, 0, 1, p < 0.5 ? 0.45 * (1 - p * 2) : 0);
  leaf(c, x, y, w, h, a, colA, 1, 1, p >= 0.5 ? 0.35 * (p - 0.5) * 2 : 0);
  if (p < 0.5) leaf(c, x, y, w, h, a, colA, 0, Math.cos(p * PI), p * 1.1);
  else leaf(c, x, y, w, h, z, colZ, 1, -Math.cos(p * PI), (1 - p) * 0.9);
  hinge(c, x, y, w, h);
}
function flapBoard(c: Ctx, b: Flaps, t: number) {
  const gap = b.gap ?? Math.max(3, b.cw * 0.07);
  const tim = (tc: number) => (b.fastFrom != null && tc >= b.fastFrom - 1e-3
    ? { dt: 0.034, smax: 3, stag: 0.008 }
    : { dt: b.dt ?? 0.05, smax: b.steps ?? 4, stag: b.stagger ?? 0.012 });
  // a state takes the board over when its earliest leaf starts to fall (its settle time minus the longest fall)
  const pre = (tc: number) => { const m = tim(tc); return m.smax * m.dt + 0.03; };
  let si = -1;
  for (let i = 0; i < b.states.length; i++) if (t >= b.states[i]![0] - pre(b.states[i]![0])) si = i;
  const cur = si >= 0 ? b.states[si]![1] : [], tc = si >= 0 ? b.states[si]![0] : -1e9;
  const prev = si > 0 ? b.states[si - 1]![1] : si === 0 ? [] : null;
  const { dt, smax, stag } = tim(tc);
  const seed = b.seed ?? 1, N = DRUM.length;
  c.save();
  (c as any).letterSpacing = '0px';
  c.font = font(FONT.flap(700), b.ch * (b.glyph ?? 0.74));
  c.textAlign = 'center'; c.textBaseline = 'middle';
  // stagger from the first cell that changes (so a day landing on its word is not delayed by the blank cells before it)
  let k0 = b.cols;
  if (prev) for (let r = 0; r < b.rows; r++) for (let k = 0; k < b.cols; k++) if (chAt(cur, r, k) !== chAt(prev, r, k)) k0 = Math.min(k0, k);
  for (let r = 0; r < b.rows; r++) for (let k = 0; k < b.cols; k++) {
    const x = b.x + k * (b.cw + gap), y = b.y + r * (b.ch + gap);
    const to = chAt(cur, r, k), from = prev ? chAt(prev, r, k) : to;
    if (to === from) { flapStatic(c, x, y, b.cw, b.ch, to, WHITE(0.96)); continue; }
    const ia = Math.max(0, DRUM.indexOf(from)), ib = Math.max(0, DRUM.indexOf(to));
    const n = Math.max(1, (ib - ia + N) % N);
    const kk = Math.min(n, Math.max(1, smax - Math.floor(hash(r, k, seed) * Math.min(3, smax))));
    // this cell's last leaf lands at `end` (within +0.025 s of the state's time), its first falls kk leaves earlier
    const end = tc - 0.015 + Math.min(0.03, Math.max(0, k - k0) * stag + r * stag * 0.5) + hash(k, r, seed + 7) * 0.01;
    const local = t - (end - kk * dt);
    if (local < 0) { flapStatic(c, x, y, b.cw, b.ch, from, WHITE(0.96)); continue; }
    const i = Math.floor(local / dt);
    if (i >= kk) { flapStatic(c, x, y, b.cw, b.ch, to, WHITE(0.96)); continue; }
    const dig = (g: string) => g >= '0' && g <= '9';
    const mid = (j: number) => {
      const g = DRUM[(ib - (kk - j) + N * 8) % N]!;
      // a digit cell (or any digit on the walk) falls through stand-in letters, never another numeral-like glyph
      return dig(g) || dig(to) || dig(from) ? LETTERS[Math.floor(hash(r, k, seed + 31 + j) * LETTERS.length) % LETTERS.length]! : g;
    };
    const seq = (j: number) => (j <= 0 ? from : j >= kk ? to : mid(j));
    const a = seq(i), z = seq(i + 1);
    flapFall(c, x, y, b.cw, b.ch, a, z, local / dt - i, i === 0 ? WHITE(0.96) : CORAL(0.92), i + 1 >= kk ? WHITE(0.96) : CORAL(0.92));
  }
  c.restore();
}

// ------------------------------------------------------------------ the five dates (fact sheet §3 + §7, brief strings)
interface DateSpec {
  q: string;                         // the chant line
  board: [string, string][];         // [word, 9-col board text] — month settles on the month word, day on the day word
  tag: string;                       // the strip marker label
  d: [number, number];               // day index from 1 Oct (strip position; 09–10 NOV spans two days)
  rows: [string, string][];          // [event text, word it lands on]
  sub?: [string, string][];          // mono detail lines, [text, word it appears on]
  unless?: boolean;                  // UNLESS EXTENDED: wipes on with the (first) event row, rides the strip marker
  year?: string;                     // the year flap (10 JAN 2027)
  src: string;                       // the date's source line (fact sheet §3 sources, publisher names as in the outro roll)
}
const DATES: DateSpec[] = [
  { q: 'October twenty-eight', board: [['October', '      OCT'], ['twenty-eight', '   28 OCT']], tag: '28 OCT', d: [27, 27],
    rows: [['MICROSOFT EARNINGS', 'Microsoft'], ['FED DECISION', 'Fed']], sub: [['(FOMC 27–28 OCT)', 'Fed']],
    src: 'SOURCE · MICROSOFT IR / FEDERAL RESERVE · OCT 2026' },                       // S83 + S101 (FOMC calendar, §7)
  { q: 'November three', board: [['November', '      NOV'], ['three', '   03 NOV']], tag: '03 NOV', d: [33, 33],
    rows: [['US MIDTERMS', 'three']],   // lands with its date: "the midterms." runs straight into the next line
    src: 'SOURCE · REUTERS VIA STAR-ADVERTISER · MAR 2026' },                          // S86
  { q: 'November nine and ten', board: [['November', '      NOV'], ['nine', '09    NOV'], ['ten', '09–10 NOV']], tag: '09–10 NOV', d: [39, 40],
    rows: [['EXPORT-CONTROL PAUSES END', 'paused']], unless: true,
    sub: [['09 NOV · US BIS AFFILIATES RULE', 'export'], ['10 NOV · CHINA EXPANDED RARE-EARTH CONTROLS', 'curbs']],
    src: 'SOURCE · FEDERAL REGISTER / JONES DAY · NOV 2025' },                         // S87, S88
  { q: 'December two', board: [['December', '      DEC'], ['two', '   02 DEC']], tag: '02 DEC', d: [62, 62],
    rows: [['EU AI ACT BAN ON AI NUDIFICATION APPLIES', 'Europe']],
    src: 'SOURCE · ARTIFICIALINTELLIGENCEACT.EU · JUL 2026' },                         // S93 (named as in the outro roll)
  { q: 'January ten', board: [['January', '      JAN'], ['ten', '   10 JAN']], tag: '10 JAN 2027', d: [101, 101],
    rows: [['US–CHINA TRADE TRUCE ENDS', 'US–China']], unless: true, year: '2027',
    src: 'SOURCE · REUTERS VIA INTERNAZIONALE · SEP 2026' },                           // S95
];
const STRIP_DAYS = 123;                // 1 Oct → 1 Feb
const MONTHS: [string, number][] = [['OCT', 0], ['NOV', 31], ['DEC', 61], ['JAN', 92]];
const AS_OF = 17;                      // 18 Oct (fact sheet "as of 18 Oct 2026")
const CAVEAT = 'UNLESS EXTENDED';

// The date panel sits lower left (the right column holds the chrome's own flap board above the event card), the event
// card in the right column, the calendar strip along the bottom.
const DT = {
  house: { x: 110, y: 560, w: 720, h: 210 },
  card: { x: 1110, y: 290, w: 720 },
  strip: { x: 110, y: 852, w: 1720, h: 132, ax0: 140, ax1: 1800, ay: 930 },
};
const sx = (d: number) => lerp(DT.strip.ax0, DT.strip.ax1, d / STRIP_DAYS);

interface Resolved { s: DateSpec; L: Line; month: number; land: number; row: number; start: number; next: number }
function resolveDates(X: X): Resolved[] {
  const ls = DATES.map((s) => X.L(s.q));
  return DATES.map((s, i) => {
    const L = ls[i]!;
    const land = wf(L, s.board[s.board.length - 1]![0]).start;
    return {
      s, L, land,
      month: wf(L, s.board[0]![0]).start,
      row: wf(L, s.rows[0]![1]).start - 0.04,        // the first event row (and its caveat) lands
      start: L.words[0]!.start,
      next: i + 1 < ls.length ? ls[i + 1]!.words[0]!.start : Infinity,
    };
  });
}
/** The swell after the last chanted word. 10 JAN 2027 holds whole (board, year flap, header caveat, footer source, event
 *  card, strip label) to the chapter's end; from the first eighth note after the lyric clears a coral playhead runs the
 *  strip (accelerating), reaching its end as the white flash starts building, and the flash hands off to the final
 *  chorus at the cut. No recap, no new facts. */
function swell(X: X, ds: Resolved[]) {
  const L5 = ds[ds.length - 1]!.L;
  const S = lastW(L5).end, E = X.ch.t1;
  const hide = X.board.lineTypes.find((x) => x.line.i === L5.i)?.hideAt ?? S + 0.9;
  const R0 = X.tBeat(Math.ceil(X.beat(hide) * 2 - 0.02) / 2);  // the first eighth after the lyric clears
  const F0 = E - 0.45;                                         // the flash builds from here to the cut
  const P1 = Math.max(R0 + 0.3, F0);                           // the playhead leaves the strip as the flash starts
  const x0 = sx(AS_OF), x1 = DT.strip.ax1 + 24;
  /** playhead x at t (ease-in: it accelerates into the flash), or -1 before it starts */
  const px = (t: number) => (t < R0 ? -1 : lerp(x0, x1, ease.inQuad(clamp((t - R0) / Math.max(1e-3, P1 - R0)))));
  /** when the playhead passes x (inverse of px) */
  const pass = (x: number) => R0 + (P1 - R0) * Math.sqrt(clamp((x - x0) / (x1 - x0)));
  return { S, E, R0, F0, P1, px, pass };
}
/** A date's strip position (mid of its span). */
const xmOf = (r: Resolved) => (sx(r.s.d[0]) + sx(r.s.d[1] + (r.s.d[1] > r.s.d[0] ? 1 : 0))) / 2;

function eventCard(c: Ctx, t: number, r: Resolved, tOut: number) {
  const { s, L } = r;
  const alpha = tOut < Infinity ? leave(t, tOut) : 1;
  const k = enter(t, r.row - 0.06, DUR.panel);
  if (k <= 0 || alpha <= 0) return;
  const pad = 28, w = DT.card.w, fam = FONT.grot(900), inner = w - pad * 2, X0 = DT.card.x, Y0 = DT.card.y;
  const rowLines = s.rows.map(([txt, wq]) => ({ ...fitRow(txt, fam, inner), at: wf(L, wq).start - 0.04 }));
  const subs = (s.sub ?? []).map(([txt, wq]) => ({ lines: wrapBal(txt, FONT.mono(600), 16, inner, 16 * 0.12), at: wf(L, wq).start }));
  const nSub = subs.reduce((a, sb) => a + sb.lines.length, 0);
  const rowsH = rowLines.reduce((a, r2) => a + r2.lines.length * r2.size, 0);
  const h = pad + 8 + rowsH + (s.unless ? 18 + 26 + 4 : 6) + (nSub ? 14 + nSub * 24 : 0) + pad * 0.7;
  panel(c, X0, Y0, w, h, {
    paper: true, k, alpha,
    draw: () => {
      let y = Y0 + pad + 8;
      for (const rl of rowLines) {
        const rk = appear(t, rl.at, 0.26);
        for (const ln of rl.lines) {
          y += rl.size;
          if (rk > 0) text(c, ln, X0 + pad, y - rl.size * 0.12 + (1 - rk) * 14, fam, rl.size, INK(0.96), { track: -1, alpha: rk });
        }
      }
      if (s.unless) {
        // the caveat wipes on WITH the event row it qualifies (never a frame of the claim without it)
        y += 18;
        caveatTag(c, CAVEAT, X0 + pad, y, { ink: true, k: enter(t, r.row, DUR.tag) });
        y += 30;
      }
      if (nSub) {
        y += 14;
        // detail lines appear whole (never typed: a partly typed date would read as another date)
        for (const sb of subs) sb.lines.forEach((ln, i) => {
          y += 24;
          mono(c, ln, X0 + pad, y - 4, 16, INK(0.85), { w: 600, alpha: appear(t, sb.at + i * 0.12, 0.2) });
        });
      }
    },
  });
}

function drawDates(c: Ctx, X: X) {
  const t = X.t;
  const ds = resolveDates(X);
  const sw = swell(X, ds);
  const t0 = X.ch.t0, E = X.ch.t1, last = ds.length - 1;
  // the bridge's last word ("load.") fades out across the cut
  mintLine(c, X, X.L('In a Swedish trial'));
  // the chrome may still be showing B16's 80.5% VS 73.8% across the cut: its source rides under the chrome until it flips
  chromeCarry(c, X, SRC_B16);
  /** when date i's source takes the footer: its month word — for the first date no later than the chrome's own flap
   *  turning to it (should that state move onto the chapter's first cut), since nothing of ours precedes it */
  const srcAt = (i: number) => (i > 0 ? ds[i]!.month : Math.max(t0, Math.min(ds[0]!.month, chromeAt(X, ds[0]!.s.tag) ?? Infinity)));
  /** the chanted date whose source owns the footer at t (from srcAt(i) to the next date's), or -1 */
  let cur = -1;
  for (let i = 0; i < ds.length; i++) if (t >= srcAt(i)) cur = i;

  // ---- the WHAT TO WATCH panel (lower left): split-flap date (+ the year flap in the header for 10 JAN 2027) · the
  // UNLESS EXTENDED tag in the header for a conditional date · the date's SOURCE line in the footer, typed from the
  // month word (complete long before the day lands on its word). The last date holds to the cut (the flash takes it).
  const Hs = DT.house;
  panel(c, Hs.x, Hs.y, Hs.w, Hs.h, {
    k: enter(t, t0, DUR.panel), title: 'WHAT TO WATCH',
    draw: () => {
      // board states settle ON their words (flapBoard starts each fall early enough)
      const states: [number, string[]][] = [[t0, ['         ']]];
      for (const r of ds) for (const [wq, txt] of r.s.board) states.push([wf(r.L, wq).start, [txt]]);
      flapBoard(c, { x: Hs.x + 21, y: Hs.y + HEAD_H + 13, cols: 9, rows: 1, cw: 70, ch: 112, gap: 6, states, seed: 5 }, t);
      const yr: [number, string[]][] = [[t0, ['    ']]];
      for (const r of ds) if (r.s.year) yr.push([r.land, [r.s.year]]);
      flapBoard(c, { x: Hs.x + Hs.w - 16 - (4 * 28 + 3 * 3), y: Hs.y + 3, cols: 4, rows: 1, cw: 28, ch: 34, gap: 3, states: yr, seed: 9, dt: 0.05 }, t);
      // a conditional date's caveat rides the header from its month word — before any digit of the date settles here,
      // and as the chrome's board starts turning to it — until the date leaves the board (the next month word)
      ds.forEach((r) => {
        if (!r.s.unless || t < r.month) return;
        const a = leave(t, r.next, 0.08);
        if (a > 0) caveatTag(c, CAVEAT, Hs.x + 172, Hs.y + 7, { k: enter(t, r.month, DUR.tag), alpha: a });
      });
      // the footer source: the current date's, typed from its month word
      const fy = Hs.y + Hs.h - FOOT_H;
      c.fillStyle = WHITE(0.18); c.fillRect(Hs.x, fy, Hs.w, 1);
      if (cur >= 0) sourceLine(c, ds[cur]!.s.src, Hs.x + 16, fy + 21, { u: enter(t, srcAt(cur), DUR.source), maxW: Hs.w - 32 });
    },
  });

  // ---- the event card, one per chanted line: gone at the next line or the next shot cut, whichever comes first (the
  // last one holds to the chapter's cut, under the flash)
  const cutAfter = (ta: number) => Math.min(Infinity, ...X.board.shots.filter((s) => s.t0 > ta + 0.05 && s.t0 < E - 1e-3).map((s) => s.t0));
  ds.forEach((r, i) => eventCard(c, t, r, i < last ? Math.min(r.next, cutAfter(r.row)) : E));

  // ---- the calendar strip: OCT → JAN, AS OF 18 OCT 2026, a marker per date as it lands
  const St = DT.strip;
  panel(c, St.x, St.y, St.w, St.h, {
    k: enter(t, t0 + 0.1, DUR.panel + 0.05),
    draw: () => {
      const ax = ease.outCubic(clamp((t - t0 - 0.15) / 0.6));
      // month bands, ticks, names
      MONTHS.forEach(([m, d0], i) => {
        const d1 = i + 1 < MONTHS.length ? MONTHS[i + 1]![1] : STRIP_DAYS;
        if (i % 2 === 0) { c.fillStyle = WHITE(0.045); c.fillRect(sx(d0), St.y + 14, sx(d1) - sx(d0), St.h - 28); }
        hair(c, sx(d0), St.y + 14, sx(d0), St.ay + 8, WHITE(0.45 * ax), 1);
        mono(c, m, sx(d0) + 10, St.y + 36, 14, WHITE(0.75), { w: 600, alpha: ax });
      });
      hair(c, St.ax0, St.ay, lerp(St.ax0, St.ax1, ax), St.ay, WHITE(0.55), 1.2);
      // as-of marker
      const ak = appear(t, t0 + 0.4, 0.3);
      if (ak > 0) {
        c.save(); c.globalAlpha *= ak;
        c.strokeStyle = WHITE(0.9); c.lineWidth = 1.5; c.beginPath(); c.arc(sx(AS_OF), St.ay, 5.5, 0, PI * 2); c.stroke();
        mono(c, 'AS OF 18 OCT 2026', sx(AS_OF), St.ay + 34, 12, WHITE(0.75), { align: 'center' });
        c.restore();
      }
      // swell playhead (coral): from the as-of point off the end of the strip, accelerating into the flash
      const px = sw.px(t);
      if (px >= 0) hair(c, sx(AS_OF), St.ay, Math.min(px, St.ax1), St.ay, CORAL(0.95), 3);
      // markers: a date carries its label (and, if conditional, its caveat) only while its source is in the footer;
      // otherwise it stays on the axis as a bare tick (which flares as the playhead passes)
      ds.forEach((r, i) => {
        const mk = appear(t, r.land, 0.3);
        if (mk <= 0) return;
        const a = srcAt(i), b = i < last ? srcAt(i + 1) : Infinity;
        const isCur = i === cur;
        const la = isCur ? Math.min(clamp((t - a) / 0.06), leave(t, b, 0.05)) : 0;
        const xa = sx(r.s.d[0]), xb = sx(r.s.d[1] + (r.s.d[1] > r.s.d[0] ? 1 : 0)), xm = (xa + xb) / 2;
        const flare = pulse(t, sw.pass(xm), 0.16);
        const col = isCur ? CORAL() : WHITE(0.7);
        const up = i % 2 === 0;
        c.save(); c.globalAlpha *= mk;
        // the date on the axis: a diamond, or a short bar for the two-day span
        const s2 = (isCur ? 8 : 6) * (1 + 0.6 * pulse(t, r.land, 0.12) + 0.9 * flare);
        c.fillStyle = col;
        if (xb - xa > 2) c.fillRect(xa - 3, St.ay - s2 * 0.7, xb - xa + 6, s2 * 1.4);
        else { c.save(); c.translate(xm, St.ay); c.rotate(PI / 4); c.fillRect(-s2 / 2, -s2 / 2, s2, s2); c.restore(); }
        if (la > 0) {
          c.globalAlpha *= la;
          hair(c, xm, St.ay + (up ? -10 : 10), xm, St.ay + (up ? -21 : 21), col, 1.2);
          mono(c, r.s.tag, xm, St.ay + (up ? -27 : 40), 14, col, { w: 600, align: 'center' });
          // a conditional date's caveat is part of its label: they appear and leave together
          if (r.s.unless) mono(c, CAVEAT, xm, St.ay + (up ? -45 : 58), 11, WHITE(0.92), { w: 600, align: 'center' });
        }
        c.restore();
      });
      if (px >= 0 && px < St.ax1 + 20) hair(c, px, St.y + 10, px, St.y + St.h - 10, CORAL(), 2.5);
    },
  });
}

function postDates(X: X, o: PostOverrides): PostOverrides {
  const ds = resolveDates(X);
  const sw = swell(X, ds);
  const t = X.t;
  let z = 1;
  // a small punch on every date landing, and as the swell's playhead passes each date on the strip
  for (const r of ds) z += 0.012 * pulse(t, r.land, 0.1);
  for (const r of ds) z += 0.01 * pulse(t, sw.pass(xmOf(r)), 0.08);
  // the swell builds (zoom), then a white flash hands off to the white final chorus
  z += 0.035 * ease.inCubic(clamp((t - sw.R0) / Math.max(0.3, sw.E - sw.R0)));
  o.zoom = (o.zoom ?? 1) * z;
  o.flash = Math.max(o.flash ?? 0, 1.05 * ease.inQuad(clamp((t - sw.F0) / Math.max(0.15, sw.E - sw.F0))));
  return o;
}

export const chapters: Record<string, Chapter> = {
  s15: { draw: drawS15 },
  s16: { draw: drawS16 },
  dates: { draw: drawDates, post: postDates },
};

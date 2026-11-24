// THE STATE OF AI · OCT 2026 — group race-b: chapters s04 · s05 · s06 (verse 1, "the race": beats B04, B05, B06).
// Round 2: integrated over the real footage, in the house style of ../brief (opaque panels with corner brackets,
// header strip with the figure number, footer strip with the source line, cream caveat tags, numbers that LAND whole).
// No number is ever counted: every number on screen is the fact sheet's exact string from its first visible frame.
//
//   s04  "Open weights: four months behind."            D01  FIG. 04 panel lower-left: two lanes (CLOSED FRONTIER /
//                                                              OPEN-WEIGHT MODELS), two runner dots, a coral gap bracket
//                                                              drawn on "four"; the stopwatch (wedge at 4 of 12 months) and
//                                                              "~4 MONTHS" land as ONE unit on "four"; label, Epoch caveat
//                                                              tag with it; the source is typed as the footer unrolls (done
//                                                              before the chrome flap's "~4" settles); MONTHS pulses on
//                                                              "months", the bracket kicks on "behind."; gone at the D01 cut.
//        "Top Hugging Face download share: Chinese models."  D02  FIG. 04B cream panel right: an empty donut track and the
//                                                              label from "Hugging"; the coral 41% arc and "41%" stamp in
//                                                              together on "share:" (no sweep); CHINESE-DEVELOPED MODELS
//                                                              underlined on "Chinese"; plurality caveat tag; gone at the
//                                                              D02 cut. The Epoch source line sits under the chrome flap
//                                                              (which still reads ~4 MONTHS) from the D01 cut until the
//                                                              flap's "~4" has flipped away after "Five".
//   s05  "Five tech firms now out-invest global oil and gas production."
//                                                         E01  FIG. 05 cream panel (the slot 04B has just left), unrolls on
//                                                              the cut with its source typed in, then its label; "+75%"
//                                                              lands whole on "firms"; a TOWER CRANE CV box (storyboard.d)
//                                                              from the cut to "now". FIG. 05B lower-left on "now": CAPEX OF
//                                                              5 TECH FIRMS / > / GLOBAL OIL & GAS PRODUCTION INVESTMENT; the
//                                                              reference bar (B) grows to a dashed line from "out-invest"
//                                                              (not data: NOT TO SCALE · THE IEA GIVES NO NUMBER tag); the
//                                                              5-firm bar (A) is absent until "oil" (E02 cut), then lands
//                                                              whole with a coral tip through the line, with a big coral ">";
//                                                              coral passes from +75% to ">". Both leave at the chapter cut.
//   s06  "Data-centre electricity: projected to double by 2030."
//                                                         F01  FIG. 06 panel right (compact, so the F02 cooling tower clears
//                                                              it under the storyboard.d cam push): "485 TWh" lands on
//                                                              "Data-centre" with the 2025 point and label line 1 (with its
//                                                              "(PROJECTION)"); PROJECTION tag on the 2030 column + dashed
//                                                              leg from "projected"; on "double" (F02 cut) TWh slides aside
//                                                              and "→ ~950" lands (coral to the end), label line 2 and the
//                                                              IEA efficiency tag.
//                                                         F02  FIG. 06B panel lower-left on "by": the gauge needle whips to
//                                                              the CAP stop during the unroll (before any text), source, then
//                                                              label; as "2030." ENDS the needle jolts against the stop and
//                                                              "6,831 MW SHORT" lands (instrumental tail, never on the sung
//                                                              year). Both leave at the s07 cut.
// Every on-screen string is printed exactly as research/FACTSHEET_AI.md prints it (beat cards B04–B06); the only other
// strings are figure numbers, lane names cut from the B04 label, the axis years 2025/2030 from the B06 label, the gauge's
// CAP stop (from the B06 label), NOT TO SCALE on the B05 inequality, and the B04/B05/B06 caveat lines as tags. Every
// time is a lyric word (X.W) or a shot window (X.S / X.ch); everything is a pure function of X.t.
import type { Chapter, X } from '../x';
import type { PostOverrides } from '../../engine/scene';
import { measure } from '../../engine/type';
import { clamp, ease, hash, lerp } from '../../engine/util';
import { FONT, WHITE, CORAL, INK, text, hair, fi } from '../kit';
import { panel, caveatTag, sourceLine, land, applyLand, landText, enter, typedBy, leave, DUR, PAD, PANEL_BG } from '../brief';

const TAU = Math.PI * 2;

// ====================================================================== the fact-sheet strings (exact)
// B04 headline · label · source (S13)
const B04_NUM = '~4', B04_UNIT = 'MONTHS';
const B04_LABEL = ['OPEN-WEIGHT MODELS BEHIND THE CLOSED FRONTIER', '(AVG SINCE JAN 2026)'];
const B04_SRC = 'SOURCE · EPOCH AI · MAY 2026';
const B04_CAVEAT = 'GAP MAY BE UNDERSTATED (EPOCH)'; // B04 caveat: "Epoch says the gap may be understated."
const B04_LANES = ['CLOSED FRONTIER', 'OPEN-WEIGHT MODELS']; // cut from the B04 label
// B04 support · label · source (S14)
const B04S_NUM = '41%', B04S_FRAC = 0.41;
const B04S_LABEL = ['HUGGING FACE DOWNLOADS:', 'CHINESE-DEVELOPED MODELS', '(PAST YEAR, 2025)'];
const B04S_SRC = 'SOURCE · HUGGING FACE · MAR 2026';
const B04S_CAVEAT = "PLURALITY · BY HUGGING FACE'S COUNT"; // B04 caveat: 41% is a plurality, "by Hugging Face's count"
// B05 headline · label · line · source (S16)
const B05_NUM = '+75%';
const B05_LABEL = ['BIG-TECH CAPEX, 2026', '(FROM >$400BN IN 2025)'];
const B05_A = 'CAPEX OF 5 TECH FIRMS', B05_GT = '>', B05_B = 'GLOBAL OIL & GAS PRODUCTION INVESTMENT';
const B05_SRC = 'SOURCE · IEA · APR 2026';
// B05 caveat "The IEA gives no number for the five-firm comparison.", with what that means for the bars
const B05_SCALE = 'BARS NOT TO SCALE · IEA GIVES NO NUMBER';
// B06 headline · label · source (S16)
const B06_FROM = '485', B06_ARROW = '→', B06_TO = '~950', B06_UNIT = 'TWh';
const B06_LABEL = ['DATA-CENTRE ELECTRICITY, 2025 → 2030 (PROJECTION) ·', '≈3% OF WORLD DEMAND'];
const B06_SRC = 'SOURCE · IEA · APR 2026';
const B06_TAG = 'PROJECTION';
// B06 caveat "For balance: the IEA says energy per AI task is falling by at least 10x a year." (§2: B06 carries it)
const B06_BAL = 'ENERGY PER AI TASK FALLING BY AT LEAST 10x A YEAR (IEA)';
const B06_VALS = [485, 950]; // plot geometry only (stems proportional to the printed values; no axis numbers drawn)
// B06 support · label · source (S18, S19)
const B06S_NUM = '6,831', B06S_UNIT = 'MW SHORT';
const B06S_LABEL = ['BIGGEST US GRID AUCTION (PJM, 13 STATES + DC)', 'CLEARED AT ITS $325/MW-DAY CAP'];
const B06S_SRC = 'SOURCE · PJM VIA APPA · JUL 2026';

// ====================================================================== local primitives
const MONO = (w = 400) => FONT.mono(w);
const GROT = (w = 900) => FONT.grot(w);

/** Small mono line (lane names, axis years). */
function mono(c: CanvasRenderingContext2D, s: string, x: number, y: number, col: string, size = 12, o: { align?: CanvasTextAlign; w?: number; alpha?: number } = {}) {
  return text(c, s, x, y, MONO(o.w ?? 400), size, col, { align: o.align, track: size * 0.14, alpha: o.alpha });
}

/** Stack of mono label lines fading in one by one from t0 (content type inside a panel). */
function lines(c: CanvasRenderingContext2D, ls: string[], x: number, y: number, lh: number, t: number, t0: number, col: string, size = 14, w = 600, gap = 0.08) {
  ls.forEach((s, i) => {
    const k = clamp((t - t0 - i * gap) / 0.16);
    if (k <= 0) return;
    text(c, s, x + (1 - ease.outCubic(k)) * 10, y + i * lh, MONO(w), size, col, { track: size * 0.1, alpha: k });
  });
}

/** Dashed segment drawn on to u. */
function dashOn(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, u: number, col: string, lw = 1, dash: [number, number] = [5, 5]) {
  if (u <= 0) return;
  c.save();
  c.strokeStyle = col; c.lineWidth = lw; c.setLineDash(dash);
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(lerp(x0, x1, clamp(u)), lerp(y0, y1, clamp(u))); c.stroke();
  c.restore();
}

/** Decaying impact pulse after any of the given times. */
function impact(t: number, times: number[], hl = 0.06) {
  let k = 0;
  for (const s of times) if (t >= s) k = Math.max(k, Math.pow(0.5, (t - s) / hl));
  return k;
}
function shakeOf(t: number, amp: number, seed: number): [number, number] {
  return [(hash(fi(t), seed, 1) - 0.5) * 2 * amp, (hash(fi(t), seed, 2) - 0.5) * 2 * amp];
}

/** A month-dial stopwatch, drawn whole: 12 ticks, a coral wedge of `months`/12 of a turn, the hand at its end. */
function stopwatch(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, months: number) {
  c.save();
  c.strokeStyle = WHITE(0.92); c.lineWidth = 2.2;
  c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke();
  c.fillStyle = WHITE(0.92);
  c.fillRect(cx - 6, cy - r - 10, 12, 6); c.fillRect(cx - 2.5, cy - r - 5, 5, 5);
  c.save(); c.translate(cx, cy); c.rotate(Math.PI / 4); c.fillRect(-3.5, -r - 7, 7, 5); c.restore();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU - Math.PI / 2, r0 = r - (i % 3 === 0 ? 9 : 6);
    hair(c, cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * (r - 2.5), cy + Math.sin(a) * (r - 2.5), WHITE(i % 3 === 0 ? 0.92 : 0.55), 1.4);
  }
  const a0 = -Math.PI / 2, a1 = a0 + (months / 12) * TAU;
  c.fillStyle = CORAL(0.9); c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, r - 10, a0, a1); c.closePath(); c.fill();
  hair(c, cx, cy, cx + Math.cos(a1) * (r - 7), cy + Math.sin(a1) * (r - 7), WHITE(0.98), 2.2);
  c.fillStyle = WHITE(0.98); c.beginPath(); c.arc(cx, cy, 3, 0, TAU); c.fill();
  c.restore();
}

/** A runner: a dot with a ring and flickering speed lines behind it. */
function runner(c: CanvasRenderingContext2D, x: number, y: number, t: number, seed: number, a = 1) {
  c.save();
  c.globalAlpha *= a;
  for (let i = 0; i < 4; i++) {
    const yy = y + (i - 1.5) * 4.5, len = 16 + 26 * hash(seed, i, fi(t) >> 1);
    hair(c, x - 15 - len, yy, x - 15, yy, WHITE(0.14 + 0.1 * (i % 2)), 1.2);
  }
  c.strokeStyle = WHITE(0.55); c.lineWidth = 1;
  c.beginPath(); c.arc(x, y, 13, 0, TAU); c.stroke();
  c.fillStyle = WHITE(0.97);
  c.beginPath(); c.arc(x, y, 7.5, 0, TAU); c.fill();
  c.restore();
}

// ====================================================================== s04 · B04 headline: ~4 MONTHS (D01)
function s04Gap(c: CanvasRenderingContext2D, X: X) {
  const t = X.t;
  const w = (k: number) => X.W('Open weights', k); // Open · weights: · four · months · behind.
  const tIn = w(0).start - 0.1, tFour = w(2).start, tMonths = w(3).start, tBehind = w(4).start;
  const tOut = X.S('D01')?.t1 ?? X.W('Top Hugging Face', 0).start - 0.3;
  if (t < tIn || t > tOut) return;
  const x = 110, y = 560, pw = 880, ph = 420;
  panel(c, x, y, pw, ph, {
    // the source types in as soon as the footer has unrolled: complete (25.94) before the chrome flap's "~4" settles
    // (~26.1), so ~4 MONTHS is never on screen anywhere without its source
    k: enter(t, tIn, DUR.panel), alpha: leave(t, tOut), ink: X.ink, title: 'FIG. 04',
    source: B04_SRC, sourceU: typedBy(t, tIn + 0.5),
    draw: (p) => {
      const xL = p.inner.x, xR = p.inner.x + p.inner.w;
      // lanes (scrolling ticks = both moving), runner dots slide in to their places (no numbers anywhere in the lanes)
      const lane = [y + 90, y + 140], xC = x + 580, xO = x + 320;
      const off = (t * 150) % 30;
      lane.forEach((ly, i) => {
        mono(c, B04_LANES[i]!, xL, ly - 15, WHITE(0.62), 12, { w: 600 });
        hair(c, xL, ly, xL + (xR - xL) * ease.outCubic(clamp((t - tIn - 0.05) / 0.4)), ly, WHITE(0.26), 1);
        c.fillStyle = WHITE(0.3);
        for (let px = xL + 30 - off; px < xR; px += 30) if (px > xL + 170) c.fillRect(px, ly - 3, 1, 6);
      });
      const run = ease.outExpo(clamp((t - tIn - 0.12) / 0.7));
      runner(c, lerp(xL + 170, xC, run), lane[0]!, t, 11, clamp(run * 4));
      runner(c, lerp(xL + 170, xO, run), lane[1]!, t, 23, clamp(run * 4));
      // the gap: drop lines from the two runners + coral dimension line, drawn out from its middle onto "four"
      const yD = y + 174;
      const gk = ease.outCubic(clamp((t - tFour + 0.1) / 0.3));
      if (gk > 0) {
        dashOn(c, xC, lane[0]! + 15, xC, yD + 8, gk, WHITE(0.5), 1, [3, 4]);
        dashOn(c, xO, lane[1]! + 15, xO, yD + 8, gk, WHITE(0.5), 1, [3, 4]);
        const xm = (xO + xC) / 2, half = ((xC - xO) / 2) * gk, kick = impact(t, [tBehind], 0.09);
        hair(c, xm - half, yD, xm + half, yD, CORAL(), 2.4 + 3 * kick);
        if (gk > 0.98) { const e = 9 + 6 * kick; hair(c, xO, yD - e, xO, yD + e, CORAL(), 2.4); hair(c, xC, yD - e, xC, yD + e, CORAL(), 2.4); }
      }
      // stopwatch + "~4 MONTHS" land as ONE unit on "four" (the exact string, never a bare "~4", never a dial sweep)
      const sizeN = 104, sizeU = 44, r = 30, gap = 14;
      const wN = measure(B04_NUM, GROT(900), sizeN, -sizeN * 0.02), wU = measure(B04_UNIT, GROT(900), sizeU, -sizeU * 0.02);
      const total = 2 * r + gap + wN + gap + wU;
      const ux = (xO + xC) / 2 - total / 2, ny = y + 276;
      const L = land(t, tFour, { amp: 0.36 });
      if (L.on) {
        c.save();
        applyLand(c, L, ux + total / 2, ny - 36);
        stopwatch(c, ux + r, ny - 36, r, 4);
        text(c, B04_NUM, ux + 2 * r + gap, ny, GROT(900), sizeN, CORAL(), { track: -sizeN * 0.02 });
        const mx = ux + 2 * r + gap + wN + gap, pm = 1 + 0.14 * impact(t, [tMonths], 0.08);
        c.translate(mx + wU / 2, ny - sizeU * 0.36); c.scale(pm, pm); c.translate(-(mx + wU / 2), -(ny - sizeU * 0.36));
        text(c, B04_UNIT, mx, ny, GROT(900), sizeU, WHITE(0.97), { track: -sizeU * 0.02 });
        c.restore();
      }
      // label (exact, two lines) and the Epoch caveat come up with the number; the source is already typed in the footer
      hair(c, x, y + 296, x + pw * ease.outCubic(clamp((t - tFour) / 0.4)), y + 296, WHITE(0.18));
      lines(c, B04_LABEL, xL, y + 324, 22, t, tFour + 0.06, WHITE(0.92), 14);
      caveatTag(c, B04_CAVEAT, xR, y + 309, { k: enter(t, tFour + 0.16, DUR.tag), align: 'right' });
    },
  });
}

// ====================================================================== s04 · the flap's "~4 MONTHS" keeps its Epoch source
// The chrome flap board reads OPEN WEIGHTS / ~4 MONTHS from the D01 open until it flips to BIG-TECH on "Five". FIG. 04
// (and its Epoch footer) leaves at the D01 cut, so from just before that cut the same Epoch source line sits under the
// flap block (backed strip, right-aligned to the flap, y 243-265: clear of the BRIEFING line ~226 and FIG. 04B's top at
// 280), and stays until the flap's "~4" cells have flipped away after "Five" (~33.15; drawn from s05 for that tail), so
// the number is never read as the Hugging Face figure next to it.
function flapSrc(c: CanvasRenderingContext2D, X: X) {
  const t = X.t, d2 = X.S('D02');
  if (!d2) return;
  const t0 = d2.t0 - DUR.out - 0.12, t1 = X.W('Five tech', 0).start + 0.3;
  if (t < t0 || t >= t1) return;
  sourceLine(c, B04_SRC, 1830, 258, { align: 'right', back: true, alpha: enter(t, t0, 0.12) * leave(t, t1, 0.1) });
}

// ====================================================================== s04 · B04 support: 41% donut (D02, to its cut on "Five")
function s04Donut(c: CanvasRenderingContext2D, X: X) {
  const t = X.t;
  const v = (k: number) => X.W('Top Hugging Face', k); // Top · Hugging · Face · download · share: · Chinese · models.
  const tIn = v(0).start - 0.12, tLand = v(4).start, tChinese = v(5).start;
  // gone at the D02 cut like every other element (storyboard.d/race-b.json puts that cut on the beat at "Five")
  const tOut = X.S('D02')?.t1 ?? X.W('Five tech', 0).start;
  if (t < tIn || t > tOut) return;
  const x = 1170, y = 280, cw = 660, chh = 420;
  panel(c, x, y, cw, chh, {
    paper: true, k: enter(t, tIn, DUR.panel), alpha: leave(t, tOut), ink: X.ink, title: 'FIG. 04B',
    source: B04S_SRC, sourceU: typedBy(t, tLand),
    draw: (p) => {
      // donut: an empty ink track (with its tick ring) from the start, no sweep; the coral 41% arc and "41%" stamp in
      // TOGETHER on "share:" (one land envelope: the arc is never seen at any other angle)
      const cx = p.inner.x + 122, cy = p.body.y + p.body.h / 2, r = 116, ring = 28;
      c.save();
      for (let i = 0; i < 50; i++) {
        const a = (i / 50) * TAU - Math.PI / 2, r0 = r + 4, r1 = r + (i % 5 === 0 ? 12 : 8);
        hair(c, cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, INK(i % 5 === 0 ? 0.55 : 0.28), 1);
      }
      c.lineWidth = ring; c.lineCap = 'butt';
      c.strokeStyle = INK(0.13);
      c.beginPath(); c.arc(cx, cy, r - ring / 2, 0, TAU); c.stroke();
      c.restore();
      hair(c, cx, cy - r - 2, cx, cy - r + ring + 2, INK(0.9), 1.5); // the 0 mark
      const L = land(t, tLand, { amp: 0.3 });
      if (L.on) {
        c.save();
        applyLand(c, L, cx, cy);
        c.lineWidth = ring; c.lineCap = 'butt'; c.strokeStyle = CORAL();
        c.beginPath(); c.arc(cx, cy, r - ring / 2, -Math.PI / 2, -Math.PI / 2 + TAU * B04S_FRAC); c.stroke();
        text(c, B04S_NUM, cx, cy + 22, GROT(900), 64, CORAL(), { align: 'center', track: -1.3 });
        c.restore();
      }
      // label column (exact, three lines) from "Hugging", the Chinese-developed line underlined on "Chinese", caveat tag
      const lx = p.inner.x + 270, ly = cy - 52;
      lines(c, B04S_LABEL, lx, ly, 26, t, v(1).start - 0.05, INK(0.94), 15);
      const uk = ease.outCubic(clamp((t - tChinese) / 0.3));
      if (uk > 0) hair(c, lx, ly + 34, lx + measure(B04S_LABEL[1]!, MONO(600), 15, 1.5) * uk, ly + 34, INK(0.9), 2);
      caveatTag(c, B04S_CAVEAT, lx, ly + 76, { k: enter(t, tLand + 0.18, DUR.tag), ink: true, maxW: p.inner.x + p.inner.w - lx });
    },
  });
}

// ====================================================================== s05 · B05 headline: +75% card (E01 → chapter end)
function s05Card(c: CanvasRenderingContext2D, X: X) {
  const t = X.t;
  const f = (k: number) => X.W('Five tech', k); // Five · tech · firms · now · out-invest · global · oil · and · gas · production.
  // enters on the cut (never before it: the 41% card leaves that slot exactly there); +75% lands whole on "firms"
  const tIn = Math.max(X.ch.t0, f(0).start - 0.04), tLand = f(2).start, tOil = f(6).start, tOut = X.ch.t1;
  if (t < tIn || t > tOut) return;
  const x = 1170, y = 280, cw = 660, chh = 374;
  panel(c, x, y, cw, chh, {
    paper: true, k: enter(t, tIn, DUR.panel), alpha: leave(t, tOut), ink: X.ink, title: 'FIG. 05',
    // the source types in as the footer unrolls and is complete (~33.20) before the label (which carries >$400BN)
    // starts to fade in (~33.25); +75% still lands on "firms" (33.519)
    source: B05_SRC, sourceU: typedBy(t, tIn + 0.32, 0.2),
    draw: (p) => {
      // the hot value hands its coral to the ">" of FIG. 05B on "oil" (a cross-fade to ink: palette colours only)
      const cool = ease.inOutQuad(clamp((t - tOil) / 0.25));
      const nx = p.inner.x - 6, ny = p.inner.y + 124, size = 168;
      const L = land(t, tLand, { amp: 0.22 });
      if (L.on) {
        const wN = measure(B05_NUM, GROT(900), size, -4);
        c.save();
        applyLand(c, L, nx + wN / 2, ny - size * 0.36);
        if (cool > 0) text(c, B05_NUM, nx, ny, GROT(900), size, INK(0.95), { track: -4, alpha: cool });
        if (cool < 1) text(c, B05_NUM, nx, ny, GROT(900), size, CORAL(), { track: -4, alpha: 1 - cool });
        c.restore();
      }
      // the label reads from just after the cut, once its source is complete; the number lands into the space above it
      lines(c, B05_LABEL, p.inner.x, ny + 46, 28, t, tIn + 0.32, INK(0.94), 19);
    },
  });
}

// ====================================================================== s05 · B05 line: the inequality (lands on "oil")
function s05Bars(c: CanvasRenderingContext2D, X: X) {
  const t = X.t;
  const f = (k: number) => X.W('Five tech', k);
  const tIn = f(3).start - 0.06, tGrow = f(4).start, tOil = f(6).start, tOut = X.ch.t1;
  if (t < tIn || t > tOut) return;
  const x = 110, y = 600, pw = 880, ph = 312;
  panel(c, x, y, pw, ph, {
    k: enter(t, tIn, DUR.panel), alpha: leave(t, tOut), ink: X.ink, title: 'FIG. 05B',
    draw: (p) => {
      // stacked A / > / B: the fact-sheet line split at its ">", read top to bottom
      const xs = x + 96, xRef = x + 540, bh = 36;
      const yA = p.body.y + 52, yB = p.body.y + 212;
      mono(c, B05_A, xs, yA - 12, WHITE(0.94), 15, { w: 600, alpha: clamp((t - tIn - 0.1) / 0.15) });
      mono(c, B05_B, xs, yB - 12, WHITE(0.94), 15, { w: 600, alpha: clamp((t - tIn - 0.18) / 0.15) });
      // B, the reference, grows to the dashed line from "out-invest" (the IEA gives no number for this comparison, so
      // its length is not data). A is NEVER drawn at B's length or short of it: it is absent until "oil", then lands
      // WHOLE with its body at the line and a coral arrow tip through it: more, by no stated amount.
      const gB = ease.outCubic(clamp((t - tGrow) / 0.6));
      const front = lerp(xs, xRef, gB);
      if (gB > 0) {
        c.fillStyle = WHITE(0.3); c.fillRect(xs, yB, front - xs, bh);
        c.strokeStyle = WHITE(0.75); c.lineWidth = 1; c.strokeRect(xs + 0.5, yB + 0.5, Math.max(0, front - xs - 1), bh - 1);
      }
      dashOn(c, xRef, yA - 22, xRef, yB + bh + 14, ease.outCubic(clamp((t - tGrow) / 0.35)), WHITE(0.6), 1, [4, 4]);
      const LA = land(t, tOil, { amp: 0.06 });
      if (LA.on) {
        c.save();
        applyLand(c, LA, xs, yA + bh / 2);
        c.fillStyle = WHITE(0.92); c.fillRect(xs, yA, xRef - xs, bh);
        c.fillStyle = CORAL(); c.fillRect(xRef, yA, 6, bh);
        c.beginPath(); c.moveTo(xRef + 6, yA - 8); c.lineTo(xRef + 38, yA + bh / 2); c.lineTo(xRef + 6, yA + bh + 8); c.closePath(); c.fill();
        c.restore();
      }
      // the disclaimer sits with the bars, beside the reference line, as the house caveat tag (two lines)
      caveatTag(c, B05_SCALE, xRef + 18, yB + bh / 2 - 22, { k: enter(t, tGrow + 0.1, DUR.tag), maxW: x + pw - PAD - (xRef + 18) });
      // the punchline: a big coral ">" lands between the two rows on "oil" with the A bar, left-aligned with the labels
      landText(c, B05_GT, xs - 4, yA + bh + 80, GROT(900), 92, CORAL(), t, tOil, { amp: 0.5, track: 0 });
    },
  });
}

// ====================================================================== s06 · B06 headline: 485 → ~950 TWh (F01 → chapter end)
function s06Chart(c: CanvasRenderingContext2D, X: X) {
  const t = X.t;
  const g = (k: number) => X.W('Data-centre electricity', k); // Data-centre · electricity: · projected · to · double · by · 2030.
  // unrolls on the F01 cut (the chapter start, under "production."), 485 lands on "Data-centre"
  const tData = g(0).start, tIn = Math.max(X.ch.t0, tData - 0.3), tProj = g(2).start, tDouble = g(4).start, tOut = X.ch.t1;
  if (t < tIn || t > tOut) return;
  // compact: the bottom edge (y 700) stays above the cooling tower the F02 cam push brings up beneath it
  const x = 1110, y = 262, pw = 720, ph = 438;
  panel(c, x, y, pw, ph, {
    k: enter(t, tIn, DUR.panel), alpha: leave(t, tOut), ink: X.ink, title: 'FIG. 06',
    source: B06_SRC, sourceU: typedBy(t, tData),
    draw: (p) => {
      // headline: "485 TWh" (never a bare 485) lands on "Data-centre"; on "double" TWh slides aside and "→ ~950" lands
      // in the gap: the printed "485 → ~950 TWh". ~950 is the chapter's one coral, to the end (it owns the sung "2030.").
      const sN = 84, by = p.inner.y + 68, hx = p.inner.x;
      const w485 = measure(B06_FROM, GROT(900), sN, -sN * 0.02);
      const wAr = measure(B06_ARROW, GROT(700), 60);
      const wTo = measure(B06_TO, GROT(900), sN, -sN * 0.02);
      const xAr = hx + w485 + 16, xTo = xAr + wAr + 16;
      // TWh is out of the way before ~950's entrance begins (no frame where the two overlap)
      const xU = lerp(hx + w485 + 14, xTo + wTo + 14, ease.outExpo(clamp((t - tDouble + 0.26) / 0.24)));
      landText(c, B06_FROM, hx, by, GROT(900), sN, WHITE(0.97), t, tData, { amp: 0.2 });
      landText(c, B06_UNIT, xU, by, GROT(800), 44, WHITE(0.92), t, tData + 0.04, { amp: 0.2 });
      landText(c, B06_ARROW, xAr, by - 10, GROT(700), 60, WHITE(0.75), t, tDouble - 0.03, { amp: 0.2, track: 0 });
      landText(c, B06_TO, xTo, by, GROT(900), sN, CORAL(), t, tDouble, { amp: 0.22 });
      // plot: value-proportional stems from a zero baseline (no axis numbers): the 2030 stem is drawn at 950/485 of the
      // 2025 one; 2025 solid, the 2030 leg dashed (projection)
      // (plot lowered: the 2030 point + ring sit clear under the headline row)
      const px0 = x + 50, px1 = x + pw - 50, top = p.inner.y + 112, base = p.inner.y + 204;
      const yv = (val: number) => base - (val / B06_VALS[1]!) * (base - top);
      const P0 = { x: x + 180, y: yv(B06_VALS[0]!) }, P1 = { x: x + 500, y: yv(B06_VALS[1]!) };
      const ak = ease.outCubic(clamp((t - tIn - 0.1) / 0.45));
      hair(c, px0, base, px0 + (px1 - px0) * ak, base, WHITE(0.6), 1);
      for (const [pt, s, t0] of [[P0, '2025', tData], [P1, '2030', tProj]] as const) {
        if (t < t0) continue;
        const a = clamp((t - t0) / 0.15);
        hair(c, pt.x, base, pt.x, base + 7, WHITE(0.7 * a), 1);
        mono(c, s, pt.x, base + 24, WHITE(0.8), 13, { align: 'center', alpha: a, w: 600 });
      }
      // the points land AT their values (never rising through others); each stem drops from its point to the axis
      const s0 = ease.outCubic(clamp((t - tData) / 0.25));
      if (s0 > 0) { c.fillStyle = WHITE(0.5); c.fillRect(P0.x - 1.5, P0.y, 3, (base - P0.y) * s0); }
      if (t >= tData) { c.fillStyle = WHITE(0.97); c.beginPath(); c.arc(P0.x, P0.y, 6.5 * clamp((t - tData) / 0.12), 0, TAU); c.fill(); }
      const lu = ease.inOutCubic(clamp((t - tProj) / Math.max(0.3, tDouble - tProj)));
      dashOn(c, P0.x, P0.y, P1.x, P1.y, lu, WHITE(0.92), 2.4, [10, 7]);
      if (t >= tDouble) {
        dashOn(c, P1.x, P1.y, P1.x, base, ease.outCubic(clamp((t - tDouble) / 0.25)), WHITE(0.55), 3, [6, 5]);
        const pk = ease.outBack(clamp((t - tDouble) / 0.2), 2.4);
        c.fillStyle = CORAL(); c.beginPath(); c.arc(P1.x, P1.y, 8 * pk, 0, TAU); c.fill();
        c.strokeStyle = CORAL(); c.lineWidth = 1.2; c.beginPath(); c.arc(P1.x, P1.y, 8 + 12 * pk, 0, TAU); c.stroke();
      }
      // PROJECTION tag hung on the 2030 column (right of its stem, above the axis year) from "projected" (the leg draws
      // towards it), up as long as the value is
      caveatTag(c, B06_TAG, P1.x + 14, P1.y + 26, { k: enter(t, tProj, DUR.tag) });
      // label line 1 (it carries "(PROJECTION)") lands with 485 TWh, so the number is never unlabelled and the caveat is
      // up before the chrome flap's "~950" settles (~37.6); line 2 (≈3% OF WORLD DEMAND: the 2030 share) with ~950,
      // then the IEA efficiency counterweight (§2: B06 carries it) as a caveat tag
      lines(c, B06_LABEL.slice(0, 1), p.inner.x, base + 54, 22, t, tData + 0.04, WHITE(0.92), 14);
      lines(c, B06_LABEL.slice(1), p.inner.x, base + 76, 22, t, tDouble + 0.04, WHITE(0.92), 14);
      caveatTag(c, B06_BAL, p.inner.x, base + 90, { k: enter(t, tDouble + 0.3, DUR.tag) });
    },
  });
}

// ====================================================================== s06 · B06 support: 6,831 MW SHORT, pinned at the cap (F02)
function s06Gauge(c: CanvasRenderingContext2D, X: X) {
  const t = X.t;
  const g = (k: number) => X.W('Data-centre electricity', k);
  // enters on "by": the needle is at the CAP stop before any text is up, source then label follow; as "2030." ENDS
  // the needle jolts against the stop and only then "6,831 MW SHORT" lands (the 2028/29 auction is not a 2030 figure:
  // the hit lands in the instrumental tail, and the panel stays white - the sung year keeps ~950 coral).
  const tIn = g(5).start - 0.06, tPin = g(6).end, tOut = X.ch.t1;
  if (t < tIn || t > tOut) return;
  const x = 110, y = 600, pw = 860, ph = 272;
  panel(c, x, y, pw, ph, {
    k: enter(t, tIn, DUR.panel), alpha: leave(t, tOut), ink: X.ink, title: 'FIG. 06B',
    // typed as the footer unrolls, complete (~40.28) before the label (13 STATES + DC, $325/MW-DAY) fades in (~40.30)
    source: B06S_SRC, sourceU: typedBy(t, tIn + 0.34, 0.18),
    draw: (p) => {
      // 240° dial, no scale numbers: a white cap band and an end stop
      const cx = x + 150, cy = p.body.y + 110, r = 84;
      const aS = (150 / 360) * TAU, aE = (390 / 360) * TAU, aCap = aE - (26 / 360) * TAU;
      c.save();
      c.lineWidth = 2; c.strokeStyle = WHITE(0.8);
      c.beginPath(); c.arc(cx, cy, r, aS, aCap); c.stroke();
      c.lineWidth = 9; c.strokeStyle = WHITE(0.9);
      c.beginPath(); c.arc(cx, cy, r - 4, aCap, aE); c.stroke();
      c.restore();
      for (let i = 0; i <= 20; i++) {
        const a = lerp(aS, aE, i / 20), r0 = r - (i % 5 === 0 ? 16 : 10);
        hair(c, cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4), WHITE(i % 5 === 0 ? 0.85 : 0.45), 1.2);
      }
      const sx = cx + Math.cos(aE) * (r + 2), sy = cy + Math.sin(aE) * (r + 2);
      c.fillStyle = WHITE(0.95); c.beginPath(); c.arc(sx, sy, 5, 0, TAU); c.fill();
      text(c, 'CAP', sx, sy + 28, MONO(600), 13, WHITE(0.95), { align: 'center', track: 1.8 });
      // the needle whips to the stop during the panel's unroll (done by tIn + 0.12, before the first source character
      // and long before the label), so it never reads below the cap the label says the auction cleared at; it presses
      // against the stop (jitter well inside the cap band) and jolts as "2030." ends, when 6,831 MW SHORT lands
      const u = ease.outCubic(clamp((t - tIn) / 0.12));
      const jolt = impact(t, [tPin], 0.07);
      const press = u >= 1 ? -(hash(fi(t), 77) * (0.018 + 0.05 * jolt) + 0.004 * (1 + Math.sin(t * 40))) : 0;
      const an = lerp(aS + 0.05, aE - 0.035, u) + press;
      if (jolt > 0.02) { // a ring off the stop on the pin hit
        c.strokeStyle = WHITE(0.8 * jolt); c.lineWidth = 1.5;
        c.beginPath(); c.arc(sx, sy, 7 + 22 * (1 - jolt), 0, TAU); c.stroke();
      }
      hair(c, cx - Math.cos(an) * 16, cy - Math.sin(an) * 16, cx + Math.cos(an) * (r - 12), cy + Math.sin(an) * (r - 12), WHITE(0.97), 3);
      c.fillStyle = WHITE(0.97); c.beginPath(); c.arc(cx, cy, 8, 0, TAU); c.fill();
      c.fillStyle = PANEL_BG; c.beginPath(); c.arc(cx, cy, 3, 0, TAU); c.fill();
      // label (exact, two lines) from the entrance; "6,831 MW SHORT" lands whole on the pin (support size, white)
      const rx = x + 290, ny = p.body.y + 70, sN = 60;
      const wN = landText(c, B06S_NUM, rx, ny, GROT(900), sN, WHITE(0.97), t, tPin, { amp: 0.3 });
      landText(c, B06S_UNIT, rx + wN + 14, ny, GROT(900), 30, WHITE(0.95), t, tPin + 0.04, { amp: 0.2, track: -0.6 });
      lines(c, B06S_LABEL, rx, ny + 40, 23, t, tIn + 0.32, WHITE(0.92), 14);
    },
  });
}

// ====================================================================== chapters
export const chapters: Record<string, Chapter> = {
  s04: {
    draw(c, X) { s04Gap(c, X); s04Donut(c, X); flapSrc(c, X); },
    post(X, o: PostOverrides) {
      const kf = impact(X.t, [X.W('Open weights', 2).start], 0.06);
      const kl = impact(X.t, [X.W('Top Hugging Face', 4).start], 0.06);
      if (kf > 0.01 || kl > 0.01) {
        o.zoom = 1 + 0.016 * kf + 0.01 * kl;
        if (kf > 0.01) o.shake = shakeOf(X.t, 3 * kf, 41);
      }
      return o;
    },
  },
  s05: {
    draw(c, X) { flapSrc(c, X); s05Card(c, X); s05Bars(c, X); },
    post(X, o: PostOverrides) {
      const ko = impact(X.t, [X.W('Five tech', 6).start], 0.07);
      const kf = impact(X.t, [X.W('Five tech', 2).start], 0.06);
      if (ko > 0.01 || kf > 0.01) {
        o.zoom = 1 + 0.02 * ko + 0.01 * kf;
        if (ko > 0.01) o.shake = shakeOf(X.t, 5 * ko, 52);
      }
      return o;
    },
  },
  s06: {
    draw(c, X) { s06Chart(c, X); s06Gauge(c, X); },
    post(X, o: PostOverrides) {
      const kd = impact(X.t, [X.W('Data-centre electricity', 4).start], 0.07);
      // the pin hit lands as "2030." ends (instrumental tail), never on the sung year
      const kp = impact(X.t, [X.W('Data-centre electricity', 6).end], 0.06);
      if (kd > 0.01 || kp > 0.01) {
        o.zoom = 1 + 0.018 * kd + 0.01 * kp;
        if (kp > 0.01) o.shake = shakeOf(X.t, 4 * kp, 63);
      }
      return o;
    },
  },
};

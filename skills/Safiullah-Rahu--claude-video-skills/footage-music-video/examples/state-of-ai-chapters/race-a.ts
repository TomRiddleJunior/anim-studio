// THE STATE OF AI · OCT 2026 — race-a: the first three stories of verse 1 ("The race"), B01–B03.
// Round 2: integrated over the real footage, on the house primitives of ../brief (opaque panel with header strip
// "FIG. nn · <beat title>", source line in the panel footer, numbers landing with their contact frame on the word).
//   s01  "Nine major model launches. Forty days."            (≈2.3 s, one glance)   A01 hands on a keyboard · A02 code
//        a 40-cell calendar strip (3 SEP … 12 OCT) runs along the bottom; a white playhead sweeps it from "Nine" to
//        "launches." at a constant rate, so each launch glyph flips in on its real day (22 SEP carries two: 9 glyphs
//        in 8 cells). FIG. 01 opens on the cut with its footer source already whole BEFORE the 9 lands on "Nine";
//        MAJOR MODEL LAUNCHES / 3 SEP – 12 OCT 2026 wipe in on "major". "Forty" draws a coral bracket under the
//        whole strip. Coral = the 9, the nine glyphs, the forty-day bracket; everything else is white.
//   s02  "Four labs at the top. Five points apart."          (≈4.2 s)   B01 server aisle (graded down, cool)
//        FIG. 02: a line-drawn summit (to scale, 30–60): four identical unlabeled flags rise from a flat ridge on
//        "Four" to the true top-four scores, in no order (56 · 53 · 58 · 53); the fifth (46, on a lower ledge) lands
//        with the coral 53–58 band (a hatch) on "top.". No names, no values printed but 53–58. The footer source is
//        up from the cut; "labs" brings label + index name; "Five" lands 53–58 and draws its bracket.
//   s03  "The strongest cyber capabilities? Mostly locked to vetted users."   (≈4.7 s)   B02 hooded figure · B03 gate
//        FIG. 03 (footer source up from the cut): five identical glass doors (equal size, no labels) draw on through
//        "cyber capabilities?", over the typed question STRONGEST CYBER CAPABILITY:; the caveat tag THE CAPABILITY
//        LEVELS ARE THE COMPANIES' OWN CLAIMS lands on "capabilities?". "Mostly" swings the fifth door ajar;
//        "locked" snaps four padlocks shut and lands 4 US LABS under a bracket spanning those four; "vetted" slams
//        VETTED ACCESS ONLY.
// Every string on screen is the fact sheet's (research/FACTSHEET_AI.md B01–B03, §7) — see the FACT constants. The
// FIG header titles type on only after their footer source is fully uncovered (see figTitle / footAt).
// Pure functions of X.t; every time is a lyric word or the chapter/shot window.
import type { Chapter, X } from '../x';
import type { Word } from '../../engine/lyrics';
import type { PostOverrides } from '../../engine/scene';
import { clamp, ease, hash, lerp } from '../../engine/util';
import { measure } from '../../engine/type';
import { FONT, fi, WHITE, CORAL, text, hair, appear } from '../kit';
import { panel, caveatTag, landText, enter, leave, PANEL_BG, PAD, HEAD_H, FOOT_H, DUR } from '../brief';

const TAU = Math.PI * 2;

// ====================================================================== facts (exact fact-sheet strings)
const FACT = {
  b01: {
    fig: 'FIG. 01 · NINE IN FORTY',
    num: '9',
    label: 'MAJOR MODEL LAUNCHES',
    dates: '3 SEP – 12 OCT 2026',
    source: 'SOURCE · LAB ANNOUNCEMENTS · SEP–OCT 2026',
  },
  b02: {
    fig: 'FIG. 02 · FIVE POINTS APART',
    num: '53–58',
    label: 'TOP MODELS FROM 4 LABS',
    index: 'ARTIFICIAL ANALYSIS INTELLIGENCE INDEX',
    source: 'SOURCE · ARTIFICIAL ANALYSIS · 18 OCT 2026',
  },
  b03: {
    fig: 'FIG. 03 · BEHIND THE GATE',
    num: '4 US LABS',
    label: 'STRONGEST CYBER CAPABILITY:',
    stamp: 'VETTED ACCESS ONLY',
    // fact sheet §7 "On-screen wordings agreed": section-2 lab order, so the line does not lead with Anthropic
    source: 'SOURCE · OPENAI, ANTHROPIC, GOOGLE, xAI · APR–OCT 2026',
    // B03 "Attribution / caveat", the sheet's own sentence in caps (no agreed §7 wording yet: fact desk to confirm)
    caveat: "THE CAPABILITY LEVELS ARE THE COMPANIES' OWN CLAIMS",
  },
};

// ====================================================================== FIG panel timing (all three chapters)
// Every FIG panel unrolls on its chapter's cut in OPEN s, its footer source already complete (it is uncovered whole by
// the unrolling edge), and its header title types on only once that source is fully uncovered: nothing numeric — the
// FIG title, a landed number — is ever on screen before its source line.
const OPEN = 0.2, TITLE_T = 0.12;
/** When the footer source of a panel of height h, opened at t0 over OPEN (outExpo), is fully uncovered (hh ≥ h − 8). */
const footAt = (t0: number, h: number) => t0 + (OPEN * Math.log2(h / 8)) / 10;
/** The FIG header title, typed (block caret) in the panel's header strip; same type as brief.panel's own title. */
function figTitle(c: CanvasRenderingContext2D, s: string, x: number, y: number, u: number) {
  if (u <= 0) return;
  const chars = Array.from(s), n = u >= 1 ? chars.length : Math.floor(u * chars.length);
  const fam = FONT.mono(600), shown = chars.slice(0, n).join('');
  if (shown) text(c, shown, x + 16, y + 25, fam, 13, WHITE(0.92), { track: 2 });
  if (n < chars.length) {
    c.fillStyle = WHITE(0.9);
    c.fillRect(x + 16 + (shown ? measure(shown, fam, 13, 2) + 2 : 0) + 1, y + 25 - 13 * 0.82, 13 * 0.55, 13 * 0.98);
  }
}

// ====================================================================== local primitives
/** Text revealed left → right by a clip (u 0..1, already eased by the caller or not). */
function wipe(c: CanvasRenderingContext2D, s: string, x: number, y: number, fam: string, size: number, col: string, u: number, track = 0) {
  if (u <= 0) return;
  const w = measure(s, fam, size, track);
  c.save();
  c.beginPath(); c.rect(x - 4, y - size * 1.05, (w + 8) * clamp(u), size * 1.4); c.clip();
  text(c, s, x, y, fam, size, col, { track });
  c.restore();
  // the wipe's leading edge: a thin white bar while it travels (coral is kept for the hot value)
  if (u < 1) { c.fillStyle = WHITE(0.9); c.fillRect(x - 4 + (w + 8) * u, y - size * 0.86, 3, size * 0.98); }
}

/** Rubber stamp slammed in at t0 (scale overshoot), worn; outline on the panel colour + an impact ring. */
function slam(c: CanvasRenderingContext2D, s: string, x: number, y: number, t: number, t0: number,
  o: { size?: number; rot?: number; col?: string; seed?: number } = {}) {
  const size = o.size ?? 44, fam = FONT.grot(900);
  const w = measure(s, fam, size, -size * 0.01) + size * 0.62, h = size * 1.3;
  if (t < t0) return { w, h };
  const k = clamp((t - t0) / 0.17), sc = 1 + 0.7 * (1 - ease.outBack(k, 2.2));
  const col = o.col ?? CORAL(), seed = o.seed ?? 3, rot = o.rot ?? -0.035;
  c.save();
  c.translate(x, y); c.rotate(rot * (0.6 + 0.4 * ease.outCubic(k))); c.scale(sc, sc);
  c.globalAlpha *= clamp(k * 3);
  c.fillStyle = PANEL_BG; c.fillRect(-w / 2, -h / 2, w, h);
  c.strokeStyle = col; c.lineWidth = Math.max(2, size * 0.075); c.strokeRect(-w / 2, -h / 2, w, h);
  c.lineWidth = 1; c.strokeRect(-w / 2 + size * 0.14, -h / 2 + size * 0.14, w - size * 0.28, h - size * 0.28);
  text(c, s, 0, size * 0.035, fam, size, col, { align: 'center', base: 'middle', track: -size * 0.01 });
  // wear: knock out specks
  c.globalCompositeOperation = 'destination-out';
  c.fillStyle = '#000';
  for (let i = 0; i < 46; i++) c.fillRect(-w / 2 + hash(i, seed, 1) * w, -h / 2 + hash(i, seed, 2) * h, 1 + hash(i, seed, 3) * 3, 1 + hash(i, seed, 4) * 2);
  c.restore();
  const ru = (t - t0 - 0.1) / 0.22;
  if (ru > 0 && ru < 1) {
    const g = 1 + 0.28 * ease.outCubic(ru);
    c.save(); c.translate(x, y); c.rotate(rot);
    c.strokeStyle = col; c.globalAlpha *= 0.7 * (1 - ru); c.lineWidth = 2;
    c.strokeRect((-w / 2) * g, (-h / 2) * g, w * g, h * g);
    c.restore();
  }
  return { w, h };
}

/** Decaying impact envelope of event times (1 at the event, half-life hl). */
function impact(t: number, times: number[], hl = 0.06) {
  let k = 0;
  for (const s of times) if (t >= s) k = Math.max(k, Math.pow(0.5, (t - s) / hl));
  return k;
}
const shakeOf = (t: number, amp: number, seed: number): [number, number] =>
  [(hash(fi(t), seed, 1) - 0.5) * 2 * amp, (hash(fi(t), seed, 2) - 0.5) * 2 * amp];

/** Plain geometric glyphs (no lab marks): 0 circle · 1 square · 2 triangle · 3 diamond · 4 ring. */
function glyph(c: CanvasRenderingContext2D, kind: number, x: number, y: number, r: number, col: string) {
  c.save(); c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 2.2;
  c.beginPath();
  switch (kind % 5) {
    case 0: c.arc(x, y, r, 0, TAU); c.fill(); break;
    case 1: c.rect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7); c.fill(); break;
    case 2: c.moveTo(x, y - r); c.lineTo(x + r, y + r * 0.8); c.lineTo(x - r, y + r * 0.8); c.closePath(); c.fill(); break;
    case 3: c.moveTo(x, y - r * 1.15); c.lineTo(x + r, y); c.lineTo(x, y + r * 1.15); c.lineTo(x - r, y); c.closePath(); c.fill(); break;
    default: c.arc(x, y, r * 0.85, 0, TAU); c.stroke();
  }
  c.restore();
}

// ====================================================================== s01 · NINE IN FORTY (B01)
// 40 day cells, 3 SEP (day 0) … 30 SEP (day 27) | 1 OCT (day 28) … 12 OCT (day 39).
// Launch days from the B01 detail: 3 SEP · 21 SEP · 22 SEP (two) · 28 SEP · 29 SEP · 30 SEP · 7 OCT · 12 OCT = 9.
const LAUNCHES: [day: number, count: number][] = [[0, 1], [18, 1], [19, 2], [25, 1], [26, 1], [27, 1], [34, 1], [39, 1]];
const launchCount = (i: number) => LAUNCHES.find(([d]) => d === i)?.[1] ?? 0;
const S1 = { x0: 110, y: 880, cw: 36, ch: 62, pitch: 42, mgap: 12, oct: 28, n: 40 };
const cellX = (i: number) => S1.x0 + i * S1.pitch + (i >= S1.oct ? S1.mgap : 0);
const STRIP_X1 = cellX(S1.n - 1) + S1.cw;
/** FIG. 01: top-left, 9 size, body height (header + body + footer). */
const HP1 = { x: 110, y: 584, num: 176, bodyH: 176 };

interface S01T { t0: number; t1: number; nine: Word; major: Word; launches: Word; forty: Word; sA: number; sB: number }
function s01T(X: X): S01T {
  const w = (k: number) => X.W('Nine major', k);
  const nine = w(0), major = w(1), launches = w(3), forty = w(4);
  return { t0: X.S('A01')?.t0 ?? X.ch.t0, t1: X.ch.t1, nine, major, launches, forty, sA: nine.start, sB: launches.start };
}
/** When the playhead (constant speed, "Nine" → "launches.") reaches frame-x. */
const sweepAt = (T: S01T, x: number) => lerp(T.sA, T.sB, (x - S1.x0) / (STRIP_X1 - S1.x0));

function s01Strip(c: CanvasRenderingContext2D, X: X, T: S01T) {
  const t = X.t;
  const kIn = appear(t, T.t0 + 0.02, 0.32);
  if (kIn <= 0) return;
  // month rules: SEP ———— | OCT ——— (each label on its own opaque tab, legible on footage)
  for (const [lab, i0, i1] of [['SEP', 0, S1.oct - 1], ['OCT', S1.oct, S1.n - 1]] as const) {
    const xa = cellX(i0), xb = cellX(i1) + S1.cw, y = S1.y - 13;
    const tw = measure(lab, FONT.mono(600), 14, 2);
    c.save(); c.globalAlpha *= kIn; c.fillStyle = PANEL_BG; c.fillRect(xa - 4, y - 15, tw + 8, 21); c.restore();
    const lw = text(c, lab, xa, y, FONT.mono(600), 14, WHITE(0.92 * kIn), { track: 2 });
    hair(c, xa + lw + 10, y - 5, lerp(xa + lw + 10, xb, ease.outCubic(kIn)), y - 5, WHITE(0.5), 1);
  }
  const kick = X.hit('kick');
  for (let i = 0; i < S1.n; i++) {
    const x = cellX(i), y = S1.y, cx = x + S1.cw / 2, cy = y + S1.ch / 2;
    const ki = appear(t, T.t0 + 0.02 + i * 0.004, 0.24);
    if (ki <= 0) continue;
    const hh = S1.ch * ki, yy = cy - hh / 2;
    const tp = sweepAt(T, cx);
    const passed = t >= tp;
    c.fillStyle = PANEL_BG; c.fillRect(x, yy, S1.cw, hh); // opaque: no keycap glyph shows through a cell
    if (passed) { c.fillStyle = WHITE(0.07); c.fillRect(x, yy, S1.cw, hh); }
    c.strokeStyle = WHITE(passed ? 0.34 : 0.22); c.lineWidth = 1; c.strokeRect(x + 0.5, yy + 0.5, S1.cw - 1, hh - 1);
    // the day's slot tick
    c.fillStyle = WHITE(passed ? 0.55 : 0.28); c.fillRect(cx - 5, yy + hh - 11, 10, 1.5);
    const n = launchCount(i);
    for (let g = 0; g < n; g++) {
      const tf = tp + g * 0.08, local = (t - tf) / 0.24;
      if (local < 0) continue;
      const gy = n === 1 ? cy - 4 : cy - 4 + (g === 0 ? -12 : 12), r = n === 1 ? 9 : 7;
      if (local < 1) {
        // split-flap flip: white wash, a squashed glyph spinning through plain shapes
        c.fillStyle = WHITE(0.18 * (1 - local)); c.fillRect(x, yy, S1.cw, hh);
        const sq = 0.45 + 0.55 * Math.abs(Math.cos(local * 3 * Math.PI));
        c.save(); c.translate(cx, gy); c.scale(1, sq); c.translate(-cx, -gy);
        glyph(c, Math.floor(hash(i, g, fi(t)) * 5), cx, gy, r, WHITE(0.95));
        c.restore();
      } else {
        const pop = 1 + 0.35 * (1 - ease.outCubic(clamp(local - 1))) + 0.12 * kick;
        glyph(c, 0, cx, gy, r * pop, CORAL());
      }
    }
    c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(x, cy - 0.75, S1.cw, 1.5); // the flap's split line
  }
  // the playhead: white on a dark underlay (legible over bright footage)
  if (t >= T.sA - 0.04 && t < T.sB + 0.2) {
    const u = clamp((t - T.sA) / (T.sB - T.sA)), px = lerp(S1.x0, STRIP_X1, u);
    const a = 1 - clamp((t - T.sB) / 0.2);
    c.save(); c.globalAlpha *= a;
    hair(c, px, S1.y - 9, px, S1.y + S1.ch + 9, PANEL_BG, 6);
    c.fillStyle = PANEL_BG; c.beginPath(); c.moveTo(px - 9, S1.y - 18); c.lineTo(px + 9, S1.y - 18); c.lineTo(px, S1.y - 6); c.closePath(); c.fill();
    hair(c, px, S1.y - 8, px, S1.y + S1.ch + 8, WHITE(0.95), 2);
    c.fillStyle = WHITE(0.95); c.beginPath(); c.moveTo(px - 6, S1.y - 16); c.lineTo(px + 6, S1.y - 16); c.lineTo(px, S1.y - 8); c.closePath(); c.fill();
    c.restore();
  }
  // "Forty": a coral bracket spans the whole strip, left → right, on a dark underlay
  const kb = ease.outExpo(clamp((t - T.forty.start) / 0.22));
  if (kb > 0) {
    const yb = S1.y + S1.ch + 12, xb = lerp(S1.x0, STRIP_X1, kb), end = kb > 0.97;
    hair(c, S1.x0, yb - 9, S1.x0, yb + 1, PANEL_BG, 6);
    hair(c, S1.x0 - 2, yb, xb + 2, yb, PANEL_BG, 6);
    if (end) hair(c, STRIP_X1, yb - 9, STRIP_X1, yb + 1, PANEL_BG, 6);
    hair(c, S1.x0, yb - 8, S1.x0, yb, CORAL(), 2);
    hair(c, S1.x0, yb, xb, yb, CORAL(), 2);
    if (end) hair(c, STRIP_X1, yb - 8, STRIP_X1, yb, CORAL(), 2);
  }
}

function s01Head(c: CanvasRenderingContext2D, X: X, T: S01T) {
  const t = X.t, f = FACT.b01;
  const numFam = FONT.grot(900), numW = measure(f.num, numFam, HP1.num, -HP1.num * 0.02);
  const lx = HP1.x + PAD + numW + 34;
  const w = lx - HP1.x + measure(f.label, FONT.grot(800), 40, -0.8) + 30;
  // FIG. 01 opens on the cut (A01, ~0.18 s before "Nine") at full width; its footer source is uncovered whole at
  // ~14.27, then the title types on and the 9's first frame (~14.30) follows: neither is ever up without the source
  const h = HEAD_H + HP1.bodyH + FOOT_H, tFoot = footAt(T.t0, h);
  const p = panel(c, HP1.x, HP1.y, w, h, {
    k: enter(t, T.t0, OPEN), title: ' ', source: f.source,
    draw: (p) => {
      figTitle(c, f.fig, HP1.x, HP1.y, enter(t, tFoot, TITLE_T));
      const a = T.major.start;
      wipe(c, f.label, lx, p.body.y + 80, FONT.grot(800), 40, WHITE(0.97), ease.outExpo(clamp((t - a) / 0.32)), -0.8);
      wipe(c, f.dates, lx, p.body.y + 124, FONT.mono(600), 26, WHITE(0.95), ease.outExpo(clamp((t - a - 0.1) / 0.32)), 0.5);
    },
  });
  // the 9 lands on "Nine" (contact frame = the word; a short 0.15 s entrance so its first frame comes after the
  // source is uncovered), drawn outside the panel clip so its overshoot is never cut
  landText(c, f.num, HP1.x + PAD, p.body.y + 150, numFam, HP1.num, CORAL(), t, T.nine.start, { dur: 0.15 });
}

// ====================================================================== s02 · FIVE POINTS APART (B02)
const P2 = { x: 1190, y: 252, w: 640 };
const PL2 = { x: P2.x + 44, y: P2.y + HEAD_H + 40, w: P2.w - 44 - 104, h: 250 };
const V0 = 30, V1 = 60, RIDGE = 53, LEDGE = 46;
const vy = (v: number) => PL2.y + PL2.h - ((v - V0) / (V1 - V0)) * PL2.h;
const ux = (u: number) => PL2.x + u * PL2.w;
// the summit, drawn to scale: a flat ridge at the band's floor (53), a ledge at 46 (the fifth). The four top flags
// stand on poles from the ridge to their true scores (B02 detail), unlabeled and deliberately unsorted (no order,
// no peak) — the band's top and bottom are then exactly the highest and lowest of the four.
const MOUNTAIN: [number, number][] = [
  [0, V0], [0.045, 33.5], [0.08, 35.8], [0.11, 35.2], [0.155, 39.6], [0.2, 43.4], [0.225, 43], [0.265, 48.6],
  [0.3, 51.4], [0.33, RIDGE],
  [0.67, RIDGE], [0.7, 51.2], [0.725, 51.6], [0.755, 49], [0.785, LEDGE], [0.875, LEDGE], [0.9, 43.2],
  [0.925, 41.4], [0.95, 37.2], [0.972, 35.8], [1, V0],
];
const MARKERS: [number, number][] = [[0.38, 56], [0.46, 53], [0.54, 58], [0.62, 53], [0.83, LEDGE]];

interface S02T { t0: number; t1: number; four: Word; labs: Word; top: Word; five: Word }
function s02T(X: X): S02T {
  const w = (k: number) => X.W('Four labs at the top', k);
  return { t0: X.S('B01')?.t0 ?? X.ch.t0, t1: X.ch.t1, four: w(0), labs: w(1), top: w(4), five: w(5) };
}

function s02Panel(c: CanvasRenderingContext2D, X: X, T: S02T) {
  const t = X.t, f = FACT.b02;
  const yN = PL2.y + PL2.h + 126; // headline baseline
  // until "Five" the label block (label, index name) sits right under the plot (no empty number slot); on "Five" it
  // slides down to make room for 53–58 and the panel grows with it (the move starts a hair early so the number lands
  // in a clear slot). Before "labs" the body ends just under the plot; on "labs" it opens to take the label block.
  // The footer (source) rides the panel's bottom edge throughout.
  const kS = ease.outExpo(clamp((t - (T.five.start - 0.1)) / 0.3));
  const kL = ease.outExpo(clamp((t - (T.labs.start - 0.04)) / 0.3));
  const off = -(126 + 16 - 24) * (1 - kS);
  const footA = PL2.y + PL2.h + 22, footB = yN + 93 - 118 + 26, footC = yN + 93 + 26;
  const h = lerp(lerp(footA, footB, kL), footC, kS) + FOOT_H - P2.y;
  const lx = P2.x + 36;
  // opens on the B01 cut with its footer source whole (uncovered ~16.63, before the flap's 4 LABS settles and long
  // before "labs"); the FIG title types on after it
  const tFoot = footAt(T.t0, footA + FOOT_H - P2.y);
  panel(c, P2.x, P2.y, P2.w, h, {
    k: enter(t, T.t0, OPEN), title: ' ', source: f.source,
    draw: () => {
      figTitle(c, f.fig, P2.x, P2.y, enter(t, tFoot, TITLE_T));
      // the band 53–58 (lands on "top.") — behind the mountain: a crisp coral hatch (a translucent coral fill over the
      // opaque panel reads as a muddy oxblood second accent), wiped on left → right
      const kb = ease.outExpo(clamp((t - T.top.start) / 0.35));
      const bx0 = PL2.x - 12, bx1 = PL2.x + PL2.w + 12, by0 = vy(58), by1 = vy(53);
      if (kb > 0) {
        const bh = by1 - by0;
        c.save();
        c.beginPath(); c.rect(bx0, by0, (bx1 - bx0) * kb, bh); c.clip();
        c.strokeStyle = CORAL(0.8); c.lineWidth = 1.2;
        c.beginPath();
        for (let x = bx0 - bh; x < bx1; x += 9) { c.moveTo(x, by1); c.lineTo(x + bh, by0); }
        c.stroke();
        c.restore();
      }

      // the summit, drawn on from the chapter's start to "Four"
      const pts = MOUNTAIN.map(([u, v]) => [ux(u), vy(v)] as [number, number]);
      const segL = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i]![0], p[1] - pts[i]![1]));
      const total = segL.reduce((a, b) => a + b, 0);
      const ku = ease.inOutCubic(clamp((t - (T.t0 + 0.08)) / Math.max(0.2, T.four.start - T.t0 - 0.08)));
      if (ku > 0) {
        // fill rises with the outline
        c.save(); c.globalAlpha *= ku;
        c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
        c.fillStyle = WHITE(0.07); c.fill();
        // strata hatching: faint contour lines clipped to the mountain
        c.clip();
        for (let v = V0 + 3; v < 54; v += 3) hair(c, PL2.x, vy(v), PL2.x + PL2.w, vy(v), WHITE(0.07), 1);
        c.restore();
        let left = total * ku;
        c.save(); c.strokeStyle = WHITE(0.9); c.lineWidth = 1.5; c.lineJoin = 'round';
        c.beginPath(); c.moveTo(pts[0]![0], pts[0]![1]);
        for (let i = 1; i < pts.length && left > 0; i++) {
          const L = segL[i - 1]!, e = Math.min(1, left / L);
          c.lineTo(lerp(pts[i - 1]![0], pts[i]![0], e), lerp(pts[i - 1]![1], pts[i]![1], e));
          left -= L;
        }
        c.stroke(); c.restore();
        hair(c, PL2.x - 12, vy(V0), PL2.x + PL2.w + 12, vy(V0), WHITE(0.45), 1); // ground line
      }
      // the band's edges, over the mountain
      if (kb > 0) {
        c.save(); c.setLineDash([5, 4]);
        hair(c, bx0, by0, bx0 + (bx1 - bx0) * kb, by0, CORAL(0.95), 1.2);
        hair(c, bx0, by1, bx0 + (bx1 - bx0) * kb, by1, CORAL(0.95), 1.2);
        c.restore();
      }
      // five identical, unlabeled flags: the four top ones run up their poles across "Four", the fifth (on the
      // ledge) lands with the band on "top."
      MARKERS.forEach(([u, v], i) => {
        const km = clamp((t - (i < 4 ? T.four.start + i * 0.05 : T.top.start)) / 0.22);
        if (km <= 0) return;
        const x = ux(u), yR = vy(Math.min(v, RIDGE)), y = lerp(yR, vy(v), ease.outExpo(km));
        const sc = ease.outBack(km, 2.6);
        if (v > RIDGE) hair(c, x, yR, x, y, WHITE(0.9 * km), 1.5);
        c.save(); c.translate(x, y); c.scale(sc, sc);
        c.fillStyle = PANEL_BG; c.beginPath(); c.arc(0, 0, 11.5, 0, TAU); c.fill();
        c.fillStyle = WHITE(0.97); c.beginPath(); c.arc(0, 0, 8.5, 0, TAU); c.fill();
        c.restore();
      });
      // "Five": the bracket opens from the band's middle out to 53 and 58
      const kf = ease.outExpo(clamp((t - T.five.start) / 0.3));
      if (kf > 0) {
        const xb = PL2.x + PL2.w + 30, ym = (by0 + by1) / 2, hy = ((by1 - by0) / 2) * kf;
        hair(c, xb, ym - hy, xb, ym + hy, CORAL(), 2);
        hair(c, xb - 10, ym - hy, xb, ym - hy, CORAL(), 2);
        hair(c, xb - 10, ym + hy, xb, ym + hy, CORAL(), 2);
      }
      // headline: label + index name first ("labs"), then the number lands above them on "Five"
      hair(c, lx, yN + 16 + off, P2.x + P2.w - 36, yN + 16 + off, WHITE(0.3 * clamp((t - T.labs.start) / 0.3)), 1);
      wipe(c, f.label, lx, yN + 58 + off, FONT.grot(800), 32, WHITE(0.97), ease.outExpo(clamp((t - T.labs.start) / 0.32)), -0.6);
      wipe(c, f.index, lx, yN + 93 + off, FONT.mono(600), 20, WHITE(0.93), ease.outExpo(clamp((t - T.labs.start - 0.1) / 0.32)), 0.8);
    },
  });
  // 53–58 lands on "Five" (contact frame = the word), outside the panel clip so its overshoot is never cut
  landText(c, f.num, lx, yN, FONT.grot(900), 112, CORAL(), t, T.five.start);
}

// ====================================================================== s03 · BEHIND THE GATE (B03)
const P3 = { x: 1160, y: 260, w: 670 };
const D3 = { x0: 1196, y: P3.y + HEAD_H + 44, w: 96, h: 214, gap: 22 };
const doorX = (i: number) => D3.x0 + i * (D3.w + D3.gap);

interface S03T { t0: number; t1: number; strongest: Word; cyber: Word; caps: Word; mostly: Word; locked: Word; vetted: Word }
function s03T(X: X): S03T {
  const w = (k: number) => X.W('The strongest cyber', k);
  return { t0: X.S('B02')?.t0 ?? X.ch.t0, t1: X.ch.t1, strongest: w(1), cyber: w(2), caps: w(3), mostly: w(4), locked: w(5), vetted: w(7) };
}

/** Rectangle perimeter drawn on to u (clockwise from the bottom-left corner, so a door "rises" from the floor). */
function rectOn(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, u: number, col: string, lw = 1.5) {
  if (u <= 0) return;
  const P: [number, number][] = [[x, y + h], [x, y], [x + w, y], [x + w, y + h]];
  const L = [h, w, h], tot = h + w + h;
  let left = tot * clamp(u);
  c.save(); c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(P[0]![0], P[0]![1]);
  for (let i = 1; i < P.length && left > 0; i++) {
    const e = Math.min(1, left / L[i - 1]!);
    c.lineTo(lerp(P[i - 1]![0], P[i]![0], e), lerp(P[i - 1]![1], P[i]![1], e));
    left -= L[i - 1]!;
  }
  c.stroke(); c.restore();
}

/** A padlock: body + shackle; `shut` 0 (open, raised) → 1 (closed); `hot` fills the body coral. */
function padlock(c: CanvasRenderingContext2D, x: number, y: number, shut: number, hot: number, alpha = 1) {
  const bw = 26, bh = 20, r = 8, lift = 9 * (1 - ease.outBack(clamp(shut), 3));
  c.save(); c.globalAlpha *= alpha;
  c.strokeStyle = hot > 0.5 ? CORAL() : WHITE(0.9); c.lineWidth = 3; c.lineCap = 'butt';
  c.beginPath();
  c.moveTo(x - r, y - 2 - lift * 0.35); c.lineTo(x - r, y - 10 - lift); c.arc(x, y - 10 - lift, r, Math.PI, 0); c.lineTo(x + r, y - 2 - lift);
  c.stroke();
  c.fillStyle = hot > 0.5 ? CORAL() : PANEL_BG;
  c.fillRect(x - bw / 2, y - 2, bw, bh);
  c.strokeStyle = hot > 0.5 ? CORAL() : WHITE(0.9); c.lineWidth = 1.5; c.strokeRect(x - bw / 2 + 0.75, y - 1.25, bw - 1.5, bh - 1.5);
  c.fillStyle = hot > 0.5 ? PANEL_BG : WHITE(0.9); c.fillRect(x - 1.5, y + 5, 3, 7); // keyhole
  c.restore();
}

function s03Doors(c: CanvasRenderingContext2D, X: X, T: S03T) {
  const t = X.t, f = FACT.b03;
  const lockT = T.locked.start, ajarT = T.mostly.start;
  const yN = D3.y + D3.h + 92;     // "4 US LABS" baseline
  const yL1 = yN + 62;             // label baseline (final)
  const yS = yL1 + 58;             // stamp centre
  // while the question is asked the label sits right under the doors with the footer source under it; on "locked"
  // the label slides down to make room for 4 US LABS and the panel grows to take the stamp (the footer rides along)
  const kS = ease.outExpo(clamp((t - (lockT - 0.1)) / 0.3));
  const yL0 = D3.y + D3.h + 72, yL = lerp(yL0, yL1, kS);
  const h = lerp(yL0 + 22, yS + 36, kS) + FOOT_H - P3.y;
  const lx = P3.x + 36;
  const floorY = D3.y + D3.h;
  // opens on the B02 cut (with "The") with its footer source whole, uncovered ~20.85 — before the flap's 4 US LABS
  // settles (~21.4) — and the FIG title types on after it
  const tFoot = footAt(T.t0, yL0 + 22 + FOOT_H - P3.y);
  panel(c, P3.x, P3.y, P3.w, h, {
    k: enter(t, T.t0, OPEN), title: ' ', source: f.source,
    draw: () => {
      figTitle(c, f.fig, P3.x, P3.y, enter(t, tFoot, TITLE_T));
      // the B03 caveat, on "capabilities?" (the levels it qualifies), in the figure's top margin above the doors; up
      // through 4 US LABS and the stamp to the cut
      caveatTag(c, f.caveat, lx, P3.y + HEAD_H + 9, { k: enter(t, T.caps.start, DUR.tag) });
      const kFloor = ease.outCubic(clamp((t - T.cyber.start) / 0.4));
      hair(c, P3.x + 20, floorY, lerp(P3.x + 20, P3.x + P3.w - 20, kFloor), floorY, WHITE(0.5), 1);
      for (let i = 0; i < 5; i++) {
        const x = doorX(i), y = D3.y;
        // the doors rise from the floor, staggered across "cyber capabilities?"
        const d0 = T.cyber.start + i * 0.07, u = ease.inOutCubic(clamp((t - d0) / 0.5));
        if (u <= 0) continue;
        const settled = clamp((t - d0 - 0.45) / 0.25);
        // the fifth door is drawn exactly like the other four until "Mostly"; then it swings ajar about its left hinge
        const th = i === 4 ? 1.0 * ease.outCubic(clamp((t - ajarT) / 0.4)) : 0;
        if (th > 0.001) {
          const ex = x + D3.w * Math.cos(th), sp = D3.w * Math.sin(th) * 0.2;
          // the doorway behind it: lit (flat fill), and the light falling across the floor
          c.fillStyle = WHITE(0.22 * clamp(th * 2)); c.fillRect(ex, y, x + D3.w - ex, D3.h);
          c.fillStyle = WHITE(0.12 * clamp(th * 2));
          c.beginPath(); c.moveTo(ex, floorY); c.lineTo(x + D3.w, floorY); c.lineTo(x + D3.w + 26, floorY + 30); c.lineTo(ex + 6, floorY + 30); c.closePath(); c.fill();
          rectOn(c, x, y, D3.w, D3.h, 1, WHITE(0.5), 1); // the frame stays
          // the leaf: a quad, its free edge foreshortened and splayed towards us
          c.save();
          c.beginPath(); c.moveTo(x, y); c.lineTo(ex, y - sp); c.lineTo(ex, y + D3.h + sp); c.lineTo(x, y + D3.h); c.closePath();
          c.fillStyle = PANEL_BG; c.fill();
          c.fillStyle = WHITE(0.06); c.fill();
          c.strokeStyle = WHITE(0.9); c.lineWidth = 1.5; c.stroke();
          c.restore();
          const sq = Math.cos(th); // foreshortened fittings
          c.fillStyle = WHITE(0.8); c.fillRect(x + (D3.w - 15) * sq, y + D3.h * 0.36, Math.max(1.5, 4 * sq), 62);
          c.save(); c.translate(x + (D3.w / 2 - 6) * sq, 0); c.scale(Math.max(0.35, sq), 1);
          padlock(c, 0, y + D3.h * 0.6, 0, 0); // never locks
          c.restore();
          continue;
        }
        c.fillStyle = WHITE(0.06 * settled); c.fillRect(x, y, D3.w, D3.h);
        rectOn(c, x, y, D3.w, D3.h, u, WHITE(0.9));
        if (settled > 0) {
          c.save(); c.globalAlpha *= settled;
          hair(c, x + 10, y + 22, x + 34, y + 4, WHITE(0.16), 1); // glass sheen
          hair(c, x + 10, y + 48, x + 58, y + 4, WHITE(0.1), 1);
          c.fillStyle = WHITE(0.8); c.fillRect(x + D3.w - 15, y + D3.h * 0.36, 4, 62); // push bar
          const shut = i < 4 ? clamp((t - lockT) / 0.16) : 0;
          padlock(c, x + D3.w / 2 - 6, y + D3.h * 0.6, shut, shut > 0.4 ? 1 : 0);
          // the snap: a ring kicks out from the lock
          const ru = (t - lockT - 0.06) / 0.25;
          if (i < 4 && ru > 0 && ru < 1) {
            c.strokeStyle = CORAL(0.8 * (1 - ru)); c.lineWidth = 2;
            c.beginPath(); c.arc(x + D3.w / 2 - 6, y + D3.h * 0.6 + 4, 18 + 22 * ease.outCubic(ru), 0, TAU); c.stroke();
          }
          c.restore();
        }
      }
      // "locked": a bracket spans the four locked doors and 4 US LABS lands under it
      const kb = ease.outExpo(clamp((t - lockT) / 0.3));
      if (kb > 0) {
        const bx0 = doorX(0), bx1 = doorX(3) + D3.w, by = floorY + 18;
        hair(c, bx0, by - 8, bx0, by, CORAL(), 2);
        hair(c, bx0, by, lerp(bx0, bx1, kb), by, CORAL(), 2);
        if (kb > 0.97) hair(c, bx1, by - 8, bx1, by, CORAL(), 2);
      }
      // the question, typed in as it is asked ("strongest")
      const wu = ease.outExpo(clamp((t - T.strongest.start) / 0.4));
      wipe(c, f.label, lx, yL, FONT.grot(800), 34, WHITE(0.97), wu, -0.6);
      // the sentence waits for its answer: a block caret blinks on the half-beat after the colon until "vetted"
      if (wu >= 0.999 && t < T.vetted.start && Math.floor(X.beat() * 2) % 2 === 0) {
        c.fillStyle = WHITE(0.9); c.fillRect(lx + measure(f.label, FONT.grot(800), 34, -0.6) + 8, yL - 26, 14, 28);
      }
    },
  });
  // landings drawn outside the panel clip so their overshoot is never cut: 4 US LABS on "locked" (contact frame =
  // the word), then the stamp completes the sentence on "vetted" (white: the coral is the number's)
  landText(c, f.num, lx, yN, FONT.grot(900), 66, CORAL(), t, lockT);
  const sw = measure(f.stamp, FONT.grot(900), 40, -0.4) + 40 * 0.62;
  slam(c, f.stamp, lx + sw / 2 + 2, yS, t, T.vetted.start - 0.05, { size: 40, rot: -0.03, seed: 7, col: WHITE(0.97) });
}

// ====================================================================== chapters
export const chapters: Record<string, Chapter> = {
  s01: {
    draw(c, X) {
      const T = s01T(X);
      c.save();
      c.globalAlpha *= leave(X.t, T.t1, 0.14);
      s01Strip(c, X, T);
      s01Head(c, X, T);
      c.restore();
    },
    post(X, o: PostOverrides) {
      const T = s01T(X);
      const k = impact(X.t, [T.nine.start], 0.07), kf = impact(X.t, [T.forty.start], 0.06);
      if (k > 0.01 || kf > 0.01) o.zoom = 1 + 0.02 * k + 0.008 * kf;
      return o;
    },
  },
  s02: {
    draw(c, X) {
      const T = s02T(X);
      c.save();
      c.globalAlpha *= leave(X.t, T.t1, DUR.out);
      s02Panel(c, X, T);
      c.restore();
    },
    post(X, o: PostOverrides) {
      const T = s02T(X);
      const k = impact(X.t, [T.five.start], 0.07), k4 = impact(X.t, [T.four.start], 0.05);
      if (k > 0.01 || k4 > 0.01) o.zoom = 1 + 0.018 * k + 0.008 * k4;
      return o;
    },
  },
  s03: {
    draw(c, X) {
      const T = s03T(X);
      c.save();
      c.globalAlpha *= leave(X.t, T.t1, DUR.out);
      s03Doors(c, X, T);
      c.restore();
    },
    post(X, o: PostOverrides) {
      const T = s03T(X);
      const kl = impact(X.t, [T.locked.start], 0.05), kv = impact(X.t, [T.vetted.start], 0.06);
      if (kl > 0.01 || kv > 0.01) {
        o.shake = shakeOf(X.t, 3 * kl + 6 * kv, 31);
        o.zoom = 1 + 0.008 * kl + 0.016 * kv;
      }
      return o;
    },
  },
};

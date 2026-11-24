// THE STATE OF AI · OCT 2026 — group "brakes-b": chapters s11 · s12 · s13 · s14 (policy, work, the public).
// Round 2: integrated over the real footage, in the house style of ../brief (opaque panels with corner brackets,
// footer source lines, label-printer caveat tags, numbers that LAND whole on their word, never counted).
//   s11  B11 "Washington's new word for AI: 'Super Intelligence.' By executive order."   M01 dusk skyline · M02 pen nib
//        a blank cream form (paper panel, right column) unrolls on the M01 cut with its WHITE HOUSE footer source
//        (before the flap board shows AI → SI / EO 14434); AI is set in its field on "AI:"; on "Super" an arrow
//        draws on and a coral SI stamp LANDS: AI → SI, with the EO 14434 line. Punch on "Super" and on "order" (where the M02 nib touches the paper).
//        (The optional EO 14409 support is not used — see F11.)
//   s12  B12 "Brussels and the FTC: questions for OpenAI and Anthropic."   N01 parliament dome · N02 typewriter hands
//        Right column only (the N02 hands own the left and centre): FIG. 12B EU AI OFFICE support panel at the
//        bottom on "Brussels"; FIG. 12 above it on "FTC:" — 14 OCT lands on "FTC", FTC demands → OPENAI, ANTHROPIC in
//        one line of equal type (fact-sheet order) + INVESTIGATIONS, NOT FINDINGS complete on the same frame;
//        "questions": two identical envelopes slide toward two identical unlabeled doors and slip under them on
//        "Anthropic".
//   s13  B13 "The IMF: forty percent of jobs worldwide exposed. 'A slow-moving tsunami.'"   O01 office · O02 robot
//        FIG. 13 (right column) opens on the O01 cut with its IMF source and the "EXPOSED" DOES NOT MEAN JOBS LOST tag
//        (before the flap board shows ~40%); ~40% lands on "forty" with a 40-of-100 meter. At the O02 cut ~40% turns white and
//        FIG. 13B opens UNDER it in the right column (the delta robot keeps the left): the bottom rung lands coral,
//        −19% (ages 22–25) lands on "slow-moving", a slow wave line crosses the frame in the gap between the panels,
//        and the bottom rung fades on "tsunami".
//   s14  B14 "Seventy-seven percent of Americans: slow or stop powerful AI till it's safety-checked." + "Eyes open."
//        77% lands on "Seventy-seven" (FIG. 14, right); 100 identical paper silhouettes rise on "Americans"
//        (lower-left); 47 raise a palm forward on "slow", 30 raise a palm straight up on "stop" (77 coral palms in
//        100); FIG. 14B 71% vs 16% lands on "safety-checked". At the Q02 cut the facts clear and the build begins:
//        on the macro eye (Q02.0) a CV box locks onto the REAL eye as it opens on "Eyes"; at the cut to the light
//        leak (Q02.1) the box holds on the same rect and a line-art eye fills it, already open (match cut: place,
//        scale, state), pupil on "open.", wider on the second "Eyes", beat
//        rings + a 4-beat riser, zoom ramp into chorus 2.
//   FLAP GUARD  the chrome's flap board flips on line starts, not on our cuts: wherever it still shows one of our fact
//        rows after the panel that sources it has gone (s12 head: EO 14434 · s14 head: ~40% · Q02 build: 77%), the
//        row's source (and caveat) stands beside the board until the last of its glyphs has flipped (flapFootnote).
// Every on-screen string is copied from research/FACTSHEET_AI.md (beat cards B11–B14; section 7 wins) — see the FACT
// constants below. Times are anchored to lyric words (X.W / X.L) and shot windows (X.S); pure function of X.t.
import type { Chapter, X } from '../x';
import type { PostOverrides } from '../../engine/scene';
import { measure } from '../../engine/type';
import { clamp, ease, hash, lerp, pulse } from '../../engine/util';
import { FONT, C, WHITE, CORAL, INK, rgbaHex, text, hair, barcode, fi } from '../kit';
import { cvBox } from '../cards';
import { boxToFrame } from '../../engine/media';
import { panel, caveatTag, sourceLine, landText, land, enter, typedBy, leave, DUR, PAD, HEAD_H, FOOT_H, PANEL_BG } from '../brief';

const NB = ' ';
/** right column (clear of the lyric block, below the flap board) and the lower-left zone */
const RX = 1120, RY = 262, RW = 700;
const LX = 110;
/** gap between two stacked right-column panels */
const GAP = 16;

// ====================================================================== the fact strings (exactly as the fact sheet prints them)
const F11 = {
  head: ['AI', '→', 'SI'], // `AI → SI`
  label: 'EXECUTIVE ORDER 14434 · FEDERAL COMMUNICATIONS SAY "SUPER INTELLIGENCE"',
  /** the label set on explicit lines (joined with ' ' it is exactly `label` — checked at load) */
  labLines: ['EXECUTIVE ORDER 14434 ·', 'FEDERAL COMMUNICATIONS SAY', '"SUPER INTELLIGENCE"'],
  src: 'SOURCE · WHITE HOUSE · 29 SEP 2026',
  // The optional EO 14409 support (`PRE-RELEASE TESTING: VOLUNTARY, UP TO 30 DAYS · NO LICENSING`) is deliberately not
  // used: ~1 s of read time, landing on "By executive order" under the EO 14434 card, it would be credited to EO 14434,
  // which has no regulatory or safety content (fact sheet B11 caveat).
};
if (F11.labLines.join(' ') !== F11.label) throw new Error('[brakes-b] F11.labLines drifted from the fact-sheet label');
const F12 = {
  head: '14 OCT',
  label: 'FTC CIVIL INVESTIGATIVE DEMANDS → OPENAI, ANTHROPIC',
  src: 'SOURCE · FTC VIA CBS / TNW · OCT 2026',
  sup: 'EU AI OFFICE: FIRST AI ACT REQUESTS FOR INFORMATION, INCL. ON SUMMER LAB INCIDENTS',
  supSrc: 'SOURCE · EURONEWS · 14 OCT 2026',
  tag: 'INVESTIGATIONS, NOT FINDINGS',
};
const F13 = {
  head: '~40%',
  label: 'OF JOBS WORLDWIDE: AUGMENTED, DOWNGRADED OR ELIMINATED BY AI, OVER TIME',
  src: 'SOURCE · IMF (GEORGIEVA) VIA AP · 13 OCT 2026',
  tag: '"EXPOSED" DOES NOT MEAN JOBS LOST', // B13 caveat: "Exposed" does not mean jobs lost.
  sup: '−19%',
  supLabel: 'EMPLOYMENT, AGES 22–25 IN THE MOST AI-EXPOSED JOBS, VS TREND',
  supSrc: 'SOURCE · STANFORD DIGITAL ECONOMY LAB · AUG 2026',
};
const F14 = {
  head: '77%',
  // section 7 (lyric review) wins over the B14 card's paraphrase: Quinnipiac Q25 says "until safety can be evaluated"
  label: 'US ADULTS: STOP (30%) OR SLOW (47%) POWERFUL AI UNTIL SAFETY CAN BE EVALUATED',
  src: 'SOURCE · QUINNIPIAC · SEP 2026',
  n: 'n=1,202, ±3.5',
  stop: 'STOP (30%)', slow: 'SLOW (47%)',
  sup: '71% vs 16%',
  supLabel: 'VOTERS PREFER CANDIDATES BACKING STRICTER AI GUARDRAILS',
  supSrc: 'SOURCE · QUINNIPIAC · SEP 2026',
  supN: 'n=1,032, ±3.8',
};
/** figure headers (house panel header strip): FIG. nn · the fact sheet's beat name; supports get the B suffix */
const FIG = { s12: 'FIG. 12 · QUESTIONS', s12b: 'FIG. 12B', s13: 'FIG. 13 · SLOW TSUNAMI', s13b: 'FIG. 13B', s14: 'FIG. 14 · THE PUBLIC', s14b: 'FIG. 14B' };

// ====================================================================== local primitives
/** Greedy word wrap; " · " separators stay glued to the word before them. */
function greedy(s: string, fam: string, size: number, maxW: number, track = 0): string[] {
  const words = s.replace(/ · /g, `${NB}· `).split(' ');
  const out: string[] = [];
  let cur = '';
  for (const w of words) {
    const nx = cur ? `${cur} ${w}` : w;
    if (cur && measure(nx, fam, size, track) > maxW) { out.push(cur); cur = w; } else cur = nx;
  }
  if (cur) out.push(cur);
  return out;
}
/** Balanced wrap: the greedy line count, at the narrowest width that keeps it (no one-word orphans). Memoised — a
 *  pure function of its arguments, so the cache never changes what a frame draws. */
const WRAPS = new Map<string, string[]>();
function wrap(s: string, fam: string, size: number, maxW: number, track = 0): string[] {
  const key = `${s}|${fam}|${size}|${maxW}|${track}`;
  const hit = WRAPS.get(key);
  if (hit) return hit;
  const base = greedy(s, fam, size, maxW, track);
  let out = base;
  if (base.length > 1) {
    let lo = maxW * 0.4, hi = maxW;
    for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; if (greedy(s, fam, size, mid, track).length > base.length) lo = mid; else hi = mid; }
    out = greedy(s, fam, size, hi, track);
  }
  WRAPS.set(key, out);
  return out;
}

/** Wrapped grotesk label lines, each easing up into place from t0 (staggered). Returns the block height. */
function labelBlock(c: CanvasRenderingContext2D, ls: string[], x: number, y: number, size: number, lh: number, col: string, t: number, t0: number, stagger = 0.07) {
  ls.forEach((s, i) => {
    const k = ease.outExpo(clamp((t - t0 - i * stagger) / 0.3));
    if (k <= 0) return;
    text(c, s, x, y + i * lh + (1 - k) * 12, FONT.grot(800), size, col, { track: -size * 0.005, alpha: k });
  });
  return ls.length * lh;
}

/** Coral rubber stamp on paper (double frame, worn with paper-coloured specks). It LANDS on tHit (brief.land: the
 *  contact frame — full size, full ink — is the word's start), with an impact ring after. */
function paperStamp(c: CanvasRenderingContext2D, s: string, x: number, y: number, t: number, tHit: number, size: number, rot = -0.07) {
  const L = land(t, tHit, { dur: 0.16, amp: 0.7, back: 2.2 });
  if (!L.on) return;
  const fam = FONT.grot(900);
  const w = measure(s, fam, size, -size * 0.02) + size * 0.5, h = size * 1.12;
  c.save();
  c.translate(x + w / 2, y); c.rotate(rot * (0.5 + 0.5 * ease.outCubic(L.k))); c.scale(L.s, L.s);
  c.globalAlpha *= L.a;
  c.strokeStyle = CORAL(0.95); c.lineWidth = Math.max(3, size * 0.06);
  c.strokeRect(-w / 2, -h / 2, w, h);
  c.lineWidth = 1.5; c.strokeRect(-w / 2 + size * 0.08, -h / 2 + size * 0.08, w - size * 0.16, h - size * 0.16);
  text(c, s, 0, size * 0.04, fam, size, CORAL(0.95), { align: 'center', base: 'middle', track: -size * 0.02 });
  c.fillStyle = C.paper;
  for (let i = 0; i < 70; i++) c.fillRect(-w / 2 + hash(i, 31) * w, -h / 2 + hash(i, 32) * h, 1 + hash(i, 33) * 3.2, 1 + hash(i, 34) * 2.2);
  c.globalAlpha *= 0.55;
  c.fillRect(-w / 2 + w * 0.1, -h / 2 + h * 0.62, w * 0.42, 2.5); // a dry streak
  c.restore();
  const ru = (t - tHit) / 0.24; // impact ring
  if (ru > 0 && ru < 1) {
    const g = 1 + 0.3 * ease.outCubic(ru);
    c.save(); c.translate(x + w / 2, y); c.rotate(rot);
    c.strokeStyle = CORAL(0.7 * (1 - ru)); c.lineWidth = 2;
    c.strokeRect((-w / 2) * g, (-h / 2) * g, w * g, h * g);
    c.restore();
  }
}

// ---------------------------------------------------------------------- flap guard
// The chrome's split-flap board (chrome.ts drawCountdown → flaps.ts drawBoard, phrase mode: 14 × 2 cells, stagger
// 0.03 s, spin 0.32 s) shows each story's headline from `countdown` in storyboard.json — those states flip on the LINE
// start, not on our cuts, so a fact row can still stand on the board after the panel that sources it has left (at
// the s11→s12 and s13→s14 cuts and into the Q02 build). Until the shared countdown/flaps fix lands, the chapter keeps
// that row's source (and caveat) next to the board for exactly as long as any glyph of it can be on the board. The
// window is read from X.board.countdown, so it shrinks to nothing on its own once the states move to the cuts.
const FLAP = { cols: 14, rows: 2, stag: 0.03, spin: 0.32, x: 1454, right: 1787 };
/** flaps.ts: the delay after a state change before cell (r, k) starts to flip (a waiting cell keeps its old glyph). */
const flapDelay = (r: number, k: number) => (r * FLAP.cols + k) * FLAP.stag * 0.5 + k * FLAP.stag;
/** [state time, last moment a glyph of `rows` can still stand on the board], or null if the board never shows it. */
function flapWindow(X: X, rows: readonly string[]): [number, number] | null {
  const cd = X.board.countdown;
  const i = cd.findIndex(([, r]) => r[0] === rows[0] && r[1] === rows[1]);
  if (i < 0) return null;
  const nx = cd[i + 1];
  if (!nx) return [cd[i]![0], Infinity];
  let last = 0;
  for (let r = 0; r < FLAP.rows; r++) for (let k = 0; k < FLAP.cols; k++) {
    const a = (rows[r] ?? '').toUpperCase()[k] ?? ' ', b = (nx[1][r] ?? '').toUpperCase()[k] ?? ' ';
    if (a !== ' ' && a !== b) last = Math.max(last, flapDelay(r, k));
  }
  return [cd[i]![0], nx[0] + last + 1 / 24];
}
interface FlapFact { rows: readonly [string, string]; src: string; note?: string; tag?: string }
/** The fact rows this group puts on the board (storyboard.json countdown), with what must stand beside them. */
const FLAP11: FlapFact = { rows: ['AI → SI', 'EO 14434'], src: F11.src };
const FLAP13: FlapFact = { rows: ['~40% JOBS', 'EXPOSED'], src: F13.src, tag: F13.tag };
const FLAP14: FlapFact = { rows: ['77%', 'SLOW OR STOP'], src: F14.src, note: F14.n };
/**
 * The flap footnote: `f`'s source line right under the board (and its caveat tag beside the board's second row),
 * from `tHand` — the cut where the panel that sources the row has gone — for as long as the board can still show
 * the row. It is typed on while that panel's own footer is still fully up (it fades over the last DUR.out before
 * tHand), so a source is on screen on every frame. Both the owning chapter (its tail) and the next one (its head)
 * call this with the same arguments: one continuous footnote across the cut.
 */
function flapFootnote(c: CanvasRenderingContext2D, X: X, f: FlapFact, tHand: number) {
  const t = X.t, win = flapWindow(X, f.rows);
  if (!win) return;
  const t0 = Math.max(win[0], tHand - DUR.out - 0.16), t1 = win[1];
  if (t < t0 || t >= t1 + DUR.out || t1 <= tHand) return;
  const a = 1 - ease.inCubic(clamp((t - t1) / DUR.out));
  sourceLine(c, f.src, FLAP.right, 252, { align: 'right', back: true, note: f.note, u: enter(t, t0, 0.16), alpha: a });
  // the caveat, beside the board's second row (the row that says it: EXPOSED)
  if (f.tag) caveatTag(c, f.tag, FLAP.x - 14, 163, { align: 'right', maxW: 214, k: enter(t, t0, DUR.tag * 0.67), alpha: a });
}

/** A sine "slow wave" polyline drawn on from the left to fraction u. */
function waveLine(c: CanvasRenderingContext2D, x0: number, x1: number, y: number, amp: number, len: number, phase: number, u: number, col: string, lw: number) {
  if (u <= 0) return;
  const xe = lerp(x0, x1, clamp(u));
  c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineJoin = 'round'; c.beginPath();
  for (let x = x0; x <= xe; x += 6) {
    const yy = y + amp * Math.sin(((x - x0) / len) * Math.PI * 2 - phase);
    if (x === x0) c.moveTo(x, yy); else c.lineTo(x, yy);
  }
  c.stroke(); c.restore();
}

// ====================================================================== s11 · NEW WORD (B11)
const S11 = { x: 1130, y: RY + 2, w: 680, fieldH: 188, labSize: 27, labLh: 31 };
function s11Layout() {
  const fieldY = PAD + 42;                         // under the blank-form furniture row
  const labY = fieldY + S11.fieldH + 44;
  const h = labY + (F11.labLines.length - 1) * S11.labLh + 24 + FOOT_H;
  return { fieldY, labY, h };
}
function s11Draw(c: CanvasRenderingContext2D, X: X) {
  const t = X.t;
  const w = (k: number) => X.W('Washington', k);
  // The blank form unrolls on the M01 cut, its WHITE HOUSE source typed at once (complete ~80.11): the flap board
  // turns to AI → SI / EO 14434 on the line start (80.103) and its first fact glyph settles ~80.42, so the source
  // already stands while the board says it. The field then waits empty, caret blinking, for "AI:".
  const tIn = X.S('M01')?.t0 ?? X.ch.t0;
  const tAI = w(4).start;                     // "AI:" — the word set in the field
  const tSI = w(5).start;                     // "Super" — the stamp lands
  if (t < tIn) return;
  flapFootnote(c, X, FLAP11, X.ch.t1);        // the board still says EO 14434 after the form has gone (s12 head)
  const L = s11Layout();
  const { x, y, w: cw } = S11;
  panel(c, x, y, cw, L.h, {
    paper: true, k: enter(t, tIn, DUR.panel), alpha: leave(t, X.ch.t1),
    source: F11.src, sourceU: typedBy(t, tIn + 0.3),
    draw: () => {
      const pad = PAD;
      // blank form furniture: empty field boxes and a barcode — no text (the form is blank)
      const fy = y + pad;
      c.strokeStyle = INK(0.55); c.lineWidth = 1;
      for (const [fx, fw] of [[pad, 150], [pad + 162, 96], [pad + 270, 120]] as const) c.strokeRect(x + fx + 0.5, fy + 0.5, fw, 22);
      barcode(c, x + cw - pad - 150, fy, 150, 22, 1411, INK(0.85));
      hair(c, x + pad, fy + 32, x + cw - pad, fy + 32, INK(0.35), 1);
      // the field
      const FY = y + L.fieldY, FH = S11.fieldH;
      c.strokeStyle = INK(0.8); c.lineWidth = 1.5; c.strokeRect(x + pad + 0.5, FY + 0.5, cw - pad * 2 - 1, FH - 1);
      hair(c, x + pad + 18, FY + FH - 30, x + cw - pad - 18, FY + FH - 30, INK(0.22), 1);
      const big = 150, fam = FONT.grot(900), baseY = FY + FH / 2 + big * 0.36;
      let ax = x + pad + 36;
      if (t >= tAI) {
        // AI (set on "AI:") — a short type-set drop
        const ka = ease.outExpo(clamp((t - tAI) / 0.22));
        text(c, F11.head[0]!, ax, baseY - (1 - ka) * 16, fam, big, INK(0.96), { track: -big * 0.02, alpha: ka });
      } else if (Math.floor(t * 2.4) % 2 === 0) {
        // blinking caret in the empty field
        c.fillStyle = INK(0.8); c.fillRect(ax + 4, baseY - big * 0.72, 10, big * 0.74);
      }
      ax += measure(F11.head[0]!, fam, big, -big * 0.02) + 26;
      // the arrow → draws on into "Super", then SI is stamped: contact on the word
      const tArr = tSI - 0.14;
      if (t >= tArr) {
        const arr = 112, aw = measure(F11.head[1]!, fam, arr);
        const ku = ease.outCubic(clamp((t - tArr) / 0.14));
        c.save(); c.beginPath(); c.rect(ax - 4, FY, (aw + 8) * ku, FH); c.clip();
        text(c, F11.head[1]!, ax, baseY - big * 0.06, fam, arr, INK(0.9));
        c.restore();
        ax += aw + 22;
        paperStamp(c, F11.head[2]!, ax, baseY - big * 0.36, t, tSI, big, -0.06);
      }
      // the EO 14434 line arrives with the stamp
      if (t >= tSI) labelBlock(c, F11.labLines, x + pad, y + L.labY, S11.labSize, S11.labLh, INK(0.95), t, tSI + 0.06, 0.06);
    },
  });
}

// ====================================================================== s12 · QUESTIONS (B12)
/** One closed envelope (identical every time): cream body, ink flap lines. */
function envelope(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  c.fillStyle = C.paper; c.fillRect(x, y, w, h);
  c.strokeStyle = INK(0.7); c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(x + 1, y + 1); c.lineTo(x + w / 2, y + h * 0.58); c.lineTo(x + w - 1, y + 1); c.stroke();
  c.beginPath(); c.moveTo(x + 1, y + h - 1); c.lineTo(x + w * 0.38, y + h * 0.46); c.moveTo(x + w - 1, y + h - 1); c.lineTo(x + w * 0.62, y + h * 0.46); c.stroke();
}
/** One plain door outline (identical, unlabeled), standing on `floor`, opaque (envelopes slip in behind it). */
function door(c: CanvasRenderingContext2D, x: number, floor: number, w: number, h: number, k: number) {
  const hh = h * k;
  c.fillStyle = PANEL_BG; c.fillRect(x, floor - hh, w + 1, hh);
  c.strokeStyle = WHITE(0.85); c.lineWidth = 1.5;
  c.strokeRect(x + 0.5, floor - hh + 0.5, w, hh);
  c.strokeStyle = WHITE(0.3); c.lineWidth = 1;
  c.strokeRect(x + 8.5, floor - hh + 10.5, w - 16, hh * 0.42);
  c.strokeRect(x + 8.5, floor - hh + 18.5 + hh * 0.42, w - 16, Math.max(0, hh * 0.58 - 30));
  if (k > 0.9) { c.fillStyle = WHITE(0.9); c.beginPath(); c.arc(x + w - 10, floor - hh * 0.5, 3, 0, Math.PI * 2); c.fill(); }
}
const S12 = { num: 124, labSize: 31, labLh: 36, bandH: 112, supSize: 25, supLh: 30 };
function s12Layout() {
  const ls = wrap(F12.label, FONT.grot(800), S12.labSize, RW - PAD * 2);
  const numBase = RY + HEAD_H + PAD + 92;
  const labY = numBase + 50;
  const tagY = labY + (ls.length - 1) * S12.labLh + 18;
  const bandTop = tagY + 26 + 10;
  const h = bandTop + S12.bandH + 10 - RY + FOOT_H;
  const sls = wrap(F12.sup, FONT.grot(800), S12.supSize, RW - PAD * 2);
  const sy = RY + h + GAP;
  const sh = HEAD_H + PAD + 20 + (sls.length - 1) * S12.supLh + 22 + FOOT_H;
  return { ls, numBase, labY, tagY, bandTop, h, sls, sy, sh };
}
function s12Draw(c: CanvasRenderingContext2D, X: X) {
  const t = X.t;
  const w = (k: number) => X.W('Brussels and the FTC', k);
  const tEU = w(0).start - 0.04;   // "Brussels"
  const tFTC = w(3).start;         // "FTC:" — 14 OCT lands
  const tQ = w(4).start;           // "questions"
  const tLast = w(8).start;        // "Anthropic."
  const a = leave(t, X.ch.t1);
  const L = s12Layout();
  flapFootnote(c, X, FLAP11, X.ch.t0);        // B11's row still on the board after the s11 form left at the cut
  // ---- support: FIG. 12B EU AI OFFICE (right column, bottom), on "Brussels"
  panel(c, RX, L.sy, RW, L.sh, {
    k: enter(t, tEU, DUR.panel), alpha: a, title: FIG.s12b,
    source: F12.supSrc, sourceU: enter(t, tEU + 0.12, DUR.source),
    draw: (p) => { labelBlock(c, L.sls, p.inner.x, p.inner.y + 20, S12.supSize, S12.supLh, WHITE(0.95), t, tEU + 0.08, 0.07); },
  });
  // ---- headline: FIG. 12 · 14 OCT · FTC demands (right column, top), on "FTC"
  const tIn = tFTC - 0.32;
  panel(c, RX, RY, RW, L.h, {
    k: enter(t, tIn, DUR.panel), alpha: a, title: FIG.s12,
    source: F12.src, sourceU: typedBy(t, tFTC),
    draw: (p) => {
      const x = p.inner.x;
      landText(c, F12.head, x, L.numBase, FONT.grot(900), S12.num, CORAL(), t, tFTC, { track: -2.5 });
      labelBlock(c, L.ls, x, L.labY, S12.labSize, S12.labLh, WHITE(0.96), t, tFTC + 0.04, 0.07);
      // the caveat is complete on the frame the number lands
      caveatTag(c, F12.tag, x, L.tagY, { k: enter(t, tFTC - DUR.tag, DUR.tag) });
      // envelopes → doors band: two identical envelopes slide the same distance at the same speed and slip in behind
      // two identical, unlabeled doors at the same moment ("Anthropic.")
      const floor = L.bandTop + S12.bandH - 6;
      hair(c, x, floor + 0.5, p.x + p.w - PAD, floor + 0.5, WHITE(0.4), 1);
      const kd = ease.outExpo(clamp((t - tFTC - 0.2) / 0.4));
      // envelopes narrower than the doors: parked, each is wholly behind its door (no slivers past the jambs)
      const dw = 64, dh = 100, ew = 50, eh = 32;
      const d1 = x + 250, d2 = x + 566;
      const travel = 216;
      if (t >= tQ) {
        const u = ease.inOutCubic(clamp((t - tQ) / Math.max(0.4, tLast + 0.15 - tQ)));
        // once parked they are wholly behind the doors: stop drawing them, so the exit fade can't show them through
        if (u < 1) {
          c.save(); c.globalAlpha *= ease.outExpo(clamp((t - tQ) / 0.2));
          for (const d of [d1, d2]) {
            const stop = d + (dw - ew) / 2;
            envelope(c, lerp(stop - travel, stop, u), floor - 4 - eh, ew, eh);
          }
          c.restore();
        }
      }
      if (kd > 0) for (const d of [d1, d2]) door(c, d, floor, dw, dh, kd);
    },
  });
}

// ====================================================================== s13 · SLOW TSUNAMI (B13)
const S13 = { num: 140, labSize: 27, labLh: 32, sNum: 104, sLabSize: 25, sLabLh: 30, ladW: 112 };
function s13Layout() {
  const ls = wrap(F13.label, FONT.grot(800), S13.labSize, RW - PAD * 2);
  const numBase = RY + HEAD_H + PAD + 102;
  const meterY = numBase + 20;
  const labY = meterY + 10 + 36;
  const tagY = labY + (ls.length - 1) * S13.labLh + 16;
  const h = tagY + 26 + 18 - RY + FOOT_H;
  // FIG. 13B under it, with room for the wave in the gap
  const sy = RY + h + 40;
  const tx = RX + PAD + S13.ladW + 32, tw = RX + RW - PAD - tx;
  const sls = wrap(F13.supLabel, FONT.grot(800), S13.sLabSize, tw);
  const sNumBase = sy + HEAD_H + PAD + 76;
  const sLabY = sNumBase + 40;
  const sh = sLabY + (sls.length - 1) * S13.sLabLh + 20 - sy + FOOT_H;
  return { ls, numBase, meterY, labY, tagY, h, sy, tx, sls, sNumBase, sLabY, sh, waveY: RY + h + 20 };
}
function s13Draw(c: CanvasRenderingContext2D, X: X) {
  const t = X.t;
  const w = (k: number) => X.W('The IMF: forty', k);
  const tForty = w(2).start;                // "forty" — ~40% lands
  // FIG. 13 unrolls on the O01 cut with its IMF source and the caveat complete by ~89.0: the flap board turns to
  // ~40% JOBS / EXPOSED on the line start (88.92) and its ~40% glyphs settle from ~89.24, so source and caveat stand
  // before the board shows the number; ~40% itself still lands in the panel on "forty".
  const tIn = X.S('O01')?.t0 ?? X.ch.t0;
  const tCut = X.S('O02')?.t0 ?? w(8).start; // the cut to the robot shot
  const tSlow = w(9).start;                 // "slow-moving" — −19% lands, the wave crosses
  const tTsu = w(10).start;                 // "tsunami." — the bottom rung fades
  const a = leave(t, X.ch.t1);
  const L = s13Layout();
  flapFootnote(c, X, FLAP13, X.ch.t1);        // the board still says ~40% after FIG. 13 has gone (s14 head)
  // ---- the slow wave, drawn first (behind both panels), in the gap between them, across the whole frame
  if (t >= tSlow) {
    const u = ease.inOutQuad(clamp((t - tSlow) / 1.35));
    c.save(); c.globalAlpha *= a;
    waveLine(c, LX, 1810, L.waveY, 10, 240, (t - tSlow) * 1.6, u, 'rgba(0,0,0,0.6)', 6);
    waveLine(c, LX, 1810, L.waveY, 10, 240, (t - tSlow) * 1.6, u, WHITE(0.92), 3);
    c.restore();
  }
  // ---- headline: FIG. 13 · ~40% (right column)
  panel(c, RX, RY, RW, L.h, {
    k: enter(t, tIn, DUR.panel), alpha: a, title: FIG.s13,
    source: F13.src, sourceU: typedBy(t, tIn + 0.3),
    draw: (p) => {
      const x = p.inner.x, mw = p.inner.w;
      // the hot value hands over to −19% at the O02 cut: a hard switch on the cut (no tween through off-palette tones)
      const nCol = t < tCut ? CORAL() : WHITE(0.96);
      landText(c, F13.head, x, L.numBase, FONT.grot(900), S13.num, nCol, t, tForty, { track: -3 });
      // 40-of-100 meter (a bar, no printed values), drawn on from the landing
      c.fillStyle = WHITE(0.16); c.fillRect(x, L.meterY, mw, 10);
      for (let i = 1; i < 10; i++) hair(c, x + (mw * i) / 10, L.meterY + 13, x + (mw * i) / 10, L.meterY + 18, WHITE(0.4), 1);
      if (t >= tForty) { c.fillStyle = nCol; c.fillRect(x, L.meterY, mw * 0.4 * ease.outCubic(clamp((t - tForty) / 0.4)), 10); }
      labelBlock(c, L.ls, x, L.labY, S13.labSize, S13.labLh, WHITE(0.96), t, tForty + 0.04, 0.07);
      // the caveat is up with the source, before the board or the panel shows the number
      caveatTag(c, F13.tag, x, L.tagY, { k: enter(t, tIn + 0.06, DUR.tag) });
    },
  });
  // ---- support: FIG. 13B the ladder + −19% (right column, under FIG. 13), at the O02 cut
  panel(c, RX, L.sy, RW, L.sh, {
    k: enter(t, tCut, 0.2), alpha: a, title: FIG.s13b,
    source: F13.supSrc, sourceU: typedBy(t, tSlow),
    draw: (p) => {
      // ladder: two rails, rungs; the bottom rung (the entry level) lands coral, then fades on "tsunami"
      const rx0 = p.inner.x + 14, rx1 = p.inner.x + S13.ladW - 14, top = p.body.y + 16, bot = p.body.y + p.body.h - 12;
      const kl = ease.outCubic(clamp((t - tCut) / 0.35));
      hair(c, rx0, bot, rx0, lerp(bot, top, kl), WHITE(0.85), 2);
      hair(c, rx1, bot, rx1, lerp(bot, top, kl), WHITE(0.85), 2);
      const n = 5, step = (bot - top - 16) / n;
      for (let i = 0; i < n; i++) {
        const ry = bot - 12 - i * step;
        if (ry < lerp(bot, top, kl)) continue;
        if (i === 0) {
          const kr = ease.outExpo(clamp((t - tCut - 0.12) / 0.2)), fade = 1 - ease.inOutQuad(clamp((t - tTsu) / 0.55));
          // ghost of the rung that's going
          c.save(); c.setLineDash([4, 5]); hair(c, rx0, ry, rx1, ry, WHITE(0.35 * kr), 1.2); c.restore();
          hair(c, rx0, ry, lerp(rx0, rx1, kr), ry, CORAL(0.98 * fade), 6);
        } else hair(c, rx0, ry, rx1, ry, WHITE(0.85), 2);
      }
      landText(c, F13.sup, L.tx, L.sNumBase, FONT.grot(900), S13.sNum, CORAL(), t, tSlow, { track: -2.5 });
      labelBlock(c, L.sls, L.tx, L.sLabY, S13.sLabSize, S13.sLabLh, WHITE(0.96), t, tSlow + 0.04, 0.07);
    },
  });
}

// ====================================================================== s14 · THE PUBLIC (B14) + the "Eyes open" build
type Pose = 0 | 1 | 2; // 0 none · 1 SLOW (palm forward) · 2 STOP (palm up)
/** 100 identical silhouettes: 30 raise a palm straight up (STOP), 47 raise a palm forward (SLOW), scattered. */
const POSES: Pose[] = (() => {
  const idx = Array.from({ length: 100 }, (_, i) => i).sort((p, q) => hash(p, 77, 3) - hash(q, 77, 3));
  const out: Pose[] = new Array(100).fill(0);
  idx.forEach((i, r) => { out[i] = r < 30 ? 2 : r < 77 ? 1 : 0; });
  return out;
})();

/** An open palm (rounded mitt + thumb), base at (x, y), rotated by ang, scale s. */
function palm(c: CanvasRenderingContext2D, x: number, y: number, s: number, ang: number) {
  c.save();
  c.translate(x, y); c.rotate(ang);
  const w = 10 * s, h = 13 * s, r = 4 * s;
  c.beginPath();
  c.moveTo(-w / 2, 0); c.lineTo(-w / 2, -h + r); c.arcTo(-w / 2, -h, -w / 2 + r, -h, r);
  c.lineTo(w / 2 - r, -h); c.arcTo(w / 2, -h, w / 2, -h + r, r); c.lineTo(w / 2, 0); c.closePath();
  c.fill();
  c.beginPath(); c.ellipse(-w / 2 - 1.2 * s, -4.5 * s, 2.4 * s, 4.4 * s, -0.55, 0, Math.PI * 2); c.fill(); // thumb
  c.restore();
}

/** One paper silhouette (head + shoulders) with an arm raised to `k` (0 down … 1 raised): pose 2 STOP = palm held
 *  high above the head, pose 1 SLOW = palm held out at head height. */
function person(c: CanvasRenderingContext2D, cx: number, by: number, p: Pose, k: number, s = 1) {
  if (p !== 0 && k > 0.01) {
    const sx = cx + 9 * s, sy = by - 11 * s;
    const up = p === 2 ? [cx + 13 * s, by - 40 * s] : [cx + 19 * s, by - 25 * s];
    const hx = lerp(cx + 11 * s, up[0]!, k), hy = lerp(by - 2 * s, up[1]!, k);
    c.save();
    c.strokeStyle = CORAL(); c.fillStyle = CORAL(); c.lineWidth = 4.6 * s; c.lineCap = 'round';
    c.beginPath(); c.moveTo(sx, sy); c.lineTo(hx, hy); c.stroke();
    palm(c, hx, hy + 1 * s, s * clamp(k, 0, 1.2), p === 2 ? 0.08 : 0.3);
    c.restore();
  }
  c.fillStyle = rgbaHex(C.paper, 0.92);
  c.beginPath(); c.ellipse(cx, by, 13.5 * s, 15 * s, 0, Math.PI, 0); c.closePath(); c.fill();
  c.beginPath(); c.arc(cx, by - 24 * s, 7 * s, 0, Math.PI * 2); c.fill();
}

const S14 = {
  num: 150, labSize: 29, labLh: 34, sNum: 80, sLabSize: 25, sLabLh: 30,
  // the crowd grid (lower-left): 20 × 5 silhouettes at scale ps
  cx0: LX, cy0: 600, cols: 20, rows: 5, colW: 37, rowH: 52, ps: 0.9, top: 44, legend: 40,
};
function s14Layout() {
  const ls = wrap(F14.label, FONT.grot(800), S14.labSize, RW - PAD * 2);
  const numBase = RY + HEAD_H + PAD + 108;
  const labY = numBase + 48;
  const h = labY + (ls.length - 1) * S14.labLh + 22 - RY + FOOT_H;
  const sy = RY + h + GAP;
  const sls = wrap(F14.supLabel, FONT.grot(800), S14.sLabSize, RW - PAD * 2);
  const sNumBase = sy + HEAD_H + PAD + 60;
  const sLabY = sNumBase + 40;
  const sh = sLabY + (sls.length - 1) * S14.sLabLh + 20 - sy + FOOT_H;
  const gw = S14.cols * S14.colW + PAD * 2, gh = S14.top + S14.rows * S14.rowH + S14.legend;
  return { ls, numBase, labY, h, sy, sls, sNumBase, sLabY, sh, gw, gh };
}
function s14Facts(c: CanvasRenderingContext2D, X: X, tOut: number) {
  const t = X.t;
  const w = (k: number) => X.W('Seventy-seven percent', k);
  const t77 = w(0).start;          // "Seventy-seven" — 77% lands
  const tAm = w(3).start - 0.04;   // "Americans:" — the crowd
  const tSlow = w(4).start;        // "slow"
  const tStop = w(6).start;        // "stop"
  const tSafe = w(11).start;       // "safety-checked." — 71% vs 16% lands
  if (t > tOut) return;
  const a = leave(t, tOut);
  const L = s14Layout();
  // ---- headline: FIG. 14 · 77% (right column)
  panel(c, RX, RY, RW, L.h, {
    k: enter(t, Math.max(X.ch.t0, t77 - 0.34), DUR.panel), alpha: a, title: FIG.s14,
    source: F14.src, note: F14.n, sourceU: typedBy(t, t77),
    draw: (p) => {
      landText(c, F14.head, p.inner.x, L.numBase, FONT.grot(900), S14.num, CORAL(), t, t77, { track: -3 });
      labelBlock(c, L.ls, p.inner.x, L.labY, S14.labSize, S14.labLh, WHITE(0.96), t, t77 + 0.08, 0.07);
    },
  });
  // ---- support: FIG. 14B 71% vs 16% (right column, under the headline), on "safety-checked"
  panel(c, RX, L.sy, RW, L.sh, {
    k: enter(t, tSafe - 0.32, DUR.panel), alpha: a, title: FIG.s14b,
    source: F14.supSrc, note: F14.supN, sourceU: typedBy(t, tSafe),
    draw: (p) => {
      landText(c, F14.sup, p.inner.x, L.sNumBase, FONT.grot(900), S14.sNum, WHITE(0.97), t, tSafe, { track: -1.5 });
      labelBlock(c, L.sls, p.inner.x, L.sLabY, S14.sLabSize, S14.sLabLh, WHITE(0.92), t, tSafe + 0.06, 0.07);
    },
  });
  // ---- the crowd: 100 identical paper silhouettes (lower-left)
  const { cx0, cy0, cols, rows, colW, rowH, ps, top } = S14;
  panel(c, cx0, cy0, L.gw, L.gh, {
    k: enter(t, tAm - 0.1, DUR.panel), alpha: a,
    draw: () => {
      const gx = cx0 + PAD + colW / 2;
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
        const i = r * cols + q, p = POSES[i]!;
        const by = cy0 + top + r * rowH + 30;
        const kIn = ease.outExpo(clamp((t - tAm - 0.04 - (r * 0.035 + hash(i, 9) * 0.12)) / 0.3));
        if (kIn <= 0) continue;
        const tr = p === 2 ? tStop : p === 1 ? tSlow : Infinity;
        const kr = ease.outBack(clamp((t - tr - hash(i, 11) * 0.22) / 0.2), 1.6);
        c.save(); c.globalAlpha *= kIn;
        person(c, gx + q * colW, by + (1 - kIn) * 10, p, p ? kr : 0, ps);
        c.restore();
      }
      // legend in the label's own words and order: palm held high = STOP (30%), palm held out = SLOW (47%)
      const ly = cy0 + top + rows * rowH + 18;
      let lx = cx0 + PAD + 12;
      const kS = ease.outExpo(clamp((t - tStop) / 0.25)), kW = ease.outExpo(clamp((t - tSlow) / 0.25));
      c.save(); c.globalAlpha *= kS;
      person(c, lx, ly + 6, 2, 1, 0.62); lx += 22;
      lx += text(c, F14.stop, lx, ly + 4, FONT.mono(600), 14, WHITE(0.9), { track: 1.4 }) + 44;
      c.restore();
      c.save(); c.globalAlpha *= kW;
      person(c, lx, ly + 6, 1, 1, 0.62); lx += 24;
      text(c, F14.slow, lx, ly + 4, FONT.mono(600), 14, WHITE(0.9), { track: 1.4 });
      c.restore();
    },
  });
}

/** The REAL eye in the Q02.0 macro (source 0..1 box): as the lid opens, from "Eyes" to the cut. Frame-checked on
 *  p_Q02_0 (conform start 2.1 s): closed lash line ≈ y 0.62–0.80, open iris ≈ x 0.40–0.66, y 0.44–0.75. */
const EYE_CLOSED: [number, number, number, number] = [0.36, 0.6, 0.72, 0.8];
const EYE_OPEN: [number, number, number, number] = [0.4, 0.44, 0.66, 0.75];
/** The real eye's box in frame px at the Q02.0 → Q02.1 cut: EYE_OPEN under Q02.0's camera at its end (u = 1). The
 *  CV box holds exactly this rect across the cut and the line-art eye is built inside it — same place, same scale,
 *  same state (open) — so the cut reads as the detector keeping the eye while the photo turns to light. */
function eyeAtCut(X: X) {
  const s = X.S('Q02.0'), m = s?.cam ?? {};
  let w = 1920, h = 1080;
  try { if (s?.clip) ({ w, h } = X.media.clip(s.clip)); } catch { /* keep 16:9 */ }
  return boxToFrame(EYE_OPEN, w, h, { zoom: m.z?.[1] ?? 1.055, x: m.x?.[1] ?? 0, y: m.y?.[1] ?? 0 });
}
/** The build into chorus 2: a CV box locks onto the real eye opening (Q02.0); at the cut the box stays put and a
 *  line-art eye fills it (Q02.1), already open; the pupil snaps on "open.", the eye widens on the second "Eyes"; beat
 *  rings and a 4-beat riser (below the box). No facts. */
function s14Eyes(c: CanvasRenderingContext2D, X: X, tQ2: number) {
  const t = X.t;
  if (t < tQ2) return;
  const e = (k: number) => X.W('Eyes open. Eyes', k);
  const tCut = X.S('Q02.1')?.t0 ?? e(1).start;
  const a = leave(t, X.ch.t1 + 0.06, 0.1);
  const B = eyeAtCut(X);
  const cx = B.x + B.w / 2, cy = B.y + B.h / 2;
  c.save();
  c.globalAlpha *= a;
  if (t < tCut) {
    // ---- Q02.0: the detection box on the real eye, from "Eyes" (the lid starts to lift) to the cut
    const t0 = e(0).start;
    if (t >= t0 && X.base?.kind === 'clip') {
      const k = ease.inOutQuad(clamp((t - t0) / Math.max(0.1, tCut - t0)));
      const bx = EYE_CLOSED.map((v, i) => lerp(v, EYE_OPEN[i]!, k)) as [number, number, number, number];
      cvBox(c, X.px(bx), 'EYE', t, t0, { hot: true, tab: 'bottom' });
    }
  } else {
    // ---- Q02.1: the line-art eye, inscribed in the box the real eye left (the match cut)
    const o2 = ease.outExpo(clamp((t - e(2).start) / 0.3));          // wider on the second "Eyes"
    const pu = ease.outBack(clamp((t - e(1).start + 0.03) / 0.2), 2.4); // pupil snaps on "open."
    const r = (B.h / 2) * 0.94 * (1 + 0.06 * o2);                      // iris: the box's height, as the real one
    const hw = B.w * 0.64 * (1 + 0.08 * o2), hh = (B.h / 2) * 0.84 * (1 + 0.14 * o2);
    // beat rings from the iris, one per beat since the cut (kept inside the graphics zone)
    const b0 = Math.ceil(X.beat(tCut) - 0.01), bn = X.beat(t);
    for (let b = b0; b <= bn; b++) {
      const tb = X.tBeat(b), u = (t - tb) / 0.9;
      if (u < 0 || u > 1) continue;
      c.strokeStyle = WHITE(0.45 * (1 - u)); c.lineWidth = 1.5;
      c.beginPath(); c.arc(cx, cy, r + 30 + 110 * ease.outCubic(u), 0, Math.PI * 2); c.stroke();
    }
    const almond = () => {
      c.beginPath(); c.moveTo(cx - hw, cy);
      c.quadraticCurveTo(cx, cy - 2 * hh, cx + hw, cy);
      c.quadraticCurveTo(cx, cy + 2 * hh, cx - hw, cy);
      c.closePath();
    };
    almond();
    c.fillStyle = 'rgba(12,13,16,0.78)'; c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 8; c.stroke();
    c.strokeStyle = WHITE(0.95); c.lineWidth = 3; c.stroke();
    c.save(); almond(); c.clip();
    // line-art iris (white, stroke only) + pupil
    c.strokeStyle = WHITE(0.9); c.lineWidth = 4;
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 3;
    c.beginPath(); c.arc(cx, cy, r * 0.36 * (0.55 + 0.45 * pu) * (1 + 0.1 * X.hit('kick', t, 0.08)), 0, Math.PI * 2); c.stroke();
    c.restore();
    // the CV box holds across the cut on the same rect, then hands over to the drawn eye
    const kb = 1 - ease.inCubic(clamp((t - tCut - 0.12) / 0.3));
    if (kb > 0) cvBox(c, B, 'EYE', t, e(0).start, { hot: true, tab: 'bottom', alpha: kb });
  }
  // riser: 4 beat cells under the eye (below the box's lowest edge), filling on the beats into the chorus
  const b0 = Math.ceil(X.beat(tQ2) - 0.01), bn = X.beat(t);
  const nb = 4, bw = 44, gap = 10, rx = cx - (nb * bw + (nb - 1) * gap) / 2, ry = 976;
  for (let i = 0; i < nb; i++) {
    const on = bn >= b0 + i;
    c.fillStyle = on ? (i === nb - 1 ? CORAL() : WHITE(0.9)) : WHITE(0.18);
    c.fillRect(rx + i * (bw + gap), ry, bw, 8);
  }
  c.restore();
}

function s14Draw(c: CanvasRenderingContext2D, X: X) {
  const tQ2 = X.S('Q02.0')?.t0 ?? X.L('Eyes open. Eyes').start;
  flapFootnote(c, X, FLAP13, X.ch.t0);        // B13's row still on the board after FIG. 13 left at the cut
  flapFootnote(c, X, FLAP14, tQ2);            // B14's row still on the board into the Q02 build (facts cleared)
  s14Facts(c, X, tQ2);
  s14Eyes(c, X, tQ2);
}

// ====================================================================== post
const shakeOf = (t: number, amp: number, seed: number): [number, number] =>
  [(hash(fi(t), seed, 1) - 0.5) * 2 * amp, (hash(fi(t), seed, 2) - 0.5) * 2 * amp];

export const chapters: Record<string, Chapter> = {
  s11: {
    draw: s11Draw,
    post(X: X, o: PostOverrides) {
      const w = (k: number) => X.W('Washington', k);
      const k = Math.max(pulse(X.t, w(5).start, 0.07), 0.8 * pulse(X.t, w(9).start, 0.07));
      if (k > 0.01) { o.zoom = 1 + 0.018 * k; o.shake = shakeOf(X.t, 3 * k, 41); }
      return o;
    },
  },
  s12: { draw: s12Draw },
  s13: { draw: s13Draw },
  s14: {
    draw: s14Draw,
    post(X: X, o: PostOverrides) {
      const tQ2 = X.S('Q02.0')?.t0 ?? X.L('Eyes open. Eyes').start;
      if (X.t >= tQ2) {
        const u = X.u(tQ2, X.ch.t1);
        o.zoom = 1 + 0.03 * ease.inQuad(u) + 0.01 * X.hit('kick', X.t, 0.08);
        const s = 2.5 * u * X.hit('kick', X.t, 0.06);
        if (s > 0.05) o.shake = shakeOf(X.t, s, 43);
      } else {
        const k = pulse(X.t, X.W('Seventy-seven percent', 0).start, 0.08);
        if (k > 0.01) o.zoom = 1 + 0.012 * k;
      }
      return o;
    },
  },
};

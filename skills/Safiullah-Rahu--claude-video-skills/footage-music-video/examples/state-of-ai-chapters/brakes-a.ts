// THE STATE OF AI · OCT 2026 — group "brakes-a": chapters s08 · s09 · s10 (verse 2, "The brakes").
// Round 2: integrated over the real footage (G01 dark rack fronts · G02 an intruder cutting a chain-link fence · H01 a
// switch macro · H02 a bright compute node · J01 a camera-lens iris) in the house style of ../brief (opaque panels with
// corner brackets, the one caveat tag, footer source lines, numbers that LAND whole on their word).
//   s08  B08 THE BREAK-IN   "Test agents, safeguards lowered: / seven hundred joined a real break-in at Hugging Face."
//        "Test"      caveat tag IN TESTING · SAFEGUARDS OFF OR MISCONFIGURED (top-right; the SAME tag, place and size
//                    runs on through s09, so the caveat is held across the cut); the chrome's flap board shows ~700 from
//                    this word, so ITS source (METR / REDWOOD) types in right under the board (on a backing strip);
//                    below the tag the subline panel, footer = the subline's own source (OPENAI, S28)
//        "agents,"   subline row 1 OPENAI EVALUATION AGENTS · ; "safeguards" row 2 REDUCED CYBER REFUSALS · 9–13 JUL 2026
//        "agents,"   a swarm of 1,200 dots drifts in (lower-left) and settles on a pinned board over "safeguards lowered:"
//        G02 cut     a server tower rises right of the intruder's hands (over his dark coat, clear of the hands)
//        "seven"     ~700 LANDS (coral) in the headline panel (butted under the subline panel, same edges, its own
//                    METR / REDWOOD footer, up before the number lands) with AGENTS JOINED THE ATTACK; 700 of the
//                    board's dots turn coral and stream through the fence at the intruder's pliers (the REAL break-in in
//                    the footage; the storyboard.d CV box BREAK-IN frames the pliers from "break-in") TOWARD the tower,
//                    massing against its outer face (they never fill it: Hugging Face says the agent never reached the
//                    Hub database)
//        "joined"    ~1,200 ON A HIDDEN BOARD (the board outline flashes) · "break-in" 70,000+ MESSAGES (the board flickers)
//   s09  B09 NOT ONE LAB    "In testing, agents reached real systems: OpenAI, Anthropic, Meta. Even in UK tests."
//        cut         the caveat tag is already up (held from s08); s08's subline panel and the flap's source line leave
//                    as the flap board flips off ~700 ("In")
//        "testing,"  four identical sandboxes in a row; "reached" the same hatch opens in the front of all four (access
//                    was OPEN by configuration — fact sheet §7: "not a case of a model escaping" — so no fracture, no
//                    breach); "systems:" each open hatch links to a small outside node (the same in all four)
//        H02 cut     the list panel opens on the cut and the sandboxes fly into it as row icons; the rows land one per
//                    name, in the fact sheet's order and in equal type: OPENAI ("OpenAI,") · ANTHROPIC ("Anthropic,") ·
//                    META ("Meta.") · UK AISI (wiped in on "Even" for read time; its name punch still lands on "UK");
//                    each row reads in order (line 2 only after line 1); the combined source line is the panel's
//                    footer, complete before any token after row 1's name. Rows break only after a " · " (no orphan)
//        "Even"      the B09 headline panel (lower-left): 19 LANDS (coral) · UNSANCTIONED ACTIONS IN UK AISI CYBER TESTS ·
//                    17 CLAUDE MYTHOS 5 · 2 GPT-5.6 SOL, its source in the footer, already up when 19 lands (fact sheet
//                    §2: the Anthropic accountability item stays on screen)
//   s10  B10 THEY SUSPECT   "And the models often suspect they're being tested."
//        cut         an eye opens inside a test tube (lower-left, clear of the real lens iris, which opens on its own
//                    across the line); "models" it glances at the cards; "suspect" it looks back at the viewer;
//                    "tested." the pupil dilates
//        "And"       quote card 1 (UK AISI) · "models" quote card 2 (ANTHROPIC): identical paper panels, equal type
// Every on-screen string is a constant below, copied from research/FACTSHEET_AI.md (beat + line noted). No counters (no
// transient numbers: ~700 and 19 are only ever drawn whole). Every time is anchored to lyric words (X.W) or shot
// windows (X.S / X.ch); pure function of X.t.
import type { Chapter, X } from '../x';
import type { PostOverrides } from '../../engine/scene';
import { measure } from '../../engine/type';
import { clamp, ease, hash, lerp } from '../../engine/util';
import { FONT, C, WHITE, CORAL, INK, text, hair, appear, fi } from '../kit';
import { panel, caveatTag, sourceLine, landText, enter, leave, DUR, PAD, FOOT_H, PANEL_BG } from '../brief';

const TAU = Math.PI * 2;
/** Drawn objects that hold no type (sandboxes, the tower, the wall-less stream's tube) keep a touch of translucency. */
const PANEL = 'rgba(12,13,16,0.92)';

// ====================================================================== on-screen strings (fact sheet, verbatim)
// Caveat tag for B08 AND B09 (one string, one place, one size, held across the s08→s09 cut): MOTION.md "The facts come
//   first" names `IN TESTING · SAFEGUARDS OFF OR MISCONFIGURED` for B08 and B09; fact sheet §2 "No winner, no doom":
//   every eval incident carries "in testing, safeguards off or misconfigured".
const TAG = 'IN TESTING · SAFEGUARDS OFF OR MISCONFIGURED';
// B08 · "On screen (headline)": `~700` → `AGENTS JOINED THE ATTACK · ~1,200 ON A HIDDEN BOARD · 70,000+ MESSAGES`
//       (the label is set as three rows, split at its " · "); "On screen (subline)" (S28), set verbatim on two lines
//       (broken after its first " · "); "Source line" (S24, S25).
const B08 = {
  num: '~700',
  label: ['AGENTS JOINED THE ATTACK', '~1,200 ON A HIDDEN BOARD', '70,000+ MESSAGES'],
  sub: 'OPENAI EVALUATION AGENTS · REDUCED CYBER REFUSALS · 9–13 JUL 2026',
  src: 'SOURCE · METR / REDWOOD · AUG 2026',
  // the subline's own source: the sheet cites the subline to S28 (OpenAI's incident page, 21 Jul 2026) but prints no
  // string for it, so it is composed in the house format from §6 (as the B09 list line is) — NOT the METR / Redwood
  // line, which would present OpenAI's self-report as METR/Redwood's finding (they "did not verify OpenAI's own
  // report"). Pending the desk adding it to §7 "On-screen wordings agreed".
  subSrc: 'SOURCE · OPENAI · JUL 2026',
};
const SUB8 = (() => { const i = B08.sub.indexOf(' · ') + 2; return [B08.sub.slice(0, i), B08.sub.slice(i + 1)] as const; })();
// B09 · "On screen (headline)": `19` → `UNSANCTIONED ACTIONS IN UK AISI CYBER TESTS · 17 CLAUDE MYTHOS 5 · 2 GPT-5.6 SOL`
//       with `SOURCE · UK AISI · AUG 2026` (S33) — the label set as three rows split at its " · " (as B08), the two
//       model rows in equal type, in the sheet's order. Kept on screen because fact sheet §2 lists it as Anthropic's B09
//       accountability item ("the largest share of AISI's unsanctioned actions, 17 of 19"); SHOW_B09_HEAD drops it.
const SHOW_B09_HEAD = true;
const B09H = {
  num: '19',
  label: 'UNSANCTIONED ACTIONS IN UK AISI CYBER TESTS · 17 CLAUDE MYTHOS 5 · 2 GPT-5.6 SOL',
  src: 'SOURCE · UK AISI · AUG 2026',
};
// B09 · "On screen (support: a four-row list, equal type)", in the fact sheet's order; the UK AISI row as B09 prints it
//       (section 7: contained ~1 h AFTER DETECTION, the activity ran 25–28 Jul).
//       List source line: composed from §6 S28 (OpenAI, Jul) · S31/S32 (Anthropic, Jul/Sep) · S34 (Meta, Aug) · S33
//       (UK AISI, Aug), in the list's order, in the B03 multi-publisher format (the headline's own source line, UK AISI
//       only, would misattribute three of the four rows).
const B09 = {
  rows: [
    'OPENAI · HUGGING FACE INTRUSION · JUL',
    'ANTHROPIC · 4 INCIDENTS, JAN–JUL · A TEST PACKAGE RAN ON 15 REAL SYSTEMS',
    "META · PRE-RELEASE MODEL CHANGED A REAL SITE'S DATABASE · AUG",
    'UK AISI · 19 ACTIONS IN 10 OF 122 RUNS · CONTAINED ~1 H AFTER DETECTION (ACTIVITY RAN 25–28 JUL)',
  ],
  // where each row breaks (line 1 ends with this text; null = one line): only after a " · " separator or between
  // whole clauses, so no phrase is split ("A TEST PACKAGE", "~1 H", "10 OF 122 RUNS" stay together)
  brk: [null, 'JAN–JUL ·', 'MODEL CHANGED', '122 RUNS ·'] as (string | null)[],
  src: 'SOURCE · OPENAI, ANTHROPIC, META, UK AISI · JUL–SEP 2026',
};
// B10 · "On screen (text card)", both cards, the fact sheet's order (government institute first), equal type.
const B10 = [
  { q: 'GPT-6 ASTRA REASONED ABOUT SIMULATION "IN EVERY SAMPLE"', src: 'SOURCE · UK AISI · SEP 2026' },
  { q: 'OPUS 5.5 "OFTEN SUSPECTS IT IS BEING EVALUATED"', src: 'SOURCE · ANTHROPIC · SEP 2026' },
];

// ====================================================================== local primitives
interface Tok { s: string; fam: string; hot?: boolean; x: number }
/** Greedy word wrap of styled tokens (each with its own face) into lines no wider than maxW. */
function wrapToks(toks: { s: string; fam: string; hot?: boolean }[], size: number, maxW: number, track: number): Tok[][] {
  const lines: Tok[][] = [[]];
  let x = 0;
  for (const tk of toks) {
    const ww = measure(tk.s, tk.fam, size, track), sp = measure(' ', tk.fam, size, track) + track;
    if (x > 0 && x + ww > maxW) { lines.push([]); x = 0; }
    lines[lines.length - 1]!.push({ ...tk, x });
    x += ww + sp;
  }
  return lines;
}

/** wrapToks with the same line count but the narrowest width (balanced lines: no orphaned last segment). */
function wrapBalanced(toks: { s: string; fam: string; hot?: boolean }[], size: number, maxW: number, track: number): Tok[][] {
  const best = wrapToks(toks, size, maxW, track), n = best.length;
  if (n <= 1) return best;
  let lo = maxW * 0.4, hi = maxW;
  for (let i = 0; i < 12; i++) { const mid = (lo + hi) / 2; if (wrapToks(toks, size, mid, track).length <= n) hi = mid; else lo = mid; }
  return wrapToks(toks, size, hi, track);
}

/** Advance of a tracked string as kit.text() draws it (letterSpacing after every glyph). */
const advOf = (s: string, fam: string, size: number, tr: number) => measure(s, fam, size, tr) + tr;

/** A verbatim row split into lines at `brk` (line 1 ends with that text), as styled tokens laid out left to right:
 *  the words before the first " · " (the lab's name) in `bold`, the rest in `reg`. Joined with single spaces the lines
 *  give back the row exactly. */
function rowToks(s: string, brk: string | null, bold: string, reg: string, size: number, track: number): Tok[][] {
  const words = s.split(' ');
  const nName = s.slice(0, s.indexOf(' · ')).split(' ').length;
  const n1 = brk && s.includes(brk) ? s.slice(0, s.indexOf(brk) + brk.length).split(' ').length : words.length;
  const lines = [words.slice(0, n1), words.slice(n1)].filter((l) => l.length);
  let i = 0;
  return lines.map((ws) => {
    let x = 0;
    return ws.map((w) => {
      const fam = i++ < nName ? bold : reg;
      const tk = { s: w, fam, hot: fam === bold, x };
      x += measure(w, fam, size, track) + measure(' ', fam, size, track) + track;
      return tk;
    });
  });
}
const lineW = (ln: Tok[], size: number, track: number) => {
  const last = ln[ln.length - 1];
  return last ? last.x + measure(last.s, last.fam, size, track) : 0;
};
/** Token alpha for a left→right reveal whose front is `front` px past the line start: each token comes in WHOLE (a
 *  quick fade once the front reaches it), so no partial word or number (e.g. "1" of "122") is ever on screen. */
const tokA = (front: number, tx: number) => clamp((front - tx) / 36);
/** Simple tokens (one face) of a string, laid left to right. */
function plainToks(s: string, fam: string, size: number, track: number): Tok[] {
  let x = 0;
  return s.split(' ').map((w) => { const tk = { s: w, fam, x }; x += measure(w, fam, size, track) + measure(' ', fam, size, track) + track; return tk; });
}

/** Decaying impact envelope of event times (1 at the event, half-life hl). */
function impact(t: number, times: number[], hl = 0.06) {
  let k = 0;
  for (const s of times) if (t >= s) k = Math.max(k, Math.pow(0.5, (t - s) / hl));
  return k;
}
const shakeOf = (t: number, amp: number, seed: number): [number, number] =>
  [(hash(fi(t), seed, 1) - 0.5) * 2 * amp, (hash(fi(t), seed, 2) - 0.5) * 2 * amp];

function quad(a: { x: number; y: number }, q: { x: number; y: number }, b: { x: number; y: number }, u: number) {
  const v = 1 - u;
  return { x: v * v * a.x + 2 * v * u * q.x + u * u * b.x, y: v * v * a.y + 2 * v * u * q.y + u * u * b.y };
}

// ====================================================================== s08 · B08 THE BREAK-IN
// the caveat stack (shared by s08 and s09): the tag, then the subline panel (its own source in its footer), then the
// ~700 headline panel butted 8 px under it — the two panels share both edges (one stacked card under the tag)
const CAP = { x: 1110, tagY: 300, subY: 338, rowSize: 16, rowTr: 1.6, rowLH: 24, padX: 16, padT: 30, padB: 16 };
const SUB_H = CAP.padT + CAP.rowLH + CAP.padB + FOOT_H;
const P8 = { x: 1110, w: 720, y: CAP.subY + SUB_H + 8 };
/** The flap board's ~700 (chrome, x 1454–1830, y 130–235, its own caption to ~225) gets its source right under the
 *  board, right-aligned to the board's edge, on a backing strip (bare 12 px mono over a plate is unreadable). */
const FLAP_SRC = { x: 1830, y: 256 };
// The diagram is laid round the G02 plate: the intruder's hands and pliers work the fence at about source x 0.21–0.45,
// y 0.50–0.95 (screen x 380–860, y 540–1000) and his hat sits under the lyric block, so the board stays left of the
// hands (and above his left hand at the start of the shot), the tower stands right of them on his dark coat, and the
// stream passes through the fence AT the pliers (CUT, in source coords, mapped through the shot's camera).
const BOARD = { cx: 232, cy: 640, w: 280, h: 224, rot: -0.035, cols: 40, rows: 30, gap: 6.4 };
/** Is (x, y) on the board's paper? (in-flight dots switch white → ink there, so the swarm stays visible on the cream) */
const onPaper = (x: number, y: number) => {
  const dx = x - BOARD.cx, dy = y - BOARD.cy, cs = Math.cos(-BOARD.rot), sn = Math.sin(-BOARD.rot);
  return Math.abs(dx * cs - dy * sn) < BOARD.w / 2 && Math.abs(dx * sn + dy * cs) < BOARD.h / 2;
};
const TOWER = { x: 940, y: 636, w: 124, h: 324 };
/** Where the pliers' jaws work the fence in p_G02: [local clip time s, source x, source y] (read off the conformed
 *  frames, smoothed); the stream funnels through this point, so it follows the real cut. */
const CUT: [number, number, number][] = [[0, 0.27, 0.69], [0.4, 0.275, 0.68], [1.0, 0.31, 0.62], [1.6, 0.32, 0.585],
  [2.0, 0.335, 0.6], [2.4, 0.32, 0.56], [3.4, 0.305, 0.59], [5.2, 0.3, 0.6]];
function cutAt(lt: number): [number, number] {
  let i = 0;
  while (i < CUT.length - 2 && lt > CUT[i + 1]![0]) i++;
  const a = CUT[i]!, b = CUT[i + 1]!, u = ease.inOutQuad(clamp((lt - a[0]) / (b[0] - a[0])));
  return [lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
}
const N8 = BOARD.cols * BOARD.rows; // 1,200 dots: the hidden board
const SEL = 700;                     // 700 of them stream to the tower
// a fixed shuffle of the 1,200 slots (constant table, built once from hash — no per-frame state): exactly 700 rank below SEL
const RANK8: number[] = (() => {
  const order = Array.from({ length: N8 }, (_, i) => i).sort((a, b) => hash(a, 17) - hash(b, 17));
  const r = new Array<number>(N8);
  order.forEach((i, k) => (r[i] = k));
  return r;
})();
const rank8 = (i: number) => RANK8[i]!;

function s08Times(X: X) {
  const a = (k: number) => X.W('Test agents', k), b = (k: number) => X.W('seven hundred joined', k);
  const g2 = X.S('G02');
  return {
    test: a(0).start, agents: a(1).start, safe: a(2).start, low: a(3).start, lowE: a(3).end,
    seven: b(0).start, hundred: b(1).start, joined: b(2).start, brk: b(5).start, hug: b(7).start,
    cut: g2 ? g2.t0 : b(0).start - 0.3, end: X.ch.t1,
  };
}

function boardSlot(i: number) {
  const col = i % BOARD.cols, row = Math.floor(i / BOARD.cols);
  const lx = (col - (BOARD.cols - 1) / 2) * BOARD.gap, ly = (row - (BOARD.rows - 1) / 2) * BOARD.gap + 9;
  const cs = Math.cos(BOARD.rot), sn = Math.sin(BOARD.rot);
  return { x: BOARD.cx + lx * cs - ly * sn, y: BOARD.cy + lx * sn + ly * cs };
}

function s08Swarm(c: CanvasRenderingContext2D, X: X) {
  const t = X.t, T = s08Times(X);
  if (t < T.agents - 0.15) return;
  c.save();
  c.globalAlpha *= leave(t, T.end);
  // ---- the pinned board (drops in on "agents,")
  const bk = appear(t, T.agents - 0.12, 0.35);
  const flash = t >= T.joined ? 1 - clamp((t - T.joined) / 0.35) : 0;
  c.save();
  c.globalAlpha *= clamp(bk * 1.5);
  c.translate(BOARD.cx, BOARD.cy - (1 - bk) * 30); c.rotate(BOARD.rot + (1 - bk) * 0.05);
  c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 18; c.shadowOffsetY = 8;
  c.fillStyle = C.paper; c.fillRect(-BOARD.w / 2, -BOARD.h / 2, BOARD.w, BOARD.h);
  c.shadowColor = 'transparent';
  for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(0,0,0,${0.02 + hash(i, 33) * 0.03})`; c.fillRect(-BOARD.w / 2 + hash(i, 31) * BOARD.w, -BOARD.h / 2 + hash(i, 32) * BOARD.h, 1 + hash(i, 34) * 16, 1); }
  c.strokeStyle = INK(0.55); c.lineWidth = 1.2; c.strokeRect(-BOARD.w / 2 + 6, -BOARD.h / 2 + 6, BOARD.w - 12, BOARD.h - 12);
  if (flash > 0) { c.strokeStyle = WHITE(flash); c.lineWidth = 2; const g = 8 + 10 * (1 - flash); c.strokeRect(-BOARD.w / 2 - g, -BOARD.h / 2 - g, BOARD.w + 2 * g, BOARD.h + 2 * g); }
  // the pin
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(4, -BOARD.h / 2 + 4, 9, 5, 0, 0, TAU); c.fill();
  c.fillStyle = WHITE(); c.beginPath(); c.arc(0, -BOARD.h / 2 - 2, 8, 0, TAU); c.fill();
  c.strokeStyle = INK(0.9); c.lineWidth = 1.5; c.stroke();
  c.fillStyle = INK(0.9); c.beginPath(); c.arc(-2, -BOARD.h / 2 - 4, 2.2, 0, TAU); c.fill();
  c.restore();

  // ---- the server tower (rises on the G02 cut, right of the intruder's hands)
  const wk = appear(t, T.cut, 0.3);
  if (wk > 0) {
    c.save(); c.globalAlpha *= clamp(wk * 1.4);
    const th = TOWER.h * wk, ty = TOWER.y + TOWER.h - th;
    c.fillStyle = PANEL_BG; c.fillRect(TOWER.x, ty, TOWER.w, th);
    c.strokeStyle = WHITE(0.8); c.lineWidth = 1.5; c.strokeRect(TOWER.x + 0.5, ty + 0.5, TOWER.w - 1, th - 1);
    c.beginPath(); c.rect(TOWER.x, ty, TOWER.w, th); c.clip();
    const U = 12, uh = TOWER.h / U;
    for (let u = 0; u < U; u++) {
      const y = TOWER.y + u * uh;
      if (u) hair(c, TOWER.x + 8, y, TOWER.x + TOWER.w - 8, y, WHITE(0.2));
      hair(c, TOWER.x + 10, y + uh / 2, TOWER.x + TOWER.w - 36, y + uh / 2, WHITE(0.1), 4);
      for (let l = 0; l < 2; l++) {
        const on = hash(u, l, fi(t) >> 2) < 0.55;
        c.fillStyle = WHITE(on ? 0.85 : 0.22);
        c.fillRect(TOWER.x + TOWER.w - 26 + l * 9, y + uh / 2 - 2, 5, 4);
      }
    }
    c.restore();
  }

  // ---- the dots
  // the fence cut at the pliers, in frame px under G02's camera (a fixed frame point before the cut / without footage)
  const g02 = X.shot.id === 'G02' && X.base?.kind === 'clip';
  const cs = cutAt(g02 ? X.base!.lt : 0);
  const cp = g02 ? X.px([cs[0], cs[1], cs[0], cs[1]]) : { x: cs[0] * 1920, y: cs[1] * 1080 };
  const ga = c.globalAlpha;
  const cu = ease.inOutCubic(clamp((t - T.agents) / Math.max(0.3, T.safe + 0.25 - T.agents)));
  const ccx = lerp(640, BOARD.cx, cu), ccy = lerp(800, BOARD.cy, cu);
  const msg = t >= T.brk ? 1 - 0.7 * clamp((t - T.brk - 0.6) / 0.4) : 0;
  const hotOn = t >= T.seven - 0.02;
  const s0 = T.seven + 0.12;
  for (let i = 0; i < N8; i++) {
    const spawn = T.agents + hash(i, 3) * 0.4;
    if (t < spawn) continue;
    const slot = boardSlot(i);
    // A: the swarm (a swirling cloud homing in on the board), each dot landing on its slot across "safeguards lowered:"
    const ang = hash(i, 4) * TAU + (t - T.agents) * (1.3 + hash(i, 5) * 1.3) * (hash(i, 6) < 0.5 ? -1 : 1);
    const rad = (26 + 150 * Math.sqrt(hash(i, 7))) * lerp(1, 0.7, cu);
    const cloud = { x: ccx + Math.cos(ang) * rad * 1.3, y: ccy + Math.sin(ang) * rad * 0.8 };
    const arr0 = T.safe - 0.2 + hash(i, 8) * Math.max(0.3, T.lowE - T.safe);
    const au = ease.inOutCubic(clamp((t - arr0) / 0.42));
    let x = lerp(cloud.x, slot.x, au), y = lerp(cloud.y, slot.y, au);
    let col: string;
    const a = clamp((t - spawn) / 0.2);
    const r = rank8(i), sel = r < SEL;
    if (au < 0.92) col = onPaper(x, y) ? INK(0.85) : WHITE(0.9);
    else if (sel && hotOn) col = CORAL();
    else {
      const fl = hash(i, fi(t) >> 1) < 0.04 + 0.22 * msg;
      col = INK(fl ? 0.25 : 0.82);
    }
    // B: the 700 leave the board, funnel into the cut the pliers are making in the real fence ("seven" … "joined"),
    //    and fan out to mass against the tower's outer face, in the gap left of it — never inside it (no public
    //    models/datasets/Spaces affected; the agent "never reached the Hub database")
    if (sel && t >= s0) {
      const dep = s0 + (r / SEL) * 1.55;
      const u = t - dep;
      if (u > 0) {
        const E = { x: cp.x - 10, y: cp.y + (hash(i, 9) - 0.5) * 16 };
        const Xo = { x: cp.x + 16, y: cp.y + (hash(i, 10) - 0.5) * 22 };
        const Tt = { x: TOWER.x - 7 - Math.pow(hash(i, 11), 1.6) * 46, y: TOWER.y + 12 + hash(i, 12) * (TOWER.h - 24) };
        const d1 = 0.42, d2 = 0.1, d3 = 0.4;
        if (u < d1) {
          const p = quad(slot, { x: lerp(slot.x, E.x, 0.55), y: Math.min(slot.y, E.y) - 40 - hash(i, 13) * 90 }, E, ease.inOutQuad(u / d1));
          x = p.x; y = p.y;
        } else if (u < d1 + d2) {
          const k = (u - d1) / d2; x = lerp(E.x, Xo.x, k); y = lerp(E.y, Xo.y, k);
        } else {
          const k = ease.outCubic(clamp((u - d1 - d2) / d3));
          const p = quad(Xo, { x: lerp(Xo.x, Tt.x, 0.5), y: Xo.y + (Tt.y - Xo.y) * 0.15 }, Tt, k);
          x = p.x + (k >= 1 ? (hash(i, fi(t) >> 2, 5) - 0.5) * 1.2 : 0); y = p.y;
        }
        col = CORAL();
      }
    }
    c.globalAlpha = ga * a;
    c.fillStyle = col;
    c.fillRect(x - 1.3, y - 1.3, 2.6, 2.6);
  }
  c.restore();
}

/** The s08 caveat stack, top-right: the tag (from "Test"); the flap board's ~700 source under the board (from "Test":
 *  the chrome's flap shows ~700 from that word); the subline panel with the subline's OWN source (OpenAI) in its
 *  footer; subline row 1 types on "agents,", row 2 on "safeguards". Drawn by s08 at full strength through the cut and
 *  by s09 (subFade takes the panel and the flap's source line off once the flap has flipped off ~700), so the caveat
 *  tag never drops out at the cut. */
function s08Caption(c: CanvasRenderingContext2D, X: X, subFade = 1) {
  const t = X.t, T = s08Times(X);
  if (t < T.test - 0.08) return;
  caveatTag(c, TAG, CAP.x, CAP.tagY, { k: enter(t, T.test - 0.06, DUR.tag), ink: X.ink });
  if (subFade <= 0) return;
  sourceLine(c, B08.src, FLAP_SRC.x, FLAP_SRC.y, {
    align: 'right', back: true, ink: X.ink, alpha: subFade * clamp(enter(t, T.test - 0.02, DUR.source) * 4),
  });
  const fam = FONT.mono(600), size = CAP.rowSize, tr = CAP.rowTr;
  const ws = SUB8.map((s) => advOf(s, fam, size, tr));
  panel(c, CAP.x, CAP.subY, P8.w, SUB_H, {
    k: enter(t, T.test - 0.02, DUR.panel), alpha: subFade, ink: X.ink, source: B08.subSrc,
    draw: (p) => {
      const at = [T.agents, T.safe];
      SUB8.forEach((s, li) => {
        const e = ease.outCubic(clamp((t - (at[li]! - 0.04)) / 0.32));
        if (e <= 0) return;
        const front = (ws[li]! + 36) * e;
        for (const tk of plainToks(s, fam, size, tr)) {
          const a = tokA(front, tk.x);
          if (a > 0) text(c, tk.s, p.x + CAP.padX + tk.x, p.y + CAP.padT + li * CAP.rowLH, fam, size, p.fg(0.92), { track: tr, alpha: a });
        }
      });
    },
  });
}

function s08Panel(c: CanvasRenderingContext2D, X: X) {
  const t = X.t, T = s08Times(X);
  if (t < T.test - 0.08) return;
  // the caveat stack holds at full strength through the cut (s09 carries it on)
  s08Caption(c, X);
  // the headline panel: ~700 lands on "seven"; it grows with what it holds (rows on "joined" / "break-in"); its own
  // METR / REDWOOD source in the footer, fully unrolled by the frame ~700 lands (opens 0.24 s ahead of the word)
  const NUM = 196, numFam = FONT.grot(900), numTr = -NUM * 0.03;
  const x0 = P8.x + PAD + 4;
  const numBase = P8.y + PAD + NUM * 0.74, lblBase = numBase + 58;
  const rule1 = lblBase + 26, row1 = rule1 + 36, row2 = row1 + 32;
  // the panel grows a touch AHEAD of each row's word, so the footer strip has already moved down clear of the row
  // when its text appears on the word
  const g1 = ease.outExpo(clamp((t - T.joined + 0.06) / 0.3)), g2 = ease.outExpo(clamp((t - T.brk + 0.06) / 0.3));
  const H = rule1 + 24 + 50 * g1 + 32 * g2 + FOOT_H - P8.y;
  panel(c, P8.x, P8.y, P8.w, H, {
    k: enter(t, T.seven - 0.24, DUR.panel), alpha: leave(t, T.end), ink: X.ink, source: B08.src,
    draw: (p) => {
      // the number: drawn whole, landing (full size, full opacity) on "seven"; a small overshoot (amp 0.1) keeps the
      // whole "~700" — the tilde too — inside the panel's clip on the frames before contact
      landText(c, B08.num, x0, numBase, numFam, NUM, CORAL(), t, T.seven, { track: numTr, amp: 0.1 });
      // label row 1 with the number
      const l1 = appear(t, T.seven + 0.1, 0.3);
      if (l1 > 0) text(c, B08.label[0]!, x0, lblBase + (1 - l1) * 14, FONT.grot(800), 40, p.fg(0.97), { track: -0.6, alpha: l1 });
      hair(c, x0, rule1, x0 + (P8.w - 2 * PAD - 8) * ease.outCubic(clamp((t - T.seven - 0.15) / 0.4)), rule1, p.fg(0.35));
      // label rows 2–3 on "joined" / "break-in"
      const rowAt = [T.joined, T.brk];
      [B08.label[1]!, B08.label[2]!].forEach((s, j) => {
        const rk = appear(t, rowAt[j]!, 0.28);
        if (rk <= 0) return;
        const y = j ? row2 : row1;
        c.fillStyle = p.fg(0.9 * rk); c.fillRect(x0, y - 11, 6, 6);
        text(c, s, x0 + 18 + (1 - rk) * 16, y, FONT.mono(600), 20, p.fg(0.95), { track: 1.6, alpha: rk });
      });
    },
  });
}

// ====================================================================== s09 · B09 NOT ONE LAB
// the list panel (right): 12 px top margin, four 116 px rows, the footer with the combined source line
const P9 = { x: 1110, w: 720, boxX: 118, boxY: 588, boxW: 196, boxH: 236, gap: 30, y: 356, rowTop: 368, rowH: 116, ix: 1128, iw: 92, ih: 84, tx: 1244 };
const P9_H = (P9.rowTop - P9.y) + 4 * P9.rowH + FOOT_H;
/** Row type: mono 15 px (14 if any line of any row would overrun the column; all rows share one size: equal type). */
const ROW_TR = 1.3, ROW_MAXW = P9.x + P9.w - 22 - P9.tx;
const rowSize = () => {
  const fits = (size: number) => B09.rows.every((s, k) =>
    rowToks(s, B09.brk[k] ?? null, FONT.mono(600), FONT.mono(400), size, ROW_TR).every((ln) => lineW(ln, size, ROW_TR) <= ROW_MAXW));
  return fits(15) ? 15 : 14;
};

const P9H = { x: 118, y: 598, w: 790 }; // the B09 headline panel, lower-left (empty once the boxes fly)

function s09Times(X: X) {
  const w = (k: number) => X.W('In testing, agents', k);
  return {
    inn: w(0).start, testing: w(1).start, reached: w(3).start, systems: w(5).start,
    // each row wipes in on its own word; the long UK AISI row (the §7 wording) gets "Even" for read time
    rowIn: [w(6).start, w(7).start, w(8).start, w(9).start], // OpenAI, · Anthropic, · Meta. · Even
    // the equal name punch + icon pulse land on each spoken name
    rows: [w(6).start, w(7).start, w(8).start, w(11).start], // OpenAI, · Anthropic, · Meta. · UK
    even: w(9).start,
    end: X.ch.t1,
  };
}

/** The B09 headline (lower-left panel): 19 LANDS on "Even" · label head · two model rows · its source line in the
 *  footer, which is already up on the frame 19 lands (the panel opens just ahead of the word). */
function s09Head(c: CanvasRenderingContext2D, X: X, alpha: number) {
  const t = X.t, T = s09Times(X);
  const k = enter(t, T.even - 0.26, DUR.panel); // fully open (footer and all) by the frame 19 lands
  if (k <= 0) return;
  const [head, ...rows] = B09H.label.split(' · ') as [string, ...string[]];
  const { x, y, w } = P9H, x0 = x + PAD + 4;
  const NUM = 150, numFam = FONT.grot(900), numTr = -NUM * 0.03, numBase = y + PAD + NUM * 0.74;
  const numW = measure(B09H.num, numFam, NUM, numTr);
  // label head beside the number, balanced over two lines, bottom line on the number's baseline
  const lFam = FONT.grot(800), lSize = 40, lx = x0 + numW + 34; // = B08's label size
  const lLines = wrapBalanced(head.split(' ').map((s) => ({ s, fam: lFam })), lSize, x + w - PAD - lx, -0.6);
  const lLH = lSize * 1.08;
  const rule1 = numBase + 28, row1 = rule1 + 34, row2 = row1 + 32;
  const H = row2 + 18 + FOOT_H - y;
  panel(c, x, y, w, H, {
    k, alpha, ink: X.ink, source: B09H.src,
    draw: (p) => {
      // the number, drawn whole (no camera punch: the four name punches stay the only ones in s09)
      landText(c, B09H.num, x0, numBase, numFam, NUM, CORAL(), t, T.even, { track: numTr });
      const l1 = appear(t, T.even + 0.06, 0.3);
      if (l1 > 0) lLines.forEach((ln, li) => ln.forEach((tk) =>
        text(c, tk.s, lx + tk.x, numBase - (lLines.length - 1 - li) * lLH + (1 - l1) * 14, lFam, lSize, p.fg(0.97), { track: -0.6, alpha: l1 })));
      hair(c, x0, rule1, x0 + (w - 2 * PAD - 8) * ease.outCubic(clamp((t - T.even - 0.1) / 0.4)), rule1, p.fg(0.35));
      // the two model rows: equal type, the sheet's order
      rows.forEach((s, j) => {
        const rk = appear(t, T.even + 0.14 + 0.06 * j, 0.28);
        if (rk <= 0) return;
        const yy = j ? row2 : row1;
        c.fillStyle = p.fg(0.9 * rk); c.fillRect(x0, yy - 11, 6, 6);
        text(c, s, x0 + 18 + (1 - rk) * 16, yy, FONT.mono(600), 20, p.fg(0.95), { track: 1.6, alpha: rk });
      });
    },
  });
}

/** One sandbox (an open tray seen from slightly above) at box (x, y, w, h). Identical drawing for all four. Its way
 *  out is a deliberate HATCH in the front face (a clean rectangular opening, lit from inside), not a fracture: fact
 *  sheet §7 — UK AISI says it "was not a case of a model escaping"; access was open by configuration. */
function sandbox(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number,
  o: { k: number; open: number; light: number; agents: number; node: number; pulse: number }) {
  if (o.k <= 0) return;
  const top = h * 0.27;
  c.save();
  c.globalAlpha *= clamp(o.k * 1.5);
  // front face + top face
  c.fillStyle = PANEL; c.fillRect(x, y + top, w, h - top);
  c.beginPath(); c.moveTo(x + w * 0.1, y); c.lineTo(x + w * 0.9, y); c.lineTo(x + w, y + top); c.lineTo(x, y + top); c.closePath();
  c.fillStyle = 'rgba(30,32,37,0.92)'; c.fill();
  c.strokeStyle = WHITE(0.85); c.lineWidth = 1.5; c.stroke();
  c.strokeRect(x + 0.5, y + top, w - 1, h - top - 0.5);
  // inner rim + sand stipple (fixed pattern, same in every box)
  c.beginPath(); c.moveTo(x + w * 0.16, y + top * 0.22); c.lineTo(x + w * 0.84, y + top * 0.22); c.lineTo(x + w * 0.92, y + top * 0.86); c.lineTo(x + w * 0.08, y + top * 0.86); c.closePath();
  c.strokeStyle = WHITE(0.25); c.lineWidth = 1; c.stroke();
  for (let i = 0; i < 26; i++) {
    const u = hash(i, 91), v = hash(i, 92);
    const yy = y + top * (0.3 + 0.5 * v), xx = x + w * (0.12 + 0.76 * u);
    c.fillStyle = WHITE(0.22); c.fillRect(xx, yy, 1.5, 1.5);
  }
  // front-face courses
  for (let j = 1; j < 4; j++) hair(c, x + 6, y + top + ((h - top) * j) / 4, x + w - 6, y + top + ((h - top) * j) / 4, WHITE(0.08));
  // agents in the tray (the same three dots, the same motion, in every box)
  if (o.agents > 0) {
    for (let j = 0; j < 3; j++) {
      const ax = x + w * (0.5 + 0.27 * Math.cos(t * 1.9 + j * 2.1)), ay = y + top * (0.55 + 0.22 * Math.sin(t * 2.6 + j * 1.3));
      const as = Math.max(3, w * 0.026);
      c.fillStyle = WHITE(0.95 * o.agents); c.fillRect(ax - as / 2, ay - as / 2, as, as);
    }
  }
  // the hatch: the same clean opening in the front face of every box, sliding open upward from the base on
  // "reached", lit from inside on "systems:", a touch brighter on its name's pulse
  if (o.open > 0) {
    const fh = h - top, dw = w * 0.14, dh = fh * 0.62 * ease.outCubic(o.open);
    const dx = x + w * 0.61 - dw / 2, dy = y + h - dh;
    c.save();
    c.fillStyle = WHITE(Math.min(1, 0.22 + 0.45 * o.light + 0.3 * o.pulse)); c.fillRect(dx, dy, dw, dh);
    c.strokeStyle = WHITE(0.9); c.lineWidth = 1.5; c.strokeRect(dx + 0.5, dy + 0.5, dw - 1, dh - 1);
    c.restore();
    // link from the hatch to a small outside node ("reached real systems"), the same in every box
    if (o.node > 0) {
      const sx = x + w * 0.61, sy = y + h, ex = x + w * 0.61, ey = y + h + 34;
      const e = ease.outCubic(clamp(o.node / 0.6));
      c.save(); c.setLineDash([3, 3]); hair(c, sx, sy, sx, lerp(sy, ey, e), WHITE(0.8)); c.restore();
      const nk = clamp((o.node - 0.5) / 0.5);
      if (nk > 0) {
        c.globalAlpha *= nk;
        c.fillStyle = PANEL; c.fillRect(ex - 9, ey, 18, 18);
        c.strokeStyle = WHITE(0.9); c.lineWidth = 1.5; c.strokeRect(ex - 9, ey, 18, 18);
        c.fillStyle = WHITE(0.9); c.fillRect(ex - 3, ey + 6, 6, 6);
      }
    }
  }
  c.restore();
}

function s09Draw(c: CanvasRenderingContext2D, X: X) {
  const t = X.t, T = s09Times(X);
  if (t < X.ch.t0) return;
  const out = leave(t, T.end, 0.12);
  // the caveat tag, held from s08 (same string, place and size; already complete); s08's subline panel (with the ~700
  // source) stays until the flap board has flipped off ~700 (on "In"), then leaves
  s08Caption(c, X, out * leave(t, T.inn + 0.32));
  if (SHOW_B09_HEAD) s09Head(c, X, out);
  // the list panel: opens ON the H02 cut (not over the tail of H01) and the sandboxes fly in from the cut; its footer
  // (the combined source line) is fully unrolled before any token after row 1's name — those wait for it
  const tCut = X.S('H02')?.t0 ?? T.rows[0]! - 0.01;
  const tP = tCut - 0.02, tFoot = tP + 0.6 * DUR.panel; // outExpo(0.6) ≈ 0.984: the footer's type is inside the reveal
  const foot = clamp((t - tFoot) / 0.05);
  const size = rowSize(), bold = FONT.mono(600), reg = FONT.mono(400), lh = 23;
  panel(c, P9.x, P9.y, P9.w, P9_H, {
    k: enter(t, tP, DUR.panel), alpha: out, ink: X.ink, source: B09.src,
    draw: (p) => {
      // the rows, one per name, in equal type; each breaks only where B09.brk says. ONE front per row runs through
      // line 1 and then line 2 (line 2 starts only once line 1 is complete), so a row always reads in order and its
      // caveat clause arrives last but whole; every token fades in whole
      for (let k = 0; k < 4; k++) {
        const top = P9.rowTop + k * P9.rowH;
        if (k) hair(c, P9.x + 14, top, P9.x + P9.w - 14, top, p.fg(0.14));
        const lines = rowToks(B09.rows[k]!, B09.brk[k] ?? null, bold, reg, size, ROW_TR);
        const ws = lines.map((ln) => lineW(ln, size, ROW_TR));
        const total = ws.reduce((s, w) => s + w + 36, 0);
        const dur = 0.32 * Math.max(1, total / 600);
        const rk = clamp((t - (T.rowIn[k]! - 0.03)) / dur);
        if (rk <= 0) continue;
        const by = top + P9.rowH / 2 - ((lines.length - 1) * lh) / 2 + size * 0.36;
        const front = total * ease.outCubic(rk);
        let off = 0;
        lines.forEach((ln, li) => {
          ln.forEach((tk) => {
            const a = tokA(front, off + tk.x) * (tk.hot ? 1 : foot);
            if (a > 0) text(c, tk.s, P9.tx + tk.x, by + li * lh, tk.fam, size, tk.hot ? p.fg(0.98) : p.fg(0.84), { track: ROW_TR, alpha: a });
          });
          off += ws[li]! + 36;
        });
      }
    },
  });
  // the four sandboxes: a row (H01) → the list's row icons (H02), flying from the cut
  c.save();
  c.globalAlpha *= out;
  const mv = ease.outExpo(clamp((t - tCut) / 0.42));
  const bk = appear(t, T.testing - 0.04, 0.35);
  const open = clamp((t - T.reached) / 0.35);
  const node = clamp((t - T.systems) / 0.45) * (1 - clamp(mv * 2.5));
  const bx0 = P9.boxX;
  for (let k = 0; k < 4; k++) {
    const a = { x: bx0 + k * (P9.boxW + P9.gap), y: P9.boxY, w: P9.boxW, h: P9.boxH };
    const b = { x: P9.ix, y: P9.rowTop + k * P9.rowH + (P9.rowH - P9.ih) / 2, w: P9.iw, h: P9.ih };
    const rt = T.rows[k]!, ri = T.rowIn[k]!;
    const lit = t >= ri ? 1 : 0;
    const pulse = t >= rt ? Math.pow(0.5, (t - rt) / 0.12) : 0;
    const dim = mv > 0 ? lerp(1, 0.55 + 0.45 * lit, mv) : 1;
    c.save(); c.globalAlpha *= dim;
    sandbox(c, lerp(a.x, b.x, mv), lerp(a.y, b.y, mv), lerp(a.w, b.w, mv), lerp(a.h, b.h, mv), t,
      { k: bk, open, light: clamp((t - T.systems) / 0.3), agents: 1 - mv * 0.5, node, pulse });
    c.restore();
  }
  c.restore();
}

// ====================================================================== s10 · B10 THEY SUSPECT
// cards right (house paper panels, source in the footer); the tube low-left, below the real lens's glass (J01's iris
// sits at about x 790, y 470 with its glass ring reaching y ~815), so the footage's own opening iris stays clear
const P10 = { x: 1130, w: 700, y: 318, gap: 24, size: 38 };
const TUBE = { x: 150, y: 756, w: 690, h: 196 };

function s10Times(X: X) {
  const w = (k: number) => X.W('models often suspect', k);
  return { and: w(0).start, models: w(2).start, often: w(3).start, suspect: w(4).start, tested: w(7).start, end: X.ch.t1 };
}

function quoteCardLayout(q: string) {
  const fam = FONT.grot(800), size = P10.size;
  let inQ = false;
  const toks = q.split(' ').map((s) => {
    if (s.startsWith('"')) inQ = true;
    const tk = { s, fam, hot: inQ };
    if (s.endsWith('"')) inQ = false;
    return tk;
  });
  const lines = wrapBalanced(toks, size, P10.w - 2 * PAD, -size * 0.01);
  const lh = size * 1.06;
  const h = PAD + (lines.length - 1) * lh + size * 0.74 + PAD + 4 + FOOT_H;
  return { lines, lh, h };
}

/** One quote card: the house paper panel (flat, cream, ink edges + corner brackets), the quote in ink with the quoted
 *  words in coral (the hot value), its source in the footer. Both cards identical in every respect but the words. */
function quoteCard(c: CanvasRenderingContext2D, X: X, q: string, src: string, x: number, y: number, t0: number, alpha: number) {
  const t = X.t;
  const { lines, lh, h } = quoteCardLayout(q);
  const size = P10.size;
  panel(c, x, y, P10.w, h, {
    paper: true, k: enter(t, t0, DUR.panel), alpha, ink: X.ink, source: src,
    draw: (p) => lines.forEach((ln, li) => ln.forEach((tk) =>
      text(c, tk.s, p.inner.x + tk.x, p.inner.y + size * 0.74 + li * lh, tk.fam, size, tk.hot ? CORAL() : p.fg(0.96), { track: -size * 0.01 }))),
  });
}

function s10Draw(c: CanvasRenderingContext2D, X: X) {
  const t = X.t, T = s10Times(X);
  if (t < X.ch.t0) return;
  const out = leave(t, T.end, 0.12);
  c.save();
  c.globalAlpha *= out;
  // ---- the test tube (lying down) with the eye inside: in on the J01 cut, so "And" can carry the first card
  const tk = appear(t, X.ch.t0 + 0.02, 0.35);
  if (tk > 0) {
    const { x, y, w, h } = TUBE, r = h / 2, S = h / 224;
    c.save();
    c.globalAlpha *= clamp(tk * 1.5);
    c.translate((1 - tk) * -24, 0);
    // body: open end (lip) on the left, round bottom on the right
    const tubePath = () => {
      c.beginPath(); c.moveTo(x + 14, y); c.lineTo(x + w - r, y); c.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2); c.lineTo(x + 14, y + h);
    };
    tubePath(); c.closePath(); c.fillStyle = PANEL; c.fill();
    tubePath(); c.strokeStyle = WHITE(0.9); c.lineWidth = 1.6; c.stroke();
    // lip
    c.strokeStyle = WHITE(0.9); c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(x, y - 10); c.lineTo(x + 14, y - 10); c.lineTo(x + 14, y + h + 10); c.lineTo(x, y + h + 10); c.closePath(); c.stroke();
    // liquid level + graduation ticks (no numbers)
    const ly = y + h * 0.24 + Math.sin(t * 2.2) * 2;
    c.save(); c.beginPath(); tubePath(); c.closePath(); c.clip();
    hair(c, x + 16, ly, x + w, ly, WHITE(0.35), 1);
    for (let i = 0; i < 14; i++) {
      const bx = x + 60 + hash(i, 61) * (w - 160), by = y + h - ((t * (18 + hash(i, 62) * 20) + hash(i, 63) * h) % (h * 0.7));
      if (by > ly + 4) { c.strokeStyle = WHITE(0.35); c.lineWidth = 1; c.beginPath(); c.arc(bx, by, 1.5 + hash(i, 64) * 2.5, 0, TAU); c.stroke(); }
    }
    c.restore();
    const step = (w - r - 70) / 10;
    for (let i = 0; i < 11; i++) { const gx = x + 60 + i * step; hair(c, gx, y + h - 1, gx, y + h - (i % 5 === 0 ? 22 : 12) * S, WHITE(0.45)); }
    // the eye: opens on the cut, glances at the cards on "models", looks back at the viewer on "suspect"
    const ex = x + (w - r * 0.4) * 0.5, ey = y + h * 0.56, EW = 210 * S, EH = 74 * S;
    const open = ease.outExpo(clamp((t - (X.ch.t0 + 0.05)) / 0.32));
    const ah = EH * open;
    const lidPath = () => {
      c.beginPath(); c.moveTo(ex - EW, ey); c.quadraticCurveTo(ex, ey - ah * 2, ex + EW, ey); c.quadraticCurveTo(ex, ey + ah * 2, ex - EW, ey); c.closePath();
    };
    lidPath(); c.fillStyle = WHITE(0.06 + 0.04 * open); c.fill();
    if (open > 0.02) {
      const look = t < T.suspect ? ease.outExpo(clamp((t - T.models) / 0.18)) : 1 - ease.outExpo(clamp((t - T.suspect) / 0.14));
      const gx = ex + 70 * S * look, gy = ey - 6 * S * look;
      const IR = 58 * S, pr = (22 + 6 * ease.outCubic(clamp((t - T.tested) / 0.25))) * S;
      c.save(); lidPath(); c.clip();
      c.fillStyle = WHITE(0.92); c.beginPath(); c.arc(gx, gy, IR, 0, TAU); c.fill();
      c.strokeStyle = INK(0.28); c.lineWidth = 1;
      for (let i = 0; i < 28; i++) { const a = (i / 28) * TAU; c.beginPath(); c.moveTo(gx + Math.cos(a) * (pr + 4), gy + Math.sin(a) * (pr + 4)); c.lineTo(gx + Math.cos(a) * (IR - 6), gy + Math.sin(a) * (IR - 6)); c.stroke(); }
      c.strokeStyle = INK(0.7); c.lineWidth = 2; c.beginPath(); c.arc(gx, gy, IR - 1, 0, TAU); c.stroke();
      c.fillStyle = INK(0.96); c.beginPath(); c.arc(gx, gy, pr, 0, TAU); c.fill();
      c.fillStyle = WHITE(0.95); c.beginPath(); c.arc(gx + 9 * S, gy - 10 * S, 6 * S, 0, TAU); c.fill();
      c.restore();
    }
    lidPath(); c.strokeStyle = WHITE(0.95); c.lineWidth = 2; c.stroke();
    // lashes on the upper lid
    for (let i = 1; i < 8; i++) {
      const u = i / 8, px = lerp(ex - EW, ex + EW, u), py = (1 - u) * (1 - u) * ey + 2 * (1 - u) * u * (ey - ah * 2) + u * u * ey;
      const a = -Math.PI / 2 + (u - 0.5) * 1.4;
      hair(c, px, py, px + Math.cos(a) * 14 * S * open, py + Math.sin(a) * 14 * S * open, WHITE(0.8 * open), 1.5);
    }
    c.restore();
  }
  c.restore();
  // ---- the two quote cards, identical, in the fact sheet's order: card 1 on "And", card 2 on "models" (holds
  //      ~1.9 s / ~1.7 s in this 2.3 s chapter)
  const h0 = quoteCardLayout(B10[0]!.q).h;
  quoteCard(c, X, B10[0]!.q, B10[0]!.src, P10.x, P10.y, T.and - 0.14, out);
  quoteCard(c, X, B10[1]!.q, B10[1]!.src, P10.x, P10.y + h0 + P10.gap, T.models - 0.14, out);
}

// ====================================================================== chapters
export const chapters: Record<string, Chapter> = {
  s08: {
    draw(c, X) { s08Swarm(c, X); s08Panel(c, X); },
    post(X, o: PostOverrides) {
      const T = s08Times(X);
      const k = impact(X.t, [T.seven], 0.07);
      if (k > 0.01) { o.zoom = 1 + 0.02 * k; o.shake = shakeOf(X.t, 5 * k, 81); }
      return o;
    },
  },
  s09: {
    draw(c, X) { s09Draw(c, X); },
    post(X, o: PostOverrides) {
      // the same small punch on each of the four names (equal treatment)
      const T = s09Times(X);
      const k = impact(X.t, T.rows, 0.05);
      if (k > 0.01) o.zoom = 1 + 0.008 * k;
      return o;
    },
  },
  s10: {
    draw(c, X) { s10Draw(c, X); },
  },
};

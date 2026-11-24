// THE STATE OF AI · OCTOBER 2026 — the bookends: cold open, intro, outro.
//   cold   the broadcast boots over black: the corner crosses and the edge rulers draw on, a centre registration
//          cross draws out, the chrome flickers on and locks on the bar line — where the centre ruler splits open
//          onto the first footage (C02, the hand plugging a cable, left clean) — and on the cut to the rack (C03) the
//          house system panel opens right of frame and types SOURCES, fills a meter (no count: the fact sheet prints
//          none), lands LOADED, then FACTS CHECKED 18 OCT 2026, then READY. It sits over the rack's lower CPU badge (a
//          maker's badge, kept covered) and stays opaque to the cut; storyboard.d's C03 camera lifts the whole upper
//          unit (badge, LEDs) off the top edge and the amber LEDs off the right, and its C02 camera drops the blown-out
//          port LED below the flap board's caption.
//          (The flap board is chrome: it settles on THE STATE / OF AI.)
//   intro  "Humans. Models. Everyone." — one CV tag per word (the kit cvBox look: corner brackets, a white class tab;
//          a coral reticle) landing on the word, each on the shot's real subject and always a group, never one
//          person. "This is the state of AI. October, 2026." — the line is drawn here (storyboard.d sets it to mode
//          `none`) as the masthead lockup THE STATE / OF AI / OCTOBER 2026, slammed on "state", lit word by word.
//   outro  the END CARD: a cream credits card (a credit per spoken phrase, FACTS CHECKED 18 OCT 2026 stamped on
//          "Checked"), the roll of the sources behind the film's beats and dates (fact sheet section 6, plus S101)
//          stepping a half page per bar in a dark panel from "sourced." to the bar after "2026.", then the frame clears
//          to black around FULL SOURCE LIST WITH LINKS IN THE DESCRIPTION and the chrome rings out over the last bar.
//          Card and roll leave a clear lane between them for the walker in Z02 (x ≈ 800–1115 over the whole shot).
// Panels, the paper card and their strips are the house style of ../brief (opaque, hairline + corner brackets).
// Pure functions of X.t. Every time is a lyric word, a shot window, or a bar/beat line counted from one.
import type { Chapter, X } from '../x';
import type { Word, Line } from '../../engine/lyrics';
import { clamp, ease, hash, lerp } from '../../engine/util';
import { measure } from '../../engine/type';
import { FONT, W, H, fi, C, WHITE, CORAL, INK, rgbaHex, text, label, hair, barcode, appear, vanish } from '../kit';
import { tabWidth, type Box } from '../cards';
import { panel, enter, leave, DUR, HEAD_H } from '../brief';

const BLACK = (a = 1) => rgbaHex(C.black, a);

/** Characters of s revealed from t0 at cps chars/s. */
const typedPart = (s: string, t: number, t0: number, cps: number) => (t < t0 ? '' : s.slice(0, Math.floor((t - t0) * cps)));

/** Karaoke state of word i of a line at t: the last started word is current until just after its end. */
function wordState(words: Word[], i: number, t: number): 'cur' | 'sung' | 'todo' {
  let k = -1;
  words.forEach((w, j) => { if (t >= w.start - 0.02) k = j; });
  if (i > k) return 'todo';
  return i === k && t < words[i]!.end + 0.08 ? 'cur' : 'sung';
}

// =====================================================================================================================
// COLD OPEN
// =====================================================================================================================
function coldT(X: X) {
  const hum = X.W('Humans', 0).start;
  const hb = Math.round(X.bar(hum)); // the intro's downbeat: the cold open is the four bars before it
  const b0 = X.S('C02')?.t0 ?? X.tBar(hb - 4); // first footage
  const b1 = X.tBar(hb - 3); // the chrome locks, the centre ruler splits open onto the footage
  const b2 = X.S('C03')?.t0 ?? X.tBar(hb - 2); // the data-centre aisle
  const b3 = X.tBar(hb - 1);
  const k0 = Math.round(X.beat(b0));
  const bt = (k: number) => X.tBeat(k0 + k); // beat k of the pre-roll
  // the system panel leads the cut to the rack by 0.1 s, so it is ~90 % unrolled — over the lower badge — on C03's
  // first frame
  const card = b2 - 0.1;
  return { t0: X.ch.t0, t1: X.ch.t1, b0, b1, b2, b3, bt, lock: b1, open: b1, card };
}
type CT = ReturnType<typeof coldT>;
const OPEN_D = 0.42; // the split-open, seconds

/** Chrome opacity while the broadcast boots: hash-keyed bursts per frame, lit more and more often, solid on the lock. */
function bootLevel(X: X, a: number, lock: number) {
  const t = X.t;
  if (t >= lock) return 1;
  if (t < a) return 0;
  const u = X.u(a, lock), f = fi(t);
  const run = Math.floor(f / 2); // bursts of ~2 frames
  const p = 0.12 + 0.88 * Math.pow(u, 1.15);
  const lit = hash(run, 911) < p || X.hit('kick') > 0.7;
  return lit ? 0.35 + 0.65 * Math.max(u * u, hash(f, 912)) : 0.06 * hash(f, 913);
}

/** Black over the first footage until the lock; then the frame splits open from the centre ruler. */
function coldCover(c: CanvasRenderingContext2D, X: X, T: CT) {
  const t = X.t;
  if (t >= T.open + OPEN_D) return;
  const u = t < T.open ? 0 : ease.outExpo(clamp((t - T.open) / OPEN_D));
  const half = (H / 2) * u;
  c.fillStyle = BLACK();
  c.fillRect(0, 0, W, H / 2 - half);
  c.fillRect(0, H / 2 + half, W, H / 2 - half);
  if (t >= T.open) {
    const a = 1 - clamp((t - T.open) / OPEN_D);
    hair(c, 0, H / 2 - half, W, H / 2 - half, WHITE(0.85 * a), 1.5);
    hair(c, 0, H / 2 + half, W, H / 2 + half, WHITE(0.85 * a), 1.5);
  }
}

/** A tick ruler from (x0,y0) toward (x1,y1), drawn on to fraction u; ticks every `step` px, long ones every `major`. */
function tickRuler(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, u: number, col: string, o: { step?: number; major?: number; tick?: number; side?: number } = {}) {
  if (u <= 0) return;
  const len = Math.hypot(x1 - x0, y1 - y0), dx = (x1 - x0) / len, dy = (y1 - y0) / len;
  const L = len * clamp(u), step = o.step ?? 40, major = o.major ?? 5, tk = o.tick ?? 5, side = o.side ?? 1;
  hair(c, x0, y0, x0 + dx * L, y0 + dy * L, col, 1);
  // ticks perpendicular (nx, ny), on `side` (1 / -1) or both (0)
  const nx = -dy, ny = dx;
  for (let s = 0, i = 0; s <= L; s += step, i++) {
    const tl = i % major === 0 ? tk * 2 : tk;
    const px = x0 + dx * s, py = y0 + dy * s;
    const a = side === 0 ? -tl / 2 : 0, b = side === 0 ? tl / 2 : tl * side;
    hair(c, px + nx * a, py + ny * a, px + nx * b, py + ny * b, col, 1);
  }
}

/** The construction lines of the boot: corner crosses, edge rulers, the centre registration cross and rulers. */
function bootGuides(c: CanvasRenderingContext2D, X: X, T: CT) {
  const t = X.t;
  if (t > T.lock + 0.5) return;
  const fadeLock = 1 - ease.inCubic(clamp((t - T.lock) / 0.35)); // the chrome takes over on the lock
  c.save();
  // corner crosses: arms grow to 30 px, then fold into the chrome's 11 px crosses on the lock
  const corners = [[24, 24], [W - 24, 24], [W - 24, H - 24], [24, H - 24]] as const;
  corners.forEach(([x, y], i) => {
    const k = ease.outExpo(clamp((t - T.bt(0) - i * 0.07) / 0.3));
    if (k <= 0) return;
    const arm = lerp(30 * k, 11, ease.outCubic(clamp((t - T.lock) / 0.3)));
    const col = WHITE(0.85 * fadeLock);
    hair(c, x - arm, y, x + arm, y, col, 1.2); hair(c, x, y - arm, x, y + arm, col, 1.2);
  });
  // edge rulers between the crosses: top and right draw clockwise from the top-left cross, bottom and left back to it
  const ue = (d: number) => ease.outCubic(clamp((t - T.bt(1) - d) / 0.55));
  const ec = WHITE(0.42 * fadeLock);
  tickRuler(c, 48, 24, W - 48, 24, ue(0), ec, { step: 48, major: 5, tick: 4, side: 1 });
  tickRuler(c, W - 24, 48, W - 24, H - 48, ue(0.08), ec, { step: 22, major: 4, tick: 4, side: 1 });
  tickRuler(c, W - 48, H - 24, 48, H - 24, ue(0.16), ec, { step: 48, major: 5, tick: 4, side: 1 });
  tickRuler(c, 24, H - 48, 24, 48, ue(0.24), ec, { step: 22, major: 4, tick: 4, side: 1 });
  // centre registration: a ring and cross, then the rulers draw out from the centre (the horizontal one becomes the
  // split line the picture opens on; the vertical one and the ring retract just before)
  const cx = W / 2, cy = H / 2;
  const kc = ease.outExpo(clamp((t - T.bt(2)) / 0.35));
  const retract = 1 - ease.inCubic(clamp((t - (T.lock - 0.16)) / 0.16));
  if (kc > 0 && t < T.lock) {
    const col = WHITE(0.8);
    c.strokeStyle = col; c.lineWidth = 1.2;
    c.beginPath(); c.arc(cx, cy, 34 * kc * retract, 0, Math.PI * 2 * kc); c.stroke();
    hair(c, cx - 14 * retract, cy, cx + 14 * retract, cy, CORAL(), 1.5); hair(c, cx, cy - 14 * retract, cx, cy + 14 * retract, CORAL(), 1.5);
    const uh = ease.outCubic(clamp((t - T.bt(2) - 0.1) / 0.6));
    const uv = ease.outCubic(clamp((t - T.bt(2) - 0.2) / 0.5)) * retract;
    tickRuler(c, cx + 48, cy, W - 140, cy, uh, WHITE(0.6), { step: 40, major: 5, tick: 5, side: 0 });
    tickRuler(c, cx - 48, cy, 140, cy, uh, WHITE(0.6), { step: 40, major: 5, tick: 5, side: 0 });
    tickRuler(c, cx, cy - 48, cx, 170, uv, WHITE(0.5), { step: 40, major: 5, tick: 5, side: 0 });
    tickRuler(c, cx, cy + 48, cx, 910, uv, WHITE(0.5), { step: 40, major: 5, tick: 5, side: 0 });
  }
  c.restore();
}

/** The system panel (the house dark panel, header SYSTEM CHECK): types SOURCES, a meter fills (no count — the fact
 *  sheet prints none, and a number here would have to agree with the roll and the description), LOADED lands once the
 *  meter is full, then FACTS CHECKED and the date as one token (no partial date ever shows), and the header status flips
 *  BOOT → READY on the bar line before the intro.
 *  Placed for C03 under storyboard.d's camera (z 1.32 → 1.38, pan y +0.115, which lifts the whole upper unit — badge,
 *  LEDs — off the top edge and both amber LEDs off the right): measured off the conformed frames, the rack's lower CPU
 *  badge (a maker's badge, glow included) maps to x 1382–1511, y 604–754 over the shot and the lower green LEDs to
 *  x 1488–1656, y 680–809; this panel (x 1290–1830, y 594–820) keeps both covered from C03's first frame to the cut.
 *  It is hidden before the cut (it leads it by 0.1 s, so its first visible frame is ~88 % unrolled, already over them)
 *  and stays opaque until the cut to I01, so C02's hand is never covered and the badge never shows through. */
const SYS = { x: 1290, y: 594, w: 540, h: 226 };
function systemCard(c: CanvasRenderingContext2D, X: X, T: CT) {
  const t = X.t, a = T.card;
  if (t < T.b2) return;
  const { x, y, w, h } = SYS;
  const ready = t >= T.b3;
  panel(c, x, y, w, h, {
    // no alpha exit: fully opaque on every C03 frame (cold is drawn only while a cold shot is up), gone on the cut
    k: enter(t, a, DUR.panel), title: 'SYSTEM CHECK',
    draw: (p) => {
      // header status, right: BOOT (dim) → READY (bright, the coral live dot blinking on the half beat)
      const st = ready ? 'READY' : 'BOOT';
      const sw = text(c, st, x + w - 16, y + 25, FONT.mono(600), 13, ready ? WHITE(0.95) : WHITE(0.5), { align: 'right', track: 1.6 });
      const blink = Math.floor(X.beat() * 2) % 2 === 0;
      c.fillStyle = ready ? CORAL(blink ? 1 : 0.35) : WHITE(0.3);
      c.beginPath(); c.arc(x + w - 30 - sw, y + 20.5, 4.5, 0, Math.PI * 2); c.fill();
      // line 1: SOURCES types on the cut; the meter under it fills to the half bar; LOADED lands only once it is full
      // (the caret holds while it loads)
      const fs = 17, fam = FONT.mono(600), tr = 1.4, lx = p.inner.x;
      const s1a = 'SOURCES ', s1b = 'LOADED';
      const l1 = T.b2 + 0.12, cps = 44;
      const c0 = l1 + s1a.length / cps, c1 = Math.max(c0 + 0.3, T.bt(10)), c2 = c1 + s1b.length / cps;
      const m = t < c0 ? 0 : ease.outCubic(clamp((t - c0) / (c1 - c0)));
      const y1 = p.body.y + 62;
      text(c, '›', lx, y1, fam, fs, WHITE(0.55));
      const s1 = t < c1 ? typedPart(s1a, t, l1, cps) : s1a + typedPart(s1b, t, c1, cps);
      const w1 = text(c, s1, lx + 20, y1, fam, fs, WHITE(0.95), { track: tr });
      if (t < c2 && t >= l1) { c.fillStyle = WHITE(0.9); c.fillRect(lx + 22 + w1, y1 - fs * 0.8, fs * 0.55, fs); }
      const mx = lx + 20, my = y1 + 11, mw = p.inner.w - 20;
      c.fillStyle = WHITE(0.12); c.fillRect(mx, my, mw, 3);
      c.fillStyle = WHITE(0.9); c.fillRect(mx, my, mw * m, 3);
      // line 2 once LOADED is in: the label types, the date lands whole (never a partial date beside the label)
      const l2 = c2 + 0.08, head = 'FACTS CHECKED ', s2 = head + '18 OCT 2026';
      if (t >= l2) {
        const tDate = l2 + head.length / 40;
        const y2 = p.body.y + 134, shown = t < tDate ? typedPart(head, t, l2, 40) : s2;
        text(c, '›', lx, y2, fam, fs, WHITE(0.55));
        const w2 = text(c, shown, lx + 20, y2, fam, fs, WHITE(0.95), { track: tr });
        if (shown.length < s2.length || Math.floor(t * 2.4) % 2 === 0) { c.fillStyle = WHITE(0.9); c.fillRect(lx + 22 + w2, y2 - fs * 0.8, fs * 0.55, fs); }
      }
    },
  });
}

// =====================================================================================================================
// INTRO
// =====================================================================================================================
function introT(X: X) {
  const h = X.W('Humans', 0), m = X.W('Humans', 1), e = X.W('Humans', 2);
  const L = X.L('This is the state of AI');
  const i2 = X.S('I02')?.t0 ?? m.start, i3 = X.S('I03')?.t0 ?? e.start, i4 = X.S('I04')?.t0 ?? L.start - 0.3;
  return { h, m, e, L, i2, i3, i4, t1: X.ch.t1 };
}
type IT = ReturnType<typeof introT>;

/** One tag per word, on the real subject of the shot it lands on. Boxes are in SOURCE-frame fractions read off the
 *  conformed frames (a → b over the shot), mapped through the shot's camera by X.px so they ride its push:
 *    HUMANS    I01: the crowd surging off the train on the right platform — dozens of people, heads a few px tall
 *    MODELS    I02: the in-focus row of the board (the QZ chip, the capacitor, the M.O. chip) under the cam push
 *    EVERYONE  I03: the whole crowd along the bottom, backs of heads and raised hands, edge to edge
 *  Always a group, never one person: the YOLO tracks on these clips only find single people (one walker on the
 *  platform edge, single heads in the concert crowd), so they are not used for the tags. */
type Q = [number, number, number, number];
const TAGS: { k: string; shot: string; a: Q; b: Q }[] = [
  { k: 'HUMANS', shot: 'I01', a: [0.515, 0.655, 0.765, 0.97], b: [0.52, 0.65, 0.77, 0.97] },
  { k: 'MODELS', shot: 'I02', a: [0.292, 0.444, 0.643, 0.616], b: [0.292, 0.444, 0.643, 0.616] },
  { k: 'EVERYONE', shot: 'I03', a: [0.075, 0.715, 0.94, 0.99], b: [0.075, 0.705, 0.94, 0.99] },
];
/** A tag's box in frame px this frame: the source box (lerped over its shot) through the camera, kept inside the
 *  graphics zones — clear of the left ruler, the right edge, the ticker band, and below the lyric block. */
function tagRect(X: X, g: (typeof TAGS)[number]): Box | null {
  const s = X.S(g.shot);
  if (!s || X.shot.id !== g.shot) return null;
  const u = ease.inOutQuad(X.u(s.t0, s.t1));
  const r = X.px(g.a.map((v, i) => lerp(v, g.b[i]!, u)) as Q);
  // bottom clamp 976: every box (EVERYONE's frame-wide one included) stays ≥ 14 px above the timecode's caps (≈ 990)
  const x0 = Math.max(112, r.x), x1 = Math.min(1828, r.x + r.w), y0 = Math.max(440, r.y), y1 = Math.min(976, r.y + r.h);
  return x1 - x0 > 40 && y1 - y0 > 40 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
}

/** A CV tag in the kit cvBox's weight (1.6 px corner brackets, a 19 px white class tab in 13 px mono): it snaps in
 *  with an overshoot capped at 60 px so a frame-wide box stays inside the frame, a crosshair draws in from the box
 *  edges to the one coral element, the reticle. */
function tagBox(c: CanvasRenderingContext2D, b: Box, s: string, t: number, a: number, z: number) {
  if (t < a || t >= z) return;
  const k = ease.outExpo(clamp((t - a) / 0.24));
  const out = 1 - ease.inCubic(clamp((t - (z - 0.1)) / 0.1));
  const sc = lerp(1 + Math.min(0.16, 60 / Math.max(b.w, b.h)), 1, k);
  const jx = (hash(fi(t), 5) - 0.5) * 1.2, jy = (hash(fi(t), 6) - 0.5) * 1.2;
  const w = b.w * sc, h = b.h * sc, x0 = b.x + (b.w - w) / 2 + jx, y0 = b.y + (b.h - h) / 2 + jy;
  const cx = x0 + w / 2, cy = y0 + h / 2;
  c.save();
  c.globalAlpha *= clamp(k * 2) * out;
  c.strokeStyle = WHITE(0.22); c.lineWidth = 1; c.strokeRect(x0, y0, w, h);
  const l = Math.min(w, h) * 0.16;
  c.strokeStyle = WHITE(0.92); c.lineWidth = 1.6;
  c.beginPath();
  for (const [px, py, sx, sy] of [[x0, y0, 1, 1], [x0 + w, y0, -1, 1], [x0, y0 + h, 1, -1], [x0 + w, y0 + h, -1, -1]] as const) {
    c.moveTo(px + sx * l, py); c.lineTo(px, py); c.lineTo(px, py + sy * l);
  }
  c.stroke();
  // crosshair
  const gap = 22, ck = ease.outCubic(clamp((t - a) / 0.3));
  const hc = WHITE(0.42);
  hair(c, x0, cy, lerp(x0, cx - gap, ck), cy, hc, 1); hair(c, x0 + w, cy, lerp(x0 + w, cx + gap, ck), cy, hc, 1);
  hair(c, cx, y0, cx, lerp(y0, cy - gap, ck), hc, 1); hair(c, cx, y0 + h, cx, lerp(y0 + h, cy + gap, ck), hc, 1);
  c.strokeStyle = CORAL(); c.lineWidth = 1.6;
  c.beginPath(); c.arc(cx, cy, 12, 0, Math.PI * 2); c.stroke();
  hair(c, cx - 6, cy, cx + 6, cy, CORAL(), 1.6); hair(c, cx, cy - 6, cx, cy + 6, CORAL(), 1.6);
  // class tab, above the top-left corner (the kit's tab)
  const lab = s.toUpperCase(), ty = y0 - 21;
  c.fillStyle = WHITE(0.95); c.fillRect(x0, ty, tabWidth(lab), 19);
  text(c, lab, x0 + 6, ty + 14, FONT.mono(600), 13, INK(), { track: 1 });
  c.restore();
}

function introTags(c: CanvasRenderingContext2D, X: X, I: IT) {
  const t = X.t;
  const ends = [Math.max(I.i2, I.m.start), Math.max(I.i3, I.e.start), I.i4];
  [I.h, I.m, I.e].forEach((w, i) => {
    const g = TAGS[i]!, b = tagRect(X, g);
    if (b) tagBox(c, b, g.k, t, w.start, ends[i]!);
  });
}

/** The masthead lockup: the intro's second line, drawn here word by word.
 *    THIS IS                (kicker, the lyric voice)
 *    THE STATE              (slammed on "state"; the rest ghosted in the lyric voice's coral until sung)
 *    OF AI
 *    ───────────
 *    OCTOBER 2026                                                                                              */
function lockup(c: CanvasRenderingContext2D, X: X, I: IT) {
  const t = X.t, ws = I.L.words;
  if (ws.length < 8) return;
  // the kicker arrives on "This" itself: the engine's "Humans. Models. Everyone." block is gone by then (hideAt +
  // its fade), so no ghost of THIS IS ever sits on "Everyone."
  const show = ws[0]!.start - 0.02;
  if (t < show || t > I.t1) return;
  const wState = ws[3]!;
  const slam = wState.start;
  const al = vanish(t, I.t1, 0.2) * ease.outExpo(clamp((t - show) / 0.25));
  const fam = FONT.grot(900), famK = FONT.grot(800);
  const x0 = 72;
  const S = Math.min(290, (1300 * 100) / measure('THE STATE', fam, 100, -3));
  const kS = 64, yK = 304;
  const y1 = yK + 34 + S * 0.73, y2 = y1 + S * 0.86, yR = y2 + 34;
  const S3 = S * 0.42, y3 = yR + 26 + S3 * 0.73;
  const tr = -S * 0.03;
  const lockW = measure('THE STATE', fam, S, tr);
  const slammed = t >= slam;
  c.save();
  c.globalAlpha *= al;
  // a soft pool under the lockup over footage only (the engine pools its own lyric blocks the same way)
  if (X.base?.kind === 'clip') {
    c.save();
    const cx = x0 + lockW * 0.45, cy = (yK + y3) / 2, rx = lockW * 0.75 + 160, ry = (y3 - yK) * 0.75 + 120;
    c.translate(cx, cy); c.scale(rx / ry, 1);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, ry);
    g.addColorStop(0, 'rgba(5,6,8,0.55)'); g.addColorStop(0.55, 'rgba(5,6,8,0.3)'); g.addColorStop(1, 'rgba(5,6,8,0)');
    c.globalAlpha *= appear(t, show, 0.3);
    c.fillStyle = g; c.fillRect(-ry, -ry, 2 * ry, 2 * ry);
    c.restore();
  }
  // kicker: "This is" in the lyric block's voice (ghosted ahead, white when sung, the current word coral)
  let kx = x0;
  for (let i = 0; i < 2; i++) {
    const w = ws[i]!, st = wordState(ws, i, t), s = w.w.replace(/[.,]/g, '').toUpperCase();
    const col = st === 'cur' ? CORAL() : st === 'sung' ? WHITE(0.97) : CORAL(0.22);
    const pop = st !== 'todo' ? 1 + 0.06 * (1 - ease.outCubic(clamp((t - w.start) / 0.18))) : 1;
    c.save(); c.translate(kx, yK); c.scale(pop, pop);
    text(c, s, 0, 0, famK, kS, col, { track: -kS * 0.02 });
    c.restore();
    kx += measure(s + ' ', famK, kS, -kS * 0.02);
  }
  // the lockup rows: tokens [word index, row]
  const rows: { i: number; row: number }[] = [{ i: 2, row: 1 }, { i: 3, row: 1 }, { i: 4, row: 2 }, { i: 5, row: 2 }, { i: 6, row: 3 }, { i: 7, row: 3 }];
  const sc = slammed ? 1 + 0.07 * (1 - ease.outExpo(clamp((t - slam) / 0.3))) : 1;
  c.save();
  c.translate(x0, (y1 + y3) / 2); c.scale(sc, sc); c.translate(-x0, -(y1 + y3) / 2);
  const cursor: Record<number, number> = { 1: x0, 2: x0, 3: x0 };
  for (const { i, row } of rows) {
    const w = ws[i]!, st = wordState(ws, i, t);
    const s = w.w.replace(/[.,]/g, '').toUpperCase();
    const size = row === 3 ? S3 : S, y = row === 1 ? y1 : row === 2 ? y2 : y3, trk = row === 3 ? -S3 * 0.02 : tr;
    const x = cursor[row]!;
    cursor[row] = x + measure(s + ' ', fam, size, trk);
    if (st === 'todo') {
      if (slammed) text(c, s, x, y, fam, size, CORAL(0.16), { track: trk }); // the lyric voice's ghost: still to come
      continue;
    }
    const pop = 1 + 0.05 * (1 - ease.outCubic(clamp((t - w.start) / 0.2)));
    c.save(); c.translate(x, y); c.scale(pop, pop);
    text(c, s, 0, 0, fam, size, st === 'cur' ? CORAL() : WHITE(0.97), { track: trk });
    c.restore();
  }
  // the rule between the title and the date, drawn on from the slam
  const kr = ease.outCubic(clamp((t - slam - 0.05) / 0.45));
  if (kr > 0) { c.fillStyle = WHITE(0.92); c.fillRect(x0 + 4, yR - 2, (lockW - 4) * kr, 4); }
  c.restore();
  c.restore();
  for (const w of ws) if (t >= w.start - 0.02) X.mark(w);
}

// =====================================================================================================================
// OUTRO
// =====================================================================================================================
function outroT(X: X) {
  const q = 'Made with AI';
  const made = X.W(q, 0), ai = X.W(q, 2), every = X.W(q, 3), sourced = X.W(q, 5), checked = X.W(q, 6);
  const lThis = X.L('This was the state'), lOct: Line = X.L('October, 2026', 1);
  const endB = Math.round(X.bar(X.ch.t1));
  const rollEnd = X.tBar(Math.ceil(X.bar(lOct.end) - 1e-3)); // the bar after "2026." ends
  const clear = Math.max(rollEnd + 1.5, X.tBar(endB - 2)); // card + roll clear, black rises, the line stands alone
  const ring = Math.max(clear + 0.8, X.tBar(endB - 1)); // the last bar: the chrome rings out
  return { t0: X.ch.t0, t1: X.ch.t1, made, ai, every, sourced, checked, lThis, lOct, rollEnd, clear, ring };
}
type OT = ReturnType<typeof outroT>;

/** The credits, verbatim. FOOTAGE lists exactly the source families of the conformed shots (media/credits.json, built
 *  from footage/picks.json: Coverr 14 clips, Mixkit 18, Pixabay 29 — Coverr License, Mixkit Stock Video Free License
 *  (every used Mixkit id is `videoFree` in footage/mixkit_licenses.json), Pixabay Content License — and NASA 4,
 *  Internet Archive 4, public domain), grouped by licence, one licence per line, so no bracket reads across providers
 *  it does not cover; names alphabetical within a line. No generated plates are used, so no PLATES credit. */
const CREDITS = {
  research: 'RESEARCHED & WRITTEN WITH CLAUDE (ANTHROPIC)',
  music: 'MUSIC: MINIMAX-MUSIC3 (AI-GENERATED)',
  footage: ['FOOTAGE: COVERR, MIXKIT, PIXABAY (FREE STOCK LICENSES),', 'NASA, INTERNET ARCHIVE (PUBLIC DOMAIN)'],
  checked: 'FACTS CHECKED 18 OCT 2026',
};
/** The house paper panel, lower left. Its right edge (780) stays left of the Z02 walker (x ≥ 798 over the whole shot
 *  under storyboard.d's camera), so the card never covers the subject. */
const CARD = { x: 110, w: 670, h: 330 };
const CARD_Y = 990 - CARD.h;
const STAMP = { size: 20, rot: -0.05 };

function creditCard(c: CanvasRenderingContext2D, X: X, O: OT) {
  const t = X.t, a = O.made.start - 0.05;
  if (t < a || t >= O.clear) return;
  const { x, w, h } = CARD, y = CARD_Y;
  panel(c, x, y, w, h, {
    paper: true, k: enter(t, a, DUR.panel), alpha: leave(t, O.clear, 0.25),
    title: 'THE STATE OF AI · OCTOBER 2026', titleRight: 'END CARD',
    draw: (p) => {
      const ix = p.inner.x, iy = p.inner.y, iw = p.inner.w;
      text(c, 'CREDITS', ix, iy + 34, FONT.grot(900), 40, INK(0.96), { track: -1 });
      hair(c, ix, iy + 52, ix + iw, iy + 52, INK(0.7), 1.5);
      // one credit per spoken phrase, typed fast: "Made" · "AI." · "Every"
      const fam = FONT.mono(600), tr = 1.2;
      const fit = (s: string) => Math.min(16, (16 * iw) / measure(s, fam, 16, tr));
      const fs = Math.min(fit(CREDITS.research), fit(CREDITS.footage[0]!));
      const cps = 95;
      const ly = (i: number) => iy + 84 + i * 28;
      text(c, typedPart(CREDITS.research, t, O.made.start, cps), ix, ly(0), fam, fs, INK(0.92), { track: tr });
      text(c, typedPart(CREDITS.music, t, O.ai.start, cps), ix, ly(1), fam, fs, INK(0.92), { track: tr });
      text(c, typedPart(CREDITS.footage[0]!, t, O.every.start, cps), ix, ly(2), fam, fs, INK(0.92), { track: tr });
      const ind = measure('FOOTAGE: ', fam, fs, tr);
      const f2 = O.every.start + CREDITS.footage[0]!.length / cps;
      text(c, typedPart(CREDITS.footage[1]!, t, f2, cps), ix + ind, ly(3) - 2, fam, fs, INK(0.92), { track: tr });
      hair(c, ix, iy + 184, ix + iw, iy + 184, INK(0.7), 1.5);
      barcode(c, ix, iy + 198, 200, 40, 1802);
      // FACTS CHECKED stamped on "Checked", right of the barcode
      const sw = stampWidth(CREDITS.checked, STAMP.size);
      monoStamp(c, CREDITS.checked, ix + iw - sw / 2 - 6, iy + 218, t, O.checked.start, STAMP);
    },
  });
}

const stampWidth = (s: string, size: number) => measure(s, FONT.mono(800), size, size * 0.06) + size * 1.1;

/** A rubber stamp in the mono voice (the kit's grotesk stamp closes up the word spaces at this size): slammed in
 *  with an overshoot, worn. Same motion as kit.stamp. */
function monoStamp(c: CanvasRenderingContext2D, s: string, x: number, y: number, t: number, t0: number, o: { size?: number; rot?: number } = {}) {
  if (t < t0) return;
  // overshoot capped at ~1.11× so the slam stays inside the card's 30 px margin (the panel clip never cuts a digit)
  const k = clamp((t - t0) / 0.18), sc = 1 + 0.15 * (1 - ease.outBack(k));
  const size = o.size ?? 22, col = CORAL(0.94), fam = FONT.mono(800), tr = size * 0.06;
  const w = measure(s, fam, size, tr) + size * 1.1, h = size * 1.7;
  c.save();
  c.translate(x, y); c.rotate(o.rot ?? -0.06); c.scale(sc, sc);
  c.globalAlpha *= clamp(k * 2);
  c.strokeStyle = col; c.lineWidth = Math.max(2, size * 0.11);
  c.strokeRect(-w / 2, -h / 2, w, h);
  text(c, s, -w / 2 + size * 0.55, size * 0.36, fam, size, col, { track: tr });
  c.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 46; i++) c.fillRect(-w / 2 + hash(i, 1) * w, -h / 2 + hash(i, 2) * h, 1 + hash(i, 3) * 3, 1 + hash(i, 4) * 2);
  c.restore();
}

/** The source roll: the fact sheet section 6 sources behind the film's beats (S1–S54) and the dates the dates chapter
 *  shows (28 OCT: S83 + S101, the Federal Reserve's FOMC calendar, section 7's source for the 27–28 Oct meeting;
 *  03 NOV: S86; 09–10 NOV: S87, S88, S89; 02 DEC: S93; 10 JAN 2027: S95), as publisher · short title · date (no URLs).
 *  Groups follow section 6; the first group runs in launch order (B01's chronology), so the roll opens on the first
 *  launch, not on any one lab. Left out: the vendor release S55 (B16: not the source of record), the what-to-watch
 *  sources behind no date on screen (S82, S84, S85, S90–S92, S94, S96, S97), the bench (S56–S81, claims the film does
 *  not make) and the production licences (S98–S100: MiniMax is credited on the card, no generated images are used).
 *  The full list is in the description the footer points to. A short title keeps every qualifier of the original
 *  (testing, attribution, "and war", "certain … items"). */
type Src = [pub: string, title: string, date: string];
const ROLL: { h: string; s: Src[] }[] = [
  { h: 'LAUNCHES, INDEX, GATING · STORIES 01–03', s: [
    ['OPENAI', 'GPT-6 ASTRA', 'SEP 2026'],
    ['xAI', 'GROK 4.7', 'SEP 2026'],
    ['OPENAI', 'INTRODUCING GPT-6 SOL AND LUNA', 'SEP 2026'],
    ['ANTHROPIC', 'CLAUDE OPUS 5.5', 'SEP 2026'],
    ['ANTHROPIC', 'NEWSROOM', 'READ OCT 2026'],
    ['OPENAI', 'INTRODUCING GPT-6.1 SOL', 'SEP 2026'],
    ['GOOGLE', 'GEMINI 4 ARGON (VETTED-DEFENDER ROLLOUT)', 'SEP 2026'],
    ['META', 'INTRODUCING MUSE WONDER MODELS', 'OCT 2026'],
    ['ARTIFICIAL ANALYSIS', 'INTELLIGENCE INDEX LEADERBOARD', 'READ OCT 2026'],
    ['ANTHROPIC', 'PROJECT GLASSWING', 'APR 2026'],
    ['ANTHROPIC', 'CLAUDE MYTHOS PAGE', 'JUN 2026, UPDATED OCT 2026'],
    ['GOOGLE', 'INTRODUCING GEMINI 4 ARGON', 'OCT 2026'],
  ] },
  { h: 'OPEN WEIGHTS AND GLOBAL · STORY 04', s: [
    ['EPOCH AI', 'OPEN VS CLOSED ECI GAP', 'MAY 2026'],
    ['HUGGING FACE', 'STATE OF OPEN SOURCE: SPRING 2026', 'MAR 2026'],
    ['NIST CAISI', 'ASSESSMENT OF GLM-5.3 CYBER CAPABILITIES', 'SEP 2026'],
  ] },
  { h: 'CAPEX, POWER, FINANCIAL RISK · STORIES 05–07', s: [
    ['IEA', 'KEY QUESTIONS ON ENERGY AND AI', 'APR 2026'],
    ['IEA', 'WORLD ENERGY INVESTMENT 2026', 'JUN 2026'],
    ['AMERICAN PUBLIC POWER ASSOCIATION', 'PJM 2028/29 CAPACITY AUCTION', 'JUL 2026'],
    ['OCTUS', 'PJM 2028/29 AUCTION CLEARS AT CAP', 'JUL 2026'],
    ['IMF', 'GLOBAL FINANCIAL STABILITY REPORT, CH. 1', 'OCT 2026'],
    ['IMF', 'GFSR BACKGROUND ANALYSIS 1.1', 'OCT 2026'],
    ['THE NEXT WEB', 'IMF ON CIRCULAR AI DEALS', 'OCT 2026'],
    ['REUTERS VIA BUSINESSDAY', 'IMF WARNS OF RISKS FROM AI MARKET CORRECTION AND WAR', 'OCT 2026'],
  ] },
  { h: 'SAFETY INCIDENTS AND TEST-AWARENESS · STORIES 08–10', s: [
    ['METR', 'OPENAI–HUGGING FACE INCIDENT INVESTIGATION', 'AUG 2026'],
    ['REDWOOD RESEARCH', 'HUGGING FACE INCIDENT', 'AUG 2026'],
    ['HUGGING FACE', 'SECURITY INCIDENT DISCLOSURE', 'JUL 2026'],
    ['HUGGING FACE', 'AGENT INTRUSION TECHNICAL TIMELINE', 'JUL 2026'],
    ['OPENAI', 'HUGGING FACE MODEL-EVALUATION SECURITY INCIDENT', 'JUL 2026'],
    ['OPENAI', 'THE HUGGING FACE INCIDENT AND THE ROAD AHEAD', 'AUG 2026'],
    ['INCIBE-CERT', "INCIDENT INVOLVING OPENAI'S AI AGENTS", 'SEP 2026'],
    ['ANTHROPIC', 'INVESTIGATING INCIDENTS IN CYBERSECURITY EVALS', 'JUL 2026'],
    ['ANTHROPIC', 'ALIGNMENT ASSESSMENT OF THE CYBERSECURITY INCIDENTS', 'SEP 2026'],
    ['UK AISI', 'UNSANCTIONED AGENT BEHAVIOUR DURING CYBER TESTING', 'AUG 2026'],
    ['META', 'ADDRESSING A THIRD-PARTY TESTING MISCONFIGURATION', 'AUG 2026'],
    ['ANTHROPIC', 'CLAUDE OPUS 5.5 ANNOUNCEMENT', 'SEP 2026'],
    ['UK AISI', 'GPT-6 ASTRA: SUPPLY-CHAIN ATTACKS IN SIMULATIONS', 'SEP 2026'],
    ['UK AISI', 'BLOG: EVALUATION AWARENESS', 'OCT 2026'],
    ['INTERNATIONAL AI SAFETY REPORT 2026', '', 'FEB 2026'],
  ] },
  { h: 'POLICY · STORIES 11–12', s: [
    ['THE WHITE HOUSE', 'EXECUTIVE ORDER 14434', 'SEP 2026'],
    ['THE WHITE HOUSE', 'FACT SHEET ON EO 14434', 'SEP 2026'],
    ['THE WHITE HOUSE', 'EXECUTIVE ORDER 14409', 'JUN 2026'],
    ['OFFICE OF THE GOVERNOR OF CALIFORNIA', 'AI BILL PACKAGE', 'SEP 2026'],
    ['EURONEWS', "EU'S AI RULES FACE FIRST ENFORCEMENT TEST", 'OCT 2026'],
    ['MATHESON', "THE COMMISSION'S FIRST USE OF AI ACT POWERS", 'SEP 2026'],
    ['THE NEXT WEB', 'FTC DEMANDS TO OPENAI AND ANTHROPIC', 'OCT 2026'],
  ] },
  { h: 'WORK AND PUBLIC OPINION · STORIES 13–14', s: [
    ['AP VIA FORTUNE', 'IMF GROWTH FORECAST AND AI', 'OCT 2026'],
    ['IMF BLOG', 'AI WILL TRANSFORM THE GLOBAL ECONOMY', 'JAN 2024'],
    ['STANFORD DIGITAL ECONOMY LAB', 'CANARIES IN THE COAL MINE', 'AUG 2026'],
    ['QUINNIPIAC UNIVERSITY POLL', 'RELEASE 3969 (US ADULTS)', 'SEP 2026'],
    ['QUINNIPIAC UNIVERSITY POLL', 'RELEASE 3968 (REGISTERED VOTERS)', 'SEP 2026'],
  ] },
  { h: 'HOPEFUL SCIENCE AND HEALTH · STORIES 15–16', s: [
    ['NATURE', 'AI TROPICAL-CYCLONE FORECASTING', 'AUG 2026'],
    ['NOAA / NATIONAL WEATHER SERVICE', 'AI HURRICANE FORECASTING Q&A', '2026'],
    ['NATIONAL HURRICANE CENTER', '2026 ADVISORY ARCHIVE', 'OCT 2026'],
    ['ASCO POST', 'MASAI RANDOMISED TRIAL (THE LANCET)', 'FEB 2026'],
  ] },
  { h: 'WHAT TO WATCH · DATES', s: [
    ['MICROSOFT', 'INVESTOR RELATIONS', 'READ OCT 2026'],
    ['FEDERAL RESERVE', 'FOMC MEETING CALENDARS', 'READ OCT 2026'],
    ['REUTERS VIA STAR-ADVERTISER', 'AI DEEPFAKES IN MIDTERM CAMPAIGNS', 'MAR 2026'],
    ['FEDERAL REGISTER', 'BIS AFFILIATES RULE SUSPENSION', 'NOV 2025'],
    ['JONES DAY', 'BIS SUSPENDS AFFILIATES RULE; CHINA PAUSES RARE-EARTH EXPORT CONTROLS', 'NOV 2025'],
    ['PILLSBURY', 'CHINA SUSPENDS EXPORT CONTROLS ON CERTAIN CRITICAL MINERALS-RELATED ITEMS', 'NOV 2025'],
    ['ARTIFICIALINTELLIGENCEACT.EU', 'DIGITAL OMNIBUS, REGULATION (EU) 2026/1744', 'IN FORCE JUL 2026'],
    ['REUTERS VIA INTERNAZIONALE', 'CHINA ON US TRADE TRUCE EXTENSION', 'SEP 2026'],
  ] },
];
const CTA = 'FULL SOURCE LIST WITH LINKS IN THE DESCRIPTION';

/** The roll as laid-out rows (y within the content, heading or entry). */
const ROW_H = 22, GROUP_H = 34;
const ROWS: { y: number; h?: string; s?: Src }[] = (() => {
  const out: { y: number; h?: string; s?: Src }[] = [];
  let y = 10;
  ROLL.forEach((g, gi) => {
    if (gi > 0) y += GROUP_H - ROW_H;
    out.push({ y, h: g.h }); y += ROW_H + 2;
    for (const s of g.s) { out.push({ y, s }); y += ROW_H; }
  });
  return out;
})();
const ROLL_H = ROWS[ROWS.length - 1]!.y + 42; // the last row settles clear of the bottom feather

/** The house dark panel, right. Its left edge (1120) stays right of the Z02 walker and the case he carries (x ≤ 1115
 *  over the whole shot under storyboard.d's camera). */
const PANEL = { x: 1120, y: 268, w: 710, h: 722 };
const FOOT = 44; // the CTA strip

/** The roll steps rather than crawls, so each page holds still long enough to read: STEPS equal moves (half a page
 *  each), every one landing on a bar line, the last on the bar after "2026." (rollEnd), where the roll stops with its
 *  last row in view. Returns the distance fraction 0..1. */
const STEPS = 4, MOVE_D = 0.62;
function rollSteps(X: X, rollEnd: number) {
  const eb = Math.round(X.bar(rollEnd));
  let u = 0;
  for (let k = 0; k < STEPS; k++) {
    const land = X.tBar(eb - (STEPS - 1 - k));
    u += ease.inOutCubic(clamp((X.t - (land - MOVE_D)) / MOVE_D)) / STEPS;
  }
  return u;
}

function sourceRoll(c: CanvasRenderingContext2D, X: X, O: OT) {
  const t = X.t, a = O.sourced.start;
  if (t < a || t >= O.clear) return;
  const { x, y, w, h } = PANEL;
  panel(c, x, y, w, h, {
    k: enter(t, a, DUR.panel), alpha: leave(t, O.clear, 0.25), title: 'SOURCES', titleRight: 'PUBLISHER · TITLE · DATE',
    draw: () => {
      // footer strip: the call to the description, typed once the panel is open; a coral mark once the roll has run
      const fy = y + h - FOOT;
      c.fillStyle = WHITE(0.18); c.fillRect(x, fy, w, 1);
      const ctaShown = typedPart(CTA, t, a + 0.35, 60);
      const done = t >= O.rollEnd;
      if (done) { c.fillStyle = CORAL(); c.fillRect(x + 16, fy + 17, 9, 9); }
      text(c, ctaShown, x + (done ? 36 : 16), fy + 27, FONT.mono(600), 14, WHITE(0.94), { track: 1.4 });
      // the roll: the first page cascades in and holds, then it steps a half page per bar to its last row by the bar
      // after "2026."
      const vy0 = y + HEAD_H + 8, vy1 = fy - 6, vh = vy1 - vy0;
      const maxOff = Math.max(0, ROLL_H - vh);
      const off = maxOff * rollSteps(X, O.rollEnd);
      c.save();
      c.beginPath(); c.rect(x + 1, vy0, w - 2, vh); c.clip();
      const pubF = FONT.mono(600), restF = FONT.mono(400), maxW = w - 32 - 14;
      ROWS.forEach((r, i) => {
        const ry = vy0 + r.y - off + 16;
        if (ry < vy0 - 4 || ry > vy1 + ROW_H) return;
        const edge = clamp((ry - vy0) / 18) * clamp((vy1 - ry + 6) / 18);
        const rk = clamp((t - a - 0.25 - i * 0.012) / 0.14);
        if (rk <= 0 || edge <= 0) return;
        c.save(); c.globalAlpha *= edge * rk;
        if (r.h) {
          const hw = text(c, r.h, x + 16, ry, FONT.mono(600), 12, WHITE(0.6), { track: 2 });
          hair(c, x + 28 + hw, ry - 4, x + w - 18, ry - 4, WHITE(0.18));
        } else if (r.s) {
          const [p, ti, d] = r.s;
          const rest = (ti ? ` · ${ti}` : '') + ` · ${d}`;
          // 14 px, scaled down to fit a long row (never below the 11 px source-type floor; then the tracking tightens)
          let fs = 14, tr = 0.6;
          const wAt = (s: number, k: number) => measure(p, pubF, s, k) + measure(rest, restF, s, k);
          if (wAt(fs, tr) > maxW) fs = Math.max(11, (fs * maxW) / wAt(fs, tr));
          if (wAt(fs, tr) > maxW) tr = Math.max(0, tr - (wAt(fs, tr) - maxW) / Array.from(p + rest).length);
          const pw = text(c, p, x + 16, ry, pubF, fs, WHITE(0.96), { track: tr });
          text(c, rest, x + 16 + pw, ry, restF, fs, WHITE(0.74), { track: tr });
        }
        c.restore();
      });
      c.restore();
      // scrollbar
      const th = vh * clamp(vh / ROLL_H), ty = vy0 + (vh - th) * (maxOff ? off / maxOff : 0);
      c.fillStyle = WHITE(0.1); c.fillRect(x + w - 7, vy0, 2, vh);
      c.fillStyle = WHITE(0.6); c.fillRect(x + w - 7, ty, 2, th);
    },
  });
}

/** After the roll: the frame clears to black and the one line stays, then black. */
function endSlate(c: CanvasRenderingContext2D, X: X, O: OT) {
  const t = X.t;
  if (t < O.clear - 0.05) return;
  // black over the footage
  c.fillStyle = BLACK(ease.inOutQuad(clamp((t - O.clear + 0.05) / 0.6)));
  c.fillRect(0, 0, W, H);
  const a = O.clear + 0.12, z = O.t1 - 0.55;
  if (t < a || t >= z) return;
  c.save();
  c.globalAlpha *= vanish(t, z, 0.45);
  const fs = 26, fam = FONT.mono(600), tr = 2.2;
  const cw = measure(CTA, fam, fs, tr), x0 = (W - cw) / 2, y0 = H / 2 + 10;
  const kr = ease.outCubic(clamp((t - a) / 0.4));
  c.fillStyle = CORAL(); c.fillRect(x0, y0 - 56, 64 * kr, 4);
  label(c, 'THE STATE OF AI · OCTOBER 2026', x0 + 80, y0 - 49, WHITE(0.6 * kr), 13);
  const shown = typedPart(CTA, t, a + 0.1, 62);
  const sw = text(c, shown, x0, y0, fam, fs, WHITE(0.95), { track: tr });
  if (shown.length < CTA.length || Math.floor(t * 2.4) % 2 === 0) { c.fillStyle = WHITE(0.9); c.fillRect(x0 + sw + 4, y0 - fs * 0.8, fs * 0.55, fs); }
  c.restore();
}

// =====================================================================================================================
export const chapters: Record<string, Chapter> = {
  cold: {
    draw(c, X) {
      const T = coldT(X);
      coldCover(c, X, T);
      bootGuides(c, X, T);
      systemCard(c, X, T);
    },
    chrome(X) { const T = coldT(X); return bootLevel(X, T.bt(2), T.lock); },
    post(X, o) {
      const T = coldT(X);
      // the broadcast goes live: one short white pop when the chrome locks and the picture opens
      const p = X.t >= T.lock ? Math.pow(0.5, (X.t - T.lock) / 0.03) : 0;
      if (p > 0.01) o.flash = Math.max(o.flash ?? 0, 0.035 * p);
      return o;
    },
  },
  intro: {
    draw(c, X) {
      const I = introT(X);
      introTags(c, X, I);
      lockup(c, X, I);
    },
    post(X, o) {
      const I = introT(X);
      const s = I.L.words[3];
      if (s && X.t >= s.start) {
        const p = Math.pow(0.5, (X.t - s.start) / 0.07);
        o.zoom = (o.zoom ?? 1) * (1 + 0.025 * p); // a punch-in on the slam (no flash: it lifts the blacks)
      }
      return o;
    },
  },
  outro: {
    draw(c, X) {
      const O = outroT(X);
      creditCard(c, X, O);
      sourceRoll(c, X, O);
      endSlate(c, X, O);
    },
    chrome(X) {
      const O = outroT(X);
      return 1 - ease.inOutQuad(X.u(O.ring, O.t1 - 0.35));
    },
  },
};

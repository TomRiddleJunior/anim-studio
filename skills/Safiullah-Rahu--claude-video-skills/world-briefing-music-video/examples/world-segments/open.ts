// THE STATE OF THE WORLD — segments `cold` (the intro over a sparse beat) and `bigpicture` (verse lines 1–4).
//
// cold:       the hormuz_dusk plate breathing (Ken Burns + a small kick breath), lit up from a night grade on the
//             first downbeat; mono datelines as ink slugs; a reticle on the smoking ship; Brent's close as the one
//             big numeral on the paper sky; then the plate falls back into the night grade for the title card
//             "The State of the World" (the chrome boots after the last intro line).
// bigpicture: the title holds across the downbeat while the plate dissolves into the shared night globe (X.view()),
//             then one counter per lyric line on the left, each landing on its number word: IMF growth / inflation,
//             117.8 million forcibly displaced (a unit grid), UN appeals 42.4% funded (a bar), August +1.65 °C
//             (a thermometer stripe, the globe's rim warming with it).
// Every number is from research/FACTSHEET.md §0 and carries the sheet's source label.
import type { Segment, X } from '../x';
import type { Word } from '../../engine/lyrics';
import {
  W, H, C, PAPER, INK, RED, SLATE, NIGHT, FONT, text, label, pill, hair,
  appear, vanish, life, countTo, measure, clamp, ease, lerp, rgbaHex,
} from '../kit';

type Ctx = CanvasRenderingContext2D;

// ------------------------------------------------------------------------------------------------ helpers
/** A typed mono slug: an ink chip with paper caps, revealing n characters (with a caret while typing). */
function slug(c: Ctx, s: string, x: number, y: number, n: number, o: { size?: number; dot?: boolean; alpha?: number } = {}) {
  const size = o.size ?? 22, fam = FONT.mono(500), track = size * 0.14;
  const str = s.toUpperCase(), shown = str.slice(0, Math.max(0, Math.min(str.length, Math.floor(n))));
  const padX = size * 0.6, dotW = o.dot ? size * 0.9 : 0;
  const wNow = shown.length ? measure(shown, fam, size, track) : 0;
  const typing = shown.length < str.length;
  const boxW = padX * 2 + dotW + wNow + (typing ? size * 0.6 : 0);
  c.save();
  if (o.alpha != null) c.globalAlpha *= o.alpha;
  c.fillStyle = INK(0.94);
  c.fillRect(x, y - size * 1.12, boxW, size * 1.62);
  if (o.dot) { c.fillStyle = RED(); c.fillRect(x + padX, y - size * 0.62, size * 0.5, size * 0.5); }
  text(c, shown, x + padX + dotW, y, fam, size, PAPER(0.97), { track });
  if (typing) { c.fillStyle = RED(); c.fillRect(x + padX + dotW + wNow + 3, y - size * 0.78, size * 0.42, size * 0.92); }
  c.restore();
  return boxW;
}
const slugW = (s: string, size: number, dot = false) => size * 0.6 * 2 + (dot ? size * 0.9 : 0) + measure(s.toUpperCase(), FONT.mono(500), size, size * 0.14);

/** The characters of a label revealed in parts, each part typed from its own word's start. */
function typedBy(t: number, parts: { s: string; t0: number; cps?: number }[]) {
  let out = '';
  for (const p of parts) {
    if (t < p.t0) break;
    const n = Math.floor((t - p.t0) * (p.cps ?? 46));
    out += p.s.slice(0, n);
    if (n < p.s.length) break;
  }
  return out;
}
/** Frame position of a point (px, py in 0..1 of a 16:9 plate) under X.plate's cover fit, zoom z and drift (dx, dy). */
const onPlate = (px: number, py: number, z: number, dx: number, dy: number) =>
  ({ x: (W - W * z) / 2 + dx * W + px * W * z, y: (H - H * z) / 2 + dy * H + py * H * z });

/** A serif numeral with a smaller unit at baseline y. Returns the total width. */
function numeral(c: Ctx, s: string, unit: string, x: number, y: number, size: number, col: string, o: { align?: 'left' | 'center'; unitSize?: number; unitCol?: string } = {}) {
  const fam = FONT.serif(700), ufam = FONT.serif(600), us = o.unitSize ?? size * 0.42, tr = -size * 0.025;
  const w1 = measure(s, fam, size, tr), gap = size * 0.05, w2 = unit ? measure(unit, ufam, us) + gap : 0, w = w1 + w2;
  const x0 = o.align === 'center' ? x - w / 2 : x;
  text(c, s, x0, y, fam, size, col, { track: tr });
  if (unit) text(c, unit, x0 + w1 + gap, y, ufam, us, o.unitCol ?? col);
  return w;
}
/** Mono source line, larger than the kit's (this is a music video: it has to be read at speed). */
const src = (c: Ctx, s: string, x: number, y: number, col: string, o: { align?: CanvasTextAlign; alpha?: number } = {}) =>
  label(c, `Source · ${s}`, x, y, col, 15, { w: 500, align: o.align, alpha: o.alpha });
/** A small up/down triangle (delta mark), baseline-aligned at y. */
function tri(c: Ctx, x: number, y: number, s: number, up: boolean, col: string) {
  c.save(); c.fillStyle = col; c.beginPath();
  if (up) { c.moveTo(x, y); c.lineTo(x + s, y); c.lineTo(x + s / 2, y - s * 0.9); }
  else { c.moveTo(x, y - s * 0.9); c.lineTo(x + s, y - s * 0.9); c.lineTo(x + s / 2, y); }
  c.closePath(); c.fill(); c.restore();
}
/** Entry transform for a block: alpha and a rise of dy px (outExpo upstream). */
function enter(c: Ctx, k: number, dy = 16) { c.globalAlpha *= clamp(k); c.translate(0, (1 - clamp(k)) * dy); }
/** The night grade: multiply the light plate toward navy (cream → deep navy, vermilion → near black). */
function nightGrade(c: Ctx, a: number) {
  if (a <= 0) return;
  c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha *= clamp(a);
  c.fillStyle = '#1D2B4C'; c.fillRect(0, 0, W, H);
  c.restore();
}

// ------------------------------------------------------------------------------------------------ title card
/** Word times of the cold open's last line ("This is the state of the world."). */
function titleTimes(lines: { section?: string; words: Word[] }[]) {
  const l = lines.filter((x) => x.section === 'cold').at(-1)!;
  const w = l.words; // This is the state of the world
  return { This: w[0]!.start, the: w[2]!.start, state: w[3]!.start, of: w[4]!.start, the2: w[5]!.start, world: w[6]!.start, end: w[6]!.end };
}
const TITLE_Y = 540, TITLE_SIZE = 154;   // the card spans x ≈ 150–1790: inside the 120–1800 content area
/** "The State of the World": each word rises out of a mask on its sung word; a vermilion rule draws on "world". */
function titleCard(c: Ctx, t: number, T: ReturnType<typeof titleTimes>, lift = 0) {
  const fam = FONT.serif(800), size = TITLE_SIZE, tr = -size * 0.02, cy = TITLE_Y - lift * 40;
  const words: [string, number][] = [['The', T.the], ['State', T.state], ['of', T.of], ['the', T.the2], ['World', T.world]];
  const tw = measure(words.map((w) => w[0]).join(' '), fam, size, tr);
  const sp = measure(' ', fam, size, tr);
  let x = 960 - tw / 2;
  const top = appear(t, T.This, 0.5);
  label(c, 'October 2026', 960, cy - 190, PAPER(0.85 * top), 24, { align: 'center', w: 500 });
  for (const [wd, t0] of words) {
    const k = appear(t, t0, 0.55);
    const ww = measure(wd, fam, size, tr);
    if (k > 0) {
      c.save(); c.beginPath(); c.rect(x - 12, cy - size * 1.02, ww + 24, size * 1.3); c.clip();
      text(c, wd, x, cy + (1 - k) * size * 0.95, fam, size, PAPER(0.98), { track: tr });
      c.restore();
    }
    x += ww + sp;
  }
  const ru = ease.outExpo(clamp((t - T.world) / 0.8));
  c.fillStyle = RED(); c.fillRect(960 - 180 * ru, cy + 46, 360 * ru, 4);
}

// ------------------------------------------------------------------------------------------------ cold
const SHIP = { x: 1172 / 1920, y: 606 / 1080 };   // the smoking ship on the horizon of hormuz_dusk

function cold(c: Ctx, X: X) {
  const t = X.t, s = X.seg;
  const wOct = X.W('October').start, w2026 = X.W('2026').start;
  const wCont = X.W('container').start, wSank = X.W('sank').start;
  const wBrent = X.W('Brent').start, w110 = X.W('$110');
  const T = titleTimes(X.lines);

  // ---- plate, breathing: a slow push toward the ship plus a small breath on each kick
  c.fillStyle = C.night; c.fillRect(0, 0, W, H);
  const u = ease.inOutQuad(X.u(s.t0, s.t1 + 0.6));
  const z = lerp(1.03, 1.12, u) + 0.007 * X.hit('kick', t, 0.25);
  const dx = lerp(0, -0.012, u), dy = lerp(0, -0.03, u);
  X.plate(c, 'hormuz_dusk', { z: [z, z], x: [dx, dx], y: [dy, dy] });
  // night → dusk on the first downbeat; dusk → night on "This is the state of the world"
  const up = ease.inOutCubic(X.u(X.tBeat(1) - 0.22, X.tBeat(1) + 0.12));
  const down = ease.inOutCubic(X.u(T.This - 0.05, T.This + 0.6));
  nightGrade(c, Math.max(1 - up, down * 0.96));

  // ---- datelines (ink slugs on the paper sky)
  const SZ = 30, sx = 120, y1 = 170, y2 = 228 + 6;
  const dateOut = vanish(t, T.This + 0.1, 0.3);
  const d1 = typedBy(t, [{ s: 'October', t0: wOct, cps: 26 }, { s: ' 2026', t0: w2026, cps: 16 }]);
  if (d1.length) slug(c, 'October 2026', sx, y1, d1.length, { size: SZ, alpha: dateOut });
  // the place/date slug types on "Strait" (40 cps: STRAIT OF HORMUZ is complete on "Hormuz", the date just after)
  const hz = 'Strait of Hormuz · 14 Oct';
  const wStrait = X.W('Strait').start;
  const hk = life(t, wStrait, wBrent, 0.3, 0.25);
  if (t >= wStrait && hk > 0) slug(c, hz, sx, y2, (t - wStrait) * 40, { size: SZ, dot: true, alpha: hk });

  // reticle on the smoking ship: it finds the ship on "container ship" (wide, faint) and locks on "sank";
  // a leader then draws from the ship up to the place slug as "Strait of Hormuz" is sung
  const rk = life(t, wCont, wBrent, 0.35, 0.25);
  if (rk > 0) {
    const p = onPlate(SHIP.x, SHIP.y, z, dx, dy);
    const lock = ease.outExpo(X.u(wSank, wSank + 0.55));
    const R = 30, ring = R + 34 * (1 - lock) + 40 * (1 - appear(t, wCont, 0.7, ease.outCubic));
    c.save(); c.globalAlpha *= rk;
    const ink = lerp(0.5, 0.9, lock);
    c.strokeStyle = INK(ink); c.lineWidth = lerp(1.4, 2, lock);
    c.beginPath(); c.arc(p.x, p.y, ring, 0, Math.PI * 2); c.stroke();
    // a ping on every beat once locked (the intro's sparse pulse made visible)
    const ph = X.beat() - Math.floor(X.beat());
    if (t > wSank + 0.4) { c.strokeStyle = INK(0.45 * (1 - ph)); c.lineWidth = 1.2; c.beginPath(); c.arc(p.x, p.y, R + 6 + 46 * ease.outCubic(ph), 0, Math.PI * 2); c.stroke(); }
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      hair(c, p.x + Math.cos(a) * (ring + 5), p.y + Math.sin(a) * (ring + 5), p.x + Math.cos(a) * (ring + 17), p.y + Math.sin(a) * (ring + 17), INK(ink), 2);
    }
    // the leader: reticle → 45° climb → along to the slug's end, landing as the slug's date finishes typing
    const lx0 = sx + slugW(hz, SZ, true) + 12, ly0 = y2 - SZ * 0.31;
    const lu = ease.inOutCubic(X.u(wStrait + 0.05, wStrait + hz.length / 40 + 0.05));
    const ex = p.x - R * 0.71 - 22, ey = p.y - R * 0.71 - 22;
    const mx = Math.max(lx0 + 1, ex - (ey - ly0));       // a 45° approach into the reticle
    const s2 = Math.hypot(ex - mx, ey - ly0), s1 = mx - lx0, d = lu * (s1 + s2);
    c.strokeStyle = INK(0.75); c.lineWidth = 1.5; c.beginPath(); c.moveTo(ex, ey);
    if (d <= s2) { const f = d / s2; c.lineTo(lerp(ex, mx, f), lerp(ey, ly0, f)); }
    else { c.lineTo(mx, ly0); c.lineTo(mx - (d - s2), ly0); }
    if (d > 0) c.stroke();
    c.restore();
  }

  // ---- Brent: the one big numeral, ink + vermilion on the paper sky (enters on "Brent", lands on "$110")
  const bk = life(t, wBrent, T.This, 0.45, 0.25);
  if (bk > 0) {
    c.save(); enter(c, bk, 20);
    const cx = 795, y = 410;
    label(c, 'Brent crude  ·  16 Oct close', cx, y - 168, INK(0.85), 24, { align: 'center', w: 600 });
    const v = countTo(t, wBrent + 0.1, 72, 109.86, w110.start - wBrent + 0.1, 2);
    numeral(c, `$${v}`, '/bbl', cx, y, 170, RED(), { align: 'center', unitSize: 46, unitCol: INK(0.75) });
    const ru = ease.outCubic(X.u(w110.start, w110.start + 0.5));
    hair(c, cx - 320 * ru, y + 34, cx + 320 * ru, y + 34, INK(0.5), 1.5);
    src(c, 'Trading Economics · 16 Oct 2026', cx, y + 70, INK(0.75), { align: 'center' });
    c.restore();
  }

  // ---- title card over the night-graded plate (bigpicture carries it across the downbeat)
  // (from 0.25 s before the boundary, bigpicture draws the card on top at full strength, so only one copy exists)
  if (t >= T.This - 0.05 && t < s.t1 - 0.25) titleCard(c, t, T);
}

// ------------------------------------------------------------------------------------------------ bigpicture
const LX = 120;           // left column
const COLW = 700;         // left column width
const LAB_Y = 296;        // row label baseline
const NUM_Y = 520;        // numeral baseline

/** A row header: mono caps + a hairline drawing on under it. */
function rowHead(c: Ctx, X: X, s: string, t0: number) {
  label(c, s, LX, LAB_Y, PAPER(0.92), 21, { w: 600 });
  hair(c, LX, LAB_Y + 20, LX + COLW * ease.outCubic(X.u(t0, t0 + 0.9)), LAB_Y + 20, PAPER(0.3));
}

function bigpicture(c: Ctx, X: X) {
  const t = X.t, s = X.seg;
  const T = titleTimes(X.ly.lines);
  // the night arrives on the downbeat (the scene's own cross-fade would start 0.6 s early, under the title)
  const gk = ease.inOutQuad(clamp((t - (s.t0 - 0.25)) / 0.55));
  c.save(); c.globalAlpha *= gk;
  c.fillStyle = C.night; c.fillRect(0, 0, W, H);

  // ---- the globe, turning; a breath on each kick; its rim warms with the August counter (line 4)
  const v = X.view();
  const r = v.r * (1 + 0.007 * X.hit('kick', t, 0.18));
  const wAug = X.W('August').start, wHot = X.W('hottest').start;
  const heat = ease.outCubic(X.u(wAug + 0.05, wHot));
  if (heat > 0) {
    const cx = v.cx ?? 960, cy = v.cy ?? 540;
    const g = c.createRadialGradient(cx, cy, r * 0.95, cx, cy, r * 1.32);
    g.addColorStop(0, RED(0.34 * heat)); g.addColorStop(0.45, RED(0.12 * heat)); g.addColorStop(1, RED(0));
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r * 1.32, 0, Math.PI * 2); c.fill();
  }
  X.globe(c, { ...v, r });
  // the column sits on a gentle night wash so it never fights the globe's glow
  const g = c.createLinearGradient(0, 0, 960, 0);
  g.addColorStop(0, NIGHT(0.8)); g.addColorStop(0.7, NIGHT(0.45)); g.addColorStop(1, NIGHT(0));
  c.fillStyle = g; c.fillRect(0, 0, 960, H);
  c.restore();

  // ---- the title card holds across the downbeat, then lifts away before the first verse line
  const wThe = X.W('The').start, wIMF = X.W('IMF').start;
  const tOut = ease.inCubic(X.u(wThe - 0.45, wThe - 0.05));
  if (t < wThe && t >= s.t0 - 0.25) {
    c.save(); c.globalAlpha = 1 - tOut;   // cold draws the same card underneath until the night is opaque
    titleCard(c, t, T, ease.outCubic(tOut));
    c.restore();
  }
  c.save(); c.globalAlpha *= gk;

  // ---- header pill (the section's kicker), on "The"; it leaves with the first line (the chrome carries the kicker after)
  const wGrowth = X.W('growth').start, w31 = X.W('3.1%').start, wInfl = X.W('inflation').start, w47 = X.W('4.7%').start;
  const w117 = X.W('117.8').start;
  const hk = life(t, wThe, w117 - 0.05, 0.5, 0.3);
  if (hk > 0) {
    c.save(); enter(c, appear(t, wThe, 0.5), 10); c.globalAlpha *= vanish(t, w117 - 0.05, 0.3);
    c.translate(0, -22 * (1 - vanish(t, w117 - 0.05, 0.3)));
    pill(c, s.kicker ?? 'The big picture', LX, 206, { size: 17 });
    c.restore();
  }

  // ---------- line 1: IMF growth / inflation (twin numerals; growth down from 2025, inflation up)
  const k1 = life(t, wIMF, w117 - 0.05, 0.4, 0.3);
  if (k1 > 0) {
    c.save(); c.globalAlpha *= k1; c.translate(0, -22 * (1 - vanish(t, w117 - 0.05, 0.3)));
    c.save(); c.globalAlpha *= appear(t, wIMF, 0.4); rowHead(c, X, 'IMF forecasts  ·  World Economic Outlook', wIMF); c.restore();
    const cols = [
      { x: LX, lab: 'World growth, 2026', t0: wGrowth, tn: w31, val: 3.1, prev: '2025: 3.5%', up: false, hot: false },
      { x: LX + 390, lab: 'World inflation, 2026', t0: wInfl, tn: w47, val: 4.7, prev: '2025: 4.1%', up: true, hot: true },
    ];
    for (const col of cols) {
      const kl = appear(t, col.t0, 0.4);
      if (kl <= 0) continue;
      c.save(); enter(c, kl, 12); label(c, col.lab, col.x, 372, PAPER(0.85), 18, { w: 500 }); c.restore();
      const kn = appear(t, col.tn, 0.45);
      if (kn > 0) {
        c.save(); enter(c, kn, 24);
        numeral(c, countTo(t, col.tn, 0, col.val, 0.8, 1), '%', col.x - 6, NUM_Y, 172, col.hot ? RED() : PAPER(), { unitSize: 88 });
        c.globalAlpha *= appear(t, col.tn + 0.5, 0.4);
        tri(c, col.x, 580, 16, col.up, col.hot ? RED() : PAPER(0.85));
        label(c, col.prev, col.x + 28, 580, PAPER(0.8), 19, { w: 500 });
        c.restore();
      }
    }
    hair(c, LX + 362, 350, LX + 362, 350 + 245 * appear(t, wInfl, 0.6), PAPER(0.2));
    if (t >= w31) src(c, 'IMF WEO · 13 Oct 2026', LX, 650, SLATE(), { alpha: appear(t, w31 + 0.2, 0.4) });
    c.restore();
  }

  // ---------- line 2: 117.8 million forcibly displaced (one dot = one million people)
  const wMillion = X.W('million').start, wPeople = X.W('people').start, wForc = X.W('forcibly').start, wEnd = X.W('end').start;
  const wUN = X.W('UN').start;
  const k2 = life(t, w117, wUN - 0.12, 0.35, 0.3);
  if (k2 > 0) {
    c.save(); c.globalAlpha *= k2; c.translate(0, -22 * (1 - vanish(t, wUN - 0.12, 0.3)));
    const lab = typedBy(t, [{ s: 'People', t0: wPeople }, { s: ' forcibly displaced', t0: wForc, cps: 60 }, { s: '  ·  end-2025', t0: wEnd, cps: 50 }]);
    label(c, lab, LX, LAB_Y, PAPER(0.92), 21, { w: 600 });
    hair(c, LX, LAB_Y + 20, LX + COLW * ease.outCubic(X.u(w117, w117 + 0.9)), LAB_Y + 20, PAPER(0.3));
    const val = 117.8 * ease.outCubic(X.u(w117, wMillion));      // counts across the spoken number, lands on "million"
    c.save(); enter(c, appear(t, w117, 0.4), 24);
    const nw = numeral(c, val.toFixed(1), '', LX - 6, NUM_Y, 184, PAPER());
    const km = appear(t, wMillion, 0.4);
    text(c, 'million', LX + nw + 18, NUM_Y - (1 - km) * 12, FONT.serif(600), 66, PAPER(0.92), { alpha: km });
    c.restore();
    // unit grid: 20 × 6 dots, one per million; the 118th is 0.8 of a dot
    const cols = 20, gap = 35, gx = LX + 12, gy = 584;
    for (let i = 0; i < 120; i++) {
      const xx = gx + (i % cols) * gap, yy = gy + Math.floor(i / cols) * gap, f = clamp(val - i);
      c.fillStyle = PAPER(0.1); c.beginPath(); c.arc(xx, yy, 12, 0, Math.PI * 2); c.fill();
      if (f > 0) {
        c.fillStyle = PAPER(0.94); c.beginPath();
        if (f >= 1) c.arc(xx, yy, 12, 0, Math.PI * 2);
        else { c.moveTo(xx, yy); c.arc(xx, yy, 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f); c.closePath(); }
        c.fill();
      }
    }
    const kl = appear(t, wMillion, 0.4);
    c.save(); c.globalAlpha *= kl;
    c.fillStyle = PAPER(0.94); c.beginPath(); c.arc(LX + 7, 818, 7, 0, Math.PI * 2); c.fill();
    label(c, '= 1 million people', LX + 24, 824, PAPER(0.78), 15);
    src(c, 'UNHCR · Jun 2026', LX + COLW, 824, SLATE(), { align: 'right' });
    c.restore();
    c.restore();
  }

  // ---------- line 3: UN appeals 42.4% funded ($14.86bn of $35.06bn)
  const wAid = X.W('aid').start, w42 = X.W('42%'), wFunded = X.W('funded').start;
  const k3 = life(t, wUN, wAug - 0.05, 0.35, 0.3);
  if (k3 > 0) {
    c.save(); c.globalAlpha *= k3; c.translate(0, -22 * (1 - vanish(t, wAug - 0.05, 0.3)));
    rowHead(c, X, 'UN-coordinated appeals, 2026', wUN);
    const fu = ease.outCubic(X.u(w42.start, w42.end + 0.15));
    const kn = appear(t, w42.start, 0.4);
    if (kn > 0) {
      c.save(); enter(c, kn, 24);
      const nw = numeral(c, (42.4 * fu).toFixed(1), '%', LX - 6, NUM_Y, 184, RED(), { unitSize: 92 });
      const kf = appear(t, wFunded, 0.4);
      text(c, 'funded', LX + nw + 18, NUM_Y - (1 - kf) * 12, FONT.serif(600), 66, PAPER(0.92), { alpha: kf });
      c.restore();
    }
    // the bar: outline = $35.06bn requested (draws on with "aid appeals"), fill = $14.86bn received
    const bx = LX, by = 576, bw = COLW, bh = 50, fx = bw * 0.424 * fu;
    const ou = ease.inOutCubic(X.u(wAid, wAid + 0.7));
    c.save();
    c.strokeStyle = PAPER(0.7); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + bw * ou, by); c.moveTo(bx, by + bh); c.lineTo(bx + bw * ou, by + bh);
    c.moveTo(bx, by); c.lineTo(bx, by + bh); if (ou >= 1) { c.moveTo(bx + bw, by); c.lineTo(bx + bw, by + bh); }
    c.stroke();
    if (ou > 0.98) {      // hatch the unfunded remainder
      c.beginPath(); c.rect(bx + fx, by, bw - fx, bh); c.clip();
      c.strokeStyle = PAPER(0.16); c.lineWidth = 1.2;
      for (let xx = bx - bh; xx < bx + bw; xx += 13) { c.beginPath(); c.moveTo(xx, by + bh); c.lineTo(xx + bh, by); c.stroke(); }
    }
    c.restore();
    if (fu > 0) { c.fillStyle = PAPER(0.95); c.fillRect(bx, by, fx, bh); }
    const kr = appear(t, wAid + 0.6, 0.35);   // once the outline it labels has drawn on
    label(c, '$35.06bn requested', bx + bw, by + bh + 38, PAPER(0.8 * kr), 18, { align: 'right' });
    const kg = appear(t, w42.end, 0.4);
    if (kg > 0) {
      hair(c, bx + bw * 0.424, by + bh + 4, bx + bw * 0.424, by + bh + 20, PAPER(0.7 * kg), 1.5);
      label(c, '$14.86bn received', bx, by + bh + 38, PAPER(0.95 * kg), 18, { w: 600 });
    }
    src(c, 'OCHA FTS · 18 Oct 2026', LX, 730, SLATE(), { alpha: appear(t, w42.start + 0.2, 0.4) });
    c.restore();
  }

  // ---------- line 4: August +1.65 °C above 1850–1900, joint-hottest month on record (Copernicus)
  const wCop = X.W('Copernicus').start;
  const k4 = appear(t, wAug, 0.4);
  if (k4 > 0) {
    c.save(); c.globalAlpha *= k4;
    rowHead(c, X, 'Global temperature  ·  August 2026', wAug);
    const val = 1.65 * heat;
    c.save(); enter(c, appear(t, wAug, 0.4), 24);
    numeral(c, `+${val.toFixed(2)}`, '°C', LX - 6, NUM_Y, 190, RED(), { unitSize: 96 });
    c.restore();
    label(c, 'above 1850–1900', LX, 570, PAPER(0.8), 19, { alpha: appear(t, wAug + 0.3, 0.4), w: 500 });
    // the thermometer stripe: 0 → +2.0 °C, warming from navy to vermilion; a marker rides the counter
    const sx = LX, sy = 610, sw = COLW, sh = 20, max = 2.0;
    const su = ease.outCubic(X.u(wAug, wAug + 0.6));
    const gr = c.createLinearGradient(sx, 0, sx + sw, 0);
    gr.addColorStop(0, '#22345C'); gr.addColorStop(0.5, '#6B5A7A'); gr.addColorStop(0.75, '#C2543A'); gr.addColorStop(1, C.hot);
    c.save(); c.beginPath(); c.rect(sx - 10, sy - 40, (sw + 20) * su, 120); c.clip();
    c.fillStyle = gr; c.fillRect(sx, sy, sw, sh);
    for (let k = 0; k <= 4; k++) {
      const xx = sx + (sw * (k * 0.5)) / max;
      hair(c, xx, sy + sh, xx, sy + sh + 9, PAPER(0.55));
      label(c, k === 0 ? '0' : `+${(k * 0.5).toFixed(1)}`, xx, sy + sh + 32, PAPER(0.65), 14, { align: k === 0 ? 'left' : k === 4 ? 'right' : 'center' });
    }
    c.restore();
    if (val > 0.01) {
      const mx = sx + (sw * val) / max;
      c.fillStyle = PAPER(); c.fillRect(mx - 1.5, sy - 12, 3, sh + 20);
      tri(c, mx - 9, sy - 14, 18, false, PAPER());
    }
    // the record tag lands on "hottest" (paper, so the numeral stays the one hot value)
    const kt = appear(t, wHot, 0.4);
    if (kt > 0) { c.save(); enter(c, kt, 10); pill(c, 'Joint-hottest month on record', LX, 726, { size: 17, fill: PAPER(0.95), col: INK() }); c.restore(); }
    // the source brightens on "Copernicus"
    const kc = ease.outCubic(X.u(wCop, wCop + 0.3));
    src(c, 'Copernicus C3S · 10 Sep 2026', LX, 790, kc > 0 ? rgbaHex(C.paper, 0.62 + 0.36 * kc) : SLATE(), { alpha: appear(t, wAug + 0.2, 0.4) });
    if (kc > 0) { c.fillStyle = RED(kc); c.fillRect(LX - 22, 790 - 11, 8, 8); }
    c.restore();
  }
  c.restore();
}

export const segments: Record<string, Segment> = {
  cold: {
    draw: cold,
    post(X, o) { return { ...o, zoom: 1 + 0.01 * X.hit('kick', X.t, 0.12) }; },
  },
  bigpicture: {
    draw: bigpicture,
    post(X, o) { return { ...o, zoom: 1 + 0.012 * X.hit('kick', X.t, 0.12) }; },
  },
};

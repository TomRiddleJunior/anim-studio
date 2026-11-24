// THE STATE OF AI · OCT 2026 — group "hooks": s07 (B07 · ONE LEG, pre-chorus 1) and the three choruses.
// Round 2 (over the real footage): panels, chips and the source line use the house style of ../brief (opaque
// PANEL_BG, 22 % hairline + corner brackets, FIG header strip, footer source line, `land` for the headline number).
//   s07      "The IMF flags fourteen circular deals. $1.4 trillion promised." One house panel in the right column. It
//            unrolls on the chapter's first frame with its footer source SOURCE · IMF GFSR · OCT 2026 riding the
//            unrolling edge (the lyric block's ghosted "$1.4 trillion" and the flap board's $1.4 TN / 14 DEALS are never
//            up without it), FIG. 07 · CIRCULAR FLOW in the header with 14 unlit deal pips, the loop's dashed guide
//            track and the caption's first line REVENUE COMMITMENTS IN 14 DEALS (so the flap's number never reads as
//            deal size); on "fourteen" the two plain nodes (HYPERSCALER / AI FIRM) pop and all 14 pips light together
//            (a coral highlight ripples over the lit row — never a count). The IMF's circular flow draws on "circular" (EQUITY over
//            the top, DEBT solid inside it — the leverage the IMF worries about, so not dashed or dimmed — and
//            COMMITMENTS back underneath, coral), the loop flows from "deals", and on "trillion" the complete $1.4TN
//            lands in coral together with the label's second line (($300BN EQUITY · $650BN DEBT)) and a coral leader to
//            the COMMITMENTS arc — so it never reads as the loop's total (deal size).
//            No partial value is ever drawn. "Count it up. Count it up." (the P03 montage) adds no facts: the loop
//            accelerates like a riser, a coral highlight sweeps the 14 (always-lit) pips on each "Count … up", the
//            panel edge flashes on each beat word. At the chapter cut the panel rolls back up, opaque, the footer source
//            riding the rising edge (the number is clipped before the source). The Georgieva quote card is left out.
//   chorus1/2/3  no facts, no numbers. The masthead word is the star; one light HUD element per sung line, under it:
//            dash tell-tales (LIGHTS ON · EYES OPEN · RACING / MORNING) · the second line (c1 a lane-hold read-out ·
//            c2 two identical lamp chips BRAKES / FULL SPEED, each lit on its word, no quantity · c3 every voice → one
//            unison level on a paper card) · a steering rim that wanders on "future", swings on "steer" and asks "?" on
//            "right?" · "Who's at the wheel?": a CV search box that never finds anyone (DRIVER ? and an empty "?") ·
//            the crowd's shout: a CROWD chip over a voice-bar strip that grows a segment per word and slams on the last
//            (the words themselves stay the masthead's). Each payoff holds into the next shot until the next line's
//            first word. chorus3 is a white chapter: everything in solid ink.
//   Footage fit (round 2): the "Who's at the wheel?" search settles on the real driver's place — the wheel and empty
//            seat of the K04/K14 clip (a static source box through the camera), the 1956 driverless bubble car on
//            K15.0 (a box held where the car drives into and out of it), the tracked car ahead on K15.1/K24 (YOLO
//            'car'; the "?" in the box's top-right corner, off the car); the c1 lane-hold moves to the dark lower-left,
//            off the singer's arm; the c2 BRAKES / FULL SPEED chips part to either side of the singer; the c3
//            tell-tales sit lower-left, off the dancer. Legibility per piece (keyed on the montage piece id): dark
//            masthead pools on K01/K11/K12 and the amber interchange K05.1/K15.2, a dark veil on the milky K05.0, a
//            paper masthead pool (plus a light flat veil) on the K24 tunnel. Grades and cams are in storyboard.d/hooks.json.
// Every time is anchored to lyric words (by content), shot windows or the beat grid. Pure function of X.t.
import type { Chapter, X } from '../x';
import type { Line, Word } from '../../engine/lyrics';
import type { Box } from '../cards';
import { norm } from '../../engine/lyrics';
import { measure } from '../../engine/type';
import { clamp, ease, hash, lerp } from '../../engine/util';
import { FONT, W, H, WHITE, CORAL, INK, text, label, hair, vanish, fi } from '../kit';
import { panel, brackets, land, applyLand, enter, leave, sourceLine, DUR, FOOT_H, PANEL_BG, PAPER } from '../brief';

type Ctx = CanvasRenderingContext2D;
// The 2D layer composites in linear light, so every backing is opaque (brief.ts PANEL_BG), and on the white chapter
// every ink fill is solid INK(1) (0.92–0.96 lands mid-grey over paper).
const PANEL = PANEL_BG;
const UNDER = 'rgba(8,9,11,0.7)'; // dark under-stroke for white marks drawn straight on footage
/** House edge for small dark chips: 1 px hairline at 22 % + short corner brackets (the brief.ts panel edge, scaled). */
function chipEdge(c: Ctx, x: number, y: number, w: number, h: number, len = 7) {
  c.strokeStyle = WHITE(0.22); c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  brackets(c, x, y, w, h, WHITE(0.85), { len });
}
const TAU = Math.PI * 2;
/** Grid: the lower-left zone starts at x 110 (clear of the bar ruler); the chrome's right text edge is x 1824. */
const GL = 110, GR = 1824, MID = W / 2;
const pulse = (t: number, t0: number, hl = 0.1) => (t < t0 ? 0 : Math.pow(0.5, (t - t0) / hl));
const shakeXY = (t: number, amp: number, seed: number): [number, number] => {
  const f = fi(t);
  return [(hash(f, seed) - 0.5) * 2 * amp, (hash(f, seed + 1) - 0.5) * 2 * amp];
};

// ------------------------------------------------------------------ anchoring helpers
const bare = (s: string) => norm(s).replace(/[()]/g, '');
/** nth word of a line whose letters start with q ("trillion", "steer"): anchored by content, not by index. */
function wd(L: Line, q: string, nth = 0): Word {
  const k = bare(q);
  const m = L.words.filter((w) => bare(w.w).startsWith(k));
  return m[nth] ?? m[0] ?? L.words[0]!;
}
/** Start of shot `id` (or of its first montage piece `id.0`). */
function shotT0(X: X, id: string, fallback: number) {
  return X.board.shots.find((s) => s.id === id || s.id.startsWith(id + '.'))?.t0 ?? fallback;
}
// ------------------------------------------------------------------ local primitives
function dot(c: Ctx, x: number, y: number, r: number, col: string) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
/** A small label chip: the HUD voice on its own backing (reads over any plate). Returns its width. */
function chip(c: Ctx, s: string, x: number, y: number, ink = false, align: 'left' | 'center' | 'right' = 'left', size = 14) {
  const fam = FONT.mono(600), tr = size * 0.18, h = Math.round(size * 1.8), padX = Math.round(size * 0.65);
  const w = measure(s.toUpperCase(), fam, size, tr) + padX * 2;
  const x0 = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
  c.fillStyle = ink ? INK(1) : PANEL; c.fillRect(x0, y, w, h);
  if (!ink) chipEdge(c, x0, y, w, h, 5);
  text(c, s.toUpperCase(), x0 + padX, y + h / 2 + size * 0.36, fam, size, ink ? PAPER(1) : WHITE(0.9), { track: tr });
  return w;
}
/** Scale about a point for a slam-in (k 0..1 → 1+amt … 1). */
function slam(c: Ctx, x: number, y: number, k: number, amt = 0.3) {
  const sc = 1 + amt * (1 - ease.outBack(clamp(k)));
  c.translate(x, y); c.scale(sc, sc); c.translate(-x, -y);
}
/** A dash-board lamp: a ring, dim until its word, then filled with a short glow ring as it lights. */
function lamp(c: Ctx, x: number, y: number, t: number, tOn: number, ink: boolean) {
  const on = t >= tOn - 0.02;
  const fg = ink ? PAPER(1) : WHITE(0.95), dim = ink ? PAPER(0.35) : WHITE(0.3);
  c.strokeStyle = on ? fg : dim; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 8, 0, TAU); c.stroke();
  if (!on) return;
  dot(c, x, y, 5.5, fg);
  const g = pulse(t, tOn, 0.08);
  if (g > 0.02) { c.strokeStyle = ink ? PAPER(g) : WHITE(g); c.lineWidth = 2; c.beginPath(); c.arc(x, y, 8 + 10 * (1 - g), 0, TAU); c.stroke(); }
}

/** The masthead's extent for a line (same sizing rule as ev/type.ts masthead): baseline and cap top of its biggest word. */
function mastExtent(X: X, L: Line) {
  const fam = FONT.grot(900);
  let size = 0;
  for (const w of L.words) {
    const s = w.w.replace(/[(),.!?"]/g, '').toUpperCase();
    size = Math.max(size, Math.min(420, ((W - 160) * 100) / Math.max(1, measure(s, fam, 100, -2))));
  }
  const lt = X.board.lineTypes.find((l) => l.line === L);
  const base = lt?.mastheadY ?? H / 2 + size * 0.36;
  return { base, top: base - size * 0.72 };
}

// ====================================================================== s07 · B07 · ONE LEG
const P7 = { x: 1104, y: 292, w: GR - 1104, h: 512 };
const P7G = { cy: P7.y + 226, rx: 272, ry: 132, ryDebt: 70 }; // loop geometry (centre x = panel centre)
const PAD7 = 16; // the label's inset (matches the panel's header/footer text inset)
const SRC7 = 'SOURCE · IMF GFSR · OCT 2026';
const HEAD7 = '$1.4TN';
const LAB7A = 'REVENUE COMMITMENTS IN 14 DEALS';
const LAB7B = '($300BN EQUITY · $650BN DEBT)';

/** Phase (loops) of the flow around the circle: steady from tf, then a riser through "Count it up" (pure in t). */
function flowPhase(t: number, tf: number, tc: number) {
  if (t < tf) return 0;
  const v0 = 0.32;
  return v0 * (t - tf) + (t > tc ? 0.85 * Math.pow(t - tc, 2.2) : 0);
}

/** The linear panel progress k whose house easing (outExpo) gives the reveal e: lets the panel roll UP on its exit. */
const kOfE = (e: number) => (e >= 1 ? 1 : e <= 0 ? 0 : -Math.log2(1 - e) / 10);
/** The footer strip riding the panel's moving bottom edge while it unrolls / rolls up: the source line is on screen
 *  from the panel's first frame to its last (the number is clipped by the edge before the source ever is). */
function ridingFooter(c: Ctx, x: number, y: number, w: number, top: boolean) {
  const h = FOOT_H;
  c.save();
  c.fillStyle = PANEL; c.fillRect(x, y, w, h);
  c.strokeStyle = WHITE(0.22); c.lineWidth = 1;
  if (top) c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  else {
    c.beginPath(); c.moveTo(x + 0.5, y); c.lineTo(x + 0.5, y + h - 0.5); c.lineTo(x + w - 0.5, y + h - 0.5); c.lineTo(x + w - 0.5, y); c.stroke();
    c.fillStyle = WHITE(0.18); c.fillRect(x, y, w, 1); // the footer's rule (as panel() draws it)
  }
  brackets(c, x, y, w, h, WHITE(0.85), { top });
  sourceLine(c, SRC7, x + 16, y + 21, { maxW: w - 32 });
  c.restore();
}

function circularDeals(c: Ctx, X: X) {
  const t = X.t;
  const L = X.L('The IMF flags'), Lc = X.L('Count it up');
  const wFour = wd(L, 'fourteen'), wCirc = wd(L, 'circular'), wDeals = wd(L, 'deals'), wTr = wd(L, 'trillion');
  const wC1 = Lc.words[0]!, wU1 = wd(Lc, 'up'), wC2 = wd(Lc, 'count', 1), wU2 = wd(Lc, 'up', 1);
  // the panel opens on the chapter's first frame with its footer source riding the unrolling edge: the s07 lyric
  // block (with its ghosted "$1.4 trillion") and the flap board's $1.4 TN / 14 DEALS are never up without the source.
  // The caption's first line (REVENUE COMMITMENTS IN 14 DEALS) is printed from the opening too, so the flap's number
  // never reads as the deals' size; the headline lands on "trillion" with the bracketed second line. The panel rolls
  // back UP into its header at the chapter cut (opaque throughout; the footer rides the rising edge, so the source
  // outlasts the number).
  const tIn = X.ch.t0, tBody = wFour.start - 0.02, tOut = X.ch.t1;
  if (t < tIn || t >= tOut) return;
  const { x: x0, y: y0, w } = P7, x1 = x0 + w, cx = x0 + w / 2;
  const { cy, rx, ry, ryDebt } = P7G;
  const e = Math.min(ease.outExpo(enter(t, tIn, DUR.panel)), 1 - ease.inCubic(enter(t, tOut - DUR.out, DUR.out)));
  const hh = P7.h * e;
  const p = panel(c, x0, y0, w, P7.h, {
    k: kOfE(e), title: 'FIG. 07 · CIRCULAR FLOW', source: SRC7,
    draw: (pb) => {
      // ---- header: the 14 deal pips — all 14 light together on "fourteen" (never a count through 1–13); a coral
      // highlight ripples across the lit row then, and sweeps it on each "Count … up" (all 14 stay lit)
      const pw = 9, pg = 5, pn = 14, pxR = x1 - 16, px0 = pxR - pn * (pw + pg) + pg;
      const sweeps: [number, number][] = [[wC1.start, wU1.start + 0.1], [wC2.start, wU2.start + 0.1]];
      const on = t >= wFour.start - 0.02;
      for (let i = 0; i < pn; i++) {
        const x = px0 + i * (pw + pg);
        const tr = wFour.start + i * 0.022;
        let hot = on && t >= tr && t < tr + 0.12;
        for (const [s0, s1] of sweeps) { const ti = lerp(s0, s1, (i + 1) / pn); if (t >= ti && t < ti + 0.1) hot = true; }
        c.fillStyle = hot ? CORAL() : on ? WHITE(0.92) : WHITE(0.16);
        c.fillRect(x, y0 + 12, pw, 16);
      }
      const yB0 = pb.body.y, bodyH = pb.body.h;
      const xL = cx - rx, xR = cx + rx;
      const nk = ease.outBack(clamp((t - tBody - 0.1) / 0.3));
      const pillFam = FONT.mono(700), pillSize = 14, pillTr = 2.2, pillH = 36;
      const pills = ([[xL, 'HYPERSCALER'], [xR, 'AI FIRM']] as const).map(([nx, s]) => ({ nx, s, w: measure(s, pillFam, pillSize, pillTr) + 30 }));
      // arcs, dots and leader with the pill rects cut out of the clip: the exit fade never shows them through the labels
      c.save();
      c.beginPath(); c.rect(x0, yB0, w, bodyH);
      for (const q of pills) c.rect(q.nx - q.w / 2, cy - pillH / 2, q.w, pillH);
      c.clip('evenodd');
      // the loop's guide track (from the panel's opening), so the body is a diagram waiting to be drawn
      c.save(); c.setLineDash([2, 7]); c.strokeStyle = WHITE(0.2); c.lineWidth = 1;
      c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU); c.stroke(); c.restore();
      // the three arcs, drawn on from "circular": EQUITY (top, out to the AI firm), DEBT (inside it, solid, no
      // direction), COMMITMENTS (bottom, back to the hyperscaler) — coral, the arc the headline number belongs to
      const ak = (d: number, dur = 0.42) => ease.inOutCubic(clamp((t - wCirc.start - d) / dur));
      const kE = ak(0), kD = ak(0.12), kC = ak(0.22);
      const arc = (r: number, a0: number, a1: number, k: number, col: string, lw: number) => {
        if (k <= 0) return;
        c.save(); c.strokeStyle = col; c.lineWidth = lw;
        c.beginPath(); c.ellipse(cx, cy, rx, r, 0, a0, lerp(a0, a1, k)); c.stroke(); c.restore();
      };
      arc(ry, Math.PI, TAU, kE, WHITE(0.85), 2);
      arc(ryDebt, Math.PI, TAU, kD, WHITE(0.85), 2);
      arc(ry, 0, Math.PI, kC, CORAL(0.95), 2.5);
      const chev = (x: number, y: number, dir: 1 | -1, col: string, k: number) => {
        if (k < 1) return;
        c.save(); c.strokeStyle = col; c.lineWidth = 2; c.beginPath();
        c.moveTo(x - dir * 8, y - 8); c.lineTo(x + dir * 2, y); c.lineTo(x - dir * 8, y + 8); c.stroke(); c.restore();
      };
      chev(cx, cy - ry, 1, WHITE(0.9), kE);
      chev(cx, cy + ry, -1, CORAL(), kC);
      const lk = (k: number) => clamp((k - 0.7) / 0.3);
      label(c, 'EQUITY', cx, cy - ry - 14, WHITE(0.8 * lk(kE)), 12, { align: 'center' });
      label(c, 'DEBT', cx, cy - ryDebt - 10, WHITE(0.8 * lk(kD)), 12, { align: 'center' });
      label(c, 'COMMITMENTS', cx, cy + ry + 26, CORAL(lk(kC)), 12, { align: 'center', w: 600 });
      // the flow: dots run round the loop (top out, bottom back) from "deals", accelerating through "Count it up"
      const tf = wDeals.start;
      if (t >= tf) {
        const fk = clamp((t - tf) / 0.3);
        const phs = flowPhase(t, tf, wC1.start);
        const spd = (flowPhase(t + 0.02, tf, wC1.start) - flowPhase(t - 0.02, tf, wC1.start)) / 0.04;
        const trail = clamp((spd - 0.4) * 0.07, 0, 0.16);
        const n = 12;
        const offPill = (x: number, y: number) => !pills.some((q) => Math.abs(x - q.nx) < q.w / 2 + 6 && Math.abs(y - cy) < pillH / 2 + 6);
        for (let i = 0; i < n; i++) {
          const s = (((i / n + phs) % 1) + 1) % 1, th = Math.PI + TAU * s;
          const x = cx + rx * Math.cos(th), y = cy + ry * Math.sin(th);
          const col = (a: number) => (Math.sin(th) > 0 ? CORAL(a * fk) : WHITE(0.95 * a * fk));
          if (trail > 0.005) {
            c.save(); c.lineCap = 'round';
            for (let j = 1; j <= 6; j++) {
              const th0 = th - TAU * trail * ((j - 1) / 6), th1 = th - TAU * trail * (j / 6);
              const xa = cx + rx * Math.cos(th0), ya = cy + ry * Math.sin(th0), xb = cx + rx * Math.cos(th1), yb = cy + ry * Math.sin(th1);
              if (!offPill(xa, ya) || !offPill(xb, yb)) continue;
              c.strokeStyle = col(0.7 * (1 - j / 7)); c.lineWidth = 6 * (1 - j / 8);
              c.beginPath(); c.moveTo(xa, ya); c.lineTo(xb, yb); c.stroke();
            }
            c.restore();
          }
          if (!offPill(x, y)) continue;
          dot(c, x, y, 4, col(1));
        }
      }
      // the headline's coral leader down to the COMMITMENTS arc (it is their number, not the loop's total)
      const size = 100, ny = cy + 36;
      if (t >= wTr.start) hair(c, cx, ny + 12, cx, cy + ry - 12, CORAL(0.9 * clamp((t - wTr.start) / 0.2)), 1.5);
      c.restore();
      // the two nodes: plain pills carrying only their role (pop on "fourteen")
      if (nk > 1e-3) for (const q of pills) {
        c.save();
        c.translate(q.nx, cy); c.scale(nk, nk);
        c.fillStyle = PANEL; c.fillRect(-q.w / 2, -pillH / 2, q.w, pillH);
        c.strokeStyle = WHITE(0.92); c.lineWidth = 1.5; c.strokeRect(-q.w / 2 + 0.5, -pillH / 2 + 0.5, q.w - 1, pillH - 1);
        text(c, q.s, 0, 5, pillFam, pillSize, WHITE(0.95), { align: 'center', track: pillTr });
        c.restore();
      }
      // the headline: the complete $1.4TN in coral, its contact frame exactly on "trillion" (brief.ts land: the
      // final string is the only one ever drawn), pulsed on each "Count"
      const Ld = land(t, wTr.start, { amp: 0.3 });
      if (Ld.on) {
        const fam = FONT.grot(900), tr = -size * 0.03;
        const fw = measure(HEAD7, fam, size, tr), xs = cx - fw / 2, my = ny - size * 0.36;
        const pk = Math.max(pulse(t, wC1.start, 0.08), pulse(t, wC2.start, 0.08));
        c.save();
        applyLand(c, Ld, cx, my);
        if (pk > 0.01) { const sc = 1 + 0.07 * pk; c.translate(cx, my); c.scale(sc, sc); c.translate(-cx, -my); }
        c.fillStyle = PANEL; c.fillRect(xs - 12, ny - size * 0.8, fw + 24, size * 0.9);
        text(c, HEAD7, xs, ny, fam, size, CORAL(), { track: tr });
        c.restore();
      }
      // its label (the revenue-commitments caveat): the first line from the opening (with the footer), the bracketed
      // split lands with the headline on "trillion"
      const ly = cy + ry + 46;
      hair(c, x0 + PAD7, ly, x1 - PAD7, ly, WHITE(0.18));
      const aA = ease.outExpo(clamp((t - (tIn + 0.1)) / 0.2));
      if (aA > 0) text(c, LAB7A, x0 + PAD7, ly + 32, FONT.mono(600), 17, WHITE(0.95 * aA), { track: 1.4 });
      if (Ld.on) {
        const a = ease.outExpo(clamp((t - (wTr.start - 0.07)) / 0.2));
        text(c, LAB7B, x0 + PAD7 + (1 - a) * 18, ly + 58, FONT.mono(600), 17, WHITE(0.8 * a), { track: 1.4 });
      }
    },
  });
  if (hh < P7.h - 0.5) ridingFooter(c, x0, y0 + Math.max(hh, FOOT_H) - FOOT_H, w, hh <= FOOT_H);
  // the panel edge flashes on each "Count" and "up"
  const bf = Math.max(...[wC1, wU1, wC2, wU2].map((b) => pulse(t, b.start, 0.08)));
  if (bf > 0.02 && p.hh > 0) {
    c.save();
    c.strokeStyle = WHITE(0.9 * bf); c.lineWidth = 2; c.strokeRect(x0 - 1, y0 - 1, w + 2, Math.max(p.hh, FOOT_H) + 2);
    c.restore();
  }
}

// ====================================================================== chorus pieces
/** ink: the white chapter. ttX: left edge of the tell-tale row (null = centred under the masthead). */
type Variant = { ink: boolean; ttX?: number | null };
const band = (X: X, L: Line) => Math.max(mastExtent(X, L).base + 70, 770);

/** Dash tell-tales under the masthead: LIGHTS · ON, EYES · OPEN, then RACING (chevrons) or MORNING (sunrise). */
function tellTales(c: Ctx, X: X, L: Line, tOut: number, v: Variant) {
  const t = X.t, ink = v.ink;
  if (t < L.start - 0.05 || t >= tOut) return;
  const morning = /morning/i.test(L.text);
  const items = [
    { k: 'LIGHTS', v: 'ON', tk: wd(L, 'lights').start, tv: wd(L, 'on').start },
    { k: 'EYES', v: 'OPEN', tk: wd(L, 'eyes').start, tv: wd(L, 'open').start },
    morning ? { k: 'MORNING', v: '', tk: wd(L, 'morning').start, tv: wd(L, 'light', 1).start } : { k: 'RACING', v: '', tk: wd(L, 'racing').start, tv: wd(L, 'racing').start },
  ];
  const fam = FONT.mono(700), size = 20, tr = 3.5, h = 52, gap = 18, padX = 18, lampW = 26, valW = 92, iconW = 74;
  const widths = items.map((it, i) => padX + lampW + measure(it.k, fam, size, tr) + 14 + (i < 2 ? valW : iconW) + 6);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  let x = v.ttX ?? MID - total / 2;
  const y = band(X, L);
  c.save(); c.globalAlpha *= vanish(t, tOut, 0.2);
  items.forEach((it, i) => {
    const wI = widths[i]!, k = clamp((t - it.tk + 0.02) / 0.22);
    if (k <= 0) { x += wI + gap; return; }
    const on = t >= it.tv - 0.02;
    c.save();
    c.globalAlpha *= clamp(k * 2);
    slam(c, x + wI / 2, y + h / 2, k, 0.25);
    c.fillStyle = ink ? INK(1) : PANEL; c.fillRect(x, y, wI, h);
    if (!ink) chipEdge(c, x, y, wI, h);
    const fg = ink ? PAPER(1) : WHITE(0.95), dim = ink ? PAPER(0.35) : WHITE(0.3);
    const lyc = y + h / 2;
    lamp(c, x + padX + 8, lyc, t, it.tv, ink);
    const kw = text(c, it.k, x + padX + lampW, y + h / 2 + 7, fam, size, fg, { track: tr });
    const vx = x + padX + lampW + kw + 14;
    if (i < 2) {
      // the value window: dim outline until its word, then the value slammed in, inverted
      if (on) {
        const vk = clamp((t - it.tv) / 0.14);
        c.fillStyle = ink ? PAPER(1) : WHITE(0.96); c.fillRect(vx, y + 9, valW - 4, h - 18);
        c.save(); c.globalAlpha *= clamp(vk * 2);
        text(c, it.v, vx + (valW - 4) / 2, y + h / 2 + 7, fam, size, INK(), { align: 'center', track: tr });
        c.restore();
      } else {
        c.strokeStyle = dim; c.lineWidth = 1; c.strokeRect(vx + 0.5, y + 9.5, valW - 5, h - 19);
      }
    } else if (!morning) {
      // chevrons chasing right, one step per eighth note with a short trail (the race)
      const n = 4, step = ((Math.floor(X.beat(t) * 2) % n) + n) % n;
      for (let j = 0; j < n; j++) {
        const a = j === step ? 0.95 : j === (step + n - 1) % n ? 0.55 : 0.25;
        const cxj = vx + 10 + j * 16;
        c.strokeStyle = ink ? PAPER(a) : WHITE(a); c.lineWidth = 3;
        c.beginPath(); c.moveTo(cxj, lyc - 10); c.lineTo(cxj + 9, lyc); c.lineTo(cxj, lyc + 10); c.stroke();
      }
    } else {
      // sunrise: a horizon line and a half disc that rises through "morning" and is full up on "light"
      const rk = ease.outCubic(clamp((t - it.tk) / Math.max(0.2, it.tv - it.tk)));
      const sx = vx + 34, hy = lyc + 9;
      c.save(); c.beginPath(); c.rect(vx, y + 6, iconW, hy - y - 6); c.clip();
      c.fillStyle = fg; c.beginPath(); c.arc(sx, hy + 14 - 22 * rk, 13, 0, TAU); c.fill();
      c.restore();
      hair(c, vx + 4, hy, vx + iconW - 8, hy, fg, 2);
      if (on) for (let j = 0; j < 5; j++) {
        const a = Math.PI + (j + 0.5) * (Math.PI / 5);
        hair(c, sx + Math.cos(a) * 18, hy + Math.sin(a) * 18 - 4, sx + Math.cos(a) * 24, hy + Math.sin(a) * 24 - 4, fg, 2);
      }
    }
    c.restore();
    x += wI + gap;
  });
  c.restore();
}

/** chorus1 · "Hold the line together, hold it, hold it tight": a lane-hold read-out — the lane edges draw on, the
 *  centre line rolls toward us on the beat, the car holds the right lane, and the lane tightens on "together", each
 *  "hold" and "tight". It sits in the dark lower-left of the K02 plate, clear of the singer's raised arm and face.
 *  Every white mark has a dark under-stroke so it holds over a stage-lit plate. */
const LANE_X = 360;
function laneHold(c: Ctx, X: X, L: Line, tOut: number) {
  const t = X.t;
  const wH = L.words[0]!, wLine = wd(L, 'line'), wTog = wd(L, 'together'), wH2 = wd(L, 'hold', 1), wH3 = wd(L, 'hold', 2), wT = wd(L, 'tight');
  if (t < wH.start - 0.05 || t >= tOut) return;
  const cx0 = LANE_X, yT = band(X, L) - 6, yB = 985;
  const steps = [wTog.start, wH2.start, wH3.start, wT.start];
  let squeeze = 0;
  for (const ts of steps) squeeze += 0.25 * ease.outBack(clamp((t - ts) / 0.22), 2.2);
  const halfB = lerp(210, 140, squeeze), halfT = lerp(80, 48, squeeze);
  const drift = (1 - squeeze) * (Math.sin((t - wH.start) * 2.4) * 22 + (X.env('bass') - 0.5) * 14);
  const ek = ease.outCubic(clamp((t - wH.start) / 0.35));
  const flash = Math.max(...steps.map((s) => pulse(t, s, 0.07)));
  const locked = t >= wT.start;
  c.save(); c.globalAlpha *= vanish(t, tOut, 0.2);
  // lane edges (drawn on from the bottom)
  for (const side of [-1, 1]) {
    const xb = cx0 + side * halfB, xt = cx0 + side * halfT;
    const xe = lerp(xb, xt, ek), ye = lerp(yB, yT, ek);
    c.save(); c.lineCap = 'round';
    c.strokeStyle = UNDER; c.lineWidth = locked ? 12 : 8;
    c.beginPath(); c.moveTo(xb, yB); c.lineTo(xe, ye); c.stroke();
    c.strokeStyle = WHITE(0.75 + 0.25 * flash); c.lineWidth = locked ? 6 : 3 + 2 * flash;
    c.beginPath(); c.moveTo(xb, yB); c.lineTo(xe, ye); c.stroke();
    c.restore();
  }
  // centre dashes rolling toward us, one dash per beat, from "line"
  if (t >= wLine.start) {
    const dk = clamp((t - wLine.start) / 0.2);
    const ph = X.beat(t) % 1;
    for (let j = -1; j < 4; j++) {
      const u0 = (j + ph) / 4, u1 = u0 + 0.11; // 0 = far (top), 1 = near (bottom)
      if (u1 <= 0 || u0 >= 1) continue;
      const a = clamp(u0), b = clamp(u1);
      const y0 = lerp(yT, yB, a * a), y1 = lerp(yT, yB, b * b);
      const w0 = lerp(3, 8, a), w1 = lerp(3, 8, b);
      const quad = (e: number) => { c.beginPath(); c.moveTo(cx0 - w0 - e, y0 - e); c.lineTo(cx0 + w0 + e, y0 - e); c.lineTo(cx0 + w1 + e, y1 + e); c.lineTo(cx0 - w1 - e, y1 + e); c.closePath(); c.fill(); };
      c.save(); c.globalAlpha *= dk;
      c.fillStyle = UNDER; quad(2);
      c.fillStyle = WHITE(0.85); quad(0);
      c.restore();
    }
  }
  // the car: a chevron holding the right lane (centred in it), drifting less as the lane tightens
  const carY = yB - 46;
  const halfCar = lerp(halfB, halfT, (yB - carY) / Math.max(1, yB - yT));
  const carX = cx0 + halfCar * 0.5 + drift * 0.6;
  c.save(); c.globalAlpha *= ek;
  c.beginPath(); c.moveTo(carX, carY - 18); c.lineTo(carX + 18, carY + 14); c.lineTo(carX, carY + 6); c.lineTo(carX - 18, carY + 14); c.closePath();
  c.strokeStyle = UNDER; c.lineWidth = 4; c.lineJoin = 'round'; c.stroke();
  c.fillStyle = locked ? CORAL() : WHITE(0.96); c.fill();
  c.restore();
  // caption chip, above-left of the lane's far end (the open dark of the plate, clear of the bar ruler at x < 80)
  c.save(); c.globalAlpha *= clamp((t - wH.start) / 0.2);
  chip(c, locked ? 'LANE HOLD · LOCKED' : 'LANE HOLD', GL, yT - 38, false, 'left');
  c.restore();
  c.restore();
}

/** chorus2 · "Some say hit the brakes, and some say full speed tonight": two identical chips, BRAKES and FULL SPEED,
 *  each under its own SOME SAY, parted to either side of the singer (K12) so neither covers her. Each chip's lamp
 *  lights and its label window inverts on its word ("brakes", "speed"). Same size both sides, nothing fills or
 *  grows: no quantity, no side wins. */
function brakesSpeed(c: Ctx, X: X, L: Line, tOut: number) {
  const t = X.t;
  const wS1 = wd(L, 'some'), wB = wd(L, 'brakes'), wS2 = wd(L, 'some', 1), wSp = wd(L, 'speed');
  if (t < wS1.start - 0.05 || t >= tOut) return;
  const fam = FONT.mono(700), size = 22, tr = 4, h = 64, padX = 18, lampW = 30, gap = 800;
  const plateW = Math.max(measure('BRAKES', fam, size, tr), measure('FULL SPEED', fam, size, tr)) + 28;
  const cw = padX + lampW + plateW + padX;
  const y = band(X, L) + 14;
  const sides = [
    { s: 'BRAKES', x: MID - gap / 2 - cw, tIn: wS1.start, tOn: wB.start, align: 'left' as const },
    { s: 'FULL SPEED', x: MID + gap / 2, tIn: wS2.start, tOn: wSp.start, align: 'right' as const },
  ];
  c.save(); c.globalAlpha *= vanish(t, tOut, 0.2);
  for (const sd of sides) {
    const k = clamp((t - sd.tIn + 0.02) / 0.22);
    if (k <= 0) continue;
    const on = t >= sd.tOn - 0.02, lyc = y + h / 2;
    c.save();
    c.globalAlpha *= clamp(k * 2);
    slam(c, sd.x + cw / 2, lyc, k, 0.25);
    c.fillStyle = PANEL; c.fillRect(sd.x, y, cw, h);
    chipEdge(c, sd.x, y, cw, h, 9);
    lamp(c, sd.x + padX + 9, lyc, t, sd.tOn, false);
    // the label window: outlined until its word, then inverted — a fixed plate, identical on both sides
    const vx = sd.x + padX + lampW, vy = y + 10, vh = h - 20;
    if (on) {
      c.fillStyle = WHITE(0.96); c.fillRect(vx, vy, plateW, vh);
      const g = pulse(t, sd.tOn, 0.08);
      if (g > 0.02) { c.strokeStyle = WHITE(g); c.lineWidth = 2; c.strokeRect(vx - 4 * (1 - g), vy - 4 * (1 - g), plateW + 8 * (1 - g), vh + 8 * (1 - g)); }
    } else {
      c.strokeStyle = WHITE(0.3); c.lineWidth = 1; c.strokeRect(vx + 0.5, vy + 0.5, plateW - 1, vh - 1);
    }
    text(c, sd.s, vx + plateW / 2 + tr / 2, lyc + 8, fam, size, on ? INK() : WHITE(0.9), { align: 'center', track: tr });
    c.restore();
    // "some say" over each chip, on its word
    c.save(); c.globalAlpha *= clamp((t - sd.tIn) / 0.15);
    chip(c, 'SOME SAY', sd.align === 'left' ? sd.x : sd.x + cw, y - 30, false, sd.align);
    c.restore();
  }
  c.restore();
}

/** chorus3 · "Every voice together, every hand held tight": on a paper card (the brief.ts paper panel, ink edge),
 *  a row of voice bars, each its own level, that fall into one unison level on "together"; on "held" a clamp
 *  closes across their tops, tight on "tight". */
function unison(c: Ctx, X: X, L: Line, tOut: number) {
  const t = X.t;
  const wE = L.words[0]!, wTog = wd(L, 'together'), wHeld = wd(L, 'held'), wT = wd(L, 'tight');
  if (t < wE.start - 0.05 || t >= tOut) return;
  const n = 44, bw = 1100 / n, x0 = MID - 550, yMid = band(X, L) + 70, hMax = 130;
  const cardW = 1180, cardH = 188;
  const uk = ease.outExpo(clamp((t - wTog.start) / 0.45));
  const vox = X.env('vocal');
  const level = 0.5 + 0.3 * vox;
  const k = enter(t, wE.start - 0.02, DUR.panel);
  panel(c, MID - cardW / 2, yMid - cardH / 2, cardW, cardH, {
    k, alpha: leave(t, tOut), paper: true, ink: true,
    draw: () => {
      const kb = ease.outExpo(k);
      for (let i = 0; i < n; i++) {
        const own = clamp(0.12 + 0.88 * vox * (0.25 + 0.75 * hash(i, fi(t) >> 1, 5)) * (0.6 + 0.4 * Math.abs(Math.sin(i * 0.7 + t * 5))));
        const v = lerp(own, level, uk) * clamp(kb * 1.3 - (i / n) * 0.3);
        const h = Math.max(3, v * hMax);
        c.fillStyle = INK(1);
        c.fillRect(x0 + i * bw + bw * 0.2, yMid - h / 2, bw * 0.6, h);
      }
      // the clamp: two hairlines that close on the unison level, the ends bracketed (only from "held")
      if (t >= wHeld.start) {
        const hk = ease.outBack(clamp((t - wHeld.start) / 0.25)), tk = ease.outBack(clamp((t - wT.start) / 0.2), 2.4);
        const half = (level * hMax) / 2 + lerp(20, 6, tk);
        const xa = MID - 560 * hk, xb = MID + 560 * hk;
        hair(c, xa, yMid - half, xb, yMid - half, INK(1), 2);
        hair(c, xa, yMid + half, xb, yMid + half, INK(1), 2);
        for (const xe of [xa, xb]) hair(c, xe, yMid - half, xe, yMid + half, INK(1), 3);
      }
    },
  });
  if (t >= wTog.start) {
    c.save(); c.globalAlpha *= clamp((t - wTog.start) / 0.2) * vanish(t, tOut, 0.2);
    chip(c, t >= wHeld.start ? 'UNISON · HELD' : 'UNISON', MID, yMid + cardH / 2 + 12, true, 'center');
    c.restore();
  }
}

/** Steering rim (the top of a wheel, seen from the seat) under the masthead: it wanders on "future coming", swings
 *  left-right on "steer", snaps right and back to centre on "right?", and asks "?" over its top mark. */
function steeringRim(c: Ctx, X: X, L: Line, tOut: number, v: Variant) {
  const t = X.t, ink = v.ink;
  const wF = L.words[0]!, wSt = wd(L, 'steer'), wR = wd(L, 'right');
  if (t < wF.start - 0.05 || t >= tOut) return;
  // set low enough that the "?" plate clears the masthead baseline by ~40 px
  const R = 560, top = band(X, L) + 54, cx = MID, cy = top + R, rw = 34;
  const tt = t - wF.start;
  // the angle (rad): a wander, the steer S-swing, the "right?" snap, then centre
  const kR = clamp((t - wR.start) / 0.6);
  let a = (0.07 * Math.sin(tt * 2.3) + 0.03 * Math.sin(tt * 6.1 + 1) + 0.02 * (X.env('bass') - 0.5)) * (1 - ease.inOutCubic(kR));
  const us = clamp((t - wSt.start) / Math.max(0.3, wSt.end - wSt.start + 0.1));
  a += -0.36 * Math.sin(TAU * us) * (1 - us * 0.3);
  if (t >= wR.start) {
    const r1 = ease.outCubic(clamp((t - wR.start) / 0.22));
    const r2 = ease.outBack(clamp((t - wR.start - 0.22) / 0.45), 2.2);
    a += 0.3 * r1 * (1 - r2);
  }
  const k = ease.outExpo(clamp((t - wF.start) / 0.5));
  const span = 0.95 * k; // half-angle of the rim drawn (rad from the top)
  c.save(); c.globalAlpha *= vanish(t, tOut, 0.2);
  c.save();
  c.beginPath(); c.rect(GL, top - 120, GR - GL, 1000 - (top - 120)); c.clip();
  // rim band
  const a0 = -Math.PI / 2 - span, a1 = -Math.PI / 2 + span;
  c.beginPath(); c.arc(cx, cy, R, a0, a1); c.arc(cx, cy, R - rw, a1, a0, true); c.closePath();
  c.fillStyle = ink ? INK(1) : PANEL; c.fill();
  c.strokeStyle = ink ? INK(1) : WHITE(0.85); c.lineWidth = 1.5;
  c.beginPath(); c.arc(cx, cy, R, a0, a1); c.stroke();
  c.beginPath(); c.arc(cx, cy, R - rw, a0, a1); c.stroke();
  // grip ticks that turn with the wheel
  const fg = ink ? PAPER(0.75) : WHITE(0.6);
  for (let i = -24; i <= 24; i++) {
    const ang = -Math.PI / 2 + a + i * 0.045;
    if (ang < a0 + 0.01 || ang > a1 - 0.01) continue;
    const r0 = R - rw + 8, r1 = R - 8 - (i % 4 === 0 ? 0 : 8);
    hair(c, cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0, cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1, fg, i % 4 === 0 ? 2 : 1);
  }
  // the top mark (coral) — where the wheel points
  const am = -Math.PI / 2 + a;
  c.strokeStyle = CORAL(); c.lineWidth = 10; c.lineCap = 'butt';
  c.beginPath(); c.arc(cx, cy, R - rw / 2, am - 0.03, am + 0.03); c.stroke();
  // centre datum (fixed): a small notch above the rim
  hair(c, cx, top - 22, cx, top - 6, ink ? INK(1) : WHITE(0.9), 2);
  c.restore();
  // "?" over the mark once the wheel is back on centre after "right?"
  const qk = clamp((t - wR.start - 0.22) / 0.18);
  if (qk > 0) {
    const mx = cx + Math.cos(am) * (R + 30), my = cy + Math.sin(am) * (R + 30);
    c.save(); slam(c, mx, my - 18, qk, 0.5); c.globalAlpha *= clamp(qk * 2);
    c.fillStyle = ink ? INK(1) : WHITE(0.96); c.fillRect(mx - 26, my - 62, 52, 56);
    text(c, '?', mx, my - 16, FONT.grot(900), 46, ink ? PAPER(1) : INK(), { align: 'center' });
    c.restore();
  }
  c.restore();
}

/** A CV search box (corner brackets, hairline outline, crosshair) with a big mono tab, slammed in at t0. The
 *  brackets and crosshair carry an under-stroke (paper on the white chapter, dark otherwise) to hold over footage. */
function searchBox(c: Ctx, b: Box, t: number, t0: number, tab: string, o: { ink: boolean; jitter: number }) {
  const k = clamp((t - t0) / 0.22);
  if (k <= 0) return null;
  const col = o.ink ? INK(1) : WHITE(0.95), under = o.ink ? PAPER(0.9) : 'rgba(8,9,11,0.55)';
  const j = o.jitter * 1.2;
  const x = b.x + (hash(fi(t), 1) - 0.5) * j, y = b.y + (hash(fi(t), 2) - 0.5) * j;
  const sc = lerp(1.22, 1, ease.outExpo(k));
  const w = b.w * sc, h = b.h * sc, x0 = x + b.w / 2 - w / 2, y0 = y + b.h / 2 - h / 2;
  const l = Math.min(Math.min(w, h) * 0.15, 60);
  const cx = x0 + w / 2, cy = y0 + h / 2;
  c.save();
  c.globalAlpha *= clamp(k * 2);
  c.strokeStyle = o.ink ? INK(0.55) : WHITE(0.25); c.lineWidth = 1; c.strokeRect(x0, y0, w, h);
  const marks = (cross: boolean) => {
    c.beginPath();
    for (const [px, py, sx, sy] of [[x0, y0, 1, 1], [x0 + w, y0, -1, 1], [x0, y0 + h, 1, -1], [x0 + w, y0 + h, -1, -1]] as const) {
      c.moveTo(px + sx * l, py); c.lineTo(px, py); c.lineTo(px, py + sy * l);
    }
    if (cross) { c.moveTo(cx - 12, cy); c.lineTo(cx + 12, cy); c.moveTo(cx, cy - 12); c.lineTo(cx, cy + 12); }
  };
  c.lineJoin = 'miter';
  marks(true); c.strokeStyle = under; c.lineWidth = 6; c.stroke();
  marks(true); c.strokeStyle = col; c.lineWidth = 2.5; c.stroke();
  // the tab: mono 18, filled
  const fam = FONT.mono(700), size = 18, tr = 2.2, th = 32;
  const tw = measure(tab, fam, size, tr) + 20;
  c.fillStyle = col; c.fillRect(x0, y0 - th, tw, th);
  text(c, tab, x0 + 10, y0 - th / 2 + size * 0.36, fam, size, o.ink ? PAPER(1) : INK(), { track: tr });
  c.restore();
  return { x: x0, y: y0, w, h };
}

/** The driver's place in the footage, in SOURCE 0..1 coords (mapped through the shot's camera with X.px):
 *  p_K04 / p_K14 — one clip, a fixed in-car camera: the steering wheel and the empty seat in front of it.
 *  p_K15_0 — the 1956 driverless "car of tomorrow" gliding round its ramp (no YOLO track: a moving static box keyed
 *  to its headlights, measured on the conformed frames 1–12 — the car speeds up toward the lower right). p_K15_1 /
 *  p_K24 — the car ahead in the tunnel (YOLO 'car'). */
const WHEEL: [number, number, number, number] = [0.17, 0.26, 0.53, 0.84];
/** [clip frame (0-based, 24 fps), headlight x, headlight y] in source 0..1 */
const BUBBLE_HL: [number, number, number][] = [[0, 0.348, 0.672], [2, 0.365, 0.71], [3, 0.415, 0.773], [4, 0.441, 0.809], [6, 0.471, 0.845], [7, 0.534, 0.912], [8, 0.572, 0.951], [11, 0.607, 0.984]];
function bubbleBox(lt: number): [number, number, number, number] {
  const f = lt * 24, K = BUBBLE_HL;
  let j = 0;
  while (j < K.length - 2 && f > K[j + 1]![0]) j++;
  const a = K[j]!, b = K[j + 1]!, u = clamp((f - a[0]) / (b[0] - a[0]));
  const hx = lerp(a[1], b[1], u), hy = lerp(a[2], b[2], u);
  // the car body sits up-left of its headlights (it drives toward the lower right)
  return [hx - 0.08, hy - 0.17, hx + 0.06, hy + 0.05];
}
/** The bubble-car box is held at the car's frame-6 place (headlight ~0.47, 0.85 — box clear of the ticker and, with
 *  its DRIVER tab, of the masthead) for the whole 0.47 s piece: the car leaves the frame by ~0.3 s and spends frames
 *  0–2 behind the giant word, so a following box would hide its tab behind the masthead and then frame an empty
 *  ramp. Held, the box locks on where the car is going, the car drives into it under the "?" and out through it. */
const BUBBLE_HOLD = 0.25;
function driverPlace(X: X): { b: Box; wheel: boolean } | null {
  const id = X.base?.kind === 'clip' ? X.base.id : '';
  if (id === 'p_K04' || id === 'p_K14') return { b: X.px(WHEEL), wheel: true };
  if (id === 'p_K15_0') return { b: X.px(bubbleBox(BUBBLE_HOLD)), wheel: false };
  const car = X.track('car');
  if (car && car.w > 30) {
    // the tracked car with room around it (the "?" plate sits in the box's top-right corner, off the car)
    const w = Math.max(car.w * 1.6, 300), h = Math.max(car.h * 1.5, 200);
    return { b: { x: car.x + car.w / 2 - w / 2, y: car.y + car.h / 2 - h / 2, w, h }, wheel: false };
  }
  return null;
}

/** "Who's at the wheel?": a CV search box that re-acquires on every word of the question, settles on "wheel?" on the
 *  driver's place in the footage (driverPlace) — and finds nobody: DRIVER ? and a "?" in the box. No score, no
 *  number. After it settles it re-acquires at each new shot (chorus2's echoed "(Who's at the wheel?)" runs over the
 *  1956 bubble car and the tunnel), and the settled "?" pulses on each echoed word. */
function driverSearch(c: Ctx, X: X, events: number[], settleT: number, echo: number[], tOut: number, mastBase: number, v: Variant) {
  const t = X.t, t0 = events[0]!;
  if (t < t0 - 0.02 || t >= tOut) return;
  const top = 762, bot = 986;
  const home = { x: MID - 330, y: top, w: 660, h: bot - top };
  let last = t0, idx = 0;
  events.forEach((e, i) => { if (t >= e - 0.02) { last = e; idx = i; } });
  const settled = t >= settleT - 0.02;
  const reacq = settled && X.shot.t0 > settleT;
  if (reacq) last = X.shot.t0; // a new shot after it settled: acquire again
  let b: Box = home, wheel = true; // the home box (nothing found) keeps the under-the-masthead "?" rule
  if (!settled) {
    const jx = (hash(idx, 17) - 0.5) * 560, jy = (hash(idx, 23) - 0.5) * 50, js = 0.6 + 0.3 * hash(idx, 29);
    const w = home.w * js, h = home.h * js;
    b = { x: clamp(MID + jx - w / 2, GL + 10, GR - w), y: clamp(top + (home.h - h) / 2 + jy, top, bot - h), w, h };
  } else {
    const dp = driverPlace(X);
    if (dp) {
      // keep it off the ticker band and the chrome's top strip; a box round a car also keeps its DRIVER tab (32 px
      // above it) clear of the masthead's baseline (the wheel box spans the masthead by design)
      const p = dp.b, y1 = Math.min(p.y + p.h, 990);
      let y0 = Math.max(p.y, 110, dp.wheel ? 0 : mastBase + 44);
      const hb = Math.max(120, y1 - y0);
      y0 = Math.min(y0, 990 - hb);
      b = { x: clamp(p.x, GL, GR - p.w), y: y0, w: p.w, h: hb };
      wheel = dp.wheel;
    }
  }
  c.save(); c.globalAlpha *= vanish(t, tOut, 0.14);
  const r = searchBox(c, b, t, last, 'DRIVER ?', { ink: v.ink, jitter: settled ? 1 : 2.5 });
  if (r && !settled) {
    // a scan line sweeping the box while it searches
    const u = ((t - last) * 2.2) % 1;
    hair(c, r.x + 4, r.y + r.h * u, r.x + r.w - 4, r.y + r.h * u, v.ink ? INK(0.6) : WHITE(0.5), 1);
  }
  if (r && settled) {
    // nobody there: a "?" plate slams into the box (pulses on each echoed word). On the wheel box it sits at the
    // centre, or just under the masthead when the centre is behind the giant word; on a box round a car it sits in
    // the box's top-right inside corner, smaller, so the subject the box found stays in view. A re-acquire at a
    // shot cut (the 0.47 s echo pieces) lands it faster.
    const qk = reacq ? clamp((t - last - 0.04) / 0.12) : clamp((t - last - 0.12) / 0.18);
    if (qk > 0) {
      const pw = wheel ? 68 : 56, ph = wheel ? 88 : 72, fs = wheel ? 74 : 60;
      let cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      if (wheel) { if (cy - 44 < mastBase + 14) cy = Math.min(mastBase + 58, r.y + r.h - 48); }
      else { cx = r.x + r.w - 40; cy = r.y + 50; }
      const ep = echo.length ? Math.max(...echo.map((e) => pulse(t, e, 0.08))) : 0;
      c.save(); slam(c, cx, cy, qk, 0.5); c.globalAlpha *= clamp(qk * 2);
      if (ep > 0.01) { const sc = 1 + 0.12 * ep; c.translate(cx, cy); c.scale(sc, sc); c.translate(-cx, -cy); }
      c.fillStyle = v.ink ? INK(1) : WHITE(0.96); c.fillRect(cx - pw / 2, cy - ph / 2, pw, ph);
      text(c, '?', cx, cy + fs * 0.35, FONT.grot(900), fs, v.ink ? PAPER(1) : INK(), { align: 'center' });
      c.restore();
    }
  }
  c.restore();
}

/** The crowd's shout (not the lyric — the masthead carries the words): a CROWD chip over a strip of voice bars on the
 *  vocal envelope. The strip grows one segment per sung word (that segment flashes coral), and on the last word it
 *  slams and the whole strip goes coral. */
function crowdShout(c: Ctx, X: X, words: Word[], tOut: number, v: Variant) {
  const t = X.t;
  if (!words.length || t < words[0]!.start - 0.03 || t >= tOut) return;
  const n = words.length, fw = 760, h = 96, y = 812, x0 = MID - fw / 2;
  const last = words[n - 1]!;
  let i = 0;
  words.forEach((w, j) => { if (t >= w.start - 0.03) i = j; });
  const g = ease.outExpo(clamp((t - words[i]!.start + 0.03) / 0.18));
  const tw = fw * lerp(i / n, (i + 1) / n, g);
  const sk = clamp((t - last.start) / 0.18);
  c.save(); c.globalAlpha *= vanish(t, tOut, 0.15);
  c.save(); c.globalAlpha *= clamp((t - words[0]!.start + 0.03) / 0.12);
  chip(c, v.ink ? 'CROWD' : 'CROWD · ANSWER', x0, y - 30, v.ink);
  c.restore();
  c.save();
  if (t >= last.start) slam(c, x0 + tw / 2, y + h / 2, sk, 0.28);
  c.fillStyle = v.ink ? INK(1) : PANEL; c.fillRect(x0, y, tw, h);
  if (!v.ink) { c.strokeStyle = WHITE(0.22); c.lineWidth = 1; c.strokeRect(x0 + 0.5, y + 0.5, tw - 1, h - 1); }
  c.fillStyle = CORAL(); c.fillRect(x0, y, 8, h);
  c.beginPath(); c.rect(x0 + 8, y, Math.max(0, tw - 8), h); c.clip();
  const nb = 46, bw = (fw - 40) / nb, vox = X.env('vocal'), yc = y + h / 2, hMax = h - 26;
  const fg = v.ink ? PAPER(0.95) : WHITE(0.9);
  const shout = t >= last.start - 0.02;
  for (let j = 0; j < nb; j++) {
    const u = (j + 0.5) / nb, seg = Math.min(n - 1, Math.floor(u * n));
    const lv = clamp(0.15 + 0.85 * vox * (0.3 + 0.7 * hash(j, fi(t) >> 1, 9)) * (0.6 + 0.4 * Math.abs(Math.sin(j * 0.8 + t * 6))));
    const ts = words[seg]!.start;
    const hot = shout || (t >= ts - 0.03 && t < ts + 0.16);
    const bh = Math.max(4, lv * hMax);
    c.fillStyle = hot ? CORAL() : fg;
    c.fillRect(x0 + 24 + j * bw, yc - bh / 2, bw * 0.55, bh);
  }
  c.restore();
  c.restore();
}

// ====================================================================== the chapters
interface ChorusSpec { n: number; ink: boolean; k: [string, string, string, string, string]; ttX: number | null }
const CH: Record<string, ChorusSpec> = {
  chorus1: { n: 0, ink: false, k: ['K01', 'K02', 'K03', 'K04', 'K05'], ttX: null },
  chorus2: { n: 1, ink: false, k: ['K11', 'K12', 'K13', 'K14', 'K15'], ttX: null },
  // c3: the tell-tale row sits lower-left, clear of the K21 dancer (she turns from centre to right of centre)
  chorus3: { n: 2, ink: true, k: ['K21', 'K22', 'K23', 'K24', 'K25'], ttX: 140 },
};
/** White chapter: a flat paper veil over plates that are dark by nature, so they sit in the chapter's high key
 *  (a grade cannot lift blacks above mid-grey: contrast pivots on 0.18). Drawn under every graphic. */
const VEIL: Record<string, number> = { K24: 0.08 };
/** Per-piece flat dark veil (keyed on the montage piece id — storyboard.d can only grade a whole montage): K05.0's
 *  hood-cam avenue is milky grey-green, the one washed-out plate of the chorus1 neon run. Drawn under every graphic. */
const DIM: Record<string, number> = { 'K05.0': 0.55 };
/** Masthead pool: coral (relative luminance ~0.24) only reads over a plate that is clearly darker or clearly
 *  lighter. Measured behind the masthead (linear luminance, coral pixels excluded): K01's stage haze 0.28–0.37 (60–70 %
 *  of pixels above 0.15), K11's green beams 0.12–0.14, K12's teal haze ~0.10, the amber aerial interchange of K05.1 and K15.2 (coral's own
 *  hue family) — the dead zone. A soft dark pool under the giant word takes those plates below ~0.05; the light rig
 *  above and the crowd's hands below stay in the clear. (Linear-light compositing: it takes ~0.9 to darken 0.4 to
 *  0.04.) Keyed on the shot id, so 'K05.1' / 'K15.2' are those montage pieces only. Drawn under every graphic. */
const MAST_POOL: Record<string, number> = { K01: 0.93, K11: 0.6, K12: 0.6, 'K05.1': 0.88, 'K15.2': 0.88 };
/** The white chapter's version: a PAPER pool under the masthead where the plate stays mid-grey (K24's tunnel walls,
 *  ~0.37 under the word), lifting it to the chapter's white so the coral word reads; the car below the pool's falloff
 *  stays dark (the flat veil is kept light, 0.08: at 0.25+ it alone lifts the car to mid-grey). */
const PAPER_POOL: Record<string, number> = { K24: 0.8 };
function mastPool(c: Ctx, col: (a: number) => string, a: number) {
  const cy = H / 2, rx = 1180, ry = 300;
  c.save();
  c.translate(MID, cy); c.scale(rx / ry, 1);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, ry);
  g.addColorStop(0, col(a)); g.addColorStop(0.6, col(a * 0.9)); g.addColorStop(1, col(0));
  c.fillStyle = g; c.fillRect(-ry, -ry, 2 * ry, 2 * ry);
  c.restore();
}
const DARK = (a: number) => `rgba(5,6,8,${a})`;
function chorusLines(X: X, s: ChorusSpec) {
  const L1 = X.L('Lights on, eyes open', s.n);
  const L2 = s.n === 0 ? X.L('Hold the line together') : s.n === 1 ? X.L('Some say hit the brakes') : X.L('Every voice together');
  const L3 = X.L('Feel the future coming', s.n);
  // "Who's at the wheel?" lines: c1 #0, c2 #1 (+ the echo "(Who's at the wheel?) EYES ON THE ROAD!" #2), c3 #3
  const L4 = X.L("Who's at the wheel", s.n === 0 ? 0 : s.n === 1 ? 1 : 3);
  const L5 = s.n === 2 ? X.L('KEEP ASKING') : X.L('EYES ON THE ROAD', s.n);
  return { L1, L2, L3, L4, L5 };
}
function chorusCuts(X: X, s: ChorusSpec, Ls: ReturnType<typeof chorusLines>) {
  return {
    k2: shotT0(X, s.k[1], Ls.L2.start - 0.1),
    k3: shotT0(X, s.k[2], Ls.L3.start - 0.1),
    k4: shotT0(X, s.k[3], Ls.L4.start - 0.1),
    k5: shotT0(X, s.k[4], Ls.L5.start - 0.1),
  };
}
/** Each line's element holds past its shot cut until the next line's first word (so a payoff that lands just before
 *  the cut is seen at full strength), then leaves in 0.2 s. */
const hold = (cut: number, next: Line) => Math.max(cut, next.words[0]!.start - 0.03);

function chorusDraw(c: Ctx, X: X, s: ChorusSpec) {
  const t = X.t, v: Variant = { ink: s.ink, ttX: s.ttX };
  if (X.base?.kind === 'clip') {
    const id = X.shot.id, dim = DIM[id], veil = VEIL[id], pool = MAST_POOL[id], pp = PAPER_POOL[id];
    if (dim) { c.fillStyle = DARK(dim); c.fillRect(0, 0, W, H); }
    if (veil) { c.fillStyle = PAPER(veil); c.fillRect(0, 0, W, H); }
    if (pool) mastPool(c, DARK, pool);
    if (pp) mastPool(c, PAPER, pp);
  }
  const Ls = chorusLines(X, s), cut = chorusCuts(X, s, Ls);
  const h2 = hold(cut.k2, Ls.L2), h3 = hold(cut.k3, Ls.L3), h4 = hold(cut.k4, Ls.L4);
  if (t < h2) tellTales(c, X, Ls.L1, h2, v);
  else if (t < h3) {
    if (s.n === 0) laneHold(c, X, Ls.L2, h3);
    else if (s.n === 1) brakesSpeed(c, X, Ls.L2, h3);
    else unison(c, X, Ls.L2, h3);
  } else if (t < h4) {
    steeringRim(c, X, Ls.L3, h4, v);
  } else {
    // answer words: from EYES (c2's line opens with the echoed question) / KEEP
    const ans = Ls.L5.words.filter((w, i, a) => i >= a.findIndex((x) => /^(EYES|KEEP)/.test(x.w)));
    const tAns = ans[0]!.start;
    // the search runs from "Who's" and settles on "wheel?"; c2 holds it (and pulses the "?") across the echo, over
    // the 1956 bubble car and the tunnel, until the cut to the interchange (K15.2)
    const q = Ls.L4.words;
    const echo = s.n === 1 ? Ls.L5.words.filter((w) => w.start < tAns).map((w) => w.start) : [];
    const searchOut = s.n === 1 ? Math.min(tAns, shotT0(X, 'K15.2', tAns)) : cut.k5;
    const mastBase = mastExtent(X, s.n === 1 && t >= Ls.L5.start ? Ls.L5 : Ls.L4).base;
    driverSearch(c, X, q.map((w) => w.start), q[q.length - 1]!.start, echo, searchOut, mastBase, v);
    crowdShout(c, X, ans, X.ch.t1, v);
  }
}

function chorusPost(X: X, o: any, s: ChorusSpec) {
  const t = X.t;
  const Ls = chorusLines(X, s);
  const tL = Ls.L1.words[0]!.start;
  const last = Ls.L5.words[Ls.L5.words.length - 1]!.start;
  const ans = Ls.L5.words.find((w) => /^(EYES|KEEP)/.test(w.w))?.start ?? Ls.L5.start;
  const kick = X.hit('kick');
  const z = 1 + 0.016 * kick + 0.045 * pulse(t, tL, 0.12) + 0.03 * pulse(t, ans, 0.1) + 0.04 * pulse(t, last, 0.1);
  o.zoom = (o.zoom ?? 1) * z;
  const amp = 7 * pulse(t, last, 0.07) + 4 * pulse(t, ans, 0.06);
  if (amp > 0.1) o.shake = shakeXY(t, amp, 53 + s.n);
  if (!s.ink) {
    const f = 0.55 * pulse(t, tL, 0.07);
    if (f > 0.01) o.flash = Math.max(o.flash ?? 0, f);
  } else {
    // the key change on the white chapter (a flash would not read on paper, an invert would turn the coral cyan):
    // a harder punch-in and a jolt on "Lights"
    o.zoom = (o.zoom ?? 1) * (1 + 0.04 * pulse(t, tL, 0.12));
    const j = 9 * pulse(t, tL, 0.06);
    if (j > 0.1) o.shake = shakeXY(t, j, 61);
  }
  return o;
}

export const chapters: Record<string, Chapter> = {
  s07: {
    draw(c, X) { circularDeals(c, X); },
    post(X, o) {
      const t = X.t;
      const L = X.L('The IMF flags'), Lc = X.L('Count it up');
      const wTr = wd(L, 'trillion'), wC1 = Lc.words[0]!, wC2 = wd(Lc, 'count', 1);
      // the riser: a slow push-in through "Count it up", punched on each "Count" and on "trillion"
      const push = 0.03 * ease.inCubic(clamp((t - wC1.start) / Math.max(0.3, X.ch.t1 - wC1.start)));
      o.zoom = (o.zoom ?? 1) * (1 + push + 0.035 * pulse(t, wTr.start, 0.1) + 0.025 * pulse(t, wC1.start, 0.09) + 0.035 * pulse(t, wC2.start, 0.09) + 0.008 * X.hit('kick'));
      const amp = 5 * pulse(t, wTr.start, 0.06);
      if (amp > 0.1) o.shake = shakeXY(t, amp, 7);
      return o;
    },
  },
  chorus1: { draw(c, X) { chorusDraw(c, X, CH.chorus1!); }, post(X, o) { return chorusPost(X, o, CH.chorus1!); } },
  chorus2: { draw(c, X) { chorusDraw(c, X, CH.chorus2!); }, post(X, o) { return chorusPost(X, o, CH.chorus2!); } },
  chorus3: { draw(c, X) { chorusDraw(c, X, CH.chorus3!); }, post(X, o) { return chorusPost(X, o, CH.chorus3!); } },
};

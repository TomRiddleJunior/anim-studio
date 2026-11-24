// THE STATE OF THE WORLD — the ending: hope (the bridge), watch (the chanted dates) and close (the spoken outro).
// Pure functions of X.t; every entrance is anchored to a lyric word with X.W. Numbers come only from FACTSHEET.md.
import type { Segment, X } from '../x';
import {
  C, W, H, PAPER, INK, RED, TEAL, SLATE, NIGHT, FONT, text, label, source, hair, pill, scrim, appear, vanish, life,
  clamp, ease, lerp, measure, rgbaHex,
} from '../kit';
import { drawGlobe, type GlobeView, type Highlight, type Pin, type Arc } from '../globe';

// teal on paper needs more ink than the night teal to read
const TEAL_INK = (a = 1) => rgbaHex('#22756A', a);
const PAPER_RGB = '243,239,230';

/** Ken Burns transform of a 1920x1080 plate drawn by X.plate with the same {a, b, z, x, y}: image px -> frame px. */
function kb(t: number, a: number, b: number, z: [number, number], x: [number, number] = [0, 0], y: [number, number] = [0, 0]) {
  const u = ease.inOutQuad(clamp((t - a) / Math.max(0.1, b - a)));
  const zz = lerp(z[0], z[1], u), dx = lerp(x[0], x[1], u) * W, dy = lerp(y[0], y[1], u) * H;
  return (px: number, py: number): [number, number] => [960 + (px - 960) * zz + dx, 540 + (py - 540) * zz + dy];
}

/** A phrase set word by word: each word rises in on its own time. Returns the phrase width. */
function phrase(c: CanvasRenderingContext2D, t: number, words: { s: string; t: number; col?: string }[], x: number, y: number,
  fam: string, size: number, col: string, o: { align?: 'left' | 'center'; d?: number; rise?: number; track?: number } = {}) {
  const sp = measure(' ', fam, size), track = o.track ?? 0;
  const ws = words.map((w) => measure(w.s, fam, size, track));
  const total = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  let xx = o.align === 'center' ? x - total / 2 : x;
  words.forEach((w, i) => {
    const k = appear(t, w.t - 0.03, o.d ?? 0.42);
    if (k > 0) text(c, w.s, xx, y + (1 - k) * size * (o.rise ?? 0.16), fam, size, w.col ?? col, { alpha: k, track });
    xx += ws[i]! + sp;
  });
  return total;
}

/** Sum of decaying pulses at the given times (a deterministic "hit" for words, not drums). */
const pulse = (t: number, times: number[], hl = 0.14) => times.reduce((m, tt) => (t >= tt ? Math.max(m, Math.pow(0.5, (t - tt) / hl)) : m), 0);

const ground = (c: CanvasRenderingContext2D, col: string) => { c.fillStyle = col; c.fillRect(0, 0, W, H); };

// ===================================================================================================== HOPE
function hopeTimes(X: X) {
  const w = (q: string, n = 0) => X.W(q, n).start;
  return {
    and: w('And'), yet: w('yet'),
    ren: w('Renewables'), over: w('overtake'), coal: w('coal'), year: w('year'), iea: w('IEA'), coalD: w('coal demand'), rec: w('record'),
    art: w('Artemis'), took: w('took'), farther: w('farther'), than: w('than'), ever: w('ever'),
    us: w('US'), reg: w('regulators'), appr: w('approved'), sick: w('sickle'), child: w('children'), two: w('two'),
  };
}

const hope: Segment = {
  draw(c, X) {
    const t = X.t, T = hopeTimes(X);
    const cut1 = T.ren, cut2 = T.art, cut3 = T.us - 0.1; // cut3 sits on the heartbeat kick just before "US"

    // ---------------------------------------------------------------- 1 · "And yet." — a pause on the night globe
    if (t < cut1 + 0.5) {
      ground(c, C.night);
      const v = X.view();
      X.globe(c, { ...v, alpha: 0.6 });
      // a teal dawn on the globe's limb, coming up through the pause
      const dawn = appear(t, T.and, 0.9) * 0.9;
      if (dawn > 0) {
        const cx = v.cx ?? 960, cy = v.cy ?? 540, r = v.r;
        const g = c.createRadialGradient(cx, cy, r * 0.86, cx, cy, r * 1.24);
        g.addColorStop(0, TEAL(0)); g.addColorStop(0.36, TEAL(0.3 * dawn)); g.addColorStop(1, TEAL(0));
        c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r * 1.22, 0, Math.PI * 2); c.fill();
      }
      const lg = c.createLinearGradient(0, 0, 1150, 0);
      lg.addColorStop(0, NIGHT(0.92)); lg.addColorStop(0.6, NIGHT(0.6)); lg.addColorStop(1, NIGHT(0));
      c.fillStyle = lg; c.fillRect(0, 0, W, H);
      const fam = FONT.serif(700), size = 184;
      const k = vanish(t, cut1 + 0.05, 0.3);
      c.save(); c.globalAlpha *= k;
      pill(c, 'PROGRESS', 120, 200, { fill: TEAL(), col: INK(), alpha: appear(t, T.and - 0.25, 0.4) });
      const wAnd = measure('And ', fam, size), wYet = measure('yet', fam, size);
      phrase(c, t, [{ s: 'And', t: T.and }, { s: 'yet', t: T.yet }], 120, 600, fam, size, PAPER(0.98), { d: 0.5 });
      const kp = appear(t, T.yet + 0.12, 0.35);
      if (kp > 0) text(c, '.', 120 + wAnd + wYet + 2, 600, fam, size, TEAL(), { alpha: kp });
      // the breath: a teal hairline drawn through the pause
      const ub = ease.outCubic(clamp((t - T.yet) / Math.max(0.2, cut1 - T.yet)));
      if (ub > 0) hair(c, 124, 650, 124 + (wAnd + wYet + 40) * ub, 650, TEAL(0.85), 2);
      c.restore();
    }

    // ---------------------------------------------------------------- 2 · solar dawn: renewables 33% -> 37%
    if (t >= cut1 - 0.02 && t < cut2 + 0.02) {
      const rev = ease.outExpo(clamp((t - cut1) / 0.55)); // the plate rises like a horizon over the pause card
      const top = H * (1 - rev);
      c.save();
      c.beginPath(); c.rect(0, top, W, H - top); c.clip();
      if (!X.plate(c, 'solar_dawn', { a: cut1, b: cut2 + 0.6, z: [1.04, 1.11], y: [0.0, 0.012] })) ground(c, C.paper);
      c.restore();
      if (rev < 1) hair(c, 0, top, W, top, TEAL(0.9 * (1 - rev)), 2);

      // title block: pill + serif headline, until the chart takes the sky
      const kt = life(t, cut1 + 0.08, T.coal - 0.02, 0.45, 0.25);
      if (kt > 0) {
        c.save(); c.globalAlpha *= kt;
        scrim(c, 110, 170, 900, 210, 0.55, PAPER_RGB);
        pill(c, 'PROGRESS', 120, 200, { fill: TEAL(), col: INK() });
        c.translate(0, (1 - kt) * 14);
        text(c, 'Clean power, a lap of the Moon,', 120, 300, FONT.serif(800), 66, INK());
        text(c, 'gene therapy', 120, 374, FONT.serif(800), 66, INK());
        c.restore();
      }

      // the chart: one rising bar, the hopeful number in teal
      const kc = life(t, T.coal, cut2 + 0.2, 0.45, 0.25);
      if (kc > 0) {
        c.save(); c.globalAlpha *= kc; c.translate(0, (1 - appear(t, T.coal, 0.45)) * 16);
        scrim(c, 100, 165, 900, 300, 0.8, PAPER_RGB);
        c.fillStyle = TEAL_INK(); c.fillRect(120, 184, 11, 11);
        label(c, "Renewables' share of world electricity", 142, 195, INK(0.88), 15, { w: 600 });
        const big = FONT.serif(700), bs = 120;
        // 33% (2025) lands with "coal"; 37% (2027) on "year" (no in-between values: only the sheet's two numbers)
        const k33 = appear(t, T.coal, 0.4), k37 = appear(t, T.year, 0.45);
        text(c, '33%', 120, 318 - (1 - k33) * 10, big, bs, INK(0.62), { alpha: k33, track: -2 });
        const w33 = measure('33%', big, bs, -2);
        label(c, '2025', 122, 352, INK(0.62), 14, { alpha: k33 });
        const ax = 120 + w33 + 26;
        const ua = ease.outCubic(clamp((t - T.year) / 0.35));
        if (ua > 0) {
          hair(c, ax, 278, ax + 70 * ua, 278, INK(0.55), 2);
          if (ua > 0.6) { c.save(); c.strokeStyle = INK(0.55); c.lineWidth = 2; c.beginPath(); c.moveTo(ax + 58, 268); c.lineTo(ax + 70, 278); c.lineTo(ax + 58, 288); c.stroke(); c.restore(); }
        }
        const x37 = ax + 100;
        const s37 = 1 + 0.05 * X.hit('kick', t, 0.16) * k37;
        c.save(); c.translate(x37, 318 - (1 - k37) * 14); c.scale(s37, s37);
        text(c, '37%', 0, 0, big, bs, TEAL_INK(), { alpha: k37, track: -2 });
        c.restore();
        label(c, '2027 · IEA forecast', x37 + 2, 352, TEAL_INK(0.95), 14, { alpha: k37 });
        // the bar: share of 100%, grows to 33 then extends to 37 in teal
        const bx = 120, bw = 760, by = 380, bh = 12;
        c.fillStyle = INK(0.1); c.fillRect(bx, by, bw, bh);
        const f33 = 0.33 * ease.outCubic(clamp((t - T.coal - 0.1) / 0.6));
        c.fillStyle = INK(0.72); c.fillRect(bx, by, bw * f33, bh);
        const f37 = 0.04 * ease.outCubic(clamp((t - T.year - 0.1) / 0.6));
        if (f37 > 0) {
          const hb = X.hit('kick', t, 0.16);
          c.fillStyle = TEAL_INK(); c.fillRect(bx + bw * 0.33, by - 3 * hb, bw * f37, bh + 6 * hb);
        }
        hair(c, bx + bw, by - 4, bx + bw, by + bh + 4, INK(0.35), 1);
        label(c, '100%', bx + bw + 8, by + 11, INK(0.45), 11);
        // source: lit on "the IEA says", the underline drawn under "IEA" only
        const si = pulse(t, [T.iea], 0.35);
        source(c, 'IEA · Electricity Mid-Year Update · 23 Jul 2026', 120, 424, INK(0.6 + 0.4 * si));
        if (si > 0.02) {
          const sf = FONT.mono(400), tr = 12 * 0.14;
          const ix = 120 + measure('SOURCE · ', sf, 12, tr), iw = measure('IEA', sf, 12, tr) - tr;
          hair(c, ix, 431, ix + iw * ease.outCubic(clamp((t - T.iea) / 0.25)), 431, TEAL_INK(0.95 * Math.min(1, si * 2)), 2);
        }
        c.restore();
      }
      // the honest footnote, low on the dark field: coal demand is at a record too
      // (sheet, S136: "record global coal demand of about 8.94 billion tonnes in 2026")
      const kf = life(t, T.coalD, cut2 + 0.2, 0.4, 0.2);
      if (kf > 0) {
        const fam = FONT.mono(600), fs = 16, fx = 120, fy = 712, fw = 680, fh = 124;
        c.save(); c.globalAlpha *= kf; c.translate((1 - appear(t, T.coalD, 0.4)) * -24, 0);
        c.fillStyle = 'rgba(10,16,32,0.9)'; c.fillRect(fx, fy, fw, fh);
        c.fillStyle = RED(); c.fillRect(fx, fy, 4, fh);
        label(c, 'Footnote', fx + 24, fy + 28, SLATE(0.95), 11);
        const pre = 'COAL DEMAND ALSO HEADING FOR A ', rec = 'RECORD';
        const w1 = text(c, pre, fx + 24, fy + 58, fam, fs, PAPER(0.95), { track: 1.8 });
        const w2 = text(c, rec, fx + 24 + w1, fy + 58, fam, fs, PAPER(0.95), { track: 1.8 });
        const ur = ease.outCubic(clamp((t - T.rec) / 0.3));
        if (ur > 0) hair(c, fx + 24 + w1, fy + 65, fx + 24 + w1 + (w2 - 2) * ur, fy + 65, RED(), 2);
        text(c, 'ABOUT 8.94BN TONNES IN 2026', fx + 24, fy + 88, fam, fs, RED(), { track: 1.8 });
        source(c, 'IEA · Coal Mid-Year Update · Sep 2026', fx + 24, fy + 112, SLATE(0.95));
        c.restore();
      }
    }

    // ---------------------------------------------------------------- 3 · Artemis II: 406,771 km, past Apollo 13
    if (t >= cut2 && t < cut3 + 0.02) {
      const KB = { a: cut2, b: cut3 + 0.6, z: [1.03, 1.1] as [number, number], x: [0.012, -0.006] as [number, number] };
      if (!X.plate(c, 'moon_capsule', KB)) ground(c, C.night);
      const P = kb(t, KB.a, KB.b, KB.z, KB.x);
      const REC = 406771, APOLLO = 400171;
      const d = Math.max(0.6, T.than - T.took);
      const uPass = 1 - Math.cbrt(1 - APOLLO / REC), tPass = T.took + d * uPass;
      const v = REC * ease.outCubic(clamp((t - T.took) / d));
      const passed = t >= tPass;
      // the measured distance: a dashed hairline from Earth to the capsule, drawn as the counter runs
      const [ex, ey] = P(1318, 566), [qx, qy] = P(770, 590);
      const um = clamp(v / REC);
      if (um > 0) {
        c.save(); c.setLineDash([3, 6]); c.strokeStyle = (passed ? TEAL(0.9) : PAPER(0.7)); c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(ex, ey); c.lineTo(lerp(ex, qx, um), lerp(ey, qy, um)); c.stroke(); c.restore();
        c.fillStyle = PAPER(0.9); c.beginPath(); c.arc(ex, ey, 3, 0, Math.PI * 2); c.fill();
        c.fillStyle = passed ? TEAL() : PAPER(); c.beginPath(); c.arc(lerp(ex, qx, um), lerp(ey, qy, um), 4, 0, Math.PI * 2); c.fill();
      }
      const k = life(t, T.art, cut3 + 0.3, 0.45, 0.2);
      if (k > 0) {
        c.save(); c.globalAlpha *= k;
        const x0 = 900;
        label(c, 'Artemis II · farthest humans have flown from Earth', x0, 196, PAPER(0.9), 16, { w: 600 });
        const big = FONT.serif(700), bs = 164;
        const kn = appear(t, T.took - 0.05, 0.3);
        const col = passed ? TEAL() : PAPER();
        const sv = Math.round(v).toLocaleString('en-US');
        const wFull = measure(REC.toLocaleString('en-US'), big, bs, -3);
        // right-aligned on the final number's edge, so "km" stays tight to the digits while they count
        c.save(); c.globalAlpha *= kn;
        text(c, sv, x0 + wFull, 356, big, bs, col, { track: -3, align: 'right' });
        text(c, 'km', x0 + wFull + 18, 356, FONT.serif(600), 64, passed ? TEAL(0.9) : SLATE(), {});
        c.restore();
        // the old record, struck through when the counter passes it
        const ka = appear(t, T.art + 0.15, 0.4);
        c.save(); c.globalAlpha *= ka;
        const rl = 'PREVIOUS RECORD · APOLLO 13 · 1970 · 400,171 KM';
        const rw = text(c, rl, x0, 410, FONT.mono(500), 15, PAPER(passed ? 0.5 : 0.85), { track: 2.1 });
        const us = ease.outCubic(clamp((t - tPass) / 0.3));
        if (us > 0) hair(c, x0 - 4, 405, x0 - 4 + (rw + 8) * us, 405, TEAL(0.95), 2);
        c.restore();
        // NEW RECORD on "ever"
        const kr = appear(t, T.ever, 0.35);
        if (kr > 0) pill(c, 'Human record · 6 Apr 2026', x0, 462, { fill: TEAL(), col: INK(), alpha: kr, size: 14 });
        source(c, 'NASA / Wikipedia · Apr 2026', x0, 506, SLATE(0.95), { alpha: ka }); // sheet: "NASA/Wikipedia, S139, S140"
        c.restore();
      }
    }

    // ---------------------------------------------------------------- 4 · gene therapy for children as young as two
    if (t >= cut3) {
      if (!X.plate(c, 'child_hand', { a: cut3, b: X.seg.t1 + 0.6, z: [1.03, 1.08], x: [-0.008, 0.004] })) ground(c, C.paper);
      const x0 = 120;
      scrim(c, 100, 170, 620, 560, 0.5, PAPER_RGB);
      const k1 = appear(t, T.reg, 0.4);
      if (k1 > 0) {
        c.save(); c.globalAlpha *= k1;
        const hb = X.hit('kick', t, 0.14);
        c.fillStyle = TEAL_INK(); c.fillRect(x0, 186 - 2 * hb, 11 + 4 * hb, 11 + 4 * hb);
        label(c, 'US FDA · approved · 1 Jul 2026', x0 + 22, 197, INK(0.88), 15, { w: 600 });
        c.restore();
      }
      const k2 = appear(t, T.appr, 0.45);
      if (k2 > 0) text(c, 'Casgevy', x0, 300 + (1 - k2) * 14, FONT.serif(800), 92, INK(), { alpha: k2 });
      const k3 = appear(t, T.sick, 0.4);
      if (k3 > 0) label(c, 'Gene therapy · sickle cell disease', x0, 346, INK(0.75), 15, { alpha: k3 });
      const k4 = appear(t, T.child, 0.45);
      if (k4 > 0) {
        c.save(); c.globalAlpha *= k4;
        hair(c, x0, 404, x0 + 420 * ease.outCubic(clamp((t - T.child) / 0.5)), 404, INK(0.3), 1);
        label(c, 'Children aged', x0, 446, INK(0.8), 16, { w: 600 });
        const s = 1 + 0.06 * pulse(t, [T.two], 0.16);
        c.save(); c.translate(x0, 660); c.scale(s, s);
        text(c, '2+', 0, (1 - k4) * 20, FONT.serif(700), 250, TEAL_INK(), { track: -4 });
        c.restore();
        const uu = ease.outCubic(clamp((t - T.two) / 0.35));
        if (uu > 0) hair(c, x0 + 4, 690, x0 + 4 + 250 * uu, 690, TEAL_INK(0.9), 3);
        source(c, 'FDA · 1 Jul 2026', x0, 724, INK(0.6));
        c.restore();
      }
    }
  },
  post(X, o) {
    const t = X.t, T = hopeTimes(X);
    const cut2 = T.art, cut3 = T.us - 0.1;
    const punch = (tc: number) => (t >= tc ? 0.022 * Math.pow(0.5, (t - tc) / 0.09) : 0);
    return { ...o, zoom: 1 + 0.006 * X.hit('kick', t, 0.12) + punch(cut2) + punch(cut3) };
  },
};

// ===================================================================================================== WATCH
interface WItem { ev: string; evN?: number; date: string; dateN?: number; day: string; mon: string; d: string; yr?: string; title: string; sub: string;
  src: string; hl: string; pin?: [number, number]; pinText?: string; arc?: [[number, number], [number, number]]; nudge: [number, number] }
const WATCH: WItem[] = [
  { ev: 'Brazil', date: 'October', day: '25th', mon: 'OCT', d: '25', title: 'Brazil runoff', sub: 'FLÁVIO BOLSONARO VS LULA', src: 'AS/COA · WIKIPEDIA', hl: 'Brazil', pin: [-47.9, -15.8], pinText: 'BRAZIL', nudge: [-12, -12] },
  { ev: 'Israel', date: '27th', day: '27th', mon: 'OCT', d: '27', title: 'Israel votes', sub: 'GENERAL ELECTION', src: 'LIBRARY OF CONGRESS', hl: 'Israel', pin: [34.85, 31.5], pinText: 'ISRAEL', nudge: [14, 6] },
  { ev: 'America', date: 'November', day: '3rd', mon: 'NOV', d: '3', title: 'US midterms', sub: 'HOUSE · SENATE · GOVERNORS', src: 'WIKIPEDIA', hl: 'United States', pin: [-77.0, 38.9], pinText: 'UNITED STATES', nudge: [-20, 6] },
  { ev: 'COP31', date: 'November', dateN: 1, day: '9th', mon: 'NOV', d: '9', title: 'COP31 opens', sub: 'ANTALYA, TÜRKIYE · 9–20 NOV', src: 'CLIMATE HOME NEWS · AFP', hl: 'Turkey', pin: [30.7, 36.9], pinText: 'ANTALYA', nudge: [12, 6] },
  { ev: 'the', evN: 1, date: 'trade', day: 'January', mon: 'JAN', d: '10', yr: '2027', title: 'US–China truce expires', sub: 'TRADE TRUCE · EXTENDED IN SEPTEMBER', src: 'TIME · WIKIPEDIA', hl: 'United States', arc: [[-77.0, 38.9], [116.4, 39.9]], nudge: [0, 0] },
];

const watch: Segment = {
  draw(c, X) {
    const t = X.t;
    const items = WATCH.map((it) => ({ ...it, tE: X.W(it.ev, it.evN ?? 0).start, tD: X.W(it.date, it.dateN ?? 0).start, tN: X.W(it.day).start }));
    // hold the cross-fade until hope's last word ("two") has landed, so its "2+" is not washed by the globe
    const hopeEnd = X.ly.lines.filter((l) => l.section === 'hope').flatMap((l) => l.words).reduce((m, w) => Math.max(m, w.end), X.seg.t0 - 0.6);
    if (t < X.seg.t0 + 0.1) c.globalAlpha = Math.min(c.globalAlpha, ease.inOutQuad(clamp((t - hopeEnd) / Math.max(0.15, X.seg.t0 + 0.1 - hopeEnd))));
    ground(c, C.night);

    // ---- the globe: the shared camera, nudged toward each place as it is chanted, back to X.view() before the end
    const base = X.view();
    let dlon = 0, dlat = 0;
    items.forEach((it, i) => {
      const prev = i ? items[i - 1]!.nudge : [0, 0] as [number, number];
      const u = ease.inOutCubic(clamp((t - (it.tE - 0.15)) / 0.7));
      dlon += (it.nudge[0] - prev[0]) * u; dlat += (it.nudge[1] - prev[1]) * u;
    });
    const stamp = pulse(t, items.slice(0, 4).map((it) => it.tN), 0.16); // not the last: the globe must sit on X.view() for chorus3
    const cur = items.reduce((k, it, i) => (t >= it.tE - 0.05 ? i : k), -1);
    const highlights: Highlight[] = [], pins: Pin[] = [], arcs: Arc[] = [];
    items.forEach((it, i) => {
      if (t < it.tE - 0.05) return;
      const isCur = i === cur, ka = appear(t, it.tE, 0.35);
      highlights.push(isCur ? { name: it.hl, col: C.red, alpha: 0.9 * ka } : { name: it.hl, col: C.slate, alpha: 0.4, outline: false });
      if (it.pin) pins.push({ lon: it.pin[0], lat: it.pin[1], t0: it.tE, hot: isCur, text: isCur ? it.pinText : undefined, side: it.pin[0] < -20 ? 'left' : 'right' });
      if (it.arc) arcs.push({ from: it.arc[0], to: it.arc[1], u: ease.inOutCubic(clamp((t - it.tE) / 0.9)), col: RED(0.95), width: 2.4 });
    });
    if (cur === 4) pins.push({ lon: -77.0, lat: 38.9, t0: items[4]!.tE, hot: true, text: 'US → CHINA', side: 'left' });
    const view: GlobeView = { ...base, lon: base.lon + dlon, lat: base.lat + dlat, r: base.r * (1 + 0.012 * stamp), highlights, pins, arcs };
    const p = drawGlobe(c, view, t);

    // ---- header
    const kh = appear(t, X.seg.t0, 0.45);
    if (kh > 0) {
      const pw = pill(c, 'What to watch', 120, 186, { alpha: kh });
      label(c, 'Oct 2026 → Jan 2027', 120 + pw + 18, 186, SLATE(0.95), 13, { alpha: kh });
    }

    // ---- the tiles: event on its name, the calendar leaf on its date
    const x0 = 120, tw = 620, rh = 112, gap = 12, y0 = 222;
    items.forEach((it, i) => {
      const ke = appear(t, it.tE, 0.4);
      if (ke <= 0) return;
      const y = y0 + i * (rh + gap), isCur = i === cur;
      c.save(); c.globalAlpha *= ke; c.translate((1 - ke) * -36, 0);
      c.fillStyle = 'rgba(16,24,42,0.9)'; c.fillRect(x0, y, tw, rh);
      const fl = pulse(t, [it.tN], 0.2);
      c.strokeStyle = isCur ? RED(0.35 + 0.5 * fl) : PAPER(0.08); c.lineWidth = 1; c.strokeRect(x0 + 0.5, y + 0.5, tw - 1, rh - 1);
      text(c, it.title, x0 + 132, y + 54, FONT.serif(700), 36, PAPER(isCur ? 1 : 0.82));
      label(c, it.sub, x0 + 133, y + 86, SLATE(0.95), 12);
      label(c, it.src, x0 + tw - 20, y + 86, SLATE(0.6), 11, { align: 'right', w: 400 }); // the date's source (FACTSHEET §3)
      c.restore();
      // the leaf
      const kd = clamp((t - it.tD + 0.02) / 0.38);
      if (kd <= 0) return;
      const drop = ease.outBack(kd, 1.4), lx = x0 + 10, ly = y + 8, ls = 96;
      c.save(); c.globalAlpha *= Math.min(1, kd * 3) * ke;
      c.translate(lx + ls / 2, ly + ls / 2 - (1 - drop) * 34); c.scale(1 + (1 - Math.min(1, drop)) * 0.25, 1 + (1 - Math.min(1, drop)) * 0.25);
      c.fillStyle = PAPER(); c.fillRect(-ls / 2, -ls / 2, ls, ls);
      c.fillStyle = isCur ? RED() : INK(0.78); c.fillRect(-ls / 2, -ls / 2, ls, 26);
      text(c, it.yr ? `${it.mon} ${it.yr}` : it.mon, 0, -ls / 2 + 18, FONT.mono(600), 13, PAPER(), { align: 'center', track: 1.6 });
      const sN = 1 + 0.3 * pulse(t, [it.tN], 0.12) * (it.tN > it.tD + 0.05 ? 1 : 0.4);
      c.save(); c.translate(0, 34); c.scale(sN, sN);
      text(c, it.d, 0, 0, FONT.serif(700), 54, INK(), { align: 'center', track: -1 });
      c.restore();
      c.restore();
      // leader line from the current tile to its place on the globe
      if (isCur && p) {
        const ll = it.pin ?? it.arc?.[0];
        const xy = ll ? p(ll) : null;
        const ul = ease.outCubic(clamp((t - it.tD) / 0.4));
        if (xy && ul > 0) {
          const sx = x0 + tw, sy = y + rh / 2, mx = sx + 40;
          c.save(); c.strokeStyle = RED(0.75); c.lineWidth = 1.2; c.setLineDash([2, 5]);
          c.beginPath(); c.moveTo(sx, sy);
          if (ul < 0.25) c.lineTo(lerp(sx, mx, ul / 0.25), sy); else { c.lineTo(mx, sy); c.lineTo(lerp(mx, xy[0], (ul - 0.25) / 0.75), lerp(sy, xy[1], (ul - 0.25) / 0.75)); }
          c.stroke(); c.restore();
        }
      }
    });
    label(c, 'Sources as noted · dates as of 18 Oct 2026', 120, 864, SLATE(0.9), 12, { w: 400, alpha: appear(t, items[0]!.tE, 0.4) });
  },
  post(X, o) { return o; },
};

// ===================================================================================================== CLOSE
function closeTimes(X: X) {
  const w = (q: string, n = 0) => X.W(q, n);
  return {
    a: w('A').start, world: w('world').start, under: w('under').start, strain: w('strain').start,
    facing: w('facing').start, urgent: w('urgent').start, choices: w('choices').start, choicesEnd: w('choices').end,
    this: w('This').start, the0: w('the').start, state: w('state').start, of: w('of').start, the1: w('the', 1).start, world1: w('world', 1).start,
    oct: w('October').start, y2026: w('2026').start, end2026: w('2026').end,
  };
}

/** The scene's chrome, redrawn here so it can fade (the scene only knows on/off): identical layout to scenes/brief.ts. */
function chromeReplica(c: CanvasRenderingContext2D, X: X, alpha: number) {
  if (alpha <= 0) return;
  c.save(); c.globalAlpha *= alpha;
  const g = c.createLinearGradient(0, 0, 0, 130); g.addColorStop(0, 'rgba(6,10,20,0.55)'); g.addColorStop(1, 'rgba(6,10,20,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, 130);
  c.fillStyle = RED(); c.fillRect(72, 48, 10, 10);
  label(c, 'WORLD BRIEFING', 94, 58, PAPER(0.95), 14, { w: 600 });
  label(c, 'OCTOBER 2026', 94 + measure('WORLD BRIEFING', FONT.mono(600), 14, 14 * 0.14) + 24, 58, SLATE(0.95), 14);
  if (X.seg.kicker) label(c, X.seg.kicker, W - 72, 58, PAPER(0.95), 14, { align: 'right', w: 600 });
  const p = clamp(X.t / X.au.duration);
  hair(c, 72, H - 34, W - 72, H - 34, PAPER(0.18), 1);
  c.fillStyle = PAPER(0.7); c.fillRect(72, H - 35, (W - 144) * p, 2);
  c.fillStyle = RED(); c.fillRect(72 + (W - 144) * p - 2, H - 39, 4, 10);
  c.restore();
}

const close: Segment = {
  draw(c, X) {
    const t = X.t, T = closeTimes(X);
    const tc = T.end2026 + 0.25;            // the chrome hands over to the replica here, then fades
    X.seg.chrome = t >= tc ? false : undefined;

    // ---- the hook's strait, at dawn
    const KB = { a: X.seg.t0 - 0.6, b: X.seg.t1, z: [1.0, 1.1] as [number, number], x: [0, -0.025] as [number, number], y: [0, 0.01] as [number, number] };
    if (!X.plate(c, 'hormuz_dawn', KB)) ground(c, C.paper);
    // a callback to the hook: the same strait, the ship still crossing
    const kl = life(t, X.seg.t0 + 0.3, T.this - 0.1, 0.6, 0.4);
    if (kl > 0) {
      const [sx, sy] = kb(t, KB.a, KB.b, KB.z, KB.x, KB.y)(778, 606);
      const ul = ease.outCubic(clamp((t - X.seg.t0 - 0.3) / 0.8));
      c.save(); c.globalAlpha *= kl;
      hair(c, sx + 8, sy, sx + 8 + 40 * ul, sy, INK(0.6), 1);
      label(c, 'Strait of Hormuz', sx + 58, sy + 5, INK(0.75), 13, { w: 600, alpha: ul });
      c.restore();
    }

    // ---- "A world under strain, facing urgent choices." — the serif title on the paper sky
    const kt = vanish(t, T.this - 0.05, 0.35);
    if (kt > 0 && t >= T.a - 0.1) {
      c.save(); c.globalAlpha *= kt;
      scrim(c, 460, 190, 1000, 220, 0.35, PAPER_RGB);
      const fam = FONT.serif(800), s = 98;
      phrase(c, t, [{ s: 'A', t: T.a }, { s: 'world', t: T.world }, { s: 'under', t: T.under }, { s: 'strain,', t: T.strain }], 960, 300, fam, s, INK(), { align: 'center', d: 0.5 });
      const w2 = phrase(c, t, [{ s: 'facing', t: T.facing }, { s: 'urgent', t: T.urgent }, { s: 'choices', t: T.choices }], 960 - measure('.', fam, s) / 2, 412, fam, s, INK(), { align: 'center', d: 0.5 });
      const kp = appear(t, T.choices + 0.3, 0.35);
      if (kp > 0) text(c, '.', 960 - measure('.', fam, s) / 2 + w2 / 2 + 2, 412, fam, s, RED(), { alpha: kp });
      c.restore();
    }

    // ---- the end card: the dawn washes to paper, then the title, the date, the facts, the credits
    const wash = ease.inOutCubic(clamp((t - (T.this - 0.15)) / 0.9));
    if (wash > 0) { c.fillStyle = `rgba(${PAPER_RGB},${0.9 * wash})`; c.fillRect(0, 0, W, H); }
    if (t >= T.the0 - 0.1) {
      const fam = FONT.serif(800), s = 112;
      phrase(c, t, [{ s: 'The', t: T.the0 }, { s: 'State', t: T.state }, { s: 'of', t: T.of }, { s: 'the', t: T.the1 }, { s: 'World', t: T.world1 }], 960, 470, fam, s, INK(), { align: 'center', d: 0.5, track: -1 });
      const ko = appear(t, T.oct, 0.45);
      if (ko > 0) {
        const ur = ease.outCubic(clamp((t - T.oct) / 0.6));
        hair(c, 960 - 60 * ur, 520, 960 + 60 * ur, 520, RED(), 2);
        text(c, 'OCTOBER 2026', 960, 568, FONT.mono(600), 22, RED(), { align: 'center', track: 5.5, alpha: ko });
      }
      // facts + credits, on the last heartbeat and the beats after it
      const b0 = Math.ceil(X.beat(T.end2026 + 0.2));
      const tb = (k: number) => X.tBeat(b0 + k);
      const kf = appear(t, tb(0), 0.5);
      if (kf > 0) {
        const fam2 = FONT.mono(500), fs = 17;
        // the sheet lists 170 sources (IDs run S1–S173; S13, S23 and S120 are unused)
        const a = 'FACTS: 170 SOURCES · ', b = 'research/FACTSHEET.md';
        const wa = measure(a, fam2, fs, 2.1), wb = measure(b, fam2, fs, 1.2);
        const x = 960 - (wa + wb) / 2;
        text(c, a, x, 660, fam2, fs, INK(0.8), { track: 2.1, alpha: kf });
        text(c, b, x + wa, 660, fam2, fs, INK(0.8), { track: 1.2, alpha: kf });
      }
      const credits: [string, string][] = [['SONG', '“Under Strain” · MiniMax-Music3'], ['PLATES', 'Qwen-Image 2.1'], ['MAPS', 'Natural Earth'], ['MOTION', 'code']];
      const fam3 = FONT.mono(500), fs3 = 15, gapX = 52;
      const widths = credits.map(([k, v]) => measure(k, FONT.mono(600), fs3, 2) + 12 + measure(v, fam3, fs3, 0.8));
      let x = 960 - (widths.reduce((s1, w1) => s1 + w1, 0) + gapX * (credits.length - 1)) / 2;
      credits.forEach(([k, v], i) => {
        const kc = appear(t, tb(1 + i), 0.45);
        if (kc > 0) {
          const kw = text(c, k, x, 730 + (1 - kc) * 8, FONT.mono(600), fs3, INK(0.5), { track: 2, alpha: kc });
          text(c, v, x + kw + 12, 730 + (1 - kc) * 8, fam3, fs3, INK(0.9), { track: 0.8, alpha: kc });
        }
        x += widths[i]! + gapX;
      });
      hair(c, 960 - 330 * ease.outCubic(clamp((t - tb(0)) / 0.8)), 700, 960 + 330 * ease.outCubic(clamp((t - tb(0)) / 0.8)), 700, INK(0.2), 1);
    }

    // ---- the chrome fades out once the last line is spoken
    if (t >= tc) chromeReplica(c, X, 1 - ease.inOutQuad(clamp((t - tc) / 1.2)));
  },
  post(X, o) {
    const t = X.t, end = X.seg.t1;
    return { ...o, zoom: 1 + 0.005 * X.hit('kick', t, 0.14), fade: ease.inOutQuad(clamp((t - (end - 3.4)) / 3.0)) };
  },
};

export const segments: Record<string, Segment> = { hope, watch, close };

// WRITER — the pen: each line is written in a single-stroke (plotter / engraving) font by the motif as
// it is sung, character by character on the word timings. Written lines scroll up the sheet like a
// page of handwriting, on faint ruled lines; the camera drifts after the pen.
// params: font (stroke font: script|hscript|sans|readable|tech|serif|osmotron|felix; style.fonts.stroke)
//         size (110) · invert · rules (true)
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { rgba, styleCase, STYLE } from '../engine/palette';
import { strokeText, drawStrokeText, writtenLength, STROKE_FONTS, type StrokeText, type StrokeFontName } from '../engine/stroke';
import { Lyrics, type Line } from '../engine/lyrics';
import { SAFE, markWord } from '../engine/karaoke';
import { clamp, ease, lerp } from '../engine/util';
import { Ground, plate, label, hair, motifHead, motifSparks, type Plate } from './_kit';

interface Row { st: StrokeText; times: [number, number][]; chars: number; x: number }
interface Written { line: Line; rows: Row[] }

export default class Writer extends Scene {
  L = new Layer2D();
  ground = new Ground();
  lb!: LineBatch;
  P!: Plate;
  items: Written[] = [];
  lineH = 150;
  o = { font: '' as string, size: 150, rules: true };

  override init() {
    const { params, lyrics, start, end } = this.ctx;
    Object.assign(this.o, STYLE.scenes?.writer ?? {}, params);
    this.P = plate(!!params.invert);
    this.lb = new LineBatch(4096, { blend: this.P.lineBlend });
    const fname = ((this.o.font || STYLE.fonts?.stroke || 'script') in STROKE_FONTS ? (this.o.font || STYLE.fonts?.stroke || 'script') : 'script') as StrokeFontName;
    const size = this.o.size;
    this.lineH = size * 1.35;
    for (const l of lyrics.linesStartingIn(start - 0.35, end)) {
      // split a long line into rows that fit the sheet, keeping each row's char timings
      const text = l.words.map((w) => styleCase(w.w, 'none')).join(' ');
      const all = Lyrics.charTimes(l);
      const words = text.split(' ');
      const rows: Row[] = [];
      let cur: string[] = [], rowStart = 0;
      const flush = () => {
        if (!cur.length) return;
        const s = cur.join(' ');
        const st = strokeText(s, fname, size);
        rows.push({ st, times: all.slice(rowStart, rowStart + Array.from(s).length), chars: Array.from(s).length, x: 0 });
        rowStart += Array.from(s).length + 1; // +1: the space that ends the row
      };
      for (const w of words) {
        const trial = [...cur, w].join(' ');
        if (cur.length && strokeText(trial, fname, size).width > W - 2 * SAFE - 120) { flush(); cur = [w]; } else cur.push(w);
      }
      flush();
      for (const r of rows) r.x = SAFE + 60;
      this.items.push({ line: l, rows });
    }
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio: au } = this.ctx;
    const t = f.t, P = this.P;
    this.ground.render(renderer, out, P, { t, lift: f.a.kick * 0.4, hatch: P.light ? 0.15 : 0, seed: 6.6 });
    const L = this.L; L.clear();
    const c = L.ctx;
    // the page scrolls so the row being written sits at 58% height; rows = all rows of lines started so far
    const flat: { row: Row; item: Written; k: number }[] = [];
    this.items.forEach((it) => it.rows.forEach((row, k) => flat.push({ row, item: it, k })));
    let cur = -1;
    flat.forEach((r, i) => { if (t >= (r.row.times[0]?.[0] ?? r.item.line.start) - 0.3) cur = i; });
    // eased scroll between rows (snaps like a carriage return when a new row starts)
    let scroll = 0;
    if (cur >= 0) {
      const t0 = (flat[cur]!.row.times[0]?.[0] ?? 0) - 0.3;
      scroll = cur - 1 + ease.outExpo(clamp((t - t0) / 0.45));
    }
    const baseY = H * 0.58 - scroll * this.lineH;
    let head: { x: number; y: number } | null = null;
    // ruled lines
    if (this.o.rules) {
      for (let k = -3; k < 12; k++) {
        const y = baseY + (Math.floor(scroll) + k - 1) * this.lineH + 18;
        if (y < SAFE - 20 || y > H - SAFE + 20) continue;
        hair(c, SAFE, y, W - SAFE, y, P.inkA(0.1));
      }
      hair(c, SAFE + 40, SAFE - 20, SAFE + 40, H - SAFE + 20, rgba('accent', 0.35));
    }
    c.lineCap = 'round'; c.lineJoin = 'round';
    flat.forEach((r, i) => {
      if (i > cur) return;
      const y = baseY + i * this.lineH;
      if (y < -this.lineH || y > H + this.lineH) return;
      const len = writtenLength(r.row.st, r.row.times, t);
      if (len <= 0) return;
      const age = i < cur ? cur - i : 0;
      c.save();
      c.translate(r.row.x, y);
      c.strokeStyle = i === cur ? P.inkA(1) : P.inkA(Math.max(0.25, 0.85 - age * 0.18));
      c.lineWidth = Math.max(2.2, r.row.st.size * 0.03);
      const hd = drawStrokeText(c, r.row.st, len);
      for (const w of r.item.line.words) if (t >= w.start - 0.05 && t < r.item.line.end + 2) markWord(w);
      c.restore();
      if (i === cur && hd && len < r.row.st.total - 0.5) head = { x: r.row.x + hd.x, y: y + hd.y };
    });
    // annotations
    const line = cur >= 0 ? flat[cur]!.item.line : null;
    label(c, `${(au.section(t)?.name ?? '').toUpperCase()}  ·  FOLIO ${String((line?.i ?? 0) + 1).padStart(2, '0')}`, SAFE, SAFE - 30, P.inkA(0.45));
    comp.draw(renderer, L.upload(), out);
    // the pen / motif head and its sparks
    const lb = this.lb; lb.clear();
    if (head) {
      const h = head as { x: number; y: number };
      motifHead(lb, P, h.x, h.y, t, 0.75, 1);
      if (!P.light && cur >= 0) {
        const row = flat[cur]!.row, x0 = row.x, y0 = baseY + cur * this.lineH;
        motifSparks(lb, P, t, (tb) => {
          const l2 = writtenLength(row.st, row.times, tb);
          if (l2 <= 0 || l2 >= row.st.total) return null;
          // approximate head position at tb: point along the strokes at length l2
          let acc = 0;
          for (let s = 0; s < row.st.strokes.length; s++) {
            const Ls = row.st.lens[s]!, tot = Ls[Ls.length - 1] ?? 0;
            if (acc + tot >= l2) {
              const pts = row.st.strokes[s]!, u = l2 - acc;
              let j = 1; while (j < pts.length - 1 && Ls[j]! < u) j++;
              const a = pts[j - 1]!, b = pts[j]!, k = (u - Ls[j - 1]!) / Math.max(1e-6, Ls[j]! - Ls[j - 1]!);
              return { x: x0 + lerp(a.x, b.x, k), y: y0 + lerp(a.y, b.y, k) };
            }
            acc += tot;
          }
          return null;
        }, { rate: 60, intensity: 0.8, speed: 160 });
      }
    }
    lb.render(renderer, out);
    // the camera drifts after the pen
    const hx = head ? (head as { x: number }).x : W / 2;
    return { zoom: 1.02 + 0.01 * f.a.low, shake: [-(hx - W / 2) * 0.02, 0], paper: P.light ? 1 : 0 };
  }
}

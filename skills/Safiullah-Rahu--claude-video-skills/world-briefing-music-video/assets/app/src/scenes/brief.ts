// THE STATE OF THE WORLD — the whole film in one scene. data/film.json lists the segments (one per narration scene);
// each segment module (brief/segments/*.ts) draws itself — background, globe, plate, graphics — and the scene adds the
// broadcast chrome and the narration captions. Neighbouring segments cross-fade over 0.6 s.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H, clearRT } from '../engine/gl';
import { markWord } from '../engine/karaoke';
import { norm, type Line, type Word } from '../engine/lyrics';
import { hexToLinear, clamp, ease } from '../engine/util';
import { drawGlobe, type GlobeView } from '../brief/globe';
import type { Segment, SegInfo, X } from '../brief/x';
import { C, PAPER, RED, SLATE, FONT, text, label, hair, measure, wrap } from '../brief/kit';

const MODS = import.meta.glob<{ segments: Record<string, Segment> }>('../brief/segments/*.ts');
const SEGMENTS: Record<string, Segment> = {};
const XF = 0.45; // cross-fade (after each cut)

interface Film { title: string; date: string; segments: SegInfo[] }

export default class Brief extends Scene {
  L = new Layer2D();
  film!: Film;
  private err = new Set<string>();
  private wantPlates = new Set<string>();
  /** per plate: luminance (0..1) of the image's top 12% band; and this frame's estimate under the chrome band */
  private plateTopLum = new Map<string, number>();
  private topLum = 0;

  override async init() {
    await Promise.all(Object.entries(MODS).map(([p, load]) => load()
      .then((m) => Object.assign(SEGMENTS, m.segments ?? {}))
      .catch((e) => console.error(`[segments] ${p} failed to load`, e))));
    const r = await fetch('data/film.json');
    this.film = r.ok ? await r.json() : { title: '', date: '', segments: [] };
    (window as any).__brief = this;
  }

  override async prepare() {
    const { media } = this.ctx;
    // plates are small and few: load every plate the manifest lists once
    for (const id of Object.keys(media.manifest.plates ?? {})) if (!media.plate(id)) await media.preparePlate(id);
  }

  private linesOf(s: SegInfo) { return this.ctx.lyrics.lines.filter((l) => l.section === s.id); }

  private makeX(t: number, f: Frame, s: SegInfo): X {
    const { lyrics, audio, media } = this.ctx;
    const lines = this.linesOf(s);
    const words = lines.flatMap((l) => l.words);
    const X: X = {
      t, f, seg: s, segs: this.film.segments, ly: lyrics, au: audio, media, lines,
      W: (q, nth = 0) => {
        const qs = q.split(/\s+/).map(norm).filter(Boolean);
        let hit = -1, seen = 0;
        for (let i = 0; i + qs.length <= words.length && hit < 0; i++) {
          if (qs.every((qq, j) => norm(words[i + j]!.w) === qq) && seen++ === nth) hit = i;
        }
        if (hit < 0) throw new Error(`word "${q}" not in segment ${s.id}`);
        return words[hit]!;
      },
      u: (a, b) => clamp((t - a) / Math.max(1e-3, b - a)),
      env: (n, tt = t) => audio.env(n, tt),
      beat: (tt = t) => audio.beatAt(tt),
      bar: (tt = t) => audio.barAt(tt),
      tBeat: (b) => audio.timeOfBeat(b),
      tBar: (b) => audio.timeOfBar(b),
      hit: (k, tt = t, hl = 0.11) => audio.hit(k, tt, hl),
      plate: (c, id, o = {}) => this.drawPlate(c, id, t, o),
      globe: (c, v) => { drawGlobe(c, v, t); },
      view: (tt = t) => this.view(tt),
      mark: markWord,
    };
    return X;
  }

  /** Shared globe camera: rest on each segment's focus, fly across each boundary. */
  view(t: number): GlobeView {
    const segs = this.film.segments.filter((s) => s.focus);
    const def = { lon: 20, lat: 15, r: 440, cx: 1300, cy: 560 };
    if (!segs.length) return def;
    // the segment whose flight has begun (flights start 0.4 s before a segment's cut): no jump at the boundary
    let k = 0;
    for (let i = 0; i < segs.length; i++) if (t >= segs[i]!.t0 - 0.4) k = i;
    const cur = { ...def, ...segs[k]!.focus };
    const prev = k > 0 ? { ...def, ...segs[k - 1]!.focus } : cur;
    const fly = 1.6, t0 = segs[k]!.t0;
    const u = ease.inOutCubic(clamp((t - (t0 - 0.4)) / fly));
    const lerpv = (a: number, b: number) => a + (b - a) * u;
    const dl = ((cur.lon - prev.lon + 540) % 360) - 180;
    // zoom travels in log space so big changes (a country to the whole Earth) feel even
    const r = Math.exp(lerpv(Math.log(prev.r), Math.log(cur.r)));
    const drift = (t - t0) * (cur.r < 700 ? 2.2 : 0.15); // the whole Earth turns slowly; close-ups barely drift
    return { lon: prev.lon + dl * u + drift, lat: lerpv(prev.lat, cur.lat), r, cx: lerpv(prev.cx, cur.cx), cy: lerpv(prev.cy, cur.cy) };
  }

  private drawPlate(c: CanvasRenderingContext2D, id: string, t: number, o: Parameters<X['plate']>[2] = {}) {
    const pl = this.ctx.media.plate(id);
    if (!pl) { this.wantPlates.add(id); return false; }
    const img = pl.image;
    if (!this.plateTopLum.has(id)) {
      const cv = new OffscreenCanvas(64, 36), cx = cv.getContext('2d')!;
      cx.drawImage(img, 0, 0, 64, 36);
      const d = cx.getImageData(0, 0, 64, 5).data;
      let l = 0;
      for (let i = 0; i < d.length; i += 4) l += (0.2126 * d[i]! + 0.7152 * d[i + 1]! + 0.0722 * d[i + 2]!) / 255;
      this.plateTopLum.set(id, l / (d.length / 4));
    }
    // this plate's share of the top band, after its opacity and duotone, accumulates into the frame estimate
    const a0 = c.globalAlpha * (o.alpha ?? 1);
    this.topLum = this.topLum * (1 - a0) + this.plateTopLum.get(id)! * (1 - 0.62 * clamp(o.duo ?? 0)) * a0;
    const u = ease.inOutQuad(clamp((t - (o.a ?? 0)) / Math.max(0.1, (o.b ?? 1) - (o.a ?? 0))));
    const z = o.z ? o.z[0] + (o.z[1] - o.z[0]) * u : 1.02 + 0.05 * u;
    const dx = o.x ? o.x[0] + (o.x[1] - o.x[0]) * u : 0, dy = o.y ? o.y[0] + (o.y[1] - o.y[0]) * u : 0;
    const s = Math.max(W / img.width, H / img.height) * z;
    const w = img.width * s, h = img.height * s;
    c.save();
    c.globalAlpha *= o.alpha ?? 1;
    c.drawImage(img, (W - w) / 2 + dx * W, (H - h) / 2 + dy * H, w, h);
    if (o.duo) { c.globalAlpha *= clamp(o.duo); c.fillStyle = 'rgba(8,14,30,0.62)'; c.fillRect(0, 0, W, H); }
    c.restore();
    return true;
  }

  // ------------------------------------------------------------------ chrome + captions
  private chrome(c: CanvasRenderingContext2D, t: number, s: SegInfo | null, alpha: number) {
    if (alpha <= 0) return;
    c.save(); c.globalAlpha *= alpha;
    // top band backing: night gradient over dark frames, paper gradient + ink type over the light plates
    const paper = clamp((this.topLum - 0.45) / 0.2);
    const g = c.createLinearGradient(0, 0, 0, 130);
    const rgb = paper > 0.5 ? '243,239,230' : '6,10,20';
    g.addColorStop(0, `rgba(${rgb},${paper > 0.5 ? 0.7 : 0.55})`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.fillRect(0, 0, W, 130);
    const fg = (a: number) => (paper > 0.5 ? `rgba(11,18,32,${a})` : PAPER(a));
    c.fillStyle = RED(); c.fillRect(72, 48, 10, 10);
    label(c, 'WORLD BRIEFING', 94, 58, fg(0.95), 14, { w: 600 });
    label(c, this.film.date || 'OCTOBER 2026', 94 + measure('WORLD BRIEFING', FONT.mono(600), 14, 14 * 0.14) + 24, 58, paper > 0.5 ? 'rgba(11,18,32,0.6)' : SLATE(0.95), 14);
    if (s && s.kind !== 'title' && s.kicker) {
      const n = this.film.segments.filter((x) => x.kind === 'story').length;
      const idx = s.kind === 'story' ? `${String(s.i).padStart(2, '0')} / ${String(n).padStart(2, '0')}` : '';
      const kw = label(c, s.kicker, W - 72, 58, fg(0.95), 14, { align: 'right', w: 600 });
      if (idx) label(c, idx, W - 72 - kw - 28, 58, RED(), 14, { align: 'right', w: 600 });
    }
    // progress
    const dur = this.ctx.audio.duration, p = clamp(t / dur);
    hair(c, 72, H - 34, W - 72, H - 34, PAPER(0.18), 1);
    c.fillStyle = PAPER(0.7); c.fillRect(72, H - 35, (W - 144) * p, 2);
    c.fillStyle = RED(); c.fillRect(72 + (W - 144) * p - 2, H - 39, 4, 10);
    c.restore();
  }

  private captions(c: CanvasRenderingContext2D, t: number, alpha: number) {
    const ly = this.ctx.lyrics;
    // the newest line wins: a line that has begun replaces the previous one even while that one is still lingering
    let l: Line | null = null;
    for (const x of ly.lines) if (t >= x.start - 0.02 && t <= x.end + 0.35 && (!l || x.start > l.start)) l = x;
    // lead-in: an upcoming line may appear 0.15 s early only while no line is being sung
    if (!l || t > l.end) for (const x of ly.lines) if (t >= x.start - 0.15 && t < x.start) { l = x; break; }
    if (!l || alpha <= 0) return;
    const fam = FONT.sans(500), size = 30, maxW = 1240;
    const rows = wrap(l.text, fam, size, maxW);
    // map words to rows
    let wi = 0;
    const k = Math.min(clamp((t - (l.start - 0.15)) / 0.15), 1 - clamp((t - (l.end + 0.2)) / 0.15));
    c.save(); c.globalAlpha *= alpha * k;
    const y0 = H - 72 - (rows.length - 1) * 40;
    const bandW = Math.max(...rows.map((r) => measure(r, fam, size))) + 56;
    c.fillStyle = 'rgba(6,10,20,0.62)'; c.fillRect((W - bandW) / 2, y0 - 36, bandW, rows.length * 40 + 18);
    rows.forEach((r, ri) => {
      const toks = r.split(' ');
      let x = (W - measure(r, fam, size)) / 2;
      const y = y0 + ri * 40;
      for (const tok of toks) {
        const w: Word | undefined = l.words[wi++];
        const sung = w ? t >= w.start - 0.02 : true;
        text(c, tok, x, y, fam, size, sung ? PAPER(0.98) : PAPER(0.42));
        if (w && sung) markWord(w);
        x += measure(tok + ' ', fam, size);
      }
    });
    c.restore();
  }

  // ------------------------------------------------------------------ frame
  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const t = f.t, segs = this.film.segments;
    clearRT(renderer, out, hexToLinear(C.night));
    const L = this.L; L.clear(C.night);
    this.topLum = 0.05; // night ground
    const c = L.ctx;
    let cur: SegInfo | null = null;
    let o: PostOverrides = {};
    let chromeA = 1, capA = 1;
    for (const s of segs) {
      if (t < s.t0 || t > s.t1 + XF) continue;
      // the dissolve happens just AFTER the cut (both segments over [cut, cut + XF]), so a line still being sung is
      // never double-exposed before its last word
      const fade = Math.min(s === segs[0] ? 1 : ease.inOutQuad(clamp((t - s.t0) / XF)), 1 - ease.inOutQuad(clamp((t - s.t1) / XF)));
      if (t >= s.t0 && t < s.t1) cur = s;
      const mod = SEGMENTS[s.id];
      if (!mod) continue;
      const X = this.makeX(t, f, s);
      c.save(); c.globalAlpha = fade;
      try { mod.draw(c, X); } catch (e) { if (!this.err.has(s.id)) { this.err.add(s.id); console.error(`[segment ${s.id}]`, e); } }
      c.restore();
      if (s === cur) {
        if (mod.post) { try { o = mod.post(X, o); } catch { /* reported by draw */ } }
        if (s.kind === 'title') chromeA = clamp((t - s.vo1) / 0.6); // the cold open boots the chrome after its last line; captions stay on
        if (s.chrome === false) chromeA = 0;
        if (s.captions === false || s.kind === 'chorus') capA = 0; // chorus segments set their own (big) lyric type
      }
    }
    this.chrome(c, t, cur, chromeA);
    this.captions(c, t, capA);
    comp.draw(renderer, L.upload(), out, { mode: 'replace' });
    return o;
  }
}

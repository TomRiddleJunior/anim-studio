// TUNNEL — a corridor of hairline frames; the camera advances one frame per beat (eased into each beat:
// hold, then snap) with a small roll per bar. Each lyric line hangs on a frame ahead: the camera reaches
// it as the line is sung (words light up as they are sung) and flies through it on the next line. Every
// bar's frame is drawn in the accent.
// params: frames (visible frames, 16) · spacing (world units, 4) · invert
import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { LIN, rgba, styleCase, STYLE } from '../engine/palette';
import { F, measure } from '../engine/type';
import { Lyrics, type Line } from '../engine/lyrics';
import { SAFE, activeWord, drawWord } from '../engine/karaoke';
import { clamp, ease, pulse } from '../engine/util';
import { Ground, plate, label, type Plate } from './_kit';

type RGB = [number, number, number];

export default class Tunnel extends Scene {
  L = new Layer2D();
  ground = new Ground();
  lb!: LineBatch;
  P!: Plate;
  cam = new THREE.PerspectiveCamera(58, W / H, 0.05, 500);
  lines: Line[] = [];
  o = { frames: 16, spacing: 4 };

  override init() {
    const { params, lyrics, start, end } = this.ctx;
    Object.assign(this.o, STYLE.scenes?.tunnel ?? {}, params);
    this.P = plate(!!params.invert);
    this.lb = new LineBatch(20000, { screen2D: false, blend: this.P.lineBlend });
    this.lines = lyrics.linesStartingIn(start - 0.35, end);
  }

  /** Camera distance travelled (in frames) at time t: hold, then snap into each beat. */
  private travel(t: number) {
    const b = this.ctx.audio.beatAt(t);
    const i = Math.floor(b), fr = b - i;
    return i + ease.inOutCubic(clamp((fr - 0.55) / 0.45));
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio: au } = this.ctx;
    const t = f.t, P = this.P, S = this.o.spacing;
    this.ground.render(renderer, out, P, { t, lift: f.a.kick * 0.6, seed: 1.1 });
    const z = -this.travel(t) * S;
    const cam = this.cam;
    cam.position.set(0, 0, z);
    cam.rotation.set(0, 0, 0.035 * Math.sin(Math.floor(f.bar) * 1.7) * ease.outExpo(clamp(f.barPhase * 4)));
    cam.updateMatrixWorld(true);
    cam.updateProjectionMatrix();
    const lb = this.lb; lb.clear();
    const hw = 3.2, hh = hw * (H / W);
    const i0 = Math.floor(-z / S);
    const acc = (k: number): RGB => { const c = LIN.accent; return P.light ? (c as RGB) : [c[0] * k, c[1] * k, c[2] * k]; };
    for (let i = i0; i < i0 + this.o.frames; i++) {
      const fz = -i * S - S;
      const d = (z - fz) / (S * this.o.frames);
      const alpha = clamp(1 - d) * clamp((z - fz) / (S * 0.6));
      if (alpha <= 0.01) continue;
      const bar = Math.round(au.barAt(au.timeOfBeat(i + 1))) ;
      const isBar = Math.abs(au.barAt(au.timeOfBeat(i + 1)) - bar) < 1e-3;
      const col: RGB = isBar ? acc(1.6) : (LIN[P.ink] as RGB);
      const wdt = isBar ? 2.2 : 1.1;
      const c4 = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]] as const;
      for (let k = 0; k < 4; k++) {
        const a = c4[k]!, b = c4[(k + 1) % 4]!;
        lb.seg(a[0], a[1], fz, b[0], b[1], fz, wdt, col[0], col[1], col[2], alpha * (isBar ? 0.95 : 0.55));
      }
      // rails along the corners to the next frame
      for (const cc of c4) lb.seg(cc[0], cc[1], fz, cc[0], cc[1], fz - S, 0.8, col[0], col[1], col[2], alpha * 0.22);
    }
    lb.render(renderer, out, cam);

    // ---- lines hung on frames: the camera arrives at a line's frame as the line ends
    const L = this.L; L.clear();
    const c = L.ctx;
    const v = new THREE.Vector3();
    const fam = F.display(100, 800);
    for (const l of this.lines) {
      if (t < l.start - 3 || t > l.end + 2) continue;
      const lz = -this.travel(l.end + 0.15) * S - S * 0.9; // just ahead of the camera at the line's end
      const dz = z - lz;
      if (dz <= 0.15) continue;
      v.set(0, 0, lz).project(cam);
      const scale = (S * 1.6) / dz;
      const size = clamp(120 * scale, 8, 300);
      const words = l.words.map((w) => styleCase(w.w));
      const sp = measure(' ', fam, size);
      const tot = words.reduce((acc2, w) => acc2 + measure(w, fam, size), 0) + sp * (words.length - 1);
      const cx = (v.x * 0.5 + 0.5) * W, cy = (-v.y * 0.5 + 0.5) * H;
      let x = cx - tot / 2;
      const alpha = clamp((6 - dz / S) / 3) * clamp((dz - 0.15) / 0.6);
      if (alpha <= 0.01) continue;
      const ai = activeWord(l, t);
      c.save(); c.globalAlpha = alpha;
      l.words.forEach((w, i) => {
        drawWord(c, words[i]!, fam, size, x, cy + size * 0.35, Lyrics.wordProgress(w, t), i === ai && t < w.end + 0.06 ? rgba('accent') : P.inkA(1), P.faint, 'glyph', 0, w);
        x += measure(words[i]!, fam, size) + sp;
      });
      c.restore();
    }
    label(c, `${(au.section(t)?.name ?? '').toUpperCase()}  ·  DEPTH ${String(Math.max(0, Math.floor(-z / S))).padStart(4, '0')}`, SAFE, SAFE, P.inkA(0.5));
    comp.draw(renderer, L.upload(), out);
    const db = au.timeOfBar(Math.floor(f.bar + 1e-4));
    return { zoom: 1 + 0.01 * pulse(t, db, 0.1), paper: P.light ? 1 : 0 };
  }
}

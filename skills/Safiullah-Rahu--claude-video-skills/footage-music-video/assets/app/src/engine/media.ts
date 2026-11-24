// Media for videos built on generated footage: clips (frame sequences extracted by the ai-music-video
// skill's conform.py), 2.5D plates (a still + its depth map), per-frame tracking boxes and the shot list.
// Everything is addressed in LOCAL clip time and drawn deterministically: the export awaits prepare()
// (Engine.prepare → Scene.prepare) so every frame's images are decoded before it renders.
//
// <project>/media/manifest.json (served at /media/ by vite.config.ts, like audio/ and data/):
//   { "clips":  { "SD05": { "dir": "clips/SD05", "fps": 24, "frames": 96, "w": 1920, "h": 1080, "ext": "jpg" } },
//     "plates": { "waymo-seat": { "image": "plates/waymo-seat.jpg", "depth": "plates/waymo-seat.depth.png", "w": 1456, "h": 816 } },
//     "tracks": { "SD05": "tracks/SD05.json" },            // { fps, frames: [[{label, box:[x0,y0,x1,y1], score}], …] } (0..1 coords)
//     "shots":  "shots.json" }                               // the storyboard's shot list (optional)
import * as THREE from 'three';
import { FSPass } from './gl';

export interface ClipMeta { dir: string; fps: number; frames: number; w: number; h: number; ext?: string }
export interface PlateMeta { image: string; depth?: string; w: number; h: number }
export interface TrackBox { label: string; box: [number, number, number, number]; score: number }
export interface Manifest { clips?: Record<string, ClipMeta>; plates?: Record<string, PlateMeta>; tracks?: Record<string, string>; shots?: string }

const pad = (n: number, w = 5) => String(n).padStart(w, '0');

async function bitmapOf(url: string): Promise<ImageBitmap> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`media missing: ${url} (${r.status})`);
  return createImageBitmap(await r.blob());
}

export class Media {
  manifest: Manifest = {};
  shots: any = null;
  private frames = new Map<string, ImageBitmap>();
  private pending = new Map<string, Promise<ImageBitmap>>();
  private lru: string[] = [];
  private plates = new Map<string, { image: ImageBitmap; depth: ImageBitmap | null }>();
  private tracks = new Map<string, { fps: number; frames: TrackBox[][] }>();
  /** Decoded frames kept in memory (1080p ≈ 8 MB each). */
  maxFrames = 160;

  static async load(): Promise<Media> {
    const m = new Media();
    try {
      const r = await fetch('media/manifest.json');
      if (r.ok && (r.headers.get('content-type') ?? '').includes('json')) m.manifest = await r.json();
      if (m.manifest.shots) {
        const s = await fetch(`media/${m.manifest.shots}`);
        if (s.ok) m.shots = await s.json();
      }
    } catch { /* no media: a pure-code video */ }
    return m;
  }

  clip(id: string): ClipMeta {
    const c = this.manifest.clips?.[id];
    if (!c) throw new Error(`unknown clip ${id} (media/manifest.json)`);
    return c;
  }
  has(id: string) { return !!this.manifest.clips?.[id] || !!this.manifest.plates?.[id]; }

  /** Frame index of a clip at local time lt (s), clamped to the clip. */
  frameIndex(id: string, lt: number) {
    const c = this.clip(id);
    return Math.max(0, Math.min(c.frames - 1, Math.floor(lt * c.fps + 1e-6)));
  }
  private key(id: string, i: number) { return `${id}#${i}`; }
  private url(id: string, i: number) { const c = this.clip(id); return `media/${c.dir}/f_${pad(i + 1)}.${c.ext ?? 'jpg'}`; }

  private async loadFrame(id: string, i: number) {
    const k = this.key(id, i);
    const hit = this.frames.get(k);
    if (hit) { this.touch(k); return hit; }
    let p = this.pending.get(k);
    if (!p) {
      p = bitmapOf(this.url(id, i)).then((b) => { this.frames.set(k, b); this.pending.delete(k); this.touch(k); this.evict(); return b; });
      this.pending.set(k, p);
    }
    return p;
  }
  private touch(k: string) { const j = this.lru.indexOf(k); if (j >= 0) this.lru.splice(j, 1); this.lru.push(k); }
  private evict() {
    while (this.lru.length > this.maxFrames) {
      const k = this.lru.shift()!;
      this.frames.get(k)?.close();
      this.frames.delete(k);
    }
  }

  /** Load the frames of clip `id` covering local times [lt0, lt1] (plus one ahead). */
  async prepareClip(id: string, lt0: number, lt1: number) {
    const a = this.frameIndex(id, lt0), b = Math.min(this.clip(id).frames - 1, this.frameIndex(id, lt1) + 1);
    const jobs: Promise<ImageBitmap>[] = [];
    for (let i = a; i <= b; i++) jobs.push(this.loadFrame(id, i));
    await Promise.all(jobs);
  }

  /** The decoded frame for local time lt, or the nearest earlier decoded one (preview), or null. */
  frame(id: string, lt: number): ImageBitmap | null {
    const i = this.frameIndex(id, lt);
    for (let j = i; j >= Math.max(0, i - 48); j--) {
      const b = this.frames.get(this.key(id, j));
      if (b) { if (j !== i) void this.loadFrame(id, i); return b; }
    }
    void this.loadFrame(id, i);
    return null;
  }

  async preparePlate(id: string) {
    if (this.plates.has(id)) return;
    const p = this.manifest.plates?.[id];
    if (!p) throw new Error(`unknown plate ${id} (media/manifest.json)`);
    const [image, depth] = await Promise.all([bitmapOf(`media/${p.image}`), p.depth ? bitmapOf(`media/${p.depth}`) : Promise.resolve(null)]);
    this.plates.set(id, { image, depth });
  }
  plate(id: string) { return this.plates.get(id) ?? null; }

  async prepareTrack(id: string) {
    if (this.tracks.has(id) || !this.manifest.tracks?.[id]) return;
    const r = await fetch(`media/${this.manifest.tracks[id]}`);
    if (r.ok) this.tracks.set(id, await r.json());
  }
  /** Tracked box for `label` at local time lt, linearly interpolated between sampled frames (0..1 coords). */
  box(id: string, label: string, lt: number): TrackBox | null {
    const tr = this.tracks.get(id);
    if (!tr || !tr.frames.length) return null;
    const x = lt * tr.fps, i = Math.max(0, Math.min(tr.frames.length - 1, Math.floor(x))), j = Math.min(tr.frames.length - 1, i + 1), f = Math.min(1, Math.max(0, x - i));
    const a = tr.frames[i]!.find((b) => b.label === label), b = tr.frames[j]!.find((bb) => bb.label === label);
    if (!a && !b) return null;
    if (!a || !b) return (a ?? b)!;
    return { label, score: a.score + (b.score - a.score) * f, box: a.box.map((v, k) => v + (b.box[k]! - v) * f) as TrackBox['box'] };
  }
}

/** Camera over a plate or clip: pan in frame fractions, zoom (1 = cover), roll (rad). */
export interface Cam { x?: number; y?: number; zoom?: number; rot?: number }
/** Colour grade applied while drawing the layer (linear): exposure multiplier, contrast around mid-grey, saturation. */
export interface Grade {
  exposure?: number; contrast?: number; saturation?: number; tint?: [number, number, number];
  /** Print screen on the footage only (so type and graphics drawn over it stay crisp): 0 none · 4 colour halftone ·
   *  5 tone dots; cell size in logical px; amount 0..1. */
  screen?: number; screenCell?: number; screenAmt?: number;
}

const GRADE_GLSL = /* glsl */ `
uniform float exposure, contrast, saturation; uniform vec3 tint;
uniform float scrMode, scrCell, scrAmt;
vec3 grade(vec3 c) {
  c *= exposure * tint;
  float l = luma(c);
  c = mix(vec3(l), c, saturation);
  c = max(vec3(0.0), (c - 0.18) * contrast + 0.18);
  return c;
}
vec3 _toS(vec3 c) { c = sat(c); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
vec3 _toL(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
// cosine spot: round dots in the highlights, a chain at 50%, solid at full cover (no bright mesh in the blacks)
float _spot(float cover, float ang) {
  vec2 p = fract(rot2(ang) * FRAG_PX / max(scrCell, 1.0)) - 0.5;
  float f = 0.5 + 0.25 * (cos(6.28318 * p.x) + cos(6.28318 * p.y));
  cover = sat((cover - 0.035) / 0.93);
  if (cover >= 0.999) return 1.0;
  if (cover <= 0.001) return 0.0;
  float th = 1.0 - cover, aa = max(fwidth(f), 0.01);
  return smoothstep(th - aa, th + aa, f);
}
vec3 printScreen(vec3 lin) {
  if (scrMode < 0.5 || scrAmt <= 0.0) return lin;
  vec3 s = _toS(lin), o;
  if (scrMode < 4.5) {
    vec3 c = vec3(1.0 - _spot(1.0 - s.r, 0.52), 1.0 - _spot(1.0 - s.g, 1.57), 1.0 - _spot(1.0 - s.b, 0.26));
    o = mix(c, s, 0.34);
  } else {
    float m = _spot(0.5 + 0.5 * (1.0 - luma(s)), 0.26);
    o = s * mix(1.12, 0.72, m);
  }
  return _toL(mix(s, o, scrAmt));
}`;
const COVER_GLSL = /* glsl */ `
uniform vec2 texSize; uniform vec4 cam; // x, y (frame fractions), zoom, roll
vec2 coverUV(vec2 uv) {
  vec2 p = uv - 0.5;
  p.x *= 16.0 / 9.0; p = rot2(-cam.w) * p; p.x /= 16.0 / 9.0;
  p = p / max(cam.z, 1e-3) - cam.xy;
  float ia = texSize.x / texSize.y, oa = 16.0 / 9.0;
  vec2 s = ia > oa ? vec2(oa / ia, 1.0) : vec2(1.0, ia / oa);
  vec2 q = p * s + 0.5;
  return vec2(q.x, 1.0 - q.y); // ImageBitmap rows are top-down
}`;

function setGrade(u: Record<string, THREE.IUniform>, g: Grade = {}) {
  u.exposure!.value = g.exposure ?? 1; u.contrast!.value = g.contrast ?? 1; u.saturation!.value = g.saturation ?? 1;
  u.scrMode!.value = g.screen ?? 0; u.scrCell!.value = g.screenCell ?? 4.5; u.scrAmt!.value = g.screenAmt ?? 0.9;
  (u.tint!.value as THREE.Vector3).set(...(g.tint ?? [1, 1, 1]));
}
const gradeUniforms = () => ({ exposure: { value: 1 }, contrast: { value: 1 }, saturation: { value: 1 }, tint: { value: new THREE.Vector3(1, 1, 1) },
  scrMode: { value: 0 }, scrCell: { value: 4.5 }, scrAmt: { value: 0.9 } });

function bitmapTexture() {
  const t = new THREE.Texture();
  t.colorSpace = THREE.SRGBColorSpace;
  t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = false;
  t.flipY = false; // WebGL ignores UNPACK_FLIP_Y for ImageBitmaps anyway; coverUV flips v itself
  return t;
}

/** Draws a footage frame (or any ImageBitmap) to fill the frame, with camera and grade. */
export class FootageLayer {
  tex = bitmapTexture();
  private cur: ImageBitmap | null = null;
  pass = new FSPass(/* glsl */ `
    uniform sampler2D tex; uniform float opacity;
    ${COVER_GLSL}
    ${GRADE_GLSL}
    void main() {
      vec2 uv = coverUV(vUv);
      vec3 c = texture(tex, clamp(uv, 0.0005, 0.9995)).rgb;
      fragColor = vec4(printScreen(grade(c)) * opacity, opacity);
    }`, { tex: { value: null }, opacity: { value: 1 }, texSize: { value: new THREE.Vector2(1920, 1080) }, cam: { value: new THREE.Vector4(0, 0, 1, 0) }, ...gradeUniforms() },
    { blending: THREE.CustomBlending, transparent: true });
  constructor() {
    const m = this.pass.mat;
    m.blendEquation = THREE.AddEquation; m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor;
  }
  draw(renderer: THREE.WebGLRenderer, out: THREE.WebGLRenderTarget, bmp: ImageBitmap | null, cam: Cam = {}, grade: Grade = {}, opacity = 1) {
    if (!bmp) return false;
    if (bmp !== this.cur) { this.tex.image = bmp; this.tex.needsUpdate = true; this.cur = bmp; }
    const u = this.pass.u;
    u.tex!.value = this.tex; u.opacity!.value = opacity;
    (u.texSize!.value as THREE.Vector2).set(bmp.width, bmp.height);
    (u.cam!.value as THREE.Vector4).set(cam.x ?? 0, cam.y ?? 0, cam.zoom ?? 1, cam.rot ?? 0);
    setGrade(u, grade);
    this.pass.render(renderer, out);
    return true;
  }
}

/**
 * A 2.5D plate: a still displaced by its depth map (white = near). `pan` moves near layers more than far
 * ones (parallax), `dolly` scales them apart (a push-in), `focus` is the depth that stays put. Iterative
 * lookup keeps edges from tearing for moderate moves; keep pan*strength under ~0.04 for clean results.
 */
export class Plate25D {
  tex = bitmapTexture();
  dep = bitmapTexture();
  private cur: ImageBitmap | null = null;
  private curD: ImageBitmap | null = null;
  pass = new FSPass(/* glsl */ `
    uniform sampler2D tex; uniform sampler2D dep; uniform bool hasDepth;
    uniform vec2 pan; uniform float dolly, focus, strength, opacity;
    ${COVER_GLSL}
    ${GRADE_GLSL}
    void main() {
      vec2 uv0 = coverUV(vUv), uv = uv0;
      if (hasDepth) {
        for (int i = 0; i < 5; i++) {
          float d = texture(dep, clamp(uv, 0.001, 0.999)).r - focus;
          uv = uv0 - vec2(pan.x, -pan.y) * d * strength - (uv0 - 0.5) * dolly * d;
        }
      }
      vec3 c = texture(tex, clamp(uv, 0.0005, 0.9995)).rgb;
      fragColor = vec4(printScreen(grade(c)) * opacity, opacity);
    }`, {
    tex: { value: null }, dep: { value: null }, hasDepth: { value: false }, pan: { value: new THREE.Vector2() }, dolly: { value: 0 }, focus: { value: 0.5 },
    strength: { value: 1 }, opacity: { value: 1 }, texSize: { value: new THREE.Vector2(1920, 1080) }, cam: { value: new THREE.Vector4(0, 0, 1, 0) }, ...gradeUniforms(),
  }, { blending: THREE.CustomBlending, transparent: true });
  constructor() {
    const m = this.pass.mat;
    m.blendEquation = THREE.AddEquation; m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor;
    this.dep.colorSpace = THREE.NoColorSpace; // depth is data: sample it as stored, never sRGB-decoded
  }
  draw(renderer: THREE.WebGLRenderer, out: THREE.WebGLRenderTarget, plate: { image: ImageBitmap; depth: ImageBitmap | null } | null,
    o: { pan?: [number, number]; dolly?: number; focus?: number; strength?: number; cam?: Cam; grade?: Grade; opacity?: number } = {}) {
    if (!plate) return false;
    if (plate.image !== this.cur) { this.tex.image = plate.image; this.tex.needsUpdate = true; this.cur = plate.image; }
    if (plate.depth && plate.depth !== this.curD) { this.dep.image = plate.depth; this.dep.needsUpdate = true; this.curD = plate.depth; }
    const u = this.pass.u, cam = o.cam ?? {};
    u.tex!.value = this.tex; u.dep!.value = this.dep; u.hasDepth!.value = !!plate.depth;
    (u.pan!.value as THREE.Vector2).set(o.pan?.[0] ?? 0, o.pan?.[1] ?? 0);
    u.dolly!.value = o.dolly ?? 0; u.focus!.value = o.focus ?? 0.5; u.strength!.value = o.strength ?? 1; u.opacity!.value = o.opacity ?? 1;
    (u.texSize!.value as THREE.Vector2).set(plate.image.width, plate.image.height);
    (u.cam!.value as THREE.Vector4).set(cam.x ?? 0, cam.y ?? 0, cam.zoom ?? 1, cam.rot ?? 0);
    setGrade(u, o.grade);
    this.pass.render(renderer, out);
    return true;
  }
}

/** Map a 0..1 track box to logical frame px under the same cover fit + camera as FootageLayer/Plate25D. */
export function boxToFrame(b: [number, number, number, number], srcW: number, srcH: number, cam: Cam = {}, W = 1920, H = 1080) {
  const ia = srcW / srcH, oa = W / H;
  const s = ia > oa ? [oa / ia, 1] : [1, ia / oa];
  const z = cam.zoom ?? 1;
  const map = (u: number, v: number) => {
    // inverse of coverUV (ignoring roll): q = p*s + 0.5, p = (screen - 0.5)/z - cam
    const px = (u - 0.5) / s[0]!, py = (v - 0.5) / s[1]!;
    return [((px + (cam.x ?? 0)) * z + 0.5) * W, ((py - (cam.y ?? 0)) * z + 0.5) * H];
  };
  const [x0, y0] = map(b[0], b[1]), [x1, y1] = map(b[2], b[3]);
  return { x: x0!, y: y0!, w: x1! - x0!, h: y1! - y0! };
}

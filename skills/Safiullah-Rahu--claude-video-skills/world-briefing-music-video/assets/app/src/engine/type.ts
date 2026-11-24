// Typography: font registry (Canvas2D via FontFace + outlines via opentype.js), glyph layout,
// text outlines as Path2D, and point sampling of text for particle effects.
//
// Fonts are listed in public/fonts/fonts.json (written by `gmv.py fonts`), one entry per static face:
//   { "role": "display", "file": "display/Archivo-w75-900.ttf", "width": 75, "weight": 900, "italic": false }
// Roles: display (the lyric voice), text (a second, rarer register: serif/italic), mono (the machine/UI
// voice) — plus anything a style adds. Static instances (not variable fonts) so canvas text and the
// opentype.js outlines match exactly; animate width/weight by picking the nearest instance.
import * as opentype from 'opentype.js';

export interface FaceDef { role: string; file: string; width?: number; weight?: number; italic?: boolean; features?: string; name?: string }
interface Face { role: string; file: string; width: number; weight: number; italic: boolean; features?: string; family: string }

let FACES: Face[] = [];
const ROLE_FALLBACK: Record<string, string[]> = { display: ['text', 'mono'], text: ['display', 'mono'], serif: ['text', 'display'], mono: ['text', 'display'] };

function facesFor(role: string): Face[] {
  let fs = FACES.filter((f) => f.role === role);
  for (const alt of ROLE_FALLBACK[role] ?? []) if (!fs.length) fs = FACES.filter((f) => f.role === alt);
  if (!fs.length) fs = FACES;
  if (!fs.length) throw new Error(`no fonts loaded (public/fonts/fonts.json is empty?)`);
  return fs;
}

/** CSS family name of the static face nearest to the request (italic first, then width, then weight). */
export function pick(role: string, o: { width?: number; weight?: number; italic?: boolean } = {}): string {
  const width = o.width ?? 100, weight = o.weight ?? 400, italic = !!o.italic;
  let best: Face | null = null, bs = Infinity;
  for (const f of facesFor(role)) {
    const s = (f.italic === italic ? 0 : 1e6) + Math.abs(f.width - width) * 40 + Math.abs(f.weight - weight);
    if (s < bs) { bs = s; best = f; }
  }
  return best!.family;
}

/** Convenience pickers. Width is a percentage (62 = condensed … 125 = expanded) when the font has a width axis. */
export const F = {
  /** The lyric voice. */
  display(width = 100, weight = 700): string { return pick('display', { width, weight }); },
  displayItalic(width = 100, weight = 800): string { return pick('display', { width, weight, italic: true }); },
  /** The rare second register (serif / italic / script). */
  text(weight = 400, italic = false): string { return pick('text', { weight, italic }); },
  serif(weight = 400, italic = false): string { return pick('text', { weight, italic }); },
  /** The machine voice: labels, timecodes, UI, annotations. */
  mono(weight = 400, italic = false): string { return pick('mono', { weight, italic }); },
  /** Available widths / weights of a role (sorted), e.g. to animate width only when the font has the axis. */
  widths(role = 'display'): number[] { return [...new Set(facesFor(role).map((f) => f.width))].sort((a, b) => a - b); },
  weights(role = 'display'): number[] { return [...new Set(facesFor(role).map((f) => f.weight))].sort((a, b) => a - b); },
  has(role: string): boolean { return FACES.some((f) => f.role === role); },
};

/** CSS font string for Canvas2D. */
export const font = (family: string, sizePx: number) => `${sizePx}px "${family}"`;

const otCache = new Map<string, opentype.Font>();
const bufCache = new Map<string, ArrayBuffer>();

export async function loadFonts(): Promise<void> {
  const r = await fetch('fonts/fonts.json');
  const man = (await r.json()) as { faces: FaceDef[] };
  FACES = (man.faces ?? []).map((d) => {
    const width = d.width ?? 100, weight = d.weight ?? 400, italic = !!d.italic;
    return { role: d.role, file: d.file, width, weight, italic, features: d.features, family: d.name ?? `${d.role}-${width}-${weight}${italic ? 'i' : ''}` };
  });
  await Promise.all(
    FACES.map(async (d) => {
      const res = await fetch(`fonts/${d.file}`);
      if (!res.ok) throw new Error(`font file missing: fonts/${d.file}`);
      const buf = await res.arrayBuffer();
      bufCache.set(d.family, buf);
      const ff = new FontFace(d.family, buf, d.features ? { featureSettings: d.features } : undefined);
      await ff.load();
      document.fonts.add(ff);
    }),
  );
  await document.fonts.ready;
}

/** opentype.js Font for outline work (lazy-parsed). */
export function ot(family: string): opentype.Font {
  let f = otCache.get(family);
  if (!f) {
    const buf = bufCache.get(family);
    if (!buf) throw new Error(`font not loaded: ${family}`);
    f = opentype.parse(buf);
    otCache.set(family, f);
  }
  return f;
}

/** Vertical metrics of a face in em units (cap height, x-height, ascender, descender>0). */
export function metrics(family: string) {
  const f = ot(family);
  const upm = f.unitsPerEm;
  const os2 = (f.tables as any).os2 ?? {};
  const capH = os2.sCapHeight || (f.charToGlyph('H').getBoundingBox().y2 ?? upm * 0.7);
  const xH = os2.sxHeight || (f.charToGlyph('x').getBoundingBox().y2 ?? upm * 0.5);
  return { cap: capH / upm, x: xH / upm, ascent: f.ascender / upm, descent: -f.descender / upm };
}

export interface Glyph {
  ch: string;
  i: number; // char index in string
  x: number; // left edge (px), relative to the text origin
  w: number; // advance width (px)
}
export interface TextLayout {
  text: string;
  family: string;
  size: number;
  width: number; // total advance width
  ascent: number;
  descent: number;
  glyphs: Glyph[];
}

let measureCtx: CanvasRenderingContext2D | null = null;
function mctx() {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d')!;
  return measureCtx;
}

/**
 * Per-glyph horizontal layout with the font's kerning, for drawing glyphs one by one.
 * Glyph i sits at the width of text[0..i] minus its own advance, so the kerning between it and the
 * previous glyph moves *it* (the width of text[0..i) alone leaves that pair out: every kern would land
 * one glyph late). `w` is the glyph's own advance. `tracking` is extra letter spacing in px.
 */
export function layout(text: string, family: string, size: number, tracking = 0): TextLayout {
  const c = mctx();
  c.font = font(family, size);
  const glyphs: Glyph[] = [];
  const chars = Array.from(text);
  let prefix = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    prefix += ch;
    const w = c.measureText(ch).width;
    glyphs.push({ ch, i, x: c.measureText(prefix).width - w + i * tracking, w });
  }
  const m = c.measureText(text || 'M');
  return {
    text, family, size,
    width: (text ? m.width : 0) + Math.max(0, chars.length - 1) * tracking,
    ascent: m.fontBoundingBoxAscent ?? size * 0.8,
    descent: m.fontBoundingBoxDescent ?? size * 0.2,
    glyphs,
  };
}

/**
 * x (px) of glyph `index` in `text` set as one kerned run — where to start drawing text[index..] when a
 * word is split into separately drawn pieces (sung/unsung colours, a clipped wipe). Measuring
 * text[0..index) instead would drop the kern between the two pieces. Past the end: the run's width.
 */
export function glyphX(text: string, index: number, family: string, size: number, tracking = 0): number {
  const chars = Array.from(text);
  if (index <= 0) return 0;
  if (index >= chars.length) return measure(text, family, size, tracking);
  const c = mctx();
  c.font = font(family, size);
  return c.measureText(chars.slice(0, index + 1).join('')).width - c.measureText(chars[index]!).width + index * tracking;
}

/**
 * Typographic punctuation for display text: curly apostrophes and quotes, the ellipsis character.
 * Leading elisions (’cause, ’til, ’em, ’90s) get an apostrophe, not an opening quote.
 */
export function smart(s: string): string {
  return s
    .replace(/\.\.\./g, '…')
    .replace(/(^|[\s([{—–-])'(?=(?:cause|cos|til|em|round|n|tis|twas|\d0s)\b)/gi, '$1’')
    .replace(/(^|[\s([{—–-])'/g, '$1‘')
    .replace(/'/g, '’')
    .replace(/(^|[\s([{—–-])"/g, '$1“')
    .replace(/"/g, '”');
}

/** Typewriter quotes back (mono UI text that shows a lyric as typed input or code). */
export const plain = (s: string) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...');

export function measure(text: string, family: string, size: number, tracking = 0) {
  const c = mctx();
  c.font = font(family, size);
  return c.measureText(text).width + Math.max(0, Array.from(text).length - 1) * tracking;
}

/** Largest font size (<= max) at which text fits in maxWidth. */
export function fitSize(text: string, family: string, maxWidth: number, max = 400, tracking = 0) {
  const w = measure(text, family, 100, tracking * 100 / max);
  return Math.min(max, (100 * maxWidth) / Math.max(1, w));
}

/**
 * Outline of text as opentype commands at (x, baselineY). Glyphs are placed one by one at the
 * Canvas2D-measured positions (so outlines line up with fillText) — this also sidesteps
 * opentype.js's unsupported GSUB lookups that crash font.getPath() on some fonts.
 */
export function textPathCommands(text: string, family: string, size: number, x = 0, y = 0, tracking = 0) {
  const f = ot(family);
  const lay = layout(text, family, size, tracking);
  const cmds: opentype.PathCommand[] = [];
  for (const g of lay.glyphs) cmds.push(...f.charToGlyph(g.ch).getPath(x + g.x, y, size).commands);
  return cmds;
}

/** Outline of text as a Path2D at (x, baselineY). */
export function textPath2D(text: string, family: string, size: number, x = 0, y = 0, tracking = 0): Path2D {
  const p = new opentype.Path();
  p.commands = textPathCommands(text, family, size, x, y, tracking);
  return new Path2D(p.toPathData(3));
}

/**
 * Sample points inside the filled text (rasterized at `size`) on a jittered grid with spacing `step`.
 * Returns points relative to the text origin (left, baseline). Great for "text made of atoms".
 */
export function textPoints(text: string, family: string, size: number, step = 6, seed = 1): { x: number; y: number }[] {
  const lay = layout(text, family, size);
  const pad = Math.ceil(size * 0.3);
  const W = Math.ceil(lay.width + pad * 2), H = Math.ceil(size * 1.6);
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d', { willReadFrequently: true })!;
  c.font = font(family, size);
  c.fillStyle = '#fff';
  c.textBaseline = 'alphabetic';
  const base = Math.round(size * 1.15);
  c.fillText(text, pad, base);
  const data = c.getImageData(0, 0, W, H).data;
  const out: { x: number; y: number }[] = [];
  let s = seed >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      const jx = x + (rnd() - 0.5) * step * 0.8, jy = y + (rnd() - 0.5) * step * 0.8;
      const ix = Math.max(0, Math.min(W - 1, Math.round(jx))), iy = Math.max(0, Math.min(H - 1, Math.round(jy)));
      if (data[(iy * W + ix) * 4 + 3]! > 128) out.push({ x: jx - pad, y: jy - base });
    }
  }
  return out;
}

import style from '@root/style.json';
import { hexToLinear } from './util';

// The whole video lives in one restrained palette, defined per project in style.json (project root).
// Roles, not hues: a dark style has a dark `bg` and a light `fg`; a paper style the reverse.
//   bg     background                     bg2    raised background (panels, paper-in-the-dark)
//   dim    dim lines, secondary text       mid    mid tone (labels, unsung words)
//   fg     primary type / paper            accent the signal colour (the sung word, the motif)
//   hot    hotter/lighter accent (cores)   deep   deep shade of the accent (shadows, halation)
//   rare   one rare accent, owned by one moment of the video
// Extra keys in style.json's palette are allowed (rgba('mykey'), LIN.mykey, C_MYKEY in GLSL).
const DEFAULTS = {
  bg: '#0A0A0B',
  bg2: '#151517',
  dim: '#5E5B57',
  mid: '#9C978F',
  fg: '#EEE9DF',
  accent: '#FF4D12',
  hot: '#FF8A3D',
  deep: '#C21D0B',
  rare: '#D8FF3C',
};

export type PaletteKey = keyof typeof DEFAULTS;
type RGB = [number, number, number];

export const HEX: Record<PaletteKey, string> & Record<string, string> = { ...DEFAULTS, ...((style as any).palette ?? {}) };

/** Linear RGB triplets for GL uniforms and LineBatch colours. */
export const LIN: Record<PaletteKey, RGB> & Record<string, RGB> = Object.fromEntries(
  Object.entries(HEX).map(([k, v]) => [k, hexToLinear(v)]),
) as any;

const lum = (c: RGB) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
/** True when the style is light-on-dark (bg darker than fg). Paper styles have DARK = false. */
export const DARK = lum(LIN.bg) < lum(LIN.fg);

/** CSS rgba() for Canvas2D: a palette key or any #hex. */
export function rgba(key: PaletteKey | string, a = 1): string {
  const [r, g, b] = parse(HEX[key] ?? key);
  return `rgba(${r},${g},${b},${a})`;
}

/** Mix two palette colours (or hexes) for Canvas2D: k = 0 → a, 1 → b (sRGB mix, fine for UI tints). */
export function mixCss(a: PaletteKey | string, b: PaletteKey | string, k: number, alpha = 1): string {
  const pa = parse(HEX[a] ?? a), pb = parse(HEX[b] ?? b);
  const kk = Math.max(0, Math.min(1, k));
  const m = pa.map((x, i) => Math.round(x + (pb[i]! - x) * kk));
  return `rgba(${m[0]},${m[1]},${m[2]},${alpha})`;
}
function parse(hex: string): RGB {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Linear colour of a palette key (or hex) scaled by an intensity; > ~0.85 blooms in dark styles. */
export function glow(key: PaletteKey | string, k = 1): RGB {
  const c = LIN[key] ?? hexToLinear(key);
  return [c[0] * k, c[1] * k, c[2] * k];
}

/** Style metadata from style.json (name, fonts, type defaults, motif, anything extra). */
export const STYLE = style as {
  name?: string;
  description?: string;
  palette?: Record<string, string>;
  fonts?: Record<string, string>;
  post?: Record<string, number>;
  type?: { case?: 'none' | 'upper' | 'lower'; tracking?: number };
  motif?: string;
  [k: string]: any;
};

/** Apply the style's default letter case to display text. */
export function styleCase(s: string, c = STYLE.type?.case ?? 'none') {
  return c === 'upper' ? s.toUpperCase() : c === 'lower' ? s.toLowerCase() : s;
}

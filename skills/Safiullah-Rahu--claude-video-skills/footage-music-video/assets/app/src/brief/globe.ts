// The night globe (orthographic) and the flat world map (Equal Earth), drawn with d3-geo into Canvas2D from Natural
// Earth 1:50m boundaries (public domain, via the world-atlas package). Pure functions of their arguments.
import { geoOrthographic, geoEqualEarth, geoPath, geoGraticule10, geoInterpolate, geoDistance, type GeoProjection } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import world50 from 'world-atlas/countries-50m.json';
import { C, rgbaHex, PAPER, RED, label, text, FONT, clamp, ease, hash, fi } from './kit';

const topo = world50 as any;
export const COUNTRIES: any[] = (feature(topo, topo.objects.countries) as any).features;
const BORDERS = mesh(topo, topo.objects.countries, (a: any, b: any) => a !== b);
const LAND = feature(topo, { type: 'GeometryCollection', geometries: topo.objects.countries.geometries } as any);
const GRAT = geoGraticule10();
const BY_NAME = new Map<string, any>(COUNTRIES.map((f) => [String(f.properties.name).toLowerCase(), f]));
const BY_ID = new Map<string, any>(COUNTRIES.map((f) => [String(f.id), f]));
/** Natural Earth names differ from common usage for a few countries. */
const ALIAS: Record<string, string> = {
  'united states': 'united states of america', usa: 'united states of america', us: 'united states of america', 'dr congo': 'dem. rep. congo',
  drc: 'dem. rep. congo', 'democratic republic of the congo': 'dem. rep. congo', 'south sudan': 's. sudan', 'central african republic': 'central african rep.',
  'czech republic': 'czechia', 'bosnia and herzegovina': 'bosnia and herz.', 'dominican republic': 'dominican rep.', 'north korea': 'north korea',
  'south korea': 'south korea', 'ivory coast': "côte d'ivoire", "cote d'ivoire": "côte d'ivoire", palestine: 'palestine', gaza: 'palestine',
  'west bank': 'palestine', uk: 'united kingdom', britain: 'united kingdom', 'eswatini': 'eswatini', 'myanmar': 'myanmar', burma: 'myanmar',
};
export function country(nameOrId: string): any | null {
  const k = nameOrId.toLowerCase();
  return BY_NAME.get(ALIAS[k] ?? k) ?? BY_ID.get(nameOrId) ?? null;
}

export interface Highlight { name: string; col?: string; alpha?: number; outline?: boolean }
export interface Pin { lon: number; lat: number; text?: string; t0?: number; hot?: boolean; side?: 'left' | 'right' }
export interface Arc { from: [number, number]; to: [number, number]; u: number; col?: string; width?: number }
export interface GlobeView {
  lon: number; lat: number;          // centre of view
  r: number; cx?: number; cy?: number;
  highlights?: Highlight[];
  pins?: Pin[];
  arcs?: Arc[];
  alpha?: number;
  /** 0 = night palette (default), 1 = paper print (ink land on paper) */
  paper?: number;
  spin?: number;                      // extra rotation (deg) for a slow idle turn
}

function project(v: GlobeView): GeoProjection {
  return geoOrthographic().scale(v.r).translate([v.cx ?? 960, v.cy ?? 540]).rotate([-(v.lon + (v.spin ?? 0)), -v.lat, 0]).clipAngle(90).precision(0.4);
}

/** Is a lon/lat on the visible hemisphere of the view? */
export const visible = (v: GlobeView, lon: number, lat: number) => geoDistance([lon, lat], [v.lon + (v.spin ?? 0), v.lat]) < Math.PI / 2 - 0.02;

export function drawGlobe(c: CanvasRenderingContext2D, v: GlobeView, t: number) {
  const a = v.alpha ?? 1;
  if (a <= 0) return;
  const p = project(v), path = geoPath(p, c);
  const cx = v.cx ?? 960, cy = v.cy ?? 540, r = v.r;
  c.save();
  c.globalAlpha *= a;
  // atmosphere glow
  let g = c.createRadialGradient(cx, cy, r * 0.96, cx, cy, r * 1.18);
  g.addColorStop(0, rgbaHex('#4C79C8', 0.28)); g.addColorStop(0.4, rgbaHex('#2E4E8A', 0.12)); g.addColorStop(1, rgbaHex('#2E4E8A', 0));
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r * 1.18, 0, Math.PI * 2); c.fill();
  // ocean: lit from the upper left
  g = c.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
  g.addColorStop(0, '#16264A'); g.addColorStop(0.7, '#0E1A34'); g.addColorStop(1, '#0A1226');
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
  // graticule
  c.beginPath(); path(GRAT); c.strokeStyle = rgbaHex('#7FA0D8', 0.09); c.lineWidth = 0.8; c.stroke();
  // land
  c.beginPath(); path(LAND as any); c.fillStyle = C.land; c.fill();
  // highlights
  for (const h of v.highlights ?? []) {
    const f = country(h.name);
    if (!f) continue;
    c.beginPath(); path(f);
    c.fillStyle = rgbaHex(h.col ?? C.red, (h.alpha ?? 1) * 0.9); c.fill();
    if (h.outline !== false) { c.strokeStyle = rgbaHex(h.col ?? C.hot, (h.alpha ?? 1)); c.lineWidth = 1.3; c.stroke(); }
  }
  // borders
  c.beginPath(); path(BORDERS as any); c.strokeStyle = rgbaHex('#9DB0D6', 0.22); c.lineWidth = 0.6; c.stroke();
  // rim light
  g = c.createRadialGradient(cx, cy, r * 0.82, cx, cy, r);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, rgbaHex('#050A16', 0.55));
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = rgbaHex('#8FB2F0', 0.35); c.lineWidth = 1.2; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
  // arcs (great circles, drawn on)
  for (const ar of v.arcs ?? []) {
    if (ar.u <= 0) continue;
    const ip = geoInterpolate(ar.from, ar.to), m = 64, u = clamp(ar.u);
    const coords: [number, number][] = [];
    for (let i = 0; i <= m; i++) coords.push(ip((i / m) * u) as [number, number]);
    c.beginPath(); path({ type: 'LineString', coordinates: coords } as any);
    c.strokeStyle = ar.col ?? RED(0.95); c.lineWidth = ar.width ?? 2.2; c.stroke();
  }
  // pins
  for (const pn of v.pins ?? []) {
    if (!visible(v, pn.lon, pn.lat)) continue;
    const xy = p([pn.lon, pn.lat]);
    if (!xy) continue;
    const k = ease.outExpo(clamp((t - (pn.t0 ?? -99)) / 0.4));
    if (k <= 0) continue;
    const [x, y] = xy, col = pn.hot ? RED() : PAPER(0.95);
    // pulse rings
    for (let i = 0; i < 2; i++) {
      const ph = ((t - (pn.t0 ?? 0)) * 0.8 + i * 0.5) % 1;
      c.strokeStyle = pn.hot ? RED(0.6 * (1 - ph)) : PAPER(0.45 * (1 - ph)); c.lineWidth = 1.2;
      c.beginPath(); c.arc(x, y, 5 + ph * 22, 0, Math.PI * 2); c.stroke();
    }
    c.fillStyle = col; c.beginPath(); c.arc(x, y, 4.5 * k, 0, Math.PI * 2); c.fill();
    if (pn.text) {
      const right = (pn.side ?? 'right') === 'right', lx = x + (right ? 26 : -26), ly = y - 22;
      c.strokeStyle = PAPER(0.6 * k); c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(lx, ly); c.lineTo(lx + (right ? 14 : -14), ly); c.stroke();
      label(c, pn.text, lx + (right ? 20 : -20), ly + 5, PAPER(0.95 * k), 14, { align: right ? 'left' : 'right', w: 600 });
    }
  }
  c.restore();
  return p;
}

/** Flat Equal Earth world (overviews, choropleths). values: country name -> 0..1 intensity. */
export function drawFlatMap(c: CanvasRenderingContext2D, o: { x: number; y: number; w: number; t: number; values?: Record<string, number>; highlights?: Highlight[]; alpha?: number; ink?: boolean; pins?: Pin[] }) {
  const p = geoEqualEarth().fitWidth(o.w, { type: 'Sphere' } as any);
  const tr = p.translate();
  p.translate([tr[0] + o.x, tr[1] + o.y]);
  const path = geoPath(p, c);
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  c.beginPath(); path({ type: 'Sphere' } as any); c.fillStyle = o.ink ? rgbaHex(C.paper2, 1) : '#0D1830'; c.fill();
  c.beginPath(); path(GRAT); c.strokeStyle = o.ink ? 'rgba(11,18,32,0.08)' : rgbaHex('#7FA0D8', 0.07); c.lineWidth = 0.7; c.stroke();
  c.beginPath(); path(LAND as any); c.fillStyle = o.ink ? '#CFC6B4' : C.land; c.fill();
  for (const [name, v] of Object.entries(o.values ?? {})) {
    const f = country(name); if (!f) continue;
    c.beginPath(); path(f); c.fillStyle = rgbaHex(C.red, 0.2 + 0.75 * clamp(v)); c.fill();
  }
  for (const h of o.highlights ?? []) {
    const f = country(h.name); if (!f) continue;
    c.beginPath(); path(f); c.fillStyle = rgbaHex(h.col ?? C.red, h.alpha ?? 0.9); c.fill();
  }
  c.beginPath(); path(BORDERS as any); c.strokeStyle = o.ink ? 'rgba(11,18,32,0.25)' : rgbaHex('#9DB0D6', 0.2); c.lineWidth = 0.5; c.stroke();
  for (const pn of o.pins ?? []) {
    const xy = p([pn.lon, pn.lat]); if (!xy) continue;
    const k = ease.outExpo(clamp((o.t - (pn.t0 ?? -99)) / 0.4)); if (k <= 0) continue;
    c.fillStyle = pn.hot ? RED() : o.ink ? 'rgba(11,18,32,0.9)' : PAPER(0.95);
    c.beginPath(); c.arc(xy[0], xy[1], 4 * k, 0, Math.PI * 2); c.fill();
    if (pn.text) label(c, pn.text, xy[0] + 10, xy[1] + 5, o.ink ? 'rgba(11,18,32,0.9)' : PAPER(0.9), 13, { w: 600 });
  }
  c.restore();
  return p;
}

/** Smoothly fly between views: keyframes [time, view-partial]; lon takes the short way round. */
export function flyTo(t: number, keys: [number, Partial<GlobeView>, number?][]): Partial<GlobeView> {
  if (!keys.length) return {};
  let i = 0;
  while (i + 1 < keys.length && t >= keys[i + 1]![0]) i++;
  const [t0, a] = keys[i]!, nx = keys[i + 1];
  if (!nx || t <= t0) return { ...a };
  const [t1, b, dur] = nx;
  const d = dur ?? Math.min(1.6, t1 - t0);
  const u = ease.inOutCubic(clamp((t - (t1 - d)) / d));
  const out: any = { ...a };
  for (const k of ['lat', 'r', 'cx', 'cy'] as const) if (a[k] != null && b[k] != null) out[k] = a[k]! + (b[k]! - a[k]!) * u;
  if (a.lon != null && b.lon != null) { let dl = ((b.lon - a.lon + 540) % 360) - 180; out.lon = a.lon + dl * u; }
  return out;
}
export { text, FONT, hash, fi };

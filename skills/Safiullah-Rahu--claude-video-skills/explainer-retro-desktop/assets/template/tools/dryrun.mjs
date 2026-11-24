// Dry run: executes film.draw(t) for EVERY frame in node against a fake 2D context and reports any exception with its
// time. An exception inside a clipped window leaks the clip into every later frame of that render worker (render 1 of
// the sample lost 45 s that way), so run this before every render.   usage: node tools/dryrun.mjs [fps=30]
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const fps = Number(process.argv[2] || 30);
function fakeCtx(canvas) {
  const grad = { addColorStop() {} };
  const base = {
    canvas, createLinearGradient: () => grad, createRadialGradient: () => grad, createPattern: () => ({}),
    measureText: (s) => ({ width: String(s).length * 20 }),
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)) }),
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)) }), putImageData() {}, drawImage(img) { if (!img) throw new Error("drawImage(undefined)"); },
  };
  return new Proxy(base, {
    get(t, k) { if (k in t) return t[k]; return typeof k === "string" && /^[a-z]/.test(k) ? () => {} : undefined; },
    set(t, k, v) { t[k] = v; return true; },
  });
}
function fakeCanvas() { const c = { width: 1080, height: 1920 }; c.getContext = () => fakeCtx(c); return c; }
const logged = [];
const con = { log: console.log, warn: console.warn, error: (...a) => logged.push(a.join(" ")) };
const ctx = { window: {}, document: { createElement: () => fakeCanvas(), fonts: { load: async () => [] } }, console: con, Math, Map, Promise };
vm.createContext(ctx);
const libs = fs.readdirSync(path.join(ROOT, "assets", "lib"));
const order = ["retro-kit.js", "race.js", "vo-data.js", "hash-data.js", "film.js"].filter((f) => libs.includes(f));
for (const f of order) vm.runInContext(fs.readFileSync(path.join(ROOT, "assets", "lib", f), "utf8"), ctx, { filename: f });
let film, dur;
if (ctx.window.FILM_CREATE) { film = ctx.window.FILM_CREATE(fakeCanvas()); dur = ctx.window.VO.dur; }
else { const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "score", "config.json"), "utf8")); film = ctx.window.MATH_FILM(fakeCanvas(), cfg); dur = cfg.dur; }
const errs = new Map();
const n = Math.round(dur * fps);
for (let i = 0; i < n; i++) {
  const t = i / fps;
  try { film.draw(t); } catch (e) { const k = String(e && e.message); if (!errs.has(k)) errs.set(k, []); errs.get(k).push(+t.toFixed(2)); }
}
for (const m0 of logged) { const tm = (m0.match(/ at (\d+\.\d+)/) || [])[1]; const m = m0.replace(/ at \d+\.\d+/, ""); if (!errs.has(m)) errs.set(m, []); errs.get(m).push(tm ? +tm : "logged"); }
if (!errs.size) console.log(`dry run ok: ${n} frames, no exceptions`);
for (const [k, ts] of errs) console.log(`EXCEPTION x${ts.length} first ${ts[0]} s, last ${ts[ts.length - 1]} s: ${k}`);
process.exit(errs.size ? 1 : 0);

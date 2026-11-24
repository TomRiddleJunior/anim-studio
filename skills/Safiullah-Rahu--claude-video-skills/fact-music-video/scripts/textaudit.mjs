// Text audit: log every fillText drawn on the 1920x1080 overlay canvas at the given film times. It is the ground truth for
// "which text and numbers are on screen when". It catches invented or partial numbers (a split-flap spin, a count-up, a
// half-typed source line) that stills miss.
//   node textaudit.mjs --app <project>/app (--times a,b,c | --from A --to B [--step 0.0416667]) [--out scan.jsonl]
// Each output line is {t, log: [[text, x, y, alpha, colour, fontPx, scale, align], ...]}.
// Scan the whole film at 24 fps (about 1 min per minute of film), and at 60 fps around anything that animates numbers.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const APP = opt('app');
if (!APP) { console.error('--app <project>/app is required'); process.exit(2); }
const req = createRequire(APP + '/package.json');
const PW = await import(pathToFileURL(req.resolve('playwright-core')).href); const chromium = PW.chromium ?? PW.default.chromium;
const vite = await import(pathToFileURL(req.resolve('vite')).href);
const createServer = vite.createServer ?? vite.default.createServer;
let times = [];
if (opt('times')) times = opt('times').split(',').map(Number);
else { const a = +opt('from'), b = +opt('to'), s = +opt('step', '0.0416667'); for (let t = a; t < b - 1e-9; t += s) times.push(+t.toFixed(4)); }
const out = opt('out');
process.env.MV_NO_HMR = '1';
const server = await createServer({ root: APP, configFile: APP + '/vite.config.ts', logLevel: 'error', server: { port: 6100 + Math.floor(Math.random() * 300), strictPort: false, hmr: false } });
await server.listen();
const url = (server.resolvedUrls?.local?.[0] ?? '').replace(/\/$/, '');
let browser;
for (const ch of ['chrome', 'msedge', undefined]) { try { browser = await chromium.launch({ channel: ch, headless: true, args: ['--use-angle=d3d11', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'] }); break; } catch (e) { console.error(String(e).slice(0, 300)); } }
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(`${url}/?export=1`);
await page.waitForFunction(() => window.__mv?.ready || window.__mv?.error, null, { timeout: 180000 });
await page.evaluate(() => {
  window.__log = []; window.__rec = false;
  const P = CanvasRenderingContext2D.prototype, of = P.fillText;
  P.fillText = function (s, x, y, ...r) {
    if (window.__rec && this.canvas.width >= 1900) {
      const m = this.getTransform();
      const X = Math.round(m.a * x + m.c * y + m.e), Y = Math.round(m.b * x + m.d * y + m.f);
      const fs = String(this.fillStyle);
      let fa = 1; const mm = /rgba\([^)]*,\s*([\d.]+)\)/.exec(fs); if (mm) fa = +mm[1];
      const a = +(this.globalAlpha * fa).toFixed(3);
      const str = String(s);
      // skip: invisible text, the bar-ruler numbers (x 48), the ticker band (y > 1020), the timecode
      const skip = a < 0.02 || (X === 48 && /^\d{3}$/.test(str)) || Y > 1020 || (X === 1824 && Y === 1004) || str.trim() === '';
      if (!skip) window.__log.push([str, X, Y, a, fs.startsWith('#') ? fs : fs.replace(/rgba?\(([^,]+),\s*([^,]+),\s*([^,)]+).*$/, '$1,$2,$3'), parseFloat(this.font), +Math.hypot(m.a, m.b).toFixed(2), this.textAlign[0]]);
    }
    return of.call(this, s, x, y, ...r);
  };
});
const t0 = Date.now();
const lines = [];
for (const t of times) {
  const log = await page.evaluate(async (t) => {
    const E = window.__mv.engine;
    await E.prepare(t, 1 / 60, 0.5);
    window.__log = []; window.__rec = true;
    E.render(t, 1 / 60, false, 1, 0.5);
    window.__rec = false;
    return window.__log;
  }, t);
  lines.push(JSON.stringify({ t, log }));
}
if (out) fs.writeFileSync(out, lines.join('\n') + '\n'); else console.log(lines.join('\n'));
console.error(`${times.length} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
await browser.close();
await server.close();

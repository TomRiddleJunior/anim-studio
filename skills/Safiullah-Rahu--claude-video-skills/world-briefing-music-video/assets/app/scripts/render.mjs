#!/usr/bin/env node
// Adapted from mexicat/pdoom-video (MIT); see LICENSE-pdoom-video.
// Offline renderer (Node >= 20). Drives the app in headless Chrome/Edge (?export=1) and either
//   gpu:     node scripts/render.mjs gpu                       (prints the WebGL renderer: must be your GPU, not SwiftShader)
//   stills:  node scripts/render.mjs stills --t 1.5,23,40.2 [--only id1,id2] [--out dir]
//            node scripts/render.mjs stills --entries [--at 0.5]   (one still per timeline entry, named by id)
//   sheet:   node scripts/render.mjs sheet --from 20 --to 35 [--n 12] [--cols 4] [--only ids] [--out file.png]
//            (or --times a,b,c | --cuts: 4 frames around every cut | --entries: one frame per entry = storyboard)
//   perf:    node scripts/render.mjs perf --from 20 --to 25 [--only ids] [--samples 1]   (ms per frame incl. readback)
//   lyrics:  node scripts/render.mjs lyrics [--from 0] [--to <end>] [--only ids]   (every sung word on screen while sung? N/N)
//   video:   node scripts/render.mjs video [--from 0] [--to <end>] [--fps 60] [--crf 16] [--preset slow]
//            [--samples auto|N] [--shutter 0.2] [--x264 aq-mode=3] [--out ../out/video.mp4] [--noaudio]
//            --samples N averages N sub-frames per frame over shutter×(1/fps): motion blur + temporal AA;
//            --samples auto picks 4/12/36/108/324 per frame until converged (--tol 3, --max-samples 324)
//   concat:  node scripts/render.mjs concat --inputs a.mp4,b.mp4 --out full.mp4   (lossless video concat + the song's audio)
//   --scale N (all modes): render at N× the 1920x1080 layout (--scale 2 = true 3840x2160)
// Uses the Vite dev server at --url if reachable, else starts a private one (no HMR) in-process.
// Browser: MV_BROWSER=chrome|msedge|chromium or MV_BROWSER_PATH=<exe>; ffmpeg: --ffmpeg, FFMPEG_PATH, ffmpeg-static, PATH.
import { chromium } from 'playwright-core';
import { WebSocketServer } from 'ws';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { once } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const mode = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'stills';
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : d; };
const flag = (k) => argv.includes(`--${k}`);
const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(APP, '..');
const SONG = JSON.parse(fs.readFileSync(path.join(ROOT, 'song.json'), 'utf8'));
const SCALE = Math.max(1, Math.round(+opt('scale', '1')));
const OW = 1920 * SCALE, OH = 1080 * SCALE; // output size
const SAMPLES = opt('samples', '1') === 'auto'
  ? { min: +opt('min-samples', '4'), max: +opt('max-samples', '324'), tol: +opt('tol', '3') }
  : +opt('samples', '1');
const SHUTTER = +opt('shutter', '0.5');
const hist = (h) => Object.entries(h).sort((a, b) => +a[0] - +b[0]).map(([k, v]) => `${k}:${v}`).join(' ');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const require = createRequire(import.meta.url);

function findFfmpeg() {
  const cands = [opt('ffmpeg'), process.env.FFMPEG_PATH];
  try { cands.push(require('ffmpeg-static')); } catch {}
  for (const c of cands) if (c && fs.existsSync(c)) return c;
  const r = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  if (r.status === 0) return 'ffmpeg';
  throw new Error('ffmpeg not found: npm install (ffmpeg-static), or set FFMPEG_PATH, or put ffmpeg on PATH');
}

async function reachable(url) {
  try { const r = await fetch(url, { signal: AbortSignal.timeout(1500) }); return r.ok; } catch { return false; }
}

async function ensureServer() {
  const url = opt('url');
  if (url && (await reachable(url))) return { url, stop: async () => {} };
  // in-process Vite, no live reload: a file saved mid-render must not reload the page
  process.env.MV_NO_HMR = '1';
  const { createServer } = await import('vite');
  const server = await createServer({ root: APP, configFile: path.join(APP, 'vite.config.ts'), logLevel: 'error', server: { port: 5300 + Math.floor(Math.random() * 500), strictPort: false, hmr: false } });
  await server.listen();
  const u = (server.resolvedUrls?.local?.[0] ?? `http://localhost:${server.config.server.port}/`).replace(/\/$/, '');
  return { url: u, stop: () => server.close() };
}

function gpuArgs() {
  const a = ['--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'];
  if (process.platform === 'darwin') a.push('--use-angle=metal');
  else if (process.platform === 'win32') a.push('--use-angle=d3d11');
  else a.push('--use-angle=vulkan', '--enable-features=Vulkan');
  return a;
}

async function launchBrowser() {
  const headless = !flag('headed');
  const args = gpuArgs();
  if (process.env.MV_BROWSER_PATH) return chromium.launch({ executablePath: process.env.MV_BROWSER_PATH, headless, args });
  const order = process.env.MV_BROWSER ? [process.env.MV_BROWSER] : process.platform === 'win32' ? ['chrome', 'msedge', 'chromium'] : ['chrome', 'chromium', 'msedge'];
  let last;
  for (const ch of order) {
    try { return await chromium.launch({ channel: ch === 'chromium' ? undefined : ch, headless, args }); } catch (e) { last = e; }
  }
  throw new Error(`no browser found (tried ${order.join(', ')}): install Chrome, or set MV_BROWSER_PATH\n${last}`);
}

async function openPage(url) {
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  page.on('response', (r) => { if (r.status() >= 400) logs.push(`[http ${r.status()}] ${r.url()}`); });
  const only = opt('only');
  await page.goto(`${url}/?export=1${only ? `&only=${only}` : ''}${SCALE !== 1 ? `&scale=${SCALE}` : ''}`);
  await page.waitForFunction(() => window.__mv?.ready || window.__mv?.error, null, { timeout: 180000 });
  const err = await page.evaluate(() => window.__mv.error);
  if (err) throw new Error(`app failed to boot:\n${err}\n${logs.join('\n')}`);
  const size = await page.evaluate(() => [window.__mv.width ?? 1920, window.__mv.height ?? 1080]);
  if (size[0] !== OW || size[1] !== OH) throw new Error(`app renders ${size[0]}x${size[1]}, expected ${OW}x${OH} (--scale ${SCALE})`);
  const sceneErrors = await page.evaluate(() => window.__mv.errors);
  if (sceneErrors.length) console.error('SCENE ERRORS:\n' + sceneErrors.join('\n'));
  return { browser, page, logs };
}

const tl = (page) => page.evaluate(() => window.__mv.timeline);
const safeName = (s) => String(s).replace(/[^\w.-]+/g, '_');

async function stills(page, list, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const files = [];
  for (const { t, name } of list) {
    const k = await page.evaluate(([t, s, sh]) => window.__mv.still(t, s, sh), [t, SAMPLES, SHUTTER]);
    const f = path.join(outDir, name ?? `f_${t.toFixed(2).padStart(7, '0')}.png`);
    if (typeof SAMPLES !== 'number') console.log(`t=${t}: ${k} sub-frames`);
    // at scale > 1 the canvas is shown downscaled on the page: save the full-res pixel buffer instead
    if (SCALE !== 1) fs.writeFileSync(f, Buffer.from(await page.evaluate(() => window.__mv.png()), 'base64'));
    else await page.screenshot({ path: f, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    files.push(f);
  }
  return files;
}

async function sheet(page, items, cols, out) {
  const dataUrl = await page.evaluate(async ({ items, cols, samples, shutter }) => {
    const P = window.__mv;
    const cw = 480, ch = 270, pad = 4, lab = 18;
    const rows = Math.ceil(items.length / cols);
    const cv = document.createElement('canvas');
    cv.width = cols * (cw + pad) + pad; cv.height = rows * (ch + lab + pad) + pad;
    const c = cv.getContext('2d');
    c.fillStyle = '#222'; c.fillRect(0, 0, cv.width, cv.height);
    const src = document.getElementById('c');
    for (let i = 0; i < items.length; i++) {
      const { t, label } = items[i];
      await P.still(t, samples, shutter);
      const x = pad + (i % cols) * (cw + pad), y = pad + Math.floor(i / cols) * (ch + lab + pad);
      c.drawImage(src, x, y + lab, cw, ch);
      c.fillStyle = '#ddd'; c.font = '13px monospace'; c.fillText(label ?? `${t.toFixed(2)}s`, x + 2, y + 13);
    }
    return cv.toDataURL('image/png');
  }, { items, cols, samples: typeof SAMPLES === 'number' ? SAMPLES : 4, shutter: SHUTTER });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'));
}

function audioPath() {
  const a = path.resolve(ROOT, SONG.audio ?? 'audio/song.mp3');
  if (!fs.existsSync(a)) throw new Error(`audio not found: ${a} (song.json "audio")`);
  return a;
}

async function video(page, from, to, fps, out) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const ffmpeg = findFfmpeg();
  const args = ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${OW}x${OH}`, '-r', String(fps), '-i', 'pipe:0'];
  if (!flag('noaudio')) args.push('-ss', String(from), '-t', String(to - from), '-i', audioPath());
  args.push('-vf', 'vflip', '-c:v', 'libx264', '-preset', opt('preset', 'slow'), '-crf', opt('crf', '16'), '-pix_fmt', 'yuv420p', '-tune', 'grain', '-x264-params', opt('x264', 'aq-mode=3'));
  if (!flag('noaudio')) args.push('-c:a', 'aac', '-b:a', '320k', '-shortest');
  args.push('-movflags', '+faststart', out);
  const ff = spawn(ffmpeg, args, { stdio: ['pipe', 'inherit', 'inherit'] });
  ff.stdin.on('error', (e) => console.error('ffmpeg stdin:', e.message));
  let frames = 0;
  const total = Math.round(to * fps) - Math.round(from * fps);
  const t0 = performance.now();
  const wss = new WebSocketServer({ port: 0, maxPayload: Math.max(64 * 1024 * 1024, OW * OH * 4 + 1024) });
  await once(wss, 'listening');
  wss.on('connection', (ws) => {
    ws.on('message', async (msg, isBinary) => {
      if (!isBinary) return;
      const ok = ff.stdin.write(msg);
      if (!ok) await once(ff.stdin, 'drain');
      frames++;
      ws.send(String(frames)); // ack: the page keeps at most a few frames ahead of ffmpeg (bounded memory at 4K)
      if (frames % 60 === 0 || frames === total) {
        const el = (performance.now() - t0) / 1000;
        process.stdout.write(`\r${frames}/${total} frames  ${(frames / el).toFixed(1)} fps  eta ${((total - frames) / (frames / el)).toFixed(0)}s   `);
      }
    });
  });
  const port = wss.address().port;
  const used = await page.evaluate((o) => window.__mv.stream(o), { from, to, fps, ws: `ws://localhost:${port}`, samples: SAMPLES, shutter: SHUTTER, inflight: 4 });
  while (frames < total) await sleep(20);
  ff.stdin.end();
  const [code] = await once(ff, 'exit');
  wss.close();
  if (code !== 0) throw new Error(`ffmpeg exited with ${code}`);
  console.log(`\nwrote ${out} (${frames} frames in ${((performance.now() - t0) / 1000).toFixed(1)}s)`);
  console.log(`sub-frames per frame (count:frames): ${hist(used)}`);
}

async function concat() {
  const inputs = (opt('inputs') ?? '').split(',').filter(Boolean).map((p) => path.resolve(p));
  const out = path.resolve(opt('out', path.join(ROOT, 'out/video.mp4')));
  if (inputs.length < 1) throw new Error('--inputs a.mp4,b.mp4 required');
  const list = path.join(path.dirname(out), `.concat-${Date.now()}.txt`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(list, inputs.map((p) => `file '${p.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n'));
  const args = ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list];
  const from = +opt('from', '0');
  if (!flag('noaudio')) args.push('-ss', String(from), '-i', audioPath(), '-map', '0:v:0', '-map', '1:a:0', '-c:a', 'aac', '-b:a', '320k', '-shortest');
  args.push('-c:v', 'copy', '-movflags', '+faststart', out);
  const r = spawnSync(findFfmpeg(), args, { stdio: 'inherit' });
  fs.rmSync(list, { force: true });
  if (r.status !== 0) throw new Error('ffmpeg concat failed');
  console.log(`wrote ${out}`);
}

if (mode === 'concat') {
  await concat();
  process.exit(0);
}

const { url, stop } = await ensureServer();
let browser, page, logs = [];
try {
  ({ browser, page, logs } = await openPage(url));
  if (mode === 'gpu') {
    console.log(await page.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return 'NO WEBGL2';
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    }));
  } else if (mode === 'stills') {
    let list;
    if (flag('entries')) {
      const at = +opt('at', '0.5');
      list = (await tl(page)).map((e) => ({ t: e.start + (e.end - e.start) * at, name: `${safeName(e.id)}.png` }));
    } else list = (opt('t') ?? '0').split(',').map(Number).map((t) => ({ t }));
    const files = await stills(page, list, path.resolve(opt('out', path.join(ROOT, 'out/stills'))));
    console.log(files.join('\n'));
  } else if (mode === 'sheet') {
    const from = +opt('from', '0'), to = +opt('to', '10'), n = +opt('n', '12');
    let items = Array.from({ length: n }, (_, i) => ({ t: from + ((to - from) * i) / Math.max(1, n - 1) }));
    if (opt('times')) items = opt('times').split(',').map((t) => ({ t: +t }));
    if (flag('cuts')) items = (await tl(page)).slice(1).flatMap((e) => [e.start - 0.1, e.start - 1 / 60, e.start + 1 / 60, e.start + 0.1].map((t) => ({ t, label: `${t.toFixed(2)}s ${e.id}` })));
    if (flag('entries')) {
      const at = +opt('at', '0.5');
      items = (await tl(page)).map((e) => { const t = e.start + (e.end - e.start) * at; return { t, label: `${e.id} · ${t.toFixed(1)}s` }; });
    }
    const out = path.resolve(opt('out', path.join(ROOT, `out/sheets/sheet_${from}-${to}.png`)));
    await sheet(page, items, +opt('cols', '4'), out);
    console.log(out);
  } else if (mode === 'perf') {
    const from = +opt('from', '0'), to = +opt('to', '5');
    const r = await page.evaluate(async ({ from, to, samples, shutter }) => {
      const P = window.__mv;
      const ms = [];
      const buf = new Uint8Array(P.width * P.height * 4);
      await P.still(from);
      const used = {};
      for (let t = from; t < to; t += 1 / 60) {
        const a = performance.now();
        await P.engine.prepare(t, 1 / 60, shutter);
        const k = P.engine.render(t, 1 / 60, false, samples, shutter);
        used[k] = (used[k] ?? 0) + 1;
        await P.engine.readPixelsAsync(buf);
        ms.push(performance.now() - a);
      }
      ms.sort((a, b) => a - b);
      return { n: ms.length, avg: ms.reduce((a, b) => a + b, 0) / ms.length, p50: ms[ms.length >> 1], p95: ms[Math.floor(ms.length * 0.95)], max: ms[ms.length - 1], used };
    }, { from, to, samples: SAMPLES, shutter: SHUTTER });
    console.log(`frames ${r.n}  avg ${r.avg.toFixed(1)}ms  p50 ${r.p50.toFixed(1)}  p95 ${r.p95.toFixed(1)}  max ${r.max.toFixed(1)}  sub-frames ${hist(r.used)}`);
  } else if (mode === 'lyrics') {
    const dur = await page.evaluate(() => window.__mv.duration);
    const from = +opt('from', '0'), to = +opt('to', String(dur));
    const r = await page.evaluate(([a, b]) => window.__mv.lyricsCheck(a, b), [from, to]);
    console.log(`lyrics on screen while sung: ${r.hits}/${r.total}${r.misses.length ? '  MISSING:' : ''}`);
    for (const m of r.misses.slice(0, 60)) console.log(`  ${m.t.toFixed(2)}s  #${m.gi} ${m.w}`);
    if (r.misses.length) process.exitCode = 2;
  } else if (mode === 'video') {
    const dur = await page.evaluate(() => window.__mv.duration);
    const out = path.resolve(opt('out', path.join(ROOT, 'out/video.mp4')));
    await video(page, +opt('from', '0'), +opt('to', String(dur)), +opt('fps', String(SONG.fps ?? 60)), out);
  } else {
    throw new Error(`unknown mode ${mode}`);
  }
  if (logs.length) console.error('BROWSER LOG:\n' + logs.slice(0, 40).join('\n'));
} finally {
  await browser?.close();
  await stop();
}

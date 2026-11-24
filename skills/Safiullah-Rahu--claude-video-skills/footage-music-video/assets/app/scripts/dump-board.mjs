// Dump the resolved storyboard (shots, chapters, lyric lines with word times, countdown) as JSON:
//   node scripts/dump-board.mjs [--url http://localhost:5330] [--out ../out/board.json]
// Loads the app headless (a private Vite server unless --url is reachable) and reads window.__ev.
import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : d; };
const APP = path.resolve(import.meta.dirname, '..');
const out = path.resolve(APP, opt('out', '../out/board.json'));

async function server() {
  const url = opt('url');
  if (url) { try { const r = await fetch(url); if (r.ok) return { url, stop: async () => {} }; } catch { /* fall through */ } }
  process.env.MV_NO_HMR = '1';
  const { createServer } = await import('vite');
  const s = await createServer({ root: APP, configFile: path.join(APP, 'vite.config.ts'), logLevel: 'error', server: { port: 5800 + Math.floor(Math.random() * 100), strictPort: false, hmr: false } });
  await s.listen();
  return { url: (s.resolvedUrls?.local?.[0] ?? '').replace(/\/$/, ''), stop: () => s.close() };
}

const srv = await server();
let browser;
for (const ch of ['chrome', 'msedge', undefined]) { try { browser = await chromium.launch({ channel: ch, headless: true, args: ['--use-angle=d3d11'] }); break; } catch { /* next */ } }
const page = await browser.newPage();
await page.goto(`${srv.url}/?export=1`);
await page.waitForFunction(() => window.__ev && window.__ev.board, null, { timeout: 120000 });
const data = await page.evaluate(() => {
  const B = window.__ev.board, r = (x) => Math.round(x * 1000) / 1000;
  return {
    duration: r(B.au.duration), bpm: B.au.bpm,
    sections: B.au.sections,
    chapters: [...B.chapters.values()].map((c) => ({ id: c.id, title: c.title, t0: r(c.t0), t1: r(c.t1), ink: c.ink ?? 0, screen: c.screen })),
    shots: B.shots.map((s) => ({ id: s.id, ch: s.ch, t0: r(s.t0), t1: r(s.t1), clip: s.clip ?? null, ground: s.ground, transition: s.transition, cv: s.cv, note: s.note })),
    lines: B.lineTypes.map((lt) => ({ i: lt.line.i, ch: lt.ch, mode: lt.mode ?? 'block', text: lt.line.text, start: r(lt.line.start), end: r(lt.line.end), showAt: r(lt.showAt), hideAt: r(lt.hideAt),
      words: lt.line.words.map((w) => [w.w, r(w.start), r(w.end)]) })),
    countdown: B.countdown.map(([t, rows]) => ({ t: r(t), rows })),
    looks: B.looks.map(([t, n]) => ({ t: r(t), look: n })),
    errors: B.errors,
  };
});
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(data, null, 1));
console.log(`${out}: ${data.shots.length} shots, ${data.lines.length} lines, ${data.chapters.length} chapters, ${data.errors.length} errors`);
await browser.close();
await srv.stop();

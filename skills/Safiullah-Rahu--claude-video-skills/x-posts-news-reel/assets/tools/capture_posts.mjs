// Capture X/Twitter posts as clean, real screenshots via the public embed (no login), plus the post JSON.
//
//   node tools/capture_posts.mjs <urls.txt> <out_dir> [--theme dark|light] [--width 440] [--scale 3] [--tz America/New_York] [--only 3,7]
//
// For every URL (x.com/<handle>/status/<id>, share suffixes are ignored) it writes
//   <out>/raw/<NN>_<id>.json   the syndication JSON (text, user, media, created_at, quoted post)
//   <out>/<NN>_<handle>.png    the embed card as the platform renders it, element-cropped, DPR 3
//   <out>/capture_log.json     per post: ok / error, png size, embed height
// An embed that renders nothing (deleted, protected, age-gated, withheld) is logged as an error, never faked.
// Browser: installed Edge (channel msedge), playwright-core from the explainer engine.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ENGINE = process.env.EXPLAINER_ENGINE || path.join(os.homedir(), '.claude/skills/explainer-engine/engine');
const require = createRequire(path.join(ENGINE, 'package.json'));
const { chromium } = require('playwright-core');

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const [urlsFile, outDir] = argv.filter((a, i) => !a.startsWith('--') && !(argv[i - 1] || '').startsWith('--'));
if (!urlsFile || !outDir) { console.error('usage: node capture_posts.mjs <urls.txt> <out_dir> [--theme dark] [--width 440] [--scale 3] [--only 1,2]'); process.exit(2); }
const THEME = opt('theme', 'dark'), WIDTH = +opt('width', 440), SCALE = +opt('scale', 3);  // 440 css px x3: the text lands ~50 px tall on a 980 px card
const TZ = opt('tz', 'America/New_York');  // the embed prints the post time in the viewer's zone: show the audience's
const ONLY = opt('only', '') ? opt('only').split(',').map(Number) : null;

const urls = fs.readFileSync(urlsFile, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith('#'));
fs.mkdirSync(path.join(outDir, 'raw'), { recursive: true });
const parse = u => { const m = u.match(/(?:x|twitter)\.com\/([^/]+)\/status\/(\d+)/); return m ? { handle: m[1], id: m[2] } : null; };

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await browser.newContext({ viewport: { width: WIDTH, height: 1600 }  /* the embed fills the viewport width */, deviceScaleFactor: SCALE, locale: 'en-US', timezoneId: TZ,
  colorScheme: THEME === 'dark' ? 'dark' : 'light' });
const log = [];
for (let i = 0; i < urls.length; i++) {
  const n = i + 1, nn = String(n).padStart(2, '0');
  if (ONLY && !ONLY.includes(n)) continue;
  const p = parse(urls[i]);
  if (!p) { log.push({ n, url: urls[i], ok: false, error: 'not a status URL' }); continue; }
  const rec = { n, url: `https://x.com/${p.handle}/status/${p.id}`, id: p.id, handle: p.handle };
  try {
    const r = await fetch(`https://cdn.syndication.twimg.com/tweet-result?id=${p.id}&token=x&lang=en`);
    const body = await r.text();
    fs.writeFileSync(path.join(outDir, 'raw', `${nn}_${p.id}.json`), body);
    rec.json_status = r.status;
    try { const j = JSON.parse(body); rec.typename = j.__typename; if (j.user) rec.handle = j.user.screen_name; } catch { rec.typename = 'unparsable'; }
  } catch (e) { rec.json_error = String(e); }

  const page = await ctx.newPage();
  try {
    await page.goto(`https://platform.twitter.com/embed/Tweet.html?id=${p.id}&theme=${THEME}&dnt=true&lang=en&width=${WIDTH}`,
      { waitUntil: 'networkidle', timeout: 45000 });
    const card = page.locator('article').first();
    await card.waitFor({ state: 'visible', timeout: 20000 });
    // let avatars / media / fonts finish (the embed lazy-loads photos)
    await page.waitForFunction(() => [...document.images].every(im => im.complete && im.naturalWidth > 0), null, { timeout: 15000 }).catch(() => {});
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(600);
    // the card's own rounded box (article's bordered parent), so corners are not cut
    const box = await page.evaluate(() => {
      const a = document.querySelector('article');
      let el = a;
      for (let k = 0; k < 4 && el.parentElement; k++) {
        const cs = getComputedStyle(el.parentElement);
        if (parseFloat(cs.borderTopWidth) > 0 || cs.borderRadius !== '0px') { el = el.parentElement; break; }
        el = el.parentElement;
        if (el.getBoundingClientRect().width > a.getBoundingClientRect().width + 4) { el = a; break; }
      }
      const b = el.getBoundingClientRect();
      return { x: b.x, y: b.y, width: b.width, height: b.height, text: a.innerText.slice(0, 400) };
    });
    const file = path.join(outDir, `${nn}_${rec.handle}.png`);
    await page.screenshot({ path: file, clip: { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.ceil(box.width), height: Math.ceil(box.height) }, omitBackground: false });
    Object.assign(rec, { ok: true, png: path.basename(file), css_w: Math.round(box.width), css_h: Math.round(box.height), embed_text: box.text });
  } catch (e) {
    const t = await page.evaluate(() => document.body ? document.body.innerText.slice(0, 300) : '').catch(() => '');
    Object.assign(rec, { ok: false, error: String(e).split('\n')[0], page_text: t });
  }
  await page.close();
  log.push(rec);
  console.log(nn, rec.handle, rec.ok ? `ok ${rec.css_w}x${rec.css_h}` : `FAIL ${rec.error}`);
}
await browser.close();
fs.writeFileSync(path.join(outDir, 'capture_log.json'), JSON.stringify(log, null, 1));

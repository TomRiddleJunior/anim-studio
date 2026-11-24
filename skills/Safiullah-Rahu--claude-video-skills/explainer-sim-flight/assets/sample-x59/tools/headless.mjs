// Drive scratch/test.html in headless Edge (not throttled like a hidden pane): node headless.mjs "<js expr returning a promise>"
import { createRequire } from "node:module";
const require = createRequire((process.env.EXPLAINER_ENGINE || "engine") + "/package.json"); // engine dir with playwright-core
const { chromium } = require("playwright-core");
const expr = process.argv[2];
const url = process.argv[3] || "http://127.0.0.1:8732/scratch/test.html?h=1";
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--headless=new", "--use-gl=angle", "--use-angle=d3d11", "--enable-webgl", "--ignore-gpu-blocklist", "--enable-gpu-rasterization"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
page.on("pageerror", (e) => console.log("pageerror", e.message));
await page.goto(url);
await page.waitForFunction(() => window.FILM, null, { timeout: 60000 });
const t0 = Date.now();
const r = await page.evaluate(`(async () => { ${expr} })()`);
console.log("result", JSON.stringify(r), ((Date.now() - t0) / 1000).toFixed(1) + "s");
await browser.close();

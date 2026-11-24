// Prints every scene's start and mid time (for snapshots): node tools/scenes.cjs [--mids]
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..");
const stubCtx = new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true });
const ctx = { window: {}, console, document: { createElement: () => ({ getContext: () => stubCtx }) } };
vm.createContext(ctx);
for (const f of ["assets/lib/film-vo.js", "assets/lib/film-v.js", "assets/lib/scifi-kit.js", "assets/lib/demo-film.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx);
const V = ctx.window.MAKE_V();
const F = ctx.window.ONEYEAR({ getContext: () => stubCtx }, V);
const t0 = F.scenes.map((s) => s.t0);
const mids = t0.map((t, i) => +(((t + (i + 1 < t0.length ? t0[i + 1] : V.dur)) / 2).toFixed(2)));
if (process.argv.includes("--mids")) console.log(mids.join(","));
else t0.forEach((t, i) => console.log(i, t.toFixed(2), mids[i], F.scenes[i].xf ? "xf" : "cut"));

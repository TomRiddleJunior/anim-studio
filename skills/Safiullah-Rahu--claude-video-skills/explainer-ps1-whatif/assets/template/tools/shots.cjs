// Prints every shot's start and a mid time (for snapshots): node tools/shots.js [film.js] [--mids]
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..");
const film = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "assets/lib/demo-film.js";
const ctx = { window: {}, console };
vm.createContext(ctx);
for (const f of ["assets/lib/film-vo.js", "assets/lib/film-v.js", film]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx);
const V = ctx.window.MAKE_V();
const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, u) => a + (b - a) * u, smooth = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
const F = ctx.window.FILM({ T: {}, clamp, lerp, smooth }, { cast: {} }, V);
const t0 = F.shots.map((s) => s.t0);
const mids = t0.map((t, i) => +(((t + (i + 1 < t0.length ? t0[i + 1] : V.dur)) / 2).toFixed(2)));
if (process.argv.includes("--mids")) console.log(mids.join(","));
else t0.forEach((t, i) => console.log(i, t.toFixed(2), mids[i]));

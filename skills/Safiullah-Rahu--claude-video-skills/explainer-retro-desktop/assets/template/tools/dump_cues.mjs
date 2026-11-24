// Loads the film in node (no canvas: the film builds its SFX cue list and shot table before it draws anything) and writes
// score/cues.json (for tools/sound_design.py) and score/shots.json (for tools/snap.py and the QA).
// usage: node tools/dump_cues.mjs
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ctx = { window: {}, document: { createElement: () => ({ getContext: () => ({}) }) }, console };
vm.createContext(ctx);
for (const f of ["retro-kit.js", "vo-data.js", "hash-data.js", "film.js"]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, "assets", "lib", f), "utf8"), ctx, { filename: f });
}
const film = ctx.window.FILM_CREATE({ getContext: () => ({}) });
fs.mkdirSync(path.join(ROOT, "score"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "score", "cues.json"), JSON.stringify({ dur: ctx.window.VO.dur, cues: film.cues, music: film.music || null }, null, 1));
fs.writeFileSync(path.join(ROOT, "score", "shots.json"), JSON.stringify({ dur: ctx.window.VO.dur, shots: film.shots }, null, 1));
const kinds = {};
for (const c of film.cues) kinds[c.kind] = (kinds[c.kind] || 0) + 1;
console.log(film.cues.length, "cues", JSON.stringify(kinds), "|", film.shots.length, "shots");

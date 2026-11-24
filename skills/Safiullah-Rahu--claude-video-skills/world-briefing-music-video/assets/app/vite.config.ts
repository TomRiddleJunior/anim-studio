import { defineConfig, type Plugin } from 'vite';
import path from 'node:path';
import fs from 'node:fs';

// The project root (one level up) holds audio/, data/, song.json and style.json.
const ROOT = path.resolve(import.meta.dirname, '..');

const MIME: Record<string, string> = {
  '.json': 'application/json', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.aac': 'audio/aac',
  '.flac': 'audio/flac', '.ogg': 'audio/ogg', '.opus': 'audio/ogg', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4',
};

/** Serve <root>/audio|data|assets|media/* at /audio/* … (with Range support so the preview can seek). No symlinks needed.
 *  media/ holds generated footage (frame sequences, plates, depth maps, tracks: the ai-music-video skill's conform step). */
function serveProjectRoot(dirs = ['audio', 'data', 'assets', 'media']): Plugin {
  return {
    name: 'serve-project-root',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url ?? '').split('?')[0]!);
        const m = /^\/([^/]+)\/(.+)$/.exec(url);
        if (!m || !dirs.includes(m[1]!)) return next();
        const base = path.join(ROOT, m[1]!), file = path.join(base, m[2]!);
        if (!file.startsWith(base) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return next();
        const size = fs.statSync(file).size;
        res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Accept-Ranges', 'bytes');
        const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? '');
        if (range) {
          const a = range[1] ? +range[1] : 0, b = range[2] ? Math.min(+range[2], size - 1) : size - 1;
          res.statusCode = 206;
          res.setHeader('Content-Range', `bytes ${a}-${b}/${size}`);
          res.setHeader('Content-Length', String(b - a + 1));
          fs.createReadStream(file, { start: a, end: b }).pipe(res);
        } else {
          res.setHeader('Content-Length', String(size));
          fs.createReadStream(file).pipe(res);
        }
      });
    },
  };
}

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [serveProjectRoot()],
  // MV_NO_HMR=1: no live reload (export renders must not reload mid-run when a file changes)
  server: { port: 5173, strictPort: false, hmr: process.env.MV_NO_HMR ? false : undefined, fs: { allow: [ROOT] } },
  resolve: { alias: { '@root': ROOT } },
  build: { target: 'esnext', assetsInlineLimit: 0 },
});

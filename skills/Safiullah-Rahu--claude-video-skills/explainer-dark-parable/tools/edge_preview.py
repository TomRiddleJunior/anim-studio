"""Headless-Edge preview of a dark-parable film, without the render lock (it draws the Canvas2D film in a page; it is not a
hyperframes render). Works while the Browser pane is hidden or busy.
  python -X utf8 -I tools/edge_preview.py sheet 0.1,2.5,5.0 scratch/sheet.png [cols=5]   labelled stills (captions in Arial)
  python -X utf8 -I tools/edge_preview.py times                                         mid-shot times, comma-separated
  python -X utf8 -I tools/edge_preview.py probe                                         the analyzer's scene-change rule
     on the canvas film (64-bin histograms of 160x90 frames at 6 fps; distance between frames 1 s apart >= 0.28, peaks
     >= 1.5 s apart) + motion (mean abs grey diff at 6 fps) + brightness; prints JSON and writes scratch/probe.json
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
LIB = os.path.join(ROOT, "assets", "lib")
JS = r"""
const VOD = window.DP_VO;
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, "").replace(/'/g, "");
const V = { duration: VOD.duration,
  L(id) { const l = VOD.lines[id]; if (!l) throw new Error("no line " + id); return l; },
  w(id, word, k) { const h = VOD.lines[id].words.filter((x) => norm(x[0]).startsWith(norm(word))); if (!h.length) throw new Error("no word " + id + ":" + word); return h[Math.min(k || 0, h.length - 1)][1]; },
  we(id, word, k) { const h = VOD.lines[id].words.filter((x) => norm(x[0]).startsWith(norm(word))); if (!h.length) throw new Error("no word " + id + ":" + word); return h[Math.min(k || 0, h.length - 1)][2]; } };
const fc = document.createElement('canvas'); fc.width = 1080; fc.height = 1920;
const K = DP.create({ canvas: fc, width: 1080, height: 1920 });
const film = DP_FILM(K, V); K.play(film.shots);
const words = []; for (const id in VOD.lines) for (const w of VOD.lines[id].words) words.push(w);
function capAt(t) { let c = null; for (const w of words) if (w[1] - 0.03 <= t) c = w; return c ? c[0] : ""; }
function frame(t, cap) { K.render(t); const c = fc.getContext('2d'); c.setTransform(1,0,0,1,0,0); if (cap) { c.font = '700 44px Arial'; c.textAlign = 'center'; c.fillStyle = '#f3f1ec'; c.shadowColor = 'rgba(0,0,0,.85)'; c.shadowBlur = 8; c.fillText(capAt(t), 540, 900); c.shadowBlur = 0; } return fc; }
function sheet(ts, cols, tw) {
  const th = tw * 1920 / 1080, rows = Math.ceil(ts.length / cols), cv = document.getElementById('v');
  cv.width = cols * (tw + 6); cv.height = rows * (th + 30); const v = cv.getContext('2d'); v.fillStyle = '#333'; v.fillRect(0, 0, cv.width, cv.height);
  ts.forEach((t, i) => { const x = (i % cols) * (tw + 6), y = Math.floor(i / cols) * (th + 30); frame(t, true); v.drawImage(fc, x, y + 28, tw, th); v.fillStyle = '#ffe070'; v.font = 'bold 22px Arial'; v.fillText(t.toFixed(2) + 's', x + 6, y + 22); });
}
function probe(fps, thr) {
  const sc = document.createElement('canvas'); sc.width = 160; sc.height = 90; const sx = sc.getContext('2d', { willReadFrequently: true });
  sx.imageSmoothingEnabled = true; sx.imageSmoothingQuality = 'high';
  const H = [], diffs = [], br = []; let prev = null; const T1 = VOD.duration;
  for (let i = 0; i / fps < T1; i++) {
    frame(i / fps, false); sx.drawImage(fc, 0, 0, 160, 90); const d = sx.getImageData(0, 0, 160, 90).data;
    const h = new Float32Array(64), g = new Float32Array(14400); let bsum = 0;
    for (let p = 0, q = 0; p < d.length; p += 4, q++) { h[(d[p] >> 6) * 16 + (d[p + 1] >> 6) * 4 + (d[p + 2] >> 6)]++; g[q] = d[p] * 0.299 + d[p + 1] * 0.587 + d[p + 2] * 0.114; bsum += Math.max(d[p], d[p + 1], d[p + 2]) / 255; }
    for (let k = 0; k < 64; k++) h[k] /= 14400; H.push(h); br.push(bsum / 14400);
    if (prev) { let s = 0; for (let q = 0; q < 14400; q++) s += Math.abs(g[q] - prev[q]); diffs.push(s / 14400); } else diffs.push(0);
    prev = g;
  }
  const D = []; for (let i = 0; i + fps < H.length; i++) { let s = 0; for (let k = 0; k < 64; k++) s += Math.abs(H[i + fps][k] - H[i][k]); D.push(0.5 * s); }
  const ev = []; let last = -9; for (let i = 1; i < D.length - 1; i++) { const t = (i + fps / 2) / fps; if (D[i] >= thr && D[i] >= D[i - 1] && D[i] >= D[i + 1] && t - last >= 1.5) { ev.push([+t.toFixed(2), +D[i].toFixed(2)]); last = t; } }
  const near = []; for (let i = 1; i < D.length - 1; i++) if (D[i] >= 0.15 && D[i] >= D[i - 1] && D[i] >= D[i + 1]) near.push([+((i + fps / 2) / fps).toFixed(2), +D[i].toFixed(2)]);
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  return { duration: T1, events: ev, per_min: +(ev.length / T1 * 60).toFixed(2), peaks_over_015: near, motion: +mean(diffs).toFixed(2), brightness: +mean(br).toFixed(3) };
}
"""


def page(tail):
    parts = []
    for f in ("kit.js", "vo-data.js", "film.js"):
        parts.append("<script>\n" + open(os.path.join(LIB, f), encoding="utf-8").read() + "\n</script>")
    return ("<!doctype html><html><head><meta charset='utf-8'><style>html,body{margin:0;background:#333}</style></head><body>"
            "<canvas id='v'></canvas><pre id='out'></pre>" + "".join(parts) + "<script>" + JS + "\ntry {" + tail + "} catch (e) { document.getElementById('out').textContent = 'ERR ' + e.message + ' ' + e.stack; }</script></body></html>")


def run_edge(html, args):
    tmp = tempfile.mkdtemp(prefix="dpe_", dir=r"C:\Temp" if os.path.isdir(r"C:\Temp") else None)
    src = os.path.join(tmp, "p.html")
    open(src, "w", encoding="utf-8").write(html)
    url = "file:///" + src.replace("\\", "/")
    cmd = [EDGE, "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
           "--user-data-dir=" + os.path.join(tmp, "prof"), "--virtual-time-budget=600000"] + args + [url]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=900)
    return tmp, r


def main():
    mode = sys.argv[1]
    if mode == "sheet":
        ts = [float(x) for x in sys.argv[2].split(",")]
        out = os.path.abspath(sys.argv[3])
        cols = int(sys.argv[4]) if len(sys.argv) > 4 else min(5, len(ts))
        tw = 360
        rows = (len(ts) + cols - 1) // cols
        Wd, Hd = cols * (tw + 6), int(rows * (tw * 1920 / 1080 + 30))
        tmp, r = run_edge(page(f"sheet({json.dumps(ts)}, {cols}, {tw});"), [f"--window-size={Wd},{Hd}", "--screenshot=" + os.path.join(tmp_dir := tempfile.gettempdir(), "dpe_shot.png")])
        shot = os.path.join(tmp_dir, "dpe_shot.png")
        if not os.path.exists(shot):
            print(r.stdout[-1500:], r.stderr[-1500:])
            raise SystemExit("no screenshot")
        os.makedirs(os.path.dirname(out), exist_ok=True)
        shutil.move(shot, out)
        print(out)
    elif mode == "times":  # mid-shot times (one still per shot, for snap.py)
        tmp, r = run_edge(page("const T = film.T, ks = Object.keys(T).sort((a, b) => T[a] - T[b]); document.getElementById('out').textContent = JSON.stringify(ks.map((k, i) => [k, +(((T[k] + (i + 1 < ks.length ? T[ks[i + 1]] : VOD.duration)) / 2).toFixed(2))]));"), ["--dump-dom"])
        m = re.search(r"<pre id=\"out\">(.*?)</pre>", r.stdout, re.S)
        j = json.loads(m.group(1).replace("&quot;", '"'))
        print(",".join(str(t) for _, t in j))
        print(" ".join(f"{k}@{t}" for k, t in j), file=sys.stderr)
    elif mode == "probe":
        tmp, r = run_edge(page("document.getElementById('out').textContent = JSON.stringify(probe(6, 0.28));"), ["--dump-dom"])
        m = re.search(r"<pre id=\"out\">(.*?)</pre>", r.stdout, re.S)
        txt = m.group(1) if m else r.stdout[-2000:] + r.stderr[-2000:]
        if txt.startswith("{"):
            j = json.loads(txt.replace("&quot;", '"'))
            json.dump(j, open(os.path.join(ROOT, "scratch", "probe.json"), "w"), indent=1)
            print(json.dumps({k: j[k] for k in ("duration", "events", "per_min", "motion", "brightness")}))
            print("peaks >= 0.15:", j["peaks_over_015"])
        else:
            print(txt)
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()

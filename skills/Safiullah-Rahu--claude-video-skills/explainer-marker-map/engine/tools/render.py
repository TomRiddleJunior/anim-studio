"""Render a map film through headless Edge (Playwright): every frame is a pure function of t, so the page is seeked to
t, renders its motion-blur subframes into one canvas, and the canvas is grabbed once.

  python -I engine/tools/render.py <slug> --fmt 16x9 --stills 1.4,9.9,20.1      PNGs in <slug>/out/qa/
  python -I engine/tools/render.py <slug> --fmt 9x16 --sheet 24                 contact sheet (labelled with t + word)
  python -I engine/tools/render.py <slug> --fmt 16x9 --beats                    a sheet at every cue/event time
  python -I engine/tools/render.py <slug> --fmt 16x9 --crop 12.3:600,200,960,540    full-size crop
  python -I engine/tools/render.py <slug> --fmt 16x9 --video [--workers 3]      out/<slug>_16x9.mp4 (muxes audio/final.wav)
  python -I engine/tools/render.py <slug> --cues                                 write audio/cues.json (sfx list) and print it

Options: --samples N (fixed motion-blur samples, for quick looks), --range a,b (seconds, video only).
Hold the lock around full renders:  mkdir "map-films/.render-lock" … rmdir  (see README).
"""
import argparse
import base64
import json
import math
import multiprocessing as mp
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mfcommon import FFMPEG, film_dir, launch, open_film, page_url, serve  # noqa: E402

SIZES = {"16x9": (1920, 1080), "9x16": (1080, 1920)}


def grab(page, t, samples=None):
    o = {"samples": samples} if samples else {}
    r = page.evaluate("([t, o]) => { const r = __mf.frame(t, o); return {r, d: __mf.grab('image/png')}; }", [t, o])
    return base64.b64decode(r["d"].split(",", 1)[1]), r["r"]


def word_at(info, t):
    for w in info["words"]:
        if w["start"] <= t < w["end"] + 0.12:
            return w["w"]
    return ""


def sheet(images, labels, cols, out, thumb_w):
    from PIL import Image, ImageDraw, ImageFont
    ims = [Image.open(p) for p in images]
    w0, h0 = ims[0].size
    tw = thumb_w
    th = round(h0 * tw / w0)
    rows = math.ceil(len(ims) / cols)
    S = Image.new("RGB", (cols * tw + (cols + 1) * 8, rows * (th + 30) + 8), (22, 22, 22))
    d = ImageDraw.Draw(S)
    try:
        f = ImageFont.truetype("arial.ttf", 18)
    except Exception:
        f = ImageFont.load_default()
    for i, (im, lab) in enumerate(zip(ims, labels)):
        r, c = divmod(i, cols)
        x, y = 8 + c * (tw + 8), 8 + r * (th + 30)
        S.paste(im.convert("RGB").resize((tw, th), Image.LANCZOS), (x, y + 24))
        d.text((x + 2, y + 2), lab, fill=(235, 235, 235), font=f)
    S.save(out, quality=88)
    return out


def worker(args):
    slug, fmt, i0, i1, seg, samples, wid = args
    from playwright.sync_api import sync_playwright
    W, H = SIZES[fmt]
    cmd = [str(FFMPEG), "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", "30", "-c:v", "png", "-i", "-",
           "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-pix_fmt", "yuv420p", "-profile:v", "high",
           "-g", "60", "-bf", "2", "-r", "30", str(seg)]
    ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    t_start = time.time()
    stats = {"n": 0, "samples": 0}
    with serve() as base, sync_playwright() as p:
        browser, page, logs = launch(p, W, H)
        open_film(page, page_url(base, slug, fmt), logs)
        for i in range(i0, i1):
            png, r = grab(page, i / 30, samples)
            ff.stdin.write(png)
            stats["n"] += 1
            stats["samples"] += r["samples"]
            if wid == 0 and (i - i0) % 60 == 0:
                el = time.time() - t_start
                print(f"  [w0] frame {i - i0}/{i1 - i0}  {el / max(1, i - i0 + 1):.2f} s/frame", flush=True)
        browser.close()
    ff.stdin.close()
    ff.wait()
    return stats


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--fmt", default="16x9", choices=list(SIZES))
    ap.add_argument("--stills")
    ap.add_argument("--sheet", type=int)
    ap.add_argument("--beats", action="store_true")
    ap.add_argument("--crop", action="append")
    ap.add_argument("--video", action="store_true")
    ap.add_argument("--cues", action="store_true")
    ap.add_argument("--workers", type=int, default=3)
    ap.add_argument("--samples", type=int)
    ap.add_argument("--range")
    ap.add_argument("--tag", default="")
    a = ap.parse_args()
    root = film_dir(a.slug)
    qa = root / "out" / "qa"
    qa.mkdir(parents=True, exist_ok=True)
    W, H = SIZES[a.fmt]

    if a.video:
        from playwright.sync_api import sync_playwright
        with serve() as base, sync_playwright() as p:
            browser, page, logs = launch(p, W, H)
            info = open_film(page, page_url(base, a.slug, a.fmt), logs)
            browser.close()
        if info["stub"]:
            print("note: rendering with STUB timings (no voice yet)")
        n = int(math.ceil(info["duration"] * 30))
        i0, i1 = 0, n
        if a.range:
            r0, r1 = (float(x) for x in a.range.split(","))
            i0, i1 = int(r0 * 30), min(n, int(r1 * 30))
        k = max(1, a.workers)
        bounds = [i0 + (i1 - i0) * j // k for j in range(k + 1)]
        tmp = root / "out" / "tmp"
        tmp.mkdir(exist_ok=True)
        segs = [tmp / f"{a.fmt}_seg{j}.mp4" for j in range(k)]
        t0 = time.time()
        print(f"rendering {a.slug} {a.fmt}: frames {i0}-{i1} ({(i1 - i0) / 30:.2f} s) on {k} workers")
        with mp.get_context("spawn").Pool(k) as pool:
            stats = pool.map(worker, [(a.slug, a.fmt, bounds[j], bounds[j + 1], segs[j], a.samples, j) for j in range(k)])
        lst = tmp / f"{a.fmt}_list.txt"
        lst.write_text("".join(f"file '{s.as_posix()}'\n" for s in segs), encoding="utf-8")
        video = root / "out" / f"{a.slug}_{a.fmt}{a.tag}_video.mp4"
        subprocess.run([str(FFMPEG), "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(video)], check=True)
        nf = sum(s["n"] for s in stats)
        print(f"video {video.name}: {nf} frames in {time.time() - t0:.0f} s, mean {sum(s['samples'] for s in stats) / max(1, nf):.1f} blur samples")
        audio = root / "audio" / "final.wav"
        if audio.exists() and not a.range:
            final = root / "out" / f"{a.slug}_{a.fmt}{a.tag}.mp4"
            subprocess.run([str(FFMPEG), "-y", "-loglevel", "error", "-i", str(video), "-i", str(audio), "-map", "0:v", "-map", "1:a",
                            "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-shortest", "-movflags", "+faststart", str(final)], check=True)
            print("final", final)
            video.unlink(missing_ok=True)   # the video-only intermediate
        for s in segs:
            s.unlink(missing_ok=True)
        return

    from playwright.sync_api import sync_playwright
    with serve() as base, sync_playwright() as p:
        browser, page, logs = launch(p, W, H)
        info = open_film(page, page_url(base, a.slug, a.fmt), logs)
        dur = info["duration"]
        print(f"{a.slug} {a.fmt}: {dur:.2f} s{' (STUB timings)' if info['stub'] else ''}, webgl accumulation: {info['webgl']}, {len(info['cues'])} cues")
        if a.cues:
            (root / "audio").mkdir(exist_ok=True)
            (root / "audio" / "cues.json").write_text(json.dumps({"duration": dur, "cues": info["cues"]}, indent=1), encoding="utf-8")
            for c in info["cues"]:
                print(f"  {c['t']:7.3f}  {c['type']:<11s} {c.get('dur', '')}")
        times = []
        if a.stills:
            times = [float(x) for x in a.stills.split(",")]
        if a.sheet:
            times = [round(dur * (i + 0.5) / a.sheet, 3) for i in range(a.sheet)]
        if a.beats:
            times = sorted({round(min(dur - 0.05, c["t"] + 0.35), 2) for c in info["cues"]})
        paths, labels = [], []
        t_all = time.time()
        for t in times:
            t1 = time.time()
            png, r = grab(page, t, a.samples)
            pth = qa / f"{a.fmt}_{t:06.2f}.png"
            pth.write_bytes(png)
            paths.append(pth)
            labels.append(f"{t:5.2f}s  Z{r['Z']:.2f}  n{r['samples']}  {word_at(info, t)}")
            print(f"  t={t:6.2f}  Z={r['Z']:6.2f}  samples={r['samples']:2d}  disp={r['disp']:6.1f}px  {time.time() - t1:5.2f}s  {word_at(info, t)}")
        if times:
            print(f"{len(times)} frames in {time.time() - t_all:.1f} s")
        if (a.sheet or a.beats) and paths:
            cols = 6 if a.fmt == "16x9" else 8
            out = qa / f"sheet_{a.fmt}{'_beats' if a.beats else ''}{a.tag}.jpg"
            sheet(paths, labels, cols, out, 400 if a.fmt == "16x9" else 240)
            print("sheet", out)
        for c in a.crop or []:
            t, box = c.split(":")
            x, y, w, h = (int(v) for v in box.split(","))
            png, r = grab(page, float(t), a.samples)
            from io import BytesIO
            from PIL import Image
            im = Image.open(BytesIO(png)).crop((x, y, x + w, y + h))
            out = qa / f"crop_{a.fmt}_{float(t):06.2f}_{x}_{y}.png"
            im.save(out)
            print("crop", out)
        errs = [l for l in logs if "error" in l.lower()]
        if errs:
            print("\n".join(errs[-10:]))
        browser.close()


if __name__ == "__main__":
    main()

"""Royalty-free / public-domain footage library for the ESCAPE VELOCITY remake.

  python tools/footage.py search <source> "<query>" [--n 12]
      sources: mixkit | pixabay | coverr | nasa | archive | openverse  -> JSON lines: {source, id, title, page, url, license}
  python tools/footage.py add <set> <url> --source S --license L [--page P] [--author A] [--title T] [--start s --end s]
      downloads into footage/raw/<set>/, probes it, writes a 6-frame strip <slug>.jpg, appends footage/raw/<set>/manifest.jsonl
  python tools/footage.py peek <source> <url>   six frames of a remote clip (low-res variant) -> footage/_peek/<id>.jpg (look BEFORE adding)
  python tools/footage.py sheet <set>          contact sheet of every clip in a set -> footage/raw/<set>/_sheet.jpg
  python tools/footage.py list [<set>]         what the manifests hold (rejected clips hidden)
  python tools/footage.py reject <file> --reason R   drop a clip from the library (logged in the set's rejects.jsonl)

Allowed licences (all royalty-free; attribution kept in the manifest anyway):
  Mixkit Stock Video Free License · Pixabay Content License · Coverr License ·
  NASA media (public domain; no NASA insignia as endorsement) · Public Domain / CC0 (Internet Archive, Openverse)
"""
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIB = ROOT / "footage"
RAW = LIB / "raw"
FF = os.environ.get("FFMPEG_PATH") or r"ffmpeg-bin\node_modules\ffmpeg-static\ffmpeg.exe"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0 Safari/537.36"
LICENSES = {
    "mixkit": "Mixkit Stock Video Free License (no attribution required)",
    "pixabay": "Pixabay Content License (no attribution required)",
    "coverr": "Coverr License (free, no attribution required)",
    "nasa": "NASA media - public domain (no endorsement implied)",
    "archive": "Public Domain (Internet Archive)",
    "openverse": "CC0 / Public Domain Mark (Openverse)",
}
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
except Exception:
    pass


MAX_WIN = 14.0  # seconds of each clip kept (a shot rarely holds longer; ping-pong covers the rest)


def fetch(url, binary=False, timeout=60, headers=None):
    """GET through curl (some hosts reject Python's TLS fingerprint)."""
    cmd = ["curl", "-sSL", "--fail", "--retry", "2", "--max-time", str(timeout), "-A", UA]
    for k, v in (headers or {}).items():
        cmd += ["-H", f"{k}: {v}"]
    r = subprocess.run(cmd + [url], capture_output=True)
    if r.returncode:
        raise RuntimeError(f"fetch failed ({r.returncode}) {url}: {r.stderr.decode('utf-8', 'ignore')[-200:]}")
    return r.stdout if binary else r.stdout.decode("utf-8", "ignore")


def slugify(s, n=48):
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s[:n] or "clip"


def mixkit_license(vid):
    """Mixkit licenses clips individually: data-license="videoFree" (Mixkit Free License) or "videoRestricted"
    (Mixkit Restricted License: the free download is for personal use only). Returns the data-license value or None."""
    try:
        h = fetch(f"https://mixkit.co/free-stock-video/x-{vid}/")
    except Exception:  # noqa: BLE001
        return None
    m = re.search(r'data-license="([a-zA-Z]+)"', h)
    return m.group(1) if m else None


# ------------------------------------------------------------------------------------------------ search adapters
def s_mixkit(q, n):
    slug = slugify(q).replace("--", "-")
    out, seen = [], set()
    for url in (f"https://mixkit.co/free-stock-video/{slug}/", f"https://mixkit.co/free-stock-video/discover/{slug}/"):
        try:
            h = fetch(url)
        except Exception:  # noqa: BLE001
            continue
        for m in re.finditer(r'href="(/free-stock-video/([a-z0-9-]+)-(\d+)/)"', h):
            path, title_slug, vid = m.group(1), m.group(2), m.group(3)
            if vid in seen:
                continue
            seen.add(vid)
            if mixkit_license(vid) != "videoFree":  # skip Restricted (personal-use-only) and unknown clips
                continue
            out.append({"source": "mixkit", "id": vid, "title": title_slug.replace("-", " "), "page": "https://mixkit.co" + path,
                        "url": f"https://assets.mixkit.co/videos/{vid}/{vid}-1080.mp4", "license": LICENSES["mixkit"]})
            if len(out) >= n:
                return out
    return out


def s_pixabay(q, n):
    h = fetch("https://pixabay.com/videos/search/" + urllib.parse.quote(q) + "/")
    d = urllib.parse.unquote(urllib.parse.unquote(h))
    pages = re.findall(r'href="/videos/([a-z0-9-]+)-(\d+)/"', h)
    vids = {}
    for m in re.finditer(r"https://cdn\.pixabay\.com/video/(\d{4}/\d{2}/\d{2})/(\d+)[-_][^\s\"'&<>]*?\.mp4", d):
        vids.setdefault(m.group(2), m.group(0))
    out, seen = [], set()
    for title, pid in pages:
        if pid in seen:
            continue
        seen.add(pid)
        out.append({"source": "pixabay", "id": pid, "title": title.replace("-", " "), "page": f"https://pixabay.com/videos/{title}-{pid}/",
                    "url": vids.get(pid, ""), "license": LICENSES["pixabay"],
                    "note": "" if pid in vids else "resolve the mp4 from the page: python tools/footage.py resolve pixabay <page>"})
        if len(out) >= n:
            break
    if not out:  # fall back to whatever cdn links the page exposes
        for vid, url in list(vids.items())[:n]:
            out.append({"source": "pixabay", "id": vid, "title": "", "page": "", "url": url, "license": LICENSES["pixabay"]})
    return out


def s_coverr(q, n):
    h = fetch("https://coverr.co/s?q=" + urllib.parse.quote(q))
    out, seen = [], set()
    for slug in re.findall(r"cdn\.coverr\.co/videos/([a-z0-9-]+)/", h):
        if slug in seen:
            continue
        seen.add(slug)
        out.append({"source": "coverr", "id": slug, "title": slug.replace("coverr-", "").replace("-", " "), "page": f"https://coverr.co/videos/{slug.replace('coverr-', '')}",
                    "url": f"https://cdn.coverr.co/videos/{slug}/1080p.mp4", "license": LICENSES["coverr"]})
        if len(out) >= n:
            break
    return out


def s_nasa(q, n):
    j = json.loads(fetch("https://images-api.nasa.gov/search?media_type=video&q=" + urllib.parse.quote(q)))
    out = []
    for it in j["collection"]["items"][: n * 2]:
        d = it["data"][0]
        nid = d["nasa_id"]
        out.append({"source": "nasa", "id": nid, "title": d.get("title", "")[:90], "page": f"https://images.nasa.gov/details/{urllib.parse.quote(nid)}",
                    "url": f"nasa:{nid}", "license": LICENSES["nasa"], "date": d.get("date_created", "")[:10], "center": d.get("center", "")})
        if len(out) >= n:
            break
    return out


def s_archive(q, n):
    qq = f"({q}) AND mediatype:movies AND collection:(prelinger OR fedflix) AND (licenseurl:*publicdomain* OR licenseurl:*zero*)"
    url = "https://archive.org/advancedsearch.php?" + urllib.parse.urlencode({"q": qq, "fl[]": ["identifier", "title", "licenseurl", "year"], "rows": n, "output": "json"}, doseq=True)
    j = json.loads(fetch(url))
    return [{"source": "archive", "id": d["identifier"], "title": d.get("title", "")[:90], "page": f"https://archive.org/details/{d['identifier']}",
             "url": f"archive:{d['identifier']}", "license": f"Public Domain ({d.get('licenseurl', '')})", "year": d.get("year", "")}
            for d in j["response"]["docs"]]


def s_openverse(q, n):
    j = json.loads(fetch("https://api.openverse.org/v1/images/?" + urllib.parse.urlencode({"q": q, "license": "cc0,pdm", "page_size": n, "size": "large"})))
    return [{"source": "openverse", "id": r["id"], "title": (r.get("title") or "")[:90], "page": r.get("foreign_landing_url"), "url": r.get("url"),
             "license": f"{r.get('license', '').upper()} ({r.get('provider')})", "author": r.get("creator"), "kind": "image",
             "size": f"{r.get('width')}x{r.get('height')}"} for r in j.get("results", [])]


SOURCES = {"mixkit": s_mixkit, "pixabay": s_pixabay, "coverr": s_coverr, "nasa": s_nasa, "archive": s_archive, "openverse": s_openverse}


def resolve(source, ref):
    """Turn a search hit's url field into a direct downloadable media URL."""
    if source == "nasa" or ref.startswith("nasa:"):
        nid = ref.split(":", 1)[1] if ref.startswith("nasa:") else ref
        files = json.loads(fetch(f"https://images-assets.nasa.gov/video/{urllib.parse.quote(nid)}/collection.json"))
        mp4 = [f for f in files if f.endswith(".mp4")]
        for pref in ("~large.mp4", "~orig.mp4", "~medium.mp4"):
            for f in mp4:
                if f.endswith(pref):
                    return f.replace("http://", "https://").replace(" ", "%20")
        return mp4[0].replace("http://", "https://").replace(" ", "%20") if mp4 else ""
    if source == "archive" or ref.startswith("archive:"):
        ident = ref.split(":", 1)[1] if ref.startswith("archive:") else ref
        # /files only: the full /metadata doc embeds ASR transcripts (~200 KB) and often arrives truncated on a slow line
        files = []
        for _ in range(4):
            try:
                files = json.loads(fetch(f"https://archive.org/metadata/{ident}/files", timeout=120)).get("result", [])
                break
            except (ValueError, RuntimeError):
                time.sleep(3)
        # skip "_edit.mp4": archive.org's all-intra 320x240 editing proxy (2-4x bigger than the 640x480 h.264 derivative)
        best = sorted([f for f in files if f.get("name", "").lower().endswith((".mp4", ".mpeg4")) and "_edit." not in f.get("name", "").lower()],
                      key=lambda f: -int(f.get("size", 0) or 0))
        return f"https://archive.org/download/{ident}/{urllib.parse.quote(best[0]['name'])}" if best else ""
    if source == "mixkit":
        m = re.search(r"/videos/(\d+)/", ref) or re.search(r"-(\d+)/?$", ref)
        if m:
            vid = m.group(1)
            for q in ("720", "1080", "360"):  # 720p: plenty under the halftone print pass, ~half the bytes
                u = f"https://assets.mixkit.co/videos/{vid}/{vid}-{q}.mp4"
                r = subprocess.run(["curl", "-s", "-o", os.devnull, "-w", "%{http_code}", "-A", UA, "-r", "0-1000", u], capture_output=True, text=True)
                if r.stdout.strip() in ("200", "206"):
                    return u
        return ref
    if source == "pixabay" and "pixabay.com/videos/" in ref:
        h = urllib.parse.unquote(urllib.parse.unquote(fetch(ref)))
        c = re.findall(r"https://cdn\.pixabay\.com/video/\d{4}/\d{2}/\d{2}/\d+[-_][^\s\"'&<>]*?\.mp4", h)
        big = [u for u in c if "large" in u] or [u for u in c if "medium" in u] or c
        return big[0] if big else ""
    return ref


# ------------------------------------------------------------------------------------------------ probe / thumbs
def probe(path):
    r = subprocess.run([FF, "-hide_banner", "-i", str(path)], capture_output=True, text=True, encoding="utf-8", errors="replace")
    e = r.stderr
    dur = re.search(r"Duration: (\d+):(\d+):([\d.]+)", e)
    v = re.search(r"Video: .*?(\d{3,5})x(\d{3,5})", e)
    fps = re.search(r"([\d.]+) fps", e)
    sec = int(dur.group(1)) * 3600 + int(dur.group(2)) * 60 + float(dur.group(3)) if dur else 0
    return {"duration": round(sec, 2), "w": int(v.group(1)) if v else 0, "h": int(v.group(2)) if v else 0, "fps": float(fps.group(1)) if fps else 0}


def strip(path, out, info, n=6):
    if info["duration"] <= 0:  # still image
        subprocess.run([FF, "-y", "-v", "error", "-i", str(path), "-vf", "scale=480:-2", str(out)], check=False)
        return
    step = max(0.2, info["duration"] / n)
    subprocess.run([FF, "-y", "-v", "error", "-i", str(path), "-vf", f"fps=1/{step:.3f},scale=320:-2,tile={n}x1:padding=3:color=0x111111", "-frames:v", "1", str(out)], check=False)


def _read(p):
    return [json.loads(l) for l in p.read_text(encoding="utf-8").splitlines() if l.strip()] if p.exists() else []


def rejects():
    return {r["file"]: r.get("reason", "") for d in RAW.glob("*") for r in _read(d / "rejects.jsonl")}


def manifest(include_rejected=False):
    """All clips (one manifest per set, so parallel agents never write the same file)."""
    rej = {} if include_rejected else rejects()
    return [m for d in sorted(RAW.glob("*")) for m in _read(d / "manifest.jsonl") if m["file"] not in rej]


def cmd_add(a):
    if a.source == "mixkit":
        m = re.search(r"/videos/(\d+)/", a.url) or re.search(r"-(\d+)/?$", a.url)
        lic = mixkit_license(m.group(1)) if m else None
        if lic != "videoFree":
            raise SystemExit(f"refused: Mixkit clip {a.url} is {lic or 'of unknown licence'}; only the Mixkit Free License is allowed")
    url = resolve(a.source, a.url)
    if not url:
        raise SystemExit(f"could not resolve a media URL from {a.url}")
    d = RAW / a.set
    d.mkdir(parents=True, exist_ok=True)
    ext = ".jpg" if re.search(r"\.(jpe?g|png|webp)(\?|$)", url, re.I) else ".mp4"
    slug = f"{a.source}-{slugify(a.title or Path(urllib.parse.urlparse(url).path).stem, 40)}-{hashlib.md5(url.encode()).hexdigest()[:6]}"
    dst = d / (slug + ext)
    if any(m.get("file") == str(dst.relative_to(ROOT)).replace("\\", "/") for m in manifest(True)):
        print(json.dumps({"exists": str(dst)}))
        return
    tmp = dst.with_suffix(dst.suffix + ".part")
    # Videos: fetch only the usable window (--start/--end, else the --use range, capped at MAX_WIN s) by letting
    # ffmpeg seek over HTTP and stream-copy: a fraction of the bytes of the whole file on a slow line.
    win = None
    if ext == ".mp4":
        a0, a1 = a.start, a.end
        if a0 is None and a.use:
            m = re.match(r"\s*([\d.]+)\s*-\s*([\d.]+)", a.use)
            if m:
                a0, a1 = float(m.group(1)), float(m.group(2))
        a0 = a0 or 0.0
        a1 = min(a1, a0 + MAX_WIN) if a1 is not None else a0 + MAX_WIN
        win = (a0, a1)
        r = subprocess.run([FF, "-y", "-v", "error", "-user_agent", UA, "-reconnect", "1", "-reconnect_streamed", "1", "-reconnect_delay_max", "10",
                            "-ss", f"{a0:.2f}", "-i", url, "-t", f"{a1 - a0:.2f}", "-map", "0:v:0", "-c", "copy", "-an", "-f", "mp4", str(tmp)],
                           capture_output=True, text=True, encoding="utf-8", errors="replace")
        if r.returncode == 0 and tmp.exists() and tmp.stat().st_size > 50_000 and probe(tmp)["duration"] > 0.5:
            tmp.replace(dst)
        else:
            tmp.unlink(missing_ok=True)
            win = None
    if not dst.exists():
        r = subprocess.run(["curl", "-sSL", "--fail", "--retry", "6", "--retry-all-errors", "--retry-delay", "3", "-A", UA, "-o", str(tmp), url], capture_output=True, text=True)
        if r.returncode or not tmp.exists() or tmp.stat().st_size < 50_000:
            tmp.unlink(missing_ok=True)
            raise SystemExit(f"download failed ({r.returncode}): {url} {r.stderr[-300:]}")
        if a.start is not None or a.end is not None:  # keep only the useful part of long archive films
            args = [FF, "-y", "-v", "error"] + (["-ss", str(a.start)] if a.start is not None else []) + ["-i", str(tmp)] +                    (["-t", str((a.end or 0) - (a.start or 0))] if a.end is not None else []) + ["-c:v", "libx264", "-crf", "16", "-preset", "fast", "-an", str(dst)]
            subprocess.run(args, check=True)
            tmp.unlink()
        else:
            tmp.replace(dst)
    info = probe(dst)
    strip(dst, dst.with_suffix(".jpg") if ext == ".mp4" else d / (slug + ".thumb.jpg"), info)
    rec = {"set": a.set, "file": str(dst.relative_to(ROOT)).replace("\\", "/"), "source": a.source, "license": a.license or LICENSES.get(a.source, ""),
           "page": a.page or "", "url": url, "author": a.author or "", "title": a.title or "", **info, "notes": a.notes or "",
           "use": (f"0-{info['duration']}" if win else (a.use or "")), "src_window": list(win) if win else None, "tags": [t.strip() for t in (a.tags or "").split(",") if t.strip()], "score": a.score}
    with open(d / "manifest.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    print(json.dumps(rec, ensure_ascii=False))


def cmd_sheet(a):
    recs = [m for m in manifest() if m["set"] == a.set]
    if not recs:
        raise SystemExit(f"no clips in set {a.set}")
    d = RAW / a.set
    strips = [ROOT / Path(m["file"]).with_suffix(".jpg") if m["file"].endswith(".mp4") else ROOT / m["file"] for m in recs]
    strips = [s for s in strips if s.exists()]
    out = d / "_sheet.jpg"
    inputs = []
    for s in strips:
        inputs += ["-i", str(s)]
    flt = "".join(f"[{i}:v]scale=1932:-2,pad=1932:ih+28:0:28:color=0x111111[v{i}];" for i in range(len(strips)))
    flt += "".join(f"[v{i}]" for i in range(len(strips))) + f"vstack=inputs={len(strips)}" if len(strips) > 1 else flt.rstrip(";").replace("[v0]", "")
    if len(strips) == 1:
        subprocess.run([FF, "-y", "-v", "error", "-i", str(strips[0]), str(out)], check=True)
    else:
        subprocess.run([FF, "-y", "-v", "error", *inputs, "-filter_complex", flt, str(out)], check=True)
    for i, m in enumerate(recs):
        print(f"{i + 1:2d}. {Path(m['file']).name}  {m['w']}x{m['h']} {m['duration']}s  {m['source']}  {m['title'][:60]}")
    print(f"sheet: {out}")


def preview_url(source, url):
    """A small variant of a clip for previews (saves bandwidth)."""
    if source == "mixkit":
        return re.sub(r"-(1080|720|2160)\.mp4$", "-360.mp4", url)
    if source == "coverr":
        return url.replace("/1080p.mp4", "/360p.mp4")
    if source == "nasa":
        return url.replace("~large.mp4", "~small.mp4").replace("~orig.mp4", "~small.mp4")
    if source == "pixabay":
        return url.replace("_large.mp4", "_tiny.mp4").replace("-large.mp4", "-tiny.mp4")
    return url


def cmd_peek(a):
    """Six frames of a remote clip (seeking over HTTP), tiled into footage/_peek/<id>.jpg — look before downloading."""
    full = resolve(a.source, a.url)
    if not full:
        raise SystemExit(f"could not resolve {a.url}")
    small = preview_url(a.source, full)
    out_dir = LIB / "_peek"
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"{a.source}-{hashlib.md5(full.encode()).hexdigest()[:8]}.jpg"
    if re.search(r"\.(jpe?g|png|webp)(\?|$)", full, re.I):
        subprocess.run([FF, "-y", "-v", "error", "-i", full, "-vf", "scale=640:-2", str(out)], check=False)
        print(json.dumps({"peek": str(out), "url": full}))
        return
    src = small
    info = probe(src)
    if info["duration"] <= 0:
        src, info = full, probe(full)
    dur = info["duration"] or 10
    frames = []
    for k in range(6):
        t = dur * (k + 0.5) / 6
        f = out_dir / f"_{out.stem}_{os.getpid()}_f{k}.jpg"  # per-peek temp names: parallel peeks (many agents) must not share frames
        subprocess.run([FF, "-y", "-v", "error", "-ss", f"{t:.2f}", "-i", src, "-frames:v", "1", "-vf", "scale=320:-2", str(f)], check=False)
        if f.exists():
            frames.append(f)
    if not frames:
        raise SystemExit(f"no frames from {src}")
    ins = []
    for f in frames:
        ins += ["-i", str(f)]
    subprocess.run([FF, "-y", "-v", "error", *ins, "-filter_complex", "".join(f"[{i}:v]" for i in range(len(frames))) + f"hstack=inputs={len(frames)}" if len(frames) > 1 else "null", str(out)], check=False)
    if len(frames) == 1:
        frames[0].replace(out)
    for f in frames:
        f.unlink(missing_ok=True)
    print(json.dumps({"peek": str(out), "url": full, "preview": src, "duration": dur, "w_preview": info["w"], "h_preview": info["h"],
                      "times": [round(dur * (k + 0.5) / 6, 1) for k in range(6)]}))


def main():
    ap = argparse.ArgumentParser()
    sp = ap.add_subparsers(dest="cmd", required=True)
    s = sp.add_parser("search"); s.add_argument("source", choices=list(SOURCES)); s.add_argument("query"); s.add_argument("--n", type=int, default=12)
    s = sp.add_parser("resolve"); s.add_argument("source"); s.add_argument("ref")
    s = sp.add_parser("add"); s.add_argument("set"); s.add_argument("url"); s.add_argument("--source", required=True, choices=list(SOURCES))
    s.add_argument("--license"); s.add_argument("--page"); s.add_argument("--author"); s.add_argument("--title"); s.add_argument("--notes")
    s.add_argument("--start", type=float); s.add_argument("--end", type=float)
    s.add_argument("--use", help="usable range(s) in seconds, e.g. '3.5-14,20-26' (skip slates, logos, text)")
    s.add_argument("--tags", help="comma-separated mood/content tags"); s.add_argument("--score", type=int, help="fit 1-5")
    s = sp.add_parser("sheet"); s.add_argument("set")
    s = sp.add_parser("list"); s.add_argument("set", nargs="?")
    s = sp.add_parser("reject"); s.add_argument("file"); s.add_argument("--reason", default="")
    s = sp.add_parser("peek"); s.add_argument("source", choices=list(SOURCES)); s.add_argument("url")
    a = ap.parse_args()
    if a.cmd == "peek":
        cmd_peek(a)
        return
    if a.cmd == "search":
        for r in SOURCES[a.source](a.query, a.n):
            print(json.dumps(r, ensure_ascii=False))
    elif a.cmd == "resolve":
        print(resolve(a.source, a.ref))
    elif a.cmd == "add":
        cmd_add(a)
    elif a.cmd == "sheet":
        cmd_sheet(a)
    elif a.cmd == "reject":
        rel = str(Path(a.file).resolve().relative_to(ROOT)).replace("\\", "/") if Path(a.file).exists() else a.file.replace("\\", "/")
        st = rel.split("/")[2] if rel.startswith("footage/raw/") else ""
        with open(RAW / st / "rejects.jsonl", "a", encoding="utf-8") as f:
            f.write(json.dumps({"file": rel, "reason": a.reason}) + "\n")
        print(f"rejected {rel}")
    else:
        for m in manifest():
            if not a.set or m["set"] == a.set:
                print(f"{m['set']:22s} {Path(m['file']).name:60s} {m['w']}x{m['h']} {m['duration']}s {m['source']}")


if __name__ == "__main__":
    main()

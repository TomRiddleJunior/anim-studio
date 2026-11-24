"""Shared helpers for the map-film tools: paths, mercator world units, the story dump, a local HTTP server."""
import contextlib
import functools
import http.server
import json
import math
import os
import socketserver
import sys
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]          # map-films
ENGINE = ROOT / "engine"
VENDOR = ROOT / "_vendor"
TILE_CACHE = VENDOR / "tiles" / "2016"
FFMPEG = Path("engine/node_modules/ffmpeg-static/ffmpeg.exe")
FFPROBE = Path("ffmpeg-bin/node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe")
KOKORO_PY = Path.home() / ".generative-music-video" / "venv" / "Scripts" / "python.exe"

for _s in (sys.stdout, sys.stderr):  # Windows consoles default to cp1252
    if hasattr(_s, "reconfigure"):
        _s.reconfigure(encoding="utf-8", errors="replace")


def film_dir(slug):
    d = ROOT / slug
    if not (d / "story.js").exists():
        raise SystemExit(f"no story.js in {d}")
    return d


# ── mercator world units: 256 units = the globe, rotated so lon0 sits at x = 128 ──────────────────────────────
R = 256 / (2 * math.pi)


def world(lon, lat, lon0=0.0):
    lam = ((lon - lon0 + 540.0) % 360.0) - 180.0
    phi = math.radians(max(-85.05112878, min(85.05112878, lat)))
    return 128 + R * math.radians(lam), 128 - R * math.log(math.tan(math.pi / 4 + phi / 2))


def unworld(x, y, lon0=0.0):
    lon = math.degrees((x - 128) / R) + lon0
    lat = math.degrees(2 * math.atan(math.exp((128 - y) / R)) - math.pi / 2)
    return ((lon + 540) % 360) - 180, lat


def km_to_units(km, lat):
    """Length of `km` on the ground at latitude `lat`, in world units."""
    return km / 40075.016686 * 256 / math.cos(math.radians(lat))


def std_x_to_rot(xs, lon0):
    """Standard web-mercator world x (cut at 180°) → the film's rotated world x."""
    return (xs - lon0 * 256 / 360 + 256 * 4) % 256


# ── the story, read through the page itself so story.js stays the single source of truth ─────────────────────
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


@contextlib.contextmanager
def serve(root=ROOT):
    """Serve map-films/ on 127.0.0.1:<random port> (same origin, so canvases stay untainted)."""
    handler = functools.partial(Quiet, directory=str(root))
    socketserver.TCPServer.allow_reuse_address = True
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    th = threading.Thread(target=httpd.serve_forever, daemon=True)
    th.start()
    try:
        yield f"http://127.0.0.1:{httpd.server_address[1]}"
    finally:
        httpd.shutdown()


def page_url(base, slug, fmt="16x9", **extra):
    q = "&".join([f"story={slug}", f"fmt={fmt}"] + [f"{k}={v}" for k, v in extra.items()])
    return f"{base}/engine/film.html?{q}"


def launch(p, width=1920, height=1080):
    browser = p.chromium.launch(channel="msedge", args=["--ignore-gpu-blocklist", "--enable-gpu-rasterization",
                                                        "--force-color-profile=srgb", "--disable-background-timer-throttling",
                                                        "--disable-renderer-backgrounding"])
    page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
    logs = []
    page.on("console", lambda m: logs.append(f"[{m.type}] {m.text}"))
    page.on("pageerror", lambda e: logs.append(f"[pageerror] {e}"))
    return browser, page, logs


def open_film(page, url, logs, timeout=120000):
    page.goto(url)
    try:
        page.wait_for_function("window.__mf && window.__mf.state !== 'loading'", timeout=timeout)
    except Exception:
        print("\n".join(logs[-40:]))
        raise
    st = page.evaluate("window.__mf.state")
    if st != "ready":
        print("\n".join(logs[-40:]))
        raise SystemExit(f"page state: {st}: {page.evaluate('window.__mf.error')}")
    return page.evaluate("window.__mf.info()")


def dump_story(slug, fmt="16x9"):
    """Story config + compiled cues as JSON (needs no tiles or timing to exist)."""
    from playwright.sync_api import sync_playwright
    with serve() as base, sync_playwright() as p:
        browser, page, logs = launch(p)
        info = open_film(page, page_url(base, slug, fmt, dump=1), logs)
        browser.close()
    return info


def norm_word(s):
    """The key form of a word: lower case, apostrophes dropped, outer punctuation stripped ("that's," → "thats").
    Must match normWord() in engine/js/core.js."""
    s = s.lower().replace("’", "").replace("'", "")
    return s.strip(".,;:!?\"()[]{}…—–")


def script_words(script):
    """[(line_index, line_id, raw_word, norm_word)] in script order; whitespace splits words."""
    out = []
    for i, ln in enumerate(script["lines"]):
        for w in ln["text"].split():
            out.append((i, ln["id"], w, norm_word(w)))
    return out


def write_js_global(path, name, obj):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f"window.{name} = " + json.dumps(obj, separators=(",", ":"), ensure_ascii=False) + ";\n",
                    encoding="utf-8")

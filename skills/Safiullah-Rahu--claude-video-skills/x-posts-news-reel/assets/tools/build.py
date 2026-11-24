"""X-posts news reel builder: edit.json + posts/posts.json + vo/tts/data/vo.json -> every timed file of the HyperFrames project.

writes  assets/posts/<nn>.png         the screenshots the film shows (copied unchanged from posts/)
        compositions/bg.html          the stage: dark gradient, drifting red/blue light, perspective grid, giant year, grain
        compositions/posts.html       the post cards: entry transitions (slam, whip, push, zoom, flip, glitch), hold moves
        compositions/cards.html       the voice cards (word-synced kinetic headlines), the hook and the end card
        compositions/overlay.html     the HUD: top label, post counter, chapter tags, chips, flash, ticker
        index.html                    root composition (bg, posts, cards, overlay, mixed audio)
        score/timeline.json           beat grid, energy sections, voice placements, SFX cues (tools/sound_design.py reads it)
        vo/data/vo.json               the voice in FILM time (lines and words where the film plays them)
        out/<name>.srt                one cue per spoken phrase
        scratch/schedule.txt          the cut as a table + the reading-time gate per post

Timing model: segments follow each other on the beat grid (bpm in edit.json). A post holds
max(min_hold, words_on_screen / wps) of readable time after its entry settles, rounded up to whole beats; a voice card
holds its line plus pads. Every boundary is a cut on a beat.

usage: python -X utf8 -I tools/build.py
"""
import html
import json
import math
import os
import re
import shutil
import struct

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
E = json.load(open(os.path.join(ROOT, "edit.json"), encoding="utf-8"))
PJ = json.load(open(os.path.join(ROOT, "posts", "posts.json"), encoding="utf-8"))
POSTS = {p["n"]: p for p in PJ["posts"]}
VOJ = json.load(open(os.path.join(ROOT, "vo", "tts", "data", "vo.json"), encoding="utf-8"))  # raw Kokoro take (tools/voice.sh)
VL = {l["id"]: l for l in VOJ["lines"]}
W, H = 1080, 1920
NAME = E["name"]
BPM = E.get("bpm", 120)
BEAT = 60.0 / BPM
WPS = E.get("wps", 3.6)            # reading speed the hold is sized for (words per second of readable time)
MIN_HOLD = E.get("min_hold", 2.5)  # readable seconds, whatever the word count
CARD_W = E.get("card_w", 980)      # displayed card width
CARD_MAXH = E.get("card_maxh", 900)
CARD_CY = E.get("card_cy", 772)    # card centre (inside the 168-1330 px band the X/IG UI leaves free)
TR_IN = {"slam": 0.16, "whip": 0.30, "push": 0.34, "zoom": 0.36, "flip": 0.30, "glitch": 0.22, "cut": 0.0}
TR_OUT = {"slam": 0.0, "whip": 0.22, "push": 0.26, "zoom": 0.28, "flip": 0.18, "glitch": 0.0, "cut": 0.0}
VO_LEAD = 0.22                     # voice starts this long after its card's cut
VO_TAIL = 0.30


def r3(x):
    return round(x + 1e-9, 3)


def ceil_beats(x, sub=1):
    q = BEAT / sub
    return math.ceil(x / q - 1e-6) * q


def png_size(f):
    with open(f, "rb") as fh:
        h = fh.read(24)
    return struct.unpack(">II", h[16:24])


def vo_len(lid):
    l = VL[lid]
    return l["end"] - l["start"]


# ----------------------------------------------------------------------------------------------- schedule
SEQ = E["sequence"]
segs, t = [], 0.0
for i, it in enumerate(SEQ):
    s = dict(it)
    s["i"] = i
    s["t0"] = t
    tin = s.get("tin", "cut")
    s["tin"] = tin
    if s["type"] in ("hook", "vo", "end"):
        lead = 0.12 if s["type"] == "hook" else VO_LEAD
        s["vo_at"] = t + lead
        need = lead + vo_len(s["vo"]) + VO_TAIL + s.get("extra", 0.0)
        if s["type"] == "end":
            need = max(need, E.get("end_hold", 3.0))
        s["dur"] = ceil_beats(need)
    else:
        p = POSTS[s["n"]]
        if p.get("status") != "used":
            raise SystemExit(f"post {s['n']} is {p.get('status')} in posts.json but listed in edit.json")
        words = s.get("words", p["words_on_screen"])
        read = max(MIN_HOLD, words / WPS) + s.get("extra", 0.0)
        nxt = SEQ[i + 1] if i + 1 < len(SEQ) else {}
        s["read_need"] = read
        s["dur"] = ceil_beats(TR_IN[tin] + read + TR_OUT.get(nxt.get("tin", "cut"), 0.0))
        s["words"] = words
    s["t1"] = s["t0"] + s["dur"]
    t = s["t1"]
    segs.append(s)
DUR = r3(t)
for k, s in enumerate(segs):
    s["next_tin"] = segs[k + 1]["tin"] if k + 1 < len(segs) else "cut"
    s["readable"] = s["dur"] - TR_IN[s["tin"]] - TR_OUT.get(s["next_tin"], 0.0)

post_segs = [s for s in segs if s["type"] == "post"]
NPOST = len(post_segs)
for k, s in enumerate(post_segs):
    s["k"] = k + 1

# card geometry
for s in post_segs:
    p = POSTS[s["n"]]
    s["src"] = f"assets/posts/{s['n']:02d}.png"
    os.makedirs(os.path.join(ROOT, "assets", "posts"), exist_ok=True)
    shutil.copyfile(os.path.join(ROOT, "posts", p["screenshot"]), os.path.join(ROOT, s["src"]))
    iw, ih = png_size(os.path.join(ROOT, s["src"]))
    w = s.get("card_w", CARD_W)
    h = ih * w / iw
    maxh = s.get("maxh", CARD_MAXH)  # per-post override: a tall media post may run taller to keep its text >= 28 px
    if h > maxh:
        h = maxh
        w = iw * h / ih
    s["cw"], s["ch"] = round(w), round(h)
    s["cx"], s["cy"] = round((W - w) / 2), round(s.get("cy", CARD_CY) - h / 2)
    s["fontpx"] = round(w / iw * 3 * 17)  # embed body text is ~17 css px at DPR 3

# ----------------------------------------------------------------------------------------------- energy + cues
sections = []
for s in segs:
    e = s.get("energy", {"hook": 2, "vo": 1, "end": 0, "post": 2}[s["type"]])
    if not sections or sections[-1]["energy"] != e:
        sections.append({"t": r3(s["t0"]), "energy": e})
cues = []
pan = 1
for s in segs:
    tin, t0 = s["tin"], s["t0"]
    if s["i"] == 0:
        continue
    kind = {"slam": "slam", "whip": "whip", "push": "push", "zoom": "zoom", "flip": "flip", "glitch": "glitch"}.get(tin)
    if kind:
        pan = -pan
        cues.append({"t": r3(t0), "type": kind, "pan": 0.25 * pan})
    for c in s.get("chips", []):
        cues.append({"t": r3(t0 + TR_IN[tin] + c.get("delay", 0.35)), "type": "pop", "f": 820})
    if s["type"] == "post":
        cues.append({"t": r3(t0 + TR_IN[tin] * 0.6), "type": "tick"})

vo_place = []
for s in segs:
    if "vo" in s:
        l = VL[s["vo"]]
        vo_place.append({"id": s["vo"], "src_start": r3(l["start"]), "src_end": r3(l["end"]), "at": r3(s["vo_at"])})
end_t = next((s["t0"] for s in segs if s["type"] == "end"), DUR)
os.makedirs(os.path.join(ROOT, "score"), exist_ok=True)
json.dump({"dur": DUR, "bpm": BPM, "lufs": E.get("lufs", -14), "sections": sections, "vo": vo_place, "cues": cues,
           "end_card_t": r3(end_t)}, open(os.path.join(ROOT, "score", "timeline.json"), "w"), indent=1)


def vword_times(s):
    """the card's VO words with times on the film clock"""
    l = VL[s["vo"]]
    off = s["vo_at"] - l["start"]
    ws = [{"w": w["w"], "t": r3(w["start"] + off), "e": r3(w["end"] + off)} for w in l["words"]]
    for i in range(len(ws) - 1):  # Kokoro glues an opening quote to the word before it: give it to the next word
        m = re.search(r"\s*([“‘\"(\[]+)$", ws[i]["w"])
        if m and len(ws[i]["w"]) > len(m[1]):
            ws[i]["w"] = ws[i]["w"][: m.start()]
            ws[i + 1]["w"] = m[1] + ws[i + 1]["w"]
    return ws


# ----------------------------------------------------------------------------------------------- shared css
FONTS = """
    @font-face { font-family: "Bebas Neue"; src: url("assets/fonts/BebasNeue-Regular.ttf"); }
    @font-face { font-family: "Barlow Condensed"; src: url("assets/fonts/BarlowCondensed-Bold.ttf"); font-weight: 700; }
    @font-face { font-family: "Barlow Condensed"; src: url("assets/fonts/BarlowCondensed-SemiBold.ttf"); font-weight: 600; }
    @font-face { font-family: "Inter"; src: url("assets/fonts/Inter_opsz-wght_.ttf"); font-weight: 100 900; }
    @font-face { font-family: "Roboto Mono"; src: url("assets/fonts/RobotoMono_wght_.ttf"); font-weight: 100 700; }"""
C = E.get("colors", {"red": "#ff3048", "blue": "#2f7dff", "amber": "#ffc53d", "ink": "#05070c", "white": "#f4f6fa"})
RED, BLUE, AMB, WHITE = C["red"], C["blue"], C["amber"], C["white"]


def comp(cid, css, body, js):
    return f"""<template>
  <style>{FONTS}
    #root {{ position: absolute; inset: 0; overflow: hidden; }}
{css}
  </style>
  <div id="root" data-composition-id="{cid}" data-width="{W}" data-height="{H}">
{body}
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
{js}
      window.__timelines["{cid}"] = tl;
    }})();
  </script>
</template>
"""


# ----------------------------------------------------------------------------------------------- bg
def build_bg():
    css = f"""    #root .base {{ position: absolute; inset: 0; background: radial-gradient(120% 70% at 50% 42%, #101826 0%, #070a12 55%, #030409 100%); }}
    #root .blob {{ position: absolute; width: 1300px; height: 1300px; border-radius: 50%; opacity: .55; }}
    #root #bR {{ left: -640px; top: 60px; background: radial-gradient(closest-side, {RED}88, {RED}22 55%, transparent 72%); }}
    #root #bB {{ left: 420px; top: 760px; background: radial-gradient(closest-side, {BLUE}99, {BLUE}22 55%, transparent 72%); }}
    #root .floorwrap {{ position: absolute; left: -540px; right: -540px; top: 1080px; height: 1400px; perspective: 900px; perspective-origin: 50% 0%;
      -webkit-mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,.35) 18%, #000 60%); mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,.35) 18%, #000 60%); }}
    #root .floor {{ position: absolute; inset: 0; transform-origin: 50% 0%;
      background-image: linear-gradient(rgba(150,180,255,.16) 2px, transparent 2px), linear-gradient(90deg, rgba(150,180,255,.12) 2px, transparent 2px);
      background-size: 120px 120px; }}
    #root .year {{ position: absolute; left: 0; top: 480px; width: 1080px; height: 800px; }}
    #root .pulse {{ position: absolute; inset: 0; background: radial-gradient(70% 45% at 50% 40%, rgba(255,255,255,.10), transparent 70%); opacity: 0; }}
    #root .grain {{ position: absolute; left: -200px; top: -200px; right: -200px; bottom: -200px; background-image: url("assets/fx/grain.png"); opacity: .10; mix-blend-mode: overlay; }}
    #root .vig {{ position: absolute; inset: 0; background: radial-gradient(110% 80% at 50% 45%, transparent 55%, rgba(0,0,0,.65) 100%); }}"""
    body = """    <div class="base"></div>
    <div class="blob" id="bR" data-layout-allow-overflow></div>
    <div class="blob" id="bB" data-layout-allow-overflow></div>
    <svg class="year" id="yr" viewBox="0 0 1080 800" aria-hidden="true" data-layout-ignore><text x="540" y="640" text-anchor="middle" font-family="Bebas Neue" font-size="760"
      fill="none" stroke="rgba(255,255,255,.07)" stroke-width="3" letter-spacing="15">2026</text></svg>
    <div class="floorwrap" data-layout-allow-overflow><div class="floor" id="fl"></div></div>
    <div class="pulse" id="pu"></div>
    <div class="grain" id="gr" data-layout-allow-overflow></div>
    <div class="vig"></div>"""
    js = []
    js.append('      tl.set("#fl", {rotationX: 72}, 0);')
    js.append(f'      tl.fromTo("#fl", {{backgroundPosition: "0px 0px"}}, {{backgroundPosition: "0px {int(DUR * 160)}px", duration: {DUR}, ease: "none"}}, 0);')
    js.append(f'      tl.fromTo("#gr", {{x: 0, y: 0}}, {{x: 180, y: 140, duration: {DUR}, ease: "steps({int(DUR * 15)})"}}, 0);')
    js.append(f'      tl.fromTo("#yr", {{y: 30, scale: 1.0}}, {{y: -60, scale: 1.08, duration: {DUR}, ease: "none"}}, 0);')
    # the light blobs drift on 8-bar phrases (finite yoyos)
    per = 16 * BEAT
    n = max(1, int(DUR / per))
    js.append(f'      tl.fromTo("#bR", {{x: 0, y: 0, scale: 1}}, {{x: 160, y: 220, scale: 1.18, duration: {per:.3f}, ease: "sine.inOut", yoyo: true, repeat: {n}}}, 0);')
    js.append(f'      tl.fromTo("#bB", {{x: 0, y: 0, scale: 1.1}}, {{x: -180, y: -260, scale: 0.95, duration: {per:.3f}, ease: "sine.inOut", yoyo: true, repeat: {n}}}, 0);')
    # a soft light pulse on the downbeat of every bar where the beat is up
    first = [True]
    for s in segs:
        e = s.get("energy", {"hook": 2, "vo": 1, "end": 0, "post": 2}[s["type"]])
        if e < 2:
            continue
        b = s["t0"]
        while b < s["t1"] - 0.05:
            if abs((b / BEAT) % 4) < 1e-3 or abs((b / BEAT) % 4 - 4) < 1e-3 or e >= 3:
                ir = "" if first[0] else ", immediateRender: false"
                first[0] = False
                js.append(f'      tl.fromTo("#pu", {{opacity: {0.9 if e >= 3 else 0.6}}}, {{opacity: 0, duration: {BEAT * 0.9:.3f}, ease: "power2.out"{ir}}}, {r3(b)});')
            b += BEAT
    return comp("bg", css, body, "\n".join(js))


# ----------------------------------------------------------------------------------------------- posts
def build_posts():
    css = f"""    #root .post {{ position: absolute; inset: 0; perspective: 1700px; }}
    #root .pw {{ position: absolute; transform-origin: 50% 50%; }}
    #root .pc {{ position: absolute; inset: 0; transform-origin: 50% 30%; }}
    #root .pc img {{ position: absolute; inset: 0; width: 100%; height: 100%; border-radius: 22px;
      box-shadow: 0 40px 90px rgba(0,0,0,.65), 0 0 0 2px rgba(255,255,255,.07), 0 0 60px rgba(120,150,255,.10); }}
    #root .sl {{ position: absolute; inset: 0; opacity: 0; }}
    #root .sl img {{ position: absolute; inset: 0; width: 100%; height: 100%; border-radius: 22px; }}
    #root .gbar {{ position: absolute; left: -40px; right: -40px; height: 18px; opacity: 0; mix-blend-mode: screen; }}"""
    body, js = [], []
    for s in post_segs:
        n = s["n"]
        tin, t0 = s["tin"], s["t0"]
        tout = s["next_tin"]
        st = r3(t0 - (0.0))
        du = r3(s["dur"] + TR_OUT.get(tout, 0.0) * 0.0 + 0.0)
        # the card stays visible through the next segment's entry window when that entry needs the old picture
        keep = {"whip": 0.12, "push": 0.14, "zoom": 0.16, "flip": 0.0}.get(tout, 0.0)
        du = r3(s["dur"] + keep)
        a = f"p{n}"
        p = POSTS[n]
        alt = html.escape(f"{p['name']} {p['handle']}: {p['display_text']}", quote=True)
        slices = ""
        if tin == "glitch":
            hh = s["ch"] / 5
            for k in range(5):
                slices += (f'<div class="sl" id="{a}s{k}" style="clip-path: inset({k * hh:.0f}px 0 {s["ch"] - (k + 1) * hh:.0f}px 0)">'
                           f'<img src="{s["src"]}" alt=""></div>')
            slices += f'<div class="gbar" id="{a}g0" style="top:{s["ch"] * 0.3:.0f}px;background:{RED}"></div>'
            slices += f'<div class="gbar" id="{a}g1" style="top:{s["ch"] * 0.66:.0f}px;background:{BLUE}"></div>'
        body.append(f'    <div class="clip post" id="{a}" data-start="{r3(st)}" data-duration="{du}" data-track-index="{n % 2}">'
                    f'<div class="pw" id="{a}w" style="left:{s["cx"]}px;top:{s["cy"]}px;width:{s["cw"]}px;height:{s["ch"]}px">'
                    f'<div class="pc" id="{a}c"><img id="{a}i" src="{s["src"]}" alt="{alt}"></div>{slices}</div></div>')
        w_ = f"#{a}w"
        c_ = f"#{a}c"
        # entry
        if tin == "slam":
            js.append(f'      tl.fromTo("{w_}", {{scale: 1.42, opacity: 0}}, {{scale: 1, opacity: 1, duration: 0.16, ease: "power4.out"}}, {r3(t0)});')
            for k, dx in enumerate((14, -11, 7, -4, 0)):
                js.append(f'      tl.set("{w_}", {{x: {dx}, y: {-dx * 0.6:.1f}}}, {r3(t0 + 0.16 + k / 30)});')
        elif tin == "whip":
            js.append(f'      tl.fromTo("{w_}", {{x: 1250, skewX: -14, opacity: 1}}, {{x: 0, skewX: 0, duration: 0.30, ease: "power3.out"}}, {r3(t0 - 0.02)});')
        elif tin == "push":
            js.append(f'      tl.fromTo("{w_}", {{y: 1500, rotation: 2.5}}, {{y: 0, rotation: 0, duration: 0.34, ease: "power3.out"}}, {r3(t0 - 0.02)});')
        elif tin == "zoom":
            js.append(f'      tl.fromTo("{w_}", {{scale: 0.55, opacity: 0}}, {{scale: 1, opacity: 1, duration: 0.36, ease: "power3.out"}}, {r3(t0 - 0.04)});')
        elif tin == "flip":
            js.append(f'      tl.fromTo("{w_}", {{rotationY: -88, opacity: 1}}, {{rotationY: 0, duration: 0.30, ease: "power2.out"}}, {r3(t0)});')
        elif tin == "glitch":
            js.append(f'      tl.set("{c_}", {{opacity: 0}}, {r3(t0)});')
            for k in range(5):
                js.append(f'      tl.set("#{a}s{k}", {{opacity: 1}}, {r3(t0)});')
            offs = [(36, -52, 18, -8, 44), (-24, 30, -40, 22, -12), (10, -6, 12, -18, 6)]
            for j, row in enumerate(offs):
                for k in range(5):
                    js.append(f'      tl.set("#{a}s{k}", {{x: {row[k]}}}, {r3(t0 + j * 2 / 30)});')
            for g in (0, 1):
                js.append(f'      tl.fromTo("#{a}g{g}", {{opacity: .85, x: {-30 if g else 30}}}, {{opacity: 0, x: 0, duration: 0.2, ease: "steps(3)"}}, {r3(t0)});')
            for k in range(5):
                js.append(f'      tl.set("#{a}s{k}", {{opacity: 0, x: 0}}, {r3(t0 + 0.2)});')
            js.append(f'      tl.set("{c_}", {{opacity: 1}}, {r3(t0 + 0.2)});')
        # hold: a slow push (or a top-anchored pull-back for tall cards with a quote), plus an optional beat punch
        h0 = t0 + TR_IN[tin]
        h1 = s["t1"] - TR_OUT.get(tout, 0.0)
        mv = s.get("move", "push")
        if mv == "pull":
            js.append(f'      tl.fromTo("{c_}", {{scale: 1.055, y: 34}}, {{scale: 1.0, y: 0, duration: {r3((h1 - h0) * 0.6)}, ease: "sine.inOut"}}, {r3(h0)});')
        else:
            js.append(f'      tl.fromTo("{c_}", {{scale: 1.0, y: 0}}, {{scale: 1.045, y: -12, duration: {r3(h1 - h0)}, ease: "sine.inOut"}}, {r3(h0)});')
        if s.get("punch"):
            b = math.ceil((h0 + 0.4) / BEAT) * BEAT
            js.append(f'      tl.fromTo("{w_}", {{scale: 1.0}}, {{scale: 1.03, duration: 0.09, ease: "power2.out", yoyo: true, repeat: 1, immediateRender: false}}, {r3(b)});')
        # exit (the next segment's transition drives it)
        t1 = s["t1"]
        if tout == "whip":
            js.append(f'      tl.to("{w_}", {{x: -1250, skewX: 14, duration: 0.24, ease: "power3.in"}}, {r3(t1 - 0.22)});')
        elif tout == "push":
            js.append(f'      tl.to("{w_}", {{y: -1600, rotation: -2.5, duration: 0.30, ease: "power3.in"}}, {r3(t1 - 0.26)});')
        elif tout == "zoom":
            js.append(f'      tl.to("{w_}", {{scale: 2.3, opacity: 0, duration: 0.30, ease: "power2.in"}}, {r3(t1 - 0.28)});')
        elif tout == "flip":
            js.append(f'      tl.to("{w_}", {{rotationY: 88, duration: 0.18, ease: "power2.in"}}, {r3(t1 - 0.18)});')
    return comp("posts", css, "\n".join(body), "\n".join(js))


# ----------------------------------------------------------------------------------------------- voice cards
def split_pages(words, maxw=6, maxline=3):
    """words [{w,t,e}] -> pages [[line[word...]...]] breaking at punctuation first"""
    pages, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        punct = bool(re.search(r"[.,;:!?]$", w["w"]))
        if len(cur) >= maxw or (punct and len(cur) >= 2) or i == len(words) - 1:
            pages.append(cur)
            cur = []
    out = []
    for pg in pages:
        lines, ln = [], []
        for w in pg:
            ln.append(w)
            if len(ln) >= maxline or (re.search(r"[,;:]$", w["w"]) and len(ln) >= 2):
                lines.append(ln)
                ln = []
        if ln:
            lines.append(ln)
        out.append(lines)
    return out


def layout_pages(s, words):
    lay = s.get("layout")
    if not lay:
        return split_pages(words, s.get("page_words", 6), s.get("line_words", 3))
    pages, k = [], 0
    for pg in lay.split(" / "):
        lines = []
        for ln in pg.split(" | "):
            toks = ln.split()
            lines.append(words[k:k + len(toks)])
            for tk, w in zip(toks, words[k:k + len(toks)]):
                if re.sub(r"\W", "", tk).lower() != re.sub(r"\W", "", w["w"]).lower():
                    raise SystemExit(f"layout of {s['vo']}: '{tk}' does not match the spoken word '{w['w']}'")
            k += len(toks)
        pages.append(lines)
    if k != len(words):
        raise SystemExit(f"layout of {s['vo']} has {k} words, the voice has {len(words)}")
    return pages


def build_cards():
    css = f"""    #root .card {{ position: absolute; inset: 0; }}
    #root .kick {{ position: absolute; left: 0; right: 0; text-align: center; font-family: "Barlow Condensed"; font-weight: 700; font-size: 44px;
      letter-spacing: .14em; color: {WHITE}; }}
    #root .kick span {{ display: inline-block; padding: 10px 26px 8px; border-radius: 8px; background: rgba(255,255,255,.08); border: 2px solid rgba(255,255,255,.18); }}
    #root .page {{ position: absolute; left: 70px; right: 70px; text-align: center; font-family: "Bebas Neue"; line-height: .92; color: {WHITE};
      text-shadow: 0 10px 40px rgba(0,0,0,.6); }}
    #root .page .w {{ display: inline-block; margin: 0 .09em; }}
    #root .page .hl {{ color: {AMB}; }}
    #root .page .r {{ color: {RED}; }}
    #root .page .b {{ color: #6aa6ff; }}
    #root .src {{ position: absolute; left: 0; right: 0; top: 1192px; text-align: center; font-family: "Inter"; font-weight: 500; font-size: 28px;
      color: rgba(244,246,250,.62); letter-spacing: .02em; }}
    #root .fan {{ position: absolute; border-radius: 18px; box-shadow: 0 30px 80px rgba(0,0,0,.7); }}
    #root .rule {{ position: absolute; left: 340px; width: 400px; height: 6px; border-radius: 3px;
      background: linear-gradient(90deg, {RED}, {RED} 49%, {BLUE} 51%, {BLUE}); }}"""
    body, js = [], []
    for s in segs:
        if s["type"] not in ("hook", "vo", "end"):
            continue
        cid = f"v{s['i']}"
        keep = {"whip": 0.12, "push": 0.14, "zoom": 0.16}.get(s["next_tin"], 0.0)
        inner = []
        st0 = s["t0"]
        if s.get("kicker"):
            inner.append(f'<div class="kick" id="{cid}k" style="top:{s.get("kicker_y", 360)}px"><span>{html.escape(s["kicker"])}</span></div>')
            if s["type"] != "hook":  # the hook's kicker is on screen at frame 0 (the thumbnail)
                js.append(f'      tl.fromTo("#{cid}k", {{opacity: 0, y: -24}}, {{opacity: 1, y: 0, duration: 0.25, ease: "power3.out"}}, {r3(st0 + 0.06)});')
        if s["type"] == "hook":
            # frame 0: real posts fanned behind the title (dimmed), the title already on screen
            for j, n in enumerate(s.get("fan", [])):
                pst = next((q for q in post_segs if q["n"] == n), None)
                if not pst:
                    continue
                fw = 760
                fh = round(pst["ch"] * fw / pst["cw"])
                rot = (-9, 7, -3)[j % 3]
                x = (130, 210, 160)[j % 3]
                y = (300, 720, 1050)[j % 3] - fh / 2 + 120
                inner.append(f'<img class="fan" id="{cid}f{j}" src="{pst["src"]}" alt="" style="left:{x}px;top:{y:.0f}px;width:{fw}px;height:{fh}px;opacity:.22">')
                js.append(f'      tl.fromTo("#{cid}f{j}", {{rotation: {rot}, y: 0, scale: 1}}, {{rotation: {rot * 0.4:.1f}, y: {-40 - 20 * j}, scale: 1.06, duration: {r3(s["dur"])}, ease: "none"}}, 0);')
            for j, line in enumerate(s.get("title", [])):
                inner.append(f'<div class="page" id="{cid}t{j}" style="top:{560 + j * 190}px;font-size:{s.get("title_px", 200)}px">{html.escape(line)}</div>')
            inner.append(f'<div class="rule" id="{cid}ru" style="top:{560 + len(s.get("title", [])) * 190 + 30}px"></div>')
            js.append(f'      tl.fromTo("#{cid}ru", {{scaleX: 0.2}}, {{scaleX: 1, duration: 0.5, ease: "power3.out"}}, 0);')
            title_out = r3(s["vo_at"] + 0.02)
            for j in range(len(s.get("title", []))):
                js.append(f'      tl.to("#{cid}t{j}", {{opacity: 0, y: -30, duration: 0.14, ease: "power2.in"}}, {title_out});')
            js.append(f'      tl.to("#{cid}ru", {{opacity: 0, duration: 0.14}}, {title_out});')
        words = vword_times(s)
        pages = layout_pages(s, words)
        hlw = {w.lower() for w in s.get("highlight", [])}
        redw = {w.lower() for w in s.get("red", [])}
        bluew = {w.lower() for w in s.get("blue", [])}
        for pi, lines in enumerate(pages):
            pid = f"{cid}p{pi}"
            longest = max(sum(len(w["w"]) for w in ln) + len(ln) - 1 for ln in lines)
            fs = min(s.get("max_px", 168), int(900 / (0.42 * max(longest, 4))))
            top = s.get("page_y", 680) - (len(lines) * fs * 0.92) / 2 + (0 if s["type"] != "hook" else 120)
            if s.get("kicker"):  # never under the kicker pill
                top = max(top, s.get("kicker_y", 360) + 110)
            spans = []
            for li, ln in enumerate(lines):
                for wi, w in enumerate(ln):
                    key = re.sub(r"[^\w$']", "", w["w"]).lower()
                    cl = "w" + (" hl" if key in hlw else "") + (" r" if key in redw else "") + (" b" if key in bluew else "")
                    wid = f"{pid}_{li}_{wi}"
                    spans.append(f'<span class="{cl}" id="{wid}">{html.escape(w["w"].upper())}</span>')
                    js.append(f'      tl.fromTo("#{wid}", {{opacity: 0, y: 40, scale: 1.18}}, {{opacity: 1, y: 0, scale: 1, duration: 0.12, ease: "power3.out"}}, {r3(w["t"] - 0.03)});')
                spans.append("<br>")
            inner.append(f'<div class="page" id="{pid}" style="top:{top:.0f}px;font-size:{fs}px">{"".join(spans[:-1])}</div>')
            # a page leaves when the next page starts (the last stays to the card's end)
            if pi + 1 < len(pages):
                t_out = pages[pi + 1][0][0]["t"] - 0.06
                js.append(f'      tl.to("#{pid}", {{opacity: 0, y: -26, duration: 0.08, ease: "power2.in"}}, {r3(t_out)});')
        if s.get("source"):
            inner.append(f'<div class="src" id="{cid}s">{html.escape(s["source"])}</div>')
            js.append(f'      tl.fromTo("#{cid}s", {{opacity: 0}}, {{opacity: 1, duration: 0.3}}, {r3(st0 + 0.4)});')
        if s["type"] == "end":
            for j, line in enumerate(s.get("footer", [])):
                inner.append(f'<div class="src" id="{cid}e{j}" style="top:{1120 + j * 44}px">{html.escape(line)}</div>')
                js.append(f'      tl.fromTo("#{cid}e{j}", {{opacity: 0}}, {{opacity: 1, duration: 0.4}}, {r3(st0 + 0.5 + 0.15 * j)});')
        # card exit when the next segment zooms/whips in
        nt = s["next_tin"]
        if nt in ("whip", "push", "zoom"):
            to = {"whip": "x: -1250", "push": "y: -1500", "zoom": "scale: 1.8, opacity: 0"}[nt]
            js.append(f'      tl.to("#{cid}in", {{{to}, duration: 0.26, ease: "power3.in"}}, {r3(s["t1"] - 0.24)});')
        body.append(f'    <div class="clip card" id="{cid}" data-start="{r3(st0)}" data-duration="{r3(s["dur"] + keep)}" data-track-index="0">'
                    f'<div id="{cid}in" style="position:absolute;inset:0">{"".join(inner)}</div></div>')
        # card entry
        if s["type"] != "hook":
            ent = {"zoom": ('{scale: 0.6, opacity: 0}', '{scale: 1, opacity: 1, duration: 0.32, ease: "power3.out"}'),
                   "push": ('{y: 1500}', '{y: 0, duration: 0.34, ease: "power3.out"}'),
                   "whip": ('{x: 1250}', '{x: 0, duration: 0.3, ease: "power3.out"}'),
                   "slam": ('{scale: 1.4, opacity: 0}', '{scale: 1, opacity: 1, duration: 0.16, ease: "power4.out"}')}.get(s["tin"])
            if ent:
                js.append(f'      tl.fromTo("#{cid}in", {ent[0]}, {ent[1]}, {r3(st0 - 0.02)});')
    return comp("cards", css, "\n".join(body), "\n".join(js))


# ----------------------------------------------------------------------------------------------- overlay HUD
def build_overlay():
    hud_end = end_t
    css = f"""    #root .top {{ position: absolute; left: 60px; right: 60px; top: 190px; height: 64px; }}
    #root .live {{ position: absolute; left: 0; top: 6px; font-family: "Barlow Condensed"; font-weight: 700; font-size: 44px; letter-spacing: .12em; color: {WHITE}; }}
    #root .dot {{ display: inline-block; width: 20px; height: 20px; border-radius: 50%; background: {RED}; margin-right: 16px; vertical-align: 4px;
      box-shadow: 0 0 18px {RED}; }}
    #root .cnt {{ position: absolute; right: 0; top: 10px; font-family: "Roboto Mono"; font-weight: 600; font-size: 38px; color: rgba(244,246,250,.85); }}
    #root .cnt b {{ color: {WHITE}; }}
    #root .tag {{ position: absolute; left: 60px; font-family: "Barlow Condensed"; font-weight: 700; font-size: 48px; letter-spacing: .1em; color: {WHITE};
      padding: 6px 22px 4px 18px; border-left: 8px solid {RED}; background: linear-gradient(90deg, rgba(255,255,255,.12), rgba(255,255,255,0)); }}
    #root .tag.bl {{ border-left-color: {BLUE}; }}
    #root .chip {{ position: absolute; right: 60px; font-family: "Barlow Condensed"; font-weight: 700; font-size: 42px; letter-spacing: .08em;
      padding: 8px 20px 6px; border-radius: 10px; color: #0a0d14; background: {AMB}; box-shadow: 0 12px 30px rgba(0,0,0,.45); }}
    #root .chip.likes {{ background: #ff2f6e; color: #fff; }}
    #root .chip.note {{ background: {WHITE}; color: #0a0d14; }}
    #root .tick {{ position: absolute; left: 0; right: 0; top: 1262px; height: 58px; background: rgba(5,7,12,.82); border-top: 2px solid rgba(255,255,255,.10); overflow: hidden; }}
    #root .tick .lab {{ position: absolute; left: 0; top: 0; bottom: 0; width: 210px; background: {RED}; color: #fff; font-family: "Barlow Condensed"; font-weight: 700;
      font-size: 36px; letter-spacing: .12em; line-height: 58px; text-align: center; z-index: 2; }}
    #root .tick .run {{ position: absolute; left: 230px; top: 0; white-space: nowrap; font-family: "Barlow Condensed"; font-weight: 600; font-size: 36px;
      line-height: 58px; letter-spacing: .05em; color: rgba(244,246,250,.92); }}
    #root .flash {{ position: absolute; inset: 0; background: #fff; opacity: 0; }}"""
    body, js = [], []
    body.append(f'    <div class="clip" id="hud" data-start="0" data-duration="{r3(hud_end)}" data-track-index="0">'
                f'<div class="top" id="topbar"><div class="live"><span class="dot" id="dot"></span>{html.escape(E.get("top_label", "MIDTERMS 2026"))}</div>'
                f'<div class="cnt" id="cntbox"></div></div></div>')
    # blinking live dot (finite)
    nb = int(hud_end)
    js.append(f'      tl.fromTo("#dot", {{opacity: 1}}, {{opacity: 0.25, duration: 0.5, ease: "steps(1)", yoyo: true, repeat: {max(1, nb * 1 - 1)}}}, 0);')
    # post counter: one clip per post so it is editable
    for s in post_segs:
        body.append(f'    <div class="clip" id="n{s["k"]}" data-start="{r3(s["t0"])}" data-duration="{r3(s["dur"])}" data-track-index="1">'
                    f'<div class="cnt" style="right:60px;top:200px" id="n{s["k"]}t"><b>{s["k"]:02d}</b> / {NPOST:02d}</div></div>')
        js.append(f'      tl.fromTo("#n{s["k"]}t", {{y: 30, opacity: 0}}, {{y: 0, opacity: 1, duration: 0.18, ease: "power3.out"}}, {r3(s["t0"] + 0.02)});')
    # chapter tags: a tag spans its consecutive posts
    k = 0
    while k < len(post_segs):
        s = post_segs[k]
        tg = s.get("tag")
        j = k
        while j + 1 < len(post_segs) and post_segs[j + 1].get("tag") == tg and post_segs[j + 1]["t0"] == post_segs[j]["t1"]:
            j += 1
        if tg:
            t0, t1 = s["t0"], post_segs[j]["t1"]
            top = min(q["cy"] for q in post_segs[k:j + 1]) - 92
            top = max(262, top)  # just under the top bar (190-254)
            tid = f"tag{k}"
            side = "bl" if (k // 1) % 2 else ""
            body.append(f'    <div class="clip" id="{tid}" data-start="{r3(t0)}" data-duration="{r3(t1 - t0)}" data-track-index="2">'
                        f'<div class="tag {side}" id="{tid}b" style="top:{top}px">{html.escape(tg)}</div></div>')
            js.append(f'      tl.fromTo("#{tid}b", {{x: -300, opacity: 0}}, {{x: 0, opacity: 1, duration: 0.26, ease: "power3.out"}}, {r3(t0 + 0.08)});')
        k = j + 1
    # chips (likes, satire, timing notes): above the card's top-right corner
    ci = 0
    for s in post_segs:
        for c in s.get("chips", []):
            cid = f"chip{ci}"
            ci += 1
            top = min(s["cy"] + s["ch"] - 40, 1180) + 70 * c.get("row", 0)  # never on the ticker (y 1262)
            t_in = s["t0"] + TR_IN[s["tin"]] + c.get("delay", 0.35)
            body.append(f'    <div class="clip" id="{cid}" data-start="{r3(s["t0"])}" data-duration="{r3(s["dur"])}" data-track-index="3">'
                        f'<div class="chip {c.get("kind", "")}" id="{cid}b" style="top:{top}px;right:{W - s["cx"] - s["cw"] + 28}px">{html.escape(c["text"])}</div></div>')
            js.append(f'      tl.fromTo("#{cid}b", {{scale: 0.4, opacity: 0, rotation: -9}}, {{scale: 1, opacity: 1, rotation: -3, duration: 0.22, ease: "back.out(2.6)"}}, {r3(t_in)});')
    # ticker
    items = E.get("ticker", [])
    if items:
        run = "   ●   ".join(items) + "   ●   "
        reps = int(hud_end * 110 / (len(run) * 15)) + 2  # enough copies to cover the whole scroll (~15+ px per char)
        run = html.escape(run * reps)
        body.append(f'    <div class="clip" id="ticker" data-start="0" data-duration="{r3(hud_end)}" data-track-index="4">'
                    f'<div class="tick" data-layout-allow-overlap data-layout-allow-overflow><div class="lab">{html.escape(E.get("ticker_label", "LATEST"))}</div><div class="run" id="tickrun">{run}</div></div></div>')
        js.append(f'      tl.fromTo("#tickrun", {{x: 0}}, {{x: {-int(hud_end * 110)}, duration: {r3(hud_end)}, ease: "none"}}, 0);')
    # flash frames on slams
    fi = 0
    for s in segs:
        if s["tin"] == "slam" and s["i"] > 0:
            body.append(f'    <div class="clip" id="fl{fi}" data-start="{r3(s["t0"])}" data-duration="0.2" data-track-index="5"><div class="flash" id="fl{fi}b"></div></div>')
            js.append(f'      tl.fromTo("#fl{fi}b", {{opacity: 0.38}}, {{opacity: 0, duration: 0.16, ease: "power2.out"}}, {r3(s["t0"])});')
            fi += 1
    return comp("overlay", css, "\n".join(body), "\n".join(js))


# ----------------------------------------------------------------------------------------------- write
os.makedirs(os.path.join(ROOT, "compositions"), exist_ok=True)
for name, fn in (("bg", build_bg), ("posts", build_posts), ("cards", build_cards), ("overlay", build_overlay)):
    open(os.path.join(ROOT, "compositions", f"{name}.html"), "w", encoding="utf-8").write(fn())

index = f"""<!doctype html>
<html lang="en" data-size="{W}x{H}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: {W}px; height: {H}px; overflow: hidden; background: #05070c; }}
      #root {{ position: relative; width: 100%; height: 100%; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="{W}" data-height="{H}">
      <div id="bg" data-composition-id="bg" data-composition-src="compositions/bg.html" data-start="0" data-duration="{DUR}" data-track-index="0" data-track-kind="graphics" data-width="{W}" data-height="{H}" style="z-index: 1"></div>
      <div id="posts" data-composition-id="posts" data-composition-src="compositions/posts.html" data-start="0" data-duration="{DUR}" data-track-index="1" data-track-kind="graphics" data-width="{W}" data-height="{H}" style="z-index: 2"></div>
      <div id="cards" data-composition-id="cards" data-composition-src="compositions/cards.html" data-start="0" data-duration="{DUR}" data-track-index="2" data-track-kind="captions" data-width="{W}" data-height="{H}" style="z-index: 3"></div>
      <div id="overlay" data-composition-id="overlay" data-composition-src="compositions/overlay.html" data-start="0" data-duration="{DUR}" data-track-index="3" data-track-kind="graphics" data-width="{W}" data-height="{H}" style="z-index: 4"></div>
      <audio id="mix" class="clip" src="assets/audio/final.m4a" data-start="0" data-duration="{DUR}" data-track-index="20" data-volume="1"></audio>
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
"""
open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(index)


# the voice in film time (QA, Whisper checks and the kit's scripts PDF read this)
placed = {"voice": VOJ.get("voice"), "duration": DUR, "lines": []}
for s in segs:
    if "vo" in s:
        l = VL[s["vo"]]
        off = s["vo_at"] - l["start"]
        placed["lines"].append({"id": l["id"], "text": l.get("text", ""), "start": r3(s["vo_at"]), "end": r3(l["end"] + off),
                                "words": [{"w": w["w"], "start": r3(w["start"] + off), "end": r3(w["end"] + off)} for w in l["words"]]})
nw = sum(len(l["words"]) for l in placed["lines"])
placed["wpm"] = round(nw / (DUR / 60), 1)
os.makedirs(os.path.join(ROOT, "vo", "data"), exist_ok=True)
json.dump(placed, open(os.path.join(ROOT, "vo", "data", "vo.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# SRT: the voice, phrase by phrase (the pages the cards show)
def srt_t(x):
    ms = int(round(x * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


cues_srt = []
for s in segs:
    if "vo" not in s:
        continue
    ws = vword_times(s)
    for pg in layout_pages(s, ws):
        flat = [w for ln in pg for w in ln]
        cues_srt.append((flat[0]["t"], flat[-1]["e"] + 0.15, " ".join(w["w"] for w in flat)))
os.makedirs(os.path.join(ROOT, "out"), exist_ok=True)
with open(os.path.join(ROOT, "out", f"{NAME}.srt"), "w", encoding="utf-8") as f:
    for i, (a, b, txt) in enumerate(cues_srt):
        b = min(b, cues_srt[i + 1][0] - 0.02) if i + 1 < len(cues_srt) else b
        f.write(f"{i + 1}\n{srt_t(a)} --> {srt_t(b)}\n{txt}\n\n")

# schedule + reading gate
os.makedirs(os.path.join(ROOT, "scratch"), exist_ok=True)
rows, fails = [], 0
for s in segs:
    if s["type"] == "post":
        p = POSTS[s["n"]]
        rate = s["words"] / s["readable"] if s["readable"] > 0 else 99
        ok = s["readable"] >= MIN_HOLD - 1e-6 and rate <= 4.0 + 1e-6
        fails += not ok
        rows.append(f"{s['t0']:7.2f} {s['t1']:7.2f} {s['dur']:5.2f}  post #{s['n']:<2} {p['handle']:<18} {s['tin']:<6} words {s['words']:>3}  "
                    f"readable {s['readable']:.2f}s  {rate:.2f} w/s  {'ok' if ok else 'FAIL'}  card {s['cw']}x{s['ch']} text~{s['fontpx']}px")
    else:
        rows.append(f"{s['t0']:7.2f} {s['t1']:7.2f} {s['dur']:5.2f}  {s['type']:<4} {s.get('vo', ''):<12} {s['tin']:<6} vo {vo_len(s['vo']):.2f}s at {s['vo_at']:.2f}")
json.dump([{"n": s["n"], "handle": POSTS[s["n"]]["handle"], "t0": r3(s["t0"]), "t1": r3(s["t1"]), "words": s["words"],
            "readable_s": r3(s["readable"]), "words_per_s": round(s["words"] / s["readable"], 2), "min_hold": MIN_HOLD,
            "ok": s["readable"] >= MIN_HOLD - 1e-6 and s["words"] / s["readable"] <= 4.0 + 1e-6,
            "screenshot": POSTS[s["n"]]["screenshot"], "shown_as": s["src"], "card_px": [s["cw"], s["ch"]]}
           for s in post_segs], open(os.path.join(ROOT, "score", "reading.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
open(os.path.join(ROOT, "scratch", "schedule.txt"), "w", encoding="utf-8").write("\n".join(rows) + f"\n\nduration {DUR}s, posts {NPOST}, reading-gate fails {fails}\n")
print("\n".join(rows))
print(f"duration {DUR}s  posts {NPOST}  sections {len(sections)}  cues {len(cues)}  reading-gate fails {fails}")

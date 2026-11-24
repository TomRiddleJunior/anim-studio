"""Holding Pattern — builds the narrated in-flight satire from the voiceover's word times.

Three layers share one camera (assets/lib/film.js):
  globe   three.js NASA Blue Marble planet / dotted orb (compositions/globe.html)
  paper   dossier documents lying ON the real imagery — evidence clippings, a ruled index card, typed slips and
          investigative data cards — pinned to lat/lon, so whips and pull-outs move paper and planet together
          (compositions/t-*.html, runtime assets/lib/desk.js)
  cabin   the flight furniture: departures board + cabin-window opening, top bar, arrival strip with a status
          chip, passport-style stamps, an arrivals board at the end

usage: python -I tools/build_film.py          (reads vo/data/vo.json; writes assets/lib/film-data.js, index.html,
                                            compositions/*.html, score/data/cues.json)
"""
import json
import math
import os
import random
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
DUR = round(VO["duration"], 2)
D2R = math.pi / 180
PXS = 540 / math.tan(17.5 * D2R)
A_REF = 0.145
OY_DESK = 46  # paper frames centre a little low: the console strips own the top 136 px
PPD = PXS / A_REF * D2R  # desk px per degree at the reference altitude (desk px = ground px there)

LINES = {l["id"]: l for l in VO["lines"]}


def _norm(s):
    return re.sub(r"[^a-z0-9'\-]", "", s.lower())


def w(line, word, k=0, end=False):
    """start (or end) time of the k-th word in a narration line that starts with `word`"""
    hits = [x for x in LINES[line]["words"] if _norm(x["w"]).startswith(_norm(word))]
    x = hits[k]
    return x["end"] if end else x["start"]


def ls(line):
    return LINES[line]["start"]


def le(line):
    return LINES[line]["end"]


HOT = {
    "hormuz": dict(lat=26.6, lon=56.3, patch=dict(src="assets/img/patch-hormuz.jpg", lonMin=49.25417, lonMax=68.26667, latMax=35.1, latMin=18.1)),
    "alaska": dict(lat=58.3, lon=-134.42, patch=dict(src="assets/img/patch-alaska.jpg", lonMin=-146.40833, lonMax=-114.05833, latMax=66.8, latMin=49.8)),
    "israel": dict(lat=31.78, lon=35.22, patch=dict(src="assets/img/patch-israel.jpg", lonMin=27.80833, lonMax=47.80833, latMax=40.27917, latMin=23.27917)),
    "brazil": dict(lat=-15.79, lon=-47.88, patch=dict(src="assets/img/patch-brazil.jpg", lonMin=-54.425, lonMax=-36.75833, latMax=-7.29167, latMin=-24.29167)),
    "serbia": dict(lat=44.82, lon=20.46, patch=dict(src="assets/img/patch-serbia.jpg", lonMin=11.57917, lonMax=35.54583, latMax=53.32083, latMin=36.32083)),
    "venezuela": dict(lat=10.49, lon=-66.88, patch=dict(src="assets/img/patch-venezuela.jpg", lonMin=-73.2875, lonMax=-56.0, latMax=18.99167, latMin=1.99167)),
}
ORDER = ["hormuz", "alaska", "israel", "brazil", "serbia", "venezuela"]
EV = json.load(open(os.path.join(ROOT, "tools", "evidence.json"), encoding="utf-8"))


def desk_ll(tk, x, y):
    h = HOT[tk]
    return h["lat"] - y / PPD, h["lon"] + x / (PPD * math.cos(h["lat"] * D2R))


# ============================================================================ schedule from the voice
LAST = {"hormuz": "h5", "alaska": "a5", "israel": "i4", "brazil": "b4", "serbia": "s4", "venezuela": "v3"}
SCHED = {}
OPEN = dict(board_out=round(w("o3", "seatbelts") - 0.1, 3))
OPEN["push0"] = round(le("o3") + 0.25, 3)
F = round(le("o3") + 1.55, 3)
OPEN["push1"] = F
for tk in ORDER:
    L = round(F + 2.2, 3)
    P = round(le(LAST[tk]) + 0.15, 3)
    Q = round(P + 0.85, 3)
    SCHED[tk] = dict(F=F, L=L, P=P, Q=Q)
    F = Q
BOARD = dict(rise=SCHED["venezuela"]["Q"])
BOARD["flat0"] = round(BOARD["rise"] + 0.55, 3)
BOARD["flat1"] = round(BOARD["flat0"] + 1.7, 3)
LEDGER_WORDS = [("hormuz", "closed"), ("alaska", "court"), ("israel", "delayed"), ("brazil", "disputed"),
                ("serbia", "conceded"), ("venezuela", "home")]
BOARD["pingHits"] = [dict(id=tk, t=round(w("r2", word), 3)) for tk, word in LEDGER_WORDS]
END_T = round(ls("e1") - 0.45, 3)

STAMPS = []      # every rubber-stamp hit (camera shake + sfx)
CUES = []        # sound cues


def cue(t, kind, gain=0.6, pitch=1.0, pan=None):
    c = {"t": round(t, 3), "type": kind, "gain": gain, "pitch": pitch}
    if pan is not None:
        c["pan"] = pan
    CUES.append(c)


# ============================================================================ camera keys
KEYS = [dict(t=0, lat=16, lon=14, alt=4.7, ox=0, oy=0, r=0),
        dict(t=OPEN["push0"], lat=20, lon=26, alt=4.5, ox=0, oy=0, r=0, e="linear"),
        dict(t=OPEN["push1"], lat=24, lon=40, alt=2.6, ox=0, oy=0, r=0, e="power2.inOut", ae="power2.inOut")]


def angle(a, b):
    def v(p):
        la, lo = p[0] * D2R, p[1] * D2R
        return (math.cos(la) * math.cos(lo), math.cos(la) * math.sin(lo), math.sin(la))
    A, B = v(a), v(b)
    return math.acos(max(-1, min(1, sum(i * j for i, j in zip(A, B)))))


def desk_key(tk, t, x, y, s, r, e, ae=None):
    lat, lon = desk_ll(tk, x, y)
    k = dict(t=round(t, 3), lat=round(lat, 5), lon=round(lon, 5), alt=round(A_REF / s, 5), ox=0, oy=OY_DESK, r=round(r, 3), e=e)
    if ae:
        k["ae"] = ae
    KEYS.append(k)


def camera_stop(tk, land, beats):
    """land = (x, y, s, r); beats = [(t, kind, (x, y, s, r), dur)] kind: whip | push"""
    S = SCHED[tk]
    h = HOT[tk]
    prev = KEYS[-1]
    hop = 0.9 * angle((prev["lat"], prev["lon"]), (h["lat"], h["lon"])) / math.pi
    KEYS.append(dict(t=round(S["F"] + 1.1, 3), lat=h["lat"], lon=h["lon"], alt=2.0, ox=0, oy=0, r=0, e="power2.inOut", ae="power2.out", hop=round(hop, 4)))
    desk_key(tk, S["L"], *land, e="power2.inOut", ae="power2.inOut")
    cur = dict(t=S["L"], x=land[0], y=land[1], s=land[2], r=land[3])

    def hold_to(t):
        dt = t - cur["t"]
        if dt <= 0.02:
            return
        cur["s"] *= 1 + 0.011 * dt   # breathing push on every hold (dossier grammar)
        cur["r"] += 0.05 * dt
        cur["t"] = t
        desk_key(tk, t, cur["x"], cur["y"], cur["s"], cur["r"], "linear")

    for t, kind, (x, y, s, r), dur in beats:
        hold_to(t)
        if kind == "whip":
            ox_, oy_ = x + (x - cur["x"]) * 0.035, y + (y - cur["y"]) * 0.035
            kick = 1.6 if x >= cur["x"] else -1.6
            desk_key(tk, t + 0.37, ox_, oy_, s, r + kick, "expo.inOut")
            desk_key(tk, t + 0.52, x, y, s, r, "sine.out")
            cue(t + 0.05, "swoosh", 0.5, 1.0 + 0.08 * ((len(CUES) % 3) - 1))
            cur.update(t=t + 0.52, x=x, y=y, s=s, r=r)
        else:
            desk_key(tk, t + dur, x, y, s, r, "power2.inOut")
            cur.update(t=t + dur, x=x, y=y, s=s, r=r)
    hold_to(S["P"])
    KEYS.append(dict(t=S["Q"], lat=h["lat"], lon=h["lon"], alt=1.45, ox=0, oy=0, r=0, e="power2.inOut", ae="power2.in"))
    cue(S["F"] + 0.05, "whoosh", 0.55, 0.92 + 0.04 * ORDER.index(tk))
    cue(S["F"] - 0.25, "ding", 0.42, 1.26)  # cabin chime (ding-dong) before every announcement
    cue(S["F"] + 0.08, "ding", 0.42, 1.0)
    cue(S["F"] + 1.15, "woosh_low", 0.5)
    cue(S["P"] + 0.05, "zoom_out", 0.42)


# ============================================================================ HTML pieces
def jag(w, h, seed, edges="b", amp=9, step=26):
    """polygon with torn edges (deterministic)"""
    rnd = random.Random(seed)
    pts = []
    def run(x0, y0, x1, y1, torn):
        n = max(2, int(math.hypot(x1 - x0, y1 - y0) / step))
        for i in range(n):
            u = i / n
            x, y = x0 + (x1 - x0) * u, y0 + (y1 - y0) * u
            if torn and 0 < i:
                dx, dy = (y1 - y0), -(x1 - x0)
                L = math.hypot(dx, dy)
                o = rnd.uniform(-amp, amp * 0.4)
                x, y = x + dx / L * o, y + dy / L * o
            pts.append((x, y))
    run(0, 0, w, 0, "t" in edges)
    run(w, 0, w, h, "r" in edges)
    run(w, h, 0, h, "b" in edges)
    run(0, h, 0, 0, "l" in edges)
    return "polygon(" + ", ".join(f"{x:.1f}px {y:.1f}px" for x, y in pts) + ")"


def stamp_html(sid, text, left, top, fs, rot, small_top="", small_bottom=""):
    """passport-style entry stamp: a small mono line, the status word(s) in heavy serif, a small mono line"""
    t = "<br>".join(text.split("|"))
    st = f'<span class="st-s" data-layout-ignore>{small_top}</span>' if small_top else ""
    sb = f'<span class="st-s" data-layout-ignore>{small_bottom}</span>' if small_bottom else ""
    body = f'{st}<span class="st-w">{t}</span>{sb}'
    return (f'<div class="stamp" id="{sid}" style="left:{left}px; top:{top}px;">'
            f'<div class="stamp-in" style="font-size:{fs}px; transform: rotate({rot}deg);">{body}</div>'
            f'<div class="stamp-in ghost" style="font-size:{fs}px; transform: rotate({rot}deg);">{body}</div></div>')


def doc_open(did, w, h, cls, color, seed, edges="b"):
    return (f'<div class="doc" id="{did}" data-layout-allow-overflow data-layout-allow-overlap style="width:{w}px; height:{h}px;">'
            f'<div class="doc-in" id="{did}-in"><div class="paper {cls}" style="--pc:{color}; clip-path: {jag(w, h, seed, edges)};">')


DOC_CLOSE = "</div></div>"


def pin(x, y):
    return f'<div class="pin" style="left:{x - 13}px; top:{y - 13}px;"></div>'


def tape(x, y, rot, wd=150):
    return f'<div class="tape" style="left:{x}px; top:{y}px; width:{wd}px; transform: rotate({rot}deg);"></div>'


class Desk:
    def __init__(self, tk, P, n):
        self.tk, self.P, self.n = tk, P, n
        self.docs = []      # (id, x, y, w, h, rot, html)
        self.js = []

    def add(self, did, x, y, w, h, rot, html):
        lat, lon = desk_ll(self.tk, x, y)
        self.docs.append(dict(id=did, x=x, y=y, w=w, h=h, rot=rot, lat=round(lat, 6), lon=round(lon, 6), html=html))

    def ev(self, s):
        self.js.append(s)

    # ---- document kinds
    def clip(self, key, x, y, rot, width, extra="", seed=1):
        e = EV[self.tk]
        ih = round(width * e["h"] / e["w"])
        W, H = width + 44, 70 + ih + 34
        did = f"{self.P}-clip"
        meta = CLIPS[self.tk]
        kp = e["key_pct"]
        box_cls = "ev-box under" if meta.get("under") else "ev-box"
        h = doc_open(did, W, H, "clipdoc", "#f6f4ee", seed, "b")
        h += (f'<div class="ev-head"><span>EVIDENCE</span> · <b>{meta["outlet"]}</b> · <span>{meta["date"]}</span></div>'
              f'<div class="ev-img" style="width:{width}px; height:{ih}px;"><img src="assets/evidence/{self.tk}.png" alt="{meta["alt"]}" />'
              f'<div class="{box_cls}" id="{self.P}-box" style="left:{kp[0] - 0.6:.2f}%; top:{kp[1] - 0.8:.2f}%; width:{kp[2] + 1.2:.2f}%; height:{kp[3] + 1.6:.2f}%;"></div></div>')
        h += extra + "</div>" + pin(W / 2, 22) + tape(-28, H * 0.62, -62, 130) + DOC_CLOSE
        self.add(did, x, y, W, H, rot, h)
        return did, W, H

    def data(self, did, x, y, rot, W, H, label_r, source, body, seed=3):
        h = doc_open(did, W, H, "dcard", "#ebe2d3", seed, "")
        h += (f'<div class="dc-chrome"><span class="dc-tick"></span>IN-FLIGHT BRIEFING</div>'
              f'<div class="dc-chrome-r">{label_r}</div>'
              f'<div class="dc-foot" data-layout-ignore><span>SOURCE / {source}</span>'
              f'<div class="dc-hair"><div class="dc-prog" style="width:{self.n / 6 * 100:.1f}%"></div></div></div>')
        h += body + "</div>" + pin(W / 2, 20) + DOC_CLOSE
        self.add(did, x, y, W, H, rot, h)

    def slip(self, did, x, y, rot, W, H, body, seed=5):
        h = doc_open(did, W, H, "slipdoc", "#e8dfcb", seed, "tb")
        h += body + "</div>" + tape(W - 120, -16, 6, 140) + tape(-20, H - 30, -8, 120) + DOC_CLOSE
        self.add(did, x, y, W, H, rot, h)

    def tag(self, place, coords, side="r"):
        # the location tag, pinned to the ground beside the ping
        W, H = 640, 112
        x = 40 + W / 2 if side == "r" else -40 - W / 2
        did = f"{self.P}-tag"
        h = (f'<div class="doc gtag" id="{did}" data-layout-allow-overflow style="width:{W}px; height:{H}px;">'
             f'<div class="doc-in tag-in tag-{side}" id="{did}-in"><div class="tag-a"><span class="tag-dot"></span>{place}</div>'
             f'<div class="tag-b">{coords}</div></div></div>')
        self.add(did, x, 0, W, H, 0, h)


CLIPS = {
    "hormuz": dict(outlet="USNI NEWS", date="9 OCT 2026", alt="USNI News article, 9 Oct 2026"),
    "alaska": dict(outlet="AP · WDBJ7", date="23 OCT 2026", alt="AP story via WDBJ7, 23 Oct 2026", under=True),
    "israel": dict(outlet="CNN", date="27 OCT 2026", alt="CNN analysis, 27 Oct 2026"),
    "brazil": dict(outlet="NPR", date="25 OCT 2026", alt="NPR story, 25 Oct 2026"),
    "serbia": dict(outlet="EURONEWS", date="25 OCT 2026", alt="Euronews story, 25 Oct 2026"),
    "venezuela": dict(outlet="NPR · WGCU", date="25 OCT 2026", alt="NPR story via WGCU, 25 Oct 2026"),
}


def mono_lines(text, cpl):
    words, lines, cur = text.split(), [], ""
    for wd in words:
        if len(cur) + len(wd) + (1 if cur else 0) > cpl:
            lines.append(cur)
            cur = wd
        else:
            cur = (cur + " " + wd) if cur else wd
    if cur:
        lines.append(cur)
    return lines


def typed_block(pid, text, cpl, cls, top, left, lh, wid=None):
    """monospace lines, each its own element so the typewriter can uncover them one after another"""
    out, ids = [], []
    for i, line in enumerate(mono_lines(text, cpl)):
        lid = f"{pid}-{i}"
        ids.append((lid, len(line)))
        out.append(f'<div class="{cls}" id="{lid}" data-n="{len(line)}" style="left:{left}px; top:{top + i * lh}px;">{line}</div>')
    return "".join(out), ids


def type_seq(desk, ids, t0, cps):
    t = t0
    for lid, n in ids:
        desk.ev(f'D.type("{lid}", {t:.3f}, {cps});')
        cue(t, "type", 0.32)
        t += n / cps + 0.04
    return t


def header_html(P, n, title, meta, chip_words, sev):
    rows = "".join(f"<span>{c}</span>" for c in chip_words)
    return (f'<div class="arr" id="{P}-arr"><div class="arr-in" id="{P}-arr-in">'
            f'<span class="arr-id">STOP 0{n}</span><span class="arr-title">{title}</span><span class="arr-meta">{meta}</span>'
            f'<span class="arr-status"><span>STATUS</span><span class="chip" id="{P}-chip" data-layout-allow-overflow>'
            f'<span class="chip-roll" id="{P}-roll">{rows}</span></span></span></div></div>')


# ============================================================================ the six desks
DESKS = {}

# ---- stop: HORMUZ -------------------------------------------------------------------------------------------------
d = Desk("hormuz", "hz", 1)
d.tag("STRAIT OF HORMUZ", "26.6°N 56.3°E", side="l")
IW, IH = 980, 660
body = ('<div class="idx-margin"></div><div class="idx-head">PASSAGE LOG · STRAIT OF HORMUZ</div>'
        '<div class="idx-sub">status history as reported, since 28 Feb 2026</div>')
rows = [("hz-r0", "28 FEB   CLOSED", w("h2", "february")), ("hz-r1", "08 APR   REOPENED", w("h2", "april")),
        ("hz-r2", "LATE JUN CLOSED AGAIN", w("h2", "again")), ("hz-r3", "TODAY", w("h3", "it"))]
for i, (rid, text, _) in enumerate(rows):
    body += f'<div class="idx-line" id="{rid}" data-n="{len(text)}" style="top:{164 + i * 90}px;">{text}</div>'
body += stamp_html("hz-stamp", "CLOSED", 330, 410, 96, -8, "STATUS · 28 OCT 2026", "STRAIT OF HORMUZ")
h = doc_open("hz-idx", IW, IH, "idx", "#f2ede1", 11, "") + body + "</div>" + pin(IW / 2, 20) + tape(IW - 110, -14, 7, 150) + DOC_CLOSE
d.add("hz-idx", -560, 400, IW, IH, -2.2, h)
cid, CW, CH = d.clip("hormuz", 560, -520, 1.6, 800, seed=12)
qtext = "“A ship has been struck in the Strait of Hormuz nearly every day this month.”"
qb, qids = typed_block("hz-q", qtext, 38, "slip-q", 34, 44, 50)
body = qb + '<div class="hl" id="hz-hl" style="left:{}px; top:{}px; width:{}px;"></div>'
# highlighter under "nearly every day" (line 2 of the wrapped excerpt)
ql = mono_lines(qtext, 38)
li = next(i for i, x in enumerate(ql) if "nearly" in x)
cx = ql[li].index("nearly")
body = body.format(44 + cx * 22.8 - 4, 34 + li * 50 + 4, len("nearly every day") * 22.8 + 8)
body += '<div class="slip-att" id="hz-att" style="left:44px; top:{}px;">— INT’L MARITIME ORGANIZATION · USNI NEWS, 9 OCT</div>'.format(34 + len(ql) * 50 + 14)
d.slip("hz-slip", 650, -10, -1.3, 1000, 34 + len(ql) * 50 + 70, body, seed=13)
body = ('<div class="dc-label" style="left:64px; top:118px;">U.S. DIESEL · AVERAGE PER GALLON</div>'
        '<div class="dc-rule" style="left:64px; top:170px; height:92px;"></div>'
        '<div class="dc-mask" style="left:90px; top:166px;"><div class="dc-head" id="hz-h1" style="font-size:84px;">AT THE PUMP</div></div>'
        '<div class="dc-num" id="hz-num" style="left:84px; top:280px; font-size:210px;">$3.62</div>'
        '<div class="barrow" style="left:600px; top:290px; width:450px;"><div class="bar-name">A YEAR EARLIER</div>'
        '<div class="bar-val grey" id="hz-v0">$3.62</div><div class="bar-track"><div class="bar-fill grey" id="hz-b0" style="width:57.7%"></div></div></div>'
        '<div class="barrow" style="left:600px; top:430px; width:450px;"><div class="bar-name">WEEK OF 19 OCT</div>'
        '<div class="bar-val" id="hz-v1">$6.28</div><div class="bar-track"><div class="bar-fill" id="hz-b1" style="width:100%"></div></div></div>'
        '<div class="dc-cap" id="hz-cap" style="left:84px; top:540px; width:900px;">Up $2.66 on a year earlier. National average, all on-highway diesel.</div>')
d.data("hz-data", -120, 1080, 1.4, 1100, 720, "STOP 01 / 06", "U.S. EIA · 20 OCT 2026", body, seed=14)
S = SCHED["hormuz"]
camera_stop("hormuz", (-300, 180, 0.9, -1.0), [
    (ls("h2") - 0.2, "push", (-520, 360, 1.12, -1.8), 0.9),
    (ls("h4") - 0.42, "whip", (600, -150, 1.18, 1.2), 0),
    (ls("h5") - 0.38, "whip", (-120, 1080, 1.16, 1.6), 0),
])
for did in ["hz-idx", "hz-tag", cid, "hz-slip", "hz-data"]:
    pass
d.ev(f'D.drop("hz-tag-in", {S["L"] - 0.25:.3f}, {{from: 1.0, spin: 0}});')
d.ev(f'D.drop("hz-idx-in", {S["L"] + 0.02:.3f});')
d.ev(f'D.drop("{cid}-in", {S["L"] + 0.12:.3f});')
d.ev(f'D.drop("hz-slip-in", {S["L"] + 0.2:.3f});')
d.ev(f'D.drop("hz-data-in", {S["L"] + 0.28:.3f});')
for i, (rid, text, t) in enumerate(rows):
    d.ev(f'D.type("{rid}", {t - 0.12:.3f}, 30);')
    cue(t - 0.12, "type", 0.32)
STAMPS.append(round(w("h3", "closed") + 0.02, 3))
d.ev(f'D.stamp("hz-stamp", {STAMPS[-1]:.3f});')
d.ev(f'D.chip("hz-chip", "hz-roll", {STAMPS[-1] + 0.08:.3f}, 1);')
d.ev(f'D.box("hz-box", {w("h4", "struck"):.3f});')
cue(w("h4", "struck"), "scribble", 0.4)
type_seq(d, qids, w("h4", "october") + 0.15, 34)
d.ev(f'D.fade("hz-att", {w("h4", "day") + 0.2:.3f}, 0.2);')
d.ev(f'D.highlight("hz-hl", {w("h4", "nearly"):.3f}, 0.5);')
d.ev(f'D.rise("hz-h1", {ls("h5") + 0.05:.3f});')
d.ev(f'D.bar("hz-b0", {w("h5", "diesel"):.3f}, 0.9); D.fade("hz-v0", {w("h5", "diesel") - 0.4:.3f});')
d.ev(f'D.bar("hz-b1", {w("h5", "twenty-eight") + 0.15:.3f}, 1.3); D.fade("hz-v1", {w("h5", "six") - 0.1:.3f});')
d.ev(f'D.fade("hz-num", {w("h5", "diesel") - 0.1:.3f});')
d.ev(f'D.count("hz-num", {w("h5", "twenty-eight") + 0.18:.3f}, 3.62, 6.28, 1.4, (v) => "$" + v.toFixed(2));')
cue(w("h5", "twenty-eight") + 0.18, "tick", 0.45)
d.ev(f'D.fade("hz-cap", {w("h5", "gallon") + 0.2:.3f}, 0.25);')
d.thread = dict(doc="hz-idx", x=IW / 2, y=20)
DESKS["hormuz"] = d

# ---- stop: ALASKA -------------------------------------------------------------------------------------------------
d = Desk("alaska", "ak", 2)
d.tag("JUNEAU, ALASKA", "58.3°N 134.4°W", side="r")
note = '<div class="ev-note" id="ak-note" data-n="20" style="right:44px; top:548px;">ELECTION DAY · 3 NOV</div>'
cid, CW, CH = d.clip("alaska", -520, -470, -1.4, 820, seed=21)
body = ('<div class="dc-label" style="left:64px; top:112px;">U.S. SENATE · ALASKA · ON THE BALLOT</div>'
        '<div class="dc-mask" style="left:64px; top:160px;"><div class="dc-head" id="ak-n1" style="font-size:112px;">DAN SULLIVAN</div></div>'
        '<div class="dc-lead" id="ak-l1" style="left:66px; top:300px;">Republican senator, running again</div>'
        '<div class="dc-div" id="ak-div" style="left:64px; top:368px; width:930px;"></div>'
        '<div class="dc-mask" style="left:64px; top:398px;"><div class="dc-head orange" id="ak-n2" style="font-size:112px;">DANIEL J. SULLIVAN</div></div>'
        '<div class="dc-lead" id="ak-l2" style="left:66px; top:538px;">a second candidate</div>' + note + stamp_html("ak-stamp", "IN|COURT", 600, 170, 92, -8, "STATUS · 23 OCT 2026", "U.S. SENATE · ALASKA"))
d.data("ak-names", 560, 520, 1.6, 1060, 680, "STOP 02 / 06", "AP · 23 OCT 2026", body, seed=22)
qhead = "ON WHO ORDERED THE LAWSUIT:"
quote = "“I’m the one that said do it.”"
body = (f'<div class="slip-k" id="ak-k" data-n="{len(qhead)}" style="left:44px; top:34px;">{qhead}</div>'
        f'<div class="slip-q big" id="ak-q" data-n="{len(quote)}" style="left:44px; top:96px;">{quote}</div>'
        '<div class="slip-att" id="ak-att" style="left:44px; top:196px;">— PRESIDENT DONALD TRUMP, 23 OCT 2026 · VIA AP</div>')
d.slip("ak-slip", -480, 560, -1.2, 1000, 268, body, seed=23)
S = SCHED["alaska"]
camera_stop("alaska", (-360, -420, 0.92, -1.0), [
    (ls("a2") + 0.3, "push", (-520, -462, 0.98, -1.4), 1.0),
    (ls("a3") - 0.3, "whip", (560, 520, 1.12, 1.4), 0),
    (ls("a4") - 0.32, "whip", (-480, 560, 1.22, -1.6), 0),
    (ls("a5") - 0.3, "whip", (560, 520, 1.04, 0.6), 0),
])
d.ev(f'D.drop("ak-tag-in", {S["L"] - 0.25:.3f}, {{from: 1.0, spin: 0}});')
d.ev(f'D.drop("{cid}-in", {S["L"] + 0.02:.3f});')
d.ev(f'D.drop("ak-names-in", {S["L"] + 0.14:.3f});')
d.ev(f'D.drop("ak-slip-in", {S["L"] + 0.24:.3f});')
d.ev(f'D.box("ak-box", {w("a2", "suing"):.3f}, 0.5);')
cue(w("a2", "suing"), "scribble", 0.4)
d.ev(f'D.rise("ak-n1", {ls("a3") + 0.1:.3f}); D.fade("ak-l1", {ls("a3") + 0.3:.3f});')
d.ev(f'D.strike("ak-div", {w("a3", "second") - 0.3:.3f});')
d.ev(f'D.rise("ak-n2", {w("a3", "second"):.3f}); D.fade("ak-l2", {w("a3", "candidate"):.3f});')
cue(w("a3", "second"), "pop", 0.35)
d.ev(f'D.type("ak-k", {ls("a4") + 0.05:.3f}, 32);')
cue(ls("a4") + 0.05, "type", 0.3)
d.ev(f'D.type("ak-q", {w("a4", "i'm") - 0.02:.3f}, 30);')
cue(w("a4", "i'm"), "type", 0.36)
d.ev(f'D.fade("ak-att", {w("a4", "it", 1) + 0.25:.3f}, 0.2);')
STAMPS.append(round(w("a5", "court") + 0.02, 3))
d.ev(f'D.stamp("ak-stamp", {STAMPS[-1]:.3f});')
d.ev(f'D.chip("ak-chip", "ak-roll", {STAMPS[-1] + 0.08:.3f}, 1);')
d.ev(f'D.type("ak-note", {w("a5", "election"):.3f}, 26);')
cue(w("a5", "election"), "type", 0.3)
d.thread = dict(doc=cid, x=CW / 2, y=22)
DESKS["alaska"] = d

# ---- stop: ISRAEL -------------------------------------------------------------------------------------------------
d = Desk("israel", "il", 3)
d.tag("JERUSALEM", "31.8°N 35.2°E", side="r")
cid, CW, CH = d.clip("israel", -420, -480, -1.2, 1000, seed=31)
# hemicycle: 120 seats in 6 rows, filled left -> right by angle
rows_r = [190, 236, 282, 328, 374, 420]
tot_r = sum(rows_r)
counts = [round(120 * r / tot_r) for r in rows_r]
counts[-1] += 120 - sum(counts)
seats = []
for r, n in zip(rows_r, counts):
    for j in range(n):
        a = math.pi * (1 - (j + 0.5) / n)
        seats.append((a, r))
seats.sort(key=lambda s: (-s[0], s[1]))
cx0, cy0 = 575, 690
dots = ""
for i, (a, r) in enumerate(seats):
    x, y = cx0 + r * math.cos(a), cy0 - r * math.sin(a)
    cls = "seat s52" if i < 52 else "seat"
    dots += f'<div class="{cls}" style="left:{x - 13:.1f}px; top:{y - 13:.1f}px;"></div>'
a61 = math.pi * (1 - 60.5 / 120)
mx1, my1 = cx0 + 160 * math.cos(a61), cy0 - 160 * math.sin(a61)
mx2, my2 = cx0 + 452 * math.cos(a61), cy0 - 452 * math.sin(a61)
body = ('<div class="dc-label" style="left:64px; top:112px;">KNESSET · 120 SEATS</div>'
        '<div class="dc-mask" style="left:64px; top:150px;"><div class="dc-head" id="il-h1" style="font-size:76px;">TO GOVERN: <span class="orange">61</span></div></div>'
        + dots +
        f'<svg class="majority" id="il-maj" width="1150" height="830" viewBox="0 0 1150 830"><line x1="{mx1:.1f}" y1="{my1:.1f}" x2="{mx2:.1f}" y2="{my2:.1f}" pathLength="1"/></svg>'
        f'<div class="maj-l" id="il-majl" style="left:{mx2 + 14:.0f}px; top:{my2 - 36:.0f}px;">61</div>'
        '<div class="dc-num" id="il-num" style="left:440px; top:548px; font-size:150px; width:270px; text-align:center;">0</div>'
        '<div class="dc-cap c" id="il-cap1" style="left:175px; top:716px; width:800px; white-space:nowrap;">NETANYAHU BLOC · CHANNEL 12 EXIT POLL</div>'
        '<div class="dc-cap" id="il-cap2" style="left:810px; top:150px; width:300px;">Channels 11 and 13: a 51–51 tie between the blocs</div>')
d.data("il-data", 180, 660, 1.2, 1150, 830, "STOP 03 / 06", "CNN · NBC · 27 OCT 2026", body + stamp_html("il-stamp", "DELAYED", 560, 400, 84, -9, "STATUS · 27 OCT 2026", "KNESSET"), seed=32)
S = SCHED["israel"]
camera_stop("israel", (-320, -440, 0.92, -0.8), [
    (ls("i2") - 0.33, "whip", (180, 660, 1.04, 1.2), 0),
])
d.ev(f'D.drop("il-tag-in", {S["L"] - 0.25:.3f}, {{from: 1.0, spin: 0}});')
d.ev(f'D.drop("{cid}-in", {S["L"] + 0.02:.3f});')
d.ev(f'D.drop("il-data-in", {S["L"] + 0.16:.3f});')
d.ev(f'D.box("il-box", {S["L"] + 0.45:.3f}, 0.5);')
cue(S["L"] + 0.45, "scribble", 0.4)
d.ev(f'D.rise("il-h1", {w("i2", "sixty-one") - 0.15:.3f});')
d.ev(f'D.tl.fromTo("#il-maj line", {{strokeDashoffset: 1}}, {{strokeDashoffset: 0, duration: 0.5, ease: "power2.out"}}, D.L({w("i2", "sixty-one") + 0.2:.3f}));')
d.ev(f'D.fade("il-majl", {w("i2", "sixty-one") + 0.5:.3f});')
d.ev(f'D.dots("#il-data .s52", {w("i3", "gave"):.3f}, {w("i3", "fifty-two") - w("i3", "gave") + 0.15:.3f}, "#c14800");')
d.ev(f'D.fade("il-num", {w("i3", "gave") - 0.1:.3f});')
d.ev(f'D.count("il-num", {w("i3", "fifty-two") + 0.2:.3f}, 0, 52, 1.25);')
cue(w("i3", "fifty-two") + 0.2, "tick", 0.45)
d.ev(f'D.fade("il-cap1", {w("i3", "fifty-two") + 0.2:.3f}, 0.2);')
d.ev(f'D.fade("il-cap2", {w("i3", "two"):.3f}, 0.25);')
STAMPS.append(round(w("i4", "delays") + 0.04, 3))
d.ev(f'D.stamp("il-stamp", {STAMPS[-1]:.3f});')
d.ev(f'D.chip("il-chip", "il-roll", {STAMPS[-1] + 0.08:.3f}, 1);')
d.thread = dict(doc=cid, x=CW / 2, y=22)
DESKS["israel"] = d

# ---- stop: BRAZIL -------------------------------------------------------------------------------------------------
d = Desk("brazil", "br", 4)
d.tag("BRASÍLIA", "15.8°S 47.9°W", side="r")
cid, CW, CH = d.clip("brazil", -520, -420, 1.6, 740, seed=41)
body = ('<div class="dc-label" style="left:64px; top:112px;">BRAZIL · RUNOFF · 25 OCT</div>'
        '<div class="dc-mask" style="left:64px; top:150px;"><div class="dc-head" id="br-h1" style="font-size:80px;">LULA · FOURTH TERM</div></div>'
        '<div class="dc-pre" id="br-pre" style="left:70px; top:268px;">MORE THAN</div>'
        '<div class="dc-num" id="br-num" style="left:62px; top:300px; font-size:200px;">0%</div>'
        '<div class="vbar" style="left:70px; top:512px; width:470px;"><div class="bar-track tall"><div class="bar-fill" id="br-b" style="width:51.2%"></div>'
        '<div class="half"></div></div><div class="half-l">HALF</div></div>'
        '<div class="dc-div v" style="left:600px; top:270px; height:340px;"></div>'
        '<div class="dc-label" id="br-al" style="left:650px; top:270px;">AGE</div>'
        '<div class="dc-mask" style="left:650px; top:306px;"><div class="age" id="br-a80">80<div class="strike" id="br-st"></div></div></div>'
        '<div class="dc-mask" style="left:860px; top:306px;"><div class="age orange" id="br-a81">81</div></div>'
        '<div class="dc-cap" id="br-acap" style="left:652px; top:520px; width:420px;">won on 25 Oct, birthday on 27 Oct</div>'
        '<div class="dc-cap" id="br-fn" style="left:70px; top:620px; width:980px;">Runner-up Flávio Bolsonaro is challenging the result · AP</div>')
d.data("br-data", 320, 560, -1.2, 1150, 720, "STOP 04 / 06", "NPR · AP · 25–26 OCT 2026", body + stamp_html("br-stamp", "DISPUTED", 600, 40, 72, -8, "STATUS · 26 OCT 2026", "BRASÍLIA"), seed=42)
S = SCHED["brazil"]
camera_stop("brazil", (-320, -300, 1.0, 0.8), [
    (w("b2", "with") - 0.4, "whip", (320, 560, 1.12, -1.0), 0),
])
d.ev(f'D.drop("br-tag-in", {S["L"] - 0.25:.3f}, {{from: 1.0, spin: 0}});')
d.ev(f'D.drop("{cid}-in", {S["L"] + 0.02:.3f});')
d.ev(f'D.drop("br-data-in", {S["L"] + 0.16:.3f});')
d.ev(f'D.box("br-box", {w("b2", "fourth"):.3f}, 0.45);')
cue(w("b2", "fourth"), "scribble", 0.4)
d.ev(f'D.rise("br-h1", {w("b2", "with") + 0.15:.3f});')
d.ev(f'D.fade("br-pre", {w("b2", "just"):.3f}); D.fade("br-num", {w("b2", "just"):.3f});')
d.ev(f'D.count("br-num", {w("b2", "fifty-one") + 0.2:.3f}, 0, 51, 1.1, (v) => Math.round(v) + "%");')
d.ev(f'D.bar("br-b", {w("b2", "fifty-one") + 0.2:.3f}, 1.1);')
cue(w("b2", "fifty-one") + 0.2, "tick", 0.45)
d.ev(f'D.fade("br-al", {w("b3", "eighty") - 0.3:.3f}); D.rise("br-a80", {w("b3", "eighty") - 0.05:.3f});')
d.ev(f'D.strike("br-st", {w("b3", "later"):.3f});')
cue(w("b3", "later"), "swoosh", 0.3, 1.3)
d.ev(f'D.rise("br-a81", {w("b3", "eighty-one") - 0.05:.3f}); D.fade("br-acap", {w("b3", "eighty-one") + 0.3:.3f});')
d.ev(f'D.fade("br-fn", {w("b4", "runner"):.3f}, 0.25);')
STAMPS.append(round(w("b4", "complaint") + 0.02, 3))
d.ev(f'D.stamp("br-stamp", {STAMPS[-1]:.3f});')
d.ev(f'D.chip("br-chip", "br-roll", {STAMPS[-1] + 0.08:.3f}, 1);')
d.thread = dict(doc=cid, x=CW / 2, y=22)
DESKS["brazil"] = d

# ---- stop: SERBIA -------------------------------------------------------------------------------------------------
d = Desk("serbia", "rs", 5)
d.tag("BELGRADE", "44.8°N 20.5°E", side="r")
cid, CW, CH = d.clip("serbia", -540, -440, -1.4, 820, seed=51)
body = ('<div class="dc-label" style="left:64px; top:112px;">SERBIA · PARLIAMENT · 25 OCT</div>'
        '<div class="dc-mask" style="left:64px; top:150px;"><div class="dc-head" id="rs-h1" style="font-size:78px;">VOTES, BY VUČIĆ’S OWN COUNT</div></div>'
        '<div class="barrow wide" style="left:70px; top:290px; width:1010px;"><div class="bar-name">STUDENT LIST</div>'
        '<div class="bar-val" id="rs-v0">≈0.0M</div><div class="bar-track tall"><div class="bar-fill" id="rs-b0" style="width:100%"></div></div></div>'
        '<div class="barrow wide" style="left:70px; top:440px; width:1010px;"><div class="bar-name">VUČIĆ’S PARTY</div>'
        '<div class="bar-val grey" id="rs-v1">≈0.0M</div><div class="bar-track tall"><div class="bar-fill grey" id="rs-b1" style="width:77.3%"></div></div></div>'
        '<div class="dc-cap" id="rs-cap" style="left:72px; top:590px; width:980px;">Approximate figures, as given by Aleksandar Vučić · Al Jazeera</div>')
d.data("rs-data", 440, 560, 1.4, 1150, 700, "STOP 05 / 06", "AL JAZEERA · EURONEWS · 25 OCT 2026", body + stamp_html("rs-stamp", "CONCEDED", 450, 286, 82, -7, "STATUS · 25 OCT 2026", "BELGRADE"), seed=52)
qhead = "ALEKSANDAR VUČIĆ, PRESIDENT OF SERBIA, 25 OCT:"
quote = "“It is clear that we have lost these elections.”"
qb, qids = typed_block("rs-q", quote, 36, "slip-q big2", 96, 44, 54)
body = (f'<div class="slip-k" id="rs-k" data-n="{len(qhead)}" style="left:44px; top:34px;">{qhead}</div>' + qb +
        f'<div class="slip-att" id="rs-att" style="left:44px; top:{96 + len(mono_lines(quote, 36)) * 54 + 16}px;">— AS REPORTED BY AL JAZEERA</div>')
d.slip("rs-slip", -680, 600, -1.4, 1040, 96 + len(mono_lines(quote, 36)) * 54 + 80, body, seed=53)
S = SCHED["serbia"]
camera_stop("serbia", (-360, -440, 0.9, -0.8), [
    (w("s2", "about") - 0.45, "whip", (440, 560, 1.12, 1.2), 0),
    (ls("s3") - 0.32, "whip", (-680, 600, 1.2, -1.4), 0),
    (ls("s4") - 0.3, "whip", (440, 560, 1.06, 0.8), 0),
])
d.ev(f'D.drop("rs-tag-in", {S["L"] - 0.25:.3f}, {{from: 1.0, spin: 0}});')
d.ev(f'D.drop("{cid}-in", {S["L"] + 0.02:.3f});')
d.ev(f'D.drop("rs-data-in", {S["L"] + 0.14:.3f});')
d.ev(f'D.drop("rs-slip-in", {S["L"] + 0.24:.3f});')
d.ev(f'D.box("rs-box", {w("s2", "won"):.3f}, 0.5);')
cue(w("s2", "won"), "scribble", 0.4)
d.ev(f'D.rise("rs-h1", {w("s2", "about") + 0.1:.3f});')
d.ev(f'D.fade("rs-v0", {w("s2", "million") + 0.2 - 1.2 * 0.82:.3f}); D.fade("rs-v1", {w("s2", "seven") + 0.15 - 1.1 * 0.82:.3f});')
d.ev(f'D.bar("rs-b0", {w("s2", "million") + 0.2:.3f}, 1.2);')
d.ev(f'D.count("rs-v0", {w("s2", "million") + 0.2:.3f}, 0, 2.2, 1.2, (v) => "≈" + v.toFixed(1) + "M");')
cue(w("s2", "million") + 0.2, "tick", 0.45)
d.ev(f'D.bar("rs-b1", {w("s2", "seven") + 0.15:.3f}, 1.1);')
d.ev(f'D.count("rs-v1", {w("s2", "seven") + 0.15:.3f}, 0, 1.7, 1.1, (v) => "≈" + v.toFixed(1) + "M");')
cue(w("s2", "seven") + 0.15, "tick", 0.4, 0.9)
d.ev(f'D.fade("rs-cap", {w("s2", "by"):.3f}, 0.25);')
d.ev(f'D.type("rs-k", {ls("s3"):.3f}, 36);')
cue(ls("s3"), "type", 0.3)
type_seq(d, qids, w("s3", "it") - 0.05, 30)
d.ev(f'D.fade("rs-att", {le("s3") + 0.15:.3f}, 0.2);')
STAMPS.append(round(w("s4", "conceded") + 0.02, 3))
d.ev(f'D.stamp("rs-stamp", {STAMPS[-1]:.3f});')
d.ev(f'D.chip("rs-chip", "rs-roll", {STAMPS[-1] + 0.08:.3f}, 1);')
d.thread = dict(doc=cid, x=CW / 2, y=22)
DESKS["serbia"] = d

# ---- stop: VENEZUELA ----------------------------------------------------------------------------------------------
d = Desk("venezuela", "ve", 6)
d.tag("CARACAS", "10.5°N 66.9°W", side="r")
cid, CW, CH = d.clip("venezuela", -560, -440, 1.2, 860, seed=61)
cells = "".join(f'<div class="mcell" style="left:{70 + i * 96}px;"></div>' for i in range(10))
nxt = "NEXT REQUEST: AN ELECTION DATE."
body = ('<div class="dc-label" style="left:64px; top:112px;">MARÍA CORINA MACHADO · RETURNED 25 OCT</div>'
        '<div class="dc-mask" style="left:64px; top:150px;"><div class="dc-head" id="ve-h1" style="font-size:84px;">TIME AWAY</div></div>'
        '<div class="dc-pre" id="ve-pre" style="left:70px; top:262px;">ABOUT</div>'
        '<div class="dc-num" id="ve-num" style="left:62px; top:292px; font-size:200px;">0</div>'
        '<div class="dc-unit" id="ve-unit" style="left:330px; top:380px;">MONTHS ABROAD</div>'
        f'<div class="mrow" id="ve-cells" style="top:510px;">{cells}</div>'
        f'<div class="dc-type" id="ve-next" data-n="{len(nxt)}" style="left:70px; top:610px;">{nxt}</div>')
d.data("ve-data", 320, 580, -1.4, 1150, 770, "STOP 06 / 06", "NPR VIA WGCU · 25 OCT 2026", body + stamp_html("ve-stamp", "ARRIVED", 600, 168, 84, -8, "ENTRY · 25 OCT 2026", "CARACAS"), seed=62)
S = SCHED["venezuela"]
camera_stop("venezuela", (-360, -440, 0.9, 0.8), [
    (w("v2", "after") - 0.36, "whip", (320, 580, 1.08, -1.2), 0),
])
d.ev(f'D.drop("ve-tag-in", {S["L"] - 0.25:.3f}, {{from: 1.0, spin: 0}});')
d.ev(f'D.drop("{cid}-in", {S["L"] + 0.02:.3f});')
d.ev(f'D.drop("ve-data-in", {S["L"] + 0.16:.3f});')
d.ev(f'D.box("ve-box", {w("v2", "back"):.3f}, 0.45);')
cue(w("v2", "back"), "scribble", 0.4)
d.ev(f'D.rise("ve-h1", {w("v2", "after") + 0.2:.3f});')
d.ev(f'D.fade("ve-pre", {w("v2", "about"):.3f}); D.fade("ve-num", {w("v2", "about"):.3f}); D.fade("ve-unit", {w("v2", "months"):.3f});')
d.ev(f'D.count("ve-num", {w("v2", "ten") + 0.2:.3f}, 0, 10, 1.0);')
d.ev(f'D.dots("#ve-cells .mcell", {w("v2", "about"):.3f}, 0.95, "#c14800");')
cue(w("v2", "ten") + 0.2, "tick", 0.45)
STAMPS.append(round(w("v3", "home") + 0.02, 3))
d.ev(f'D.stamp("ve-stamp", {STAMPS[-1]:.3f});')
d.ev(f'D.chip("ve-chip", "ve-roll", {STAMPS[-1] + 0.08:.3f}, 1);')
d.ev(f'D.type("ve-next", {w("v3", "next"):.3f}, 32);')
cue(w("v3", "next"), "type", 0.32)
d.thread = dict(doc=cid, x=CW / 2, y=22)
DESKS["venezuela"] = d

TITLES = {
    "hormuz": ("Strait of Hormuz", "26.6°N 56.3°E · Iran / Oman", 1, ["EN ROUTE", "CLOSED"]),
    "alaska": ("Alaska Senate race", "58.3°N 134.4°W · Juneau", 2, ["EN ROUTE", "IN COURT"]),
    "israel": ("Israel election", "31.8°N 35.2°E · Jerusalem", 2, ["EN ROUTE", "DELAYED"]),
    "brazil": ("Brazil runoff", "15.8°S 47.9°W · Brasília", 3, ["EN ROUTE", "DISPUTED"]),
    "serbia": ("Serbia parliament", "44.8°N 20.5°E · Belgrade", 2, ["EN ROUTE", "CONCEDED"]),
    "venezuela": ("Venezuela", "10.5°N 66.9°W · Caracas", 3, ["EN ROUTE", "ARRIVED"]),
}

# ---- board / end stamps and camera -------------------------------------------------------------------------------
for tk, word in LEDGER_WORDS:
    STAMPS.append(round(w("r2", word) + 0.02, 3))
STAMP_END = round(w("e2", "patience") + 0.1, 3)
STAMPS.append(STAMP_END)
BOOT_STAMP = None

KEYS.append(dict(t=round(BOARD["rise"] + 0.85, 3), lat=8, lon=-24, alt=2.55, ox=250, oy=10, r=0, e="power2.inOut", ae="power2.out"))
KEYS.append(dict(t=BOARD["flat1"], lat=0, lon=0, alt=9.7, ox=322, oy=40, r=0, e="power3.inOut", ae="power3.inOut"))
KEYS.append(dict(t=DUR, lat=0, lon=0, alt=9.35, ox=322, oy=40, r=0, e="linear"))
KEYS.sort(key=lambda k: k["t"])

b0 = OPEN["board_out"]
OPEN_PING = {"hormuz": b0 + 1.4, "alaska": b0 + 1.9, "israel": b0 + 2.05, "brazil": b0 + 2.2, "serbia": b0 + 2.35, "venezuela": b0 + 2.5}

film = dict(dur=DUR, ppd=PPD, aref=A_REF, assemble=[round(OPEN["board_out"] - 0.3, 3), round(OPEN["board_out"] + 1.9, 3)],
            hot=[dict(id=k, lat=v["lat"], lon=v["lon"]) for k, v in HOT.items()],
            openPing=OPEN_PING,
            stops=[dict(id=tk, **SCHED[tk]) for tk in ORDER],
            board=BOARD, keys=KEYS, stamps=sorted(STAMPS))
with open(os.path.join(ROOT, "assets", "lib", "film-data.js"), "w", encoding="utf-8") as f:
    f.write("/* generated by tools/build_v2.py from vo/data/vo.json — do not edit by hand */\n")
    f.write("window.FILM_DATA = " + json.dumps(film, separators=(",", ":")) + ";\n")

# ============================================================================ shared CSS for paper scenes
PAPER_CSS = r"""
    #root { position: absolute; inset: 0; overflow: hidden; }
    #root .dwrap { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; transform-origin: 960px 540px; }
    #root .mbdef { position: absolute; left: 0; top: 0; }
    #root .doc { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
    #root .doc-in { position: absolute; inset: 0; transform-origin: 50% 50%;
      filter: drop-shadow(0 3px 2px rgba(0, 0, 0, 0.45)) drop-shadow(0 22px 26px rgba(0, 0, 0, 0.42)); }
    #root .paper { position: absolute; inset: 0; background-color: var(--pc); background-image: url(assets/img/paper-grain.jpg);
      background-size: 720px; background-blend-mode: multiply; overflow: hidden; }
    #root .pin { position: absolute; width: 26px; height: 26px; border-radius: 50%;
      background: radial-gradient(circle at 38% 34%, #f08a7e 0 14%, #c4342a 34%, #7d1d16 100%);
      box-shadow: 2px 5px 5px rgba(0, 0, 0, 0.45); }
    #root .tape { position: absolute; height: 44px; background: rgba(233, 222, 192, 0.78);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18); }
    #root .ev-head { position: absolute; left: 22px; top: 18px; right: 22px; height: 40px; border-bottom: 2px solid #23211e;
      font: 600 25px/34px "Roboto Mono", monospace; letter-spacing: 0.06em; color: #23211e; white-space: nowrap; }
    #root .ev-head b { font-weight: 800; }
    #root .ev-img { position: absolute; left: 22px; top: 70px; }
    #root .ev-img img { display: block; width: 100%; height: 100%; }
    #root .ev-box { position: absolute; border: 6px solid #c14800; border-radius: 4px; }
    #root .ev-box.under { border: none; border-bottom: 8px solid #c14800; border-radius: 0; }
    #root .ev-note { position: absolute; padding: 6px 14px; background: #23211e; color: #f6f4ee;
      font: 700 30px/40px "Roboto Mono", monospace; letter-spacing: 0.06em; white-space: nowrap; }
    #root .stamp { position: absolute; transform-origin: 50% 50%; opacity: 0; mix-blend-mode: multiply; }
    #root .stamp-in { position: relative; color: #c4342a; border: 8px solid #c4342a; border-radius: 12px; padding: 16px 30px 10px;
      outline: 3px solid #c4342a; outline-offset: -18px; font-family: "Playfair Display", serif; font-weight: 900;
      line-height: 0.98; letter-spacing: 0.06em; text-align: center; white-space: nowrap; display: flex; flex-direction: column; align-items: center;
      -webkit-mask-image: url(assets/img/stamp-grunge.png); mask-image: url(assets/img/stamp-grunge.png);
      -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }
    #root .stamp-in.ghost { position: absolute; left: 0; top: 0; opacity: 0; }
    #root .st-s { font: 700 0.22em/1.5 "Roboto Mono", monospace; letter-spacing: 0.16em; }
    #root .st-w { display: block; padding: 0.04em 0 0.02em; }
    #root .idx-margin { position: absolute; left: 96px; top: 0; bottom: 0; width: 3px; background: rgba(193, 58, 45, 0.6); }
    #root .idx { background-image: url(assets/img/paper-grain.jpg),
      repeating-linear-gradient(to bottom, transparent 0 90px, rgba(70, 110, 160, 0.32) 90px 92px); background-size: 720px, 100% 92px;
      background-position: 0 0, 0 60px; }
    #root .idx-head { position: absolute; left: 124px; top: 34px; font: 700 32px/40px "Roboto Mono", monospace; letter-spacing: 0.03em; color: #23211e; }
    #root .idx-sub { position: absolute; left: 124px; top: 82px; font: italic 400 28px/36px "Libre Baskerville", serif; color: #6b665e; }
    #root .idx-line { position: absolute; left: 124px; font: 600 46px/60px "Roboto Mono", monospace; letter-spacing: 0.02em; color: #23211e; white-space: pre; }
    #root .slip-q { position: absolute; font: 600 38px/50px "Roboto Mono", monospace; color: #23211e; white-space: pre; }
    #root .slip-q.big { font-size: 52px; line-height: 64px; }
    #root .slip-q.big2 { font-size: 44px; line-height: 54px; }
    #root .slip-k { position: absolute; font: 700 28px/36px "Roboto Mono", monospace; letter-spacing: 0.04em; color: #6b665e; white-space: pre; }
    #root .slip-att { position: absolute; font: 500 26px/34px "Roboto Mono", monospace; letter-spacing: 0.02em; color: #6b665e; white-space: nowrap; }
    #root .hl { position: absolute; height: 44px; background: rgba(255, 205, 60, 0.62); transform-origin: 0 50%; mix-blend-mode: multiply; }
    #root .dcard { background-image: url(assets/img/paper-grain.jpg), linear-gradient(rgba(60, 40, 10, 0.05) 1.5px, transparent 1.5px),
      linear-gradient(90deg, rgba(60, 40, 10, 0.05) 1.5px, transparent 1.5px); background-size: 720px, 64px 64px, 64px 64px; }
    #root .dc-chrome { position: absolute; left: 44px; top: 40px; font: 600 24px/30px "Inter", sans-serif; letter-spacing: 0.3em; color: #76603a; }
    #root .dc-tick { display: inline-block; width: 5px; height: 26px; margin-right: 16px; vertical-align: -5px; background: #c14800; }
    #root .dc-chrome-r { position: absolute; right: 44px; top: 40px; font: 600 24px/30px "Roboto Mono", monospace; letter-spacing: 0.12em; color: #76603a; }
    #root .dc-foot { position: absolute; left: 44px; right: 44px; bottom: 30px; font: 600 20px/26px "Inter", sans-serif; letter-spacing: 0.22em; color: #76603a; }
    #root .dc-hair { position: relative; height: 2px; margin-top: 10px; background: #d6cab6; }
    #root .dc-prog { position: absolute; left: 0; top: -1px; height: 4px; background: #c14800; }
    #root .dc-label { position: absolute; font: 600 28px/34px "Inter", sans-serif; letter-spacing: 0.24em; color: #76603a; white-space: nowrap; }
    #root .dc-rule { position: absolute; width: 7px; background: #c14800; }
    #root .dc-mask { position: absolute; overflow: hidden; padding: 0 8px 4px 0; }
    #root .dc-head { font-family: "Oswald", sans-serif; font-weight: 700; line-height: 1.08; text-transform: uppercase; color: #111010;
      -webkit-text-stroke: 2.6px #111010; letter-spacing: 0.01em; white-space: nowrap; }
    #root .orange { color: #c14800; -webkit-text-stroke-color: #c14800; }
    #root .dc-num { position: absolute; font-family: "Oswald", sans-serif; font-weight: 700; line-height: 1; color: #c14800;
      -webkit-text-stroke: 5px #c14800; white-space: nowrap; text-shadow: 3px 3px 0 rgba(90, 34, 6, 0.35); }
    #root .dc-pre { position: absolute; font: 700 34px/40px "Oswald", sans-serif; letter-spacing: 0.04em; color: #5b5143; }
    #root .dc-unit { position: absolute; font: 700 56px/60px "Oswald", sans-serif; color: #111010; letter-spacing: 0.02em; }
    #root .dc-lead { position: absolute; font: 500 36px/44px "Inter", sans-serif; color: #5b5143; white-space: nowrap; }
    #root .dc-div { position: absolute; height: 3px; background: #c8bead; transform-origin: 0 50%; }
    #root .dc-div.v { width: 3px; height: auto; }
    #root .dc-cap { position: absolute; font: 400 28px/36px "Inter", sans-serif; color: #5b5143; }
    #root .dc-cap.c { text-align: center; font-weight: 600; letter-spacing: 0.12em; color: #76603a; }
    #root .dc-type { position: absolute; font: 700 38px/48px "Roboto Mono", monospace; color: #111010; white-space: pre; }
    #root .barrow, #root .vbar { position: absolute; }
    #root .bar-name { font: 700 40px/48px "Oswald", sans-serif; color: #111010; letter-spacing: 0.02em; }
    #root .bar-val { position: absolute; right: 0; top: -6px; font: 700 54px/60px "Oswald", sans-serif; color: #c14800; }
    #root .bar-val.grey, #root .bar-fill.grey { color: #948a7b; }
    #root .bar-track { position: relative; height: 26px; margin-top: 12px; background: #dcd0bc; }
    #root .bar-track.tall { height: 40px; }
    #root .bar-fill { position: absolute; left: 0; top: 0; bottom: 0; background: #c14800; transform-origin: 0 50%; }
    #root .bar-fill.grey { background: #948a7b; }
    #root .half { position: absolute; left: 50%; top: -10px; bottom: -10px; width: 3px; background: #111010; }
    #root .half-l { position: absolute; left: 50%; top: 56px; transform: translateX(-50%); font: 600 22px/26px "Inter", sans-serif; letter-spacing: 0.2em; color: #5b5143; }
    #root .age { position: absolute; font: 700 170px/1 "Oswald", sans-serif; color: #111010; -webkit-text-stroke: 4px #111010; }
    #root .dc-mask .age { position: relative; }
    #root .age.orange { color: #c14800; -webkit-text-stroke-color: #c14800; }
    #root .strike { position: absolute; left: -8px; right: -8px; top: 50%; height: 12px; background: #c14800; transform-origin: 0 50%; }
    #root .seat { position: absolute; width: 26px; height: 26px; border-radius: 50%; background: #d6cab6; }
    #root .majority { position: absolute; left: 0; top: 0; overflow: visible; }
    #root .majority line { stroke: #111010; stroke-width: 4; stroke-dasharray: 1; stroke-dashoffset: 1; }
    #root .maj-l { position: absolute; font: 700 44px/50px "Oswald", sans-serif; color: #111010; }
    #root .mrow { position: absolute; left: 0; right: 0; height: 60px; }
    #root .mcell { position: absolute; top: 0; width: 82px; height: 60px; background: #d6cab6; }
    #root .gtag .doc-in { filter: none; }
    #root .tag-in { display: flex; flex-direction: column; justify-content: center; padding: 0 22px; background: rgba(7, 24, 37, 0.9);
      border: 1.5px solid rgba(234, 246, 255, 0.28); border-radius: 8px; }
    #root .tag-a { font: 700 36px/44px "IBM Plex Mono", monospace; letter-spacing: 0.06em; color: #eaf6ff; white-space: nowrap; }
    #root .tag-b { font: 400 32px/40px "IBM Plex Mono", monospace; letter-spacing: 0.04em; color: #9fb8cc; white-space: nowrap; }
    #root .tag-dot { display: inline-block; width: 14px; height: 14px; border-radius: 50%; background: #ff6b1a; margin-right: 14px; vertical-align: 2px; }
    #root .thread { position: absolute; left: 0; top: 0; overflow: visible; }
    #root .thread line { stroke: #c4342a; stroke-width: 3.5; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; }
    #root .arr { position: absolute; left: 0; top: 72px; width: 1920px; }
    #root .arr-in { display: flex; align-items: center; gap: 22px; height: 64px; padding: 0 64px; background: rgba(5, 15, 25, 0.8);
      border-bottom: 1.5px solid rgba(234, 246, 255, 0.14); font: 400 28px/40px "IBM Plex Mono", monospace; letter-spacing: 0.04em; color: #9fb8cc; white-space: nowrap; }
    #root .arr-id { color: #9fb8cc; }
    #root .arr-title { font: 800 34px/40px "Inter", sans-serif; letter-spacing: -0.01em; color: #eaf6ff; }
    #root .arr-sev { border: 1.5px solid rgba(234, 246, 255, 0.5); border-radius: 6px; padding: 0 10px; line-height: 34px; color: #eaf6ff; }
    #root .arr-status { margin-left: auto; display: flex; align-items: center; gap: 16px; letter-spacing: 0.06em; }
    #root .chip { display: inline-block; height: 44px; overflow: hidden; border-radius: 6px; background: #ff6b1a; color: #140700; padding: 0 16px; }
    #root .chip-roll { display: flex; flex-direction: column; }
    #root .chip-roll > span { display: block; height: 44px; font: 700 30px/44px "IBM Plex Mono", monospace; letter-spacing: 0.04em; white-space: nowrap; }
"""


def stop_html(tk):
    d = DESKS[tk]
    S = SCHED[tk]
    start, dur = S["F"], round(S["Q"] - S["F"] + 0.05, 3)
    title, meta, sev, chips = TITLES[tk]
    comp = f"stop-{tk}"
    docs_html = "\n    ".join(x["html"] for x in d.docs)
    docs_cfg = [dict(id=x["id"], lat=x["lat"], lon=x["lon"], w=x["w"], h=x["h"], rot=x["rot"]) for x in d.docs]
    cfg = dict(comp=d.P, start=start, dur=dur, hot=dict(lat=HOT[tk]["lat"], lon=HOT[tk]["lon"]), docs=docs_cfg, thread=d.thread)
    L, P = S["L"], S["P"]
    js = "\n      ".join(d.ev_list if hasattr(d, "ev_list") else d.js)
    return f"""<template>
  <style>{PAPER_CSS}
  </style>
  <div id="root" data-composition-id="{comp}" data-width="1920" data-height="1080">
    <svg class="mbdef" width="0" height="0"><filter id="{d.P}-mb" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB"><feGaussianBlur id="{d.P}-mbg" stdDeviation="0 0" /></filter></svg>
    <div class="dwrap" id="{d.P}-drot" data-layout-allow-overflow><div class="dwrap" id="{d.P}-dblur" data-layout-allow-overflow><div class="dwrap" id="{d.P}-desk" data-layout-allow-overflow data-layout-allow-overlap>
    {docs_html}
    <svg class="thread" id="{d.P}-thread" width="1920" height="1080" viewBox="0 0 1920 1080" data-layout-allow-overflow><line x1="0" y1="0" x2="0" y2="0" pathLength="1" /></svg>
    </div></div></div>
    {header_html(d.P, d.n, title, meta, chips, sev)}
  </div>
  <script>
    (function () {{
      const D = window.DESK.mount({json.dumps(cfg)});
      const tl = D.tl;
      // the red thread from the ping to the first document's pin
      tl.fromTo("#{d.P}-thread line", {{ strokeDashoffset: 1 }}, {{ strokeDashoffset: 0, duration: 0.5, ease: "power2.out" }}, D.L({L + 0.4:.3f}));
      // arrival strip (screen space): blur in on landing, out at the pull-out
      tl.fromTo("#{d.P}-arr-in", {{ opacity: 0, filter: "blur(8px)", y: -16 }}, {{ opacity: 1, filter: "blur(0px)", y: 0, duration: 0.3, ease: "expo.out" }}, D.L({L - 0.55:.3f}));
      tl.to("#{d.P}-arr-in", {{ opacity: 0, filter: "blur(8px)", duration: 0.22, ease: "power2.in" }}, D.L({P + 0.45:.3f}));
      tl.to("#{d.P}-thread line", {{ strokeDashoffset: -1, duration: 0.3, ease: "power2.in" }}, D.L({P:.3f}));
      {js}
      window.__timelines["{comp}"] = tl;
    }})();
  </script>
</template>
"""


for tk in ORDER:
    with open(os.path.join(ROOT, "compositions", f"stop-{tk}.html"), "w", encoding="utf-8") as f:
        f.write(stop_html(tk))
    cue(SCHED[tk]["L"] + 0.03, "paper", 0.5)
    cue(SCHED[tk]["L"] + 0.2, "paper", 0.4, 1.1)

# ============================================================================ globe, hud, boot, board, end, index
import sys  # noqa: E402

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # python -I drops the script dir from sys.path
from build_film_shell import write_shell  # noqa: E402

write_shell(OPEN=OPEN, ROOT=ROOT, DUR=DUR, SCHED=SCHED, ORDER=ORDER, BOARD=BOARD, LEDGER_WORDS=LEDGER_WORDS, END_T=END_T,
            STAMP_END=STAMP_END, BOOT_STAMP=BOOT_STAMP, HOT=HOT, w=w, ls=ls, le=le, cue=cue, PAPER_CSS=PAPER_CSS,
            jag=jag, stamp_html=stamp_html, CUES=CUES, STAMPS=STAMPS)

print("film", DUR, "s ·", len(KEYS), "camera keys ·", len(STAMPS), "stamps ·", len(CUES), "cues")
for tk in ORDER:
    print(" ", tk, SCHED[tk])
print("  board", BOARD)

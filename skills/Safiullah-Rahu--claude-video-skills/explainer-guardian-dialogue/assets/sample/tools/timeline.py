"""Episode compiler: vo/script.json + the aligned voice -> everything the film and the score need.

Reads   vo/script.json (lines with who/role/shot/card...), vo/data/vo.json (word times), vo/data/join.json,
        vo/audio/vo.wav (voice envelopes), plate/landmarks.json
Writes  assets/lib/film-data.js     window.FILM: shots, cards, counter, captions, question, NOW, end card, clock arrays,
                                    voice envelopes + pulses, acting events, freeze/warm, landmarks
        assets/plate/*              the plate files the renderer loads
        compositions/world.html     the player (WebGL plate canvas + 2-D overlay canvas)
        index.html                  1080 x 1920 root with the mix
        out/<name>.srt              every spoken word (the QA reads WPM from it)
        score/data/cues.json        ticks, cuts, chimes, freeze, restart, end card, voice windows (for tools/score.py)

Roles a line can have (see the skill's episode guide): question, intro, openloop, rule (n, card{title, icon}),
rehook, aside, payoff, echo, final. Optional per line: shot (a preset below), cuts [{at: word, shot}], counter_at,
wink_at, widen_at, now_at, break_before. Missing shots fall back to the grammar in default_shot().

usage: python -I tools/timeline.py          (numpy + soundfile: the generative-music-video venv or anaconda)
"""
import json
import math
import os
import re
import shutil
import sys

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = os.path.basename(ROOT)
FPS = 30
W, H = 1080, 1920

SCRIPT = json.load(open(os.path.join(ROOT, "vo", "script.json"), encoding="utf-8"))
VO = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
JOIN = json.load(open(os.path.join(ROOT, "vo", "data", "join.json"), encoding="utf-8"))
LM = json.load(open(os.path.join(ROOT, "plate", "landmarks.json"), encoding="utf-8"))
CFG = SCRIPT.get("film", {})
DUR = round(float(os.environ.get("DUR_OVERRIDE", VO["duration"])), 2)
NF = int(math.ceil(DUR * FPS)) + 1

# ------------------------------------------------------------------------------------------------ shot presets
# cam: world centre (key-art source px), zoom = screen px per source px (<= 2.3 over the 1402 px source);
# sky = the wide layout (procedural sky/clock rings above the plate, parapet + warm void below);
# card = the card zone in screen px [x, y, w, h] (never over a face, never below y 1300); capY = caption centre.
P = {
    "GIRL_Q":       {"cam0": (1105, 500, 2.00), "cam1": (1100, 506, 2.07), "bgLod": 0.9},
    "END":          {"cam0": (1100, 506, 2.07), "cam1": (1098, 512, 2.12), "bgLod": 0.9, "hand": 0.6},
    "GIRL_MCU":     {"cam0": (1110, 686, 2.20), "cam1": (1104, 676, 2.28), "bgLod": 1.0},
    "HOOD":         {"cam0": (520, 487, 2.10), "cam1": (530, 478, 2.20), "bgLod": 1.0},
    "HOOD_PUSH":    {"cam0": (545, 480, 1.95), "cam1": (592, 415, 2.30), "bgLod": 1.1, "hand": 0.5, "ease": "inout"},
    "HANDS":        {"cam0": (450, 617, 1.90), "cam1": (442, 622, 1.98), "bgLod": 1.0, "card": [40, 392, 470, 380], "counterX": 275},
    "WIDE":         {"cam0": (701, 519.5, 0.77), "cam1": (701, 528, 0.795), "sky": True, "hand": 0.6, "card": [560, 396, 490, 380]},
    "WIDE_LOW":     {"cam0": (701, 360, 0.77), "cam1": (701, 368, 0.79), "sky": True, "hand": 0.6, "card": [140, 390, 800, 316]},
    "MED2":         {"cam0": (750, 600, 1.00), "cam1": (752, 590, 1.04), "sky": True, "hand": 0.7},
    "OTS_GIRL":     {"cam0": (1000, 560, 1.75), "cam1": (1006, 552, 1.82), "bgLod": 1.0, "card": [32, 392, 384, 372]},
    "CARD_HERO":    {"cam0": (820, 500, 1.80), "cam1": (815, 494, 1.86), "bgLod": 2.3, "charLod": 1.9, "card": [140, 470, 800, 640],
                     "grade": {"expo": 0.78, "sat": 0.92}},
    "CARD_GAP":     {"cam0": (830, 480, 2.00), "cam1": (836, 474, 2.06), "bgLod": 1.0, "card": [330, 392, 410, 420]},
    "CLOCK_MED":    {"cam0": (755, 262, 1.25), "cam1": (755, 352, 1.32), "sky": True, "hand": 0.5},
    "CLOCK_CARD":   {"cam0": (755, 300, 1.30), "cam1": (757, 290, 1.36), "sky": True, "hand": 0.6, "card": [150, 392, 780, 320]},
    "CLOCK_FROZEN": {"cam0": (800, 470, 1.85), "cam1": (800, 466, 1.92), "bgLod": 1.0, "hand": 0.0, "card": [380, 392, 450, 420],
                     "grade": {"sat": 0.88}},
}
RULE_CYCLE = ["HANDS", "WIDE_LOW", "CARD_HERO", "CARD_GAP", "OTS_GIRL", "WIDE", "CLOCK_CARD"]


def default_shot(line, k_rule):
    role = line.get("role")
    return {"question": "GIRL_Q", "intro": "CLOCK_MED", "openloop": "WIDE", "rehook": "GIRL_MCU", "aside": "HOOD",
            "payoff": "WIDE", "echo": "GIRL_MCU", "final": "WIDE"}.get(role) or RULE_CYCLE[k_rule % len(RULE_CYCLE)]


# ------------------------------------------------------------------------------------------------ word lookup
LINES = {l["id"]: l for l in VO["lines"]}
SLINES = {l["id"]: l for l in SCRIPT["lines"]}
norm = lambda s: re.sub(r"[^a-z0-9']", "", s.lower().replace("’", "'"))


def word(lid, w, k=0):
    hits = [x for x in LINES[lid]["words"] if norm(x["w"]).startswith(norm(w))]
    if not hits:
        raise SystemExit(f"no word '{w}' in {lid}: {[x['w'] for x in LINES[lid]['words']]}")
    return hits[min(k, len(hits) - 1)]


def lstart(lid):
    return LINES[lid]["words"][0]["start"]


def lend(lid):
    return LINES[lid]["words"][-1]["end"]


# ------------------------------------------------------------------------------------------------ shots
def build_shots():
    shots, k_rule = [], 0
    ids = [l["id"] for l in SCRIPT["lines"]]
    stop_t = None
    for idx, sl in enumerate(SCRIPT["lines"]):
        lid = sl["id"]
        typ = sl.get("shot") or default_shot(sl, k_rule)
        if sl.get("role") == "rule":
            k_rule += 1
        lead = 0.16 if sl["who"] == "L" else 0.10
        t0 = 0.0 if idx == 0 else lstart(lid) - lead
        if sl.get("break_before"):
            prev = ids[idx - 1]
            stop_t = lend(prev) + 0.14
            t0 = stop_t - 0.02        # the frozen clock holds through the silence
        shots.append({"t0": round(max(0.0, t0), 3), "type": typ, "line": lid})
        for c in sl.get("cuts", []):
            shots.append({"t0": round(word(lid, c["at"])["start"] - 0.08, 3), "type": c["shot"], "line": lid})
    end_t = lend(ids[-1]) + 1.2
    shots.append({"t0": round(end_t, 3), "type": "END", "line": "end"})
    out = []
    for s in shots:
        p = P[s["type"]]
        d = {"t0": s["t0"], "type": s["type"], "line": s["line"], "cam0": dict(zip(("x", "y", "z"), p["cam0"])), "cam1": dict(zip(("x", "y", "z"), p["cam1"])),
             "sky": bool(p.get("sky")), "bgLod": p.get("bgLod", 0.2 if p.get("sky") else 0.9), "charLod": p.get("charLod", 0), "hand": p.get("hand", 1.0),
             "ease": p.get("ease", "inout"), "grade": p.get("grade", {}), "capY": p.get("capY", 1420),
             "counter": s["type"] not in ("GIRL_Q", "GIRL_MCU", "HOOD", "HOOD_PUSH", "END"), "counterX": p.get("counterX", 540)}
        if "card" in p:
            d["card"] = p["card"]
        out.append(d)
    return out, stop_t, end_t


# ------------------------------------------------------------------------------------------------ captions
ACC = set(CFG.get("accent_words", []))


def chunk(words, max_words=3, max_chars=16):
    out, cur = [], []
    fw = {"the", "a", "an", "of", "to", "your", "in", "at", "on", "and", "but", "or", "for", "with", "is", "who"}
    for i, w in enumerate(words):
        cur.append(w)
        txt = " ".join(x["w"] for x in cur)
        nxt = words[i + 1]["w"] if i + 1 < len(words) else None
        endp = bool(re.search(r"[.,!?;:…]$", w["w"]))
        too = nxt is not None and (len(cur) >= max_words or len(txt) + 1 + len(nxt) > max_chars)
        if endp or nxt is None or too:
            if not endp and nxt is not None and len(cur) > 1 and norm(w["w"]) in fw:
                carry = cur.pop(); out.append(cur); cur = [carry]; continue
            out.append(cur); cur = []
    if cur:
        out.append(cur)
    return out


def build_captions(skip_ids):
    chunks = []
    for l in VO["lines"]:
        if l["id"] in skip_ids:
            continue
        for c in chunk(l["words"]):
            chunks.append((c, l))
    caps = []
    for k, (c, l) in enumerate(chunks):
        t0 = c[0]["start"] - 0.02
        nxt = chunks[k + 1][0][0]["start"] - 0.02 if k + 1 < len(chunks) else DUR
        last = c[-1]["end"]
        t1 = nxt if nxt - last <= 0.7 else last + 0.45
        caps.append({"t0": round(t0, 3), "t1": round(t1, 3), "who": SLINES[l["id"]]["who"], "line": l["id"],
                     "words": [{"w": x["w"], "t0": round(x["start"], 3), "acc": x["w"].lower() in ACC} for x in c]})
    return caps, chunks


# ------------------------------------------------------------------------------------------------ voice envelopes + pulses
def envelopes():
    import soundfile as sf
    a, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), always_2d=True)
    a = a.mean(axis=1)
    hop = sr // 100
    n = len(a) // hop
    rms = np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(axis=1) + 1e-12)
    env = {}
    for who in ("G", "L"):
        m = np.zeros(n)
        for jl in JOIN["lines"]:
            if SLINES[jl["id"]]["who"] == who:
                m[int(jl["start"] * 100): int(jl["end"] * 100) + 1] = 1
        e = rms * m
        if who == "L":      # per line: her whispered lines must still move the mouth
            for jl in JOIN["lines"]:
                if SLINES[jl["id"]]["who"] == who:
                    i0, i1 = int(jl["start"] * 100), int(jl["end"] * 100) + 1
                    seg = e[i0:i1]
                    if (seg > 0).any():
                        e[i0:i1] = seg / np.percentile(seg[seg > 0], 88)
            e = np.clip(e, 0, 1.25)
        else:
            ref = np.percentile(e[e > 0], 92) if (e > 0).any() else 1
            e = np.clip(e / ref, 0, 1.25)
        e = np.where(e < 0.08, 0, e)
        att, rel = (0.45, 0.16) if who == "L" else (0.3, 0.08)
        s = np.zeros(n); v = 0.0
        for i in range(n):
            v += (e[i] - v) * (att if e[i] > v else rel); s[i] = v
        # resample to the frame rate (max over each frame window keeps syllables)
        fr = []
        for f in range(NF):
            i0, i1 = int(f / FPS * 100), int((f + 1) / FPS * 100) + 1
            fr.append(float(s[i0:i1].max()) if i0 < n else 0.0)
        env[who] = [round(min(1.0, x), 3) for x in fr]
        env[who + "_100"] = s
    # pulses: onsets in the Guardian's envelope
    s = env.pop("G_100"); env.pop("L_100")
    pulses, last, armed = [], -9, True
    for i in range(1, len(s)):
        if armed and s[i] > 0.5 and s[i - 1] <= 0.5 and i / 100 - last > 0.34:
            pulses.append(round(i / 100 - 0.02, 3)); last = i / 100; armed = False
        if s[i] < 0.3:
            armed = True
    return env, pulses


# ------------------------------------------------------------------------------------------------ the clock
def clock(shots, stop_t, restart_t):
    rules = [(sl["id"], sl["n"]) for sl in SCRIPT["lines"] if sl.get("role") == "rule"]
    first_rule = lstart(rules[0][0]) if rules else 1e9
    seg = []                       # (t_from, rate)
    for lid, n in rules:
        seg.append((lstart(lid) - 0.1, 1.0 + 0.3 * (11 - n)))
    def rate(t):
        r = 1.0
        for t0, rr in seg:
            if t >= t0:
                r = rr
        return r
    # time-lapse spin of the minute hand through the last two rules before the stop ("the hands blur faster")
    blur_from = lstart(rules[-3][0]) if len(rules) >= 3 else 1e9
    ticks, t, n = [], 0.35, 0
    while t < stop_t - 0.05:
        ticks.append({"t": round(t, 3), "kind": "tick" if n % 2 == 0 else "tock"}); n += 1
        t += 1.0 / rate(t)
    ticks.append({"t": round(stop_t, 3), "kind": "clunk"})
    t = restart_t
    first = True
    while t < DUR:
        ticks.append({"t": round(t, 3), "kind": "restart" if first else ("tick" if n % 2 == 0 else "tock")}); first = False; n += 1
        t += 1.0
    tick_t = np.array([x["t"] for x in ticks])
    K = int((tick_t < stop_t - 1e-6).sum()) + 1      # ticks up to and including the clunk: the second hand stops at 12
    # minute hand: base drift + a time-lapse spin scaled so that it stops dead exactly at 12, with the hour hand at 12
    # too, and starts near 12:05 (visible in the gap between the two characters)
    dt = 1.0 / FPS
    base_tot, spin_tot = 0.0, 0.0
    for f in range(NF):
        tt = f * dt
        if tt >= stop_t:
            break
        base_tot += math.radians(0.9) * rate(tt) * dt
        if tt >= blur_from:
            spin_tot += math.radians(260.0) * min(1.0, (tt - blur_from) / 2.5) * dt
    m0 = math.radians(8.0)
    Nn = round((m0 + base_tot + spin_tot) / (2 * math.pi))
    while Nn % 12 != 11:
        Nn += 1
    spin_scale = (2 * math.pi * Nn - m0 - base_tot) / spin_tot if spin_tot > 0 else 1.0
    h0 = -(2 * math.pi * Nn) / 12.0
    S, M, Hh, GL, BS, BM = [], [], [], [], [], []
    mang = m0
    prev_s = None
    for f in range(NF):
        tt = f * dt
        frozen = stop_t <= tt < restart_t
        k = int((tick_t <= tt).sum())
        if k:
            age = tt - tick_t[k - 1]
            u = min(1.0, age / 0.075)
            c = 2.2
            e = 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2   # back-out: a tiny overshoot
            sang = math.radians(6.0 * (k - 1 + e - K))
        else:
            sang = math.radians(-6.0 * K)
        if not frozen:
            if tt < restart_t:
                spin = 0.0
                if tt >= blur_from:
                    spin = math.radians(260.0) * min(1.0, (tt - blur_from) / 2.5) * spin_scale
                mang += (math.radians(0.9) * rate(tt) + spin) * dt
                wm = math.radians(0.9) * rate(tt) + spin
            else:
                mang += math.radians(0.9) * dt; wm = math.radians(0.9)
        else:
            wm = 0.0
        last_tick = tick_t[k - 1] if k else -9
        glow = 0.25 + 0.22 * math.exp(-max(0, tt - last_tick) / 0.14)
        if tt >= restart_t:
            glow += 0.6 * math.exp(-(tt - restart_t) / 1.2)
        if frozen:
            glow = 0.35
        S.append(round(sang, 4)); M.append(round(mang, 4)); Hh.append(round(mang / 12 + h0, 4)); GL.append(round(glow, 3))
        BS.append(round(0.0 if prev_s is None else max(0.0, min(0.35, (sang - prev_s) * 1.3)), 4)); prev_s = sang
        BM.append(round(min(0.9, wm * dt * 3.0), 4))
    return {"s": S, "m": M, "h": Hh, "glow": GL, "bs": BS, "bm": BM}, ticks


# ------------------------------------------------------------------------------------------------ acting
def hsh(n):
    x = math.sin(n * 127.1 + 311.7) * 43758.5453
    return x - math.floor(x)


def acting(shots, stop_t, restart_t, end_t):
    A = {"nods": [], "gestures": [], "gLean": [], "gNod": [], "medBoost": [], "blinks": [], "lTilt": [], "lTiltB": [], "lLean": [],
         "brows": [], "browsB": [], "widen": [], "smile": []}
    for sl in SCRIPT["lines"]:
        lid, role = sl["id"], sl.get("role")
        if role == "rule":
            w0 = LINES[lid]["words"][0]
            A["nods"].append({"t": w0["start"], "a": 0.7, "d": 0.6})
            A["gestures"].append({"t": w0["start"] + 0.08, "a": 1.0, "d": 0.8})
            mid = LINES[lid]["words"][len(LINES[lid]["words"]) // 2]
            A["gestures"].append({"t": mid["start"], "a": 0.5, "d": 0.9})
        if role == "openloop":
            A["nods"].append({"t": word(lid, sl.get("counter_at", "ten"))["start"], "a": 0.5})
            A["gestures"].append({"t": lstart(lid), "a": 0.8, "d": 0.9})
            cut = sl.get("cuts", [{}])[0].get("at")
            if cut:
                A["gLean"].append({"t0": word(lid, cut)["start"] - 0.3, "t1": lend(lid) + 0.2, "a": 0.7})
        if role == "intro":
            A["gestures"].append({"t": LINES[lid]["words"][min(3, len(LINES[lid]["words"]) - 1)]["start"], "a": 0.6, "d": 1.0})
        if sl.get("delivery", "").lower().find("sad") >= 0 or sl.get("delivery", "").lower().find("grave") >= 0:
            A["gNod"].append({"t0": lstart(lid) - 0.2, "t1": lend(lid), "a": 0.35, "in": 0.6, "out": 0.8})
        if role == "aside":
            A["nods"].append({"t": lstart(lid), "a": 0.5})
        if sl.get("wink_at"):
            A["wink"] = word(lid, sl["wink_at"])["end"] + 0.05
        if sl.get("break_before"):
            A["gLean"].append({"t0": LINES[lid]["words"][1]["start"], "t1": restart_t, "a": 1.0, "in": 2.5, "out": 0.8})
            A["medBoost"].append({"t0": lstart(lid), "t1": restart_t - 0.2, "a": 0.7, "in": 1.2, "out": 0.6})
        if role in ("payoff", "final"):
            A["nods"].append({"t": LINES[lid]["words"][-1]["start"], "a": 0.9, "d": 0.9})
        # the girl
        if role == "question":
            A["lTilt"].append({"t0": 0.0, "t1": lend(lid) + 0.4, "a": -0.012, "in": 0.01})
            ws = LINES[lid]["words"]
            A["brows"].append({"t0": ws[min(2, len(ws) - 1)]["start"] - 0.1, "t1": lend(lid) + 0.3, "a": 0.75, "in": 0.2})
        if role == "rehook":
            A["lLean"].append({"t0": lstart(lid) - 0.3, "t1": lend(lid) + 1.6, "a": 1.0, "in": 0.45, "out": 0.9})
            A["brows"].append({"t0": lstart(lid), "t1": lend(lid) + 0.2, "a": 0.6})
            A["lTiltB"].append({"t": lstart(lid), "a": -0.02, "d": 0.8})
        if role == "echo":
            A["lTilt"].append({"t0": lstart(lid) - 0.15, "t1": lend(lid) + 1.0, "a": -0.03, "in": 0.3})
            A["brows"].append({"t0": lstart(lid) - 0.1, "t1": lend(lid) + 0.9, "a": 1.0, "in": 0.2})
        if sl.get("n") == 7 or "playful" in sl.get("delivery", "").lower():
            A["lTilt"].append({"t0": LINES[lid]["words"][1]["start"], "t1": lend(lid) + 0.3, "a": -0.04, "in": 0.6})
        if sl.get("widen_at"):
            hits = [x for x in LINES[lid]["words"] if norm(x["w"]) == norm(sl["widen_at"])]
            tw = (hits[-1] if hits else LINES[lid]["words"][-3])["start"]
            A["widen"].append({"t0": tw, "t1": tw + 2.0, "a": 1.0, "in": 0.25, "out": 0.6})
            A["brows"].append({"t0": tw, "t1": tw + 2.0, "a": 0.8, "in": 0.25})
        if role == "final":
            A["smile"].append({"t0": lstart(lid) - 0.1, "t1": DUR + 5, "a": 1.0, "in": 0.9})
    # blinks: every 2.2-4.6 s, plus one ~0.5 s into every girl shot, never inside 1.1 s of another
    cand = []
    t = 0.9
    i = 0
    while t < DUR - 0.4:
        cand.append(t); t += 2.2 + 2.4 * hsh(i); i += 1
    for k, s in enumerate(shots):
        if s["type"] in ("GIRL_Q", "GIRL_MCU", "END", "OTS_GIRL", "CARD_GAP"):
            cand.append(s["t0"] + 0.55)
    cand.append(lend(SCRIPT["lines"][0]["id"]) + 0.25)
    cand = sorted(cand)
    for c in cand:
        if not A["blinks"] or c - A["blinks"][-1] > 1.1:
            A["blinks"].append(round(c, 3))
    return A


# ------------------------------------------------------------------------------------------------ main
def main():
    sys.stdout.reconfigure(encoding="utf-8")
    shots, stop_t, end_t = build_shots()
    lines = SCRIPT["lines"]
    ids = [l["id"] for l in lines]
    final = [l for l in lines if l.get("role") == "final"]
    restart_t = lend(final[0]["id"]) + 0.04 if final else DUR     # the clock restarts as the last "Now." lands
    # cards
    cards = []
    for sl in lines:
        if sl.get("role") != "rule":
            continue
        lid = sl["id"]
        my = [k for k, s in enumerate(shots) if s["line"] == lid]
        s0 = shots[my[0]]
        t_on = LINES[lid]["words"][0]["start"] - 0.04
        nxt = shots[my[0] + 1]["t0"] if my[0] + 1 < len(shots) else DUR
        zone = s0.get("card", [190, 384, 700, 320])
        cards.append({"n": sl["n"], "title": sl["card"]["title"], "icon": sl["card"]["icon"], "t0": round(t_on, 3), "t1": round(nxt - 0.04, 3), "zone": zone, "line": lid})
    # counter
    ol = [l for l in lines if l.get("role") == "openloop"]
    rules = [l for l in lines if l.get("role") == "rule"]
    counter = None
    if ol and rules:
        c0 = word(ol[0]["id"], ol[0].get("counter_at", "ten"))["start"]
        ticks = [{"t": round(c0, 3), "n": rules[0]["n"]}] + [{"t": round(LINES[l["id"]]["words"][0]["start"], 3), "n": l["n"]} for l in rules]
        pay = [l for l in lines if l.get("role") == "payoff"]
        counter = {"t0": round(c0, 3), "t1": round(lstart(pay[0]["id"]) - 0.2 if pay else DUR, 3), "ticks": ticks, "y": 300, "total": max(l["n"] for l in rules)}
    # question (typed on her words)
    q = [l for l in lines if l.get("role") == "question"]
    question = None
    if q:
        qw = LINES[q[0]["id"]]["words"]
        rows_idx = CFG.get("question_rows") or [list(range(len(qw)))]
        # rows: 74 px, the last row big (124 px) when it is short (<= 12 characters); stacked from y 282
        rows, y = [], 282
        for r, idx in enumerate(rows_idx):
            txt = " ".join(qw[i]["w"] for i in idx)
            big = r == len(rows_idx) - 1 and len(txt) <= 12 and len(rows_idx) > 1
            size = 124 if big else 74
            if r:
                y += max(86, int(size * 1.02))
            rows.append({"y": y, "size": size, "weight": 900 if big else 800,
                         "words": [{"w": qw[i]["w"], "t0": round(qw[i]["start"], 3)} for i in idx]})
        nxt = shots[1]["t0"]
        question = {"t0": 0.0, "t1": round(min(lend(q[0]["id"]) + 0.35, nxt - 0.45), 3), "rows": rows}
    # NOW
    pay = [l for l in lines if l.get("role") == "payoff" and l.get("now_at")]
    now = None
    if pay:
        lid = pay[0]["id"]
        k = [i for i, s in enumerate(shots) if s["line"] == lid][0]
        now = {"t0": round(word(lid, pay[0]["now_at"])["start"] - 0.05, 3), "t1": round(shots[k + 1]["t0"] - 0.02, 3), "x": 620, "y": 455, "size": 190}
    # end card
    ec = CFG.get("end_card", {})
    endcard = {"t0": round(shots[-1]["t0"] + 0.25, 3), "rows": [{"text": ec.get("rows", ["WHICH RULE ARE YOU", "STARTING TODAY?"])[0], "size": 70, "y": 300},
                                                                {"text": ec.get("rows", ["", "STARTING TODAY?"])[1], "size": 92, "y": 398}],
               "sub": {"text": ec.get("sub", "COMMENT THE NUMBER"), "size": 40, "y": 492}}
    caps, chunks = build_captions({l["id"] for l in q})
    env, pulses = envelopes()
    clk, ticks = clock(shots, stop_t if stop_t else DUR, restart_t)
    act = acting(shots, stop_t, restart_t, end_t)
    film = {"dur": DUR, "fps": FPS, "name": NAME, "plateBase": "assets/plate/", "landmarks": LM, "shots": shots, "cards": cards, "counter": counter,
            "captions": caps, "question": question, "now": now, "endcard": endcard, "clock": clk, "env": env, "pulses": pulses, "acting": act,
            "freeze": {"t0": round(stop_t, 3), "t1": round(restart_t, 3)} if stop_t else None,
            "warm": {"t0": round(restart_t, 3), "d": 2.6, "a": 0.6}, "ringC": [700, 442, 690], "capY": 1420}
    lib = os.path.join(ROOT, "assets", "lib")
    open(os.path.join(lib, "film-data.js"), "w", encoding="utf-8").write("/* generated by tools/timeline.py */\nwindow.FILM = " + json.dumps(film, separators=(",", ":"), ensure_ascii=False) + ";\n")
    # plate files for the renderer
    pd = os.path.join(ROOT, "assets", "plate"); os.makedirs(pd, exist_ok=True)
    for key, f in LM["files"].items():
        if isinstance(f, str) and key != "full":
            src = os.path.join(ROOT, "plate", f)
            if os.path.exists(src) and (not os.path.exists(os.path.join(pd, f)) or os.path.getmtime(src) > os.path.getmtime(os.path.join(pd, f))):
                shutil.copy(src, os.path.join(pd, f))
    write_html()
    # SRT: every spoken word (the question line too)
    def ts(t):
        h, r = divmod(t, 3600); m, s = divmod(r, 60)
        return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s % 1) * 1000)) % 1000:03d}"
    srt = []
    allc = []
    for l in VO["lines"]:
        for c in chunk(l["words"]):
            allc.append(c)
    for k, c in enumerate(allc):
        t0 = c[0]["start"]; t1 = allc[k + 1][0]["start"] if k + 1 < len(allc) and allc[k + 1][0]["start"] - c[-1]["end"] <= 0.7 else c[-1]["end"] + 0.45
        srt.append(f"{k + 1}\n{ts(t0)} --> {ts(t1)}\n{' '.join(x['w'] for x in c).upper()}\n")
    os.makedirs(os.path.join(ROOT, "out"), exist_ok=True)
    open(os.path.join(ROOT, "out", NAME + ".srt"), "w", encoding="utf-8").write("\n".join(srt) + "\n")
    # sound cues
    cues = {"dur": DUR, "ticks": ticks, "cuts": [s["t0"] for s in shots[1:]], "cards": [c["t0"] for c in cards],
            "counter": [x["t"] for x in (counter["ticks"][1:] if counter else [])], "counter_in": counter["t0"] if counter else None,
            "stop": stop_t, "restart": restart_t, "now": now["t0"] if now else None, "endcard": endcard["t0"], "wink": act.get("wink"),
            "rule1": lstart(rules[-1]["id"]) if rules else None, "rehook": [lstart(l["id"]) for l in lines if l.get("role") == "rehook"],
            "voice": [{"id": jl["id"], "who": SLINES[jl["id"]]["who"], "start": jl["start"], "end": jl["end"]} for jl in JOIN["lines"]]}
    os.makedirs(os.path.join(ROOT, "score", "data"), exist_ok=True)
    json.dump(cues, open(os.path.join(ROOT, "score", "data", "cues.json"), "w"), indent=1)
    print(f"{NAME}: {DUR} s · {len(shots)} shots · {len(cards)} cards · {len(caps)} captions · {len(pulses)} pulses · {len(ticks)} ticks · blinks {len(act['blinks'])}")
    print(f"  stop {stop_t:.2f} s  restart {restart_t:.2f} s  end shot {shots[-1]['t0']:.2f} s")
    for s in shots:
        print(f"  {s['t0']:6.2f}  {s['type']:13s} {s['line']}")


WORLD = r"""<template>
  <style>
    #root { position: absolute; inset: 0; overflow: hidden; background: #000; }
    #gl, #ovl { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; }
    @font-face { font-family: "MontserratGD"; src: url("assets/fonts/Montserrat_wght_.ttf") format("truetype"); font-weight: 100 900; }
  </style>
  <div id="root" data-composition-id="world" data-width="1080" data-height="1920">
    <canvas id="gl" width="1080" height="1920" data-layout-allow-overflow></canvas>
    <canvas id="ovl" width="1080" height="1920" data-layout-allow-overflow></canvas>
  </div>
  <script>
    (function () {
      const DUR = window.FILM.dur;
      const film = window.GFILM.create(document.getElementById("gl"), document.getElementById("ovl"));
      let ready = false, curT = 0, lastT = -1;
      function draw(t) { curT = t; t = Math.round(t * 10000) / 10000; if (!ready || t === lastT) return; lastT = t; film.render(t); }
      window.__hf = window.__hf || {}; window.__hf.buildReady = window.__hf.buildReady || {};
      const fontP = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('800 30px "MontserratGD"'), document.fonts.load('900 30px "MontserratGD"')]).catch(() => null) : Promise.resolve();
      window.__hf.buildReady.world = Promise.all([film.ready, fontP]).then(() => { ready = true; lastT = -1; draw(curT); });
      window.addEventListener("hf-seek", (e) => draw(e.detail.time));
      const tl = gsap.timeline({ paused: true }); const clock = { t: 0 };
      tl.to(clock, { t: DUR, duration: DUR, ease: "none", onUpdate: () => draw(clock.t) }, 0);
      window.__timelines["world"] = tl;
    })();
  </script>
</template>
"""


def write_html():
    open(os.path.join(ROOT, "compositions", "world.html"), "w", encoding="utf-8").write(WORLD)
    libs = ["film-data.js", "guardian-gl.js", "guardian-overlay.js", "guardian-film.js"]
    scripts = "\n    ".join(f'<script src="assets/lib/{x}"></script>' for x in libs)
    open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(f"""<!doctype html>
<html lang="en" data-size="{W}x{H}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    {scripts}
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: {W}px; height: {H}px; overflow: hidden; background: #000; }}
      #root {{ position: relative; width: 100%; height: 100%; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="{W}" data-height="{H}">
      <div id="world" data-composition-id="world" data-composition-src="compositions/world.html" data-start="0" data-duration="{DUR}" data-track-index="0" data-track-kind="graphics" data-width="{W}" data-height="{H}" style="z-index: 1"></div>
      <audio id="mix" class="clip" src="assets/audio/final.m4a" data-start="0" data-duration="{DUR}" data-track-index="20" data-volume="1"></audio>
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
""")


if __name__ == "__main__":
    main()

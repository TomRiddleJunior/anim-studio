"""Episode compiler (Conversations Beyond Time): vo/script.json + the aligned voice -> everything the film and the score need.

Reads   vo/script.json (lines: who/text/shot/acting/react/orb/...), vo/data/vo.json (word times), vo/data/join.json,
        vo/audio/vo.wav (voice envelopes), plate/landmarks.json
Writes  assets/lib/film-data.js     window.FILM: shots, captions, chip, name tag, orb morphs, clock arrays, voice envelopes
                                    + pulses, acting events (girl + Zeythar), grade events, end card, landmarks
        assets/plate/*              the plate files the renderer loads
        compositions/world.html     the player (WebGL plate canvas + 2-D overlay canvas)
        index.html                  1080 x 1920 root with the mix
        out/<name>.srt              every spoken word
        score/data/cues.json        ticks, minute steps, cuts, morph chimes, plucks, beats, swell, final tick, end card,
                                    voice windows (for tools/score.py)

Shot grammar: a cut on every speaker change (t0 = first word - 0.16 s for her, - 0.10 s for him), optional in-line cuts,
a beat_before line gets its own quiet shot, the last line's shot carries the end card. Presets are in P below.

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
END_HOLD = float(CFG.get("end_hold", 3.8))          # end card time after the last word

# ------------------------------------------------------------------------------------------------ shot presets
# cam: world centre (key-art source px), zoom = screen px per source px (<= 2.3 over the 1402 px source);
# sky = the wide layout (code-drawn sky + clock rings above the plate, a dark ledge below); capY = caption centre.
P = {
    # her
    "GIRL_OPEN":    {"cam0": (905, 470, 1.40), "cam1": (912, 466, 1.46), "sky": True, "hand": 0.6, "bgLod": 0.5},   # girl + the 2:30 clock
    "GIRL_MCU":     {"cam0": (1040, 505, 1.90), "cam1": (1036, 508, 1.96), "bgLod": 1.0},
    "GIRL_MCU2":    {"cam0": (1060, 520, 1.86), "cam1": (1052, 516, 1.93), "bgLod": 1.0},
    "GIRL_CU":      {"cam0": (982, 420, 2.24), "cam1": (980, 420, 2.30), "bgLod": 1.1},
    "GIRL_CU2":     {"cam0": (1000, 440, 2.16), "cam1": (996, 436, 2.22), "bgLod": 1.1},
    "GIRL_CU_PUSH": {"cam0": (995, 470, 2.04), "cam1": (984, 424, 2.30), "bgLod": 1.15, "hand": 0.4, "ease": "inout"},
    # him
    "HOOD_ORB_TAG": {"cam0": (452, 480, 1.30), "cam1": (458, 474, 1.34), "sky": True, "hand": 0.6, "bgLod": 0.5},  # tag + hood + orb
    "HOOD_MCU":     {"cam0": (560, 505, 1.90), "cam1": (556, 500, 1.96), "bgLod": 1.0},
    "HOOD_ORB":     {"cam0": (606, 505, 1.90), "cam1": (612, 500, 1.97), "bgLod": 1.0},
    "HOOD_CU_PUSH": {"cam0": (522, 480, 2.00), "cam1": (518, 432, 2.30), "bgLod": 1.15, "hand": 0.4, "ease": "inout"},
    "ORB_INSERT":   {"cam0": (712, 446, 2.22), "cam1": (716, 440, 2.30), "bgLod": 1.3, "charLod": 0.6},
    # both
    "WIDE":         {"cam0": (682, 520, 0.82), "cam1": (680, 526, 0.845), "sky": True, "hand": 0.6, "bgLod": 0.2},
    "WIDE_QUIET":   {"cam0": (682, 500, 0.83), "cam1": (680, 506, 0.85), "sky": True, "hand": 0.3, "bgLod": 0.2},
    "CLOCK_CU":     {"cam0": (676, 446, 1.96), "cam1": (674, 440, 2.04), "sky": True, "hand": 0.3, "bgLod": 0.7},
}
GIRL_SHOTS = {"GIRL_OPEN", "GIRL_MCU", "GIRL_MCU2", "GIRL_CU", "GIRL_CU2", "GIRL_CU_PUSH"}

LINES = {l["id"]: l for l in VO["lines"]}
SLINES = {l["id"]: l for l in SCRIPT["lines"]}
JL = {l["id"]: l for l in JOIN["lines"]}
DUR = round(max(l["end"] for l in VO["lines"]) + END_HOLD, 2)
NF = int(math.ceil(DUR * FPS)) + 1
norm = lambda s: re.sub(r"[^a-z0-9']", "", s.lower().replace("’", "'"))


def word(lid, w, k=0):
    if w is None:
        return LINES[lid]["words"][0]
    hits = [x for x in LINES[lid]["words"] if norm(x["w"]) == norm(w)] or [x for x in LINES[lid]["words"] if norm(x["w"]).startswith(norm(w))]
    if not hits:
        raise SystemExit(f"no word '{w}' in {lid}: {[x['w'] for x in LINES[lid]['words']]}")
    return hits[min(k, len(hits) - 1)]


def lstart(lid):
    return LINES[lid]["words"][0]["start"]


def lend(lid):
    return LINES[lid]["words"][-1]["end"]


def tag_at(tag, lid):
    """'name@word' -> (name, time of the word, or the line start)"""
    if "@" in tag:
        n, w = tag.split("@", 1)
        return n, word(lid, w)["start"]
    return tag, lstart(lid)


# ------------------------------------------------------------------------------------------------ shots
def build_shots():
    shots = []
    ids = [l["id"] for l in SCRIPT["lines"]]
    for idx, sl in enumerate(SCRIPT["lines"]):
        lid = sl["id"]
        lead = 0.16 if sl["who"] == "L" else 0.10
        if sl.get("beat_before") and sl["beat_before"].get("shot") and idx:
            tb = lend(ids[idx - 1]) + 0.22
            shots.append({"t0": round(tb, 3), "type": sl["beat_before"]["shot"], "line": "beat:" + lid})
        jst = JL[lid]["start"] + 0.06                         # a laugh or breath before the first word belongs to the line
        t0 = 0.0 if idx == 0 else min(lstart(lid), jst) - lead
        if sl.get("pause_before") and idx:
            t0 = min(t0, lend(ids[idx - 1]) + 0.25)          # his pause plays in his own shot
        if idx and shots[-1]["type"] == sl["shot"] and shots[-1]["line"] == ids[idx - 1] and SLINES[ids[idx - 1]]["who"] == sl["who"]:
            pass                                              # same speaker, same framing: no cut
        else:
            shots.append({"t0": round(max(0.0, t0), 3), "type": sl["shot"], "line": lid})
        for c in sl.get("cuts", []):
            shots.append({"t0": round(word(lid, c["at"])["start"] - 0.12, 3), "type": c["shot"], "line": lid})
    out = []
    for s in shots:
        p = P[s["type"]]
        d = {"t0": s["t0"], "type": s["type"], "line": s["line"], "cam0": dict(zip(("x", "y", "z"), p["cam0"])), "cam1": dict(zip(("x", "y", "z"), p["cam1"])),
             "sky": bool(p.get("sky")), "bgLod": p.get("bgLod", 0.2 if p.get("sky") else 0.9), "charLod": p.get("charLod", 0), "hand": p.get("hand", 1.0),
             "ease": p.get("ease", "inout"), "grade": p.get("grade", {}), "capY": p.get("capY", 1420), "girl": s["type"] in GIRL_SHOTS}
        out.append(d)
    return out


# ------------------------------------------------------------------------------------------------ captions
ACC = set(w.lower() for w in CFG.get("accent_words", []))


def chunk(words, max_words=3, max_chars=15):
    out, cur = [], []
    fw = {"the", "a", "an", "of", "to", "your", "in", "at", "on", "and", "but", "or", "for", "with", "is", "who", "it", "my", "you"}
    for i, w in enumerate(words):
        cur.append(w)
        txt = " ".join(x["w"] for x in cur)
        nxt = words[i + 1]["w"] if i + 1 < len(words) else None
        endp = bool(re.search(r"[.,!?;:…\"]$", w["w"]))
        too = nxt is not None and (len(cur) >= max_words or len(txt) + 1 + len(nxt) > max_chars)
        if endp or nxt is None or too:
            if not endp and nxt is not None and len(cur) > 1 and norm(w["w"]) in fw:
                carry = cur.pop(); out.append(cur); cur = [carry]; continue
            out.append(cur); cur = []
    if cur:
        out.append(cur)
    return out


def build_captions():
    chunks = []
    for l in VO["lines"]:
        for c in chunk(l["words"]):
            chunks.append((c, l))
    caps = []
    for k, (c, l) in enumerate(chunks):
        t0 = c[0]["start"] - 0.03
        nxt = chunks[k + 1][0][0]["start"] - 0.03 if k + 1 < len(chunks) else DUR
        last = c[-1]["end"]
        t1 = nxt if (nxt - last <= 0.45 and chunks[k + 1][1]["id"] == l["id"]) else min(nxt, last + 0.35)
        caps.append({"t0": round(t0, 3), "t1": round(t1, 3), "who": SLINES[l["id"]]["who"], "line": l["id"],
                     "words": [{"w": x["w"].replace("…", ""), "t0": round(x["start"], 3), "acc": x["w"].lower().strip('"“”') in ACC} for x in c]})
    return caps


# ------------------------------------------------------------------------------------------------ voice envelopes + pulses
def envelopes():
    import soundfile as sf
    a, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), always_2d=True)
    a = a.mean(axis=1)
    hop = sr // 100
    n = len(a) // hop
    rms = np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(axis=1) + 1e-12)
    env = {}
    for who in ("Z", "L"):
        m = np.zeros(n)
        for jl in JOIN["lines"]:
            if SLINES[jl["id"]]["who"] == who:
                m[int(jl["start"] * 100): int(jl["end"] * 100) + 1] = 1
        e = rms * m
        for jl in JOIN["lines"]:                 # per line: quiet deliveries must still move the mouth / the orb
            if SLINES[jl["id"]]["who"] == who:
                i0, i1 = int(jl["start"] * 100), int(jl["end"] * 100) + 1
                seg = e[i0:i1]
                if (seg > 0).any():
                    e[i0:i1] = seg / np.percentile(seg[seg > 0], 90)
        e = np.clip(e, 0, 1.25)
        e = np.where(e < 0.08, 0, e)
        att, rel = (0.55, 0.22) if who == "L" else (0.3, 0.08)
        s = np.zeros(n); v = 0.0
        for i in range(n):
            v += (e[i] - v) * (att if e[i] > v else rel); s[i] = v
        fr = []
        for f in range(NF):
            i0, i1 = int(f / FPS * 100), int((f + 1) / FPS * 100) + 1
            fr.append(float(s[i0:i1].mean()) if i0 < n else 0.0)
        env[who] = [round(min(1.0, x), 3) for x in fr]
        env[who + "_100"] = s
    s = env.pop("Z_100"); env.pop("L_100")
    pulses, last, armed = [], -9, True
    for i in range(1, len(s)):
        if armed and s[i] > 0.5 and s[i - 1] <= 0.5 and i / 100 - last > 0.34:
            pulses.append(round(i / 100 - 0.02, 3)); last = i / 100; armed = False
        if s[i] < 0.3:
            armed = True
    return env, pulses


# ------------------------------------------------------------------------------------------------ the clock
def parse_hm(s):
    h, m = s.split(":")
    return int(h), int(m)


def clock(final_t):
    """minute steps from `from` to `to`: evenly spread, the last one exactly on the final word; real-time soft ticks"""
    h0, m0 = parse_hm(CFG.get("clock", {}).get("from", "2:30"))
    h1, m1 = parse_hm(CFG.get("clock", {}).get("to", "2:47"))
    total = (h1 * 60 + m1) - (h0 * 60 + m0)
    steps = []
    if total > 0:
        a, b = 3.2, max(3.3, final_t - 2.2)
        for k in range(total - 1):
            steps.append(round(a + (b - a) * (k + 0.5) / (total - 1), 3))
        steps.append(round(final_t, 3))
    ticks = []
    t, n = 0.5, 0
    while t < DUR - 0.2:
        ticks.append({"t": round(t, 3), "kind": "tick" if n % 2 == 0 else "tock"}); n += 1; t += 1.0
    st = np.array(steps)
    M, Hh, GL, BM = [], [], [], []
    for f in range(NF):
        tt = f / FPS
        k = int((st <= tt).sum())
        mins = m0 + h0 * 60 + k
        if k:
            age = tt - st[k - 1]
            u = min(1.0, age / 0.09); c = 2.4
            e = 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2      # back-out: the tiny overshoot of a stepping hand
            mins = m0 + h0 * 60 + (k - 1) + e
            glow = 0.3 + 0.5 * math.exp(-age / 0.25) * (1.6 if k == len(steps) else 1.0)
        else:
            glow = 0.3
        mang = math.radians(6.0 * (mins % 60))
        hang = math.radians(30.0 * ((mins / 60.0) % 12))
        M.append(round(mang, 4)); Hh.append(round(hang, 4)); GL.append(round(glow, 3))
        BM.append(0.0)
    return {"m": M, "h": Hh, "glow": GL, "bm": BM}, ticks, steps


# ------------------------------------------------------------------------------------------------ acting
def hsh(n):
    x = math.sin(n * 127.1 + 311.7) * 43758.5453
    return x - math.floor(x)


def acting(shots):
    A = {k: [] for k in ("blinks", "slowBlinks", "lTilt", "lTiltB", "lLift", "lDrop", "nods", "brows", "browOne", "knit", "smile",
                         "widen", "gazeX", "gazeY", "laugh", "squint",
                         "zNod", "zTilt", "orbBoost", "orbDim", "orbPulse", "handTurn", "handLift", "still")}

    def girl(tag, lid, t, t_end):
        n = tag
        dur = max(0.6, t_end - t)
        if n == "blink_slow":
            A["slowBlinks"].append(round(t + 0.05, 3))
        elif n == "head_tilt":
            A["lTilt"].append({"t0": t, "t1": t_end + 0.5, "a": -0.022, "in": 0.45, "out": 0.6})
        elif n == "brows_up":
            A["brows"].append({"t0": t, "t1": t + min(dur, 1.6), "a": 0.9, "in": 0.18, "out": 0.5})
        elif n == "eyes_up":
            A["gazeY"].append({"t0": t, "t1": t + 0.9, "a": -1.0, "in": 0.16, "out": 0.35})
            A["brows"].append({"t0": t, "t1": t + 0.9, "a": 0.6, "in": 0.16, "out": 0.4})
        elif n == "brows_together":
            A["knit"].append({"t0": t, "t1": t_end + 0.4, "a": 1.0, "in": 0.15, "out": 0.4})
        elif n == "head_drop":
            A["lDrop"].append({"t0": t, "t1": t_end, "a": 1.0, "in": 0.3, "out": 0.5})
        elif n == "chin_lift":
            A["lLift"].append({"t0": t - 0.1, "t1": t_end + 0.3, "a": 1.0, "in": 0.35, "out": 0.6})
        elif n == "brow_one":
            A["browOne"].append({"t0": t, "t1": t_end + 0.5, "a": 1.0, "in": 0.2, "out": 0.5})
        elif n in ("half_smile", "smile", "smile_wide"):
            a = {"half_smile": 0.45, "smile": 0.8, "smile_wide": 1.0}[n]
            A["smile"].append({"t0": t, "t1": t_end + 1.0, "a": a, "in": 0.35, "out": 0.7})
        elif n == "laugh":
            for k in range(3):
                A["laugh"].append({"t": round(t + 0.02 + k * 0.2, 3), "a": 1.0 - 0.25 * k, "d": 0.18})
            A["squint"].append({"t0": t, "t1": t + 0.75, "a": 0.28, "in": 0.1, "out": 0.4})
        elif n == "eyes_down":
            A["gazeY"].append({"t0": t, "t1": t + 1.6, "a": 1.0, "in": 0.25, "out": 0.4})
            A["gazeX"].append({"t0": t, "t1": t + 1.6, "a": 0.5, "in": 0.25, "out": 0.4})
        elif n == "eyes_orb":
            A["gazeX"].append({"t0": t, "t1": t_end, "a": 0.7, "in": 0.2, "out": 0.4})
            A["gazeY"].append({"t0": t, "t1": t_end, "a": 0.6, "in": 0.2, "out": 0.4})
        elif n == "eyes_widen":
            A["widen"].append({"t0": t, "t1": t_end + 0.9, "a": 1.0, "in": 0.2, "out": 0.6})
            A["brows"].append({"t0": t, "t1": t_end + 0.9, "a": 0.5, "in": 0.2})
        elif n == "nod":
            A["nods"].append({"t": t, "a": 1.0, "d": 0.5})
        elif n == "eyes_to_him":
            pass
    for i, sl in enumerate(SCRIPT["lines"]):
        lid = sl["id"]
        t_end = lend(lid)
        nxt = SCRIPT["lines"][i + 1]["id"] if i + 1 < len(SCRIPT["lines"]) else None
        t_next = lstart(nxt) if nxt else DUR
        if sl["who"] == "L":
            for tg in sl.get("acting", []):
                n, t = tag_at(tg, lid); girl(n, lid, t, t_end)
        else:
            for tg in sl.get("react", []):
                n, t = tag_at(tg, lid); girl(n, lid, t, t_end)
            for tg in sl.get("acting", []):
                n, t = tag_at(tg, lid)
                if n == "orb_bright":
                    A["orbBoost"].append({"t0": t, "t1": t_end, "a": 0.6, "in": 0.3, "out": 0.6})
                elif n == "hood_tilt":
                    A["zTilt"].append({"t": t, "a": 1.0, "d": 0.9})
                elif n == "orb_pulse":
                    A["orbPulse"].append(round(t, 3))
                elif n == "hand_turn":
                    A["handTurn"].append({"t0": t - 0.2, "t1": t_end, "a": 1.0, "in": 0.6, "out": 0.8})
                elif n == "hood_nod":
                    A["zNod"].append({"t": t, "a": 1.0, "d": 0.7})
                elif n == "still":
                    A["still"].append({"t0": lstart(lid) - 0.2, "t1": t_end + 0.2, "a": 1.0, "in": 0.3, "out": 0.4})
                elif n == "orb_dim":
                    A["orbDim"].append({"t0": lstart(lid) - 0.9, "t1": t_end, "a": 1.0, "in": 0.6, "out": 0.9})
                elif n == "hand_lift":
                    A["handLift"].append({"t0": t - 0.2, "t1": t_end + 0.3, "a": 1.0, "in": 0.6, "out": 0.9})
            # a small hood tilt on the first word of every line of his: he is talking to her
            A["zNod"].append({"t": lstart(lid) + 0.05, "a": 0.35, "d": 0.6})
        del t_next
    # her blinks: every 2.4-4.6 s, one ~0.5 s into each girl shot, one after each of her lines; never within 1.0 s
    cand, t, i = [], 1.1, 0
    while t < DUR - 0.4:
        cand.append(t); t += 2.4 + 2.2 * hsh(i); i += 1
    for s in shots:
        if s["girl"]:
            cand.append(s["t0"] + 0.5)
    for sl in SCRIPT["lines"]:
        if sl["who"] == "L":
            cand.append(lend(sl["id"]) + 0.2)
    slow = A["slowBlinks"]
    for c in sorted(cand):
        if any(abs(c - sb) < 0.9 for sb in slow):
            continue
        if not A["blinks"] or c - A["blinks"][-1] > 1.0:
            A["blinks"].append(round(c, 3))
    # micro gaze saccades while listening (tiny, keep the eyes alive)
    for k in range(int(DUR / 3.1)):
        t0 = 1.5 + k * 3.1 + 0.8 * hsh(k + 50)
        A["gazeX"].append({"t0": round(t0, 3), "t1": round(t0 + 0.7 + 0.6 * hsh(k + 9), 3), "a": round(0.35 * (hsh(k + 3) - 0.5), 3), "in": 0.06, "out": 0.08})
    return A


# ------------------------------------------------------------------------------------------------ orb morphs
def morphs(shots):
    out = []
    for i, sl in enumerate(SCRIPT["lines"]):
        o = sl.get("orb")
        if not o:
            continue
        lid = sl["id"]
        t0 = word(lid, o.get("at"))["start"] - 0.1
        # it holds until the next cut after the line (so it is never cut off mid-word), max 1.2 s after the line
        later = [s["t0"] for s in shots if s["t0"] > lend(lid) - 0.05]
        t1 = min(later[0] - 0.02 if later else DUR, lend(lid) + 1.2)
        m = {"kind": o["morph"], "t0": round(t0, 3), "t1": round(t1, 3), "line": lid}
        if o["morph"] == "log":
            ws = LINES[lid]["words"]
            rows = o.get("rows", [])
            m["rows"] = [{"text": r, "t": round(t0 + 0.35 * k, 3)} for k, r in enumerate(rows)]
        if o["morph"] == "bubbles_reviewed":
            ts = word(lid, o.get("stamp_at", "reviewed"))["start"]
            m["stamps"] = [round(ts + 0.22 * k, 3) for k in range(int(o.get("count", 7)))]
        if o["morph"] == "notepad":
            m["timer"] = o.get("timer", "10:00")
            m["marks"] = [round(word(lid, w)["start"], 3) for w in ("pen.", "worry,", "paper.") if any(norm(x["w"]).startswith(norm(w)) for x in LINES[lid]["words"])]
        if o["morph"] == "tally":
            tf = word(lid, o.get("at", "four"))["start"]
            m["marks"] = [round(tf + 0.11 * k, 3) for k in range(int(o.get("count", 4)))]
        if o["morph"] == "sun_moon":
            m["dim_t0"] = round(lstart(lid) - 0.8, 3)
        out.append(m)
    return out


# ------------------------------------------------------------------------------------------------ main
def main():
    sys.stdout.reconfigure(encoding="utf-8")
    shots = build_shots()
    lines = SCRIPT["lines"]
    ids = [l["id"] for l in lines]
    last = ids[-1]
    fin = lines[-1]
    final_t = word(last, fin.get("final_tick_at"))["start"] if fin.get("final_tick_at") else lstart(last)
    caps = build_captions()
    for c in caps:                                   # a caption never carries into a quiet beat shot
        for sh in shots:
            if sh["line"].startswith("beat:") and c["t0"] < sh["t0"] < c["t1"]:
                c["t1"] = round(sh["t0"], 3)
    env, pulses = envelopes()
    clk, ticks, steps = clock(final_t)
    act = acting(shots)
    mor = morphs(shots)
    # the name tag forms on his first tagged line
    tl = next((l for l in lines if l.get("tag")), None)
    tag = {"t0": round(lstart(tl["id"]) + 0.15, 3), "box": LM["zeythar"].get("tag_draw", LM["zeythar"]["tag_box"]), "rows": ["ZEYTHAR", "THE SAGE AI"]} if tl else None
    # the top chip: category + series label, fade after line 2
    l2 = ids[1] if len(ids) > 1 else ids[0]
    chip = {"t0": 0.0, "t1": round(max(4.0, lend(l2) + 0.2), 3), "category": CFG.get("category", ""), "series": CFG.get("series_label", "CONVERSATIONS BEYOND TIME")}
    # grade events: the turn (warm light softens), the dawn tint on her side
    turn = next((l for l in lines if l.get("turn")), None)
    dawn = next((l for l in lines if l.get("tint") == "dawn"), None)
    grade_ev = {"soft": {"t0": round(lstart(turn["id"]) - 0.4, 3), "t1": round(lend(turn["id"]) + 0.6, 3)} if turn else None,
                "dawn": {"t0": round(lstart(dawn["id"]) + 0.4, 3), "t1": round(lend(dawn["id"]) + 0.6, 3)} if dawn else None}
    # beats: quiet shots (music drops to a single pad)
    beats = []
    for i, sl in enumerate(lines):
        if sl.get("beat_before") and i:
            beats.append({"t0": round(lend(ids[i - 1]) + 0.1, 3), "t1": round(lstart(sl["id"]), 3), "dur": sl["beat_before"].get("dur", 0.8),
                          "line": sl["id"], "quiet": bool(sl["beat_before"].get("shot"))})
    # orb fade at the end (so the clock reads)
    # the orb settles into his palm before a clock close-up ending, so the hands read; otherwise it stays
    orb_end = {"t0": round(lstart(last) - 0.6, 3) if SLINES[last]["shot"] == "CLOCK_CU" else 1e9}
    ec = CFG.get("end_card", {})
    endcard = {"t0": round(lend(last) + 0.55, 3), "rows": ec.get("rows", ["WHAT WOULD YOU", "HAVE SAID?"]), "sub": ec.get("sub", "COMMENT BELOW"),
               "series": CFG.get("series_label", "CONVERSATIONS BEYOND TIME")}
    film = {"dur": DUR, "fps": FPS, "name": NAME, "plateBase": "assets/plate/", "landmarks": LM, "shots": shots, "captions": caps,
            "chip": chip, "tag": tag, "morphs": mor, "orbEnd": orb_end, "clock": clk, "clockSteps": steps, "env": env, "pulses": pulses,
            "acting": act, "gradeEv": grade_ev, "beats": beats, "endcard": endcard, "ringC": [679, 395, 652], "capY": 1420,
            "lines": [{"id": l["id"], "who": SLINES[l["id"]]["who"], "t0": l["start"], "t1": l["end"]} for l in VO["lines"]],
            "cover_hook": CFG.get("cover_hook")}
    lib = os.path.join(ROOT, "assets", "lib")
    open(os.path.join(lib, "film-data.js"), "w", encoding="utf-8").write("/* generated by tools/timeline.py */\nwindow.FILM = " + json.dumps(film, separators=(",", ":"), ensure_ascii=False) + ";\n")
    pd = os.path.join(ROOT, "assets", "plate"); os.makedirs(pd, exist_ok=True)
    for key, f in LM["files"].items():
        if isinstance(f, str) and key != "full":
            src = os.path.join(ROOT, "plate", f)
            if os.path.exists(src) and (not os.path.exists(os.path.join(pd, f)) or os.path.getmtime(src) > os.path.getmtime(os.path.join(pd, f))):
                shutil.copy(src, os.path.join(pd, f))
    write_html()

    def ts(t):
        h, r = divmod(t, 3600); m, s = divmod(r, 60)
        return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s % 1) * 1000)) % 1000:03d}"
    srt = []
    for k, c in enumerate(caps):
        srt.append(f"{k + 1}\n{ts(c['words'][0]['t0'])} --> {ts(c['t1'])}\n{' '.join(x['w'] for x in c['words']).upper()}\n")
    os.makedirs(os.path.join(ROOT, "out"), exist_ok=True)
    open(os.path.join(ROOT, "out", NAME + ".srt"), "w", encoding="utf-8").write("\n".join(srt) + "\n")
    plucks = []
    for sl in lines:
        if sl.get("pluck"):
            plucks.append(round(word(sl["id"], sl["pluck"])["end"] + 0.05, 3))
    cues = {"dur": DUR, "ticks": ticks, "steps": steps, "final_tick": round(final_t, 3), "cuts": [s["t0"] for s in shots[1:]],
            "morphs": [m["t0"] for m in mor], "stamps": [x for m in mor for x in m.get("stamps", [])],
            "bigstamp": [round(m["stamps"][-1] + 0.25, 3) for m in mor if m.get("stamps")], "tally": [x for m in mor if m["kind"] == "tally" for x in m["marks"]],
            "plucks": plucks, "beats": beats, "swell": grade_ev["dawn"], "turn": grade_ev["soft"], "tag": tag["t0"] if tag else None,
            "endcard": endcard["t0"], "laugh": [x["t"] for x in act["laugh"]],
            "voice": [{"id": jl["id"], "who": SLINES[jl["id"]]["who"], "start": jl["start"], "end": jl["end"]} for jl in JOIN["lines"]]}
    os.makedirs(os.path.join(ROOT, "score", "data"), exist_ok=True)
    json.dump(cues, open(os.path.join(ROOT, "score", "data", "cues.json"), "w"), indent=1)
    turn_t = lstart(turn["id"]) if turn else 0
    print(f"{NAME}: {DUR} s · {len(shots)} shots · {len(caps)} captions · {len(mor)} morphs · {len(pulses)} pulses · {len(steps)} minute steps · blinks {len(act['blinks'])}")
    print(f"  first word {lstart(ids[0]):.2f} s · turn {turn_t:.2f} s = {100 * turn_t / DUR:.1f} % · last line {lstart(last):.2f} s "
          f"({endcard['t0'] - lstart(last):.2f} s before the end card at {endcard['t0']:.2f})")
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
      const film = window.ZFILM.create(document.getElementById("gl"), document.getElementById("ovl"));
      let ready = false, curT = 0, lastT = -1;
      function draw(t) { curT = t; t = Math.round(t * 10000) / 10000; if (!ready || t === lastT) return; lastT = t; film.render(t); }
      window.__hf = window.__hf || {}; window.__hf.buildReady = window.__hf.buildReady || {};
      const fontP = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('800 30px "MontserratGD"'), document.fonts.load('900 30px "MontserratGD"'), document.fonts.load('600 30px "MontserratGD"')]).catch(() => null) : Promise.resolve();
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
    libs = ["film-data.js", "zeythar-gl.js", "zeythar-holo.js", "zeythar-overlay.js", "zeythar-film.js"]
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

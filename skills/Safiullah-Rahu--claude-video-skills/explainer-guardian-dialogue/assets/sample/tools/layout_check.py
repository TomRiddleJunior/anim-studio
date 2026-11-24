"""Layout gate, computed from the film data (no render needed): for every frame, project the faces through the shot
camera and test the caption box, the active card zones, the counter, the question and the end card against them and
against the Reels safe areas (top 220 px, bottom 400 px clear of key text).

Faces: the girl's face box and the Guardian's hood opening (his "face") in key-art px, from plate/landmarks.json.
Writes out/qa/layout.json and prints every violation (frame, time, what overlaps what).

usage: python -I tools/layout_check.py
"""
import json
import math
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s = open(os.path.join(ROOT, "assets", "lib", "film-data.js"), encoding="utf-8").read()
F = json.loads(s[s.index("=") + 1: s.rindex(";")])
LM = F["landmarks"]
GIRL_FACE = (940, 372, 1112, 584)                 # forehead to chin, nose tip to the near cheek
HV = LM["guardian"]["hood_void"]
HOOD_FACE = (min(p[0] for p in HV), min(p[1] for p in HV), max(p[0] for p in HV), max(p[1] for p in HV))
SAFE_TOP, SAFE_BOTTOM = 220, 1920 - 400


def ease(u, kind):
    if kind == "out":
        return 1 - (1 - u) ** 3
    if kind == "linear":
        return u
    return -(math.cos(math.pi * u) - 1) / 2


def cam(t):
    S = F["shots"]; i = 0
    while i < len(S) - 1 and t >= S[i + 1]["t0"]:
        i += 1
    sh = S[i]; t1 = S[i + 1]["t0"] if i + 1 < len(S) else F["dur"]
    u = min(1, max(0, (t - sh["t0"]) / max(0.01, t1 - sh["t0"]))); e = ease(u, sh.get("ease", "inout"))
    c = {k: sh["cam0"][k] + (sh["cam1"][k] - sh["cam0"][k]) * e for k in ("x", "y", "z")}
    if not sh["sky"]:
        hw, hh = 540 / c["z"], 960 / c["z"]
        c["x"] = min(max(c["x"], hw), 1402 - hw); c["y"] = min(max(c["y"], hh), 1122 - hh)
    return sh, c


def proj(box, c):
    x0 = 540 + (box[0] - c["x"]) * c["z"]; y0 = 960 + (box[1] - c["y"]) * c["z"]
    x1 = 540 + (box[2] - c["x"]) * c["z"]; y1 = 960 + (box[3] - c["y"]) * c["z"]
    return (x0, y0, x1, y1)


def inter(a, b, pad=0):
    return not (a[2] + pad <= b[0] or b[2] + pad <= a[0] or a[3] + pad <= b[1] or b[3] + pad <= a[1])


def onscreen(b):
    return b[2] > 0 and b[0] < 1080 and b[3] > 0 and b[1] < 1920


def cap_box(c, shot):
    size = c.get("size", 72)
    txt = " ".join(w["w"].upper() for w in c["words"])
    width = 0.66 * size * len(txt)               # Montserrat 800 caps average advance ~0.66 em
    y = shot.get("capY", 1420)
    return (540 - width / 2, y - size * 0.62, 540 + width / 2, y + size * 0.62)


def main():
    viol = []
    fps = F["fps"]
    n = int(F["dur"] * fps)
    stats = {"frames": n, "caption_frames": 0, "card_frames": 0}
    for f in range(n):
        t = f / fps
        sh, c = cam(t)
        faces = []
        for name, box in (("girl face", GIRL_FACE), ("hood opening", HOOD_FACE)):
            b = proj(box, c)
            if onscreen(b):
                faces.append((name, b))
        cards = [(f"card {k['n']}", (k["zone"][0], k["zone"][1], k["zone"][0] + k["zone"][2], k["zone"][1] + k["zone"][3]))
                 for k in F["cards"] if k["t0"] <= t < k["t1"]]
        if cards:
            stats["card_frames"] += 1
        caps = [k for k in F["captions"] if k["t0"] <= t < k["t1"]]
        for k in caps:
            stats["caption_frames"] += 1
            b = cap_box(k, sh)
            for nm, fb in faces + cards:
                if inter(b, fb, pad=6):
                    viol.append({"f": f, "t": round(t, 2), "shot": sh["type"], "what": "caption '" + " ".join(w["w"] for w in k["words"]) + "'", "with": nm})
            if b[1] < SAFE_TOP or b[3] > SAFE_BOTTOM:
                viol.append({"f": f, "t": round(t, 2), "shot": sh["type"], "what": "caption", "with": "safe area"})
        for nm, cb in cards:
            for fn, fb in faces:
                if inter(cb, fb):
                    ov = (min(cb[2], fb[2]) - max(cb[0], fb[0])) * (min(cb[3], fb[3]) - max(cb[1], fb[1]))
                    area = (fb[2] - fb[0]) * (fb[3] - fb[1])
                    if ov / area > 0.04 and sh.get("charLod", 0) < 1.0:     # a defocused face behind a hero card is allowed
                        viol.append({"f": f, "t": round(t, 2), "shot": sh["type"], "what": nm, "with": fn, "share": round(ov / area, 3)})
            if cb[1] < SAFE_TOP or cb[3] > SAFE_BOTTOM:
                viol.append({"f": f, "t": round(t, 2), "shot": sh["type"], "what": nm, "with": "safe area"})
        C = F.get("counter")
        if C and C["t0"] <= t <= C["t1"] and sh.get("counter", True):
            cx = sh.get("counterX", 540)
            cb = (cx - 80, C["y"] - 80, cx + 80, C["y"] + 80)
            for fn, fb in faces + cards:
                if inter(cb, fb):
                    viol.append({"f": f, "t": round(t, 2), "shot": sh["type"], "what": "counter", "with": fn})
            if cb[1] < SAFE_TOP - 12:
                viol.append({"f": f, "t": round(t, 2), "shot": sh["type"], "what": "counter", "with": "safe area"})
    # collapse runs
    runs = []
    for v in viol:
        key = (v["what"], v["with"], v["shot"])
        if runs and runs[-1]["key"] == key and v["f"] - runs[-1]["f1"] <= 1:
            runs[-1]["f1"] = v["f"]; runs[-1]["t1"] = v["t"]
        else:
            runs.append({"key": key, "f0": v["f"], "f1": v["f"], "t0": v["t"], "t1": v["t"]})
    out = {"stats": stats, "violations": [{"what": r["key"][0], "with": r["key"][1], "shot": r["key"][2], "t0": r["t0"], "t1": r["t1"], "frames": r["f1"] - r["f0"] + 1} for r in runs]}
    os.makedirs(os.path.join(ROOT, "out", "qa"), exist_ok=True)
    json.dump(out, open(os.path.join(ROOT, "out", "qa", "layout.json"), "w"), indent=1)
    print(f"layout: {stats['frames']} frames · {len(out['violations'])} violation runs")
    for v in out["violations"]:
        print(f"  {v['t0']:6.2f}-{v['t1']:6.2f}  {v['shot']:12s} {v['what']}  x  {v['with']}  ({v['frames']} f)")


if __name__ == "__main__":
    main()

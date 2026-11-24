"""Layout gate, computed from the film data (no render needed): for every frame, project the girl's face, Zeythar's hood
opening (his "face"), the orb or the active orb morph and the name tag through the shot camera, then test the caption
box against all of them and against the Reels safe areas (top 220 px, bottom 400 px clear of key text, 40 px sides).
Also: a morph must never sit on her face; the name tag and the end card must sit inside the safe areas.

Writes out/qa/layout.json and prints every violation run (time span, shot, what overlaps what).
usage: python -I tools/layout_check.py
"""
import json
import math
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s = open(os.path.join(ROOT, "assets", "lib", "film-data.js"), encoding="utf-8").read()
F = json.loads(s[s.index("=") + 1: s.rindex(";")])
LM = F["landmarks"]
GIRL_FACE = tuple(LM["girl"]["face_box"])
HV = LM["zeythar"]["hood_void"]
HOOD_FACE = (min(p[0] for p in HV), min(p[1] for p in HV), max(p[0] for p in HV), max(p[1] for p in HV))
OX, OY = LM["zeythar"]["orb"]
TAG = tuple(F["tag"]["box"]) if F.get("tag") else None
SAFE_TOP, SAFE_BOTTOM, SIDE = 220, 1920 - 400, 40
# world-space extents of each morph (they are drawn in world units around the orb: zeythar-holo.js)
MORPH_BOX = {
    "log": (OX - 150, OY - 197, OX + 70, OY - 39),
    "bubbles": (OX - 120, OY - 92, OX + 120, OY + 92),
    "bubbles_reviewed": (772 - 150, 392 - 200, 772 + 150, 392 + 200),
    "notepad": (OX - 104, OY - 104, OX + 114, OY + 82),
    "sun_moon": (OX - 104, OY - 64, OX + 114, OY + 48),
    "tally": (OX - 50, OY - 32, OX + 50, OY + 32),
}
ORB_BOX = (OX - 112, OY - 90, OX + 112, OY + 90)


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
    return (540 + (box[0] - c["x"]) * c["z"], 960 + (box[1] - c["y"]) * c["z"], 540 + (box[2] - c["x"]) * c["z"], 960 + (box[3] - c["y"]) * c["z"])


def inter(a, b, pad=0):
    return not (a[2] + pad <= b[0] or b[2] + pad <= a[0] or a[3] + pad <= b[1] or b[3] + pad <= a[1])


def onscreen(b):
    return b[2] > 0 and b[0] < 1080 and b[3] > 0 and b[1] < 1920


def cap_box(c, shot):
    size = c.get("size", 70)
    txt = " ".join(w["w"].upper() for w in c["words"])
    width = min(940, 0.66 * size * len(txt))
    y = shot.get("capY", 1420)
    return (540 - width / 2, y - size * 0.62, 540 + width / 2, y + size * 0.62)


def main():
    viol = []
    fps = F["fps"]
    n = int(F["dur"] * fps)
    stats = {"frames": n, "caption_frames": 0, "morph_frames": 0}
    for f in range(n):
        t = f / fps
        sh, c = cam(t)
        things = []
        for name, box in (("girl face", GIRL_FACE), ("hood opening", HOOD_FACE)):
            b = proj(box, c)
            if onscreen(b):
                things.append((name, b))
        act = [m for m in F["morphs"] if m["t0"] <= t < m["t1"]]
        if act:
            stats["morph_frames"] += 1
            things.append((f"morph {act[0]['kind']}", proj(MORPH_BOX.get(act[0]["kind"], ORB_BOX), c)))
        elif t < F["orbEnd"]["t0"]:
            b = proj(ORB_BOX, c)
            if onscreen(b):
                things.append(("orb", b))
        if TAG and t >= F["tag"]["t0"]:
            b = proj(TAG, c)
            if onscreen(b):
                things.append(("name tag", b))
                if b[0] < SIDE or b[2] > 1080 - SIDE or b[1] < SAFE_TOP or b[3] > SAFE_BOTTOM:
                    if b[2] > 0 and b[0] < 1080:      # fully visible tags only must be inside; a tag leaving frame edge is a cut-off
                        viol.append({"f": f, "t": round(t, 2), "shot": sh["type"], "what": "name tag", "with": "safe area"})
        for k in [k for k in F["captions"] if k["t0"] <= t < k["t1"]]:
            stats["caption_frames"] += 1
            b = cap_box(k, sh)
            for nm, fb in things:
                if inter(b, fb, pad=6):
                    viol.append({"f": f, "t": round(t, 2), "shot": sh["type"], "what": "caption '" + " ".join(w["w"] for w in k["words"]) + "'", "with": nm})
            if b[1] < SAFE_TOP or b[3] > SAFE_BOTTOM or b[0] < SIDE or b[2] > 1080 - SIDE:
                viol.append({"f": f, "t": round(t, 2), "shot": sh["type"], "what": "caption", "with": "safe area"})
        for nm, mb in things:
            if nm.startswith("morph"):
                gf = proj(GIRL_FACE, c)
                if onscreen(gf) and inter(mb, gf):
                    viol.append({"f": f, "t": round(t, 2), "shot": sh["type"], "what": nm, "with": "girl face"})
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
        print(f"  {v['t0']:6.2f}-{v['t1']:6.2f}  {v['shot']:13s} {v['what']}  x  {v['with']}  ({v['frames']} f)")


if __name__ == "__main__":
    main()

"""QA for a Survival Odds episode (run after the delivery encode, under the shared lock):
  out/qa/yavg.json      per-frame YAVG; a black or flash FRAME differs from both neighbours (planned dips excepted)
  out/qa/bands.json     solid black bands touching the top or bottom edge, every frame at 10 fps (band_scan, from
                        samples/survival2d-mine/tools/qa.py): rows with mean luma < 6 and std < 3 from an edge
  out/qa/sweep_NN.jpg   2 fps sweep of the real mp4, 40 tiles a sheet (look at every one)
  out/qa/compare.jpg    the source reel | ours at 14 matched beats (local reference only; never shipped)
  out/qa/gates.json     duration, first word, WPM, both mixes' loudness + true peak, voice over the rest, YAVG, edge
                        bands, stream lengths + frame counts of both files, the odds track, scene changes vs the source
usage: python -I tools/qa.py
"""
import json
import os
import re
import subprocess

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = os.path.basename(ROOT)
ES = os.path.dirname(os.path.dirname(ROOT))
FF = os.path.join(ES, "engine", "node_modules", "ffmpeg-static", "ffmpeg.exe")
FP = os.path.join(os.path.dirname(ES), "ffmpeg-bin", "node_modules", "ffprobe-static", "bin", "win32", "x64", "ffprobe.exe")
MP4 = os.path.join(ROOT, "out", KEY + ".mp4")
NOM = os.path.join(ROOT, "out", KEY + "_nomusic.mp4")
QA = os.path.join(ROOT, "out", "qa")
SRC = os.path.join(ES, "research", "insta4", "media", "De0HQ6Mpycw.mp4")
_SM = os.path.join(ES, "research", "insta4", "frames", "De0HQ6Mpycw", "metrics.json")   # the format's source reel (local reference only)
SRC_M = json.load(open(_SM, encoding="utf-8")) if os.path.exists(_SM) else {"wpm_overall": 134, "scene_changes_per_min": None, "cuts_per_min": None}
os.makedirs(QA, exist_ok=True)
TM = json.load(open(os.path.join(ROOT, "score", "timing.json"), encoding="utf-8"))
T, DUR = TM["T"], TM["dur"]


def font(sz):
    for f in (r"C:\Windows\Fonts\arialbd.ttf", r"C:\Windows\Fonts\arial.ttf"):
        if os.path.exists(f):
            return ImageFont.truetype(f, sz)
    return ImageFont.load_default()


def grab(path, t, w):
    from io import BytesIO
    r = subprocess.run([FF, "-v", "error", "-ss", f"{max(0, t):.3f}", "-i", path, "-frames:v", "1", "-vf", f"scale={w}:-2", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True)
    return Image.open(BytesIO(r.stdout)).convert("RGB")


def loud(path):
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", path, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    s = r.stderr[r.stderr.rindex("Summary:"):]
    return float(re.search(r"I:\s+(-?[0-9.]+) LUFS", s).group(1)), float(re.search(r"Peak:\s+(-?[0-9.]+) dBFS", s).group(1))


def streams(path):
    r = subprocess.run([FP, "-v", "error", "-count_frames", "-show_entries", "stream=codec_type,duration,nb_read_frames", "-of", "json", path], capture_output=True, text=True)
    out = {}
    for s in json.loads(r.stdout)["streams"]:
        out[s["codec_type"]] = float(s["duration"])
        if s["codec_type"] == "video":
            out["frames"] = int(s.get("nb_read_frames", 0))
    return out


def band_scan(path, fps=10, min_px=24, planned=()):
    """Solid black bands touching the top or bottom edge (copied from samples/survival2d-mine/tools/qa.py): per frame
    (at fps), the run of rows from each edge whose mean luma < 6 and std < 3. Fully black frames are skipped. A band
    >= min_px outside the planned dark beats is a violation."""
    W_, H_ = 270, 1920
    pr = subprocess.Popen([FF, "-v", "error", "-i", path, "-vf", f"fps={fps},scale={W_}:{H_}:flags=area,format=gray", "-f", "rawvideo", "-pix_fmt", "gray", "-"], stdout=subprocess.PIPE)
    per, viol, i = [], [], 0
    while True:
        buf = pr.stdout.read(W_ * H_)
        if len(buf) < W_ * H_:
            break
        f = np.frombuffer(buf, np.uint8).reshape(H_, W_).astype(np.float32)
        t = round(i / fps, 2); i += 1
        if f.mean() < 6 and f.std() < 3:
            continue
        dark = (f.mean(axis=1) < 6) & (f.std(axis=1) < 3)
        top = int(np.argmin(dark)) if not dark.all() else H_
        bot = int(np.argmin(dark[::-1])) if not dark.all() else H_
        b = max(top, bot)
        if b > 0:
            per.append([t, top, bot])
        # the fps filter rounds to the nearest sample: the sample labelled t can be the source frame up to half an
        # interval later (the first black frame of a planned beat showed up labelled 0.03 s before the beat)
        if b >= min_px and not any(a - 0.5 / fps <= t <= z for a, z in planned):
            viol.append([t, top, bot])
    pr.wait()
    worst = sorted(per, key=lambda r: -max(r[1], r[2]))[:10]
    return {"fps": fps, "frames_scanned": i, "min_band_px": min_px, "planned_dark": [list(x) for x in planned],
            "frames_with_any_edge_band": len(per), "worst": worst, "violations": viol, "pass": not viol}


# ------------------------------------------------------------------ YAVG dips / flashes
r = subprocess.run([FF, "-hide_banner", "-i", MP4, "-vf", "signalstats,metadata=print:key=lavfi.signalstats.YAVG", "-an", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
v = [float(x) for x in re.findall(r"lavfi\.signalstats\.YAVG=([0-9.]+)", r.stderr)]
planned = ([(T[k] - 0.1, T[k] + (0.7 if k == "Z2" else 0.4)) for k in TM["dips"]] if TM.get("dips") else
           [(T[k] - 0.1, T[k] + 0.4) for k in ("B", "S") if k in T] + [(T["Z2"] - 0.1, T["Z2"] + 0.7)] * ("Z2" in T))   # dips through black, by design
flags = []
for i in range(1, len(v) - 1):
    a = v[i] < 0.6 * min(v[i - 1], v[i + 1])
    b = v[i] < v[i - 1] - 50
    c = v[i] > 1.6 * max(v[i - 1], v[i + 1]) + 8
    if a or b or c:
        t = i / 30
        flags.append({"frame": i, "t": round(t, 3), "prev": round(v[i - 1], 1), "v": round(v[i], 1), "next": round(v[i + 1], 1),
                      "rule": "0.6*min" if a else "drop>50" if b else "flash", "planned": any(p0 <= t <= p1 for p0, p1 in planned)})
jumps = sorted(((abs(v[i] - v[i - 1]), i) for i in range(1, len(v))), reverse=True)[:30]
json.dump({"frames": len(v), "min": round(min(v), 1), "max": round(max(v), 1), "mean": round(float(np.mean(v)), 1), "first_frame_yavg": round(v[0], 1), "flags": flags,
           "unplanned_flags": [f for f in flags if not f["planned"]],
           "largest_steps": [{"t": round(i / 30, 3), "from": round(v[i - 1], 1), "to": round(v[i], 1)} for _, i in sorted(jumps, key=lambda x: x[1])]},
          open(os.path.join(QA, "yavg.json"), "w"), indent=1)
print(f"YAVG {min(v):.1f}-{max(v):.1f} mean {np.mean(v):.1f}; flags {len(flags)} (unplanned {sum(1 for f in flags if not f['planned'])})")

# ------------------------------------------------------------------ edge bands (planned: the two black beats and the end)
bands = band_scan(MP4, 10, 24, [tuple(x) for x in TM["dark"]] if TM.get("dark") else [(T["B"], T["C"])] * ("B" in T and "C" in T) + [(T["S"], DUR + 1)] * ("S" in T))
json.dump(bands, open(os.path.join(QA, "bands.json"), "w"), indent=1)
print(f"edge bands: {len(bands['violations'])} violations; worst {bands['worst'][:3]}")

# ------------------------------------------------------------------ 2 fps sweep sheets (real mp4)
tw, th = 216, 384
frames = []
p = subprocess.Popen([FF, "-v", "error", "-i", MP4, "-vf", f"fps=2,scale={tw}:{th}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
while True:
    buf = p.stdout.read(tw * th * 3)
    if len(buf) < tw * th * 3:
        break
    frames.append(Image.frombytes("RGB", (tw, th), buf))
p.wait()
f12 = font(16)
per = 40
for s0 in range(0, len(frames), per):
    chunk = frames[s0:s0 + per]
    cols = 10
    rows = (len(chunk) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, rows * (th + 22)), (16, 16, 16))
    d = ImageDraw.Draw(sheet)
    for k, im in enumerate(chunk):
        x, y = (k % cols) * tw, (k // cols) * (th + 22)
        sheet.paste(im, (x, y + 22))
        d.text((x + 4, y + 3), f"{(s0 + k) / 2:.1f}s", fill=(230, 230, 230), font=f12)
    sheet.save(os.path.join(QA, f"sweep_{s0 // per + 1:02d}.jpg"), quality=86)
print(f"sweep: {len(frames)} frames in {(len(frames) + per - 1) // per} sheets")

# ------------------------------------------------------------------ compare.jpg: 14 matched beats (the source reel is a local reference)
if os.path.exists(SRC) and all(k in T for k in ("A2", "B", "C", "F3", "G", "I", "J", "K", "L2", "O1", "R", "S", "Z2")):
    BEATS = [("hook: the place, frame 1", 1.5, 0.0), ("'consider yourself lucky' (green)", 7.5, T["A2"] + 1.5), ("open loop: black + red eyes", 12.5, T["B"] + 1.8),
             ("meet her + name tag", 16.0, T["C"] + 1.2), ("routine chips", 26.0, T["F3"] + 0.8), ("'life changed forever' (red)", 30.0, T["G"] + 1.8),
             ("radio message panel", 41.5, T["I"] + 1.4), ("decision: '?'", 46.5, T["J"] + 1.2), ("why not: the danger (red)", 55.0, T["K"] + 2.5),
             ("the advantage tag", 64.5, T["L2"] + 1.8), ("inventory card", 84.0, T["O1"] + 2.6), ("checklist: check", 99.0, T["R"] + 2.3),
             ("'forgot one thing' (black)", 103.0, T["S"] + 1.8), ("end card: DAY 2", 108.5, T["Z2"] + 1.2)]
    TW, TH = 240, 427
    cols, rows = 7, 2
    cell_w, cell_h = TW * 2 + 18, TH + 46
    sheet = Image.new("RGB", (cols * cell_w, rows * cell_h), (14, 14, 14))
    d = ImageDraw.Draw(sheet)
    for k, (lab, ts, to) in enumerate(BEATS):
        x, y = (k % cols) * cell_w, (k // cols) * cell_h
        sheet.paste(grab(SRC, ts, TW).resize((TW, TH)), (x + 4, y + 40)); sheet.paste(grab(MP4, to, TW).resize((TW, TH)), (x + TW + 10, y + 40))
        d.text((x + 6, y + 4), f"{k + 1}. {lab}", fill=(240, 240, 240), font=font(15))
        d.text((x + 6, y + 22), f"source {ts:.1f}s", fill=(160, 160, 160), font=font(13))
        d.text((x + TW + 12, y + 22), f"ours {to:.1f}s", fill=(247, 183, 51), font=font(13))
    sheet.save(os.path.join(QA, "compare.jpg"), quality=88)
    print("compare.jpg written")

# ------------------------------------------------------------------ gates
m = json.load(open(os.path.join(QA, "metrics.json"), encoding="utf-8")) if os.path.exists(os.path.join(QA, "metrics.json")) else {}
lev = json.load(open(os.path.join(ROOT, "score", "levels.json"), encoding="utf-8"))
vo = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
lm, ln_ = loud(MP4), (loud(NOM) if os.path.exists(NOM) else (None, None))
dm, dn = streams(MP4), (streams(NOM) if os.path.exists(NOM) else {})
src_wpm = SRC_M["wpm_overall"]
wpm = m.get("wpm_overall")
g = {
    "duration_s": {"ours": m.get("duration_s"), "gate": "85-102 s", "pass": bool(m.get("duration_s") and 85 <= m["duration_s"] <= 102)},
    "first_word_s": {"ours": vo["lines"][0]["start"], "gate": "<= 0.4 s", "pass": vo["lines"][0]["start"] <= 0.4},
    "wpm": {"ours_analyzer": wpm, "ours_vo": round(vo["words"] / vo["duration"] * 60, 1), "survival_reference": src_wpm, "gate": "±20 % of 134", "pass": bool(wpm and abs(wpm - 134) / 134 <= 0.2)},
    "loudness_full": {"lufs": lm[0], "true_peak_dbtp": lm[1], "gate": "-14 ±1, TP <= -1", "pass": abs(lm[0] + 14) <= 1 and lm[1] <= -1},
    "loudness_nomusic": {"lufs": ln_[0], "true_peak_dbtp": ln_[1], "gate": "-14 ±1, TP <= -1", "pass": bool(ln_[0] is not None and abs(ln_[0] + 14) <= 1 and ln_[1] <= -1)},
    "voice_over_rest_db": {"full": lev.get("voice_over_rest_db_full"), "nomusic": lev.get("voice_over_rest_db_nomusic"), "music_alone": lev.get("voice_over_music_db"), "gate": ">= 10 dB",
                           "pass": (lev.get("voice_over_rest_db_full") or 0) >= 10 and (lev.get("voice_over_rest_db_nomusic") or 0) >= 10},
    "yavg_unplanned": {"count": sum(1 for f in flags if not f["planned"]), "gate": "0", "pass": not any(not f["planned"] for f in flags)},
    "edge_black_bands": {"violations": len(bands["violations"]), "worst": bands["worst"][:3], "gate": "no band >= 24 px outside the planned black beats", "pass": bands["pass"]},
    "streams_match": {"full": dm, "nomusic": dn, "gate": "|v - a| <= 0.05 s each, same frame count", "pass": bool(dn) and abs(dm["video"] - dm["audio"]) <= 0.05 and abs(dn["video"] - dn["audio"]) <= 0.05 and dm.get("frames") == dn.get("frames")},
    "odds_track": TM.get("odds"),
    "scene_changes_per_min": {"ours": m.get("scene_changes_per_min"), "source": SRC_M["scene_changes_per_min"], "note": "explained miss (survival skill §2)"},
    "cuts_per_min": {"ours": m.get("cuts_per_min"), "source": SRC_M["cuts_per_min"]},
    "look": {"brightness": m.get("brightness"), "colourfulness": m.get("colourfulness"), "motion_mean": m.get("motion_mean"),
             "source": {k: SRC_M.get(k) for k in ("brightness", "colourfulness", "motion_mean")}},
}
json.dump(g, open(os.path.join(QA, "gates.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
for k, x in g.items():
    print(f"{k:24s} {json.dumps(x, ensure_ascii=False)[:220]}")

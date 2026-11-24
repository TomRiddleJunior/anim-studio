"""QA for a delivered reel: the engine analyzer (metrics.json), 2 fps sweep sheets of the real mp4, a source|ours compare
sheet at matched beats, YAVG dips (unplanned black / flash frames), stream lengths + frame counts of both delivery files,
loudness + true peak of both mixes, first visual change, and gates.json against the source's metrics.

usage: python -X utf8 -I tools/qa.py --analyzer <engine/qa/analyze_video.py> --source-metrics <metrics.json>
          [--source-clip <reference.mp4>] [--no-analyze]
The reference clip (analysed locally for reference only) is only needed for the compare sheet; it has no default.
ffmpeg/ffprobe come from $FFMPEG / $FFPROBE or the PATH. Reads tools/qa_config.json (beats, planned dips, source WPM).
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = os.path.basename(ROOT)
FF = os.environ.get("FFMPEG") or shutil.which("ffmpeg") or "ffmpeg"
FP = os.environ.get("FFPROBE") or shutil.which("ffprobe") or "ffprobe"
CFG = json.load(open(os.path.join(ROOT, "tools", "qa_config.json"), encoding="utf-8"))
QA = os.path.join(ROOT, "out", "qa")
try:
    FB = ImageFont.truetype("arialbd.ttf", 15)
    FS = ImageFont.truetype("arial.ttf", 13)
except OSError:
    FB = FS = ImageFont.load_default()


def grab(path, t, w, h):
    p = subprocess.run([FF, "-v", "error", "-ss", f"{t:.3f}", "-i", path, "-frames:v", "1", "-vf", f"scale={w}:{h}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
    return Image.fromarray(np.frombuffer(p.stdout, np.uint8).reshape(h, w, 3))


def frames(path, fps, w, h):
    p = subprocess.run([FF, "-v", "error", "-i", path, "-vf", f"fps={fps},scale={w}:{h}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
    return np.frombuffer(p.stdout, np.uint8).reshape(-1, h, w, 3)


def loud(path):
    r = subprocess.run([FF, "-hide_banner", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--analyzer", required=True)
    ap.add_argument("--source-metrics", required=True)
    ap.add_argument("--source-clip")
    ap.add_argument("--no-analyze", action="store_true")
    a = ap.parse_args()
    mp4 = os.path.join(ROOT, "out", NAME + ".mp4")
    nom = os.path.join(ROOT, "out", NAME + "_nomusic.mp4")
    os.makedirs(QA, exist_ok=True)
    if not a.no_analyze:
        subprocess.run([sys.executable, "-X", "utf8", "-I", a.analyzer, mp4, QA], check=True, stdout=subprocess.DEVNULL)
    m = json.load(open(os.path.join(QA, "metrics.json"), encoding="utf-8"))
    sm = json.load(open(a.source_metrics, encoding="utf-8"))
    # ---- 2 fps sweep of the real mp4
    TW, TH, COLS = 135, 240, 12
    fr = frames(mp4, 2, TW, TH)
    per = COLS * 8
    for k in range(0, len(fr), per):
        chunk = fr[k:k + per]
        rows = (len(chunk) + COLS - 1) // COLS
        sheet = Image.new("RGB", (COLS * TW, rows * (TH + 16) + 26), (20, 20, 22))
        d = ImageDraw.Draw(sheet)
        d.text((6, 5), f"SWEEP 2 fps · {NAME} · part {k // per + 1}", fill=(240, 200, 90), font=FB)
        for i, f in enumerate(chunk):
            x, y = (i % COLS) * TW, 26 + (i // COLS) * (TH + 16)
            sheet.paste(Image.fromarray(f), (x, y + 16))
            d.text((x + 3, y + 1), f"{(i + k) / 2:5.1f}s", fill=(200, 200, 200), font=FS)
        sheet.save(os.path.join(QA, f"sweep_{k // per + 1}.jpg"), quality=88)
    # ---- compare sheet (needs the reference clip)
    if a.source_clip and CFG.get("beats"):
        B = CFG["beats"]
        CW, CH, cols = 200, 356, 4
        rows = (len(B) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * (2 * CW + 14), rows * (CH + 44) + 32), (22, 22, 24))
        d = ImageDraw.Draw(sheet)
        d.text((8, 8), f"LEFT: reference   RIGHT: {NAME} — matched by role in the format", fill=(235, 235, 235), font=FB)
        for i, (ts, to, lab) in enumerate(B):
            x, y = (i % cols) * (2 * CW + 14), 32 + (i // cols) * (CH + 44)
            sheet.paste(grab(a.source_clip, ts, CW, CH), (x, y + 40)); sheet.paste(grab(mp4, to, CW, CH), (x + CW, y + 40))
            d.text((x + 4, y + 2), lab, fill=(255, 255, 255), font=FB)
            d.text((x + 4, y + 21), f"ref {ts:5.1f} s", fill=(255, 210, 90), font=FS); d.text((x + CW + 4, y + 21), f"ours {to:5.1f} s", fill=(120, 210, 255), font=FS)
        sheet.save(os.path.join(QA, "compare.jpg"), quality=90)
    # ---- YAVG dips / flashes
    r = subprocess.run([FF, "-hide_banner", "-i", mp4, "-vf", "signalstats,metadata=print:key=lavfi.signalstats.YAVG", "-an", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    v = [float(x) for x in re.findall(r"lavfi\.signalstats\.YAVG=([0-9.]+)", r.stderr)]
    planned = CFG.get("planned_dips", [])
    flags, unplanned = [], []
    for i in range(1, len(v) - 1):
        # a black or flash FRAME differs from both neighbours; a hard cut to a darker or brighter set is a step, not a dip
        lo, hi = min(v[i - 1], v[i + 1]), max(v[i - 1], v[i + 1])
        if v[i] < 0.6 * lo or v[i] < lo - 40 or v[i] > 1.6 * hi + 8 or v[i] > hi + 40:
            t = round(i / 30, 3)
            f = {"t": t, "prev": round(v[i - 1], 1), "v": round(v[i], 1), "next": round(v[i + 1], 1)}
            flags.append(f)
            if not any(abs(t - p) < 0.35 for p in planned):
                unplanned.append(f)
    first_change = next((i / 30 for i in range(1, len(v)) if abs(v[i] - v[0]) > 1.5), None)
    json.dump({"frames": len(v), "min": round(min(v), 1), "mean": round(float(np.mean(v)), 1), "flags": flags, "unplanned": unplanned, "first_frame_yavg": round(v[0], 1)},
              open(os.path.join(QA, "yavg.json"), "w"), indent=1)
    # ---- streams, loudness
    dm, dn = streams(mp4), streams(nom)
    lm, ln_ = loud(mp4), loud(nom)
    lv = json.load(open(os.path.join(ROOT, "score", "levels.json"), encoding="utf-8"))
    vo = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
    first_word = vo["lines"][0]["start"]
    src_wpm = CFG.get("source_wpm_true", sm.get("wpm_overall"))

    def within(x, ref, tol):
        return bool(ref) and abs(x - ref) / ref <= tol
    g = {
        "duration_s": {"source": sm["duration_s"], "ours": m["duration_s"], "gate": "±15 %", "pass": within(m["duration_s"], sm["duration_s"], 0.15)},
        "cuts_per_min": {"source": sm["cuts_per_min"], "ours": m["cuts_per_min"], "gate": "±20 % or explained", "pass": within(m["cuts_per_min"], sm["cuts_per_min"], 0.2) if sm["cuts_per_min"] else None},
        "scene_changes_per_min": {"source": sm["scene_changes_per_min"], "ours": m["scene_changes_per_min"], "gate": "±20 % or explained",
                                  "pass": within(m["scene_changes_per_min"], sm["scene_changes_per_min"], 0.2) if sm["scene_changes_per_min"] else m["scene_changes_per_min"] == 0},
        "wpm": {"source": src_wpm, "ours": m.get("wpm_overall"), "gate": "±20 %", "pass": within(m.get("wpm_overall") or 0, src_wpm, 0.2)},
        "first_word_s": {"ours": round(first_word, 2), "gate": "≤ 0.4 s", "pass": first_word <= 0.4},
        "first_visual_change_s": {"ours": first_change, "gate": "≤ 0.4 s (or first word)", "pass": (first_change or 9) <= 0.4 or first_word <= 0.4},
        "loudness_full": {"lufs": lm[0], "true_peak_dbtp": lm[1], "gate": "-14 ±1, TP ≤ -1", "pass": abs(lm[0] + 14) <= 1 and lm[1] <= -1},
        "loudness_nomusic": {"lufs": ln_[0], "true_peak_dbtp": ln_[1], "gate": "-14 ±1, TP ≤ -1", "pass": abs(ln_[0] + 14) <= 1 and ln_[1] <= -1},
        "voice_over_bed_db": {"full": lv.get("voice_over_rest_db_full"), "nomusic": lv.get("voice_over_rest_db_nomusic"), "music_alone": lv.get("voice_over_music_db"), "gate": "≥ 10 dB", "pass": (lv.get("voice_over_rest_db_full") or 0) >= 10},
        "unplanned_dips_flashes": {"count": len(unplanned), "gate": "0", "pass": len(unplanned) == 0},
        "streams_match": {"full": dm, "nomusic": dn, "gate": "|v - a| ≤ 0.05 s, same frame count", "pass": abs(dm["video"] - dm["audio"]) <= 0.05 and abs(dn["video"] - dn["audio"]) <= 0.05 and dm.get("frames") == dn.get("frames")},
        "look": {"source": {k: sm.get(k) for k in ("brightness", "colourfulness", "motion_mean")}, "ours": {k: m.get(k) for k in ("brightness", "colourfulness", "motion_mean")}},
    }
    json.dump(g, open(os.path.join(QA, "gates.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    for k, x in g.items():
        print(f"{k:24s} {json.dumps(x, ensure_ascii=False)}")


if __name__ == "__main__":
    main()

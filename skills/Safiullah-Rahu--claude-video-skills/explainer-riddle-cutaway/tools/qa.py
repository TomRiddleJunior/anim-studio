"""QA for a batch-8 reel (run after deliver.sh; anaconda python: numpy + PIL):
  out/qa/yavg.json      per-frame YAVG; flags v < 0.6*min(nbrs) or a drop > 50 (black / flash frames), minus planned dips
  out/qa/sweep_NN.jpg   2 fps sweep of the real mp4, 40 tiles per sheet with timestamps (look at every one)
  out/qa/compare.jpg    reference | ours at matched beats (only with --ref)
  out/qa/gates.json     duration, first word, WPM, cuts/scene changes vs a reference, loudness/true peak (both mixes), voice
                        vs bed, stream lengths, Whisper recall
usage: python -I tools/qa.py [--ref <reference.mp4>] [--ref-metrics <reference metrics.json>]
  The reference is optional and has no default: a video you have the right to use and its engine-analyzer metrics.json
  (or set "source" / "source_metrics" in tools/qa_config.json). Without them the reference columns stay empty (null).
"""
import json
import os
import re
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = os.path.basename(ROOT)
ES = os.path.dirname(os.path.dirname(ROOT))
FF = os.path.join(ES, "engine", "node_modules", "ffmpeg-static", "ffmpeg.exe")
CFG = json.load(open(os.path.join(ROOT, "tools", "qa_config.json"), encoding="utf-8"))
MP4 = os.path.join(ROOT, "out", KEY + ".mp4")
NOM = os.path.join(ROOT, "out", KEY + "_nomusic.mp4")
QA = os.path.join(ROOT, "out", "qa")


def _arg(flag):
    if flag in sys.argv:
        i = sys.argv.index(flag)
        if i + 1 < len(sys.argv):
            return sys.argv[i + 1]
    return None


SRC = _arg("--ref") or CFG.get("source") or None                     # reference video (optional, no default)
_SRC_MP = _arg("--ref-metrics") or CFG.get("source_metrics") or None  # its metrics.json (optional)
SRC_M = json.load(open(_SRC_MP, encoding="utf-8")) if _SRC_MP else {}
os.makedirs(QA, exist_ok=True)


def font(sz):
    return ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", sz)


def grab(path, t, w):
    r = subprocess.run([FF, "-v", "error", "-ss", f"{max(0, t):.3f}", "-i", path, "-frames:v", "1", "-vf", f"scale={w}:-2", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True)
    from io import BytesIO
    return Image.open(BytesIO(r.stdout)).convert("RGB")


# ---------------------------------------------------------------- YAVG
r = subprocess.run([FF, "-hide_banner", "-i", MP4, "-vf", "signalstats,metadata=print:key=lavfi.signalstats.YAVG", "-an", "-f", "null", "-"],
                   capture_output=True, text=True, encoding="utf-8", errors="replace")
v = [float(x) for x in re.findall(r"lavfi\.signalstats\.YAVG=([0-9.]+)", r.stderr)]
planned = [tuple(p) for p in CFG.get("planned_dips", [])]
flags = []
for i in range(1, len(v) - 1):
    a = v[i] < 0.6 * min(v[i - 1], v[i + 1])
    b = v[i] < v[i - 1] - 50
    c = v[i] > 1.6 * max(v[i - 1], v[i + 1]) + 8  # one-frame flash
    if a or b or c:
        t = i / 30
        flags.append({"t": round(t, 3), "prev": round(v[i - 1], 1), "v": round(v[i], 1), "next": round(v[i + 1], 1),
                      "rule": "0.6*min" if a else ("drop>50" if b else "flash"), "planned": any(p0 <= t <= p1 for p0, p1 in planned)})
json.dump({"frames": len(v), "min": round(min(v), 1), "max": round(max(v), 1), "mean": round(float(np.mean(v)), 1), "flags": flags,
           "unplanned_flags": [f for f in flags if not f["planned"]]}, open(os.path.join(QA, "yavg.json"), "w"), indent=1)
print(f"YAVG {min(v):.1f}-{max(v):.1f} mean {np.mean(v):.1f}; flags {len(flags)} (unplanned {sum(1 for f in flags if not f['planned'])})")

# ---------------------------------------------------------------- 2 fps sweep
tw, th = 216, 384
frames = []
p = subprocess.Popen([FF, "-v", "error", "-i", MP4, "-vf", f"fps=2,scale={tw}:{th}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
while True:
    buf = p.stdout.read(tw * th * 3)
    if len(buf) < tw * th * 3:
        break
    frames.append(Image.frombytes("RGB", (tw, th), buf))
p.wait()
per = 40
for s in range(0, len(frames), per):
    chunk = frames[s:s + per]
    cols, rows = 10, (len(chunk) + 9) // 10
    sheet = Image.new("RGB", (cols * tw, rows * (th + 22)), (40, 40, 40))
    d = ImageDraw.Draw(sheet)
    for k, im in enumerate(chunk):
        x, y = (k % cols) * tw, (k // cols) * (th + 22)
        sheet.paste(im, (x, y + 22))
        d.text((x + 4, y + 3), f"{(s + k) / 2:.1f}s", fill=(240, 220, 120), font=font(15))
    sheet.save(os.path.join(QA, f"sweep_{s // per + 1:02d}.jpg"), quality=86)
print(f"sweep: {len(frames)} frames")

# ---------------------------------------------------------------- compare.jpg (LEFT: reference, RIGHT: ours)
BEATS = CFG["beats"]
if SRC:
    TW, TH = 240, 427
    cols = 6
    rows = (len(BEATS) + cols - 1) // cols
    cw, chh = TW * 2 + 18, TH + 46
    sheet = Image.new("RGB", (cols * cw, rows * chh), (24, 24, 24))
    d = ImageDraw.Draw(sheet)
    for k, (lab, ts, to) in enumerate(BEATS):
        x, y = (k % cols) * cw, (k // cols) * chh
        sheet.paste(grab(SRC, ts, TW).resize((TW, TH)), (x + 4, y + 40))
        sheet.paste(grab(MP4, to, TW).resize((TW, TH)), (x + TW + 10, y + 40))
        d.text((x + 6, y + 4), f"{k + 1}. {lab}", fill=(240, 240, 240), font=font(15))
        d.text((x + 6, y + 22), f"reference {ts:.1f}s", fill=(160, 160, 160), font=font(13))
        d.text((x + TW + 12, y + 22), f"ours {to:.1f}s", fill=(247, 183, 51), font=font(13))
    sheet.save(os.path.join(QA, "compare.jpg"), quality=88)
else:
    print("compare: skipped (no --ref reference video)")


# ---------------------------------------------------------------- gates
def loud(path):
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", path, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    I_ = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
    TP_ = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r.stderr)
    return (float(I_[-1]) if I_ else None, float(TP_[-1]) if TP_ else None)


def streams(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,duration", "-of", "json", path], capture_output=True, text=True)
    return {s["codec_type"]: round(float(s["duration"]), 3) for s in json.loads(r.stdout)["streams"]}


m = json.load(open(os.path.join(QA, "metrics.json"), encoding="utf-8"))
lev = json.load(open(os.path.join(ROOT, "score", "levels.json"), encoding="utf-8"))
vo = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
wh = json.load(open(os.path.join(QA, "whisper_check.json"), encoding="utf-8")) if os.path.exists(os.path.join(QA, "whisper_check.json")) else {}
I1, TP1 = loud(MP4)
I2, TP2 = loud(NOM) if os.path.exists(NOM) else (None, None)
s1, s2 = streams(MP4), (streams(NOM) if os.path.exists(NOM) else {})
dur, sd = m["duration_s"], SRC_M.get("duration_s")


def ratio(a, b):
    return round(a / b, 3) if (a is not None and b) else None


g = {
    "duration_s": dur, "duration_source": sd, "duration_ratio": ratio(dur, sd), "duration_ok": (abs(dur / sd - 1) <= 0.15) if sd else None,
    "first_word_s": vo["lines"][0]["start"], "first_word_ok": vo["lines"][0]["start"] <= 0.4,
    "wpm": m.get("wpm_overall"), "wpm_source": SRC_M.get("wpm_overall"), "wpm_ratio": ratio(m.get("wpm_overall"), SRC_M.get("wpm_overall")),
    "cuts_per_min": m["cuts_per_min"], "cuts_source": SRC_M.get("cuts_per_min"),
    "scene_changes_per_min": m["scene_changes_per_min"], "scene_changes_source": SRC_M.get("scene_changes_per_min"),
    "scene_ratio": ratio(m["scene_changes_per_min"], SRC_M.get("scene_changes_per_min")),
    "motion_mean": m["motion_mean"], "motion_source": SRC_M.get("motion_mean"),
    "brightness": m["brightness"], "brightness_source": SRC_M.get("brightness"), "colourfulness": m["colourfulness"], "colourfulness_source": SRC_M.get("colourfulness"),
    "lufs_full": I1, "true_peak_full": TP1, "lufs_nomusic": I2, "true_peak_nomusic": TP2,
    "loudness_ok": all(x is not None and abs(x + 14) <= 1 for x in (I1, I2)) and all(x is not None and x <= -1 for x in (TP1, TP2)),
    "voice_over_bed_db": -lev["bed_re_vo_db"] if lev.get("bed_re_vo_db") is not None else None,
    "voice_over_bed_plus_sfx_db": -lev["bed_plus_sfx_re_vo_db"],
    "streams_full": s1, "streams_nomusic": s2,
    "streams_match": abs(s1.get("video", 0) - s1.get("audio", 0)) < 0.1 and (not s2 or abs(s2.get("video", 0) - s2.get("audio", 0)) < 0.1),
    "whisper_all_lines": wh.get("all_lines_heard"), "whisper_mean_recall": wh.get("mean_recall"),
    "yavg_unplanned_flags": sum(1 for f in flags if not f["planned"]),
}
json.dump(g, open(os.path.join(QA, "gates.json"), "w"), indent=1)
print(json.dumps(g, indent=1))

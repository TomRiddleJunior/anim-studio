"""QA for an edit reel (run after deliver.sh). Reads film.json (slug, planned dips, compare beats, voice).
  out/qa/yavg.json      per-frame YAVG; flags v[i] < 0.6*min(nbrs) or a drop > 50, minus planned dips
  out/qa/sweep_NN.jpg   2 fps sweep of the real mp4, 40 tiles per sheet with timestamps (look at every tile)
  out/qa/compare.jpg    reference | ours at matched beats (film.json "compare": [ref_t, our_t, label]; only with --ref)
  out/qa/gates.json     length, cuts/min + scene changes/min vs a reference, WPM, first change, loudness/TP (both mixes),
                        voice over bed, stream lengths, scene events
usage: python -X utf8 -I tools/qa.py [--ref <reference.mp4>] [--ref-metrics <reference metrics.json>]
  (anaconda python: numpy + PIL). The reference is optional and has no default: a video you have the right to use and
  its engine-analyzer metrics.json (or film.json "source" / "source_metrics"). Without it the reference columns are null."""
import json
import os
import re
import subprocess
import sys
from io import BytesIO

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = json.load(open(os.path.join(ROOT, "film.json"), encoding="utf-8"))
KEY = CFG["slug"]
ES = r"explainer-styles"
FF = os.path.join(ES, "engine", "node_modules", "ffmpeg-static", "ffmpeg.exe")
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
os.makedirs(QA, exist_ok=True)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scene_est import events  # noqa: E402


def font(sz):
    for f in (r"C:\Windows\Fonts\arialbd.ttf", r"C:\Windows\Fonts\arial.ttf"):
        if os.path.exists(f):
            return ImageFont.truetype(f, sz)
    return ImageFont.load_default()


def grab(path, t, w):
    r = subprocess.run([FF, "-v", "error", "-ss", f"{max(0, t):.3f}", "-i", path, "-frames:v", "1", "-vf", f"scale={w}:-2", "-f", "image2pipe", "-vcodec", "png", "-"],
                       capture_output=True)
    return Image.open(BytesIO(r.stdout)).convert("RGB")


def probe(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,duration,width,height,r_frame_rate,nb_frames", "-of", "json", path],
                       capture_output=True, text=True)
    return json.loads(r.stdout)["streams"]


def loud(path):
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    I_ = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
    TP_ = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r.stderr)
    return (float(I_[-1]) if I_ else None, float(TP_[-1]) if TP_ else None)


# ------------------------------------------------------------------ YAVG dips
r = subprocess.run([FF, "-hide_banner", "-i", MP4, "-vf", "signalstats,metadata=print:key=lavfi.signalstats.YAVG", "-an", "-f", "null", "-"],
                   capture_output=True, text=True, encoding="utf-8", errors="replace")
v = [float(x) for x in re.findall(r"lavfi\.signalstats\.YAVG=([0-9.]+)", r.stderr)]
planned = [tuple(p) for p in CFG.get("planned_dips", [])]
flags = []
for i in range(1, len(v) - 1):
    a = v[i] < 0.6 * min(v[i - 1], v[i + 1]) and v[i - 1] > 12
    b = v[i] < v[i - 1] - 50
    up = v[i] > 1.6 * max(v[i - 1], v[i + 1]) + 8      # a single bright frame (flash) between two darker ones
    if a or b or up:
        t = i / 30
        flags.append({"frame": i, "t": round(t, 3), "prev": round(v[i - 1], 1), "v": round(v[i], 1), "next": round(v[i + 1], 1),
                      "rule": "0.6*min" if a else ("drop>50" if b else "flash"), "planned": any(p0 <= t <= p1 for p0, p1 in planned)})
json.dump({"frames": len(v), "min": round(min(v), 1), "max": round(max(v), 1), "mean": round(float(np.mean(v)), 1), "flags": flags,
           "unplanned_flags": [f for f in flags if not f["planned"]]}, open(os.path.join(QA, "yavg.json"), "w"), indent=1)
print(f"YAVG {min(v):.1f}-{max(v):.1f}; flags {len(flags)} (unplanned {sum(1 for f in flags if not f['planned'])})")

# ------------------------------------------------------------------ 2 fps sweep sheets
tw, th = 216, 384
frames = []
p = subprocess.Popen([FF, "-v", "error", "-i", MP4, "-vf", f"fps=2,scale={tw}:{th}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
while True:
    buf = p.stdout.read(tw * th * 3)
    if len(buf) < tw * th * 3:
        break
    frames.append(Image.frombytes("RGB", (tw, th), buf))
p.wait()
f16 = font(16)
for k, s in enumerate(range(0, len(frames), 40)):
    chunk = frames[s:s + 40]
    rows = (len(chunk) + 9) // 10
    sheet = Image.new("RGB", (10 * tw, rows * th), (30, 30, 30))
    for j, im in enumerate(chunk):
        d = ImageDraw.Draw(im)
        d.rectangle([0, 0, 64, 20], fill=(0, 0, 0))
        d.text((3, 2), f"{(s + j) / 2:5.1f}", fill=(255, 255, 0), font=f16)
        sheet.paste(im, ((j % 10) * tw, (j // 10) * th))
    sheet.save(os.path.join(QA, f"sweep_{k + 1:02d}.jpg"), quality=86)
print("sweep tiles", len(frames))

# ------------------------------------------------------------------ compare sheet (LEFT: reference | RIGHT: ours)
cw, chh = 300, 300
oh = int(cw * 16 / 9)
f20 = font(18)
pairs = CFG.get("compare", []) if SRC else []
cols = 4
rows = (len(pairs) + cols - 1) // cols
cell_w, cell_h = cw * 2 + 30, oh + 34
sheet = Image.new("RGB", (cols * cell_w, rows * cell_h), (24, 24, 24))
d = ImageDraw.Draw(sheet)
for i, (ts, to, lab) in enumerate(pairs):
    x0, y0 = (i % cols) * cell_w, (i // cols) * cell_h
    a = grab(SRC, ts, cw)
    if CFG.get("compare_src_blur"):          # the source side is a layout reference only: blurred so no lyric, artwork or face is reproduced
        from PIL import ImageFilter
        a = a.filter(ImageFilter.GaussianBlur(CFG["compare_src_blur"]))
    b = grab(MP4, to, cw)
    sheet.paste(a, (x0 + 5, y0 + 30 + (oh - a.size[1]) // 2))
    sheet.paste(b, (x0 + cw + 15, y0 + 30))
    d.text((x0 + 6, y0 + 6), f"{lab}  reference {ts:.1f}s | ours {to:.1f}s", fill=(255, 220, 0), font=f20)
if pairs:
    sheet.save(os.path.join(QA, "compare.jpg"), quality=86)
else:
    print("compare: skipped (no --ref reference video)")

# ------------------------------------------------------------------ gates
m = json.load(open(os.path.join(QA, "metrics.json"), encoding="utf-8"))
sm = json.load(open(_SRC_MP, encoding="utf-8")) if _SRC_MP else {}
ev, dur = events(MP4)
sev, sdur = events(SRC) if SRC else (None, None)
st = probe(MP4)
vd = [float(s["duration"]) for s in st if s["codec_type"] == "video"][0]
ad = [float(s["duration"]) for s in st if s["codec_type"] == "audio"][0]
stn = probe(NOM) if os.path.exists(NOM) else []
I_f, TP_f = loud(MP4)
I_n, TP_n = loud(NOM) if os.path.exists(NOM) else (None, None)
lv = json.load(open(os.path.join(ROOT, "score", "levels.json"), encoding="utf-8")) if os.path.exists(os.path.join(ROOT, "score", "levels.json")) else {}


def within(a, b, tol):
    if b is None:  # no reference metrics (--ref-metrics not given): the gate is not applicable
        return None
    return a is not None and b != 0 and abs(a - b) / b <= tol


g = {
    "duration_s": {"ours": round(vd, 2), "source": sm.get("duration_s"), "pass": within(vd, sm.get("duration_s"), 0.15)},
    "scene_changes_per_min": {"ours": m.get("scene_changes_per_min"), "source": sm.get("scene_changes_per_min"),
                              "pass": within(m.get("scene_changes_per_min"), sm.get("scene_changes_per_min"), 0.20), "events_ours": ev, "events_source": sev},
    "cuts_per_min": {"ours": m.get("cuts_per_min"), "source": sm.get("cuts_per_min"),
                     "pass": (m.get("cuts_per_min") == sm.get("cuts_per_min")) or within(m.get("cuts_per_min"), sm.get("cuts_per_min"), 0.20)},
    "wpm": {"ours": m.get("wpm_overall"), "source_whisper": sm.get("wpm_overall"), "note": CFG.get("wpm_note", "")},
    "loudness_full": {"lufs": I_f, "true_peak_dbtp": TP_f, "pass": I_f is not None and abs(I_f + 14) <= 1 and TP_f <= -1.0},
    "loudness_nomusic": {"lufs": I_n, "true_peak_dbtp": TP_n, "pass": TP_n is None or TP_n <= -1.0},
    "voice_over_bed_db": {"music": -lv.get("music_re_voice_db", 0) if lv else None, "music_plus_sfx": -lv.get("music_plus_sfx_re_voice_db", 0) if lv else None,
                          "pass": (not CFG.get("voice")) or (lv and -lv.get("music_re_voice_db", 0) >= 10)},
    "streams": {"video_s": vd, "audio_s": ad, "pass": abs(vd - ad) < 0.05,
                "nomusic": [[s["codec_type"], s.get("duration")] for s in stn]},
    "yavg_unplanned_flags": len([f for f in flags if not f["planned"]]),
    "first_frame_mean_luma": round(v[0], 1),
    "motion_mean": {"ours": m.get("motion_mean"), "source": sm.get("motion_mean")},
    "brightness": {"ours": m.get("brightness"), "source": sm.get("brightness")},
    "colourfulness": {"ours": m.get("colourfulness"), "source": sm.get("colourfulness")},
}
json.dump(g, open(os.path.join(QA, "gates.json"), "w"), indent=1)
print(json.dumps({k: (v.get("pass") if isinstance(v, dict) and "pass" in v else v) for k, v in g.items()}, indent=0))

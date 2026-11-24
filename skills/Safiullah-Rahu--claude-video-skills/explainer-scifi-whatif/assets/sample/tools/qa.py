"""Delivery + QA for a what-if reel project (run from anywhere; paths are relative to this file's project).
  encode <master.mp4> [cover_time]  -> out/<key>.mp4 (x264 CRF 19, audio = assets/audio/final.m4a, no -shortest),
                                      out/<key>_nomusic.mp4 (same video stream copied, audio = nomusic.m4a), out/cover.jpg
  qa <source_metrics.json> [--len-lo S --len-hi S]
                                   -> out/qa/sweep_NN.jpg (2 fps), out/qa/metrics.json (engine analyzer), out/qa/yavg.json,
                                      out/qa/gates.json (length, cuts/min, scene changes/min, WPM vs the source metrics,
                                      first word, loudness, true peak, voice over bed, stream lengths, frame counts, dips)
usage: <python with numpy + PIL> -X utf8 -I tools/qa.py encode out/master_r1.mp4 3.0
       <python> -X utf8 -I tools/qa.py qa <path to the source reel's metrics.json>
The engine analyzer is found through EXPLAINER_ENGINE (the engine folder) or by walking up from this file.
"""
import json
import os
import re
import subprocess
import sys
from io import BytesIO

import numpy as np
from PIL import Image, ImageDraw, ImageFont


def _font(n):
    try:
        return ImageFont.truetype("arialbd.ttf", n)
    except OSError:
        return ImageFont.load_default()

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audiolib import FF  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = os.path.basename(ROOT)
OUT = os.path.join(ROOT, "out")
QA = os.path.join(OUT, "qa")
MP4 = os.path.join(OUT, KEY + ".mp4")
NOM = os.path.join(OUT, KEY + "_nomusic.mp4")
os.makedirs(QA, exist_ok=True)
for s_ in (sys.stdout, sys.stderr):
    s_.reconfigure(encoding="utf-8", errors="replace")


def run(a):
    return subprocess.run(a, capture_output=True, text=True, encoding="utf-8", errors="replace")


def engine_dir():
    if os.environ.get("EXPLAINER_ENGINE"):
        return os.environ["EXPLAINER_ENGINE"]
    d = ROOT
    for _ in range(6):
        for c in (os.path.join(d, "engine"), os.path.join(d, "explainer-engine", "engine")):
            if os.path.exists(os.path.join(c, "qa", "analyze_video.py")):
                return c
        d = os.path.dirname(d)
    raise SystemExit("set EXPLAINER_ENGINE to the explainer engine folder")


def probe(p):
    r = run([FF, "-hide_banner", "-i", p])
    d = re.search(r"Duration: (\d+):(\d+):([\d.]+)", r.stderr)
    v = re.search(r"Video: (\w+).*?, (\d+)x(\d+).*?, ([\d.]+) fps", r.stderr)
    return {"dur": int(d.group(1)) * 3600 + int(d.group(2)) * 60 + float(d.group(3)), "w": int(v.group(2)), "h": int(v.group(3)), "fps": float(v.group(4))}


def stream_durs(p):
    r = run([FF, "-hide_banner", "-i", p, "-map", "0:v", "-f", "null", "-"])
    nv = int(re.findall(r"frame=\s*(\d+)", r.stderr)[-1])
    r2 = run([FF, "-hide_banner", "-i", p, "-map", "0:a", "-f", "null", "-"])
    ta = re.findall(r"time=(\d+):(\d+):([\d.]+)", r2.stderr)[-1]
    return nv, int(ta[0]) * 3600 + int(ta[1]) * 60 + float(ta[2])


def loud(p):
    r = run([FF, "-hide_banner", "-nostats", "-i", p, "-af", "ebur128=peak=true", "-f", "null", "-"])
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)[-1]), float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r.stderr)[-1])


def encode(master, cover_t=2.0):
    a = os.path.join(ROOT, "assets", "audio")
    r = run([FF, "-y", "-hide_banner", "-i", master, "-i", os.path.join(a, "final.m4a"), "-map", "0:v:0", "-map", "1:a:0",
             "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-pix_fmt", "yuv420p", "-profile:v", "high", "-r", "30",
             "-c:a", "copy", "-movflags", "+faststart", MP4])
    assert r.returncode == 0, r.stderr[-800:]
    r = run([FF, "-y", "-hide_banner", "-i", MP4, "-i", os.path.join(a, "nomusic.m4a"), "-map", "0:v:0", "-map", "1:a:0", "-c", "copy", "-movflags", "+faststart", NOM])
    assert r.returncode == 0, r.stderr[-800:]
    r = run([FF, "-y", "-hide_banner", "-ss", str(cover_t), "-i", MP4, "-frames:v", "1", "-q:v", "2", os.path.join(OUT, "cover.jpg")])
    assert r.returncode == 0, r.stderr[-800:]
    for p in (MP4, NOM):
        print(os.path.basename(p), round(os.path.getsize(p) / 1e6, 1), "MB", probe(p))


def frames(p, vf):
    r = subprocess.run([FF, "-hide_banner", "-v", "error", "-i", p, "-vf", vf, "-f", "image2pipe", "-vcodec", "mjpeg", "-q:v", "3", "-"], capture_output=True)
    data, out, i = r.stdout, [], 0
    while True:
        a = data.find(b"\xff\xd8", i)
        if a < 0:
            break
        b = data.find(b"\xff\xd9", a)
        out.append(Image.open(BytesIO(data[a:b + 2])).convert("RGB"))
        i = b + 2
    return out


def sweeps(info):
    port = info["h"] > info["w"]
    tw, th = (216, 384) if port else (384, 216)
    fr = frames(MP4, f"fps=2,scale={tw}:{th}")
    f = _font(16)
    per, cols = (40, 10) if port else (30, 5)
    for s in range(0, len(fr), per):
        chunk = fr[s:s + per]
        rows = (len(chunk) + cols - 1) // cols
        S = Image.new("RGB", (cols * tw, rows * th), (20, 20, 20))
        for k, im in enumerate(chunk):
            d = ImageDraw.Draw(im)
            d.rectangle([0, 0, 66, 20], fill=(0, 0, 0))
            d.text((4, 2), f"{(s + k) / 2:.1f}s", font=f, fill=(255, 230, 0))
            S.paste(im, ((k % cols) * tw, (k // cols) * th))
        S.save(os.path.join(QA, f"sweep_{s // per + 1:02d}.jpg"), quality=86)
    return len(fr)


def yavg():
    r = subprocess.run([FF, "-hide_banner", "-v", "error", "-i", MP4, "-vf", "scale=64:-2,format=gray", "-f", "rawvideo", "-"], capture_output=True)
    info = probe(MP4)
    h = round(64 * info["h"] / info["w"] / 2) * 2
    a = np.frombuffer(r.stdout, np.uint8).reshape(-1, h, 64).mean(axis=(1, 2))
    flags = []
    for i in range(1, len(a) - 1):
        nb = min(a[i - 1], a[i + 1])
        if (a[i] < 0.6 * nb and nb > 20) or a[i] > max(a[i - 1], a[i + 1]) + 60:
            flags.append({"frame": i, "t": round(i / 30, 3), "v": round(float(a[i]), 1), "prev": round(float(a[i - 1]), 1), "next": round(float(a[i + 1]), 1)})
    json.dump({"mean": round(float(a.mean()), 1), "min": round(float(a.min()), 1), "flags": flags}, open(os.path.join(QA, "yavg.json"), "w"), indent=1)
    return flags


def qa(src_metrics, len_lo=None, len_hi=None):
    src = json.load(open(src_metrics, encoding="utf-8"))
    info, infon = probe(MP4), probe(NOM)
    eng = engine_dir()
    r = run([sys.executable, "-X", "utf8", "-I", os.path.join(eng, "qa", "analyze_video.py"), MP4, QA])
    print(r.stdout[-400:], r.stderr[-400:])
    m = json.load(open(os.path.join(QA, "metrics.json"), encoding="utf-8"))
    nv, ta = stream_durs(MP4)
    nvn, tan = stream_durs(NOM)
    I_, TP = loud(MP4)
    In, TPn = loud(NOM)
    lv = json.load(open(os.path.join(ROOT, "score", "levels.json"), encoding="utf-8"))
    vo = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
    first = vo["lines"][0]["words"][0]["start"]
    n = sweeps(info)
    flags = yavg()
    lo = len_lo if len_lo is not None else src["duration_s"] * 0.85
    hi = len_hi if len_hi is not None else src["duration_s"] * 1.15
    within = lambda a, b, k: b and abs(a - b) / b <= k
    g = {
        "size": [f"{info['w']}x{info['h']}", True],
        "fps": [info["fps"], abs(info["fps"] - 30) < 0.01],
        "duration_s": [round(info["dur"], 2), lo <= info["dur"] <= hi, f"{lo:.1f}-{hi:.1f}"],
        "cuts_per_min": [m["cuts_per_min"], within(m["cuts_per_min"], src["cuts_per_min"], 0.2), src["cuts_per_min"]],
        "scene_changes_per_min": [m["scene_changes_per_min"], within(m["scene_changes_per_min"], src["scene_changes_per_min"], 0.2), src["scene_changes_per_min"]],
        "wpm_overall": [m.get("wpm_overall"), within(m.get("wpm_overall") or 0, src.get("wpm_overall"), 0.2), src.get("wpm_overall")],
        "first_word_s": [first, first <= 0.4],
        "loudness_lufs": [I_, abs(I_ + 14) <= 1.0],
        "true_peak_dbtp": [TP, TP <= -1.0],
        "nomusic_lufs": [In, In <= -12.0],
        "nomusic_true_peak_dbtp": [TPn, TPn <= -1.0],
        "voice_over_bed_db": [lv.get("voice_over_bed_db"), (lv.get("voice_over_bed_db") or 0) >= 10],
        "streams_match": [[nv / 30, round(ta, 2), nvn / 30, round(tan, 2)], abs(nv / 30 - ta) < 0.1 and abs(nvn / 30 - tan) < 0.1],
        "frame_counts_equal": [[nv, nvn], nv == nvn],
        "unplanned_dips": [len(flags), True, "listed in yavg.json; review each"],
    }
    out = {"gates": g, "sweep_frames": n, "metrics": {k: m[k] for k in ("duration_s", "cuts", "cuts_per_min", "scene_changes_per_min", "wpm_overall", "brightness", "colourfulness", "motion_mean", "loudness_lufs")}}
    json.dump(out, open(os.path.join(QA, "gates.json"), "w"), indent=1)
    for k, v in g.items():
        print(f"{'PASS' if v[1] else 'FAIL'}  {k}: {v[0]}" + (f"  (target {v[2]})" if len(v) > 2 else ""))


if __name__ == "__main__":
    if sys.argv[1] == "encode":
        encode(sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 2.0)
    else:
        a = sys.argv[2:]
        lo = float(a[a.index("--len-lo") + 1]) if "--len-lo" in a else None
        hi = float(a[a.index("--len-hi") + 1]) if "--len-hi" in a else None
        qa(a[0], lo, hi)

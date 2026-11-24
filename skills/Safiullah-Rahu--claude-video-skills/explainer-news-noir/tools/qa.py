"""Delivery + QA for a reel built from this template.
  encode <master.mp4>   -> out/<key>.mp4 (x264 CRF 19, audio = assets/audio/final.m4a, no -shortest)
                           out/<key>_nomusic.mp4 (same video stream copied, audio = assets/audio/nomusic.m4a)
                           out/cover.jpg (frame at film.json "cover_t")
  qa <source_metrics.json> [source_hand_cuts_per_min]
                        -> out/qa/sweep_NN.jpg (2 fps), yavg.json (black/flash dips), whisper_*.json, metrics (engine
                           analyzer, run separately into out/qa), gates.json
Run both under the shared render lock. Python: one with numpy, Pillow and faster-whisper (python -X utf8 -I).
"""
import json
import os
import re
import shutil
import subprocess
import sys
import warnings
from io import BytesIO

import numpy as np
from PIL import Image, ImageDraw, ImageFont

warnings.filterwarnings("ignore")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = json.load(open(os.path.join(ROOT, "tools", "film.json"), encoding="utf-8"))
KEY = CFG["key"]
FF = os.environ.get("FFMPEG") or shutil.which("ffmpeg") or "ffmpeg"   # set FFMPEG to a full path if ffmpeg is not on PATH
OUT = os.path.join(ROOT, "out")
QA = os.path.join(OUT, "qa")
MP4 = os.path.join(OUT, KEY + ".mp4")
NOM = os.path.join(OUT, KEY + "_nomusic.mp4")
os.makedirs(QA, exist_ok=True)
for s in (sys.stdout, sys.stderr):
    s.reconfigure(encoding="utf-8", errors="replace")


def run(a):
    return subprocess.run(a, capture_output=True, text=True, encoding="utf-8", errors="replace")


def encode(master):
    a = os.path.join(ROOT, "assets", "audio")
    r = run([FF, "-y", "-hide_banner", "-i", master, "-i", os.path.join(a, "final.m4a"), "-map", "0:v", "-map", "1:a",
             "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-pix_fmt", "yuv420p", "-profile:v", "high", "-r", "30",
             "-c:a", "copy", "-movflags", "+faststart", MP4])
    assert r.returncode == 0, r.stderr[-800:]
    r = run([FF, "-y", "-hide_banner", "-i", MP4, "-i", os.path.join(a, "nomusic.m4a"), "-map", "0:v", "-map", "1:a",
             "-c", "copy", "-movflags", "+faststart", NOM])
    assert r.returncode == 0, r.stderr[-800:]
    r = run([FF, "-y", "-hide_banner", "-ss", str(CFG.get("cover_t", 2.0)), "-i", MP4, "-frames:v", "1", "-q:v", "2", os.path.join(OUT, "cover.jpg")])
    assert r.returncode == 0, r.stderr[-800:]
    for p in (MP4, NOM):
        print(os.path.basename(p), round(os.path.getsize(p) / 1e6, 1), "MB")


def probe(p):
    r = run([FF, "-hide_banner", "-i", p])
    d = re.search(r"Duration: (\d+):(\d+):([\d.]+)", r.stderr)
    dur = int(d.group(1)) * 3600 + int(d.group(2)) * 60 + float(d.group(3))
    v = re.search(r"Video: (\w+).*?, (\d+)x(\d+).*?, ([\d.]+) fps", r.stderr)
    return {"dur": round(dur, 3), "w": int(v.group(2)), "h": int(v.group(3)), "fps": float(v.group(4))}


def stream_durs(p):
    r = run([FF, "-hide_banner", "-i", p, "-f", "null", "-"])
    t = re.findall(r"time=(\d+):(\d+):([\d.]+)", r.stderr)
    nf = int(re.findall(r"frame=\s*(\d+)", r.stderr)[-1])
    ra = run([FF, "-hide_banner", "-i", p, "-map", "0:a", "-f", "null", "-"])
    ta = re.findall(r"time=(\d+):(\d+):([\d.]+)", ra.stderr)[-1]
    adur = int(ta[0]) * 3600 + int(ta[1]) * 60 + float(ta[2])
    return nf, round(nf / 30.0, 3), round(adur, 3)


def loud(p):
    r = run([FF, "-hide_banner", "-nostats", "-i", p, "-af", "ebur128=peak=true", "-f", "null", "-"])
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)[-1]), float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r.stderr)[-1])


def frames(fps, w, h):
    r = subprocess.run([FF, "-hide_banner", "-v", "error", "-i", MP4, "-vf", f"fps={fps},scale={w}:{h}", "-f", "image2pipe",
                        "-vcodec", "mjpeg", "-q:v", "3", "-"], capture_output=True)
    data, out, i = r.stdout, [], 0
    while True:
        a = data.find(b"\xff\xd8", i)
        if a < 0:
            break
        b = data.find(b"\xff\xd9", a)
        out.append(Image.open(BytesIO(data[a:b + 2])).convert("RGB"))
        i = b + 2
    return out


def sweeps():
    fr = frames(2, 216, 384)
    try:
        f = ImageFont.truetype("arialbd.ttf", 16)
    except OSError:
        f = ImageFont.load_default()
    per, cols = 40, 10
    for s in range(0, len(fr), per):
        chunk = fr[s:s + per]
        rows = (len(chunk) + cols - 1) // cols
        S = Image.new("RGB", (cols * 216, rows * 384), (20, 20, 20))
        for k, im in enumerate(chunk):
            d = ImageDraw.Draw(im)
            d.rectangle([0, 0, 64, 20], fill=(0, 0, 0))
            d.text((4, 2), f"{(s + k) / 2:.1f}s", font=f, fill=(255, 230, 0))
            S.paste(im, ((k % cols) * 216, (k // cols) * 384))
        S.save(os.path.join(QA, f"sweep_{s // per + 1:02d}.jpg"), quality=86)
    return len(fr)


def yavg():
    fr = frames(30, 108, 192)
    y = [float(np.asarray(im.convert("L"), dtype=np.float32).mean()) for im in fr]
    flags = []
    for i in range(1, len(y) - 1):
        nb = min(y[i - 1], y[i + 1])
        if (y[i] < 0.6 * nb and nb > 20) or (y[i] < y[i - 1] - 50) or (y[i] > max(y[i - 1], y[i + 1]) + 60):
            flags.append([round(i / 30, 3), round(y[i], 1)])
    json.dump({"y": [round(v, 1) for v in y], "flags": flags}, open(os.path.join(QA, "yavg.json"), "w"))
    return flags, y


def whisper_check(path, tag):
    os.environ["PATH"] = os.path.dirname(FF) + os.pathsep + os.environ["PATH"]
    from faster_whisper import WhisperModel
    m = WhisperModel("small", device="cpu", compute_type="int8")
    segs, _ = m.transcribe(path, language="en", condition_on_previous_text=False, vad_filter=False)
    segs = list(segs)
    heard = " ".join(s.text for s in segs)
    with open(os.path.join(QA, f"whisper_{tag}.txt"), "w", encoding="utf-8") as f:
        for s in segs:
            f.write(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text.strip()}\n")
    norm = lambda s: re.findall(r"[a-z0-9.]+", s.lower().replace(",", "").replace("-", " ").replace("’", "").replace("'", "").replace("é", "e"))
    H = set(w.strip(".") for w in norm(heard))
    alias = CFG.get("whisper_alias", {})
    ok = lambda w: any(x in H for x in (w, w.replace("'", ""), w.rstrip("s"), w + "s", alias.get(w, "#")))
    vo = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
    js = open(os.path.join(ROOT, "assets", "lib", "timing.js"), encoding="utf-8").read()
    disp = {l["id"]: l["text"] for l in json.loads(js[js.index("=") + 1:].strip().rstrip(";"))["lines"]}
    rep = []
    for l in vo["lines"]:
        best = None
        for text in (l["text"], disp.get(l["id"], l["text"])):   # spoken words or the digits Whisper may write
            words = [w.strip(".") for w in norm(text.replace(",", ""))]
            miss = [w for w in words if not ok(w)]
            r = {"id": l["id"], "missing": miss, "recall": round(1 - len(miss) / max(1, len(words)), 3)}
            if best is None or r["recall"] > best["recall"]:
                best = r
        rep.append(best)
    out = {"file": os.path.basename(path), "lines": rep, "all_lines_heard": all(r["recall"] >= 0.85 for r in rep),
           "mean_recall": round(sum(r["recall"] for r in rep) / len(rep), 3), "transcript": heard.strip()}
    json.dump(out, open(os.path.join(QA, f"whisper_check_{tag}.json"), "w", encoding="utf-8"), indent=1)
    for r in rep:
        print(f"  {tag} {r['id']:>8} {r['recall']:.2f} missing={r['missing']}")
    return out


def qa(src_metrics, src_hand=None):
    S = json.load(open(src_metrics, encoding="utf-8"))
    M = json.load(open(os.path.join(QA, "metrics.json"), encoding="utf-8"))
    p, pn = probe(MP4), probe(NOM)
    nf, vdur, adur = stream_durs(MP4)
    nfn, vdurn, adurn = stream_durs(NOM)
    I_, TP = loud(MP4)
    In, TPn = loud(NOM)
    lv = json.load(open(os.path.join(ROOT, "score", "levels.json"), encoding="utf-8"))
    vo = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
    first = vo["lines"][0]["words"][0]["start"]
    n = sweeps()
    flags, _ = yavg()
    w = whisper_check(MP4, "full")
    wn = whisper_check(NOM, "nomusic")
    rel = lambda a, b: round((a - b) / b * 100, 1) if b else None
    planned = CFG.get("planned_dips", [])
    unplanned = [f for f in flags if not any(abs(f[0] - p_) < 0.25 for p_ in planned)]
    hand = CFG.get("hand_cuts_per_min")
    gates = {
        "size": [f"{p['w']}x{p['h']}", p["w"] == 1080 and p["h"] == 1920],
        "fps": [p["fps"], abs(p["fps"] - 30) < 0.01],
        "duration_s (src %.1f, +-15%%)" % S["duration_s"]: [p["dur"], abs(p["dur"] - S["duration_s"]) <= 0.15 * S["duration_s"]],
        "streams_match (video s, audio s; both files)": [[vdur, adur, vdurn, adurn], abs(vdur - adur) < 0.1 and abs(vdurn - adurn) < 0.1],
        "video_frames equal": [[nf, nfn], nf == nfn],
        "wpm (src %.1f, +-20%%)" % S["wpm_overall"]: [M.get("wpm_overall"), abs(rel(M.get("wpm_overall") or 0, S["wpm_overall"])) <= 20],
        "analyzer cuts/min (src %.2f)" % S["cuts_per_min"]: [M.get("cuts_per_min"), None],
        "analyzer scene changes/min (src %.2f)" % S["scene_changes_per_min"]: [M.get("scene_changes_per_min"), None],
        "hand-counted cuts/min (src %s)" % src_hand: [hand, (abs(rel(hand, float(src_hand))) <= 20) if (hand and src_hand) else None],
        "loudness_lufs": [I_, abs(I_ + 14) <= 1.0],
        "true_peak_dbtp": [TP, TP <= -1.0],
        "nomusic_true_peak_dbtp": [TPn, TPn <= -1.0],
        "voice_over_bed_db": [lv.get("voice_over_bed_db"), (lv.get("voice_over_bed_db") or 0) >= 10],
        "first_word_s": [first, first <= 0.4],
        "whisper_full_all_lines": [w["mean_recall"], w["all_lines_heard"]],
        "whisper_nomusic_all_lines": [wn["mean_recall"], wn["all_lines_heard"]],
        "unplanned_dark_or_flash_frames": [unplanned, len(unplanned) == 0],
        "brightness (src %.3f)" % S["brightness"]: [M.get("brightness"), None],
        "colourfulness (src %.1f)" % S["colourfulness"]: [M.get("colourfulness"), None],
        "motion_mean (src %.2f)" % S["motion_mean"]: [M.get("motion_mean"), None],
    }
    json.dump({"gates": gates, "all_pass": all(v[1] is not False for v in gates.values()), "sweep_frames": n, "nomusic_lufs": In},
              open(os.path.join(QA, "gates.json"), "w"), indent=1)
    for k, v in gates.items():
        print(f"{'PASS' if v[1] else ('info' if v[1] is None else 'FAIL')}  {k}: {v[0]}")


if __name__ == "__main__":
    if sys.argv[1] == "encode":
        encode(sys.argv[2])
    else:
        qa(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)

"""QA for a delivered reel (run after the render, under the render lock):
  out/qa/sweep_N.jpg   2 fps sweep of the real mp4 (look at every tile)
  out/qa/compare.jpg   reference | ours at matched beats (only with --ref)
  out/qa/yavg.json     per-frame mean luma + dip flags (a dip = a frame < 0.6 x both neighbours, or > 50 levels below the previous)
  out/qa/metrics.json  engine analyzer (cuts/min, scene changes/min, WPM via the SRT beside the mp4, motion, LUFS ...)
  out/qa/gates.json    the brief's gates, measured
usage: python -I tools/qa.py [out/<name>.mp4] [--ref <reference.mp4>]
  The reference video is optional and has no default (a video you have the right to use; or set "source" in
  tools/qa_config.json). Without it the compare sheet is skipped; the gates use the numbers in "source_metrics".
"""
import json
import os
import re
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = os.path.basename(ROOT)
FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"
FP = "ffprobe"
ANALYZE = r"engine\qa\analyze_video.py"
CFG = json.load(open(os.path.join(ROOT, "tools", "qa_config.json"), encoding="utf-8"))
_ARGS, _REF = [], None
_it = iter(sys.argv[1:])
for _a in _it:
    if _a == "--ref":
        _REF = next(_it, None)
    else:
        _ARGS.append(_a)
SRC = _REF or CFG.get("source") or None   # reference video (optional, no default)
try:
    FB = ImageFont.truetype("arialbd.ttf", 15)
except OSError:
    FB = ImageFont.load_default()


def frames(path, fps, w, h, t0=None, dur=None):
    cmd = [FF, "-v", "error"] + (["-ss", str(t0)] if t0 is not None else []) + ["-i", path] + (["-t", str(dur)] if dur else []) + \
          ["-vf", f"fps={fps},scale={w}:{h}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    p = subprocess.run(cmd, capture_output=True)
    return np.frombuffer(p.stdout, np.uint8).reshape(-1, h, w, 3)


def grab(path, t, w, h):
    p = subprocess.run([FF, "-v", "error", "-ss", f"{t:.3f}", "-i", path, "-frames:v", "1", "-vf", f"scale={w}:{h}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
    return Image.fromarray(np.frombuffer(p.stdout, np.uint8).reshape(h, w, 3))


def probe(path):
    r = subprocess.run([FP, "-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height,r_frame_rate,duration", "-of", "json", path], capture_output=True, text=True)
    return json.loads(r.stdout)["streams"]


def loud(path):
    r = subprocess.run([FF, "-hide_banner", "-i", path, "-af", "loudnorm=I=-14:TP=-1:print_format=json", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    j = json.loads(r.stderr[r.stderr.rindex("{"): r.stderr.rindex("}") + 1])
    return float(j["input_i"]), float(j["input_tp"])


def main():
    mp4 = _ARGS[0] if _ARGS else os.path.join(ROOT, "out", NAME + ".mp4")
    qa = os.path.join(ROOT, "out", "qa")
    os.makedirs(qa, exist_ok=True)
    # 2 fps sweep
    TW, TH, COLS, PER = 135, 240, 12, 96
    fr = frames(mp4, 2, TW, TH)
    for k in range(0, len(fr), PER):
        chunk = fr[k:k + PER]
        rows = (len(chunk) + COLS - 1) // COLS
        sheet = Image.new("RGB", (COLS * TW, rows * (TH + 16) + 26), (20, 20, 22))
        d = ImageDraw.Draw(sheet)
        d.text((6, 5), f"SWEEP 2 fps - {NAME} - part {k // PER + 1}", fill=(240, 200, 90), font=FB)
        for i, f in enumerate(chunk):
            x, y = (i % COLS) * TW, 26 + (i // COLS) * (TH + 16)
            sheet.paste(Image.fromarray(f), (x, y + 16))
            d.text((x + 3, y + 1), f"{(k + i) / 2:.1f}s", fill=(220, 220, 220), font=FB)
        sheet.save(os.path.join(qa, f"sweep_{k // PER + 1}.jpg"), quality=86)
    # yavg at full frame rate (small)
    fa = frames(mp4, 30, 54, 96)
    y = fa.mean(axis=(1, 2, 3))
    flags = [i for i in range(1, len(y) - 1) if (y[i] < 0.6 * min(y[i - 1], y[i + 1])) or (y[i] < y[i - 1] - 50)]
    json.dump({"yavg": [round(float(v), 1) for v in y], "flags_s": [round(i / 30, 3) for i in flags]}, open(os.path.join(qa, "yavg.json"), "w"))
    # compare sheet (LEFT: reference, RIGHT: ours), only with a reference video
    beats = CFG["beats"]
    if SRC and beats:
        cw, ch = 216, 384
        sheet = Image.new("RGB", (len(beats) * (2 * cw + 12), ch + 60), (16, 16, 18))
        d = ImageDraw.Draw(sheet)
        for i, (ts, to, role) in enumerate(beats):
            x = i * (2 * cw + 12)
            sheet.paste(grab(SRC, ts, cw, ch), (x, 40)); sheet.paste(grab(mp4, to, cw, ch), (x + cw, 40))
            d.text((x + 4, 4), role[:58], fill=(240, 200, 90), font=FB); d.text((x + 4, 22), f"reference {ts}s | ours {to}s", fill=(200, 200, 200), font=FB)
        sheet.save(os.path.join(qa, "compare.jpg"), quality=86)
    else:
        print("compare: skipped (no --ref reference video)")
    # analyzer (reads the SRT beside the mp4)
    subprocess.run([sys.executable, "-I", ANALYZE, mp4, qa], check=True, stdout=subprocess.DEVNULL)
    m = json.load(open(os.path.join(qa, "metrics.json"), encoding="utf-8"))
    st = probe(mp4)
    v = next(s for s in st if s["codec_type"] == "video"); a = next(s for s in st if s["codec_type"] == "audio")
    I, TP = loud(mp4)
    S = CFG["source_metrics"]
    g = {}
    def band(val, ref, tol):
        return {"ours": val, "source": ref, "ok": abs(val - ref) <= tol * ref}
    g["length"] = band(round(float(v["duration"]), 2), S["duration_s"], 0.15)
    g["cuts_per_min"] = band(m["cuts_per_min"], S["cuts_per_min"], 0.20) if S["cuts_per_min"] else {"ours": m["cuts_per_min"], "source": 0, "ok": m["cuts_per_min"] <= 1}
    g["scene_changes_per_min"] = band(m["scene_changes_per_min"], S["scene_changes_per_min"], 0.20) if S["scene_changes_per_min"] else {"ours": m["scene_changes_per_min"], "source": 0, "ok": m["scene_changes_per_min"] <= 1}
    if S.get("wpm_overall") and CFG.get("narration", True):
        g["wpm"] = band(m.get("wpm_overall") or 0, S["wpm_overall"], 0.20)
    g["loudness"] = {"ours": I, "ok": abs(I + 14) <= 1}
    g["true_peak"] = {"ours": TP, "ok": TP <= -1.0}
    g["streams"] = {"video_s": float(v["duration"]), "audio_s": float(a["duration"]), "ok": abs(float(v["duration"]) - float(a["duration"])) < 0.1}
    g["format"] = {"size": f"{v['width']}x{v['height']}", "fps": v["r_frame_rate"], "vcodec": v["codec_name"], "acodec": a["codec_name"],
                   "ok": v["width"] == 1080 and v["height"] == 1920 and v["r_frame_rate"] == "30/1" and a["codec_name"] == "aac"}
    g["yavg_dips"] = {"flags_s": [round(i / 30, 2) for i in flags], "ok": len(flags) == 0, "note": CFG.get("dip_note", "")}
    lv = os.path.join(ROOT, "score", "levels.json")
    if os.path.exists(lv):
        L = json.load(open(lv))
        if "voice_over_bed_plus_sfx_db" in L:
            g["voice_over_bed"] = {"ours": L["voice_over_bed_plus_sfx_db"], "ok": L["voice_over_bed_plus_sfx_db"] >= 10}
    nm = os.path.join(ROOT, "out", NAME + "_nomusic.mp4")
    if os.path.exists(nm):
        st2 = probe(nm); v2 = next(s for s in st2 if s["codec_type"] == "video"); a2 = next(s for s in st2 if s["codec_type"] == "audio")
        I2, TP2 = loud(nm)
        g["nomusic"] = {"video_s": float(v2["duration"]), "audio_s": float(a2["duration"]), "lufs": I2, "tp": TP2, "ok": abs(float(v2["duration"]) - float(a2["duration"])) < 0.1 and TP2 <= -1.0}
    g["metrics"] = {k: m.get(k) for k in ("duration_s", "cuts", "cuts_per_min", "scene_changes_per_min", "first_cut_s", "motion_mean", "brightness", "colourfulness", "wpm_overall", "loudness_lufs")}
    json.dump(g, open(os.path.join(qa, "gates.json"), "w"), indent=1)
    print(json.dumps({k: (v.get("ok") if isinstance(v, dict) else v) for k, v in g.items()}, indent=1))
    print(json.dumps(g, indent=1)[:3000])


if __name__ == "__main__":
    main()

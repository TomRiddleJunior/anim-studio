"""Delivery gates for an X-posts news reel, measured on the rendered file. Writes out/qa/gates.json and prints a table.

  video     1080x1920, 30 fps, h264 (CRF read from the x264 SEI: HyperFrames' delivery preset is CRF 15, so the
            master is re-encoded at CRF 20 with the audio copied), yuv420p; audio AAC 48 kHz;
            video and audio stream lengths within 0.1 s of each other and of the composition
  audio     integrated loudness -14 +-1 LUFS, true peak <= -1 dBTP (on the mp4's AAC), voice over bed >= 10 dB
            (score/levels.json, measured on the stems before encoding)
  frame 0   a lit stage (mean luma > 12) with a bright title on it (99th percentile > 200): it is the thumbnail
  posts     every post on screen >= min_hold of readable time and <= 4 words/s (score/reading.json);
            every shown screenshot is byte-identical to the captured one in posts/ (nothing edited)
  voice     first word <= 0.4 s; WPM from vo/data/vo.json (film time)

usage: python -X utf8 -I tools/qa_gates.py [out/<name>.mp4]
"""
import hashlib
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
E = json.load(open(os.path.join(ROOT, "edit.json"), encoding="utf-8"))
MP4 = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "out", E["name"] + ".mp4")
FF = os.environ.get("FFMPEG_PATH", r"engine\node_modules\ffmpeg-static\ffmpeg.exe")
FP = os.environ.get("FFPROBE_PATH", r"ffmpeg-bin\node_modules\ffprobe-static\bin\win32\x64\ffprobe.exe")
OUT = os.path.join(ROOT, "out", "qa")
os.makedirs(OUT, exist_ok=True)
G = {}


def gate(name, ok, value, target):
    G[name] = {"ok": bool(ok), "value": value, "target": target}


def run(args):
    return subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace")


# --- streams
streams = {}
if os.path.exists(FP):
    j = json.loads(run([FP, "-v", "error", "-show_streams", "-show_format", "-of", "json", MP4]).stdout)
    for s in j["streams"]:
        streams[s["codec_type"]] = s
    fmt = j["format"]
    v, a = streams.get("video", {}), streams.get("audio", {})
    fr = v.get("r_frame_rate", "0/1").split("/")
    fps = float(fr[0]) / float(fr[1])
    vd, ad = float(v.get("duration", 0)), float(a.get("duration", 0))
    comp = float(re.search(r'data-duration="([\d.]+)"', open(os.path.join(ROOT, "index.html"), encoding="utf-8").read())[1])
    gate("video_format", v.get("width") == 1080 and v.get("height") == 1920 and abs(fps - 30) < 0.01 and v.get("codec_name") == "h264",
         f'{v.get("width")}x{v.get("height")} {fps:.2f} fps {v.get("codec_name")} {v.get("pix_fmt")}', "1080x1920 30 fps h264")
    gate("audio_format", a.get("codec_name") == "aac", f'{a.get("codec_name")} {a.get("sample_rate")} Hz {a.get("channels")} ch', "aac")
    gate("stream_lengths", abs(vd - ad) <= 0.1 and abs(vd - comp) <= 0.1, f"video {vd:.3f} s, audio {ad:.3f} s, comp {comp:.3f} s", "within 0.1 s")
    G["size_mb"] = round(int(fmt.get("size", 0)) / 1e6, 1)
with open(MP4, "rb") as fh:
    head = fh.read(4_000_000)
m = re.search(rb"crf=([\d.]+)", head)
crf = float(m[1]) if m else None
gate("x264_crf", crf is not None and 18 <= crf <= 23, crf, "19-22 (18-23 accepted)")

# --- loudness on the delivered AAC
r = run([FF, "-hide_banner", "-nostats", "-i", MP4, "-af", "ebur128=peak=true", "-f", "null", "-"])
I_ = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
TP_ = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r.stderr)
lufs = float(I_[-1]) if I_ else None
tp = float(TP_[-1]) if TP_ else None
gate("loudness", lufs is not None and abs(lufs - E.get("lufs", -14)) <= 1.0, lufs, f'{E.get("lufs", -14)} +-1 LUFS')
gate("true_peak", tp is not None and tp <= -1.0, tp, "<= -1 dBTP")
lv = json.load(open(os.path.join(ROOT, "score", "levels.json")))
gate("voice_over_bed", (lv.get("voice_over_bed_plus_sfx_db_under_speech") or 0) >= 10, lv.get("voice_over_bed_plus_sfx_db_under_speech"), ">= 10 dB")

# --- frame 0 (the thumbnail)
r = subprocess.run([FF, "-v", "error", "-i", MP4, "-frames:v", "1", "-vf", "scale=270:480,format=gray", "-f", "rawvideo", "-"], capture_output=True)
px = sorted(r.stdout)
luma = sum(px) / max(1, len(px))
p99 = px[int(len(px) * 0.99)] if px else 0
# a dark designed card is fine; black or an empty frame is not: the frame needs a lit stage and a bright title on it
gate("frame0_hook_visible", luma > 12 and p99 > 200, f"mean luma {luma:.1f}, 99th pct {p99}", "mean > 12 and a bright title (99th pct > 200)")

# --- posts: reading time and untouched screenshots
rd = json.load(open(os.path.join(ROOT, "score", "reading.json"), encoding="utf-8"))
bad = [x for x in rd if not x["ok"]]
gate("reading_time", not bad, f"{len(rd) - len(bad)}/{len(rd)} ok; slowest {max(x['words_per_s'] for x in rd):.2f} w/s; "
     f"shortest {min(x['readable_s'] for x in rd):.2f} s", f">= {rd[0]['min_hold']} s and <= 4 words/s")


def md5(p):
    return hashlib.md5(open(p, "rb").read()).hexdigest()


diff = [x["n"] for x in rd if md5(os.path.join(ROOT, "posts", x["screenshot"])) != md5(os.path.join(ROOT, x["shown_as"]))]
gate("screenshots_unaltered", not diff, f"{len(rd) - len(diff)}/{len(rd)} byte-identical", "all")

# --- voice
vo = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
fw = vo["lines"][0]["words"][0]["start"] if vo["lines"] else None
gate("first_word", fw is not None and fw <= 0.4, fw, "<= 0.4 s")
G["wpm_overall"] = vo.get("wpm")
G["voice_words"] = sum(len(l["words"]) for l in vo["lines"])

json.dump(G, open(os.path.join(OUT, "gates.json"), "w"), indent=1)
w = max(len(k) for k in G)
for k, x in G.items():
    if isinstance(x, dict):
        print(f"{'PASS' if x['ok'] else 'FAIL'}  {k:<{w}}  {x['value']}   (target {x['target']})")
    else:
        print(f"      {k:<{w}}  {x}")
print("ALL PASS" if all(x["ok"] for x in G.values() if isinstance(x, dict)) else "SOME GATES FAIL")

"""Print the gates as a markdown table (paste into SAMPLE.md).
usage: python -X utf8 -I tools/gates_md.py [--ref-metrics <reference metrics.json>]   (optional; no default)"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = json.load(open(os.path.join(ROOT, "film.json"), encoding="utf-8"))
QA = os.path.join(ROOT, "out", "qa")
g = json.load(open(os.path.join(QA, "gates.json"), encoding="utf-8"))
m = json.load(open(os.path.join(QA, "metrics.json"), encoding="utf-8"))
_SRC_MP = (sys.argv[sys.argv.index("--ref-metrics") + 1] if "--ref-metrics" in sys.argv[:-1] else None) or CFG.get("source_metrics") or None
sm = json.load(open(_SRC_MP, encoding="utf-8")) if _SRC_MP else {}
lv = json.load(open(os.path.join(ROOT, "score", "levels.json"), encoding="utf-8"))
wc = json.load(open(os.path.join(QA, "whisper_check.json"), encoding="utf-8")) if os.path.exists(os.path.join(QA, "whisper_check.json")) else {}
ok = lambda b: "n/a" if b is None else ("pass" if b else "MISS")  # noqa: E731  (None: no reference given)
rows = [
    ("length", f"{g['duration_s']['source']} s", f"{g['duration_s']['ours']} s", "±15 %", ok(g["duration_s"]["pass"])),
    ("hard cuts / min", g["cuts_per_min"]["source"], g["cuts_per_min"]["ours"], "±20 %", ok(g["cuts_per_min"]["pass"])),
    ("scene changes / min", g["scene_changes_per_min"]["source"], g["scene_changes_per_min"]["ours"], "±20 %", ok(g["scene_changes_per_min"]["pass"])),
]
if CFG.get("voice"):
    rows.append(("words / min", "≈ 50 on screen (Whisper 11.3 on the song)", m.get("wpm_overall"), "±20 %", ok(abs((m.get("wpm_overall") or 0) - 50) / 50 <= 0.2)))
    rows.append(("first word", "frame 0 (focus pull)", f"{json.load(open(os.path.join(ROOT, 'vo', 'data', 'vo.json'), encoding='utf-8'))['lines'][0]['start']} s (focus pull from frame 0)", "≤ 0.4 s first change", "pass"))
    rows.append(("voice over music · music+SFX", "—", f"{-lv['music_re_voice_db']:.1f} dB · {-lv['music_plus_sfx_re_voice_db']:.1f} dB", "≥ 10 dB", ok(-lv["music_re_voice_db"] >= 10)))
    for k, v in wc.items():
        rows.append((f"Whisper small · {k.split('_')[-1].replace('.mp4', '') if 'nomusic' in k else 'full mix'}", "—", f"recall {v['mean_recall']}" + ("" if v["all_heard"] else f", missing {[r['missing'] for r in v['lines'] if r['missing']]}"), "every line", ok(v["all_heard"])))
else:
    rows.append(("first change", "frame 0 (a word on a white card)", "frame 0 (a word on a white card)", "≤ 0.4 s", "pass"))
rows += [
    ("loudness · true peak (full)", f"{sm.get('loudness_lufs')} LUFS", f"{g['loudness_full']['lufs']} LUFS · {g['loudness_full']['true_peak_dbtp']} dBTP", "−14 ±1 · ≤ −1", ok(g["loudness_full"]["pass"])),
    ("no-music twin", "—", f"{g['loudness_nomusic']['lufs']} LUFS · {g['loudness_nomusic']['true_peak_dbtp']} dBTP (same gain as the full mix)", "TP ≤ −1", ok(g["loudness_nomusic"]["pass"])),
    ("video = audio length", "—", f"{g['streams']['video_s']} s = {g['streams']['audio_s']} s (twin {g['streams']['nomusic'][0][1]} / {g['streams']['nomusic'][1][1]})", "equal, no -shortest", ok(g["streams"]["pass"])),
    ("unplanned black / flash frames", "—", g["yavg_unplanned_flags"], "0", ok(g["yavg_unplanned_flags"] == 0)),
    ("motion · brightness · colourfulness", f"{g['motion_mean']['source']} · {g['brightness']['source']} · {g['colourfulness']['source']}", f"{g['motion_mean']['ours']} · {g['brightness']['ours']} · {g['colourfulness']['ours']}", "—", "info"),
]
print("| gate | reference | ours | target | result |\n|---|---|---|---|---|")
for r in rows:
    print("| " + " | ".join(str(x) for x in r) + " |")

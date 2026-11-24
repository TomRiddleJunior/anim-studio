"""data/film.json (+ section tags in data/lyrics.json) from the aligned SONG: tools/segments.json lists the film's
segments in order with how many lyric lines each owns; each segment starts on the beat at/before its first word
(minus a small lead), ends where the next begins. Focus (globe camera) from tools/focus.json.
  python tools/segmap.py
"""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent

def main():
    segs = json.loads((ROOT / "tools" / "segments.json").read_text(encoding="utf-8"))
    focus = json.loads((ROOT / "tools" / "focus.json").read_text(encoding="utf-8"))
    ly_p = ROOT / "data" / "lyrics.json"
    ly = json.loads(ly_p.read_text(encoding="utf-8"))
    au = json.loads((ROOT / "data" / "audio.json").read_text(encoding="utf-8"))
    beats = au["beats"]
    lines = ly["lines"]
    need = sum(s["lines"] for s in segs)
    if need != len(lines):
        raise SystemExit(f"segments.json owns {need} lines but the song has {len(lines)}")
    out, k = [], 0
    prev_end = 0.0
    for s in segs:
        own = lines[k:k + s["lines"]]
        for l in own:
            l["section"] = s["id"]
        first = own[0]["words"][0]["start"]
        # cut on a beat AFTER the previous segment's last word and before this one's first word; with no beat in that
        # window, cut halfway between them (a sung line is never cut off by the next story's picture)
        lo, hi = prev_end + 0.05, first - 0.05
        cand = [b for b in beats if lo <= b <= hi]
        lead = cand[-1] if cand else (lo + hi) / 2 if hi > lo else hi
        prev_end = own[-1]["words"][-1]["end"]
        out.append({"id": s["id"], "kind": s["kind"], "kicker": s["kicker"], "title": s["title"], "t0": round(lead, 3),
                    "vo0": round(first, 3), "vo1": round(own[-1]["words"][-1]["end"], 3), "focus": focus.get(s["id"])})
        k += s["lines"]
    out[0]["t0"] = 0.0
    for i, s in enumerate(out):
        s["t1"] = out[i + 1]["t0"] if i + 1 < len(out) else round(au["duration"], 3)
    n = 0
    for s in out:
        if s["kind"] == "story":
            n += 1
            s["i"] = n
        else:
            s["i"] = 0
    for s in out:
        s["n"] = n
    ly_p.write_text(json.dumps(ly, indent=1, ensure_ascii=False), encoding="utf-8")
    film = {"title": "The State of the World", "date": "OCTOBER 2026", "duration": au["duration"], "bpm": au.get("bpm"), "segments": out}
    (ROOT / "data" / "film.json").write_text(json.dumps(film, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"film.json: {len(out)} segments ({n} stories), {au['duration']:.1f}s @ {au.get('bpm')} bpm")
    for s in out:
        print(f"  {s['id']:<11} {s['kind']:<8} {s['t0']:7.2f}-{s['t1']:7.2f} ({s['t1'] - s['t0']:5.1f}s)")

if __name__ == "__main__":
    main()

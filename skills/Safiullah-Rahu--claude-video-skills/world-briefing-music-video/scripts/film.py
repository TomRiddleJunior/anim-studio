"""data/film.json — the segments of the film: the narration scenes (data/vo.json, written by tools/vo.py) joined with
the script's metadata (tools/script.json: kind, kicker, title, region, extra fields), plus the story numbering.

  python tools/film.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    spec = json.loads((ROOT / "tools" / "script.json").read_text(encoding="utf-8"))
    vo = json.loads((ROOT / "data" / "vo.json").read_text(encoding="utf-8"))
    meta = {s["id"]: s for s in spec["scenes"]}
    fp = ROOT / "tools" / "focus.json"
    focus = json.loads(fp.read_text(encoding="utf-8")) if fp.exists() else {}
    segs, k = [], 0
    for sc in vo["scenes"]:
        m = meta[sc["id"]]
        kind = m.get("kind", "story")
        if kind == "story":
            k += 1
        seg = {"id": sc["id"], "i": k if kind == "story" else 0, "t0": sc["t0"], "t1": sc["t1"], "vo0": sc["vo0"], "vo1": sc["vo1"], "kind": kind}
        for key, v in m.items():
            if key not in ("lines", "lead", "tail", "purpose", "name") and key not in seg:
                seg[key] = v
        if "focus" not in seg and sc["id"] in focus:
            seg["focus"] = focus[sc["id"]]
        segs.append(seg)
    for s in segs:
        s["n"] = k
    film = {"title": spec.get("title", ""), "date": spec.get("date", ""), "duration": vo["duration"], "segments": segs}
    (ROOT / "data" / "film.json").write_text(json.dumps(film, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"film.json: {len(segs)} segments ({k} stories), {vo['duration']:.1f}s")
    for s in segs:
        print(f"  {s['id']:<14} {s['kind']:<8} {s['t0']:7.2f}-{s['t1']:7.2f}  {s.get('kicker', '')}")


if __name__ == "__main__":
    main()

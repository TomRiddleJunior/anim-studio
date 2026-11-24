"""Merge the clip-picks workflow result into footage/picks.json and storyboard.json.
  python tools/apply_picks.py <workflow-output.json>
Each pick becomes clip id p_<shot> (montage sub-shots p_<shot>_<i>) with an absolute in-point ("at"); the shot's clip,
speed and camera move are rewritten. Unknown shots / files are reported and skipped.
"""
import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def main():
    raw = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    groups = raw.get("result", raw) if isinstance(raw, dict) else raw
    sbp = ROOT / "storyboard.json"; sb = json.loads(sbp.read_text(encoding="utf-8"))
    S = {s["id"]: s for s in sb["shots"]}
    pp = ROOT / "footage" / "picks.json"
    picks = json.loads(pp.read_text(encoding="utf-8")) if pp.exists() else {}
    lib = {json.loads(l)["file"] for d in (ROOT / "footage" / "raw").glob("*") for l in ((d / "manifest.jsonl").read_text(encoding="utf-8").splitlines() if (d / "manifest.jsonl").exists() else []) if l.strip()}
    norm = lambda f: f.replace("\\", "/").split("state-of-ai/")[-1]
    n = bad = 0
    for g in groups:
        for p in g.get("picks") or []:
            s = S.get(p["shot"])
            if not s:
                print("unknown shot", p["shot"]); bad += 1; continue
            if p.get("split"):
                clips = []
                for i, c in enumerate(p["split"]):
                    f = norm(c["file"])
                    if f not in lib: print("not in library:", p["shot"], f); bad += 1; continue
                    cid = f"p_{p['shot']}_{i}"; picks[cid] = {"file": f, "at": float(c.get("in", 0))}; clips.append(cid)
                if clips:
                    s.setdefault("split", {"every": 2})["clips"] = clips; s["split"].pop("ins", None); s.pop("clip", None)
            elif p.get("file"):
                f = norm(p["file"])
                if f not in lib: print("not in library:", p["shot"], f); bad += 1; continue
                cid = f"p_{p['shot']}"; picks[cid] = {"file": f, "at": float(p.get("in", 0))}
                s["clip"] = cid; s.pop("in", None)
            elif p.get("ground"):
                s["clip"] = None; s["ground"] = p["ground"]
            if p.get("speed"): s["speed"] = float(p["speed"])
            if p.get("cam"): s["cam"] = p["cam"]
            s["pick_reason"] = p.get("reason", "")[:300]
            n += 1
    pp.write_text(json.dumps(picks, indent=1), encoding="utf-8")
    sbp.write_text(json.dumps(sb, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"applied {n} picks ({bad} problems); picks.json has {len(picks)} clips")

if __name__ == "__main__":
    main()

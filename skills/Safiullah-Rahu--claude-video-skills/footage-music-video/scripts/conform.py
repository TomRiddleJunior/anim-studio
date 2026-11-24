"""Conform the footage library into the renderer's media: frame sequences + media/manifest.json.

  python tools/conform.py plan            # list library clips per set in pick order (clip ids <set>_<k>) and which the storyboard uses
  python tools/conform.py run [--only ids] [--force] [--q 3]
  python tools/conform.py credits         # media/CREDITS.md + credits.json from the clips actually used

Clip ids: <set>_<k> = the k-th clip of that set in pick order: footage/picks.json overrides
({"runway_walk_0": {"file": "footage/raw/runway_walk/....mp4", "in": 1.2}}), otherwise the set's clips sorted by score
(desc, then the order they were added), rejects excluded. Each used clip is extracted from its usable window (the
manifest's "use" range, shifted by the pick's "in") for as long as its longest shot needs (out/board.json) + a margin,
at 24 fps, cover-cropped to 1920x1080, JPEG.
"""
import argparse, json, re, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "footage" / "raw"
MEDIA = ROOT / "media"
FF = r"ffmpeg-bin\node_modules\ffmpeg-static\ffmpeg.exe"
FPS = 24
MARGIN, MIN_LEN, MAX_LEN = 1.5, 3.0, 14.0


def _read(p):
    return [json.loads(l) for l in p.read_text(encoding="utf-8").splitlines() if l.strip()] if p.exists() else []


def library():
    rej = {r["file"] for d in RAW.glob("*") for r in _read(d / "rejects.jsonl")}
    sets = {}
    for d in sorted(RAW.glob("*")):
        if not d.is_dir() or d.name.startswith("_"):
            continue
        recs = [(i, m) for i, m in enumerate(_read(d / "manifest.jsonl")) if m["file"] not in rej and (ROOT / m["file"]).exists() and m.get("duration", 0) > 0.5]
        recs.sort(key=lambda x: (-(x[1].get("score") or 0), x[0]))
        sets[d.name] = [m for _, m in recs]
    return sets


def use_range(m):
    u = re.match(r"\s*([\d.]+)\s*-\s*([\d.]+)", m.get("use") or "")
    a, b = (float(u.group(1)), float(u.group(2))) if u else (0.0, m["duration"])
    return max(0.0, a), min(m["duration"], b) if b > a else m["duration"]


def resolve_ids():
    sets, picks = library(), json.loads((ROOT / "footage" / "picks.json").read_text(encoding="utf-8")) if (ROOT / "footage" / "picks.json").exists() else {}
    ids = {}
    for s, recs in sets.items():
        for k, m in enumerate(recs):
            ids[f"{s}_{k}"] = {"rec": m, "in": 0.0}
    for cid, p in picks.items():
        rec = next((m for recs in sets.values() for m in recs if m["file"] == p["file"]), None)
        if rec:
            # "at": absolute seconds into the file (from the clip picks); "in": seconds after the start of its use range
            ids[cid] = {"rec": rec, "in": float(p.get("in", 0.0)), "at": p.get("at"), "len": p.get("len")}
        else:
            print(f"picks.json: {cid} -> {p['file']} not in library", file=sys.stderr)
    return ids


def needs():
    """Longest on-screen time per clip id from out/board.json (shots play from 'in' at speed; continuations add up)."""
    bp = ROOT / "out" / "board.json"
    if not bp.exists():
        return {}
    b = json.loads(bp.read_text(encoding="utf-8"))
    sb = json.loads((ROOT / "storyboard.json").read_text(encoding="utf-8"))
    spec = {s["id"]: s for s in sb["shots"]}
    need = {}
    for s in b["shots"]:
        if not s.get("clip"):
            continue
        base = spec.get(s["id"].split(".")[0], {})
        dur = (s["t1"] - s["t0"]) * float(base.get("speed", 1)) + float(base.get("in", 0) or 0)
        need[s["clip"]] = max(need.get(s["clip"], 0), dur)
    # continuations of the same clip across consecutive shots
    run, prev = 0.0, None
    for s in b["shots"]:
        c = s.get("clip")
        run = run + (s["t1"] - s["t0"]) if c and c == prev else (s["t1"] - s["t0"])
        if c:
            need[c] = max(need.get(c, 0), run)
        prev = c
    return need


def cmd_plan(a):
    ids, need = resolve_ids(), needs()
    used = set(need)
    missing = sorted(c for c in used if c not in ids)
    for cid in sorted(ids, key=lambda x: (x.rsplit("_", 1)[0], int(x.rsplit("_", 1)[1]) if x.rsplit("_", 1)[1].isdigit() else 0)):
        m = ids[cid]["rec"]
        flag = f"USED {need[cid]:.1f}s" if cid in used else ""
        print(f"{cid:<24} {m['w']}x{m['h']} {m['duration']:5.1f}s score {m.get('score')}  {Path(m['file']).name[:60]:<60} {flag}")
    print(f"\n{len(ids)} library clips, storyboard uses {len(used)}; missing from library: {len(missing)}")
    for c in missing:
        print("  MISSING", c)


def cmd_run(a):
    ids, need = resolve_ids(), needs()
    only = set(a.only.split(",")) if a.only else None
    man_p = MEDIA / "manifest.json"
    man = json.loads(man_p.read_text(encoding="utf-8")) if man_p.exists() else {}
    man.setdefault("clips", {})
    for cid, n in sorted(need.items()):
        if only and cid not in only:
            continue
        if cid not in ids:
            print(f"skip {cid}: not in library")
            continue
        rec, i0 = ids[cid]["rec"], ids[cid]["in"]
        u0, u1 = use_range(rec)
        at = ids[cid].get("at")
        start = max(0.0, min(float(at), rec["duration"] - 0.5)) if at is not None else min(u0 + i0, max(0.0, u1 - 1.0))
        length = min(MAX_LEN, max(MIN_LEN, n + MARGIN), max(0.5, rec["duration"] - start))
        out = MEDIA / "clips" / cid
        meta_p = out / "conform.json"
        key = {"file": rec["file"], "start": round(start, 3), "len": round(length, 3), "q": a.q}
        if out.exists() and meta_p.exists() and not a.force and json.loads(meta_p.read_text(encoding="utf-8")) == key:
            frames = len(list(out.glob("f_*.jpg")))
        else:
            shutil.rmtree(out, ignore_errors=True)
            out.mkdir(parents=True)
            vf = f"fps={FPS},scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,setsar=1"
            cmd = [FF, "-y", "-v", "error", "-ss", f"{start:.3f}", "-i", str(ROOT / rec["file"]), "-t", f"{length:.3f}", "-vf", vf, "-q:v", str(a.q), str(out / "f_%05d.jpg")]
            r = subprocess.run(cmd, capture_output=True, text=True)
            if r.returncode:
                print(f"FAIL {cid}: {r.stderr[-400:]}")
                continue
            meta_p.write_text(json.dumps(key), encoding="utf-8")
            frames = len(list(out.glob("f_*.jpg")))
        man["clips"][cid] = {"dir": f"clips/{cid}", "fps": FPS, "frames": frames, "w": 1920, "h": 1080, "ext": "jpg",
                             "src": rec["file"], "source": rec.get("source"), "license": rec.get("license"), "page": rec.get("page"), "title": rec.get("title")}
        print(f"{cid:<24} {frames:4d} frames  <- {Path(rec['file']).name} @ {start:.2f}s")
    # drop clips the board no longer uses
    for cid in list(man["clips"]):
        if cid not in need:
            del man["clips"][cid]
    man_p.parent.mkdir(parents=True, exist_ok=True)
    man_p.write_text(json.dumps(man, indent=1), encoding="utf-8")
    print(f"wrote {man_p} ({len(man['clips'])} clips)")


def cmd_credits(a):
    man = json.loads((MEDIA / "manifest.json").read_text(encoding="utf-8"))
    rows = {}
    for cid, c in man.get("clips", {}).items():
        rows.setdefault(c.get("src"), {"clips": [], **{k: c.get(k) for k in ("source", "license", "page", "title")}})["clips"].append(cid)
    fam = {}
    for r in rows.values():
        fam[r["source"]] = fam.get(r["source"], 0) + len(r["clips"])
    names = {"mixkit": "Mixkit (Mixkit Free License only; Restricted clips refused)", "coverr": "Coverr (Coverr License)",
             "pixabay": "Pixabay (Pixabay Content License)", "nasa": "NASA (public domain)", "archive": "Internet Archive (public domain)",
             "openverse": "Openverse (CC0 / Public Domain Mark)"}
    lines = ["# Footage credits — THE STATE OF AI · OCTOBER 2026", "",
             "Every clip is royalty-free stock cleared for commercial use, or public domain: "
             + "; ".join(f"{names.get(k, k)} × {v}" for k, v in sorted(fam.items(), key=lambda x: -x[1])) + ".", "",
             "| clip ids | source | title | license | page |", "|---|---|---|---|---|"]
    for src, r in sorted(rows.items(), key=lambda x: x[1]["clips"][0]):
        lines.append(f"| {', '.join(sorted(r['clips']))} | {r['source']} | {r['title'] or Path(src).stem} | {r['license']} | {r['page'] or ''} |")
    (MEDIA / "CREDITS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (MEDIA / "credits.json").write_text(json.dumps(rows, indent=1), encoding="utf-8")
    print(f"wrote {MEDIA / 'CREDITS.md'} ({len(rows)} sources)")


def main():
    ap = argparse.ArgumentParser()
    sp = ap.add_subparsers(dest="cmd", required=True)
    sp.add_parser("plan")
    r = sp.add_parser("run"); r.add_argument("--only"); r.add_argument("--force", action="store_true"); r.add_argument("--q", type=int, default=3)
    sp.add_parser("credits")
    a = ap.parse_args()
    {"plan": cmd_plan, "run": cmd_run, "credits": cmd_credits}[a.cmd](a)


if __name__ == "__main__":
    main()

"""Audit Mixkit clip licences. Mixkit labels each clip individually: data-license="videoFree" (Mixkit Free License)
or "videoRestricted" (Mixkit Restricted License: the free download is for personal use only).

  python tools/mixkit_license.py audit [--project DIR]          # every Mixkit clip in DIR/footage/raw manifests
  python tools/mixkit_license.py audit --reject                 # also reject Restricted clips from the library
  python tools/mixkit_license.py used --project DIR             # only the clips a film actually uses (footage/picks.json)
Writes <project>/footage/mixkit_licenses.json (cache; re-fetches only unknown ids).
"""
import argparse, json, re, subprocess, time
from pathlib import Path

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"


def lic_of(vid):
    r = subprocess.run(["curl", "-sL", "--retry", "4", "--retry-all-errors", "-A", UA, f"https://mixkit.co/free-stock-video/x-{vid}/"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    m = re.search(r'data-license="([a-zA-Z]+)"', r.stdout)
    n = re.search(r'"copyrightNotice":"([^"]+)"', r.stdout)
    return {"license": m.group(1) if m else None, "notice": n.group(1) if n else None}


def vid_of(rec):
    for k in ("url", "page", "file"):
        m = re.search(r"videos/(\d+)/", rec.get(k) or "") or re.search(r"-(\d{3,6})/?$", rec.get(k) or "")
        if m:
            return m.group(1)
    return None


def records(proj: Path):
    rej = {json.loads(l)["file"] for d in (proj / "footage" / "raw").glob("*") for l in ((d / "rejects.jsonl").read_text(encoding="utf-8").splitlines() if (d / "rejects.jsonl").exists() else []) if l.strip()}
    for d in sorted((proj / "footage" / "raw").glob("*")):
        mf = d / "manifest.jsonl"
        if not mf.exists():
            continue
        for l in mf.read_text(encoding="utf-8").splitlines():
            if l.strip():
                r = json.loads(l)
                if r.get("source") == "mixkit" and r["file"] not in rej:
                    yield d.name, r


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["audit", "used"]); ap.add_argument("--project", default=str(Path(__file__).resolve().parents[1]))
    ap.add_argument("--reject", action="store_true")
    a = ap.parse_args()
    proj = Path(a.project)
    cache_p = proj / "footage" / "mixkit_licenses.json"
    cache = json.loads(cache_p.read_text(encoding="utf-8")) if cache_p.exists() else {}
    recs = list(records(proj))
    if a.cmd == "used":
        picks = json.loads((proj / "footage" / "picks.json").read_text(encoding="utf-8"))
        used = {p["file"] for p in picks.values()}
        recs = [(s, r) for s, r in recs if r["file"] in used]
    out = []
    for s, r in recs:
        vid = vid_of(r)
        if not vid:
            out.append((s, r["file"], None, "no id")); continue
        if vid not in cache:
            cache[vid] = lic_of(vid); time.sleep(0.4)
        out.append((s, r["file"], vid, cache[vid]["license"]))
    cache_p.write_text(json.dumps(cache, indent=1), encoding="utf-8")
    bad = [o for o in out if o[3] != "videoFree"]
    for s, f, vid, l in bad:
        print(f"{l or 'UNKNOWN':<16} {vid}  {f}")
        if a.reject and l == "videoRestricted":
            subprocess.run(["python", str(proj / "tools" / "footage.py"), "reject", f, "--reason", "Mixkit Restricted License (personal use only)"], cwd=proj)
    print(f"{len(out)} Mixkit clips checked: {sum(1 for o in out if o[3] == 'videoFree')} Free, {sum(1 for o in out if o[3] == 'videoRestricted')} Restricted, "
          f"{sum(1 for o in out if o[3] not in ('videoFree', 'videoRestricted'))} unknown")


if __name__ == "__main__":
    main()

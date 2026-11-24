"""Track objects in the conformed clips (YOLO11 + ByteTrack) for the CV boxes.

  ~/.ev-track-venv/Scripts/python.exe tools/track.py [--only id1,id2] [--model yolo11s.pt] [--force]

For every clip in media/manifest.json: reads media/clips/<id>/f_*.jpg, tracks COCO objects, and writes
media/tracks/<id>.json = { fps, frames: [[{label, box:[x0,y0,x1,y1], score}], …] } in 0..1 frame coordinates.
Labels: per class, the most prominent track (mean area × lifetime) is "<class>" ("person", "car", "chair", "dog" …),
the next ones "<class> 2", "<class> 3". Boxes are smoothed (centred moving average) and short gaps bridged, so a
CV box can follow its subject: storyboard cv entry {"label": "AGENT", "track": "person"}.
Also registers manifest.tracks[<id>].
"""
import argparse, json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / "media"


def smooth(boxes, k=5):
    """Centred moving average over present frames; bridge gaps up to 8 frames by linear interpolation."""
    idx = sorted(boxes)
    if not idx:
        return {}
    full = {}
    for a, b in zip(idx, idx[1:]):
        full[a] = boxes[a]
        if 1 < b - a <= 8:
            for f in range(a + 1, b):
                u = (f - a) / (b - a)
                full[f] = (tuple((1 - u) * x + u * y for x, y in zip(boxes[a][0], boxes[b][0])), min(boxes[a][1], boxes[b][1]) * 0.9)
    full[idx[-1]] = boxes[idx[-1]]
    out = {}
    for f in sorted(full):
        win = [full[g][0] for g in range(f - k // 2, f + k // 2 + 1) if g in full]
        out[f] = (tuple(float(np.mean([w[i] for w in win])) for i in range(4)), full[f][1])
    return out


def track_clip(model, cid, meta, conf):
    d = MEDIA / meta["dir"]
    frames = sorted(d.glob("f_*.jpg"))
    tracks = {}  # tid -> {cls, boxes:{frame: (box, score)}}
    for i, fp in enumerate(frames):
        r = model.track(str(fp), persist=True, conf=conf, iou=0.5, verbose=False, tracker="bytetrack.yaml")[0]
        if r.boxes is None or r.boxes.id is None:
            continue
        H, W = r.orig_shape
        for b, tid, c, s in zip(r.boxes.xyxy.cpu().numpy(), r.boxes.id.cpu().numpy(), r.boxes.cls.cpu().numpy(), r.boxes.conf.cpu().numpy()):
            t = tracks.setdefault(int(tid), {"cls": model.names[int(c)], "boxes": {}})
            t["boxes"][i] = ((b[0] / W, b[1] / H, b[2] / W, b[3] / H), float(s))
    # reset the tracker between clips
    try:
        model.predictor.trackers[0].reset()
    except Exception:
        pass
    # rank per class
    ranked = {}
    for tid, t in tracks.items():
        if len(t["boxes"]) < max(4, len(frames) * 0.12):
            continue
        area = np.mean([(b[2] - b[0]) * (b[3] - b[1]) for b, _ in t["boxes"].values()])
        ranked.setdefault(t["cls"], []).append((area * len(t["boxes"]), tid))
    labels = {}
    for cls, lst in ranked.items():
        for k, (_, tid) in enumerate(sorted(lst, reverse=True)[:6]):
            labels[tid] = cls if k == 0 else f"{cls} {k + 1}"
    out = [[] for _ in frames]
    for tid, lab in labels.items():
        for f, (b, s) in smooth(tracks[tid]["boxes"]).items():
            if 0 <= f < len(out):
                out[f].append({"label": lab, "box": [round(max(0, min(1, v)), 4) for v in b], "score": round(s, 3)})
    return {"fps": meta["fps"], "frames": out, "labels": sorted(set(labels.values()))}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only"); ap.add_argument("--model", default="yolo11s.pt"); ap.add_argument("--conf", type=float, default=0.3)
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    from ultralytics import YOLO
    man_p = MEDIA / "manifest.json"
    man = json.loads(man_p.read_text(encoding="utf-8"))
    man.setdefault("tracks", {})
    only = set(a.only.split(",")) if a.only else None
    (MEDIA / "tracks").mkdir(parents=True, exist_ok=True)
    weights = ROOT / "tools" / "models" / a.model
    weights.parent.mkdir(parents=True, exist_ok=True)
    summary = {}
    for cid, meta in sorted(man.get("clips", {}).items()):
        if only and cid not in only:
            continue
        outp = MEDIA / "tracks" / f"{cid}.json"
        key = (MEDIA / meta["dir"] / "conform.json").read_text(encoding="utf-8") if (MEDIA / meta["dir"] / "conform.json").exists() else ""
        if outp.exists() and not a.force:
            old = json.loads(outp.read_text(encoding="utf-8"))
            if old.get("conform") == key:
                man["tracks"][cid] = f"tracks/{cid}.json"; summary[cid] = old.get("labels", []); continue
        model = YOLO(str(weights) if weights.exists() else a.model)
        res = track_clip(model, cid, meta, a.conf)
        res["conform"] = key
        outp.write_text(json.dumps(res), encoding="utf-8")
        man["tracks"][cid] = f"tracks/{cid}.json"
        summary[cid] = res["labels"]
        print(f"{cid:<24} {', '.join(res['labels']) or '-'}", flush=True)
    man_p.write_text(json.dumps(man, indent=1), encoding="utf-8")
    (MEDIA / "tracks" / "_labels.json").write_text(json.dumps(summary, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()

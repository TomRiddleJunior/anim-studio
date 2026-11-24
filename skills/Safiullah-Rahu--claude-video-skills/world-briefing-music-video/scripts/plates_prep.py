"""Prepare the chosen plates for the film: trim the printed paper margin the model draws around the image, re-crop to
16:9, resize to 1920x1080 and register them in media/manifest.json (plates: {id: {image, w, h}}).

  python tools/plates_prep.py                    # uses plates/picks.json {"id": seed}; missing ids take the first seed found
  python tools/plates_prep.py --sheet            # contact sheet of all seeds per id → out/plates_sheet.jpg (to choose)
"""
import argparse, json, re
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
PL = ROOT / "plates"
MEDIA = ROOT / "media"


def margin(a, axis_edge):
    """How many uniform 'paper' lines to trim from one edge (max 80 px)."""
    h, w, _ = a.shape
    n = 0
    for i in range(80):
        line = {"top": a[i], "bottom": a[h - 1 - i], "left": a[:, i], "right": a[:, w - 1 - i]}[axis_edge].astype(np.float32)
        if line.std(axis=0).mean() < 9 and line.mean() > 170:  # a near-uniform light line: paper border
            n = i + 1
        else:
            break
    return n


def prep(src: Path, dst: Path):
    im = Image.open(src).convert("RGB")
    a = np.asarray(im)
    t, b, l, r = (margin(a, e) for e in ("top", "bottom", "left", "right"))
    # a printed border runs round all four sides; a pale sky only touches one: trim the common width only
    k = min(t, b, l, r)
    t = b = l = r = k if k >= 4 else 0
    pad = 6  # a little extra past the detected edge (soft print edge)
    box = [l + (pad if l else 0), t + (pad if t else 0), im.width - r - (pad if r else 0), im.height - b - (pad if b else 0)]
    im = im.crop(box)
    w, h = im.size
    tw = min(w, int(round(h * 16 / 9)))
    th = int(round(tw * 9 / 16))
    im = im.crop(((w - tw) // 2, (h - th) // 2, (w - tw) // 2 + tw, (h - th) // 2 + th)).resize((1920, 1080), Image.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, quality=93)
    return (t, b, l, r)


def sheet():
    files = sorted(PL.glob("*__s*.png"))
    ids = sorted({f.name.split("__s")[0] for f in files})
    cols = max(len([f for f in files if f.name.startswith(i + "__")]) for i in ids)
    tw, th = 480, 270
    out = Image.new("RGB", (cols * (tw + 8) + 220, len(ids) * (th + 8)), (17, 17, 17))
    d = ImageDraw.Draw(out)
    for r, i in enumerate(ids):
        d.text((8, r * (th + 8) + 8), i, fill=(230, 230, 230))
        for c, f in enumerate(sorted(f for f in files if f.name.startswith(i + "__"))):
            out.paste(Image.open(f).convert("RGB").resize((tw, th)), (220 + c * (tw + 8), r * (th + 8)))
            d.text((220 + c * (tw + 8) + 6, r * (th + 8) + 6), f.name.split("__")[1].replace(".png", ""), fill=(255, 80, 40))
    (ROOT / "out").mkdir(exist_ok=True)
    out.save(ROOT / "out" / "plates_sheet.jpg", quality=85)
    print(ROOT / "out" / "plates_sheet.jpg")


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--sheet", action="store_true")
    a = ap.parse_args()
    if a.sheet:
        return sheet()
    picks = json.loads((PL / "picks.json").read_text(encoding="utf-8")) if (PL / "picks.json").exists() else {}
    man_p = MEDIA / "manifest.json"
    man = json.loads(man_p.read_text(encoding="utf-8")) if man_p.exists() else {}
    man["plates"] = {}
    for f in sorted(PL.glob("*__s*.png")):
        pid, seed = f.stem.split("__s")
        want = picks.get(pid)
        if want is not None and str(want) != seed:
            continue
        if pid in man["plates"]:
            continue
        m = prep(f, MEDIA / "plates" / f"{pid}.jpg")
        man["plates"][pid] = {"image": f"plates/{pid}.jpg", "w": 1920, "h": 1080, "seed": int(seed)}
        print(f"{pid:<18} seed {seed:<4} trimmed t/b/l/r {m}")
    man_p.parent.mkdir(parents=True, exist_ok=True)
    man_p.write_text(json.dumps(man, indent=1), encoding="utf-8")
    print(f"{len(man['plates'])} plates -> {man_p}")


if __name__ == "__main__":
    main()

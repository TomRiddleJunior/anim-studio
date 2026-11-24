"""Evidence cards from `hyperframes capture` screenshots: crop, never retouch.

usage: python -I make_evidence.py <captures_dir> <out_dir>
Each card = the outlet's masthead (cropped from the same page, on a band of the header's own colour) + one or more
crops of the article (headline, byline/date, lead image or first paragraph). Ads and navigation are left out by
the crop boxes. Non-contiguous excerpts are joined by a 14 px gap with a dotted rule, so the join is visible.
Writes <id>.png and prints JSON: size and the key-line box (px and % of the card) for the box/underline.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

CAP, OUT = Path(sys.argv[1]), Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)
GAP = 14

# source: "s" = screenshots/scroll-000.png, "f" = screenshots/full-page.png; boxes are (x0, y0, x1, y1) in that image
CARDS = {
    "hormuz": dict(logo=("s", (384, 78, 590, 124)), pieces=[("s", (380, 362, 1205, 1052))],
                   key=("s", (386, 996, 1128, 1046), 0)),
    "alaska": dict(logo=("s", (322, 38, 518, 116)), pieces=[("s", (318, 190, 1268, 940))],
                   key=("s", (322, 198, 1206, 250), 0)),
    "israel": dict(logo=("s", (333, 279, 447, 313)), pieces=[("s", (236, 350, 1640, 1080))],
                   key=("s", (284, 460, 1630, 524), 0)),
    "brazil": dict(logo=("f", (298, 25, 452, 79)), pieces=[("f", (458, 200, 1130, 392)), ("f", (458, 942, 1130, 1106))],
                   key=("f", (462, 1046, 1124, 1080), 1)),
    "serbia": dict(logo=("s", (352, 48, 424, 120)), pieces=[("f", (345, 588, 1215, 1294))],
                   key=("f", (626, 640, 1070, 690), 0)),
    "venezuela": dict(logo=("s", (340, 30, 575, 75)), pieces=[("f", (350, 1676, 1375, 2480))],
                      key=("f", (580, 1750, 1250, 1820), 0)),
}

report = {}
for cid, c in CARDS.items():
    src = {"s": Image.open(CAP / cid / "screenshots" / "scroll-000.png").convert("RGB")}
    fp = CAP / cid / "screenshots" / "full-page.png"
    if fp.exists():
        src["f"] = Image.open(fp).convert("RGB")
    logo = src[c["logo"][0]].crop(c["logo"][1])
    pieces = [src[k].crop(b) for k, b in c["pieces"]]
    W = max(p.width for p in pieces)
    page_bg = pieces[0].getpixel((2, pieces[0].height - 3))
    head_bg = logo.getpixel((1, 1))
    band_h = logo.height + 24
    H = band_h + GAP + sum(p.height for p in pieces) + GAP * (len(pieces) - 1)
    card = Image.new("RGB", (W, H), page_bg)
    d = ImageDraw.Draw(card)
    d.rectangle((0, 0, W, band_h), fill=head_bg)
    card.paste(logo, (16, 12))
    y = band_h + GAP
    tops = []
    for i, p in enumerate(pieces):
        if i:
            yy = y - GAP // 2 - 1
            for x in range(16, W - 16, 10):
                d.rectangle((x, yy, x + 3, yy + 1), fill=(150, 150, 150))
        tops.append(y)
        card.paste(p, (0, y))
        y += p.height + GAP
    k_src, k_box, k_piece = c["key"]
    pb = c["pieces"][k_piece][1]
    kx0, ky0 = k_box[0] - pb[0], k_box[1] - pb[1] + tops[k_piece]
    kx1, ky1 = k_box[2] - pb[0], k_box[3] - pb[1] + tops[k_piece]
    card.save(OUT / f"{cid}.png", optimize=True)
    report[cid] = dict(w=W, h=H, key_px=[kx0, ky0, kx1, ky1],
                       key_pct=[round(100 * kx0 / W, 2), round(100 * ky0 / H, 2), round(100 * (kx1 - kx0) / W, 2), round(100 * (ky1 - ky0) / H, 2)])
print(json.dumps(report, indent=1))

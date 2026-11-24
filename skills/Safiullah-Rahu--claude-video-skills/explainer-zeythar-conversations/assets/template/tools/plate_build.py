"""Build the character plate from the Conversations Beyond Time key art (run once per key art; the result ships in the
skill).  Zeythar (left) and the girl (right) before the giant clock.

Input  assets/ref/keyart.png (1402 x 1122), assets/ref/keyart_sr2x.png (learned 2x, tools/sr_upscale.py) if present
Output plate/ (all at 2x = 2804 x 2244 unless noted)
  full.jpg          the whole key art, 2x
  bg.jpg            background with both characters removed, and with the baked-in name tag, the holographic orb and
                    the painted clock hand removed (code draws all three)
  zeythar.png       RGBA cut-out of Zeythar (GrabCut seeded by polygons + darkness)
  girl.png          RGBA cut-out of the girl (GrabCut with polygon hints)
  girl_closed.png   RGB crop of the girl's face with both eyes filled shut from the surrounding skin (lids for blinks)
  lines.png         R = Zeythar's blue rune lines, G = the medallion core (1x of the plate, upsampled)
  regions_girl.png  R head (face, front hair, ear; NOT the hand) · G back hair · B torso · A eye openings (iris moves)
  regions_girl2.png R jaw (lower lip + chin, the hand masked out) · G face skin (smile/cheek, no hand) · B hand+forearm
  regions_zeythar.png R hood · G open hand · B low hand · A torso
  masks_preview.jpg cut-outs over magenta + the background, for checking
  landmarks.json    every coordinate the film uses, in SOURCE pixels (1402 x 1122) + the files

usage: python -I tools/plate_build.py        (anaconda python: OpenCV + numpy)
"""
import json
import os

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "ref", "keyart.png")
OUT = os.path.join(ROOT, "plate")
UP = 2

# ---- hand-measured geometry (source px), from grid crops of the key art and the SR 2x (scratch/grid/) ----------------
Z_OUTER = [(388, 80), (440, 92), (512, 124), (568, 164), (610, 210), (617, 262), (614, 312), (606, 362), (598, 402), (586, 442),
           (570, 472), (580, 498), (604, 524), (614, 556), (624, 536), (634, 528), (650, 530), (652, 556), (642, 600), (652, 608), (700, 606),
           (740, 584), (762, 572), (786, 580), (788, 600), (764, 616), (734, 636), (704, 664), (676, 688), (660, 700), (694, 716),
           (712, 752), (732, 800), (760, 852), (782, 898), (794, 946), (800, 1008), (800, 1060), (804, 1122), (0, 1122), (0, 676),
           (8, 636), (24, 578), (42, 522), (56, 484), (76, 440), (108, 400), (152, 364), (204, 341), (258, 318), (262, 270),
           (290, 192), (338, 118)]
Z_INNER = [(394, 104), (480, 128), (548, 180), (588, 236), (592, 312), (582, 390), (566, 440), (548, 470), (574, 510), (596, 566),
           (614, 628), (676, 636), (730, 606), (744, 610), (694, 664), (664, 700), (696, 760), (726, 840), (758, 920), (772, 1050),
           (772, 1122), (22, 1122), (22, 700), (50, 590), (80, 500), (120, 440), (200, 382), (262, 350), (282, 290), (308, 212), (350, 146)]
L_OUTER = [(928, 266), (946, 238), (968, 214), (994, 196), (1030, 180), (1066, 170), (1102, 168), (1160, 176), (1206, 196),
           (1230, 240), (1244, 290), (1264, 340), (1292, 392), (1316, 445), (1336, 495), (1352, 545), (1372, 600), (1392, 650),
           (1402, 690), (1402, 1122), (794, 1122), (792, 1050), (798, 1000), (798, 940), (804, 890), (818, 845), (836, 800),
           (842, 740), (845, 650), (852, 560), (870, 490), (896, 452), (938, 440), (946, 398), (956, 380), (950, 344), (934, 316),
           (922, 290)]
L_INNER = [(958, 230), (1060, 190), (1170, 200), (1215, 260), (1240, 340), (1280, 430), (1310, 500), (1338, 600), (1355, 700),
           (1370, 800), (1385, 900), (1390, 1112), (826, 1112), (816, 1000), (826, 900), (846, 820), (858, 740), (866, 662), (898, 560),
           (938, 500), (958, 456), (960, 412), (976, 398), (972, 360), (966, 322), (950, 270)]
# sure background for the girl's cut: the lit dial between the two of them, the clock frame beyond her hair, the sky
# above her crown and left of her fingers (wisps there are lost, by design: GrabCut takes the lit frame for hair)
L_SURE_BG = [[(730, 650), (832, 650), (834, 770), (818, 830), (806, 870), (798, 900), (790, 900), (775, 870), (752, 830), (735, 790), (722, 750), (712, 700)],
             [(1252, 180), (1402, 180), (1402, 668), (1386, 640), (1364, 588), (1344, 538), (1328, 488), (1306, 438), (1282, 388), (1262, 338), (1246, 286), (1230, 232)],
             [(890, 150), (1250, 150), (1214, 182), (1164, 166), (1102, 158), (1062, 160), (1024, 170), (988, 186), (960, 206), (938, 230), (918, 256), (890, 256)],
             [(866, 382), (934, 382), (938, 402), (934, 428), (918, 442), (866, 448)]]
# baked-in elements the code redraws
TAG_BOX = (88, 242, 242, 332)                                   # the "Zeythar / The Sage AI" glass tag (+ its glow)
ORB = {"c": (731, 432), "ax": (134, 110), "angle": 0.0}         # the holographic atom orb: all rings + sparkles inside
CLOCK_HAND = [(667, 113), (695, 113), (695, 172), (689, 176), (689, 352), (672, 352), (672, 176), (667, 172)]  # painted hand
STAR_DONOR = (740, 150, 900, 300)                               # a clean patch of the starry dial (texture for the orb hole)

REGIONS = {
    "girl": {
        # R head: face, front hair, crown, ear (the hand under the chin is NOT in it: the tilt pivots at the chin)
        "R": [(918, 236), (950, 196), (1000, 168), (1066, 156), (1136, 161), (1196, 184), (1224, 214), (1196, 270), (1150, 330),
              (1120, 380), (1092, 410), (1060, 430), (1020, 438), (992, 440), (978, 430), (976, 404), (962, 396), (950, 372),
              (944, 344), (930, 318), (914, 282)],
        # G back hair: the long waves on her right shoulder and back
        "G": [(1196, 186), (1242, 222), (1274, 268), (1300, 330), (1328, 396), (1358, 472), (1388, 548), (1402, 610), (1402, 800),
              (1372, 820), (1330, 760), (1290, 640), (1250, 520), (1214, 420), (1170, 350), (1180, 280)],
        # B torso: shawl, arms, legs (breathing)
        "B": [(840, 500), (930, 470), (1060, 450), (1180, 420), (1300, 520), (1402, 640), (1402, 1122), (794, 1122), (800, 900), (836, 700)],
    },
    "girl2": {
        # R jaw: lower lip + chin, ending ABOVE the knuckles; the fingers on the left are excluded
        "R": [(975, 391), (986, 392.6), (995, 394.6), (1004, 396.6), (1013, 399), (1024, 403), (1036, 416), (1034, 430), (1012, 436), (992, 434), (980, 426), (976, 410)],
        # G face skin (smile corners, cheek lift): cheek + mouth area, no hand, no hair
        "G": [(966, 340), (1000, 336), (1050, 344), (1080, 360), (1080, 400), (1056, 428), (1020, 436), (990, 432), (978, 420),
              (978, 392), (970, 372)],
        # B hand + wrist + forearm (stays put; used to hold it while the head moves)
        "B": [(944, 396), (962, 394), (976, 410), (990, 438), (1040, 440), (1052, 470), (1046, 520), (1040, 560), (1000, 640), (960, 700),
              (930, 700), (936, 620), (968, 540), (972, 500), (950, 470), (940, 430)],
    },
    "zeythar": {
        "R": [(262, 318), (262, 270), (284, 196), (326, 124), (383, 72), (440, 88), (512, 122), (568, 162), (612, 210), (624, 262),
              (622, 332), (614, 402), (604, 452), (588, 480), (560, 490), (500, 476), (420, 470), (330, 420), (280, 370)],
        "G": [(560, 600), (604, 524), (634, 518), (660, 528), (700, 600), (744, 570), (790, 570), (796, 604), (740, 646), (690, 700),
              (640, 724), (580, 700)],
        "B": [(486, 930), (540, 900), (610, 905), (650, 950), (650, 1040), (600, 1080), (520, 1075), (480, 1020)],
        "A": [(60, 480), (260, 340), (600, 470), (700, 700), (790, 900), (800, 1122), (0, 1122), (0, 700)],
    },
}

LANDMARKS = {
    "source_size": [1402, 1122],
    "clock": {"center": [679, 395], "hand_hour": 168, "hand_min": 262, "ring_inner": 288, "ring_outer": 652,
              "note": "code hands on the inpainted dial; centre = where the painted hand and the XII numeral line up with the inner ring"},
    "zeythar": {
        "medallion": [466, 527], "medallion_r": 24,
        "hood_pivot": [500, 482], "hood_center": [470, 280], "hood_r": 240,
        "hood_void": [[440, 205], [560, 172], [606, 228], [612, 320], [600, 410], [576, 462], [520, 472], [450, 452], [410, 392], [404, 300]],
        "chest": [380, 660], "breath_pivot": [380, 1120], "breath_r": 430,
        "hand_raised": [690, 616], "hand_raised_r": 110, "wrist": [612, 676], "palm": [700, 604],
        "hand_low": [562, 990], "hand_low_r": 85,
        "orb": [733, 431], "orb_r": [117, 95],
        "tag_box": list(TAG_BOX), "tag_draw": [94, 247, 237, 326],
        "bbox": [0, 72, 804, 1122],
    },
    "girl": {
        "eyes": {
            # three polylines per eye, left to right, source px (measured on the SR 2x): top = top of the lash band (the
            # lid region starts here), lid = the resting upper-lid edge (top of the visible eyeball), bottom = the lower lid.
            "far": {"outer_side": "left",
                    "top": [[982, 318], [983.5, 313], [986, 309.5], [990, 308.5], [994, 309], [997, 310.5], [999.5, 313.5], [1000.5, 318]],
                    "lid": [[982, 318], [984, 314], [987, 311.5], [990, 310.5], [993, 311], [996, 312.5], [998.5, 315], [1000.5, 318]],
                    "bottom": [[982, 318], [984, 323], [987, 327], [991, 329.5], [995, 330.5], [998, 330.5], [1000.5, 329]],
                    "iris": [990, 318], "iris_r": 5.5},
            "near": {"outer_side": "right",
                     "top": [[1022, 331], [1024, 322], [1027, 318], [1031, 316], [1036, 315], [1042, 315.5], [1048, 317], [1054, 319.5], [1059, 323], [1062, 327], [1063, 332]],
                     "lid": [[1022, 331], [1025, 326], [1028, 322.5], [1032, 321], [1036, 320.5], [1040, 321.5], [1044, 322.5], [1048, 323.5], [1052, 325], [1056, 327], [1060, 329.5], [1063, 332]],
                     "bottom": [[1022, 331], [1025, 335], [1029, 338], [1034, 339.5], [1040, 340], [1046, 340], [1051, 339.5], [1055, 338], [1059, 336], [1063, 332]],
                     "iris": [1033, 329], "iris_r": 7.5},
        },
        "brows": {"far": [990, 290], "near": [1046, 292]},
        "mouth": {"left": [977, 389.5], "mid": [995, 393.2], "right": [1013, 397.5], "chin": [994, 418], "lower_lip": [994, 400]},
        "face_center": [1020, 345], "head_center": [1090, 300], "tilt_pivot": [996, 440], "head_r": 190,
        "hair_anchor": [1190, 230], "hair_center": [1300, 520], "hair_r": 260,
        "hand_chin": [995, 452], "torso": [1080, 720], "breath_pivot": [1080, 1100],
        "face_box": [938, 268, 1100, 446],
        "bbox": [794, 156, 1402, 1122],
    },
}


def poly_mask(pts, shape, val=255):
    m = np.zeros(shape[:2], np.uint8)
    cv2.fillPoly(m, [np.array(pts, np.int32)], val)
    return m


def grabcut(img, outer, inner, sure_bg_extra=None, extra_fg=None, iters=6):
    H, W = img.shape[:2]
    gc = np.full((H, W), cv2.GC_BGD, np.uint8)
    o = poly_mask(outer, img.shape)
    o = cv2.dilate(o, np.ones((15, 15), np.uint8))
    gc[o > 0] = cv2.GC_PR_BGD
    gc[poly_mask(outer, img.shape) > 0] = cv2.GC_PR_FGD
    gc[poly_mask(inner, img.shape) > 0] = cv2.GC_FGD
    if extra_fg is not None:
        gc[(extra_fg > 0) & (o > 0)] = cv2.GC_FGD
    if sure_bg_extra is not None:
        gc[sure_bg_extra > 0] = cv2.GC_BGD
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(img, gc, None, bgd, fgd, iters, cv2.GC_INIT_WITH_MASK)
    m = np.where((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    if n > 1:
        k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])); m = np.where(lab == k, 255, 0).astype(np.uint8)
    inv = 255 - m
    n, lab, st, _ = cv2.connectedComponentsWithStats(inv)
    for i in range(1, n):
        x, y, w, h, a = st[i]
        if a < 1500 and x > 0 and y > 0 and x + w < W and y + h < H:
            m[lab == i] = 255
    return m


def soft_alpha(m, r=2):
    k = np.ones((3, 3), np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k); m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k)
    return np.clip(cv2.GaussianBlur(m.astype(np.float32) / 255.0, (0, 0), r * 0.6), 0, 1)


SR_PATH = os.path.join(ROOT, "assets", "ref", "keyart_sr2x.png")
SR = {}


def upscale(img, alpha=None, box=None):
    """img is the key art or an edited copy of it (box = its crop in source px): lanczos colour + learned detail where
    the picture is still the key art (inpainted areas keep a gentle lanczos unsharp)"""
    up = cv2.resize(img, None, fx=UP, fy=UP, interpolation=cv2.INTER_LANCZOS4)
    f = up.astype(np.float32)
    blur = cv2.GaussianBlur(f, (0, 0), 1.3)
    detail = np.clip((f - blur) * 0.42, -18.0, 18.0)
    if "sr" in SR:
        x0, y0, x1, y1 = box or (0, 0, img.shape[1], img.shape[0])
        sr = SR["sr"][y0 * UP:y1 * UP, x0 * UP:x1 * UP].astype(np.float32)
        sr_detail = sr - cv2.GaussianBlur(sr, (0, 0), 1.3)
        same = (np.abs(img.astype(np.int16) - SR["src"][y0:y1, x0:x1].astype(np.int16)).max(2) < 3).astype(np.float32)
        same = cv2.erode(same, np.ones((3, 3), np.uint8))
        same = cv2.GaussianBlur(cv2.resize(same, (up.shape[1], up.shape[0]), interpolation=cv2.INTER_LINEAR), (0, 0), 1.5)[..., None]
        detail = sr_detail * same + detail * (1 - same)
    f = blur + detail if "sr" in SR else f + detail
    up = np.clip(f, 0, 255).astype(np.uint8)
    if alpha is not None:
        a = cv2.resize(alpha, None, fx=UP, fy=UP, interpolation=cv2.INTER_CUBIC)
        return up, np.clip(a, 0, 1)
    return up


def eye_samples(e, n):
    x0 = min(p[0] for p in e["top"]); x1 = max(p[0] for p in e["top"])
    xs = np.linspace(x0, x1, n)
    out = {"x0": float(x0), "x1": float(x1)}
    for k in ("top", "lid", "bottom"):
        P = np.array(e[k], np.float32)
        out[k] = [round(float(v), 2) for v in np.interp(xs, P[:, 0], P[:, 1])]
    return out


def textured_fill(img, hole, donor_box, telea_r=9, seed=3):
    """inpaint `hole` (uint8 mask): Telea for the smooth colour, then procedural stars and grain matched to a clean
    donor patch of the dial (star density and brightness), so the fill is not a smooth blob in a starry dial and
    carries no copied structure (tiling a donor repeats its spokes as diamonds)"""
    base = cv2.inpaint(img, hole, telea_r, cv2.INPAINT_TELEA)
    base = cv2.GaussianBlur(base, (0, 0), 2.6).astype(np.float32)
    x0, y0, x1, y1 = donor_box
    don = cv2.cvtColor(img[y0:y1, x0:x1], cv2.COLOR_BGR2GRAY).astype(np.float32)
    hi = don - cv2.GaussianBlur(don, (0, 0), 3.0)
    peaks = (hi > 14) & (hi == cv2.dilate(hi, np.ones((5, 5), np.uint8)))
    density = peaks.sum() / hi.size                         # stars per px
    amps = np.sort(hi[peaks]) if peaks.any() else np.array([30.0])
    grain = float(np.std(hi[np.abs(hi) < 8])) if (np.abs(hi) < 8).any() else 2.0
    H, W = img.shape[:2]
    ys, xs = np.where(hole > 0)
    rng = np.random.default_rng(seed)
    star = np.zeros((H, W), np.float32)
    n = int(density * len(ys))
    pick = rng.integers(0, len(ys), n)
    for i in pick:
        a = float(amps[rng.integers(0, len(amps))]) * 1.15
        sig = 0.55 + 0.5 * rng.random()
        cy, cx = ys[i] + rng.random(), xs[i] + rng.random()
        r0 = 3
        yy, xx = np.mgrid[int(cy) - r0:int(cy) + r0 + 1, int(cx) - r0:int(cx) + r0 + 1]
        ok = (yy >= 0) & (yy < H) & (xx >= 0) & (xx < W)
        g = a * np.exp(-((yy - cy) ** 2 + (xx - cx) ** 2) / (2 * sig * sig))
        star[yy[ok], xx[ok]] += g[ok]
    noise = cv2.GaussianBlur(rng.standard_normal((H, W)).astype(np.float32), (0, 0), 0.7) * grain * 1.4
    tint = np.array([1.0, 0.92, 0.85], np.float32)          # BGR: stars slightly blue-white
    w = cv2.GaussianBlur(hole.astype(np.float32) / 255, (0, 0), 3.0)[..., None]
    fillv = base + (star[..., None] * tint) + noise[..., None]
    out = img.astype(np.float32) * (1 - w) + fillv * w
    return np.clip(out, 0, 255).astype(np.uint8)


def main():
    os.makedirs(OUT, exist_ok=True)
    img = cv2.imread(SRC)
    H, W = img.shape[:2]
    if os.path.exists(SR_PATH):
        SR["src"] = img.copy(); SR["sr"] = cv2.imread(SR_PATH)
        assert SR["sr"].shape[:2] == (H * UP, W * UP), "keyart_sr2x.png must be exactly 2x the key art"
        print("detail from", SR_PATH)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    hh, ss, vv = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    orb_m = np.zeros((H, W), np.uint8)
    cv2.ellipse(orb_m, ORB["c"], ORB["ax"], ORB["angle"], 0, 360, 255, -1)

    # --- the girl first (Zeythar's inner polygon is sure background for her) ---
    girl_bg = poly_mask(Z_INNER, img.shape)
    girl_bg[orb_m > 0] = 255
    for q in L_SURE_BG:
        girl_bg[poly_mask(q, img.shape) > 0] = 255
    girl = grabcut(img, L_OUTER, L_INNER, sure_bg_extra=girl_bg)
    # Zeythar: the girl and the orb are sure background; his near-black cloth is sure foreground inside his outline
    z_bg = cv2.bitwise_or(girl, poly_mask(L_INNER, img.shape))
    orb_bg = orb_m.copy(); orb_bg[:, :612] = 0          # the orb's left tip touches the hood edge: keep the hood
    z_bg = cv2.bitwise_or(z_bg, orb_bg)
    tagm = np.zeros((H, W), np.uint8); cv2.rectangle(tagm, TAG_BOX[:2], TAG_BOX[2:], 255, -1)
    z_bg = cv2.bitwise_or(z_bg, tagm)
    z_bg = cv2.bitwise_or(z_bg, poly_mask(L_SURE_BG[0], img.shape))      # the lit dial right of his robe
    dark = (vv < 50).astype(np.uint8) * 255
    zey = grabcut(img, Z_OUTER, Z_INNER, sure_bg_extra=z_bg, extra_fg=cv2.bitwise_and(dark, poly_mask(Z_OUTER, img.shape)))
    girl[zey > 0] = 0
    a_girl = soft_alpha(girl, 2.2)
    a_zey = soft_alpha(zey, 1.6)

    # --- background: characters out (Telea at half scale, blurred), then the tag, the painted hand, the orb ---
    hole = cv2.bitwise_or(girl, zey)
    hole = cv2.dilate(hole, np.ones((13, 13), np.uint8))
    small = cv2.resize(img, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
    hs = cv2.resize(hole, (W // 2, H // 2), interpolation=cv2.INTER_NEAREST)
    fill = cv2.inpaint(small, hs, 9, cv2.INPAINT_TELEA)
    fill = cv2.GaussianBlur(fill, (0, 0), 3.0)
    fill = cv2.resize(fill, (W, H), interpolation=cv2.INTER_CUBIC)
    wc = cv2.GaussianBlur(hole.astype(np.float32) / 255, (0, 0), 2.5)[..., None]
    bg = np.clip(img.astype(np.float32) * (1 - wc) + fill.astype(np.float32) * wc, 0, 255).astype(np.uint8)
    # the painted clock hand (thin bar + its pointer ornament): fine full-res Telea keeps the dial's stars around it
    hand = cv2.dilate(poly_mask(CLOCK_HAND, img.shape), np.ones((5, 5), np.uint8))
    bg = textured_fill(bg, hand, STAR_DONOR, telea_r=6, seed=5)
    # the orb (+ a margin for its sparkles and the brightest glow)
    orb_hole = cv2.dilate(orb_m, np.ones((9, 9), np.uint8))
    bg = textured_fill(bg, orb_hole, STAR_DONOR, telea_r=11, seed=7)
    # the name tag over the gears: Telea is enough (the code tag covers it from his first line on)
    bg = cv2.inpaint(bg, cv2.dilate(tagm, np.ones((7, 7), np.uint8)), 9, cv2.INPAINT_TELEA)
    tw = cv2.GaussianBlur(cv2.dilate(tagm, np.ones((9, 9), np.uint8)).astype(np.float32) / 255, (0, 0), 4)[..., None]
    bg = np.clip(bg.astype(np.float32) * (1 - tw) + cv2.GaussianBlur(bg, (0, 0), 3.0).astype(np.float32) * tw, 0, 255).astype(np.uint8)

    # --- closed eyes: fill each eye (+ its lash band) from the surrounding skin, face crop only ---
    lm = LANDMARKS["girl"]
    fx0, fy0, fx1, fy1 = 960, 280, 1090, 360
    eyehole = np.zeros((H, W), np.uint8)
    for k, e in lm["eyes"].items():
        poly = e["top"] + e["bottom"][::-1]
        cv2.fillPoly(eyehole, [np.array(poly, np.int32)], 255)
        e["samples"] = eye_samples(e, 32)
    eyehole = cv2.dilate(eyehole, np.ones((5, 5), np.uint8))
    # skin = warm, moderately saturated, bright (no hair, lashes or brows); the nose-bridge highlight is skin too
    # (the nose-bridge highlight, V > 236, is left out: it made the far lid pale)
    skin = ((vv > 120) & (vv < 236) & (ss > 40) & (ss < 175) & ((hh < 22) | (hh > 170)) & (eyehole == 0)).astype(np.float32)
    skin[:, :978] = 0
    skin[:292, :] = 0              # nothing from the brows up
    f = img.astype(np.float32)
    fillc = None
    for sig in (12.0, 6.0, 3.0):
        num = cv2.GaussianBlur(f * skin[..., None], (0, 0), sig); den = cv2.GaussianBlur(skin, (0, 0), sig)[..., None]
        est = num / np.maximum(den, 1e-5)
        fillc = est if fillc is None else fillc * (1 - np.clip(den * 2.5, 0, 1)) + est * np.clip(den * 2.5, 0, 1)
    soft = cv2.GaussianBlur(cv2.dilate(eyehole, np.ones((7, 7), np.uint8)).astype(np.float32) / 255, (0, 0), 2.0)[..., None]
    closed = np.clip(f * (1 - soft) + fillc * soft, 0, 255).astype(np.uint8)
    crop = closed[fy0:fy1, fx0:fx1]
    LANDMARKS["girl"]["closed_crop"] = [fx0, fy0, fx1, fy1]

    # --- Zeythar's blue rune lines + the medallion core ---
    lines_m = ((hh > 84) & (hh < 124) & (ss > 70) & (vv > 120) & (a_zey > 0.5)).astype(np.float32)
    mc = np.zeros((H, W), np.float32)
    cv2.circle(mc, tuple(LANDMARKS["zeythar"]["medallion"]), 15, 1.0, -1)
    mc = cv2.GaussianBlur(mc, (0, 0), 4)
    lines_m = cv2.GaussianBlur(lines_m, (0, 0), 0.8)
    lines = np.dstack([np.zeros_like(lines_m), np.clip(mc * 255, 0, 255), np.clip(lines_m * 255 * 1.4, 0, 255)]).astype(np.uint8)

    # --- upscale + write ---
    cv2.imwrite(os.path.join(OUT, "full.jpg"), upscale(img), [cv2.IMWRITE_JPEG_QUALITY, 93])
    cv2.imwrite(os.path.join(OUT, "bg.jpg"), upscale(bg), [cv2.IMWRITE_JPEG_QUALITY, 92])
    for name, a in (("zeythar", a_zey), ("girl", a_girl)):
        up, au = upscale(img, a)
        cv2.imwrite(os.path.join(OUT, name + ".png"), np.dstack([up, (au * 255).astype(np.uint8)]), [cv2.IMWRITE_PNG_COMPRESSION, 6])
    cv2.imwrite(os.path.join(OUT, "girl_closed.png"), upscale(crop, box=(fx0, fy0, fx1, fy1)))
    cv2.imwrite(os.path.join(OUT, "lines.png"), cv2.resize(lines, None, fx=UP, fy=UP, interpolation=cv2.INTER_CUBIC))
    mag = np.zeros_like(img); mag[:] = (180, 0, 200)
    pv = [(img * a[..., None] + mag * (1 - a[..., None])).astype(np.uint8) for a in (a_zey, a_girl)] + [bg]
    cv2.imwrite(os.path.join(OUT, "masks_preview.jpg"), cv2.resize(np.concatenate(pv, 1), None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA),
                [cv2.IMWRITE_JPEG_QUALITY, 88])
    # region maps (1x, soft)
    idx = {"R": 2, "G": 1, "B": 0, "A": 3}            # OpenCV writes BGRA
    for who, chans in REGIONS.items():
        rm = np.zeros((H, W, 4), np.float32)
        for ch, pts in chans.items():
            m = poly_mask(pts, img.shape).astype(np.float32) / 255
            sig = 40 if (who == "zeythar" and ch == "A") else ((1.2 if ch == "R" else 3) if who == "girl2" else 9)
            rm[..., idx[ch]] = cv2.GaussianBlur(m, (0, 0), sig)
        if who == "girl":
            # A = the eye openings (lid edge to lower lid), eroded a hair and feathered: the iris moves inside them
            eo = np.zeros((H * 4, W * 4), np.uint8)
            for e in lm["eyes"].values():
                poly = [(x * 4, y * 4) for x, y in e["lid"]] + [(x * 4, y * 4) for x, y in e["bottom"][::-1]]
                cv2.fillPoly(eo, [np.array(poly, np.int32)], 255)
            eo = cv2.resize(cv2.erode(eo, np.ones((5, 5), np.uint8)), (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
            rm[..., 3] = cv2.GaussianBlur(eo, (0, 0), 0.7)
            # the hand never belongs to the head
            hand_m = cv2.GaussianBlur(poly_mask(REGIONS["girl2"]["B"], img.shape).astype(np.float32) / 255, (0, 0), 2)
            rm[..., 2] *= 1 - hand_m
        elif "A" not in chans:
            rm[..., 3] = 1.0
        cv2.imwrite(os.path.join(OUT, f"regions_{who}.png"), np.clip(rm * 255, 0, 255).astype(np.uint8))
    LANDMARKS["regions"] = {"girl": {"R": "head", "G": "back hair", "B": "torso", "A": "eye openings"},
                            "girl2": {"R": "jaw", "G": "face skin", "B": "hand + forearm"},
                            "zeythar": {"R": "hood", "G": "open hand", "B": "low hand", "A": "torso"}}
    LANDMARKS["files"] = {"scale": UP, "full": "full.jpg", "bg": "bg.jpg", "zeythar": "zeythar.png", "girl": "girl.png",
                          "girl_closed": "girl_closed.png", "lines": "lines.png", "regions_girl": "regions_girl.png",
                          "regions_girl2": "regions_girl2.png", "regions_zeythar": "regions_zeythar.png"}
    json.dump(LANDMARKS, open(os.path.join(OUT, "landmarks.json"), "w"), indent=1)
    print("plate written to", OUT)


if __name__ == "__main__":
    main()

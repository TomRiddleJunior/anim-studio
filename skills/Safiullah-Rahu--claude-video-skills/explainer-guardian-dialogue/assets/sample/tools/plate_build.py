"""Build the character plate from the key art (run once per key art; the result ships in the skill).

Input  assets/ref/keyart.png (1402 x 1122)
Output plate/ (all at 2x = 2804 x 2244 unless noted)
  full.jpg          the whole key art, lanczos 2x + gentle detail-preserving sharpen
  bg.jpg            background with both characters removed (Telea inpaint at half scale, blurred), painted clock
                    hands removed too (code draws new ones), ledge kept
  guardian.png      RGBA cut-out of the Guardian (GrabCut seeded by polygons + darkness)
  girl.png          RGBA cut-out of the girl (GrabCut with polygon hints)
  girl_closed.png   RGB crop of the girl's face with both eyes inpainted shut (skin only; the shader draws the lid edge)
  lines.png         soft mask of the Guardian's cyan circuit lines (R) and the medallion core (G)
  masks_preview.jpg cut-outs over magenta, for checking
  landmarks.json    every coordinate the film uses, in SOURCE pixels (1402 x 1122) + the scale of the files

usage: python -I tools/plate_build.py        (anaconda python: OpenCV 4.13 + numpy)

If assets/ref/keyart_sr2x.png exists (a learned 2x upscale, made by tools/sr_upscale.py), every upscale keeps the
lanczos image's colour and tone (its low frequencies) and takes the fine detail from the learned upscale, but only where
the picture is still the key art; inpainted areas (background fill, closed lids) keep the lanczos sharpen.
"""
import json
import os

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "ref", "keyart.png")
OUT = os.path.join(ROOT, "plate")
UP = 2

# ---- hand-measured geometry (source px), from 7x grid crops (scratch/grid_*.jpg) ------------------------------------
G_OUTER = [(480, 35), (560, 45), (640, 90), (700, 150), (737, 215), (737, 262), (718, 330), (707, 400), (702, 440), (694, 470),
           (703, 530), (705, 575), (718, 640), (738, 720), (762, 790), (782, 850), (802, 880), (832, 922), (857, 982), (880, 1040), (897, 1122),
           (0, 1122), (0, 850), (40, 760), (78, 650), (108, 560), (138, 468), (198, 408), (278, 358), (306, 280), (328, 190),
           (378, 108), (430, 58)]
G_INNER = [(490, 72), (600, 102), (688, 192), (700, 250), (682, 330), (670, 420), (660, 480), (672, 560), (690, 660), (720, 760),
           (742, 850), (788, 922), (828, 1002), (858, 1122), (30, 1122), (42, 905), (92, 762), (132, 642), (172, 522), (232, 452), (312, 402),
           (352, 302), (362, 202), (412, 122)]
L_OUTER = [(1075, 292), (1150, 298), (1222, 328), (1272, 368), (1302, 398), (1342, 450), (1372, 520), (1396, 600), (1399, 680),
           (1386, 730), (1352, 790), (1322, 822), (1306, 860), (1312, 960), (1298, 1040), (1300, 1122), (906, 1122), (902, 1045),
           (884, 990), (886, 930), (893, 880), (888, 800), (898, 720), (913, 650), (933, 590), (938, 540), (936, 480), (938, 420), (953, 358), (998, 318)]
L_INNER = [(1080, 322), (1150, 332), (1220, 362), (1265, 412), (1300, 472), (1330, 562), (1348, 650), (1338, 720), (1300, 762),
           (1290, 850), (1280, 960), (1270, 1040), (1262, 1122), (916, 1122), (912, 1000), (915, 900), (922, 800), (932, 722),
           (948, 662), (962, 602), (967, 542), (962, 472), (972, 402), (1012, 347)]
LEDGE = [(1066, 1048), (1402, 1044), (1402, 1122), (1066, 1122)]           # stone ledge front face (sure background)
GIRL_BG = [[(1290, 815), (1402, 815), (1402, 1040), (1305, 1040), (1318, 960), (1310, 880)],   # lit structure under the ponytail
           [(860, 1036), (901, 1036), (903, 1122), (860, 1122)]]                           # ledge shadow left of the jeans
CLOCK_HAND_ERASE = [(736, 150), (772, 150), (772, 690), (736, 690)]          # the painted vertical hand between them
CLOCK_BLOBS = [((702, 492), 16), ((731, 632), 16)]                           # painted hub balls (soft) — erased with the hand

# soft region maps for the warp controls (Live2D-like "art meshes"): a control only moves its region
REGIONS = {
    "girl": {   # R head (hair, face, ears, the hand at the chin) · G ponytail · B torso (hoodie, arms, jeans top)
        "R": [(950, 350), (995, 315), (1075, 290), (1150, 296), (1225, 326), (1268, 368), (1288, 420), (1278, 480), (1252, 530),
              (1212, 575), (1160, 605), (1100, 622), (1062, 642), (1040, 668), (990, 668), (945, 642), (933, 560), (938, 470)],
        "G": [(1258, 388), (1300, 396), (1345, 445), (1382, 520), (1402, 610), (1402, 722), (1380, 782), (1340, 832), (1300, 842),
              (1276, 800), (1266, 700), (1263, 600), (1252, 500), (1247, 420)],
        "B": [(900, 640), (1000, 652), (1100, 632), (1250, 560), (1300, 640), (1310, 900), (1300, 1040), (900, 1040), (888, 800)],
    },
    "guardian": {   # R hood (+ the void) · G raised hand + wrist · B low hand · A torso for breathing
        "R": [(300, 300), (330, 190), (380, 108), (480, 35), (560, 45), (640, 90), (737, 215), (737, 262), (718, 330), (705, 440),
              (694, 470), (660, 495), (560, 470), (470, 468), (400, 420), (320, 380)],
        "G": [(222, 512), (282, 506), (334, 552), (432, 582), (434, 622), (382, 682), (332, 712), (270, 722), (222, 690), (212, 600)],
        "B": [(518, 788), (560, 758), (640, 742), (692, 758), (694, 832), (642, 862), (560, 862), (518, 830)],
        "A": [(130, 450), (300, 350), (700, 450), (742, 780), (762, 880), (80, 880), (40, 760)],
    },
}

LANDMARKS = {
    "source_size": [1402, 1122],
    "clock": {"center": [755, 478], "face_r": 365, "rings": [365, 452, 560, 700], "hand_hour": 205, "hand_min": 318,
              "note": "code-drawn hands sit on the inpainted face; centre chosen where the painted hand met the rings"},
    "guardian": {
        "medallion": [521, 527], "medallion_r": 33,
        "hood_pivot": [585, 470], "hood_center": [560, 270], "hood_r": 230,
        "hood_void": [[470, 240], [715, 240], [700, 455], [520, 455]],
        "chest": [480, 640], "breath_pivot": [460, 1120], "breath_r": 420,
        "hand_raised": [330, 612], "hand_raised_r": 105, "hand_low": [605, 808], "hand_low_r": 85,
        "palm_raised": [320, 600],
        "bbox": [0, 35, 906, 1122],
    },
    "girl": {
        "eyes": {
            # three polylines per eye, left to right, source px: top = top of the lashes (the lid region starts here),
            # lid = the resting upper-lid edge (top of the visible eyeball), bottom = the lower lid. A blink moves the
            # lid edge from `lid` to `bottom` column by column; the shader draws the lash line on that edge.
            "far": {"outer_side": "left",
                    "top": [[974, 468], [975, 452], [977, 441], [981, 435], [985, 433], [990, 436], [994, 442], [996, 448], [997, 456]],
                    "lid": [[974, 468], [976, 458], [978, 450], [981, 446], [985, 444], [989, 445], [992, 448], [995, 452], [997, 456]],
                    "bottom": [[974, 468], [976, 473], [979, 476], [984, 476], [988, 473], [991, 469], [994, 463], [996, 459], [997, 456]]},
            "near": {"outer_side": "right",
                     "top": [[1020, 477], [1024, 452], [1028, 444], [1032, 434], [1040, 433], [1048, 435], [1057, 441], [1063, 445], [1068, 458], [1071, 467], [1073, 476]],
                     "lid": [[1020, 477], [1023, 474], [1026, 460], [1030, 453], [1035, 450], [1045, 448], [1055, 451], [1062, 457], [1067, 465], [1070, 471], [1073, 476]],
                     "bottom": [[1020, 477], [1024, 480], [1033, 482], [1047, 483], [1060, 482], [1068, 479], [1073, 476]]},
        },
        "brows": {"far": [982, 410], "near": [1040, 418]},
        "mouth": {"left": [966, 525], "mid": [990, 533], "right": [1011, 530], "chin": [985, 552]},
        "face_center": [1020, 480], "head_center": [1085, 450], "neck_pivot": [1075, 640], "head_r": 175,
        "ponytail_anchor": [1272, 405], "ponytail_center": [1340, 600], "ponytail_r": 190,
        "hair_front": [985, 380], "torso": [1100, 760], "breath_pivot": [1100, 1060],
        "bbox": [873, 292, 1402, 1122],
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
    # keep the largest component, fill holes
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    if n > 1:
        k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])); m = np.where(lab == k, 255, 0).astype(np.uint8)
    inv = 255 - m
    n, lab, st, _ = cv2.connectedComponentsWithStats(inv)
    for i in range(1, n):
        x, y, w, h, a = st[i]
        if a < 4000 and x > 0 and y > 0 and x + w < W and y + h < H:
            m[lab == i] = 255
    return m


def soft_alpha(img, m, r=2):
    """binary mask -> soft alpha: open/close, then a guided-ish feather (blur limited to a band at the edge)"""
    k = np.ones((3, 3), np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k); m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k)
    a = cv2.GaussianBlur(m.astype(np.float32) / 255.0, (0, 0), r * 0.6)
    return np.clip(a, 0, 1)


SR_PATH = os.path.join(ROOT, "assets", "ref", "keyart_sr2x.png")
SR = {}   # filled in main(): "src" the key art, "sr" its learned 2x upscale (when the file exists)


def upscale(img, alpha=None, box=None):
    """img is the key art or an edited copy of it (box = its crop in source px, default the whole frame)"""
    up = cv2.resize(img, None, fx=UP, fy=UP, interpolation=cv2.INTER_LANCZOS4)
    # gentle detail-preserving sharpen: unsharp mask on luma only, edge-limited
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
    f = blur + detail if "sr" in SR else f + detail   # with SR the learned detail replaces lanczos's own
    up = np.clip(f, 0, 255).astype(np.uint8)
    if alpha is not None:
        a = cv2.resize(alpha, None, fx=UP, fy=UP, interpolation=cv2.INTER_CUBIC)
        return up, np.clip(a, 0, 1)
    return up


def eye_samples(e, n):
    """resample the three polylines at n evenly spaced columns between the eye's left and right ends"""
    x0 = min(p[0] for p in e["top"]); x1 = max(p[0] for p in e["top"])
    xs = np.linspace(x0, x1, n)
    out = {"x0": float(x0), "x1": float(x1)}
    for k in ("top", "lid", "bottom"):
        P = np.array(e[k], np.float32)
        out[k] = [round(float(v), 2) for v in np.interp(xs, P[:, 0], P[:, 1])]
    return out


def eye_param(e, x, y):
    """quadratic-bezier eye: returns (s, v) arrays, s along outer->inner, v 0 at the upper lid, 1 at the lower"""
    A = np.array(e["outer"], np.float32); B = np.array(e["inner"], np.float32)
    U = 2 * np.array(e["up"], np.float32) - (A + B) / 2; D = 2 * np.array(e["lo"], np.float32) - (A + B) / 2
    ab = B - A; L2 = float(ab @ ab)
    s = ((x - A[0]) * ab[0] + (y - A[1]) * ab[1]) / L2
    sc = np.clip(s, 0, 1)
    yu = (1 - sc) ** 2 * A[1] + 2 * (1 - sc) * sc * U[1] + sc ** 2 * B[1]
    yl = (1 - sc) ** 2 * A[1] + 2 * (1 - sc) * sc * D[1] + sc ** 2 * B[1]
    v = (y - yu) / np.maximum(yl - yu, 0.5)
    return s, v


def main():
    os.makedirs(OUT, exist_ok=True)
    img = cv2.imread(SRC)
    H, W = img.shape[:2]
    if os.path.exists(SR_PATH):
        SR["src"] = img.copy()
        SR["sr"] = cv2.imread(SR_PATH)
        assert SR["sr"].shape[:2] == (H * UP, W * UP), "keyart_sr2x.png must be exactly 2x the key art"
        print("detail from", SR_PATH)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    hh, ss, vv = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    warm_bright = ((hh > 4) & (hh < 35) & (vv > 150) & (ss > 70)).astype(np.uint8) * 255

    # --- the girl first (her inner polygon is sure background for the Guardian) ---
    girl_bg = poly_mask(LEDGE, img.shape)
    for q in GIRL_BG:
        girl_bg[poly_mask(q, img.shape) > 0] = 255
    girl_bg[poly_mask(G_INNER, img.shape) > 0] = 255
    girl = grabcut(img, L_OUTER, L_INNER, sure_bg_extra=girl_bg)
    g_bg = cv2.bitwise_or(girl, poly_mask(L_INNER, img.shape))
    g_bg = cv2.bitwise_or(g_bg, cv2.bitwise_and(warm_bright, 255 - poly_mask(G_INNER, img.shape)))
    dark = (vv < 50).astype(np.uint8) * 255
    guard = grabcut(img, G_OUTER, G_INNER, sure_bg_extra=g_bg, extra_fg=cv2.bitwise_and(dark, poly_mask(G_OUTER, img.shape)))
    girl[guard > 0] = 0
    a_girl = soft_alpha(img, girl, 2.2)
    a_guard = soft_alpha(img, guard, 1.6)

    # --- background: inpaint characters + painted hand at half scale, then blur the fill ---
    hole = cv2.bitwise_or(girl, guard)
    hole = cv2.dilate(hole, np.ones((13, 13), np.uint8))
    hole[poly_mask(LEDGE, img.shape) > 0] = 0
    hand = poly_mask(CLOCK_HAND_ERASE, img.shape)
    for c, r in CLOCK_BLOBS:
        cv2.circle(hand, c, r, 255, -1)
    hand = cv2.dilate(hand, np.ones((5, 5), np.uint8))
    hole_all = cv2.bitwise_or(hole, hand)
    small = cv2.resize(img, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
    hs = cv2.resize(hole_all, (W // 2, H // 2), interpolation=cv2.INTER_NEAREST)
    fill = cv2.inpaint(small, hs, 9, cv2.INPAINT_TELEA)
    fill = cv2.GaussianBlur(fill, (0, 0), 3.0)
    fill = cv2.resize(fill, (W, H), interpolation=cv2.INTER_CUBIC)
    # the painted hand sits in the blurry face: a finer full-res Telea there keeps the rings continuous
    fine = cv2.inpaint(img, hand, 7, cv2.INPAINT_TELEA)
    fine = cv2.GaussianBlur(fine, (0, 0), 2.0)
    wh = cv2.GaussianBlur(hand.astype(np.float32) / 255, (0, 0), 3)[..., None]
    bg = img.astype(np.float32) * (1 - wh) + fine.astype(np.float32) * wh
    wc = cv2.GaussianBlur(hole.astype(np.float32) / 255, (0, 0), 2.5)[..., None]
    bg = bg * (1 - wc) + fill.astype(np.float32) * wc
    bg = np.clip(bg, 0, 255).astype(np.uint8)

    # --- closed eyes: inpaint each eye (+ its lash band) from the surrounding skin, at full res, face crop only ---
    lm = LANDMARKS["girl"]
    fx0, fy0, fx1, fy1 = 940, 395, 1100, 520
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    eyehole = np.zeros((H, W), np.uint8)
    for k, e in lm["eyes"].items():
        poly = e["top"] + e["bottom"][::-1]
        cv2.fillPoly(eyehole, [np.array(poly, np.int32)], 255)
        e["samples"] = eye_samples(e, 32)
    eyehole = cv2.dilate(eyehole, np.ones((5, 5), np.uint8))
    # lid skin = normalised convolution of the SKIN pixels around each eye (no hair, lashes or brows pulled in):
    # skin here is orange-pink, moderately saturated and bright; lit hair strands are more saturated, lashes/brows dark
    skin = ((vv > 140) & (ss > 45) & (ss < 165) & ((hh < 20) | (hh > 172)) & (eyehole == 0)).astype(np.float32)
    skin[:, :955] = 0
    f = img.astype(np.float32)
    fillc = None
    for sig in (14.0, 7.0, 3.5):   # coarse -> fine; each finer pass wins where it has enough skin support
        num = cv2.GaussianBlur(f * skin[..., None], (0, 0), sig); den = cv2.GaussianBlur(skin, (0, 0), sig)[..., None]
        est = num / np.maximum(den, 1e-5)
        fillc = est if fillc is None else fillc * (1 - np.clip(den * 2.5, 0, 1)) + est * np.clip(den * 2.5, 0, 1)
    # a wide soft band (fill -> original over ~4 px outside the hole) so the shader's lid region never shows a seam
    soft = cv2.GaussianBlur(cv2.dilate(eyehole, np.ones((7, 7), np.uint8)).astype(np.float32) / 255, (0, 0), 2.0)[..., None]
    closed = np.clip(f * (1 - soft) + fillc * soft, 0, 255).astype(np.uint8)
    crop = closed[fy0:fy1, fx0:fx1]
    LANDMARKS["girl"]["closed_crop"] = [fx0, fy0, fx1, fy1]

    # --- cyan circuit lines + medallion core ---
    cyan = ((hh > 88) & (hh < 112) & (ss > 90) & (vv > 120) & (a_guard > 0.5)).astype(np.float32)
    mc = np.zeros((H, W), np.float32)
    cv2.circle(mc, tuple(LANDMARKS["guardian"]["medallion"]), 17, 1.0, -1)
    mc = cv2.GaussianBlur(mc, (0, 0), 4)
    cyan = cv2.GaussianBlur(cyan, (0, 0), 0.8)
    lines = np.dstack([np.zeros_like(cyan), np.clip(mc * 255, 0, 255), np.clip(cyan * 255 * 1.4, 0, 255)]).astype(np.uint8)  # BGR: R=lines, G=core

    # --- upscale + write ---
    full_up = upscale(img)
    cv2.imwrite(os.path.join(OUT, "full.jpg"), full_up, [cv2.IMWRITE_JPEG_QUALITY, 93])
    cv2.imwrite(os.path.join(OUT, "bg.jpg"), upscale(bg), [cv2.IMWRITE_JPEG_QUALITY, 92])
    for name, a in (("guardian", a_guard), ("girl", a_girl)):
        up, au = upscale(img, a)
        # premultiplied edges look cleaner after resampling in WebGL: store straight alpha, colour bled outward
        rgba = np.dstack([up, (au * 255).astype(np.uint8)])
        cv2.imwrite(os.path.join(OUT, name + ".png"), rgba, [cv2.IMWRITE_PNG_COMPRESSION, 6])
    cv2.imwrite(os.path.join(OUT, "girl_closed.png"), upscale(crop, box=(fx0, fy0, fx1, fy1)))
    cv2.imwrite(os.path.join(OUT, "lines.png"), cv2.resize(lines, None, fx=UP, fy=UP, interpolation=cv2.INTER_CUBIC))
    # preview
    mag = np.zeros_like(img); mag[:] = (180, 0, 200)
    pv = []
    for a in (a_guard, a_girl):
        pv.append((img * a[..., None] + mag * (1 - a[..., None])).astype(np.uint8))
    pv.append(bg)
    sheet = np.concatenate(pv, 1)
    cv2.imwrite(os.path.join(OUT, "masks_preview.jpg"), cv2.resize(sheet, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])
    # region maps (1x, soft)
    for who, chans in REGIONS.items():
        rm = np.zeros((H, W, 4), np.float32)
        idx = {"R": 2, "G": 1, "B": 0, "A": 3}            # OpenCV writes BGRA
        for ch, pts in chans.items():
            m = poly_mask(pts, img.shape).astype(np.float32) / 255
            m = cv2.GaussianBlur(m, (0, 0), 9 if not (who == "guardian" and ch == "A") else 40)
            rm[..., idx[ch]] = m
        if "A" not in chans:
            rm[..., 3] = 1.0
        cv2.imwrite(os.path.join(OUT, f"regions_{who}.png"), np.clip(rm * 255, 0, 255).astype(np.uint8))
    LANDMARKS["regions"] = {"girl": {"R": "head", "G": "ponytail", "B": "torso"}, "guardian": {"R": "hood", "G": "raised hand", "B": "low hand", "A": "torso"}}
    LANDMARKS["files"] = {"scale": UP, "full": "full.jpg", "bg": "bg.jpg", "guardian": "guardian.png", "girl": "girl.png",
                          "girl_closed": "girl_closed.png", "lines": "lines.png", "regions_girl": "regions_girl.png", "regions_guardian": "regions_guardian.png"}
    json.dump(LANDMARKS, open(os.path.join(OUT, "landmarks.json"), "w"), indent=1)
    print("plate written to", OUT)


if __name__ == "__main__":
    main()

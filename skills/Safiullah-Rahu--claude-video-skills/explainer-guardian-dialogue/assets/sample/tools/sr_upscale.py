"""Learned 2x upscale of the key art for the plate (Real-ESRGAN x4plus_anime_6B, then an area resize 4x -> 2x).

The plate builder (plate_build.py) uses the result instead of its lanczos 2x when assets/ref/keyart_sr2x.png exists.
Run once per key art, CPU only, in any venv with torch + numpy + Pillow (tts-bench/venvs/chatterbox works):

  python -I tools/sr_upscale.py <weights.pth> [in.png] [out.png]

weights: RealESRGAN_x4plus_anime_6B.pth (17.9 MB, BSD-3-Clause, github.com/xinntao/Real-ESRGAN release v0.2.2.4),
loaded with weights_only=True. The network is the RRDBNet from that repo (6 RRDB blocks, 64 features, 32 growth).
RRDBNet architecture after Real-ESRGAN / BasicSR, (c) Xintao Wang et al., BSD-3-Clause.
"""
import os
import sys
import time

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class RDB(nn.Module):
    def __init__(self, nf=64, gc=32):
        super().__init__()
        self.conv1 = nn.Conv2d(nf, gc, 3, 1, 1)
        self.conv2 = nn.Conv2d(nf + gc, gc, 3, 1, 1)
        self.conv3 = nn.Conv2d(nf + 2 * gc, gc, 3, 1, 1)
        self.conv4 = nn.Conv2d(nf + 3 * gc, gc, 3, 1, 1)
        self.conv5 = nn.Conv2d(nf + 4 * gc, nf, 3, 1, 1)
        self.lrelu = nn.LeakyReLU(0.2, True)

    def forward(self, x):
        x1 = self.lrelu(self.conv1(x))
        x2 = self.lrelu(self.conv2(torch.cat((x, x1), 1)))
        x3 = self.lrelu(self.conv3(torch.cat((x, x1, x2), 1)))
        x4 = self.lrelu(self.conv4(torch.cat((x, x1, x2, x3), 1)))
        x5 = self.conv5(torch.cat((x, x1, x2, x3, x4), 1))
        return x5 * 0.2 + x


class RRDB(nn.Module):
    def __init__(self, nf, gc):
        super().__init__()
        self.rdb1, self.rdb2, self.rdb3 = RDB(nf, gc), RDB(nf, gc), RDB(nf, gc)

    def forward(self, x):
        return self.rdb3(self.rdb2(self.rdb1(x))) * 0.2 + x


class RRDBNet(nn.Module):
    def __init__(self, nb=6, nf=64, gc=32):
        super().__init__()
        self.conv_first = nn.Conv2d(3, nf, 3, 1, 1)
        self.body = nn.Sequential(*[RRDB(nf, gc) for _ in range(nb)])
        self.conv_body = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_up1 = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_up2 = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_hr = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_last = nn.Conv2d(nf, 3, 3, 1, 1)
        self.lrelu = nn.LeakyReLU(0.2, True)

    def forward(self, x):
        feat = self.conv_first(x)
        feat = feat + self.conv_body(self.body(feat))
        feat = self.lrelu(self.conv_up1(F.interpolate(feat, scale_factor=2, mode="nearest")))
        feat = self.lrelu(self.conv_up2(F.interpolate(feat, scale_factor=2, mode="nearest")))
        return self.conv_last(self.lrelu(self.conv_hr(feat)))


def upscale4(net, img, tile=192, pad=16):
    """img float32 HxWx3 in 0..1 -> 4x, tiled with overlap so the seams fall inside discarded padding"""
    H, W = img.shape[:2]
    x = torch.from_numpy(img.transpose(2, 0, 1))[None]
    out = torch.zeros(1, 3, H * 4, W * 4)
    for y0 in range(0, H, tile):
        for x0 in range(0, W, tile):
            y1, x1 = min(y0 + tile, H), min(x0 + tile, W)
            ya, xa = max(y0 - pad, 0), max(x0 - pad, 0)
            yb, xb = min(y1 + pad, H), min(x1 + pad, W)
            with torch.inference_mode():
                o = net(x[:, :, ya:yb, xa:xb])
            out[:, :, y0 * 4:y1 * 4, x0 * 4:x1 * 4] = o[:, :, (y0 - ya) * 4:(y0 - ya + y1 - y0) * 4,
                                                        (x0 - xa) * 4:(x0 - xa + x1 - x0) * 4]
    return out[0].clamp(0, 1).numpy().transpose(1, 2, 0)


def main():
    weights = sys.argv[1]
    src = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "assets", "ref", "keyart.png")
    dst = sys.argv[3] if len(sys.argv) > 3 else os.path.join(ROOT, "assets", "ref", "keyart_sr2x.png")
    torch.set_num_threads(int(os.environ.get("TORCH_THREADS", "16")))
    sd = torch.load(weights, map_location="cpu", weights_only=True)
    sd = sd.get("params_ema", sd.get("params", sd))
    net = RRDBNet()
    net.load_state_dict(sd, strict=True)
    net.eval()
    im = Image.open(src).convert("RGB")
    t = time.time()
    up4 = upscale4(net, np.asarray(im, np.float32) / 255.0)
    print(f"4x {up4.shape[1]}x{up4.shape[0]} in {time.time() - t:.0f} s")
    up4 = Image.fromarray((up4 * 255 + 0.5).astype(np.uint8))
    up4.resize((im.width * 2, im.height * 2), Image.Resampling.BOX).save(dst)  # 4x -> 2x: a plain 2x2 average
    print("wrote", dst)


if __name__ == "__main__":
    main()

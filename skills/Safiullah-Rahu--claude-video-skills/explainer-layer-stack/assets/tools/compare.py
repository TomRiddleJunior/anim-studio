"""Side-by-side proof sheet: matched beats, source frame left, ours right, same scale, timestamps printed.

usage: python -I compare.py <source.mp4> <ours.mp4> <out.jpg> "srcT:ourT:label" ["srcT:ourT:label" ...]
       (10-12 pairs; 3 pairs per row; ffmpeg from $FFMPEG_PATH or PATH)
"""
import io, os, shutil, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

FF = os.environ.get("FFMPEG_PATH") or shutil.which("ffmpeg") or "ffmpeg"
W, H = 405, 720


def grab(path, t):
    png = subprocess.run([FF, '-v', 'error', '-ss', f'{t:.3f}', '-i', path, '-frames:v', '1', '-vf', f'scale={W}:{H}:flags=lanczos',
                          '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True).stdout
    return Image.open(io.BytesIO(png)).convert('RGB')


def main():
    src, ours, out = sys.argv[1], sys.argv[2], sys.argv[3]
    pairs = [a.split(':', 2) for a in sys.argv[4:]]
    cols = 3
    rows = (len(pairs) + cols - 1) // cols
    gap, head = 18, 34
    S = Image.new('RGB', (cols * (2 * W + gap) + gap, rows * (H + head + gap) + gap), (40, 40, 44))
    d = ImageDraw.Draw(S)
    font_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..', 'engine', 'fonts', 'RobotoMono_wght_.ttf')
    try:
        f = ImageFont.truetype(font_path, 17)
    except Exception:
        f = ImageFont.load_default()
    for k, (ts, to, lab) in enumerate(pairs):
        c, r = k % cols, k // cols
        x, y = gap + c * (2 * W + gap), gap + r * (H + head + gap)
        S.paste(grab(src, float(ts)), (x, y + head))
        S.paste(grab(ours, float(to)), (x + W, y + head))
        d.rectangle([x, y, x + 2 * W - 1, y + head - 2], fill=(28, 28, 32))
        d.text((x + 8, y + 8), f'SOURCE {float(ts):6.2f}s', font=f, fill=(255, 200, 120))
        d.text((x + W + 8, y + 8), f'OURS {float(to):6.2f}s', font=f, fill=(140, 220, 255))
        d.text((x + 2 * W - 8 - d.textlength(lab, font=f), y + 8), lab, font=f, fill=(220, 220, 220))
    S.save(out, quality=88)
    print(out, S.size)


if __name__ == '__main__':
    main()

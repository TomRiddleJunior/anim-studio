"""Build-event pacing for white-canvas diagram reels (the colour-histogram scene-change metric is blind to them).

usage: python -I events.py <video.mp4> [out.json] [threshold=5]
Samples the video at 10 fps on a 360x640 grey frame (any 9:16 size), measures the mean |diff| inside the diagram
region (x 150..720, y 150..930 in 720x1280 terms: right of the presenter, above the captions) and counts local
peaks above the threshold at least 0.3 s apart = build events. Also reports chapter-tag changes and presenter motion.
Source reference (DfCi2s4zNno): 87.4 events/min at threshold 5, 105.6 at 1.5.
"""
import json, os, shutil, subprocess, sys
import numpy as np

FF = os.environ.get("FFMPEG_PATH") or shutil.which("ffmpeg") or "ffmpeg"
SRC = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else None
THR = float(sys.argv[3]) if len(sys.argv) > 3 else 5.0
FPS, W, H = 10, 360, 640
raw = subprocess.run([FF, '-hide_banner', '-loglevel', 'error', '-i', SRC, '-vf', f'fps={FPS},scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
                     capture_output=True, check=True).stdout
n = len(raw) // (W * H)
fr = np.frombuffer(raw[:n * W * H], np.uint8).reshape(n, H, W).astype(np.int16)
s = W / 720


def reg(x0, y0, x1, y1):
    return fr[:, int(y0 * s):int(y1 * s), int(x0 * s):int(x1 * s)]


def diffs(a):
    return np.concatenate([[0], np.abs(np.diff(a, axis=0)).mean(axis=(1, 2))])


dt, dd, dp = diffs(reg(80, 80, 420, 108)), diffs(reg(150, 150, 720, 930)), diffs(reg(0, 380, 175, 880))
ev = []
for i in range(1, n - 1):
    if dd[i] > THR and dd[i] >= dd[i - 1] and dd[i] >= dd[i + 1]:
        if ev and i / FPS - ev[-1][0] < 0.3:
            continue
        ev.append((i / FPS, float(dd[i])))
dur = n / FPS
ch = [i / FPS for i in range(1, n) if dt[i] > 2.0 and dt[i] == max(dt[max(0, i - 5):i + 6])]
print(f'duration {dur:.1f} s · build events > {THR}: {len(ev)} = {len(ev) / dur * 60:.1f} / min · diagram motion mean {dd.mean():.2f}')
print(f'chapter-tag changes {len(ch)} · presenter motion mean {dp.mean():.3f}')
if OUT:
    json.dump({'events': ev, 'chapters': ch, 'dur': dur}, open(OUT, 'w'))

"""Nudge a take's tempo by a small ratio with ffmpeg atempo (WSOLA, pitch kept): only for |change| <= ~5%.
  python tools/nudge.py <in.flac> <from_bpm> <to_bpm> <out.wav>
"""
import subprocess, sys
FF = r"ffmpeg-bin\node_modules\ffmpeg-static\ffmpeg.exe"
src, b0, b1, dst = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
r = b1 / b0
if abs(r - 1) > 0.06:
    raise SystemExit(f"ratio {r:.3f} is too large for a transparent nudge; regenerate instead")
subprocess.run([FF, "-y", "-v", "error", "-i", src, "-af", f"atempo={r:.5f}", "-ar", "48000", dst], check=True)
print(f"{src} {b0:.2f} -> {b1:.2f} BPM (x{r:.4f}) -> {dst}")

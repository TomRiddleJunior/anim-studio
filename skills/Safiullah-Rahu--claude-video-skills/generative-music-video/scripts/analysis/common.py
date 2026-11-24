# Adapted from mexicat/pdoom-video (MIT); see LICENSE-pdoom-video.
"""Shared paths, caches and I/O for the analysis scripts.

Every script takes `--project <dir>` (the video project root: song.json, audio/, lyrics/, data/).
Import this module FIRST (before torch / whisper / librosa) so model downloads land in the shared cache
(GMV_HOME/cache), not in each project.

Project layout used here:
  <project>/song.json                  audio path, lyrics path, language
  <project>/lyrics/lyrics.txt          one sung line per line; [Section] tags; blank lines between blocks
                                       (LRC "[mm:ss.xx] text" lines are accepted too and give line windows)
  <project>/lyrics/pron.json           optional {"TOKEN": "spoken spelling"} for acronyms / odd words
  <project>/lyrics/fixes.json          optional manual timing fixes {"<line>:<word>": {"start": s, "end": e}}
  <project>/analysis/work/             mix.wav (the time reference), vocal features, emissions, whisper json
  <project>/analysis/stems/            vocals.wav drums.wav bass.wav other.wav (Demucs)
  <project>/analysis/qa/               plots and reports to LOOK at
  <project>/data/                      lyrics.json, audio.json (what the renderer reads)
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

os.environ.setdefault("PYTHONUTF8", "1")
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")
try:  # Windows consoles: never die on a non-ASCII lyric
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
except Exception:
    pass


def gmv_home() -> Path:
    """Shared home for the analysis venv and model caches (NOT per project: torch + models are ~6 GB).
    Windows: ~/.generative-music-video (not %LOCALAPPDATA%, which packaged apps such as the Claude desktop
    app silently redirect into their own sandbox). Elsewhere: ~/.cache/generative-music-video."""
    if os.environ.get("GMV_HOME"):
        return Path(os.environ["GMV_HOME"])
    if sys.platform == "win32":
        return Path.home() / ".generative-music-video"
    return Path.home() / ".cache" / "generative-music-video"


CACHE = gmv_home() / "cache"
for var, sub in [("TORCH_HOME", "torch"), ("HF_HOME", "hf"), ("HF_HUB_CACHE", "hf/hub"), ("XDG_CACHE_HOME", "xdg"),
                 ("MPLCONFIGDIR", "mpl"), ("NUMBA_CACHE_DIR", "numba")]:
    os.environ.setdefault(var, str(CACHE / sub))
    (CACHE / sub).mkdir(parents=True, exist_ok=True)
WHISPER_CACHE = CACHE / "whisper"


class Project:
    def __init__(self, root: str | os.PathLike):
        self.root = Path(root).resolve()
        if not (self.root / "song.json").exists():
            raise SystemExit(f"not a video project (no song.json): {self.root}")
        self.song = json.loads((self.root / "song.json").read_text(encoding="utf-8"))
        self.audio = (self.root / self.song.get("audio", "audio/song.mp3")).resolve()
        self.lyrics_src = (self.root / self.song.get("lyrics", "lyrics/lyrics.txt")).resolve()
        self.language = self.song.get("language", "en")
        self.work = self.root / "analysis" / "work"
        self.stems = self.root / "analysis" / "stems"
        self.qa = self.root / "analysis" / "qa"
        self.data = self.root / "data"
        for d in (self.work, self.stems, self.qa, self.data):
            d.mkdir(parents=True, exist_ok=True)
        self.mix_wav = self.work / "mix.wav"

    # ---------------------------------------------------------------- audio
    def ensure_mix(self, sr: int = 44100) -> Path:
        """Decode the song once to analysis/work/mix.wav (44.1 kHz stereo float). This decode is THE time
        reference for everything (stems, beats, lyrics); ffmpeg honours the mp3 encoder-delay (gapless) info,
        as browsers do, so the data lines up with what the renderer plays."""
        if self.mix_wav.exists() and self.mix_wav.stat().st_mtime >= self.audio.stat().st_mtime:
            return self.mix_wav
        if not self.audio.exists():
            raise SystemExit(f"audio not found: {self.audio} (song.json 'audio')")
        ff = find_ffmpeg(self.root)
        if ff:
            run([ff, "-y", "-loglevel", "error", "-i", str(self.audio), "-vn", "-ac", "2", "-ar", str(sr), "-c:a", "pcm_f32le", str(self.mix_wav)])
        else:
            import soundfile as sf
            import librosa
            y, _ = librosa.load(str(self.audio), sr=sr, mono=False)
            sf.write(str(self.mix_wav), (y if y.ndim == 2 else y[None]).T, sr, subtype="FLOAT")
        return self.mix_wav

    def load_mix(self, sr: int | None = None, mono: bool = True):
        import soundfile as sf
        y, s = sf.read(str(self.ensure_mix()), dtype="float32", always_2d=True)
        y = y.mean(axis=1) if mono else y.T
        return resample(y, s, sr, mono), (sr or s)

    def has_stems(self) -> bool:
        return all((self.stems / f"{n}.wav").exists() for n in ("vocals", "drums", "bass", "other"))

    def load_stem(self, name: str, sr: int | None = None, mono: bool = True):
        """A Demucs stem in the mix.wav timeline. Falls back to HPSS / the mix when stems are missing."""
        import soundfile as sf
        p = self.stems / f"{name}.wav"
        if not p.exists():
            return self._fallback_stem(name, sr, mono)
        y, s = sf.read(str(p), dtype="float32", always_2d=True)
        off = self.stem_offset()
        if off > 0:
            y = y[off:]
        elif off < 0:
            import numpy as np
            y = np.concatenate([np.zeros((-off, y.shape[1]), y.dtype), y])
        y = y.mean(axis=1) if mono else y.T
        return resample(y, s, sr, mono), (sr or s)

    def _fallback_stem(self, name, sr, mono):
        import librosa
        import numpy as np
        y, s = self.load_mix(None, mono=True)
        cache = self.work / "hpss.npz"
        if cache.exists():
            z = np.load(cache)
            h, p = z["h"], z["p"]
        else:
            h, p = librosa.effects.hpss(y, margin=2.0)
            np.savez_compressed(cache, h=h, p=p)
        pick = {"drums": p, "vocals": h, "other": h, "bass": h}.get(name, y)
        if not mono:
            pick = np.stack([pick, pick])
        return resample(pick, s, sr, mono), (sr or s)

    def stem_offset(self) -> int:
        f = self.work / "stem_offset.json"
        if f.exists():
            return int(json.loads(f.read_text(encoding="utf-8")).get("samples", 0))
        return 0

    # ---------------------------------------------------------------- lyrics
    def lyrics_lines(self):
        """Parse the lyrics source -> list of dict(text, section, t0, t1) (t0/t1 from LRC stamps or None)."""
        if not self.lyrics_src.exists():
            return []
        return parse_lyrics(self.lyrics_src.read_text(encoding="utf-8"))

    def pron_overrides(self) -> dict:
        p = self.lyrics_src.parent / "pron.json"
        return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}

    def fixes(self) -> dict:
        p = self.lyrics_src.parent / "fixes.json"
        return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}


LRC = re.compile(r"^\s*\[(\d{1,2}):(\d{1,2}(?:[.:]\d{1,3})?)\]\s*(.*)$")
TAG = re.compile(r"^\s*[\[{(]\s*([A-Za-z][\w \-#'&/]*?)\s*(?:\d+)?\s*[\]})]\s*:?\s*$")
REPEAT = re.compile(r"\(?\s*[x×]\s*\d+\s*\)?\s*$", re.I)


def parse_lyrics(src: str):
    """Plain text (one sung line per line), with optional [Section] tags, blank lines between blocks, and
    optional LRC time stamps. Returns [{text, section, t0, t1}] in sung order. Lines like '(x2)' repeat
    markers are rejected loudly: every sung line must be written out in order."""
    out, section, stamps = [], None, []
    for raw in src.splitlines():
        line = raw.strip().replace(" ", " ")
        if not line or line.startswith("#"):
            continue
        m = LRC.match(line)
        t0 = None
        if m:
            t0 = int(m.group(1)) * 60 + float(m.group(2).replace(":", "."))
            line = m.group(3).strip()
            if not line:
                stamps.append(t0)
                continue
        tg = TAG.match(line)
        if tg and len(line) < 40:
            section = re.sub(r"\s+", " ", tg.group(1)).strip().lower()
            continue
        if REPEAT.search(line) and len(REPEAT.sub("", line).strip()) < len(line):
            raise SystemExit(f"repeat marker in lyrics ({line!r}): write every sung line out in order instead")
        line = re.sub(r"\s+", " ", line)
        out.append(dict(text=line, section=section, t0=t0, t1=None))
    for i, l in enumerate(out):  # LRC: a line ends where the next one starts
        if l["t0"] is not None:
            nxt = next((x["t0"] for x in out[i + 1:] if x["t0"] is not None), None)
            l["t1"] = nxt
    return out


# ---------------------------------------------------------------- tools
def resample(y, s, sr, mono=True):
    if not sr or sr == s:
        return y
    import librosa
    import numpy as np
    if mono:
        return librosa.resample(y, orig_sr=s, target_sr=sr, res_type="soxr_hq")
    return np.stack([librosa.resample(c, orig_sr=s, target_sr=sr, res_type="soxr_hq") for c in y])


def find_ffmpeg(root: Path | None = None) -> str | None:
    cands = [os.environ.get("FFMPEG_PATH")]
    if root:
        for n in ("ffmpeg.exe", "ffmpeg"):
            cands.append(str(root / "app" / "node_modules" / "ffmpeg-static" / n))
    cands.append(shutil.which("ffmpeg"))
    for c in cands:
        if c and Path(c).exists():
            return c
    return None


def run(cmd: list[str]):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        raise SystemExit(f"command failed: {' '.join(cmd)}\n{r.stderr}")
    return r.stdout


def device():
    import torch
    if torch.cuda.is_available():
        return "cuda"
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def write_json(path: Path, obj, compact=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    txt = json.dumps(obj, ensure_ascii=False, separators=(",", ":")) if compact else json.dumps(obj, ensure_ascii=False, indent=2)
    path.write_text(txt, encoding="utf-8")


def read_json(path: Path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def project_arg(desc: str) -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(description=desc)
    ap.add_argument("--project", "-p", default=".", help="video project root (has song.json)")
    return ap

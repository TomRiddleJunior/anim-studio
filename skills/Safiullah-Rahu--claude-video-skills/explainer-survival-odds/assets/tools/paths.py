"""Where the shared pieces live, without hard-coded local paths. Every tool imports this.
  EXPLAINER_STYLES  the explainer-styles folder (engine/, tools/with_render_lock.sh); default: two levels above the
                    project (projects live in explainer-styles/samples/<name>)
  FFMPEG, FFPROBE   the binaries; default: the engine's ffmpeg-static, ffprobe-static beside explainer-styles, or PATH
  RENDER_LOCK       the shared lock wrapper; default: $EXPLAINER_STYLES/tools/with_render_lock.sh
"""
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ES = os.environ.get("EXPLAINER_STYLES") or os.path.dirname(os.path.dirname(ROOT))
EXE = ".exe" if os.name == "nt" else ""


def _first(*cands):
    for c in cands:
        if c and os.path.exists(c):
            return c
    return None


def ffmpeg():
    return os.environ.get("FFMPEG") or _first(os.path.join(ES, "engine", "node_modules", "ffmpeg-static", "ffmpeg" + EXE)) or shutil.which("ffmpeg") or "ffmpeg"


def ffprobe():
    return (os.environ.get("FFPROBE") or _first(os.path.join(os.path.dirname(ES), "ffmpeg-bin", "node_modules", "ffprobe-static", "bin", "win32", "x64", "ffprobe" + EXE))
            or shutil.which("ffprobe") or "ffprobe")


def lock():
    return (os.environ.get("RENDER_LOCK") or os.path.join(ES, "tools", "with_render_lock.sh")).replace("\\", "/")


def bin_path():
    """the folders of ffmpeg and ffprobe, for PATH (HyperFrames looks them up there)"""
    return os.pathsep.join(d for d in {os.path.dirname(ffmpeg()), os.path.dirname(ffprobe())} if d)

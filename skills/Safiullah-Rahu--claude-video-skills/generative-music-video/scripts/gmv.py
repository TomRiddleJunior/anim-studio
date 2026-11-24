#!/usr/bin/env python3
"""gmv — generative music video toolkit (skill: generative-music-video). Stdlib only; any Python >= 3.9.

  gmv.py doctor                              check node / browser / ffmpeg / GPU / the analysis env
  gmv.py setup [--cuda cu126|cu128|cpu]      create the shared analysis venv (torch, demucs, whisper, librosa)
  gmv.py new <dir> --audio song.mp3 [--lyrics lyrics.txt|.lrc] [--title T] [--artist A] [--style engraved]
  gmv.py analyze <dir> [--plots] [--no-whisper] [--from STEP] [--bpm N] [--meter 3] [--downbeat T]
  gmv.py plan <dir> [--force]                write a first-cut app/src/timeline.ts from sections + lyric lines
  gmv.py style <dir> <preset> | --list       apply a style preset (palette, post, type, fonts)
  gmv.py fonts <dir> --role display --family "Anybody" [--weights 300,700,900] [--widths 62.5,100,125] [--italic]
  gmv.py status <dir>                        what exists, what to run next

The analysis venv and model caches are shared by all projects: GMV_HOME (default ~/.generative-music-video on
Windows, ~/.cache/generative-music-video elsewhere).
"""
from __future__ import annotations

import argparse
import json
import os
import platform
import re
import shutil
import subprocess
import sys
import urllib.parse
import urllib.request
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
TEMPLATE = SKILL / "assets" / "template"
STYLES = SKILL / "assets" / "styles"
ANALYSIS = SKILL / "scripts" / "analysis"
WIN = sys.platform == "win32"

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
except Exception:
    pass


def home() -> Path:
    if os.environ.get("GMV_HOME"):
        return Path(os.environ["GMV_HOME"])
    return Path.home() / (".generative-music-video" if WIN else ".cache/generative-music-video")


def venv_python() -> Path:
    v = home() / "venv"
    return v / ("Scripts/python.exe" if WIN else "bin/python")


def sh(cmd, cwd=None, check=True, env=None, capture=False):
    if not capture:
        print("$", " ".join(str(c) for c in cmd), flush=True)
    r = subprocess.run([str(c) for c in cmd], cwd=cwd, env=env, text=True, encoding="utf-8", errors="replace",
                       capture_output=capture, shell=False)
    if check and r.returncode != 0:
        if capture:
            print(r.stdout, r.stderr)
        raise SystemExit(f"failed ({r.returncode}): {' '.join(str(c) for c in cmd)}")
    return r


def which(*names):
    for n in names:
        p = shutil.which(n)
        if p:
            return p
    return None


def read_json(p: Path):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def write_json(p: Path, obj):
    Path(p).write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


# ============================================================================ doctor
BROWSERS = {
    "win32": [r"C:\Program Files\Google\Chrome\Application\chrome.exe", r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
              os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
              r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe", r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"],
    "darwin": ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"],
    "linux": ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge"],
}


def cmd_doctor(a):
    ok = True

    def line(good, what, detail="", fix=""):
        nonlocal ok
        ok &= bool(good) or what.startswith("(optional)")
        print(f"  {'OK ' if good else '-- '} {what}{': ' + detail if detail else ''}{'' if good or not fix else '   -> ' + fix}")

    print("generative-music-video doctor")
    node = which("node")
    nv = sh([node, "--version"], capture=True, check=False).stdout.strip() if node else ""
    line(node and int(re.sub(r"\D", "", nv.split(".")[0]) or 0) >= 20, "node >= 20", nv or "missing", "install Node.js 20+ (nodejs.org)")
    line(which("npm", "npm.cmd"), "npm")
    plat = "win32" if WIN else ("darwin" if sys.platform == "darwin" else "linux")
    br = os.environ.get("MV_BROWSER_PATH") or next((b for b in BROWSERS[plat] if Path(b).exists()), None)
    line(br, "Chrome / Edge for headless rendering", br or "none found", "install Google Chrome, or set MV_BROWSER_PATH")
    ff = os.environ.get("FFMPEG_PATH") or which("ffmpeg")
    line(True, "(optional) ffmpeg on PATH", ff or "not on PATH — fine: each project's `npm install` brings ffmpeg-static")
    smi = which("nvidia-smi")
    gpu = sh([smi, "--query-gpu=name,memory.total,driver_version", "--format=csv,noheader"], capture=True, check=False).stdout.strip() if smi else ""
    line(True, "(optional) NVIDIA GPU", gpu or ("Apple silicon (MPS)" if sys.platform == "darwin" else "none: analysis runs on CPU (slower)"))
    line(which("uv"), "(optional) uv", "", "pip install uv (faster, reproducible setup)")
    py = venv_python()
    if py.exists():
        r = sh([py, "-c", "import torch, torchaudio, demucs, librosa, whisper, numba; print(torch.__version__, 'cuda' if torch.cuda.is_available() else ('mps' if torch.backends.mps.is_available() else 'cpu'))"], capture=True, check=False)
        line(r.returncode == 0, "analysis venv", f"{py}  [{r.stdout.strip() or r.stderr.strip()[-200:]}]", "python gmv.py setup")
    else:
        line(False, "analysis venv", f"missing ({py})", "python gmv.py setup")
    print("ready" if ok else "fix the -- lines above")
    return 0 if ok else 1


# ============================================================================ setup
def cmd_setup(a):
    h = home()
    h.mkdir(parents=True, exist_ok=True)
    py = venv_python()
    uv = which("uv")
    smi = which("nvidia-smi")
    gpu = sh([smi, "--query-gpu=name", "--format=csv,noheader"], capture=True, check=False).stdout if smi else ""
    cuda = a.cuda or ("cu128" if re.search(r"RTX\s*50|B\d00|Blackwell", gpu) else "cu126" if gpu.strip() else ("default" if sys.platform == "darwin" else "cpu"))
    torch_v = a.torch or ("2.7.1" if cuda == "cu128" else "2.6.0")
    print(f"analysis venv: {h / 'venv'}   torch {torch_v} ({cuda})")
    if not py.exists():
        if uv:
            sh([uv, "venv", h / "venv", "--python", "3.12"])
        else:
            sh([sys.executable, "-m", "venv", h / "venv"])
            sh([py, "-m", "pip", "install", "-U", "pip"])
    pip = [uv, "pip", "install", "--python", py] if uv else [py, "-m", "pip", "install"]
    tv = torch_v if cuda in ("default",) else f"{torch_v}+{cuda}" if cuda != "cpu" or not WIN else torch_v
    if cuda == "default":
        sh(pip + [f"torch=={torch_v}", f"torchaudio=={torch_v}"])
    else:
        idx = f"https://download.pytorch.org/whl/{cuda}"
        extra = ["--index-strategy", "unsafe-best-match"] if uv else []
        pkgs = [f"torch=={tv}", f"torchaudio=={tv}"] if cuda != "cpu" else [f"torch=={torch_v}", f"torchaudio=={torch_v}"]
        sh(pip + pkgs + ["--index-url", idx, "--extra-index-url", "https://pypi.org/simple"] + extra)
    sh(pip + ["demucs", "librosa", "soundfile", "scipy", "numba", "matplotlib", "fonttools", "openai-whisper"])
    sh([py, "-c", "import torch, torchaudio, demucs, librosa, whisper; print('OK torch', torch.__version__, 'cuda', torch.cuda.is_available())"])


# ============================================================================ new
AUDIO_EXT = {".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg", ".opus"}


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "song"


def cmd_new(a):
    d = Path(a.dir).resolve()
    if d.exists() and any(d.iterdir()) and not a.force:
        raise SystemExit(f"{d} exists and is not empty (use --force to scaffold into it)")
    audio = Path(a.audio).resolve()
    if not audio.exists() or audio.suffix.lower() not in AUDIO_EXT:
        raise SystemExit(f"audio not found / unsupported: {audio}")
    shutil.copytree(TEMPLATE, d, dirs_exist_ok=True, ignore=shutil.ignore_patterns("node_modules", "out", "*.pyc"))
    (d / "audio").mkdir(exist_ok=True)
    dst = d / "audio" / f"{slug(audio.stem)}{audio.suffix.lower()}"
    shutil.copy2(audio, dst)
    song = read_json(d / "song.json")
    song.update(title=a.title or audio.stem, artist=a.artist or song.get("artist", ""), audio=f"audio/{dst.name}", language=a.language)
    (d / "lyrics").mkdir(exist_ok=True)
    if a.lyrics:
        src = Path(a.lyrics).resolve()
        shutil.copy2(src, d / "lyrics" / "lyrics.txt")
    write_json(d / "song.json", song)
    for sub in ("data", "out", "docs"):
        (d / sub).mkdir(exist_ok=True)
    (d / ".gitignore").write_text("app/node_modules/\nout/\nanalysis/stems/\nanalysis/work/\n", encoding="utf-8")
    print(f"scaffolded {d}")
    if a.style:
        cmd_style(argparse.Namespace(dir=str(d), preset=a.style, list=False, no_fonts=False))
    if not a.no_install:
        npm = which("npm.cmd", "npm") if WIN else which("npm")
        if not npm:
            print("npm not found: install Node.js 20+, then run `npm install` in", d / "app")
        else:
            sh([npm, "install", "--no-audit", "--no-fund"], cwd=d / "app")
    print("\nnext:" + ("" if a.lyrics else f"\n  put the lyrics in {d / 'lyrics' / 'lyrics.txt'} (one sung line per line, [Section] tags, every repeat written out)"))
    print(f"  python {Path(__file__).resolve()} analyze \"{d}\" --plots")


# ============================================================================ analyze
STEPS = ["separate", "feats", "emissions", "whisper", "align", "audio"]


def project_env(d: Path):
    env = dict(os.environ, PYTHONUTF8="1", PYTHONDONTWRITEBYTECODE="1", GMV_HOME=str(home()))
    for n in ("ffmpeg.exe", "ffmpeg"):
        p = d / "app" / "node_modules" / "ffmpeg-static" / n
        if p.exists() and not env.get("FFMPEG_PATH"):
            env["FFMPEG_PATH"] = str(p)
    return env


def cmd_analyze(a):
    d = Path(a.dir).resolve()
    song = read_json(d / "song.json")
    py = venv_python()
    if not py.exists():
        raise SystemExit("no analysis venv: run `gmv.py setup` first")
    env = project_env(d)
    lyr = d / song.get("lyrics", "lyrics/lyrics.txt")
    have_lyrics = lyr.exists() and any(l.strip() and not l.strip().startswith("#") for l in lyr.read_text(encoding="utf-8").splitlines())
    run = lambda script, *args: sh([py, ANALYSIS / script, "--project", d, *args], env=env)  # noqa: E731
    steps = STEPS[STEPS.index(a.from_step):] if a.from_step else STEPS
    if a.no_whisper and "whisper" in steps:
        steps.remove("whisper")
    if not have_lyrics:
        print("no lyrics: the song will be analysed as-is and Whisper drafts lyrics/lyrics.draft.txt (instrumental? that's fine too)")
    for st in steps:
        if st == "separate":
            run("separate.py", *(["--model", a.demucs] if a.demucs else []))
        elif st == "feats":
            run("vocal_feats.py")
        elif st == "emissions" and have_lyrics:
            run("ctc_emissions.py")
        elif st == "whisper":
            run("transcribe.py", *([] if have_lyrics else ["--draft"]))
        elif st == "align" and have_lyrics:
            run("align.py", *(["--plots"] if a.plots else []), *(["--margin", str(a.margin)] if a.margin else []))
        elif st == "audio":
            extra = []
            if a.bpm:
                extra += ["--bpm", str(a.bpm)]
            if a.meter:
                extra += ["--meter", str(a.meter)]
            if a.downbeat is not None:
                extra += ["--downbeat", str(a.downbeat)]
            if a.dynamic:
                extra += ["--dynamic"]
            run("analyze_audio.py", *extra, *(["--plots"] if a.plots else []))
    print("\nanalysis done. Look at:", d / "analysis" / "qa", "(align_report.md, audio_*.png, line_*.png)")
    if not have_lyrics:
        print(f"lyrics: correct {d / 'lyrics' / 'lyrics.draft.txt'} → save as lyrics.txt → gmv.py analyze \"{d}\" --from emissions")
    print(f"then: python {Path(__file__).resolve()} plan \"{d}\"")


# ============================================================================ plan
SCENE_FOR = {"intro": "title", "outro": "outro", "pre": "pressure", "post": "particles", "bridge": "particles",
             "break": "interlude", "drop": "interlude", "part": "interlude", "song": "lines"}
VERSE_CYCLE = ["lines", "wave", "writer", "tunnel"]


def fold(s):
    return s.lower().replace("\u2019", "'").replace("\u2018", "'").replace("\u201c", '"').replace("\u201d", '"')


def cmd_plan(a):
    d = Path(a.dir).resolve()
    tl = d / "app" / "src" / "timeline.ts"
    txt = tl.read_text(encoding="utf-8") if tl.exists() else ""
    if "generated by `gmv.py plan`" in txt and "// EDITED" in txt and not a.force:
        raise SystemExit("timeline.ts is marked // EDITED — use --force to overwrite")
    au = read_json(d / "data" / "audio.json")
    ly = read_json(d / "data" / "lyrics.json")["lines"] if (d / "data" / "lyrics.json").exists() else []
    beats, dur = au["beats"], au["duration"]
    scenes_dir = d / "app" / "src" / "scenes"
    have = {p.stem for p in scenes_dir.glob("*.ts")}

    def cut_time(ts):  # last beat at/before ts + 0.02 (TS: editTools.cut)
        c = [b for b in beats if b <= ts + 0.02]
        return c[-1] if c else 0.0

    def query(li):  # shortest leading-words query that identifies the line (+ nth)
        words = ly[li]["text"].split(" ")
        for n in range(min(4, len(words)), len(words) + 1):
            q = " ".join(words[:n])
            nth = sum(1 for l in ly[:li] if fold(q) in fold(l["text"]))
            if nth == 0 or n == len(words):
                return q, nth
        return ly[li]["text"], 0

    def cut_expr(li):
        q, nth = query(li)
        return f"cut({json.dumps(q, ensure_ascii=False)}{', ' + str(nth) if nth else ''})"

    bp = au.get("beat_period") or 60.0 / au["bpm"]
    bar_len = au.get("time_signature", 4) * bp
    secs = au["sections"]
    downbeats = au["downbeats"]

    def sec_index(t):
        for i, s in enumerate(secs):
            if s["start"] <= t < s["end"]:
                return i
        return len(secs) - 1

    # each line belongs to the section holding its start + 2 beats (a short pickup joins the next section)
    owner = [sec_index(min(l["start"] + 2 * bp, max(l["start"], l["end"] - 0.01))) for l in ly]

    def sung_across(t):  # is a line being sung across t? (a cut there would split it)
        return any(l["start"] < t - 0.05 and l["end"] > t + 0.05 for l in ly)

    entries = []  # [id, scene, start_expr, start_time, params, comment, lines]
    counts = {}
    for si, s in enumerate(secs):
        base = re.sub(r"\d+$", "", s["name"])
        lines_in = [i for i, o in enumerate(owner) if o == si]
        sec_expr = f"section({json.dumps(s['name'])})"
        if lines_in:
            tl0 = cut_time(ly[lines_in[0]]["start"])
            # the section's downbeat when it comes first (a chorus's pickup bar) and nothing is sung across it
            t0, expr = (s["start"], sec_expr) if s["start"] < tl0 and not sung_across(s["start"]) else (tl0, cut_expr(lines_in[0]))
        else:
            t0, expr = s["start"], sec_expr
            if sung_across(t0):  # instrumental after a held note: start on the first downbeat after it
                held_end = max(l["end"] for l in ly if l["start"] < t0)
                li_h = max((i for i, l in enumerate(ly) if l["start"] < t0), key=lambda i: ly[i]["end"])
                q, nth = query(li_h)
                t0 = next((db for db in downbeats if db >= held_end - 0.05), s["end"])
                expr = f"after({json.dumps(q, ensure_ascii=False)}{', ' + str(nth) if nth else ''})"
            if s["end"] - t0 < bar_len:  # too short to be its own plate: the previous one keeps going
                continue
        if not entries:
            t0, expr = 0.0, "0"
        counts[base] = counts.get(base, 0) + 1
        k = counts[base]
        if base == "chorus":
            scene, params = "slam", {"n": min(4, k)}
        elif base == "verse":
            scene, params = VERSE_CYCLE[(k - 1) % len(VERSE_CYCLE)], {}
        else:
            scene, params = SCENE_FOR.get(base, "lines"), {}
        if scene not in have:
            scene = "lines"
        preview = f"{s['name']} {s['start']:.1f}–{s['end']:.1f}s" + (f" · “{ly[lines_in[0]]['text'][:48]}”" if lines_in else " · instrumental")
        entries.append([s["name"], scene, expr, t0, params, preview, set(lines_in)])
        # long sections: split at the line nearest the middle, alternate the look
        if s["end"] - t0 > 16 * bar_len and len(lines_in) >= 4 and base not in ("intro", "outro"):
            mid = (t0 + s["end"]) / 2
            li = min(lines_in[1:], key=lambda i: abs(ly[i]["start"] - mid))
            alt = {"lines": "wave", "wave": "lines", "writer": "tunnel", "tunnel": "writer", "slam": "lines", "pressure": "lines", "particles": "lines"}.get(scene, "lines")
            alt = alt if alt in have else "lines"
            entries[-1][6] = {i for i in lines_in if i < li}
            entries.append([f"{s['name']}b", alt, cut_expr(li), cut_time(ly[li]["start"]), {}, f"{s['name']} (second half) · “{ly[li]['text'][:48]}”", {i for i in lines_in if i >= li}])
    # drop windows that collapsed (two cuts on the same beat); a lead-in shorter than 2 bars joins the first plate
    clean = []
    for e in entries:
        if clean and e[3] <= clean[-1][3] + 0.2:
            continue
        clean.append(e)
    if len(clean) > 1 and clean[1][3] < 2 * bar_len and clean[0][1] == "title":
        clean = clean[1:]
        clean[0][2], clean[0][3] = "0", 0.0
    if not ly and clean:
        # instrumental: a title card first, interludes cycling their variants, an end card last
        variants = ["rings", "flow", "bars"]
        for j, e in enumerate(clean):
            e[1], e[4] = "interlude", {"variant": variants[j % 3]}
        if "title" in have:
            clean[0][1], clean[0][4] = "title", {}
        if len(clean) > 1 and "outro" in have:
            clean[-1][1], clean[-1][4] = "outro", {}
    rows = []
    for i, (eid, scene, expr, t0, params, preview, _) in enumerate(clean):
        nxt = clean[i + 1][2] if i + 1 < len(clean) else "end"
        extra = f", {{ params: {json.dumps(params)} }}" if params else ""
        rows.append(f"    E({json.dumps(eid)}, {json.dumps(scene)}, {expr}, {nxt}{extra}), // {preview}")
    ts = f"""// The edit — generated by `gmv.py plan` from data/audio.json sections and data/lyrics.json lines.
// Every cut is anchored to a lyric line (cut: the beat at/before the line's first word) or to a section's
// downbeat, so it follows the data when the analysis is re-run. Edit freely (then add "// EDITED" on this line
// so `plan` won't overwrite it): swap scenes, split windows, add params / post / caption / maxSamples.
import type {{ TimelineEntry }} from './engine/engine';
import type {{ SceneClass }} from './engine/scene';
import type {{ Lyrics }} from './engine/lyrics';
import type {{ AudioData }} from './engine/audio';
import {{ editTools }} from './engine/edit';

// Scene modules are discovered lazily so a missing/broken scene never breaks the build.
const modules = import.meta.glob<{{ default: SceneClass }}>('./scenes/*.ts');
const scene = (name: string) => () => {{
  const m = modules[`./scenes/${{name}}.ts`];
  return m ? m() : Promise.reject(new Error(`scene module not found: scenes/${{name}}.ts`));
}};

export function makeTimeline(ly: Lyrics, au: AudioData): TimelineEntry[] {{
  const {{ E, cut, after, section }} = editTools(ly, au, scene);
  const end = au.duration;
  void cut; void after; void section;
  return [
{chr(10).join(rows)}
  ];
}}
"""
    tl.write_text(ts, encoding="utf-8")
    print(f"wrote {tl} ({len(rows)} entries)")
    for r in rows:
        print("  " + r.strip())


# ============================================================================ fonts / style
GF_META = "https://fonts.google.com/metadata/fonts"


def gf_meta():
    p = home() / "cache" / "gfonts-metadata.json"
    if not p.exists() or p.stat().st_size < 100000:
        p.parent.mkdir(parents=True, exist_ok=True)
        raw = urllib.request.urlopen(GF_META, timeout=60).read().decode("utf-8")
        p.write_text(raw[raw.index("{"):], encoding="utf-8")
    return {m["family"]: m for m in json.loads(p.read_text(encoding="utf-8"))["familyMetadataList"]}


def install_font_role(d: Path, role: str, family: str, weights=None, widths=None, italic=False, features=None, replace=True):
    meta = gf_meta().get(family)
    if not meta:
        raise SystemExit(f"Google Fonts has no family {family!r}")
    axes = {x["tag"]: (x["min"], x["max"]) for x in meta.get("axes", [])}
    styles = set(meta["fonts"].keys())
    have_w = sorted({int(re.sub(r"\D", "", k)) for k in styles})
    wts = sorted({min(have_w, key=lambda h: abs(h - w)) for w in (weights or [400, 700])})
    wds = [100.0]
    if "wdth" in axes and widths:
        lo, hi = axes["wdth"]
        wds = sorted({max(lo, min(hi, float(w))) for w in widths})
    itals = [0] + ([1] if italic and any(k.endswith("i") for k in styles) else [])
    fdir = d / "app" / "public" / "fonts"
    (fdir / role).mkdir(parents=True, exist_ok=True)
    man = read_json(fdir / "fonts.json") if (fdir / "fonts.json").exists() else {"faces": []}
    if replace:
        for f in [f for f in man["faces"] if f["role"] == role]:
            try:
                (fdir / f["file"]).unlink()
            except FileNotFoundError:
                pass
        man["faces"] = [f for f in man["faces"] if f["role"] != role]
    fam_q = family.replace(" ", "+")
    n = 0
    for it in itals:
        for wd in wds:
            for wt in wts:
                ax, val = [], []
                if 1 in itals or it:
                    ax.append("ital"); val.append(str(it))
                if "wdth" in axes and len(wds) > 1 or ("wdth" in axes and wd != 100.0):
                    ax.append("wdth"); val.append(f"{wd:g}")
                ax.append("wght"); val.append(str(wt))
                url = f"https://fonts.googleapis.com/css2?family={fam_q}:{','.join(ax)}@{','.join(val)}"
                try:
                    css = urllib.request.urlopen(url, timeout=30).read().decode("utf-8")
                except Exception as e:  # e.g. a weight that only exists upright
                    print(f"  skip {family} {ax}={val}: {e}")
                    continue
                m = re.search(r"url\((https://[^)]+\.ttf)\)", css)
                if not m:
                    print(f"  no ttf for {url}")
                    continue
                fn = f"{role}/{slug(family)}-w{wd:g}-{wt}{'i' if it else ''}.ttf"
                urllib.request.urlretrieve(m.group(1), fdir / fn)
                man["faces"].append(dict(role=role, file=fn, width=wd, weight=wt, italic=bool(it), **({"features": features} if features else {})))
                n += 1
    man.setdefault("families", {})[role] = family
    write_json(fdir / "fonts.json", man)
    lic = fdir / "LICENSES.txt"
    txt = lic.read_text(encoding="utf-8") if lic.exists() else ""
    if family not in txt:
        lic.write_text(txt + f"{family}: {meta.get('license', 'see fonts.google.com')} — https://fonts.google.com/specimen/{fam_q}\n", encoding="utf-8")
    print(f"  {role}: {family} — {n} static faces (weights {wts}, widths {wds}{', italic' if 1 in itals else ''})")
    return n


def cmd_fonts(a):
    d = Path(a.dir).resolve()
    install_font_role(d, a.role, a.family, [int(x) for x in a.weights.split(",")] if a.weights else None,
                      [float(x) for x in a.widths.split(",")] if a.widths else None, a.italic, a.features)
    st = read_json(d / "style.json")
    st.setdefault("fonts", {})[a.role] = a.family
    write_json(d / "style.json", st)


def cmd_style(a):
    if a.list or not a.preset:
        for p in sorted(STYLES.glob("*.json")):
            s = read_json(p)
            print(f"  {p.stem:14} {'dark ' if s.get('dark', True) else 'paper'}  {s.get('name', '')}: {s.get('description', '')[:110]}")
        return
    d = Path(a.dir).resolve()
    p = STYLES / f"{a.preset}.json"
    if not p.exists():
        raise SystemExit(f"no preset {a.preset} (gmv.py style --list)")
    pre = read_json(p)
    st = {k: pre[k] for k in ("name", "description", "palette", "post", "type", "motif", "scenes", "idiom") if k in pre}
    st["fonts"] = {r: (v["family"] if isinstance(v, dict) else v) for r, v in pre.get("fonts", {}).items()}
    write_json(d / "style.json", st)
    print(f"style.json <- {a.preset} ({pre.get('name')})")
    if not getattr(a, "no_fonts", False):
        for role, spec in pre.get("fonts", {}).items():
            if not isinstance(spec, dict) or role == "stroke":
                continue
            if spec.get("bundled"):
                continue
            install_font_role(d, role, spec["family"], spec.get("weights"), spec.get("widths"), spec.get("italic", False), spec.get("features"))


# ============================================================================ status
def cmd_status(a):
    d = Path(a.dir).resolve()
    song = read_json(d / "song.json")
    chk = [("audio", (d / song.get("audio", "")).exists()), ("lyrics/lyrics.txt", (d / song.get("lyrics", "lyrics/lyrics.txt")).exists()),
           ("app/node_modules", (d / "app" / "node_modules").exists()), ("analysis/stems", (d / "analysis" / "stems" / "vocals.wav").exists()),
           ("data/lyrics.json", (d / "data" / "lyrics.json").exists()), ("data/audio.json", (d / "data" / "audio.json").exists()),
           ("planned timeline", "generated by `gmv.py plan`" in (d / "app" / "src" / "timeline.ts").read_text(encoding="utf-8")),
           ("docs/TREATMENT.md", (d / "docs" / "TREATMENT.md").exists())]
    for k, v in chk:
        print(f"  {'OK ' if v else '-- '} {k}")
    st = read_json(d / "style.json")
    print(f"  style: {st.get('name')}  fonts: {st.get('fonts')}")
    me = Path(__file__).resolve()
    missing = [k for k, v in chk if not v]
    nxt = ("npm install (in app/)" if "app/node_modules" in missing else
           f"python {me} analyze \"{d}\" --plots" if "data/audio.json" in missing else
           f"python {me} plan \"{d}\"" if "planned timeline" in missing else
           "write docs/TREATMENT.md, then build plates (SKILL.md steps 4-7)" if "docs/TREATMENT.md" in missing else
           "iterate on plates; render: cd app && node scripts/render.mjs video --samples auto --shutter 0.2")
    print(f"  next: {nxt}")
    outs = sorted((d / "out").glob("*.mp4")) if (d / "out").exists() else []
    for o in outs:
        print(f"  render: {o.name} ({o.stat().st_size / 1e6:.1f} MB)")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    sp.add_parser("doctor").set_defaults(fn=cmd_doctor)
    s = sp.add_parser("setup"); s.add_argument("--cuda", choices=["cu118", "cu121", "cu124", "cu126", "cu128", "cpu", "default"]); s.add_argument("--torch"); s.set_defaults(fn=cmd_setup)
    s = sp.add_parser("new"); s.add_argument("dir"); s.add_argument("--audio", required=True); s.add_argument("--lyrics"); s.add_argument("--title"); s.add_argument("--artist")
    s.add_argument("--language", default="en"); s.add_argument("--style", default="engraved"); s.add_argument("--no-install", action="store_true"); s.add_argument("--force", action="store_true"); s.set_defaults(fn=cmd_new)
    s = sp.add_parser("analyze"); s.add_argument("dir"); s.add_argument("--plots", action="store_true"); s.add_argument("--no-whisper", action="store_true")
    s.add_argument("--from", dest="from_step", choices=STEPS); s.add_argument("--bpm", type=float); s.add_argument("--meter", type=int); s.add_argument("--downbeat", type=float)
    s.add_argument("--demucs", choices=["htdemucs_ft", "htdemucs"]); s.add_argument("--dynamic", action="store_true", help="non-constant tempo (live playing)")
    s.add_argument("--margin", type=float, help="aligner garbage margin (default 1.5; higher = lyric words win more easily)"); s.set_defaults(fn=cmd_analyze)
    s = sp.add_parser("plan"); s.add_argument("dir"); s.add_argument("--force", action="store_true"); s.set_defaults(fn=cmd_plan)
    s = sp.add_parser("style"); s.add_argument("dir", nargs="?"); s.add_argument("preset", nargs="?"); s.add_argument("--list", action="store_true"); s.add_argument("--no-fonts", action="store_true"); s.set_defaults(fn=cmd_style)
    s = sp.add_parser("fonts"); s.add_argument("dir"); s.add_argument("--role", required=True); s.add_argument("--family", required=True)
    s.add_argument("--weights"); s.add_argument("--widths"); s.add_argument("--italic", action="store_true"); s.add_argument("--features"); s.set_defaults(fn=cmd_fonts)
    s = sp.add_parser("status"); s.add_argument("dir"); s.set_defaults(fn=cmd_status)
    a = ap.parse_args()
    if a.cmd == "style" and a.list:
        return cmd_style(a)
    return a.fn(a)


if __name__ == "__main__":
    sys.exit(main())

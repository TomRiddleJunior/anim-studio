"""Show how Kokoro's G2P (misaki) will say words or lines, before recording. Respell until it's right.

  "$HOME/.generative-music-video/venv/Scripts/python.exe" -I engine/tools/phonemes.py "Diomede" "Lynne Cox" "[Diomede](/dˈIəmˌid/)"
  ... phonemes.py --say <slug> "[Diomede](/dˈIəmˌid/)"      also writes <slug>/vo/test/<n>.wav to listen to

Respelling syntax (misaki): [word](/phonemes/) in script.json's "respell" map, e.g.
  "respell": {"Diomede": "[Diomede](/dˈIəmˌid/)"}
American phoneme set: A=eɪ I=aɪ O=oʊ W=aʊ Y=ɔɪ, ʧ ʤ ŋ θ ð ʃ ʒ ɹ, vowels æ ɑ ə ɚ ɛ ɪ i u ʊ ʌ ɔ, stress ˈ ˌ.
"""
import os
import sys
from pathlib import Path

if (Path.home() / ".generative-music-video").exists():
    os.environ.setdefault("HF_HOME", str(Path.home() / ".generative-music-video" / "cache" / "hf"))
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")
import warnings  # noqa: E402

warnings.filterwarnings("ignore")
for s in (sys.stdout, sys.stderr):
    if hasattr(s, "reconfigure"):
        s.reconfigure(encoding="utf-8", errors="replace")


def main():
    args = sys.argv[1:]
    say = None
    if args and args[0] == "--say":
        say, args = args[1], args[2:]
    from kokoro import KPipeline
    pipe = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M", device="cpu")
    for i, text in enumerate(args):
        ps, _ = pipe.g2p(text)
        print(f"{text!r:42s} → {ps}")
        if say:
            import numpy as np
            import soundfile as sf
            out = Path(__file__).resolve().parents[2] / say / "vo" / "test"
            out.mkdir(parents=True, exist_ok=True)
            a = np.concatenate([r.audio.cpu().numpy() for r in pipe(text, voice="am_michael", speed=1.18)])
            sf.write(out / f"{i}.wav", a, 24000)


if __name__ == "__main__":
    main()

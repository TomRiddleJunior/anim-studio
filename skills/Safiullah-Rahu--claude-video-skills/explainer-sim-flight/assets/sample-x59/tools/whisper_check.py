"""Whisper `small` check of the narration: prints what Whisper hears per segment (catches Kokoro mispronunciations).

usage: ~/.generative-music-video/venv/Scripts/python.exe -I tools/whisper_check.py vo/audio/vo.wav
"""
import os
import sys
import warnings

warnings.filterwarnings("ignore")
os.environ["PATH"] = r"ffmpeg-bin\node_modules\ffmpeg-static" + os.pathsep + os.environ["PATH"]
import whisper  # noqa: E402

for s in (sys.stdout, sys.stderr):
    if hasattr(s, "reconfigure"):
        s.reconfigure(encoding="utf-8", errors="replace")
m = whisper.load_model("small", download_root=os.path.expanduser("~/.cache/whisper"))
r = m.transcribe(sys.argv[1], fp16=False, language="en", condition_on_previous_text=False)
for seg in r["segments"]:
    print(f"{seg['start']:6.2f} {seg['text'].strip()}")

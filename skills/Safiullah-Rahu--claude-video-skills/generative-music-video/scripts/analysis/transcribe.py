"""Whisper word timestamps of the vocal stem -> analysis/work/whisper.json

Two uses: (1) an independent cross-check for the CTC alignment (align.py uses it for confidence and lists
words Whisper did not hear — clusters of those usually mean wrong or missing lyric lines); (2) --draft writes
lyrics/lyrics.draft.txt from the transcription when you have no lyrics (check it by listening! Whisper
mishears sung words; copy it to lyrics.txt once corrected).

  python transcribe.py --project <dir> [--model turbo] [--draft] [--language en]
"""
import common
import sys

import numpy as np


def main():
    ap = common.project_arg(__doc__)
    ap.add_argument("--model", default="turbo", help="openai-whisper model: turbo (large-v3-turbo), large-v3, medium, small")
    ap.add_argument("--language", default=None, help="language code (default: song.json language; 'auto' to detect)")
    ap.add_argument("--draft", action="store_true", help="also write lyrics/lyrics.draft.txt from the transcription")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    P = common.Project(a.project)
    out = P.work / "whisper.json"
    if out.exists() and not a.force and not a.draft:
        print("exists:", out)
        return
    import whisper
    lang = a.language or P.language
    lang = None if lang in (None, "", "auto") else lang
    y, _ = P.load_stem("vocals", sr=16000)
    y = (y / (np.abs(y).max() + 1e-9)).astype(np.float32)
    model = whisper.load_model(a.model, device=common.device() if common.device() != "mps" else "cpu", download_root=str(common.WHISPER_CACHE))
    # a prompt made of the known lyrics' vocabulary helps with names and odd words
    prompt = None
    L = P.lyrics_lines()
    if L:
        vocab = sorted({w.strip(",.!?\"'“”‘’()") for l in L for w in l["text"].split() if len(w) > 3 and (w[:1].isupper() or any(c.isdigit() for c in w))})
        prompt = "Song lyrics. " + ", ".join(vocab[:60]) if vocab else None
    res = model.transcribe(y, language=lang, word_timestamps=True, condition_on_previous_text=False, initial_prompt=prompt,
                           temperature=(0.0, 0.2, 0.4), compression_ratio_threshold=2.2, hallucination_silence_threshold=2.0, no_speech_threshold=None, fp16=common.device() == "cuda")
    common.write_json(out, res, compact=True)
    for seg in res["segments"]:
        print(f"{seg['start']:7.2f} {seg['end']:7.2f} {seg['text'].strip()}")
    if a.draft:
        d = P.lyrics_src.parent / "lyrics.draft.txt"
        d.parent.mkdir(parents=True, exist_ok=True)
        d.write_text("# DRAFT from Whisper — sung words are often misheard. Correct it, write out every repeat,\n"
                     "# add [Verse]/[Chorus] tags, then save as lyrics.txt.\n"
                     + "\n".join(s["text"].strip() for s in res["segments"] if s["text"].strip()) + "\n", encoding="utf-8")
        print("wrote", d)


if __name__ == "__main__":
    sys.exit(main())

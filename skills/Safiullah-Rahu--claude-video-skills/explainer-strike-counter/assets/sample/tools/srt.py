"""out/<name>.srt: the on-screen caption cards (there is no narration). Times mirror assets/lib/film.js (T.c1..c4)."""
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = os.path.basename(ROOT)
CAPS = [(2.07, 6.38, "Not even a click."), (6.53, 9.86, "But inside, the rust was giving way."),
        (10.53, 11.88, "The 101st turn\ndidn't open it alone."), (12.03, 13.32, "The hundred before it\nwore the rust thin.")]


def ts(t):
    m, s = divmod(t, 60)
    return f"00:{int(m):02d}:{int(s):02d},{int(round((s % 1) * 1000)) % 1000:03d}"


os.makedirs(os.path.join(ROOT, "out"), exist_ok=True)
with open(os.path.join(ROOT, "out", NAME + ".srt"), "w", encoding="utf-8") as f:
    for i, (a, b, s) in enumerate(CAPS):
        f.write(f"{i + 1}\n{ts(a)} --> {ts(b)}\n{s}\n\n")
print("out/" + NAME + ".srt")

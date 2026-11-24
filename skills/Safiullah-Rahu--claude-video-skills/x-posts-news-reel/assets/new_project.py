"""Scaffold a new X-posts news reel project from this skill's template and tools.

usage: python -X utf8 -I new_project.py <project_dir> [--urls links.txt]

Creates <project_dir>/ with tools/ (capture, posts.json, build, sound, voice, QA, cover), edit.json, vo/script.json,
posts/review.json and urls.txt as starting points, the fonts and the grain texture. Then follow SKILL.md §2.
"""
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
a = sys.argv[1:]
if not a:
    raise SystemExit(__doc__)
dst = os.path.abspath(a[0])
if os.path.exists(dst) and os.listdir(dst):
    raise SystemExit(f"{dst} exists and is not empty")
shutil.copytree(os.path.join(HERE, "template"), dst, dirs_exist_ok=True)
shutil.copytree(os.path.join(HERE, "tools"), os.path.join(dst, "tools"), dirs_exist_ok=True)
for d in ("posts/raw", "scratch", "out", "score", "assets/posts", "assets/audio", "vo/tts"):
    os.makedirs(os.path.join(dst, d), exist_ok=True)
if "--urls" in a:
    shutil.copyfile(a[a.index("--urls") + 1], os.path.join(dst, "urls.txt"))
name = os.path.basename(dst)
open(os.path.join(dst, "meta.json"), "w").write(f'{{\n "id": "{name}",\n "name": "{name}",\n "createdAt": "2026-01-01T00:00:00.000Z"\n}}\n')
print("created", dst)
print("next: node tools/capture_posts.mjs urls.txt posts   (then read every post: SKILL.md §2 step 2)")

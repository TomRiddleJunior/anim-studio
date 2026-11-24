"""Copy this project into the skill: assets/template/ (runnable project: kit, shots, world, build + QA tools, look-dev
page, voice + mix so it renders as-is) and assets/sample/ (the same source plus the sample's docs, without the large
voice wav). Renders, scratch output and score stems are left out.

usage: python -I tools/export_skill.py
"""
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SK = os.path.join(os.path.expanduser("~"), ".claude", "skills", "explainer-money-news-3d", "assets")
COMMON = ["index.html", "hyperframes.json", "package.json", "meta.json", "compositions", "assets/lib", "assets/fonts",
          "assets/audio/final.m4a", "vo/script.json", "vo/data/vo.json", "score/sound.json", "score/data", "tools",
          "scratch/debug.html", "scratch/devserver.py", "scratch/sheet.py"]
TEMPLATE_EXTRA = ["vo/audio/vo.wav"]
SAMPLE_EXTRA = ["FACTS.md", "SCRIPT.md", "SAMPLE.md", "POST.md", "out/money-news.srt"]


def copy(rel, dst_root):
    src, dst = os.path.join(ROOT, rel), os.path.join(dst_root, rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if os.path.isdir(src):
        shutil.copytree(src, dst, dirs_exist_ok=True, ignore=shutil.ignore_patterns("__pycache__", "*.bak"))
    else:
        shutil.copy2(src, dst)


for name, extra in (("template", TEMPLATE_EXTRA), ("sample", SAMPLE_EXTRA)):
    d = os.path.join(SK, name)
    if os.path.exists(d):
        shutil.rmtree(d)
    for rel in COMMON + extra:
        copy(rel, d)
    n = sum(len(f) for _, _, f in os.walk(d))
    print(name, "->", d, n, "files")

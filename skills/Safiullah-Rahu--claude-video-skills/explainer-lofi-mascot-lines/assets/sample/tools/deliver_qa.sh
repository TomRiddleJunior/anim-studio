#!/usr/bin/env bash
# deliver.sh (22.3 s) + cover.py + qa_all.sh in one job (run it under the shared lock).
set -u
HERE="$(cd "$(dirname "$0")/.." && pwd)"; cd "$HERE"
FILM_DUR=22.3 bash tools/deliver.sh && python -X utf8 -I tools/cover.py && bash tools/qa_all.sh

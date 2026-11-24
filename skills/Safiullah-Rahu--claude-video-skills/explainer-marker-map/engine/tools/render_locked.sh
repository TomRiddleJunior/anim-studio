#!/usr/bin/env bash
# Full renders under the shared-machine lock: waits while map-films/.render-lock exists, holds it per format.
#   bash engine/tools/render_locked.sh <slug> [16x9 9x16] [--workers 3]
set -u
ROOT="map-films"
LOCK="$ROOT/.render-lock"
SLUG="$1"; shift
FMTS=()
EXTRA=()
for a in "$@"; do
  case "$a" in 16x9|9x16) FMTS+=("$a");; *) EXTRA+=("$a");; esac
done
[ ${#FMTS[@]} -eq 0 ] && FMTS=(16x9 9x16)
cd "$ROOT" || exit 1
for F in "${FMTS[@]}"; do
  until mkdir "$LOCK" 2>/dev/null; do sleep 5; done
  echo "[lock] $(date +%T) rendering $SLUG $F"
  python -I engine/tools/render.py "$SLUG" --fmt "$F" --video "${EXTRA[@]}"
  rc=$?
  rmdir "$LOCK"
  echo "[lock] $(date +%T) released ($F, exit $rc)"
  [ $rc -ne 0 ] && exit $rc
done

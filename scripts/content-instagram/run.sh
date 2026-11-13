#!/usr/bin/env bash
# SANDER Instagram: data → plan → graphics.
#   bash run.sh A   (Sunday evening: plans Monday–Wednesday of next week)
#   bash run.sh B   (Wednesday evening: plans Thursday–Sunday of this week)
#   bash run.sh A|B YYYY-MM-DD   (explicit Monday, for tests)
#   DATA=file.json bash run.sh …  (use a saved feed instead of the live one)
# Output: work/data.json, work/plan.json, work/out/*.jpg, work/out/captions.json
set -euo pipefail
cd "$(dirname "$0")"
RUN="${1:?A or B}"
SITE="${SITE:-https://www.sanderbv.it}"
if [ -n "${2:-}" ]; then MONDAY="$2"
elif [ "$RUN" = "A" ]; then MONDAY=$(TZ=Europe/Rome date -d "next monday" +%F)
else MONDAY=$(TZ=Europe/Rome date -d "$( [ "$(TZ=Europe/Rome date +%u)" = 1 ] && echo today || echo 'last monday')" +%F); fi
mkdir -p work && rm -rf work/out
if [ -n "${DATA:-}" ]; then cp "$DATA" work/data.json
else curl -fsS --max-time 60 "$SITE/api/social/feed" -o work/data.json; fi
# FIPAV calendar read here when the app has none yet (never fatal).
[ "${NO_FIPAV:-}" = 1 ] || node fipav/feed.mjs work/data.json "$MONDAY" || true
node plan.mjs work/data.json "$RUN" "$MONDAY" > work/plan.json
SITE="$SITE" node render.mjs work/plan.json work/out
echo "ok: $RUN $MONDAY → work/out ($(ls work/out/*.jpg | wc -l) immagini)"

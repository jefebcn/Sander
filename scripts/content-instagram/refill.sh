#!/usr/bin/env bash
# SANDER Instagram, refill check (daily routine).
#   bash refill.sh        → "ok: N in coda, niente da fare" when Buffer has fewer than 4 free places,
#                            otherwise one line per window to fill: "A 2026-11-23" / "B 2026-11-23"
# Windows: Monday–Wednesday (A) and Thursday–Sunday (B) of this week and the next, that still
# have days ahead within 8 days. publish.mjs skips days already covered and past times.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p work
node history.mjs > work/history.json
FREE=$(node -e 'console.log(JSON.parse(require("fs").readFileSync("work/history.json","utf8")).free)')
MIN="${MIN_FREE:-4}"
if [ "$FREE" -lt "$MIN" ]; then echo "ok: $((10 - FREE)) in coda, niente da fare"; exit 0; fi
echo "liberi: $FREE" >&2
THIS=$(TZ=Europe/Rome date -d "$( [ "$(TZ=Europe/Rome date +%u)" = 1 ] && echo today || echo 'last monday')" +%F)
TODAY=$(TZ=Europe/Rome date +%F)
HORIZON=$(TZ=Europe/Rome date -d "+8 days" +%F)
for MON in "$THIS" "$(date -d "$THIS +7 days" +%F)"; do
  for RUN in A B; do
    if [ "$RUN" = A ]; then FIRST="$MON"; LAST=$(date -d "$MON +2 days" +%F); else FIRST=$(date -d "$MON +3 days" +%F); LAST=$(date -d "$MON +6 days" +%F); fi
    if [[ "$LAST" > "$TODAY" && ! "$FIRST" > "$HORIZON" ]]; then echo "$RUN $MON"; fi
  done
done

#!/usr/bin/env python3
"""Builds src/lib/comuni/comuni.json from the ISTAT list of Italian comuni.

Source: github.com/matteocontrini/comuni-json (comuni.json), the ISTAT
"Elenco comuni italiani" as JSON (ISTAT data, CC BY). Re-run when ISTAT merges
or renames comuni:

    curl -sSLo /tmp/comuni.json https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json
    python3 scripts/comuni/build.py /tmp/comuni.json

Output: {"regions": [...], "comuni": [[name, regionIndex], ...]}, sorted by
name. A name shared by comuni in different provinces gets its province code,
"Castro (BG)", so every value names exactly one place. San Marino is added as
its own entry: its players share the Riviera courts.
"""
import json, sys, unicodedata
from collections import Counter

REGION_NAME = {
    "Valle d'Aosta/Vallée d'Aoste": "Valle d'Aosta",
    "Trentino-Alto Adige/Südtirol": "Trentino-Alto Adige",
}

def key(s):
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().casefold()

src = json.load(open(sys.argv[1], encoding="utf-8"))
regions = sorted({REGION_NAME.get(c["regione"]["nome"], c["regione"]["nome"]) for c in src} | {"San Marino"}, key=key)
count = Counter(c["nome"] for c in src)
rows = []
for c in src:
    name = c["nome"] if count[c["nome"]] == 1 else f'{c["nome"]} ({c["sigla"]})'
    rows.append([name, regions.index(REGION_NAME.get(c["regione"]["nome"], c["regione"]["nome"]))])
rows.append(["San Marino", regions.index("San Marino")])
rows.sort(key=lambda r: key(r[0]))
out = "src/lib/comuni/comuni.json"
json.dump({"regions": regions, "comuni": rows}, open(out, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(out, len(rows), "comuni,", len(regions), "regions,", sum(1 for n, k in count.items() if k > 1), "shared names")

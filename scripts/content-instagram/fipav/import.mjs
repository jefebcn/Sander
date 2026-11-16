/**
 * Brings the FIPAV data into the SANDER app.
 *
 *   node fipav/import.mjs [--site https://www.sanderbv.it] [--dry-run]
 *
 * FIPAV refuses Vercel's servers (403 Cloudflare), so the app cannot read its
 * public files by itself. This script reads the same public files from here
 * (one request at a time, honest user agent) and uploads them to the app's
 * /api/fipav/import, which parses and stores them with the app's own code.
 *
 * Step 1 uploads calendar and rankings; the app answers with the detail files
 * it still needs (next week's events, linked players); step 2 uploads those.
 *
 * Auth: Authorization: Bearer CRON_SECRET. In the cloud environment the proxy
 * adds it for www.sanderbv.it (saved with request_credential); locally set
 * FIPAV_IMPORT_TOKEN. The token is never printed. Uploads go through curl,
 * which uses the proxy (Node's fetch does not).
 * If FIPAV answers 403 here too, stop: never work around it.
 */
import { execFileSync } from "child_process"
import { mkdtempSync, writeFileSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { gzipSync } from "zlib"

const BASE = "https://media.myvolley.net/public/json"
const UA = "SANDER beach volley app"
const DAY = 86_400_000
const args = process.argv.slice(2)
const flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined }
const SITE = (flag("--site") ?? process.env.SITE ?? "https://www.sanderbv.it").replace(/\/$/, "")
const DRY = args.includes("--dry-run")

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let fetched = 0
async function get(path, { optional = false } = {}) {
  await sleep(250)
  const res = await fetch(`${BASE}/${path}`, { headers: { "user-agent": UA, accept: "application/json" }, signal: AbortSignal.timeout(90_000) })
  if (res.status === 403) throw new Error(`FIPAV 403 su ${path}: bloccato anche qui, mi fermo (non va aggirato)`)
  if (!res.ok) { if (optional) return null; throw new Error(`FIPAV ${res.status} su ${path}`) }
  fetched++
  return res.json()
}

function upload(body) {
  const dir = mkdtempSync(join(tmpdir(), "fipav-"))
  const file = join(dir, "body.json.gz")
  try {
    writeFileSync(file, gzipSync(JSON.stringify(body)))
    const auth = process.env.FIPAV_IMPORT_TOKEN ? `Bearer ${process.env.FIPAV_IMPORT_TOKEN}` : "Bearer from-proxy"
    const out = execFileSync("curl", ["-sS", "-X", "POST", `${SITE}/api/fipav/import`, "-H", "Content-Type: application/json", "-H", "Content-Encoding: gzip",
      "-H", `Authorization: ${auth}`, "--data-binary", `@${file}`, "--max-time", "290", "-w", "\n%{http_code}"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })
    const lines = out.trimEnd().split("\n")
    const code = Number(lines.pop())
    const text = lines.join("\n")
    if (code !== 200) throw new Error(`app ${code}: ${text.slice(0, 200)}`)
    return JSON.parse(text)
  } finally { rmSync(dir, { recursive: true, force: true }) }
}

const files = {}
const now = Date.now()
const lo = new Date(now - 60 * DAY).toISOString().slice(0, 10)
const hi = new Date(now + 365 * DAY).toISOString().slice(0, 10)

// Calendar: the same seasons and pages the app would read (src/lib/fipav/parse.ts).
files["index.json"] = await get("index.json")
const seasons = (files["index.json"].seasons ?? []).filter((s) => Number(s.season) >= 2000 && s.a >= lo && s.da <= hi).map((s) => String(s.season))
for (const season of seasons) {
  const root = (files[`${season}/discipline.json`] = await get(`${season}/discipline.json`))
  for (const p of (root.pages ?? []).map((x) => x.path_discipline).filter(Boolean)) files[p] = await get(p, { optional: true })
}
// Rankings: newest season that has them, senior (assoluto) M and F.
const y = new Date().getUTCFullYear()
for (const year of [y, y - 1]) {
  const idx = await get(`${year}/BVL/classifiche/index.json`, { optional: true })
  if (!idx) continue
  files[`${year}/BVL/classifiche/index.json`] = idx
  for (const r of idx.data?.atleti ?? []) {
    if (/^assoluto$/i.test(r.ranking_type ?? "") && /^[mf]$/i.test(r.sesso ?? "") && r.path) files[`${year}/BVL/classifiche/${r.path}`] = await get(`${year}/BVL/classifiche/${r.path}`)
  }
  break
}
for (const k of Object.keys(files)) if (files[k] == null) delete files[k]
console.log(`fipav import: ${Object.keys(files).length} file letti (stagioni ${seasons.join(", ")})`)
if (DRY) process.exit(0)

const first = upload({ step: "all", files })
console.log(`app: ${JSON.stringify(first.report)}`)
const need = first.need ?? []
const details = {}
for (const p of need) { const f = await get(p, { optional: true }); if (f) details[p] = f }
if (need.length) {
  const second = upload({ step: "details", files: details })
  console.log(`app dettagli: ${JSON.stringify(second)} (${Object.keys(details).length}/${need.length} file)`)
}
console.log(`fipav import: ok (${fetched} richieste a FIPAV)`)

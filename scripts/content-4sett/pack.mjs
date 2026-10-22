/**
 * Calendar, read-me and zip for the four-week pack (after render.mjs).
 *   node scripts/content-4sett/pack.mjs <dest.zip>
 */
import { readFileSync, writeFileSync, readdirSync, rmSync, cpSync, mkdirSync } from "fs"
import { execFileSync } from "child_process"
import { join, dirname, resolve } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, "out")
const dest = resolve(process.argv[2] ?? join(__dirname, "SANDER-4-settimane.zip"))
const { posts } = JSON.parse(readFileSync(join(__dirname, "posts.json"), "utf8"))
// A Reel is a TikTok reposted: same topic.
const byId = Object.fromEntries(posts.map((p) => [p.id, p]))
for (const p of posts) if (p.reuse) p.rubrica ??= byId[p.reuse].rubrica

const DAYS = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"]
const MONTHS = ["", "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"]
const label = (date) => {
  const d = new Date(`${date}T12:00:00Z`)
  return `${DAYS[d.getUTCDay()]} ${+date.slice(8)} ${MONTHS[+date.slice(5, 7)]}`
}
const folders = { tiktok: readdirSync(join(OUT, "tiktok")), instagram: readdirSync(join(OUT, "instagram")) }
const folderOf = (p) => `${p.platform}/${folders[p.platform].find((f) => f.startsWith(`${p.id}-`))}`
const kind = (p) => (p.format === "carousel" ? "carosello" : p.format === "reel" ? "Reel" : "video")

const sorted = [...posts].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) || a.platform.localeCompare(b.platform))
let cal = "CALENDARIO SANDER · 26 ottobre – 22 novembre 2026\n" + "=".repeat(52) + "\n"
let day = ""
for (const p of sorted) {
  if (p.date !== day) {
    day = p.date
    cal += `\n\n■ ${label(p.date).toUpperCase()}\n`
  }
  cal += `\n— ${p.time} · ${p.platform === "tiktok" ? "TikTok" : "Instagram"} · ${kind(p)} · ${p.rubrica}\n  Cartella: ${folderOf(p)}\n\n${p.caption.trim().replace(/^/gm, "  ")}\n`
}
writeFileSync(join(OUT, "CALENDARIO-E-DIDASCALIE.txt"), cal)

const csv = [["data", "ora", "piattaforma", "formato", "cartella", "didascalia"], ...sorted.map((p) => [p.date, p.time, p.platform, kind(p), folderOf(p), p.caption.trim()])]
writeFileSync(join(OUT, "calendario.csv"), "﻿" + csv.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n") + "\n")

const t = posts.filter((p) => p.platform === "tiktok")
const i = posts.filter((p) => p.platform === "instagram")
writeFileSync(join(OUT, "00-LEGGIMI.txt"), `SANDER · contenuti dal 26 ottobre al 22 novembre 2026

COSA C'È
- tiktok/      ${t.length} post: ${t.filter((p) => p.format === "video").length} video + ${t.filter((p) => p.format === "carousel").length} caroselli (modalità foto). 2 al giorno, 12:30 e 19:00.
- instagram/   ${i.length} post: ${i.filter((p) => p.format === "reel").length} Reel + ${i.filter((p) => p.format === "carousel").length} caroselli 4:5. Lun, mer, ven e dom alle 18:30.
- CALENDARIO-E-DIDASCALIE.txt  tutto in ordine di giorno, con la didascalia da copiare.
- calendario.csv               lo stesso in tabella (si apre con Excel / Fogli Google).

OGNI CARTELLA
Il nome dice: numero, giorno, ora, argomento (es. T01-26ott-lun-1230-…).
Dentro: il video .mp4 oppure le foto del carosello (01, 02… in ordine),
didascalia.txt (da incollare così com'è) e info.txt (rubrica e audio consigliato).

MUSICA
I video sono muti apposta: aggiungi un audio di tendenza direttamente in TikTok o
Instagram (info.txt suggerisce il tipo). Così l'algoritmo li spinge di più e non ci
sono problemi di diritti.

COME PROGRAMMARE
- TikTok: dal telefono "Programma" oppure da TikTok Studio sul computer (fino a 10 giorni prima).
- Instagram: Meta Business Suite o Metricool, carichi tutto in una volta.
- I caroselli TikTok vanno caricati come "foto" (non video): scegli tutte le immagini in ordine.

CONSIGLI
- Rispondi ai commenti nella prima ora: è il momento che conta di più.
- Se un video va bene, rifallo con un'altra frase sopra la stessa clip.
- Le persone nelle foto e nei video sono generate (non esistono), senza marchi.
`)

rmSync(dest, { force: true })
const stage = join(__dirname, ".pack", "SANDER-4-settimane")
rmSync(join(__dirname, ".pack"), { recursive: true, force: true })
mkdirSync(stage, { recursive: true })
cpSync(OUT, stage, { recursive: true })
execFileSync("zip", ["-r", "-q", "-X", dest, "SANDER-4-settimane"], { cwd: join(__dirname, ".pack") })
rmSync(join(__dirname, ".pack"), { recursive: true, force: true })
console.log("zip", dest)

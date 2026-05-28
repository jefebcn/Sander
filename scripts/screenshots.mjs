/**
 * Cattura screenshot delle pagine principali di sanderbv.it
 * Output: scripts/store-screenshots/*.png (1080x1920 — formato Play Store)
 *
 * Uso: node scripts/screenshots.mjs
 * Opzionale con cookie di sessione:
 *   SESSION_COOKIE="valore" node scripts/screenshots.mjs
 */

import { chromium } from "playwright"
import { mkdir } from "fs/promises"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, "store-screenshots")

const BASE = "https://www.sanderbv.it"

// Pagine da catturare: [nome-file, percorso, pausa-ms]
const PAGES = [
  ["01-home",        "/",                  2000],
  ["02-partite",     "/sessions",          2000],
  ["03-tornei",      "/tournaments",       2000],
  ["04-giocatori",   "/players",           2000],
]

async function run() {
  await mkdir(OUT_DIR, { recursive: true })

  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    args: ["--ignore-certificate-errors"],
  })
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },   // iPhone 14 logical px
    deviceScaleFactor: 2.77,                 // → 1080×2338 fisici
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) " +
      "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    colorScheme: "dark",
  })

  // Inietta cookie di sessione se fornito (per schermate autenticate)
  if (process.env.SESSION_COOKIE) {
    await ctx.addCookies([
      {
        name: "authjs.session-token",
        value: process.env.SESSION_COOKIE,
        domain: "www.sanderbv.it",
        path: "/",
        httpOnly: true,
        secure: true,
      },
    ])
    console.log("✓ Cookie di sessione iniettato")
  }

  const page = await ctx.newPage()

  for (const [name, path, wait] of PAGES) {
    const url = `${BASE}${path}`
    console.log(`→ ${url}`)
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 15000 })
      await page.waitForTimeout(wait)

      // Nascondi la status bar del browser se visibile
      await page.evaluate(() => {
        document.querySelectorAll("[data-browser-ui]").forEach((el) => el.remove())
      }).catch(() => {})

      const out = join(OUT_DIR, `${name}.png`)
      await page.screenshot({ path: out, fullPage: false })
      console.log(`  ✓ salvato ${name}.png`)
    } catch (err) {
      console.warn(`  ✗ errore su ${name}: ${err.message}`)
    }
  }

  await browser.close()
  console.log(`\nScreenshot salvati in: ${OUT_DIR}`)
  console.log("Dimensione fisica approssimativa: 1080×2338 px")
  console.log("\nNota: per schermate autenticate (home con profilo, sessioni, ecc.)")
  console.log("  1. Apri sanderbv.it nel browser, fai login")
  console.log("  2. Copia il cookie 'authjs.session-token' dai DevTools")
  console.log("  3. Riesegui con: SESSION_COOKIE='...' node scripts/screenshots.mjs")
}

run().catch(console.error)

/**
 * Screenshot Play Store 1080×1920 con didascalia, dalle schermate vere.
 * Usa dati demo (mai utenti reali): avvia l'app in locale col seed, collega le foto demo
 *   (node scripts/store-demo-photos.mjs) e lancia
 *   BASE=http://localhost:3000 EMAIL=test@sander.local PASSWORD=sander123 node scripts/store-scopri.mjs
 * Output: scripts/store-screenshots/scopri-*.png e feature-graphic-scopri-1024x500.png
 */
import { chromium } from "playwright"
import { mkdir, readFile } from "fs/promises"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, "store-screenshots")
const BASE = process.env.BASE ?? "http://localhost:3000"

const SHOTS = [
  ["scopri-1-swipe", "/scopri", "Trova con chi giocare,", "a colpi di swipe."],
  ["scopri-2-like", "/scopri", "Like a una foto o a una risposta,", "con un commento."],
  ["scopri-3-match", "/scopri/match", "Match, chat e partita", "in calendario."],
  ["scopri-4-coppie", "/scopri/coppie", "In coppia per il 2v2:", "sfide e classifica."],
  ["scopri-5-home", "/", "Ogni partita muove", "la tua classifica."],
  ["scopri-6-profilo", "/scopri/profilo", "Il tuo profilo da giocatore:", "foto e risposte."],
]

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {})
const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await ctx.addInitScript(() => {
  try {
    for (const [k, v] of [["cookie_consent", "accepted"], ["pwa_install_dismissed", "1"], ["sander_onboarded", "1"], ["sander_has_profile", "1"], ["sander_level_celebrated", "99"]]) localStorage.setItem(k, v)
  } catch {}
})
const page = await ctx.newPage()
await page.goto(`${BASE}/auth/signin`, { waitUntil: "networkidle" })
await page.fill('input[type="email"]', process.env.EMAIL ?? "test@sander.local")
await page.fill('input[type="password"]', process.env.PASSWORD ?? "sander123")
await page.click('button[type="submit"]')
await page.waitForTimeout(2500)

const raw = {}
for (const [name, path] of SHOTS) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" })
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" })
  if (path === "/scopri/coppie") await page.getByRole("button", { name: "Classifica" }).click().catch(() => {})
  if (name === "scopri-2-like") {
    // Open the like sheet on the first answer and write a comment, as a player would.
    await page.getByRole("button", { name: /^Metti like alla risposta/ }).first().click()
    await page.locator("textarea").fill("Anch'io gioco a Riccione la sera, ci stai sabato?")
  }
  await page.waitForTimeout(1500)
  raw[name] = (await page.screenshot()).toString("base64")
}

// Frame: graphite, headline on top, the phone screen below with rounded corners.
const board = await browser.newPage({ viewport: { width: 1080, height: 1920 } })
const logo = (await readFile(join(__dirname, "..", "public", "icon-192.png"))).toString("base64")
// Generated photo (Higgsfield), no real people or brands: background of the feature graphic.
const hero = (await readFile(join(__dirname, "store-assets", "hero-2v2.jpg"))).toString("base64")
for (const [name, , l1, l2] of SHOTS) {
  await board.setContent(`<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,800&display=swap" rel="stylesheet">
<style>
  body{margin:0;width:1080px;height:1920px;background:radial-gradient(90% 40% at 50% 0%,rgba(198,247,54,.18),transparent 70%),#0b0b0c;
       font-family:'Bricolage Grotesque',system-ui,sans-serif;color:#fff;display:flex;flex-direction:column;align-items:center}
  .top{display:flex;align-items:center;gap:20px;margin-top:84px}
  .top img{width:72px;height:72px;border-radius:18px}
  .top span{font-weight:800;font-size:40px;letter-spacing:.16em;font-stretch:85%}
  h1{margin:40px 60px 0;font-weight:800;font-size:78px;line-height:1.02;text-align:center;font-stretch:85%;letter-spacing:-.01em}
  h1 em{font-style:normal;color:#c6f736}
  .phone{margin-top:64px;width:780px;height:1560px;border-radius:64px;overflow:hidden;box-shadow:0 0 0 10px #1a1b1e,0 40px 80px rgba(0,0,0,.6)}
  .phone img{width:100%;display:block}
</style></head><body>
<div class="top"><img src="data:image/png;base64,${logo}"><span>SANDER</span></div>
<h1>${l1}<br><em>${l2}</em></h1>
<div class="phone"><img src="data:image/png;base64,${raw[name]}"></div>
</body></html>`)
  await board.waitForTimeout(800)
  await board.screenshot({ path: join(OUT, `${name}.png`) })
  console.log("saved", name)
}

// Feature graphic 1024×500: wordmark + promise on the left, the deck on a phone on the right.
await board.setViewportSize({ width: 1024, height: 500 })
await board.setContent(`<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,800&family=Figtree:wght@600;700&display=swap" rel="stylesheet">
<style>
  body{margin:0;width:1024px;height:500px;overflow:hidden;position:relative;background:#0b0b0c url(data:image/jpeg;base64,${hero}) center 40%/cover no-repeat;color:#fff;font-family:'Bricolage Grotesque',system-ui,sans-serif}
  body::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(11,11,12,.88) 0%,rgba(11,11,12,.55) 38%,rgba(11,11,12,0) 62%),linear-gradient(0deg,rgba(11,11,12,.55),transparent 45%)}
  .l,.phone{z-index:1}
  .l{position:absolute;left:64px;top:78px;width:520px}
  .brand{display:flex;align-items:center;gap:16px}
  .brand img{width:60px;height:60px;border-radius:14px}
  .brand span{font-weight:800;font-size:34px;letter-spacing:.16em;font-stretch:85%}
  h1{margin:34px 0 0;font-weight:800;font-size:64px;line-height:1;font-stretch:85%;letter-spacing:-.01em}
  h1 em{font-style:normal;color:#c6f736}
  .chips{display:flex;gap:10px;margin-top:30px;font-family:Figtree,sans-serif}
  .chips b{font-weight:700;font-size:18px;padding:9px 16px;border-radius:999px;background:#1a1b1e;box-shadow:inset 0 0 0 1px #2b2c31}
  .chips b:first-child{background:#c6f736;color:#0b0b0c;box-shadow:none}
  .phone{position:absolute;right:70px;top:46px;width:300px;height:600px;border-radius:40px;overflow:hidden;transform:rotate(6deg);box-shadow:0 0 0 8px #1a1b1e,0 30px 60px rgba(0,0,0,.6)}
  .phone img{width:100%;display:block}
</style></head><body>
<div class="l">
  <div class="brand"><img src="data:image/png;base64,${logo}"><span>SANDER</span></div>
  <h1>Trova con chi giocare.<br><em>A colpi di swipe.</em></h1>
  <div class="chips"><b>Scopri</b><b>Match</b><b>Coppie 2v2</b><b>Partite</b></div>
</div>
<div class="phone"><img src="data:image/png;base64,${raw["scopri-1-swipe"]}"></div>
</body></html>`)
await board.waitForTimeout(800)
await board.screenshot({ path: join(OUT, "feature-graphic-scopri-1024x500.png") })
console.log("saved feature-graphic-scopri-1024x500")
await browser.close()

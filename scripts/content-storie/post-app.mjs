/**
 * Pinned Instagram post (carousel, 1080×1350): SANDER is on App Store and
 * Google Play. Same look as the stories (gen.mjs): film photo, lime card,
 * Gochi Hand titles, Inter labels. The dark card is only slide 2, never the cover.
 * The profile grid crops the cover to 3:4, so nothing important near the sides.
 *
 *   CHROME=… node scripts/content-storie/post-app.mjs
 * Output: scripts/content-storie/out/post-app-<n>.jpg
 */
import { chromium } from "playwright"
import { readFileSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..", "..")
const OUT = join(__dirname, "out")
mkdirSync(OUT, { recursive: true })

const b64 = (p) => `data:image/${p.endsWith(".png") ? "png" : "jpeg"};base64,${readFileSync(p).toString("base64")}`
const LOGO = b64(join(ROOT, "public", "icon-512.png"))
const BG = (name) => b64(join(__dirname, "bg", `${name}.jpg`))

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;position:relative;font-family:'Inter',sans-serif;color:#fff;background:#0b0b0b}
.bg{position:absolute;inset:0;background-size:cover;background-position:center}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.5) 0%,rgba(0,0,0,.08) 38%,rgba(0,0,0,.12) 60%,rgba(0,0,0,.7) 100%)}
.lime{background:radial-gradient(120% 80% at 50% 40%,#d4ff3a 0%,#c6f736 55%,#b4e52a 100%);color:#0b0b0b}
.dark{background:radial-gradient(120% 80% at 50% 35%,#1f2024 0%,#121315 60%,#0b0b0b 100%)}
.meta{position:absolute;top:64px;left:110px;right:110px;display:flex;justify-content:space-between;font-size:22px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;opacity:.85}
.hand{font-family:'Gochi Hand',cursive;line-height:.9;-webkit-text-stroke:3px currentColor}
.acc{color:#c6f736}
.pill{display:inline-block;border:2px solid rgba(255,255,255,.8);border-radius:999px;padding:14px 30px;font-size:26px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.logo{width:120px;height:120px;border-radius:28px;display:block;margin:0 auto 20px}
.url{font-family:'Gochi Hand',cursive;font-size:64px;-webkit-text-stroke:1.5px currentColor}
.small{font-size:22px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;margin-top:6px;opacity:.85}
.step{display:flex;gap:40px;align-items:flex-start;margin-bottom:62px}
.step .n{font-family:'Gochi Hand',cursive;font-size:104px;line-height:.8;color:#c6f736;-webkit-text-stroke:3px #c6f736;width:130px;flex:none}
.step b{display:block;font-size:46px;font-weight:800;margin-bottom:8px}
.step span{font-size:32px;opacity:.85;line-height:1.3}
`
const page = (body) => `<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Gochi+Hand&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet"><style>${CSS}</style></head><body>${body}</body></html>`

const SLIDES = [
  // 1 · cover: the sunset spike, title in the sky above the ball.
  page(`
    <div class="bg" style="background-image:url(${BG("schiacciata-tramonto")});background-position:center 8%"></div><div class="shade"></div>
    <div class="meta"><span>App Store</span><span>Google Play</span><span>Gratis</span></div>
    <div style="position:absolute;top:130px;left:0;right:0;text-align:center;text-shadow:0 6px 30px rgba(0,0,0,.45)">
      <div class="hand" style="font-size:132px">Il beach volley</div>
      <div class="hand" style="font-size:132px;margin-top:6px">ha la sua <span class="acc">app</span></div>
    </div>
    <div style="position:absolute;bottom:90px;left:0;right:0;text-align:center"><span class="pill" style="background:rgba(0,0,0,.3)">Scaricala dal link in bio</span></div>`),
  // 2 · what's inside (dark card: fine inside a carousel, never as cover).
  page(`
    <div class="bg dark"></div>
    <div class="meta" style="opacity:.6"><span>SANDER</span><span>Cosa trovi</span></div>
    <div style="position:absolute;top:210px;left:110px;right:100px">
      <div class="hand" style="font-size:120px;margin-bottom:70px">Dentro <span class="acc">l'app</span></div>
      <div class="step"><div class="n">01</div><div><b>Partite vicino a te</b><span>Unisciti o creane una in un minuto</span></div></div>
      <div class="step"><div class="n">02</div><div><b>Compagni per il 2v2</b><span>Su Scopri trovi chi gioca al tuo livello</span></div></div>
      <div class="step"><div class="n">03</div><div><b>La tua classifica</b><span>Ogni partita conta nel tuo comune</span></div></div>
      <div class="step"><div class="n">04</div><div><b>Tornei</b><span>Iscriviti in coppia con un link</span></div></div>
    </div>
    <div style="position:absolute;bottom:90px;left:0;right:0;text-align:center"><span class="pill" style="border-color:#c6f736;color:#c6f736">Scorri →</span></div>`),
  // 3 · lime close: where to get it.
  page(`
    <div class="bg lime"></div>
    <div style="position:absolute;inset:0;color:#0b0b0b">
    <div class="meta" style="opacity:.75"><span>iPhone</span><span>Android</span><span>Gratis</span></div>
    <div style="position:absolute;top:220px;left:90px;right:90px;text-align:center">
      <div class="hand" style="font-size:150px">Gratis,</div>
      <div class="hand" style="font-size:118px;margin-top:10px">su iPhone e Android</div>
      <div style="display:flex;gap:22px;justify-content:center;margin-top:60px">
        <span class="pill" style="border-color:#0b0b0b">App Store</span>
        <span class="pill" style="border-color:#0b0b0b">Google Play</span>
      </div>
    </div>
    <div style="position:absolute;bottom:110px;left:0;right:0;text-align:center"><img class="logo" src="${LOGO}"><div class="url">sanderbv.it</div><div class="small">Link in bio · cerca SANDER</div></div></div>`),
]

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {})
const p = await browser.newPage({ viewport: { width: 1080, height: 1350 } })
for (const [i, html] of SLIDES.entries()) {
  await p.setContent(html, { waitUntil: "networkidle" })
  await p.evaluate(() => document.fonts.ready)
  await p.screenshot({ path: join(OUT, `post-app-${i + 1}.jpg`), type: "jpeg", quality: 92 })
  console.log(`post-app-${i + 1}`)
}
await browser.close()

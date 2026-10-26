/**
 * SANDER Instagram stories (1080×1920, no stickers) in the Stagione 2 style:
 * film photo, dark or lime card, Gochi Hand titles, Inter labels, SANDER lime.
 * Approved by the owner (Oct 2026): use this as the template for new stories.
 * Text stays in the safe zone: nothing important above 270 px or below 380 px.
 *
 *   CHROME=… node scripts/content-storie/gen.mjs [name…]
 * Output: scripts/content-storie/out/<name>.jpg
 */
import { chromium } from "playwright"
import { readFileSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..", "..")
const OUT = join(__dirname, "out")
mkdirSync(OUT, { recursive: true })
const only = process.argv.slice(2)

// Inline images: a page set with setContent can't load file:// URLs.
const b64 = (p) => `data:image/${p.endsWith(".png") ? "png" : "jpeg"};base64,${readFileSync(p).toString("base64")}`
const LOGO = b64(join(ROOT, "public", "icon-512.png"))
const BG = (name) => b64(join(__dirname, "bg", `${name}.jpg`))

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;position:relative;font-family:'Inter',sans-serif;color:#fff;background:#0b0b0b}
.bg{position:absolute;inset:0;background-size:cover;background-position:center}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,.1) 30%,rgba(0,0,0,.15) 55%,rgba(0,0,0,.75) 100%)}
.lime{background:radial-gradient(120% 80% at 50% 40%,#d4ff3a 0%,#c6f736 55%,#b4e52a 100%);color:#0b0b0b}
.dark{background:radial-gradient(120% 80% at 50% 35%,#1f2024 0%,#121315 60%,#0b0b0b 100%)}
.meta{position:absolute;top:270px;left:72px;right:72px;display:flex;justify-content:space-between;font-size:24px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;opacity:.85}
.hand{font-family:'Gochi Hand',cursive;line-height:.9;-webkit-text-stroke:3px currentColor}
.acc{color:#c6f736}
.pill{display:inline-block;border:2px solid rgba(255,255,255,.75);border-radius:999px;padding:14px 30px;font-size:28px;font-weight:600;letter-spacing:.06em;text-transform:uppercase}
.foot{position:absolute;bottom:380px;left:0;right:0;text-align:center}
.logo{width:120px;height:120px;border-radius:28px;display:block;margin:0 auto 22px}
.url{font-family:'Gochi Hand',cursive;font-size:64px;-webkit-text-stroke:1.5px currentColor}
.small{font-size:24px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;margin-top:8px;opacity:.85}
.step{display:flex;gap:44px;align-items:flex-start;margin-bottom:64px}
.step .n{font-family:'Gochi Hand',cursive;font-size:120px;line-height:.8;color:#c6f736;-webkit-text-stroke:3px #c6f736;width:150px}
.step b{display:block;font-size:52px;font-weight:800;margin-bottom:10px}
.step span{font-size:36px;opacity:.85;line-height:1.3}
`
const page = (body) => `<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Gochi+Hand&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet"><style>${CSS}</style></head><body>${body}</body></html>`

const STORIES = {
  's1-novembre': page(`
    <div class="bg" style="background-image:url(${BG("novembre-felpe")})"></div><div class="shade"></div>
    <div class="meta"><span>Stagione 2</span><span>Riviera</span><span>Gratis</span></div>
    <div style="position:absolute;top:350px;left:72px;right:60px;text-shadow:0 6px 30px rgba(0,0,0,.45)">
      <div class="hand" style="font-size:170px">Si gioca</div>
      <div class="hand acc" style="font-size:118px;margin-top:6px;white-space:nowrap">anche a novembre</div>
    </div>
    <div class="foot"><span class="pill">Felpa, sabbia e un pallone</span></div>`),
  's2-quarto': page(`
    <div class="bg lime"></div>
    <div style="position:absolute;inset:0;color:#0b0b0b">
    <div class="meta" style="opacity:.75"><span>Scopri</span><span>Novità</span><span>Gratis</span></div>
    <div style="position:absolute;top:560px;left:72px;right:72px;text-align:center">
      <div class="hand" style="font-size:160px">Manca<br>sempre il</div>
      <div class="hand" style="font-size:230px;margin-top:10px">quarto?</div>
      <div style="font-size:44px;font-weight:600;line-height:1.35;margin-top:70px">Su SANDER trovi chi gioca<br>vicino a te, al tuo livello.</div>
    </div>
    <div class="foot"><img class="logo" src="${LOGO}"><div class="url">sanderbv.it</div><div class="small">Link in bio</div></div></div>`),
  's3-libero': page(`
    <div class="bg" style="background-image:url(${BG("tramonto-coppia")})"></div><div class="shade"></div>
    <div class="meta"><span>Libero oggi</span><span>Stasera</span></div>
    <div style="position:absolute;top:360px;left:0;right:0;text-align:center;text-shadow:0 6px 30px rgba(0,0,0,.4)">
      <div class="hand" style="font-size:170px;display:inline">Libero </div><div class="hand acc" style="font-size:170px;display:inline">oggi?</div>
      <div style="margin-top:36px"><span class="pill" style="background:rgba(0,0,0,.25)">Un tap e i tuoi match lo sanno</span></div>
    </div>
    <div class="foot"><div class="url">sanderbv.it</div><div class="small">Link in bio</div></div>`),
  's5-tocca-a-te': page(`
    <div class="bg" style="background-image:url(${BG("palla-sabbia")});background-size:112%;background-position:center 40%"></div><div class="shade" style="background:linear-gradient(180deg,rgba(0,0,0,.7) 0%,rgba(0,0,0,.45) 40%,rgba(0,0,0,.1) 60%,rgba(0,0,0,.7) 100%)"></div>
    <div class="meta"><span>Community</span><span>Gratis</span><span>@sanderbeachvolley</span></div>
    <div style="position:absolute;top:430px;left:72px;right:60px;text-shadow:0 6px 30px rgba(0,0,0,.45)">
      <div class="hand" style="font-size:190px">La prossima</div>
      <div class="hand acc" style="font-size:210px;margin-top:10px">palla<br>è tua</div>
    </div>
    <div class="foot"><div class="url">sanderbv.it</div><div class="small">Link in bio</div></div>`),
  's4-come-funziona': page(`
    <div class="bg dark"></div>
    <div class="meta" style="opacity:.6"><span>Come funziona</span><span>Gratis</span></div>
    <div style="position:absolute;top:470px;left:80px;right:72px">
      <div class="hand" style="font-size:150px;margin-bottom:90px">In tre <span class="acc">tocchi</span></div>
      <div class="step"><div class="n">01</div><div><b>Entra</b><span>Email o Google, in un minuto</span></div></div>
      <div class="step"><div class="n">02</div><div><b>Trova</b><span>Una partita vicino a te, o creala</span></div></div>
      <div class="step"><div class="n">03</div><div><b>Gioca e sali</b><span>Ogni partita sposta la classifica del tuo comune</span></div></div>
    </div>
    <div class="foot"><img class="logo" src="${LOGO}"><div class="url acc">sanderbv.it</div><div class="small">Link in bio</div></div>`),
}

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {})
const page_ = await browser.newPage({ viewport: { width: 1080, height: 1920 } })
for (const [name, html] of Object.entries(STORIES)) {
  if (only.length && !only.includes(name)) continue
  await page_.setContent(html, { waitUntil: "networkidle" })
  await page_.evaluate(() => document.fonts.ready)
  await page_.screenshot({ path: join(OUT, `${name}.jpg`), type: "jpeg", quality: 92 })
  console.log(name)
}
await browser.close()

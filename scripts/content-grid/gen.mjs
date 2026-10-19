/**
 * Instagram grid for SANDER (12 posts, 1080×1350): blurred film photos,
 * hand-drawn marker type, grainy graphite and SANDER lime, small corner info.
 * Photos in photos/ are generated (Higgsfield): fictional people, barefoot, no brands.
 *   node scripts/content-grid/gen.mjs        (CHROME=… to pick a Chromium binary)
 * Output: scripts/content-grid/out/*.jpg. Captions in README.md.
 */
import { chromium } from "playwright"
import { readFileSync, mkdirSync } from "fs"
import { join, dirname, extname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const RAW = join(__dirname, "photos")
const OUT = join(__dirname, "out")
mkdirSync(OUT, { recursive: true })
const MIME = { ".jpg": "image/jpeg", ".webp": "image/webp", ".png": "image/png" }
const img = (n) => `data:${MIME[extname(n)]};base64,${readFileSync(join(RAW, n)).toString("base64")}`
const logo = `data:image/png;base64,${readFileSync(join(__dirname, "..", "..", "public", "icon-192.png")).toString("base64")}`

const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>')}")`

const CSS = `
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1350px;overflow:hidden;position:relative;color:#fff;font-family:'Inter',sans-serif;background:#151515}
.dark{background:radial-gradient(75% 60% at 50% 45%,#2c2c2c 0%,#171717 70%,#0e0e0e 100%)}
.photo{position:absolute;inset:0;background-size:cover;background-position:center}
.veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.05) 35%,rgba(0,0,0,.1) 60%,rgba(0,0,0,.55))}
.grain{position:absolute;inset:0;background-image:${GRAIN};opacity:.22;mix-blend-mode:overlay;pointer-events:none;z-index:9}
.meta{position:absolute;left:56px;right:56px;display:flex;justify-content:space-between;font-size:21px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;line-height:1.25;z-index:5}
.meta.top{top:52px}.meta.bot{bottom:52px;align-items:flex-end}
.meta div:nth-child(2){text-align:center}.meta div:last-child{text-align:right}
.hand{font-family:'Mansalva',cursive;line-height:.9;-webkit-text-stroke:3px #fff;color:#fff}
.out{color:transparent;-webkit-text-stroke:5px #fff}
.caps{font-family:'Gochi Hand',cursive;text-transform:uppercase;line-height:.88}
.abs{position:absolute;z-index:4}
.center{left:0;right:0;text-align:center}
.body{font-size:30px;line-height:1.35;font-weight:500}
.rows{position:absolute;left:56px;right:56px;bottom:60px;z-index:5;font-size:23px;text-transform:uppercase;letter-spacing:.05em;font-weight:500}
.rows div{display:flex;justify-content:space-between;padding:10px 0;border-top:1px solid rgba(255,255,255,.35)}
.pill{border:2px solid #fff;border-radius:999px;padding:12px 28px;font-size:22px;font-weight:600;letter-spacing:.06em;text-transform:uppercase}
.sched{font-size:28px;line-height:1.3}
.sched div{display:grid;grid-template-columns:150px 1fr;gap:20px;padding:14px 0}
.sched b{font-weight:700}
table{border-collapse:collapse;font-size:30px;width:100%}
td,th{padding:18px 10px;border-bottom:1.5px solid rgba(255,255,255,.4);text-align:left}
th{font-size:22px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;opacity:.8}
td:last-child,th:last-child{text-align:right}
.lime{color:#c6f736;-webkit-text-stroke-color:#c6f736}
.out.lime{color:transparent}
.limebg{background:radial-gradient(80% 65% at 50% 45%,#d4ff4a 0%,#c6f736 60%,#a9d61f 100%);color:#0b0b0c}
.limebg .hand{color:#0b0b0c;-webkit-text-stroke-color:#0b0b0c}
.limebg .out{color:transparent;-webkit-text-stroke-color:#0b0b0c}
.limebg .caps{color:#0b0b0c}
.limebg .sched b{color:#0b0b0c}
.limebg .grain{mix-blend-mode:multiply;opacity:.18}
.pill.fill{background:#c6f736;border-color:#c6f736;color:#0b0b0c}
.sched b.t{color:#c6f736}
`

const top = (a, b, c) => `<div class="meta top"><div>${a}</div><div>${b}</div><div>${c}</div></div>`
const bot = (a, b, c) => `<div class="meta bot"><div>${a}</div><div>${b}</div><div>${c}</div></div>`
const photo = (n, extra = "") => `<div class="photo" style="background-image:url(${img(n)});${extra}"></div><div class="veil"></div>`

const POSTS = [
  // 1 · photo + outlined wordmark
  ["01-sander", "", photo("dive.jpg") + top("Community<br>beach volley", "Gratis", "@sanderbeachvolley") +
    `<div class="abs center hand out lime" style="top:440px;font-size:260px">Sander</div>
     <div class="rows"><div><span>Dove</span><span>Riviera Romagnola</span></div><div><span>Quando</span><span>Tutti i giorni</span></div><div><span>Come</span><span>sanderbv.it</span></div></div>`],
  // 2 · dark: Scopri
  ["02-scopri", "dark", top("Novità", "Scopri", "Gratis") +
    `<div class="abs hand" style="left:56px;top:330px;font-size:250px">Scopri</div>
     <div class="abs body" style="left:60px;top:640px;width:520px">Trova con chi giocare. Like a una foto o a una risposta, con un commento. Se è match, si gioca.</div>
     <div class="abs hand out lime" style="right:56px;bottom:90px;font-size:300px">2v2</div>`],
  // 3 · photo + stickers
  ["03-sticker", "", photo("feet.jpg") +
    `<img class="abs" src="${img("stickers.webp")}" style="left:90px;top:90px;width:900px;filter:drop-shadow(0 12px 24px rgba(0,0,0,.45))">`],
  // 4 · dark: schedule
  ["04-giornata", "dark", top("Scopri", "Un giorno qualunque", "Riviera") +
    `<div class="abs center hand" style="top:190px;font-size:150px">La giornata<br>tipo</div>
     <div class="abs sched" style="left:120px;right:120px;top:560px">
       <div><b class="t">08:00</b><span>Apri SANDER: il più compatibile di oggi</span></div>
       <div><b class="t">12:30</b><span>Like a una risposta, con un commento</span></div>
       <div><b class="t">17:00</b><span>È match: chat e scelta del bagno</span></div>
       <div><b class="t">18:30</b><span>2v2 in spiaggia</span></div>
       <div><b class="t">20:00</b><span>Spritz e classifica aggiornata</span></div>
     </div>` + bot("Stagione 2026", "", "sanderbv.it")],
  // 5 · photo: Libero oggi
  ["05-libero", "", photo("rally.jpg") + top("Libero oggi", "", "Stasera") +
    `<div class="abs center hand out" style="top:430px;font-size:240px">Libero</div>
     <div class="abs center hand lime" style="top:640px;font-size:260px">oggi?</div>
     <div class="abs lime" style="left:56px;bottom:60px;font-size:54px;letter-spacing:6px">✺✺✺</div>
     <div class="abs pill fill" style="right:56px;bottom:62px">Un tap</div>`],
  // 6 · dark: score
  ["06-punteggio", "limebg", `<div class="abs center" style="top:56px;font-style:italic;font-size:24px">ogni punto conta.</div>
     <div class="abs center hand" style="top:300px;font-size:360px">21</div>
     <div class="abs center hand out" style="top:640px;font-size:360px">19</div>
     <div class="abs" style="left:56px;top:640px;font-size:22px;letter-spacing:.06em;text-transform:uppercase;font-weight:500">Set point</div>
     <div class="abs" style="right:56px;top:640px;font-size:22px;letter-spacing:.06em;text-transform:uppercase;font-weight:500;text-align:right">Rating<br>+16</div>` +
    bot("La classifica<br>del tuo comune", "", "sanderbv.it")],
  // 7 · photo: big scattered words
  ["07-tramonto", "", photo("set.jpg") + top("Quando vuoi", "", "Gratis") +
    `<div class="abs hand" style="left:40px;top:200px;font-size:250px">Gioca</div>
     <div class="abs hand" style="left:330px;top:470px;font-size:220px">fino al</div>
     <div class="abs hand lime" style="left:60px;top:760px;font-size:250px">tramonto</div>
     <div class="abs" style="right:60px;top:430px;font-size:21px;text-transform:uppercase;letter-spacing:.06em;text-align:right">Dove vuoi<br>con chi vuoi</div>`],
  // 8 · dark: divisions table
  ["08-livelli", "dark", top("Stagione 2026", "", "Rating") +
    `<div class="abs center hand lime" style="top:220px;font-size:190px">Livelli</div>
     <div class="abs" style="left:150px;right:150px;top:520px"><table>
       <tr><th>Divisione</th><th>Rating</th></tr>
       <tr><td>Sabbia</td><td>da 0</td></tr><tr><td>Onda</td><td>1450</td></tr><tr><td>Corrente</td><td>1600</td></tr>
       <tr><td>Tempesta</td><td>1750</td></tr><tr><td class="lime">Leggenda</td><td class="lime">1900</td></tr></table></div>` +
    bot("Vinci e sali", "", "sanderbv.it")],
  // 9 · photo: SANDER CLUB
  ["09-club", "", photo("group.jpg") + top("Community", "Gratis", "@sanderbeachvolley") +
    `<div class="abs caps" style="left:56px;top:150px;font-size:210px">Sander<br>Club</div>
     <div class="abs" style="left:60px;top:560px;font-size:24px;line-height:1.6;text-transform:uppercase;letter-spacing:.05em"><b>Dove</b>&nbsp;&nbsp; Rimini · Riccione · Cervia<br><b>Chi</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Chiunque abbia voglia di giocare</div>
     <div class="abs caps lime" style="left:56px;bottom:40px;font-size:260px">2v2</div>
     <div class="abs" style="right:56px;bottom:62px;font-size:21px;text-transform:uppercase;letter-spacing:.06em;text-align:right">Pronti<br>a giocare</div>`],
  // 10 · dark: month changelog
  ["10-ottobre", "limebg", `<div class="abs caps" style="left:-20px;top:-40px;font-size:330px;white-space:nowrap">Ottobre</div>
     <div class="abs" style="left:56px;top:330px;font-size:24px;text-transform:uppercase;letter-spacing:.08em;opacity:.8">Le novità del mese</div>
     <div class="abs sched" style="left:56px;right:56px;top:420px;font-size:34px">
       <div><b class="caps" style="font-size:80px">01</b><span><b>Scopri</b><br>Trova con chi giocare</span></div>
       <div><b class="caps" style="font-size:80px">02</b><span><b>Coppie 2v2</b><br>Sfide e classifica di coppia</span></div>
       <div><b class="caps" style="font-size:80px">03</b><span><b>Libero oggi</b><br>Passa davanti nei mazzi</span></div>
       <div><b class="caps" style="font-size:80px">04</b><span><b>Presenze verificate</b><br>Chi si presenta ha il badge</span></div>
     </div>` + bot("", "", "sanderbv.it")],
  // 11 · photo: invite
  ["11-amico", "", photo("spike.jpg", "filter:contrast(1.05)") +
    `<div class="abs center" style="top:70px;display:flex;justify-content:center;align-items:center;gap:22px;font-size:34px">
       <img src="${logo}" style="width:72px;height:72px;border-radius:18px"><span>×</span><span class="hand" style="-webkit-text-stroke:1px #fff;font-size:64px">te</span></div>
     <div class="abs center caps" style="bottom:200px;font-size:170px">Porta<br><span class="lime">un amico</span></div>
     <div class="abs center" style="bottom:110px;font-size:26px;letter-spacing:.06em;text-transform:uppercase">SC in regalo a tutti e due</div>`],
  // 12 · dark: scattered letters
  ["12-piedi-nudi", "dark", top("Community", "Gratis", "@sanderbeachvolley") +
    `<div class="abs hand" style="left:70px;top:220px;font-size:270px">A</div>
     <div class="abs hand" style="left:330px;top:300px;font-size:250px;transform:rotate(-6deg)">piedi</div>
     <div class="abs hand lime" style="left:120px;top:640px;font-size:290px;transform:rotate(4deg)">nudi</div>
     <div class="abs" style="left:690px;top:240px;font-size:22px;text-transform:uppercase;letter-spacing:.06em;line-height:1.4">Dress code<br><b>zero scarpe</b></div>
     <div class="abs" style="left:70px;bottom:120px;font-size:22px;text-transform:uppercase;letter-spacing:.06em;line-height:1.4">Sabbia, sole<br>e un pallone</div>`],
]

const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {})
const p = await b.newPage({ viewport: { width: 1080, height: 1350 } })
for (const [name, cls, html] of POSTS) {
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Mansalva&family=Gochi+Hand&family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body class="${cls}">${html}<div class="grain"></div></body></html>`)
  await p.waitForLoadState("networkidle").catch(() => {})
  await p.waitForTimeout(500)
  await p.screenshot({ path: join(OUT, `${name}.jpg`), type: "jpeg", quality: 92 })
  console.log("saved", name)
}
await b.close()

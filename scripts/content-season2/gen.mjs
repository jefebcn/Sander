/**
 * "Stagione 2" relaunch for @sanderbeachvolley, same look as the grid
 * (scripts/content-grid): carousel (1080×1350), highlight covers and the
 * stories that go in each highlight (1080×1920).
 *   node scripts/content-season2/gen.mjs      (CHROME=… to pick a Chromium binary)
 * Output: scripts/content-season2/out/{carosello,copertine,storie}/*.jpg. Texts in README.md.
 */
import { chromium } from "playwright"
import { mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { HeartHandshake, Trophy, Lightbulb, Star, Heart, MessageCircle, CalendarCheck, Search, Volleyball, TrendingUp, ScanFace, Sun } from "lucide-react"
import { CSS, FONTS, top, bot, photo, logo } from "../content-grid/style.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, "out")

/* Text-heavy pages sit on a darkened, blurred beach photo (or lime), never
   on plain graphite: grey backgrounds break the summer mood. */
const dim = (n) => photo(n, "filter:blur(7px) brightness(.5) saturate(1.1);transform:scale(1.08)")

const icon = (I, size, color = "#c6f736", stroke = 1.6) => renderToStaticMarkup(createElement(I, { size, color, strokeWidth: stroke }))

/* Stories: 1080×1920. Instagram covers the top ~250 px (bar, name) and the
   bottom ~340 px (reply box, stickers): text stays between. */
const STORY = `
body.story{height:1920px}
.story .meta.top{top:260px}.story .meta.bot{bottom:360px}
.steps{position:absolute;left:80px;right:80px;z-index:5;display:flex;flex-direction:column;gap:46px}
.step{display:grid;grid-template-columns:120px 1fr;gap:28px;align-items:center}
.step .n{font-family:'Gochi Hand',cursive;font-size:110px;line-height:.8;color:#c6f736}
.limebg .step .n{color:#0b0b0c}
.step b{display:block;font-size:46px;font-weight:700;margin-bottom:6px}
.step span{font-size:32px;line-height:1.3;opacity:.9}
.chip{display:inline-flex;align-items:center;gap:16px;border:2px solid #fff;border-radius:999px;padding:18px 34px;font-size:30px;font-weight:600;letter-spacing:.05em;text-transform:uppercase}
.chip.fill{background:#c6f736;border-color:#c6f736;color:#0b0b0c}
.limebg td,.limebg th{border-color:rgba(11,11,12,.45)}.limebg .lime{color:#0b0b0c}.limebg .chip{border-color:#0b0b0c}
.card{position:absolute;left:110px;right:110px;z-index:5;background:#1b1f20;border-radius:36px;box-shadow:0 30px 60px rgba(0,0,0,.5);border:2px solid rgba(198,247,54,.35);overflow:hidden}
.card .hd{background:rgba(198,247,54,.14);color:#c6f736;padding:22px 34px;font-size:24px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.card .bd{padding:28px 34px;font-size:34px;line-height:1.4}
.card .row{display:grid;grid-template-columns:1fr 1fr;gap:18px;padding:0 28px 30px}
.card .btn{border-radius:999px;padding:22px 0;text-align:center;font-size:30px;font-weight:800}
`

// Highlight covers: Instagram shows a circle cut from the middle, so the
// icon sits dead centre with plenty of air.
const cover = (I) => `<div class="abs" style="left:0;right:0;top:0;bottom:0;display:flex;align-items:center;justify-content:center">
  <div style="width:560px;height:560px;border-radius:50%;border:6px solid #0b0b0c;display:flex;align-items:center;justify-content:center">${icon(I, 300, "#0b0b0c", 1.4)}</div></div>`

const CAROUSEL = [
  // 1 · cover
  ["01-stagione-2", "", photo("group.jpg") + top("Sander", "Riviera Romagnola", "Da oggi") +
    `<div class="abs center hand out" style="top:300px;font-size:250px">Stagione</div>
     <div class="abs center hand lime" style="top:500px;font-size:560px;line-height:.8">2</div>
     <div class="rows"><div><span>Cosa</span><span>Il beach volley in un'app</span></div><div><span>Per chi</span><span>Chiunque voglia giocare</span></div><div><span>Quanto</span><span>Gratis</span></div></div>`],
  // 2 · season 1, thanks
  ["02-stagione-1", "", dim("dive.jpg") + top("Stagione 1", "Grazie", "02·05·26") +
    `<div class="abs hand" style="left:56px;top:250px;font-size:200px">Stagione 1</div>
     <div class="abs body" style="left:60px;top:520px;right:100px;font-size:40px;line-height:1.4">Il primo torneo. La prima classifica. I primi di voi in campo.</div>
     <div class="abs hand lime" style="left:56px;bottom:200px;font-size:150px">Grazie.</div>` +
    bot("Si riparte", "", "sanderbv.it")],
  // 3 · Scopri
  ["03-scopri", "", photo("rally.jpg") + top("Novità", "Scopri", "Gratis") +
    `<div class="abs hand" style="left:56px;top:200px;font-size:170px">Trova con chi</div>
     <div class="abs hand lime" style="left:56px;top:380px;font-size:260px">giocare</div>
     <div class="abs body" style="left:60px;bottom:150px;width:640px;font-size:36px">Like a una foto o a una risposta, con un commento. Se è match, si gioca.</div>`],
  // 4 · what's new
  ["04-novita", "", dim("feet.jpg") + top("Stagione 2", "Le novità", "sanderbv.it") +
    `<div class="abs center hand" style="top:200px;font-size:170px">Cosa cambia</div>
     <div class="abs sched" style="left:80px;right:80px;top:470px;font-size:34px">
       <div><b class="caps t" style="font-size:80px">01</b><span><b>Scopri</b><br>Il compagno giusto, vicino a te</span></div>
       <div><b class="caps t" style="font-size:80px">02</b><span><b>Proponi una partita</b><br>«Ci sto» e la partita si crea da sola</span></div>
       <div><b class="caps t" style="font-size:80px">03</b><span><b>Foto verificata</b><br>Un selfie e tutti sanno che sei tu</span></div>
       <div><b class="caps t" style="font-size:80px">04</b><span><b>Libero oggi</b><br>Un tap e i tuoi match lo sanno</span></div>
     </div>`],
  // 5 · more than a game (soft)
  ["05-oltre-il-campo", "limebg", `<div class="abs center" style="top:56px;font-style:italic;font-size:26px">si viene per giocare.</div>
     <div class="abs center hand" style="top:330px;font-size:200px">E se poi</div>
     <div class="abs center hand out" style="top:540px;font-size:210px">nasce</div>
     <div class="abs center hand" style="top:760px;font-size:200px">qualcosa…</div>` +
    bot("Meglio ancora", "", "sanderbv.it")],
  // 6 · call to action
  ["06-entra", "", photo("set.jpg") + top("Gratis", "", "Link in bio") +
    `<div class="abs center hand" style="top:300px;font-size:200px">Entra in</div>
     <div class="abs center hand out lime" style="top:500px;font-size:260px">campo</div>
     <div class="abs center" style="bottom:120px;display:flex;flex-direction:column;align-items:center;gap:26px">
       <img src="${logo}" style="width:120px;height:120px;border-radius:28px">
       <span class="hand" style="font-size:80px;-webkit-text-stroke:2px #fff">sanderbv.it</span></div>`],
]

const COVERS = [
  ["scopri", HeartHandshake],
  ["tornei", Trophy],
  ["come-funziona", Lightbulb],
  ["stagione-1", Star],
]

const STORIES = [
  // Scopri
  ["scopri-1", "story", photo("rally.jpg") + top("Scopri", "", "Gratis") +
    `<div class="abs hand" style="left:70px;top:480px;font-size:220px">Trova</div>
     <div class="abs hand" style="left:70px;top:690px;font-size:170px">con chi</div>
     <div class="abs hand lime" style="left:70px;top:870px;font-size:250px">giocare</div>
     <div class="abs center" style="bottom:400px"><span class="chip">Il beach volley della Riviera</span></div>`],
  ["scopri-2", "story limebg", top("Scopri", "Come funziona", "") +
    `<div class="abs center hand" style="top:380px;font-size:150px">In tre tocchi</div>
     <div class="steps" style="top:680px">
       <div class="step"><div class="n">01</div><div><b>${icon(Heart, 40, "#0b0b0c")} Like</b><span>A una foto o a una risposta, con un commento</span></div></div>
       <div class="step"><div class="n">02</div><div><b>${icon(MessageCircle, 40, "#0b0b0c")} Match</b><span>Se ricambia, si apre la chat</span></div></div>
       <div class="step"><div class="n">03</div><div><b>${icon(Volleyball, 40, "#0b0b0c")} In campo</b><span>Scegliete il bagno e giocate</span></div></div>
     </div>`],
  ["scopri-3", "story", dim("group.jpg") + top("Scopri", "Novità", "") +
    `<div class="abs center hand" style="top:360px;font-size:150px">Proponi una</div>
     <div class="abs center hand lime" style="top:520px;font-size:200px">partita</div>
     <div class="card" style="top:860px"><div class="hd">Ti propone una partita</div>
       <div class="bd">${icon(CalendarCheck, 34)} Sabato · 18:30<br>Bagno 26 · Rimini</div>
       <div class="row"><div class="btn" style="background:#2c3233;color:#fff">Non posso</div><div class="btn" style="background:#c6f736;color:#0b0b0c">Ci sto</div></div></div>
     <div class="abs center" style="bottom:390px;font-size:32px;opacity:.9">«Ci sto» e la partita si crea da sola</div>`],
  // Tornei
  ["tornei-1", "story", photo("spike.jpg") + top("Tornei", "", "Riviera") +
    `<div class="abs center caps" style="top:460px;font-size:240px">Tornei</div>
     <div class="abs center caps lime" style="top:690px;font-size:240px">Sander</div>
     <div class="steps" style="bottom:420px">
       <div class="step"><div class="n">01</div><div><b>Iscriviti dall'app</b><span>Da solo o con la tua coppia</span></div></div>
       <div class="step"><div class="n">02</div><div><b>Tabellone live</b><span>Risultati e classifica in tempo reale</span></div></div>
     </div>`],
  ["tornei-2", "story", dim("spike.jpg") + top("Tornei", "", "") +
    `<div class="abs center hand" style="top:480px;font-size:180px">Il prossimo</div>
     <div class="abs center hand out" style="top:680px;font-size:220px">torneo</div>
     <div class="abs center" style="top:1000px;font-size:38px;line-height:1.4;font-weight:600">Lo annunciamo qui nelle storie.<br>Iscrizioni su sanderbv.it</div>
     <div class="abs center" style="bottom:400px"><span class="chip fill">Attiva le notifiche</span></div>`],
  // Come funziona
  ["come-1", "story", dim("dive.jpg") + top("Come funziona", "", "Gratis") +
    `<div class="abs center hand" style="top:420px;font-size:170px">Entra in</div>
     <div class="abs center hand lime" style="top:600px;font-size:230px">1 minuto</div>
     <div class="steps" style="top:960px">
       <div class="step"><div class="n">${icon(Search, 70)}</div><div><b>Registrati</b><span>Email o Google, è gratis</span></div></div>
       <div class="step"><div class="n">${icon(ScanFace, 70)}</div><div><b>Crea la tua carta</b><span>Nome, ruolo, comune, livello</span></div></div>
     </div>`],
  ["come-2", "story", photo("feet.jpg") + top("Come funziona", "", "") +
    `<div class="abs hand" style="left:70px;top:460px;font-size:180px">Trova</div>
     <div class="abs hand" style="left:70px;top:640px;font-size:150px">una partita</div>
     <div class="abs hand lime" style="left:70px;top:820px;font-size:170px">o creala</div>
     <div class="abs" style="left:76px;right:76px;bottom:420px;font-size:36px;line-height:1.4">Le partite del tuo comune, i posti liberi, e se manca uno SANDER avvisa chi gioca vicino.</div>`],
  ["come-3", "story limebg", top("Come funziona", "", "") +
    `<div class="abs center hand" style="top:400px;font-size:170px">Gioca e</div>
     <div class="abs center hand out" style="top:580px;font-size:230px">sali</div>
     <div class="abs" style="left:150px;right:150px;top:900px"><table>
       <tr><td>Sabbia</td><td>${icon(TrendingUp, 34, "#0b0b0c")}</td></tr><tr><td>Onda</td><td></td></tr><tr><td>Corrente</td><td></td></tr>
       <tr><td>Tempesta</td><td></td></tr><tr><td class="lime">Leggenda</td><td class="lime">${icon(Sun, 34, "#0b0b0c")}</td></tr></table></div>
     <div class="abs center" style="bottom:400px;font-size:32px">Ogni partita sposta il tuo punteggio</div>`],
  // Stagione 1
  ["stagione1-1", "story", dim("set.jpg") + top("Stagione 1", "", "02·05·26") +
    `<div class="abs center hand" style="top:520px;font-size:200px">Stagione 1</div>
     <div class="abs center" style="top:800px;font-size:40px;line-height:1.5">Il primo torneo SANDER.<br>Le foto, i risultati, la prima classifica.</div>
     <div class="abs center hand lime" style="bottom:460px;font-size:140px">Grazie a tutti</div>`],
]

const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {})
const p = await b.newPage({ viewport: { width: 1080, height: 1350 } })
async function render(dir, name, cls, html, height) {
  mkdirSync(join(OUT, dir), { recursive: true })
  await p.setViewportSize({ width: 1080, height })
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8">${FONTS}
<style>${CSS}${STORY}</style></head><body class="${cls}">${html}<div class="grain"></div></body></html>`)
  await p.waitForLoadState("networkidle").catch(() => {})
  await p.waitForTimeout(500)
  await p.screenshot({ path: join(OUT, dir, `${name}.jpg`), type: "jpeg", quality: 92 })
  console.log("saved", dir, name)
}
for (const [name, cls, html] of CAROUSEL) await render("carosello", name, cls, html, 1350)
for (const [name, I] of COVERS) await render("copertine", name, "story limebg", cover(I), 1920)
for (const [name, cls, html] of STORIES) await render("storie", name, cls, html, 1920)
await b.close()

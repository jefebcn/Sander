/**
 * Instagram carousels (1080×1350, 4:5) for the Scopri launch: real app screens
 * on demo data, generated background photos (bg/), SANDER dark + lime.
 *   node scripts/store-demo-photos.mjs   (demo photos on the local profiles)
 *   BASE=http://localhost:3000 node scripts/content-scopri/gen.mjs
 * Output: scripts/content-scopri/out/<post>-<n>.png. Captions in README.md.
 */
import { chromium } from "playwright"
import { mkdir, readFile } from "fs/promises"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, "out")
const BASE = process.env.BASE ?? "http://localhost:3000"
const b64 = async (p) => (await readFile(p)).toString("base64")

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {})

// ── 1. Real app screens ─────────────────────────────────────────────────────
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

async function shot(path, prepare) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" })
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" })
  if (prepare) await prepare()
  await page.waitForTimeout(1200)
  return (await page.screenshot()).toString("base64")
}
const screens = {
  deck: await shot("/scopri", () => page.evaluate(() => window.scrollTo(0, 330))),
  pick: await shot("/scopri"),
  like: await shot("/scopri", async () => {
    await page.getByRole("button", { name: /^Metti like alla risposta/ }).first().click()
    await page.locator("textarea").fill("Anch'io gioco a Riccione la sera, ci stai sabato?")
  }),
  match: await shot("/scopri/match"),
  coppie: await shot("/scopri/coppie", () => page.getByRole("button", { name: "Classifica" }).click().catch(() => {})),
}

// ── 2. Slides ───────────────────────────────────────────────────────────────
const logo = await b64(join(__dirname, "..", "..", "public", "icon-192.png"))
const bg = {}
for (const k of ["highfive", "waiting", "pair", "morning"]) bg[k] = await b64(join(__dirname, "bg", `${k}.jpg`))

// Words wrapped in *stars* are lime.
const em = (s) => s.replace(/\*([\s\S]+?)\*/g, "<em>$1</em>")

const POSTS = [
  {
    id: "p1-scopri",
    slides: [
      { kind: "hook", bg: "highfive", kicker: "NOVITÀ · SCOPRI", big: "Il tuo compagno\nper il 2v2\n*è a 2 km da te.*", sub: "Solo che non vi conoscete ancora." },
      { kind: "phone", screen: "deck", kicker: "1 · SCORRI", big: "I giocatori\n*della tua zona.*", sub: "Livello, ruolo, orari: vedi subito chi fa per te." },
      { kind: "phone", screen: "like", kicker: "2 · LIKE", big: "Like a una foto\no a una risposta.\n*Con un commento.*", sub: "Chi riceve un commento risponde molto più spesso." },
      { kind: "phone", screen: "match", kicker: "3 · MATCH", big: "È match?\n*Si gioca.*", sub: "Chat, giorno, bagno: la partita va in calendario." },
      { kind: "phone", screen: "pick", kicker: "OGNI MATTINA", big: "Il più compatibile\n*di oggi.*", sub: "Uno solo, scelto per te. Vale la pena aprire l'app." },
      { kind: "cta", big: "Trova con chi\ngiocare.\n*A colpi di swipe.*", sub: "Scopri è su SANDER. Gratis." },
    ],
  },
  {
    id: "p2-whatsapp",
    slides: [
      { kind: "hook", bg: "waiting", kicker: "STORIE VERE", big: "Cercare un compagno\nper il beach\n*su WhatsApp* 💀", sub: "Scorri, ti riconoscerai." },
      { kind: "meme", chat: [{ from: "me", text: "Chi c'è sabato alle 18? 🏐", meta: "Visualizzato da 47" }], big: "*0 risposte.*", sub: "Il gruppo «Beach Rimini 🏖️» al suo meglio." },
      { kind: "meme", chat: [{ from: "me", text: "Allora? Ci siamo?" }, { from: "them", text: "Io forse 🤙" }], big: "«Io forse»", sub: "Traduzione: *non verrà.*" },
      { kind: "meme", emoji: "😬", big: "Si presenta uno\nlivello *Leggenda.*", sub: "Tu sei livello Sabbia. Saranno 21-3." },
      { kind: "meme", chat: [{ from: "them", text: "Arrivo tra 5 minuti", meta: "1 ora fa" }], big: "Alla fine\n*giochi in 3.*", sub: "Il quarto è ancora «per strada»." },
      { kind: "cta", big: "Oppure:\n*Scopri.*", sub: "Stesso livello, stessa zona, stessa voglia di giocare." },
    ],
  },
  {
    id: "p3-coppie",
    slides: [
      { kind: "hook", bg: "pair", kicker: "COPPIE 2V2", big: "Hai una coppia fissa?\n*Ora avete\nuna classifica.*", sub: "" },
      { kind: "meme", emoji: "🤝", big: "Formate\n*la coppia.*", sub: "Nome, frase, e siete pronti." },
      { kind: "meme", emoji: "⚔️", big: "Sfidate\n*le altre coppie.*", sub: "Se accettano, vi mettiamo tutti e 4 in chat." },
      { kind: "phone", screen: "coppie", kicker: "PUNTEGGIO DI COPPIA", big: "Ogni partita\n*muove la classifica.*", sub: "Battete chi sta sopra e salite." },
      { kind: "cta", big: "Chi è la coppia\n*più forte\ndella Riviera?*", sub: "Scopritelo su SANDER." },
    ],
  },
  {
    id: "p4-affidabili",
    slides: [
      { kind: "hook", bg: "morning", kicker: "AFFIDABILITÀ", big: "Quello che dice\n«ci sono»…\n*e non si presenta.*", sub: "Lo conosciamo tutti." },
      { kind: "meme", emoji: "✅", big: "Su SANDER\nchi si presenta\n*ha il badge.*", sub: "Giocatore verificato: lo vedi subito sul profilo." },
      { kind: "meme", emoji: "📉", big: "Chi salta le partite\n*scende nei suggerimenti.*", sub: "E se ti segnano assente per errore, lo contesti." },
      { kind: "cta", big: "Partite piene,\n*compagni veri.*", sub: "Ci vediamo in spiaggia." },
    ],
  },
]

const CSS = `
  *{box-sizing:border-box}
  body{margin:0;width:1080px;height:1350px;overflow:hidden;position:relative;background:#0b0b0c;color:#fff;font-family:'Figtree',system-ui,sans-serif}
  .brand{position:absolute;left:64px;top:56px;display:flex;align-items:center;gap:14px;z-index:3}
  .brand img{width:52px;height:52px;border-radius:13px}
  .brand span{font-family:'Bricolage Grotesque';font-weight:800;font-size:28px;letter-spacing:.16em;font-stretch:85%}
  .count{position:absolute;right:64px;top:66px;z-index:3;font-weight:700;font-size:24px;color:rgba(255,255,255,.6)}
  .kicker{display:inline-block;font-weight:800;font-size:26px;letter-spacing:.14em;color:#0b0b0c;background:#c6f736;padding:10px 18px;border-radius:999px}
  h1{font-family:'Bricolage Grotesque';font-weight:800;font-stretch:85%;letter-spacing:-.015em;line-height:.98;margin:24px 0 0;white-space:pre-line}
  h1 em{font-style:normal;color:#c6f736;text-shadow:0 0 40px rgba(198,247,54,.35)}
  .sub{font-size:36px;line-height:1.3;color:rgba(255,255,255,.82);margin-top:26px;white-space:pre-line}
  .sub em{font-style:normal;color:#c6f736;font-weight:700}
  .swipe{position:absolute;right:64px;bottom:64px;z-index:3;display:flex;align-items:center;gap:12px;font-weight:800;font-size:28px;color:#0b0b0c;background:#fff;padding:14px 24px;border-radius:999px}
  /* hook: duotone photo */
  .photo{position:absolute;inset:0;background-size:cover;background-position:center;filter:saturate(1.1) contrast(1.05)}
  .shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,11,12,.6) 0%,rgba(11,11,12,0) 22%,rgba(11,11,12,0) 42%,rgba(11,11,12,.88) 72%,#0b0b0c 100%)}
  .hook .txt{position:absolute;left:64px;right:64px;bottom:150px;z-index:2}
  .hook h1{font-size:104px;text-shadow:0 4px 30px rgba(0,0,0,.5)}
  /* phone */
  .col{position:absolute;left:64px;right:64px;top:140px;bottom:0;display:flex;flex-direction:column;align-items:flex-start;z-index:2}
  .phone h1{font-size:72px}
  .phone .sub{font-size:30px;margin-top:14px}
  .device{flex-shrink:0;align-self:center;margin-top:44px;width:600px;height:1200px;border-radius:64px;overflow:hidden;box-shadow:0 0 0 10px #1a1b1e,0 0 0 11px #2b2c31,0 40px 90px rgba(0,0,0,.7)}
  .device img{width:100%;display:block}
  .glow{position:absolute;left:50%;bottom:-200px;transform:translateX(-50%);width:900px;height:700px;background:radial-gradient(closest-side,rgba(198,247,54,.22),transparent);z-index:0}
  /* meme */
  .meme .txt{position:absolute;left:64px;right:64px;top:50%;transform:translateY(-50%);z-index:2}
  .meme .emoji{font-size:140px;line-height:1}
  .meme h1{font-size:112px}
  .meme .sub{font-size:44px}
  .bgglow{position:absolute;inset:0;background:radial-gradient(70% 50% at 80% 10%,rgba(198,247,54,.14),transparent 70%)}
  .chat{display:flex;flex-direction:column;gap:18px;margin-bottom:56px}
  .bubble{max-width:760px;padding:26px 34px;border-radius:40px;font-size:46px;line-height:1.2;font-weight:600}
  .bubble.me{align-self:flex-end;background:#c6f736;color:#0b0b0c;border-bottom-right-radius:12px}
  .bubble.them{align-self:flex-start;background:#222327;color:#fff;border-bottom-left-radius:12px}
  .bubble small{display:block;margin-top:10px;font-size:26px;font-weight:700;opacity:.65}
  /* cta */
  .cta .txt{position:absolute;left:64px;right:64px;top:50%;transform:translateY(-55%);z-index:2}
  .cta .bigl{width:150px;height:150px;border-radius:36px;margin-bottom:24px}
  .cta h1{font-size:110px}
  .cta .url{position:absolute;left:64px;right:64px;bottom:72px;display:flex;justify-content:space-between;align-items:center;z-index:2}
  .cta .url b{font-family:'Bricolage Grotesque';font-weight:800;font-size:44px;color:#c6f736;font-stretch:85%}
  .cta .url span{font-weight:700;font-size:28px;color:rgba(255,255,255,.7)}
`

function slideHtml(post, s, i) {
  const n = `${i + 1}/${post.slides.length}`
  const brand = `<div class="brand"><img src="data:image/png;base64,${logo}"><span>SANDER</span></div><div class="count">${n}</div>`
  const kicker = s.kicker ? `<span class="kicker">${s.kicker}</span>` : ""
  const sub = s.sub ? `<div class="sub">${em(s.sub)}</div>` : ""
  const swipe = i === 0 ? `<div class="swipe">Scorri →</div>` : ""
  let body = ""
  if (s.kind === "hook") {
    body = `<div class="photo" style="background-image:url(data:image/jpeg;base64,${bg[s.bg]})"></div><div class="shade"></div>
      <div class="txt">${kicker}<h1>${em(s.big)}</h1>${sub}</div>${swipe}`
  } else if (s.kind === "phone") {
    body = `<div class="bgglow"></div><div class="glow"></div><div class="col"><div>${kicker}<h1>${em(s.big)}</h1>${sub}</div>
      <div class="device"><img src="data:image/png;base64,${screens[s.screen]}"></div></div>`
  } else if (s.kind === "meme") {
    const chat = s.chat ? `<div class="chat">${s.chat.map((c) => `<div class="bubble ${c.from}">${c.text}${c.meta ? `<small>${c.meta}</small>` : ""}</div>`).join("")}</div>` : `<div class="emoji">${s.emoji}</div>`
    body = `<div class="bgglow"></div><div class="txt">${chat}<h1>${em(s.big)}</h1>${sub}</div>`
  } else {
    body = `<div class="bgglow"></div><div class="txt"><img class="bigl" src="data:image/png;base64,${logo}"><h1>${em(s.big)}</h1>${sub}</div>
      <div class="url"><b>sanderbv.it</b><span>Link in bio</span></div>`
  }
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,800&family=Figtree:wght@500;700;800&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body class="${s.kind}">${brand}${body}</body></html>`
}

const board = await browser.newPage({ viewport: { width: 1080, height: 1350 } })
for (const post of POSTS) {
  for (const [i, s] of post.slides.entries()) {
    await board.setContent(slideHtml(post, s, i))
    await board.waitForLoadState("networkidle").catch(() => {})
    await board.waitForTimeout(500)
    await board.screenshot({ path: join(OUT, `${post.id}-${i + 1}.png`) })
  }
  console.log("saved", post.id, post.slides.length)
}
await browser.close()

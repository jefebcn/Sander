/**
 * Generates TikTok photo-carousel slides (1080×1920) as standalone HTML files.
 * Render each with headless Chromium --screenshot (see the bash loop).
 *
 *   node scripts/gen-carousels.mjs <outDir>
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = process.argv[2] || join(__dirname, "tiktok-carousels")
mkdirSync(outDir, { recursive: true })

const LOGO =
  "data:image/png;base64," +
  readFileSync(join(__dirname, "..", "public", "sander-logo.png")).toString("base64")

const ACCENT = "#c9f31d"

// ── Carousels ────────────────────────────────────────────────────────────────
const carousels = [
  {
    id: "c1-carta",
    slides: [
      { kind: "hook", kicker: "LA TUA CARTA", big: ["Il beach volley", "della Riviera ora ha", "le sue FIGURINE."], hl: ["le sue FIGURINE."], emoji: "🃏", swipe: true },
      { kind: "value", kicker: "COME FUNZIONA", big: ["Come le carte", "di FIFA."], hl: ["di FIFA."], sub: "Ma il giocatore sei TU.", emoji: "⚡" },
      { kind: "value", kicker: "PROGRESSIONE", big: ["Sale di livello", "ogni volta", "che vinci."], hl: ["che vinci."], sub: "Bronzo → Argento → Oro", emoji: "📈" },
      { kind: "value", kicker: "LE TUE STAT", big: ["Attacco. Difesa.", "Muro. Ricezione."], sub: "Le tue statistiche reali, in una carta.", emoji: "🏐" },
      { kind: "cta", big: ["Crea la tua", "carta. Gratis."], hl: ["carta. Gratis."], sub: "In 30 secondi, dal telefono." },
    ],
  },
  {
    id: "c2-bagni",
    slides: [
      { kind: "hook", kicker: "RE DEI BAGNI", big: ["Il tuo bagno", "ha un RE."], hl: ["ha un RE."], sub: "(e probabilmente non sei tu)", emoji: "👑", swipe: true },
      { kind: "value", kicker: "TERRITORIO", big: ["Ogni bagno", "della Riviera", "ha la sua classifica."], hl: ["ha la sua classifica."], emoji: "🏖️" },
      { kind: "value", kicker: "LA REGOLA", big: ["Vinci sul campo →", "conquisti il bagno."], hl: ["conquisti il bagno."], sub: "Chi vince di più comanda.", emoji: "🏐" },
      { kind: "value", kicker: "CHI DOMINA?", big: ["26 · 29 · 42", "44 · 60 · 67"], sub: "Qual è il tuo?", emoji: "📍" },
      { kind: "cta", big: ["Conquista", "il tuo bagno."], hl: ["il tuo bagno."], sub: "La classifica del tuo campo ti aspetta." },
    ],
  },
  {
    id: "c3-whatsapp",
    slides: [
      { kind: "hook", kicker: "ORGANIZZARE PARTITE", big: ["Ancora organizzi", "il beach volley", "su WhatsApp?"], hl: ["WhatsApp?"], emoji: "🤦", swipe: true },
      { kind: "value", kicker: "STEP 1", big: ["Crea una partita", "in 2 tap."], hl: ["2 tap."], sub: "Data, campo, formato. Fatto.", emoji: "⚡" },
      { kind: "value", kicker: "STEP 2", big: ["Trova giocatori", "del tuo livello."], hl: ["del tuo livello."], sub: "Niente più squadre sbilanciate.", emoji: "🤝" },
      { kind: "value", kicker: "STEP 3", big: ["Punteggi. Rating.", "Classifiche."], sub: "Tutto in automatico.", emoji: "📊" },
      { kind: "cta", big: ["Smetti di litigare", "nei gruppi."], sub: "Il tuo beach volley, organizzato." },
    ],
  },
  {
    id: "c4-pov",
    slides: [
      { kind: "hook", kicker: "POV", big: ["È agosto a Riccione.", "Vuoi giocare a beach.", "Non trovi nessuno."], hl: ["Non trovi nessuno."], emoji: "🏖️", swipe: true },
      { kind: "value", kicker: "LA REALTÀ", big: ["Il gruppo WhatsApp?", "Tutti ‘forse’.", "Nessun sì."], hl: ["Nessun sì."], emoji: "📵" },
      { kind: "value", kicker: "LA SVOLTA", big: ["Apri SANDER →", "le partite aperte", "vicino a te."], hl: ["vicino a te."], emoji: "📍" },
      { kind: "value", kicker: "UN TAP", big: ["Un tap.", "Sei in campo."], hl: ["Sei in campo."], sub: "Orario, luogo, giocatori. Fatto.", emoji: "⚡" },
      { kind: "cta", big: ["Basta stare", "a guardare."], hl: ["a guardare."], sub: "Trova la tua prossima partita." },
    ],
  },
  {
    id: "c5-hottake",
    slides: [
      { kind: "hook", kicker: "OPINIONE IMPOPOLARE", big: ["Il beach volley", "del bagno è più tosto", "della Serie A."], hl: ["della Serie A."], emoji: "🔥", swipe: true },
      { kind: "value", kicker: "PERCHÉ", big: ["Niente contratti.", "Niente scuse."], hl: ["Niente scuse."], sub: "Solo tu, la sabbia e l'avversario.", emoji: "🏐" },
      { kind: "value", kicker: "E ORA", big: ["C'è pure", "una classifica."], hl: ["una classifica."], sub: "Ogni partita conta davvero.", emoji: "📊" },
      { kind: "value", kicker: "LA LEGGE DELLA SABBIA", big: ["Chi vince sale.", "Chi perde... si allena."], hl: ["Chi vince sale."], emoji: "👑" },
      { kind: "cta", big: ["Dici che", "ho torto?"], hl: ["ho torto?"], sub: "Dimostralo in campo." },
    ],
  },
  {
    id: "c6-riviera",
    slides: [
      { kind: "hook", kicker: "ESTATE IN RIVIERA", big: ["L'estate in Riviera", "ha una sola regola."], hl: ["una sola regola."], emoji: "☀️", swipe: true },
      { kind: "value", kicker: "LA REGOLA", big: ["Scendi. Gioca.", "Ripeti."], hl: ["Ripeti."], sub: "Dal Bagno 26 al 67, il campo ti aspetta.", emoji: "🏐" },
      { kind: "value", kicker: "OGNI CAMPO", big: ["Ogni bagno", "una sfida.", "Ogni sfida un re."], hl: ["Ogni sfida un re."], emoji: "👑" },
      { kind: "value", kicker: "LA TUA CARTA", big: ["E sali di livello", "a ogni vittoria."], hl: ["a ogni vittoria."], sub: "Come una figurina, ma sei tu.", emoji: "📈" },
      { kind: "cta", big: ["La tua estate", "inizia qui."], hl: ["inizia qui."], sub: "Il beach volley della Riviera, in un'app." },
    ],
  },
]

// ── Slide template ───────────────────────────────────────────────────────────
function dots(n, active) {
  return Array.from({ length: n }, (_, i) =>
    `<span style="width:${i === active ? 34 : 12}px;height:12px;border-radius:99px;background:${i === active ? ACCENT : "rgba(255,255,255,0.22)"}"></span>`,
  ).join("")
}

function slideHtml(s, idx, total, carouselId) {
  const isHook = s.kind === "hook"
  const isCta = s.kind === "cta"
  const bigSize = Math.max(78, 150 - s.big.join(" ").length * 1.1)
  const hl = s.hl || []
  const bigLines = s.big
    .map((l) => {
      let html = l
      for (const w of hl) {
        if (html.includes(w)) html = html.replace(w, `<span style="color:${ACCENT}">${w}</span>`)
      }
      return `<div>${html}</div>`
    })
    .join("")

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden}
body{font-family:-apple-system,'SF Pro Display','Helvetica Neue',Arial,sans-serif;color:#fff;
 background:radial-gradient(ellipse 70% 40% at ${idx % 2 ? "0% 0%" : "100% 0%"}, rgba(201,243,29,0.20) 0%, transparent 60%),
 radial-gradient(ellipse 60% 40% at 50% 100%, rgba(201,243,29,0.06) 0%, transparent 55%),
 linear-gradient(170deg,#0d1209 0%,#090b09 45%,#040504 100%)}
.wrap{position:relative;width:1080px;height:1920px;display:flex;flex-direction:column;padding:96px 88px}
.wm{position:absolute;right:-140px;top:640px;width:680px;height:680px;opacity:0.05;background:url('${LOGO}') no-repeat center/contain}
.top{display:flex;align-items:center;gap:22px;z-index:2}
.top img{width:70px;height:70px;object-fit:contain}
.top .name{font-size:38px;font-weight:900;letter-spacing:-1px}
.kicker{margin-top:${isHook ? 90 : 70}px;font-size:34px;font-weight:900;letter-spacing:8px;color:${ACCENT};z-index:2}
.center{flex:1;display:flex;flex-direction:column;justify-content:center;z-index:2}
.emoji{font-size:${isHook ? 150 : 120}px;line-height:1;margin-bottom:40px}
.big{font-size:${isCta ? 120 : bigSize}px;font-weight:900;line-height:1.02;letter-spacing:-3px}
.sub{margin-top:40px;font-size:${isHook ? 44 : 48}px;font-weight:700;color:rgba(255,255,255,0.62);line-height:1.25}
.foot{display:flex;flex-direction:column;gap:34px;z-index:2}
.swipe{align-self:flex-start;display:flex;align-items:center;gap:14px;background:rgba(201,243,29,0.14);border:2px solid rgba(201,243,29,0.4);
 color:${ACCENT};border-radius:99px;padding:18px 40px;font-size:34px;font-weight:900}
.ctabtn{display:flex;align-items:center;justify-content:center;background:${ACCENT};color:#000;border-radius:30px;
 padding:44px;font-size:52px;font-weight:900;letter-spacing:-1px}
.url{text-align:center;font-size:44px;font-weight:900;color:${ACCENT};letter-spacing:1px}
.dots{display:flex;align-items:center;gap:12px;justify-content:center}
</style></head><body>
<div class="wrap">
  <div class="wm"></div>
  <div class="top"><img src="${LOGO}"/><span class="name">SANDER<span style="color:${ACCENT}">.</span></span></div>
  <div class="kicker">${s.kicker || (isCta ? "SCARICA GRATIS" : "")}</div>
  <div class="center">
    ${s.emoji ? `<div class="emoji">${s.emoji}</div>` : ""}
    <div class="big">${bigLines}</div>
    ${s.sub ? `<div class="sub">${s.sub}</div>` : ""}
  </div>
  <div class="foot">
    ${isCta ? `<div class="ctabtn">Scarica gratis 🏐</div><div class="url">sanderbv.it</div>` : ""}
    ${s.swipe ? `<div class="swipe">Scorri →</div>` : ""}
    <div class="dots">${dots(total, idx)}</div>
  </div>
</div>
</body></html>`
}

const manifest = []
for (const c of carousels) {
  c.slides.forEach((s, i) => {
    const name = `${c.id}-${String(i + 1).padStart(2, "0")}`
    const file = join(outDir, `${name}.html`)
    writeFileSync(file, slideHtml(s, i, c.slides.length, c.id))
    manifest.push(name)
  })
}
console.log(manifest.join("\n"))

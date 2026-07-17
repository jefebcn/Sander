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
    id: "c4-tipi",
    slides: [
      { kind: "hook", kicker: "TIPI DA SPIAGGIA", big: ["I 4 tipi di giocatori", "che trovi", "al Bagno 26."], hl: ["al Bagno 26."], emoji: "🏐", swipe: true },
      { kind: "value", kicker: "TIPO 1", big: ["Il MURO."], hl: ["MURO."], sub: "Salta su tutto. Non riceve una palla.", emoji: "🧱" },
      { kind: "value", kicker: "TIPO 2", big: ["Il TUFFATORE."], hl: ["TUFFATORE."], sub: "Si butta su ogni pallone. Spike sempre in rete.", emoji: "🤿" },
      { kind: "value", kicker: "TIPO 3", big: ["Il PROFESSORE."], hl: ["PROFESSORE."], sub: "Spiega le regole a tutti. Perde 21-6.", emoji: "🎓" },
      { kind: "value", kicker: "TIPO 4", big: ["Il FENOMENO."], hl: ["FENOMENO."], sub: "Zero allenamento. Ti distrugge lo stesso.", emoji: "🔥" },
      { kind: "cta", big: ["Che tipo sei?"], hl: ["tipo sei?"], sub: "Crea la tua carta e scoprilo." },
    ],
  },
  {
    id: "c5-livello",
    slides: [
      { kind: "hook", kicker: "IL TUO LIVELLO", big: ["Nel beach volley", "qual è il tuo", "livello VERO?"], hl: ["livello VERO?"], emoji: "🤔", swipe: true },
      { kind: "value", kicker: "IL RATING", big: ["SANDER ti dà", "un rating."], hl: ["un rating."], sub: "Come nel tennis o negli scacchi.", emoji: "📊" },
      { kind: "value", kicker: "LE DIVISIONI", big: ["Sabbia · Onda", "Corrente · Tempesta", "Leggenda"], hl: ["Leggenda"], sub: "Sali di divisione vincendo.", emoji: "🌊" },
      { kind: "value", kicker: "OGNI PARTITA CONTA", big: ["Ogni vittoria", "ti fa salire."], hl: ["ti fa salire."], sub: "Il rating non mente.", emoji: "📈" },
      { kind: "cta", big: ["Scopri la tua", "divisione."], hl: ["divisione."], sub: "Da che livello parti?" },
    ],
  },
  {
    id: "c6-tornei",
    slides: [
      { kind: "hook", kicker: "OGNI WEEKEND", big: ["Un torneo di beach", "volley sulla Riviera.", "Ogni weekend."], hl: ["Ogni weekend."], emoji: "🏆", swipe: true },
      { kind: "value", kicker: "ISCRIZIONE", big: ["In 2 tap", "dall'app."], hl: ["2 tap"], sub: "Niente moduli, niente casino.", emoji: "⚡" },
      { kind: "value", kicker: "FORMATI VERI", big: ["Chicece · King", "of the Beach · gironi"], hl: ["Chicece"], sub: "Come i tornei che conosci.", emoji: "🏐" },
      { kind: "value", kicker: "IL PREMIO", big: ["Vinci → la tua", "carta sale di livello."], hl: ["sale di livello."], sub: "E finisci in cima alla classifica.", emoji: "👑" },
      { kind: "cta", big: ["Trova il prossimo", "torneo."], hl: ["torneo."], sub: "Il tuo posto in campo ti aspetta." },
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

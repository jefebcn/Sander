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
    id: "c4-tutto",
    slides: [
      { kind: "hook", kicker: "NON SOLO PARTITE", big: ["Pensi che SANDER", "serva solo a trovare", "partite?"], hl: ["partite?"], emoji: "🤯", swipe: true },
      { kind: "value", kicker: "1 · LA TUA CARTA", big: ["Hai la tua carta", "da giocatore."], hl: ["carta"], sub: "Stile FIFA, con le tue stat reali.", emoji: "🃏" },
      { kind: "value", kicker: "2 · IL RATING", big: ["Un rating che sale", "a ogni vittoria."], hl: ["a ogni vittoria."], sub: "Come nel tennis e negli scacchi.", emoji: "📈" },
      { kind: "value", kicker: "3 · COMPETIZIONE", big: ["Tornei, classifiche,", "stagioni, divisioni."], hl: ["stagioni, divisioni."], sub: "Dalla Sabbia alla Leggenda.", emoji: "🏆" },
      { kind: "value", kicker: "4 · COMMUNITY", big: ["Trovi compagni", "del tuo livello."], hl: ["del tuo livello."], sub: "Partite sempre equilibrate.", emoji: "🤝" },
      { kind: "cta", big: ["Tutto il tuo beach.", "In un'app."], hl: ["In un'app."], sub: "Gratis, dal telefono." },
    ],
  },
  {
    id: "c5-stagioni",
    slides: [
      { kind: "hook", kicker: "STAGIONI & DIVISIONI", big: ["Da chi gioca", "la domenica", "a LEGGENDA."], hl: ["a LEGGENDA."], emoji: "🌊", swipe: true },
      { kind: "value", kicker: "5 DIVISIONI", big: ["Sabbia · Onda", "Corrente · Tempesta", "Leggenda"], hl: ["Leggenda"], sub: "Una piramide da scalare.", emoji: "🔺" },
      { kind: "value", kicker: "LA REGOLA", big: ["Vinci → sali.", "Perdi → ti alleni."], hl: ["Vinci → sali."], sub: "Ogni partita ti muove.", emoji: "⚔️" },
      { kind: "value", kicker: "FINE STAGIONE", big: ["Chi arriva", "in cima?"], hl: ["in cima?"], sub: "Poi si riparte da zero.", emoji: "👑" },
      { kind: "cta", big: ["Che divisione", "raggiungi?"], hl: ["raggiungi?"], sub: "Scoprilo sul campo." },
    ],
  },
  {
    id: "c6-trova",
    slides: [
      { kind: "hook", kicker: "POV", big: ["Sei bravo,", "ma non trovi avversari", "alla tua altezza."], hl: ["alla tua altezza."], emoji: "🎯", swipe: true },
      { kind: "value", kicker: "LA SOLUZIONE", big: ["SANDER ti abbina", "al tuo rating."], hl: ["al tuo rating."], sub: "Niente più squadre sbilanciate.", emoji: "🤝" },
      { kind: "value", kicker: "DUE MODI", big: ["Compagni ideali.", "Avversari alla pari."], hl: ["Avversari alla pari."], sub: "Scegli tu.", emoji: "⚡" },
      { kind: "value", kicker: "IL RISULTATO", big: ["Partite tirate.", "Ogni volta."], hl: ["Ogni volta."], sub: "Il livello giusto, sempre.", emoji: "🔥" },
      { kind: "cta", big: ["Trova la tua", "squadra."], hl: ["squadra."], sub: "Al tuo livello, in un tap." },
    ],
  },
  {
    id: "c7-coppia",
    slides: [
      { kind: "hook", kicker: "2 VS 2", big: ["Nel beach non conta", "quanto sei bravo.", "Conta con CHI giochi."], hl: ["con CHI giochi."], emoji: "🤝", swipe: true },
      { kind: "value", kicker: "L'AFFIATAMENTO", big: ["Ogni coppia ha", "la sua chimica."], hl: ["la sua chimica."], sub: "Quante ne vincete insieme?", emoji: "🔥" },
      { kind: "value", kicker: "LA VOSTRA CARTA", big: ["Una carta di coppia,", "solo vostra."], hl: ["solo vostra."], sub: "Con le vittorie che fate insieme.", emoji: "🃏" },
      { kind: "value", kicker: "LA SFIDA", big: ["Chi è il miglior duo", "della Riviera?"], hl: ["della Riviera?"], emoji: "👑" },
      { kind: "cta", big: ["Trova il tuo", "compagno."], hl: ["compagno."], sub: "E costruite la vostra chimica." },
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

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
//
// TikTok photo mode overlays its own UI on top of every image and crops the
// edges: the tab bar covers the TOP, the caption/username/music cover the
// BOTTOM, and the like/comment/share rail covers the RIGHT. So all content
// lives inside a central "safe zone" well away from those edges.
//
//   SAFE ZONE (of the 1080×1920 canvas):
//     top    300px   (status bar + "Per te" tab bar)
//     bottom 560px   (caption, username, audio, TikTok's own dots)
//     left    90px
//     right  190px   (like / comment / bookmark / share icons)
//
function slideHtml(s, idx) {
  const isHook = s.kind === "hook"
  const isCta = s.kind === "cta"
  const hl = s.hl || []

  // Size the headline so the longest line fits the ~800px-wide safe column.
  const maxLen = Math.max(...s.big.map((l) => l.length))
  const bigSize = Math.round(Math.min(126, Math.max(64, 1480 / maxLen)))

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
 background:radial-gradient(ellipse 80% 42% at 50% 30%, rgba(201,243,29,0.17) 0%, transparent 62%),
 linear-gradient(170deg,#0d1209 0%,#090b09 48%,#040504 100%)}
/* faint watermark, centred inside the safe zone so it never looks cut */
.wm{position:absolute;left:50%;top:47%;transform:translate(-50%,-50%);width:720px;height:720px;
 opacity:0.055;background:url('${LOGO}') no-repeat center/contain;z-index:1}
/* the safe content column */
.safe{position:absolute;left:90px;right:190px;top:300px;bottom:560px;
 display:flex;flex-direction:column;z-index:2}
.brand{display:flex;align-items:center;gap:20px}
.brand img{width:64px;height:64px;object-fit:contain}
.brand .name{font-size:34px;font-weight:900;letter-spacing:-1px}
.center{flex:1;display:flex;flex-direction:column;justify-content:center}
.kicker{font-size:32px;font-weight:900;letter-spacing:7px;color:${ACCENT};margin-bottom:30px}
.emoji{font-size:${isHook ? 128 : 104}px;line-height:1;margin-bottom:34px}
.big{font-size:${bigSize}px;font-weight:900;line-height:1.04;letter-spacing:-3px}
.sub{margin-top:38px;font-size:46px;font-weight:700;color:rgba(255,255,255,0.66);line-height:1.28}
.foot{display:flex;flex-direction:column;gap:26px;align-items:flex-start}
.swipe{display:flex;align-items:center;gap:14px;background:rgba(201,243,29,0.14);border:2px solid rgba(201,243,29,0.42);
 color:${ACCENT};border-radius:99px;padding:20px 44px;font-size:36px;font-weight:900}
.ctabtn{align-self:stretch;display:flex;align-items:center;justify-content:center;background:${ACCENT};color:#000;
 border-radius:30px;padding:42px;font-size:54px;font-weight:900;letter-spacing:-1px}
.url{align-self:center;font-size:44px;font-weight:900;color:${ACCENT};letter-spacing:1px}
</style></head><body>
<div class="wm"></div>
<div class="safe">
  <div class="brand"><img src="${LOGO}"/><span class="name">SANDER<span style="color:${ACCENT}">.</span></span></div>
  <div class="center">
    <div class="kicker">${s.kicker || (isCta ? "SCARICA GRATIS" : "")}</div>
    ${s.emoji ? `<div class="emoji">${s.emoji}</div>` : ""}
    <div class="big">${bigLines}</div>
    ${s.sub ? `<div class="sub">${s.sub}</div>` : ""}
  </div>
  <div class="foot">
    ${isCta ? `<div class="ctabtn">Scarica gratis 🏐</div><div class="url">sanderbv.it</div>` : ""}
    ${s.swipe ? `<div class="swipe">Scorri →</div>` : ""}
  </div>
</div>
</body></html>`
}

const manifest = []
for (const c of carousels) {
  c.slides.forEach((s, i) => {
    const name = `${c.id}-${String(i + 1).padStart(2, "0")}`
    const file = join(outDir, `${name}.html`)
    writeFileSync(file, slideHtml(s, i))
    manifest.push(name)
  })
}
console.log(manifest.join("\n"))

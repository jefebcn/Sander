/**
 * Rigenera gli HTML dei caroselli (safe-zone TikTok, dark+lime) dai post in
 * posts.json. Poi renderizza i PNG con Chromium headless (vedi README).
 *   node scripts/content-30gg/render-carousels.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const ROOT = dirname(fileURLToPath(import.meta.url))
const CARDIR = join(ROOT, "carousels")
mkdirSync(CARDIR, { recursive: true })

const posts = JSON.parse(readFileSync(join(ROOT, "posts.json"), "utf8")).sort((a, b) => a.day - b.day)
const LOGO = "data:image/png;base64," + readFileSync(join(ROOT, "..", "..", "public", "sander-logo.png")).toString("base64")
const ACCENT = "#c9f31d"

const PILLAR = {
  "Re dei Bagni":        { kicker: "RE DEI BAGNI", emoji: "👑" },
  "Carta del giocatore": { kicker: "LA TUA CARTA", emoji: "🃏" },
  "Meme / relatable":    { kicker: "SITUAZIONI",   emoji: "😅" },
  "Skill / clip":        { kicker: "SKILL",        emoji: "🔥" },
  "POV / hot-take":      { kicker: "POV",          emoji: "🎯" },
  "Live dai campi":      { kicker: "DAI CAMPI",    emoji: "🏖️" },
  "UGC / community":     { kicker: "COMMUNITY",    emoji: "🙌" },
}

const esc = (s = "") => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

function splitLines(t) {
  const words = t.trim().split(/\s+/)
  if (words.length <= 2 || t.length <= 16) return [t]
  let best = 1, bestDiff = Infinity
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ").length, b = words.slice(i).join(" ").length
    if (Math.abs(a - b) < bestDiff) { bestDiff = Math.abs(a - b); best = i }
  }
  const l1 = words.slice(0, best).join(" "), l2 = words.slice(best).join(" ")
  if (l2.length > 20 && words.length - best >= 2) {
    const w2 = words.slice(best), m = Math.ceil(w2.length / 2)
    return [l1, w2.slice(0, m).join(" "), w2.slice(m).join(" ")]
  }
  return [l1, l2]
}

function slideHtml(s, pillar) {
  const isHook = s.kind === "hook", isCta = s.kind === "cta"
  const meta = PILLAR[pillar] || { kicker: "", emoji: "🏐" }
  const lines = splitLines(s.text)
  const maxLen = Math.max(...lines.map((l) => l.length))
  const bigSize = Math.round(Math.min(120, Math.max(60, 1420 / maxLen)))
  const hlLine = lines[lines.length - 1]
  const bigLines = lines
    .map((l) => (l === hlLine ? `<div><span style="color:${ACCENT}">${esc(l)}</span></div>` : `<div>${esc(l)}</div>`))
    .join("")
  const kicker = isHook ? meta.kicker : isCta ? "SCARICA GRATIS" : ""
  const emoji = isHook ? meta.emoji : ""
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden}
body{font-family:-apple-system,'SF Pro Display','Helvetica Neue',Arial,sans-serif;color:#fff;
 background:radial-gradient(ellipse 80% 42% at 50% 30%, rgba(201,243,29,0.17) 0%, transparent 62%),
 linear-gradient(170deg,#0d1209 0%,#090b09 48%,#040504 100%)}
.wm{position:absolute;left:50%;top:47%;transform:translate(-50%,-50%);width:720px;height:720px;
 opacity:0.055;background:url('${LOGO}') no-repeat center/contain;z-index:1}
.safe{position:absolute;left:90px;right:190px;top:300px;bottom:560px;display:flex;flex-direction:column;z-index:2}
.brand{display:flex;align-items:center;gap:20px}
.brand img{width:64px;height:64px;object-fit:contain}
.brand .name{font-size:34px;font-weight:900;letter-spacing:-1px}
.center{flex:1;display:flex;flex-direction:column;justify-content:center}
.kicker{font-size:32px;font-weight:900;letter-spacing:7px;color:${ACCENT};margin-bottom:30px;min-height:8px}
.emoji{font-size:${isHook ? 128 : 104}px;line-height:1;margin-bottom:34px}
.big{font-size:${bigSize}px;font-weight:900;line-height:1.05;letter-spacing:-2px}
.sub{margin-top:38px;font-size:44px;font-weight:700;color:rgba(255,255,255,0.66);line-height:1.28}
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
    <div class="kicker">${kicker}</div>
    ${emoji ? `<div class="emoji">${emoji}</div>` : ""}
    <div class="big">${bigLines}</div>
    ${s.sub ? `<div class="sub">${esc(s.sub)}</div>` : ""}
  </div>
  <div class="foot">
    ${isCta ? `<div class="ctabtn">Scarica gratis 🏐</div><div class="url">sanderbv.it</div>` : ""}
    ${isHook ? `<div class="swipe">Scorri →</div>` : ""}
  </div>
</div>
</body></html>`
}

const carousels = posts.filter((p) => Array.isArray(p.slides) && p.slides.length >= 4)
const names = []
for (const p of carousels) {
  p.slides.forEach((s, i) => {
    const name = `g${String(p.day).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`
    writeFileSync(join(CARDIR, `${name}.html`), slideHtml(s, p.pillar))
    names.push(name)
  })
}
console.log(`${names.length} slide HTML da ${carousels.length} caroselli. Ora renderizza i PNG (vedi README).`)

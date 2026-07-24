/**
 * Rigenera calendario.html dai post in posts.json.
 *   node scripts/content-30gg/gen-calendar.mjs
 */
import { readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const ROOT = dirname(fileURLToPath(import.meta.url))
const posts = JSON.parse(readFileSync(join(ROOT, "posts.json"), "utf8")).sort((a, b) => a.day - b.day)
const esc = (s = "") => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const PC = {
  "Re dei Bagni": "re", "Carta del giocatore": "carta", "Meme / relatable": "meme",
  "Skill / clip": "skill", "POV / hot-take": "pov", "Live dai campi": "live", "UGC / community": "ugc",
}
const PE = {
  "Re dei Bagni": "👑", "Carta del giocatore": "🃏", "Meme / relatable": "😅",
  "Skill / clip": "🔥", "POV / hot-take": "🎯", "Live dai campi": "🏖️", "UGC / community": "🙌",
}

function dayCard(p) {
  const isCar = Array.isArray(p.slides) && p.slides.length >= 4
  const asset = isCar
    ? `<span class="badge car">🎨 Carosello renderizzato · ${p.slides.length} slide</span>`
    : `<span class="badge film">🎬 ${p.format === "Storie" ? "Storia/e da girare" : "Clip da girare"}</span>`
  const audio = p.audio && p.audio !== "-" ? `<div class="row"><span class="lab">Audio</span><p>${esc(p.audio)}</p></div>` : ""
  return `<article class="day" id="g${p.day}">
    <div class="dhead">
      <span class="dn">G${String(p.day).padStart(2, "0")}</span>
      <span class="chip ${PC[p.pillar]}">${PE[p.pillar]} ${esc(p.pillar)}</span>
      <span class="fmt">${esc(p.format)}</span>
      ${asset}
    </div>
    <p class="concept">${esc(p.concept)}</p>
    <div class="row"><span class="lab">Gancio a schermo</span><p class="hook">${esc(p.onScreen)}</p></div>
    <div class="row"><span class="lab">Didascalia</span><div class="cap">${esc(p.caption)}</div></div>
    ${audio}
    <div class="row"><span class="lab">Come si fa</span><p class="sub">${esc(p.produce)}</p></div>
    ${isCar ? `<div class="row"><span class="lab">Slide</span><p class="sub">${p.slides.map((s) => esc(s.text)).join(" &rarr; ")}</p></div>` : ""}
  </article>`
}

const weeks = [1, 2, 3, 4, 5].map((w) => {
  const days = posts.filter((p) => Math.ceil(p.day / 7) === w)
  if (days.length === 0) return ""
  return `<section id="w${w}"><div class="weyebrow"><span class="num">S${w}</span><span class="tag">Settimana ${w} · giorni ${days[0].day}–${days[days.length - 1].day}</span></div>${days.map(dayCard).join("")}</section>`
}).join("")

const html = `<title>SANDER — 30 Giorni di Contenuti</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root{--bg:#f6f7f2;--surface:#fff;--surface-2:#eef1e8;--border:#e1e5d7;--text:#161a10;--muted:#5f6650;--accent:#c9f31d;--on-accent:#0a0d08;--ink:#4a6f00;--shadow:0 1px 2px rgba(20,30,10,.04),0 8px 24px rgba(20,30,10,.05);--mono:ui-monospace,SFMono-Regular,Menlo,monospace;--sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
@media (prefers-color-scheme:dark){:root{--bg:#0a0d08;--surface:#12160e;--surface-2:#191f13;--border:#272e1c;--text:#eef2e6;--muted:#99a287;--ink:#c9f31d;--shadow:0 1px 2px rgba(0,0,0,.3),0 10px 30px rgba(0,0,0,.35)}}
:root[data-theme="light"]{--bg:#f6f7f2;--surface:#fff;--surface-2:#eef1e8;--border:#e1e5d7;--text:#161a10;--muted:#5f6650;--ink:#4a6f00}
:root[data-theme="dark"]{--bg:#0a0d08;--surface:#12160e;--surface-2:#191f13;--border:#272e1c;--text:#eef2e6;--muted:#99a287;--ink:#c9f31d}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--sans);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased}
.wrap{max-width:78ch;margin:0 auto;padding:0 20px}
header.top{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 86%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--border)}
.tin{max-width:78ch;margin:0 auto;padding:11px 20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.brand{font-weight:900;letter-spacing:.13em;font-size:.85rem}.brand b{color:var(--ink)}
.top nav{margin-left:auto;display:flex;gap:2px;flex-wrap:wrap}
.top nav a{font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;font-weight:800;color:var(--muted);text-decoration:none;padding:5px 9px;border-radius:99px}
.top nav a:hover{color:var(--ink);background:var(--surface-2)}
.hero{padding:52px 0 20px}
.kick{text-transform:uppercase;letter-spacing:.2em;font-size:.7rem;font-weight:800;color:var(--ink);margin:0 0 14px}
h1{font-size:clamp(2.1rem,6vw,3.2rem);line-height:1;letter-spacing:-.02em;font-weight:900;margin:0;text-wrap:balance}
h1 em{font-style:normal;color:var(--ink)}
.lede{font-size:1.1rem;color:var(--muted);margin:18px 0 0;max-width:60ch}
.legend{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0 0}
.how{background:var(--surface-2);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:12px;padding:14px 16px;margin:22px 0 0;font-size:.92rem}
.how b{color:var(--ink)}
section{padding:26px 0}
.weyebrow{display:flex;align-items:center;gap:11px;position:sticky;top:46px;background:var(--bg);padding:10px 0;z-index:5;border-bottom:1px solid var(--border);margin-bottom:14px}
.weyebrow .num{font-family:var(--mono);font-size:.72rem;font-weight:800;color:var(--on-accent);background:var(--accent);width:30px;height:24px;border-radius:7px;display:grid;place-items:center}
.weyebrow .tag{text-transform:uppercase;letter-spacing:.1em;font-size:.72rem;font-weight:800;color:var(--muted)}
.day{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px;box-shadow:var(--shadow);margin-bottom:14px}
.dhead{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:10px}
.dn{font-family:var(--mono);font-weight:800;font-size:.8rem;background:var(--surface-2);border:1px solid var(--border);border-radius:7px;padding:3px 8px}
.chip{font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;padding:4px 10px;border-radius:99px}
.chip.re{background:#f6ecd0;color:#8a6a00}.chip.carta{background:#e7f3c4;color:#4a6f00}.chip.meme{background:#f3e2f0;color:#8b3f80}
.chip.skill{background:#f6ddd2;color:#b0502c}.chip.pov{background:#d5e8f6;color:#2c5f8b}.chip.live{background:#d0eee8;color:#0f7e6f}.chip.ugc{background:#e9e3f6;color:#5a45a0}
:root[data-theme="dark"] .chip.re{background:#2a2410;color:#e6bf4d}:root[data-theme="dark"] .chip.carta{background:#232c10;color:#c9f31d}:root[data-theme="dark"] .chip.meme{background:#2c1329;color:#e59fd6}:root[data-theme="dark"] .chip.skill{background:#2c1911;color:#f0805c}:root[data-theme="dark"] .chip.pov{background:#111f2c;color:#7fbce8}:root[data-theme="dark"] .chip.live{background:#0f2723;color:#37c2ad}:root[data-theme="dark"] .chip.ugc{background:#1c1633;color:#b3a0e8}
@media (prefers-color-scheme:dark){.chip.re{background:#2a2410;color:#e6bf4d}.chip.carta{background:#232c10;color:#c9f31d}.chip.meme{background:#2c1329;color:#e59fd6}.chip.skill{background:#2c1911;color:#f0805c}.chip.pov{background:#111f2c;color:#7fbce8}.chip.live{background:#0f2723;color:#37c2ad}.chip.ugc{background:#1c1633;color:#b3a0e8}}
.fmt{font-size:.72rem;font-weight:700;color:var(--muted)}
.badge{margin-left:auto;font-size:.66rem;font-weight:800;padding:4px 9px;border-radius:99px;background:var(--surface-2);color:var(--muted)}
.badge.car{background:var(--accent);color:var(--on-accent)}
.concept{margin:0 0 12px;font-weight:600}
.row{display:grid;grid-template-columns:118px 1fr;gap:12px;padding:9px 0;border-top:1px solid var(--border)}
@media (max-width:560px){.row{grid-template-columns:1fr;gap:3px}}
.lab{font-size:.64rem;text-transform:uppercase;letter-spacing:.09em;font-weight:800;color:var(--muted);padding-top:2px}
.row p{margin:0}
.hook{font-weight:900;font-size:1.05rem;letter-spacing:-.01em}
.cap{white-space:pre-wrap;background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:11px 13px;font-size:.92rem}
.sub{color:var(--muted);font-size:.9rem}
footer{border-top:1px solid var(--border);padding:30px 0 60px;color:var(--muted);font-size:.82rem}
footer b{color:var(--ink)}
::selection{background:var(--accent);color:var(--on-accent)}
a:focus-visible{outline:2px solid var(--ink);outline-offset:2px;border-radius:6px}
</style>
<header class="top"><div class="tin"><span class="brand">SANDER<span style="color:var(--ink)">.</span> &nbsp;<b>30 GIORNI DI CONTENUTI</b></span>
<nav><a href="#w1">S1</a><a href="#w2">S2</a><a href="#w3">S3</a><a href="#w4">S4</a><a href="#w5">S5</a></nav></div></header>
<div class="wrap">
<div class="hero">
<p class="kick">Piano editoriale · Instagram + TikTok/Reels · stile social-dink</p>
<h1>Un mese di post, <em>già pronti</em>.</h1>
<p class="lede">30 contenuti che ruotano su 6 rubriche. Didascalie da copiare, ganci a schermo, e per ogni giorno cosa fare: caroselli già renderizzati o clip da girare al volo.</p>
<div class="legend">
${Object.keys(PC).map((p) => `<span class="chip ${PC[p]}">${PE[p]} ${p}</span>`).join("")}
</div>
<div class="how"><b>Come usarlo →</b> carica tutto in un programmatore gratuito (<b>Metricool</b> consigliato: IG + TikTok in un posto) e imposta la pubblicazione automatica. I caroselli sono le immagini in <code>carousels/</code>; per i reel/clip filma la scena in "Come si fa" e incolla la didascalia. Batch una volta, coperto un mese.</div>
</div>
${weeks}
<footer><p><b>SANDER — 30 giorni di contenuti.</b> Generato con l'agente social-dink. 9 caroselli renderizzati (54 slide), 21 tra reel/clip/storie da girare.</p><p style="margin-top:6px">sanderbv.it · @sanderbeachvolley</p></footer>
</div>`

writeFileSync(join(ROOT, "calendario.html"), html)
console.log("calendario.html rigenerato")

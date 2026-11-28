/**
 * New Instagram formats of @sanderbeachvolley (17/11/2026), posts 1080×1350.
 *
 * SANDER fonts: Bricolage Grotesque condensed (titles, numbers), Figtree
 * (text), Gochi Hand lime (the hand-written word, as in the published posts).
 * Every cover carries «SANDER · beach volley» and a beach cue in the words.
 * Each function returns a full HTML page; render.mjs screenshots it.
 */
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const KIT = dirname(fileURLToPath(import.meta.url))
const b64 = (p, t) => `data:${t};base64,${readFileSync(p).toString("base64")}`
export const screen = (n) => b64(join(KIT, "screens", `${n}.jpg`), "image/jpeg")
export const photo = (n) => (n ? b64(join(KIT, "photos", `${n}.jpg`), "image/jpeg") : null)
// Demo faces of the app (generated people, never real players): copies of public/demo/players.
const faces = (n) => b64(join(KIT, "assets", "faces", `${n}.webp`), "image/webp")
const ICON = b64(join(KIT, "assets", "icon.png"), "image/png")
const F = {
  hand: b64(join(KIT, "fonts", "GochiHand.woff2"), "font/woff2"),
  brico: b64(join(KIT, "fonts", "Bricolage.woff2"), "font/woff2"),
  fig: b64(join(KIT, "fonts", "Figtree.woff2"), "font/woff2"),
}
const LIME = "#c6f736"
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c])
const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`)}")`

const css = `
@font-face{font-family:'Gochi';src:url(${F.hand})}
@font-face{font-family:'Brico';src:url(${F.brico});font-weight:200 800;font-stretch:75% 100%}
@font-face{font-family:'Fig';src:url(${F.fig});font-weight:300 900}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;position:relative;background:#0b0b0b;color:#fff;font-family:'Fig',sans-serif}
.bg{position:absolute;inset:0;background-size:cover;background-position:center}
.grain{position:absolute;inset:0;background-image:${GRAIN};opacity:.13;mix-blend-mode:overlay;pointer-events:none;z-index:50}
.D{font-family:'Brico',sans-serif;font-weight:800;font-stretch:75%;text-transform:uppercase;line-height:.9;letter-spacing:-.015em;white-space:nowrap}
.H{font-family:'Gochi',cursive;-webkit-text-stroke:.028em currentColor;line-height:.95;white-space:nowrap}
.L{color:${LIME}}
.mk{background:${LIME};color:#0b0b0b;padding:0 .14em}
.eyebrow{font-weight:800;font-size:25px;letter-spacing:.16em;text-transform:uppercase}
.chip{display:inline-block;background:${LIME};color:#0b0b0b;font-weight:800;font-size:25px;letter-spacing:.14em;text-transform:uppercase;padding:9px 16px;border-radius:8px}
.sticker{position:absolute;background:#fff;color:#0b0b0b;font-weight:800;border-radius:16px;padding:14px 22px;box-shadow:0 14px 30px rgba(0,0,0,.35);white-space:nowrap}
.brand{position:absolute;display:flex;align-items:center;gap:12px}
.brand img{width:54px;height:54px;border-radius:13px}
.brand b{display:block;font-weight:900;font-size:22px;letter-spacing:.18em;line-height:1}
.brand i{display:block;font-style:normal;font-weight:700;font-size:15px;letter-spacing:.2em;opacity:.7;margin-top:4px}
.swipe{position:absolute;font-weight:900;font-size:24px;letter-spacing:.16em}
.phone{position:absolute;border-radius:58px;padding:13px;background:linear-gradient(145deg,#2b2c31,#0d0d0f);box-shadow:0 40px 90px rgba(0,0,0,.6),0 0 0 2px rgba(255,255,255,.1)}
.phone .scr{border-radius:46px;overflow:hidden}
.phone img{display:block;width:100%}
`
// Shrinks every [data-fit] box (font-size of its .D/.H children) until it fits its width and max height.
const FIT = `<script>window.__fit=()=>{document.querySelectorAll('[data-fit]').forEach(box=>{const max=+box.dataset.fit||1e9;const hs=[...box.querySelectorAll('.D,.H')];let g=60;const over=()=>box.scrollHeight>max||hs.some(h=>h.scrollWidth>box.clientWidth+2);while(over()&&g--)hs.forEach(h=>{h.style.fontSize=(parseFloat(getComputedStyle(h).fontSize)*.95)+'px'})})}</script>`
const page = (body) => `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}<div class="grain"></div>${FIT}</body></html>`

const brand = (pos = "left:60px;bottom:50px", dark = false) => `<div class="brand" style="${pos};color:${dark ? "#0b0b0b" : "#fff"}"><img src="${ICON}"><div><b>SANDER</b><i>BEACH VOLLEY</i></div></div>`
const swipe = (pos = "right:60px;bottom:66px", c = LIME, t = "SWIPE →") => `<div class="swipe" style="${pos};color:${c}">${t}</div>`
const shade = (a, b, from, to) => `<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,${a}) ${from}%,rgba(0,0,0,${b}) ${to}%)"></div>`
const photoBg = (src, filter = "", pos = "center") => (src ? `<div class="bg" style="background-image:url(${src});background-position:${pos};${filter ? `filter:${filter}` : ""}"></div>` : `<div class="bg" style="background:radial-gradient(110% 80% at 50% 20%,#2a2c31,#0b0b0b)"></div>`)
const lines = (arr, cls, size, extra = "") => arr.filter(Boolean).map((t) => `<div class="${cls}" style="font-size:${size}px;${extra}">${esc(t)}</div>`).join("")
const phone = (src, { left, top, width, rotate = 0 }) => `<div class="phone" style="left:${left}px;top:${top}px;width:${width}px;transform:rotate(${rotate}deg)"><div class="scr"><img src="${src}"></div></div>`

// ─── Covers ──────────────────────────────────────────────────────────────────

export function gancio({ img, eyebrow, d, h, sticker, sub }) {
  return page(`
${photoBg(img, "brightness(1.05) contrast(1.05)")}
${shade(0, .9, 35, 78)}
<div class="chip" style="position:absolute;left:60px;top:64px">${esc(eyebrow)}</div>
<div data-fit="420" style="position:absolute;left:60px;right:60px;top:720px">
  ${lines(d, "D", 124)}
  ${lines(h, "H L", 128, "margin-top:6px")}
</div>
<div class="sticker" style="right:64px;top:640px;transform:rotate(-6deg);font-size:30px">${esc(sticker)}</div>
<div style="position:absolute;left:60px;right:60px;bottom:140px;font-size:33px;font-weight:700;opacity:.92">${esc(sub)}</div>
${brand()}${swipe()}`)
}

export function citazione({ img, who, d, mk, d2, h }) {
  return page(`
${photoBg(img, "brightness(1.1)", "center 38%").replace('class="bg" style="', 'class="bg" style="height:780px;')}
<div style="position:absolute;left:0;right:0;top:470px;height:320px;background:linear-gradient(180deg,rgba(11,11,11,0),#0b0b0b)"></div>
<div style="position:absolute;left:0;right:0;top:780px;bottom:0;background:#0b0b0b"></div>
<div style="position:absolute;left:60px;top:60px;font-size:64px;line-height:1">🏐</div>
<div data-fit="420" style="position:absolute;left:60px;right:60px;top:790px;text-align:center">
  <div class="eyebrow L" style="white-space:normal">《 ${esc(who)} 》</div>
  ${lines(d, "D", 118, "margin-top:24px")}
  <div class="D" style="font-size:118px"><span class="mk">${esc(mk)}</span>${d2 ? ` ${esc(d2)}` : ""}</div>
  <div class="H" style="font-size:92px;margin-top:14px;transform:rotate(-3deg)">${esc(h)}</div>
</div>
${brand()}`)
}

const COLORS = ["#ff9bd0", "#ffd27a", "#8fd3ff", "#b6f2a0", "#ffb38a"]
export function chat({ group, sub, msgs, seen, sticker, d, card, img, faceList = ["marco-1", "sara-1", "luca-1", "giorgia-1"] }) {
  let ci = 0
  const names = {}
  const bubble = ([who, txt, me]) => {
    if (!me && !names[who]) names[who] = COLORS[ci++ % COLORS.length]
    return `<div style="display:flex;${me ? "justify-content:flex-end" : ""};margin-bottom:12px"><div style="max-width:78%;background:${me ? "#1f5c3a" : "#202c33"};border-radius:22px;padding:12px 20px 14px">${me ? "" : `<div style="font-size:25px;font-weight:800;color:${names[who]}">${esc(who)}</div>`}<div style="font-size:36px;line-height:1.25">${esc(txt)}</div></div></div>`
  }
  return page(`
${img ? `<div style="position:absolute;left:0;right:0;top:0;height:850px;background:url(${img}) center 70%/cover"></div><div style="position:absolute;left:0;right:0;top:0;height:850px;background:rgba(11,20,26,.55)"></div>` : `<div style="position:absolute;inset:0;background:#0b141a"></div>`}
<div style="position:absolute;left:0;right:0;top:0;height:120px;background:#1f2c34;display:flex;align-items:center;gap:20px;padding:0 40px">
  <div style="width:72px;height:72px;border-radius:50%;background:#6b7c85;display:flex;align-items:center;justify-content:center;font-size:40px">🏐</div>
  <div><div style="font-size:32px;font-weight:800">${esc(group)}</div><div style="font-size:23px;opacity:.6">${esc(sub)}</div></div>
</div>
<div style="position:absolute;left:36px;right:36px;top:150px">${msgs.map(bubble).join("")}<div style="text-align:center;font-size:24px;opacity:.55;margin-top:8px">${esc(seen)}</div></div>
<div class="sticker" style="right:56px;top:430px;transform:rotate(7deg);font-size:28px;background:#ff4d5e;color:#fff">${esc(sticker)}</div>
<div style="position:absolute;left:0;right:0;top:850px;bottom:0;background:${LIME};color:#0b0b0b">
  <div class="eyebrow" style="position:absolute;left:60px;top:46px">Intanto su SANDER</div>
  <div data-fit="260" style="position:absolute;left:60px;top:96px;width:560px">${lines(d, "D", 112)}</div>
  <div style="position:absolute;right:60px;top:66px;width:380px;background:#0b0b0b;color:#fff;border-radius:28px;padding:26px;transform:rotate(3deg);box-shadow:0 20px 40px rgba(0,0,0,.3)">
    <div style="font-size:22px;font-weight:800;letter-spacing:.14em;color:${LIME}">${esc(card[0])}</div>
    <div style="font-size:36px;font-weight:900;margin-top:8px">${esc(card[1])}</div>
    <div style="display:flex;gap:10px;margin:18px 0 14px">${faceList.map((p) => `<div style="width:62px;height:62px;border-radius:50%;background:url(${faces(p)}) center/cover;border:3px solid ${LIME}"></div>`).join("")}</div>
    <div style="display:inline-block;background:${LIME};color:#0b0b0b;font-weight:900;font-size:24px;border-radius:999px;padding:8px 18px">4/4 · COMPLETA ✓</div>
  </div>
  ${brand("left:60px;bottom:40px", true)}
  ${swipe("right:60px;bottom:52px", "#0b0b0b")}
</div>`)
}

export function gioco({ title, types, foot, faceList }) {
  return page(`
<div style="position:absolute;inset:0;background:radial-gradient(110% 70% at 50% 0%,#2a2c31,#0b0b0b)"></div>
<div data-fit="270" style="position:absolute;left:60px;right:60px;top:50px;text-align:center">
  <div class="D" style="font-size:112px">${esc(title[0])}</div>
  <div class="H L" style="font-size:112px;margin-top:-4px">${esc(title[1])}</div>
</div>
<div style="position:absolute;left:44px;right:44px;top:330px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
  ${types.map(([a, b], i) => `<div style="position:relative;height:292px;border-radius:26px;overflow:hidden">
    <div class="bg" style="background-image:url(${faces(faceList[i])});background-position:center 22%"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 30%,rgba(0,0,0,.92))"></div>
    <div class="D" style="position:absolute;left:14px;top:14px;width:58px;height:58px;border-radius:50%;background:${LIME};color:#0b0b0b;display:flex;align-items:center;justify-content:center;font-size:40px">${i + 1}</div>
    <div style="position:absolute;left:16px;right:12px;bottom:14px"><div style="font-size:27px;font-weight:900;line-height:1.1">${esc(a)}</div><div class="H L" style="font-size:30px;margin-top:2px;white-space:normal">${esc(b)}</div></div>
  </div>`).join("")}
</div>
<div style="position:absolute;left:0;right:0;bottom:58px;text-align:center;font-size:32px;font-weight:800">Mandalo al tuo <span class="mk">${esc(foot)}</span></div>`)
}

export function notifiche({ img, date, time, n, d, h }) {
  const card = ([emoji, body, when]) => `<div style="background:rgba(30,30,32,.62);backdrop-filter:blur(24px);border-radius:34px;padding:24px 26px;display:flex;gap:20px;align-items:center;border:1px solid rgba(255,255,255,.12)">
  <img src="${ICON}" style="width:70px;height:70px;border-radius:17px;flex:none">
  <div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;font-size:24px"><span style="font-weight:800">SANDER</span><span style="opacity:.6">${esc(when)}</span></div><div style="font-size:30px;line-height:1.28;margin-top:4px">${emoji} ${esc(body)}</div></div></div>`
  return page(`
${photoBg(img, "brightness(.85) saturate(1.1)")}
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.15) 40%,rgba(0,0,0,.6))"></div>
<div style="position:absolute;left:0;right:0;top:60px;text-align:center">
  <div style="font-size:30px;font-weight:700;opacity:.9">${esc(date)}</div>
  <div style="font-family:'Brico';font-weight:600;font-stretch:90%;font-size:210px;line-height:1">${esc(time)}</div>
</div>
<div style="position:absolute;left:50px;right:50px;top:400px;display:flex;flex-direction:column;gap:16px">${n.map(card).join("")}</div>
<div data-fit="230" style="position:absolute;left:60px;right:60px;bottom:120px">
  <div class="D" style="font-size:92px">${esc(d)}</div>
  <div class="H L" style="font-size:100px">${esc(h)}</div>
</div>
${brand("right:60px;bottom:50px")}`)
}

export function flag({ title, h, green, red }) {
  const card = (bg, fg, head, items, rot, left) => `<div style="position:absolute;top:480px;left:${left}px;width:470px;background:${bg};color:${fg};border-radius:32px;padding:34px 32px;transform:rotate(${rot}deg);box-shadow:0 30px 60px rgba(0,0,0,.45)">
  <div class="D" style="font-size:64px;margin-bottom:10px">${head}</div>
  ${items.map((t) => `<div style="font-size:42px;font-weight:800;line-height:1.18;padding:30px 0;border-top:3px solid ${fg === "#fff" ? "rgba(255,255,255,.3)" : "rgba(0,0,0,.15)"}">${esc(t)}</div>`).join("")}
</div>`
  return page(`
<div style="position:absolute;inset:0;background:radial-gradient(100% 70% at 50% 0%,#24262b,#0b0b0b)"></div>
<div data-fit="330" style="position:absolute;left:60px;right:60px;top:60px">
  <div class="eyebrow L">Beach volley · match in campo e fuori</div>
  <div class="D" style="font-size:124px;margin-top:14px">${esc(title[0])}</div>
  <div class="D" style="font-size:124px">${esc(title[1])} <span class="H L" style="text-transform:none;font-weight:400">${esc(h)}</span></div>
</div>
${card(LIME, "#0b0b0b", "🟢 Green flag", green, -2.5, 52)}
${card("#ff4d5e", "#fff", "🚩 Red flag", red, 2.5, 558)}
${brand()}${swipe()}`)
}

export function carta({ img, eyebrow, d, h, sub }) {
  const row = (k, v) => `<div style="display:flex;justify-content:space-between;font-weight:900;font-size:22px"><span style="opacity:.7">${k}</span><span>${v}</span></div>`
  const card = (tier, ovr, col, rot, x, y, stats) => `<div style="position:absolute;left:${x}px;top:${y}px;width:310px;height:450px;border-radius:30px;background:linear-gradient(160deg,${col[0]},${col[1]});transform:rotate(${rot}deg);box-shadow:0 34px 70px rgba(0,0,0,.6),inset 0 0 0 4px rgba(255,255,255,.35);color:#141414;padding:26px;overflow:hidden">
  <div style="position:absolute;inset:0;background:linear-gradient(120deg,rgba(255,255,255,.45) 0%,rgba(255,255,255,0) 35%)"></div>
  <div class="D" style="font-size:100px;line-height:.9">${ovr}</div><div style="font-weight:900;letter-spacing:.16em;font-size:20px;opacity:.75">PUNTI</div>
  <div style="position:absolute;left:26px;right:26px;bottom:26px"><div class="D" style="font-size:46px;text-align:center;margin-bottom:12px">${tier}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 22px">${stats.map(([k, v]) => row(k, v)).join("")}</div></div></div>`
  return page(`
${photoBg(img, "brightness(.55)")}
<div data-fit="330" style="position:absolute;left:60px;right:60px;top:64px">
  <div class="eyebrow L">${esc(eyebrow)}</div>
  <div class="D" style="font-size:128px;margin-top:14px">${esc(d)}</div>
  <div class="H L" style="font-size:140px">${esc(h)}</div>
</div>
${card("Bronzo", 1380, ["#eab38a", "#9c5f36"], -9, 60, 560, [["ATT", 41], ["DIF", 47], ["RIC", 44], ["MUR", 39]])}
${card("Argento", 1640, ["#f6f7f9", "#a2a8af"], 0, 385, 520, [["ATT", 58], ["DIF", 61], ["RIC", 63], ["MUR", 55]])}
${card("Oro", 1910, ["#ffe58a", "#c99a1c"], 9, 710, 560, [["ATT", 74], ["DIF", 70], ["RIC", 77], ["MUR", 68]])}
<div style="position:absolute;left:60px;right:60px;bottom:130px;font-size:34px;font-weight:800;text-align:center">${esc(sub)}</div>
${brand()}${swipe()}`)
}

export function fipavNumero({ img, label, count, days, cities, more, source = "Fonte: FIPAV" }) {
  return page(`
${photoBg(img, "brightness(.42) saturate(.85)")}
<div class="chip" style="position:absolute;left:60px;top:64px">${esc(label)}</div>
<div class="D" style="position:absolute;left:46px;top:130px;font-size:${String(count).length > 2 ? 400 : 540}px;line-height:.82;color:${LIME}">${esc(count)}</div>
<div class="D" style="position:absolute;left:${String(count).length > 2 ? 620 : 560}px;top:190px;font-size:104px">Tornei<br>FIPAV di<br>beach volley<br>in ${esc(days)}</div>
<div style="position:absolute;left:60px;right:60px;top:690px;display:flex;flex-wrap:wrap;gap:14px">
  ${cities.map((c) => `<span style="border:2px solid rgba(255,255,255,.75);border-radius:999px;padding:12px 26px;font-size:31px;font-weight:800">${esc(c)}</span>`).join("")}${more > 0 ? `<span style="background:${LIME};color:#0b0b0b;border-radius:999px;padding:12px 26px;font-size:31px;font-weight:900">+${more}</span>` : ""}
</div>
<div style="position:absolute;left:60px;right:60px;top:975px">
  <div class="D" style="font-size:84px">E tu sei ancora</div>
  <div class="H L" style="font-size:104px">senza compagno?</div>
</div>
<div style="position:absolute;left:60px;bottom:64px;font-size:22px;opacity:.65;font-weight:600">${esc(source)}</div>
${brand("right:60px;bottom:50px")}`)
}

export function frase({ n, d, h }) {
  return page(`
<div style="position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 30%,#d6ff45,#c6f736 55%,#b2e127)"></div>
<div style="position:absolute;inset:0;color:#0b0b0b">
  <div class="eyebrow" style="position:absolute;left:60px;top:70px;opacity:.75">🏐 Frasi da rete · n. ${String(n).padStart(2, "0")}</div>
  <div data-fit="760" style="position:absolute;left:60px;right:60px;top:${d.length > 2 ? 300 : 380}px">
    ${lines(d, "D", 140)}
    <div style="margin-top:30px;transform:rotate(-2deg);transform-origin:left">${lines(h, "H", 116)}</div>
    <svg viewBox="0 0 600 40" style="display:block;width:560px;margin-top:6px" fill="none" stroke="#0b0b0b" stroke-width="9" stroke-linecap="round"><path d="M6 26 C 120 6, 260 34, 400 16 S 560 12, 594 22"/></svg>
  </div>
  ${brand("left:60px;bottom:50px", true)}
  <div class="swipe" style="right:60px;bottom:66px;color:#0b0b0b">SALVALO ↓</div>
</div>`)
}

// ─── Inner slides ────────────────────────────────────────────────────────────

/** The app behind the joke: phone + three numbered points. */
export function appSlide({ eyebrow, d, h, img, bullets }) {
  return page(`
<div style="position:absolute;inset:0;background:radial-gradient(120% 80% at 70% 30%,#24262b,#0b0b0b)"></div>
${phone(img, { left: 60, top: 150, width: 430, rotate: -3 })}
<div style="position:absolute;top:170px;left:560px;right:56px">
  <div class="eyebrow L">${esc(eyebrow)}</div>
  <div data-fit="260" style="margin:16px 0 40px">${lines([d], "D", 92)}${lines([h], "H L", 96)}</div>
  ${bullets.map((b, i) => `<div style="display:flex;gap:20px;margin-bottom:34px"><div class="D" style="flex:none;width:58px;height:58px;border-radius:50%;background:${LIME};color:#0b0b0b;display:flex;align-items:center;justify-content:center;font-size:40px">${i + 1}</div><div style="font-size:33px;font-weight:800;line-height:1.25;padding-top:6px">${esc(b)}</div></div>`).join("")}
</div>
${brand()}`)
}

/** Rows (FIPAV events, open matches) on the dark card. */
export function listSlide({ eyebrow, d, h, rows, note }) {
  return page(`
<div style="position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 0%,#24262b,#0b0b0b)"></div>
<div style="position:absolute;top:80px;left:60px;right:60px">
  <div class="eyebrow L">${esc(eyebrow)}</div>
  <div data-fit="230" style="margin:14px 0 36px">${lines([d], "D", 104)}${h ? lines([h], "H L", 100) : ""}</div>
  <div style="background:#16171a;border:1px solid rgba(255,255,255,.08);border-radius:30px;overflow:hidden">${rows.map((r) => `<div style="display:flex;align-items:center;gap:22px;padding:22px 26px;border-bottom:1px solid rgba(255,255,255,.07)">
    <div style="flex:none;width:84px;height:84px;border-radius:20px;background:${LIME};color:#0b0b0b;display:flex;flex-direction:column;align-items:center;justify-content:center"><div class="D" style="font-size:40px;line-height:.9">${esc(r.badge)}</div><div style="font-size:16px;font-weight:900;letter-spacing:.1em">${esc(r.badgeSub ?? "")}</div></div>
    <div style="flex:1;min-width:0"><div style="font-size:33px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.title)}</div><div style="font-size:26px;opacity:.7;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.sub)}</div></div></div>`).join("")}</div>
  ${note ? `<div style="font-size:26px;opacity:.65;margin-top:22px;font-weight:600">${esc(note)}</div>` : ""}
</div>
${brand()}`)
}

/** Closing: lime, phone, «Scarica l'app». */
export function ctaSlide({ d, h, img }) {
  return page(`
<div style="position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 40%,#d4ff3a,#c6f736 55%,#b4e52a)"></div>
${phone(img, { left: 610, top: 170, width: 400, rotate: 4 })}
<div style="position:absolute;top:230px;left:60px;width:520px;color:#0b0b0b">
  <div data-fit="300">${lines(d, "D", 116)}${lines(h, "H", 110, "margin-top:4px")}</div>
  <img src="${ICON}" style="width:120px;height:120px;border-radius:28px;display:block;margin:56px 0 18px">
  <div class="H" style="font-size:66px">Scarica l'app</div>
  <div style="font-size:23px;font-weight:800;letter-spacing:.16em;margin-top:10px">APP STORE · GOOGLE PLAY</div>
  <div style="font-size:23px;font-weight:800;letter-spacing:.16em;margin-top:6px">GRATIS · LINK IN BIO</div>
</div>`)
}

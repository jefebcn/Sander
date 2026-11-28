/**
 * Glow-up of @sanderbeachvolley (Alex, 23/11/2026): new look from today, no photos.
 *
 * Three directions, each with its own job, so the grid never repeats a background:
 *   A «Tabellone»       dark scoreboard grid, giant lime number → FIPAV, lists, countdowns, notifications
 *   D «Poster lime»     full lime poster, giant black words → hooks («Manca uno»), quotes
 *   E «Telefono in campo» warm sand-at-dusk gradient, tilted phone, hand notes → app, tutorials, stories
 * plus the rubric «Glossario da spiaggia» (dark, giant lime word, definition).
 *
 * Same signatures as formats.mjs (render.mjs overrides those functions with these);
 * Backgrounds are drawn; gancio, citazione and storyPhone take an AI photo when
 * given one (`img` / `photo`, from bgai.mjs) and fall back to the drawn look.
 * Posts are 1080×1350; story* functions are 1080×1920 with nothing important above
 * 270 px or below 380 px.
 */
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { frase as frase0, chat as chat0 } from "./formats.mjs"

const KIT = dirname(fileURLToPath(import.meta.url))
const b64 = (p, t) => `data:${t};base64,${readFileSync(p).toString("base64")}`
const ICON = b64(join(KIT, "assets", "icon.png"), "image/png")
const F = {
  hand: b64(join(KIT, "fonts", "GochiHand.woff2"), "font/woff2"),
  brico: b64(join(KIT, "fonts", "Bricolage.woff2"), "font/woff2"),
  fig: b64(join(KIT, "fonts", "Figtree.woff2"), "font/woff2"),
}
const L = "#c6f736"
const INK = "#0b0b0b"
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c])
const arr = (x) => (Array.isArray(x) ? x : [x]).filter(Boolean)

const css = (w, h, bg) => `
@font-face{font-family:'Gochi';src:url(${F.hand})}
@font-face{font-family:'Brico';src:url(${F.brico});font-weight:200 800;font-stretch:75% 100%}
@font-face{font-family:'Fig';src:url(${F.fig});font-weight:300 900}
*{margin:0;padding:0;box-sizing:border-box}
body{width:${w}px;height:${h}px;overflow:hidden;position:relative;background:${bg};color:#fff;font-family:'Fig',sans-serif}
.D{font-family:'Brico';font-weight:800;font-stretch:75%;text-transform:uppercase;line-height:.86;letter-spacing:-.01em;white-space:nowrap}
.W{font-family:'Brico';font-weight:800;font-stretch:100%;text-transform:uppercase;line-height:.86;white-space:nowrap}
.H{font-family:'Gochi';color:${L};-webkit-text-stroke:.02em currentColor;line-height:1.02;white-space:nowrap}
.ink .H{color:${INK}}
.meta{font-weight:800;font-size:22px;letter-spacing:.16em;text-transform:uppercase}
.rule{position:absolute;height:3px;background:rgba(255,255,255,.25)}
.ink .rule{background:rgba(0,0,0,.22)}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);background-size:90px 90px}
.sand{position:absolute;inset:0;background:radial-gradient(90% 70% at 70% 82%,#6b5a3e 0%,#2b241a 45%,${INK} 100%)}
.grain{position:absolute;inset:0;opacity:.13;mix-blend-mode:overlay;pointer-events:none;z-index:50;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
.tag{position:absolute;display:flex;align-items:center;gap:14px;font-weight:900;letter-spacing:.18em;font-size:22px}
.tag img{width:44px;height:44px;border-radius:10px}
.phone{position:absolute;border-radius:70px;background:${INK};padding:18px;box-shadow:0 40px 120px rgba(0,0,0,.7);border:2px solid rgba(255,255,255,.18)}
.phone div{width:100%;height:100%;border-radius:54px;background-size:cover;background-position:top}
.pill{display:inline-block;background:${L};color:${INK};font-weight:900;font-size:28px;letter-spacing:.1em;text-transform:uppercase;padding:18px 36px;border-radius:999px}
.ink .pill{background:${INK};color:${L}}
.photo{position:absolute;inset:0;background-size:cover;background-position:center}
.fade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,11,11,.82) 0%,rgba(11,11,11,.55) 30%,rgba(11,11,11,0) 58%,rgba(11,11,11,0) 80%,rgba(11,11,11,.6) 100%)}
.fade.deep{background:linear-gradient(180deg,rgba(11,11,11,.8) 0%,rgba(11,11,11,.5) 40%,rgba(11,11,11,.55) 70%,rgba(11,11,11,.85) 100%)}
.lift,.deep~* .D,.deep~* .H,.deep~.D,.deep~.H{text-shadow:0 2px 18px rgba(0,0,0,.75)}
.panel{background:rgba(11,11,11,.62);border:1px solid rgba(255,255,255,.12);border-radius:32px;padding:6px 28px;backdrop-filter:blur(8px)}
.row{display:flex;align-items:center;gap:24px;padding:22px 0;border-bottom:2px solid rgba(255,255,255,.12)}
.row:last-child{border-bottom:0}
.badge{flex:none;width:92px;text-align:center}
`
const FIT = `<script>window.__fit=()=>{document.querySelectorAll('[data-fit]').forEach(box=>{const max=+box.dataset.fit||1e9;const hs=[...box.querySelectorAll('.D,.W,.H')];let g=60;const over=()=>box.scrollHeight>max||hs.some(h=>h.scrollWidth>box.clientWidth+2);while(over()&&g--)hs.forEach(h=>{h.style.fontSize=(parseFloat(getComputedStyle(h).fontSize)*.95)+'px'})})}</script>`
const doc = (w, h, bg, body, ink = false) => `<!doctype html><html><head><meta charset="utf-8"><style>${css(w, h, bg)}</style></head><body class="${ink ? "ink" : ""}">${body}<div class="grain"></div>${FIT}</body></html>`
const post = (body, bg = INK, ink = false) => doc(1080, 1350, bg, body, ink)
const story = (body, bg = INK, ink = false) => doc(1080, 1920, bg, body, ink)

const tag = (pos = "left:60px;bottom:48px", ink = false) => `<div class="tag" style="${pos};color:${ink ? INK : "#fff"}"><img src="${ICON}">SANDER<span style="opacity:.6;font-weight:700">BEACH VOLLEY</span></div>`
const header = (left, right, top = 60, ink = false) => `<div class="meta" style="position:absolute;left:60px;right:60px;top:${top}px;display:flex;justify-content:space-between;gap:30px;white-space:nowrap;color:${ink ? INK : L}"><span style="overflow:hidden;text-overflow:ellipsis">${esc(left)}</span><span>${esc(right ?? "")}</span></div><div class="rule" style="left:60px;right:60px;top:${top + 44}px"></div>`
const phone = (src, { left, top, width, rotate = 8 }) => `<div class="phone" style="left:${left}px;top:${top}px;width:${width}px;height:${Math.round(width * 2.1)}px;transform:rotate(${rotate}deg)"><div style="background-image:url(${src})"></div></div>`
/** AI photo (bgai.mjs) under a dark fade: text on top, scene below. */
/** deep: darker all over, for formats with text from top to bottom. */
const photoBg = (src, deep = false) => `<div class="photo" style="background-image:url(${src})"></div><div class="fade${deep ? " deep" : ""}"></div>`
const bgOr = (src, drawn) => (src ? photoBg(src, true) : drawn)
const lines = (a, cls, size, extra = "") => arr(a).map((t) => `<div class="${cls}" style="font-size:${size}px;${extra}">${esc(t)}</div>`).join("")
const rows = (list, size = 34) => list.map((r) => `<div class="row"><div class="badge"><div class="D" style="font-size:64px;color:${L}">${esc(r.badge)}</div><div class="meta" style="font-size:18px;opacity:.7;margin-top:4px">${esc(r.badgeSub ?? "")}</div></div><div style="flex:1;min-width:0"><div style="font-size:${size}px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.title)}</div><div style="font-size:${Math.round(size * 0.76)}px;opacity:.7;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.sub)}</div></div></div>`).join("")

/** Stable pick from a list by a text (dates, titles): the same slot always gets the same line, the next week another. */
const pickBy = (list, key) => list[[...String(key)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % list.length]

/** Headline + hand line of the FIPAV weekend cover: rotates so two weeks never look the same. */
// «Il weekend è già pieno» went out on 23/11/2026: out of the rotation.
const FIPAV_LINES = [
  [["Sabbia piena", "ovunque."], "manca solo la tua coppia →"],
  [["Due giorni,", "mille set."], "il compagno ce l'hai? →"],
  [["Si gioca", "in tutta Italia."], "trova con chi entrare →"],
  [["Weekend", "da torneo."], "scegli il tuo e vai →"],
  [["Tabellone", "aperto."], "il tuo nome dov'è? →"],
]
/** Hand notes beside the phone in E stories: two per story, never the same pair every time. */
const STORY_NOTES = [["gratis →", "entri con<br>un tap →"], ["zero gruppi<br>whatsapp →", "tutto in<br>un'app →"], ["al tuo<br>livello →", "vicino<br>a te →"], ["provala<br>stasera →", "ci metti<br>un minuto →"]]

// ─── Posts (1080×1350) ───────────────────────────────────────────────────────

/** A — FIPAV weekend: the number is the story. */
export function fipavNumero({ label, count, days, cities, more, source = "Fonte: FIPAV", img }) {
  const big = String(count).length > 2 ? 420 : 560
  const [head, hand] = pickBy(FIPAV_LINES, label)
  return post(`${bgOr(img, `<div class="grid"></div>`)}
${header(label.replace(/ · Tutta Italia$/i, ""), "Calendario FIPAV")}
<div class="D" style="position:absolute;right:-24px;top:150px;font-size:${big}px;color:${L}">${esc(count)}</div>
<div class="meta" style="position:absolute;left:60px;top:200px;width:380px;line-height:1.75;color:rgba(255,255,255,.75)">Tornei · ${esc(days)}<br>${cities.slice(0, 4).map(esc).join("<br>")}${more > 0 || cities.length > 4 ? `<br><span style="color:${L}">+${more + Math.max(0, cities.length - 4)} città</span>` : ""}</div>
<div data-fit="330" style="position:absolute;left:60px;right:60px;top:740px">${lines(head, "D", 150)}</div>
<div class="H" style="position:absolute;left:66px;top:1040px;font-size:80px;transform:rotate(-3deg)">${esc(hand)}</div>
<div class="meta" style="position:absolute;right:60px;bottom:56px;color:rgba(255,255,255,.6)">${esc(source)} · Swipe</div>
${tag()}`)
}

/** D — the hook as a lime poster. */
export function gancio({ eyebrow, d, h, sticker, sub, img }) {
  if (img) return post(`${photoBg(img)}
${header(eyebrow, "Beach volley")}
<div data-fit="400" style="position:absolute;left:52px;right:52px;top:150px" class="lift">${lines(d, "D", 200)}</div>
<div data-fit="150" style="position:absolute;left:60px;right:60px;top:590px" class="lift">${lines(h, "H", 92, "transform:rotate(-3deg);transform-origin:left")}</div>
${tag()}<div class="meta" style="position:absolute;right:60px;bottom:58px">Swipe →</div>`)
  return post(`<div class="meta" style="position:absolute;left:60px;right:60px;top:64px;color:${INK}">${esc(eyebrow)}</div>
<div data-fit="700" style="position:absolute;left:52px;right:52px;top:220px">${lines(d, "D", 230, `color:${INK}`)}</div>
<div data-fit="200" style="position:absolute;left:60px;right:60px;top:960px">${lines(h, "H", 92, "transform:rotate(-3deg);transform-origin:left")}</div>
${sticker ? `<div style="position:absolute;right:60px;top:110px;background:${INK};color:${L};font-weight:900;font-size:28px;padding:14px 22px;border-radius:14px;transform:rotate(5deg)">${esc(sticker)}</div>` : ""}
${sub ? `<div style="position:absolute;left:60px;right:60px;bottom:120px;font-size:32px;font-weight:700;color:${INK}">${esc(sub)}</div>` : ""}
${tag(undefined, true)}<div class="meta" style="position:absolute;right:60px;bottom:58px;color:${INK}">Swipe →</div>`, L, true)
}

/** D (dark) — the quote. */
export function citazione({ who, d, mk, d2, h, img }) {
  if (img) return post(`${photoBg(img)}
${header(`《 ${who} 》`, "Beach volley")}
<div data-fit="520" style="position:absolute;left:60px;right:60px;top:150px" class="lift">
  ${lines(d, "D", 130)}
  <div class="D" style="font-size:130px;margin-top:26px"><span style="background:${L};color:${INK};padding:0 .1em;text-shadow:none">${esc(mk)}</span>${d2 ? ` ${esc(d2)}` : ""}</div>
  <div class="H" style="font-size:84px;margin-top:18px;transform:rotate(-3deg);transform-origin:left">${esc(h)}</div>
</div>
${tag()}`)
  return post(`${header(`《 ${who} 》`, "Beach volley")}
<div class="W" style="position:absolute;left:44px;top:120px;font-size:420px;color:${L};opacity:.9">“</div>
<div data-fit="560" style="position:absolute;left:60px;right:60px;top:470px">
  ${lines(d, "D", 150)}
  <div class="D" style="font-size:150px"><span style="background:${L};color:${INK};padding:0 .1em">${esc(mk)}</span>${d2 ? ` ${esc(d2)}` : ""}</div>
  <div class="H" style="font-size:96px;margin-top:22px;transform:rotate(-3deg);transform-origin:left">${esc(h)}</div>
</div>
${tag()}`)
}

/** A — lock screen of notifications on the scoreboard. */
export function notifiche({ date, time, n, d, h, img }) {
  const card = ([emoji, body, when]) => `<div style="background:rgba(30,30,30,.72);border:1px solid rgba(255,255,255,.14);border-radius:30px;padding:22px 24px;display:flex;gap:20px;align-items:center">
  <img src="${ICON}" style="width:66px;height:66px;border-radius:16px;flex:none">
  <div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;font-size:23px"><b>SANDER</b><span style="opacity:.6">${esc(when)}</span></div><div style="font-size:29px;line-height:1.28;margin-top:4px">${emoji} ${esc(body)}</div></div></div>`
  return post(`${bgOr(img, `<div class="grid"></div>`)}
${header(date, "Notifiche")}
<div class="D" style="position:absolute;left:56px;top:130px;font-size:250px;color:${L}">${esc(time)}</div>
<div style="position:absolute;left:60px;right:60px;top:400px;display:flex;flex-direction:column;gap:14px">${n.map(card).join("")}</div>
<div data-fit="220" style="position:absolute;left:60px;right:60px;bottom:120px">${lines([d], "D", 96)}${lines([h], "H", 96)}</div>
${tag()}`)
}

/** E — the app in the hand, at dusk on the sand. */
export function appSlide({ eyebrow, d, h, img, bullets }) {
  return post(`<div class="sand"></div>
<div class="meta" style="position:absolute;left:60px;top:64px;color:${L}">${esc(eyebrow)}</div>
<div data-fit="260" style="position:absolute;left:60px;width:520px;top:120px">${lines([d], "D", 120)}${lines([h], "H", 104)}</div>
${phone(img, { left: 560, top: 250, width: 470 })}
<div style="position:absolute;left:60px;width:470px;top:480px">${bullets.map((b, i) => `<div class="H" style="font-size:44px;white-space:normal;line-height:1.08;margin-bottom:38px;transform:rotate(${i % 2 ? 2 : -3}deg)">${esc(b)} →</div>`).join("")}</div>
${tag()}`)
}

/** A — rows on the scoreboard. */
export function listSlide({ eyebrow, d, h, rows: list, note, img }) {
  return post(`${bgOr(img, `<div class="grid"></div>`)}
${header(eyebrow, "")}
<div data-fit="220" style="position:absolute;left:60px;right:60px;top:140px">${lines([d], "D", 130)}${h ? lines([h], "H", 90) : ""}</div>
<div class="${img ? "panel" : ""}" style="position:absolute;left:60px;right:60px;top:${h ? 400 : 300}px">${rows(list)}</div>
${note ? `<div class="meta" style="position:absolute;left:60px;right:60px;bottom:120px;color:rgba(255,255,255,.6);letter-spacing:.08em;text-transform:none;font-size:26px">${esc(note)}</div>` : ""}
${tag()}`)
}

/** Glossario da spiaggia — a beach-volley word, its meaning, how to use it. */
export function glossario({ n, word, sound, def, use, img }) {
  return post(`${bgOr(img, "")}${header(`Glossario da spiaggia · n. ${String(n).padStart(2, "0")}`, "Beach volley")}
<div data-fit="260" style="position:absolute;left:56px;right:56px;top:220px">${lines([word], "W", 250, `color:${L}`)}</div>
<div style="position:absolute;left:62px;top:500px;font-size:36px;color:rgba(255,255,255,.6);font-style:italic">${esc(sound)} · beach volley</div>
<div style="position:absolute;left:60px;right:90px;top:600px;font-size:52px;font-weight:700;line-height:1.25">${esc(def)}</div>
<div style="position:absolute;left:60px;right:90px;top:930px;font-size:36px;line-height:1.4;color:rgba(255,255,255,.75)"><b style="color:#fff">Si usa così:</b> «${esc(use)}»</div>
<div class="H" style="position:absolute;right:70px;top:1110px;font-size:64px;transform:rotate(-4deg)">salvalo →</div>
${tag()}`)
}

/** Frase da rete on a photo: white lines, the second half in lime hand. Without a photo: the lime card (formats.mjs). */
export function frase({ n, d, h, img }) {
  if (!img) return frase0({ n, d, h })
  return post(`${photoBg(img)}
${header(`Frasi da rete · n. ${String(n).padStart(2, "0")}`, "Beach volley")}
<div data-fit="560" style="position:absolute;left:56px;right:56px;top:150px" class="lift">
  ${lines(d, "D", 150)}
  <div style="margin-top:24px;transform:rotate(-2deg);transform-origin:left">${lines(h, "H", 110)}</div>
</div>
${tag()}<div class="meta" style="position:absolute;right:60px;bottom:58px">Salvalo ↓</div>`)
}

/**
 * Chat cover, «bacheca» look (Alex, 26/11/2026: the WhatsApp screen is out): warm paper, the AI photo
 * as a taped polaroid, the group messages as paper notes, the last one crossed out in red, a red
 * stamp, then the headline and the SANDER match card stapled on. Without a photo: the old chat.
 */
export function chat({ group, msgs, sticker, d, card, img, faceList = ["marco-1", "sara-1", "luca-1", "giorgia-1"] }) {
  if (!img) return chat0({ group, msgs, sticker, d, card, faceList, sub: "", seen: "" })
  const RED = "#ff4d5e"
  const first = msgs.find((m) => m[2])?.[1] ?? ""
  const last = [...msgs].reverse().find((m) => m[2])?.[1] ?? ""
  const others = msgs.filter((m) => !m[2]).slice(0, 4)
  const face = (n) => b64(join(KIT, "assets", "faces", `${n}.webp`), "image/webp")
  const note = ([who, txt], i) => `<div style="background:${i % 2 ? L : "#fffdf7"};color:${INK};padding:16px 22px 18px;border-radius:6px;box-shadow:0 10px 24px rgba(60,40,10,.22);transform:rotate(${[2.5, -2, 3, -3][i]}deg);margin:0 ${i % 2 ? 0 : 26}px 22px ${i % 2 ? 26 : 0}px">
  <div style="font-weight:900;font-size:19px;letter-spacing:.16em;text-transform:uppercase;opacity:.6">${esc(who)}</div>
  <div style="font-weight:700;font-size:31px;line-height:1.2;margin-top:4px">${esc(txt)}</div></div>`
  return post(`<div style="position:absolute;inset:0;background:radial-gradient(120% 90% at 30% 20%,#f4ecda 0%,#e9dec5 60%,#ddd0b2 100%)"></div>
<div class="meta" style="position:absolute;left:60px;right:60px;top:56px;display:flex;justify-content:space-between;color:${INK};opacity:.75"><span>${esc(group)}</span><span>Ieri · 18:47</span></div>
<div style="position:absolute;left:52px;top:112px;width:600px;background:#fbfaf6;padding:22px 22px 118px;box-shadow:0 26px 50px rgba(60,40,10,.35);transform:rotate(-4deg)">
  <div style="height:540px;background:url(${img}) center/cover"></div>
  <div class="H" style="position:absolute;left:28px;right:24px;bottom:16px;font-size:40px;color:${INK};white-space:normal;line-height:1.02">«${esc(first)}»</div>
  <div style="position:absolute;left:44px;top:470px;transform:rotate(-7deg);border:5px solid ${RED};color:${RED};font-weight:900;font-size:28px;letter-spacing:.08em;text-transform:uppercase;padding:8px 16px;border-radius:10px;background:rgba(255,255,255,.55);white-space:nowrap">${esc(sticker)}</div>
  <div style="position:absolute;left:-30px;top:-18px;width:170px;height:46px;background:rgba(198,247,54,.82);transform:rotate(-28deg)"></div>
  <div style="position:absolute;right:-34px;top:-14px;width:170px;height:46px;background:rgba(198,247,54,.82);transform:rotate(24deg)"></div>
</div>
<div style="position:absolute;left:680px;right:44px;top:128px">${others.map(note).join("")}
<div style="position:relative;margin-top:14px;transform:rotate(-3deg)">
  <div class="H" style="font-size:48px;color:${INK};white-space:normal;line-height:1.12;text-decoration:line-through;text-decoration-color:${RED};text-decoration-thickness:5px">${esc(last)}</div>
</div></div>
<div class="H" style="position:absolute;left:62px;top:868px;font-size:52px;color:${INK};transform:rotate(-3deg)">intanto su Sander →</div>
<div data-fit="262" style="position:absolute;left:56px;width:580px;top:935px">${lines(d.slice(0, -1), "D", 150, `color:${INK}`)}<div class="D" style="font-size:150px;color:${INK};margin-top:14px"><span style="background:${L};padding:0 .08em">${esc(d[d.length - 1])}</span></div></div>
<div style="position:absolute;right:52px;top:905px;width:350px;background:${INK};color:#fff;border-radius:26px;padding:26px;transform:rotate(5deg);box-shadow:0 22px 40px rgba(0,0,0,.35)">
  <div style="position:absolute;left:50%;top:-12px;width:70px;height:12px;margin-left:-35px;border:4px solid #9a9a9a;border-bottom:0;border-radius:4px 4px 0 0"></div>
  <div style="font-size:21px;font-weight:900;letter-spacing:.14em;color:${L}">${esc(card[0])}</div>
  <div style="font-size:34px;font-weight:900;margin-top:6px">${esc(card[1])}</div>
  <div style="display:flex;gap:8px;margin:16px 0 14px">${faceList.map((f) => `<div style="width:58px;height:58px;border-radius:50%;background:url(${face(f)}) center/cover;border:3px solid ${L}"></div>`).join("")}</div>
  <span style="display:inline-block;background:${L};color:${INK};font-weight:900;font-size:22px;border-radius:999px;padding:8px 16px">4/4 · COMPLETA ✓</span>
</div>
${tag(undefined, true)}<div class="meta" style="position:absolute;right:60px;bottom:58px;color:${INK}">Swipe →</div>`, "#e9dec5", true)
}

// ─── Stories (1080×1920) ─────────────────────────────────────────────────────

const storyPill = (t = "Link in bio") => `<div style="position:absolute;left:0;right:0;bottom:400px;text-align:center"><span class="pill">${esc(t)}</span></div>`

/** E — a feature or «stasera» in the hand. */
export function storyPhone({ metaItems, title, img, photo }) {
  const [n1, n2] = pickBy(STORY_NOTES, title.join(" "))
  return story(`${photo ? photoBg(photo) : `<div class="sand"></div>`}
${header(metaItems[0], metaItems.slice(1).join(" · "), 270)}
<div data-fit="330" style="position:absolute;left:60px;right:60px;top:360px">${lines([title[0]], "D", 190)}${lines([title[1]], "H", 150, "transform:rotate(-3deg);transform-origin:left")}</div>
${phone(img, { left: 590, top: 700, width: 340, rotate: 7 })}
<div class="H lift" style="position:absolute;left:70px;top:900px;font-size:58px;line-height:1.05;transform:rotate(-4deg)">${n1}</div>
<div class="H lift" style="position:absolute;left:90px;top:1110px;font-size:58px;line-height:1.05;transform:rotate(3deg)">${n2}</div>
${storyPill()}`)
}

/** E — tutorial step with the giant lime number. */
export function storyStep({ n, total, heading, text, img, featureName, photo }) {
  return story(`${bgOr(photo, `<div class="sand"></div>`)}
${header(`Tutorial · ${featureName}`, `${n}/${total}`, 270)}
<div class="D" style="position:absolute;left:40px;top:330px;font-size:440px;color:${L}">${n}</div>
<div data-fit="420" style="position:absolute;left:340px;right:60px;top:380px">${lines([heading], "H", 110)}<div style="font-size:38px;font-weight:700;line-height:1.3;margin-top:18px">${esc(text)}</div></div>
${phone(img, { left: 350, top: 650, width: 380, rotate: n % 2 ? 6 : -6 })}
${storyPill(n === total ? "Link in bio" : "Avanti →")}`)
}

/** A — this weekend, as a scoreboard. */
export function storyList({ metaItems, title, rows: list, note, photo }) {
  return story(`${bgOr(photo, `<div class="grid"></div>`)}
${header(metaItems[0], metaItems.slice(1).join(" · "), 270)}
<div data-fit="330" style="position:absolute;left:60px;right:60px;top:360px">${lines([title[0]], "D", 170)}${lines([title[1]], "H", 130)}</div>
<div class="${photo ? "panel" : ""}" style="position:absolute;left:60px;right:60px;top:720px">${rows(list, 38)}</div>
${note ? `<div class="meta" style="position:absolute;left:60px;right:60px;bottom:500px;color:rgba(255,255,255,.65);text-transform:none;letter-spacing:.06em;font-size:28px">${esc(note)}</div>` : ""}
${storyPill()}`)
}

/** A — countdown: the number of days, huge. */
export function storyCountdown({ days, name, sub, source = "SANDER", photo }) {
  const big = days <= 0 ? "Oggi" : days === 1 ? "Domani" : String(days)
  return story(`${bgOr(photo, `<div class="grid"></div>`)}
${header("Prossimo torneo", source, 270)}
<div data-fit="760" style="position:absolute;left:40px;right:40px;top:330px">${lines([big], "D", days > 1 ? 700 : 300, `color:${L}`)}</div>
${days > 1 ? `<div class="H" style="position:absolute;left:70px;top:1000px;font-size:96px;transform:rotate(-3deg)">giorni al via →</div>` : ""}
<div data-fit="160" style="position:absolute;left:60px;right:60px;top:1140px">${lines([name], "D", 110)}</div>
<div style="position:absolute;left:60px;right:60px;top:1290px;font-size:36px;font-weight:700;opacity:.8">${esc(sub)}</div>
${storyPill()}`)
}

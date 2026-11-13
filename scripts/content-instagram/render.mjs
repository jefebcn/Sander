/**
 * Renders the planned slots of @sanderbeachvolley into JPGs + captions.
 *
 *   SITE=https://www.sanderbv.it node render.mjs plan.json out/
 *
 * Style: dark UI with a sunset amber/orange accent, generated backgrounds
 * (no stock photos, so no reuse limits), Gochi Hand titles, Inter labels,
 * real app screens inside a phone mockup. Posts 1080×1350, stories 1080×1920.
 * Stories keep text out of the top 270 px and bottom 380 px.
 *
 * Tournament slides use a live screenshot of the public page on SITE; if it
 * fails, the static screen from screens/ is used instead.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { chromium } from "playwright"
import { FEATURES, COMMUNITY, MISSING_ONE, TONIGHT, HASHTAGS, pick } from "./content.mjs"

const KIT = dirname(fileURLToPath(import.meta.url))
const SITE = process.env.SITE || "https://www.sanderbv.it"
const b64 = (p, type) => `data:${type};base64,${readFileSync(p).toString("base64")}`
const screen = (name) => b64(join(KIT, "screens", `${name}.jpg`), "image/jpeg")
const ICON = b64(join(KIT, "assets", "icon.png"), "image/png")
const FONT_HAND = b64(join(KIT, "fonts", "GochiHand.woff2"), "font/woff2")
const FONT_INTER = b64(join(KIT, "fonts", "Inter.woff2"), "font/woff2")

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c])
const MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"]
const DAYS = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"]
const dayLabel = (iso, withWeekday = true) => {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso)
  const parts = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", weekday: "long", day: "numeric", month: "long" }).formatToParts(d)
  const get = (t) => parts.find((p) => p.type === t)?.value ?? ""
  return withWeekday ? `${get("weekday")} ${get("day")} ${get("month")}` : `${get("day")} ${get("month")}`
}
const timeLabel = (iso) => new Date(iso).toLocaleTimeString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" })
const daysBetween = (fromYmd, iso) => Math.round((Date.parse(`${iso.slice(0, 10)}T12:00:00Z`) - Date.parse(`${fromYmd}T12:00:00Z`)) / 86_400_000)
void MONTHS; void DAYS

// ─── Look ────────────────────────────────────────────────────────────────────

const PALETTES = [
  { a: "#ffb547", b: "#ff7a3d", glow: "255,138,61" },   // amber → orange
  { a: "#ffc247", b: "#ff9a3d", glow: "255,170,70" },   // warm amber
  { a: "#ff9f5a", b: "#ff6a4d", glow: "255,110,80" },   // sunset coral
]

function css(w, h, pal) {
  return `
@font-face{font-family:'Gochi';src:url(${FONT_HAND}) format('woff2')}
@font-face{font-family:'Inter';src:url(${FONT_INTER}) format('woff2');font-weight:100 900}
*{margin:0;padding:0;box-sizing:border-box}
body{width:${w}px;height:${h}px;overflow:hidden;position:relative;background:#0b0b0c;color:#fff;font-family:'Inter',sans-serif}
.hand{font-family:'Gochi',cursive;line-height:.92;letter-spacing:.005em}
.acc{color:${pal.a}}
.grad{background:linear-gradient(90deg,${pal.a},${pal.b});-webkit-background-clip:text;background-clip:text;color:transparent}
.eyebrow{font-size:26px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:${pal.a}}
.label{font-size:24px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;opacity:.75}
.pill{display:inline-flex;align-items:center;gap:12px;border-radius:999px;padding:16px 30px;font-size:28px;font-weight:800;letter-spacing:.04em}
.pill.solid{background:linear-gradient(90deg,${pal.a},${pal.b});color:#111}
.pill.line{border:2px solid rgba(255,255,255,.35);color:#fff;background:rgba(0,0,0,.25)}
.brand{position:absolute;display:flex;align-items:center;gap:14px;font-size:26px;font-weight:900;letter-spacing:.2em}
.brand img{width:52px;height:52px;border-radius:14px}
.card{background:rgba(22,23,26,.82);border:1px solid rgba(255,255,255,.08);border-radius:28px}
.row{display:flex;align-items:center;gap:22px;padding:22px 26px;border-bottom:1px solid rgba(255,255,255,.07)}
.row:last-child{border-bottom:0}
.badge{flex:none;min-width:74px;height:74px;border-radius:20px;background:rgba(255,255,255,.07);display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;font-size:30px;line-height:1}
.badge small{font-size:15px;font-weight:800;letter-spacing:.1em;opacity:.7;margin-top:4px}
.phone{position:absolute;border-radius:64px;padding:14px;background:linear-gradient(145deg,#2b2c31,#0d0d0f);box-shadow:0 40px 90px rgba(0,0,0,.65),0 0 0 2px rgba(255,255,255,.08),0 0 120px rgba(${pal.glow},.25)}
.phone .scr{width:100%;height:100%;border-radius:52px;overflow:hidden;position:relative;background:#0b0b0c;padding-top:13%}
.phone .scr img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
.phone .bar{position:absolute;top:0;left:0;right:0;height:13%;display:flex;align-items:center;justify-content:space-between;padding:0 11% 0 12%;font-size:17px;font-weight:800;color:#fff}
.phone .island{position:absolute;top:3.2%;left:50%;transform:translateX(-50%);width:30%;height:4.2%;border-radius:20px;background:#000;z-index:2}
.num{font-family:'Gochi',cursive;font-size:150px;line-height:.8}
`
}

/** Generated background: dark base, sunset glow, horizon line, faint net, grain. */
function background(w, h, pal, seed) {
  const pos = [["78%", "12%"], ["18%", "88%"], ["50%", "0%"], ["90%", "70%"]][seed % 4]
  const netAngle = [8, -6, 12, -10][seed % 4]
  const grain = `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .07 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`)}")`
  return `
<div style="position:absolute;inset:0;background:radial-gradient(110% 70% at ${pos[0]} ${pos[1]},rgba(${pal.glow},.55) 0%,rgba(${pal.glow},.18) 35%,rgba(11,11,12,0) 65%),linear-gradient(180deg,#141416 0%,#0b0b0c 55%,#0f0d0b 100%)"></div>
<div style="position:absolute;left:-10%;right:-10%;top:${seed % 2 ? 62 : 58}%;height:2px;background:linear-gradient(90deg,transparent,rgba(${pal.glow},.35),transparent);transform:rotate(${netAngle / 4}deg)"></div>
<div style="position:absolute;inset:-20%;background:repeating-linear-gradient(${90 + netAngle}deg,rgba(255,255,255,.035) 0 2px,transparent 2px 68px),repeating-linear-gradient(${netAngle}deg,rgba(255,255,255,.03) 0 2px,transparent 2px 68px);mask-image:radial-gradient(60% 40% at ${pos[0]} ${pos[1]},#000 0%,transparent 70%);-webkit-mask-image:radial-gradient(60% 40% at ${pos[0]} ${pos[1]},#000 0%,transparent 70%)"></div>
<div style="position:absolute;inset:0;background-image:${grain};opacity:.9;mix-blend-mode:overlay"></div>`
}

function phone(src, { left, top, width, rotate = 0 }) {
  const height = Math.round(width * 2.16)
  return `<div class="phone" style="left:${left}px;top:${top}px;width:${width}px;height:${height}px;transform:rotate(${rotate}deg)"><div class="scr"><div class="bar"><span>9:41</span><span>●●●</span></div><div class="island"></div><img src="${src}"></div></div>`
}

const brand = (pos) => `<div class="brand" style="${pos}"><img src="${ICON}">SANDER</div>`

// Shrinks .hand text inside [data-fit] boxes until the box fits its max height and width.
const FIT = `<script>window.__fit=()=>{document.querySelectorAll('[data-fit]').forEach(box=>{const max=+box.dataset.fit;const hs=[...box.querySelectorAll('.hand')];let guard=60;const over=()=>box.scrollHeight>max||hs.some(h=>h.scrollWidth>box.clientWidth+2);while(over()&&guard--){hs.forEach(h=>{h.style.fontSize=(parseFloat(getComputedStyle(h).fontSize)*0.94)+'px'})}})}</script>`

function page(w, h, pal, seed, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css(w, h, pal)}</style></head><body>${background(w, h, pal, seed)}${body}${FIT}</body></html>`
}

const title2 = ([a, b], size, accentSecond = true) =>
  `<div class="hand" style="font-size:${size}px;white-space:nowrap">${esc(a)}</div><div class="hand ${accentSecond ? "grad" : ""}" style="font-size:${size}px;white-space:nowrap">${esc(b)}</div>`

// ─── Post slides (1080×1350) ─────────────────────────────────────────────────

const P = { w: 1080, h: 1350 }

function postCover({ pal, seed, eyebrow, title, img, sub, swipe = true }) {
  return page(P.w, P.h, pal, seed, `
    ${brand("top:64px;left:72px")}
    <div style="position:absolute;top:170px;left:72px;width:550px">
      <div class="eyebrow" style="margin-bottom:26px">${esc(eyebrow)}</div>
      <div data-fit="300" style="width:550px">${title2(title, 128)}</div>
      ${sub ? `<div style="font-size:34px;font-weight:600;line-height:1.35;opacity:.85;margin-top:34px">${esc(sub)}</div>` : ""}
    </div>
    ${phone(img, { left: 640, top: 250, width: 400, rotate: 6 })}
    ${swipe ? `<div style="position:absolute;left:72px;bottom:72px"><span class="pill line">Swipe →</span></div>` : ""}`)
}

function postPhoneBullets({ pal, seed, eyebrow, heading, img, bullets }) {
  return page(P.w, P.h, pal, seed + 1, `
    ${brand("top:64px;left:72px")}
    ${phone(img, { left: 72, top: 200, width: 440 })}
    <div style="position:absolute;top:230px;left:572px;right:64px">
      <div class="eyebrow" style="margin-bottom:22px">${esc(eyebrow)}</div>
      <div data-fit="200" style="margin-bottom:40px"><div class="hand" style="font-size:84px">${esc(heading)}</div></div>
      ${bullets.map((b, i) => `<div style="display:flex;gap:22px;margin-bottom:38px"><div class="num grad" style="font-size:96px;width:70px">${i + 1}</div><div style="font-size:34px;font-weight:700;line-height:1.3;padding-top:10px">${esc(b)}</div></div>`).join("")}
    </div>`)
}

function postList({ pal, seed, eyebrow, heading, rows, note }) {
  return page(P.w, P.h, pal, seed + 2, `
    ${brand("top:64px;left:72px")}
    <div style="position:absolute;top:170px;left:72px;right:72px">
      <div class="eyebrow" style="margin-bottom:20px">${esc(eyebrow)}</div>
      <div data-fit="110" style="margin-bottom:44px"><div class="hand" style="font-size:96px;white-space:nowrap">${esc(heading)}</div></div>
      <div class="card">${rows.map((r) => `<div class="row"><div class="badge">${esc(r.badge)}<small>${esc(r.badgeSub ?? "")}</small></div><div style="flex:1;min-width:0"><div style="font-size:34px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.title)}</div><div style="font-size:26px;opacity:.7;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.sub)}</div></div>${r.tag ? `<div class="pill solid" style="font-size:22px;padding:10px 18px">${esc(r.tag)}</div>` : ""}</div>`).join("")}</div>
      ${note ? `<div style="font-size:26px;opacity:.6;margin-top:26px">${esc(note)}</div>` : ""}
    </div>`)
}

function postCta({ pal, seed, line, img }) {
  return page(P.w, P.h, pal, seed + 3, `
    ${phone(img, { left: 590, top: 150, width: 420, rotate: 4 })}
    <div style="position:absolute;top:300px;left:72px;width:500px">
      <div data-fit="230" style="margin-bottom:46px"><div class="hand" style="font-size:112px;white-space:nowrap">${esc(line[0])}</div><div class="hand grad" style="font-size:112px;white-space:nowrap">${esc(line[1])}</div></div>
      <img src="${ICON}" style="width:132px;height:132px;border-radius:32px;display:block;margin-bottom:24px">
      <div class="hand" style="font-size:70px">sanderbv.it</div>
      <div class="label" style="margin-top:12px">Link in bio · Gratis su iPhone e Android</div>
    </div>`)
}

function postProblem({ pal, seed, hook }) {
  const dot = (filled) => `<div style="width:150px;height:150px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Gochi';font-size:96px;${filled ? `background:linear-gradient(145deg,${pal.a},${pal.b});color:#111` : "border:5px dashed rgba(255,255,255,.45);color:rgba(255,255,255,.7)"}">${filled ? "✓" : "?"}</div>`
  return page(P.w, P.h, pal, seed, `
    ${brand("top:64px;left:72px")}
    <div style="position:absolute;top:230px;left:72px;right:72px;text-align:center">
      ${title2(hook, 150)}
      <div style="display:flex;justify-content:center;gap:34px;margin-top:90px">${dot(true)}${dot(true)}${dot(true)}${dot(false)}</div>
      <div style="font-size:36px;font-weight:600;opacity:.85;margin-top:60px">Tre pronti, il campo c'è.<br>Il quarto?</div>
    </div>
    <div style="position:absolute;left:0;right:0;bottom:72px;text-align:center"><span class="pill line">Swipe →</span></div>`)
}

// ─── Story frames (1080×1920) ────────────────────────────────────────────────

const S = { w: 1080, h: 1920 }
const storyFoot = `<div style="position:absolute;left:0;right:0;bottom:400px;text-align:center"><span class="pill solid">Link in bio</span></div>`

function storyPhone({ pal, seed, eyebrow, title, img, foot = true }) {
  return page(S.w, S.h, pal, seed, `
    <div style="position:absolute;top:290px;left:72px;right:72px;text-align:center">
      <div class="eyebrow" style="margin-bottom:22px">${esc(eyebrow)}</div>
      <div data-fit="250">${title2(title, 130)}</div>
    </div>
    ${phone(img, { left: 355, top: 620, width: 370 })}
    <div style="position:absolute;left:0;right:0;bottom:0;height:560px;background:linear-gradient(180deg,rgba(11,11,12,0),rgba(11,11,12,.96) 40%)"></div>
    ${foot ? storyFoot : ""}`)
}

function storyStep({ pal, seed, n, total, heading, text, img, featureName }) {
  return page(S.w, S.h, pal, seed + n, `
    <div style="position:absolute;top:290px;left:72px;right:72px">
      <div style="display:flex;justify-content:space-between;align-items:center"><div class="eyebrow">Tutorial · ${esc(featureName)}</div><div class="label">${n}/${total}</div></div>
      <div style="display:flex;gap:30px;align-items:flex-end;margin-top:30px"><div class="num grad" style="font-size:200px;flex:none">${n}</div><div data-fit="220" style="flex:1;min-width:0"><div class="hand" style="font-size:92px;white-space:nowrap">${esc(heading)}</div><div style="font-size:34px;font-weight:600;opacity:.85;margin-top:14px;line-height:1.3">${esc(text)}</div></div></div>
    </div>
    ${phone(img, { left: 365, top: 640, width: 350 })}
    <div style="position:absolute;left:0;right:0;bottom:0;height:560px;background:linear-gradient(180deg,rgba(11,11,12,0),rgba(11,11,12,.96) 40%)"></div>
    ${n === total ? storyFoot : `<div style="position:absolute;left:0;right:0;bottom:400px;text-align:center"><span class="pill line">Avanti →</span></div>`}`)
}

function storyList({ pal, seed, eyebrow, title, rows, img, note }) {
  return page(S.w, S.h, pal, seed, `
    <div style="position:absolute;top:290px;left:72px;right:72px">
      <div class="eyebrow" style="margin-bottom:20px">${esc(eyebrow)}</div>
      <div data-fit="230">${title2(title, 120)}</div>
      <div class="card" style="margin-top:44px">${rows.map((r) => `<div class="row"><div class="badge">${esc(r.badge)}<small>${esc(r.badgeSub ?? "")}</small></div><div style="flex:1;min-width:0"><div style="font-size:34px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.title)}</div><div style="font-size:26px;opacity:.7;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.sub)}</div></div></div>`).join("")}</div>
      ${note ? `<div style="font-size:28px;opacity:.65;margin-top:24px">${esc(note)}</div>` : ""}
    </div>
    ${img ? phone(img, { left: 760, top: 1130, width: 250, rotate: 6 }) : ""}
    ${storyFoot}`)
}

function storyCountdown({ pal, seed, days, name, sub, img }) {
  const big = days <= 0 ? "Oggi" : days === 1 ? "Domani" : `-${days}`
  return page(S.w, S.h, pal, seed, `
    <div style="position:absolute;top:290px;left:72px;right:72px;text-align:center">
      <div class="eyebrow">Prossimo torneo</div>
      <div class="hand grad" style="font-size:${days > 1 ? 280 : 210}px;margin-top:6px">${esc(big)}</div>
      ${days > 1 ? `<div class="label" style="margin-top:-10px">giorni</div>` : ""}
      <div data-fit="200" style="margin-top:24px"><div class="hand" style="font-size:86px;white-space:nowrap">${esc(name)}</div></div>
      <div style="font-size:34px;font-weight:600;opacity:.8;margin-top:12px">${esc(sub)}</div>
    </div>
    ${phone(img, { left: 740, top: 1090, width: 250, rotate: 6 })}
    <div style="position:absolute;left:0;right:0;bottom:0;height:560px;background:linear-gradient(180deg,rgba(11,11,12,0),rgba(11,11,12,.94) 45%)"></div>
    ${storyFoot}`)
}

// ─── Live screenshots of public pages ────────────────────────────────────────

async function liveShot(browser, path, fallback) {
  try {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await ctx.addInitScript(() => { try { localStorage.setItem("cookie_consent", "accepted"); localStorage.setItem("sander_onboarded", "1") } catch {} })
    const p = await ctx.newPage()
    const res = await p.goto(`${SITE}${path}`, { waitUntil: "load", timeout: 45_000 })
    if (!res || res.status() >= 400) throw new Error(`HTTP ${res?.status()}`)
    await p.waitForTimeout(3500)
    await p.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {})
    const buf = await p.screenshot({ type: "jpeg", quality: 86 })
    await ctx.close()
    return `data:image/jpeg;base64,${buf.toString("base64")}`
  } catch (e) {
    console.error(`[render] live screenshot ${path} failed (${e.message}): using ${fallback}`)
    return screen(fallback)
  }
}

// ─── Slots → frames + captions ───────────────────────────────────────────────

const genderShort = (g) => (g === "F" ? "F" : g === "M" ? "M" : "MX")
const fipavRow = (e) => ({ badge: dayLabel(e.startDate.slice(0, 10), false).split(" ")[0], badgeSub: dayLabel(e.startDate.slice(0, 10), false).split(" ")[1]?.slice(0, 3), title: `${e.category} · ${genderShort(e.gender)}`, sub: `${e.city} (${e.region})${e.prizeEuro > 0 ? ` · ${e.prizeEuro.toLocaleString("it-IT")} €` : ""}` })
const tourRow = (t) => ({ badge: dayLabel(t.date, false).split(" ")[0], badgeSub: dayLabel(t.date, false).split(" ")[1]?.slice(0, 3), title: t.name, sub: [t.location, t.registrationOpen ? "iscrizioni aperte" : null].filter(Boolean).join(" · ") || "Su SANDER" })
const matchRow = (m) => ({ badge: timeLabel(m.date), badgeSub: dayLabel(m.date).split(" ")[0].slice(0, 3), title: `${m.format === "TWO_VS_TWO" ? "2v2" : m.format === "THREE_VS_THREE" ? "3v3" : "4v4"} · ${m.city || m.location}`, sub: `${m.spotsLeft === 1 ? "manca 1 giocatore" : `mancano ${m.spotsLeft} giocatori`}` })

function caption(lines) {
  return lines.filter(Boolean).join("\n\n")
}

async function renderSlot(slot, browser) {
  const w = slot.week
  const pal = pick(PALETTES, w, slot.day.length)
  const seed = (w * 7 + ["lun", "mar", "mer", "gio", "ven", "sab", "dom"].indexOf(slot.day)) % 97
  const f = slot.feature ? FEATURES[slot.feature] : null
  const v = Math.floor(w / 6) // variant index: changes each time a feature comes back

  switch (slot.kind) {
    case "feature": {
      const title = pick(f.titles, v)
      return {
        frames: [
          postCover({ pal, seed, eyebrow: "Funzione della settimana", title, img: screen(f.screen), sub: f.bullets[0] }),
          postPhoneBullets({ pal, seed, eyebrow: f.name, heading: "Come funziona", img: screen(f.tutorial[1][0]), bullets: f.bullets }),
          postCta({ pal, seed, line: ["Provala", "su SANDER"], img: screen(f.tutorial[2][0]) }),
        ],
        caption: caption([`${title.join(" ")} 🏐`, pick(f.captions, v), "Swipe per vedere come funziona. Gratis su iPhone e Android, link in bio.", HASHTAGS]),
      }
    }
    case "community": {
      const c = pick(COMMUNITY, Math.floor(w / 2))
      return {
        frames: [
          postCover({ pal, seed, eyebrow: "Community", title: c.title, img: screen(c.screen), sub: "Gioca, trova, sali." }),
          postCta({ pal, seed, line: ["Ci vediamo", "in campo"], img: screen("partite") }),
        ],
        caption: caption([`${c.title.join(" ")} ☀️`, c.caption, "Link in bio.", HASHTAGS]),
      }
    }
    case "fipav-weekend": {
      const top = slot.events[0]
      const fipavImg = await liveShot(browser, "/tournaments/fipav", "fipav")
      return {
        frames: [
          postCover({ pal, seed, eyebrow: `Tornei FIPAV · ${dayLabel(slot.weekend[0], false).split(" ")[0]}–${dayLabel(slot.weekend[1], false)}`, title: [top.category, top.city], img: fipavImg, sub: `${dayLabel(top.startDate.slice(0, 10))} · ${top.region}${top.prizeEuro ? ` · ${top.prizeEuro.toLocaleString("it-IT")} € di montepremi` : ""}` }),
          postList({ pal, seed, eyebrow: "Questo weekend", heading: `${slot.total} tornei FIPAV`, rows: slot.events.slice(0, 6).map(fipavRow), note: slot.total > 6 ? `E altri ${slot.total - 6} in tutta Italia. Fonte: FIPAV.` : "Fonte: FIPAV." }),
          postCta({ pal, seed, line: ["Tutti i tornei", "FIPAV su SANDER"], img: fipavImg }),
        ],
        caption: caption([`Tornei FIPAV del weekend 🏐`, `${slot.total} tornei in Italia ${dayLabel(slot.weekend[0]).split(" ").slice(0, 2).join(" ")} e ${dayLabel(slot.weekend[1])}. Date, località, categorie e scadenze li trovi tutti su SANDER, in Gioca → Tornei → Calendario FIPAV.`, "Trovi tutti i tornei FIPAV su SANDER. Link in bio.", "Fonte: calendari ufficiali FIPAV.", HASHTAGS]),
      }
    }
    case "sander-tournament": {
      const t = slot.tournament
      const img = await liveShot(browser, `/tournaments/${t.id}`, "torneo")
      return {
        frames: [
          postCover({ pal, seed, eyebrow: `Torneo su SANDER · ${dayLabel(t.date, false)}`, title: [t.name.split(" ").slice(0, 2).join(" "), t.name.split(" ").slice(2).join(" ") || dayLabel(t.date, false)], img, sub: [t.location, t.registrationOpen ? "Iscrizioni aperte" : null].filter(Boolean).join(" · ") }),
          postPhoneBullets({ pal, seed, eyebrow: t.name, heading: "Tutto in app", img, bullets: ["Iscrizione in coppia dalla scheda del torneo", "Scadenze con il conto alla rovescia", "Tabellone e risultati in diretta"] }),
          postCta({ pal, seed, line: ["Iscriviti", "su SANDER"], img: screen("tornei") }),
        ],
        caption: caption([`${t.name} 🏆`, `${dayLabel(t.date)}${t.location ? ` · ${t.location}` : ""}. ${t.registrationOpen ? "Iscrizioni aperte: ti iscrivi in coppia direttamente dall'app." : "Segui tabellone e risultati in diretta su SANDER."}`, "Link in bio.", HASHTAGS]),
      }
    }
    case "missing-one": {
      const m = pick(MISSING_ONE, w)
      const frames = [postProblem({ pal, seed, hook: m.hook }), postPhoneBullets({ pal, seed, eyebrow: "La soluzione", heading: "Trovi il quarto", img: screen("partite"), bullets: ["Guarda le partite aperte vicino a te", "Oppure crea la tua: chi è libero la vede", "Al vostro livello, nel vostro bagno"] })]
      if (slot.matches?.length >= 2) frames.push(postList({ pal, seed, eyebrow: "Partite aperte", heading: "Questo weekend", rows: slot.matches.map(matchRow), note: "Entra con un tap su SANDER." }))
      frames.push(postCta({ pal, seed, line: ["Il quarto", "c'è"], img: screen("crea") }))
      return { frames, caption: caption([`${m.hook.join(" ")} 🏐`, m.caption, "Salvalo per la prossima volta che manca qualcuno. Link in bio.", HASHTAGS]) }
    }
    case "tutorial":
      return { frames: f.tutorial.map(([img, heading, text], i) => storyStep({ pal, seed, n: i + 1, total: 3, heading, text, img: screen(img), featureName: f.name })), caption: "" }
    case "feature-story":
      return { frames: [storyPhone({ pal, seed, eyebrow: f.name, title: pick(f.titles, v + 1), img: screen(f.screen) })], caption: "" }
    case "tonight":
      return { frames: [storyPhone({ pal, seed, eyebrow: "Venerdì sera", title: pick(TONIGHT, w), img: screen("crea") })], caption: "" }
    case "weekend-fipav": {
      const img = await liveShot(browser, "/tournaments/fipav", "fipav")
      return { frames: [storyList({ pal, seed, eyebrow: "Calendario FIPAV", title: ["Questo weekend", "si gioca"], rows: slot.events.map(fipavRow), img, note: `${slot.total} tornei in Italia · tutti su SANDER` })], caption: "" }
    }
    case "weekend-sander":
      return { frames: [storyList({ pal, seed, eyebrow: "Tornei SANDER", title: ["Questo weekend", "si gioca"], rows: slot.tournaments.map(tourRow), img: await liveShot(browser, `/tournaments/${slot.tournaments[0].id}`, "torneo") })], caption: "" }
    case "weekend-matches":
      return { frames: [storyList({ pal, seed, eyebrow: "Partite aperte", title: ["Questo weekend", "si gioca"], rows: slot.matches.map(matchRow), img: screen("partite"), note: "Entra con un tap su SANDER" })], caption: "" }
    case "countdown": {
      const t = slot.tournament
      return { frames: [storyCountdown({ pal, seed, days: daysBetween(slot.from, t.date), name: t.name, sub: `${dayLabel(t.date)}${t.location ? ` · ${t.location}` : ""}`, img: await liveShot(browser, `/tournaments/${t.id}`, "torneo") })], caption: "" }
    }
    case "countdown-fipav": {
      const e = slot.event
      return { frames: [storyCountdown({ pal, seed, days: daysBetween(slot.from, e.startDate), name: `${e.category} · ${e.city}`, sub: `${dayLabel(e.startDate.slice(0, 10))} · Calendario FIPAV su SANDER`, img: await liveShot(browser, "/tournaments/fipav", "fipav") })], caption: "" }
    }
    default:
      throw new Error(`unknown kind ${slot.kind}`)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [planFile, outDir] = process.argv.slice(2)
  const plan = JSON.parse(readFileSync(planFile, "utf8"))
  mkdirSync(outDir, { recursive: true })
  const exe = existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined
  const browser = await chromium.launch({ executablePath: process.env.CHROME || exe })
  const shot = await browser.newPage()
  const captions = {}
  for (const slot of plan.slots) {
    const { frames, caption: text } = await renderSlot(slot, browser)
    const size = slot.type === "story" ? S : P
    await shot.setViewportSize({ width: size.w, height: size.h })
    const files = []
    for (let i = 0; i < frames.length; i++) {
      await shot.setContent(frames[i], { waitUntil: "load" })
      await shot.evaluate(async () => { await document.fonts.ready; window.__fit && window.__fit() })
      await shot.waitForTimeout(150)
      const file = `${slot.id}-${i + 1}.jpg`
      await shot.screenshot({ path: join(outDir, file), type: "jpeg", quality: 90 })
      files.push(file)
    }
    captions[slot.id] = { type: slot.type, date: slot.date, time: slot.time, kind: slot.kind, optional: slot.optional, files, text }
    console.error(`[render] ${slot.id} ${slot.kind}: ${files.length} file`)
  }
  writeFileSync(join(outDir, "captions.json"), JSON.stringify(captions, null, 2))
  await browser.close()
}

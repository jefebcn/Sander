/**
 * Renders the planned slots of @sanderbeachvolley into JPGs + captions.
 *
 *   SITE=https://www.sanderbv.it node render.mjs plan.json out/
 *
 * Style: the published look of @sanderbeachvolley — 35mm film photo (photos/,
 * max two uses each, order in photos.json), Gochi Hand titles with a lime line,
 * Inter labels — with the real app in a phone mockup in front. Inner carousel
 * slides use the dark card, closings the lime card. Posts 1080×1350, stories 1080×1920.
 * Stories keep text out of the top 270 px and bottom 380 px.
 *
 * Tournament slides use a live screenshot of the public page on SITE; if it
 * fails, the static screen from screens/ is used instead.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"
import { FEATURES, COMMUNITY, MISSING_ONE, TONIGHT, HASHTAGS, pick } from "./content.mjs"

// require() also finds the machine-wide Playwright when the kit runs outside the repo.
const { chromium } = createRequire(import.meta.url)("playwright")
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
// Same look as the published posts and stories (scripts/content-storie):
// full-bleed 35mm film photo with a dark fade, Gochi Hand titles in white with
// one line in SANDER lime, spaced Inter labels on top. The dark card is only
// used inside a carousel, never as a cover; with no photo left, covers and
// stories use the lime card.

const LIME = "#c6f736"
let PHOTO = null // data URL of the slot's background photo, set per slot
const photoUrl = (name) => b64(join(KIT, "photos", `${name}.jpg`), "image/jpeg")

function css(w, h) {
  return `
@font-face{font-family:'Gochi';src:url(${FONT_HAND}) format('woff2')}
@font-face{font-family:'Inter';src:url(${FONT_INTER}) format('woff2');font-weight:100 900}
*{margin:0;padding:0;box-sizing:border-box}
body{width:${w}px;height:${h}px;overflow:hidden;position:relative;background:#0b0b0b;color:#fff;font-family:'Inter',sans-serif}
body.lime{color:#0b0b0b}
.bg{position:absolute;inset:0;background-size:cover;background-position:center}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.62) 0%,rgba(0,0,0,.18) 32%,rgba(0,0,0,.22) 55%,rgba(0,0,0,.82) 100%)}
.limebg{position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 40%,#d4ff3a 0%,#c6f736 55%,#b4e52a 100%)}
.darkbg{position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 35%,#1f2024 0%,#121315 60%,#0b0b0b 100%)}
.hand{font-family:'Gochi',cursive;line-height:.9;-webkit-text-stroke:3px currentColor;text-shadow:0 6px 30px rgba(0,0,0,.35)}
body.lime .hand{text-shadow:none}
.acc{color:${LIME}}
body.lime .acc{color:#0b0b0b}
.meta{position:absolute;left:72px;right:72px;display:flex;justify-content:space-between;font-size:23px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;opacity:.88}
.eyebrow{font-size:24px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${LIME}}
body.lime .eyebrow{color:#0b0b0b;opacity:.75}
.label{font-size:23px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;opacity:.8}
.pill{display:inline-block;border:2px solid rgba(255,255,255,.8);border-radius:999px;padding:14px 30px;font-size:26px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;background:rgba(0,0,0,.18)}
body.lime .pill{border-color:#0b0b0b;background:none}
.pill.solid{background:${LIME};color:#0b0b0b;border-color:${LIME}}
.card{background:rgba(18,19,21,.78);border:1px solid rgba(255,255,255,.1);border-radius:28px;backdrop-filter:blur(6px)}
.row{display:flex;align-items:center;gap:22px;padding:22px 26px;border-bottom:1px solid rgba(255,255,255,.08)}
.row:last-child{border-bottom:0}
.badge{flex:none;min-width:74px;height:74px;border-radius:20px;background:rgba(198,247,54,.14);color:${LIME};display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;font-size:30px;line-height:1}
.badge small{font-size:15px;font-weight:800;letter-spacing:.1em;opacity:.8;margin-top:4px}
.phone{position:absolute;border-radius:64px;padding:14px;background:linear-gradient(145deg,#2b2c31,#0d0d0f);box-shadow:0 40px 90px rgba(0,0,0,.6),0 0 0 2px rgba(255,255,255,.1)}
.phone .scr{width:100%;height:100%;border-radius:52px;overflow:hidden;position:relative;background:#0b0b0c;padding-top:13%}
.phone .scr img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
.phone .bar{position:absolute;top:0;left:0;right:0;height:13%;display:flex;align-items:center;justify-content:space-between;padding:0 11% 0 12%;font-size:17px;font-weight:800;color:#fff}
.phone .island{position:absolute;top:3.2%;left:50%;transform:translateX(-50%);width:30%;height:4.2%;border-radius:20px;background:#000;z-index:2}
.num{font-family:'Gochi',cursive;line-height:.8;color:${LIME};-webkit-text-stroke:3px ${LIME}}
.logo{width:120px;height:120px;border-radius:28px;display:block}
.url{font-family:'Gochi',cursive;font-size:64px;-webkit-text-stroke:1.5px currentColor}
`
}

/** "photo" (cover/story with the slot's photo, lime card when the stock is over) or "dark" (inside a carousel). */
function layer(mode) {
  if (mode === "dark") return { cls: "dark", html: `<div class="darkbg"></div>` }
  if (mode === "lime" || !PHOTO) return { cls: "lime", html: `<div class="limebg"></div>` }
  return { cls: "photo", html: `<div class="bg" style="background-image:url(${PHOTO})"></div><div class="shade"></div>` }
}

function phone(src, { left, top, width, rotate = 0 }) {
  const height = Math.round(width * 2.16)
  return `<div class="phone" style="left:${left}px;top:${top}px;width:${width}px;height:${height}px;transform:rotate(${rotate}deg)"><div class="scr"><div class="bar"><span>9:41</span><span>●●●</span></div><div class="island"></div><img src="${src}"></div></div>`
}

// Shrinks .hand text inside [data-fit] boxes until the box fits its max height and width.
const FIT = `<script>window.__fit=()=>{document.querySelectorAll('[data-fit]').forEach(box=>{const max=+box.dataset.fit;const hs=[...box.querySelectorAll('.hand')];let guard=60;const over=()=>box.scrollHeight>max||hs.some(h=>h.scrollWidth>box.clientWidth+2);while(over()&&guard--){hs.forEach(h=>{h.style.fontSize=(parseFloat(getComputedStyle(h).fontSize)*0.94)+'px'})}})}</script>`

function page(w, h, mode, body) {
  const l = layer(mode)
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css(w, h)}</style></head><body class="${l.cls}">${l.html}${body}${FIT}</body></html>`
}

const meta = (top, items) => `<div class="meta" style="top:${top}px">${items.map((i) => `<span>${esc(i)}</span>`).join("")}</div>`
const title2 = ([a, b], size) =>
  `<div class="hand" style="font-size:${size}px;white-space:nowrap">${esc(a)}</div><div class="hand acc" style="font-size:${size}px;white-space:nowrap">${esc(b)}</div>`
const closing = (align = "left") => `<div style="text-align:${align}"><img class="logo" src="${ICON}" style="${align === "center" ? "margin:0 auto 18px" : "margin-bottom:18px"}"><div class="url">sanderbv.it</div><div class="label" style="margin-top:6px">Link in bio</div></div>`

// ─── Post slides (1080×1350) ─────────────────────────────────────────────────

const P = { w: 1080, h: 1350 }

function postCover({ metaItems, title, img, sub, swipe = true }) {
  return page(P.w, P.h, "photo", `
    ${meta(64, metaItems)}
    <div style="position:absolute;top:150px;left:72px;width:600px">
      <div data-fit="330" style="width:600px">${title2(title, 150)}</div>
      ${sub ? `<div style="font-size:32px;font-weight:600;line-height:1.35;margin-top:30px;max-width:520px;text-shadow:0 2px 16px rgba(0,0,0,.45)">${esc(sub)}</div>` : ""}
    </div>
    ${phone(img, { left: 655, top: 470, width: 360, rotate: 5 })}
    ${swipe ? `<div style="position:absolute;left:72px;bottom:72px"><span class="pill">Swipe →</span></div>` : ""}`)
}

function postPhoneBullets({ eyebrow, heading, img, bullets }) {
  return page(P.w, P.h, "dark", `
    ${phone(img, { left: 72, top: 150, width: 440 })}
    <div style="position:absolute;top:200px;left:572px;right:64px">
      <div class="eyebrow" style="margin-bottom:22px">${esc(eyebrow)}</div>
      <div data-fit="200" style="margin-bottom:40px"><div class="hand" style="font-size:86px">${esc(heading)}</div></div>
      ${bullets.map((b, i) => `<div style="display:flex;gap:22px;margin-bottom:38px"><div class="num" style="font-size:96px;width:70px;flex:none">${i + 1}</div><div style="font-size:34px;font-weight:700;line-height:1.3;padding-top:10px">${esc(b)}</div></div>`).join("")}
    </div>`)
}

function postList({ eyebrow, heading, rows, note }) {
  return page(P.w, P.h, "dark", `
    <div style="position:absolute;top:120px;left:72px;right:72px">
      <div class="eyebrow" style="margin-bottom:20px">${esc(eyebrow)}</div>
      <div data-fit="110" style="margin-bottom:44px"><div class="hand" style="font-size:96px;white-space:nowrap">${esc(heading)}</div></div>
      <div class="card">${rows.map((r) => `<div class="row"><div class="badge">${esc(r.badge)}<small>${esc(r.badgeSub ?? "")}</small></div><div style="flex:1;min-width:0"><div style="font-size:34px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.title)}</div><div style="font-size:26px;opacity:.7;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.sub)}</div></div></div>`).join("")}</div>
      ${note ? `<div style="font-size:26px;opacity:.6;margin-top:26px">${esc(note)}</div>` : ""}
    </div>`)
}

function postCta({ line, img }) {
  return page(P.w, P.h, "lime", `
    ${phone(img, { left: 600, top: 170, width: 410, rotate: 4 })}
    <div style="position:absolute;top:260px;left:72px;width:500px">
      <div data-fit="250" style="margin-bottom:60px"><div class="hand" style="font-size:120px;white-space:nowrap">${esc(line[0])}</div><div class="hand" style="font-size:120px;white-space:nowrap">${esc(line[1])}</div></div>
      ${closing("left")}
      <div class="label" style="margin-top:22px;opacity:.7">Gratis su iPhone e Android</div>
    </div>`)
}

function postProblem({ hook }) {
  const dot = (filled) => `<div style="width:150px;height:150px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Gochi';font-size:96px;${filled ? `background:${LIME};color:#0b0b0b` : "border:5px dashed rgba(255,255,255,.75);color:#fff;background:rgba(0,0,0,.25)"}">${filled ? "✓" : "?"}</div>`
  return page(P.w, P.h, "photo", `
    ${meta(64, ["Manca uno", "Riviera", "SANDER"])}
    <div style="position:absolute;top:170px;left:72px;right:72px;text-align:center">
      <div data-fit="330">${title2(hook, 160)}</div>
    </div>
    <div style="position:absolute;left:0;right:0;bottom:250px;display:flex;justify-content:center;gap:34px">${dot(true)}${dot(true)}${dot(true)}${dot(false)}</div>
    <div style="position:absolute;left:0;right:0;bottom:72px;text-align:center"><span class="pill">Swipe →</span></div>`)
}

// ─── Story frames (1080×1920) ────────────────────────────────────────────────
// Safe zone: nothing important above 270 px or below 380 px.

const S = { w: 1080, h: 1920 }
const storyPill = (text = "Link in bio") => `<div style="position:absolute;left:0;right:0;bottom:395px;text-align:center"><span class="pill solid">${esc(text)}</span></div>`

function storyPhone({ metaItems, title, img }) {
  return page(S.w, S.h, "photo", `
    ${meta(270, metaItems)}
    <div style="position:absolute;top:350px;left:72px;right:72px;text-align:center">
      <div data-fit="300">${title2(title, 160)}</div>
    </div>
    ${phone(img, { left: 375, top: 690, width: 330, rotate: -3 })}
    ${storyPill()}`)
}

function storyStep({ n, total, heading, text, img, featureName }) {
  return page(S.w, S.h, "photo", `
    ${meta(270, ["Tutorial", featureName, `${n}/${total}`])}
    <div style="position:absolute;top:340px;left:72px;right:72px">
      <div style="display:flex;gap:30px;align-items:flex-end"><div class="num" style="font-size:200px;flex:none">${n}</div><div data-fit="230" style="flex:1;min-width:0"><div class="hand" style="font-size:100px;white-space:nowrap">${esc(heading)}</div><div style="font-size:34px;font-weight:600;margin-top:14px;line-height:1.3;text-shadow:0 2px 14px rgba(0,0,0,.5)">${esc(text)}</div></div></div>
    </div>
    ${phone(img, { left: 375, top: 680, width: 330 })}
    ${n === total ? storyPill() : storyPill("Avanti →").replace("pill solid", "pill")}`)
}

function storyList({ metaItems, title, rows, img, note }) {
  return page(S.w, S.h, "photo", `
    ${meta(270, metaItems)}
    <div style="position:absolute;top:340px;left:72px;right:72px">
      <div data-fit="250">${title2(title, 130)}</div>
      <div class="card" style="margin-top:40px">${rows.map((r) => `<div class="row"><div class="badge">${esc(r.badge)}<small>${esc(r.badgeSub ?? "")}</small></div><div style="flex:1;min-width:0"><div style="font-size:34px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.title)}</div><div style="font-size:26px;opacity:.75;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.sub)}</div></div></div>`).join("")}</div>
      ${note ? `<div style="font-size:28px;font-weight:600;margin-top:24px;text-shadow:0 2px 14px rgba(0,0,0,.5)">${esc(note)}</div>` : ""}
    </div>
    ${img ? phone(img, { left: 760, top: 1130, width: 250, rotate: 6 }) : ""}
    ${storyPill()}`)
}

function storyCountdown({ days, name, sub, img }) {
  const big = days <= 0 ? "Oggi" : days === 1 ? "Domani" : `-${days}`
  return page(S.w, S.h, "photo", `
    ${meta(270, ["Prossimo torneo", "SANDER"])}
    <div style="position:absolute;top:330px;left:72px;right:72px;text-align:center">
      <div class="hand acc" style="font-size:${days > 1 ? 300 : 220}px">${esc(big)}</div>
      ${days > 1 ? `<div class="label" style="margin-top:-6px">giorni</div>` : ""}
      <div data-fit="200" style="margin-top:24px"><div class="hand" style="font-size:90px;white-space:nowrap">${esc(name)}</div></div>
      <div style="font-size:34px;font-weight:600;margin-top:12px;text-shadow:0 2px 14px rgba(0,0,0,.5)">${esc(sub)}</div>
    </div>
    ${phone(img, { left: 740, top: 1090, width: 250, rotate: 6 })}
    ${storyPill()}`)
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
  PHOTO = slot.photo ? photoUrl(slot.photo) : null
  const f = slot.feature ? FEATURES[slot.feature] : null
  const v = Math.floor(w / 6) // variant index: changes each time a feature comes back

  switch (slot.kind) {
    case "feature": {
      const title = pick(f.titles, v)
      return {
        frames: [
          postCover({ metaItems: ["Funzione della settimana", f.name, "Gratis"], title, img: screen(f.screen), sub: f.bullets[0] }),
          postPhoneBullets({ eyebrow: f.name, heading: "Come funziona", img: screen(f.tutorial[1][0]), bullets: f.bullets }),
          postCta({ line: ["Provala", "su SANDER"], img: screen(f.tutorial[2][0]) }),
        ],
        caption: caption([`${title.join(" ")} 🏐`, pick(f.captions, v), "Swipe per vedere come funziona. Gratis su iPhone e Android, link in bio.", HASHTAGS]),
      }
    }
    case "community": {
      const c = pick(COMMUNITY, Math.floor(w / 2))
      return {
        frames: [
          postCover({ metaItems: ["Community", "Riviera", "@sanderbeachvolley"], title: c.title, img: screen(c.screen), sub: "Gioca, trova, sali." }),
          postCta({ line: ["Ci vediamo", "in campo"], img: screen("partite") }),
        ],
        caption: caption([`${c.title.join(" ")} ☀️`, c.caption, "Link in bio.", HASHTAGS]),
      }
    }
    case "fipav-weekend": {
      const top = slot.events[0]
      const fipavImg = await liveShot(browser, "/tournaments/fipav", "fipav")
      return {
        frames: [
          postCover({ metaItems: ["Tornei FIPAV", `${dayLabel(slot.weekend[0], false).split(" ")[0]}–${dayLabel(slot.weekend[1], false)}`, "Tutta Italia"], title: [top.category, top.city], img: fipavImg, sub: `${dayLabel(top.startDate.slice(0, 10))} · ${top.region}${top.prizeEuro ? ` · ${top.prizeEuro.toLocaleString("it-IT")} € di montepremi` : ""}` }),
          postList({ eyebrow: "Questo weekend", heading: `${slot.total} tornei FIPAV`, rows: slot.events.slice(0, 6).map(fipavRow), note: slot.total > 6 ? `E altri ${slot.total - 6} in tutta Italia. Fonte: FIPAV.` : "Fonte: FIPAV." }),
          postCta({ line: ["Tutti i tornei", "FIPAV su SANDER"], img: fipavImg }),
        ],
        caption: caption([`Tornei FIPAV del weekend 🏐`, `${slot.total} tornei in Italia ${dayLabel(slot.weekend[0]).split(" ").slice(0, 2).join(" ")} e ${dayLabel(slot.weekend[1])}. Date, località, categorie e scadenze li trovi tutti su SANDER, in Gioca → Tornei → Calendario FIPAV.`, "Trovi tutti i tornei FIPAV su SANDER. Link in bio.", "Fonte: calendari ufficiali FIPAV.", HASHTAGS]),
      }
    }
    case "sander-tournament": {
      const t = slot.tournament
      const img = await liveShot(browser, `/tournaments/${t.id}`, "torneo")
      return {
        frames: [
          postCover({ metaItems: ["Torneo", dayLabel(t.date, false), "SANDER"], title: [t.name.split(" ").slice(0, 2).join(" "), t.name.split(" ").slice(2).join(" ") || dayLabel(t.date, false)], img, sub: [t.location, t.registrationOpen ? "Iscrizioni aperte" : null].filter(Boolean).join(" · ") }),
          postPhoneBullets({ eyebrow: t.name, heading: "Tutto in app", img, bullets: ["Iscrizione in coppia dalla scheda del torneo", "Scadenze con il conto alla rovescia", "Tabellone e risultati in diretta"] }),
          postCta({ line: ["Iscriviti", "su SANDER"], img: screen("tornei") }),
        ],
        caption: caption([`${t.name} 🏆`, `${dayLabel(t.date)}${t.location ? ` · ${t.location}` : ""}. ${t.registrationOpen ? "Iscrizioni aperte: ti iscrivi in coppia direttamente dall'app." : "Segui tabellone e risultati in diretta su SANDER."}`, "Link in bio.", HASHTAGS]),
      }
    }
    case "missing-one": {
      const m = pick(MISSING_ONE, w)
      const frames = [postProblem({ hook: m.hook }), postPhoneBullets({ eyebrow: "La soluzione", heading: "Trovi il quarto", img: screen("partite"), bullets: ["Guarda le partite aperte vicino a te", "Oppure crea la tua: chi è libero la vede", "Al vostro livello, nel vostro bagno"] })]
      if (slot.matches?.length >= 2) frames.push(postList({ eyebrow: "Partite aperte", heading: "Questo weekend", rows: slot.matches.map(matchRow), note: "Entra con un tap su SANDER." }))
      frames.push(postCta({ line: ["Il quarto", "c'è"], img: screen("crea") }))
      return { frames, caption: caption([`${m.hook.join(" ")} 🏐`, m.caption, "Salvalo per la prossima volta che manca qualcuno. Link in bio.", HASHTAGS]) }
    }
    case "tutorial":
      return { frames: f.tutorial.map(([img, heading, text], i) => storyStep({ n: i + 1, total: 3, heading, text, img: screen(img), featureName: f.name })), caption: "" }
    case "feature-story":
      return { frames: [storyPhone({ metaItems: [f.name, "SANDER", "Gratis"], title: pick(f.titles, v + 1), img: screen(f.screen) })], caption: "" }
    case "tonight":
      return { frames: [storyPhone({ metaItems: ["Venerdì sera", "Crea partita"], title: pick(TONIGHT, w), img: screen("crea") })], caption: "" }
    case "weekend-fipav": {
      const img = await liveShot(browser, "/tournaments/fipav", "fipav")
      return { frames: [storyList({ metaItems: ["Calendario FIPAV", "Weekend"], title: ["Questo weekend", "si gioca"], rows: slot.events.map(fipavRow), img, note: `${slot.total} tornei in Italia · tutti su SANDER` })], caption: "" }
    }
    case "weekend-sander":
      return { frames: [storyList({ metaItems: ["Tornei SANDER", "Weekend"], title: ["Questo weekend", "si gioca"], rows: slot.tournaments.map(tourRow), img: await liveShot(browser, `/tournaments/${slot.tournaments[0].id}`, "torneo") })], caption: "" }
    case "weekend-matches":
      return { frames: [storyList({ metaItems: ["Partite aperte", "Weekend"], title: ["Questo weekend", "si gioca"], rows: slot.matches.map(matchRow), img: screen("partite"), note: "Entra con un tap su SANDER" })], caption: "" }
    case "countdown": {
      const t = slot.tournament
      return { frames: [storyCountdown({ days: daysBetween(slot.from, t.date), name: t.name, sub: `${dayLabel(t.date)}${t.location ? ` · ${t.location}` : ""}`, img: await liveShot(browser, `/tournaments/${t.id}`, "torneo") })], caption: "" }
    }
    case "countdown-fipav": {
      const e = slot.event
      return { frames: [storyCountdown({ days: daysBetween(slot.from, e.startDate), name: `${e.category} · ${e.city}`, sub: `${dayLabel(e.startDate.slice(0, 10))} · Calendario FIPAV su SANDER`, img: await liveShot(browser, "/tournaments/fipav", "fipav") })], caption: "" }
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

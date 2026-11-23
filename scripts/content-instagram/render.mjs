/**
 * Renders the planned slots of @sanderbeachvolley into JPGs + captions.
 *
 *   SITE=https://www.sanderbv.it node render.mjs plan.json out/
 *
 * Posts (1080×1350): the formats of 17/11/2026 in formats.mjs — a beach-volley
 * joke or hook on the cover (gancio, chat, gioco, notifiche, flag, carta,
 * citazione, Frase da rete, FIPAV numero), then the app, then the lime closing.
 * Stories (1080×1920): 35mm film photo (photos/, max two uses each, order in
 * photos.json), Gochi Hand titles with a lime line, Inter labels, app in a phone.
 * Stories keep text out of the top 270 px and bottom 380 px.
 *
 * Tournament slides use a live screenshot of the public page on SITE; if it
 * fails, the static screen from screens/ is used instead.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"
import { FEATURES, TONIGHT, HASHTAGS, pick, FRASI, FRASI_START, GANCI, CHATS, CITAZIONI, GIOCHI, GIOCO_FACES, NOTIFICHE, FLAGS, CARTE } from "./content.mjs"
import * as N from "./formats.mjs"
import { FEATURE_COVER } from "./plan.mjs"
import { fresh, used, NEEDS, NothingNew } from "./fresh.mjs"

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
const NO_PHOTO = [] // slots drawn without a photo: a new one in work/photos-new/ would be better
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
.phone .scr{width:100%;height:100%;border-radius:52px;overflow:hidden;position:relative;background:#0b0b0c;display:flex;flex-direction:column}
.phone .scr img{width:100%;flex:none;display:block}
.phone .bar{flex:none;display:flex;align-items:center;justify-content:space-between;padding:0 11% 0 12%;font-size:17px;font-weight:800;color:#fff}
.phone .island{position:absolute;left:50%;transform:translateX(-50%);width:30%;border-radius:20px;background:#000;z-index:2}
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

// The app screens are 390×844 (no status bar): the screen area keeps that
// ratio below a status bar, so the whole screen shows, top to bottom.
function phone(src, { left, top, width, rotate = 0 }) {
  const inner = width - 28
  const bar = Math.round(inner * 0.13)
  const img = Math.round(inner * (844 / 390))
  const height = img + bar + 28
  return `<div class="phone" style="left:${left}px;top:${top}px;width:${width}px;height:${height}px;transform:rotate(${rotate}deg)"><div class="scr"><div class="bar" style="height:${bar}px"><span>9:41</span><span>●●●</span></div><div class="island" style="top:${Math.round(bar * 0.24)}px;height:${Math.round(bar * 0.42)}px"></div><img src="${src}" style="height:${img}px"></div></div>`
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

// Post slides (1080×1350) are in formats.mjs.
const P = { w: 1080, h: 1350 }

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

function storyCountdown({ days, name, sub, img, source = "SANDER" }) {
  const big = days <= 0 ? "Oggi" : days === 1 ? "Domani" : `-${days}`
  return page(S.w, S.h, "photo", `
    ${meta(270, ["Prossimo torneo", source])}
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

/** Up to n events, one per city first (the same club often lists four categories). */
function varied(events, n) {
  const seen = new Set()
  const first = events.filter((e) => !seen.has(e.city) && seen.add(e.city))
  return [...first, ...events.filter((e) => !first.includes(e))].slice(0, n).sort((a, b) => a.startDate.localeCompare(b.startDate))
}

const cap1 = (t) => t.charAt(0).toUpperCase() + t.slice(1)

function caption(lines) {
  return lines.filter(Boolean).join("\n\n")
}


// Text that identifies each variant in a caption (or a story's "🏐 …" text): see fresh.mjs.
const FP = {
  CITAZIONI: (c) => [...c.d, c.mk, c.d2].filter(Boolean).join(" "),
  GIOCHI: (g) => g.line,
  NOTIFICHE: (n) => `${n.d} ${n.h}`,
  FLAGS: (f) => `${f.title.join(" ")} ${f.h}`,
  CARTE: (c) => `${c.d} ${c.h}`,
  CHATS: (c) => c.d.join(" "),
  GANCI: (g) => [...g.d, ...g.h].join(" "),
  FRASI: (f) => [...f.d, ...f.h].join(" "),
  line: (t) => (Array.isArray(t) ? t.join(" ") : t),
}
let KEY = "" // what a story showed: saved as its Buffer text, so it is never repeated

/** A fun cover (+ the app slide that follows it), the first variant not used yet. */
function coverFrames(kind, w) {
  const i = Math.floor(w / 6)
  switch (kind) {
    case "citazione": { const c = fresh("CITAZIONI", CITAZIONI, w, FP.CITAZIONI); return { frame: N.citazione({ img: PHOTO, ...c }), cap: `«${[...c.d, c.mk, c.d2].filter(Boolean).join(" ")}» ${c.h} 🏐\n\n${c.cap}` } }
    case "gioco": { const g = fresh("GIOCHI", GIOCHI, i, FP.GIOCHI); return { frame: N.gioco({ ...g, faceList: GIOCO_FACES }), cap: `${g.line} 🏐\n\n${g.cap}`, app: { eyebrow: "Su SANDER · Scopri", d: "Il tuo numero", h: "è qui", img: screen("scopri"), bullets: FEATURES.scopri.bullets } } }
    case "notifiche": { const n = fresh("NOTIFICHE", NOTIFICHE, i, FP.NOTIFICHE); return { frame: N.notifiche({ img: PHOTO, ...n }), cap: `${n.d} ${n.h} 🏐\n\n${n.cap}`, app: { eyebrow: "Su SANDER", d: "Partite e tornei", h: "in tasca", img: screen("partite"), bullets: ["Posti liberi vicino a te, in tempo reale", "Tornei con iscrizione in coppia", "Punti e livello dopo ogni partita"] } } }
    case "flag": { const f = fresh("FLAGS", FLAGS, i, FP.FLAGS); return { frame: N.flag(f), cap: `${f.title.join(" ")} ${f.h} 🏐\n\n${f.cap}`, app: { eyebrow: "Su SANDER · Scopri", d: "Quello giusto", h: "esiste", img: screen("scopri"), bullets: FEATURES.scopri.bullets } } }
    case "carta": { const c = fresh("CARTE", CARTE, i, FP.CARTE); return { frame: N.carta({ img: PHOTO, ...c }), cap: `${c.d} ${c.h} 🏐\n\n${c.cap}`, app: { eyebrow: "Su SANDER · Classifiche", d: "Gioca", h: "e sali", img: screen("classifica"), bullets: FEATURES.classifiche.bullets } } }
    case "chat": default: { const c = fresh("CHATS", CHATS, i + 1, FP.CHATS); return { frame: N.chat(c), cap: `${c.d.join(" ")} 🏐\n\n${c.cap}` } }
  }
}

async function renderSlot(slot, browser) {
  const w = slot.week
  // A photo appears once, ever (Alex, 23/11/2026): a new one in work/photos-new/<slot id>.jpg wins.
  const newPhoto = join(KIT, "work", "photos-new", `${slot.id}.jpg`)
  PHOTO = existsSync(newPhoto) ? b64(newPhoto, "image/jpeg") : slot.photo ? photoUrl(slot.photo) : null
  if (!PHOTO) NO_PHOTO.push(slot.id)
  const f = slot.feature ? FEATURES[slot.feature] : null
  const v = Math.floor(w / 6) // variant index: changes each time a feature comes back

  switch (slot.kind) {
    case "feature": {
      // Wednesday: the beach joke first, then the feature, then the app.
      const cover = FEATURE_COVER[slot.feature] ?? "flag"
      const c = coverFrames(cover, w)
      return {
        frames: [c.frame, N.appSlide({ eyebrow: `Su SANDER · ${f.name}`, d: "Come", h: "funziona", img: screen(f.tutorial[1][0]), bullets: f.bullets }), N.ctaSlide({ d: ["Provala"], h: ["su SANDER"], img: screen(f.tutorial[2][0]) })],
        caption: caption([c.cap, fresh(`captions.${slot.feature}`, f.captions, v, FP.line), "Swipe per vedere come funziona. App gratis su App Store e Google Play: link in bio.", HASHTAGS]),
      }
    }
    case "community": {
      // Sunday (odd weeks): rotation of the fun formats, never the one used on Wednesday.
      const order = ["citazione", "gioco", "notifiche", "carta", "flag"]
      let k = slot.format ?? order[Math.floor(w / 2) % order.length]
      if (!slot.format && k === slot.avoid) k = order[(order.indexOf(k) + 1) % order.length]
      const c = coverFrames(k, w + 1)
      const frames = [c.frame]
      if (c.app) frames.push(N.appSlide(c.app))
      frames.push(N.ctaSlide({ d: ["Ci vediamo"], h: ["in campo."], img: screen("partite") }))
      return { frames, caption: caption([c.cap, "Link in bio.", HASHTAGS]) }
    }
    case "frase": {
      const n = Math.max(1, Math.floor((Date.parse(`${slot.date}T12:00:00Z`) - Date.parse(`${FRASI_START}T12:00:00Z`)) / (7 * 86_400_000)) + 1)
      const fr = fresh("FRASI", FRASI, n - 1, FP.FRASI)
      return {
        frames: [N.frase({ n, d: fr.d, h: fr.h }), N.ctaSlide({ d: ["Il compagno"], h: ["giusto è qui."], img: screen("scopri") })],
        caption: caption([`Frasi da rete n. ${n} 🏐`, `«${[...fr.d, ...fr.h].join(" ")}»`, `${fr.cap} Ogni giovedì una nuova frase: salvala.`, "Il compagno di beach giusto lo trovi su SANDER. Link in bio.", HASHTAGS]),
      }
    }
    case "fipav-weekend": {
      const inApp = slot.fipavInApp !== false
      const fipavImg = inApp ? await liveShot(browser, "/tournaments/fipav", "fipav") : screen("scopri")
      const cities = [...new Set(slot.allCities ?? slot.events.map((e) => e.city))]
      const days = `${dayLabel(slot.weekend[0], false).split(" ")[0]}–${dayLabel(slot.weekend[1], false)}`
      return {
        frames: [
          N.fipavNumero({ img: PHOTO, label: `Questo weekend · ${days} · Tutta Italia`, count: slot.total, days: "2 giorni", cities: cities.slice(0, 8), more: Math.max(0, cities.length - 8) }),
          N.listSlide({ eyebrow: "Tornei FIPAV di beach volley", d: "Questo weekend", rows: varied(slot.events, 6).map(fipavRow), note: slot.total > 6 ? `E altri ${slot.total - 6} in tutta Italia. Fonte: FIPAV.` : "Fonte: FIPAV." }),
          inApp ? N.ctaSlide({ d: ["Tutti i tornei"], h: ["FIPAV su SANDER"], img: fipavImg }) : N.ctaSlide({ d: ["Il compagno"], h: ["per il torneo"], img: screen("scopri") }),
        ],
        caption: inApp
          ? caption([`${slot.total} tornei FIPAV di beach volley questo weekend 🏐`, `${cap1(dayLabel(slot.weekend[0]).split(" ").slice(0, 2).join(" "))} e ${dayLabel(slot.weekend[1])}, da ${cities[0]} a ${cities[cities.length - 1]}, in tutta Italia. Date, località, categorie e scadenze li trovi su SANDER, in Gioca → Tornei → Calendario FIPAV.`, "Il compagno per il prossimo torneo lo trovi su SANDER, al tuo livello. Link in bio.", "Fonte: calendari ufficiali FIPAV.", HASHTAGS])
          : caption([`${slot.total} tornei FIPAV di beach volley questo weekend 🏐`, `Swipe per i principali, con data, località e categoria.`, "Cerchi il compagno per il prossimo torneo? Su SANDER trovi chi gioca al tuo livello. Salvalo. Link in bio.", "Fonte: calendari ufficiali FIPAV.", HASHTAGS]),
      }
    }
    case "sander-tournament": {
      const t = slot.tournament
      const img = await liveShot(browser, `/tournaments/${t.id}`, "torneo")
      return {
        frames: [
          N.listSlide({ eyebrow: `Torneo di beach volley · ${dayLabel(t.date, false)}`, d: t.name, h: t.registrationOpen ? "iscrizioni aperte" : "su SANDER", rows: [tourRow(t)], note: t.location ?? "" }),
          N.appSlide({ eyebrow: t.name, d: "Tutto", h: "in app", img, bullets: ["Iscrizione in coppia dalla scheda del torneo", "Scadenze con il conto alla rovescia", "Tabellone e risultati in diretta"] }),
          N.ctaSlide({ d: ["Iscriviti"], h: ["su SANDER"], img: screen("tornei") }),
        ],
        caption: caption([`${t.name} 🏆`, `${dayLabel(t.date)}${t.location ? ` · ${t.location}` : ""}. ${t.registrationOpen ? "Iscrizioni aperte: ti iscrivi in coppia direttamente dall'app." : "Segui tabellone e risultati in diretta su SANDER."}`, "Link in bio.", HASHTAGS]),
      }
    }
    case "missing-one": {
      // Friday: hook on a photo (even weeks) or the group chat (odd weeks).
      const useChat = slot.format ? slot.format === "chat" : w % 2 === 1
      const vi = slot.variant ?? Math.floor(w / 2)
      const g = useChat ? fresh("CHATS", CHATS, vi, FP.CHATS) : fresh("GANCI", GANCI, vi, FP.GANCI)
      const frames = [useChat ? N.chat(g) : N.gancio({ img: PHOTO, ...g })]
      frames.push(N.appSlide({ eyebrow: "La soluzione", d: "Il quarto", h: "c'è", img: screen("partite"), bullets: ["Guarda le partite aperte vicino a te", "Oppure crea la tua: chi è libero la vede", "Se uno salta, entra il primo in lista"] }))
      if (slot.matches?.length >= 2) frames.push(N.listSlide({ eyebrow: "Partite aperte", d: "Questo weekend", rows: slot.matches.map(matchRow), note: "Entra con un tap su SANDER." }))
      frames.push(N.ctaSlide({ d: ["Il quarto"], h: ["c'è."], img: screen("crea") }))
      const title = useChat ? `${g.d.join(" ")} 🏐` : `${[...g.d, ...g.h].join(" ")} 🏐`
      return { frames, caption: caption([title, g.cap, "Salvalo per la prossima volta che manca qualcuno. Link in bio.", HASHTAGS]) }
    }
    case "tutorial": {
      // The three steps of a feature go out once; after that, a fresh title for it.
      KEY = `Tutorial ${f.name}: ${f.tutorial[0][1]}`
      if (used(KEY)) return renderSlot({ ...slot, kind: "feature-story" }, browser)
      return { frames: f.tutorial.map(([img, heading, text], i) => storyStep({ n: i + 1, total: 3, heading, text, img: screen(img), featureName: f.name })), caption: "" }
    }
    case "feature-story": {
      const title = fresh(`titles.${slot.feature}`, f.titles, v + 1, FP.line)
      KEY = `${f.name}: ${FP.line(title)}`
      return { frames: [storyPhone({ metaItems: [f.name, "SANDER", "Gratis"], title, img: screen(f.screen) })], caption: "" }
    }
    case "tonight": {
      const title = fresh("TONIGHT", TONIGHT, w, FP.line)
      KEY = `Venerdì sera: ${FP.line(title)}`
      return { frames: [storyPhone({ metaItems: ["Venerdì sera", "Crea partita"], title, img: screen("crea") })], caption: "" }
    }
    case "weekend-fipav": {
      const inApp = slot.fipavInApp !== false
      const img = inApp ? await liveShot(browser, "/tournaments/fipav", "fipav") : screen("scopri")
      return { frames: [storyList({ metaItems: ["Calendario FIPAV", "Weekend"], title: ["Questo weekend", "si gioca"], rows: varied(slot.events, 4).map(fipavRow), img, note: inApp ? `${slot.total} tornei in Italia · tutti su SANDER` : `${slot.total} tornei in Italia · Fonte: FIPAV` })], caption: "" }
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
      const inApp = slot.fipavInApp !== false
      return { frames: [storyCountdown({ days: daysBetween(slot.from, e.startDate), name: `${e.category} · ${e.city}`, sub: `${dayLabel(e.startDate.slice(0, 10))} · ${inApp ? "Calendario FIPAV su SANDER" : "Fonte: FIPAV"}`, source: "FIPAV", img: inApp ? await liveShot(browser, "/tournaments/fipav", "fipav") : screen("scopri") })], caption: "" }
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
  const skipped = []
  for (const slot of plan.slots) {
    KEY = ""
    let out
    try { out = await renderSlot(slot, browser) } catch (e) {
      if (!(e instanceof NothingNew)) throw e
      skipped.push({ id: slot.id, list: e.message })
      console.error(`[render] ${slot.id} ${slot.kind}: niente di nuovo in ${e.message}, saltato`)
      continue
    }
    const { frames, caption: text } = out
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
    captions[slot.id] = { type: slot.type, date: slot.date, time: slot.time, kind: slot.kind, optional: slot.optional, files, text, key: KEY }
    console.error(`[render] ${slot.id} ${slot.kind}: ${files.length} file`)
  }
  writeFileSync(join(outDir, "captions.json"), JSON.stringify(captions, null, 2))
  // Lists with nothing new left: the routine writes new variants in work/extra-content.json and renders again.
  writeFileSync(join(outDir, "needs.json"), JSON.stringify({ lists: [...new Set(NEEDS)], skipped, noPhoto: [...new Set(NO_PHOTO)] }, null, 2))
  await browser.close()
}

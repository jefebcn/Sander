/**
 * Four weeks of SANDER posts from posts.json: TikTok videos (1080×1920, 8 s,
 * silent: add a trending sound in the app), TikTok photo carousels
 * (1080×1920), Instagram carousels (1080×1350) and Reels (a TikTok video).
 * Film photos and clips from Higgsfield (invented people, barefoot, no brands),
 * marker type, SANDER lime. Text stays in the safe zone of both apps
 * (top 150, bottom 420, right 160 px on 9:16).
 *
 *   CHROME=… FFMPEG=… node scripts/content-4sett/render.mjs [id…]
 * Output: scripts/content-4sett/out/<platform>/<NN-data-slug>/
 */
import { chromium } from "playwright"
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, rmSync } from "fs"
import { execFileSync } from "child_process"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const OUT = process.env.OUT ?? join(__dirname, "out")
const TMP = join(__dirname, ".tmp")
mkdirSync(TMP, { recursive: true })
const FFMPEG = process.env.FFMPEG ?? "ffmpeg"
const { posts } = JSON.parse(readFileSync(process.env.POSTS ?? join(__dirname, "posts.json"), "utf8"))
const only = process.argv.slice(2)

/* ── Sources ────────────────────────────────────────────────────────────── */
const PHOTO_DIRS = [join(__dirname, "photos"), join(ROOT, "content-grid", "photos"), join(ROOT, "content-scopri", "bg")]
const CLIP_DIRS = [join(__dirname, "clips"), join(ROOT, "content-grid", "clips")]
const APP = { deck: "1-deck", like: "2-like", match: "3-match", proponi: "4-proponi", inviata: "5-inviata", "ci-sto": "6-ci-sto", partita: "7-partita" }
const ALIAS = { tuffo: "dive" }

function find(dirs, name, exts) {
  for (const d of dirs) for (const e of exts) {
    const p = join(d, `${name}${e}`)
    if (existsSync(p)) return p
  }
  throw new Error(`missing ${name}`)
}
const photoPath = (n) => find(PHOTO_DIRS, n, [".jpg", ".png", ".webp"])
const dataUrl = (p) => `data:image/${p.endsWith(".png") ? "png" : p.endsWith(".webp") ? "webp" : "jpeg"};base64,${readFileSync(p).toString("base64")}`
const appShot = (n) => join(ROOT, "promo", "shots", `${APP[n]}.png`)
const logo = dataUrl(join(ROOT, "..", "public", "icon-192.png"))

/** Parses "clip:x" | "app:x" | "lime" | "dark" | photo name. */
function bgOf(spec) {
  if (spec === "lime" || spec === "dark") return { kind: spec }
  if (spec.startsWith("clip:")) {
    const n = spec.slice(5)
    try { return { kind: "clip", path: find(CLIP_DIRS, n, [".mp4"]) } } catch { return bgOf(n) } // clip not made → its photo
  }
  if (spec.startsWith("app:")) return { kind: "app", path: appShot(spec.slice(4)) }
  return { kind: "photo", path: photoPath(ALIAS[spec] ?? spec) }
}

/* ── Look ───────────────────────────────────────────────────────────────── */
const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>')}")`
const CSS = (W, H) => `
*{box-sizing:border-box;margin:0}
body{width:${W}px;height:${H}px;overflow:hidden;position:relative;color:#fff;font-family:'Inter',sans-serif;background:transparent}
.full{position:absolute;inset:0}
.photo{position:absolute;inset:0;background-size:cover;background-position:center}
.grain{position:absolute;inset:0;background-image:${GRAIN};opacity:.2;mix-blend-mode:overlay}
.hand{font-family:'Mansalva',cursive;line-height:.92;-webkit-text-stroke:2.5px currentColor;text-shadow:0 6px 34px rgba(0,0,0,.45);white-space:pre-line}
.lime{color:#c6f736}
.out{color:transparent;-webkit-text-stroke:5px #fff;text-shadow:none}
.meta{font-size:26px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;text-shadow:0 2px 12px rgba(0,0,0,.6)}
.pill{display:inline-block;border:2px solid #fff;border-radius:999px;padding:18px 32px;font-size:30px;font-weight:600;line-height:1.25;background:rgba(0,0,0,.35);max-width:820px}
.limebg{background:radial-gradient(80% 60% at 50% 45%,#d4ff4a,#c6f736 60%,#a9d61f);color:#0b0b0c}
.darkbg{background:radial-gradient(75% 55% at 50% 45%,#2c2c2c,#171717 70%,#0e0e0e)}
.limebg .hand{text-shadow:none;color:#0b0b0c}
.limebg .grain{mix-blend-mode:multiply;opacity:.16}
`
const head = (W, H) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Mansalva&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${CSS(W, H)}</style></head><body>`

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {})
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } })
async function png(html, path, { W = 1080, H = 1920, transparent = false, jpg = false } = {}) {
  await page.setViewportSize({ width: W, height: H })
  await page.setContent(head(W, H) + html + "</body></html>")
  await page.waitForLoadState("networkidle").catch(() => {})
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path, omitBackground: transparent, ...(jpg ? { type: "jpeg", quality: 90 } : {}) })
}
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;")

/** Marker size that keeps the longest line inside `width`. */
function fit(text, base, width = 840, k = 0.46) {
  // Capitals are much wider than lowercase in the marker font.
  const em = (l) => [...l].reduce((w, c) => w + (c !== c.toLowerCase() ? 0.66 : k), 0)
  const widest = Math.max(...text.split("\n").map(em), 1)
  return Math.round(Math.min(base, width / widest))
}

function beatHtml(b) {
  const t = esc(b.text)
  switch (b.style) {
    case "meta": return `<div class="meta" style="align-self:stretch;text-align:center">${t}</div>`
    case "pill": return `<div><span class="pill">${t}</span></div>`
    case "lime": return `<div class="hand lime" style="font-size:${fit(b.text, 190)}px">${t}</div>`
    case "outline": return `<div class="hand out" style="font-size:${fit(b.text, 190)}px">${t}</div>`
    default: return `<div class="hand" style="font-size:${fit(b.text, 160)}px">${t}</div>`
  }
}

/** Size for a title that may wrap: at most `lines` lines, no word wider than the box. */
function wrapFit(text, base, width, lines = 3) {
  const flat = text.replace(/\n/g, " ")
  const longestWord = Math.max(...flat.split(/\s+/).map((w) => w.length), 1)
  return Math.round(Math.min(base, (lines * width) / (0.47 * flat.length), width / (0.5 * longestWord)))
}

/* ── Video ──────────────────────────────────────────────────────────────── */
const MAIN = 6, END = 2, FADE = 0.35, FPS = 30

/** Phone with an app screen over the same screen, blurred: for app-demo posts. */
function appScene(path, W = 1080, H = 1920, phoneTop = 760) {
  const shot = dataUrl(path)
  const w = 520, h = Math.round(w * 2532 / 1170)
  return `<div class="photo" style="background-image:url(${shot});filter:blur(28px) brightness(.4);transform:scale(1.15)"></div>
  <div style="position:absolute;left:${(W - 160 - w) / 2 + 80}px;top:${phoneTop}px;width:${w}px;height:${h}px;border-radius:64px;padding:14px;background:#0b0b0c;box-shadow:0 40px 90px rgba(0,0,0,.6),0 0 0 3px rgba(255,255,255,.15)">
    <div style="width:100%;height:100%;border-radius:52px;background:url(${shot}) top/cover"></div></div>`
}

async function renderVideo(p, dir) {
  const bg = bgOf(p.bg)
  const id = p.id
  // Background still (photo, app, lime/dark) or a clip.
  let bgInput
  if (bg.kind === "clip") bgInput = ["-i", bg.path]
  else {
    const still = join(TMP, `${id}-bg.jpg`)
    const inner = bg.kind === "photo" ? `<div class="photo" style="background-image:url(${dataUrl(bg.path)})"></div>`
      : bg.kind === "app" ? appScene(bg.path)
      : ""
    await png(`<div class="full ${bg.kind === "lime" ? "limebg" : bg.kind === "dark" ? "darkbg" : ""}">${inner}<div class="grain"></div></div>`, still, { jpg: true })
    bgInput = ["-loop", "1", "-t", String(MAIN), "-i", still]
  }
  // A soft veil so white text reads on any photo (not on lime/dark or the app scene).
  const veil = bg.kind === "clip" || bg.kind === "photo"
    ? `<div class="full" style="background:linear-gradient(180deg,rgba(0,0,0,.45),rgba(0,0,0,.18) 40%,rgba(0,0,0,.18) 60%,rgba(0,0,0,.5))"></div><div class="grain"></div>`
    : ""
  // Every beat is laid out together (so nothing moves), each saved alone.
  const appMode = bg.kind === "app"
  const box = appMode ? "top:190px;height:540px" : "top:250px;height:1250px"
  const layers = []
  for (let i = 0; i < p.beats.length; i++) {
    const html = `${i === 0 ? veil : ""}<div style="position:absolute;left:60px;right:160px;${box};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;text-align:center">
      ${p.beats.map((b, j) => `<div style="visibility:${j === i ? "visible" : "hidden"};display:flex;justify-content:center;width:100%">${beatHtml(b)}</div>`).join("")}</div>`
    const f = join(TMP, `${id}-l${i}.png`)
    await png(html, f, { transparent: true })
    layers.push(f)
  }
  const end = join(TMP, `${id}-end.png`)
  const endText = esc(p.end?.text ?? "Si gioca\nsu SANDER")
  await png(`<div class="full ${p.end?.bg === "dark" ? "darkbg" : "limebg"}">
    <div class="hand" style="position:absolute;left:60px;right:160px;top:520px;text-align:center;font-size:${fit(p.end?.text ?? "", 170, 840, 0.48)}px">${endText}</div>
    <div style="position:absolute;left:60px;right:160px;top:1120px;display:flex;flex-direction:column;align-items:center;gap:22px">
      <img src="${logo}" style="width:120px;height:120px;border-radius:28px">
      <div class="hand" style="font-size:88px;-webkit-text-stroke-width:2px;text-shadow:none">sanderbv.it</div>
      <div style="font-size:26px;letter-spacing:.08em;text-transform:uppercase;font-weight:700">Gratis · link in bio</div></div>
    <div class="grain"></div></div>`, end)

  const inputs = [...bgInput]
  for (const l of layers) inputs.push("-loop", "1", "-t", String(MAIN), "-i", l)
  inputs.push("-loop", "1", "-t", String(END + FADE), "-i", end)
  const base = bg.kind === "clip"
    ? `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=${FPS},tpad=stop_mode=clone:stop_duration=${MAIN},trim=0:${MAIN},setpts=PTS-STARTPTS,format=yuv420p[b0];`
    // Slow push-in on stills.
    : `[0:v]scale=1188:2112,zoompan=z='1+0.07*on/${MAIN * FPS}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=${FPS},trim=0:${MAIN},setpts=PTS-STARTPTS,setsar=1,format=yuv420p[b0];`
  let f = base
  p.beats.forEach((b, i) => {
    const t = i === 0 ? 0 : b.t
    f += `[${i + 1}:v]format=rgba,fade=t=in:st=${t}:d=0.3:alpha=1[l${i}];[b${i}][l${i}]overlay=0:0:format=auto[b${i + 1}];`
  })
  const n = p.beats.length
  f += `[${n + 1}:v]fps=${FPS},format=yuv420p,setsar=1[e];[b${n}]format=yuv420p[m];[m][e]xfade=transition=fade:duration=${FADE}:offset=${MAIN - FADE}[v]`
  const file = join(dir, `${p.slug}.mp4`)
  execFileSync(FFMPEG, ["-y", "-loglevel", "error", ...inputs, "-filter_complex", f, "-map", "[v]", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-r", String(FPS), file])
  // First beat on the background: the cover TikTok shows in the grid.
  return file
}

/* ── Carousel ───────────────────────────────────────────────────────────── */
async function renderCarousel(p, dir, W, H) {
  const tall = H === 1920
  const pad = tall ? "left:70px;right:170px" : "left:70px;right:70px"
  for (const [i, s] of p.slides.entries()) {
    const first = i === 0, last = i === p.slides.length - 1
    const bg = bgOf(s.bg ?? "dark")
    const lime = bg.kind === "lime" || (last && bg.kind === "dark")
    const inner = bg.kind === "photo"
      ? `<div class="photo" style="background-image:url(${dataUrl(bg.path)});${first ? "" : "filter:blur(6px) brightness(.45);transform:scale(1.06)"}"></div>
         <div class="full" style="background:linear-gradient(180deg,rgba(0,0,0,${first ? ".5" : ".2"}),rgba(0,0,0,.1) 45%,rgba(0,0,0,${first ? ".55" : ".3"}))"></div>`
      : bg.kind === "app" ? appScene(bg.path, W, H, tall ? 820 : 560).replace(/width:520px;height:\d+px/, tall ? "$&" : "width:330px;height:714px")
      : bg.kind === "clip" ? "" : ""
    const title = esc(s.title ?? "")
    const body = s.body ? `<p style="margin-top:${tall ? 44 : 30}px;font-size:${tall ? 40 : 34}px;line-height:1.38;font-weight:500;max-width:${tall ? 800 : 860}px;text-shadow:0 2px 14px rgba(0,0,0,.5)">${esc(s.body)}</p>` : ""
    const top = bg.kind === "app" ? (tall ? "top:210px" : "top:90px") : first ? (tall ? "top:520px" : "top:330px") : (tall ? "top:400px" : "top:230px")
    const titleSize = wrapFit(s.title ?? "", first ? (tall ? 170 : 150) : (tall ? 120 : 104), tall ? 820 : 900, first ? 4 : 3)
    const counter = p.slides.length > 1 ? `<div class="meta" style="position:absolute;${tall ? "top:170px" : "top:56px"};${pad};display:flex;justify-content:space-between"><span>SANDER</span><span>${i + 1}/${p.slides.length}</span></div>` : ""
    const swipe = first ? `<div class="meta" style="position:absolute;${pad};${tall ? "top:1380px" : "bottom:70px"};text-align:center">Scorri →</div>` : ""
    const cta = last ? `<div style="position:absolute;${pad};${tall ? "top:1180px" : "bottom:90px"};display:flex;align-items:center;justify-content:center;gap:20px"><img src="${logo}" style="width:96px;height:96px;border-radius:24px"><div class="hand" style="font-size:72px;text-shadow:none">sanderbv.it</div></div>` : ""
    await png(`<div class="full ${lime ? "limebg" : bg.kind === "dark" ? "darkbg" : ""}">${inner}
      ${counter}
      <div style="position:absolute;${pad};${top};text-align:center;display:flex;flex-direction:column;align-items:center">
        <div class="hand ${first && !lime ? "" : ""}" style="font-size:${titleSize}px">${title}</div>${body}</div>
      ${swipe}${cta}<div class="grain"></div></div>`, join(dir, `${String(i + 1).padStart(2, "0")}.jpg`), { W, H, jpg: true })
  }
}

/* ── Run ────────────────────────────────────────────────────────────────── */
const DAYS = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"]
const folder = (p) => {
  const d = new Date(`${p.date}T12:00:00Z`)
  return `${p.id}-${p.date.slice(8)}${["", "gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"][+p.date.slice(5, 7)]}-${DAYS[d.getUTCDay()]}-${p.time.replace(":", "")}-${p.slug ?? byId[p.reuse]?.slug}`
}
const byId = Object.fromEntries(posts.map((p) => [p.id, p]))

for (const p of posts) {
  if (only.length && !only.includes(p.id)) continue
  const dir = join(OUT, p.platform === "tiktok" ? "tiktok" : "instagram", folder(p))
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  if (p.format === "video") await renderVideo(p, dir)
  else if (p.format === "carousel") await renderCarousel(p, dir, 1080, p.platform === "tiktok" ? 1920 : 1350)
  else if (p.format === "reel") {
    const src = byId[p.reuse]
    const srcDir = join(OUT, "tiktok", folder(src))
    if (!existsSync(join(srcDir, `${src.slug}.mp4`))) await renderVideo(src, (mkdirSync(srcDir, { recursive: true }), srcDir))
    copyFileSync(join(srcDir, `${src.slug}.mp4`), join(dir, `${src.slug}.mp4`))
  }
  const when = `${DAYS[new Date(`${p.date}T12:00:00Z`).getUTCDay()]} ${p.date.slice(8)}/${p.date.slice(5, 7)} alle ${p.time}`
  writeFileSync(join(dir, "didascalia.txt"), `${p.caption.trim()}\n`)
  writeFileSync(join(dir, "info.txt"), `${p.platform === "tiktok" ? "TikTok" : "Instagram"} · ${when}\nRubrica: ${p.rubrica ?? byId[p.reuse]?.rubrica}\nFormato: ${p.format === "carousel" ? "carosello (foto in ordine 01, 02…)" : p.format === "reel" ? "Reel" : "video"}\nAudio consigliato: ${p.audio ?? "audio di tendenza nell'app"}\n`)
  console.log("ok", p.id, p.slug)
}
await browser.close()

/**
 * TikTok videos (1080×1920, 7 s, silent: add a trending sound in the app) in the
 * same style as the Instagram grid: animated film clips (clips/, Higgsfield),
 * hand-drawn marker type that pops in, an end card with sanderbv.it.
 * Text stays inside TikTok's safe zone (top 150, bottom 420, right 160 px).
 *   FFMPEG=/path/to/ffmpeg node scripts/content-grid/tiktok.mjs
 * Output: scripts/content-grid/tiktok/<name>.mp4
 */
import { chromium } from "playwright"
import { readFileSync, mkdirSync } from "fs"
import { execFileSync } from "child_process"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, "tiktok")
const TMP = join(OUT, ".frames")
mkdirSync(TMP, { recursive: true })
const FFMPEG = process.env.FFMPEG ?? "ffmpeg"
const logo = `data:image/png;base64,${readFileSync(join(__dirname, "..", "..", "public", "icon-192.png")).toString("base64")}`

const CSS = `
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1920px;overflow:hidden;position:relative;color:#fff;font-family:'Inter',sans-serif;background:transparent}
.hand{font-family:'Mansalva',cursive;line-height:.9;-webkit-text-stroke:3px currentColor;text-shadow:0 6px 30px rgba(0,0,0,.35)}
.out{color:transparent!important;-webkit-text-stroke:6px #fff}
.lime{color:#c6f736}.out.lime{-webkit-text-stroke-color:#c6f736}
.abs{position:absolute}.center{left:60px;right:160px;text-align:center}
.meta{position:absolute;left:60px;right:160px;top:170px;display:flex;justify-content:space-between;font-size:24px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;line-height:1.25;text-shadow:0 2px 10px rgba(0,0,0,.5)}
.pill{display:inline-block;border:2px solid #fff;border-radius:999px;padding:16px 30px;font-size:26px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;background:rgba(0,0,0,.25)}
.card{width:1080px;height:1920px;position:relative}
.card.lime-bg{background:radial-gradient(80% 60% at 50% 45%,#d4ff4a,#c6f736 60%,#a9d61f);color:#0b0b0c}
.card.dark{background:radial-gradient(75% 55% at 50% 45%,#2c2c2c,#171717 70%,#0e0e0e)}
.card .hand{-webkit-text-stroke-color:currentColor;text-shadow:none}
`

// Each video: a clip, timed overlay layers [start, html], an end card.
const VIDEOS = [
  {
    name: "01-sander",
    clip: "dive.mp4",
    layers: [
      [0.0, `<div class="meta"><div>Community<br>beach volley</div><div>Gratis</div><div style="text-align:right">@sanderbeachvolley</div></div>`],
      [0.4, `<div class="abs center hand out lime" style="top:640px;font-size:250px">Sander</div>`],
      [2.2, `<div class="abs center hand" style="top:930px;font-size:120px">trova con chi<br>giocare</div>`],
    ],
    end: { cls: "lime-bg", html: `<div class="abs center hand" style="top:620px;font-size:200px">Scopri</div><div class="abs center hand" style="top:860px;font-size:110px">su SANDER</div>` },
  },
  {
    name: "02-libero-oggi",
    clip: "spike.mp4",
    layers: [
      [0.0, `<div class="meta"><div>Libero oggi</div><div></div><div style="text-align:right">Stasera</div></div>`],
      [0.4, `<div class="abs center hand out" style="top:600px;font-size:240px">Libero</div>`],
      [1.3, `<div class="abs center hand lime" style="top:830px;font-size:260px">oggi?</div>`],
      [2.8, `<div class="abs center" style="top:1220px"><span class="pill">Un tap e i tuoi match lo sanno</span></div>`],
    ],
    end: { cls: "dark", html: `<div class="abs center hand lime" style="top:640px;font-size:190px">Libero<br>oggi</div><div class="abs center hand" style="top:1050px;font-size:100px">su SANDER</div>` },
  },
  {
    name: "03-piedi-nudi",
    clip: "feet.mp4",
    layers: [
      [0.0, `<div class="meta"><div>Dress code</div><div></div><div style="text-align:right">Gratis</div></div>`],
      [0.4, `<div class="abs hand" style="left:90px;top:430px;font-size:260px">A</div>`],
      [1.0, `<div class="abs hand" style="left:330px;top:520px;font-size:240px;transform:rotate(-6deg)">piedi</div>`],
      [1.6, `<div class="abs hand lime" style="left:120px;top:860px;font-size:290px;transform:rotate(4deg)">nudi</div>`],
      [3.0, `<div class="abs center" style="top:1260px"><span class="pill">Zero scarpe. Sabbia e un pallone</span></div>`],
    ],
    end: { cls: "lime-bg", html: `<div class="abs center hand" style="top:640px;font-size:180px">Ci vediamo<br>in spiaggia</div>` },
  },
]

const endFooter = `<div class="abs center" style="top:1180px;display:flex;flex-direction:column;align-items:center;gap:22px">
  <img src="${logo}" style="width:120px;height:120px;border-radius:28px">
  <div class="hand" style="font-size:90px;-webkit-text-stroke-width:2px">sanderbv.it</div>
  <div style="font-size:26px;letter-spacing:.08em;text-transform:uppercase;font-weight:600">Link in bio</div></div>`

const page = await (await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {})).newPage({ viewport: { width: 1080, height: 1920 } })
async function png(html, path, transparent) {
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Mansalva&family=Inter:wght@500;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body>${html}</body></html>`)
  await page.waitForLoadState("networkidle").catch(() => {})
  await page.waitForTimeout(300)
  await page.screenshot({ path, omitBackground: transparent })
}

const CLIP = 5, END = 2, FADE = 0.35
for (const v of VIDEOS) {
  const layers = []
  for (const [i, [, html]] of v.layers.entries()) {
    const p = join(TMP, `${v.name}-l${i}.png`)
    await png(html, p, true)
    layers.push(p)
  }
  const endPng = join(TMP, `${v.name}-end.png`)
  await png(`<div class="card ${v.end.cls}">${v.end.html}${endFooter}</div>`, endPng, false)

  // Clip cover-cropped to 1080×1920, layers fading in at their time, then the end card.
  const inputs = ["-i", join(__dirname, "clips", v.clip)]
  for (const p of layers) inputs.push("-loop", "1", "-t", String(CLIP), "-i", p)
  inputs.push("-loop", "1", "-t", String(END + FADE), "-i", endPng)
  let f = `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,trim=0:${CLIP},setpts=PTS-STARTPTS,format=yuv420p[b0];`
  v.layers.forEach(([t], i) => {
    f += `[${i + 1}:v]format=rgba,fade=t=in:st=${t}:d=0.3:alpha=1[l${i}];[b${i}][l${i}]overlay=0:0:format=auto[b${i + 1}];`
  })
  const n = v.layers.length
  f += `[${n + 1}:v]fps=30,format=yuv420p,setsar=1[e];[b${n}]format=yuv420p[m];[m][e]xfade=transition=fade:duration=${FADE}:offset=${CLIP - FADE}[v]`
  execFileSync(FFMPEG, ["-y", "-loglevel", "error", ...inputs, "-filter_complex", f, "-map", "[v]", "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-r", "30", join(OUT, `${v.name}.mp4`)])
  console.log("saved", v.name)
}
await page.context().browser().close()

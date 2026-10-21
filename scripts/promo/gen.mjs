/**
 * 19-second promo for TikTok / Reels (1080×1920, 60 fps, silent: the music is
 * picked in the app). Seven beats, one idea each, the real app on a phone:
 * hook → Scopri → like with two words → match → propose → «Ci sto» → CTA.
 * Text stays in the top band, clear of the TikTok/Instagram buttons.
 *   node scripts/promo/shots.mjs   (app screens, see there)
 *   FFMPEG=… node scripts/promo/gen.mjs [--no-text]   → out/sander-promo[-notesto].mp4
 */
import { chromium } from "playwright"
import { readFileSync, mkdirSync, rmSync } from "fs"
import { execFileSync } from "child_process"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { tmpdir } from "os"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, "..", "..")
const NO_TEXT = process.argv.includes("--no-text")
const OUT = join(HERE, "out")
const FPS = 60
const DURATION = 19.5
const FRAMES = join(tmpdir(), `sander-promo-${process.pid}`)
mkdirSync(OUT, { recursive: true })
mkdirSync(FRAMES, { recursive: true })

const data = (file, type) => `data:${type};base64,${readFileSync(file).toString("base64")}`
const shot = (n) => data(join(HERE, "shots", `${n}.png`), "image/png")
const IMG = {
  deck: shot("1-deck"), like: shot("2-like"), match: shot("3-match"), propose: shot("4-proponi"),
  sent: shot("5-inviata"), ask: shot("6-ci-sto"), done: shot("7-partita"),
  beach: data(join(ROOT, "scripts/content-grid/photos/group.jpg"), "image/jpeg"),
  gabbo: data(join(ROOT, "public/mascot/gabbo-vittoria.webp"), "image/webp"),
  logo: data(join(ROOT, "public/icon-512.png"), "image/png"),
}

/* Tap targets in app (CSS px of the 390×844 screen), from the screenshots. */
const TAPS = { deckHeart: [333, 715], sendLike: [195, 681], propose: [195, 546], send: [195, 598], ciSto: [224, 392] }

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Mansalva&family=Inter:wght@500;700;800;900&display=swap" rel="stylesheet">
<style>
*{margin:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;position:relative;font-family:Inter,sans-serif;color:#fff;
  background:linear-gradient(160deg,#0f2124 0%,#0e1517 30%,#0d0f10 62%,#10140b 100%)}
.layer{position:absolute;inset:0}
#beach{background:url(${IMG.beach}) center/cover;filter:blur(6px) brightness(.42) saturate(1.1);transform:scale(1.08)}
.glow{background:radial-gradient(70% 34% at 15% -4%,rgba(120,200,220,.16),transparent 70%),radial-gradient(80% 30% at 100% 105%,rgba(198,247,54,.12),transparent 70%)}
.grain{opacity:.12;mix-blend-mode:overlay;background-image:url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>')}")}
.hand{font-family:Mansalva,cursive;line-height:.95;-webkit-text-stroke:2px currentColor}
.lime{color:#c6f736}
.cap{position:absolute;left:70px;right:70px;top:230px;text-align:center;z-index:4}
.topfade{position:absolute;left:0;right:0;top:0;height:800px;z-index:3;background:linear-gradient(180deg,#0f1d1f 0%,#0f1c1e 70%,rgba(15,28,30,0) 100%)}
.cap .k{font-size:30px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#c6f736;margin-bottom:18px}
.cap .h{font-size:124px}
#phone{position:absolute;left:50%;top:640px;width:500px;height:1052px;margin-left:-250px;border-radius:66px;background:#050505;padding:16px;
  box-shadow:0 0 0 3px #2b3133,0 40px 90px rgba(0,0,0,.65),0 0 70px rgba(198,247,54,.14);transform-origin:50% 40%}
#screen{position:relative;width:100%;height:100%;border-radius:52px;overflow:hidden;background:#0d0f10}
#screen img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top;opacity:0}
#tap{position:absolute;width:96px;height:96px;margin:-48px 0 0 -48px;border-radius:50%;border:5px solid #c6f736;background:rgba(198,247,54,.25);opacity:0}
.dot{position:absolute;border-radius:50%}
#people{position:absolute;left:0;right:0;top:820px;display:flex;justify-content:center;gap:34px}
#people svg{width:200px;height:200px}
#cta{position:absolute;left:70px;right:70px;top:300px;text-align:center}
#cta .logo{width:170px;height:170px;border-radius:40px;margin:0 auto 46px;display:block;box-shadow:0 20px 50px rgba(0,0,0,.5)}
#cta .h{font-size:150px}
#cta .sub{margin-top:40px;font-size:44px;font-weight:700;opacity:.92}
#cta .pill{display:inline-block;margin-top:46px;padding:26px 56px;border-radius:999px;background:#c6f736;color:#0b0b0c;font-size:46px;font-weight:900}
#gabbo{position:absolute;left:330px;top:1130px;width:420px;filter:drop-shadow(0 24px 40px rgba(0,0,0,.6))}
</style></head><body>
<div class="layer" id="beach"></div><div class="layer glow"></div>
<div id="hook" class="cap" style="top:300px"><div class="h hand" id="h1">Siete in tre?</div><div class="h hand lime" id="h2" style="margin-top:30px">Manca sempre uno.</div></div>
<div id="people">${[0, 1, 2, 3].map((i) => `<svg id="p${i}" viewBox="0 0 24 24" fill="none" stroke="${i === 3 ? "#c6f736" : "#fff"}" stroke-width="1.6" ${i === 3 ? 'stroke-dasharray="2.2 2"' : ""} stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/></svg>`).join("")}</div>
${[
  ["c1", "1 · Scopri", "Chi gioca<br>vicino a te"],
  ["c2", "2 · Like", "Un cuore e<br>due parole"],
  ["c3", "3 · Match", "Se ricambia,<br><span class='lime'>è match!</span>"],
  ["c4", "4 · Partita", "Giorno e bagno,<br>in un tocco"],
  ["c5", "5 · Fatto", "«Ci sto»<br><span class='lime'>e si gioca</span>"],
].map(([id, k, h]) => `<div class="cap" id="${id}" style="opacity:0"><div class="k">${k}</div><div class="h hand">${h}</div></div>`).join("")}
<div id="phone"><div id="screen">${Object.keys(IMG).filter((k) => !["beach", "gabbo", "logo"].includes(k)).map((k) => `<img id="s-${k}" src="${IMG[k]}">`).join("")}<div id="tap"></div></div></div>
<div class="topfade" id="topfade"></div><div id="burst"></div>
<div id="cta" style="opacity:0"><img class="logo" src="${IMG.logo}"><div class="h hand">Sabato<br><span class="lime">si gioca.</span></div><div class="sub">Il beach volley della Riviera, in un'app</div><div class="pill">Gratis · sanderbv.it</div></div>
<img id="gabbo" src="${IMG.gabbo}" style="opacity:0">
<div class="layer grain"></div>
<script>
const NO_TEXT = ${NO_TEXT}
const TAPS = ${JSON.stringify(TAPS)}
const $ = (id) => document.getElementById(id)
const clamp = (x) => Math.max(0, Math.min(1, x))
const ease = (x) => 1 - Math.pow(1 - clamp(x), 3)
const back = (x) => { x = clamp(x); const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2) }
const win = (t, a, b) => clamp((t - a) / (b - a))
// in/out envelope: fades in over [a, a+f], out over [b-f, b]
const env = (t, a, b, f = 0.3) => Math.min(ease(win(t, a, a + f)), 1 - ease(win(t, b - f, b)))
// [screen, start, end, how it comes in: "x" slides in from the side like a new
// page, "y" rises like a sheet, "pop" lands with a zoom punch]
const SCREENS = [["deck", 2.1, 5.0, "pop"], ["like", 5.0, 7.7, "y"], ["match", 7.7, 10.0, "pop"], ["propose", 10.0, 12.1, "x"], ["sent", 12.1, 13.4, "y"], ["ask", 13.4, 15.2, "x"], ["done", 15.2, 16.4, "y"]]
// [from second, zoom, focus y in app CSS px]
const FOCUS = [[2.1, 1.28, 540], [5.0, 1.42, 560], [7.7, 1.12, 430], [10.0, 1.42, 470], [12.1, 1.5, 300], [15.2, 1.42, 330]]
const CAPS = [["c1", 2.2, 5.0], ["c2", 5.0, 7.7], ["c3", 7.7, 10.0], ["c4", 10.0, 13.4], ["c5", 13.4, 16.4]]
const TAPLIST = [["deckHeart", 4.65], ["sendLike", 7.4], ["propose", 9.7], ["send", 11.8], ["ciSto", 14.9]]
const IN = 0.28 // seconds a screen takes to come in
const dots = Array.from({ length: 26 }, (_, i) => { const d = document.createElement("div"); d.className = "dot"; $("burst").appendChild(d); return d })

window.render = (t) => {
  // 1 · hook on the beach: quick pops over a slow push-in
  $("beach").style.opacity = 1 - ease(win(t, 1.9, 2.3))
  $("beach").style.transform = "scale(" + (1.08 + 0.07 * clamp(t / 2.3)) + ")"
  $("hook").style.opacity = NO_TEXT ? 0 : env(t, 0, 2.15, 0.15)
  $("h1").style.transform = "scale(" + (0.7 + 0.3 * back(win(t, 0.02, 0.32))) + ")"
  $("h1").style.opacity = ease(win(t, 0.02, 0.15))
  $("h2").style.opacity = ease(win(t, 0.55, 0.7))
  $("h2").style.transform = "scale(" + (0.75 + 0.25 * back(win(t, 0.55, 0.85))) + ")"
  $("people").style.opacity = env(t, 0.1, 2.1, 0.15)
  for (let i = 0; i < 4; i++) {
    const p = $("p" + i), a = 0.15 + i * 0.12
    p.style.opacity = i === 3 ? ease(win(t, 0.75, 0.9)) * (0.55 + 0.45 * Math.abs(Math.sin(t * 7))) : ease(win(t, a, a + 0.12))
    p.style.transform = "translateY(" + (1 - back(win(t, a, a + 0.25))) * 90 + "px)"
  }
  // phone: flies in at 1.85s, leaves at 16.25s
  const pin = back(win(t, 1.85, 2.25)), pout = ease(win(t, 16.25, 16.6))
  // Camera: per screen, zoom on the part that matters and bring it to the
  // middle; inside each screen a slow push so the frame never sits still.
  let z = FOCUS[0][1], fy = FOCUS[0][2], scene = 0
  for (let i = 1; i < FOCUS.length; i++) {
    const k = ease(win(t, FOCUS[i][0] - 0.12, FOCUS[i][0] + 0.3))
    z += (FOCUS[i][1] - z) * k; fy += (FOCUS[i][2] - fy) * k
  }
  for (let i = 0; i < SCREENS.length; i++) if (t >= SCREENS[i][1]) scene = i
  const [, sa, sb] = SCREENS[scene]
  z *= 1 + 0.035 * win(t, sa, sb)
  z *= 1 + 0.07 * Math.sin(Math.PI * win(t, 7.7, 8.05)) // punch on the match
  const oy = 16 + fy * 1.2, target = 1130 - (640 + oy)
  $("phone").style.transformOrigin = "50% " + oy + "px"
  $("phone").style.transform = "translateY(" + (target * pin + (1 - pin) * 1400 + pout * 1600) + "px) rotate(" + (1 - pin) * -8 + "deg) scale(" + z + ")"
  $("topfade").style.opacity = ease(win(t, 1.9, 2.2)) * (1 - ease(win(t, 16.3, 16.55)))
  // screens: each comes in over the last one, the way the app moves
  SCREENS.forEach(([k, a, b, how], i) => {
    const img = $("s-" + k), next = SCREENS[i + 1]
    const shown = t >= a && t < (next ? next[1] + IN : b + 0.4)
    img.style.zIndex = i + 1
    if (!shown) { img.style.opacity = 0; return }
    const e = ease(win(t, a, a + IN))
    let tf = ""
    if (how === "x") tf = "translateX(" + (1 - e) * 100 + "%)"
    if (how === "y") tf = "translateY(" + (1 - e) * 100 + "%)"
    if (how === "pop") tf = "scale(" + (0.82 + 0.18 * back(win(t, a, a + IN + 0.1))) + ")"
    // pushed back while the next one comes in
    const leave = next ? ease(win(t, next[1], next[1] + IN)) : 0
    if (next && next[3] === "x") tf += " translateX(" + -leave * 30 + "%)"
    img.style.transform = tf
    img.style.filter = "brightness(" + (1 - 0.45 * leave) + ")"
    img.style.opacity = how === "pop" ? ease(win(t, a, a + 0.12)) : 1
  })
  for (const [id, a, b] of CAPS) {
    const e = NO_TEXT ? 0 : env(t, a, b, 0.14)
    $(id).style.opacity = e
    $(id).style.transform = "translateY(" + (1 - e) * 24 + "px) scale(" + (0.88 + 0.12 * back(win(t, a, a + 0.3))) + ")"
  }
  // tap ripples on what gets pressed
  const tap = $("tap"); tap.style.opacity = 0; tap.style.zIndex = 20
  for (const [k, at] of TAPLIST) {
    const x = win(t, at - 0.25, at + 0.2)
    if (x > 0 && x < 1) {
      const [cx, cy] = TAPS[k], s = 468 / 390
      tap.style.left = cx * s + "px"; tap.style.top = cy * s + "px"
      tap.style.opacity = x < 0.55 ? ease(x / 0.3) : 1 - ease((x - 0.55) / 0.45)
      tap.style.transform = "scale(" + (x < 0.55 ? 1 - 0.25 * ease(win(x, 0.35, 0.55)) : 0.75 + 0.9 * ease((x - 0.55) / 0.45)) + ")"
    }
  }
  // lime burst on the match
  const bx = win(t, 7.75, 8.9)
  dots.forEach((d, i) => {
    const ang = (i / dots.length) * Math.PI * 2 + i, r = 260 + (i * 53) % 320, s = 12 + (i * 7) % 20
    d.style.width = d.style.height = s + "px"
    d.style.background = i % 3 ? "#c6f736" : "#ffffff"
    d.style.left = 540 + Math.cos(ang) * r * ease(bx) - s / 2 + "px"
    d.style.top = 1010 + Math.sin(ang) * r * 0.9 * ease(bx) - s / 2 + "px"
    d.style.opacity = bx > 0 && bx < 1 ? Math.min(1, bx * 6) * (1 - bx) : 0
  })
  // CTA
  const c = win(t, 16.45, 16.85)
  $("cta").style.opacity = ease(c * 2)
  $("cta").style.transform = "scale(" + (0.85 + 0.15 * back(c)) + ")"
  $("gabbo").style.opacity = ease(win(t, 16.9, 17.05))
  $("gabbo").style.transform = "translateY(" + (1 - back(win(t, 16.9, 17.3))) * 300 + "px) rotate(" + Math.sin(t * 4) * 4 + "deg)"
}
</script></body></html>`

const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {})
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } })
await p.setContent(html, { waitUntil: "networkidle" })
await p.evaluate(() => document.fonts.ready)
const total = Math.round(DURATION * FPS)
for (let f = 0; f < total; f++) {
  await p.evaluate((t) => window.render(t), f / FPS)
  await p.screenshot({ path: join(FRAMES, `f${String(f).padStart(4, "0")}.jpg`), type: "jpeg", quality: 95 })
}
await b.close()

const name = NO_TEXT ? "sander-promo-senzatesto.mp4" : "sander-promo.mp4"
// Silent stereo track: some uploaders reject video without audio.
execFileSync(process.env.FFMPEG ?? "ffmpeg", [
  "-loglevel", "error", "-y", "-framerate", String(FPS), "-i", join(FRAMES, "f%04d.jpg"),
  "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
  "-shortest", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "high", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", join(OUT, name),
])
rmSync(FRAMES, { recursive: true, force: true })
console.log("saved", join(OUT, name))

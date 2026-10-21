/**
 * 27-second promo for TikTok / Reels (1080×1920, 30 fps, silent: the music is
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
const FPS = 30
const DURATION = 27
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
const SCREENS = [["deck", 3.0, 7.6], ["like", 7.6, 11.9], ["match", 11.9, 15.4], ["propose", 15.4, 17.9], ["sent", 17.9, 20.2], ["ask", 20.2, 22.1], ["done", 22.1, 23.7]]
// [from second, zoom, focus y in app CSS px]
const FOCUS = [[3.0, 1.3, 540], [7.6, 1.42, 560], [11.9, 1.12, 430], [15.4, 1.42, 470], [17.9, 1.5, 300], [22.1, 1.42, 330]]
const CAPS = [["c1", 3.1, 7.6], ["c2", 7.6, 11.9], ["c3", 11.9, 15.4], ["c4", 15.4, 20.2], ["c5", 20.2, 23.7]]
const TAPLIST = [["deckHeart", 6.6], ["sendLike", 11.1], ["propose", 14.6], ["send", 17.3], ["ciSto", 21.4]]
const dots = Array.from({ length: 26 }, (_, i) => { const d = document.createElement("div"); d.className = "dot"; $("burst").appendChild(d); return d })

window.render = (t) => {
  // 1 · hook on the beach
  $("beach").style.opacity = 1 - ease(win(t, 2.6, 3.2))
  $("hook").style.opacity = NO_TEXT ? 0 : env(t, 0, 3.1, 0.25)
  $("h1").style.transform = "translateY(" + (1 - back(win(t, 0.05, 0.5))) * 60 + "px)"
  $("h2").style.opacity = ease(win(t, 0.9, 1.25))
  $("h2").style.transform = "scale(" + (0.85 + 0.15 * back(win(t, 0.9, 1.3))) + ")"
  $("people").style.opacity = env(t, 0.2, 3.0, 0.3)
  for (let i = 0; i < 4; i++) {
    const p = $("p" + i), a = 0.25 + i * 0.18
    p.style.opacity = i === 3 ? ease(win(t, 1.3, 1.6)) * (0.55 + 0.45 * Math.abs(Math.sin(t * 5))) : ease(win(t, a, a + 0.25))
    p.style.transform = "translateY(" + (1 - back(win(t, a, a + 0.35))) * 80 + "px)"
  }
  // phone: in from below at 3s, a small push-in on the match, out at 23.7s
  const pin = back(win(t, 2.9, 3.6)), pout = ease(win(t, 23.5, 24.1))
  // Camera: per screen, zoom on the part that matters (y in app CSS px) and
  // bring it to the middle of the frame, easing between screens.
  let z = FOCUS[0][1], fy = FOCUS[0][2]
  for (let i = 1; i < FOCUS.length; i++) {
    const k = ease(win(t, FOCUS[i][0] - 0.25, FOCUS[i][0] + 0.35))
    z += (FOCUS[i][1] - z) * k; fy += (FOCUS[i][2] - fy) * k
  }
  const oy = 16 + fy * 1.2, target = 1130 - (640 + oy)
  $("phone").style.transformOrigin = "50% " + oy + "px"
  $("phone").style.transform = "translateY(" + (target * pin + (1 - pin) * 1300 + pout * 1500) + "px) scale(" + z + ")"
  $("topfade").style.opacity = ease(win(t, 2.9, 3.3)) * (1 - ease(win(t, 23.6, 24.0)))
  for (const [k, a, b] of SCREENS) $("s-" + k).style.opacity = env(t, a, b, 0.18)
  for (const [id, a, b] of CAPS) {
    const e = NO_TEXT ? 0 : env(t, a, b, 0.28)
    $(id).style.opacity = e
    $(id).style.transform = "translateY(" + (1 - e) * 40 + "px)"
  }
  // tap ripples on what gets pressed
  const tap = $("tap"); tap.style.opacity = 0
  for (const [k, at] of TAPLIST) {
    const x = win(t, at - 0.35, at + 0.25)
    if (x > 0 && x < 1) {
      const [cx, cy] = TAPS[k], s = 468 / 390
      tap.style.left = cx * s + "px"; tap.style.top = cy * s + "px"
      tap.style.opacity = x < 0.55 ? ease(x / 0.3) : 1 - ease((x - 0.55) / 0.45)
      tap.style.transform = "scale(" + (x < 0.55 ? 1 - 0.25 * ease(win(x, 0.35, 0.55)) : 0.75 + 0.9 * ease((x - 0.55) / 0.45)) + ")"
    }
  }
  // lime burst on the match
  const bx = win(t, 12.0, 13.4)
  dots.forEach((d, i) => {
    const ang = (i / dots.length) * Math.PI * 2 + i, r = 260 + (i * 53) % 320, s = 12 + (i * 7) % 20
    d.style.width = d.style.height = s + "px"
    d.style.background = i % 3 ? "#c6f736" : "#ffffff"
    d.style.left = 540 + Math.cos(ang) * r * ease(bx) - s / 2 + "px"
    d.style.top = 1010 + Math.sin(ang) * r * 0.9 * ease(bx) - s / 2 + "px"
    d.style.opacity = bx > 0 && bx < 1 ? Math.min(1, bx * 6) * (1 - bx) : 0
  })
  // CTA
  const c = ease(win(t, 23.9, 24.5))
  $("cta").style.opacity = c
  $("cta").style.transform = "translateY(" + (1 - c) * 50 + "px)"
  $("gabbo").style.opacity = ease(win(t, 24.5, 24.8))
  $("gabbo").style.transform = "translateY(" + (1 - back(win(t, 24.5, 25.1))) * 260 + "px) rotate(" + Math.sin(t * 3) * 3 + "deg)"
}
</script></body></html>`

const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {})
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } })
await p.setContent(html, { waitUntil: "networkidle" })
await p.evaluate(() => document.fonts.ready)
const total = DURATION * FPS
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

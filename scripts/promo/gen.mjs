/**
 * 20-second promo for TikTok / Reels (1080×1920, 60 fps, built-in sound
 * effects; the music goes on top later). Seven beats, one idea each, the real
 * app on a phone that travels between them, tied by hand-drawn arrows,
 * lifted-out details and a 1→5 rail:
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
const BEAT = 0.5 // seconds per beat (120 BPM)
const DURATION = 20
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

/* Details lifted out of the phone: crop of a screen in app CSS px [x, y, w, h],
   where it lands in the frame, and when. */
const CALLS = [
  { id: "k1", img: "like", crop: [13, 503, 364, 112], w: 640, x: 40, y: 1230, rot: -3, from: 5.5, to: 6.75 },
  { id: "k2", img: "sent", crop: [85, 185, 296, 245], w: 540, x: 500, y: 760, rot: 3, from: 13.0, to: 13.85 },
  { id: "k3", img: "done", crop: [10, 768, 372, 58], w: 780, x: 150, y: 1300, rot: -2, from: 15.75, to: 16.85, noLink: true },
]

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
#fx{position:absolute;inset:0;z-index:6;pointer-events:none;overflow:visible}
.call{position:absolute;z-index:5;border-radius:24px;background-repeat:no-repeat;opacity:0;
  box-shadow:0 0 0 4px #c6f736,0 30px 60px rgba(0,0,0,.6),0 0 60px rgba(198,247,54,.35)}
#rail{position:absolute;left:42px;top:760px;width:44px;height:640px;z-index:5;opacity:0}
#rail .track,#rail .fill{position:absolute;left:20px;top:22px;width:4px;height:596px;border-radius:4px;background:rgba(255,255,255,.18)}
#rail .fill{background:#c6f736;transform-origin:top;box-shadow:0 0 14px rgba(198,247,54,.7)}
#rail .n{position:absolute;left:0;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:22px;font-weight:900;background:#1b2224;color:rgba(255,255,255,.6);border:3px solid rgba(255,255,255,.25)}
#rail .n.on{background:#c6f736;color:#0b0b0c;border-color:#c6f736;box-shadow:0 0 20px rgba(198,247,54,.6)}
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
<div id="phone"><div id="screen">${Object.keys(IMG).filter((k) => !["beach", "gabbo", "logo"].includes(k)).map((k) => `<img id="s-${k}" src="${IMG[k]}">`).join("")}<div id="tap"></div><div id="mk" style="position:absolute;width:2px;height:2px"></div></div></div>
<div class="topfade" id="topfade"></div><div id="burst"></div>
<div id="rail"><div class="track"></div><div class="fill" id="railfill"></div>${[0, 1, 2, 3, 4].map((i) => `<div class="n" id="rn${i}" style="top:${i * 149}px">${i + 1}</div>`).join("")}</div>
${CALLS.map((c) => `<div class="call" id="${c.id}" style="width:${c.w}px;height:${Math.round((c.w * c.crop[3]) / c.crop[2])}px;background-image:url(${IMG[c.img]});background-size:${Math.round((390 * c.w) / c.crop[2])}px auto;background-position:${-Math.round((c.crop[0] * c.w) / c.crop[2])}px ${-Math.round((c.crop[1] * c.w) / c.crop[2])}px"></div>`).join("")}
<svg id="fx" viewBox="0 0 1080 1920"><path id="arrow" fill="none" stroke="#c6f736" stroke-width="10" stroke-linecap="round"/><path id="head" fill="none" stroke="#c6f736" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><path id="link" fill="none" stroke="#c6f736" stroke-width="5" stroke-linecap="round" stroke-dasharray="14 12"/></svg>
<div id="cta" style="opacity:0"><img class="logo" src="${IMG.logo}"><div class="h hand">Sabato<br><span class="lime">si gioca.</span></div><div class="sub">Il beach volley della Riviera, in un'app</div><div class="pill">Gratis · sanderbv.it</div></div>
<img id="gabbo" src="${IMG.gabbo}" style="opacity:0">
<div class="layer grain"></div>
<script>
const NO_TEXT = ${NO_TEXT}
const TAPS = ${JSON.stringify(TAPS)}
const CALLS = ${JSON.stringify(CALLS)}
const $ = (id) => document.getElementById(id)
const clamp = (x) => Math.max(0, Math.min(1, x))
const ease = (x) => 1 - Math.pow(1 - clamp(x), 3)
const back = (x) => { x = clamp(x); const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2) }
const win = (t, a, b) => clamp((t - a) / (b - a))
// in/out envelope: fades in over [a, a+f], out over [b-f, b]
const env = (t, a, b, f = 0.3) => Math.min(ease(win(t, a, a + f)), 1 - ease(win(t, b - f, b)))
// [screen, start, end, how it comes in: "x" slides in from the side like a new
// page, "y" rises like a sheet, "pop" lands with a zoom punch]
const SCREENS = [["deck", 2.0, 5.0, "pop"], ["like", 5.0, 8.0, "y"], ["match", 8.0, 10.5, "pop"], ["propose", 10.5, 12.5, "x"], ["sent", 12.5, 14.0, "y"], ["ask", 14.0, 15.5, "x"], ["done", 15.5, 17.0, "y"]]
// [from second, zoom, focus y in app CSS px]
const FOCUS = [[2.0, 1.28, 540], [5.0, 1.42, 560], [8.0, 1.12, 430], [10.5, 1.42, 470], [12.5, 1.5, 300], [15.5, 1.42, 330]]
const CAPS = [["c1", 2.0, 5.0], ["c2", 5.0, 8.0], ["c3", 8.0, 10.5], ["c4", 10.5, 14.0], ["c5", 14.0, 17.0]]
const TAPLIST = [["deckHeart", 4.0], ["sendLike", 7.0], ["propose", 9.5], ["send", 12.0], ["ciSto", 15.0]]
// Arrows only where the title changes; each draws while the phone is still,
// lands next to where the new title appears, then fades as the title pops.
const ARROWS = [["deckHeart", 4.0], ["sendLike", 7.0], ["propose", 9.5]]
const IN = 0.22 // seconds a screen takes to come in
const BEAT = ${BEAT} // 120 BPM: every cut, tap, arrow and title lands on a beat
// [from second, x offset, tilt]: the phone swings to make room for the details
const POSE = [[2.0, 0, -2], [5.0, 110, 2.5], [8.0, 0, 0], [10.5, -60, -2], [12.5, -150, -3], [14.0, 60, 2], [15.5, 0, 0]]
const swing = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 }
// a point of the app (CSS px) → where it is in the frame right now
const spot = (cx, cy) => { const m = $("mk"); m.style.left = cx * 1.2 + "px"; m.style.top = cy * 1.2 + "px"; const r = m.getBoundingClientRect(); return { x: r.left, y: r.top } }
const dots = Array.from({ length: 26 }, (_, i) => { const d = document.createElement("div"); d.className = "dot"; $("burst").appendChild(d); return d })

window.render = (t) => {
  // 1 · hook on the beach: quick pops over a slow push-in
  $("beach").style.opacity = 1 - ease(win(t, 1.85, 2.1))
  $("beach").style.transform = "scale(" + (1.08 + 0.07 * clamp(t / 2.1)) + ")"
  $("hook").style.opacity = NO_TEXT ? 0 : env(t, 0, 2.05, 0.12)
  $("h1").style.transform = "scale(" + (0.7 + 0.3 * back(win(t, 0, 0.25))) + ")"
  $("h1").style.opacity = ease(win(t, 0, 0.1))
  $("h2").style.opacity = ease(win(t, 1.0, 1.1))
  $("h2").style.transform = "scale(" + (0.75 + 0.25 * back(win(t, 1.0, 1.25))) + ")"
  $("people").style.opacity = env(t, 0.2, 2.05, 0.12)
  for (let i = 0; i < 4; i++) {
    const p = $("p" + i), a = 0.25 + i * 0.25
    p.style.opacity = i === 3 ? ease(win(t, 1.0, 1.1)) * (0.55 + 0.45 * Math.abs(Math.sin(t * 2 * Math.PI))) : ease(win(t, a, a + 0.12))
    p.style.transform = "translateY(" + (1 - back(win(t, a, a + 0.25))) * 90 + "px)"
  }
  // phone: flies in at 1.85s, leaves at 16.25s; between screens it travels
  // across the frame (side, tilt), blurred by its own speed.
  const pose = (t) => {
    const pin = back(win(t, 1.9, 2.2)), pout = ease(win(t, 16.9, 17.15))
    let z = FOCUS[0][1], fy = FOCUS[0][2], px = POSE[0][1], pr = POSE[0][2]
    for (let i = 1; i < FOCUS.length; i++) {
      const k = ease(win(t, FOCUS[i][0] - 0.12, FOCUS[i][0] + 0.3))
      z += (FOCUS[i][1] - z) * k; fy += (FOCUS[i][2] - fy) * k
    }
    for (let i = 1; i < POSE.length; i++) {
      const k = swing(win(t, POSE[i][0] - 0.15, POSE[i][0] + 0.35))
      px += (POSE[i][1] - px) * k; pr += (POSE[i][2] - pr) * k
    }
    let scene = 0
    for (let i = 0; i < SCREENS.length; i++) if (t >= SCREENS[i][1]) scene = i
    const [, sa, sb] = SCREENS[scene]
    z *= 1 + 0.035 * win(t, sa, sb)
    z *= 1 + 0.07 * Math.sin(Math.PI * win(t, 8.0, 8.35)) // punch on the match
    // a small kick on every beat (120 BPM), so the frame moves with the music
    if (t >= 2.0 && t < 17.0) z *= 1 + 0.014 * Math.exp(-(((t - 2.0) % BEAT) / BEAT) * 7)
    const oy = 16 + fy * 1.2
    return { z, oy, x: px, r: pr + (1 - pin) * -8, y: (1130 - (640 + oy)) * pin + (1 - pin) * 1400 + pout * 1600 }
  }
  const P = pose(t), Q = pose(t - 1 / 60)
  const speed = Math.abs(P.x - Q.x) + Math.abs(P.y - Q.y) * 0.25 + Math.abs(P.r - Q.r) * 12 + Math.abs(P.z - Q.z) * 900
  $("phone").style.transformOrigin = "50% " + P.oy + "px"
  $("phone").style.transform = "translate(" + P.x + "px," + P.y + "px) rotate(" + P.r + "deg) scale(" + P.z + ")"
  $("phone").style.opacity = t < 1.88 || t > 17.2 ? 0 : 1 // off-frame before it flies in and after it leaves
  $("phone").style.filter = speed > 1.5 ? "blur(" + Math.min(9, speed * 0.35).toFixed(1) + "px)" : "none"
  $("topfade").style.opacity = ease(win(t, 1.9, 2.15)) * (1 - ease(win(t, 16.95, 17.2)))
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
    const e = NO_TEXT ? 0 : env(t, a, b, 0.1)
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
  const bx = win(t, 8.0, 9.1)
  dots.forEach((d, i) => {
    const ang = (i / dots.length) * Math.PI * 2 + i, r = 260 + (i * 53) % 320, s = 12 + (i * 7) % 20
    d.style.width = d.style.height = s + "px"
    d.style.background = i % 3 ? "#c6f736" : "#ffffff"
    d.style.left = 540 + Math.cos(ang) * r * ease(bx) - s / 2 + "px"
    d.style.top = 1010 + Math.sin(ang) * r * 0.9 * ease(bx) - s / 2 + "px"
    d.style.opacity = bx > 0 && bx < 1 ? Math.min(1, bx * 6) * (1 - bx) : 0
  })
  // hand-drawn arrow from what was tapped, out along the right edge (never
  // across the screens) and up to where the next title appears
  const arrow = $("arrow"), head = $("head")
  arrow.style.opacity = head.style.opacity = 0
  if (!NO_TEXT) for (const [k, at] of ARROWS) {
    const d = win(t, at, at + 0.45), out = win(t, at + 0.85, at + 1.05)
    if (d <= 0 || out >= 1) continue
    const a = spot(...TAPS[k]), m = 1010, e = { x: 845, y: 545 }
    arrow.setAttribute("d", "M" + a.x + " " + a.y + " Q" + m + " " + a.y + " " + m + " " + (a.y - 180) + " L" + m + " " + (e.y + 150) + " Q" + m + " " + e.y + " " + e.x + " " + e.y)
    const len = arrow.getTotalLength()
    arrow.style.strokeDasharray = len; arrow.style.strokeDashoffset = len * (1 - ease(d))
    const hl = 40
    head.setAttribute("d", "M" + (e.x + hl * 0.85) + " " + (e.y - hl * 0.6) + " L" + e.x + " " + e.y + " L" + (e.x + hl * 0.85) + " " + (e.y + hl * 0.6))
    arrow.style.opacity = 1 - ease(out); head.style.opacity = d > 0.92 ? 1 - ease(out) : 0
  }
  // details lifted out of the phone, tied to where they come from
  const link = $("link"); link.style.opacity = 0
  for (const c of CALLS) {
    const el = $(c.id), k = win(t, c.from, c.from + 0.35), out = win(t, c.to - 0.2, c.to)
    el.style.left = c.x + "px"; el.style.top = c.y + "px"
    if (k <= 0 || out >= 1) { el.style.opacity = 0; continue }
    const src = spot(c.crop[0] + c.crop[2] / 2, c.crop[1] + c.crop[3] / 2)
    const h = (c.w * c.crop[3]) / c.crop[2]
    const tx = (src.x - (c.x + c.w / 2)) * (1 - ease(k)), ty = (src.y - (c.y + h / 2)) * (1 - ease(k))
    el.style.opacity = Math.min(1, k * 4) * (1 - ease(out))
    el.style.transform = "translate(" + tx + "px," + ty + "px) rotate(" + c.rot * ease(k) + "deg) scale(" + (0.6 + 0.4 * back(k)) + ")"
    const end = { x: c.x + c.w / 2, y: c.y + h / 2 }
    link.setAttribute("d", "M" + src.x + " " + src.y + " Q" + (src.x + end.x) / 2 + " " + (Math.min(src.y, end.y) - 80) + " " + end.x + " " + end.y)
    link.style.opacity = k >= 1 && !c.noLink ? 0.9 * (1 - ease(out)) : 0
  }
  // progress 1 → 5 along the left edge
  const stepAt = [2.0, 5.0, 8.0, 10.5, 14.0]
  $("rail").style.opacity = env(t, 2.0, 17.0, 0.2)
  let fill = 0
  stepAt.forEach((a, i) => {
    const on = t >= a
    $("rn" + i).className = "n" + (on ? " on" : "")
    $("rn" + i).style.transform = "scale(" + (1 + 0.35 * Math.sin(Math.PI * win(t, a, a + 0.25)) + (on && t < 17 ? 0.08 * Math.exp(-(((t - 2.0) % BEAT) / BEAT) * 7) : 0)) + ")"
    if (i > 0) fill += ease(win(t, a - 0.3, a + 0.1)) / 4
  })
  $("railfill").style.transform = "scaleY(" + fill + ")"
  // CTA
  const c = win(t, 17.0, 17.35)
  $("cta").style.opacity = ease(c * 2)
  $("cta").style.transform = "scale(" + (0.85 + 0.15 * back(c)) + ")"
  $("gabbo").style.opacity = ease(win(t, 17.5, 17.6))
  $("gabbo").style.transform = "translateY(" + (1 - back(win(t, 17.5, 17.85))) * 300 + "px) rotate(" + Math.sin(t * 4) * 4 + "deg)"
}
</script></body></html>`

const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {})
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } })
await p.setContent(html, { waitUntil: "networkidle" })
await p.evaluate(() => document.fonts.ready)
// AT=5.8,12.6 renders just those seconds as PNGs in out/ (to check a frame).
if (process.env.AT) {
  for (const t of process.env.AT.split(",").map(Number)) {
    await p.evaluate((t) => window.render(t), t)
    await p.screenshot({ path: join(OUT, `frame-${t}.png`) })
  }
  await b.close()
  process.exit(0)
}
const total = Math.round(DURATION * FPS)
for (let f = 0; f < total; f++) {
  await p.evaluate((t) => window.render(t), f / FPS)
  await p.screenshot({ path: join(FRAMES, `f${String(f).padStart(4, "0")}.jpg`), type: "jpeg", quality: 95 })
}
await b.close()

const name = NO_TEXT ? "sander-promo-senzatesto.mp4" : "sander-promo.mp4"
const FFMPEG = process.env.FFMPEG ?? "ffmpeg"

/* Sound effects, synthesised here (no third-party audio, nothing to license):
   soft enough that music can go underneath later. */
const SFX = {
  click: "0.55*sin(2*PI*2200*t)*exp(-t*120)+0.25*(random(0)*2-1)*exp(-t*400)",
  pop: "0.6*sin(2*PI*(720*t-1800*t*t))*exp(-t*22)",
  blip: "0.38*sin(2*PI*(520*t+1500*t*t))*exp(-t*30)",
  blipHi: "0.38*sin(2*PI*(900*t+2200*t*t))*exp(-t*28)",
  whoosh: "(random(0)*2-1)*pow(sin(PI*t/0.38),2)*0.6",
  scribble: "(random(0)*2-1)*(0.55+0.45*sin(2*PI*16*t))*pow(sin(PI*t/0.5),2)*0.3",
  sparkle: "0.32*sin(2*PI*1046*t)*exp(-t*5)+gte(t,0.07)*0.28*sin(2*PI*1318*(t-0.07))*exp(-(t-0.07)*5)+gte(t,0.14)*0.28*sin(2*PI*1568*(t-0.14))*exp(-(t-0.14)*5)",
  ding: "0.38*sin(2*PI*1318*t)*exp(-t*6)+0.2*sin(2*PI*2637*t)*exp(-t*9)",
  chime: "0.3*sin(2*PI*784*t)*exp(-t*4)+gte(t,0.09)*0.28*sin(2*PI*988*(t-0.09))*exp(-(t-0.09)*4)+gte(t,0.18)*0.28*sin(2*PI*1175*(t-0.18))*exp(-(t-0.18)*4)+gte(t,0.27)*0.3*sin(2*PI*1568*(t-0.27))*exp(-(t-0.27)*3.5)",
  boing: "0.45*sin(2*PI*(260*t+420*t*t))*exp(-t*8)",
  kick: "0.9*sin(2*PI*(95*t-120*t*t))*exp(-t*14)",
  hat: "(random(0)*2-1)*exp(-t*90)*0.5",
}
const LEN = { kick: 0.3, hat: 0.06, click: 0.12, pop: 0.2, blip: 0.14, blipHi: 0.14, whoosh: 0.38, scribble: 0.5, sparkle: 1.1, ding: 0.8, chime: 1.4, boing: 0.45 }
const FILTER = { hat: ",highpass=f=7000", whoosh: ",bandpass=f=900:width_type=o:w=1.4,volume=1.8", scribble: ",highpass=f=1800,lowpass=f=6500" }
// [second, sound, volume] — in step with the timeline in the page above
const EVENTS = [
  [0, "pop", 0.8], [0.25, "blip", 0.7], [0.5, "blip", 0.7], [0.75, "blip", 0.7], [1.0, "pop", 0.9], [1.0, "blipHi", 0.7],
  [1.85, "whoosh", 0.9],
  [4.0, "click", 1], [4.0, "scribble", 0.8], [4.9, "whoosh", 0.7],
  [5.5, "pop", 0.7], [7.0, "click", 1], [7.0, "scribble", 0.8],
  [7.9, "whoosh", 0.6], [8.0, "sparkle", 0.9],
  [9.5, "click", 1], [9.5, "scribble", 0.8], [10.4, "whoosh", 0.7],
  [12.0, "click", 1], [12.4, "whoosh", 0.6], [13.0, "pop", 0.7],
  [13.9, "whoosh", 0.6], [15.0, "click", 1], [15.5, "ding", 0.8], [15.75, "pop", 0.7],
  [16.85, "whoosh", 0.9], [17.0, "chime", 0.8], [17.5, "boing", 0.7],
]
const SFX_DIR = join(FRAMES, "sfx")
mkdirSync(SFX_DIR, { recursive: true })
for (const [k, expr] of Object.entries(SFX)) {
  execFileSync(FFMPEG, ["-loglevel", "error", "-y", "-f", "lavfi", "-i", `aevalsrc='${expr}':s=48000:d=${LEN[k]}${FILTER[k] ?? ""}`, "-ac", "2", join(SFX_DIR, `${k}.wav`)])
}
function encode(file, events) {
  const used = [...new Set(events.map((e) => e[1]))]
  const mix = events.map(([at, k, v], i) => `[${1 + used.indexOf(k)}:a]adelay=${Math.round(at * 1000)}|${Math.round(at * 1000)},volume=${v}[e${i}]`).join(";")
  execFileSync(FFMPEG, [
    "-loglevel", "error", "-y", "-framerate", String(FPS), "-i", join(FRAMES, "f%04d.jpg"),
    ...used.flatMap((k) => ["-i", join(SFX_DIR, `${k}.wav`)]),
    "-filter_complex", `${mix};${events.map((_, i) => `[e${i}]`).join("")}amix=inputs=${events.length}:normalize=0,apad=whole_dur=${DURATION},alimiter=limit=0.9[a]`,
    "-map", "0:v", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "high", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", join(OUT, file),
  ])
  console.log("saved", join(OUT, file))
}
encode(name, EVENTS)
// A version with a light 120 BPM groove under the effects (kick on the beat,
// hat off the beat), to hear the rhythm before real music goes on.
if (!NO_TEXT) {
  const groove = []
  for (let at = 2.0; at < 17.0; at += BEAT) groove.push([at, "kick", 0.55], [at + BEAT / 2, "hat", 0.35])
  encode("sander-promo-ritmo.mp4", [...EVENTS, ...groove])
}
rmSync(FRAMES, { recursive: true, force: true })

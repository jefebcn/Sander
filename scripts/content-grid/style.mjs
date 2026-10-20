/**
 * Shared look of SANDER social graphics (grid posts, carousels, stories,
 * highlight covers): grainy graphite, film photos, marker type, SANDER lime.
 * Sizes are set by each generator; this only holds the style and helpers.
 */
import { readFileSync } from "fs"
import { join, dirname, extname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
export const RAW = join(__dirname, "photos")
const MIME = { ".jpg": "image/jpeg", ".webp": "image/webp", ".png": "image/png" }
export const img = (n, dir = RAW) => `data:${MIME[extname(n)]};base64,${readFileSync(join(dir, n)).toString("base64")}`
export const logo = `data:image/png;base64,${readFileSync(join(__dirname, "..", "..", "public", "icon-192.png")).toString("base64")}`
export const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Mansalva&family=Gochi+Hand&family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">`

export const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>')}")`

export const CSS = `
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1350px;overflow:hidden;position:relative;color:#fff;font-family:'Inter',sans-serif;background:#151515}
.dark{background:radial-gradient(75% 60% at 50% 45%,#2c2c2c 0%,#171717 70%,#0e0e0e 100%)}
.photo{position:absolute;inset:0;background-size:cover;background-position:center}
.veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.05) 35%,rgba(0,0,0,.1) 60%,rgba(0,0,0,.55))}
.grain{position:absolute;inset:0;background-image:${GRAIN};opacity:.22;mix-blend-mode:overlay;pointer-events:none;z-index:9}
.meta{position:absolute;left:56px;right:56px;display:flex;justify-content:space-between;font-size:21px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;line-height:1.25;z-index:5}
.meta.top{top:52px}.meta.bot{bottom:52px;align-items:flex-end}
.meta div:nth-child(2){text-align:center}.meta div:last-child{text-align:right}
.hand{font-family:'Mansalva',cursive;line-height:.9;-webkit-text-stroke:3px #fff;color:#fff}
.out{color:transparent;-webkit-text-stroke:5px #fff}
.caps{font-family:'Gochi Hand',cursive;text-transform:uppercase;line-height:.88}
.abs{position:absolute;z-index:4}
.center{left:0;right:0;text-align:center}
.body{font-size:30px;line-height:1.35;font-weight:500}
.rows{position:absolute;left:56px;right:56px;bottom:60px;z-index:5;font-size:23px;text-transform:uppercase;letter-spacing:.05em;font-weight:500}
.rows div{display:flex;justify-content:space-between;padding:10px 0;border-top:1px solid rgba(255,255,255,.35)}
.pill{border:2px solid #fff;border-radius:999px;padding:12px 28px;font-size:22px;font-weight:600;letter-spacing:.06em;text-transform:uppercase}
.sched{font-size:28px;line-height:1.3}
.sched div{display:grid;grid-template-columns:150px 1fr;gap:20px;padding:14px 0}
.sched b{font-weight:700}
table{border-collapse:collapse;font-size:30px;width:100%}
td,th{padding:18px 10px;border-bottom:1.5px solid rgba(255,255,255,.4);text-align:left}
th{font-size:22px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;opacity:.8}
td:last-child,th:last-child{text-align:right}
.lime{color:#c6f736;-webkit-text-stroke-color:#c6f736}
.out.lime{color:transparent}
.limebg{background:radial-gradient(80% 65% at 50% 45%,#d4ff4a 0%,#c6f736 60%,#a9d61f 100%);color:#0b0b0c}
.limebg .hand{color:#0b0b0c;-webkit-text-stroke-color:#0b0b0c}
.limebg .out{color:transparent;-webkit-text-stroke-color:#0b0b0c}
.limebg .caps{color:#0b0b0c}
.limebg .sched b{color:#0b0b0c}
.limebg .grain{mix-blend-mode:multiply;opacity:.18}
.pill.fill{background:#c6f736;border-color:#c6f736;color:#0b0b0c}
.sched b.t{color:#c6f736}
`

export const top = (a, b, c) => `<div class="meta top"><div>${a}</div><div>${b}</div><div>${c}</div></div>`
export const bot = (a, b, c) => `<div class="meta bot"><div>${a}</div><div>${b}</div><div>${c}</div></div>`
export const photo = (n, extra = "") => `<div class="photo" style="background-image:url(${img(n)});${extra}"></div><div class="veil"></div>`


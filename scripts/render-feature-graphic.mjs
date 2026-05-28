import { chromium } from "playwright"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { readFileSync } from "fs"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Embed logo as base64
const logoB64 = "data:image/png;base64," + readFileSync("/home/user/Sander/public/sander-logo.png").toString("base64")

const html = readFileSync(join(__dirname, "feature-graphic.html"), "utf8")
  .replaceAll("https://www.sanderbv.it/sander-logo.png", logoB64)

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
})
const page = await browser.newPage()
await page.setViewportSize({ width: 1024, height: 500 })
await page.setContent(html, { waitUntil: "networkidle" })
await page.waitForTimeout(800)

const out = join(__dirname, "store-screenshots", "feature-graphic-1024x500.png")
await page.screenshot({ path: out, fullPage: false })
await browser.close()
console.log("✓ Feature graphic salvata:", out)

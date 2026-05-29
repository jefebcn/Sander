import { chromium } from "playwright"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { readFileSync, readdirSync } from "fs"

const __dirname = dirname(fileURLToPath(import.meta.url))

const logoB64 =
  "data:image/png;base64," +
  readFileSync(join(__dirname, "..", "public", "sander-logo.png")).toString("base64")

const MOCKUPS_DIR = join(__dirname, "mockups")
const OUT_DIR = join(__dirname, "store-screenshots")

const files = readdirSync(MOCKUPS_DIR)
  .filter((f) => f.endsWith(".html"))
  .sort()

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--ignore-certificate-errors"],
})

const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2.77,
  colorScheme: "dark",
})

const page = await ctx.newPage()

for (const file of files) {
  const name = file.replace(".html", "")
  const raw = readFileSync(join(MOCKUPS_DIR, file), "utf8")
  const html = raw.replaceAll("LOGO_B64", logoB64)

  await page.setContent(html, { waitUntil: "networkidle" })
  await page.waitForTimeout(400)

  const out = join(OUT_DIR, `${name}.png`)
  await page.screenshot({ path: out, fullPage: false })
  console.log(`✓  ${name}.png`)
}

await browser.close()
console.log(`\nScreenshot salvati in: ${OUT_DIR}`)
console.log("Dimensione fisica: ~1080×2338 px")

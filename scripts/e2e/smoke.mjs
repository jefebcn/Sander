// E2E smoke test of the main flows (sign in, home, Scopri like, match, Coppie).
// Usage: BASE_URL=http://localhost:3000 node scripts/e2e/smoke.mjs
import assert from "node:assert/strict"
import { chromium } from "playwright"

const BASE = process.env.BASE_URL ?? "http://localhost:3000"
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {})
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
await ctx.addInitScript(() => {
  try {
    for (const [k, v] of [["cookie_consent", "accepted"], ["pwa_install_dismissed", "1"], ["sander_onboarded", "1"], ["sander_has_profile", "1"], ["sander_level_celebrated", "99"]]) localStorage.setItem(k, v)
  } catch {}
})
const page = await ctx.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(e.message))

async function step(name, fn) {
  process.stdout.write(`• ${name} … `)
  await fn()
  console.log("ok")
}

try {
  await step("sign in", async () => {
    await page.goto(`${BASE}/auth/signin`, { waitUntil: "networkidle" })
    await page.fill('input[type="email"]', "me@e2e.local")
    await page.fill('input[type="password"]', "sander123")
    await page.click('button[type="submit"]')
    await page.waitForURL((u) => !u.pathname.startsWith("/auth"), { timeout: 30_000 })
  })

  await step("home shows the HUD", async () => {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" })
    await page.getByRole("heading", { name: "Marco" }).waitFor({ timeout: 15_000 })
  })

  await step("Ti vogliono: accept the Ace, it's a match", async () => {
    await page.goto(`${BASE}/scopri/like`, { waitUntil: "networkidle" })
    await page.getByRole("button", { name: /Fai match/ }).click()
    await page.locator("#match-title").waitFor({ timeout: 15_000 })
    assert.match(await page.locator("#match-title").innerText(), /match/i)
  })

  await step("Scopri deck: like a prompt with a comment (someone new)", async () => {
    await page.goto(`${BASE}/scopri`, { waitUntil: "networkidle" })
    await page.getByRole("button", { name: /Metti like alla risposta/ }).first().click()
    await page.fill("#like-comment", "Ci stai sabato?")
    await page.getByRole("button", { name: /Manda like/ }).click()
    await page.getByText(/Like mandato/).waitFor({ timeout: 15_000 })
  })

  await step("Match list shows the new match", async () => {
    await page.goto(`${BASE}/scopri/match`, { waitUntil: "networkidle" })
    await page.getByText("Anna").first().waitFor({ timeout: 15_000 })
  })

  await step("Coppie screen loads", async () => {
    await page.goto(`${BASE}/scopri/coppie`, { waitUntil: "networkidle" })
    await page.getByRole("heading", { name: /Forma la tua coppia/ }).waitFor({ timeout: 15_000 })
  })

  assert.deepEqual(errors, [], `page errors: ${errors.join(" | ")}`)
  console.log("e2e smoke: all good")
} catch (e) {
  console.error("\ne2e smoke FAILED:", e.message)
  await page.screenshot({ path: "e2e-failure.png", fullPage: true }).catch(() => {})
  process.exitCode = 1
} finally {
  await browser.close()
}

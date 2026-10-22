// E2E smoke test of the main flows: sign in, home, "Rigiocheresti", Scopri like,
// match, "Libero oggi", contesting an absence (and the admin deciding), Coppie.
// The app must run with ADMIN_EMAILS=me@e2e.local for the admin step.
// Usage: BASE_URL=http://localhost:3000 node scripts/e2e/smoke.mjs
import assert from "node:assert/strict"
import { chromium } from "playwright"

const BASE = process.env.BASE_URL ?? "http://localhost:3000"
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {})
const errors = []

async function newPage({ android = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  await ctx.addInitScript(() => {
    try {
      for (const [k, v] of [["cookie_consent", "accepted"], ["pwa_install_dismissed", "1"], ["sander_onboarded", "1"], ["sander_has_profile", "1"], ["sander_level_celebrated", "99"], ["scopri-welcome-v1", "1"]]) localStorage.setItem(k, v)
    } catch {}
  })
  // What the Capacitor shell of the Android app injects before the page loads.
  if (android) await ctx.addInitScript(() => { window.Capacitor = { isNativePlatform: () => true, getPlatform: () => "android" } })
  const p = await ctx.newPage()
  p.on("pageerror", (e) => errors.push(e.message))
  p.on("dialog", (d) => d.accept())
  return p
}

async function signIn(p, email) {
  await p.goto(`${BASE}/auth/signin`, { waitUntil: "networkidle" })
  await p.fill('input[type="email"]', email)
  await p.fill('input[type="password"]', "sander123")
  await p.click('button[type="submit"]')
  await p.waitForURL((u) => !u.pathname.startsWith("/auth"), { timeout: 30_000 })
}

const page = await newPage()
let anna = page

async function step(name, fn) {
  process.stdout.write(`• ${name} … `)
  await fn()
  console.log("ok")
}

try {
  await step("sign in", () => signIn(page, "me@e2e.local"))

  await step("home shows the HUD", async () => {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" })
    await page.getByRole("heading", { name: "Marco" }).waitFor({ timeout: 15_000 })
  })

  await step("home: «Rigiocheresti con…» after yesterday's match", async () => {
    const yes = page.getByRole("button", { name: "Rigiocherei con Luca", exact: true })
    await yes.click()
    await yes.waitFor({ state: "detached", timeout: 15_000 })
    await page.getByRole("button", { name: "Rigiocherei con Anna", exact: true }).waitFor()
  })

  await step("Ti vogliono: accept the Ace, it's a match", async () => {
    await page.goto(`${BASE}/scopri/like`, { waitUntil: "networkidle" })
    await page.getByRole("button", { name: /Fai match/ }).click()
    await page.locator("#match-title").waitFor({ timeout: 15_000 })
    assert.match(await page.locator("#match-title").innerText(), /match/i)
  })

  await step("Scopri: «Libero oggi» in the evening", async () => {
    await page.goto(`${BASE}/scopri`, { waitUntil: "networkidle" })
    await page.getByRole("button", { name: "Sono libero oggi" }).click()
    await page.getByRole("button", { name: "Sera", exact: true }).click()
    await page.getByText(/Sei in cima ai mazzi di oggi/).waitFor({ timeout: 15_000 })
    await page.getByRole("button", { name: "Libero · sera" }).waitFor()
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

  await step("Presenze: contest the «non presentato» («Ero presente»)", async () => {
    await page.goto(`${BASE}/profile/presenze`, { waitUntil: "networkidle" })
    await page.getByText("Partita del giovedì", { exact: false }).waitFor({ timeout: 15_000 })
    await page.getByRole("button", { name: "Ero presente" }).click()
    await page.getByLabel("Cosa è successo").fill("C'ero, ho giocato in squadra con Luca")
    await page.getByRole("button", { name: "Invia" }).click()
    await page.getByText(/Contestata: non conta/).waitFor({ timeout: 15_000 })
  })

  await step("Admin: the contested absence shows up and gets cancelled", async () => {
    await page.goto(`${BASE}/admin/segnalazioni`, { waitUntil: "networkidle" })
    await page.getByText("«C'ero, ho giocato in squadra con Luca»").waitFor({ timeout: 15_000 })
    await page.getByRole("button", { name: "Annulla l'assenza" }).click()
    await page.getByText("Assenza annullata").waitFor({ timeout: 15_000 })
    await page.goto(`${BASE}/profile/presenze`, { waitUntil: "networkidle" })
    await page.getByText(/Nessuna assenza/).waitFor({ timeout: 15_000 })
  })

  await step("Coppie: invite Anna (the new match) to be a pair", async () => {
    await page.goto(`${BASE}/scopri/coppie`, { waitUntil: "networkidle" })
    await page.getByRole("heading", { name: /Forma la tua coppia/ }).waitFor({ timeout: 15_000 })
    await page.getByRole("button", { name: /^Anna/ }).click()
    await page.getByPlaceholder("Nome della coppia (facoltativo)").fill("Sabbia Rovente")
    await page.getByRole("button", { name: "Manda l'invito" }).click()
    await page.getByText(/Appena accetta, siete una coppia/).waitFor({ timeout: 15_000 })
  })

  await step("Coppie as Anna: accept, then challenge Luca & Sara", async () => {
    anna = await newPage()
    await signIn(anna, "anna@e2e.local")
    await anna.goto(`${BASE}/scopri/coppie`, { waitUntil: "networkidle" })
    await anna.getByRole("button", { name: "Accetta" }).click()
    await anna.getByText("Coppia formata!").waitFor({ timeout: 15_000 })
    await anna.getByText("Sabbia Rovente").first().waitFor({ timeout: 15_000 })
    await anna.getByRole("button", { name: /^Sfidali/ }).click()
    await anna.getByRole("button", { name: "Manda la sfida" }).click()
    await anna.getByText("Sfida mandata").waitFor({ timeout: 15_000 })
    await anna.getByRole("button", { name: "Classifica" }).click()
    await anna.getByText("Onda Lunga").first().waitFor()
  })

  await step("Chat after the match: write to Anna, she reads it and replies", async () => {
    await page.goto(`${BASE}/scopri/match`, { waitUntil: "networkidle" })
    await page.getByRole("link", { name: /Anna/ }).first().click()
    await page.waitForURL(/\/messaggi\//, { timeout: 15_000 })
    const thread = page.url()
    await page.getByPlaceholder("Scrivi un messaggio…").fill("Sabato al 26 alle 18?")
    await page.getByRole("button", { name: "Invia" }).click()
    await page.getByText("Sabato al 26 alle 18?").first().waitFor({ timeout: 10_000 })
    await anna.goto(thread, { waitUntil: "networkidle" })
    await anna.getByText("Sabato al 26 alle 18?").first().waitFor({ timeout: 10_000 })
    await anna.getByPlaceholder("Scrivi un messaggio…").fill("Ci sto, porto io la palla")
    await anna.getByRole("button", { name: "Invia" }).click()
    // The conversation polls: the reply shows up without reloading.
    await page.getByText("Ci sto, porto io la palla").first().waitFor({ timeout: 15_000 })
  })

  await step("Android app: nothing to buy inside (Google Play rules)", async () => {
    const app = await newPage({ android: true })
    await signIn(app, "me@e2e.local")
    await app.goto(`${BASE}/scopri/plus`, { waitUntil: "networkidle" })
    await app.getByText("Non disponibile nell'app.").waitFor({ timeout: 15_000 })
    assert.equal(await app.getByRole("button", { name: /Attiva SANDER\+/ }).count(), 0)
    await app.goto(`${BASE}/profile`, { waitUntil: "networkidle" })
    await app.getByRole("button", { name: /Ricarica/ }).click()
    await app.getByText(/Guadagna SC gratis/).waitFor({ timeout: 15_000 })
    assert.equal(await app.getByText(/PayPal o bonifico/).count(), 0)
    assert.equal(await app.getByText(/Pagamento sicuro con Stripe/).count(), 0)
  })

  assert.deepEqual(errors, [], `page errors: ${errors.join(" | ")}`)
  console.log("e2e smoke: all good")
} catch (e) {
  console.error("\ne2e smoke FAILED:", e.message)
  await page.screenshot({ path: "e2e-failure.png", fullPage: true }).catch(() => {})
  if (anna !== page) await anna.screenshot({ path: "e2e-failure-anna.png", fullPage: true }).catch(() => {})
  process.exitCode = 1
} finally {
  await browser.close()
}

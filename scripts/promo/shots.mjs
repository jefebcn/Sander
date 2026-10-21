/**
 * App screens for the promo video, from a local build with the demo profiles
 * (BASE, EMAIL, EMAIL2 = the person who answers the proposal).
 *   node scripts/promo/shots.mjs   → scripts/promo/shots/*.png (1170×2532)
 */
import { chromium } from "playwright"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
const OUT = join(dirname(fileURLToPath(import.meta.url)), "shots")
const BASE = process.env.BASE ?? "http://localhost:3000"
const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {})

async function session(email) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: "it-IT", timezoneId: "Europe/Rome" })
  await ctx.addInitScript(() => {
    for (const [k, v] of [["cookie_consent", "accepted"], ["pwa_install_dismissed", "1"], ["sander_onboarded", "1"], ["sander_has_profile", "1"], ["sander_level_celebrated", "99"], ["scopri-welcome-v1", "1"]]) localStorage.setItem(k, v)
  })
  const p = await ctx.newPage()
  p.setDefaultTimeout(30_000)
  await p.goto(`${BASE}/auth/signin`, { waitUntil: "domcontentloaded" })
  await p.fill('input[type="email"]', email)
  await p.fill('input[type="password"]', process.env.PASSWORD ?? "sander123")
  await p.keyboard.press("Enter")
  await p.waitForURL((u) => !u.pathname.startsWith("/auth"))
  return p
}
const shot = (p, name) => p.screenshot({ path: join(OUT, `${name}.png`) })
const settle = (p, ms = 1800) => p.waitForTimeout(ms)

const me = await session(process.env.EMAIL)
await me.goto(`${BASE}/scopri`, { waitUntil: "domcontentloaded" }); await settle(me, 3000)
await shot(me, "1-deck")
await me.getByRole("button", { name: /Metti like alla risposta/ }).first().click(); await settle(me, 800)
await me.fill("#like-comment", "Sabato al 26 ci sei? 🏐"); await settle(me, 500)
await shot(me, "2-like")
// The other person already liked back (seeded), so sending it is a match.
await me.getByRole("button", { name: /Manda like/ }).click(); await settle(me, 2500)
await shot(me, "3-match")
await me.getByRole("link", { name: /Proponi una partita/ }).click(); await settle(me, 3500)
await me.fill('input[type="datetime-local"]', process.env.WHEN ?? "2026-10-24T18:30")
await me.fill('input[placeholder="Es. Bagno 26"]', "Bagno 26")
await me.locator("select").first().selectOption("Rimini"); await settle(me, 500)
await shot(me, "4-proponi")
await me.getByRole("button", { name: /Invia la proposta/ }).click(); await settle(me, 3000)
const thread = me.url().split("?")[0]
await shot(me, "5-inviata")

const other = await session(process.env.EMAIL2)
await other.goto(thread, { waitUntil: "domcontentloaded" }); await settle(other, 3000)
await shot(other, "6-ci-sto")
await other.getByRole("button", { name: "Ci sto", exact: true }).click(); await settle(other, 3500)
await shot(other, "7-partita")
await b.close()

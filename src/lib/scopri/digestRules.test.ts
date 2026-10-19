import { describe, it, expect } from "vitest"
import { canNudge, newcomerMessage, inviteMessage, NEWCOMER_EVERY_H, turnNeedsReminder, dailyPickMessage } from "./digestRules"

describe("Scopri reminders", () => {
  const now = new Date("2026-10-19T08:00:00Z")
  it("waits between two reminders", () => {
    expect(canNudge(null, now, NEWCOMER_EVERY_H)).toBe(true)
    expect(canNudge(new Date(now.getTime() - 19 * 3600_000), now, NEWCOMER_EVERY_H)).toBe(false)
    expect(canNudge(new Date(now.getTime() - 21 * 3600_000), now, NEWCOMER_EVERY_H)).toBe(true)
  })
  it("speaks of one or many", () => {
    expect(newcomerMessage(1, "Rimini").title).toBe("Un nuovo giocatore a Rimini su Scopri")
    expect(newcomerMessage(3, "Rimini").title).toBe("3 nuovi giocatori a Rimini su Scopri")
    expect(inviteMessage(12, "Cervia").url).toBe("/onboarding/scopri")
  })
})

describe("tocca a te", () => {
  const now = new Date("2026-10-19T08:00:00Z")
  const old = new Date(now.getTime() - 25 * 3600_000)
  it("reminds once per unanswered message, after a day", () => {
    expect(turnNeedsReminder({ senderId: "you", createdAt: old }, "me", null, now)).toBe(true)
    expect(turnNeedsReminder({ senderId: "you", createdAt: old }, "me", new Date(now.getTime() - 3600_000), now)).toBe(false)
    expect(turnNeedsReminder({ senderId: "you", createdAt: now }, "me", null, now)).toBe(false)
    expect(turnNeedsReminder({ senderId: "me", createdAt: old }, "me", null, now)).toBe(false)
    expect(turnNeedsReminder(null, "me", null, now)).toBe(false)
  })
  it("names the pick and why", () => {
    expect(dailyPickMessage("Giulia", ["Muro + difesa", "Giocate a Rimini", "x"]).body).toBe("Muro + difesa · Giocate a Rimini")
  })
})

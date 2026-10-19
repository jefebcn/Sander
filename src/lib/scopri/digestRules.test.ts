import { describe, it, expect } from "vitest"
import { canNudge, newcomerMessage, inviteMessage, NEWCOMER_EVERY_H } from "./digestRules"

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

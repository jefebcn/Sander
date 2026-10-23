import { describe, it, expect } from "vitest"
import {
  FREE_LIKES_PER_DAY,
  plusEnd,
  extendPass,
  daysAtLikeLimit,
  nextLikeSource,
  likesLeft,
  nextAceSource,
  acesLeft,
  ageOn,
  missingSteps,
  meetsDealbreakers,
  mutuallyEligible,
  meetCompatible,
  showMeAccepts,
  swipeHides,
  chatTurn,
  waitingOnMe,
  likeMessage,
  SKIP_COOLDOWN_DAYS,
  type DealbreakerSide,
} from "./rules"

const side = (o: Partial<DealbreakerSide> = {}): DealbreakerSide => ({
  homeCity: "Rimini",
  gender: "Uomo",
  role: "BLOCKER",
  rating: 1500,
  prefCities: [],
  prefGender: null,
  prefRole: null,
  maxGap: 300,
  ...o,
})

describe("like allowance", () => {
  it("uses the free likes first, then the bought ones", () => {
    expect(nextLikeSource(0, 0)).toBe("free")
    expect(nextLikeSource(FREE_LIKES_PER_DAY - 1, 0)).toBe("free")
    expect(nextLikeSource(FREE_LIKES_PER_DAY, 3)).toBe("bonus")
    expect(nextLikeSource(FREE_LIKES_PER_DAY, 0)).toBeNull()
  })
  it("counts what is left", () => {
    expect(likesLeft(3, 2)).toEqual({ free: 5, bonus: 2, total: 7, unlimited: false })
    expect(likesLeft(12, -1)).toEqual({ free: 0, bonus: 0, total: 0, unlimited: false })
  })
  it("lets SANDER+ like without limit and send three Aces", () => {
    expect(nextLikeSource(50, 0, true)).toBe("free")
    expect(likesLeft(50, 0, true).unlimited).toBe(true)
    expect(nextAceSource(2, 0, true)).toBe("free")
    expect(nextAceSource(3, 0, true)).toBeNull()
    expect(acesLeft(1, 0, true)).toBe(2)
  })
  it("gives one free Ace a week", () => {
    expect(nextAceSource(0, 0)).toBe("free")
    expect(nextAceSource(1, 0)).toBeNull()
    expect(nextAceSource(1, 2)).toBe("bonus")
    expect(acesLeft(0, 2)).toBe(3)
  })
})

describe("age and readiness", () => {
  const now = new Date("2026-10-18T10:00:00Z")
  it("counts whole years on the Rome calendar", () => {
    expect(ageOn(new Date("2008-10-18T00:00:00Z"), now)).toBe(18)
    expect(ageOn(new Date("2008-10-19T00:00:00Z"), now)).toBe(17)
    expect(ageOn(new Date("1990-01-01T00:00:00Z"), now)).toBe(36)
  })
  it("lists every missing step", () => {
    expect(missingSteps({ photos: 0, hasAvatar: false, prompts: 1, birthDate: null, homeCity: null }, now)).toEqual([
      "photo",
      "prompts",
      "birthDate",
      "city",
    ])
  })
  it("lets the profile photo stand in for the first photo", () => {
    expect(missingSteps({ photos: 0, hasAvatar: true, prompts: 3, birthDate: new Date("1995-05-05"), homeCity: "Rimini" }, now)).toEqual([])
  })
  it("keeps minors out", () => {
    expect(missingSteps({ photos: 2, hasAvatar: false, prompts: 3, birthDate: new Date("2010-01-01"), homeCity: "Rimini" }, now)).toEqual(["adult"])
  })
})

describe("dealbreakers", () => {
  it("passes when nothing is set and levels are close", () => {
    expect(mutuallyEligible(side(), side({ rating: 1700 }))).toBe(true)
  })
  it("applies the rating gap", () => {
    expect(meetsDealbreakers(side({ maxGap: 100 }), side({ rating: 1650 }))).toBe(false)
  })
  it("applies comune, gender and role", () => {
    expect(meetsDealbreakers(side({ prefCities: ["Cervia"] }), side())).toBe(false)
    expect(meetsDealbreakers(side({ prefCities: ["Rimini"] }), side())).toBe(true)
    expect(meetsDealbreakers(side({ prefCities: ["Rimini"] }), side({ homeCity: null }))).toBe(false)
    expect(meetsDealbreakers(side({ prefGender: "Donna" }), side())).toBe(false)
    expect(meetsDealbreakers(side({ prefRole: "DEFENDER" }), side())).toBe(false)
  })
  it("works both ways: one side's dealbreaker hides both", () => {
    const a = side()
    const b = side({ prefGender: "Donna" })
    expect(meetsDealbreakers(a, b)).toBe(true)
    expect(mutuallyEligible(a, b)).toBe(false)
  })
})

describe("aperto a conoscersi", () => {
  const him = (o: Partial<DealbreakerSide> = {}) => side({ gender: "Uomo", openToMeet: true, showMe: "DONNE", ...o })
  const her = (o: Partial<DealbreakerSide> = {}) => side({ gender: "Donna", openToMeet: true, showMe: "UOMINI", ...o })

  it("matches who would like to meet each other", () => {
    expect(meetCompatible(him(), her())).toBe(true)
    expect(meetCompatible(her({ showMe: "TUTTI" }), him())).toBe(true)
    expect(meetCompatible(her({ showMe: "DONNE" }), her({ showMe: "DONNE" }))).toBe(true)
  })
  it("needs both open: one-sided interest stays invisible", () => {
    expect(meetCompatible(him(), her({ openToMeet: false }))).toBe(false)
    expect(meetCompatible(him({ openToMeet: false }), her())).toBe(false)
  })
  it("needs each to fit the other's mostrami", () => {
    expect(meetCompatible(him({ showMe: "UOMINI" }), her())).toBe(false)
    expect(meetCompatible(him(), her({ showMe: "DONNE" }))).toBe(false)
  })
  it("only 'tutti' accepts someone without a stated gender", () => {
    expect(showMeAccepts("TUTTI", null)).toBe(true)
    expect(showMeAccepts("DONNE", null)).toBe(false)
    expect(showMeAccepts(null, "Donna")).toBe(false)
  })
  it("'solo chi è aperto' hides everyone else, both ways", () => {
    expect(mutuallyEligible(him({ meetOnly: true }), her())).toBe(true)
    expect(mutuallyEligible(him({ meetOnly: true }), side({ gender: "Donna" }))).toBe(false)
    expect(mutuallyEligible(side({ gender: "Donna" }), him({ meetOnly: true }))).toBe(false)
    expect(mutuallyEligible(him(), side({ gender: "Donna" }))).toBe(true)
  })
})

describe("swipes and turns", () => {
  const now = new Date("2026-10-18T10:00:00Z")
  it("keeps likes hidden for good and skips for a while", () => {
    const old = new Date(now.getTime() - (SKIP_COOLDOWN_DAYS + 1) * 86_400_000)
    expect(swipeHides({ liked: true, createdAt: old }, now)).toBe(true)
    expect(swipeHides({ liked: false, createdAt: old }, now)).toBe(false)
    expect(swipeHides({ liked: false, createdAt: now }, now)).toBe(true)
  })
  it("knows whose turn it is", () => {
    expect(chatTurn(null, "me")).toBe("nuovo")
    expect(chatTurn("me", "me")).toBe("in-attesa")
    expect(chatTurn("you", "me")).toBe("tocca-a-te")
    expect(waitingOnMe(["nuovo", "tocca-a-te", "in-attesa"])).toBe(2)
  })
})

describe("likeMessage", () => {
  it("says what was liked", () => {
    expect(likeMessage("PROMPT", "Il mio colpo migliore è… la diagonale", "Anche la mia!")).toBe(
      "Sul tuo «Il mio colpo migliore è… la diagonale»: Anche la mia!",
    )
    expect(likeMessage("PHOTO", "https://x/y.jpg", " Che tuffo ")).toBe("Sulla tua foto: Che tuffo")
    expect(likeMessage("PROFILE", null, "Ciao")).toBe("Ciao")
  })
  it("adds nothing without a comment", () => {
    expect(likeMessage("PROMPT", "x", "   ")).toBeNull()
    expect(likeMessage("PHOTO", null, null)).toBeNull()
  })
  it("shortens long prompts", () => {
    const msg = likeMessage("PROMPT", "a".repeat(200), "ok") as string
    expect(msg.length).toBeLessThan(110)
    expect(msg).toContain("…")
  })
})

describe("SANDER+ pass", () => {
  const now = new Date("2026-10-23T10:00:00Z")
  const later = new Date("2026-11-10T10:00:00Z")
  it("ends at the later of subscription and pass", () => {
    expect(plusEnd({ plusUntil: now, plusPassUntil: later })).toEqual(later)
    expect(plusEnd({ plusUntil: later, plusPassUntil: now })).toEqual(later)
    expect(plusEnd({ plusUntil: null, plusPassUntil: later })).toEqual(later)
    expect(plusEnd({ plusUntil: later })).toEqual(later)
    expect(plusEnd(null)).toBeNull()
  })
  it("adds a week from now, or after a pass still running", () => {
    expect(extendPass(null, now)).toEqual(new Date("2026-10-30T10:00:00Z"))
    expect(extendPass(new Date("2026-10-20T10:00:00Z"), now)).toEqual(new Date("2026-10-30T10:00:00Z"))
    expect(extendPass(new Date("2026-10-25T10:00:00Z"), now)).toEqual(new Date("2026-11-01T10:00:00Z"))
  })
})

describe("daysAtLikeLimit", () => {
  it("counts Rome days on which the free likes ran out", () => {
    const day = (iso: string, n: number) => Array.from({ length: n }, () => new Date(iso))
    const likes = [
      ...day("2026-10-20T10:00:00Z", FREE_LIKES_PER_DAY),
      ...day("2026-10-21T10:00:00Z", FREE_LIKES_PER_DAY - 1),
      // 23:30 UTC on the 21st is already the 22nd in Rome.
      ...day("2026-10-21T23:30:00Z", FREE_LIKES_PER_DAY + 2),
    ]
    expect(daysAtLikeLimit(likes)).toBe(2)
  })
})

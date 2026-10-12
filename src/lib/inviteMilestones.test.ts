import { describe, it, expect } from "vitest"
import { nextInviteMilestone, earnedInviteMilestones } from "./inviteMilestones"

describe("invite milestones", () => {
  it("starts from the first badge", () => {
    expect(nextInviteMilestone(0)).toEqual({ at: 1, title: "Primo invito", prevAt: 0 })
    expect(earnedInviteMilestones(0)).toEqual([])
  })

  it("tracks the current step between badges", () => {
    expect(nextInviteMilestone(1)).toMatchObject({ at: 3, prevAt: 1 })
    expect(nextInviteMilestone(4)).toMatchObject({ at: 5, prevAt: 3 })
    expect(earnedInviteMilestones(4).map((m) => m.title)).toEqual(["Primo invito", "Ambassador"])
  })

  it("returns null once every badge is earned", () => {
    expect(nextInviteMilestone(10)).toBeNull()
    expect(nextInviteMilestone(42)).toBeNull()
    expect(earnedInviteMilestones(42)).toHaveLength(4)
  })
})

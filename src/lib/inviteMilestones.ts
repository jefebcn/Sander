/* ────────────────────────────────────────────────────────────────────────── */
/*  Invite milestones — recognition for bringing people in.                    */
/*                                                                             */
/*  Purely cosmetic on purpose: every friend already earns SanderCredits on    */
/*  both sides (lib/referral.ts). Badges add a visible goal without adding a    */
/*  cost per invite, so they can't be farmed for money.                         */
/* ────────────────────────────────────────────────────────────────────────── */

export interface InviteMilestone {
  at: number
  title: string
}

export const INVITE_MILESTONES: InviteMilestone[] = [
  { at: 1, title: "Primo invito" },
  { at: 3, title: "Ambassador" },
  { at: 5, title: "Capitano" },
  { at: 10, title: "Leggenda della Riviera" },
]

/** The next badge to unlock, with where the current step started; null when all are earned. */
export function nextInviteMilestone(invited: number): (InviteMilestone & { prevAt: number }) | null {
  let prevAt = 0
  for (const m of INVITE_MILESTONES) {
    if (invited < m.at) return { ...m, prevAt }
    prevAt = m.at
  }
  return null
}

/** Badges already earned, in order. */
export function earnedInviteMilestones(invited: number): InviteMilestone[] {
  return INVITE_MILESTONES.filter((m) => invited >= m.at)
}

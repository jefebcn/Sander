/** Referral rewards (SanderCredits + XP). Shared by server actions and UI. */
export const INVITER_SC = 30
export const INVITEE_SC = 20
export const INVITER_XP = 50

/** Personal invite code derived from the player id, e.g. "ABCD-EFGH". */
export function buildPromoCode(id: string): string {
  const clean = id.replace(/[^a-z0-9]/gi, "").toUpperCase()
  return `${clean.slice(2, 6)}-${clean.slice(6, 10)}`
}

const INVITE_CODE_RE = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/

/** Accept an invite code from a URL only if it has the right shape. */
export function cleanInviteCode(raw: string | null | undefined): string | null {
  const code = raw?.trim().toUpperCase()
  return code && INVITE_CODE_RE.test(code) ? code : null
}

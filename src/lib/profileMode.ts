/* ────────────────────────────────────────────────────────────────────────── */
/*  Profile mode: a club's staff use SANDER either as themselves (their card)  */
/*  or as the club (its dashboard). The choice is a plain cookie holding the   */
/*  club's slug: it is only a preference, every page re-checks the membership. */
/*  Not httpOnly, so the navbar can say "Club" instead of "Profilo".           */
/* ────────────────────────────────────────────────────────────────────────── */

export const PROFILE_MODE_COOKIE = "sander_mode"

/** Fired on window after a switch, so client components re-read the cookie. */
export const PROFILE_MODE_EVENT = "sander:mode"

/** Same shape as lib/club.ts clubSlug(): lowercase letters, digits, dashes. */
export const CLUB_SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/

/** The club slug stored in the cookie, or null for "myself". */
export function parseProfileMode(raw: string | null | undefined): string | null {
  return raw && CLUB_SLUG_RE.test(raw) ? raw : null
}

/** Reads the mode from a document.cookie string (client side). */
export function profileModeFromCookieString(cookie: string): string | null {
  const hit = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${PROFILE_MODE_COOKIE}=`))
  return parseProfileMode(hit ? decodeURIComponent(hit.slice(PROFILE_MODE_COOKIE.length + 1)) : null)
}

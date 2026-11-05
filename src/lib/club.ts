/* ────────────────────────────────────────────────────────────────────────── */
/*  Clubs (pure rules, no DB). A club — a university sports centre, a bagno,  */
/*  an association — runs its own tournaments on SANDER: players stay in its  */
/*  circle, everything stays organised in one place. See lib/clubAccess.ts.   */
/* ────────────────────────────────────────────────────────────────────────── */

/** URL name of a club page (/c/<slug>): "CUS Torino – Beach" → "cus-torino-beach". */
export function clubSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "")
}

/** A free slug: the base, else base-2, base-3… given the taken ones. */
export function freeSlug(base: string, taken: string[]): string {
  const root = base || "club"
  if (!taken.includes(root)) return root
  for (let i = 2; ; i++) if (!taken.includes(`${root}-${i}`)) return `${root}-${i}`
}

/** "@custorino", "instagram.com/custorino/" or a full URL → "custorino". */
export function instagramHandle(raw: string | null | undefined): string | null {
  if (!raw) return null
  const m = raw.trim().match(/^(?:https?:\/\/)?(?:www\.)?(?:instagram\.com\/)?@?([A-Za-z0-9._]{1,30})\/?$/)
  return m ? m[1] : null
}

/** Club tournaments are paid at the court (cash, Satispay): SANDER doesn't collect for clubs. */
export const ON_SITE = "ON_SITE"

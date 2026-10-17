import { db } from "@/lib/db"

/** Emails are stored and compared lower-case: "Mario@x.it" and "mario@x.it" are one person. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Case-insensitive lookup. The unique index on users.email is case-sensitive,
 * and older rows may have been saved with capitals, so an exact match would let
 * "ADMIN@x.it" register next to "admin@x.it" and inherit its admin rights.
 * The oldest row wins if legacy duplicates exist.
 */
export function findUserByEmail(email: string) {
  return db.user.findFirst({
    where: { email: { equals: normalizeEmail(email), mode: "insensitive" } },
    orderBy: { id: "asc" },
  })
}

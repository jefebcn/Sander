/**
 * Returns true if the given email is in the ADMIN_EMAILS env var.
 * ADMIN_EMAILS can be a single email or a comma-separated list.
 * Falls back to ADMIN_EMAIL for backwards compatibility.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const raw = process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? ""
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase())
}

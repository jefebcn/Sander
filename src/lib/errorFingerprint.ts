import { createHash } from "crypto"

/** Same error, same place → same row. Ids and numbers are blanked so
 *  "match abc123 not found" and "match def456 not found" group together. */
export function errorFingerprint(r: { source: string; message: string; path?: string | null }): string {
  const message = r.message.replace(/[0-9a-f]{8,}|\d+/gi, "#")
  const path = (r.path ?? "").split("?")[0].replace(/\/[^/]*\d[^/]*/g, "/#")
  return createHash("sha1").update(`${r.source}|${message}|${path}`).digest("hex")
}

import { createHmac } from "node:crypto"
import { SOCIAL } from "@/lib/contact"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Club verification: the club proves it is really theirs by sending a code   */
/*  in DM to SANDER's Instagram from the club's own Instagram account. The     */
/*  code is derived from the club's id with the server secret, so it needs no  */
/*  column, never changes for a request and can't be guessed from outside.     */
/* ────────────────────────────────────────────────────────────────────────── */

/** No 0/O, 1/I/L: the code is read on a phone and typed into Instagram. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

export function clubVerifyCode(clubId: string, secret: string = process.env.AUTH_SECRET ?? "sander-dev"): string {
  const digest = createHmac("sha256", secret).update(`club-verify:${clubId}`).digest()
  let code = ""
  for (let i = 0; i < 6; i++) code += ALPHABET[digest[i] % ALPHABET.length]
  return `SANDER-${code}`
}

/** SANDER's Instagram handle, where clubs send the code. */
export const SANDER_INSTAGRAM = SOCIAL.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "")

/** Opens a DM to SANDER on Instagram (app on the phone, web otherwise). */
export const SANDER_INSTAGRAM_DM = `https://ig.me/m/${SANDER_INSTAGRAM}`

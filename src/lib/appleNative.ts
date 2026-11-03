import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose"
import { db } from "@/lib/db"
import { findUserByEmail, normalizeEmail } from "@/lib/userByEmail"

/* ────────────────────────────────────────────────────────────────────────── */
/*  "Continua con Apple" inside the iOS app.                                   */
/*                                                                             */
/*  Apple requires it in any app that offers Google (App Review 4.8). The app  */
/*  signs in natively (@capgo/capacitor-social-login) and hands us Apple's      */
/*  identity token. We check it against Apple's keys and our bundle id, then    */
/*  find the user the same way as googleNative.ts: by the Apple account, else   */
/*  by the verified email (linking it), else a new user.                        */
/* ────────────────────────────────────────────────────────────────────────── */

const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"))

interface AppleClaims extends JWTPayload {
  email?: string
  // Apple sends these as booleans or as the strings "true" / "false".
  email_verified?: boolean | string
}

export async function verifyAppleIdToken(idToken: string): Promise<{ sub: string; email: string | null }> {
  const { payload } = await jwtVerify<AppleClaims>(idToken, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience: process.env.APPLE_BUNDLE_ID ?? "com.sanderbv.app",
  })
  if (!payload.sub) throw new Error("Apple token without a subject")
  const verified = payload.email_verified === true || payload.email_verified === "true"
  return { sub: payload.sub, email: payload.email && verified ? payload.email : null }
}

/** The user for a verified Apple identity token. `name` comes from the app (first sign-in only). */
export async function userFromAppleIdToken(idToken: string, name: string | null) {
  const claims = await verifyAppleIdToken(idToken)
  const linked = await db.account.findUnique({
    where: { provider_providerAccountId: { provider: "apple", providerAccountId: claims.sub } },
    select: { user: true },
  })
  if (linked) return linked.user
  // A brand-new Apple account must come with an email (Apple always sends it the first time).
  if (!claims.email) throw new Error("Apple account without a verified email")

  const existing = await findUserByEmail(claims.email)
  if (existing) {
    await db.account.create({
      data: { userId: existing.id, type: "oidc", provider: "apple", providerAccountId: claims.sub },
    })
    // Same rule as Google: an unverified password account may belong to someone else.
    if (!existing.emailVerified) {
      return db.user.update({
        where: { id: existing.id },
        data: { emailVerified: new Date(), ...(existing.password ? { password: null } : {}) },
      })
    }
    return existing
  }

  return db.user.create({
    data: {
      email: normalizeEmail(claims.email),
      name,
      emailVerified: new Date(),
      accounts: { create: { type: "oidc", provider: "apple", providerAccountId: claims.sub } },
    },
  })
}

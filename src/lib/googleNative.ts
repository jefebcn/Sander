import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose"
import { db } from "@/lib/db"
import { findUserByEmail, normalizeEmail } from "@/lib/userByEmail"

/* ────────────────────────────────────────────────────────────────────────── */
/*  "Continua con Google" inside the Android app.                              */
/*                                                                             */
/*  Google refuses OAuth inside a web view, so the app signs in natively       */
/*  (Credential Manager, @capgo/capacitor-social-login) and hands us the ID     */
/*  token. We check it against Google's keys and our Web client id, then find  */
/*  the same user the web Google login would: by the Google account, else by    */
/*  the verified email (linking it), else a new user.                          */
/* ────────────────────────────────────────────────────────────────────────── */

const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"))

interface GoogleClaims extends JWTPayload {
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleClaims & { sub: string; email: string }> {
  const audience = process.env.AUTH_GOOGLE_ID
  if (!audience) throw new Error("AUTH_GOOGLE_ID missing")
  const { payload } = await jwtVerify<GoogleClaims>(idToken, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience,
  })
  if (!payload.sub || !payload.email || payload.email_verified !== true) throw new Error("Google account without a verified email")
  return payload as GoogleClaims & { sub: string; email: string }
}

/** The user for a verified Google ID token, linked exactly like the web OAuth login. */
export async function userFromGoogleIdToken(idToken: string) {
  const claims = await verifyGoogleIdToken(idToken)
  const linked = await db.account.findUnique({
    where: { provider_providerAccountId: { provider: "google", providerAccountId: claims.sub } },
    select: { user: true },
  })
  if (linked) return linked.user

  const existing = await findUserByEmail(claims.email)
  if (existing) {
    await db.account.create({
      data: { userId: existing.id, type: "oidc", provider: "google", providerAccountId: claims.sub },
    })
    // Same rule as the web login (auth.ts linkAccount): an unverified password
    // account may have been registered by someone else, so its password goes.
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
      name: claims.name ?? null,
      image: claims.picture ?? null,
      emailVerified: new Date(),
      accounts: { create: { type: "oidc", provider: "google", providerAccountId: claims.sub } },
    },
  })
}

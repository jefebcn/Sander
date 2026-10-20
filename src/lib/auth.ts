import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { findUserByEmail } from "@/lib/userByEmail"
import { userFromGoogleIdToken } from "@/lib/googleNative"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          const user = await findUserByEmail(credentials.email as string)
          if (!user?.password) return null
          const ok = await bcrypt.compare(
            credentials.password as string,
            user.password,
          )
          return ok ? user : null
        } catch {
          return null
        }
      },
    }),
    // Google from inside the Android app: the native sign-in hands over an ID token.
    Credentials({
      id: "google-native",
      name: "Google (app)",
      credentials: { idToken: { label: "ID token", type: "text" } },
      async authorize(credentials) {
        if (typeof credentials?.idToken !== "string" || credentials.idToken.length > 4096) return null
        try {
          return await userFromGoogleIdToken(credentials.idToken)
        } catch (e) {
          console.error("google-native sign-in refused", e instanceof Error ? e.message : e)
          return null
        }
      },
    }),
  ],
  pages: { signIn: "/auth/signin", error: "/auth/error" },
  events: {
    // Google proves the address belongs to whoever signs in. If an email+password
    // account with that address was never verified, it may have been registered
    // by someone else in advance: drop that password so only the real owner keeps
    // access (they can set a new one with "password dimenticata").
    async linkAccount({ user, account }) {
      if (account.provider !== "google" || !user.id) return
      const row = await db.user.findUnique({
        where: { id: user.id },
        select: { emailVerified: true, password: true },
      })
      if (!row || row.emailVerified) return
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date(), ...(row.password ? { password: null } : {}) },
      })
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) token.id = user.id
      // For Google sign-in, persist the user id from the DB
      if (account?.provider === "google" && user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      try {
        if (new URL(url).origin === baseUrl) return url
      } catch {}
      return baseUrl
    },
  },
})

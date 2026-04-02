"use server"

import bcrypt from "bcryptjs"
import crypto from "crypto"
import { db } from "@/lib/db"
import { RegisterSchema, ForgotPasswordSchema, ResetPasswordSchema } from "@/lib/validators/auth.schema"
import { sendPasswordResetEmail } from "@/lib/email"

type ActionResult = { success: true } | { error: string }

// ── Registration ─────────────────────────────────────────────────────────────

export async function registerWithEmail(input: unknown): Promise<ActionResult> {
  try {
    const { email, password } = RegisterSchema.parse(input)

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return { error: "Email già in uso. Prova ad accedere." }
    }

    const hashed = await bcrypt.hash(password, 12)
    await db.user.create({ data: { email, password: hashed } })

    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Errore durante la registrazione"
    if (msg.includes("invalid") || msg.includes("min")) {
      return { error: "Email o password non validi (min. 8 caratteri)" }
    }
    return { error: msg }
  }
}

// ── Forgot password ───────────────────────────────────────────────────────────
// Always returns success to avoid email enumeration.

export async function requestPasswordReset(input: unknown): Promise<ActionResult> {
  try {
    const { email } = ForgotPasswordSchema.parse(input)

    const user = await db.user.findUnique({ where: { email } })

    // If user exists AND has a password (not OAuth-only) → send the email
    if (user?.password) {
      // Delete any previous reset tokens for this email
      await db.verificationToken.deleteMany({
        where: { identifier: `reset:${email}` },
      })

      const token = crypto.randomBytes(32).toString("hex")
      const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await db.verificationToken.create({
        data: { identifier: `reset:${email}`, token, expires },
      })

      await sendPasswordResetEmail(email, token)
    }

    // Always succeed — don't reveal whether the email exists
    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Errore"
    if (msg.includes("invalid") || msg.includes("Email")) {
      return { error: "Inserisci un indirizzo email valido" }
    }
    return { error: "Errore nell'invio. Riprova tra qualche istante." }
  }
}

// ── Reset password ────────────────────────────────────────────────────────────

export async function resetPassword(input: unknown): Promise<ActionResult> {
  try {
    const { token, password } = ResetPasswordSchema.parse(input)

    const record = await db.verificationToken.findUnique({ where: { token } })

    if (!record || !record.identifier.startsWith("reset:")) {
      return { error: "Link non valido o già utilizzato." }
    }

    if (record.expires < new Date()) {
      await db.verificationToken.delete({ where: { token } })
      return { error: "Il link è scaduto. Richiedine uno nuovo." }
    }

    const email = record.identifier.replace("reset:", "")
    const user = await db.user.findUnique({ where: { email } })

    if (!user) {
      return { error: "Account non trovato." }
    }

    const hashed = await bcrypt.hash(password, 12)

    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { password: hashed } }),
      db.verificationToken.delete({ where: { token } }),
    ])

    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Errore"
    if (msg.includes("min")) {
      return { error: "La password deve essere di almeno 8 caratteri" }
    }
    return { error: "Errore durante il reset. Riprova." }
  }
}

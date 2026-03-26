"use server"

import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { RegisterSchema } from "@/lib/validators/auth.schema"

type RegisterResult =
  | { success: true }
  | { error: string }

export async function registerWithEmail(input: unknown): Promise<RegisterResult> {
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
    // Zod parse error
    if (msg.includes("invalid") || msg.includes("min")) {
      return { error: "Email o password non validi (min. 8 caratteri)" }
    }
    return { error: msg }
  }
}

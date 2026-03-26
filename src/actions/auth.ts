"use server"

import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { RegisterSchema } from "@/lib/validators/auth.schema"

export async function registerWithEmail(input: unknown) {
  const { email, password } = RegisterSchema.parse(input)

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) throw new Error("Email già in uso")

  const hashed = await bcrypt.hash(password, 12)

  await db.user.create({
    data: { email, password: hashed },
  })

  return { success: true }
}

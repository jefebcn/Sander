"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { PROFILE_MODE_COOKIE } from "@/lib/profileMode"
import { ProfileModeSchema } from "@/lib/validators/club.schema"

type Result = { ok: true } | { ok: false; error: string }

/** "Usa SANDER come": yourself, or a club you run (approved clubs only). */
export async function switchProfileMode(input: unknown): Promise<Result> {
  const parsed = ProfileModeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" }
  const me = await getCurrentPlayer()
  if (!me) return { ok: false, error: "Accedi di nuovo" }

  const store = await cookies()
  const { clubSlug } = parsed.data
  if (!clubSlug) {
    store.delete(PROFILE_MODE_COOKIE)
  } else {
    const member = await db.clubMember.findFirst({
      where: { playerId: me.id, club: { slug: clubSlug, status: "APPROVED" } },
      select: { id: true },
    })
    if (!member) return { ok: false, error: "Non fai parte dello staff di questo club" }
    store.set(PROFILE_MODE_COOKIE, clubSlug, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365, secure: process.env.NODE_ENV === "production" })
  }
  revalidatePath("/profile")
  return { ok: true }
}

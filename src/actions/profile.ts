"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { SaveProfileSchema } from "@/lib/validators/profile.schema"
import { INVITEE_SC } from "@/lib/referral"
import { revalidatePath } from "next/cache"

export async function saveProfile(input: unknown) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Non autenticato")

  const data = SaveProfileSchema.parse(input)

  // Surname is optional now, so don't glue a trailing space onto the name.
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ")

  // Only write the optional fields that were actually filled in, so editing the
  // profile later without re-entering them doesn't wipe what's already stored.
  const optional = {
    ...(data.lastName ? { lastName: data.lastName } : {}),
    ...(data.birthDate ? { birthDate: new Date(data.birthDate) } : {}),
    ...(data.gender ? { gender: data.gender } : {}),
    ...(data.nationality ? { nationality: data.nationality } : {}),
  }

  const existing = await db.player.findUnique({
    where: { userId: session.user.id },
  })

  if (existing) {
    await db.player.update({
      where: { id: existing.id },
      data: {
        name:          fullName,
        firstName:     data.firstName,
        preferredRole: data.preferredRole,
        ...optional,
        avatarUrl:     data.avatarUrl ?? existing.avatarUrl,
      },
    })
  } else {
    // Was this user invited by someone? Grant a welcome SanderCredits bonus.
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { invitedByPlayerId: true },
    })
    const invited = Boolean(user?.invitedByPlayerId)

    await db.player.create({
      data: {
        name:          fullName,
        firstName:     data.firstName,
        preferredRole: data.preferredRole,
        ...optional,
        avatarUrl:     data.avatarUrl ?? null,
        userId:        session.user.id,
        sanderCredits: invited ? INVITEE_SC : 0,
      },
    })
  }

  revalidatePath("/")
  revalidatePath("/sessions")
  revalidatePath("/players")
}

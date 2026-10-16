"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { SaveProfileSchema, NudgePrefSchema } from "@/lib/validators/profile.schema"
import { canSeedRating, startingRating } from "@/lib/startLevel"
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
    ...(data.homeCity ? { homeCity: data.homeCity } : {}),
    ...(data.startLevel ? { startLevel: data.startLevel } : {}),
  }

  const existing = await db.player.findUnique({
    where: { userId: session.user.id },
  })

  if (existing) {
    // The declared level may set the rating only before any rated game.
    const ratedGames = data.startLevel
      ? await db.ratingHistory.count({ where: { playerId: existing.id } })
      : 0
    const seed =
      data.startLevel && canSeedRating({ ...existing, ratedGames })
        ? { glickoRating: startingRating(data.startLevel) }
        : {}

    await db.player.update({
      where: { id: existing.id },
      data: {
        name:          fullName,
        firstName:     data.firstName,
        preferredRole: data.preferredRole,
        ...optional,
        ...seed,
        avatarUrl:     data.avatarUrl ?? existing.avatarUrl,
      },
    })
  } else {
    await db.player.create({
      data: {
        name:          fullName,
        firstName:     data.firstName,
        preferredRole: data.preferredRole,
        ...optional,
        ...(data.startLevel ? { glickoRating: startingRating(data.startLevel) } : {}),
        avatarUrl:     data.avatarUrl ?? null,
        userId:        session.user.id,
      },
    })
  }

  revalidatePath("/")
  revalidatePath("/profile")
  revalidatePath("/sessions")
  revalidatePath("/players")
}

/** Turn "manca un giocatore" pushes on or off for the signed-in player. */
export async function setNudgesOptOut(input: unknown) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Non autenticato")
  const { optOut } = NudgePrefSchema.parse(input)
  await db.player.update({ where: { userId: session.user.id }, data: { nudgesOptOut: optOut } })
  revalidatePath("/profile")
}

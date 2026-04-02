"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { SaveProfileSchema } from "@/lib/validators/profile.schema"
import { revalidatePath } from "next/cache"

export async function saveProfile(input: unknown) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Non autenticato")

  const data = SaveProfileSchema.parse(input)

  const fullName = `${data.firstName} ${data.lastName}`

  const existing = await db.player.findUnique({
    where: { userId: session.user.id },
  })

  if (existing) {
    await db.player.update({
      where: { id: existing.id },
      data: {
        name:        fullName,
        firstName:   data.firstName,
        lastName:    data.lastName,
        birthDate:   new Date(data.birthDate),
        gender:      data.gender,
        nationality: data.nationality,
        avatarUrl:   data.avatarUrl ?? existing.avatarUrl,
      },
    })
  } else {
    await db.player.create({
      data: {
        name:        fullName,
        firstName:   data.firstName,
        lastName:    data.lastName,
        birthDate:   new Date(data.birthDate),
        gender:      data.gender,
        nationality: data.nationality,
        avatarUrl:   data.avatarUrl ?? null,
        userId:      session.user.id,
      },
    })
  }

  revalidatePath("/")
  revalidatePath("/sessions")
  revalidatePath("/players")
}

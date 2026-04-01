export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ProfileSetupForm } from "@/components/onboarding/ProfileSetupForm"

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/onboarding/profile")
  }

  const existing = await db.player.findUnique({
    where: { userId: session.user.id },
    select: {
      firstName:   true,
      lastName:    true,
      birthDate:   true,
      gender:      true,
      nationality: true,
      avatarUrl:   true,
    },
  })

  const initialData = existing
    ? {
        firstName:   existing.firstName ?? "",
        lastName:    existing.lastName  ?? "",
        birthDate:   existing.birthDate
          ? existing.birthDate.toISOString().slice(0, 10)
          : "",
        gender:      (existing.gender ?? "") as string,
        nationality: existing.nationality ?? "",
        avatarUrl:   existing.avatarUrl  ?? null,
      }
    : undefined

  return <ProfileSetupForm initialData={initialData} />
}

export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { db } from "@/lib/db"
import { ageOn, MIN_AGE } from "@/lib/scopri/rules"
import { loadCardRow, readiness } from "@/lib/scopri/server"
import { ScopriQuickStart } from "@/components/onboarding/ScopriQuickStart"

export const metadata: Metadata = { title: "Trova con chi giocare — SANDER" }

/** Optional last step of sign-up: a one-minute Scopri profile. */
export default async function OnboardingScopriPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect("/auth/signin?callbackUrl=/onboarding/scopri")
  // Minors and players already on Scopri skip this step.
  if (player.birthDate && ageOn(player.birthDate) < MIN_AGE) redirect("/")
  const row = await loadCardRow(player.id)
  if (row && readiness(row).length === 0) redirect("/scopri")
  await db.discoverProfile.upsert({ where: { playerId: player.id }, create: { playerId: player.id }, update: {} })

  return (
    <ScopriQuickStart
      firstName={player.firstName?.trim() || player.name.split(" ")[0]}
      avatarUrl={player.avatarUrl}
      hasBirthDate={!!player.birthDate}
      hasPhotos={(row?.discoverPhotos.length ?? 0) > 0}
    />
  )
}

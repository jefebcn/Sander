"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { refreshFipavAthlete } from "@/lib/fipav/sync"
import { FipavAlertSchema, FipavLinkSchema } from "@/lib/validators/fipav.schema"

/** Turns the "new FIPAV events in <region>" push on or off. */
export async function toggleFipavAlert(form: FormData): Promise<void> {
  const { region } = FipavAlertSchema.parse(Object.fromEntries(form))
  const me = await getCurrentPlayer()
  if (!me) redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/tournaments/fipav?regione=${region}`)}`)
  // Only regions FIPAV actually uses, so the table can't fill with junk.
  const known = await db.fipavEvent.findFirst({ where: { region }, select: { code: true } })
  if (!known) return
  const existing = await db.fipavAlert.findUnique({ where: { playerId_region: { playerId: me.id, region } } })
  if (existing) await db.fipavAlert.delete({ where: { id: existing.id } })
  else await db.fipavAlert.create({ data: { playerId: me.id, region } })
  revalidatePath("/tournaments/fipav")
}

/** "Sono io": the player says which athlete of the FIPAV senior ranking they are. */
export async function linkFipavProfile(form: FormData): Promise<void> {
  const { personId } = FipavLinkSchema.parse(Object.fromEntries(form))
  const me = await getCurrentPlayer()
  if (!me) redirect("/auth/signin?callbackUrl=/fipav/collega")
  const athlete = await db.fipavRanking.findFirst({ where: { personId }, select: { personId: true } })
  if (!athlete) return
  await db.player.update({
    where: { id: me.id },
    data: { fipavPersonId: personId, fipavResults: [], fipavResultsAt: null },
  })
  await refreshFipavAthlete(me.id, personId, true).catch(() => {})
  revalidatePath("/profile")
  revalidatePath("/fipav")
  redirect("/profile?tab=carta#fipav")
}

export async function unlinkFipavProfile(): Promise<void> {
  const me = await getCurrentPlayer()
  if (!me) redirect("/auth/signin?callbackUrl=/fipav/collega")
  await db.player.update({
    where: { id: me.id },
    data: { fipavPersonId: null, fipavResults: [], fipavResultsAt: null },
  })
  revalidatePath("/profile")
  revalidatePath("/fipav")
}

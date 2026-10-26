"use server"

import { revalidatePath } from "next/cache"
import { del } from "@vercel/blob"
import { db } from "@/lib/db"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { notify } from "@/lib/scopri/server"
import {
  AdminPhotoSchema,
  AdminSuspendSchema,
  AdminPlayerSchema,
  AdminReportSchema,
  AdminAbsenceSchema,
  AdminSelfieSchema,
} from "@/lib/validators/scopri.schema"

/* Admin moderation for Scopri. Every action checks the caller is an admin. */

async function requireAdmin() {
  const session = await getCurrentSession()
  if (!isAdminEmail(session?.user?.email)) throw new Error("Non autorizzato")
}

function refresh() {
  revalidatePath("/admin/segnalazioni")
  revalidatePath("/scopri")
}

/** Remove a photo from Scopri (kept for the record, never shown again). */
export async function adminHidePhoto(input: unknown) {
  await requireAdmin()
  const { photoId } = AdminPhotoSchema.parse(input)
  const photo = await db.playerPhoto.update({ where: { id: photoId }, data: { hiddenAt: new Date() }, select: { playerId: true } })
  await notify([photo.playerId], {
    title: "Una tua foto è stata tolta da Scopri",
    body: "Non rispettava le regole della community. Puoi caricarne un'altra dal profilo Scopri.",
    url: "/scopri/profilo",
  })
  refresh()
  return { ok: true as const }
}

/** A reported photo checked and fine. */
export async function adminKeepPhoto(input: unknown) {
  await requireAdmin()
  const { photoId } = AdminPhotoSchema.parse(input)
  await db.playerPhoto.update({ where: { id: photoId }, data: { reportedAt: null } })
  refresh()
  return { ok: true as const }
}

/** Take someone off Scopri: out of every deck, pending likes closed. Matches and chats stay. */
export async function adminSuspend(input: unknown) {
  await requireAdmin()
  const { playerId, reason } = AdminSuspendSchema.parse(input)
  await db.discoverProfile.upsert({
    where: { playerId },
    create: { playerId, suspendedAt: new Date(), suspendedReason: reason },
    update: { suspendedAt: new Date(), suspendedReason: reason },
  })
  // Pending likes, sent or received, would still turn into matches.
  await db.playerSwipe.updateMany({
    where: { liked: true, status: "PENDING", OR: [{ fromId: playerId }, { toId: playerId }] },
    data: { status: "DECLINED", respondedAt: new Date() },
  })
  await notify([playerId], {
    title: "Il tuo profilo Scopri è sospeso",
    body: "Abbiamo ricevuto segnalazioni sul tuo profilo. Per chiarimenti rispondi alla mail di SANDER.",
    url: "/scopri",
  })
  refresh()
  return { ok: true as const }
}

export async function adminUnsuspend(input: unknown) {
  await requireAdmin()
  const { playerId } = AdminPlayerSchema.parse(input)
  await db.discoverProfile.update({ where: { playerId }, data: { suspendedAt: null, suspendedReason: null } })
  refresh()
  return { ok: true as const }
}

/** Close a report once handled (the block between the two players stays). */
export async function adminCloseReport(input: unknown) {
  await requireAdmin()
  const { reportId } = AdminReportSchema.parse(input)
  await db.playerBlock.update({ where: { id: reportId }, data: { reviewedAt: new Date() } })
  refresh()
  return { ok: true as const }
}

/** Decide on a contested absence: keep it (it counts again) or cancel it. */
export async function adminResolveAbsence(input: unknown) {
  await requireAdmin()
  const { eventId, keep } = AdminAbsenceSchema.parse(input)
  const ev = await db.attendanceEvent.findUnique({ where: { id: eventId }, select: { playerId: true, disputedAt: true } })
  if (!ev?.disputedAt) throw new Error("Contestazione non trovata")
  if (keep) await db.attendanceEvent.update({ where: { id: eventId }, data: { resolvedAt: new Date() } })
  else await db.attendanceEvent.delete({ where: { id: eventId } })
  await notify([ev.playerId], {
    title: keep ? "Assenza confermata" : "Assenza annullata",
    body: keep ? "Dopo la verifica l'assenza resta nelle tue presenze." : "Avevi ragione: l'assenza è stata tolta dalle tue presenze.",
    url: "/profile/presenze",
  })
  refresh()
  revalidatePath("/profile/presenze")
  return { ok: true as const }
}

/** Decide a selfie check: the badge on approval, then the selfie is deleted either way. */
export async function adminReviewSelfie(input: unknown) {
  await requireAdmin()
  const { checkId, approve } = AdminSelfieSchema.parse(input)
  const check = await db.selfieCheck.findUnique({ where: { id: checkId }, select: { playerId: true, imageUrl: true, status: true } })
  if (!check || check.status !== "PENDING") throw new Error("Verifica già decisa")
  const now = new Date()
  await db.$transaction([
    db.selfieCheck.update({
      where: { id: checkId },
      data: { status: approve ? "APPROVED" : "REJECTED", reviewedAt: now, imageUrl: null },
    }),
    ...(approve
      ? [db.discoverProfile.update({ where: { playerId: check.playerId }, data: { photoVerifiedAt: now } })]
      : []),
  ])
  if (check.imageUrl) await del(check.imageUrl).catch((e) => console.error("selfie delete failed", e))
  await notify([check.playerId], approve
    ? { title: "Foto verificata ✓", body: "Sul tuo profilo Scopri ora c'è il badge «Foto verificata».", url: "/scopri/profilo" }
    : { title: "Verifica non riuscita", body: "Il selfie non corrispondeva alle foto o al gesto richiesto. Puoi riprovare dal profilo Scopri.", url: "/scopri/profilo" })
  refresh()
  return { ok: true as const }
}

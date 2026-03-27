"use server"

import { revalidatePath } from "next/cache"
import { put, del } from "@vercel/blob"
import { db } from "@/lib/db"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { notifyPlayer } from "@/lib/push"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ""

async function requireAdmin() {
  const session = await getCurrentSession()
  if (!session?.user?.id) throw new Error("Non autenticato")
  if (!ADMIN_EMAIL || session.user.email !== ADMIN_EMAIL) throw new Error("Non autorizzato")
  return session
}

/** Upload a video — called from the client via FormData */
export async function uploadVideo(formData: FormData) {
  const session = await getCurrentSession()
  if (!session?.user?.id) throw new Error("Non autenticato")

  const player = await getCurrentPlayer()
  if (!player) throw new Error("Profilo non trovato")

  const file = formData.get("video") as File
  if (!file || file.size === 0) throw new Error("Nessun file selezionato")
  if (file.size > 100 * 1024 * 1024) throw new Error("Il video non può superare 100MB")
  if (!file.type.startsWith("video/")) throw new Error("Formato non supportato")

  // Upload to Vercel Blob
  const blob = await put(`videos/${player.id}-${Date.now()}.mp4`, file, {
    access: "public",
  })

  // Save submission in DB as PENDING
  await db.videoSubmission.create({
    data: { playerId: player.id, blobUrl: blob.url },
  })

  // Notify admin via push
  const adminPlayer = await db.player.findFirst({
    where: { user: { email: ADMIN_EMAIL } },
    select: { id: true },
  })
  if (adminPlayer) {
    await notifyPlayer(adminPlayer.id, {
      title: "Nuovo video in attesa",
      body: `${player.name} ha caricato un video — revisiona dal profilo`,
      url: "/profile",
    })
  }

  revalidatePath("/")
  return { ok: true }
}

/** Admin: approve a video submission */
export async function approveVideo(id: string) {
  await requireAdmin()

  const sub = await db.videoSubmission.update({
    where: { id },
    data: { status: "APPROVED", reviewedAt: new Date() },
    include: { player: { select: { id: true, name: true } } },
  })

  await notifyPlayer(sub.playerId, {
    title: "Il tuo video è stato pubblicato! 🎉",
    body: "Il tuo video di beach volley è ora visibile nella community",
    url: "/",
  })

  revalidatePath("/")
  revalidatePath("/profile")
}

/** Admin: reject a video submission */
export async function rejectVideo(id: string, note?: string) {
  await requireAdmin()

  const sub = await db.videoSubmission.update({
    where: { id },
    data: { status: "REJECTED", note: note ?? null, reviewedAt: new Date() },
  })

  await notifyPlayer(sub.playerId, {
    title: "Video non approvato",
    body: note ?? "Il tuo video non rispetta le linee guida della community",
    url: "/",
  })

  revalidatePath("/")
  revalidatePath("/profile")
}

/** Admin: list all pending submissions */
export async function getPendingVideos() {
  await requireAdmin()
  return db.videoSubmission.findMany({
    where: { status: "PENDING" },
    include: { player: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  })
}

/** Public: list approved videos for the carousel */
export async function getApprovedVideos() {
  return db.videoSubmission.findMany({
    where: { status: "APPROVED" },
    include: { player: { select: { name: true, avatarUrl: true } } },
    orderBy: { reviewedAt: "desc" },
    take: 20,
  })
}

/** Admin: delete any submission + its blob */
export async function deleteVideo(id: string) {
  await requireAdmin()
  const sub = await db.videoSubmission.findUniqueOrThrow({ where: { id } })
  await del(sub.blobUrl)
  await db.videoSubmission.delete({ where: { id } })
  revalidatePath("/")
  revalidatePath("/profile")
}

/** Admin: list approved videos */
export async function getApprovedVideosFull() {
  await requireAdmin()
  return db.videoSubmission.findMany({
    where: { status: "APPROVED" },
    include: { player: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { reviewedAt: "desc" },
  })
}

/** User: list own video submissions */
export async function getMyVideos() {
  const player = await getCurrentPlayer()
  if (!player) return []
  return db.videoSubmission.findMany({
    where: { playerId: player.id },
    orderBy: { createdAt: "desc" },
  })
}

/** User: delete own video */
export async function deleteOwnVideo(id: string) {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")

  const sub = await db.videoSubmission.findUniqueOrThrow({ where: { id } })
  if (sub.playerId !== player.id) throw new Error("Non autorizzato")

  await del(sub.blobUrl)
  await db.videoSubmission.delete({ where: { id } })
  revalidatePath("/profile")
  revalidatePath("/")
}

"use server"

import { db } from "@/lib/db"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { getWeeklyRecap } from "@/actions/recap"
import { weeklyDraft, communityDraft, tournamentDraft, type ContentDraft } from "@/lib/content/templates"
import { revalidatePath } from "next/cache"

const DAY = 24 * 60 * 60 * 1000

async function requireAdmin() {
  const session = await getCurrentSession()
  if (!isAdminEmail(session?.user?.email)) throw new Error("Non autorizzato")
}

async function existsRecent(kind: string, sinceDays: number): Promise<boolean> {
  const since = new Date(Date.now() - sinceDays * DAY)
  const found = await db.contentPost.findFirst({
    where: { kind, createdAt: { gte: since } },
    select: { id: true },
  })
  return Boolean(found)
}

async function create(draft: ContentDraft): Promise<void> {
  await db.contentPost.create({
    data: {
      kind: draft.kind,
      title: draft.title,
      caption: draft.caption,
      hashtags: draft.hashtags,
      imagePath: draft.imagePath,
      status: "READY",
    },
  })
}

/**
 * Generate ready-to-post content from whatever material exists right now.
 * Idempotent-ish: avoids piling up duplicates via recency windows.
 * Returns how many new posts were queued.
 */
export async function generateContent(): Promise<number> {
  let created = 0

  // 1) Weekly leaderboard — at most once every 6 days, only if there was play
  if (!(await existsRecent("weekly", 6))) {
    const recap = await getWeeklyRecap()
    if (recap.activePlayers > 0) {
      await create(
        weeklyDraft({
          playerOfWeek: recap.playerOfWeek?.name ?? null,
          ratingDelta: recap.playerOfWeek?.ratingDelta ?? 0,
          totalEvents: recap.totalEvents,
        }),
      )
      created++
    }
  }

  // 2) Community numbers — at most once every 10 days
  if (!(await existsRecent("community", 10))) {
    const [players, matches] = await Promise.all([
      db.player.count(),
      db.session.count({ where: { status: "COMPLETED" } }),
    ])
    if (players > 0) {
      await create(communityDraft({ players, matches }))
      created++
    }
  }

  // 3) Upcoming tournaments open for registration — one post each, once
  const upcoming = await db.tournament.findMany({
    where: {
      status: "DRAFT",
      isOpenForRegistration: true,
      date: { gte: new Date() },
    },
    select: { id: true, name: true, date: true, location: true },
    take: 5,
  })
  for (const t of upcoming) {
    const already = await db.contentPost.findFirst({
      where: { kind: "tournament", imagePath: { contains: t.id } },
      select: { id: true },
    })
    if (already) continue
    await create(
      tournamentDraft({
        id: t.id,
        name: t.name,
        dateLabel: new Date(t.date).toLocaleDateString("it-IT", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        location: t.location,
      }),
    )
    created++
  }

  if (created > 0) {
    revalidatePath("/profile")
  }
  return created
}

export interface ContentItem {
  id: string
  kind: string
  title: string
  caption: string
  hashtags: string
  imagePath: string
  status: string
  createdAt: string
}

export async function listContent(): Promise<ContentItem[]> {
  const rows = await db.contentPost.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 40,
  })
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    caption: r.caption,
    hashtags: r.hashtags,
    imagePath: r.imagePath,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }))
}

export async function markPublished(id: string): Promise<void> {
  await requireAdmin()
  await db.contentPost.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  })
  revalidatePath("/profile")
}

export async function skipContent(id: string): Promise<void> {
  await requireAdmin()
  await db.contentPost.update({ where: { id }, data: { status: "SKIPPED" } })
  revalidatePath("/profile")
}

/** Admin can trigger a generation pass manually from the queue. */
export async function generateContentNow(): Promise<number> {
  await requireAdmin()
  return generateContent()
}

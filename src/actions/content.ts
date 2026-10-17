"use server"

import { db } from "@/lib/db"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { generateContent } from "@/lib/content/generate"
import { revalidatePath } from "next/cache"

async function requireAdmin() {
  const session = await getCurrentSession()
  if (!isAdminEmail(session?.user?.email)) throw new Error("Non autorizzato")
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
  await requireAdmin()
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

"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { recompressBatch } from "@/lib/recompressPhotos"

/* /admin/sistema: error log housekeeping and the old-photos clean-up. */

async function requireAdmin() {
  const session = await getCurrentSession()
  if (!isAdminEmail(session?.user?.email)) throw new Error("Non autorizzato")
}

const OffsetSchema = z.number().int().min(0)
const ErrorIdSchema = z.string().min(1).max(40)

/** One batch of the photo clean-up; the page calls it until nextOffset is null. */
export async function adminRecompressPhotos(offset: unknown) {
  await requireAdmin()
  return recompressBatch(OffsetSchema.parse(offset))
}

/** Mark an error as dealt with: it disappears until it happens again. */
export async function adminDismissError(id: unknown) {
  await requireAdmin()
  await db.appError.delete({ where: { id: ErrorIdSchema.parse(id) } })
  revalidatePath("/admin/sistema")
}

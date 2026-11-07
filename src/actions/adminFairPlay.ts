"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { LEADERBOARDS_TAG } from "@/lib/cacheTags"
import { voidSessionResults } from "@/lib/sessionScore"
import { notifyPlayer } from "@/lib/push"

/* /admin/sospetti: fair-play tools. Admin only, every input validated. */

type Result = { ok: true; message: string } | { ok: false; error: string }

async function isAdmin() {
  const session = await getCurrentSession()
  return isAdminEmail(session?.user?.email)
}

const IdSchema = z.string().trim().min(1).max(64)
const ExcludeSchema = z.object({ playerId: IdSchema, excluded: z.boolean() })

/** Leave a player out of every leaderboard, or let them back in. They are told either way. */
export async function adminSetRankingExcluded(input: unknown): Promise<Result> {
  try {
    if (!(await isAdmin())) return { ok: false, error: "Non autorizzato" }
    const { playerId, excluded } = ExcludeSchema.parse(input)
    const p = await db.player.update({ where: { id: playerId }, data: { rankingExcluded: excluded }, select: { name: true } })
    await notifyPlayer(playerId, excluded
      ? { title: "Sei fuori dalle classifiche", body: "Abbiamo notato risultati non regolari. Se pensi sia un errore scrivici: ricontrolliamo.", url: "/profile" }
      : { title: "Sei di nuovo in classifica", body: "Abbiamo ricontrollato: le tue partite tornano a contare.", url: "/players" },
    ).catch(() => {})
    revalidatePath("/admin/sospetti")
    revalidatePath("/players")
    revalidateTag(LEADERBOARDS_TAG, { expire: 0 })
    return { ok: true, message: excluded ? `${p.name} è fuori dalle classifiche` : `${p.name} è di nuovo in classifica` }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Errore" }
  }
}

/** Take back a session's W/L and rating moves for everyone in it. */
export async function adminVoidSession(input: unknown): Promise<Result> {
  try {
    if (!(await isAdmin())) return { ok: false, error: "Non autorizzato" }
    const sessionId = IdSchema.parse(input)
    const r = await voidSessionResults(sessionId)
    if (!r.ok) return r
    revalidatePath("/admin/sospetti")
    return { ok: true, message: r.players > 0 ? `Annullata: corretti ${r.players} giocatori` : "Annullata (non aveva mosso la classifica)" }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Errore" }
  }
}

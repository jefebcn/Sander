"use server"

import { db } from "@/lib/db"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { revalidatePath } from "next/cache"

export type ReactionTargetType = "match" | "session" | "tournament"

export interface ReactionState {
  count: number
  reacted: boolean
}

/** Toggle the current player's kudos on a feed item. Returns the new state. */
export async function toggleReaction(
  targetType: ReactionTargetType,
  targetId: string,
): Promise<ReactionState> {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")

  const existing = await db.reaction.findUnique({
    where: {
      playerId_targetType_targetId: { playerId: player.id, targetType, targetId },
    },
  })

  if (existing) {
    await db.reaction.delete({ where: { id: existing.id } })
  } else {
    await db.reaction.create({ data: { playerId: player.id, targetType, targetId } })
  }

  const count = await db.reaction.count({ where: { targetType, targetId } })
  revalidatePath("/feed")
  return { count, reacted: !existing }
}

/** Batch reaction summary for a set of feed targets (counts + my-reacted flag). */
export async function getReactionSummary(
  targets: { type: ReactionTargetType; id: string }[],
): Promise<Record<string, ReactionState>> {
  const out: Record<string, ReactionState> = {}
  if (targets.length === 0) return out

  const player = await getCurrentPlayer()
  const ids = targets.map((t) => t.id)

  const rows = await db.reaction.findMany({
    where: { targetId: { in: ids } },
    select: { targetType: true, targetId: true, playerId: true },
  })

  for (const t of targets) {
    const key = `${t.type}:${t.id}`
    const forTarget = rows.filter((r) => r.targetType === t.type && r.targetId === t.id)
    out[key] = {
      count: forTarget.length,
      reacted: player ? forTarget.some((r) => r.playerId === player.id) : false,
    }
  }
  return out
}

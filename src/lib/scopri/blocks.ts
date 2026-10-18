import { db } from "@/lib/db"

/* Blocks work both ways: whoever blocked whom, the two never meet again. */

/** Everyone `playerId` blocked or was blocked by. */
export async function blockedWith(playerId: string): Promise<Set<string>> {
  const rows = await db.playerBlock.findMany({
    where: { OR: [{ blockerId: playerId }, { blockedId: playerId }] },
    select: { blockerId: true, blockedId: true },
  })
  return new Set(rows.map((r) => (r.blockerId === playerId ? r.blockedId : r.blockerId)))
}

export async function isBlockedPair(a: string, b: string): Promise<boolean> {
  const row = await db.playerBlock.findFirst({
    where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] },
    select: { id: true },
  })
  return !!row
}

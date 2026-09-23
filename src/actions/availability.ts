"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { SetAvailabilitySchema, type AvailabilitySlotValue } from "@/lib/validators/availability.schema"
import { getDivision, type Division } from "@/lib/divisions"

/* ────────────────────────────────────────────────────────────────────────── */
/*  "Sono libero" — weekly availability board.                                 */
/*                                                                             */
/*  A match used to exist only if somebody created one, so anyone who didn't    */
/*  already know other players had nothing to join. Here players declare when   */
/*  they are usually free, and see who at their level shares those slots.       */
/* ────────────────────────────────────────────────────────────────────────── */

/** Same rating band as the matchmaking page, so the two agree on "at my level". */
const BAND = 150

export interface AvailabilityPeer {
  id: string
  name: string
  avatarUrl: string | null
  rating: number
  division: Division
  role: "BLOCKER" | "DEFENDER"
  /** Blocker + defender: the pairing that actually works on sand. */
  complementary: boolean
}

export interface AvailabilityGroup {
  weekday: number
  slot: AvailabilitySlotValue
  peers: AvailabilityPeer[]
}

export async function getMyAvailability(): Promise<{ weekday: number; slot: AvailabilitySlotValue }[]> {
  const me = await getCurrentPlayer()
  if (!me) return []
  const rows = await db.playerAvailability.findMany({
    where: { playerId: me.id },
    select: { weekday: true, slot: true },
    orderBy: [{ weekday: "asc" }, { slot: "asc" }],
  })
  return rows.map((r) => ({ weekday: r.weekday, slot: r.slot as AvailabilitySlotValue }))
}

/** Replace the whole grid: simpler and idempotent compared to diffing. */
export async function setMyAvailability(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const me = await getCurrentPlayer()
  if (!me) return { ok: false, error: "Non autenticato" }

  const parsed = SetAvailabilitySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Disponibilità non valida" }

  // Deduplicate: the unique constraint would otherwise reject the whole batch.
  const unique = new Map(parsed.data.slots.map((s) => [`${s.weekday}-${s.slot}`, s]))

  await db.$transaction([
    db.playerAvailability.deleteMany({ where: { playerId: me.id } }),
    db.playerAvailability.createMany({
      data: [...unique.values()].map((s) => ({
        playerId: me.id,
        weekday: s.weekday,
        slot: s.slot,
      })),
    }),
  ])

  revalidatePath("/trova")
  revalidatePath("/profile")
  return { ok: true }
}

/**
 * Players at my level who are free in the same slots I am, grouped by slot.
 * Starts from the availability table (indexed on weekday+slot) rather than
 * scanning every player, so the rating filter runs on an already narrow set.
 */
export async function getAvailabilityMatches(): Promise<AvailabilityGroup[]> {
  const me = await getCurrentPlayer()
  if (!me) return []

  const mine = await db.playerAvailability.findMany({
    where: { playerId: me.id },
    select: { weekday: true, slot: true },
  })
  if (mine.length === 0) return []

  const rows = await db.playerAvailability.findMany({
    where: {
      playerId: { not: me.id },
      OR: mine.map((s) => ({ weekday: s.weekday, slot: s.slot })),
    },
    select: {
      weekday: true,
      slot: true,
      player: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          glickoRating: true,
          preferredRole: true,
        },
      },
    },
  })

  const groups = new Map<string, AvailabilityGroup>()

  for (const row of rows) {
    const diff = Math.abs(row.player.glickoRating - me.glickoRating)
    if (diff > BAND) continue

    const key = `${row.weekday}-${row.slot}`
    if (!groups.has(key)) {
      groups.set(key, {
        weekday: row.weekday,
        slot: row.slot as AvailabilitySlotValue,
        peers: [],
      })
    }
    groups.get(key)!.peers.push({
      id: row.player.id,
      name: row.player.name,
      avatarUrl: row.player.avatarUrl,
      rating: Math.round(row.player.glickoRating),
      division: getDivision(row.player.glickoRating),
      role: row.player.preferredRole,
      complementary: row.player.preferredRole !== me.preferredRole,
    })
  }

  // Closest level first inside each slot, then the week in order.
  const SLOT_ORDER: AvailabilitySlotValue[] = ["MORNING", "AFTERNOON", "EVENING"]
  return [...groups.values()]
    .map((g) => ({
      ...g,
      peers: g.peers
        .sort(
          (a, b) =>
            Number(b.complementary) - Number(a.complementary) ||
            Math.abs(a.rating - me.glickoRating) - Math.abs(b.rating - me.glickoRating),
        )
        .slice(0, 12),
    }))
    .sort(
      (a, b) =>
        a.weekday - b.weekday || SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot),
    )
}

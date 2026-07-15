"use server"

import { db } from "@/lib/db"
import { getDivision, type Division } from "@/lib/divisions"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Matchmaking — find players at your level (opponents) or complementary       */
/*  partners. Playtomic's core moat, mapped onto SANDER's Glicko rating +       */
/*  beach-volley roles (a blocker pairs best with a defender).                  */
/* ────────────────────────────────────────────────────────────────────────── */

export type MatchMode = "partner" | "opponent"

export interface MatchCandidate {
  id: string
  name: string
  avatarUrl: string | null
  rating: number
  division: Division
  role: "BLOCKER" | "DEFENDER"
  ratingDiff: number
  compatibility: number // 0–100
}

export interface MatchmakingResult {
  me: { rating: number; division: Division; role: "BLOCKER" | "DEFENDER" } | null
  band: number
  candidates: MatchCandidate[]
}

const DEFAULT_BAND = 150

export async function getPlayersAtMyLevel(
  playerId: string,
  mode: MatchMode = "partner",
  band = DEFAULT_BAND,
): Promise<MatchmakingResult> {
  const me = await db.player.findUniqueOrThrow({
    where: { id: playerId },
    select: { glickoRating: true, preferredRole: true },
  })

  const others = await db.player.findMany({
    where: { id: { not: playerId } },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      glickoRating: true,
      preferredRole: true,
    },
  })

  const myRating = me.glickoRating
  const myRole = me.preferredRole

  const candidates: MatchCandidate[] = others
    .map((p) => {
      const ratingDiff = Math.abs(p.glickoRating - myRating)
      // Level closeness: 100 at identical rating, 0 at the band edge.
      const closeness = Math.max(0, Math.round((1 - ratingDiff / band) * 100))
      // Partner mode rewards complementary roles (blocker + defender).
      const complementary = p.preferredRole !== myRole
      const compatibility =
        mode === "partner"
          ? Math.min(100, closeness + (complementary ? 12 : 0))
          : closeness
      return {
        id: p.id,
        name: p.name,
        avatarUrl: p.avatarUrl,
        rating: Math.round(p.glickoRating),
        division: getDivision(p.glickoRating),
        role: p.preferredRole,
        ratingDiff: Math.round(ratingDiff),
        compatibility,
      }
    })
    .filter((c) => c.ratingDiff <= band)
    .sort((a, b) => b.compatibility - a.compatibility || a.ratingDiff - b.ratingDiff)

  return {
    me: { rating: Math.round(myRating), division: getDivision(myRating), role: myRole },
    band,
    candidates: candidates.slice(0, 30),
  }
}

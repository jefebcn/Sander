"use server"

import { db } from "@/lib/db"
import { z } from "zod"
import { getDivision, type Division } from "@/lib/divisions"
import { NOT_DELETED_PLAYER } from "@/lib/publicPlayer"
import { ratedGames, isProvisional } from "@/lib/rankingEligibility"
import { compatibilityScore, type MatchMode } from "@/lib/matchmakingScore"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Matchmaking — find players at your level (opponents) or complementary       */
/*  partners. Playtomic's core moat, mapped onto SANDER's Glicko rating +       */
/*  beach-volley roles (a blocker pairs best with a defender).                  */
/* ────────────────────────────────────────────────────────────────────────── */

export type { MatchMode } from "@/lib/matchmakingScore"

export interface MatchCandidate {
  id: string
  name: string
  avatarUrl: string | null
  rating: number
  division: Division
  role: "BLOCKER" | "DEFENDER"
  ratingDiff: number
  compatibility: number // 0–100
  /** Decided games behind the rating. */
  games: number
  /** Fewer than 5 games: the rating is still a first estimate. */
  provisional: boolean
}

export interface MatchmakingResult {
  me: { rating: number; division: Division; role: "BLOCKER" | "DEFENDER" } | null
  band: number
  candidates: MatchCandidate[]
}

const DEFAULT_BAND = 150

const MatchmakingInputSchema = z.object({
  playerId: z.string().trim().min(1).max(64),
  mode: z.enum(["partner", "opponent"]),
  band: z.number().int().min(25).max(1000),
})

export async function getPlayersAtMyLevel(
  playerId: string,
  mode: MatchMode = "partner",
  band = DEFAULT_BAND,
): Promise<MatchmakingResult> {
  const input = MatchmakingInputSchema.parse({ playerId, mode, band })

  const me = await db.player.findUniqueOrThrow({
    where: { id: input.playerId },
    select: { glickoRating: true, preferredRole: true },
  })

  const others = await db.player.findMany({
    where: { id: { not: input.playerId }, ...NOT_DELETED_PLAYER },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      glickoRating: true,
      preferredRole: true,
      matchesWon: true,
      matchesLost: true,
    },
  })

  const myRating = me.glickoRating
  const myRole = me.preferredRole

  const candidates: MatchCandidate[] = others
    .map((p) => {
      const ratingDiff = Math.abs(p.glickoRating - myRating)
      const games = ratedGames(p)
      // Level closeness + (for partners) complementary role, scaled down while
      // the candidate's rating rests on few games: see lib/matchmakingScore.
      const compatibility = compatibilityScore({
        mode: input.mode,
        band: input.band,
        myRating,
        myRole,
        rating: p.glickoRating,
        role: p.preferredRole,
        games,
      })
      return {
        id: p.id,
        name: p.name,
        avatarUrl: p.avatarUrl,
        rating: Math.round(p.glickoRating),
        division: getDivision(p.glickoRating),
        role: p.preferredRole,
        ratingDiff: Math.round(ratingDiff),
        compatibility,
        games,
        provisional: isProvisional(games) || games === 0,
      }
    })
    .filter((c) => c.ratingDiff <= input.band)
    .sort((a, b) => b.compatibility - a.compatibility || a.ratingDiff - b.ratingDiff)

  return {
    me: { rating: Math.round(myRating), division: getDivision(myRating), role: myRole },
    band: input.band,
    candidates: candidates.slice(0, 30),
  }
}

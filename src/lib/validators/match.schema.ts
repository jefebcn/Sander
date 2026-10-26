import { z } from "zod"

// A tournament match always has a winner: a tie would hand it to team B.
export const SubmitScoreSchema = z
  .object({
    matchId: z.string().min(1),
    teamAScore: z.number().int().min(0).max(99),
    teamBScore: z.number().int().min(0).max(99),
  })
  .refine((s) => s.teamAScore !== s.teamBScore, { message: "Il punteggio non può essere in parità", path: ["teamBScore"] })

export type SubmitScoreInput = z.infer<typeof SubmitScoreSchema>

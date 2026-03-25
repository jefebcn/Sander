import { z } from "zod"

export const SubmitScoreSchema = z.object({
  matchId: z.string().min(1),
  teamAScore: z.number().int().min(0).max(99),
  teamBScore: z.number().int().min(0).max(99),
})

export type SubmitScoreInput = z.infer<typeof SubmitScoreSchema>

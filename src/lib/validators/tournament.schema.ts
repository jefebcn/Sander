import { z } from "zod"

export const CreateTournamentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  date: z.coerce.date(),
  type: z.enum(["KING_OF_THE_BEACH", "BRACKETS", "ROUND_ROBIN"]),
  playerIds: z
    .array(z.string().min(1))
    .min(4, "At least 4 players required")
    .max(32, "Maximum 32 players"),
  kotbRounds: z.number().int().min(1).max(30).optional(),
  numCourts: z.number().int().min(1).max(4).optional(),
})

export const UpdateTournamentSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  date: z.coerce.date().optional(),
})

export type CreateTournamentInput = z.infer<typeof CreateTournamentSchema>
export type UpdateTournamentInput = z.infer<typeof UpdateTournamentSchema>

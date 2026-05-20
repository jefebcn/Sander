import { z } from "zod"

export const CreateTournamentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  date: z.coerce.date(),
  type: z.enum(["KING_OF_THE_BEACH", "BRACKETS", "ROUND_ROBIN", "DOUBLE_ELIMINATION", "CHICECE"]),
  playerIds: z
    .array(z.string().min(1))
    .max(32, "Maximum 32 players")
    .default([]),
  kotbRounds: z.number().int().min(1).max(30).optional(),
  numCourts: z.number().int().min(1).max(4).optional(),
  chiceceMatchCount: z.number().int().min(1).max(6).optional(),

  // Registration & payments
  location:              z.string().max(200).optional().nullable(),
  description:           z.string().max(4000).optional().nullable(),
  registrationDeadline:  z.coerce.date().optional().nullable(),
  prizePool:             z.string().max(500).optional().nullable(),
  prize2nd:              z.string().max(500).optional().nullable(),
  prize3rd:              z.string().max(500).optional().nullable(),
  priceCents:            z.number().int().min(0).max(10_000_00).optional().nullable(),
  priceCurrency:         z.enum(["EUR", "USD"]).default("EUR"),
  isOpenForRegistration: z.boolean().default(false),

  // Cover & display
  coverUrl:   z.string().url().optional().nullable(),
  skillLevel: z.string().max(50).optional().nullable(),
  gender:     z.string().max(30).optional().nullable(),
  maxTeams:   z.number().int().min(1).optional().nullable(),
}).refine(
  (d) => d.isOpenForRegistration || d.playerIds.length >= 4,
  { message: "At least 4 players required (or enable open registration)", path: ["playerIds"] },
)

export const UpdateTournamentSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  date: z.coerce.date().optional(),
})

export type CreateTournamentInput = z.infer<typeof CreateTournamentSchema>
export type UpdateTournamentInput = z.infer<typeof UpdateTournamentSchema>

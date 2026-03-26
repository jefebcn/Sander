import { z } from "zod"

export const BadgeTypeEnum = z.enum([
  "MURO_IMPENETRABILE",
  "DIFESA_ACROBATICA",
  "LEADER_CARISMATICO",
  "SCHIACCIATA_POTENTE",
  "SERVIZIO_PRECISO",
  "SPIRITO_DI_SQUADRA",
  "MVP_PARTITA",
  "FAIR_PLAY",
])

export const SubmitRatingSchema = z.object({
  sessionId:     z.string().cuid(),
  ratedPlayerId: z.string().cuid(),
  type:          z.enum(["SUPER", "TOP", "FLOP"]),
  badges:        z.array(BadgeTypeEnum).max(3).optional(),
})

export type SubmitRatingInput = z.infer<typeof SubmitRatingSchema>

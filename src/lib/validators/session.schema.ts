import { z } from "zod"

export const CreateSessionSchema = z.object({
  title: z.string().min(2, "Titolo troppo corto").max(80),
  location: z.string().min(2, "Inserisci la location").max(100),
  date: z.coerce.date(),
  format: z.enum(["TWO_VS_TWO", "THREE_VS_THREE", "FOUR_VS_FOUR"]),
  courtCost: z.number().int().min(0).optional(),
  notes: z.string().max(200).optional(),
  paymentType: z.enum(["FREE", "QUOTA", "LOSER_PAYS"]).default("FREE"),
  quotaAmount: z.number().int().min(0).optional(),
  loserPays: z.string().max(60).optional(),
})

export const RatePlayerSchema = z.object({
  sessionId: z.string().min(1),
  ratedId: z.string().min(1),
  type: z.enum(["SUPER", "TOP", "FLOP"]),
})

export const AssignTeamSchema = z.object({
  sessionId: z.string().min(1),
  participantId: z.string().min(1),
  team: z.union([z.literal(0), z.literal(1), z.null()]),
})

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>
export type RatePlayerInput = z.infer<typeof RatePlayerSchema>
export type AssignTeamInput = z.infer<typeof AssignTeamSchema>

import { z } from "zod"

export const CreatePlayerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  preferredRole: z.enum(["BLOCKER", "DEFENDER"]).default("DEFENDER"),
  avatarUrl: z.string().url().optional().or(z.literal("")),
})

export const UpdatePlayerSchema = CreatePlayerSchema.partial()

const pct = z.number().int().min(0).max(100)

export const UpdateStatPctSchema = z.object({
  attPct: pct,
  difPct: pct,
  murPct: pct,
  alzPct: pct,
  ricPct: pct,
  staPct: pct,
}).refine(
  (d) => d.attPct + d.difPct + d.murPct + d.alzPct + d.ricPct + d.staPct === 100,
  { message: "Le percentuali devono sommare a 100" }
)

export type CreatePlayerInput = z.infer<typeof CreatePlayerSchema>
export type UpdatePlayerInput = z.infer<typeof UpdatePlayerSchema>
export type UpdateStatPctInput = z.infer<typeof UpdateStatPctSchema>

/**
 * Admin credit grant. Bounded on purpose: the previous check only required a
 * positive integer, so a typo could mint an arbitrary fortune in the in-app
 * currency that pays for tournaments and paid sessions.
 */
export const AdminAddCreditsSchema = z.object({
  playerId: z.string().min(1),
  amount: z.number().int().min(1).max(10_000),
})

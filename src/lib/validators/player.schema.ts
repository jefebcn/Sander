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
export const TOP_UP_METHODS = ["PAYPAL", "BONIFICO", "CONTANTI", "OMAGGIO"] as const

/**
 * A SanderCredits top-up together with the money behind it.
 * Recording the euros is the whole point: without them revenue and average
 * top-up can't be measured. A gift must carry no money, and a paid top-up must
 * carry some — otherwise the ledger silently lies in either direction.
 */
export const AdminAddCreditsSchema = z
  .object({
    playerId: z.string().min(1),
    credits: z.number().int().min(1).max(10_000),
    amountCents: z.number().int().min(0).max(1_000_000),
    method: z.enum(TOP_UP_METHODS),
    note: z.string().trim().max(200).optional(),
  })
  .strict()
  .refine((d) => (d.method === "OMAGGIO" ? d.amountCents === 0 : d.amountCents > 0), {
    message: "Importo non valido: un omaggio va a 0 €, una ricarica pagata deve avere un importo",
    path: ["amountCents"],
  })

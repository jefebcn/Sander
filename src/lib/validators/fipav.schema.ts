import { z } from "zod"

/** "Avvisami" for a region of the FIPAV calendar. */
export const FipavAlertSchema = z.object({
  region: z.string().trim().min(2).max(60),
})

/** "Sono io": link the player to a FIPAV athlete id from the senior ranking. */
export const FipavLinkSchema = z.object({
  personId: z.coerce.number().int().positive().max(100_000_000),
})

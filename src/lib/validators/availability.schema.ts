import { z } from "zod"

export const AvailabilitySlotSchema = z.enum(["MORNING", "AFTERNOON", "EVENING"])

/**
 * A player's weekly availability, replaced wholesale on save.
 * Bounded at 21 entries — seven days times three slots is the whole grid, so
 * anything beyond that is a malformed or hostile payload.
 */
export const SetAvailabilitySchema = z.object({
  slots: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6), // 0=domenica … 6=sabato
        slot: AvailabilitySlotSchema,
      }),
    )
    .max(21),
})

export type AvailabilitySlotValue = z.infer<typeof AvailabilitySlotSchema>
export type SetAvailabilityInput = z.infer<typeof SetAvailabilitySchema>

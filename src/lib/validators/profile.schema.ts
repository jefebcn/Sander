import { z } from "zod"
import { isKnownCity } from "@/lib/cities"
import { START_LEVEL_IDS } from "@/lib/startLevel"

/**
 * Onboarding profile.
 *
 * Only the first name and the preferred role are required. Asking for surname,
 * date of birth, gender and nationality before showing anything was the single
 * biggest drop-off for traffic arriving from social: all five were mandatory,
 * with no explanation of why. They are all nullable in the database anyway.
 *
 * The role, on the other hand, is now asked here: the whole "complementary
 * role" promise of /trova is built on it, and the main onboarding never
 * collected it, so matching ran on a default nobody had chosen.
 */
export const SaveProfileSchema = z.object({
  firstName:     z.string().trim().min(1).max(50),
  preferredRole: z.enum(["BLOCKER", "DEFENDER"]),
  lastName:      z.string().trim().max(50).optional(),
  birthDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido").optional(),
  gender:        z.enum(["Uomo", "Donna", "Altro"]).optional(),
  nationality:   z.string().trim().max(80).optional(),
  avatarUrl:     z.string().url().nullable().optional(),
  // Both optional so they never block sign-up, but asked up front: they are
  // what makes the first home screen about *your* town and *your* level.
  homeCity:      z.string().refine(isKnownCity, "Comune non riconosciuto").optional(),
  startLevel:    z.enum(START_LEVEL_IDS).optional(),
})

export type SaveProfileInput = z.infer<typeof SaveProfileSchema>

export const NudgePrefSchema = z.object({ optOut: z.boolean() }).strict()

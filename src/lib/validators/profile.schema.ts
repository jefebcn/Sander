import { z } from "zod"

export const SaveProfileSchema = z.object({
  firstName:   z.string().min(1).max(50),
  lastName:    z.string().min(1).max(50),
  birthDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido"),
  gender:      z.enum(["Uomo", "Donna", "Altro"]),
  nationality: z.string().min(1).max(80),
  avatarUrl:   z.string().url().nullable().optional(),
})

export type SaveProfileInput = z.infer<typeof SaveProfileSchema>

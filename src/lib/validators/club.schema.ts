import { z } from "zod"

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable().transform((v) => (v ? v : null))

const httpsUrl = z
  .string()
  .trim()
  .url()
  .refine((u) => /^https?:\/\//.test(u), "Indirizzo non valido")

export const ClubFieldsSchema = z.object({
  name: z.string().trim().min(3, "Nome troppo corto").max(60),
  city: z.string().trim().min(2, "Indica la città").max(60),
  address: optionalText(120),
  description: optionalText(600),
  instagram: optionalText(80),
  website: httpsUrl.optional().nullable().or(z.literal("").transform(() => null)),
  contactEmail: z.string().trim().email("Email non valida").optional().nullable().or(z.literal("").transform(() => null)),
  logoUrl: httpsUrl.optional().nullable(),
})

export const ClubIdSchema = z.string().trim().min(1).max(64)

export const UpdateClubSchema = ClubFieldsSchema.extend({ clubId: ClubIdSchema })

export const ClubStatusSchema = z.object({
  clubId: ClubIdSchema,
  status: z.enum(["APPROVED", "REJECTED", "SUSPENDED"]),
})

export const FollowClubSchema = z.object({ clubId: ClubIdSchema, follow: z.boolean() })

export const PairInviteTokenSchema = z.string().trim().regex(/^[A-Za-z0-9_-]{16,64}$/)

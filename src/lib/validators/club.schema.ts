import { z } from "zod"
import { CLUB_SERVICE_KEYS, MAX_CLUB_PHOTOS } from "@/lib/club"
import { MAX_BAGNO } from "@/lib/bagni"

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
  // Courts and services: all optional, filled in from the back office.
  courts: z.number().int().min(1).max(40).optional().nullable(),
  courtType: z.enum(["OUTDOOR", "INDOOR", "BOTH"]).optional().nullable(),
  openingHours: optionalText(120),
  courtPriceCents: z.number().int().min(0).max(50_000).optional().nullable(),
  services: z.array(z.enum(CLUB_SERVICE_KEYS)).max(CLUB_SERVICE_KEYS.length).default([]),
  photos: z.array(httpsUrl).max(MAX_CLUB_PHOTOS).default([]),
  bagno: z.number().int().min(1).max(MAX_BAGNO).optional().nullable(),
})

export const ClubIdSchema = z.string().trim().min(1).max(64)

export const UpdateClubSchema = ClubFieldsSchema.extend({ clubId: ClubIdSchema })

export const ClubStatusSchema = z.object({
  clubId: ClubIdSchema,
  status: z.enum(["APPROVED", "REJECTED", "SUSPENDED"]),
})

export const FollowClubSchema = z.object({ clubId: ClubIdSchema, follow: z.boolean() })

export const PairInviteTokenSchema = z.string().trim().regex(/^[A-Za-z0-9_-]{16,64}$/)

export const CreateCircuitSchema = z.object({ clubId: ClubIdSchema, name: z.string().trim().min(3, "Nome troppo corto").max(60) })

export const SetTournamentCircuitSchema = z.object({ tournamentId: z.string().trim().min(1).max(64), circuitId: z.string().trim().min(1).max(64).nullable() })

export const StaffInviteTokenSchema = z.string().trim().regex(/^[A-Za-z0-9_-]{16,64}$/)

export const RemoveStaffSchema = z.object({ clubId: ClubIdSchema, playerId: z.string().trim().min(1).max(64) })

export const ClubMessageSchema = z.object({
  clubId: ClubIdSchema,
  /** null: the club's followers; otherwise the players of that club tournament. */
  tournamentId: z.string().trim().min(1).max(64).nullable(),
  body: z.string().trim().min(5, "Messaggio troppo corto").max(300, "Massimo 300 caratteri"),
})

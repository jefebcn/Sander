import { z } from "zod"
import { isKnownCity } from "@/lib/cities"
import { isPromptKey, LOOKING_FOR_KEYS, SIDE_KEYS } from "@/lib/scopri/prompts"
import { ANSWER_MAX, COMMENT_MAX, MAX_PHOTOS, MOTTO_MAX, PROMPT_COUNT } from "@/lib/scopri/rules"
import { FREE_SLOT_KEYS } from "@/lib/scopri/reliability"

const Id = z.string().trim().min(1).max(64)
const Comment = z.string().trim().max(COMMENT_MAX).optional()

export const SendLikeSchema = z
  .object({
    toId: Id,
    target: z.enum(["PROFILE", "PHOTO", "PROMPT"]),
    targetId: Id.optional(),
    comment: Comment,
    ace: z.boolean().optional(),
  })
  .strict()
  .refine((d) => d.target === "PROFILE" || !!d.targetId, "Scegli cosa ti piace")

export const PlayerRefSchema = z.object({ playerId: Id }).strict()

export const RespondLikeSchema = z
  .object({ fromId: Id, accept: z.boolean(), comment: Comment })
  .strict()

export const BlockSchema = z
  .object({
    playerId: Id,
    report: z
      .object({
        reason: z.enum(["FINTO", "FOTO", "OFFENSIVO", "MOLESTIE", "MINORENNE", "ALTRO"]),
        note: z.string().trim().max(500).optional(),
      })
      .optional(),
  })
  .strict()

export const MatchRefSchema = z.object({ matchId: Id }).strict()

export const PlayedSchema = z.object({ matchId: Id, played: z.boolean() }).strict()

export const BuyExtraSchema = z.object({ offer: z.enum(["likes", "ace", "reveal"]) }).strict()

export const DiscoverSettingsSchema = z
  .object({
    side: z.enum(SIDE_KEYS).nullable().optional(),
    lookingFor: z.array(z.enum(LOOKING_FOR_KEYS)).max(5).optional(),
    paused: z.boolean().optional(),
    prefCities: z.array(z.string().refine(isKnownCity, "Comune non riconosciuto")).max(20).optional(),
    prefGender: z.enum(["Uomo", "Donna"]).nullable().optional(),
    prefRole: z.enum(["BLOCKER", "DEFENDER"]).nullable().optional(),
    maxGap: z.number().int().min(100).max(1000).optional(),
    // SANDER+ deck filters.
    onlyVerified: z.boolean().optional(),
    onlyFreeToday: z.boolean().optional(),
    // Player fields Scopri needs, editable from the same screen.
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido").optional(),
    homeCity: z.string().refine(isKnownCity, "Comune non riconosciuto").optional(),
    gender: z.enum(["Uomo", "Donna", "Altro"]).optional(),
    preferredRole: z.enum(["BLOCKER", "DEFENDER"]).optional(),
  })
  .strict()

export const PromptSchema = z
  .object({
    position: z.number().int().min(0).max(PROMPT_COUNT - 1),
    promptKey: z.string().refine(isPromptKey, "Domanda non valida"),
    answer: z.string().trim().min(2, "Scrivi almeno due lettere").max(ANSWER_MAX),
  })
  .strict()

export const PromptRefSchema = z.object({ position: z.number().int().min(0).max(PROMPT_COUNT - 1) }).strict()

export const PhotoRefSchema = z.object({ photoId: Id }).strict()

export const ReorderPhotosSchema = z.object({ ids: z.array(Id).min(1).max(MAX_PHOTOS) }).strict()

export const ProposeGameSchema = z
  .object({
    matchId: Id,
    location: z.string().trim().min(2).max(100),
    city: z.string().refine(isKnownCity, "Comune non riconosciuto").optional(),
    date: z.coerce.date(),
  })
  .strict()

// ── Coppie (2v2) ─────────────────────────────────────────────────────────────

export const DuoInviteSchema = z
  .object({
    partnerId: Id,
    name: z.string().trim().max(40).optional(),
    motto: z.string().trim().max(MOTTO_MAX).optional(),
  })
  .strict()

export const DuoRefSchema = z.object({ duoId: Id }).strict()

export const DuoRespondSchema = z.object({ duoId: Id, accept: z.boolean() }).strict()

export const DuoUpdateSchema = z
  .object({
    duoId: Id,
    name: z.string().trim().max(40).optional(),
    motto: z.string().trim().max(MOTTO_MAX).optional(),
  })
  .strict()

export const DuoLikeSchema = z.object({ toDuoId: Id, comment: Comment }).strict()

export const DuoRespondLikeSchema = z.object({ fromDuoId: Id, accept: z.boolean() }).strict()

export const DuoGameSchema = z
  .object({
    duoMatchId: Id,
    location: z.string().trim().min(2).max(100),
    city: z.string().refine(isKnownCity, "Comune non riconosciuto").optional(),
    date: z.coerce.date(),
  })
  .strict()

export const FreeTodaySchema = z.object({ slot: z.enum(FREE_SLOT_KEYS).nullable() }).strict()

/** The one-minute Scopri step right after sign-up. */
export const QuickStartSchema = z
  .object({
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido").optional(),
    prompts: z
      .array(
        z.object({
          promptKey: z.string().refine(isPromptKey, "Domanda non valida"),
          answer: z.string().trim().min(2, "Scrivi almeno due lettere").max(ANSWER_MAX),
        }),
      )
      .min(1)
      .max(PROMPT_COUNT)
      .refine((list) => new Set(list.map((p) => p.promptKey)).size === list.length, "Domande ripetute"),
    lookingFor: z.array(z.enum(LOOKING_FOR_KEYS)).max(5).optional(),
    useAvatar: z.boolean().optional(),
  })
  .strict()

export const PlayAgainSchema = z.object({ sessionId: Id, targetId: Id, again: z.boolean() }).strict()

// ── Admin (Scopri) ───────────────────────────────────────────────────────────

export const AdminPhotoSchema = z.object({ photoId: Id }).strict()
export const AdminSuspendSchema = z.object({ playerId: Id, reason: z.string().trim().min(2).max(200) }).strict()
export const AdminPlayerSchema = z.object({ playerId: Id }).strict()
export const AdminReportSchema = z.object({ reportId: Id }).strict()

export const DisputeAbsenceSchema = z.object({ eventId: Id, note: z.string().trim().min(3, "Scrivi due parole").max(300) }).strict()
export const AdminAbsenceSchema = z.object({ eventId: Id, keep: z.boolean() }).strict()

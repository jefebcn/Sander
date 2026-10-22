import { z } from "zod"
import { isKnownPlace } from "@/lib/comuni"

export const CreateSessionSchema = z.object({
  title: z.string().max(80).optional(),
  // Required: a match with no venue cannot be found or shown up to.
  location: z.string().trim().min(2, "Indica il luogo della partita").max(100),
  // Optional, but must be a comune we know: an arbitrary string here would be
  // useless for the town leaderboards, which is the only reason this exists.
  city: z
    .string()
    .refine(isKnownPlace, "Comune non riconosciuto")
    .optional(),
  date: z.coerce.date(),
  format: z.enum(["TWO_VS_TWO", "THREE_VS_THREE", "FOUR_VS_FOUR"]),
  courtCost: z.number().int().min(0).optional(),
  notes: z.string().max(200).optional(),
  paymentType: z.enum(["FREE", "QUOTA", "LOSER_PAYS", "SC"]).default("FREE"),
  quotaAmount: z.number().int().min(0).max(1000).optional(),
  loserPays: z.string().max(60).optional(),
  matchMode: z.boolean().optional().default(false),
}).refine(
  // A credits match with no price would let everyone in for free.
  (d) => d.paymentType !== "SC" || (d.quotaAmount ?? 0) >= 1,
  { message: "Indica quanti SanderCredits costa la partita", path: ["quotaAmount"] },
)

export const EditSessionSchema = z.object({
  sessionId: z.string().min(1),
  title: z.string().max(80).optional(),
  location: z.string().max(100).default(""),
  // Lets the organiser correct a wrong pick instead of the match staying out
  // of the town leaderboards for good.
  city: z.string().refine(isKnownPlace, "Comune non riconosciuto").optional(),
  date: z.coerce.date(),
  notes: z.string().max(200).optional(),
  maxPlayers: z.number().int().min(2).max(32).optional(),
})

export const SubmitSessionMatchScoreSchema = z.object({
  matchId:    z.string().min(1),
  teamAScore: z.number().int().min(0),
  teamBScore: z.number().int().min(0),
})

export const AssignTeamSchema = z.object({
  sessionId: z.string().min(1),
  participantId: z.string().min(1),
  team: z.union([z.literal(0), z.literal(1), z.null()]),
})

/** Team index used across the live scoreboard. */
const TeamIndexSchema = z.union([z.literal(0), z.literal(1)])

/** A [teamA, teamB] score pair. */
const ScorePairSchema = z.tuple([
  z.number().int().min(0).max(999),
  z.number().int().min(0).max(999),
])

/**
 * Sets submitted when closing a session.
 * Bounded on purpose: unvalidated scores would land in SessionSet and feed the
 * Glicko calculation, so a malformed payload could distort every rating.
 */
export const CompleteSessionSchema = z.object({
  sessionId: z.string().min(1),
  sets: z
    .array(
      z.object({
        teamAScore: z.number().int().min(0).max(99),
        teamBScore: z.number().int().min(0).max(99),
      }),
    )
    .max(7)
    .optional(),
})

/** One-tap join from the home's open-match cards. */
export const QuickJoinSchema = z.object({
  sessionId: z.string().min(1).max(64),
})

/**
 * Shape of the in-progress scoreboard persisted in Session.liveScore.
 * Validated in both directions: it is written by any session member and then
 * served to every polling device, so an arbitrary payload would both bloat the
 * row and crash the board that hydrates from it.
 */
export const LiveScoreSchema = z.object({
  names: z.tuple([z.string().max(60), z.string().max(60)]),
  bestOf: z.union([z.literal(1), z.literal(3)]),
  showSetup: z.boolean(),
  scores: ScorePairSchema,
  setsWon: ScorePairSchema,
  setIndex: z.number().int().min(0).max(10),
  history: z.array(z.object({ team: TeamIndexSchema })).max(500),
  setResults: z.array(ScorePairSchema).max(10),
  matchWinner: z.union([TeamIndexSchema, z.null()]),
})

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>
export type EditSessionInput = z.infer<typeof EditSessionSchema>
export type AssignTeamInput = z.infer<typeof AssignTeamSchema>
export type SubmitSessionMatchScoreInput = z.infer<typeof SubmitSessionMatchScoreSchema>
export type CompleteSessionInput = z.infer<typeof CompleteSessionSchema>
export type LiveScoreState = z.infer<typeof LiveScoreSchema>

export const AddPlayerToSessionSchema = z.object({
  sessionId: z.string().min(1),
  playerId: z.string().min(1),
})

export const AddGuestSchema = z.object({
  sessionId: z.string().min(1),
  guestName: z.string().trim().min(1, "Nome ospite non valido").max(40, "Nome troppo lungo"),
})

export const SessionIdSchema = z.string().min(1).max(64)

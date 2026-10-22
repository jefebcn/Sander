import { z } from "zod"
import { isKnownPlace } from "@/lib/comuni"

export const SendMessageSchema = z.object({
  threadId: z.string().min(1),
  body: z.string().trim().min(1, "Messaggio vuoto").max(2000, "Messaggio troppo lungo"),
})
export type SendMessageInput = z.infer<typeof SendMessageSchema>

export const CreateGroupSchema = z.object({
  playerIds: z.array(z.string().min(1)).min(2, "Seleziona almeno 2 giocatori").max(9),
  name: z.string().trim().max(60).optional(),
})
export type CreateGroupInput = z.infer<typeof CreateGroupSchema>

export const ProposeInChatSchema = z
  .object({
    threadId: z.string().min(1),
    date: z.coerce.date(),
    location: z.string().trim().min(2, "Scrivi dove giocate (es. Bagno 26)").max(100),
    city: z.string().refine(isKnownPlace, "Comune non riconosciuto").optional(),
    /** A 2v2 with the two of you as a pair, or a training just between you two. */
    kind: z.enum(["GAME", "TRAINING"]).default("GAME"),
    focus: z.enum(["PALLEGGIO", "SERVIZIO", "RICEZIONE", "TUTTO"]).optional(),
  })
  .strict()

/** "Entrate in coppia": you and the person you're chatting with take two free seats. */
export const JoinAsPairSchema = z.object({ threadId: z.string().min(1), sessionId: z.string().min(1) }).strict()

export const ProposalAnswerSchema = z
  .object({ proposalId: z.string().min(1), answer: z.enum(["accept", "decline", "cancel"]) })
  .strict()

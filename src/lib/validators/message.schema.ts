import { z } from "zod"

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

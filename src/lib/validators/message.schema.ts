import { z } from "zod"

export const SendMessageSchema = z.object({
  threadId: z.string().min(1),
  body: z.string().trim().min(1, "Messaggio vuoto").max(2000, "Messaggio troppo lungo"),
})
export type SendMessageInput = z.infer<typeof SendMessageSchema>

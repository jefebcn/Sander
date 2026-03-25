import { z } from "zod"

export const CreatePlayerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  preferredRole: z.enum(["BLOCKER", "DEFENDER"]).default("DEFENDER"),
  avatarUrl: z.string().url().optional().or(z.literal("")),
})

export const UpdatePlayerSchema = CreatePlayerSchema.partial()

export type CreatePlayerInput = z.infer<typeof CreatePlayerSchema>
export type UpdatePlayerInput = z.infer<typeof UpdatePlayerSchema>

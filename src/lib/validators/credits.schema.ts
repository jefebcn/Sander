import { z } from "zod"

export const StartCreditCheckoutSchema = z
  .object({ packId: z.enum(["small", "medium", "large"]) })
  .strict()

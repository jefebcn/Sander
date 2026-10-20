import { z } from "zod"

/** A browser error report (components/analytics/ErrorReporter.tsx). */
export const ClientErrorSchema = z.object({
  message: z.string().min(1).max(2000),
  path: z.string().max(500).optional(),
  stack: z.string().max(8000).optional(),
  digest: z.string().max(100).optional(),
})

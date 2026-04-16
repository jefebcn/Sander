import { z } from "zod"

export const StartCheckoutSchema = z.object({
  tournamentId: z.string().min(1),
})

export const CreateManualPaymentSchema = z.object({
  tournamentId: z.string().min(1),
})

export const AdminConfirmManualPaymentSchema = z.object({
  registrationId: z.string().min(1),
  notes: z.string().max(500).optional(),
})

export const AdminRejectManualPaymentSchema = z.object({
  registrationId: z.string().min(1),
})

export const CancelRegistrationSchema = z.object({
  registrationId: z.string().min(1),
})

export const GetTournamentForRegistrationSchema = z.object({
  tournamentId: z.string().min(1),
})

export type StartCheckoutInput               = z.infer<typeof StartCheckoutSchema>
export type CreateManualPaymentInput         = z.infer<typeof CreateManualPaymentSchema>
export type AdminConfirmManualPaymentInput   = z.infer<typeof AdminConfirmManualPaymentSchema>
export type AdminRejectManualPaymentInput    = z.infer<typeof AdminRejectManualPaymentSchema>
export type CancelRegistrationInput          = z.infer<typeof CancelRegistrationSchema>
export type GetTournamentForRegistrationInput = z.infer<typeof GetTournamentForRegistrationSchema>

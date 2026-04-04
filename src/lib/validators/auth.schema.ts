import { z } from "zod"

export const RegisterSchema = z.object({
  email:      z.string().email("Email non valida"),
  password:   z.string().min(8, "Password minimo 8 caratteri"),
  inviteCode: z.string().optional(),
})

export const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Email non valida"),
})

export const ResetPasswordSchema = z.object({
  token:    z.string().min(1),
  password: z.string().min(8, "Password minimo 8 caratteri"),
})

import { z } from "zod"

export const RegisterSchema = z.object({
  email:    z.string().email("Email non valida"),
  password: z.string().min(8, "Password minimo 8 caratteri"),
})

export const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

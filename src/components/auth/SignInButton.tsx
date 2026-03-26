"use client"

import { signIn } from "next-auth/react"
import { LogIn } from "lucide-react"

interface SignInButtonProps {
  callbackUrl?: string
  className?: string
}

export function SignInButton({ callbackUrl, className }: SignInButtonProps) {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl })}
      className={
        className ??
        "flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] font-bold text-black transition-all active:scale-[0.98]"
      }
    >
      <LogIn className="h-5 w-5" aria-hidden="true" />
      Accedi con Google
    </button>
  )
}

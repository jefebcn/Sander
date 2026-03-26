"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { useHaptic } from "@/lib/useHaptic"

interface SignOutButtonProps {
  className?: string
  children?: React.ReactNode
}

export function SignOutButton({ className, children }: SignOutButtonProps) {
  const haptic = useHaptic()
  return (
    <button
      onClick={() => { haptic("light"); signOut({ callbackUrl: "/" }) }}
      className={className}
    >
      {children ?? (
        <>
          <LogOut className="h-4 w-4" />
          Esci dall&apos;account
        </>
      )}
    </button>
  )
}

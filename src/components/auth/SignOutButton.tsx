"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { useHaptic } from "@/lib/useHaptic"

interface SignOutButtonProps {
  className?: string
  children?: React.ReactNode
  iconOnly?: boolean
}

export function SignOutButton({ className, children, iconOnly }: SignOutButtonProps) {
  const haptic = useHaptic()
  return (
    <button
      onClick={() => { haptic("light"); signOut({ callbackUrl: "/" }) }}
      className={className}
      aria-label="Esci dall'account"
    >
      {children ?? (
        iconOnly
          ? <LogOut className="h-4 w-4" />
          : <><LogOut className="h-4 w-4" /> Esci dall&apos;account</>
      )}
    </button>
  )
}

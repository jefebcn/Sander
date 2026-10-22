"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

/** Out of this account and straight to the sign-in, which brings you back to admin. */
export function AdminSignOut() {
  return (
    <button
      type="button"
      onClick={() => {
        localStorage.removeItem("sander_has_profile")
        signOut({ callbackUrl: "/auth/signin?callbackUrl=/admin" })
      }}
      className="btn btn-primary w-full gap-2"
    >
      <LogOut className="h-5 w-5" aria-hidden="true" /> Esci e accedi come admin
    </button>
  )
}

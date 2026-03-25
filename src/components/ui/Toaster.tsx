"use client"

import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      offset={88} // above MobileNav (56px) + margin
      toastOptions={{
        style: {
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
          borderRadius: "1rem",
          fontSize: "0.9rem",
          fontWeight: "500",
        },
        classNames: {
          success: "!border-[var(--live)]/40",
          error: "!border-[var(--danger)]/40",
          warning: "!border-[var(--warning)]/40",
        },
      }}
    />
  )
}

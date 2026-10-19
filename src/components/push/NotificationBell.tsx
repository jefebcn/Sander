"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { NotificationCenter } from "./NotificationCenter"

interface NotificationBellProps {
  unreadCount: number
}

export function NotificationBell({ unreadCount }: NotificationBellProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Notifiche${unreadCount > 0 ? ` (${unreadCount} non lette)` : ""}`}
        className="relative ml-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-2)] ring-1 ring-[var(--crest-hair)] transition-transform active:scale-90"
      >
        <Bell className="h-5 w-5 text-white" />
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] px-1 items-center justify-center rounded-full bg-[var(--love)] text-xs font-black text-white ring-2 ring-[var(--background)]"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <NotificationCenter open={open} onClose={() => setOpen(false)} />
    </>
  )
}

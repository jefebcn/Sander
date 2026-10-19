import Link from "next/link"
import { MessageCircle } from "lucide-react"

/** Header entry point to the chat inbox, with an unread badge (mirrors NotificationBell). */
export function MessagesBell({ unreadCount }: { unreadCount: number }) {
  return (
    <Link
      href="/messaggi"
      aria-label="Messaggi"
      className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-2)] ring-1 ring-[var(--crest-hair)] transition-transform active:scale-90"
    >
      <MessageCircle className="h-5 w-5 text-white" />
      {unreadCount > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--love)] px-1 text-xs font-black text-white ring-2 ring-[var(--background)]"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  )
}

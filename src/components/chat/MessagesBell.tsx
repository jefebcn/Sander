import Link from "next/link"
import { MessageCircle } from "lucide-react"

/** Header entry point to the chat inbox, with an unread badge (mirrors NotificationBell). */
export function MessagesBell({ unreadCount }: { unreadCount: number }) {
  return (
    <Link
      href="/messaggi"
      aria-label="Messaggi"
      className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]"
    >
      <MessageCircle className="h-5 w-5 text-white" />
      {unreadCount > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[0.65rem] font-black text-black"
          style={{ background: "var(--accent)" }}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  )
}

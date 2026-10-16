import Link from "next/link"
import { UserPlus, ChevronRight } from "lucide-react"
import { INVITEE_SC, INVITER_SC } from "@/lib/referral"

/** Bring-a-friend nudge, one line: what you both get and where to send the invite. */
export function InviteCard() {
  return (
    <Link
      href="/profile?tab=invita"
      className="pressable flex min-h-[4rem] items-center gap-3 rounded-[var(--radius-md)] px-4"
      style={{ background: "color-mix(in srgb, var(--social) 10%, transparent)" }}
    >
      <UserPlus className="h-5 w-5 shrink-0 text-[var(--social)]" aria-hidden="true" />
      <span className="min-w-0 flex-1 text-base font-bold text-white">
        Porta un amico: +{INVITER_SC} crediti
        <span className="block text-sm font-normal text-[var(--muted-text)]">
          E +{INVITEE_SC} a lui, quando gioca la prima partita
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
    </Link>
  )
}

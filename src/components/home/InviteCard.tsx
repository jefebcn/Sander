import Link from "next/link"
import { UserPlus } from "lucide-react"
import { INVITEE_SC, INVITER_SC } from "@/lib/referral"
import { nextInviteMilestone } from "@/lib/inviteMilestones"

/** Bring-a-friend nudge with visible progress toward the next badge. */
export function InviteCard({ invited }: { invited: number }) {
  const next = nextInviteMilestone(invited)
  const prevAt = next?.prevAt ?? 0
  const pct = next ? Math.round(((invited - prevAt) / (next.at - prevAt)) * 100) : 100
  return (
    <Link
      href="/profile?tab=invita"
      className="pressable tone-social relative block overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-5"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, var(--social) 0%, transparent 65%)" }}
      />
      <div className="relative flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--tone-soft)] text-[var(--tone)]">
          <UserPlus className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-[var(--tone)]">Porta un amico in spiaggia</p>
          <p className="text-base font-extrabold leading-snug text-white">
            +{INVITER_SC} SC a te, +{INVITEE_SC} SC a lui
          </p>
          <p className="text-sm text-[var(--muted-text)]">
            {next
              ? `${invited} ${invited === 1 ? "amico invitato" : "amici invitati"} · ${next.at - invited} al badge "${next.title}"`
              : `${invited} amici invitati · hai tutti i badge`}
          </p>
        </div>
      </div>
      <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-4)]" aria-hidden="true">
        <div className="xp-bar-fill h-full rounded-full bg-[var(--social)]" style={{ width: `${Math.max(4, pct)}%` }} />
      </div>
      <span className="relative mt-4 flex min-h-[3rem] items-center justify-center rounded-[var(--radius-md)] bg-[var(--social)] text-base font-extrabold text-black">
        Invita ora
      </span>
    </Link>
  )
}

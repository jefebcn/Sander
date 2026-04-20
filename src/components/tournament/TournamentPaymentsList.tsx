import { Check, X, Trash2 } from "lucide-react"
import { adminSetPaymentStatus, adminRemoveRegistration } from "@/actions/registration"
import { formatPrice } from "@/lib/utils"
import { SkillBadge } from "./SkillBadge"
import { AdminSkillLevelSelect } from "./AdminSkillLevelSelect"

interface Registration {
  id: string
  player: { name: string }
  paymentStatus: string
  paymentMethod: string | null
  paidAt: Date | null
  amountPaidCents: number | null
  skillLevel: number | null
}

interface TournamentPaymentsListProps {
  registrations: Registration[]
  priceCents: number
  isAdmin?: boolean
  tournamentId: string
  tournamentStatus?: string
}

function statusDot(status: string) {
  if (status === "PAID" || status === "FREE") {
    return <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: "var(--live)" }} />
  }
  if (status === "PENDING") {
    return <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: "#f97316" }} />
  }
  return <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: "var(--muted)" }} />
}

function methodLabel(method: string | null, status: string) {
  if (status === "FREE" || method === "FREE") return "Gratis"
  if (method === "STRIPE") return "Carta"
  if (method === "CASH") return "Contanti"
  if (method === "PAYPAL") return "PayPal"
  if (status === "CANCELLED") return "Annullato"
  if (status === "REFUNDED") return "Rimborsato"
  return "—"
}

export function TournamentPaymentsList({
  registrations,
  priceCents,
  isAdmin,
  tournamentId: _tournamentId,
  tournamentStatus,
}: TournamentPaymentsListProps) {
  const paid = registrations.filter((r) => r.paymentStatus === "PAID" || r.paymentStatus === "FREE")
  const total = registrations.length
  const allPaid = paid.length === total && total > 0
  const isDraft = tournamentStatus === "DRAFT"

  return (
    <div className="rounded-2xl bg-[var(--surface-1)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <p className="text-sm font-bold text-white">Pagamenti</p>
        <span className="text-xs font-bold" style={{ color: allPaid ? "var(--live)" : "#f97316" }}>
          {paid.length} / {total} pagati
        </span>
      </div>

      {registrations.length === 0 ? (
        <p className="px-4 py-4 text-sm text-[var(--muted-text)]">Nessuna iscrizione ancora.</p>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {registrations.map((r) => {
            const isPaid = r.paymentStatus === "PAID" || r.paymentStatus === "FREE"
            const isFree = r.paymentStatus === "FREE" || r.paymentMethod === "FREE"

            return (
              <li key={r.id} className="flex items-center gap-2 px-4 py-3">
                {statusDot(r.paymentStatus)}
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{r.player.name}</span>

                {isAdmin ? (
                  <AdminSkillLevelSelect
                    registrationId={r.id}
                    current={r.skillLevel}
                    playerName={r.player.name}
                  />
                ) : (
                  <SkillBadge level={r.skillLevel} />
                )}

                <span className="shrink-0 text-xs text-[var(--muted-text)]">
                  {methodLabel(r.paymentMethod, r.paymentStatus)}
                </span>
                {r.amountPaidCents != null && isPaid && !isFree && (
                  <span className="shrink-0 text-xs font-bold" style={{ color: "var(--live)" }}>
                    {formatPrice(r.amountPaidCents)}
                  </span>
                )}
                {r.paymentStatus === "PENDING" && !isAdmin && (
                  <span className="shrink-0 text-xs font-bold" style={{ color: "#f97316" }}>
                    {formatPrice(priceCents)} da pagare
                  </span>
                )}

                {/* Toggle pagato/non pagato (solo admin, non gratis) */}
                {isAdmin && !isFree && (
                  isPaid ? (
                    <form action={async () => {
                      "use server"
                      await adminSetPaymentStatus(r.id, false)
                    }}>
                      <button
                        type="submit"
                        title="Segna come non pagato"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors active:opacity-70"
                        style={{ background: "rgba(249,115,22,0.15)", color: "#f97316" }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  ) : (
                    <form action={async () => {
                      "use server"
                      await adminSetPaymentStatus(r.id, true)
                    }}>
                      <button
                        type="submit"
                        title="Segna come pagato"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors active:opacity-70"
                        style={{ background: "rgba(34,197,94,0.15)", color: "var(--live)" }}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  )
                )}

                {/* Rimuovi partecipante (solo admin, solo torneo DRAFT) */}
                {isAdmin && isDraft && (
                  <form action={async () => {
                    "use server"
                    await adminRemoveRegistration({ registrationId: r.id })
                  }}>
                    <button
                      type="submit"
                      title="Rimuovi partecipante"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--muted-text)] transition-colors hover:bg-red-500/15 hover:text-red-400 active:opacity-70"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

import { formatPrice } from "@/lib/utils"

interface Registration {
  id: string
  player: { name: string }
  paymentStatus: string
  paymentMethod: string | null
  paidAt: Date | null
  amountPaidCents: number | null
}

interface TournamentPaymentsListProps {
  registrations: Registration[]
  priceCents: number
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
  if (status === "CANCELLED") return "Annullato"
  if (status === "REFUNDED") return "Rimborsato"
  return "—"
}

export function TournamentPaymentsList({ registrations, priceCents }: TournamentPaymentsListProps) {
  const paid = registrations.filter((r) => r.paymentStatus === "PAID" || r.paymentStatus === "FREE")
  const total = registrations.length

  return (
    <div className="rounded-2xl bg-[var(--surface-1)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <p className="text-sm font-bold text-white">Pagamenti</p>
        <span className="text-xs font-bold" style={{ color: paid.length === total && total > 0 ? "var(--live)" : "#f97316" }}>
          {paid.length} / {total} pagati
        </span>
      </div>

      {registrations.length === 0 ? (
        <p className="px-4 py-4 text-sm text-[var(--muted-text)]">Nessuna iscrizione ancora.</p>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {registrations.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-3">
              {statusDot(r.paymentStatus)}
              <span className="flex-1 truncate text-sm font-semibold text-white">{r.player.name}</span>
              <span className="shrink-0 text-xs text-[var(--muted-text)]">
                {methodLabel(r.paymentMethod, r.paymentStatus)}
              </span>
              {r.amountPaidCents != null && r.paymentStatus === "PAID" && (
                <span className="shrink-0 text-xs font-bold" style={{ color: "var(--live)" }}>
                  {formatPrice(r.amountPaidCents)}
                </span>
              )}
              {r.paymentStatus === "PENDING" && (
                <span className="shrink-0 text-xs font-bold" style={{ color: "#f97316" }}>
                  {formatPrice(priceCents)} da pagare
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

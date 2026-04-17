import { Check, X, Banknote, Wallet } from "lucide-react"
import { listPendingManualRegistrations, adminConfirmManualPayment, adminRejectManualPayment } from "@/actions/registration"
import { formatDate, formatPrice } from "@/lib/utils"

export async function AdminPendingPaymentsList() {
  const pending = await listPendingManualRegistrations()

  if (pending.length === 0) {
    return (
      <div className="mx-4 rounded-2xl bg-[var(--surface-1)] p-6 text-center">
        <Banknote className="mx-auto h-8 w-8 text-[var(--muted-text)]" />
        <p className="mt-3 text-base text-[var(--muted-text)]">
          Nessun pagamento manuale in attesa.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 px-4">
      {pending.map((reg) => (
        <div
          key={reg.id}
          className="flex items-center gap-3 rounded-2xl bg-[var(--surface-1)] p-4"
        >
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--surface-2)]">
            {reg.player.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={reg.player.avatarUrl} alt={reg.player.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                {reg.player.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-base font-bold text-white">{reg.player.name}</p>
              {reg.paymentMethod === "PAYPAL" ? (
                <span className="shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: "#003087", color: "#fff" }}>
                  <Wallet className="h-3 w-3" /> PayPal
                </span>
              ) : (
                <span className="shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold bg-[var(--surface-3)] text-[var(--muted-text)]">
                  <Banknote className="h-3 w-3" /> Contanti
                </span>
              )}
            </div>
            <p className="truncate text-sm text-[var(--muted-text)]">
              {reg.tournament.name} · {formatDate(reg.tournament.date)}
            </p>
            <p className="text-sm text-[var(--accent)]">
              {formatPrice(reg.tournament.priceCents, reg.tournament.priceCurrency)}
            </p>
          </div>

          <form
            action={async () => {
              "use server"
              await adminConfirmManualPayment({ registrationId: reg.id })
            }}
          >
            <button
              type="submit"
              aria-label="Conferma pagamento"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)] text-black active:brightness-90"
            >
              <Check className="h-5 w-5" />
            </button>
          </form>

          <form
            action={async () => {
              "use server"
              await adminRejectManualPayment({ registrationId: reg.id })
            }}
          >
            <button
              type="submit"
              aria-label="Rifiuta"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-3)] text-white active:bg-[var(--danger)]/20"
            >
              <X className="h-5 w-5" />
            </button>
          </form>
        </div>
      ))}
    </div>
  )
}

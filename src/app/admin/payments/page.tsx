export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { AdminPendingPaymentsList } from "@/components/tournament/AdminPendingPaymentsList"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ""

export default async function AdminPaymentsPage() {
  const session = await getCurrentSession()
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/admin/payments")
  if (!ADMIN_EMAIL || session.user.email !== ADMIN_EMAIL) redirect("/")

  return (
    <div className="min-h-dvh pb-10">
      <div
        className="flex items-center gap-3 px-4 pt-6 pb-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}
      >
        <Link
          href="/profile"
          aria-label="Indietro"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2a2a2a] text-white active:bg-[#333]"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-black text-white">Pagamenti in attesa</h1>
      </div>

      <p className="mx-4 mt-2 mb-4 text-sm text-[var(--muted-text)]">
        Conferma i pagamenti in contanti ricevuti o rifiutali se il pagamento non è avvenuto.
      </p>

      <AdminPendingPaymentsList />
    </div>
  )
}

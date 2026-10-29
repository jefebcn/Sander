"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { confirmSumUpPayment } from "@/actions/payments"

const MESSAGES = {
  fulfilled: { ok: true, text: "Pagamento ricevuto: fatto!" },
  already: { ok: true, text: "Pagamento ricevuto: fatto!" },
  pending: { ok: true, text: "Pagamento in verifica: lo vedi attivo tra pochi istanti." },
  failed: { ok: false, text: "Pagamento non riuscito o scaduto: nessun addebito." },
  unknown: { ok: false, text: "Pagamento non trovato." },
} as const

/**
 * Back from SumUp's page (?pagamento=<reference>): settle it right away so the
 * credits or the pass show up even before SumUp's webhook arrives.
 */
export function SumUpReturn() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const reference = params.get("pagamento")
  const done = useRef(false)

  useEffect(() => {
    if (!reference || done.current) return
    done.current = true
    confirmSumUpPayment(reference)
      .then(({ result }) => {
        const m = MESSAGES[result]
        if (m.ok) toast.success(m.text)
        else toast.error(m.text)
      })
      .catch(() => toast.error("Non riesco a verificare il pagamento, riprova tra poco."))
      .finally(() => {
        router.replace(pathname)
        router.refresh()
      })
  }, [reference, pathname, router])

  return null
}

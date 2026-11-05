/* Sign-up list → CSV for Excel (pure). Semicolons and a BOM: what Italian Excel opens right. */

export interface RegistrationRow {
  seed: number | null
  team: string | null
  name: string
  email: string | null
  city: string | null
  paymentStatus: string
  paymentMethod: string | null
  createdAt: Date
}

const PAYMENT: Record<string, string> = { PAID: "Pagato", FREE: "Gratis", PENDING: "Da pagare", CANCELLED: "Annullato", REFUNDED: "Rimborsato", FAILED: "Non riuscito" }

/** Quotes a cell; a leading = + - @ is defused so Excel never runs it as a formula. */
export function csvCell(v: string | number | null | undefined): string {
  let s = v == null ? "" : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function registrationsCsv(rows: RegistrationRow[]): string {
  const head = ["N.", "Coppia", "Giocatore", "Email", "Comune", "Pagamento", "Metodo", "Iscritto il"]
  const lines = rows.map((r, i) =>
    [
      r.seed ?? i + 1,
      r.team,
      r.name,
      r.email,
      r.city,
      PAYMENT[r.paymentStatus] ?? r.paymentStatus,
      r.paymentMethod === "ON_SITE" ? "Al campo" : r.paymentMethod,
      r.createdAt.toLocaleDateString("it-IT", { timeZone: "Europe/Rome" }),
    ].map(csvCell).join(";"),
  )
  return "﻿" + [head.join(";"), ...lines].join("\r\n")
}

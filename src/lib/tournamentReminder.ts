/* "Domani si gioca": the text of the reminder players get the day before a
   tournament. Pure, so the wording is tested; the cron sweep is in
   lib/tournamentReminders.ts. */

import { formatTime, hasTimeOfDay } from "@/lib/datetime"
import { formatPrice } from "@/lib/utils"

export interface ReminderInput {
  name: string
  date: Date
  location: string | null
  priceCents: number | null
  priceCurrency?: string | null
  /** Paid at the court (club tournaments). */
  paysOnSite: boolean
}

export interface ReminderReg {
  paymentStatus: string
  isSpectator: boolean
}

export function tournamentReminder(t: ReminderInput, reg: ReminderReg): { title: string; body: string } {
  const when = hasTimeOfDay(t.date) ? ` alle ${formatTime(t.date)}` : ""
  const where = t.location ? `, ${t.location}` : ""
  const owes = t.paysOnSite && !reg.isSpectator && (t.priceCents ?? 0) > 0 && reg.paymentStatus === "PENDING"
  const fee = owes ? ` Ricordati la quota: ${formatPrice(t.priceCents, t.priceCurrency ?? "EUR")}, al campo.` : ""
  return {
    title: `Domani: ${t.name}`,
    body: `Si gioca domani${when}${where}.${fee} Arriva 15 minuti prima per il check-in.`,
  }
}

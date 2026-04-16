import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function formatPrice(
  cents: number | null | undefined,
  currency = "EUR",
): string {
  if (cents == null) return "Gratis"
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
  }).format(cents / 100)
}

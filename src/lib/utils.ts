import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function winRate(won: number, lost: number): number {
  const total = won + lost
  if (total === 0) return 0
  return Math.round((won / total) * 100)
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

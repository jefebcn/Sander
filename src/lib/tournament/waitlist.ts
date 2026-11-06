/* Waiting list order (pure). A single player needs one free seat, a pair two:
   the first entry that fits gets in, so a pair waiting for two seats never
   blocks a single player behind it, and keeps its place for the next seat. */

export interface WaitlistEntry { partnerId: string | null }

export function seatsNeeded(e: WaitlistEntry): number {
  return e.partnerId ? 2 : 1
}

/** First entry (in list order) that fits in `freeSeats`, or null. */
export function nextToPromote<T extends WaitlistEntry>(entries: T[], freeSeats: number): T | null {
  return entries.find((e) => seatsNeeded(e) <= freeSeats) ?? null
}

import { dayKey } from "@/lib/datetime"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Scopri rules: limits, who may be shown to whom, whose turn it is.          */
/*                                                                             */
/*  Few likes make each one count: with unlimited likes people like everyone, */
/*  matches mean nothing and nobody writes. Eight a day, one Ace a week, and   */
/*  a cap on chats waiting for your reply keep the matches you have alive.     */
/*  Pure logic so it can be unit-tested.                                        */
/* ────────────────────────────────────────────────────────────────────────── */

export const FREE_LIKES_PER_DAY = 8
export const FREE_ACES_PER_WEEK = 1
/** SANDER+ members: unlimited likes, three Aces a week. */
export const PLUS_ACES_PER_WEEK = 3
/** Matches waiting for your reply before Scopri asks you to answer them first. */
export const YOUR_TURN_LIMIT = 5
/** A skipped player can come back after this many days. */
export const SKIP_COOLDOWN_DAYS = 30
export const MIN_AGE = 18
export const MAX_PHOTOS = 6
export const MIN_PHOTOS = 1
export const PROMPT_COUNT = 3
export const COMMENT_MAX = 200
export const ANSWER_MAX = 150
export const DUO_LIKES_PER_DAY = 5
export const DEFAULT_MAX_GAP = 300
export const MOTTO_MAX = 120

/** Extras bought with SanderCredits. */
export const SC_OFFERS = {
  likes: { id: "likes", amount: 5, sc: 15, title: "+5 like", text: "Per quando gli 8 di oggi non bastano" },
  ace: { id: "ace", amount: 1, sc: 25, title: "+1 Ace", text: "Il like che finisce in cima alla sua lista" },
  reveal: { id: "reveal", hours: 24, sc: 30, title: "Vedi tutti", text: "Tutti quelli che ti vogliono, per 24 ore" },
} as const

export type ScOfferId = keyof typeof SC_OFFERS

export type Role = "BLOCKER" | "DEFENDER"

/** Which allowance pays for the next like, or null when none is left. */
export function nextLikeSource(usedToday: number, bonus: number, plus = false): "free" | "bonus" | null {
  if (plus || usedToday < FREE_LIKES_PER_DAY) return "free"
  if (bonus > 0) return "bonus"
  return null
}

export function likesLeft(
  usedToday: number,
  bonus: number,
  plus = false,
): { free: number; bonus: number; total: number; unlimited: boolean } {
  const b = Math.max(0, bonus)
  // JSON has no Infinity: unlimited is a flag, total a large stand-in.
  if (plus) return { free: 999, bonus: b, total: 999, unlimited: true }
  const free = Math.max(0, FREE_LIKES_PER_DAY - usedToday)
  return { free, bonus: b, total: free + b, unlimited: false }
}

/** Which allowance pays for the next Ace, or null when none is left. */
export function nextAceSource(usedThisWeek: number, bonus: number, plus = false): "free" | "bonus" | null {
  if (usedThisWeek < (plus ? PLUS_ACES_PER_WEEK : FREE_ACES_PER_WEEK)) return "free"
  if (bonus > 0) return "bonus"
  return null
}

export function acesLeft(usedThisWeek: number, bonus: number, plus = false): number {
  return Math.max(0, (plus ? PLUS_ACES_PER_WEEK : FREE_ACES_PER_WEEK) - usedThisWeek) + Math.max(0, bonus)
}

/** Is a SANDER+ membership active at `now`? */
export function isPlus(plusUntil: Date | null | undefined, now: Date = new Date()): boolean {
  return !!plusUntil && plusUntil > now
}

/** SANDER+ for a week paid with SC: for a tournament weekend, without a subscription. */
export const PLUS_PASS = { days: 7, sc: 40 } as const

/** When SANDER+ ends: the later of the subscription and a pass bought with SC. */
export function plusEnd(p: { plusUntil?: Date | null; plusPassUntil?: Date | null } | null | undefined): Date | null {
  const sub = p?.plusUntil ?? null
  const pass = p?.plusPassUntil ?? null
  if (!sub || !pass) return sub ?? pass
  return sub > pass ? sub : pass
}

/** A pass bought while one is running adds its days after the current one. */
export function extendPass(current: Date | null | undefined, now: Date, days: number = PLUS_PASS.days): Date {
  const from = current && current > now ? current : now
  return new Date(from.getTime() + days * 86_400_000)
}

/** Days (Rome calendar) on which the free daily likes ran out. */
export function daysAtLikeLimit(likes: Date[], limit: number = FREE_LIKES_PER_DAY): number {
  const perDay = new Map<string, number>()
  for (const d of likes) perDay.set(dayKey(d), (perDay.get(dayKey(d)) ?? 0) + 1)
  return [...perDay.values()].filter((n) => n >= limit).length
}

/** Age in whole years on the Rome calendar day of `now`. */
export function ageOn(birthDate: Date, now: Date = new Date()): number {
  const b = birthDate.toISOString().slice(0, 10).split("-").map(Number)
  const n = dayKey(now).split("-").map(Number)
  let age = n[0] - b[0]
  if (n[1] < b[1] || (n[1] === b[1] && n[2] < b[2])) age--
  return age
}

export interface ReadinessInput {
  photos: number
  hasAvatar: boolean
  prompts: number
  birthDate: Date | null
  homeCity: string | null
}

export type MissingStep = "photo" | "prompts" | "birthDate" | "adult" | "city"

/** What is still missing before someone can appear on (and use) Scopri. */
export function missingSteps(p: ReadinessInput, now: Date = new Date()): MissingStep[] {
  const out: MissingStep[] = []
  if (p.photos + (p.photos === 0 && p.hasAvatar ? 1 : 0) < MIN_PHOTOS) out.push("photo")
  if (p.prompts < PROMPT_COUNT) out.push("prompts")
  if (!p.birthDate) out.push("birthDate")
  else if (ageOn(p.birthDate, now) < MIN_AGE) out.push("adult")
  if (!p.homeCity) out.push("city")
  return out
}

export interface DealbreakerSide {
  homeCity: string | null
  gender: string | null
  role: Role
  rating: number
  prefCities: string[]
  prefGender: string | null
  prefRole: Role | null
  maxGap: number
  /** "Aperto a conoscersi" (see meetCompatible). */
  openToMeet?: boolean
  showMe?: string | null
  /** Deck limited to people who fit "aperto a conoscersi" both ways. */
  meetOnly?: boolean
}

/* "Aperto a conoscersi": playing comes first for everyone, and some people are
   also open to something more. That side shows only between two people who are
   both open and each fit the other's "mostrami"; to everyone else nothing about
   it is visible, so nobody gets flirted at in a sports app without asking. */

export const SHOW_ME = [
  { key: "DONNE", label: "Donne" },
  { key: "UOMINI", label: "Uomini" },
  { key: "TUTTI", label: "Tutti" },
] as const
export type ShowMe = (typeof SHOW_ME)[number]["key"]
export const SHOW_ME_KEYS = SHOW_ME.map((s) => s.key) as [ShowMe, ...ShowMe[]]

/** Does `gender` (Player.gender: "Uomo" | "Donna" | "Altro" | null) fit `showMe`? */
export function showMeAccepts(showMe: string | null | undefined, gender: string | null): boolean {
  if (showMe === "TUTTI") return true
  if (showMe === "DONNE") return gender === "Donna"
  if (showMe === "UOMINI") return gender === "Uomo"
  return false
}

/** Both open to meeting, and each one is someone the other would like to meet. */
export function meetCompatible(a: DealbreakerSide, b: DealbreakerSide): boolean {
  return (
    !!a.openToMeet &&
    !!b.openToMeet &&
    showMeAccepts(a.showMe, b.gender) &&
    showMeAccepts(b.showMe, a.gender)
  )
}

/** Does `other` meet every dealbreaker `viewer` set? */
export function meetsDealbreakers(viewer: DealbreakerSide, other: DealbreakerSide): boolean {
  if (viewer.prefCities.length > 0 && (!other.homeCity || !viewer.prefCities.includes(other.homeCity))) return false
  if (viewer.prefGender && other.gender !== viewer.prefGender) return false
  if (viewer.prefRole && other.role !== viewer.prefRole) return false
  if (Math.abs(viewer.rating - other.rating) > viewer.maxGap) return false
  return true
}

/** Two players are shown to each other only if each meets the other's dealbreakers. */
export function mutuallyEligible(a: DealbreakerSide, b: DealbreakerSide): boolean {
  if ((a.meetOnly || b.meetOnly) && !meetCompatible(a, b)) return false
  return meetsDealbreakers(a, b) && meetsDealbreakers(b, a)
}

/** Does an existing swipe still keep `to` out of `from`'s deck? Likes do; skips expire. */
export function swipeHides(row: { liked: boolean; createdAt: Date }, now: Date = new Date()): boolean {
  if (row.liked) return true
  return now.getTime() - row.createdAt.getTime() < SKIP_COOLDOWN_DAYS * 86_400_000
}

export type ChatTurn = "nuovo" | "tocca-a-te" | "in-attesa"

/**
 * State of a match's chat for `meId`: nobody wrote yet, the other wrote last
 * (your turn), or you wrote last (waiting).
 */
export function chatTurn(lastSenderId: string | null, meId: string): ChatTurn {
  if (!lastSenderId) return "nuovo"
  return lastSenderId === meId ? "in-attesa" : "tocca-a-te"
}

/** Matches that count against YOUR_TURN_LIMIT: brand new ones and those waiting on you. */
export function waitingOnMe(turns: ChatTurn[]): number {
  return turns.filter((t) => t !== "in-attesa").length
}

function shorten(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim()
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t
}

/**
 * The chat line a like's comment becomes once it's a match, saying what was
 * liked. No comment, no line.
 */
export function likeMessage(target: "PROFILE" | "PHOTO" | "PROMPT", label: string | null, comment: string | null): string | null {
  const c = comment?.trim()
  if (!c) return null
  if (target === "PROMPT" && label) return `Sul tuo «${shorten(label, 90)}»: ${c}`
  if (target === "PHOTO") return `Sulla tua foto: ${c}`
  return c
}

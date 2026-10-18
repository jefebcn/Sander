// Client-side shapes of what the Scopri server helpers return.
export type { ScopriCard, MatchRow, IncomingLike, Allowance, MiniPlayer } from "@/lib/scopri/server"
export type { DuoCard, DuoMember, DuoMatchRow, IncomingDuoLike } from "@/lib/scopri/duos"

export type LikeTarget =
  | { kind: "PROFILE" }
  | { kind: "PHOTO"; id: string; url: string }
  | { kind: "PROMPT"; id: string; question: string; answer: string }

export interface GroupGame {
  id: string
  title: string
  location: string
  date: string
  missing: number
  maxPlayers: number
  faces: { name: string; avatarUrl: string | null }[]
}

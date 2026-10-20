/* ────────────────────────────────────────────────────────────────────────── */
/*  Photo verification: a live selfie with a gesture we pick, compared by an   */
/*  admin with the Scopri photos. The gesture changes every day and is         */
/*  computed, not chosen, so an old photo of someone else won't pass.          */
/*  Pure logic — usable client + server, unit-testable.                        */
/* ────────────────────────────────────────────────────────────────────────── */

export const SELFIE_GESTURES = [
  { key: "PEACE", emoji: "✌️", text: "Fai il segno di vittoria accanto al viso" },
  { key: "THUMB", emoji: "👍", text: "Pollice in su accanto alla guancia" },
  { key: "OPEN_HAND", emoji: "🖐️", text: "Mano aperta accanto al viso" },
  { key: "EAR", emoji: "👂", text: "Tocca l'orecchio con una mano" },
  { key: "FIST_CHIN", emoji: "✊", text: "Pugno sotto il mento" },
  { key: "THREE", emoji: "🤟", text: "Mostra tre dita accanto al viso" },
] as const

export type SelfieGesture = (typeof SELFIE_GESTURES)[number]

/** Attempts per day, so the admin queue can't be flooded. */
export const SELFIE_ATTEMPTS_PER_DAY = 3

/** The gesture `playerId` must make today (`day` = Rome YYYY-MM-DD). */
export function gestureFor(playerId: string, day: string): SelfieGesture {
  let h = 2166136261
  for (const ch of `${playerId}:${day}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return SELFIE_GESTURES[(h >>> 0) % SELFIE_GESTURES.length]
}

export function gestureByKey(key: string): SelfieGesture | undefined {
  return SELFIE_GESTURES.find((g) => g.key === key)
}

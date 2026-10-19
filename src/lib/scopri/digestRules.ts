/* ────────────────────────────────────────────────────────────────────────── */
/*  Scopri reminders: when to send one and what it says. Pure, testable.       */
/*  Two audiences: players already on Scopri hear about newcomers in their    */
/*  comune (at most daily); players not on it yet hear how many in their      */
/*  comune already are (at most weekly, only once enough people are there).   */
/* ────────────────────────────────────────────────────────────────────────── */

export const NEWCOMER_EVERY_H = 20
export const INVITE_EVERY_H = 7 * 24
/** Don't invite people to an empty room. */
export const INVITE_MIN_POOL = 3

export function canNudge(last: Date | null | undefined, now: Date, everyHours: number): boolean {
  return !last || now.getTime() - last.getTime() >= everyHours * 3600_000
}

export function newcomerMessage(count: number, city: string) {
  return {
    title: count === 1 ? `Un nuovo giocatore a ${city} su Scopri` : `${count} nuovi giocatori a ${city} su Scopri`,
    body: "Guarda chi è arrivato: magari è il compagno che cerchi.",
    url: "/scopri",
  }
}

export function inviteMessage(pool: number, city: string) {
  return {
    title: `${pool} giocatori di ${city} sono su Scopri`,
    body: "Crea il tuo profilo in un minuto: una foto e tre risposte, e trovi con chi giocare.",
    url: "/onboarding/scopri",
  }
}

/** "Tocca a te" fires when the other wrote this long ago and you never replied. */
export const TURN_AFTER_H = 24
/** A pending pair challenge is recalled once after this long. */
export const DUO_REMIND_AFTER_H = 24

/** Remind about a chat only once per unanswered message. */
export function turnNeedsReminder(
  last: { senderId: string; createdAt: Date } | null,
  meId: string,
  nudgedAt: Date | null,
  now: Date,
): boolean {
  if (!last || last.senderId === meId) return false
  if (now.getTime() - last.createdAt.getTime() < TURN_AFTER_H * 3600_000) return false
  return !nudgedAt || nudgedAt < last.createdAt
}

export function dailyPickMessage(name: string, reasons: string[]) {
  return {
    title: `Il più compatibile di oggi: ${name}`,
    body: reasons.length ? reasons.slice(0, 2).join(" · ") : "Scelto per voi due tra tutti i giocatori di Scopri.",
    url: "/scopri",
  }
}

export function turnMessage(name: string) {
  return { title: `Tocca a te con ${name}`, body: "Ti ha scritto ieri: una risposta e organizzate la partita.", url: "/scopri/match" }
}

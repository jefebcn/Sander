"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { canManageClub } from "@/lib/clubAccess"
import { clashMessage, courtCount, eventRange, findClash, MAX_EVENT_HOURS } from "@/lib/clubCalendar"
import { ClubEventIdSchema, ClubEventSchema } from "@/lib/validators/club.schema"

type Result = { ok: true } | { ok: false; error: string }

function errorOf(e: unknown): string {
  if (e && typeof e === "object" && "issues" in e) {
    return (e as { issues: { message: string }[] }).issues[0]?.message ?? "Dati non validi"
  }
  return e instanceof Error ? e.message : "Qualcosa è andato storto, riprova"
}

/** Adds an entry to the club's calendar: club staff only, no double booking of a court. */
export async function createClubEvent(input: unknown): Promise<Result> {
  try {
    const data = ClubEventSchema.parse(input)
    const [session, me] = await Promise.all([getCurrentSession(), getCurrentPlayer()])
    if (!me) return { ok: false, error: "Accedi di nuovo" }
    if (!(await canManageClub(session?.user?.email, me.id, data.clubId))) return { ok: false, error: "Solo lo staff del club può farlo" }

    const club = await db.club.findUnique({ where: { id: data.clubId }, select: { courts: true } })
    if (!club) return { ok: false, error: "Club non trovato" }
    if (data.court !== null && data.court > courtCount(club.courts)) return { ok: false, error: "Questo campo non esiste: controlla quanti campi ha il club" }

    const { startsAt, endsAt } = eventRange(data.day, data.start, data.end)
    if (endsAt <= startsAt) return { ok: false, error: "L'ora di fine deve venire dopo quella di inizio" }
    if (endsAt.getTime() - startsAt.getTime() > MAX_EVENT_HOURS * 3_600_000) return { ok: false, error: `Massimo ${MAX_EVENT_HOURS} ore` }

    const sameTime = await db.clubEvent.findMany({
      where: { clubId: data.clubId, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
      select: { id: true, kind: true, title: true, startsAt: true, endsAt: true, court: true },
    })
    const clash = findClash({ startsAt, endsAt, court: data.court }, sameTime)
    if (clash) return { ok: false, error: clashMessage(clash) }

    await db.clubEvent.create({
      data: { clubId: data.clubId, kind: data.kind, title: data.title, startsAt, endsAt, court: data.court, note: data.note || null, createdById: me.id },
    })
    revalidatePath("/profile")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: errorOf(e) }
  }
}

/** Removes an entry from the calendar (club staff). */
export async function deleteClubEvent(input: unknown): Promise<Result> {
  try {
    const { id } = ClubEventIdSchema.parse(input)
    const [session, me] = await Promise.all([getCurrentSession(), getCurrentPlayer()])
    if (!me) return { ok: false, error: "Accedi di nuovo" }
    const ev = await db.clubEvent.findUnique({ where: { id }, select: { clubId: true } })
    if (!ev) return { ok: false, error: "Già eliminato" }
    if (!(await canManageClub(session?.user?.email, me.id, ev.clubId))) return { ok: false, error: "Solo lo staff del club può farlo" }
    await db.clubEvent.delete({ where: { id } })
    revalidatePath("/profile")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: errorOf(e) }
  }
}

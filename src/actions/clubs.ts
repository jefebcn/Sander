"use server"

import { randomBytes } from "node:crypto"
import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { db } from "@/lib/db"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { canManageClub, isClubOwner } from "@/lib/clubAccess"
import { CLUB_MESSAGES_PER_DAY, clubSlug, freeSlug, instagramHandle } from "@/lib/club"
import { notifyAdmins } from "@/lib/adminNotify"
import { notifyPlayer, notifyPlayers } from "@/lib/push"
import { ClubFieldsSchema, ClubIdSchema, ClubMessageSchema, ClubStatusSchema, CreateCircuitSchema, FollowClubSchema, RemoveStaffSchema, SetTournamentCircuitSchema, StaffInviteTokenSchema, UpdateClubSchema } from "@/lib/validators/club.schema"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Clubs: a player requests one, a SANDER admin approves it, its staff runs   */
/*  tournaments. Public endpoints: each validates input and checks the role.   */
/* ────────────────────────────────────────────────────────────────────────── */

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string }

function errorOf(e: unknown): string {
  if (e && typeof e === "object" && "issues" in e) {
    const first = (e as { issues: { message: string }[] }).issues[0]
    return first?.message ?? "Dati non validi"
  }
  return e instanceof Error ? e.message : "Qualcosa è andato storto, riprova"
}

function cleanFields(data: ReturnType<typeof ClubFieldsSchema.parse>) {
  return { ...data, instagram: instagramHandle(data.instagram) }
}

/** "Sei una società?": the request lands with the admins, the requester becomes owner. */
export async function requestClub(input: unknown): Promise<Result<{ slug: string }>> {
  try {
    const me = await getCurrentPlayer()
    if (!me) return { ok: false, error: "Accedi per iscrivere la tua società" }
    const data = cleanFields(ClubFieldsSchema.parse(input))
    const pending = await db.club.count({ where: { status: "PENDING", members: { some: { playerId: me.id, role: "OWNER" } } } })
    if (pending > 0) return { ok: false, error: "Hai già una richiesta in attesa: ti avvisiamo appena è approvata" }

    const base = clubSlug(data.name)
    const taken = await db.club.findMany({ where: { slug: { startsWith: base || "club" } }, select: { slug: true } })
    const slug = freeSlug(base, taken.map((t) => t.slug))
    await db.club.create({
      data: { ...data, slug, members: { create: { playerId: me.id, role: "OWNER" } } },
    })
    await notifyAdmins({ title: "Nuovo club da approvare", body: `${data.name} · ${data.city}`, url: "/admin/club" })
    revalidatePath("/admin/club")
    return { ok: true, slug }
  } catch (e) {
    return { ok: false, error: errorOf(e) }
  }
}

/** Admin: approve, reject or suspend a club. The owner hears about it. */
export async function adminSetClubStatus(input: unknown): Promise<Result> {
  try {
    const session = await getCurrentSession()
    if (!isAdminEmail(session?.user?.email)) return { ok: false, error: "Non autorizzato" }
    const { clubId, status } = ClubStatusSchema.parse(input)
    const club = await db.club.update({
      where: { id: clubId },
      data: { status, ...(status === "APPROVED" ? { approvedAt: new Date() } : {}) },
      select: { slug: true, name: true, members: { where: { role: "OWNER" }, select: { playerId: true } } },
    })
    const notice =
      status === "APPROVED"
        ? { title: `${club.name} è su SANDER`, body: "Il club è approvato: crea il primo torneo dalla pagina del club.", url: `/c/${club.slug}/gestione` }
        : status === "REJECTED"
          ? { title: "Richiesta club non approvata", body: `${club.name}: scrivici se pensi sia un errore.`, url: "/club" }
          : { title: "Club sospeso", body: `${club.name}: scrivici per chiarire.`, url: "/club" }
    for (const m of club.members) await notifyPlayer(m.playerId, notice).catch(() => {})
    revalidatePath("/admin/club")
    revalidatePath(`/c/${club.slug}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: errorOf(e) }
  }
}

/** Club staff (or an admin) edit the club's page. */
export async function updateClub(input: unknown): Promise<Result> {
  try {
    const session = await getCurrentSession()
    const me = await getCurrentPlayer()
    const { clubId, ...fields } = UpdateClubSchema.parse(input)
    if (!(await canManageClub(session?.user?.email, me?.id ?? null, clubId))) return { ok: false, error: "Non autorizzato" }
    const club = await db.club.update({ where: { id: clubId }, data: cleanFields(fields), select: { slug: true } })
    revalidatePath(`/c/${club.slug}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: errorOf(e) }
  }
}

/** Follow a club: its new tournaments arrive as notifications. */
export async function followClub(input: unknown): Promise<Result> {
  try {
    const me = await getCurrentPlayer()
    if (!me) return { ok: false, error: "Accedi per seguire il club" }
    const { clubId, follow } = FollowClubSchema.parse(input)
    const club = await db.club.findFirst({ where: { id: clubId, status: "APPROVED" }, select: { slug: true } })
    if (!club) return { ok: false, error: "Club non trovato" }
    if (follow) {
      await db.clubFollow.upsert({
        where: { clubId_playerId: { clubId, playerId: me.id } },
        create: { clubId, playerId: me.id },
        update: {},
      })
    } else {
      await db.clubFollow.deleteMany({ where: { clubId, playerId: me.id } })
    }
    revalidatePath(`/c/${club.slug}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: errorOf(e) }
  }
}

/** A season series of the club's tournaments, with an overall standings table. */
export async function createCircuit(input: unknown): Promise<Result<{ id: string }>> {
  try {
    const session = await getCurrentSession()
    const me = await getCurrentPlayer()
    const { clubId, name } = CreateCircuitSchema.parse(input)
    if (!(await canManageClub(session?.user?.email, me?.id ?? null, clubId))) return { ok: false, error: "Non autorizzato" }
    const c = await db.clubCircuit.create({ data: { clubId, name }, select: { id: true, club: { select: { slug: true } } } })
    revalidatePath(`/c/${c.club.slug}`)
    revalidatePath(`/c/${c.club.slug}/gestione`)
    return { ok: true, id: c.id }
  } catch (e) {
    return { ok: false, error: errorOf(e) }
  }
}

/** Make a club tournament a stage of one of the club's circuits (or none). */
export async function setTournamentCircuit(input: unknown): Promise<Result> {
  try {
    const session = await getCurrentSession()
    const me = await getCurrentPlayer()
    const { tournamentId, circuitId } = SetTournamentCircuitSchema.parse(input)
    const t = await db.tournament.findUnique({ where: { id: tournamentId }, select: { clubId: true, club: { select: { slug: true } } } })
    if (!t?.clubId || !(await canManageClub(session?.user?.email, me?.id ?? null, t.clubId))) return { ok: false, error: "Non autorizzato" }
    if (circuitId) {
      const c = await db.clubCircuit.findFirst({ where: { id: circuitId, clubId: t.clubId }, select: { id: true } })
      if (!c) return { ok: false, error: "Circuito non trovato" }
    }
    await db.tournament.update({ where: { id: tournamentId }, data: { circuitId } })
    if (t.club) {
      revalidatePath(`/c/${t.club.slug}`)
      revalidatePath(`/c/${t.club.slug}/gestione`)
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: errorOf(e) }
  }
}

/* ── Staff ─────────────────────────────────────────────────────────────── */

/** Owner: a link that adds whoever opens it to the staff. A new one replaces the old. */
export async function createStaffInvite(input: unknown): Promise<Result<{ token: string }>> {
  try {
    const session = await getCurrentSession()
    const me = await getCurrentPlayer()
    const clubId = ClubIdSchema.parse(input)
    if (!(await isClubOwner(session?.user?.email, me?.id ?? null, clubId))) return { ok: false, error: "Solo il proprietario del club può invitare lo staff" }
    const token = randomBytes(18).toString("base64url")
    await db.club.update({ where: { id: clubId }, data: { staffInviteToken: token } })
    return { ok: true, token }
  } catch (e) {
    return { ok: false, error: errorOf(e) }
  }
}

/** Opening the staff link: join the staff of an approved club. */
export async function acceptStaffInvite(input: unknown): Promise<Result<{ slug: string }>> {
  try {
    const me = await getCurrentPlayer()
    if (!me) return { ok: false, error: "Accedi per entrare nello staff" }
    const token = StaffInviteTokenSchema.parse(input)
    const club = await db.club.findFirst({
      where: { staffInviteToken: token },
      select: { id: true, slug: true, name: true, status: true, members: { where: { role: "OWNER" }, select: { playerId: true } } },
    })
    if (!club || club.status !== "APPROVED") return { ok: false, error: "Link non valido o scaduto: chiedine uno nuovo al club" }
    const existing = await db.clubMember.findUnique({ where: { clubId_playerId: { clubId: club.id, playerId: me.id } }, select: { id: true } })
    if (!existing) {
      await db.clubMember.create({ data: { clubId: club.id, playerId: me.id, role: "STAFF" } })
      for (const o of club.members) {
        await notifyPlayer(o.playerId, { title: `${me.name} è nello staff`, body: `Ora può gestire i tornei di ${club.name}.`, url: `/c/${club.slug}/gestione` }).catch(() => {})
      }
    }
    revalidatePath(`/c/${club.slug}/gestione`)
    return { ok: true, slug: club.slug }
  } catch (e) {
    return { ok: false, error: errorOf(e) }
  }
}

/** Owner: remove someone from the staff (never the owner). */
export async function removeStaffMember(input: unknown): Promise<Result> {
  try {
    const session = await getCurrentSession()
    const me = await getCurrentPlayer()
    const { clubId, playerId } = RemoveStaffSchema.parse(input)
    if (!(await isClubOwner(session?.user?.email, me?.id ?? null, clubId))) return { ok: false, error: "Solo il proprietario del club può togliere lo staff" }
    const { count } = await db.clubMember.deleteMany({ where: { clubId, playerId, role: "STAFF" } })
    if (count === 0) return { ok: false, error: "Persona non trovata nello staff" }
    const club = await db.club.findUnique({ where: { id: clubId }, select: { slug: true } })
    if (club) revalidatePath(`/c/${club.slug}/gestione`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: errorOf(e) }
  }
}

/* ── Messages ──────────────────────────────────────────────────────────── */

/**
 * Staff: a notification to the club's followers or to the players of one of
 * its tournaments ("Si inizia alle 10, portate i palloni"). A few per day, so
 * followers don't mute the club.
 */
export async function sendClubMessage(input: unknown): Promise<Result<{ sentTo: number }>> {
  try {
    const session = await getCurrentSession()
    const me = await getCurrentPlayer()
    const { clubId, tournamentId, body } = ClubMessageSchema.parse(input)
    if (!(await canManageClub(session?.user?.email, me?.id ?? null, clubId))) return { ok: false, error: "Non autorizzato" }
    const club = await db.club.findUnique({ where: { id: clubId }, select: { name: true, slug: true } })
    if (!club) return { ok: false, error: "Club non trovato" }

    const today = await db.clubMessage.count({ where: { clubId, createdAt: { gte: new Date(Date.now() - 24 * 3600_000) } } })
    if (today >= CLUB_MESSAGES_PER_DAY) return { ok: false, error: `Massimo ${CLUB_MESSAGES_PER_DAY} messaggi al giorno: riprova domani` }

    let recipients: string[]
    let url = `/c/${club.slug}`
    if (tournamentId) {
      const t = await db.tournament.findFirst({ where: { id: tournamentId, clubId }, select: { id: true } })
      if (!t) return { ok: false, error: "Torneo non trovato" }
      const regs = await db.tournamentRegistration.findMany({
        where: { tournamentId, paymentStatus: { notIn: ["CANCELLED", "FAILED", "REFUNDED"] } },
        select: { playerId: true },
      })
      recipients = regs.map((r) => r.playerId)
      url = `/tournaments/${tournamentId}`
    } else {
      const follows = await db.clubFollow.findMany({ where: { clubId }, select: { playerId: true } })
      recipients = follows.map((f) => f.playerId)
    }
    recipients = [...new Set(recipients)].filter((id) => id !== me?.id)
    if (recipients.length === 0) return { ok: false, error: tournamentId ? "Nessun iscritto a cui scrivere" : "Il club non ha ancora follower" }

    await db.clubMessage.create({ data: { clubId, tournamentId, body, authorId: me?.id ?? null, sentTo: recipients.length } })
    // Delivery runs after the response: the staff member doesn't wait for every push.
    after(() => notifyPlayers(recipients, { title: club.name, body, url }))
    revalidatePath(`/c/${club.slug}/gestione`)
    return { ok: true, sentTo: recipients.length }
  } catch (e) {
    return { ok: false, error: errorOf(e) }
  }
}

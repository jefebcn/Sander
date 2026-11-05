"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { canManageClub } from "@/lib/clubAccess"
import { clubSlug, freeSlug, instagramHandle } from "@/lib/club"
import { notifyAdmins } from "@/lib/adminNotify"
import { notifyPlayer } from "@/lib/push"
import { ClubFieldsSchema, ClubStatusSchema, FollowClubSchema, UpdateClubSchema } from "@/lib/validators/club.schema"

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

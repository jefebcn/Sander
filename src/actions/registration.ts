"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { canManageTournament } from "@/lib/isAdmin"
import { stripe, getAppUrl } from "@/lib/stripe"
import {
  StartCheckoutSchema,
  CreateManualPaymentSchema,
  AdminConfirmManualPaymentSchema,
  AdminRejectManualPaymentSchema,
  CancelRegistrationSchema,
  GetTournamentForRegistrationSchema,
  AdminSetSkillLevelSchema,
} from "@/lib/validators/registration.schema"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ""

async function requireAdmin() {
  const session = await getCurrentSession()
  if (!session?.user?.id) throw new Error("Non autenticato")
  if (!ADMIN_EMAIL || session.user.email !== ADMIN_EMAIL) {
    throw new Error("Accesso non autorizzato")
  }
}

async function requireCurrentPlayer() {
  const session = await getCurrentSession()
  if (!session?.user?.id) throw new Error("Non autenticato")
  const player = await db.player.findUnique({ where: { userId: session.user.id } })
  if (!player) throw new Error("Profilo giocatore non trovato")
  return player
}

async function assertRegistrable(tournamentId: string) {
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      id: true,
      name: true,
      status: true,
      priceCents: true,
      priceCurrency: true,
      isOpenForRegistration: true,
      registrationDeadline: true,
    },
  })
  if (!tournament) throw new Error("Torneo non trovato")
  if (!tournament.isOpenForRegistration) throw new Error("Iscrizioni non aperte per questo torneo")
  if (tournament.status !== "DRAFT") throw new Error("Torneo non più in fase di iscrizione")
  if (tournament.registrationDeadline && tournament.registrationDeadline.getTime() < Date.now()) {
    throw new Error("Iscrizioni chiuse: deadline superata")
  }
  return tournament
}

// ───────────────────────────── startCheckout ─────────────────────────────────

export async function startCheckout(input: unknown): Promise<
  { ok: true; redirectUrl: string } | { ok: false; error: string }
> {
  try {
    const { tournamentId, skillLevel } = StartCheckoutSchema.parse(input)
    const player = await requireCurrentPlayer()
    const tournament = await assertRegistrable(tournamentId)

    // Already registered? Look up existing row.
    const existing = await db.tournamentRegistration.findUnique({
      where: { tournamentId_playerId: { tournamentId, playerId: player.id } },
    })

    if (existing) {
      if (existing.paymentStatus === "PAID" || existing.paymentStatus === "FREE") {
        return { ok: false, error: "Sei già iscritto a questo torneo" }
      }
      if (existing.paymentStatus === "PENDING" && existing.stripeSessionId) {
        // Reuse existing Stripe Checkout session
        try {
          const session = await stripe.checkout.sessions.retrieve(existing.stripeSessionId)
          if (session.status === "open" && session.url) {
            return { ok: true, redirectUrl: session.url }
          }
        } catch {
          // Stripe session gone — fall through to create a new one
        }
        // Expired or missing: delete stale row, create fresh
        await db.tournamentRegistration.delete({ where: { id: existing.id } }).catch(() => {})
      } else if (existing.paymentStatus === "PENDING") {
        if (existing.paymentMethod === "CASH") {
          return { ok: false, error: "Hai già scelto il pagamento in contanti" }
        }
        // PENDING+null (registered, no method yet): delete to allow Stripe flow
        await db.tournamentRegistration.delete({ where: { id: existing.id } }).catch(() => {})
      }
    }

    // Free tournament — skip Stripe entirely
    if (tournament.priceCents == null || tournament.priceCents === 0) {
      await db.tournamentRegistration.create({
        data: {
          tournamentId,
          playerId: player.id,
          paymentStatus: "PAID",
          paymentMethod: "FREE",
          paidAt: new Date(),
          amountPaidCents: 0,
          skillLevel: skillLevel ?? null,
        },
      })
      revalidatePath("/tournaments")
      revalidatePath(`/tournaments/${tournamentId}`)
      return { ok: true, redirectUrl: `/tournaments/${tournamentId}/register/success` }
    }

    // Paid flow: create PENDING row first (DB unique constraint is our race guard)
    const registration = await db.tournamentRegistration.create({
      data: {
        tournamentId,
        playerId: player.id,
        paymentStatus: "PENDING",
        paymentMethod: "STRIPE",
        skillLevel: skillLevel ?? null,
      },
    })

    const appUrl = getAppUrl()

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: tournament.priceCurrency.toLowerCase(),
            unit_amount: tournament.priceCents,
            product_data: {
              name: `Iscrizione torneo — ${tournament.name}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        tournamentId,
        playerId: player.id,
        registrationId: registration.id,
      },
      client_reference_id: registration.id,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minuti
      success_url: `${appUrl}/tournaments/${tournamentId}/register/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${appUrl}/tournaments/${tournamentId}/register/cancel?registration_id=${registration.id}`,
    })

    // Store session id for webhook + idempotent re-use
    await db.tournamentRegistration.update({
      where: { id: registration.id },
      data: { stripeSessionId: checkoutSession.id },
    })

    if (!checkoutSession.url) {
      // Roll back the pending row if we couldn't get a URL
      await db.tournamentRegistration.delete({ where: { id: registration.id } }).catch(() => {})
      throw new Error("URL di checkout mancante")
    }

    return { ok: true, redirectUrl: checkoutSession.url }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// ─────────────────────── createPaypalRegistration ────────────────────────────

export async function createPaypalRegistration(input: unknown): Promise<
  { ok: true; registrationId: string } | { ok: false; error: string }
> {
  try {
    const { tournamentId, skillLevel } = CreateManualPaymentSchema.parse(input)
    const player = await requireCurrentPlayer()
    const tournament = await assertRegistrable(tournamentId)

    const existing = await db.tournamentRegistration.findUnique({
      where: { tournamentId_playerId: { tournamentId, playerId: player.id } },
    })
    if (existing) {
      if (existing.paymentStatus === "PAID" || existing.paymentStatus === "FREE") {
        return { ok: false, error: "Sei già iscritto a questo torneo" }
      }
      if (existing.paymentStatus === "PENDING") {
        const updates: { paymentMethod?: string; skillLevel?: number } = {}
        if (existing.paymentMethod !== "PAYPAL") updates.paymentMethod = "PAYPAL"
        if (skillLevel != null && existing.skillLevel !== skillLevel) updates.skillLevel = skillLevel
        if (Object.keys(updates).length > 0) {
          await db.tournamentRegistration.update({
            where: { id: existing.id },
            data: updates,
          })
          revalidatePath(`/tournaments/${tournamentId}`)
        }
        return { ok: true, registrationId: existing.id }
      }
    }

    const isFree = tournament.priceCents == null || tournament.priceCents === 0

    const registration = await db.tournamentRegistration.create({
      data: {
        tournamentId,
        playerId: player.id,
        paymentStatus: isFree ? "PAID" : "PENDING",
        paymentMethod: isFree ? "FREE" : "PAYPAL",
        paidAt: isFree ? new Date() : null,
        amountPaidCents: isFree ? 0 : null,
        skillLevel: skillLevel ?? null,
      },
    })

    revalidatePath("/tournaments")
    revalidatePath(`/tournaments/${tournamentId}`)
    return { ok: true, registrationId: registration.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// ─────────────────────── createManualPaymentRegistration ─────────────────────

export async function createManualPaymentRegistration(input: unknown): Promise<
  { ok: true; registrationId: string } | { ok: false; error: string }
> {
  try {
    const { tournamentId, skillLevel } = CreateManualPaymentSchema.parse(input)
    const player = await requireCurrentPlayer()
    const tournament = await assertRegistrable(tournamentId)

    const existing = await db.tournamentRegistration.findUnique({
      where: { tournamentId_playerId: { tournamentId, playerId: player.id } },
    })
    if (existing) {
      if (existing.paymentStatus === "PAID" || existing.paymentStatus === "FREE") {
        return { ok: false, error: "Sei già iscritto a questo torneo" }
      }
      if (existing.paymentStatus === "PENDING") {
        const updates: { paymentMethod?: string; skillLevel?: number } = {}
        if (existing.paymentMethod !== "CASH") updates.paymentMethod = "CASH"
        if (skillLevel != null && existing.skillLevel !== skillLevel) updates.skillLevel = skillLevel
        if (Object.keys(updates).length > 0) {
          await db.tournamentRegistration.update({
            where: { id: existing.id },
            data: updates,
          })
          revalidatePath(`/tournaments/${tournamentId}`)
        }
        return { ok: true, registrationId: existing.id }
      }
    }

    // Free tournament: treat as FREE, not cash
    const isFree = tournament.priceCents == null || tournament.priceCents === 0

    const registration = await db.tournamentRegistration.create({
      data: {
        tournamentId,
        playerId: player.id,
        paymentStatus: isFree ? "PAID" : "PENDING",
        paymentMethod: isFree ? "FREE" : "CASH",
        paidAt: isFree ? new Date() : null,
        amountPaidCents: isFree ? 0 : null,
        skillLevel: skillLevel ?? null,
      },
    })

    revalidatePath("/tournaments")
    revalidatePath(`/tournaments/${tournamentId}`)
    return { ok: true, registrationId: registration.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// ────────────────────────── registerForTournament ────────────────────────────
// Step-1 of the two-step flow: add player to the list, payment comes later.

export async function registerForTournament(input: unknown): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    const { tournamentId, skillLevel } = StartCheckoutSchema.parse(input)
    const player = await requireCurrentPlayer()
    const tournament = await assertRegistrable(tournamentId)

    const existing = await db.tournamentRegistration.findUnique({
      where: { tournamentId_playerId: { tournamentId, playerId: player.id } },
    })
    if (existing) {
      if (existing.paymentStatus === "PAID" || existing.paymentStatus === "FREE") {
        return { ok: false, error: "Sei già iscritto a questo torneo" }
      }
      // Already registered (PENDING) — update skill level if provided and changed
      if (skillLevel != null && existing.skillLevel !== skillLevel) {
        await db.tournamentRegistration.update({
          where: { id: existing.id },
          data: { skillLevel },
        })
        revalidatePath(`/tournaments/${tournamentId}`)
      }
      return { ok: true }
    }

    const isFree = tournament.priceCents == null || tournament.priceCents === 0

    await db.tournamentRegistration.create({
      data: {
        tournamentId,
        playerId: player.id,
        paymentStatus: isFree ? "PAID" : "PENDING",
        paymentMethod: isFree ? "FREE" : null,
        paidAt: isFree ? new Date() : null,
        amountPaidCents: isFree ? 0 : null,
        skillLevel: skillLevel ?? null,
      },
    })

    revalidatePath("/tournaments")
    revalidatePath(`/tournaments/${tournamentId}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// ──────────────────────── adminConfirmManualPayment ──────────────────────────

export async function adminConfirmManualPayment(input: unknown) {
  await requireAdmin()
  const { registrationId, notes } = AdminConfirmManualPaymentSchema.parse(input)

  const reg = await db.tournamentRegistration.findUnique({
    where: { id: registrationId },
    include: { tournament: { select: { id: true, priceCents: true } } },
  })
  if (!reg) throw new Error("Iscrizione non trovata")
  if (reg.paymentStatus !== "PENDING" || (reg.paymentMethod !== "CASH" && reg.paymentMethod !== "PAYPAL")) {
    throw new Error("Iscrizione non in attesa di conferma")
  }

  await db.tournamentRegistration.update({
    where: { id: registrationId },
    data: {
      paymentStatus: "PAID",
      paidAt: new Date(),
      amountPaidCents: reg.tournament.priceCents ?? 0,
      adminNotes: notes ?? null,
    },
  })

  revalidatePath("/admin/payments")
  revalidatePath(`/tournaments/${reg.tournamentId}`)
}

export async function adminRejectManualPayment(input: unknown) {
  await requireAdmin()
  const { registrationId } = AdminRejectManualPaymentSchema.parse(input)

  const reg = await db.tournamentRegistration.findUnique({ where: { id: registrationId } })
  if (!reg) throw new Error("Iscrizione non trovata")
  if (reg.paymentStatus !== "PENDING") throw new Error("Iscrizione non in attesa")

  await db.tournamentRegistration.update({
    where: { id: registrationId },
    data: { paymentStatus: "CANCELLED" },
  })

  revalidatePath("/admin/payments")
  revalidatePath(`/tournaments/${reg.tournamentId}`)
}

// ──────────────────────────── adminSetPaymentStatus ──────────────────────────

export async function adminSetPaymentStatus(registrationId: string, paid: boolean) {
  await requireAdmin()

  const reg = await db.tournamentRegistration.findUnique({
    where: { id: registrationId },
    select: { tournamentId: true, paymentStatus: true, tournament: { select: { priceCents: true } } },
  })
  if (!reg) throw new Error("Iscrizione non trovata")

  if (paid) {
    await db.tournamentRegistration.update({
      where: { id: registrationId },
      data: {
        paymentStatus: "PAID",
        paymentMethod: "CASH",
        paidAt: new Date(),
        amountPaidCents: reg.tournament.priceCents ?? 0,
      },
    })
  } else {
    await db.tournamentRegistration.update({
      where: { id: registrationId },
      data: { paymentStatus: "PENDING", paymentMethod: "CASH", paidAt: null, amountPaidCents: null },
    })
  }

  revalidatePath(`/tournaments/${reg.tournamentId}`)
  revalidatePath("/admin/payments")
}

// ──────────────────────── adminSetRegistrationSkillLevel ─────────────────────

export async function adminSetRegistrationSkillLevel(input: unknown) {
  const { registrationId, skillLevel } = AdminSetSkillLevelSchema.parse(input)

  const reg = await db.tournamentRegistration.findUnique({
    where: { id: registrationId },
    select: { tournamentId: true },
  })
  if (!reg) throw new Error("Iscrizione non trovata")

  const session = await getCurrentSession()
  if (!session?.user?.id) throw new Error("Non autenticato")
  const allowed = await canManageTournament(session.user.email, reg.tournamentId)
  if (!allowed) throw new Error("Accesso non autorizzato")

  await db.tournamentRegistration.update({
    where: { id: registrationId },
    data: { skillLevel },
  })

  revalidatePath(`/tournaments/${reg.tournamentId}`)
  revalidatePath("/admin/payments")
}

// ──────────────────────────── cancelRegistration ─────────────────────────────

export async function cancelRegistration(input: unknown) {
  const player = await requireCurrentPlayer()
  const { registrationId } = CancelRegistrationSchema.parse(input)

  const reg = await db.tournamentRegistration.findUnique({ where: { id: registrationId } })
  if (!reg) throw new Error("Iscrizione non trovata")
  if (reg.playerId !== player.id) throw new Error("Non autorizzato")

  if (reg.paymentStatus === "PAID") {
    throw new Error("Iscrizione già pagata: contatta l'organizzatore per un rimborso")
  }
  if (reg.paymentStatus !== "PENDING") return

  await db.tournamentRegistration.delete({ where: { id: registrationId } })
  revalidatePath(`/tournaments/${reg.tournamentId}`)
}

// ──────────────────────── list / read helpers ────────────────────────────────

export async function getOpenTournaments() {
  return db.tournament.findMany({
    where: {
      isOpenForRegistration: true,
      status: "DRAFT",
    },
    orderBy: { date: "asc" },
    include: {
      _count: {
        select: {
          registrations: {
            where: { paymentStatus: { in: ["PAID", "FREE"] } },
          },
        },
      },
    },
  })
}

export async function getTournamentForRegistration(input: unknown) {
  const { tournamentId } = GetTournamentForRegistrationSchema.parse(input)
  const session = await getCurrentSession()
  const playerId = session?.user?.id
    ? (await db.player.findUnique({ where: { userId: session.user.id }, select: { id: true } }))?.id
    : null

  const tournament = await db.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    include: {
      _count: {
        select: {
          registrations: {
            where: { paymentStatus: { in: ["PAID", "FREE"] } },
          },
        },
      },
    },
  })

  const myRegistration = playerId
    ? await db.tournamentRegistration.findUnique({
        where: { tournamentId_playerId: { tournamentId, playerId } },
      })
    : null

  return { tournament, myRegistration, isAuthed: Boolean(playerId) }
}

export async function listPendingManualRegistrations() {
  await requireAdmin()
  return db.tournamentRegistration.findMany({
    where: { paymentStatus: "PENDING", paymentMethod: { in: ["CASH", "PAYPAL"] } },
    orderBy: { createdAt: "asc" },
    include: {
      player: { select: { id: true, name: true, avatarUrl: true } },
      tournament: { select: { id: true, name: true, date: true, priceCents: true, priceCurrency: true } },
    },
  })
}

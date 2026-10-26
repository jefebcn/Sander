"use server"

import { revalidatePath } from "next/cache"
import type Stripe from "stripe"
import { db } from "@/lib/db"
import type { Prisma } from "@/generated/prisma/client"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { canManageTournament, isAdminEmail } from "@/lib/isAdmin"
import { stripe, getAppUrl } from "@/lib/stripe"
import {
  hasFreeSeat,
  seatLimit,
  SEAT_FREE_STATUSES,
  TOURNAMENT_FULL_MESSAGE,
} from "@/lib/tournament/capacity"
import {
  classifyCheckoutSession,
  CARD_PAYMENT_UNAVAILABLE_MESSAGE,
} from "@/lib/tournament/registrationPayment"
import {
  StartCheckoutSchema,
  CreateManualPaymentSchema,
  AdminConfirmManualPaymentSchema,
  AdminRejectManualPaymentSchema,
  CancelRegistrationSchema,
  GetTournamentForRegistrationSchema,
  AdminSetSkillLevelSchema,
  AdminSetPaymentStatusSchema,
  TournamentIdSchema,
  PlayerIdSchema,
} from "@/lib/validators/registration.schema"

type Tx = Prisma.TransactionClient

const STRIPE_UNVERIFIABLE_MESSAGE =
  "Non riusciamo a verificare il pagamento con carta in questo momento. Riprova tra qualche minuto."

async function requireAdmin() {
  const session = await getCurrentSession()
  if (!session?.user?.id) throw new Error("Non autenticato")
  if (!isAdminEmail(session.user.email)) throw new Error("Accesso non autorizzato")
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
      type: true,
      status: true,
      maxTeams: true,
      priceCents: true,
      spectatorPriceCents: true,
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

type RegistrableTournament = Awaited<ReturnType<typeof assertRegistrable>>

function isFreeTournament(t: { priceCents: number | null }) {
  return t.priceCents == null || t.priceCents === 0
}

/** A row in one of these states no longer counts as a registration. */
function isStaleRow(reg: { paymentStatus: string }) {
  return (SEAT_FREE_STATUSES as readonly string[]).includes(reg.paymentStatus)
}

// ───────────────────────────── error handling ────────────────────────────────

function isStripeError(e: unknown): e is { type: string; code?: string; message: string } {
  return (
    typeof e === "object" && e !== null && "type" in e &&
    typeof (e as { type: unknown }).type === "string" &&
    (e as { type: string }).type.startsWith("Stripe")
  )
}

/**
 * Message safe to show to users. Our own `throw new Error("…")` messages are
 * Italian and user-facing; Stripe / Prisma / Zod errors are logged server-side
 * and replaced (a raw Stripe error can read "Invalid API Key provided…").
 */
function toUserError(e: unknown, context: string): string {
  if (isStripeError(e)) {
    console.error(`[registration] ${context}: Stripe error`, e)
    return CARD_PAYMENT_UNAVAILABLE_MESSAGE
  }
  if (typeof e === "object" && e !== null && "code" in e) {
    const code = (e as { code: unknown }).code
    if (code === "P2002") return "Risulti già in lista per questo torneo. Ricarica la pagina."
    if (typeof code === "string" && code.startsWith("P")) {
      console.error(`[registration] ${context}: DB error`, e)
      return "Si è verificato un errore. Riprova."
    }
  }
  if (e instanceof Error && e.name === "ZodError") return "Dati non validi"
  if (e instanceof Error) return e.message
  console.error(`[registration] ${context}: unknown error`, e)
  return "Si è verificato un errore. Riprova."
}

// ───────────────────────────── capacity ──────────────────────────────────────

/**
 * Throws when the tournament is full. Must run inside the transaction that
 * creates the registration: the tournament row is locked (FOR UPDATE) so two
 * concurrent sign-ups for the last seat are serialized.
 * Seat rule (PENDING rows count): see src/lib/tournament/capacity.ts.
 */
async function assertSeatAvailable(
  tx: Tx,
  tournament: Pick<RegistrableTournament, "id" | "type" | "maxTeams">,
  playerId: string,
) {
  if (seatLimit(tournament.type, tournament.maxTeams) == null) return
  await tx.$queryRaw`SELECT id FROM "tournaments" WHERE id = ${tournament.id} FOR UPDATE`
  const taken = await tx.tournamentRegistration.count({
    where: {
      tournamentId: tournament.id,
      isSpectator: false,
      playerId: { not: playerId },
      paymentStatus: { notIn: [...SEAT_FREE_STATUSES] },
    },
  })
  if (!hasFreeSeat(tournament.type, tournament.maxTeams, taken)) {
    throw new Error(TOURNAMENT_FULL_MESSAGE)
  }
}

// ───────────────────────────── Stripe helpers ────────────────────────────────

type SessionResolution =
  | { state: "open"; url: string }
  | { state: "paid"; session: Stripe.Checkout.Session }
  | { state: "closed" }
  | { state: "unknown" }

async function resolveCheckoutSession(sessionId: string): Promise<SessionResolution> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const state = classifyCheckoutSession(session)
    if (state === "paid") return { state, session }
    if (state === "open" && session.url) return { state, url: session.url }
    // Money still on its way: like an unreachable Stripe, touch nothing.
    if (state === "processing") return { state: "unknown" }
    return { state: "closed" }
  } catch (e) {
    if (isStripeError(e) && e.code === "resource_missing") return { state: "closed" }
    console.error("[registration] cannot retrieve Stripe session", sessionId, e)
    return { state: "unknown" }
  }
}

/**
 * Make sure a Checkout Session can no longer take money: expire it if open.
 * "paid" → the customer already paid (mark the registration PAID, never delete
 * it); "closed" → safe to drop; "unknown" → Stripe unreachable, do nothing.
 */
async function closeCheckoutSession(
  sessionId: string,
): Promise<{ state: "paid"; session: Stripe.Checkout.Session } | { state: "closed" } | { state: "unknown" }> {
  const res = await resolveCheckoutSession(sessionId)
  if (res.state !== "open") return res
  try {
    const expired = await stripe.checkout.sessions.expire(sessionId)
    if (classifyCheckoutSession(expired) === "paid") return { state: "paid", session: expired }
    return { state: "closed" }
  } catch {
    // Expire fails when the session completed/expired in the meantime — look again.
    const again = await resolveCheckoutSession(sessionId)
    return again.state === "open" ? { state: "unknown" } : again
  }
}

/** Same fields the checkout.session.completed webhook sets; idempotent. */
async function markRegistrationPaid(registrationId: string, session: Stripe.Checkout.Session) {
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null
  await db.tournamentRegistration.updateMany({
    where: { id: registrationId, paymentStatus: "PENDING" },
    data: {
      paymentStatus: "PAID",
      paymentMethod: "STRIPE",
      paidAt: new Date(),
      amountPaidCents: session.amount_total ?? null,
      stripePaymentIntentId: paymentIntentId,
    },
  })
}

function revalidateTournament(tournamentId: string) {
  revalidatePath("/tournaments")
  revalidatePath(`/tournaments/${tournamentId}`)
}

/** Fields kept when an existing row is replaced by a fresh one (new id). */
function carriedFields(
  prev: { seedPosition: number | null; teamName: string | null; teamLogoUrl: string | null } | null,
) {
  return prev
    ? { seedPosition: prev.seedPosition, teamName: prev.teamName, teamLogoUrl: prev.teamLogoUrl }
    : {}
}

// ───────────────────────────── startCheckout ─────────────────────────────────

export async function startCheckout(input: unknown): Promise<
  { ok: true; redirectUrl: string } | { ok: false; error: string }
> {
  try {
    const { tournamentId, skillLevel } = StartCheckoutSchema.parse(input)
    const player = await requireCurrentPlayer()
    const tournament = await assertRegistrable(tournamentId)
    const isFree = isFreeTournament(tournament)
    const successUrl = `/tournaments/${tournamentId}/register/success`

    const existing = await db.tournamentRegistration.findUnique({
      where: { tournamentId_playerId: { tournamentId, playerId: player.id } },
    })

    if (existing) {
      if (existing.paymentStatus === "PAID" || existing.paymentStatus === "FREE") {
        return { ok: false, error: "Sei già iscritto a questo torneo" }
      }
      if (existing.paymentStatus === "PENDING" && existing.stripeSessionId) {
        const res = await resolveCheckoutSession(existing.stripeSessionId)
        if (res.state === "open") return { ok: true, redirectUrl: res.url }
        if (res.state === "paid") {
          // Paid, but the webhook hasn't landed yet: never recreate the row
          // (the webhook would not find it → money taken, registration PENDING).
          await markRegistrationPaid(existing.id, res.session)
          revalidateTournament(tournamentId)
          return { ok: true, redirectUrl: successUrl }
        }
        if (res.state === "unknown") return { ok: false, error: CARD_PAYMENT_UNAVAILABLE_MESSAGE }
        // closed (expired / unpaid): replaced below by a fresh row
      } else if (existing.paymentStatus === "PENDING" && existing.paymentMethod === "CASH") {
        return { ok: false, error: "Hai già scelto il pagamento in contanti" }
      }
    }

    // A player already on the list stays there (as "registered, not paid") if
    // the card payment then fails to start.
    const wasOnList = existing?.paymentStatus === "PENDING" && !existing.isSpectator ? existing : null

    // Replace any previous row with a fresh one (new id): a late
    // checkout.session.expired webhook for an old session deletes by row id.
    const registration = await db.$transaction(async (tx) => {
      await assertSeatAvailable(tx, tournament, player.id)
      if (existing) await tx.tournamentRegistration.deleteMany({ where: { id: existing.id } })
      return tx.tournamentRegistration.create({
        data: {
          tournamentId,
          playerId: player.id,
          skillLevel: skillLevel ?? existing?.skillLevel ?? null,
          ...carriedFields(wasOnList),
          ...(isFree
            ? { paymentStatus: "PAID" as const, paymentMethod: "FREE", paidAt: new Date(), amountPaidCents: 0 }
            : { paymentStatus: "PENDING" as const, paymentMethod: "STRIPE" }),
        },
      })
    })

    if (isFree) {
      revalidateTournament(tournamentId)
      return { ok: true, redirectUrl: successUrl }
    }

    let checkoutSession: Stripe.Checkout.Session
    try {
      const appUrl = getAppUrl()
      checkoutSession = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: tournament.priceCurrency.toLowerCase(),
              unit_amount: tournament.priceCents ?? 0,
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
      if (!checkoutSession.url) throw new Error("Stripe checkout session without url")
    } catch (err) {
      // Never leave a PENDING/STRIPE row with no session behind: the user would
      // be stuck on "Completa pagamento" forever. Raw Stripe text is logged only.
      console.error("[registration] startCheckout: cannot create Stripe session", err)
      if (wasOnList) {
        await db.tournamentRegistration
          .update({ where: { id: registration.id }, data: { paymentMethod: null } })
          .catch(() => {})
      } else {
        await db.tournamentRegistration.deleteMany({ where: { id: registration.id } }).catch(() => {})
      }
      revalidateTournament(tournamentId)
      return { ok: false, error: CARD_PAYMENT_UNAVAILABLE_MESSAGE }
    }

    // Store session id for webhook + idempotent re-use
    await db.tournamentRegistration.update({
      where: { id: registration.id },
      data: { stripeSessionId: checkoutSession.id },
    })

    return { ok: true, redirectUrl: checkoutSession.url }
  } catch (e) {
    return { ok: false, error: toUserError(e, "startCheckout") }
  }
}

// ─────────────────────── manual payment (cash / PayPal) ──────────────────────

async function createManualRegistration(
  input: unknown,
  method: "CASH" | "PAYPAL",
): Promise<{ ok: true; registrationId: string } | { ok: false; error: string }> {
  try {
    const { tournamentId, skillLevel } = CreateManualPaymentSchema.parse(input)
    const player = await requireCurrentPlayer()
    const tournament = await assertRegistrable(tournamentId)
    const isFree = isFreeTournament(tournament)

    const existing = await db.tournamentRegistration.findUnique({
      where: { tournamentId_playerId: { tournamentId, playerId: player.id } },
    })

    if (existing) {
      if (existing.paymentStatus === "PAID" || existing.paymentStatus === "FREE") {
        return { ok: false, error: "Sei già iscritto a questo torneo" }
      }
      if (existing.paymentStatus === "PENDING" && existing.stripeSessionId) {
        // Switching away from card: the Stripe session must not be able to
        // take money anymore.
        const res = await closeCheckoutSession(existing.stripeSessionId)
        if (res.state === "paid") {
          await markRegistrationPaid(existing.id, res.session)
          revalidateTournament(tournamentId)
          return { ok: true, registrationId: existing.id }
        }
        if (res.state === "unknown") return { ok: false, error: STRIPE_UNVERIFIABLE_MESSAGE }
        // closed: replace the row below (new id) — the old session's expiry
        // webhook deletes by row id and must not hit the new registration.
      } else if (existing.paymentStatus === "PENDING") {
        const updates: { paymentMethod?: string; skillLevel?: number } = {}
        if (!isFree && existing.paymentMethod !== method) updates.paymentMethod = method
        if (skillLevel != null && existing.skillLevel !== skillLevel) updates.skillLevel = skillLevel
        if (Object.keys(updates).length > 0) {
          await db.tournamentRegistration.update({
            where: { id: existing.id },
            data: updates,
          })
          revalidateTournament(tournamentId)
        }
        return { ok: true, registrationId: existing.id }
      }
    }

    const keep = existing?.paymentStatus === "PENDING" && !existing.isSpectator ? existing : null

    const registration = await db.$transaction(async (tx) => {
      await assertSeatAvailable(tx, tournament, player.id)
      if (existing) await tx.tournamentRegistration.deleteMany({ where: { id: existing.id } })
      return tx.tournamentRegistration.create({
        data: {
          tournamentId,
          playerId: player.id,
          ...carriedFields(keep),
          // Free tournament: treat as FREE, not cash/PayPal
          paymentStatus: isFree ? "PAID" : "PENDING",
          paymentMethod: isFree ? "FREE" : method,
          paidAt: isFree ? new Date() : null,
          amountPaidCents: isFree ? 0 : null,
          skillLevel: skillLevel ?? existing?.skillLevel ?? null,
        },
      })
    })

    revalidateTournament(tournamentId)
    return { ok: true, registrationId: registration.id }
  } catch (e) {
    return { ok: false, error: toUserError(e, `manual ${method} registration`) }
  }
}

// ─────────────────────── createPaypalRegistration ────────────────────────────

export async function createPaypalRegistration(input: unknown): Promise<
  { ok: true; registrationId: string } | { ok: false; error: string }
> {
  return createManualRegistration(input, "PAYPAL")
}

// ─────────────────────── createManualPaymentRegistration ─────────────────────

export async function createManualPaymentRegistration(input: unknown): Promise<
  { ok: true; registrationId: string } | { ok: false; error: string }
> {
  return createManualRegistration(input, "CASH")
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
    if (existing && !isStaleRow(existing)) {
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

    const isFree = isFreeTournament(tournament)

    await db.$transaction(async (tx) => {
      await assertSeatAvailable(tx, tournament, player.id)
      // A cancelled/rejected row would otherwise block the unique slot forever.
      if (existing) await tx.tournamentRegistration.deleteMany({ where: { id: existing.id } })
      await tx.tournamentRegistration.create({
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
    })

    // Notify player of successful registration
    import("@/lib/push").then(({ notifyPlayer }) =>
      notifyPlayer(player.id, {
        title: `🏐 Iscrizione confermata!`,
        body: isFree
          ? `Sei nella lista per ${tournament.name}. Ti avviseremo quando inizia.`
          : `Sei in lista per ${tournament.name}. Completa il pagamento per confermare il posto.`,
        url: `/tournaments/${tournamentId}`,
      }),
    ).catch(() => {})

    revalidateTournament(tournamentId)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: toUserError(e, "registerForTournament") }
  }
}

// ──────────────────────── adminConfirmManualPayment ──────────────────────────

export async function adminConfirmManualPayment(input: unknown) {
  const { registrationId, notes } = AdminConfirmManualPaymentSchema.parse(input)

  const reg = await db.tournamentRegistration.findUnique({
    where: { id: registrationId },
    include: { tournament: { select: { id: true, priceCents: true } } },
  })
  if (!reg) throw new Error("Iscrizione non trovata")

  const session = await getCurrentSession()
  if (!session?.user?.id) throw new Error("Non autenticato")
  const allowed = await canManageTournament(session.user.email, reg.tournamentId)
  if (!allowed) throw new Error("Accesso non autorizzato")

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
  const { registrationId } = AdminRejectManualPaymentSchema.parse(input)

  const reg = await db.tournamentRegistration.findUnique({ where: { id: registrationId } })
  if (!reg) throw new Error("Iscrizione non trovata")

  const session = await getCurrentSession()
  if (!session?.user?.id) throw new Error("Non autenticato")
  const allowed = await canManageTournament(session.user.email, reg.tournamentId)
  if (!allowed) throw new Error("Accesso non autorizzato")

  if (reg.paymentStatus !== "PENDING") throw new Error("Iscrizione non in attesa")

  await db.tournamentRegistration.update({
    where: { id: registrationId },
    data: { paymentStatus: "CANCELLED" },
  })

  revalidatePath("/admin/payments")
  revalidatePath(`/tournaments/${reg.tournamentId}`)
}

// ──────────────────────────── adminSetPaymentStatus ──────────────────────────

export async function adminSetPaymentStatus(registrationIdInput: string, paidInput: boolean) {
  const { registrationId, paid } = AdminSetPaymentStatusSchema.parse({
    registrationId: registrationIdInput,
    paid: paidInput,
  })

  const reg = await db.tournamentRegistration.findUnique({
    where: { id: registrationId },
    select: { tournamentId: true, paymentStatus: true, tournament: { select: { priceCents: true } } },
  })
  if (!reg) throw new Error("Iscrizione non trovata")

  const session = await getCurrentSession()
  if (!session?.user?.id) throw new Error("Non autenticato")
  const allowed = await canManageTournament(session.user.email, reg.tournamentId)
  if (!allowed) throw new Error("Accesso non autorizzato")

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
  const { registrationId } = CancelRegistrationSchema.parse(input)
  const player = await requireCurrentPlayer()

  const reg = await db.tournamentRegistration.findUnique({
    where: { id: registrationId },
    select: { playerId: true, tournamentId: true, paymentStatus: true, paymentMethod: true, stripeSessionId: true },
  })
  if (!reg) throw new Error("Iscrizione non trovata")
  if (reg.playerId !== player.id) throw new Error("Non autorizzato")
  // Free-tournament sign-ups are stored as PAID/FREE: nothing to refund there.
  if (reg.paymentStatus === "PAID" && reg.paymentMethod !== "FREE") {
    throw new Error("Iscrizione già pagata: contatta l'organizzatore per un rimborso")
  }

  if (reg.paymentStatus === "PENDING" && reg.stripeSessionId) {
    // Expire the open checkout first, or the user could still pay for a
    // registration that no longer exists.
    const res = await closeCheckoutSession(reg.stripeSessionId)
    if (res.state === "paid") {
      await markRegistrationPaid(registrationId, res.session)
      revalidateTournament(reg.tournamentId)
      throw new Error(
        "Il pagamento con carta risulta completato: sei iscritto. Per annullare contatta l'organizzatore.",
      )
    }
    if (res.state === "unknown") throw new Error(STRIPE_UNVERIFIABLE_MESSAGE)
  }

  await db.tournamentRegistration.deleteMany({ where: { id: registrationId } })
  revalidateTournament(reg.tournamentId)
}

/** Client-friendly wrapper: returns the reason instead of throwing. */
export async function cancelMyRegistration(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await cancelRegistration(input)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: toUserError(e, "cancelRegistration") }
  }
}

// ─────────────────────────── adminRemoveRegistration ─────────────────────────

export async function adminRemoveRegistration(input: unknown) {
  const { registrationId } = CancelRegistrationSchema.parse(input)

  const reg = await db.tournamentRegistration.findUnique({
    where: { id: registrationId },
    select: { tournamentId: true, tournament: { select: { status: true } } },
  })
  if (!reg) throw new Error("Iscrizione non trovata")
  if (reg.tournament.status !== "DRAFT") throw new Error("Puoi rimuovere iscritti solo da tornei in bozza")

  const session = await getCurrentSession()
  if (!session?.user?.id) throw new Error("Non autenticato")
  const allowed = await canManageTournament(session.user.email, reg.tournamentId)
  if (!allowed) throw new Error("Accesso non autorizzato")

  await db.tournamentRegistration.delete({ where: { id: registrationId } })
  revalidatePath(`/tournaments/${reg.tournamentId}`)
  revalidatePath("/admin/payments")
}

// ─────────────────────────── adminAddPlayerToTournament ──────────────────────
// Organizer override: not subject to maxTeams (the organizer decides).

export async function adminAddPlayerToTournament(
  tournamentIdInput: string,
  playerIdInput: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const tournamentId = TournamentIdSchema.parse(tournamentIdInput)
    const playerId = PlayerIdSchema.parse(playerIdInput)

    const session = await getCurrentSession()
    if (!session?.user?.id) return { ok: false, error: "Non autenticato" }
    const allowed = await canManageTournament(session.user.email, tournamentId)
    if (!allowed) return { ok: false, error: "Accesso non autorizzato" }

    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { priceCents: true },
    })
    if (!tournament) return { ok: false, error: "Torneo non trovato" }

    const existing = await db.tournamentRegistration.findUnique({
      where: { tournamentId_playerId: { tournamentId, playerId } },
    })
    if (existing) return { ok: false, error: "Giocatore già iscritto" }

    const isFree = !tournament.priceCents || tournament.priceCents === 0

    await db.tournamentRegistration.create({
      data: {
        tournamentId,
        playerId,
        paymentStatus: isFree ? "FREE" : "PENDING",
        paymentMethod: isFree ? "FREE" : "CASH",
        paidAt: isFree ? new Date() : null,
        amountPaidCents: isFree ? 0 : null,
      },
    })

    revalidatePath(`/tournaments/${tournamentId}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: toUserError(e, "adminAddPlayerToTournament") }
  }
}

// ─────────────────────────── adminAddSpectatorToTournament ───────────────────

export async function adminAddSpectatorToTournament(
  tournamentIdInput: string,
  playerIdInput: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const tournamentId = TournamentIdSchema.parse(tournamentIdInput)
    const playerId = PlayerIdSchema.parse(playerIdInput)

    const session = await getCurrentSession()
    if (!session?.user?.id) return { ok: false, error: "Non autenticato" }
    const allowed = await canManageTournament(session.user.email, tournamentId)
    if (!allowed) return { ok: false, error: "Accesso non autorizzato" }

    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { spectatorPriceCents: true },
    })
    if (!tournament) return { ok: false, error: "Torneo non trovato" }

    const existing = await db.tournamentRegistration.findUnique({
      where: { tournamentId_playerId: { tournamentId, playerId } },
    })
    if (existing) return { ok: false, error: "Giocatore già nella lista" }

    const isFree = !tournament.spectatorPriceCents || tournament.spectatorPriceCents === 0

    await db.tournamentRegistration.create({
      data: {
        tournamentId,
        playerId,
        isSpectator: true,
        paymentStatus: isFree ? "FREE" : "PENDING",
        paymentMethod: isFree ? "FREE" : "CASH",
        paidAt: isFree ? new Date() : null,
        amountPaidCents: isFree ? 0 : null,
      },
    })

    revalidatePath(`/tournaments/${tournamentId}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: toUserError(e, "adminAddSpectatorToTournament") }
  }
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

export async function registerAsSpectator(tournamentIdInput: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const tournamentId = TournamentIdSchema.parse(tournamentIdInput)
    const session = await getCurrentSession()
    if (!session?.user?.id) return { ok: false, error: "Non autenticato" }
    const player = await db.player.findUnique({ where: { userId: session.user.id } })
    if (!player) return { ok: false, error: "Profilo non trovato" }

    // Same window as player sign-ups: open, not started, before the deadline.
    const tournament = await assertRegistrable(tournamentId)

    const existing = await db.tournamentRegistration.findUnique({
      where: { tournamentId_playerId: { tournamentId, playerId: player.id } },
    })
    if (existing && !isStaleRow(existing)) return { ok: false, error: "Sei già nella lista" }

    const isFree = !tournament.spectatorPriceCents || tournament.spectatorPriceCents === 0

    await db.$transaction(async (tx) => {
      if (existing) await tx.tournamentRegistration.deleteMany({ where: { id: existing.id } })
      await tx.tournamentRegistration.create({
        data: {
          tournamentId,
          playerId: player.id,
          isSpectator: true,
          paymentStatus: isFree ? "FREE" : "PENDING",
          paymentMethod: isFree ? "FREE" : null,
          paidAt: isFree ? new Date() : null,
          amountPaidCents: isFree ? 0 : null,
        },
      })
    })

    revalidatePath(`/tournaments/${tournamentId}`)
    revalidatePath("/tournaments")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: toUserError(e, "registerAsSpectator") }
  }
}

/** Formats where a pair plays together the whole tournament (KOTB rotates partners). */
const PAIR_FORMATS = ["BRACKETS", "ROUND_ROBIN", "DOUBLE_ELIMINATION", "CHICECE"]

/**
 * Register your Scopri pair (you + your partner) in one go, side by side in
 * the seeding so the default pairing keeps you together. Free tournaments are
 * confirmed at once; paid ones leave each of you a place to pay for.
 */
export async function registerDuoForTournament(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { tournamentId } = StartCheckoutSchema.parse(input)
    const player = await requireCurrentPlayer()
    const tournament = await assertRegistrable(tournamentId)
    if (!PAIR_FORMATS.includes(tournament.type)) {
      return { ok: false, error: "In questo torneo le coppie cambiano a ogni turno: iscrivetevi uno alla volta" }
    }
    const { activeDuoOf, duoName } = await import("@/lib/scopri/duos")
    const duo = await activeDuoOf(player.id)
    if (!duo) return { ok: false, error: "Prima forma una coppia su Scopri" }
    const partnerId = duo.aId === player.id ? duo.bId : duo.aId
    const isFree = isFreeTournament(tournament)
    const label = duoName(duo)

    await db.$transaction(async (tx) => {
      const top = await tx.tournamentRegistration.aggregate({ where: { tournamentId }, _max: { seedPosition: true } })
      let seed = (top._max.seedPosition ?? 0) + 1
      for (const [i, playerId] of [player.id, partnerId].entries()) {
        const existing = await tx.tournamentRegistration.findUnique({
          where: { tournamentId_playerId: { tournamentId, playerId } },
        })
        if (existing && !isStaleRow(existing)) continue
        await assertSeatAvailable(tx, tournament, playerId)
        if (existing) await tx.tournamentRegistration.deleteMany({ where: { id: existing.id } })
        await tx.tournamentRegistration.create({
          data: {
            tournamentId,
            playerId,
            seedPosition: seed++,
            teamName: i === 0 ? label : null,
            adminNotes: `Coppia Scopri: ${label}`,
            paymentStatus: isFree ? "PAID" : "PENDING",
            paymentMethod: isFree ? "FREE" : null,
            paidAt: isFree ? new Date() : null,
            amountPaidCents: isFree ? 0 : null,
          },
        })
      }
    })

    const me = player.firstName ?? player.name.split(" ")[0]
    import("@/lib/push").then(({ notifyPlayer }) =>
      notifyPlayer(partnerId, {
        title: `${me} ha iscritto la vostra coppia`,
        body: isFree ? `Siete in lista per ${tournament.name}.` : `${tournament.name}: completa il pagamento per confermare il tuo posto.`,
        url: `/tournaments/${tournamentId}`,
      }),
    ).catch(() => {})

    revalidateTournament(tournamentId)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: toUserError(e, "registerDuoForTournament") }
  }
}

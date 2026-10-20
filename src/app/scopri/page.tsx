export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { MessageCircle } from "lucide-react"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { db } from "@/lib/db"
import { YOUR_TURN_LIMIT } from "@/lib/scopri/rules"
import {
  loadCardRow,
  readiness,
  buildDeck,
  allowance,
  dailyPickFor,
  matchList,
  incomingLikes,
} from "@/lib/scopri/server"
import { openGamesNear } from "@/lib/scopri/games"
import { freeToday } from "@/lib/scopri/reliability"
import { refreshPlusIfStale } from "@/lib/scopri/plus"
import { ScopriNav } from "@/components/scopri/ScopriNav"
import { SetupGate } from "@/components/scopri/SetupGate"
import { ScopriDeck } from "@/components/scopri/ScopriDeck"
import { DailyPickCard } from "@/components/scopri/DailyPickCard"
import { ScopriGuest } from "@/components/scopri/ScopriGuest"
import { ScopriWelcome } from "@/components/scopri/ScopriWelcome"

export const metadata: Metadata = {
  title: "Scopri — trova con chi giocare a beach volley | SANDER",
  description: "Un giocatore alla volta: like su una foto o su una risposta, match, chat e in campo insieme. Anche in coppia per il 2v2.",
}

export default async function ScopriPage() {
  const player = await getCurrentPlayer()
  if (!player) {
    return (
      <div className="px-4 pb-10">
        <ScopriGuest />
      </div>
    )
  }

  const now = new Date()
  await db.discoverProfile.upsert({ where: { playerId: player.id }, create: { playerId: player.id }, update: {} })
  await refreshPlusIfStale(player.id, now)
  const me = await loadCardRow(player.id)
  if (!me) return null
  const missing = readiness(me, now)

  if (missing.length > 0) {
    return (
      <div className="px-4 pb-10">
        <ScopriNav active="scopri" />
        <SetupGate missing={missing} />
      </div>
    )
  }

  const [matches, likes, left] = await Promise.all([matchList(me.id, now), incomingLikes(me.id, now), allowance(me.id, now)])
  const waiting = matches.filter((m) => m.turn !== "in-attesa")
  const myPhoto = me.discoverPhotos[0]?.url ?? me.avatarUrl ?? null

  if (me.discoverProfile?.suspendedAt) {
    return (
      <div className="px-4 pb-10">
        <ScopriNav active="scopri" likes={likes.length} waiting={waiting.length} />
        <div className="rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-6 text-center">
          <p className="font-hand text-[2.3rem] text-white">Profilo sospeso</p>
          <p className="mt-2 text-base text-[var(--muted-text)]">
            Abbiamo ricevuto segnalazioni sul tuo profilo: per ora non sei visibile su Scopri. Match e chat restano.
            Per chiarimenti scrivi al supporto di SANDER.
          </p>
        </div>
      </div>
    )
  }

  if (me.discoverProfile?.paused) {
    return (
      <div className="px-4 pb-10">
        <ScopriNav active="scopri" likes={likes.length} waiting={waiting.length} />
        <div className="rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-6 text-center">
          <p className="font-hand text-[2.3rem] text-white">Profilo in pausa</p>
          <p className="mt-2 text-base text-[var(--muted-text)]">Nessuno ti vede e non ricevi like. Match e chat restano.</p>
          <Link href="/scopri/profilo" className="mt-4 inline-flex min-h-[3.5rem] items-center rounded-full bg-[var(--accent)] px-6 text-base font-extrabold text-black">
            Riattiva
          </Link>
        </div>
      </div>
    )
  }

  if (waiting.length >= YOUR_TURN_LIMIT) {
    return (
      <div className="px-4 pb-10">
        <ScopriNav active="scopri" likes={likes.length} waiting={waiting.length} />
        <section className="rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)]" style={{ background: "linear-gradient(150deg, color-mix(in srgb, var(--social) 26%, var(--surface-2)), var(--surface-2) 65%)" }}>
          <p className="eyebrow text-[var(--social)]">Tocca a te</p>
          <h2 className="font-hand mt-2 text-[2.75rem] leading-none text-white">{waiting.length} match ti aspettano</h2>
          <p className="mt-3 font-serif text-2xl text-white/90">
            Rispondi prima a loro: un match senza chat è una partita che non si gioca.
          </p>
          <Link href="/scopri/match" className="pressable mt-5 flex min-h-[3.75rem] items-center justify-center gap-2 rounded-full bg-[var(--social)] text-lg font-extrabold text-black">
            <MessageCircle className="h-5 w-5" aria-hidden="true" /> Vai ai match
          </Link>
        </section>
      </div>
    )
  }

  const [deck, pick, games] = await Promise.all([
    buildDeck(me, now),
    dailyPickFor(me, now),
    openGamesNear(me.id, me.homeCity, now),
  ])

  return (
    <div className="px-4 pb-10">
      <ScopriNav active="scopri" likes={likes.length} waiting={waiting.length} />
      {pick && (
        <div className="mb-5">
          <DailyPickCard card={pick.card} seen={pick.seen} allowance={left} myPhoto={myPhoto} />
        </div>
      )}
      <ScopriDeck
        initialCards={deck.filter((c) => c.id !== pick?.card.id)}
        initialAllowance={left}
        games={games}
        myPhoto={myPhoto}
        myFree={freeToday(me.discoverProfile?.freeDay, me.discoverProfile?.freeSlot, now)}
      />
      <ScopriWelcome />
    </div>
  )
}

export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { MessageCircle, Users, Volleyball } from "lucide-react"
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
import { playNearby, type PlayNearby } from "@/lib/scopri/pairPlay"
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
  // In parallel: the card and the SANDER+ check (which only touches Stripe for
  // a lapsed subscription). The profile row is created once, not on every visit.
  let [me] = await Promise.all([loadCardRow(player.id), refreshPlusIfStale(player.id, now)])
  if (me && !me.discoverProfile) {
    await db.discoverProfile.upsert({ where: { playerId: player.id }, create: { playerId: player.id }, update: {} })
    me = await loadCardRow(player.id)
  }
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

  const [deck, pick, games, nearby] = await Promise.all([
    buildDeck(me, now),
    dailyPickFor(me, now),
    openGamesNear(me.id, me.homeCity, now),
    playNearby(me.id, me.homeCity, now),
  ])

  return (
    <div className="px-4 pb-10">
      <ScopriNav active="scopri" likes={likes.length} waiting={waiting.length} />
      <p className="-mt-1 text-base text-white/80 [text-shadow:0_2px_12px_rgb(0_0_0/0.5)]">
        Beach volley si gioca in due: qui trovi il <strong className="text-white">compagno per il 2v2</strong>, o gli avversari.
      </p>
      <PlayNearbyStrip nearby={nearby} />
      {pick && (
        <div className="mb-5">
          <DailyPickCard
            card={pick.card}
            seen={pick.seen}
            allowance={left}
            myPhoto={myPhoto}
            me={{ role: me.preferredRole, side: me.discoverProfile?.side ?? null }}
          />
        </div>
      )}
      <ScopriDeck
        initialCards={deck.filter((c) => c.id !== pick?.card.id)}
        initialAllowance={left}
        games={games}
        myPhoto={myPhoto}
        myFree={freeToday(me.discoverProfile?.freeDay, me.discoverProfile?.freeSlot, now)}
        me={{ role: me.preferredRole, side: me.discoverProfile?.side ?? null }}
      />
      <ScopriWelcome />
    </div>
  )
}

/**
 * What a like turns into around you: pairs to challenge and games that miss a
 * pair. A match is half a 2v2, and this shows the other half is already here.
 */
function PlayNearbyStrip({ nearby }: { nearby: PlayNearby | null }) {
  if (!nearby) return <div className="mb-4" />
  const { city, pairs, pairGames } = nearby
  if (pairs === 0 && pairGames === 0) {
    return (
      <p className="mb-4 mt-1 text-sm text-white/70">
        A {city} siete i primi: col vostro match aprite voi la prima partita, gli avversari arrivano.
      </p>
    )
  }
  return (
    <div className="mb-4 mt-2 flex flex-wrap gap-2" aria-label={`Oggi a ${city}`}>
      {pairs > 0 && (
        <Link href="/scopri/coppie" className="pressable flex min-h-[2.75rem] items-center gap-1.5 rounded-full bg-[var(--surface-3)] px-3.5 text-sm font-bold text-white ring-1 ring-white/15">
          <Users className="h-4 w-4 text-[var(--social)]" aria-hidden="true" />
          {pairs === 1 ? "1 coppia cerca avversari" : `${pairs} coppie cercano avversari`}
        </Link>
      )}
      {pairGames > 0 && (
        <Link href="/sessions" className="pressable flex min-h-[2.75rem] items-center gap-1.5 rounded-full bg-[var(--surface-3)] px-3.5 text-sm font-bold text-white ring-1 ring-white/15">
          <Volleyball className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
          {pairGames === 1 ? "1 partita cerca una coppia" : `${pairGames} partite cercano una coppia`}
        </Link>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Copy, Check, Share2, MessageCircle, Crown, Lock, Award } from "lucide-react"
import { INVITER_SC, INVITEE_SC, INVITER_XP } from "@/lib/referral"
import { INVITE_MILESTONES, nextInviteMilestone } from "@/lib/inviteMilestones"
import { QRCodeButton } from "@/components/ui/QRCode"
import { trackEvent } from "@/lib/analytics"
import { cn } from "@/lib/utils"

const APP_URL = "https://www.sanderbv.it"

interface ReferralLeader {
  id: string
  name: string
  avatarUrl: string | null
  invites: number
}

interface InviteTabProps {
  promoCode: string
  playerName: string
  inviteCount: number
  leaderboard?: ReferralLeader[]
}

/**
 * Invite friends. Ordered by how people actually invite on the beach:
 * WhatsApp first, then the QR you show from your phone, then copy/share.
 */
export function InviteTab({ promoCode, inviteCount, leaderboard = [] }: InviteTabProps) {
  const [copied, setCopied] = useState(false)

  const invitePath = `/auth/signin?mode=register&invite=${promoCode}`
  const shareUrl = `${APP_URL}${invitePath}`
  const shareText =
    `Ci vediamo in spiaggia? 🏐 Su SANDER trovi partite di beach volley in Riviera e una classifica per ogni bagno. ` +
    `Iscriviti col mio codice ${promoCode}: alla prima partita ti regalano ${INVITEE_SC} SanderCredits.`

  const next = nextInviteMilestone(inviteCount)
  const stepPct = next ? Math.round(((inviteCount - next.prevAt) / (next.at - next.prevAt)) * 100) : 100

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      trackEvent("share", { kind: "invite", channel: "copy" })
    } catch {
      /* clipboard blocked — nothing useful to do */
    }
  }

  async function shareNative() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Gioca con me su SANDER", text: shareText, url: shareUrl })
        trackEvent("share", { kind: "invite", channel: "native" })
      } catch {
        /* user cancelled */
      }
    } else {
      await copyLink()
    }
  }

  function shareWhatsApp() {
    trackEvent("share", { kind: "invite", channel: "whatsapp" })
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="tone-social space-y-4 px-4 pt-2">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-5">
        <div
          aria-hidden="true"
          className="sun-drift pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full"
          style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--social) 26%, transparent) 0%, transparent 65%)" }}
        />
        <p className="eyebrow relative text-[var(--tone)]">Invita gli amici</p>
        <h2 className="relative mt-1 font-display text-3xl font-extrabold leading-[0.95] text-white">
          Porta la tua
          <br />
          squadra in spiaggia
        </h2>
        <div className="relative mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-[var(--radius-sm)] bg-black/25 p-3">
            <p className="text-xs font-bold uppercase text-[var(--muted-text)]">A te</p>
            <p className="num text-2xl text-[var(--tone)]">+{INVITER_SC} SC</p>
            <p className="text-xs text-[var(--muted-text)]">e +{INVITER_XP} XP, quando gioca</p>
          </div>
          <div className="rounded-[var(--radius-sm)] bg-black/25 p-3">
            <p className="text-xs font-bold uppercase text-[var(--muted-text)]">Al tuo amico</p>
            <p className="num text-2xl text-white">+{INVITEE_SC} SC</p>
            <p className="text-xs text-[var(--muted-text)]">alla prima partita</p>
          </div>
        </div>
      </section>

      {/* Code + share */}
      <section className="rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-5">
        <p className="text-sm text-[var(--muted-text)]">Il tuo codice</p>
        <button
          type="button"
          onClick={copyLink}
          className="mt-1 flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--tone-line)] px-4 py-3"
          aria-label={`Copia il codice ${promoCode} e il link`}
        >
          <span className="num text-3xl tracking-[0.12em] text-white">{promoCode}</span>
          <span className="flex items-center gap-1.5 text-sm font-bold text-[var(--tone)]">
            {copied ? <><Check className="h-5 w-5" /> Copiato</> : <><Copy className="h-5 w-5" /> Copia</>}
          </span>
        </button>

        <button
          type="button"
          onClick={shareWhatsApp}
          className="pressable mt-4 flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--social)] text-base font-extrabold text-black"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" /> Invita su WhatsApp
        </button>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={shareNative}
            className="flex min-h-[3.5rem] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--surface-3)] text-base font-bold text-white"
          >
            <Share2 className="h-5 w-5 text-[var(--tone)]" aria-hidden="true" /> Condividi
          </button>
          <QRCodeButton path={invitePath} title="Scansiona e gioca con me" label="QR in spiaggia" />
        </div>
      </section>

      {/* Progress + badges */}
      <section className="rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-[var(--muted-text)]">Amici che hanno giocato</p>
            <p className="num text-4xl leading-none text-white">{inviteCount}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[var(--muted-text)]">SC guadagnati</p>
            <p className="num text-4xl leading-none text-[var(--tone)]">{inviteCount * INVITER_SC}</p>
          </div>
        </div>
        {next && (
          <>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-4)]" aria-hidden="true">
              <div className="xp-bar-fill h-full rounded-full bg-[var(--social)]" style={{ width: `${Math.max(4, stepPct)}%` }} />
            </div>
            <p className="mt-2 text-sm text-[var(--muted-text)]">
              Ancora <strong className="text-white">{next.at - inviteCount}</strong> per il badge{" "}
              <strong className="text-[var(--tone)]">{next.title}</strong>
            </p>
          </>
        )}
        <ul className="mt-4 grid grid-cols-4 gap-2">
          {INVITE_MILESTONES.map((m) => {
            const earned = inviteCount >= m.at
            return (
              <li
                key={m.at}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-[var(--radius-sm)] p-2 text-center",
                  earned ? "bg-[var(--tone-soft)]" : "bg-black/20",
                )}
              >
                {earned ? (
                  <Award className="h-6 w-6 text-[var(--tone)]" aria-hidden="true" />
                ) : (
                  <Lock className="h-6 w-6 text-[var(--muted-text)] opacity-60" aria-hidden="true" />
                )}
                <span className={cn("text-xs font-bold leading-tight", earned ? "text-white" : "text-[var(--muted-text)]")}>
                  {m.title}
                </span>
                <span className="text-xs text-[var(--muted-text)]">{m.at}</span>
              </li>
            )
          })}
        </ul>
      </section>

      {/* How it works — short enough to just show */}
      <section className="rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-5">
        <p className="font-display text-xl font-extrabold text-white">Come funziona</p>
        <ol className="mt-3 space-y-2 text-base text-[var(--muted-text)]">
          <li><span className="num mr-2 text-[var(--tone)]">1</span>Mandi il link o fai scansionare il QR.</li>
          <li><span className="num mr-2 text-[var(--tone)]">2</span>Il tuo amico si iscrive con il tuo codice.</li>
          <li><span className="num mr-2 text-[var(--tone)]">3</span>Quando gioca la sua prima partita, tu ricevi +{INVITER_SC} SC e lui +{INVITEE_SC} SC.</li>
        </ol>
        <p className="mt-3 text-sm text-[var(--muted-text)]">
          Anche il link di una partita che condividi contiene il tuo codice.
        </p>
      </section>

      {/* Referral leaderboard */}
      {leaderboard.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Crown className="h-4 w-4 text-[var(--compete)]" aria-hidden="true" />
            <p className="eyebrow text-[var(--muted-text)]">Chi ha portato più amici</p>
          </div>
          <ol className="space-y-1.5">
            {leaderboard.map((l, i) => (
              <li key={l.id} className="flex min-h-[3.5rem] items-center gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4">
                <span className="num w-5 text-center text-lg text-[var(--muted-text)]">{i + 1}</span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-1)] text-xs font-black text-[var(--muted-text)]">
                  {l.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    l.name.slice(0, 2).toUpperCase()
                  )}
                </span>
                <span className="flex-1 truncate text-base font-semibold text-white">{l.name}</span>
                <span className="num text-lg text-[var(--tone)]">{l.invites}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Copy, Check, Share2, Info, Users, Crown } from "lucide-react"
import { INVITER_SC, INVITEE_SC, INVITER_XP } from "@/lib/referral"

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

export function InviteTab({ promoCode, playerName: _playerName, inviteCount, leaderboard = [] }: InviteTabProps) {
  const [copied, setCopied] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const shareUrl = `${APP_URL}/auth/signin?invite=${promoCode}`
  const shareText = `Unisciti a SANDER, la piattaforma per il beach volleyball! Registrati con il mio codice ${promoCode} e ricevi ${INVITEE_SC} SanderCredits di benvenuto. 🏐`

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function shareLink() {
    if (navigator.share) {
      await navigator.share({ title: "SANDER — il tuo codice invito", text: shareText, url: shareUrl })
    } else {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="px-4 space-y-5 pt-2">

      {/* Hero */}
      <div className="flex items-start gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: "var(--accent)" }}
        >
          <span className="text-2xl">🎁</span>
        </div>
        <div>
          <h2 className="text-xl font-black text-white leading-snug">
            Invita gli amici, guadagnate entrambi!
          </h2>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Per ogni amico che si registra col tuo codice ricevi{" "}
            <strong className="text-[var(--accent)]">+{INVITER_SC} SC</strong> e{" "}
            <strong className="text-[var(--accent)]">+{INVITER_XP} XP</strong>. Il tuo amico riceve{" "}
            <strong className="text-[var(--accent)]">+{INVITEE_SC} SC</strong> di benvenuto.
          </p>
        </div>
      </div>

      {/* Amici invitati */}
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <Users className="h-5 w-5 text-[var(--accent)] shrink-0" />
        <div>
          <p className="text-xs text-[var(--muted-text)]">Amici invitati</p>
          <p className="text-xl font-black text-white">{inviteCount}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-[var(--muted-text)]">SC guadagnati</p>
          <p className="text-xl font-black text-[var(--accent)]">{inviteCount * INVITER_SC}</p>
        </div>
      </div>

      {/* Promo code box */}
      <div
        className="rounded-2xl px-4 py-4"
        style={{ border: "1px solid rgba(255,255,255,0.15)", background: "var(--surface-2)" }}
      >
        <p className="text-xs text-[var(--muted-text)] mb-1">Il tuo codice invito</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-black tracking-widest text-white">{promoCode}</span>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 text-sm font-bold text-[var(--accent)] transition-opacity active:opacity-60"
          >
            {copied
              ? <><Check className="h-4 w-4" /> Copiato!</>
              : <><Copy className="h-4 w-4" /> Copia link</>
            }
          </button>
        </div>
        <p className="text-xs text-[var(--muted-text)] mt-2 truncate opacity-60">{shareUrl}</p>
      </div>

      {/* Share CTA */}
      <button
        onClick={shareLink}
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-black text-black text-base transition-opacity active:opacity-80"
        style={{ background: "var(--accent)" }}
      >
        <Share2 className="h-4 w-4" />
        Condividi il link con gli amici
      </button>

      {/* Come funziona toggle */}
      <button
        onClick={() => setShowInfo(!showInfo)}
        className="flex items-center gap-2 text-sm font-semibold text-[var(--accent)]"
      >
        <Info className="h-4 w-4" />
        Come funziona
      </button>

      {showInfo && (
        <div
          className="rounded-2xl p-4 space-y-2 text-sm text-[var(--muted-text)] leading-relaxed"
          style={{ background: "var(--surface-2)" }}
        >
          <p>1. Condividi il tuo link o codice con un amico.</p>
          <p>2. Il tuo amico si registra su SANDER usando il tuo codice.</p>
          <p>3. Ricevi <strong className="text-white">+{INVITER_SC} SC</strong> e <strong className="text-white">+{INVITER_XP} XP</strong> appena si registra.</p>
          <p>4. Il tuo amico riceve <strong className="text-white">+{INVITEE_SC} SC</strong> quando completa il profilo.</p>
          <p>5. Nessun limite — invita quanti amici vuoi!</p>
        </div>
      )}

      {/* Referral leaderboard */}
      {leaderboard.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-1.5">
            <Crown className="h-4 w-4 text-[var(--gold)]" />
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
              Top invitanti
            </p>
          </div>
          <div className="space-y-1.5">
            {leaderboard.map((l, i) => (
              <div
                key={l.id}
                className="flex items-center gap-3 rounded-2xl px-4 py-2.5"
                style={{ background: "var(--surface-2)" }}
              >
                <span className="w-4 text-center text-sm font-bold text-[var(--muted-text)]">
                  {i + 1}
                </span>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-1)] text-xs font-black text-[var(--muted-text)]">
                  {l.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.avatarUrl} alt={l.name} className="h-full w-full object-cover" />
                  ) : (
                    l.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <span className="flex-1 truncate text-sm font-medium text-white">{l.name}</span>
                <span className="text-sm font-black text-[var(--accent)]">{l.invites}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

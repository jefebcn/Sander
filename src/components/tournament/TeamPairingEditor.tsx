"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { Shuffle, Users, Pencil, X } from "lucide-react"
import { randomizePairings, swapPlayers, updateTeamInfo } from "@/actions/tournaments"
import { cn } from "@/lib/utils"
import type { Player, TournamentRegistration } from "@/generated/prisma/client"

type RegWithPlayer = TournamentRegistration & { player: Player }

interface TeamPairingEditorProps {
  tournamentId: string
  registrations: RegWithPlayer[]
}

export function TeamPairingEditor({ tournamentId, registrations }: TeamPairingEditorProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  // Which pair index has the team-info panel open
  const [editingPair, setEditingPair] = useState<number | null>(null)

  // Sort by seedPosition, build consecutive pairs
  const sorted = [...registrations].sort(
    (a, b) => (a.seedPosition ?? 0) - (b.seedPosition ?? 0),
  )
  const pairs: [RegWithPlayer, RegWithPlayer | undefined][] = []
  for (let i = 0; i < sorted.length; i += 2) {
    pairs.push([sorted[i], sorted[i + 1]])
  }

  function handleRandomize() {
    setSelected(null)
    setEditingPair(null)
    startTransition(async () => {
      await randomizePairings(tournamentId)
      router.refresh()
    })
  }

  function handlePlayerTap(playerId: string) {
    if (isPending) return
    if (!selected) {
      setSelected(playerId)
      return
    }
    if (selected === playerId) {
      setSelected(null)
      return
    }
    const prev = selected
    setSelected(null)
    startTransition(async () => {
      await swapPlayers(tournamentId, prev, playerId)
      router.refresh()
    })
  }

  return (
    <div className="mx-4 mb-3 rounded-2xl bg-[var(--surface-1)] p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-wider">Formazione Coppie</p>
        </div>
        <button
          type="button"
          onClick={handleRandomize}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-full bg-[var(--surface-3)] px-3 py-1.5 text-xs font-bold transition-all hover:bg-[var(--surface-4)] active:scale-95 disabled:opacity-50"
        >
          {isPending ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Casuale
        </button>
      </div>

      {/* Contextual hint */}
      <p className="mb-3 text-xs text-[var(--muted-text)]">
        {selected
          ? "Tocca un altro giocatore per scambiarlo"
          : "Tocca un giocatore per selezionarlo, poi tocca un altro per scambiarli"}
      </p>

      {/* Pairs list */}
      <div className="space-y-2">
        {pairs.map(([p1, p2], i) => {
          const hasTeamInfo = !!(p1.teamName || p1.teamLogoUrl)
          const isEditing = editingPair === i

          return (
            <div key={i} className="rounded-xl bg-[var(--surface-2)] overflow-hidden">
              {/* Team name badge + player chips row */}
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="w-5 shrink-0 text-center text-xs font-bold text-[var(--muted-text)]">
                  {i + 1}
                </span>

                <div className="flex flex-1 flex-col gap-1.5">
                  {/* Team name badge (if set) */}
                  {p1.teamName && (
                    <div className="flex items-center gap-1.5">
                      {p1.teamLogoUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p1.teamLogoUrl}
                          alt=""
                          className="h-4 w-4 rounded-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                        />
                      )}
                      <span
                        className="text-[0.65rem] font-black uppercase tracking-wider"
                        style={{ color: "var(--accent)" }}
                      >
                        {p1.teamName}
                      </span>
                    </div>
                  )}

                  {/* Player chips */}
                  <div className="flex items-center gap-2">
                    <PlayerChip
                      name={p1.player.name}
                      isSelected={selected === p1.playerId}
                      onTap={() => handlePlayerTap(p1.playerId)}
                      disabled={isPending}
                    />
                    <span className="shrink-0 text-sm font-bold text-[var(--muted-text)]">+</span>
                    {p2 ? (
                      <PlayerChip
                        name={p2.player.name}
                        isSelected={selected === p2.playerId}
                        onTap={() => handlePlayerTap(p2.playerId)}
                        disabled={isPending}
                      />
                    ) : (
                      <span className="flex-1 rounded-lg bg-[var(--surface-3)] px-3 py-2 text-center text-xs italic text-[var(--muted-text)]">
                        BYE
                      </span>
                    )}
                  </div>
                </div>

                {/* Edit button */}
                <button
                  type="button"
                  onClick={() => setEditingPair(isEditing ? null : i)}
                  className={cn(
                    "shrink-0 flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                    isEditing || hasTeamInfo
                      ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                      : "bg-[var(--surface-3)] text-[var(--muted-text)]",
                  )}
                  aria-label="Modifica nome squadra"
                >
                  {isEditing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Team info panel (expandable) */}
              {isEditing && (
                <TeamInfoPanel
                  tournamentId={tournamentId}
                  leaderPlayerId={p1.playerId}
                  initialName={p1.teamName ?? ""}
                  initialLogoUrl={p1.teamLogoUrl ?? ""}
                  onSaved={() => router.refresh()}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Team info inline panel ───────────────────────────────────────────────────

function TeamInfoPanel({
  tournamentId,
  leaderPlayerId,
  initialName,
  initialLogoUrl,
  onSaved,
}: {
  tournamentId: string
  leaderPlayerId: string
  initialName: string
  initialLogoUrl: string
  onSaved: () => void
}) {
  const [name, setName] = useState(initialName)
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl)
  const [saving, setSaving] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  function scheduleSave(newName: string, newLogo: string) {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      setSaving(true)
      try {
        await updateTeamInfo(tournamentId, leaderPlayerId, newName || null, newLogo || null)
        onSaved()
      } finally {
        setSaving(false)
      }
    }, 600)
  }

  return (
    <div
      className="border-t px-3 py-3 space-y-2"
      style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
    >
      <div className="flex items-center gap-2">
        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--muted-text)] flex-1">
          Nome squadra
        </p>
        {saving && (
          <span className="h-3 w-3 animate-spin rounded-full border border-[var(--accent)] border-t-transparent" />
        )}
      </div>

      <input
        type="text"
        value={name}
        maxLength={30}
        placeholder="Nome squadra…"
        onChange={(e) => {
          setName(e.target.value)
          scheduleSave(e.target.value, logoUrl)
        }}
        className="w-full rounded-xl bg-[var(--surface-3)] px-3 py-2 text-sm font-semibold text-white placeholder:text-[var(--muted-text)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
      />

      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--muted-text)]">
        Logo (URL immagine)
      </p>

      <div className="flex items-center gap-2">
        {logoUrl && !logoError && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="h-7 w-7 rounded-full object-cover shrink-0"
            onError={() => setLogoError(true)}
            onLoad={() => setLogoError(false)}
          />
        )}
        <input
          type="url"
          value={logoUrl}
          placeholder="https://…"
          onChange={(e) => {
            setLogoUrl(e.target.value)
            setLogoError(false)
            scheduleSave(name, e.target.value)
          }}
          className="flex-1 rounded-xl bg-[var(--surface-3)] px-3 py-2 text-sm text-white placeholder:text-[var(--muted-text)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </div>
      {logoError && (
        <p className="text-[0.6rem] text-[var(--danger)]">URL immagine non valido</p>
      )}
    </div>
  )
}

// ─── Player chip ──────────────────────────────────────────────────────────────

function PlayerChip({
  name,
  isSelected,
  onTap,
  disabled,
}: {
  name: string
  isSelected: boolean
  onTap: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      className={cn(
        "min-h-[2.75rem] flex-1 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-all duration-150 active:scale-95",
        isSelected
          ? "bg-[var(--accent)] text-black ring-2 ring-[var(--accent)]/40"
          : "bg-[var(--surface-3)] text-[var(--foreground)] hover:bg-[var(--surface-4)]",
        disabled && !isSelected && "cursor-not-allowed opacity-60",
      )}
    >
      {name}
    </button>
  )
}

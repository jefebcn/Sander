"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { X, LogOut, Trash2 } from "lucide-react"
import { leaveGroup, deleteGroup } from "@/actions/messages"

type Member = { id: string; name: string; avatarUrl: string | null }

export function GroupInfoSheet({
  threadId,
  title,
  members,
  amCreator,
  onClose,
}: {
  threadId: string
  title: string
  members: Member[]
  amCreator: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => setMounted(true), [])
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  async function leave() {
    if (busy) return
    setBusy(true)
    try {
      await leaveGroup(threadId)
      router.push("/messaggi")
    } catch {
      setBusy(false)
    }
  }

  async function del() {
    if (busy) return
    setBusy(true)
    try {
      await deleteGroup(threadId)
      router.push("/messaggi")
    } catch {
      setBusy(false)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[300] flex flex-col justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85dvh] flex-col rounded-t-3xl bg-[var(--surface-1)] pb-6">
        <div className="flex flex-col items-center pt-3">
          <div className="h-1 w-10 rounded-full bg-[var(--surface-3)]" />
        </div>
        <div className="flex items-center justify-between px-5 pb-1 pt-3">
          <h3 className="min-w-0 truncate pr-2 text-lg font-black text-white">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)]"
          >
            <X className="h-4 w-4 text-[var(--muted-text)]" />
          </button>
        </div>
        <p className="px-5 pb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
          {members.length} membri
        </p>

        {/* Members */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <div className="space-y-1">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-2xl px-2 py-2">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-3)]">
                  {m.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.avatarUrl} alt={m.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-black text-[var(--muted-text)]">
                      {m.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="min-w-0 flex-1 truncate font-bold text-white">{m.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 px-4 pt-3">
          <button
            onClick={leave}
            disabled={busy}
            className="flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] font-black text-[var(--danger)] active:opacity-80 disabled:opacity-50"
          >
            <LogOut className="h-5 w-5" />
            Esci dal gruppo
          </button>

          {amCreator &&
            (confirmDelete ? (
              <button
                onClick={del}
                disabled={busy}
                className="flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-2xl font-black text-white active:opacity-80 disabled:opacity-50"
                style={{ background: "var(--danger)" }}
              >
                <Trash2 className="h-5 w-5" />
                Tocca ancora per eliminare
              </button>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
                className="flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] font-black text-[var(--danger)] active:opacity-80 disabled:opacity-50"
              >
                <Trash2 className="h-5 w-5" />
                Elimina gruppo
              </button>
            ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}

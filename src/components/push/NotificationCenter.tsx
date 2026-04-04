"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Bell, BellOff, X, Check } from "lucide-react"
import { getNotifications, markAllRead, markRead } from "@/actions/notifications"

type Notification = {
  id: string
  createdAt: Date | string
  title: string
  body: string
  url: string | null
  readAt: Date | string | null
}

function relativeTime(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 1) return "ora"
  if (minutes < 60) return `${minutes}m fa`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h fa`
  const days = Math.floor(hours / 24)
  return `${days}g fa`
}

interface NotificationCenterProps {
  open: boolean
  onClose: () => void
}

export function NotificationCenter({ open, onClose }: NotificationCenterProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getNotifications()
      .then((data) => setNotifications(data))
      .finally(() => setLoading(false))
  }, [open])

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })))
      router.refresh()
    })
  }

  function handleClickNotification(n: Notification) {
    if (!n.readAt) {
      startTransition(async () => {
        await markRead(n.id)
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)),
        )
        router.refresh()
      })
    }
    if (n.url) {
      onClose()
      router.push(n.url)
    }
  }

  const unread = notifications.filter((n) => !n.readAt).length

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[70] flex max-h-[75dvh] flex-col rounded-t-3xl bg-[var(--surface-1)]"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
      >
        {/* Handle */}
        <div className="mx-auto mt-3 mb-1 h-1 w-10 rounded-full bg-[var(--border)]" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-black text-white">Notifiche</h2>
            {unread > 0 && (
              <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-xs font-black text-black">
                {unread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="flex items-center gap-1 rounded-xl bg-[var(--surface-2)] px-3 py-1.5 text-xs font-bold text-[var(--muted-text)] transition-opacity active:opacity-70"
              >
                <Check className="h-3.5 w-3.5" />
                Tutte lette
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--muted-text)]"
              aria-label="Chiudi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <BellOff className="h-10 w-10 opacity-20" />
              <p className="text-sm text-[var(--muted-text)]">Nessuna notifica ancora</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClickNotification(n)}
                className="flex w-full items-start gap-3 rounded-2xl p-3 text-left transition-colors active:opacity-80"
                style={{ background: n.readAt ? "var(--surface-2)" : "rgba(201,243,29,0.05)", border: n.readAt ? "none" : "1px solid rgba(201,243,29,0.12)" }}
              >
                {/* Unread dot */}
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: n.readAt ? "transparent" : "var(--accent)" }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white leading-tight">{n.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted-text)] leading-relaxed">{n.body}</p>
                </div>
                <span className="shrink-0 text-[0.65rem] text-[var(--muted-text)]">
                  {relativeTime(n.createdAt)}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  )
}

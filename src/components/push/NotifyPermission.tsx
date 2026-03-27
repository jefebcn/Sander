"use client"

import { useState, useEffect, useTransition } from "react"
import { Bell, BellOff } from "lucide-react"
import { subscribePush, unsubscribePush } from "@/actions/push"

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function NotifyPermission() {
  const [status, setStatus] = useState<"unknown" | "denied" | "granted" | "unsupported">("unknown")
  const [subscribed, setSubscribed] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported")
      return
    }
    setStatus(Notification.permission === "denied" ? "denied" : Notification.permission === "granted" ? "granted" : "unknown")

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setSubscribed(!!sub))
    )
  }, [])

  async function enable() {
    if (!VAPID_PUBLIC) return
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setStatus("denied")
        return
      }
      setStatus("granted")

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      })
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
      startTransition(async () => {
        await subscribePush(json)
        setSubscribed(true)
      })
    } catch {
      setStatus("denied")
    }
  }

  async function disable() {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await sub.unsubscribe()
      startTransition(async () => {
        await unsubscribePush(sub.endpoint)
        setSubscribed(false)
        setStatus("unknown")
      })
    }
  }

  if (status === "unsupported") return null

  if (subscribed && status === "granted") {
    return (
      <button
        onClick={disable}
        disabled={isPending}
        className="flex min-h-[3.5rem] w-full items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 font-semibold text-[var(--foreground)] transition-colors active:opacity-70 disabled:opacity-40"
      >
        <BellOff className="h-4 w-4 text-[var(--muted-text)]" />
        <span className="flex-1 text-left">Notifiche attive</span>
        <span className="text-xs rounded-full px-2 py-0.5 font-bold" style={{ background: "rgba(201,243,29,0.12)", color: "var(--accent)" }}>
          ON
        </span>
      </button>
    )
  }

  if (status === "denied") {
    return (
      <div className="flex min-h-[3.5rem] w-full items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4">
        <BellOff className="h-4 w-4 text-[var(--muted-text)]" />
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-[var(--foreground)]">Notifiche bloccate</p>
          <p className="text-xs text-[var(--muted-text)]">Abilitale dalle impostazioni del browser</p>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={enable}
      disabled={isPending}
      className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-bold text-black transition-all active:scale-[0.98] disabled:opacity-40"
      style={{ background: "var(--accent)" }}
    >
      <Bell className="h-5 w-5" />
      Attiva notifiche partita
    </button>
  )
}

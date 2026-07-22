"use client"

import { useEffect, useState, useTransition } from "react"
import { Bell, X } from "lucide-react"
import { subscribePush } from "@/actions/push"

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""
const DISMISS_KEY = "chat_notify_dismissed"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

/** Nudge to enable push, shown atop the chat inbox only when notifications are off. */
export function ChatNotifyPrompt() {
  const [show, setShow] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !VAPID_PUBLIC) return
    if (localStorage.getItem(DISMISS_KEY)) return
    // "denied" → nothing we can do in-app; "granted" → only show if not yet subscribed here.
    if (Notification.permission === "denied") return
    if (Notification.permission === "granted") {
      navigator.serviceWorker.ready.then((reg) =>
        reg.pushManager.getSubscription().then((sub) => setShow(!sub)),
      )
      return
    }
    setShow(true) // permission === "default"
  }, [])

  async function enable() {
    if (!VAPID_PUBLIC) return
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setShow(false)
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      })
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
      startTransition(async () => {
        await subscribePush(json)
        setShow(false)
      })
    } catch {
      setShow(false)
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1")
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      className="mx-4 mb-2 mt-1 flex items-center gap-3 rounded-2xl p-3"
      style={{ background: "var(--surface-2)", border: "1px solid rgba(201,243,29,0.3)" }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: "rgba(201,243,29,0.14)" }}
      >
        <Bell className="h-5 w-5 text-[var(--accent)]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white">Attiva le notifiche</p>
        <p className="text-xs text-[var(--muted-text)]">Per non perderti i messaggi quando l&apos;app è chiusa.</p>
      </div>
      <button
        onClick={enable}
        disabled={isPending}
        className="shrink-0 rounded-xl px-3 py-2 text-sm font-black text-black active:opacity-80 disabled:opacity-50"
        style={{ background: "var(--accent)" }}
      >
        Attiva
      </button>
      <button onClick={dismiss} aria-label="Chiudi" className="shrink-0 text-[var(--muted-text)]">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

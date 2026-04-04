"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function LiveBracketRefresher({ isLive }: { isLive: boolean }) {
  const router = useRouter()

  useEffect(() => {
    if (!isLive) return
    const interval = setInterval(() => router.refresh(), 30_000)
    return () => clearInterval(interval)
  }, [isLive, router])

  return null
}

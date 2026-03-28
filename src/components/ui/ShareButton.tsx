"use client"

import { useState } from "react"
import { Share2, Check } from "lucide-react"

interface ShareButtonProps {
  path: string   // e.g. "/sessions/abc123"
  title: string
  text?: string
}

export function ShareButton({ path, title, text }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = window.location.origin + path
    const shareText = text ?? `${title} — SANDER 🏐`
    try {
      if (navigator.share) {
        await navigator.share({ title, text: shareText, url })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // user dismissed share sheet — ignore
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-sm font-medium"
      style={{ color: copied ? "var(--live)" : "var(--muted-text)" }}
    >
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {copied ? "Copiato!" : "Condividi"}
    </button>
  )
}

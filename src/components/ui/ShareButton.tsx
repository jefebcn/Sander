"use client"

import { useState } from "react"
import { Share2, Check, MessageCircle } from "lucide-react"

interface ShareButtonProps {
  path: string
  title: string
  text?: string
  fullWidth?: boolean
  label?: string
}

export function ShareButton({ path, title, text, fullWidth, label }: ShareButtonProps) {
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

  if (fullWidth) {
    return (
      <button
        onClick={handleShare}
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-bold text-base transition-opacity active:opacity-80"
        style={{
          background: "var(--surface-2)",
          color: copied ? "var(--live)" : "var(--foreground)",
        }}
      >
        {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
        {copied ? "Link copiato!" : (label ?? "Invita un amico")}
      </button>
    )
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

export function WhatsAppShareButton({ path, text }: { path: string; text: string }) {
  function handleClick() {
    const url = window.location.origin + path
    const encoded = encodeURIComponent(`${text}\n${url}`)
    window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer")
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-bold text-base text-white transition-opacity active:opacity-80"
      style={{ background: "#25D366" }}
    >
      <MessageCircle className="h-5 w-5" />
      Condividi su WhatsApp
    </button>
  )
}

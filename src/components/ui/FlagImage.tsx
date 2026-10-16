"use client"

import { useState } from "react"

/**
 * Country flag from flagcdn.com. Renders nothing without a valid ISO code or
 * when the image fails to load (offline on the beach, CDN down), instead of a
 * broken-image icon on the player card.
 */
export function FlagImage({ code, className }: { code?: string | null; className?: string }) {
  const [failed, setFailed] = useState(false)
  const iso = (code ?? "").trim().toLowerCase()
  if (failed || !/^[a-z]{2}$/.test(iso)) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w80/${iso}.png`}
      alt={iso.toUpperCase()}
      crossOrigin="anonymous"
      className={className}
      loading="eager"
      onError={() => setFailed(true)}
    />
  )
}

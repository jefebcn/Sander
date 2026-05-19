"use client"

import { useState } from "react"

interface PlayerPhotoProps {
  src: string
  alt: string
  initials: string
}

export function PlayerPhoto({ src, alt, initials }: PlayerPhotoProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        className="absolute flex items-center justify-center text-3xl font-black"
        style={{
          zIndex: 0,
          top: "15%",
          left: "35%",
          width: "40%",
          height: "35%",
          color: "rgba(255,255,255,.5)",
        }}
      >
        {initials}
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      crossOrigin="anonymous"
      onError={() => setFailed(true)}
      className="absolute object-cover object-center"
      style={{ zIndex: 0, top: "15%", left: "35%", width: "40%", height: "35%" }}
    />
  )
}

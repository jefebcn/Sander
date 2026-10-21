"use client"

import { usePathname } from "next/navigation"

/**
 * A beach photo at the top of every page that fades into the night below it.
 * Each area has its own shot (generated for SANDER: invented people, barefoot,
 * no brands), so the photo also tells you where you are.
 *
 * It scrolls away with the page (absolute, not fixed) so text further down
 * never sits on the photo. Hidden where a page brings its own full-screen
 * imagery or needs a calm background: the Scopri deck and an open chat.
 */
const PHOTOS: { photo: string; paths: string[] }[] = [
  { photo: "set", paths: ["/sessions", "/tournaments", "/segna", "/trova"] },
  { photo: "rally", paths: ["/players", "/settimana", "/stagione", "/bagni"] },
  { photo: "feet", paths: ["/profile", "/messaggi", "/admin"] },
]

function photoFor(pathname: string) {
  const area = PHOTOS.find(({ paths }) => paths.some((p) => pathname === p || pathname.startsWith(`${p}/`)))
  return area?.photo ?? "group"
}

export function PagePhoto() {
  const pathname = usePathname()
  if (pathname === "/scopri" || pathname.startsWith("/messaggi/")) return null
  const photo = photoFor(pathname)
  return (
    <div aria-hidden="true" className="page-photo pointer-events-none absolute inset-x-0 top-0 z-0 mx-auto md:max-w-[560px]">
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative, already sized and compressed */}
      <img key={photo} src={`/bg/${photo}.webp`} alt="" decoding="async" fetchPriority="high" className="page-photo__img" />
    </div>
  )
}

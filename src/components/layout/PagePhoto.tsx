"use client"

import { usePathname } from "next/navigation"

/**
 * A beach photo at the top of every page that fades into the night below it.
 * Each area has its own shot (generated for SANDER: invented people, barefoot,
 * no brands), so the photo also tells you where you are.
 *
 * It scrolls away with the page (absolute, not fixed) so text further down
 * never sits on the photo. Profilo and Scopri have no photo: there the player
 * card and the people are the picture, on the plain night background.
 */
const PHOTOS: { photo: string; paths: string[] }[] = [
  { photo: "set", paths: ["/sessions", "/tournaments", "/segna", "/trova"] },
  { photo: "rally", paths: ["/players", "/settimana", "/stagione", "/bagni"] },
]
const NO_PHOTO = ["/profile", "/messaggi", "/admin", "/scopri"]

function photoFor(pathname: string) {
  const area = PHOTOS.find(({ paths }) => paths.some((p) => pathname === p || pathname.startsWith(`${p}/`)))
  return area?.photo ?? "group"
}

export function PagePhoto() {
  const pathname = usePathname()
  if (NO_PHOTO.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null
  const photo = photoFor(pathname)
  return (
    <div aria-hidden="true" className="page-photo pointer-events-none absolute inset-x-0 top-0 z-0 mx-auto md:max-w-[560px]">
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative, already sized and compressed */}
      <img key={photo} src={`/bg/${photo}.webp`} alt="" decoding="async" fetchPriority="high" className="page-photo__img" />
    </div>
  )
}

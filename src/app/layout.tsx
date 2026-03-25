import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { Providers } from "@/lib/providers"
import { MobileNav } from "@/components/layout/MobileNav"
import { Toaster } from "@/components/ui/Toaster"

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Sander — Beach Volleyball",
  description: "Tournament manager for beach volleyball",
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className={`${geist.variable} h-full`}>
      <body className="min-h-dvh flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <Providers>
          <main className="flex-1 pb-20">{children}</main>
          <MobileNav />
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}

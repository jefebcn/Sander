import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { Providers } from "@/lib/providers"
import { MobileNav } from "@/components/layout/MobileNav"
import { Toaster } from "@/components/ui/Toaster"
import { OnboardingGate } from "@/components/onboarding/OnboardingGate"
import { CookieBanner } from "@/components/layout/CookieBanner"
import { PWAInstallBanner } from "@/components/layout/PWAInstallBanner"
import { SwRegistrar } from "@/components/push/SwRegistrar"

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "SANDER — Beach Volleyball",
  description: "Beach Volleyball Tournament Manager",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/sander-logo.png", type: "image/png" },
    ],
    apple: [
      { url: "/sander-logo.png", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SANDER",
  },
}

export const viewport: Viewport = {
  themeColor: "#0d1a0d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className={`${geist.variable} h-full`}>
      <body className="min-h-dvh flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {/* SANDER logo watermark — fixed behind all content */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sander-logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none fixed left-1/2 top-1/2 z-0 w-[75vw] max-w-xs -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.05]"
          style={{ filter: "blur(2px)" }}
        />
        <Providers>
          <SwRegistrar />
          <OnboardingGate />
          <main className="relative z-10 flex-1 pb-20">{children}</main>
          <MobileNav />
          {/* Banners stacked just above the navbar */}
          <div className="fixed bottom-[4.5rem] left-0 right-0 z-40 flex flex-col gap-2 pointer-events-none [&>*]:pointer-events-auto">
            <PWAInstallBanner />
            <CookieBanner />
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}

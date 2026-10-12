import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Barlow, Barlow_Condensed } from "next/font/google"
import "./globals.css"
import { Providers } from "@/lib/providers"
import { MobileNav } from "@/components/layout/MobileNav"
import { Toaster } from "@/components/ui/Toaster"
import { OnboardingGate } from "@/components/onboarding/OnboardingGate"
import { ClientOnlyBanners } from "@/components/layout/ClientOnlyBanners"
import { SwRegistrar } from "@/components/push/SwRegistrar"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { RefTracker } from "@/components/analytics/RefTracker"

const barlow = Barlow({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
})

// Display face for titles and big numbers — the same condensed uppercase voice
// as the social posts, so app and Instagram feel like one brand.
const barlowCondensed = Barlow_Condensed({
  variable: "--font-condensed",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
})

const TITLE = "SANDER — Beach volley in Riviera Romagnola"
const DESCRIPTION =
  "Trova partite, sfida i giocatori del tuo livello, scala le classifiche dei bagni e organizza tornei di beach volley in Riviera Romagnola (Rimini, Riccione, Cervia, Cesenatico)."

export const metadata: Metadata = {
  metadataBase: new URL("https://www.sanderbv.it"),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "SANDER",
  keywords: [
    "beach volley",
    "Riviera Romagnola",
    "Rimini",
    "Riccione",
    "Cervia",
    "Cesenatico",
    "tornei beach volley",
    "trova partite beach volley",
    "classifica beach volley",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: "/",
    siteName: "SANDER",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "SANDER — Beach volley in Riviera Romagnola" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SANDER",
  },
}

// Pinch-zoom stays enabled: blocking it locks out anyone who needs larger text
// (WCAG 1.4.4). Inputs are ≥16px, so iOS doesn't auto-zoom on focus anyway.
export const viewport: Viewport = {
  themeColor: "#07090a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className={`${barlow.variable} ${barlowCondensed.variable} h-full`}>
      <body className="min-h-dvh flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <Providers>
          <OnboardingGate />
          <SwRegistrar />
          <main className="relative z-10 flex-1 pb-20">
            <PageWrapper>{children}</PageWrapper>
          </main>
          <MobileNav />
          {/* Banners stacked just above the navbar — client-only, lazy loaded */}
          <div className="fixed bottom-[4.5rem] left-0 right-0 z-40 flex flex-col gap-2 pointer-events-none [&>*]:pointer-events-auto">
            <ClientOnlyBanners />
          </div>
          <Toaster />
          <RefTracker />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}

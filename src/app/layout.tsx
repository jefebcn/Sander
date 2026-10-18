import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Figtree, Bricolage_Grotesque, Instrument_Serif } from "next/font/google"
import "./globals.css"
import { Providers } from "@/lib/providers"
import { MobileNav } from "@/components/layout/MobileNav"
import { Toaster } from "@/components/ui/Toaster"
import { OnboardingGate } from "@/components/onboarding/OnboardingGate"
import { ClientOnlyBanners } from "@/components/layout/ClientOnlyBanners"
import { SwRegistrar } from "@/components/push/SwRegistrar"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { RefTracker } from "@/components/analytics/RefTracker"
import { AppBackground, type BackgroundVariant } from "@/components/layout/AppBackground"

// Body: Figtree, round and very legible in the sun.
const figtree = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
})

// Display: Bricolage Grotesque for titles and big numbers, slightly condensed
// through its width axis (see .font-display).
const bricolage = Bricolage_Grotesque({
  variable: "--font-brico",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  display: "swap",
})

// Serif: prompt answers on Scopri cards read like something a person said.
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
})

const TITLE = "SANDER — Beach volley in Riviera Romagnola"
const DESCRIPTION =
  "Il gruppo WhatsApp del beach volley, ma che si organizza da solo: trova partite in Riviera Romagnola (Rimini, Riccione, Cervia, Cesenatico), vedi i posti liberi, sali nella classifica del tuo bagno e del tuo comune."

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
  themeColor: "#0d0c12",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

/** App-wide background: "sunset" (sea at dusk) or "night" (near-black). */
const BG: BackgroundVariant = "sunset"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className={`${figtree.variable} ${bricolage.variable} ${instrument.variable} h-full`}>
      <body data-bg={BG} className="min-h-dvh flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <AppBackground variant={BG} />
        <Providers>
          <OnboardingGate />
          <SwRegistrar />
          {/* No z-index here on purpose: a z-index on <main> makes it a stacking
              context, and every fixed sheet, dialog and CTA inside a page then
              gets trapped beneath the navbar. Content still paints above the
              background because <main> is positioned and comes after it in the
              DOM (AppBackground is z-0). Layers, low to high:
              page content → navbar & banners (z-30) → sheets/dialogs (z-50+).
              On wide screens the app keeps its phone-width column. */}
          <main className="relative w-full flex-1 pb-20 md:mx-auto md:max-w-[560px]">
            <PageWrapper>{children}</PageWrapper>
          </main>
          <MobileNav />
          {/* Banners stacked just above the navbar — client-only, lazy loaded */}
          <div className="fixed bottom-[4.5rem] left-0 right-0 z-30 mx-auto flex flex-col md:max-w-[560px] gap-2 pointer-events-none [&>*]:pointer-events-auto">
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

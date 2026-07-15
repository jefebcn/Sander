import type { MetadataRoute } from "next"

const BASE = "https://www.sanderbv.it"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/profile", "/onboarding", "/auth/"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  }
}

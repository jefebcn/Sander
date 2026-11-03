/**
 * Where a new player came from, from their first visit: a `?ref=` /
 * `utm_source` tag on our own links, an invite link, or the referring site.
 * Stored in the browser on the first visit and saved on the Player when the
 * profile is created, so /admin/metriche can split sign-ups by channel.
 */

export const SIGNUP_SOURCE_KEY = "sander_src"
export const SIGNUP_SOURCE_RE = /^[a-z0-9._-]{1,40}$/

const ALIASES: Record<string, string> = {
  ig: "instagram", insta: "instagram",
  tt: "tiktok", tk: "tiktok",
  fb: "facebook",
  wa: "whatsapp",
  twitter: "x",
}

const HOSTS: [RegExp, string][] = [
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, "facebook"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "whatsapp"],
  [/(^|\.)(t\.co|x\.com|twitter\.com)$/, "x"],
  [/(^|\.)google\.[a-z.]+$/, "google"],
  [/(^|\.)(bing\.com|duckduckgo\.com|ecosia\.org)$/, "ricerca"],
]

function clean(tag: string | null | undefined): string | null {
  const t = (tag ?? "").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 40)
  return t ? ALIASES[t] ?? t : null
}

export function parseSignupSource(input: {
  search: string
  referrer: string
  ownHost: string
}): string {
  const params = new URLSearchParams(input.search)
  const tagged = clean(params.get("ref")) ?? clean(params.get("utm_source"))
  if (tagged) return tagged
  if (params.get("invite")) return "invito"

  let host = ""
  try {
    host = new URL(input.referrer).hostname.toLowerCase()
  } catch {
    return "diretto"
  }
  const own = input.ownHost.toLowerCase().replace(/^www\./, "")
  if (!host || host.replace(/^www\./, "") === own) return "diretto"
  for (const [re, name] of HOSTS) if (re.test(host)) return name
  return clean(host.replace(/^www\./, "")) ?? "diretto"
}

/** Italian label for the admin panel. */
export function signupSourceLabel(source: string | null): string {
  if (!source) return "Non registrata"
  const labels: Record<string, string> = {
    instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", whatsapp: "WhatsApp",
    x: "X", google: "Google (ricerca)", ricerca: "Altri motori", invito: "Invito", diretto: "Diretto",
  }
  return labels[source] ?? source
}

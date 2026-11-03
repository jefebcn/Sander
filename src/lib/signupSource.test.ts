import { describe, expect, it } from "vitest"
import { parseSignupSource, signupSourceLabel } from "./signupSource"

const own = "www.sanderbv.it"
const p = (search: string, referrer = "") => parseSignupSource({ search, referrer, ownHost: own })

describe("parseSignupSource", () => {
  it("prefers our own ?ref= tag, with aliases", () => {
    expect(p("?ref=ig", "https://l.instagram.com/")).toBe("instagram")
    expect(p("?ref=tt")).toBe("tiktok")
    expect(p("?ref=Volantino-Rimini")).toBe("volantino-rimini")
  })

  it("falls back to utm_source, then invite links", () => {
    expect(p("?utm_source=Facebook")).toBe("facebook")
    expect(p("?mode=register&invite=ABC123")).toBe("invito")
  })

  it("reads the referring site", () => {
    expect(p("", "https://l.instagram.com/")).toBe("instagram")
    expect(p("", "https://www.tiktok.com/@sander")).toBe("tiktok")
    expect(p("", "https://www.google.it/")).toBe("google")
    expect(p("", "https://lm.facebook.com/")).toBe("facebook")
    expect(p("", "https://blog.example.org/post")).toBe("blog.example.org")
  })

  it("is direct with no referrer or from our own pages", () => {
    expect(p("")).toBe("diretto")
    expect(p("", "https://sanderbv.it/sessions")).toBe("diretto")
  })

  it("drops characters a tag could use to inject anything", () => {
    expect(p("?ref=<script>alert(1)</script>")).toBe("scriptalert1script")
  })
})

describe("signupSourceLabel", () => {
  it("labels known channels and keeps custom tags", () => {
    expect(signupSourceLabel("instagram")).toBe("Instagram")
    expect(signupSourceLabel("volantino-rimini")).toBe("volantino-rimini")
    expect(signupSourceLabel(null)).toBe("Non registrata")
  })
})

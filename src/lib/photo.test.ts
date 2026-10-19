import { describe, it, expect } from "vitest"
import { resizedPhoto } from "./photo"

const BLOB = "https://wcnbmqkidh6x6zch.public.blob.vercel-storage.com/avatars/u1/1777106152099.jpg"

describe("resizedPhoto", () => {
  it("manda le foto del blob all'ottimizzatore alla larghezza giusta", () => {
    expect(resizedPhoto(BLOB, "thumb")).toBe(`/_next/image?url=${encodeURIComponent(BLOB)}&w=256&q=75`)
    expect(resizedPhoto(BLOB, "full")).toContain("&w=828&")
  })

  it("lascia com'è tutto il resto", () => {
    expect(resizedPhoto("/demo/players/marco-1.webp", "card")).toBe("/demo/players/marco-1.webp")
    expect(resizedPhoto("blob:https://www.sanderbv.it/123", "card")).toBe("blob:https://www.sanderbv.it/123")
    expect(resizedPhoto("data:image/png;base64,AAAA", "thumb")).toBe("data:image/png;base64,AAAA")
    expect(resizedPhoto("https://flagcdn.com/w80/it.png", "thumb")).toBe("https://flagcdn.com/w80/it.png")
    expect(resizedPhoto("https://evil.com/x.public.blob.vercel-storage.com.jpg", "thumb")).toBe("https://evil.com/x.public.blob.vercel-storage.com.jpg")
  })

  it("passa null e undefined", () => {
    expect(resizedPhoto(null, "thumb")).toBeNull()
    expect(resizedPhoto(undefined, "thumb")).toBeUndefined()
  })
})

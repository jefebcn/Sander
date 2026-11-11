import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { buildLegacyCss, escapeClass, findLegacyRules, rgba } from "./legacyColors"

function* files(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (name === "generated" || name === "node_modules") continue
    if (statSync(p).isDirectory()) yield* files(p)
    else if (/\.(tsx?|css)$/.test(name) && !name.endsWith("legacy-colors.css")) yield p
  }
}

describe("legacy colour fallbacks (old Android web views)", () => {
  it("turns opacity-on-variable classes into translucent rgb", () => {
    expect(findLegacyRules('className="bg-[var(--danger)]/15 text-[var(--danger)]"')).toEqual([
      { cls: "bg-[var(--danger)]/15", prop: "background-color", value: "rgb(255 77 109 / 0.15)" },
    ])
    expect(findLegacyRules("bg-[color-mix(in_srgb,var(--social)_16%,transparent)]")[0].value).toBe("rgb(73 217 201 / 0.16)")
  })

  it("keeps per-area colours soft instead of solid", () => {
    expect(findLegacyRules("bg-[color-mix(in_srgb,var(--nav-tone)_16%,transparent)]")[0].value).toBe("rgb(255 255 255 / 0.12)")
  })

  it("escapes selectors the way Tailwind does", () => {
    expect(escapeClass("bg-[var(--danger)]/15")).toBe("bg-\\[var\\(--danger\\)\\]\\/15")
    expect(rgba("#c6f736", 0.14)).toBe("rgb(198 247 54 / 0.14)")
  })

  it("src/app/legacy-colors.css is up to date (run: npx tsx scripts/legacy-colors.mjs)", () => {
    const rules = [...files("src")].flatMap((f) => findLegacyRules(readFileSync(f, "utf8")))
    expect(readFileSync("src/app/legacy-colors.css", "utf8")).toBe(buildLegacyCss(rules))
  })
})

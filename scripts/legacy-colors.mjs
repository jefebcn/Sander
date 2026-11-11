// Writes src/app/legacy-colors.css: translucent colours for old Android web
// views without color-mix (see src/lib/legacyColors.ts). Run after adding a
// "bg-[var(--x)]/NN" class; src/lib/legacyColors.test.ts fails until you do.
//   npx tsx scripts/legacy-colors.mjs
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { buildLegacyCss, findLegacyRules } from "../src/lib/legacyColors.ts"

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (name === "generated" || name === "node_modules") continue
    if (statSync(p).isDirectory()) yield* files(p)
    else if (/\.(tsx?|css)$/.test(name) && !name.endsWith("legacy-colors.css")) yield p
  }
}
const rules = [...files("src")].flatMap((f) => findLegacyRules(readFileSync(f, "utf8")))
writeFileSync("src/app/legacy-colors.css", buildLegacyCss(rules))
console.log(`legacy-colors.css: ${new Set(rules.map((r) => r.cls)).size} classes`)

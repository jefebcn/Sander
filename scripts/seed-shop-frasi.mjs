/* One-off: puts the eleven SANDER phrase shirts in the shop at deploy, each in
   four colours (black first) and sizes S-XL: variants "Nero · M" with their own
   photos per colour. Runs from the production build only and adds a shirt only
   if its slug is not in the shop yet. Never fails the build. Removed again right
   after the shirts are online, so it can't bring back one the admin deletes. */
import { randomBytes } from "node:crypto"
import pg from "pg"

const url = process.env.POSTGRES_URL_NON_POOLING ?? process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL
const SITE = "https://www.sanderbv.it"
const id = () => "c" + randomBytes(12).toString("hex")
const SIZES = ["S", "M", "L", "XL"]
const STOCK = 10
// [colour shown, photo key]; the first one is the cover.
const COLORS = [
  ["Nero", "nero"],
  ["Bianco", "bianco"],
  ["Rosa", "rosa"],
  ["Lime", "lime"],
]
// [photo key, phrase as printed on the back]
const SHIRTS = [
  ["innamoriamo", "E se giocando, poi ci innamoriamo?"],
  ["mai-te", "Si cambia campo, ma io non cambio mai te."],
  ["bronzo-oro", "Con te salgo di carta, da bronzo a oro."],
  ["doppia", "Fallo di doppia: ti ho pensato due volte."],
  ["ci-provo", "Tu alzi, io ci provo!"],
  ["testa", "Ho perso il set e la testa per te."],
  ["si-spoglia", "Chi perde si spoglia, chi vince si innamora."],
  ["lenzuola", "Amo gli scambi lunghi. Sotto le lenzuola."],
  ["doccia", "Via la sabbia: doccia da te o da me?"],
  ["asta", "Alzami la palla, che all'asta ci pensi tu."],
  ["bionda", "Gioco meglio se sei bionda."],
]

const photo = (key, color, view) => `${SITE}/shop-img/frase-${key}-${color}-${view}.jpg`

async function main() {
  if (!url) return console.log("[seed-shop-frasi] no database url, skipped")
  // Preview builds share the database but not the photos' address: wait for production.
  if (process.env.VERCEL_ENV !== "production") return console.log("[seed-shop-frasi] not a production build, skipped")
  const client = new pg.Client({ connectionString: url })
  await client.connect()
  try {
    for (const [i, [key, phrase]] of SHIRTS.entries()) {
      const slug = `maglia-frase-${key}`
      const name = `Maglia «${phrase}»`
      const description = `T-shirt in cotone con logo SANDER sul petto e sulla schiena la frase «${phrase}» e sanderbv.it. In nero, bianco, rosa e lime, taglie S, M, L, XL. Ritiro gratis al torneo o spedizione a casa.`
      const colorImages = Object.fromEntries(
        COLORS.map(([label, c]) => [label, [photo(key, c, "retro"), photo(key, c, "coppia"), ...(c === "nero" ? [`${SITE}/shop-img/maglia-nera-dettaglio.jpg`] : [])]]),
      )
      await client.query("begin")
      const pid = id()
      const { rowCount } = await client.query(
        `insert into shop_products (id, slug, name, description, category, "priceCents", images, "colorImages", active, featured, "sortOrder", "createdAt", "updatedAt")
         values ($1, $2, $3, $4, 'MAGLIE', 1500, $5::jsonb, $6::jsonb, true, false, $7, now(), now())
         on conflict (slug) do nothing`,
        [pid, slug, name, description, JSON.stringify(colorImages.Nero), JSON.stringify(colorImages), 10 + i],
      )
      if (rowCount === 1) {
        let n = 0
        for (const [label] of COLORS) {
          for (const size of SIZES) {
            await client.query(`insert into shop_variants (id, "productId", label, stock, "sortOrder") values ($1, $2, $3, $4, $5)`, [id(), pid, `${label} · ${size}`, STOCK, n++])
          }
        }
        console.log(`[seed-shop-frasi] added ${name}`)
      } else {
        console.log(`[seed-shop-frasi] ${name} already there, skipped`)
      }
      await client.query("commit")
    }
  } catch (e) {
    await client.query("rollback").catch(() => {})
    throw e
  } finally {
    await client.end()
  }
}

main().catch((e) => console.log("[seed-shop-frasi] failed, skipped:", e instanceof Error ? e.message : e))

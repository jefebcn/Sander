/* One-off: puts the two SANDER shirts (black, pink) in the shop at deploy.
   Runs from the production build only and adds each shirt only if its slug
   is not in the shop yet. Never fails the build. Removed again right after
   the shirts are online, so it can't bring back a shirt the admin deletes. */
import { randomBytes } from "node:crypto"
import pg from "pg"

const url = process.env.POSTGRES_URL_NON_POOLING ?? process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL
const SITE = "https://www.sanderbv.it"
const id = () => "c" + randomBytes(12).toString("hex")
const photos = (color) => ["fronte", "retro", "dettaglio"].map((v) => `${SITE}/shop-img/maglia-${color}-${v}.jpg`)
const SIZES = ["S", "M", "L", "XL"]

const SHIRTS = [
  {
    slug: "maglia-sander-nera",
    name: "Maglia SANDER nera",
    color: "nera",
    description: "T-shirt nera in cotone con logo SANDER bianco sul petto. Taglie S, M, L, XL. Ritiro gratis al torneo o spedizione a casa.",
    sortOrder: 2,
  },
  {
    slug: "maglia-sander-rosa",
    name: "Maglia SANDER rosa",
    color: "rosa",
    description: "T-shirt rosa in cotone con logo SANDER nero sul petto. Taglie S, M, L, XL. Ritiro gratis al torneo o spedizione a casa.",
    sortOrder: 3,
  },
]

async function main() {
  if (!url) return console.log("[seed-shop-shirts] no database url, skipped")
  // Preview builds share the database but not the photos' address: wait for production.
  if (process.env.VERCEL_ENV !== "production") return console.log("[seed-shop-shirts] not a production build, skipped")
  const client = new pg.Client({ connectionString: url })
  await client.connect()
  try {
    for (const s of SHIRTS) {
      await client.query("begin")
      const pid = id()
      const { rowCount } = await client.query(
        `insert into shop_products (id, slug, name, description, category, "priceCents", images, active, featured, "sortOrder", "createdAt", "updatedAt")
         values ($1, $2, $3, $4, 'MAGLIE', 1200, $5::jsonb, true, false, $6, now(), now())
         on conflict (slug) do nothing`,
        [pid, s.slug, s.name, s.description, JSON.stringify(photos(s.color)), s.sortOrder],
      )
      if (rowCount === 1) {
        for (const [i, size] of SIZES.entries()) {
          await client.query(`insert into shop_variants (id, "productId", label, stock, "sortOrder") values ($1, $2, $3, 10, $4)`, [id(), pid, size, i])
        }
        console.log(`[seed-shop-shirts] added ${s.name}`)
      } else {
        console.log(`[seed-shop-shirts] ${s.name} already there, skipped`)
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

main().catch((e) => console.log("[seed-shop-shirts] failed, skipped:", e instanceof Error ? e.message : e))

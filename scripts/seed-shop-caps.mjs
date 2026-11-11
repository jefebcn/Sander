/* One-off: puts the first two products (SANDER caps) in the shop at deploy.
   Runs from the build, only while the shop has never had a product or an
   order, so it can never duplicate or bring back products the admin removed.
   Never fails the build. Delete this script once the caps are online. */
import { randomBytes } from "node:crypto"
import pg from "pg"

const url = process.env.POSTGRES_URL_NON_POOLING ?? process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL
const SITE = "https://www.sanderbv.it"
const id = () => "c" + randomBytes(12).toString("hex")
const photos = (color) => ["fronte", "lato", "retro"].map((v) => `${SITE}/shop-img/cappello-${color}-${v}.jpg`)
const DESCRIPTION =
  "Cappellino con visiera curva e logo SANDER ricamato sul fronte. Chiusura regolabile, taglia unica. Ritiro gratis al torneo o spedizione a casa."

const CAPS = [
  { slug: "cappello-sander-bianco", name: "Cappello SANDER bianco", color: "bianco", featured: true, sortOrder: 0 },
  { slug: "cappello-sander-blu", name: "Cappello SANDER blu", color: "blu", featured: false, sortOrder: 1 },
]

async function main() {
  if (!url) return console.log("[seed-shop-caps] no database url, skipped")
  // Preview builds share the database but not the photos' address: wait for production.
  if (process.env.VERCEL_ENV !== "production") return console.log("[seed-shop-caps] not a production build, skipped")
  const client = new pg.Client({ connectionString: url })
  await client.connect()
  try {
    const { rows } = await client.query(
      `select (select count(*) from shop_products)::int as products, (select count(*) from shop_orders)::int as orders`,
    )
    if (rows[0].products > 0 || rows[0].orders > 0) return console.log("[seed-shop-caps] shop already set up, skipped")
    await client.query("begin")
    for (const c of CAPS) {
      const pid = id()
      await client.query(
        `insert into shop_products (id, slug, name, description, category, "priceCents", images, active, featured, "sortOrder", "createdAt", "updatedAt")
         values ($1, $2, $3, $4, 'ACCESSORI', 800, $5::jsonb, true, $6, $7, now(), now())
         on conflict (slug) do nothing`,
        [pid, c.slug, c.name, DESCRIPTION, JSON.stringify(photos(c.color)), c.featured, c.sortOrder],
      )
      await client.query(
        `insert into shop_variants (id, "productId", label, stock, "sortOrder") values ($1, $2, 'Taglia unica', 10, 0)`,
        [id(), pid],
      )
    }
    await client.query("commit")
    console.log("[seed-shop-caps] added 2 caps")
  } catch (e) {
    await client.query("rollback").catch(() => {})
    throw e
  } finally {
    await client.end()
  }
}

main().catch((e) => console.log("[seed-shop-caps] failed, skipped:", e instanceof Error ? e.message : e))

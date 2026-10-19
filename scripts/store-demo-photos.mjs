// Points the local demo profiles at the generated demo photos in public/demo/players
// (fictional people, no brands), before running scripts/store-scopri.mjs.
// Refuses to run against anything but localhost.
//   DATABASE_URL=postgresql://…@localhost:5544/sander node scripts/store-demo-photos.mjs
import pg from "pg"

const url = process.env.DATABASE_URL ?? ""
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
  console.error("store-demo-photos: DATABASE_URL must point to localhost")
  process.exit(1)
}

// Demo account → photo set and how many photos it has.
const PEOPLE = [
  ["test@sander.local", "marco", 3],
  ["scopri0@sander.local", "giorgia", 2],
  ["scopri1@sander.local", "luca", 2],
  ["scopri2@sander.local", "sara", 2],
  ["scopri3@sander.local", "matteo", 2],
  ["scopri4@sander.local", "chiara", 2],
  ["scopri5@sander.local", "davide", 2],
  ["scopri6@sander.local", "elena", 2],
  ["scopri7@sander.local", "andrea", 2],
  ["scopri8@sander.local", "marta", 2],
  ["scopri9@sander.local", "filippo", 2],
]

const c = new pg.Client({ connectionString: url })
await c.connect()
for (const [email, name, n] of PEOPLE) {
  const { rows } = await c.query(`SELECT p.id FROM players p JOIN users u ON u.id = p."userId" WHERE u.email = $1`, [email])
  if (!rows[0]) {
    console.log(`skip ${email}: not found`)
    continue
  }
  const id = rows[0].id
  await c.query(`DELETE FROM player_photos WHERE "playerId" = $1`, [id])
  for (let i = 0; i < n; i++) {
    await c.query(`INSERT INTO player_photos (id, "playerId", url, position) VALUES ($1, $2, $3, $4)`, [`demo_${id}_${i}`, id, `/demo/players/${name}-${i + 1}.webp`, i])
  }
  await c.query(`UPDATE players SET "avatarUrl" = $2 WHERE id = $1`, [id, `/demo/players/${name}-1.webp`])
  console.log(`${email}: ${n} photos`)
}
await c.end()

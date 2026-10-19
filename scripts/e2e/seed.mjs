// E2E seed: a fresh database with one test user and a few Scopri players.
// Refuses to run against anything but localhost (CI service or local dev DB).
import pg from "pg"
import bcrypt from "bcryptjs"

const url = process.env.DATABASE_URL ?? ""
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
  console.error("e2e seed: DATABASE_URL must point to localhost")
  process.exit(1)
}
const c = new pg.Client({ connectionString: url })
await c.connect()
const q = (sql, params = []) => c.query(sql, params)

const PHOTO = "/shea-rouda-YCJoGdoQTgQ-unsplash.jpg"
const hash = await bcrypt.hash("sander123", 10)
const birth = "1995-05-20"

await q(`TRUNCATE users, players RESTART IDENTITY CASCADE`)

async function player(id, name, city, role, rating, { user = true, ready = true } = {}) {
  if (user) await q(`INSERT INTO users (id,name,email,password) VALUES ($1,$2,$3,$4)`, [`u_${id}`, name, `${id}@e2e.local`, hash])
  await q(
    `INSERT INTO players (id,"createdAt","updatedAt",name,"firstName","preferredRole","glickoRating","homeCity","birthDate",gender,"userId","sessionsPlayed")
     VALUES ($1,now(),now(),$2,$2,$3,$4,$5,$6,'Uomo',$7,4)`,
    [id, name, role, rating, city, birth, user ? `u_${id}` : null],
  )
  if (!ready) return
  await q(`INSERT INTO player_photos (id,"playerId",url,position) VALUES ($1,$2,$3,0)`, [`ph_${id}`, id, PHOTO])
  const prompts = [["best_shot", "La diagonale"], ["partner_who", "Non molla mai"], ["after_match", "In acqua"]]
  for (const [i, [key, answer]] of prompts.entries()) {
    await q(`INSERT INTO player_prompts (id,"playerId","promptKey",answer,position,"updatedAt") VALUES ($1,$2,$3,$4,$5,now())`, [`pr_${id}_${i}`, id, key, answer, i])
  }
  await q(`INSERT INTO discover_profiles ("playerId","updatedAt","readyAt") VALUES ($1,now(),now())`, [id])
}

await player("me", "Marco", "Rimini", "DEFENDER", 1500)
await player("anna", "Anna", "Rimini", "BLOCKER", 1520)
await player("luca", "Luca", "Rimini", "BLOCKER", 1560)
await player("sara", "Sara", "Riccione", "DEFENDER", 1480)
// Anna already sent Marco an Ace with a comment.
await q(
  `INSERT INTO player_swipes (id,"fromId","toId",liked,target,"targetId","targetLabel",comment,"isAce",status)
   VALUES ('sw_ace','anna','me',true,'PROMPT','pr_me_0','Il mio colpo migliore è… La diagonale','Giochiamo sabato?',true,'PENDING')`,
)
console.log("e2e seed ok")
await c.end()

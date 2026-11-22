/**
 * What @sanderbeachvolley already has on Buffer: every post and story, sent or
 * scheduled, with its text. The kit's memory against repetition (fresh.mjs)
 * and the refill check (refill.sh) both read it.
 *
 *   node history.mjs > work/history.json
 *
 * Stories carry a short "🏐 …" text with the title they showed (Instagram
 * does not publish story text), so they can be checked too. The Buffer API
 * key is added by the environment's proxy: never read or printed here.
 */
import { execFileSync } from "child_process"

const ORG = "6662e6b878a0488c2b7eecd6"
const IG = "6adf67a12f1f5ed648d9cba6"
const Q = `query($input: PostsInput!, $after: String) { posts(input: $input, first: 50, after: $after) {
  pageInfo { hasNextPage endCursor }
  edges { node { id status dueAt sentAt text metadata { ... on InstagramPostMetadata { type } } } } } }`

const posts = []
let after = null
for (let page = 0; page < 40; page++) {
  const body = JSON.stringify({ query: Q, variables: { input: { organizationId: ORG, filter: { status: ["sent", "scheduled", "error"], channelIds: [IG] } }, after } })
  const json = JSON.parse(execFileSync("curl", ["-sS", "-X", "POST", "https://api.buffer.com", "-H", "Content-Type: application/json", "--data-binary", body, "--max-time", "60"], { encoding: "utf8" }))
  if (json.errors) throw new Error(JSON.stringify(json.errors).slice(0, 400))
  posts.push(...json.data.posts.edges.map((e) => e.node))
  if (!json.data.posts.pageInfo.hasNextPage) break
  after = json.data.posts.pageInfo.endCursor
}

const scheduled = posts.filter((p) => p.status === "scheduled")
const last = scheduled.map((p) => p.dueAt).sort().pop() ?? null
process.stdout.write(JSON.stringify({
  at: new Date().toISOString(),
  scheduled: scheduled.length,
  free: Math.max(0, 10 - scheduled.length),
  lastScheduled: last,
  texts: posts.map((p) => p.text).filter(Boolean),
}, null, 2) + "\n")

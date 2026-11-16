/**
 * Schedules the rendered slots on Buffer (Instagram @sanderbeachvolley).
 *
 *   node publish.mjs out/captions.json urls.json [--dry-run]
 *
 * urls.json maps every file name in captions.json to its public URL (Buffer
 * only takes URLs). The Buffer API key is added by this environment's proxy:
 * it is never read, stored or printed here. Requests go through curl, which
 * uses the proxy (Node's fetch does not).
 *
 * Rules: skip a slot when the same day already has a post (for posts) or a
 * story (for stories), scheduled or already out; keep the channel queue at 10
 * at most (free plan), dropping optional slots first, then the latest ones.
 */
import { readFileSync } from "fs"
import { execFileSync } from "child_process"

const API = "https://api.buffer.com"
const ORG = "6662e6b878a0488c2b7eecd6"
const IG = "6adf67a12f1f5ed648d9cba6"
const QUEUE_MAX = 10

function gql(query, variables) {
  const out = execFileSync("curl", ["-sS", "-X", "POST", API, "-H", "Content-Type: application/json", "--data-binary", JSON.stringify({ query, variables }), "--max-time", "60"], { encoding: "utf8" })
  const json = JSON.parse(out)
  if (json.errors) throw new Error(JSON.stringify(json.errors).slice(0, 400))
  return json.data
}

const POSTS = `query($input: PostsInput!) { posts(input: $input, first: 100) { edges { node { id status dueAt sentAt text error { message } metadata { ... on InstagramPostMetadata { type } } } } } }`
const CREATE = `mutation($input: CreatePostInput!) { createPost(input: $input) {
  ... on PostActionSuccess { post { id dueAt status } }
  ... on MutationError { message } } }`

const romeDay = (iso) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Europe/Rome" })

/** Rome wall clock → UTC ISO, summer time included. */
function romeToUtc(ymd, hm) {
  const [y, m, d] = ymd.split("-").map(Number)
  const [h, min] = hm.split(":").map(Number)
  const guess = Date.UTC(y, m - 1, d, h, min)
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(guess))
  const g = (t) => Number(parts.find((p) => p.type === t).value)
  const asRome = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"))
  return new Date(guess - (asRome - guess)).toISOString().replace(/\.\d{3}Z$/, ".000Z")
}

function channelPosts(statuses) {
  const data = gql(POSTS, { input: { organizationId: ORG, filter: { status: statuses, channelIds: [IG] } } })
  return data.posts.edges.map((e) => e.node)
}

const [capFile, urlFile, ...flags] = process.argv.slice(2)
const dry = flags.includes("--dry-run")
const captions = JSON.parse(readFileSync(capFile, "utf8"))
const urls = JSON.parse(readFileSync(urlFile, "utf8"))

const scheduled = channelPosts(["scheduled"])
const recent = channelPosts(["sent", "error"])
const taken = new Set([...scheduled, ...recent].filter((p) => p.dueAt || p.sentAt).map((p) => `${romeDay(p.dueAt || p.sentAt)}|${p.metadata?.type === "story" ? "story" : "post"}`))

// Did Buffer publish the last story on its own? (Story auto-publishing is not documented.)
const lastStory = recent.filter((p) => p.metadata?.type === "story").sort((a, b) => (b.dueAt || b.sentAt || "").localeCompare(a.dueAt || a.sentAt || ""))[0]
const storiesOk = !lastStory || lastStory.status === "sent"

const slots = Object.entries(captions).map(([id, c]) => ({ id, ...c })).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
const report = { created: [], skipped: [], manualStories: [], storiesAutoPublish: storiesOk, lastStoryError: storiesOk ? null : lastStory?.error?.message ?? lastStory?.status }

let room = QUEUE_MAX - scheduled.length
const todo = []
for (const s of slots) {
  if (taken.has(`${s.date}|${s.type}`)) { report.skipped.push({ id: s.id, reason: `c'è già un ${s.type === "story" ? "storia" : "post"} quel giorno` }); continue }
  if (s.type === "story" && !storiesOk) { report.manualStories.push({ id: s.id, date: s.date, time: s.time, files: s.files.map((f) => urls[f]) }); continue }
  todo.push(s)
}
// Free plan: 10 in the queue. Drop optional slots first, then the latest ones.
while (todo.length > room) {
  const i = todo.findIndex((s) => s.optional)
  const [drop] = todo.splice(i >= 0 ? i : todo.length - 1, 1)
  report.skipped.push({ id: drop.id, reason: "coda Buffer piena (max 10)" })
}

for (const s of todo) {
  const missing = s.files.filter((f) => !urls[f])
  if (missing.length) { report.skipped.push({ id: s.id, reason: `manca l'URL di ${missing.join(", ")}` }); continue }
  const input = {
    channelId: IG,
    text: s.type === "story" ? "" : s.text,
    schedulingType: "automatic",
    mode: "customScheduled",
    dueAt: romeToUtc(s.date, s.time),
    assets: s.files.map((f) => ({ image: { url: urls[f] } })),
    metadata: { instagram: s.type === "story" ? { type: "story", shouldShareToFeed: false, isAiGenerated: true } : { type: "post", shouldShareToFeed: true, isAiGenerated: true } },
    aiAssisted: true,
  }
  if (dry) { report.created.push({ id: s.id, dueAt: input.dueAt, type: s.type, dryRun: true }); continue }
  const res = gql(CREATE, { input }).createPost
  if (res.post) report.created.push({ id: s.id, dueAt: res.post.dueAt, type: s.type, postId: res.post.id })
  else report.skipped.push({ id: s.id, reason: `Buffer: ${res.message}` })
  room--
}

process.stdout.write(JSON.stringify(report, null, 2) + "\n")

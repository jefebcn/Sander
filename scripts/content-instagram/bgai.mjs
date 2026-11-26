/**
 * AI backgrounds for the glow look (Alex, 26/11/2026): Vercel AI Gateway, paid credit.
 * Posts: FLUX 3 (best realism, ~1 MP, ~0,05 $). Stories: GPT Image 2 (1024×1536, sharp at
 * full screen). If one fails (e.g. credit over) the free FLUX.2 Klein steps in.
 *
 * aiPhoto(slotId, shape) → data URL of a fresh photo, or null (the slot then keeps
 * its drawn background). Every photo is generated new, so none ever comes back;
 * it is cached in work/photos-new/<slotId>.jpg so a re-render reuses it.
 *
 * The key is a network secret on ai-gateway.vercel.sh: the session proxy adds it to
 * requests that go through curl (like Buffer in publish.mjs); it is never read here.
 * NO_AI=1 skips generation. Beer: sometimes, even in the lead, never in every post.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { execFileSync } from "child_process"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const KIT = dirname(fileURLToPath(import.meta.url))
const MODELS = {
  post: [["bfl/flux-3-image", "1088x1360"], ["bfl/flux-2-klein-9b", "1088x1360"]],
  story: [["openai/gpt-image-2", "1024x1536"], ["bfl/flux-2-klein-9b", "1088x1936"]],
}

const STYLE = "Photorealistic, shot on 35mm film, natural grain, candid, warm light. Barefoot people in plain sportswear with no logos or writing. No text, no logos, no brand labels, no watermarks."
const FRAME = {
  post: "Vertical 4:5 composition, low camera angle: the top 45% of the frame is only clean sky, nothing else, empty space for text; the scene sits in the lower half.",
  story: "Vertical 9:16 composition: the top half of the frame is clean and empty (sky or plain sand) for text; the scene sits in the lower half.",
}
// [scene, beer?, only this shape] — about one in four has beer.
const SCENES = [
  ["Beach volleyball at golden hour: a player jumps for a spike at the net, sand flying, the sun low on the sea horizon, silhouettes against an orange and violet sky.", false],
  ["At the edge of a beach volleyball court at sunset: an old rusty wheelbarrow full of ice, cold beer bottles with blank labels and watermelon slices, colorful flip-flops; four players mid-rally behind, slightly out of focus.", true],
  ["A happy dog running off with the volleyball outside the court, two barefoot players chasing it and laughing, sand flying, sunset.", false],
  ["Top-down view of the sand at the side of a beach volleyball court: a volleyball, mismatched flip-flops, a striped towel, sunscreen, a bluetooth speaker, the blue boundary line, footprints, the long shadow of the net.", false, "story"],
  ["Two players high-fiving at the net after a point, the ball rolling in the sand, friends cheering on the sideline, late afternoon.", false],
  ["After the match at dusk: four friends sitting on the sand by the net, laughing, a cooler with ice and beer bottles with blank labels, the court lines and a string of warm lights.", true],
  ["Close-up of bare feet diving in the sand to dig a ball, sand exploding, the ball just above the ground, warm low sun.", false],
  ["A child's sandcastle right on the baseline of a beach volleyball court, a player stepping carefully around it, players in the background, golden hour.", false],
  ["Beach volleyball court at noon from a low angle: the net, the ball in the air against a deep blue sky with a few clouds, a player reaching up to set.", false],
  ["Sideline of a summer beach tournament: a bucket of ice with beer bottles with blank labels and lemons, flip-flops, a hand-drawn scoreboard on cardboard, players in action behind.", true],
  ["A bucket of colorful ice lollies melting in the sun next to the net post, players warming up behind, bright summer afternoon.", false],
  ["Four players walking off the court at sunset with their arms around each other's shoulders, long shadows on the sand, the net behind them.", false],
]
const hash = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)

export function scenePrompt(slotId, shape) {
  const list = SCENES.filter(([, , only]) => !only || only === shape)
  const [scene] = list[hash(`${slotId}:${shape}`) % list.length]
  return `${scene} ${FRAME[shape]} ${STYLE}`
}

export async function aiPhoto(slotId, shape = "post") {
  const dir = join(KIT, "work", "photos-new")
  const file = join(dir, `${slotId}.jpg`)
  if (existsSync(file)) return `data:image/jpeg;base64,${readFileSync(file).toString("base64")}`
  if (process.env.NO_AI === "1") return null
  const prompt = scenePrompt(slotId, shape)
  for (const [model, size] of MODELS[shape]) {
    try {
      const body = JSON.stringify({ model, prompt, n: 1, size, response_format: "b64_json" })
      const out = execFileSync("curl", ["-sS", "-X", "POST", "https://ai-gateway.vercel.sh/v1/images/generations", "-H", "Content-Type: application/json", "--data-binary", body, "--max-time", "150"], { encoding: "utf8", maxBuffer: 64 << 20 })
      const j = JSON.parse(out)
      const b = j?.data?.[0]?.b64_json
      if (!b) throw new Error(String(j?.error?.message ?? out).slice(0, 160))
      mkdirSync(dir, { recursive: true })
      writeFileSync(file, Buffer.from(b, "base64"))
      console.error(`[bgai] ${slotId} ${shape}: nuova foto (${model})`)
      return `data:image/jpeg;base64,${b}`
    } catch (e) {
      console.error(`[bgai] ${slotId} ${model}: ${e.message}`)
    }
  }
  console.error(`[bgai] ${slotId}: niente foto, resta la grafica disegnata`)
  return null
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Social content templates — pure caption/hashtag builders.                  */
/*                                                                             */
/*  The auto-content engine reuses the app's Story images and pairs them with  */
/*  ready-to-post Italian captions + local hashtags, so publishing is one tap. */
/* ────────────────────────────────────────────────────────────────────────── */

export type ContentKind = "weekly" | "community" | "tournament"

const SITE = "https://www.sanderbv.it"

const BASE_TAGS = [
  "#beachvolley",
  "#beachvolleyball",
  "#sander",
  "#rimini",
  "#riccione",
  "#romagna",
  "#volley",
  "#sport",
]

export interface ContentDraft {
  kind: ContentKind
  title: string
  caption: string
  hashtags: string
  imagePath: string
}

function withTags(extra: string[] = []): string {
  return [...BASE_TAGS, ...extra].join(" ")
}

export function weeklyDraft(input: {
  playerOfWeek: string | null
  ratingDelta: number
  totalEvents: number
}): ContentDraft {
  const { playerOfWeek, ratingDelta, totalEvents } = input
  const caption = playerOfWeek
    ? `🏐 La classifica della settimana su SANDER!\n\n👑 ${playerOfWeek} è il giocatore della settimana con +${ratingDelta} di rating in ${totalEvents} partite.\n\nTu dove sei finito? Scarica SANDER e scala la classifica ⬆️\n${SITE}/scarica`
    : `🏐 ${totalEvents} partite questa settimana su SANDER!\n\nUnisciti al beach volley della Riviera e scala la classifica ⬆️\n${SITE}/scarica`
  return {
    kind: "weekly",
    title: "Classifica della settimana",
    caption,
    hashtags: withTags(["#classifica", "#ranking"]),
    imagePath: "/api/story/weekly",
  }
}

export function communityDraft(input: {
  players: number
  matches: number
}): ContentDraft {
  const { players, matches } = input
  const caption = `🔥 La community SANDER continua a crescere!\n\n🏐 ${players} giocatori · ${matches} partite giocate\n\nBeach volley, tornei e la tua carta giocatore in un'app. Unisciti 🏖️\n${SITE}/scarica`
  return {
    kind: "community",
    title: "Numeri della community",
    caption,
    hashtags: withTags(["#community", "#beachlife"]),
    imagePath: "/api/story/community",
  }
}

export function tournamentDraft(input: {
  id: string
  name: string
  dateLabel: string
  location: string | null
}): ContentDraft {
  const { id, name, dateLabel, location } = input
  const where = location ? ` a ${location}` : ""
  const caption = `🏆 ${name}\n\n📅 ${dateLabel}${where}\n\nIscrizioni aperte su SANDER — prendi il tuo posto in campo! 🏐\n${SITE}/scarica`
  return {
    kind: "tournament",
    title: name,
    caption,
    hashtags: withTags(["#torneo", "#tournament"]),
    imagePath: `/api/story/tournament?id=${encodeURIComponent(id)}`,
  }
}

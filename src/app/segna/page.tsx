import type { Metadata } from "next"
import { LiveScoreboard } from "@/components/scoreboard/LiveScoreboard"

export const metadata: Metadata = {
  title: "Segna dal vivo — SANDER",
  description: "Il tabellone da campo per il tuo beach volley: tocca e segna.",
}

export default function ScoreboardPage() {
  return <LiveScoreboard />
}

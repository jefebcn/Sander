import type { MetadataRoute } from "next"
import { db } from "@/lib/db"

const BASE = "https://www.sanderbv.it"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/scarica",
    "/stagione",
    "/settimana",
    "/bagni",
    "/segna",
    "/game",
    "/players",
    "/tournaments",
    "/sessions",
    "/privacy",
  ].map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: path === "" || path === "/settimana" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }))

  const [players, tournaments] = await Promise.all([
    db.player.findMany({ select: { id: true, updatedAt: true }, take: 1000 }),
    db.tournament.findMany({ select: { id: true, updatedAt: true }, take: 500 }),
  ]).catch(() => [[], []] as const)

  const playerRoutes: MetadataRoute.Sitemap = players.map((p) => ({
    url: `${BASE}/players/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.5,
  }))

  const tournamentRoutes: MetadataRoute.Sitemap = tournaments.map((t) => ({
    url: `${BASE}/tournaments/${t.id}`,
    lastModified: t.updatedAt,
    changeFrequency: "weekly",
    priority: 0.5,
  }))

  return [...staticRoutes, ...playerRoutes, ...tournamentRoutes]
}

"use server"

import { db } from "@/lib/db"

const SINCE_DAYS = 30
const since = () => new Date(Date.now() - SINCE_DAYS * 24 * 60 * 60 * 1000)

/** Recent completed tournament matches with players and tournament info */
export async function getRecentMatchResults() {
  return db.match.findMany({
    where: {
      isCompleted: true,
      isBye: false,
      updatedAt: { gte: since() },
      teamAScore: { not: null },
    },
    include: {
      players: { include: { player: { select: { id: true, name: true, avatarUrl: true } } } },
      tournament: { select: { id: true, name: true, type: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 40,
  })
}

/** Recent completed sessions */
export async function getRecentSessions() {
  return db.session.findMany({
    where: {
      status: "COMPLETED",
      updatedAt: { gte: since() },
    },
    include: {
      organizer: { select: { id: true, name: true, avatarUrl: true } },
      participants: {
        take: 8,
        include: { player: { select: { id: true, name: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  })
}

/** Recent tournament state transitions (started / completed) */
export async function getRecentTournamentEvents() {
  return db.tournament.findMany({
    where: {
      status: { in: ["LIVE", "COMPLETED"] },
      updatedAt: { gte: since() },
    },
    include: {
      standings: {
        where: { rank: 1 },
        include: { player: { select: { id: true, name: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 15,
  })
}

export type MatchResultItem = Awaited<ReturnType<typeof getRecentMatchResults>>[number]
export type SessionItem = Awaited<ReturnType<typeof getRecentSessions>>[number]
export type TournamentEventItem = Awaited<ReturnType<typeof getRecentTournamentEvents>>[number]

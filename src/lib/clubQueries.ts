import type { Prisma } from "@/generated/prisma/client"

/** What TournamentCard needs, for the club pages. */
export const TOURNAMENT_CARD_SELECT = {
  id: true,
  name: true,
  date: true,
  location: true,
  type: true,
  status: true,
  coverUrl: true,
  skillLevel: true,
  gender: true,
  maxTeams: true,
  priceCents: true,
  priceCurrency: true,
  isOpenForRegistration: true,
  registrationDeadline: true,
  registrations: { where: { isSpectator: false }, select: { id: true } },
} as const satisfies Prisma.TournamentSelect

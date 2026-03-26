import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/**
 * Returns the Player linked to the currently authenticated user,
 * or null if not authenticated / no player profile yet.
 */
export async function getCurrentPlayer() {
  const session = await auth()
  if (!session?.user?.id) return null
  return db.player.findUnique({ where: { userId: session.user.id } })
}

/**
 * Returns the raw NextAuth session (user.id available).
 */
export async function getCurrentSession() {
  return auth()
}

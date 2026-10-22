export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { db } from "@/lib/db"
import { DEFAULT_MAX_GAP, isPlus } from "@/lib/scopri/rules"
import { loadCardRow, readiness, toCard } from "@/lib/scopri/server"
import { gestureFor } from "@/lib/scopri/selfie"
import { dayKey } from "@/lib/datetime"
import { ScopriNav } from "@/components/scopri/ScopriNav"
import { ScopriProfileEditor } from "@/components/scopri/ScopriProfileEditor"

export const metadata: Metadata = { title: "Il tuo profilo Scopri — SANDER" }

export default async function ScopriProfilePage() {
  const player = await getCurrentPlayer()
  if (!player) redirect("/auth/signin?callbackUrl=/scopri/profilo")
  const [first, lastSelfie] = await Promise.all([
    loadCardRow(player.id),
    db.selfieCheck.findFirst({ where: { playerId: player.id }, orderBy: { createdAt: "desc" }, select: { status: true } }),
  ])
  let me = first
  // The profile row is created once, not on every visit.
  if (me && !me.discoverProfile) {
    await db.discoverProfile.upsert({ where: { playerId: player.id }, create: { playerId: player.id }, update: {} })
    me = await loadCardRow(player.id)
  }
  if (!me) redirect("/onboarding/profile")
  const p = me.discoverProfile
  const gesture = gestureFor(player.id, dayKey(new Date()))

  return (
    <div className="px-4 pb-10">
      <ScopriNav active="profilo" />
      <div>
        <ScopriProfileEditor
          data={{
            photos: me.discoverPhotos,
            prompts: me.discoverPrompts.map((x) => ({ position: x.position, promptKey: x.promptKey, answer: x.answer })),
            avatarUrl: me.avatarUrl,
            birthDate: me.birthDate ? me.birthDate.toISOString().slice(0, 10) : null,
            homeCity: me.homeCity,
            gender: me.gender,
            role: me.preferredRole,
            side: p?.side ?? null,
            lookingFor: p?.lookingFor ?? [],
            paused: p?.paused ?? false,
            prefCities: p?.prefCities ?? [],
            prefGender: p?.prefGender ?? null,
            prefRole: p?.prefRole ?? null,
            maxGap: p?.maxGap ?? DEFAULT_MAX_GAP,
            plus: isPlus(p?.plusUntil),
            onlyVerified: p?.onlyVerified ?? false,
            onlyFreeToday: p?.onlyFreeToday ?? false,
            openToMeet: p?.openToMeet ?? false,
            showMe: p?.showMe ?? null,
            meetOnly: p?.meetOnly ?? false,
            meetConsented: !!p?.meetConsentAt,
            selfie: {
              verified: !!p?.photoVerifiedAt,
              last: (lastSelfie?.status as "PENDING" | "APPROVED" | "REJECTED" | undefined) ?? null,
              gesture: { emoji: gesture.emoji, text: gesture.text },
            },
            missing: readiness(me),
            preview: toCard(me),
          }}
        />
      </div>
    </div>
  )
}

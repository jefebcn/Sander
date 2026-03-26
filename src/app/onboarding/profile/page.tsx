export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { ProfileSetupForm } from "@/components/onboarding/ProfileSetupForm"

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/onboarding/profile")
  }

  return <ProfileSetupForm />
}

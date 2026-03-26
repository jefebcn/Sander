export const dynamic = "force-dynamic"

import { Volleyball } from "lucide-react"
import { SignInButton } from "@/components/auth/SignInButton"

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <Volleyball className="mx-auto mb-4 h-16 w-16 text-[var(--accent)]" aria-hidden="true" />
        <h1 className="text-3xl font-black">Sander</h1>
        <p className="mt-1 text-[var(--muted-text)]">Beach Volleyball</p>
      </div>
      <div className="w-full max-w-sm space-y-4">
        <SignInButton callbackUrl="/sessions" />
      </div>
    </div>
  )
}

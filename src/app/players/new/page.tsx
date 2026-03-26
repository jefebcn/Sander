export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/PageHeader"
import { CreatePlayerForm } from "@/components/player/CreatePlayerForm"

export default function NewPlayerPage() {
  return (
    <div>
      <PageHeader title="Nuovo Giocatore" />
      <CreatePlayerForm />
    </div>
  )
}

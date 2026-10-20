import Link from "next/link"
import { Home } from "lucide-react"
import { Gabbo } from "@/components/ui/Gabbo"

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <Gabbo pose="triste" size={150} />
      <div>
        <p className="text-5xl font-black text-white">404</p>
        <p className="mt-2 text-lg font-bold text-white">Palla fuori campo</p>
        <p className="mt-1 text-sm text-[var(--muted-text)]">
          Questa pagina non esiste o è stata spostata.
        </p>
      </div>
      <Link
        href="/"
        className="flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-2xl font-black text-black"
        style={{ background: "var(--accent)" }}
      >
        <Home className="h-5 w-5" />
        Torna alla home
      </Link>
    </div>
  )
}

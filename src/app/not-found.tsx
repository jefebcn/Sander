import Link from "next/link"
import { Home, Volleyball } from "lucide-react"

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-3xl"
        style={{ background: "rgba(201,243,29,0.1)", border: "1px solid rgba(201,243,29,0.25)" }}
      >
        <Volleyball className="h-10 w-10 text-[var(--accent)]" />
      </div>
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

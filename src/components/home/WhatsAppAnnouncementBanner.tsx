"use client"

export function WhatsAppAnnouncementBanner({
  url,
  location,
  title,
  cta,
}: {
  url: string
  location?: string
  title: string
  cta: string
}) {
  return (
    <button
      type="button"
      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      className="slide-up flex w-full items-center gap-3 rounded-2xl p-4 text-left active:opacity-80"
      style={{
        background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
      }}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.862L.057 23.428a.75.75 0 0 0 .937.903l5.4-1.716A11.942 11.942 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.9 0-3.687-.524-5.21-1.437l-.375-.224-3.876 1.232 1.07-3.768-.244-.389A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        {location && (
          <p className="text-xs font-bold uppercase tracking-widest text-white/70">📍 {location}</p>
        )}
        <p className="font-black text-white leading-tight">{title}</p>
        <p className="mt-0.5 text-xs font-semibold text-white/80">{cta} →</p>
      </div>
    </button>
  )
}

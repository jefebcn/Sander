"use client"

import { useState, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { ChevronLeft, Camera, X, User } from "lucide-react"
import { saveProfile } from "@/actions/profile"
import { capturePhoto, isNativeApp, hapticTap } from "@/lib/native"
import { cn } from "@/lib/utils"
import { canGoBackInApp } from "@/lib/navHistory"
import { START_LEVELS, type StartLevel } from "@/lib/startLevel"
import { resizedPhoto } from "@/lib/photo"
import { shrinkImage } from "@/lib/shrinkImage"
import { CityPicker } from "@/components/ui/CityPicker"

// ─── Countries list ────────────────────────────────────────────────────────────
const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia",
  "Austria","Azerbaigian","Bahamas","Bahrain","Bangladesh","Belgio","Belize","Benin",
  "Bielorussia","Bolivia","Bosnia ed Erzegovina","Botswana","Brasile","Bulgaria",
  "Burkina Faso","Burundi","Cambogia","Camerun","Canada","Ciad","Cile","Cina",
  "Cipro","Colombia","Congo","Corea del Nord","Corea del Sud","Costa Rica","Croazia",
  "Cuba","Danimarca","Ecuador","Egitto","El Salvador","Emirati Arabi Uniti","Eritrea",
  "Estonia","Etiopia","Filippine","Finlandia","Francia","Georgia","Germania","Ghana",
  "Giappone","Gibuti","Giordania","Grecia","Guatemala","Guinea","Haiti","Honduras",
  "India","Indonesia","Iran","Iraq","Irlanda","Islanda","Israele","Italia",
  "Kazakistan","Kenya","Kosovo","Kuwait","Laos","Lettonia","Libano","Libia",
  "Liechtenstein","Lituania","Lussemburgo","Macedonia","Madagascar","Malawi","Malaysia",
  "Maldive","Mali","Malta","Marocco","Mauritania","Messico","Moldavia","Monaco",
  "Mongolia","Montenegro","Mozambico","Myanmar","Namibia","Nepal","Nicaragua","Niger",
  "Nigeria","Norvegia","Nuova Zelanda","Oman","Pakistan","Panama","Paraguay","Perù",
  "Polonia","Portogallo","Qatar","Repubblica Ceca","Repubblica Dominicana","Romania",
  "Russia","Ruanda","San Marino","Senegal","Serbia","Sierra Leone","Singapore",
  "Siria","Slovenia","Somalia","Spagna","Sri Lanka","Sudafrica","Sudan","Svezia",
  "Svizzera","Taiwan","Tanzania","Thailandia","Togo","Tunisia","Turchia","Ucraina",
  "Uganda","Ungheria","Uruguay","Uzbekistan","Venezuela","Vietnam","Yemen","Zambia",
  "Zimbabwe",
].sort()

// ISO 3166-1 alpha-2 codes for Italian country names
const COUNTRY_ISO: Record<string, string> = {
  "Afghanistan":"AF","Albania":"AL","Algeria":"DZ","Andorra":"AD","Angola":"AO",
  "Argentina":"AR","Armenia":"AM","Australia":"AU","Austria":"AT","Azerbaigian":"AZ",
  "Bahamas":"BS","Bahrain":"BH","Bangladesh":"BD","Belgio":"BE","Belize":"BZ",
  "Benin":"BJ","Bielorussia":"BY","Bolivia":"BO","Bosnia ed Erzegovina":"BA",
  "Botswana":"BW","Brasile":"BR","Bulgaria":"BG","Burkina Faso":"BF","Burundi":"BI",
  "Cambogia":"KH","Camerun":"CM","Canada":"CA","Ciad":"TD","Cile":"CL","Cina":"CN",
  "Cipro":"CY","Colombia":"CO","Congo":"CG","Corea del Nord":"KP","Corea del Sud":"KR",
  "Costa Rica":"CR","Croazia":"HR","Cuba":"CU","Danimarca":"DK","Ecuador":"EC",
  "Egitto":"EG","El Salvador":"SV","Emirati Arabi Uniti":"AE","Eritrea":"ER",
  "Estonia":"EE","Etiopia":"ET","Filippine":"PH","Finlandia":"FI","Francia":"FR",
  "Georgia":"GE","Germania":"DE","Ghana":"GH","Giappone":"JP","Gibuti":"DJ",
  "Giordania":"JO","Grecia":"GR","Guatemala":"GT","Guinea":"GN","Haiti":"HT",
  "Honduras":"HN","India":"IN","Indonesia":"ID","Iran":"IR","Iraq":"IQ",
  "Irlanda":"IE","Islanda":"IS","Israele":"IL","Italia":"IT","Kazakistan":"KZ",
  "Kenya":"KE","Kosovo":"XK","Kuwait":"KW","Laos":"LA","Lettonia":"LV",
  "Libano":"LB","Libia":"LY","Liechtenstein":"LI","Lituania":"LT","Lussemburgo":"LU",
  "Macedonia":"MK","Madagascar":"MG","Malawi":"MW","Malaysia":"MY","Maldive":"MV",
  "Mali":"ML","Malta":"MT","Marocco":"MA","Mauritania":"MR","Messico":"MX",
  "Moldavia":"MD","Monaco":"MC","Mongolia":"MN","Montenegro":"ME","Mozambico":"MZ",
  "Myanmar":"MM","Namibia":"NA","Nepal":"NP","Nicaragua":"NI","Niger":"NE",
  "Nigeria":"NG","Norvegia":"NO","Nuova Zelanda":"NZ","Oman":"OM","Pakistan":"PK",
  "Panama":"PA","Paraguay":"PY","Perù":"PE","Polonia":"PL","Portogallo":"PT",
  "Qatar":"QA","Repubblica Ceca":"CZ","Repubblica Dominicana":"DO","Romania":"RO",
  "Russia":"RU","Ruanda":"RW","San Marino":"SM","Senegal":"SN","Serbia":"RS",
  "Sierra Leone":"SL","Singapore":"SG","Siria":"SY","Slovenia":"SI","Somalia":"SO",
  "Spagna":"ES","Sri Lanka":"LK","Sudafrica":"ZA","Sudan":"SD","Svezia":"SE",
  "Svizzera":"CH","Taiwan":"TW","Tanzania":"TZ","Thailandia":"TH","Togo":"TG",
  "Tunisia":"TN","Turchia":"TR","Ucraina":"UA","Uganda":"UG","Ungheria":"HU",
  "Uruguay":"UY","Uzbekistan":"UZ","Venezuela":"VE","Vietnam":"VN","Yemen":"YE",
  "Zambia":"ZM","Zimbabwe":"ZW",
}

function flagEmoji(iso: string): string {
  return iso.toUpperCase().split("").map(c =>
    String.fromCodePoint(c.charCodeAt(0) - 65 + 0x1F1E6)
  ).join("")
}

function countryDisplay(name: string): string {
  if (!name) return ""
  const iso = COUNTRY_ISO[name]
  return iso ? `${flagEmoji(iso)} ${name}` : name
}

const GENDERS = ["Uomo", "Donna", "Altro"] as const
type Gender = typeof GENDERS[number]

// ─── Sub-components ────────────────────────────────────────────────────────────

function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={cn(
        "fixed inset-0 z-[300] flex flex-col justify-end transition-all duration-300",
        open ? "visible" : "invisible",
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black transition-opacity duration-300",
          open ? "opacity-60" : "opacity-0",
        )}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={cn(
          "relative z-10 flex flex-col rounded-t-3xl bg-[var(--surface-2)] transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full",
        )}
        style={{ maxHeight: "80dvh" }}
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="-mr-1.5 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-3)]"
          >
            <X className="h-5 w-5 text-[var(--muted-text)]" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FormRow({
  label,
  value,
  placeholder,
  onClick,
  isInput,
  inputType,
  onInputChange,
  disabled,
}: {
  label: string
  value: string
  placeholder: string
  onClick?: () => void
  isInput?: boolean
  inputType?: string
  onInputChange?: (v: string) => void
  disabled?: boolean
}) {
  return (
    <div className="border-b border-[var(--border)]">
      {isInput ? (
        <label className="flex min-h-[3.5rem] items-center justify-between gap-3 px-5">
          <span className="shrink-0 text-base font-medium text-white">{label}</span>
          <input
            type={inputType ?? "text"}
            value={value}
            onChange={(e) => onInputChange?.(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="min-w-0 flex-1 bg-transparent text-right text-base text-[var(--accent)] placeholder:text-[var(--accent)]/60 focus:outline-none disabled:text-[var(--muted-text)]"
          />
        </label>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className="flex min-h-[3.5rem] w-full items-center justify-between px-5 active:bg-white/5"
        >
          <span className="text-base font-medium text-white">{label}</span>
          <span className={cn("text-base", value ? "text-white" : "text-[var(--accent)]")}>
            {value || placeholder}
          </span>
        </button>
      )}
    </div>
  )
}

/** "01 · NOME": the small numbered label above each question. */
function Step({ n, label }: { n: string; label: string }) {
  return (
    <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-white/60">
      <span className="text-[var(--accent)]">{n}</span> · {label}
    </span>
  )
}

// ─── Main form ─────────────────────────────────────────────────────────────────

interface InitialData {
  firstName:   string
  lastName:    string
  birthDate:   string
  gender:      string
  nationality: string
  avatarUrl:   string | null
  preferredRole?: Role
  homeCity?: string | null
  startLevel?: string | null
}

type Role = "BLOCKER" | "DEFENDER"

/** One name per role across the whole app. It used to be "Attaccante" in the
    player form and "Muro" in /trova for the very same value. */
const ROLES: { value: Role; label: string; hint: string }[] = [
  { value: "BLOCKER",  label: "Muro",      hint: "A rete, chiudi gli attacchi" },
  { value: "DEFENDER", label: "Difensore", hint: "Dietro, recuperi tutto" },
]

export function ProfileSetupForm({ initialData, email }: { initialData?: InitialData; email?: string | null }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData?.avatarUrl ?? null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [firstName, setFirstName] = useState(initialData?.firstName ?? "")
  const [lastName, setLastName] = useState(initialData?.lastName ?? "")
  const [birthDate, setBirthDate] = useState(initialData?.birthDate ?? "")
  const [gender, setGender] = useState<Gender | "">(
    (initialData?.gender as Gender | "") ?? ""
  )
  const [nationality, setNationality] = useState(initialData?.nationality ?? "")
  const [nationalitySearch, setNationalitySearch] = useState("")
  const [role, setRole] = useState<Role | "">(initialData?.preferredRole ?? "")
  const [homeCity, setHomeCity] = useState(initialData?.homeCity ?? "")
  const [startLevel, setStartLevel] = useState<StartLevel | "">((initialData?.startLevel as StartLevel | undefined) ?? "")
  const [error, setError] = useState<string | null>(null)

  const [genderOpen, setGenderOpen] = useState(false)
  const [nationalityOpen, setNationalityOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(nationalitySearch.toLowerCase()),
  )

  // Only what we genuinely need to create a player card. Date of birth, gender
  // and nationality used to be mandatory here and cost us newcomers.
  const isValid = firstName.trim().length >= 1 && role !== ""

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
  }

  // In the native app use the system camera/gallery; on the web use the file input.
  async function handleAvatarButton() {
    hapticTap()
    if (isNativeApp()) {
      const blob = await capturePhoto()
      if (blob) {
        const file = new File([blob], "avatar.jpg", { type: blob.type || "image/jpeg" })
        setAvatarFile(file)
        setAvatarPreview(URL.createObjectURL(blob))
        return
      }
    }
    fileInputRef.current?.click()
  }

  async function uploadAvatar(): Promise<string | null> {
    if (!avatarFile) return null
    try {
      const fd = new FormData()
      fd.append("file", await shrinkImage(avatarFile))
      const res = await fetch("/api/avatar", { method: "POST", body: fd })
      const json = await res.json()
      return json.url ?? null
    } catch {
      return null
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setError(null)
    startTransition(async () => {
      try {
        const avatarUrl = await uploadAvatar()
        await saveProfile({
          firstName: firstName.trim(),
          preferredRole: role as Role,
          lastName: lastName.trim() || undefined,
          birthDate: birthDate || undefined,
          gender: gender || undefined,
          nationality: nationality || undefined,
          avatarUrl,
          homeCity: homeCity || undefined,
          startLevel: startLevel || undefined,
        })
        localStorage.setItem("sander_onboarded", "1")
        localStorage.setItem("sander_has_profile", "1")
        // Editing from the profile goes back there; a brand-new player goes
        // straight into the app. Sign-up stays one step: the Scopri profile is
        // offered afterwards (home card, Scopri tab, morning reminder), never
        // in the way of getting in.
        router.push(initialData ? "/profile" : "/")
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore durante il salvataggio")
      }
    })
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col overflow-y-auto bg-[var(--background)]">
      {/* The poster backdrop: grainy graphite, like the rest of the app. */}
      <div aria-hidden="true" className="app-bg app-bg--aurora pointer-events-none fixed inset-0 -z-10">
        <div className="app-bg__glow" />
        <div className="app-bg__grain" />
      </div>

      {/* Header: small corner info, then the big hand-drawn title. */}
      <div className="px-5 pb-2" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}>
        <div className="flex min-h-[2.75rem] items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
          {/* Only when editing an existing profile. For a brand-new user this
              button pushed to /auth/signin — an unlabelled way out of the app. */}
          {initialData ? (
            <button
              onClick={() => (canGoBackInApp() ? router.back() : router.push("/profile"))}
              type="button"
              aria-label="Indietro"
              className="-ml-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors active:bg-white/20"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : (
            <span>SANDER</span>
          )}
          <span>{initialData ? "Profilo" : "Ultimo passo"}</span>
          <span>Gratis</span>
        </div>
        <h1 className="font-hand mt-4 text-[3.25rem] leading-[0.92] text-white">
          {initialData ? (
            <>Il tuo <span className="text-[var(--accent)]">profilo</span></>
          ) : (
            <>Crea la tua <span className="text-[var(--accent)]">carta</span></>
          )}
        </h1>
        <p className="mt-2 text-base leading-snug text-white/70">
          {initialData
            ? "Aggiorna i tuoi dati quando vuoi."
            : "Bastano nome e ruolo. Comune e livello ti portano subito alle partite giuste."}
        </p>
        {/* A new account lands here from every page. Without this, someone
            signed in with the wrong account (say Google on a new computer)
            had no way back to the sign-in: it bounced them here again. */}
        {!initialData && email && (
          <p className="mt-3 text-sm text-white/70">
            Sei entrato come <strong className="text-white">{email}</strong>.{" "}
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("sander_has_profile")
                signOut({ callbackUrl: "/auth/signin" })
              }}
              className="inline-flex min-h-[2.75rem] items-center font-bold text-[var(--accent)] underline"
            >
              Non sei tu? Esci
            </button>
          </p>
        )}
      </div>

      {/* Avatar: a photo sticker with a white die-cut border. */}
      <div className="flex flex-col items-center gap-3 py-7">
        <div className="relative">
          <button
            type="button"
            onClick={handleAvatarButton}
            className="film relative flex h-36 w-32 -rotate-[4deg] items-center justify-center overflow-hidden rounded-[1.25rem] shadow-[0_18px_34px_-12px_rgb(0_0_0/0.8)] ring-[6px] ring-white"
            style={{ background: "var(--accent)" }}
            aria-label="Cambia foto profilo"
          >
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resizedPhoto(avatarPreview, "card")} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <User className="h-14 w-14 text-black/65" strokeWidth={2.25} aria-hidden="true" />
            )}
          </button>
          {/* Camera badge */}
          <button
            type="button"
            onClick={handleAvatarButton}
            className="absolute -bottom-3 -right-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-black shadow-lg ring-4 ring-[var(--background)]"
            aria-label="Carica foto"
          >
            <Camera className="h-5 w-5" aria-hidden="true" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <p className="font-hand rotate-[-2deg] text-xl text-white/75">una foto in campo, meglio</p>
      </div>

      {/* Form: numbered steps, like the info rows on the posters. */}
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <div className="border-t border-white/10 px-5 py-5">
          <Step n="01" label="Nome" />
          <label htmlFor="onb-first-name" className="font-hand mt-1 block text-[1.9rem] leading-tight text-white">
            Come ti chiami?
          </label>
          <input
            id="onb-first-name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Il tuo nome"
            autoComplete="given-name"
            className="mt-2 w-full border-b-2 border-white/25 bg-transparent pb-2 font-display text-[1.75rem] font-extrabold text-white placeholder:text-white/30 focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        {/* Role: the whole "complementary role" matching in /trova is built on
            this, and the main onboarding never asked for it. */}
        <div className="border-t border-white/10 px-5 py-5">
          <Step n="02" label="Ruolo" />
          <p className="font-hand mt-1 text-[1.9rem] leading-tight text-white">In campo come giochi?</p>
          <p className="mt-0.5 text-sm text-white/65">Ci serve per trovarti compagni complementari.</p>
          <div className="mt-3 flex gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                aria-pressed={role === r.value}
                className={cn(
                  "flex min-h-[3.75rem] flex-1 flex-col items-center justify-center rounded-[1.25rem] px-3 transition-colors",
                  role === r.value ? "sel-on" : "sel-off",
                )}
              >
                <span className="text-base font-black">{r.label}</span>
                <span className={cn("text-xs", role === r.value ? "text-black/70" : "text-white/60")}>{r.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Two one-tap questions that make the first home about *your* town
            and *your* level. Optional, so they never block sign-up. */}
        <div className="border-t border-white/10 px-5 py-5">
          <Step n="03" label="Comune" />
          <p className="font-hand mt-1 text-[1.9rem] leading-tight text-white">Dove giochi di solito?</p>
          <p className="mt-0.5 text-sm text-white/65">
            Ti mostriamo prima le partite e la classifica del tuo comune. SANDER cresce con te: vale ovunque in Italia.
          </p>
          <CityPicker value={homeCity} onChange={setHomeCity} className="mt-3" />
        </div>

        <div className="border-t border-white/10 px-5 py-5">
          <Step n="04" label="Livello" />
          <p className="font-hand mt-1 text-[1.9rem] leading-tight text-white">Che livello sei?</p>
          <p className="mt-0.5 text-sm text-white/65">Per proporti partite giuste per te. Poi conta solo come giochi.</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {START_LEVELS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setStartLevel(l.id)}
                aria-pressed={startLevel === l.id}
                className={cn(
                  "flex min-h-[3.75rem] flex-col items-center justify-center rounded-[1.25rem] px-2 text-center transition-colors",
                  startLevel === l.id ? "sel-on" : "sel-off",
                )}
              >
                <span className="text-sm font-black">{l.label}</span>
                <span className={cn("text-xs leading-tight", startLevel === l.id ? "text-black/70" : "text-white/60")}>
                  {l.hint}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Everything below was mandatory before showing any content. */}
        <details className="border-t border-white/10">
          <summary className="flex min-h-[3.5rem] cursor-pointer items-center px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white/75">
            Completa il profilo&nbsp;<span className="normal-case tracking-normal text-white/50">(opzionale)</span>
          </summary>
          <div className="border-t border-[var(--border)]">
            <FormRow
              label="Cognome"
              value={lastName}
              placeholder="Inserisci il tuo cognome"
              isInput
              onInputChange={setLastName}
            />
            <FormRow
              label="Data di nascita"
              value={birthDate}
              placeholder="Scegli la data"
              isInput
              inputType="date"
              onInputChange={setBirthDate}
              // Set once: Scopri is 18+, so the date can't be changed later.
              disabled={!!initialData?.birthDate}
            />
            <FormRow
              label="Genere"
              value={gender}
              placeholder="Seleziona genere"
              onClick={() => setGenderOpen(true)}
            />
            <FormRow
              label="Nazionalità"
              value={countryDisplay(nationality)}
              placeholder="Seleziona nazionalità"
              onClick={() => setNationalityOpen(true)}
            />
          </div>
        </details>

        {error && (
          <p className="mx-5 mt-4 rounded-xl bg-[var(--danger)]/15 px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        )}

        <div className="flex-1" />

        {/* Conferma: sticks to the bottom over a fade, so it's always reachable. */}
        <div
          className="sticky bottom-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent px-5 pt-6"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
        >
          <button
            type="submit"
            disabled={!isValid || isPending}
            className={cn(
              "flex min-h-[3.75rem] w-full items-center justify-center rounded-full text-lg font-black transition-all",
              isValid && !isPending ? "bg-[var(--accent)] text-black" : "bg-[var(--surface-3)] text-[var(--muted-text)]",
            )}
          >
            {isPending ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
            ) : (
              "Conferma"
            )}
          </button>
        </div>
      </form>

      {/* Gender sheet */}
      <BottomSheet
        open={genderOpen}
        onClose={() => setGenderOpen(false)}
        title="Genere"
      >
        <div className="overflow-y-auto pb-8">
          {GENDERS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => {
                setGender(g)
                setGenderOpen(false)
              }}
              className="flex min-h-[3.5rem] w-full items-center justify-between border-b border-[var(--border)] px-5 active:bg-white/5"
            >
              <span className="text-base text-white">{g}</span>
              {gender === g && (
                <div className="h-3 w-3 rounded-full bg-[var(--accent)]" />
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Nationality sheet */}
      <BottomSheet
        open={nationalityOpen}
        onClose={() => {
          setNationalityOpen(false)
          setNationalitySearch("")
        }}
        title="Nazionalità"
      >
        {/* Search */}
        <div className="px-5 pb-3">
          <input
            type="search"
            value={nationalitySearch}
            onChange={(e) => setNationalitySearch(e.target.value)}
            placeholder="Cerca paese..."
            aria-label="Cerca paese"
            className="w-full rounded-xl bg-[var(--surface-3)] px-4 py-2.5 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none"
            autoFocus={nationalityOpen}
          />
        </div>
        <div className="overflow-y-auto pb-8" style={{ maxHeight: "50dvh" }}>
          {filteredCountries.map((country) => (
            <button
              key={country}
              type="button"
              onClick={() => {
                setNationality(country)
                setNationalityOpen(false)
                setNationalitySearch("")
              }}
              className="flex min-h-[3.5rem] w-full items-center justify-between border-b border-[var(--border)] px-5 active:bg-white/5"
            >
              <span className="text-base text-white">{countryDisplay(country)}</span>
              {nationality === country && (
                <div className="h-3 w-3 rounded-full bg-[var(--accent)]" />
              )}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}

"use client"

import { useState, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Camera, ChevronRight, X } from "lucide-react"
import { saveProfile } from "@/actions/profile"
import { cn } from "@/lib/utils"

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
          "relative z-10 flex flex-col rounded-t-3xl bg-[#1e1e1e] transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full",
        )}
        style={{ maxHeight: "80dvh" }}
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-3)]"
          >
            <X className="h-4 w-4 text-[var(--muted-text)]" />
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
}: {
  label: string
  value: string
  placeholder: string
  onClick?: () => void
  isInput?: boolean
  inputType?: string
  onInputChange?: (v: string) => void
}) {
  return (
    <div className="border-b border-[#2a2a2a]">
      {isInput ? (
        <div className="flex min-h-[3.5rem] items-center justify-between px-5">
          <span className="shrink-0 text-base font-medium text-white">{label}</span>
          <input
            type={inputType ?? "text"}
            value={value}
            onChange={(e) => onInputChange?.(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-right text-base text-[var(--accent)] placeholder:text-[var(--accent)]/60 focus:outline-none"
          />
        </div>
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

// ─── Main form ─────────────────────────────────────────────────────────────────

export function ProfileSetupForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [gender, setGender] = useState<Gender | "">("")
  const [nationality, setNationality] = useState("")
  const [nationalitySearch, setNationalitySearch] = useState("")
  const [error, setError] = useState<string | null>(null)

  const [genderOpen, setGenderOpen] = useState(false)
  const [nationalityOpen, setNationalityOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(nationalitySearch.toLowerCase()),
  )

  const isValid =
    firstName.trim().length >= 1 &&
    lastName.trim().length >= 1 &&
    birthDate.length === 10 &&
    gender !== "" &&
    nationality !== ""

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
  }

  async function uploadAvatar(): Promise<string | null> {
    if (!avatarFile) return null
    try {
      const fd = new FormData()
      fd.append("file", avatarFile)
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
          lastName: lastName.trim(),
          birthDate,
          gender: gender as Gender,
          nationality,
          avatarUrl,
        })
        if (typeof window !== "undefined") {
          localStorage.setItem("sander_onboarded", "1")
          // Full reload so OnboardingGate re-reads localStorage and stays hidden
          window.location.href = "/sessions"
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore durante il salvataggio")
      }
    })
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col overflow-y-auto bg-[#181818]">
      {/* Header */}
      <div
        className="flex items-center px-4 pt-14 pb-2"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 3.5rem)" }}
      >
        <button
          onClick={() => router.push("/")}
          aria-label="Indietro"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2a2a2a] text-white transition-colors active:bg-[#333]"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Avatar */}
      <div className="flex justify-center py-6">
        <div className="relative">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full"
            style={{ background: "var(--accent)" }}
            aria-label="Cambia foto profilo"
          >
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <svg viewBox="0 0 100 100" className="h-20 w-20" fill="none">
                <circle cx="50" cy="38" r="18" fill="rgba(0,0,0,0.25)" />
                <ellipse cx="50" cy="80" rx="28" ry="18" fill="rgba(0,0,0,0.25)" />
              </svg>
            )}
          </button>
          {/* Camera badge */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#2a2a2a] shadow-lg"
            aria-label="Carica foto"
          >
            <Camera className="h-4 w-4 text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      {/* Form rows */}
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <div className="border-t border-[#2a2a2a]">
          <FormRow
            label="Nome"
            value={firstName}
            placeholder="Inserisci il tuo nome"
            isInput
            onInputChange={setFirstName}
          />
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

        {error && (
          <p className="mx-5 mt-4 rounded-xl bg-[var(--danger)]/15 px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        )}

        <div className="flex-1" />

        {/* Conferma button */}
        <button
          type="submit"
          disabled={!isValid || isPending}
          className={cn(
            "flex min-h-[4rem] w-full flex-shrink-0 items-center justify-center font-black text-lg text-black transition-all",
            isValid && !isPending
              ? "bg-[var(--accent)]"
              : "bg-[var(--surface-3)] text-[var(--muted-text)]",
          )}
          style={{
            borderRadius: 0,
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {isPending ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
          ) : (
            "Conferma"
          )}
        </button>
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
              className="flex min-h-[3.5rem] w-full items-center justify-between border-b border-[#2a2a2a] px-5 active:bg-white/5"
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
            className="w-full rounded-xl bg-[#2a2a2a] px-4 py-2.5 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none"
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
              className="flex min-h-[3.5rem] w-full items-center justify-between border-b border-[#2a2a2a] px-5 active:bg-white/5"
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

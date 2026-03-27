"use client"

import { useRef, useState } from "react"
import { Plus, Loader2 } from "lucide-react"
import { uploadVideo } from "@/actions/videos"

export function VideoUploadButton() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<"idle" | "uploading" | "done" | "error">("idle")
  const [msg, setMsg] = useState("")

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setState("uploading")
    setMsg("")

    try {
      const fd = new FormData()
      fd.append("video", file)
      await uploadVideo(fd)
      setState("done")
      setMsg("Video caricato! Attendi la revisione dell'admin")
    } catch (err: unknown) {
      setState("error")
      setMsg(err instanceof Error ? err.message : "Errore durante il caricamento")
    } finally {
      // reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFile}
      />

      <button
        onClick={() => { setState("idle"); setMsg(""); inputRef.current?.click() }}
        disabled={state === "uploading"}
        className="flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-sm text-black min-h-[3.5rem] active:opacity-80 disabled:opacity-50"
        style={{ background: "var(--accent)" }}
      >
        {state === "uploading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {state === "uploading" ? "Caricamento…" : "Carica il tuo video"}
      </button>

      {msg && (
        <p
          className="text-center text-sm font-medium"
          style={{ color: state === "error" ? "var(--danger)" : "var(--accent)" }}
        >
          {msg}
        </p>
      )}
    </div>
  )
}

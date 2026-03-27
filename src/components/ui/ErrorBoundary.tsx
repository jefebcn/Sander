"use client"

import { Component, type ReactNode } from "react"

interface Props { children: ReactNode; label?: string }
interface State { error: string | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(err: unknown): State {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: msg }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="rounded-2xl px-4 py-3 text-sm font-semibold"
          style={{ background: "#ef444420", color: "#ef4444" }}
        >
          <p className="font-bold mb-1">{this.props.label ?? "Errore"}</p>
          <p className="text-xs opacity-80 break-all">{this.state.error}</p>
        </div>
      )
    }
    return this.props.children
  }
}

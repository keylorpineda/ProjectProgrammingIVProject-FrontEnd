/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Terminal, X } from "lucide-react"

interface TerminalAlertProps {
  title?: string
  message: string
  type?: "error" | "warning" | "success" | "system"
  onClose?: () => void
}

export default function TerminalAlert({
  title = "SYSTEM ALERT",
  message,
  type = "warning",
  onClose,
}: TerminalAlertProps) {
  const themes = {
    error: {
      border: "border-2 border-[#9c2720]",
      bg: "bg-[#9c2720]/15",
      text: "text-red-500",
      tag: "bg-[#9c2720] text-[#e0d8cc]",
      accent: "border-red-500",
    },
    warning: {
      border: "border-2 border-[#c27c2f]",
      bg: "bg-[#c27c2f]/10",
      text: "text-[#c27c2f]",
      tag: "bg-[#c27c2f] text-[#161513]",
      accent: "border-[#c27c2f]",
    },
    success: {
      border: "border-2 border-emerald-600",
      bg: "bg-emerald-950/20",
      text: "text-emerald-400",
      tag: "bg-emerald-600 text-black",
      accent: "border-emerald-500",
    },
    system: {
      border: "border-2 border-zinc-700",
      bg: "bg-zinc-900/40",
      text: "text-zinc-300",
      tag: "bg-zinc-800 text-zinc-300",
      accent: "border-zinc-500",
    },
  }

  const activeTheme = themes[type]

  return (
    <div className={`p-4 font-mono select-none ${activeTheme.border} ${activeTheme.bg}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Terminal className={`h-5 w-5 ${activeTheme.text} animate-pulse`} />
          <span
            className={`px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider ${activeTheme.tag}`}
          >
            {title}
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-300">{message}</p>
      <div className="mt-1 text-sm text-zinc-500 flex justify-between uppercase">
        <span>BUNKER RECV DECRYPTED OK</span>
        <span>LATENCY: ~320MS</span>
      </div>
    </div>
  )
}

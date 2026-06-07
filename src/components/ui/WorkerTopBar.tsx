import { LogOut } from "lucide-react"
import { useEffect, useState } from "react"

import { useMyBadges } from "@/features/worker/hooks/useWorkerAPI"
import { useAuth } from "@/pages/Admin/context/AuthContext"

interface WorkerTopBarProps {
  campName?: string | number
  activeLabel?: string
  onLogout?: () => void
}

function getRankLabel(n: number) {
  if (n >= 10) return "LEYENDA"
  if (n >= 7) return "ELITE"
  if (n >= 4) return "VETERANO"
  if (n >= 2) return "SOLDADO"
  return "RECLUTA"
}

export default function WorkerTopBar({ campName, activeLabel, onLogout }: WorkerTopBarProps) {
  const { user } = useAuth()
  const { data: badges } = useMyBadges()
  const badgeCount = badges?.length ?? 0

  const [utcTime, setUtcTime] = useState("")
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const formatted = now.toISOString().replace("T", " ").slice(0, 19) + " UTC"
      setUtcTime(formatted)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="bg-[#121110] border-b-2 border-black flex flex-col sm:flex-row justify-between items-center px-4 md:px-6 py-3 gap-4 shrink-0 font-mono select-none z-10 shadow-md">
      <div className="flex items-center gap-3.5 w-full sm:w-auto">
        <div className="relative flex h-3 w-3 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9c2720] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#9c2720]"></span>
        </div>
        <div>
          <div className="text-sm text-zinc-500 uppercase font-bold mt-0.5 flex items-center gap-2">
            <span>CAMPAMENTO</span>
            <div className="w-1 h-1 bg-zinc-500 rounded-full mx-1"></div>
            <span className="text-[#e0d8cc]">{campName ?? "-"}</span>
            <div className="w-1 h-1 bg-zinc-500 rounded-full mx-1"></div>
            <span className="text-[#df8120]">{activeLabel ?? "TABLERO"}</span>
          </div>
        </div>
      </div>

      {/* Center Clock */}
      <div className="hidden lg:flex items-center gap-8 text-center px-6">
        <div className="flex items-center gap-2 text-left text-sm">
          <span className="tracking-widest text-zinc-300 font-bold font-mono">
            {utcTime}
          </span>
        </div>
      </div>

      <div className="flex items-center self-end sm:self-center border-2 border-[#3b4d3e] bg-[#0d0c0b] p-3 rounded-sm">
        <div className="flex items-center gap-5 px-4">
          {/* ID Avatar Block */}
          <div className="relative h-14 w-14 bg-black border-2 border-[#c27c2f] flex items-center justify-center">
            <div className="absolute inset-0 bg-[#c27c2f]/20 animate-pulse" />
            <span className="font-black text-[#c27c2f] text-2xl font-typewriter z-10">
              {user?.username?.[0]?.toUpperCase() || user?.id?.[0]?.toUpperCase() || "W"}
            </span>
            {/* Micro decor */}
            <div
              className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full"
              title="ESTADO: EN LÍNEA"
            />
          </div>

          {/* ID Info Block */}
          <div className="text-left font-mono">
            <div className="text-xs text-[#c27c2f] font-bold tracking-widest uppercase mb-1">
              ID-AUTH: VALIDADO
            </div>
            <div className="font-black text-lg text-[#e0d8cc] uppercase tracking-widest leading-none mb-2">
              {user?.username?.toUpperCase() || user?.id?.toUpperCase() || "WORKER"}
            </div>
            <span className="inline-block bg-[#3b4d3e] text-white text-xs font-bold px-2 py-1 uppercase tracking-widest">
              RANGO: {getRankLabel(badgeCount)}
            </span>
          </div>
        </div>

        {/* Action Divider & Button */}
        <div className="w-px h-14 bg-[#3b4d3e] mx-4" />
        <button
          type="button"
          onClick={onLogout}
          className="h-14 px-6 bg-transparent hover:bg-red-900/50 border border-transparent hover:border-red-500 text-red-500 hover:text-white transition-all uppercase flex items-center justify-center gap-3 cursor-pointer hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] rounded-sm"
          title="CERRAR SESIÓN"
        >
          <LogOut className="h-6 w-6 shrink-0" />
          <span className="text-sm font-bold tracking-widest whitespace-nowrap">
            CERRAR SESIÓN
          </span>
        </button>
      </div>
    </header>
  )
}

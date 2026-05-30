/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Clock, LogOut } from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

import { useAuthStore } from "@/store/useAuthStore"

interface TopbarProps {
  survivalScore: number
}

export default function Topbar({ survivalScore }: TopbarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const formatNow = () => {
    const now = new Date()
    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  }

  const [timeStr, setTimeStr] = useState(formatNow)

  useEffect(() => {
    const interval = setInterval(() => setTimeStr(formatNow()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header
      id="system-topbar"
      className="bg-[#161513]/90 border-b border-[#c27c2f]/30 text-[#e5e5e5] flex px-6 py-4 items-center justify-between sticky top-0 z-10 backdrop-blur-md"
    >
      <div className="flex items-center gap-4">
        {/* Dynamic emergency status dot */}
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
        </div>

        <div>
          <h1 className="font-typewriter text-sm tracking-wider text-[#fca311] font-bold">
            DOOMSDAY CENTRAL CONTROL
          </h1>
          <p className="font-mono text-[10px] text-[#fca311]/50 uppercase tracking-widest">
            Campamento #{user?.campId || 1}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 lg:gap-8">
        {/* Survival Index Metric */}
        <div className="text-right hidden sm:block border-l border-[#c27c2f]/30 pl-4">
          <span className="text-[9px] font-mono tracking-wider text-[#fca311]/50 uppercase block">
            Supervivencia
          </span>
          <span className="font-typewriter text-base text-[#fca311] font-bold glow-text tabular-nums">
            {survivalScore} pts
          </span>
        </div>

        {/* Live Clock HUD */}
        <div className="hidden lg:flex items-center gap-2 border-l border-[#c27c2f]/30 pl-4">
          <Clock className="w-4 h-4 text-[#fca311]" />
          <span className="font-mono text-xs tracking-wider text-[#fca311]/60 font-bold">
            {timeStr} UTC
          </span>
        </div>

        {/* Commander Identity badge */}
        <div className="flex items-center gap-3 border-l border-[#c27c2f]/30 pl-4">
          <div className="text-right">
            <span className="text-xs font-bold text-white block truncate uppercase font-typewriter">
              {user?.username || "DESCONOCIDO"}
            </span>
            <span className="text-[9px] font-mono bg-[#c27c2f] text-black px-1.5 py-0.5 rounded uppercase font-bold">
              LIDER DE CAMPAMENTO
            </span>
          </div>
          <div className="w-9 h-9 border border-[#c27c2f] flex items-center justify-center bg-[#111] rounded">
            <span className="font-typewriter text-[#c27c2f] text-sm font-bold">M</span>
          </div>
        </div>

        {/* LOGOUT BUTTON */}
        <button
          onClick={handleLogout}
          className="ml-1 flex items-center gap-2 bg-red-900/20 hover:bg-red-600 text-[#ef4444] hover:text-white border border-[#ef4444] px-3 py-1.5 rounded font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-200 hover:shadow-[0_0_10px_rgba(239,68,68,0.4)]"
        >
          <LogOut className="w-3 h-3" />
          <span className="hidden sm:inline">SALIR</span>
        </button>
      </div>
    </header>
  )
}

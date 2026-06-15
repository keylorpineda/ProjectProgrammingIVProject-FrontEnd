/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogOut } from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

import Open3DButton from "@/features/camp-3d/components/Open3DButton"
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
      {/* Left Portal Badges */}
      <div className="flex items-center gap-3.5 w-full sm:w-auto">
        <div className="relative flex h-3 w-3 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
        </div>
        <div>
          <h2 className="text-xs md:text-sm font-black text-[#e0d8cc] hover:text-[#df8120] transition uppercase tracking-widest">
            DOOMSDAY CENTRAL CONTROL
          </h2>
          <div className="text-sm text-zinc-500 uppercase font-bold mt-0.5 flex items-center gap-2">
            <span>CAMPAMENTO #{user?.camp_id || 1}</span>
            <div className="w-1 h-1 bg-zinc-500 rounded-full mx-1"></div>
            <span className="text-[#fca311]">SUPERVIVENCIA: {survivalScore} PTS</span>
          </div>
        </div>
      </div>

      {/* Center Clock + acceso 3D */}
      <div className="flex items-center gap-6 px-6">
        <span className="hidden lg:inline tracking-widest text-zinc-300 font-bold font-mono text-sm">
          {utcTime}
        </span>
        <Open3DButton />
      </div>

      <div className="flex items-center self-end sm:self-center border-2 border-[#3b4d3e] bg-[#0d0c0b] p-3 rounded-sm">
        <div className="flex items-center gap-5 px-4">
          {/* ID Avatar Block */}
          <div className="relative h-14 w-14 bg-black border-2 border-[#c27c2f] flex items-center justify-center">
            <div className="absolute inset-0 bg-[#c27c2f]/20 animate-pulse" />
            <span className="font-black text-[#c27c2f] text-2xl font-typewriter z-10">
              {user?.username?.[0]?.toUpperCase() || "L"}
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
              {user?.username?.toUpperCase() || "LEADER"}
            </div>
            <span className="inline-block bg-[#3b4d3e] text-white text-xs font-bold px-2 py-1 uppercase tracking-widest">
              LÍDER DE CAMPAMENTO
            </span>
          </div>
        </div>

        {/* Action Divider & Button */}
        <div className="w-px h-14 bg-[#3b4d3e] mx-4" />
        <button
          type="button"
          onClick={handleLogout}
          className="h-14 px-6 bg-transparent hover:bg-red-900/50 border border-transparent hover:border-red-500 text-red-500 hover:text-white transition-all uppercase flex items-center justify-center gap-3 cursor-pointer hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] rounded-sm"
          title="SALIR"
        >
          <LogOut className="h-6 w-6 shrink-0" />
          <span className="text-sm font-bold tracking-widest whitespace-nowrap">SALIR</span>
        </button>
      </div>
    </header>
  )
}

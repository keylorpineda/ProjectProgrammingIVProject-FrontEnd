/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LayoutDashboard, Compass, Truck, Boxes, User as UserIcon, Shield } from "lucide-react"

import { useAuthStore } from "@/store/useAuthStore"

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { user } = useAuthStore()
  const tabs = [
    { id: "dashboard", label: "TABLERO", icon: LayoutDashboard },
    { id: "explorations", label: "EXPLORACIONES", icon: Compass },
    { id: "transfers", label: "TRASLADOS", icon: Truck },
    { id: "inventory", label: "INVENTARIO", icon: Boxes },
    { id: "profile", label: "PERFIL", icon: UserIcon },
  ]

  return (
    <aside
      id="system-sidebar"
      className="w-20 md:w-[260px] md:min-w-[260px] flex flex-col items-center pt-5 pb-4 h-screen sticky top-0 z-40 shrink-0 border-r select-none"
      style={{
        backgroundColor: "#111111",
        borderColor: "#3b4d3e",
      }}
    >
      {/* Cabecera / Brand Header */}
      <div className="mb-8 px-4 text-center hidden md:block shrink-0">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Shield className="w-5 h-5" style={{ color: "#c27c2f" }} />
          <h2
            className="font-typewriter text-xl tracking-wider font-bold"
            style={{ color: "#fca311" }}
          >
            DOOMSDAY
          </h2>
        </div>
        <span
          className="text-[10px] font-mono opacity-80 block tracking-widest uppercase"
          style={{ color: "#fca311" }}
        >
          REGISTRO DE REFUGIO
        </span>
        <div className="mt-2 h-px w-3/4 mx-auto" style={{ backgroundColor: "#c27c2f40" }} />
      </div>

      {/* Cabecera para Móviles */}
      <div className="md:hidden mb-4 flex justify-center shrink-0">
        <Shield className="w-8 h-8" style={{ color: "#fca311" }} />
      </div>

      {/* Menú de Opciones en formato Carpetas Verticales */}
      <nav className="flex-1 w-full px-4 overflow-y-auto flex flex-col gap-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
              aria-pressed={isActive}
              className="w-full text-left relative flex items-center gap-3 rounded transition-all duration-150 group border cursor-pointer shrink-0 hover:translate-x-0.5 active:translate-y-px"
              style={{
                backgroundColor: isActive
                  ? "rgba(194, 124, 47, 0.15)"
                  : "rgba(154, 144, 128, 0.08)",
                borderColor: isActive ? "rgba(194, 124, 47, 0.5)" : "rgba(0, 0, 0, 0.6)",
                borderWidth: "2px",
                color: isActive ? "#fca311" : "rgba(154, 144, 128, 0.7)",
                boxShadow: isActive ? "2px 2px 0px rgba(0,0,0,0.8)" : "2px 2px 0px rgba(0,0,0,0.6)",
                padding: "12px 16px",
                minHeight: "52px",
              }}
            >
              <Icon
                className="w-5 h-5 shrink-0"
                style={{ color: isActive ? "#fca311" : "rgba(154,144,128,0.6)" }}
              />

              <span className="hidden md:inline font-typewriter text-sm tracking-wider uppercase font-bold select-none">
                {tab.label}
              </span>

              {/* Active pulse indicator */}
              {isActive && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#fca311] animate-pulse shadow-[0_0_6px_rgba(252,163,17,0.6)]" />
              )}

              {/* Distintivo de Alerta de Suministro */}
              {tab.id === "explorations" && !isActive && (
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono px-1.5 py-0.5 rounded hidden md:inline uppercase font-bold"
                  style={{
                    backgroundColor: "#9c2720",
                    color: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.4)",
                  }}
                >
                  ALT
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Placa de Identificación Militar (Dashed Stamp) */}
      <div className="mt-auto px-4 w-full hidden md:block shrink-0">
        <div
          className="border border-dashed p-3 rounded text-left"
          style={{
            borderColor: "rgba(194, 124, 47, 0.4)",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        >
          <p className="text-[10px] font-mono leading-4" style={{ color: "#fca311" }}>
            COMANDANTE:{" "}
            <span className="text-white font-bold uppercase">{user?.username ?? "—"}</span>
          </p>
          <p className="text-[10px] font-mono leading-4 mt-1" style={{ color: "#fca311" }}>
            CAMPAMENTO: <span className="text-white font-bold">#{user?.camp_id ?? "?"}</span>
          </p>
          <p
            className="text-[10px] font-mono leading-5 mt-1 font-extrabold animate-pulse"
            style={{ color: "#ef4444" }}
          >
            SITUACIÓN: OPERATIVO
          </p>
        </div>
      </div>
    </aside>
  )
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */


import { LayoutDashboard, Compass, Truck, Boxes, User as UserIcon, Skull } from "lucide-react"

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
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
      <div className="mb-6 px-4 text-center hidden md:block shrink-0">
        <h2
          className="font-typewriter text-xl tracking-wider font-bold flex items-center justify-center gap-2"
          style={{ color: "#fca311" }}
        >
          <Skull className="w-5 h-5 text-red-500 animate-pulse" />
          DOOMSDAY
        </h2>
        <span
          className="text-[10px] font-mono opacity-80 block tracking-widest uppercase mt-1"
          style={{ color: "#fca311" }}
        >
          REGISTRO DE REFUGIO
        </span>
      </div>

      {/* Cabecera para Móviles */}
      <div className="md:hidden mb-4 flex justify-center shrink-0">
        <Skull className="w-8 h-8 animate-pulse" style={{ color: "#fca311" }} />
      </div>

      {/* Menú de Opciones en formato Carpetas Verticales */}
      <nav className="flex-1 w-full px-4 overflow-y-auto flex flex-col gap-5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="w-full text-left relative flex items-center gap-4 py-4 px-5 rounded-xl transition-all duration-150 group border cursor-pointer shrink-0 hover:translate-x-1 active:translate-y-0.5"
              style={{
                backgroundColor: isActive ? "#c27c2f" : "#9a9080",
                borderColor: "#000000",
                borderWidth: "2px",
                color: "#000000",
                boxShadow: "3px 3px 0px #000000",
                height: "52px",
                minHeight: "52px",
                marginBottom: "16px", // Espacio garantizado por si Tailwind falla
              }}
            >
              <Icon className="w-5 h-5 shrink-0 text-black font-extrabold" />

              <span className="hidden md:inline font-typewriter text-xs md:text-xs lg:text-sm tracking-wider uppercase text-black font-extrabold select-none">
                {tab.label}
              </span>

              {/* Distintivo de Alerta de Suministro */}
              {tab.id === "explorations" && (
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono px-2 py-0.5 rounded hidden md:inline animate-pulse uppercase font-extrabold"
                  style={{
                    backgroundColor: "#9c2720",
                    color: "#ffffff",
                    border: "1px solid #000000",
                  }}
                >
                  ALERTA
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
            SECTOR: <span className="text-white font-bold">COSTA GRIS</span>
          </p>
          <p className="text-[10px] font-mono leading-4 mt-1" style={{ color: "#fca311" }}>
            ESTACIÓN: <span className="text-white font-bold">ALFA-01</span>
          </p>
          <p
            className="text-[10px] font-mono leading-5 mt-1 font-extrabold animate-pulse"
            style={{ color: "#ef4444" }}
          >
            SITUACIÓN: COMBATE
          </p>
        </div>
      </div>
    </aside>
  )
}

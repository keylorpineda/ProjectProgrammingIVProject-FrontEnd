import { Boxes, Compass, LayoutDashboard, Truck, User as UserIcon } from "lucide-react"

import type { ComponentType } from "react"

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  survivalScore?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TabDef = { id: string; label: string; icon: ComponentType<any> }

function getRankLabel(score: number) {
  if (score >= 900) return { label: "LEYENDA DEL PARAMO", color: "#fca311" }
  if (score >= 600) return { label: "COMANDANTE", color: "#c27c2f" }
  if (score >= 300) return { label: "VETERANO", color: "#ab9e8b" }
  if (score >= 100) return { label: "EXPLORADOR", color: "#3b7a5a" }
  return { label: "RECLUTA", color: "#71717a" }
}

export default function Sidebar({ activeTab, setActiveTab, survivalScore = 0 }: SidebarProps) {
  const tabs: TabDef[] = [
    { id: "dashboard", label: "TABLERO", icon: LayoutDashboard },
    { id: "explorations", label: "EXPLORACIONES", icon: Compass },
    { id: "transfers", label: "TRASLADOS", icon: Truck },
    { id: "inventory", label: "INVENTARIO", icon: Boxes },
    { id: "profile", label: "PERFIL", icon: UserIcon },
  ]

  const rank = getRankLabel(survivalScore)

  return (
    <aside className="w-full md:w-72 bg-[#121110] border-b-2 md:border-b-0 md:border-r-2 border-black px-5 py-4 flex flex-col justify-between shrink-0 z-30 select-none font-mono">
      <div>
        {/* BRAND HEADER */}
        <div className="mb-6 pb-4 border-b-2 border-black">
          <div className="flex items-center gap-4">
            <span className="text-[#9c2720] text-xl animate-pulse font-bold">&#9733;</span>
            <span className="text-lg font-black text-[#df8120] tracking-widest uppercase">
              LIDER CENTRAL
            </span>
          </div>
          <p className="text-sm text-zinc-500 tracking-wider font-extrabold uppercase mt-0.5 pl-0.5">
            SISTEMA DEL CAMPAMENTO
          </p>
        </div>

        {/* NAVIGATION */}
        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none shrink-0 font-mono">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-label={tab.label}
                aria-pressed={isActive}
                className="w-full text-left text-black relative flex items-center justify-center md:justify-start gap-3 md:gap-4 py-4 px-4 md:px-5 rounded-xl transition-all duration-150 border cursor-pointer shrink-0 hover:translate-x-1 active:translate-y-0.5 min-w-[140px] md:min-w-0 mx-1 md:mx-0"
                style={{
                  backgroundColor: isActive ? "#c27c2f" : "#9a9080",
                  borderColor: "#000000",
                  borderWidth: "2px",
                  color: "#000000",
                  boxShadow: "3px 3px 0px #000000",
                  padding: "20px 20px",
                  marginBottom: "16px",
                }}
              >
                <Icon className="w-6 h-6 shrink-0 text-black font-extrabold" />
                <span className="font-mono text-sm md:text-xs lg:text-sm tracking-wider uppercase text-black font-extrabold select-none truncate">
                  {tab.label}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* RANK PANEL (hidden on mobile) */}
      <div className="mt-6 border border-dashed border-[#df8120]/40 p-3.5 bg-black/40 text-left rounded-lg hidden md:block">
        <div className="text-xs text-[#df8120] font-extrabold uppercase tracking-wider mb-2">
          RANGO DE SUPERVIVENCIA:
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-bold">
            <span className="text-zinc-500 uppercase">NIVEL:</span>
            <span className="uppercase font-black" style={{ color: rank.color }}>
              {rank.label}
            </span>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span className="text-zinc-500 uppercase">PUNTOS:</span>
            <span className="text-[#e0d8cc] uppercase">{survivalScore} PTS</span>
          </div>
          <div className="w-full h-1.5 bg-black/50 rounded-sm overflow-hidden mt-1">
            <div
              className="h-full rounded-sm transition-all duration-700"
              style={{
                width: `${Math.min(100, (survivalScore / 900) * 100)}%`,
                backgroundColor: rank.color,
              }}
            />
          </div>
        </div>
      </div>
    </aside>
  )
}

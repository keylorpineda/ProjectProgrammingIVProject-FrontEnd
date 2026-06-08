import {
  Boxes,
  Briefcase,
  Compass,
  LayoutDashboard,
  Trophy,
  Truck,
  User as UserIcon,
  Users,
} from "lucide-react"

import type { ComponentType } from "react"

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  survivalScore?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TabDef = { id: string; label: string; icon: ComponentType<any> }

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const tabs: TabDef[] = [
    { id: "dashboard", label: "TABLERO", icon: LayoutDashboard },
    { id: "explorations", label: "EXPLORACIONES", icon: Compass },
    { id: "transfers", label: "TRASLADOS", icon: Truck },
    { id: "inventory", label: "INVENTARIO", icon: Boxes },
    { id: "ranking", label: "RANKING", icon: Trophy },
    { id: "members", label: "MIEMBROS", icon: Users },
    { id: "occupations", label: "OCUPACIONES", icon: Briefcase },
    { id: "profile", label: "PERFIL", icon: UserIcon },
  ]

  return (
    <aside className="w-full md:w-72 bg-[#121110] border-b-2 md:border-b-0 md:border-r-2 border-black p-4 flex flex-col shrink-0 z-20 select-none font-mono overflow-y-auto">
      <div>
        {/* BRAND HEADER */}
        <div className="mb-6 pb-4 border-b-2 border-black">
          <div className="flex items-center gap-4">
            <span className="text-[#9c2720] text-xl animate-pulse font-bold">★</span>
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
                className="w-full text-left relative flex items-center justify-center md:justify-start gap-3 md:gap-4 rounded-xl transition-all duration-150 group border cursor-pointer shrink-0 hover:translate-x-1 active:translate-y-0.5 min-w-[140px] md:min-w-0 mx-1 md:mx-0"
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
    </aside>
  )
}

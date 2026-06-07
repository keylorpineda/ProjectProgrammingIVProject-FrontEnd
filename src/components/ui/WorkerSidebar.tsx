import { motion } from "framer-motion"
import { LayoutDashboard, FileText, Users, Package, Compass } from "lucide-react"

interface WorkerSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  userName?: string | number
  campName?: string
}

const NAV_ITEMS = [
  { id: "dashboard", label: "TABLERO", icon: LayoutDashboard },
  { id: "profile", label: "MI EXPEDIENTE", icon: FileText },
  { id: "professions", label: "OCUPACIONES", icon: Users },
  { id: "resources", label: "ALMACEN", icon: Package },
  { id: "expeditions", label: "EXPEDICIONES", icon: Compass },
]

export default function WorkerSidebar({
  activeTab,
  setActiveTab,
  userName = "WORKER",
  campName,
}: WorkerSidebarProps) {
  return (
    <aside className="w-full md:w-72 bg-[#121110] border-b-2 md:border-b-0 md:border-r-2 border-black p-4 flex flex-col justify-between shrink-0 z-20 select-none font-mono h-full overflow-y-auto">
      <div>
        {/* BRAND HEADER */}
        <div className="mb-6 pb-4 border-b-2 border-black">
          <div className="flex items-center gap-4">
            <span className="text-[#9c2720] text-xl animate-pulse font-bold">★</span>
            <span className="text-lg font-black text-[#df8120] tracking-widest uppercase">
              GESTIÓN DEL FIN
            </span>
          </div>
          <p className="text-sm text-zinc-500 tracking-wider font-extrabold uppercase mt-0.5 pl-0.5">
            TERMINAL PERSONAL
          </p>
        </div>

        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none shrink-0 font-mono">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id
            const Icon = item.icon

            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left relative flex items-center justify-center md:justify-start gap-3 md:gap-4 rounded-xl transition-all duration-150 group cursor-pointer shrink-0 hover:translate-x-1 active:translate-y-0.5 min-w-[140px] md:min-w-0 mx-1 md:mx-0`}
                style={{
                  backgroundColor: active ? "#c27c2f" : "#9a9080",
                  borderColor: "#000000",
                  borderWidth: "2px",
                  borderStyle: "solid",
                  color: "#000000",
                  boxShadow: "3px 3px 0px #000000",
                  padding: "20px 20px",
                  marginBottom: "16px",
                }}
              >
                <Icon className="w-6 h-6 shrink-0 text-black font-extrabold" />
                <span className="font-mono text-sm md:text-xs lg:text-sm tracking-wider uppercase text-black font-extrabold select-none truncate">
                  {item.label}
                </span>
              </motion.button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

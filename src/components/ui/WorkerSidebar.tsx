import { motion } from "framer-motion"
import { LayoutDashboard, FileText, Users, Package, Compass } from "lucide-react"

import { useMyBadges } from "@/features/worker/hooks/useWorkerAPI"

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

function getRankLabel(n: number) {
  if (n >= 10) return "LEYENDA"
  if (n >= 7) return "ELITE"
  if (n >= 4) return "VETERANO"
  if (n >= 2) return "SOLDADO"
  return "RECLUTA"
}

export default function WorkerSidebar({
  activeTab,
  setActiveTab,
  userName = "WORKER",
  campName,
}: WorkerSidebarProps) {
  const { data: badges } = useMyBadges()
  const badgeCount = badges?.length ?? 0

  return (
    <aside className="worker-sidebar">
      <div className="worker-sidebar-header">
        <div className="worker-sidebar-title">GESTIÓN DEL FIN</div>
        <div className="worker-sidebar-subtitle">TERMINAL PERSONAL</div>
        {campName ? <div className="worker-sidebar-camp">{campName}</div> : null}
      </div>

      <nav className="worker-sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const active = activeTab === item.id
          const Icon = item.icon

          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              whileTap={{ scale: 0.98 }}
              className={`worker-sidebar-tab ${active ? "active" : ""}`}
            >
              <Icon className="worker-sidebar-icon" aria-hidden="true" />
              <span>{item.label}</span>
            </motion.button>
          )
        })}
      </nav>

      <div className="worker-sidebar-footer">
        <div className="worker-sidebar-id">
          <div className="worker-sidebar-status">ACTIVO EN SECTOR</div>
          <div className="worker-sidebar-user">{String(userName).toUpperCase()}</div>
          <div className="worker-sidebar-rank">
            {getRankLabel(badgeCount)} / {badgeCount} INSIGNIAS
          </div>
        </div>
      </div>
    </aside>
  )
}

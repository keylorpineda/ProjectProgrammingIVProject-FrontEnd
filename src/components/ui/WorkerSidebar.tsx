import { User, Hammer, Package, Truck, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'

interface WorkerSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  userName?: string
  onLogout?: () => void
}

const navItems = [
  { id: 'profile', label: 'MI PERFIL', icon: User },
  { id: 'professions', label: 'OCUPACIONES', icon: Hammer },
  { id: 'resources', label: 'RECURSOS', icon: Package },
  { id: 'transfers', label: 'TRASLADOS', icon: Truck },
]

export default function WorkerSidebar({ activeTab, setActiveTab, userName = 'WORKER', onLogout }: WorkerSidebarProps) {
  return (
    <aside className="w-56 bg-bunker-bg border-r border-paper-dark/10 h-screen flex flex-col z-50 p-4">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-paper-dark/20">
        <p className="text-xs font-mono text-paper-base/70 uppercase tracking-widest mb-2">Worker Assignment</p>
        <p className="text-lg font-display text-paper-base truncate">{userName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-3 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          
          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(item.id)}
              className={`w-full px-4 py-3 text-xs font-display tracking-widest text-left transition-all duration-300 rounded-lg border flex items-center gap-3 ${
                isActive
                  ? 'bg-paper-base text-ink-black shadow-[4px_4px_0px_rgba(0,0,0,1)] translate-x-1 border-ink-black'
                  : 'text-paper-base/70 hover:text-paper-base border-transparent hover:bg-paper-dark/5'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </motion.button>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="pt-4 border-t border-paper-dark/10">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          className="w-full px-4 py-3 text-[10px] font-mono text-accent-orange hover:text-ink-black hover:bg-accent-orange transition-all duration-300 rounded-lg border border-transparent hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-1 uppercase tracking-tighter flex items-center gap-2 justify-center"
        >
          <LogOut className="w-4 h-4" />
          LOGOUT
        </motion.button>
      </div>
    </aside>
  )
}

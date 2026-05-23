import { LogOut } from 'lucide-react'
import { motion } from 'framer-motion'

interface WorkerSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  userName?: string
  onLogout?: () => void
}

const navItems = [
  { id: 'profile', label: 'MI PERFIL' },
  { id: 'professions', label: 'OCUPACIONES' },
  { id: 'resources', label: 'RECURSOS' },
  { id: 'transfers', label: 'TRASLADOS' },
]

export default function WorkerSidebar({ activeTab, setActiveTab, userName = 'WORKER', onLogout }: WorkerSidebarProps) {
  return (
    <aside className="w-56 h-screen sticky left-0 top-0 shrink-0 bg-bunker-bg border-r border-paper-dark/10 flex flex-col z-50 p-4">
      <div className="sr-only">
        Worker Assignment {userName}
      </div>

      <nav className="flex flex-col gap-3 mt-4 flex-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id
          
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(item.id)}
              className={`w-full px-6 py-4 text-xs font-display tracking-widest text-left transition-all duration-300 rounded-lg border border-transparent shadow-md ${
                isActive
                  ? 'bg-paper-base text-ink-black shadow-[4px_4px_0px_rgba(0,0,0,1)] translate-x-1'
                  : 'text-paper-base/70 hover:text-paper-base hover:bg-paper-dark/5'
              }`}
            >
              {item.label}
            </motion.button>
          )
        })}
      </nav>

      <div className="mt-auto pt-4">
        <div className="w-full h-px bg-paper-dark/10 mb-4" />
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          className="w-full px-6 py-4 text-[10px] font-mono text-accent-orange/80 hover:text-ink-black hover:bg-accent-orange transition-all duration-300 rounded-lg border border-transparent hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-1 uppercase tracking-tighter flex items-center gap-2 justify-center"
        >
          <LogOut className="w-4 h-4" />
          TERMINATE ACCESS
        </motion.button>
      </div>
    </aside>
  )
}

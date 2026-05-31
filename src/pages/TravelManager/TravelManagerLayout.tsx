import { motion, AnimatePresence } from "framer-motion"
import {
  Compass,
  Users,
  Package,
  ArrowLeftRight,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"
import { Outlet, useNavigate, NavLink, useLocation } from "react-router-dom"

import InactivityGuard from "@/components/ui/InactivityGuard"
import { useAuthStore } from "@/store/useAuthStore"

export default function TravelManagerLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const menuItems = [
    { id: "dashboard", label: "Tablero", icon: LayoutDashboard, path: "/travel-manager/dashboard" },
    {
      id: "expeditions",
      label: "Expediciones",
      icon: Compass,
      path: "/travel-manager/expeditions",
    },
    { id: "personnel", label: "Equipo", icon: Users, path: "/travel-manager/personnel" },
    {
      id: "transfers",
      label: "Traslados",
      icon: ArrowLeftRight,
      path: "/travel-manager/transfers",
    },
    { id: "inventory", label: "Recursos", icon: Package, path: "/travel-manager/inventory" },
  ]

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const closeSidebar = () => setSidebarOpen(false)

  const SidebarContent = () => (
    <>
      <div className="absolute inset-0 bg-paper-texture opacity-30 mix-blend-overlay pointer-events-none" />

      {/* Header */}
      <div className="p-4 border-b border-accent-orange/20 bg-ink-black/80 relative">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 border border-accent-orange bg-dark-brown/50 flex items-center justify-center rounded-sm relative overflow-hidden group cursor-pointer shadow-[0_0_10px_rgba(212,163,115,0.2)]">
              <div className="absolute inset-0 bg-accent-orange/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
              <span className="font-mono font-bold text-accent-orange text-sm relative z-10">
                T
              </span>
            </div>
            <div>
              <h1 className="font-typewriter text-base font-bold text-parchment/90 tracking-wider">
                GESTIÓN VIAJES
              </h1>
              <p className="font-mono text-[10px] text-accent-orange/60 uppercase tracking-wider">
                Base::{user?.camp_id || "N/A"}
              </p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={closeSidebar}
            aria-label="Cerrar menú"
            className="md:hidden text-parchment/40 hover:text-parchment transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto custom-scrollbar relative z-10">
        <div className="px-2 mb-2">
          <h2 className="font-mono text-[10px] text-accent-orange/40 uppercase tracking-widest font-semibold">
            Operaciones
          </h2>
        </div>

        {menuItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            aria-label={item.label}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-sm border transition-all duration-200 group relative overflow-hidden ${
                isActive
                  ? "border-accent-orange/40 bg-accent-orange/12 text-accent-orange"
                  : "border-transparent text-parchment/60 hover:text-parchment hover:bg-dark-brown/30 hover:border-accent-orange/20"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-5 h-5 shrink-0 relative z-10 transition-colors ${
                    isActive
                      ? "text-accent-orange"
                      : "text-parchment/40 group-hover:text-parchment/70"
                  }`}
                />
                <span className="font-mono text-sm font-semibold uppercase tracking-wide relative z-10">
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute right-3 w-1.5 h-1.5 bg-accent-orange rounded-full animate-pulse shadow-[0_0_6px_#d4a373]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-accent-orange/20 relative z-10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-sm text-accent-critical/70 hover:text-white hover:bg-accent-critical/80 transition-all duration-200 border border-transparent hover:border-accent-critical/60"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="font-mono text-sm font-semibold uppercase tracking-wide">
            Cerrar Sesión
          </span>
        </button>
      </div>
    </>
  )

  return (
    <InactivityGuard isAuthenticated={!!user} onLogout={handleLogout}>
      {/* ── DESKTOP LAYOUT ── */}
      <div
        className="w-full h-screen bg-[#0a0a0a] text-white overflow-hidden hidden md:grid"
        style={{ gridTemplateColumns: "260px 1fr" }}
      >
        <aside className="w-full bg-ink-black border-r border-accent-orange/20 flex flex-col h-full z-20 relative overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.6)]">
          <SidebarContent />
        </aside>
        <main className="w-full h-full flex flex-col overflow-hidden relative z-10 bg-bunker-bg">
          <Outlet />
        </main>
      </div>

      {/* ── MOBILE LAYOUT ── */}
      <div className="md:hidden w-full h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-accent-orange/20 bg-[#0a0a0a] shrink-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú de navegación"
            className="p-2 text-accent-orange/70 hover:text-accent-orange transition-colors rounded-sm border border-transparent hover:border-accent-orange/20"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-typewriter text-sm font-bold text-parchment/80 tracking-wider uppercase">
            Gestión Viajes
          </span>
          <div className="w-9" /> {/* spacer */}
        </header>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/70 z-40"
                onClick={closeSidebar}
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring" as const, stiffness: 300, damping: 30 }}
                className="fixed top-0 left-0 h-full w-72 bg-[#0a0a0a] border-r border-accent-orange/20 flex flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.8)]"
              >
                <SidebarContent />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Mobile bottom nav — quick access */}
        <main className="flex-1 overflow-hidden relative z-10 bg-bunker-bg">
          <Outlet />
        </main>
        <nav className="shrink-0 border-t border-accent-orange/20 bg-[#0a0a0a] flex items-center justify-around px-2 py-1 z-20">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path)
            return (
              <NavLink
                key={item.id}
                to={item.path}
                aria-label={item.label}
                className={`flex flex-col items-center gap-0.5 p-2 rounded transition-colors min-w-[44px] min-h-[44px] justify-center ${
                  isActive ? "text-accent-orange" : "text-parchment/30 hover:text-parchment/70"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] font-mono uppercase tracking-wide">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>
    </InactivityGuard>
  )
}

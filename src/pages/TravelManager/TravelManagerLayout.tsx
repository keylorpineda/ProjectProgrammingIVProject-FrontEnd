import { Compass, Users, Package, ArrowLeftRight, LayoutDashboard, LogOut } from "lucide-react"
import { Outlet, useNavigate, NavLink } from "react-router-dom"

import InactivityGuard from "@/components/ui/InactivityGuard"
import { useAuthStore } from "@/store/useAuthStore"

export default function TravelManagerLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const menuItems = [
    {
      id: "dashboard",
      label: "Tablero",
      icon: LayoutDashboard,
      path: "/travel-manager/dashboard",
    },
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

  return (
    <InactivityGuard isAuthenticated={!!user} onLogout={handleLogout}>
      <div
        className="w-full h-screen bg-[#0a0a0a] text-white overflow-hidden grid"
        style={{ gridTemplateColumns: "260px 1fr" }}
      >
        {/* SIDEBAR */}
        <aside className="w-full bg-ink-black border-r border-accent-orange/20 flex flex-col h-full z-20 relative overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.6)]">
          <div className="absolute inset-0 bg-paper-texture opacity-30 mix-blend-overlay pointer-events-none" />

          {/* Header */}
          <div className="p-4 border-b border-accent-orange/20 bg-ink-black/80 relative">
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
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="w-full h-full flex flex-col overflow-hidden relative z-10 bg-bunker-bg">
          <Outlet />
        </main>
      </div>
    </InactivityGuard>
  )
}

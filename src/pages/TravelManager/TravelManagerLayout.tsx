import { Outlet, useNavigate, NavLink } from "react-router-dom"
import { useAuthStore } from "@/store/useAuthStore"
import { Compass, Users, Package, ArrowLeftRight, LayoutDashboard, LogOut } from "lucide-react"
import InactivityGuard from "@/components/ui/InactivityGuard"

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
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-[340px] md:w-96 bg-ink-black border-r border-accent-orange/20 flex flex-col h-full z-20 shrink-0 relative overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-0 bg-paper-texture opacity-30 mix-blend-overlay pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-orange/5 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="p-6 border-b border-accent-orange/20 bg-ink-black/80 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-accent-orange bg-dark-brown/50 flex items-center justify-center rounded-sm relative overflow-hidden group cursor-pointer shadow-[0_0_10px_rgba(212,163,115,0.2)]">
              <div className="absolute inset-0 bg-accent-orange/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
              <span className="font-mono font-bold text-accent-orange text-xl relative z-10">
                T
              </span>
            </div>
            <div>
              <h1 className="font-typewriter text-xl font-bold text-parchment/90 tracking-wider">
                GESTIÓN VIAJES
              </h1>
              <p className="font-mono text-sm text-accent-orange/60 uppercase tracking-widest">
                Base_Op::{user?.camp_id || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-6 px-3 flex flex-col gap-2 overflow-y-auto custom-scrollbar relative z-10">
          <div className="px-3 mb-2">
            <h2 className="font-mono text-sm text-accent-orange/40 uppercase tracking-widest font-semibold">
              Operaciones
            </h2>
          </div>

          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-6 px-10 py-6 rounded-sm border transition-all duration-200 group relative overflow-hidden ${
                  isActive
                    ? "border-accent-orange bg-accent-orange/10 text-accent-orange shadow-[inset_6px_0_0_#d4a373]"
                    : "border-transparent text-parchment/60 hover:text-parchment hover:bg-dark-brown/30 hover:border-accent-orange/30"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`absolute inset-0 bg-gradient-to-r from-accent-orange/10 to-transparent translate-x-[-100%] transition-transform duration-300 ${
                      isActive ? "translate-x-0" : "group-hover:translate-x-[-50%]"
                    }`}
                  />
                  <item.icon
                    className={`w-9 h-9 relative z-10 transition-colors ${
                      isActive
                        ? "text-accent-orange"
                        : "text-parchment/40 group-hover:text-parchment/80"
                    }`}
                  />
                  <span className="font-mono text-xl font-black uppercase tracking-wide relative z-10">
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute right-4 w-1.5 h-1.5 bg-accent-orange rounded-full animate-pulse shadow-[0_0_8px_#d4a373]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-accent-orange/20 relative z-10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-6 px-10 py-6 rounded-sm text-accent-critical/80 hover:text-white hover:bg-accent-critical transition-all border border-transparent hover:border-accent-critical hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
          >
            <LogOut className="h-9 w-9 shrink-0" />
            <span className="font-mono text-xl font-black uppercase tracking-widest">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <Outlet />
      </main>
    </div>
    </InactivityGuard>
  )
}

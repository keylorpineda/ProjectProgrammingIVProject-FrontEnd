import {
  LogOut,
  LayoutDashboard,
  Compass,
  Users,
  ArrowLeftRight,
  Package,
  Menu,
  X,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Outlet, useNavigate, NavLink } from "react-router-dom"

import InactivityGuard from "@/components/ui/InactivityGuard"
import { useAuthStore } from "@/store/useAuthStore"

export default function TravelManagerLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [utcTime, setUtcTime] = useState("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const formatted = now.toISOString().replace("T", " ").slice(0, 19) + " UTC"
      setUtcTime(formatted)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const menuItems = [
    { id: "dashboard", label: "TABLERO", icon: LayoutDashboard, path: "/travel-manager/dashboard" },
    {
      id: "expeditions",
      label: "EXPEDICIONES",
      icon: Compass,
      path: "/travel-manager/expeditions",
    },
    { id: "personnel", label: "EQUIPO", icon: Users, path: "/travel-manager/personnel" },
    {
      id: "transfers",
      label: "TRASLADOS",
      icon: ArrowLeftRight,
      path: "/travel-manager/transfers",
    },
    { id: "inventory", label: "RECURSOS", icon: Package, path: "/travel-manager/inventory" },
  ]

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const closeSidebar = () => setSidebarOpen(false)

  const SidebarContent = () => (
    <aside className="w-full h-full bg-[#121110] border-b-2 md:border-b-0 md:border-r-2 border-black p-4 flex flex-col justify-between shrink-0 z-20 select-none font-mono overflow-y-auto custom-scrollbar relative">
      <div className="absolute inset-0 bg-paper-texture opacity-30 mix-blend-overlay pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b-2 border-black">
          <div className="flex flex-col">
            <div className="flex items-center gap-4">
              <span className="text-[#9c2720] text-xl animate-pulse font-bold">★</span>
              <span className="text-lg font-black text-[#df8120] tracking-widest uppercase">
                GESTIÓN VIAJES
              </span>
            </div>
            <p className="text-sm text-zinc-500 tracking-wider font-extrabold uppercase mt-0.5 pl-0.5">
              BASE::{user?.camp_id || "N/A"}
            </p>
          </div>
          <button
            onClick={closeSidebar}
            aria-label="Cerrar menú"
            className="md:hidden text-zinc-500 hover:text-white transition-colors p-1"
          >
            <X className="w-6 h-6 font-bold" />
          </button>
        </div>

        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none shrink-0 font-mono">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `w-full text-left relative flex items-center justify-center md:justify-start gap-3 md:gap-4 py-4 px-4 md:px-5 rounded-xl transition-all duration-150 group border cursor-pointer shrink-0 hover:translate-x-1 active:translate-y-0.5 min-w-[140px] md:min-w-0 mx-1 md:mx-0 ${
                    isActive ? "bg-[#c27c2f]" : "bg-[#9a9080]"
                  }`
                }
                style={{
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
                  {item.label}
                </span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Mobile only footer */}
      <div className="md:hidden p-3 border-t-2 border-black relative z-10 mt-auto pt-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-transparent hover:bg-red-900/50 border border-transparent hover:border-red-500 text-red-500 hover:text-white transition-all uppercase rounded-sm shadow-[0_0_10px_rgba(239,68,68,0.2)]"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="font-mono text-sm font-black uppercase tracking-wide">
            CERRAR SESIÓN
          </span>
        </button>
      </div>
    </aside>
  )

  return (
    <InactivityGuard isAuthenticated={!!user} onLogout={handleLogout}>
      <div className="h-screen max-h-screen bg-[#0d0c0b] text-[#e0d8cc] relative overflow-hidden font-mono flex flex-col travel-manager-root">
        {/* SCANLINE OVERLAY */}
        <div
          className="absolute inset-0 pointer-events-none z-50 opacity-[0.035]"
          style={{
            background:
              "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
            backgroundSize: "100% 2px, 3px 100%",
          }}
        ></div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* DESKTOP SIDEBAR */}
          <div className="hidden md:flex w-72 shrink-0 relative z-20">
            <SidebarContent />
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
            {/* MOBILE TOPBAR */}
            <header className="md:hidden bg-[#121110] border-b-2 border-black flex items-center justify-between px-4 py-3 shrink-0 font-mono select-none z-30 shadow-md relative">
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menú"
                className="p-2 text-zinc-500 hover:text-white transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[#9c2720] animate-pulse font-bold">★</span>
                <span className="font-black text-[#df8120] uppercase tracking-widest text-sm">
                  GESTIÓN VIAJES
                </span>
              </div>
              <div className="w-10"></div>
            </header>

            {/* DESKTOP TOPBAR */}
            <header className="hidden md:flex bg-[#121110] border-b-2 border-black flex-col sm:flex-row justify-between items-center px-4 md:px-6 py-3 gap-4 shrink-0 font-mono select-none z-10 shadow-md">
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <div className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#df8120] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#df8120]"></span>
                </div>
                <div>
                  <h2 className="text-xs md:text-sm font-black text-[#e0d8cc] hover:text-[#df8120] transition uppercase tracking-widest">
                    COORDINACIÓN DE MOVILIDAD
                  </h2>
                  <div className="text-sm text-zinc-500 uppercase font-bold mt-0.5 flex items-center gap-2">
                    <span>TRAVEL MANAGER</span>
                  </div>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-8 text-center px-6">
                <div className="flex items-center gap-2 text-left text-sm">
                  <span className="tracking-widest text-zinc-300 font-bold font-mono">
                    {utcTime}
                  </span>
                </div>
              </div>

              <div className="flex items-center self-end sm:self-center border-2 border-[#3b4d3e] bg-[#0d0c0b] p-3 rounded-sm">
                <div className="flex items-center gap-5 px-4">
                  <div className="relative h-14 w-14 bg-black border-2 border-[#c27c2f] flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#c27c2f]/20 animate-pulse" />
                    <span className="font-black text-[#c27c2f] text-2xl font-typewriter z-10">
                      {user?.username?.[0]?.toUpperCase() || user?.id?.[0]?.toUpperCase() || "T"}
                    </span>
                    <div
                      className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full"
                      title="ESTADO: EN LÍNEA"
                    />
                  </div>

                  <div className="text-left font-mono">
                    <div className="text-xs text-[#c27c2f] font-bold tracking-widest uppercase mb-1">
                      ID-AUTH: VALIDADO
                    </div>
                    <div className="font-black text-lg text-[#e0d8cc] uppercase tracking-widest leading-none mb-2">
                      {user?.username?.toUpperCase() || user?.id?.toUpperCase() || "TRAVEL MGR"}
                    </div>
                    <span className="inline-block bg-[#3b4d3e] text-white text-xs font-bold px-2 py-1 uppercase tracking-widest">
                      RANGO: TRAVEL MANAGER
                    </span>
                  </div>
                </div>

                <div className="w-px h-14 bg-[#3b4d3e] mx-4" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="h-14 px-6 bg-transparent hover:bg-red-900/50 border border-transparent hover:border-red-500 text-red-500 hover:text-white transition-all uppercase flex items-center justify-center gap-3 cursor-pointer hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] rounded-sm"
                  title="CERRAR SESIÓN"
                >
                  <LogOut className="h-6 w-6 shrink-0" />
                  <span className="text-sm font-bold tracking-widest whitespace-nowrap">
                    CERRAR SESIÓN
                  </span>
                </button>
              </div>
            </header>

            <main
              className="flex-1 overflow-y-auto bg-[#0d0c0b] relative admin-route-container"
              style={{ padding: "16px" }}
            >
              <Outlet />
            </main>
          </div>
        </div>

        {/* MOBILE SIDEBAR MODAL */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              role="button"
              tabIndex={0}
              aria-label="Cerrar menú"
              className="absolute inset-0 bg-black/80"
              onClick={closeSidebar}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") closeSidebar()
              }}
            />
            <div className="w-4/5 max-w-sm bg-[#121110] relative flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.8)] border-r-2 border-black">
              <SidebarContent />
            </div>
          </div>
        )}
      </div>
    </InactivityGuard>
  )
}

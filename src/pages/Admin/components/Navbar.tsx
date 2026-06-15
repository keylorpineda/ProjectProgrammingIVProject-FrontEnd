import {
  LayoutDashboard,
  UserPlus,
  Users,
  Tent,
  MapPin,
  Database,
  Truck,
  Map as MapIcon,
  UserCircle,
  ChevronDown,
  LogOut,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"

import CampSelector from "./CampSelector"
import { useAuth } from "../context/AuthContext"

const TABS = [
  { name: "TABLERO", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "ADMISIONES", path: "/admin/admissions", icon: UserPlus },
  { name: "PERSONAL", path: "/admin/people", icon: Users },
  { name: "CAMPAMENTOS", path: "/admin/camps", icon: Tent },
  { name: "EXPLORACIONES", path: "/admin/explorations", icon: MapPin },
  { name: "RECURSOS", path: "/admin/resources", icon: Database },
  { name: "TRASLADOS", path: "/admin/transfers", icon: Truck },
  { name: "MAPA", path: "/admin/mapa", icon: MapIcon },
]

interface NavbarProps {
  utcTime: string
  onLogout: () => void
}

export default function Navbar({ utcTime, onLogout }: NavbarProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [menuOpen])

  const initial = user?.username?.[0]?.toUpperCase() || user?.id?.[0]?.toUpperCase() || "A"
  const name = user?.username?.toUpperCase() || user?.id?.toUpperCase() || "ADMIN"

  return (
    <header className="relative z-40 shrink-0 bg-[#121110] border-b-2 border-black font-mono select-none shadow-md">
      {/* ── TOP STRIP: marca · ubicación · reloj · avatar ── */}
      <div className="flex items-center gap-3 md:gap-5 px-3 md:px-6 py-2.5 border-b border-black/60">
        {/* BRAND */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[#9c2720] text-2xl animate-pulse font-bold leading-none">★</span>
          <div className="leading-none">
            <div className="text-base md:text-lg font-black text-[#df8120] tracking-widest uppercase">
              ADMINISTRACIÓN
            </div>
            <div className="text-[11px] text-zinc-500 tracking-[0.2em] font-extrabold uppercase mt-1">
              SISTEMA CENTRAL
            </div>
          </div>
        </div>

        <div className="flex-1" />

        <div className="hidden lg:flex items-center">
          <CampSelector />
        </div>
        <span className="hidden xl:inline text-sm tracking-widest text-zinc-300 font-bold whitespace-nowrap">
          {utcTime}
        </span>

        {/* PROFILE / AVATAR MENU */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="OPCIONES DE PERFIL"
            title="OPCIONES DE PERFIL"
            className="flex items-center gap-3 border-2 border-[#3b4d3e] bg-[#0d0c0b] pl-2.5 pr-3 py-2 rounded-sm hover:border-[#c27c2f] transition-colors cursor-pointer"
          >
            <div className="relative h-11 w-11 bg-black border-2 border-[#c27c2f] flex items-center justify-center">
              <div className="absolute inset-0 bg-[#c27c2f]/20 animate-pulse" />
              <span className="font-black text-[#c27c2f] text-2xl font-typewriter z-10">
                {initial}
              </span>
              <div
                className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full"
                title="ESTADO: EN LÍNEA"
              />
            </div>
            <div className="hidden md:block text-left leading-none">
              <div className="text-[11px] text-[#c27c2f] font-bold tracking-widest uppercase">
                ID-AUTH: VALIDADO
              </div>
              <div className="font-black text-base text-[#e0d8cc] uppercase tracking-wider mt-1">
                {name}
              </div>
              <span className="inline-block bg-[#3b4d3e] text-white text-[10px] font-bold px-2 py-0.5 mt-1.5 uppercase tracking-widest">
                ADMINISTRADOR
              </span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-zinc-400 transition-transform duration-200 ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-64 bg-[#121110] border-2 border-black shadow-[4px_4px_0px_#000000] z-50 font-mono"
            >
              <div className="px-4 py-3 border-b-2 border-black bg-[#0d0c0b]">
                <div className="text-[10px] text-[#c27c2f] font-bold tracking-widest uppercase mb-1">
                  RANGO
                </div>
                <div className="font-black text-base text-[#e0d8cc] uppercase tracking-widest mb-2">
                  ADMINISTRADOR
                </div>
                <span className="inline-block bg-[#3b4d3e] text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-widest">
                  {name}
                </span>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  navigate("/admin/profile")
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-[#e0d8cc] hover:bg-[#c27c2f] hover:text-black uppercase text-sm font-bold tracking-widest transition-colors cursor-pointer border-b border-black/60"
              >
                <UserCircle className="w-5 h-5 shrink-0" /> VER PERFIL
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  onLogout()
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-red-400 hover:bg-red-900/60 hover:text-white uppercase text-sm font-bold tracking-widest transition-colors cursor-pointer"
              >
                <LogOut className="w-5 h-5 shrink-0" /> CERRAR SESIÓN
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── NAV STRIP: botones grandes estilo expediente ── */}
      <nav className="flex items-center gap-2.5 overflow-x-auto scrollbar-none px-3 md:px-6 py-3">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `group shrink-0 flex items-center gap-2.5 uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-[#c27c2f] text-black"
                    : "bg-[#9a9080] text-black hover:bg-[#b3a994] hover:-translate-y-0.5 active:translate-y-0.5"
                }`
              }
              style={{
                border: "2px solid #000000",
                boxShadow: "3px 3px 0px #000000",
                padding: "10px 16px",
                borderRadius: "6px",
              }}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-sm font-extrabold whitespace-nowrap">{tab.name}</span>
            </NavLink>
          )
        })}
      </nav>
    </header>
  )
}

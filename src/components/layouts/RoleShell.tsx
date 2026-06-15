import { ChevronDown, LogOut, UserCircle, X } from "lucide-react"
import { lazy, Suspense, useEffect, useRef, useState } from "react"

import type { ComponentType, ReactNode } from "react"

// El campamento 3D vive como FONDO permanente de cada panel de rol: se carga una
// vez (chunk pesado de three.js diferido) y no se desmonta, así que cambiar de
// sección no lo recarga. Las secciones se abren como ventanas encima.
const CampScene3DWrapper = lazy(() => import("@/features/camp-3d/components/CampScene3DWrapper"))

export interface RoleNavItem {
  key: string
  label: string
  icon: ComponentType<{ className?: string }>
}

interface RoleShellProps {
  brandTitle: string
  brandSubtitle: string
  /** Color del punto que parpadea junto a la marca. */
  pingColor?: string
  navItems: RoleNavItem[]
  /** Clave de la sección activa (vacía/"camp" => sólo campamento, sin ventana). */
  activeKey: string
  onSelect: (key: string) => void
  /** Título de la ventana de la sección activa. */
  windowTitle: string
  /** Si true, se muestra la ventana de sección encima del campamento. */
  showWindow: boolean
  onCloseWindow: () => void
  campId: string
  userInitial: string
  userName: string
  roleLabel: string
  onLogout: () => void
  onViewProfile: () => void
  utcTime: string
  /** Mapea el clic en un edificio 3D a una sección (para layouts por pestañas). */
  onBuildingSelect?: (buildingId: string) => void
  /** Contenido de la sección activa (se renderiza dentro de la ventana). */
  children: ReactNode
  /** Nodos extra fijados al shell (banners, modales globales, etc.). */
  extras?: ReactNode
}

export default function RoleShell({
  brandTitle,
  brandSubtitle,
  pingColor = "#9c2720",
  navItems,
  activeKey,
  onSelect,
  windowTitle,
  showWindow,
  onCloseWindow,
  campId,
  userInitial,
  userName,
  roleLabel,
  onLogout,
  onViewProfile,
  utcTime,
  onBuildingSelect,
  children,
  extras,
}: RoleShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
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

  return (
    <div className="h-screen max-h-screen bg-[#0d0c0b] text-[#e0d8cc] relative overflow-hidden font-mono flex flex-col">
      {/* SCANLINE OVERLAY */}
      <div
        className="absolute inset-0 pointer-events-none z-50 opacity-[0.035]"
        style={{
          background:
            "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
          backgroundSize: "100% 2px, 3px 100%",
        }}
      />

      {/* ── NAVBAR ── */}
      <header className="relative z-40 shrink-0 bg-[#121110] border-b-2 border-black font-mono select-none shadow-md">
        {/* TOP STRIP */}
        <div className="flex items-center gap-3 md:gap-5 px-3 md:px-6 py-2.5 border-b border-black/60">
          <div className="flex items-center gap-3 shrink-0">
            <span
              className="text-xl md:text-2xl animate-pulse font-bold leading-none"
              style={{ color: pingColor }}
            >
              ★
            </span>
            <div className="leading-none">
              <div className="text-base md:text-lg font-black text-[#df8120] tracking-widest uppercase">
                {brandTitle}
              </div>
              <div className="text-[11px] text-zinc-500 tracking-[0.2em] font-extrabold uppercase mt-1">
                {brandSubtitle}
              </div>
            </div>
          </div>

          <div className="flex-1" />

          <span className="hidden xl:inline text-sm tracking-widest text-zinc-300 font-bold whitespace-nowrap">
            {utcTime}
          </span>

          {/* AVATAR MENU */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="OPCIONES DE PERFIL"
              title="OPCIONES DE PERFIL"
              className="flex items-center gap-3 border-2 border-[#3b4d3e] bg-[#0d0c0b] pl-2.5 pr-3 py-2 rounded-sm hover:border-[#c27c2f] transition-colors cursor-pointer"
            >
              <div className="relative h-11 w-11 bg-black border-2 border-[#c27c2f] flex items-center justify-center">
                <div className="absolute inset-0 bg-[#c27c2f]/20 animate-pulse" />
                <span className="font-black text-[#c27c2f] text-2xl font-typewriter z-10">
                  {userInitial}
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
                  {userName}
                </div>
                <span className="inline-block bg-[#3b4d3e] text-white text-[10px] font-bold px-2 py-0.5 mt-1.5 uppercase tracking-widest">
                  {roleLabel}
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
                    {roleLabel}
                  </div>
                  <span className="inline-block bg-[#3b4d3e] text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-widest">
                    {userName}
                  </span>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    onViewProfile()
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

        {/* NAV STRIP */}
        <nav className="flex items-center gap-2.5 overflow-x-auto scrollbar-none px-3 md:px-6 py-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.key === activeKey
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelect(item.key)}
                className={`group shrink-0 flex items-center gap-2.5 uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-[#c27c2f] text-black"
                    : "bg-[#9a9080] text-black hover:bg-[#b3a994] hover:-translate-y-0.5 active:translate-y-0.5"
                }`}
                style={{
                  border: "2px solid #000000",
                  boxShadow: "3px 3px 0px #000000",
                  padding: "10px 16px",
                  borderRadius: "6px",
                }}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-extrabold whitespace-nowrap">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </header>

      {/* ── CONTENT STAGE ── */}
      <div className="relative z-10 flex-1 min-h-0 overflow-hidden bg-[#0d0c0b]">
        {/* Fondo: campamento 3D (montado una sola vez, persistente) */}
        <div className="absolute inset-0 z-0 bg-[#040804]">
          {campId ? (
            <Suspense fallback={null}>
              <CampScene3DWrapper
                key={campId}
                campId={campId}
                embedded
                onBuildingSelect={onBuildingSelect}
                onClose={onCloseWindow}
              />
            </Suspense>
          ) : null}
        </div>

        {/* Ventana de la sección activa */}
        <div
          className="absolute inset-0 z-30 flex items-stretch justify-center bg-black/70 backdrop-blur-[2px] md:p-6"
          style={{ display: showWindow ? "flex" : "none" }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onCloseWindow()
          }}
        >
          <div className="relative flex flex-col w-full h-full md:max-w-6xl bg-[#0d0c0b] border-2 border-black shadow-[6px_6px_0px_#000000] overflow-hidden">
            <div className="shrink-0 flex items-center justify-between bg-[#121110] border-b-2 border-black px-4 py-2.5 select-none">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ background: pingColor }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-2.5 w-2.5"
                    style={{ background: pingColor }}
                  />
                </span>
                <span className="text-sm font-black text-[#df8120] uppercase tracking-widest truncate">
                  {windowTitle}
                </span>
              </div>
              <button
                type="button"
                onClick={onCloseWindow}
                title="CERRAR VENTANA"
                className="flex items-center gap-2 px-3 py-1.5 border-2 border-black bg-[#9a9080] text-black hover:bg-red-700 hover:text-white transition-colors uppercase text-[11px] font-extrabold tracking-widest cursor-pointer"
              >
                <X className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">CERRAR</span>
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">{showWindow ? children : null}</div>
          </div>
        </div>
      </div>

      {extras}
    </div>
  )
}

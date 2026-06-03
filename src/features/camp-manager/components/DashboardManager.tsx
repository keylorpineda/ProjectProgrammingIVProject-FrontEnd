/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { AnimatePresence } from "framer-motion"
import { Terminal, Database, Radio, Users, Truck, LogOut } from "lucide-react"
import { type ComponentType, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import ManagerInventory from "./ManagerInventory"
import ManagerLogistics from "./ManagerLogistics"
import ManagerOverview from "./ManagerOverview"
import ManagerWorkforce from "./ManagerWorkforce"
import { useAuthStore } from "../store/useAuthStore"

import InactivityGuard from "@/components/ui/InactivityGuard"

type TabID = "overview" | "inventory" | "workforce" | "logistics"

export default function DashboardManager() {
  const user = useAuthStore((state) => state.user)
  const setCampId = useAuthStore((state) => state.setCampId)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const campId = user?.campId


  const [activeTab, setActiveTab] = useState<TabID>(
    user?.role?.toLowerCase() === "resource_manager" ? "inventory" : "overview",
  )
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)

  useEffect(() => {
    if (user?.role?.toLowerCase() === "resource_manager" && activeTab !== "inventory") {
      setActiveTab("inventory")
    }
  }, [user?.role, activeTab])

  // Helper to force-refresh all sub-components by incrementing key
  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

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

  // ⚠️ MANDATORY RULE: If campId is null, show terminal static loader
  if (!campId || !user) {
    return (
      <div className="min-h-screen bg-[#0d0c0b] flex items-center justify-center p-4 font-mono select-none">
        <div className="w-full max-w-lg border-2 border-dashed border-[#9c2720] bg-[#121110] p-8 rounded text-[#e0d8cc] space-y-6 relative overflow-hidden">
          {/* Scanline Overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-black/30 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,_6px_100%]" />

          <div className="flex flex-col items-center text-center space-y-4">
            <Radio className="h-14 w-14 text-[#9c2720] animate-ping" />
            <div className="space-y-1.5">
              <h2 className="text-lg font-black uppercase tracking-widest text-[#9c2720]">
                SEÑAL INTERRUMPIDA
              </h2>
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-extrabold flex items-center justify-center gap-1">
                <span>RECONOCIMIENTO DE TERMINAL: DESCIFRADO_FASE_2</span>
              </div>
            </div>
          </div>

          <div className="border-2 border-black bg-black/55 p-4 rounded text-xs select-all text-center uppercase tracking-wide text-zinc-400 space-y-1">
            <span className="font-bold text-[#9c2720] block animate-pulse">
              Esperando Señal del Campamento...
            </span>
            <p className="text-sm text-zinc-600 mt-1">
              Ningún campamento asignado al certificado de sesión actual. Establezca un vector de
              enlace orbital para decodificar los registros de la bodega.
            </p>
          </div>

          {/* DEVELOPER BEZEL TO DEMO LOGINS */}
          <div className="border-2 border-black bg-[#121110] p-4 rounded text-center space-y-3">
            <span className="text-sm text-zinc-500 font-bold block uppercase tracking-wider">
              Debug Panel: Fuerza de Enlace
            </span>
            <button
              type="button"
              onClick={() => setCampId("Bunker-04")}
              className="w-full border-2 border-[#c27c2f] text-[#c27c2f] py-1.5 uppercase text-xs font-bold hover:bg-[#c27c2f] hover:text-black transition"
            >
              🔄 CONECTAR SENDER A BUNKER-04
            </button>
          </div>
        </div>
      </div>
    )
  }

  const tabList: { id: TabID; label: string; icon: ComponentType<any> }[] = [
    { id: "overview", label: "Balance", icon: Database },
    { id: "inventory", label: "Bodega", icon: Terminal },
    { id: "workforce", label: "Personal", icon: Users },
    { id: "logistics", label: "Traslados", icon: Truck },
  ]

  const allowedTabs =
    user?.role?.toLowerCase() === "resource_manager"
      ? tabList.filter((t) => t.id === "inventory")
      : tabList

  return (
    <InactivityGuard
      isAuthenticated={!!user}
      onLogout={() => {
        logout()
        navigate("/login")
      }}
    >
      <div className="h-screen max-h-screen bg-[#0d0c0b] text-[#e0d8cc] relative overflow-hidden font-mono flex flex-col">
        {/* SCANLINE OVERLAY */}
        <div
          className="absolute inset-0 pointer-events-none z-50 opacity-[0.035]"
          style={{
            background:
              "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
            backgroundSize: "100% 2px, 3px 100%",
          }}
        ></div>

        {/* SIDEBAR OR CONTENT SHELL CONTAINER */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* DOOMSDAY STYLE LEFT SIDEBAR - RESPONSIVE */}
          <aside className="w-full md:w-72 bg-[#121110] border-b-2 md:border-b-0 md:border-r-2 border-black p-4 flex flex-col justify-between shrink-0 z-20 select-none font-mono">
            <div>
              {/* BRAND HEADER & SKULL LOGO */}
              {/* ==========================================
                1. BRAND HEADER & SYSTEM SKULL HEADER
                ========================================== */}
              <div className="mb-6 pb-4 border-b-2 border-black">
                <div className="flex items-center gap-4">
                  <span className="text-[#9c2720] text-xl animate-pulse font-bold">☠</span>
                  <span className="text-lg font-black text-[#df8120] tracking-widest uppercase">
                    DOOMSDAY
                  </span>
                </div>
                <p className="text-sm text-zinc-500 tracking-wider font-extrabold uppercase mt-0.5 pl-0.5">
                  REGISTRO DE REFUGIO
                </p>
              </div>

              {/* ==========================================
                2. RETRO NAVIGATION MENU
                ========================================== */}
              <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none shrink-0 font-mono">
                {allowedTabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id

                  return (
                    <button
                      key={tab.id}
                      id={`nav-tab-${tab.id}`}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className="w-full text-left relative flex items-center justify-center md:justify-start gap-3 md:gap-4 py-4 px-4 md:px-5 rounded-xl transition-all duration-150 group border cursor-pointer shrink-0 hover:translate-x-1 active:translate-y-0.5 min-w-[140px] md:min-w-0 mx-1 md:mx-0"
                      style={{
                        backgroundColor: isActive ? "#c27c2f" : "#9a9080",
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
                        {tab.label.toUpperCase()}
                      </span>

                      {tab.id === "inventory" && (
                        <span
                          className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-sm md:text-xs font-mono px-1.5 md:px-2 py-0.5 rounded animate-pulse uppercase font-extrabold"
                          style={{
                            backgroundColor: "#9c2720",
                            color: "#ffffff",
                            border: "1px solid #000000",
                          }}
                        >
                          ALERTA
                        </span>
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* ==========================================
                3. ENCRYPTION & COORDINATES OVERLAY
                ========================================== */}

            {/* SIDEBAR METADATA FOOTER PANEL */}
            <div className="mt-6 border border-dashed border-[#df8120]/40 p-3.5 bg-black/40 text-left rounded-lg hidden md:block">
              <div className="text-xs text-[#df8120] font-extrabold uppercase tracking-wider mb-2">
                COORDENADAS DE ENLACE:
              </div>
              <div className="space-y-1 text-sm font-bold">
                <div className="flex justify-between">
                  <span className="text-zinc-500 uppercase">SECTOR:</span>
                  <span className="text-[#df8120] uppercase">COSTA GRIS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 uppercase">ESTACIÓN:</span>
                  <span className="text-[#e0d8cc] underline uppercase">{campId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 uppercase">MODO:</span>
                  <span className="text-[#9c2720] uppercase font-black animate-pulse">
                    CONTENCION
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT DISPLAY CANVAS */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* THREE COLUMN DOOMSDAY TOPBAR PANEL */}
            <header className="bg-[#121110] border-b-2 border-black flex flex-col sm:flex-row justify-between items-center px-4 md:px-6 py-3 gap-4 shrink-0 font-mono select-none z-10 shadow-md">
              {/* Left Portal Badges */}
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <div className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9c2720] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#9c2720]"></span>
                </div>
                <div>
                  <h2 className="text-xs md:text-sm font-black text-[#e0d8cc] hover:text-[#df8120] transition uppercase tracking-widest">
                    DOOMSDAY CENTRAL CONTROL PORTAL
                  </h2>
                  <p className="text-sm text-zinc-500 uppercase font-bold mt-0.5">
                    SALA DE MANDOS • CAMPAMENTO {campId?.toUpperCase()} [ID: #04]
                  </p>
                </div>
              </div>

              {/* Center survival rating / Clock */}
              <div className="hidden lg:flex items-center gap-8 text-center px-6">
                <div>
                  <div className="text-sm text-zinc-500 uppercase font-black tracking-widest">
                    SCORE DE SUPERVIVENCIA
                  </div>
                  <div className="text-sm font-black text-amber-500 tracking-wider">880 PTS</div>
                </div>
                <div className="border-l-2 border-black h-6"></div>
                <div className="flex items-center gap-2 text-left text-sm">
                  <span className="text-[#df8120]">⚡</span>
                  <span className="tracking-widest text-zinc-300 font-bold font-mono">
                    {utcTime}
                  </span>
                </div>
              </div>

              <div className="flex items-center self-end sm:self-center border-2 border-[#3b4d3e] bg-[#0d0c0b] p-3 rounded-sm">
                <div className="flex items-center gap-5 px-4">
                  {/* ID Avatar Block */}
                  <div className="relative h-14 w-14 bg-black border-2 border-[#c27c2f] flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#c27c2f]/20 animate-pulse" />
                    <span className="font-black text-[#c27c2f] text-2xl font-typewriter z-10">
                      {user.name[0]?.toUpperCase() || "M"}
                    </span>
                    {/* Micro decor */}
                    <div
                      className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full"
                      title="ESTADO: EN LÍNEA"
                    />
                  </div>

                  {/* ID Info Block */}
                  <div className="text-left font-mono">
                    <div className="text-xs text-[#c27c2f] font-bold tracking-widest uppercase mb-1">
                      ID-AUTH: VALIDADO
                    </div>
                    <div className="font-black text-lg text-[#e0d8cc] uppercase tracking-widest leading-none mb-2">
                      {user.name.toUpperCase()}
                    </div>
                    <span className="inline-block bg-[#3b4d3e] text-white text-xs font-bold px-2 py-1 uppercase tracking-widest">
                      RANGO: {user.role === "admin" ? "ADMINISTRADOR" : "GESTOR DE RECURSOS"}
                    </span>
                  </div>
                </div>

                {/* Action Divider & Button */}
                <div className="w-px h-14 bg-[#3b4d3e] mx-4" />
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    navigate("/login")
                  }}
                  className="h-14 px-6 bg-transparent hover:bg-accent-critical border border-transparent hover:border-accent-critical text-accent-critical hover:text-white transition-all uppercase flex items-center justify-center gap-3 cursor-pointer hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] rounded-sm"
                  title="CERRAR SESIÓN"
                >
                  <LogOut className="h-6 w-6 shrink-0" />
                  <span className="text-sm font-bold tracking-widest whitespace-nowrap">
                    CERRAR SESIÓN
                  </span>
                </button>
              </div>
            </header>

            {/* MAIN PAGE ROUTE INJECTION ADAPTER */}
            <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-[#0d0c0b] space-y-6 relative">
              {/* VIEW TITLE BAR WITH BENTO STATS ADAPTER */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-5 border-b-2 border-black font-mono">
                <div>
                  <h3 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-[#df8120]">
                    {activeTab === "overview" && "ESTACIÓN CENTRAL DE TABLERO DE COMBATE"}
                    {activeTab === "inventory" && "BODEGA CENTRAL DE SUMINISTROS"}
                    {activeTab === "workforce" && "ADMINISTRACIÓN DE PERSONAL Y RECURSOS"}
                    {activeTab === "logistics" && "CONTROL DE TRASLADOS DE CONVOY"}
                  </h3>
                  <p className="text-base md:text-lg text-zinc-500 uppercase mt-3 tracking-wider font-extrabold">
                    {activeTab === "overview" &&
                      "SINOPSIS METADATA • REPORTES OPERATIVOS ACTOS DEL SECTOR GRIS"}
                    {activeTab === "inventory" &&
                      "CONSOLIDACIÓN DE RESERVAS DE BODEGAS Y PARÁMETROS CRÍTICOS"}
                    {activeTab === "workforce" &&
                      "CENSO MULTIDISPENSARIO • DISTRIBUCIÓN DE HABILIDADES TÉCNICAS"}
                    {activeTab === "logistics" && "GESTIÓN OPERATIVA DE TRASLADOS"}
                  </p>
                </div>
                <div className="hidden sm:block">
                  <div className="border-2 border-black bg-[#121110] font-mono px-4 py-3 text-base md:text-lg text-[#e0d8cc] select-none uppercase font-black tracking-widest shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                    {activeTab === "overview" && "CONTROL MILITAR ACTIVO"}
                    {activeTab === "inventory" && "PROTOCOLO DE SEGURIDAD ON"}
                    {activeTab === "workforce" && "MONITOR CLÍNICO ONLINE"}
                    {activeTab === "logistics" && "SATELLITE LINK ACTIVE"}
                  </div>
                </div>
              </div>

              {/* NESTED DYNAMIC MODULE RENDER PANEL */}
              <div className="min-h-[450px]">
                <AnimatePresence mode="wait">
                  {activeTab === "overview" && (
                    <div key="overview">
                      <ManagerOverview campId={campId} refreshTrigger={refreshTrigger} />
                    </div>
                  )}
                  {activeTab === "inventory" && (
                    <div key="inventory">
                      <ManagerInventory
                        campId={campId}
                        onDataChanged={triggerRefresh}
                        refreshTrigger={refreshTrigger}
                      />
                    </div>
                  )}
                  {activeTab === "workforce" && (
                    <div key="workforce">
                      <ManagerWorkforce
                        campId={campId}
                        onDataChanged={triggerRefresh}
                        refreshTrigger={refreshTrigger}
                      />
                    </div>
                  )}
                  {activeTab === "logistics" && (
                    <div key="logistics">
                      <ManagerLogistics
                        campId={campId}
                        onDataChanged={triggerRefresh}
                        refreshTrigger={refreshTrigger}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </main>
          </div>
        </div>
      </div>
    </InactivityGuard>
  )
}

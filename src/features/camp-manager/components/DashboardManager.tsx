/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Terminal, Database, Radio, Users, Truck, BookOpen, Trophy, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import ManagerCatalog from "./ManagerCatalog"
import ManagerInventory from "./ManagerInventory"
import ManagerLogistics from "./ManagerLogistics"
import ManagerOverview from "./ManagerOverview"
import ManagerRanking from "./ManagerRanking"
import ManagerWorkforce from "./ManagerWorkforce"
import { useAuthStore } from "../store/useAuthStore"

import RoleShell, { type RoleNavItem } from "@/components/layouts/RoleShell"
import AlertsBanner from "@/components/ui/AlertsBanner"
import InactivityGuard from "@/components/ui/InactivityGuard"
import { useAlertSocket } from "@/hooks/useAlertSocket"
import { useAuthStore as useGlobalAuthStore } from "@/store/useAuthStore"

const NAV_ITEMS: RoleNavItem[] = [
  { key: "overview", label: "BALANCE", icon: Database },
  { key: "inventory", label: "BODEGA", icon: Terminal },
  { key: "catalog", label: "CATÁLOGO", icon: BookOpen },
  { key: "ranking", label: "RANKING", icon: Trophy },
  { key: "workforce", label: "PERSONAL", icon: Users },
  { key: "logistics", label: "TRASLADOS", icon: Truck },
]

const TITLES: Record<string, string> = {
  overview: "TABLERO DE COMBATE",
  inventory: "BODEGA CENTRAL",
  catalog: "CATÁLOGO DE RECURSOS",
  ranking: "RANKING DE PRODUCTIVIDAD",
  workforce: "ADMINISTRACIÓN DE PERSONAL",
  logistics: "CONTROL DE TRASLADOS",
}

// Clic en un edificio 3D → pestaña del gestor de recursos.
const BUILDING_TO_TAB: Record<string, string> = {
  hq: "overview",
  gate: "catalog",
  barracks: "workforce",
  watchtower: "ranking",
  warehouse: "inventory",
  garage: "logistics",
  profile: "overview",
}

export default function DashboardManager() {
  const user = useAuthStore((state) => state.user)
  const setCampId = useAuthStore((state) => state.setCampId)
  const loginLocal = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const globalUser = useGlobalAuthStore((state) => state.user)
  // Use real camp_id from the JWT-authenticated global store; fall back to local store
  const campId = globalUser ? globalUser.camp_id : user?.campId
  useAlertSocket(String(campId ?? ""))

  // Sync local store from global user when local is null (e.g. after logout + re-login)
  useEffect(() => {
    if (!user && globalUser) {
      loginLocal({
        id: String(globalUser.id),
        name: globalUser.username || globalUser.email || "Commander",
        email: globalUser.email || "",
        role: "camp_leader",
        campId: globalUser.camp_id ? String(globalUser.camp_id) : null,
      })
    }
  }, [user, globalUser, loginLocal])

  const [activeTab, setActiveTab] = useState<string>("camp")
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
  const [showLogisticsModal, setShowLogisticsModal] = useState<boolean>(false)
  const showWindow = activeTab !== "camp"

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

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <InactivityGuard isAuthenticated={!!user} onLogout={handleLogout}>
      <RoleShell
        brandTitle="DOOMSDAY"
        brandSubtitle="REGISTRO DE REFUGIO"
        navItems={NAV_ITEMS}
        activeKey={activeTab}
        onSelect={setActiveTab}
        windowTitle={TITLES[activeTab] ?? "PANEL"}
        showWindow={showWindow}
        onCloseWindow={() => setActiveTab("camp")}
        campId={String(campId ?? "")}
        userInitial={user.name?.[0]?.toUpperCase() || "M"}
        userName={user.name?.toUpperCase() || "GESTOR"}
        roleLabel="GESTOR DE RECURSOS"
        onLogout={handleLogout}
        onViewProfile={() => setActiveTab("overview")}
        utcTime={utcTime}
        onBuildingSelect={(id) => setActiveTab(BUILDING_TO_TAB[id] ?? "overview")}
        extras={<AlertsBanner campId={campId ?? ""} />}
      >
        <main
          className="px-6 py-6 md:px-10 md:py-8 space-y-6"
          style={{
            minHeight: "100%",
            backgroundColor: "#2b2218",
            backgroundImage:
              "radial-gradient(#1a1209 18%, transparent 19%), radial-gradient(#1a1209 18%, transparent 19%)",
            backgroundSize: "9px 9px",
            backgroundPosition: "0 0, 4.5px 4.5px",
            boxShadow: "inset 0 0 120px rgba(0,0,0,0.6)",
          }}
        >
          {activeTab === "logistics" && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowLogisticsModal(true)}
                className="border-2 border-[#c27c2f] bg-[#c27c2f] hover:bg-[#df9a45] text-white font-black uppercase text-sm px-5 py-3 transition-all flex items-center gap-2 shadow-lg"
              >
                <Plus className="h-4 w-4" /> PEDIR REFUERZO
              </button>
            </div>
          )}
          <div className="min-h-[450px]">
            {activeTab === "overview" && (
              <ManagerOverview campId={campId} refreshTrigger={refreshTrigger} />
            )}
            {activeTab === "inventory" && (
              <ManagerInventory
                campId={campId}
                onDataChanged={triggerRefresh}
                refreshTrigger={refreshTrigger}
              />
            )}
            {activeTab === "catalog" && (
              <ManagerCatalog campId={campId} onDataChanged={triggerRefresh} />
            )}
            {activeTab === "ranking" && (
              <ManagerRanking campId={campId} refreshTrigger={refreshTrigger} />
            )}
            {activeTab === "workforce" && (
              <ManagerWorkforce
                campId={campId}
                onDataChanged={triggerRefresh}
                refreshTrigger={refreshTrigger}
              />
            )}
            {activeTab === "logistics" && (
              <ManagerLogistics
                campId={campId}
                onDataChanged={triggerRefresh}
                refreshTrigger={refreshTrigger}
                showModal={showLogisticsModal}
                onModalClose={() => setShowLogisticsModal(false)}
              />
            )}
          </div>
        </main>
      </RoleShell>
    </InactivityGuard>
  )
}

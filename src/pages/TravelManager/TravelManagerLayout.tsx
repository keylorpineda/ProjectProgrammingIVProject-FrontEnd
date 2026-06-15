import { LayoutDashboard, Compass, Users, ArrowLeftRight, Package } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"

import RoleShell, { type RoleNavItem } from "@/components/layouts/RoleShell"
import AlertsBanner from "@/components/ui/AlertsBanner"
import InactivityGuard from "@/components/ui/InactivityGuard"
import { useAlertSocket } from "@/hooks/useAlertSocket"
import { useAuthStore } from "@/store/useAuthStore"
import "./TravelManagerViews.css"

const NAV_ITEMS: RoleNavItem[] = [
  { key: "dashboard", label: "TABLERO", icon: LayoutDashboard },
  { key: "expeditions", label: "EXPEDICIONES", icon: Compass },
  { key: "personnel", label: "EQUIPO", icon: Users },
  { key: "transfers", label: "TRASLADOS", icon: ArrowLeftRight },
  { key: "inventory", label: "RECURSOS", icon: Package },
]

const TITLES: Record<string, string> = {
  dashboard: "TABLERO",
  expeditions: "EXPEDICIONES",
  personnel: "EQUIPO",
  transfers: "TRASLADOS",
  inventory: "RECURSOS",
  profile: "PERFIL",
}

export default function TravelManagerLayout() {
  const { user, logout } = useAuthStore()
  const campId = String(user?.camp_id ?? "")
  useAlertSocket(campId)
  const navigate = useNavigate()
  const location = useLocation()

  const activeKey = useMemo(
    () => location.pathname.split("/").filter(Boolean).pop() ?? "camp",
    [location.pathname],
  )
  const showWindow = activeKey !== "camp"

  const [utcTime, setUtcTime] = useState("")
  useEffect(() => {
    const update = () =>
      setUtcTime(new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC")
    update()
    const i = setInterval(update, 1000)
    return () => clearInterval(i)
  }, [])

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <InactivityGuard isAuthenticated={!!user} onLogout={handleLogout}>
      <RoleShell
        brandTitle="GESTIÓN VIAJES"
        brandSubtitle={`BASE :: ${user?.camp_id || "N/A"}`}
        pingColor="#df8120"
        navItems={NAV_ITEMS}
        activeKey={activeKey}
        onSelect={(key) => navigate(`/travel-manager/${key}`)}
        windowTitle={TITLES[activeKey] ?? "PANEL"}
        showWindow={showWindow}
        onCloseWindow={() => navigate("/travel-manager/camp")}
        campId={campId}
        userInitial={user?.username?.[0]?.toUpperCase() || user?.id?.[0]?.toUpperCase() || "T"}
        userName={user?.username?.toUpperCase() || user?.id?.toUpperCase() || "TRAVEL MGR"}
        roleLabel="GESTOR DE VIAJES"
        onLogout={handleLogout}
        onViewProfile={() => navigate("/travel-manager/profile")}
        utcTime={utcTime}
        extras={<AlertsBanner campId={campId} />}
      >
        <div className="p-0" style={{ minHeight: "100%" }}>
          <Outlet />
        </div>
      </RoleShell>
    </InactivityGuard>
  )
}

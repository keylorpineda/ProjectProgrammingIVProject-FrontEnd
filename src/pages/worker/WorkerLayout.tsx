import { LayoutDashboard, Briefcase, Compass, Package } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom"

import WorkerDashboard from "./WorkerDashboard"
import WorkerExpeditions from "./WorkerExpeditions"
import WorkerProfessions from "./WorkerProfessions"
import WorkerProfile from "./WorkerProfile"
import WorkerResources from "./WorkerResources"

import RoleShell, { type RoleNavItem } from "@/components/layouts/RoleShell"
import AlertsBanner from "@/components/ui/AlertsBanner"
import FirstLoginAchievement from "@/components/ui/FirstLoginAchievement"
import InactivityGuard from "@/components/ui/InactivityGuard"
import { useCamp } from "@/features/worker/hooks/useWorkerAPI"
import { useAlertSocket } from "@/hooks/useAlertSocket"
import { useAuth } from "@/pages/Admin/context/AuthContext"
import "./worker.css"

const NAV_ITEMS: RoleNavItem[] = [
  { key: "dashboard", label: "TABLERO", icon: LayoutDashboard },
  { key: "professions", label: "OCUPACIONES", icon: Briefcase },
  { key: "expeditions", label: "EXPEDICIONES", icon: Compass },
  { key: "resources", label: "ALMACÉN", icon: Package },
]

const TITLES: Record<string, string> = {
  dashboard: "TABLERO",
  profile: "MI EXPEDIENTE",
  professions: "OCUPACIONES",
  resources: "ALMACÉN",
  expeditions: "EXPEDICIONES",
}

export default function WorkerLayout() {
  const { user, logout } = useAuth()
  const campId = String(user?.camp_id ?? "")
  useAlertSocket(campId)
  const navigate = useNavigate()
  const location = useLocation()

  const { data: campData } = useCamp(user?.camp_id)
  const campName = campData?.camp?.name ?? (user?.camp_id ? `#${user.camp_id}` : "BASE")

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

  const handleLogout = () => void logout().finally(() => navigate("/login"))

  return (
    <InactivityGuard isAuthenticated={!!user} onLogout={handleLogout}>
      <RoleShell
        brandTitle="OPERARIO"
        brandSubtitle={`BASE :: ${campName}`}
        navItems={NAV_ITEMS}
        activeKey={activeKey}
        onSelect={(key) => navigate(`/worker/${key}`)}
        windowTitle={TITLES[activeKey] ?? "PANEL"}
        showWindow={showWindow}
        onCloseWindow={() => navigate("/worker/camp")}
        campId={campId}
        userInitial={user?.username?.[0]?.toUpperCase() || user?.id?.[0]?.toUpperCase() || "O"}
        userName={user?.username?.toUpperCase() || user?.id?.toUpperCase() || "OPERARIO"}
        roleLabel="OPERARIO"
        onLogout={handleLogout}
        onViewProfile={() => navigate("/worker/profile")}
        utcTime={utcTime}
        extras={
          <>
            {user ? <FirstLoginAchievement userId={user.id} userName={user.username} /> : null}
            <AlertsBanner campId={campId} />
          </>
        }
      >
        <div className="worker-layout" style={{ background: "transparent", minHeight: "100%" }}>
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="camp" element={null} />
              <Route path="dashboard" element={<WorkerDashboard />} />
              <Route path="profile" element={<WorkerProfile />} />
              <Route path="professions" element={<WorkerProfessions />} />
              <Route path="resources" element={<WorkerResources />} />
              <Route path="expeditions" element={<WorkerExpeditions />} />
              <Route path="*" element={<Navigate to="camp" replace />} />
            </Routes>
          </div>
        </div>
      </RoleShell>
    </InactivityGuard>
  )
}

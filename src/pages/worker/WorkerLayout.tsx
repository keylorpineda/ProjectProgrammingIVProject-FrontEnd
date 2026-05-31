import { useMemo } from "react"
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom"

import WorkerDashboard from "./WorkerDashboard"
import WorkerExpeditions from "./WorkerExpeditions"
import WorkerProfessions from "./WorkerProfessions"
import WorkerProfile from "./WorkerProfile"
import WorkerResources from "./WorkerResources"

import FirstLoginAchievement from "@/components/ui/FirstLoginAchievement"
import InactivityGuard from "@/components/ui/InactivityGuard"
import WorkerSidebar from "@/components/ui/WorkerSidebar"
import WorkerTopBar from "@/components/ui/WorkerTopBar"
import { useCamp } from "@/features/worker/hooks/useWorkerAPI"
import { useAuth } from "@/pages/Admin/context/AuthContext"
import "./worker.css"

export default function WorkerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Fetch real camp data from API
  const { data: campData } = useCamp(user?.camp_id)
  const campName = campData?.camp?.name ?? (user?.camp_id ? `#${user.camp_id}` : undefined)

  const activeTab = useMemo(() => {
    const route = location.pathname.split("/").filter(Boolean).pop()
    return route || "dashboard"
  }, [location.pathname])

  const setActiveTab = (tab: string) => {
    navigate(`/worker/${tab}`)
  }

  const handleLogout = () => {
    void logout().finally(() => navigate("/login"))
  }

  return (
    <InactivityGuard
      isAuthenticated={!!user}
      onLogout={() => void logout().finally(() => navigate("/login"))}
    >
      <div className="worker-layout relative selection:bg-accent-orange selection:text-ink-black uppercase">
        <div className="vintage-scanline" />

        {/* Sidebar */}
        <WorkerSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userName={user?.username ?? user?.id}
          campName={campName}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <div className="worker-main-content">
          <WorkerTopBar campName={campName} userName={user?.username ?? user?.id} />

          <main className="worker-route-container custom-scrollbar">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="dashboard" element={<WorkerDashboard />} />
                <Route path="profile" element={<WorkerProfile />} />
                <Route path="professions" element={<WorkerProfessions />} />
                <Route path="resources" element={<WorkerResources />} />
                <Route path="expeditions" element={<WorkerExpeditions />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </div>
          </main>

          {/* First-login achievement modal */}
          {user ? <FirstLoginAchievement userId={user.id} userName={user.username} /> : null}

          <footer className="worker-footer">
            <p>GESTIÓN DEL FIN — PROTOCOLO DE SUPERVIVENCIA ACTIVO</p>
            <div className="worker-footer-status">
              <span className="worker-link-dot" />
              <span>ENLACE ESTABLECIDO</span>
              <span>TRANSMISIÓN CIFRADA</span>
            </div>
          </footer>
        </div>
      </div>
    </InactivityGuard>
  )
}

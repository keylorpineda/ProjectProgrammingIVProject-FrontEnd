import { useMemo } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/pages/Admin/context/AuthContext'
import WorkerSidebar from '@/components/ui/WorkerSidebar'
import WorkerTopBar from '@/components/ui/WorkerTopBar'
import WorkerDashboard from './WorkerDashboard'
import WorkerProfile from './WorkerProfile'
import WorkerProfessions from './WorkerProfessions'
import WorkerResources from './WorkerResources'
import './worker.css'

function WorkerTransfersPlaceholder() {
  return (
    <div className="worker-section-maintenance">
      <h2>TRASLADOS EN MANTENIMIENTO</h2>
      <p>Modulo pendiente de conexion // Terminal worker activa</p>
    </div>
  )
}

export default function WorkerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const activeTab = useMemo(() => {
    const route = location.pathname.split('/').filter(Boolean).pop()
    return route || 'profile'
  }, [location.pathname])

  const setActiveTab = (tab: string) => {
    navigate(`/worker/${tab}`)
  }

  const handleLogout = () => {
    void logout().finally(() => navigate('/login'))
  }

  return (
    <div className="worker-layout relative selection:bg-accent-orange selection:text-ink-black uppercase">
      <div className="vintage-scanline" />
      
      {/* Sidebar */}
      <WorkerSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userName={user?.id}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="worker-main-content">
        <WorkerTopBar
          campName={user?.camp_id ?? undefined}
          userName={user?.id}
        />

        <main className="worker-route-container custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="dashboard" element={<WorkerDashboard activeTab={activeTab} />} />
              <Route path="profile" element={<WorkerProfile activeTab={activeTab} />} />
              <Route path="professions" element={<WorkerProfessions activeTab={activeTab} />} />
              <Route path="resources" element={<WorkerResources activeTab={activeTab} />} />
              <Route path="transfers" element={<WorkerTransfersPlaceholder />} />
              <Route path="*" element={<Navigate to="profile" replace />} />
            </Routes>
          </div>
        </main>

        <footer className="worker-footer">
          <p>SYSTEM CAPACITY: 94% // ACTIVE NODES: 12</p>
          <div className="worker-footer-status">
            <span className="worker-link-dot" />
            <span>Local Link Established</span>
            <span>Encrypted Transmission Active</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
